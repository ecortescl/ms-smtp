import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import { authMiddleware } from './middleware/auth.js';
import emailRouter from './routes/email.js';
import { setupSwagger } from './swagger.js';
import logsRouter from './routes/logs.js';
import templatesRouter from './routes/templates.js';
import { initDb, pgEnabled } from './services/db.js';

dotenv.config();

const app = express();
const INITIAL_PORT = Number(process.env.PORT) || 3000;

// Basic security and utils
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Basic rate limiter (customize via env if desired)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Swagger (public, documents auth requirement)
setupSwagger(app);

// Protect API routes with token auth
app.use('/api', authMiddleware);

// Routes
app.use('/api/v1', emailRouter);
app.use('/api/v1', logsRouter);
app.use('/api/v1', templatesRouter);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

function startServer(port, retries = 10) {
  const server = app.listen(port, () => {
    console.log(`SMTP microservice listening on port ${port}`);
  });
  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE' && retries > 0) {
      const nextPort = port + 1;
      console.warn(`Port ${port} in use. Trying ${nextPort}... (${retries - 1} retries left)`);
      setTimeout(() => startServer(nextPort, retries - 1), 100);
    } else {
      console.error('Failed to start server:', err);
      process.exit(1);
    }
  });
}

// Initialize optional Postgres and fallback to filesystem if it fails
if (pgEnabled()) {
  try {
    await initDb();
    console.log('Postgres backend enabled');
  } catch (err) {
    console.warn('Postgres init failed, falling back to filesystem:', err?.message || err);
    process.env.DB_PROVIDER = 'filesystem';
  }
}

startServer(INITIAL_PORT);
