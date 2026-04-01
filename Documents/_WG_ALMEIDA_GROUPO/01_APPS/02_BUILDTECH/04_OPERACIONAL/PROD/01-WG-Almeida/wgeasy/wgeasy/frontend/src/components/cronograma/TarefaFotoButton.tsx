/**
 * BotÍo para capturar e vincular fotos a tarefas do cronograma
 * Permite automaçÍo de atualizaçÍo de progresso via fotos
 */

import { useState, useEffect, useCallback } from "react";
import { Camera, Loader2, CheckCircle, Image as ImageIcon } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DiarioFotoCapture from "@/components/diario-obra/DiarioFotoCapture";
import type { CronogramaTarefa } from "@/types/cronograma";
import type { FotoCapturaPreview } from "@/types/diarioObra";
import {
  capturarFotoParaTarefa,
  buscarFotosDaTarefa,
} from "@/lib/cronogramaFotosApi";

interface TarefaFotoButtonProps {
  tarefa: CronogramaTarefa;
  colaboradorId: string;
  clienteId: string;
  onFotoVinculada?: () => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  showBadge?: boolean;
}

export default function TarefaFotoButton({
  tarefa,
  colaboradorId,
  clienteId,
  onFotoVinculada,
  variant = "outline",
  size = "sm",
  showBadge = true,
}: TarefaFotoButtonProps) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [fotos, setFotos] = useState<FotoCapturaPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const [totalFotosVinculadas, setTotalFotosVinculadas] = useState(0);
  const [loadingCount, setLoadingCount] = useState(false);

  // Carregar contador de fotos vinculadas
  const carregarContadorFotos = useCallback(async () => {
    setLoadingCount(true);
    try {
      const fotosVinculadas = await buscarFotosDaTarefa(tarefa.id);
      setTotalFotosVinculadas(fotosVinculadas.length);
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    } finally {
      setLoadingCount(false);
    }
  }, [tarefa.id]);

  useEffect(() => {
    if (sheetOpen || showBadge) {
      carregarContadorFotos();
    }
  }, [sheetOpen, showBadge, carregarContadorFotos]);

  const handleVincularFotos = async () => {
    if (fotos.length === 0) {
      toast.error("Nenhuma foto selecionada");
      return;
    }

    setUploading(true);

    try {
      let sucessos = 0;
      let falhas = 0;

      // Processar cada foto
      for (const foto of fotos) {
        try {
          const resultado = await capturarFotoParaTarefa(
            tarefa.id,
            colaboradorId,
            clienteId,
            foto.file,
            foto.legenda || foto.descricao
          );

          sucessos++;

          // Se tarefa foi concluída, mostrar mensagem especial
          if (resultado.tarefaAtualizada) {
            toast.success(`Foto vinculada! Tarefa marcada como concluída automaticamente.`, {
              duration: 5000,
            });
          }
        } catch (error) {
          console.error("Erro ao vincular foto:", error);
          falhas++;
        }
      }

      // Feedback final
      if (falhas === 0) {
        toast.success(
          `${sucessos} foto(s) vinculada(s) com sucesso!`,
          {
            icon: <CheckCircle className="h-5 w-5" />,
          }
        );
      } else if (sucessos > 0) {
        toast.warning(
          `${sucessos} foto(s) vinculada(s), ${falhas} falharam`
        );
      } else {
        toast.error("Erro ao vincular fotos");
      }

      // Limpar e fechar
      setFotos([]);
      setSheetOpen(false);

      // Atualizar contador
      await carregarContadorFotos();

      // Callback para recarregar lista de tarefas
      if (onFotoVinculada) {
        onFotoVinculada();
      }
    } catch (error) {
      console.error("Erro geral ao vincular fotos:", error);
      toast.error("Erro ao vincular fotos");
    } finally {
      setUploading(false);
    }
  };

  const handleFotosCaptured = (novasFotos: FotoCapturaPreview[]) => {
    setFotos(novasFotos);
  };

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant={variant} size={size} className="relative">
          <Camera className="h-4 w-4 mr-2" />
          Foto
          {showBadge && totalFotosVinculadas > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 min-w-[20px] px-1 bg-wg-primary text-white"
            >
              {loadingCount ? "..." : totalFotosVinculadas}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent side="bottom" className="h-[85vh] sm:h-[80vh] flex flex-col">
        <SheetHeader className="flex-shrink-0">
          <SheetTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-wg-primary" />
            Adicionar Foto à Tarefa
          </SheetTitle>
          <SheetDescription>
            <div className="space-y-2 text-left">
              <p className="font-medium text-gray-900">{tarefa.titulo}</p>
              {tarefa.descricao && (
                <p className="text-sm text-gray-600 line-clamp-2">
                  {tarefa.descricao}
                </p>
              )}
              {tarefa.automacao_habilitada !== false && (
                <p className="text-sm text-wg-primary flex items-center gap-1">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Tarefa será marcada como concluída automaticamente
                </p>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        {/* Captura de Fotos */}
        <div className="flex-1 overflow-y-auto mt-6 px-1">
          <DiarioFotoCapture
            onFotosCapturadas={handleFotosCaptured}
            fotosExistentes={fotos}
            maxFotos={20}
          />
        </div>

        {/* Botões de AçÍo */}
        <div className="flex-shrink-0 flex gap-3 pt-4 border-t">
          <Button
            onClick={handleVincularFotos}
            disabled={fotos.length === 0 || uploading}
            className="flex-1 bg-wg-primary hover:bg-wg-primary/90"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Vincular {fotos.length > 0 ? `${fotos.length} ` : ""}Foto(s)
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setSheetOpen(false);
              setFotos([]);
            }}
            disabled={uploading}
          >
            Cancelar
          </Button>
        </div>

        {/* Informações Adicionais */}
        {totalFotosVinculadas > 0 && (
          <div className="flex-shrink-0 mt-3 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-900 flex items-center gap-2">
              <ImageIcon className="h-4 w-4" />
              <span>
                Esta tarefa já possui {totalFotosVinculadas} foto(s) vinculada(s)
              </span>
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

