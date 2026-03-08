import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';

export const adminAuthRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/admin/auth/login
adminAuthRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Dados inválidos' });
    return;
  }

  const emailNorm = parsed.data.email.trim().toLowerCase();
  const { password } = parsed.data;

  // Só o email configurado pode entrar
  if (emailNorm !== env.ADMIN_EMAIL.toLowerCase()) {
    res.status(401).json({ error: 'Credenciais inválidas' });
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { email: emailNorm } });
    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Credenciais inválidas' });
      return;
    }

    const token = jwt.sign(
      { role: 'admin', userId: user.id, email: user.email },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '12h' },
    );

    res.json({
      token,
      name: user.fullName,
      email: user.email,
      expiresIn: 43200,
    });
  } catch (err) {
    console.error('[adminAuth] login error:', err);
    res.status(500).json({ error: 'Erro interno. Tente novamente.' });
  }
});
