/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { formatarMoeda } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  AlertCircle,
  Users,
  Wrench,
  Package,
  ShoppingCart,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  BarChart3,
  Download,
  Sun,
  Moon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { listarFinanceiro } from "@/lib/financeiroApi";
import { obterResumoDividas, type ResumoDividas } from "@/lib/dividasApi";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { useToast } from "@/components/ui/use-toast";
import styles from "./FinanceiroDashboardNew.module.css";

// Cores dos núcleos WG
const NUCLEO_COLORS = {
  arquitetura: "#5E9B94", // Verde Mineral
  engenharia: "#2B4580", // Azul Técnico
  marcenaria: "#8B5E3C", // Marrom Carvalho
};

// Cores das categorias
const CATEGORIA_COLORS = {
  mao_de_obra: "#F25C26", // Laranja WG
  servicos: "#2B4580", // Azul
  produtos: "#5E9B94", // Verde
  materiais: "#8B5E3C", // Marrom
};

type DashboardData = {
  resumo: {
    saldoTotal: number;
    custosTotal: number;
    receitasTotal: number;
    projetosAtivos: number;
    valorContratosAtivos: number;
    contratosConcluidos: number;
    valorContratosConcluidos: number;
  };
  porNucleo: {
    nucleo: string;
    cor: string;
    receitas: number;
    custos: number;
    margem: number;
    projetos: number;
  }[];
  porCategoria: {
    categoria: string;
    nome: string;
    cor: string;
    valor: number;
    icone: string;
    percentual: number;
  }[];
  fluxoMensal: { mes: string; entrada: number; saida: number; saldo: number }[];
  alertas: { tipo: string; mensagem: string }[];
  topProjetos: { nome: string; valor: number; nucleo: string }[];
};

// Períodos disponíveis para filtro do gráfico
const PERIODOS_FLUXO = [
  { id: "3m", label: "3 Meses" },
  { id: "6m", label: "6 Meses" },
  { id: "ytd", label: "Este Ano" },
  { id: "12m", label: "12 Meses" },
  { id: "all", label: "Todos" },
];

export default function FinanceiroDashboardNew() {
  const { toast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [resumoDividas, setResumoDividas] = useState<ResumoDividas | null>(null);
  const [nucleoFiltro, setNucleoFiltro] = useState<string>("todos");
  const [periodoFluxo, setPeriodoFluxo] = useState<string>("all");
  const [temaEscuro, setTemaEscuro] = useState<boolean>(false);

  // Filtrar dados do fluxo mensal baseado no período selecionado
  const fluxoMensalFiltrado = useMemo(() => {
    if (!dashboardData?.fluxoMensal) return [];
    const dados = dashboardData.fluxoMensal;

    switch (periodoFluxo) {
      case "3m":
        return dados.slice(-3);
      case "6m":
        return dados.slice(-6);
      case "ytd": {
        const mesAtual = new Date().getMonth() + 1;
        return dados.slice(-mesAtual);
      }
      case "12m":
        return dados.slice(-12);
      case "all":
      default:
        return dados;
    }
  }, [dashboardData?.fluxoMensal, periodoFluxo]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      let transacoes: {
        valor_total: number;
        tipo: string;
        data_competencia: string;
        categoria_id: string | null;
        unidade_negocio: string | null;
        nucleo: string | null;
        descricao: string;
        status?: string | null;
      }[] = [];

      const lancamentos = await listarFinanceiro();
      transacoes = (lancamentos || []).map((l: any) => ({
        valor_total: Number(l.valor_total || 0),
        tipo: String(l.tipo || ""),
        data_competencia: String(l.data_competencia || ""),
        categoria_id: l.categoria_id || null,
        unidade_negocio: l.unidade_negocio || null,
        nucleo: l.nucleo || null,
        descricao: String(l.descricao || ""),
        status: l.status || null,
      }));

      if (import.meta.env.DEV) console.log("✅ Total de lançamentos carregados:", transacoes.length); // dev

      // Buscar contratos ativos
      // NOTA: A tabela contratos usa 'unidade_negocio' (nÍo tem campo 'nucleo')
      const { data: contratos, error: contratosError } = await supabase
        .from("contratos")
        .select("id, status, valor_total, unidade_negocio, numero, cliente_id")
        .not("status", "in", "(rascunho,concluido,cancelado)");

      // Buscar clientes cadastrados (histórico = contratos concluídos antes do sistema)
      // NOTA: O tipo está em MAIÚSCULO no banco de dados
      const { count: totalClientes } = await supabase
        .from("pessoas")
        .select("id", { count: "exact", head: true })
        .eq("tipo", "CLIENTE")
        .eq("ativo", true);

      // Buscar contratos concluídos (a partir de agora, quando o sistema estiver rodando)
      const { count: totalContratosConcluidos } = await supabase
        .from("contratos")
        .select("id", { count: "exact", head: true })
        .in("status", [
          "concluido",
          "Concluído",
          "finalizado",
          "Finalizado",
          "entregue",
          "Entregue",
        ]);

      // Buscar categorias
      const { data: categorias } = await supabase
        .from("fin_categories")
        .select("id, name, kind");

      // Buscar solicitações pendentes
      const { data: solicitacoes } = await supabase
        .from("solicitacoes_pagamento")
        .select("status, valor")
        .eq("status", "Pendente");

      if (contratosError) throw contratosError;

      // Processar totais
      const totalEntradas = (transacoes || [])
        .filter((t) => t.tipo === "entrada")
        .reduce((acc, t) => acc + Number(t.valor_total), 0);

      const totalSaidas = (transacoes || [])
        .filter((t) => t.tipo === "saida")
        .reduce((acc, t) => acc + Number(t.valor_total), 0);

      // Processar dados por núcleo
      // Processar dados por núcleo
      // NOTA: contratos usa 'unidade_negocio', transacoes usa 'nucleo' ou 'unidade_negocio'
      const nucleos = ["arquitetura", "engenharia", "marcenaria"];
      const porNucleo = nucleos.map((nucleoKey) => {
        const contratosNucleo = (contratos || []).filter((c) =>
          normalizeSearchTerm(c.unidade_negocio || "").includes(nucleoKey)
        );
        // Transacoes podem ter 'nucleo' ou 'unidade_negocio' preenchido
        const transacoesNucleo = (transacoes || []).filter((t) =>
          normalizeSearchTerm(t.nucleo || "").includes(nucleoKey) ||
          normalizeSearchTerm(t.unidade_negocio || "").includes(nucleoKey)
        );

        const receitas = transacoesNucleo
          .filter((t) => t.tipo === "entrada")
          .reduce((acc, t) => acc + Number(t.valor_total), 0);

        const custos = transacoesNucleo
          .filter((t) => t.tipo === "saida")
          .reduce((acc, t) => acc + Number(t.valor_total), 0);

        return {
          nucleo: nucleoKey.charAt(0).toUpperCase() + nucleoKey.slice(1),
          cor: NUCLEO_COLORS[nucleoKey as keyof typeof NUCLEO_COLORS],
          receitas,
          custos,
          margem: receitas > 0 ? ((receitas - custos) / receitas) * 100 : 0,
          projetos: contratosNucleo.length,
        };
      });

      // Processar por categoria (MÍo de Obra, Serviços, Produtos, Materiais)
      const categoriasConfig = [
        {
          key: "mao_de_obra",
          nome: "MÍo de Obra",
          icone: "users",
          termos: [
            "mÍo de obra",
            "mao de obra",
            "salario",
            "equipe",
            "funcionario",
          ],
        },
        {
          key: "servicos",
          nome: "Serviços",
          icone: "wrench",
          termos: ["serviço", "servico", "instalaçÍo", "montagem", "execuçÍo"],
        },
        {
          key: "produtos",
          nome: "Produtos",
          icone: "shopping",
          termos: [
            "produto",
            "equipamento",
            "móvel",
            "movel",
            "eletrodoméstico",
          ],
        },
        {
          key: "materiais",
          nome: "Materiais",
          icone: "package",
          termos: ["material", "insumo", "matéria", "madeira", "ferragem"],
        },
      ];

      const totalCustos = totalSaidas || 1;
      const porCategoria = categoriasConfig.map((cat) => {
        const termosNormalizados = cat.termos.map(normalizeSearchTerm);
        const valor = (transacoes || [])
          .filter((t) => t.tipo === "saida")
          .filter((t) => {
            const desc = normalizeSearchTerm(t.descricao || "");
            const catId = normalizeSearchTerm(t.categoria_id || "");
            return termosNormalizados.some(
              (termo) => desc.includes(termo) || catId.includes(termo)
            );
          })
          .reduce((acc, t) => acc + Number(t.valor_total), 0);

        return {
          categoria: cat.key,
          nome: cat.nome,
          cor: CATEGORIA_COLORS[cat.key as keyof typeof CATEGORIA_COLORS],
          valor,
          icone: cat.icone,
          percentual: (valor / totalCustos) * 100,
        };
      });

      // Adicionar "Outros" para valores nÍo categorizados
      const valorCategorizado = porCategoria.reduce(
        (acc, c) => acc + c.valor,
        0
      );
      const valorOutros = totalSaidas - valorCategorizado;
      if (valorOutros > 0) {
        porCategoria.push({
          categoria: "outros",
          nome: "Outros",
          cor: "#94A3B8",
          valor: valorOutros,
          icone: "circle",
          percentual: (valorOutros / totalCustos) * 100,
        });
      }

      // Fluxo mensal com saldo acumulado
      const fluxoMensal: {
        [key: string]: { mes: string; entrada: number; saida: number };
      } = {};
      (transacoes || []).forEach((t) => {
        const date = new Date(t.data_competencia);
        const mes = date.toLocaleString("pt-BR", { month: "short" });
        if (!fluxoMensal[mes]) fluxoMensal[mes] = { mes, entrada: 0, saida: 0 };
        if (t.tipo === "entrada")
          fluxoMensal[mes].entrada += Number(t.valor_total);
        else fluxoMensal[mes].saida += Number(t.valor_total);
      });

      const fluxoMensalArray = Object.values(fluxoMensal).map(
        (item, index, arr) => {
          const saldoAcumulado = arr
            .slice(0, index + 1)
            .reduce((acc, curr) => acc + curr.entrada - curr.saida, 0);
          return { ...item, saldo: saldoAcumulado };
        }
      );

      // Top projetos
      const topProjetos = (contratos || []).slice(0, 5).map((c) => ({
        nome: c.numero || "Projeto",
        valor: Number(c.valor_total || 0),
        nucleo: c.unidade_negocio || "Geral",
      }));

      // Contratos ativos
      const contratosAtivos = contratos || [];
      const valorTotalContratosAtivos = contratosAtivos.reduce(
        (acc, c) => acc + Number(c.valor_total || 0),
        0
      );

      // Total de contratos concluídos = Clientes cadastrados (histórico) + Contratos finalizados (sistema)
      const totalClientesCadastrados =
        (totalClientes || 0) + (totalContratosConcluidos || 0);

      const receitaEfetiva = totalEntradas;

      // Alertas
      const solicitacoesPendentesCount = (solicitacoes || []).length;
      const valorSolicitacoesPendentes = (solicitacoes || []).reduce(
        (acc, s) => acc + Number(s.valor || 0),
        0
      );

      const alertas = [];
      if (solicitacoesPendentesCount > 0) {
        alertas.push({
          tipo: "warning",
          mensagem: `${solicitacoesPendentesCount} solicitações pendentes (${formatarMoeda(valorSolicitacoesPendentes)})`,
        });
      }
      if (contratosAtivos.length > 10) {
        alertas.push({
          tipo: "info",
          mensagem: `${contratosAtivos.length} contratos ativos simultaneamente`,
        });
      }
      const margemGeral =
        receitaEfetiva > 0
          ? ((receitaEfetiva - totalSaidas) / receitaEfetiva) * 100
          : 0;
      if (margemGeral < 20) {
        alertas.push({
          tipo: "warning",
          mensagem: `Margem geral baixa: ${margemGeral.toFixed(1)}%`,
        });
      } else {
        alertas.push({
          tipo: "success",
          mensagem: `Margem saudável: ${margemGeral.toFixed(1)}%`,
        });
      }

      setDashboardData({
        resumo: {
          saldoTotal: receitaEfetiva - totalSaidas,
          custosTotal: totalSaidas,
          receitasTotal: receitaEfetiva,
          projetosAtivos: contratosAtivos.length,
          valorContratosAtivos: valorTotalContratosAtivos,
          contratosConcluidos: totalClientesCadastrados,
          valorContratosConcluidos: 0, // Histórico - valor nÍo calculado
        },
        porNucleo,
        porCategoria,
        fluxoMensal: fluxoMensalArray,
        alertas,
        topProjetos,
      });

      // Carregar resumo de dívidas
      try {
        const divRes = await obterResumoDividas();
        setResumoDividas(divRes);
      } catch (divErr) {
        console.warn("NÍo foi possível carregar resumo de dívidas:", divErr);
      }
    } catch (error: any) {
      console.error("Dashboard Error:", error);
      toast({ variant: "destructive", title: "Erro ao carregar dashboard", description: "NÍo foi possível carregar os dados financeiros. Tente novamente." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading || !dashboardData) {
    return (
      <div className="flex items-center justify-center h-full pt-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-wg-primary"></div>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return formatarMoeda(value);
  };

  const getCategoriaIcon = (icone: string) => {
    switch (icone) {
      case "users":
        return <Users className="w-5 h-5" />;
      case "wrench":
        return <Wrench className="w-5 h-5" />;
      case "shopping":
        return <ShoppingCart className="w-5 h-5" />;
      case "package":
        return <Package className="w-5 h-5" />;
      default:
        return <DollarSign className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Dashboard Executivo - Gráfico + KPIs na primeira linha */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`rounded-2xl shadow-2xl p-6 transition-all duration-300 ${
          temaEscuro
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
            : "bg-white text-gray-900 border border-gray-200"
        }`}
      >
        {/* Header com título e filtros */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl shadow-lg ${
                temaEscuro
                  ? "bg-gradient-to-br from-emerald-500 to-teal-600"
                  : "bg-gradient-to-br from-orange-500 to-amber-500"
              }`}
            >
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2
                className={`text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight ${
                  temaEscuro ? "text-white" : "text-gray-900"
                }`}
              >
                Dashboard Financeiro
              </h2>
              <p
                className={`text-[12px] ${
                  temaEscuro ? "text-slate-400" : "text-gray-500"
                }`}
              >
                VisÍo executiva consolidada
              </p>
            </div>
          </div>

          {/* Filtros de Período */}
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-1 rounded-lg p-1 ${
                temaEscuro
                  ? "bg-slate-700/50"
                  : "bg-gray-100 border border-gray-200"
              }`}
            >
              {PERIODOS_FLUXO.map((periodo) => (
                <button
                  key={periodo.id}
                  type="button"
                  onClick={() => setPeriodoFluxo(periodo.id)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-normal transition-all ${
                    periodoFluxo === periodo.id
                      ? temaEscuro
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md"
                        : "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md"
                      : temaEscuro
                      ? "text-slate-300 hover:text-white hover:bg-slate-600/50"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  {periodo.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTemaEscuro(!temaEscuro)}
              className={`p-2 rounded-lg transition-all ${
                temaEscuro
                  ? "bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200"
              }`}
              title={temaEscuro ? "Tema claro" : "Tema escuro"}
            >
              {temaEscuro ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              onClick={fetchData}
              className={`p-2 rounded-lg transition-all ${
                temaEscuro
                  ? "bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200"
              }`}
              title="Atualizar dados"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              className={`p-2 rounded-lg transition-all ${
                temaEscuro
                  ? "bg-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-600/50"
                  : "bg-gray-100 text-gray-600 hover:text-gray-900 hover:bg-gray-200 border border-gray-200"
              }`}
              title="Exportar dados"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5 KPIs em linha - Degradê Laranja WG Progressivo */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {/* Saldo Atual - Laranja WG Escuro */}
          <div
            className="rounded-xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(to bottom right, #C2410C, #EA580C)",
            }}
          >
            <div className={`rounded-xl p-4 shadow-lg ${styles.kpiSaldoAtual}`}>
              <div>
                <p className="text-orange-200 text-[12px] font-normal">
                  Saldo Atual
                </p>
                <p className="text-[18px] font-light text-white mt-1">
                  {formatCurrency(dashboardData.resumo.saldoTotal)}
                </p>
                <div className="flex items-center mt-1 text-orange-200 text-[12px]">
                  <ArrowUpRight className="w-3 h-3 mr-1" />
                  <span>+12.5% mês</span>
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <DollarSign className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Receitas - Laranja WG Médio-Escuro */}
          <div
            className="rounded-xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(to bottom right, #EA580C, #F25C26)",
            }}
          >
            <div className={`rounded-xl p-4 shadow-lg ${styles.kpiReceitas}`}>
              <div>
                <p className="text-orange-100 text-[12px] font-normal">Receitas</p>
                <p className="text-[18px] font-light text-white mt-1">
                  {formatCurrency(dashboardData.resumo.receitasTotal)}
                </p>
                <div className="flex items-center mt-1 text-orange-100 text-[12px]">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  <span>{dashboardData.resumo.projetosAtivos} contratos</span>
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Custos Totais - Laranja WG */}
          <div
            className="rounded-xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(to bottom right, #F25C26, #FB923C)",
            }}
          >
            <div
              className={`rounded-xl p-4 shadow-lg ${styles.kpiCustosTotais}`}
            >
              <div>
                <p className="text-orange-100 text-[12px] font-normal">
                  Custos Totais
                </p>
                <p className="text-[18px] font-light text-white mt-1">
                  {formatCurrency(dashboardData.resumo.custosTotal)}
                </p>
                <div className="flex items-center mt-1 text-orange-100 text-[12px]">
                  <ArrowDownRight className="w-3 h-3 mr-1" />
                  <span>4 categorias</span>
                </div>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <TrendingDown className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>

          {/* Contratos Ativos - Laranja Claro */}
          <div
            className="rounded-xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(to bottom right, #FB923C, #FDBA74)",
            }}
          >
            <div
              className={`rounded-xl p-4 shadow-lg ${styles.kpiContratosAtivos}`}
            >
              <div>
                <p className="text-orange-900 text-[12px] font-normal">
                  Contratos Ativos
                </p>
                <p className="text-[18px] font-light text-orange-950 mt-1">
                  {dashboardData.resumo.projetosAtivos}
                </p>
                <p className="text-orange-800 text-[12px] mt-1">
                  {formatCurrency(dashboardData.resumo.valorContratosAtivos)}
                </p>
              </div>
              <div className="p-2 bg-white/30 rounded-lg">
                <Building2 className="w-5 h-5 text-orange-900" />
              </div>
            </div>
          </div>

          {/* Concluídos - Laranja Bem Claro */}
          <div
            className="rounded-xl p-4 shadow-lg"
            style={{
              background: "linear-gradient(to bottom right, #FDBA74, #FED7AA)",
            }}
          >
            <div className={`rounded-xl p-4 shadow-lg ${styles.kpiConcluidos}`}>
              <div>
                <p className="text-orange-900 text-[12px] font-normal">
                  Concluídos
                </p>
                <p className="text-[18px] font-light text-orange-950 mt-1">
                  {dashboardData.resumo.contratosConcluidos}
                </p>
                <p className="text-orange-800 text-[12px] mt-1">
                  Histórico + Sistema
                </p>
              </div>
              <div className="p-2 bg-white/30 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-orange-900" />
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico de Fluxo de Caixa */}
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={fluxoMensalFiltrado}>
            <defs>
              <linearGradient id="colorEntradaExec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
              </linearGradient>
              <linearGradient id="colorSaidaExec" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#F97316" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#F97316" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke={temaEscuro ? "#334155" : "#E5E7EB"}
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              stroke={temaEscuro ? "#64748B" : "#9CA3AF"}
              tick={{ fill: temaEscuro ? "#94A3B8" : "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: temaEscuro ? "#334155" : "#D1D5DB" }}
            />
            <YAxis
              tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              stroke={temaEscuro ? "#64748B" : "#9CA3AF"}
              tick={{ fill: temaEscuro ? "#94A3B8" : "#6B7280", fontSize: 12 }}
              axisLine={{ stroke: temaEscuro ? "#334155" : "#D1D5DB" }}
            />
            <Tooltip
              formatter={(value: any) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: temaEscuro ? "#1E293B" : "#FFFFFF",
                borderRadius: "12px",
                border: temaEscuro ? "1px solid #334155" : "1px solid #E5E7EB",
                boxShadow: temaEscuro
                  ? "0 10px 40px rgba(0,0,0,0.3)"
                  : "0 10px 40px rgba(0,0,0,0.1)",
              }}
              labelStyle={{
                color: temaEscuro ? "#F8FAFC" : "#111827",
                fontWeight: "bold",
              }}
              itemStyle={{ color: temaEscuro ? "#CBD5E1" : "#374151" }}
            />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              formatter={(value) => (
                <span style={{ color: temaEscuro ? "#94A3B8" : "#374151" }}>
                  {value}
                </span>
              )}
            />
            <Area
              type="monotone"
              dataKey="entrada"
              stroke="#10B981"
              fillOpacity={1}
              fill="url(#colorEntradaExec)"
              strokeWidth={3}
              name="Entradas"
              dot={{ fill: "#10B981", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "#10B981",
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
            <Area
              type="monotone"
              dataKey="saida"
              stroke="#F97316"
              fillOpacity={1}
              fill="url(#colorSaidaExec)"
              strokeWidth={3}
              name="Saídas"
              dot={{ fill: "#F97316", strokeWidth: 2, r: 4 }}
              activeDot={{
                r: 6,
                stroke: "#F97316",
                strokeWidth: 2,
                fill: "#fff",
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Cards por Núcleo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {dashboardData.porNucleo.map((nucleo, index) => (
          <motion.div
            key={nucleo.nucleo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + index * 0.1 }}
            className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-3 h-10 rounded-full"
                style={{ backgroundColor: nucleo.cor }}
              />
              <div>
                <h3 className="text-[14px] font-normal text-gray-900">{nucleo.nucleo}</h3>
                <p className="text-[12px] text-gray-500">
                  {nucleo.projetos} projetos ativos
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Receitas</p>
                <p className="text-[18px] font-light text-green-600">
                  {formatCurrency(nucleo.receitas)}
                </p>
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Custos</p>
                <p className="text-[18px] font-light text-red-500">
                  {formatCurrency(nucleo.custos)}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-gray-600">Margem</span>
                <span
                  className={`text-[12px] font-normal ${
                    nucleo.margem >= 20 ? "text-green-600" : "text-orange-500"
                  }`}
                >
                  {nucleo.margem.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="h-2 rounded-full transition-all"
                  style={{
                    width: `${Math.min(nucleo.margem, 100)}%`,
                    backgroundColor:
                      nucleo.margem >= 20 ? "#10B981" : "#F59E0B",
                  }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Custos por Categoria */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
      >
        <h2 className="text-[20px] font-light text-gray-900 mb-6">
          Custos por Categoria
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {dashboardData.porCategoria.map((cat) => (
            <div
              key={cat.categoria}
              className="bg-gray-50 rounded-xl p-4 border-l-4"
              style={{ borderLeftColor: cat.cor }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="p-2 rounded-lg"
                  style={{ backgroundColor: `${cat.cor}20` }}
                >
                  <div style={{ color: cat.cor }}>
                    {getCategoriaIcon(cat.icone)}
                  </div>
                </div>
                <span className="text-[13px] font-normal text-gray-700">
                  {cat.nome}
                </span>
              </div>
              <p className="text-[18px] font-light text-gray-900">
                {formatCurrency(cat.valor)}
              </p>
              <p className="text-[12px] text-gray-500 mt-1">
                {cat.percentual.toFixed(1)}% do total
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Alertas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
      >
        <h2 className="text-[20px] font-light text-gray-900 mb-4 flex items-center gap-2">
          <AlertCircle className="text-wg-primary" size={20} /> Alertas
        </h2>
        <div className="space-y-3">
          {dashboardData.alertas.map((alerta, index) => (
            <div
              key={index}
              className={`flex items-start gap-3 p-3 rounded-lg ${
                alerta.tipo === "warning"
                  ? "bg-yellow-50 border border-yellow-200"
                  : alerta.tipo === "info"
                  ? "bg-blue-50 border border-blue-200"
                  : "bg-green-50 border border-green-200"
              }`}
            >
              <div
                className={`w-2 h-2 rounded-full mt-1.5 ${
                  alerta.tipo === "warning"
                    ? "bg-yellow-500"
                    : alerta.tipo === "info"
                    ? "bg-blue-500"
                    : "bg-green-500"
                }`}
              />
              <p className="text-[12px] text-gray-700">{alerta.mensagem}</p>
            </div>
          ))}
        </div>

        {/* Top Projetos */}
        {dashboardData.topProjetos.length > 0 && (
          <div className="mt-6 pt-4 border-t border-gray-100">
            <h3 className="text-[12px] font-normal text-gray-700 mb-3">
              Top Projetos
            </h3>
            <div className="space-y-2">
              {dashboardData.topProjetos.slice(0, 3).map((projeto, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-[12px]"
                >
                  <span className="text-gray-600 truncate max-w-[150px]">
                    {projeto.nome}
                  </span>
                  <span className="font-normal text-gray-900">
                    {formatCurrency(projeto.valor)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* DistribuiçÍo por Núcleo - Gráfico de Pizza */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <h2 className="text-[20px] font-light text-gray-900 mb-4">
            DistribuiçÍo por Núcleo
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={dashboardData.porNucleo.filter((n) => n.receitas > 0)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="receitas"
                nameKey="nucleo"
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {dashboardData.porNucleo.map((entry) => (
                  <Cell key={entry.nucleo} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <h2 className="text-[20px] font-light text-gray-900 mb-4">
            Comparativo de Custos
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart
              data={dashboardData.porCategoria.filter((c) => c.valor > 0)}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="nome" stroke="#6B7280" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                stroke="#6B7280"
              />
              <Tooltip formatter={(value: any) => formatCurrency(value)} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]}>
                {dashboardData.porCategoria.map((entry) => (
                  <Cell key={entry.categoria} fill={entry.cor} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* SeçÍo Dívidas */}
      {resumoDividas && (resumoDividas.totalAtivas > 0 || resumoDividas.totalProtestadas > 0) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4 }}
          className="bg-white rounded-xl shadow-md border border-gray-100 p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <h2 className="text-[20px] font-light text-gray-900">Dívidas</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <p className="text-[24px] font-light text-blue-700">{resumoDividas.totalAtivas}</p>
              <p className="text-[12px] text-blue-600">Ativas</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3 text-center">
              <p className="text-[24px] font-light text-orange-700">{formatCurrency(resumoDividas.valorTotal)}</p>
              <p className="text-[12px] text-orange-600">Valor Total</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-[24px] font-light text-red-700">{resumoDividas.totalProtestadas}</p>
              <p className="text-[12px] text-red-600">Protestadas</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-[24px] font-light text-yellow-700">{resumoDividas.totalVencidas}</p>
              <p className="text-[12px] text-yellow-600">Vencidas</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

