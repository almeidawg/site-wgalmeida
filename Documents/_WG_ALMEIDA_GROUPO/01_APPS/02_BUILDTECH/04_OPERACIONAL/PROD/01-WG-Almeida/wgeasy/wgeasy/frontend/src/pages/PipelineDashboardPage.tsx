/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Dashboard Unificado do Pipeline
// VisÍo geral completa do sistema
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { obterEstatisticasConversao } from "@/lib/workflows/oportunidadeWorkflow";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

// ============================================================
// TIPOS
// ============================================================

interface DashboardMetrics {
  oportunidades: {
    total: number;
    ganhas: number;
    perdidas: number;
    em_andamento: number;
    taxa_conversao: number;
    valor_total: number;
  };
  contratos: {
    total: number;
    ativos: number;
    aguardando_assinatura: number;
    valor_total: number;
  };
  financeiro: {
    receitas_pendentes: number;
    receitas_pagas: number;
    valor_pendente: number;
    valor_recebido: number;
  };
  cronograma: {
    projetos_ativos: number;
    tarefas_pendentes: number;
    tarefas_atrasadas: number;
    tarefas_concluidas_mes: number;
  };
}

// ============================================================
// COMPONENTE
// ============================================================

export default function PipelineDashboardPage() {
  const navigate = useNavigate();
  const { usuario, loading: loadingUsuario } = useUsuarioLogado();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<"mes" | "trimestre" | "ano">("mes");

  useEffect(() => {
    if (!loadingUsuario && usuario) {
      carregarMetricas();
    }
  }, [periodo, usuario, loadingUsuario]);

  async function carregarMetricas() {
    if (!usuario) return;

    try {
      setLoading(true);

      // Verificar se é admin/master para acesso total
      const isAdminOuMaster = usuario.tipo_usuario === "MASTER" || usuario.tipo_usuario === "ADMIN";

      // Buscar estatísticas de conversÍo
      const statsConversao = await obterEstatisticasConversao();

      // Construir queries com filtro de segurança por núcleo
      let contratosQuery = supabase.from("contratos").select("status, valor_total");
      let financeiroQuery = supabase.from("financeiro_lancamentos").select("status, valor_total").eq("tipo", "entrada");
      let projetosQuery = supabase.from("projetos").select("status").eq("status", "em_andamento");
      let tarefasQuery = supabase.from("cronograma_tarefas").select("status, data_termino");

      // Aplicar filtro por núcleo se nÍo for admin/master
      if (!isAdminOuMaster && usuario.nucleo_id) {
        contratosQuery = contratosQuery.eq("nucleo_id", usuario.nucleo_id);
        financeiroQuery = financeiroQuery.eq("nucleo_id", usuario.nucleo_id);
        projetosQuery = projetosQuery.eq("nucleo_id", usuario.nucleo_id);
      }

      const { data: contratos } = await contratosQuery;
      const { data: financeiro } = await financeiroQuery;
      const { data: projetos } = await projetosQuery;
      const { data: tarefas } = await tarefasQuery;

      // Calcular métricas de oportunidades
      const oportunidadesMetrics = {
        total: statsConversao.total_oportunidades,
        ganhas: statsConversao.total_ganhas,
        perdidas: statsConversao.total_perdidas,
        em_andamento: statsConversao.total_oportunidades - statsConversao.total_ganhas - statsConversao.total_perdidas,
        taxa_conversao: statsConversao.taxa_conversao,
        valor_total: statsConversao.valor_total_ganho,
      };

      // Calcular métricas de contratos
      const contratosMetrics = {
        total: contratos?.length || 0,
        ativos: contratos?.filter((c) => c.status === "ativo").length || 0,
        aguardando_assinatura: contratos?.filter((c) => c.status === "aguardando_assinatura").length || 0,
        valor_total: contratos?.reduce((acc, c) => acc + (c.valor_total || 0), 0) || 0,
      };

      // Calcular métricas financeiras
      const financeiroMetrics = {
        receitas_pendentes: financeiro?.filter((f) => f.status === "previsto").length || 0,
        receitas_pagas: financeiro?.filter((f) => f.status === "pago").length || 0,
        valor_pendente: financeiro?.filter((f) => f.status === "previsto").reduce((acc, f) => acc + (f.valor_total || 0), 0) || 0,
        valor_recebido: financeiro?.filter((f) => f.status === "pago").reduce((acc, f) => acc + (f.valor_total || 0), 0) || 0,
      };

      // Calcular métricas de cronograma
      const hoje = new Date();
      const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

      const cronogramaMetrics = {
        projetos_ativos: projetos?.length || 0,
        tarefas_pendentes: tarefas?.filter((t) => t.status === "pendente").length || 0,
        tarefas_atrasadas: tarefas?.filter((t) => {
          const dataTermino = new Date(t.data_termino);
          return t.status !== "concluido" && dataTermino < hoje;
        }).length || 0,
        tarefas_concluidas_mes: tarefas?.filter((t) => {
          const dataTermino = new Date(t.data_termino);
          return t.status === "concluido" && dataTermino >= inicioMes;
        }).length || 0,
      };

      setMetrics({
        oportunidades: oportunidadesMetrics,
        contratos: contratosMetrics,
        financeiro: financeiroMetrics,
        cronograma: cronogramaMetrics,
      });
    } catch (error) {
      console.error("Erro ao carregar métricas:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26]" />
          <p className="text-[12px] text-gray-600 mt-4">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-[#2E2E2E]">Dashboard do Pipeline</h1>
          <p className="text-[12px] text-gray-600 mt-1">
            VisÍo geral completa do seu negócio
          </p>
        </div>
        <div className="flex items-center gap-2">
          {["mes", "trimestre", "ano"].map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p as any)}
              className={`px-3 py-1.5 rounded-lg text-[12px] ${
                periodo === p
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {p === "mes" ? "Mês" : p === "trimestre" ? "Trimestre" : "Ano"}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Principais */}
      <div className="grid grid-cols-4 gap-6">
        <MetricCard
          title="Taxa de ConversÍo"
          value={`${metrics.oportunidades.taxa_conversao.toFixed(1)}%`}
          icon="📊"
          color="purple"
          trend={metrics.oportunidades.taxa_conversao > 50 ? "up" : "down"}
        />
        <MetricCard
          title="Valor em Contratos"
          value={`R$ ${(metrics.contratos.valor_total / 1000).toFixed(0)}k`}
          icon="💰"
          color="green"
          trend="up"
        />
        <MetricCard
          title="Receitas Pendentes"
          value={`R$ ${(metrics.financeiro.valor_pendente / 1000).toFixed(0)}k`}
          icon="⏳"
          color="orange"
        />
        <MetricCard
          title="Projetos Ativos"
          value={metrics.cronograma.projetos_ativos}
          icon="🚀"
          color="blue"
        />
      </div>

      {/* Seções Detalhadas */}
      <div className="grid grid-cols-2 gap-6">
        {/* Oportunidades */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-light text-[#2E2E2E]">Oportunidades</h3>
            <button
              onClick={() => navigate("/oportunidades")}
              className="text-[12px] text-[#F25C26] hover:text-[#e04a1a]"
            >
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            <StatRow label="Total" value={metrics.oportunidades.total} color="gray" />
            <StatRow label="Ganhas" value={metrics.oportunidades.ganhas} color="green" />
            <StatRow label="Em Andamento" value={metrics.oportunidades.em_andamento} color="blue" />
            <StatRow label="Perdidas" value={metrics.oportunidades.perdidas} color="red" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-gray-700">Valor Total</span>
              <span className="text-[18px] font-light text-[#F25C26]">
                R$ {metrics.oportunidades.valor_total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Contratos */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-light text-[#2E2E2E]">Contratos</h3>
            <button
              onClick={() => navigate("/contratos")}
              className="text-[12px] text-[#F25C26] hover:text-[#e04a1a]"
            >
              Ver todos →
            </button>
          </div>
          <div className="space-y-3">
            <StatRow label="Total" value={metrics.contratos.total} color="gray" />
            <StatRow label="Ativos" value={metrics.contratos.ativos} color="green" />
            <StatRow label="Aguardando Assinatura" value={metrics.contratos.aguardando_assinatura} color="orange" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-gray-700">Valor Total</span>
              <span className="text-[18px] font-light text-[#F25C26]">
                R$ {metrics.contratos.valor_total.toLocaleString("pt-BR", {
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Financeiro */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-light text-[#2E2E2E]">Financeiro</h3>
            <button
              onClick={() => navigate("/financeiro")}
              className="text-[12px] text-[#F25C26] hover:text-[#e04a1a]"
            >
              Ver detalhes →
            </button>
          </div>
          <div className="space-y-3">
            <StatRow label="Receitas Pendentes" value={metrics.financeiro.receitas_pendentes} color="orange" />
            <StatRow label="Receitas Pagas" value={metrics.financeiro.receitas_pagas} color="green" />
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-gray-600">Pendente</span>
              <span className="text-[12px] font-normal text-orange-600">
                R$ {(metrics.financeiro.valor_pendente / 1000).toFixed(1)}k
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[12px] text-gray-600">Recebido</span>
              <span className="text-[12px] font-normal text-green-600">
                R$ {(metrics.financeiro.valor_recebido / 1000).toFixed(1)}k
              </span>
            </div>
          </div>
        </div>

        {/* Cronograma */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-light text-[#2E2E2E]">Cronograma</h3>
            <button
              onClick={() => navigate("/cronograma")}
              className="text-[12px] text-[#F25C26] hover:text-[#e04a1a]"
            >
              Ver projetos →
            </button>
          </div>
          <div className="space-y-3">
            <StatRow label="Projetos Ativos" value={metrics.cronograma.projetos_ativos} color="blue" />
            <StatRow label="Tarefas Pendentes" value={metrics.cronograma.tarefas_pendentes} color="gray" />
            <StatRow label="Tarefas Atrasadas" value={metrics.cronograma.tarefas_atrasadas} color="red" />
            <StatRow label="Concluídas no Mês" value={metrics.cronograma.tarefas_concluidas_mes} color="green" />
          </div>
        </div>
      </div>

      {/* Ações Rápidas */}
      <div className="bg-gradient-to-r from-[#F25C26] to-[#e04a1a] rounded-xl p-6 text-white">
        <h3 className="text-[20px] font-light mb-4">Ações Rápidas</h3>
        <div className="grid grid-cols-4 gap-4">
          <QuickActionButton
            icon="➕"
            label="Nova Oportunidade"
            onClick={() => navigate("/oportunidades/nova")}
          />
          <QuickActionButton
            icon="📄"
            label="Novo Contrato"
            onClick={() => navigate("/contratos/novo")}
          />
          <QuickActionButton
            icon="📦"
            label="Adicionar ao Pricelist"
            onClick={() => navigate("/pricelist/novo")}
          />
          <QuickActionButton
            icon="📊"
            label="Ver Relatórios"
            onClick={() => navigate("/relatorios")}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function MetricCard({
  title,
  value,
  icon,
  color,
  trend,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: "purple" | "green" | "orange" | "blue";
  trend?: "up" | "down";
}) {
  const colors = {
    purple: "from-purple-500 to-purple-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    blue: "from-blue-500 to-blue-600",
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-xl p-6 text-white`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[18px]">{icon}</span>
        {trend && (
          <span className={`text-[12px] font-normal ${trend === "up" ? "text-green-200" : "text-red-200"}`}>
            {trend === "up" ? "↗" : "↘"}
          </span>
        )}
      </div>
      <p className="text-[12px] opacity-90 mb-1">{title}</p>
      <p className="text-[18px] font-light">{value}</p>
    </div>
  );
}

function StatRow({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "gray" | "green" | "blue" | "red" | "orange";
}) {
  const colors = {
    gray: "bg-gray-100 text-gray-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    red: "bg-red-100 text-red-700",
    orange: "bg-orange-100 text-orange-700",
  };

  return (
    <div className="flex items-center justify-between">
      <span className="text-[12px] text-gray-700">{label}</span>
      <span className={`px-2 py-1 rounded text-[12px] font-normal ${colors[color]}`}>
        {value}
      </span>
    </div>
  );
}

function QuickActionButton({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-white/20 hover:bg-white/30 rounded-lg p-4 text-center transition-all backdrop-blur-sm"
    >
      <div className="text-[18px] mb-2">{icon}</div>
      <div className="text-[12px]">{label}</div>
    </button>
  );
}

