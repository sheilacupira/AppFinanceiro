/**
 * Mailer — envio de emails via SMTP (nodemailer)
 * Se as variáveis de SMTP não estiverem configuradas, o link é logado no console
 * para que o admin possa visualizar no Railway Logs.
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

function createTransport() {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export async function sendPasswordResetEmail(
  to: string,
  name: string,
  resetUrl: string,
): Promise<void> {
  const transport = createTransport();

  if (!transport) {
    // Sem SMTP configurado — loga no console (visível no Railway Logs)
    console.warn(`[MAILER] SMTP não configurado. Link de reset para ${to}:`);
    console.warn(`[MAILER] ${resetUrl}`);
    return;
  }

  const from = env.SMTP_FROM || env.SMTP_USER!;

  await transport.sendMail({
    from: `"Financeiro App" <${from}>`,
    to,
    subject: 'Redefinição de senha — Financeiro',
    text: `Olá ${name},\n\nVocê solicitou a redefinição da sua senha.\n\nClique no link abaixo (válido por 1 hora):\n${resetUrl}\n\nSe não foi você, ignore este email.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2 style="color:#111">Redefinição de senha</h2>
        <p>Olá, <strong>${name}</strong>!</p>
        <p>Clique no botão abaixo para redefinir sua senha. O link é válido por <strong>1 hora</strong>.</p>
        <p style="margin:28px 0">
          <a href="${resetUrl}"
             style="background:#6366f1;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">
            Redefinir senha
          </a>
        </p>
        <p style="color:#888;font-size:13px">Ou copie e cole este link no navegador:<br>${resetUrl}</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
        <p style="color:#bbb;font-size:12px">Se não foi você quem solicitou, ignore este email. Sua senha não será alterada.</p>
      </div>
    `,
  });
}
