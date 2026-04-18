import { buildCloudinaryEditorialUrl } from '../utils/cloudinaryEditorial.js';

const STYLE_UPLOAD_STORAGE_KEY = 'wg_blog_editorial_uploads_v1';
const STYLE_UNSPLASH_STORAGE_KEY = 'wg_blog_editorial_unsplash_v1';

const readLocalStyleUploads = () => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(STYLE_UPLOAD_STORAGE_KEY) || '{}'); } catch { return {}; }
};

const readLocalStyleUnsplashSelections = () => {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(window.localStorage.getItem(STYLE_UNSPLASH_STORAGE_KEY) || '{}'); } catch { return {}; }
};

export const STYLE_IMAGE_MANIFEST = {
  'art-deco': 'editorial/estilos/art-deco',
  'art-nouveau': 'editorial/estilos/art-nouveau',
  boho: 'editorial/estilos/boho',
  classico: 'editorial/estilos/classico',
  coastal: 'editorial/estilos/coastal',
  contemporaneo: 'editorial/estilos/contemporaneo',
  cottage: 'editorial/estilos/cottage',
  ecletico: 'editorial/estilos/ecletico',
  escandinavo: 'editorial/estilos/escandinavo',
  farmhouse: 'editorial/estilos/farmhouse',
  glam: 'editorial/estilos/glam',
  hampton: 'editorial/estilos/hampton',
  'hollywood-regency': 'editorial/estilos/hollywood-regency',
  industrial: 'editorial/estilos/industrial',
  japandi: 'editorial/estilos/japandi',
  maximalista: 'editorial/estilos/maximalista',
  mediterraneo: 'editorial/estilos/mediterraneo',
  'mid-century': 'editorial/estilos/mid-century',
  minimalismo: 'editorial/estilos/minimalismo',
  moderno: 'editorial/estilos/moderno',
  neoclassico: 'editorial/estilos/neoclassico',
  provencal: 'editorial/estilos/provencal',
  rustico: 'editorial/estilos/rustico',
  'shabby-chic': 'editorial/estilos/shabby-chic',
  southwest: 'editorial/estilos/southwest',
  transitional: 'editorial/estilos/transitional',
  tropical: 'editorial/estilos/tropical',
  tulum: 'editorial/estilos/tulum',
  'urban-modern': 'editorial/estilos/urban-modern',
  vintage: 'editorial/estilos/vintage',
  'wabi-sabi': 'editorial/estilos/wabi-sabi',
};

export const getCloudinaryStyleImage = ({ slug, variant = 'card' } = {}) => {
  const entry = slug ? STYLE_IMAGE_MANIFEST[slug] : null;
  if (!entry) return buildCloudinaryEditorialUrl(null, variant);
  if (typeof entry === 'object' && entry.src) return entry.src;
  return buildCloudinaryEditorialUrl(entry, variant);
};

export const hasCloudinaryStyleImage = (slug) => Boolean(slug && STYLE_IMAGE_MANIFEST[slug]);

export const getStyleImageAsset = ({ slug, variant = 'hero' } = {}) => {
  if (!slug) return null;

  // 1. Local Cloudinary upload (session)
  const uploads = readLocalStyleUploads();
  const uploadEntry = uploads?.[slug]?.cover;
  if (uploadEntry?.publicId) {
    return { kind: 'cloudinary', src: buildCloudinaryEditorialUrl(uploadEntry.publicId, variant), publicId: uploadEntry.publicId };
  }
  const uploadSrc = uploadEntry?.src || uploadEntry?.secureUrl || '';
  if (uploadSrc) {
    return { kind: 'remote', src: uploadSrc, alt: uploadEntry?.alt || '' };
  }

  // 2. Local Unsplash selection (session)
  const unsplash = readLocalStyleUnsplashSelections();
  const slotData = unsplash?.slugs?.[slug]?.cover;
  if (slotData?.src || slotData?.id) {
    const src = slotData.src || `https://images.unsplash.com/photo-${slotData.id}?auto=format&fit=crop&w=1600&q=80`;
    return { kind: 'unsplash', src, alt: slotData.alt || '', page: slotData.page || '' };
  }

  // 3. Committed manifest
  const entry = STYLE_IMAGE_MANIFEST[slug];
  if (!entry) return null;
  if (typeof entry === 'string') {
    return { kind: 'cloudinary', src: buildCloudinaryEditorialUrl(entry, variant), publicId: entry };
  }
  if (typeof entry === 'object' && entry.src) {
    return { kind: 'remote', src: entry.src, alt: entry.alt || '' };
  }

  return null;
};

export const getStyleImageUrl = ({ slug, variant = 'hero' } = {}) =>
  getStyleImageAsset({ slug, variant })?.src || null;

export default STYLE_IMAGE_MANIFEST;
