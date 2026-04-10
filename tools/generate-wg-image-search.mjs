import { buildWgImageSearchPayload, formatWgImageSearchJson } from '../src/lib/wgVisualSearchProfile.js';

const args = process.argv.slice(2);
const readArg = (prefix) => args.find((arg) => arg.startsWith(prefix))?.slice(prefix.length) || '';

const theme = readArg('--theme=') || readArg('--title=');
const category = readArg('--category=');
const slot = readArg('--slot=') || 'hero';
const withUnsplash = args.includes('--with-unsplash');
const limitArg = Number(readArg('--limit='));
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : 4;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';

if (!theme) {
  console.error('Usage: node ./tools/generate-wg-image-search.mjs --theme="Tema do post" [--category=tendencias] [--slot=hero] [--with-unsplash] [--limit=4]');
  process.exit(1);
}

const fetchUnsplashCandidates = async (queries) => {
  if (!unsplashAccessKey) {
    return { status: 'missing_access_key', candidates: [] };
  }

  const candidates = [];
  const seenIds = new Set();
  const attemptedQueries = [];

  for (const query of queries) {
    if (candidates.length >= limit) break;
    attemptedQueries.push(query);

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('per_page', String(Math.min(limit, 4)));
    url.searchParams.set('orientation', 'landscape');
    url.searchParams.set('content_filter', 'high');
    url.searchParams.set('order_by', 'relevant');

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const message = await response.text();
      return {
        status: `error_${response.status}`,
        attemptedQueries,
        candidates,
        message: message.slice(0, 300),
      };
    }

    const data = await response.json();
    for (const item of data.results || []) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      candidates.push({
        id: item.id,
        description: item.description || item.alt_description || '',
        author: item.user?.name || '',
        profile: item.user?.links?.html || '',
        unsplash_page: item.links?.html || '',
        regular: item.urls?.regular || '',
        thumb: item.urls?.thumb || '',
      });
      if (candidates.length >= limit) break;
    }
  }

  return {
    status: 'ok',
    attemptedQueries,
    candidates,
  };
};

const payload = buildWgImageSearchPayload(theme, { category, slot });
const output = {
  main_query: payload.mainQuery,
  search_terms: payload.searchTerms,
};

if (withUnsplash) {
  const unsplash = await fetchUnsplashCandidates([payload.mainQuery, ...payload.searchTerms]);
  output.unsplash = unsplash;
}

console.log(formatWgImageSearchJson(payload));
if (withUnsplash) {
  console.log('\n' + JSON.stringify({ unsplash: output.unsplash }, null, 2));
}
