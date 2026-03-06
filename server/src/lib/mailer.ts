/**
 * Mailer
 * Wrapper sobre nodemailer com fallback de desenvolvimento.
 *
 * - Se SMTP_HOST estiver configurado → envia e-mail real.
 * - Caso contrário → imprime o link no console (modo dev / sem SMTP).
 */

import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const isSmtpConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

const transporter = isSmtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    })
  : null;

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendMail(options: SendMailOptions): Promise<void> {
  if (transporter) {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } else {
    // Modo sem SMTP — imprime no console para desenvolvimento
    console.log('\n────── [MAILER DEV] ──────────────────────────────');
    console.log(`To:      ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.text ?? options.html}`);
    console.log('──────────────────────────────────────────────────\n');
  }
}

export function buildPasswordResetEmail(resetUrl: string, fullName: string): Pick<SendMailOptions, 'subject' | 'html' | 'text'> {
  return {
    subject: 'Recuperação de senha — Financeiro',
    text: `Olá, ${fullName}!\n\nClique no link abaixo para redefinir sua senha (válido por 1 hora):\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px 24px;background:#fff;border-radius:12px">
        <h2 style="margin:0 0 8px">Recuperação de senha</h2>
        <p style="color:#555;margin:0 0 24px">Olá, <strong>${fullName}</strong>! Clique no botão abaixo para redefinir sua senha. O link expira em <strong>1 hora</strong>.</p>
        <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
          Redefinir senha
        </a>
        <p style="color:#aaa;font-size:12px;margin:24px 0 0">Se você não solicitou isso, ignore este e-mail.<br>Link: ${resetUrl}</p>
      </div>
    `,
  };
}
