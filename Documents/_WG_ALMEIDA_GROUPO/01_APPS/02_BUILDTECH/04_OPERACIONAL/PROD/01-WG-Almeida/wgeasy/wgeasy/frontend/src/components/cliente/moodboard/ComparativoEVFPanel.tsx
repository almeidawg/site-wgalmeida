// ============================================================
// Componente: ComparativoEVFPanel
// Sistema WG Easy 2026 - Grupo WG Almeida
// Painel de comparativo entre EVF e valores selecionados
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  gerarComparativoEVF,
  formatarComparativoParaDisplay,
  sincronizarMoodboardComEVF,
  type EVFResumoDisplay,
} from "@/lib/moodboardEvfIntegration";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ComparativoEVFPanelProps {
  contratoId: string;
  moodboardId: string;
  compact?: boolean;
  onSync?: () => void;
}

export function ComparativoEVFPanel({
  contratoId,
  moodboardId,
  compact = false,
  onSync,
}: ComparativoEVFPanelProps) {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [categorias, setCategorias] = useState<EVFResumoDisplay[]>([]);
  const [totais, setTotais] = useState({
    evf: 0,
    selecionado: 0,
    diferenca: 0,
    percentual: 0,
  });

  const carregarComparativo = useCallback(async () => {
    setLoading(true);
    try {
      const comparativo = await gerarComparativoEVF(contratoId, moodboardId);
      if (comparativo) {
        const formatted = formatarComparativoParaDisplay(comparativo);
        setCategorias(formatted);
        setTotais({
          evf: comparativo.valor_total_evf,
          selecionado: comparativo.valor_total_selecionado,
          diferenca: comparativo.diferenca_total,
          percentual: comparativo.percentual_diferenca,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar comparativo:", error);
    } finally {
      setLoading(false);
    }
  }, [contratoId, moodboardId]);

  useEffect(() => {
    carregarComparativo();
  }, [carregarComparativo]);

  async function handleSync() {
    setSyncing(true);
    try {
      await sincronizarMoodboardComEVF(contratoId, moodboardId);
      await carregarComparativo();
      onSync?.();
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
    } finally {
      setSyncing(false);
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const getStatusIcon = (status: EVFResumoDisplay["status"]) => {
    switch (status) {
      case "ok":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "acima":
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case "abaixo":
        return <TrendingDown className="h-4 w-4 text-amber-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  if (loading) {
    return (
      <Card className={cn(compact && "border-0 shadow-none")}>
        <CardContent className="p-6 flex items-center justify-center">
          <RefreshCw className="h-5 w-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        {/* Resumo total */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-xs text-gray-500">Valor Total</p>
            <p className="font-normal">{formatCurrency(totais.selecionado)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">vs EVF</p>
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                totais.percentual > 10
                  ? "text-red-500"
                  : totais.percentual < -10
                  ? "text-amber-500"
                  : "text-green-500"
              )}
            >
              {totais.percentual > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : totais.percentual < 0 ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {Math.abs(totais.percentual).toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Categorias em lista */}
        <div className="space-y-1">
          {categorias.slice(0, 4).map((cat) => (
            <div
              key={cat.categoria}
              className="flex items-center justify-between py-1 text-sm"
            >
              <div className="flex items-center gap-2">
                {getStatusIcon(cat.status)}
                <span className="text-gray-600">{cat.nome}</span>
              </div>
              <span className="font-medium">{cat.valorSelecionado}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Comparativo EVF
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="h-4 w-4 text-gray-400" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  ComparaçÍo entre os valores estimados no EVF (Estudo de
                  Viabilidade Financeira) e os valores reais das escolhas do
                  cliente.
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw
              className={cn("h-4 w-4 mr-2", syncing && "animate-spin")}
            />
            Sincronizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Card de resumo total */}
        <div
          className={cn(
            "p-4 rounded-lg border",
            totais.percentual > 10
              ? "bg-red-50 border-red-200"
              : totais.percentual < -10
              ? "bg-amber-50 border-amber-200"
              : "bg-green-50 border-green-200"
          )}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Diferença Total</span>
            <Badge
              className={cn(
                totais.percentual > 10
                  ? "bg-red-100 text-red-700"
                  : totais.percentual < -10
                  ? "bg-amber-100 text-amber-700"
                  : "bg-green-100 text-green-700"
              )}
            >
              {totais.percentual > 0 ? "+" : ""}
              {totais.percentual.toFixed(1)}%
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-500">EVF Estimado</p>
              <p className="font-normal">{formatCurrency(totais.evf)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Selecionado</p>
              <p className="font-normal text-[#F25C26]">
                {formatCurrency(totais.selecionado)}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Diferença</p>
              <p
                className={cn(
                  "font-normal",
                  totais.diferenca > 0 ? "text-red-500" : "text-green-500"
                )}
              >
                {totais.diferenca > 0 ? "+" : ""}
                {formatCurrency(totais.diferenca)}
              </p>
            </div>
          </div>
        </div>

        {/* Alerta se muito acima */}
        {totais.percentual > 15 && (
          <div className="flex items-start gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-700">
                AtençÍo: Valor acima do estimado
              </p>
              <p className="text-xs text-red-600">
                O valor total das escolhas está {totais.percentual.toFixed(1)}%
                acima do estimado no EVF. Considere revisar as opções ou ajustar
                o orçamento.
              </p>
            </div>
          </div>
        )}

        {/* Lista de categorias */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Por Categoria</h4>
          {categorias.map((cat) => (
            <div key={cat.categoria} className="space-y-1">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  {getStatusIcon(cat.status)}
                  <span>{cat.nome}</span>
                </div>
                <span className="text-gray-500">{cat.percentual}</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={
                    cat.status === "pendente"
                      ? 0
                      : Math.min(
                          100,
                          (parseFloat(cat.valorSelecionado.replace(/[^\d,]/g, "").replace(",", ".")) /
                            parseFloat(cat.valorEVF.replace(/[^\d,]/g, "").replace(",", "."))) *
                            100
                        )
                  }
                  className="h-2 flex-1"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>EVF: {cat.valorEVF}</span>
                <span>Selecionado: {cat.valorSelecionado}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default ComparativoEVFPanel;

