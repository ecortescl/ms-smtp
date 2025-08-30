import { Pool } from 'pg';

let pool = null;

function isPostgresEnabled() {
  return String(process.env.DB_PROVIDER || 'filesystem').toLowerCase() === 'postgres';
}

export function getPool() {
  if (!isPostgresEnabled()) return null;
  if (pool) return pool;

  // Allow full connection string or discrete params
  const connectionString = process.env.PG_CONNECTION_STRING;
  if (connectionString) {
    pool = new Pool({ connectionString, ssl: parseSSL(process.env.PG_SSL) });
  } else {
    pool = new Pool({
      host: process.env.PG_HOST || 'localhost',
      port: Number(process.env.PG_PORT) || 5432,
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || '',
      database: process.env.PG_DATABASE || 'ms_smtp',
      ssl: parseSSL(process.env.PG_SSL),
    });
  }
  return pool;
}

function parseSSL(val) {
  if (val === undefined) return false;
  const v = String(val).toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

export async function initDb() {
  if (!isPostgresEnabled()) return;
  const p = getPool();

  // Create extensions/tables if not exist
  await p.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  await p.query(`
    CREATE TABLE IF NOT EXISTS email_logs (
      id UUID PRIMARY KEY,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT,
      recipient TEXT,
      sender TEXT,
      subject TEXT,
      provider TEXT,
      response TEXT,
      error JSONB,
      meta JSONB
    );
  `);

  await p.query(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT NOT NULL,
      html TEXT NOT NULL,
      defaults JSONB,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export function pgEnabled() {
  return isPostgresEnabled();
}
