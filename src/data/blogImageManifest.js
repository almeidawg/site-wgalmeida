import { BLOG_UNSPLASH_MANIFEST } from './blogUnsplashManifest.generated.js';
import BLOG_IMAGE_OVERRIDES from './blogImageOverrides.generated.js';
import BLOG_IMAGE_OVERRIDES_CANONICAL from './blogImageOverrides.canonical.js';
import { buildCloudinaryEditorialUrl } from '../utils/cloudinaryEditorial.js';
import { withBasePath } from '../utils/assetPaths.js';

const STORAGE_KEY = 'wg_blog_editorial_uploads_v1';
const UNSPLASH_STORAGE_KEY = 'wg_blog_editorial_unsplash_v1';

export const BLOG_IMAGE_MANIFEST = {
  slugs: {
    'arquitetura-amsterdam-holanda': {
      hero: 'editorial/blog/amsterdam/canal-amsterdam-nikolai-kolosov',
      seo: 'editorial/blog/amsterdam/canal-amsterdam-nikolai-kolosov',
      card: 'editorial/blog/amsterdam/gables-amsterdam-vik-molina',
      thumb: 'editorial/blog/amsterdam/gables-amsterdam-vik-molina',
      square: 'editorial/blog/amsterdam/gables-amsterdam-vik-molina',
      default: 'editorial/blog/amsterdam/canal-amsterdam-nikolai-kolosov',
    },
    'arquitetura-barcelona-espanha': {
      hero: 'editorial/blog/arquitetura-barcelona-espanha/hero',
      seo: 'editorial/blog/arquitetura-barcelona-espanha/hero',
      card: 'editorial/blog/arquitetura-barcelona-espanha/hero',
      thumb: 'editorial/blog/arquitetura-barcelona-espanha/hero',
      square: 'editorial/blog/arquitetura-barcelona-espanha/hero',
      default: 'editorial/blog/arquitetura-barcelona-espanha/hero',
    },
    'arquitetura-bruges-belgica': {
      hero: 'editorial/blog/arquitetura-bruges-belgica/hero',
      seo: 'editorial/blog/arquitetura-bruges-belgica/hero',
      card: 'editorial/blog/arquitetura-bruges-belgica/card',
      thumb: 'editorial/blog/arquitetura-bruges-belgica/card',
      square: 'editorial/blog/arquitetura-bruges-belgica/card',
      default: 'editorial/blog/arquitetura-bruges-belgica/hero',
    },
    'arquitetura-bruxelas-belgica': {
      hero: 'editorial/blog/arquitetura-bruxelas-belgica/hero',
      seo: 'editorial/blog/arquitetura-bruxelas-belgica/hero',
      card: 'editorial/blog/arquitetura-bruxelas-belgica/card',
      thumb: 'editorial/blog/arquitetura-bruxelas-belgica/card',
      square: 'editorial/blog/arquitetura-bruxelas-belgica/card',
      default: 'editorial/blog/arquitetura-bruxelas-belgica/hero',
    },
    'arquitetos-brasileiros-famosos-legado': {
      hero: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Oscar_Niemeyer_1968b.jpg',
        page: 'https://pt.wikipedia.org/wiki/Oscar_Niemeyer',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Oscar Niemeyer, arquiteto brasileiro reconhecido pelas curvas do concreto armado.',
      },
      seo: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Oscar_Niemeyer_1968b.jpg',
        page: 'https://pt.wikipedia.org/wiki/Oscar_Niemeyer',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Oscar Niemeyer, arquiteto brasileiro reconhecido pelas curvas do concreto armado.',
      },
      card: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/pt/4/45/Jo%C3%A3o_Batista_Vilanova_Artigas.png',
        page: 'https://pt.wikipedia.org/wiki/Vilanova_Artigas',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Vilanova Artigas, arquiteto brasileiro ligado à Escola Paulista e à FAU-USP.',
      },
      thumb: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/pt/4/45/Jo%C3%A3o_Batista_Vilanova_Artigas.png',
        page: 'https://pt.wikipedia.org/wiki/Vilanova_Artigas',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Vilanova Artigas, arquiteto brasileiro ligado à Escola Paulista e à FAU-USP.',
      },
      square: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/pt/4/45/Jo%C3%A3o_Batista_Vilanova_Artigas.png',
        page: 'https://pt.wikipedia.org/wiki/Vilanova_Artigas',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Vilanova Artigas, arquiteto brasileiro ligado à Escola Paulista e à FAU-USP.',
      },
      default: {
        source: 'remote',
        src: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Oscar_Niemeyer_1968b.jpg',
        page: 'https://pt.wikipedia.org/wiki/Oscar_Niemeyer',
        sourceLabel: 'Wikipedia',
        alt: 'Retrato de Oscar Niemeyer, arquiteto brasileiro reconhecido pelas curvas do concreto armado.',
      },
      context: [
        {
          source: 'remote',
          src: 'https://upload.wikimedia.org/wikipedia/commons/7/70/Oscar_Niemeyer_1968b.jpg',
          page: 'https://pt.wikipedia.org/wiki/Oscar_Niemeyer',
          sourceLabel: 'Wikipedia',
          alt: 'Retrato de Oscar Niemeyer, arquiteto brasileiro reconhecido pelas curvas do concreto armado.',
          caption: 'Imagem de apoio para o bloco de Oscar Niemeyer, conectando autoria, curvas e legado modernista brasileiro.',
          sectionTitle: 'Oscar Niemeyer (1907-2012)',
        },
        {
          source: 'remote',
          src: 'https://static2.abitare.it/wp-content/uploads/2021/05/Paulo-Mendes-da-Rocha-ph-Andrea-Altemhuler-c-p-773x1024.jpg?v=461646',
          page: 'https://www.abitare.it/en/news-en/2021/05/23/paulo-mendes-da-rocha-dead/',
          sourceLabel: 'Abitare',
          alt: 'Retrato de Paulo Mendes da Rocha, arquiteto brasileiro associado ao brutalismo e ao rigor estrutural.',
          caption: 'Imagem de apoio para o bloco de Paulo Mendes da Rocha, reforçando materialidade, estrutura e presença autoral.',
          sectionTitle: 'Paulo Mendes da Rocha (1928-2021)',
        },
        {
          source: 'remote',
          src: 'https://www.casatigallery.com/wp-content/uploads/2019/10/Lina-Bo-Bardi-on-the-ship-Almirante-Jaceguay-on-her-way-to-Brasil-in-1946.jpg',
          page: 'https://www.casatigallery.com/design-designer-lina-bo-bardi/',
          sourceLabel: 'Casati Gallery',
          alt: 'Retrato de Lina Bo Bardi em sua viagem ao Brasil, reforçando a presença autoral da arquiteta ítalo-brasileira.',
          caption: 'Imagem de apoio para o bloco de Lina Bo Bardi, conectando biografia, deslocamento cultural e leitura humanista da arquiteta.',
          sectionTitle: 'Lina Bo Bardi (1914-1992)',
        },
        {
          source: 'remote',
          src: 'https://upload.wikimedia.org/wikipedia/pt/4/45/Jo%C3%A3o_Batista_Vilanova_Artigas.png',
          page: 'https://pt.wikipedia.org/wiki/Vilanova_Artigas',
          sourceLabel: 'Wikipedia',
          alt: 'Retrato de Vilanova Artigas, arquiteto brasileiro ligado à Escola Paulista e à FAU-USP.',
          caption: 'Imagem de apoio para o bloco de Vilanova Artigas, sustentando a leitura de ensino, espaço democrático e concreto aparente.',
          sectionTitle: 'Vilanova Artigas (1915-1985)',
        },
        {
          source: 'remote',
          src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/29/L%C3%BAcio_Costa%2C_1970.tif/lossy-page1-250px-L%C3%BAcio_Costa%2C_1970.tif.jpg',
          page: 'https://pt.wikipedia.org/wiki/L%C3%BAcio_Costa',
          sourceLabel: 'Wikipedia',
          alt: 'Retrato de Lucio Costa, urbanista brasileiro responsável pelo Plano Piloto de Brasília.',
          caption: 'Imagem de apoio para o bloco de Lucio Costa, conectando urbanismo, síntese moderna e visão territorial.',
          sectionTitle: 'Lucio Costa (1902-1998)',
        },
        {
          source: 'remote',
          src: 'https://upload.wikimedia.org/wikipedia/commons/7/76/Arquiteto_Ruy_Ohtake_%28cropped%29.jpg',
          page: 'https://pt.wikipedia.org/wiki/Ruy_Ohtake',
          sourceLabel: 'Wikipedia',
          alt: 'Retrato de Ruy Ohtake, arquiteto brasileiro conhecido por cores vibrantes e formas orgânicas.',
          caption: 'Imagem de apoio para o bloco de Ruy Ohtake, reforçando gesto plástico, cor e presença urbana.',
          sectionTitle: 'Ruy Ohtake (1938-2021)',
        },
        {
          source: 'remote',
          src: 'https://arquitetura.vivadecora.com.br/wp-content/uploads/2018/11/Affonso-Eduardo-Reidy.jpeg',
          page: 'https://arquitetura.vivadecora.com.br/arquitetos-brasileiros/',
          sourceLabel: 'Viva Decora',
          alt: 'Retrato de Affonso Eduardo Reidy, arquiteto modernista brasileiro ligado ao MAM-RJ e ao Pedregulho.',
          caption: 'Imagem de apoio para o bloco de Affonso Eduardo Reidy, associando habitação moderna, paisagem e cultura pública.',
          sectionTitle: 'Affonso Eduardo Reidy (1909-1964)',
        },
      ],
    },
    'scandia-home-roupa-cama-luxo': {
      hero: {
        source: 'remote',
        src: 'https://www.scandiahome.com/cdn/shop/files/042325_Lucea_Fawn_Lorenza_03_final_V2_1.jpg?v=1754075397&width=3648',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Quarto com roupa de cama Scandia Home em composição refinada e atmosfera editorial clara.',
      },
      seo: {
        source: 'remote',
        src: 'https://www.scandiahome.com/cdn/shop/files/042325_Lucea_Fawn_Lorenza_03_final_V2_1.jpg?v=1754075397&width=3648',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Quarto com roupa de cama Scandia Home em composição refinada e atmosfera editorial clara.',
      },
      card: {
        source: 'remote',
        src: 'https://d3k81ch9hvuctc.cloudfront.net/company/S5gRix/images/71633f7f-b7a0-4bab-9c6a-480a5a3d1870.png',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Detalhe editorial de cama posta da Scandia Home com leitura premium de roupa de cama.',
      },
      thumb: {
        source: 'remote',
        src: 'https://d3k81ch9hvuctc.cloudfront.net/company/S5gRix/images/71633f7f-b7a0-4bab-9c6a-480a5a3d1870.png',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Detalhe editorial de cama posta da Scandia Home com leitura premium de roupa de cama.',
      },
      square: {
        source: 'remote',
        src: 'https://d3k81ch9hvuctc.cloudfront.net/company/S5gRix/images/71633f7f-b7a0-4bab-9c6a-480a5a3d1870.png',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Detalhe editorial de cama posta da Scandia Home com leitura premium de roupa de cama.',
      },
      default: {
        source: 'remote',
        src: 'https://www.scandiahome.com/cdn/shop/files/042325_Lucea_Fawn_Lorenza_03_final_V2_1.jpg?v=1754075397&width=3648',
        page: 'https://www.scandiahome.com/',
        sourceLabel: 'Scandia Home',
        alt: 'Quarto com roupa de cama Scandia Home em composição refinada e atmosfera editorial clara.',
      },
    },
    'arquitetura-alto-padrao': 'editorial/blog/arquitetura-alto-padrao',
    'bancada-cozinha-ergonomia': 'editorial/blog/bancada-cozinha-ergonomia',
    'briefing-projeto-dos-sonhos': 'editorial/blog/briefing-projeto-dos-sonhos',
    'cronograma-obra-acompanhamento': 'editorial/blog/cronograma-obra-acompanhamento',
    'documentacao-obra-condominio': 'editorial/blog/documentacao-obra-condominio',
    'especificacoes-tecnicas-diferenca': 'editorial/blog/especificacoes-tecnicas-diferenca',
    'etapas-prazos-projeto-arquitetonico': 'editorial/blog/etapas-prazos-projeto-arquitetonico',
    'etapas-reforma-completa': 'editorial/blog/etapas-reforma-completa',
    'guia-estilos-ambientes-residenciais': {
      hero: 'editorial/blog/guia-estilos-ambientes-residenciais',
      seo: 'editorial/blog/guia-estilos-ambientes-residenciais',
      card: 'editorial/blog/guia-estilos-ambientes-residenciais',
      thumb: 'editorial/blog/guia-estilos-ambientes-residenciais',
      square: 'editorial/blog/guia-estilos-ambientes-residenciais',
      default: 'editorial/blog/guia-estilos-ambientes-residenciais',
      context: [
        {
          source: 'local',
          src: '/images/estilos/minimalismo.webp',
          alt: 'Ambiente residencial minimalista com linhas limpas e atmosfera serena',
          caption: 'Referencia visual para o trecho sobre minimalismo, reforcando calma visual, proporcao e uso contido de elementos.',
        },
        {
          source: 'local',
          src: '/images/estilos/classico.webp',
          alt: 'Sala classica com materiais nobres e composicao simetrica',
          caption: 'Imagem de apoio para a leitura do estilo classico, com enfase em elegancia duradoura, simetria e acabamento refinado.',
        },
        {
          source: 'local',
          src: '/images/estilos/moderno.webp',
          alt: 'Espaco moderno com volumes marcantes e linguagem contemporanea',
          caption: 'Contexto visual para o bloco do estilo moderno, conectando impacto formal, tecnologia integrada e praticidade.',
        },
        {
          source: 'local',
          src: '/images/estilos/industrial.webp',
          alt: 'Interior industrial com metal, concreto e madeira aparente',
          caption: 'Recorte que sustenta a leitura industrial do artigo, destacando estrutura aparente, materialidade bruta e autenticidade urbana.',
        },
        {
          source: 'local',
          src: '/images/estilos/vintage.webp',
          alt: 'Ambiente vintage com mobiliario afetivo e detalhes de epoca',
          caption: 'Imagem complementar para a secao vintage, reforcando memoria, mistura de referencias e identidade afetiva.',
        },
        {
          source: 'local',
          src: '/images/estilos/tropical.webp',
          alt: 'Ambiente tropical com luz natural, materiais leves e conexao com o exterior',
          caption: 'Apoio visual para o estilo tropical, ajudando a traduzir luminosidade, textura natural e sensacao de bem-estar.',
        },
      ],
    },
    'guia-estilos-decoracao': {
      hero: 'editorial/blog/guia-estilos-decoracao',
      seo: 'editorial/blog/guia-estilos-decoracao',
      card: 'editorial/blog/guia-estilos-decoracao',
      thumb: 'editorial/blog/guia-estilos-decoracao',
      square: 'editorial/blog/guia-estilos-decoracao',
      default: 'editorial/blog/guia-estilos-decoracao',
      context: [
        {
          source: 'local',
          src: '/images/estilos/contemporaneo.webp',
          alt: 'Ambiente contemporaneo com composicao equilibrada e materiais atuais',
          caption: 'Referencia visual para o estilo contemporaneo, reforcando equilibrio, atualizacao estetica e leitura sofisticada do espaco.',
        },
        {
          source: 'local',
          src: '/images/estilos/minimalismo.webp',
          alt: 'Interior minimalista com poucos elementos e alto silencio visual',
          caption: 'Imagem de apoio para o trecho sobre minimalismo, ajudando a comunicar essencialidade, ordem e foco na qualidade.',
        },
        {
          source: 'local',
          src: '/images/estilos/provencal.webp',
          alt: 'Ambiente provencal com tons suaves, textura e atmosfera acolhedora',
          caption: 'Recorte que sustenta a narrativa do estilo provencal, destacando delicadeza, acolhimento e repertorio romantico.',
        },
        {
          source: 'local',
          src: '/images/estilos/industrial.webp',
          alt: 'Loft industrial com concreto, metal e linguagem urbana',
          caption: 'Imagem complementar para a secao industrial, reforcando tecnica aparente, contraste de materiais e carater urbano.',
        },
        {
          source: 'local',
          src: '/images/estilos/classico.webp',
          alt: 'Ambiente classico com molduras, simetria e sofisticacao tradicional',
          caption: 'Apoio visual para o bloco do estilo classico, conectando tradicao, composicao simetrica e luxo discreto.',
        },
      ],
    },
    'iluminacao-tecnica-rasgo-de-luz': 'editorial/blog/iluminacao-tecnica-rasgo-de-luz',
    'informe-obra-condominio': 'editorial/blog/informe-obra-condominio',
    'marcenaria-sob-medida': 'editorial/blog/marcenaria-sob-medida',
    'marcas-luxo-internacionais-moveis-design': {
      context: [
        {
          source: 'unsplash',
          src: 'https://images.unsplash.com/photo-1639322132757-14ee19fb04f5',
          alt: 'Sala com sofá, luminária e styling refinado de design italiano',
          page: 'https://unsplash.com/photos/1P1f8zPF4PM',
          sectionTitle: 'Itália: O Berço do Design de Luxo',
          caption: 'Composição de ambientação italiana com sofá, iluminação e curadoria de styling de alto padrão.',
        },
        {
          source: 'unsplash',
          src: 'https://images.unsplash.com/photo-1620086464194-5127366b51ea',
          alt: 'Bancada de cozinha refinada com acabamento em madeira e pedra natural',
          page: 'https://unsplash.com/photos/lR7Zi4bEw1o',
          sectionTitle: 'Cozinhas de Luxo',
          caption: 'Detalhe de cozinha premium com bancada integrada, materiais naturais e linguagem europeia de projeto.',
        },
        {
          source: 'unsplash',
          src: 'https://images.unsplash.com/photo-1758315417321-83eb30a39710',
          alt: 'Ilha central de cozinha com tampo em mármore e banquetas de alto padrão',
          page: 'https://unsplash.com/photos/wScUenIFG-Q',
          sectionTitle: 'Como Escolher Marcas Internacionais',
          caption: 'Ilha de cozinha com pedra natural e banquetas que orienta a seleção de marcas por qualidade material e coerência de projeto.',
        },
        {
          source: 'unsplash',
          src: 'https://images.unsplash.com/photo-1742569106081-971ff0c0cf96',
          alt: 'Poltrona em ambientação neutra com detalhe de escadaria residencial',
          page: 'https://unsplash.com/photos/Iju9y8bTNbE',
          sectionTitle: 'Especificação WG Almeida',
          caption: 'Peça de design especificada em ambientação residencial, ilustrando o resultado de uma curadoria técnica de marcas internacionais integrada ao projeto.',
        },
      ],
    },
    'memorial-executivo-obra': 'editorial/blog/memorial-executivo-obra',
    'moodboard-mapa-visual': 'editorial/blog/moodboard-mapa-visual',
    'normas-tecnicas-representacao': 'editorial/blog/normas-tecnicas-representacao',
    'o-que-e-turn-key': 'editorial/blog/o-que-e-turn-key',
    'projeto-executivo-o-que-e': 'editorial/blog/projeto-executivo',
    'ralo-linear-areas-molhadas': 'editorial/blog/ralo-linear-areas-molhadas',
    'termo-responsabilidade-nbr16280': 'editorial/blog/termo-responsabilidade-nbr16280',
  },
  categories: {
    arquitetura: { source: 'local', src: '/images/banners/ARQ.webp' },
    design: { source: 'local', src: '/images/banners/ARQ.webp' },
    engenharia: { source: 'local', src: '/images/banners/ENGENHARIA.webp' },
    marcenaria: { source: 'local', src: '/images/banners/MARCENARIA.webp' },
    tecnologia: { source: 'local', src: '/images/banners/PROCESSOS.webp' },
    tendencias: { source: 'local', src: '/images/banners/SOBRE.webp' },
    dicas: { source: 'local', src: '/images/banners/FALECONOSCO.webp' },
  },
};

const REMOTE_VARIANT_SIZES = {
  hero: { width: 1600, height: 900 },
  card: { width: 960, height: 640 },
  thumb: { width: 720, height: 480 },
  seo: { width: 1200, height: 630 },
  square: { width: 720, height: 720 },
  context: { width: 1280, height: 720 },
};

const readLocalStorageJson = (key) => {
  if (typeof window === 'undefined') return null;
  try {
    return JSON.parse(window.localStorage.getItem(key) || '{}');
  } catch {
    return null;
  }
};

const shouldUseEditorialSessionOverrides = () => {
  if (typeof window === 'undefined') return false;

  const pathname = window.location?.pathname || '';
  return pathname.startsWith('/admin/blog-editorial');
};

const normalizeUnsplashSelectionValue = (value) => {
  if (!value) return { id: '', alt: '' };
  if (typeof value === 'string') return { id: value.trim(), alt: '', src: '', page: '' };
  if (typeof value === 'object') {
    return {
      id: typeof value.id === 'string' ? value.id.trim() : '',
      alt: typeof value.alt === 'string' ? value.alt : '',
      src: typeof value.src === 'string'
        ? value.src.trim()
        : typeof value.downloadUrl === 'string'
          ? value.downloadUrl.trim()
          : '',
      page: typeof value.page === 'string'
        ? value.page
        : typeof value.photoPage === 'string'
          ? value.photoPage
          : '',
    };
  }
  return { id: '', alt: '', src: '', page: '' };
};

const buildUnsplashPhotoPageUrl = (photoId) =>
  photoId ? `https://unsplash.com/photos/${encodeURIComponent(photoId)}` : '';

const buildUnsplashDownloadUrl = (photoId, variant = 'card') => {
  if (!photoId) return '';
  const size = REMOTE_VARIANT_SIZES[variant] || REMOTE_VARIANT_SIZES.card;
  return `https://unsplash.com/photos/${encodeURIComponent(photoId)}/download?force=true&w=${size.width}&h=${size.height}&fit=crop`;
};

const assignSlotEntryValue = (entry, slotName, value) => {
  if (!value) return;
  if (slotName === 'hero') {
    entry.hero = value;
    entry.seo = value;
  }
  if (slotName === 'card') {
    entry.card = value;
    entry.thumb = value;
    entry.square = value;
  }
  if (!entry.default) {
    entry.default = value;
  }
};

const assignContextEntryValue = (entry, slotIndex, value) => {
  if (!value || slotIndex < 0) return;
  if (!Array.isArray(entry.context)) {
    entry.context = [];
  }
  entry.context[slotIndex] = value;
};

const getUnsplashUtmSource = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_UNSPLASH_UTM_SOURCE) {
    return import.meta.env.VITE_UNSPLASH_UTM_SOURCE;
  }

  return 'wg-almeida-blog';
};

const buildCloudinaryBlogImageUrl = (publicId, variant = 'card') => {
  return buildCloudinaryEditorialUrl(publicId, variant);
};

const isRemoteAsset = (value) =>
  Boolean(value && typeof value === 'object' && typeof value.src === 'string');

const isUnsplashImageUrl = (value) => {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === 'images.unsplash.com' || host === 'plus.unsplash.com';
  } catch {
    return false;
  }
};

const appendUnsplashAttributionParams = (value) => {
  if (!value) return '';

  try {
    const url = new URL(value);
    url.searchParams.set('utm_source', getUnsplashUtmSource());
    url.searchParams.set('utm_medium', 'referral');
    return url.toString();
  } catch {
    return value;
  }
};

const buildRemoteAssetUrl = (src, variant = 'card') => {
  if (!src || !isUnsplashImageUrl(src)) return src;

  try {
    const size = REMOTE_VARIANT_SIZES[variant] || REMOTE_VARIANT_SIZES.card;
    const url = new URL(src);
    url.searchParams.set('auto', 'format');
    url.searchParams.set('q', '80');
    url.searchParams.set('fit', 'crop');
    url.searchParams.set('crop', 'entropy');
    url.searchParams.set('w', String(size.width));
    url.searchParams.set('h', String(size.height));
    return url.toString();
  } catch {
    return src;
  }
};

const buildRemoteAsset = (value, variant = 'card') => {
  if (!isRemoteAsset(value)) return null;

  const rawSource = (value.source || (isUnsplashImageUrl(value.src) ? 'unsplash' : 'remote')).toLowerCase();
  const source = rawSource === 'unsplash-image' ? 'unsplash' : rawSource;
  const src = source === 'unsplash'
    ? buildRemoteAssetUrl(value.src, variant)
    : source === 'local'
      ? withBasePath(value.src)
      : value.src;
  const photographerUrl = source === 'unsplash'
    ? appendUnsplashAttributionParams(value.profile || '')
    : value.profile || '';
  const photoPageUrl = source === 'unsplash'
    ? appendUnsplashAttributionParams(value.page || value.photoPage || '')
    : value.page || value.photoPage || '';

  return {
    kind: 'remote',
    source,
    src,
    alt: value.alt || value.description || '',
    caption: value.caption || '',
    sectionTitle: value.sectionTitle || '',
    sectionId: value.sectionId || '',
    photographer: value.photographer || '',
    photographerUrl,
    photoPageUrl,
    downloadLocation: value.downloadLocation || '',
    sourceLabel: source === 'unsplash' ? 'Unsplash' : value.sourceLabel || 'Fonte externa',
  };
};

const mergeManifestEntries = (primaryEntry, secondaryEntry) => {
  if (!primaryEntry) return secondaryEntry || null;
  if (!secondaryEntry) return primaryEntry || null;

  if (typeof primaryEntry !== 'object' || isRemoteAsset(primaryEntry)) return primaryEntry;
  if (typeof secondaryEntry !== 'object' || isRemoteAsset(secondaryEntry)) return primaryEntry;

  return {
    ...secondaryEntry,
    ...primaryEntry,
    __fallback: secondaryEntry,
  };
};

const GENERIC_LOCAL_PREFIXES = [
  '/images/banners/',
  '/og-',
];

const isGenericLocalAssetValue = (value) => Boolean(
  value
  && typeof value === 'object'
  && value.source === 'local'
  && typeof value.src === 'string'
  && GENERIC_LOCAL_PREFIXES.some((prefix) => value.src.startsWith(prefix))
);

const sanitizeGenericOverrideEntry = (overrideEntry, curatedEntry) => {
  if (!overrideEntry || typeof overrideEntry !== 'object' || !curatedEntry || typeof curatedEntry !== 'object') {
    return overrideEntry;
  }

  const normalized = { ...overrideEntry };
  let changed = false;

  ['hero', 'seo', 'card', 'thumb', 'square', 'default'].forEach((slotName) => {
    if (isGenericLocalAssetValue(normalized[slotName]) && resolveBlogManifestValue(curatedEntry, slotName)) {
      delete normalized[slotName];
      changed = true;
    }
  });

  if (!changed) return overrideEntry;
  return normalized;
};

const buildLocalUploadManifestEntry = (slug) => {
  if (!shouldUseEditorialSessionOverrides()) return null;

  const localUploads = readLocalStorageJson(STORAGE_KEY);
  const slotMap = localUploads?.[slug];
  if (!slotMap || typeof slotMap !== 'object') return null;

  const entry = {};

  for (const slotName of ['hero', 'card', 'context1', 'context2', 'context3', 'context4']) {
    const slotValue = slotMap?.[slotName];
    if (!slotValue || typeof slotValue !== 'object') continue;

    const publicId = typeof slotValue.publicId === 'string' ? slotValue.publicId.trim() : '';
    if (publicId && !/^context\d+$/.test(slotName)) {
      assignSlotEntryValue(entry, slotName, publicId);
      continue;
    }

    const src = typeof slotValue.src === 'string'
      ? slotValue.src.trim()
      : typeof slotValue.secureUrl === 'string'
        ? slotValue.secureUrl.trim()
        : '';
    if (!src) continue;

    const sourceRaw = String(slotValue.source || (isUnsplashImageUrl(src) ? 'unsplash' : 'remote')).toLowerCase();
    const source = sourceRaw === 'unsplash-image' ? 'unsplash' : sourceRaw;
    const unsplashPhotoId = typeof slotValue.unsplashPhotoId === 'string' ? slotValue.unsplashPhotoId.trim() : '';
    const fallbackPageUrl = source === 'unsplash' && unsplashPhotoId
      ? buildUnsplashPhotoPageUrl(unsplashPhotoId)
      : '';
    const pageUrl = typeof slotValue.pageUrl === 'string' ? slotValue.pageUrl : fallbackPageUrl;
    const alt = typeof slotValue.alt === 'string' ? slotValue.alt : '';

    const remoteValue = {
      source,
      src,
      alt,
      page: pageUrl,
      caption: typeof slotValue.caption === 'string' ? slotValue.caption : '',
      sectionTitle: typeof slotValue.sectionTitle === 'string' ? slotValue.sectionTitle : '',
      sectionId: typeof slotValue.sectionId === 'string' ? slotValue.sectionId : '',
      sourceLabel: source === 'unsplash' ? 'Unsplash (sessão local)' : 'URL local (sessão)',
    };

    if (/^context\d+$/.test(slotName)) {
      const slotIndex = Number(slotName.replace('context', '')) - 1;
      assignContextEntryValue(entry, slotIndex, remoteValue);
    } else {
      assignSlotEntryValue(entry, slotName, remoteValue);
    }
  }

  return Object.keys(entry).length ? entry : null;
};

const buildLocalUnsplashSelectionEntry = (slug) => {
  if (!shouldUseEditorialSessionOverrides()) return null;

  const localSelections = readLocalStorageJson(UNSPLASH_STORAGE_KEY);
  const slotMap = localSelections?.[slug];
  if (!slotMap || typeof slotMap !== 'object') return null;

  const entry = {};

  const hero = normalizeUnsplashSelectionValue(slotMap.hero);
  const card = normalizeUnsplashSelectionValue(slotMap.card);
  if (hero.id) {
    const heroValue = {
      source: 'unsplash',
      src: hero.src || buildUnsplashDownloadUrl(hero.id, 'hero'),
      alt: hero.alt || '',
      page: hero.page || buildUnsplashPhotoPageUrl(hero.id),
      sourceLabel: 'Unsplash (sessão local)',
    };
    assignSlotEntryValue(entry, 'hero', heroValue);
  }

  if (card.id) {
    const cardValue = {
      source: 'unsplash',
      src: card.src || buildUnsplashDownloadUrl(card.id, 'card'),
      alt: card.alt || '',
      page: card.page || buildUnsplashPhotoPageUrl(card.id),
      sourceLabel: 'Unsplash (sessão local)',
    };
    assignSlotEntryValue(entry, 'card', cardValue);
  }

  ['context1', 'context2', 'context3', 'context4'].forEach((slotName, slotIndex) => {
    const slotSelection = normalizeUnsplashSelectionValue(slotMap[slotName]);
    if (!slotSelection.id) return;

    assignContextEntryValue(entry, slotIndex, {
      source: 'unsplash',
      src: slotSelection.src || buildUnsplashDownloadUrl(slotSelection.id, 'context'),
      alt: slotSelection.alt || '',
      page: slotSelection.page || buildUnsplashPhotoPageUrl(slotSelection.id),
      sourceLabel: 'Unsplash (sessão local)',
    });
  });

  return Object.keys(entry).length ? entry : null;
};

const resolveBlogManifestValue = (entry, variant = 'card') => {
  if (!entry) return null;
  if (typeof entry === 'string' || isRemoteAsset(entry)) return entry;

  return (
    entry[variant] ||
    entry.default ||
    entry.hero ||
    entry.card ||
    null
  );
};

export const resolveBlogPublicId = (entry, variant = 'card') => {
  const value = resolveBlogManifestValue(entry, variant);
  return typeof value === 'string' ? value : null;
};

export const resolveBlogAsset = (entry, variant = 'card') => {
  const value = resolveBlogManifestValue(entry, variant);
  if (!value) return null;

  if (typeof value === 'string') {
    const fallbackValue = entry && typeof entry === 'object'
      ? resolveBlogManifestValue(entry.__fallback, variant)
      : null;
    const fallbackAsset = buildRemoteAsset(fallbackValue, variant);

    return {
      kind: 'cloudinary',
      source: 'cloudinary',
      publicId: value,
      src: buildCloudinaryBlogImageUrl(value, variant),
      alt: fallbackAsset?.alt || '',
      caption: fallbackAsset?.caption || '',
      photographer: fallbackAsset?.photographer || '',
      photographerUrl: fallbackAsset?.photographerUrl || '',
      photoPageUrl: fallbackAsset?.photoPageUrl || '',
      downloadLocation: fallbackAsset?.downloadLocation || '',
      sourceLabel: fallbackAsset?.sourceLabel || '',
    };
  }

  return buildRemoteAsset(value, variant);
};

export const getBlogManifestEntry = (slug) => {
  if (!slug) return null;

  const remoteEntry = BLOG_UNSPLASH_MANIFEST.slugs[slug] || null;
  const cloudinaryEntry = BLOG_IMAGE_MANIFEST.slugs[slug] || null;
  const curatedEntry = mergeManifestEntries(cloudinaryEntry, remoteEntry);
  const sourceOverrideEntryRaw = mergeManifestEntries(
    BLOG_IMAGE_OVERRIDES_CANONICAL?.slugs?.[slug] || null,
    BLOG_IMAGE_OVERRIDES?.slugs?.[slug] || null,
  );
  const sourceOverrideEntry = sanitizeGenericOverrideEntry(sourceOverrideEntryRaw, curatedEntry);
  const localUnsplashEntry = buildLocalUnsplashSelectionEntry(slug);
  const localUploadEntry = buildLocalUploadManifestEntry(slug);
  const persistedEntry = mergeManifestEntries(
    sourceOverrideEntry,
    curatedEntry,
  );
  const withLocalUnsplash = mergeManifestEntries(localUnsplashEntry, persistedEntry);
  return mergeManifestEntries(localUploadEntry, withLocalUnsplash);
};

export const getBlogImageAsset = ({ slug, category, variant = 'card', allowCategoryFallback = true } = {}) => {
  const normalizedSlug = slug?.trim();
  const normalizedCategory = category?.trim();
  const slugEntry = normalizedSlug ? getBlogManifestEntry(normalizedSlug) : null;
  const categoryEntry = allowCategoryFallback && normalizedCategory && BLOG_IMAGE_MANIFEST.categories[normalizedCategory];
  const categoryAsset = resolveBlogAsset(categoryEntry, variant);
  const slugAsset = resolveBlogAsset(slugEntry, variant);

  return slugAsset || categoryAsset;
};

export const getBlogImageUrl = ({ slug, category, variant = 'card', allowCategoryFallback = true } = {}) =>
  getBlogImageAsset({ slug, category, variant, allowCategoryFallback })?.src || null;

export const getBlogImageAttribution = ({ slug, category, variant = 'card' } = {}) => {
  const asset = getBlogImageAsset({ slug, category, variant });
  if (!asset?.photographer || !asset?.photographerUrl || !asset?.photoPageUrl) return null;

  return {
    photographer: asset.photographer,
    photographerUrl: asset.photographerUrl,
    photoPageUrl: asset.photoPageUrl,
    sourceLabel: asset.sourceLabel,
    downloadLocation: asset.downloadLocation,
  };
};

export const getCloudinaryBlogImage = ({ slug, category, variant = 'card' } = {}) => {
  const asset = getBlogImageAsset({ slug, category, variant });
  return asset?.source === 'cloudinary' ? asset.src : null;
};

export const getBlogContextAssets = ({ slug } = {}) => {
  const entry = slug ? getBlogManifestEntry(slug) : null;
  if (!entry || typeof entry !== 'object' || !Array.isArray(entry.context)) return [];

  return entry.context
    .map((asset) => buildRemoteAsset(asset, 'context'))
    .filter(Boolean);
};

export const hasCloudinaryBlogImage = ({ slug, category } = {}) =>
  Boolean(getCloudinaryBlogImage({ slug, category }));

export const hasBlogImageAsset = ({ slug, category, variant = 'card' } = {}) =>
  Boolean(getBlogImageAsset({ slug, category, variant }));

export default BLOG_IMAGE_MANIFEST;
