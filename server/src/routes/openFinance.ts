import { Router } from 'express';
import { z } from 'zod';
import { env } from '../config/env.js';
import { openFinanceClient } from '../lib/openFinance.js';
import { requireAuth } from '../middleware/auth.js';

export const openFinanceRouter = Router();

openFinanceRouter.use(requireAuth);

const itemIdSchema = z.object({
  itemId: z.string().min(1),
});

const transactionQuerySchema = z.object({
  accountId: z.string().min(1),
  from: z.string().optional(),
  to: z.string().optional(),
});

openFinanceRouter.get('/open-finance/status', async (_req, res) => {
  const configured = Boolean(env.PLUGGY_CLIENT_ID && env.PLUGGY_CLIENT_SECRET);
  const enabled = configured ? await openFinanceClient.isAvailable() : false;

  res.json({
    enabled,
  });
});

openFinanceRouter.post('/open-finance/connect-token', async (_req, res) => {
  try {
    const token = await openFinanceClient.getConnectToken();
    res.json(token);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Open Finance unavailable' });
  }
});

openFinanceRouter.get('/open-finance/connectors', async (_req, res) => {
  try {
    const connectors = await openFinanceClient.listConnectors();
    res.json({ results: connectors });
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Failed to list connectors' });
  }
});

openFinanceRouter.get('/open-finance/items/:itemId', async (req, res) => {
  const parsed = itemIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid item id' });
    return;
  }

  try {
    const item = await openFinanceClient.getItem(parsed.data.itemId);
    res.json(item);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Failed to get item' });
  }
});

openFinanceRouter.get('/open-finance/accounts', async (req, res) => {
  const itemId = String(req.query.itemId || '');
  if (!itemId) {
    res.status(400).json({ error: 'itemId is required' });
    return;
  }

  try {
    const accounts = await openFinanceClient.listAccounts(itemId);
    res.json(accounts);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Failed to list accounts' });
  }
});

openFinanceRouter.get('/open-finance/transactions', async (req, res) => {
  const parsed = transactionQuerySchema.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid query params' });
    return;
  }

  try {
    const transactions = await openFinanceClient.listTransactions(
      parsed.data.accountId,
      parsed.data.from,
      parsed.data.to
    );
    res.json(transactions);
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Failed to list transactions' });
  }
});

openFinanceRouter.delete('/open-finance/items/:itemId', async (req, res) => {
  const parsed = itemIdSchema.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid item id' });
    return;
  }

  try {
    await openFinanceClient.deleteItem(parsed.data.itemId);
    res.status(204).send();
  } catch (error) {
    res.status(503).json({ error: error instanceof Error ? error.message : 'Failed to delete item' });
  }
});