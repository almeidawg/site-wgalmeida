const CONTEXT_SLOT_NAMES = ['context1', 'context2', 'context3', 'context4'];

const isUnsplashImageUrl = (value = '') => /(?:images|plus)\.unsplash\.com/i.test(String(value));

const buildUnsplashPhotoPageUrl = (photoId = '') =>
  photoId ? `https://unsplash.com/photos/${encodeURIComponent(photoId)}` : '';

const buildUnsplashDownloadUrl = (photoId = '', variant = 'card') => {
  if (!photoId) return '';
  const width = variant === 'hero' ? 1600 : variant === 'context' ? 960 : 720;
  const height = variant === 'hero' ? 900 : variant === 'context' ? 640 : 480;
  return `https://images.unsplash.com/photo-${encodeURIComponent(photoId)}?auto=format&fit=crop&w=${width}&h=${height}&q=80`;
};

export const normalizeUnsplashSelectionValue = (value) => {
  if (!value) return { id: '', alt: '', src: '', page: '' };
  if (typeof value === 'string') return { id: value.trim(), alt: '', src: '', page: '' };

  return {
    id: typeof value.id === 'string' ? value.id.trim() : '',
    alt: typeof value.alt === 'string' ? value.alt : '',
    src: typeof value.src === 'string' ? value.src : '',
    page: typeof value.page === 'string' ? value.page : '',
  };
};

const cloneSerializable = (value) => JSON.parse(JSON.stringify(value));

const buildRemoteValueFromUpload = (slotValue = {}) => {
  const publicId = typeof slotValue.publicId === 'string' ? slotValue.publicId.trim() : '';
  if (publicId) return publicId;

  const src = typeof slotValue.src === 'string'
    ? slotValue.src.trim()
    : typeof slotValue.secureUrl === 'string'
      ? slotValue.secureUrl.trim()
      : '';

  if (!src) return null;

  const sourceRaw = String(slotValue.source || (isUnsplashImageUrl(src) ? 'unsplash' : 'remote')).toLowerCase();
  const source = sourceRaw === 'unsplash-image' ? 'unsplash' : sourceRaw;
  const unsplashPhotoId = typeof slotValue.unsplashPhotoId === 'string' ? slotValue.unsplashPhotoId.trim() : '';
  const fallbackPageUrl = source === 'unsplash' && unsplashPhotoId
    ? buildUnsplashPhotoPageUrl(unsplashPhotoId)
    : '';

  return {
    source,
    src,
    alt: typeof slotValue.alt === 'string' ? slotValue.alt : '',
    page: typeof slotValue.pageUrl === 'string' ? slotValue.pageUrl : fallbackPageUrl,
    caption: typeof slotValue.caption === 'string' ? slotValue.caption : '',
    sectionTitle: typeof slotValue.sectionTitle === 'string' ? slotValue.sectionTitle : '',
    sectionId: typeof slotValue.sectionId === 'string' ? slotValue.sectionId : '',
    sourceLabel: source === 'unsplash' ? 'Unsplash (admin)' : 'Editorial admin',
  };
};

const buildRemoteValueFromUnsplashSelection = (selection, variant) => {
  if (!selection?.id) return null;

  return {
    source: 'unsplash',
    src: selection.src || buildUnsplashDownloadUrl(selection.id, variant),
    alt: selection.alt || '',
    page: selection.page || buildUnsplashPhotoPageUrl(selection.id),
    sourceLabel: 'Unsplash (admin)',
  };
};

const assignPrimarySlotValue = (entry, slotName, value) => {
  if (!value) return;

  if (slotName === 'hero') {
    entry.hero = cloneSerializable(value);
    entry.seo = cloneSerializable(value);
    if (!entry.default) entry.default = cloneSerializable(value);
    return;
  }

  if (slotName === 'card' || slotName === 'cover') {
    entry.card = cloneSerializable(value);
    entry.thumb = cloneSerializable(value);
    entry.square = cloneSerializable(value);
    if (!entry.default) entry.default = cloneSerializable(value);
  }
};

const ensureContextArray = (entry) => {
  if (!Array.isArray(entry.context)) entry.context = [];
  return entry.context;
};

const assignContextValue = (entry, slotName, value) => {
  if (!value) return;
  const context = ensureContextArray(entry);
  const index = CONTEXT_SLOT_NAMES.indexOf(slotName);
  if (index < 0) return;
  context[index] = cloneSerializable(value);
};

const finalizeEntry = (entry) => {
  if (!entry || typeof entry !== 'object') return null;

  if (Array.isArray(entry.context)) {
    entry.context = entry.context.filter(Boolean);
    if (entry.context.length === 0) delete entry.context;
  }

  if (!entry.default) {
    entry.default = cloneSerializable(entry.hero || entry.card || entry.cover || null);
  }

  if (!entry.default && !entry.hero && !entry.card && !entry.seo && !entry.thumb && !entry.square && !entry.context) {
    return null;
  }

  return entry;
};

export const buildEditorialOverrideEntry = ({
  slug,
  uploads = {},
  unsplashSelections = {},
}) => {
  if (!slug) return null;

  const slotUploads = uploads?.[slug] || {};
  const slotSelections = unsplashSelections?.[slug] || {};
  const entry = {};

  ['hero', 'card', 'cover'].forEach((slotName) => {
    const uploadValue = buildRemoteValueFromUpload(slotUploads?.[slotName]);
    if (uploadValue) {
      assignPrimarySlotValue(entry, slotName, uploadValue);
      return;
    }

    const selectionValue = buildRemoteValueFromUnsplashSelection(
      normalizeUnsplashSelectionValue(slotSelections?.[slotName]),
      slotName === 'hero' ? 'hero' : 'card',
    );
    assignPrimarySlotValue(entry, slotName, selectionValue);
  });

  CONTEXT_SLOT_NAMES.forEach((slotName) => {
    const uploadValue = buildRemoteValueFromUpload(slotUploads?.[slotName]);
    if (uploadValue) {
      assignContextValue(entry, slotName, uploadValue);
      return;
    }

    const selectionValue = buildRemoteValueFromUnsplashSelection(
      normalizeUnsplashSelectionValue(slotSelections?.[slotName]),
      'context',
    );
    assignContextValue(entry, slotName, selectionValue);
  });

  return finalizeEntry(entry);
};

export const buildEditorialOverrideMap = ({
  uploads = {},
  unsplashSelections = {},
  managedSlugs = [],
}) => {
  const nextEntries = {};
  const removedSlugs = [];

  managedSlugs.forEach((slug) => {
    const entry = buildEditorialOverrideEntry({ slug, uploads, unsplashSelections });
    if (entry) {
      nextEntries[slug] = entry;
    } else {
      removedSlugs.push(slug);
    }
  });

  return { entries: nextEntries, removedSlugs };
};

export const serializeEditorialOverridesModule = ({
  existing = {},
  entries = {},
  removedSlugs = [],
}) => {
  const merged = {
    generatedAt: new Date().toISOString(),
    source: 'admin-api-sync',
    slugs: {
      ...(existing?.slugs || {}),
    },
  };

  removedSlugs.forEach((slug) => {
    delete merged.slugs[slug];
  });

  Object.entries(entries || {}).forEach(([slug, value]) => {
    if (value) merged.slugs[slug] = value;
  });

  return `/* eslint-disable no-dupe-keys */\n\nconst BLOG_IMAGE_OVERRIDES = ${JSON.stringify(merged, null, 2)};\n\nexport default BLOG_IMAGE_OVERRIDES;\n`;
};
