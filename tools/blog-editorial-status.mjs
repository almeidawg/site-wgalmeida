import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getBlogManifestEntry, getBlogImageAsset, resolveBlogAsset } from '../src/data/blogImageManifest.js';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'content', 'blog');
const queuePath = path.join(root, 'src', 'data', 'blogEditorialQueue.generated.json');
const reportDate = new Date().toISOString().slice(0, 10);
const latestReportPath = path.join(root, 'blog-editorial-status.latest.json');

const isMarkdownFile = (value) => value.toLowerCase().endsWith('.md');

const readCanonicalPosts = () => {
  return fs
    .readdirSync(blogDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && isMarkdownFile(entry.name))
    .map((entry) => {
      const filePath = path.join(blogDir, entry.name);
      const raw = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(raw);
      const slug = entry.name.replace(/\.md$/i, '');

      return {
        slug,
        filePath,
        title: data.title || slug,
        category: data.category || 'arquitetura',
        image: data.image || '',
      };
    })
    .sort((a, b) => a.slug.localeCompare(b.slug));
};

const readQueueBySlug = () => {
  if (!fs.existsSync(queuePath)) return new Map();

  const records = JSON.parse(fs.readFileSync(queuePath, 'utf8'));
  return new Map(records.map((record) => [record.slug, record]));
};

const isRemoteAsset = (value) => Boolean(value && typeof value === 'object' && typeof value.src === 'string');

const resolveManifestValue = (entry, variant = 'card') => {
  if (!entry || typeof entry !== 'object') return null;
  return entry[variant] || entry.default || entry.hero || entry.card || null;
};

const getManifestEntryType = (entry) => {
  if (!entry) return 'none';
  if (typeof entry === 'string') return 'single';
  if (entry.hero && entry.card) return 'two-slot';
  if (isRemoteAsset(entry)) return 'variant';
  if (isRemoteAsset(entry.hero) || isRemoteAsset(entry.card) || isRemoteAsset(entry.default)) return 'variant';
  return 'variant';
};

const getCoverage = (post, queueRecord) => {
  const manifestEntry = getBlogManifestEntry(post.slug);
  const manifestType = getManifestEntryType(manifestEntry);
  const heroResolved = getBlogImageAsset({ slug: post.slug, category: post.category, variant: 'hero' });
  const cardResolved = getBlogImageAsset({ slug: post.slug, category: post.category, variant: 'card' });
  const heroExplicitValue = resolveManifestValue(manifestEntry, 'hero');
  const cardExplicitValue = resolveManifestValue(manifestEntry, 'card');
  const heroExplicitAsset = heroExplicitValue ? resolveBlogAsset(manifestEntry, 'hero') : null;
  const cardExplicitAsset = cardExplicitValue ? resolveBlogAsset(manifestEntry, 'card') : null;
  const heroCurated = Boolean(heroExplicitValue && heroExplicitAsset);
  const cardCurated = Boolean(cardExplicitValue && cardExplicitAsset);
  const usesDedicatedLocalImage = post.image.startsWith('/images/blog/');
  const usesGenericBanner = post.image.startsWith('/images/banners/');
  const usesOtherImage = Boolean(post.image) && !usesDedicatedLocalImage && !usesGenericBanner;

  if (heroResolved && cardResolved && (heroCurated || cardCurated)) {
    const resolvedSources = new Set([
      heroResolved?.source || 'missing',
      cardResolved?.source || 'missing',
    ]);

    return {
      coverage: resolvedSources.has('remote') ? 'published-remote-curated' : 'published-manifest',
      manifestType,
      queueReady: false,
    };
  }

  if (manifestEntry) {
    return {
      coverage: manifestType === 'two-slot' ? 'published-two-slot' : 'published-manifest',
      manifestType,
      queueReady: Boolean(queueRecord?.status?.readyForTwoSlotEditorial),
    };
  }

  if (usesDedicatedLocalImage) {
    return {
      coverage: 'published-local',
      manifestType,
      queueReady: Boolean(queueRecord?.status?.readyForTwoSlotEditorial),
    };
  }

  if (usesGenericBanner) {
    return {
      coverage: 'generic-banner-fallback',
      manifestType,
      queueReady: false,
    };
  }

  if (usesOtherImage) {
    return {
      coverage: 'published-other',
      manifestType,
      queueReady: false,
    };
  }

  return {
    coverage: 'missing-image',
    manifestType,
    queueReady: false,
  };
};

const queueBySlug = readQueueBySlug();
const canonicalPosts = readCanonicalPosts();
const details = canonicalPosts.map((post) => {
  const queueRecord = queueBySlug.get(post.slug) || null;
  const status = getCoverage(post, queueRecord);

  return {
    slug: post.slug,
    title: post.title,
    category: post.category,
    currentImage: post.image,
    queueTracked: Boolean(queueRecord),
    queueReadyForTwoSlotEditorial: Boolean(queueRecord?.status?.readyForTwoSlotEditorial),
    ...status,
  };
});

const countBy = (key) =>
  details.reduce((accumulator, item) => {
    const bucket = item[key] || 'unknown';
    accumulator[bucket] = (accumulator[bucket] || 0) + 1;
    return accumulator;
  }, {});

const summary = {
  generatedAt: new Date().toISOString(),
  totalPosts: details.length,
  coverage: countBy('coverage'),
  manifestTypes: countBy('manifestType'),
  queueTracked: details.filter((item) => item.queueTracked).length,
  queueReadyForTwoSlotEditorial: details.filter((item) => item.queueReadyForTwoSlotEditorial).length,
  pendingSlugs: details
    .filter((item) => item.coverage === 'generic-banner-fallback' || item.coverage === 'missing-image')
    .map((item) => item.slug),
};

const report = {
  summary,
  details,
};

const outputPath = path.join(root, `blog-editorial-status-${reportDate}.json`);
fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
fs.writeFileSync(latestReportPath, JSON.stringify(report, null, 2));

console.log(`Posts: ${summary.totalPosts}`);
console.log(`Published with manifest: ${summary.coverage['published-manifest'] || 0}`);
console.log(`Published with two-slot manifest: ${summary.coverage['published-two-slot'] || 0}`);
console.log(`Published with remote curated asset: ${summary.coverage['published-remote-curated'] || 0}`);
console.log(`Published with dedicated local image: ${summary.coverage['published-local'] || 0}`);
console.log(`Still using generic banner fallback: ${summary.coverage['generic-banner-fallback'] || 0}`);
console.log(`Queue tracked: ${summary.queueTracked}`);
console.log(`Queue ready for two-slot editorial: ${summary.queueReadyForTwoSlotEditorial}`);
console.log(`Saved report to ${outputPath}`);
console.log(`Saved latest report to ${latestReportPath}`);
