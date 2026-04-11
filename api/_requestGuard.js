const DEFAULT_ALLOWED_ORIGINS = [
  'https://wgalmeida.com.br',
  'https://www.wgalmeida.com.br',
];

const RATE_LIMIT_STORE = globalThis.__WG_RATE_LIMIT_STORE || new Map();
if (!globalThis.__WG_RATE_LIMIT_STORE) {
  globalThis.__WG_RATE_LIMIT_STORE = RATE_LIMIT_STORE;
}

const now = () => Date.now();

export function getClientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return (
    req.headers?.['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

export function isOriginAllowed(req) {
  const origin = req.headers?.origin;
  if (!origin) return true;

  const host = req.headers?.host || '';
  if (host) {
    const expected = `${req.headers['x-forwarded-proto'] || 'https'}://${host}`;
    if (origin === expected) return true;
  }

  if (DEFAULT_ALLOWED_ORIGINS.includes(origin)) return true;
  if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) return true;
  if (origin.endsWith('.vercel.app')) return true;

  return false;
}

export function checkRateLimit({ bucket, key, limit, windowMs }) {
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeWindowMs = Math.max(1000, Number(windowMs) || 1000);
  const compositeKey = `${bucket}:${key}`;
  const currentTime = now();

  const record = RATE_LIMIT_STORE.get(compositeKey);
  if (!record || currentTime >= record.resetAt) {
    RATE_LIMIT_STORE.set(compositeKey, {
      count: 1,
      resetAt: currentTime + safeWindowMs,
    });
    return {
      ok: true,
      remaining: safeLimit - 1,
      resetAt: currentTime + safeWindowMs,
    };
  }

  if (record.count >= safeLimit) {
    return {
      ok: false,
      remaining: 0,
      resetAt: record.resetAt,
    };
  }

  record.count += 1;
  RATE_LIMIT_STORE.set(compositeKey, record);
  return {
    ok: true,
    remaining: safeLimit - record.count,
    resetAt: record.resetAt,
  };
}

export function applyRateLimitHeaders(res, rate) {
  const retryAfterSeconds = Math.max(1, Math.ceil((rate.resetAt - now()) / 1000));
  res.setHeader('X-RateLimit-Remaining', String(Math.max(0, rate.remaining)));
  res.setHeader('X-RateLimit-Reset', String(Math.floor(rate.resetAt / 1000)));
  res.setHeader('Retry-After', String(retryAfterSeconds));
}

