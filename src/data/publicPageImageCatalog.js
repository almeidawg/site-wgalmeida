import PUBLIC_PAGE_IMAGE_OVERRIDES from './publicPageImageOverrides.generated.js';
import { buildCloudinaryEditorialUrl } from '@/utils/cloudinaryEditorial';

export const PUBLIC_PAGE_IMAGE_CATALOG = {
  about: {
    title: 'Sobre',
    category: 'institucional',
    routePath: '/sobre',
    image: '/images/banners/SOBRE.webp',
    mainQuery: 'about architecture studio premium portrait office editorial',
    searchTerms: ['arquitetura institucional', 'escritorio arquitetura premium', 'studio founder portrait'],
  },
  aMarca: {
    title: 'A Marca',
    category: 'institucional',
    routePath: '/a-marca',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'brand architecture luxury identity editorial interior',
    searchTerms: ['marca arquitetura premium', 'brand editorial interior design', 'luxury architecture identity'],
  },
  architecture: {
    title: 'Arquitetura',
    category: 'servicos',
    routePath: '/arquitetura',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'luxury architecture residential interior editorial facade',
    searchTerms: ['arquitetura alto padrao', 'residential architecture luxury', 'interior architecture editorial'],
  },
  arquiteturaCorporativa: {
    title: 'Arquitetura Corporativa',
    category: 'servicos',
    routePath: '/arquitetura-corporativa',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'corporate architecture modern office premium editorial',
    searchTerms: ['corporate office architecture', 'premium office interiors', 'modern corporate workspace'],
  },
  arquiteturaInterioresVilaNovaConceicao: {
    title: 'Arquitetura Interiores Vila Nova Conceicao',
    category: 'landing',
    routePath: '/arquitetura-interiores-vila-nova-conceicao',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'luxury apartment interiors vila nova conceicao editorial',
    searchTerms: ['vila nova conceicao interiores', 'apartamento alto padrao interiores', 'luxury apartment living room'],
  },
  buildtech: {
    title: 'Build Tech',
    category: 'produto',
    routePath: '/buildtech',
    image: '/images/banners/PROCESSOS.webp',
    mainQuery: 'construction technology dashboard engineering editorial',
    searchTerms: ['construction tech platform', 'engineering management dashboard', 'buildtech construction software'],
  },
  carpentry: {
    title: 'Marcenaria',
    category: 'servicos',
    routePath: '/marcenaria',
    image: '/images/banners/MARCENARIA.webp',
    mainQuery: 'bespoke carpentry luxury woodwork cabinetry editorial',
    searchTerms: ['marcenaria sob medida premium', 'luxury cabinetry interior', 'woodwork custom joinery'],
  },
  construtoraBrooklin: {
    title: 'Construtora Brooklin',
    category: 'landing',
    routePath: '/construtora-brooklin',
    image: '/images/banners/ENGENHARIA.webp',
    mainQuery: 'construction company brooklin premium building site editorial',
    searchTerms: ['construtora brooklin alto padrao', 'building construction premium', 'obra residencial premium'],
  },
  contact: {
    title: 'Contato',
    category: 'institucional',
    routePath: '/contato',
    image: '/images/banners/FALECONOSCO.webp',
    mainQuery: 'contact architecture office reception premium editorial',
    searchTerms: ['contact interior office premium', 'architecture studio reception', 'consultation architecture office'],
  },
  easyLocker: {
    title: 'EasyLocker',
    category: 'produto',
    routePath: '/easylocker',
    image: '/images/banners/MARCENARIA.webp',
    mainQuery: 'locker cabinetry organization premium interior editorial',
    searchTerms: ['smart locker interior design', 'cabinet organization premium', 'custom storage luxury'],
  },
  easyRealState: {
    title: 'Easy Real State',
    category: 'produto',
    routePath: '/easy-real-state',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'real estate analysis premium property editorial',
    searchTerms: ['real estate valuation premium', 'property analysis dashboard', 'luxury property investment'],
  },
  engineering: {
    title: 'Engenharia',
    category: 'servicos',
    routePath: '/engenharia',
    image: '/images/banners/ENGENHARIA.webp',
    mainQuery: 'engineering construction premium technical site editorial',
    searchTerms: ['engenharia obra premium', 'technical construction management', 'construction engineering site'],
  },
  faq: {
    title: 'FAQ',
    category: 'institucional',
    routePath: '/faq',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'architecture consultation premium editorial desk',
    searchTerms: ['consultoria arquitetura premium', 'architecture office editorial', 'client meeting luxury interior'],
  },
  obraEasy: {
    title: 'ObraEasy',
    category: 'produto',
    routePath: '/obraeasy',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'construction simulator premium dashboard home renovation editorial',
    searchTerms: ['obra simulator premium', 'home renovation planning dashboard', 'construction budget platform'],
  },
  obraTurnKey: {
    title: 'Obra Turn Key',
    category: 'servicos',
    routePath: '/obra-turn-key',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'turn key construction luxury residence editorial',
    searchTerms: ['turn key architecture premium', 'luxury residence construction', 'complete renovation premium'],
  },
  process: {
    title: 'Processo',
    category: 'institucional',
    routePath: '/processo',
    image: '/images/banners/PROCESSOS.webp',
    mainQuery: 'construction process planning premium editorial',
    searchTerms: ['construction process premium', 'project planning architecture', 'workflow construction luxury'],
  },
  projects: {
    title: 'Projetos',
    category: 'portfolio',
    routePath: '/projetos',
    image: '/images/banners/PROJETOS.webp',
    mainQuery: 'luxury interior portfolio residential editorial',
    searchTerms: ['project portfolio architecture', 'luxury interior portfolio', 'residential design portfolio'],
  },
  reformaApartamentoItaim: {
    title: 'Reforma Apartamento Itaim',
    category: 'landing',
    routePath: '/reforma-apartamento-itaim',
    image: '/images/banners/PROJETOS.webp',
    mainQuery: 'luxury apartment renovation itaim editorial',
    searchTerms: ['reforma apartamento itaim', 'luxury apartment renovation', 'premium living room renovation'],
  },
  reformaApartamentoJardins: {
    title: 'Reforma Apartamento Jardins',
    category: 'landing',
    routePath: '/reforma-apartamento-jardins',
    image: '/images/banners/PROJETOS.webp',
    mainQuery: 'luxury apartment renovation jardins editorial',
    searchTerms: ['reforma apartamento jardins', 'premium apartment renovation', 'high end apartment interior'],
  },
  reformaApartamentoSP: {
    title: 'Reforma Apartamento SP',
    category: 'landing',
    routePath: '/reforma-apartamento-sp',
    image: '/images/banners/ARQ.webp',
    mainQuery: 'apartment renovation sao paulo premium editorial',
    searchTerms: ['reforma apartamento sao paulo', 'premium apartment renovation', 'luxury apartment interiors'],
  },
  revistaEstilos: {
    title: 'Revista Estilos',
    category: 'conteudo',
    routePath: '/revista-estilos',
    image: '/images/banners/MARCENARIA.webp',
    mainQuery: 'interior style guide magazine editorial premium',
    searchTerms: ['style guide interiors premium', 'editorial decor magazine', 'luxury style inspiration'],
  },
  store: {
    title: 'Store',
    category: 'produto',
    routePath: '/store',
    image: '/images/banners/MARCENARIA.webp',
    mainQuery: 'design store premium decor products editorial',
    searchTerms: ['premium decor store', 'interior design products luxury', 'curated design objects'],
  },
  testimonials: {
    title: 'Depoimentos',
    category: 'institucional',
    routePath: '/depoimentos',
    image: '/images/banners/DEPOIMENTOS.webp',
    mainQuery: 'client testimonial premium interior editorial',
    searchTerms: ['testimonial architecture client', 'premium client experience', 'residential project client'],
  },
  regionTemplate: {
    title: 'Páginas de Região',
    category: 'landing',
    routePath: '/jardins',
    image: '/images/hero-region.webp',
    mainQuery: 'sao paulo luxury neighborhood architecture editorial',
    searchTerms: ['bairro sao paulo alto padrao', 'luxury neighborhood residence', 'sao paulo premium interiors'],
  },
};

const normalizePageAsset = (asset) => {
  if (!asset) return null;
  if (typeof asset === 'string') {
    return { source: 'local', src: asset, alt: '', page: '', caption: '', publicId: '' };
  }
  if (typeof asset !== 'object') return null;
  const publicId = typeof asset.publicId === 'string' ? asset.publicId.trim() : '';
  return {
    source: asset.source || (publicId ? 'cloudinary' : 'local'),
    src: typeof asset.src === 'string' ? asset.src : '',
    alt: typeof asset.alt === 'string' ? asset.alt : '',
    page: typeof asset.page === 'string' ? asset.page : '',
    caption: typeof asset.caption === 'string' ? asset.caption : '',
    publicId,
  };
};

export const getPublicPageImageEntry = (pageKey) => PUBLIC_PAGE_IMAGE_CATALOG[pageKey] || null;

export const getPublicPageImageAsset = (pageKey) => {
  const entry = getPublicPageImageEntry(pageKey);
  const baseAsset = normalizePageAsset(entry?.image);
  const overrideAsset = normalizePageAsset(PUBLIC_PAGE_IMAGE_OVERRIDES?.pages?.[pageKey]?.hero);
  const resolved = overrideAsset || baseAsset;
  if (!resolved) return null;
  if (resolved.publicId) {
    return {
      ...resolved,
      source: 'cloudinary',
      src: buildCloudinaryEditorialUrl(resolved.publicId, 'hero'),
    };
  }
  return resolved;
};

export const getPublicPageImageSrc = (pageKey, fallback = '') =>
  getPublicPageImageAsset(pageKey)?.src || fallback;
