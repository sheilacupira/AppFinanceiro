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
  MP_ACCESS_TOKEN: z.string().optional(),
  MP_WEBHOOK_SECRET: z.string().optional(),
  MP_PRICE_PRO_MONTHLY: z.coerce.number().default(29.90),
  MP_PRICE_PRO_YEARLY: z.coerce.number().default(299.00),
  MP_PRICE_ENTERPRISE_MONTHLY: z.coerce.number().default(99.90),
  MP_PRICE_ENTERPRISE_YEARLY: z.coerce.number().default(999.00),
  BILLING_PORTAL_RETURN_URL: z.string().default('http://localhost:8080/config'),
  PLUGGY_CLIENT_ID: z.string().optional(),
  PLUGGY_CLIENT_SECRET: z.string().optional(),
  // URL pública do app (usada para montar o link de reset)
  APP_URL: z.string().default('http://localhost:8080'),
  // SMTP (opcional — se não configurado, link é logado no console)
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('no-reply@appfinanceiro.app'),
  // Admin
  ADMIN_EMAIL: z.string().email().default('sheilacupira@gmail.com'),
  ADMIN_SECRET: z.string().min(8).default('change-me-in-production'),
  // WhatsApp — Evolution API
  EVOLUTION_API_URL: z.string().optional(),
  EVOLUTION_NAME: z.string().optional(),
  EVOLUTION_KEY: z.string().optional(),
});

export const env = envSchema.parse(process.env);
