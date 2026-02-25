import { Router } from 'express';
import { MembershipRole } from '@prisma/client';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { createAccessToken, createRefreshToken, newTokenId } from '../lib/jwt.js';

export const meRouter = Router();

const switchTenantSchema = z.object({
  tenantId: z.string().min(1),
});

const createTenantSchema = z.object({
  name: z.string().min(2),
  profileType: z.enum(['personal', 'business']),
});

const PERSONAL_PREFIX = 'PF:';
const BUSINESS_PREFIX = 'PJ:';

const refreshExpiryDate = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiry;
};

const withTenantPrefix = (name: string, profileType: 'personal' | 'business'): string => {
  const prefix = profileType === 'personal' ? PERSONAL_PREFIX : BUSINESS_PREFIX;
  return `${prefix} ${name.trim()}`;
};

const toProfileType = (tenantName: string): 'personal' | 'business' => {
  return tenantName.startsWith(PERSONAL_PREFIX) ? 'personal' : 'business';
};

const toDisplayName = (tenantName: string): string => {
  if (tenantName.startsWith(PERSONAL_PREFIX)) {
    return tenantName.replace(PERSONAL_PREFIX, '').trim();
  }
  if (tenantName.startsWith(BUSINESS_PREFIX)) {
    return tenantName.replace(BUSINESS_PREFIX, '').trim();
  }
  return tenantName;
};

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
      name: toDisplayName(membership.tenant.name),
      profileType: toProfileType(membership.tenant.name),
      createdAt: membership.tenant.createdAt,
    },
    role: membership.role,
  });
});

meRouter.get('/me/memberships', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const memberships = await prisma.membership.findMany({
    where: {
      userId: auth.userId,
    },
    include: {
      tenant: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
  });

  res.json({
    memberships: memberships.map((membership) => ({
      tenant: {
        id: membership.tenant.id,
        name: toDisplayName(membership.tenant.name),
        profileType: toProfileType(membership.tenant.name),
      },
      role: membership.role,
      isCurrent: membership.tenantId === auth.tenantId,
    })),
  });
});

meRouter.post('/me/switch-tenant', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = switchTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const targetMembership = await prisma.membership.findUnique({
    where: {
      userId_tenantId: {
        userId: auth.userId,
        tenantId: parsed.data.tenantId,
      },
    },
    include: {
      user: true,
      tenant: true,
    },
  });

  if (!targetMembership) {
    res.status(403).json({ error: 'Tenant access denied' });
    return;
  }

  const tokenId = newTokenId();
  await prisma.refreshToken.create({
    data: {
      tokenId,
      userId: targetMembership.userId,
      tenantId: targetMembership.tenantId,
      expiresAt: refreshExpiryDate(),
    },
  });

  const accessToken = createAccessToken({
    userId: targetMembership.userId,
    tenantId: targetMembership.tenantId,
    role: targetMembership.role,
  });

  const refreshToken = createRefreshToken({
    tokenId,
    userId: targetMembership.userId,
    tenantId: targetMembership.tenantId,
  });

  res.json({
    user: {
      id: targetMembership.user.id,
      email: targetMembership.user.email,
      fullName: targetMembership.user.fullName,
    },
    tenant: {
      id: targetMembership.tenant.id,
      name: toDisplayName(targetMembership.tenant.name),
      profileType: toProfileType(targetMembership.tenant.name),
    },
    role: targetMembership.role,
    accessToken,
    refreshToken,
  });
});

meRouter.post('/me/tenants', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = createTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: auth.userId },
  });

  if (!existingUser) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const created = await prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({
      data: {
        name: withTenantPrefix(parsed.data.name, parsed.data.profileType),
      },
    });

    const membership = await tx.membership.create({
      data: {
        userId: auth.userId,
        tenantId: tenant.id,
        role: MembershipRole.OWNER,
      },
    });

    const tokenId = newTokenId();
    await tx.refreshToken.create({
      data: {
        tokenId,
        userId: auth.userId,
        tenantId: tenant.id,
        expiresAt: refreshExpiryDate(),
      },
    });

    const accessToken = createAccessToken({
      userId: auth.userId,
      tenantId: tenant.id,
      role: membership.role,
    });

    const refreshToken = createRefreshToken({
      tokenId,
      userId: auth.userId,
      tenantId: tenant.id,
    });

    return { tenant, membership, accessToken, refreshToken };
  });

  res.status(201).json({
    user: {
      id: existingUser.id,
      email: existingUser.email,
      fullName: existingUser.fullName,
    },
    tenant: {
      id: created.tenant.id,
      name: toDisplayName(created.tenant.name),
      profileType: toProfileType(created.tenant.name),
    },
    role: created.membership.role,
    accessToken: created.accessToken,
    refreshToken: created.refreshToken,
  });
});
