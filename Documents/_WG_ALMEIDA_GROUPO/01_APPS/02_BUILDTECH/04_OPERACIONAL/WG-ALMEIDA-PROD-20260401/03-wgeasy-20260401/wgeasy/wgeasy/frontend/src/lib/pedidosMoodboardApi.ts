// ============================================================
// API: GeraçÍo Automática de Pedidos a partir do Moodboard
// Sistema WG Easy 2026 - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";

// ============================================================
// TIPOS
// ============================================================

interface ItemPedido {
  produto_id: string;
  produto_nome: string;
  produto_codigo: string | null;
  categoria: string;
  origem: "catalogo" | "pricelist";
  pricelist_item_id?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_total: number;
  observacoes: string | null;
}

interface PedidoFornecedor {
  id: string;
  contrato_id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  moodboard_id: string;
  numero_pedido: string;
  itens: ItemPedido[];
  valor_total: number;
  status: "rascunho" | "enviado" | "confirmado" | "entregue" | "cancelado";
  data_envio: string | null;
  data_previsao_entrega: string | null;
  observacoes: string | null;
  created_at: string;
}

interface SelecaoAgrupada {
  fornecedor_id: string;
  fornecedor_nome: string;
  fornecedor_codigo: string;
  itens: {
    id: string;
    produto_id: string;
    produto_nome: string;
    produto_codigo: string | null;
    categoria: string;
    origem: "catalogo" | "pricelist";
    pricelist_item_id?: string | null;
    quantidade: number;
    valor_unitario: number;
    valor_total: number;
    ambiente: string;
  }[];
  valor_total: number;
}

interface ResultadoGeracaoPedidos {
  sucesso: boolean;
  pedidos_criados: number;
  pedidos: PedidoFornecedor[];
  erros: string[];
}

// ============================================================
// FUNÇÕES AUXILIARES
// ============================================================

/**
 * Gerar número de pedido único
 */
function gerarNumeroPedido(fornecedorCodigo: string, contratoId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const contratoShort = contratoId.slice(0, 4).toUpperCase();
  return `PED-${fornecedorCodigo.toUpperCase()}-${contratoShort}-${timestamp}`;
}

// ============================================================
// FUNÇÕES PRINCIPAIS
// ============================================================

/**
 * Buscar seleções aprovadas agrupadas por fornecedor
 */
export async function buscarSelecoesAgrupadasPorFornecedor(
  moodboardId: string
): Promise<SelecaoAgrupada[]> {
  // Buscar seleções aprovadas do memorial com dados do produto e fornecedor
  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .select(`
      id,
      ambiente,
      categoria,
      quantidade,
      preco_unitario,
      preco_total,
      fornecedor_catalogo_id,
      pricelist_item_id,
      fornecedores_catalogo:fornecedor_catalogo_id (
        id,
        nome,
        codigo_produto,
        fornecedor_id,
        sistema_fornecedores_config:fornecedor_id (
          id,
          nome,
          codigo
        )
      ),
      pricelist_item:pricelist_item_id (
        id,
        nome,
        codigo,
        categoria,
        fornecedor_id
      )
    `)
    .eq("moodboard_id", moodboardId)
    .eq("selecionado_por_cliente", true)
    .eq("aprovado_por_admin", true);

  if (error) throw error;

  // Agrupar por fornecedor
  const agrupamento = new Map<string, SelecaoAgrupada>();

  for (const item of data || []) {
    const produtoCatalogo = item.fornecedores_catalogo as any;
    const produtoPricelist = item.pricelist_item as any;

    let fornecedorId = "pricelist";
    let fornecedorNome = "Pricelist";
    let fornecedorCodigo = "PRICELIST";
    let origem: "catalogo" | "pricelist" = "pricelist";
    let produtoId = item.pricelist_item_id ? `pricelist:${item.pricelist_item_id}` : "";
    let produtoNome = produtoPricelist?.nome || "Item do Pricelist";
    let produtoCodigo = produtoPricelist?.codigo || null;

    if (produtoCatalogo?.sistema_fornecedores_config) {
      const fornecedor = produtoCatalogo.sistema_fornecedores_config;
      fornecedorId = fornecedor.id;
      fornecedorNome = fornecedor.nome;
      fornecedorCodigo = fornecedor.codigo;
      origem = "catalogo";
      produtoId = produtoCatalogo.id;
      produtoNome = produtoCatalogo.nome;
      produtoCodigo = produtoCatalogo.codigo_produto;
    }

    if (!agrupamento.has(fornecedorId)) {
      agrupamento.set(fornecedorId, {
        fornecedor_id: fornecedorId,
        fornecedor_nome: fornecedorNome,
        fornecedor_codigo: fornecedorCodigo,
        itens: [],
        valor_total: 0,
      });
    }

    const grupo = agrupamento.get(fornecedorId)!;
    grupo.itens.push({
      id: item.id,
      produto_id: produtoId,
      produto_nome: produtoNome,
      produto_codigo: produtoCodigo,
      categoria: item.categoria || produtoPricelist?.categoria || produtoCatalogo?.categoria || "",
      origem,
      pricelist_item_id: item.pricelist_item_id || null,
      quantidade: item.quantidade || 1,
      valor_unitario: item.preco_unitario || 0,
      valor_total: item.preco_total || 0,
      ambiente: item.ambiente,
    });
    grupo.valor_total += item.preco_total || 0;
  }

  return Array.from(agrupamento.values());
}

/**
 * Criar pedido para um fornecedor específico
 */
export async function criarPedidoFornecedor(
  contratoId: string,
  moodboardId: string,
  selecaoAgrupada: SelecaoAgrupada
): Promise<PedidoFornecedor> {
  const numeroPedido = gerarNumeroPedido(
    selecaoAgrupada.fornecedor_codigo,
    contratoId
  );

  const itens: ItemPedido[] = selecaoAgrupada.itens.map((item) => ({
    produto_id: item.produto_id,
    produto_nome: item.produto_nome,
    produto_codigo: item.produto_codigo,
    categoria: item.categoria,
    origem: item.origem,
    pricelist_item_id: item.pricelist_item_id || null,
    quantidade: item.quantidade,
    valor_unitario: item.valor_unitario,
    valor_total: item.valor_total,
    observacoes: `Ambiente: ${item.ambiente}`,
  }));

  const { data, error } = await supabase
    .from("pedidos_fornecedores")
    .insert({
      contrato_id: contratoId,
      fornecedor_id: selecaoAgrupada.fornecedor_id,
      moodboard_id: moodboardId,
      numero_pedido: numeroPedido,
      itens: itens,
      valor_total: selecaoAgrupada.valor_total,
      status: "rascunho",
    })
    .select()
    .single();

  if (error) throw error;

  return {
    ...data,
    fornecedor_nome: selecaoAgrupada.fornecedor_nome,
  } as PedidoFornecedor;
}

/**
 * Gerar todos os pedidos para fornecedores a partir do moodboard
 */
export async function gerarPedidosFornecedores(
  contratoId: string,
  moodboardId: string
): Promise<ResultadoGeracaoPedidos> {
  const resultado: ResultadoGeracaoPedidos = {
    sucesso: true,
    pedidos_criados: 0,
    pedidos: [],
    erros: [],
  };

  try {
    // Buscar seleções agrupadas
    const selecoesAgrupadas = await buscarSelecoesAgrupadasPorFornecedor(moodboardId);

    if (selecoesAgrupadas.length === 0) {
      resultado.sucesso = false;
      resultado.erros.push("Nenhuma seleçÍo aprovada encontrada para gerar pedidos");
      return resultado;
    }

    // Criar pedido para cada fornecedor
    for (const selecao of selecoesAgrupadas) {
      try {
        const pedido = await criarPedidoFornecedor(contratoId, moodboardId, selecao);
        resultado.pedidos.push(pedido);
        resultado.pedidos_criados++;
      } catch (err) {
        const mensagem = `Erro ao criar pedido para ${selecao.fornecedor_nome}: ${(err as Error).message}`;
        resultado.erros.push(mensagem);
        console.error(mensagem, err);
      }
    }

    resultado.sucesso = resultado.erros.length === 0;
  } catch (err) {
    resultado.sucesso = false;
    resultado.erros.push(`Erro geral: ${(err as Error).message}`);
  }

  return resultado;
}

/**
 * Listar pedidos de um moodboard
 */
export async function listarPedidosMoodboard(
  moodboardId: string
): Promise<PedidoFornecedor[]> {
  const { data, error } = await supabase
    .from("pedidos_fornecedores")
    .select(`
      *,
      fornecedor:sistema_fornecedores_config!fornecedor_id (
        id,
        nome,
        codigo
      )
    `)
    .eq("moodboard_id", moodboardId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((p) => ({
    ...p,
    fornecedor_nome: (p.fornecedor as any)?.nome || "Desconhecido",
  })) as PedidoFornecedor[];
}

/**
 * Atualizar status do pedido
 */
export async function atualizarStatusPedido(
  pedidoId: string,
  status: PedidoFornecedor["status"],
  dadosAdicionais?: {
    data_envio?: string;
    data_previsao_entrega?: string;
    observacoes?: string;
  }
): Promise<void> {
  const updateData: Record<string, unknown> = { status };

  if (status === "enviado" && !dadosAdicionais?.data_envio) {
    updateData.data_envio = new Date().toISOString();
  }

  if (dadosAdicionais) {
    Object.assign(updateData, dadosAdicionais);
  }

  const { error } = await supabase
    .from("pedidos_fornecedores")
    .update(updateData)
    .eq("id", pedidoId);

  if (error) throw error;
}

/**
 * Cancelar pedido
 */
export async function cancelarPedido(
  pedidoId: string,
  motivo?: string
): Promise<void> {
  await atualizarStatusPedido(pedidoId, "cancelado", {
    observacoes: motivo || "Cancelado pelo usuário",
  });
}

/**
 * Enviar pedido para fornecedor
 */
export async function enviarPedido(
  pedidoId: string,
  previsaoEntrega?: string
): Promise<void> {
  await atualizarStatusPedido(pedidoId, "enviado", {
    data_envio: new Date().toISOString(),
    data_previsao_entrega: previsaoEntrega,
  });

  // TODO: Integrar com sistema de notificações para enviar email/WhatsApp
}

/**
 * Confirmar recebimento do pedido pelo fornecedor
 */
export async function confirmarPedido(
  pedidoId: string,
  previsaoEntrega: string
): Promise<void> {
  await atualizarStatusPedido(pedidoId, "confirmado", {
    data_previsao_entrega: previsaoEntrega,
  });
}

/**
 * Marcar pedido como entregue
 */
export async function marcarPedidoEntregue(pedidoId: string): Promise<void> {
  await atualizarStatusPedido(pedidoId, "entregue");

  // Atualizar status dos itens no memorial
  const { data: pedido } = await supabase
    .from("pedidos_fornecedores")
    .select("itens, moodboard_id")
    .eq("id", pedidoId)
    .single();

  if (pedido?.itens) {
    // Marcar itens como entregues no memorial
    for (const item of pedido.itens as ItemPedido[]) {
      const updateQuery = supabase
        .from("memorial_acabamentos")
        .update({ status: "instalado" })
        .eq("moodboard_id", pedido.moodboard_id);

      if (item.origem === "pricelist" && item.pricelist_item_id) {
        await updateQuery.eq("pricelist_item_id", item.pricelist_item_id);
      } else {
        await updateQuery.eq("fornecedor_catalogo_id", item.produto_id);
      }
    }
  }
}

/**
 * Calcular resumo de pedidos por status
 */
export async function calcularResumoPedidos(
  contratoId: string
): Promise<{
  total: number;
  por_status: Record<string, number>;
  valor_total: number;
  valor_por_status: Record<string, number>;
}> {
  const { data, error } = await supabase
    .from("pedidos_fornecedores")
    .select("status, valor_total")
    .eq("contrato_id", contratoId);

  if (error) throw error;

  const resumo = {
    total: data?.length || 0,
    por_status: {} as Record<string, number>,
    valor_total: 0,
    valor_por_status: {} as Record<string, number>,
  };

  for (const pedido of data || []) {
    resumo.por_status[pedido.status] = (resumo.por_status[pedido.status] || 0) + 1;
    resumo.valor_total += pedido.valor_total || 0;
    resumo.valor_por_status[pedido.status] =
      (resumo.valor_por_status[pedido.status] || 0) + (pedido.valor_total || 0);
  }

  return resumo;
}

// ============================================================
// INTEGRAÇÍO COM COMPRAS EXISTENTE
// ============================================================

/**
 * Converter pedido do moodboard para pedido de compra do sistema
 */
export async function converterParaPedidoCompra(
  pedidoFornecedorId: string
): Promise<{ pedido_compra_id: string }> {
  // Buscar pedido do moodboard
  const { data: pedidoMoodboard, error: fetchError } = await supabase
    .from("pedidos_fornecedores")
    .select(`
      *,
      contrato:contratos!contrato_id (
        id,
        projeto_id
      ),
      fornecedor:sistema_fornecedores_config!fornecedor_id (
        pessoa_id
      )
    `)
    .eq("id", pedidoFornecedorId)
    .single();

  if (fetchError) throw fetchError;

  // Criar pedido de compra no sistema existente
  const { data: pedidoCompra, error: createError } = await supabase
    .from("pedidos_compra")
    .insert({
      projeto_id: (pedidoMoodboard.contrato as any)?.projeto_id,
      contrato_id: (pedidoMoodboard.contrato as any)?.id,
      fornecedor_id: (pedidoMoodboard.fornecedor as any)?.pessoa_id,
      status: "pendente",
      tipo: "material",
      origem: "moodboard",
      origem_id: pedidoFornecedorId,
      valor_total: pedidoMoodboard.valor_total,
      observacoes: `Pedido gerado automaticamente do Moodboard. Número: ${pedidoMoodboard.numero_pedido}`,
    })
    .select()
    .single();

  if (createError) throw createError;

  // Criar itens do pedido
  const itens = pedidoMoodboard.itens as ItemPedido[];
  for (const item of itens) {
    await supabase.from("pedidos_compra_itens").insert({
      pedido_id: pedidoCompra.id,
      descricao: item.produto_nome,
      sku: item.produto_codigo,
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_total: item.valor_total,
      unidade: "un",
      origem: item.origem,
      pricelist_item_id: item.pricelist_item_id || null,
    });
  }

  // Atualizar referência no pedido do moodboard
  await supabase
    .from("pedidos_fornecedores")
    .update({ pedido_compra_id: pedidoCompra.id })
    .eq("id", pedidoFornecedorId);

  return { pedido_compra_id: pedidoCompra.id };
}

