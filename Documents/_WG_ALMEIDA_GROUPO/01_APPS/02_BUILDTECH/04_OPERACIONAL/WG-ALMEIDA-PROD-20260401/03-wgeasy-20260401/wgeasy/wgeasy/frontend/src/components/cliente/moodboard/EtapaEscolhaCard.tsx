// ============================================================
// Componente: EtapaEscolhaCard
// Sistema WG Easy 2026 - Grupo WG Almeida
// Card de etapa cronológica para escolha de acabamentos
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  CheckCircle2,
  Clock,
  Lock,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { CategoriaMemorial } from "@/types/memorial";
import type { EtapaEscolhaContrato, StatusEtapa } from "@/types/moodboardCliente";
import { ETAPAS_ESCOLHA_CONFIG } from "@/types/moodboardCliente";

interface EtapaEscolhaCardProps {
  etapa: EtapaEscolhaContrato & {
    total_itens: number;
    itens_selecionados: number;
    valor_selecionado?: number;
  };
  isActive?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

const statusConfig: Record<StatusEtapa, {
  label: string;
  color: string;
  icon: typeof Lock;
}> = {
  pendente: {
    label: "Pendente",
    color: "bg-gray-100 text-gray-600",
    icon: Lock,
  },
  liberada: {
    label: "Liberada",
    color: "bg-blue-100 text-blue-700",
    icon: Clock,
  },
  em_andamento: {
    label: "Em andamento",
    color: "bg-amber-100 text-amber-700",
    icon: Clock,
  },
  aguardando_aprovacao: {
    label: "Aguardando aprovaçÍo",
    color: "bg-purple-100 text-purple-700",
    icon: Clock,
  },
  concluida: {
    label: "Concluída",
    color: "bg-green-100 text-green-700",
    icon: CheckCircle2,
  },
};

export function EtapaEscolhaCard({
  etapa,
  isActive = false,
  onClick,
  compact = false,
}: EtapaEscolhaCardProps) {
  const config = ETAPAS_ESCOLHA_CONFIG[etapa.tipo];
  const statusCfg = statusConfig[etapa.status];
  const StatusIcon = statusCfg.icon;

  const progresso = etapa.total_itens > 0
    ? Math.round((etapa.itens_selecionados / etapa.total_itens) * 100)
    : 0;

  const isLocked = etapa.status === "pendente";
  const isOverdue = etapa.data_limite && new Date(etapa.data_limite) < new Date() && etapa.status !== "concluida";

  if (compact) {
    return (
      <button
        onClick={!isLocked ? onClick : undefined}
        disabled={isLocked}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left",
          isActive
            ? "border-[#F25C26] bg-orange-50"
            : "border-gray-200 hover:border-gray-300",
          isLocked && "opacity-50 cursor-not-allowed"
        )}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${config.cor}20` }}
        >
          {isLocked ? (
            <Lock className="h-5 w-5 text-gray-400" />
          ) : (
            <StatusIcon className="h-5 w-5" style={{ color: config.cor }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{etapa.titulo}</p>
          <p className="text-xs text-gray-500">
            {etapa.itens_selecionados}/{etapa.total_itens} itens
          </p>
        </div>
        <div className="flex items-center gap-2">
          {progresso === 100 && (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          )}
          {!isLocked && <ChevronRight className="h-4 w-4 text-gray-400" />}
        </div>
      </button>
    );
  }

  return (
    <Card
      className={cn(
        "transition-all cursor-pointer hover:shadow-md",
        isActive && "ring-2 ring-[#F25C26] ring-offset-2",
        isLocked && "opacity-60 cursor-not-allowed"
      )}
      onClick={!isLocked ? onClick : undefined}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${config.cor}20` }}
            >
              {isLocked ? (
                <Lock className="h-6 w-6 text-gray-400" />
              ) : (
                <span style={{ color: config.cor }} className="text-2xl">
                  {config.icone}
                </span>
              )}
            </div>
            <div>
              <CardTitle className="text-lg">{etapa.titulo}</CardTitle>
              <p className="text-sm text-gray-500">Etapa {etapa.ordem}</p>
            </div>
          </div>
          <Badge className={statusCfg.color}>{statusCfg.label}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {etapa.descricao && (
          <p className="text-sm text-gray-600">{etapa.descricao}</p>
        )}

        {/* Progresso */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Progresso</span>
            <span className="font-medium">
              {etapa.itens_selecionados} de {etapa.total_itens} itens
            </span>
          </div>
          <Progress value={progresso} className="h-2" />
        </div>

        {/* Datas */}
        <div className="flex items-center gap-4 text-sm">
          {etapa.data_inicio && (
            <div className="flex items-center gap-1 text-gray-500">
              <Calendar className="h-4 w-4" />
              <span>
                Início:{" "}
                {new Date(etapa.data_inicio).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
          {etapa.data_limite && (
            <div
              className={cn(
                "flex items-center gap-1",
                isOverdue ? "text-red-500" : "text-gray-500"
              )}
            >
              {isOverdue ? (
                <AlertCircle className="h-4 w-4" />
              ) : (
                <Clock className="h-4 w-4" />
              )}
              <span>
                Prazo:{" "}
                {new Date(etapa.data_limite).toLocaleDateString("pt-BR")}
              </span>
            </div>
          )}
        </div>

        {/* Categorias */}
        {config.categorias_memorial.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {config.categorias_memorial.slice(0, 3).map((cat) => (
              <Badge key={cat} variant="outline" className="text-xs">
                {cat as CategoriaMemorial}
              </Badge>
            ))}
            {config.categorias_memorial.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{config.categorias_memorial.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Valor (se disponível) */}
        {etapa.valor_selecionado !== undefined && etapa.valor_selecionado > 0 && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Valor selecionado</span>
              <span className="font-normal text-[#F25C26]">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(etapa.valor_selecionado)}
              </span>
            </div>
          </div>
        )}

        {/* AçÍo */}
        {!isLocked && (
          <Button
            variant={etapa.status === "concluida" ? "outline" : "default"}
            className={cn(
              "w-full",
              etapa.status !== "concluida" &&
                "bg-gradient-to-r from-[#F25C26] to-[#F57F17] hover:from-[#D94C1F] hover:to-[#E56E10]"
            )}
          >
            {etapa.status === "concluida"
              ? "Revisar Escolhas"
              : etapa.status === "em_andamento"
              ? "Continuar Escolhendo"
              : "Iniciar Escolhas"}
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

export default EtapaEscolhaCard;

