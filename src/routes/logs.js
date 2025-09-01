import { Router } from 'express';
import Joi from 'joi';
import { logEmailEvent, queryLogs } from '../services/logger.js';

const router = Router();

/**
 * @swagger
 * /api/v1/logs:
 *   get:
 *     summary: Query email logs
 *     description: Retrieve email delivery logs with optional filtering and pagination
 *     tags: [Logs]
 *     security:
 *       - ApiTokenAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [success, failed, canceled, spam, queued, other]
 *         description: Filter by email status
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *         description: Filter by recipient email address
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *         description: Filter by sender email address
 *       - in: query
 *         name: contains
 *         schema:
 *           type: string
 *         description: Search in subject and content
 *       - in: query
 *         name: start
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Start date for filtering (ISO 8601)
 *       - in: query
 *         name: end
 *         schema:
 *           type: string
 *           format: date-time
 *         description: End date for filtering (ISO 8601)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of logs to skip for pagination
 *     responses:
 *       200:
 *         description: Logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogsResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create a log entry
 *     description: Manually create an email log entry
 *     tags: [Logs]
 *     security:
 *       - ApiTokenAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [success, failed, canceled, spam, queued, other]
 *               to:
 *                 oneOf:
 *                   - type: string
 *                   - type: array
 *                     items:
 *                       type: string
 *               from:
 *                 type: string
 *               subject:
 *                 type: string
 *               provider:
 *                 type: string
 *                 default: smtp
 *               response:
 *                 type: string
 *               error:
 *                 type: string
 *               meta:
 *                 type: object
 *           example:
 *             status: "success"
 *             to: "user@example.com"
 *             from: "sender@example.com"
 *             subject: "Welcome Email"
 *             provider: "smtp"
 *             response: "250 Message accepted"
 *     responses:
 *       201:
 *         description: Log entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LogEntry'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

const logStatuses = ['success', 'failed', 'canceled', 'spam', 'queued', 'other'];

const postSchema = Joi.object({
  status: Joi.string().valid(...logStatuses).required(),
  to: Joi.alternatives().try(Joi.string(), Joi.array().items(Joi.string())).optional(),
  from: Joi.string().optional(),
  subject: Joi.string().optional(),
  provider: Joi.string().default('smtp'),
  response: Joi.string().optional(),
  error: Joi.string().optional(),
  meta: Joi.object().unknown(true).optional(),
});

router.get('/logs', async (req, res) => {
  try {
    const { status, to, from, contains, start, end, limit, offset } = req.query;
    const result = await queryLogs({ status, to, from, contains, start, end, limit, offset });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'LogQueryError', message: err.message });
  }
});

router.post('/logs', async (req, res) => {
  const { error, value } = postSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(400).json({ error: 'ValidationError', details: error.details.map((d) => d.message) });
  }
  try {
    const entry = await logEmailEvent(value);
    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: 'LogWriteError', message: err.message });
  }
});

export default router;
