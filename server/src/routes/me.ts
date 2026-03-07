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
  cnpj: z.string().optional(),
  razaoSocial: z.string().optional(),
});

const updateTenantSchema = z.object({
  name: z.string().min(2).optional(),
  cnpj: z.string().nullable().optional(),
  razaoSocial: z.string().nullable().optional(),
});

const refreshExpiryDate = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiry;
};

const toTenantShape = (tenant: { id: string; name: string; profileType: string; billingPlan: string; cnpj: string | null; razaoSocial: string | null }) => ({
  id: tenant.id,
  name: tenant.name,
  profileType: tenant.profileType as 'personal' | 'business',
  billingPlan: tenant.billingPlan,
  cnpj: tenant.cnpj ?? undefined,
  razaoSocial: tenant.razaoSocial ?? undefined,
});

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
      ...toTenantShape(membership.tenant),
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
      tenant: toTenantShape(membership.tenant),
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
    tenant: toTenantShape(targetMembership.tenant),
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

  if (parsed.data.profileType === 'business') {
    const currentTenant = await prisma.tenant.findUnique({
      where: { id: auth.tenantId },
      select: { billingPlan: true },
    });

    if (!currentTenant) {
      res.status(404).json({ error: 'Current tenant not found' });
      return;
    }

    if (currentTenant.billingPlan === 'free') {
      res.status(403).json({ error: 'Perfil PJ disponível apenas para planos pagos' });
      return;
    }
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
        name: parsed.data.name.trim(),
        profileType: parsed.data.profileType,
        cnpj: parsed.data.cnpj ?? null,
        razaoSocial: parsed.data.razaoSocial ?? null,
        ownerId: auth.userId,
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
    tenant: toTenantShape(created.tenant),
    role: created.membership.role,
    accessToken: created.accessToken,
    refreshToken: created.refreshToken,
  });
});

meRouter.patch('/me/tenant', requireAuth, async (req, res) => {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const parsed = updateTenantSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const membership = await prisma.membership.findUnique({
    where: { userId_tenantId: { userId: auth.userId, tenantId: auth.tenantId } },
  });

  if (!membership || membership.role === MembershipRole.MEMBER) {
    res.status(403).json({ error: 'Apenas OWNER ou ADMIN podem editar o perfil' });
    return;
  }

  const updated = await prisma.tenant.update({
    where: { id: auth.tenantId },
    data: {
      ...(parsed.data.name !== undefined && { name: parsed.data.name.trim() }),
      ...(parsed.data.cnpj !== undefined && { cnpj: parsed.data.cnpj }),
      ...(parsed.data.razaoSocial !== undefined && { razaoSocial: parsed.data.razaoSocial }),
    },
  });

  res.json({ tenant: toTenantShape(updated) });
});
