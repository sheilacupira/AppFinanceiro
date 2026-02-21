/**
 * Open Finance Service
 * Integração com Pluggy para conexão automática com bancos
 */

import type {
  BankConnection,
  BankAccount,
  BankTransaction,
  BankInstitution,
  PluggyConnectToken,
  PluggyItem,
  PluggyAccount,
  PluggyTransaction,
} from '@/types/openFinance';
import type { Transaction } from '@/types/finance';

const PLUGGY_API_BASE_URL = 'https://api.pluggy.ai';
const PLUGGY_CLIENT_ID = import.meta.env.VITE_PLUGGY_CLIENT_ID || '';
const PLUGGY_CLIENT_SECRET = import.meta.env.VITE_PLUGGY_CLIENT_SECRET || '';

// Mock mode para desenvolvimento (quando não tem credenciais)
const MOCK_MODE = !PLUGGY_CLIENT_ID || !PLUGGY_CLIENT_SECRET;

class OpenFinanceService {
  private apiKey: string = '';

  /**
   * Inicializa a conexão com Pluggy
   */
  async initialize(): Promise<void> {
    if (MOCK_MODE) {
      console.warn('⚠️ Open Finance em MODO MOCK - configure VITE_PLUGGY_CLIENT_ID e VITE_PLUGGY_CLIENT_SECRET');
      return;
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clientId: PLUGGY_CLIENT_ID,
          clientSecret: PLUGGY_CLIENT_SECRET,
        }),
      });

      if (!response.ok) {
        throw new Error('Falha ao autenticar com Pluggy');
      }

      const data: { apiKey: string } = await response.json();
      this.apiKey = data.apiKey;
    } catch (error) {
      console.error('Erro ao inicializar Open Finance:', error);
      throw error;
    }
  }

  /**
   * Gera token para Connect Widget
   */
  async getConnectToken(): Promise<string> {
    if (MOCK_MODE) {
      return 'mock-connect-token';
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/connect_token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao gerar connect token');
      }

      const data: PluggyConnectToken = await response.json();
      return data.accessToken;
    } catch (error) {
      console.error('Erro ao gerar connect token:', error);
      throw error;
    }
  }

  /**
   * Lista bancos disponíveis
   */
  async listBanks(): Promise<BankInstitution[]> {
    if (MOCK_MODE) {
      return this.getMockBanks();
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/connectors?countries=BR`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar bancos');
      }

      const data: Array<{
        id: number;
        name: string;
        codes?: string[];
        imageUrl?: string;
        primaryColor?: string;
      }> = await response.json();
      
      return data.map((connector) => ({
        id: String(connector.id),
        name: connector.name,
        code: connector.codes?.[0],
        logo: connector.imageUrl,
        primaryColor: connector.primaryColor,
        type: 'PERSONAL_BANK',
      }));
    } catch (error) {
      console.error('Erro ao listar bancos:', error);
      return this.getMockBanks();
    }
  }

  /**
   * Busca item (conexão) por ID
   */
  async getItem(itemId: string): Promise<PluggyItem | null> {
    if (MOCK_MODE) {
      return null;
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/items/${itemId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar item:', error);
      return null;
    }
  }

  /**
   * Lista contas de um item
   */
  async listAccounts(itemId: string): Promise<PluggyAccount[]> {
    if (MOCK_MODE) {
      return [];
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/accounts?itemId=${itemId}`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar contas');
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('Erro ao listar contas:', error);
      return [];
    }
  }

  /**
   * Busca transações de uma conta
   */
  async getTransactions(accountId: string, from?: Date, to?: Date): Promise<PluggyTransaction[]> {
    if (MOCK_MODE) {
      return [];
    }

    try {
      const params = new URLSearchParams({ accountId });
      if (from) params.append('from', from.toISOString().split('T')[0]);
      if (to) params.append('to', to.toISOString().split('T')[0]);

      const response = await fetch(`${PLUGGY_API_BASE_URL}/transactions?${params}`, {
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error('Falha ao buscar transações');
      }

      const data = await response.json();
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
      date: date.toISOString().split('T')[0], // Format: YYYY-MM-DD
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
    if (MOCK_MODE) {
      return true;
    }

    try {
      const response = await fetch(`${PLUGGY_API_BASE_URL}/items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'X-API-KEY': this.apiKey,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('Erro ao deletar conexão:', error);
      return false;
    }
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
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/001.png',
        primaryColor: '#FFCC00',
        type: 'PERSONAL_BANK',
      },
      {
        id: '2',
        name: 'Itaú',
        code: '341',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/341.png',
        primaryColor: '#EC7000',
        type: 'PERSONAL_BANK',
      },
      {
        id: '3',
        name: 'Bradesco',
        code: '237',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/237.png',
        primaryColor: '#CC092F',
        type: 'PERSONAL_BANK',
      },
      {
        id: '4',
        name: 'Caixa Econômica',
        code: '104',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/104.png',
        primaryColor: '#0077C8',
        type: 'PERSONAL_BANK',
      },
      {
        id: '5',
        name: 'Santander',
        code: '033',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/033.png',
        primaryColor: '#EC0000',
        type: 'PERSONAL_BANK',
      },
      {
        id: '6',
        name: 'Nubank',
        code: '260',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/260.png',
        primaryColor: '#820AD1',
        type: 'PERSONAL_BANK',
      },
      {
        id: '7',
        name: 'Inter',
        code: '077',
        logo: 'https://cdn.pluggy.ai/assets/connector-icons/BR/077.png',
        primaryColor: '#FF7A00',
        type: 'PERSONAL_BANK',
      },
    ];
  }
}

export const openFinanceService = new OpenFinanceService();
