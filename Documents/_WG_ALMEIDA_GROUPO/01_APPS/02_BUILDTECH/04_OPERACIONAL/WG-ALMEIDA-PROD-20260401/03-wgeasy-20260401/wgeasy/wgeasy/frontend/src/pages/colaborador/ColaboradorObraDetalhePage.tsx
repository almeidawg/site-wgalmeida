import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, HardHat, Calendar, Activity } from "lucide-react";
import { formatarData, formatarMoeda } from "@/lib/utils";
import { buscarProjetoCronograma } from "@/lib/cronogramaApi";
import type { ProjetoCompleto } from "@/types/cronograma";
import { DiarioObraList } from "@/components/diario-obra";
import { listarDiariosPorCliente } from "@/lib/diarioObraApi";
import type { DiarioObra } from "@/types/diarioObra";
import { TYPOGRAPHY } from "@/constants/typography";
import { getStatusProjetoLabel, getStatusProjetoColor } from "@/types/cronograma";

export default function ColaboradorObraDetalhePage() {
  const { projetoId } = useParams<{ projetoId?: string }>();
  const navigate = useNavigate();
  const [projeto, setProjeto] = useState<ProjetoCompleto | null>(null);
  const [diarios, setDiarios] = useState<DiarioObra[]>([]);
  const [loadingProjeto, setLoadingProjeto] = useState(true);
  const [loadingDiario, setLoadingDiario] = useState(true);

  useEffect(() => {
    if (!projetoId) return;
    setLoadingProjeto(true);
    buscarProjetoCronograma(projetoId)
      .then((data) => setProjeto(data))
      .finally(() => setLoadingProjeto(false));
  }, [projetoId]);

  useEffect(() => {
    if (!projeto?.cliente_id) {
      setDiarios([]);
      setLoadingDiario(false);
      return;
    }

    setLoadingDiario(true);
    listarDiariosPorCliente(projeto.cliente_id)
      .then((dados) => setDiarios(dados))
      .catch(() => setDiarios([]))
      .finally(() => setLoadingDiario(false));
  }, [projeto?.cliente_id]);

  const timeline = useMemo(() => {
    if (!projeto || !projeto.data_inicio || !projeto.data_termino) return null;
    const inicio = new Date(projeto.data_inicio).getTime();
    const termino = new Date(projeto.data_termino).getTime();
    const total = Math.max(termino - inicio, 1);
    const hoje = Date.now();
    const atual = Math.min(Math.max(hoje - inicio, 0), total);
    return {
      inicio,
      termino,
      total,
      atual,
      chegada: formatarData(projeto.data_inicio),
      fim: formatarData(projeto.data_termino),
    };
  }, [projeto]);

  const progresso = projeto?.progresso ?? 0;

  if (!projetoId) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <p className="text-sm text-gray-500">Projeto nÍo informado.</p>
      </div>
    );
  }

  if (loadingProjeto) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-wg-primary" />
        <p className="ml-3 text-gray-500">Carregando projeto...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div>
          <p className={TYPOGRAPHY.pageTitle}>{projeto?.nome || "Projeto"}</p>
          <p className={TYPOGRAPHY.pageSubtitle}>Contrato {projeto?.contrato_numero}</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Status</p>
            <p
              className="text-lg font-normal"
              style={{ color: getStatusProjetoColor(projeto?.status || "pendente") }}
            >
              {getStatusProjetoLabel(projeto?.status as any)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Progresso</p>
            <div className="w-full h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-wg-primary"
                style={{ width: `${Math.min(100, Math.max(0, progresso))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">{progresso}% concluído</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardContent>
            <p className="text-[10px] uppercase tracking-wide text-gray-500">Valor estimado</p>
            <p className="text-lg font-normal text-gray-900">
              {formatarMoeda(projeto?.contrato_valor_total || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Calendar className="h-4 w-4" />
                Cronograma
              </div>
              <span className="text-xs text-gray-400">
                {timeline ? `${timeline.chegada} • ${timeline.fim}` : "Datas incompletas"}
              </span>
            </div>
            {timeline ? (
              <div className="mt-4 space-y-2">
                <div className="h-2 rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-wg-primary to-wg-primary/70"
                    style={{ width: `${(timeline.atual / timeline.total) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {Math.round((timeline.atual / timeline.total) * 100)}% do período
                </p>
              </div>
            ) : (
              <p className="mt-4 text-sm text-gray-500">Preencha as datas de início e fim.</p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-gray-100 shadow-sm">
          <CardContent>
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <HardHat className="h-4 w-4" />
                Diário associado
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/colaborador/diariodeobra/${projeto?.cliente_id}`)}
                className="text-xs"
              >
                Ver todos
              </Button>
            </div>
            {loadingDiario ? (
              <div className="mt-4 flex items-center gap-2 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 animate-spin" />
                Carregando registros...
              </div>
            ) : (
              <div className="mt-4 text-sm space-y-2">
                <p>
                  {diarios.length} registro{diarios.length !== 1 ? "s" : ""}
                </p>
                <p>
                  {diarios.slice(0, 3).map((reg) => formatarData(reg.data_registro)).join(" • ") || "Nenhum registro"}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border border-gray-100 shadow-sm">
        <CardContent>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Activity className="h-4 w-4" />
              Registro detalhado
            </div>
            <p className="text-[11px] text-gray-400">Últimos registros</p>
          </div>
          <DiarioObraList
            registros={diarios}
            showCliente={false}
            colaboradorAtualId=""
          />
        </CardContent>
      </Card>
    </div>
  );
}

