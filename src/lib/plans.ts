/**
 * Planos de Assinatura
 * Definição dos planos Free, Pro e Enterprise
 */

import type { Plan } from '@/types/billing';

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Para uso pessoal básico',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Até 100 transações/mês',
      '9 categorias padrão',
      'Até 5 lançamentos recorrentes',
      'Exportar CSV',
      'Backup manual',
      'Suporte via comunidade',
    ],
    limits: {
      transactions: 100,
      categories: 9,
      recurrences: 5,
      bankConnections: 0,
      exportFormats: ['csv'],
      support: 'community',
    },
  },
  
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'Para profissionais e pequenas empresas',
    price: {
      monthly: 29.90,
      yearly: 299.00, // ~R$ 25/mês
    },
    stripePriceIds: {
      monthly: 'price_pro_monthly', // Substituir por IDs reais do Stripe
      yearly: 'price_pro_yearly',
    },
    features: [
      'Transações ilimitadas',
      'Categorias customizadas ilimitadas',
      'Lançamentos recorrentes ilimitados',
      'Até 3 contas bancárias (Open Finance)',
      'Exportar CSV, Excel e PDF',
      'Backup automático na nuvem',
      'Auto-categorização inteligente',
      'Gráficos e relatórios avançados',
      'Suporte por email',
    ],
    limits: {
      transactions: 'unlimited',
      categories: 'unlimited',
      recurrences: 'unlimited',
      bankConnections: 3,
      exportFormats: ['csv', 'xlsx', 'pdf'],
      support: 'email',
    },
    highlighted: true,
  },
  
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para empresas e gestão avançada',
    price: {
      monthly: 99.90,
      yearly: 999.00, // ~R$ 83/mês
    },
    stripePriceIds: {
      monthly: 'price_enterprise_monthly',
      yearly: 'price_enterprise_yearly',
    },
    features: [
      'Tudo do plano Pro',
      'Contas bancárias ilimitadas (Open Finance)',
      'Múltiplos usuários/organizações',
      'API de integração',
      'Webhooks personalizados',
      'Backup em tempo real',
      'Relatórios customizáveis',
      'Exportar em todos os formatos',
      'Suporte prioritário (24/7)',
      'Onboarding personalizado',
    ],
    limits: {
      transactions: 'unlimited',
      categories: 'unlimited',
      recurrences: 'unlimited',
      bankConnections: 'unlimited',
      exportFormats: ['csv', 'xlsx', 'pdf', 'json', 'xml'],
      support: 'priority',
    },
  },
};

export const TRIAL_DAYS = 14;

export function getPlan(planId: string): Plan {
  return PLANS[planId] || PLANS.free;
}

export function getAllPlans(): Plan[] {
  return Object.values(PLANS);
}

export function canAccessFeature(
  userPlan: string,
  featurePlan: string
): boolean {
  const planOrder = ['free', 'pro', 'enterprise'];
  const userIndex = planOrder.indexOf(userPlan);
  const featureIndex = planOrder.indexOf(featurePlan);
  
  return userIndex >= featureIndex;
}

export function checkLimit(
  planId: string,
  limitType: 'transactions' | 'categories' | 'recurrences' | 'bankConnections',
  currentUsage: number
): { allowed: boolean; limit: number | string; remaining: number | string } {
  const plan = getPlan(planId);
  const limit = plan.limits[limitType];
  
  if (limit === 'unlimited') {
    return { allowed: true, limit: 'unlimited', remaining: 'unlimited' };
  }
  
  if (typeof limit === 'number') {
    return {
      allowed: currentUsage < limit,
      limit,
      remaining: Math.max(0, limit - currentUsage),
    };
  }
  
  return { allowed: true, limit: 'unlimited', remaining: 'unlimited' };
}
