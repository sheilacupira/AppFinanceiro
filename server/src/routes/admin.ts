import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

export const adminRouter = Router();

// ── Middleware: valida ADMIN_SECRET no header x-admin-secret ─────────────────
adminRouter.use((req, res, next) => {
  const secret = req.headers['x-admin-secret'];
  if (!secret || secret !== env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Acesso negado' });
    return;
  }
  next();
});

// ── Schemas ───────────────────────────────────────────────────────────────────

const giftSchema = z.object({
  email: z.string().email(),
  planId: z.enum(['pro', 'enterprise']).default('pro'),
  days: z.coerce.number().int().positive().default(30),
});

const revokeSchema = z.object({
  email: z.string().email(),
});

// ── POST /admin/gift ───────────────────────────────────────────────────────────
// Dá um plano de presente para o usuário pelo email, sem pagamento

adminRouter.post('/gift', async (req, res) => {
  const parsed = giftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const { email, planId, days } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: { tenant: true },
        where: { role: 'OWNER' },
        take: 1,
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: `Usuário não encontrado: ${email}` });
    return;
  }

  const membership = user.memberships[0];
  if (!membership) {
    res.status(404).json({ error: 'Usuário não tem tenant próprio' });
    return;
  }

  const giftExpiry = new Date();
  giftExpiry.setDate(giftExpiry.getDate() + days);

  await prisma.tenant.update({
    where: { id: membership.tenantId },
    data: {
      billingPlan: planId,
      billingStatus: 'gift',
      giftExpiry,
    },
  });

  res.json({
    message: `✅ Plano ${planId} ativado para ${user.fullName} (${email})`,
    plan: planId,
    expiresAt: giftExpiry.toISOString(),
    days,
  });
});

// ── POST /admin/revoke ────────────────────────────────────────────────────────
// Remove o presente e volta para o plano free

adminRouter.post('/revoke', async (req, res) => {
  const parsed = revokeSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: {
      memberships: {
        where: { role: 'OWNER' },
        take: 1,
      },
    },
  });

  if (!user) {
    res.status(404).json({ error: `Usuário não encontrado: ${parsed.data.email}` });
    return;
  }

  const membership = user.memberships[0];
  if (!membership) {
    res.status(404).json({ error: 'Usuário não tem tenant próprio' });
    return;
  }

  await prisma.tenant.update({
    where: { id: membership.tenantId },
    data: {
      billingPlan: 'free',
      billingStatus: null,
      giftExpiry: null,
    },
  });

  res.json({ message: `✅ Plano de ${user.fullName} (${parsed.data.email}) revertido para free` });
});

// ── GET /admin/users ──────────────────────────────────────────────────────────
// Lista todos os usuários com seus planos atuais

adminRouter.get('/users', async (_req, res) => {
  const users = await prisma.user.findMany({
    include: {
      memberships: {
        where: { role: 'OWNER' },
        include: { tenant: true },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json(
    users.map((u) => {
      const tenant = u.memberships[0]?.tenant;
      return {
        email: u.email,
        name: u.fullName,
        plan: tenant?.billingPlan ?? 'free',
        status: tenant?.billingStatus ?? null,
        giftExpiry: tenant?.giftExpiry ?? null,
        createdAt: u.createdAt,
      };
    }),
  );
});
