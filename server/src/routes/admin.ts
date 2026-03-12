import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

export const adminRouter = Router();

// ── Middleware: valida JWT admin OU x-admin-secret legado ────────────────────
adminRouter.use((req, res, next) => {
  // Suporte ao header legado x-admin-secret
  const legacySecret = req.headers['x-admin-secret'];
  if (legacySecret && legacySecret === env.ADMIN_SECRET) {
    next();
    return;
  }

  // JWT admin
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Acesso negado' });
    return;
  }

  try {
    const payload = jwt.verify(auth.slice(7), env.JWT_ACCESS_SECRET) as { role?: string };
    if (payload.role !== 'admin') {
      res.status(403).json({ error: 'Acesso negado' });
      return;
    }
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
});

// ── Schemas ───────────────────────────────────────────────────────────────────

const giftSchema = z.object({
  email: z.string().email(),
  planId: z.enum(['pro', 'enterprise']).default('pro'),
  days: z.coerce.number().int().positive().default(30),
});

const revokeSchema = z.object({ email: z.string().email() });
const blockSchema  = z.object({ email: z.string().email(), blocked: z.boolean() });

const affiliateSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  code: z.string().min(3).max(20).toUpperCase(),
  commissionRate: z.coerce.number().min(0).max(1).default(0.20),
  notes: z.string().optional(),
});

const affiliateUpdateSchema = affiliateSchema.partial().extend({
  status: z.enum(['active', 'inactive', 'suspended']).optional(),
});

const referralUpdateSchema = z.object({
  status: z.enum(['pending', 'confirmed', 'paid', 'cancelled']),
});

// ── GET /admin/dashboard ──────────────────────────────────────────────────────

adminRouter.get('/dashboard', async (_req, res) => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  const [
    totalUsers,
    newUsersThisMonth,
    newUsersLastMonth,
    activePro,
    activeEnterprise,
    activeGift,
    blockedUsers,
    totalAffiliates,
    pendingCommissions,
    topAffiliates,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
    prisma.user.count({ where: { memberships: { some: { role: 'OWNER', tenant: { billingPlan: 'pro', billingStatus: { not: 'gift' } } } } } }),
    prisma.user.count({ where: { memberships: { some: { role: 'OWNER', tenant: { billingPlan: 'enterprise', billingStatus: { not: 'gift' } } } } } }),
    prisma.user.count({ where: { memberships: { some: { role: 'OWNER', tenant: { billingStatus: 'gift', giftExpiry: { gt: now } } } } } }),
    prisma.user.count({ where: { isBlocked: true } }),
    prisma.affiliate.count({ where: { status: 'active' } }),
    prisma.affiliateReferral.aggregate({
      where: { status: 'confirmed' },
      _sum: { commissionAmount: true },
    }),
    prisma.affiliate.findMany({
      orderBy: { totalEarned: 'desc' },
      take: 5,
      select: { name: true, code: true, totalEarned: true, commissionRate: true,
        _count: { select: { referrals: true } } },
    }),
  ]);

  res.json({
    users: {
      total: totalUsers,
      newThisMonth: newUsersThisMonth,
      newLastMonth: newUsersLastMonth,
      growth: newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : null,
      blocked: blockedUsers,
    },
    plans: {
      free: totalUsers - activePro - activeEnterprise - activeGift,
      pro: activePro,
      enterprise: activeEnterprise,
      gift: activeGift,
    },
    affiliates: {
      active: totalAffiliates,
      pendingCommissions: pendingCommissions._sum.commissionAmount ?? 0,
      top: topAffiliates,
    },
  });
});

// ── GET /admin/users ──────────────────────────────────────────────────────────

adminRouter.get('/users', async (req, res) => {
  const { search, plan, status, page = '1', limit = '50' } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(limit);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { email: { contains: search, mode: 'insensitive' } },
      { fullName: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (status === 'blocked') where.isBlocked = true;
  if (status === 'active')  where.isBlocked = false;

  const tenantWhere: Record<string, unknown> = {};
  if (plan) tenantWhere.billingPlan = plan;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        memberships: {
          where: { role: 'OWNER' },
          include: { tenant: { select: {
            billingPlan: true, billingStatus: true, giftExpiry: true,
            mpSubscriptionId: true, createdAt: true,
          }}},
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.user.count({ where }),
  ]);

  res.json({
    total,
    page: Number(page),
    pages: Math.ceil(total / Number(limit)),
    users: users.map((u) => {
      const tenant = u.memberships[0]?.tenant;
      return {
        id: u.id,
        email: u.email,
        name: u.fullName,
        phone: u.phone,
        isBlocked: u.isBlocked,
        referralCode: u.referralCode,
        plan: tenant?.billingPlan ?? 'free',
        billingStatus: tenant?.billingStatus ?? null,
        giftExpiry: tenant?.giftExpiry ?? null,
        hasSubscription: Boolean(tenant?.mpSubscriptionId),
        createdAt: u.createdAt,
      };
    }),
  });
});

// ── GET /admin/debug-user?email=xxx ───────────────────────────────────────────
adminRouter.get('/debug-user', async (req, res) => {
  const email = String(req.query.email ?? '');
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { include: { tenant: true }, orderBy: { createdAt: 'asc' } } },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  res.json({
    userId: user.id,
    email: user.email,
    memberships: user.memberships.map((m) => ({
      role: m.role,
      tenantId: m.tenantId,
      tenantName: m.tenant.name,
      billingPlan: m.tenant.billingPlan,
      billingStatus: m.tenant.billingStatus,
      giftExpiry: m.tenant.giftExpiry,
      createdAt: m.createdAt,
    })),
    ownerTenant: user.memberships.find((m) => m.role === 'OWNER')?.tenantId ?? 'NONE',
  });
});

// ── POST /admin/force-plan ─────────────────────────────────────────────────────
adminRouter.post('/force-plan', async (req, res) => {
  const { email, plan = 'pro' } = req.body as { email: string; plan?: string };
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { role: 'OWNER' }, orderBy: { createdAt: 'asc' } } },
  });
  if (!user) { res.status(404).json({ error: 'User not found' }); return; }
  if (!user.memberships.length) { res.status(404).json({ error: 'No OWNER membership' }); return; }
  const giftExpiry = new Date();
  giftExpiry.setFullYear(giftExpiry.getFullYear() + 1);
  const updated = await Promise.all(user.memberships.map((m) =>
    prisma.tenant.update({
      where: { id: m.tenantId },
      data: { billingPlan: plan, billingStatus: 'gift', giftExpiry, mpSubscriptionId: null },
    })
  ));
  res.json({ ok: true, updated: updated.map((t) => ({ tenantId: t.id, billingPlan: t.billingPlan, giftExpiry: t.giftExpiry })) });
});

// ── DELETE /admin/delete-tenant ───────────────────────────────────────────────
adminRouter.delete('/delete-tenant', async (req, res) => {
  const { tenantId } = req.body as { tenantId: string };
  if (!tenantId) { res.status(400).json({ error: 'tenantId required' }); return; }
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
  if (!tenant) { res.status(404).json({ error: 'Tenant not found' }); return; }
  await prisma.tenant.delete({ where: { id: tenantId } });
  res.json({ ok: true, deleted: tenantId, name: tenant.name });
});

// ── POST /admin/gift ───────────────────────────────────────────────────────────

adminRouter.post('/gift', async (req, res) => {
  const parsed = giftSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const { email, planId, days } = parsed.data;
  const user = await prisma.user.findUnique({
    where: { email },
    include: { memberships: { where: { role: 'OWNER' }, take: 1 } },
  });

  if (!user) { res.status(404).json({ error: `Usuário não encontrado: ${email}` }); return; }
  if (!user.memberships[0]) { res.status(404).json({ error: 'Usuário sem tenant próprio' }); return; }

  const giftExpiry = new Date();
  giftExpiry.setDate(giftExpiry.getDate() + days);

  await prisma.tenant.update({
    where: { id: user.memberships[0].tenantId },
    data: { billingPlan: planId, billingStatus: 'gift', giftExpiry },
  });

  res.json({
    message: `✅ Plano ${planId} ativado para ${user.fullName} (${email})`,
    plan: planId, expiresAt: giftExpiry.toISOString(), days,
  });
});

// ── POST /admin/revoke ─────────────────────────────────────────────────────────

adminRouter.post('/revoke', async (req, res) => {
  const parsed = revokeSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Dados inválidos' }); return; }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email },
    include: { memberships: { where: { role: 'OWNER' }, take: 1 } },
  });

  if (!user) { res.status(404).json({ error: `Usuário não encontrado` }); return; }
  if (!user.memberships[0]) { res.status(404).json({ error: 'Sem tenant próprio' }); return; }

  await prisma.tenant.update({
    where: { id: user.memberships[0].tenantId },
    data: { billingPlan: 'free', billingStatus: null, giftExpiry: null },
  });

  res.json({ message: `✅ Plano de ${user.fullName} revertido para free` });
});

// ── POST /admin/block ──────────────────────────────────────────────────────────

adminRouter.post('/block', async (req, res) => {
  const parsed = blockSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Dados inválidos' }); return; }

  const { email, blocked } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }

  await prisma.user.update({ where: { email }, data: { isBlocked: blocked } });

  res.json({ message: `✅ Usuário ${blocked ? 'bloqueado' : 'desbloqueado'}: ${user.fullName}` });
});

// ── GET /admin/affiliates ──────────────────────────────────────────────────────

adminRouter.get('/affiliates', async (_req, res) => {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { referrals: true } },
      referrals: {
        where: { status: 'confirmed' },
        select: { commissionAmount: true },
      },
    },
  });

  res.json(affiliates.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    code: a.code,
    commissionRate: a.commissionRate,
    status: a.status,
    totalEarned: a.totalEarned,
    totalPaid: a.totalPaid,
    pendingCommission: a.referrals.reduce((s, r) => s + r.commissionAmount, 0),
    totalReferrals: a._count.referrals,
    notes: a.notes,
    createdAt: a.createdAt,
  })));
});

// ── POST /admin/affiliates ─────────────────────────────────────────────────────

adminRouter.post('/affiliates', async (req, res) => {
  const parsed = affiliateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const existing = await prisma.affiliate.findFirst({
    where: { OR: [{ email: parsed.data.email }, { code: parsed.data.code }] },
  });
  if (existing) {
    res.status(409).json({ error: 'Email ou código já em uso' });
    return;
  }

  // Vincula ao usuário se existir
  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });

  const affiliate = await prisma.affiliate.create({
    data: { ...parsed.data, userId: user?.id ?? null },
  });

  res.status(201).json(affiliate);
});

// ── PATCH /admin/affiliates/:id ────────────────────────────────────────────────

adminRouter.patch('/affiliates/:id', async (req, res) => {
  const parsed = affiliateUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos', details: parsed.error.flatten() });
    return;
  }

  const affiliate = await prisma.affiliate.findUnique({ where: { id: req.params.id } });
  if (!affiliate) { res.status(404).json({ error: 'Afiliado não encontrado' }); return; }

  const updated = await prisma.affiliate.update({
    where: { id: req.params.id },
    data: parsed.data,
  });

  res.json(updated);
});

// ── GET /admin/affiliates/:id/referrals ───────────────────────────────────────

adminRouter.get('/affiliates/:id/referrals', async (req, res) => {
  const referrals = await prisma.affiliateReferral.findMany({
    where: { affiliateId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json(referrals);
});

// ── PATCH /admin/affiliates/referrals/:id ─────────────────────────────────────
// Confirmar ou marcar como pago

adminRouter.patch('/affiliates/referrals/:id', async (req, res) => {
  const parsed = referralUpdateSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: 'Dados inválidos' }); return; }

  const referral = await prisma.affiliateReferral.findUnique({ where: { id: req.params.id } });
  if (!referral) { res.status(404).json({ error: 'Indicação não encontrada' }); return; }

  const now = new Date();
  const data: Record<string, unknown> = { status: parsed.data.status };
  if (parsed.data.status === 'confirmed') data.confirmedAt = now;
  if (parsed.data.status === 'paid') {
    data.paidAt = now;
    // Atualiza totalPaid do afiliado
    await prisma.affiliate.update({
      where: { id: referral.affiliateId },
      data: { totalPaid: { increment: referral.commissionAmount } },
    });
  }

  const updated = await prisma.affiliateReferral.update({
    where: { id: req.params.id },
    data,
  });

  res.json(updated);
});
