// ============================================================
// COMPONENTE: OnboardingEngenharia
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// VisualizaçÍo do progresso das etapas de engenharia/obra
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
  ClipboardList,
  ShoppingCart,
  Hammer,
  HardHat,
  Wrench,
  Droplets,
  Zap,
  Wind,
  Paintbrush,
  Shield,
  Key,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { sincronizarOnboardingItemNoCronograma } from "@/lib/onboardingCronogramaSync";

// Ícones para cada etapa de engenharia
const ETAPA_ICONS: Record<number, ReactNode> = {
  1: <ClipboardList className="w-5 h-5" />,
  2: <ShoppingCart className="w-5 h-5" />,
  3: <Hammer className="w-5 h-5" />,
  4: <HardHat className="w-5 h-5" />,
  5: <Wrench className="w-5 h-5" />,
  6: <Droplets className="w-5 h-5" />,
  7: <Zap className="w-5 h-5" />,
  8: <Wind className="w-5 h-5" />,
  9: <Paintbrush className="w-5 h-5" />,
  10: <Shield className="w-5 h-5" />,
  11: <Key className="w-5 h-5" />,
};

// Descrições detalhadas das etapas
const ETAPA_DETALHES: Record<number, string> = {
  1: "Início do canteiro de obras com toda a preparaçÍo necessária: definiçÍo de cronograma detalhado, mobilizaçÍo das equipes, organizaçÍo do espaço de trabalho e definiçÍo das etapas de execuçÍo conforme os projetos aprovados.",
  2: "Processo de compras de todos os materiais necessários conforme especificações do projeto. Inclui cotações, negociaçÍo com fornecedores, logística de entrega e contrataçÍo de prestadores de serviço especializados.",
  3: "DemoliçÍo e remoçÍo de elementos existentes conforme projeto. Esta etapa prepara o espaço para as novas instalações, incluindo descarte correto de entulho e materiais.",
  4: "ExecuçÍo de fundações, estruturas metálicas ou de concreto, reforços estruturais e adequações necessárias. Todo trabalho é acompanhado pelo engenheiro responsável.",
  5: "ConstruçÍo de paredes, divisórias, instalaçÍo de contramarcos de portas e janelas, e preparaçÍo da infraestrutura para as instalações complementares.",
  6: "InstalaçÍo completa do sistema hidrossanitário: água fria e quente, esgoto, ralos, registros e conexões. Inclui testes de pressÍo e estanqueidade.",
  7: "InstalaçÍo de toda a rede elétrica, quadros de distribuiçÍo, pontos de luz, tomadas e infraestrutura para automaçÍo residencial. Inclui testes e certificaçÍo.",
  8: "InstalaçÍo dos sistemas de climatizaçÍo: ar condicionado, ventilaçÍo mecânica, exaustÍo e renovaçÍo de ar conforme projeto de conforto térmico.",
  9: "AplicaçÍo de pisos, revestimentos cerâmicos, porcelanatos, pinturas, texturizações e todos os acabamentos finais que dÍo identidade ao ambiente.",
  10: "Vistoria técnica completa para identificar e corrigir eventuais pendências. Teste de todos os sistemas instalados e garantia de funcionamento correto.",
  11: "Momento especial de entrega do projeto concluído. Inclui manual do proprietário, garantias de equipamentos e orientações de uso e manutençÍo.",
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

function itemConcluido(item: EtapaItem): boolean {
  return Boolean(item.concluido || (item.percentual_concluido || 0) >= 100);
}

function normalizarTexto(valor?: string | null): string {
  return String(valor || "").trim().toLowerCase();
}

function normalizarBusca(valor?: string | null): string {
  return normalizarTexto(valor)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function ehArCondicionado(texto?: string | null): boolean {
  const t = normalizarBusca(texto);
  const colado = t.replace(/\s+/g, "");
  return (
    t.includes("ar condicionado") ||
    colado.includes("arcondicionado") ||
    t.includes("climatiz") ||
    t.includes("infra ar") ||
    t.includes("infra de ar") ||
    t.includes("split") ||
    t.includes("hvac")
  );
}

function _ehNucleoEngenharia(valor?: string | null): boolean {
  const n = normalizarTexto(valor);
  return n === "engenharia" || n.startsWith("engenh") || n === "";
}

function propostaEstaAprovada(status?: string | null): boolean {
  const s = normalizarTexto(status).replace(/[\s_-]+/g, "");
  return (
    s.includes("aprov") ||
    s.includes("aceit") ||
    s.includes("ganh") ||
    s.includes("fechad") ||
    s.includes("contrat")
  );
}

interface OnboardingEngenhariaProps {
  contratoId?: string;
  oportunidadeId?: string;
  clienteId?: string;
  podeEditar?: boolean;
  onProgressChange?: (progresso: number) => void;
  onResumoChange?: (resumo: { total: number; pendentes: number; concluidas: number }) => void;
}

export default function OnboardingEngenharia({
  contratoId,
  oportunidadeId,
  clienteId,
  podeEditar = false,
  onProgressChange,
  onResumoChange,
}: OnboardingEngenhariaProps) {
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
        .ilike("nucleo", "%engenh%")
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
      console.error("Erro ao carregar datas do cronograma (engenharia):", error);
    }

    return datasPorOrdem;
  }, [clienteId, contratoId, oportunidadeId]);

  const clienteFechouArCondicionado = useCallback(async () => {
    try {
      if (contratoId) {
        const { data: itensContrato } = await supabase
          .from("contratos_itens")
          .select("descricao, nucleo, contratado_pelo_cliente")
          .eq("contrato_id", contratoId);

        const matchContrato = (itensContrato || []).some((item: any) => {
          const descricao = String(item?.descricao || "");
          const contratado = Boolean(item?.contratado_pelo_cliente);
          return ehArCondicionado(descricao) && contratado;
        });

        if (matchContrato) return true;
      }

      if (clienteId || (oportunidadeId && !oportunidadeId.startsWith("CLIENTE-"))) {
        const propostasEncontradas: any[] = [];
        if (clienteId) {
          const { data } = await supabase
            .from("propostas")
            .select("id, status")
            .eq("cliente_id", clienteId);
          propostasEncontradas.push(...(data || []));
        }
        if (oportunidadeId && !oportunidadeId.startsWith("CLIENTE-")) {
          const { data } = await supabase
            .from("propostas")
            .select("id, status")
            .eq("oportunidade_id", oportunidadeId);
          propostasEncontradas.push(...(data || []));
        }

        const propostasUnicas = [
          ...new Map((propostasEncontradas || []).map((p: any) => [String(p.id), p])).values(),
        ];
        const propostasAprovadas = propostasUnicas.filter((p: any) =>
          propostaEstaAprovada(p?.status)
        );

        const propostaIds = (propostasAprovadas || []).map((p: any) => p.id).filter(Boolean);
        if (propostaIds.length > 0) {
          const { data: itensProposta } = await supabase
            .from("propostas_itens")
            .select("descricao, descricao_customizada, nucleo, contratado_pelo_cliente")
            .in("proposta_id", propostaIds);

          const matchProposta = (itensProposta || []).some((item: any) => {
            const descricao = String(item?.descricao_customizada || item?.descricao || "");
            return ehArCondicionado(descricao);
          });

          if (matchProposta) return true;

          // Fallback: com proposta aprovada, garante exibiçÍo da linha de climatizaçÍo no onboarding.
          return true;
        }
      }
    } catch (error) {
      console.error("Erro ao verificar contrataçÍo de ar condicionado:", error);
    }

    return false;
  }, [clienteId, contratoId, oportunidadeId]);

  const incluirLinhaArCondicionado = useCallback(async (itensBase: EtapaItem[]) => {
    const jaExiste = itensBase.some((item) => ehArCondicionado(item.texto));
    if (jaExiste) return itensBase;

    const fechadoPeloCliente = await clienteFechouArCondicionado();
    if (!fechadoPeloCliente) return itensBase;

    const itemFinalizacao = itensBase.find((item) => normalizarTexto(item.texto).includes("finaliza"));
    const maiorOrdem = itensBase.reduce((max, item) => Math.max(max, Number(item.ordem || 0)), 0);
    const ordemAr = itemFinalizacao && Number(itemFinalizacao.ordem || 0) > 0
      ? Number(itemFinalizacao.ordem) - 0.01
      : maiorOrdem + 1;

    const itemAr: EtapaItem = {
      id: "virtual-ar-condicionado",
      texto: "Ar condicionado",
      concluido: false,
      percentual_concluido: 0,
      ordem: ordemAr,
      secao: itensBase[0]?.secao || "engenharia",
      data_inicio: null,
      data_termino: null,
    };

    return [...itensBase, itemAr].sort((a, b) => Number(a.ordem || 0) - Number(b.ordem || 0));
  }, [clienteFechouArCondicionado]);

  // FunçÍo para atualizar percentual de um item
  const atualizarPercentual = async (itemId: string, percentual: number) => {
    if (!podeEditar || !checklist) return;

    setAtualizando(itemId);
    try {
      let itemIdPersistido = itemId;
      if (itemId.startsWith("virtual-")) {
        const itemVirtual = checklist.itens.find((i) => i.id === itemId);
        if (!itemVirtual) {
          console.error("Item virtual não encontrado para persistir:", itemId);
          return;
        }

        const ordemMax = checklist.itens.reduce(
          (max, i) => Math.max(max, Number(i.ordem || 0)),
          0
        );
        const ordemPersistida = ordemMax + 1;

        const { data: novoItem, error: insertError } = await supabase
          .from("checklist_itens")
          .insert({
            checklist_id: checklist.id,
            texto: itemVirtual.texto,
            ordem: ordemPersistida,
            secao: itemVirtual.secao || "engenharia",
            concluido: false,
            percentual_concluido: 0,
          })
          .select("id")
          .single();

        if (insertError || !novoItem?.id) {
          console.error("Erro ao persistir item virtual de ar condicionado:", insertError);
          return;
        }

        itemIdPersistido = String(novoItem.id);
      }

      const concluido = percentual >= 100;
      const { error } = await supabase
        .from("checklist_itens")
        .update({
          percentual_concluido: percentual,
          concluido: concluido
        })
        .eq("id", itemIdPersistido);

      if (error) {
        console.error("Erro ao atualizar percentual:", error);
        return;
      }

      const novosItens = checklist.itens.map((i) =>
        i.id === itemId
          ? { ...i, id: itemIdPersistido, percentual_concluido: percentual, concluido }
          : i
      );
      const itemAtualizado = novosItens.find((i) => i.id === itemIdPersistido);

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

      if (itemAtualizado) {
        const tituloBase = extrairTituloDescricao(itemAtualizado.texto).titulo;
        await sincronizarOnboardingItemNoCronograma({
          contratoId,
          oportunidadeId,
          clienteId,
          nucleo: "engenharia",
          nucleoBusca: "engenh",
          itemId: itemAtualizado.id,
          itemTexto: tituloBase,
          ordem: itemAtualizado.ordem,
          percentual,
        });
      }

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
      let itemIdPersistido = itemId;
      if (itemId.startsWith("virtual-")) {
        const itemVirtual = checklist.itens.find((i) => i.id === itemId);
        if (!itemVirtual) {
          console.error("Item virtual não encontrado para persistir:", itemId);
          return;
        }

        const ordemMax = checklist.itens.reduce(
          (max, i) => Math.max(max, Number(i.ordem || 0)),
          0
        );
        const ordemPersistida = ordemMax + 1;

        const { data: novoItem, error: insertError } = await supabase
          .from("checklist_itens")
          .insert({
            checklist_id: checklist.id,
            texto: textoLimpo,
            ordem: ordemPersistida,
            secao: itemVirtual.secao || "engenharia",
            concluido: false,
            percentual_concluido: itemVirtual.percentual_concluido || 0,
          })
          .select("id")
          .single();

        if (insertError || !novoItem?.id) {
          console.error("Erro ao persistir item virtual para ediçÍo de texto:", insertError);
          return;
        }

        itemIdPersistido = String(novoItem.id);
      } else {
        const { error } = await supabase
          .from("checklist_itens")
          .update({ texto: textoLimpo })
          .eq("id", itemIdPersistido);

        if (error) {
          console.error("Erro ao atualizar texto do item:", error);
          return;
        }
      }

      const novosItens = checklist.itens.map((i) =>
        i.id === itemId ? { ...i, id: itemIdPersistido, texto: textoLimpo } : i
      );
      const itemAtualizado = novosItens.find((i) => i.id === itemIdPersistido);
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

      if (itemAtualizado) {
        const tituloBase = extrairTituloDescricao(itemAtualizado.texto).titulo;
        await sincronizarOnboardingItemNoCronograma({
          contratoId,
          oportunidadeId,
          clienteId,
          nucleo: "engenharia",
          nucleoBusca: "engenh",
          itemId: itemAtualizado.id,
          itemTexto: tituloBase,
          ordem: itemAtualizado.ordem,
          percentual: itemAtualizado.percentual_concluido || 0,
        });
      }

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
      if (!itemId.startsWith("virtual-")) {
        const { error } = await supabase
          .from("checklist_itens")
          .delete()
          .eq("id", itemId);

        if (error) {
          console.error("Erro ao excluir item:", error);
          return;
        }
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
        .ilike("titulo", "%onboarding%engenharia%");

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
        const itensBase = (data.checklist_itens || ([] as EtapaItem[])).sort(
          (a, b) => a.ordem - b.ordem
        ).map(item => ({
          ...item,
          percentual_concluido: item.percentual_concluido || (item.concluido ? 100 : 0),
          data_inicio: datasPorOrdem.get(item.ordem)?.data_inicio || null,
          data_termino: datasPorOrdem.get(item.ordem)?.data_termino || null,
        }));
        const itens = await incluirLinhaArCondicionado(itensBase);

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
        const primeiraIncompleta = itens.find((i) => !itemConcluido(i));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    titulo: 'Onboarding Engenharia',
    itens: [],
    progresso: 0,
  };

  const _itensNaoConcluidos = checklistExibir.itens.filter((i) => !itemConcluido(i)).length;
  const _totalItens = checklistExibir.itens.length;
  const etapaAtual =
    checklistExibir.itens.find((i) => {
      const percentual = i.percentual_concluido || 0;
      return percentual > 0 && percentual < 100;
    })?.ordem ||
    checklistExibir.itens.find((i) => !itemConcluido(i))?.ordem ||
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
              <HardHat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">Nenhuma etapa cadastrada</p>
              <p className="text-sm text-gray-400 mt-1">As etapas da obra serÍo exibidas aqui</p>
            </div>
          ) : null}

          {checklistExibir.itens.map((item) => {
            const isExpanded = expandedEtapa === item.ordem;
            const concluida = itemConcluido(item);
            const isCurrent = item.ordem === etapaAtual && !concluida;
            const isEditando = editandoPercentual === item.id;
            const isEditandoTexto = editandoTexto === item.id;
            const percentual = item.percentual_concluido || 0;

            return (
              <div
                key={item.id}
                className={`transition-colors ${
                  concluida
                    ? "bg-green-50"
                    : isCurrent
                    ? "bg-nucleo-engenharia/10"
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
                      } cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-nucleo-engenharia ${
                        atualizando === item.id ? "opacity-50 animate-pulse" : ""
                      }`}
                      title={`${percentual}% - Clique para ajustar`}
                    >
                      {atualizando === item.id ? (
                        <Clock className="w-5 h-5 animate-spin" />
                      ) : concluida ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : percentual > 0 ? (
                        <span className="text-[11px] font-normal">{percentual}%</span>
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
                      {concluida ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : percentual > 0 ? (
                        <span className="text-[11px] font-normal">{percentual}%</span>
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
                          concluida
                            ? "text-green-700"
                            : isCurrent
                            ? "text-nucleo-engenharia"
                            : "text-gray-700"
                        }`}
                      >
                        {extrairTituloDescricao(item.texto).titulo}
                      </span>
                      {concluida && (
                        <Badge className="bg-green-500 text-white text-xs shrink-0">
                          Concluído
                        </Badge>
                      )}
                      {!concluida && percentual > 0 && (
                        <Badge className="bg-orange-500 text-white text-xs shrink-0">
                          {percentual}%
                        </Badge>
                      )}
                      {isCurrent && percentual === 0 && (
                        <Badge className="bg-nucleo-engenharia text-white text-xs shrink-0">
                          Em execuçÍo
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
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-nucleo-engenharia hover:bg-nucleo-engenharia/10 disabled:opacity-50"
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
                    <div className="p-4 rounded-lg bg-white border-2 border-nucleo-engenharia shadow-lg">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-sm font-medium text-gray-700">
                          Ajustar progresso: <span className="text-nucleo-engenharia font-bold">{percentualTemp}%</span>
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
                          className="flex-1 bg-nucleo-engenharia hover:bg-nucleo-engenharia/90"
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
                    <div className="p-4 rounded-lg bg-white border-2 border-nucleo-engenharia shadow-lg">
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
                        className="w-full h-9 rounded-md border border-gray-300 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nucleo-engenharia"
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
                          className="flex-1 bg-nucleo-engenharia hover:bg-nucleo-engenharia/90"
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
                        concluida
                          ? "bg-green-100 border border-green-200"
                          : isCurrent
                          ? "bg-nucleo-engenharia/10 border border-nucleo-engenharia/20"
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

      <div className="px-4 py-3 bg-nucleo-engenharia/10 border-t border-nucleo-engenharia/20">
        <p className="text-xs text-nucleo-engenharia">
          👷 <strong>Importante:</strong> Cada etapa concluída passa por vistoria
          de qualidade. Você será notificado sobre o progresso da sua obra.
        </p>
      </div>
    </Card>
  );
}


