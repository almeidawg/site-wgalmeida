// ============================================================
// Componente: ProdutoCard
// Sistema WG Easy 2026 - Grupo WG Almeida
// Card de produto do catálogo de fornecedores
// ============================================================

import { useState } from "react";
import type { MouseEvent } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Check,
  ExternalLink,
  Palette,
  X,
  Heart,
  ShoppingCart,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CatalogoItem } from "@/types/moodboardCliente";

interface ProdutoCardProps {
  produto: CatalogoItem;
  isSelected?: boolean;
  isFavorite?: boolean;
  onSelect?: (produto: CatalogoItem) => void;
  onFavorite?: (produto: CatalogoItem) => void;
  onViewDetails?: (produto: CatalogoItem) => void;
  compact?: boolean;
  showPrice?: boolean;
}

export function ProdutoCard({
  produto,
  isSelected = false,
  isFavorite = false,
  onSelect,
  onFavorite,
  onViewDetails,
  compact = false,
  showPrice = true,
}: ProdutoCardProps) {
  const [imageError, setImageError] = useState(false);

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    onSelect?.(produto);
  };

  const handleFavorite = (e: MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(produto);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (compact) {
    return (
      <div
        onClick={() => onViewDetails?.(produto)}
        className={cn(
          "flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all",
          isSelected
            ? "border-[#F25C26] bg-orange-50"
            : "border-gray-200 hover:border-gray-300"
        )}
      >
        <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {produto.imagem_url && !imageError ? (
            <img
              src={produto.imagem_url}
              alt={produto.nome}
              className="w-full h-full object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Palette className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{produto.nome}</p>
          <p className="text-xs text-gray-500 truncate">
            {produto.fornecedor?.nome}
          </p>
        </div>
        {showPrice && produto.preco_referencia && (
          <span className="text-sm font-medium text-[#F25C26]">
            {formatPrice(produto.preco_referencia)}
          </span>
        )}
        {isSelected && <Check className="h-5 w-5 text-[#F25C26]" />}
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all cursor-pointer",
        isSelected && "ring-2 ring-[#F25C26] ring-offset-2"
      )}
      onClick={() => onViewDetails?.(produto)}
    >
      {/* Imagem */}
      <div className="relative aspect-square bg-gray-100">
        {produto.imagem_url && !imageError ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Palette className="h-12 w-12 text-gray-300" />
          </div>
        )}

        {/* Overlay de ações */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
          {/* Botões superiores */}
          <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="secondary"
              className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
              onClick={handleFavorite}
            >
              <Heart
                className={cn(
                  "h-4 w-4",
                  isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
                )}
              />
            </Button>
            {produto.link_externo && (
              <Button
                size="icon"
                variant="secondary"
                className="h-8 w-8 rounded-full bg-white/90 hover:bg-white"
                onClick={(e) => {
                  e.stopPropagation();
                  if (produto.link_externo) {
                    window.open(produto.link_externo, "_blank");
                  }
                }}
              >
                <ExternalLink className="h-4 w-4 text-gray-600" />
              </Button>
            )}
          </div>

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {isSelected && (
              <Badge className="bg-primary text-white">
                <Check className="h-3 w-3 mr-1" />
                Selecionado
              </Badge>
            )}
            {!produto.estoque_disponivel && (
              <Badge variant="destructive" className="text-xs">
                Indisponível
              </Badge>
            )}
          </div>

          {/* BotÍo de selecionar */}
          <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              className={cn(
                "w-full",
                isSelected
                  ? "bg-red-500 hover:bg-red-600"
                  : "bg-gradient-to-r from-[#F25C26] to-[#F57F17] hover:from-[#D94C1F] hover:to-[#E56E10]"
              )}
              onClick={handleSelect}
            >
              {isSelected ? (
                <>
                  <X className="h-4 w-4 mr-2" />
                  Remover
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Selecionar
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Badge do fornecedor */}
        {produto.fornecedor && (
          <div className="absolute bottom-2 left-2 group-hover:opacity-0 transition-opacity">
            {produto.fornecedor.logo_url ? (
              <img
                src={produto.fornecedor.logo_url}
                alt={produto.fornecedor.nome}
                className="h-6 rounded bg-white/90 px-1"
              />
            ) : (
              <Badge variant="secondary" className="text-xs bg-white/90">
                {produto.fornecedor.nome}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <CardContent className="p-3 space-y-2">
        <div>
          <h3 className="font-medium text-sm line-clamp-2">{produto.nome}</h3>
          {produto.codigo_produto && (
            <p className="text-xs text-gray-500">Cód: {produto.codigo_produto}</p>
          )}
        </div>

        {/* Categoria e subcategoria */}
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-xs">
            {produto.categoria}
          </Badge>
          {produto.subcategoria && (
            <Badge variant="outline" className="text-xs text-gray-500">
              {produto.subcategoria}
            </Badge>
          )}
        </div>

        {/* Cores disponíveis */}
        {produto.cores_disponiveis && produto.cores_disponiveis.length > 0 && (
          <div className="flex items-center gap-1">
            <span className="text-xs text-gray-500">Cores:</span>
            <div className="flex gap-0.5">
              {produto.cores_disponiveis.slice(0, 5).map((cor: string, i: number) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-gray-200"
                  style={{ backgroundColor: cor }}
                  title={cor}
                />
              ))}
              {produto.cores_disponiveis.length > 5 && (
                <span className="text-xs text-gray-400 ml-1">
                  +{produto.cores_disponiveis.length - 5}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Preço */}
        {showPrice && produto.preco_referencia && (
          <div className="pt-2 border-t flex items-center justify-between">
            <span className="text-lg font-normal text-[#F25C26]">
              {formatPrice(produto.preco_referencia)}
            </span>
            {produto.preco_atualizado_em && (
              <span className="text-xs text-gray-400">
                Atualizado em{" "}
                {new Date(produto.preco_atualizado_em).toLocaleDateString("pt-BR")}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ProdutoCard;

