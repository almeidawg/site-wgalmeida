/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useEffect, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  buscarPedidoCompra,
  alterarStatusPedidoCompra,
  duplicarPedidoCompra,
  type PedidoCompraCompleto,
} from "@/lib/comprasApi";
import {
  STATUS_PEDIDO_LABELS,
  type StatusPedidoCompra,
  STATUS_PEDIDO_COLORS,
  formatarValor,
  formatarData,
  getStatusPedidoIcon,
  getUrgenciaPedido,
  podeAprovarPedido,
  podeCancelarPedido,
  podeMarcarComoEntregue,
} from "@/types/pedidosCompra";

export default function ComprasDetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [pedido, setPedido] = useState<PedidoCompraCompleto | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      carregar();
    }
  }, [id]);

  async function carregar() {
    if (!id) return;

    setLoading(true);
    try {
      const data = await buscarPedidoCompra(id);
      setPedido(data);
    } catch (err) {
      console.error("Erro ao carregar pedido:", err);
      toast({ title: "Erro", description: "Erro ao carregar pedido", variant: "destructive" });
    }
    setLoading(false);
  }

  async function mudarStatus(novoStatus: StatusPedidoCompra) {
    if (!id) return;

    try {
      await alterarStatusPedidoCompra(id, novoStatus);
      await carregar();
      toast({ title: "Status atualizado", description: `Status alterado para ${STATUS_PEDIDO_LABELS[novoStatus] ?? novoStatus}` });
    } catch (err) {
      console.error("Erro ao alterar status:", err);
      toast({ title: "Erro", description: "Erro ao alterar status", variant: "destructive" });
    }
  }

  async function duplicar() {
    if (!id || !confirm("Duplicar este pedido?")) return;

    try {
      const novoPedido = await duplicarPedidoCompra(id);
      toast({ title: "Sucesso", description: "Pedido duplicado com sucesso!" });
      navigate(`/compras/${novoPedido.id}`);
    } catch (err) {
      console.error("Erro ao duplicar pedido:", err);
      toast({ title: "Erro", description: "Erro ao duplicar pedido", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Carregando pedido...
      </div>
    );
  }

  if (!pedido) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Pedido nÍo encontrado
      </div>
    );
  }

  const urgencia = getUrgenciaPedido(pedido);

  return (
    <div className={`${LAYOUT.pageContainer} ${LAYOUT.sectionGap}`}>
      {/* HEADER */}
      <div className={LAYOUT.pageHeader}>
        <div>
          <div className={LAYOUT.pageTitleWrapper}>
            <span className="text-2xl sm:text-3xl">{getStatusPedidoIcon(pedido.status)}</span>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>
                Pedido {pedido.numero}
              </h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                Detalhes do pedido de compra
              </p>
            </div>
          </div>
        </div>

        <div className={LAYOUT.pageActions}>
          <button
            onClick={() => navigate("/compras")}
            className="px-3 py-2 text-[13px] sm:text-[14px] bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Voltar
          </button>
          <button
            onClick={duplicar}
            className="px-3 py-2 text-[13px] sm:text-[14px] bg-white border border-[#E5E5E5] rounded hover:bg-[#F3F3F3]"
          >
            Duplicar
          </button>
          <Link
            to={`/compras/editar/${pedido.id}`}
            className="px-3 sm:px-4 py-2 text-[13px] sm:text-[14px] bg-primary text-white rounded hover:bg-[#d54b1c]"
          >
            Editar
          </Link>
        </div>
      </div>

      {/* STATUS E URGÊNCIA */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <div
          className={`${TYPOGRAPHY.badge} text-white`}
          style={{ backgroundColor: STATUS_PEDIDO_COLORS[pedido.status] }}
        >
          {STATUS_PEDIDO_LABELS[pedido.status]}
        </div>
        {urgencia.urgente && (
          <div
            className={`${TYPOGRAPHY.badge} text-white`}
            style={{ backgroundColor: urgencia.color }}
          >
            {urgencia.label}
          </div>
        )}
      </div>

      {/* AÇÕES RÁPIDAS */}
      <div className={LAYOUT.card}>
        <h2 className={`${TYPOGRAPHY.cardTitle} mb-3`}>Ações Rápidas</h2>
        <div className="flex flex-wrap gap-2">
          {podeAprovarPedido(pedido) && (
            <button
              onClick={() => mudarStatus("aprovado")}
              className="px-3 py-2 text-[14px] bg-green-600 text-white rounded hover:bg-green-700"
            >
              ✅ Aprovar Pedido
            </button>
          )}
          {pedido.status === "aprovado" && (
            <button
              onClick={() => mudarStatus("em_transito")}
              className="px-3 py-2 text-[14px] bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              🚚 Marcar Em Trânsito
            </button>
          )}
          {podeMarcarComoEntregue(pedido) && (
            <button
              onClick={() => mudarStatus("entregue")}
              className="px-3 py-2 text-[14px] bg-green-600 text-white rounded hover:bg-green-700"
            >
              📦 Marcar Como Entregue
            </button>
          )}
          {podeCancelarPedido(pedido) && (
            <button
              onClick={() => mudarStatus("cancelado")}
              className="px-3 py-2 text-[14px] bg-red-600 text-white rounded hover:bg-red-700"
            >
              ❌ Cancelar Pedido
            </button>
          )}
        </div>
      </div>

      {/* INFORMAÇÕES DO PEDIDO */}
      <div className={LAYOUT.gridHalf}>
        {/* DADOS PRINCIPAIS */}
        <div className={LAYOUT.card}>
          <h2 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
            Dados do Pedido
          </h2>
          <div className="space-y-3 text-sm">
            <div>
              <span className="text-[#4C4C4C]">Número:</span>
              <span className="ml-2 font-mono font-normal">{pedido.numero}</span>
            </div>
            <div>
              <span className="text-[#4C4C4C]">Fornecedor:</span>
              <span className="ml-2 font-normal">{pedido.fornecedor?.nome || "-"}</span>
            </div>
            {pedido.fornecedor?.email && (
              <div>
                <span className="text-[#4C4C4C]">Email:</span>
                <span className="ml-2">{pedido.fornecedor.email}</span>
              </div>
            )}
            {pedido.fornecedor?.telefone && (
              <div>
                <span className="text-[#4C4C4C]">Telefone:</span>
                <span className="ml-2">{pedido.fornecedor.telefone}</span>
              </div>
            )}
            <div>
              <span className="text-[#4C4C4C]">Data do Pedido:</span>
              <span className="ml-2">{formatarData(pedido.data_pedido)}</span>
            </div>
            <div>
              <span className="text-[#4C4C4C]">PrevisÍo de Entrega:</span>
              <span className="ml-2">{formatarData(pedido.data_previsao_entrega)}</span>
            </div>
            {pedido.data_entrega_real && (
              <div>
                <span className="text-[#4C4C4C]">Data de Entrega:</span>
                <span className="ml-2">{formatarData(pedido.data_entrega_real)}</span>
              </div>
            )}
            {pedido.condicoes_pagamento && (
              <div>
                <span className="text-[#4C4C4C]">Condições de Pagamento:</span>
                <span className="ml-2">{pedido.condicoes_pagamento}</span>
              </div>
            )}
          </div>
        </div>

        {/* VALORES */}
        <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">Valores</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[#4C4C4C]">Total de Itens:</span>
              <span className="font-normal">{pedido.total_itens}</span>
            </div>
            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-[16px] font-normal text-[#2E2E2E]">Valor Total:</span>
              <span className="text-[20px] font-normal text-[#F25C26]">
                {formatarValor(pedido.valor_total)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* OBSERVAÇÕES */}
      {pedido.observacoes && (
        <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
          <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-3">Observações</h2>
          <p className="text-[12px] text-[#4C4C4C] whitespace-pre-wrap">{pedido.observacoes}</p>
        </div>
      )}

      {/* ITENS DO PEDIDO */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
        <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-4">
          Itens do Pedido ({pedido.total_itens})
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[#F3F3F3]">
              <tr>
                <th className="p-3 text-left">DescriçÍo</th>
                <th className="p-3 text-left">Código</th>
                <th className="p-3 text-left">Quantidade</th>
                <th className="p-3 text-left">Unidade</th>
                <th className="p-3 text-left">Preço Unitário</th>
                <th className="p-3 text-left">Total</th>
              </tr>
            </thead>
            <tbody>
              {pedido.itens && pedido.itens.map((item) => (
                <tr key={item.id} className="border-b">
                  <td className="p-3">
                    <div>
                      <div className="font-medium">{item.descricao}</div>
                      {item.pricelist_item?.marca && (
                        <div className="text-xs text-[#4C4C4C]">
                          Marca: {item.pricelist_item.marca}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-mono text-xs">
                    {item.pricelist_item?.codigo || "-"}
                  </td>
                  <td className="p-3">{item.quantidade}</td>
                  <td className="p-3">{item.unidade}</td>
                  <td className="p-3">{formatarValor(item.preco_unitario)}</td>
                  <td className="p-3 font-normal">{formatarValor(item.preco_total)}</td>
                </tr>
              ))}
              {(!pedido.itens || pedido.itens.length === 0) && (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-[#4C4C4C]">
                    Nenhum item adicionado ao pedido
                  </td>
                </tr>
              )}
            </tbody>
            {pedido.itens && pedido.itens.length > 0 && (
              <tfoot className="bg-[#F3F3F3]">
                <tr>
                  <td colSpan={5} className="p-3 text-right font-normal">
                    TOTAL:
                  </td>
                  <td className="p-3 font-normal text-[#F25C26]">
                    {formatarValor(pedido.valor_total)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* AUDITORIA */}
      <div className="bg-white rounded-xl shadow-md border border-[#E5E5E5] p-6">
        <h2 className="text-[16px] font-normal text-[#2E2E2E] mb-3">Informações de Auditoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[12px] text-[#4C4C4C]">
          <div>
            <span>Criado em:</span>
            <span className="ml-2">{formatarData(pedido.created_at)}</span>
          </div>
          <div>
            <span>Atualizado em:</span>
            <span className="ml-2">{formatarData(pedido.updated_at)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

