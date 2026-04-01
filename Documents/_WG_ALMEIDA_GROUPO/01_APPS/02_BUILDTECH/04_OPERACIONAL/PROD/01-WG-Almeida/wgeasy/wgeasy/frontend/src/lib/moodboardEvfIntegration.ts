// ============================================================
// API: IntegraçÍo Moodboard <-> EVF
// Sistema WG Easy 2026 - Grupo WG Almeida
// Sincroniza escolhas do moodboard com o Estudo de Viabilidade
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { EtapaEscolha } from "@/types/moodboardCliente";

// ============================================================
// MAPEAMENTO EVF <-> MOODBOARD
// ============================================================

/**
 * Mapeamento entre categorias do EVF e tipos de etapa do moodboard
 */
export const EVF_TO_MOODBOARD_MAP: Record<string, EtapaEscolha> = {
  CLM: "loucas_metais", // Cubas, Loucas e Metais
  MAR: "marcenaria", // Marcenaria
  ILU: "iluminacao", // IluminaçÍo
  ABA: "revestimentos", // Acabamentos
  MRM: "revestimentos", // Marmoraria
  MPT: "pintura", // MÍo de Obra Pintura (cores Suvinil)
  AUT: "automacao", // AutomaçÍo
  PIS: "revestimentos", // Piso -> revestimentos
  PIN: "pintura", // Pintura (MDO) -> pintura
};

/**
 * Mapeamento reverso: tipo de etapa -> categorias EVF
 */
export const MOODBOARD_TO_EVF_MAP: Record<EtapaEscolha, string[]> = {
  revestimentos: ["ABA", "MRM", "PIS"],
  loucas_metais: ["CLM"],
  marcenaria: ["MAR"],
  iluminacao: ["ILU"],
  pintura: ["MPT", "PIN"],
  automacao: ["AUT"],
};

// ============================================================
// TIPOS
// ============================================================

interface EVFCategoria {
  id: string;
  codigo: string;
  nome: string;
  valor_m2: number;
  multiplicador: number;
}

interface EVFEstudo {
  id: string;
  contrato_id: string | null;
  oportunidade_id: string | null;
  metragem_total: number;
  padrao_acabamento: "economico" | "medio_alto" | "alto_luxo";
  categorias: EVFCategoria[];
  valor_total: number;
}

interface ValorPorCategoria {
  categoria_evf: string;
  valor_selecionado: number;
  valor_estimado_evf: number;
  diferenca: number;
  percentual_diferenca: number;
}

interface ComparativoEVF {
  estudo_id: string;
  contrato_id: string;
  valor_total_evf: number;
  valor_total_selecionado: number;
  diferenca_total: number;
  percentual_diferenca: number;
  por_categoria: ValorPorCategoria[];
}

// ============================================================
// FUNÇÕES DE INTEGRAÇÍO
// ============================================================

/**
 * Buscar estudo EVF vinculado ao contrato
 */
export async function buscarEstudoEVFContrato(
  contratoId: string
): Promise<EVFEstudo | null> {
  const { data, error } = await supabase
    .from("evf_estudos")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw error;
  return data as EVFEstudo | null;
}

/**
 * Calcular valor total selecionado por categoria EVF
 */
export async function calcularValorPorCategoriaEVF(
  moodboardId: string
): Promise<Map<string, number>> {
  const { data, error } = await supabase
    .from("memorial_acabamentos")
    .select("categoria, preco_total")
    .eq("moodboard_id", moodboardId)
    .eq("selecionado_por_cliente", true);

  if (error) throw error;

  const valoresPorCategoria = new Map<string, number>();

  for (const item of data || []) {
    // Mapear categoria do memorial para categoria EVF
    const categoriaEVF = mapearCategoriaMemorialParaEVF(item.categoria);
    if (categoriaEVF) {
      const valorAtual = valoresPorCategoria.get(categoriaEVF) || 0;
      valoresPorCategoria.set(categoriaEVF, valorAtual + (item.preco_total || 0));
    }
  }

  return valoresPorCategoria;
}

/**
 * Mapear categoria do memorial para categoria EVF
 */
function mapearCategoriaMemorialParaEVF(categoriaMemorial: string): string | null {
  const mapeamento: Record<string, string> = {
    "LOUÇAS": "CLM",
    "METAIS": "CLM",
    "ACESSÓRIOS": "CLM",
    "MARCENARIA": "MAR",
    "ILUMINAÇÍO": "ILU",
    "ACABAMENTOS E REVESTIMENTOS": "ABA",
    "MARMORARIA": "MRM",
    "PINTURA": "MPT",
    "AUTOMAÇÍO": "AUT",
    "PISO": "PIS",
    "PISOS": "PIS",
    "PINTURA MDO": "PIN",
  };

  return mapeamento[categoriaMemorial] || null;
}

/**
 * Gerar comparativo entre EVF e valores selecionados
 */
export async function gerarComparativoEVF(
  contratoId: string,
  moodboardId: string
): Promise<ComparativoEVF | null> {
  // Buscar estudo EVF
  const estudo = await buscarEstudoEVFContrato(contratoId);
  if (!estudo) return null;

  // Calcular valores selecionados
  const valoresSelecionados = await calcularValorPorCategoriaEVF(moodboardId);

  // Categorias relevantes para moodboard
  const categoriasRelevantes = ["CLM", "MAR", "ILU", "ABA", "MRM", "MPT", "AUT"];

  // Calcular comparativo por categoria
  const porCategoria: ValorPorCategoria[] = [];
  let valorTotalEVF = 0;
  let valorTotalSelecionado = 0;

  for (const catCodigo of categoriasRelevantes) {
    const categoriaEVF = estudo.categorias?.find(
      (c: EVFCategoria) => c.codigo === catCodigo
    );

    if (categoriaEVF) {
      const valorEVF = categoriaEVF.valor_m2 * estudo.metragem_total * categoriaEVF.multiplicador;
      const valorSelecionado = valoresSelecionados.get(catCodigo) || 0;
      const diferenca = valorSelecionado - valorEVF;
      const percentualDiferenca = valorEVF > 0 ? (diferenca / valorEVF) * 100 : 0;

      valorTotalEVF += valorEVF;
      valorTotalSelecionado += valorSelecionado;

      porCategoria.push({
        categoria_evf: catCodigo,
        valor_selecionado: valorSelecionado,
        valor_estimado_evf: valorEVF,
        diferenca,
        percentual_diferenca: percentualDiferenca,
      });
    }
  }

  const diferencaTotal = valorTotalSelecionado - valorTotalEVF;
  const percentualDiferencaTotal = valorTotalEVF > 0
    ? (diferencaTotal / valorTotalEVF) * 100
    : 0;

  return {
    estudo_id: estudo.id,
    contrato_id: contratoId,
    valor_total_evf: valorTotalEVF,
    valor_total_selecionado: valorTotalSelecionado,
    diferenca_total: diferencaTotal,
    percentual_diferenca: percentualDiferencaTotal,
    por_categoria: porCategoria,
  };
}

/**
 * Atualizar valor real no EVF com base nas seleções
 */
export async function atualizarValorRealEVF(
  estudoId: string,
  categoriaEVF: string,
  valorReal: number
): Promise<void> {
  // Buscar estudo atual
  const { data: estudo, error: fetchError } = await supabase
    .from("evf_estudos")
    .select("categorias")
    .eq("id", estudoId)
    .single();

  if (fetchError) throw fetchError;

  // Atualizar categoria com valor real
  const categoriasAtualizadas = estudo.categorias.map((cat: EVFCategoria) => {
    if (cat.codigo === categoriaEVF) {
      return {
        ...cat,
        valor_real: valorReal,
        atualizado_moodboard: true,
        data_atualizacao: new Date().toISOString(),
      };
    }
    return cat;
  });

  // Salvar
  const { error: updateError } = await supabase
    .from("evf_estudos")
    .update({ categorias: categoriasAtualizadas })
    .eq("id", estudoId);

  if (updateError) throw updateError;
}

/**
 * Sincronizar todos os valores do moodboard com EVF
 */
export async function sincronizarMoodboardComEVF(
  contratoId: string,
  moodboardId: string
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    // Buscar estudo EVF
    const estudo = await buscarEstudoEVFContrato(contratoId);
    if (!estudo) {
      return {
        sucesso: false,
        mensagem: "Nenhum estudo EVF encontrado para este contrato",
      };
    }

    // Calcular valores
    const valoresSelecionados = await calcularValorPorCategoriaEVF(moodboardId);

    // Atualizar cada categoria
    for (const [categoria, valor] of valoresSelecionados.entries()) {
      await atualizarValorRealEVF(estudo.id, categoria, valor);
    }

    return {
      sucesso: true,
      mensagem: `Sincronizado com sucesso. ${valoresSelecionados.size} categorias atualizadas.`,
    };
  } catch (error) {
    console.error("Erro ao sincronizar com EVF:", error);
    return {
      sucesso: false,
      mensagem: "Erro ao sincronizar com EVF. Verifique o console.",
    };
  }
}

/**
 * Verificar se valor selecionado está dentro da margem do EVF
 */
export function verificarMargemEVF(
  valorEVF: number,
  valorSelecionado: number,
  margemAceitavel = 0.1 // 10% por padrÍo
): { dentroMargem: boolean; percentualDiferenca: number; alerta: string | null } {
  const diferenca = valorSelecionado - valorEVF;
  const percentual = valorEVF > 0 ? diferenca / valorEVF : 0;

  const dentroMargem = Math.abs(percentual) <= margemAceitavel;

  let alerta: string | null = null;
  if (!dentroMargem) {
    if (percentual > 0) {
      alerta = `Valor ${(percentual * 100).toFixed(1)}% acima do estimado no EVF`;
    } else {
      alerta = `Valor ${Math.abs(percentual * 100).toFixed(1)}% abaixo do estimado no EVF`;
    }
  }

  return {
    dentroMargem,
    percentualDiferenca: percentual * 100,
    alerta,
  };
}

// ============================================================
// HOOKS PARA COMPONENTES
// ============================================================

/**
 * Dados formatados para exibiçÍo no componente
 */
export interface EVFResumoDisplay {
  categoria: string;
  nome: string;
  valorEVF: string;
  valorSelecionado: string;
  diferenca: string;
  percentual: string;
  status: "ok" | "acima" | "abaixo" | "pendente";
  cor: string;
}

/**
 * Formatar comparativo para exibiçÍo
 */
export function formatarComparativoParaDisplay(
  comparativo: ComparativoEVF
): EVFResumoDisplay[] {
  const nomesCategorias: Record<string, string> = {
    CLM: "Cubas, Louças e Metais",
    MAR: "Marcenaria",
    ILU: "IluminaçÍo",
    ABA: "Acabamentos",
    MRM: "Marmoraria",
    MPT: "Pintura",
    AUT: "AutomaçÍo",
  };

  return comparativo.por_categoria.map((cat) => {
    const formatCurrency = (v: number) =>
      new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(v);

    let status: EVFResumoDisplay["status"] = "pendente";
    let cor = "#9CA3AF"; // gray

    if (cat.valor_selecionado > 0) {
      if (cat.percentual_diferenca > 10) {
        status = "acima";
        cor = "#EF4444"; // red
      } else if (cat.percentual_diferenca < -10) {
        status = "abaixo";
        cor = "#F59E0B"; // amber
      } else {
        status = "ok";
        cor = "#22C55E"; // green
      }
    }

    return {
      categoria: cat.categoria_evf,
      nome: nomesCategorias[cat.categoria_evf] || cat.categoria_evf,
      valorEVF: formatCurrency(cat.valor_estimado_evf),
      valorSelecionado: formatCurrency(cat.valor_selecionado),
      diferenca: formatCurrency(cat.diferenca),
      percentual: `${cat.percentual_diferenca > 0 ? "+" : ""}${cat.percentual_diferenca.toFixed(1)}%`,
      status,
      cor,
    };
  });
}

