import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { getBlogManifestEntry, resolveBlogPublicId } from '../src/data/blogImageManifest.js';
import { buildWgEditorialSearchPlan } from '../src/lib/wgVisualSearchProfile.js';

const root = process.cwd();
const blogDir = path.join(root, 'src', 'content', 'blog');
const reportPath = path.join(root, 'blog-editorial-queue-2026-04-09.json');
const generatedDataPath = path.join(root, 'src', 'data', 'blogEditorialQueue.generated.json');

const args = process.argv.slice(2);
const withUnsplash = args.includes('--with-unsplash');
const slugArg = args.find((arg) => arg.startsWith('--slug='))?.split('=')[1] || null;
const limitArg = Number(args.find((arg) => arg.startsWith('--limit='))?.split('=')[1] || '0');
const limit = Number.isFinite(limitArg) && limitArg > 0 ? limitArg : null;
const unsplashAccessKey = process.env.UNSPLASH_ACCESS_KEY || process.env.VITE_UNSPLASH_ACCESS_KEY || '';

const countMarkdownBold = (content) => {
  const matches = content.match(/\*\*[^*]+\*\*/g);
  return matches ? matches.length : 0;
};

const countInlineImages = (content) => {
  const matches = content.match(/!\[[^\]]*\]\([^)]+\)/g);
  return matches ? matches.length : 0;
};

const hasLocalEditorialSlot = (slug, slot) =>
  fs.existsSync(path.join(root, 'public', 'images', 'blog', slug, `${slot}.webp`));

const getManifestStatus = (slug) => {
  const entry = getBlogManifestEntry(slug);
  const heroPublicId = resolveBlogPublicId(entry, 'hero');
  const cardPublicId = resolveBlogPublicId(entry, 'card');
  const isVariantEntry = Boolean(entry && typeof entry === 'object');

  return {
    hasManifestEntry: Boolean(entry),
    isVariantEntry,
    heroPublicId,
    cardPublicId,
    hasCloudinaryHero: Boolean(heroPublicId),
    hasCloudinaryCard: Boolean(cardPublicId),
    readyForTwoSlotEditorial: Boolean(isVariantEntry && heroPublicId && cardPublicId),
  };
};

const fetchUnsplashCandidates = async (queryPlan, orientation = 'landscape') => {
  if (!unsplashAccessKey) {
    return {
      status: 'missing_access_key',
      attemptedQueries: [],
      candidates: [],
    };
  }

  const attemptedQueries = [];
  const candidates = [];
  const seenIds = new Set();
  const queries = [...new Set([queryPlan.mainQuery, ...(queryPlan.searchTerms || [])].filter(Boolean))];

  for (const query of queries) {
    if (candidates.length >= 6) break;
    attemptedQueries.push(query);

    const url = new URL('https://api.unsplash.com/search/photos');
    url.searchParams.set('query', query);
    url.searchParams.set('page', '1');
    url.searchParams.set('per_page', '4');
    url.searchParams.set('orientation', orientation);
    url.searchParams.set('content_filter', 'high');
    url.searchParams.set('order_by', 'relevant');

    const response = await fetch(url, {
      headers: {
        Authorization: `Client-ID ${unsplashAccessKey}`,
        'Accept-Version': 'v1',
      },
    });

    if (!response.ok) {
      const text = await response.text();
      return {
        status: `error_${response.status}`,
        attemptedQueries,
        candidates,
        message: text.slice(0, 300),
      };
    }

    const data = await response.json();
    for (const item of data.results || []) {
      if (seenIds.has(item.id)) continue;
      seenIds.add(item.id);
      candidates.push({
        id: item.id,
        description: item.description || item.alt_description || '',
        photographer: item.user?.name || '',
        profile: item.user?.links?.html || '',
        unsplashPage: item.links?.html || '',
        raw: item.urls?.raw || '',
        regular: item.urls?.regular || '',
        thumb: item.urls?.thumb || '',
        downloadLocation: item.links?.download_location || '',
        query,
      });
      if (candidates.length >= 6) break;
    }
  }

  return {
    status: 'ok',
    attemptedQueries,
    candidates,
  };
};

const readPosts = () => {
  const entries = fs
    .readdirSync(blogDir)
    .filter((name) => name.endsWith('.md'))
    .sort((a, b) => a.localeCompare(b));

  return entries.map((name) => {
    const filePath = path.join(blogDir, name);
    const raw = fs.readFileSync(filePath, 'utf8');
    const { data, content } = matter(raw);
    const slug = data.slug || name.replace(/\.md$/, '');
    const category = (data.category || 'arquitetura').toString().trim().toLowerCase();

    return {
      file: path.relative(root, filePath).replace(/\\/g, '/'),
      slug,
      title: data.title || slug,
      category,
      tags: Array.isArray(data.tags) ? data.tags : [],
      image: data.image || '',
      boldCount: countMarkdownBold(content),
      inlineImageCount: countInlineImages(content),
    };
  });
};

const buildQueue = async () => {
  let posts = readPosts();

  if (slugArg) {
    posts = posts.filter((post) => post.slug === slugArg);
  }

  if (limit) {
    posts = posts.slice(0, limit);
  }

  const results = [];

  for (const post of posts) {
    const queries = buildWgEditorialSearchPlan(post);
    const needsCopyNormalization = post.boldCount >= 20;
    const targetFolder = `public/images/blog/${post.slug}`;
    const manifestStatus = getManifestStatus(post.slug);
    const hasLocalHero = hasLocalEditorialSlot(post.slug, 'hero');
    const hasLocalCard = hasLocalEditorialSlot(post.slug, 'card');

    const slotPlan = [
      {
        slot: 'hero',
        mainQuery: queries.hero.mainQuery,
        searchTerms: queries.hero.searchTerms,
        searchQuery: queries.hero.mainQuery,
        intent: queries.hero.intent,
        targetLocalFile: `${targetFolder}/hero.webp`,
        targetCloudinaryId: `editorial/blog/${post.slug}/hero`,
        orientation: 'landscape',
      },
      {
        slot: 'card',
        mainQuery: queries.card.mainQuery,
        searchTerms: queries.card.searchTerms,
        searchQuery: queries.card.mainQuery,
        intent: queries.card.intent,
        targetLocalFile: `${targetFolder}/card.webp`,
        targetCloudinaryId: `editorial/blog/${post.slug}/card`,
        orientation: 'landscape',
      },
    ];

    if (withUnsplash) {
      for (const slot of slotPlan) {
        slot.unsplash = await fetchUnsplashCandidates(slot, slot.orientation);
      }
    }

    results.push({
      slug: post.slug,
      title: post.title,
      category: post.category,
      currentImage: post.image,
      boldCount: post.boldCount,
      inlineImageCount: post.inlineImageCount,
      needsCopyNormalization,
      status: {
        hasFrontmatterImage: Boolean(post.image),
        hasInlineImages: post.inlineImageCount >= 2,
        hasManifestEntry: manifestStatus.hasManifestEntry,
        isVariantEntry: manifestStatus.isVariantEntry,
        hasCloudinaryHero: manifestStatus.hasCloudinaryHero,
        hasCloudinaryCard: manifestStatus.hasCloudinaryCard,
        hasLocalHero,
        hasLocalCard,
        readyForTwoSlotEditorial: manifestStatus.readyForTwoSlotEditorial,
      },
      slots: slotPlan,
    });
  }

  const payload = `${JSON.stringify(results, null, 2)}\n`;
  fs.writeFileSync(reportPath, payload);
  fs.writeFileSync(generatedDataPath, payload);
  console.log(`Saved ${results.length} editorial records to ${reportPath}`);
  console.log(`Generated app data at ${generatedDataPath}`);
  if (withUnsplash && !unsplashAccessKey) {
    console.log('Unsplash candidates were skipped because UNSPLASH_ACCESS_KEY is not configured.');
  }
};

buildQueue().catch((error) => {
  console.error(error);
  process.exit(1);
});
