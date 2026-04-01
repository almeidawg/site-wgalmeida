/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Formulário de Pedido de Compra
// CriaçÍo e ediçÍo de pedidos de compra
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, Save, Trash2, Package } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import {
  criarPedidoCompra,
  buscarPedidoCompra,
  atualizarPedidoCompra,
  deletarPedidoCompra,
  deletarItemPedido,
  adicionarItemPedido,
  atualizarItemPedido,
  type PedidoCompraCompleto,
  type PedidoCompraItem,
  type UnidadeNegocio,
  type AdicionarItemData,
} from "@/lib/comprasApiNova";
import { normalizarDataIsoOuBr, formatarData } from "@/utils/formatadores";

type Fornecedor = {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
};

type Projeto = {
  id: string;
  nome: string;
};

type Contrato = {
  id: string;
  numero: string;
};

export default function PedidoCompraFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = !!id;

  // Dados do pedido
  const [pedido, setPedido] = useState<PedidoCompraCompleto | null>(null);
  const [fornecedorId, setFornecedorId] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [contratoId, setContratoId] = useState("");
  const [unidade, setUnidade] = useState<UnidadeNegocio | "">("");
  const [dataPedido, setDataPedido] = useState(formatarData(new Date()));
  const [dataPrevisaoEntrega, setDataPrevisaoEntrega] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");
  const [observacoes, setObservacoes] = useState("");

  // Listas de seleçÍo
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [contratos, setContratos] = useState<Contrato[]>([]);

  // Itens do pedido
  const [itens, setItens] = useState<PedidoCompraItem[]>([]);

  // Modal de adicionar item manual
  const [mostrarModalItem, setMostrarModalItem] = useState(false);
  const [itemEditando, setItemEditando] = useState<PedidoCompraItem | null>(null);
  const [novoItem, setNovoItem] = useState<AdicionarItemData>({
    descricao: "",
    sku: "",
    quantidade: 1,
    unidade: "UN",
    preco_unitario: 0,
    observacoes: "",
  });

  // Estados de UI
  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  // Carregar dados iniciais
  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    setCarregando(true);
    setErro("");

    try {
      // Carregar fornecedores
      const { data: fornData } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone")
        .eq("tipo", "FORNECEDOR")
        .eq("ativo", true)
        .order("nome");
      if (fornData) setFornecedores(fornData);

      // Carregar projetos
      const { data: projData } = await supabase
        .from("projetos")
        .select("id, nome")
        .order("nome");
      if (projData) setProjetos(projData);

      // Carregar contratos
      const { data: contrData } = await supabase
        .from("contratos")
        .select("id, numero")
        .order("numero");
      if (contrData) setContratos(contrData);

      // Se for ediçÍo, carregar pedido
      if (isEdicao && id) {
        const pedidoData = await buscarPedidoCompra(id);
        setPedido(pedidoData);
        setFornecedorId(pedidoData.fornecedor_id || "");
        setProjetoId(pedidoData.projeto_id || "");
        setContratoId(pedidoData.contrato_id || "");
        setUnidade(pedidoData.unidade || "");
        setDataPedido(formatarData(pedidoData.data_pedido));
        setDataPrevisaoEntrega(pedidoData.data_previsao_entrega ? formatarData(pedidoData.data_previsao_entrega) : "");
        setCondicoesPagamento(pedidoData.condicoes_pagamento || "");
        setObservacoes(pedidoData.observacoes || "");
        setItens(pedidoData.itens || []);
      }
    } catch (error: any) {
      setErro(error.message || "Erro ao carregar dados");
    } finally {
      setCarregando(false);
    }
  }

  async function handleSalvar() {
    setErro("");

    // Validações básicas
    if (!fornecedorId) {
      setErro("Selecione um fornecedor");
      return;
    }

    if (itens.length === 0) {
      setErro("Adicione pelo menos um item ao pedido");
      return;
    }

    setSalvando(true);

    try {
      if (isEdicao && id) {
        // Atualizar pedido existente
        await atualizarPedidoCompra(id, {
          fornecedor_id: fornecedorId || undefined,
          projeto_id: projetoId || undefined,
          contrato_id: contratoId || undefined,
          unidade: (unidade as UnidadeNegocio) || undefined,
          data_pedido: normalizarDataIsoOuBr(dataPedido),
          data_previsao_entrega: normalizarDataIsoOuBr(dataPrevisaoEntrega) || undefined,
          condicoes_pagamento: condicoesPagamento || undefined,
          observacoes: observacoes || undefined,
        });

        navigate(`/compras/detalhe/${id}`);
      } else {
        // Criar novo pedido
        const novoPedido = await criarPedidoCompra({
          fornecedor_id: fornecedorId || undefined,
          projeto_id: projetoId || undefined,
          contrato_id: contratoId || undefined,
          unidade: (unidade as UnidadeNegocio) || undefined,
          data_pedido: normalizarDataIsoOuBr(dataPedido),
          data_previsao_entrega: normalizarDataIsoOuBr(dataPrevisaoEntrega) || undefined,
          condicoes_pagamento: condicoesPagamento || undefined,
          observacoes: observacoes || undefined,
        });

        navigate(`/compras/detalhe/${novoPedido.id}`);
      }
    } catch (error: any) {
      setErro(error.message || "Erro ao salvar pedido");
    } finally {
      setSalvando(false);
    }
  }

  async function handleDeletar() {
    if (!id) return;

    const confirmar = window.confirm(
      "Tem certeza que deseja excluir este pedido de compra? Esta açÍo nÍo pode ser desfeita."
    );

    if (!confirmar) return;

    try {
      await deletarPedidoCompra(id);
      navigate("/compras");
    } catch (error: any) {
      setErro(error.message || "Erro ao deletar pedido");
    }
  }

  async function handleAdicionarItem() {
    if (!id) {
      setErro("Salve o pedido antes de adicionar itens");
      return;
    }

    if (!novoItem.descricao.trim()) {
      setErro("Informe a descriçÍo do item");
      return;
    }

    if (novoItem.quantidade <= 0) {
      setErro("Quantidade deve ser maior que zero");
      return;
    }

    if (novoItem.preco_unitario < 0) {
      setErro("Preço unitário nÍo pode ser negativo");
      return;
    }

    try {
      if (itemEditando) {
        // Atualizar item existente
        await atualizarItemPedido(itemEditando.id, novoItem);
      } else {
        // Adicionar novo item
        await adicionarItemPedido(id, novoItem);
      }

      // Recarregar pedido
      await carregarDados();

      // Limpar formulário
      setNovoItem({
        descricao: "",
        sku: "",
        quantidade: 1,
        unidade: "UN",
        preco_unitario: 0,
        observacoes: "",
      });
      setItemEditando(null);
      setMostrarModalItem(false);
    } catch (error: any) {
      setErro(error.message || "Erro ao adicionar item");
    }
  }

  async function handleRemoverItem(itemId: string) {
    const confirmar = window.confirm("Deseja remover este item do pedido?");
    if (!confirmar) return;

    try {
      await deletarItemPedido(itemId);
      await carregarDados();
    } catch (error: any) {
      setErro(error.message || "Erro ao remover item");
    }
  }

  function handleEditarItem(item: PedidoCompraItem) {
    setItemEditando(item);
    setNovoItem({
      descricao: item.descricao,
      sku: item.sku || "",
      quantidade: item.quantidade,
      unidade: item.unidade,
      preco_unitario: item.preco_unitario,
      observacoes: item.observacoes || "",
    });
    setMostrarModalItem(true);
  }

  function calcularTotal() {
    return itens.reduce((acc, item) => acc + item.preco_total, 0);
  }

  function formatarValor(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  if (carregando) {
    return (
      <div className="min-h-screen bg-[#F3F3F3] p-4 md:p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9A86A] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/compras")}
              className="p-2 hover:bg-white rounded-lg transition-colors"
            >
              <ArrowLeft size={24} className="text-[#1A1A1A]" />
            </button>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-[#1A1A1A]">
                {isEdicao ? `Editar Pedido ${pedido?.numero}` : "Novo Pedido de Compra"}
              </h1>
              <p className="text-[12px] text-gray-600 mt-1">
                {isEdicao ? "Edite as informações do pedido" : "Preencha os dados do novo pedido"}
              </p>
            </div>
          </div>

          {isEdicao && (
            <button
              onClick={handleDeletar}
              className="px-4 py-2 text-[14px] bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <Trash2 size={16} />
              Excluir Pedido
            </button>
          )}
        </div>

        {/* Mensagem de Erro */}
        {erro && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {erro}
          </div>
        )}

        {/* Formulário Principal */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-[16px] font-normal text-[#1A1A1A] mb-4">
            Informações do Pedido
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fornecedor */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Fornecedor *
              </label>
              <select
                value={fornecedorId}
                onChange={(e) => setFornecedorId(e.target.value)}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              >
                <option value="">Selecione um fornecedor</option>
                {fornecedores.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Projeto */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Projeto
              </label>
              <select
                value={projetoId}
                onChange={(e) => setProjetoId(e.target.value)}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              >
                <option value="">Nenhum projeto</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Contrato */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Contrato
              </label>
              <select
                value={contratoId}
                onChange={(e) => setContratoId(e.target.value)}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              >
                <option value="">Nenhum contrato</option>
                {contratos.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.numero}
                  </option>
                ))}
              </select>
            </div>

            {/* Unidade */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Unidade de Negócio
              </label>
              <select
                value={unidade}
                onChange={(e) => setUnidade(e.target.value as UnidadeNegocio | "")}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              >
                <option value="">Selecione uma unidade</option>
                <option value="Arquitetura">Arquitetura</option>
                <option value="Engenharia">Engenharia</option>
                <option value="Marcenaria">Marcenaria</option>
              </select>
            </div>

            {/* Data do Pedido */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Data do Pedido
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={dataPedido}
                onChange={(e) => setDataPedido(e.target.value)}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              />
            </div>

            {/* PrevisÍo de Entrega */}
            <div>
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                PrevisÍo de Entrega
              </label>
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={dataPrevisaoEntrega}
                onChange={(e) => setDataPrevisaoEntrega(e.target.value)}
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              />
            </div>

            {/* Condições de Pagamento */}
            <div className="md:col-span-2">
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Condições de Pagamento
              </label>
              <input
                type="text"
                value={condicoesPagamento}
                onChange={(e) => setCondicoesPagamento(e.target.value)}
                placeholder="Ex: 30/60/90 dias"
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
              />
            </div>

            {/* Observações */}
            <div className="md:col-span-2">
              <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                Observações
              </label>
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                rows={3}
                placeholder="Observações gerais sobre o pedido..."
                className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent resize-none"
              />
            </div>
          </div>
        </div>

        {/* Itens do Pedido */}
        {isEdicao && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-normal text-[#1A1A1A]">
                Itens do Pedido
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/compras/importar?pedido_id=${id}`)}
                  className="px-4 py-2 text-[14px] bg-[#C9A86A] text-white rounded-lg hover:bg-[#B8985A] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Package size={16} />
                  Importar Produto
                </button>
                <button
                  onClick={() => {
                    setItemEditando(null);
                    setNovoItem({
                      descricao: "",
                      sku: "",
                      quantidade: 1,
                      unidade: "UN",
                      preco_unitario: 0,
                      observacoes: "",
                    });
                    setMostrarModalItem(true);
                  }}
                  className="px-4 py-2 text-[14px] bg-[#1A1A1A] text-white rounded-lg hover:bg-[#2E2E2E] transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <Plus size={16} />
                  Adicionar Item
                </button>
              </div>
            </div>

            {itens.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Package size={48} className="mx-auto mb-4 opacity-50" />
                <p>Nenhum item adicionado</p>
                <p className="text-sm mt-2">
                  Clique em "Importar Produto" ou "Adicionar Item" para começar
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {itens.map((item) => (
                  <div
                    key={item.id}
                    className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all"
                  >
                    <div className="flex gap-4">
                      {/* Imagem */}
                      {item.imagem_url ? (
                        <img
                          src={item.imagem_url}
                          alt={item.descricao}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-[#F3F3F3] rounded-lg flex items-center justify-center text-gray-400 text-2xl">
                          📦
                        </div>
                      )}

                      {/* Informações */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="font-normal text-[#1A1A1A]">
                              {item.descricao}
                            </h3>
                            {item.sku && (
                              <p className="text-xs text-gray-500 mt-1">
                                SKU: {item.sku}
                              </p>
                            )}
                            {item.origem === "importado" && (
                              <span className="inline-block mt-2 text-xs bg-[#C9A86A] text-white px-2 py-1 rounded">
                                Importado
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditarItem(item)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              title="Editar item"
                            >
                              <Plus size={16} className="text-gray-600" />
                            </button>
                            <button
                              onClick={() => handleRemoverItem(item.id)}
                              className="p-2 hover:bg-red-50 rounded transition-colors"
                              title="Remover item"
                            >
                              <Trash2 size={16} className="text-red-600" />
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Qtd:</span>{" "}
                            <span className="font-medium">
                              {item.quantidade} {item.unidade}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Preço Unit.:</span>{" "}
                            <span className="font-medium">
                              {formatarValor(item.preco_unitario)}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Total:</span>{" "}
                            <span className="font-normal text-[#C9A86A]">
                              {formatarValor(item.preco_total)}
                            </span>
                          </div>
                        </div>

                        {item.url_origem && (
                          <a
                            href={item.url_origem}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
                          >
                            Ver produto original
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Total */}
            {itens.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-[16px] font-normal text-[#1A1A1A]">
                    Valor Total do Pedido:
                  </span>
                  <span className="text-[20px] font-normal text-[#C9A86A]">
                    {formatarValor(calcularTotal())}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Botões de AçÍo */}
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/compras")}
            className="px-6 py-3 text-[14px] bg-white text-[#1A1A1A] border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="flex-1 px-6 py-3 text-[14px] bg-[#C9A86A] text-white rounded-lg hover:bg-[#B8985A] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Save size={20} />
            {salvando ? "Salvando..." : isEdicao ? "Salvar Alterações" : "Criar Pedido"}
          </button>
        </div>

        {/* Modal de Adicionar Item */}
        {mostrarModalItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-[20px] font-normal text-[#1A1A1A] mb-4">
                  {itemEditando ? "Editar Item" : "Adicionar Item"}
                </h2>

                <div className="space-y-4">
                  {/* DescriçÍo */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                      DescriçÍo *
                    </label>
                    <input
                      type="text"
                      value={novoItem.descricao}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, descricao: e.target.value })
                      }
                      placeholder="Nome do produto..."
                      className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                    />
                  </div>

                  {/* SKU */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                      SKU / Código
                    </label>
                    <input
                      type="text"
                      value={novoItem.sku}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, sku: e.target.value })
                      }
                      placeholder="Código do produto..."
                      className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Quantidade */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                        Quantidade *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={novoItem.quantidade}
                        onChange={(e) =>
                          setNovoItem({
                            ...novoItem,
                            quantidade: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                      />
                    </div>

                    {/* Unidade */}
                    <div>
                      <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                        Unidade
                      </label>
                      <select
                        value={novoItem.unidade}
                        onChange={(e) =>
                          setNovoItem({ ...novoItem, unidade: e.target.value })
                        }
                        className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                      >
                        <option value="UN">UN - Unidade</option>
                        <option value="CX">CX - Caixa</option>
                        <option value="PC">PC - Peça</option>
                        <option value="KG">KG - Quilograma</option>
                        <option value="M">M - Metro</option>
                        <option value="M2">M² - Metro Quadrado</option>
                        <option value="M3">M³ - Metro Cúbico</option>
                        <option value="L">L - Litro</option>
                      </select>
                    </div>
                  </div>

                  {/* Preço Unitário */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                      Preço Unitário *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoItem.preco_unitario}
                      onChange={(e) =>
                        setNovoItem({
                          ...novoItem,
                          preco_unitario: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                    />
                  </div>

                  {/* Total Calculado */}
                  <div className="p-4 bg-[#F3F3F3] rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-[14px] font-medium text-[#1A1A1A]">
                        Total do Item:
                      </span>
                      <span className="text-[20px] font-normal text-[#C9A86A]">
                        {formatarValor(
                          (novoItem.quantidade || 0) * (novoItem.preco_unitario || 0)
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Observações */}
                  <div>
                    <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
                      Observações
                    </label>
                    <textarea
                      value={novoItem.observacoes}
                      onChange={(e) =>
                        setNovoItem({ ...novoItem, observacoes: e.target.value })
                      }
                      rows={3}
                      placeholder="Observações sobre este item..."
                      className="w-full px-4 py-3 text-[14px] border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                {/* Botões do Modal */}
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => {
                      setMostrarModalItem(false);
                      setItemEditando(null);
                    }}
                    className="flex-1 px-4 py-3 text-[14px] bg-white text-[#1A1A1A] border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdicionarItem}
                    className="flex-1 px-4 py-3 text-[14px] bg-[#C9A86A] text-white rounded-lg hover:bg-[#B8985A] transition-all shadow-sm hover:shadow-md"
                  >
                    {itemEditando ? "Salvar Alterações" : "Adicionar Item"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

