import { Router } from 'express';
import Joi from 'joi';
import { logEmailEvent, queryLogs } from '../services/logger.js';

const router = Router();

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
