import { supabase } from "@/lib/supabaseClient";

// =============================================
// TIPOS DE DADOS
// =============================================

export type TipoSolicitante = "CLIENTE" | "COLABORADOR" | "FORNECEDOR";
export type TipoProcesso =
  | "TRABALHISTA"
  | "CLIENTE_CONTRA_EMPRESA"
  | "EMPRESA_CONTRA_CLIENTE"
  | "INTERMEDIACAO"
  | "OUTRO";
export type StatusAssistencia =
  | "PENDENTE"
  | "EM_ANALISE"
  | "EM_ANDAMENTO"
  | "RESOLVIDO"
  | "ARQUIVADO";
export type Prioridade = "BAIXA" | "MEDIA" | "ALTA" | "URGENTE";

export type TipoLancamento =
  | "HONORARIO"
  | "CUSTAS"
  | "TAXA"
  | "ACORDO"
  | "MULTA"
  | "OUTROS"
  | "MENSALIDADE";
export type Natureza = "RECEITA" | "DESPESA";
export type StatusFinanceiro =
  | "PENDENTE"
  | "PAGO"
  | "PARCIAL"
  | "CANCELADO"
  | "ATRASADO";

export interface AssistenciaJuridica {
  id: string;
  tipo_solicitante: TipoSolicitante;
  solicitante_id: string;
  tipo_processo: TipoProcesso;
  titulo: string;
  descricao: string | null;
  status: StatusAssistencia;
  prioridade: Prioridade;
  numero_processo: string | null;
  vara: string | null;
  comarca: string | null;
  advogado_responsavel: string | null;
  valor_causa: number;
  valor_acordo: number | null;
  data_abertura: string;
  data_audiencia: string | null;
  data_encerramento: string | null;
  observacoes: string | null;
  criado_por: string | null;
  atualizado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceiroJuridico {
  id: string;
  assistencia_id: string | null;
  contrato_id: string | null;
  tipo: TipoLancamento;
  natureza: Natureza;
  descricao: string;
  observacoes: string | null;
  valor: number;
  valor_pago: number;
  data_competencia: string;
  data_vencimento: string;
  data_pagamento: string | null;
  status: StatusFinanceiro;
  parcela_atual: number;
  total_parcelas: number;
  pessoa_id: string | null;
  empresa_id: string | null;
  nucleo: string | null;
  sincronizado_financeiro: boolean;
  financeiro_lancamento_id: string | null;
  criado_por: string | null;
  atualizado_por: string | null;
  created_at: string;
  updated_at: string;
}

export interface FinanceiroJuridicoDetalhado extends FinanceiroJuridico {
  pessoa_nome: string | null;
  pessoa_tipo: string | null;
  pessoa_cpf: string | null;
  pessoa_cnpj: string | null;
  empresa_nome: string | null;
  assistencia_titulo: string | null;
  numero_processo: string | null;
  contrato_numero: string | null;
  dias_atraso: number;
}

export interface PaginationParams {
  pageSize?: number;
  offset?: number;
}

export interface FilterParams {
  status?: StatusAssistencia;
  prioridade?: Prioridade;
  tipo_processo?: TipoProcesso;
  tipo_solicitante?: TipoSolicitante;
  busca?: string;
}

export interface FinanceiroFilterParams {
  status?: StatusFinanceiro;
  tipo?: TipoLancamento;
  natureza?: Natureza;
  mes?: string;
  busca?: string;
}

export interface SortParams {
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// =============================================
// ASSISTENCIA JURIDICA - CRUD
// =============================================

export async function listarAssistencias(
  pagination: PaginationParams = {},
  filters: FilterParams = {},
  sort: SortParams = {}
) {
  const { pageSize = 10, offset = 0 } = pagination;
  const { status, prioridade, tipo_processo, tipo_solicitante, busca } =
    filters;
  const { sortBy = "data_abertura", sortOrder = "desc" } = sort;

  let query = supabase
    .from("assistencia_juridica")
    .select("*", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (prioridade) query = query.eq("prioridade", prioridade);
  if (tipo_processo) query = query.eq("tipo_processo", tipo_processo);
  if (tipo_solicitante) query = query.eq("tipo_solicitante", tipo_solicitante);

  if (busca) {
    query = query.or(
      `titulo.ilike.%${busca}%,descricao.ilike.%${busca}%,numero_processo.ilike.%${busca}%`
    );
  }

  query = query.order(sortBy, { ascending: sortOrder === "asc" });
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data as AssistenciaJuridica[],
    count: count || 0,
    pageSize,
    offset,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: Math.floor(offset / pageSize) + 1,
  };
}

export async function obterAssistencia(id: string) {
  const { data, error } = await supabase
    .from("assistencia_juridica")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as AssistenciaJuridica;
}

export async function criarAssistencia(
  dados: Omit<AssistenciaJuridica, "id" | "created_at" | "updated_at">
) {
  const { data, error } = await supabase
    .from("assistencia_juridica")
    .insert([dados])
    .select()
    .single();

  if (error) throw error;
  return data as AssistenciaJuridica;
}

export async function atualizarAssistencia(
  id: string,
  dados: Partial<Omit<AssistenciaJuridica, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("assistencia_juridica")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as AssistenciaJuridica;
}

export async function deletarAssistencia(id: string) {
  const { error } = await supabase
    .from("assistencia_juridica")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// FINANCEIRO JURIDICO - CRUD
// =============================================

export async function listarFinanceiroJuridico(
  pagination: PaginationParams = {},
  filters: FinanceiroFilterParams = {},
  sort: SortParams = {}
) {
  const { pageSize = 10, offset = 0 } = pagination;
  const { status, tipo, natureza, mes, busca } = filters;
  const { sortBy = "data_vencimento", sortOrder = "desc" } = sort;

  let query = supabase
    .from("vw_financeiro_juridico_detalhado")
    .select("*", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (tipo) query = query.eq("tipo", tipo);
  if (natureza) query = query.eq("natureza", natureza);

  if (mes) {
    const [ano, mês] = mes.split("-");
    query = query.gte("data_competencia", `${ano}-${mês}-01`);
    query = query.lt("data_competencia", `${ano}-${parseInt(mês) + 1}-01`);
  }

  if (busca) {
    query = query.or(
      `descricao.ilike.%${busca}%,observacoes.ilike.%${busca}%,pessoa_nome.ilike.%${busca}%,assistencia_titulo.ilike.%${busca}%`
    );
  }

  query = query.order(sortBy, { ascending: sortOrder === "asc" });
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data as FinanceiroJuridicoDetalhado[],
    count: count || 0,
    pageSize,
    offset,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: Math.floor(offset / pageSize) + 1,
  };
}

export async function obterFinanceiroJuridico(id: string) {
  const { data, error } = await supabase
    .from("vw_financeiro_juridico_detalhado")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data as FinanceiroJuridicoDetalhado;
}

export async function criarLancamentoJuridico(
  dados: Omit<
    FinanceiroJuridico,
    | "id"
    | "created_at"
    | "updated_at"
    | "sincronizado_financeiro"
    | "financeiro_lancamento_id"
  >
) {
  const { data, error } = await supabase
    .from("financeiro_juridico")
    .insert([
      {
        ...dados,
        sincronizado_financeiro: false,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data as FinanceiroJuridico;
}

export async function atualizarLancamentoJuridico(
  id: string,
  dados: Partial<Omit<FinanceiroJuridico, "id" | "created_at" | "updated_at">>
) {
  const { data, error } = await supabase
    .from("financeiro_juridico")
    .update(dados)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as FinanceiroJuridico;
}

export async function deletarLancamentoJuridico(id: string) {
  const { error } = await supabase
    .from("financeiro_juridico")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

// =============================================
// VIEWS E RELATÓRIOS
// =============================================

export async function obterResumoFinanceiroJuridico() {
  const { data, error } = await supabase
    .from("vw_financeiro_juridico_resumo")
    .select("*")
    .order("mes_referencia", { ascending: false })
    .limit(12);

  if (error) throw error;
  return data;
}

export async function obterEstatisticasAssistencia() {
  const { data, error } = await supabase.rpc("get_juridico_statistics");

  if (error) {
    console.warn("Statistics function not available, returning null");
    return null;
  }

  return data;
}

// =============================================
// HISTORICO
// =============================================

export async function obterHistoricoAssistencia(assistencia_id: string) {
  const { data, error } = await supabase
    .from("assistencia_juridica_historico")
    .select("*")
    .eq("assistencia_id", assistencia_id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function adicionarMovimentacaoHistorico(
  assistencia_id: string,
  tipo_movimentacao: string,
  descricao: string,
  usuario_id?: string,
  usuario_nome?: string
) {
  const { data, error } = await supabase
    .from("assistencia_juridica_historico")
    .insert([
      {
        assistencia_id,
        tipo_movimentacao,
        descricao,
        usuario_id,
        usuario_nome,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

// =============================================
// CONTRATOS - CRUD
// =============================================

export interface Contrato {
  id: string;
  numero_contrato: string;
  tipo_contrato: string;
  cliente_id: string;
  proposta_id?: string;
  projeto_id?: string;
  valor_total: number;
  valor_pago: number;
  valor_pendente: number;
  data_assinatura?: string;
  previsao_inicio?: string;
  dias_uteis?: number;
  previsao_termino?: string;
  data_vencimento?: string;
  status: string;
  descricao?: string;
  objeto?: string;
  observacoes?: string;
  arquivo_pdf_url?: string;
  arquivo_assinado_url?: string;
  drive_link?: string;
  created_at: string;
  updated_at: string;
}

export async function listarContratos(
  pagination: PaginationParams = {},
  filters: Partial<Pick<Contrato, "status" | "tipo_contrato" | "cliente_id">> = {},
  sort: SortParams = {}
) {
  const { pageSize = 10, offset = 0 } = pagination;
  const { status, tipo_contrato, cliente_id } = filters;
  const { sortBy = "created_at", sortOrder = "desc" } = sort;

  let query = supabase
    .from("contratos")
    .select("*", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (tipo_contrato) query = query.eq("tipo_contrato", tipo_contrato);
  if (cliente_id) query = query.eq("cliente_id", cliente_id);

  query = query.order(sortBy, { ascending: sortOrder === "asc" });
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    data: data as Contrato[],
    count: count || 0,
    pageSize,
    offset,
    totalPages: Math.ceil((count || 0) / pageSize),
    currentPage: Math.floor(offset / pageSize) + 1,
  };
}

export async function obterContrato(id: string) {
  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data as Contrato;
}

export async function criarContrato(
  dados: Omit<Contrato, "id" | "created_at" | "updated_at" | "valor_pendente"> // valor_pendente é calculado
) {
  const { data, error } = await supabase
    .from("contratos")
    .insert([{
      ...dados,
      tipo_contrato: dados.tipo_contrato || "servico", // fallback para tipo_contrato
    }])
    .select()
    .single();
  if (error) throw error;
  return data as Contrato;
}

export async function atualizarContrato(
  id: string,
  dados: Partial<Omit<Contrato, "id" | "created_at" | "updated_at" | "valor_pendente">>
) {
  const { data, error } = await supabase
    .from("contratos")
    .update(dados)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as Contrato;
}

export async function deletarContrato(id: string) {
  const { error } = await supabase
    .from("contratos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// =============================================
// CONTRATO PARCELAS - CRUD
// =============================================

export interface ContratoParcela {
  id: string;
  contrato_id: string;
  numero_parcela: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: string;
  forma_pagamento?: string;
}

export async function listarParcelasContrato(contrato_id: string) {
  const { data, error } = await supabase
    .from("contrato_parcelas")
    .select("*")
    .eq("contrato_id", contrato_id)
    .order("numero_parcela", { ascending: true });
  if (error) throw error;
  return data as ContratoParcela[];
}

export async function criarParcelaContrato(
  dados: Omit<ContratoParcela, "id">
) {
  const { data, error } = await supabase
    .from("contrato_parcelas")
    .insert([dados])
    .select()
    .single();
  if (error) throw error;
  return data as ContratoParcela;
}

export async function atualizarParcelaContrato(
  id: string,
  dados: Partial<Omit<ContratoParcela, "id">>
) {
  const { data, error } = await supabase
    .from("contrato_parcelas")
    .update(dados)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ContratoParcela;
}

export async function deletarParcelaContrato(id: string) {
  const { error } = await supabase
    .from("contrato_parcelas")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// =============================================
// CONTRATO ADITIVOS - CRUD
// =============================================

export interface ContratoAditivo {
  id: string;
  contrato_id: string;
  numero_aditivo: number;
  tipo: string;
  descricao: string;
  valor_adicional: number;
  dias_adicionais: number;
  nova_previsao_termino?: string;
  data_assinatura?: string;
  arquivo_url?: string;
  created_at: string;
}

export async function listarAditivosContrato(contrato_id: string) {
  const { data, error } = await supabase
    .from("contrato_aditivos")
    .select("*")
    .eq("contrato_id", contrato_id)
    .order("numero_aditivo", { ascending: true });
  if (error) throw error;
  return data as ContratoAditivo[];
}

export async function criarAditivoContrato(
  dados: Omit<ContratoAditivo, "id" | "created_at"> // created_at é automático
) {
  const { data, error } = await supabase
    .from("contrato_aditivos")
    .insert([dados])
    .select()
    .single();
  if (error) throw error;
  return data as ContratoAditivo;
}

export async function atualizarAditivoContrato(
  id: string,
  dados: Partial<Omit<ContratoAditivo, "id" | "created_at">>
) {
  const { data, error } = await supabase
    .from("contrato_aditivos")
    .update(dados)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ContratoAditivo;
}

export async function deletarAditivoContrato(id: string) {
  const { error } = await supabase
    .from("contrato_aditivos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// =============================================
// CONTRATOS ALERTAS - VIEW
// =============================================

export async function listarContratosAlertas() {
  const { data, error } = await supabase
    .from("contratos_alertas")
    .select("*")
    .order("data_vencimento", { ascending: true });
  if (error) throw error;
  return data;
}
