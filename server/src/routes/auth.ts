import { MembershipRole } from '@prisma/client';
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import {
  createAccessToken,
  createRefreshToken,
  newTokenId,
  verifyRefreshToken,
} from '../lib/jwt.js';
import { env } from '../config/env.js';

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  password: z.string().min(8),
  tenantName: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

const refreshExpiryDate = () => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiry;
};

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { email, fullName, password, tenantName } = parsed.data;
  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    res.status(409).json({ error: 'E-mail already in use' });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: { email, fullName, passwordHash },
    });

    const tenant = await tx.tenant.create({
      data: { name: tenantName },
    });

    const membership = await tx.membership.create({
      data: {
        userId: user.id,
        tenantId: tenant.id,
        role: MembershipRole.OWNER,
      },
    });

    const tokenId = newTokenId();
    await tx.refreshToken.create({
      data: {
        tokenId,
        userId: user.id,
        tenantId: tenant.id,
        expiresAt: refreshExpiryDate(),
      },
    });

    const accessToken = createAccessToken({
      userId: user.id,
      tenantId: tenant.id,
      role: membership.role,
    });

    const refreshToken = createRefreshToken({
      tokenId,
      userId: user.id,
      tenantId: tenant.id,
    });

    return { user, tenant, membership, accessToken, refreshToken };
  });

  res.status(201).json({
    user: {
      id: result.user.id,
      email: result.user.email,
      fullName: result.user.fullName,
    },
    tenant: {
      id: result.tenant.id,
      name: result.tenant.name,
    },
    accessToken: result.accessToken,
    refreshToken: result.refreshToken,
  });
});

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      memberships: {
        include: {
          tenant: true,
        },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isValidPassword = await bcrypt.compare(password, user.passwordHash);
  if (!isValidPassword) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const membership = user.memberships[0];
  if (!membership) {
    res.status(403).json({ error: 'User has no tenant membership' });
    return;
  }

  const tokenId = newTokenId();
  await prisma.refreshToken.create({
    data: {
      tokenId,
      userId: user.id,
      tenantId: membership.tenantId,
      expiresAt: refreshExpiryDate(),
    },
  });

  const accessToken = createAccessToken({
    userId: user.id,
    tenantId: membership.tenantId,
    role: membership.role,
  });

  const refreshToken = createRefreshToken({
    tokenId,
    userId: user.id,
    tenantId: membership.tenantId,
  });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    },
    tenant: {
      id: membership.tenant.id,
      name: membership.tenant.name,
      role: membership.role,
    },
    accessToken,
    refreshToken,
  });
});

authRouter.post('/refresh', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);

    const stored = await prisma.refreshToken.findUnique({
      where: { tokenId: payload.tokenId },
    });

    if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }

    await prisma.refreshToken.update({
      where: { tokenId: payload.tokenId },
      data: { revokedAt: new Date() },
    });

    const membership = await prisma.membership.findUnique({
      where: {
        userId_tenantId: {
          userId: payload.userId,
          tenantId: payload.tenantId,
        },
      },
    });

    if (!membership) {
      res.status(403).json({ error: 'Membership not found' });
      return;
    }

    const newId = newTokenId();
    await prisma.refreshToken.create({
      data: {
        tokenId: newId,
        userId: payload.userId,
        tenantId: payload.tenantId,
        expiresAt: refreshExpiryDate(),
      },
    });

    const accessToken = createAccessToken({
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: membership.role,
    });

    const refreshToken = createRefreshToken({
      tokenId: newId,
      userId: payload.userId,
      tenantId: payload.tenantId,
    });

    res.json({ accessToken, refreshToken });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

authRouter.post('/logout', async (req, res) => {
  const parsed = refreshSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid payload', details: parsed.error.flatten() });
    return;
  }

  try {
    const payload = verifyRefreshToken(parsed.data.refreshToken);
    await prisma.refreshToken.updateMany({
      where: {
        tokenId: payload.tokenId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    res.status(204).send();
  } catch {
    res.status(204).send();
  }
});
