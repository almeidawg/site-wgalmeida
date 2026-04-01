// ============================================================
// COMPONENTE: ItemCompraCard
// Card para exibir item de pedido de compra
// ============================================================

import { useState } from "react";
import { Trash2, Edit2, ExternalLink } from "lucide-react";
import type { PedidoCompraItem } from "@/lib/comprasApiNova";

interface ItemCompraCardProps {
  item: PedidoCompraItem;
  onEditar?: (item: PedidoCompraItem) => void;
  onRemover?: (id: string) => void;
  readonly?: boolean;
}

export default function ItemCompraCard({
  item,
  onEditar,
  onRemover,
  readonly = false,
}: ItemCompraCardProps) {
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  const handleRemover = () => {
    if (confirmandoRemocao) {
      onRemover?.(item.id);
      setConfirmandoRemocao(false);
    } else {
      setConfirmandoRemocao(true);
      setTimeout(() => setConfirmandoRemocao(false), 3000);
    }
  };

  const formatarPreco = (valor: number) => {
    return valor.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-all">
      <div className="flex gap-4">
        {/* Imagem do produto */}
        <div className="flex-shrink-0">
          {item.imagem_url ? (
            <img
              src={item.imagem_url}
              alt={item.descricao}
              className="w-20 h-20 object-cover rounded-lg border border-gray-200"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 bg-[#F3F3F3] rounded-lg flex items-center justify-center text-gray-400 text-2xl">
              📦
            </div>
          )}
        </div>

        {/* Informações do produto */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-normal text-[#1A1A1A] line-clamp-2 mb-1">
                {item.descricao}
              </h3>

              {item.sku && (
                <div className="text-xs text-gray-500 mb-1">
                  SKU: {item.sku}
                </div>
              )}

              {item.origem === 'importado' && (
                <div className="flex items-center gap-1 text-xs text-[#C9A86A] mb-2">
                  <span className="bg-[#C9A86A]/10 px-2 py-0.5 rounded">
                    Importado
                  </span>
                  {item.url_origem && (
                    <a
                      href={item.url_origem}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-[#B8985A] transition-colors"
                      title="Ver produto original"
                    >
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Botões de açÍo */}
            {!readonly && (
              <div className="flex items-center gap-1">
                {onEditar && (
                  <button
                    onClick={() => onEditar(item)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Editar item"
                  >
                    <Edit2 size={16} className="text-gray-600" />
                  </button>
                )}

                {onRemover && (
                  <button
                    onClick={handleRemover}
                    className={`p-2 rounded-lg transition-all ${
                      confirmandoRemocao
                        ? 'bg-red-100 text-red-600'
                        : 'hover:bg-red-50 text-gray-600 hover:text-red-600'
                    }`}
                    title={confirmandoRemocao ? 'Clique novamente para confirmar' : 'Remover item'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quantidade e Preços */}
          <div className="grid grid-cols-3 gap-3 mt-3 pt-3 border-t border-gray-100">
            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Quantidade
              </div>
              <div className="text-sm font-normal text-[#1A1A1A]">
                {item.quantidade} {item.unidade}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Preço Unit.
              </div>
              <div className="text-sm font-normal text-[#1A1A1A]">
                {formatarPreco(item.preco_unitario)}
              </div>
            </div>

            <div>
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Total
              </div>
              <div className="text-sm font-normal text-[#C9A86A]">
                {formatarPreco(item.preco_total)}
              </div>
            </div>
          </div>

          {/* Observações */}
          {item.observacoes && (
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="text-[10px] text-gray-500 uppercase tracking-wide mb-0.5">
                Observações
              </div>
              <div className="text-xs text-gray-600">
                {item.observacoes}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

