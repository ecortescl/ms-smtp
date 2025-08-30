import nodemailer from 'nodemailer';

let transporter;

function getBoolEnv(name, def = false) {
  const v = process.env[name];
  if (v === undefined) return def;
  return ['1', 'true', 'yes', 'y', 'on'].includes(String(v).toLowerCase());
}

export function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587;
  const secure = process.env.SMTP_SECURE ? getBoolEnv('SMTP_SECURE') : port === 465;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host) throw new Error('SMTP_HOST not configured');

  const auth = user ? { user, pass } : undefined;

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth,
    pool: getBoolEnv('SMTP_POOL', true),
    maxConnections: process.env.SMTP_MAX_CONNECTIONS ? Number(process.env.SMTP_MAX_CONNECTIONS) : 5,
    maxMessages: process.env.SMTP_MAX_MESSAGES ? Number(process.env.SMTP_MAX_MESSAGES) : 100,
    tls: getBoolEnv('SMTP_TLS_REJECT_UNAUTH', true)
      ? { rejectUnauthorized: true }
      : { rejectUnauthorized: false },
  });

  return transporter;
}

export async function sendMail({ from, to, subject, html, text, cc, bcc, replyTo, attachments }) {
  const defaultFrom = process.env.SMTP_FROM_DEFAULT;
  const mailFrom = from || defaultFrom;
  if (!mailFrom) throw new Error('Missing sender. Provide from or set SMTP_FROM_DEFAULT');

  const info = await getTransporter().sendMail({
    from: mailFrom,
    to,
    subject,
    html,
    text,
    cc,
    bcc,
    replyTo,
    attachments,
  });

  return { messageId: info.messageId, accepted: info.accepted, rejected: info.rejected, response: info.response };
}
