import crypto from 'crypto';
import express, { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { getMPClient, getPreApproval, getPayment, getPlanConfig } from '../lib/mercadopago.js';

export const billingRouter = Router();

// ── Schemas ──────────────────────────────────────────────────────────────────

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

// ── Helpers ───────────────────────────────────────────────────────────────────

const mpStatusToBillingStatus = (status: string): string => {
  switch (status) {
    case 'authorized': return 'active';
    case 'paused':     return 'past_due';
    case 'cancelled':  return 'canceled';
    case 'pending':    return 'incomplete';
    case 'expired':    return 'incomplete_expired';
    default:           return status;
  }
};

const getUserEmail = async (userId: string, tenantId: string): Promise<string | null> => {
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId, tenantId } },
    include: { user: true },
  });
  return membership?.user.email ?? null;
};

// ── GET /status ───────────────────────────────────────────────────────────────

billingRouter.get('/status', async (_req, res) => {
  const configured = Boolean(getMPClient());
  res.json({ configured });
});

// ── POST /checkout ────────────────────────────────────────────────────────────

billingRouter.post('/checkout', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = checkoutSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const mp = getPreApproval();
  if (!mp) {
    res.status(503).json({ error: 'Mercado Pago não está configurado' });
    return;
  }

  const { planId, interval, successUrl, cancelUrl: _cancelUrl } = parsed.data;
  const planCfg = getPlanConfig(planId, interval);
  if (!planCfg) {
    res.status(400).json({ error: 'Plano não encontrado' });
    return;
  }

  const payerEmail = await getUserEmail(auth.userId, auth.tenantId);
  if (!payerEmail) {
    res.status(404).json({ error: 'Usuário não encontrado' });
    return;
  }

  const result = await mp.create({
    body: {
      reason: planCfg.reason,
      auto_recurring: {
        frequency: planCfg.frequency,
        frequency_type: planCfg.frequencyType,
        transaction_amount: planCfg.amount,
        currency_id: 'BRL',
      },
      back_url: successUrl,
      notification_url: `${env.APP_URL.replace(/\/$/, '').includes('localhost') ? 'https://appfinanceiro-production-eb56.up.railway.app' : env.APP_URL.replace(/\/$/, '')}/api/billing/webhook`,
      payer_email: payerEmail,
      external_reference: JSON.stringify({ tenantId: auth.tenantId, planId, interval }),
    },
  });

  res.json({
    sessionId: result.id,
    url: result.init_point,
  });
});

// ── GET /subscription ─────────────────────────────────────────────────────────

billingRouter.get('/subscription', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  if (!getMPClient()) { res.json(null); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.mpSubscriptionId) { res.json(null); return; }
  // Gift plans don't expose MP subscription details — show courtesy display instead
  if (tenant.billingStatus === 'gift') { res.json(null); return; }

  const mp = getPreApproval();
  if (!mp) { res.json(null); return; }

  const sub = await mp.get({ id: tenant.mpSubscriptionId });
  if (!sub) { res.json(null); return; }

  const recurring = sub.auto_recurring as {
    frequency?: number;
    frequency_type?: string;
    transaction_amount?: number;
    start_date?: string;
    end_date?: string;
  } | undefined;

  const startDate = recurring?.start_date ? new Date(recurring.start_date) : new Date(sub.date_created ?? Date.now());
  const endDate   = recurring?.end_date   ? new Date(recurring.end_date)   : new Date(Date.now() + 30 * 24 * 3600_000);

  res.json({
    id: sub.id,
    userId: auth.userId,
    planId: tenant.billingPlan,
    status: mpStatusToBillingStatus(sub.status ?? 'pending'),
    currentPeriodStart: startDate,
    currentPeriodEnd:   endDate,
    cancelAtPeriodEnd:  sub.status === 'cancelled',
    mpSubscriptionId:   sub.id,
    mpCustomerId:       tenant.mpCustomerId,
  });
});

// ── POST /subscription/cancel ─────────────────────────────────────────────────

billingRouter.post('/subscription/cancel', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = subscriptionActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const mp = getPreApproval();
  if (!mp) { res.status(503).json({ error: 'Mercado Pago não está configurado' }); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.mpSubscriptionId || tenant.mpSubscriptionId !== parsed.data.subscriptionId) {
    res.status(404).json({ error: 'Assinatura não encontrada para este tenant' });
    return;
  }

  await mp.update({ id: parsed.data.subscriptionId, body: { status: 'cancelled' } });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { billingStatus: 'canceling' },
  });

  res.status(204).end();
});

// ── POST /subscription/reactivate ─────────────────────────────────────────────

billingRouter.post('/subscription/reactivate', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = subscriptionActionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const mp = getPreApproval();
  if (!mp) { res.status(503).json({ error: 'Mercado Pago não está configurado' }); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.mpSubscriptionId || tenant.mpSubscriptionId !== parsed.data.subscriptionId) {
    res.status(404).json({ error: 'Assinatura não encontrada para este tenant' });
    return;
  }

  await mp.update({ id: parsed.data.subscriptionId, body: { status: 'authorized' } });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { billingStatus: 'active' },
  });

  res.status(204).end();
});

// ── POST /subscription/change-plan ───────────────────────────────────────────

billingRouter.post('/subscription/change-plan', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = changePlanSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const mp = getPreApproval();
  if (!mp) { res.status(503).json({ error: 'Mercado Pago não está configurado' }); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.mpSubscriptionId || tenant.mpSubscriptionId !== parsed.data.subscriptionId) {
    res.status(404).json({ error: 'Assinatura não encontrada para este tenant' });
    return;
  }

  const planCfg = getPlanConfig(parsed.data.newPlanId, parsed.data.interval);
  if (!planCfg) {
    res.status(400).json({ error: 'Plano não encontrado' });
    return;
  }

  await mp.update({
    id: parsed.data.subscriptionId,
    body: {
      reason: planCfg.reason,
      auto_recurring: {
        transaction_amount: planCfg.amount,
        currency_id: 'BRL',
      },
    },
  });

  await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: { billingPlan: parsed.data.newPlanId },
  });

  res.status(204).end();
});

// ── GET /invoices ──────────────────────────────────────────────────────────────

billingRouter.get('/invoices', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  if (!getMPClient()) { res.json([]); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });
  if (!tenant?.mpSubscriptionId) { res.json([]); return; }

  const payment = getPayment();
  if (!payment) { res.json([]); return; }

  try {
    const results = await payment.search({
      options: {
        preapproval_id: tenant.mpSubscriptionId,
        limit: 12,
      },
    });

    const payments = results.results ?? [];

    res.json(
      payments.map((p) => ({
        id: String(p.id),
        subscriptionId: tenant.mpSubscriptionId,
        amount: p.transaction_amount ?? 0,
        status: p.status ?? 'pending',
        createdAt: p.date_created ? new Date(p.date_created) : new Date(),
        paidAt: p.date_approved ? new Date(p.date_approved) : undefined,
        invoiceUrl: undefined,
        receiptUrl: undefined,
      })),
    );
  } catch {
    res.json([]);
  }
});

// ── GET /payment-methods ───────────────────────────────────────────────────────

billingRouter.get('/payment-methods', requireAuth, async (_req, res) => {
  // MP não expõe métodos de pagamento via API de assinaturas
  res.json([]);
});

// ── POST /portal ───────────────────────────────────────────────────────────────

billingRouter.post('/portal', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const tenant = await prisma.tenant.findUnique({ where: { id: auth.tenantId } });

  const url = tenant?.mpSubscriptionId
    ? `https://www.mercadopago.com.br/subscriptions`
    : env.BILLING_PORTAL_RETURN_URL;

  res.json({ url });
});

// ── POST /webhook ─────────────────────────────────────────────────────────────
// Mercado Pago POST /api/billing/webhook
// Headers: x-signature: ts=...,v1=...   x-mp-request-id: ...
// Body: { type: "preapproval", action: "...", data: { id: "..." } }

export const handleMPWebhook = async (req: express.Request, res: express.Response) => {
  if (env.MP_WEBHOOK_SECRET) {
    const xSignature = req.headers['x-signature'];
    const xRequestId = req.headers['x-mp-request-id'];
    const dataId = (req.body as Record<string, { id?: string }>)?.data?.id;

    if (xSignature && typeof xSignature === 'string' && xRequestId && dataId) {
      const parts = xSignature.split(',');
      const ts = parts.find((p) => p.startsWith('ts='))?.split('=')[1];
      const v1 = parts.find((p) => p.startsWith('v1='))?.split('=')[1];

      if (ts && v1) {
        const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
        const expected = crypto.createHmac('sha256', env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
        if (expected !== v1) {
          res.status(400).json({ error: 'Invalid webhook signature' });
          return;
        }
      }
    }
  }

  const body = req.body as { type?: string; data?: { id?: string } };
  const { type, data } = body;

  if (type === 'preapproval' && data?.id) {
    const mp = getPreApproval();
    if (mp) {
      try {
        const sub = await mp.get({ id: data.id });
        if (sub?.id) {
          let tenantId: string | null = null;
          let planId: string | null = null;

          if (sub.external_reference) {
            try {
              const ref = JSON.parse(sub.external_reference) as { tenantId?: string; planId?: string };
              tenantId = ref.tenantId ?? null;
              planId = ref.planId ?? null;
            } catch { /* ignore */ }
          }

          const billingStatus = mpStatusToBillingStatus(sub.status ?? 'pending');

          if (tenantId) {
            // Never overwrite a gift plan with a payment-flow status (e.g. pending → incomplete)
            const currentTenant = await prisma.tenant.findUnique({
              where: { id: tenantId },
              select: { billingStatus: true },
            });
            const isGift = currentTenant?.billingStatus === 'gift';

            if (!isGift) {
              await prisma.tenant.update({
                where: { id: tenantId },
                data: {
                  mpSubscriptionId: sub.id,
                  billingStatus,
                  ...(planId === 'pro' || planId === 'enterprise' ? { billingPlan: planId } : {}),
                },
              });
            } else {
              // For gift tenants, only update mpSubscriptionId; never change billingStatus
              await prisma.tenant.update({
                where: { id: tenantId },
                data: { mpSubscriptionId: sub.id },
              });
            }
          } else {
            // Only update tenants that are NOT on gift plan
            await prisma.tenant.updateMany({
              where: { mpSubscriptionId: sub.id, billingStatus: { not: 'gift' } },
              data: { billingStatus },
            });
          }
        }
      } catch { /* log silencioso */ }
    }
  }

  res.json({ received: true });
};
