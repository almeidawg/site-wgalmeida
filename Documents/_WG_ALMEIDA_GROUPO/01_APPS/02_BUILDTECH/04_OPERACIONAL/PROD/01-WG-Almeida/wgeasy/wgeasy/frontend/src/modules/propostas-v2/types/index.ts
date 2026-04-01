// ============================================================
// Propostas V2 - Types
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import type { NucleoItem } from "@/types/propostas";
import type { ItemPriceList } from "@/types/pricelist";

// ============================================================
// TIPOS PRINCIPAIS
// ============================================================

export interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  telefone?: string;
  status?: "novo" | "em_obra" | "recorrente";
  avatar_url?: string;
  endereco?: string;
}

// Tipos de vÍos
export interface VaoBase {
  largura: number;
  altura: number;
  quantidade: number;
}

export interface Ambiente {
  id: string;
  nome: string;
  tipo?: string; // quarto, sala, cozinha, etc.

  // Dimensões básicas
  largura: number;
  comprimento: number;
  pe_direito: number;

  // Áreas calculadas
  area_piso: number;
  area_teto: number;
  perimetro: number;
  area_parede: number; // Alias para área bruta
  area_paredes_bruta: number;
  area_paredes_liquida: number;

  // VÍos
  portas: VaoBase[];
  janelas: VaoBase[];
  vaos: VaoBase[];
  area_vaos_total: number;

  // Revestimentos calculados
  rev_piso_largura?: number;
  rev_piso_altura?: number;
  rev_piso_area?: number;
  rev_parede_perimetro?: number;
  rev_parede_altura?: number;
  rev_parede_area?: number;

  descricao?: string;
}

export interface AmbienteInput {
  nome: string;
  largura?: number;
  comprimento?: number;
  pe_direito?: number;
  area?: number;
}

export type TipoItem = "material" | "mao_obra" | "servico" | "produto" | "ambos";
export type UnidadeItem = "m2" | "ml" | "un" | "diaria" | "hora" | "empreita" | "kg" | "l" | "pct";

export interface ItemPricelist extends ItemPriceList {
  fabricante?: string | null;
  modelo?: string | null;
  fornecedor_id?: string;
  ativo?: boolean;
  categoria_id?: string | null;
  subcategoria_id?: string | null;
  subcategoria?: string;
  nucleo_id?: string | null;
}

export interface ItemProposta {
  id: string;
  item: ItemPricelist;
  ambiente_id?: string;
  ambientes_ids?: string[]; // Múltiplos ambientes
  quantidade: number;
  valor_unitario: number;
  descricao_customizada?: string;
  nucleo?: NucleoItem;
  prioridade?: "critica" | "alta" | "media" | "baixa";
  status_item?: "a_definir" | "aprovado" | "excluido" | "em_andamento" | "concluido";
}

export type MetodoPagamento = "pix" | "boleto" | "cartao_credito" | "cartao_debito" | "transferencia";

export interface CondicoesComerciais {
  forma_pagamento: "a_vista" | "parcelado" | "etapas";
  percentual_entrada: number;
  numero_parcelas: number;
  validade_dias: number;
  prazo_execucao_dias: number;
  pagamento_cartao: boolean;
  observacoes?: string;
  tipo_desconto?: "percentual" | "valor";
  desconto_percentual?: number;
  desconto_valor?: number;
  tipo_entrada?: "percentual" | "valor";
  valor_entrada?: number;
  metodo_entrada?: MetodoPagamento;
  metodo_saldo?: MetodoPagamento;
  parcelas_cartao_saldo?: number; // Parcelas específicas do cartÍo no saldo (1-10)
  taxa_adm_percentual?: number; // Taxa de administraçÍo (%)
}

// ============================================================
// TIPOS PARA CÁLCULOS
// ============================================================

export interface TotaisPorNucleo {
  arquitetura: number;
  engenhariaMaoObra: number;
  engenhariaMateriais: number;
  marcenaria: number;
  produtos: number;
  totalGeral: number;
}

export interface TotaisGerais {
  materiais: number;
  maoObra: number;
  total: number;
}

export interface TotaisAmbientes {
  area_piso: number;
  area_parede: number;
  area_paredes_bruta: number;
  area_paredes_liquida: number;
  area_teto: number;
  perimetro: number;
  area_vaos_total: number;
  total_portas: number;
  total_janelas: number;
  total_vaos: number;
}

// ============================================================
// TAXAS DE CARTÍO
// ============================================================

export const TAXAS_CARTAO: Record<number, number> = {
  1: 3.15,   // Crédito à vista
  2: 5.39,
  3: 6.12,
  4: 6.85,
  5: 7.57,
  6: 8.28,
  7: 8.99,
  8: 9.69,
  9: 10.38,
  10: 11.06,
  11: 11.74,
  12: 12.40,
};

export function getTaxaCartao(parcelas: number): number {
  if (parcelas <= 1) return TAXAS_CARTAO[1];
  if (parcelas >= 12) return TAXAS_CARTAO[12];
  return TAXAS_CARTAO[parcelas] || TAXAS_CARTAO[12];
}

// ============================================================
// TIPOS PARA SUGESTÕES DE IA
// ============================================================

export interface SugestaoIA {
  id: string;
  tipo: "acabamento" | "instalacao" | "complementar";
  ambiente?: string;
  descricao: string;
  itemSugerido?: ItemPricelist;
  quantidade?: number;
  prioridade: "alta" | "media" | "baixa";
  origem: "analise_projeto" | "quantitativo" | "historico";
}

export interface AmbienteExtraido {
  nome: string;
  largura?: number;
  comprimento?: number;
  area?: number;
  pe_direito?: number;
  descricao?: string;
  tipo?: string;
}

// ============================================================
// TIPOS PARA FILTROS
// ============================================================

export interface FiltrosPricelist {
  busca?: string;
  categoria?: string;
  tipo?: TipoItem | null;
  nucleo?: NucleoItem | null;
  precoMin?: number;
  precoMax?: number;
}

// ============================================================
// TIPOS PARA GRUPOS
// ============================================================

export interface GrupoNucleo {
  nucleo: NucleoItem | "sem_nucleo";
  label: string;
  cor: string;
  itens: ItemProposta[];
  total: number;
}

export interface GrupoAmbiente {
  ambiente: Ambiente;
  itens: ItemProposta[];
  total: number;
}

// ============================================================
// TIPOS PARA PROPOSTA SALVA
// ============================================================

export interface PropostaSalva {
  id: string;
  cliente_id: string;
  oportunidade_id?: string;
  titulo: string;
  descricao?: string;
  status: "rascunho" | "enviada" | "aprovada" | "recusada" | "vencida";
  forma_pagamento: string;
  percentual_entrada: number;
  numero_parcelas: number;
  validade_dias: number;
  prazo_execucao_dias: number;
  pagamento_cartao: boolean;
  exibir_valores: boolean;
  valor_total: number;
  created_at: string;
  updated_at: string;
}

