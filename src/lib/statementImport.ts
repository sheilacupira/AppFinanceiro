import type { Transaction, TransactionType } from '@/types/finance';
import { categorizeTransaction } from './categoryMatcher';

export type StatementFormat = 'ofx' | 'csv';

export interface StatementItem {
  id?: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  source?: string;
  rawType?: string;
  suggestedCategoryId?: string;
}

export interface StatementParseResult {
  items: StatementItem[];
  errors: string[];
  warnings: string[];
}

export interface CsvPreview {
  columns: string[];
  rows: string[][];
  delimiter: string;
  hasHeader: boolean;
}

export interface CsvMapping {
  hasHeader: boolean;
  dateIndex: number;
  descriptionIndex: number;
  amountIndex: number | null;
  debitIndex: number | null;
  creditIndex: number | null;
  typeIndex: number | null;
  sourceIndex: number | null;
}

const HEADER_ALIASES = {
  date: ['data', 'date', 'dt', 'dat', 'data_mov'],
  description: ['descricao', 'historico', 'descricao_trn', 'description', 'memo', 'name'],
  amount: ['valor', 'amount', 'value', 'vlr', 'valor_mov'],
  debit: ['debito', 'debit', 'saida'],
  credit: ['credito', 'credit', 'entrada'],
  type: ['tipo', 'type', 'natureza'],
  source: ['origem', 'banco', 'fonte', 'source'],
};

const normalizeHeader = (value: string): string => {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
};

const detectDelimiter = (line: string): string => {
  const commaCount = (line.match(/,/g) || []).length;
  const semicolonCount = (line.match(/;/g) || []).length;
  return semicolonCount > commaCount ? ';' : ',';
};

const parseCsvLine = (line: string, delimiter: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
};

export const parseCsvPreview = (text: string, maxRows: number = 5): CsvPreview => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const delimiter = lines[0] ? detectDelimiter(lines[0]) : ',';
  const firstRow = lines[0] ? parseCsvLine(lines[0], delimiter) : [];
  const normalizedHeader = firstRow.map(normalizeHeader);
  const hasHeader = normalizedHeader.some((value) => {
    return Object.values(HEADER_ALIASES).some((aliases) => aliases.includes(value));
  });

  const columns = hasHeader ? firstRow : firstRow.map((_, index) => `Coluna ${index + 1}`);
  const startIndex = hasHeader ? 1 : 0;
  const rows = lines.slice(startIndex, startIndex + maxRows).map((line) => parseCsvLine(line, delimiter));

  return {
    columns,
    rows,
    delimiter,
    hasHeader,
  };
};

export const buildDefaultCsvMapping = (preview: CsvPreview): CsvMapping => {
  const normalizedHeader = preview.columns.map(normalizeHeader);

  const findIndex = (aliases: string[]): number => {
    return normalizedHeader.findIndex((header) => aliases.includes(header));
  };

  const dateIndex = findIndex(HEADER_ALIASES.date);
  const descriptionIndex = findIndex(HEADER_ALIASES.description);
  const amountIndex = findIndex(HEADER_ALIASES.amount);
  const debitIndex = findIndex(HEADER_ALIASES.debit);
  const creditIndex = findIndex(HEADER_ALIASES.credit);
  const typeIndex = findIndex(HEADER_ALIASES.type);
  const sourceIndex = findIndex(HEADER_ALIASES.source);

  return {
    hasHeader: preview.hasHeader,
    dateIndex: dateIndex >= 0 ? dateIndex : 0,
    descriptionIndex: descriptionIndex >= 0 ? descriptionIndex : Math.min(1, preview.columns.length - 1),
    amountIndex: amountIndex >= 0 ? amountIndex : null,
    debitIndex: debitIndex >= 0 ? debitIndex : null,
    creditIndex: creditIndex >= 0 ? creditIndex : null,
    typeIndex: typeIndex >= 0 ? typeIndex : null,
    sourceIndex: sourceIndex >= 0 ? sourceIndex : null,
  };
};

const parseMoney = (raw: string): number | null => {
  if (!raw) return null;
  const cleaned = raw.replace(/\s/g, '');

  if (!cleaned) return null;

  let normalized = cleaned;

  if (cleaned.includes(',') && cleaned.includes('.')) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (cleaned.includes(',')) {
    normalized = cleaned.replace(',', '.');
  }

  const value = Number.parseFloat(normalized.replace(/[^0-9.-]/g, ''));
  return Number.isFinite(value) ? value : null;
};

const parseDate = (raw: string): string | null => {
  if (!raw) return null;
  const trimmed = raw.trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    const date = new Date(trimmed);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const slash = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (slash) {
    const [, day, month, year] = slash;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const compact = trimmed.match(/^(\d{8})/);
  if (compact) {
    const value = compact[1];
    const year = Number(value.slice(0, 4));
    const month = Number(value.slice(4, 6));
    const day = Number(value.slice(6, 8));
    const date = new Date(year, month - 1, day);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

const INCOME_KEYWORDS = [
  // Salário e remuneração
  'salario', 'salário', 'salary', 'vencimento', 'vencimentos', 'wages', 'folha', 'payroll',
  'remuneracao', 'remuneração', 'salario liquido', 'salário líquido', 'sal liq', 'sal. liq',
  'salario mes', 'salário mês', 'remuneracao mensal', 'remuneração mensal',
  'salario empresa', 'salário empresa', 'pagto salario', 'pagto salário',
  // Bônus e prêmios
  'bonus', 'bônus', 'gratificacao', 'gratificação', 'premio', 'prêmio',
  '13 salario', '13º salario', '13º salário', 'decimo terceiro', 'décimo terceiro',
  // Transferências e depósitos recebidos
  'deposito', 'depósito', 'transferencia recebida', 'transferência recebida', 
  'ted recebida', 'pix recebido', 'doc recebido', 'receb ted', 'receb pix', 'receb doc',
  'cred em conta', 'credito em conta', 'crédito em conta',
  // Rendimentos e investimentos
  'rendimento', 'juros', 'interest', 'dividendo', 'dividend', 'lucro', 'yield',
  'aluguel recebido', 'aluguel', 'renda imovel', 'renda imóvel', 'locacao', 'locação',
  // Devoluções e reembolsos
  'reembolso', 'reembolsado', 'devolucao', 'devolução', 'refund', 'estorno',
  // Vendas e trabalho autônomo
  'venda', 'sale', 'recebimento', 'recebido', 'received', 'pagto recebido',
  'freelance', 'freela', 'autonomo', 'autônomo', 'servico prestado', 'serviço prestado',
  'honorarios', 'honorários', 'consultoria', 'projeto', 'trabalho autonomo', 'trabalho autônomo',
  // Entrada genérica
  'entrada', 'receita', 'income', 'credit', 'credito', 'crédito',
  'deposito em conta', 'depósito em conta',
];

const EXPENSE_KEYWORDS = [
  // Pagamentos gerais
  'pagamento', 'payment', 'pago', 'paid',
  // Débito
  'debito', 'débito', 'debit', 'saida', 'saída',
  // Compras
  'compra', 'purchase', 'comprado',
  // Despesa
  'despesa', 'expense', 'gasto',
  // Transferências enviadas
  'transferencia enviada', 'transferência enviada', 'ted enviada',
];

const detectTransactionType = (description: string, rawType?: string): TransactionType => {
  const desc = description.toLowerCase();
  const normalized = rawType?.toLowerCase() || '';

  // Verificar pela descrição PRIMEIRO (mais confiável que tipo genérico)
  // Priorizar palavras-chave de INCOME pois são mais específicas (salário, bônus, etc)
  if (INCOME_KEYWORDS.some((token) => desc.includes(token))) {
    return 'income';
  }

  // Verificar rawType (coluna explícita de tipo)
  if (rawType) {
    if (INCOME_KEYWORDS.some((token) => normalized.includes(token))) {
      return 'income';
    }
    if (EXPENSE_KEYWORDS.some((token) => normalized.includes(token))) {
      return 'expense';
    }
  }

  // Verificar palavras-chave de despesa na descrição
  if (EXPENSE_KEYWORDS.some((token) => desc.includes(token))) {
    return 'expense';
  }

  // Padrão: assumir "expense" (mais seguro para não deixar despesa como receita)
  return 'expense';
};

const determineType = (amount: number, description?: string, rawType?: string): TransactionType => {
  // Se o valor é negativo, é despesa
  if (amount < 0) return 'expense';
  
  // Tentar detectar pelo tipo e descrição
  return detectTransactionType(description || '', rawType);
};

const buildIdFromItem = (item: StatementItem): string => {
  const base = `${item.date}|${item.amount}|${item.description}|${item.type}`;
  let hash = 5381;
  for (let i = 0; i < base.length; i += 1) {
    hash = (hash * 33) ^ base.charCodeAt(i);
  }
  const safeHash = Math.abs(hash).toString(36);
  return `import-${safeHash}`;
};

export const buildTransactionsFromItems = (items: StatementItem[]): Transaction[] => {
  return items.map((item) => {
    const id = item.id ? `import-${item.id}` : buildIdFromItem(item);
    
    // Use suggested category if available, otherwise use default
    let categoryId = item.suggestedCategoryId;
    if (!categoryId) {
      categoryId = item.type === 'income' ? 'other-income' : 'other-expense';
    }
    
    return {
      id,
      type: item.type,
      amount: Math.abs(item.amount),
      date: item.date,
      description: item.description || 'Extrato importado',
      categoryId,
      source: item.source,
      status: 'paid',
      isRecurring: false,
      isTithe: false,
    };
  });
};

export const detectFormat = (fileName: string, text: string): StatementFormat => {
  if (fileName.toLowerCase().endsWith('.ofx')) return 'ofx';
  if (text.includes('<OFX') || text.includes('<STMTTRN>')) return 'ofx';
  return 'csv';
};

export const parseOfx = (text: string): StatementParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: StatementItem[] = [];

  const blocks = text.split(/<STMTTRN>/i).slice(1);

  if (!blocks.length) {
    errors.push('Nenhuma transacao encontrada no OFX.');
    return { items, errors, warnings };
  }

  const extractTag = (block: string, tag: string): string | null => {
    const regex = new RegExp(`<${tag}>([^<\n\r]+)`, 'i');
    const match = block.match(regex);
    return match ? match[1].trim() : null;
  };

  blocks.forEach((block) => {
    const rawDate = extractTag(block, 'DTPOSTED');
    const rawAmount = extractTag(block, 'TRNAMT');
    const rawType = extractTag(block, 'TRNTYPE');
    const memo = extractTag(block, 'MEMO') || extractTag(block, 'NAME') || '';
    const fitId = extractTag(block, 'FITID');

    const date = rawDate ? parseDate(rawDate) : null;
    const amount = rawAmount ? parseMoney(rawAmount) : null;

    if (!date || amount === null) {
      warnings.push('Transacao ignorada por falta de data ou valor.');
      return;
    }

    const type = determineType(amount, memo, rawType || undefined);
    const categorization = categorizeTransaction(memo);
    
    items.push({
      id: fitId || undefined,
      date,
      description: memo || 'Extrato importado',
      amount,
      type,
      rawType: rawType || undefined,
      suggestedCategoryId: categorization.categoryId,
    });
  });

  return { items, errors, warnings };
};

export const parseCsv = (text: string): StatementParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: StatementItem[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    errors.push('CSV vazio.');
    return { items, errors, warnings };
  }

  const delimiter = detectDelimiter(lines[0]);
  const firstRow = parseCsvLine(lines[0], delimiter);

  const normalizedHeader = firstRow.map(normalizeHeader);
  const hasHeader = normalizedHeader.some((value) => {
    return Object.values(HEADER_ALIASES).some((aliases) => aliases.includes(value));
  });

  const headers = hasHeader ? normalizedHeader : [];
  const startIndex = hasHeader ? 1 : 0;

  const findIndex = (aliases: string[]): number => {
    return headers.findIndex((header) => aliases.includes(header));
  };

  const dateIndex = hasHeader ? findIndex(HEADER_ALIASES.date) : 0;
  const descriptionIndex = hasHeader ? findIndex(HEADER_ALIASES.description) : 1;
  const amountIndex = hasHeader ? findIndex(HEADER_ALIASES.amount) : 2;
  const debitIndex = hasHeader ? findIndex(HEADER_ALIASES.debit) : -1;
  const creditIndex = hasHeader ? findIndex(HEADER_ALIASES.credit) : -1;
  const typeIndex = hasHeader ? findIndex(HEADER_ALIASES.type) : -1;
  const sourceIndex = hasHeader ? findIndex(HEADER_ALIASES.source) : -1;

  for (let i = startIndex; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i], delimiter);
    const rawDate = row[dateIndex] ?? '';
    const rawDescription = row[descriptionIndex] ?? '';
    const rawType = typeIndex >= 0 ? row[typeIndex] : undefined;
    const source = sourceIndex >= 0 ? row[sourceIndex] : undefined;

    const date = parseDate(rawDate);

    let amount: number | null = null;
    let type: TransactionType = 'expense';

    if (creditIndex >= 0 || debitIndex >= 0) {
      const credit = creditIndex >= 0 ? parseMoney(row[creditIndex] ?? '') : null;
      const debit = debitIndex >= 0 ? parseMoney(row[debitIndex] ?? '') : null;

      if (credit && credit > 0) {
        amount = credit;
        // Se tem valor na coluna CRÉDITO, é ENTRADA (a menos que descrição force outro tipo)
        // Priorizar que crédito = income
        const detectedType = determineType(credit, rawDescription, rawType);
        // Se detectou como despesa mas está na coluna crédito, verificar novamente
        type = detectedType === 'expense' && !EXPENSE_KEYWORDS.some(kw => rawDescription.toLowerCase().includes(kw))
          ? 'income'
          : detectedType;
      } else if (debit && debit > 0) {
        amount = debit;
        // Se tem valor na coluna DÉBITO, é SAÍDA (a menos que descrição force entrada)
        const detectedType = determineType(debit, rawDescription, rawType);
        // Se detectou como entrada mas está na coluna débito, manter entrada se tiver palavra-chave forte
        type = detectedType === 'income' 
          ? 'income' // Manter se detectou salário/bonus/etc
          : 'expense';
      }
    }

    if (amount === null && amountIndex >= 0) {
      const parsed = parseMoney(row[amountIndex] ?? '');
      if (parsed !== null) {
        amount = parsed;
        type = determineType(parsed, rawDescription, rawType);
      }
    }

    if (!date || amount === null) {
      warnings.push(`Linha ${i + 1} ignorada por falta de data ou valor.`);
      continue;
    }

    const categorization = categorizeTransaction(rawDescription);
    items.push({
      date,
      description: rawDescription || 'Extrato importado',
      amount,
      type,
      source,
      rawType,
      suggestedCategoryId: categorization.categoryId,
    });
  }

  if (!items.length && !errors.length) {
    warnings.push('Nenhuma transacao valida encontrada no CSV.');
  }

  return { items, errors, warnings };
};

export const parseCsvWithMapping = (text: string, mapping: CsvMapping): StatementParseResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const items: StatementItem[] = [];

  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    errors.push('CSV vazio.');
    return { items, errors, warnings };
  }

  const delimiter = detectDelimiter(lines[0]);
  const startIndex = mapping.hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i += 1) {
    const row = parseCsvLine(lines[i], delimiter);
    const rawDate = row[mapping.dateIndex] ?? '';
    const rawDescription = row[mapping.descriptionIndex] ?? '';
    const rawType = mapping.typeIndex !== null ? row[mapping.typeIndex] : undefined;
    const source = mapping.sourceIndex !== null ? row[mapping.sourceIndex] : undefined;

    const date = parseDate(rawDate);

    let amount: number | null = null;
    let type: TransactionType = 'expense';

    if (mapping.creditIndex !== null || mapping.debitIndex !== null) {
      const credit = mapping.creditIndex !== null ? parseMoney(row[mapping.creditIndex] ?? '') : null;
      const debit = mapping.debitIndex !== null ? parseMoney(row[mapping.debitIndex] ?? '') : null;

      if (credit && credit > 0) {
        amount = credit;
        // Se tem valor na coluna CRÉDITO, é ENTRADA (a menos que descrição force outro tipo)
        const detectedType = determineType(credit, rawDescription, rawType);
        type = detectedType === 'expense' && !EXPENSE_KEYWORDS.some(kw => rawDescription.toLowerCase().includes(kw))
          ? 'income'
          : detectedType;
      } else if (debit && debit > 0) {
        amount = debit;
        // Se tem valor na coluna DÉBITO, é SAÍDA (a menos que descrição force entrada)
        const detectedType = determineType(debit, rawDescription, rawType);
        type = detectedType === 'income' 
          ? 'income' // Manter se detectou salário/bonus/etc
          : 'expense';
      }
    }

    if (amount === null && mapping.amountIndex !== null) {
      const parsed = parseMoney(row[mapping.amountIndex] ?? '');
      if (parsed !== null) {
        amount = parsed;
        type = determineType(parsed, rawDescription, rawType);
      }
    }

    if (!date || amount === null) {
      warnings.push(`Linha ${i + 1} ignorada por falta de data ou valor.`);
      continue;
    }

    const categorization = categorizeTransaction(rawDescription);
    items.push({
      date,
      description: rawDescription || 'Extrato importado',
      amount,
      type,
      source,
      rawType,
      suggestedCategoryId: categorization.categoryId,
    });
  }

  if (!items.length && !errors.length) {
    warnings.push('Nenhuma transacao valida encontrada no CSV.');
  }

  return { items, errors, warnings };
};

export const parseStatement = (fileName: string, text: string): StatementParseResult => {
  const format = detectFormat(fileName, text);
  return format === 'ofx' ? parseOfx(text) : parseCsv(text);
};
