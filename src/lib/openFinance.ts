/**
 * Open Finance Service
 * Integração com Pluggy para conexão automática com bancos
 */

import type {
  BankConnection,
  BankAccount,
  BankInstitution,
  PluggyItem,
  PluggyAccount,
  PluggyTransaction,
} from '@/types/openFinance';
import type { Transaction } from '@/types/finance';
import { apiRequest } from '@/lib/apiClient';

class OpenFinanceService {
  private accessToken: string | null = null;
  private mockMode = true;

  isMockMode(): boolean {
    return this.mockMode;
  }

  /**
   * Inicializa a conexão com Pluggy
   */
  async initialize(accessToken?: string): Promise<void> {
    this.accessToken = accessToken ?? null;

    // Always check backend status — the /api/open-finance/status endpoint is public
    // and does not require authentication. Previously this returned early when there
    // was no accessToken, keeping mockMode = true even when Pluggy is fully configured.
    try {
      const status = await apiRequest<{ enabled: boolean }>('/api/open-finance/status', {
        token: this.accessToken ?? undefined,
      });

      this.mockMode = !status.enabled;
    } catch (error) {
      this.mockMode = true;
      console.warn('Open Finance indisponível no backend. Mantendo modo mock.', error);
    }
  }

  /**
   * Gera token para Connect Widget
   */
  async getConnectToken(): Promise<string> {
    if (this.mockMode || !this.accessToken) {
      return 'mock-connect-token';
    }

    try {
      const data = await apiRequest<{ accessToken: string }>('/api/open-finance/connect-token', {
        method: 'POST',
        token: this.accessToken,
      });
      return data.accessToken;
    } catch (error) {
      this.mockMode = true;
      console.error('Erro ao gerar connect token:', error);
      throw error;
    }
  }

  /**
   * Lista bancos disponíveis
   */
  async listBanks(): Promise<BankInstitution[]> {
    if (this.mockMode || !this.accessToken) {
      return this.getMockBanks();
    }

    try {
      const data = await apiRequest<{
        results: Array<{
          id: number;
          name: string;
          codes?: string[];
          imageUrl?: string;
          primaryColor?: string;
        }>;
      }>('/api/open-finance/connectors', {
        token: this.accessToken,
      });

      return data.results.map((connector) => ({
        id: String(connector.id),
        name: connector.name,
        code: connector.codes?.[0],
        logo: connector.imageUrl,
        primaryColor: connector.primaryColor,
        type: 'PERSONAL_BANK',
      }));
    } catch (error) {
      this.mockMode = true;
      console.error('Erro ao listar bancos:', error);
      return this.getMockBanks();
    }
  }

  /**
   * Busca item (conexão) por ID
   */
  async getItem(itemId: string): Promise<PluggyItem | null> {
    if (this.mockMode || !this.accessToken) {
      return null;
    }

    try {
      return await apiRequest<PluggyItem>(`/api/open-finance/items/${itemId}`, {
        token: this.accessToken,
      });
    } catch (error) {
      console.error('Erro ao buscar item:', error);
      return null;
    }
  }

  /**
   * Lista contas de um item
   */
  async listAccounts(itemId: string): Promise<PluggyAccount[]> {
    if (this.mockMode || !this.accessToken) {
      return [];
    }

    try {
      const data = await apiRequest<{ results: PluggyAccount[] }>(`/api/open-finance/accounts?itemId=${encodeURIComponent(itemId)}`, {
        token: this.accessToken,
      });
      return data.results || [];
    } catch (error) {
      console.error('Erro ao listar contas:', error);
      return [];
    }
  }

  async buildConnectionFromItem(itemId: string, fallback?: { bankId?: string; bankName?: string; bankLogo?: string }): Promise<BankConnection> {
    const item = await this.getItem(itemId);
    const accounts = await this.listAccounts(itemId);

    const mappedAccounts: BankAccount[] = accounts.map((account) => ({
      id: `${itemId}-${account.id}`,
      connectionId: itemId,
      accountId: account.id,
      type: this.mapAccountType(account.type),
      name: account.name,
      number: account.number?.slice(-4),
      balance: account.balance,
      currency: account.currencyCode || 'BRL',
      lastSyncAt: Date.now(),
    }));

    return {
      id: itemId,
      bankId: fallback?.bankId || String(item?.connector?.id || itemId),
      bankName: item?.connector?.name || fallback?.bankName || 'Banco conectado',
      bankLogo: item?.connector?.imageUrl || fallback?.bankLogo,
      status: this.mapItemStatus(item?.executionStatus),
      connectedAt: item?.createdAt ? new Date(item.createdAt).getTime() : Date.now(),
      lastSyncAt: Date.now(),
      accounts: mappedAccounts,
      errorMessage: item?.executionStatus === 'LOGIN_ERROR' ? 'Erro de login no banco' : undefined,
    };
  }

  /**
   * Busca transações de uma conta
   */
  async getTransactions(accountId: string, from?: Date, to?: Date): Promise<PluggyTransaction[]> {
    if (this.mockMode || !this.accessToken) {
      return [];
    }

    try {
      const params = new URLSearchParams();
      params.append('accountId', accountId);
      if (from) {
        params.append('from', from.toISOString().split('T')[0]);
      }
      if (to) {
        params.append('to', to.toISOString().split('T')[0]);
      }

      const data = await apiRequest<{ results: PluggyTransaction[] }>(`/api/open-finance/transactions?${params.toString()}`, {
        token: this.accessToken,
      });
      return data.results || [];
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      return [];
    }
  }

  /**
   * Converte transação Pluggy para formato do app
   */
  convertPluggyTransaction(
    pluggyTx: PluggyTransaction,
    accountName: string
  ): Transaction {
    const date = new Date(pluggyTx.date);
    
    return {
      id: `pluggy-${pluggyTx.id}`,
      type: pluggyTx.type === 'CREDIT' ? 'income' : 'expense',
      amount: Math.abs(pluggyTx.amount),
      date: new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString(), // Local midnight ISO
      description: pluggyTx.description || pluggyTx.descriptionRaw || 'Transação',
      categoryId: 'other-expense', // Será categorizado automaticamente
      source: `Open Finance - ${accountName}`,
      status: 'paid',
      isRecurring: false,
      isTithe: false,
    };
  }

  /**
   * Deleta uma conexão
   */
  async deleteItem(itemId: string): Promise<boolean> {
    if (this.mockMode || !this.accessToken) {
      return true;
    }

    try {
      await apiRequest<void>(`/api/open-finance/items/${itemId}`, {
        method: 'DELETE',
        token: this.accessToken,
      });
      return true;
    } catch (error) {
      console.error('Erro ao deletar conexão:', error);
      return false;
    }
  }

  private mapAccountType(accountType: string): BankAccount['type'] {
    const normalizedType = accountType.toLowerCase();
    if (normalizedType.includes('credit')) {
      return 'CREDIT_CARD';
    }
    if (normalizedType.includes('saving')) {
      return 'SAVINGS';
    }
    return 'CHECKING';
  }

  private mapItemStatus(executionStatus?: string): BankConnection['status'] {
    if (!executionStatus) {
      return 'CONNECTED';
    }

    const normalizedStatus = executionStatus.toUpperCase();

    if (normalizedStatus.includes('LOGIN_ERROR')) {
      return 'LOGIN_ERROR';
    }

    if (normalizedStatus.includes('ERROR')) {
      return 'ERROR';
    }

    if (normalizedStatus.includes('UPDATING')) {
      return 'UPDATING';
    }

    if (normalizedStatus.includes('CREATED') || normalizedStatus.includes('WAITING')) {
      return 'PENDING';
    }

    return 'CONNECTED';
  }

  /**
   * Dados mock para desenvolvimento
   */
  private getMockBanks(): BankInstitution[] {
    return [
      {
        id: '1',
        name: 'Banco do Brasil',
        code: '001',
        primaryColor: '#FFCC00',
        type: 'PERSONAL_BANK',
      },
      {
        id: '2',
        name: 'Itaú',
        code: '341',
        primaryColor: '#EC7000',
        type: 'PERSONAL_BANK',
      },
      {
        id: '3',
        name: 'Bradesco',
        code: '237',
        primaryColor: '#CC092F',
        type: 'PERSONAL_BANK',
      },
      {
        id: '4',
        name: 'Caixa Econômica',
        code: '104',
        primaryColor: '#0077C8',
        type: 'PERSONAL_BANK',
      },
      {
        id: '5',
        name: 'Santander',
        code: '033',
        primaryColor: '#EC0000',
        type: 'PERSONAL_BANK',
      },
      {
        id: '6',
        name: 'Nubank',
        code: '260',
        primaryColor: '#820AD1',
        type: 'PERSONAL_BANK',
      },
      {
        id: '7',
        name: 'Inter',
        code: '077',
        primaryColor: '#FF7A00',
        type: 'PERSONAL_BANK',
      },
    ];
  }
}

export const openFinanceService = new OpenFinanceService();
