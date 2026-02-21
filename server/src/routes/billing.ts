import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { getPriceId, getStripeClient } from '../lib/stripe.js';

export const billingRouter = Router();

const checkoutSchema = z.object({
  planId: z.enum(['pro', 'enterprise']),
  interval: z.enum(['month', 'year']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

const subscriptionActionSchema = z.object({
  subscriptionId: z.string().min(5),
});

const changePlanSchema = z.object({
  subscriptionId: z.string().min(5),
  newPlanId: z.enum(['pro', 'enterprise']),
  interval: z.enum(['month', 'year']),
});

const portalSchema = z.object({
  returnUrl: z.string().url().optional(),
});

const mapStripeStatus = (status: string) => {
  if (status === 'active' || status === 'canceled' || status === 'past_due' || status === 'trialing' || status === 'incomplete' || status === 'incomplete_expired') {
    return status;
  }
  return 'active';
};

const getOrCreateCustomer = async (tenantId: string, userId: string) => {
  const stripe = getStripeClient();
  if (!stripe) {
    return { error: 'Stripe is not configured' } as const;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId,
        tenantId,
      },
    },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!membership) {
    return { error: 'Membership not found' } as const;
  }

  if (membership.tenant.stripeCustomerId) {
    const customer = await stripe.customers.retrieve(membership.tenant.stripeCustomerId);
    if (!('deleted' in customer && customer.deleted)) {
      return { stripe, customerId: customer.id } as const;
    }
  }

  const customer = await stripe.customers.create({
    email: membership.user.email,
    name: membership.user.fullName,
    metadata: {
      tenantId: membership.tenant.id,
      userId: membership.user.id,
    },
  });

  await prisma.tenant.update({
    where: { id: membership.tenant.id },
    data: { stripeCustomerId: customer.id },
  });

  return { stripe, customerId: customer.id } as const;
};

billingRouter.post('/checkout', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { planId, interval, successUrl, cancelUrl } = parsed.data;

  const priceId = getPriceId(planId, interval);
  if (!priceId) {
    res.status(400).json({ error: 'Stripe price not configured for selected plan' });
    return;
  }

  const customerResult = await getOrCreateCustomer(auth.tenantId, auth.userId);
  if ('error' in customerResult) {
    res.status(503).json({ error: customerResult.error });
    return;
  }

  const session = await customerResult.stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerResult.customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      tenantId: auth.tenantId,
      userId: auth.userId,
      planId,
      interval,
    },
  });

  res.json({
    sessionId: session.id,
    url: session.url,
  });
});

billingRouter.get('/subscription', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.json(null);
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.json(null);
    return;
  }

  const stripeSubscriptions = await stripe.subscriptions.list({
    customer: tenant.stripeCustomerId,
    status: 'all',
    limit: 10,
  });

  const subscription = stripeSubscriptions.data.find((item) => item.status !== 'incomplete_expired') ?? stripeSubscriptions.data[0];

  if (!subscription) {
    res.json(null);
    return;
  }

  const item = subscription.items.data[0];
  const currentPeriodStart = item ? new Date(item.current_period_start * 1000) : new Date(subscription.created * 1000);
  const currentPeriodEnd = item ? new Date(item.current_period_end * 1000) : new Date(subscription.created * 1000);

  res.json({
    id: subscription.id,
    userId: auth.userId,
    planId: tenant.billingPlan,
    status: mapStripeStatus(subscription.status),
    currentPeriodStart,
    currentPeriodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : undefined,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: tenant.stripeCustomerId,
  });
});

billingRouter.post('/subscription/cancel', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = subscriptionActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({ error: 'Stripe is not configured' });
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.status(404).json({ error: 'No Stripe customer found for tenant' });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(parsed.data.subscriptionId);
  if (subscription.customer !== tenant.stripeCustomerId) {
    res.status(403).json({ error: 'Subscription does not belong to tenant' });
    return;
  }

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: true,
  });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { billingStatus: 'canceling' },
  });

  res.status(204).end();
});

billingRouter.post('/subscription/reactivate', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = subscriptionActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({ error: 'Stripe is not configured' });
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.status(404).json({ error: 'No Stripe customer found for tenant' });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(parsed.data.subscriptionId);
  if (subscription.customer !== tenant.stripeCustomerId) {
    res.status(403).json({ error: 'Subscription does not belong to tenant' });
    return;
  }

  await stripe.subscriptions.update(subscription.id, {
    cancel_at_period_end: false,
  });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { billingStatus: subscription.status },
  });

  res.status(204).end();
});

billingRouter.post('/subscription/change-plan', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = changePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.status(503).json({ error: 'Stripe is not configured' });
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.status(404).json({ error: 'No Stripe customer found for tenant' });
    return;
  }

  const priceId = getPriceId(parsed.data.newPlanId, parsed.data.interval);
  if (!priceId) {
    res.status(400).json({ error: 'Stripe price not configured for target plan' });
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(parsed.data.subscriptionId);
  if (subscription.customer !== tenant.stripeCustomerId) {
    res.status(403).json({ error: 'Subscription does not belong to tenant' });
    return;
  }

  const item = subscription.items.data[0];
  if (!item) {
    res.status(400).json({ error: 'Subscription has no items' });
    return;
  }

  const updated = await stripe.subscriptions.update(subscription.id, {
    items: [{ id: item.id, price: priceId }],
    cancel_at_period_end: false,
    proration_behavior: 'create_prorations',
  });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      billingPlan: parsed.data.newPlanId,
      billingStatus: updated.status,
      stripeSubscriptionId: updated.id,
    },
  });

  res.status(204).end();
});

billingRouter.get('/invoices', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.json([]);
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.json([]);
    return;
  }

  const invoices = await stripe.invoices.list({
    customer: tenant.stripeCustomerId,
    limit: 12,
  });

  res.json(
    invoices.data.map((invoice) => ({
      id: invoice.id,
      subscriptionId:
        typeof invoice.parent?.subscription_details?.subscription === 'string'
          ? invoice.parent.subscription_details.subscription
          : invoice.parent?.subscription_details?.subscription?.id,
      amount: (invoice.amount_paid || invoice.amount_due || 0) / 100,
      status: invoice.status || 'open',
      createdAt: new Date(invoice.created * 1000),
      paidAt: invoice.status_transitions.paid_at ? new Date(invoice.status_transitions.paid_at * 1000) : undefined,
      invoiceUrl: invoice.hosted_invoice_url,
      receiptUrl: invoice.invoice_pdf,
    })),
  );
});

billingRouter.get('/payment-methods', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const stripe = getStripeClient();
  if (!stripe) {
    res.json([]);
    return;
  }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.stripeCustomerId) {
    res.json([]);
    return;
  }

  const paymentMethods = await stripe.paymentMethods.list({
    customer: tenant.stripeCustomerId,
    type: 'card',
    limit: 10,
  });

  res.json(
    paymentMethods.data.map((method) => ({
      id: method.id,
      type: 'card',
      last4: method.card?.last4,
      brand: method.card?.brand,
      expiryMonth: method.card?.exp_month,
      expiryYear: method.card?.exp_year,
      isDefault: false,
    })),
  );
});

billingRouter.post('/portal', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = portalSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const customerResult = await getOrCreateCustomer(auth.tenantId, auth.userId);
  if ('error' in customerResult) {
    res.status(503).json({ error: customerResult.error });
    return;
  }

  const session = await customerResult.stripe.billingPortal.sessions.create({
    customer: customerResult.customerId,
    return_url: parsed.data.returnUrl || env.BILLING_PORTAL_RETURN_URL,
  });

  res.json({ url: session.url });
});

export const stripeWebhookHandler = express.raw({ type: 'application/json' });

export const handleStripeWebhook = async (req: express.Request, res: express.Response) => {
  const stripe = getStripeClient();
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    res.status(503).json({ error: 'Stripe webhook is not configured' });
    return;
  }

  const signature = req.headers['stripe-signature'];
  if (!signature || Array.isArray(signature)) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    res.status(400).json({ error: 'Invalid webhook signature' });
    return;
  }

  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.created' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;

    await prisma.tenant.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        stripeSubscriptionId: subscription.id,
        billingStatus: subscription.status,
      },
    });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    if (session.mode === 'subscription') {
      const tenantId = session.metadata?.tenantId;
      const planId = session.metadata?.planId;
      if (tenantId && (planId === 'pro' || planId === 'enterprise')) {
        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            billingPlan: planId,
            stripeSubscriptionId: typeof session.subscription === 'string' ? session.subscription : null,
            billingStatus: 'active',
          },
        });
      }
    }
  }

  res.json({ received: true });
};
