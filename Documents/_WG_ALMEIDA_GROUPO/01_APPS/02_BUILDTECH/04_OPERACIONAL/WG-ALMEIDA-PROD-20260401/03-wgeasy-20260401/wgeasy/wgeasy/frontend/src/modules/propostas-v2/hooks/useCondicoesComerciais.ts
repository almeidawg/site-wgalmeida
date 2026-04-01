// ============================================================
// useCondicoesComerciais - Hook para gerenciar condições comerciais
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback, useMemo } from "react";
import type { CondicoesComerciais } from "../types";
import { getTaxaCartao } from "../types";

export interface UseCondicoesComerciaisReturn {
  condicoes: CondicoesComerciais;
  taxaCartaoPerc: number;
  valorTaxaCartao: number;
  totalComCartao: number;
  setCondicoes: (condicoes: CondicoesComerciais) => void;
  atualizarCampo: <K extends keyof CondicoesComerciais>(campo: K, valor: CondicoesComerciais[K]) => void;
  calcularEntrada: (valorTotal: number) => number;
  calcularParcela: (valorTotal: number) => number;
  reset: () => void;
}

const CONDICOES_PADRAO: CondicoesComerciais = {
  forma_pagamento: "parcelado",
  percentual_entrada: 30,
  numero_parcelas: 3,
  validade_dias: 30,
  prazo_execucao_dias: 60,
  pagamento_cartao: false,
  observacoes: "",
  tipo_desconto: "percentual",
  desconto_percentual: 0,
  desconto_valor: 0,
  taxa_adm_percentual: 0,
};

export function useCondicoesComerciais(valorTotal: number = 0): UseCondicoesComerciaisReturn {
  const [condicoes, setCondicoes] = useState<CondicoesComerciais>(CONDICOES_PADRAO);

  // Calcular taxa de cartÍo
  const taxaCartaoPerc = useMemo(() => {
    if (!condicoes.pagamento_cartao) return 0;
    return getTaxaCartao(condicoes.numero_parcelas);
  }, [condicoes.pagamento_cartao, condicoes.numero_parcelas]);

  const valorTaxaCartao = useMemo(() => {
    return valorTotal * (taxaCartaoPerc / 100);
  }, [valorTotal, taxaCartaoPerc]);

  const totalComCartao = useMemo(() => {
    return valorTotal + valorTaxaCartao;
  }, [valorTotal, valorTaxaCartao]);

  const atualizarCampo = useCallback(<K extends keyof CondicoesComerciais>(
    campo: K,
    valor: CondicoesComerciais[K]
  ) => {
    setCondicoes(prev => ({ ...prev, [campo]: valor }));
  }, []);

  const calcularEntrada = useCallback((total: number) => {
    return total * (condicoes.percentual_entrada / 100);
  }, [condicoes.percentual_entrada]);

  const calcularParcela = useCallback((total: number) => {
    const entrada = calcularEntrada(total);
    const restante = total - entrada;
    return condicoes.numero_parcelas > 0 ? restante / condicoes.numero_parcelas : restante;
  }, [condicoes.numero_parcelas, calcularEntrada]);

  const reset = useCallback(() => {
    setCondicoes(CONDICOES_PADRAO);
  }, []);

  return {
    condicoes,
    taxaCartaoPerc,
    valorTaxaCartao,
    totalComCartao,
    setCondicoes,
    atualizarCampo,
    calcularEntrada,
    calcularParcela,
    reset,
  };
}

export default useCondicoesComerciais;

