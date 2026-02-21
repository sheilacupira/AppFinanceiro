export type AppMode = 'local' | 'saas';
export type AppEnv = 'development' | 'staging' | 'production';

export interface RuntimeConfig {
  appMode: AppMode;
  appEnv: AppEnv;
  apiBaseUrl: string;
  authProvider: string;
  billingProvider: string;
  defaultPlan: 'free' | 'pro' | 'enterprise';
}

const getAppMode = (): AppMode => {
  const mode = import.meta.env.VITE_APP_MODE;
  return mode === 'saas' ? 'saas' : 'local';
};

const getAppEnv = (): AppEnv => {
  const env = import.meta.env.VITE_APP_ENV;
  if (env === 'staging' || env === 'production') {
    return env;
  }
  return 'development';
};

const getDefaultPlan = (): RuntimeConfig['defaultPlan'] => {
  const plan = import.meta.env.VITE_SAAS_DEFAULT_PLAN;
  if (plan === 'pro' || plan === 'enterprise') {
    return plan;
  }
  return 'free';
};

export const runtimeConfig: RuntimeConfig = {
  appMode: getAppMode(),
  appEnv: getAppEnv(),
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  authProvider: import.meta.env.VITE_AUTH_PROVIDER || '',
  billingProvider: import.meta.env.VITE_BILLING_PROVIDER || '',
  defaultPlan: getDefaultPlan(),
};

export const isSaasMode = runtimeConfig.appMode === 'saas';
