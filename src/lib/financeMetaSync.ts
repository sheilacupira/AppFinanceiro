import { apiRequest } from '@/lib/apiClient';
import type { Category, Recurrence, Settings } from '@/types/finance';

interface FinanceMetaResponse {
  recurrences: Recurrence[];
  categories: Category[];
  settings: Settings | null;
}

const uniqueById = <T extends { id: string }>(items: T[]): T[] => {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(item.id, item));
  return Array.from(map.values());
};

export async function listRemoteFinanceMeta(token: string): Promise<FinanceMetaResponse> {
  return apiRequest<FinanceMetaResponse>('/api/finance-meta', {
    method: 'GET',
    token,
  });
}

export async function upsertRemoteRecurrence(token: string, recurrence: Recurrence): Promise<void> {
  await apiRequest<{ recurrence: Recurrence }>(`/api/recurrences/${recurrence.id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(recurrence),
  });
}

export async function deleteRemoteRecurrence(token: string, recurrenceId: string): Promise<void> {
  await apiRequest(`/api/recurrences/${recurrenceId}`, {
    method: 'DELETE',
    token,
  });
}

export async function upsertRemoteCategory(token: string, category: Category): Promise<void> {
  await apiRequest<{ category: Category }>(`/api/categories/${category.id}`, {
    method: 'PUT',
    token,
    body: JSON.stringify(category),
  });
}

export async function deleteRemoteCategory(token: string, categoryId: string): Promise<void> {
  await apiRequest(`/api/categories/${categoryId}`, {
    method: 'DELETE',
    token,
  });
}

export async function upsertRemoteSettings(token: string, settings: Settings): Promise<void> {
  await apiRequest<{ settings: Settings }>('/api/settings', {
    method: 'PUT',
    token,
    body: JSON.stringify(settings),
  });
}

export async function syncFinanceMeta(
  input: { recurrences: Recurrence[]; categories: Category[]; settings: Settings },
  token: string
): Promise<FinanceMetaResponse> {
  const uniqueRecurrences = uniqueById(input.recurrences);
  const uniqueCategories = uniqueById(input.categories);

  await Promise.all([
    ...uniqueRecurrences.map(async (recurrence) => upsertRemoteRecurrence(token, recurrence)),
    ...uniqueCategories.map(async (category) => upsertRemoteCategory(token, category)),
    upsertRemoteSettings(token, input.settings),
  ]);

  return listRemoteFinanceMeta(token);
}
