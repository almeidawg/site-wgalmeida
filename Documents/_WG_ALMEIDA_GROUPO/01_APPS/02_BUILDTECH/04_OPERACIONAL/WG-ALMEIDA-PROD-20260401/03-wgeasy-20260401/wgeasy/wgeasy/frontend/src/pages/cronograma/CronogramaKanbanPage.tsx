import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useProjects } from '@/hooks/useProjects';
import { Loader2, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { formatarData } from '@/lib/utils';
import { motion } from 'framer-motion';

const CronogramaKanbanPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { projects, loading } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    if (!projects.length) return;
    if (selectedProjectId) return;
    const fromRoute = projectId && projects.find((p: any) => p.id === projectId)?.id;
    setSelectedProjectId(fromRoute || projects[0].id);
  }, [projects, projectId, selectedProjectId]);

  const project = useMemo(
    () => projects.find((p: any) => p.id === selectedProjectId),
    [projects, selectedProjectId]
  );

  const tasks = useMemo(() => {
    const etapas = project?.etapas || [];
    return etapas.map((t: any) => {
      const statusRaw = String(t.status || '').toLowerCase();
      let status = 'Pendente';
      if (statusRaw.includes('concl')) status = 'Concluído';
      else if (statusRaw.includes('andamento') || statusRaw.includes('exec')) status = 'Em Andamento';
      else if (statusRaw.includes('atras')) status = 'Atrasado';

      return {
        id: t.id,
        name: t.nome,
        duration: Math.max(Number(t.duracao_dias || 0), 0),
        start_date: t.data_inicio_prevista,
        end_date: t.data_fim_prevista,
        status,
      };
    });
  }, [project]);

  // Agrupar tarefas por status
  const tasksByStatus = {
    'Pendente': tasks.filter((t: any) => t.status === 'Pendente'),
    'Em Andamento': tasks.filter((t: any) => t.status === 'Em Andamento'),
    'Concluído': tasks.filter((t: any) => t.status === 'Concluído'),
    'Atrasado': tasks.filter((t: any) => t.status === 'Atrasado'),
  };

  const columns = [
    { title: 'Pendente', status: 'Pendente', icon: Clock, color: 'bg-slate-100', textColor: 'text-slate-700' },
    { title: 'Em Andamento', status: 'Em Andamento', icon: AlertCircle, color: 'bg-blue-100', textColor: 'text-blue-700' },
    { title: 'Concluído', status: 'Concluído', icon: CheckCircle2, color: 'bg-emerald-100', textColor: 'text-emerald-700' },
    { title: 'Atrasado', status: 'Atrasado', icon: AlertCircle, color: 'bg-red-100', textColor: 'text-red-700' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="p-8">
        <div className="text-center">
          <h2 className="text-2xl font-normal text-slate-800">Projeto nÍo encontrado</h2>
          <p className="text-sm text-slate-600 mt-2">O projeto solicitado nÍo existe ou foi removido.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-slate-800">
            Cronograma / Kanban
          </h1>
          <p className="text-sm text-slate-600">{project.nome}</p>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="mt-2 border border-gray-200 rounded-md px-2 py-1 text-xs"
          >
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>
      </header>

      <section className="flex-1 overflow-auto">
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {columns.map((column) => (
            <div key={column.status} className="flex flex-col bg-slate-50 rounded-lg p-4 flex-1 min-w-[220px] min-h-[500px]">
              <div className="flex items-center gap-2 mb-4">
                <column.icon className={`h-5 w-5 ${column.textColor}`} />
                <h3 className="font-normal text-[20px] text-slate-800">{column.title}</h3>
                <span className="ml-auto text-[14px] text-slate-500">
                  {tasksByStatus[column.status as keyof typeof tasksByStatus].length}
                </span>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto">
                {tasksByStatus[column.status as keyof typeof tasksByStatus].map((task: any, index: number) => (
                  <motion.div
                    key={task.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${column.color} p-3 rounded-lg shadow-sm border border-slate-200`}
                  >
                    <h4 className="font-medium text-[20px] text-slate-800">{task.name}</h4>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                      <span>DuraçÍo: {task.duration} dias</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      {formatarData(task.start_date)} - {formatarData(task.end_date)}
                    </div>
                  </motion.div>
                ))}

                {tasksByStatus[column.status as keyof typeof tasksByStatus].length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Nenhuma tarefa
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default CronogramaKanbanPage;

