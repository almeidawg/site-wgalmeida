/**
 * Seletor Inteligente de Tarefas para vincular fotos
 * Sugere tarefas baseado em contexto e histórico do colaborador
 */

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Sparkles, Calendar, TrendingUp, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { CronogramaTarefa } from "@/types/cronograma";
import type { TarefaCandidataMatch } from "@/lib/cronogramaFotosApi";
import {
  buscarTarefasCandidatas,
  sugerirTarefaPorHistorico,
} from "@/lib/cronogramaFotosApi";
import { formatarData } from "@/types/cronograma";

interface SeletorTarefaInteligenteProps {
  clienteId: string;
  colaboradorId: string;
  onTarefaSelecionada: (tarefa: CronogramaTarefa) => void;
  tarefaSelecionada?: CronogramaTarefa | null;
}

export default function SeletorTarefaInteligente({
  clienteId,
  colaboradorId,
  onTarefaSelecionada,
  tarefaSelecionada,
}: SeletorTarefaInteligenteProps) {
  const [tarefas, setTarefas] = useState<TarefaCandidataMatch[]>([]);
  const [sugestao, setSugestao] = useState<TarefaCandidataMatch | null>(null);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(true);

  const carregarTarefas = useCallback(async () => {
    setLoading(true);
    try {
      // Buscar tarefas candidatas (em andamento/pendentes)
      const candidatas = await buscarTarefasCandidatas(clienteId);
      setTarefas(candidatas);

      // Buscar sugestÍo inteligente baseada em histórico
      const sugerida = await sugerirTarefaPorHistorico(colaboradorId, clienteId);

      if (sugerida) {
        setSugestao(sugerida);
      } else if (candidatas.length > 0) {
        // Fallback: primeira tarefa da lista
        setSugestao(candidatas[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
    } finally {
      setLoading(false);
    }
  }, [clienteId, colaboradorId]);

  useEffect(() => {
    carregarTarefas();
  }, [carregarTarefas]);

  const tarefasFiltradas = useMemo(() => {
    if (!busca.trim()) return tarefas;

    const termo = busca.toLowerCase();
    return tarefas.filter(
      (t) =>
        t.titulo.toLowerCase().includes(termo) ||
        t.descricao?.toLowerCase().includes(termo) ||
        t.categoria?.toLowerCase().includes(termo)
    );
  }, [tarefas, busca]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pendente: "bg-gray-500",
      em_andamento: "bg-blue-500",
      concluido: "bg-green-500",
      atrasado: "bg-red-500",
      pausado: "bg-yellow-500",
      cancelado: "bg-gray-400",
    };
    return colors[status] || "bg-gray-500";
  };

  const getPrioridadeIcon = (prioridade: string) => {
    if (prioridade === "alta" || prioridade === "critica") {
      return <TrendingUp className="h-3.5 w-3.5 text-red-600" />;
    }
    return null;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (tarefas.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Nenhuma tarefa em andamento encontrada para este cliente.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* SugestÍo Inteligente */}
      {sugestao && (
        <Card
          className={`border-2 ${
            tarefaSelecionada?.id === sugestao.id
              ? "border-wg-primary bg-orange-50"
              : "border-wg-primary/50 bg-orange-50/50 hover:bg-orange-50 hover:border-wg-primary"
          } transition-colors cursor-pointer`}
          onClick={() => onTarefaSelecionada(sugestao)}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-wg-primary" />
              <span className="text-wg-primary">SugestÍo Inteligente</span>
              {tarefaSelecionada?.id === sugestao.id && (
                <Badge variant="default" className="ml-auto bg-wg-primary">
                  Selecionada
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="font-medium text-gray-900">{sugestao.titulo}</p>
            {sugestao.descricao && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {sugestao.descricao}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {sugestao.categoria && (
                <Badge variant="outline" className="bg-white">
                  {sugestao.categoria}
                </Badge>
              )}
              <div
                className={`px-2 py-0.5 rounded-full text-white ${getStatusColor(
                  sugestao.status
                )}`}
              >
                {sugestao.status}
              </div>
              {sugestao.prioridade && (
                <div className="flex items-center gap-1 text-gray-600">
                  {getPrioridadeIcon(sugestao.prioridade)}
                  <span>{sugestao.prioridade}</span>
                </div>
              )}
              <div className="flex items-center gap-1 text-gray-500">
                <TrendingUp className="h-3 w-3" />
                {sugestao.progresso}%
              </div>
              {sugestao.total_fotos_vinculadas > 0 && (
                <span className="text-gray-500">
                  📸 {sugestao.total_fotos_vinculadas}
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Busca Manual */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          className="pl-10"
          placeholder="Buscar tarefa por nome, descriçÍo ou categoria..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Lista de Tarefas */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {tarefasFiltradas.map((tarefa) => {
          // não mostrar sugestÍo na lista se já está destacada no topo
          if (sugestao && tarefa.id === sugestao.id) {
            return null;
          }

          return (
            <button
              key={tarefa.id}
              onClick={() => onTarefaSelecionada(tarefa)}
              className={`w-full text-left p-3 rounded-lg border transition-colors ${
                tarefaSelecionada?.id === tarefa.id
                  ? "border-wg-primary bg-orange-50"
                  : "border-gray-200 hover:border-wg-primary/50 hover:bg-gray-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">
                    {tarefa.titulo}
                  </p>
                  {tarefa.descricao && (
                    <p className="text-sm text-gray-600 line-clamp-2 mt-1">
                      {tarefa.descricao}
                    </p>
                  )}
                </div>
                <div
                  className={`flex-shrink-0 px-2 py-1 rounded text-xs text-white ${getStatusColor(
                    tarefa.status
                  )}`}
                >
                  {tarefa.status}
                </div>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                {tarefa.categoria && (
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="h-5">
                      {tarefa.categoria}
                    </Badge>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {tarefa.progresso}%
                </span>
                {tarefa.data_inicio && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatarData(tarefa.data_inicio)}
                  </span>
                )}
                {tarefa.total_fotos_vinculadas > 0 && (
                  <span>📸 {tarefa.total_fotos_vinculadas}</span>
                )}
                {tarefa.prioridade && getPrioridadeIcon(tarefa.prioridade) && (
                  <span className="flex items-center gap-1 text-red-600">
                    {getPrioridadeIcon(tarefa.prioridade)}
                    {tarefa.prioridade}
                  </span>
                )}
              </div>
            </button>
          );
        })}

        {tarefasFiltradas.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-8">
            {busca
              ? "Nenhuma tarefa encontrada com esse termo"
              : "Nenhuma tarefa disponível"}
          </p>
        )}
      </div>

      {/* InformaçÍo sobre automaçÍo */}
      {tarefaSelecionada && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-3">
            <p className="text-sm text-blue-900">
              ✓ Ao confirmar, a foto será vinculada e a tarefa será atualizada
              automaticamente
              {tarefaSelecionada.automacao_habilitada !== false
                ? " para 100% concluída"
                : " (automaçÍo desabilitada para esta tarefa)"}
              .
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}


