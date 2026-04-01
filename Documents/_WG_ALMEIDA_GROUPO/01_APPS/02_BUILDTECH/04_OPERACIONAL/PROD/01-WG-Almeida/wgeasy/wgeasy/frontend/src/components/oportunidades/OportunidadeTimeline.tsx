/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// COMPONENTE: Timeline de Oportunidade
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calendar,
  FileText,
  CheckCircle2,
  Clock,
  Camera,
  MessageSquare,
  TrendingUp,
  FileCheck,
  Hammer,
  Building2,
  Paintbrush,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { listarTimelineOportunidade, TimelineEvento } from '@/lib/jornadaClienteApi';
import WGStarIcon from "@/components/icons/WGStarIcon";

interface OportunidadeTimelineProps {
  oportunidadeId?: string;
  pessoaId?: string;
  mostrarTodos?: boolean; // Se true, mostra eventos não visíveis ao cliente também
}

// ConfiguraçÍo visual por tipo de evento
const TIPO_CONFIG: Record<string, { icon: any; color: string; bgColor: string }> = {
  status: { icon: ArrowRight, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  progresso: { icon: TrendingUp, color: 'text-green-600', bgColor: 'bg-green-50' },
  documento: { icon: FileText, color: 'text-purple-600', bgColor: 'bg-purple-50' },
  foto: { icon: Camera, color: 'text-pink-600', bgColor: 'bg-pink-50' },
  comentario: { icon: MessageSquare, color: 'text-cyan-600', bgColor: 'bg-cyan-50' },
  etapa: { icon: CheckCircle2, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
  aprovacao: { icon: FileCheck, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  default: { icon: Clock, color: 'text-gray-600', bgColor: 'bg-gray-50' },
};

// ConfiguraçÍo visual por núcleo
const NUCLEO_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  arquitetura: { icon: Building2, label: 'Arquitetura', color: 'bg-blue-100 text-blue-700' },
  engenharia: { icon: Hammer, label: 'Engenharia', color: 'bg-orange-100 text-orange-700' },
  marcenaria: { icon: Paintbrush, label: 'Marcenaria', color: 'bg-amber-100 text-amber-700' },
};

export default function OportunidadeTimeline({ oportunidadeId, pessoaId, mostrarTodos = true }: OportunidadeTimelineProps) {
  const timelineId = oportunidadeId || pessoaId;
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<TimelineEvento[]>([]);
  const [filtroCliente, setFiltroCliente] = useState(false);

  useEffect(() => {
    if (timelineId) {
      carregarEventos();
    }
  }, [timelineId, filtroCliente]);

  async function carregarEventos() {
    if (!timelineId) return;

    try {
      setLoading(true);
      const data = await listarTimelineOportunidade(timelineId, filtroCliente);
      setEventos(data);
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    } finally {
      setLoading(false);
    }
  }

  function getConfig(tipo: string) {
    return TIPO_CONFIG[tipo] || TIPO_CONFIG.default;
  }

  function formatarData(dataStr: string) {
    const data = parseDataLocal(dataStr);
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function parseDataLocal(valor: string) {
    const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoSemHora) {
      const [, ano, mes, dia] = isoSemHora;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    return new Date(valor);
  }

  if (!timelineId) {
    return (
      <div className="p-4 text-center text-gray-500">
        Selecione uma oportunidade para ver a timeline
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mr-2" />
        <span className="text-gray-600">Carregando...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {/* Cabeçalho com filtro */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-normal flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          Timeline da Oportunidade
        </h3>
        {mostrarTodos && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setFiltroCliente(!filtroCliente)}
            className="text-xs"
          >
            {filtroCliente ? (
              <>
                <Eye className="w-3 h-3 mr-1" />
                Visível ao Cliente
              </>
            ) : (
              <>
                <EyeOff className="w-3 h-3 mr-1" />
                Todos os Eventos
              </>
            )}
          </Button>
        )}
      </div>

      {eventos.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500">Nenhum evento registrado ainda</p>
        </div>
      ) : (
        <div className="relative">
          {/* Linha vertical */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-4">
            {eventos.map((evento) => {
              const config = getConfig(evento.tipo);
              const Icon = config.icon;
              const nucleoConfig = evento.nucleo ? NUCLEO_CONFIG[evento.nucleo] : null;

              return (
                <div key={evento.id} className="relative flex gap-3 ml-2">
                  {/* Ponto na timeline */}
                  <div
                    className={`w-5 h-5 rounded-full border-2 border-white shadow flex items-center justify-center ${
                      evento.destaque ? 'bg-amber-400' : config.bgColor
                    }`}
                  >
                    {evento.destaque && <WGStarIcon className="w-3 h-3 text-white" />}
                  </div>

                  {/* Card do evento */}
                  <div
                    className={`flex-1 p-3 rounded-lg border ${
                      evento.destaque ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${config.color}`} />
                        <span className="font-medium text-sm">{evento.titulo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!evento.visivel_cliente && (
                          <Badge variant="outline" className="text-xs bg-gray-100">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Interno
                          </Badge>
                        )}
                        <span className="text-xs text-gray-400">{formatarData(evento.criado_em)}</span>
                      </div>
                    </div>

                    {nucleoConfig && (
                      <Badge className={`text-xs mt-1 ${nucleoConfig.color}`}>
                        {nucleoConfig.label}
                      </Badge>
                    )}

                    {evento.descricao && (
                      <p className="text-xs text-gray-600 mt-1">{evento.descricao}</p>
                    )}

                    {evento.usuario_nome && (
                      <p className="text-xs text-gray-400 mt-1">por {evento.usuario_nome}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


