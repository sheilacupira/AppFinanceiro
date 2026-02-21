import Stripe from 'stripe';
import { env } from '../config/env.js';

let stripeClient: Stripe | null = null;

export const getStripeClient = (): Stripe | null => {
  if (!env.STRIPE_SECRET_KEY) {
    return null;
  }

  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    });
  }

  return stripeClient;
};

export const getPriceId = (planId: string, interval: 'month' | 'year'): string | null => {
  if (planId === 'pro') {
    return interval === 'month' ? (env.STRIPE_PRICE_PRO_MONTHLY ?? null) : (env.STRIPE_PRICE_PRO_YEARLY ?? null);
  }

  if (planId === 'enterprise') {
    return interval === 'month'
      ? (env.STRIPE_PRICE_ENTERPRISE_MONTHLY ?? null)
      : (env.STRIPE_PRICE_ENTERPRISE_YEARLY ?? null);
  }

  return null;
};
