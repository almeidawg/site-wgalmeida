// src/components/cliente/CalendarioCliente.tsx
// Calendário visual em formato de grade mensal para área do cliente
// Mostra eventos, deadlines e marcos do projeto

import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Flag,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Hammer,
  Paintbrush,
} from 'lucide-react';

export interface EventoCalendario {
  id: string;
  titulo: string;
  data: string;
  tipo: 'etapa' | 'deadline' | 'marco' | 'reuniao' | 'entrega';
  nucleo?: 'arquitetura' | 'engenharia' | 'marcenaria';
  status?: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  descricao?: string;
}

interface CalendarioClienteProps {
  eventos: EventoCalendario[];
  onDiaClick?: (data: Date, eventos: EventoCalendario[]) => void;
  onEventoClick?: (evento: EventoCalendario) => void;
}

const NUCLEO_COLORS = {
  arquitetura: 'bg-blue-500',
  engenharia: 'bg-orange-500',
  marcenaria: 'bg-amber-500',
};

const NUCLEO_ICONS = {
  arquitetura: Building2,
  engenharia: Hammer,
  marcenaria: Paintbrush,
};

const TIPO_STYLES = {
  etapa: { bg: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500' },
  deadline: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  marco: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  reuniao: { bg: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  entrega: { bg: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
};

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function CalendarioCliente({
  eventos,
  onDiaClick,
  onEventoClick,
}: CalendarioClienteProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);

  // Gerar dias do mês com padding para semana completa
  const diasCalendario = useMemo(() => {
    const inicioMes = startOfMonth(mesAtual);
    const fimMes = endOfMonth(mesAtual);
    const inicioCalendario = startOfWeek(inicioMes, { locale: ptBR });
    const fimCalendario = endOfWeek(fimMes, { locale: ptBR });

    return eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });
  }, [mesAtual]);

  // Mapear eventos por data
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, EventoCalendario[]> = {};
    eventos.forEach((evento) => {
      const dataKey = format(new Date(evento.data), 'yyyy-MM-dd');
      if (!mapa[dataKey]) mapa[dataKey] = [];
      mapa[dataKey].push(evento);
    });
    return mapa;
  }, [eventos]);

  // Eventos do dia selecionado
  const eventosDodiaSelecionado = useMemo(() => {
    if (!diaSelecionado) return [];
    const dataKey = format(diaSelecionado, 'yyyy-MM-dd');
    return eventosPorDia[dataKey] || [];
  }, [diaSelecionado, eventosPorDia]);

  function handleDiaClick(dia: Date) {
    setDiaSelecionado(dia);
    const dataKey = format(dia, 'yyyy-MM-dd');
    const eventosNoDia = eventosPorDia[dataKey] || [];
    onDiaClick?.(dia, eventosNoDia);
  }

  function getStatusIcon(status?: string) {
    switch (status) {
      case 'concluido':
        return <CheckCircle2 className="w-3 h-3 text-green-500" />;
      case 'em_andamento':
        return <Clock className="w-3 h-3 text-blue-500" />;
      case 'atrasado':
        return <AlertTriangle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-gray-400" />;
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header do Calendário */}
      <div className="px-6 py-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-normal">
                {format(mesAtual, 'MMMM yyyy', { locale: ptBR })}
              </h3>
              <p className="text-sm text-white/80">Calendário do Projeto</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMesAtual(subMonths(mesAtual, 1))}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMesAtual(new Date())}
              className="px-3 py-1.5 text-sm rounded-lg hover:bg-white/20 transition-colors"
            >
              Hoje
            </button>
            <button
              onClick={() => setMesAtual(addMonths(mesAtual, 1))}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Dias da Semana */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {DIAS_SEMANA.map((dia) => (
          <div
            key={dia}
            className="px-2 py-3 text-center text-xs font-normal text-gray-500 uppercase tracking-wider"
          >
            {dia}
          </div>
        ))}
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7">
        {diasCalendario.map((dia, index) => {
          const dataKey = format(dia, 'yyyy-MM-dd');
          const eventosNoDia = eventosPorDia[dataKey] || [];
          const isMesAtual = isSameMonth(dia, mesAtual);
          const isHoje = isToday(dia);
          const isSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);

          return (
            <button
              key={index}
              onClick={() => handleDiaClick(dia)}
              className={`
                min-h-[100px] p-2 border-b border-r border-gray-100 text-left transition-all
                hover:bg-gray-50
                ${!isMesAtual ? 'bg-gray-50/50' : ''}
                ${isSelecionado ? 'bg-orange-50 ring-2 ring-orange-500 ring-inset' : ''}
              `}
            >
              {/* Número do dia */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`
                    w-7 h-7 flex items-center justify-center rounded-full text-sm font-medium
                    ${isHoje ? 'bg-orange-500 text-white' : ''}
                    ${!isMesAtual ? 'text-gray-300' : 'text-gray-700'}
                  `}
                >
                  {format(dia, 'd')}
                </span>
                {eventosNoDia.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{eventosNoDia.length - 3}
                  </span>
                )}
              </div>

              {/* Eventos do dia (max 3) */}
              <div className="space-y-1">
                {eventosNoDia.slice(0, 3).map((evento) => {
                  const tipoStyle = TIPO_STYLES[evento.tipo] || TIPO_STYLES.etapa;
                  return (
                    <div
                      key={evento.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEventoClick?.(evento);
                      }}
                      className={`
                        px-1.5 py-0.5 rounded text-xs truncate cursor-pointer
                        hover:opacity-80 transition-opacity
                        ${tipoStyle.bg}
                      `}
                      title={evento.titulo}
                    >
                      <span className="flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tipoStyle.dot}`}
                        />
                        <span className="truncate">{evento.titulo}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </button>
          );
        })}
      </div>

      {/* Painel de Detalhes do Dia Selecionado */}
      {diaSelecionado && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-normal text-gray-900">
              {format(diaSelecionado, "d 'de' MMMM", { locale: ptBR })}
            </h4>
            <button
              onClick={() => setDiaSelecionado(null)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Fechar
            </button>
          </div>

          {eventosDodiaSelecionado.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              Nenhum evento neste dia
            </p>
          ) : (
            <div className="space-y-2">
              {eventosDodiaSelecionado.map((evento) => {
                const tipoStyle = TIPO_STYLES[evento.tipo] || TIPO_STYLES.etapa;
                const NucleoIcon = evento.nucleo
                  ? NUCLEO_ICONS[evento.nucleo]
                  : Flag;
                const nucleoColor = evento.nucleo
                  ? NUCLEO_COLORS[evento.nucleo]
                  : 'bg-gray-500';

                return (
                  <div
                    key={evento.id}
                    onClick={() => onEventoClick?.(evento)}
                    className="flex items-start gap-3 p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-200 hover:shadow-sm transition-all cursor-pointer"
                  >
                    <div
                      className={`p-2 rounded-lg ${nucleoColor} text-white flex-shrink-0`}
                    >
                      <NucleoIcon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 truncate">
                          {evento.titulo}
                        </p>
                        {getStatusIcon(evento.status)}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${tipoStyle.bg}`}
                        >
                          {evento.tipo}
                        </span>
                        {evento.nucleo && (
                          <span className="text-xs text-gray-500 capitalize">
                            {evento.nucleo}
                          </span>
                        )}
                      </div>
                      {evento.descricao && (
                        <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                          {evento.descricao}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Legenda */}
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span className="text-gray-600">Etapa</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-gray-600">Deadline</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">Marco</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span className="text-gray-600">ReuniÍo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600">Entrega</span>
          </div>
        </div>
      </div>
    </div>
  );
}

