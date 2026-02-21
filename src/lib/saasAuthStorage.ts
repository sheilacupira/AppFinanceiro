export interface SaasTokens {
  accessToken: string;
  refreshToken: string;
}

export const AUTH_STORAGE_KEY = 'financeiro_saas_auth';

export const loadSaasTokens = (): SaasTokens | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SaasTokens;
  } catch {
    return null;
  }
};

export const saveSaasTokens = (tokens: SaasTokens): void => {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(tokens));
};

export const clearSaasTokens = (): void => {
  localStorage.removeItem(AUTH_STORAGE_KEY);
};
