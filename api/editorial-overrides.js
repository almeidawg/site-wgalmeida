import { applyRateLimitHeaders, checkRateLimit, getClientIp, isOriginAllowed } from './_requestGuard.js';
import { syncEditorialOverrides } from './_editorialOverrides.js';

const RATE_LIMIT = {
  limit: 20,
  windowMs: 60 * 1000,
};

const parseJsonBody = (req) => {
  if (!req?.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    bucket: 'editorial-overrides',
    key: ip,
    ...RATE_LIMIT,
  });
  applyRateLimitHeaders(res, rate);
  if (!rate.ok) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      enabled: true,
      notes: 'Sincroniza overrides publicados de blog e páginas públicas.',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = parseJsonBody(req);

  try {
    const result = await syncEditorialOverrides({
      uploads: body.uploads || {},
      managedBlogSlugs: body.managedBlogSlugs || [],
      managedPageSlugs: body.managedPageSlugs || [],
      source: body.source || 'admin-editorial-sync',
    });

    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({
      error: error?.message || 'Failed to sync editorial overrides',
    });
  }
}
