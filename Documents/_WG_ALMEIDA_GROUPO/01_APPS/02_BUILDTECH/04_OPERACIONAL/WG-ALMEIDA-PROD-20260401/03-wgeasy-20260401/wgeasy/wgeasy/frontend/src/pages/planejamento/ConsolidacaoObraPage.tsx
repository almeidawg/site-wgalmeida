/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CONSOLIDAÇÍO DE PEDIDOS POR OBRA
// Sistema WG Easy - Grupo WG Almeida
// Dashboard de todos os pedidos agrupados por cliente/obra
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Layers,
  Building2,
  Package,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Plus,
  Download,
  FileText,
  ArrowLeft,
  TrendingUp,
  Users,
  ShoppingCart,
  Eye,
  MapPin,
  Calendar,
  Wallet,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { formatarData, formatarMoeda } from "@/lib/utils";
import {
  listarPedidosPorCliente,
  obterResumoConsolidacao,
  type ClienteConsolidado,
  type ResumoConsolidacao,
} from "@/lib/pedidosObraApi";

// ============================================================
// CONSTANTES
// ============================================================

const STATUS_CONFIG: Record<string, { cor: string; corLight: string; icone: React.ReactNode; label: string }> = {
  PENDENTE: { cor: "#F59E0B", corLight: "#FEF3C7", icone: <Clock className="w-4 h-4" />, label: "Pendente" },
  APROVADO: { cor: "#10B981", corLight: "#D1FAE5", icone: <CheckCircle className="w-4 h-4" />, label: "Aprovado" },
  EM_ANDAMENTO: { cor: "#3B82F6", corLight: "#DBEAFE", icone: <TrendingUp className="w-4 h-4" />, label: "Em Andamento" },
  FINALIZADO: { cor: "#6B7280", corLight: "#F3F4F6", icone: <Package className="w-4 h-4" />, label: "Finalizado" },
  CANCELADO: { cor: "#EF4444", corLight: "#FEE2E2", icone: <AlertCircle className="w-4 h-4" />, label: "Cancelado" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function ConsolidacaoObraPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [clientes, setClientes] = useState<ClienteConsolidado[]>([]);
  const [resumo, setResumo] = useState<ResumoConsolidacao | null>(null);
  const [busca, setBusca] = useState("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [clientesData, resumoData] = await Promise.all([
        listarPedidosPorCliente(),
        obterResumoConsolidacao(),
      ]);
      setClientes(clientesData);
      setResumo(resumoData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function toggleExpandir(clienteNome: string) {
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(clienteNome)) {
        novo.delete(clienteNome);
      } else {
        novo.add(clienteNome);
      }
      return novo;
    });
  }

  const clientesFiltrados = clientes.filter((c) => {
    if (!busca) return true;
    const termo = normalizeSearchTerm(busca);
    return (
      normalizeSearchTerm(c.cliente_nome).includes(termo) ||
      normalizeSearchTerm(c.endereco || "").includes(termo)
    );
  });


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-wg-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando consolidaçÍo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-wg-primary to-wg-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">ConsolidaçÍo por Obra</h1>
              <p className="text-[12px] text-gray-600">Visao unificada de todos os pedidos</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/planejamento/pedido-materiais")}
            className="px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Novo Pedido
          </button>
        </div>

        {/* Resumo Geral */}
        {resumo && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Clientes/Obras</p>
                  <p className="text-[20px] font-normal text-gray-900">{resumo.total_clientes}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Pedidos</p>
                  <p className="text-[20px] font-normal text-gray-900">{resumo.total_pedidos}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Itens</p>
                  <p className="text-[20px] font-normal text-gray-900">{resumo.total_itens}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Wallet className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-500">Valor Total</p>
                  <p className="text-[20px] font-normal text-gray-900">{formatarMoeda(resumo.valor_total)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status Pills */}
        {resumo && (
          <div className="flex flex-wrap gap-2 mb-6">
            {Object.entries(resumo.por_status).map(([status, count]) => {
              if (count === 0) return null;
              const config = STATUS_CONFIG[status];
              return (
                <div
                  key={status}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: config?.corLight, color: config?.cor }}
                >
                  {config?.icone}
                  <span className="text-sm font-medium">
                    {count} {config?.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Busca */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar cliente ou endereço..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary outline-none"
            />
          </div>
        </div>

        {/* Lista de Clientes */}
        {clientesFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-[18px] font-normal text-gray-700 mb-2">
              Nenhum pedido encontrado
            </h3>
            <p className="text-gray-500 mb-4">
              Crie um novo pedido de materiais para começar
            </p>
            <button
              type="button"
              onClick={() => navigate("/planejamento/pedido-materiais")}
              className="px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90"
            >
              Criar Pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clientesFiltrados.map((cliente) => {
              const isExpandido = expandidos.has(cliente.cliente_nome);

              return (
                <div
                  key={cliente.cliente_nome}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Header do Cliente */}
                  <div
                    onClick={() => toggleExpandir(cliente.cliente_nome)}
                    className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center">
                          <Building2 className="w-6 h-6 text-gray-600" />
                        </div>
                        <div>
                          <h3 className="font-normal text-gray-900 text-lg">{cliente.cliente_nome}</h3>
                          {cliente.endereco && (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <MapPin className="w-3.5 h-3.5" />
                              {cliente.endereco}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        {/* Stats */}
                        <div className="hidden md:flex items-center gap-6 text-sm">
                          <div className="text-center">
                            <p className="font-normal text-gray-900">{cliente.total_pedidos}</p>
                            <p className="text-gray-500">Pedidos</p>
                          </div>
                          <div className="text-center">
                            <p className="font-normal text-gray-900">{cliente.total_itens}</p>
                            <p className="text-gray-500">Itens</p>
                          </div>
                          <div className="text-center">
                            <p className="font-normal text-wg-primary">{formatarMoeda(cliente.valor_total)}</p>
                            <p className="text-gray-500">Total</p>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex items-center gap-2">
                          {cliente.status_resumo.pendentes > 0 && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                              {cliente.status_resumo.pendentes} pendente(s)
                            </span>
                          )}
                          {cliente.status_resumo.aprovados > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                              {cliente.status_resumo.aprovados} aprovado(s)
                            </span>
                          )}
                        </div>

                        {/* Expandir */}
                        {isExpandido ? (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pedidos Expandidos */}
                  {isExpandido && (
                    <div className="border-t border-gray-100">
                      <div className="p-4 bg-gray-50">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-normal text-gray-700">Pedidos deste cliente</h4>
                          <button
                            type="button"
                            onClick={() => navigate(`/planejamento/pedido-materiais?cliente=${encodeURIComponent(cliente.cliente_nome)}`)}
                            className="text-sm text-wg-primary hover:underline flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Novo pedido
                          </button>
                        </div>

                        <div className="space-y-2">
                          {cliente.pedidos.map((pedido) => {
                            const statusConfig = STATUS_CONFIG[pedido.status];
                            return (
                              <div
                                key={pedido.id}
                                className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between hover:shadow-sm transition-shadow"
                              >
                                <div className="flex items-center gap-4">
                                  <div
                                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                                    style={{ backgroundColor: statusConfig?.corLight }}
                                  >
                                    {statusConfig?.icone}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono text-sm text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                        {pedido.codigo}
                                      </span>
                                      <span
                                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                                        style={{
                                          backgroundColor: statusConfig?.corLight,
                                          color: statusConfig?.cor,
                                        }}
                                      >
                                        {statusConfig?.label}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mt-0.5">{pedido.nome}</p>
                                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {pedido.created_at ? formatarData(pedido.created_at, "medio") : "-"}
                                      </span>
                                      <span>{pedido.total_itens} itens</span>
                                      <span className="font-medium text-gray-700">
                                        {formatarMoeda(pedido.valor_total)}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => navigate(`/compras/${pedido.id}`)}
                                  className="p-2 text-gray-400 hover:text-wg-primary hover:bg-wg-primary/5 rounded-lg transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>

                        {/* Totais do Cliente */}
                        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-sm">
                          <span className="text-gray-500">
                            Total consolidado: {cliente.total_itens} itens
                          </span>
                          <span className="font-normal text-wg-primary">
                            {formatarMoeda(cliente.valor_total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}


