import fs from 'node:fs';
import path from 'node:path';
import BLOG_IMAGE_OVERRIDES from '../src/data/blogImageOverrides.generated.js';
import {
  buildEditorialOverrideMap,
  serializeEditorialOverridesModule,
} from '../src/lib/editorialOverrides.js';
import { applyRateLimitHeaders, checkRateLimit, getClientIp, isOriginAllowed } from './_requestGuard.js';

const RATE_LIMIT = {
  limit: 20,
  windowMs: 60 * 1000,
};

const OVERRIDES_PATH = path.join(process.cwd(), 'src', 'data', 'blogImageOverrides.generated.js');

const isEnabled = () =>
  process.env.NODE_ENV !== 'production' || process.env.ALLOW_EDITORIAL_AUTOMATION_API === 'true';

const parseJsonBody = (req) => {
  if (!req.body) return {};
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

  const enabled = isEnabled();

  if (req.method === 'GET') {
    return res.status(200).json({
      enabled,
      managedCount: Object.keys(BLOG_IMAGE_OVERRIDES?.slugs || {}).length,
      source: BLOG_IMAGE_OVERRIDES?.source || '',
      generatedAt: BLOG_IMAGE_OVERRIDES?.generatedAt || '',
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!enabled) {
    return res.status(403).json({ error: 'Editorial override sync disabled in this environment' });
  }

  const body = parseJsonBody(req);
  const managedSlugs = Array.isArray(body.managedSlugs)
    ? body.managedSlugs.map((slug) => String(slug || '').trim()).filter(Boolean)
    : [];

  if (managedSlugs.length === 0) {
    return res.status(400).json({ error: 'Nenhum slug informado para sincronização.' });
  }

  const { entries, removedSlugs } = buildEditorialOverrideMap({
    uploads: body.uploads || {},
    unsplashSelections: body.unsplashSelections || {},
    managedSlugs,
  });

  const source = serializeEditorialOverridesModule({
    existing: BLOG_IMAGE_OVERRIDES,
    entries,
    removedSlugs,
  });

  fs.writeFileSync(OVERRIDES_PATH, source, 'utf8');

  return res.status(200).json({
    ok: true,
    synced: Object.keys(entries).length,
    removed: removedSlugs.length,
    managed: managedSlugs.length,
    target: OVERRIDES_PATH,
  });
}
