// ============================================================
// ITEM MATERIAL CARD - Componente reutilizável
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState } from "react";
import {
  Plus,
  Minus,
  Trash2,
  Loader2,
  Package,
} from "lucide-react";

// ConfiguraçÍo de classificações
export const CLASSIFICACAO_CONFIG = {
  ACABAMENTO: { cor: "#10B981", corLight: "#D1FAE5", label: "Acabamento" },
  INSUMO: { cor: "#3B82F6", corLight: "#DBEAFE", label: "Insumo" },
  CONSUMIVEL: { cor: "#F59E0B", corLight: "#FEF3C7", label: "Consumível" },
  FERRAMENTA: { cor: "#6B7280", corLight: "#F3F4F6", label: "Ferramenta" },
} as const;

export type ClassificacaoMaterial = keyof typeof CLASSIFICACAO_CONFIG;

export interface ItemMaterial {
  id: string;
  descricao: string;
  classificacao: ClassificacaoMaterial;
  quantidade: number;
  unidade: string;
  preco_unitario: number;
  valor_total: number;
  categoria?: string;
  origem?: string; // "kit" | "pricelist" | "manual" | "importado"
  imagem_url?: string;
  pricelist_item_id?: string;
  composicao_nome?: string;
  ambientes?: string[];
}

interface ItemMaterialCardProps {
  item: ItemMaterial;
  onAjustarQuantidade: (id: string, delta: number) => void;
  onDefinirQuantidade?: (id: string, quantidade: number) => void;
  onRemover: (id: string) => void;
  onEditarPreco?: (id: string, preco: number) => void;
  mostrarOrigem?: boolean;
  mostrarAmbientes?: boolean;
  compacto?: boolean;
  editavel?: boolean;
  salvando?: boolean;
}

export function ItemMaterialCard({
  item,
  onAjustarQuantidade,
  onDefinirQuantidade,
  onRemover,
  onEditarPreco,
  mostrarOrigem = false,
  mostrarAmbientes = false,
  compacto = false,
  editavel = true,
  salvando = false,
}: ItemMaterialCardProps) {
  const [editandoPreco, setEditandoPreco] = useState(false);
  const config = CLASSIFICACAO_CONFIG[item.classificacao] || CLASSIFICACAO_CONFIG.INSUMO;

  const handlePrecoBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const novoPreco = parseFloat(e.target.value) || 0;
    if (onEditarPreco && novoPreco !== item.preco_unitario) {
      onEditarPreco(item.id, novoPreco);
    }
    setEditandoPreco(false);
  };

  if (compacto) {
    return (
      <div className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-colors">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: config.cor }}
          />
          <span className="text-sm text-gray-900 truncate">{item.descricao}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-700">
            {item.quantidade} {item.unidade}
          </span>
          <span className="text-sm font-normal text-green-600">
            {item.valor_total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </span>
          {editavel && (
            <button
              type="button"
              onClick={() => onRemover(item.id)}
              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-white rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
      <div className="flex items-start gap-3">
        {/* Imagem ou ícone */}
        <div className="w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
          {item.imagem_url ? (
            <img
              src={item.imagem_url}
              alt={item.descricao}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Conteúdo principal */}
        <div className="flex-1 min-w-0">
          {/* Tags */}
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span
              className="px-2 py-0.5 text-xs font-medium rounded"
              style={{ backgroundColor: config.corLight, color: config.cor }}
            >
              {config.label}
            </span>
            {mostrarOrigem && item.origem && (
              <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-600">
                {item.origem === "kit" ? "Kit" :
                 item.origem === "pricelist" ? "Catálogo" :
                 item.origem === "importado" ? "Importado" : "Manual"}
              </span>
            )}
            {item.composicao_nome && (
              <span className="text-xs text-gray-400">{item.composicao_nome}</span>
            )}
          </div>

          {/* DescriçÍo */}
          <p className="font-medium text-gray-900 text-sm leading-tight">{item.descricao}</p>

          {/* Ambientes */}
          {mostrarAmbientes && item.ambientes && item.ambientes.length > 0 && (
            <p className="text-xs text-gray-500 mt-0.5">
              {item.ambientes.join(", ")}
            </p>
          )}
        </div>

        {/* Controles */}
        <div className="flex flex-col items-end gap-2">
          {/* Quantidade */}
          {editavel ? (
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => onAjustarQuantidade(item.id, -1)}
                className="w-7 h-7 rounded-l-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <Minus className="w-3 h-3" />
              </button>
              <input
                type="number"
                value={item.quantidade}
                onChange={(e) => onDefinirQuantidade?.(item.id, parseFloat(e.target.value) || 0)}
                className="w-14 h-7 text-center text-sm font-medium border-y border-gray-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <button
                type="button"
                onClick={() => onAjustarQuantidade(item.id, 1)}
                className="w-7 h-7 rounded-r-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
              >
                <Plus className="w-3 h-3" />
              </button>
              <span className="text-xs text-gray-500 ml-1 w-8">{item.unidade}</span>
            </div>
          ) : (
            <span className="text-sm font-medium text-gray-700">
              {item.quantidade} {item.unidade}
            </span>
          )}

          {/* Preço e Total */}
          <div className="flex items-center gap-2">
            {editandoPreco ? (
              <input
                type="number"
                step="0.01"
                autoFocus
                defaultValue={item.preco_unitario}
                onBlur={handlePrecoBlur}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handlePrecoBlur(e as any);
                  if (e.key === "Escape") setEditandoPreco(false);
                }}
                className="w-20 text-center text-sm border border-green-300 rounded px-1 py-0.5 bg-green-50 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => editavel && setEditandoPreco(true)}
                className={`text-xs text-gray-500 ${editavel ? "hover:bg-green-50 hover:text-green-600 px-1.5 py-0.5 rounded cursor-pointer" : ""}`}
                disabled={!editavel}
              >
                {salvando ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  `R$ ${item.preco_unitario.toFixed(2)}/${item.unidade}`
                )}
              </button>
            )}
            <span className="text-sm font-normal text-green-600">
              = R$ {item.valor_total.toFixed(2)}
            </span>
          </div>

          {/* Remover */}
          {editavel && (
            <button
              type="button"
              onClick={() => onRemover(item.id)}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ItemMaterialCard;

