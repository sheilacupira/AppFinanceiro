import { apiRequest } from '@/lib/apiClient';
import type { Transaction } from '@/types/finance';

interface TransactionsResponse {
  transactions: Transaction[];
}

const uniqueById = (transactions: Transaction[]): Transaction[] => {
  const map = new Map<string, Transaction>();
  transactions.forEach((transaction) => {
    map.set(transaction.id, transaction);
  });
  return Array.from(map.values());
};

export async function listRemoteTransactions(token: string): Promise<Transaction[]> {
  const response = await apiRequest<TransactionsResponse>('/api/transactions', {
    method: 'GET',
    token,
  });

  return response.transactions;
}

export async function upsertRemoteTransaction(token: string, transaction: Transaction): Promise<void> {
  await apiRequest<{ transaction: Transaction }>(`/api/transactions/${transaction.id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(transaction),
  });
}

export async function deleteRemoteTransaction(token: string, transactionId: string): Promise<void> {
  await apiRequest(`/api/transactions/${transactionId}`, {
    method: 'DELETE',
    token,
  });
}

export async function syncTransactions(localTransactions: Transaction[], token: string): Promise<Transaction[]> {
  const localUnique = uniqueById(localTransactions);

  await Promise.all(localUnique.map(async (transaction) => {
    await upsertRemoteTransaction(token, transaction);
  }));

  const remote = await listRemoteTransactions(token);
  return uniqueById(remote);
}
