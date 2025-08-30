import { Router } from 'express';
import Joi from 'joi';
import { sendMail, getTransporter } from '../services/mailer.js';
import { logEmailEvent } from '../services/logger.js';

const router = Router();

const attachmentSchema = Joi.object({
  filename: Joi.string().optional(),
  content: Joi.alternatives(Joi.string(), Joi.binary()).required(),
  contentType: Joi.string().optional(),
  encoding: Joi.string().optional(),
  path: Joi.string().uri().optional(),
}).or('content', 'path');

const schema = Joi.object({
  from: Joi.string().email().optional(),
  to: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).required(),
  cc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
  bcc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
  subject: Joi.string().required(),
  html: Joi.string().required(),
  text: Joi.string().optional(),
  replyTo: Joi.string().email().optional(),
  attachments: Joi.array().items(attachmentSchema).optional(),
});

router.post('/send-email', async (req, res) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: 'ValidationError', details: error.details.map(d => d.message) });
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
