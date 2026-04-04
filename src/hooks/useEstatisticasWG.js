/**
 * Hook para buscar estatísticas em tempo real do Sistema WG
 * Conecta ao Supabase para obter dados de contratos
 */

import { useState, useEffect } from "react";

// Data de fundação do primeiro CNPJ (para cálculo de horas)
// Desde 28/10/2011
const DATA_FUNDACAO = new Date("2011-10-28");

export function useEstatisticasWG(options = {}) {
  const { enabled = true } = options;
  // Valores fallback renderizam imediatamente (não bloqueia LCP)
  const [estatisticas, setEstatisticas] = useState(() => ({
    clientesAtendidos: 270,
    metrosRevestimentos: 3000,
    projetosAndamento: 7,
    horasProjetando: Math.floor((Date.now() - new Date("2011-10-28").getTime()) / 3600000),
    anosExperiencia: Math.floor((Date.now() - new Date("2011-10-28").getTime()) / (365.25 * 86400000)),
    loading: false,
    error: null,
  }));

  // Calcular horas desde a fundação
  const calcularHorasDesdeDataFundacao = () => {
    const agora = new Date();
    const diffMs = agora.getTime() - DATA_FUNDACAO.getTime();
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    return diffHoras;
  };

  // Calcular anos de experiência
  const calcularAnosExperiencia = () => {
    const agora = new Date();
    const diffMs = agora.getTime() - DATA_FUNDACAO.getTime();
    const diffAnos = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365));
    return diffAnos;
  };

  useEffect(() => {
    if (!enabled) return () => {};

    let isCancelled = false;

    const buscarEstatisticas = async () => {
      try {
        const { supabase } = await import("@/lib/customSupabaseClient");

        // Buscar contratos ativos (projetos em andamento)
        // eslint-disable-next-line no-unused-vars
        const { data: contratosAtivos, error: errorAtivos } = await supabase
          .from("contratos")
          .select("id, valor_total")
          .eq("status", "ativo");

        // Buscar todos os contratos (ativos + concluídos = clientes atendidos)
        // eslint-disable-next-line no-unused-vars
        const { data: todosContratos, error: errorTodos } = await supabase
          .from("contratos")
          .select("id, valor_total, status")
          .in("status", ["ativo", "concluido"]);

        // Buscar itens de contrato para calcular metros de revestimentos
        // Assumindo que existe um campo para metros ou quantidade
        // eslint-disable-next-line no-unused-vars
        const { data: itensContratos, error: errorItens } = await supabase
          .from("contratos_itens")
          .select("quantidade, unidade, contrato_id")
          .or("unidade.ilike.%m2%,unidade.ilike.%m²%,unidade.eq.m2");

        // Calcular métricas
        const projetosAndamento = contratosAtivos?.length || 6;
        const clientesAtendidos = todosContratos?.length || 270;

        // Somar metros de revestimentos
        let metrosRevestimentos = 3000; // Base
        if (itensContratos && itensContratos.length > 0) {
          const somaMetros = itensContratos.reduce((acc, item) => {
            return acc + (item.quantidade || 0);
          }, 0);
          if (somaMetros > 0) {
            metrosRevestimentos = Math.round(somaMetros);
          }
        }

        // Calcular horas e anos
        const horasProjetando = calcularHorasDesdeDataFundacao();
        const anosExperiencia = calcularAnosExperiencia();

        if (isCancelled) return;

        setEstatisticas({
          clientesAtendidos: Math.max(clientesAtendidos, 270), // Mínimo 270 (histórico)
          metrosRevestimentos: Math.max(metrosRevestimentos, 3000), // Mínimo 3000 (histórico)
          projetosAndamento: projetosAndamento + 1, // +1 conforme solicitado
          horasProjetando,
          anosExperiencia,
          loading: false,
          error: null,
        });
      } catch (error) {
        if (isCancelled) return;

        console.error("Erro ao buscar estatísticas:", error);
        // Em caso de erro, usar valores base
        setEstatisticas((prev) => ({
          ...prev,
          horasProjetando: calcularHorasDesdeDataFundacao(),
          anosExperiencia: calcularAnosExperiencia(),
          loading: false,
          error: error.message,
        }));
      }
    };

    // Defer Supabase queries until after LCP (5s or user interaction)
    let scheduled = false;
    const schedule = () => {
      if (scheduled) return;
      scheduled = true;
      buscarEstatisticas();
    };

    const timeoutId = setTimeout(schedule, 5000);
    const events = ['scroll', 'click', 'touchstart'];
    const onInteraction = () => {
      clearTimeout(timeoutId);
      // Small delay after interaction to not compete with UI response
      setTimeout(schedule, 800);
      events.forEach(e => window.removeEventListener(e, onInteraction));
    };
    events.forEach(e => window.addEventListener(e, onInteraction, { once: true, passive: true }));

    // Atualizar horas a cada minuto
    const intervalHoras = setInterval(() => {
      setEstatisticas((prev) => ({
        ...prev,
        horasProjetando: calcularHorasDesdeDataFundacao(),
      }));
    }, 60000);

    return () => {
      isCancelled = true;
      clearTimeout(timeoutId);
      clearInterval(intervalHoras);
      events.forEach(e => window.removeEventListener(e, onInteraction));
    };
  }, [enabled]);

  return estatisticas;
}

// Função utilitária para formatar números grandes
export function formatarNumeroGrande(numero) {
  if (numero >= 1000000) {
    return (numero / 1000000).toFixed(1).replace(".", ",") + "M";
  }
  if (numero >= 1000) {
    return (numero / 1000).toFixed(0) + "mil";
  }
  return numero.toLocaleString("pt-BR");
}

// Função para formatar horas em formato legível
export function formatarHoras(horas) {
  if (horas >= 1000) {
    return Math.floor(horas / 1000) + "mil";
  }
  return horas.toLocaleString("pt-BR");
}

export default useEstatisticasWG;
