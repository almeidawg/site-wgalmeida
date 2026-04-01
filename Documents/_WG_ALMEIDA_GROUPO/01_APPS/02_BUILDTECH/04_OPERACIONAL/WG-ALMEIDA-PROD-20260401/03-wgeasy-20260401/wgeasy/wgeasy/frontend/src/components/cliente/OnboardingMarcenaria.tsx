// ============================================================
// COMPONENTE: OnboardingMarcenaria
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// VisualizaçÍo do progresso das etapas de marcenaria
// Admin/Master pode ajustar porcentagem de conclusÍo de cada item
// ============================================================

import { useState, useEffect, useCallback, type ReactNode } from "react";
import type { MouseEvent } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  CheckCircle2,
  Circle,
  Clock,
  ChevronDown,
  ChevronUp,
  Ruler,
  Layers,
  Scissors,
  Package,
  Truck,
  Hammer,
  Sparkles,
  CheckSquare,
  ShieldCheck,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import WGStarIcon from "@/components/icons/WGStarIcon";

// Ícones para cada etapa de marcenaria
const ETAPA_ICONS: Record<number, ReactNode> = {
  1: <Ruler className="w-5 h-5" />,
  2: <Layers className="w-5 h-5" />,
  3: <CheckSquare className="w-5 h-5" />,
  4: <Scissors className="w-5 h-5" />,
  5: <Package className="w-5 h-5" />,
  6: <Truck className="w-5 h-5" />,
  7: <Hammer className="w-5 h-5" />,
  8: <Sparkles className="w-5 h-5" />,
  9: <ShieldCheck className="w-5 h-5" />,
  10: <WGStarIcon className="w-5 h-5" />,
};

// Descrições resumidas das etapas de marcenaria
const _ETAPA_RESUMOS: Record<number, string> = {
  1: "MediçÍo precisa de todos os ambientes para produçÍo",
  2: "Desenvolvimento do projeto detalhado de cada móvel",
  3: "AprovaçÍo dos projetos, materiais e acabamentos",
  4: "Corte das chapas e início da produçÍo fabril",
  5: "Montagem dos módulos e preparaçÍo para transporte",
  6: "Transporte dos móveis até o local de instalaçÍo",
  7: "InstalaçÍo profissional de todos os móveis",
  8: "Ajustes finais, regulagens e limpeza completa",
  9: "Vistoria de qualidade e correçÍo de pendências",
  10: "Entrega oficial com termo de aceite",
};

// Descrições detalhadas das etapas
const ETAPA_DETALHES: Record<number, string> = {
  1: "Nossa equipe técnica realiza mediçÍo precisa de todos os ambientes que receberÍo marcenaria. SÍo verificados níveis, esquadros, pontos de instalaçÍo elétrica e hidráulica, e todas as particularidades que afetam a produçÍo.",
  2: "Com base nas medições e no projeto de arquitetura, desenvolvemos os projetos executivos de cada móvel: armários, cozinha, closet, home office, etc. Cada detalhe é pensado para maximizar espaço e funcionalidade.",
  3: "ApresentaçÍo dos projetos finais com detalhamento de materiais, ferragens, acabamentos e cores. Nesta etapa você aprova cada item antes de iniciarmos a produçÍo, garantindo que tudo esteja conforme esperado.",
  4: "Início da produçÍo na fábrica. As chapas sÍo cortadas com precisÍo milimétrica em máquinas CNC. Bordas sÍo coladas, furos de ferragem sÍo feitos e cada peça é identificada para montagem.",
  5: "Os módulos sÍo pré-montados na fábrica, testando encaixes e ajustes. Cada peça é embalada com proteçÍo adequada para transporte seguro até a obra.",
  6: "Logística cuidadosa de transporte dos móveis. Os módulos sÍo organizados por ambiente para otimizar a instalaçÍo. Cuidado especial para evitar danos durante o trajeto.",
  7: "Nossa equipe de montadores profissionais realiza a instalaçÍo de todos os móveis. SÍo verificados níveis, prumos e todos os ajustes necessários para perfeito encaixe.",
  8: "Após a instalaçÍo, realizamos ajustes finos: regulagem de dobradiças, corrediças, portas e gavetas. Limpeza completa de todos os móveis instalados.",
  9: "Vistoria técnica para garantir que tudo está funcionando perfeitamente. Eventuais pendências sÍo identificadas e corrigidas antes da entrega final.",
  10: "Momento especial de entrega da sua marcenaria completa. Você receberá orientações de uso, manutençÍo e garantia de todos os móveis instalados.",
};

interface EtapaItem {
  id: string;
  texto: string;
  concluido: boolean;
  percentual_concluido: number;
  ordem: number;
  secao: string;
  data_inicio?: string | null;
  data_termino?: string | null;
}

function extrairTituloDescricao(texto: string): { titulo: string; descricao: string } {
  const partes = texto.split(': ');
  if (partes.length >= 2) {
    return {
      titulo: partes[0],
      descricao: partes.slice(1).join(': ')
    };
  }
  return { titulo: texto, descricao: '' };
}

interface Checklist {
  id: string;
  titulo: string;
  itens: EtapaItem[];
  progresso: number;
}

interface OnboardingMarcenariaProps {
  contratoId?: string;
  oportunidadeId?: string;
  clienteId?: string;
  podeEditar?: boolean;
  onProgressChange?: (progresso: number) => void;
  onResumoChange?: (resumo: { total: number; pendentes: number; concluidas: number }) => void;
}

export default function OnboardingMarcenaria({
  contratoId,
  oportunidadeId,
  clienteId,
  podeEditar = false,
  onProgressChange,
  onResumoChange,
}: OnboardingMarcenariaProps) {
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedEtapa, setExpandedEtapa] = useState<number | null>(null);
  const [atualizando, setAtualizando] = useState<string | null>(null);
  const [editandoPercentual, setEditandoPercentual] = useState<string | null>(null);
  const [percentualTemp, setPercentualTemp] = useState<number>(0);
  const [editandoTexto, setEditandoTexto] = useState<string | null>(null);
  const [textoTemp, setTextoTemp] = useState<string>("");

  const formatarDataCurta = (data?: string | null) => {
    if (!data) return "--";
    const valor = String(data).slice(0, 10);
    const [ano, mes, dia] = valor.split("-");
    if (!ano || !mes || !dia) return "--";
    return `${dia}/${mes}/${ano}`;
  };

  const carregarDatasCronogramaNucleo = useCallback(async () => {
    const datasPorOrdem = new Map<number, { data_inicio?: string; data_termino?: string }>();

    try {
      let projetoIds: string[] = [];

      if (contratoId) {
        const { data: projetosContrato } = await supabase
          .from("projetos")
          .select("id")
          .eq("contrato_id", contratoId);
        projetoIds = (projetosContrato || []).map((p: any) => p.id);
      }

      if (projetoIds.length === 0 && clienteId) {
        const { data: projetosCliente } = await supabase
          .from("projetos")
          .select("id")
          .eq("cliente_id", clienteId);
        projetoIds = (projetosCliente || []).map((p: any) => p.id);
      }

      if (projetoIds.length === 0 && oportunidadeId && !oportunidadeId.startsWith("CLIENTE-")) {
        const { data: projetosOportunidade } = await supabase
          .from("projetos")
          .select("id")
          .eq("oportunidade_id", oportunidadeId);
        projetoIds = (projetosOportunidade || []).map((p: any) => p.id);
      }

      if (projetoIds.length === 0) return datasPorOrdem;

      const { data: tarefasNucleo } = await supabase
        .from("cronograma_tarefas")
        .select("ordem, data_inicio, data_termino")
        .in("projeto_id", projetoIds)
        .ilike("nucleo", "%marcen%")
        .order("ordem", { ascending: true });

      for (const tarefa of tarefasNucleo || []) {
        const ordem = Number((tarefa as any).ordem || 0);
        if (!ordem || datasPorOrdem.has(ordem)) continue;
        datasPorOrdem.set(ordem, {
          data_inicio: (tarefa as any).data_inicio || undefined,
          data_termino: (tarefa as any).data_termino || undefined,
        });
      }
    } catch (error) {
      console.error("Erro ao carregar datas do cronograma (marcenaria):", error);
    }

    return datasPorOrdem;
  }, [clienteId, contratoId, oportunidadeId]);

  const atualizarPercentual = async (itemId: string, percentual: number) => {
    if (!podeEditar || !checklist) return;

    setAtualizando(itemId);
    try {
      const concluido = percentual >= 100;
      const { error } = await supabase
        .from("checklist_itens")
        .update({
          percentual_concluido: percentual,
          concluido: concluido
        })
        .eq("id", itemId);

      if (error) {
        console.error("Erro ao atualizar percentual:", error);
        return;
      }

      const novosItens = checklist.itens.map((i) =>
        i.id === itemId ? { ...i, percentual_concluido: percentual, concluido } : i
      );

      const somaPercentuais = novosItens.reduce((acc, i) => acc + (i.percentual_concluido || 0), 0);
      const progresso = novosItens.length > 0 ? Math.round(somaPercentuais / novosItens.length) : 0;

      setChecklist({
        ...checklist,
        itens: novosItens,
        progresso,
      });
      onProgressChange?.(progresso);
      const concluidas = novosItens.filter((i) => i.concluido || (i.percentual_concluido || 0) >= 100).length;
      onResumoChange?.({
        total: novosItens.length,
        concluidas,
        pendentes: Math.max(0, novosItens.length - concluidas),
      });

      setEditandoPercentual(null);
    } catch (err) {
      console.error("Erro ao atualizar percentual:", err);
    } finally {
      setAtualizando(null);
    }
  };

  const atualizarTextoItem = async (itemId: string, novoTexto: string) => {
    if (!podeEditar || !checklist) return;

    const textoLimpo = novoTexto.trim();
    if (!textoLimpo) return;

    setAtualizando(itemId);
    try {
      const { error } = await supabase
        .from("checklist_itens")
        .update({ texto: textoLimpo })
        .eq("id", itemId);

      if (error) {
        console.error("Erro ao atualizar texto do item:", error);
        return;
      }

      const novosItens = checklist.itens.map((i) =>
        i.id === itemId ? { ...i, texto: textoLimpo } : i
      );

      const somaPercentuais = novosItens.reduce((acc, i) => acc + (i.percentual_concluido || 0), 0);
      const progresso = novosItens.length > 0 ? Math.round(somaPercentuais / novosItens.length) : 0;

      setChecklist({
        ...checklist,
        itens: novosItens,
        progresso,
      });
      onProgressChange?.(progresso);
      const concluidas = novosItens.filter((i) => i.concluido || (i.percentual_concluido || 0) >= 100).length;
      onResumoChange?.({
        total: novosItens.length,
        concluidas,
        pendentes: Math.max(0, novosItens.length - concluidas),
      });

      setEditandoTexto(null);
    } catch (err) {
      console.error("Erro ao atualizar texto do item:", err);
    } finally {
      setAtualizando(null);
    }
  };

  const excluirItem = async (itemId: string) => {
    if (!podeEditar || !checklist) return;

    const item = checklist.itens.find((i) => i.id === itemId);
    if (!item) return;
    const titulo = extrairTituloDescricao(item.texto).titulo;
    if (!window.confirm(`Excluir item "${titulo}"?`)) return;

    setAtualizando(itemId);
    try {
      const { error } = await supabase
        .from("checklist_itens")
        .delete()
        .eq("id", itemId);

      if (error) {
        console.error("Erro ao excluir item:", error);
        return;
      }

      const novosItens = checklist.itens.filter((i) => i.id !== itemId);
      const somaPercentuais = novosItens.reduce((acc, i) => acc + (i.percentual_concluido || 0), 0);
      const progresso = novosItens.length > 0 ? Math.round(somaPercentuais / novosItens.length) : 0;

      setChecklist({
        ...checklist,
        itens: novosItens,
        progresso,
      });
      onProgressChange?.(progresso);
      const concluidas = novosItens.filter((i) => i.concluido || (i.percentual_concluido || 0) >= 100).length;
      onResumoChange?.({
        total: novosItens.length,
        concluidas,
        pendentes: Math.max(0, novosItens.length - concluidas),
      });

      if (editandoPercentual === itemId) setEditandoPercentual(null);
      if (editandoTexto === itemId) setEditandoTexto(null);
    } catch (err) {
      console.error("Erro ao excluir item:", err);
    } finally {
      setAtualizando(null);
    }
  };

  const abrirEditorPercentual = (item: EtapaItem, e: MouseEvent) => {
    e.stopPropagation();
    if (!podeEditar) return;
    setEditandoTexto(null);
    setEditandoPercentual(item.id);
    setPercentualTemp(item.percentual_concluido || 0);
  };

  const abrirEditorTexto = (item: EtapaItem, e: MouseEvent) => {
    e.stopPropagation();
    if (!podeEditar) return;
    setEditandoPercentual(null);
    setEditandoTexto(item.id);
    setTextoTemp(item.texto || "");
  };

  const carregarOnboarding = useCallback(async () => {
    try {
      setLoading(true);

      let query = supabase
        .from("checklists")
        .select(`
          id,
          titulo,
          checklist_itens (
            id,
            texto,
            concluido,
            percentual_concluido,
            ordem,
            secao
          )
        `)
        .ilike("titulo", "%onboarding%marcenaria%");

      if (contratoId) {
        query = query.eq("vinculo_tipo", "contrato").eq("vinculo_id", contratoId);
      } else if (oportunidadeId) {
        query = query.eq("vinculo_tipo", "oportunidade").eq("vinculo_id", oportunidadeId);
      }

      type ChecklistRow = Checklist & { checklist_itens: EtapaItem[] };
      const { data: rows, error } = await query.limit(1);
      const data = (rows as ChecklistRow[] | null)?.[0];

      if (error) {
        console.error("Erro ao carregar onboarding:", error);
      }

      if (data) {
        const datasPorOrdem = await carregarDatasCronogramaNucleo();
        const itens = (data.checklist_itens || ([] as EtapaItem[])).sort(
          (a, b) => a.ordem - b.ordem
        ).map(item => ({
          ...item,
          percentual_concluido: item.percentual_concluido || (item.concluido ? 100 : 0),
          data_inicio: datasPorOrdem.get(item.ordem)?.data_inicio || null,
          data_termino: datasPorOrdem.get(item.ordem)?.data_termino || null,
        }));

        const somaPercentuais = itens.reduce((acc, i) => acc + (i.percentual_concluido || 0), 0);
        const progresso = itens.length > 0 ? Math.round(somaPercentuais / itens.length) : 0;

        setChecklist({
          id: data.id,
          titulo: data.titulo,
          itens,
          progresso,
        });
        onProgressChange?.(progresso);
        const concluidas = itens.filter((i) => i.concluido || (i.percentual_concluido || 0) >= 100).length;
        onResumoChange?.({
          total: itens.length,
          concluidas,
          pendentes: Math.max(0, itens.length - concluidas),
        });

        const etapaEmAndamento = itens.find((i) => {
          const percentual = i.percentual_concluido || 0;
          return percentual > 0 && percentual < 100;
        });
        const primeiraIncompleta = itens.find((i) => !i.concluido);
        if (etapaEmAndamento) {
          setExpandedEtapa(etapaEmAndamento.ordem);
        } else if (primeiraIncompleta) {
          setExpandedEtapa(primeiraIncompleta.ordem);
        }
      } else {
        onProgressChange?.(0);
        onResumoChange?.({ total: 0, concluidas: 0, pendentes: 0 });
      }
    } catch (error) {
      console.error("Erro ao carregar onboarding:", error);
      onProgressChange?.(0);
      onResumoChange?.({ total: 0, concluidas: 0, pendentes: 0 });
    } finally {
      setLoading(false);
    }
  }, [carregarDatasCronogramaNucleo, contratoId, oportunidadeId, onProgressChange, onResumoChange]);

  useEffect(() => {
    carregarOnboarding();
  }, [carregarOnboarding]);

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardContent className="space-y-4 p-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const checklistExibir = checklist || {
    id: 'default',
    titulo: 'Onboarding Marcenaria',
    itens: [],
    progresso: 0,
  };

  const _itensNaoConcluidos = checklistExibir.itens.filter(i => !i.concluido).length;
  const _totalItens = checklistExibir.itens.length;
  const etapaAtual =
    checklistExibir.itens.find((i) => {
      const percentual = i.percentual_concluido || 0;
      return percentual > 0 && percentual < 100;
    })?.ordem ||
    checklistExibir.itens.find((i) => !i.concluido)?.ordem ||
    checklistExibir.itens.length ||
    0;

  const getCorPercentual = (percentual: number) => {
    if (percentual >= 100) return "bg-green-500";
    if (percentual >= 75) return "bg-emerald-400";
    if (percentual >= 50) return "bg-yellow-400";
    if (percentual >= 25) return "bg-orange-400";
    return "bg-gray-200";
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="divide-y">
          {checklistExibir.itens.length === 0 ? (
            <div className="p-8 text-center">
              <Layers className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma etapa cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">As etapas da marcenaria serÍo exibidas aqui</p>
            </div>
          ) : null}

          {checklistExibir.itens.map((item) => {
            const isExpanded = expandedEtapa === item.ordem;
            const isCurrent = item.ordem === etapaAtual && !item.concluido;
            const isEditando = editandoPercentual === item.id;
            const isEditandoTexto = editandoTexto === item.id;
            const percentual = item.percentual_concluido || 0;

            return (
              <div
                key={item.id}
                className={`transition-colors ${
                  item.concluido
                    ? "bg-green-50"
                    : isCurrent
                    ? "bg-nucleo-marcenaria/10"
                    : "bg-white"
                }`}
              >
                <button
                  onClick={() => setExpandedEtapa(isExpanded ? null : item.ordem)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {podeEditar ? (
                    <button
                      type="button"
                      onClick={(e) => abrirEditorPercentual(item, e)}
                      disabled={atualizando === item.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${getCorPercentual(percentual)} ${
                        percentual >= 100 ? "text-white" : percentual > 0 ? "text-white" : "text-gray-500"
                      } cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-nucleo-marcenaria ${
                        atualizando === item.id ? "opacity-50 animate-pulse" : ""
                      }`}
                      title={`${percentual}% - Clique para ajustar`}
                    >
                      {atualizando === item.id ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : item.concluido ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : percentual > 0 ? (
                        <span className="text-xs font-bold">{percentual}%</span>
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getCorPercentual(percentual)} ${
                        percentual >= 100 ? "text-white" : percentual > 0 ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {item.concluido ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : percentual > 0 ? (
                        <span className="text-xs font-bold">{percentual}%</span>
                      ) : isCurrent ? (
                        <Clock className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2 min-w-0 whitespace-nowrap">
                      <span className="text-gray-400 shrink-0">
                        {ETAPA_ICONS[item.ordem]}
                      </span>
                      <span
                        className={`min-w-0 truncate font-normal ${
                          item.concluido
                            ? "text-green-700"
                            : isCurrent
                            ? "text-nucleo-marcenaria"
                            : "text-gray-700"
                        }`}
                      >
                        {extrairTituloDescricao(item.texto).titulo}
                      </span>
                      {item.concluido && (
                        <Badge className="bg-green-500 text-white text-xs shrink-0">
                          Concluído
                        </Badge>
                      )}
                      {!item.concluido && percentual > 0 && (
                        <Badge className="bg-orange-500 text-white text-xs shrink-0">
                          {percentual}%
                        </Badge>
                      )}
                      {isCurrent && percentual === 0 && (
                        <Badge className="bg-nucleo-marcenaria text-white text-xs shrink-0">
                          Em produçÍo
                        </Badge>
                      )}
                      <span className="ml-auto text-[11px] text-gray-400 shrink-0 whitespace-nowrap">
                        Início: {formatarDataCurta(item.data_inicio)} · Término: {formatarDataCurta(item.data_termino)}
                      </span>
                      {podeEditar && (
                        <button
                          type="button"
                          onClick={(e) => abrirEditorTexto(item, e)}
                          disabled={atualizando === item.id}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-nucleo-marcenaria hover:bg-nucleo-marcenaria/10 disabled:opacity-50"
                          title="Editar texto do item"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      )}
                      {podeEditar && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            void excluirItem(item.id);
                          }}
                          disabled={atualizando === item.id}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                          title="Excluir item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex-shrink-0 text-gray-400">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </div>
                </button>

                {/* Editor de Percentual */}
                {isEditando && podeEditar && (
                  <div className="px-4 pb-4 pl-16" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 rounded-lg bg-white border-2 border-nucleo-marcenaria shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Ajustar progresso: <span className="text-nucleo-marcenaria font-bold">{percentualTemp}%</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditandoPercentual(null)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Fechar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <Slider
                        value={[percentualTemp]}
                        onValueChange={(value) => setPercentualTemp(value[0])}
                        max={100}
                        step={5}
                        className="mb-4"
                      />

                      <div className="flex justify-between text-xs text-gray-400 mb-4">
                        <span>0%</span>
                        <span>25%</span>
                        <span>50%</span>
                        <span>75%</span>
                        <span>100%</span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditandoPercentual(null)}
                          className="flex-1"
                          title="Cancelar ediçÍo"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => atualizarPercentual(item.id, percentualTemp)}
                          className="flex-1 bg-nucleo-marcenaria hover:bg-nucleo-marcenaria/90"
                          disabled={atualizando === item.id}
                          title="Salvar progresso"
                        >
                          {atualizando === item.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isEditandoTexto && podeEditar && (
                  <div className="px-4 pb-4 pl-16" onClick={(e) => e.stopPropagation()}>
                    <div className="p-4 rounded-lg bg-white border-2 border-nucleo-marcenaria shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Editar texto do item
                        </p>
                        <button
                          type="button"
                          onClick={() => setEditandoTexto(null)}
                          className="text-gray-400 hover:text-gray-600"
                          title="Fechar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <input
                        type="text"
                        value={textoTemp}
                        onChange={(e) => setTextoTemp(e.target.value)}
                        className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nucleo-marcenaria"
                        placeholder="Digite o texto da tarefa"
                      />

                      <div className="flex gap-2 mt-4">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setEditandoTexto(null)}
                          className="flex-1"
                          title="Cancelar ediçÍo"
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => atualizarTextoItem(item.id, textoTemp)}
                          className="flex-1 bg-nucleo-marcenaria hover:bg-nucleo-marcenaria/90"
                          disabled={atualizando === item.id || !textoTemp.trim()}
                          title="Salvar texto"
                        >
                          {atualizando === item.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {isExpanded && !isEditando && !isEditandoTexto && (
                  <div className="px-4 pb-4 pl-16">
                    <div
                      className={`p-4 rounded-lg ${
                        item.concluido
                          ? "bg-green-100 border border-green-200"
                          : isCurrent
                          ? "bg-nucleo-marcenaria/10 border border-nucleo-marcenaria/20"
                          : "bg-gray-100 border border-gray-200"
                      }`}
                    >
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {extrairTituloDescricao(item.texto).descricao || ETAPA_DETALHES[item.ordem] || "Detalhes desta etapa serÍo disponibilizados em breve."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      <div className="px-4 py-3 bg-nucleo-marcenaria/10 border-t border-nucleo-marcenaria/20">
        <p className="text-xs text-nucleo-marcenaria">
          🪵 <strong>Qualidade WG:</strong> Cada móvel passa por controle de qualidade
          rigoroso antes da entrega. Você será notificado sobre o progresso da produçÍo.
        </p>
      </div>
    </Card>
  );
}

