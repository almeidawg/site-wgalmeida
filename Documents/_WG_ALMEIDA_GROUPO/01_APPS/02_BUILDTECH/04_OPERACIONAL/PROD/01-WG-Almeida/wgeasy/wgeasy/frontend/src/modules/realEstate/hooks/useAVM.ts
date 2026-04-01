import { useState } from "react";
import { realEstateService } from "../services/realEstateService";
import type { Imovel, ResultadoAVM, Comparavel } from "../models/types";

export function useAVM() {
  const [resultado, setResultado] = useState<ResultadoAVM | null>(null);
  const [comparaveis, setComparaveis] = useState<Comparavel[]>([]);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function avaliar(imovel: Imovel) {
    setLoading(true);
    setErro(null);
    try {
      const res = await realEstateService.avaliarImovel(imovel);
      setResultado(res.resultado);
      setComparaveis(res.comparaveis);
    } catch (e: any) {
      setErro(e.message || "Erro ao calcular avaliação.");
    } finally {
      setLoading(false);
    }
  }

  function limpar() {
    setResultado(null);
    setComparaveis([]);
    setErro(null);
  }

  return { resultado, comparaveis, loading, erro, avaliar, limpar };
}
