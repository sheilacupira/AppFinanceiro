import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CORS_ORIGIN: z.string().default('http://localhost:8080,http://localhost:8081'),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(16),
  JWT_REFRESH_SECRET: z.string().min(16),
  ACCESS_TOKEN_TTL: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PRO_YEARLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_MONTHLY: z.string().optional(),
  STRIPE_PRICE_ENTERPRISE_YEARLY: z.string().optional(),
  BILLING_PORTAL_RETURN_URL: z.string().default('http://localhost:8080/config'),
  PLUGGY_CLIENT_ID: z.string().optional(),
  PLUGGY_CLIENT_SECRET: z.string().optional(),
  // E-mail para recuperação de senha
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('no-reply@appfinanceiro.app'),
  // URL pública do app (usada para montar o link de reset)
  APP_URL: z.string().default('http://localhost:8080'),
  // WhatsApp — Evolution API
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_NAME: z.string().optional(),
  EVOLUTION_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
