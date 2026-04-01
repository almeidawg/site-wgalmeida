// ============================================================
// API: Blog
// Sistema WG Easy - Grupo WG Almeida
// Data: 2026-01-11
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export type BlogPostStatus = "rascunho" | "publicado" | "arquivado";

export interface BlogPost {
  id: string;
  titulo: string;
  slug: string;
  resumo: string | null;
  conteudo: string | null;
  imagem_destaque: string | null;
  categoria: string;
  tags: string[];
  fonte: string | null;
  link_original: string | null;
  autor_id: string | null;
  status: BlogPostStatus;
  meta_title: string | null;
  meta_description: string | null;
  visualizacoes: number;
  publicado_em: string | null;
  created_at: string;
  updated_at: string;
}

export interface BlogCategoria {
  id: string;
  nome: string;
  slug: string | null;
  descricao: string | null;
  cor: string;
  icone: string | null;
  ordem: number;
  ativo: boolean;
}

export interface BlogPostFormData {
  titulo: string;
  resumo?: string;
  conteudo?: string;
  imagem_destaque?: string;
  categoria?: string;
  tags?: string[];
  fonte?: string;
  link_original?: string;
  autor_id?: string;
  status?: BlogPostStatus;
  meta_title?: string;
  meta_description?: string;
}

export interface BlogFiltros {
  categoria?: string;
  status?: BlogPostStatus;
  busca?: string;
  fonte?: string;
  limite?: number;
  offset?: number;
}

// ============================================================
// CATEGORIAS
// ============================================================

/**
 * Listar categorias do blog
 */
export async function listarCategoriasBlog(): Promise<BlogCategoria[]> {
  const { data, error } = await supabase
    .from("blog_categorias")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as BlogCategoria[];
}

// ============================================================
// POSTS
// ============================================================

/**
 * Listar posts do blog
 */
export async function listarPostsBlog(filtros?: BlogFiltros): Promise<BlogPost[]> {
  let query = supabase.from("blog_posts").select("*");

  // Por padrÍo, apenas publicados (a menos que especificado)
  if (!filtros?.status) {
    query = query.eq("status", "publicado");
  } else {
    query = query.eq("status", filtros.status);
  }

  if (filtros?.categoria) {
    query = query.eq("categoria", filtros.categoria);
  }

  if (filtros?.fonte) {
    query = query.eq("fonte", filtros.fonte);
  }

  if (filtros?.busca) {
    query = query.or(
      `titulo.ilike.%${filtros.busca}%,resumo.ilike.%${filtros.busca}%`
    );
  }

  // OrdenaçÍo e paginaçÍo
  query = query
    .order("publicado_em", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (filtros?.offset) {
    query = query.range(filtros.offset, filtros.offset + (filtros.limite || 20) - 1);
  } else {
    query = query.limit(filtros?.limite || 20);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as BlogPost[];
}

/**
 * Buscar post por ID
 */
export async function buscarPostBlog(id: string): Promise<BlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as BlogPost;
}

/**
 * Buscar post por slug
 */
export async function buscarPostPorSlug(slug: string): Promise<BlogPost | null> {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) throw error;
  return data as BlogPost | null;
}

/**
 * Criar post
 */
export async function criarPostBlog(payload: BlogPostFormData): Promise<BlogPost> {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      ...payload,
      status: payload.status || "rascunho",
      categoria: payload.categoria || "Design",
      tags: payload.tags || [],
    })
    .select()
    .single();

  if (error) throw error;
  return data as BlogPost;
}

/**
 * Atualizar post
 */
export async function atualizarPostBlog(
  id: string,
  payload: Partial<BlogPostFormData>
): Promise<BlogPost> {
  const updateData: any = {
    ...payload,
    updated_at: new Date().toISOString(),
  };

  // Se estiver publicando, definir data de publicaçÍo
  if (payload.status === "publicado") {
    const { data: postAtual } = await supabase
      .from("blog_posts")
      .select("publicado_em")
      .eq("id", id)
      .single();

    if (!postAtual?.publicado_em) {
      updateData.publicado_em = new Date().toISOString();
    }
  }

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as BlogPost;
}

/**
 * Deletar post
 */
export async function deletarPostBlog(id: string): Promise<void> {
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Publicar post
 */
export async function publicarPostBlog(id: string): Promise<BlogPost> {
  return atualizarPostBlog(id, { status: "publicado" });
}

/**
 * Arquivar post
 */
export async function arquivarPostBlog(id: string): Promise<BlogPost> {
  return atualizarPostBlog(id, { status: "arquivado" });
}

/**
 * Incrementar visualizações
 */
export async function incrementarVisualizacoes(id: string): Promise<void> {
  const { error } = await supabase.rpc("incrementar_visualizacoes_post", {
    p_post_id: id,
  });

  // Ignora erro silenciosamente se a funçÍo não existir
  if (error && !error.message.includes("does not exist")) {
    console.warn("[Blog] Erro ao incrementar visualizações:", error);
  }
}

// ============================================================
// IMPORTAÇÍO DE ARCHIPRODUCTS NEWS
// ============================================================

/**
 * Listar posts importados do Archiproducts
 */
export async function listarPostsArchiproducts(): Promise<BlogPost[]> {
  return listarPostsBlog({
    fonte: "Archiproducts",
    status: "rascunho", // Posts importados começam como rascunho
    limite: 100,
  });
}

/**
 * Importar notícia do Archiproducts como post
 */
export async function importarNoticiaArchiproducts(noticia: {
  titulo: string;
  resumo: string;
  imagem_destaque: string;
  link_original: string;
  categoria: string;
  tags: string[];
}): Promise<BlogPost> {
  // Verificar se já existe
  const { data: existente } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("link_original", noticia.link_original)
    .maybeSingle();

  if (existente) {
    throw new Error("Post já importado");
  }

  return criarPostBlog({
    titulo: noticia.titulo,
    resumo: noticia.resumo,
    imagem_destaque: noticia.imagem_destaque,
    link_original: noticia.link_original,
    fonte: "Archiproducts",
    categoria: noticia.categoria,
    tags: noticia.tags,
    status: "rascunho", // Requer revisÍo
  });
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

export interface EstatisticasBlog {
  total_posts: number;
  posts_publicados: number;
  posts_rascunho: number;
  posts_archiproducts: number;
  categorias_usadas: number;
  total_visualizacoes: number;
}

/**
 * Obter estatísticas do blog
 */
export async function obterEstatisticasBlog(): Promise<EstatisticasBlog> {
  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("status, fonte, visualizacoes, categoria");

  if (error) throw error;

  const postsData = posts || [];

  return {
    total_posts: postsData.length,
    posts_publicados: postsData.filter((p) => p.status === "publicado").length,
    posts_rascunho: postsData.filter((p) => p.status === "rascunho").length,
    posts_archiproducts: postsData.filter((p) => p.fonte === "Archiproducts").length,
    categorias_usadas: new Set(postsData.map((p) => p.categoria)).size,
    total_visualizacoes: postsData.reduce((acc, p) => acc + (p.visualizacoes || 0), 0),
  };
}


