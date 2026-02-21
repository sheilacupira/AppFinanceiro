import {
  FinanceTransactionStatus,
  FinanceTransactionType,
  type FinanceTransaction,
} from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const transactionsRouter = Router();

const transactionSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.number().finite().nonnegative(),
  date: z.string().datetime(),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  source: z.string().optional(),
  status: z.enum(['paid', 'pending']),
  isRecurring: z.boolean(),
  recurrenceId: z.string().optional(),
  isTithe: z.boolean().optional(),
});

type ApiTransaction = z.infer<typeof transactionSchema>;

const toDbType = (type: ApiTransaction['type']): FinanceTransactionType => {
  return type === 'income' ? FinanceTransactionType.INCOME : FinanceTransactionType.EXPENSE;
};

const toDbStatus = (status: ApiTransaction['status']): FinanceTransactionStatus => {
  return status === 'paid' ? FinanceTransactionStatus.PAID : FinanceTransactionStatus.PENDING;
};

const toApiTransaction = (transaction: FinanceTransaction): ApiTransaction => {
  return {
    id: transaction.id,
    type: transaction.type === FinanceTransactionType.INCOME ? 'income' : 'expense',
    amount: transaction.amount,
    date: transaction.date.toISOString(),
    description: transaction.description,
    categoryId: transaction.categoryId,
    source: transaction.source ?? undefined,
    status: transaction.status === FinanceTransactionStatus.PAID ? 'paid' : 'pending',
    isRecurring: transaction.isRecurring,
    recurrenceId: transaction.recurrenceId ?? undefined,
    isTithe: transaction.isTithe ?? undefined,
  };
};

transactionsRouter.use(requireAuth);

transactionsRouter.get('/transactions', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const transactions = await prisma.financeTransaction.findMany({
    where: {
      tenantId: auth.tenantId,
    },
    orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
  });

  res.json({
    transactions: transactions.map(toApiTransaction),
  });
});

transactionsRouter.put('/transactions/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = transactionSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  if (payload.id !== req.params.id) {
    res.status(400).json({ error: 'Route id must match body id' });
    return;
  }

  const saved = await prisma.financeTransaction.upsert({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: payload.id,
      },
    },
    create: {
      id: payload.id,
      tenantId: auth.tenantId,
      type: toDbType(payload.type),
      amount: payload.amount,
      date: new Date(payload.date),
      description: payload.description,
      categoryId: payload.categoryId,
      source: payload.source,
      status: toDbStatus(payload.status),
      isRecurring: payload.isRecurring,
      recurrenceId: payload.recurrenceId,
      isTithe: payload.isTithe,
    },
    update: {
      type: toDbType(payload.type),
      amount: payload.amount,
      date: new Date(payload.date),
      description: payload.description,
      categoryId: payload.categoryId,
      source: payload.source,
      status: toDbStatus(payload.status),
      isRecurring: payload.isRecurring,
      recurrenceId: payload.recurrenceId,
      isTithe: payload.isTithe,
    },
  });

  res.json({ transaction: toApiTransaction(saved) });
});

transactionsRouter.delete('/transactions/batch/:batchId', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const batchId = req.params.batchId;

  const result = await prisma.financeTransaction.deleteMany({
    where: {
      tenantId: auth.tenantId,
      importBatchId: batchId,
    },
  });

  res.json({ deleted: result.count });
});

transactionsRouter.delete('/transactions/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const existing = await prisma.financeTransaction.findUnique({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: req.params.id,
      },
    },
  });

  if (!existing) {
    res.status(204).send();
    return;
  }

  await prisma.financeTransaction.delete({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: req.params.id,
      },
    },
  });

  res.status(204).send();
});
