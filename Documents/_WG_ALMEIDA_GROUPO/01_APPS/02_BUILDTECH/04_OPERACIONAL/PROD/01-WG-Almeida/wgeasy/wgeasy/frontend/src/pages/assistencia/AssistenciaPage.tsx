/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { Wrench, Plus, Clock, Settings, CheckCircle, DollarSign, Eye, Pencil, Trash2, Play, Check } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  listarOS,
  deletarOS,
  alterarStatusOS,
  obterEstatisticasOS,
  type OrdemServicoCompleta,
  type OSEstatisticas,
} from "@/lib/assistenciaApi";
import type { StatusOS, PrioridadeOS } from "@/types/assistenciaTecnica";
import {
  STATUS_OS_LABELS,
  STATUS_OS_COLORS,
  PRIORIDADE_LABELS,
  PRIORIDADE_COLORS,
  formatarValor,
  formatarData,
  getStatusOSIcon,
  getPrioridadeIcon,
  getUrgenciaOS,
} from "@/types/assistenciaTecnica";
import ResponsiveTable from "@/components/ResponsiveTable";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useSwipe } from "@/hooks/useSwipe";

export default function AssistenciaPage() {
  const { toast } = useToast();
  const [ordens, setOrdens] = useState<OrdemServicoCompleta[]>([]);
  const [stats, setStats] = useState<OSEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("");
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>("");
  const isMobile = useMediaQuery("(max-width: 768px)");
  const navigate = useNavigate();
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate(-1),
  });

  const columns = [
    {
      label: "Número",
      key: "numero",
      render: (val: any, row: OrdemServicoCompleta) => (
        <div className="flex items-center gap-2">
          <span>{getStatusOSIcon(row.status)}</span>
          <span className="font-mono">{val}</span>
        </div>
      ),
    },
    {
      label: "Cliente",
      key: "cliente",
      render: (val: any) => val?.nome || "-",
    },
    { label: "Título", key: "titulo" },
    {
      label: "Técnico",
      key: "tecnico",
      render: (val: any) => val?.nome || "-",
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) => (
        (() => {
          const status = val as StatusOS;
          return (
        <span
          className="px-2 py-1 rounded text-xs text-white"
          style={{ backgroundColor: STATUS_OS_COLORS[status] }}
        >
          {STATUS_OS_LABELS[status]}
        </span>
          );
        })()
      ),
    },
    {
      label: "Prioridade",
      key: "prioridade",
      render: (val: any) => (
        (() => {
          const prioridade = val as PrioridadeOS;
          return (
        <span
          className="px-2 py-1 rounded text-xs text-white flex items-center gap-1 w-fit"
          style={{ backgroundColor: PRIORIDADE_COLORS[prioridade] }}
        >
          <span>{getPrioridadeIcon(prioridade)}</span>
          <span>{PRIORIDADE_LABELS[prioridade]}</span>
        </span>
          );
        })()
      ),
    },
    {
      label: "Abertura",
      key: "data_abertura",
      render: (val: any) => formatarData(val),
    },
    {
      label: "Valor",
      key: "valor_total",
      render: (val: any) => formatarValor(val),
    },
  ];

  async function carregar() {
    setLoading(true);
    try {
      const [ordensData, statsData] = await Promise.all([
        listarOS(),
        obterEstatisticasOS(),
      ]);
      setOrdens(ordensData);
      setStats(statsData);
    } catch (err) {
      console.error("Erro ao carregar ordens de serviço:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(id: string) {
    if (!confirm("Excluir esta ordem de serviço?")) return;
    try {
      await deletarOS(id);
      carregar();
    } catch (err) {
      console.error("Erro ao deletar OS:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao deletar OS" });
    }
  }

  async function mudarStatus(id: string, novoStatus: StatusOS) {
    try {
      await alterarStatusOS(id, novoStatus);
      carregar();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao alterar status" });
    }
  }

  let ordensFiltradas = ordens;
  if (filtroStatus) {
    ordensFiltradas = ordensFiltradas.filter(
      (os) => os.status === filtroStatus
    );
  }
  if (filtroPrioridade) {
    ordensFiltradas = ordensFiltradas.filter(
      (os) => os.prioridade === filtroPrioridade
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#F59E0B] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando ordens de servico...</p>
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F59E0B] to-[#D97706] rounded-xl flex items-center justify-center shadow-lg">
              <Wrench className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Assistencia Tecnica</h1>
              <p className="text-[12px] text-gray-600">Gerencie ordens de servico, atendimentos e manutencoes</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/assistencia/novo"
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#F59E0B] to-[#D97706] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Nova OS
            </Link>
          </div>
        </div>
      </div>

      {/* CARDS DE ESTATISTICAS */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <Wrench className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.total_os}</span>
              <span className="text-[12px] text-gray-500">Total</span>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-50 rounded-md">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.os_abertas}</span>
              <span className="text-[12px] text-gray-500">Abertas</span>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-50 rounded-md">
                <Settings className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.os_em_atendimento}</span>
              <span className="text-[12px] text-gray-500">Atendimento</span>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.os_concluidas}</span>
              <span className="text-[12px] text-gray-500">Concluidas</span>
            </div>
          </div>
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-emerald-50 rounded-md">
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{formatarValor(stats.valor_total_mes)}</span>
              <span className="text-[12px] text-gray-500">Mes</span>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500">Status:</span>
            <button
              onClick={() => setFiltroStatus("")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroStatus === ""
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setFiltroStatus("aberta")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroStatus === "aberta"
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Abertas
            </button>
            <button
              onClick={() => setFiltroStatus("em_atendimento")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroStatus === "em_atendimento"
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Atendimento
            </button>
            <button
              onClick={() => setFiltroStatus("concluida")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroStatus === "concluida"
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Concluidas
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-gray-500">Prioridade:</span>
            <button
              onClick={() => setFiltroPrioridade("")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroPrioridade === ""
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFiltroPrioridade("urgente")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroPrioridade === "urgente"
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Urgentes
            </button>
            <button
              onClick={() => setFiltroPrioridade("alta")}
              className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
                filtroPrioridade === "alta"
                  ? "bg-[#F59E0B] text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Alta
            </button>
          </div>
        </div>
      </div>

      {/* TABELA */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <ResponsiveTable
          columns={columns}
          data={ordensFiltradas}
          emptyMessage="Nenhuma ordem de servico encontrada."
          onRowClick={(os: OrdemServicoCompleta) => navigate(`/assistencia/detalhe/${os.id}`)}
          actions={(os: OrdemServicoCompleta) => (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/assistencia/detalhe/${os.id}`); }}
                className="p-1.5 text-gray-400 hover:text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-all"
                title="Visualizar"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navigate(`/assistencia/editar/${os.id}`); }}
                className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                title="Editar"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {os.status === "aberta" && (
                <button
                  onClick={(e) => { e.stopPropagation(); mudarStatus(os.id, "em_atendimento"); }}
                  className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"
                  title="Iniciar Atendimento"
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              {(os.status === "em_atendimento" || os.status === "aguardando_cliente") && (
                <button
                  onClick={(e) => { e.stopPropagation(); mudarStatus(os.id, "concluida"); }}
                  className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                  title="Concluir"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); remover(os.id); }}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>
    </div>
  );
}