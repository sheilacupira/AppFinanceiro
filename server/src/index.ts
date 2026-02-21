import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { transactionsRouter } from './routes/transactions.js';
import { financeMetaRouter } from './routes/financeMeta.js';
import { billingRouter, handleStripeWebhook, stripeWebhookHandler } from './routes/billing.js';

const app = express();

app.use(cors({ origin: env.CORS_ORIGIN }));

app.post('/api/billing/webhook', stripeWebhookHandler, (req, res) => {
  void handleStripeWebhook(req, res);
});

app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', meRouter);
app.use('/api', transactionsRouter);
app.use('/api', financeMetaRouter);
app.use('/api/billing', billingRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(env.PORT, () => {
  console.log(`[server] running at http://localhost:${env.PORT}`);
});
