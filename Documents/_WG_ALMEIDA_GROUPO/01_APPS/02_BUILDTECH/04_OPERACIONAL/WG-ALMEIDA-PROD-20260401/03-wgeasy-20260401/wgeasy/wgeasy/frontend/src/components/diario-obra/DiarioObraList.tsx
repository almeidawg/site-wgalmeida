/**
 * Lista de registros do Diário de Obra
 * Com agrupamento por data e preview de fotos
 */

import { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Image,
  User,
  Building2,
  Trash2,
  Edit,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import DiarioFotoPreview from "./DiarioFotoPreview";
import type { DiarioObra, DiarioObraAgrupado } from "@/types/diarioObra";

interface DiarioObraListProps {
  registros: DiarioObra[];
  onExcluir?: (diarioId: string) => void;
  onEditar?: (diario: DiarioObra) => void;
  onExcluirFoto?: (fotoId: string) => void;
  onAtualizarLegendaFoto?: (fotoId: string, legenda: string) => void;
  colaboradorAtualId?: string;
  readOnly?: boolean;
  showCliente?: boolean;
  className?: string;
}

export default function DiarioObraList({
  registros,
  onExcluir,
  onEditar,
  onExcluirFoto,
  onAtualizarLegendaFoto,
  colaboradorAtualId,
  readOnly = false,
  showCliente = false,
  className,
}: DiarioObraListProps) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set());

  // Agrupar por data
  const agrupados = useMemo<DiarioObraAgrupado[]>(() => {
    const grupos: { [data: string]: DiarioObra[] } = {};

    registros.forEach((registro) => {
      const data = registro.data_registro;
      if (!grupos[data]) {
        grupos[data] = [];
      }
      grupos[data].push(registro);
    });

    return Object.entries(grupos)
      .map(([data, regs]) => ({
        data,
        registros: regs,
        totalFotos: regs.reduce((acc, r) => acc + (r.fotos?.length || 0), 0),
      }))
      .sort((a, b) => b.data.localeCompare(a.data));
  }, [registros]);

  // Toggle expansÍo de data
  const toggleDate = (data: string) => {
    const newExpanded = new Set(expandedDates);
    if (newExpanded.has(data)) {
      newExpanded.delete(data);
    } else {
      newExpanded.add(data);
    }
    setExpandedDates(newExpanded);
  };

  // Formatar data para exibiçÍo
  const formatarData = (dataStr: string) => {
    const [ano, mes, dia] = dataStr.split("-");
    const date = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const dataDate = new Date(date);
    dataDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (hoje.getTime() - dataDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Hoje";
    if (diffDays === 1) return "Ontem";

    return date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
    });
  };

  if (registros.length === 0) {
    return (
      <div
        className={cn(
          "text-center py-12 bg-gray-50 rounded-lg border border-dashed",
          className
        )}
      >
        <Image className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">Nenhum registro no diário</p>
        <p className="text-sm text-gray-400 mt-1">
          Use a câmera para adicionar fotos da obra
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {agrupados.map((grupo) => {
        const isExpanded = expandedDates.has(grupo.data);

        return (
          <div
            key={grupo.data}
            className="border rounded-lg overflow-hidden bg-white"
          >
            {/* Header da data */}
            <button
              type="button"
              onClick={() => toggleDate(grupo.data)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-[#F25C26]" />
                </div>
                <div className="text-left">
                  <p className="font-medium text-gray-900 capitalize">
                    {formatarData(grupo.data)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {grupo.registros.length} registro
                    {grupo.registros.length !== 1 ? "s" : ""} -{" "}
                    {grupo.totalFotos} foto{grupo.totalFotos !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {isExpanded ? (
                <ChevronUp className="h-5 w-5 text-gray-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-400" />
              )}
            </button>

            {/* Conteúdo expandido */}
            {isExpanded && (
              <div className="divide-y">
                {grupo.registros.map((registro) => {
                  const canEdit =
                    !readOnly &&
                    (!colaboradorAtualId ||
                      registro.colaborador_id === colaboradorAtualId);

                  return (
                    <div key={registro.id} className="p-4 space-y-3">
                      {/* Info do colaborador/cliente */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          {registro.colaborador?.avatar_url ? (
                            <img
                              src={registro.colaborador.avatar_url}
                              alt={registro.colaborador.nome}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="h-4 w-4 text-gray-500" />
                            </div>
                          )}

                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {registro.colaborador?.nome || "Colaborador"}
                            </p>
                            {showCliente && registro.cliente && (
                              <p className="text-xs text-gray-500 flex items-center gap-1">
                                <Building2 className="h-3 w-3" />
                                {registro.cliente.nome}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Ações */}
                        {canEdit && (
                          <div className="flex gap-1">
                            {onEditar && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onEditar(registro)}
                                className="h-8 w-8"
                              >
                                <Edit className="h-4 w-4 text-gray-500" />
                              </Button>
                            )}
                            {onExcluir && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  if (
                                    confirm(
                                      "Excluir este registro e todas as fotos?"
                                    )
                                  ) {
                                    onExcluir(registro.id);
                                  }
                                }}
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* DescriçÍo */}
                      {registro.descricao && (
                        <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                          {registro.descricao}
                        </p>
                      )}

                      {/* Fotos */}
                      {registro.fotos && registro.fotos.length > 0 && (
                        <DiarioFotoPreview
                          fotos={registro.fotos}
                          onExcluir={canEdit ? onExcluirFoto : undefined}
                          onAtualizarLegenda={
                            canEdit ? onAtualizarLegendaFoto : undefined
                          }
                          readOnly={!canEdit}
                        />
                      )}

                      {/* Horário */}
                      <p className="text-xs text-gray-400">
                        {new Date(registro.criado_em).toLocaleTimeString(
                          "pt-BR",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

