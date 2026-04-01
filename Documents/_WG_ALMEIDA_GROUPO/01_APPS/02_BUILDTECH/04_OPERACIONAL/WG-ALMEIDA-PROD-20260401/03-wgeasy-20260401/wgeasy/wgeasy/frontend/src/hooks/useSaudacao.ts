/**
 * Hook para retornar saudaçÍo baseada no horário atual
 * Bom dia: 6h-12h
 * Boa tarde: 12h-18h
 * Boa noite: 18h-6h
 */

import { useMemo } from "react";

export type Saudacao = "Bom dia" | "Boa tarde" | "Boa noite";

export function useSaudacao(): Saudacao {
  return useMemo(() => {
    const hora = new Date().getHours();

    if (hora >= 6 && hora < 12) {
      return "Bom dia";
    } else if (hora >= 12 && hora < 18) {
      return "Boa tarde";
    } else {
      return "Boa noite";
    }
  }, []);
}

/**
 * FunçÍo utilitária para obter saudaçÍo (sem hook)
 */
export function getSaudacao(): Saudacao {
  const hora = new Date().getHours();

  if (hora >= 6 && hora < 12) {
    return "Bom dia";
  } else if (hora >= 12 && hora < 18) {
    return "Boa tarde";
  } else {
    return "Boa noite";
  }
}

/**
 * Formata a data atual no padrÍo brasileiro
 */
export function formatarDataAtual(): string {
  return new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/**
 * Formata a data de início na WG
 */
export function formatarDataInicioWG(dataInicio?: string | null): string {
  if (!dataInicio) return "";

  const data = new Date(dataInicio);
  return data.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
}

