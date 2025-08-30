import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import crypto from 'crypto';
import { getPool, pgEnabled } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getTemplatesDir() {
  const envDir = process.env.TEMPLATES_DIR || path.join(__dirname, '../../data/templates');
  return path.isAbsolute(envDir) ? envDir : path.resolve(path.join(__dirname, '../../'), envDir);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function sanitizeId(id) {
  return String(id).replace(/[^a-zA-Z0-9_-]/g, '').toLowerCase();
}

function fileFor(id) {
  return path.join(getTemplatesDir(), `${sanitizeId(id)}.json`);
}

export async function listTemplates() {
  if (pgEnabled()) {
    const pool = getPool();
    const { rows } = await pool.query(
      `SELECT id, name, updated_at FROM email_templates ORDER BY id ASC`
    );
    return rows.map((r) => ({ id: r.id, name: r.name, updatedAt: r.updated_at }));
  }

  const dir = getTemplatesDir();
  try {
    await ensureDir(dir);
    const entries = await fs.readdir(dir);
    const items = [];
    for (const f of entries) {
      if (!f.endsWith('.json')) continue;
      const raw = await fs.readFile(path.join(dir, f), 'utf8');
      const t = JSON.parse(raw);
      items.push({ id: t.id, name: t.name, updatedAt: t.updatedAt });
    }
    return items.sort((a, b) => String(a.id).localeCompare(String(b.id)));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

export async function getTemplate(id) {
  if (pgEnabled()) {
    const pool = getPool();
    const { rows } = await pool.query(`SELECT * FROM email_templates WHERE id = $1`, [sanitizeId(id)]);
    if (rows.length === 0) throw Object.assign(new Error('Template not found'), { code: 'ENOENT' });
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      subject: r.subject,
      html: r.html,
      defaults: r.defaults || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }
  const file = fileFor(id);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function deleteTemplate(id) {
  if (pgEnabled()) {
    const pool = getPool();
    await pool.query(`DELETE FROM email_templates WHERE id = $1`, [sanitizeId(id)]);
    return;
  }
  const file = fileFor(id);
  await fs.unlink(file);
}

export async function createTemplate({ id, name, subject, html, defaults }) {
  const templateId = sanitizeId(id || crypto.randomUUID());
  if (pgEnabled()) {
    const pool = getPool();
    // Check conflict
    const { rows: exists } = await pool.query(`SELECT 1 FROM email_templates WHERE id = $1`, [templateId]);
    if (exists.length) throw new Error(`Template '${templateId}' ya existe`);
    const { rows } = await pool.query(
      `INSERT INTO email_templates (id, name, subject, html, defaults)
       VALUES ($1, $2, $3, $4, $5::jsonb)
       RETURNING id, name, subject, html, defaults, created_at, updated_at`,
      [templateId, name || templateId, String(subject || ''), String(html || ''), JSON.stringify(defaults || {})]
    );
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      subject: r.subject,
      html: r.html,
      defaults: r.defaults || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  const dir = getTemplatesDir();
  await ensureDir(dir);
  const file = fileFor(templateId);

  let exists = false;
  try {
    await fs.access(file);
    exists = true;
  } catch (_) {
    exists = false;
  }
  if (exists) throw new Error(`Template '${templateId}' ya existe`);

  const record = {
    id: templateId,
    name: name || templateId,
    subject: String(subject || ''),
    html: String(html || ''),
    defaults: defaults || {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(file, JSON.stringify(record, null, 2), 'utf8');
  return record;
}

export async function renderTemplate(id, params = {}) {
  const t = await getTemplate(id);
  const subjectTpl = Handlebars.compile(t.subject || '');
  const htmlTpl = Handlebars.compile(t.html || '');
  return {
    subject: subjectTpl(params),
    html: htmlTpl(params),
    defaults: t.defaults || {},
    id: t.id,
    name: t.name,
  };
}

export async function updateTemplate(id, payload) {
  if (pgEnabled()) {
    const pool = getPool();
    const current = await getTemplate(id);
    const next = {
      ...current,
      ...payload,
    };
    const { rows } = await pool.query(
      `UPDATE email_templates SET name = $2, subject = $3, html = $4, defaults = $5::jsonb, updated_at = NOW()
       WHERE id = $1
       RETURNING id, name, subject, html, defaults, created_at, updated_at`,
      [
        sanitizeId(id),
        next.name || sanitizeId(id),
        String(next.subject || ''),
        String(next.html || ''),
        JSON.stringify(next.defaults || {}),
      ]
    );
    const r = rows[0];
    return {
      id: r.id,
      name: r.name,
      subject: r.subject,
      html: r.html,
      defaults: r.defaults || {},
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    };
  }

  const file = fileFor(id);
  const current = await getTemplate(id);
  const next = {
    ...current,
    ...payload,
    updatedAt: new Date().toISOString(),
  };
  await fs.writeFile(file, JSON.stringify(next, null, 2), 'utf8');
  return next;
}
