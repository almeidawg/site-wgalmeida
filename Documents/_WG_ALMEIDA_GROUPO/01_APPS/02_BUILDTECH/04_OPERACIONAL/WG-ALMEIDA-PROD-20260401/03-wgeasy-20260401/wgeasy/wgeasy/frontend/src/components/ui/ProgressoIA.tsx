/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// Componente de Progresso para Análise com IA
// Sistema WG Easy - Grupo WG Almeida
// Mostra evoluçÍo real das etapas de processamento
// ============================================================

import { useEffect, useState, useRef } from "react";
import { Loader2, CheckCircle, Circle, Sparkles, FileImage, Brain, Database, Clock } from "lucide-react";

export interface EtapaProgresso {
  id: string;
  nome: string;
  descricao: string;
  icone: "upload" | "processando" | "ia" | "salvando" | "concluido";
  pesoPercentual: number; // Quanto % essa etapa representa do total
}

export const ETAPAS_ANALISE_IA: EtapaProgresso[] = [
  {
    id: "upload",
    nome: "Preparando arquivo",
    descricao: "Lendo e convertendo imagem...",
    icone: "upload",
    pesoPercentual: 15,
  },
  {
    id: "processando",
    nome: "Processando imagem",
    descricao: "Otimizando para análise...",
    icone: "processando",
    pesoPercentual: 10,
  },
  {
    id: "ia",
    nome: "Analisando com IA",
    descricao: "Identificando ambientes e medidas...",
    icone: "ia",
    pesoPercentual: 55,
  },
  {
    id: "salvando",
    nome: "Salvando resultados",
    descricao: "Armazenando no banco de dados...",
    icone: "salvando",
    pesoPercentual: 15,
  },
  {
    id: "concluido",
    nome: "Concluído",
    descricao: "Análise finalizada com sucesso!",
    icone: "concluido",
    pesoPercentual: 5,
  },
];

interface ProgressoIAProps {
  etapaAtual: string;
  progressoEtapa?: number; // 0-100 dentro da etapa atual
  etapas?: EtapaProgresso[];
  tempoDecorrido?: number; // em segundos
  mostrarTempo?: boolean;
  className?: string;
}

export function ProgressoIA({
  etapaAtual,
  progressoEtapa = 0,
  etapas = ETAPAS_ANALISE_IA,
  tempoDecorrido,
  mostrarTempo = true,
  className = "",
}: ProgressoIAProps) {
  const [progressoAnimado, setProgressoAnimado] = useState(0);
  const [pulseIA, setPulseIA] = useState(false);
  const animationRef = useRef<NodeJS.Timeout | null>(null);

  // Calcular progresso total baseado na etapa atual
  const calcularProgressoTotal = () => {
    let acumulado = 0;
    for (const etapa of etapas) {
      if (etapa.id === etapaAtual) {
        // Adiciona o progresso proporcional dentro da etapa atual
        return acumulado + (etapa.pesoPercentual * progressoEtapa) / 100;
      }
      acumulado += etapa.pesoPercentual;
    }
    return acumulado;
  };

  const progressoTotal = calcularProgressoTotal();

  // Animar o progresso suavemente
  useEffect(() => {
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }

    const diff = progressoTotal - progressoAnimado;
    if (Math.abs(diff) < 0.5) {
      setProgressoAnimado(progressoTotal);
      return;
    }

    animationRef.current = setInterval(() => {
      setProgressoAnimado((prev) => {
        const step = diff > 0 ? Math.min(0.5, diff) : Math.max(-0.5, diff);
        const next = prev + step;
        if ((diff > 0 && next >= progressoTotal) || (diff < 0 && next <= progressoTotal)) {
          if (animationRef.current) clearInterval(animationRef.current);
          return progressoTotal;
        }
        return next;
      });
    }, 30);

    return () => {
      if (animationRef.current) clearInterval(animationRef.current);
    };
  }, [progressoTotal]);

  // Efeito de pulse na etapa de IA
  useEffect(() => {
    if (etapaAtual === "ia") {
      const interval = setInterval(() => {
        setPulseIA((prev) => !prev);
      }, 1000);
      return () => clearInterval(interval);
    }
    setPulseIA(false);
  }, [etapaAtual]);

  // Renderizar ícone da etapa
  const renderIcone = (etapa: EtapaProgresso, isAtual: boolean, isCompleta: boolean) => {
    const baseClass = "w-5 h-5 transition-all duration-300";

    if (isCompleta) {
      return <CheckCircle className={`${baseClass} text-green-500`} />;
    }

    if (isAtual) {
      switch (etapa.icone) {
        case "upload":
          return <FileImage className={`${baseClass} text-purple-500 animate-pulse`} />;
        case "processando":
          return <Loader2 className={`${baseClass} text-blue-500 animate-spin`} />;
        case "ia":
          return (
            <Sparkles
              className={`${baseClass} text-amber-500 ${pulseIA ? "scale-125" : "scale-100"}`}
              style={{ transition: "transform 0.5s ease-in-out" }}
            />
          );
        case "salvando":
          return <Database className={`${baseClass} text-green-500 animate-pulse`} />;
        case "concluido":
          return <CheckCircle className={`${baseClass} text-green-500`} />;
        default:
          return <Loader2 className={`${baseClass} text-gray-500 animate-spin`} />;
      }
    }

    return <Circle className={`${baseClass} text-gray-300`} />;
  };

  // Formatar tempo
  const formatarTempo = (segundos: number) => {
    if (segundos < 60) return `${segundos}s`;
    const min = Math.floor(segundos / 60);
    const seg = segundos % 60;
    return `${min}m ${seg}s`;
  };

  // Encontrar índice da etapa atual
  const indiceAtual = etapas.findIndex((e) => e.id === etapaAtual);
  const etapaAtualObj = etapas[indiceAtual];

  return (
    <div className={`bg-white rounded-xl border border-gray-200 p-5 ${className}`}>
      {/* Header com progresso geral */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Brain className="w-8 h-8 text-purple-500" />
            {etapaAtual === "ia" && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-ping" />
            )}
          </div>
          <div>
            <h3 className="font-normal text-gray-900">Análise em Andamento</h3>
            <p className="text-sm text-gray-500">{etapaAtualObj?.descricao || "Processando..."}</p>
          </div>
        </div>

        {mostrarTempo && tempoDecorrido !== undefined && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>{formatarTempo(tempoDecorrido)}</span>
          </div>
        )}
      </div>

      {/* Barra de progresso principal */}
      <div className="mb-5">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="font-normal text-gray-700">{etapaAtualObj?.nome || "Processando"}</span>
          <span className="font-mono text-purple-600">{Math.round(progressoAnimado)}%</span>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-purple-600 rounded-full transition-all duration-100 relative"
            style={{ width: `${progressoAnimado}%` }}
          >
            {/* Efeito de brilho */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>
      </div>

      {/* Lista de etapas */}
      <div className="space-y-2">
        {etapas.map((etapa, index) => {
          const isCompleta = index < indiceAtual;
          const isAtual = index === indiceAtual;

          return (
            <div
              key={etapa.id}
              className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-300 ${
                isAtual ? "bg-purple-50 border border-purple-200" : isCompleta ? "bg-green-50/50" : "opacity-50"
              }`}
            >
              {renderIcone(etapa, isAtual, isCompleta)}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-normal truncate ${isAtual ? "text-purple-900" : isCompleta ? "text-green-700" : "text-gray-500"}`}>
                  {etapa.nome}
                </p>
              </div>
              {isAtual && progressoEtapa > 0 && (
                <span className="text-xs font-mono text-purple-600">{progressoEtapa}%</span>
              )}
              {isCompleta && (
                <span className="text-xs text-green-600">Concluído</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dica */}
      {etapaAtual === "ia" && (
        <div className="mt-4 p-3 bg-amber-50 rounded-lg border border-amber-200">
          <p className="text-xs text-amber-800">
            <Sparkles className="w-3 h-3 inline mr-1" />
            A IA está analisando a planta. Isso pode levar de 10 a 60 segundos dependendo da complexidade do projeto.
          </p>
        </div>
      )}

      {/* CSS para animaçÍo shimmer */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

// Hook para gerenciar progresso com simulaçÍo durante espera de IA
export function useProgressoIA() {
  const [etapaAtual, setEtapaAtual] = useState<string>("");
  const [progressoEtapa, setProgressoEtapa] = useState(0);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [ativo, setAtivo] = useState(false);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const simulacaoRef = useRef<NodeJS.Timeout | null>(null);

  // Timer para tempo decorrido
  useEffect(() => {
    if (ativo) {
      intervalRef.current = setInterval(() => {
        setTempoDecorrido((prev) => prev + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [ativo]);

  // Simular progresso durante etapa de IA (quando está esperando)
  const simularProgressoIA = () => {
    if (simulacaoRef.current) clearInterval(simulacaoRef.current);

    let progresso = 0;
    simulacaoRef.current = setInterval(() => {
      // Progresso logarítmico - começa rápido e desacelera
      progresso += Math.max(0.5, (100 - progresso) * 0.02);
      if (progresso > 95) progresso = 95; // Nunca chega a 100 sozinho
      setProgressoEtapa(Math.round(progresso));
    }, 200);
  };

  const iniciar = () => {
    setAtivo(true);
    setTempoDecorrido(0);
    setEtapaAtual("upload");
    setProgressoEtapa(0);
  };

  const avancarPara = (etapa: string, simular = false) => {
    if (simulacaoRef.current) {
      clearInterval(simulacaoRef.current);
      simulacaoRef.current = null;
    }
    setEtapaAtual(etapa);
    setProgressoEtapa(0);

    if (simular && etapa === "ia") {
      simularProgressoIA();
    }
  };

  const atualizarProgresso = (progresso: number) => {
    setProgressoEtapa(Math.min(100, Math.max(0, progresso)));
  };

  const finalizar = () => {
    if (simulacaoRef.current) {
      clearInterval(simulacaoRef.current);
      simulacaoRef.current = null;
    }
    setEtapaAtual("concluido");
    setProgressoEtapa(100);
    setTimeout(() => {
      setAtivo(false);
    }, 1000);
  };

  const resetar = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (simulacaoRef.current) clearInterval(simulacaoRef.current);
    setAtivo(false);
    setEtapaAtual("");
    setProgressoEtapa(0);
    setTempoDecorrido(0);
  };

  return {
    etapaAtual,
    progressoEtapa,
    tempoDecorrido,
    ativo,
    iniciar,
    avancarPara,
    atualizarProgresso,
    finalizar,
    resetar,
  };
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


