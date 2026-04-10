const WG_VISUAL_PROFILE = {
  style: ['modern', 'minimalist', 'sophisticated', 'clean'],
  colors: ['white', 'beige', 'gray', 'black', 'soft pastel'],
  imageType: ['real photography', 'elegant mockup'],
  avoid: ['explicit faces', 'high contrast', 'text over image', 'promotional look'],
};

const STOPWORDS = new Set([
  'a', 'ao', 'aos', 'as', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'na', 'nas', 'no', 'nos', 'o', 'os', 'para', 'por', 'sem', 'com', 'um', 'uma', 'the', 'for', 'and', 'del', 'la', 'las', 'los', 'el', 'en', 'un', 'una', 'y', 'site', 'blog', 'guia', 'complete', 'completo', 'completa', 'como', 'funciona', 'sobre', 'que', 'qual', 'mais', 'menos', 'ou', 'vs', 'via', 'wg', 'almeida', 'grupo'
]);

const TOKEN_MAP = {
  arquitetura: 'architecture',
  arquitectonica: 'architectural',
  architectura: 'architecture',
  arquiteturaresidencial: 'residential architecture',
  decoracao: 'decor',
  decoracion: 'decor',
  interiores: 'interiors',
  interior: 'interior',
  design: 'design',
  lighting: 'lighting',
  iluminacao: 'lighting',
  iluminacion: 'lighting',
  luz: 'light',
  kitchen: 'kitchen',
  cozinha: 'kitchen',
  cocinas: 'kitchen',
  banheiro: 'bathroom',
  bano: 'bathroom',
  bathroom: 'bathroom',
  quartos: 'bedroom',
  quarto: 'bedroom',
  bedroom: 'bedroom',
  sala: 'living room',
  living: 'living room',
  room: 'room',
  office: 'office',
  escritorio: 'office',
  corporativo: 'corporate',
  corporate: 'corporate',
  reforma: 'renovation',
  renovar: 'renovation',
  renovation: 'renovation',
  obra: 'construction',
  obras: 'construction',
  construction: 'construction',
  construcao: 'construction',
  engineering: 'engineering',
  engenharia: 'engineering',
  carpentry: 'carpentry',
  marcenaria: 'custom carpentry',
  carpinteria: 'custom carpentry',
  moveis: 'furniture',
  mobiliario: 'furniture',
  furniture: 'furniture',
  materiais: 'materials',
  material: 'material',
  palette: 'palette',
  paleta: 'palette',
  color: 'color',
  cores: 'colors',
  colores: 'colors',
  neutral: 'neutral',
  neutra: 'neutral',
  neutro: 'neutral',
  luxo: 'luxury',
  luxury: 'luxury',
  highend: 'high-end',
  premium: 'premium',
  moderno: 'modern',
  modern: 'modern',
  minimalista: 'minimalist',
  minimalist: 'minimalist',
  tendencias: 'trends',
  tendencia: 'trend',
  trends: 'trends',
  style: 'style',
  estilo: 'style',
  estilos: 'styles',
  apartmento: 'apartment',
  apartamento: 'apartment',
  apartment: 'apartment',
  casa: 'house',
  home: 'home',
  residencial: 'residential',
  residenciales: 'residential',
  residenciale: 'residential',
  smart: 'smart',
  tecnologia: 'technology',
  technology: 'technology',
  automacao: 'automation',
  automation: 'automation',
  sustentabilidade: 'sustainability',
  sustainable: 'sustainable',
  sustentabilidadeconstrucao: 'sustainable construction',
  paisagismo: 'landscape',
  landscape: 'landscape',
  fachada: 'facade',
  facade: 'facade',
  condominio: 'condominium',
  condominiofechado: 'gated community',
  hotel: 'hospitality',
  resort: 'resort',
  amsterdam: 'amsterdam',
  barcelona: 'barcelona',
  bruges: 'bruges',
  bruxelas: 'brussels',
  brussels: 'brussels',
  haarlem: 'haarlem',
  lisboa: 'lisbon',
  lisbon: 'lisbon',
  paris: 'paris',
  franca: 'france',
  france: 'france',
  holanda: 'netherlands',
  netherlands: 'netherlands',
  espanha: 'spain',
  spain: 'spain',
  portugal: 'portugal',
  belgica: 'belgium',
  belgium: 'belgium',
  hygge: 'hygge',
  japandi: 'japandi',
  boho: 'boho',
  escandinavo: 'scandinavian',
  escandinava: 'scandinavian',
  classico: 'classic',
  rustico: 'rustic',
  coastal: 'coastal',
};

const CATEGORY_HINTS = {
  arquitetura: 'architecture',
  projetos: 'architecture',
  design: 'interior design',
  engenharia: 'engineering',
  marcenaria: 'custom carpentry',
  tecnologia: 'smart home',
  tendencias: 'design trends',
  dicas: 'interior design',
};

const INTENT_RULES = [
  { intent: 'lighting', match: ['lighting', 'light'] },
  { intent: 'kitchen', match: ['kitchen'] },
  { intent: 'bathroom', match: ['bathroom'] },
  { intent: 'bedroom', match: ['bedroom'] },
  { intent: 'living', match: ['living room', 'living'] },
  { intent: 'carpentry', match: ['custom carpentry', 'carpentry', 'furniture', 'woodwork'] },
  { intent: 'corporate', match: ['corporate', 'office'] },
  { intent: 'technology', match: ['technology', 'automation', 'smart home', 'smart'] },
  { intent: 'construction', match: ['engineering', 'construction', 'renovation'] },
  { intent: 'decor', match: ['decor', 'design', 'interior', 'interiors', 'style', 'styles', 'trends'] },
  { intent: 'architecture', match: ['architecture', 'architectural', 'facade', 'residential'] },
];

const LOCATION_TOKENS = new Set([
  'amsterdam', 'barcelona', 'bruges', 'brussels', 'haarlem', 'lisbon', 'paris', 'france', 'netherlands', 'spain', 'portugal', 'belgium',
]);

const SEARCH_LIBRARY = {
  architecture: {
    hero: ['modern architecture exterior', 'minimalist facade design', 'neutral architecture photography', 'clean residential facade', 'soft light exterior'],
    card: ['architectural facade detail', 'modern facade material', 'clean geometry facade', 'neutral exterior detail', 'architectural lines detail'],
  },
  decor: {
    hero: ['minimalist interior design', 'modern home aesthetic', 'neutral living room', 'soft color decor', 'modern furniture layout'],
    card: ['interior styling detail', 'neutral decor detail', 'minimalist furniture detail', 'soft light interior detail', 'clean home composition'],
  },
  lighting: {
    hero: ['architectural lighting interior', 'modern lighting design', 'soft light living room', 'minimalist ambient lighting', 'neutral interior lighting'],
    card: ['lighting fixture detail', 'linear light detail', 'soft ambient light', 'architectural lighting detail', 'minimalist lamp styling'],
  },
  kitchen: {
    hero: ['modern kitchen interior', 'minimalist kitchen design', 'neutral kitchen palette', 'elegant kitchen photography', 'clean kitchen layout'],
    card: ['kitchen island detail', 'cabinet finish detail', 'modern kitchen styling', 'neutral countertop detail', 'minimal kitchen composition'],
  },
  bathroom: {
    hero: ['minimalist bathroom interior', 'modern bathroom design', 'neutral bathroom palette', 'elegant bathroom photography', 'clean spa bathroom'],
    card: ['bathroom fixture detail', 'stone bathroom detail', 'modern vanity detail', 'neutral bathroom styling', 'soft light bathroom detail'],
  },
  bedroom: {
    hero: ['minimalist bedroom interior', 'modern bedroom design', 'neutral bedroom palette', 'soft light bedroom', 'clean bedroom styling'],
    card: ['bedroom headboard detail', 'neutral bedding styling', 'modern bedside detail', 'soft bedroom texture', 'minimal bedroom composition'],
  },
  living: {
    hero: ['minimalist living room', 'modern living room design', 'neutral lounge interior', 'soft light living space', 'clean furniture arrangement'],
    card: ['living room detail', 'neutral sofa styling', 'modern coffee table detail', 'soft textile detail', 'clean interior corner'],
  },
  carpentry: {
    hero: ['custom carpentry interior', 'modern millwork design', 'neutral wood interior', 'luxury joinery interior', 'clean woodwork composition'],
    card: ['woodwork detail craftsmanship', 'cabinet joinery detail', 'wood texture interior', 'custom shelving detail', 'minimal millwork detail'],
  },
  corporate: {
    hero: ['modern office interior', 'corporate lobby design', 'neutral workspace interior', 'clean meeting room', 'minimal office architecture'],
    card: ['office detail interior', 'meeting room detail', 'workspace material detail', 'corporate reception detail', 'clean office styling'],
  },
  technology: {
    hero: ['smart home interior', 'modern automation interior', 'clean tech living room', 'minimal connected home', 'neutral smart interior'],
    card: ['smart home detail', 'automation panel detail', 'tech interior detail', 'modern switch detail', 'connected home styling'],
  },
  construction: {
    hero: ['modern renovation interior', 'construction site detail', 'architectural renovation', 'clean material palette', 'high-end construction'],
    card: ['construction material detail', 'renovation detail interior', 'architectural finish detail', 'clean building texture', 'engineering detail'],
  },
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const normalizeText = (value) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const translateToken = (token) => TOKEN_MAP[token] || token;

const tokenizeTheme = (theme) =>
  normalizeText(theme)
    .split(' ')
    .map((token) => token.trim())
    .filter(Boolean)
    .map(translateToken)
    .filter((token) => token && !STOPWORDS.has(token));

const detectIntent = (tokens, category) => {
  const hint = CATEGORY_HINTS[category] || '';
  const categoryTokens = tokenizeTheme(hint);
  const allTokens = unique([...tokens, ...categoryTokens]);

  const match = INTENT_RULES.find((rule) =>
    rule.match.some((term) => allTokens.includes(term))
  );

  return match?.intent || (category === 'engenharia' ? 'construction' : 'decor');
};

const detectLocation = (tokens) => tokens.find((token) => LOCATION_TOKENS.has(token)) || '';

const detectYear = (tokens) => tokens.find((token) => /^20\d{2}$/.test(token)) || '';

const buildThemePhrase = (tokens, category, intent) => {
  const filtered = tokens.filter((token) => !CATEGORY_HINTS[token] && !LOCATION_TOKENS.has(token));
  const priority = filtered.slice(0, 4);
  const fallback = CATEGORY_HINTS[category] || intent.replace(/-/g, ' ');
  const phrase = unique([...priority]).join(' ').trim();
  return phrase || fallback;
};

const buildLocationAwareMainQuery = (themePhrase, location, year, intent) => {
  if (location && intent === 'architecture') {
    return `${location} architecture${year ? ` ${year}` : ''}`.trim();
  }

  if (location && intent === 'decor') {
    return `${location} interior design${year ? ` ${year}` : ''}`.trim();
  }

  if (themePhrase) {
    return `${themePhrase}${year && !themePhrase.includes(year) ? ` ${year}` : ''}`.trim();
  }

  return year ? `modern interior design ${year}` : 'modern interior design';
};

const buildLibraryTerms = (intent, slot) =>
  SEARCH_LIBRARY[intent]?.[slot] || SEARCH_LIBRARY.decor[slot] || [];

const adaptTermsToTheme = (terms, themePhrase, location) => {
  if (!themePhrase && !location) return terms;

  return terms.map((term, index) => {
    if (index === 0 && location) {
      return `${location} ${term}`;
    }

    if (index === 1 && themePhrase) {
      return `${themePhrase} ${term.split(' ').slice(-2).join(' ')}`.trim();
    }

    return term;
  });
};

export const buildWgImageSearchPayload = (theme, options = {}) => {
  const { category = '', slot = 'hero' } = options;
  const tokens = tokenizeTheme(theme);
  const intent = detectIntent(tokens, category);
  const location = detectLocation(tokens);
  const year = detectYear(tokens);
  const themePhrase = buildThemePhrase(tokens, category, intent);
  const mainQuery = buildLocationAwareMainQuery(themePhrase, location, year, intent);
  const searchTerms = unique(
    adaptTermsToTheme(buildLibraryTerms(intent, slot), themePhrase, location)
      .map((term) => term.trim())
      .filter((term) => term && term.toLowerCase() !== mainQuery.toLowerCase())
  ).slice(0, 5);

  return {
    theme,
    category,
    slot,
    intent,
    mainQuery,
    searchTerms,
    visualProfile: WG_VISUAL_PROFILE,
  };
};

export const buildWgEditorialSearchPlan = (post) => ({
  hero: buildWgImageSearchPayload(post.title || post.slug || '', {
    category: post.category || '',
    slot: 'hero',
  }),
  card: buildWgImageSearchPayload(post.title || post.slug || '', {
    category: post.category || '',
    slot: 'card',
  }),
});

export const formatWgImageSearchJson = (payload) =>
  JSON.stringify(
    {
      main_query: payload.mainQuery,
      search_terms: payload.searchTerms,
    },
    null,
    2
  );

export default buildWgImageSearchPayload;
