// ============================================================
// WIDGET: Google Calendar para Dashboard
// Sistema WG Easy - Grupo WG Almeida
// Calendario compacto (2 semanas) com sincronizacao Google Calendar
// Usa Service Account (sempre ativo, sem login)
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
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
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  parseISO,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Plus,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ExternalLink,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import NovoEventoModal from './NovoEventoModal';
import { getCalendarSAStatus, getCalendarSAEvents } from '@/lib/apiSecure';

// Interface para eventos
interface GoogleCalendarEvent {
  id?: string;
  summary: string;
  description?: string;
  location?: string;
  start: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  colorId?: string;
  htmlLink?: string;
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const DIAS_SEMANA_CURTO = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

// Cores para eventos baseado no colorId do Google
const EVENT_COLORS: Record<string, string> = {
  '1': '#7986CB', // Lavanda
  '2': '#33B679', // Verde
  '3': '#8E24AA', // Roxo
  '4': '#E67C73', // Vermelho
  '5': '#F6BF26', // Amarelo
  '6': '#F4511E', // Laranja
  '7': '#039BE5', // Turquesa
  '8': '#616161', // Cinza
  '9': '#3F51B5', // Azul
  '10': '#0B8043', // Verde escuro
  '11': '#D50000', // Vermelho escuro
  default: '#F25C26', // WG Orange
};

interface GoogleCalendarWidgetProps {
  userEmail?: string;
  defaultCompact?: boolean; // Modo compacto por padrao
}

export default function GoogleCalendarWidget({ userEmail, defaultCompact = true }: GoogleCalendarWidgetProps) {
  const [mesAtual, setMesAtual] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(null);
  const [modoCompacto, setModoCompacto] = useState(defaultCompact); // Modo compacto (2 semanas)
  const [eventos, setEventos] = useState<GoogleCalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [conectado, setConectado] = useState(false);
  const [verificando, setVerificando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [eventoEditando, setEventoEditando] = useState<GoogleCalendarEvent | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  // Carregar eventos do mes via backend Service Account
  const carregarEventos = useCallback(async () => {
    try {
      setLoading(true);
      setErro(null);

      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);

      console.log('[GoogleCalendarWidget] Carregando eventos para:', userEmail || 'default');

      const data = await getCalendarSAEvents({
        timeMin: inicioMes.toISOString(),
        timeMax: fimMes.toISOString(),
        maxResults: 100,
        userEmail,
      });

      if (data.events) {
        setEventos(data.events);
      } else if (data.error) {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('[GoogleCalendarWidget] Erro ao carregar eventos:', error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao carregar eventos';
      setErro(mensagem);
    } finally {
      setLoading(false);
    }
  }, [mesAtual, userEmail]);

  // Verificar se Service Account está configurada
  useEffect(() => {
    async function verificarStatus() {
      try {
        const data = await getCalendarSAStatus();
        setConectado(data.configured);
        if (data.error) {
          console.warn('[GoogleCalendarWidget] Status warning:', data.error);
          setErro(data.error);
        }
      } catch (error) {
        console.error('[GoogleCalendarWidget] Erro ao verificar status:', error);
        setConectado(false);
        setErro(error instanceof Error ? error.message : 'Falha ao verificar conexao do calendario');
      } finally {
        setVerificando(false);
      }
    }
    verificarStatus();
  }, [userEmail]);

  // Carregar eventos quando mes mudar
  useEffect(() => {
    if (conectado) {
      carregarEventos();
    }
  }, [conectado, carregarEventos]);

  // Auto-refresh a cada 5 minutos
  useEffect(() => {
    if (!conectado) return;

    const interval = setInterval(() => {
      carregarEventos();
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [carregarEventos, conectado]);

  // Abrir modal para novo evento
  const handleNovoEvento = (data?: Date) => {
    setEventoEditando(null);
    if (data) {
      setDiaSelecionado(data);
    }
    setModalAberto(true);
  };

  // Abrir modal para editar evento
  const handleEditarEvento = (evento: GoogleCalendarEvent) => {
    setEventoEditando(evento);
    setModalAberto(true);
  };

  // Fechar modal
  const handleFecharModal = () => {
    setModalAberto(false);
    setEventoEditando(null);
  };

  // Evento salvo - recarregar lista
  const handleEventoSalvo = () => {
    handleFecharModal();
    carregarEventos();
  };

  // Gerar dias do calendario (compacto = 2 semanas, completo = mes inteiro)
  const diasCalendario = useMemo(() => {
    if (modoCompacto) {
      // Modo compacto: semana atual + proxima semana
      const inicioSemana = startOfWeek(mesAtual, { locale: ptBR });
      const fimSegundaSemana = endOfWeek(addWeeks(mesAtual, 1), { locale: ptBR });
      return eachDayOfInterval({ start: inicioSemana, end: fimSegundaSemana });
    } else {
      // Modo completo: mes inteiro
      const inicioMes = startOfMonth(mesAtual);
      const fimMes = endOfMonth(mesAtual);
      const inicioCalendario = startOfWeek(inicioMes, { locale: ptBR });
      const fimCalendario = endOfWeek(fimMes, { locale: ptBR });
      return eachDayOfInterval({ start: inicioCalendario, end: fimCalendario });
    }
  }, [mesAtual, modoCompacto]);

  // Navegacao: avanca/retrocede 1 semana no modo compacto, 1 mes no modo completo
  const navegarAnterior = () => {
    if (modoCompacto) {
      setMesAtual(subWeeks(mesAtual, 1));
    } else {
      setMesAtual(subMonths(mesAtual, 1));
    }
  };

  const navegarProximo = () => {
    if (modoCompacto) {
      setMesAtual(addWeeks(mesAtual, 1));
    } else {
      setMesAtual(addMonths(mesAtual, 1));
    }
  };

  // Mapear eventos por data
  const eventosPorDia = useMemo(() => {
    const mapa: Record<string, GoogleCalendarEvent[]> = {};

    eventos.forEach((evento) => {
      const dataEvento = evento.start.dateTime || evento.start.date;
      if (!dataEvento) return;

      const dataKey = format(parseISO(dataEvento), 'yyyy-MM-dd');
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

  // Formatar hora do evento
  const formatarHora = (evento: GoogleCalendarEvent) => {
    const dataHora = evento.start.dateTime;
    if (!dataHora) return null; // Retorna null para eventos de dia inteiro
    return format(parseISO(dataHora), 'HH:mm', { locale: ptBR });
  };

  // Formatar texto do evento para exibiçÍo no calendário
  const formatarTextoEvento = (evento: GoogleCalendarEvent) => {
    const hora = formatarHora(evento);
    const titulo = evento.summary || 'Sem título';
    if (hora) {
      return `${hora} ${titulo}`;
    }
    return titulo; // Para eventos de dia inteiro, mostra só o título
  };

  // Obter cor do evento
  const getEventColor = (evento: GoogleCalendarEvent) => {
    return EVENT_COLORS[evento.colorId || 'default'] || EVENT_COLORS.default;
  };

  // Tela de verificaçÍo
  if (verificando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#F25C26] to-[#FF7A45] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-normal">Google Calendar</h3>
              <p className="text-sm text-white/80">Verificando conexÍo...</p>
            </div>
          </div>
        </div>
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#F25C26]" />
        </div>
      </div>
    );
  }

  // Tela quando Service Account não está configurada
  if (!conectado) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-[#F25C26] to-[#FF7A45] text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/20">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-normal">Google Calendar</h3>
              <p className="text-sm text-white/80">Sincronize seus compromissos</p>
            </div>
          </div>
        </div>

        <div className="p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-amber-500" />
          </div>

          <h4 className="text-lg font-normal text-gray-900 mb-2">
            Aguardando ConfiguraçÍo
          </h4>
          <p className="text-sm text-gray-600 mb-4 max-w-sm mx-auto">
            O Google Calendar será ativado automaticamente quando a Service Account estiver configurada
            com permissões de Calendar.
          </p>

          {erro && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {erro}
            </div>
          )}

          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            ConexÍo automática (sem login)
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
        {/* Header Compacto */}
        <div className={`px-4 ${modoCompacto ? 'py-2.5' : 'py-4'} bg-gradient-to-r from-[#F25C26] to-[#FF7A45] text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-xl bg-white/20`}>
                <CalendarIcon className={modoCompacto ? 'w-4 h-4' : 'w-5 h-5'} />
              </div>
              <div>
                <h3 className={`${modoCompacto ? 'text-sm' : 'text-lg'} font-normal`}>
                  {modoCompacto
                    ? format(mesAtual, "dd MMM", { locale: ptBR }) + ' - ' + format(addWeeks(mesAtual, 1), "dd MMM", { locale: ptBR })
                    : format(mesAtual, 'MMMM yyyy', { locale: ptBR })
                  }
                </h3>
                {!modoCompacto && <p className="text-sm text-white/80">Google Calendar</p>}
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => carregarEventos()}
                disabled={loading}
                className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-white/20 transition-colors`}
                title="Atualizar"
              >
                <RefreshCw className={`${modoCompacto ? 'w-4 h-4' : 'w-5 h-5'} ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={navegarAnterior}
                className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-white/20 transition-colors`}
              >
                <ChevronLeft className={modoCompacto ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
              <button
                onClick={() => setMesAtual(new Date())}
                className={`${modoCompacto ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm'} rounded-lg hover:bg-white/20 transition-colors`}
              >
                Hoje
              </button>
              <button
                onClick={navegarProximo}
                className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-white/20 transition-colors`}
              >
                <ChevronRight className={modoCompacto ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
              <button
                onClick={() => setModoCompacto(!modoCompacto)}
                className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-lg hover:bg-white/20 transition-colors`}
                title={modoCompacto ? 'Expandir (mês)' : 'Compactar (2 semanas)'}
              >
                {modoCompacto ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => handleNovoEvento()}
                className={`${modoCompacto ? 'p-1.5' : 'p-2'} rounded-lg bg-white/20 hover:bg-white/30 transition-colors`}
                title="Novo Evento"
              >
                <Plus className={modoCompacto ? 'w-4 h-4' : 'w-5 h-5'} />
              </button>
            </div>
          </div>
        </div>

        {/* Erro */}
        {erro && (
          <div className="px-4 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
            {erro}
          </div>
        )}

        {/* Dias da Semana */}
        <div className="grid grid-cols-7 border-b border-gray-200">
          {(modoCompacto ? DIAS_SEMANA_CURTO : DIAS_SEMANA).map((dia, idx) => (
            <div
              key={idx}
              className={`${modoCompacto ? 'px-1 py-1.5' : 'px-2 py-3'} text-center text-xs font-normal text-gray-500 uppercase tracking-wider`}
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
            const maxEventos = modoCompacto ? 2 : 3;

            return (
              <button
                key={index}
                type="button"
                onClick={() => setDiaSelecionado(dia)}
                onDoubleClick={() => handleNovoEvento(dia)}
                className={`
                  ${modoCompacto ? 'min-h-[60px] p-1' : 'min-h-[90px] p-2'} border-b border-r border-gray-100 text-left transition-all
                  hover:bg-gray-50
                  ${!isMesAtual ? 'bg-gray-50/50 text-gray-400' : ''}
                  ${isSelecionado ? 'bg-orange-50 ring-2 ring-[#F25C26] ring-inset' : ''}
                `}
              >
                {/* Numero do dia */}
                <div className="flex items-center justify-between mb-0.5">
                  <span
                    className={`
                      ${modoCompacto ? 'w-5 h-5 text-xs' : 'w-7 h-7 text-sm'} flex items-center justify-center font-medium rounded-full
                      ${isHoje ? 'bg-primary text-white' : ''}
                      ${!isHoje && isMesAtual ? 'text-gray-900' : ''}
                    `}
                  >
                    {format(dia, 'd')}
                  </span>
                  {modoCompacto && eventosNoDia.length > 0 && (
                    <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  )}
                </div>

                {/* Eventos */}
                <div className={modoCompacto ? 'space-y-0.5' : 'space-y-1'}>
                  {eventosNoDia.slice(0, maxEventos).map((evento) => (
                    <div
                      key={evento.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditarEvento(evento);
                      }}
                      className={`${modoCompacto ? 'text-[10px] px-1 py-0' : 'text-xs px-1.5 py-0.5'} rounded truncate cursor-pointer hover:opacity-80 transition-opacity`}
                      style={{
                        backgroundColor: `${getEventColor(evento)}20`,
                        color: getEventColor(evento),
                        borderLeft: `2px solid ${getEventColor(evento)}`,
                      }}
                      title={evento.summary || 'Sem título'}
                    >
                      {modoCompacto ? (formatarHora(evento) || '•') : formatarTextoEvento(evento)}
                    </div>
                  ))}
                  {eventosNoDia.length > maxEventos && (
                    <div className={`${modoCompacto ? 'text-[10px]' : 'text-xs'} text-gray-500 pl-1`}>
                      +{eventosNoDia.length - maxEventos}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detalhes do Dia Selecionado */}
        {diaSelecionado && (
          <div className={`border-t border-gray-200 ${modoCompacto ? 'p-2' : 'p-4'} bg-gray-50`}>
            <div className="flex items-center justify-between mb-2">
              <h4 className={`${modoCompacto ? 'text-xs' : 'text-sm'} font-normal text-gray-900`}>
                {format(diaSelecionado, modoCompacto ? "EEE, d MMM" : "EEEE, d 'de' MMMM", { locale: ptBR })}
              </h4>
              <button
                onClick={() => handleNovoEvento(diaSelecionado)}
                className={`${modoCompacto ? 'text-xs' : 'text-sm'} text-[#F25C26] hover:text-[#e04a1a] font-medium flex items-center gap-1`}
              >
                <Plus className={modoCompacto ? 'w-3 h-3' : 'w-4 h-4'} />
                {!modoCompacto && 'Adicionar'}
              </button>
            </div>

            {eventosDodiaSelecionado.length === 0 ? (
              <p className={`${modoCompacto ? 'text-xs py-2' : 'text-sm py-4'} text-gray-500 text-center`}>
                Nenhum evento
              </p>
            ) : (
              <div className={`space-y-1.5 ${modoCompacto ? 'max-h-[100px]' : 'max-h-[200px]'} overflow-y-auto`}>
                {eventosDodiaSelecionado.map((evento) => (
                  <div
                    key={evento.id}
                    onClick={() => handleEditarEvento(evento)}
                    className={`${modoCompacto ? 'p-1.5' : 'p-3'} bg-white rounded-lg border border-gray-200 hover:border-[#F25C26] cursor-pointer transition-colors`}
                  >
                    <div className="flex items-start gap-2">
                      <div
                        className={`${modoCompacto ? 'w-2 h-2 mt-1' : 'w-3 h-3 mt-1.5'} rounded-full flex-shrink-0`}
                        style={{ backgroundColor: getEventColor(evento) }}
                      />
                      <div className="flex-1 min-w-0">
                        <h5 className={`${modoCompacto ? 'text-xs' : 'text-sm'} font-medium text-gray-900 truncate`}>
                          {evento.summary}
                        </h5>
                        <div className={`flex items-center gap-2 ${modoCompacto ? 'text-[10px]' : 'text-xs'} text-gray-500`}>
                          <span className="flex items-center gap-0.5">
                            <Clock className={modoCompacto ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                            {formatarHora(evento) || 'Dia inteiro'}
                          </span>
                          {!modoCompacto && evento.location && (
                            <span className="flex items-center gap-1 truncate">
                              <MapPin className="w-3 h-3" />
                              {evento.location}
                            </span>
                          )}
                        </div>
                      </div>
                      {!modoCompacto && evento.htmlLink && (
                        <a
                          href={evento.htmlLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-gray-400 hover:text-[#F25C26] rounded transition-colors"
                          title="Abrir no Google Calendar"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal de Evento */}
      {modalAberto && (
        <NovoEventoModal
          evento={eventoEditando}
          dataPadrao={diaSelecionado}
          onClose={handleFecharModal}
          onSave={handleEventoSalvo}
        />
      )}
    </>
  );
}


