// ============================================================
// API: Assistência Técnica - Ordens de Serviço
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type {
  OrdemServico,
  OrdemServicoCompleta,
  OrdemServicoFormData,
  ItemOS,
  ItemOSCompleto,
  ItemOSFormData,
  HistoricoOS,
  HistoricoOSCompleto,
  OSFiltros,
  OSEstatisticas,
  StatusOS,
} from "@/types/assistenciaTecnica";

// Re-export tipos para disponibilizar aos componentes
export type {
  OrdemServicoCompleta,
  OrdemServicoFormData,
  ItemOSFormData,
  OSEstatisticas,
};

// ============================================================
// ORDENS DE SERVIÇO
// ============================================================

/**
 * Listar todas as ordens de serviço
 */
export async function listarOS(): Promise<OrdemServicoCompleta[]> {
  const { data, error } = await supabase
    .from("assistencia_ordens")
    .select(
      `
      *,
      cliente:cliente_id (
        id,
        nome,
        email,
        telefone
      ),
      tecnico:tecnico_responsavel_id (
        id,
        pessoa:pessoa_id (
          id,
          nome,
          email,
          telefone
        )
      ),
      contrato:contrato_id (
        id,
        numero
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Buscar quantidade de itens para cada OS
  const osCompletas = await Promise.all(
    (data as any[]).map(async (os) => {
      const { data: itens } = await supabase
        .from("os_itens")
        .select("id")
        .eq("os_id", os.id);

      return {
        ...os,
        total_itens: itens?.length || 0,
      };
    })
  );

  return osCompletas as any;
}

/**
 * Listar ordens de serviço com filtros
 */
export async function listarOSComFiltros(
  filtros: OSFiltros
): Promise<OrdemServicoCompleta[]> {
  let query = supabase.from("assistencia_ordens").select(
    `
      *,
      cliente:cliente_id (
        id,
        nome,
        email,
        telefone
      ),
      tecnico:tecnico_responsavel_id (
        id,
        pessoa:pessoa_id (
          id,
          nome,
          email,
          telefone
        )
      ),
      contrato:contrato_id (
        id,
        numero
      )
    `
  );

  if (filtros.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros.prioridade && filtros.prioridade.length > 0) {
    query = query.in("prioridade", filtros.prioridade);
  }

  if (filtros.tipo_atendimento && filtros.tipo_atendimento.length > 0) {
    query = query.in("tipo_atendimento", filtros.tipo_atendimento);
  }

  if (filtros.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }

  if (filtros.tecnico_id) {
    query = query.eq("tecnico_responsavel_id", filtros.tecnico_id);
  }

  if (filtros.contrato_id) {
    query = query.eq("contrato_id", filtros.contrato_id);
  }

  if (filtros.data_abertura_inicio) {
    query = query.gte("data_abertura", filtros.data_abertura_inicio);
  }

  if (filtros.data_abertura_fim) {
    query = query.lte("data_abertura", filtros.data_abertura_fim);
  }

  if (filtros.busca) {
    query = query.or(`numero.ilike.*${filtros.busca}*,titulo.ilike.*${filtros.busca}*`);
  }

  query = query.order("created_at", { ascending: false });

  const { data, error } = await query;

  if (error) throw error;

  // Buscar quantidade de itens para cada OS
  const osCompletas = await Promise.all(
    (data as any[]).map(async (os) => {
      const { data: itens } = await supabase
        .from("os_itens")
        .select("id")
        .eq("os_id", os.id);

      return {
        ...os,
        total_itens: itens?.length || 0,
      };
    })
  );

  return osCompletas as any;
}

/**
 * Buscar ordem de serviço por ID
 */
export async function buscarOS(
  id: string
): Promise<OrdemServicoCompleta> {
  const { data, error } = await supabase
    .from("assistencia_ordens")
    .select(
      `
      *,
      cliente:cliente_id (
        id,
        nome,
        email,
        telefone
      ),
      tecnico:tecnico_responsavel_id (
        id,
        pessoa:pessoa_id (
          id,
          nome,
          email,
          telefone
        )
      ),
      contrato:contrato_id (
        id,
        numero
      )
    `
    )
    .eq("id", id)
    .single();

  if (error) throw error;

  // Buscar itens e histórico da OS
  const itens = await listarItensOS(id);
  const historico = await listarHistoricoOS(id);

  return {
    ...data,
    total_itens: itens.length,
    itens,
    historico,
  } as any;
}

/**
 * Buscar OS por contrato
 */
export async function buscarOSPorContrato(
  contrato_id: string
): Promise<OrdemServicoCompleta[]> {
  const { data, error } = await supabase
    .from("assistencia_ordens")
    .select(
      `
      *,
      cliente:cliente_id (
        id,
        nome,
        email,
        telefone
      ),
      tecnico:tecnico_responsavel_id (
        id,
        pessoa:pessoa_id (
          id,
          nome,
          email,
          telefone
        )
      )
    `
    )
    .eq("contrato_id", contrato_id)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const osCompletas = await Promise.all(
    (data as any[]).map(async (os) => {
      const { data: itens } = await supabase
        .from("os_itens")
        .select("id")
        .eq("os_id", os.id);

      return {
        ...os,
        total_itens: itens?.length || 0,
      };
    })
  );

  return osCompletas as any;
}

/**
 * Criar ordem de serviço
 */
export async function criarOS(
  payload: OrdemServicoFormData
): Promise<OrdemServico> {
  // Gerar número da OS
  const { data: numeroData, error: numeroError } = await supabase.rpc(
    "gerar_numero_os"
  );

  if (numeroError) throw numeroError;

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .insert({
      numero: numeroData,
      ...payload,
      status: "aberta",
      data_abertura: new Date().toISOString().split("T")[0],
      valor_mao_obra: 0,
      valor_pecas: 0,
      valor_total: 0,
      valor_aprovado_cliente: false,
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(
    data.id,
    "Ordem de serviço criada",
    null,
    "aberta"
  );

  return data as any;
}

/**
 * Atualizar ordem de serviço
 */
export async function atualizarOS(
  id: string,
  payload: Partial<OrdemServicoFormData>
): Promise<OrdemServico> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .update({
      ...payload,
      updated_by: userData?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(id, "Ordem de serviço atualizada");

  return data as any;
}

/**
 * Deletar ordem de serviço
 */
export async function deletarOS(id: string): Promise<void> {
  const { error } = await supabase
    .from("assistencia_ordens")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

/**
 * Alterar status da OS
 */
export async function alterarStatusOS(
  id: string,
  novoStatus: StatusOS,
  observacao?: string
): Promise<OrdemServico> {
  const { data: osAtual } = await supabase
    .from("assistencia_ordens")
    .select("status")
    .eq("id", id)
    .single();

  const statusAnterior = osAtual?.status;
  const { data: userData } = await supabase.auth.getUser();

  const updateData: any = {
    status: novoStatus,
    updated_by: userData?.user?.id,
  };

  // Se marcar como concluída, definir data de conclusÍo
  if (novoStatus === "concluida") {
    updateData.data_conclusao = new Date().toISOString().split("T")[0];
  }

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(
    id,
    observacao || `Status alterado para ${novoStatus}`,
    statusAnterior,
    novoStatus
  );

  return data as any;
}

/**
 * Aprovar orçamento
 */
export async function aprovarOrcamento(id: string): Promise<OrdemServico> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .update({
      valor_aprovado_cliente: true,
      updated_by: userData?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(id, "Orçamento aprovado pelo cliente");

  return data as any;
}

/**
 * Atribuir técnico
 */
export async function atribuirTecnico(
  os_id: string,
  tecnico_id: string
): Promise<OrdemServico> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .update({
      tecnico_responsavel_id: tecnico_id,
      updated_by: userData?.user?.id,
    })
    .eq("id", os_id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(os_id, "Técnico atribuído à OS");

  return data as any;
}

// ============================================================
// ITENS DA OS
// ============================================================

/**
 * Listar itens da OS
 */
export async function listarItensOS(
  os_id: string
): Promise<ItemOSCompleto[]> {
  const { data, error } = await supabase
    .from("os_itens")
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
    .eq("os_id", os_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as any;
}

/**
 * Criar item da OS
 */
export async function criarItemOS(
  os_id: string,
  payload: ItemOSFormData
): Promise<ItemOS> {
  const valor_total = payload.quantidade * payload.valor_unitario;

  const { data, error } = await supabase
    .from("os_itens")
    .insert({
      os_id,
      ...payload,
      valor_total,
      aplicado: false,
    })
    .select()
    .single();

  if (error) throw error;

  // Recalcular valor total da OS
  await recalcularValoresOS(os_id);

  // Registrar no histórico
  await registrarHistorico(os_id, `Item adicionado: ${payload.descricao}`);

  return data as any;
}

/**
 * Atualizar item da OS
 */
export async function atualizarItemOS(
  id: string,
  payload: Partial<ItemOSFormData>
): Promise<ItemOS> {
  const updateData: any = { ...payload };

  // Recalcular valor total se quantidade ou valor unitário foram alterados
  if (payload.quantidade !== undefined || payload.valor_unitario !== undefined) {
    const { data: itemAtual } = await supabase
      .from("os_itens")
      .select("quantidade, valor_unitario, os_id")
      .eq("id", id)
      .single();

    const quantidade = payload.quantidade ?? itemAtual?.quantidade ?? 0;
    const valor_unitario =
      payload.valor_unitario ?? itemAtual?.valor_unitario ?? 0;

    updateData.valor_total = quantidade * valor_unitario;
  }

  const { data, error } = await supabase
    .from("os_itens")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Recalcular valor total da OS
  const { data: itemAtualizado } = await supabase
    .from("os_itens")
    .select("os_id")
    .eq("id", id)
    .single();

  if (itemAtualizado) {
    await recalcularValoresOS(itemAtualizado.os_id);
    await registrarHistorico(itemAtualizado.os_id, "Item atualizado");
  }

  return data as any;
}

/**
 * Deletar item da OS
 */
export async function deletarItemOS(id: string): Promise<void> {
  // Buscar os_id antes de deletar
  const { data: item } = await supabase
    .from("os_itens")
    .select("os_id, descricao")
    .eq("id", id)
    .single();

  const { error } = await supabase
    .from("os_itens")
    .delete()
    .eq("id", id);

  if (error) throw error;

  // Recalcular valor total da OS
  if (item) {
    await recalcularValoresOS(item.os_id);
    await registrarHistorico(item.os_id, `Item removido: ${item.descricao}`);
  }
}

/**
 * Marcar item como aplicado
 */
export async function marcarItemAplicado(
  id: string,
  aplicado: boolean
): Promise<ItemOS> {
  const { data, error } = await supabase
    .from("os_itens")
    .update({ aplicado })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  const { data: item } = await supabase
    .from("os_itens")
    .select("os_id, descricao")
    .eq("id", id)
    .single();

  if (item) {
    await registrarHistorico(
      item.os_id,
      `Item ${aplicado ? "aplicado" : "removido"}: ${item.descricao}`
    );
  }

  return data as any;
}

/**
 * Recalcular valores da OS
 */
async function recalcularValoresOS(os_id: string): Promise<void> {
  const { data: itens } = await supabase
    .from("os_itens")
    .select("valor_total")
    .eq("os_id", os_id);

  const valorPecas = itens?.reduce(
    (acc, item) => acc + (item.valor_total || 0),
    0
  ) || 0;

  // Buscar valor de mÍo de obra atual
  const { data: os } = await supabase
    .from("assistencia_ordens")
    .select("valor_mao_obra")
    .eq("id", os_id)
    .single();

  const valorMaoObra = os?.valor_mao_obra || 0;
  const valorTotal = valorPecas + valorMaoObra;

  await supabase
    .from("assistencia_ordens")
    .update({
      valor_pecas: valorPecas,
      valor_total: valorTotal,
    })
    .eq("id", os_id);
}

/**
 * Atualizar valor de mÍo de obra
 */
export async function atualizarValorMaoObra(
  os_id: string,
  valor: number
): Promise<OrdemServico> {
  const { data: userData } = await supabase.auth.getUser();

  // Buscar valor de peças atual
  const { data: os } = await supabase
    .from("assistencia_ordens")
    .select("valor_pecas")
    .eq("id", os_id)
    .single();

  const valorPecas = os?.valor_pecas || 0;
  const valorTotal = valorPecas + valor;

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .update({
      valor_mao_obra: valor,
      valor_total: valorTotal,
      updated_by: userData?.user?.id,
    })
    .eq("id", os_id)
    .select()
    .single();

  if (error) throw error;

  // Registrar no histórico
  await registrarHistorico(os_id, `Valor de mÍo de obra atualizado: R$ ${valor.toFixed(2)}`);

  return data as any;
}

// ============================================================
// HISTÓRICO
// ============================================================

/**
 * Listar histórico da OS
 */
export async function listarHistoricoOS(
  os_id: string
): Promise<HistoricoOSCompleto[]> {
  const { data, error } = await supabase
    .from("os_historico")
    .select(
      `
      *,
      usuario:usuario_id (
        id,
        pessoa:pessoa_id (
          nome
        )
      )
    `
    )
    .eq("os_id", os_id)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data as any;
}

/**
 * Registrar entrada no histórico
 */
async function registrarHistorico(
  os_id: string,
  descricao: string,
  status_anterior?: StatusOS | null,
  status_novo?: StatusOS | null
): Promise<HistoricoOS> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("os_historico")
    .insert({
      os_id,
      usuario_id: userData?.user?.id,
      descricao,
      status_anterior,
      status_novo,
    })
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas de OS
 */
export async function obterEstatisticasOS(): Promise<OSEstatisticas> {
  const { data: ordens, error } = await supabase
    .from("assistencia_ordens")
    .select("status, valor_total, data_abertura, data_conclusao");

  if (error) throw error;

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const ordensMes = ordens.filter((os: any) => {
    const dataAbertura = new Date(os.data_abertura);
    return dataAbertura >= inicioMes;
  });

  const ordensConcluidas = ordens.filter((os: any) => os.status === "concluida");

  // Calcular tempo médio de atendimento
  const temposAtendimento = ordensConcluidas
    .map((os: any) => {
      if (!os.data_conclusao) return null;
      const dataAbertura = new Date(os.data_abertura);
      const dataConclusao = new Date(os.data_conclusao);
      const diff = dataConclusao.getTime() - dataAbertura.getTime();
      return Math.floor(diff / (1000 * 60 * 60)); // em horas
    })
    .filter((t: any) => t !== null) as number[];

  const tempoMedio =
    temposAtendimento.length > 0
      ? temposAtendimento.reduce((a, b) => a + b, 0) / temposAtendimento.length
      : 0;

  const taxaConclusao =
    ordens.length > 0
      ? (ordensConcluidas.length / ordens.length) * 100
      : 0;

  const stats: OSEstatisticas = {
    total_os: ordens.length,
    os_abertas: ordens.filter((os: any) => os.status === "aberta").length,
    os_em_atendimento: ordens.filter((os: any) => os.status === "em_atendimento").length,
    os_aguardando_peca: ordens.filter((os: any) => os.status === "aguardando_peca").length,
    os_aguardando_cliente: ordens.filter((os: any) => os.status === "aguardando_cliente").length,
    os_concluidas: ordensConcluidas.length,
    os_canceladas: ordens.filter((os: any) => os.status === "cancelada").length,
    tempo_medio_atendimento: Math.round(tempoMedio),
    valor_total_mes: ordensMes.reduce(
      (acc: number, os: any) => acc + (os.valor_total || 0),
      0
    ),
    taxa_conclusao: Math.round(taxaConclusao),
  };

  return stats;
}

/**
 * Listar OS atrasadas
 */
export async function listarOSAtrasadas(): Promise<OrdemServicoCompleta[]> {
  const hoje = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("assistencia_ordens")
    .select(
      `
      *,
      cliente:cliente_id (
        id,
        nome,
        email,
        telefone
      ),
      tecnico:tecnico_responsavel_id (
        id,
        pessoa:pessoa_id (
          id,
          nome,
          email,
          telefone
        )
      )
    `
    )
    .lt("data_previsao", hoje)
    .in("status", ["aberta", "em_atendimento", "aguardando_peca", "aguardando_cliente"])
    .order("data_previsao", { ascending: true });

  if (error) throw error;

  const osCompletas = await Promise.all(
    (data as any[]).map(async (os) => {
      const { data: itens } = await supabase
        .from("os_itens")
        .select("id")
        .eq("os_id", os.id);

      return {
        ...os,
        total_itens: itens?.length || 0,
      };
    })
  );

  return osCompletas as any;
}

/**
 * Duplicar OS
 */
export async function duplicarOS(id: string): Promise<OrdemServico> {
  const osOriginal = await buscarOS(id);

  // Criar nova OS
  const novaOS = await criarOS({
    cliente_id: osOriginal.cliente_id,
    contrato_id: osOriginal.contrato_id || undefined,
    titulo: osOriginal.titulo + " (Cópia)",
    descricao: osOriginal.descricao,
    tipo_atendimento: osOriginal.tipo_atendimento,
    prioridade: osOriginal.prioridade,
    tecnico_responsavel_id: osOriginal.tecnico_responsavel_id || undefined,
    endereco_atendimento: osOriginal.endereco_atendimento || undefined,
    observacoes: osOriginal.observacoes || undefined,
  });

  // Duplicar itens
  if (osOriginal.itens) {
    for (const item of osOriginal.itens) {
      await criarItemOS(novaOS.id, {
        pricelist_item_id: item.pricelist_item_id || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario,
        observacoes: item.observacoes || undefined,
      });
    }
  }

  // Atualizar valor de mÍo de obra
  if (osOriginal.valor_mao_obra > 0) {
    await atualizarValorMaoObra(novaOS.id, osOriginal.valor_mao_obra);
  }

  return novaOS;
}

