// src/components/cliente/AtividadesNucleo.tsx
// Componente que mostra atividades e atualizacoes por nucleo contratado
// Exibe comentarios, tarefas em andamento e checklists por area

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Hammer,
  Paintbrush,
  FileCheck,
  CheckCircle2,
  Clock,
  MessageSquare,
  ClipboardList,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  Activity,
  Loader2,
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type RpcComentario = {
  id: string;
  comentario: string;
  usuario_nome: string;
  created_at: string;
  task_titulo?: string | null;
};

type RpcTarefa = {
  id: string;
  titulo: string;
  status?: string | null;
  prioridade?: string | null;
  data_termino?: string | null;
  progresso?: number | null;
};

type RpcChecklistItem = {
  id: string;
  texto?: string | null;
  secao?: string | null;
  concluido: boolean;
  checklist_titulo?: string | null;
};

type RpcNucleoItem = {
  nucleo?: string | null;
  contrato_id: string;
  contrato_numero?: string | null;
  comentarios?: RpcComentario[] | null;
  tarefas?: RpcTarefa[] | null;
  checklist_itens?: RpcChecklistItem[] | null;
  total_tarefas?: number | null;
  tarefas_concluidas?: number | null;
  total_checklist?: number | null;
  checklist_concluidos?: number | null;
};

type ContratoRow = {
  id: string;
  numero?: string | null;
  unidade_negocio?: string | null;
  nucleo_id?: string | null;
  nucleos?: { nome?: string | null } | null;
};

type ProjetoRow = { id: string };
type TarefaRow = {
  id: string;
  titulo: string;
  status?: string | null;
  prioridade?: string | null;
  data_termino?: string | null;
  progresso?: number | null;
};

type ChecklistItemRow = {
  id: string;
  texto?: string | null;
  secao?: string | null;
  concluido: boolean;
};

type ChecklistRow = {
  id: string;
  titulo: string;
  checklist_itens?: ChecklistItemRow[] | null;
};

interface AtividadesNucleoProps {
  clienteId: string;
  dadosNucleos?: RpcNucleoItem[]; // Dados já carregados via RPC (opcional)
}

// Cores por nucleo
const NUCLEO_COLORS: Record<string, { bg: string; text: string; border: string; icon: string; gradient: string }> = {
  arquitetura: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'bg-violet-500',
    gradient: 'from-violet-500 to-purple-600',
  },
  engenharia: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'bg-blue-500',
    gradient: 'from-blue-500 to-cyan-600',
  },
  marcenaria: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'bg-amber-500',
    gradient: 'from-amber-500 to-orange-600',
  },
};

type IconComponent = typeof Building2;
const NUCLEO_ICONS: Record<string, IconComponent> = {
  arquitetura: Building2,
  engenharia: Hammer,
  marcenaria: Paintbrush,
};

const NUCLEO_LABELS: Record<string, string> = {
  arquitetura: 'Arquitetura',
  engenharia: 'Engenharia',
  marcenaria: 'Marcenaria',
};

interface Comentario {
  id: string;
  comentario: string;
  usuario_nome: string;
  created_at: string;
  task_titulo?: string;
}

interface Tarefa {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
  data_termino?: string;
  progresso: number;
}

interface ChecklistItem {
  id: string;
  texto: string;
  secao?: string;
  concluido: boolean;
  checklist_titulo: string;
}

interface NucleoData {
  nucleo: string;
  contratoId: string;
  contratoNumero?: string;
  comentarios: Comentario[];
  tarefas: Tarefa[];
  checklistItens: ChecklistItem[];
  totalTarefas: number;
  tarefasConcluidas: number;
  totalChecklistItens: number;
  checklistConcluidos: number;
}

export default function AtividadesNucleo({ clienteId, dadosNucleos }: AtividadesNucleoProps) {
  const [loading, setLoading] = useState(true);
  const [nucleosData, setNucleosData] = useState<NucleoData[]>([]);
  const [expandedNucleos, setExpandedNucleos] = useState<Set<string>>(new Set());

  // Processar dados vindos do RPC
  const processarDadosRPC = useCallback((dados: RpcNucleoItem[]) => {
    const nucleosDataArray: NucleoData[] = dados.map((item) => ({
      nucleo: item.nucleo?.toLowerCase() || 'geral',
      contratoId: item.contrato_id,
      contratoNumero: item.contrato_numero || undefined,
      comentarios: (item.comentarios || []).map((c) => ({
        id: c.id,
        comentario: c.comentario,
        usuario_nome: c.usuario_nome,
        created_at: c.created_at,
        task_titulo: c.task_titulo || undefined,
      })),
      tarefas: (item.tarefas || []).map((t) => ({
        id: t.id,
        titulo: t.titulo,
        status: t.status || 'pendente',
        prioridade: t.prioridade || 'media',
        data_termino: t.data_termino || undefined,
        progresso: t.progresso || 0,
      })),
      checklistItens: (item.checklist_itens || []).map((ci) => ({
        id: ci.id,
        texto: ci.texto || '',
        secao: ci.secao || undefined,
        concluido: ci.concluido,
        checklist_titulo: ci.checklist_titulo || 'Checklist',
      })),
      totalTarefas: item.total_tarefas || 0,
      tarefasConcluidas: item.tarefas_concluidas || 0,
      totalChecklistItens: item.total_checklist || 0,
      checklistConcluidos: item.checklist_concluidos || 0,
    }));

    setNucleosData(nucleosDataArray);
    setLoading(false);
  }, []);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      // Tentar usar RPC primeiro
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('buscar_dados_area_cliente', { p_cliente_id: clienteId });

      if (!rpcError && rpcData?.nucleos_atividades) {
        processarDadosRPC(rpcData.nucleos_atividades);
        return;
      }

      console.log('RPC não disponível para atividades, tentando query direta...');

      // Fallback: queries diretas
      // 1. Buscar contratos do cliente com nucleo (usando unidade_negocio + fallback para nucleos)
      const { data: contratos, error: errorContratos } = await supabase
        .from('contratos')
        .select(`
          id,
          numero,
          unidade_negocio,
          nucleo_id,
          nucleos (id, nome)
        `)
        .eq('cliente_id', clienteId)
        .not('status', 'in', '(rascunho,concluido,cancelado)');

      if (errorContratos) throw errorContratos;
      if (!contratos || contratos.length === 0) {
        setNucleosData([]);
        return;
      }

      const nucleosDataArray: NucleoData[] = [];

      for (const contrato of (contratos as ContratoRow[])) {
        // Priorizar unidade_negocio (campo moderno), depois nucleos.nome (legado), depois 'geral'
        const nucleoNome = contrato.unidade_negocio?.toLowerCase()
          || contrato.nucleos?.nome?.toLowerCase()
          || 'geral';

        // 2. Buscar projetos vinculados ao contrato
        const { data: projetos } = await supabase
          .from('projetos')
          .select('id')
          .eq('contrato_id', contrato.id);

        const projectIds = (projetos as ProjetoRow[] | null)?.map((p) => p.id) || [];

        // 3. Buscar comentarios das tasks dos projetos
        let comentarios: Comentario[] = [];
        if (projectIds.length > 0) {
          const { data: tasks } = await supabase
            .from('cronograma_tarefas')
            .select('id, titulo')
            .in('projeto_id', projectIds);

          const taskIds = tasks?.map(t => t.id) || [];
          const taskMap = new Map(tasks?.map(t => [t.id, t.titulo]) || []);

          if (taskIds.length > 0) {
            const { data: comentariosData } = await supabase
              .from('project_tasks_comentarios')
              .select('id, comentario, usuario_nome, created_at, task_id')
              .in('task_id', taskIds)
              .order('created_at', { ascending: false })
              .limit(10);

            comentarios = (comentariosData || []).map((c) => ({
              id: c.id,
              comentario: c.comentario,
              usuario_nome: c.usuario_nome,
              created_at: c.created_at,
              task_titulo: taskMap.get(c.task_id),
            }));
          }
        }

        // 4. Buscar tarefas em andamento dos projetos
        let tarefas: Tarefa[] = [];
        let totalTarefas = 0;
        let tarefasConcluidas = 0;
        if (projectIds.length > 0) {
          const { data: tarefasData } = await supabase
            .from('project_tasks')
            .select('id, titulo, status, prioridade, data_termino, progresso', { count: 'exact' })
            .in('project_id', projectIds)
            .in('status', ['pendente', 'em_andamento', 'em_revisao'])
            .order('prioridade', { ascending: false })
            .limit(10);

          tarefas = (tarefasData as TarefaRow[] | null)?.map((t) => ({
            id: t.id,
            titulo: t.titulo,
            status: t.status || 'pendente',
            prioridade: t.prioridade || 'media',
            data_termino: t.data_termino || undefined,
            progresso: t.progresso || 0,
          })) || [];

          // Contar total de tarefas
          const { count: totalCount } = await supabase
            .from('project_tasks')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds);

          const { count: concluidasCount } = await supabase
            .from('project_tasks')
            .select('id', { count: 'exact', head: true })
            .in('project_id', projectIds)
            .eq('status', 'concluida');

          totalTarefas = totalCount || 0;
          tarefasConcluidas = concluidasCount || 0;
        }

        // 5. Buscar checklists e itens vinculados ao contrato
        const { data: checklists } = await supabase
          .from('checklists')
          .select(`
            id,
            titulo,
            checklist_itens (
              id,
              texto,
              secao,
              concluido
            )
          `)
          .eq('vinculo_id', contrato.id)
          .eq('vinculo_tipo', 'contrato');

        let checklistItens: ChecklistItem[] = [];
        let totalChecklistItens = 0;
        let checklistConcluidos = 0;

        (checklists as ChecklistRow[] | null || []).forEach((cl) => {
          const itens = cl.checklist_itens || [];
          totalChecklistItens += itens.length;
          checklistConcluidos += itens.filter((i) => i.concluido).length;

          // Pegar apenas itens nao concluidos para exibir
          itens
            .filter((i) => !i.concluido)
            .slice(0, 5)
            .forEach((item) => {
              checklistItens.push({
                id: item.id,
                texto: item.texto || '',
                secao: item.secao || undefined,
                concluido: item.concluido,
                checklist_titulo: cl.titulo,
              });
            });
        });

        nucleosDataArray.push({
          nucleo: nucleoNome,
          contratoId: contrato.id,
          contratoNumero: contrato.numero || undefined,
          comentarios,
          tarefas,
          checklistItens: checklistItens.slice(0, 10),
          totalTarefas,
          tarefasConcluidas,
          totalChecklistItens,
          checklistConcluidos,
        });
      }

      // Ordenar por nucleo (Arquitetura, Engenharia, Marcenaria)
      const ordem = ['arquitetura', 'engenharia', 'marcenaria'];
      nucleosDataArray.sort((a, b) => {
        const indexA = ordem.indexOf(a.nucleo);
        const indexB = ordem.indexOf(b.nucleo);
        if (indexA === -1 && indexB === -1) return 0;
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
      });

      setNucleosData(nucleosDataArray);

      // Expandir primeiro nucleo por padrao
      if (nucleosDataArray.length > 0) {
        setExpandedNucleos(new Set([nucleosDataArray[0].nucleo]));
      }
    } catch (error) {
      console.error('Erro ao carregar atividades por nucleo:', error);
    } finally {
      setLoading(false);
    }
  }, [clienteId, processarDadosRPC]);

  useEffect(() => {
    // Se já recebeu dados via props, usar diretamente
    if (dadosNucleos && dadosNucleos.length > 0) {
      processarDadosRPC(dadosNucleos);
    } else {
      carregarDados();
    }
  }, [carregarDados, dadosNucleos, processarDadosRPC]);

  function toggleNucleo(nucleo: string) {
    setExpandedNucleos(prev => {
      const next = new Set(prev);
      if (next.has(nucleo)) {
        next.delete(nucleo);
      } else {
        next.add(nucleo);
      }
      return next;
    });
  }

  function getColors(nucleo: string) {
    return NUCLEO_COLORS[nucleo] || {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
      icon: 'bg-gray-500',
      gradient: 'from-gray-500 to-gray-600',
    };
  }

  function getIcon(nucleo: string) {
    return NUCLEO_ICONS[nucleo] || FileCheck;
  }

  function getLabel(nucleo: string) {
    return NUCLEO_LABELS[nucleo] || nucleo.charAt(0).toUpperCase() + nucleo.slice(1);
  }

  function formatarData(dataStr: string) {
    const data = parseDataLocal(dataStr);
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  }

  function formatarTempoDecorrido(dataStr: string) {
    const agora = new Date();
    const data = parseDataLocal(dataStr);
    const diffMs = agora.getTime() - data.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) return 'agora';
    if (diffMinutos < 60) return `${diffMinutos}min atras`;
    if (diffHoras < 24) return `${diffHoras}h atras`;
    if (diffDias < 7) return `${diffDias}d atras`;
    return data.toLocaleDateString('pt-BR');
  }

  function parseDataLocal(valor: string) {
    const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoSemHora) {
      const [, ano, mes, dia] = isoSemHora;
      return new Date(Number(ano), Number(mes) - 1, Number(dia));
    }
    return new Date(valor);
  }

  function getStatusBadge(status: string) {
    const statusMap: Record<string, { label: string; className: string }> = {
      pendente: { label: 'Pendente', className: 'bg-yellow-100 text-yellow-700' },
      em_andamento: { label: 'Em Andamento', className: 'bg-blue-100 text-blue-700' },
      em_revisao: { label: 'Em Revisao', className: 'bg-purple-100 text-purple-700' },
      concluida: { label: 'Concluida', className: 'bg-green-100 text-green-700' },
    };
    return statusMap[status] || { label: status, className: 'bg-gray-100 text-gray-700' };
  }

  function getPrioridadeBadge(prioridade: string) {
    const prioridadeMap: Record<string, { label: string; className: string }> = {
      baixa: { label: 'Baixa', className: 'bg-gray-100 text-gray-600' },
      media: { label: 'Media', className: 'bg-blue-100 text-blue-600' },
      alta: { label: 'Alta', className: 'bg-orange-100 text-orange-600' },
      critica: { label: 'Critica', className: 'bg-red-100 text-red-600' },
    };
    return prioridadeMap[prioridade] || { label: prioridade, className: 'bg-gray-100 text-gray-600' };
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            <span className="ml-3 text-gray-600">Carregando atividades...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (nucleosData.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6 text-center py-12">
          <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-600 font-medium">Nenhum contrato ativo encontrado</p>
          <p className="text-sm text-gray-500 mt-1">
            As atividades serao exibidas quando houver contratos vinculados.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-normal text-gray-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-600" />
            Acompanhamento por Nucleo
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Veja comentarios, tarefas e checklists de cada area do seu projeto
          </p>
        </div>
        <div className="flex items-center gap-2">
          {nucleosData.map(nd => {
            const colors = getColors(nd.nucleo);
            const Icon = getIcon(nd.nucleo);
            return (
              <div
                key={nd.nucleo}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${colors.bg} ${colors.text} text-xs font-medium`}
              >
                <Icon className="w-3.5 h-3.5" />
                {getLabel(nd.nucleo)}
              </div>
            );
          })}
        </div>
      </div>

      {/* Cards por Nucleo */}
      <div className="space-y-4">
        {nucleosData.map(nd => {
          const colors = getColors(nd.nucleo);
          const Icon = getIcon(nd.nucleo);
          const isExpanded = expandedNucleos.has(nd.nucleo);
          const progressoTarefas = nd.totalTarefas > 0
            ? Math.round((nd.tarefasConcluidas / nd.totalTarefas) * 100)
            : 0;
          const progressoChecklist = nd.totalChecklistItens > 0
            ? Math.round((nd.checklistConcluidos / nd.totalChecklistItens) * 100)
            : 0;

          return (
            <Card key={nd.nucleo} className={`overflow-hidden border-2 ${colors.border}`}>
              {/* Header do Card - Clicavel para expandir */}
              <button
                onClick={() => toggleNucleo(nd.nucleo)}
                className={`w-full p-5 flex items-center justify-between ${colors.bg} hover:opacity-90 transition cursor-pointer`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colors.icon} flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className={`text-lg font-normal ${colors.text}`}>
                      {getLabel(nd.nucleo)}
                    </h3>
                    {nd.contratoNumero && (
                      <p className="text-xs text-gray-500">Contrato: {nd.contratoNumero}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  {/* Resumo rapido */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <MessageSquare className="w-4 h-4" />
                      <span className="font-medium">{nd.comentarios.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <ClipboardList className="w-4 h-4" />
                      <span className="font-medium">{nd.tarefas.length}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="font-medium">{nd.checklistItens.length}</span>
                    </div>
                  </div>

                  {/* Indicador de progresso geral */}
                  <div className="w-32 hidden md:block">
                    <div className="text-xs text-gray-500 mb-1 text-right">
                      Progresso: {Math.round((progressoTarefas + progressoChecklist) / 2)}%
                    </div>
                    <Progress
                      value={(progressoTarefas + progressoChecklist) / 2}
                      className="h-2"
                    />
                  </div>

                  {isExpanded ? (
                    <ChevronUp className={`w-5 h-5 ${colors.text}`} />
                  ) : (
                    <ChevronDown className={`w-5 h-5 ${colors.text}`} />
                  )}
                </div>
              </button>

              {/* Conteudo Expandido */}
              {isExpanded && (
                <CardContent className="p-0">
                  <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                    {/* Coluna 1: Comentarios/Atualizacoes */}
                    <div className="p-5">
                      <h4 className="text-sm font-normal text-gray-700 mb-3 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        Atualizacoes Recentes
                      </h4>
                      {nd.comentarios.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Nenhuma atualizacao</p>
                        </div>
                      ) : (
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                          {nd.comentarios.map(c => (
                            <div
                              key={c.id}
                              className="p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-gray-100 transition"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <User className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs font-normal text-gray-800 truncate">
                                      {c.usuario_nome}
                                    </span>
                                    <span className="text-[10px] text-gray-400">
                                      {formatarTempoDecorrido(c.created_at)}
                                    </span>
                                  </div>
                                  {c.task_titulo && (
                                    <p className="text-[10px] text-gray-400 truncate mt-0.5">
                                      em: {c.task_titulo}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                    {c.comentario}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Coluna 2: Tarefas em Andamento */}
                    <div className="p-5">
                      <h4 className="text-sm font-normal text-gray-700 mb-3 flex items-center gap-2">
                        <ClipboardList className="w-4 h-4 text-orange-500" />
                        Tarefas em Andamento
                        {nd.totalTarefas > 0 && (
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {nd.tarefasConcluidas}/{nd.totalTarefas}
                          </Badge>
                        )}
                      </h4>
                      {nd.tarefas.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">Nenhuma tarefa em andamento</p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {nd.tarefas.map(t => {
                            const statusInfo = getStatusBadge(t.status);
                            const prioridadeInfo = getPrioridadeBadge(t.prioridade);
                            return (
                              <div
                                key={t.id}
                                className="p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition"
                              >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <p className="text-xs font-medium text-gray-800 line-clamp-2">
                                    {t.titulo}
                                  </p>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap ${prioridadeInfo.className}`}>
                                    {prioridadeInfo.label}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${statusInfo.className}`}>
                                    {statusInfo.label}
                                  </span>
                                  {t.data_termino && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      {formatarData(t.data_termino)}
                                    </span>
                                  )}
                                </div>
                                {t.progresso > 0 && (
                                  <div className="mt-2">
                                    <Progress value={t.progresso} className="h-1.5" />
                                    <span className="text-[10px] text-gray-400">{t.progresso}%</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                      {nd.totalTarefas > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Progresso Geral</span>
                            <span className="font-medium">{progressoTarefas}%</span>
                          </div>
                          <Progress value={progressoTarefas} className="h-2" />
                        </div>
                      )}
                    </div>

                    {/* Coluna 3: Checklist Items */}
                    <div className="p-5">
                      <h4 className="text-sm font-normal text-gray-700 mb-3 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                        Etapas do Projeto
                        {nd.totalChecklistItens > 0 && (
                          <Badge variant="outline" className="ml-auto text-[10px]">
                            {nd.checklistConcluidos}/{nd.totalChecklistItens}
                          </Badge>
                        )}
                      </h4>
                      {nd.checklistItens.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 rounded-xl">
                          <CheckCircle2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-xs text-gray-500">
                            {nd.totalChecklistItens > 0
                              ? 'Todas as etapas concluidas!'
                              : 'Nenhuma etapa cadastrada'}
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                          {nd.checklistItens.map(item => (
                            <div
                              key={item.id}
                              className="p-3 bg-white rounded-xl border border-gray-100 hover:shadow-sm transition"
                            >
                              <div className="flex items-start gap-2">
                                <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                                  {item.concluido ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Clock className="w-3 h-3 text-gray-400" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs ${item.concluido ? 'text-gray-400 line-through' : 'text-gray-700'} line-clamp-2`}>
                                    {item.texto}
                                  </p>
                                  {item.secao && (
                                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                                      {item.secao}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {nd.totalChecklistItens > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                            <span>Conclusao</span>
                            <span className="font-medium">{progressoChecklist}%</span>
                          </div>
                          <Progress value={progressoChecklist} className="h-2" />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}



