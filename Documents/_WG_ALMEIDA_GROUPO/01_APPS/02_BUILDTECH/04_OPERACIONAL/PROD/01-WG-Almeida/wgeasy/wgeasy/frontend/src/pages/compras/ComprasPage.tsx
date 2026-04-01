/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Listagem de Pedidos de Compra
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  Plus,
  ShoppingCart,
  DollarSign,
  Clock,
  Truck,
  Eye,
  Pencil,
  Trash2,
  CheckCircle,
  Upload,
} from "lucide-react";
import {
  listarPedidosCompra,
  deletarPedidoCompra,
  alterarStatusPedidoCompra,
  obterEstatisticasPedidosCompra,
  type PedidoCompraCompleto,
  type PedidosCompraEstatisticas,
} from "@/lib/comprasApi";
import {
  STATUS_PEDIDO_LABELS,
  STATUS_PEDIDO_COLORS,
  formatarValor,
  formatarData,
  getUrgenciaPedido,
} from "@/types/pedidosCompra";
import { ResponsiveTable } from "@/components/ResponsiveTable";

// Cor do modulo Compras
const corModulo = "#8B5CF6";
const corModuloEscura = "#7C3AED";

export default function ComprasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedidos, setPedidos] = useState<PedidoCompraCompleto[]>([]);
  const [stats, setStats] = useState<PedidosCompraEstatisticas | null>(null);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<string>("");

  async function carregar() {
    setLoading(true);
    try {
      const [pedidosData, statsData] = await Promise.all([
        listarPedidosCompra(),
        obterEstatisticasPedidosCompra(),
      ]);
      setPedidos(pedidosData);
      setStats(statsData);
    } catch (err) {
      console.error("Erro ao carregar pedidos de compra:", err);
      toast({ title: "Erro", description: "Erro ao carregar pedidos de compra", variant: "destructive" });
    }
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, []);

  async function remover(id: string) {
    if (!confirm("Excluir este pedido de compra?")) return;
    try {
      await deletarPedidoCompra(id);
      carregar();
    } catch (err) {
      console.error("Erro ao deletar pedido:", err);
      toast({ title: "Erro", description: "Erro ao deletar pedido", variant: "destructive" });
    }
  }

  async function mudarStatus(id: string, novoStatus: any) {
    try {
      await alterarStatusPedidoCompra(id, novoStatus);
      carregar();
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      toast({ title: "Erro", description: "Erro ao alterar status", variant: "destructive" });
    }
  }

  const pedidosFiltrados = filtroStatus
    ? pedidos.filter((p) => p.status === filtroStatus)
    : pedidos;

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando pedidos...</p>
          </div>
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
            <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">
                Pedidos de Compra
              </h1>
              <p className="text-[12px] text-gray-600">
                Gerencie pedidos de compra, fornecedores e controle de entregas
              </p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2">
            <Link
              to="/compras/importar"
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-[13px] font-normal text-gray-600 hover:bg-gray-50 transition-all"
            >
              <Upload className="w-4 h-4" />
              Importar
            </Link>
            <button
              onClick={() => navigate("/compras/novo")}
              className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Novo Pedido
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-gray-100 rounded-md">
                <ShoppingCart className="w-4 h-4 text-gray-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.total_pedidos}</span>
              <span className="text-[12px] text-gray-500">Pedidos</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-yellow-50 rounded-md">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.pedidos_pendentes}</span>
              <span className="text-[12px] text-gray-500">Pendentes</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-md">
                <Truck className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{stats.pedidos_em_transito}</span>
              <span className="text-[12px] text-gray-500">Em Transito</span>
            </div>
          </div>

          <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-md">
                <DollarSign className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-[18px] font-light text-gray-900">{formatarValor(stats.valor_total_mes)}</span>
              <span className="text-[12px] text-gray-500">Mes</span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-gray-500 mr-2">Status:</span>
          <button
            onClick={() => setFiltroStatus("")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === ""
                ? "bg-[#8B5CF6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFiltroStatus("pendente")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "pendente"
                ? "bg-[#8B5CF6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Pendentes
          </button>
          <button
            onClick={() => setFiltroStatus("aprovado")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "aprovado"
                ? "bg-[#8B5CF6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Aprovados
          </button>
          <button
            onClick={() => setFiltroStatus("em_transito")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "em_transito"
                ? "bg-[#8B5CF6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Em Transito
          </button>
          <button
            onClick={() => setFiltroStatus("entregue")}
            className={`px-3 py-1.5 rounded-lg text-[13px] font-normal transition-all ${
              filtroStatus === "entregue"
                ? "bg-[#8B5CF6] text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Entregues
          </button>
        </div>
      </div>

      {/* Lista */}
      {pedidosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">
            Nenhum pedido encontrado
          </h3>
          <p className="text-[12px] text-gray-500 mb-6">
            Crie seu primeiro pedido de compra
          </p>
          <button
            onClick={() => navigate("/compras/novo")}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-[#8B5CF6] text-white rounded-lg text-[13px] font-normal hover:bg-[#7C3AED] transition-all"
          >
            <Plus className="w-5 h-5" />
            Criar Primeiro Pedido
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <ResponsiveTable
            data={pedidosFiltrados}
            columns={[
              {
                key: "numero",
                label: "Numero",
                render: (pedido: PedidoCompraCompleto) => (
                  <span className="font-mono text-[12px] text-gray-900">{pedido.numero}</span>
                ),
              },
              {
                key: "fornecedor",
                label: "Fornecedor",
                render: (pedido: PedidoCompraCompleto) => (
                  <span className="text-[12px] text-gray-600">{pedido.fornecedor?.nome || "-"}</span>
                ),
              },
              {
                key: "data_pedido",
                label: "Data",
                render: (pedido: PedidoCompraCompleto) => (
                  <span className="text-[11px] text-gray-400">{formatarData(pedido.data_pedido)}</span>
                ),
              },
              {
                key: "status",
                label: "Status",
                render: (pedido: PedidoCompraCompleto) => (
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-normal text-white"
                    style={{ backgroundColor: STATUS_PEDIDO_COLORS[pedido.status] }}
                  >
                    {STATUS_PEDIDO_LABELS[pedido.status]}
                  </span>
                ),
              },
              {
                key: "urgencia",
                label: "Urgencia",
                render: (pedido: PedidoCompraCompleto) => {
                  const urgencia = getUrgenciaPedido(pedido);
                  return (
                    <span className="text-[11px] font-normal" style={{ color: urgencia.color }}>
                      {urgencia.label}
                    </span>
                  );
                },
              },
              {
                key: "valor_total",
                label: "Valor",
                render: (pedido: PedidoCompraCompleto) => (
                  <span className="text-[12px] font-normal text-[#8B5CF6]">
                    {formatarValor(pedido.valor_total)}
                  </span>
                ),
              },
              {
                key: "acoes",
                label: "Acoes",
                render: (pedido: PedidoCompraCompleto) => (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/compras/${pedido.id}`); }}
                      className="p-1.5 text-gray-400 hover:text-[#8B5CF6] hover:bg-[#8B5CF6]/10 rounded-lg transition-all"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); navigate(`/compras/${pedido.id}`); }}
                      className="p-1.5 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {pedido.status === "pendente" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); mudarStatus(pedido.id, "aprovado"); }}
                        className="p-1.5 text-gray-400 hover:text-green-500 hover:bg-green-50 rounded-lg transition-all"
                        title="Aprovar"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    )}
                    {pedido.status === "aprovado" && (
                      <button
                        onClick={(e) => { e.stopPropagation(); mudarStatus(pedido.id, "em_transito"); }}
                        className="p-1.5 text-gray-400 hover:text-purple-500 hover:bg-purple-50 rounded-lg transition-all"
                        title="Em Transito"
                      >
                        <Truck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); remover(pedido.id); }}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      title="Excluir"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ),
              },
            ]}
            loading={loading}
            onRowClick={(pedido) => navigate(`/compras/${pedido.id}`)}
          />
        </div>
      )}
    </div>
  );
}
