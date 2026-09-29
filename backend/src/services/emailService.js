import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export async function sendPasswordResetEmail({ email, resetUrl }) {
  if (!env.SMTP_HOST) {
    console.info(`Password reset link for ${email}: ${resetUrl}`);
    return;
  }

  const transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE,
    ...(env.SMTP_USER ? { auth: { user: env.SMTP_USER, pass: env.SMTP_PASS } } : {})
  });

  await transport.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Reset your SlotWise password',
    text: `Use this link to reset your password. It expires in 30 minutes: ${resetUrl}`,
    html: `<p>Use the link below to reset your SlotWise password. It expires in 30 minutes.</p><p><a href="${resetUrl}">Reset password</a></p>`
  });
}