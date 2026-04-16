import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import editorialQueue from '@/data/blogEditorialQueue.generated.json';
import { getBlogImageAsset, getBlogManifestEntry, resolveBlogPublicId } from '@/data/blogImageManifest';
import blogUnsplashSelection from '@/data/blogUnsplashSelection.json';
import editorialSearchReport from '../../editorial-search-report.latest.json';
import editorialHealthReport from '../../editorial-health-status.latest.json';
import styleCatalog from '@/utils/styleCatalog';
import STYLE_IMAGE_MANIFEST from '@/data/styleImageManifest';
import { parseFrontmatter } from '@/utils/frontmatter';
import { buildStyleEditorialSearchPlan } from '@/lib/styleEditorialSearchProfile';
import {
  buildCloudinaryEditorialUrl,
  getCloudinaryEditorialCloudName,
} from '@/utils/cloudinaryEditorial';
import { withBasePath } from '@/utils/assetPaths';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Search,
  Trash2,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const rawBlogPosts = import.meta.glob('/src/content/blog/*.md', { as: 'raw', eager: true });

const STORAGE_KEY = 'wg_blog_editorial_uploads_v1';
const UNSPLASH_STORAGE_KEY = 'wg_blog_editorial_unsplash_v1';
const EXTERNAL_IMAGES_STORAGE_KEY = 'wg_blog_editorial_external_images_v1';
const CLOUDINARY_WIDGET_SRC = 'https://upload-widget.cloudinary.com/latest/global/all.js';
const CONTEXT_SLOT_NAMES = ['context1', 'context2', 'context3', 'context4'];
const SLOT_LABELS = {
  hero: 'Hero',
  card: 'Card',
  cover: 'Capa',
  context1: 'Extra 1',
  context2: 'Extra 2',
  context3: 'Extra 3',
  context4: 'Extra 4',
};

const CATEGORY_LABELS = {
  arquitetura: 'Arquitetura',
  'arquitetura-internacional': 'Arquitetura Internacional',
  projetos: 'Projetos',
  design: 'Design',
  engenharia: 'Engenharia',
  'guia-estilos': 'Guia de Estilos',
  marcenaria: 'Marcenaria',
  'mercado-imobiliario': 'Mercado Imobiliário',
  sustentabilidade: 'Sustentabilidade',
  tecnologia: 'Tecnologia',
  tendencias: 'Tendências',
  dicas: 'Dicas',
};

const normalizeCategoryKey = (value = '') => String(value)
  .trim()
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .replace(/\s+/g, '-');

const getCategoryLabel = (value = '') => CATEGORY_LABELS[normalizeCategoryKey(value)] || value;
const getSlotLabel = (slotName = '') => SLOT_LABELS[slotName] || slotName;
const isContextSlot = (slotName = '') => /^context\d+$/.test(slotName);
const getSlotVariant = (slotName = '') => {
  if (slotName === 'hero') return 'hero';
  if (slotName === 'card') return 'card';
  if (slotName === 'cover') return 'card';
  if (isContextSlot(slotName)) return 'context';
  return 'card';
};
const getPrimarySlotNames = (record) => (
  record.kind === 'style' ? ['cover'] : ['hero', 'card']
);

const slugifyHeading = (text = '') => String(text)
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9\s-]/g, '')
  .trim()
  .replace(/\s+/g, '-');

const extractSectionTargetOptions = (raw = '') => {
  if (!raw) return [];
  const { content = '' } = parseFrontmatter(raw);
  return content
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .map((line) => line.replace(/^##\s+/, '').trim())
    .filter(Boolean)
    .map((title) => ({
      title,
      id: slugifyHeading(title),
    }));
};

const BLOG_SECTION_TARGETS = Object.fromEntries(
  Object.entries(rawBlogPosts).map(([path, raw]) => {
    const slug = path.split('/').pop()?.replace(/\.md$/, '') || '';
    return [slug, extractSectionTargetOptions(raw)];
  })
);

const readLocalUploads = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocalUploads = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
};

const readLocalUnsplashSelections = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(UNSPLASH_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocalUnsplashSelections = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(UNSPLASH_STORAGE_KEY, JSON.stringify(value));
};

const readLocalExternalImages = () => {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(window.localStorage.getItem(EXTERNAL_IMAGES_STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
};

const writeLocalExternalImages = (value) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(EXTERNAL_IMAGES_STORAGE_KEY, JSON.stringify(value));
};

const getLocalPublicPath = (targetLocalFile) => {
  if (!targetLocalFile) return null;
  const normalized = targetLocalFile.replace(/^public[\\/]/, '').replace(/\\/g, '/');
  return withBasePath(`/${normalized}`);
};

const buildUnsplashSearchUrl = (query) =>
  `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;

const buildGoogleImageSearchUrl = (query) =>
  `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;

const buildUnsplashPhotoPageUrl = (photoId) =>
  photoId ? `https://unsplash.com/photos/${encodeURIComponent(photoId)}` : '';

const buildUnsplashThumbUrl = (photoId) => {
  if (!photoId) return '';
  return `https://unsplash.com/photos/${encodeURIComponent(photoId)}/download?force=true&w=720&h=480&fit=crop`;
};

const isUnsplashImageHost = (hostname = '') => {
  const host = String(hostname).toLowerCase();
  return host === 'images.unsplash.com' || host === 'plus.unsplash.com';
};

const normalizeUnsplashImageUrl = (url) => {
  const nextUrl = new URL(url.toString());
  nextUrl.searchParams.set('auto', 'format');
  nextUrl.searchParams.set('fit', 'crop');
  nextUrl.searchParams.set('w', '720');
  nextUrl.searchParams.set('h', '480');
  nextUrl.searchParams.set('q', '80');
  return nextUrl.toString();
};

const normalizeImageInputValue = (value = '') => {
  const trimmed = String(value).trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('//')) return `https:${trimmed}`;
  if (/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
};

const parseUrlSafe = (value = '') => {
  try {
    return new URL(value);
  } catch {
    return null;
  }
};

const extractUnsplashPhotoId = (input = '') => {
  const raw = String(input).trim();
  if (!raw) return '';

  if (/^[A-Za-z0-9_-]{6,}$/.test(raw) && !raw.includes('/')) {
    return raw;
  }

  const normalized = normalizeImageInputValue(raw);
  const parsed = parseUrlSafe(normalized);
  if (!parsed) return '';

  const host = parsed.hostname.toLowerCase();
  if (host !== 'unsplash.com' && host !== 'www.unsplash.com') {
    return '';
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  const photosIndex = segments.indexOf('photos');
  const candidate = photosIndex >= 0 ? segments[photosIndex + 1] : segments[segments.length - 1];

  if (!candidate) return '';

  const parts = candidate.split('-').filter(Boolean);
  if (parts.length >= 2) {
    return parts[parts.length - 1];
  }

  return candidate;
};

const resolveImageUrlFromInput = (input = '') => {
  const normalized = normalizeImageInputValue(input);
  if (!normalized) {
    return { error: 'Cole uma URL de imagem para adicionar.' };
  }

  const parsed = parseUrlSafe(normalized);
  if (!parsed) {
    return { error: 'URL inválida. Confira e tente novamente.' };
  }

  if (parsed.protocol === 'http:') {
    parsed.protocol = 'https:';
  }

  if (parsed.hostname.includes('google.')) {
    const forwardedImage = parsed.searchParams.get('imgurl') || parsed.searchParams.get('url');
    if (forwardedImage) {
      return resolveImageUrlFromInput(forwardedImage);
    }
  }

  if (isUnsplashImageHost(parsed.hostname)) {
    return {
      source: 'unsplash-image',
      src: normalizeUnsplashImageUrl(parsed),
      unsplashPhotoId: '',
      pageUrl: '',
    };
  }

  const unsplashPhotoId = extractUnsplashPhotoId(normalized);
  if (unsplashPhotoId) {
    return {
      source: 'unsplash',
      src: buildUnsplashThumbUrl(unsplashPhotoId),
      unsplashPhotoId,
      pageUrl: buildUnsplashPhotoPageUrl(unsplashPhotoId),
    };
  }

  return {
    source: 'remote',
    src: parsed.toString(),
    unsplashPhotoId: '',
    pageUrl: '',
  };
};

const getManifestSlotPublicId = (slug, slot) => {
  const entry = getBlogManifestEntry(slug);
  return resolveBlogPublicId(entry, slot);
};

const getStylePublicId = (slug) => (slug ? STYLE_IMAGE_MANIFEST?.[slug] || '' : '');

const escapeJsonString = (value = '') =>
  String(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');

const normalizeUnsplashSelectionValue = (value) => {
  if (!value) {
    return { id: '', alt: '' };
  }

  if (typeof value === 'string') {
    return { id: value.trim(), alt: '' };
  }

  if (typeof value === 'object') {
    return {
      id: typeof value.id === 'string' ? value.id.trim() : '',
      alt: typeof value.alt === 'string' ? value.alt : '',
    };
  }

  return { id: '', alt: '' };
};

const getEffectiveUnsplashSlotState = (slug, slotName, localSelections) => {
  const baseState = normalizeUnsplashSelectionValue(blogUnsplashSelection?.slugs?.[slug]?.[slotName]);
  const localState = normalizeUnsplashSelectionValue(localSelections?.[slug]?.[slotName]);
  const resolvedId = localState.id || baseState.id;

  return {
    id: resolvedId,
    alt: localState.alt || baseState.alt,
    pageUrl: buildUnsplashPhotoPageUrl(resolvedId),
    source: localState.id || localState.alt ? 'local-session' : baseState.id ? 'selection-json' : 'pending',
  };
};

const getManifestContextAsset = (slug, slotName) => {
  const entry = getBlogManifestEntry(slug);
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.context)) return null;
  const index = CONTEXT_SLOT_NAMES.indexOf(slotName);
  if (index < 0) return null;
  return entry.context[index] || null;
};

const buildUnsplashSelectionSnippet = (slug, heroSelection, cardSelection) => {
  const lines = [`"${slug}": {`];

  if (heroSelection?.id) {
    lines.push('  "hero": {');
    lines.push(`    "id": "${escapeJsonString(heroSelection.id)}",`);
    lines.push(`    "alt": "${escapeJsonString(heroSelection.alt)}"`);
    lines.push(cardSelection?.id ? '  },' : '  }');
  }

  if (cardSelection?.id) {
    lines.push('  "card": {');
    lines.push(`    "id": "${escapeJsonString(cardSelection.id)}",`);
    lines.push(`    "alt": "${escapeJsonString(cardSelection.alt)}"`);
    lines.push('  }');
  }

  if (lines.length === 1) return '';

  lines.push('},');
  return lines.join('\n');
};

const getEffectiveSlotState = (record, slot, uploads) => {
  const localUpload = uploads?.[record.slug]?.[slot.slot] || null;
  const localSessionUrl = !localUpload?.publicId
    ? (
      (typeof localUpload?.src === 'string' && localUpload.src.trim()) ||
      (typeof localUpload?.secureUrl === 'string' && localUpload.secureUrl.trim()) ||
      ''
    )
    : '';
  const localPublicId = typeof localUpload?.publicId === 'string' ? localUpload.publicId.trim() : '';
  const publicId = localPublicId || (!localSessionUrl
    ? (
      record.kind === 'style'
        ? getStylePublicId(record.slug)
        : isContextSlot(slot.slot)
          ? ''
          : getManifestSlotPublicId(record.slug, slot.slot)
    )
    : '');
  const contextAsset = !localUpload && !publicId && !localSessionUrl && record.kind === 'blog' && isContextSlot(slot.slot)
    ? getManifestContextAsset(record.slug, slot.slot)
    : null;
  const remoteAsset = !localUpload && !publicId && !localSessionUrl
    ? (
      record.kind === 'style'
        ? null
        : isContextSlot(slot.slot)
          ? contextAsset
          : getBlogImageAsset({
              slug: record.slug,
              variant: getSlotVariant(slot.slot),
              allowCategoryFallback: false,
            })
    )
    : null;
  const previewUrl = publicId
    ? buildCloudinaryEditorialUrl(publicId, getSlotVariant(slot.slot))
    : localSessionUrl || remoteAsset?.src || getLocalPublicPath(slot.targetLocalFile);

  return {
    publicId,
    localSessionUrl,
    previewUrl,
    alt: localUpload?.alt || remoteAsset?.alt || '',
    caption: localUpload?.caption || remoteAsset?.caption || '',
    sectionTitle: localUpload?.sectionTitle || remoteAsset?.sectionTitle || '',
    sectionId: localUpload?.sectionId || remoteAsset?.sectionId || '',
    pageUrl: localUpload?.pageUrl || remoteAsset?.page || remoteAsset?.photoPageUrl || '',
    uploadedAt: localUpload?.uploadedAt || null,
    source: localUpload
      ? localPublicId
        ? 'local-session'
        : 'local-session-url'
      : publicId
        ? 'manifest'
        : remoteAsset?.source || 'pending',
  };
};

const buildManifestEntrySnippet = (slug, heroPublicId, cardPublicId) => {
  const lines = [`'${slug}': {`];

  if (heroPublicId) {
    lines.push(`  hero: '${heroPublicId}',`);
    lines.push(`  seo: '${heroPublicId}',`);
  }

  if (cardPublicId) {
    lines.push(`  card: '${cardPublicId}',`);
    lines.push(`  thumb: '${cardPublicId}',`);
    lines.push(`  square: '${cardPublicId}',`);
  }

  const defaultPublicId = heroPublicId || cardPublicId;
  if (defaultPublicId) {
    lines.push(`  default: '${defaultPublicId}',`);
  }

  if (lines.length === 1) return '';

  lines.push('},');
  return lines.join('\n');
};

const buildManifestRemoteValue = (slotState) => {
  if (!slotState?.localSessionUrl) return null;

  return {
    source: slotState.localSessionUrl.includes('unsplash.com') ? 'unsplash' : 'remote',
    src: slotState.localSessionUrl,
    alt: slotState.alt || '',
    page: slotState.pageUrl || '',
    caption: slotState.caption || '',
    sectionTitle: slotState.sectionTitle || '',
    sectionId: slotState.sectionId || '',
  };
};

const buildBlogManifestSnippet = (record, uploads) => {
  const heroState = getEffectiveSlotState(record, { slot: 'hero' }, uploads);
  const cardState = getEffectiveSlotState(record, { slot: 'card' }, uploads);
  const lines = [`'${record.slug}': {`];

  const heroValue = heroState.publicId || buildManifestRemoteValue(heroState);
  const cardValue = cardState.publicId || buildManifestRemoteValue(cardState);

  if (typeof heroValue === 'string') {
    lines.push(`  hero: '${heroValue}',`);
    lines.push(`  seo: '${heroValue}',`);
  } else if (heroValue) {
    lines.push(`  hero: ${JSON.stringify(heroValue)},`);
    lines.push(`  seo: ${JSON.stringify(heroValue)},`);
  }

  if (typeof cardValue === 'string') {
    lines.push(`  card: '${cardValue}',`);
    lines.push(`  thumb: '${cardValue}',`);
    lines.push(`  square: '${cardValue}',`);
  } else if (cardValue) {
    lines.push(`  card: ${JSON.stringify(cardValue)},`);
    lines.push(`  thumb: ${JSON.stringify(cardValue)},`);
    lines.push(`  square: ${JSON.stringify(cardValue)},`);
  }

  const defaultValue = heroValue || cardValue;
  if (typeof defaultValue === 'string') {
    lines.push(`  default: '${defaultValue}',`);
  } else if (defaultValue) {
    lines.push(`  default: ${JSON.stringify(defaultValue)},`);
  }

  const contextValues = CONTEXT_SLOT_NAMES
    .map((slotName) => getEffectiveSlotState(record, { slot: slotName }, uploads))
    .map((slotState) => buildManifestRemoteValue(slotState))
    .filter(Boolean);

  if (contextValues.length > 0) {
    lines.push('  context: [');
    contextValues.forEach((value, index) => {
      lines.push(`    ${JSON.stringify(value)}${index < contextValues.length - 1 ? ',' : ''}`);
    });
    lines.push('  ],');
  }

  if (lines.length === 1) return '';
  lines.push('},');
  return lines.join('\n');
};

const buildStyleManifestSnippet = (record, uploads) => {
  const coverState = getEffectiveSlotState(record, { slot: 'cover' }, uploads);
  if (!coverState.publicId) return '';
  return `  ${JSON.stringify(record.slug)}: ${JSON.stringify(coverState.publicId)},`;
};

const getTwoSlotStatus = (record, uploads) => {
  const primarySlots = getPrimarySlotNames(record);
  const heroState = getEffectiveSlotState(record, { slot: primarySlots[0] }, uploads);
  const cardState = primarySlots[1] ? getEffectiveSlotState(record, { slot: primarySlots[1] }, uploads) : null;
  const heroPublicId = heroState.publicId;
  const cardPublicId = cardState?.publicId || '';
  const heroExternalSrc = heroState.localSessionUrl || '';
  const cardExternalSrc = cardState?.localSessionUrl || '';
  const primaryReady = primarySlots.every((slotName) => {
    const slotState = getEffectiveSlotState(record, { slot: slotName }, uploads);
    return Boolean(slotState.publicId || slotState.localSessionUrl || slotState.previewUrl);
  });

  return {
    heroPublicId,
    cardPublicId,
    heroExternalSrc,
    cardExternalSrc,
    ready: primaryReady,
    snippet: record.kind === 'style'
      ? buildStyleManifestSnippet(record, uploads)
      : buildBlogManifestSnippet(record, uploads),
  };
};

const getUnsplashSelectionStatus = (record, unsplashSelections) => {
  const heroSelection = getEffectiveUnsplashSlotState(record.slug, 'hero', unsplashSelections);
  const cardSelection = getEffectiveUnsplashSlotState(record.slug, 'card', unsplashSelections);

  return {
    heroSelection,
    cardSelection,
    ready: Boolean(heroSelection.id && cardSelection.id),
    snippet: buildUnsplashSelectionSnippet(record.slug, heroSelection, cardSelection),
  };
};

const getEditorialCoverageStatus = (record, uploads, unsplashSelections) => {
  const editorial = getTwoSlotStatus(record, uploads);
  const unsplash = getUnsplashSelectionStatus(record, unsplashSelections);
  const heroSource = editorial.heroPublicId
    ? 'cloudinary'
    : editorial.heroExternalSrc
      ? 'url'
      : unsplash.heroSelection.id
        ? 'unsplash'
        : null;
  const cardSource = editorial.cardPublicId
    ? 'cloudinary'
    : editorial.cardExternalSrc
      ? 'url'
      : unsplash.cardSelection.id
        ? 'unsplash'
        : null;
  const ready = Boolean(heroSource && cardSource);
  const sourceSet = new Set([heroSource, cardSource].filter(Boolean));
  const sourceNameByType = {
    cloudinary: 'Cloudinary',
    unsplash: 'Unsplash',
    url: 'URL local',
  };
  const sourceLabel = sourceSet.size
    ? Array.from(sourceSet).map((value) => sourceNameByType[value] || value).join(' + ')
    : 'Pendente';

  return {
    editorial,
    unsplash,
    ready,
    heroSource,
    cardSource,
    label: sourceLabel,
  };
};

const AdminBlogEditorial = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [contentTypeFilter, setContentTypeFilter] = useState('todos');
  const [copiedKey, setCopiedKey] = useState('');
  const [uploads, setUploads] = useState({});
  const [unsplashSelections, setUnsplashSelections] = useState({});
  const [externalImages, setExternalImages] = useState({});
  const [urlInputBySlug, setUrlInputBySlug] = useState({});
  const [urlErrorBySlug, setUrlErrorBySlug] = useState({});
  const [compactMode, setCompactMode] = useState(true);
  const [widgetReady, setWidgetReady] = useState(false);
  const [widgetError, setWidgetError] = useState('');
  const [activeUploadKey, setActiveUploadKey] = useState('');
  const [automationStatus, setAutomationStatus] = useState({
    loading: true,
    enabled: false,
    command: 'npm run blog:editorial:auto',
    notes: '',
    error: '',
  });
  const [automationRunning, setAutomationRunning] = useState(false);
  const [automationOutput, setAutomationOutput] = useState('');

  const cloudName = getCloudinaryEditorialCloudName();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wg_unsigned';
  const googleImageSearchApiKey = import.meta.env.VITE_GOOGLE_IMAGE_SEARCH_API_KEY || '';

  useEffect(() => {
    setUploads(readLocalUploads());
    setUnsplashSelections(readLocalUnsplashSelections());
    setExternalImages(readLocalExternalImages());
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadAutomationStatus = async () => {
      try {
        const response = await fetch('/api/editorial-auto');
        const data = await response.json();

        if (cancelled) return;

        setAutomationStatus({
          loading: false,
          enabled: Boolean(data?.enabled),
          command: data?.command || 'npm run blog:editorial:auto',
          notes: data?.notes || '',
          error: response.ok ? '' : (data?.error || 'Não foi possível validar a automação.'),
        });
      } catch {
        if (cancelled) return;

        setAutomationStatus({
          loading: false,
          enabled: false,
          command: 'npm run blog:editorial:auto',
          notes: '',
          error: 'Não foi possível validar a automação neste ambiente.',
        });
      }
    };

    loadAutomationStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    if (window.cloudinary?.createUploadWidget) {
      setWidgetReady(true);
      return undefined;
    }

    const existingScript = document.querySelector(`script[src="${CLOUDINARY_WIDGET_SRC}"]`);
    const handleLoad = () => {
      setWidgetReady(true);
      setWidgetError('');
    };
    const handleError = () => {
      setWidgetError('Não foi possível carregar o Upload Widget do Cloudinary.');
    };

    if (existingScript) {
      existingScript.addEventListener('load', handleLoad);
      existingScript.addEventListener('error', handleError);
      return () => {
        existingScript.removeEventListener('load', handleLoad);
        existingScript.removeEventListener('error', handleError);
      };
    }

    const script = document.createElement('script');
    script.src = CLOUDINARY_WIDGET_SRC;
    script.async = true;
    script.onload = handleLoad;
    script.onerror = handleError;
    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  const copyText = async (value, key) => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? '' : current)), 1800);
    } catch {
      setCopiedKey('');
    }
  };

  const runEditorialAutomation = async () => {
    setAutomationRunning(true);
    setAutomationOutput('');

    try {
      const response = await fetch('/api/editorial-auto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batchSize: 10 }),
      });
      const data = await response.json();
      const nextOutput = [data?.stdout || '', data?.stderr || ''].filter(Boolean).join('\n');

      setAutomationOutput(nextOutput || data?.message || data?.error || 'Sem saída textual.');

      if (!response.ok) {
        setAutomationStatus((current) => ({
          ...current,
          error: data?.error || 'Falha ao rodar a automação.',
        }));
        return;
      }

      setAutomationStatus((current) => ({
        ...current,
        error: '',
        notes: 'Última rodada automática concluída com sucesso neste ambiente.',
      }));
    } catch {
      setAutomationStatus((current) => ({
        ...current,
        error: 'Falha de rede ao chamar a automação.',
      }));
      setAutomationOutput('');
    } finally {
      setAutomationRunning(false);
    }
  };

  const saveUpload = (record, slotName, info) => {
    const existingSlot = uploads?.[record.slug]?.[slotName] || {};
    const nextUploads = {
      ...uploads,
      [record.slug]: {
        ...(uploads[record.slug] || {}),
        [slotName]: {
          ...existingSlot,
          publicId: info.public_id,
          secureUrl: info.secure_url,
          originalFilename: info.original_filename || '',
          uploadedAt: new Date().toISOString(),
        },
      },
    };

    setUploads(nextUploads);
    writeLocalUploads(nextUploads);
  };

  const saveExternalSlotOverride = (record, slotName, image) => {
    if (!image?.src) return;

    const existingSlot = uploads?.[record.slug]?.[slotName] || {};
    const nextUploads = {
      ...uploads,
      [record.slug]: {
        ...(uploads[record.slug] || {}),
        [slotName]: {
          ...existingSlot,
          src: image.src,
          source: image.source || 'remote',
          unsplashPhotoId: image.unsplashPhotoId || '',
          pageUrl: image.pageUrl || '',
          originalUrl: image.originalUrl || image.src,
          uploadedAt: new Date().toISOString(),
        },
      },
    };

    setUploads(nextUploads);
    writeLocalUploads(nextUploads);
  };

  const clearLocalUpload = (slug, slotName) => {
    if (!uploads?.[slug]?.[slotName]) return;

    const nextUploads = { ...uploads };
    delete nextUploads[slug][slotName];
    if (!Object.keys(nextUploads[slug]).length) {
      delete nextUploads[slug];
    }

    setUploads(nextUploads);
    writeLocalUploads(nextUploads);
  };

  const updateUnsplashSelection = (slug, slotName, field, value) => {
    const nextSelections = {
      ...unsplashSelections,
      [slug]: {
        ...(unsplashSelections[slug] || {}),
        [slotName]: {
          ...normalizeUnsplashSelectionValue(unsplashSelections?.[slug]?.[slotName]),
          [field]: value,
        },
      },
    };

    setUnsplashSelections(nextSelections);
    writeLocalUnsplashSelections(nextSelections);
  };

  const updateLocalSlotMetadata = (record, slotName, field, value) => {
    const existingSlot = uploads?.[record.slug]?.[slotName] || {};
    const nextUploads = {
      ...uploads,
      [record.slug]: {
        ...(uploads[record.slug] || {}),
        [slotName]: {
          ...existingSlot,
          [field]: value,
        },
      },
    };

    setUploads(nextUploads);
    writeLocalUploads(nextUploads);
  };

  const clearLocalUnsplashSelection = (slug, slotName) => {
    if (!unsplashSelections?.[slug]?.[slotName]) return;

    const nextSelections = { ...unsplashSelections };
    delete nextSelections[slug][slotName];
    if (!Object.keys(nextSelections[slug]).length) {
      delete nextSelections[slug];
    }

    setUnsplashSelections(nextSelections);
    writeLocalUnsplashSelections(nextSelections);
  };

  const removeExternalImage = (slug, imageId) => {
    if (!externalImages?.[slug]?.length) return;

    const nextImages = { ...externalImages };
    nextImages[slug] = nextImages[slug].filter((image) => image.id !== imageId);

    if (!nextImages[slug].length) {
      delete nextImages[slug];
    }

    setExternalImages(nextImages);
    writeLocalExternalImages(nextImages);
  };

  const assignExternalImageToSlot = (record, slotName, image) => {
    if (!image?.src) return;
    saveExternalSlotOverride(record, slotName, image);
    clearLocalUnsplashSelection(record.slug, slotName);
  };

  const clearAllLocalEditorialData = () => {
    setUploads({});
    setUnsplashSelections({});
    setExternalImages({});
    setUrlInputBySlug({});
    setUrlErrorBySlug({});

    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(UNSPLASH_STORAGE_KEY);
      window.localStorage.removeItem(EXTERNAL_IMAGES_STORAGE_KEY);
    }
  };

  const addExternalImageFromInput = (record) => {
    const rawInput = urlInputBySlug[record.slug] || '';
    const resolved = resolveImageUrlFromInput(rawInput);

    if (resolved.error) {
      setUrlErrorBySlug((current) => ({
        ...current,
        [record.slug]: resolved.error,
      }));
      return;
    }

    const existing = externalImages?.[record.slug] || [];
    const normalizedSrc = resolved.src;
    const alreadyAdded = existing.some((image) => image.src === normalizedSrc);

    if (alreadyAdded) {
      setUrlErrorBySlug((current) => ({
        ...current,
        [record.slug]: 'Essa imagem já está na lista de thumbs deste post.',
      }));
      return;
    }

    const nextImages = {
      ...externalImages,
      [record.slug]: [
        ...existing,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          src: normalizedSrc,
          source: resolved.source,
          unsplashPhotoId: resolved.unsplashPhotoId || '',
          pageUrl: resolved.pageUrl || '',
          originalUrl: rawInput.trim(),
          addedAt: new Date().toISOString(),
        },
      ],
    };

    setExternalImages(nextImages);
    writeLocalExternalImages(nextImages);
    setUrlInputBySlug((current) => ({ ...current, [record.slug]: '' }));
    setUrlErrorBySlug((current) => ({ ...current, [record.slug]: '' }));

    if (resolved.unsplashPhotoId) {
      const heroCurrent = getEffectiveUnsplashSlotState(record.slug, 'hero', unsplashSelections).id;
      const cardCurrent = getEffectiveUnsplashSlotState(record.slug, 'card', unsplashSelections).id;

      if (!heroCurrent) {
        updateUnsplashSelection(record.slug, 'hero', 'id', resolved.unsplashPhotoId);
      } else if (!cardCurrent) {
        updateUnsplashSelection(record.slug, 'card', 'id', resolved.unsplashPhotoId);
      }
    }
  };

  const openUploadWidget = (record, slot) => {
    if (!widgetReady || !window.cloudinary?.createUploadWidget) return;

    setActiveUploadKey(`${record.slug}:${slot.slot}`);

    const sources = ['local', 'url', 'unsplash'];
    if (googleImageSearchApiKey) {
      sources.push('image_search');
    }

    const widget = window.cloudinary.createUploadWidget(
      {
        cloudName,
        uploadPreset,
        sources,
        googleApiKey: googleImageSearchApiKey || undefined,
        searchBySites: googleImageSearchApiKey
          ? ['unsplash.com', 'pexels.com', 'pixabay.com', 'wikimedia.org']
          : undefined,
        multiple: false,
        maxFiles: 1,
        resourceType: 'image',
        showAdvancedOptions: false,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
        prepareUploadParams: (cb) => {
          const folder = record.kind === 'style'
            ? 'editorial/estilos'
            : `editorial/blog/${record.slug}`;
          const tags = [
            'editorial-visual',
            `${record.kind}:${record.slug}`,
            `slot:${slot.slot}`,
            `category:${record.category}`,
          ];
          cb({
            folder,
            publicId: slot.slot === 'cover' ? record.slug : slot.slot,
            tags,
            context: `record=${record.slug}|kind=${record.kind}|slot=${slot.slot}`,
            uploadPreset,
            overwrite: true,
            resourceType: 'image',
            uniqueFilename: false,
            useFilename: false,
          });
        },
      },
      (error, result) => {
        if (error) {
          setWidgetError(error.message || 'Falha ao abrir o Upload Widget do Cloudinary.');
          setActiveUploadKey('');
          return;
        }

        if (!result) return;

        if (result.event === 'success') {
          saveUpload(record, slot.slot, result.info);
          setWidgetError('');
          setActiveUploadKey('');
        }

        if (result.event === 'close' || result.event === 'abort') {
          setActiveUploadKey('');
        }
      }
    );

    widget.open();
  };

  const styleQueue = styleCatalog.map((style) => {
    const searchPlan = buildStyleEditorialSearchPlan(style);

    return {
      slug: style.slug,
      title: style.title,
      category: 'guia-estilos',
      kind: 'style',
      currentImage: style.image,
      boldCount: 0,
      inlineImageCount: 0,
      needsCopyNormalization: false,
      status: {
        hasFrontmatterImage: Boolean(style.image),
        hasInlineImages: false,
        hasManifestEntry: Boolean(getStylePublicId(style.slug)),
        isVariantEntry: false,
        hasCloudinaryHero: Boolean(getStylePublicId(style.slug)),
        hasCloudinaryCard: Boolean(getStylePublicId(style.slug)),
        hasLocalHero: false,
        hasLocalCard: false,
        readyForTwoSlotEditorial: Boolean(getStylePublicId(style.slug)),
      },
      slots: [
        {
          slot: 'cover',
          mainQuery: searchPlan.mainQuery,
          searchTerms: searchPlan.searchTerms,
          searchQuery: searchPlan.searchQuery,
          intent: searchPlan.intent,
          targetLocalFile: `public/images/estilos/${style.slug}.webp`,
          targetCloudinaryId: `editorial/estilos/${style.slug}`,
          orientation: 'landscape',
        },
      ],
      routePath: `/estilos/${style.slug}`,
    };
  });

  const combinedQueue = [
    ...editorialQueue.map((record) => ({
      ...record,
      kind: 'blog',
      routePath: `/blog/${record.slug}`,
      slots: [
        ...(record.slots || []),
        ...CONTEXT_SLOT_NAMES.map((slotName, index) => ({
          slot: slotName,
          mainQuery: `${record.title} ambiente detalhe editorial ${index + 1}`,
          searchTerms: [record.category, record.slug, 'interiores', 'detalhe'],
          searchQuery: `${record.title} ambiente detalhe editorial ${index + 1}`,
          intent: `imagem extra ${index + 1} para intercalar no artigo`,
          targetLocalFile: `public/images/blog/${record.slug}/${slotName}.webp`,
          targetCloudinaryId: `editorial/blog/${record.slug}/${slotName}`,
          orientation: 'landscape',
        })),
      ],
    })),
    ...styleQueue,
  ];

  const queueWithStatus = combinedQueue.map((record) => {
    const coverage = getEditorialCoverageStatus(record, uploads, unsplashSelections);
    const categoryKey = normalizeCategoryKey(record.category);
    const searchQueueEntry = (
      editorialSearchReport?.blogNeedsSearch?.find((entry) => entry.slug === record.slug) ||
      editorialSearchReport?.styles?.find((entry) => entry.slug === record.slug) ||
      null
    );

    return {
      ...record,
      categoryKey,
      kindLabel: record.kind === 'style' ? 'Guia de Estilo' : 'Blog',
      categoryLabel: getCategoryLabel(record.category),
      editorial: coverage.editorial,
      unsplash: coverage.unsplash,
      coverage,
      searchQueueEntry,
      needsEditorialSearch: Boolean(searchQueueEntry),
    };
  });

  const summary = {
    total: queueWithStatus.length,
    ready: queueWithStatus.filter((record) => record.coverage.ready).length,
    pending: queueWithStatus.filter((record) => !record.coverage.ready).length,
    needsCopyNormalization: queueWithStatus.filter((record) => record.needsCopyNormalization).length,
    blog: queueWithStatus.filter((record) => record.kind === 'blog').length,
    styles: queueWithStatus.filter((record) => record.kind === 'style').length,
  };
  const searchSummary = editorialSearchReport?.summary || {};
  const editorialHealthSummary = editorialHealthReport?.summary || {};
  const editorialHealthBlog = editorialHealthReport?.blog || {};
  const editorialHealthStyles = editorialHealthReport?.styles || {};
  const editorialSearchQueue = queueWithStatus
    .filter((record) => record.needsEditorialSearch)
    .sort((left, right) => {
      if (left.kind !== right.kind) return left.kind === 'blog' ? -1 : 1;
      return left.title.localeCompare(right.title, 'pt-BR');
    });
  const visibleEditorialSearchQueue = editorialSearchQueue
    .filter((record) => {
      const matchesSearch = !searchTerm || [record.title, record.slug, record.category]
        .join(' ')
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'todos' || record.categoryKey === categoryFilter;
      const matchesContentType = contentTypeFilter === 'todos' || record.kind === contentTypeFilter;
      return matchesSearch && matchesCategory && matchesContentType;
    })
    .slice(0, 8);

  const categoryOptions = Array.from(
    new Map(
      queueWithStatus.map((record) => [record.categoryKey, record.categoryLabel])
    ).entries()
  )
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

  const manifestSnippet = queueWithStatus
    .filter((record) => record.kind === 'blog')
    .map((record) => record.editorial.snippet)
    .filter(Boolean)
    .join('\n');

  const styleManifestSnippet = queueWithStatus
    .filter((record) => record.kind === 'style')
    .map((record) => record.editorial.snippet)
    .filter(Boolean)
    .join('\n');

  const unsplashManifestSnippet = queueWithStatus
    .map((record) => record.unsplash.snippet)
    .filter(Boolean)
    .join('\n');


  const filteredQueue = queueWithStatus.filter((record) => {
    const matchesSearch = !searchTerm || [record.title, record.slug, record.category]
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === 'todos' || record.categoryKey === categoryFilter;
    const matchesContentType = contentTypeFilter === 'todos' || record.kind === contentTypeFilter;

    const matchesStatus = (
      statusFilter === 'todos' ||
      (statusFilter === 'pendentes' && !record.coverage.ready) ||
      (statusFilter === 'prontos' && record.coverage.ready)
    );

    return matchesSearch && matchesCategory && matchesContentType && matchesStatus;
  });

  const hasActiveFilters = Boolean(
    searchTerm ||
    categoryFilter !== 'todos' ||
    contentTypeFilter !== 'todos' ||
    statusFilter !== 'todos'
  );

  const resetQueueFilters = () => {
    setSearchTerm('');
    setCategoryFilter('todos');
    setContentTypeFilter('todos');
    setStatusFilter('todos');
  };

  return (
    <>
      <SEO
        pathname="/admin/blog-editorial"
        title="Admin Editorial Visual | WG Almeida"
        description="Fila visual consolidada de blog e estilos, com thumbs, slots extras e manifesto."
        noindex
      />

      <div className="min-h-screen bg-[#F4F2EC] py-8 text-[#1E2A3A]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 md:px-6">
          <div className="flex flex-col gap-4 rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm md:flex-row md:items-start md:justify-between">
            <div className="space-y-4">
              <Link
                to="/admin"
                className="inline-flex items-center gap-2 text-sm text-[#5B6470] transition-colors hover:text-[#1E2A3A]"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar ao painel
              </Link>

              <div className="space-y-2">
                <span className="inline-flex rounded-full bg-[#E8E0D1] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7A5B2F]">
                  Curadoria visual
                </span>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1E2A3A] md:text-4xl">
                  Painel visual enxuto para blog e guias de estilos
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[#5B6470] md:text-[15px]">
                  O foco aqui é trabalhar com thumbs e slots. Blog agora aceita hero, card e até 4 imagens
                  extras intercaladas no conteúdo. Guias de estilos entram na mesma fila com capa dedicada.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
              <button
                type="button"
                onClick={resetQueueFilters}
                className="rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#B89E73] hover:shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Total</p>
                <p className="mt-2 text-3xl font-semibold text-[#1E2A3A]">{summary.total}</p>
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('prontos')}
                className="rounded-2xl border border-[#D7D1C5] bg-[#F1F8F4] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#8FB99B] hover:shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#5E7F63]">Prontos</p>
                <p className="mt-2 text-3xl font-semibold text-[#244A35]">{summary.ready}</p>
              </button>
              <button
                type="button"
                onClick={() => setContentTypeFilter('blog')}
                className="rounded-2xl border border-[#D7D1C5] bg-[#FFF8EC] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#D9B36A] hover:shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#A36B12]">Blog</p>
                <p className="mt-2 text-3xl font-semibold text-[#7A5415]">{summary.blog}</p>
              </button>
              <button
                type="button"
                onClick={() => setContentTypeFilter('style')}
                className="rounded-2xl border border-[#D7D1C5] bg-[#EEF4EF] p-4 text-left transition hover:-translate-y-0.5 hover:border-[#8FB99B] hover:shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.16em] text-[#2E7D5A]">Estilos</p>
                <p className="mt-2 text-3xl font-semibold text-[#244A35]">{summary.styles}</p>
              </button>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1E2A3A]">Manifesto do blog</h2>
                  <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                    Hero, card e extras `context1..context4` saem prontos para colar em{' '}
                    <code className="rounded bg-[#F3ECE0] px-1.5 py-0.5 text-xs text-[#7A5B2F]">
                      src/data/blogImageManifest.js
                    </code>
                    .
                  </p>
                </div>

                <Button
                  variant="outline"
                  onClick={() => copyText(manifestSnippet, 'manifest-snippet')}
                  disabled={!manifestSnippet}
                  className="justify-center border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                >
                  <Copy className="mr-2 h-4 w-4" />
                  {copiedKey === 'manifest-snippet' ? 'Copiado' : 'Copiar bloco'}
                </Button>
              </div>

              <textarea
                value={manifestSnippet || '// O bloco aparece aqui quando houver slot preenchido para blog.'}
                readOnly
                className="mt-5 h-48 w-full rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4 font-mono text-xs leading-6 text-[#3B4350] outline-none"
              />
            </section>

            <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
              <div className="flex items-start gap-3">
                {widgetError ? (
                  <AlertCircle className="mt-0.5 h-5 w-5 text-[#A24A4A]" />
                ) : widgetReady ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 text-[#2E7D5A]" />
                ) : (
                  <Loader2 className="mt-0.5 h-5 w-5 animate-spin text-[#7A5B2F]" />
                )}
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-[#1E2A3A]">Fluxo curto</h2>
                  <p className="text-sm leading-6 text-[#5B6470]">
                    O painel foi reduzido para thumbs, slots e manifesto. No blog, extras entram como
                    imagens intercaladas no artigo. Nos estilos, o foco e a capa.
                  </p>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">
                    {widgetError
                      ? widgetError
                      : widgetReady
                        ? `Widget pronto no cloud ${cloudName}.`
                        : 'Carregando widget do Cloudinary...'}
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4 text-sm leading-6 text-[#5B6470]">
                <p>1. Filtre blog ou estilos.</p>
                <p>2. Adicione thumbs por URL ou upload.</p>
                <p>3. Vincule a thumb ao slot certo.</p>
                <p>4. Copie o bloco do manifesto.</p>
              </div>

              <div className="mt-5 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Runner automático</p>
                    <p className="text-sm leading-6 text-[#5B6470]">
                      Disparo direto da fila editorial pelo admin. Em produção ele fica bloqueado por padrão;
                      localmente ou com flag explícita a interface pode executar o comando canônico.
                    </p>
                    <p className="text-xs leading-5 text-[#7A5B2F]">
                      {automationStatus.loading
                        ? 'Validando disponibilidade...'
                        : automationStatus.error || automationStatus.notes || 'Sem observações.'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={runEditorialAutomation}
                      disabled={automationStatus.loading || automationRunning || !automationStatus.enabled}
                      className="bg-[#1E2A3A] text-white hover:bg-[#24354C]"
                    >
                      {automationRunning ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                      )}
                      Rodar automação
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => copyText(automationStatus.command, 'editorial-auto-command')}
                      className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedKey === 'editorial-auto-command' ? 'Comando copiado' : 'Copiar comando'}
                    </Button>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl border border-[#D7D1C5] bg-white p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Comando canônico</p>
                  <code className="mt-2 block overflow-x-auto text-xs leading-6 text-[#1E2A3A]">
                    {automationStatus.command}
                  </code>
                </div>

                {automationOutput && (
                  <textarea
                    value={automationOutput}
                    readOnly
                    className="mt-4 h-40 w-full rounded-2xl border border-[#D7D1C5] bg-white p-4 font-mono text-xs leading-6 text-[#3B4350] outline-none"
                  />
                )}
              </div>
            </section>
          </div>

          <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1E2A3A]">Manifesto de estilos</h2>
                <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                  Capas de guias saem prontas para{' '}
                  <code className="rounded bg-[#F3ECE0] px-1.5 py-0.5 text-xs text-[#7A5B2F]">
                    src/data/styleImageManifest.js
                  </code>
                  .
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => copyText(styleManifestSnippet, 'style-manifest-snippet')}
                disabled={!styleManifestSnippet}
                className="justify-center border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copiedKey === 'style-manifest-snippet' ? 'Copiado' : 'Copiar bloco'}
              </Button>
            </div>

            <textarea
              value={styleManifestSnippet || '// O bloco aparece aqui quando houver capa preenchida para estilos.'}
              readOnly
              className="mt-5 h-40 w-full rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4 font-mono text-xs leading-6 text-[#3B4350] outline-none"
            />
          </section>

          <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-[#1E2A3A]">Bloco pronto do selection JSON</h2>
                <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                  Quando a escolha for hotlink editorial, este bloco vai direto para{' '}
                  <code className="rounded bg-[#F3ECE0] px-1.5 py-0.5 text-xs text-[#7A5B2F]">
                    src/data/blogUnsplashSelection.json
                  </code>
                  .
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => copyText(unsplashManifestSnippet, 'unsplash-selection-snippet')}
                disabled={!unsplashManifestSnippet}
                className="justify-center border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
              >
                <Copy className="mr-2 h-4 w-4" />
                {copiedKey === 'unsplash-selection-snippet' ? 'Copiado' : 'Copiar bloco'}
              </Button>
            </div>

            <textarea
              value={unsplashManifestSnippet || '// O bloco aparece aqui assim que ao menos um slot tiver photo ID definido.'}
              readOnly
              className="mt-5 h-56 w-full rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4 font-mono text-xs leading-6 text-[#3B4350] outline-none"
            />
          </section>

          <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-[#1E2A3A]">Fila automática de busca</h2>
                <p className="max-w-3xl text-sm leading-6 text-[#5B6470]">
                  Esta camada mostra o que ainda depende de referência editorial mais forte. Blog e
                  guias saem daqui com atalho direto para Google Imagens e Unsplash, sem precisar
                  abrir o JSON manualmente.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 lg:min-w-[360px]">
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Blog na fila</p>
                  <p className="mt-2 text-3xl font-semibold text-[#1E2A3A]">
                    {searchSummary.blogNeedsSearch || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#EEF4EF] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#2E7D5A]">Estilos mapeados</p>
                  <p className="mt-2 text-3xl font-semibold text-[#244A35]">
                    {editorialHealthStyles.publicReady || editorialHealthStyles.localWebp || 0}/{editorialHealthStyles.totalStyles || searchSummary.styles || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#EEF4EF] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#2E7D5A]">Health estrutural</p>
                  <p className="mt-2 text-3xl font-semibold text-[#244A35]">
                    {editorialHealthSummary.editorialStructuralClosed ? 'OK' : 'REV'}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Blog manifesto</p>
                  <p className="mt-2 text-3xl font-semibold text-[#1E2A3A]">
                    {editorialHealthBlog.publishedWithManifest || 0}/{editorialHealthBlog.totalPosts || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#FFF8EC] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#A36B12]">Hero remoto/blog</p>
                  <p className="mt-2 text-3xl font-semibold text-[#7A5415]">
                    {searchSummary.blogHeroUnsplashOrRemote || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#F7F3EB] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#7A5B2F]">Card remoto/blog</p>
                  <p className="mt-2 text-3xl font-semibold text-[#7A5B2F]">
                    {searchSummary.blogCardUnsplashOrRemote || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#EEF4EF] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#2E7D5A]">Guias locais</p>
                  <p className="mt-2 text-3xl font-semibold text-[#244A35]">
                    {editorialHealthStyles.publicReady || editorialHealthStyles.localWebp || 0}/{editorialHealthStyles.totalStyles || 0}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#D7D1C5] bg-[#FFF2F2] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-[#A24A4A]">Cloudinary 404</p>
                  <p className="mt-2 text-3xl font-semibold text-[#7B2D2D]">
                    {editorialHealthStyles.cloudinaryBroken || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {visibleEditorialSearchQueue.length > 0 ? (
                visibleEditorialSearchQueue.map((record) => {
                  const primaryQuery = record.searchQueueEntry?.heroQuery
                    || record.searchQueueEntry?.cardQuery
                    || record.searchQueueEntry?.mainQuery
                    || record.slots?.[0]?.mainQuery
                    || record.title;
                  const googleUrl = record.searchQueueEntry?.search?.googleImages
                    || buildGoogleImageSearchUrl(primaryQuery);
                  const unsplashUrl = record.searchQueueEntry?.search?.unsplash
                    || buildUnsplashSearchUrl(primaryQuery);

                  return (
                    <div
                      key={`search-queue-${record.slug}`}
                      className="flex flex-col gap-3 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4 lg:flex-row lg:items-center lg:justify-between"
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
                          <span className="rounded-full bg-white px-3 py-1 text-[#7C7C7C]">
                            {record.kindLabel}
                          </span>
                          <span className="rounded-full bg-[#FFF8EC] px-3 py-1 text-[#A36B12]">
                            Busca assistida
                          </span>
                        </div>
                        <p className="text-base font-semibold text-[#1E2A3A]">{record.title}</p>
                        <p className="text-sm leading-6 text-[#5B6470]">{primaryQuery}</p>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        <Button
                          variant="outline"
                          asChild
                          className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                        >
                          <a href={googleUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Google Imagens
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                        >
                          <a href={unsplashUrl} target="_blank" rel="noreferrer">
                            <Search className="mr-2 h-4 w-4" />
                            Unsplash
                          </a>
                        </Button>
                        <Button
                          variant="outline"
                          asChild
                          className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                        >
                          <a href={withBasePath(record.routePath)} target="_blank" rel="noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir conteúdo
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4 text-sm leading-6 text-[#5B6470]">
                  Nenhum item da fila automática aparece com os filtros atuais.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-3 md:grid-cols-4 lg:min-w-[900px]">
                <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                  Buscar por título ou slug
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Ex.: amsterdam, arquitetura, briefing..."
                    className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                  />
                </label>

                <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                  Categoria
                  <select
                    value={categoryFilter}
                    onChange={(event) => setCategoryFilter(event.target.value)}
                    className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                  >
                    <option value="todos">Todas</option>
                    {categoryOptions.map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                  Conteúdo
                  <select
                    value={contentTypeFilter}
                    onChange={(event) => setContentTypeFilter(event.target.value)}
                    className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                  >
                    <option value="todos">Tudo</option>
                    <option value="blog">Blog</option>
                    <option value="style">Estilos</option>
                  </select>
                </label>

                <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                  Status
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                  >
                    <option value="todos">Todos</option>
                    <option value="pendentes">Pendentes</option>
                    <option value="prontos">Hero + card resolvidos</option>
                  </select>
                </label>
              </div>

              <div className="space-y-3 text-sm leading-6 text-[#5B6470]">
                <div className="rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                  <p className="font-medium text-[#1E2A3A]">
                    {filteredQueue.length} itens na visualização atual
                  </p>
                  <p>{summary.pending} itens ainda pendentes de cobertura principal</p>
                  {hasActiveFilters && (
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#7A5B2F]">
                      Filtro ativo
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStatusFilter('pendentes')}
                    className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                  >
                    Ver pendentes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetQueueFilters}
                    disabled={!hasActiveFilters}
                    className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB] disabled:opacity-45"
                  >
                    Resetar filtros
                  </Button>
                </div>
                <Button
                  variant="outline"
                  onClick={clearAllLocalEditorialData}
                  className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                >
                  Limpar sessão local
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setCompactMode((current) => !current)}
                  className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                >
                  {compactMode ? 'Modo detalhado' : 'Modo compacto'}
                </Button>
              </div>
            </div>
          </section>


          <section className="space-y-5">
            {filteredQueue.map((record) => {
              const primarySlotNames = getPrimarySlotNames(record);
              const recordTargetSlots = record.kind === 'blog'
                ? ['hero', 'card', ...CONTEXT_SLOT_NAMES]
                : ['cover'];
              const slotStatesByName = Object.fromEntries(
                recordTargetSlots.map((slotName) => [slotName, getEffectiveSlotState(record, { slot: slotName }, uploads)])
              );
              const recordExtraImages = externalImages?.[record.slug] || [];
              const recordInputValue = urlInputBySlug?.[record.slug] || '';
              const recordInputError = urlErrorBySlug?.[record.slug] || '';

              return (
              <article
                key={record.slug}
                className={`rounded-[24px] border border-[#D7D1C5] bg-white shadow-sm ${compactMode ? 'p-4' : 'p-6'}`}
              >
                <div className="flex flex-col gap-4 border-b border-[#EEE8DD] pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
                      <span className="rounded-full bg-[#EEF4EF] px-3 py-1 text-[#2E7D5A]">
                        {record.kindLabel}
                      </span>
                      <span className="rounded-full bg-[#E8E0D1] px-3 py-1 text-[#7A5B2F]">
                        {record.categoryLabel}
                      </span>
                      <span className="rounded-full bg-[#EEF4EF] px-3 py-1 text-[#2E7D5A]">
                        {record.coverage.ready ? `Cobertura pronta via ${record.coverage.label}` : 'Pendente'}
                      </span>
                      {record.needsEditorialSearch && (
                        <span className="rounded-full bg-[#FFF8EC] px-3 py-1 text-[#A36B12]">
                          Busca assistida
                        </span>
                      )}
                      {record.needsCopyNormalization && (
                        <span className="rounded-full bg-[#FFF1F1] px-3 py-1 text-[#A24A4A]">
                          Ajustar negritos
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className={`${compactMode ? 'text-xl md:text-2xl' : 'text-2xl'} font-semibold tracking-[-0.02em] text-[#1E2A3A]`}>
                        {record.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#5B6470]">
                        `{record.slug}` · {record.kind === 'blog'
                          ? `${record.boldCount} negritos · ${record.inlineImageCount} imagens inline`
                          : 'capa editorial de estilo'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                    >
                      <a href={withBasePath(record.routePath || `/blog/${record.slug}`)} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {record.kind === 'style' ? 'Abrir guia' : 'Abrir artigo'}
                      </a>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => copyText(record.slug, `slug-${record.slug}`)}
                      className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      {copiedKey === `slug-${record.slug}` ? 'Slug copiado' : 'Copiar slug'}
                    </Button>
                  </div>
                </div>

                <div className="mt-5 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#7C7C7C]">
                        Thumbs e slots
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                        Cole uma URL e vincule a thumb direto ao slot. No blog, os extras viram imagens
                        intercaladas no conteúdo. Em estilos, use a capa.
                      </p>
                    </div>

                    <div className="flex w-full flex-col gap-2 lg:w-auto lg:min-w-[480px]">
                      <div className="flex flex-col gap-2 sm:flex-row">
                        <input
                          value={recordInputValue}
                          onChange={(event) => {
                            setUrlInputBySlug((current) => ({
                              ...current,
                              [record.slug]: event.target.value,
                            }));
                            setUrlErrorBySlug((current) => ({
                              ...current,
                              [record.slug]: '',
                            }));
                          }}
                          onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                              event.preventDefault();
                              addExternalImageFromInput(record);
                            }
                          }}
                          placeholder="Cole a URL da imagem aqui"
                          className="w-full rounded-xl border border-[#D7D1C5] bg-white px-4 py-2.5 text-sm text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                        />
                        <Button
                          type="button"
                          onClick={() => addExternalImageFromInput(record)}
                          className="bg-[#1E2A3A] text-white hover:bg-[#24354C]"
                        >
                          <ImagePlus className="mr-2 h-4 w-4" />
                          Adicionar foto
                        </Button>
                      </div>

                      {recordInputError && (
                        <p className="text-xs text-[#A24A4A]">{recordInputError}</p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    {recordTargetSlots.map((slotName) => {
                      const slotState = slotStatesByName[slotName];
                      const hasLocalOverride = Boolean(
                        uploads?.[record.slug]?.[slotName] || unsplashSelections?.[record.slug]?.[slotName]
                      );
                      if (!slotState?.previewUrl) return null;
                      return (
                      <div
                        key={`${record.slug}-${slotName}`}
                        className={`relative overflow-hidden rounded-xl border border-[#DED7CA] bg-white ${compactMode ? 'w-28' : 'w-32'}`}
                      >
                        <img
                          src={slotState.previewUrl}
                          alt={`${record.title} - ${getSlotLabel(slotName)}`}
                          className={`${compactMode ? 'h-16' : 'h-20'} w-full object-cover`}
                          loading="lazy"
                        />
                        <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#5B6470]">
                          {getSlotLabel(slotName)}
                        </p>
                        {hasLocalOverride && (
                          <button
                            type="button"
                            onClick={() => {
                              clearLocalUpload(record.slug, slotName);
                              clearLocalUnsplashSelection(record.slug, slotName);
                            }}
                            className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-[#7B2D2D] transition hover:bg-white"
                            aria-label={`Excluir override ${slotName}`}
                            title={`Excluir override ${slotName}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      );
                    })}

                    {recordExtraImages.map((image) => (
                      <div
                        key={`${record.slug}-extra-${image.id}`}
                        className={`relative overflow-hidden rounded-xl border border-[#DED7CA] bg-white ${compactMode ? 'w-28' : 'w-32'}`}
                      >
                        <a href={image.pageUrl || image.src} target="_blank" rel="noreferrer">
                          <img
                            src={image.src}
                            alt={`${record.title} - imagem adicional`}
                            className={`${compactMode ? 'h-16' : 'h-20'} w-full object-cover`}
                            loading="lazy"
                          />
                        </a>
                        <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#5B6470]">
                          Extra
                        </p>
                        <button
                          type="button"
                          onClick={() => removeExternalImage(record.slug, image.id)}
                          className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-[#7B2D2D] transition hover:bg-white"
                          aria-label="Excluir thumbnail"
                          title="Excluir thumbnail"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                        <div
                          className="grid border-t border-[#EFE8DC] text-[10px] uppercase tracking-[0.12em]"
                          style={{ gridTemplateColumns: `repeat(${Math.min(recordTargetSlots.length, 3)}, minmax(0, 1fr))` }}
                        >
                          {recordTargetSlots.map((slotName) => {
                            const slotUploadSrc = typeof uploads?.[record.slug]?.[slotName]?.src === 'string'
                              ? uploads[record.slug][slotName].src
                              : '';
                            const isActive = slotUploadSrc === image.src;
                            return (
                              <button
                                key={`${image.id}-${slotName}`}
                                type="button"
                                onClick={() => assignExternalImageToSlot(record, slotName, image)}
                                className={`px-1 py-1.5 transition ${isActive ? 'bg-[#EEF4EF] text-[#2E7D5A]' : 'bg-white text-[#5B6470] hover:bg-[#F7F3EB]'}`}
                                title={`Aplicar como ${getSlotLabel(slotName)}`}
                              >
                                {getSlotLabel(slotName)}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {!compactMode && record.editorial.snippet && (
                  <div className="mt-5 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm leading-6 text-[#5B6470]">
                        Este post já tem snippet útil para manifesto, inclusive quando só um slot estiver fechado.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => copyText(record.editorial.snippet, `snippet-${record.slug}`)}
                        className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedKey === `snippet-${record.slug}` ? 'Snippet copiado' : 'Copiar snippet'}
                      </Button>
                    </div>
                  </div>
                )}

                {!compactMode && record.kind === 'blog' && record.unsplash.snippet && (
                  <div className="mt-5 rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <p className="text-sm leading-6 text-[#5B6470]">
                        Este post já tem snippet útil para o selection JSON do Unsplash, inclusive por slot.
                      </p>
                      <Button
                        variant="outline"
                        onClick={() => copyText(record.unsplash.snippet, `unsplash-snippet-${record.slug}`)}
                        className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        {copiedKey === `unsplash-snippet-${record.slug}` ? 'Snippet copiado' : 'Copiar snippet'}
                      </Button>
                    </div>
                  </div>
                )}

                <div className={`mt-6 grid ${compactMode ? 'gap-3 md:grid-cols-2 xl:grid-cols-3' : 'gap-5 xl:grid-cols-2'}`}>
                  {record.slots.map((slot) => {
                    const slotState = getEffectiveSlotState(record, slot, uploads);
                    const unsplashSlotState = getEffectiveUnsplashSlotState(record.slug, slot.slot, unsplashSelections);
                    const slotCopyKey = `query-${record.slug}-${slot.slot}`;
                    const slotUploadKey = `${record.slug}:${slot.slot}`;
                    const sectionTargetOptions = record.kind === 'blog' && isContextSlot(slot.slot)
                      ? BLOG_SECTION_TARGETS[record.slug] || []
                      : [];

                    return (
                      <section
                        key={`${record.slug}-${slot.slot}`}
                        className={`rounded-3xl border border-[#E3DDCF] bg-[#FBF8F2] ${compactMode ? 'p-4' : 'p-5'}`}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">
                              Slot {slot.slot}
                            </p>
                            <h3 className={`mt-1 font-semibold text-[#1E2A3A] ${compactMode ? 'text-base' : 'text-xl'}`}>
                              {getSlotLabel(slot.slot)}
                            </h3>
                          </div>

                          <div className="rounded-full bg-white px-3 py-1 text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">
                            {slotState.publicId
                              ? slotState.source
                              : unsplashSlotState.id
                                ? unsplashSlotState.source
                                : slotState.previewUrl
                                  ? slotState.source
                                  : 'pendente'}
                          </div>
                        </div>

                        {!compactMode && slotState.previewUrl && (
                          <div className="mt-4 overflow-hidden rounded-2xl border border-[#DED7CA] bg-white">
                            <img
                              src={slotState.previewUrl}
                              alt={`${record.title} - ${slot.slot}`}
                              className={`${compactMode ? 'h-40' : 'h-52'} w-full object-cover`}
                              loading="lazy"
                            />
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Query automática</p>
                          <div className="mt-2 rounded-2xl border border-[#DED7CA] bg-white p-4 text-sm leading-6 text-[#1E2A3A]">
                            {slot.mainQuery || slot.searchQuery}
                          </div>
                        </div>

                        {!compactMode && Array.isArray(slot.searchTerms) && slot.searchTerms.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Termos auxiliares</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {slot.searchTerms.map((term) => (
                                <span
                                  key={`${record.slug}-${slot.slot}-${term}`}
                                  className="rounded-full border border-[#DED7CA] bg-white px-3 py-1 text-xs text-[#5B6470]"
                                >
                                  {term}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {!compactMode && (
                        <div className="mt-4 space-y-2 text-sm leading-6 text-[#5B6470]">
                          <p>
                            <strong className="font-medium text-[#1E2A3A]">Cloudinary target:</strong>{' '}
                            {slot.targetCloudinaryId}
                          </p>
                          <p>
                            <strong className="font-medium text-[#1E2A3A]">Arquivo local:</strong>{' '}
                            {slot.targetLocalFile}
                          </p>
                          {slotState.publicId && (
                            <p>
                              <strong className="font-medium text-[#1E2A3A]">public_id ativo:</strong>{' '}
                              {slotState.publicId}
                            </p>
                          )}
                          {unsplashSlotState.id && (
                            <p>
                              <strong className="font-medium text-[#1E2A3A]">Unsplash photo ID:</strong>{' '}
                              {unsplashSlotState.id}
                            </p>
                          )}
                          {unsplashSlotState.pageUrl && (
                            <p>
                              <strong className="font-medium text-[#1E2A3A]">Página da foto:</strong>{' '}
                              <a
                                href={unsplashSlotState.pageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#7A5B2F] underline-offset-2 hover:underline"
                              >
                                abrir no Unsplash
                              </a>
                            </p>
                          )}
                        </div>
                        )}

                        <div className={`mt-4 grid gap-3 ${record.kind === 'blog' ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
                          {record.kind === 'blog' && (
                          <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                            Unsplash photo ID
                            <input
                              value={unsplashSlotState.id}
                              onChange={(event) =>
                                updateUnsplashSelection(record.slug, slot.slot, 'id', event.target.value)
                              }
                              placeholder="Ex.: ChSZETOal-I"
                              className="rounded-xl border border-[#D7D1C5] bg-white px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                            />
                          </label>
                          )}
                          <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                            Alt da imagem
                            <input
                              value={slotState.alt || ''}
                              onChange={(event) => updateLocalSlotMetadata(record, slot.slot, 'alt', event.target.value)}
                              placeholder="Descrição editorial curta"
                              className="rounded-xl border border-[#D7D1C5] bg-white px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                            />
                          </label>
                          <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                            Legenda / apoio
                            <input
                              value={slotState.caption || ''}
                              onChange={(event) => updateLocalSlotMetadata(record, slot.slot, 'caption', event.target.value)}
                              placeholder="Texto curto para manifesto"
                              className="rounded-xl border border-[#D7D1C5] bg-white px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                            />
                          </label>
                          {record.kind === 'blog' && isContextSlot(slot.slot) && (
                            <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                              Título do bloco
                              <select
                                value={slotState.sectionId || ''}
                                onChange={(event) => {
                                  const nextId = event.target.value;
                                  const nextOption = sectionTargetOptions.find((option) => option.id === nextId);
                                  updateLocalSlotMetadata(record, slot.slot, 'sectionId', nextId);
                                  updateLocalSlotMetadata(record, slot.slot, 'sectionTitle', nextOption?.title || '');
                                }}
                                className="rounded-xl border border-[#D7D1C5] bg-white px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                              >
                                <option value="">Sem vinculo especifico</option>
                                {sectionTargetOptions.map((option) => (
                                  <option key={`${record.slug}-${slot.slot}-${option.id}`} value={option.id}>
                                    {option.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <Button
                            variant="outline"
                            onClick={() => copyText(slot.mainQuery || slot.searchQuery, slotCopyKey)}
                            className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                          >
                            <Copy className="mr-2 h-4 w-4" />
                            {copiedKey === slotCopyKey ? 'Query copiada' : 'Copiar query principal'}
                          </Button>

                          <Button
                            variant="outline"
                            asChild
                            className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                          >
                            <a href={buildUnsplashSearchUrl(slot.mainQuery || slot.searchQuery)} target="_blank" rel="noreferrer">
                              <Search className="mr-2 h-4 w-4" />
                              Abrir Unsplash
                            </a>
                          </Button>

                          {unsplashSlotState.pageUrl && (
                            <Button
                              variant="outline"
                              asChild
                              className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                            >
                              <a href={unsplashSlotState.pageUrl} target="_blank" rel="noreferrer">
                                <ExternalLink className="mr-2 h-4 w-4" />
                                Abrir foto
                              </a>
                            </Button>
                          )}

                          <Button
                            variant="outline"
                            asChild
                            className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                          >
                            <a href={buildGoogleImageSearchUrl(slot.mainQuery || slot.searchQuery)} target="_blank" rel="noreferrer">
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Abrir Google Imagens
                            </a>
                          </Button>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-3">
                          <Button
                            onClick={() => openUploadWidget(record, slot)}
                            disabled={!widgetReady || !uploadPreset}
                            className="bg-[#1E2A3A] text-white hover:bg-[#24354C]"
                          >
                            {activeUploadKey === slotUploadKey ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <ImagePlus className="mr-2 h-4 w-4" />
                            )}
                            Subir no Cloudinary
                          </Button>

                          {uploads?.[record.slug]?.[slot.slot] && (
                            <Button
                              variant="outline"
                              onClick={() => clearLocalUpload(record.slug, slot.slot)}
                              className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                            >
                              Limpar override local
                            </Button>
                          )}
                          {unsplashSelections?.[record.slug]?.[slot.slot] && (
                            <Button
                              variant="outline"
                              onClick={() => clearLocalUnsplashSelection(record.slug, slot.slot)}
                              className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                            >
                              Limpar override Unsplash
                            </Button>
                          )}
                        </div>
                      </section>
                    );
                  })}
                </div>
              </article>
              );
            })}

            {!filteredQueue.length && (
              <div className="rounded-[28px] border border-[#D7D1C5] bg-white p-10 text-center text-[#5B6470] shadow-sm">
                Nenhum post encontrado com os filtros atuais.
              </div>
            )}
          </section>
        </div>
      </div>
    </>
  );
};

export default AdminBlogEditorial;
