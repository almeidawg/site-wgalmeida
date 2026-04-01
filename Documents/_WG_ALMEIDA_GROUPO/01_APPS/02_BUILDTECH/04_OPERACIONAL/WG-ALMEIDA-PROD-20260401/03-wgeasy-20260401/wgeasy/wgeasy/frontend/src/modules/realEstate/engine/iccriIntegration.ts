// ─── ICCRI Integration — Custo de Construção e Reforma ───────────────────────
// Conecta o motor ICCRI (já existente em /sistema/iccri) com o EasyRealState
// Alimenta o ObraEasy e o EasyRealState com mesma base de dados

import { supabase } from "@/lib/supabaseClient";
import type { PadraoImovel, CustoConstrutivo } from "../models/types";

// Mapeamento de padrão imobiliário → padrão ICCRI
const PADRAO_ICCRI_MAP: Record<PadraoImovel, string> = {
  popular: "R1-B",   // Residencial Unifamiliar Baixo Padrão
  medio:   "R1-N",   // Residencial Unifamiliar Normal
  alto:    "R1-A",   // Residencial Unifamiliar Alto Padrão
  luxo:    "R8-N",   // Residencial Multifamiliar Alto Padrão
};

// ─── Busca custo de construção/reforma via ICCRI no Supabase ─────────────────

export async function getCustoConstrutivo(
  padrao: PadraoImovel,
  estado: string,
  capital_interior: "capital" | "interior" = "capital"
): Promise<CustoConstrutivo | null> {
  // Busca multiplicador regional do SINAPI no banco
  const [regionalResult, indiceResult] = await Promise.all([
    supabase
      .from("iccri_precos_regionais")
      .select("multiplicador_sinapi, nome_estado")
      .eq("estado", estado)
      .limit(1)
      .single(),
    supabase
      .from("iccri_indice")
      .select("valor_indice, competencia")
      .order("competencia", { ascending: false })
      .limit(1)
      .single(),
  ]);

  // Fator regional: multiplicador SINAPI (SP capital = 1.0)
  const fator_regional = Number(regionalResult.data?.multiplicador_sinapi ?? 1.0);
  // Índice ICCRI atual do banco (fallback 176.02 = Mar/2026)
  const indice_iccri = Number(indiceResult.data?.valor_indice ?? 176.02);

  // Custo base pelo padrão × fator regional × ajuste pelo índice vs base 2026
  const custos = CUSTO_PADRAO_2026.construcao[padrao];
  const fator_indice = indice_iccri / 176.02; // base = Mar/2026
  const custo_base = Math.round(custos.ref * fator_regional * fator_indice);

  return {
    padrao,
    custo_m2_material: Math.round(custo_base * 0.56),
    custo_m2_mao_obra: Math.round(custo_base * 0.44),
    custo_m2_total: custo_base,
    fator_regional,
    indice_iccri,
    estado,
    capital_interior,
    referencia: "ICCRI/SINAPI",
    data_referencia: indiceResult.data?.competencia || new Date().toISOString().slice(0, 10),
  };
}

// ─── Valores padrão 2026 (fallback quando ICCRI não tem dados regionais) ─────

export const CUSTO_PADRAO_2026 = {
  construcao: {
    popular: { min: 2000, max: 2600, ref: 2300 },
    medio:   { min: 2700, max: 3800, ref: 3200 },
    alto:    { min: 4000, max: 5500, ref: 4700 },
    luxo:    { min: 5500, max: 12000, ref: 7500 },
  },
  reforma: {
    popular: { min: 600,  max: 1200, ref: 900 },
    medio:   { min: 1200, max: 2800, ref: 2000 },
    alto:    { min: 2800, max: 5000, ref: 3800 },
    luxo:    { min: 5000, max: 15000, ref: 8000 },
  },
  mao_obra: {
    pedreiro_mes: 6800,
    assentamento_porcelanato_m2: 160,
    pisos_grandes_formatos_m2: 250,
    alvenaria_vedacao_m2: 110,
  },
  incc_acumulado_12m: 5.81, // % Mar/2026
  composicao: {
    material_percentual: 0.56,
    mao_obra_percentual: 0.44,
  },
};

// ─── Cálculo de custo de obra por padrão ─────────────────────────────────────

export function calcularCustoObra(
  area_m2: number,
  padrao: PadraoImovel,
  tipo: "construcao" | "reforma" = "construcao",
  fator_regional = 1.0
): { minimo: number; maximo: number; referencia: number; por_m2: number } {
  const custos = CUSTO_PADRAO_2026[tipo][padrao];
  return {
    por_m2:      Math.round(custos.ref * fator_regional),
    referencia:  Math.round(custos.ref * fator_regional * area_m2),
    minimo:      Math.round(custos.min * fator_regional * area_m2),
    maximo:      Math.round(custos.max * fator_regional * area_m2),
  };
}
