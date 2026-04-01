/**
 * Componente de captura de fotos para o Diário de Obra
 * Utiliza a câmera do dispositivo para tirar fotos
 */

import React, { useRef, useState, useCallback, useEffect } from "react";
import { Camera, Upload, X, RotateCcw, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { FotoCapturaPreview } from "@/types/diarioObra";

interface DiarioFotoCaptureProps {
  onFotosCapturadas: (fotos: FotoCapturaPreview[]) => void;
  fotosExistentes?: FotoCapturaPreview[];
  maxFotos?: number;
  disabled?: boolean;
}

export default function DiarioFotoCapture({
  onFotosCapturadas,
  fotosExistentes = [],
  maxFotos = 50, // Sem limite prático
  disabled = false,
}: DiarioFotoCaptureProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fotos, setFotos] = useState<FotoCapturaPreview[]>(fotosExistentes);

  // Sincronizar estado interno quando fotosExistentes mudar (ex: reset do formulário)
  useEffect(() => {
    setFotos(fotosExistentes);
  }, [fotosExistentes]);

  // Gerar ID temporário único
  const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Processar arquivos selecionados
  const processarArquivos = useCallback(
    async (files: FileList) => {
      setFotos((fotosAtuais) => {
        const novasFotos: FotoCapturaPreview[] = [];

        for (const file of Array.from(files)) {
          // Verificar se é imagem
          if (!file.type.startsWith("image/")) {
            console.warn("Arquivo ignorado (não é imagem):", file.name);
            continue;
          }

          // Verificar limite
          if (fotosAtuais.length + novasFotos.length >= maxFotos) {
            break;
          }

          // Criar preview
          const previewUrl = URL.createObjectURL(file);

          novasFotos.push({
            id: generateTempId(),
            file,
            previewUrl,
            ordem: fotosAtuais.length + novasFotos.length,
            uploading: false,
            uploaded: false,
          });
        }

        const todasFotos = [...fotosAtuais, ...novasFotos];
        // Usar setTimeout para evitar chamar callback durante setState
        setTimeout(() => onFotosCapturadas(todasFotos), 0);
        return todasFotos;
      });
    },
    [maxFotos, onFotosCapturadas]
  );

  // Handler para input de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivos(e.target.files);
    }
    // Limpar input para permitir selecionar mesmo arquivo novamente
    e.target.value = "";
  };

  // Remover foto
  const removerFoto = useCallback(
    (id: string) => {
      setFotos((fotosAtuais) => {
        const foto = fotosAtuais.find((f) => f.id === id);
        if (foto) {
          // Revogar URL de preview para liberar memória
          URL.revokeObjectURL(foto.previewUrl);
        }

        const novasFotos = fotosAtuais
          .filter((f) => f.id !== id)
          .map((f, index) => ({ ...f, ordem: index }));

        setTimeout(() => onFotosCapturadas(novasFotos), 0);
        return novasFotos;
      });
    },
    [onFotosCapturadas]
  );

  // Atualizar legenda
  const atualizarLegenda = useCallback(
    (id: string, legenda: string) => {
      setFotos((fotosAtuais) => {
        const novasFotos = fotosAtuais.map((f) =>
          f.id === id ? { ...f, legenda } : f
        );
        setTimeout(() => onFotosCapturadas(novasFotos), 0);
        return novasFotos;
      });
    },
    [onFotosCapturadas]
  );

  // Detectar Safari iOS
  const isSafariIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                      !('MSStream' in window) &&
                      /Safari/.test(navigator.userAgent);

  // Abrir câmera diretamente
  const abrirCamera = () => {
    if (inputRef.current) {
      // Safari iOS: usar apenas capture sem multiple para melhor compatibilidade
      if (isSafariIOS) {
        inputRef.current.removeAttribute("multiple");
      }
      inputRef.current.setAttribute("capture", "environment");
      inputRef.current.click();
      // Restaurar multiple após um delay (Safari precisa disso)
      if (isSafariIOS) {
        setTimeout(() => {
          inputRef.current?.setAttribute("multiple", "true");
        }, 100);
      }
    }
  };

  // Abrir galeria
  const abrirGaleria = () => {
    if (inputRef.current) {
      inputRef.current.removeAttribute("capture");
      // Safari iOS: garantir que multiple está ativo para galeria
      inputRef.current.setAttribute("multiple", "true");
      inputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      {/* Input oculto - accept inclui HEIC para fotos de iPhone */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,image/heic,image/heif,.heic,.heif"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Botões de captura */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={abrirCamera}
          disabled={disabled || fotos.length >= maxFotos}
          className="flex-1 h-12"
        >
          <Camera className="h-5 w-5 mr-2" />
          Tirar Foto
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={abrirGaleria}
          disabled={disabled || fotos.length >= maxFotos}
          className="flex-1 h-12"
        >
          <Upload className="h-5 w-5 mr-2" />
          Galeria
        </Button>
      </div>

      {/* Grid de previews */}
      {fotos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {fotos.map((foto) => (
            <div
              key={foto.id}
              className={cn(
                "relative rounded-lg overflow-hidden border bg-gray-50",
                foto.uploading && "opacity-70",
                foto.error && "border-red-300"
              )}
            >
              {/* Imagem */}
              <div className="aspect-square relative">
                <img
                  src={foto.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />

                {/* Overlay de status */}
                {foto.uploading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <RotateCcw className="h-6 w-6 text-white animate-spin" />
                  </div>
                )}

                {foto.uploaded && (
                  <div className="absolute top-1 right-1 bg-green-500 rounded-full p-0.5">
                    <CheckCircle className="h-4 w-4 text-white" />
                  </div>
                )}

                {/* BotÍo remover */}
                {!foto.uploading && !foto.uploaded && (
                  <button
                    type="button"
                    onClick={() => removerFoto(foto.id)}
                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 rounded-full p-1 transition-colors"
                  >
                    <X className="h-4 w-4 text-white" />
                  </button>
                )}
              </div>

              {/* Campo de legenda */}
              <div className="p-2">
                <input
                  type="text"
                  placeholder="Legenda (opcional)"
                  value={foto.legenda || ""}
                  onChange={(e) => atualizarLegenda(foto.id, e.target.value)}
                  disabled={foto.uploading || foto.uploaded}
                  className="w-full text-xs border rounded px-2 py-1 bg-white focus:ring-1 focus:ring-wg-primary focus:outline-none"
                />
              </div>

              {/* Erro */}
              {foto.error && (
                <p className="text-xs text-red-600 px-2 pb-2">{foto.error}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {fotos.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {fotos.length} foto{fotos.length !== 1 ? "s" : ""} selecionada
          {fotos.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}


