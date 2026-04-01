/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API: Módulo de Cronograma
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabaseRaw } from "./supabaseClient";
import type {
  Projeto,
  ProjetoCompleto,
  StatusProjeto,
  CronogramaTarefa,
  CronogramaTarefaCompleta,
  ProjetoFormData,
  CronogramaTarefaFormData,
  FiltrosProjetos,
  FiltrosTarefas,
  EstatisticasCronograma,
} from "@/types/cronograma";

// Tipos para comentários de tarefas
interface ComentarioTarefa {
  id: string;
  tarefa_id: string;
  comentario: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  usuario_nome?: string;
  usuario_email?: string;
  usuario_avatar?: string;
}

interface ComentarioTarefaFormData {
  tarefa_id: string;
  comentario: string;
  created_by: string;
}

// ============================================================
// PROJETOS
// ============================================================

/**
 * Listar todos os projetos do cronograma
 * Usa a tabela contratos como fonte de projetos
 */
export async function listarProjetosCronograma(
  filtros?: FiltrosProjetos
): Promise<ProjetoCompleto[]> {
  let query = supabaseRaw
    .from("contratos")
    .select(`
      id,
      numero,
      cliente_id,
      unidade_negocio,
      valor_total,
      status,
      data_inicio,
      data_previsao_termino,
      created_at,
      updated_at,
      cliente:pessoas!contratos_cliente_id_fkey(nome, cpf, telefone, email, avatar_url, foto_url)
    `)
    .not("status", "in", "(rascunho,cancelado)")
    .order("created_at", { ascending: false });

  // Aplicar filtros
  if (filtros?.status && filtros.status.length > 0) {
    // Mapear status do cronograma para status do contrato
    const statusMap: Record<string, string[]> = {
      pendente: ["aguardando_assinatura"],
      em_andamento: ["em_execucao", "ativo"],
      concluido: ["concluido", "finalizado"],
      cancelado: ["cancelado"],
    };
    const mappedStatus = filtros.status.flatMap(s => statusMap[s] || [s]);
    if (mappedStatus.length > 0) {
      query = query.in("status", mappedStatus);
    }
  }

  if (filtros?.nucleo && filtros.nucleo.length > 0) {
    query = query.in("unidade_negocio", filtros.nucleo);
  }

  if (filtros?.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }

  if (filtros?.busca) {
    query = query.or(
      `numero.ilike.%${filtros.busca}%`
    );
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar projetos:", error);
    return [];
  }

  // Mapear para o formato ProjetoCompleto
  return (data || []).map((contrato: any) => ({
    id: contrato.id,
    contrato_id: contrato.id,
    cliente_id: contrato.cliente_id,
    nome: `Contrato ${contrato.numero}`,
    name: `Contrato ${contrato.numero}`,
    descricao: null,
    nucleo: contrato.unidade_negocio,
    data_inicio: contrato.data_inicio,
    data_termino: contrato.data_previsao_termino,
    status: mapStatusContratoToProjeto(contrato.status),
    progresso: 0,
    created_at: contrato.created_at,
    updated_at: contrato.updated_at,
    // Dados do cliente
    cliente_nome: contrato.cliente?.nome,
    cliente_cpf: contrato.cliente?.cpf,
    cliente_telefone: contrato.cliente?.telefone,
    cliente_email: contrato.cliente?.email,
    cliente_avatar_url: contrato.cliente?.avatar_url,
    cliente_foto_url: contrato.cliente?.foto_url,
    // Dados do contrato
    contrato_numero: contrato.numero,
    contrato_valor_total: contrato.valor_total,
  }));
}

// Helper para mapear status do contrato para status do projeto
function mapStatusContratoToProjeto(statusContrato: string): StatusProjeto {
  const map: Record<string, StatusProjeto> = {
    rascunho: "pendente",
    aguardando_assinatura: "pendente",
    assinado: "pendente",
    em_execucao: "em_andamento",
    ativo: "em_andamento",
    concluido: "concluido",
    finalizado: "concluido",
    cancelado: "cancelado",
  };
  return map[statusContrato] || "pendente";
}

/**
 * Buscar projeto por ID
 */
export async function buscarProjetoCronograma(
  id: string
): Promise<ProjetoCompleto | null> {
  const { data, error } = await supabaseRaw
    .from("contratos")
    .select(`
      id,
      numero,
      cliente_id,
      unidade_negocio,
      valor_total,
      status,
      data_inicio,
      data_previsao_termino,
      created_at,
      updated_at,
      cliente:pessoas!contratos_cliente_id_fkey(nome, cpf, telefone, email, avatar_url, foto_url)
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar projeto:", error);
    return null;
  }

  if (!data) return null;

  // Mapear para o formato ProjetoCompleto
  return {
    id: data.id,
    contrato_id: data.id,
    cliente_id: data.cliente_id,
    nome: `Contrato ${data.numero}`,
    name: `Contrato ${data.numero}`,
    descricao: null,
    nucleo: data.unidade_negocio,
    data_inicio: data.data_inicio,
    data_termino: data.data_previsao_termino,
    status: mapStatusContratoToProjeto(data.status),
    progresso: 0,
    created_at: data.created_at,
    updated_at: data.updated_at,
    cliente_nome: (data as any).cliente?.nome,
    cliente_cpf: (data as any).cliente?.cpf,
    cliente_telefone: (data as any).cliente?.telefone,
    cliente_email: (data as any).cliente?.email,
    cliente_avatar_url: (data as any).cliente?.avatar_url,
    cliente_foto_url: (data as any).cliente?.foto_url,
    contrato_numero: data.numero,
    contrato_valor_total: data.valor_total,
  };
}

/**
 * Criar novo projeto
 */
export async function criarProjetoCronograma(
  projeto: ProjetoFormData
): Promise<Projeto> {
  const { data, error } = await supabaseRaw
    .from("projetos")
    .insert([projeto])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar projeto:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar projeto
 */
export async function atualizarProjetoCronograma(
  id: string,
  projeto: Partial<ProjetoFormData>
): Promise<Projeto> {
  const { data, error } = await supabaseRaw
    .from("projetos")
    .update(projeto)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar projeto:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar projeto
 */
export async function deletarProjetoCronograma(id: string): Promise<void> {
  const { error } = await supabaseRaw.from("projetos").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar projeto:", error);
    throw error;
  }
}

/**
 * Criar projeto a partir de um contrato
 */
export async function criarProjetoDoContrato(
  contratoId: string
): Promise<string> {
  const { data, error } = await supabaseRaw.rpc("criar_projeto_do_contrato", {
    p_contrato_id: contratoId,
  });

  if (error) {
    console.error("Erro ao criar projeto do contrato:", error);
    throw error;
  }

  return data; // Retorna o ID do projeto criado
}

// ============================================================
// TAREFAS
// ============================================================

/**
 * Listar tarefas de um projeto
 */
export async function listarTarefasProjeto(
  projetoId: string,
  filtros?: FiltrosTarefas
): Promise<CronogramaTarefa[]> {
  let query = supabaseRaw
    .from("cronograma_tarefas")
    .select("*")
    .eq("projeto_id", projetoId);

  // Ordenar por ordem
  query = query.order("ordem", { ascending: true, nullsFirst: false });

  // Aplicar filtros
  if (filtros?.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros?.categoria && filtros.categoria.length > 0) {
    query = query.in("categoria", filtros.categoria);
  }

  if (filtros?.mostrar_concluidas === false) {
    query = query.neq("status", "concluido");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar tarefas:", error);
    throw error;
  }

  return data || [];
}

/**
 * Listar tarefas com comentários
 * Usa a tabela cronograma_tarefas diretamente
 */
export async function listarTarefasComComentarios(
  projetoId: string,
  filtros?: FiltrosTarefas
): Promise<CronogramaTarefaCompleta[]> {
  let query = supabaseRaw
    .from("cronograma_tarefas")
    .select("*")
    .eq("projeto_id", projetoId);

  // Ordenar por ordem
  query = query.order("ordem", { ascending: true, nullsFirst: false });

  // Aplicar filtros
  if (filtros?.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros?.categoria && filtros.categoria.length > 0) {
    query = query.in("categoria", filtros.categoria);
  }

  if (filtros?.mostrar_concluidas === false) {
    query = query.neq("status", "concluido");
  }

  const { data, error } = await query;

  if (error) {
    console.error("Erro ao listar tarefas com comentários:", error);
    throw error;
  }

  return data || [];
}

/**
 * Buscar tarefa por ID
 */
export async function buscarTarefa(id: string): Promise<CronogramaTarefa | null> {
  const { data, error } = await supabaseRaw
    .from("cronograma_tarefas")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Erro ao buscar tarefa:", error);
    return null;
  }

  return data;
}

/**
 * Criar nova tarefa
 */
export async function criarTarefa(
  projetoId: string,
  tarefa: CronogramaTarefaFormData
): Promise<CronogramaTarefa> {
  // Omit projeto_id from tarefa to avoid duplicate property
  const { projeto_id: _, ...tarefaSemProjetoId } = tarefa;
  const { data, error } = await supabaseRaw
    .from("cronograma_tarefas")
    .insert([
      {
        projeto_id: projetoId,
        ...tarefaSemProjetoId,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar tarefa:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar tarefa
 */
export async function atualizarTarefa(
  id: string,
  tarefa: Partial<CronogramaTarefaFormData>
): Promise<CronogramaTarefa> {
  const { data, error } = await supabaseRaw
    .from("cronograma_tarefas")
    .update(tarefa)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar tarefa:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar ordem das tarefas (drag-and-drop)
 */
export async function atualizarOrdemTarefas(
  tarefas: { id: string; ordem: number }[]
): Promise<void> {
  const promises = tarefas.map((tarefa) =>
    supabaseRaw
      .from("cronograma_tarefas")
      .update({ ordem: tarefa.ordem })
      .eq("id", tarefa.id)
  );

  const results = await Promise.all(promises);

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    console.error("Erro ao atualizar ordem das tarefas:", errors);
    throw new Error("Erro ao atualizar ordem das tarefas");
  }
}

/**
 * Atualizar descriçÍo da tarefa (inline)
 */
export async function atualizarDescricaoTarefa(
  id: string,
  descricao: string
): Promise<void> {
  const { error } = await supabaseRaw
    .from("cronograma_tarefas")
    .update({ descricao: descricao })
    .eq("id", id);

  if (error) {
    console.error("Erro ao atualizar descriçÍo:", error);
    throw error;
  }
}

/**
 * Deletar tarefa
 */
export async function deletarTarefa(id: string): Promise<void> {
  const { error } = await supabaseRaw.from("cronograma_tarefas").delete().eq("id", id);

  if (error) {
    console.error("Erro ao deletar tarefa:", error);
    throw error;
  }
}

// ============================================================
// COMENTÁRIOS
// ============================================================

/**
 * Listar comentários de uma tarefa
 */
export async function listarComentariosTarefa(
  taskId: string
): Promise<ComentarioTarefa[]> {
  const { data, error } = await supabaseRaw
    .from("task_comments")
    .select(
      `
      *,
      usuario:created_by (
        nome,
        email,
        avatar_url
      )
    `
    )
    .eq("task_id", taskId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao listar comentários:", error);
    throw error;
  }

  // Mapear dados do usuário
  const comentarios = (data || []).map((c: any) => ({
    ...c,
    usuario_nome: c.usuario?.nome,
    usuario_email: c.usuario?.email,
    usuario_avatar: c.usuario?.avatar_url,
  }));

  return comentarios;
}

/**
 * Criar comentário
 */
export async function criarComentario(
  comentario: ComentarioTarefaFormData
): Promise<ComentarioTarefa> {
  const { data, error } = await supabaseRaw
    .from("task_comments")
    .insert([comentario])
    .select()
    .single();

  if (error) {
    console.error("Erro ao criar comentário:", error);
    throw error;
  }

  return data;
}

/**
 * Atualizar comentário
 */
export async function atualizarComentario(
  id: string,
  comentario: string
): Promise<ComentarioTarefa> {
  const { data, error } = await supabaseRaw
    .from("task_comments")
    .update({ comentario, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Erro ao atualizar comentário:", error);
    throw error;
  }

  return data;
}

/**
 * Deletar comentário
 */
export async function deletarComentario(id: string): Promise<void> {
  const { error } = await supabaseRaw
    .from("task_comments")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Erro ao deletar comentário:", error);
    throw error;
  }
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Buscar estatísticas do cronograma
 */
export async function buscarEstatisticasCronograma(): Promise<EstatisticasCronograma> {
  // Buscar projetos
  const { data: projetos } = await supabaseRaw
    .from("projetos")
    .select("status, progresso, nucleo");

  // Buscar tarefas
  const { data: tarefas } = await supabaseRaw
    .from("cronograma_tarefas")
    .select("status, data_termino");

  const totalProjetos = projetos?.length || 0;
  const projetosPendentes = projetos?.filter((p) => p.status === "pendente").length || 0;
  const projetosEmAndamento = projetos?.filter((p) => p.status === "em_andamento").length || 0;
  const projetosConcluidos = projetos?.filter((p) => p.status === "concluido").length || 0;
  const projetosPausados = projetos?.filter((p) => p.status === "pausado").length || 0;
  const projetosCancelados = projetos?.filter((p) => p.status === "cancelado").length || 0;

  const totalTarefas = tarefas?.length || 0;
  const tarefasPendentes = tarefas?.filter((t) => t.status === "pendente").length || 0;
  const tarefasEmAndamento = tarefas?.filter((t) => t.status === "em_andamento").length || 0;
  const tarefasConcluidas = tarefas?.filter((t) => t.status === "concluido").length || 0;

  // Tarefas atrasadas (data_termino < hoje e status != concluido)
  const hoje = new Date();
  const tarefasAtrasadas =
    tarefas?.filter((t) => {
      if (!t.data_termino || t.status === "concluido" || t.status === "cancelado")
        return false;
      return new Date(t.data_termino) < hoje;
    }).length || 0;

  // Progresso médio geral
  const progressoMedio = projetos?.length
    ? Math.round(projetos.reduce((acc, p) => acc + (p.progresso || 0), 0) / projetos.length)
    : 0;

  // Estatísticas por núcleo
  const nucleosMap = new Map<string, { total: number; progressoSum: number }>();
  projetos?.forEach((p) => {
    const nucleo = p.nucleo || "geral";
    const atual = nucleosMap.get(nucleo) || { total: 0, progressoSum: 0 };
    nucleosMap.set(nucleo, {
      total: atual.total + 1,
      progressoSum: atual.progressoSum + (p.progresso || 0),
    });
  });

  const porNucleo = Array.from(nucleosMap.entries()).map(([nucleo, stats]) => ({
    nucleo,
    total_projetos: stats.total,
    progresso_medio: Math.round(stats.progressoSum / stats.total),
  }));

  return {
    total_projetos: totalProjetos,
    projetos_pendentes: projetosPendentes,
    projetos_em_andamento: projetosEmAndamento,
    projetos_concluidos: projetosConcluidos,
    projetos_pausados: projetosPausados,
    projetos_cancelados: projetosCancelados,
    total_tarefas: totalTarefas,
    tarefas_pendentes: tarefasPendentes,
    tarefas_em_andamento: tarefasEmAndamento,
    tarefas_concluidas: tarefasConcluidas,
    tarefas_atrasadas: tarefasAtrasadas,
    progresso_medio_geral: progressoMedio,
    por_nucleo: porNucleo,
  };
}

// ============================================================
// MEDIÇÍO FINANCEIRA
// ============================================================

import type {
  MedicaoTarefa,
  MedicaoProjeto,
  MedicaoCategoria,
  ResumoMedicao,
  ProjetoMedicao,
  ProjetoMedicaoItem,
  MedicaoFormData,
  StatusMedicao,
} from "@/types/cronograma";

import {
  agruparPorCategoria,
  calcularResumoMedicao,
} from "@/types/cronograma";

/**
 * Calcular mediçÍo de um projeto (sem salvar)
 */
export async function calcularMedicaoProjeto(
  projetoId: string,
  dataCorte?: string
): Promise<MedicaoProjeto | null> {
  try {
    // Buscar dados do projeto
    const projeto = await buscarProjetoCronograma(projetoId);
    if (!projeto) {
      throw new Error("Projeto não encontrado");
    }

    // Buscar tarefas com dados do contrato
    const { data: tarefas, error: tarefasError } = await supabaseRaw
      .from("cronograma_tarefas")
      .select(`
        id,
        descricao,
        categoria,
        data_inicio,
        data_termino,
        progresso,
        status,
        item_contrato_id,
        contratos_itens (
          valor_total,
          valor_unitario,
          quantidade,
          unidade,
          dias_estimados,
          producao_diaria
        )
      `)
      .eq("projeto_id", projetoId)
      .neq("status", "cancelado")
      .order("ordem", { ascending: true });

    if (tarefasError) {
      console.error("Erro ao buscar tarefas:", tarefasError);
      throw tarefasError;
    }

    // Buscar custos da equipe por funçÍo/categoria
    const { data: equipe } = await supabaseRaw
      .from("projeto_equipes")
      .select("funcao, horas_alocadas, custo_hora")
      .eq("projeto_id", projetoId);

    // Mapear custos por funçÍo
    const custosPorFuncao = new Map<string, { horas: number; custoHora: number }>();
    equipe?.forEach((e: any) => {
      if (e.funcao) {
        custosPorFuncao.set(e.funcao.toLowerCase(), {
          horas: e.horas_alocadas || 0,
          custoHora: e.custo_hora || 0,
        });
      }
    });

    const hoje = dataCorte ? new Date(dataCorte) : new Date();
    const dataCorteISO = (dataCorte || hoje.toISOString().split("T")[0]).slice(0, 10);

    // Buscar execuções diárias registradas até a data de corte
    let execucoesPorTarefa = new Map<string, any[]>();
    try {
      const { data: execucoes, error: execucoesError } = await supabaseRaw
        .from("cronograma_execucoes_diarias")
        .select(`
          tarefa_id,
          data_execucao,
          quantidade_executada,
          percentual_execucao,
          valor_venda_unitario,
          valor_custo_unitario,
          valor_pago_profissional
        `)
        .eq("projeto_id", projetoId)
        .lte("data_execucao", dataCorteISO);

      if (!execucoesError) {
        for (const e of execucoes || []) {
          const lista = execucoesPorTarefa.get(e.tarefa_id) || [];
          lista.push(e);
          execucoesPorTarefa.set(e.tarefa_id, lista);
        }
      }
    } catch (errorExecucoes) {
      // Fallback silencioso para ambientes sem a migraçÍo aplicada
      console.warn("Aviso: execuções diárias indisponíveis, usando cálculo por progresso.", errorExecucoes);
    }

    // Calcular mediçÍo para cada tarefa
    const itens: MedicaoTarefa[] = (tarefas || []).map((t: any) => {
      const contrato = t.contratos_itens;
      const valorTotal = contrato?.valor_total || 0;
      const diasEstimados = contrato?.dias_estimados || 1;
      const progresso = t.progresso || 0;
      const quantidadeTotal = Number(contrato?.quantidade || 0);
      const unidadeItem = contrato?.unidade || null;
      const execucoesTarefa = execucoesPorTarefa.get(t.id) || [];
      const quantidadeExecutadaAcumulada = execucoesTarefa.reduce(
        (acc: number, e: any) => acc + (Number(e.quantidade_executada) || 0),
        0
      );
      const percentualApontado = execucoesTarefa.reduce(
        (acc: number, e: any) => acc + (Number(e.percentual_execucao) || 0),
        0
      );
      const percentualPorQuantidade =
        quantidadeTotal > 0 ? Math.min(100, (quantidadeExecutadaAcumulada / quantidadeTotal) * 100) : 0;
      const progressoCalculado =
        execucoesTarefa.length > 0
          ? Math.max(percentualPorQuantidade, Math.min(100, percentualApontado))
          : progresso;
      const progressoFinal = Number.isFinite(progressoCalculado) ? Math.max(0, Math.min(100, progressoCalculado)) : progresso;

      // Calcular dias
      const dataInicio = t.data_inicio ? new Date(t.data_inicio) : null;
      const dataFim = t.data_termino ? new Date(t.data_termino) : null;
      const diasTotais = dataInicio && dataFim
        ? Math.max(1, Math.ceil((dataFim.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : diasEstimados;
      const diasExecutados = execucoesTarefa.length > 0
        ? new Set(execucoesTarefa.map((e: any) => String(e.data_execucao).slice(0, 10))).size
        : dataInicio
        ? Math.max(0, Math.ceil((hoje.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24)) + 1)
        : 0;

      // Calcular valores
      const valorPorDia = diasTotais > 0 ? valorTotal / diasTotais : 0;
      const valorRealizadoPorApontamento = execucoesTarefa.reduce((acc: number, e: any) => {
        const quantidade = Number(e.quantidade_executada) || 0;
        const vendaUnit = Number(e.valor_venda_unitario) || 0;
        return acc + quantidade * vendaUnit;
      }, 0);
      const valorRealizado =
        valorRealizadoPorApontamento > 0
          ? valorRealizadoPorApontamento
          : (progressoFinal / 100) * valorTotal;
      const valorPendente = valorTotal - valorRealizado;

      // Calcular custo profissional
      const categoria = t.categoria?.toLowerCase() || "";
      const custoEquipe = custosPorFuncao.get(categoria);
      const custoProfissionalTotal = custoEquipe
        ? custoEquipe.horas * custoEquipe.custoHora
        : 0;
      const custoPagoApontamento = execucoesTarefa.reduce(
        (acc: number, e: any) => acc + (Number(e.valor_pago_profissional) || 0),
        0
      );
      const custoUnitarioApontamento = execucoesTarefa.reduce((acc: number, e: any) => {
        const quantidade = Number(e.quantidade_executada) || 0;
        const custoUnit = Number(e.valor_custo_unitario) || 0;
        return acc + quantidade * custoUnit;
      }, 0);
      const custoProfissionalRealizado =
        custoPagoApontamento > 0
          ? custoPagoApontamento
          : custoUnitarioApontamento > 0
          ? custoUnitarioApontamento
          : (progressoFinal / 100) * custoProfissionalTotal;

      // Margem
      const margemBruta = valorRealizado - custoProfissionalRealizado;

      return {
        tarefa_id: t.id,
        tarefa_nome: t.descricao || "Sem descriçÍo",
        categoria: t.categoria,
        data_inicio: t.data_inicio,
        data_fim: t.data_termino,
        dias_totais: diasTotais,
        dias_executados: diasExecutados,
        progresso: progressoFinal,
        progresso_anterior: 0, // Será preenchido se houver mediçÍo anterior
        progresso_periodo: progressoFinal, // Será calculado se houver mediçÍo anterior
        valor_total_item: valorTotal,
        valor_por_dia: valorPorDia,
        valor_realizado: valorRealizado,
        valor_pendente: valorPendente,
        valor_periodo: valorRealizado, // Será calculado se houver mediçÍo anterior
        quantidade_total_item: quantidadeTotal || null,
        quantidade_executada_acumulada: quantidadeExecutadaAcumulada,
        unidade_item: unidadeItem,
        custo_profissional_total: custoProfissionalTotal,
        custo_profissional_realizado: custoProfissionalRealizado,
        valor_pago_profissional_periodo: custoPagoApontamento,
        margem_bruta: margemBruta,
      };
    });

    // Agrupar por categoria
    const itensPorCategoria = agruparPorCategoria(itens);

    // Calcular resumo
    const resumo = calcularResumoMedicao(itens);

    return {
      projeto_id: projetoId,
      projeto_titulo: projeto.nome,
      cliente_nome: projeto.cliente_nome || "Cliente não informado",
      cliente_telefone: projeto.cliente_telefone,
      cliente_email: projeto.cliente_email,
      contrato_numero: projeto.contrato_numero,
      nucleo: projeto.nucleo,
      data_corte: dataCorte || hoje.toISOString().split("T")[0],
      itens,
      itens_por_categoria: itensPorCategoria,
      resumo,
    };
  } catch (error) {
    console.error("Erro ao calcular mediçÍo:", error);
    return null;
  }
}

/**
 * Listar histórico de medições de um projeto
 */
export async function listarMedicoesProjeto(
  projetoId: string
): Promise<ProjetoMedicao[]> {
  const { data, error } = await supabaseRaw
    .from("vw_projeto_medicoes")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("numero_medicao", { ascending: false });

  if (error) {
    console.error("Erro ao listar medições:", error);
    return [];
  }

  return data || [];
}

/**
 * Buscar uma mediçÍo específica
 */
export async function buscarMedicao(
  medicaoId: string
): Promise<ProjetoMedicao | null> {
  const { data, error } = await supabaseRaw
    .from("vw_projeto_medicoes")
    .select("*")
    .eq("id", medicaoId)
    .single();

  if (error) {
    console.error("Erro ao buscar mediçÍo:", error);
    return null;
  }

  return data;
}

/**
 * Buscar itens de uma mediçÍo
 */
export async function buscarItensMedicao(
  medicaoId: string
): Promise<ProjetoMedicaoItem[]> {
  const { data, error } = await supabaseRaw
    .from("projeto_medicao_itens")
    .select("*")
    .eq("medicao_id", medicaoId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao buscar itens da mediçÍo:", error);
    return [];
  }

  return data || [];
}

export interface ExecucaoDiariaFormData {
  projeto_id: string;
  tarefa_id: string;
  item_contrato_id?: string | null;
  pessoa_id?: string | null;
  tipo_pessoa?: "COLABORADOR" | "FORNECEDOR" | null;
  data_execucao: string;
  quantidade_executada: number;
  unidade?: string | null;
  percentual_execucao?: number | null;
  valor_venda_unitario?: number | null;
  valor_custo_unitario?: number | null;
  valor_pago_profissional?: number | null;
  observacoes?: string | null;
}

export async function registrarExecucaoDiaria(
  payload: ExecucaoDiariaFormData
): Promise<string | null> {
  const { data, error } = await supabaseRaw
    .from("cronograma_execucoes_diarias")
    .insert(payload)
    .select("id")
    .single();

  if (error) {
    console.error("Erro ao registrar execuçÍo diária:", error);
    return null;
  }

  return data?.id || null;
}

export async function listarExecucoesTarefa(
  tarefaId: string
): Promise<any[]> {
  const { data, error } = await supabaseRaw
    .from("cronograma_execucoes_diarias")
    .select("*")
    .eq("tarefa_id", tarefaId)
    .order("data_execucao", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Erro ao listar execuções da tarefa:", error);
    return [];
  }

  return data || [];
}

/**
 * Salvar mediçÍo (criar histórico)
 */
export async function salvarMedicao(
  dados: MedicaoFormData,
  userId?: string
): Promise<string | null> {
  try {
    // Usar funçÍo RPC do banco
    const { data, error } = await supabaseRaw.rpc("gerar_medicao_projeto", {
      p_projeto_id: dados.projeto_id,
      p_data_corte: dados.data_corte,
      p_observacoes: dados.observacoes || null,
      p_created_by: userId || null,
    });

    if (error) {
      console.error("Erro ao salvar mediçÍo:", error);
      throw error;
    }

    return data; // Retorna o ID da mediçÍo criada
  } catch (error) {
    console.error("Erro ao salvar mediçÍo:", error);
    return null;
  }
}

/**
 * Atualizar status da mediçÍo
 */
export async function atualizarStatusMedicao(
  medicaoId: string,
  status: StatusMedicao
): Promise<boolean> {
  const { error } = await supabaseRaw
    .from("projeto_medicoes")
    .update({ status })
    .eq("id", medicaoId);

  if (error) {
    console.error("Erro ao atualizar status da mediçÍo:", error);
    return false;
  }

  return true;
}

/**
 * Deletar mediçÍo
 */
export async function deletarMedicao(medicaoId: string): Promise<boolean> {
  const { error } = await supabaseRaw
    .from("projeto_medicoes")
    .delete()
    .eq("id", medicaoId);

  if (error) {
    console.error("Erro ao deletar mediçÍo:", error);
    return false;
  }

  return true;
}

/**
 * Buscar última mediçÍo de um projeto
 */
export async function buscarUltimaMedicao(
  projetoId: string
): Promise<ProjetoMedicao | null> {
  const { data, error } = await supabaseRaw
    .from("projeto_medicoes")
    .select("*")
    .eq("projeto_id", projetoId)
    .order("numero_medicao", { ascending: false })
    .limit(1)
    .single();

  if (error) {
    // Pode não existir mediçÍo anterior
    return null;
  }

  return data;
}


