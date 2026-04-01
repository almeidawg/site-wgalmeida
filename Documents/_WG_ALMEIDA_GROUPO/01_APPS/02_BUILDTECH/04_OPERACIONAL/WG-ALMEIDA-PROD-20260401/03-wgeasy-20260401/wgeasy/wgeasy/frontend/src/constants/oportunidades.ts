// src/constants/oportunidades.ts
export const ESTAGIOS = [
  "Lead",
  "QualificaçÍo",
  "Proposta",
  "NegociaçÍo",
  "Fechamento",
  "Perdida",
] as const;

export type Estagio = (typeof ESTAGIOS)[number];

export const NUCLEOS = [
  "Arquitetura",
  "Engenharia",
  "Marcenaria",
] as const;

export type Nucleo = (typeof NUCLEOS)[number];

// 🎨 Cores Oficiais WG - Sistema de Identidade Visual
// Baseado nas cores da marca Grupo WG Almeida
export const CORES_NUCLEOS = {
  Arquitetura: {
    primary: "#5E9B94",      // Verde Mineral WG (cor principal)
    secondary: "#E5F3F1",    // Verde claro (fundo suave)
    text: "#2D4D47",         // Verde escuro (texto)
    border: "#7FB3AB",       // Verde médio (borda)
    hover: "#4A7D77",        // Verde hover (mais escuro)
  },
  Engenharia: {
    primary: "#2B4580",      // Azul Técnico WG (cor principal)
    secondary: "#E8ECF5",    // Azul claro (fundo suave)
    text: "#1A2A4D",         // Azul escuro (texto)
    border: "#5571A8",       // Azul médio (borda)
    hover: "#1F3566",        // Azul hover (mais escuro)
  },
  Marcenaria: {
    primary: "#8B5E3C",      // Marrom Carvalho WG (cor principal)
    secondary: "#F5EDE5",    // Marrom claro (fundo suave)
    text: "#4D3422",         // Marrom escuro (texto)
    border: "#A87959",       // Marrom médio (borda)
    hover: "#6D4A2E",        // Marrom hover (mais escuro)
  },
} as const;

// FunçÍo para obter cores de um núcleo
export function getCoresNucleo(nucleo: Nucleo) {
  return CORES_NUCLEOS[nucleo];
}

// ============================================================
// STATUS DE CONTRATOS
// ============================================================

/**
 * Status considerados "ativos" para filtros de contratos
 * Usar esta constante em TODOS os filtros que buscam contratos ativos
 */
export const STATUS_CONTRATOS_ATIVOS = [
  "ativo",
  "aguardando_assinatura",
  "assinado",
  "aguardando",
  "em_execucao",
  "em_andamento",
] as const;

export type StatusContratoAtivo = (typeof STATUS_CONTRATOS_ATIVOS)[number];

/**
 * Todos os status possíveis de um contrato
 */
export const STATUS_CONTRATOS = [
  "rascunho",
  "aguardando_assinatura",
  "assinado",
  "aguardando",
  "ativo",
  "em_execucao",
  "em_andamento",
  "concluido",
  "cancelado",
] as const;

export type StatusContrato = (typeof STATUS_CONTRATOS)[number];

/**
 * Verifica se um status é considerado "ativo"
 */
export function isStatusContratoAtivo(status: string | null | undefined): boolean {
  return STATUS_CONTRATOS_ATIVOS.includes(status as StatusContratoAtivo);
}

