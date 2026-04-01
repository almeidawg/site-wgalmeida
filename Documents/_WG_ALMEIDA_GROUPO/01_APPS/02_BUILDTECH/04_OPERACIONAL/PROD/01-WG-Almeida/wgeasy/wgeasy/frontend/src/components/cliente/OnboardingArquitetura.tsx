// ============================================================
// COMPONENTE: OnboardingArquitetura
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// VisualizaçÍo do progresso das etapas do projeto de arquitetura
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
  MessageSquare,
  Map as MapIcon,
  Lightbulb,
  Layers,
  GitMerge,
  Calculator,
  FileCheck,
  Pencil,
  FileText,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";

// Ícones para cada etapa
const ETAPA_ICONS: Record<number, ReactNode> = {
  1: <Ruler className="w-5 h-5" />,
  2: <MessageSquare className="w-5 h-5" />,
  3: <MapIcon className="w-5 h-5" />,
  4: <Lightbulb className="w-5 h-5" />,
  5: <Layers className="w-5 h-5" />,
  6: <GitMerge className="w-5 h-5" />,
  7: <Calculator className="w-5 h-5" />,
  8: <FileCheck className="w-5 h-5" />,
  9: <Pencil className="w-5 h-5" />,
  10: <FileText className="w-5 h-5" />,
};

// Descrições resumidas das etapas
const _ETAPA_RESUMOS: Record<number, string> = {
  1: "MediçÍo do espaço, mapa de acessos, pontos elétricos e hidráulicos",
  2: "Entrevista profunda para entender suas necessidades e expectativas",
  3: "ApresentaçÍo da planta do imóvel como base para as soluções",
  4: "Conceito do projeto com plantas ilustradas, cores e texturas",
  5: "Projetos estrutural, elétrico, hidráulico, luminotécnico e outros",
  6: "IntegraçÍo e compatibilizaçÍo de todos os projetos",
  7: "Orçamento estimado alinhado com sua expectativa financeira",
  8: "AprovaçÍo e regularizaçÍo nos órgÍos competentes",
  9: "Especificações de pisos, revestimentos, mobiliários e marcenaria",
  10: "Pranchas, detalhamentos e documentos completos para obra",
};

// Descrições detalhadas das etapas
const ETAPA_DETALHES: Record<number, string> = {
  1: "Ocorrerá a mediçÍo do espaço objeto do projeto, reunindo informações físicas e normativas: mapa de acessos, pontos elétricos e hidráulicos, níveis, tipos de materiais existentes, mapeamento de edificações ou elementos naturais existentes.",
  2: "Esta é uma das etapas mais importantes - uma investigaçÍo profunda das necessidades para entender o que você precisa, o que espera, o que gosta, o que não gosta e qual sua realidade para investimento.",
  3: "Para um melhor envolvimento com seu projeto, será apresentada a planta do imóvel conforme levantamento feito, mostrando onde poderÍo ser aplicadas as soluções solicitadas.",
  4: "Nesta etapa nosso profissional irá materializar as ideias com toda capacidade criativa e técnica. Usaremos planta layout ilustrada, com cores e texturas, imagens de referência, pesquisas e materiais físicos.",
  5: "IdentificaçÍo e solicitaçÍo de projetos complementares: fundações, estrutural, elétrico, hidrossanitário, luminotécnico, ar condicionado, automaçÍo, reuso de águas pluviais, entre outros.",
  6: "Etapa que acontecerá várias vezes durante a elaboraçÍo, quantas forem necessárias, para garantir que todos os projetos estejam integrados e compatíveis entre si.",
  7: "Ferramenta desenvolvida para garantir que seu sonho esteja alinhado com a expectativa financeira. A partir do estudo preliminar aprovado, será montado um orçamento com estimativa de custos e cenários claros de execuçÍo.",
  8: "SerÍo requeridas as licenças necessárias de reforma, com envio do projeto legal para aprovaçÍo e regularizaçÍo nos órgÍos competentes, incluindo todos os procedimentos necessários.",
  9: "ConsolidaçÍo das ideias e especificações finais: pisos, revestimentos, mobiliários, louças e metais, luminárias, eletrodomésticos e layout de marcenaria. É fundamental para minimizar mudanças e desperdícios na obra.",
  10: "Conjunto completo de informações para a obra: série de desenhos, pranchas e documentos com detalhamento do que e como será executado, direcionados aos contratados para execuçÍo.",
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

interface OnboardingArquiteturaProps {
  contratoId?: string;
  oportunidadeId?: string;
  clienteId?: string;
  podeEditar?: boolean;
  onProgressChange?: (progresso: number) => void;
  onResumoChange?: (resumo: { total: number; pendentes: number; concluidas: number }) => void;
}

export default function OnboardingArquitetura({
  contratoId,
  oportunidadeId,
  clienteId,
  podeEditar = false,
  onProgressChange,
  onResumoChange,
}: OnboardingArquiteturaProps) {
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
        .ilike("nucleo", "%arquitet%")
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
      console.error("Erro ao carregar datas do cronograma (arquitetura):", error);
    }

    return datasPorOrdem;
  }, [clienteId, contratoId, oportunidadeId]);

  // FunçÍo para atualizar percentual de um item
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

      // Atualizar estado local
      const novosItens = checklist.itens.map((i) =>
        i.id === itemId ? { ...i, percentual_concluido: percentual, concluido } : i
      );

      // Calcular progresso como média dos percentuais
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

  // Abrir editor de percentual
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
        .ilike("titulo", "%onboarding%arquitetura%");

      if (contratoId) {
        query = query.eq("vinculo_tipo", "contrato").eq("vinculo_id", contratoId);
      } else if (oportunidadeId && !oportunidadeId.startsWith("CLIENTE-")) {
        query = query.eq("vinculo_tipo", "oportunidade").eq("vinculo_id", oportunidadeId);
      } else if (clienteId) {
        query = query.eq("vinculo_tipo", "cliente").eq("vinculo_id", clienteId);
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

        // Calcular progresso como média dos percentuais
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
  }, [carregarDatasCronogramaNucleo, clienteId, contratoId, oportunidadeId, onProgressChange, onResumoChange]);
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
    titulo: 'Onboarding Arquitetura',
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

  // FunçÍo para obter cor baseada no percentual
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
              <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma etapa cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">As etapas do seu projeto serÍo exibidas aqui</p>
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
                    ? "bg-blue-50"
                    : "bg-white"
                }`}
              >
                {/* Header da Etapa */}
                <button
                  onClick={() => setExpandedEtapa(isExpanded ? null : item.ordem)}
                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                >
                  {/* Ícone de Status - Clicável para Admin/Master */}
                  {podeEditar ? (
                    <button
                      type="button"
                      onClick={(e) => abrirEditorPercentual(item, e)}
                      disabled={atualizando === item.id}
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${getCorPercentual(percentual)} ${
                        percentual >= 100 ? "text-white" : percentual > 0 ? "text-white" : "text-gray-500"
                      } cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-wg-primary ${
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

                  {/* Informações */}
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
                            ? "text-blue-700"
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
                        <Badge className="bg-blue-500 text-white text-xs shrink-0">
                          Em andamento
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
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-wg-primary hover:bg-wg-primary/10 disabled:opacity-50"
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

                  {/* Chevron */}
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
                    <div className="p-4 rounded-lg bg-white border-2 border-wg-primary shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Ajustar progresso: <span className="text-wg-primary font-bold">{percentualTemp}%</span>
                        </p>
                        <button
                          onClick={() => setEditandoPercentual(null)}
                          className="text-gray-400 hover:text-gray-600"
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
                          className="flex-1 bg-wg-primary hover:bg-wg-primary/90"
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
                    <div className="p-4 rounded-lg bg-white border-2 border-wg-primary shadow-lg">
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
                        className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wg-primary"
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
                          className="flex-1 bg-wg-primary hover:bg-wg-primary/90"
                          disabled={atualizando === item.id || !textoTemp.trim()}
                          title="Salvar texto"
                        >
                          {atualizando === item.id ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Conteúdo Expandido */}
                {isExpanded && !isEditando && !isEditandoTexto && (
                  <div className="px-4 pb-4 pl-16">
                    <div
                      className={`p-4 rounded-lg ${
                        item.concluido
                          ? "bg-green-100 border border-green-200"
                          : isCurrent
                          ? "bg-blue-100 border border-blue-200"
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

      {/* Footer informativo */}
      <div className="px-4 py-3 bg-amber-50 border-t border-amber-100">
        <p className="text-xs text-amber-700">
          💡 <strong>Dica:</strong> A cada etapa concluída, você receberá uma
          notificaçÍo. Clique nas etapas para ver mais detalhes sobre cada fase
          do seu projeto.
        </p>
      </div>
    </Card>
  );
}


