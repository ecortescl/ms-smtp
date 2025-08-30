import { Router } from 'express';
import Joi from 'joi';
import { sendMail } from '../services/mailer.js';

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
    return res.status(202).json({ status: 'queued', result });
  } catch (err) {
    return res.status(502).json({ error: 'SMTPError', message: err.message });
  }
});

export default router;
