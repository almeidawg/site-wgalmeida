/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CRONOGRAMA DASHBOARD - WG EASY 2026
// Dashboard principal com estatísticas e gráficos
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Users,
  Building2,
  Target,
  Activity,
  ArrowRight,
  Plus,
  Filter,
  RefreshCw,
  FileCheck,
  Loader2,
} from "lucide-react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import {
  buscarProjetosCompletos,
  obterEstatisticas,
  buscarContratosAtivosSemProjeto,
  sincronizarContratosAtivos,
} from "@/services/cronogramaService";
import type { ProjetoCompleto, EstatisticasCronograma, Nucleo } from "@/types/cronograma";
import { getNucleoColor, getNucleoIcon, getNucleoLabel } from "@/types/cronograma";
import { supabaseRaw } from "@/lib/supabaseClient";
import { formatarData } from "@/lib/utils";
import { obterAvatarUrl } from "@/utils/avatarUtils";

// ============================================================
// Componente de Card de Estatística
// ============================================================
const StatCard = ({
  icon: Icon,
  title,
  value,
  subtitle,
  color,
  trend
}: {
  icon: any;
  title: string;
  value: number | string;
  subtitle?: string;
  color: string;
  trend?: { value: number; isUp: boolean };
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all"
  >
    <div className="flex items-start justify-between">
      <div className="flex-1 min-w-0">
        <p className="text-[12px] font-medium text-gray-500 mb-1 truncate">{title}</p>
        <p className={`text-[20px] font-normal ${color}`}>{value}</p>
        {subtitle && <p className="text-[12px] text-gray-400 mt-1 truncate">{subtitle}</p>}
        {trend && (
          <div className={`hidden sm:flex items-center gap-1 mt-2 text-xs font-medium ${trend.isUp ? 'text-green-600' : 'text-red-600'}`}>
            <TrendingUp className={`w-3 h-3 ${!trend.isUp && 'rotate-180'}`} />
            <span>{trend.value}% vs mês anterior</span>
          </div>
        )}
      </div>
      <div className={`p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl ${color.replace('text-', 'bg-').replace('-600', '-100')}`}>
        <Icon className={`h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8 ${color}`} />
      </div>
    </div>
  </motion.div>
);

// ============================================================
// Componente de Barra de Progresso
// ============================================================
const ProgressBar = ({
  label,
  value,
  total,
  color
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) => {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-gray-700">{label}</span>
        <span className="font-normal text-gray-900">{value} ({percentage.toFixed(0)}%)</span>
      </div>
      <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color} rounded-full`}
        />
      </div>
    </div>
  );
};

// ============================================================
// Componente Principal
// ============================================================
export default function CronogramaDashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [projetos, setProjetos] = useState<ProjetoCompleto[]>([]);
  const [estatisticas, setEstatisticas] = useState<EstatisticasCronograma | null>(null);
  const [loading, setLoading] = useState(true);
  const [projetosPorNucleo, setProjetosPorNucleo] = useState<Record<string, number>>({});
  const [projetosPorMes, setProjetosPorMes] = useState<{ mes: string; count: number }[]>([]);

  // Estados para sincronizaçÍo de contratos
  const [sincronizando, setSincronizando] = useState(false);
  const [contratosPendentes, setContratosPendentes] = useState(0);

  useEffect(() => {
    carregarDados();
    verificarContratosPendentes();
  }, []);

  // Verificar quantos contratos ativos nÍo tem projeto
  async function verificarContratosPendentes() {
    try {
      const contratos = await buscarContratosAtivosSemProjeto();
      setContratosPendentes(contratos.length);
    } catch (error) {
      console.error("Erro ao verificar contratos:", error);
    }
  }

  // Sincronizar contratos ativos com o cronograma
  async function handleSincronizarContratos() {
    try {
      setSincronizando(true);
      const resultado = await sincronizarContratosAtivos();

      if (resultado.sucesso) {
        if (resultado.projetos_criados > 0) {
          toast({
            title: "SincronizaçÍo concluída!",
            description: `${resultado.projetos_criados} projeto(s) criado(s) com ${resultado.tarefas_criadas} tarefa(s).`,
          });
          // Recarregar dados
          await carregarDados();
          setContratosPendentes(0);
        } else {
          toast({
            title: "Nenhum contrato pendente",
            description: "Todos os contratos ativos já possuem projeto no cronograma.",
          });
        }
      } else {
        toast({
          variant: "destructive",
          title: "Erro na sincronizaçÍo",
          description: resultado.erros.join(", "),
        });
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setSincronizando(false);
      await verificarContratosPendentes();
    }
  }

  async function carregarDados() {
    try {
      setLoading(true);

      // Buscar projetos
      const dadosProjetos = await buscarProjetosCompletos();
      setProjetos(dadosProjetos);

      // Buscar estatísticas
      const dadosEstatisticas = await obterEstatisticas();
      setEstatisticas(dadosEstatisticas);

      // Calcular projetos por núcleo
      const porNucleo: Record<string, number> = {};
      dadosProjetos.forEach(p => {
        const nucleo = p.nucleo || 'nao_definido';
        porNucleo[nucleo] = (porNucleo[nucleo] || 0) + 1;
      });
      setProjetosPorNucleo(porNucleo);

      // Calcular projetos por mês (últimos 6 meses)
      const meses: { mes: string; count: number }[] = [];
      for (let i = 5; i >= 0; i--) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const mesNome = date.toLocaleString('pt-BR', { month: 'short' });
        const ano = date.getFullYear();
        const count = dadosProjetos.filter(p => {
          const projDate = new Date(p.created_at);
          return projDate.getMonth() === date.getMonth() && projDate.getFullYear() === date.getFullYear();
        }).length;
        meses.push({ mes: `${mesNome}/${ano}`, count });
      }
      setProjetosPorMes(meses);

    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  // Projetos recentes (últimos 30 dias)
  const projetosRecentes = projetos.filter(p => {
    const diff = Date.now() - new Date(p.created_at).getTime();
    return diff < 30 * 24 * 60 * 60 * 1000;
  });

  // Projetos em atraso
  const projetosAtrasados = projetos.filter(p => p.status === 'atrasado');

  // Max para gráfico de barras
  const maxProjetosMes = Math.max(...projetosPorMes.map(p => p.count), 1);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-wg-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Dashboard", href: "/" },
          { label: "Cronograma" },
        ]}
      />

      {/* Header */}
      <header className="rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white p-4 sm:p-6 lg:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 sm:gap-6">
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                <Calendar className="w-8 h-8" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Módulo Cronograma
                </p>
                <h1 className="text-[18px] sm:text-[24px] font-normal">Dashboard de Obras</h1>
              </div>
            </div>
            <p className="text-white/80 max-w-xl">
              Acompanhe em tempo real o progresso de todas as obras, equipes alocadas e cronogramas.
            </p>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => navigate('/cronograma/projects')}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-wg-primary px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-normal hover:bg-wg-primary/90 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Nova Obra
              </button>
              <button
                onClick={handleSincronizarContratos}
                disabled={sincronizando}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full bg-green-500 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-normal hover:bg-green-600 transition-colors disabled:opacity-50 relative"
              >
                {sincronizando ? (
                  <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                <span className="hidden sm:inline">Sincronizar Contratos</span>
                <span className="sm:hidden">Sincronizar</span>
                {contratosPendentes > 0 && !sincronizando && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] sm:text-xs rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center font-normal animate-pulse">
                    {contratosPendentes}
                  </span>
                )}
              </button>
              <button
                onClick={() => navigate('/cronograma/teams')}
                className="inline-flex items-center gap-1.5 sm:gap-2 rounded-full border border-white/30 px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm hover:bg-white/10 transition-colors"
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Equipes
              </button>
            </div>
          </div>

          {/* Mini Stats no Header */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 w-full lg:w-auto lg:min-w-[280px]">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="text-[12px] text-white/60 uppercase tracking-wider">Obras Ativas</p>
              <p className="text-[20px] font-normal mt-1">{estatisticas?.projetos_em_andamento || 0}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <p className="text-[12px] text-white/60 uppercase tracking-wider">Progresso Médio</p>
              <p className="text-[20px] font-normal mt-1">{estatisticas?.progresso_medio_geral || 0}%</p>
            </div>
          </div>
        </div>
      </header>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <StatCard
          icon={Building2}
          title="Total de Projetos"
          value={estatisticas?.total_projetos || 0}
          subtitle="Todos os projetos cadastrados"
          color="text-blue-600"
        />
        <StatCard
          icon={Activity}
          title="Em Andamento"
          value={estatisticas?.projetos_em_andamento || 0}
          subtitle="Obras em execuçÍo"
          color="text-green-600"
          trend={{ value: 12, isUp: true }}
        />
        <StatCard
          icon={AlertTriangle}
          title="Tarefas Atrasadas"
          value={estatisticas?.tarefas_atrasadas || 0}
          subtitle="Requerem atençÍo"
          color="text-red-600"
        />
        <StatCard
          icon={CheckCircle2}
          title="Concluídos"
          value={estatisticas?.projetos_concluidos || 0}
          subtitle="Este mês"
          color="text-purple-600"
        />
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Barras - Projetos por Mês */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-normal text-gray-900">Projetos por Mês</h3>
              <p className="text-sm text-gray-500">Últimos 6 meses</p>
            </div>
            <BarChart3 className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {projetosPorMes.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">{item.mes}</span>
                  <span className="font-normal text-gray-900">{item.count} projetos</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.count / maxProjetosMes) * 100}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* DistribuiçÍo por Núcleo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-normal text-gray-900">DistribuiçÍo por Núcleo</h3>
              <p className="text-sm text-gray-500">Projetos ativos por área</p>
            </div>
            <Target className="w-6 h-6 text-gray-400" />
          </div>
          <div className="space-y-4">
            {['engenharia', 'arquitetura', 'marcenaria'].map((nucleo, index) => {
              const count = projetosPorNucleo[nucleo] || 0;
              const total = projetos.length;
              const colors: Record<string, string> = {
                engenharia: 'bg-blue-500',
                arquitetura: 'bg-purple-500',
                marcenaria: 'bg-amber-500',
              };
              return (
                <ProgressBar
                  key={nucleo}
                  label={`${getNucleoIcon(nucleo as Nucleo)} ${getNucleoLabel(nucleo as Nucleo)}`}
                  value={count}
                  total={total}
                  color={colors[nucleo]}
                />
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Status das Tarefas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-normal text-gray-900">Status das Tarefas</h3>
            <p className="text-sm text-gray-500">VisÍo geral de todas as tarefas</p>
          </div>
          <Clock className="w-6 h-6 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <div className="text-center p-3 sm:p-4 bg-yellow-50 rounded-xl sm:rounded-2xl">
            <p className="text-[20px] font-normal text-yellow-600">{estatisticas?.tarefas_pendentes || 0}</p>
            <p className="text-[12px] text-yellow-700 mt-1">Pendentes</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-xl sm:rounded-2xl">
            <p className="text-[20px] font-normal text-blue-600">{estatisticas?.tarefas_em_andamento || 0}</p>
            <p className="text-[12px] text-blue-700 mt-1">Em Andamento</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-red-50 rounded-xl sm:rounded-2xl">
            <p className="text-[20px] font-normal text-red-600">{estatisticas?.tarefas_atrasadas || 0}</p>
            <p className="text-[12px] text-red-700 mt-1">Atrasadas</p>
          </div>
          <div className="text-center p-3 sm:p-4 bg-green-50 rounded-xl sm:rounded-2xl">
            <p className="text-[20px] font-normal text-green-600">{estatisticas?.tarefas_concluidas || 0}</p>
            <p className="text-[12px] text-green-700 mt-1">Concluídas</p>
          </div>
        </div>
      </motion.div>

      {/* Projetos Recentes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-normal text-gray-900">Projetos Recentes</h3>
            <p className="text-sm text-gray-500">Últimos projetos adicionados</p>
          </div>
          <button
            onClick={() => navigate('/cronograma/projects')}
            className="inline-flex items-center gap-2 text-[14px] text-wg-primary font-medium hover:underline"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
        <div className="divide-y divide-gray-100">
          {projetos.slice(0, 5).map((projeto) => (
            <div
              key={projeto.id}
              onClick={() => navigate(`/cronograma/projects/${projeto.id}`)}
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors flex items-center gap-4"
            >
              {/* Avatar do Cliente */}
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/80 flex-shrink-0">
                <img
                  src={obterAvatarUrl(
                    projeto.cliente_nome || "Cliente",
                    projeto.cliente_avatar_url,
                    projeto.cliente_foto_url
                  )}
                  alt={projeto.cliente_nome || "Cliente"}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-normal text-gray-900 truncate">{projeto.nome}</h4>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: `${getNucleoColor(projeto.nucleo)}20`,
                      color: getNucleoColor(projeto.nucleo),
                    }}
                  >
                    {getNucleoIcon(projeto.nucleo)} {getNucleoLabel(projeto.nucleo)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 truncate">
                  {projeto.cliente_nome || 'Cliente nÍo definido'}
                </p>
              </div>

              <div className="text-right flex-shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-wg-primary rounded-full"
                      style={{ width: `${projeto.progresso}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{projeto.progresso}%</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {formatarData(projeto.created_at)}
                </p>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-300" />
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

