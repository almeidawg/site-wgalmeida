// ==========================================
// GRÁFICOS - CRONOGRAMA
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useState, useEffect } from 'react';
import { formatarData } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  Target,
  Activity,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjects } from '@/hooks/useProjects';
import { supabaseRaw } from '@/lib/supabaseClient';

export default function GraficosPage() {
  const { projects, loading } = useProjects();
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Buscar estatísticas de equipes
        const { data: equipesData } = await supabaseRaw
          .from('projeto_equipe')
          .select('projeto_id, pessoa_id, ativo')
          .eq('ativo', true);

        // Buscar estatísticas de etapas
        const { data: etapasData } = await supabaseRaw
          .from('cronograma_etapas')
          .select('projeto_id, status');

        setStats({
          totalEquipes: equipesData?.length || 0,
          totalEtapas: etapasData?.length || 0,
          etapasPorStatus: etapasData?.reduce((acc: any, etapa: any) => {
            acc[etapa.status] = (acc[etapa.status] || 0) + 1;
            return acc;
          }, {}) || {}
        });
      } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };

    loadStats();
  }, []);

  // Calcular estatísticas dos projetos
  const projectStats = {
    total: projects.length,
    porStatus: projects.reduce((acc: any, proj: any) => {
      const status = proj.status || 'Planejamento';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    comCliente: projects.filter((p: any) => p.cliente_id).length,
    comContrato: projects.filter((p: any) => p.contrato_id).length,
  };

  // Projetos recentes (últimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentProjects = projects.filter((p: any) =>
    new Date(p.created_at) > thirtyDaysAgo
  ).length;

  // Projetos por mês (últimos 6 meses)
  const projectsByMonth = Array.from({ length: 6 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() - i);
    const month = date.toLocaleString('pt-BR', { month: 'short' });
    const year = date.getFullYear();
    const count = projects.filter((p: any) => {
      const projDate = new Date(p.created_at);
      return projDate.getMonth() === date.getMonth() &&
             projDate.getFullYear() === date.getFullYear();
    }).length;
    return { month: `${month}/${year}`, count };
  }).reverse();

  const StatCard = ({ icon: Icon, title, value, subtitle, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[12px] font-medium text-slate-600 mb-1">{title}</p>
              <p className={`text-[20px] font-normal ${color}`}>{value}</p>
              {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
            </div>
            <div className={`p-4 rounded-full ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
              <Icon className={`h-8 w-8 ${color}`} />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading || loadingStats) {
    return (
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-slate-50 to-blue-50 min-h-screen">
      <div className="w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-[18px] sm:text-[24px] font-normal bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Gráficos do Cronograma
          </h1>
          <p className="text-[12px] text-slate-600">
            VisualizaçÍo gráfica e analytics do cronograma de projetos
          </p>
        </div>

        {/* Cards de Estatísticas Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <StatCard
            icon={Target}
            title="Total de Projetos"
            value={projectStats.total}
            subtitle="Todos os projetos cadastrados"
            color="text-primary"
          />
          <StatCard
            icon={Activity}
            title="Projetos Recentes"
            value={recentProjects}
            subtitle="Últimos 30 dias"
            color="text-green-600"
          />
          <StatCard
            icon={Users}
            title="Membros em Equipes"
            value={stats?.totalEquipes || 0}
            subtitle="Colaboradores e fornecedores"
            color="text-purple-600"
          />
          <StatCard
            icon={Calendar}
            title="Etapas Totais"
            value={stats?.totalEtapas || 0}
            subtitle="Em todos os projetos"
            color="text-orange-600"
          />
        </div>

        {/* Gráficos Principais */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* DistribuiçÍo por Status */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="h-5 w-5 text-primary" />
                Projetos por Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {Object.entries(projectStats.porStatus).map(([status, count]: [string, any]) => {
                  const percentage = (count / projectStats.total) * 100;
                  const colors: any = {
                    'Planejamento': 'bg-blue-500',
                    'Em Andamento': 'bg-green-500',
                    'Em Atraso': 'bg-red-500',
                    'Concluído': 'bg-gray-500',
                    'Pausado': 'bg-yellow-500',
                  };
                  const color = colors[status] || 'bg-slate-500';

                  return (
                    <div key={status}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{status}</span>
                        <span className="text-sm font-normal text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full ${color} rounded-full`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Projetos por Mês */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-green-600" />
                Projetos Criados (Últimos 6 Meses)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-3">
                {projectsByMonth.map((item, index) => {
                  const maxCount = Math.max(...projectsByMonth.map(p => p.count));
                  const percentage = maxCount > 0 ? (item.count / maxCount) * 100 : 0;

                  return (
                    <div key={index}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-700">{item.month}</span>
                        <span className="text-sm font-normal text-slate-900">{item.count} projetos</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.8, delay: index * 0.1 }}
                          className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Etapas por Status */}
          {stats?.etapasPorStatus && Object.keys(stats.etapasPorStatus).length > 0 && (
            <Card className="shadow-xl">
              <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  Etapas por Status
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="space-y-4">
                  {Object.entries(stats.etapasPorStatus).map(([status, count]: [string, any]) => {
                    const percentage = (count / stats.totalEtapas) * 100;
                    const colors: any = {
                      'planejada': 'bg-blue-500',
                      'em_andamento': 'bg-green-500',
                      'concluida': 'bg-gray-500',
                      'atrasada': 'bg-red-500',
                    };
                    const color = colors[status] || 'bg-slate-500';

                    return (
                      <div key={status}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700 capitalize">
                            {status.replace('_', ' ')}
                          </span>
                          <span className="text-sm font-normal text-slate-900">{count} ({percentage.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                            className={`h-full ${color} rounded-full`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Métricas Adicionais */}
          <Card className="shadow-xl">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-600" />
                Métricas Adicionais
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <span className="text-[12px] font-medium text-slate-700">Com Cliente</span>
                  <span className="text-[20px] font-normal text-primary">{projectStats.comCliente}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <span className="text-[12px] font-medium text-slate-700">Com Contrato</span>
                  <span className="text-[20px] font-normal text-green-600">{projectStats.comContrato}</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <span className="text-[12px] font-medium text-slate-700">Média de Equipe</span>
                  <span className="text-[20px] font-normal text-purple-600">
                    {projectStats.total > 0 ? (stats?.totalEquipes / projectStats.total).toFixed(1) : 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Projetos Recentes */}
        <Card className="shadow-xl">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-blue-50">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Projetos Mais Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[600px]">
                <thead className="bg-slate-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Projeto
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Criado em
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {projects.slice(0, 10).map((project: any) => (
                    <tr key={project.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-slate-900">{project.nome}</div>
                        <div className="text-sm text-slate-500">{project.descricao}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-slate-900">{project.cliente?.nome || '-'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-normal rounded-full ${
                          project.status === 'Em Andamento' ? 'bg-green-100 text-green-800' :
                          project.status === 'Concluído' ? 'bg-gray-100 text-gray-800' :
                          project.status === 'Em Atraso' ? 'bg-red-100 text-red-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {project.status || 'Planejamento'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {formatarData(project.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

