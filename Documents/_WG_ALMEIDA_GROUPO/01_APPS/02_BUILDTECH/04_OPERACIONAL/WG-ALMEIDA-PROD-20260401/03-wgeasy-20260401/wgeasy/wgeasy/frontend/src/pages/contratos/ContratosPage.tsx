/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Listagem de Contratos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  DollarSign,
  CheckCircle,
  Clock,
  Eye,
  LayoutGrid,
  List,
} from "lucide-react";
import { listarContratos, type Contrato } from "@/lib/contratosApi";
import {
  getStatusContratoColor,
  getStatusContratoLabel,
  getUnidadeNegocioColor,
  getUnidadeNegocioLabel,
} from "@/types/contratos";
import ResponsiveTable from "@/components/ResponsiveTable";
import { TableSkeleton } from "@/components/ui/TableSkeleton";
import EmptyState from "@/components/ui/EmptyState";

// Cor do modulo Contratos
const corModulo = "#F25C26";
const corModuloEscura = "#D94E1F";

type ModoVisualizacao = "lista" | "grid";

export default function ContratosPage() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [modoVisualizacao, setModoVisualizacao] = useState<ModoVisualizacao>("lista");
  const navigate = useNavigate();

  const columns = [
    {
      label: "Numero",
      key: "numero",
      render: (val: any) => <span className="font-normal text-[12px]">{val}</span>,
    },
    { label: "Cliente", key: "cliente_nome" },
    {
      label: "Unidade",
      key: "unidade_negocio",
      render: (val: any) => (
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-normal text-white"
          style={{ backgroundColor: getUnidadeNegocioColor(val) }}
        >
          {getUnidadeNegocioLabel(val)}
        </span>
      ),
    },
    {
      label: "Valor",
      key: "valor_total",
      render: (val: any) => (
        <span className="text-[12px]" style={{ color: corModulo }}>
          R$ {val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) => (
        <span
          className="px-2 py-0.5 rounded-full text-[11px] font-normal"
          style={{
            backgroundColor: `${getStatusContratoColor(val)}20`,
            color: getStatusContratoColor(val),
          }}
        >
          {getStatusContratoLabel(val)}
        </span>
      ),
    },
    {
      label: "Data",
      key: "data_criacao",
      render: (val: any) => (
        <span className="text-[11px] text-gray-400">
          {new Date(val).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  useEffect(() => {
    carregarContratos();
  }, []);

  async function carregarContratos() {
    try {
      setLoading(true);
      const data = await listarContratos();
      setContratos(data);
    } catch (error) {
      console.error("Erro ao carregar contratos:", error);
    } finally {
      setLoading(false);
    }
  }

  const contratosFiltrados =
    filtroStatus === "todos"
      ? contratos
      : contratos.filter((c) => c.status === filtroStatus);

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse" />
          <div className="h-9 w-32 bg-gray-200 rounded-xl animate-pulse" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-gray-50 rounded-xl p-4 space-y-2 border border-gray-100">
              <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-2">
          <TableSkeleton rows={8} columns={5} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 bg-gradient-to-br rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundImage: `linear-gradient(to bottom right, ${corModulo}, ${corModuloEscura})` }}
            >
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Contratos
              </h1>
              <p className="text-[12px] text-gray-600">
                Gerencie todos os contratos do sistema
              </p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2">
            {/* Botao Principal */}
            <button
              onClick={() => navigate("/contratos/novo")}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg text-[13px] font-normal transition-all shadow-lg hover:opacity-90"
              style={{ backgroundImage: `linear-gradient(to right, ${corModulo}, ${corModuloEscura})` }}
            >
              <Plus className="w-5 h-5" />
              Novo Contrato
            </button>

            {/* Seletor de Visualizacao (extrema direita) */}
            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setModoVisualizacao("lista")}
                className={`p-2.5 transition-all ${
                  modoVisualizacao === "lista"
                    ? "text-white"
                    : "bg-white text-gray-400 hover:text-gray-600"
                }`}
                style={modoVisualizacao === "lista" ? { backgroundColor: corModulo } : undefined}
                title="Visualizar em lista"
              >
                <List className="w-5 h-5" />
              </button>
              <button
                onClick={() => setModoVisualizacao("grid")}
                className={`p-2.5 transition-all ${
                  modoVisualizacao === "grid"
                    ? "text-white"
                    : "bg-white text-gray-400 hover:text-gray-600"
                }`}
                style={modoVisualizacao === "grid" ? { backgroundColor: corModulo } : undefined}
                title="Visualizar em grade"
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{contratos.length}</span>
            <span className="text-[12px] text-gray-500">Contratos</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <DollarSign className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">
              R$ {contratos.reduce((acc, c) => acc + c.valor_total, 0).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
            </span>
            <span className="text-[12px] text-gray-500">Total</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">
              {contratos.filter((c) => c.status === "ativo").length}
            </span>
            <span className="text-[12px] text-gray-500">Ativos</span>
          </div>
        </div>

        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 rounded-md">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">
              {contratos.filter((c) => c.status === "aguardando_assinatura").length}
            </span>
            <span className="text-[12px] text-gray-500">Aguardando</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-500 mr-2">Status:</span>
          <button
            onClick={() => setFiltroStatus("todos")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "todos"
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filtroStatus === "todos" ? { backgroundColor: corModulo } : undefined}
          >
            Todos ({contratos.length})
          </button>
          <button
            onClick={() => setFiltroStatus("aguardando_assinatura")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "aguardando_assinatura"
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filtroStatus === "aguardando_assinatura" ? { backgroundColor: corModulo } : undefined}
          >
            Aguardando ({contratos.filter((c) => c.status === "aguardando_assinatura").length})
          </button>
          <button
            onClick={() => setFiltroStatus("ativo")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "ativo"
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filtroStatus === "ativo" ? { backgroundColor: corModulo } : undefined}
          >
            Ativos ({contratos.filter((c) => c.status === "ativo").length})
          </button>
          <button
            onClick={() => setFiltroStatus("em_execucao")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "em_execucao"
                ? "text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
            style={filtroStatus === "em_execucao" ? { backgroundColor: corModulo } : undefined}
          >
            Em Execucao ({contratos.filter((c) => c.status === "em_execucao").length})
          </button>
        </div>
      </div>

      {/* Lista */}
      {contratosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <EmptyState
            emoji="📄"
            title="Nenhum contrato encontrado"
            description="Crie o primeiro contrato ou ajuste os filtros de busca."
            actions={[
              { label: "Criar Contrato", onClick: () => navigate("/contratos/novo"), variant: "primary", icon: Plus },
            ]}
          />
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <ResponsiveTable
            columns={columns}
            data={contratosFiltrados}
            emptyMessage="Nenhum contrato encontrado."
            onRowClick={(contrato: Contrato) => navigate(`/contratos/${contrato.id}`)}
            actions={(contrato: Contrato) => (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/contratos/${contrato.id}`);
                  }}
                  className="p-1.5 text-gray-400 hover:text-[#F25C26] hover:bg-[#F25C26]/10 rounded-lg transition-all"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
