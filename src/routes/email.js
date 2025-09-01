import { Router } from 'express';
import Joi from 'joi';
import { sendMail, getTransporter } from '../services/mailer.js';
import { logEmailEvent } from '../services/logger.js';

const router = Router();

/**
 * @swagger
 * /api/v1/send-email:
 *   post:
 *     summary: Send an email via SMTP
 *     description: Send a single email with optional attachments using the configured SMTP server
 *     tags: [Email]
 *     security:
 *       - ApiTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/EmailRequest'
 *           example:
 *             from: "sender@example.com"
 *             to: ["recipient@example.com"]
 *             subject: "Test Email"
 *             html: "<h1>Hello World</h1><p>This is a test email.</p>"
 *             text: "Hello World\n\nThis is a test email."
 *     responses:
 *       202:
 *         description: Email queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing API token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       502:
 *         description: SMTP error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const attachmentSchema = Joi.object({
  filename: Joi.string().optional(),
  content: Joi.alternatives(Joi.string(), Joi.binary()).required(),
  contentType: Joi.string().optional(),
  encoding: Joi.string().optional(),
  path: Joi.string().uri().optional(),
}).or('content', 'path');

const schema = Joi.object({
  from: Joi.string().email().optional().empty(''),
  to: Joi.alternatives()
    .try(Joi.string().email(), Joi.array().items(Joi.string().email()))
    .required()
    .empty(''),
  cc: Joi.alternatives()
    .try(Joi.string().email(), Joi.array().items(Joi.string().email()))
    .optional()
    .empty(''),
  bcc: Joi.alternatives()
    .try(Joi.string().email(), Joi.array().items(Joi.string().email()))
    .optional()
    .empty(''),
  subject: Joi.string().optional().empty(''),
  html: Joi.string().required().empty(''),
  text: Joi.string().optional().empty(''),
  replyTo: Joi.string().email().optional().empty(''),
  attachments: Joi.array().items(attachmentSchema).optional(),
});

router.post('/send-email', async (req, res) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    return res.status(400).json({ error: 'ValidationError', details: error.details.map(d => d.message) });
  }

  // Asegurar que exista al menos un destinatario (to/cc/bcc) para evitar error de Nodemailer
  const hasTo = Boolean(value.to && ((Array.isArray(value.to) && value.to.length) || (!Array.isArray(value.to))));
  const hasCc = Boolean(value.cc && ((Array.isArray(value.cc) && value.cc.length) || (!Array.isArray(value.cc))));
  const hasBcc = Boolean(value.bcc && ((Array.isArray(value.bcc) && value.bcc.length) || (!Array.isArray(value.bcc))));
  if (!hasTo && !hasCc && !hasBcc) {
    return res.status(400).json({ error: 'ValidationError', details: ['At least one recipient is required in to, cc, or bcc'] });
  }

  try {
    const result = await sendMail(value);
    // Log success
    await logEmailEvent({
      status: 'success',
      to: value.to,
      from: value.from,
      subject: value.subject,
      provider: 'smtp',
      response: result.response,
      meta: { accepted: result.accepted, rejected: result.rejected, messageId: result.messageId },
    });
    return res.status(202).json({ status: 'queued', result });
  } catch (err) {
    // Log failure
    try {
      await logEmailEvent({
        status: 'failed',
        to: value.to,
        from: value.from,
        subject: value.subject,
        provider: 'smtp',
        error: err.message,
      });
    } catch (_) {
      // ignore logging failure
    }
    return res.status(502).json({ error: 'SMTPError', message: err.message });
  }
});

/**
 * @swagger
 * /api/v1/smtp-check:
 *   get:
 *     summary: Check SMTP server connectivity
 *     description: Verify connection to the configured SMTP server
 *     tags: [Email]
 *     security:
 *       - ApiTokenAuth: []
 *     responses:
 *       200:
 *         description: SMTP connection successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SMTPCheckResponse'
 *             example:
 *               ok: true
 *               verified: true
 *               host: "smtp.gmail.com"
 *               port: 587
 *               secure: false
 *       502:
 *         description: SMTP connection failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SMTPCheckResponse'
 *             example:
 *               ok: false
 *               error: "Connection timeout"
 */
router.get('/smtp-check', async (_req, res) => {
  try {
    const transporter = getTransporter();
    const verified = await transporter.verify();
    const conf = transporter.options || {};
    return res.status(200).json({
      ok: true,
      verified: Boolean(verified),
      host: conf.host,
      port: conf.port,
      secure: conf.secure,
    });
  } catch (err) {
    return res.status(502).json({ ok: false, error: err.message });
  }
});

export default router;
