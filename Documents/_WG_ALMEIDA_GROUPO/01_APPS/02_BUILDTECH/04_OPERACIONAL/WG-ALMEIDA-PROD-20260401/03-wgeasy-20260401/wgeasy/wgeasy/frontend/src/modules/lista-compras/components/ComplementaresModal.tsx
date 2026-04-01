// ============================================================
// ComplementaresModal - Modal de produtos complementares
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect } from 'react';
import {
  X,
  Package,
  Check,
  AlertCircle,
  Info,
  Loader2,
  ShoppingCart,
} from 'lucide-react';
import type { ComplementarCalculado, ProdutoPricelist } from '../types';
import {
  formatCurrency,
  formatQuantidade,
  getObrigatoriedadeClasses,
  getObrigatoriedadeLabel,
} from '../utils/formatters';

interface ComplementaresModalProps {
  aberto: boolean;
  onFechar: () => void;
  produto: ProdutoPricelist | null;
  quantidade: number;
  complementares: ComplementarCalculado[];
  loading: boolean;
  onToggleComplementar: (index: number) => void;
  onConfirmar: () => void;
  totalComplementares: number;
}

export default function ComplementaresModal({
  aberto,
  onFechar,
  produto,
  quantidade,
  complementares,
  loading,
  onToggleComplementar,
  onConfirmar,
  totalComplementares,
}: ComplementaresModalProps) {
  // Bloquear scroll quando aberto
  useEffect(() => {
    if (aberto) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [aberto]);

  // Fechar com ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar();
    };
    if (aberto) {
      document.addEventListener('keydown', handleEsc);
    }
    return () => document.removeEventListener('keydown', handleEsc);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  const selecionados = complementares.filter((c) => c.selecionado);
  const valorProduto = produto ? produto.preco * quantidade : 0;
  const valorTotal = valorProduto + totalComplementares;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onFechar}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Package size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="font-normal text-gray-900">Produtos Complementares</h2>
                <p className="text-sm text-gray-500">
                  Itens sugeridos para o produto selecionado
                </p>
              </div>
            </div>
            <button
              onClick={onFechar}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Produto Principal */}
          {produto && (
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white rounded-lg overflow-hidden border border-gray-200">
                  {produto.imagem_url ? (
                    <img
                      src={produto.imagem_url}
                      alt={produto.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package size={20} />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{produto.nome}</p>
                  <p className="text-sm text-gray-500">
                    {formatQuantidade(quantidade, produto.unidade)} × {formatCurrency(produto.preco)}
                  </p>
                </div>
                <span className="font-normal text-gray-900">{formatCurrency(valorProduto)}</span>
              </div>
            </div>
          )}

          {/* Lista de Complementares */}
          <div className="flex-1 overflow-y-auto p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Loader2 className="animate-spin text-wg-primary mb-3" size={32} />
                <p className="text-gray-500">Calculando complementares...</p>
              </div>
            ) : complementares.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Info size={32} className="text-gray-300 mb-3" />
                <p>Nenhum complementar disponível para este produto</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {complementares.map((comp, index) => {
                  const classes = getObrigatoriedadeClasses(comp.obrigatoriedade);
                  const isObrigatorio = comp.obrigatoriedade === 'OBRIGATORIO';

                  return (
                    <li
                      key={index}
                      className={`p-3 rounded-lg border ${
                        comp.selecionado
                          ? 'border-wg-primary bg-wg-primary/5'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <button
                          onClick={() => !isObrigatorio && onToggleComplementar(index)}
                          disabled={isObrigatorio}
                          className={`w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mt-0.5 ${
                            comp.selecionado
                              ? 'bg-wg-primary border-wg-primary text-white'
                              : 'border-gray-300 bg-white'
                          } ${isObrigatorio ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          {comp.selecionado && <Check size={12} />}
                        </button>

                        {/* Conteúdo */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-medium text-gray-900">
                                {comp.complemento_descricao}
                              </p>
                              <p className="text-sm text-gray-500">
                                {formatQuantidade(comp.quantidade_necessaria, comp.unidade)}
                                {comp.preco_referencia > 0 && (
                                  <> × {formatCurrency(comp.preco_referencia)}</>
                                )}
                              </p>
                            </div>

                            {/* Badge obrigatoriedade */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${classes.bg} ${classes.text}`}
                            >
                              {getObrigatoriedadeLabel(comp.obrigatoriedade)}
                            </span>
                          </div>

                          {/* Valor */}
                          {comp.valor_estimado > 0 && (
                            <p className="text-sm font-medium text-gray-900 mt-1">
                              {formatCurrency(comp.valor_estimado)}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Aviso obrigatório */}
                      {isObrigatorio && (
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
                          <AlertCircle size={12} />
                          <span>Item obrigatório - não pode ser removido</span>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            {/* Resumo */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">
                  {selecionados.length} complementar(es) selecionado(s)
                </p>
                <p className="text-lg font-normal text-gray-900">
                  Total: {formatCurrency(valorTotal)}
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3">
              <button
                onClick={onFechar}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-100 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirmar}
                className="flex-1 px-4 py-2.5 bg-wg-primary text-white rounded-lg font-medium hover:bg-wg-primary-dark transition-colors flex items-center justify-center gap-2"
              >
                <ShoppingCart size={18} />
                Adicionar à Lista
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}


