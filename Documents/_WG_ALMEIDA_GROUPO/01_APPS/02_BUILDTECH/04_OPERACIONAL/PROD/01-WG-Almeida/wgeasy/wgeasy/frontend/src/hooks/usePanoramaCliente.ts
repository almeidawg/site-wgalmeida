// src/hooks/usePanoramaCliente.ts
// Hook para buscar dados dinâmicos do panorama do cliente
// Dados reais de contratos, checklists, aprovações e atividades

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';

export interface PanoramaData {
  // Métricas principais
  contratosAtivos: number;
  prazoEstimadoSemanas: number;
  projetosEmProducao: number;
  nucleosAtivos: string[];
  solicitacoesRespondidas: number;
  ultimaRespostaData: string | null;
  aprovacoesPendentes: number;
  aprovacoesPendentesItens: string[];

  // Progresso geral
  progressoGeral: number;
  totalAtividades: number;
  atividadesConcluidas: number;
  atividadesEmAberto: number;

  // Timeline de atividades recentes
  atividadesRecentes: {
    id: string;
    titulo: string;
    nucleo: string;
    dataAtualizacao: string;
    tipo: 'concluido' | 'novo' | 'atualizado';
  }[];

  // Próximas entregas
  proximasEntregas: {
    id: string;
    titulo: string;
    nucleo: string;
    previsao: string;
  }[];

  // Status do onboarding
  onboardingStatus: {
    etapa: string;
    titulo: string;
    descricao: string;
    status: 'completed' | 'current' | 'upcoming';
  }[];
}

const ETAPAS_ONBOARDING = [
  {
    etapa: '01',
    titulo: 'Bem-vindo ao WG Easy',
    descricao: 'ApresentaçÍo institucional, canais de suporte e definiçÍo dos pontos de contato.',
    checkField: 'onboarding_welcome',
  },
  {
    etapa: '02',
    titulo: 'Kick-off do Projeto',
    descricao: 'Alinhamento de objetivos, escopo contratado e integrações necessárias.',
    checkField: 'onboarding_kickoff',
  },
  {
    etapa: '03',
    titulo: 'Onboarding Financeiro',
    descricao: 'Entrega de documentaçÍo, agenda de faturamento e combinaçÍo de aprovações.',
    checkField: 'onboarding_financeiro',
  },
  {
    etapa: '04',
    titulo: 'Primeira entrega de valor',
    descricao: 'DisponibilizaçÍo das referências e cronograma executivo na área do cliente.',
    checkField: 'onboarding_primeira_entrega',
  },
];

export function usePanoramaCliente(clienteId: string | undefined) {
  const [data, setData] = useState<PanoramaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const carregarDados = useCallback(async () => {
    if (!clienteId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 1. Buscar contratos ativos do cliente
      const { data: contratos, error: contratosError } = await supabase
        .from('contratos')
        .select('id, numero, status, created_at, updated_at')
        .eq('cliente_id', clienteId)
        .not('status', 'in', '(rascunho,concluido,cancelado)');

      if (contratosError) throw contratosError;

      const contratoIds = (contratos || []).map(c => c.id);
      const contratosAtivos = contratos?.length || 0;

      // Prazo estimado baseado no número de contratos (valor aproximado)
      const prazoEstimadoSemanas = contratosAtivos * 12; // ~12 semanas por contrato

      // 2. Buscar checklists e itens vinculados aos contratos
      let checklistData: any[] = [];
      if (contratoIds.length > 0) {
        const { data: checklists, error: checklistError } = await supabase
          .from('checklists')
          .select(`
            id,
            titulo,
            nucleo_id,
            updated_at,
            nucleos (nome),
            checklist_itens (
              id,
              texto,
              concluido,
              updated_at
            )
          `)
          .in('vinculo_id', contratoIds)
          .eq('vinculo_tipo', 'contrato');

        if (!checklistError) {
          checklistData = checklists || [];
        }
      }

      // Extrair núcleos ativos
      const nucleosSet = new Set<string>();
      checklistData.forEach((cl: any) => {
        const nucleoNome = cl.nucleos?.nome;
        if (nucleoNome) nucleosSet.add(nucleoNome);
      });
      const nucleosAtivos = Array.from(nucleosSet);

      // Calcular atividades
      let totalAtividades = 0;
      let atividadesConcluidas = 0;
      const atividadesRecentesList: PanoramaData['atividadesRecentes'] = [];
      let ultimaResposta: Date | null = null;

      checklistData.forEach((cl: any) => {
        const itens = cl.checklist_itens || [];
        totalAtividades += itens.length;

        itens.forEach((item: any) => {
          if (item.concluido) {
            atividadesConcluidas++;
            const dataUpdate = new Date(item.updated_at);
            if (!ultimaResposta || dataUpdate > ultimaResposta) {
              ultimaResposta = dataUpdate;
            }

            // Adicionar às atividades recentes (últimos 30 dias)
            const diasAtras = (Date.now() - dataUpdate.getTime()) / (1000 * 60 * 60 * 24);
            if (diasAtras <= 30) {
              atividadesRecentesList.push({
                id: item.id,
                titulo: item.texto || cl.titulo,
                nucleo: cl.nucleos?.nome || 'Geral',
                dataAtualizacao: item.updated_at,
                tipo: 'concluido',
              });
            }
          }
        });
      });

      // Ordenar atividades recentes por data
      atividadesRecentesList.sort((a, b) =>
        new Date(b.dataAtualizacao).getTime() - new Date(a.dataAtualizacao).getTime()
      );

      // 3. Buscar orçamentos pendentes de aprovaçÍo
      let aprovacoesPendentes = 0;
      const aprovacoesPendentesItens: string[] = [];

      if (contratoIds.length > 0) {
        const { data: orcamentos, error: orcError } = await supabase
          .from('orcamentos')
          .select('id, titulo, descricao, status')
          .in('contrato_id', contratoIds)
          .in('status', ['pendente_aprovacao', 'aguardando_cliente', 'enviado']);

        if (!orcError && orcamentos) {
          aprovacoesPendentes = orcamentos.length;
          orcamentos.forEach(orc => {
            aprovacoesPendentesItens.push(orc.titulo || orc.descricao || 'Item pendente');
          });
        }
      }

      // 4. Calcular progresso geral
      const progressoGeral = totalAtividades > 0
        ? Math.round((atividadesConcluidas / totalAtividades) * 100)
        : 0;

      // 5. Determinar status do onboarding baseado no progresso
      const onboardingStatus = ETAPAS_ONBOARDING.map((etapa, index) => {
        let status: 'completed' | 'current' | 'upcoming' = 'upcoming';

        // Lógica simplificada baseada no progresso geral
        if (progressoGeral >= 100) {
          status = 'completed';
        } else if (index === 0 && contratosAtivos > 0) {
          status = 'completed'; // Se tem contrato, welcome está completo
        } else if (index === 1 && progressoGeral > 0) {
          status = progressoGeral >= 25 ? 'completed' : 'current';
        } else if (index === 2 && progressoGeral >= 25) {
          status = progressoGeral >= 50 ? 'completed' : 'current';
        } else if (index === 3 && progressoGeral >= 50) {
          status = progressoGeral >= 75 ? 'completed' : 'current';
        } else if (index > 0) {
          // Encontrar a etapa atual
          const etapaAnteriorCompleta = index === 1 ? contratosAtivos > 0 : progressoGeral >= (index - 1) * 25;
          if (etapaAnteriorCompleta && progressoGeral < index * 25) {
            status = 'current';
          }
        }

        return {
          etapa: etapa.etapa,
          titulo: etapa.titulo,
          descricao: etapa.descricao,
          status,
        };
      });

      // 6. Próximas entregas (itens não concluídos mais próximos)
      const proximasEntregas: PanoramaData['proximasEntregas'] = [];
      checklistData.forEach((cl: any) => {
        const itensNaoConcluidos = (cl.checklist_itens || [])
          .filter((item: any) => !item.concluido)
          .slice(0, 2);

        itensNaoConcluidos.forEach((item: any) => {
          if (proximasEntregas.length < 5) {
            proximasEntregas.push({
              id: item.id,
              titulo: item.texto || 'Atividade pendente',
              nucleo: cl.nucleos?.nome || 'Geral',
              previsao: 'Em breve',
            });
          }
        });
      });

      // Formatar última resposta
      const ultimaRespostaFormatada = ultimaResposta
        ? new Intl.DateTimeFormat('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
          }).format(ultimaResposta)
        : null;

      setData({
        contratosAtivos,
        prazoEstimadoSemanas,
        projetosEmProducao: nucleosAtivos.length,
        nucleosAtivos,
        solicitacoesRespondidas: atividadesConcluidas,
        ultimaRespostaData: ultimaRespostaFormatada,
        aprovacoesPendentes,
        aprovacoesPendentesItens: aprovacoesPendentesItens.slice(0, 3),
        progressoGeral,
        totalAtividades,
        atividadesConcluidas,
        atividadesEmAberto: totalAtividades - atividadesConcluidas,
        atividadesRecentes: atividadesRecentesList.slice(0, 5),
        proximasEntregas,
        onboardingStatus,
      });

    } catch (err: any) {
      console.error('Erro ao carregar panorama do cliente:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return { data, loading, error, reload: carregarDados };
}


