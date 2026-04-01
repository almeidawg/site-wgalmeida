// ============================================================
// API: Memorial de Acabamentos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  MemorialAcabamento,
  MemorialAcabamentoCompleto,
  MemorialAcabamentoFormData,
  MemorialFiltros,
  MemorialResumoAmbiente,
  AmbienteTemplate,
  AmbienteMemorial,
  CategoriaMemorial,
} from "@/types/memorial";

// Re-exportar tipos
export type {
  MemorialAcabamento,
  MemorialAcabamentoCompleto,
  MemorialAcabamentoFormData,
  MemorialFiltros,
  MemorialResumoAmbiente,
  AmbienteTemplate,
};

// ============================================================
// TEMPLATES DE AMBIENTES
// ============================================================

/**
 * Listar todos os templates de ambientes
 */
export async function listarAmbientesTemplates(): Promise<AmbienteTemplate[]> {
  const { data, error } = await supabase
    .from("ambientes_templates")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as AmbienteTemplate[];
}

/**
 * Buscar template por nome
 */
export async function buscarTemplateAmbiente(
  nome: string
): Promise<AmbienteTemplate | null> {
  const { data, error } = await supabase
    .from("ambientes_templates")
    .select("*")
    .eq("nome", nome)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as AmbienteTemplate | null;
}

// ============================================================
// MEMORIAL DE ACABAMENTOS
// ============================================================

const SELECT_PRICELIST_ITEM_FIELDS =
  "id,codigo,nome,descricao,preco,custo_aquisicao,fabricante,modelo,codigo_fabricante,unidade,imagem_url,categoria_id,subcategoria_id";

const SELECT_MEMORIAL_COM_PRICELIST = `
  *,
  pricelist_item:pricelist_itens!pricelist_item_id (
    ${SELECT_PRICELIST_ITEM_FIELDS}
  )
`;

async function anexarPricelistItems(rows: any[]): Promise<any[]> {
  const map: Record<string, any> = {};
  for (const r of rows || []) {
    if (r?.pricelist_item?.id) map[r.pricelist_item.id] = r.pricelist_item;
  }

  const ids = [...new Set((rows || []).map((r: any) => r.pricelist_item_id).filter(Boolean))];
  const idsParaBuscar = ids.filter((id: string) => !map[id]);

  if (idsParaBuscar.length > 0) {
    const { data, error } = await supabase
      .from("pricelist_itens")
      .select(SELECT_PRICELIST_ITEM_FIELDS)
      .in("id", idsParaBuscar);

    if (error) throw error;
    for (const pl of (data || []) as any[]) {
      if (pl?.id) map[pl.id] = pl;
    }
  }

  return (rows || []).map((r: any) => ({
    ...r,
    pricelist_item: r.pricelist_item || (r.pricelist_item_id ? map[r.pricelist_item_id] : null),
  }));
}

/**
 * Listar todos os itens de um memorial de projeto
 */
export async function listarMemorialProjeto(
  projetoId: string
): Promise<MemorialAcabamentoCompleto[]> {
  const { data: dataJoin, error: errorJoin } = await supabase
    .from("memorial_acabamentos")
    .select(SELECT_MEMORIAL_COM_PRICELIST)
    .eq("projeto_id", projetoId)
    .order("ambiente", { ascending: true })
    .order("categoria", { ascending: true })
    .order("ordem", { ascending: true });

  let data = dataJoin as any[] | null;
  if (errorJoin && (errorJoin as any)?.code === "PGRST200") {
    const { data: dataSemJoin, error: errorSemJoin } = await supabase
      .from("memorial_acabamentos")
      .select("*")
      .eq("projeto_id", projetoId)
      .order("ambiente", { ascending: true })
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });

    if (errorSemJoin) throw errorSemJoin;
    data = dataSemJoin as any[] | null;
  } else if (errorJoin) {
    throw errorJoin;
  }

  const dataComPricelist = await anexarPricelistItems((data || []) as any[]);

  // Enriquecer dados
  return (dataComPricelist || []).map((item: any) => ({
    ...item,
    fabricante_display:
      item.pricelist_item?.fabricante || item.fabricante || null,
    modelo_display: item.pricelist_item?.modelo || item.modelo || null,
    codigo_display:
      item.pricelist_item?.codigo_fabricante || item.codigo_fabricante || null,
    preco_display:
      item.preco_unitario || item.pricelist_item?.preco || 0,
  })) as MemorialAcabamentoCompleto[];
}

/**
 * Listar itens por ambiente
 */
export async function listarMemorialPorAmbiente(
  projetoId: string,
  ambiente: AmbienteMemorial
): Promise<MemorialAcabamentoCompleto[]> {
  const { data: dataJoin, error: errorJoin } = await supabase
    .from("memorial_acabamentos")
    .select(SELECT_MEMORIAL_COM_PRICELIST)
    .eq("projeto_id", projetoId)
    .eq("ambiente", ambiente)
    .order("categoria", { ascending: true })
    .order("ordem", { ascending: true });

  let data = dataJoin as any[] | null;
  if (errorJoin && (errorJoin as any)?.code === "PGRST200") {
    const { data: dataSemJoin, error: errorSemJoin } = await supabase
      .from("memorial_acabamentos")
      .select("*")
      .eq("projeto_id", projetoId)
      .eq("ambiente", ambiente)
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });

    if (errorSemJoin) throw errorSemJoin;
    data = dataSemJoin as any[] | null;
  } else if (errorJoin) {
    throw errorJoin;
  }

  const dataComPricelist = await anexarPricelistItems((data || []) as any[]);

  return (dataComPricelist || []).map((item: any) => ({
    ...item,
    fabricante_display:
      item.pricelist_item?.fabricante || item.fabricante || null,
    modelo_display: item.pricelist_item?.modelo || item.modelo || null,
    codigo_display:
      item.pricelist_item?.codigo_fabricante || item.codigo_fabricante || null,
    preco_display:
      item.preco_unitario || item.pricelist_item?.preco || 0,
  })) as MemorialAcabamentoCompleto[];
}

/**
 * Listar itens com filtros
 */
export async function listarMemorialComFiltros(
  filtros: MemorialFiltros
): Promise<MemorialAcabamentoCompleto[]> {
  const aplicarFiltros = (q: any) => {
    if (filtros.projeto_id) q = q.eq("projeto_id", filtros.projeto_id);
    if (filtros.ambiente) q = q.eq("ambiente", filtros.ambiente);
    if (filtros.categoria) q = q.eq("categoria", filtros.categoria);
    if (filtros.assunto) q = q.eq("assunto", filtros.assunto);
    if (filtros.status) q = q.eq("status", filtros.status);
    if (filtros.busca) {
      q = q.or(
        `item.ilike.%${filtros.busca}%,fabricante.ilike.%${filtros.busca}%,modelo.ilike.%${filtros.busca}%`
      );
    }
    return q;
  };

  const queryOrdenada = (q: any) =>
    q.order("ambiente", { ascending: true })
      .order("categoria", { ascending: true })
      .order("ordem", { ascending: true });

  const queryJoin = queryOrdenada(
    aplicarFiltros(supabase.from("memorial_acabamentos").select(SELECT_MEMORIAL_COM_PRICELIST))
  );

  const { data: dataJoin, error: errorJoin } = await queryJoin;

  let data = dataJoin as any[] | null;
  if (errorJoin && (errorJoin as any)?.code === "PGRST200") {
    const { data: dataSemJoin, error: errorSemJoin } = await queryOrdenada(
      aplicarFiltros(supabase.from("memorial_acabamentos").select("*"))
    );

    if (errorSemJoin) throw errorSemJoin;
    data = dataSemJoin as any[] | null;
  } else if (errorJoin) {
    throw errorJoin;
  }

  const dataComPricelist = await anexarPricelistItems((data || []) as any[]);

  return (dataComPricelist || []).map((item: any) => ({
    ...item,
    fabricante_display:
      item.pricelist_item?.fabricante || item.fabricante || null,
    modelo_display: item.pricelist_item?.modelo || item.modelo || null,
    codigo_display:
      item.pricelist_item?.codigo_fabricante || item.codigo_fabricante || null,
    preco_display:
      item.preco_unitario || item.pricelist_item?.preco || 0,
  })) as MemorialAcabamentoCompleto[];
}

/**
 * Buscar item por ID
 */
export async function buscarMemorialItem(
  id: string
): Promise<MemorialAcabamentoCompleto> {
  const { data: dataJoin, error: errorJoin } = await supabase
    .from("memorial_acabamentos")
    .select(SELECT_MEMORIAL_COM_PRICELIST)
    .eq("id", id)
    .single();

  let data = dataJoin as any;
  if (errorJoin && (errorJoin as any)?.code === "PGRST200") {
    const { data: dataSemJoin, error: errorSemJoin } = await supabase
      .from("memorial_acabamentos")
      .select("*")
      .eq("id", id)
      .single();

    if (errorSemJoin) throw errorSemJoin;
    const [row] = await anexarPricelistItems([dataSemJoin]);
    data = row;
  } else if (errorJoin) {
    throw errorJoin;
  }

  return {
    ...data,
    fabricante_display:
      data.pricelist_item?.fabricante || data.fabricante || null,
    modelo_display: data.pricelist_item?.modelo || data.modelo || null,
    codigo_display:
      data.pricelist_item?.codigo_fabricante || data.codigo_fabricante || null,
    preco_display:
      data.preco_unitario || data.pricelist_item?.preco || 0,
  } as MemorialAcabamentoCompleto;
}

/**
 * Criar item no memorial
 */
export async function criarMemorialItem(
  payload: MemorialAcabamentoFormData
): Promise<MemorialAcabamento> {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .insert({
      ...payload,
      quantidade: payload.quantidade ?? 1,
      unidade: payload.unidade ?? "un",
      ordem: payload.ordem ?? 0,
      status: payload.status ?? "pendente",
      created_by: user?.user?.id,
      updated_by: user?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as MemorialAcabamento;
}

/**
 * Atualizar item do memorial
 */
export async function atualizarMemorialItem(
  id: string,
  payload: Partial<MemorialAcabamentoFormData>
): Promise<MemorialAcabamento> {
  const { data: user } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .update({
      ...payload,
      updated_by: user?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as MemorialAcabamento;
}

/**
 * Deletar item do memorial
 */
export async function deletarMemorialItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("memorial_acabamentos")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Atualizar status de múltiplos itens
 */
export async function atualizarStatusItens(
  ids: string[],
  status: string
): Promise<void> {
  const { data: user } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("memorial_acabamentos")
    .update({
      status,
      updated_by: user?.user?.id,
    })
    .in("id", ids);

  if (error) throw error;
}

/**
 * Reordenar itens dentro de um ambiente
 */
export async function reordenarItensMemorial(
  itens: { id: string; ordem: number }[]
): Promise<void> {
  for (const item of itens) {
    await supabase
      .from("memorial_acabamentos")
      .update({ ordem: item.ordem })
      .eq("id", item.id);
  }
}

/**
 * Vincular item do Pricelist a um item do Memorial
 */
export async function vincularPricelistItem(
  memorialItemId: string,
  pricelistItemId: string
): Promise<MemorialAcabamento> {
  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .update({
      pricelist_item_id: pricelistItemId,
    })
    .eq("id", memorialItemId)
    .select()
    .single();

  if (error) throw error;
  return data as MemorialAcabamento;
}

/**
 * Desvincular item do Pricelist
 */
export async function desvincularPricelistItem(
  memorialItemId: string
): Promise<MemorialAcabamento> {
  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .update({
      pricelist_item_id: null,
    })
    .eq("id", memorialItemId)
    .select()
    .single();

  if (error) throw error;
  return data as MemorialAcabamento;
}

// ============================================================
// RESUMOS E ESTATÍSTICAS
// ============================================================

/**
 * Obter resumo por ambiente de um projeto
 */
export async function obterResumoAmbientes(
  projetoId: string
): Promise<MemorialResumoAmbiente[]> {
  const { data, error } = await supabase
    .from("vw_memorial_resumo_ambiente")
    .select("*")
    .eq("projeto_id", projetoId);

  if (error) {
    // Se a view não existir, calcular manualmente
    console.warn("View não encontrada, calculando manualmente");
    const itens = await listarMemorialProjeto(projetoId);

    const resumoPorAmbiente = new Map<string, MemorialResumoAmbiente>();

    for (const item of itens) {
      if (!resumoPorAmbiente.has(item.ambiente)) {
        resumoPorAmbiente.set(item.ambiente, {
          projeto_id: projetoId,
          ambiente: item.ambiente,
          total_itens: 0,
          itens_pendentes: 0,
          itens_especificados: 0,
          itens_aprovados: 0,
          valor_total: 0,
        });
      }

      const resumo = resumoPorAmbiente.get(item.ambiente)!;
      resumo.total_itens++;

      if (item.status === "pendente") resumo.itens_pendentes++;
      if (item.status === "especificado") resumo.itens_especificados++;
      if (item.status === "aprovado") resumo.itens_aprovados++;

      resumo.valor_total += item.preco_display * item.quantidade;
    }

    return Array.from(resumoPorAmbiente.values());
  }

  return data as MemorialResumoAmbiente[];
}

/**
 * Listar ambientes de um projeto
 */
export async function listarAmbientesProjeto(
  projetoId: string
): Promise<AmbienteMemorial[]> {
  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .select("ambiente")
    .eq("projeto_id", projetoId);

  if (error) throw error;

  const ambientesUnicos = [...new Set(data.map((d) => d.ambiente))];
  return ambientesUnicos as AmbienteMemorial[];
}

// ============================================================
// IMPORTAÇÍO E EXPORTAÇÍO
// ============================================================

/**
 * Duplicar memorial de um projeto para outro
 */
export async function duplicarMemorial(
  projetoOrigemId: string,
  projetoDestinoId: string
): Promise<number> {
  const itensOrigem = await listarMemorialProjeto(projetoOrigemId);

  let contador = 0;

  for (const item of itensOrigem) {
    await criarMemorialItem({
      projeto_id: projetoDestinoId,
      ambiente: item.ambiente,
      categoria: item.categoria,
      assunto: item.assunto,
      item: item.item,
      pricelist_item_id: item.pricelist_item_id || undefined,
      fabricante: item.fabricante || undefined,
      modelo: item.modelo || undefined,
      codigo_fabricante: item.codigo_fabricante || undefined,
      quantidade: item.quantidade,
      unidade: item.unidade,
      preco_unitario: item.preco_unitario || undefined,
      observacoes: item.observacoes || undefined,
      ordem: item.ordem,
      status: "pendente", // Resetar status
    });
    contador++;
  }

  return contador;
}

/**
 * Criar ambiente completo com template
 */
export async function criarAmbienteComTemplate(
  projetoId: string,
  ambiente: AmbienteMemorial
): Promise<void> {
  const template = await buscarTemplateAmbiente(ambiente);

  if (!template) {
    console.warn(`Template não encontrado para: ${ambiente}`);
    return;
  }

  // Criar estrutura básica com categorias do template
  const categorias = template.categorias_padrao as CategoriaMemorial[];
  let ordem = 0;

  for (const categoria of categorias) {
    await criarMemorialItem({
      projeto_id: projetoId,
      ambiente,
      categoria,
      assunto: "A definir",
      item: `Item ${categoria} a especificar`,
      ordem: ordem++,
      status: "pendente",
    });
  }
}

/**
 * Importar itens em lote
 */
export async function importarItensMemorial(
  projetoId: string,
  itens: Omit<MemorialAcabamentoFormData, "projeto_id">[]
): Promise<{ sucesso: number; erros: number }> {
  let sucesso = 0;
  let erros = 0;

  for (const item of itens) {
    try {
      await criarMemorialItem({
        ...item,
        projeto_id: projetoId,
      });
      sucesso++;
    } catch (error) {
      console.error("Erro ao importar item:", error);
      erros++;
    }
  }

  return { sucesso, erros };
}


