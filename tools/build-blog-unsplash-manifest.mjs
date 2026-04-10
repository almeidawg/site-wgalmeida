import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const root = process.cwd();

const readArg = (name) => args.find((arg) => arg.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || '';
const hasFlag = (name) => args.includes(`--${name}`);

const collectionJsonArg = readArg('collection-json');
const selectionArg = readArg('selection');
const outArg = readArg('out');
const trackDownloads = hasFlag('track-downloads');

const collectionJsonPath = path.resolve(root, collectionJsonArg || 'unsplash-collection-yU-ii4hFjlg.json');
const selectionPath = path.resolve(root, selectionArg || 'src/data/blogUnsplashSelection.json');
const outputPath = path.resolve(root, outArg || 'src/data/blogUnsplashManifest.generated.js');
const accessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';

const exitWithUsage = (message) => {
  if (message) {
    console.error(message);
    console.error('');
  }

  console.error('Usage: node ./tools/build-blog-unsplash-manifest.mjs --collection-json=./unsplash-collection-yU-ii4hFjlg.json');
  console.error('Optional: --selection=src/data/blogUnsplashSelection.json --out=src/data/blogUnsplashManifest.generated.js --track-downloads');
  process.exit(1);
};

if (!fs.existsSync(selectionPath)) {
  exitWithUsage(`Selection file not found: ${selectionPath}`);
}

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const selectionPayload = readJson(selectionPath);

if (!selectionPayload || typeof selectionPayload !== 'object' || typeof selectionPayload.slugs !== 'object') {
  exitWithUsage(`Invalid selection JSON: expected {"slugs": {...}} in ${selectionPath}`);
}

const hasChosenPhotos = Object.values(selectionPayload.slugs).some((entry) => {
  if (!entry || typeof entry !== 'object') return false;

  return ['hero', 'card'].some((slot) => {
    const value = entry[slot];
    if (typeof value === 'string') return Boolean(value.trim());
    if (value && typeof value === 'object' && typeof value.id === 'string') return Boolean(value.id.trim());
    return false;
  });
});

const collectionPayload = fs.existsSync(collectionJsonPath)
  ? readJson(collectionJsonPath)
  : {
      collectionRef: selectionPayload.collectionRef || '',
      photos: [],
    };

if (!fs.existsSync(collectionJsonPath) && hasChosenPhotos) {
  exitWithUsage(`Collection JSON not found: ${collectionJsonPath}`);
}

if (!Array.isArray(collectionPayload.photos)) {
  exitWithUsage(`Invalid collection JSON: expected "photos" array in ${collectionJsonPath}`);
}

const normalizeSelectionValue = (value) => {
  if (!value) return null;

  if (typeof value === 'string') {
    const id = value.trim();
    if (!id) return null;

    return {
      id,
      alt: '',
    };
  }

  if (typeof value === 'object' && typeof value.id === 'string') {
    const id = value.id.trim();
    if (!id) return null;

    return {
      id,
      alt: value.alt || '',
    };
  }

  return null;
};

const normalizeSelectionList = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (typeof item === 'string') {
        const id = item.trim();
        if (!id) return null;

        return { id, alt: '', caption: '' };
      }

      if (item && typeof item === 'object' && typeof item.id === 'string') {
        const id = item.id.trim();
        if (!id) return null;

        return {
          id,
          alt: item.alt || '',
          caption: item.caption || '',
        };
      }

      return null;
    })
    .filter(Boolean);
};

const photoIndex = new Map(
  collectionPayload.photos
    .filter((photo) => photo && typeof photo.id === 'string')
    .map((photo) => [photo.id, photo])
);

const toAsset = (photo, altOverride = '') => ({
  source: 'unsplash',
  src: photo.urls?.regular || photo.urls?.full || photo.urls?.raw || '',
  alt: altOverride || photo.alt || '',
  photographer: photo.photographer || '',
  profile: photo.profile || '',
  page: photo.page || '',
  downloadLocation: photo.downloadLocation || '',
});

const manifest = { slugs: {} };
const errors = [];
const trackedDownloads = [];

const sortedSlugEntries = Object.entries(selectionPayload.slugs).sort(([left], [right]) => left.localeCompare(right));

for (const [slug, entry] of sortedSlugEntries) {
  if (!entry || typeof entry !== 'object') continue;

  const hero = normalizeSelectionValue(entry.hero);
  const card = normalizeSelectionValue(entry.card);
  const context = normalizeSelectionList(entry.context);

  if (!hero && !card && context.length === 0) continue;

  const manifestEntry = {};

  if (hero) {
    const photo = photoIndex.get(hero.id);
    if (!photo) {
      errors.push(`Slug "${slug}" references missing hero photo "${hero.id}"`);
    } else {
      manifestEntry.hero = toAsset(photo, hero.alt);
      manifestEntry.seo = toAsset(photo, hero.alt);
      if (trackDownloads && photo.downloadLocation) {
        trackedDownloads.push({ slug, slot: 'hero', id: hero.id, downloadLocation: photo.downloadLocation });
      }
    }
  }

  if (card) {
    const photo = photoIndex.get(card.id);
    if (!photo) {
      errors.push(`Slug "${slug}" references missing card photo "${card.id}"`);
    } else {
      manifestEntry.card = toAsset(photo, card.alt);
      manifestEntry.thumb = toAsset(photo, card.alt);
      manifestEntry.square = toAsset(photo, card.alt);
      if (trackDownloads && photo.downloadLocation) {
        trackedDownloads.push({ slug, slot: 'card', id: card.id, downloadLocation: photo.downloadLocation });
      }
    }
  }

  if (context.length > 0) {
    const contextAssets = context
      .map((item) => {
        const photo = photoIndex.get(item.id);
        if (!photo) {
          errors.push(`Slug "${slug}" references missing context photo "${item.id}"`);
          return null;
        }

        if (trackDownloads && photo.downloadLocation) {
          trackedDownloads.push({ slug, slot: 'context', id: item.id, downloadLocation: photo.downloadLocation });
        }

        return {
          ...toAsset(photo, item.alt),
          caption: item.caption || '',
        };
      })
      .filter(Boolean);

    if (contextAssets.length > 0) {
      manifestEntry.context = contextAssets;
    }
  }

  if (Object.keys(manifestEntry).length > 0) {
    manifestEntry.default = manifestEntry.hero || manifestEntry.card;
    manifest.slugs[slug] = manifestEntry;
  }
}

if (errors.length > 0) {
  console.error('Unsplash manifest build failed:');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

if (trackDownloads) {
  if (!accessKey) {
    exitWithUsage('UNSPLASH_ACCESS_KEY is required when using --track-downloads');
  }

  const uniqueDownloads = [...new Map(
    trackedDownloads.map((item) => [item.downloadLocation, item])
  ).values()];

  for (const item of uniqueDownloads) {
    const response = await fetch(item.downloadLocation, {
      headers: {
        Authorization: `Client-ID ${accessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      console.warn(`Download tracking failed for ${item.id} (${response.status})`);
      continue;
    }

    console.log(`Tracked download for ${item.id}`);
  }
}

const header = [
  '// Auto-generated by tools/build-blog-unsplash-manifest.mjs',
  `// Generated at: ${new Date().toISOString()}`,
  `// Collection ref: ${selectionPayload.collectionRef || collectionPayload.collectionRef || 'unknown'}`,
  '',
].join('\n');

const source = `${header}export const BLOG_UNSPLASH_MANIFEST = ${JSON.stringify(manifest, null, 2)};\n\nexport default BLOG_UNSPLASH_MANIFEST;\n`;

fs.writeFileSync(outputPath, source);

console.log(`Saved ${Object.keys(manifest.slugs).length} slug entries to ${outputPath}`);
