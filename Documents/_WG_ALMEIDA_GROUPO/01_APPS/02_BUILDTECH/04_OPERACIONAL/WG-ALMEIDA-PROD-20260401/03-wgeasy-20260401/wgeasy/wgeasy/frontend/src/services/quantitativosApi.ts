// ============================================================
// API SERVICE: Módulo de Quantitativos de Projeto
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabaseRaw as supabase } from "../lib/supabaseClient";
import type {
  QuantitativoProjeto,
  QuantitativoProjetoCompleto,
  QuantitativoProjetoFormData,
  QuantitativoAmbiente,
  QuantitativoAmbienteFormData,
  QuantitativoCategoria,
  QuantitativoCategoriaFormData,
  QuantitativoItem,
  QuantitativoItemCompleto,
  QuantitativoItemFormData,
  QuantitativoTemplate,
  QuantitativoTemplateFormData,
  QuantitativosFiltros,
  QuantitativosEstatisticas,
  NucleoQuantitativo,
} from "../types/quantitativos";
import { listarAmbientesPorProposta } from "../lib/ambientesApi";

// ============================================================
// PROJETOS
// ============================================================

/**
 * Listar todos os projetos de quantitativos com filtros
 */
export async function listarQuantitativosProjetos(
  filtros?: QuantitativosFiltros
): Promise<QuantitativoProjetoCompleto[]> {
  let query = supabase.from("vw_quantitativos_projetos_resumo").select("*");

  if (filtros?.nucleo) {
    query = query.eq("nucleo", filtros.nucleo);
  }

  if (filtros?.nucleo_id) {
    query = query.eq("nucleo_id", filtros.nucleo_id);
  }

  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }

  if (filtros?.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }

  if (filtros?.proposta_id) {
    query = query.eq("proposta_id", filtros.proposta_id);
  }

  if (filtros?.contrato_id) {
    query = query.eq("contrato_id", filtros.contrato_id);
  }

  if (filtros?.busca) {
    query = query.or(
      `numero.ilike.%${filtros.busca}%,nome.ilike.%${filtros.busca}%`
    );
  }

  if (filtros?.data_inicio) {
    query = query.gte("criado_em", filtros.data_inicio);
  }

  if (filtros?.data_fim) {
    query = query.lte("criado_em", filtros.data_fim);
  }

  query = query.order("criado_em", { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar quantitativos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar projeto de quantitativo por ID
 */
export async function buscarQuantitativoProjeto(
  id: string
): Promise<QuantitativoProjeto> {
  const { data, error } = await supabase
    .from("quantitativos_projetos")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar quantitativo:", error);
    throw error;
  }

  return data;
}

/**
 * Buscar projeto completo com ambientes, categorias e itens
 */
export async function buscarQuantitativoProjetoCompleto(
  id: string
): Promise<QuantitativoProjetoCompleto> {
  // Buscar projeto
  const projeto = await buscarQuantitativoProjeto(id);

  // Buscar ambientes com categorias e itens
  const ambientes = await listarQuantitativosAmbientes(id);

  // Para cada ambiente, buscar categorias
  const ambientesCompletos = await Promise.all(
    ambientes.map(async (ambiente) => {
      const categorias = await listarQuantitativosCategorias(ambiente.id);

      // Para cada categoria, buscar itens
      const categoriasCompletas = await Promise.all(
        categorias.map(async (categoria) => {
          const itens = await listarQuantitativosItens(categoria.id);
          return {
            ...categoria,
            itens,
            total_itens: itens.length,
            valor_total: itens.reduce(
              (sum, item) => sum + (item.preco_total || 0),
              0
            ),
          };
        })
      );

      return {
        ...ambiente,
        categorias: categoriasCompletas,
        total_categorias: categoriasCompletas.length,
        total_itens: categoriasCompletas.reduce(
          (sum, cat) => sum + (cat.total_itens || 0),
          0
        ),
        valor_total: categoriasCompletas.reduce(
          (sum, cat) => sum + (cat.valor_total || 0),
          0
        ),
      };
    })
  );

  return {
    ...projeto,
    ambientes: ambientesCompletos,
    total_ambientes: ambientesCompletos.length,
    total_categorias: ambientesCompletos.reduce(
      (sum, amb) => sum + (amb.total_categorias || 0),
      0
    ),
    total_itens: ambientesCompletos.reduce(
      (sum, amb) => sum + (amb.total_itens || 0),
      0
    ),
    valor_total: ambientesCompletos.reduce(
      (sum, amb) => sum + (amb.valor_total || 0),
      0
    ),
  };
}

/**
 * Criar novo projeto de quantitativo
 */
export async function criarQuantitativoProjeto(
  formData: QuantitativoProjetoFormData
): Promise<QuantitativoProjeto> {
  // Se número nÍo foi fornecido, gerar automaticamente
  let numero = formData.numero;
  if (!numero) {
    const { data: numeroGerado, error: errorNumero } = await supabase.rpc(
      "gerar_numero_quantitativo",
      { p_nucleo: formData.nucleo }
    );

    if (errorNumero) {
      console.error("Erro ao gerar número:", errorNumero);
      throw errorNumero;
    }

    numero = numeroGerado;
  }

  // Buscar usuário atual para criado_por
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  const { data, error } = await supabase
    .from("quantitativos_projetos")
    .insert({
      ...formData,
      numero,
      criado_por: usuario?.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar quantitativo:", error);
    throw error;
  }

  await importarAmbientesDaProposta(data.id, formData.proposta_id);

  return data;
}

/**
 * Atualizar projeto de quantitativo
 */
export async function atualizarQuantitativoProjeto(
  id: string,
  formData: Partial<QuantitativoProjetoFormData>
): Promise<QuantitativoProjeto> {
  // Buscar usuário atual para atualizado_por
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  const { data, error } = await supabase
    .from("quantitativos_projetos")
    .update({
      ...formData,
      atualizado_por: usuario?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar quantitativo:", error);
    throw error;
  }

  return data;
}

async function importarAmbientesDaProposta(
  projetoId: string,
  propostaId?: string | null
) {
  if (!propostaId) {
    return;
  }

  // Se o projeto já possui ambientes, nÍo duplicamos os registros.
  const { count: existentes, error: countError } = await supabase
    .from("quantitativos_ambientes")
    .select("id", { head: true, count: "exact" })
    .eq("projeto_id", projetoId);

  if (countError) {
    console.error("Erro ao verificar ambientes existentes:", countError);
    return;
  }

  if ((existentes || 0) > 0) {
    return;
  }

  const ambientes = await listarAmbientesPorProposta(propostaId);
  if (!ambientes.length) {
    return;
  }

  const registros = ambientes.map((amb, index) => ({
    projeto_id: projetoId,
    nome: amb.nome,
    descricao: amb.observacoes || null,
    largura: amb.largura ?? null,
    comprimento: amb.comprimento ?? null,
    area: amb.area_m2 ?? null,
    pe_direito: amb.pe_direito ?? null,
    perimetro: amb.perimetro ?? null,
    ordem: amb.ordem ?? index,
  }));

  const { error: insertError } = await supabase
    .from("quantitativos_ambientes")
    .insert(registros);

  if (insertError) {
    console.error("Erro ao importar ambientes da proposta:", insertError);
  }
}

/**
 * Deletar projeto de quantitativo
 */
export async function deletarQuantitativoProjeto(id: string): Promise<void> {
  const { error } = await supabase
    .from("quantitativos_projetos")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar quantitativo:", error);
    throw error;
  }
}

// ============================================================
// AMBIENTES
// ============================================================

/**
 * Listar ambientes de um projeto
 */
export async function listarQuantitativosAmbientes(
  projetoId: string
): Promise<QuantitativoAmbiente[]> {
  const { data, error } = await supabase
    .from("quantitativos_ambientes")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao listar ambientes:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar ambiente por ID
 */
export async function buscarQuantitativoAmbiente(
  id: string
): Promise<QuantitativoAmbiente> {
  const { data, error } = await supabase
    .from("quantitativos_ambientes")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar ambiente:", error);
    throw error;
  }

  return data;
}

/**
 * Criar novo ambiente
 */
export async function criarQuantitativoAmbiente(
  formData: QuantitativoAmbienteFormData
): Promise<QuantitativoAmbiente> {
  const { data, error } = await supabase
    .from("quantitativos_ambientes")
    .insert(formData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar ambiente:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar ambiente
 */
export async function atualizarQuantitativoAmbiente(
  id: string,
  formData: Partial<QuantitativoAmbienteFormData>
): Promise<QuantitativoAmbiente> {
  const { data, error } = await supabase
    .from("quantitativos_ambientes")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar ambiente:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar ambiente
 */
export async function deletarQuantitativoAmbiente(id: string): Promise<void> {
  const { error } = await supabase
    .from("quantitativos_ambientes")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar ambiente:", error);
    throw error;
  }
}

/**
 * Reordenar ambientes
 */
export async function reordenarQuantitativosAmbientes(
  ambientes: { id: string; ordem: number }[]
): Promise<void> {
  const promises = ambientes.map((ambiente) =>
    supabase
      .from("quantitativos_ambientes")
      .update({ ordem: ambiente.ordem })
      .eq("id", ambiente.id)
  );

  await Promise.all(promises);
}

// ============================================================
// CATEGORIAS
// ============================================================

/**
 * Listar categorias de um ambiente
 */
export async function listarQuantitativosCategorias(
  ambienteId: string
): Promise<QuantitativoCategoria[]> {
  const { data, error } = await supabase
    .from("quantitativos_categorias")
    .select("*")
    .eq("ambiente_id", ambienteId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao listar categorias:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar categoria por ID
 */
export async function buscarQuantitativoCategoria(
  id: string
): Promise<QuantitativoCategoria> {
  const { data, error } = await supabase
    .from("quantitativos_categorias")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar categoria:", error);
    throw error;
  }

  return data;
}

/**
 * Criar nova categoria
 */
export async function criarQuantitativoCategoria(
  formData: QuantitativoCategoriaFormData
): Promise<QuantitativoCategoria> {
  const { data, error } = await supabase
    .from("quantitativos_categorias")
    .insert(formData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar categoria:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar categoria
 */
export async function atualizarQuantitativoCategoria(
  id: string,
  formData: Partial<QuantitativoCategoriaFormData>
): Promise<QuantitativoCategoria> {
  const { data, error } = await supabase
    .from("quantitativos_categorias")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar categoria:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar categoria
 */
export async function deletarQuantitativoCategoria(id: string): Promise<void> {
  const { error } = await supabase
    .from("quantitativos_categorias")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar categoria:", error);
    throw error;
  }
}

/**
 * Reordenar categorias
 */
export async function reordenarQuantitativosCategorias(
  categorias: { id: string; ordem: number }[]
): Promise<void> {
  const promises = categorias.map((categoria) =>
    supabase
      .from("quantitativos_categorias")
      .update({ ordem: categoria.ordem })
      .eq("id", categoria.id)
  );

  await Promise.all(promises);
}

// ============================================================
// ITENS
// ============================================================

/**
 * Listar itens de uma categoria
 */
export async function listarQuantitativosItens(
  categoriaId: string
): Promise<QuantitativoItemCompleto[]> {
  const { data, error } = await supabase
    .from("vw_quantitativos_itens_completo")
    .select("*")
    .eq("categoria_id", categoriaId)
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao listar itens:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar item por ID
 */
export async function buscarQuantitativoItem(
  id: string
): Promise<QuantitativoItem> {
  const { data, error } = await supabase
    .from("quantitativos_itens")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar item:", error);
    throw error;
  }

  return data;
}

/**
 * Criar novo item
 */
export async function criarQuantitativoItem(
  formData: QuantitativoItemFormData
): Promise<QuantitativoItem> {
  const { data, error } = await supabase
    .from("quantitativos_itens")
    .insert(formData)
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar item:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar item
 */
export async function atualizarQuantitativoItem(
  id: string,
  formData: Partial<QuantitativoItemFormData>
): Promise<QuantitativoItem> {
  const { data, error } = await supabase
    .from("quantitativos_itens")
    .update(formData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar item:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar item
 */
export async function deletarQuantitativoItem(id: string): Promise<void> {
  const { error } = await supabase
    .from("quantitativos_itens")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar item:", error);
    throw error;
  }
}

/**
 * Vincular item ao Pricelist
 */
export async function vincularItemPricelist(
  itemId: string,
  pricelistId: string
): Promise<QuantitativoItem> {
  // Buscar dados do Pricelist
  const { data: pricelistItem, error: pricelistError } = await supabase
    .from("pricelist_itens")
    .select("*")
    .eq("id", pricelistId)
    .single();

  if (pricelistError) {
    console.error("Erro ao buscar item do pricelist:", pricelistError);
    throw pricelistError;
  }

  // Atualizar item do quantitativo
  return await atualizarQuantitativoItem(itemId, {
    pricelist_item_id: pricelistId,
    codigo: pricelistItem.codigo,
    nome: pricelistItem.nome,
    descricao: pricelistItem.descricao,
    unidade: pricelistItem.unidade,
    preco_unitario: pricelistItem.preco,
    sincronizar_preco: true,
  });
}

/**
 * Reordenar itens
 */
export async function reordenarQuantitativosItens(
  itens: { id: string; ordem: number }[]
): Promise<void> {
  const promises = itens.map((item) =>
    supabase
      .from("quantitativos_itens")
      .update({ ordem: item.ordem })
      .eq("id", item.id)
  );

  await Promise.all(promises);
}

// ============================================================
// TEMPLATES
// ============================================================

/**
 * Listar templates
 */
export async function listarQuantitativosTemplates(
  tipo?: string,
  nucleo?: NucleoQuantitativo
): Promise<QuantitativoTemplate[]> {
  let query = supabase
    .from("quantitativos_templates")
    .select("*")
    .eq("ativo", true);

  if (tipo) {
    query = query.eq("tipo", tipo);
  }

  if (nucleo) {
    query = query.eq("nucleo", nucleo);
  }

  query = query.order("nome", { ascending: true });

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar templates:", error);
    throw error;
  }

  return data || [];
}

/**
 * Criar template
 */
export async function criarQuantitativoTemplate(
  formData: QuantitativoTemplateFormData
): Promise<QuantitativoTemplate> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: usuario } = await supabase
    .from("usuarios")
    .select("id")
    .eq("auth_user_id", user?.id)
    .single();

  const { data, error } = await supabase
    .from("quantitativos_templates")
    .insert({
      ...formData,
      criado_por: usuario?.id,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar template:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar template
 */
export async function deletarQuantitativoTemplate(id: string): Promise<void> {
  const { error } = await supabase
    .from("quantitativos_templates")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar template:", error);
    throw error;
  }
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas gerais
 */
export async function obterEstatisticasQuantitativos(): Promise<QuantitativosEstatisticas> {
  const { data: projetos } = await supabase
    .from("vw_quantitativos_projetos_resumo")
    .select("*");

  if (!projetos) {
    return {
      total_projetos: 0,
      total_em_elaboracao: 0,
      total_aprovados: 0,
      total_revisao: 0,
      total_arquivados: 0,
      valor_total_geral: 0,
      total_ambientes: 0,
      total_itens: 0,
      projetos_por_nucleo: {
        arquitetura: 0,
        engenharia: 0,
        marcenaria: 0,
      },
    };
  }

  return {
    total_projetos: projetos.length,
    total_em_elaboracao: projetos.filter((p) => p.status === "em_elaboracao")
      .length,
    total_aprovados: projetos.filter((p) => p.status === "aprovado").length,
    total_revisao: projetos.filter((p) => p.status === "revisao").length,
    total_arquivados: projetos.filter((p) => p.status === "arquivado").length,
    valor_total_geral: projetos.reduce(
      (sum, p) => sum + (p.valor_total || 0),
      0
    ),
    total_ambientes: projetos.reduce(
      (sum, p) => sum + (p.total_ambientes || 0),
      0
    ),
    total_itens: projetos.reduce((sum, p) => sum + (p.total_itens || 0), 0),
    projetos_por_nucleo: {
      arquitetura: projetos.filter((p) => p.nucleo === "arquitetura").length,
      engenharia: projetos.filter((p) => p.nucleo === "engenharia").length,
      marcenaria: projetos.filter((p) => p.nucleo === "marcenaria").length,
    },
  };
}

// ============================================================
// EXPORTAÇÍO
// ============================================================

/**
 * Gerar orçamento a partir de quantitativo
 * (Esta funçÍo será implementada na Fase 4)
 */
export async function gerarOrcamentoDeQuantitativo(
  projetoId: string
): Promise<never> {
  // TODO: Implementar na Fase 4 - IntegraçÍo com Orçamentos
  console.log("Gerar orçamento do projeto:", projetoId);
  throw new Error("Funcionalidade será implementada na Fase 4");
}

/**
 * Exportar quantitativo para Excel
 * (Esta funçÍo será implementada na Fase 6)
 */
export async function exportarQuantitativoExcel(
  projetoId: string
): Promise<Blob> {
  // TODO: Implementar na Fase 6 - ExportaçÍo
  console.log("Exportar para Excel:", projetoId);
  throw new Error("Funcionalidade será implementada na Fase 6");
}

/**
 * Exportar quantitativo para PDF
 * (Esta funçÍo será implementada na Fase 6)
 */
export async function exportarQuantitativoPDF(
  projetoId: string
): Promise<Blob> {
  // TODO: Implementar na Fase 6 - ExportaçÍo
  console.log("Exportar para PDF:", projetoId);
  throw new Error("Funcionalidade será implementada na Fase 6");
}

