/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/FinanceiroPage.tsx
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, Link } from "react-router-dom";
import {
  listarFinanceiro,
  deletarLancamento,
  LancamentoFinanceiro,
} from "@/lib/financeiroApi";
import { atualizarStatusAprovacao } from "@/lib/financeiroWorkflow";
import {
  exportarFinanceiroPDF,
  exportarFinanceiroExcel,
} from "@/lib/financeiroExport";
import { downloadFinanceiroTemplate } from "@/lib/templates/financeiroTemplate";
import { useAuth } from "@/auth/AuthContext";
import ResponsiveTable from "@/components/ResponsiveTable";
import type { Row } from "@/components/ResponsiveTable";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSwipe } from "@/hooks/useSwipe";
import {
  DollarSign,
  Plus,
  Download,
  FileText,
  FileSpreadsheet,
  List,
  LayoutGrid,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  Eye,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [dados, setDados] = useState<LancamentoFinanceiro[]>([]);
  const [loading, setLoading] = useState(true);
  const [modoVisualizacao, setModoVisualizacao] = useState<"lista" | "grid">("lista");
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate(-1),
  });

  // Calcular estatísticas
  const totalReceitas = dados.filter(d => String(d.tipo).toLowerCase() === "receita").reduce((acc, d) => acc + Number(d.valor_total || 0), 0);
  const totalDespesas = dados.filter(d => String(d.tipo).toLowerCase() === "despesa").reduce((acc, d) => acc + Number(d.valor_total || 0), 0);
  const totalPendentes = dados.filter(d => d.approval_status !== "aprovado").length;
  const totalAprovados = dados.filter(d => d.approval_status === "aprovado").length;

  const columns = [
    { label: "DescriçÍo", key: "descricao" },
    {
      label: "Valor",
      key: "valor_total",
      render: (val: any) => `R$ ${Number(val || 0).toFixed(2)}`,
    },
    {
      label: "Tipo",
      key: "tipo",
      render: (val: any) => val?.charAt(0).toUpperCase() + val?.slice(1),
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) =>
        val ? `${val.charAt(0).toUpperCase()}${val.slice(1)}` : "-",
    },
    { label: "Vencimento", key: "vencimento" },
    { label: "Núcleo", key: "nucleo" },
    {
      label: "AprovaçÍo",
      key: "approval_status",
      render: (val: any) =>
        val ? `${val.charAt(0).toUpperCase()}${val.slice(1)}` : "Pendente",
    },
  ];

  async function carregar() {
    setLoading(true);
    try {
      const lista = await listarFinanceiro();
      setDados(lista);
    } catch (err) {
      console.error("Erro ao carregar financeiro:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(id: string) {
    if (!confirm("Excluir esse lançamento?")) return;
    try {
      await deletarLancamento(id);
      carregar();
    } catch (error) {
      console.error("Erro ao excluir lançamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir lançamento. Tente novamente." });
    }
  }

  async function aprovar(id: string) {
    if (!user?.id) return toast({ title: "Usuário nÍo identificado." });
    try {
      await atualizarStatusAprovacao(id, "aprovado", user.id);
      carregar();
    } catch (error) {
      console.error("Erro ao aprovar lançamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aprovar lançamento. Tente novamente." });
    }
  }

  async function rejeitar(id: string) {
    if (!user?.id) return toast({ title: "Usuário nÍo identificado." });
    try {
      await atualizarStatusAprovacao(id, "rejeitado", user.id);
      carregar();
    } catch (error) {
      console.error("Erro ao rejeitar lançamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao rejeitar lançamento. Tente novamente." });
    }
  }

  function handleExportPDF() {
    exportarFinanceiroPDF(dados);
  }

  function handleExportExcel() {
    exportarFinanceiroExcel(dados);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando financeiro...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-white p-3 sm:p-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* HEADER */}
      <div className="mb-4 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-12 sm:h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Financeiro</h1>
              <p className="text-[11px] sm:text-[12px] text-gray-600 hidden sm:block">Controle de lancamentos, aprovacoes e exportacao de relatorios</p>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
            <button
              onClick={() => downloadFinanceiroTemplate()}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] sm:text-[14px] font-normal hover:bg-gray-50 transition-all"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Modelo</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] sm:text-[14px] font-normal hover:bg-gray-50 transition-all"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">PDF</span>
            </button>
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-2.5 py-2 sm:px-4 sm:py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[13px] sm:text-[14px] font-normal hover:bg-gray-50 transition-all"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Excel</span>
            </button>
            <Link
              to="/financeiro/novo"
              className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] sm:text-[14px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="hidden xs:inline">Novo</span>
              <span className="hidden sm:inline"> Lancamento</span>
            </Link>
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setModoVisualizacao("lista")}
                className={`p-2 sm:p-2.5 transition-all ${modoVisualizacao === "lista" ? "bg-[#16a34a] text-white" : "bg-white text-gray-400"}`}
              >
                <List className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <button
                onClick={() => setModoVisualizacao("grid")}
                className={`p-2 sm:p-2.5 transition-all ${modoVisualizacao === "grid" ? "bg-[#16a34a] text-white" : "bg-white text-gray-400"}`}
              >
                <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CARDS DE ESTATISTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className="bg-white rounded-lg px-2 py-2 sm:px-3 border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 sm:p-1.5 bg-green-50 rounded-md flex-shrink-0">
                <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
              </div>
              <span className="text-[11px] text-gray-500">Receitas</span>
            </div>
            <span className="text-[13px] sm:text-[16px] font-light text-gray-900 truncate">R$ {totalReceitas.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-2 py-2 sm:px-3 border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 sm:p-1.5 bg-red-50 rounded-md flex-shrink-0">
                <TrendingDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
              </div>
              <span className="text-[11px] text-gray-500">Despesas</span>
            </div>
            <span className="text-[13px] sm:text-[16px] font-light text-gray-900 truncate">R$ {totalDespesas.toFixed(2)}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-2 py-2 sm:px-3 border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 sm:p-1.5 bg-yellow-50 rounded-md flex-shrink-0">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" />
              </div>
              <span className="text-[11px] text-gray-500">Pendentes</span>
            </div>
            <span className="text-[13px] sm:text-[16px] font-light text-gray-900">{totalPendentes}</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-2 py-2 sm:px-3 border border-gray-100 shadow-sm">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <div className="p-1 sm:p-1.5 bg-blue-50 rounded-md flex-shrink-0">
                <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
              </div>
              <span className="text-[11px] text-gray-500">Aprovados</span>
            </div>
            <span className="text-[13px] sm:text-[16px] font-light text-gray-900">{totalAprovados}</span>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <ResponsiveTable
          columns={columns}
          data={dados as unknown as Row[]}
          emptyMessage="Nenhum registro encontrado."
          onRowClick={(item) => navigate(`/financeiro/editar/${String(item.id || "")}`)}
        />
      </div>
    </div>
  );
}
