// src/components/cliente/AlertasCliente.tsx
// Sistema de alertas e notificações para área do cliente
// Mostra notificações sobre o projeto, pagamentos, etapas, etc.

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  CreditCard,
  Calendar,
  FileText,
  MessageSquare,
  X,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';

export interface Alerta {
  id: string;
  tipo: 'info' | 'sucesso' | 'alerta' | 'urgente';
  categoria: 'pagamento' | 'etapa' | 'documento' | 'comunicacao' | 'sistema';
  titulo: string;
  mensagem: string;
  data: string;
  lido: boolean;
  link?: string;
}

interface AlertasClienteProps {
  clienteId: string;
  contratoId?: string;
  limite?: number;
  onVerTodos?: () => void;
}

const TIPO_STYLES = {
  info: {
    bg: 'bg-blue-50 border-blue-200',
    icon: Info,
    iconColor: 'text-blue-500',
  },
  sucesso: {
    bg: 'bg-green-50 border-green-200',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
  },
  alerta: {
    bg: 'bg-amber-50 border-amber-200',
    icon: AlertTriangle,
    iconColor: 'text-amber-500',
  },
  urgente: {
    bg: 'bg-red-50 border-red-200',
    icon: AlertTriangle,
    iconColor: 'text-red-500',
  },
};

const CATEGORIA_ICONS = {
  pagamento: CreditCard,
  etapa: Calendar,
  documento: FileText,
  comunicacao: MessageSquare,
  sistema: Bell,
};

export default function AlertasCliente({
  clienteId,
  contratoId,
  limite = 5,
  onVerTodos,
}: AlertasClienteProps) {
  const [loading, setLoading] = useState(true);
  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [contadorNaoLidos, setContadorNaoLidos] = useState(0);

  const carregarAlertas = useCallback(async () => {
    type Parcela = { id: string; numero: number; valor: number; vencimento: string; pago: boolean };
    type ChecklistItem = { concluido: boolean };
    type ChecklistDto = { id: string; titulo: string; updated_at: string; checklist_itens?: ChecklistItem[] | null };
    type Notificacao = { id: string; titulo: string; mensagem?: string | null; created_at: string; lida?: boolean | null };

    try {
      setLoading(true);
      const alertasCarregados: Alerta[] = [];

      // 1. Buscar parcelas atrasadas ou próximas do vencimento
      if (contratoId) {
        const { data: parcelas } = await supabase
          .from('contrato_parcelas')
          .select('id, numero, valor, vencimento, pago')
          .eq('contrato_id', contratoId)
          .eq('pago', false)
          .eq('cancelado', false)
          .order('vencimento', { ascending: true });

        (parcelas || []).forEach((parcela: Parcela) => {
          const vencimento = new Date(parcela.vencimento);
          const hoje = new Date();
          const diasAteVencimento = Math.ceil(
            (vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (diasAteVencimento < 0) {
            // Parcela atrasada
            alertasCarregados.push({
              id: `parcela-atrasada-${parcela.id}`,
              tipo: 'urgente',
              categoria: 'pagamento',
              titulo: `Parcela ${parcela.numero} em atraso`,
              mensagem: `A parcela de R$ ${parcela.valor.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })} venceu há ${Math.abs(diasAteVencimento)} dias.`,
              data: parcela.vencimento,
              lido: false,
              link: '/wgx/financeiro',
            });
          } else if (diasAteVencimento <= 7) {
            // Parcela próxima do vencimento
            alertasCarregados.push({
              id: `parcela-proxima-${parcela.id}`,
              tipo: 'alerta',
              categoria: 'pagamento',
              titulo: `Parcela ${parcela.numero} vence em breve`,
              mensagem: `Vencimento em ${diasAteVencimento} ${
                diasAteVencimento === 1 ? 'dia' : 'dias'
              } - R$ ${parcela.valor.toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}`,
              data: parcela.vencimento,
              lido: false,
              link: '/wgx/financeiro',
            });
          }
        });
      }

      // 2. Buscar etapas concluídas recentemente
      if (contratoId) {
        const { data: checklists } = await supabase
          .from('checklists')
          .select(`
            id,
            titulo,
            updated_at,
            checklist_itens (id, concluido)
          `)
          .eq('vinculo_id', contratoId)
          .eq('vinculo_tipo', 'contrato')
          .gte(
            'updated_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          );

        (checklists || []).forEach((cl: ChecklistDto) => {
          const itens = cl.checklist_itens || [];
          const total = itens.length;
          const concluidos = itens.filter((i: ChecklistItem) => i.concluido).length;

          if (total > 0 && total === concluidos) {
            alertasCarregados.push({
              id: `etapa-concluida-${cl.id}`,
              tipo: 'sucesso',
              categoria: 'etapa',
              titulo: `Etapa "${cl.titulo}" concluída`,
              mensagem: 'Parabéns! Mais uma etapa do seu projeto foi finalizada.',
              data: cl.updated_at,
              lido: false,
              link: '/wgx/cronograma',
            });
          }
        });
      }

      // 3. Buscar notificações do sistema para o cliente
      try {
        const { data: notificacoes } = await supabase
          .from('notificacoes_sistema')
          .select('id, titulo, mensagem, created_at, lida')
          .eq('destinatario_id', clienteId)
          .gte(
            'created_at',
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
          )
          .order('created_at', { ascending: false })
          .limit(5);

        (notificacoes || []).forEach((notif: Notificacao) => {
          alertasCarregados.push({
            id: `notif-${notif.id}`,
            tipo: 'info',
            categoria: 'comunicacao',
            titulo: notif.titulo,
            mensagem: notif.mensagem || 'AtualizaçÍo no seu projeto.',
            data: notif.created_at,
            lido: notif.lida || false,
          });
        });
    } catch {
        // Tabela pode não existir - ignorar silenciosamente
        console.log('Notificações não disponíveis');
      }

      // Ordenar por data (mais recente primeiro) e tipo de urgência
      alertasCarregados.sort((a, b) => {
        // Primeiro por tipo (urgente primeiro)
        const prioridade = { urgente: 0, alerta: 1, sucesso: 2, info: 3 };
        if (prioridade[a.tipo] !== prioridade[b.tipo]) {
          return prioridade[a.tipo] - prioridade[b.tipo];
        }
        // Depois por data
        return new Date(b.data).getTime() - new Date(a.data).getTime();
      });

      setAlertas(alertasCarregados.slice(0, limite));
      setContadorNaoLidos(alertasCarregados.filter((a) => !a.lido).length);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  }, [clienteId, contratoId, limite]);

  useEffect(() => {
    carregarAlertas();
  }, [carregarAlertas]);

  function marcarComoLido(id: string) {
    setAlertas((prev) =>
      prev.map((a) => (a.id === id ? { ...a, lido: true } : a))
    );
    setContadorNaoLidos((prev) => Math.max(0, prev - 1));
  }

  function formatarTempoRelativo(data: string) {
    return formatDistanceToNow(new Date(data), {
      addSuffix: true,
      locale: ptBR,
    });
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-32 bg-gray-200 rounded"></div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="p-2 rounded-xl bg-orange-100">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            {contadorNaoLidos > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs font-normal rounded-full flex items-center justify-center">
                {contadorNaoLidos > 9 ? '9+' : contadorNaoLidos}
              </span>
            )}
          </div>
          <div>
            <h3 className="font-normal text-gray-900">Notificações</h3>
            <p className="text-xs text-gray-500">
              {contadorNaoLidos > 0
                ? `${contadorNaoLidos} ${
                    contadorNaoLidos === 1 ? 'nova' : 'novas'
                  }`
                : 'Tudo em dia'}
            </p>
          </div>
        </div>
        {onVerTodos && alertas.length > 0 && (
          <button
            onClick={onVerTodos}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1"
          >
            Ver todas
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Lista de Alertas */}
      {alertas.length === 0 ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-8 h-8 text-green-500" />
          </div>
          <p className="text-gray-600 font-medium">Tudo em ordem!</p>
          <p className="text-sm text-gray-500 mt-1">
            Você não tem notificações pendentes.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {alertas.map((alerta) => {
            const tipoStyle = TIPO_STYLES[alerta.tipo];
            const TipoIcon = tipoStyle.icon;
            const CategoriaIcon = CATEGORIA_ICONS[alerta.categoria];

            return (
              <div
                key={alerta.id}
                className={`relative p-4 transition-colors ${
                  alerta.lido ? 'bg-white' : 'bg-gray-50'
                } hover:bg-gray-50`}
              >
                {/* Indicador de não lido */}
                {!alerta.lido && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 rounded-r-full" />
                )}

                <div className="flex items-start gap-3">
                  {/* Ícone */}
                  <div
                    className={`p-2 rounded-xl ${tipoStyle.bg} border flex-shrink-0`}
                  >
                    <TipoIcon className={`w-4 h-4 ${tipoStyle.iconColor}`} />
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p
                        className={`font-medium ${
                          alerta.lido ? 'text-gray-600' : 'text-gray-900'
                        }`}
                      >
                        {alerta.titulo}
                      </p>
                      <CategoriaIcon className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">
                      {alerta.mensagem}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {formatarTempoRelativo(alerta.data)}
                    </p>
                  </div>

                  {/* Ações */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {alerta.link && (
                      <a
                        href={alerta.link}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </a>
                    )}
                    {!alerta.lido && (
                      <button
                        onClick={() => marcarComoLido(alerta.id)}
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                        title="Marcar como lido"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


