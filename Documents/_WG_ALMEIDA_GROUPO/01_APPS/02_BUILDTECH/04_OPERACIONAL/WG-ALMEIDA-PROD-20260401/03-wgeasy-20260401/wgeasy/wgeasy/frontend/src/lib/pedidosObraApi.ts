// ============================================================
// API: Pedidos de Materiais de Obra (Consolidados)
// Sistema WG Easy - Grupo WG Almeida
// Gerenciamento de pedidos por cliente/obra
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export interface PedidoObra {
  id: string;
  codigo: string;
  nome: string;
  cliente_nome: string;
  endereco?: string;
  tipo_projeto: string;
  status: string;
  created_at: string;
  updated_at?: string;
  total_itens: number;
  valor_total: number;
  itens?: ItemPedidoObra[];
}

export interface ItemPedidoObra {
  id: string;
  codigo: string;
  projeto_id: string;
  descricao: string;
  especificacao?: string;
  ambiente?: string;
  quantidade_projeto: number;
  quantidade_compra: number;
  unidade: string;
  preco_unitario: number;
  valor_total: number;
  status: string;
}

export interface ClienteConsolidado {
  cliente_nome: string;
  endereco?: string;
  total_pedidos: number;
  total_itens: number;
  valor_total: number;
  pedidos: PedidoObra[];
  status_resumo: {
    pendentes: number;
    aprovados: number;
    em_andamento: number;
    finalizados: number;
  };
  ultimo_pedido?: string;
}

export interface ResumoConsolidacao {
  total_clientes: number;
  total_pedidos: number;
  total_itens: number;
  valor_total: number;
  por_status: Record<string, number>;
}

// ============================================================
// FUNÇÕES DE CONSULTA
// ============================================================

/**
 * Listar pedidos de materiais de obra
 */
export async function listarPedidosObra(filtros?: {
  cliente_nome?: string;
  status?: string;
  tipo_projeto?: string;
}): Promise<PedidoObra[]> {
  let query = supabase
    .from("projetos_compras")
    .select(`
      id,
      codigo,
      nome,
      cliente_nome,
      endereco,
      tipo_projeto,
      status,
      created_at,
      updated_at
    `)
    .order("created_at", { ascending: false });

  if (filtros?.cliente_nome) {
    query = query.ilike("cliente_nome", `%${filtros.cliente_nome}%`);
  }

  if (filtros?.status) {
    query = query.eq("status", filtros.status);
  }

  if (filtros?.tipo_projeto) {
    query = query.eq("tipo_projeto", filtros.tipo_projeto);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Buscar contagem de itens e valor total para cada pedido
  const pedidosComTotais = await Promise.all(
    (data || []).map(async (pedido) => {
      const { data: itens } = await supabase
        .from("projeto_lista_compras")
        .select("quantidade_compra, valor_total")
        .eq("projeto_id", pedido.id);

      const totalItens = itens?.length || 0;
      const valorTotal = itens?.reduce((acc, i) => acc + (i.valor_total || 0), 0) || 0;

      return {
        ...pedido,
        total_itens: totalItens,
        valor_total: valorTotal,
      };
    })
  );

  return pedidosComTotais;
}

/**
 * Buscar pedido completo com itens
 */
export async function buscarPedidoCompleto(pedidoId: string): Promise<PedidoObra | null> {
  const { data: pedido, error } = await supabase
    .from("projetos_compras")
    .select("*")
    .eq("id", pedidoId)
    .single();

  if (error) throw error;
  if (!pedido) return null;

  // Buscar itens
  const { data: itens } = await supabase
    .from("projeto_lista_compras")
    .select("*")
    .eq("projeto_id", pedidoId)
    .order("created_at", { ascending: true });

  const totalItens = itens?.length || 0;
  const valorTotal = itens?.reduce((acc, i) => acc + (i.valor_total || 0), 0) || 0;

  return {
    ...pedido,
    total_itens: totalItens,
    valor_total: valorTotal,
    itens: itens || [],
  };
}

/**
 * Listar pedidos consolidados por cliente
 */
export async function listarPedidosPorCliente(): Promise<ClienteConsolidado[]> {
  const pedidos = await listarPedidosObra();

  // Agrupar por cliente
  const porCliente: Record<string, ClienteConsolidado> = {};

  for (const pedido of pedidos) {
    const chave = pedido.cliente_nome;

    if (!porCliente[chave]) {
      porCliente[chave] = {
        cliente_nome: pedido.cliente_nome,
        endereco: pedido.endereco,
        total_pedidos: 0,
        total_itens: 0,
        valor_total: 0,
        pedidos: [],
        status_resumo: {
          pendentes: 0,
          aprovados: 0,
          em_andamento: 0,
          finalizados: 0,
        },
      };
    }

    porCliente[chave].pedidos.push(pedido);
    porCliente[chave].total_pedidos += 1;
    porCliente[chave].total_itens += pedido.total_itens;
    porCliente[chave].valor_total += pedido.valor_total;

    // Contar status
    switch (pedido.status) {
      case "PENDENTE":
        porCliente[chave].status_resumo.pendentes += 1;
        break;
      case "APROVADO":
        porCliente[chave].status_resumo.aprovados += 1;
        break;
      case "EM_ANDAMENTO":
        porCliente[chave].status_resumo.em_andamento += 1;
        break;
      case "FINALIZADO":
        porCliente[chave].status_resumo.finalizados += 1;
        break;
    }

    // Atualizar último pedido
    if (!porCliente[chave].ultimo_pedido || pedido.created_at > porCliente[chave].ultimo_pedido) {
      porCliente[chave].ultimo_pedido = pedido.created_at;
    }
  }

  // Ordenar por último pedido (mais recente primeiro)
  return Object.values(porCliente).sort((a, b) => {
    if (!a.ultimo_pedido) return 1;
    if (!b.ultimo_pedido) return -1;
    return b.ultimo_pedido.localeCompare(a.ultimo_pedido);
  });
}

/**
 * Obter lista consolidada de itens de todos os pedidos de um cliente
 */
export async function listarItensConsolidadosCliente(clienteNome: string): Promise<{
  itens: Array<ItemPedidoObra & { pedido_codigo: string; pedido_status: string }>;
  totais: { quantidade: number; valor: number };
}> {
  // Buscar pedidos do cliente
  const { data: pedidos, error: erroPedidos } = await supabase
    .from("projetos_compras")
    .select("id, codigo, status")
    .ilike("cliente_nome", `%${clienteNome}%`);

  if (erroPedidos) throw erroPedidos;

  if (!pedidos || pedidos.length === 0) {
    return { itens: [], totais: { quantidade: 0, valor: 0 } };
  }

  // Buscar itens de todos os pedidos
  const { data: todosItens, error: erroItens } = await supabase
    .from("projeto_lista_compras")
    .select("*")
    .in(
      "projeto_id",
      pedidos.map((p) => p.id)
    );

  if (erroItens) throw erroItens;

  // Mapear itens com código do pedido
  const itensComPedido = (todosItens || []).map((item) => {
    const pedido = pedidos.find((p) => p.id === item.projeto_id);
    return {
      ...item,
      pedido_codigo: pedido?.codigo || "",
      pedido_status: pedido?.status || "",
    };
  });

  // Calcular totais
  const totais = {
    quantidade: itensComPedido.length,
    valor: itensComPedido.reduce((acc, i) => acc + (i.valor_total || 0), 0),
  };

  return { itens: itensComPedido, totais };
}

/**
 * Obter resumo geral de consolidaçÍo
 */
export async function obterResumoConsolidacao(): Promise<ResumoConsolidacao> {
  const clientesConsolidados = await listarPedidosPorCliente();

  const resumo: ResumoConsolidacao = {
    total_clientes: clientesConsolidados.length,
    total_pedidos: 0,
    total_itens: 0,
    valor_total: 0,
    por_status: {
      PENDENTE: 0,
      APROVADO: 0,
      EM_ANDAMENTO: 0,
      FINALIZADO: 0,
    },
  };

  for (const cliente of clientesConsolidados) {
    resumo.total_pedidos += cliente.total_pedidos;
    resumo.total_itens += cliente.total_itens;
    resumo.valor_total += cliente.valor_total;
    resumo.por_status.PENDENTE += cliente.status_resumo.pendentes;
    resumo.por_status.APROVADO += cliente.status_resumo.aprovados;
    resumo.por_status.EM_ANDAMENTO += cliente.status_resumo.em_andamento;
    resumo.por_status.FINALIZADO += cliente.status_resumo.finalizados;
  }

  return resumo;
}

// ============================================================
// FUNÇÕES DE ATUALIZAÇÍO
// ============================================================

/**
 * Aprovar pedido de materiais
 */
export async function aprovarPedido(pedidoId: string): Promise<void> {
  const { error } = await supabase
    .from("projetos_compras")
    .update({ status: "APROVADO", updated_at: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) throw error;

  // Atualizar status dos itens também
  await supabase
    .from("projeto_lista_compras")
    .update({ status: "APROVADO", data_aprovacao: new Date().toISOString() })
    .eq("projeto_id", pedidoId)
    .eq("status", "PENDENTE");
}

/**
 * Rejeitar pedido de materiais
 */
export async function rejeitarPedido(pedidoId: string, motivo?: string): Promise<void> {
  const { error } = await supabase
    .from("projetos_compras")
    .update({
      status: "CANCELADO",
      updated_at: new Date().toISOString(),
      observacoes: motivo,
    })
    .eq("id", pedidoId);

  if (error) throw error;
}

/**
 * Marcar pedido como em andamento
 */
export async function iniciarPedido(pedidoId: string): Promise<void> {
  const { error } = await supabase
    .from("projetos_compras")
    .update({ status: "EM_ANDAMENTO", updated_at: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) throw error;
}

/**
 * Finalizar pedido
 */
export async function finalizarPedido(pedidoId: string): Promise<void> {
  const { error } = await supabase
    .from("projetos_compras")
    .update({ status: "FINALIZADO", updated_at: new Date().toISOString() })
    .eq("id", pedidoId);

  if (error) throw error;

  // Atualizar itens
  await supabase
    .from("projeto_lista_compras")
    .update({ status: "ENTREGUE", data_entrega: new Date().toISOString() })
    .eq("projeto_id", pedidoId);
}

export default {
  listarPedidosObra,
  buscarPedidoCompleto,
  listarPedidosPorCliente,
  listarItensConsolidadosCliente,
  obterResumoConsolidacao,
  aprovarPedido,
  rejeitarPedido,
  iniciarPedido,
  finalizarPedido,
};

