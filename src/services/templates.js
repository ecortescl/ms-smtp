import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Handlebars from 'handlebars';
import crypto from 'crypto';

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
  const file = fileFor(id);
  const raw = await fs.readFile(file, 'utf8');
  return JSON.parse(raw);
}

export async function deleteTemplate(id) {
  const file = fileFor(id);
  await fs.unlink(file);
}

export async function createTemplate({ id, name, subject, html, defaults }) {
  const dir = getTemplatesDir();
  await ensureDir(dir);
  const templateId = sanitizeId(id || crypto.randomUUID());
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
