// ============================================================
// COMPONENTE: Gráfico de Gantt para Cronograma
// VisualizaçÍo em timeline das tarefas do projeto
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useMemo } from "react";

// ============================================================
// TIPOS
// ============================================================

export interface GanttTask {
  id: string;
  titulo: string;
  data_inicio: string;
  data_fim: string;
  status: string;
  percentual_valor?: number;
  ordem?: number;
  dependencias?: string[];
}

interface CronogramaGanttProps {
  tasks: GanttTask[];
  onTaskClick?: (task: GanttTask) => void;
  className?: string;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

function parseDate(dateStr: string): Date {
  const isoSemHora = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(dateStr);
}

function formatarData(date: Date): string {
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function calcularDiferencaDias(inicio: Date, fim: Date): number {
  const diffTime = Math.abs(fim.getTime() - inicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function obterCorStatus(status: string): string {
  const cores: Record<string, string> = {
    pendente: "#9CA3AF",
    em_andamento: "#3B82F6",
    concluida: "#10B981",
    atrasada: "#EF4444",
    pausada: "#F59E0B",
  };
  return cores[status] || cores.pendente;
}

// ============================================================
// COMPONENTE
// ============================================================

const CronogramaGantt: React.FC<CronogramaGanttProps> = ({
  tasks,
  onTaskClick,
  className = "",
}) => {
  // Calcular range de datas do projeto
  const { dataInicio, dataFim, totalDias } = useMemo(() => {
    if (tasks.length === 0) {
      return { dataInicio: new Date(), dataFim: new Date(), totalDias: 0 };
    }

    const datas = tasks.flatMap((t) => [
      parseDate(t.data_inicio),
      parseDate(t.data_fim),
    ]);

    const inicio = new Date(Math.min(...datas.map((d) => d.getTime())));
    const fim = new Date(Math.max(...datas.map((d) => d.getTime())));

    // Adicionar margem de 3 dias antes e depois
    inicio.setDate(inicio.getDate() - 3);
    fim.setDate(fim.getDate() + 3);

    return {
      dataInicio: inicio,
      dataFim: fim,
      totalDias: calcularDiferencaDias(inicio, fim),
    };
  }, [tasks]);

  // Gerar marcadores de mês
  const marcadoresMeses = useMemo(() => {
    const marcadores: Array<{ mes: string; posicao: number }> = [];
    const dataAtual = new Date(dataInicio);
    let mesAnterior = "";

    for (let i = 0; i <= totalDias; i++) {
      const mesAtual = dataAtual.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      if (mesAtual !== mesAnterior) {
        marcadores.push({
          mes: mesAtual,
          posicao: (i / totalDias) * 100,
        });
        mesAnterior = mesAtual;
      }

      dataAtual.setDate(dataAtual.getDate() + 1);
    }

    return marcadores;
  }, [dataInicio, totalDias]);

  // Calcular posiçÍo e largura de cada tarefa
  function calcularPosicaoTask(task: GanttTask) {
    const inicio = parseDate(task.data_inicio);
    const fim = parseDate(task.data_fim);

    const diasDesdeInicio = calcularDiferencaDias(dataInicio, inicio);
    const duracaoTask = calcularDiferencaDias(inicio, fim);

    const left = (diasDesdeInicio / totalDias) * 100;
    const width = (duracaoTask / totalDias) * 100;

    return { left: `${left}%`, width: `${Math.max(width, 0.5)}%` };
  }

  // Linha de hoje
  const posicaoHoje = useMemo(() => {
    const hoje = new Date();
    if (hoje < dataInicio || hoje > dataFim) return null;

    const diasDesdeInicio = calcularDiferencaDias(dataInicio, hoje);
    return (diasDesdeInicio / totalDias) * 100;
  }, [dataInicio, dataFim, totalDias]);

  if (tasks.length === 0) {
    return (
      <div className={`bg-white border border-gray-200 rounded-xl p-8 ${className}`}>
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-3"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-gray-600 font-medium">
            Nenhuma tarefa no cronograma
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-xl ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-normal text-[#2E2E2E]">
          Cronograma Gantt
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {formatarData(dataInicio)} - {formatarData(dataFim)} • {totalDias} dias
        </p>
      </div>

      {/* Gráfico Gantt */}
      <div className="p-6">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Linha do tempo (meses) */}
            <div className="relative h-8 bg-gray-50 border-b border-gray-200 mb-4">
              {marcadoresMeses.map((marcador, i) => (
                <div
                  key={i}
                  className="absolute top-0 h-full flex items-center px-2"
                  style={{ left: `${marcador.posicao}%` }}
                >
                  <span className="text-xs font-normal text-gray-600 uppercase">
                    {marcador.mes}
                  </span>
                </div>
              ))}
            </div>

            {/* Tarefas */}
            <div className="space-y-3">
              {tasks
                .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
                .map((task) => {
                  const posicao = calcularPosicaoTask(task);
                  const cor = obterCorStatus(task.status);

                  return (
                    <div key={task.id} className="relative">
                      {/* Nome da tarefa */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-64 flex-shrink-0">
                          <h4 className="text-sm font-medium text-gray-900 truncate">
                            {task.titulo}
                          </h4>
                          {task.percentual_valor !== undefined && (
                            <span className="text-xs text-gray-500">
                              {task.percentual_valor.toFixed(1)}% do valor
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Barra de progresso */}
                      <div className="relative h-10 bg-gray-100 rounded-lg overflow-hidden">
                        {/* Linha de hoje (se aplicável) */}
                        {posicaoHoje !== null && (
                          <div
                            className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20"
                            style={{ left: `${posicaoHoje}%` }}
                            title="Hoje"
                          />
                        )}

                        {/* Barra da tarefa */}
                        <div
                          className="absolute top-1 bottom-1 rounded cursor-pointer hover:opacity-80 transition-opacity flex items-center px-3 gap-2"
                          style={{
                            left: posicao.left,
                            width: posicao.width,
                            backgroundColor: cor,
                          }}
                          onClick={() => onTaskClick && onTaskClick(task)}
                          title={`${task.titulo}\n${formatarData(
                            parseDate(task.data_inicio)
                          )} - ${formatarData(parseDate(task.data_fim))}`}
                        >
                          <span className="text-xs font-medium text-white truncate">
                            {formatarData(parseDate(task.data_inicio))}
                          </span>
                          {parseFloat(posicao.width) > 8 && (
                            <>
                              <div className="flex-1 border-t border-white/30" />
                              <span className="text-xs font-medium text-white truncate">
                                {formatarData(parseDate(task.data_fim))}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Legenda */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-6 flex-wrap">
                <span className="text-xs font-normal text-gray-600 uppercase tracking-wide">
                  Legenda:
                </span>
                {[
                  { status: "pendente", label: "Pendente" },
                  { status: "em_andamento", label: "Em Andamento" },
                  { status: "concluida", label: "Concluída" },
                  { status: "atrasada", label: "Atrasada" },
                  { status: "pausada", label: "Pausada" },
                ].map(({ status, label }) => (
                  <div key={status} className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: obterCorStatus(status) }}
                    />
                    <span className="text-xs text-gray-700">{label}</span>
                  </div>
                ))}
                <div className="flex items-center gap-2">
                  <div className="w-0.5 h-4 bg-red-500" />
                  <span className="text-xs text-gray-700">Hoje</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CronogramaGantt;

