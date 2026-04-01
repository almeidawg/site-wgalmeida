import { useState, useEffect, useCallback } from 'react';
import { supabaseRaw } from '@/lib/supabaseClient';

// Tipos para o hook useProjects
interface Pessoa {
  id: string;
  nome: string;
}

interface Contrato {
  id: string;
  numero: string;
  unidade_negocio: string;
}

interface CronogramaEtapa {
  id: string;
  projeto_id: string;
  nome: string;
  descricao?: string;
  data_inicio_prevista: string;
  data_fim_prevista: string;
  status: string;
  ordem: number;
}

interface Projeto {
  id: string;
  nome: string;
  descricao?: string;
  data_inicio?: string;
  cliente_id?: string;
  contrato_id?: string;
  status: string;
  created_at: string;
  cliente?: Pessoa;
  contrato?: Contrato;
  etapas?: CronogramaEtapa[];
}

interface AddProjectData {
  name: string;
  client_id: string;
  start_date: string;
  address?: string;
}

interface AddProjectItemData {
  name: string;
  description?: string;
  start_date?: string;
  end_date?: string;
  ordem?: number;
}

export const useProjects = () => {
  const [projects, setProjects] = useState<Projeto[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = useCallback(async () => {
    console.log("Fetching all projects (from 'projetos' table)...");
    setLoading(true);
    try {
      // ATUALIZADO: Usar tabela 'projetos' em vez de 'projects'
      const { data, error } = await supabaseRaw
        .from('projetos')
        .select(`
          *,
          cliente:pessoas(id, nome),
          contrato:contratos(id, numero, unidade_negocio),
          etapas:cronograma_etapas(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log("Projects fetched successfully from 'projetos':", data);
      setProjects(data || []);
    } catch(error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error('Error fetching projects:', errorMessage);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();

    // ATUALIZADO: Monitorar tabelas 'projetos' e 'cronograma_etapas'
    const channel = supabaseRaw.channel('projetos_realtime_channel_v3')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projetos' }, (payload) => { console.log('Change in projetos table:', payload); fetchProjects(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cronograma_etapas' }, (payload) => { console.log('Change in cronograma_etapas table:', payload); fetchProjects(); })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contratos' }, (payload) => { console.log('Change in contratos table:', payload); fetchProjects(); })
      .subscribe();

    return () => {
      supabaseRaw.removeChannel(channel);
    };
  }, [fetchProjects]);

  const addProject = async (projectData: AddProjectData): Promise<Projeto | null> => {
    console.log("Attempting to add project to 'projetos' table:", projectData);
    if (!projectData.name || !projectData.client_id || !projectData.start_date) {
      const errorMessage = "Validation failed: Name, client_id, and start_date are required.";
      console.error(errorMessage);
      throw new Error(errorMessage);
    }

    try {
      // ATUALIZADO: Inserir na tabela 'projetos' com campos corretos
      const { data, error } = await supabaseRaw
        .from('projetos')
        .insert({
          nome: projectData.name, // campo 'nome' em vez de 'name'
          descricao: projectData.address || '', // usar 'descricao' temporariamente
          data_inicio: projectData.start_date,
          cliente_id: projectData.client_id,
          status: 'Planejamento', // Status padrÍo do sistema novo
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Project added successfully to 'projetos':", data);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Error in addProject:", errorMessage);
      throw error;
    }
  };

  const addProjectItem = async (projectId: string, itemData: AddProjectItemData): Promise<CronogramaEtapa | null> => {
    console.log(`Attempting to add item (etapa) to project ${projectId}:`, itemData);
    if (!projectId || !itemData.name) {
      const errorMessage = "Validation failed: project_id and name are required.";
      console.error(errorMessage);
      return null;
    }

    try {
      // ATUALIZADO: Adicionar etapa ao cronograma
      const { data, error } = await supabaseRaw
        .from('cronograma_etapas')
        .insert({
          projeto_id: projectId,
          nome: itemData.name,
          descricao: itemData.description || '',
          data_inicio_prevista: itemData.start_date || new Date().toISOString().split('T')[0],
          data_fim_prevista: itemData.end_date || new Date().toISOString().split('T')[0],
          status: 'planejada',
          ordem: itemData.ordem || 0,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Project etapa added successfully:", data);
      return data;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error("Error in addProjectItem:", errorMessage);
      return null;
    }
  };

  const getProjectItems = async (projectId: string): Promise<CronogramaEtapa[]> => {
    console.log(`Fetching etapas for project ID: ${projectId}`);
    try {
      // ATUALIZADO: Buscar etapas do cronograma
      const { data, error } = await supabaseRaw
        .from('cronograma_etapas')
        .select('*')
        .eq('projeto_id', projectId)
        .order('ordem', { ascending: true });

      if (error) throw error;

      console.log(`Etapas for project ${projectId} fetched successfully:`, data);
      return data || [];
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      console.error(`Error fetching etapas for project ${projectId}:`, errorMessage);
      return [];
    }
  };

  const deleteProject = async (projectId: string) => {
    // ATUALIZADO: Deletar projeto da tabela 'projetos' e etapas de 'cronograma_etapas'
    await supabaseRaw.from('cronograma_etapas').delete().eq('projeto_id', projectId);
    const { error } = await supabaseRaw.from('projetos').delete().eq('id', projectId);

    if (error) { console.error("Error deleting project:", error); return false; }
    return true;
  };

  const addWorkDays = (startDate: Date, days: number) => {
    let currentDate = new Date(startDate.getTime());
    let daysAdded = 0;
    // Handle start date falling on a weekend
    while ([0, 6].includes(currentDate.getUTCDay())) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    if (days <= 0) return currentDate;

    while (daysAdded < days) {
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        if (currentDate.getUTCDay() !== 0 && currentDate.getUTCDay() !== 6) {
            daysAdded++;
        }
    }
    return currentDate;
  };

  const generateSchedule = async (projectId: string): Promise<void> => {
    console.log(`Generating schedule for project ID: ${projectId}`);
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
        console.error("Schedule generation failed: Project not found.");
        return;
    }

    try {
        // ATUALIZADO: Gerar etapas padrÍo ou usar etapas do contrato
        // Se o projeto foi criado por contrato, as etapas já existem
        const { data: etapasExistentes } = await supabaseRaw
          .from('cronograma_etapas')
          .select('*')
          .eq('projeto_id', projectId);

        if (etapasExistentes && etapasExistentes.length > 0) {
          console.log("Project already has schedule from contract. Activating project...");
          await supabaseRaw.from('projetos').update({ status: 'Em Andamento' }).eq('id', projectId);
          return;
        }

        // Se não houver etapas, criar etapa padrÍo
        const dataInicio = new Date(project.data_inicio || new Date());
        const dataFim = addWorkDays(dataInicio, 30); // 30 dias úteis padrÍo

        await supabaseRaw.from('cronograma_etapas').insert({
          projeto_id: projectId,
          nome: 'ExecuçÍo do Projeto',
          descricao: project.descricao || 'Executar projeto conforme planejado',
          data_inicio_prevista: dataInicio.toISOString().split('T')[0],
          data_fim_prevista: dataFim.toISOString().split('T')[0],
          status: 'planejada',
          ordem: 0,
        });

        await supabaseRaw.from('projetos').update({ status: 'Em Andamento' }).eq('id', projectId);
        console.log("Schedule generated and project status updated.");
    } catch(error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        console.error("Error generating schedule:", errorMessage);
    }
  };

  return {
    projects,
    loading,
    fetchProjects,
    addProject,
    deleteProject,
    addProjectItem,
    getProjectItems,
    generateSchedule,
  };
};


