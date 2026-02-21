/**
 * Billing & Subscription Types
 * Sistema de cobrança e assinaturas
 */

export type PlanId = 'free' | 'pro' | 'enterprise';

export type BillingInterval = 'month' | 'year';

export type SubscriptionStatus = 
  | 'active' 
  | 'canceled' 
  | 'past_due' 
  | 'trialing' 
  | 'incomplete'
  | 'incomplete_expired';

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  stripePriceIds?: {
    monthly: string;
    yearly: string;
  };
  features: string[];
  limits: {
    transactions: number | 'unlimited';
    categories: number | 'unlimited';
    recurrences: number | 'unlimited';
    bankConnections: number | 'unlimited';
    exportFormats: string[];
    support: 'community' | 'email' | 'priority';
  };
  highlighted?: boolean;
}

export interface Subscription {
  id: string;
  userId: string;
  planId: PlanId;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'pix';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  createdAt: Date;
  paidAt?: Date;
  invoiceUrl?: string;
  receiptUrl?: string;
}

export interface UsageStats {
  transactions: number;
  categories: number;
  recurrences: number;
  bankConnections: number;
}

export interface BillingConfig {
  stripePublishableKey?: string;
  trialDays: number;
  allowDowngrade: boolean;
  allowCancellation: boolean;
}
