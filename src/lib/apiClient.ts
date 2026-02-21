import { runtimeConfig } from '@/config/runtime';

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

const normalizeBaseUrl = (baseUrl: string): string => {
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
};

const getApiBaseUrl = (): string => {
  if (runtimeConfig.apiBaseUrl) {
    return normalizeBaseUrl(runtimeConfig.apiBaseUrl);
  }

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
      const errorBody = await response.json();
      message = typeof errorBody?.error === 'string' ? errorBody.error : fallbackMessage;
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
