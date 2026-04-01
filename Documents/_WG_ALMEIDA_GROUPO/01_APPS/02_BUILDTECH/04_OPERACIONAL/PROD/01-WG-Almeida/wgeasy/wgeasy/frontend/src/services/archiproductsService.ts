// ============================================================
// SERVICE: ImportaçÍo de Produtos Archiproducts
// Sistema WG Easy - Grupo WG Almeida
// Data: 2026-01-11
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import { criarItem, criarCategoria, listarCategorias } from "@/lib/pricelistApi";
import {
  ArchiproductsProduct,
  ArchiproductsNews,
  archiproductsToPricelistItem,
  archiproductsNewsToBlogPost,
  parseProductListingMarkdown,
  parseArchiproductsNews,
  ARCHIPRODUCTS_CATEGORY_MAP,
  ARCHIPRODUCTS_CONFIG,
} from "@/lib/archiproductsIntegration";

// ============================================================
// TIPOS
// ============================================================

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface ArchiproductsImportOptions {
  categorias?: string[];
  marcas?: string[];
  apenasNovos?: boolean;
  limite?: number;
}

// ============================================================
// FUNÇÕES DE IMPORTAÇÍO
// ============================================================

/**
 * Verifica se um produto já existe no pricelist
 */
async function produtoJaExiste(archiproductsId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .select("id")
    .eq("codigo", `ARCH-${archiproductsId}`)
    .maybeSingle();

  if (error) {
    console.error("[Archiproducts] Erro ao verificar existência:", error);
    return false;
  }

  return !!data;
}

/**
 * Importa um único produto para o pricelist
 */
export async function importarProdutoArchiproducts(
  product: ArchiproductsProduct
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verificar se já existe
    if (await produtoJaExiste(product.id)) {
      return { success: false, error: "Produto já importado" };
    }

    // Converter para formato do pricelist
    const itemData = archiproductsToPricelistItem(product);

    // Buscar ou criar categoria
    const categoryMapping = getCategoryMapping(product.type);
    if (categoryMapping) {
      const categoria = await buscarOuCriarCategoria(categoryMapping.categoria);
      if (categoria) {
        itemData.categoria_id = categoria.id;
      }
    }

    // Criar item no pricelist
    await criarItem(itemData);

    return { success: true };
  } catch (error) {
    const mensagem = formatError(error);
    console.error("[Archiproducts] Erro ao importar produto:", mensagem);
    return { success: false, error: mensagem };
  }
}

/**
 * Importa múltiplos produtos
 */
export async function importarProdutosArchiproducts(
  products: ArchiproductsProduct[],
  options?: ArchiproductsImportOptions
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  const limite = options?.limite || products.length;
  const produtosParaImportar = products.slice(0, limite);

  for (const product of produtosParaImportar) {
    // Filtrar por marca se especificado
    if (options?.marcas && options.marcas.length > 0) {
      const brandSlug = product.brand.toLowerCase().replace(/\s+/g, "-");
      if (!options.marcas.includes(brandSlug)) {
        result.skipped++;
        continue;
      }
    }

    const importResult = await importarProdutoArchiproducts(product);

    if (importResult.success) {
      result.imported++;
    } else if (importResult.error === "Produto já importado") {
      result.skipped++;
    } else {
      result.errors.push(`${product.name}: ${importResult.error}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Busca ou cria categoria para os produtos importados
 */
async function buscarOuCriarCategoria(nomeCategoria: string): Promise<{ id: string } | null> {
  try {
    // Buscar categoria existente
    const categorias = await listarCategorias();
    const existente = categorias.find(
      (c) => c.nome.toLowerCase() === nomeCategoria.toLowerCase()
    );

    if (existente) {
      return { id: existente.id };
    }

    // Criar nova categoria
    const novaCategoria = await criarCategoria({
      nome: nomeCategoria,
      tipo: "produto",
      descricao: `Categoria importada do Archiproducts`,
      ativo: true,
    });

    return { id: novaCategoria.id };
  } catch (error) {
    console.error("[Archiproducts] Erro ao buscar/criar categoria:", error);
    return null;
  }
}

/**
 * Obtém mapeamento de categoria para um tipo de produto
 */
function getCategoryMapping(productType: string): { categoria: string; subcategoria?: string } | null {
  const typeKey = productType.toLowerCase().replace(/\s+/g, "-");

  // Busca direta
  if (ARCHIPRODUCTS_CATEGORY_MAP[typeKey]) {
    return ARCHIPRODUCTS_CATEGORY_MAP[typeKey];
  }

  // Busca parcial
  for (const [key, value] of Object.entries(ARCHIPRODUCTS_CATEGORY_MAP)) {
    if (typeKey.includes(key) || key.includes(typeKey)) {
      return value;
    }
  }

  // Categoria padrÍo
  return { categoria: "Produtos Importados" };
}

function formatError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

// ============================================================
// FUNÇÕES DE CONTEÚDO PARA BLOG
// ============================================================

export interface BlogPostImport {
  titulo: string;
  resumo: string;
  imagem_destaque: string;
  link_original: string;
  fonte: string;
  categoria: string;
  tags: string[];
}

interface SearchResponse {
  products?: ArchiproductsProduct[];
}

interface ProductDetailResponse {
  product?: ArchiproductsProduct;
}

/**
 * Importa notícias do Archiproducts para o blog
 */
export async function importarNoticiasParaBlog(
  news: ArchiproductsNews[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    imported: 0,
    skipped: 0,
    errors: [],
  };

  for (const noticia of news) {
    try {
      const blogPost = archiproductsNewsToBlogPost(noticia);

      // Verificar se já existe
      const { data: existente } = await supabase
        .from("blog_posts")
        .select("id")
        .eq("link_original", noticia.articleUrl)
        .maybeSingle();

      if (existente) {
        result.skipped++;
        continue;
      }

      // Inserir novo post
      const { error } = await supabase
        .from("blog_posts")
        .insert({
          titulo: blogPost.titulo,
          resumo: blogPost.resumo,
          imagem_destaque: blogPost.imagem_destaque,
          link_original: blogPost.link_original,
          fonte: blogPost.fonte,
          categoria: blogPost.categoria,
          tags: blogPost.tags,
          status: "rascunho", // Requer revisÍo antes de publicar
          autor_id: null, // Será definido pelo editor
        });

      if (error) {
        result.errors.push(`${noticia.title}: ${error.message}`);
      } else {
        result.imported++;
      }
    } catch (error) {
      result.errors.push(`${noticia.title}: ${formatError(error)}`);
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

// ============================================================
// FUNÇÕES DE BUSCA
// ============================================================

/**
 * Busca produtos no Archiproducts (via scraping)
 * NOTA: Esta funçÍo requer o backend para fazer o scraping
 */
export async function buscarProdutosArchiproducts(
  query: string,
  opcoes?: { limite?: number; categoria?: string }
): Promise<ArchiproductsProduct[]> {
  try {
    // Chamar endpoint do backend que faz o scraping
    const response = await fetch("/api/archiproducts/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limite: opcoes?.limite || 20,
        categoria: opcoes?.categoria,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar produtos");
    }

    const data = (await response.json()) as SearchResponse;
    return data.products || [];
  } catch (error) {
    console.error("[Archiproducts] Erro na busca:", error);
    return [];
  }
}

/**
 * Busca detalhes de um produto específico
 */
export async function buscarDetalhesProduto(
  productUrl: string
): Promise<ArchiproductsProduct | null> {
  try {
    const response = await fetch("/api/archiproducts/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: productUrl }),
    });

    if (!response.ok) {
      throw new Error("Erro ao buscar detalhes do produto");
    }

    const data = (await response.json()) as ProductDetailResponse;
    return data.product || null;
  } catch (error) {
    console.error("[Archiproducts] Erro ao buscar detalhes:", error);
    return null;
  }
}

// ============================================================
// FUNÇÕES DE SINCRONIZAÇÍO
// ============================================================

/**
 * Sincroniza categorias do Archiproducts com o pricelist
 */
export async function sincronizarCategorias(): Promise<{
  criadas: number;
  existentes: number;
}> {
  const result = { criadas: 0, existentes: 0 };

  const categoriasUnicas = new Set<string>();
  for (const mapping of Object.values(ARCHIPRODUCTS_CATEGORY_MAP)) {
    categoriasUnicas.add(mapping.categoria);
  }

  for (const nomeCategoria of categoriasUnicas) {
    const categoria = await buscarOuCriarCategoria(nomeCategoria);
    if (categoria) {
      // Categoria já existia ou foi criada
      const categorias = await listarCategorias();
      const existente = categorias.find(c => c.nome === nomeCategoria);
      if (existente && existente.created_at === existente.updated_at) {
        result.criadas++;
      } else {
        result.existentes++;
      }
    }
  }

  return result;
}

/**
 * Lista produtos já importados do Archiproducts
 */
export async function listarProdutosImportados(): Promise<{
  total: number;
  produtos: { id: string; nome: string; codigo: string; imagem_url?: string }[];
}> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .select("id, nome, codigo, imagem_url")
    .like("codigo", "ARCH-%")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[Archiproducts] Erro ao listar importados:", error);
    return { total: 0, produtos: [] };
  }

  return {
    total: data?.length || 0,
    produtos: data || [],
  };
}

// ============================================================
// EXPORT HELPERS
// ============================================================

export {
  ARCHIPRODUCTS_CONFIG,
  ARCHIPRODUCTS_CATEGORY_MAP,
  parseProductListingMarkdown,
  parseArchiproductsNews,
};

