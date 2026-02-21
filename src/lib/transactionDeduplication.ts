import type { Transaction } from '@/types/finance';

/**
 * Gera um hash único para uma transação baseado em seus dados-chave
 * Usado para detectar duplicatas mesmo com IDs diferentes
 */
export const generateTransactionHash = (transaction: {
  date: string;
  amount: number;
  description: string;
  type: string;
}): string => {
  // Normalizar a data para ISO sem hora
  const dateOnly = new Date(transaction.date).toISOString().split('T')[0];
  
  // Normalizar descrição (lowercase, sem espaços extras)
  const normalizedDesc = transaction.description
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
  
  // Criar base para hash
  const base = `${dateOnly}|${Math.abs(transaction.amount).toFixed(2)}|${normalizedDesc}|${transaction.type}`;
  
  // Gerar hash (djb2 algorithm)
  let hash = 5381;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33) ^ base.charCodeAt(i);
  }
  
  return Math.abs(hash).toString(36);
};

/**
 * Verifica se uma transação já existe na lista baseado em hash
 */
export const isDuplicateTransaction = (
  transaction: Transaction,
  existingTransactions: Transaction[]
): boolean => {
  const newHash = generateTransactionHash(transaction);
  
  return existingTransactions.some((existing) => {
    const existingHash = generateTransactionHash(existing);
    return newHash === existingHash;
  });
};

/**
 * Remove duplicatas de uma lista de transações
 * Mantém a primeira ocorrência e remove as posteriores
 */
export const deduplicateTransactions = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): { unique: Transaction[]; duplicates: Transaction[] } => {
  const unique: Transaction[] = [];
  const duplicates: Transaction[] = [];
  
  // Criar set de hashes das transações existentes
  const existingHashes = new Set(
    existingTransactions.map((tx) => generateTransactionHash(tx))
  );
  
  // Verificar novas transações
  newTransactions.forEach((transaction) => {
    const hash = generateTransactionHash(transaction);
    
    if (existingHashes.has(hash)) {
      duplicates.push(transaction);
    } else {
      unique.push(transaction);
      existingHashes.add(hash); // Evitar duplicatas dentro do próprio batch
    }
  });
  
  return { unique, duplicates };
};

/**
 * Conta quantas duplicatas existiriam se as transações fossem importadas
 */
export const countDuplicates = (
  newTransactions: Transaction[],
  existingTransactions: Transaction[]
): number => {
  const { duplicates } = deduplicateTransactions(newTransactions, existingTransactions);
  return duplicates.length;
};
