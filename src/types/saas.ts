export type PlanCode = 'free' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled';

export interface SaaSUser {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  ownerUserId: string;
  createdAt: string;
}

export interface Subscription {
  id: string;
  tenantId: string;
  plan: PlanCode;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  trialEndsAt?: string;
}

export interface FeatureEntitlements {
  canImportStatement: boolean;
  canSyncMultiDevice: boolean;
  canUseAdvancedReports: boolean;
}
