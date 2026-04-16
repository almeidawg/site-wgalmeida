import fs from 'node:fs';
import path from 'node:path';
import { parseFrontmatter } from '../src/utils/frontmatter.js';
import { buildWgEditorialSearchPlan } from '../src/lib/wgVisualSearchProfile.js';
import { getBlogImageAsset, getBlogManifestEntry, resolveBlogAsset } from '../src/data/blogImageManifest.js';
import STYLE_IMAGE_MANIFEST from '../src/data/styleImageManifest.js';
import { buildStyleEditorialSearchPlan } from '../src/lib/styleEditorialSearchProfile.js';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'content', 'blog');
const styleDir = path.join(root, 'src', 'content', 'estilos');
const reportPath = path.join(root, `editorial-search-report-${new Date().toISOString().slice(0, 10)}.json`);
const latestReportPath = path.join(root, 'editorial-search-report.latest.json');

const buildGoogleImagesUrl = (query) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

const buildUnsplashSearchUrl = (query) =>
  `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;

const resolveManifestValue = (entry, variant = 'card') => {
  if (!entry || typeof entry !== 'object') return null;
  return entry[variant] || entry.default || entry.hero || entry.card || null;
};

const getEditorialResolution = (slug, category, variant) => {
  const manifestEntry = getBlogManifestEntry(slug);
  const explicitValue = resolveManifestValue(manifestEntry, variant);
  const explicitAsset = explicitValue ? resolveBlogAsset(manifestEntry, variant) : null;
  const resolvedAsset = getBlogImageAsset({ slug, category, variant });
  const source = resolvedAsset?.source || 'missing';
  const curated = Boolean(
    explicitValue
    && explicitAsset
    && ['cloudinary', 'local', 'remote'].includes(explicitAsset.source || '')
  );

  return {
    source,
    curated,
  };
};

const slugToTitle = (slug = '') =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const styleSlugs = fs
  .readdirSync(styleDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name.replace(/\.md$/, ''))
  .sort();

const styleQueue = styleSlugs.map((slug) => {
  const title = slugToTitle(slug);
  const styleFile = path.join(styleDir, `${slug}.md`);
  const raw = fs.readFileSync(styleFile, 'utf8');
  const { data } = parseFrontmatter(raw);
  const payload = buildStyleEditorialSearchPlan({
    slug,
    title: data.title || title,
    excerpt: data.excerpt || '',
    tags: data.tags || [],
  });

  return {
    kind: 'style',
    slug,
    title,
    hasCloudinary: Boolean(STYLE_IMAGE_MANIFEST?.[slug]),
    mainQuery: payload.mainQuery,
    searchTerms: payload.searchTerms,
    search: {
      googleImages: buildGoogleImagesUrl(payload.mainQuery),
      unsplash: buildUnsplashSearchUrl(payload.mainQuery),
    },
  };
});

const blogFiles = fs
  .readdirSync(blogDir, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
  .map((entry) => entry.name)
  .sort();

const blogQueue = blogFiles.map((filename) => {
  const raw = fs.readFileSync(path.join(blogDir, filename), 'utf8');
  const { data } = parseFrontmatter(raw);
  const slug = filename.replace(/\.md$/, '');
  const title = data.title || slugToTitle(slug);
  const category = data.category || '';
  const hero = getEditorialResolution(slug, category, 'hero');
  const card = getEditorialResolution(slug, category, 'card');
  const plan = buildWgEditorialSearchPlan({ slug, title, category });

  return {
    kind: 'blog',
    slug,
    title,
    category,
    heroSource: hero.source,
    cardSource: card.source,
    heroCurated: hero.curated,
    cardCurated: card.curated,
    needsSearch: (
      ['unsplash', 'missing'].includes(hero.source)
      || (hero.source === 'remote' && !hero.curated)
      || ['unsplash', 'missing'].includes(card.source)
      || (card.source === 'remote' && !card.curated)
    ),
    heroQuery: plan.hero.mainQuery,
    cardQuery: plan.card.mainQuery,
    searchTerms: {
      hero: plan.hero.searchTerms,
      card: plan.card.searchTerms,
    },
    search: {
      heroGoogleImages: buildGoogleImagesUrl(plan.hero.mainQuery),
      heroUnsplash: buildUnsplashSearchUrl(plan.hero.mainQuery),
      cardGoogleImages: buildGoogleImagesUrl(plan.card.mainQuery),
      cardUnsplash: buildUnsplashSearchUrl(plan.card.mainQuery),
    },
  };
});

const hotlinkCandidates = blogQueue.filter((item) => item.needsSearch);

const summary = {
  styles: styleQueue.length,
  stylesWithCloudinary: styleQueue.filter((item) => item.hasCloudinary).length,
  blogPosts: blogQueue.length,
  blogNeedsSearch: hotlinkCandidates.length,
  blogHeroUnsplashOrRemote: blogQueue.filter((item) => item.heroSource === 'unsplash' || (item.heroSource === 'remote' && !item.heroCurated)).length,
  blogCardUnsplashOrRemote: blogQueue.filter((item) => item.cardSource === 'unsplash' || (item.cardSource === 'remote' && !item.cardCurated)).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  summary,
  styles: styleQueue,
  blogNeedsSearch: hotlinkCandidates,
};

fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(report, null, 2));

console.log(`Styles queued: ${summary.styles}`);
console.log(`Styles with Cloudinary: ${summary.stylesWithCloudinary}`);
console.log(`Blog posts queued for search: ${summary.blogNeedsSearch}`);
console.log(`Blog hero still unsplash/remote: ${summary.blogHeroUnsplashOrRemote}`);
console.log(`Blog card still unsplash/remote: ${summary.blogCardUnsplashOrRemote}`);
console.log(`Saved report to ${reportPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
