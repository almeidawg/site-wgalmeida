/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// ItemCard - Card de item da lista de compras
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState } from 'react';
import {
  ExternalLink,
  Trash2,
  Package,
  ChevronDown,
  ChevronUp,
  Building2,
  User,
  Minus,
  Plus,
} from 'lucide-react';
import type { ItemListaCompra, StatusItem, TipoCompra } from '../types';
import { STATUS_OPTIONS } from '../types';
import {
  formatCurrency,
  formatQuantidade,
  getStatusClasses,
  getTipoCompraClasses,
  getStatusLabel,
} from '../utils/formatters';

interface ItemCardProps {
  item: ItemListaCompra;
  onUpdateStatus: (id: string, status: StatusItem) => void;
  onUpdateTipoCompra: (id: string, tipo: TipoCompra) => void;
  onUpdateQuantidade: (id: string, qtd: number) => void;
  onRemover: (id: string) => void;
  isComplementar?: boolean;
}

export default function ItemCard({
  item,
  onUpdateStatus,
  onUpdateTipoCompra,
  onUpdateQuantidade,
  onRemover,
  isComplementar = false,
}: ItemCardProps) {
  const [expandido, setExpandido] = useState(false);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const statusClasses = getStatusClasses(item.status);
  const tipoCompraClasses = getTipoCompraClasses(item.tipo_compra);

  const handleQuantidadeChange = (delta: number) => {
    const novaQtd = Math.max(0.01, item.qtd_compra + delta);
    onUpdateQuantidade(item.id, novaQtd);
  };

  const handleRemover = () => {
    if (confirmandoExclusao) {
      onRemover(item.id);
      setConfirmandoExclusao(false);
    } else {
      setConfirmandoExclusao(true);
      // Reset após 3 segundos
      setTimeout(() => setConfirmandoExclusao(false), 3000);
    }
  };

  return (
    <div
      className={`bg-white rounded-lg border ${
        isComplementar ? 'ml-8 border-l-4 border-l-purple-300' : ''
      } ${statusClasses.border} shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* Header do Card */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Imagem */}
          <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
            {item.imagem_url ? (
              <img
                src={item.imagem_url}
                alt={item.item}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <Package size={24} />
              </div>
            )}
          </div>

          {/* Conteúdo Principal */}
          <div className="flex-1 min-w-0">
            {/* Nome e Ambiente */}
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-medium text-gray-900 truncate">{item.item}</h3>
                <p className="text-sm text-gray-500">
                  {item.ambiente}
                  {item.categoria && ` • ${item.categoria}`}
                </p>
              </div>

              {/* Status Badge */}
              <div
                className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusClasses.bg} ${statusClasses.text}`}
              >
                {getStatusLabel(item.status)}
              </div>
            </div>

            {/* Valores */}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {/* Quantidade */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuantidadeChange(-1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium min-w-[60px] text-center">
                  {formatQuantidade(item.qtd_compra, item.unidade)}
                </span>
                <button
                  onClick={() => handleQuantidadeChange(1)}
                  className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600"
                >
                  <Plus size={14} />
                </button>
              </div>

              <span className="text-gray-300">•</span>

              {/* Preço Unitário */}
              <span className="text-sm text-gray-500">
                {formatCurrency(item.preco_unit)} / {item.unidade}
              </span>

              <span className="text-gray-300">•</span>

              {/* Total */}
              <span className="text-sm font-normal text-gray-900">
                {formatCurrency(item.valor_total)}
              </span>

              {/* FEE (se Cliente Direto) */}
              {item.tipo_compra === 'CLIENTE_DIRETO' && item.valor_fee > 0 && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-sm text-purple-600 font-medium">
                    FEE: {formatCurrency(item.valor_fee)}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Ações Rápidas */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {/* Toggle Tipo Compra */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => onUpdateTipoCompra(item.id, 'WG_COMPRA')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                item.tipo_compra === 'WG_COMPRA'
                  ? 'bg-green-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Building2 size={14} />
              WG Compra
            </button>
            <button
              onClick={() => onUpdateTipoCompra(item.id, 'CLIENTE_DIRETO')}
              className={`px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
                item.tipo_compra === 'CLIENTE_DIRETO'
                  ? 'bg-amber-500 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <User size={14} />
              Cliente Direto
            </button>
          </div>

          {/* Select Status */}
          <select
            value={item.status}
            onChange={(e) => onUpdateStatus(item.id, e.target.value as StatusItem)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border ${statusClasses.border} ${statusClasses.bg} ${statusClasses.text} focus:outline-none focus:ring-2 focus:ring-wg-primary/20`}
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Fornecedor */}
          {item.fornecedor_nome && (
            <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
              {item.fornecedor_nome}
            </span>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Link Externo */}
          {item.link_produto && (
            <a
              href={item.link_produto}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
              title="Ver produto"
            >
              <ExternalLink size={16} />
            </a>
          )}

          {/* Expandir */}
          <button
            onClick={() => setExpandido(!expandido)}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {/* Excluir */}
          <button
            onClick={handleRemover}
            className={`p-1.5 rounded transition-colors ${
              confirmandoExclusao
                ? 'bg-red-500 text-white'
                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
            }`}
            title={confirmandoExclusao ? 'Clique novamente para confirmar' : 'Excluir'}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Conteúdo Expandido */}
      {expandido && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            {item.descricao && (
              <div>
                <span className="text-gray-500">DescriçÍo:</span>
                <p className="text-gray-700">{item.descricao}</p>
              </div>
            )}

            {item.observacoes && (
              <div>
                <span className="text-gray-500">Observações:</span>
                <p className="text-gray-700">{item.observacoes}</p>
              </div>
            )}

            <div>
              <span className="text-gray-500">Tipo de Conta:</span>
              <p className={item.tipo_conta === 'REAL' ? 'text-green-600' : 'text-amber-600'}>
                {item.tipo_conta === 'REAL' ? 'Conta Real (Fiscal)' : 'Conta Virtual (Gerencial)'}
              </p>
            </div>

            {item.tipo_compra === 'CLIENTE_DIRETO' && (
              <div>
                <span className="text-gray-500">Taxa FEE:</span>
                <p className="text-purple-600">{item.taxa_fee_percent}%</p>
              </div>
            )}

            {item.data_aprovacao && (
              <div>
                <span className="text-gray-500">Aprovado em:</span>
                <p className="text-gray-700">
                  {new Date(item.data_aprovacao).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {item.data_compra && (
              <div>
                <span className="text-gray-500">Comprado em:</span>
                <p className="text-gray-700">
                  {new Date(item.data_compra).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {item.data_entrega && (
              <div>
                <span className="text-gray-500">Entregue em:</span>
                <p className="text-gray-700">
                  {new Date(item.data_entrega).toLocaleDateString('pt-BR')}
                </p>
              </div>
            )}

            {item.numero_nf && (
              <div>
                <span className="text-gray-500">Nota Fiscal:</span>
                <p className="text-gray-700">{item.numero_nf}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

