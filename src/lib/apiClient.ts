import { runtimeConfig } from '@/config/runtime';

const DEFAULT_API_BASE_URL = 'http://localhost:4000';
const PRODUCTION_API_URL = 'https://appfinanceiro-production-eb56.up.railway.app';

const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = (): string => {
  // 1. Env var explícita (máxima prioridade)
  if (runtimeConfig.apiBaseUrl) {
    return normalizeBaseUrl(runtimeConfig.apiBaseUrl);
  }

  // 2. Se rodando no browser fora de localhost → produção no Railway
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return PRODUCTION_API_URL;
  }

  // 3. Desenvolvimento local
  return DEFAULT_API_BASE_URL;
};

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...restOptions } = options;
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...restOptions,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}`;
    let message = fallbackMessage;

    try {
      const errorBody = await response.json() as {
        error?: string;
        details?: {
          fieldErrors?: Record<string, string[] | undefined>;
        };
      };

      const baseError = typeof errorBody?.error === 'string' ? errorBody.error : fallbackMessage;
      const fieldErrors = errorBody?.details?.fieldErrors;

      if (baseError === 'Invalid payload' && fieldErrors) {
        const details = Object.entries(fieldErrors)
          .flatMap(([field, errors]) => (errors ?? []).map((error) => `${field}: ${error}`))
          .join(' | ');

        message = details ? `${baseError}: ${details}` : baseError;
      } else {
        message = baseError;
      }
    } catch {
      message = fallbackMessage;
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
