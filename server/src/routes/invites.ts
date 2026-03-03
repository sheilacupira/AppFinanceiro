import { Router } from 'express';
import { MembershipRole } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const invitesRouter = Router();

const INVITE_TTL_DAYS = 7;

const createInviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});

const inviteExpiryDate = () => {
  const d = new Date();
  d.setDate(d.getDate() + INVITE_TTL_DAYS);
  return d;
};

// POST /api/me/invites — create invite (OWNER or ADMIN only)
invitesRouter.post('/me/invites', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const parsed = createInviteSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  // Only OWNER or ADMIN can invite
  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });
  if (!membership || membership.role === MembershipRole.MEMBER) {
    res.status(403).json({ error: 'Apenas OWNER ou ADMIN podem convidar colaboradores' });
    return;
  }

  // ADMIN cannot invite another ADMIN
  if (membership.role === MembershipRole.ADMIN && parsed.data.role === 'ADMIN') {
    res.status(403).json({ error: 'ADMIN só pode convidar MEMBERs' });
    return;
  }

  // Check if user is already a member
  const existingUser = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existingUser) {
    const alreadyMember = await prisma.membership.findUnique({
      where: { userId_tenantId: { userId: existingUser.id, tenantId: auth.tenantId } },
    });
    if (alreadyMember) {
      res.status(409).json({ error: 'Usuário já é membro desta equipe' });
      return;
    }
  }

  // Check plan limits: free = 1 member (OWNER only)
  const tenant = await prisma.tenant.findUnique({
    where: { id: auth.tenantId },
    select: { billingPlan: true },
  });
  if (tenant?.billingPlan === 'free') {
    res.status(403).json({ error: 'Convite de colaboradores disponível apenas em planos pagos' });
    return;
  }

  const invite = await prisma.tenantInvite.create({
    data: {
      tenantId: auth.tenantId,
      invitedBy: auth.userId,
      email: parsed.data.email,
      role: parsed.data.role,
      expiresAt: inviteExpiryDate(),
    },
    include: { tenant: { select: { name: true } } },
  });

  const inviteUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:8080'}/invite/${invite.token}`;

  res.status(201).json({
    invite: {
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt,
      inviteUrl,
    },
  });
});

// GET /api/me/invites — list pending invites for current tenant
invitesRouter.get('/me/invites', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });
  if (!membership || membership.role === MembershipRole.MEMBER) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const invites = await prisma.tenantInvite.findMany({
    where: { tenantId: auth.tenantId, acceptedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ invites: invites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    expiresAt: inv.expiresAt,
    createdAt: inv.createdAt,
  })) });
});

// DELETE /api/me/invites/:id — cancel invite
invitesRouter.delete('/me/invites/:id', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });
  if (!membership || membership.role === MembershipRole.MEMBER) {
    res.status(403).json({ error: 'Acesso negado' });
    return;
  }

  const invite = await prisma.tenantInvite.findFirst({
    where: { id: req.params.id, tenantId: auth.tenantId },
  });
  if (!invite) { res.status(404).json({ error: 'Convite não encontrado' }); return; }

  await prisma.tenantInvite.delete({ where: { id: invite.id } });
  res.json({ ok: true });
});

// GET /api/invites/:token — public: get invite info
invitesRouter.get('/invites/:token', async (req, res) => {
  const invite = await prisma.tenantInvite.findUnique({
    where: { token: req.params.token },
    include: {
      tenant: { select: { name: true, profileType: true } },
    },
  });

  if (!invite) { res.status(404).json({ error: 'Convite não encontrado' }); return; }
  if (invite.acceptedAt) { res.status(410).json({ error: 'Este convite já foi utilizado' }); return; }
  if (invite.expiresAt < new Date()) { res.status(410).json({ error: 'Este convite expirou' }); return; }

  // Get inviter name
  const inviter = await prisma.user.findUnique({
    where: { id: invite.invitedBy },
    select: { fullName: true },
  });

  res.json({
    invite: {
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      tenant: { name: invite.tenant.name, profileType: invite.tenant.profileType },
      inviterName: inviter?.fullName ?? 'Alguém',
    },
  });
});

// POST /api/invites/:token/accept — authenticated user accepts invite
invitesRouter.post('/invites/:token/accept', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const invite = await prisma.tenantInvite.findUnique({
    where: { token: req.params.token },
    include: { tenant: true },
  });

  if (!invite) { res.status(404).json({ error: 'Convite não encontrado' }); return; }
  if (invite.acceptedAt) { res.status(410).json({ error: 'Este convite já foi utilizado' }); return; }
  if (invite.expiresAt < new Date()) { res.status(410).json({ error: 'Este convite expirou' }); return; }

  // Verify accepting user email matches invite email
  const user = await prisma.user.findUnique({ where: { id: auth.userId } });
  if (!user) { res.status(404).json({ error: 'Usuário não encontrado' }); return; }
  if (user.email !== invite.email) {
    res.status(403).json({ error: `Este convite é para ${invite.email}. Faça login com esse e-mail para aceitar.` });
    return;
  }

  // Check if already member
  const existing = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: invite.tenantId } },
  });
  if (existing) {
    res.status(409).json({ error: 'Você já é membro desta equipe' });
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.membership.create({
      data: {
        userId: auth.userId,
        tenantId: invite.tenantId,
        role: invite.role as MembershipRole,
      },
    });
    await tx.tenantInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
  });

  res.json({ ok: true, tenantId: invite.tenantId, tenantName: invite.tenant.name });
});
