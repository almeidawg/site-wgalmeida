// ============================================================
// API: Pricelist (Catálogo de Produtos e Serviços)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  PricelistAmbiente,
  PricelistCategoria,
  PricelistCategoriaFormData,
  PricelistItem,
  PricelistItemCompleto,
  PricelistItemFormData,
  PricelistFiltros,
  PricelistEstatisticas,
  TipoPricelist,
  PricelistSubcategoria,
  PricelistSubcategoriaFormData,
} from "@/types/pricelist";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY;

function normalizarNumero(valor: unknown): number | null {
  if (typeof valor === "number" && !Number.isNaN(valor)) {
    return valor;
  }

  if (typeof valor === "string") {
    const trimmed = valor.trim();
    if (!trimmed) return null;

    const direto = Number(trimmed);
    if (!Number.isNaN(direto)) {
      return direto;
    }

    const sanitizado = Number(
      trimmed.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    );
    if (!Number.isNaN(sanitizado)) {
      return sanitizado;
    }
  }

  return null;
}

function normalizarTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const texto = String(valor).trim();
  return texto.length > 0 ? texto : null;
}

function normalizarCategoriaCompleta(raw: any): PricelistCategoria | undefined {
  if (!raw) return undefined;
  const ambientes =
    Array.isArray(raw.ambientes) && raw.ambientes.length > 0
      ? raw.ambientes
          .map((rel: any) => rel?.ambiente)
          .filter(Boolean)
          .map((amb: any) => ({
            id: amb.id,
            nome: amb.nome,
            descricao: amb.descricao || null,
            ativo: amb.ativo,
            created_at: amb.created_at,
            updated_at: amb.updated_at,
          }))
      : [];
  const guias =
    Array.isArray(raw.guias) && raw.guias.length > 0
      ? raw.guias.map((rel: any) => rel?.guia).filter(Boolean)
      : [];
  return {
    ...raw,
    ambientes,
    guias,
    tags: raw.tags || [],
  } as PricelistCategoria;
}

function normalizarNucleoNome(nucleo: any): string | undefined {
  // Se for objeto do join, extrair nome
  if (nucleo && typeof nucleo === "object" && nucleo.nome) {
    return nucleo.nome.toLowerCase();
  }
  // Se for string direta (legado), usar como está
  if (typeof nucleo === "string") {
    return nucleo.toLowerCase();
  }
  return undefined;
}

function normalizarItemPricelist(raw: any): PricelistItemCompleto {
  const nomeNormalizado =
    normalizarTexto(raw.nome) ||
    normalizarTexto(raw.descricao) ||
    normalizarTexto(raw.titulo) ||
    normalizarTexto(raw.codigo) ||
    "Item sem nome";

  const descricaoNormalizada =
    normalizarTexto(raw.descricao) || normalizarTexto(raw.nome) || null;

  const unidadeNormalizada =
    normalizarTexto(raw.unidade) ||
    normalizarTexto(raw.unidade_medida) ||
    normalizarTexto(raw.unidade_padrao) ||
    normalizarTexto(raw.unit) ||
    "-";

  const precoNormalizado =
    normalizarNumero(raw.preco) ??
    normalizarNumero(raw.preco_base) ??
    normalizarNumero(raw.valor_unitario) ??
    normalizarNumero(raw.preco_unitario) ??
    normalizarNumero(raw.preco_custo) ??
    0;

  // NOVO: Normalizar núcleo para string
  const nucleoNormalizado = normalizarNucleoNome(raw.nucleo);

  return {
    ...raw,
    nome: nomeNormalizado,
    descricao: descricaoNormalizada,
    unidade: unidadeNormalizada,
    preco: precoNormalizado,
    nucleo: nucleoNormalizado,
    categoria: normalizarCategoriaCompleta(raw.categoria) || raw.categoria,
    tags: raw.tags || [],
  } as PricelistItemCompleto;
}

// Re-exportar tipos para compatibilidade com imports existentes
export type {
  PricelistAmbiente,
  PricelistCategoria,
  PricelistCategoriaFormData,
  PricelistItem,
  PricelistItemCompleto,
  PricelistItemFormData,
  PricelistFiltros,
  PricelistEstatisticas,
  TipoPricelist,
  PricelistSubcategoria,
  PricelistSubcategoriaFormData,
};

// ============================================================
// CATEGORIAS
// ============================================================

/**
 * Listar todas as categorias
 */
export async function listarCategorias(): Promise<PricelistCategoria[]> {
  const { data, error } = await supabase
    .from("pricelist_categorias")
    .select(`
      *,
      ambientes:pricelist_categoria_ambientes!categoria_id (
        ambiente:pricelist_ambientes!ambiente_id (
          id,
          nome,
          descricao,
          ativo,
          created_at,
          updated_at
        )
      ),
      guias:pricelist_categoria_guias!categoria_id (
        guia
      )
    `)
    .order("ordem", { ascending: true });

  if (error) throw error;
  const resultados = (data || []).map((raw: any) => normalizarCategoriaCompleta(raw) || raw);
  return resultados as PricelistCategoria[];
}

/**
 * Listar categorias por tipo
 */
export async function listarCategoriasPorTipo(): Promise<PricelistCategoria[]> {
  // funçÍo obsoleta: tipo removido
  return [];
}

/**
 * Buscar categoria por ID
 */
export async function buscarCategoria(
  id: string
): Promise<PricelistCategoria> {
  const { data, error } = await supabase
    .from("pricelist_categorias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as any;
}

export async function listarFluxosPricelist(): Promise<{ id: string; nome: string }[]> {
  const response = await fetch(`${BACKEND_URL}/api/pricelist/flows`);
  if (!response.ok) {
    throw new Error("não foi possível listar os fluxos do pricelist");
  }
  const payload = await response.json();
  return payload?.flows || [];
}

export async function buscarFluxoCategoriaBackend(
  categoriaId: string,
  options?: { nome?: string; codigo?: string }
) {
  const url = new URL(
    `${BACKEND_URL}/api/pricelist/categories/${categoriaId}/flow`
  );
  if (options?.nome) {
    url.searchParams.set("nome", options.nome);
  }
  if (options?.codigo) {
    url.searchParams.set("codigo", options.codigo);
  }

  const response = await fetch(url.toString());
  if (!response.ok) {
    // 404 significa que a categoria não tem fluxo (normal)
    if (response.status === 404) {
      return null; // Retorna null ao invés de lançar erro
    }
    throw new Error(`Falha ao buscar o fluxo da categoria (${response.status})`);
  }
  return response.json();
}

export async function salvarFluxoCategoriaBackend(
  categoriaId: string,
  flowId: string,
  fluxo: Record<string, unknown>
) {
  if (!INTERNAL_API_KEY) {
    throw new Error("VITE_INTERNAL_API_KEY não configurada para salvar fluxos");
  }

  const response = await fetch(
    `${BACKEND_URL}/api/pricelist/categories/${categoriaId}/flow`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({ flowId, fluxo }),
    }
  );

  if (!response.ok) {
    throw new Error("não foi possível salvar o fluxo da categoria");
  }

  return response.json();
}

/**
 * Criar categoria
 */
export async function criarCategoria(
  payload: PricelistCategoriaFormData
): Promise<PricelistCategoria> {
  const { data, error } = await supabase
    .from("pricelist_categorias")
    .insert({
      ...payload,
      tipo_servico: payload.tipo_servico || null,
      guia_principal: payload.guia_principal || null,
      tags: payload.tags || [],
      ordem: payload.ordem ?? 0,
      ativo: payload.ativo ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Atualizar categoria
 */
export async function atualizarCategoria(
  id: string,
  payload: Partial<PricelistCategoriaFormData>
): Promise<PricelistCategoria> {
  const updatePayload: Record<string, unknown> = {
    ...payload,
    tipo_servico: payload.tipo_servico ?? null,
    guia_principal: payload.guia_principal ?? null,
    tags: payload.tags ?? [],
  };

  if ("evf_categoria_codigo" in payload) {
    updatePayload.evf_categoria_codigo = payload.evf_categoria_codigo || null;
  }
  if ("aplicacao_obra" in payload) {
    updatePayload.aplicacao_obra = payload.aplicacao_obra ?? 'ambos';
  }

  const { data, error } = await supabase
    .from("pricelist_categorias")
    .update(updatePayload)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Deletar categoria
 */
export async function deletarCategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from("pricelist_categorias")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Reordenar categorias
 */
export async function reordenarCategorias(
  categorias: { id: string; ordem: number }[]
): Promise<void> {
  for (const cat of categorias) {
    await supabase
      .from("pricelist_categorias")
      .update({ ordem: cat.ordem })
      .eq("id", cat.id);
  }
}

export async function listarAmbientesPricelist(): Promise<PricelistAmbiente[]> {
  const { data, error } = await supabase
    .from("pricelist_ambientes")
    .select("*")
    .order("nome", { ascending: true });
  if (error) throw error;
  return data as any;
}

export async function salvarAmbientesCategoria(
  categoriaId: string,
  ambienteIds: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("pricelist_categoria_ambientes")
    .delete()
    .eq("categoria_id", categoriaId);

  if (deleteError) throw deleteError;

  if (!ambienteIds || ambienteIds.length === 0) return;

  const payload = ambienteIds.map((ambienteId) => ({
    categoria_id: categoriaId,
    ambiente_id: ambienteId,
  }));

  const { error: insertError } = await supabase
    .from("pricelist_categoria_ambientes")
    .insert(payload);

  if (insertError) throw insertError;
}

export async function salvarGuiasCategoria(
  categoriaId: string,
  guias: string[]
): Promise<void> {
  const { error: deleteError } = await supabase
    .from("pricelist_categoria_guias")
    .delete()
    .eq("categoria_id", categoriaId);

  if (deleteError) throw deleteError;

  if (!guias || guias.length === 0) return;

  const payload = guias.map((guia) => ({
    categoria_id: categoriaId,
    guia,
  }));

  const { error: insertError } = await supabase
    .from("pricelist_categoria_guias")
    .insert(payload);

  if (insertError) throw insertError;
}

// ============================================================
// ITENS
// ============================================================

/**
 * Listar todos os itens
 */
export async function listarItens(): Promise<PricelistItemCompleto[]> {
  const SELECT_ITENS = `
      *,
      categoria:pricelist_categorias!categoria_id (
        id,
        nome,
        tipo,
        tipo_servico,
        guia_principal,
        tags,
        evf_categoria_codigo,
        ambientes:pricelist_categoria_ambientes!categoria_id (
          ambiente:pricelist_ambientes!ambiente_id (
            id,
            nome,
            descricao,
            ativo,
            created_at,
            updated_at
          )
        ),
        guias:pricelist_categoria_guias!categoria_id (
          guia
        )
      ),
          subcategoria:pricelist_subcategorias!subcategoria_id (
        id,
        nome,
        tipo,
        ordem
      ),
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        telefone,
        email
      ),
      nucleo:nucleos!nucleo_id (
        id,
        nome,
        cor
      )
    `;

  // PaginaçÍo automática (contorna limite 1000 rows Supabase)
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("pricelist_itens")
      .select(SELECT_ITENS)
      .order("codigo", { ascending: true, nullsFirst: false })
      .range(from, to);

    if (error) throw error;
    const rows = data ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return allData.map(normalizarItemPricelist) ?? [];
}

/**
 * Listar itens com filtros
 */
export async function listarItensComFiltros(
  filtros: PricelistFiltros
): Promise<PricelistItemCompleto[]> {
  let query = supabase.from("pricelist_itens").select(
    `
      *,
      categoria:pricelist_categorias!categoria_id (
        id,
        nome,
        tipo,
        tipo_servico,
        guia_principal,
        tags,
        evf_categoria_codigo,
        ambientes:pricelist_categoria_ambientes!categoria_id (
          ambiente:pricelist_ambientes!ambiente_id (
            id,
            nome,
            descricao,
            ativo,
            created_at,
            updated_at
          )
        ),
        guias:pricelist_categoria_guias!categoria_id (
          guia
        )
      ),
      subcategoria:pricelist_subcategorias!subcategoria_id (
        id,
        nome,
        tipo,
        ordem
      ),
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        telefone,
        email
      ),
      nucleo:nucleos!nucleo_id (
        id,
        nome,
        cor
      )
    `
  );

  // tipo removido dos filtros

  if (filtros.categoria_id) {
    query = query.eq("categoria_id", filtros.categoria_id);
  }

  if (filtros.subcategoria_id) {
    query = query.eq("subcategoria_id", filtros.subcategoria_id);
  }

  // Filtro por núcleo
  if (filtros.nucleo_id) {
    query = query.eq("nucleo_id", filtros.nucleo_id);
  }

  if (filtros.fornecedor_id) {
    query = query.eq("fornecedor_id", filtros.fornecedor_id);
  }

  if (filtros.apenas_ativos) {
    query = query.eq("ativo", true);
  }

  if (filtros.busca) {
    // Busca flexível: divide em palavras e busca cada uma
    // Stopwords em português para ignorar
    const stopwords = new Set([
      "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos",
      "um", "uma", "uns", "umas", "o", "a", "os", "as", "e", "ou",
      "para", "por", "com", "sem", "que", "se", "ao", "aos", "à", "às",
      "pelo", "pela", "pelos", "pelas", "este", "esta", "esse", "essa",
      "aquele", "aquela", "isto", "isso", "aquilo"
    ]);

    // Limpar e dividir em palavras (preservando acentos para match correto)
    const limpar = (txt: string) => txt
      .toLowerCase()
      .replaceAll(/[,().\-\/\\]/g, " ")
      .replaceAll(/\s+/g, " ")
      .trim();

    const removerAcentos = (txt: string) =>
      txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    const textoLimpo = limpar(filtros.busca);
    const palavrasComAcento = textoLimpo
      .split(" ")
      .filter(p => p.length >= 3 && !stopwords.has(removerAcentos(p)));

    if (palavrasComAcento.length > 0) {
      // Buscar com acento E sem acento para cobrir ambos os casos
      // Ex: "demoliçÍo" → busca "%demoliçÍo%" e "%demolicao%"
      const condicoes = palavrasComAcento.flatMap(palavra => {
        const semAcento = removerAcentos(palavra);
        const termos = [palavra];
        if (semAcento !== palavra) termos.push(semAcento);
        return termos.flatMap(t => [
          `nome.ilike.%${t}%`,
          `codigo.ilike.%${t}%`,
          `descricao.ilike.%${t}%`
        ]);
      });

      query = query.or(condicoes.join(","));
    } else if (filtros.busca.trim().length > 0) {
      // Se não sobrou palavras válidas, usar termo original + sem acento
      const buscaOriginal = limpar(filtros.busca);
      const buscaSemAcento = removerAcentos(buscaOriginal);
      const termos = [buscaOriginal];
      if (buscaSemAcento !== buscaOriginal) termos.push(buscaSemAcento);
      const condicoes = termos.flatMap(t => [
        `codigo.ilike.%${t}%`,
        `nome.ilike.%${t}%`,
        `descricao.ilike.%${t}%`
      ]);
      query = query.or(condicoes.join(","));
    }
  }

  if (filtros.preco_min !== undefined) {
    query = query.gte("preco", filtros.preco_min);
  }

  if (filtros.preco_max !== undefined) {
    query = query.lte("preco", filtros.preco_max);
  }

  if (filtros.estoque_baixo) {
    query = query.eq("controla_estoque", true);
  }

  query = query.order("nome", { ascending: true });

  // Limitar resultados para performance (padrÍo 50)
  const limite = filtros.limite || 50;
  query = query.limit(limite);

  const { data, error } = await query;

  if (error) throw error;

  let itens = data as any;

  // Filtrar estoque baixo em memória (condiçÍo complexa)
  if (filtros.estoque_baixo) {
    itens = itens.filter(
      (item: any) =>
        item.estoque_atual !== null &&
        item.estoque_minimo !== null &&
        item.estoque_atual < item.estoque_minimo
    );
  }

  return itens.map(normalizarItemPricelist);
}

/**
 * Buscar item por ID
 */
export async function buscarItem(id: string): Promise<PricelistItemCompleto> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .select(
      `
      *,
      categoria:pricelist_categorias!categoria_id (
        id,
        nome,
        tipo_servico,
        guia_principal,
        tags,
        ambientes:pricelist_categoria_ambientes!categoria_id (
          ambiente:pricelist_ambientes!ambiente_id (
            id,
            nome,
            descricao,
            ativo,
            created_at,
            updated_at
          )
        ),
        guias:pricelist_categoria_guias!categoria_id (
          guia
        )
      ),
      subcategoria:pricelist_subcategorias!subcategoria_id (
        id,
        nome,
        ordem
      ),
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        telefone,
        email
      ),
      nucleo:nucleos!nucleo_id (
        id,
        nome,
        cor
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;
  return normalizarItemPricelist(data);
}

/**
 * Buscar item por código
 */
export async function buscarItemPorCodigo(
  codigo: string
): Promise<PricelistItemCompleto | null> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .select(
      `
      *,
      categoria:pricelist_categorias!categoria_id (
        id,
        nome,
        tipo_servico,
        guia_principal,
        tags,
        ambientes:pricelist_categoria_ambientes!categoria_id (
          ambiente:pricelist_ambientes!ambiente_id (
            id,
            nome,
            descricao,
            ativo,
            created_at,
            updated_at
          )
        ),
        guias:pricelist_categoria_guias!categoria_id (
          guia
        )
      ),
      subcategoria:pricelist_subcategorias!subcategoria_id (
        id,
        nome,
        ordem
      ),
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        telefone,
        email
      ),
      nucleo:nucleos!nucleo_id (
        id,
        nome,
        cor
      )
    `
    )
    .eq("codigo", codigo)
    .single();

  if (error && error.code !== "PGRST116") throw error; // PGRST116 = not found
  return data ? normalizarItemPricelist(data) : null;
}

/**
 * Criar item
 */
export async function criarItem(
  payload: PricelistItemFormData
): Promise<PricelistItem> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .insert({
      ...payload,
      subcategoria_id: payload.subcategoria_id ?? null,
      ativo: payload.ativo ?? true,
      controla_estoque: payload.controla_estoque ?? false,
      // tipo removido
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Atualizar item
 */
export async function atualizarItem(
  id: string,
  payload: Partial<PricelistItemFormData>
): Promise<PricelistItem> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .update({
      ...payload,
      subcategoria_id: payload.subcategoria_id ?? null,
      // tipo removido
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Deletar item
 */
export async function deletarItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("pricelist_itens")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Atualizar estoque
 */
export async function atualizarEstoque(
  id: string,
  quantidade: number,
  operacao: "adicionar" | "remover" | "definir"
): Promise<PricelistItem> {
  const { data: itemAtual } = await supabase
    .from("pricelist_itens")
    .select("estoque_atual")
    .eq("id", id)
    .single();

  let novoEstoque: number;

  if (operacao === "definir") {
    novoEstoque = quantidade;
  } else if (operacao === "adicionar") {
    novoEstoque = (itemAtual?.estoque_atual || 0) + quantidade;
  } else {
    // remover
    novoEstoque = (itemAtual?.estoque_atual || 0) - quantidade;
  }

  // não permitir estoque negativo
  if (novoEstoque < 0) {
    novoEstoque = 0;
  }

  const { data, error } = await supabase
    .from("pricelist_itens")
    .update({ estoque_atual: novoEstoque })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Listar itens com estoque baixo
 */
export async function listarItensEstoqueBaixo(): Promise<
  PricelistItemCompleto[]
> {
  const { data, error } = await supabase
    .from("pricelist_itens")
    .select(
      `
      *,
      categoria:pricelist_categorias!categoria_id (
        id,
        nome,
        tipo,
        tipo_servico,
        guia_principal,
        tags,
        evf_categoria_codigo,
        ambientes:pricelist_categoria_ambientes!categoria_id (
          ambiente:pricelist_ambientes!ambiente_id (
            id,
            nome,
            descricao,
            ativo,
            created_at,
            updated_at
          )
        ),
        guias:pricelist_categoria_guias!categoria_id (
          guia
        )
      ),
      subcategoria:pricelist_subcategorias!subcategoria_id (
        id,
        nome,
        tipo,
        ordem
      ),
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        telefone,
        email
      ),
      nucleo:nucleos!nucleo_id (
        id,
        nome,
        cor
      )
    `
    )
    .eq("controla_estoque", true)
    .eq("ativo", true);

  if (error) throw error;

  // Filtrar em memória itens com estoque abaixo do mínimo
  const itens = (data as any).filter(
    (item: any) =>
      item.estoque_atual !== null &&
      item.estoque_minimo !== null &&
      item.estoque_atual < item.estoque_minimo
  );

  return itens.map(normalizarItemPricelist);
}


// ============================================================
// SUBCATEGORIAS
// ============================================================

export async function listarSubcategorias(): Promise<PricelistSubcategoria[]> {
  const { data, error } = await supabase
    .from("pricelist_subcategorias")
    .select("*")
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data as PricelistSubcategoria[];
}

export async function listarSubcategoriasPorCategoria(categoriaId: string): Promise<PricelistSubcategoria[]> {
  const { data, error } = await supabase
    .from("pricelist_subcategorias")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("ordem", { ascending: true });
  if (error) throw error;
  return data as PricelistSubcategoria[];
}

export async function criarSubcategoria(payload: PricelistSubcategoriaFormData): Promise<PricelistSubcategoria> {
  const { data, error } = await supabase
    .from("pricelist_subcategorias")
    .insert({
      ...payload,
      ordem: payload.ordem ?? 0,
      ativo: payload.ativo ?? true,
    })
    .select()
    .single();
  if (error) throw error;
  return data as PricelistSubcategoria;
}

export async function atualizarSubcategoria(id: string, payload: Partial<PricelistSubcategoriaFormData>): Promise<PricelistSubcategoria> {
  const { data, error } = await supabase
    .from("pricelist_subcategorias")
    .update({
      ...payload,
    })
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as PricelistSubcategoria;
}

export async function deletarSubcategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from("pricelist_subcategorias")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas do pricelist
 */
export async function obterEstatisticasPricelist(): Promise<PricelistEstatisticas> {
  const { data: itens, error: itensError } = await supabase
    .from("pricelist_itens")
    .select("tipo, preco, categoria_id, controla_estoque, estoque_atual, estoque_minimo");

  if (itensError) throw itensError;

  const { data: categorias, error: categoriasError } = await supabase
    .from("pricelist_categorias")
    .select("id");

  if (categoriasError) throw categoriasError;

  const itensMaoObra = itens.filter((i: any) => i.tipo === "mao_obra");
  const itensMateriais = itens.filter((i: any) => i.tipo === "material");

  const itensEstoqueBaixo = itens.filter(
    (i: any) =>
      i.controla_estoque &&
      i.estoque_atual !== null &&
      i.estoque_minimo !== null &&
      i.estoque_atual < i.estoque_minimo
  );

  const somaPrecosMaoObra = itensMaoObra.reduce(
    (acc: number, item: any) => acc + (item.preco || 0),
    0
  );

  const somaPrecosMateriais = itensMateriais.reduce(
    (acc: number, item: any) => acc + (item.preco || 0),
    0
  );

  const stats: PricelistEstatisticas = {
    total_itens: itens.length,
    total_mao_obra: itensMaoObra.length,
    total_materiais: itensMateriais.length,
    total_categorias: categorias.length,
    itens_estoque_baixo: itensEstoqueBaixo.length,
    valor_medio_mao_obra:
      itensMaoObra.length > 0 ? somaPrecosMaoObra / itensMaoObra.length : 0,
    valor_medio_material:
      itensMateriais.length > 0 ? somaPrecosMateriais / itensMateriais.length : 0,
  };

  return stats;
}

/**
 * Gerar código automático para novo item
 */
export async function gerarCodigoItem(
  tipo: TipoPricelist,
  categoriaCodigo?: string | null
): Promise<string> {
  const prefixoBase = categoriaCodigo?.trim()
    ? categoriaCodigo.trim().toUpperCase()
    : (() => {
        if (tipo === "mao_obra") return "MO";
        if (tipo === "servico") return "SRV";
        if (tipo === "produto") return "PRD";
        return "MAT";
      })();

  const likePrefix = `${prefixoBase}-%`;

  const { data, error } = await supabase
    .from("pricelist_itens")
    .select("codigo")
    .ilike("codigo", likePrefix)
    .order("codigo", { ascending: false })
    .limit(1);

  if (error) throw error;

  let proximoNumero = 1;
  let padLength = 3; // padrao mais curto para codigos compactos

  if (data && data.length > 0 && data[0].codigo) {
    const ultimoCodigo = data[0].codigo;
    const numeroMatch = ultimoCodigo.match(/(\d+)(?!.*\d)/);
    if (numeroMatch) {
      proximoNumero = parseInt(numeroMatch[1], 10) + 1;
      padLength = numeroMatch[1].length || padLength;
    }
  }

  return `${prefixoBase}-${proximoNumero.toString().padStart(padLength, "0")}`;
}

/**
 * Importar itens em lote
 */
export async function importarItens(
  itens: PricelistItemFormData[]
): Promise<{ sucesso: number; erros: number }> {
  let sucesso = 0;
  let erros = 0;

  for (const item of itens) {
    try {
      // Gerar código automaticamente se não fornecido
      if (!item.codigo) {
        item.codigo = await gerarCodigoItem(item.tipo || "material");
      }

      // Validar nome obrigatório
      if (!item.nome || item.nome.trim() === "") {
        console.error("Item sem nome não pode ser importado");
        erros++;
        continue;
      }

      await criarItem(item);
      sucesso++;
    } catch (error) {
      console.error("Erro ao importar item:", error);
      erros++;
    }
  }

  return { sucesso, erros };
}

/**
 * Duplicar item
 */
export async function duplicarItem(id: string): Promise<PricelistItem> {
  const itemOriginal = await buscarItem(id);

  // Gerar novo código
  const novoCodigo = itemOriginal.codigo
    ? `${itemOriginal.codigo}-COPIA`
    : undefined;

  const novoItem = await criarItem({
    categoria_id: itemOriginal.categoria_id || undefined,
    codigo: novoCodigo,
    nome: `${itemOriginal.nome} (Cópia)`,
    descricao: itemOriginal.descricao || undefined,
    tipo: itemOriginal.tipo || "material",
    unidade: itemOriginal.unidade,
    preco: itemOriginal.preco,
    fornecedor_id: itemOriginal.fornecedor_id || undefined,
    marca: itemOriginal.marca || undefined,
    especificacoes: itemOriginal.especificacoes || undefined,
    imagem_url: itemOriginal.imagem_url || undefined,
    controla_estoque: itemOriginal.controla_estoque,
    estoque_minimo: itemOriginal.estoque_minimo || undefined,
    estoque_atual: 0, // Resetar estoque na cópia
    ativo: true,
  });

  return novoItem;
}
// ============================================================
// EVF MAPPING
// ============================================================

/**
 * Auto-mapear categorias pricelist → EVF por nome normalizado
 * Chama a RPC que faz UPDATE apenas nas categorias sem mapeamento
 */
export async function autoMapearCategoriasEVF(): Promise<{
  mapeadas: number;
  total: number;
}> {
  const { data, error } = await supabase.rpc("auto_mapear_categorias_evf");

  if (error) throw error;

  const linhas = Array.isArray(data) ? data : [];
  return {
    mapeadas: linhas.filter((row: any) => Boolean(row?.mapeada)).length,
    total: linhas.length,
  };
}

/**
 * Atualizar mapeamento EVF de uma categoria específica (inline edit)
 */
export async function atualizarEvfCategoriaMapping(
  categoriaId: string,
  evfCategoriaCodigo: string | null
): Promise<void> {
  const { error } = await supabase
    .from("pricelist_categorias")
    .update({ evf_categoria_codigo: evfCategoriaCodigo })
    .eq("id", categoriaId);

  if (error) throw error;
}

// ============================================================
// HISTÓRICO DE ITENS
// ============================================================

/**
 * Busca histórico de alterações de um item
 */
export async function buscarHistoricoItem(
  itemId: string,
  limite: number = 50
): Promise<import("@/types/pricelist").PricelistItemHistorico[]> {
  const { data, error } = await supabase
    .from("pricelist_itens_historico")
    .select("*")
    .eq("item_id", itemId)
    .order("versao", { ascending: false })
    .limit(limite);

  if (error) {
    console.warn("[Pricelist] Erro ao buscar histórico:", error.message);
    return [];
  }

  return (data || []) as import("@/types/pricelist").PricelistItemHistorico[];
}

// ============================================================
// VALIDAÇÍO DE ITENS
// ============================================================

/**
 * Valida um item específico (executa todas as regras no banco)
 */
export async function validarItemPricelist(
  itemId: string
): Promise<import("@/types/pricelist").PricelistValidacao[]> {
  const { data, error } = await supabase.rpc("validar_item_pricelist", {
    p_item_id: itemId,
  });

  if (error) {
    console.warn("[Pricelist] Erro ao validar item:", error.message);
    return [];
  }

  return (data || []) as import("@/types/pricelist").PricelistValidacao[];
}

/**
 * Valida todos os itens ativos da pricelist
 */
export async function validarPricelistCompleta(): Promise<
  import("@/types/pricelist").ResultadoValidacaoCompleta
> {
  const { data, error } = await supabase.rpc("validar_pricelist_completa");

  if (error) {
    console.warn("[Pricelist] Erro na validaçÍo completa:", error.message);
    return { total_itens: 0, total_problemas: 0, bloqueantes: 0, alertas: 0 };
  }

  const resultado = Array.isArray(data) ? data[0] : data;
  return (resultado || {
    total_itens: 0,
    total_problemas: 0,
    bloqueantes: 0,
    alertas: 0,
  }) as import("@/types/pricelist").ResultadoValidacaoCompleta;
}

/**
 * Busca problemas pendentes (view vw_pricelist_problemas)
 */
export async function buscarProblemasPricelist(): Promise<
  import("@/types/pricelist").PricelistProblema[]
> {
  const { data, error } = await supabase
    .from("vw_pricelist_problemas")
    .select("*")
    .limit(500);

  if (error) {
    console.warn("[Pricelist] Erro ao buscar problemas:", error.message);
    return [];
  }

  return (data || []) as import("@/types/pricelist").PricelistProblema[];
}

/**
 * Resolve uma validaçÍo manualmente
 */
export async function resolverValidacao(validacaoId: string): Promise<void> {
  const { error } = await supabase
    .from("pricelist_validacoes_log")
    .update({ resolvido: true, resolvido_em: new Date().toISOString() })
    .eq("id", validacaoId);

  if (error) throw new Error(`Erro ao resolver validaçÍo: ${error.message}`);
}

// ============================================================
// SAÚDE DA PRICELIST
// ============================================================

/**
 * Busca indicadores de saúde da pricelist
 */
export async function buscarSaudePricelist(): Promise<
  import("@/types/pricelist").PricelistSaude
> {
  const { data, error } = await supabase
    .from("vw_pricelist_saude")
    .select("*")
    .single();

  if (error) {
    console.warn("[Pricelist] Erro ao buscar saúde:", error.message);
    return {
      total_itens: 0,
      ativos: 0,
      inativos: 0,
      sem_preco: 0,
      sem_categoria: 0,
      margem_negativa: 0,
      estoque_baixo: 0,
      pct_saudavel: null,
      ultima_publicacao: null,
      ultima_publicacao_em: null,
    };
  }

  return data as import("@/types/pricelist").PricelistSaude;
}

// ============================================================
// PUBLICAÇÕES VERSIONADAS
// ============================================================

/**
 * Lista todas as publicações
 */
export async function listarPublicacoes(): Promise<
  import("@/types/pricelist").PricelistPublicacao[]
> {
  const { data, error } = await supabase
    .from("pricelist_publicacoes")
    .select("*")
    .order("publicado_em", { ascending: false });

  if (error) {
    console.warn("[Pricelist] Erro ao listar publicações:", error.message);
    return [];
  }

  return (data || []) as import("@/types/pricelist").PricelistPublicacao[];
}

/**
 * Publica uma versÍo da pricelist (com validaçÍo bloqueante)
 */
export async function publicarPricelist(
  label: string,
  notas?: string
): Promise<string> {
  const { data, error } = await supabase.rpc("publicar_pricelist", {
    p_label: label,
    p_notas: notas || null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}

// ============================================================
// LOG DE IMPORTAÇÕES
// ============================================================

/**
 * Registra uma importaçÍo no log
 */
export async function registrarImportacao(log: {
  fonte: import("@/types/pricelist").FonteImportacao;
  nome_arquivo?: string;
  total_linhas: number;
  importados: number;
  erros: number;
  itens_ids?: string[];
  detalhes_erros?: Array<{ linha?: number; campo?: string; mensagem: string }>;
}): Promise<string> {
  const { data, error } = await supabase
    .from("pricelist_import_log")
    .insert({
      fonte: log.fonte,
      nome_arquivo: log.nome_arquivo || null,
      total_linhas: log.total_linhas,
      importados: log.importados,
      erros: log.erros,
      itens_ids: log.itens_ids || null,
      detalhes_erros: log.detalhes_erros || null,
    })
    .select("id")
    .single();

  if (error) {
    console.warn("[Pricelist] Erro ao registrar importaçÍo:", error.message);
    return "";
  }

  return data?.id || "";
}

/**
 * Lista log de importações recentes
 */
export async function listarImportacoes(
  limite: number = 20
): Promise<import("@/types/pricelist").PricelistImportLog[]> {
  const { data, error } = await supabase
    .from("pricelist_import_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (error) {
    console.warn("[Pricelist] Erro ao listar importações:", error.message);
    return [];
  }

  return (data || []) as import("@/types/pricelist").PricelistImportLog[];
}

/* eslint-disable no-useless-escape */


