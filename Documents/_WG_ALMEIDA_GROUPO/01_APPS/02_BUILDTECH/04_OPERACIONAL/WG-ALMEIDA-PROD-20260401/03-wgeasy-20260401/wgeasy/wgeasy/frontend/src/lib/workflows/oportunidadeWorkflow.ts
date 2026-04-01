/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// WORKFLOW: Oportunidades
// OrquestraçÍo do fluxo de fechamento de oportunidades
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { UnidadeNegocio } from "@/types/contratos";
import type { OportunidadeChecklistResumo } from "@/types/oportunidadesChecklist";
import {
  podeAvancarOportunidade,
  obterResumoChecklist,
} from "@/lib/oportunidadesChecklistApi";
import { criarContrato } from "@/lib/contratosApi";

// ============================================================
// TIPOS
// ============================================================

export interface OportunidadeFechamentoRequest {
  oportunidade_id: string;
  unidades_negocio: UnidadeNegocio[];
  observacoes?: string;
  gerar_contratos: boolean;
}

export interface OportunidadeFechamentoResult {
  sucesso: boolean;
  oportunidade_id: string;
  contratos_criados: Array<{
    id: string;
    numero: string;
    unidade_negocio: UnidadeNegocio;
  }>;
  mensagem: string;
  avisos?: string[];
}

export interface ValidacaoOportunidade {
  pode_fechar: boolean;
  motivos_bloqueio: string[];
  avisos: string[];
  resumo_checklist?: OportunidadeChecklistResumo;
}

// ============================================================
// VALIDAÇÕES
// ============================================================

/**
 * Valida se uma oportunidade pode ser fechada
 */
export async function validarFechamentoOportunidade(
  oportunidade_id: string
): Promise<ValidacaoOportunidade> {
  const resultado: ValidacaoOportunidade = {
    pode_fechar: true,
    motivos_bloqueio: [],
    avisos: [],
  };

  // Buscar oportunidade
  const { data: oportunidade, error: oppError } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("id", oportunidade_id)
    .single();

  if (oppError || !oportunidade) {
    resultado.pode_fechar = false;
    resultado.motivos_bloqueio.push("Oportunidade não encontrada");
    return resultado;
  }

  // Verificar se está no estágio "Ganho"
  if (oportunidade.estagio !== "ganho") {
    resultado.avisos.push(
      `Oportunidade está no estágio "${oportunidade.estagio}". Recomenda-se que esteja em "ganho" antes de fechar.`
    );
  }

  // Verificar checklist obrigatório
  try {
    const validacaoChecklist = await podeAvancarOportunidade(oportunidade_id);
    if (!validacaoChecklist.pode) {
      resultado.pode_fechar = false;
      resultado.motivos_bloqueio.push(
        validacaoChecklist.motivo || "Checklist obrigatório pendente"
      );
    }

    // Obter resumo do checklist
    const resumo = await obterResumoChecklist(oportunidade_id);
    resultado.resumo_checklist = resumo;

    if (resumo.percentual_concluido < 100) {
      resultado.avisos.push(
        `Checklist não está 100% concluído (${resumo.percentual_concluido}%)`
      );
    }
  } catch (error) {
    // Se não houver checklist, apenas avisar
    resultado.avisos.push("Nenhum checklist configurado para esta oportunidade");
  }

  // Verificar se já existe contrato
  const { data: contratosExistentes } = await supabase
    .from("contratos")
    .select("id, numero, unidade_negocio")
    .eq("oportunidade_id", oportunidade_id);

  if (contratosExistentes && contratosExistentes.length > 0) {
    resultado.avisos.push(
      `Já existem ${contratosExistentes.length} contrato(s) vinculado(s) a esta oportunidade`
    );
  }

  // Verificar se tem valor
  if (!oportunidade.valor || oportunidade.valor <= 0) {
    resultado.avisos.push("Oportunidade não possui valor definido");
  }

  // Verificar se tem cliente
  if (!oportunidade.cliente_id) {
    resultado.pode_fechar = false;
    resultado.motivos_bloqueio.push("Oportunidade não possui cliente vinculado");
  }

  return resultado;
}

// ============================================================
// FECHAMENTO DE OPORTUNIDADE
// ============================================================

/**
 * Fecha uma oportunidade e gera contratos
 */
export async function fecharOportunidade(
  request: OportunidadeFechamentoRequest
): Promise<OportunidadeFechamentoResult> {
  const { oportunidade_id, unidades_negocio, observacoes, gerar_contratos } =
    request;

  const resultado: OportunidadeFechamentoResult = {
    sucesso: false,
    oportunidade_id,
    contratos_criados: [],
    mensagem: "",
    avisos: [],
  };

  try {
    // Validar fechamento
    const validacao = await validarFechamentoOportunidade(oportunidade_id);
    if (!validacao.pode_fechar) {
      resultado.mensagem = `não é possível fechar a oportunidade: ${validacao.motivos_bloqueio.join(", ")}`;
      resultado.avisos = validacao.avisos;
      return resultado;
    }

    // Buscar dados da oportunidade
    const { data: oportunidade, error: oppError } = await supabase
      .from("oportunidades")
      .select("*, cliente:pessoas(*)")
      .eq("id", oportunidade_id)
      .single();

    if (oppError || !oportunidade) {
      resultado.mensagem = "Erro ao buscar dados da oportunidade";
      return resultado;
    }

    // Atualizar oportunidade
    const updateData: any = {
      estagio: "ganho",
      data_fechamento: new Date().toISOString(),
      unidades_negocio,
    };

    if (observacoes) {
      updateData.observacoes = observacoes;
    }

    const { error: updateError } = await supabase
      .from("oportunidades")
      .update(updateData)
      .eq("id", oportunidade_id);

    if (updateError) {
      resultado.mensagem = "Erro ao atualizar oportunidade";
      return resultado;
    }

    // Gerar contratos se solicitado
    if (gerar_contratos && unidades_negocio.length > 0) {
      for (const unidade of unidades_negocio) {
        try {
          const contrato = await criarContrato({
            oportunidade_id,
            cliente_id: oportunidade.cliente_id,
            unidade_negocio: unidade,
            descricao: oportunidade.titulo,
            observacoes:
              observacoes || `Contrato gerado automaticamente da oportunidade ${oportunidade.titulo}`,
            prazo_entrega_dias: 30, // Valor padrÍo, pode ser ajustado
          });

          resultado.contratos_criados.push({
            id: contrato.id,
            numero: contrato.numero,
            unidade_negocio: contrato.unidade_negocio,
          });
        } catch (error: any) {
          resultado.avisos?.push(
            `Erro ao criar contrato para ${unidade}: ${error.message}`
          );
        }
      }
    }

    resultado.sucesso = true;
    resultado.mensagem = gerar_contratos
      ? `Oportunidade fechada com sucesso! ${resultado.contratos_criados.length} contrato(s) criado(s).`
      : "Oportunidade fechada com sucesso!";
    resultado.avisos = validacao.avisos;

    return resultado;
  } catch (error: any) {
    resultado.mensagem = `Erro ao fechar oportunidade: ${error.message}`;
    return resultado;
  }
}

// ============================================================
// REABERTURA DE OPORTUNIDADE
// ============================================================

/**
 * Reabre uma oportunidade fechada
 */
export async function reabrirOportunidade(
  oportunidade_id: string,
  novo_estagio: string = "negociacao"
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    // Verificar se tem contratos ativos
    const { data: contratosAtivos } = await supabase
      .from("contratos")
      .select("id, numero, status")
      .eq("oportunidade_id", oportunidade_id)
      .not("status", "in", "(rascunho,concluido,cancelado)");

    if (contratosAtivos && contratosAtivos.length > 0) {
      return {
        sucesso: false,
        mensagem: `não é possível reabrir: existem ${contratosAtivos.length} contrato(s) ativo(s) vinculado(s)`,
      };
    }

    // Reabrir oportunidade
    const { error } = await supabase
      .from("oportunidades")
      .update({
        estagio: novo_estagio,
        data_fechamento: null,
      })
      .eq("id", oportunidade_id);

    if (error) throw error;

    return {
      sucesso: true,
      mensagem: "Oportunidade reaberta com sucesso",
    };
  } catch (error: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao reabrir oportunidade: ${error.message}`,
    };
  }
}

// ============================================================
// ATUALIZAÇÍO DE ESTÁGIO
// ============================================================

/**
 * Atualiza o estágio de uma oportunidade com validações
 */
export async function atualizarEstagioOportunidade(
  oportunidade_id: string,
  novo_estagio: string
): Promise<{ sucesso: boolean; mensagem: string; avisos?: string[] }> {
  try {
    const avisos: string[] = [];

    // Se está indo para "ganho", validar checklist
    if (novo_estagio === "ganho") {
      const validacao = await validarFechamentoOportunidade(oportunidade_id);

      if (!validacao.pode_fechar) {
        return {
          sucesso: false,
          mensagem: `não é possível mover para "ganho": ${validacao.motivos_bloqueio.join(", ")}`,
          avisos: validacao.avisos,
        };
      }

      avisos.push(...validacao.avisos);
    }

    // Atualizar estágio
    const updateData: any = { estagio: novo_estagio };

    // Se está movendo para "ganho", registrar data de fechamento
    if (novo_estagio === "ganho") {
      updateData.data_fechamento = new Date().toISOString();
    }

    // Se está saindo de "ganho", limpar data de fechamento
    const { data: oportunidadeAtual } = await supabase
      .from("oportunidades")
      .select("estagio")
      .eq("id", oportunidade_id)
      .single();

    if (oportunidadeAtual?.estagio === "ganho" && novo_estagio !== "ganho") {
      updateData.data_fechamento = null;
    }

    const { error } = await supabase
      .from("oportunidades")
      .update(updateData)
      .eq("id", oportunidade_id);

    if (error) throw error;

    return {
      sucesso: true,
      mensagem: "Estágio atualizado com sucesso",
      avisos: avisos.length > 0 ? avisos : undefined,
    };
  } catch (error: any) {
    return {
      sucesso: false,
      mensagem: `Erro ao atualizar estágio: ${error.message}`,
    };
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Obter estatísticas de conversÍo de oportunidades
 */
export async function obterEstatisticasConversao(): Promise<{
  total_oportunidades: number;
  total_ganhas: number;
  total_perdidas: number;
  taxa_conversao: number;
  valor_total_ganho: number;
  valor_medio_ganho: number;
}> {
  const { data: todasOportunidades } = await supabase
    .from("oportunidades")
    .select("etapa, valor");

  if (!todasOportunidades) {
    return {
      total_oportunidades: 0,
      total_ganhas: 0,
      total_perdidas: 0,
      taxa_conversao: 0,
      valor_total_ganho: 0,
      valor_medio_ganho: 0,
    };
  }

  const total_oportunidades = todasOportunidades.length;
  const ganhas = todasOportunidades.filter((o: any) => o.estagio === "ganho");
  const perdidas = todasOportunidades.filter((o: any) => o.estagio === "perdido");

  const total_ganhas = ganhas.length;
  const total_perdidas = perdidas.length;
  const taxa_conversao = total_oportunidades > 0 ? (total_ganhas / total_oportunidades) * 100 : 0;

  const valor_total_ganho = ganhas.reduce((acc: number, o: any) => acc + (o.valor || 0), 0);
  const valor_medio_ganho = total_ganhas > 0 ? valor_total_ganho / total_ganhas : 0;

  return {
    total_oportunidades,
    total_ganhas,
    total_perdidas,
    taxa_conversao: Math.round(taxa_conversao * 100) / 100,
    valor_total_ganho,
    valor_medio_ganho,
  };
}



