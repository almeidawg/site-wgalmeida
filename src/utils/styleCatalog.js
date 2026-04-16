import { parseFrontmatter } from '@/utils/frontmatter';
import { withBasePath } from '@/utils/assetPaths';

const estilosFiles = import.meta.glob('/src/content/estilos/*.md', { as: 'raw', eager: true });

const DISPLAY_NAME_MAP = {
  'art-deco': 'Art Deco',
  'art-nouveau': 'Art Nouveau',
  boho: 'Boho',
  classico: 'Classico',
  coastal: 'Coastal',
  contemporaneo: 'Contemporaneo',
  cottage: 'Cottage',
  ecletico: 'Ecletico',
  escandinavo: 'Escandinavo',
  farmhouse: 'Farmhouse',
  glam: 'Glam',
  hampton: 'Hampton',
  'hollywood-regency': 'Hollywood Regency',
  industrial: 'Industrial',
  japandi: 'Japandi',
  maximalista: 'Maximalista',
  mediterraneo: 'Mediterraneo',
  'mid-century': 'Mid Century',
  minimalismo: 'Minimalismo',
  moderno: 'Moderno',
  neoclassico: 'Neoclassico',
  provencal: 'Provencal',
  rustico: 'Rustico',
  'shabby-chic': 'Shabby Chic',
  southwest: 'Southwest',
  transitional: 'Transitional',
  tropical: 'Tropical',
  tulum: 'Tulum',
  'urban-modern': 'Urban Modern',
  vintage: 'Vintage',
  'wabi-sabi': 'Wabi Sabi',
};

const STYLE_BANNERS = [
  '/images/banners/foto-obra-1.jpg',
  '/images/banners/foto-obra-2.jpg',
  '/images/banners/foto-obra-3.jpg',
  '/images/banners/foto-obra-4.jpg',
  '/images/banners/foto-obra-5.jpg',
  '/images/banners/foto-obra-6.jpg',
  '/images/banners/foto-obra-7.jpg',
  '/images/banners/ARQ.webp',
  '/images/banners/ENGENHARIA.webp',
  '/images/banners/MARCENARIA.webp',
];

export const getStyleCoverPath = (slug) => {
  if (slug) return withBasePath(`/images/estilos/${slug}.webp`);

  let h = 0;
  const fallbackKey = String(slug || 'style');
  for (let i = 0; i < fallbackKey.length; i++) h = (h * 31 + fallbackKey.charCodeAt(i)) >>> 0;
  return withBasePath(STYLE_BANNERS[h % STYLE_BANNERS.length]);
};

export const getStyleDisplayName = (slug) => (
  DISPLAY_NAME_MAP[slug] ||
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
);

export const getStyleCategory = (slug) => {
  if (['classico', 'neoclassico', 'provencal', 'farmhouse', 'cottage', 'art-deco', 'art-nouveau', 'hollywood-regency'].includes(slug)) {
    return 'tradicional';
  }
  if (['boho', 'ecletico', 'maximalista', 'tropical', 'tulum', 'southwest', 'vintage'].includes(slug)) {
    return 'ecletico';
  }
  return 'contemporaneo';
};

export const styleCatalog = Object.entries(estilosFiles)
  .map(([filePath, raw]) => {
    const rawString = typeof raw === 'string' ? raw : (raw?.default || '');
    const { data, content } = parseFrontmatter(rawString);
    const slug = filePath.split('/').pop().replace('.md', '');

    return {
      slug,
      id: slug,
      title: data.title || getStyleDisplayName(slug),
      name: getStyleDisplayName(slug),
      excerpt: data.excerpt || '',
      description: data.excerpt || '',
      image: getStyleCoverPath(slug),
      quote: data.quote || '',
      author: data.author || '',
      featured: Boolean(data.featured),
      tags: Array.isArray(data.tags) ? data.tags : [],
      colors: Array.isArray(data.colors) ? data.colors : ['#F5F5F5', '#1A1A1A', '#D9D9D9'],
      category: getStyleCategory(slug),
      content,
    };
  })
  .sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return a.name.localeCompare(b.name);
  });

export default styleCatalog;
