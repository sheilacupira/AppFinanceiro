import { Router } from 'express';
import { MembershipRole } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const membersRouter = Router();

const updateRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});

// GET /api/me/members — list all members of current tenant
membersRouter.get('/me/members', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const memberships = await prisma.membership.findMany({
    where: { tenantId: auth.tenantId },
    include: { user: { select: { id: true, email: true, fullName: true } } },
    orderBy: { createdAt: 'asc' },
  });

  res.json({
    members: memberships.map((m) => ({
      userId: m.userId,
      email: m.user.email,
      fullName: m.user.fullName,
      role: m.role,
      isCurrentUser: m.userId === auth.userId,
      joinedAt: m.createdAt,
    })),
  });
});

// PATCH /api/me/members/:userId/role — change member role (OWNER only)
membersRouter.patch('/me/members/:userId/role', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const callerMembership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });
  if (!callerMembership || callerMembership.role !== MembershipRole.OWNER) {
    res.status(403).json({ error: 'Apenas o OWNER pode alterar papéis' });
    return;
  }

  if (req.params.userId === auth.userId) {
    res.status(400).json({ error: 'Você não pode alterar seu próprio papel' });
    return;
  }

  const parsed = updateRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const target = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: req.params.userId, tenantId: auth.tenantId } },
  });
  if (!target) { res.status(404).json({ error: 'Membro não encontrado' }); return; }
  if (target.role === MembershipRole.OWNER) {
    res.status(400).json({ error: 'Não é possível alterar o papel do OWNER' });
    return;
  }

  const updated = await prisma.membership.update({
    where: { userId_tenantId: { userId: req.params.userId, tenantId: auth.tenantId } },
    data: { role: parsed.data.role as MembershipRole },
    include: { user: { select: { email: true, fullName: true } } },
  });

  res.json({
    member: {
      userId: updated.userId,
      email: updated.user.email,
      fullName: updated.user.fullName,
      role: updated.role,
    },
  });
});

// DELETE /api/me/members/:userId — remove member (OWNER) or leave (self)
membersRouter.delete('/me/members/:userId', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) { res.status(401).json({ error: 'Unauthorized' }); return; }

  const callerMembership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });
  if (!callerMembership) { res.status(403).json({ error: 'Acesso negado' }); return; }

  const isSelf = req.params.userId === auth.userId;
  const isOwner = callerMembership.role === MembershipRole.OWNER;

  if (!isSelf && !isOwner) {
    res.status(403).json({ error: 'Apenas o OWNER pode remover outros membros' });
    return;
  }

  const target = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: req.params.userId, tenantId: auth.tenantId } },
  });
  if (!target) { res.status(404).json({ error: 'Membro não encontrado' }); return; }

  if (target.role === MembershipRole.OWNER) {
    res.status(400).json({ error: 'O OWNER não pode ser removido da equipe' });
    return;
  }

  await prisma.membership.delete({
    where: { userId_tenantId: { userId: req.params.userId, tenantId: auth.tenantId } },
  });

  res.json({ ok: true });
});
