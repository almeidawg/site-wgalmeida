// ============================================================
// API: Loja Virtual
// Sistema WG Easy - Grupo WG Almeida
// Data: 2026-01-11
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface LojaProduto {
  id: string;
  pricelist_item_id: string | null;
  titulo_loja: string;
  descricao_loja: string | null;
  slug: string;
  preco_venda: number;
  preco_promocional: number | null;
  promocao_ativa: boolean;
  imagens: string[];
  categoria_loja: string | null;
  subcategoria_loja: string | null;
  tags: string[];
  destaque: boolean;
  novidade: boolean;
  ordem: number;
  estoque_disponivel: number;
  permite_encomenda: boolean;
  prazo_encomenda_dias: number;
  publicado: boolean;
  ativo: boolean;
  fonte_importacao: string | null;
  url_fonte: string | null;
  created_at: string;
  updated_at: string;
}

export interface LojaCategoria {
  id: string;
  nome: string;
  slug: string;
  descricao: string | null;
  imagem_url: string | null;
  categoria_pai_id: string | null;
  ordem: number;
  ativo: boolean;
}

export interface LojaProdutoFormData {
  pricelist_item_id?: string;
  titulo_loja: string;
  descricao_loja?: string;
  preco_venda: number;
  preco_promocional?: number;
  promocao_ativa?: boolean;
  imagens?: string[];
  categoria_loja?: string;
  subcategoria_loja?: string;
  tags?: string[];
  destaque?: boolean;
  novidade?: boolean;
  estoque_disponivel?: number;
  permite_encomenda?: boolean;
  prazo_encomenda_dias?: number;
  publicado?: boolean;
}

export interface LojaFiltros {
  categoria?: string;
  subcategoria?: string;
  busca?: string;
  apenas_publicados?: boolean;
  apenas_destaques?: boolean;
  apenas_novidades?: boolean;
  apenas_promocao?: boolean;
  preco_min?: number;
  preco_max?: number;
  fonte_importacao?: string;
  limite?: number;
}

// ============================================================
// CATEGORIAS
// ============================================================

/**
 * Listar categorias da loja
 */
export async function listarCategoriasLoja(): Promise<LojaCategoria[]> {
  const { data, error } = await supabase
    .from("loja_categorias")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as LojaCategoria[];
}

/**
 * Criar categoria da loja
 */
export async function criarCategoriaLoja(
  payload: Omit<LojaCategoria, "id" | "created_at">
): Promise<LojaCategoria> {
  const { data, error } = await supabase
    .from("loja_categorias")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data as LojaCategoria;
}

// ============================================================
// PRODUTOS
// ============================================================

/**
 * Listar produtos da loja
 */
export async function listarProdutosLoja(
  filtros?: LojaFiltros
): Promise<LojaProduto[]> {
  let query = supabase
    .from("loja_produtos")
    .select("*");

  // Aplicar filtros
  if (filtros?.apenas_publicados !== false) {
    query = query.eq("publicado", true);
  }

  if (filtros?.categoria) {
    query = query.eq("categoria_loja", filtros.categoria);
  }

  if (filtros?.subcategoria) {
    query = query.eq("subcategoria_loja", filtros.subcategoria);
  }

  if (filtros?.apenas_destaques) {
    query = query.eq("destaque", true);
  }

  if (filtros?.apenas_novidades) {
    query = query.eq("novidade", true);
  }

  if (filtros?.apenas_promocao) {
    query = query.eq("promocao_ativa", true);
  }

  if (filtros?.preco_min !== undefined) {
    query = query.gte("preco_venda", filtros.preco_min);
  }

  if (filtros?.preco_max !== undefined) {
    query = query.lte("preco_venda", filtros.preco_max);
  }

  if (filtros?.fonte_importacao) {
    query = query.eq("fonte_importacao", filtros.fonte_importacao);
  }

  if (filtros?.busca) {
    query = query.or(
      `titulo_loja.ilike.%${filtros.busca}%,descricao_loja.ilike.%${filtros.busca}%,tags.cs.{${filtros.busca}}`
    );
  }

  // OrdenaçÍo e limite
  query = query
    .order("destaque", { ascending: false })
    .order("novidade", { ascending: false })
    .order("ordem", { ascending: true })
    .limit(filtros?.limite || 50);

  const { data, error } = await query;

  if (error) throw error;
  return data as LojaProduto[];
}

/**
 * Buscar produto por ID
 */
export async function buscarProdutoLoja(id: string): Promise<LojaProduto> {
  const { data, error } = await supabase
    .from("loja_produtos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as LojaProduto;
}

/**
 * Buscar produto por slug
 */
export async function buscarProdutoPorSlug(slug: string): Promise<LojaProduto | null> {
  const { data, error } = await supabase
    .from("loja_produtos")
    .select("*")
    .eq("slug", slug)
    .eq("publicado", true)
    .maybeSingle();

  if (error) throw error;
  return data as LojaProduto | null;
}

/**
 * Criar produto na loja
 */
export async function criarProdutoLoja(
  payload: LojaProdutoFormData
): Promise<LojaProduto> {
  const { data, error } = await supabase
    .from("loja_produtos")
    .insert({
      ...payload,
      publicado: payload.publicado ?? false,
      ativo: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as LojaProduto;
}

/**
 * Atualizar produto da loja
 */
export async function atualizarProdutoLoja(
  id: string,
  payload: Partial<LojaProdutoFormData>
): Promise<LojaProduto> {
  const { data, error } = await supabase
    .from("loja_produtos")
    .update({
      ...payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as LojaProduto;
}

/**
 * Deletar produto da loja
 */
export async function deletarProdutoLoja(id: string): Promise<void> {
  const { error } = await supabase
    .from("loja_produtos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Publicar/despublicar produto
 */
export async function alterarPublicacaoProduto(
  id: string,
  publicado: boolean
): Promise<LojaProduto> {
  return atualizarProdutoLoja(id, { publicado });
}

/**
 * Marcar/desmarcar como destaque
 */
export async function alterarDestaqueProduto(
  id: string,
  destaque: boolean
): Promise<LojaProduto> {
  return atualizarProdutoLoja(id, { destaque });
}

// ============================================================
// INTEGRAÇÍO COM PRICELIST
// ============================================================

/**
 * Publicar item do pricelist na loja virtual
 */
export async function publicarDoPricelist(
  pricelistItemId: string,
  precoVenda?: number,
  categoriaLoja?: string
): Promise<string> {
  const { data, error } = await supabase.rpc("publicar_produto_na_loja", {
    p_pricelist_item_id: pricelistItemId,
    p_preco_venda: precoVenda,
    p_categoria_loja: categoriaLoja,
  });

  if (error) throw error;
  return data as string;
}

/**
 * Publicar múltiplos itens do pricelist
 */
export async function publicarMultiplosDoPricelist(
  itens: { pricelistItemId: string; precoVenda?: number; categoriaLoja?: string }[]
): Promise<{ sucesso: number; erros: string[] }> {
  const result = { sucesso: 0, erros: [] as string[] };

  for (const item of itens) {
    try {
      await publicarDoPricelist(
        item.pricelistItemId,
        item.precoVenda,
        item.categoriaLoja
      );
      result.sucesso++;
    } catch (error: any) {
      result.erros.push(`${item.pricelistItemId}: ${error.message}`);
    }
  }

  return result;
}

/**
 * Listar produtos importados do Archiproducts
 */
export async function listarProdutosArchiproducts(): Promise<LojaProduto[]> {
  return listarProdutosLoja({
    fonte_importacao: "archiproducts",
    apenas_publicados: false,
    limite: 100,
  });
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

export interface EstatisticasLoja {
  total_produtos: number;
  produtos_publicados: number;
  produtos_destaque: number;
  produtos_promocao: number;
  produtos_archiproducts: number;
  categorias_ativas: number;
}

/**
 * Obter estatísticas da loja
 */
export async function obterEstatisticasLoja(): Promise<EstatisticasLoja> {
  const [produtos, categorias] = await Promise.all([
    supabase.from("loja_produtos").select("publicado, destaque, promocao_ativa, fonte_importacao"),
    supabase.from("loja_categorias").select("id").eq("ativo", true),
  ]);

  const produtosData = produtos.data || [];
  const categoriasData = categorias.data || [];

  return {
    total_produtos: produtosData.length,
    produtos_publicados: produtosData.filter((p: any) => p.publicado).length,
    produtos_destaque: produtosData.filter((p: any) => p.destaque).length,
    produtos_promocao: produtosData.filter((p: any) => p.promocao_ativa).length,
    produtos_archiproducts: produtosData.filter((p: any) => p.fonte_importacao === "archiproducts").length,
    categorias_ativas: categoriasData.length,
  };
}

