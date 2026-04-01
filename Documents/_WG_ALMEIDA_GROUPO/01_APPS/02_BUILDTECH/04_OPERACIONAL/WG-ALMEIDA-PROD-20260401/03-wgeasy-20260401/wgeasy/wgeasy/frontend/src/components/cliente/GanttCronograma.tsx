// src/components/cliente/GanttCronograma.tsx
// VisualizaçÍo do cronograma em formato Gantt
// Mostra as etapas do projeto em uma linha do tempo visual

import React, { useMemo, useRef, useState, useCallback } from 'react';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, Clock, AlertCircle, Calendar } from 'lucide-react';

interface EtapaGantt {
  id: string;
  titulo: string;
  nucleo?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  dataInicio?: string;
  dataFim?: string;
  progresso: number;
}

interface GanttCronogramaProps {
  etapas: EtapaGantt[];
  onDurationChange?: (etapaId: string, novaDataInicio: string, novaDataFim: string) => void;
}

const NUCLEO_COLORS: Record<string, string> = {
  arquitetura: '#3B82F6', // blue
  engenharia: '#F97316', // orange
  marcenaria: '#F59E0B', // amber
  interiores: '#EC4899', // pink
  execucao: '#22C55E', // green
  default: '#6B7280', // gray
};

export default function GanttCronograma({ etapas, onDurationChange }: GanttCronogramaProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<{
    etapaId: string;
    edge: 'start' | 'end';
  } | null>(null);

  // Calcular intervalo de datas do projeto
  const { minDate, maxDate, totalDays, months, weeks } = useMemo(() => {
    const datas: Date[] = [];

    etapas.forEach((etapa) => {
      if (etapa.dataInicio) datas.push(new Date(etapa.dataInicio));
      if (etapa.dataFim) datas.push(new Date(etapa.dataFim));
    });

    // Se não houver datas, usar período de 3 meses a partir de hoje
    if (datas.length === 0) {
      const hoje = new Date();
      const tresMesesDepois = addDays(hoje, 90);
      datas.push(hoje, tresMesesDepois);
    }

    const min = startOfMonth(new Date(Math.min(...datas.map(d => d.getTime()))));
    const max = endOfMonth(new Date(Math.max(...datas.map(d => d.getTime()))));
    const total = differenceInDays(max, min) + 1;
    const meses = eachMonthOfInterval({ start: min, end: max });

    // Gerar semanas para o header
    const semanas = eachWeekOfInterval({ start: min, end: max }, { weekStartsOn: 1 });

    return { minDate: min, maxDate: max, totalDays: total, months: meses, weeks: semanas };
  }, [etapas]);

  // Drag handler para redimensionar barras (início ou fim)
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    etapaId: string,
    edge: 'start' | 'end',
    dataInicio: string,
    dataFim: string,
  ) => {
    if (!onDurationChange) return;
    e.preventDefault();
    e.stopPropagation();
    setDragging({ etapaId, edge });
    const startX = e.clientX;

    const handleMouseMove = (ev: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaPx = ev.clientX - startX;
      const deltaDias = Math.round((deltaPx / rect.width) * totalDays);
      if (deltaDias === 0) return;

      if (edge === 'end') {
        const novaFim = addDays(new Date(dataFim), deltaDias);
        if (novaFim <= new Date(dataInicio)) return;
        onDurationChange(etapaId, dataInicio, format(novaFim, 'yyyy-MM-dd'));
      } else {
        const novoInicio = addDays(new Date(dataInicio), deltaDias);
        if (novoInicio >= new Date(dataFim)) return;
        onDurationChange(etapaId, format(novoInicio, 'yyyy-MM-dd'), dataFim);
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onDurationChange, totalDays]);

  // Calcular posiçÍo e largura da barra no Gantt
  function calcularBarra(dataInicio?: string, dataFim?: string) {
    if (!dataInicio) {
      return { left: 0, width: 0 };
    }

    const inicio = new Date(dataInicio);
    const fim = dataFim ? new Date(dataFim) : addDays(inicio, 7); // Default 7 dias se não tiver fim

    const diasAteInicio = differenceInDays(inicio, minDate);
    const duracaoDias = differenceInDays(fim, inicio) + 1;

    const left = (diasAteInicio / totalDays) * 100;
    const width = (duracaoDias / totalDays) * 100;

    return { left: Math.max(0, left), width: Math.min(width, 100 - left) };
  }

  // Linha indicadora de "hoje"
  const hojeLeft = useMemo(() => {
    const hoje = new Date();
    if (hoje < minDate || hoje > maxDate) return null;
    return (differenceInDays(hoje, minDate) / totalDays) * 100;
  }, [minDate, maxDate, totalDays]);

  // Calcular posiçÍo da semana atual
  const semanaAtual = useMemo(() => {
    const hoje = new Date();
    const inicioSemana = startOfWeek(hoje, { weekStartsOn: 0 }); // Domingo
    const fimSemana = endOfWeek(hoje, { weekStartsOn: 0 }); // Sábado

    // Verificar se a semana está dentro do intervalo do Gantt
    if (fimSemana < minDate || inicioSemana > maxDate) return null;

    const inicioAjustado = inicioSemana < minDate ? minDate : inicioSemana;
    const fimAjustado = fimSemana > maxDate ? maxDate : fimSemana;

    const left = (differenceInDays(inicioAjustado, minDate) / totalDays) * 100;
    const width = ((differenceInDays(fimAjustado, inicioAjustado) + 1) / totalDays) * 100;

    return { left, width, inicioSemana, fimSemana };
  }, [minDate, maxDate, totalDays]);

  function getStatusIcon(status: string) {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'em_andamento':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'atrasado':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  }

  function getBarColor(nucleo?: string, status?: string) {
    if (status === 'concluido') return '#22C55E';
    if (status === 'atrasado') return '#EF4444';
    return NUCLEO_COLORS[nucleo || 'default'] || NUCLEO_COLORS.default;
  }

  if (etapas.length === 0) {
    // Mostrar Gantt em modo "aguardando dados" com estrutura visual
    const hoje = new Date();
    const mesesPlaceholder = eachMonthOfInterval({
      start: hoje,
      end: addDays(hoje, 90)
    });

    // Calcular posiçÍo da semana atual no placeholder
    const inicioSemanaPlaceholder = startOfWeek(hoje, { weekStartsOn: 0 });
    const fimSemanaPlaceholder = endOfWeek(hoje, { weekStartsOn: 0 });
    const totalDiasPlaceholder = 90;
    const leftSemanaPlaceholder = Math.max(0, (differenceInDays(inicioSemanaPlaceholder, hoje) / totalDiasPlaceholder) * 100);
    const widthSemanaPlaceholder = ((differenceInDays(fimSemanaPlaceholder, inicioSemanaPlaceholder) + 1) / totalDiasPlaceholder) * 100;

    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Indicador da semana atual */}
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs text-blue-700 font-medium">
            Semana atual: {format(inicioSemanaPlaceholder, "dd/MM", { locale: ptBR })} a {format(fimSemanaPlaceholder, "dd/MM/yyyy", { locale: ptBR })}
          </span>
        </div>

        {/* Header com meses */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200 font-normal text-gray-700">
            Etapas do Projeto
          </div>
          <div className="flex-1 relative h-12">
            <div className="absolute inset-0 flex">
              {mesesPlaceholder.map((mes) => (
                <div
                  key={mes.toISOString()}
                  className="flex-1 border-r border-gray-200 flex items-center justify-center text-sm font-medium text-gray-400"
                >
                  {format(mes, 'MMM yyyy', { locale: ptBR })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Linhas placeholder */}
        <div className="divide-y divide-gray-100">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex">
              <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-gray-200 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-1/2 mt-1 animate-pulse" />
                  </div>
                </div>
              </div>
              <div className="flex-1 relative h-16 py-2">
                {/* Destaque da semana atual */}
                <div
                  className="absolute top-0 bottom-0 bg-blue-100/50 border-l border-r border-blue-300/50 z-0"
                  style={{
                    left: `${leftSemanaPlaceholder}%`,
                    width: `${widthSemanaPlaceholder}%`,
                  }}
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 h-6 rounded bg-gray-100 animate-pulse"
                  style={{
                    left: `${10 + i * 5}%`,
                    width: `${30 - i * 3}%`,
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Mensagem de aguardando */}
        <div className="p-4 bg-amber-50 border-t border-amber-100 text-center">
          <p className="text-sm text-amber-700">
            <Clock className="w-4 h-4 inline-block mr-1" />
            Aguardando cadastro das etapas do cronograma
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header com meses + semanas */}
      <div className="border-b border-gray-200 bg-gray-50">
        {/* Linha 1: Meses */}
        <div className="flex border-b border-gray-100">
          <div className="w-64 flex-shrink-0 px-3 py-1.5 border-r border-gray-200 text-[11px] text-gray-500">
            Etapas
          </div>
          <div className="flex-1 relative h-7">
            <div className="absolute inset-0 flex">
              {months.map((mes, index) => {
                const mesInicio = mes;
                const mesFim = index < months.length - 1 ? months[index + 1] : maxDate;
                const diasMes = differenceInDays(mesFim, mesInicio);
                const widthPercent = (diasMes / totalDays) * 100;
                return (
                  <div
                    key={mes.toISOString()}
                    className="border-r border-gray-200 flex items-center justify-center text-[10px] text-gray-600"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {format(mes, 'MMM yyyy', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        {/* Linha 2: Semanas (dia início) */}
        <div className="flex">
          <div className="w-64 flex-shrink-0 border-r border-gray-200" />
          <div className="flex-1 relative h-5">
            <div className="absolute inset-0 flex">
              {weeks.map((semana, index) => {
                const semanaFim = index < weeks.length - 1 ? weeks[index + 1] : maxDate;
                const diasSemana = differenceInDays(semanaFim, semana);
                const widthPercent = (diasSemana / totalDays) * 100;
                if (widthPercent <= 0) return null;
                return (
                  <div
                    key={semana.toISOString()}
                    className="border-r border-gray-100 flex items-center justify-center text-[8px] text-gray-400"
                    style={{ width: `${widthPercent}%` }}
                  >
                    {format(semana, 'dd', { locale: ptBR })}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Corpo do Gantt */}
      <div className="divide-y divide-gray-100">
        {etapas.map((etapa) => {
          const { left, width } = calcularBarra(etapa.dataInicio, etapa.dataFim);
          const barColor = getBarColor(etapa.nucleo, etapa.status);

          return (
            <div key={etapa.id} className="flex hover:bg-gray-50 transition-colors">
              {/* Título da etapa */}
              <div className="w-64 flex-shrink-0 p-3 border-r border-gray-200">
                <div className="flex items-center gap-2">
                  {getStatusIcon(etapa.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {etapa.titulo.replace(/@\w+/g, '').replace(/\s{2,}/g, ' ').trim()}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {etapa.nucleo || 'Geral'} • {etapa.progresso}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Barra do Gantt */}
              <div ref={containerRef} className="flex-1 relative h-16 py-2">
                {/* Linhas de grade dos meses */}
                <div className="absolute inset-0 flex pointer-events-none">
                  {months.map((mes, index) => {
                    const mesInicio = mes;
                    const mesFim = index < months.length - 1 ? months[index + 1] : maxDate;
                    const diasMes = differenceInDays(mesFim, mesInicio);
                    const widthPercent = (diasMes / totalDays) * 100;

                    return (
                      <div
                        key={mes.toISOString()}
                        className="border-r border-gray-100 h-full"
                        style={{ width: `${widthPercent}%` }}
                      />
                    );
                  })}
                </div>

                {/* Destaque da semana atual */}
                {semanaAtual && (
                  <div
                    className="absolute top-0 bottom-0 bg-blue-100/50 border-l border-r border-blue-300/50 z-0"
                    style={{
                      left: `${semanaAtual.left}%`,
                      width: `${semanaAtual.width}%`,
                    }}
                  />
                )}

                {/* Indicador de hoje */}
                {hojeLeft !== null && (
                  <div
                    className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-10"
                    style={{ left: `${hojeLeft}%` }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 bg-red-500 text-white text-xs px-1 rounded">
                      Hoje
                    </div>
                  </div>
                )}

                {/* Barra de progresso com alças de drag */}
                {width > 0 && (
                  <div
                    className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg shadow-sm flex items-center group/bar ${
                      dragging?.etapaId === etapa.id ? '' : 'transition-all duration-300'
                    }`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      minWidth: '40px',
                      backgroundColor: `${barColor}30`,
                      border: `2px solid ${barColor}`,
                    }}
                  >
                    {/* Alça esquerda (início) */}
                    {onDurationChange && etapa.dataInicio && etapa.dataFim && (
                      <div
                        className="absolute left-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-black/10 rounded-l-md"
                        onMouseDown={(e) => handleMouseDown(e, etapa.id, 'start', etapa.dataInicio!, etapa.dataFim!)}
                      />
                    )}

                    {/* Progresso preenchido */}
                    <div
                      className="h-full transition-all duration-500 rounded-l-md"
                      style={{
                        width: `${etapa.progresso}%`,
                        backgroundColor: barColor,
                      }}
                    />

                    {/* Texto dentro da barra */}
                    <span
                      className="absolute inset-0 flex items-center justify-center text-xs font-normal pointer-events-none"
                      style={{ color: etapa.progresso > 50 ? 'white' : barColor }}
                    >
                      {etapa.progresso}%
                    </span>

                    {/* Alça direita (fim) */}
                    {onDurationChange && etapa.dataInicio && etapa.dataFim && (
                      <div
                        className="absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize z-20 hover:bg-black/10 rounded-r-md"
                        onMouseDown={(e) => handleMouseDown(e, etapa.id, 'end', etapa.dataInicio!, etapa.dataFim!)}
                      />
                    )}
                  </div>
                )}

                {/* Sem data definida */}
                {width === 0 && (
                  <div className="absolute top-1/2 left-4 -translate-y-1/2 text-xs text-gray-400 italic">
                    Data não definida
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legenda */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Concluído</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Arquitetura</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500"></div>
            <span>Engenharia</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-amber-500"></div>
            <span>Marcenaria</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span>Atrasado</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-0.5 h-3 bg-red-500"></div>
            <span>Hoje</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-3 bg-blue-100 border border-blue-300 rounded-sm"></div>
            <span>Semana atual</span>
          </div>
        </div>
      </div>
    </div>
  );
}


