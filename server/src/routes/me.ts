import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';

export const meRouter = Router();

meRouter.get('/me', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId: auth.userId,
        tenantId: auth.tenantId,
      },
    },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!membership) {
    res.status(404).json({ error: 'Membership not found' });
    return;
  }

  res.json({
    user: {
      id: membership.user.id,
      email: membership.user.email,
      fullName: membership.user.fullName,
      createdAt: membership.user.createdAt,
    },
    tenant: {
      id: membership.tenant.id,
      name: membership.tenant.name,
      createdAt: membership.tenant.createdAt,
    },
    role: membership.role,
  });
});
