// ─── EasyRealState — Modelos de dados ─────────────────────────────────────────

export type PadraoImovel = "popular" | "medio" | "alto" | "luxo";
export type TipoImovel = "apartamento" | "casa" | "comercial" | "terreno" | "galpao";
export type TipoTransacao = "venda" | "locacao";

export interface Transacao {
  id: string;
  endereco: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  lat: number;
  lng: number;
  area_m2: number;
  valor: number;
  preco_m2: number;
  data: string;
  tipo: TipoImovel;
  tipo_transacao: TipoTransacao;
  andar?: number;
  quartos?: number;
  vagas?: number;
  padrao?: PadraoImovel;
  fonte: "itbi" | "mercado" | "cartorio" | "manual";
  confianca: number; // 0-100
}

export interface Imovel {
  id: string;
  endereco: string;
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  lat?: number;
  lng?: number;
  area_m2: number;
  area_util?: number;
  tipo: TipoImovel;
  padrao: PadraoImovel;
  ano_construcao?: number;
  quartos?: number;
  banheiros?: number;
  vagas?: number;
  andar?: number;
  total_andares?: number;
  tem_vista: boolean;
  reformado?: boolean;
  tenant_id?: string;
}

export interface Regiao {
  cep: string;
  bairro: string;
  cidade: string;
  estado: string;
  lat?: number;
  lng?: number;
  renda_media?: number;
  ipc?: number; // índice de preço por m² da região
  liquidez_media_dias?: number;
  tendencia: "alta" | "estavel" | "queda";
  ultima_atualizacao: string;
}

export interface FatoresAjuste {
  fator_andar: number;        // 1.0 base, +0.05 por andar acima do 5o
  fator_vista: number;        // 1.0 sem vista, 1.10 com vista
  fator_padrao: number;       // popular=0.75, medio=1.0, alto=1.20, luxo=1.50
  fator_localizacao: number;  // variável por bairro/cidade
  fator_liquidez: number;     // 1.0 media, < 1.0 baixa liquidez
  fator_reformado: number;    // 1.0 sem reforma, 1.08 reformado
}

export interface ResultadoAVM {
  imovel_id: string;
  preco_m2_base: number;        // mediana das transações similares
  preco_m2_ajustado: number;    // após fatores
  preco_total_estimado: number;
  faixa_minima: number;
  faixa_maxima: number;
  fatores: FatoresAjuste;
  score_confianca: number;      // 0-100
  total_comparaveis: number;
  data_calculo: string;
  insight: InsightMercado;
}

export interface InsightMercado {
  label: "abaixo_mercado" | "mercado" | "acima_mercado" | "oportunidade" | "supervalorizado";
  descricao: string;
  percentual_desvio: number; // % acima ou abaixo da mediana
}

export interface Comparavel {
  transacao: Transacao;
  distancia_metros: number;
  similaridade_score: number;
  preco_m2: number;
}

export interface RadarPreco {
  regiao: Regiao;
  preco_m2_mediana: number;
  preco_m2_media: number;
  preco_m2_min: number;
  preco_m2_max: number;
  total_transacoes: number;
  periodo_analise_meses: number;
  liquidez_media_dias: number;
  tendencia: "alta" | "estavel" | "queda";
  variacao_12m: number; // %
}

// ─── ICCRI Integration — Custo de Construção/Reforma ─────────────────────────

export interface CustoConstrutivo {
  padrao: PadraoImovel;
  custo_m2_material: number;
  custo_m2_mao_obra: number;
  custo_m2_total: number;
  fator_regional: number;
  indice_iccri: number;
  estado: string;
  capital_interior: "capital" | "interior";
  referencia: "SINAPI" | "CUB" | "ICCRI";
  data_referencia: string;
}

// ─── Ranges de mercado 2026 (base ICCRI) ──────────────────────────────────────

export const CUSTO_M2_2026: Record<PadraoImovel, { min: number; max: number; referencia: number }> = {
  popular:  { min: 2000, max: 2600, referencia: 2300 },
  medio:    { min: 2700, max: 3800, referencia: 3200 },
  alto:     { min: 4000, max: 5500, referencia: 4700 },
  luxo:     { min: 5500, max: 12000, referencia: 7500 },
};

export const REFORMA_M2_2026: Record<PadraoImovel, { min: number; max: number; referencia: number }> = {
  popular:  { min: 600,  max: 1200, referencia: 900 },
  medio:    { min: 1200, max: 2800, referencia: 2000 },
  alto:     { min: 2800, max: 5000, referencia: 3800 },
  luxo:     { min: 5000, max: 15000, referencia: 8000 },
};
