// ============================================================
// API: Modelos de Orcamento e Lista de Compras
// Sistema WG Easy - Grupo WG Almeida
// Integrado com Analise de Projetos e Pricelist
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface ModeloOrcamento {
  id: string;
  codigo: string;
  titulo: string;
  descricao?: string;
  nucleo: "arquitetura" | "engenharia" | "marcenaria";
  categoria?: string;
  tags?: string[];
  icone?: string;
  cor_primaria?: string;
  cor_secundaria?: string;
  vezes_utilizado: number;
  popular: boolean;
  ativo: boolean;
  ordem: number;
  categorias?: ModeloCategoria[];
  itens?: ModeloItem[];
}

export interface ModeloCategoria {
  id: string;
  modelo_id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  ordem: number;
  itens?: ModeloItem[];
}

export interface ModeloItem {
  id: string;
  modelo_id: string;
  categoria_id?: string;
  pricelist_item_id?: string;
  codigo?: string;
  descricao: string;
  unidade: string;
  preco_unitario?: number;
  tipo_item: "servico" | "material" | "produto" | "mao_de_obra";
  quantidade_padrao: number;
  formula_quantidade?: string;
  obrigatorio: boolean;
  ordem: number;
  // Dados do pricelist (join)
  pricelist_item?: {
    id: string;
    nome: string;
    preco: number;
    categoria?: string;
  };
}

export interface ListaComprasObra {
  id: string;
  proposta_id?: string;
  contrato_id?: string;
  orcamento_id?: string;
  analise_id?: string;
  numero?: string;
  titulo: string;
  descricao?: string;
  status: "rascunho" | "aguardando_aprovacao" | "aprovado" | "em_compra" | "comprado";
  total_itens: number;
  valor_estimado: number;
  valor_aprovado?: number;
  criado_em: string;
  itens?: ListaComprasItem[];
}

export interface ListaComprasItem {
  id: string;
  lista_id: string;
  pricelist_item_id?: string;
  codigo?: string;
  descricao: string;
  unidade: string;
  quantidade_necessaria: number;
  quantidade_aprovada?: number;
  quantidade_comprada: number;
  preco_estimado?: number;
  preco_aprovado?: number;
  preco_comprado?: number;
  tipo_item: "material" | "produto" | "ferramenta";
  categoria?: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  status: "pendente" | "aprovado" | "em_cotacao" | "comprado" | "entregue";
  urgente: boolean;
  observacoes?: string;
  ordem: number;
}

// ============================================================
// MODELOS DE ORCAMENTO
// ============================================================

/**
 * Listar todos os modelos ativos
 */
export async function listarModelos(filtros?: {
  nucleo?: string;
  popular?: boolean;
  busca?: string;
}): Promise<ModeloOrcamento[]> {
  let query = supabase
    .from("modelos_orcamento")
    .select("*")
    .eq("ativo", true)
    .order("ordem", { ascending: true });

  if (filtros?.nucleo && filtros.nucleo !== "todos") {
    query = query.eq("nucleo", filtros.nucleo);
  }

  if (filtros?.popular !== undefined) {
    query = query.eq("popular", filtros.popular);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Filtrar por busca se necessário
  let modelos = data || [];
  if (filtros?.busca) {
    const termo = filtros.busca.toLowerCase();
    modelos = modelos.filter(
      (m) =>
        m.titulo.toLowerCase().includes(termo) ||
        (m.descricao || "").toLowerCase().includes(termo)
    );
  }

  return modelos;
}

/**
 * Buscar modelo com categorias e itens
 */
export async function buscarModeloCompleto(modeloId: string): Promise<ModeloOrcamento | null> {
  // Buscar modelo
  const { data: modelo, error: modeloError } = await supabase
    .from("modelos_orcamento")
    .select("*")
    .eq("id", modeloId)
    .single();

  if (modeloError) throw modeloError;
  if (!modelo) return null;

  // Buscar categorias
  const { data: categorias } = await supabase
    .from("modelos_orcamento_categorias")
    .select("*")
    .eq("modelo_id", modeloId)
    .order("ordem", { ascending: true });

  // Buscar itens com pricelist
  const { data: itens } = await supabase
    .from("modelos_orcamento_itens")
    .select(`
      *,
      pricelist_item:pricelist_itens(id, nome, preco, categoria)
    `)
    .eq("modelo_id", modeloId)
    .order("ordem", { ascending: true });

  return {
    ...modelo,
    categorias: categorias || [],
    itens: itens || [],
  };
}

/**
 * Incrementar contador de uso do modelo
 */
export async function incrementarUsoModelo(modeloId: string): Promise<void> {
  const { error } = await supabase.rpc("incrementar_uso_modelo", {
    p_modelo_id: modeloId,
  });

  // Fallback se funçÍo não existir - buscar valor atual e incrementar
  if (error) {
    const { data: modelo } = await supabase
      .from("modelos_orcamento")
      .select("vezes_utilizado")
      .eq("id", modeloId)
      .single();

    await supabase
      .from("modelos_orcamento")
      .update({
        vezes_utilizado: (modelo?.vezes_utilizado ?? 0) + 1,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", modeloId);
  }
}

// ============================================================
// LISTA DE COMPRAS
// ============================================================

/**
 * Gerar lista de compras a partir de análise de projeto
 */
export async function gerarListaComprasDeAnalise(
  analiseId: string,
  titulo?: string
): Promise<ListaComprasObra> {
  // Buscar serviços da análise que sÍo materiais/produtos
  const { data: servicos, error: servicosError } = await supabase
    .from("analises_projeto_servicos")
    .select("*")
    .eq("analise_id", analiseId)
    .eq("selecionado", true);

  if (servicosError) throw servicosError;

  // Filtrar apenas materiais e produtos
  const itensMateriais = (servicos || []).filter(
    (s) =>
      s.categoria?.toLowerCase().includes("material") ||
      s.categoria?.toLowerCase().includes("produto") ||
      s.categoria?.toLowerCase().includes("insumo") ||
      s.tipo?.toLowerCase().includes("material") ||
      s.tipo?.toLowerCase().includes("produto")
  );

  // Criar lista
  const { data: lista, error: listaError } = await supabase
    .from("lista_compras_obra")
    .insert({
      analise_id: analiseId,
      titulo: titulo || "Lista de Compras Inicial",
      status: "rascunho",
      total_itens: itensMateriais.length,
    })
    .select()
    .single();

  if (listaError) throw listaError;

  // Criar itens
  if (itensMateriais.length > 0) {
    const itensParaInserir = itensMateriais.map((s, idx) => ({
      lista_id: lista.id,
      pricelist_item_id: s.pricelist_item_id,
      descricao: s.descricao,
      unidade: s.unidade || "un",
      quantidade_necessaria: s.quantidade || s.area || 1,
      tipo_item: s.categoria?.toLowerCase().includes("produto") ? "produto" : "material",
      categoria: s.categoria,
      status: "pendente",
      ordem: idx,
    }));

    await supabase.from("lista_compras_obra_itens").insert(itensParaInserir);
  }

  return lista;
}

/**
 * Gerar lista de compras a partir de proposta
 */
export async function gerarListaComprasDeProposta(
  propostaId: string,
  titulo?: string
): Promise<ListaComprasObra> {
  // Buscar itens da proposta que sÍo materiais/produtos
  const { data: itensProposta, error } = await supabase
    .from("propostas_itens")
    .select(`
      *,
      item:pricelist_itens(*)
    `)
    .eq("proposta_id", propostaId);

  if (error) throw error;

  // Filtrar materiais e produtos
  const itensMateriais = (itensProposta || []).filter((ip) => {
    const categoria = ip.item?.categoria?.toLowerCase() || "";
    const tipo = ip.item?.tipo?.toLowerCase() || "";
    return (
      categoria.includes("material") ||
      categoria.includes("produto") ||
      tipo.includes("material") ||
      tipo.includes("produto")
    );
  });

  // Calcular valor estimado
  const valorEstimado = itensMateriais.reduce(
    (acc, ip) => acc + (ip.quantidade || 1) * (ip.item?.preco || 0),
    0
  );

  // Criar lista
  const { data: lista, error: listaError } = await supabase
    .from("lista_compras_obra")
    .insert({
      proposta_id: propostaId,
      titulo: titulo || "Lista de Compras - Proposta",
      status: "rascunho",
      total_itens: itensMateriais.length,
      valor_estimado: valorEstimado,
    })
    .select()
    .single();

  if (listaError) throw listaError;

  // Criar itens
  if (itensMateriais.length > 0) {
    const itensParaInserir = itensMateriais.map((ip, idx) => ({
      lista_id: lista.id,
      pricelist_item_id: ip.pricelist_item_id,
      codigo: ip.item?.codigo,
      descricao: ip.item?.nome || ip.descricao_customizada || "Item",
      unidade: ip.item?.unidade || "un",
      quantidade_necessaria: ip.quantidade || 1,
      preco_estimado: ip.item?.preco || 0,
      tipo_item: ip.item?.tipo || "material",
      categoria: ip.item?.categoria,
      status: "pendente",
      ordem: idx,
    }));

    await supabase.from("lista_compras_obra_itens").insert(itensParaInserir);
  }

  return lista;
}

/**
 * Listar listas de compras
 */
export async function listarListasCompras(filtros?: {
  analise_id?: string;
  proposta_id?: string;
  contrato_id?: string;
  status?: string;
}): Promise<ListaComprasObra[]> {
  let query = supabase
    .from("lista_compras_obra")
    .select("*")
    .order("criado_em", { ascending: false });

  if (filtros?.analise_id) {
    query = query.eq("analise_id", filtros.analise_id);
  }
  if (filtros?.proposta_id) {
    query = query.eq("proposta_id", filtros.proposta_id);
  }
  if (filtros?.contrato_id) {
    query = query.eq("contrato_id", filtros.contrato_id);
  }
  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }

  const { data, error } = await query;

  if (error) throw error;

  return data || [];
}

/**
 * Buscar lista de compras com itens
 */
export async function buscarListaComprasCompleta(listaId: string): Promise<ListaComprasObra | null> {
  const { data: lista, error: listaError } = await supabase
    .from("lista_compras_obra")
    .select("*")
    .eq("id", listaId)
    .single();

  if (listaError) throw listaError;
  if (!lista) return null;

  const { data: itens } = await supabase
    .from("lista_compras_obra_itens")
    .select("*")
    .eq("lista_id", listaId)
    .order("ordem", { ascending: true });

  return {
    ...lista,
    itens: itens || [],
  };
}

/**
 * Atualizar status de item da lista
 */
export async function atualizarStatusItemLista(
  itemId: string,
  status: ListaComprasItem["status"],
  dados?: Partial<ListaComprasItem>
): Promise<void> {
  const { error } = await supabase
    .from("lista_compras_obra_itens")
    .update({
      status,
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) throw error;
}

// ============================================================
// INTEGRACAO COM ANALISE DE PROJETOS
// ============================================================

/**
 * Carregar dados da análise para preencher orçamento/modelo
 */
export async function carregarDadosAnaliseParaOrcamento(analiseId: string): Promise<{
  ambientes: any[];
  servicos: any[];
  materiais: any[];
  totalServicos: number;
  totalMateriais: number;
  valorEstimadoServicos: number;
  valorEstimadoMateriais: number;
}> {
  // Buscar ambientes
  const { data: ambientes } = await supabase
    .from("analises_projeto_ambientes")
    .select("*")
    .eq("analise_id", analiseId)
    .order("ordem");

  // Buscar serviços
  const { data: servicos } = await supabase
    .from("analises_projeto_servicos")
    .select("*")
    .eq("analise_id", analiseId)
    .eq("selecionado", true)
    .order("ordem");

  // Separar serviços de materiais
  const listaServicos = (servicos || []).filter(
    (s) =>
      !s.categoria?.toLowerCase().includes("material") &&
      !s.categoria?.toLowerCase().includes("produto")
  );

  const listaMateriais = (servicos || []).filter(
    (s) =>
      s.categoria?.toLowerCase().includes("material") ||
      s.categoria?.toLowerCase().includes("produto")
  );

  return {
    ambientes: ambientes || [],
    servicos: listaServicos,
    materiais: listaMateriais,
    totalServicos: listaServicos.length,
    totalMateriais: listaMateriais.length,
    valorEstimadoServicos: 0, // Será calculado com base no pricelist
    valorEstimadoMateriais: 0,
  };
}

export default {
  listarModelos,
  buscarModeloCompleto,
  incrementarUsoModelo,
  gerarListaComprasDeAnalise,
  gerarListaComprasDeProposta,
  listarListasCompras,
  buscarListaComprasCompleta,
  atualizarStatusItemLista,
  carregarDadosAnaliseParaOrcamento,
};


