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

/**
 * @swagger
 * /api/v1/templates:
 *   get:
 *     summary: List all email templates
 *     description: Retrieve a list of all available email templates
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     responses:
 *       200:
 *         description: Templates retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Template'
 *   post:
 *     summary: Create a new email template
 *     description: Create a new email template with Handlebars support
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplateRequest'
 *           example:
 *             name: "Welcome Email"
 *             subject: "Welcome to {{companyName}}, {{userName}}!"
 *             html: "<h1>Welcome {{userName}}!</h1><p>Thank you for joining {{companyName}}.</p>"
 *             defaults:
 *               companyName: "Our Company"
 *               from: "welcome@example.com"
 *     responses:
 *       201:
 *         description: Template created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Template with this ID already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

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

/**
 * @swagger
 * /api/v1/templates/{id}:
 *   get:
 *     summary: Get a specific email template
 *     description: Retrieve a single email template by its ID
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       200:
 *         description: Template retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   put:
 *     summary: Update an email template
 *     description: Update an existing email template
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTemplateRequest'
 *           example:
 *             name: "Updated Welcome Email"
 *             subject: "Welcome to {{companyName}}, {{userName}}!"
 *             html: "<h1>Welcome {{userName}}!</h1><p>We're excited to have you at {{companyName}}.</p>"
 *     responses:
 *       200:
 *         description: Template updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Template'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   delete:
 *     summary: Delete an email template
 *     description: Delete an existing email template
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Template ID
 *     responses:
 *       204:
 *         description: Template deleted successfully
 *       404:
 *         description: Template not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

/**
 * @swagger
 * /api/v1/send-template:
 *   post:
 *     summary: Send email using a template
 *     description: Send an email using a predefined template with parameter substitution
 *     tags: [Templates]
 *     security:
 *       - ApiTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/SendTemplateRequest'
 *           example:
 *             templateId: "welcome-email"
 *             params:
 *               userName: "John Doe"
 *               companyName: "Acme Corp"
 *               activationLink: "https://example.com/activate/abc123"
 *             to: "john.doe@example.com"
 *             from: "welcome@acme.com"
 *     responses:
 *       202:
 *         description: Template email queued successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/EmailResponse'
 *       400:
 *         description: Validation error or missing recipient
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Template not found
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
