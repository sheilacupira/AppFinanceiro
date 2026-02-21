/**
 * Import batch tracking utilities
 */

const LAST_IMPORT_BATCH_KEY = 'financeiro_last_import_batch';

export interface ImportBatch {
  id: string;
  count: number;
  timestamp: number;
}

/**
 * Generate a unique import batch ID
 */
export const generateImportBatchId = (): string => {
  return `batch-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Save the last import batch info
 */
export const saveLastImportBatch = (batch: ImportBatch): void => {
  localStorage.setItem(LAST_IMPORT_BATCH_KEY, JSON.stringify(batch));
};

/**
 * Get the last import batch info
 */
export const getLastImportBatch = (): ImportBatch | null => {
  const raw = localStorage.getItem(LAST_IMPORT_BATCH_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as ImportBatch;
  } catch {
    return null;
  }
};

/**
 * Clear the last import batch info
 */
export const clearLastImportBatch = (): void => {
  localStorage.removeItem(LAST_IMPORT_BATCH_KEY);
};
