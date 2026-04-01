// ============================================================
// API: Cronograma - Vínculos com Fotos
// Sistema de automaçÍo de atualizaçÍo de progresso via fotos
// ============================================================

import { supabase } from "./supabaseClient";
import { uploadFotoDiario, criarRegistroDiario } from "./diarioObraApi";
import type { CronogramaTarefa } from "@/types/cronograma";
import type { DiarioObraFoto } from "@/types/diarioObra";

// ============================================================
// TIPOS
// ============================================================

export interface CronogramaTarefaFoto {
  id: string;
  tarefa_id: string;
  foto_id: string;
  contribui_progresso: boolean;
  percentual_contribuicao: number;
  criado_em: string;
  criado_por: string | null;
}

export interface VincularFotoInput {
  tarefa_id: string;
  foto_id: string;
  contribui_progresso?: boolean;
  percentual_contribuicao?: number;
}

export interface FotoComDados extends DiarioObraFoto {
  vinculo: CronogramaTarefaFoto;
  registro?: {
    id: string;
    data_registro: string;
    colaborador?: {
      id: string;
      nome: string;
      avatar_url?: string | null;
    };
  };
}

export interface TarefaCandidataMatch extends CronogramaTarefa {
  total_fotos_vinculadas: number;
  automacao_habilitada: boolean;
}

// ============================================================
// VINCULAR E DESVINCULAR FOTOS
// ============================================================

/**
 * Vincular uma foto existente a uma tarefa do cronograma
 */
export async function vincularFotoTarefa(
  input: VincularFotoInput
): Promise<CronogramaTarefaFoto> {
  try {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("cronograma_tarefas_fotos")
      .insert({
        tarefa_id: input.tarefa_id,
        foto_id: input.foto_id,
        contribui_progresso: input.contribui_progresso ?? true,
        percentual_contribuicao: input.percentual_contribuicao ?? 100.0,
        criado_por: user?.user?.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Erro ao vincular foto:", error);
      throw new Error(`Erro ao vincular foto: ${error.message}`);
    }

    // Recalcular progresso automaticamente
    await recalcularProgressoTarefa(input.tarefa_id);

    return data;
  } catch (error) {
    console.error("Erro em vincularFotoTarefa:", error);
    throw error;
  }
}

/**
 * Desvincular uma foto de uma tarefa
 */
export async function desvincularFotoTarefa(
  tarefaId: string,
  fotoId: string
): Promise<void> {
  try {
    const { error } = await supabase
      .from("cronograma_tarefas_fotos")
      .delete()
      .match({ tarefa_id: tarefaId, foto_id: fotoId });

    if (error) {
      console.error("Erro ao desvincular foto:", error);
      throw new Error(`Erro ao desvincular foto: ${error.message}`);
    }

    // Recalcular progresso após remover foto
    await recalcularProgressoTarefa(tarefaId);
  } catch (error) {
    console.error("Erro em desvincularFotoTarefa:", error);
    throw error;
  }
}

// ============================================================
// BUSCAR FOTOS
// ============================================================

/**
 * Buscar todas as fotos vinculadas a uma tarefa
 */
export async function buscarFotosDaTarefa(
  tarefaId: string
): Promise<FotoComDados[]> {
  try {
    const { data, error } = await supabase
      .from("cronograma_tarefas_fotos")
      .select(
        `
        *,
        foto:obra_registros_fotos!inner (
          *,
          registro:obra_registros!inner (
            id,
            data_registro,
            colaborador:pessoas!obra_registros_colaborador_id_fkey (
              id,
              nome,
              avatar_url
            )
          )
        )
      `
      )
      .eq("tarefa_id", tarefaId)
      .order("criado_em", { ascending: false });

    if (error) {
      console.error("Erro ao buscar fotos da tarefa:", error);
      throw new Error(`Erro ao buscar fotos: ${error.message}`);
    }

    return (data || []).map((item: any) => ({
      ...item.foto,
      vinculo: {
        id: item.id,
        tarefa_id: item.tarefa_id,
        foto_id: item.foto_id,
        contribui_progresso: item.contribui_progresso,
        percentual_contribuicao: item.percentual_contribuicao,
        criado_em: item.criado_em,
        criado_por: item.criado_por,
      },
      registro: item.foto.registro,
    }));
  } catch (error) {
    console.error("Erro em buscarFotosDaTarefa:", error);
    return [];
  }
}

/**
 * Buscar todas as tarefas vinculadas a uma foto
 */
export async function buscarTarefasDaFoto(
  fotoId: string
): Promise<CronogramaTarefa[]> {
  try {
    const { data, error } = await supabase
      .from("cronograma_tarefas_fotos")
      .select(
        `
        tarefa:cronograma_tarefas!inner (*)
      `
      )
      .eq("foto_id", fotoId);

    if (error) {
      console.error("Erro ao buscar tarefas da foto:", error);
      return [];
    }

    return (data || []).map((item: any) => item.tarefa);
  } catch (error) {
    console.error("Erro em buscarTarefasDaFoto:", error);
    return [];
  }
}

// ============================================================
// LÓGICA DE AUTOMAÇÍO DE PROGRESSO
// ============================================================

/**
 * Recalcular progresso da tarefa baseado nas fotos vinculadas
 * Regra MVP: 1 foto = 100% concluído
 */
export async function recalcularProgressoTarefa(
  tarefaId: string
): Promise<void> {
  try {
    // 1. Buscar tarefa
    const { data: tarefa, error: tarefaError } = await supabase
      .from("cronograma_tarefas")
      .select("*")
      .eq("id", tarefaId)
      .single();

    if (tarefaError || !tarefa) {
      console.error("Erro ao buscar tarefa:", tarefaError);
      return;
    }

    // 2. Se automaçÍo está desabilitada, não faz nada
    if (!tarefa.automacao_habilitada) {
      console.log(
        `AutomaçÍo desabilitada para tarefa ${tarefaId}, pulando recálculo`
      );
      return;
    }

    // 3. Contar fotos que contribuem para progresso
    const { data: vinculos, error: vinculosError } = await supabase
      .from("cronograma_tarefas_fotos")
      .select("*")
      .eq("tarefa_id", tarefaId)
      .eq("contribui_progresso", true);

    if (vinculosError) {
      console.error("Erro ao buscar vínculos:", vinculosError);
      return;
    }

    const totalFotos = vinculos?.length || 0;

    // 4. Calcular novo progresso
    // MVP: Se tem foto, 100% concluído. Se não tem foto, mantém progresso atual.
    let novoProgresso = tarefa.progresso;
    let novoStatus = tarefa.status;
    let dataConclusao: string | null = tarefa.data_conclusao_real;

    if (totalFotos > 0) {
      // Soma dos percentuais (MVP: cada foto contribui 100%)
      const somaPercentuais = vinculos!.reduce(
        (acc, v) => acc + (v.percentual_contribuicao || 0),
        0
      );

      novoProgresso = Math.min(100, Math.round(somaPercentuais));

      // Se atingiu 100%, marca como concluído
      if (novoProgresso === 100) {
        novoStatus = "concluido";
        dataConclusao = new Date().toISOString().split("T")[0];
      } else if (novoProgresso > 0 && tarefa.status === "pendente") {
        novoStatus = "em_andamento";
      }
    } else {
      // Sem fotos: restaura para estado anterior (se estava concluído por foto)
      if (tarefa.status === "concluido" && tarefa.progresso === 100) {
        novoProgresso = 0;
        novoStatus = "pendente";
        dataConclusao = null;
      }
    }

    // 5. Atualizar tarefa se houve mudança
    if (
      novoProgresso !== tarefa.progresso ||
      novoStatus !== tarefa.status ||
      dataConclusao !== tarefa.data_conclusao_real
    ) {
      const { error: updateError } = await supabase
        .from("cronograma_tarefas")
        .update({
          progresso: novoProgresso,
          status: novoStatus,
          data_conclusao_real: dataConclusao,
        })
        .eq("id", tarefaId);

      if (updateError) {
        console.error("Erro ao atualizar tarefa:", updateError);
        throw new Error(`Erro ao atualizar progresso: ${updateError.message}`);
      }

      console.log(
        `Tarefa ${tarefaId} atualizada: ${tarefa.progresso}% → ${novoProgresso}%, ${tarefa.status} → ${novoStatus}`
      );
    }
  } catch (error) {
    console.error("Erro em recalcularProgressoTarefa:", error);
    throw error;
  }
}

// ============================================================
// MATCH INTELIGENTE DE TAREFAS
// ============================================================

/**
 * Buscar tarefas candidatas para vincular foto
 * Usa funçÍo RPC do banco para match inteligente
 */
export async function buscarTarefasCandidatas(
  clienteId: string,
  dataFoto?: string
): Promise<TarefaCandidataMatch[]> {
  try {
    const { data, error } = await supabase.rpc(
      "buscar_tarefas_candidatas_cliente",
      {
        p_cliente_id: clienteId,
        p_data_foto: dataFoto || new Date().toISOString().split("T")[0],
      }
    );

    if (error) {
      console.error("Erro ao buscar tarefas candidatas:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Erro em buscarTarefasCandidatas:", error);
    return [];
  }
}

/**
 * Sugerir tarefa baseada no histórico do colaborador
 * Usa funçÍo RPC do banco
 */
export async function sugerirTarefaPorHistorico(
  colaboradorId: string,
  clienteId: string
): Promise<TarefaCandidataMatch | null> {
  try {
    const { data, error } = await supabase.rpc("sugerir_tarefa_por_historico", {
      p_colaborador_id: colaboradorId,
      p_cliente_id: clienteId,
    });

    if (error) {
      console.error("Erro ao sugerir tarefa:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Erro em sugerirTarefaPorHistorico:", error);
    return null;
  }
}

// ============================================================
// FUNÇÍO ALL-IN-ONE: CAPTURAR E VINCULAR
// ============================================================

/**
 * Captura foto e vincula diretamente a uma tarefa
 * FunçÍo completa que faz todo o fluxo:
 * 1. Cria registro de diário (se necessário)
 * 2. Upload da foto
 * 3. Vincula foto à tarefa
 * 4. Atualiza progresso automaticamente
 */
export async function capturarFotoParaTarefa(
  tarefaId: string,
  colaboradorId: string,
  clienteId: string,
  arquivo: File,
  legenda?: string
): Promise<{
  foto: DiarioObraFoto;
  vinculo: CronogramaTarefaFoto;
  tarefaAtualizada: boolean;
}> {
  try {
    // 1. Buscar tarefa para obter dados
    const { data: tarefa } = await supabase
      .from("cronograma_tarefas")
      .select("*")
      .eq("id", tarefaId)
      .single();

    if (!tarefa) {
      throw new Error("Tarefa não encontrada");
    }

    // 2. Criar registro de diário (vinculado à tarefa via etapa_cronograma_id)
    const registro = await criarRegistroDiario({
      cliente_id: clienteId,
      colaborador_id: colaboradorId,
      titulo: `Foto da tarefa: ${tarefa.titulo}`,
      descricao: legenda,
      data_registro: new Date().toISOString().split("T")[0],
    });

    // 3. Upload da foto
    const foto = await uploadFotoDiario(registro.id, arquivo, legenda, clienteId);

    // 4. Vincular foto à tarefa
    const vinculo = await vincularFotoTarefa({
      tarefa_id: tarefaId,
      foto_id: foto.id,
      contribui_progresso: true,
      percentual_contribuicao: 100.0,
    });

    // 5. Verificar se tarefa foi concluída
    const { data: tarefaAtualizada } = await supabase
      .from("cronograma_tarefas")
      .select("status")
      .eq("id", tarefaId)
      .single();

    return {
      foto,
      vinculo,
      tarefaAtualizada: tarefaAtualizada?.status === "concluido",
    };
  } catch (error) {
    console.error("Erro em capturarFotoParaTarefa:", error);
    throw error;
  }
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas de fotos vinculadas
 */
export async function obterEstatisticasFotos(projetoId?: string): Promise<{
  total_fotos: number;
  tarefas_com_fotos: number;
  tarefas_concluidas_por_foto: number;
  media_fotos_por_tarefa: number;
}> {
  try {
    let query = supabase.from("cronograma_tarefas_fotos").select(
      `
      *,
      tarefa:cronograma_tarefas!inner (
        id,
        status,
        projeto_id
      )
    `
    );

    if (projetoId) {
      query = query.eq("tarefa.projeto_id", projetoId);
    }

    const { data, error } = await query;

    if (error || !data) {
      return {
        total_fotos: 0,
        tarefas_com_fotos: 0,
        tarefas_concluidas_por_foto: 0,
        media_fotos_por_tarefa: 0,
      };
    }

    const tarefasUnicas = new Set(data.map((d: any) => d.tarefa_id));
    const tarefasConcluidas = new Set(
      data.filter((d: any) => d.tarefa.status === "concluido").map((d: any) => d.tarefa_id)
    );

    return {
      total_fotos: data.length,
      tarefas_com_fotos: tarefasUnicas.size,
      tarefas_concluidas_por_foto: tarefasConcluidas.size,
      media_fotos_por_tarefa:
        tarefasUnicas.size > 0
          ? Math.round((data.length / tarefasUnicas.size) * 10) / 10
          : 0,
    };
  } catch (error) {
    console.error("Erro em obterEstatisticasFotos:", error);
    return {
      total_fotos: 0,
      tarefas_com_fotos: 0,
      tarefas_concluidas_por_foto: 0,
      media_fotos_por_tarefa: 0,
    };
  }
}

// ============================================================
// VALIDAÇÕES
// ============================================================

/**
 * Validar se foto pode ser vinculada a tarefa
 */
export async function validarVinculoFoto(
  tarefaId: string,
  fotoId: string
): Promise<{
  valido: boolean;
  erro?: string;
}> {
  try {
    // 1. Tarefa existe?
    const { data: tarefa, error: tarefaError } = await supabase
      .from("cronograma_tarefas")
      .select(
        `
        *,
        projeto:projetos!inner (
          id,
          cliente_id
        )
      `
      )
      .eq("id", tarefaId)
      .single();

    if (tarefaError || !tarefa) {
      return { valido: false, erro: "Tarefa não encontrada" };
    }

    // 2. Foto existe?
    const { data: foto, error: fotoError } = await supabase
      .from("obra_registros_fotos")
      .select(
        `
        *,
        registro:obra_registros!inner (
          id,
          cliente_id
        )
      `
      )
      .eq("id", fotoId)
      .single();

    if (fotoError || !foto) {
      return { valido: false, erro: "Foto não encontrada" };
    }

    // 3. Tarefa está cancelada?
    if (tarefa.status === "cancelado") {
      return {
        valido: false,
        erro: "não é possível vincular fotos a tarefas canceladas",
      };
    }

    // 4. Cliente da foto corresponde ao cliente do projeto?
    if (tarefa.projeto.cliente_id !== foto.registro.cliente_id) {
      return {
        valido: false,
        erro: "Foto é de outro cliente",
      };
    }

    // 5. Verificar se já não está vinculada
    const { data: vinculoExistente } = await supabase
      .from("cronograma_tarefas_fotos")
      .select("id")
      .match({ tarefa_id: tarefaId, foto_id: fotoId })
      .single();

    if (vinculoExistente) {
      return {
        valido: false,
        erro: "Foto já está vinculada a esta tarefa",
      };
    }

    return { valido: true };
  } catch (error) {
    console.error("Erro em validarVinculoFoto:", error);
    return {
      valido: false,
      erro: "Erro ao validar vínculo",
    };
  }
}


