import { env } from '../config/env.js';

const PLUGGY_API_BASE_URL = 'https://api.pluggy.ai';

interface PluggyAuthResponse {
  apiKey: string;
}

interface PluggyErrorResponse {
  message?: string;
  details?: string;
}

class OpenFinanceClient {
  private apiKey: string | null = null;

  private ensureConfigured(): void {
    if (!env.PLUGGY_CLIENT_ID || !env.PLUGGY_CLIENT_SECRET) {
      throw new Error('Open Finance is not configured');
    }
  }

  private async authenticate(): Promise<void> {
    this.ensureConfigured();

    const response = await fetch(`${PLUGGY_API_BASE_URL}/auth`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId: env.PLUGGY_CLIENT_ID,
        clientSecret: env.PLUGGY_CLIENT_SECRET,
      }),
    });

    if (!response.ok) {
      let details = '';

      try {
        const body = (await response.json()) as PluggyErrorResponse;
        details = body?.message || body?.details || '';
      } catch {
        details = '';
      }

      const statusDetails = `status ${response.status}`;
      const message = details
        ? `Failed to authenticate with Pluggy: ${details} (${statusDetails})`
        : `Failed to authenticate with Pluggy (${statusDetails})`;

      throw new Error(message);
    }

    const data = (await response.json()) as PluggyAuthResponse;
    this.apiKey = data.apiKey;
  }

  private async request<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
    this.ensureConfigured();

    if (!this.apiKey) {
      await this.authenticate();
    }

    const response = await fetch(`${PLUGGY_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey as string,
        ...(init?.headers ?? {}),
      },
    });

    if (response.status === 401 && retry) {
      await this.authenticate();
      return this.request<T>(path, init, false);
    }

    if (!response.ok) {
      const fallbackMessage = `Pluggy request failed: ${response.status}`;
      let message = fallbackMessage;

      try {
        const body = (await response.json()) as { message?: string };
        if (body?.message) {
          message = body.message;
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

  async getConnectToken(): Promise<{ accessToken: string }> {
    return this.request<{ accessToken: string }>('/connect_token', {
      method: 'POST',
    });
  }

  async listConnectors(): Promise<Array<{ id: number; name: string; codes?: string[]; imageUrl?: string; primaryColor?: string }>> {
    return this.request<Array<{ id: number; name: string; codes?: string[]; imageUrl?: string; primaryColor?: string }>>('/connectors?countries=BR');
  }

  async getItem(itemId: string): Promise<unknown> {
    return this.request<unknown>(`/items/${itemId}`);
  }

  async listAccounts(itemId: string): Promise<{ results: unknown[] }> {
    return this.request<{ results: unknown[] }>(`/accounts?itemId=${encodeURIComponent(itemId)}`);
  }

  async listTransactions(accountId: string, from?: string, to?: string): Promise<{ results: unknown[] }> {
    const params = new URLSearchParams({ accountId });
    if (from) params.append('from', from);
    if (to) params.append('to', to);

    return this.request<{ results: unknown[] }>(`/transactions?${params.toString()}`);
  }

  async deleteItem(itemId: string): Promise<void> {
    await this.request<void>(`/items/${itemId}`, {
      method: 'DELETE',
    });
  }

  async isAvailable(): Promise<boolean> {
    if (!env.PLUGGY_CLIENT_ID || !env.PLUGGY_CLIENT_SECRET) {
      return false;
    }

    try {
      await this.authenticate();
      return true;
    } catch {
      return false;
    }
  }
}

export const openFinanceClient = new OpenFinanceClient();