import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  const token = header.replace('Bearer ', '');

  try {
    const payload = verifyAccessToken(token);
    req.auth = {
      userId: payload.userId,
      tenantId: payload.tenantId,
      role: payload.role,
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
