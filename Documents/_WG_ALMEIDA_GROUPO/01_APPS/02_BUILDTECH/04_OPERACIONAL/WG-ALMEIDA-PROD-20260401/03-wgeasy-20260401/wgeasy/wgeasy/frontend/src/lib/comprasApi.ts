/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API: Pedidos de Compra
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  PedidoCompra,
  PedidoCompraCompleto,
  PedidoCompraFormData,
  PedidoCompraItem,
  PedidoCompraItemCompleto,
  PedidoCompraItemFormData,
  PedidosCompraFiltros,
  PedidosCompraEstatisticas,
  StatusPedidoCompra,
} from "@/types/pedidosCompra";

// Re-export types for convenience (pages import types from this module)
export type {
  PedidoCompra,
  PedidoCompraCompleto,
  PedidoCompraFormData,
  PedidoCompraItem,
  PedidoCompraItemCompleto,
  PedidoCompraItemFormData,
  PedidosCompraFiltros,
  PedidosCompraEstatisticas,
  StatusPedidoCompra,
};

// ============================================================
// PEDIDOS DE COMPRA
// ============================================================

/**
 * Listar todos os pedidos de compra
 */
export async function listarPedidosCompra(): Promise<PedidoCompraCompleto[]> {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `
      *,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Buscar quantidade de itens para cada pedido
  const pedidosCompletos = await Promise.all(
    (data as any[]).map(async (pedido) => {
      const { data: itens } = await supabase
        .from("pedidos_compra_itens")
        .select("id")
        .eq("pedido_id", pedido.id);

      return {
        ...pedido,
        total_itens: itens?.length || 0,
      };
    })
  );

  return pedidosCompletos as any;
}

/**
 * Listar pedidos de compra com filtros
 */
export async function listarPedidosCompraComFiltros(
  filtros: PedidosCompraFiltros
): Promise<PedidoCompraCompleto[]> {
  let query = supabase.from("pedidos_compra").select(
    `
      *,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone
      )
    `
  );

  if (filtros.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros.fornecedor_id) {
    query = query.eq("fornecedor_id", filtros.fornecedor_id);
  }

  if (filtros.contrato_id) {
    query = query.eq("contrato_id", filtros.contrato_id);
  }

  if (filtros.data_pedido_inicio) {
    query = query.gte("data_pedido", filtros.data_pedido_inicio);
  }

  if (filtros.data_pedido_fim) {
    query = query.lte("data_pedido", filtros.data_pedido_fim);
  }

  if (filtros.busca) {
    query = query.ilike("numero", `%${filtros.busca}%`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  // Buscar quantidade de itens para cada pedido
  const pedidosCompletos = await Promise.all(
    (data as any[]).map(async (pedido) => {
      const { data: itens } = await supabase
        .from("pedidos_compra_itens")
        .select("id")
        .eq("pedido_id", pedido.id);

      return {
        ...pedido,
        total_itens: itens?.length || 0,
      };
    })
  );

  return pedidosCompletos as any;
}

/**
 * Buscar pedido de compra por ID
 */
export async function buscarPedidoCompra(
  id: string
): Promise<PedidoCompraCompleto> {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `
      *,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Buscar itens do pedido
  const itens = await listarItensPedidoCompra(id);

  return {
    ...data,
    total_itens: itens.length,
    itens,
  } as any;
}

/**
 * Buscar pedidos por contrato
 */
export async function buscarPedidosPorContrato(
  contrato_id: string
): Promise<PedidoCompraCompleto[]> {
  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `
      *,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone
      )
    `
    )
    .eq("contrato_id", contrato_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const pedidosCompletos = await Promise.all(
    (data as any[]).map(async (pedido) => {
      const { data: itens } = await supabase
        .from("pedidos_compra_itens")
        .select("id")
        .eq("pedido_id", pedido.id);

      return {
        ...pedido,
        total_itens: itens?.length || 0,
      };
    })
  );

  return pedidosCompletos as any;
}

/**
 * Criar pedido de compra
 */
export async function criarPedidoCompra(
  payload: PedidoCompraFormData
): Promise<PedidoCompra> {
  // Gerar numero do pedido
  const { data: numeroData, error: numeroError } = await supabase.rpc(
    "gerar_numero_pedido_compra"
  );

  if (numeroError) throw numeroError;

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("pedidos_compra")
    .insert({
      numero: numeroData,
      ...payload,
      status: "pendente",
      valor_total: 0,
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Atualizar pedido de compra
 */
export async function atualizarPedidoCompra(
  id: string,
  payload: Partial<PedidoCompraFormData>
): Promise<PedidoCompra> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("pedidos_compra")
    .update({
      ...payload,
      updated_by: userData?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Deletar pedido de compra
 */
export async function deletarPedidoCompra(id: string): Promise<void> {
  const { error } = await supabase
    .from("pedidos_compra")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Alterar status do pedido
 */
export async function alterarStatusPedidoCompra(
  id: string,
  status: StatusPedidoCompra
): Promise<PedidoCompra> {
  const { data: userData } = await supabase.auth.getUser();

  const updateData: any = {
    status,
    updated_by: userData?.user?.id,
  };

  // Se for marcar como entregue, definir data de entrega real
  if (status === "entregue") {
    updateData.data_entrega_real = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("pedidos_compra")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

// ============================================================
// ITENS DO PEDIDO
// ============================================================

/**
 * Listar itens do pedido de compra
 */
export async function listarItensPedidoCompra(
  pedido_id: string
): Promise<PedidoCompraItemCompleto[]> {
  const { data, error } = await supabase
    .from("pedidos_compra_itens")
    .select(
      `
      *,
      pricelist_item:pricelist_item_id (
        codigo,
        marca,
        especificacoes
      )
    `
    )
    .eq("pedido_id", pedido_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as any;
}

/**
 * Criar item do pedido de compra
 */
export async function criarItemPedidoCompra(
  pedido_id: string,
  payload: PedidoCompraItemFormData
): Promise<PedidoCompraItem> {
  const preco_total = payload.quantidade * payload.preco_unitario;

  const { data, error } = await supabase
    .from("pedidos_compra_itens")
    .insert({
      pedido_id,
      ...payload,
      preco_total,
    })
    .select()
    .single();

  if (error) throw error;

  // Atualizar valor total do pedido
  await recalcularValorTotalPedido(pedido_id);

  return data as any;
}

/**
 * Atualizar item do pedido de compra
 */
export async function atualizarItemPedidoCompra(
  id: string,
  payload: Partial<PedidoCompraItemFormData>
): Promise<PedidoCompraItem> {
  const updateData: any = { ...payload };

  // Recalcular pre�o total se quantidade ou pre�o unit�rio foram alterados
  if (payload.quantidade !== undefined || payload.preco_unitario !== undefined) {
    const { data: itemAtual } = await supabase
      .from("pedidos_compra_itens")
      .select("quantidade, preco_unitario, pedido_id")
      .eq("id", id)
      .single();

    const quantidade = payload.quantidade ?? itemAtual?.quantidade ?? 0;
    const preco_unitario =
      payload.preco_unitario ?? itemAtual?.preco_unitario ?? 0;

    updateData.preco_total = quantidade * preco_unitario;
  }

  const { data, error } = await supabase
    .from("pedidos_compra_itens")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Atualizar valor total do pedido
  const { data: itemAtualizado } = await supabase
    .from("pedidos_compra_itens")
    .select("pedido_id")
    .eq("id", id)
    .single();

  if (itemAtualizado) {
    await recalcularValorTotalPedido(itemAtualizado.pedido_id);
  }

  return data as any;
}

/**
 * Deletar item do pedido de compra
 */
export async function deletarItemPedidoCompra(id: string): Promise<void> {
  // Buscar pedido_id antes de deletar
  const { data: item } = await supabase
    .from("pedidos_compra_itens")
    .select("pedido_id")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("pedidos_compra_itens")
    .delete()
    .eq("id", id);

  if (error) throw error;

  // Atualizar valor total do pedido
  if (item) {
    await recalcularValorTotalPedido(item.pedido_id);
  }
}

/**
 * Recalcular valor total do pedido
 */
async function recalcularValorTotalPedido(pedido_id: string): Promise<void> {
  const { data: itens } = await supabase
    .from("pedidos_compra_itens")
    .select("preco_total")
    .eq("pedido_id", pedido_id);

  const valorTotal = itens?.reduce(
    (acc, item) => acc + (item.preco_total || 0),
    0
  ) || 0;

  await supabase
    .from("pedidos_compra")
    .update({ valor_total: valorTotal })
    .eq("id", pedido_id);
}

// ============================================================
// ESTAT�STICAS
// ============================================================

/**
 * Obter estat�sticas de pedidos de compra
 */
export async function obterEstatisticasPedidosCompra(): Promise<PedidosCompraEstatisticas> {
  const { data: pedidos, error } = await supabase
    .from("pedidos_compra")
    .select("status, valor_total, data_pedido");

  if (error) throw error;

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const pedidosMes = pedidos.filter((p: any) => {
    const dataPedido = new Date(p.data_pedido);
    return dataPedido >= inicioMes;
  });

  const stats: PedidosCompraEstatisticas = {
    total_pedidos: pedidos.length,
    pedidos_pendentes: pedidos.filter((p: any) => p.status === "pendente")
      .length,
    pedidos_aprovados: pedidos.filter((p: any) => p.status === "aprovado")
      .length,
    pedidos_em_transito: pedidos.filter((p: any) => p.status === "em_transito")
      .length,
    pedidos_entregues: pedidos.filter((p: any) => p.status === "entregue")
      .length,
    pedidos_cancelados: pedidos.filter((p: any) => p.status === "cancelado")
      .length,
    valor_total_pendente: pedidos
      .filter((p: any) => p.status === "pendente")
      .reduce((acc: number, p: any) => acc + (p.valor_total || 0), 0),
    valor_total_mes: pedidosMes.reduce(
      (acc: number, p: any) => acc + (p.valor_total || 0),
      0
    ),
  };

  return stats;
}

/**
 * Gerar pedido de compra a partir de contrato
 */
export async function gerarPedidoDeContrato(
  contrato_id: string
): Promise<PedidoCompra> {
  // Buscar itens de material do contrato
  const { data: itensContrato, error: itensError } = await supabase
    .from("contratos_itens")
    .select("*")
    .eq("contrato_id", contrato_id)
    .eq("tipo", "material");

  if (itensError) throw itensError;

  if (!itensContrato || itensContrato.length === 0) {
    throw new Error("Contrato n�o possui itens de material para compra");
  }

  // Criar pedido de compra (sem fornecedor por enquanto)
  const pedido = await criarPedidoCompra({
    contrato_id,
    fornecedor_id: "", // Ser� preenchido depois
    data_pedido: new Date().toISOString().split("T")[0],
  });

  // Adicionar itens ao pedido
  for (const item of itensContrato) {
    await criarItemPedidoCompra(pedido.id, {
      pricelist_item_id: item.pricelist_item_id || undefined,
      descricao: item.descricao,
      quantidade: item.quantidade,
      unidade: item.unidade,
      preco_unitario: item.preco_unitario,
    });
  }

  return pedido;
}

/**
 * Duplicar pedido de compra
 */
export async function duplicarPedidoCompra(id: string): Promise<PedidoCompra> {
  const pedidoOriginal = await buscarPedidoCompra(id);

  // Criar novo pedido
  const novoPedido = await criarPedidoCompra({
    contrato_id: pedidoOriginal.contrato_id || undefined,
    fornecedor_id: pedidoOriginal.fornecedor_id || "",
    data_pedido: new Date().toISOString().split("T")[0],
    observacoes: pedidoOriginal.observacoes || undefined,
    condicoes_pagamento: pedidoOriginal.condicoes_pagamento || undefined,
  });

  // Duplicar itens
  if (pedidoOriginal.itens) {
    for (const item of pedidoOriginal.itens) {
      await criarItemPedidoCompra(novoPedido.id, {
        pricelist_item_id: item.pricelist_item_id || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        preco_unitario: item.preco_unitario,
        observacoes: item.observacoes || undefined,
      });
    }
  }

  return novoPedido;
}

/**
 * Listar pedidos atrasados
 */
export async function listarPedidosAtrasados(): Promise<PedidoCompraCompleto[]> {
  const hoje = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("pedidos_compra")
    .select(
      `
      *,
      fornecedor:pessoas!fornecedor_id (
        id,
        nome,
        email,
        telefone
      )
    `
    )
    .lt("data_previsao_entrega", hoje)
    .in("status", ["pendente", "aprovado", "em_transito"])
    .order("data_previsao_entrega", { ascending: true });

  if (error) throw error;

  const pedidosCompletos = await Promise.all(
    (data as any[]).map(async (pedido) => {
      const { data: itens } = await supabase
        .from("pedidos_compra_itens")
        .select("id")
        .eq("pedido_id", pedido.id);

      return {
        ...pedido,
        total_itens: itens?.length || 0,
      };
    })
  );

  return pedidosCompletos as any;
}

// ============================================================
// FUNÇÕES ADICIONAIS
// ============================================================

/**
 * Alias para listarPedidosCompra (compatibilidade)
 */
export async function listarPedidos(): Promise<PedidoCompraCompleto[]> {
  return listarPedidosCompra();
}

/**
 * Importar item por link (web scraping)
 * TODO: Implementar scraping real com backend
 */
export async function importarItemPorLink(url: string): Promise<any> {
  console.warn("importarItemPorLink não implementado - retornando dados mock");
  return {
    nome: "Item Importado",
    descricao: "DescriçÍo do item importado do link: " + url,
    preco: 0,
    marca: "Desconhecida",
    url_original: url
  };
}

/**
 * Criar item importado no banco
 * TODO: Implementar lógica real
 */
export async function criarItemImportado(dados: any): Promise<any> {
  console.warn("criarItemImportado não implementado completamente");
  throw new Error("FunçÍo não implementada - implementar lógica de salvamento");
}



