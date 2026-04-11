import SEO from '@/components/SEO';
import { Button } from '@/components/ui/button';
import editorialQueue from '@/data/blogEditorialQueue.generated.json';
import { getBlogImageAsset, getBlogManifestEntry, resolveBlogPublicId } from '@/data/blogImageManifest';
import blogUnsplashSelection from '@/data/blogUnsplashSelection.json';
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

const STORAGE_KEY = 'wg_blog_editorial_uploads_v1';
const UNSPLASH_STORAGE_KEY = 'wg_blog_editorial_unsplash_v1';
const EXTERNAL_IMAGES_STORAGE_KEY = 'wg_blog_editorial_external_images_v1';
const CLOUDINARY_WIDGET_SRC = 'https://upload-widget.cloudinary.com/latest/global/all.js';

const CATEGORY_LABELS = {
  arquitetura: 'Arquitetura',
  'arquitetura-internacional': 'Arquitetura Internacional',
  projetos: 'Projetos',
  design: 'Design',
  engenharia: 'Engenharia',
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
  const publicId = localPublicId || (!localSessionUrl ? getManifestSlotPublicId(record.slug, slot.slot) : '');
  const remoteAsset = !localUpload && !publicId && !localSessionUrl
    ? getBlogImageAsset({
        slug: record.slug,
        variant: slot.slot === 'hero' ? 'hero' : 'card',
        allowCategoryFallback: false,
      })
    : null;
  const previewUrl = publicId
    ? buildCloudinaryEditorialUrl(publicId, slot.slot === 'hero' ? 'hero' : 'card')
    : localSessionUrl || remoteAsset?.src || getLocalPublicPath(slot.targetLocalFile);

  return {
    publicId,
    localSessionUrl,
    previewUrl,
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

const getTwoSlotStatus = (record, uploads) => {
  const heroState = getEffectiveSlotState(record, record.slots[0], uploads);
  const cardState = getEffectiveSlotState(record, record.slots[1], uploads);
  const heroPublicId = heroState.publicId;
  const cardPublicId = cardState.publicId;
  const heroExternalSrc = heroState.localSessionUrl || '';
  const cardExternalSrc = cardState.localSessionUrl || '';

  return {
    heroPublicId,
    cardPublicId,
    heroExternalSrc,
    cardExternalSrc,
    ready: Boolean((heroPublicId || heroExternalSrc) && (cardPublicId || cardExternalSrc)),
    snippet: buildManifestEntrySnippet(record.slug, heroPublicId, cardPublicId),
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

  const cloudName = getCloudinaryEditorialCloudName();
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'wg_unsigned';
  const googleImageSearchApiKey = import.meta.env.VITE_GOOGLE_IMAGE_SEARCH_API_KEY || '';

  useEffect(() => {
    setUploads(readLocalUploads());
    setUnsplashSelections(readLocalUnsplashSelections());
    setExternalImages(readLocalExternalImages());
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

  const saveUpload = (record, slotName, info) => {
    const nextUploads = {
      ...uploads,
      [record.slug]: {
        ...(uploads[record.slug] || {}),
        [slotName]: {
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

    const nextUploads = {
      ...uploads,
      [record.slug]: {
        ...(uploads[record.slug] || {}),
        [slotName]: {
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
          cb({
            folder: `editorial/blog/${record.slug}`,
            publicId: slot.slot,
            tags: [
              'blog-editorial',
              `blog:${record.slug}`,
              `slot:${slot.slot}`,
              `category:${record.category}`,
            ],
            context: `article=${record.slug}|slot=${slot.slot}`,
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

  const queueWithStatus = editorialQueue.map((record) => {
    const coverage = getEditorialCoverageStatus(record, uploads, unsplashSelections);
    const categoryKey = normalizeCategoryKey(record.category);

    return {
      ...record,
      categoryKey,
      categoryLabel: getCategoryLabel(record.category),
      editorial: coverage.editorial,
      unsplash: coverage.unsplash,
      coverage,
    };
  });

  const summary = {
    total: queueWithStatus.length,
    ready: queueWithStatus.filter((record) => record.coverage.ready).length,
    pending: queueWithStatus.filter((record) => !record.coverage.ready).length,
    needsCopyNormalization: queueWithStatus.filter((record) => record.needsCopyNormalization).length,
  };

  const categoryOptions = Array.from(
    new Map(
      queueWithStatus.map((record) => [record.categoryKey, record.categoryLabel])
    ).entries()
  )
    .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

  const manifestSnippet = queueWithStatus
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

    const matchesStatus = (
      statusFilter === 'todos' ||
      (statusFilter === 'pendentes' && !record.coverage.ready) ||
      (statusFilter === 'prontos' && record.coverage.ready)
    );

    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <>
      <SEO
        pathname="/admin/blog-editorial"
        title="Admin Editorial Blog | WG Almeida"
        description="Fila editorial do blog com busca temática de imagens, hero/card e normalização de textos."
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
                  Curadoria editorial
                </span>
                <h1 className="text-3xl font-semibold tracking-[-0.03em] text-[#1E2A3A] md:text-4xl">
                  Busca automática por tema para hero e card do blog
                </h1>
                <p className="max-w-3xl text-sm leading-6 text-[#5B6470] md:text-[15px]">
                  A fila já gera duas buscas por postagem. Aqui a gente centraliza a seleção de imagem,
                  decide entre Cloudinary ou manifesto Unsplash hotlinked por slot e separa os textos que ainda
                  estão pesados no negrito.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 md:min-w-[320px]">
              <div className="rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#7C7C7C]">Posts</p>
                <p className="mt-2 text-3xl font-semibold text-[#1E2A3A]">{summary.total}</p>
              </div>
              <div className="rounded-2xl border border-[#D7D1C5] bg-[#F1F8F4] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#5E7F63]">Hero + Card</p>
                <p className="mt-2 text-3xl font-semibold text-[#244A35]">{summary.ready}</p>
              </div>
              <div className="rounded-2xl border border-[#D7D1C5] bg-[#FFF8EC] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#A36B12]">Pendentes</p>
                <p className="mt-2 text-3xl font-semibold text-[#7A5415]">{summary.pending}</p>
              </div>
              <div className="rounded-2xl border border-[#D7D1C5] bg-[#FFF2F2] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-[#A24A4A]">Negrito alto</p>
                <p className="mt-2 text-3xl font-semibold text-[#7B2D2D]">{summary.needsCopyNormalization}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <section className="rounded-[28px] border border-[#D7D1C5] bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-[#1E2A3A]">Bloco pronto do manifesto</h2>
                  <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                    Cada upload local já vira uma sugestão para colar em{' '}
                    <code className="rounded bg-[#F3ECE0] px-1.5 py-0.5 text-xs text-[#7A5B2F]">
                      src/data/blogImageManifest.js
                    </code>
                    . Para hotlink editorial, o fluxo paralelo gera{' '}
                    <code className="rounded bg-[#F3ECE0] px-1.5 py-0.5 text-xs text-[#7A5B2F]">
                      src/data/blogUnsplashManifest.generated.js
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
                value={manifestSnippet || '// O bloco aparece aqui assim que ao menos um slot estiver definido no manifesto.'}
                readOnly
                className="mt-5 h-56 w-full rounded-2xl border border-[#D7D1C5] bg-[#FBF8F2] p-4 font-mono text-xs leading-6 text-[#3B4350] outline-none"
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
                  <h2 className="text-xl font-semibold text-[#1E2A3A]">Fluxo da curadoria</h2>
                  <p className="text-sm leading-6 text-[#5B6470]">
                    O Upload Widget usa `unsplash` como source nativo e pode ativar `image_search`
                    quando houver `VITE_GOOGLE_IMAGE_SEARCH_API_KEY`. Em paralelo, a colecao curada do
                    Unsplash pode ser puxada por script e virar manifesto hotlinked. Cada slot gera uma
                    query principal e ate 5 termos curtos coerentes com a direcao visual WG Almeida.
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
                <p>1. Escolha a postagem na fila.</p>
                <p>2. Copie a query ou abra a busca do Unsplash/Google Imagens.</p>
                <p>3. Escolha entre “Subir no Cloudinary” ou mapear a foto da colecao no manifesto Unsplash.</p>
                <p>4. Copie o bloco do manifesto correspondente e a pagina do blog passa a usar as duas imagens.</p>
              </div>
            </section>
          </div>

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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="grid gap-3 md:grid-cols-3 lg:min-w-[720px]">
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

              <div className="space-y-2 text-sm leading-6 text-[#5B6470]">
                <p>{filteredQueue.length} posts na visualização atual</p>
                <p>{summary.pending} posts ainda pendentes de cobertura completa</p>
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
              const heroSlot = record.slots.find((slot) => slot.slot === 'hero') || record.slots[0];
              const cardSlot = record.slots.find((slot) => slot.slot === 'card') || record.slots[1] || record.slots[0];
              const heroSlotState = heroSlot ? getEffectiveSlotState(record, heroSlot, uploads) : null;
              const cardSlotState = cardSlot ? getEffectiveSlotState(record, cardSlot, uploads) : null;
              const recordExtraImages = externalImages?.[record.slug] || [];
              const recordInputValue = urlInputBySlug?.[record.slug] || '';
              const recordInputError = urlErrorBySlug?.[record.slug] || '';
              const hasHeroLocalOverride = Boolean(
                uploads?.[record.slug]?.hero || unsplashSelections?.[record.slug]?.hero
              );
              const hasCardLocalOverride = Boolean(
                uploads?.[record.slug]?.card || unsplashSelections?.[record.slug]?.card
              );
              const heroLocalSrc = typeof uploads?.[record.slug]?.hero?.src === 'string'
                ? uploads[record.slug].hero.src
                : '';
              const cardLocalSrc = typeof uploads?.[record.slug]?.card?.src === 'string'
                ? uploads[record.slug].card.src
                : '';

              return (
              <article
                key={record.slug}
                className={`rounded-[24px] border border-[#D7D1C5] bg-white shadow-sm ${compactMode ? 'p-4' : 'p-6'}`}
              >
                <div className="flex flex-col gap-4 border-b border-[#EEE8DD] pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.16em]">
                      <span className="rounded-full bg-[#E8E0D1] px-3 py-1 text-[#7A5B2F]">
                        {record.categoryLabel}
                      </span>
                      <span className="rounded-full bg-[#EEF4EF] px-3 py-1 text-[#2E7D5A]">
                        {record.coverage.ready ? `Hero + card prontos via ${record.coverage.label}` : 'Pendente'}
                      </span>
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
                        `{record.slug}` · {record.boldCount} negritos · {record.inlineImageCount} imagens inline
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      asChild
                      className="border-[#D7D1C5] bg-white text-[#1E2A3A] hover:bg-[#F7F3EB]"
                    >
                      <a href={withBasePath(`/blog/${record.slug}`)} target="_blank" rel="noreferrer">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Abrir artigo
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
                        Galeria rápida do post
                      </h3>
                      <p className="mt-1 text-sm leading-6 text-[#5B6470]">
                        Cole um link de imagem (internet, Google Images, Unsplash etc.) e clique em adicionar.
                        Depois use Hero/Card para aplicar no blog na sessão atual.
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
                    {heroSlotState?.previewUrl && (
                      <div className={`relative overflow-hidden rounded-xl border border-[#DED7CA] bg-white ${compactMode ? 'w-28' : 'w-32'}`}>
                        <img
                          src={heroSlotState.previewUrl}
                          alt={`${record.title} - principal`}
                          className={`${compactMode ? 'h-16' : 'h-20'} w-full object-cover`}
                          loading="lazy"
                        />
                        <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#5B6470]">
                          Principal
                        </p>
                        {hasHeroLocalOverride && (
                          <button
                            type="button"
                            onClick={() => {
                              clearLocalUpload(record.slug, 'hero');
                              clearLocalUnsplashSelection(record.slug, 'hero');
                            }}
                            className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-[#7B2D2D] transition hover:bg-white"
                            aria-label="Excluir override hero"
                            title="Excluir override hero"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}

                    {cardSlotState?.previewUrl && (
                      <div className={`relative overflow-hidden rounded-xl border border-[#DED7CA] bg-white ${compactMode ? 'w-28' : 'w-32'}`}>
                        <img
                          src={cardSlotState.previewUrl}
                          alt={`${record.title} - card`}
                          className={`${compactMode ? 'h-16' : 'h-20'} w-full object-cover`}
                          loading="lazy"
                        />
                        <p className="px-2 py-1 text-[11px] uppercase tracking-[0.14em] text-[#5B6470]">
                          Card
                        </p>
                        {hasCardLocalOverride && (
                          <button
                            type="button"
                            onClick={() => {
                              clearLocalUpload(record.slug, 'card');
                              clearLocalUnsplashSelection(record.slug, 'card');
                            }}
                            className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-[#7B2D2D] transition hover:bg-white"
                            aria-label="Excluir override card"
                            title="Excluir override card"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    )}

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
                        <div className="grid grid-cols-2 border-t border-[#EFE8DC] text-[10px] uppercase tracking-[0.12em]">
                          <button
                            type="button"
                            onClick={() => assignExternalImageToSlot(record, 'hero', image)}
                            className={`px-1 py-1.5 transition ${heroLocalSrc === image.src ? 'bg-[#EEF4EF] text-[#2E7D5A]' : 'bg-white text-[#5B6470] hover:bg-[#F7F3EB]'}`}
                            title="Aplicar como Hero"
                          >
                            Hero
                          </button>
                          <button
                            type="button"
                            onClick={() => assignExternalImageToSlot(record, 'card', image)}
                            className={`px-1 py-1.5 transition ${cardLocalSrc === image.src ? 'bg-[#EEF4EF] text-[#2E7D5A]' : 'bg-white text-[#5B6470] hover:bg-[#F7F3EB]'}`}
                            title="Aplicar como Card"
                          >
                            Card
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {record.editorial.snippet && (
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

                {record.unsplash.snippet && (
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

                <div className={`mt-6 grid ${compactMode ? 'gap-3' : 'gap-5'} xl:grid-cols-2`}>
                  {record.slots.map((slot) => {
                    const slotState = getEffectiveSlotState(record, slot, uploads);
                    const unsplashSlotState = getEffectiveUnsplashSlotState(record.slug, slot.slot, unsplashSelections);
                    const slotCopyKey = `query-${record.slug}-${slot.slot}`;
                    const slotUploadKey = `${record.slug}:${slot.slot}`;

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
                            <h3 className="mt-1 text-xl font-semibold text-[#1E2A3A]">
                              {slot.slot === 'hero' ? 'Imagem principal' : 'Imagem de card'}
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

                        {slotState.previewUrl && (
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

                        {Array.isArray(slot.searchTerms) && slot.searchTerms.length > 0 && (
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

                        <div className="mt-4 grid gap-3 md:grid-cols-2">
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
                          <label className="flex flex-col gap-2 text-sm text-[#5B6470]">
                            Alt da imagem
                            <input
                              value={unsplashSlotState.alt}
                              onChange={(event) =>
                                updateUnsplashSelection(record.slug, slot.slot, 'alt', event.target.value)
                              }
                              placeholder="Descrição editorial curta"
                              className="rounded-xl border border-[#D7D1C5] bg-white px-4 py-3 text-[#1E2A3A] outline-none transition focus:border-[#B89E73]"
                            />
                          </label>
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
