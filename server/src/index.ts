import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { healthRouter } from './routes/health.js';
import { authRouter } from './routes/auth.js';
import { meRouter } from './routes/me.js';
import { transactionsRouter } from './routes/transactions.js';
import { financeMetaRouter } from './routes/financeMeta.js';
import { billingRouter, handleMPWebhook } from './routes/billing.js';
import { adminRouter } from './routes/admin.js';
import { adminAuthRouter } from './routes/adminAuth.js';
import { openFinanceRouter } from './routes/openFinance.js';
import { invitesRouter } from './routes/invites.js';
import { membersRouter } from './routes/members.js';

const app = express();

const configuredOrigins = env.CORS_ORIGIN.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const localDevOrigins = [
  'http://localhost:8080',
  'http://localhost:8081',
  'http://127.0.0.1:8080',
  'http://127.0.0.1:8081',
];

const allowedOrigins = new Set([...configuredOrigins, ...localDevOrigins]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`Origin ${origin} is not allowed by Access-Control-Allow-Origin`));
    },
  })
);

app.post('/api/billing/webhook', express.json(), (req, res) => {
  void handleMPWebhook(req, res);
});

app.use(express.json());

app.use('/api', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api', meRouter);
app.use('/api', transactionsRouter);
app.use('/api', financeMetaRouter);
app.use('/api', openFinanceRouter);
app.use('/api', invitesRouter);
app.use('/api', membersRouter);
app.use('/api/billing', billingRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin', adminRouter);

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.listen(env.PORT, () => {
  console.log(`[server] running at http://localhost:${env.PORT}`);
});
