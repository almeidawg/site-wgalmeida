/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { exportarOrcamentoParaWhatsApp } from "@/utils/exportarOrcamentoParaWhatsApp";
import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

// Adiciona estilos para impressÍo para ocultar elementos indesejados
const printStyles = `
@media print {
  body { background: #fff !important; }
  .no-print, .no-print * { display: none !important; }
  .print-container { box-shadow: none !important; border: none !important; }
  .print-page { margin: 0 !important; box-shadow: none !important; }
  .print-hide { display: none !important; }
  .print-visible { display: block !important; }
  a { color: #000 !important; text-decoration: none !important; }
}
`;

// ==========================================
// DETALHES DO ORÇAMENTO - NOVO LAYOUT
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useParams, useNavigate, Link } from "react-router-dom";
import {
  buscarOrcamento,
  listarItens,
  type Orcamento,
  type OrcamentoItem,
  enviarParaAprovacao,
  aprovarOrcamento,
  rejeitarOrcamento,
  cancelarOrcamento,
  gerarPedidoCompraDeOrcamento,
  marcarItemComoComprado,
  desmarcarItemComoComprado,
  podeEnviarParaAprovacao,
  podeCancelar,
  podeEditar,
  podeGerarCompra,
} from "@/lib/orcamentoApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import { gerarPdfOrcamento } from "@/utils/gerarPdfOrcamento";

import Avatar from "@/components/common/Avatar";
import {
  Send,
  CheckCircle,
  XCircle,
  ShoppingCart,
  Package,
  AlertTriangle,
  Download,
  Mail,
  Pencil,
  ArrowLeft,
} from "lucide-react";

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  avatar_url?: string | null;
  avatar?: string | null;
}

interface Fornecedor {
  id: string;
  nome: string;
}

export default function OrcamentoDetalhePage() {
  React.useEffect(() => {
    // Adiciona o CSS de impressÍo ao head
    const style = document.createElement("style");
    style.innerHTML = printStyles;
    document.head.appendChild(style);
    return () => {
      style.remove();
    };
  }, []);

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orcamento, setOrcamento] = useState<Orcamento | null>(null);
  const [itens, setItens] = useState<OrcamentoItem[]>([]);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);

  // States para modais
  const [modalRejeicao, setModalRejeicao] = useState(false);
  const [motivoRejeicao, setMotivoRejeicao] = useState("");
  const [modalPedidoCompra, setModalPedidoCompra] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [fornecedorSelecionado, setFornecedorSelecionado] = useState("");

  useEffect(() => {
    if (id) {
      carregarDados();
    }
  }, [id]);

  async function carregarDados() {
    try {
      setLoading(true);

      // Carregar orçamento
      const orcamentoData = await buscarOrcamento(id!);
      setOrcamento(orcamentoData);

      // Carregar itens do orçamento
      const itensData = await listarItens(id!);
      // Corrigir subtotais NaN ou ausentes
      const itensCorrigidos = (itensData || []).map((item) => ({
        ...item,
        subtotal:
          isNaN(Number(item.subtotal)) ||
          item.subtotal === null ||
          item.subtotal === undefined
            ? Number(item.quantidade) * Number(item.valor_unitario)
            : Number(item.subtotal),
      }));
      setItens(itensCorrigidos);

      // Carregar dados do cliente
      if (orcamentoData.cliente_id) {
        const { data: clienteData } = await supabase
          .from("pessoas")
          .select("id, nome, email, telefone, avatar_url, avatar")
          .eq("id", orcamentoData.cliente_id)
          .single();
        if (clienteData) {
          setCliente(clienteData as Cliente);
        } else {
          setCliente(null);
        }
      } else {
        setCliente(null);
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar orçamento" });
    } finally {
      setLoading(false);
    }
  }

  // Carregar fornecedores para o modal de pedido de compra
  async function carregarFornecedores() {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select("id, nome")
        .eq("tipo", "FORNECEDOR")
        .eq("ativo", true)
        .order("nome");
      setFornecedores(data || []);
    } catch (error) {
      console.error("Erro ao carregar fornecedores:", error);
    }
  }

  // Funções de Workflow
  async function handleEnviarParaAprovacao() {
    if (!id) return;
    try {
      setProcessando(true);
      await enviarParaAprovacao(id);
      toast({ title: "Sucesso", description: "Orçamento enviado para aprovaçÍo do cliente!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao enviar para aprovaçÍo" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleAprovar() {
    if (!id) return;
    try {
      setProcessando(true);
      await aprovarOrcamento(id);
      toast({ title: "Sucesso", description: "Orçamento aprovado com sucesso!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao aprovar orçamento" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleRejeitar() {
    if (!id || !motivoRejeicao.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Informe o motivo da rejeiçÍo" });
      return;
    }
    try {
      setProcessando(true);
      await rejeitarOrcamento(id, motivoRejeicao);
      toast({ title: "Sucesso", description: "Orçamento rejeitado" });
      setModalRejeicao(false);
      setMotivoRejeicao("");
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao rejeitar orçamento" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleRevisar() {
    if (!id) return;
    // Volta o orçamento para rascunho para revisÍo
    try {
      setProcessando(true);
      const { error } = await supabase
        .from("orcamentos")
        .update({ status: "rascunho" })
        .eq("id", id);
      if (error) throw error;
      toast({ title: "Sucesso", description: "Orçamento enviado para revisÍo!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao enviar para revisÍo" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleCancelar() {
    if (!id) return;
    if (!confirm("Tem certeza que deseja cancelar este orçamento?")) return;
    try {
      setProcessando(true);
      await cancelarOrcamento(id);
      toast({ title: "Sucesso", description: "Orçamento cancelado" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao cancelar orçamento" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleGerarPedidoCompra() {
    if (!id || !fornecedorSelecionado) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione um fornecedor" });
      return;
    }
    try {
      setProcessando(true);
      const pedidoId = await gerarPedidoCompraDeOrcamento(
        id,
        fornecedorSelecionado
      );
      toast({ title: "Sucesso", description: "Pedido de compra gerado com sucesso!" });
      setModalPedidoCompra(false);
      setFornecedorSelecionado("");
      navigate(`/compras/${pedidoId}`);
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao gerar pedido de compra" });
    } finally {
      setProcessando(false);
    }
  }

  async function handleToggleItemComprado(item: OrcamentoItem) {
    try {
      if (item.comprado) {
        await desmarcarItemComoComprado(item.id);
      } else {
        await marcarItemComoComprado(item.id);
      }
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao atualizar item" });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F25C26] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamento...</p>
        </div>
      </div>
    );
  }

  if (!orcamento) {
    return (
      <div className="p-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="text-6xl mb-4">📋</div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Orçamento nÍo encontrado
          </h1>
          <p className="text-gray-600 mb-6">
            O orçamento solicitado nÍo existe ou foi removido.
          </p>
          <button
            onClick={() => navigate("/planejamento/orcamentos")}
            className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
          >
            Voltar para Orçamentos
          </button>
        </div>
      </div>
    );
  }

  // Verificar se está aguardando aprovaçÍo do cliente (status = enviado)
  const aguardandoAprovacao = orcamento.status === "enviado";

  return (
    <div
      id="orcamento-pdf"
      className="w-full min-h-0 bg-white"
      style={{ padding: 0, margin: 0 }}
    >
      <div
        className="max-w-6xl mx-auto px-4 py-6"
        style={{ boxShadow: "none", background: "#fff" }}
      >
        {/* BotÍo Voltar - apenas na tela */}
        <div className="no-print mb-4">
          <button
            type="button"
            onClick={() => navigate("/planejamento/orcamentos")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar para Orçamentos</span>
          </button>
        </div>

        {/* Cabeçalho centralizado com logo WG */}
        <div className="flex flex-col items-center justify-center mb-8">
          <img
            src="/logo-wg-grupo.svg"
            alt="Logo WG"
            style={{
              height: 60,
              width: 60,
              objectFit: "contain",
              marginBottom: 18,
            }}
          />
          <h1
            className="text-3xl md:text-4xl font-normal text-gray-900 text-center"
            style={{ margin: 0, fontWeight: 400, letterSpacing: 0 }}
          >
            {orcamento.titulo || "Orçamento sem título"}
          </h1>
          <p
            className="text-gray-500 text-center mt-2 text-base"
            style={{ margin: 0 }}
          >
            Criado em{" "}
            {new Date(orcamento.criado_em || "").toLocaleDateString("pt-BR")}
          </p>
        </div>

        {/* ========== HEADER HORIZONTAL - 3 COLUNAS ========== */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {/* Coluna 1: Cliente */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
              CLIENTE
            </h3>

            {cliente ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar
                    nome={cliente.nome}
                    avatar_url={cliente.avatar_url}
                    avatar={cliente.avatar}
                    size={56}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 text-lg">
                      {cliente.nome}
                    </p>
                  </div>
                </div>

                {cliente.email && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span>{cliente.email}</span>
                  </div>
                )}

                {cliente.telefone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    <span>{cliente.telefone}</span>
                  </div>
                )}

                <Link
                  to={`/pessoas/clientes/${cliente.id}`}
                  className="text-sm text-[#F25C26] hover:underline flex items-center gap-1 no-print"
                >
                  Ver perfil completo
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              </div>
            ) : (
              <p className="text-gray-400 text-center py-4">
                Cliente nÍo informado
              </p>
            )}
          </div>

          {/* Coluna 2: Informações */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-4">
              INFORMAÇÕES
            </h3>

            <div className="space-y-4">
              <div>
                <p className="text-xs text-gray-400 mb-1">Título</p>
                <p className="font-medium text-gray-900">
                  {orcamento.titulo || "Sem título"}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1">Data de CriaçÍo</p>
                <p className="font-medium text-gray-900">
                  {new Date(orcamento.criado_em || "").toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    }
                  )}
                </p>
              </div>

              {orcamento.atualizado_em && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Última AtualizaçÍo</p>
                  <p className="font-medium text-gray-900">
                    {new Date(orcamento.atualizado_em).toLocaleDateString(
                      "pt-BR",
                      {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Coluna 3: Valor Total + Botões de AçÍo */}
          <div className="bg-primary rounded-xl p-5 text-white flex flex-col">
            <h3 className="text-xs font-medium uppercase tracking-wide mb-2 opacity-80">
              VALOR TOTAL
            </h3>
            <p className="text-3xl font-bold mb-1">
              {formatarMoeda(orcamento.valor_total || 0)}
            </p>
            <p className="text-sm opacity-80 mb-4">
              {itens.length} itens incluídos
            </p>

            {/* Botões de AçÍo do Cliente - Estilo handwritten */}
            {aguardandoAprovacao && (
              <div className="flex gap-2 mt-auto">
                <button
                  type="button"
                  onClick={() => setModalRejeicao(true)}
                  disabled={processando}
                  className="flex-1 px-3 py-2 bg-[#e04a1a] hover:bg-[#c93d14] rounded-lg font-medium text-white text-sm transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Caveat', cursive", fontSize: "18px" }}
                >
                  REJEITAR
                </button>
                <button
                  type="button"
                  onClick={handleRevisar}
                  disabled={processando}
                  className="flex-1 px-3 py-2 bg-[#e04a1a] hover:bg-[#c93d14] rounded-lg font-medium text-white text-sm transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Caveat', cursive", fontSize: "18px" }}
                >
                  REVISAR
                </button>
                <button
                  type="button"
                  onClick={handleAprovar}
                  disabled={processando}
                  className="flex-1 px-3 py-2 bg-[#e04a1a] hover:bg-[#c93d14] rounded-lg font-medium text-white text-sm transition-colors disabled:opacity-50"
                  style={{ fontFamily: "'Caveat', cursive", fontSize: "18px" }}
                >
                  APROVAR
                </button>
              </div>
            )}

            {/* BotÍo Enviar para AprovaçÍo - quando em rascunho */}
            {podeEnviarParaAprovacao(orcamento) && (
              <button
                type="button"
                onClick={handleEnviarParaAprovacao}
                disabled={processando}
                className="mt-auto w-full px-4 py-3 bg-white text-[#F25C26] rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {processando ? (
                  <div className="w-5 h-5 border-2 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
                Enviar para AprovaçÍo
              </button>
            )}

            {/* Gerar Pedido de Compra - quando aprovado */}
            {podeGerarCompra(orcamento) && (
              <button
                type="button"
                onClick={() => {
                  carregarFornecedores();
                  setModalPedidoCompra(true);
                }}
                disabled={processando}
                className="mt-auto w-full px-4 py-3 bg-white text-[#F25C26] rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                Gerar Pedido de Compra
              </button>
            )}
          </div>
        </div>

        {/* ========== ITENS DO ORÇAMENTO - LARGURA COMPLETA ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center gap-2 mb-6">
            <svg
              className="w-5 h-5 text-[#F25C26]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900">
              Itens do Orçamento ({itens.length})
            </h3>
          </div>

          {itens.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-5xl mb-3">📦</div>
              <p className="text-gray-500 mb-2">Nenhum item adicionado</p>
              <Link
                to={`/orcamentos/${id}/itens`}
                className="text-[#F25C26] hover:underline"
              >
                Adicionar itens
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    {/* Coluna de Comprado - Apenas para orçamentos aprovados */}
                    {orcamento.status === "aprovado" && (
                      <th className="text-center py-3 px-2 text-sm font-medium text-gray-600 w-20">
                        <div className="flex items-center justify-center gap-1">
                          <Package className="w-4 h-4" />
                        </div>
                      </th>
                    )}
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">
                      DescriçÍo
                    </th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-600 w-20">
                      Qtd
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 w-32">
                      Valor Unit.
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-600 w-32">
                      Subtotal
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr
                      key={item.id}
                      className={`border-b border-gray-100 hover:bg-gray-50 ${
                        item.comprado ? "bg-green-50" : ""
                      }`}
                    >
                      {/* Checkbox de Comprado */}
                      {orcamento.status === "aprovado" && (
                        <td className="py-4 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleItemComprado(item)}
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              item.comprado
                                ? "bg-green-500 border-green-500 text-white"
                                : "border-gray-300 hover:border-green-500"
                            }`}
                          >
                            {item.comprado && (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      )}
                      <td className="py-4 px-4">
                        <div>
                          <p
                            className={`font-medium ${
                              item.comprado
                                ? "text-green-700 line-through"
                                : "text-gray-900"
                            }`}
                          >
                            {item.descricao}
                          </p>
                          {item.grupo && (
                            <p className="text-xs text-gray-500 mt-1">
                              Grupo: {item.grupo}
                            </p>
                          )}
                          {item.comprado && item.comprado_em && (
                            <p className="text-xs text-green-600 mt-1">
                              Comprado em{" "}
                              {new Date(item.comprado_em).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-700">
                        {item.quantidade}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-700">
                        {formatarMoeda(item.valor_unitario)}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-900">
                        {formatarMoeda(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Resumo de itens comprados */}
              {orcamento.status === "aprovado" && itens.length > 0 && (
                <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-green-700">
                        Progresso de Compras
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-bold text-green-600">
                        {itens.filter((i) => i.comprado).length}/{itens.length}
                      </span>
                      <p className="text-sm text-green-600">
                        {Math.round(
                          (itens.filter((i) => i.comprado).length /
                            itens.length) *
                            100
                        )}
                        % concluído
                      </p>
                    </div>
                  </div>
                  {/* Barra de progresso */}
                  <div className="mt-3 w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          (itens.filter((i) => i.comprado).length /
                            itens.length) *
                          100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ========== AÇÕES RÁPIDAS - BARRA INFERIOR ========== */}
        <div className="no-print flex flex-wrap gap-3 justify-center pb-8">
          <button
            type="button"
            onClick={async () => {
              if (orcamento && itens && cliente) {
                await gerarPdfOrcamento(
                  {
                    id: orcamento.id,
                    titulo: orcamento.titulo ?? undefined,
                    criado_em: orcamento.criado_em ?? undefined,
                    atualizado_em: orcamento.atualizado_em ?? undefined,
                    valor_total: orcamento.valor_total ?? undefined,
                    margem: orcamento.margem ?? undefined,
                    imposto: orcamento.imposto ?? undefined,
                    status: orcamento.status ?? undefined,
                  },
                  itens.map((item) => ({
                    ...item,
                    grupo: item.grupo ?? undefined,
                  })),
                  cliente
                );
              } else {
                toast({ variant: "destructive", title: "Erro", description: "Dados insuficientes para exportar PDF." });
              }
            }}
            className="px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 flex items-center gap-2 font-medium transition-colors"
          >
            <Download className="w-5 h-5" />
            Exportar PDF
          </button>

          <button
            type="button"
            onClick={exportarOrcamentoParaWhatsApp}
            className="px-5 py-2.5 text-green-700 bg-green-100 rounded-lg hover:bg-green-200 flex items-center gap-2 font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            WhatsApp
          </button>

          <button
            type="button"
            onClick={() => {
              window.location.href = `mailto:?subject=Orçamento&body=Orçamento: ${
                orcamento.titulo
              }\nValor Total: ${formatarMoeda(orcamento.valor_total || 0)}`;
            }}
            className="px-5 py-2.5 text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 flex items-center gap-2 font-medium transition-colors"
          >
            <Mail className="w-5 h-5" />
            E-mail
          </button>

          {podeEditar(orcamento) && (
            <Link
              to={`/orcamentos/editar/${id}`}
              className="px-5 py-2.5 text-[#F25C26] border-2 border-[#F25C26] rounded-lg hover:bg-primary hover:text-white flex items-center gap-2 font-medium transition-colors"
            >
              <Pencil className="w-5 h-5" />
              Editar Orçamento
            </Link>
          )}

          {podeCancelar(orcamento) && (
            <button
              type="button"
              onClick={handleCancelar}
              disabled={processando}
              className="px-5 py-2.5 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 flex items-center gap-2 font-medium transition-colors disabled:opacity-50"
            >
              <AlertTriangle className="w-5 h-5" />
              Cancelar
            </button>
          )}
        </div>
      </div>

      {/* ========== MODAL DE REJEIÇÍO ========== */}
      {modalRejeicao && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Rejeitar Orçamento
                  </h3>
                  <p className="text-sm text-gray-500">
                    Informe o motivo da rejeiçÍo
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
                  setModalRejeicao(false);
                  setMotivoRejeicao("");
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleRejeitar}
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

      {/* ========== MODAL DE GERAR PEDIDO DE COMPRA ========== */}
      {modalPedidoCompra && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    Gerar Pedido de Compra
                  </h3>
                  <p className="text-sm text-gray-500">
                    Selecione o fornecedor para criar o pedido
                  </p>
                </div>
              </div>
            </div>

            <div className="p-3 sm:p-6 space-y-4">
              <div>
                <label htmlFor="fornecedor-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor
                </label>
                <select
                  id="fornecedor-select"
                  title="Selecione um fornecedor"
                  value={fornecedorSelecionado}
                  onChange={(e) => setFornecedorSelecionado(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Selecione um fornecedor...</option>
                  {fornecedores.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <p className="text-sm text-purple-700">
                  <strong>Itens disponíveis:</strong>{" "}
                  {itens.filter((i) => i.aprovado_cliente && !i.comprado).length}{" "}
                  de {itens.length}
                </p>
                <p className="text-sm text-purple-600 mt-1">
                  SerÍo incluídos apenas os itens aprovados que ainda nÍo foram
                  comprados.
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalPedidoCompra(false);
                  setFornecedorSelecionado("");
                }}
                className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleGerarPedidoCompra}
                disabled={processando || !fornecedorSelecionado}
                className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {processando ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <ShoppingCart className="w-4 h-4" />
                )}
                Gerar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

