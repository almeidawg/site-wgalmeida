export const STYLE_SEARCH_PROFILES = {
  'art-deco': ['art deco interior', 'luxury geometric interior', 'brass marble interior'],
  'art-nouveau': ['art nouveau interior', 'organic curves interior', 'decorative floral interior'],
  boho: ['boho chic interior', 'layered bohemian living room', 'natural textured boho interior'],
  classico: ['classic interior design', 'timeless elegant living room', 'ornate moulding marble interior'],
  coastal: ['coastal interior design', 'light airy beach house interior', 'neutral coastal living room'],
  contemporaneo: ['contemporary interior design', 'refined modern living room', 'clean sophisticated interior'],
  cottage: ['cottage interior design', 'cozy cottage living room', 'soft rustic cottage interior'],
  ecletico: ['eclectic interior design', 'collected layered interior', 'mix and match luxury interior'],
  escandinavo: ['scandinavian interior design', 'minimal nordic living room', 'light wood neutral interior'],
  farmhouse: ['farmhouse interior design', 'modern farmhouse living room', 'rustic refined farmhouse interior'],
  glam: ['glam interior design', 'luxury glamorous living room', 'gold velvet elegant interior'],
  hampton: ['hamptons interior design', 'coastal luxury living room', 'bright elegant hamptons interior'],
  'hollywood-regency': ['hollywood regency interior', 'bold glamorous interior', 'high contrast luxury room'],
  industrial: ['industrial interior design', 'loft concrete metal interior', 'urban industrial living room'],
  japandi: ['japandi interior design', 'minimal warm wood interior', 'japanese scandinavian living room'],
  maximalista: ['maximalist interior design', 'bold layered luxury interior', 'colorful expressive living room'],
  mediterraneo: ['mediterranean interior design', 'warm plaster arch interior', 'sunlit mediterranean living room'],
  'mid-century': ['mid century modern interior', 'walnut vintage modern living room', 'retro modern interior'],
  minimalismo: ['minimalist interior design', 'quiet neutral luxury interior', 'clean serene living room'],
  moderno: ['modern interior design', 'sleek contemporary living room', 'architectural modern interior'],
  neoclassico: ['neoclassical interior design', 'symmetrical refined interior', 'elegant moulding salon'],
  provencal: ['provencal interior design', 'french country elegant interior', 'soft rustic chic living room'],
  rustico: ['rustic interior design', 'natural wood stone living room', 'warm rustic luxury interior'],
  'shabby-chic': ['shabby chic interior design', 'romantic distressed furniture interior', 'soft vintage chic room'],
  southwest: ['southwest interior design', 'desert warm earthy interior', 'terracotta southwestern living room'],
  transitional: ['transitional interior design', 'classic modern balanced interior', 'soft luxury transitional room'],
  tropical: ['tropical interior design', 'lush natural airy interior', 'resort style living room'],
  tulum: ['tulum style interior', 'organic earthy luxury interior', 'boho mediterranean resort interior'],
  'urban-modern': ['urban modern interior design', 'city luxury apartment interior', 'modern metropolitan living room'],
  vintage: ['vintage interior design', 'nostalgic curated living room', 'retro elegant interior'],
  'wabi-sabi': ['wabi sabi interior design', 'organic imperfect serene interior', 'earthy minimalist textured room'],
};

export const buildStyleEditorialSearchPlan = (style = {}) => {
  const baseQueries = STYLE_SEARCH_PROFILES[style.slug] || [];
  const excerptTerms = typeof style.excerpt === 'string'
    ? style.excerpt
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
      .split(/\s+/)
      .filter((term) => term.length > 3)
      .slice(0, 6)
    : [];
  const tagTerms = Array.isArray(style.tags)
    ? style.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : [];
  const searchTerms = [...new Set([...baseQueries, ...tagTerms, ...excerptTerms])];
  const mainQuery = baseQueries[0] || `${style.title || style.slug || 'interior'} interior design`;

  return {
    mainQuery,
    searchTerms,
    searchQuery: mainQuery,
    intent: 'referencia real de ambiente para capa editorial do guia de estilo',
  };
};
