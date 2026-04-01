/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/CronogramaClientePage.tsx
// Página de cronograma com calendário visual para área do cliente

import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { usePermissoesCliente } from '@/hooks/usePermissoesUsuario';
import { useImpersonation } from '@/hooks/useImpersonation';
import ImpersonationBar from '@/components/ui/ImpersonationBar';
import CalendarioCliente, { EventoCalendario } from '@/components/cliente/CalendarioCliente';
import CronogramaCliente from '@/components/cliente/CronogramaCliente';
import {
  ArrowLeft,
  Calendar,
  List,
  LayoutGrid,
  BarChart3,
} from 'lucide-react';

type ViewMode = 'calendario' | 'timeline' | 'gantt';

export default function CronogramaClientePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const permissoes = usePermissoesCliente();
  const {
    isImpersonating,
    impersonatedUser,
    stopImpersonation,
    canImpersonate,
    loading: impersonationLoading,
  } = useImpersonation();

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('calendario');
  const [eventos, setEventos] = useState<EventoCalendario[]>([]);
  const [clienteInfo, setClienteInfo] = useState<{
    pessoaId: string;
    contratoId: string | null;
    nomeCompleto: string;
  } | null>(null);

  const clienteIdParam = searchParams.get('cliente_id');

  useEffect(() => {
    carregarDados();
  }, [isImpersonating, impersonatedUser, clienteIdParam, canImpersonate]);

  async function carregarDados() {
    try {
      setLoading(true);

      // Determinar pessoaId
      let pessoaId: string | null = null;

      if (isImpersonating && impersonatedUser) {
        pessoaId = impersonatedUser.id;
      } else if (clienteIdParam && canImpersonate) {
        // SEGURANÇA: Só permite usar cliente_id da URL se o usuário for ADMIN/MASTER
        pessoaId = clienteIdParam;
      } else {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: usuario } = await supabase
            .from('usuarios')
            .select('pessoa_id')
            .eq('auth_user_id', user.id)
            .maybeSingle();
          pessoaId = usuario?.pessoa_id || null;
        }
      }

      if (!pessoaId) {
        setLoading(false);
        return;
      }

      // Buscar pessoa
      const { data: pessoa } = await supabase
        .from('pessoas')
        .select('id, nome')
        .eq('id', pessoaId)
        .maybeSingle();

      // Buscar contrato
      const { data: contrato } = await supabase
        .from('contratos')
        .select('id')
        .eq('cliente_id', pessoaId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pessoa) {
        setClienteInfo({
          pessoaId: pessoa.id,
          contratoId: contrato?.id || null,
          nomeCompleto: pessoa.nome,
        });
      }

      // Buscar eventos do cronograma
      await carregarEventos(pessoaId, contrato?.id);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarEventos(pessoaId: string, contratoId?: string) {
    try {
      const eventosCarregados: EventoCalendario[] = [];

      // Buscar checklists (etapas do cronograma)
      if (contratoId) {
        const { data: checklists } = await supabase
          .from('checklists')
          .select(`
            id,
            titulo,
            nucleo_id,
            data_inicio,
            data_fim,
            nucleos (nome),
            checklist_itens (id, concluido)
          `)
          .eq('vinculo_id', contratoId)
          .eq('vinculo_tipo', 'contrato');

        (checklists || []).forEach((cl: any) => {
          const itens = cl.checklist_itens || [];
          const totalItens = itens.length;
          const concluidos = itens.filter((i: any) => i.concluido).length;
          const progresso = totalItens > 0 ? Math.round((concluidos / totalItens) * 100) : 0;

          // Determinar status
          let status: EventoCalendario['status'] = 'pendente';
          if (progresso === 100) status = 'concluido';
          else if (progresso > 0) status = 'em_andamento';
          if (cl.data_fim && new Date(cl.data_fim) < new Date() && status !== 'concluido') {
            status = 'atrasado';
          }

          const nucleoNome = cl.nucleos?.nome?.toLowerCase() as any;

          // Evento de início da etapa
          if (cl.data_inicio) {
            eventosCarregados.push({
              id: `inicio-${cl.id}`,
              titulo: `Início: ${cl.titulo}`,
              data: cl.data_inicio,
              tipo: 'etapa',
              nucleo: nucleoNome,
              status,
              descricao: `Etapa de ${nucleoNome || 'projeto'}`,
            });
          }

          // Evento de deadline da etapa
          if (cl.data_fim) {
            eventosCarregados.push({
              id: `fim-${cl.id}`,
              titulo: `Deadline: ${cl.titulo}`,
              data: cl.data_fim,
              tipo: 'deadline',
              nucleo: nucleoNome,
              status,
              descricao: `Prazo final: ${progresso}% concluído`,
            });
          }
        });
      }

      // Buscar eventos da timeline (visíveis ao cliente)
      const { data: timelineEventos } = await supabase
        .from('oportunidade_timeline')
        .select(`
          id,
          titulo,
          descricao,
          tipo,
          criado_em,
          oportunidades!inner (cliente_id)
        `)
        .eq('oportunidades.cliente_id', pessoaId)
        .eq('visivel_cliente', true)
        .order('criado_em', { ascending: false })
        .limit(50);

      (timelineEventos || []).forEach((evento: any) => {
        eventosCarregados.push({
          id: evento.id,
          titulo: evento.titulo,
          data: evento.criado_em,
          tipo: evento.tipo === 'entrega' ? 'entrega' : evento.tipo === 'reuniao' ? 'reuniao' : 'marco',
          descricao: evento.descricao,
          status: 'concluido',
        });
      });

      // Buscar tarefas do cronograma detalhado
      if (contratoId) {
        const { data: tarefas } = await supabase
          .from('cronograma_tarefas')
          .select('id, titulo, data_termino, prioridade, nucleo, status')
          .eq('contrato_id', contratoId)
          .not('data_termino', 'is', null);

        (tarefas || []).forEach((tarefa: any) => {
          let status: EventoCalendario['status'] = 'pendente';
          if (tarefa.status === 'concluido') status = 'concluido';
          else if (tarefa.status === 'em_andamento') status = 'em_andamento';
          else if (new Date(tarefa.data_termino) < new Date()) status = 'atrasado';

          eventosCarregados.push({
            id: `tarefa-${tarefa.id}`,
            titulo: tarefa.titulo,
            data: tarefa.data_termino,
            tipo: tarefa.prioridade === 'alta' ? 'deadline' : 'etapa',
            nucleo: tarefa.nucleo?.toLowerCase(),
            status,
          });
        });
      }

      setEventos(eventosCarregados);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
    }
  }

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate('/');
  };

  if (loading || permissoes.loading || impersonationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Carregando cronograma...</p>
        </div>
      </div>
    );
  }

  if (!permissoes.podeVerCronograma) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-[16px] text-gray-600 mb-6">
            Você não tem permissÍo para visualizar o cronograma.
          </p>
          <button
            onClick={() => navigate('/wgx')}
            className="px-4 py-2 bg-orange-500 text-white text-[14px] rounded-lg hover:bg-orange-600 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={handleExitImpersonation}
        />
      )}

      <div className={`min-h-screen bg-gray-50 ${isImpersonating ? 'pt-16' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/wgx')}
                className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                  Cronograma do Projeto
                </h1>
                <p className="text-sm text-gray-500">
                  Acompanhe as etapas e prazos da sua obra
                </p>
              </div>
            </div>

            {/* Toggle de VisualizaçÍo */}
            <div className="flex gap-1 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setViewMode('calendario')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  viewMode === 'calendario'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                Calendário
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <List className="w-4 h-4" />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('gantt')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  viewMode === 'gantt'
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                Gantt
              </button>
            </div>
          </div>

          {/* Conteúdo baseado na visualizaçÍo */}
          {viewMode === 'calendario' ? (
            <CalendarioCliente
              eventos={eventos}
              onEventoClick={(evento) => {
                // SEGURANÇA (VER-030): Log apenas em desenvolvimento
                if (import.meta.env.DEV) {
                  if (import.meta.env.DEV) console.log('Evento clicado:', evento);
                }
                // Aqui poderia abrir um modal com detalhes
              }}
            />
          ) : (
            <CronogramaCliente
              clienteId={clienteInfo?.pessoaId || ''}
              contratoId={clienteInfo?.contratoId || undefined}
            />
          )}
        </div>
      </div>
    </>
  );
}


