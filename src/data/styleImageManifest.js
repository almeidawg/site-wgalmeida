import { buildCloudinaryEditorialUrl } from '../utils/cloudinaryEditorial.js';

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
  const publicId = slug ? STYLE_IMAGE_MANIFEST[slug] : null;
  return buildCloudinaryEditorialUrl(publicId, variant);
};

export const hasCloudinaryStyleImage = (slug) => Boolean(slug && STYLE_IMAGE_MANIFEST[slug]);

export default STYLE_IMAGE_MANIFEST;
