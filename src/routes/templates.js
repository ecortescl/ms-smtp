import { Router } from 'express';
import Joi from 'joi';
import {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate,
  renderTemplate,
} from '../services/templates.js';
import { sendMail } from '../services/mailer.js';
import { logEmailEvent } from '../services/logger.js';

const router = Router();

const createSchema = Joi.object({
  id: Joi.string().alphanum().min(3).max(64).optional(),
  name: Joi.string().min(1).required(),
  subject: Joi.string().required(),
  html: Joi.string().required(),
  defaults: Joi.object({
    from: Joi.string().email().optional(),
    to: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
    cc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
    bcc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
    replyTo: Joi.string().email().optional(),
  })
    .unknown(true)
    .default({}),
});

const updateSchema = Joi.object({
  name: Joi.string().min(1).optional(),
  subject: Joi.string().optional(),
  html: Joi.string().optional(),
  defaults: Joi.object().unknown(true).optional(),
}).min(1);

const sendTplSchema = Joi.object({
  templateId: Joi.string().required(),
  params: Joi.object().unknown(true).default({}),
  from: Joi.string().email().optional(),
  to: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
  cc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
  bcc: Joi.alternatives().try(Joi.string().email(), Joi.array().items(Joi.string().email())).optional(),
  replyTo: Joi.string().email().optional(),
  attachments: Joi.array()
    .items(
      Joi.object({
        filename: Joi.string().optional(),
        content: Joi.alternatives(Joi.string(), Joi.binary()).optional(),
        contentType: Joi.string().optional(),
        encoding: Joi.string().optional(),
        path: Joi.string().uri().optional(),
      }).or('content', 'path')
    )
    .optional(),
});

router.get('/templates', async (_req, res) => {
  const items = await listTemplates();
  res.json(items);
});

router.get('/templates/:id', async (req, res) => {
  try {
    const t = await getTemplate(req.params.id);
    res.json(t);
  } catch (err) {
    res.status(404).json({ error: 'NotFound', message: err.message });
  }
});

router.post('/templates', async (req, res) => {
  const { error, value } = createSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'ValidationError', details: error.details.map((d) => d.message) });
  try {
    const t = await createTemplate(value);
    res.status(201).json(t);
  } catch (err) {
    res.status(409).json({ error: 'Conflict', message: err.message });
  }
});

router.put('/templates/:id', async (req, res) => {
  const { error, value } = updateSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'ValidationError', details: error.details.map((d) => d.message) });
  try {
    const t = await updateTemplate(req.params.id, value);
    res.json(t);
  } catch (err) {
    res.status(404).json({ error: 'NotFound', message: err.message });
  }
});

router.delete('/templates/:id', async (req, res) => {
  try {
    await deleteTemplate(req.params.id);
    res.status(204).send();
  } catch (err) {
    res.status(404).json({ error: 'NotFound', message: err.message });
  }
});

router.post('/send-template', async (req, res) => {
  const { error, value } = sendTplSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json({ error: 'ValidationError', details: error.details.map((d) => d.message) });

  try {
    // Render
    const rendered = await renderTemplate(value.templateId, value.params);

    // Merge defaults with overrides
    const from = value.from || rendered.defaults.from || process.env.SMTP_FROM_DEFAULT;
    const to = value.to || rendered.defaults.to;
    const cc = value.cc || rendered.defaults.cc;
    const bcc = value.bcc || rendered.defaults.bcc;
    const replyTo = value.replyTo || rendered.defaults.replyTo;

    if (!to) return res.status(400).json({ error: 'ValidationError', message: 'Debe especificar destinatario (to)' });

    const result = await sendMail({
      from,
      to,
      cc,
      bcc,
      replyTo,
      subject: rendered.subject,
      html: rendered.html,
      attachments: value.attachments,
    });

    await logEmailEvent({
      status: 'success',
      to,
      from,
      subject: rendered.subject,
      provider: 'smtp',
      response: result.response,
      meta: { templateId: rendered.id, templateName: rendered.name, accepted: result.accepted, rejected: result.rejected, messageId: result.messageId },
    });

    res.status(202).json({ status: 'queued', result });
  } catch (err) {
    try {
      await logEmailEvent({
        status: 'failed',
        to: req.body?.to,
        from: req.body?.from,
        subject: 'template:' + req.body?.templateId,
        provider: 'smtp',
        error: err.message,
        meta: { templateId: req.body?.templateId },
      });
    } catch (_) {}
    res.status(502).json({ error: 'SMTPError', message: err.message });
  }
});

export default router;
