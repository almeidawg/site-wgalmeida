/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// WORKFLOW: Orçamentos - Fluxo de AprovaçÍo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  Orcamento,
  OrcamentoCompleto,
  OrcamentoItem,
  OrcamentoHistorico,
  StatusOrcamento,
  AprovacaoClienteData,
} from "@/types/orcamentos";

// ============================================================
// FUNÇÕES DE LISTAGEM COM FILTROS
// ============================================================

/**
 * Lista orçamentos com filtros e dados relacionados
 */
export async function listarOrcamentosComFiltros(filtros?: {
  status?: StatusOrcamento[];
  cliente_id?: string;
  obra_id?: string;
}): Promise<OrcamentoCompleto[]> {
  // Buscar orçamentos sem join (evita erro de FK)
  let query = supabase
    .from("orcamentos")
    .select("*")
    .order("criado_em", { ascending: false });

  if (filtros?.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros?.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }

  if (filtros?.obra_id) {
    query = query.eq("obra_id", filtros.obra_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Buscar dados dos clientes separadamente
  const clienteIds = [...new Set(data.map(o => o.cliente_id).filter(Boolean))];
  let clientesMap: Record<string, any> = {};
  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone")
      .in("id", clienteIds);
    if (clientes) {
      clientesMap = Object.fromEntries(clientes.map(c => [c.id, c]));
    }
  }

  return data.map((o: any) => {
    const cliente = o.cliente_id ? clientesMap[o.cliente_id] : null;
    return {
      ...o,
      cliente_nome: cliente?.nome,
      cliente_email: cliente?.email,
      cliente_telefone: cliente?.telefone,
    };
  });
}

/**
 * Lista orçamentos pendentes de aprovaçÍo do cliente
 */
export async function listarOrcamentosPendentesAprovacao(
  cliente_id?: string
): Promise<OrcamentoCompleto[]> {
  let query = supabase
    .from("orcamentos")
    .select("*")
    .eq("status", "enviado")
    .order("enviado_em", { ascending: false });

  if (cliente_id) {
    query = query.eq("cliente_id", cliente_id);
  }

  const { data, error } = await query;

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Buscar dados dos clientes separadamente
  const clienteIds = [...new Set(data.map(o => o.cliente_id).filter(Boolean))];
  let clientesMap: Record<string, any> = {};
  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone")
      .in("id", clienteIds);
    if (clientes) {
      clientesMap = Object.fromEntries(clientes.map(c => [c.id, c]));
    }
  }

  return data.map((o: any) => {
    const cliente = o.cliente_id ? clientesMap[o.cliente_id] : null;
    return {
      ...o,
      cliente_nome: cliente?.nome,
      cliente_email: cliente?.email,
      cliente_telefone: cliente?.telefone,
    };
  });
}

/**
 * Buscar orçamento por link de aprovaçÍo (para área do cliente)
 */
export async function buscarOrcamentoPorLink(
  link_aprovacao: string
): Promise<OrcamentoCompleto | null> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("link_aprovacao", link_aprovacao)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw error;
  }

  if (!data) return null;

  // Buscar dados do cliente separadamente
  let clienteData: any = null;
  if (data.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone")
      .eq("id", data.cliente_id)
      .single();
    clienteData = cliente;
  }

  return {
    ...data,
    cliente_nome: clienteData?.nome,
    cliente_email: clienteData?.email,
    cliente_telefone: clienteData?.telefone,
  };
}

/**
 * Buscar orçamento completo com itens
 */
export async function buscarOrcamentoCompleto(
  id: string
): Promise<OrcamentoCompleto | null> {
  const { data: orcamento, error: orcError } = await supabase
    .from("orcamentos")
    .select("*")
    .eq("id", id)
    .single();

  if (orcError) throw orcError;
  if (!orcamento) return null;

  // Buscar dados do cliente separadamente
  let clienteData: any = null;
  if (orcamento.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone")
      .eq("id", orcamento.cliente_id)
      .single();
    clienteData = cliente;
  }

  // Buscar itens
  const { data: itens, error: itensError } = await supabase
    .from("orcamento_itens")
    .select("*")
    .eq("orcamento_id", id)
    .order("descricao");

  if (itensError) throw itensError;

  // Buscar histórico
  const { data: historico, error: histError } = await supabase
    .from("orcamentos_historico")
    .select("*")
    .eq("orcamento_id", id)
    .order("created_at", { ascending: false });

  if (histError) console.warn("Erro ao buscar histórico:", histError);

  return {
    ...orcamento,
    cliente_nome: clienteData?.nome,
    cliente_email: clienteData?.email,
    cliente_telefone: clienteData?.telefone,
    itens: itens || [],
    historico: historico || [],
    total_itens: itens?.length || 0,
  };
}

// ============================================================
// FUNÇÕES DE WORKFLOW - ALTERAÇÍO DE STATUS
// ============================================================

/**
 * Enviar orçamento para aprovaçÍo do cliente
 */
export async function enviarParaAprovacao(
  orcamento_id: string,
  observacoes?: string
): Promise<Orcamento> {
  // Verificar se orçamento está em rascunho
  const { data: orcamento, error: checkError } = await supabase
    .from("orcamentos")
    .select("status, valor_total")
    .eq("id", orcamento_id)
    .single();

  if (checkError) throw checkError;

  if (orcamento.status !== "rascunho") {
    throw new Error("Apenas orçamentos em rascunho podem ser enviados para aprovaçÍo");
  }

  if (!orcamento.valor_total || orcamento.valor_total <= 0) {
    throw new Error("Orçamento deve ter valor total maior que zero");
  }

  // Atualizar status para enviado
  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "enviado",
      // link_aprovacao será gerado pelo trigger
    })
    .eq("id", orcamento_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Aprovar orçamento (açÍo do cliente ou admin)
 */
export async function aprovarOrcamento(
  orcamento_id: string,
  aprovado_por?: string,
  observacoes_cliente?: string,
  itens_aprovados?: string[]
): Promise<Orcamento> {
  // Verificar status atual
  const { data: orcamento, error: checkError } = await supabase
    .from("orcamentos")
    .select("status, validade")
    .eq("id", orcamento_id)
    .single();

  if (checkError) throw checkError;

  if (orcamento.status !== "enviado") {
    throw new Error("Apenas orçamentos enviados podem ser aprovados");
  }

  // Verificar validade
  if (orcamento.validade && new Date(orcamento.validade) < new Date()) {
    throw new Error("Este orçamento está expirado");
  }

  // Atualizar orçamento
  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "aprovado",
      aprovado_em: new Date().toISOString(),
      aprovado_por,
      observacoes_cliente,
    })
    .eq("id", orcamento_id)
    .select()
    .single();

  if (error) throw error;

  // Se há itens específicos aprovados, marcar
  if (itens_aprovados && itens_aprovados.length > 0) {
    await supabase
      .from("orcamento_itens")
      .update({ aprovado_cliente: true })
      .eq("orcamento_id", orcamento_id)
      .in("id", itens_aprovados);
  } else {
    // Aprovar todos os itens
    await supabase
      .from("orcamento_itens")
      .update({ aprovado_cliente: true })
      .eq("orcamento_id", orcamento_id);
  }

  return data;
}

/**
 * Rejeitar orçamento
 */
export async function rejeitarOrcamento(
  orcamento_id: string,
  motivo_rejeicao: string
): Promise<Orcamento> {
  if (!motivo_rejeicao || motivo_rejeicao.trim() === "") {
    throw new Error("Motivo da rejeiçÍo é obrigatório");
  }

  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "rejeitado",
      rejeitado_em: new Date().toISOString(),
      motivo_rejeicao,
    })
    .eq("id", orcamento_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Cancelar orçamento
 */
export async function cancelarOrcamento(
  orcamento_id: string,
  motivo?: string
): Promise<Orcamento> {
  const { data, error } = await supabase
    .from("orcamentos")
    .update({
      status: "cancelado",
      motivo_rejeicao: motivo || "Cancelado pelo usuário",
    })
    .eq("id", orcamento_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Reenviar orçamento (criar cópia e enviar)
 */
export async function reenviarOrcamento(
  orcamento_id: string
): Promise<Orcamento> {
  // Buscar orçamento original
  const orcamentoOriginal = await buscarOrcamentoCompleto(orcamento_id);

  if (!orcamentoOriginal) {
    throw new Error("Orçamento não encontrado");
  }

  // Criar novo orçamento como rascunho
  const { data: novoOrcamento, error: createError } = await supabase
    .from("orcamentos")
    .insert({
      cliente_id: orcamentoOriginal.cliente_id,
      obra_id: orcamentoOriginal.obra_id,
      titulo: `${orcamentoOriginal.titulo} (RevisÍo)`,
      valor_total: orcamentoOriginal.valor_total,
      margem: orcamentoOriginal.margem,
      imposto: orcamentoOriginal.imposto,
      status: "rascunho",
    })
    .select()
    .single();

  if (createError) throw createError;

  // Copiar itens
  if (orcamentoOriginal.itens && orcamentoOriginal.itens.length > 0) {
    const itensParaCopiar = orcamentoOriginal.itens.map((item) => ({
      orcamento_id: novoOrcamento.id,
      descricao: item.descricao,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      grupo: item.grupo,
      subtotal: item.subtotal,
      comprado: false,
      aprovado_cliente: false,
    }));

    const { error: itensError } = await supabase
      .from("orcamento_itens")
      .insert(itensParaCopiar);

    if (itensError) throw itensError;
  }

  return novoOrcamento;
}

// ============================================================
// FUNÇÕES DE APROVAÇÍO DO CLIENTE (ÁREA DO CLIENTE)
// ============================================================

/**
 * Aprovar orçamento pela área do cliente (via link)
 */
export async function aprovarOrcamentoPorCliente(
  dados: AprovacaoClienteData
): Promise<Orcamento> {
  // Buscar orçamento pelo link
  const orcamento = await buscarOrcamentoPorLink(dados.link_aprovacao);

  if (!orcamento) {
    throw new Error("Orçamento não encontrado ou link inválido");
  }

  if (orcamento.status !== "enviado") {
    throw new Error("Este orçamento já foi processado");
  }

  if (orcamento.validade && new Date(orcamento.validade) < new Date()) {
    throw new Error("Este orçamento está expirado");
  }

  if (dados.aceito) {
    return await aprovarOrcamento(
      orcamento.id,
      undefined,
      dados.observacoes,
      dados.itens_aprovados
    );
  } else {
    return await rejeitarOrcamento(
      orcamento.id,
      dados.observacoes || "Rejeitado pelo cliente"
    );
  }
}

// ============================================================
// INTEGRAÇÍO COM COMPRAS
// ============================================================

/**
 * Gerar pedido de compra a partir de orçamento aprovado
 */
export async function gerarPedidoCompraDeOrcamento(
  orcamento_id: string,
  fornecedor_id: string,
  itens_ids?: string[]
): Promise<string> {
  // Buscar orçamento
  const orcamento = await buscarOrcamentoCompleto(orcamento_id);

  if (!orcamento) {
    throw new Error("Orçamento não encontrado");
  }

  if (orcamento.status !== "aprovado") {
    throw new Error("Apenas orçamentos aprovados podem gerar pedidos de compra");
  }

  // Filtrar itens aprovados
  let itensParaCompra = orcamento.itens || [];
  if (itens_ids && itens_ids.length > 0) {
    itensParaCompra = itensParaCompra.filter((i) => itens_ids.includes(i.id));
  } else {
    itensParaCompra = itensParaCompra.filter((i) => i.aprovado_cliente && !i.comprado);
  }

  if (itensParaCompra.length === 0) {
    throw new Error("Nenhum item disponível para compra");
  }

  // Calcular valor total
  const valorTotal = itensParaCompra.reduce((acc, item) => acc + item.subtotal, 0);

  // Criar pedido de compra
  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos_compra")
    .insert({
      fornecedor_id,
      valor_total: valorTotal,
      status: "pendente",
      data_pedido: new Date().toISOString().split("T")[0],
      observacoes: `Gerado a partir do orçamento: ${orcamento.titulo}`,
    })
    .select()
    .single();

  if (pedidoError) throw pedidoError;

  // Criar itens do pedido
  const itensPedido = itensParaCompra.map((item) => ({
    pedido_id: pedido.id,
    descricao: item.descricao,
    quantidade: item.quantidade,
    unidade: "un",
    preco_unitario: item.valor_unitario,
    preco_total: item.subtotal,
  }));

  const { error: itensError } = await supabase
    .from("pedidos_compra_itens")
    .insert(itensPedido);

  if (itensError) throw itensError;

  // Atualizar itens do orçamento como "em processo de compra"
  const idsItens = itensParaCompra.map((i) => i.id);
  await supabase
    .from("orcamento_itens")
    .update({ pedido_compra_id: pedido.id })
    .in("id", idsItens);

  return pedido.id;
}

/**
 * Marcar item como comprado
 */
export async function marcarItemComoComprado(
  item_id: string,
  pedido_compra_id?: string
): Promise<OrcamentoItem> {
  const { data, error } = await supabase
    .from("orcamento_itens")
    .update({
      comprado: true,
      comprado_em: new Date().toISOString(),
      pedido_compra_id,
    })
    .eq("id", item_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Desmarcar item como comprado
 */
export async function desmarcarItemComoComprado(
  item_id: string
): Promise<OrcamentoItem> {
  const { data, error } = await supabase
    .from("orcamento_itens")
    .update({
      comprado: false,
      comprado_em: null,
      pedido_compra_id: null,
    })
    .eq("id", item_id)
    .select()
    .single();

  if (error) throw error;

  return data;
}

// ============================================================
// FUNÇÕES DE HISTÓRICO E AUDITORIA
// ============================================================

/**
 * Registrar açÍo no histórico
 */
export async function registrarHistorico(
  orcamento_id: string,
  status_anterior: string | null,
  status_novo: string,
  usuario_id?: string,
  cliente_aprovador: boolean = false,
  observacao?: string
): Promise<void> {
  const { error } = await supabase.from("orcamentos_historico").insert({
    orcamento_id,
    status_anterior,
    status_novo,
    usuario_id,
    cliente_aprovador,
    observacao,
  });

  if (error) console.error("Erro ao registrar histórico:", error);
}

/**
 * Buscar histórico de um orçamento
 */
export async function buscarHistorico(
  orcamento_id: string
): Promise<OrcamentoHistorico[]> {
  const { data, error } = await supabase
    .from("orcamentos_historico")
    .select("*")
    .eq("orcamento_id", orcamento_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return data || [];
}

// ============================================================
// ESTATÍSTICAS E DASHBOARD
// ============================================================

/**
 * Obter estatísticas de orçamentos
 */
export async function obterEstatisticasOrcamentos() {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("status, valor_total");

  if (error) throw error;

  const orcamentos = data || [];

  return {
    total: orcamentos.length,
    rascunhos: orcamentos.filter((o) => o.status === "rascunho").length,
    enviados: orcamentos.filter((o) => o.status === "enviado").length,
    aprovados: orcamentos.filter((o) => o.status === "aprovado").length,
    rejeitados: orcamentos.filter((o) => o.status === "rejeitado").length,
    cancelados: orcamentos.filter((o) => o.status === "cancelado").length,
    expirados: orcamentos.filter((o) => o.status === "expirado").length,
    valor_total_enviados: orcamentos
      .filter((o) => o.status === "enviado")
      .reduce((acc, o) => acc + (o.valor_total || 0), 0),
    valor_total_aprovados: orcamentos
      .filter((o) => o.status === "aprovado")
      .reduce((acc, o) => acc + (o.valor_total || 0), 0),
  };
}

/**
 * Verificar e atualizar orçamentos expirados
 */
export async function verificarOrcamentosExpirados(): Promise<number> {
  const { data, error } = await supabase
    .from("orcamentos")
    .update({ status: "expirado" })
    .eq("status", "enviado")
    .lt("validade", new Date().toISOString().split("T")[0])
    .select();

  if (error) throw error;

  return data?.length || 0;
}



