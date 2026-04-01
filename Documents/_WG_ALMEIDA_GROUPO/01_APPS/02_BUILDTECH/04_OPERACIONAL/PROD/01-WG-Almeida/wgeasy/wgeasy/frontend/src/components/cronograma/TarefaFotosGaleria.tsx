/**
 * Galeria de Fotos Vinculadas à Tarefa
 * Exibe fotos vinculadas com preview e opçÍo de desvincular
 */

import { useState, useEffect, useCallback } from "react";
import { ImageOff, Maximize2, Unlink, Loader2, User, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { FotoComDados } from "@/lib/cronogramaFotosApi";
import { buscarFotosDaTarefa, desvincularFotoTarefa } from "@/lib/cronogramaFotosApi";
import { formatarDataHora } from "@/types/cronograma";

interface TarefaFotosGaleriaProps {
  tarefaId: string;
  readonly?: boolean;
  onFotoRemovida?: () => void;
}

export default function TarefaFotosGaleria({
  tarefaId,
  readonly = false,
  onFotoRemovida,
}: TarefaFotosGaleriaProps) {
  const [fotos, setFotos] = useState<FotoComDados[]>([]);
  const [loading, setLoading] = useState(true);
  const [fotoPreview, setFotoPreview] = useState<FotoComDados | null>(null);
  const [removendo, setRemovendo] = useState<string | null>(null);

  const carregarFotos = useCallback(async () => {
    setLoading(true);
    try {
      const fotosVinculadas = await buscarFotosDaTarefa(tarefaId);
      setFotos(fotosVinculadas);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
      toast.error("Erro ao carregar fotos");
    } finally {
      setLoading(false);
    }
  }, [tarefaId]);

  useEffect(() => {
    carregarFotos();
  }, [carregarFotos]);

  const handleDesvincular = async (foto: FotoComDados) => {
    if (!confirm("Desvincular esta foto da tarefa? O progresso será recalculado.")) {
      return;
    }

    setRemovendo(foto.id);
    try {
      await desvincularFotoTarefa(tarefaId, foto.id);
      toast.success("Foto desvinculada");
      await carregarFotos();
      if (onFotoRemovida) {
        onFotoRemovida();
      }
    } catch (error) {
      console.error("Erro ao desvincular:", error);
      toast.error("Erro ao desvincular foto");
    } finally {
      setRemovendo(null);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (fotos.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-center text-sm text-gray-500">
          <ImageOff className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p>Nenhuma foto vinculada a esta tarefa</p>
          <p className="text-xs mt-1 text-gray-400">
            Use o botÍo "Foto" para adicionar fotos
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {fotos.map((foto) => (
          <div
            key={foto.id}
            className="relative group rounded-lg overflow-hidden border hover:border-wg-primary transition-colors"
          >
            <img
              src={foto.arquivo_url}
              alt={foto.legenda || foto.descricao || "Foto da tarefa"}
              className="w-full aspect-square object-cover cursor-pointer"
              onClick={() => setFotoPreview(foto)}
              loading="lazy"
            />

            {/* Overlay com ações */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  setFotoPreview(foto);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
              {!readonly && (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDesvincular(foto);
                  }}
                  disabled={removendo === foto.id}
                >
                  {removendo === foto.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Unlink className="h-4 w-4" />
                  )}
                </Button>
              )}
            </div>

            {/* Legenda */}
            {(foto.legenda || foto.descricao) && (
              <div className="absolute bottom-0 inset-x-0 bg-black/70 text-white text-xs p-2 line-clamp-2">
                {foto.legenda || foto.descricao}
              </div>
            )}

            {/* Indicador de contribuiçÍo ao progresso */}
            {foto.vinculo.contribui_progresso && (
              <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                +{foto.vinculo.percentual_contribuicao}%
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Dialog de Preview */}
      <Dialog open={!!fotoPreview} onOpenChange={() => setFotoPreview(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Foto da Tarefa</DialogTitle>
            <DialogDescription>
              {fotoPreview?.legenda || fotoPreview?.descricao || ""}
            </DialogDescription>
          </DialogHeader>

          {fotoPreview && (
            <div className="space-y-4">
              <img
                src={fotoPreview.arquivo_url}
                alt={fotoPreview.legenda || "Foto"}
                className="w-full rounded-lg"
              />

              {/* Metadados */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {fotoPreview.registro?.colaborador && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{fotoPreview.registro.colaborador.nome}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4" />
                  <span>{formatarDataHora(fotoPreview.criado_em)}</span>
                </div>
              </div>

              {/* Informações do vínculo */}
              <div className="p-3 bg-gray-50 rounded-lg text-sm">
                <p className="font-medium text-gray-900 mb-2">
                  Informações do Vínculo
                </p>
                <div className="space-y-1 text-gray-600">
                  <p>
                    Contribui para progresso:{" "}
                    {fotoPreview.vinculo.contribui_progresso ? "Sim" : "não"}
                  </p>
                  {fotoPreview.vinculo.contribui_progresso && (
                    <p>
                      ContribuiçÍo: {fotoPreview.vinculo.percentual_contribuicao}%
                    </p>
                  )}
                  <p>
                    Vinculado em: {formatarDataHora(fotoPreview.vinculo.criado_em)}
                  </p>
                </div>
              </div>

              {/* Botões de açÍo */}
              {!readonly && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => window.open(fotoPreview.arquivo_url, "_blank")}
                    className="flex-1"
                  >
                    Abrir em Nova Aba
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDesvincular(fotoPreview);
                      setFotoPreview(null);
                    }}
                    disabled={removendo === fotoPreview.id}
                  >
                    {removendo === fotoPreview.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Desvincular"
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}


