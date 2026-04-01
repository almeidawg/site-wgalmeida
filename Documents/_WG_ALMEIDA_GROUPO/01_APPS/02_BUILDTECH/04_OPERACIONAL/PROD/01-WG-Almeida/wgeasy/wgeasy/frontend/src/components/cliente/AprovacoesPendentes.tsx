// ============================================================
// COMPONENTE: Aprovações Pendentes - Área do Cliente
// Sistema WG Easy - Grupo WG Almeida
// Unifica orçamentos e pedidos de materiais pendentes
// ============================================================

import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/supabaseClient";
import {
  formatarValor,
  formatarData,
  calcularDiasRestantes,
} from "@/types/orcamentos";
import {
  aprovarOrcamento,
  rejeitarOrcamento,
} from "@/lib/workflows/orcamentoWorkflow";
import {
  FileText,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  MessageSquare,
  Package,
  ClipboardCheck,
  Bell,
} from "lucide-react";

// ============================================================
// TIPOS
// ============================================================

interface OrcamentoCliente {
  id: string;
  tipo: "orcamento";
  titulo: string | null;
  valor_total: number | null;
  status: string;
  enviado_em: string | null;
  validade: string | null;
  observacoes_cliente: string | null;
  cliente_id: string | null;
  itens?: {
    id: string;
    descricao: string;
    quantidade: number;
    valor_unitario: number;
    subtotal: number;
    aprovado_cliente: boolean;
  }[];
}

interface PedidoMaterialCliente {
  id: string;
  tipo: "material";
  descricao: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    unidade: string;
  }>;
  prioridade: string;
  observacoes?: string;
  status: string;
  created_at: string;
  link_aprovacao?: string;
}

type ItemAprovacao = OrcamentoCliente | PedidoMaterialCliente;

interface Props {
  clienteId: string;
  contratoId?: string;
  onAprovar?: () => void;
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function AprovacoesPendentes({ clienteId, contratoId, onAprovar }: Props) {
  const { toast } = useToast();
  const [itens, setItens] = useState<ItemAprovacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [modalRejeicao, setModalRejeicao] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [observacoesAprovacao, setObservacoesAprovacao] = useState("");
  const [abaAtiva, setAbaAtiva] = useState<"todos" | "orcamentos" | "materiais">("todos");

  const carregarItens = useCallback(async () => {
    type OrcamentoRow = Omit<OrcamentoCliente, "tipo" | "itens">;
    type PedidoMaterialRow = Omit<PedidoMaterialCliente, "tipo">;

    try {
      setLoading(true);
      const todosItens: ItemAprovacao[] = [];

      // 1. Carregar orçamentos pendentes
      const { data: orcamentos, error: orcError } = await supabase
        .from("orcamentos")
        .select(`
          id,
          titulo,
          valor_total,
          status,
          enviado_em,
          validade,
          observacoes_cliente,
          cliente_id
        `)
        .eq("cliente_id", clienteId)
        .eq("status", "enviado")
        .order("enviado_em", { ascending: false });

      if (!orcError && orcamentos) {
        // Carregar itens de todos os orçamentos em paralelo (evita N+1)
        const itensResults = await Promise.all(
          (orcamentos as OrcamentoRow[]).map((orc) =>
            supabase
              .from("orcamento_itens")
              .select("id, descricao, quantidade, valor_unitario, subtotal, aprovado_cliente")
              .eq("orcamento_id", orc.id)
              .order("descricao")
          )
        );

        (orcamentos as OrcamentoRow[]).forEach((orc, i) => {
          todosItens.push({
            ...orc,
            tipo: "orcamento",
            itens: itensResults[i].data || [],
          });
        });
      }

      // 2. Carregar pedidos de materiais pendentes
      if (contratoId) {
        const { data: pedidos, error: pedError } = await supabase
          .from("pedidos_materiais")
          .select("*")
          .eq("projeto_id", contratoId)
          .eq("status", "aguardando_aprovacao")
          .order("created_at", { ascending: false });

        if (!pedError && pedidos) {
          for (const ped of pedidos as PedidoMaterialRow[]) {
            todosItens.push({
              id: ped.id,
              tipo: "material",
              descricao: ped.descricao || "Pedido de Materiais",
              itens: ped.itens || [],
              prioridade: ped.prioridade || "normal",
              observacoes: ped.observacoes,
              status: ped.status,
              created_at: ped.created_at,
              link_aprovacao: ped.link_aprovacao,
            });
          }
        }
      }

      setItens(todosItens);
    } catch (error) {
      console.error("Erro ao carregar aprovações:", error);
    } finally {
      setLoading(false);
    }
  }, [clienteId, contratoId]);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  // ============================================================
  // AÇÕES - ORÇAMENTOS
  // ============================================================

  async function handleAprovarOrcamento(orcamentoId: string) {
    try {
      setProcessando(true);
      await aprovarOrcamento(orcamentoId, undefined, observacoesAprovacao || undefined);
      toast({ title: "Orçamento aprovado com sucesso!" });
      setObservacoesAprovacao("");
      await carregarItens();
      onAprovar?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao aprovar orçamento", description: error instanceof Error ? error.message : undefined });
    } finally {
      setProcessando(false);
    }
  }

  async function handleRejeitarOrcamento(orcamentoId: string) {
    if (!motivoRejeicao.trim()) {
      toast({ variant: "destructive", title: "Por favor, informe o motivo da rejeiçÍo" });
      return;
    }

    try {
      setProcessando(true);
      await rejeitarOrcamento(orcamentoId, motivoRejeicao);
      toast({ title: "Orçamento rejeitado" });
      setModalRejeicao(null);
      setMotivoRejeicao("");
      await carregarItens();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao rejeitar orçamento", description: error instanceof Error ? error.message : undefined });
    } finally {
      setProcessando(false);
    }
  }

  // ============================================================
  // AÇÕES - MATERIAIS
  // ============================================================

  async function handleAprovarMaterial(pedidoId: string) {
    try {
      setProcessando(true);

      const { error } = await supabase
        .from("pedidos_materiais")
        .update({
          status: "aprovado_cliente",
          aprovado_em: new Date().toISOString(),
          observacoes_aprovacao: observacoesAprovacao || null
        })
        .eq("id", pedidoId);

      if (error) throw error;

      toast({ title: "Pedido de materiais aprovado!" });
      setObservacoesAprovacao("");
      await carregarItens();
      onAprovar?.();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao aprovar pedido", description: error instanceof Error ? error.message : undefined });
    } finally {
      setProcessando(false);
    }
  }

  async function handleRejeitarMaterial(pedidoId: string) {
    if (!motivoRejeicao.trim()) {
      toast({ variant: "destructive", title: "Por favor, informe o motivo da rejeiçÍo" });
      return;
    }

    try {
      setProcessando(true);

      const { error } = await supabase
        .from("pedidos_materiais")
        .update({
          status: "recusado_cliente",
          recusado_em: new Date().toISOString(),
          motivo_recusa: motivoRejeicao
        })
        .eq("id", pedidoId);

      if (error) throw error;

      toast({ title: "Pedido recusado" });
      setModalRejeicao(null);
      setMotivoRejeicao("");
      await carregarItens();
    } catch (error) {
      toast({ variant: "destructive", title: "Erro ao recusar pedido", description: error instanceof Error ? error.message : undefined });
    } finally {
      setProcessando(false);
    }
  }

  // ============================================================
  // FILTROS
  // ============================================================

  const itensFiltrados = itens.filter((item) => {
    if (abaAtiva === "todos") return true;
    if (abaAtiva === "orcamentos") return item.tipo === "orcamento";
    if (abaAtiva === "materiais") return item.tipo === "material";
    return true;
  });

  const totalOrcamentos = itens.filter((i) => i.tipo === "orcamento").length;
  const totalMateriais = itens.filter((i) => i.tipo === "material").length;

  // ============================================================
  // RENDER
  // ============================================================

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <ClipboardCheck className="w-5 h-5 text-orange-500" />
          <h3 className="font-normal text-gray-900">Aprovações Pendentes</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (itens.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Bell className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-normal text-gray-900">Aprovações Pendentes</h3>
              <p className="text-sm text-gray-600">
                {itens.length} item{itens.length > 1 ? "ns" : ""} aguardando sua análise
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
            AçÍo necessária
          </span>
        </div>
      </div>

      {/* Tabs */}
      {(totalOrcamentos > 0 && totalMateriais > 0) && (
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setAbaAtiva("todos")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition ${
              abaAtiva === "todos"
                ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            Todos ({itens.length})
          </button>
          <button
            onClick={() => setAbaAtiva("orcamentos")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
              abaAtiva === "orcamentos"
                ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            Orçamentos ({totalOrcamentos})
          </button>
          <button
            onClick={() => setAbaAtiva("materiais")}
            className={`flex-1 px-4 py-3 text-sm font-medium transition flex items-center justify-center gap-2 ${
              abaAtiva === "materiais"
                ? "text-orange-600 border-b-2 border-orange-500 bg-orange-50/50"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Package className="w-4 h-4" />
            Materiais ({totalMateriais})
          </button>
        </div>
      )}

      {/* Lista de Itens */}
      <div className="divide-y divide-gray-100">
        {itensFiltrados.map((item) => {
          const isExpandido = expandido === item.id;

          if (item.tipo === "orcamento") {
            return <React.Fragment key={item.id}>{renderOrcamento(item as OrcamentoCliente, isExpandido)}</React.Fragment>;
          } else {
            return <React.Fragment key={item.id}>{renderMaterial(item as PedidoMaterialCliente, isExpandido)}</React.Fragment>;
          }
        })}
      </div>

      {/* Modal de RejeiçÍo */}
      {modalRejeicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Rejeitar Item</h3>
                  <p className="text-sm text-gray-500">
                    Por favor, informe o motivo da rejeiçÍo
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={motivoRejeicao}
                onChange={(e) => setMotivoRejeicao(e.target.value)}
                placeholder="Descreva o motivo da rejeiçÍo..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                rows={4}
                autoFocus
              />
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalRejeicao(null);
                  setMotivoRejeicao("");
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const item = itens.find((i) => i.id === modalRejeicao);
                  if (item?.tipo === "orcamento") {
                    handleRejeitarOrcamento(modalRejeicao);
                  } else {
                    handleRejeitarMaterial(modalRejeicao);
                  }
                }}
                disabled={processando || !motivoRejeicao.trim()}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {processando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Confirmar RejeiçÍo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // ============================================================
  // RENDER - ORÇAMENTO
  // ============================================================

  function renderOrcamento(orcamento: OrcamentoCliente, isExpandido: boolean) {
    const diasRestantes = calcularDiasRestantes(orcamento.validade);
    const isExpirando = diasRestantes !== null && diasRestantes <= 5;

    return (
      <div key={orcamento.id} className="bg-white">
        <div
          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setExpandido(isExpandido ? null : orcamento.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <span className="text-xs text-blue-600 font-medium uppercase">Orçamento</span>
                  <h4 className="font-medium text-gray-900">
                    {orcamento.titulo || "Sem título"}
                  </h4>
                </div>
                {isExpirando && (
                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    {diasRestantes === 0 ? "Expira hoje" : `${diasRestantes} dias`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 ml-11">
                <span>Enviado em {formatarData(orcamento.enviado_em)}</span>
                {orcamento.validade && (
                  <span>Válido até {formatarData(orcamento.validade)}</span>
                )}
                <span>{orcamento.itens?.length || 0} itens</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-2xl font-normal text-gray-900">
                  {formatarValor(orcamento.valor_total)}
                </p>
                <p className="text-xs text-gray-500">Valor total</p>
              </div>
              {isExpandido ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isExpandido && (
          <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
            {orcamento.itens && orcamento.itens.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Itens do Orçamento
                </h5>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">DescriçÍo</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit.</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {orcamento.itens.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.descricao}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantidade}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-right">{formatarValor(item.valor_unitario)}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">{formatarValor(item.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">Total:</td>
                        <td className="px-4 py-3 text-lg font-normal text-gray-900 text-right">{formatarValor(orcamento.valor_total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observações (opcional)
              </label>
              <textarea
                value={observacoesAprovacao}
                onChange={(e) => setObservacoesAprovacao(e.target.value)}
                placeholder="Deixe uma mensagem ou observaçÍo..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={2}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalRejeicao(orcamento.id)}
                disabled={processando}
                className="px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Rejeitar
              </button>
              <button
                type="button"
                onClick={() => handleAprovarOrcamento(orcamento.id)}
                disabled={processando}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {processando ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Aprovar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER - MATERIAL
  // ============================================================

  function renderMaterial(pedido: PedidoMaterialCliente, isExpandido: boolean) {
    const prioridadeColors: Record<string, string> = {
      alta: "bg-red-100 text-red-700",
      urgente: "bg-red-100 text-red-700",
      normal: "bg-gray-100 text-gray-700",
      baixa: "bg-blue-100 text-blue-700",
    };

    return (
      <div key={pedido.id} className="bg-white">
        <div
          className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
          onClick={() => setExpandido(isExpandido ? null : pedido.id)}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Package className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <span className="text-xs text-purple-600 font-medium uppercase">Pedido de Materiais</span>
                  <h4 className="font-medium text-gray-900">{pedido.descricao}</h4>
                </div>
                {pedido.prioridade && pedido.prioridade !== "normal" && (
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${prioridadeColors[pedido.prioridade] || prioridadeColors.normal}`}>
                    {pedido.prioridade.charAt(0).toUpperCase() + pedido.prioridade.slice(1)}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500 ml-11">
                <span>Solicitado em {formatarData(pedido.created_at)}</span>
                <span>{pedido.itens?.length || 0} itens</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {isExpandido ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {isExpandido && (
          <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
            {pedido.itens && pedido.itens.length > 0 && (
              <div className="mt-4">
                <h5 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Materiais Solicitados
                </h5>
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Material</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Unidade</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {pedido.itens.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">{item.nome}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.quantidade}</td>
                          <td className="px-4 py-3 text-sm text-gray-600 text-center">{item.unidade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {pedido.observacoes && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Observações:</strong> {pedido.observacoes}
                </p>
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Observações (opcional)
              </label>
              <textarea
                value={observacoesAprovacao}
                onChange={(e) => setObservacoesAprovacao(e.target.value)}
                placeholder="Deixe uma mensagem ou observaçÍo..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                rows={2}
              />
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalRejeicao(pedido.id)}
                disabled={processando}
                className="px-6 py-3 bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                <XCircle className="w-5 h-5" />
                Recusar
              </button>
              <button
                type="button"
                onClick={() => handleAprovarMaterial(pedido.id)}
                disabled={processando}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {processando ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                Aprovar
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
}

