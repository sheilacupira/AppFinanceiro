import type { Category, Recurrence, Settings, Transaction } from '@/types/finance';
import {
  deleteRemoteCategory,
  deleteRemoteRecurrence,
  upsertRemoteCategory,
  upsertRemoteRecurrence,
  upsertRemoteSettings,
} from '@/lib/financeMetaSync';
import {
  deleteRemoteTransaction,
  upsertRemoteTransaction,
} from '@/lib/transactionSync';

type SyncOperationType =
  | 'transaction.upsert'
  | 'transaction.delete'
  | 'recurrence.upsert'
  | 'recurrence.delete'
  | 'category.upsert'
  | 'category.delete'
  | 'settings.upsert';

type SyncOperationPayloadMap = {
  'transaction.upsert': { transaction: Transaction };
  'transaction.delete': { transactionId: string };
  'recurrence.upsert': { recurrence: Recurrence };
  'recurrence.delete': { recurrenceId: string };
  'category.upsert': { category: Category };
  'category.delete': { categoryId: string };
  'settings.upsert': { settings: Settings };
};

export interface SyncQueueItem<T extends SyncOperationType = SyncOperationType> {
  id: string;
  type: T;
  payload: SyncOperationPayloadMap[T];
  createdAt: string;
  attempts: number;
}

const SYNC_QUEUE_STORAGE_KEY = 'financeiro_sync_queue';

const parseQueue = (raw: string | null): SyncQueueItem[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SyncQueueItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const loadQueue = (): SyncQueueItem[] => {
  return parseQueue(localStorage.getItem(SYNC_QUEUE_STORAGE_KEY));
};

const saveQueue = (items: SyncQueueItem[]) => {
  localStorage.setItem(SYNC_QUEUE_STORAGE_KEY, JSON.stringify(items));
};

const operationKey = (item: SyncQueueItem): string => {
  switch (item.type) {
    case 'transaction.upsert':
      return `transaction:${item.payload.transaction.id}`;
    case 'transaction.delete':
      return `transaction:${item.payload.transactionId}`;
    case 'recurrence.upsert':
      return `recurrence:${item.payload.recurrence.id}`;
    case 'recurrence.delete':
      return `recurrence:${item.payload.recurrenceId}`;
    case 'category.upsert':
      return `category:${item.payload.category.id}`;
    case 'category.delete':
      return `category:${item.payload.categoryId}`;
    case 'settings.upsert':
      return 'settings:root';
    default:
      return item.id;
  }
};

const executeItem = async (token: string, item: SyncQueueItem): Promise<void> => {
  switch (item.type) {
    case 'transaction.upsert':
      await upsertRemoteTransaction(token, item.payload.transaction);
      break;
    case 'transaction.delete':
      await deleteRemoteTransaction(token, item.payload.transactionId);
      break;
    case 'recurrence.upsert':
      await upsertRemoteRecurrence(token, item.payload.recurrence);
      break;
    case 'recurrence.delete':
      await deleteRemoteRecurrence(token, item.payload.recurrenceId);
      break;
    case 'category.upsert':
      await upsertRemoteCategory(token, item.payload.category);
      break;
    case 'category.delete':
      await deleteRemoteCategory(token, item.payload.categoryId);
      break;
    case 'settings.upsert':
      await upsertRemoteSettings(token, item.payload.settings);
      break;
  }
};

const buildItem = <T extends SyncOperationType>(
  type: T,
  payload: SyncOperationPayloadMap[T]
): SyncQueueItem<T> => ({
  id: crypto.randomUUID(),
  type,
  payload,
  createdAt: new Date().toISOString(),
  attempts: 0,
});

export function enqueueSyncOperation<T extends SyncOperationType>(
  type: T,
  payload: SyncOperationPayloadMap[T]
): void {
  const queue = loadQueue();
  const nextItem = buildItem(type, payload);

  const nextKey = operationKey(nextItem);
  const filtered = queue.filter((item) => operationKey(item) !== nextKey);
  filtered.push(nextItem);

  saveQueue(filtered);
}

export async function processSyncQueue(token: string): Promise<{ processed: number; remaining: number }> {
  const queue = loadQueue();
  if (!queue.length) {
    return { processed: 0, remaining: 0 };
  }

  const remaining: SyncQueueItem[] = [];
  let processed = 0;

  for (const item of queue) {
    try {
      await executeItem(token, item);
      processed += 1;
    } catch {
      remaining.push({ ...item, attempts: item.attempts + 1 });
    }
  }

  saveQueue(remaining);

  return {
    processed,
    remaining: remaining.length,
  };
}

export function getSyncQueueSize(): number {
  return loadQueue().length;
}
