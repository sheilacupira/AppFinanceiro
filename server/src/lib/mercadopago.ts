import { MercadoPagoConfig, PreApproval, Payment } from 'mercadopago';
import { env } from '../config/env.js';

let mpClient: MercadoPagoConfig | null = null;

export const getMPClient = (): MercadoPagoConfig | null => {
  if (!env.MP_ACCESS_TOKEN) return null;
  if (!mpClient) {
    mpClient = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });
  }
  return mpClient;
};

export const getPreApproval = () => {
  const client = getMPClient();
  if (!client) return null;
  return new PreApproval(client);
};

export const getPayment = () => {
  const client = getMPClient();
  if (!client) return null;
  return new Payment(client);
};

export interface PlanConfig {
  reason: string;
  frequencyType: 'months' | 'years';
  frequency: number;
  amount: number;
}

export const getPlanConfig = (planId: string, interval: 'month' | 'year'): PlanConfig | null => {
  const plans: Record<string, Record<string, PlanConfig>> = {
    pro: {
      month: {
        reason: 'AppFinanceiro Pro — Mensal',
        frequencyType: 'months',
        frequency: 1,
        amount: env.MP_PRICE_PRO_MONTHLY,
      },
      year: {
        reason: 'AppFinanceiro Pro — Anual',
        frequencyType: 'months',
        frequency: 12,
        amount: env.MP_PRICE_PRO_YEARLY,
      },
    },
    enterprise: {
      month: {
        reason: 'AppFinanceiro Premium — Mensal',
        frequencyType: 'months',
        frequency: 1,
        amount: env.MP_PRICE_ENTERPRISE_MONTHLY,
      },
      year: {
        reason: 'AppFinanceiro Premium — Anual',
        frequencyType: 'months',
        frequency: 12,
        amount: env.MP_PRICE_ENTERPRISE_YEARLY,
      },
    },
  };

  return plans[planId]?.[interval] ?? null;
};
