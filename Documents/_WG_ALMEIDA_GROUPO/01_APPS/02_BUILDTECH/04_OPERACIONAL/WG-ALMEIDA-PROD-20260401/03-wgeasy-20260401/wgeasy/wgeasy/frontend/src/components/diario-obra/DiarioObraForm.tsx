/**
 * Formulário para criar/editar registro do Diário de Obra
 * Inclui seleçÍo de cliente, descriçÍo e captura de fotos
 */

import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { Building2, Loader2, Save, Upload, AlertTriangle, Sparkles, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import DiarioFotoCapture from "./DiarioFotoCapture";
import SeletorTarefaInteligente from "@/components/cronograma/SeletorTarefaInteligente";
import { supabase } from "@/lib/supabaseClient";
import {
  criarRegistroDiario,
  uploadFotoDiario,
} from "@/lib/diarioObraApi";
import { capturarFotoParaTarefa } from "@/lib/cronogramaFotosApi";
import type { FotoCapturaPreview } from "@/types/diarioObra";
import type { CronogramaTarefa } from "@/types/cronograma";

interface DiarioObraFormProps {
  colaboradorId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

interface FormData {
  cliente_id: string;
  titulo: string;
  descricao: string;
  clima: string;
  equipe_presente: number;
}

interface Cliente {
  id: string;
  nome: string;
  drive_link: string | null;
}

function DiarioObraForm({
  colaboradorId,
  onSuccess,
  onCancel,
}: DiarioObraFormProps) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [fotos, setFotos] = useState<FotoCapturaPreview[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [tarefaSelecionada, setTarefaSelecionada] = useState<CronogramaTarefa | null>(null);
  const [mostrarSeletorTarefa, setMostrarSeletorTarefa] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      cliente_id: "",
      titulo: "",
      descricao: "",
      clima: "",
      equipe_presente: 0,
    },
  });

  const selectedClienteId = watch("cliente_id");

  // Handler estável para fotos capturadas
  const handleFotosCapturadas = useCallback((novasFotos: FotoCapturaPreview[]) => {
    setFotos(novasFotos);
  }, []);

  // Carregar clientes ao montar (exclui concluídos)
  useEffect(() => {
    async function loadClientes() {
      try {
        const { data, error } = await supabase
          .from("pessoas")
          .select("id, nome, drive_link, status")
          .eq("tipo", "CLIENTE")
          .eq("ativo", true)
          .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
          .order("nome");
        if (!error) setClientes(data || []);
      } catch (error) {
        console.error("Erro ao carregar clientes:", error);
      }
    }
    loadClientes();
  }, []);

  // Verificar se o cliente selecionado tem Google Drive configurado
  const clienteSelecionadoObj = clientes.find(c => c.id === selectedClienteId);
  const temDriveConfigurado = !!clienteSelecionadoObj?.drive_link;

  // Gerar resumo automático a partir das legendas das fotos
  const gerarResumoFotos = useCallback(() => {
    if (fotos.length === 0) {
      return;
    }

    // Coletar legendas não vazias
    const legendas = fotos
      .map(f => f.legenda?.trim())
      .filter(Boolean);

    if (legendas.length === 0) {
      return;
    }

    // Gerar resumo baseado nas legendas
    const resumo = legendas.join(", ");

    // Preencher o campo de descriçÍo
    setValue("descricao", resumo, { shouldValidate: true });
  }, [fotos, setValue]);

  // Handler de submit
  async function onSubmit(data: FormData) {
    if (!data.cliente_id) {
      return;
    }

    try {
      setSubmitting(true);

      // Se uma tarefa foi selecionada E há fotos, usar fluxo de vinculaçÍo ao cronograma
      if (tarefaSelecionada && fotos.length > 0) {
        setUploadProgress({ current: 0, total: fotos.length });
        let sucessos = 0;
        let errosUpload = 0;

        for (let i = 0; i < fotos.length; i++) {
          const foto = fotos[i];
          setUploadProgress({ current: i + 1, total: fotos.length });
          try {
            await capturarFotoParaTarefa(
              tarefaSelecionada.id,
              colaboradorId,
              data.cliente_id,
              foto.file,
              foto.legenda || data.descricao
            );
            sucessos++;
          } catch (uploadError) {
            console.error(
              `Erro ao vincular foto ${i + 1}:`,
              uploadError
            );
            errosUpload++;
          }
        }

        // Feedback
        if (errosUpload === 0) {
          alert(`✓ ${sucessos} foto(s) vinculada(s) à tarefa "${tarefaSelecionada.titulo}"!`);
        } else if (sucessos > 0) {
          alert(`${sucessos} foto(s) vinculada(s), ${errosUpload} falharam.`);
        } else {
          alert("Erro ao vincular fotos. Verifique sua conexÍo.");
        }
      } else {
        // Fluxo normal: apenas criar registro no diário (sem vínculo com cronograma)
        const diario = await criarRegistroDiario({
          cliente_id: data.cliente_id,
          colaborador_id: colaboradorId,
          titulo: data.titulo || undefined,
          descricao: data.descricao || undefined,
          clima: data.clima || undefined,
          equipe_presente: data.equipe_presente || undefined,
        });

        // Fazer upload das fotos
        let errosUpload = 0;
        if (fotos.length > 0) {
          setUploadProgress({ current: 0, total: fotos.length });
          for (let i = 0; i < fotos.length; i++) {
            const foto = fotos[i];
            setUploadProgress({ current: i + 1, total: fotos.length });
            try {
              await uploadFotoDiario(
                diario.id,
                foto.file,
                foto.legenda,
                data.cliente_id
              );
            } catch (uploadError) {
              console.error(
                `Erro ao fazer upload da foto ${i + 1}:`,
                uploadError
              );
              errosUpload++;
            }
          }

          // Mostrar aviso se houve erros parciais
          if (errosUpload > 0 && errosUpload < fotos.length) {
            alert(`Registro salvo, mas ${errosUpload} foto(s) não foram enviadas. Verifique sua conexÍo.`);
          } else if (errosUpload > 0 && errosUpload === fotos.length) {
            alert("Registro salvo, mas as fotos não foram enviadas. Verifique sua conexÍo e tente novamente.");
          }
        }
      }

      // Limpar estado
      setFotos([]);
      setTarefaSelecionada(null);
      setMostrarSeletorTarefa(false);
      setUploadProgress(null);

      // Notificar administraçÍo via email (não bloqueante)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
          // Buscar nome do cliente selecionado
          const clienteSelecionado = clientes.find((c) => c.id === data.cliente_id);
          await fetch(`${backendUrl}/api/notify/publicacao-material`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              tipo: "diario_obra",
              colaborador_nome: session.user?.email || "Colaborador",
              cliente_nome: clienteSelecionado?.nome || undefined,
              descricao: data.titulo || data.descricao || "Novo registro publicado",
            }),
          });
        }
      } catch {
        // Silencioso — email falhou mas publicaçÍo foi bem-sucedida
      }

      // Sucesso - chamar callback
      onSuccess?.();
    } catch (error) {
      console.error("Erro ao salvar diário:", error);
      const mensagemErro = error instanceof Error ? error.message : "Erro desconhecido";
      alert(`Erro ao salvar registro: ${mensagemErro}`);
    } finally {
      setSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* SeleçÍo de Cliente */}
      <div className="space-y-2">
        <Label htmlFor="cliente_id" className="flex items-center gap-2">
          <Building2 className="h-4 w-4 text-gray-500" />
          Cliente *
        </Label>
        <Select
          value={selectedClienteId}
            onValueChange={(v) => {
            setValue("cliente_id", v);
          }}
          disabled={submitting}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o cliente" />
          </SelectTrigger>
          <SelectContent>
            {clientes.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {errors.cliente_id && (
          <p className="text-sm text-red-600">{errors.cliente_id.message}</p>
        )}

        {/* Indicador de Google Drive */}
        {selectedClienteId && (
          <div className={`flex items-center gap-2 text-xs mt-2 p-2 rounded-lg ${
            temDriveConfigurado
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-yellow-50 text-yellow-700 border border-yellow-200"
          }`}>
            {temDriveConfigurado ? (
              <>
                <Upload className="h-4 w-4" />
                <span>Fotos serÍo enviadas para o Google Drive do cliente</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" />
                <span>Cliente sem Google Drive. Fotos serÍo salvas apenas no sistema.</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* DescriçÍo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="descricao">DescriçÍo do dia (opcional)</Label>
          {fotos.length > 0 && fotos.some(f => f.legenda?.trim()) && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={gerarResumoFotos}
              disabled={submitting}
              className="h-7 text-xs gap-1.5 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Gerar das legendas
            </Button>
          )}
        </div>
        <Textarea
          id="descricao"
          placeholder="Descreva as atividades realizadas hoje..."
          className="min-h-[100px] resize-none"
          disabled={submitting}
          {...register("descricao")}
        />
      </div>

      {/* Captura de fotos */}
      <div className="space-y-2">
        <Label>Fotos</Label>
        <DiarioFotoCapture
          onFotosCapturadas={handleFotosCapturadas}
          fotosExistentes={fotos}
          disabled={submitting}
        />
      </div>

      {/* Vincular a tarefa do cronograma (opcional) */}
      {selectedClienteId && fotos.length > 0 && (
        <div className="space-y-3">
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-wg-primary" />
              <Label className="text-base">Vincular a Tarefa do Cronograma (opcional)</Label>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrarSeletorTarefa(!mostrarSeletorTarefa)}
              disabled={submitting}
            >
              {mostrarSeletorTarefa ? "Ocultar" : "Mostrar"}
            </Button>
          </div>

          {tarefaSelecionada && !mostrarSeletorTarefa && (
            <div className="p-3 bg-orange-50 border border-wg-primary/30 rounded-lg">
              <p className="text-sm font-medium text-gray-900">{tarefaSelecionada.titulo}</p>
              <p className="text-xs text-gray-600 mt-1">
                ✓ As fotos serÍo vinculadas a esta tarefa
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setTarefaSelecionada(null)}
                disabled={submitting}
                className="mt-2 h-7 text-xs"
              >
                Remover vínculo
              </Button>
            </div>
          )}

          {mostrarSeletorTarefa && (
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <SeletorTarefaInteligente
                clienteId={selectedClienteId}
                colaboradorId={colaboradorId}
                onTarefaSelecionada={(tarefa) => {
                  setTarefaSelecionada(tarefa);
                  setMostrarSeletorTarefa(false);
                }}
                tarefaSelecionada={tarefaSelecionada}
              />
            </div>
          )}
        </div>
      )}

      {/* Progresso de upload */}
      {uploadProgress && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                Enviando fotos...
              </p>
              <div className="mt-1 w-full bg-blue-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{
                    width: `${
                      (uploadProgress.current / uploadProgress.total) * 100
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-blue-600 mt-1">
                {uploadProgress.current} de {uploadProgress.total}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Botões de açÍo */}
      <div className="flex gap-3 pt-4 border-t">
        {onCancel && (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1"
          >
            Cancelar
          </Button>
        )}

        <Button
          type="submit"
          disabled={submitting || !selectedClienteId}
          className="flex-1 bg-wg-primary hover:bg-wg-primary/90"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Registro
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

export default DiarioObraForm;


