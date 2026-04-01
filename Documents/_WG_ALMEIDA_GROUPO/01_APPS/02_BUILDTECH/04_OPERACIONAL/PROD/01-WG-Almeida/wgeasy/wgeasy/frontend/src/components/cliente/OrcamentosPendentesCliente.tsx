// ============================================================
// COMPONENTE: Orçamentos Pendentes de AprovaçÍo - Área do Cliente
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from "react";
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
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Eye,
  MessageSquare,
} from "lucide-react";

interface OrcamentoCliente {
  id: string;
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

interface Props {
  clienteId: string;
  onAprovar?: () => void;
}

export default function OrcamentosPendentesCliente({ clienteId, onAprovar }: Props) {
  const [orcamentos, setOrcamentos] = useState<OrcamentoCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandido, setExpandido] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [modalRejeicao, setModalRejeicao] = useState<string | null>(null);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [observacoesAprovacao, setObservacoesAprovacao] = useState("");

  const carregarOrcamentos = useCallback(async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
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

      if (error) throw error;

      // Para cada orçamento, buscar itens
      const orcamentosComItens = await Promise.all(
        (data || []).map(async (orc) => {
          const { data: itens } = await supabase
            .from("orcamento_itens")
            .select("id, descricao, quantidade, valor_unitario, subtotal, aprovado_cliente")
            .eq("orcamento_id", orc.id)
            .order("descricao");

          return { ...orc, itens: itens || [] };
        })
      );

      setOrcamentos(orcamentosComItens);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setLoading(false);
    }
  }, [clienteId]);

  useEffect(() => {
    carregarOrcamentos();
  }, [carregarOrcamentos]);

  async function handleAprovar(orcamentoId: string) {
    try {
      setProcessando(true);
      await aprovarOrcamento(orcamentoId, undefined, observacoesAprovacao || undefined);
      alert("Orçamento aprovado com sucesso!");
      setObservacoesAprovacao("");
      await carregarOrcamentos();
      onAprovar?.();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao aprovar orçamento";
      alert(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  async function handleRejeitar(orcamentoId: string) {
    if (!motivoRejeicao.trim()) {
      alert("Por favor, informe o motivo da rejeiçÍo");
      return;
    }

    try {
      setProcessando(true);
      await rejeitarOrcamento(orcamentoId, motivoRejeicao);
      alert("Orçamento rejeitado");
      setModalRejeicao(null);
      setMotivoRejeicao("");
      await carregarOrcamentos();
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao rejeitar orçamento";
      alert(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="w-5 h-5 text-orange-500" />
          <h3 className="font-normal text-gray-900">Orçamentos Pendentes</h3>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (orcamentos.length === 0) {
    return null; // não mostrar nada se não há orçamentos pendentes
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-normal text-gray-900">
                Orçamentos Aguardando AprovaçÍo
              </h3>
              <p className="text-sm text-gray-600">
                {orcamentos.length} orçamento{orcamentos.length > 1 ? "s" : ""} pendente{orcamentos.length > 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm font-medium rounded-full">
            AçÍo necessária
          </span>
        </div>
      </div>

      {/* Lista de Orçamentos */}
      <div className="divide-y divide-gray-100">
        {orcamentos.map((orcamento) => {
          const diasRestantes = calcularDiasRestantes(orcamento.validade);
          const isExpandido = expandido === orcamento.id;
          const isExpirando = diasRestantes !== null && diasRestantes <= 5;

          return (
            <div key={orcamento.id} className="bg-white">
              {/* Cabeçalho do Orçamento */}
              <div
                className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandido(isExpandido ? null : orcamento.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-gray-400" />
                      <h4 className="font-medium text-gray-900">
                        {orcamento.titulo || "Sem título"}
                      </h4>
                      {isExpirando && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          {diasRestantes === 0 ? "Expira hoje" : `${diasRestantes} dias`}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
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

              {/* Detalhes Expandidos */}
              {isExpandido && (
                <div className="px-6 pb-4 border-t border-gray-100 bg-gray-50">
                  {/* Itens do Orçamento */}
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
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                                DescriçÍo
                              </th>
                              <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">
                                Qtd
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Unit.
                              </th>
                              <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">
                                Subtotal
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {orcamento.itens.map((item) => (
                              <tr key={item.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {item.descricao}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-center">
                                  {item.quantidade}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600 text-right">
                                  {formatarValor(item.valor_unitario)}
                                </td>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                  {formatarValor(item.subtotal)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="bg-gray-50">
                            <tr>
                              <td colSpan={3} className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                Total:
                              </td>
                              <td className="px-4 py-3 text-lg font-normal text-gray-900 text-right">
                                {formatarValor(orcamento.valor_total)}
                              </td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Campo de Observações */}
                  <div className="mt-4">
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Observações (opcional)
                    </label>
                    <textarea
                      value={observacoesAprovacao}
                      onChange={(e) => setObservacoesAprovacao(e.target.value)}
                      placeholder="Deixe uma mensagem ou observaçÍo sobre este orçamento..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                      rows={2}
                    />
                  </div>

                  {/* Botões de AçÍo */}
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
                      onClick={() => handleAprovar(orcamento.id)}
                      disabled={processando}
                      className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
                    >
                      {processando ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <CheckCircle className="w-5 h-5" />
                      )}
                      Aprovar Orçamento
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
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
                  <h3 className="text-lg font-normal text-gray-900">
                    Rejeitar Orçamento
                  </h3>
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
                onClick={() => handleRejeitar(modalRejeicao)}
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
}


