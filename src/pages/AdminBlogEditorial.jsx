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
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  ImagePlus,
  Loader2,
  Search,
  Trash2,
  X,
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
  if (coverState.publicId) {
    return `  ${JSON.stringify(record.slug)}: ${JSON.stringify(coverState.publicId)},`;
  }
  const remoteValue = buildManifestRemoteValue(coverState);
  if (remoteValue) {
    const json = JSON.stringify(remoteValue, null, 2).replace(/\n/g, '\n  ');
    return `  ${JSON.stringify(record.slug)}: ${json},`;
  }
  return '';
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
  const [openSearchPanelBySlug, setOpenSearchPanelBySlug] = useState({});
  const [searchQueryBySlug, setSearchQueryBySlug] = useState({});
  const [searchResultsBySlug, setSearchResultsBySlug] = useState({});

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

  const toggleSearchPanel = (slug, defaultQuery = '') => {
    setOpenSearchPanelBySlug((current) => {
      const isOpen = Boolean(current[slug]);
      if (!isOpen && !searchQueryBySlug[slug] && defaultQuery) {
        setSearchQueryBySlug((prev) => ({ ...prev, [slug]: defaultQuery }));
      }
      return { ...current, [slug]: !isOpen };
    });
  };

  const runInlineUnsplashSearch = async (slug) => {
    const query = searchQueryBySlug[slug] || '';
    if (!query.trim()) return;

    setSearchResultsBySlug((current) => ({
      ...current,
      [slug]: { loading: true, photos: [], error: '', query },
    }));

    try {
      const params = new URLSearchParams({ query: query.trim(), orientation: 'landscape', per_page: '9' });
      const response = await fetch(`/api/unsplash-search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        setSearchResultsBySlug((current) => ({
          ...current,
          [slug]: { loading: false, photos: [], error: data?.error || 'Erro ao buscar imagens.', query },
        }));
        return;
      }

      setSearchResultsBySlug((current) => ({
        ...current,
        [slug]: { loading: false, photos: data.photos || [], error: '', query },
      }));
    } catch {
      setSearchResultsBySlug((current) => ({
        ...current,
        [slug]: { loading: false, photos: [], error: 'Falha de rede ao buscar imagens.', query },
      }));
    }
  };

  const assignUnsplashPhotoToSlot = (record, slotName, photo) => {
    const thumbUrl = `${photo.urls.raw}&auto=format&fit=crop&w=720&h=480&q=80`;
    saveExternalSlotOverride(record, slotName, {
      src: thumbUrl,
      source: 'unsplash',
      unsplashPhotoId: photo.id,
      pageUrl: photo.unsplashPage,
      originalUrl: photo.unsplashPage,
    });
    if (slotName === 'hero' || slotName === 'card') {
      updateUnsplashSelection(record.slug, slotName, 'id', photo.id);
      updateUnsplashSelection(record.slug, slotName, 'alt', photo.alt || photo.description || '');
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

      <div className="min-h-screen bg-[#F4F2EC] pb-16 pt-8 text-[#1E2A3A]">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 md:px-6">

          {/* ── HEADER ─────────────────────────────────────────────────── */}
          <header className="rounded-[28px] border border-[#D7D1C5] bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-2">
                <Link to="/admin" className="inline-flex items-center gap-2 text-sm text-[#5B6470] hover:text-[#1E2A3A] transition-colors">
                  <ArrowLeft className="h-4 w-4" />Voltar ao painel
                </Link>
                <div>
                  <span className="inline-flex rounded-full bg-[#E8E0D1] px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-[#7A5B2F]">
                    Curadoria visual
                  </span>
                  <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[#1E2A3A]">Editorial Visual</h1>
                  <p className="mt-1 text-sm text-[#5B6470]">
                    {summary.pending > 0 ? `${summary.pending} itens aguardando imagem.` : 'Tudo coberto. ✓'}
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 lg:min-w-[440px]">
                {[
                  { label: 'Total', value: summary.total, bg: 'bg-[#FBF8F2]', textC: 'text-[#7C7C7C]', valC: 'text-[#1E2A3A]', onClick: resetQueueFilters },
                  { label: 'Prontos', value: summary.ready, bg: 'bg-[#F1F8F4]', textC: 'text-[#5E7F63]', valC: 'text-[#244A35]', onClick: () => setStatusFilter('prontos') },
                  { label: 'Pendentes', value: summary.pending, bg: 'bg-[#FFF2F2]', textC: 'text-[#A24A4A]', valC: 'text-[#7B2D2D]', onClick: () => setStatusFilter('pendentes') },
                ].map(({ label, value, bg, textC, valC, onClick }) => (
                  <button key={label} type="button" onClick={onClick} className={`rounded-2xl border border-[#D7D1C5] ${bg} p-3 text-left transition hover:border-[#B89E73]`}>
                    <p className={`text-[10px] uppercase tracking-[0.14em] ${textC}`}>{label}</p>
                    <p className={`mt-1 text-2xl font-semibold ${valC}`}>{value}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStatusFilter((s) => s === 'pendentes' ? 'todos' : 'pendentes')}
                  className={`rounded-2xl border p-3 text-left transition ${statusFilter === 'pendentes' ? 'border-[#1E2A3A] bg-[#1E2A3A] text-white' : 'border-[#D7D1C5] bg-white text-[#1E2A3A] hover:border-[#1E2A3A]'}`}
                >
                  <p className={`text-[10px] uppercase tracking-[0.14em] ${statusFilter === 'pendentes' ? 'text-white/60' : 'text-[#7C7C7C]'}`}>Produção</p>
                  <p className="mt-1 text-sm font-semibold">{statusFilter === 'pendentes' ? '● Ativo' : 'Modo'}</p>
                </button>
              </div>
            </div>
          </header>

          {/* ── FILTROS ──────────────────────────────────────────────────── */}
          <section className="rounded-[24px] border border-[#D7D1C5] bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-wrap items-end gap-3">
              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                Buscar
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Título, slug ou categoria..."
                  className="w-48 rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-3 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                Categoria
                <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-3 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]">
                  <option value="todos">Todas</option>
                  {categoryOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                Tipo
                <select value={contentTypeFilter} onChange={(e) => setContentTypeFilter(e.target.value)} className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-3 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]">
                  <option value="todos">Tudo</option>
                  <option value="blog">Blog</option>
                  <option value="style">Estilos</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                Status
                <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] px-3 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]">
                  <option value="todos">Todos</option>
                  <option value="pendentes">Pendentes</option>
                  <option value="prontos">Prontos</option>
                </select>
              </label>
              <div className="ml-auto flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#7C7C7C]">{filteredQueue.length} item{filteredQueue.length !== 1 ? 's' : ''}</span>
                {hasActiveFilters && (
                  <Button variant="outline" onClick={resetQueueFilters} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">Limpar filtros</Button>
                )}
                <Button variant="outline" onClick={clearAllLocalEditorialData} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">Limpar sessão</Button>
                <Button variant="outline" onClick={() => setCompactMode((v) => !v)} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">{compactMode ? 'Detalhado' : 'Compacto'}</Button>
              </div>
            </div>
          </section>

          {/* ── FILA PRINCIPAL ───────────────────────────────────────────── */}
          <section className="space-y-4">
            {filteredQueue.length === 0 && (
              <div className="rounded-[24px] border border-[#D7D1C5] bg-white p-10 text-center text-sm text-[#5B6470] shadow-sm">
                Nenhum item com os filtros atuais.{' '}
                {hasActiveFilters && <button type="button" onClick={resetQueueFilters} className="text-[#7A5B2F] underline">Limpar filtros</button>}
              </div>
            )}

            {filteredQueue.map((record) => {
              const primarySlotNames = getPrimarySlotNames(record);
              const recordTargetSlots = record.kind === 'blog' ? ['hero', 'card', ...CONTEXT_SLOT_NAMES] : ['cover'];
              const slotStatesByName = Object.fromEntries(
                recordTargetSlots.map((slotName) => [slotName, getEffectiveSlotState(record, { slot: slotName }, uploads)])
              );
              const recordExtraImages = externalImages?.[record.slug] || [];
              const recordInputValue = urlInputBySlug?.[record.slug] || '';
              const recordInputError = urlErrorBySlug?.[record.slug] || '';
              const panelOpen = Boolean(openSearchPanelBySlug[record.slug]);
              const panelQuery = searchQueryBySlug[record.slug] || record.slots?.[0]?.mainQuery || '';
              const panelResult = searchResultsBySlug[record.slug] || { loading: false, photos: [], error: '' };
              const filledCount = recordTargetSlots.filter((s) => Boolean(slotStatesByName[s]?.previewUrl || slotStatesByName[s]?.publicId)).length;
              const totalSlots = recordTargetSlots.length;

              return (
                <article key={record.slug} className="overflow-hidden rounded-[24px] border border-[#D7D1C5] bg-white shadow-sm">

                  {/* Card header */}
                  <div className="flex flex-col gap-3 border-b border-[#EEE8DD] p-4 lg:flex-row lg:items-start lg:justify-between md:p-5">
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] ${record.kind === 'style' ? 'bg-[#EEF4EF] text-[#2E7D5A]' : 'bg-[#E8E0D1] text-[#7A5B2F]'}`}>
                          {record.kindLabel}
                        </span>
                        <span className="rounded-full bg-[#F4F2EC] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#5B6470]">{record.categoryLabel}</span>
                        {/* Coverage dots */}
                        <span className="flex items-center gap-0.5 rounded-full border border-[#E3DDCF] bg-[#FAFAF8] px-2 py-0.5">
                          {recordTargetSlots.map((slotName) => (
                            <span key={slotName} className={`inline-block h-1.5 w-1.5 rounded-full ${slotStatesByName[slotName]?.previewUrl || slotStatesByName[slotName]?.publicId ? 'bg-[#2E7D5A]' : 'bg-[#DDD7CE]'}`} title={`${getSlotLabel(slotName)}: ${slotStatesByName[slotName]?.previewUrl ? 'OK' : 'pendente'}`} />
                          ))}
                          <span className="ml-1 text-[10px] text-[#7C7C7C]">{filledCount}/{totalSlots}</span>
                        </span>
                        {record.coverage.ready && (
                          <span className="rounded-full bg-[#EEF4EF] px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-[#2E7D5A]">✓ Pronto</span>
                        )}
                      </div>
                      <h2 className="text-lg font-semibold tracking-[-0.02em] text-[#1E2A3A]">{record.title}</h2>
                      <p className="text-[11px] text-[#9B9791]">{record.slug}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      <Button variant="outline" asChild className="border-[#D7D1C5] bg-white text-sm text-[#1E2A3A] hover:bg-[#F7F3EB]">
                        <a href={withBasePath(record.routePath || `/blog/${record.slug}`)} target="_blank" rel="noreferrer">
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />{record.kind === 'style' ? 'Guia' : 'Artigo'}
                        </a>
                      </Button>
                      {record.editorial.snippet && (
                        <Button
                          onClick={() => copyText(record.editorial.snippet, `snippet-${record.slug}`)}
                          className={`text-sm text-white ${record.coverage.ready ? 'bg-[#244A35] hover:bg-[#1E3D2C]' : 'bg-[#1E2A3A] hover:bg-[#24354C]'}`}
                        >
                          <Copy className="mr-1.5 h-3.5 w-3.5" />
                          {copiedKey === `snippet-${record.slug}` ? 'Copiado!' : record.coverage.ready ? '✓ Publicar' : 'Copiar snippet'}
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Slot image previews */}
                  <div className={`grid border-b border-[#EEE8DD] ${record.kind === 'blog' ? 'grid-cols-[2fr_1fr_1fr]' : 'grid-cols-1'}`}>
                    {/* Hero / Cover */}
                    {(() => {
                      const mainSlot = primarySlotNames[0];
                      const mainState = slotStatesByName[mainSlot];
                      const hasOverride = Boolean(uploads?.[record.slug]?.[mainSlot] || unsplashSelections?.[record.slug]?.[mainSlot]);
                      return (
                        <div className="relative border-r border-[#EEE8DD]">
                          {mainState?.previewUrl ? (
                            <img src={mainState.previewUrl} alt={`${record.title} - ${getSlotLabel(mainSlot)}`} className={`w-full object-cover ${record.kind === 'blog' ? 'h-32' : 'h-24'}`} loading="lazy" />
                          ) : (
                            <div className={`flex items-center justify-center bg-[#F4F2EC] ${record.kind === 'blog' ? 'h-32' : 'h-24'}`}>
                              <div className="text-center"><ImagePlus className="mx-auto h-5 w-5 text-[#C5C0BA]" /><p className="mt-0.5 text-[9px] uppercase tracking-[0.1em] text-[#C5C0BA]">Sem imagem</p></div>
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-2 pb-1 pt-3">
                            <span className="text-[9px] uppercase tracking-[0.12em] text-white/80">{getSlotLabel(mainSlot)}</span>
                            {hasOverride && (
                              <button type="button" onClick={() => { clearLocalUpload(record.slug, mainSlot); clearLocalUnsplashSelection(record.slug, mainSlot); }} className="rounded-full bg-white/20 p-0.5 text-white/70 hover:bg-white/40 transition">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Card slot — blog only */}
                    {record.kind === 'blog' && (() => {
                      const cardState = slotStatesByName['card'];
                      const hasOverride = Boolean(uploads?.[record.slug]?.['card'] || unsplashSelections?.[record.slug]?.['card']);
                      return (
                        <div className="relative border-r border-[#EEE8DD]">
                          {cardState?.previewUrl ? (
                            <img src={cardState.previewUrl} alt={`${record.title} - Card`} className="h-32 w-full object-cover" loading="lazy" />
                          ) : (
                            <div className="flex h-32 items-center justify-center bg-[#F4F2EC]">
                              <ImagePlus className="h-5 w-5 text-[#C5C0BA]" />
                            </div>
                          )}
                          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-gradient-to-t from-black/50 to-transparent px-2 pb-1 pt-3">
                            <span className="text-[9px] uppercase tracking-[0.12em] text-white/80">Card</span>
                            {hasOverride && (
                              <button type="button" onClick={() => { clearLocalUpload(record.slug, 'card'); clearLocalUnsplashSelection(record.slug, 'card'); }} className="rounded-full bg-white/20 p-0.5 text-white/70 hover:bg-white/40 transition">
                                <X className="h-2.5 w-2.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Context slots 2×2 — blog only */}
                    {record.kind === 'blog' && (
                      <div className="grid grid-cols-2 grid-rows-2">
                        {CONTEXT_SLOT_NAMES.map((slotName, idx) => {
                          const s = slotStatesByName[slotName];
                          const hasOvr = Boolean(uploads?.[record.slug]?.[slotName] || unsplashSelections?.[record.slug]?.[slotName]);
                          return (
                            <div key={slotName} className={`relative ${idx % 2 === 0 ? 'border-r border-[#EEE8DD]' : ''} ${idx < 2 ? 'border-b border-[#EEE8DD]' : ''}`}>
                              {s?.previewUrl ? (
                                <img src={s.previewUrl} alt={slotName} className="h-16 w-full object-cover" loading="lazy" />
                              ) : (
                                <div className="flex h-16 items-center justify-center bg-[#F8F6F2]">
                                  <span className="text-[8px] uppercase tracking-[0.08em] text-[#C5C0BA]">{getSlotLabel(slotName)}</span>
                                </div>
                              )}
                              {hasOvr && (
                                <button type="button" onClick={() => { clearLocalUpload(record.slug, slotName); clearLocalUnsplashSelection(record.slug, slotName); }} className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-[#7B2D2D] hover:bg-white">
                                  <X className="h-2.5 w-2.5" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Extra images strip */}
                  {recordExtraImages.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto border-b border-[#EEE8DD] px-4 py-2.5">
                      {recordExtraImages.map((image) => (
                        <div key={image.id} className="relative shrink-0 overflow-hidden rounded-lg border border-[#DED7CA] bg-white">
                          <a href={image.pageUrl || image.src} target="_blank" rel="noreferrer">
                            <img src={image.src} alt="Extra" className="h-12 w-16 object-cover" loading="lazy" />
                          </a>
                          <div className="grid border-t border-[#EFE8DC]" style={{ gridTemplateColumns: `repeat(${primarySlotNames.length}, 1fr)` }}>
                            {primarySlotNames.map((slotName) => {
                              const isActive = uploads?.[record.slug]?.[slotName]?.src === image.src;
                              return (
                                <button key={`${image.id}-${slotName}`} type="button" onClick={() => assignExternalImageToSlot(record, slotName, image)} className={`px-1 py-0.5 text-[9px] uppercase tracking-[0.08em] transition ${isActive ? 'bg-[#EEF4EF] text-[#2E7D5A]' : 'bg-white text-[#5B6470] hover:bg-[#F7F3EB]'}`}>
                                  {getSlotLabel(slotName)}
                                </button>
                              );
                            })}
                          </div>
                          <button type="button" onClick={() => removeExternalImage(record.slug, image.id)} className="absolute right-0.5 top-0.5 rounded-full bg-white/80 p-0.5 text-[#7B2D2D]">
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Unsplash search panel */}
                  <div className="border-b border-[#EEE8DD]">
                    <button type="button" onClick={() => toggleSearchPanel(record.slug, record.slots?.[0]?.mainQuery || record.title)} className="flex w-full items-center justify-between gap-3 px-5 py-3 text-left transition hover:bg-[#FAFAF8]">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-[#7A5B2F]" />
                        <span className="text-sm font-medium text-[#1E2A3A]">Buscar no Unsplash</span>
                        {panelResult.photos.length > 0 && !panelOpen && (
                          <span className="rounded-full bg-[#EEF4EF] px-2 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#2E7D5A]">
                            {panelResult.photos.length} foto{panelResult.photos.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                      {panelOpen ? <ChevronUp className="h-4 w-4 text-[#7C7C7C]" /> : <ChevronDown className="h-4 w-4 text-[#7C7C7C]" />}
                    </button>

                    {panelOpen && (
                      <div className="px-5 pb-5 pt-3">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={panelQuery}
                            onChange={(e) => setSearchQueryBySlug((c) => ({ ...c, [record.slug]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runInlineUnsplashSearch(record.slug); } }}
                            placeholder="Ex.: minimalist interior, japandi bedroom..."
                            className="w-full rounded-xl border border-[#D7D1C5] bg-white px-4 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]"
                          />
                          <Button type="button" onClick={() => runInlineUnsplashSearch(record.slug)} disabled={panelResult.loading || !panelQuery.trim()} className="shrink-0 bg-[#1E2A3A] text-sm text-white hover:bg-[#24354C] disabled:opacity-50">
                            {panelResult.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}Buscar
                          </Button>
                        </div>

                        {record.slots?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {[...new Set([record.slots[0]?.mainQuery, ...((record.slots[0]?.searchTerms || []).slice(0, 4))].filter(Boolean))].map((term) => (
                              <button key={`suggest-${record.slug}-${term}`} type="button" onClick={() => setSearchQueryBySlug((c) => ({ ...c, [record.slug]: term }))} className="rounded-full border border-[#DED7CA] bg-white px-2.5 py-0.5 text-xs text-[#5B6470] hover:border-[#B89E73] hover:text-[#7A5B2F] transition">
                                {term}
                              </button>
                            ))}
                          </div>
                        )}

                        {panelResult.error && <p className="mt-3 text-xs text-[#A24A4A]">{panelResult.error}</p>}

                        {panelResult.photos.length > 0 && (
                          <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-5">
                            {panelResult.photos.map((photo) => (
                              <div key={`${record.slug}-${photo.id}`} className="group relative overflow-hidden rounded-xl border border-[#DED7CA] bg-white">
                                <img src={photo.urls.small} alt={photo.alt || ''} className="h-20 w-full object-cover" loading="lazy" />
                                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                                  {primarySlotNames.map((slotName) => (
                                    <button key={`assign-${photo.id}-${slotName}`} type="button" onClick={() => assignUnsplashPhotoToSlot(record, slotName, photo)} className="rounded-lg bg-white/95 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#1E2A3A] hover:bg-white transition">
                                      → {getSlotLabel(slotName)}
                                    </button>
                                  ))}
                                  {record.kind === 'blog' && (
                                    <button type="button" onClick={() => {
                                      if ((externalImages?.[record.slug] || []).some((img) => img.unsplashPhotoId === photo.id)) return;
                                      const nextImages = { ...externalImages, [record.slug]: [...(externalImages?.[record.slug] || []), { id: `${Date.now()}-${photo.id}`, src: `${photo.urls.raw}&auto=format&fit=crop&w=720&h=480&q=80`, source: 'unsplash', unsplashPhotoId: photo.id, pageUrl: photo.unsplashPage, originalUrl: photo.unsplashPage, addedAt: new Date().toISOString() }] };
                                      setExternalImages(nextImages);
                                      writeLocalExternalImages(nextImages);
                                    }} className="rounded-lg bg-[#E8E0D1]/95 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.1em] text-[#7A5B2F] hover:bg-[#E8E0D1] transition">
                                      + Extra
                                    </button>
                                  )}
                                </div>
                                <p className="truncate px-1.5 py-0.5 text-[9px] text-[#7C7C7C]">{photo.photographer}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {panelResult.photos.length === 0 && !panelResult.loading && !panelResult.error && panelQuery.trim() && (
                          <p className="mt-3 text-xs text-[#7C7C7C]">Nenhum resultado. Tente outra query.</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* URL / upload input — compact */}
                  <div className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={recordInputValue}
                        onChange={(e) => { setUrlInputBySlug((c) => ({ ...c, [record.slug]: e.target.value })); setUrlErrorBySlug((c) => ({ ...c, [record.slug]: '' })); }}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addExternalImageFromInput(record); } }}
                        placeholder="Colar URL de imagem (opcional)"
                        className="w-full rounded-xl border border-[#D7D1C5] bg-[#FAFAF8] px-3 py-2 text-sm text-[#1E2A3A] outline-none focus:border-[#B89E73]"
                      />
                      <Button type="button" variant="outline" onClick={() => addExternalImageFromInput(record)} className="shrink-0 border-[#D7D1C5] bg-white text-sm text-[#1E2A3A] hover:bg-[#F7F3EB]" title="Adicionar URL">
                        <ImagePlus className="h-4 w-4" />
                      </Button>
                      {widgetReady && (
                        <Button type="button" variant="outline" onClick={() => openUploadWidget(record, record.slots?.[0] || { slot: primarySlotNames[0] })} className="shrink-0 border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]" title="Upload para Cloudinary">
                          Upload
                        </Button>
                      )}
                    </div>
                    {recordInputError && <p className="mt-1 text-xs text-[#A24A4A]">{recordInputError}</p>}
                  </div>

                  {/* Slot detail cards — detailed mode only */}
                  {!compactMode && (
                    <div className="grid gap-3 border-t border-[#EEE8DD] p-4 md:grid-cols-2 xl:grid-cols-3">
                      {record.slots.map((slot) => {
                        const slotState = getEffectiveSlotState(record, slot, uploads);
                        const unsplashSlotState = getEffectiveUnsplashSlotState(record.slug, slot.slot, unsplashSelections);
                        const slotCopyKey = `query-${record.slug}-${slot.slot}`;
                        const slotUploadKey = `${record.slug}:${slot.slot}`;
                        const sectionTargetOptions = record.kind === 'blog' && isContextSlot(slot.slot)
                          ? BLOG_SECTION_TARGETS[record.slug] || []
                          : [];

                        return (
                          <section key={`${record.slug}-${slot.slot}`} className="rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="text-[10px] uppercase tracking-[0.14em] text-[#7C7C7C]">Slot {slot.slot}</p>
                                <h3 className="text-base font-semibold text-[#1E2A3A]">{getSlotLabel(slot.slot)}</h3>
                              </div>
                              <span className="rounded-full bg-white px-2.5 py-0.5 text-[10px] uppercase tracking-[0.12em] text-[#7C7C7C]">
                                {slotState.publicId ? slotState.source : unsplashSlotState.id ? 'unsplash' : slotState.previewUrl ? slotState.source : 'pendente'}
                              </span>
                            </div>
                            {slotState.previewUrl && (
                              <img src={slotState.previewUrl} alt={`${record.title} - ${slot.slot}`} className="mt-3 h-36 w-full rounded-xl object-cover border border-[#DED7CA]" loading="lazy" />
                            )}
                            <div className="mt-3 rounded-xl border border-[#DED7CA] bg-white p-3 text-xs text-[#5B6470]">
                              <p className="font-medium text-[#1E2A3A]">Query</p>
                              <p className="mt-0.5">{slot.mainQuery || slot.searchQuery}</p>
                            </div>
                            {Array.isArray(slot.searchTerms) && slot.searchTerms.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1">
                                {slot.searchTerms.map((term) => (
                                  <span key={`${record.slug}-${slot.slot}-${term}`} className="rounded-full border border-[#DED7CA] bg-white px-2 py-0.5 text-[10px] text-[#5B6470]">{term}</span>
                                ))}
                              </div>
                            )}
                            <div className="mt-3 space-y-0.5 text-[11px] text-[#9B9791]">
                              <p>Cloudinary: {slot.targetCloudinaryId}</p>
                              {slotState.publicId && <p className="text-[#2E7D5A]">Active: {slotState.publicId}</p>}
                              {unsplashSlotState.id && <p className="text-[#7A5B2F]">Unsplash ID: {unsplashSlotState.id}</p>}
                            </div>
                            <div className="mt-3 grid gap-2 sm:grid-cols-2">
                              {record.kind === 'blog' && (
                                <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                                  Unsplash ID
                                  <input value={unsplashSlotState.id} onChange={(e) => updateUnsplashSelection(record.slug, slot.slot, 'id', e.target.value)} placeholder="Ex.: ChSZETOal-I" className="rounded-lg border border-[#D7D1C5] bg-white px-3 py-2 text-xs text-[#1E2A3A] outline-none focus:border-[#B89E73]" />
                                </label>
                              )}
                              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                                Alt
                                <input value={slotState.alt || ''} onChange={(e) => updateLocalSlotMetadata(record, slot.slot, 'alt', e.target.value)} placeholder="Descrição editorial" className="rounded-lg border border-[#D7D1C5] bg-white px-3 py-2 text-xs text-[#1E2A3A] outline-none focus:border-[#B89E73]" />
                              </label>
                              <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                                Legenda
                                <input value={slotState.caption || ''} onChange={(e) => updateLocalSlotMetadata(record, slot.slot, 'caption', e.target.value)} placeholder="Texto curto" className="rounded-lg border border-[#D7D1C5] bg-white px-3 py-2 text-xs text-[#1E2A3A] outline-none focus:border-[#B89E73]" />
                              </label>
                              {record.kind === 'blog' && isContextSlot(slot.slot) && (
                                <label className="flex flex-col gap-1 text-xs text-[#5B6470]">
                                  Bloco vinculado
                                  <select value={slotState.sectionId || ''} onChange={(e) => { const nextId = e.target.value; const nextOpt = sectionTargetOptions.find((o) => o.id === nextId); updateLocalSlotMetadata(record, slot.slot, 'sectionId', nextId); updateLocalSlotMetadata(record, slot.slot, 'sectionTitle', nextOpt?.title || ''); }} className="rounded-lg border border-[#D7D1C5] bg-white px-3 py-2 text-xs text-[#1E2A3A] outline-none focus:border-[#B89E73]">
                                    <option value="">Sem vínculo</option>
                                    {sectionTargetOptions.map((o) => <option key={`${record.slug}-${slot.slot}-${o.id}`} value={o.id}>{o.title}</option>)}
                                  </select>
                                </label>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <Button variant="outline" onClick={() => copyText(slot.mainQuery || slot.searchQuery, slotCopyKey)} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                                <Copy className="mr-1.5 h-3 w-3" />{copiedKey === slotCopyKey ? 'Copiada' : 'Query'}
                              </Button>
                              <Button variant="outline" asChild className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                                <a href={buildUnsplashSearchUrl(slot.mainQuery || slot.searchQuery)} target="_blank" rel="noreferrer"><Search className="mr-1.5 h-3 w-3" />Unsplash</a>
                              </Button>
                              <Button variant="outline" asChild className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                                <a href={buildGoogleImageSearchUrl(slot.mainQuery || slot.searchQuery)} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3 w-3" />Google</a>
                              </Button>
                              <Button onClick={() => openUploadWidget(record, slot)} disabled={!widgetReady || !uploadPreset} className="bg-[#1E2A3A] text-xs text-white hover:bg-[#24354C]">
                                {activeUploadKey === slotUploadKey ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <ImagePlus className="mr-1.5 h-3 w-3" />}Cloudinary
                              </Button>
                              {uploads?.[record.slug]?.[slot.slot] && (
                                <Button variant="outline" onClick={() => clearLocalUpload(record.slug, slot.slot)} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">Limpar upload</Button>
                              )}
                              {unsplashSelections?.[record.slug]?.[slot.slot] && (
                                <Button variant="outline" onClick={() => clearLocalUnsplashSelection(record.slug, slot.slot)} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">Limpar Unsplash</Button>
                              )}
                            </div>
                          </section>
                        );
                      })}
                    </div>
                  )}
                </article>
              );
            })}
          </section>

          {/* ── FILA DE BUSCA AUTOMÁTICA — collapsible ───────────────────── */}
          {editorialSearchQueue.length > 0 && (
            <details className="rounded-[24px] border border-[#D7D1C5] bg-white shadow-sm">
              <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-[#1E2A3A] hover:bg-[#FAFAF8] rounded-[24px]">
                <div>
                  <span className="font-semibold">Fila automática de busca</span>
                  <span className="ml-2 text-sm text-[#7C7C7C]">({editorialSearchQueue.length} itens)</span>
                </div>
                <ChevronDown className="h-4 w-4 text-[#7C7C7C]" />
              </summary>
              <div className="space-y-2 border-t border-[#EEE8DD] p-4">
                {editorialSearchQueue.map((record) => {
                  const pq = record.searchQueueEntry?.heroQuery || record.searchQueueEntry?.mainQuery || record.slots?.[0]?.mainQuery || record.title;
                  return (
                    <div key={`sq-${record.slug}`} className="flex flex-col gap-3 rounded-xl border border-[#E3DDCF] bg-[#FBF8F2] p-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[#1E2A3A]">{record.title}</p>
                        <p className="text-xs text-[#5B6470]">{pq}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                          <a href={record.searchQueueEntry?.search?.googleImages || buildGoogleImageSearchUrl(pq)} target="_blank" rel="noreferrer"><ExternalLink className="mr-1.5 h-3.5 w-3.5" />Google</a>
                        </Button>
                        <Button variant="outline" asChild className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                          <a href={record.searchQueueEntry?.search?.unsplash || buildUnsplashSearchUrl(pq)} target="_blank" rel="noreferrer"><Search className="mr-1.5 h-3.5 w-3.5" />Unsplash</a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}

          {/* ── PAINEL TÉCNICO — collapsible ─────────────────────────────── */}
          <details className="rounded-[24px] border border-[#D7D1C5] bg-white shadow-sm">
            <summary className="flex cursor-pointer list-none items-center justify-between p-5 text-[#1E2A3A] hover:bg-[#FAFAF8] rounded-[24px]">
              <div>
                <span className="font-semibold">Painel técnico</span>
                <span className="ml-2 text-sm text-[#7C7C7C]">Manifesto · Automação · Métricas</span>
              </div>
              <ChevronDown className="h-4 w-4 text-[#7C7C7C]" />
            </summary>
            <div className="space-y-5 border-t border-[#EEE8DD] p-5">
              {/* Manifests */}
              <div className="grid gap-4 lg:grid-cols-3">
                {[
                  { key: 'manifest-snippet', label: 'Blog manifest', snippet: manifestSnippet, dest: 'src/data/blogImageManifest.js' },
                  { key: 'style-manifest-snippet', label: 'Styles manifest', snippet: styleManifestSnippet, dest: 'src/data/styleImageManifest.js' },
                  { key: 'unsplash-selection-snippet', label: 'Unsplash JSON', snippet: unsplashManifestSnippet, dest: 'src/data/blogUnsplashSelection.json' },
                ].map(({ key, label, snippet, dest }) => (
                  <div key={key}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#1E2A3A]">{label}</p>
                      <Button variant="outline" onClick={() => copyText(snippet, key)} disabled={!snippet} className="border-[#D7D1C5] bg-white text-xs text-[#1E2A3A] hover:bg-[#F7F3EB]">
                        <Copy className="mr-1.5 h-3.5 w-3.5" />{copiedKey === key ? 'Copiado' : 'Copiar'}
                      </Button>
                    </div>
                    <textarea value={snippet || '// Sem dados.'} readOnly className="h-36 w-full rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] p-3 font-mono text-xs text-[#3B4350] outline-none" />
                    <p className="mt-1 text-[10px] text-[#9B9791]">→ {dest}</p>
                  </div>
                ))}
              </div>

              {/* Automation */}
              <div className="rounded-2xl border border-[#E3DDCF] bg-[#FBF8F2] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[#1E2A3A]">Automação editorial</p>
                    <p className="text-xs text-[#5B6470]">{automationStatus.loading ? 'Verificando...' : automationStatus.error || automationStatus.notes || 'Pronto.'}</p>
                    <code className="mt-0.5 block text-xs text-[#7A5B2F]">{automationStatus.command}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={runEditorialAutomation} disabled={automationStatus.loading || automationRunning || !automationStatus.enabled} className="bg-[#1E2A3A] text-sm text-white hover:bg-[#24354C]">
                      {automationRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}Rodar
                    </Button>
                    <Button variant="outline" onClick={() => copyText(automationStatus.command, 'editorial-auto-command')} className="border-[#D7D1C5] bg-white text-sm text-[#1E2A3A] hover:bg-[#F7F3EB]">
                      <Copy className="mr-2 h-4 w-4" />{copiedKey === 'editorial-auto-command' ? 'Copiado' : 'Copiar cmd'}
                    </Button>
                  </div>
                </div>
                {automationOutput && (
                  <textarea value={automationOutput} readOnly className="mt-3 h-32 w-full rounded-xl border border-[#D7D1C5] bg-white p-3 font-mono text-xs text-[#3B4350] outline-none" />
                )}
              </div>

              {/* Health metrics */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  { label: 'Blog na fila', value: searchSummary.blogNeedsSearch || 0 },
                  { label: 'Blog manifesto', value: `${editorialHealthBlog.publishedWithManifest || 0}/${editorialHealthBlog.totalPosts || 0}` },
                  { label: 'Estilos mapeados', value: `${editorialHealthStyles.publicReady || editorialHealthStyles.localWebp || 0}/${editorialHealthStyles.totalStyles || 0}` },
                  { label: 'Cloudinary 404', value: editorialHealthStyles.cloudinaryBroken || 0 },
                ].map(({ label, value }) => (
                  <div key={label} className="rounded-xl border border-[#D7D1C5] bg-[#FBF8F2] p-3">
                    <p className="text-[10px] uppercase tracking-[0.12em] text-[#7C7C7C]">{label}</p>
                    <p className="mt-1 text-xl font-semibold text-[#1E2A3A]">{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </details>

        </div>
      </div>
    </>
  );
};

export default AdminBlogEditorial;
