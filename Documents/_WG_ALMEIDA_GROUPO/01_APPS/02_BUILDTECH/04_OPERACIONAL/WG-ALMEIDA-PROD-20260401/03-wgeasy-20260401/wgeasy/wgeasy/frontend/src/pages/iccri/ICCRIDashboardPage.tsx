// ============================================================
// ICCRI Dashboard — Visão Geral do Motor de Precificação
// WG Easy · Sistema · MASTER only
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getICCRIStats, getHistoricoindice,
  type ICCRIStats, type ICCRIindice,
} from "@/lib/iccriApi";
import {
  BarChart2, Layers, Tag, Hammer, ClipboardList,
  TrendingUp, AlertTriangle, ArrowRight, RefreshCw,
} from "lucide-react";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });

function StatCard({
  label, value, icon: Icon, color, onClick, alert,
}: {
  label: string; value: string | number; icon: React.ElementType;
  color: string; onClick?: () => void; alert?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex items-center gap-4 ${onClick ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}
    >
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-black text-gray-900 dark:text-white">{value}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">{label}</p>
      </div>
      {alert && <AlertTriangle size={16} className="text-amber-500 shrink-0" />}
      {onClick && <ArrowRight size={14} className="text-gray-400 shrink-0" />}
    </div>
  );
}

export default function ICCRIDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ICCRIStats | null>(null);
  const [historico, setHistorico] = useState<ICCRIindice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const [s, h] = await Promise.all([getICCRIStats(), getHistoricoindice(6)]);
      setStats(s);
      setHistorico(h);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw size={24} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-600 dark:text-red-400 text-sm">
        {error}
      </div>
    );
  }

  const Indice = stats?.IndiceMesAtual;
  const pctCobertos = stats && stats.totalServicos > 0
    ? Math.round(((stats.totalServicos - stats.servicosSemComposicao) / stats.totalServicos) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">
            ICCRI — Motor de Precificação
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            ÍÍndice de Custo da ConstruçÍo e Reforma Inteligente · Base compartilhada WGEasy ·†” ObraEasy
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors"
        >
          <RefreshCw size={14} />
          Atualizar
        </button>
      </div>

      {/* ÍÍndice atual */}
      {Indice && (
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wide">
                ÍÍndice ICCRI — {Indice.competencia}
              </p>
              <p className="text-4xl font-black mt-1">{Number(Indice?.valor_Indice ?? 0).toFixed(1)}</p>
              <p className="text-blue-200 text-sm mt-1">
                Base 100 = Jan/2020 · INCC: {Number((Indice?.incc_referencia ?? 0) * 100).toFixed(2)}% a.m.
              </p>
            </div>
            <div className="flex gap-6 text-center">
              <div>
                <p className="text-blue-200 text-xs">Var. Mensal</p>
                <p className={`text-xl font-bold ${Indice.variacao_mensal >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {Indice.variacao_mensal >= 0 ? "+" : ""}{Number((Indice?.variacao_mensal ?? 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Var. Anual</p>
                <p className={`text-xl font-bold ${Indice.variacao_anual >= 0 ? "text-green-300" : "text-red-300"}`}>
                  {Indice.variacao_anual >= 0 ? "+" : ""}{((Indice?.variacao_anual ?? 0) * 100).toFixed(2)}%
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-xs">Fonte</p>
                <p className="text-xl font-bold">{Indice.fonte}</p>
              </div>
            </div>
          </div>

          {/* Mini historico */}
          {historico.length > 1 && (
            <div className="mt-4 pt-4 border-t border-blue-500/40">
              <p className="text-blue-200 text-xs mb-2">Íšltimos {historico.length} meses</p>
              <div className="flex items-end gap-2 h-8">
                {[...historico].reverse().map((h, i) => {
                  const max = Math.max(...historico.map(x => x.valor_iccri));
                  const min = Math.min(...historico.map(x => x.valor_iccri));
                  const range = max - min || 1;
                  const height = Math.max(20, ((h.valor_iccri - min) / range) * 100);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className="w-full bg-blue-400/60 rounded-sm"
                        style={{ height: `${height}%` }}
                        title={`${h.mes}: ${h.valor_iccri}`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Macrocategorias" value={stats?.totalMacrocategorias ?? 0}
          icon={Layers} color="bg-purple-500"
        />
        <StatCard
          label="Categorias" value={stats?.totalCategorias ?? 0}
          icon={Tag} color="bg-indigo-500"
          onClick={() => navigate("/sistema/iccri/categorias")}
        />
        <StatCard
          label="Subcategorias" value={stats?.totalSubcategorias ?? 0}
          icon={ClipboardList} color="bg-cyan-500"
          onClick={() => navigate("/sistema/iccri/categorias")}
        />
        <StatCard
          label="Serviços Ativos" value={stats?.totalServicos ?? 0}
          icon={Hammer} color="bg-orange-500"
          onClick={() => navigate("/sistema/iccri/servicos")}
        />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="ComposiçÍµes Ativas" value={stats?.totalComposicoes ?? 0}
          icon={BarChart2} color="bg-emerald-500"
          onClick={() => navigate("/sistema/iccri/composicoes")}
        />
        <StatCard
          label="Itens de ComposiçÍo" value={stats?.totalItensComposicao ?? 0}
          icon={ClipboardList} color="bg-teal-500"
        />
        <StatCard
          label="Cobertura" value={`${pctCobertos}%`}
          icon={TrendingUp} color={pctCobertos >= 80 ? "bg-green-500" : "bg-amber-500"}
          alert={pctCobertos < 80}
        />
        <StatCard
          label="Sem ComposiçÍo" value={stats?.servicosSemComposicao ?? 0}
          icon={AlertTriangle}
          color={(stats?.servicosSemComposicao ?? 0) > 0 ? "bg-red-500" : "bg-gray-400"}
          alert={(stats?.servicosSemComposicao ?? 0) > 0}
          onClick={() => navigate("/sistema/iccri/servicos")}
        />
      </div>

      {/* AçÍµes rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
            GestÍo da Base
          </h3>
          <div className="space-y-2">
            {[
              { label: "Categorias e Subcategorias", path: "/sistema/iccri/categorias", desc: "Estrutura hierárquica completa" },
              { label: "Serviços e MÍo de Obra", path: "/sistema/iccri/servicos", desc: "CRUD de itens com código e unidade" },
              { label: "ComposiçÍµes", path: "/sistema/iccri/composicoes", desc: "Materiais + MDO + Equipamentos por serviço" },
              { label: "Preços Regionais", path: "/sistema/iccri/precos", desc: "Tabela por estado · capital/interior" },
            ].map(({ label, path, desc }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left transition-colors group"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{label}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <ArrowRight size={14} className="text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-200 transition-colors shrink-0" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm uppercase tracking-wide">
            IntegraçÍo ObraEasy
          </h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">Base compartilhada</p>
                <p className="text-xs text-green-700 dark:text-green-400">
                  WGEasy e ObraEasy usam o mesmo Supabase. AlteraçÍµes aqui refletem imediatamente no EVF.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-blue-800 dark:text-blue-300">Fórmula de preço</p>
                <p className="text-xs text-blue-700 dark:text-blue-400">
                  P = (MDO + MAT + EQP) Í— Fator Regional Í— ÍÍndice ICCRI Í— Margem
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">AtualizaçÍo mensal</p>
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  Atualizar o ÍÍndice ICCRI todo mÍªs via tabela <code>iccri_indice</code> corrige todos os preços automaticamente.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}









