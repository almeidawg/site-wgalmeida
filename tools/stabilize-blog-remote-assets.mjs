import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { getBlogImageAsset } from '../src/data/blogImageManifest.js';
import BLOG_IMAGE_OVERRIDES_CANONICAL from '../src/data/blogImageOverrides.canonical.js';

const root = process.cwd();
const reportPath = path.join(root, 'editorial-search-report.latest.json');
const canonicalPath = path.join(root, 'src', 'data', 'blogImageOverrides.canonical.js');
const publicBlogDir = path.join(root, 'public', 'images', 'blog');

const HERO_SIZE = { width: 1600, height: 900 };
const CARD_SIZE = { width: 960, height: 640 };
const FORCE_STABILIZE_SLUGS = [
  'arquitetos-brasileiros-famosos-legado',
  'scandia-home-roupa-cama-luxo',
];

const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

const sanitizeToLocalPath = (slug, slot) => `/images/blog/${slug}/${slot}.webp`;

const toSerializableEntry = (slug) => ({
  hero: { source: 'local', src: sanitizeToLocalPath(slug, 'hero') },
  seo: { source: 'local', src: sanitizeToLocalPath(slug, 'hero') },
  card: { source: 'local', src: sanitizeToLocalPath(slug, 'card') },
  thumb: { source: 'local', src: sanitizeToLocalPath(slug, 'card') },
  square: { source: 'local', src: sanitizeToLocalPath(slug, 'card') },
  default: { source: 'local', src: sanitizeToLocalPath(slug, 'hero') },
});

const downloadBuffer = async (url) => {
  if (url.startsWith('/')) {
    const localPath = path.join(root, 'public', url.replace(/^\//, ''));
    return fs.readFileSync(localPath);
  }

  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36',
      accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
      referer: 'https://wgalmeida.com.br/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/')) {
    throw new Error(`Unexpected content-type ${contentType} for ${url}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

const writeWebp = async (buffer, filePath, size) => {
  ensureDir(path.dirname(filePath));
  await sharp(buffer, { failOn: 'none' })
    .resize(size.width, size.height, {
      fit: 'cover',
      position: 'attention',
      withoutEnlargement: false,
    })
    .webp({ quality: 84 })
    .toFile(filePath);
};

const normalizeNeedsSearch = (report) => Array.isArray(report?.blogNeedsSearch) ? report.blogNeedsSearch : [];

const main = async () => {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const targets = normalizeNeedsSearch(report);
  const forcedTargets = FORCE_STABILIZE_SLUGS.map((slug) => ({ slug }));
  const allTargets = [...targets, ...forcedTargets].filter((item, index, array) =>
    array.findIndex((candidate) => candidate.slug === item.slug) === index
  );
  const canonicalSlugs = {
    ...(BLOG_IMAGE_OVERRIDES_CANONICAL?.slugs || {}),
  };
  const output = [];

  for (const item of allTargets) {
    const slug = item.slug;
    const category = item.category;
    const heroAsset = getBlogImageAsset({ slug, category, variant: 'hero', allowCategoryFallback: false });
    const cardAsset = getBlogImageAsset({ slug, category, variant: 'card', allowCategoryFallback: false });

    if (!heroAsset?.src || !cardAsset?.src) {
      output.push({ slug, status: 'skipped', reason: 'missing asset' });
      continue;
    }

    const heroPath = path.join(publicBlogDir, slug, 'hero.webp');
    const cardPath = path.join(publicBlogDir, slug, 'card.webp');

    try {
      const [heroBuffer, cardBuffer] = await Promise.all([
        downloadBuffer(heroAsset.src),
        downloadBuffer(cardAsset.src),
      ]);

      await Promise.all([
        writeWebp(heroBuffer, heroPath, HERO_SIZE),
        writeWebp(cardBuffer, cardPath, CARD_SIZE),
      ]);

      canonicalSlugs[slug] = toSerializableEntry(slug);
      output.push({ slug, status: 'ok', hero: heroAsset.src, card: cardAsset.src });
    } catch (error) {
      output.push({ slug, status: 'error', error: String(error.message || error) });
    }
  }

  const fileContent = `${[
    'const BLOG_IMAGE_OVERRIDES_CANONICAL = {',
    `  generatedAt: ${JSON.stringify(new Date().toISOString())},`,
    "  source: 'canonical-local',",
    `  slugs: ${JSON.stringify(canonicalSlugs, null, 2)}`,
    '};',
    '',
    'export default BLOG_IMAGE_OVERRIDES_CANONICAL;',
    '',
  ].join('\n')}`;

  fs.writeFileSync(canonicalPath, fileContent);
  console.log(JSON.stringify({
    total: allTargets.length,
    ok: output.filter((item) => item.status === 'ok').length,
    errors: output.filter((item) => item.status === 'error').length,
    results: output,
  }, null, 2));
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
