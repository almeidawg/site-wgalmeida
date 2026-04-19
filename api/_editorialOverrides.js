import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const BLOG_OVERRIDES_PATH = path.join(process.cwd(), 'src', 'data', 'blogImageOverrides.generated.js');
const PAGE_OVERRIDES_PATH = path.join(process.cwd(), 'src', 'data', 'publicPageImageOverrides.generated.js');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;

const normalizeSource = (src = '') => {
  if (!isNonEmptyString(src)) return 'remote';
  if (src.startsWith('/')) return 'local';
  if (src.includes('unsplash.com')) return 'unsplash';
  return 'remote';
};

const normalizeSlotOverride = (slotValue) => {
  if (!slotValue || typeof slotValue !== 'object') return null;

  const publicId = isNonEmptyString(slotValue.publicId) ? slotValue.publicId.trim() : '';
  const src = isNonEmptyString(slotValue.src)
    ? slotValue.src.trim()
    : isNonEmptyString(slotValue.secureUrl)
      ? slotValue.secureUrl.trim()
      : '';

  if (!publicId && !src) return null;

  const alt = isNonEmptyString(slotValue.alt) ? slotValue.alt.trim() : '';
  const page = isNonEmptyString(slotValue.pageUrl) ? slotValue.pageUrl.trim() : '';
  const caption = isNonEmptyString(slotValue.caption) ? slotValue.caption.trim() : '';
  const sectionTitle = isNonEmptyString(slotValue.sectionTitle) ? slotValue.sectionTitle.trim() : '';
  const sectionId = isNonEmptyString(slotValue.sectionId) ? slotValue.sectionId.trim() : '';

  if (publicId) {
    return {
      source: 'cloudinary',
      publicId,
      alt,
      page,
      caption,
      sectionTitle,
      sectionId,
    };
  }

  return {
    source: normalizeSource(src),
    src,
    alt,
    page,
    caption,
    sectionTitle,
    sectionId,
  };
};

const cleanFields = (value) => {
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => {
      if (fieldValue == null) return false;
      if (typeof fieldValue === 'string') return fieldValue.trim().length > 0;
      return true;
    })
  );
};

export const buildBlogOverrideEntry = (slots = {}) => {
  const hero = cleanFields(normalizeSlotOverride(slots.hero));
  const card = cleanFields(normalizeSlotOverride(slots.card));
  const context = ['context1', 'context2', 'context3', 'context4']
    .map((slotName) => cleanFields(normalizeSlotOverride(slots[slotName])))
    .filter(Boolean);

  if (!hero && !card && context.length === 0) return null;

  const entry = {};

  if (hero) {
    entry.hero = hero;
    entry.seo = hero;
  }

  if (card) {
    entry.card = card;
    entry.thumb = card;
    entry.square = card;
  }

  if (hero || card) {
    entry.default = hero || card;
  }

  if (context.length > 0) {
    entry.context = context;
  }

  return entry;
};

export const buildPageOverrideEntry = (slots = {}) => {
  const hero = cleanFields(normalizeSlotOverride(slots.hero));
  if (!hero) return null;
  return { hero };
};

const serializeJsModule = (constName, value) => {
  const json = JSON.stringify(value, null, 2);
  return `const ${constName} = ${json};\n\nexport default ${constName};\n`;
};

const loadGeneratedModule = async (filePath, exportName) => {
  try {
    const moduleUrl = `${pathToFileURL(filePath).href}?ts=${Date.now()}`;
    const imported = await import(moduleUrl);
    return imported.default || imported[exportName] || null;
  } catch {
    return null;
  }
};

export async function syncEditorialOverrides({
  uploads = {},
  managedBlogSlugs = [],
  managedPageSlugs = [],
  source = 'admin-editorial-sync',
} = {}) {
  const existingBlog = await loadGeneratedModule(BLOG_OVERRIDES_PATH, 'BLOG_IMAGE_OVERRIDES');
  const existingPages = await loadGeneratedModule(PAGE_OVERRIDES_PATH, 'PUBLIC_PAGE_IMAGE_OVERRIDES');

  const nextBlogSlugs = {
    ...(existingBlog?.slugs || {}),
  };
  const nextPages = {
    ...(existingPages?.pages || {}),
  };

  const managedBlogSet = new Set(managedBlogSlugs.filter(isNonEmptyString));
  const managedPageSet = new Set(managedPageSlugs.filter(isNonEmptyString));

  managedBlogSet.forEach((slug) => {
    const nextEntry = buildBlogOverrideEntry(uploads?.[slug] || {});
    if (nextEntry) {
      nextBlogSlugs[slug] = nextEntry;
      return;
    }
    delete nextBlogSlugs[slug];
  });

  managedPageSet.forEach((slug) => {
    const nextEntry = buildPageOverrideEntry(uploads?.[slug] || {});
    if (nextEntry) {
      nextPages[slug] = nextEntry;
      return;
    }
    delete nextPages[slug];
  });

  const generatedAt = new Date().toISOString();

  const blogPayload = {
    generatedAt,
    source,
    slugs: nextBlogSlugs,
  };
  const pagePayload = {
    generatedAt,
    source,
    pages: nextPages,
  };

  await fs.writeFile(BLOG_OVERRIDES_PATH, serializeJsModule('BLOG_IMAGE_OVERRIDES', blogPayload), 'utf8');
  await fs.writeFile(PAGE_OVERRIDES_PATH, serializeJsModule('PUBLIC_PAGE_IMAGE_OVERRIDES', pagePayload), 'utf8');

  return {
    ok: true,
    generatedAt,
    source,
    blog: {
      target: BLOG_OVERRIDES_PATH,
      synced: Object.keys(nextBlogSlugs).length,
      managed: managedBlogSet.size,
    },
    pages: {
      target: PAGE_OVERRIDES_PATH,
      synced: Object.keys(nextPages).length,
      managed: managedPageSet.size,
    },
  };
}
