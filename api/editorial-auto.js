import { spawnSync } from 'node:child_process';
import { applyRateLimitHeaders, checkRateLimit, getClientIp, isOriginAllowed } from './_requestGuard.js';

const RATE_LIMIT = {
  limit: 2,
  windowMs: 60 * 1000,
};

const DEFAULT_BATCH_SIZE = 10;

function parseJsonBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

function isEnabled() {
  return process.env.NODE_ENV !== 'production' || process.env.ALLOW_EDITORIAL_AUTOMATION_API === 'true';
}

function resolveBatchSize(value) {
  const parsed = Number.parseInt(String(value || DEFAULT_BATCH_SIZE), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_BATCH_SIZE;
  return Math.min(parsed, 50);
}

function runEditorialAutomation({ batchSize }) {
  const command = `npm run blog:editorial:auto -- --batch-size=${batchSize}`;
  const result = spawnSync(command, [], {
    cwd: process.cwd(),
    encoding: 'utf8',
    shell: true,
    timeout: 120000,
  });

  return {
    ok: result.status === 0,
    status: result.status ?? null,
    signal: result.signal ?? null,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    errorDetail: result.error?.message || '',
    command,
  };
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    bucket: 'editorial-auto',
    key: ip,
    ...RATE_LIMIT,
  });
  applyRateLimitHeaders(res, rate);
  if (!rate.ok) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const enabled = isEnabled();

  if (req.method === 'GET') {
    return res.status(200).json({
      enabled,
      mode: process.env.NODE_ENV || 'development',
      requiresFlagInProduction: true,
      command: 'npm run blog:editorial:auto',
      notes: enabled
        ? 'Automação disponível neste ambiente.'
        : 'Automação bloqueada neste ambiente. Habilite apenas localmente ou com ALLOW_EDITORIAL_AUTOMATION_API=true.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enabled) {
    return res.status(403).json({
      error: 'Editorial automation disabled in this environment',
      enabled,
      command: 'npm run blog:editorial:auto',
    });
  }

  const body = parseJsonBody(req);
  const batchSize = resolveBatchSize(body.batchSize);

  try {
    const result = runEditorialAutomation({ batchSize });

    if (!result.ok) {
      return res.status(500).json({
        error: 'Editorial automation failed',
        ...result,
      });
    }

    return res.status(200).json({
      message: 'Editorial automation completed',
      batchSize,
      ...result,
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message || 'Editorial automation failed',
    });
  }
}
