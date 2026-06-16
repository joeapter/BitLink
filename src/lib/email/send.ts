// Transactional email via Migadu SMTP.
//
// Required env vars (set in Vercel dashboard, never in code):
//   SMTP_HOST     = smtp.migadu.com
//   SMTP_PORT     = 465
//   SMTP_USER     = orders@bitlink.co.il
//   SMTP_PASSWORD = <password from Migadu>
//   SMTP_FROM     = BitLink <orders@bitlink.co.il>   (optional override)

import nodemailer from 'nodemailer';
import { logger } from '@/lib/logger';

const log = logger.child({ module: 'email' });

function getTransport(): nodemailer.Transporter | null {
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;

  if (!host || !user || !pass) {
    log.warn('SMTP_HOST / SMTP_USER / SMTP_PASSWORD not set — emails disabled');
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(process.env.SMTP_PORT ?? '465', 10),
    secure: true,   // TLS on port 465
    auth: { user, pass },
  });
}

const FROM = process.env.SMTP_FROM ?? 'BitLink <orders@bitlink.co.il>';

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<boolean> {
  const transport = getTransport();
  if (!transport) return false;

  try {
    await transport.sendMail({
      from: FROM,
      to: params.to,
      subject: params.subject,
      html: params.html,
      replyTo: params.replyTo ?? 'support@bitlink.co.il',
    });

    log.info({ to: params.to, subject: params.subject }, 'Email sent via Migadu');
    return true;
  } catch (err) {
    log.error({ error: err instanceof Error ? err.message : String(err), to: params.to }, 'Email send failed');
    return false;
  }
}
