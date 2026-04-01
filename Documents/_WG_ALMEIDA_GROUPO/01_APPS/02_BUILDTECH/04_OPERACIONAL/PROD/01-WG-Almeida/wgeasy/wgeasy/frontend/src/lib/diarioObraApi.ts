/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * API para o módulo de Diário de Obra
 * Baseado na tabela obra_registros do banco de dados
 */

import { supabase } from "./supabaseClient";
import { ensureJpeg } from "./imageConversion";
import type {
  DiarioObra,
  DiarioObraFoto,
  DiarioObraInput,
  DiarioObraUpdateInput,
  DiarioObraFiltros,
} from "@/types/diarioObra";

// Re-exportar tipos para uso em componentes
export type {
  DiarioObra,
  DiarioObraFoto,
  DiarioObraInput,
  DiarioObraFotoInput,
  DiarioObraUpdateInput,
  DiarioObraFotoUpdateInput,
  DiarioObraFiltros,
} from "@/types/diarioObra";

// Tipo para opções de obras no select
export interface ObraOption {
  id: string;
  nome: string;
  cliente_nome: string;
  numero?: string;
}

// Alias para compatibilidade
export type OportunidadeOption = ObraOption;

const DIARIO_TABLE = "obra_registros";
const FOTOS_TABLE = "obra_registros_fotos";
const STORAGE_BUCKET = "diario-obra";

// ============================================================
// Utilitários de Retry (especialmente para Safari iOS)
// ============================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executa uma funçÍo com retry automático em caso de erro
 * Especialmente útil para Safari iOS que pode ter conexões instáveis
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  retryableStatuses = [500, 502, 503, 504, 0] // 0 = network error
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Verificar se é um erro que vale a pena retry
      const status = error?.status || error?.response?.status || 0;
      const isRetryable = retryableStatuses.includes(status) ||
                          error.message?.includes('network') ||
                          error.message?.includes('fetch') ||
                          error.message?.includes('Failed to fetch');

      if (isRetryable && attempt < maxRetries - 1) {
        const waitTime = 1000 * (attempt + 1); // 1s, 2s, 3s...
        console.log(`[Retry] Tentativa ${attempt + 1} falhou, aguardando ${waitTime}ms...`);
        await delay(waitTime);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

// ============================================================
// Funções auxiliares de mapeamento
// ============================================================

function mapDiarioFromDb(row: any): DiarioObra {
  return {
    id: row.id,
    cliente_id: row.cliente_id,
    colaborador_id: row.colaborador_id,
    data_registro: row.data_registro,
    titulo: row.titulo,
    descricao: row.descricao,
    clima: row.clima,
    equipe_presente: row.equipe_presente,
    percentual_avanco: row.percentual_avanco,
    pendencias: row.pendencias,
    observacoes: row.observacoes,
    etapa_cronograma_id: row.etapa_cronograma_id,
    criado_em: row.criado_em,
    atualizado_em: row.atualizado_em,
    cliente: row.cliente
      ? {
          id: row.cliente.id,
          nome: row.cliente.nome,
          avatar_url: row.cliente.avatar_url,
          foto_url: row.cliente.foto_url,
        }
      : undefined,
    colaborador: row.colaborador
      ? {
          id: row.colaborador.id,
          nome: row.colaborador.nome,
          avatar_url: row.colaborador.avatar_url,
        }
      : undefined,
    fotos: row.obra_registros_fotos?.map(mapFotoFromDb) ?? [],
  };
}

function mapFotoFromDb(row: any): DiarioObraFoto {
  const legenda = row.legenda ?? row.descricao ?? null;
  return {
    id: row.id,
    registro_id: row.registro_id,
    arquivo_url: row.arquivo_url,
    descricao: row.descricao ?? row.legenda ?? null,
    legenda,
    ordem: row.ordem ?? 0,
    criado_em: row.criado_em,
  };
}

function extrairPercentualLegenda(texto?: string | null): number | null {
  const valor = String(texto || "");
  const match = valor.match(/(\d{1,3})\s*%/);
  if (!match) return null;
  const numero = Number(match[1]);
  if (Number.isNaN(numero)) return null;
  return Math.max(0, Math.min(100, numero));
}

function legendaIndicaConclusao(texto?: string | null): boolean {
  const base = String(texto || "").toLowerCase();
  if (!base) return false;
  return (
    base.includes("concluid") ||
    base.includes("finalizad") ||
    base.includes("terminad") ||
    base.includes("100%")
  );
}

function tokensLegenda(texto?: string | null): string[] {
  const raw = String(texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 4);
  return [...new Set(raw)];
}

async function atualizarProgressoTarefaCronogramaPorLegenda(
  tarefaId: string,
  legenda?: string | null
): Promise<void> {
  if (!tarefaId) return;

  const percentualDaLegenda = extrairPercentualLegenda(legenda);
  const forcarConclusao = legendaIndicaConclusao(legenda);

  const { data: tarefaAtual, error: erroTarefa } = await supabase
    .from("cronograma_tarefas")
    .select("id, progresso, status")
    .eq("id", tarefaId)
    .maybeSingle();

  if (erroTarefa || !tarefaAtual) return;

  const progressoAtual = Number(tarefaAtual.progresso || 0);
  let novoProgresso = progressoAtual;

  if (typeof percentualDaLegenda === "number") {
    novoProgresso = Math.max(progressoAtual, percentualDaLegenda);
  } else if (forcarConclusao) {
    novoProgresso = 100;
  }

  const novoStatus =
    novoProgresso >= 100
      ? "concluido"
      : novoProgresso > 0
      ? "em_andamento"
      : (tarefaAtual.status || "pendente");

  if (novoProgresso !== progressoAtual || novoStatus !== tarefaAtual.status) {
    await supabase
      .from("cronograma_tarefas")
      .update({
        progresso: novoProgresso,
        status: novoStatus,
      })
      .eq("id", tarefaId);
  }
}

async function tentarVincularLegendaATarefaSemVinculo(
  clienteId: string,
  legenda?: string | null
): Promise<string | null> {
  const tokens = tokensLegenda(legenda);
  if (tokens.length === 0) return null;

  const { data: projetos } = await supabase
    .from("projetos")
    .select("id")
    .eq("cliente_id", clienteId)
    .limit(20);

  const projetoIds = (projetos || []).map((p: any) => p.id);
  if (projetoIds.length === 0) return null;

  const { data: tarefas } = await supabase
    .from("cronograma_tarefas")
    .select("id, titulo, nome, descricao, progresso")
    .in("projeto_id", projetoIds)
    .neq("status", "concluido")
    .order("ordem", { ascending: true })
    .limit(120);

  if (!tarefas || tarefas.length === 0) return null;

  let melhorId: string | null = null;
  let melhorScore = 0;

  for (const tarefa of tarefas as any[]) {
    const texto = `${tarefa.titulo || ""} ${tarefa.nome || ""} ${tarefa.descricao || ""}`
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    let score = 0;
    for (const token of tokens) {
      if (texto.includes(token)) score += token.length >= 8 ? 3 : 2;
    }
    if (score > melhorScore) {
      melhorScore = score;
      melhorId = tarefa.id;
    }
  }

  return melhorScore >= 4 ? melhorId : null;
}

async function aplicarLegendaInteligenteNoCronograma(
  registroId: string,
  legenda?: string | null
): Promise<void> {
  if (!registroId || !legenda) return;

  const { data: registro } = await supabase
    .from(DIARIO_TABLE)
    .select("id, cliente_id, etapa_cronograma_id")
    .eq("id", registroId)
    .maybeSingle();

  if (!registro?.id) return;

  let tarefaId: string | null = registro.etapa_cronograma_id || null;

  if (!tarefaId && registro.cliente_id) {
    tarefaId = await tentarVincularLegendaATarefaSemVinculo(registro.cliente_id, legenda);
    if (tarefaId) {
      await supabase
        .from(DIARIO_TABLE)
        .update({ etapa_cronograma_id: tarefaId })
        .eq("id", registroId);
    }
  }

  if (tarefaId) {
    await atualizarProgressoTarefaCronogramaPorLegenda(tarefaId, legenda);
  }
}

// ============================================================
// CRUD - Diário de Obra (obra_registros)
// ============================================================

/**
 * Lista registros de diário por cliente
 */
export async function listarDiariosPorCliente(
  clienteId: string,
  filtros?: DiarioObraFiltros
): Promise<DiarioObra[]> {
  let query = supabase
    .from(DIARIO_TABLE)
    .select(
      `
      *,
      cliente:pessoas!obra_registros_cliente_id_fkey (id, nome),
      colaborador:pessoas!obra_registros_colaborador_id_fkey (id, nome, avatar_url),
      obra_registros_fotos (*)
    `
    )
    .eq("cliente_id", clienteId);

  // Aplicar filtros opcionais
  if (filtros?.colaborador_id) {
    query = query.eq("colaborador_id", filtros.colaborador_id);
  }
  if (filtros?.data_inicio) {
    query = query.gte("data_registro", filtros.data_inicio);
  }
  if (filtros?.data_fim) {
    query = query.lte("data_registro", filtros.data_fim);
  }

  const { data, error } = await query.order("data_registro", {
    ascending: false,
  });

  if (error) {
    console.error("Erro ao listar diários por cliente:", error);
    throw new Error(`Erro ao listar diários por cliente: ${error.message}`);
  }

  return (data || []).map(mapDiarioFromDb);
}

/**
 * Cria um novo registro de diário de obra
 */
export async function criarRegistroDiario(
  input: DiarioObraInput
): Promise<DiarioObra> {
  const { data, error } = await supabase
    .from(DIARIO_TABLE)
    .insert({
      cliente_id: input.cliente_id,
      colaborador_id: input.colaborador_id,
      data_registro:
        input.data_registro || new Date().toISOString().split("T")[0],
      titulo: input.titulo || null,
      descricao: input.descricao || null,
      clima: input.clima || null,
      equipe_presente: input.equipe_presente || null,
      percentual_avanco: input.percentual_avanco || null,
      pendencias: input.pendencias || null,
      observacoes: input.observacoes || null,
    })
    .select(
      `
      *,
      cliente:pessoas!obra_registros_cliente_id_fkey (id, nome),
      colaborador:pessoas!obra_registros_colaborador_id_fkey (id, nome, avatar_url),
      obra_registros_fotos (*)
    `
    )
    .single();

  if (error) {
    console.error("Erro ao criar registro de diário:", error);
    throw new Error(`Erro ao criar registro: ${error.message}`);
  }

  return mapDiarioFromDb(data);
}

/**
 * Atualiza um registro de diário existente
 */
export async function atualizarRegistroDiario(
  diarioId: string,
  input: DiarioObraUpdateInput
): Promise<DiarioObra> {
  const updateData: Record<string, any> = {
    atualizado_em: new Date().toISOString(),
  };

  if (input.titulo !== undefined) updateData.titulo = input.titulo;
  if (input.descricao !== undefined) updateData.descricao = input.descricao;
  if (input.clima !== undefined) updateData.clima = input.clima;
  if (input.equipe_presente !== undefined)
    updateData.equipe_presente = input.equipe_presente;
  if (input.percentual_avanco !== undefined)
    updateData.percentual_avanco = input.percentual_avanco;
  if (input.pendencias !== undefined) updateData.pendencias = input.pendencias;
  if (input.observacoes !== undefined)
    updateData.observacoes = input.observacoes;

  const { data, error } = await supabase
    .from(DIARIO_TABLE)
    .update(updateData)
    .eq("id", diarioId)
    .select(
      `
      *,
      cliente:pessoas!obra_registros_cliente_id_fkey (id, nome),
      colaborador:pessoas!obra_registros_colaborador_id_fkey (id, nome, avatar_url),
      obra_registros_fotos (*)
    `
    )
    .single();

  if (error) {
    console.error("Erro ao atualizar registro:", error);
    throw new Error(`Erro ao atualizar registro: ${error.message}`);
  }

  return mapDiarioFromDb(data);
}

/**
 * Exclui um registro de diário (cascade deleta as fotos)
 */
export async function excluirRegistroDiario(diarioId: string): Promise<void> {
  // Primeiro buscar as fotos para remover do Storage
  const { data: fotos } = await supabase
    .from(FOTOS_TABLE)
    .select("*")
    .eq("registro_id", diarioId);

  // Remover fotos do Supabase Storage
  if (fotos && fotos.length > 0) {
    const filePaths = fotos
      .map((f: { arquivo_url: string }) => {
        const url = f.arquivo_url;
        // Extrair path do arquivo da URL do Supabase
        const match = url.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (filePaths.length > 0) {
      await supabase.storage.from(STORAGE_BUCKET).remove(filePaths as string[]);
    }
  }

  // Excluir o registro (fotos sÍo deletadas por cascade)
  const { error } = await supabase
    .from(DIARIO_TABLE)
    .delete()
    .eq("id", diarioId);

  if (error) {
    console.error("Erro ao excluir registro:", error);
    throw new Error(`Erro ao excluir registro: ${error.message}`);
  }
}

/**
 * Lista registros de diário por colaborador
 */
export async function listarDiariosPorColaborador(
  colaboradorId: string,
  filtros?: DiarioObraFiltros
): Promise<DiarioObra[]> {
  let query = supabase
    .from(DIARIO_TABLE)
    .select(
      `
      *,
      cliente:pessoas!obra_registros_cliente_id_fkey (id, nome, avatar_url, foto_url),
      colaborador:pessoas!obra_registros_colaborador_id_fkey (id, nome, avatar_url),
      obra_registros_fotos (*)
    `
    )
    .eq("colaborador_id", colaboradorId);

  // Aplicar filtros opcionais
  if (filtros?.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }
  if (filtros?.data_inicio) {
    query = query.gte("data_registro", filtros.data_inicio);
  }
  if (filtros?.data_fim) {
    query = query.lte("data_registro", filtros.data_fim);
  }

  const { data, error } = await query.order("data_registro", {
    ascending: false,
  });

  if (error) {
    console.error("Erro ao listar diários:", error);
    throw new Error(`Erro ao listar diários: ${error.message}`);
  }

  return (data || []).map(mapDiarioFromDb);
}

/**
 * Busca um registro específico de diário
 */
export async function buscarDiario(diarioId: string): Promise<DiarioObra> {
  const { data, error } = await supabase
    .from(DIARIO_TABLE)
    .select(
      `
      *,
      cliente:pessoas!obra_registros_cliente_id_fkey (id, nome),
      colaborador:pessoas!obra_registros_colaborador_id_fkey (id, nome, avatar_url),
      obra_registros_fotos (*)
    `
    )
    .eq("id", diarioId)
    .single();

  if (error) {
    console.error("Erro ao buscar diário:", error);
    throw new Error(`Erro ao buscar diário: ${error.message}`);
  }

  return mapDiarioFromDb(data);
}

// ============================================================
// CRUD - Fotos do Diário
// ============================================================

/**
 * Upload de foto para o diário via Backend (Service Account)
 * O backend faz upload para Supabase Storage e Google Drive automaticamente
 * não requer OAuth do usuário - usa Service Account com Domain-Wide Delegation
 *
 * IMPORTANTE: Inclui retry automático para lidar com conexões instáveis em Safari iOS
 */
export async function uploadFotoDiario(
  registroId: string,
  arquivo: File,
  descricao?: string,
  clienteId?: string
): Promise<DiarioObraFoto> {
  // Obter token JWT do Supabase para autenticaçÍo no backend
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Usuário não autenticado");
  }

  // Converter HEIC/HEIF para JPEG quando necessário
  const arquivoParaUpload = await ensureJpeg(arquivo);

  // Preparar FormData para envio
  const formData = new FormData();
  formData.append("foto", arquivoParaUpload);
  if (descricao) formData.append("descricao", descricao);
  if (clienteId) formData.append("clienteId", clienteId);

  // Determinar URL do backend
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";

  // Usar retry para lidar com conexões instáveis (especialmente Safari iOS)
  const result = await withRetry(async () => {
    const response = await fetch(`${backendUrl}/api/diario-obras/${registroId}/fotos`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `Erro no upload: ${response.status}`) as any;
      error.status = response.status;
      throw error;
    }

    return response.json();
  }, 3); // 3 tentativas com backoff exponencial

  if (!result.success || !result.foto) {
    throw new Error("Resposta inválida do servidor");
  }

  // IntegraçÍo inteligente: legenda da foto atualiza vínculo/progresso da tarefa do cronograma.
  if (descricao && descricao.trim().length > 0) {
    try {
      await aplicarLegendaInteligenteNoCronograma(registroId, descricao);
    } catch (err) {
      console.warn("[DiarioObra] Falha na integraçÍo de legenda com cronograma:", err);
    }
  }

  return mapFotoFromDb(result.foto);
}

/**
 * Exclui uma foto do diário (Supabase Storage)
 */
export async function excluirFotoDiario(fotoId: string): Promise<void> {
  // 1. Buscar dados da foto
  const { data: foto, error: fetchError } = await supabase
    .from(FOTOS_TABLE)
    .select("*")
    .eq("id", fotoId)
    .single();

  if (fetchError) {
    throw new Error(`Erro ao buscar foto: ${fetchError.message}`);
  }

  // 2. Remover do Supabase Storage
  if (foto.arquivo_url) {
    const match = foto.arquivo_url.match(
      /\/storage\/v1\/object\/public\/[^/]+\/(.+)/
    );
    if (match) {
      await supabase.storage.from(STORAGE_BUCKET).remove([match[1]]);
    }
  }

  // 3. Remover registro do banco
  const { error } = await supabase.from(FOTOS_TABLE).delete().eq("id", fotoId);

  if (error) {
    throw new Error(`Erro ao excluir foto: ${error.message}`);
  }
}

/**
 * Atualiza descriçÍo de uma foto
 */
export async function atualizarDescricaoFoto(
  fotoId: string,
  descricao: string
): Promise<DiarioObraFoto> {
  const { data: fotoAtual } = await supabase
    .from(FOTOS_TABLE)
    .select("id, registro_id")
    .eq("id", fotoId)
    .maybeSingle();

  const { data, error } = await supabase
    .from(FOTOS_TABLE)
    .update({ descricao })
    .eq("id", fotoId)
    .select()
    .single();

  if (error) {
    throw new Error(`Erro ao atualizar descriçÍo: ${error.message}`);
  }

  if (fotoAtual?.registro_id && descricao && descricao.trim().length > 0) {
    try {
      await aplicarLegendaInteligenteNoCronograma(fotoAtual.registro_id, descricao);
    } catch (err) {
      console.warn("[DiarioObra] Falha ao aplicar legenda inteligente após ediçÍo:", err);
    }
  }

  return mapFotoFromDb(data);
}

/**
 * Registrar execuçÍo de tarefa do cronograma com diário e foto.
 * Cria/atualiza registro diário do dia, vincula a tarefa e aplica progresso.
 */
export async function registrarExecucaoTarefaComFoto(params: {
  tarefaId: string;
  clienteId: string;
  colaboradorId: string;
  progresso?: number;
  descricao?: string;
  foto?: File;
}): Promise<{ registroId: string; fotoId?: string }> {
  const hojeIso = new Date().toISOString().slice(0, 10);

  let registroId: string | null = null;
  const { data: registroExistente } = await supabase
    .from(DIARIO_TABLE)
    .select("id")
    .eq("cliente_id", params.clienteId)
    .eq("colaborador_id", params.colaboradorId)
    .eq("data_registro", hojeIso)
    .eq("etapa_cronograma_id", params.tarefaId)
    .maybeSingle();

  if (registroExistente?.id) {
    registroId = registroExistente.id;
  } else {
    const { data: novoRegistro, error: erroRegistro } = await supabase
      .from(DIARIO_TABLE)
      .insert({
        cliente_id: params.clienteId,
        colaborador_id: params.colaboradorId,
        data_registro: hojeIso,
        titulo: "ExecuçÍo de tarefa",
        descricao: params.descricao || null,
        etapa_cronograma_id: params.tarefaId,
      })
      .select("id")
      .single();
    if (erroRegistro || !novoRegistro?.id) {
      throw new Error(erroRegistro?.message || "Erro ao criar registro diário");
    }
    registroId = novoRegistro.id;
  }

  if (typeof params.progresso === "number") {
    const progresso = Math.max(0, Math.min(100, params.progresso));
    await supabase
      .from("cronograma_tarefas")
      .update({
        progresso,
        status: progresso >= 100 ? "concluido" : progresso > 0 ? "em_andamento" : "pendente",
      })
      .eq("id", params.tarefaId);
  }

  let fotoId: string | undefined;
  if (params.foto && registroId) {
    const foto = await uploadFotoDiario(
      registroId,
      params.foto,
      params.descricao || undefined,
      params.clienteId
    );
    fotoId = foto.id;
  }

  if (registroId && params.descricao) {
    await aplicarLegendaInteligenteNoCronograma(registroId, params.descricao);
  }

  if (!registroId) {
    throw new Error("Registro diário não definido para a execuçÍo da tarefa");
  }

  return { registroId, fotoId };
}

// Alias para compatibilidade
export const atualizarLegendaFoto = atualizarDescricaoFoto;

/**
 * Reordena fotos do diário
 */
export async function reordenarFotos(
  fotoIds: string[]
): Promise<DiarioObraFoto[]> {
  const results: DiarioObraFoto[] = [];

  for (let i = 0; i < fotoIds.length; i++) {
    const { data, error } = await supabase
      .from(FOTOS_TABLE)
      .update({ ordem: i })
      .eq("id", fotoIds[i])
      .select()
      .single();

    if (error) {
      console.error("Erro ao reordenar foto:", error);
      continue;
    }

    results.push(mapFotoFromDb(data));
  }

  return results;
}

// ============================================================
// Funções auxiliares
// ============================================================

/**
 * Lista obras disponíveis para o colaborador criar diário
 */
export async function listarObrasParaDiario(
  colaboradorId?: string
): Promise<ObraOption[]> {
  // Buscar obras ativas (em andamento)
  const { data, error } = await supabase
    .from("obras")
    .select(
      `
      id,
      nome,
      numero,
      cliente:cliente_id (id, nome)
    `
    )
    .in("status", ["EM_ANDAMENTO", "INICIADA", "EM_EXECUCAO", "ATIVA"])
    .order("nome");

  if (error) {
    console.error("Erro ao listar obras:", error);
    throw new Error(`Erro ao listar obras: ${error.message}`);
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    nome: row.nome || `Obra ${row.numero || row.id}`,
    cliente_nome: row.cliente?.nome || "Cliente não definido",
    numero: row.numero,
  }));
}

// Alias para manter compatibilidade
export const listarOportunidadesParaDiario = listarObrasParaDiario;

// NOTA: As funções de busca de pasta do Drive foram movidas para o backend.
// Agora o backend resolve automaticamente a pasta do cliente quando recebe o clienteId.
// Isso elimina a necessidade de OAuth do usuário no frontend (Service Account com Domain-Wide Delegation).

/**
 * Verifica se o colaborador é dono do registro (pode editar/excluir)
 */
export async function verificarPermissaoDiario(
  diarioId: string,
  colaboradorId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from(DIARIO_TABLE)
    .select("colaborador_id")
    .eq("id", diarioId)
    .single();

  if (error || !data) return false;
  return data.colaborador_id === colaboradorId;
}



