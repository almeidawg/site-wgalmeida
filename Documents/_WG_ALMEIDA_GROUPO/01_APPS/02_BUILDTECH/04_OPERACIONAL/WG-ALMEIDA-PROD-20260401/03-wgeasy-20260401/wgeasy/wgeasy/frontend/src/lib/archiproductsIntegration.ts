/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// INTEGRAÇÍO: Archiproducts → WG Easy Pricelist
// Sistema WG Easy - Grupo WG Almeida
// Data: 2026-01-11
// ============================================================

import type { PricelistItemFormData, TipoPricelist } from "@/types/pricelist";

// ============================================================
// TIPOS: Estrutura de dados Archiproducts
// ============================================================

export interface ArchiproductsProduct {
  id: string;
  name: string;
  type: string;
  brand: string;
  designer?: string;
  collection?: string;
  year?: number;
  description?: string;
  technicalInfo?: Record<string, string>;
  materials?: string[];
  imageUrl?: string;
  productUrl: string;
  categories?: string[];
  tags?: string[];
  dimensions?: ArchiproductsDimensions[];
}

export interface ArchiproductsDimensions {
  imageUrl: string;
  label?: string;
}

export interface ArchiproductsNews {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  articleUrl: string;
  category: ArchiproductsNewsCategory;
  date?: string;
}

export type ArchiproductsNewsCategory =
  | "design"
  | "interiores"
  | "arquitetura"
  | "inspiracoes"
  | "moodboard"
  | "pessoas"
  | "eventos"
  | "historias"
  | "guias";

// ============================================================
// MAPEAMENTO: Categorias Archiproducts → Pricelist WG
// ============================================================

export const ARCHIPRODUCTS_CATEGORY_MAP: Record<string, {
  categoria: string;
  subcategoria?: string;
  nucleo: string;
}> = {
  // Mobiliário
  "sofas": { categoria: "Mobiliário", subcategoria: "Sofás", nucleo: "arquitetura" },
  "armchairs": { categoria: "Mobiliário", subcategoria: "Poltronas", nucleo: "arquitetura" },
  "chairs": { categoria: "Mobiliário", subcategoria: "Cadeiras", nucleo: "arquitetura" },
  "tables": { categoria: "Mobiliário", subcategoria: "Mesas", nucleo: "arquitetura" },
  "beds": { categoria: "Mobiliário", subcategoria: "Camas", nucleo: "arquitetura" },
  "storage": { categoria: "Mobiliário", subcategoria: "Armários", nucleo: "marcenaria" },
  "bookcases": { categoria: "Mobiliário", subcategoria: "Estantes", nucleo: "marcenaria" },

  // Casa de banho
  "bathroom-furniture": { categoria: "Banheiro", subcategoria: "Móveis", nucleo: "arquitetura" },
  "washbasins": { categoria: "Banheiro", subcategoria: "Cubas", nucleo: "arquitetura" },
  "bathtubs": { categoria: "Banheiro", subcategoria: "Banheiras", nucleo: "arquitetura" },
  "showers": { categoria: "Banheiro", subcategoria: "Chuveiros", nucleo: "engenharia" },
  "taps": { categoria: "Banheiro", subcategoria: "Torneiras", nucleo: "engenharia" },

  // Cozinha
  "kitchen-furniture": { categoria: "Cozinha", subcategoria: "Móveis", nucleo: "marcenaria" },
  "kitchen-taps": { categoria: "Cozinha", subcategoria: "Torneiras", nucleo: "engenharia" },
  "sinks": { categoria: "Cozinha", subcategoria: "Cubas", nucleo: "engenharia" },

  // IluminaçÍo
  "pendant-lamps": { categoria: "IluminaçÍo", subcategoria: "Pendentes", nucleo: "arquitetura" },
  "floor-lamps": { categoria: "IluminaçÍo", subcategoria: "Luminárias de Piso", nucleo: "arquitetura" },
  "table-lamps": { categoria: "IluminaçÍo", subcategoria: "Luminárias de Mesa", nucleo: "arquitetura" },
  "wall-lamps": { categoria: "IluminaçÍo", subcategoria: "Arandelas", nucleo: "arquitetura" },
  "ceiling-lamps": { categoria: "IluminaçÍo", subcategoria: "Plafons", nucleo: "engenharia" },

  // Jardim/Outdoor
  "outdoor-sofas": { categoria: "Outdoor", subcategoria: "Sofás", nucleo: "arquitetura" },
  "outdoor-chairs": { categoria: "Outdoor", subcategoria: "Cadeiras", nucleo: "arquitetura" },
  "outdoor-tables": { categoria: "Outdoor", subcategoria: "Mesas", nucleo: "arquitetura" },

  // Escritório
  "office-chairs": { categoria: "Escritório", subcategoria: "Cadeiras", nucleo: "arquitetura" },
  "office-desks": { categoria: "Escritório", subcategoria: "Mesas", nucleo: "marcenaria" },

  // Revestimentos
  "tiles": { categoria: "Revestimentos", subcategoria: "Porcelanatos", nucleo: "arquitetura" },
  "flooring": { categoria: "Revestimentos", subcategoria: "Pisos", nucleo: "arquitetura" },
  "wall-tiles": { categoria: "Revestimentos", subcategoria: "Azulejos", nucleo: "arquitetura" },
};

// ============================================================
// MAPEAMENTO: Marcas conhecidas
// ============================================================

export const ARCHIPRODUCTS_BRANDS: Record<string, {
  name: string;
  country: string;
  segment: "luxury" | "premium" | "mid-range";
}> = {
  "b-b-italia": { name: "B&B Italia", country: "Italy", segment: "luxury" },
  "cassina": { name: "Cassina", country: "Italy", segment: "luxury" },
  "poltrona-frau": { name: "Poltrona Frau", country: "Italy", segment: "luxury" },
  "flexform": { name: "Flexform", country: "Italy", segment: "luxury" },
  "minotti": { name: "Minotti", country: "Italy", segment: "luxury" },
  "molteni": { name: "Molteni & C", country: "Italy", segment: "luxury" },
  "kartell": { name: "Kartell", country: "Italy", segment: "premium" },
  "vitra": { name: "Vitra", country: "Switzerland", segment: "premium" },
  "knoll": { name: "Knoll", country: "USA", segment: "premium" },
  "herman-miller": { name: "Herman Miller", country: "USA", segment: "premium" },
  "flos": { name: "Flos", country: "Italy", segment: "luxury" },
  "artemide": { name: "Artemide", country: "Italy", segment: "premium" },
  "foscarini": { name: "Foscarini", country: "Italy", segment: "premium" },
  "gessi": { name: "Gessi", country: "Italy", segment: "luxury" },
  "dornbracht": { name: "Dornbracht", country: "Germany", segment: "luxury" },
  "agape": { name: "Agape", country: "Italy", segment: "luxury" },
  "boffi": { name: "Boffi", country: "Italy", segment: "luxury" },
};

// ============================================================
// FUNÇÕES: ConversÍo de dados
// ============================================================

/**
 * Converte produto Archiproducts para formato PricelistItemFormData
 */
export function archiproductsToPricelistItem(
  product: ArchiproductsProduct
): PricelistItemFormData {
  // Determinar categoria e subcategoria baseado no tipo do produto
  const categoryKey = product.type?.toLowerCase().replace(/\s+/g, "-") || "";
  const mapping = ARCHIPRODUCTS_CATEGORY_MAP[categoryKey];

  // Extrair preço se disponível (Archiproducts geralmente não mostra preço público)
  // O preço será definido manualmente ou via cotaçÍo
  const preco = 0; // Preço sob consulta

  // Construir descriçÍo completa
  const descricaoCompleta = [
    product.description,
    product.designer ? `Design: ${product.designer}` : null,
    product.collection ? `ColeçÍo: ${product.collection}` : null,
    product.year ? `Ano: ${product.year}` : null,
  ].filter(Boolean).join("\n");

  // Especificações técnicas
  const especificacoes: Record<string, any> = {
    fonte: "archiproducts",
    archiproducts_id: product.id,
    designer: product.designer,
    collection: product.collection,
    year: product.year,
    materials: product.materials,
    technicalInfo: product.technicalInfo,
    categories: product.categories,
    tags: product.tags,
  };

  return {
    // IdentificaçÍo
    codigo: `ARCH-${product.id}`,
    nome: `${product.name} - ${product.type}`,
    descricao: descricaoCompleta || product.type,
    tipo: "produto" as TipoPricelist,

    // Preço e unidade
    unidade: "und",
    preco: preco,

    // Fabricante
    fabricante: product.brand,
    linha: product.collection,
    modelo: product.designer,
    link_produto: product.productUrl,

    // Imagem
    imagem_url: product.imageUrl,

    // Especificações
    especificacoes,

    // Status
    ativo: true,
    controla_estoque: false,
  };
}

/**
 * Extrai ID do produto da URL do Archiproducts
 * Exemplo: /products/b-b-italia/4-seater-leather-sofa-sake_296140 → 296140
 */
export function extractProductIdFromUrl(url: string): string | null {
  const match = url.match(/_(\d+)$/);
  return match ? match[1] : null;
}

/**
 * Extrai slug da marca da URL do Archiproducts
 * Exemplo: /products/b-b-italia/... → b-b-italia
 */
export function extractBrandSlugFromUrl(url: string): string | null {
  const match = url.match(/\/products\/([^/]+)\//);
  return match ? match[1] : null;
}

/**
 * Normaliza nome da marca
 */
export function normalizeBrandName(brandSlug: string): string {
  const known = ARCHIPRODUCTS_BRANDS[brandSlug];
  if (known) return known.name;

  // Capitalizar e substituir hífens por espaços
  return brandSlug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// ============================================================
// FUNÇÕES: Parsing de páginas
// ============================================================

/**
 * Parse de produto a partir do markdown do Firecrawl
 */
export function parseArchiproductsMarkdown(
  markdown: string,
  sourceUrl: string
): ArchiproductsProduct | null {
  try {
    const productId = extractProductIdFromUrl(sourceUrl);
    const brandSlug = extractBrandSlugFromUrl(sourceUrl);

    if (!productId) return null;

    // Extrair nome do produto (primeiro H1 após o brand)
    const nameMatch = markdown.match(/# \[([^\]]+)\][^\n]*\n([^\n]+)/);
    const productName = nameMatch ? nameMatch[2].trim() : "";

    // Extrair tipo do produto
    const typeMatch = markdown.match(/\*\*Type\*\*\s*\n\n## ([^\n]+)/i) ||
                     markdown.match(/\*\*([^*]+)\*\* - ([^*]+)/);
    const productType = typeMatch ? typeMatch[1].trim() : "";

    // Extrair designer
    const designerMatch = markdown.match(/Designer\s*\n?\*\*\[?([^\]\n*]+)/i);
    const designer = designerMatch ? designerMatch[1].trim() : undefined;

    // Extrair coleçÍo
    const collectionMatch = markdown.match(/Collection\s*\*\*\[?([^\]\n*]+)/i);
    const collection = collectionMatch ? collectionMatch[1].trim() : undefined;

    // Extrair ano
    const yearMatch = markdown.match(/Manufacture year\s*\n\n## (\d{4})/i);
    const year = yearMatch ? parseInt(yearMatch[1]) : undefined;

    // Extrair descriçÍo
    const descMatch = markdown.match(/\*\*SAKé\*\* signals[^.]+\./i) ||
                     markdown.match(/The design begins[^.]+\./i);
    const description = descMatch ? descMatch[0] : undefined;

    // Extrair URLs de imagens
    const imageMatches = markdown.match(/!\[[^\]]*\]\((https:\/\/img\.edilportale\.com[^)]+)\)/g);
    const imageUrl = imageMatches && imageMatches.length > 0
      ? imageMatches[0].match(/\((https:\/\/[^)]+)\)/)?.[1]
      : undefined;

    // Extrair materiais
    const materialsMatch = markdown.match(/\*\*Materials\*\*[^[]*\[([^\]]+)\]/gi);
    const materials = materialsMatch
      ? materialsMatch.map(m => m.replace(/\*\*Materials\*\*[^[]*\[/, "").replace(/\]/, "").trim())
      : undefined;

    return {
      id: productId,
      name: productName || `Product ${productId}`,
      type: productType,
      brand: brandSlug ? normalizeBrandName(brandSlug) : "Unknown",
      designer,
      collection,
      year,
      description,
      materials,
      imageUrl,
      productUrl: sourceUrl,
    };
  } catch (error) {
    console.error("[Archiproducts] Erro ao parsear markdown:", error);
    return null;
  }
}

/**
 * Parse de listagem de produtos
 */
export function parseProductListingMarkdown(
  markdown: string
): { name: string; brand: string; type: string; url: string; imageUrl?: string }[] {
  const products: { name: string; brand: string; type: string; url: string; imageUrl?: string }[] = [];

  // Pattern: [![Type NOME Brand](imageUrl)...**NOME - Type**](productUrl)
  const productPattern = /\[!\[([^\]]+)\]\(([^)]+)\)[^[]*\*\*([^*]+)\*\*\]\(([^)]+)\)/g;

  let match;
  while ((match = productPattern.exec(markdown)) !== null) {
    const [, altText, imageUrl, nameType, url] = match;

    // Extrair brand do alt text ou URL
    const brandSlug = extractBrandSlugFromUrl(url);
    const brand = brandSlug ? normalizeBrandName(brandSlug) : "";

    // Separar nome e tipo
    const [name, ...typeParts] = nameType.split(" - ");
    const type = typeParts.join(" - ") || altText;

    products.push({
      name: name.trim(),
      brand,
      type: type.trim(),
      url,
      imageUrl,
    });
  }

  return products;
}

// ============================================================
// FUNÇÕES: Notícias para Blog
// ============================================================

/**
 * Parse de notícias do Archiproducts para conteúdo de blog
 */
export function parseArchiproductsNews(markdown: string): ArchiproductsNews[] {
  const news: ArchiproductsNews[] = [];

  // Pattern para notícias: [![Título](imageUrl)\n\nviews\n\n**Título**\n\nDescriçÍo](articleUrl)
  const newsPattern = /\[!\[([^\]]+)\]\(([^)]+)\)[^*]*\*\*([^*]+)\*\*\s*\\?\n\\?\n([^\]]+)\]\(([^)]+)\)/g;

  let match;
  let index = 0;
  while ((match = newsPattern.exec(markdown)) !== null) {
    const [, altTitle, imageUrl, title, description, articleUrl] = match;

    // Extrair categoria da URL
    const categoryMatch = articleUrl.match(/\/noticias\/([^/_]+)/);
    const categorySlug = categoryMatch ? categoryMatch[1] : "design";

    news.push({
      id: `arch-news-${index++}`,
      title: title.trim(),
      description: description.trim().replace(/\\\n/g, " "),
      imageUrl,
      articleUrl,
      category: categorySlug as ArchiproductsNewsCategory,
    });
  }

  return news;
}

/**
 * Converte notícia Archiproducts para formato de post de blog
 */
export function archiproductsNewsToBlogPost(news: ArchiproductsNews) {
  return {
    titulo: news.title,
    resumo: news.description,
    imagem_destaque: news.imageUrl,
    link_original: news.articleUrl,
    fonte: "Archiproducts",
    categoria: mapNewsCategory(news.category),
    tags: ["design", "arquitetura", news.category],
  };
}

function mapNewsCategory(category: ArchiproductsNewsCategory): string {
  const mapping: Record<ArchiproductsNewsCategory, string> = {
    design: "Design",
    interiores: "Interiores",
    arquitetura: "Arquitetura",
    inspiracoes: "Inspirações",
    moodboard: "Moodboard",
    pessoas: "Entrevistas",
    eventos: "Eventos",
    historias: "Histórias",
    guias: "Guias",
  };
  return mapping[category] || "Design";
}

// ============================================================
// CONFIGURAÇÍO: URLs base
// ============================================================

export const ARCHIPRODUCTS_CONFIG = {
  baseUrl: "https://www.archiproducts.com",
  language: "pt", // Português

  // Endpoints de categorias principais
  categories: {
    furniture: "/pt/produtos/mobiliario",
    bathroom: "/pt/produtos/casa-de-banho",
    kitchen: "/pt/produtos/cozinha",
    lighting: "/pt/produtos/iluminacao",
    outdoor: "/pt/produtos/jardim",
    office: "/pt/produtos/escritorio",
  },

  // Endpoint de notícias
  news: "/pt/noticias",

  // Endpoint de busca
  search: "/pt/search",
};

/**
 * Gera URL completa para categoria
 */
export function getCategoryUrl(category: keyof typeof ARCHIPRODUCTS_CONFIG.categories): string {
  return `${ARCHIPRODUCTS_CONFIG.baseUrl}${ARCHIPRODUCTS_CONFIG.categories[category]}`;
}

/**
 * Gera URL de busca
 */
export function getSearchUrl(query: string): string {
  return `${ARCHIPRODUCTS_CONFIG.baseUrl}${ARCHIPRODUCTS_CONFIG.search}?q=${encodeURIComponent(query)}`;
}



