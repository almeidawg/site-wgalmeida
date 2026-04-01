// ============================================================
// MODAL: Novo/Editar Evento do Google Calendar
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { format, addHours, parseISO, isValid } from 'date-fns';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  FileText,
  Bell,
  Loader2,
  Trash2,
  Save,
} from 'lucide-react';
import { createCalendarSAEvent, updateCalendarSAEvent, deleteCalendarSAEvent } from '@/lib/apiSecure';

// Interface para eventos do Google Calendar
export interface GoogleCalendarEvent {
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
  reminders?: {
    useDefault: boolean;
    overrides?: Array<{ method: 'email' | 'popup'; minutes: number }>;
  };
  htmlLink?: string;
}

interface NovoEventoModalProps {
  evento?: GoogleCalendarEvent | null;
  dataPadrao?: Date | null;
  onClose: () => void;
  onSave: () => void;
}

const REMINDER_OPTIONS = [
  { value: 0, label: 'No momento do evento' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 120, label: '2 horas antes' },
  { value: 1440, label: '1 dia antes' },
];

export default function NovoEventoModal({
  evento,
  dataPadrao,
  onClose,
  onSave,
}: NovoEventoModalProps) {
  const isEdicao = !!evento;

  // Estado do formulario
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [local, setLocal] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [horaFim, setHoraFim] = useState('');
  const [lembrete, setLembrete] = useState<number>(30);

  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const parseDataBR = useCallback((dataBR: string): string => {
    // Converte dd/mm/yyyy para yyyy-MM-dd
    if (!dataBR) return '';
    const parts = dataBR.replace(/\D/g, '');
    if (parts.length !== 8) return '';
    const dia = parts.substring(0, 2);
    const mes = parts.substring(2, 4);
    const ano = parts.substring(4, 8);
    return `${ano}-${mes}-${dia}`;
  }, []);

  const handleDataChange = useCallback((value: string, setter: (v: string) => void) => {
    // Remove caracteres não numéricos
    let numeros = value.replace(/\D/g, '');

    // Limita a 8 dígitos
    numeros = numeros.substring(0, 8);

    // Formata como dd/mm/yyyy
    let formatted = '';
    if (numeros.length > 0) {
      formatted = numeros.substring(0, 2);
      if (numeros.length > 2) {
        formatted += '/' + numeros.substring(2, 4);
        if (numeros.length > 4) {
          formatted += '/' + numeros.substring(4, 8);
        }
      }
    }
    setter(formatted);
  }, []);

  const handleHoraChange = useCallback((value: string, setter: (v: string) => void) => {
    // Remove caracteres não numéricos
    let numeros = value.replace(/\D/g, '');

    // Limita a 4 dígitos
    numeros = numeros.substring(0, 4);

    // Formata como HH:mm
    let formatted = '';
    if (numeros.length > 0) {
      let horas = numeros.substring(0, 2);
      // Limita horas a 23
      if (parseInt(horas) > 23) horas = '23';
      formatted = horas;
      if (numeros.length > 2) {
        let minutos = numeros.substring(2, 4);
        // Limita minutos a 59
        if (parseInt(minutos) > 59) minutos = '59';
        formatted += ':' + minutos;
      }
    }
    setter(formatted);
  }, []);

  // Preencher formulario ao abrir
  useEffect(() => {
    if (evento) {
      // Edicao
      setTitulo(evento.summary || '');
      setDescricao(evento.description || '');
      setLocal(evento.location || '');

      const inicio = evento.start.dateTime ? parseISO(evento.start.dateTime) : new Date();
      const fim = evento.end.dateTime ? parseISO(evento.end.dateTime) : addHours(inicio, 1);

      // Formato brasileiro: dd/mm/yyyy
      setDataInicio(format(inicio, 'dd/MM/yyyy'));
      setHoraInicio(format(inicio, 'HH:mm'));
      setDataFim(format(fim, 'dd/MM/yyyy'));
      setHoraFim(format(fim, 'HH:mm'));

      // Lembrete
      const reminder = evento.reminders?.overrides?.[0]?.minutes;
      if (reminder !== undefined) {
        setLembrete(reminder);
      }
    } else {
      // Novo evento
      const dataBase = dataPadrao || new Date();
      const agora = new Date();
      const horaAtual = format(agora, 'HH:00');
      const proximaHora = format(addHours(agora, 1), 'HH:00');

      // Formato brasileiro: dd/mm/yyyy
      setDataInicio(format(dataBase, 'dd/MM/yyyy'));
      setHoraInicio(horaAtual);
      setDataFim(format(dataBase, 'dd/MM/yyyy'));
      setHoraFim(proximaHora);
    }
  }, [evento, dataPadrao]);

  // Ajustar data/hora fim quando inicio mudar
  useEffect(() => {
    if (!isEdicao && dataInicio && horaInicio && dataInicio.length === 10 && horaInicio.length === 5) {
      // Converter data brasileira para Date
      const dataISO = parseDataBR(dataInicio);
      if (dataISO) {
        const inicio = new Date(`${dataISO}T${horaInicio}`);
        if (isValid(inicio)) {
          const fim = addHours(inicio, 1);
          setDataFim(format(fim, 'dd/MM/yyyy'));
          setHoraFim(format(fim, 'HH:mm'));
        }
      }
    }
  }, [dataInicio, horaInicio, isEdicao, parseDataBR]);

  // Salvar evento
  const handleSalvar = async () => {
    if (!titulo.trim()) {
      setErro('O título é obrigatório');
      return;
    }

    if (!dataInicio || !horaInicio || !dataFim || !horaFim) {
      setErro('Preencha as datas e horários');
      return;
    }

    // Validar formato das datas
    if (dataInicio.length !== 10 || dataFim.length !== 10) {
      setErro('Formato de data inválido. Use dd/mm/aaaa');
      return;
    }

    if (horaInicio.length !== 5 || horaFim.length !== 5) {
      setErro('Formato de hora inválido. Use hh:mm');
      return;
    }

    try {
      setSalvando(true);
      setErro(null);

      // Converter data brasileira para ISO
      const dataInicioISO = parseDataBR(dataInicio);
      const dataFimISO = parseDataBR(dataFim);

      if (!dataInicioISO || !dataFimISO) {
        throw new Error('Data inválida');
      }

      const startDateTime = new Date(`${dataInicioISO}T${horaInicio}`).toISOString();
      const endDateTime = new Date(`${dataFimISO}T${horaFim}`).toISOString();

      const eventData = {
        summary: titulo.trim(),
        description: descricao.trim() || undefined,
        location: local.trim() || undefined,
        start: { dateTime: startDateTime, timeZone: 'America/Sao_Paulo' },
        end: { dateTime: endDateTime, timeZone: 'America/Sao_Paulo' },
      };

      let result;
      if (isEdicao && evento?.id) {
        result = await updateCalendarSAEvent(evento.id, eventData);
      } else {
        result = await createCalendarSAEvent(eventData);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      onSave();
    } catch (error) {
      console.error('[NovoEventoModal] Erro ao salvar:', error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao salvar evento';
      setErro(mensagem);
    } finally {
      setSalvando(false);
    }
  };

  // Excluir evento
  const handleExcluir = async () => {
    if (!evento?.id) return;

    if (!confirm('Tem certeza que deseja excluir este evento?')) {
      return;
    }

    try {
      setExcluindo(true);
      setErro(null);

      const result = await deleteCalendarSAEvent(evento.id);
      if (result.error) {
        throw new Error(result.error);
      }

      onSave();
    } catch (error) {
      console.error('[NovoEventoModal] Erro ao excluir:', error);
      const mensagem = error instanceof Error ? error.message : 'Erro ao excluir evento';
      setErro(mensagem);
    } finally {
      setExcluindo(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#F25C26] to-[#FF7A45] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20">
                <Calendar className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-normal">
                {isEdicao ? 'Editar Evento' : 'Novo Evento'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Conteudo */}
        <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Erro */}
          {erro && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {erro}
            </div>
          )}

          {/* Titulo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titulo *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Reuniao com cliente"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
              autoFocus
            />
          </div>

          {/* Data/Hora Inicio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Início
              </label>
              <input
                type="text"
                value={dataInicio}
                onChange={(e) => handleDataChange(e.target.value, setDataInicio)}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora Início
              </label>
              <input
                type="text"
                value={horaInicio}
                onChange={(e) => handleHoraChange(e.target.value, setHoraInicio)}
                placeholder="hh:mm"
                maxLength={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
              />
            </div>
          </div>

          {/* Data/Hora Fim */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar className="w-4 h-4 inline mr-1" />
                Data Fim
              </label>
              <input
                type="text"
                value={dataFim}
                onChange={(e) => handleDataChange(e.target.value, setDataFim)}
                placeholder="dd/mm/aaaa"
                maxLength={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock className="w-4 h-4 inline mr-1" />
                Hora Fim
              </label>
              <input
                type="text"
                value={horaFim}
                onChange={(e) => handleHoraChange(e.target.value, setHoraFim)}
                placeholder="hh:mm"
                maxLength={5}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
              />
            </div>
          </div>

          {/* Local */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <MapPin className="w-4 h-4 inline mr-1" />
              Local (opcional)
            </label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Ex: Escritorio, Zoom, etc."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
            />
          </div>

          {/* Descricao */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <FileText className="w-4 h-4 inline mr-1" />
              Descricao (opcional)
            </label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Detalhes do evento..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all resize-none"
            />
          </div>

          {/* Lembrete */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Bell className="w-4 h-4 inline mr-1" />
              Lembrete
            </label>
            <select
              value={lembrete}
              onChange={(e) => setLembrete(Number(e.target.value))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#F25C26] focus:border-[#F25C26] outline-none transition-all"
            >
              {REMINDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {isEdicao && (
              <button
                onClick={handleExcluir}
                disabled={excluindo || salvando}
                className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {excluindo ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Excluir
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              disabled={salvando || excluindo}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSalvar}
              disabled={salvando || excluindo}
              className="px-6 py-2 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {salvando ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Salvar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


