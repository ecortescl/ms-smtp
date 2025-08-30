import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getLogDir() {
  const envDir = process.env.LOG_DIR || path.join(__dirname, '../../data/logs');
  return path.isAbsolute(envDir) ? envDir : path.resolve(path.join(__dirname, '../../'), envDir);
}

function getLogFilePath() {
  const fileName = process.env.LOG_FILE_NAME || 'email.log';
  return path.join(getLogDir(), fileName);
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

export async function logEmailEvent(event) {
  const dir = getLogDir();
  await ensureDir(dir);

  const entry = {
    id: event.id || crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    status: event.status, // success | failed | canceled | spam | queued | other
    to: event.to,
    from: event.from,
    subject: event.subject,
    provider: event.provider || 'smtp',
    response: event.response || undefined,
    error: event.error || undefined,
    meta: event.meta || undefined,
  };

  const line = JSON.stringify(entry) + '\n';
  await fs.appendFile(getLogFilePath(), line, 'utf8');
  return entry;
}

export async function queryLogs({ status, to, from, contains, start, end, limit = 100, offset = 0 } = {}) {
  const filePath = getLogFilePath();
  try {
    const data = await fs.readFile(filePath, 'utf8');
    const lines = data.split('\n').filter(Boolean);
    let records = lines.map((l) => JSON.parse(l));

    if (status) {
      const statuses = Array.isArray(status) ? status : String(status).split(',');
      records = records.filter((r) => r.status && statuses.includes(r.status));
    }
    if (to) {
      const match = String(to).toLowerCase();
      records = records.filter((r) => String(r.to || '').toLowerCase().includes(match));
    }
    if (from) {
      const match = String(from).toLowerCase();
      records = records.filter((r) => String(r.from || '').toLowerCase().includes(match));
    }
    if (contains) {
      const q = String(contains).toLowerCase();
      records = records.filter((r) =>
        String(r.subject || '').toLowerCase().includes(q) || String(r.response || '').toLowerCase().includes(q)
      );
    }
    if (start) {
      const s = new Date(start).getTime();
      if (!isNaN(s)) records = records.filter((r) => new Date(r.timestamp).getTime() >= s);
    }
    if (end) {
      const e = new Date(end).getTime();
      if (!isNaN(e)) records = records.filter((r) => new Date(r.timestamp).getTime() <= e);
    }

    // Sort newest first
    records.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const total = records.length;
    const startIdx = Math.max(0, Number(offset) || 0);
    const endIdx = startIdx + (Number(limit) || 100);
    const items = records.slice(startIdx, endIdx);

    return { total, offset: startIdx, limit: Number(limit) || 100, items };
  } catch (err) {
    if (err.code === 'ENOENT') {
      return { total: 0, offset: 0, limit: Number(limit) || 100, items: [] };
    }
    throw err;
  }
}
