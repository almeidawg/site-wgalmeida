import { applyRateLimitHeaders, checkRateLimit, getClientIp, isOriginAllowed } from './_requestGuard.js';

const RATE_LIMIT = {
  limit: 20,
  windowMs: 60 * 1000,
};

const MAX_PER_PAGE = 20;
const DEFAULT_PER_PAGE = 9;

function resolveParam(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function sanitizeQuery(value = '') {
  return String(value).trim().slice(0, 200);
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (!isOriginAllowed(req)) {
    return res.status(403).json({ error: 'Origin not allowed' });
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rate = checkRateLimit({
    bucket: 'unsplash-search',
    key: ip,
    ...RATE_LIMIT,
  });
  applyRateLimitHeaders(res, rate);
  if (!rate.ok) {
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }

  const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';
  if (!accessKey) {
    return res.status(503).json({ error: 'Unsplash API key not configured' });
  }

  const query = sanitizeQuery(req.query?.query);
  if (!query) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  const orientation = ['landscape', 'portrait', 'squarish'].includes(req.query?.orientation)
    ? req.query.orientation
    : 'landscape';

  const perPage = Math.min(resolveParam(req.query?.per_page, DEFAULT_PER_PAGE), MAX_PER_PAGE);
  const page = resolveParam(req.query?.page, 1);

  try {
    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('per_page', String(perPage));
    url.searchParams.set('page', String(page));
    url.searchParams.set('content_filter', 'high');
    url.searchParams.set('order_by', 'relevant');

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(response.status).json({
        error: 'Unsplash API error',
        status: response.status,
        detail: text.slice(0, 200),
      });
    }

    const data = await response.json();

    const photos = (data.results || []).map((photo) => ({
      id: photo.id,
      description: photo.description || photo.alt_description || '',
      alt: photo.alt_description || photo.description || '',
      photographer: photo.user?.name || '',
      photographerUsername: photo.user?.username || '',
      profileUrl: photo.user?.links?.html || '',
      unsplashPage: photo.links?.html || '',
      downloadLocation: photo.links?.download_location || '',
      urls: {
        raw: photo.urls?.raw || '',
        full: photo.urls?.full || '',
        regular: photo.urls?.regular || '',
        small: photo.urls?.small || '',
        thumb: photo.urls?.thumb || '',
      },
      color: photo.color || '',
      width: photo.width || 0,
      height: photo.height || 0,
    }));

    return res.status(200).json({
      query,
      orientation,
      page,
      perPage,
      total: data.total || 0,
      totalPages: data.total_pages || 0,
      photos,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
