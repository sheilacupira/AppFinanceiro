import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { env } from '../config/env.js';

export type AccessTokenPayload = {
  userId: string;
  tenantId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER';
};

export type RefreshTokenPayload = {
  tokenId: string;
  userId: string;
  tenantId: string;
};

export const createAccessToken = (payload: AccessTokenPayload): string => {
  const expiresIn = env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn,
    subject: payload.userId,
  });
};

export const createRefreshToken = (payload: RefreshTokenPayload): string => {
  const expiresIn = `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions['expiresIn'];
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn,
    subject: payload.userId,
  });
};

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
};

export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
};

export const newTokenId = (): string => crypto.randomUUID();
