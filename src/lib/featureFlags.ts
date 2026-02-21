import type { FeatureEntitlements, PlanCode } from '@/types/saas';
import { runtimeConfig } from '@/config/runtime';

const planEntitlements: Record<PlanCode, FeatureEntitlements> = {
  free: {
    canImportStatement: false,
    canSyncMultiDevice: false,
    canUseAdvancedReports: false,
  },
  pro: {
    canImportStatement: true,
    canSyncMultiDevice: true,
    canUseAdvancedReports: true,
  },
  enterprise: {
    canImportStatement: true,
    canSyncMultiDevice: true,
    canUseAdvancedReports: true,
  },
};

export const getEntitlementsByPlan = (plan: PlanCode): FeatureEntitlements => {
  return planEntitlements[plan];
};

export const getDefaultEntitlements = (): FeatureEntitlements => {
  if (runtimeConfig.appMode === 'local') {
    return {
      canImportStatement: true,
      canSyncMultiDevice: false,
      canUseAdvancedReports: true,
    };
  }

  return getEntitlementsByPlan(runtimeConfig.defaultPlan);
};
