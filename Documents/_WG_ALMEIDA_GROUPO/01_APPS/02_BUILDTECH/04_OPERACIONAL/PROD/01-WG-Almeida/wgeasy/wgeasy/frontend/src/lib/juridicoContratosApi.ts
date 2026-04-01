/**
 * =============================================
 * WGEASY - API COMPLEMENTAR DO MÓDULO JURÍDICO
 * =============================================
 * Funcionalidades específicas para o setor Jurídico:
 * - Parcelas de contratos (criaçÍo em lote, pagamentos)
 * - Aditivos contratuais
 * - Alertas de vencimento
 * - Estatísticas do módulo
 * - IntegraçÍo com Financeiro
 *
 * @note Este arquivo complementa o contratosApi.ts existente
 * @version 1.0.0
 * @date 2026-01-07
 */

import { supabase } from "./supabaseClient";

// =============================================
// TIPOS E INTERFACES
// =============================================

export type StatusParcela = "pendente" | "pago" | "atrasado" | "cancelado";
export type TipoAditivo = "valor" | "prazo" | "escopo" | "misto";
export type AlertaVencimento =
  | "sem_vencimento"
  | "vencido"
  | "vence_em_30_dias"
  | "vence_em_60_dias"
  | "vigente";

export interface ContratoParcela {
  id: string;
  contrato_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: StatusParcela;
  forma_pagamento?: string;
  comprovante_url?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ContratoAditivo {
  id: string;
  contrato_id: string;
  numero_aditivo: number;
  tipo: TipoAditivo;
  descricao: string;
  valor_adicional: number;
  dias_adicionais: number;
  nova_previsao_termino?: string;
  data_assinatura?: string;
  arquivo_url?: string;
  created_at: string;
}

export interface ContratoAlerta {
  id: string;
  numero_contrato: string;
  cliente_id?: string;
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  valor_total: number;
  data_vencimento?: string;
  status: string;
  alerta_vencimento: AlertaVencimento;
  dias_para_vencimento?: number;
}

export interface ParcelaInput {
  contrato_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  forma_pagamento?: string;
  observacoes?: string;
}

export interface AditivoInput {
  contrato_id: string;
  tipo: TipoAditivo;
  descricao: string;
  valor_adicional?: number;
  dias_adicionais?: number;
  data_assinatura?: string;
  arquivo_url?: string;
}

export interface EstatisticasJuridico {
  totalContratos: number;
  contratosAtivos: number;
  contratosPendentes: number;
  valorTotalContratos: number;
  valorRecebido: number;
  valorPendente: number;
  parcelasAtrasadas: number;
  contratosVencendo30Dias: number;
  contratosVencidos: number;
}

// =============================================
// PARCELAS DE CONTRATOS
// =============================================

/**
 * Listar parcelas de um contrato
 */
export async function listarParcelas(
  contratoId: string
): Promise<ContratoParcela[]> {
  const { data, error } = await supabase
    .from("contratos_parcelas")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("numero_parcela", { ascending: true });

  if (error) {
    console.error("Erro ao listar parcelas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Criar uma parcela individual
 */
export async function criarParcela(
  input: ParcelaInput
): Promise<ContratoParcela> {
  const { data, error } = await supabase
    .from("contratos_parcelas")
    .insert({
      ...input,
      status: "pendente",
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar parcela:", error);
    throw error;
  }

  return data;
}

/**
 * Criar múltiplas parcelas de uma vez
 * @param contratoId - ID do contrato
 * @param valorTotal - Valor total a ser parcelado
 * @param numParcelas - Número de parcelas
 * @param dataInicial - Data da primeira parcela (YYYY-MM-DD)
 * @param intervaloMeses - Intervalo entre parcelas em meses (padrÍo: 1)
 */
export async function criarParcelasEmLote(
  contratoId: string,
  valorTotal: number,
  numParcelas: number,
  dataInicial: string,
  intervaloMeses: number = 1
): Promise<ContratoParcela[]> {
  const valorParcela = Math.round((valorTotal / numParcelas) * 100) / 100;
  const parcelas: Omit<ContratoParcela, "id" | "created_at" | "updated_at">[] = [];

  for (let i = 0; i < numParcelas; i++) {
    const dataVencimento = new Date(dataInicial);
    dataVencimento.setMonth(dataVencimento.getMonth() + i * intervaloMeses);

    // Ajustar para não cair em fim de semana
    const diaSemana = dataVencimento.getDay();
    if (diaSemana === 0) dataVencimento.setDate(dataVencimento.getDate() + 1); // Domingo -> Segunda
    if (diaSemana === 6) dataVencimento.setDate(dataVencimento.getDate() + 2); // Sábado -> Segunda

    parcelas.push({
      contrato_id: contratoId,
      numero_parcela: i + 1,
      valor:
        i === numParcelas - 1
          ? Math.round((valorTotal - valorParcela * (numParcelas - 1)) * 100) / 100
          : valorParcela,
      data_vencimento: dataVencimento.toISOString().split("T")[0],
      status: "pendente",
    });
  }

  const { data, error } = await supabase
    .from("contratos_parcelas")
    .insert(parcelas)
    .select();

  if (error) {
    console.error("Erro ao criar parcelas em lote:", error);
    throw error;
  }

  return data || [];
}

/**
 * Marcar parcela como paga
 */
export async function marcarParcelaPaga(
  parcelaId: string,
  dataPagamento?: string,
  formaPagamento?: string,
  comprovanteUrl?: string
): Promise<ContratoParcela> {
  const { data, error } = await supabase
    .from("contratos_parcelas")
    .update({
      status: "pago",
      data_pagamento: dataPagamento || new Date().toISOString().split("T")[0],
      forma_pagamento: formaPagamento,
      comprovante_url: comprovanteUrl,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parcelaId)
    .select()
    .single();

  if (error) {
    console.error("Erro ao marcar parcela como paga:", error);
    throw error;
  }

  // Atualizar valor_pago no contrato
  await atualizarValorPagoContrato(data.contrato_id);

  return data;
}

/**
 * Cancelar parcela
 */
export async function cancelarParcela(
  parcelaId: string,
  motivo?: string
): Promise<ContratoParcela> {
  const { data, error } = await supabase
    .from("contratos_parcelas")
    .update({
      status: "cancelado",
      observacoes: motivo,
      updated_at: new Date().toISOString(),
    })
    .eq("id", parcelaId)
    .select()
    .single();

  if (error) {
    console.error("Erro ao cancelar parcela:", error);
    throw error;
  }

  return data;
}

/**
 * Excluir parcela
 */
export async function excluirParcela(parcelaId: string): Promise<void> {
  const { error } = await supabase
    .from("contratos_parcelas")
    .delete()
    .eq("id", parcelaId);

  if (error) {
    console.error("Erro ao excluir parcela:", error);
    throw error;
  }
}

/**
 * Excluir todas as parcelas de um contrato
 */
export async function excluirTodasParcelas(contratoId: string): Promise<void> {
  const { error } = await supabase
    .from("contratos_parcelas")
    .delete()
    .eq("contrato_id", contratoId);

  if (error) {
    console.error("Erro ao excluir parcelas:", error);
    throw error;
  }
}

/**
 * Buscar parcelas atrasadas (todas ou de um contrato específico)
 */
export async function buscarParcelasAtrasadas(
  contratoId?: string
): Promise<ContratoParcela[]> {
  const hoje = new Date().toISOString().split("T")[0];

  let query = supabase
    .from("contratos_parcelas")
    .select("*")
    .eq("status", "pendente")
    .lt("data_vencimento", hoje)
    .order("data_vencimento", { ascending: true });

  if (contratoId) {
    query = query.eq("contrato_id", contratoId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao buscar parcelas atrasadas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Atualizar automaticamente status de parcelas atrasadas
 */
export async function atualizarParcelasAtrasadas(): Promise<number> {
  const hoje = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("contratos_parcelas")
    .update({ status: "atrasado", updated_at: new Date().toISOString() })
    .eq("status", "pendente")
    .lt("data_vencimento", hoje)
    .select();

  if (error) {
    console.error("Erro ao atualizar parcelas atrasadas:", error);
    return 0;
  }

  return data?.length || 0;
}

/**
 * Atualizar valor pago do contrato baseado nas parcelas pagas
 */
async function atualizarValorPagoContrato(contratoId: string): Promise<void> {
  const { data: parcelas, error: errorParcelas } = await supabase
    .from("contratos_parcelas")
    .select("valor")
    .eq("contrato_id", contratoId)
    .eq("status", "pago");

  if (errorParcelas) {
    console.error("Erro ao buscar parcelas pagas:", errorParcelas);
    return;
  }

  const valorPago = parcelas?.reduce((sum, p) => sum + Number(p.valor), 0) || 0;

  await supabase
    .from("contratos")
    .update({ valor_pago: valorPago, updated_at: new Date().toISOString() })
    .eq("id", contratoId);
}

// =============================================
// ADITIVOS DE CONTRATOS
// =============================================

/**
 * Listar aditivos de um contrato
 */
export async function listarAditivos(
  contratoId: string
): Promise<ContratoAditivo[]> {
  const { data, error } = await supabase
    .from("contratos_aditivos")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("numero_aditivo", { ascending: true });

  if (error) {
    console.error("Erro ao listar aditivos:", error);
    throw error;
  }

  return data || [];
}

/**
 * Criar aditivo de contrato
 */
export async function criarAditivo(
  input: AditivoInput
): Promise<ContratoAditivo> {
  // Buscar próximo número de aditivo
  const { data: aditivos } = await supabase
    .from("contratos_aditivos")
    .select("numero_aditivo")
    .eq("contrato_id", input.contrato_id)
    .order("numero_aditivo", { ascending: false })
    .limit(1);

  const numeroAditivo = (aditivos?.[0]?.numero_aditivo || 0) + 1;

  // Calcular nova previsÍo de término se houver dias adicionais
  let novaPrevisaoTermino: string | undefined;
  if (input.dias_adicionais && input.dias_adicionais > 0) {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("previsao_termino")
      .eq("id", input.contrato_id)
      .single();

    if (contrato?.previsao_termino) {
      const dataTermino = new Date(contrato.previsao_termino);
      // Adicionar dias (simplificado, sem considerar feriados)
      let diasAdicionados = 0;
      while (diasAdicionados < input.dias_adicionais) {
        dataTermino.setDate(dataTermino.getDate() + 1);
        const diaSemana = dataTermino.getDay();
        if (diaSemana !== 0 && diaSemana !== 6) {
          diasAdicionados++;
        }
      }
      novaPrevisaoTermino = dataTermino.toISOString().split("T")[0];
    }
  }

  const { data, error } = await supabase
    .from("contratos_aditivos")
    .insert({
      contrato_id: input.contrato_id,
      numero_aditivo: numeroAditivo,
      tipo: input.tipo,
      descricao: input.descricao,
      valor_adicional: input.valor_adicional || 0,
      dias_adicionais: input.dias_adicionais || 0,
      nova_previsao_termino: novaPrevisaoTermino,
      data_assinatura: input.data_assinatura,
      arquivo_url: input.arquivo_url,
    })
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar aditivo:", error);
    throw error;
  }

  // Atualizar contrato com novos valores
  const atualizacoes: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (input.valor_adicional && input.valor_adicional > 0) {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("valor_total")
      .eq("id", input.contrato_id)
      .single();

    if (contrato) {
      atualizacoes.valor_total = (contrato.valor_total || 0) + input.valor_adicional;
    }
  }

  if (novaPrevisaoTermino) {
    atualizacoes.previsao_termino = novaPrevisaoTermino;
  }

  if (Object.keys(atualizacoes).length > 1) {
    await supabase
      .from("contratos")
      .update(atualizacoes)
      .eq("id", input.contrato_id);
  }

  return data;
}

/**
 * Excluir aditivo
 */
export async function excluirAditivo(aditivoId: string): Promise<void> {
  const { error } = await supabase
    .from("contratos_aditivos")
    .delete()
    .eq("id", aditivoId);

  if (error) {
    console.error("Erro ao excluir aditivo:", error);
    throw error;
  }
}

// =============================================
// ALERTAS DE VENCIMENTO
// =============================================

/**
 * Buscar contratos com alertas de vencimento
 * Usa view contratos_alertas se existir, senão calcula manualmente
 */
export async function buscarContratosComAlertas(): Promise<ContratoAlerta[]> {
  // Tentar usar a view
  const { data: viewData, error: viewError } = await supabase
    .from("contratos_alertas")
    .select("*")
    .order("dias_para_vencimento", { ascending: true });

  if (!viewError && viewData) {
    return viewData;
  }

  // Fallback: calcular manualmente
  const hoje = new Date();
  const em30Dias = new Date(hoje);
  em30Dias.setDate(em30Dias.getDate() + 30);
  const em60Dias = new Date(hoje);
  em60Dias.setDate(em60Dias.getDate() + 60);

  const { data: contratos, error } = await supabase
    .from("contratos")
    .select(`
      id,
      numero_contrato,
      cliente_id,
      cliente_nome,
      valor_total,
      data_vencimento,
      status
    `)
    .in("status", ["assinado", "em_execucao", "ativo", "aguardando", "em_andamento"])
    .not("data_vencimento", "is", null)
    .order("data_vencimento", { ascending: true });

  if (error) {
    console.error("Erro ao buscar contratos para alertas:", error);
    return [];
  }

  return (contratos || []).map((c) => {
    const dataVenc = c.data_vencimento ? new Date(c.data_vencimento) : null;
    let alerta: AlertaVencimento = "sem_vencimento";
    let diasPara: number | undefined;

    if (dataVenc) {
      diasPara = Math.ceil((dataVenc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

      if (diasPara < 0) {
        alerta = "vencido";
      } else if (diasPara <= 30) {
        alerta = "vence_em_30_dias";
      } else if (diasPara <= 60) {
        alerta = "vence_em_60_dias";
      } else {
        alerta = "vigente";
      }
    }

    return {
      id: c.id,
      numero_contrato: c.numero_contrato,
      cliente_id: c.cliente_id,
      cliente_nome: c.cliente_nome,
      valor_total: c.valor_total,
      data_vencimento: c.data_vencimento,
      status: c.status,
      alerta_vencimento: alerta,
      dias_para_vencimento: diasPara,
    };
  });
}

/**
 * Buscar apenas contratos vencidos
 */
export async function buscarContratosVencidos(): Promise<ContratoAlerta[]> {
  const alertas = await buscarContratosComAlertas();
  return alertas.filter((a) => a.alerta_vencimento === "vencido");
}

/**
 * Buscar contratos próximos do vencimento (30 dias)
 */
export async function buscarContratosProximosVencimento(): Promise<ContratoAlerta[]> {
  const alertas = await buscarContratosComAlertas();
  return alertas.filter(
    (a) => a.alerta_vencimento === "vence_em_30_dias" || a.alerta_vencimento === "vence_em_60_dias"
  );
}

// =============================================
// ESTATÍSTICAS DO MÓDULO JURÍDICO
// =============================================

/**
 * Obter estatísticas completas do módulo jurídico
 */
export async function obterEstatisticasJuridico(): Promise<EstatisticasJuridico> {
  // Total de contratos
  const { count: totalContratos } = await supabase
    .from("contratos")
    .select("*", { count: "exact", head: true });

  // Contratos ativos (assinados ou em execuçÍo)
  const { count: contratosAtivos } = await supabase
    .from("contratos")
    .select("*", { count: "exact", head: true })
    .in("status", ["assinado", "em_execucao", "ativo", "aguardando", "em_andamento"]);

  // Contratos pendentes de assinatura
  const { count: contratosPendentes } = await supabase
    .from("contratos")
    .select("*", { count: "exact", head: true })
    .eq("status", "pendente_assinatura");

  // Valores totais
  const { data: valores } = await supabase
    .from("contratos")
    .select("valor_total, valor_pago")
    .in("status", ["assinado", "em_execucao", "concluido", "ativo", "aguardando", "em_andamento"]);

  const valorTotalContratos = valores?.reduce((sum, c) => sum + Number(c.valor_total || 0), 0) || 0;
  const valorRecebido = valores?.reduce((sum, c) => sum + Number(c.valor_pago || 0), 0) || 0;
  const valorPendente = valorTotalContratos - valorRecebido;

  // Parcelas atrasadas
  const parcelasAtrasadasList = await buscarParcelasAtrasadas();
  const parcelasAtrasadas = parcelasAtrasadasList.length;

  // Contratos com alertas
  const alertas = await buscarContratosComAlertas();
  const contratosVencendo30Dias = alertas.filter(
    (a) => a.alerta_vencimento === "vence_em_30_dias"
  ).length;
  const contratosVencidos = alertas.filter(
    (a) => a.alerta_vencimento === "vencido"
  ).length;

  return {
    totalContratos: totalContratos || 0,
    contratosAtivos: contratosAtivos || 0,
    contratosPendentes: contratosPendentes || 0,
    valorTotalContratos,
    valorRecebido,
    valorPendente,
    parcelasAtrasadas,
    contratosVencendo30Dias,
    contratosVencidos,
  };
}

// =============================================
// INTEGRAÇÍO COM FINANCEIRO
// =============================================

/**
 * Gerar lançamentos financeiros a partir das parcelas do contrato
 */
export async function gerarLancamentosFinanceiros(
  contratoId: string
): Promise<{ sucesso: boolean; mensagem: string; lancamentos?: number }> {
  try {
    // Buscar contrato
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .select("id, numero_contrato, cliente_id, cliente_nome")
      .eq("id", contratoId)
      .single();

    if (contratoError || !contrato) {
      return { sucesso: false, mensagem: "Contrato não encontrado" };
    }

    // Buscar parcelas pendentes
    const parcelas = await listarParcelas(contratoId);
    const parcelasPendentes = parcelas.filter((p) => p.status === "pendente");

    if (parcelasPendentes.length === 0) {
      return { sucesso: false, mensagem: "Nenhuma parcela pendente encontrada" };
    }

    // Verificar se tabela de lançamentos existe
    const { error: checkError } = await supabase
      .from("financeiro_lancamentos")
      .select("id")
      .limit(1);

    if (checkError) {
      return { sucesso: false, mensagem: "Módulo financeiro não configurado" };
    }

    // Criar lançamentos para cada parcela
    const lancamentos = parcelasPendentes.map((parcela) => ({
      tipo: "RECEITA",
      categoria: "CONTRATO",
      descricao: `${contrato.numero_contrato} - Parcela ${parcela.numero_parcela}`,
      valor: parcela.valor,
      data_vencimento: parcela.data_vencimento,
      status: "PENDENTE",
      pessoa_id: contrato.cliente_id,
      referencia_tipo: "contrato_parcela",
      referencia_id: parcela.id,
      observacoes: `Gerado automaticamente do contrato ${contrato.numero_contrato}`,
    }));

    const { error: insertError } = await supabase
      .from("financeiro_lancamentos")
      .insert(lancamentos);

    if (insertError) {
      console.error("Erro ao criar lançamentos:", insertError);
      return { sucesso: false, mensagem: "Erro ao criar lançamentos financeiros" };
    }

    return {
      sucesso: true,
      mensagem: `${lancamentos.length} lançamentos criados com sucesso`,
      lancamentos: lancamentos.length,
    };
  } catch (error) {
    console.error("Erro ao gerar lançamentos:", error);
    return { sucesso: false, mensagem: "Erro inesperado ao gerar lançamentos" };
  }
}

/**
 * Sincronizar pagamento de parcela com financeiro
 */
export async function sincronizarPagamentoFinanceiro(
  parcelaId: string
): Promise<boolean> {
  try {
    // Buscar lançamento vinculado à parcela
    const { data: lancamento, error } = await supabase
      .from("financeiro_lancamentos")
      .select("id")
      .eq("referencia_tipo", "contrato_parcela")
      .eq("referencia_id", parcelaId)
      .single();

    if (error || !lancamento) {
      return false;
    }

    // Buscar dados da parcela
    const { data: parcela } = await supabase
      .from("contratos_parcelas")
      .select("status, data_pagamento")
      .eq("id", parcelaId)
      .single();

    if (!parcela) {
      return false;
    }

    // Atualizar lançamento
    await supabase
      .from("financeiro_lancamentos")
      .update({
        status: parcela.status === "pago" ? "PAGO" : "PENDENTE",
        data_pagamento: parcela.data_pagamento,
        updated_at: new Date().toISOString(),
      })
      .eq("id", lancamento.id);

    return true;
  } catch {
    return false;
  }
}

// =============================================
// EXPORTAÇÕES
// =============================================

export const juridicoContratosApi = {
  // Parcelas
  listarParcelas,
  criarParcela,
  criarParcelasEmLote,
  marcarParcelaPaga,
  cancelarParcela,
  excluirParcela,
  excluirTodasParcelas,
  buscarParcelasAtrasadas,
  atualizarParcelasAtrasadas,

  // Aditivos
  listarAditivos,
  criarAditivo,
  excluirAditivo,

  // Alertas
  buscarContratosComAlertas,
  buscarContratosVencidos,
  buscarContratosProximosVencimento,

  // Estatísticas
  obterEstatisticasJuridico,

  // Financeiro
  gerarLancamentosFinanceiros,
  sincronizarPagamentoFinanceiro,
};

export default juridicoContratosApi;


