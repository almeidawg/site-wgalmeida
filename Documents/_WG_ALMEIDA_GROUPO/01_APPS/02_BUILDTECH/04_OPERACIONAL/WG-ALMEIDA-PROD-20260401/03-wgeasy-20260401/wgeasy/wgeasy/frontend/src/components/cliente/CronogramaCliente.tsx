// src/components/cliente/CronogramaCliente.tsx
// VisualizaçÍo do cronograma do projeto para a área do cliente
// Mostra etapas, marcos e progresso de forma visual

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { formatarData } from '@/lib/utils';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Flag,
  Building2,
  Hammer,
  Paintbrush,
  Package,
  BarChart3,
  List,
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import GanttCronograma from './GanttCronograma';
import ContratacoesClienteBloco from './ContratacoesClienteBloco';

interface CronogramaClienteProps {
  clienteId: string;
  contratoId?: string;
  onProgressChange?: (progresso: number) => void;
  onResumoChange?: (resumo: { total: number; pendentes: number; concluidas: number }) => void;
}

interface EtapaCronograma {
  id: string;
  titulo: string;
  descricao?: string;
  nucleo?: string;
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  dataInicio?: string;
  dataFim?: string;
  dataConclusao?: string;
  progresso: number;
  subitens: {
    id: string;
    titulo: string;
    concluido: boolean;
    dataLimite?: string;
  }[];
}

type IconComponent = typeof Building2;
const NUCLEO_ICONS: Record<string, IconComponent> = {
  arquitetura: Building2,
  engenharia: Hammer,
  marcenaria: Paintbrush,
  interiores: Paintbrush,
  default: Package,
};

const NUCLEO_COLORS: Record<string, string> = {
  arquitetura: 'bg-blue-500',
  engenharia: 'bg-orange-500',
  marcenaria: 'bg-amber-500',
  interiores: 'bg-pink-500',
  default: 'bg-gray-500',
};

type TabView = 'timeline' | 'gantt';

export default function CronogramaCliente({ clienteId, contratoId, onProgressChange, onResumoChange }: CronogramaClienteProps) {
  const [loading, setLoading] = useState(true);
  const [etapas, setEtapas] = useState<EtapaCronograma[]>([]);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [totais, setTotais] = useState({ total: 0, concluidas: 0, emAndamento: 0 });
  const [activeTab, setActiveTab] = useState<TabView>('gantt');
  const [tabLoading, setTabLoading] = useState(false);

  const carregarCronograma = useCallback(async () => {
    try {
      setLoading(true);

      // 1. Encontrar contratos do cliente
      let contratoIds: string[] = [];
      if (contratoId) {
        contratoIds = [contratoId];
      } else {
        const { data: contratos } = await supabase
          .from('contratos')
          .select('id')
          .eq('cliente_id', clienteId);
        contratoIds = (contratos || []).map(c => c.id);
      }

      // 2. Encontrar projetos (mesma lógica do módulo cronograma principal)
      let projetoIds: string[] = [];
      if (contratoIds.length > 0) {
        const { data: projetosContrato } = await supabase
          .from("projetos")
          .select("id")
          .in("contrato_id", contratoIds);
        projetoIds = (projetosContrato || []).map((p: any) => p.id);
      }
      if (projetoIds.length === 0) {
        const { data: projetosCliente } = await supabase
          .from("projetos")
          .select("id")
          .eq("cliente_id", clienteId);
        projetoIds = (projetosCliente || []).map((p: any) => p.id);
      }

      // 3. Buscar tarefas do cronograma (fonte canônica - mesma usada em ProjectDetailPage)
      let etapasFinais: EtapaCronograma[] = [];

      if (projetoIds.length > 0) {
        const { data: tarefasCronograma } = await supabase
          .from("cronograma_tarefas")
          .select("id, titulo, descricao, nucleo, status, progresso, data_inicio, data_termino")
          .in("projeto_id", projetoIds)
          .order("ordem", { ascending: true });

        etapasFinais = (tarefasCronograma || []).map((t: any) => {
          const progresso = Number(t.progresso || 0);
          let status: EtapaCronograma["status"] = "pendente";
          const statusDb = String(t.status || "").toLowerCase();
          if (statusDb === "concluido" || progresso >= 100) {
            status = "concluido";
          } else if (statusDb === "atrasado") {
            status = "atrasado";
          } else if (progresso > 0 || statusDb === "em_andamento") {
            status = "em_andamento";
          }

          return {
            id: t.id,
            titulo: t.titulo || "Tarefa",
            descricao: t.descricao || undefined,
            nucleo: String(t.nucleo || "default").toLowerCase(),
            status,
            dataInicio: t.data_inicio || undefined,
            dataFim: t.data_termino || undefined,
            progresso,
            subitens: [],
          };
        });
      }

      // 4. Fallback: se não há tarefas de cronograma, usar checklists
      if (etapasFinais.length === 0) {
        // Checklists vinculados ao contrato/cliente
        let checklistQuery = supabase
          .from('checklists')
          .select(`
            id, titulo, nucleo_id, data_inicio, data_fim,
            nucleos (nome),
            checklist_itens (id, texto, concluido, data_limite, ordem)
          `)
          .order('criado_em', { ascending: true });

        if (contratoIds.length > 0) {
          const csv = contratoIds.join(',');
          checklistQuery = checklistQuery.or(
            `and(vinculo_tipo.eq.contrato,vinculo_id.in.(${csv})),and(vinculo_tipo.eq.cliente,vinculo_id.eq.${clienteId})`
          );
        } else {
          checklistQuery = checklistQuery.eq('vinculo_tipo', 'cliente').eq('vinculo_id', clienteId);
        }

        const { data: checklists } = await checklistQuery;

        etapasFinais = (checklists || []).map((cl: any) => {
          const nucleo = cl.nucleos
            ? (Array.isArray(cl.nucleos) ? cl.nucleos[0] : cl.nucleos)
            : null;
          const itens = cl.checklist_itens || [];
          const totalItens = itens.length;
          const concluidos = itens.filter((i: any) => i.concluido).length;
          const progresso = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

          let status: EtapaCronograma['status'] = 'pendente';
          if (progresso === 100) status = 'concluido';
          else if (progresso > 0) status = 'em_andamento';
          if (cl.data_fim && new Date(cl.data_fim) < new Date() && status !== 'concluido') {
            status = 'atrasado';
          }

          return {
            id: cl.id,
            titulo: cl.titulo,
            nucleo: nucleo?.nome?.toLowerCase() || 'default',
            status,
            dataInicio: cl.data_inicio || undefined,
            dataFim: cl.data_fim || undefined,
            progresso,
            subitens: (itens as any[])
              .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
              .map((item) => ({
                id: item.id,
                titulo: item.texto || 'Item pendente',
                concluido: item.concluido,
                dataLimite: item.data_limite || undefined,
              })),
          };
        });
      }

      // 5. Calcular totais
      const totalCount = etapasFinais.length;
      const concluidasCount = etapasFinais.filter(e => e.status === 'concluido').length;
      setEtapas(etapasFinais);
      setTotais({
        total: totalCount,
        concluidas: concluidasCount,
        emAndamento: etapasFinais.filter(e => e.status === 'em_andamento').length,
      });

      // Reportar progresso ao pai
      if (onProgressChange) {
        const pct = totalCount > 0 ? Math.round((concluidasCount / totalCount) * 100) : 0;
        onProgressChange(pct);
      }
      onResumoChange?.({
        total: totalCount,
        concluidas: concluidasCount,
        pendentes: Math.max(0, totalCount - concluidasCount),
      });

    } catch (error) {
      console.error('Erro ao carregar cronograma:', error);
      onProgressChange?.(0);
      onResumoChange?.({ total: 0, concluidas: 0, pendentes: 0 });
    } finally {
      setLoading(false);
    }
  }, [clienteId, contratoId, onProgressChange, onResumoChange]);

  useEffect(() => {
    carregarCronograma();
  }, [carregarCronograma]);

  useEffect(() => {
    if (!tabLoading) return;
    const timeout = setTimeout(() => setTabLoading(false), 250);
    return () => clearTimeout(timeout);
  }, [tabLoading]);

  function formatarDataCurta(data?: string) {
    if (!data) return '-';
    return formatarData(data, 'medio');
  }

  function getStatusConfig(status: EtapaCronograma['status']) {
    switch (status) {
      case 'concluido':
        return {
          label: 'Concluído',
          color: 'text-green-600 bg-green-50 border-green-200',
          icon: CheckCircle2,
        };
      case 'em_andamento':
        return {
          label: 'Em Andamento',
          color: 'text-blue-600 bg-blue-50 border-blue-200',
          icon: Clock,
        };
      case 'atrasado':
        return {
          label: 'Atrasado',
          color: 'text-red-600 bg-red-50 border-red-200',
          icon: AlertCircle,
        };
      default:
        return {
          label: 'Pendente',
          color: 'text-gray-600 bg-gray-50 border-gray-200',
          icon: Clock,
        };
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Mostrar modelo mesmo sem etapas (com valores zerados)
  const etapasExibir = etapas.length > 0 ? etapas : [];
  const totaisExibir = {
    total: totais.total || 0,
    concluidas: totais.concluidas || 0,
    emAndamento: totais.emAndamento || 0,
  };

  const progressoGeral = totaisExibir.total > 0
    ? Math.round((totaisExibir.concluidas / totaisExibir.total) * 100)
    : 0;

  return (
    <div className="space-y-4">
      <ContratacoesClienteBloco contratoId={contratoId} clienteId={clienteId} />

      {/* Header com Progresso Geral */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0f172a] via-[#1f2937] to-[#111827] text-white p-5 shadow-sm overflow-hidden relative">
        <div className="absolute inset-0 opacity-[0.07]">
          <div className="absolute top-0 right-0 w-56 h-56 bg-orange-500 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="rounded-lg bg-white/[0.08] p-1.5">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-[13px]">Cronograma do Projeto</h3>
                <p className="text-[10px] text-white/50">Acompanhe cada etapa da sua obra</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl">{progressoGeral}%</div>
              <div className="text-[10px] text-white/50 uppercase tracking-[0.2em]">Progresso</div>
            </div>
          </div>

          <div className="h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f97316] to-[#fb7185] transition-all duration-500"
              style={{ width: `${progressoGeral}%` }}
            />
          </div>

          <div className="flex gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
              <span>{totaisExibir.concluidas} concluídas</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <div className="w-2 h-2 rounded-full bg-blue-400"></div>
              <span>{totaisExibir.emAndamento} em andamento</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/60">
              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
              <span>{Math.max(0, totaisExibir.total - totaisExibir.concluidas - totaisExibir.emAndamento)} pendentes</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de VisualizaçÍo */}
      <div className="flex gap-1 bg-gray-50 p-0.5 rounded-lg">
        <button
          onClick={() => {
            if (activeTab === 'timeline') return;
            setTabLoading(true);
            setActiveTab('timeline');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
            activeTab === 'timeline'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Timeline
        </button>
        <button
          onClick={() => {
            if (activeTab === 'gantt') return;
            setTabLoading(true);
            setActiveTab('gantt');
          }}
          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] transition-all ${
            activeTab === 'gantt'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          Gantt
        </button>
      </div>

      {/* Conteúdo baseado na tab ativa */}
      {tabLoading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-48 bg-gray-200 rounded"></div>
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      ) : activeTab === 'gantt' ? (
        <GanttCronograma
          etapas={etapasExibir.map((e) => ({
            id: e.id,
            titulo: e.titulo,
            nucleo: e.nucleo,
            status: e.status,
            dataInicio: e.dataInicio,
            dataFim: e.dataFim,
            progresso: e.progresso,
          }))}
          onDurationChange={async (etapaId, novaDataInicio, novaDataFim) => {
            try {
              await supabase
                .from("cronograma_tarefas")
                .update({ data_inicio: novaDataInicio, data_termino: novaDataFim })
                .eq("id", etapaId);
              // Atualizar estado local
              setEtapas(prev => prev.map(e =>
                e.id === etapaId ? { ...e, dataInicio: novaDataInicio, dataFim: novaDataFim } : e
              ));
            } catch (err) {
              console.error("Erro ao atualizar duraçÍo:", err);
            }
          }}
        />
      ) : (
        /* Timeline de Etapas */
        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {etapasExibir.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-[12px] text-gray-400">Nenhuma etapa cadastrada ainda</p>
              <p className="text-[11px] text-gray-300 mt-1">As etapas do seu projeto serÍo exibidas aqui</p>
            </div>
          ) : null}
          {etapasExibir.map((etapa, index) => {
            const statusConfig = getStatusConfig(etapa.status);
            const StatusIcon = statusConfig.icon;
            const NucleoIcon = NUCLEO_ICONS[etapa.nucleo || 'default'] || NUCLEO_ICONS.default;
            const nucleoColor = NUCLEO_COLORS[etapa.nucleo || 'default'] || NUCLEO_COLORS.default;
            const isExpanded = expandido === etapa.id;

            return (
              <div key={etapa.id} className="relative">
                {/* Linha de conexÍo vertical */}
                {index < etapasExibir.length - 1 && (
                  <div className="absolute left-8 top-16 bottom-0 w-0.5 bg-gray-200" />
                )}

                <button
                  type="button"
                  onClick={() => setExpandido(isExpanded ? null : etapa.id)}
                  className="w-full p-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-start gap-4">
                    {/* Indicador de Status */}
                    <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      etapa.status === 'concluido' ? 'bg-green-500' :
                      etapa.status === 'em_andamento' ? 'bg-blue-500' :
                      etapa.status === 'atrasado' ? 'bg-red-500' : 'bg-gray-200'
                    }`}>
                      {etapa.status === 'concluido' ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <span className="text-white text-[11px]">{index + 1}</span>
                      )}
                    </div>

                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-[13px] text-gray-900 truncate">{etapa.titulo.replace(/@\w+/g, '').replace(/\s{2,}/g, ' ').trim()}</h4>
                        <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] ${statusConfig.color}`}>
                          <StatusIcon className="w-2.5 h-2.5" />
                          {statusConfig.label}
                        </span>
                      </div>

                      {etapa.descricao && (
                        <p className="text-[11px] text-gray-400 truncate mb-1">{etapa.descricao}</p>
                      )}

                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        <div className="flex items-center gap-1">
                          <div className={`w-4 h-4 rounded ${nucleoColor} flex items-center justify-center`}>
                            <NucleoIcon className="w-2.5 h-2.5 text-white" />
                          </div>
                          <span className="capitalize">{etapa.nucleo || 'Geral'}</span>
                        </div>
                        {etapa.dataInicio && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" />
                            {formatarDataCurta(etapa.dataInicio)} - {formatarDataCurta(etapa.dataFim)}
                          </div>
                        )}
                        {etapa.subitens.length > 0 && (
                          <div className="flex items-center gap-1">
                            <Flag className="w-2.5 h-2.5" />
                            {etapa.subitens.filter(s => s.concluido).length}/{etapa.subitens.length}
                          </div>
                        )}
                      </div>

                      {/* Mini barra de progresso */}
                      <div className="mt-1.5">
                        <Progress value={etapa.progresso} className="h-1" />
                      </div>
                    </div>

                    {/* Chevron */}
                    <div className="flex items-center">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-300" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                      )}
                    </div>
                  </div>
                </button>

                {/* Subitens expandidos */}
                {isExpanded && etapa.subitens.length > 0 && (
                  <div className="px-4 pb-4 ml-14 space-y-2">
                    {etapa.subitens.map((subitem) => (
                      <div
                        key={subitem.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          subitem.concluido ? 'bg-green-50' : 'bg-gray-50'
                        }`}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          subitem.concluido ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          {subitem.concluido ? (
                            <CheckCircle2 className="w-4 h-4 text-white" />
                          ) : (
                            <Clock className="w-4 h-4 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm ${subitem.concluido ? 'text-green-700 line-through' : 'text-gray-700'}`}>
                            {subitem.titulo}
                          </p>
                        </div>
                        {subitem.dataLimite && (
                          <span className="text-xs text-gray-500">
                            {formatarDataCurta(subitem.dataLimite)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )}
    </div>
  );
}


