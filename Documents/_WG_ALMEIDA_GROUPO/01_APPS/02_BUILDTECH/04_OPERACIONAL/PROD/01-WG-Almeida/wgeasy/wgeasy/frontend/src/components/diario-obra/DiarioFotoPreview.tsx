/**
 * Componente de preview/visualizaçÍo de fotos do Diário de Obra
 * Com opçÍo de legenda, exclusÍo e visualizaçÍo em tela cheia
 */

import React, { useState, memo, useCallback } from "react";
import {
  X,
  Trash2,
  Edit2,
  Check,
  Maximize2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiarioObraFoto } from "@/types/diarioObra";

interface DiarioFotoPreviewProps {
  fotos: DiarioObraFoto[];
  onExcluir?: (fotoId: string) => void;
  onAtualizarLegenda?: (fotoId: string, legenda: string) => void;
  readOnly?: boolean;
  className?: string;
}

// Formatar data para exibiçÍo
const formatarDataFoto = (dataStr?: string) => {
  if (!dataStr) return "";
  const date = new Date(dataStr);
  return date.toLocaleDateString("pt-BR");
};

// Legenda com fallback: legenda -> descriçÍo -> nome do arquivo -> "Foto"
const obterLegenda = (foto: DiarioObraFoto) => {
  if (foto.legenda && foto.legenda.trim()) return foto.legenda.trim();
  if (foto.descricao && foto.descricao.trim()) return foto.descricao.trim();
  try {
    const fileName = new URL(foto.arquivo_url).pathname.split("/").pop();
    if (fileName) return fileName;
  } catch {
    // ignore URL parse errors
  }
  return "Foto";
};

// Componente de imagem individual memoizado para evitar re-renders
const FotoItem = memo(function FotoItem({
  foto,
  index,
  isEditing,
  editingLegenda,
  onOpenFullscreen,
  onStartEdit,
  onSaveLegenda,
  onCancelEdit,
  onEditingLegendaChange,
  onExcluir,
  readOnly,
}: {
  foto: DiarioObraFoto;
  index: number;
  isEditing: boolean;
  editingLegenda: string;
  onOpenFullscreen: (index: number) => void;
  onStartEdit: (foto: DiarioObraFoto) => void;
  onSaveLegenda: () => void;
  onCancelEdit: () => void;
  onEditingLegendaChange: (value: string) => void;
  onExcluir?: (fotoId: string) => void;
  readOnly: boolean;
}) {
  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-100 bg-gray-100">
      {/* Imagem */}
      <button
        type="button"
        className="aspect-square cursor-pointer w-full h-full p-0 border-0 bg-transparent relative"
        onClick={() => onOpenFullscreen(index)}
        title={obterLegenda(foto)}
        tabIndex={0}
      >
        <img
          src={foto.arquivo_url}
          alt={obterLegenda(foto) || `Foto ${index + 1}`}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
        {/* Overlay com legenda e data */}
        <div className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] text-white flex items-center justify-between gap-2">
          <span className="truncate flex-1">{obterLegenda(foto)}</span>
          <span className="flex-shrink-0">{formatarDataFoto(foto.criado_em)}</span>
        </div>
      </button>

      {/* Overlay com ações no hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors pointer-events-none" />

      {/* Botões de açÍo - visíveis sempre no mobile, hover no desktop */}
      {!readOnly && (
        <div className="absolute top-2 right-2 flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onStartEdit(foto);
            }}
            className="bg-white rounded-full p-1.5 shadow hover:bg-gray-100"
            title="Editar legenda"
          >
            <Edit2 className="h-3.5 w-3.5 text-gray-700" />
          </button>
          {onExcluir && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Excluir esta foto?")) {
                  onExcluir(foto.id);
                }
              }}
              className="bg-red-500 rounded-full p-1.5 shadow hover:bg-red-600"
              title="Excluir foto"
            >
              <Trash2 className="h-3.5 w-3.5 text-white" />
            </button>
          )}
        </div>
      )}

      {/* BotÍo expandir */}
      <button
        type="button"
        onClick={() => onOpenFullscreen(index)}
        className="absolute top-2 left-2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Ver em tela cheia"
        aria-label="Ver em tela cheia"
      >
        <Maximize2 className="h-4 w-4 text-gray-700" />
      </button>

      {/* Legenda - sempre visível */}
      {isEditing ? (
        <div className="p-2 bg-white space-y-2">
          <input
            type="text"
            value={editingLegenda}
            onChange={(e) => onEditingLegendaChange(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
            placeholder="Digite a legenda"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveLegenda();
              if (e.key === "Escape") onCancelEdit();
            }}
            aria-label="Editar legenda"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onCancelEdit}
              className="flex-1 px-3 py-2 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              title="Cancelar ediçÍo"
              aria-label="Cancelar ediçÍo"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onSaveLegenda}
              className="flex-1 px-3 py-2 text-xs font-medium text-white bg-wg-primary hover:bg-wg-primary/90 rounded-lg transition-colors flex items-center justify-center gap-1"
              title="Salvar legenda"
              aria-label="Salvar legenda"
            >
              <Check className="h-4 w-4" />
              Salvar
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          className="w-full p-2 bg-white text-left hover:bg-gray-50 transition-colors"
          onClick={(e) => {
            if (!readOnly) {
              e.stopPropagation();
              onStartEdit(foto);
            }
          }}
          disabled={readOnly}
        >
          <p className="text-xs text-gray-700 break-words whitespace-pre-line line-clamp-2">
            {obterLegenda(foto) ? (
              <>{obterLegenda(foto)}</>
            ) : (
              <span className="text-gray-400 italic">Sem legenda - toque para adicionar</span>
            )}
          </p>
        </button>
      )}
    </div>
  );
});

function DiarioFotoPreview({
  fotos,
  onExcluir,
  onAtualizarLegenda,
  readOnly = false,
  className,
}: DiarioFotoPreviewProps) {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLegenda, setEditingLegenda] = useState<string>("");

  // Handlers para fullscreen
  const abrirFullscreen = (index: number) => setFullscreenIndex(index);
  const fecharFullscreen = () => setFullscreenIndex(null);

  const irParaAnterior = () => {
    if (fullscreenIndex !== null && fullscreenIndex > 0) {
      setFullscreenIndex(fullscreenIndex - 1);
    }
  };

  const irParaProxima = () => {
    if (fullscreenIndex !== null && fullscreenIndex < fotos.length - 1) {
      setFullscreenIndex(fullscreenIndex + 1);
    }
  };

  // Handler para editar legenda - memoizado
  const iniciarEdicao = useCallback((foto: DiarioObraFoto) => {
    setEditingId(foto.id);
    setEditingLegenda(foto.legenda || "");
  }, []);

  const salvarLegenda = useCallback(() => {
    if (editingId && onAtualizarLegenda) {
      onAtualizarLegenda(editingId, editingLegenda);
    }
    setEditingId(null);
    setEditingLegenda("");
  }, [editingId, editingLegenda, onAtualizarLegenda]);

  const cancelarEdicao = useCallback(() => {
    setEditingId(null);
    setEditingLegenda("");
  }, []);

  const handleEditingLegendaChange = useCallback((value: string) => {
    setEditingLegenda(value);
  }, []);

  // Keyboard navigation para fullscreen
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (fullscreenIndex === null) return;

    if (e.key === "ArrowLeft") irParaAnterior();
    else if (e.key === "ArrowRight") irParaProxima();
    else if (e.key === "Escape") fecharFullscreen();
  };

  if (fotos.length === 0) {
    return (
      <div className={cn("text-center py-8 text-gray-500", className)}>
        <p>Nenhuma foto neste registro</p>
      </div>
    );
  }

  return (
    <>
      {/* Grid de fotos */}
      <div
        className={cn(
          "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3",
          className
        )}
      >
        {fotos.map((foto, index) => (
          <FotoItem
            key={foto.id}
            foto={foto}
            index={index}
            isEditing={editingId === foto.id}
            editingLegenda={editingLegenda}
            onOpenFullscreen={abrirFullscreen}
            onStartEdit={iniciarEdicao}
            onSaveLegenda={salvarLegenda}
            onCancelEdit={cancelarEdicao}
            onEditingLegendaChange={handleEditingLegendaChange}
            onExcluir={onExcluir}
            readOnly={readOnly}
          />
        ))}
      </div>

      {/* Modal Fullscreen */}
      {fullscreenIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={fecharFullscreen}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
        >
          {/* BotÍo fechar */}
          <button
            type="button"
            onClick={fecharFullscreen}
            className="absolute top-4 right-4 bg-white/20 hover:bg-white/30 rounded-full p-2 z-10"
            title="Fechar"
            aria-label="Fechar"
          >
            <X className="h-6 w-6 text-white" />
          </button>

          {/* NavegaçÍo anterior */}
          {fullscreenIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irParaAnterior();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2"
              title="Anterior"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          )}

          {/* Imagem */}
          <div
            className="max-w-[90vw] max-h-[90vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
          role="region"
          aria-label="Imagem em destaque"
        >
          <img
            src={fotos[fullscreenIndex].arquivo_url}
            alt={obterLegenda(fotos[fullscreenIndex])}
            className="max-w-full max-h-[80vh] object-contain rounded"
          />
          <p className="mt-4 text-white text-center max-w-lg text-base font-medium">
            {obterLegenda(fotos[fullscreenIndex])}
          </p>
          <p className="mt-2 text-white/60 text-sm">
            {fullscreenIndex + 1} / {fotos.length}
          </p>
        </div>

          {/* NavegaçÍo próxima */}
          {fullscreenIndex < fotos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                irParaProxima();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 rounded-full p-2"
              title="Próxima"
              aria-label="Próxima"
            >
              <ChevronRight className="h-8 w-8 text-white" />
            </button>
          )}
        </div>
      )}
    </>
  );
}

// Exportar componente memoizado para evitar re-renders desnecessários
export default memo(DiarioFotoPreview);

