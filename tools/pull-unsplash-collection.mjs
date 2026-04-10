import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = process.cwd();
const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';

const readArg = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || '';
const collectionArg = readArg('collection');
const collectionUrlArg = readArg('collection-url');
const outArg = readArg('out');
const perPage = Number(readArg('per-page') || '30');
const page = Number(readArg('page') || '1');

const parseCollectionRef = (value) => {
  if (!value) return '';

  try {
    const url = new URL(value);
    const match = url.pathname.match(/\/collections\/([^/?#]+)/i);
    return match?.[1] || '';
  } catch {
    return value;
  }
};

const collectionRef = parseCollectionRef(collectionArg || collectionUrlArg);

if (!collectionRef) {
  console.error('Usage: node ./tools/pull-unsplash-collection.mjs --collection=<id>');
  console.error('   or: node ./tools/pull-unsplash-collection.mjs --collection-url=https://unsplash.com/collections/<id>/slug');
  process.exit(1);
}

if (!accessKey) {
  console.error('UNSPLASH_ACCESS_KEY is not configured.');
  process.exit(1);
}

const sanitizeFileToken = (value) => value.replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');

const outputPath = outArg
  ? path.resolve(root, outArg)
  : path.join(root, `unsplash-collection-${sanitizeFileToken(collectionRef)}.json`);

const apiUrl = new URL(`https://api.unsplash.com/collections/${encodeURIComponent(collectionRef)}/photos`);
apiUrl.searchParams.set('page', String(Number.isFinite(page) && page > 0 ? page : 1));
apiUrl.searchParams.set('per_page', String(Number.isFinite(perPage) && perPage > 0 ? perPage : 30));
apiUrl.searchParams.set('orientation', 'landscape');

const response = await fetch(apiUrl, {
  headers: {
    Authorization: `Client-ID ${accessKey}`,
    'Accept-Version': 'v1',
  },
});

if (!response.ok) {
  const message = await response.text();
  console.error(`Unsplash request failed with ${response.status}`);
  console.error(message.slice(0, 500));
  process.exit(1);
}

const photos = await response.json();
const payload = {
  fetchedAt: new Date().toISOString(),
  collectionRef,
  page,
  perPage,
  total: Array.isArray(photos) ? photos.length : 0,
  photos: Array.isArray(photos)
    ? photos.map((photo) => ({
        id: photo.id,
        slug: photo.slug || '',
        alt: photo.alt_description || photo.description || '',
        photographer: photo.user?.name || '',
        profile: photo.user?.links?.html || '',
        page: photo.links?.html || '',
        downloadLocation: photo.links?.download_location || '',
        urls: {
          raw: photo.urls?.raw || '',
          full: photo.urls?.full || '',
          regular: photo.urls?.regular || '',
          small: photo.urls?.small || '',
          thumb: photo.urls?.thumb || '',
        },
      }))
    : [],
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`);
console.log(`Saved ${payload.total} photos to ${outputPath}`);
