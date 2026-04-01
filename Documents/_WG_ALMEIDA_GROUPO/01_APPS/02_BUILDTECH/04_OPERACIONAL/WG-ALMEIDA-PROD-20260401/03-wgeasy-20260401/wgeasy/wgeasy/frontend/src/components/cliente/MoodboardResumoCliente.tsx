// ============================================================
// Componente: MoodboardResumoCliente
// Sistema WG Easy 2026 - Grupo WG Almeida
// Resumo do moodboard na area do cliente
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Palette,
  ChevronRight,
  CheckCircle2,
  Clock,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabaseClient";
import { ETAPAS_ESCOLHA_CONFIG, type EtapaEscolha, gerarShareToken } from "@/types/moodboardCliente";
import { criarMoodboard, criarEtapasPadrao, buscarMoodboard, atualizarMoodboard } from "@/lib/moodboardClienteApi";

interface MoodboardResumoClienteProps {
  contratoId?: string;
  clienteId?: string;
  onProgressChange?: (progresso: number) => void;
  onResumoChange?: (resumo: { total: number; pendentes: number; concluidas: number }) => void;
}

interface EtapaResumo {
  id: string;
  tipo: EtapaEscolha;
  titulo: string;
  status: string;
  itens_selecionados: number;
  total_itens: number;
}

interface MoodboardInfo {
  id: string;
  titulo: string;
  status: string;
  etapas: EtapaResumo[];
  valor_total_selecionado: number;
}

export default function MoodboardResumoCliente({
  contratoId,
  clienteId,
  onProgressChange,
  onResumoChange,
}: MoodboardResumoClienteProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [moodboard, setMoodboard] = useState<MoodboardInfo | null>(null);
  const [ativando, setAtivando] = useState(false);

  const carregarMoodboard = useCallback(async () => {
    if (!contratoId) {
      setLoading(false);
      return;
    }

    try {
      // Buscar moodboard do cliente
      const { data: mb, error: mbError } = await supabase
        .from("cliente_moodboards")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (mbError) throw mbError;

      if (!mb) {
        setMoodboard(null);
        setLoading(false);
        return;
      }

      // Buscar etapas
      const { data: etapas } = await supabase
        .from("etapas_escolha")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("ordem");

      // Buscar selecoes para calcular progresso
      const { data: selecoes } = await supabase
        .from("cliente_selecoes_acabamentos")
        .select("etapa_id, valor_total, status")
        .eq("moodboard_id", mb.id);

      // Calcular valor total
      const valorTotal = selecoes
        ?.filter((s) => s.status === "selecionado" || s.status === "aprovado")
        .reduce((sum, s) => sum + (s.valor_total || 0), 0) || 0;

      // Montar resumo das etapas
      const etapasResumo: EtapaResumo[] = (etapas || []).map((e) => {
        const selecoesEtapa = selecoes?.filter((s) => s.etapa_id === e.id) || [];
        return {
          id: e.id,
          tipo: e.tipo || "revestimentos",
          titulo: e.titulo,
          status: e.status,
          itens_selecionados: selecoesEtapa.filter(
            (s) => s.status === "selecionado" || s.status === "aprovado"
          ).length,
          total_itens: selecoesEtapa.length || 5, // Default 5 itens por etapa
        };
      });

      setMoodboard({
        id: mb.id,
        titulo: mb.titulo || "Meus Acabamentos",
        status: mb.status,
        etapas: etapasResumo,
        valor_total_selecionado: valorTotal,
      });
    } catch (error) {
      console.error("Erro ao carregar moodboard:", error);
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  useEffect(() => {
    carregarMoodboard();
  }, [carregarMoodboard]);

  // Calcular progresso geral
  const progressoGeral = moodboard?.etapas
    ? Math.round(
        (moodboard.etapas.filter((e) => e.status === "concluida").length /
          Math.max(moodboard.etapas.length, 1)) *
          100
      )
    : 0;

  useEffect(() => {
    const total = moodboard?.etapas?.length || 0;
    const concluidas = moodboard?.etapas?.filter((e) => e.status === "concluida").length || 0;
    const pendentes = Math.max(0, total - concluidas);
    onProgressChange?.(progressoGeral || 0);
    onResumoChange?.({ total, concluidas, pendentes });
  }, [moodboard, progressoGeral, onProgressChange, onResumoChange]);

  // Encontrar etapa atual
  const etapaAtual = moodboard?.etapas.find(
    (e) => e.status === "em_andamento" || e.status === "liberada"
  );

  if (loading) {
    return (
      <Card className="rounded-3xl border border-gray-200 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center min-h-[200px]">
          <div className="animate-pulse flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-200 rounded-full" />
            <div className="w-32 h-4 bg-gray-200 rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleAtivarModulo = async () => {
    if (!clienteId) return;
    try {
      setAtivando(true);
      const novoMoodboard = await criarMoodboard({
        cliente_id: clienteId,
        contrato_id: contratoId,
        titulo: "Meus Acabamentos",
        descricao: "SeleçÍo de acabamentos do projeto",
      });
      if (contratoId) {
        await criarEtapasPadrao(contratoId, novoMoodboard.id);
      }
      await carregarMoodboard();

      let shareToken = novoMoodboard?.share_token || null;

      if (!shareToken && novoMoodboard?.id) {
        const atualizado = await buscarMoodboard(novoMoodboard.id).catch(() => null);
        shareToken = atualizado?.share_token || null;
      }

      if (!shareToken && novoMoodboard?.id) {
        const novoToken = gerarShareToken();
        const atualizado = await atualizarMoodboard(novoMoodboard.id, {
          share_token: novoToken,
        }).catch(() => null);
        shareToken = atualizado?.share_token || novoToken;
      }

      // Usuário logado: usar rota autenticada para evitar redirecionamento do PublicRoute
      navigate(`/wgx/moodboard/${novoMoodboard.id}`);
    } catch (error) {
      console.error("Erro ao ativar moodboard:", error);
    } finally {
      setAtivando(false);
    }
  };

  // Se nao tem contrato ou moodboard, mostrar CTA
  if (!contratoId || !moodboard) {
    return (
      <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-[#F25C26] to-[#F57F17] p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-normal text-lg">Escolha seus Acabamentos</h3>
              <p className="text-sm text-white/80">
                Personalize cada detalhe da sua reforma
              </p>
            </div>
          </div>
        </div>
        <CardContent className="p-6">
          <p className="text-gray-600 text-sm mb-4">
            Personalize pisos, revestimentos, cores de pintura, loucas sanitarias e muito mais diretamente por aqui.
          </p>
          {!clienteId ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Clock className="w-4 h-4" />
              <span>Modulo indisponivel no momento.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                onClick={handleAtivarModulo}
                disabled={ativando}
                className="bg-wg-primary text-white hover:bg-wg-primary/90"
              >
                {ativando ? "Criando..." : "Criar meu MoodBoard"}
              </Button>
              <span className="text-xs text-gray-500">Apos criar, voce podera escolher e salvar seus acabamentos.</span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-[#F25C26] to-[#F57F17] p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Palette className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-normal text-lg">{moodboard.titulo}</h3>
              <p className="text-sm text-white/80">
                {progressoGeral}% concluido
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/70">Valor selecionado</p>
            <p className="text-xl font-normal">
              {formatCurrency(moodboard.valor_total_selecionado)}
            </p>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4">
          <Progress
            value={progressoGeral}
            className="h-2 bg-white/20"
          />
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        {/* Etapa atual em destaque */}
        {etapaAtual && (
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-xl"
                  style={{
                    backgroundColor: `${ETAPAS_ESCOLHA_CONFIG[etapaAtual.tipo]?.cor || "#F25C26"}20`,
                  }}
                >
                  {ETAPAS_ESCOLHA_CONFIG[etapaAtual.tipo]?.icone || "🎨"}
                </div>
                <div>
                  <p className="text-xs text-orange-600 font-medium uppercase tracking-wide">
                    Etapa Atual
                  </p>
                  <p className="font-normal text-gray-900">{etapaAtual.titulo}</p>
                </div>
              </div>
              <Badge className="bg-orange-100 text-orange-700">
                {etapaAtual.status === "liberada" ? "Liberada" : "Em andamento"}
              </Badge>
            </div>
          </div>
        )}

        {/* Lista de etapas */}
        <div className="space-y-2">
          {moodboard.etapas.slice(0, 4).map((etapa) => {
            const config = ETAPAS_ESCOLHA_CONFIG[etapa.tipo];
            const isAtual = etapa.id === etapaAtual?.id;
            const isConcluida = etapa.status === "concluida";
            const isPendente = etapa.status === "pendente";

            return (
              <div
                key={etapa.id}
                className={cn(
                  "flex items-center gap-3 p-3 rounded-lg transition-colors",
                  isAtual && "bg-orange-50",
                  isConcluida && "opacity-60"
                )}
              >
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm",
                    isConcluida && "bg-green-100",
                    isPendente && "bg-gray-100",
                    !isConcluida && !isPendente && "bg-orange-100"
                  )}
                >
                  {isConcluida ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  ) : isPendente ? (
                    <Clock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <span>{config?.icone || "🎨"}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-medium truncate",
                      isConcluida && "text-gray-500",
                      isPendente && "text-gray-400"
                    )}
                  >
                    {etapa.titulo}
                  </p>
                </div>
                {isConcluida && (
                  <Badge variant="outline" className="text-green-600 border-green-200">
                    Concluido
                  </Badge>
                )}
              </div>
            );
          })}
        </div>

        {/* Botao de acao */}
        <Button
          onClick={() => navigate(`/wgx/moodboard/${moodboard.id}`)}
          className="w-full bg-gradient-to-r from-[#F25C26] to-[#F57F17] hover:from-[#D94C1F] hover:to-[#E56E10]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {etapaAtual ? "Continuar Escolhendo" : "Ver Minhas Escolhas"}
          <ChevronRight className="w-4 h-4 ml-auto" />
        </Button>
      </CardContent>
    </Card>
  );
}

