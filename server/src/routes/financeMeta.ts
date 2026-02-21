import {
  FinanceCategoryType,
  FinanceRecurrenceFrequency,
  FinanceTheme,
  FinanceTransactionType,
  type FinanceCategory,
  type FinanceRecurrence,
  type FinanceSettings,
} from '@prisma/client';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

export const financeMetaRouter = Router();
financeMetaRouter.use(requireAuth);

const recurrenceSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['income', 'expense']),
  amount: z.number().finite().nonnegative(),
  description: z.string().min(1),
  categoryId: z.string().min(1),
  source: z.string().optional(),
  frequency: z.literal('monthly'),
  startDate: z.string().datetime(),
  isActive: z.boolean(),
  createAsPending: z.boolean(),
});

const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(['income', 'expense', 'both']),
  icon: z.string().optional(),
});

const settingsSchema = z.object({
  isTither: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
});

type ApiRecurrence = z.infer<typeof recurrenceSchema>;
type ApiCategory = z.infer<typeof categorySchema>;
type ApiSettings = z.infer<typeof settingsSchema>;

const toDbTxType = (type: ApiRecurrence['type']): FinanceTransactionType => {
  return type === 'income' ? FinanceTransactionType.INCOME : FinanceTransactionType.EXPENSE;
};

const toApiTxType = (type: FinanceTransactionType): ApiRecurrence['type'] => {
  return type === FinanceTransactionType.INCOME ? 'income' : 'expense';
};

const toDbCategoryType = (type: ApiCategory['type']): FinanceCategoryType => {
  if (type === 'income') return FinanceCategoryType.INCOME;
  if (type === 'expense') return FinanceCategoryType.EXPENSE;
  return FinanceCategoryType.BOTH;
};

const toApiCategoryType = (type: FinanceCategoryType): ApiCategory['type'] => {
  if (type === FinanceCategoryType.INCOME) return 'income';
  if (type === FinanceCategoryType.EXPENSE) return 'expense';
  return 'both';
};

const toDbTheme = (theme: ApiSettings['theme']): FinanceTheme => {
  if (theme === 'light') return FinanceTheme.LIGHT;
  if (theme === 'dark') return FinanceTheme.DARK;
  return FinanceTheme.SYSTEM;
};

const toApiTheme = (theme: FinanceTheme): ApiSettings['theme'] => {
  if (theme === FinanceTheme.LIGHT) return 'light';
  if (theme === FinanceTheme.DARK) return 'dark';
  return 'system';
};

const toApiRecurrence = (recurrence: FinanceRecurrence): ApiRecurrence => ({
  id: recurrence.id,
  type: toApiTxType(recurrence.type),
  amount: recurrence.amount,
  description: recurrence.description,
  categoryId: recurrence.categoryId,
  source: recurrence.source ?? undefined,
  frequency: recurrence.frequency === FinanceRecurrenceFrequency.MONTHLY ? 'monthly' : 'monthly',
  startDate: recurrence.startDate.toISOString(),
  isActive: recurrence.isActive,
  createAsPending: recurrence.createAsPending,
});

const toApiCategory = (category: FinanceCategory): ApiCategory => ({
  id: category.id,
  name: category.name,
  type: toApiCategoryType(category.type),
  icon: category.icon ?? undefined,
});

const toApiSettings = (settings: FinanceSettings): ApiSettings => ({
  isTither: settings.isTither,
  theme: toApiTheme(settings.theme),
});

financeMetaRouter.get('/finance-meta', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const [recurrences, categories, settings] = await Promise.all([
    prisma.financeRecurrence.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: [{ createdAt: 'asc' }],
    }),
    prisma.financeCategory.findMany({
      where: { tenantId: auth.tenantId },
      orderBy: [{ createdAt: 'asc' }],
    }),
    prisma.financeSettings.findUnique({
      where: { tenantId: auth.tenantId },
    }),
  ]);

  res.json({
    recurrences: recurrences.map(toApiRecurrence),
    categories: categories.map(toApiCategory),
    settings: settings ? toApiSettings(settings) : null,
  });
});

financeMetaRouter.put('/recurrences/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = recurrenceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  if (payload.id !== req.params.id) {
    res.status(400).json({ error: 'Route id must match body id' });
    return;
  }

  const saved = await prisma.financeRecurrence.upsert({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: payload.id,
      },
    },
    create: {
      id: payload.id,
      tenantId: auth.tenantId,
      type: toDbTxType(payload.type),
      amount: payload.amount,
      description: payload.description,
      categoryId: payload.categoryId,
      source: payload.source,
      frequency: FinanceRecurrenceFrequency.MONTHLY,
      startDate: new Date(payload.startDate),
      isActive: payload.isActive,
      createAsPending: payload.createAsPending,
    },
    update: {
      type: toDbTxType(payload.type),
      amount: payload.amount,
      description: payload.description,
      categoryId: payload.categoryId,
      source: payload.source,
      frequency: FinanceRecurrenceFrequency.MONTHLY,
      startDate: new Date(payload.startDate),
      isActive: payload.isActive,
      createAsPending: payload.createAsPending,
    },
  });

  res.json({ recurrence: toApiRecurrence(saved) });
});

financeMetaRouter.delete('/recurrences/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const existing = await prisma.financeRecurrence.findUnique({
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

  await prisma.financeRecurrence.delete({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: req.params.id,
      },
    },
  });

  res.status(204).send();
});

financeMetaRouter.put('/categories/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = categorySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;
  if (payload.id !== req.params.id) {
    res.status(400).json({ error: 'Route id must match body id' });
    return;
  }

  const saved = await prisma.financeCategory.upsert({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: payload.id,
      },
    },
    create: {
      id: payload.id,
      tenantId: auth.tenantId,
      name: payload.name,
      type: toDbCategoryType(payload.type),
      icon: payload.icon,
    },
    update: {
      name: payload.name,
      type: toDbCategoryType(payload.type),
      icon: payload.icon,
    },
  });

  res.json({ category: toApiCategory(saved) });
});

financeMetaRouter.delete('/categories/:id', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const existing = await prisma.financeCategory.findUnique({
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

  await prisma.financeCategory.delete({
    where: {
      tenantId_id: {
        tenantId: auth.tenantId,
        id: req.params.id,
      },
    },
  });

  res.status(204).send();
});

financeMetaRouter.put('/settings', async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = settingsSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const payload = parsed.data;

  const saved = await prisma.financeSettings.upsert({
    where: { tenantId: auth.tenantId },
    create: {
      tenantId: auth.tenantId,
      isTither: payload.isTither,
      theme: toDbTheme(payload.theme),
    },
    update: {
      isTither: payload.isTither,
      theme: toDbTheme(payload.theme),
    },
  });

  res.json({ settings: toApiSettings(saved) });
});
