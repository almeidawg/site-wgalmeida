// src/lib/projectsIntegration.ts
import { supabase } from "@/lib/supabaseClient";

export interface ResumoProjetoFinanceiro {
  orcado: number;
  realizadoEntrada: number;
  realizadoSaida: number;
  saldo: number;
}

/**
 * Busca o projeto só para obter a obra vinculada.
 */
async function buscarProjetoObra(projectId: string): Promise<{ obra_id: string | null }> {
  const { data, error } = await supabase
    .from("projetos")
    .select("obra_id")
    .eq("id", projectId)
    .single();

  if (error) throw error;
  return data as { obra_id: string | null };
}

/**
 * Soma o valor total de orçamentos aprovados da obra.
 */
async function buscarResumoOrcamentoPorObra(obraId: string): Promise<number> {
  const { data, error } = await supabase
    .from("orcamentos")
    .select("valor_total")
    .eq("obra_id", obraId)
    .eq("status", "aprovado");

  if (error) throw error;

  return (data || []).reduce((acc: number, item: any) => acc + Number(item.valor_total || 0), 0);
}

/**
 * Soma entradas e saídas financeiras da obra.
 */
async function buscarResumoFinanceiroPorObra(obraId: string): Promise<{
  entradas: number;
  saidas: number;
}> {
  const { data, error } = await supabase
    .from("financeiro_lancamentos")
    .select("tipo, valor_total")
    .eq("obra_id", obraId);

  if (error) throw error;

  let entradas = 0;
  let saidas = 0;

  (data || []).forEach((item: any) => {
    const valor = Number(item.valor_total || 0);
    if (item.tipo === "entrada") entradas += valor;
    if (item.tipo === "saida") saidas += valor;
  });

  return { entradas, saidas };
}

/**
 * Resumo consolidado: ORÇADO x REALIZADO por projeto (via obra).
 */
export async function buscarResumoProjetoFinanceiro(
  projectId: string
): Promise<ResumoProjetoFinanceiro | null> {
  const { obra_id } = await buscarProjetoObra(projectId);

  if (!obra_id) {
    // Projeto sem vínculo de obra → sem integraçÍo financeira
    return {
      orcado: 0,
      realizadoEntrada: 0,
      realizadoSaida: 0,
      saldo: 0,
    };
  }

  const [orcado, resumoFin] = await Promise.all([
    buscarResumoOrcamentoPorObra(obra_id),
    buscarResumoFinanceiroPorObra(obra_id),
  ]);

  const saldo = resumoFin.entradas - resumoFin.saidas;

  return {
    orcado,
    realizadoEntrada: resumoFin.entradas,
    realizadoSaida: resumoFin.saidas,
    saldo,
  };
}

