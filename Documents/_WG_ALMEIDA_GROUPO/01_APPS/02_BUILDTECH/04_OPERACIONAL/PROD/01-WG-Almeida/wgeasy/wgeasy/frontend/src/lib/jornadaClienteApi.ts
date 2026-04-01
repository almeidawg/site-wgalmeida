// ============================================================
// API: Jornada do Cliente
// Sistema WG Easy - Grupo WG Almeida
// Single Source of Truth: Oportunidade → Contrato → Núcleos
// ============================================================

import { supabase } from "./supabaseClient";

// ============================================================
// TIPOS
// ============================================================

export type Nucleo = "arquitetura" | "engenharia" | "marcenaria";

export type StatusKanban =
  | "backlog"
  | "briefing"
  | "levantamento"
  | "medicao"
  | "projeto"
  | "revisao"
  | "aprovacao"
  | "compras"
  | "producao"
  | "execucao"
  | "montagem"
  | "acabamento"
  | "concluido";

export interface CardNucleo {
  id: string;
  contrato_id: string;
  oportunidade_id?: string;
  nucleo: Nucleo;
  status_kanban: StatusKanban;
  progresso: number;
  data_inicio?: string;
  data_previsao?: string;
  data_conclusao?: string;
  valor_previsto: number;
  valor_executado: number;
  dados_especificos?: Record<string, any>;
  observacoes?: string;
  responsavel_id?: string;
  criado_em: string;
  // Joins
  contrato_numero?: string;
  contrato_titulo?: string;
  cliente_id?: string;
  cliente_nome?: string;
  oportunidade_titulo?: string;
  area_total?: number;
  tipo_projeto?: string;
  endereco_obra?: string;
  responsavel_nome?: string;
}

export interface TimelineEvento {
  id: string;
  oportunidade_id: string;
  contrato_id?: string;
  nucleo?: Nucleo;
  origem: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  dados?: Record<string, any>;
  arquivo_url?: string;
  arquivo_tipo?: string;
  visivel_cliente: boolean;
  destaque: boolean;
  usuario_id?: string;
  usuario_nome?: string;
  criado_em: string;
}

export interface StatusKanbanConfig {
  id: string;
  nucleo: Nucleo;
  codigo: string;
  titulo: string;
  cor: string;
  ordem: number;
  ativo: boolean;
}

export interface OportunidadeCompleta {
  id: string;
  titulo: string;
  cliente_id: string;
  cliente_nome?: string;
  status: string;
  estagio?: string;
  valor: number;
  // Dados do projeto
  tipo_projeto?: string;
  tipo_imovel?: string;
  area_total?: number;
  padrao_construtivo?: string;
  endereco_obra?: string;
  // Referências
  analise_projeto_id?: string;
  proposta_id?: string;
  contrato_id?: string;
  // Progresso
  progresso_geral: number;
  progresso_arquitetura: number;
  progresso_engenharia: number;
  progresso_marcenaria: number;
  // Valores
  valor_arquitetura: number;
  valor_engenharia: number;
  valor_marcenaria: number;
  valor_total_executado: number;
  // Dados extras
  dados_imovel?: Record<string, any>;
  dados_projeto?: Record<string, any>;
  // Timeline
  timeline?: TimelineEvento[];
  // Cards por núcleo
  nucleos?: CardNucleo[];
}

// ============================================================
// CARDS POR NÚCLEO (KANBAN)
// ============================================================

/**
 * Listar cards de um núcleo específico (para Kanban)
 */
export async function listarCardsNucleo(nucleo: Nucleo): Promise<CardNucleo[]> {
  const viewName = `view_kanban_${nucleo}`;

  const { data, error } = await supabase
    .from(viewName)
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    // Se view não existir, buscar direto da tabela
    console.warn(`View ${viewName} não existe, buscando direto:`, error);
    return buscarCardsNucleoDireto(nucleo);
  }

  return data || [];
}

/**
 * Buscar cards direto da tabela (fallback)
 */
async function buscarCardsNucleoDireto(nucleo: Nucleo): Promise<CardNucleo[]> {
  const { data, error } = await supabase
    .from("contratos_nucleos")
    .select(`
      *,
      contrato:contratos(numero, cliente_id),
      oportunidade:oportunidades(titulo, area_total, tipo_projeto, endereco_obra),
      responsavel:pessoas(nome)
    `)
    .eq("nucleo", nucleo)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  // Buscar nomes dos clientes
  const clienteIds = data?.map((d: any) => d.contrato?.cliente_id).filter(Boolean) || [];
  let clientesMap = new Map();

  if (clienteIds.length > 0) {
    const { data: clientes } = await supabase
      .from("pessoas")
      .select("id, nome")
      .in("id", clienteIds);
    clientesMap = new Map(clientes?.map((c: any) => [c.id, c.nome]) || []);
  }

  return (data || []).map((item: any) => ({
    ...item,
    contrato_numero: item.contrato?.numero,
    contrato_titulo: item.contrato?.numero,
    cliente_id: item.contrato?.cliente_id,
    cliente_nome: clientesMap.get(item.contrato?.cliente_id) || null,
    oportunidade_titulo: item.oportunidade?.titulo,
    area_total: item.oportunidade?.area_total,
    tipo_projeto: item.oportunidade?.tipo_projeto,
    endereco_obra: item.oportunidade?.endereco_obra,
    responsavel_nome: item.responsavel?.nome,
  }));
}

/**
 * Buscar um card específico
 */
export async function buscarCardNucleo(cardId: string): Promise<CardNucleo | null> {
  const { data, error } = await supabase
    .from("contratos_nucleos")
    .select(`
      *,
      contrato:contratos(numero, cliente_id),
      oportunidade:oportunidades(titulo, area_total, tipo_projeto, endereco_obra),
      responsavel:pessoas(nome)
    `)
    .eq("id", cardId)
    .single();

  if (error) throw error;
  if (!data) return null;

  // Buscar nome do cliente
  let clienteNome = null;
  if (data.contrato?.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", data.contrato.cliente_id)
      .single();
    clienteNome = cliente?.nome;
  }

  return {
    ...data,
    contrato_numero: data.contrato?.numero,
    contrato_titulo: data.contrato?.titulo,
    cliente_id: data.contrato?.cliente_id,
    cliente_nome: clienteNome,
    oportunidade_titulo: data.oportunidade?.titulo,
    area_total: data.oportunidade?.area_total,
    tipo_projeto: data.oportunidade?.tipo_projeto,
    endereco_obra: data.oportunidade?.endereco_obra,
    responsavel_nome: data.responsavel?.nome,
  };
}

/**
 * Mover card no Kanban (mudar status)
 */
export async function moverCardKanban(
  cardId: string,
  novoStatus: StatusKanban,
  oportunidadeId?: string
): Promise<void> {
  const { error } = await supabase
    .from("contratos_nucleos")
    .update({
      status_kanban: novoStatus,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) throw error;

  // Registrar na timeline
  if (oportunidadeId) {
    const card = await buscarCardNucleo(cardId);
    await registrarEventoTimeline({
      oportunidade_id: oportunidadeId,
      contrato_id: card?.contrato_id,
      nucleo: card?.nucleo,
      origem: "kanban",
      tipo: "status",
      titulo: `Status alterado para: ${novoStatus}`,
      visivel_cliente: false,
    });
  }
}

/**
 * Atualizar progresso do card
 */
export async function atualizarProgressoCard(
  cardId: string,
  progresso: number,
  oportunidadeId?: string
): Promise<void> {
  const { error } = await supabase
    .from("contratos_nucleos")
    .update({
      progresso: Math.min(100, Math.max(0, progresso)),
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) throw error;

  // Registrar na timeline
  if (oportunidadeId) {
    const card = await buscarCardNucleo(cardId);
    await registrarEventoTimeline({
      oportunidade_id: oportunidadeId,
      contrato_id: card?.contrato_id,
      nucleo: card?.nucleo,
      origem: "execucao",
      tipo: "progresso",
      titulo: `Progresso atualizado: ${progresso}%`,
      visivel_cliente: true,
    });
  }
}

/**
 * Atualizar dados específicos do núcleo
 */
export async function atualizarDadosNucleo(
  cardId: string,
  dados: Partial<CardNucleo>
): Promise<void> {
  const { error } = await supabase
    .from("contratos_nucleos")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", cardId);

  if (error) throw error;
}

/**
 * Criar card para um núcleo (quando contrato é ativado)
 */
export async function criarCardNucleo(
  contratoId: string,
  nucleo: Nucleo,
  oportunidadeId?: string
): Promise<string> {
  const { data, error } = await supabase
    .from("contratos_nucleos")
    .insert({
      contrato_id: contratoId,
      oportunidade_id: oportunidadeId,
      nucleo,
      status_kanban: "backlog",
      progresso: 0,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ============================================================
// TIMELINE
// ============================================================

/**
 * Listar timeline de uma oportunidade
 */
export async function listarTimelineOportunidade(
  oportunidadeId: string,
  apenasVisivelCliente = false
): Promise<TimelineEvento[]> {
  let query = supabase
    .from("oportunidade_timeline")
    .select("*")
    .eq("oportunidade_id", oportunidadeId)
    .order("criado_em", { ascending: false });

  if (apenasVisivelCliente) {
    query = query.eq("visivel_cliente", true);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data || [];
}

/**
 * Registrar evento na timeline
 */
export async function registrarEventoTimeline(evento: {
  oportunidade_id: string;
  contrato_id?: string;
  nucleo?: Nucleo;
  origem: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  dados?: Record<string, any>;
  arquivo_url?: string;
  arquivo_tipo?: string;
  visivel_cliente?: boolean;
  destaque?: boolean;
  usuario_id?: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("oportunidade_timeline")
    .insert({
      ...evento,
      visivel_cliente: evento.visivel_cliente ?? false,
      destaque: evento.destaque ?? false,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

// ============================================================
// OPORTUNIDADE (Single Source of Truth)
// ============================================================

/**
 * Buscar oportunidade completa com todos os dados
 */
export async function buscarOportunidadeCompleta(
  oportunidadeId: string
): Promise<OportunidadeCompleta | null> {
  // Buscar oportunidade
  const { data: opp, error: oppError } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("id", oportunidadeId)
    .single();

  if (oppError) throw oppError;
  if (!opp) return null;

  // Buscar nome do cliente
  let clienteNome = null;
  if (opp.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", opp.cliente_id)
      .single();
    clienteNome = cliente?.nome;
  }

  // Buscar cards por núcleo
  const { data: nucleos } = await supabase
    .from("contratos_nucleos")
    .select("*")
    .eq("oportunidade_id", oportunidadeId);

  // Buscar timeline (últimos 20 eventos)
  const { data: timeline } = await supabase
    .from("oportunidade_timeline")
    .select("*")
    .eq("oportunidade_id", oportunidadeId)
    .order("criado_em", { ascending: false })
    .limit(20);

  return {
    ...opp,
    cliente_nome: clienteNome,
    progresso_geral: opp.progresso_geral || 0,
    progresso_arquitetura: opp.progresso_arquitetura || 0,
    progresso_engenharia: opp.progresso_engenharia || 0,
    progresso_marcenaria: opp.progresso_marcenaria || 0,
    valor_arquitetura: opp.valor_arquitetura || 0,
    valor_engenharia: opp.valor_engenharia || 0,
    valor_marcenaria: opp.valor_marcenaria || 0,
    valor_total_executado: opp.valor_total_executado || 0,
    nucleos: nucleos || [],
    timeline: timeline || [],
  };
}

/**
 * Atualizar dados da oportunidade (Single Source of Truth)
 */
export async function atualizarDadosOportunidade(
  oportunidadeId: string,
  dados: Partial<OportunidadeCompleta>
): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .update({
      ...dados,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", oportunidadeId);

  if (error) throw error;
}

/**
 * Vincular análise de projeto à oportunidade
 */
export async function vincularAnaliseOportunidade(
  oportunidadeId: string,
  analiseId: string
): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .update({
      analise_projeto_id: analiseId,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", oportunidadeId);

  if (error) throw error;

  // Registrar na timeline
  await registrarEventoTimeline({
    oportunidade_id: oportunidadeId,
    origem: "analise",
    tipo: "documento",
    titulo: "Análise de Projeto vinculada",
    descricao: "Uma análise de projeto foi associada a esta oportunidade.",
    visivel_cliente: true,
  });
}

/**
 * Vincular proposta à oportunidade
 */
export async function vincularPropostaOportunidade(
  oportunidadeId: string,
  propostaId: string
): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .update({
      proposta_id: propostaId,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", oportunidadeId);

  if (error) throw error;

  await registrarEventoTimeline({
    oportunidade_id: oportunidadeId,
    origem: "proposta",
    tipo: "documento",
    titulo: "Proposta comercial criada",
    visivel_cliente: true,
  });
}

/**
 * Vincular contrato à oportunidade
 */
export async function vincularContratoOportunidade(
  oportunidadeId: string,
  contratoId: string
): Promise<void> {
  const { error } = await supabase
    .from("oportunidades")
    .update({
      contrato_id: contratoId,
      status: "ganho",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", oportunidadeId);

  if (error) throw error;

  await registrarEventoTimeline({
    oportunidade_id: oportunidadeId,
    contrato_id: contratoId,
    origem: "contrato",
    tipo: "status",
    titulo: "Contrato assinado!",
    descricao: "O cliente assinou o contrato e a execuçÍo será iniciada.",
    visivel_cliente: true,
    destaque: true,
  });
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================

/**
 * Listar status do Kanban por núcleo
 */
export async function listarStatusKanban(nucleo: Nucleo): Promise<StatusKanbanConfig[]> {
  const { data, error } = await supabase
    .from("config_kanban_status")
    .select("*")
    .eq("nucleo", nucleo)
    .eq("ativo", true)
    .order("ordem");

  if (error) {
    // Fallback se tabela não existir
    return getStatusKanbanPadrao(nucleo);
  }

  return data || getStatusKanbanPadrao(nucleo);
}

/**
 * Status padrÍo por núcleo (fallback)
 */
function getStatusKanbanPadrao(nucleo: Nucleo): StatusKanbanConfig[] {
  const statusPadrao: Record<Nucleo, StatusKanbanConfig[]> = {
    arquitetura: [
      { id: "1", nucleo: "arquitetura", codigo: "backlog", titulo: "Aguardando", cor: "#6B7280", ordem: 1, ativo: true },
      { id: "2", nucleo: "arquitetura", codigo: "briefing", titulo: "Briefing", cor: "#8B5CF6", ordem: 2, ativo: true },
      { id: "3", nucleo: "arquitetura", codigo: "projeto", titulo: "Em Projeto", cor: "#3B82F6", ordem: 3, ativo: true },
      { id: "4", nucleo: "arquitetura", codigo: "revisao", titulo: "RevisÍo", cor: "#F59E0B", ordem: 4, ativo: true },
      { id: "5", nucleo: "arquitetura", codigo: "aprovacao", titulo: "AprovaçÍo", cor: "#EC4899", ordem: 5, ativo: true },
      { id: "6", nucleo: "arquitetura", codigo: "execucao", titulo: "ExecuçÍo", cor: "#10B981", ordem: 6, ativo: true },
      { id: "7", nucleo: "arquitetura", codigo: "concluido", titulo: "Concluído", cor: "#059669", ordem: 7, ativo: true },
    ],
    engenharia: [
      { id: "1", nucleo: "engenharia", codigo: "backlog", titulo: "Aguardando", cor: "#6B7280", ordem: 1, ativo: true },
      { id: "2", nucleo: "engenharia", codigo: "levantamento", titulo: "Levantamento", cor: "#8B5CF6", ordem: 2, ativo: true },
      { id: "3", nucleo: "engenharia", codigo: "projeto", titulo: "Em Projeto", cor: "#3B82F6", ordem: 3, ativo: true },
      { id: "4", nucleo: "engenharia", codigo: "compras", titulo: "Compras", cor: "#F59E0B", ordem: 4, ativo: true },
      { id: "5", nucleo: "engenharia", codigo: "execucao", titulo: "ExecuçÍo", cor: "#10B981", ordem: 5, ativo: true },
      { id: "6", nucleo: "engenharia", codigo: "acabamento", titulo: "Acabamento", cor: "#EC4899", ordem: 6, ativo: true },
      { id: "7", nucleo: "engenharia", codigo: "concluido", titulo: "Concluído", cor: "#059669", ordem: 7, ativo: true },
    ],
    marcenaria: [
      { id: "1", nucleo: "marcenaria", codigo: "backlog", titulo: "Aguardando", cor: "#6B7280", ordem: 1, ativo: true },
      { id: "2", nucleo: "marcenaria", codigo: "medicao", titulo: "MediçÍo", cor: "#8B5CF6", ordem: 2, ativo: true },
      { id: "3", nucleo: "marcenaria", codigo: "projeto", titulo: "Projeto", cor: "#3B82F6", ordem: 3, ativo: true },
      { id: "4", nucleo: "marcenaria", codigo: "producao", titulo: "ProduçÍo", cor: "#F59E0B", ordem: 4, ativo: true },
      { id: "5", nucleo: "marcenaria", codigo: "montagem", titulo: "Montagem", cor: "#10B981", ordem: 5, ativo: true },
      { id: "6", nucleo: "marcenaria", codigo: "acabamento", titulo: "Acabamento", cor: "#EC4899", ordem: 6, ativo: true },
      { id: "7", nucleo: "marcenaria", codigo: "concluido", titulo: "Concluído", cor: "#059669", ordem: 7, ativo: true },
    ],
  };

  return statusPadrao[nucleo] || [];
}

// ============================================================
// EXPORTAÇÕES
// ============================================================

export default {
  // Cards por Núcleo
  listarCardsNucleo,
  buscarCardNucleo,
  moverCardKanban,
  atualizarProgressoCard,
  atualizarDadosNucleo,
  criarCardNucleo,
  // Timeline
  listarTimelineOportunidade,
  registrarEventoTimeline,
  // Oportunidade
  buscarOportunidadeCompleta,
  atualizarDadosOportunidade,
  vincularAnaliseOportunidade,
  vincularPropostaOportunidade,
  vincularContratoOportunidade,
  // Configurações
  listarStatusKanban,
};


