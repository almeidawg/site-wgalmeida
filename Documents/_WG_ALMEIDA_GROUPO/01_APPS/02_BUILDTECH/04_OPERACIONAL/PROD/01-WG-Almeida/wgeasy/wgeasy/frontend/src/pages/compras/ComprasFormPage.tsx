/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  criarPedidoCompra,
  atualizarPedidoCompra,
  buscarPedidoCompra,
  criarItemPedidoCompra,
  atualizarItemPedidoCompra,
  deletarItemPedidoCompra,
  type PedidoCompraFormData,
  type PedidoCompraItemFormData,
  type PedidoCompraCompleto,
  type PedidoCompraItem,
} from "@/lib/comprasApi";
import { listarPessoas } from "@/lib/pessoasApi";
import { validarPedido, validarItem, formatarValor } from "@/types/pedidosCompra";
import { DateInputBR, getTodayISO } from "@/components/ui/DateInputBR";

export default function ComprasFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdicao = !!id;

  const [loading, setLoading] = useState(false);
  const [pedido, setPedido] = useState<PedidoCompraCompleto | null>(null);
  const [fornecedores, setFornecedores] = useState<any[]>([]);

  // Dados do formulário
  const [fornecedorId, setFornecedorId] = useState("");
  const [dataPedido, setDataPedido] = useState(getTodayISO());
  const [dataPrevisao, setDataPrevisao] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [condicoesPagamento, setCondicoesPagamento] = useState("");

  // Itens
  const [itens, setItens] = useState<PedidoCompraItem[]>([]);
  const [novoItem, setNovoItem] = useState<PedidoCompraItemFormData>({
    descricao: "",
    quantidade: 1,
    unidade: "UN",
    preco_unitario: 0,
  });
  const [editandoItem, setEditandoItem] = useState<string | null>(null);

  useEffect(() => {
    carregarDados();
  }, [id]);

  async function carregarDados() {
    try {
      // Carregar fornecedores
      const pessoasData = await listarPessoas();
      const fornecedoresData = pessoasData.filter((p) => p.tipo === "FORNECEDOR");
      setFornecedores(fornecedoresData);

      // Se for ediçÍo, carregar pedido
      if (id) {
        const pedidoData = await buscarPedidoCompra(id);
        setPedido(pedidoData);
        setFornecedorId(pedidoData.fornecedor_id || "");
        setDataPedido(pedidoData.data_pedido);
        setDataPrevisao(pedidoData.data_previsao_entrega || "");
        setObservacoes(pedidoData.observacoes || "");
        setCondicoesPagamento(pedidoData.condicoes_pagamento || "");
        setItens(pedidoData.itens || []);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
      toast({ title: "Erro", description: "Erro ao carregar dados", variant: "destructive" });
    }
  }

  async function salvar() {
    const formData: PedidoCompraFormData = {
      fornecedor_id: fornecedorId,
      data_pedido: dataPedido,
      data_previsao_entrega: dataPrevisao || undefined,
      observacoes: observacoes || undefined,
      condicoes_pagamento: condicoesPagamento || undefined,
    };

    const erros = validarPedido(formData);
    if (erros.length > 0) {
      toast({ title: "Erros de validaçÍo", description: erros.join("\n"), variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (isEdicao && id) {
        await atualizarPedidoCompra(id, formData);
        toast({ title: "Sucesso", description: "Pedido atualizado com sucesso!" });
      } else {
        const novoPedido = await criarPedidoCompra(formData);
        toast({ title: "Sucesso", description: "Pedido criado com sucesso!" });
        navigate(`/compras/detalhe/${novoPedido.id}`);
      }
    } catch (err) {
      console.error("Erro ao salvar pedido:", err);
      toast({ title: "Erro", description: "Erro ao salvar pedido", variant: "destructive" });
    }
    setLoading(false);
  }

  async function adicionarItem() {
    if (!id) {
      toast({ title: "AtençÍo", description: "Salve o pedido antes de adicionar itens" });
      return;
    }

    const erros = validarItem(novoItem);
    if (erros.length > 0) {
      toast({ title: "Erros de validaçÍo", description: erros.join("\n"), variant: "destructive" });
      return;
    }

    try {
      await criarItemPedidoCompra(id, novoItem);
      setNovoItem({
        descricao: "",
        quantidade: 1,
        unidade: "UN",
        preco_unitario: 0,
      });
      await carregarDados();
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
      toast({ title: "Erro", description: "Erro ao adicionar item", variant: "destructive" });
    }
  }

  async function removerItem(itemId: string) {
    if (!confirm("Remover este item?")) return;

    try {
      await deletarItemPedidoCompra(itemId);
      await carregarDados();
    } catch (err) {
      console.error("Erro ao remover item:", err);
      toast({ title: "Erro", description: "Erro ao remover item", variant: "destructive" });
    }
  }

  const valorTotalItens = itens.reduce((acc, item) => acc + item.preco_total, 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
          {isEdicao ? "Editar Pedido de Compra" : "Novo Pedido de Compra"}
        </h1>
        <p className="text-[12px] text-[#4C4C4C]">
          {isEdicao
            ? `Editando pedido ${pedido?.numero || ""}`
            : "Preencha os dados do novo pedido"}
        </p>
      </div>

      {/* FORMULÁRIO PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6 space-y-4">
        <h2 className="text-[16px] font-normal text-[#2E2E2E]">Dados do Pedido</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-[14px] font-medium text-[#4C4C4C] mb-1">
              Fornecedor *
            </label>
            <select
              value={fornecedorId}
              onChange={(e) => setFornecedorId(e.target.value)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
            >
              <option value="">Selecione um fornecedor</option>
              {fornecedores.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#4C4C4C] mb-1">
              Data do Pedido *
            </label>
            <DateInputBR
              value={dataPedido}
              onChange={(val) => setDataPedido(val)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
              required
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#4C4C4C] mb-1">
              PrevisÍo de Entrega
            </label>
            <DateInputBR
              value={dataPrevisao}
              onChange={(val) => setDataPrevisao(val)}
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
            />
          </div>

          <div>
            <label className="block text-[14px] font-medium text-[#4C4C4C] mb-1">
              Condições de Pagamento
            </label>
            <input
              type="text"
              value={condicoesPagamento}
              onChange={(e) => setCondicoesPagamento(e.target.value)}
              placeholder="Ex: 30/60/90 dias"
              className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
            />
          </div>
        </div>

        <div>
          <label className="block text-[14px] font-medium text-[#4C4C4C] mb-1">
            Observações
          </label>
          <textarea
            value={observacoes}
            onChange={(e) => setObservacoes(e.target.value)}
            rows={3}
            className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
            placeholder="Observações sobre o pedido..."
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={salvar}
            disabled={loading}
            className="px-4 py-2 text-[14px] bg-primary text-white rounded hover:bg-[#d54b1c] disabled:opacity-50"
          >
            {loading ? "Salvando..." : isEdicao ? "Atualizar Pedido" : "Criar Pedido"}
          </button>
          <button
            onClick={() => navigate("/compras")}
            className="px-4 py-2 text-[14px] bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* ITENS DO PEDIDO (apenas na ediçÍo) */}
      {isEdicao && id && (
        <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6 space-y-4">
          <h2 className="text-[16px] font-normal text-[#2E2E2E]">Itens do Pedido</h2>

          {/* FORMULÁRIO NOVO ITEM */}
          <div className="bg-[#F3F3F3] p-4 rounded space-y-3">
            <h3 className="text-sm font-normal text-[#2E2E2E]">Adicionar Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div className="md:col-span-2">
                <input
                  type="text"
                  placeholder="DescriçÍo do item"
                  value={novoItem.descricao}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, descricao: e.target.value })
                  }
                  className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Quantidade"
                  value={novoItem.quantidade}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })
                  }
                  className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
                />
              </div>
              <div>
                <input
                  type="text"
                  placeholder="Unidade"
                  value={novoItem.unidade}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, unidade: e.target.value })
                  }
                  className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
                />
              </div>
              <div>
                <input
                  type="number"
                  placeholder="Preço Unit."
                  step="0.01"
                  value={novoItem.preco_unitario}
                  onChange={(e) =>
                    setNovoItem({ ...novoItem, preco_unitario: Number(e.target.value) })
                  }
                  className="w-full border border-[#E5E5E5] rounded px-3 py-2 text-[14px]"
                />
              </div>
            </div>
            <button
              onClick={adicionarItem}
              className="px-4 py-2 bg-[#10B981] text-white rounded text-[14px] hover:bg-[#059669]"
            >
              Adicionar Item
            </button>
          </div>

          {/* LISTA DE ITENS */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-[#F3F3F3]">
                <tr>
                  <th className="p-2 text-left">DescriçÍo</th>
                  <th className="p-2 text-left">Qtd</th>
                  <th className="p-2 text-left">Unidade</th>
                  <th className="p-2 text-left">Preço Unit.</th>
                  <th className="p-2 text-left">Total</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itens.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="p-2">{item.descricao}</td>
                    <td className="p-2">{item.quantidade}</td>
                    <td className="p-2">{item.unidade}</td>
                    <td className="p-2">{formatarValor(item.preco_unitario)}</td>
                    <td className="p-2 font-normal">{formatarValor(item.preco_total)}</td>
                    <td className="p-2">
                      <button
                        onClick={() => removerItem(item.id)}
                        className="text-red-600 hover:underline text-[14px]"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
                {itens.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-[#4C4C4C]">
                      Nenhum item adicionado
                    </td>
                  </tr>
                )}
              </tbody>
              {itens.length > 0 && (
                <tfoot className="bg-[#F3F3F3] font-normal">
                  <tr>
                    <td colSpan={4} className="p-2 text-right">
                      TOTAL:
                    </td>
                    <td className="p-2">{formatarValor(valorTotalItens)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

