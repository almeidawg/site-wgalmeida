// EasyRealState — Dashboard de Cálculo e Consulta de m² por Bairro
import React, { useState, useEffect, useMemo } from "react";
import { BarChart3, MapPin, Search, TrendingUp, TrendingDown, Minus, Database, RefreshCw, Download } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface BairroData {
  bairro: string;
  cidade: string;
  tipologia: string;
  total_transacoes: number;
  valor_m2_medio: number;
  valor_m2_minimo: number;
  valor_m2_maximo: number;
  ultima_transacao: string;
}

interface KPIs {
  total_avaliacoes: number;
  total_cadastros: number;
  m2_medio_sp: number;
  bairros_cobertos: number;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const fmtNum = (v: number) =>
  new Intl.NumberFormat("pt-BR").format(v);

export default function EasyRealStateDashboardCalculoPage() {
  const [dados, setDados] = useState<BairroData[]>([]);
  const [loading, setLoading] = useState(true);
  const [kpis, setKpis] = useState<KPIs>({ total_avaliacoes: 0, total_cadastros: 0, m2_medio_sp: 0, bairros_cobertos: 0 });
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      // Tentar view dedicada primeiro; fallback para agregação direta
      const { data: viewData, error: viewError } = await supabase
        .from("vw_m2_por_bairro" as string)
        .select("*")
        .order("valor_m2_medio", { ascending: false });

      if (!viewError && viewData && viewData.length > 0) {
        setDados(viewData as BairroData[]);
        calcularKPIs(viewData as BairroData[]);
      } else {
        // Fallback: usar real_estate_transacoes diretamente
        const { data: raw } = await supabase
          .from("real_estate_transacoes")
          .select("bairro, cidade, tipo, preco_m2")
          .not("bairro", "is", null)
          .not("preco_m2", "is", null);

        if (raw && raw.length > 0) {
          const agrupado = agruparPorBairro(raw);
          setDados(agrupado);
          calcularKPIs(agrupado);
        }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  function agruparPorBairro(rows: Array<{ bairro: string; cidade: string; tipo: string; preco_m2: number }>): BairroData[] {
    const mapa: Record<string, number[]> = {};
    const meta: Record<string, { cidade: string; tipologia: string }> = {};

    for (const r of rows) {
      const key = `${r.bairro}||${r.tipo}`;
      if (!mapa[key]) {
        mapa[key] = [];
        meta[key] = { cidade: r.cidade || "São Paulo", tipologia: r.tipo };
      }
      if (r.preco_m2) mapa[key].push(r.preco_m2);
    }

    return Object.entries(mapa).map(([key, valores]) => {
      const [bairro] = key.split("||");
      const sorted = [...valores].sort((a, b) => a - b);
      const medio = sorted.reduce((s, v) => s + v, 0) / sorted.length;
      return {
        bairro,
        cidade: meta[key].cidade,
        tipologia: meta[key].tipologia,
        total_transacoes: sorted.length,
        valor_m2_medio: Math.round(medio),
        valor_m2_minimo: Math.round(sorted[0]),
        valor_m2_maximo: Math.round(sorted[sorted.length - 1]),
        ultima_transacao: "",
      };
    }).sort((a, b) => b.valor_m2_medio - a.valor_m2_medio);
  }

  function calcularKPIs(rows: BairroData[]) {
    const totalCadastros = rows.reduce((s, r) => s + r.total_transacoes, 0);
    const m2sp = rows.filter(r => r.cidade === "São Paulo" || !r.cidade);
    const medioSP = m2sp.length > 0
      ? Math.round(m2sp.reduce((s, r) => s + r.valor_m2_medio * r.total_transacoes, 0) / m2sp.reduce((s, r) => s + r.total_transacoes, 0))
      : 0;
    setKpis({
      total_avaliacoes: totalCadastros,
      total_cadastros: totalCadastros,
      m2_medio_sp: medioSP,
      bairros_cobertos: new Set(rows.map(r => r.bairro)).size,
    });
  }

  const dadosFiltrados = useMemo(() => {
    return dados.filter((d) => {
      const matchBusca = !busca || d.bairro.toLowerCase().includes(busca.toLowerCase()) || d.cidade?.toLowerCase().includes(busca.toLowerCase());
      const matchTipo = filtroTipo === "todos" || d.tipologia === filtroTipo;
      return matchBusca && matchTipo;
    });
  }, [dados, busca, filtroTipo]);

  const tipos = useMemo(() => {
    const set = new Set(dados.map((d) => d.tipologia).filter(Boolean));
    return Array.from(set).sort();
  }, [dados]);

  // Mediana para classificar
  const medianaGeral = useMemo(() => {
    if (dadosFiltrados.length === 0) return 0;
    const sorted = [...dadosFiltrados].sort((a, b) => a.valor_m2_medio - b.valor_m2_medio);
    return sorted[Math.floor(sorted.length / 2)].valor_m2_medio;
  }, [dadosFiltrados]);

  function variacaoIcon(m2: number) {
    if (m2 > medianaGeral * 1.2) return <TrendingUp size={14} className="text-green-500" />;
    if (m2 < medianaGeral * 0.8) return <TrendingDown size={14} className="text-red-500" />;
    return <Minus size={14} className="text-gray-400" />;
  }

  function exportarCSV() {
    const header = "Bairro,Cidade,Tipologia,Transações,m² Mín,m² Médio,m² Máx\n";
    const rows = dadosFiltrados
      .map((d) => `"${d.bairro}","${d.cidade}","${d.tipologia}",${d.total_transacoes},${d.valor_m2_minimo},${d.valor_m2_medio},${d.valor_m2_maximo}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "m2-por-bairro.csv";
    a.click();
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <header className="mb-8">
        <h1 className="flex items-center gap-3 text-2xl font-bold text-gray-900">
          <BarChart3 className="text-orange-500" size={28} />
          Dashboard de Precificação
          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full font-medium">
            m² por Bairro
          </span>
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulte o valor médio do m² por bairro, tipologia e padrão — dados agregados das transações cadastradas
        </p>
      </header>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <KPICard
          label="Transações cadastradas"
          value={fmtNum(kpis.total_cadastros)}
          icon={<Database size={20} className="text-blue-500" />}
          color="blue"
        />
        <KPICard
          label="m² médio SP"
          value={kpis.m2_medio_sp > 0 ? `R$${fmtNum(kpis.m2_medio_sp)}` : "—"}
          icon={<TrendingUp size={20} className="text-orange-500" />}
          color="orange"
        />
        <KPICard
          label="Bairros cobertos"
          value={fmtNum(kpis.bairros_cobertos)}
          icon={<MapPin size={20} className="text-green-500" />}
          color="green"
        />
        <KPICard
          label="Avaliações realizadas"
          value={fmtNum(kpis.total_avaliacoes)}
          icon={<BarChart3 size={20} className="text-purple-500" />}
          color="purple"
        />
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-b border-gray-100">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar bairro, cidade..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          >
            <option value="todos">Todas as tipologias</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={carregarDados}
            className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            <RefreshCw size={14} /> Atualizar
          </button>
          <button
            onClick={exportarCSV}
            className="flex items-center gap-1 px-3 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600"
          >
            <Download size={14} /> Exportar
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Carregando dados...
          </div>
        ) : dadosFiltrados.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <Database size={40} className="mb-3 opacity-30" />
            <p className="font-medium">Nenhum dado encontrado</p>
            <p className="text-sm mt-1">Cadastre transações para ver os dados por bairro</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Bairro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Cidade</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Tipologia</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">m² Mínimo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">m² Médio</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">m² Máximo</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Transações</th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Mercado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dadosFiltrados.map((d, i) => (
                  <tr key={i} className="hover:bg-orange-50/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.bairro}</td>
                    <td className="px-4 py-3 text-gray-500">{d.cidade || "São Paulo"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                        {d.tipologia}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(d.valor_m2_minimo)}</td>
                    <td className="px-4 py-3 text-right font-semibold text-gray-800">{fmt(d.valor_m2_medio)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{fmt(d.valor_m2_maximo)}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{d.total_transacoes}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        {variacaoIcon(d.valor_m2_medio)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
          <span>{dadosFiltrados.length} bairro(s) exibido(s)</span>
          <span>Fonte: transações cadastradas · {new Date().toLocaleDateString("pt-BR")}</span>
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: "blue" | "orange" | "green" | "purple";
}) {
  const bg: Record<string, string> = {
    blue: "bg-blue-50",
    orange: "bg-orange-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
  };
  return (
    <div className={`${bg[color]} rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500">{label}</span>
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}
