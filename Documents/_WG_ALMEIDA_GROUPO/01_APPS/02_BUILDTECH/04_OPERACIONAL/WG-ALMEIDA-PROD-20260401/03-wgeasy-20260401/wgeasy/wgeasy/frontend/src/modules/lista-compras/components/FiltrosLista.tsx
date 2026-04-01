// ============================================================
// FiltrosLista - Filtros por ambiente, status, tipo
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { Search, X, Filter } from 'lucide-react';
import type { FiltrosListaCompras, StatusItem, TipoCompra } from '../types';
import { STATUS_OPTIONS, TIPO_COMPRA_OPTIONS } from '../types';

interface FiltrosListaProps {
  filtros: FiltrosListaCompras;
  onChange: (filtros: FiltrosListaCompras) => void;
  ambientes: string[];
  categorias?: string[];
  fornecedores?: string[];
  totalItens: number;
  itensFiltrados: number;
}

export default function FiltrosLista({
  filtros,
  onChange,
  ambientes,
  categorias = [],
  fornecedores = [],
  totalItens,
  itensFiltrados,
}: FiltrosListaProps) {
  const temFiltros =
    filtros.ambiente ||
    filtros.categoria ||
    filtros.status ||
    filtros.tipo_compra ||
    filtros.fornecedor ||
    filtros.busca;

  const limparFiltros = () => {
    onChange({});
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
      {/* Busca */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          placeholder="Buscar por nome, descriçÍo, categoria..."
          value={filtros.busca || ''}
          onChange={(e) => onChange({ ...filtros, busca: e.target.value })}
          className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
        />
        {filtros.busca && (
          <button
            onClick={() => onChange({ ...filtros, busca: '' })}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Filtros em linha */}
      <div className="flex flex-wrap gap-3">
        {/* Ambiente */}
        <select
          value={filtros.ambiente || ''}
          onChange={(e) => onChange({ ...filtros, ambiente: e.target.value || undefined })}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary min-w-[140px]"
        >
          <option value="">Todos os ambientes</option>
          {ambientes.map((amb) => (
            <option key={amb} value={amb}>
              {amb}
            </option>
          ))}
        </select>

        {/* Categoria */}
        {categorias.length > 0 && (
          <select
            value={filtros.categoria || ''}
            onChange={(e) => onChange({ ...filtros, categoria: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary min-w-[140px]"
          >
            <option value="">Todas categorias</option>
            {categorias.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        )}

        {/* Status */}
        <select
          value={filtros.status || ''}
          onChange={(e) =>
            onChange({ ...filtros, status: (e.target.value as StatusItem) || undefined })
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary min-w-[130px]"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Tipo de Compra */}
        <select
          value={filtros.tipo_compra || ''}
          onChange={(e) =>
            onChange({ ...filtros, tipo_compra: (e.target.value as TipoCompra) || undefined })
          }
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary min-w-[140px]"
        >
          <option value="">Todos os tipos</option>
          {TIPO_COMPRA_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Fornecedor */}
        {fornecedores.length > 0 && (
          <select
            value={filtros.fornecedor || ''}
            onChange={(e) => onChange({ ...filtros, fornecedor: e.target.value || undefined })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary min-w-[140px]"
          >
            <option value="">Todos fornecedores</option>
            {fornecedores.map((forn) => (
              <option key={forn} value={forn}>
                {forn}
              </option>
            ))}
          </select>
        )}

        {/* Limpar filtros */}
        {temFiltros && (
          <button
            onClick={limparFiltros}
            className="px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1.5 transition-colors"
          >
            <X size={16} />
            Limpar
          </button>
        )}
      </div>

      {/* Contador */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
        <Filter size={14} className="text-gray-400" />
        <span className="text-sm text-gray-500">
          Exibindo{' '}
          <span className="font-medium text-gray-700">{itensFiltrados}</span> de{' '}
          <span className="font-medium text-gray-700">{totalItens}</span> itens
        </span>
      </div>
    </div>
  );
}

