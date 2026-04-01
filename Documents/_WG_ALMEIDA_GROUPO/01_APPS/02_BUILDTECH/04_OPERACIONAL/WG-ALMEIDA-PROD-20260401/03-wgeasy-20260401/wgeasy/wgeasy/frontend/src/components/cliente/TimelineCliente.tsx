// src/components/cliente/TimelineCliente.tsx
// Timeline de eventos visíveis ao cliente
// Usa oportunidade_timeline com filtro visivel_cliente = true

import { useState, useEffect, useCallback, type ComponentType } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import WGStarIcon from "@/components/icons/WGStarIcon";

interface TimelineClienteProps {
  clienteId: string;
  oportunidadeId?: string;
  contratoId?: string;
  limit?: number;
}

interface EventoTimeline {
  id: string;
  oportunidade_id: string;
  contrato_id?: string;
  nucleo?: string;
  origem: string;
  tipo: string;
  titulo: string;
  descricao?: string;
  dados?: Record<string, unknown>;
  arquivo_url?: string;
  arquivo_tipo?: string;
  destaque: boolean;
  criado_em: string;
}

// ConfiguraçÍo visual por tipo de evento
const TIPO_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; color: string; bgColor: string }> = {
  status: {
    icon: ArrowRight,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
  },
  progresso: {
    icon: TrendingUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
  },
  documento: {
    icon: FileText,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
  },
  foto: {
    icon: Camera,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50',
  },
  comentario: {
    icon: MessageSquare,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
  },
  etapa: {
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
  },
  aprovacao: {
    icon: FileCheck,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
  },
  default: {
    icon: Clock,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
  },
};

// ConfiguraçÍo visual por núcleo
const NUCLEO_CONFIG: Record<string, { icon: ComponentType<{ className?: string }>; label: string; color: string }> = {
  arquitetura: {
    icon: Building2,
    label: 'Arquitetura',
    color: 'bg-blue-100 text-blue-700',
  },
  engenharia: {
    icon: Hammer,
    label: 'Engenharia',
    color: 'bg-orange-100 text-orange-700',
  },
  marcenaria: {
    icon: Paintbrush,
    label: 'Marcenaria',
    color: 'bg-amber-100 text-amber-700',
  },
};

export default function TimelineCliente({ clienteId, oportunidadeId, contratoId, limit = 20 }: TimelineClienteProps) {
  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<EventoTimeline[]>([]);

  const carregarEventos = useCallback(async () => {
    try {
      setLoading(true);

      // Se tem oportunidadeId, buscar direto
      if (oportunidadeId) {
        const { data, error } = await supabase
          .from('oportunidade_timeline')
          .select('*')
          .eq('oportunidade_id', oportunidadeId)
          .eq('visivel_cliente', true)
          .order('criado_em', { ascending: false })
          .limit(limit);

        if (!error && data) {
          setEventos(data);
        }
        setLoading(false);
        return;
      }

      // Se tem contratoId, buscar oportunidade vinculada
      if (contratoId) {
        const { data: contrato } = await supabase
          .from('contratos')
          .select('id')
          .eq('id', contratoId)
          .single();

        if (contrato) {
          // Buscar eventos pelo contrato_id
          const { data, error } = await supabase
            .from('oportunidade_timeline')
            .select('*')
            .eq('contrato_id', contratoId)
            .eq('visivel_cliente', true)
            .order('criado_em', { ascending: false })
            .limit(limit);

          if (!error && data) {
            setEventos(data);
          }
        }
        setLoading(false);
        return;
      }

      // Buscar todas oportunidades do cliente
      const { data: oportunidades } = await supabase
        .from('oportunidades')
        .select('id')
        .eq('cliente_id', clienteId)
        .in('status', ['qualificado', 'proposta', 'ganho', 'em_execucao']);

      if (!oportunidades || oportunidades.length === 0) {
        setEventos([]);
        setLoading(false);
        return;
      }

      const oppIds = oportunidades.map((o) => o.id);

      // Buscar eventos
      const { data, error } = await supabase
        .from('oportunidade_timeline')
        .select('*')
        .in('oportunidade_id', oppIds)
        .eq('visivel_cliente', true)
        .order('criado_em', { ascending: false })
        .limit(limit);

      if (!error && data) {
        setEventos(data);
      }
    } catch (error) {
      console.error('Erro ao carregar timeline:', error);
    } finally {
      setLoading(false);
    }
  }, [clienteId, contratoId, limit, oportunidadeId]);

  useEffect(() => {
    carregarEventos();
  }, [carregarEventos]);

  function getConfig(tipo: string) {
    return TIPO_CONFIG[tipo] || TIPO_CONFIG.default;
  }

  function formatarData(dataStr: string) {
    const data = parseDataLocal(dataStr);
    const hoje = new Date();
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);

    // Verificar se é hoje
    if (data.toDateString() === hoje.toDateString()) {
      return `Hoje às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Verificar se é ontem
    if (data.toDateString() === ontem.toDateString()) {
      return `Ontem às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Verificar se é dessa semana
    const diffDays = Math.floor((hoje.getTime() - data.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 7) {
      const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
      return `${diasSemana[data.getDay()]} às ${data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    }

    // Data completa
    return data.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
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

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando timeline...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (eventos.length === 0) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6 text-center">
          <Sparkles className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <p className="text-blue-800 font-medium">Seu projeto está começando!</p>
          <p className="text-sm text-blue-600 mt-1">
            Aqui você acompanhará todas as atualizações importantes do seu projeto.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Agrupar eventos por data
  const eventosPorData = eventos.reduce((acc: Record<string, EventoTimeline[]>, evento) => {
    const data = new Date(evento.criado_em).toLocaleDateString('pt-BR');
    if (!acc[data]) {
      acc[data] = [];
    }
    acc[data].push(evento);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-600" />
          📅 Atualizações do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Linha vertical da timeline */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200"></div>

          <div className="space-y-6">
            {Object.entries(eventosPorData).map(([data, eventosData]) => (
              <div key={data}>
                {/* Marcador de data */}
                <div className="relative flex items-center mb-4">
                  <div className="absolute left-3.5 w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow"></div>
                  <span className="ml-12 text-sm font-normal text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                    {data}
                  </span>
                </div>

                {/* Eventos do dia */}
                <div className="space-y-4 ml-12">
                  {eventosData.map((evento) => {
                    const config = getConfig(evento.tipo);
                    const Icon = config.icon;
                    const nucleoConfig = evento.nucleo ? NUCLEO_CONFIG[evento.nucleo] : null;

                    return (
                      <div
                        key={evento.id}
                        className={`relative p-4 rounded-xl border-2 transition-all hover:shadow-md ${
                          evento.destaque
                            ? 'bg-gradient-to-r from-amber-50 to-yellow-50 border-amber-200'
                            : `${config.bgColor} border-transparent`
                        }`}
                      >
                        {/* Ícone de destaque */}
                        {evento.destaque && (
                          <div className="absolute -top-2 -right-2">
                            <WGStarIcon className="w-5 h-5 text-amber-500 fill-amber-400" />
                          </div>
                        )}

                        <div className="flex items-start gap-3">
                          {/* Ícone do tipo */}
                          <div className={`p-2 rounded-lg ${config.bgColor}`}>
                            <Icon className={`w-5 h-5 ${config.color}`} />
                          </div>

                          <div className="flex-1 min-w-0">
                            {/* Cabeçalho */}
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h4 className="font-normal text-gray-900">{evento.titulo}</h4>
                                {nucleoConfig && (
                                  <Badge className={`text-xs mt-1 ${nucleoConfig.color}`}>
                                    {nucleoConfig.label}
                                  </Badge>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {formatarData(evento.criado_em)}
                              </span>
                            </div>

                            {/* DescriçÍo */}
                            {evento.descricao && (
                              <p className="text-sm text-gray-600 mt-2">{evento.descricao}</p>
                            )}

                            {/* Arquivo/Foto */}
                            {evento.arquivo_url && (
                              <div className="mt-3">
                                {evento.arquivo_tipo?.startsWith('image/') ? (
                                  <img
                                    src={evento.arquivo_url}
                                    alt="Imagem do evento"
                                    className="max-w-xs rounded-lg border shadow-sm"
                                  />
                                ) : (
                                  <a
                                    href={evento.arquivo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm"
                                  >
                                    <FileText className="w-4 h-4" />
                                    Ver documento
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mensagem final */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            Mostrando as últimas {eventos.length} atualizações
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

