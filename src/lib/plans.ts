/**
 * Planos de Assinatura
 * Definição dos planos Grátis, Pró e Premium
 */

import type { Plan } from '@/types/billing';

export const PLANS: Record<string, Plan> = {
  free: {
    id: 'free',
    name: 'Grátis',
    description: 'Para uso pessoal básico',
    price: {
      monthly: 0,
      yearly: 0,
    },
    features: [
      'Sem PJ (somente PF)',
      'Até 100 transações/mês',
      '9 categorias padrão',
      'Até 5 lançamentos recorrentes',
      'Importação de extrato CSV/OFX',
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
    name: 'Pró',
    description: 'Para profissionais e pequenas empresas',
    price: {
      monthly: 29.90,
      yearly: 299.00, // ~R$ 25/mês
    },
    stripePriceIds: {
      monthly: 'price_1T37VmKH4dVnWiIcCNCRh3R7',
      yearly: 'price_1T37VmKH4dVnWiIcAFkCHBXf',
    },
    features: [
      'Perfil PJ (Pessoa Jurídica)',
      'Transações ilimitadas',
      'Categorias customizadas ilimitadas',
      'Lançamentos recorrentes ilimitados',
      'Importação de extratos CSV/OFX ilimitada',
      'Exportar CSV, Excel e PDF',
      'Backup automático na nuvem',
      'Auto-categorização inteligente',
      'Gráficos e relatórios avançados',
      'Até 5 membros na equipe',
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
    name: 'Premium',
    description: 'Para empresas e gestão avançada',
    price: {
      monthly: 99.90,
      yearly: 999.00, // ~R$ 83/mês
    },
    stripePriceIds: {
      monthly: 'price_enterprise_monthly', // TODO: criar no Stripe Dashboard e substituir
      yearly: 'price_enterprise_yearly',   // TODO: criar no Stripe Dashboard e substituir
    },
    features: [
      'Perfil PJ (Pessoa Jurídica)',
      'Tudo do plano Pro',
      'Membros ilimitados na equipe',
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
