// ─── AVM — Automated Valuation Model ─────────────────────────────────────────
// Motor de precificação imobiliária do EasyRealState
// Fórmula: preco_m2_final = mediana(comparaveis) × fator_andar × fator_vista × fator_padrao × fator_localizacao × fator_liquidez

import type {
  Transacao,
  Imovel,
  ResultadoAVM,
  FatoresAjuste,
  Comparavel,
  InsightMercado,
  PadraoImovel,
} from "../models/types";

// ─── Tabelas de fatores ───────────────────────────────────────────────────────

const FATOR_PADRAO: Record<PadraoImovel, number> = {
  popular: 0.75,
  medio:   1.00,
  alto:    1.20,
  luxo:    1.50,
};

function calcularFatorAndar(andar?: number): number {
  if (!andar || andar <= 1) return 1.0;
  if (andar <= 5)  return 1.0 + (andar - 1) * 0.02;  // +2% por andar até o 5o
  if (andar <= 15) return 1.08 + (andar - 5) * 0.015; // +1.5% por andar 6-15
  return 1.23 + (andar - 15) * 0.01;                  // +1% acima do 15o
}

function calcularFatorLiquidez(liquidez_media_dias?: number): number {
  if (!liquidez_media_dias) return 1.0;
  if (liquidez_media_dias <= 30)  return 1.08; // alta liquidez
  if (liquidez_media_dias <= 90)  return 1.04;
  if (liquidez_media_dias <= 180) return 1.00; // média
  if (liquidez_media_dias <= 365) return 0.95;
  return 0.90; // baixa liquidez
}

// ─── Distância geográfica (Haversine) ────────────────────────────────────────

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Score de confiança ───────────────────────────────────────────────────────

function calcularScoreConfianca(
  totalComparaveis: number,
  recenciaMedia: number, // dias desde a transação
  distanciaMedia: number // metros
): number {
  const scoreQuantidade = Math.min(totalComparaveis / 20, 1) * 40;
  const scoreRecencia = Math.max(0, 1 - recenciaMedia / 730) * 35; // peso máximo em 2 anos
  const scoreProximidade = Math.max(0, 1 - distanciaMedia / 2000) * 25;
  return Math.round(scoreQuantidade + scoreRecencia + scoreProximidade);
}

// ─── Mediana ─────────────────────────────────────────────────────────────────

function mediana(valores: number[]): number {
  if (valores.length === 0) return 0;
  const sorted = [...valores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

// ─── Insight de mercado ───────────────────────────────────────────────────────

function gerarInsight(precoImovel: number, medianaRegiao: number): InsightMercado {
  const desvio = ((precoImovel - medianaRegiao) / medianaRegiao) * 100;

  if (desvio <= -15) return {
    label: "oportunidade",
    descricao: "Imóvel abaixo do mercado — potencial de valorização imediata.",
    percentual_desvio: desvio,
  };
  if (desvio <= -5) return {
    label: "abaixo_mercado",
    descricao: "Valor ligeiramente abaixo da mediana regional.",
    percentual_desvio: desvio,
  };
  if (desvio <= 5) return {
    label: "mercado",
    descricao: "Valor alinhado com a mediana do mercado regional.",
    percentual_desvio: desvio,
  };
  if (desvio <= 20) return {
    label: "acima_mercado",
    descricao: "Valor acima da mediana — verifique diferenciais que justifiquem.",
    percentual_desvio: desvio,
  };
  return {
    label: "supervalorizado",
    descricao: "Valor significativamente acima do mercado regional.",
    percentual_desvio: desvio,
  };
}

// ─── Seleção de comparáveis ───────────────────────────────────────────────────

export function selecionarComparaveis(
  imovel: Imovel,
  transacoes: Transacao[],
  raioMetros = 1500,
  maxComparaveis = 30
): Comparavel[] {
  if (!imovel.lat || !imovel.lng) return [];

  return transacoes
    .filter((t) => {
      if (t.tipo !== imovel.tipo) return false;
      const dist = distanciaMetros(imovel.lat!, imovel.lng!, t.lat, t.lng);
      return dist <= raioMetros;
    })
    .map((t) => {
      const distancia = distanciaMetros(imovel.lat!, imovel.lng!, t.lat, t.lng);
      const similaridadeArea =
        1 - Math.abs(t.area_m2 - imovel.area_m2) / Math.max(t.area_m2, imovel.area_m2);
      const proximidade = 1 - distancia / raioMetros;
      const similaridade_score = Math.round((similaridadeArea * 0.4 + proximidade * 0.6) * 100);

      return {
        transacao: t,
        distancia_metros: Math.round(distancia),
        similaridade_score,
        preco_m2: t.preco_m2 || t.valor / t.area_m2,
      };
    })
    .sort((a, b) => b.similaridade_score - a.similaridade_score)
    .slice(0, maxComparaveis);
}

// ─── MOTOR AVM PRINCIPAL ──────────────────────────────────────────────────────

export function calcularAVM(
  imovel: Imovel,
  comparaveis: Comparavel[],
  liquidez_media_dias?: number
): ResultadoAVM {
  const precos = comparaveis.map((c) => c.preco_m2);
  const preco_m2_base = mediana(precos);

  const fatores: FatoresAjuste = {
    fator_andar:       calcularFatorAndar(imovel.andar),
    fator_vista:       imovel.tem_vista ? 1.10 : 1.00,
    fator_padrao:      FATOR_PADRAO[imovel.padrao],
    fator_localizacao: 1.00, // será sobrescrito por dados regionais futuros
    fator_liquidez:    calcularFatorLiquidez(liquidez_media_dias),
    fator_reformado:   imovel.reformado ? 1.08 : 1.00,
  };

  const multiplicador =
    fatores.fator_andar *
    fatores.fator_vista *
    fatores.fator_padrao *
    fatores.fator_localizacao *
    fatores.fator_liquidez *
    fatores.fator_reformado;

  const preco_m2_ajustado = Math.round(preco_m2_base * multiplicador);
  const preco_total_estimado = Math.round(preco_m2_ajustado * imovel.area_m2);
  const variacao = preco_total_estimado * 0.10;

  const hoje = new Date();
  const recenciaMedia =
    comparaveis.length > 0
      ? comparaveis.reduce((acc, c) => {
          const dias = (hoje.getTime() - new Date(c.transacao.data).getTime()) / 86400000;
          return acc + dias;
        }, 0) / comparaveis.length
      : 365;

  const distanciaMedia =
    comparaveis.length > 0
      ? comparaveis.reduce((acc, c) => acc + c.distancia_metros, 0) / comparaveis.length
      : 1500;

  const score_confianca = calcularScoreConfianca(
    comparaveis.length,
    recenciaMedia,
    distanciaMedia
  );

  return {
    imovel_id: imovel.id,
    preco_m2_base,
    preco_m2_ajustado,
    preco_total_estimado,
    faixa_minima: Math.round(preco_total_estimado - variacao),
    faixa_maxima: Math.round(preco_total_estimado + variacao),
    fatores,
    score_confianca,
    total_comparaveis: comparaveis.length,
    data_calculo: hoje.toISOString(),
    insight: gerarInsight(preco_m2_ajustado, preco_m2_base),
  };
}
