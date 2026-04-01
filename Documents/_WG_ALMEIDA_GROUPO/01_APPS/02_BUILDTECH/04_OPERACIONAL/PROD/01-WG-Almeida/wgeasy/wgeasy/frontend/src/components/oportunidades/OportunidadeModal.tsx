/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// COMPONENTE: OportunidadeModal (PadrÍo WG Easy)
// Usado no Kanban e futuramente na Lista
// ============================================================

import React, { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { type Estagio } from "@/constants/oportunidades";
import OportunidadeCard, {
  OportunidadeUI,
} from "@/components/oportunidades/OportunidadeCard";
import { gerarPdfOportunidade } from "@/utils/gerarPdfOportunidade";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Trash2 } from "lucide-react";
import CardChecklist from "@/components/checklist/CardChecklist";
import OportunidadeArquivos from "@/components/oportunidades/OportunidadeArquivos";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { criarNotaComChecklistOportunidade } from "@/lib/notasSistemaApi";
import { sincronizarChecklistOportunidadeNoCronograma } from "@/lib/checklistCronogramaIntegration";

type OportunidadeModalProps = {
  oportunidade: any;
  onClose: () => void;
  onUpdated?: () => void;
  onChangeStage?: (id: string, novo: Estagio) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  showDates?: boolean;
};

export function OportunidadeModal({
  oportunidade,
  onClose,
  onUpdated,
  onChangeStage,
  onDelete,
  showDates = true,
}: Readonly<OportunidadeModalProps>) {
  const { toast } = useToast();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [notaClienteCriada, setNotaClienteCriada] = useState(false);
  const [criandoNota, setCriandoNota] = useState(false);
  const [sincronizandoChecklistId, setSincronizandoChecklistId] = useState<string | null>(null);
  const [cronogramaResultadoPorChecklist, setCronogramaResultadoPorChecklist] = useState<Record<string, {
    tarefas_criadas: number;
    tarefas_existentes: number;
  }>>({});

  const clienteNormalizado =
    oportunidade.cliente ?? oportunidade.clientes ?? null;

  // Normalizar os dados no formato UI
  const initialOp: OportunidadeUI = {
    id: oportunidade.id,
    titulo: oportunidade.titulo,
    estagio: oportunidade.estagio,
    valor_estimado: oportunidade.valor_estimado,
    previsao_fechamento: oportunidade.previsao_fechamento ?? oportunidade.data_previsao_fechamento,
    origem: oportunidade.origem,
    descricao: oportunidade.descricao,
    observacoes: oportunidade.observacoes,
    cliente: clienteNormalizado,
    nucleos: oportunidade.nucleos,
    data_fechamento: oportunidade.data_fechamento,
    data_inicio_projeto: oportunidade.data_inicio_projeto,
    prazo_briefing: oportunidade.prazo_briefing,
    prazo_anteprojeto: oportunidade.prazo_anteprojeto,
    prazo_projeto_executivo: oportunidade.prazo_projeto_executivo,
    data_liberacao_obra: oportunidade.data_liberacao_obra,
    data_inicio_obra: oportunidade.data_inicio_obra,
    prazo_obra_dias_uteis: oportunidade.prazo_obra_dias_uteis,
    prazo_entrega: oportunidade.prazo_entrega,
    data_medicao: oportunidade.data_medicao,
    prazo_executivo: oportunidade.prazo_executivo,
    data_assinatura_executivo: oportunidade.data_assinatura_executivo,
  };
  const [opState, setOpState] = useState<OportunidadeUI>(initialOp);
  const nucleoPrincipal = (opState.nucleos?.[0]?.nucleo || "").toLowerCase();

  useEffect(() => {
    setOpState(initialOp);
  }, [oportunidade.id]);

  function addBusinessDays(startDate: string, days: number): string {
    if (!startDate || Number.isNaN(days)) return "";
    const date = new Date(startDate);
    let added = 0;
    while (added < days) {
      date.setDate(date.getDate() + 1);
      const day = date.getDay();
      if (day !== 0 && day !== 6) {
        added += 1;
      }
    }
    return date.toISOString().slice(0, 10);
  }

  async function updateOportunidadeFields(fields: Partial<OportunidadeUI>) {
    setOpState((prev) => ({ ...prev, ...fields }));

    // Se é um contrato (ID com prefixo "contrato-"), não atualizar na tabela oportunidades
    if (oportunidade.id.startsWith("contrato-")) {
      console.log("Item é um contrato, atualizações de oportunidade não aplicáveis.");
      return;
    }

    const { error } = await supabase
      .from("oportunidades")
      .update(fields)
      .eq("id", oportunidade.id);

    if (error) {
      console.error("Erro ao atualizar oportunidade:", error);
      toast({ variant: "destructive", title: "Erro ao atualizar oportunidade", description: error.message });
    }
  }

  const [prazoDraft, setPrazoDraft] = useState<Partial<OportunidadeUI>>(initialOp);

  useEffect(() => {
    setPrazoDraft(initialOp);
  }, [oportunidade.id]);

  function applyPrazoChange(field: keyof OportunidadeUI, value: string | number | null) {
    setPrazoDraft((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function computeDerivedFields(draft: Partial<OportunidadeUI>): Partial<OportunidadeUI> {
    const updates: Partial<OportunidadeUI> = {};
    const nucleo = nucleoPrincipal;
    const dataFechamento = draft.data_fechamento || draft.previsao_fechamento || "";

    if (nucleo === "engenharia") {
      const dataInicioObra = draft.data_inicio_obra || "";
      const prazoObraDias = Number(draft.prazo_obra_dias_uteis || 0);
      if (dataInicioObra && prazoObraDias > 0) {
        updates.prazo_entrega = addBusinessDays(dataInicioObra, prazoObraDias);
      }
    }

    if (nucleo === "arquitetura") {
      if (dataFechamento) {
        updates.prazo_briefing = addBusinessDays(dataFechamento, 10);
      }
      if (draft.prazo_briefing) {
        updates.prazo_anteprojeto = addBusinessDays(draft.prazo_briefing, 10);
      }
      if (draft.prazo_anteprojeto) {
        updates.prazo_projeto_executivo = addBusinessDays(draft.prazo_anteprojeto, 20);
      }
    }

    return updates;
  }

  async function handleSavePrazos() {
    const derived = computeDerivedFields(prazoDraft);
    const payload: Partial<OportunidadeUI> = {
      data_fechamento: prazoDraft.data_fechamento || null,
      data_inicio_projeto: prazoDraft.data_inicio_projeto || null,
      prazo_briefing: prazoDraft.prazo_briefing || null,
      prazo_anteprojeto: prazoDraft.prazo_anteprojeto || null,
      prazo_projeto_executivo: prazoDraft.prazo_projeto_executivo || null,
      data_liberacao_obra: prazoDraft.data_liberacao_obra || null,
      data_inicio_obra: prazoDraft.data_inicio_obra || null,
      prazo_obra_dias_uteis: prazoDraft.prazo_obra_dias_uteis ?? null,
      prazo_entrega: prazoDraft.prazo_entrega || null,
      data_medicao: prazoDraft.data_medicao || null,
      prazo_executivo: prazoDraft.prazo_executivo || null,
      data_assinatura_executivo: prazoDraft.data_assinatura_executivo || null,
      ...derived,
    };
    await updateOportunidadeFields(payload);
    setPrazoDraft((prev) => ({ ...prev, ...payload }));
    await syncCronogramaFromOportunidade({ ...opState, ...payload });
  }

  async function syncCronogramaFromOportunidade(data: OportunidadeUI) {
    // Se é um contrato (ID com prefixo "contrato-"), não sincronizar cronograma via oportunidade
    if (data.id.startsWith("contrato-")) {
      console.log("Item é um contrato, sincronizaçÍo de cronograma não aplicável.");
      return;
    }

    const nucleo = (data.nucleos?.[0]?.nucleo || "").toLowerCase();
    if (!nucleo) return;
    const clienteId = data.cliente?.id;
    if (!clienteId) return;

    // Buscar contrato ligado à oportunidade (se existir)
    const { data: contrato } = await supabase
      .from("contratos")
      .select("id, numero, titulo")
      .eq("oportunidade_id", data.id)
      .maybeSingle();

    // Buscar projeto existente
    let projetoId: string | null = null;
    if (contrato?.id) {
      const { data: projetoExistente } = await supabase
        .from("projetos")
        .select("id")
        .eq("contrato_id", contrato.id)
        .maybeSingle();
      projetoId = projetoExistente?.id || null;
    }

    if (!projetoId) {
      const { data: projetoExistente } = await supabase
        .from("projetos")
        .select("id")
        .eq("cliente_id", clienteId)
        .eq("nucleo", nucleo)
        .eq("nome", data.titulo)
        .maybeSingle();
      projetoId = projetoExistente?.id || null;
    }

    // Criar projeto se não existir
    if (!projetoId) {
      const { data: projetoCriado } = await supabase
        .from("projetos")
        .insert({
          nome: data.titulo,
          descricao: data.descricao || `Projeto gerado da oportunidade ${data.titulo}`,
          cliente_id: clienteId,
          contrato_id: contrato?.id || null,
          nucleo,
          data_inicio: data.data_inicio_projeto || data.data_inicio_obra || data.data_medicao || data.data_fechamento || null,
          data_termino: data.prazo_projeto_executivo || data.prazo_entrega || data.data_assinatura_executivo || null,
          status: "em_andamento",
          progresso: 0,
        })
        .select()
        .single();
      projetoId = projetoCriado?.id || null;
    }

    if (!projetoId) return;

    // Atualizar datas principais do projeto
    const dataInicioProjeto =
      data.data_inicio_projeto || data.data_inicio_obra || data.data_medicao || data.data_fechamento || null;
    const dataFimProjeto =
      data.prazo_projeto_executivo || data.prazo_entrega || data.data_assinatura_executivo || null;

    await supabase
      .from("projetos")
      .update({
        data_inicio: dataInicioProjeto,
        data_termino: dataFimProjeto,
      })
      .eq("id", projetoId);

    const milestones =
      nucleo === "engenharia"
        ? [
            { titulo: "Fechamento", data: data.data_fechamento },
            { titulo: "LiberaçÍo da Obra", data: data.data_liberacao_obra },
            { titulo: "Início da Obra", data: data.data_inicio_obra },
            { titulo: "Entrega", data: data.prazo_entrega },
          ]
        : nucleo === "arquitetura"
        ? [
            { titulo: "Fechamento", data: data.data_fechamento },
            { titulo: "Início do Projeto", data: data.data_inicio_projeto },
            { titulo: "Briefing / Estudo Preliminar", data: data.prazo_briefing },
            { titulo: "Anteprojeto", data: data.prazo_anteprojeto },
            { titulo: "Projeto Executivo", data: data.prazo_projeto_executivo },
          ]
        : [
            { titulo: "Fechamento", data: data.data_fechamento },
            { titulo: "MediçÍo", data: data.data_medicao },
            { titulo: "Executivo", data: data.prazo_executivo },
            { titulo: "Assinatura do Executivo", data: data.data_assinatura_executivo },
          ];

    const { data: tarefasExistentes } = await supabase
      .from("cronograma_tarefas")
      .select("id, titulo")
      .eq("projeto_id", projetoId);

    const existentesMap = new Map((tarefasExistentes || []).map((t: any) => [t.titulo, t.id]));

    for (const m of milestones) {
      if (!m.data) continue;
      const payloadTarefa = {
        projeto_id: projetoId,
        titulo: m.titulo,
        descricao: m.titulo,
        nucleo,
        data_inicio: m.data,
        data_termino: m.data,
        status: "pendente",
        progresso: 0,
      };
      const existenteId = existentesMap.get(m.titulo);
      if (existenteId) {
        await supabase.from("cronograma_tarefas").update({
          data_inicio: m.data,
          data_termino: m.data,
        }).eq("id", existenteId);
      } else {
        await supabase.from("cronograma_tarefas").insert(payloadTarefa);
      }
    }
  }

  async function handleStageChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const novo = e.target.value as Estagio;
    if (onChangeStage) {
      await onChangeStage(opState.id, novo);
      onUpdated?.();
    }
  }

  async function handleDeleteConfirm() {
    if (onDelete) {
      await onDelete(opState.id);
      onClose();
    }
    setShowDeleteConfirm(false);
  }

  async function handleCriarNotaCliente() {
    if (!opState.cliente?.id) return;
    setCriandoNota(true);
    try {
      const resultado = await criarNotaComChecklistOportunidade(
        opState.id,
        opState.cliente.id,
        opState.titulo
      );
      if (resultado) {
        setNotaClienteCriada(true);
      }
    } catch (err) {
      console.error("Erro ao criar nota:", err);
    } finally {
      setCriandoNota(false);
    }
  }

  async function handleSincronizarCronograma(checklistId: string) {
    if (!opState.cliente?.id) return;
    setSincronizandoChecklistId(checklistId);
    try {
      const resultado = await sincronizarChecklistOportunidadeNoCronograma({
        oportunidadeId: opState.id,
        tituloOportunidade: opState.titulo,
        clienteId: opState.cliente.id,
        nucleo: nucleoPrincipal || "engenharia",
        checklistId,
      });
      setCronogramaResultadoPorChecklist((prev) => ({
        ...prev,
        [checklistId]: {
          tarefas_criadas: resultado.tarefas_criadas,
          tarefas_existentes: resultado.tarefas_existentes,
        },
      }));
    } catch (err) {
      console.error("Erro ao sincronizar cronograma:", err);
    } finally {
      setSincronizandoChecklistId(null);
    }
  }


  function DateInput({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: string | null;
    onChange: (value: string) => void;
  }) {
    const normalizedValue = value ? value.slice(0, 10) : "";
    const [draftValue, setDraftValue] = useState(normalizedValue);

    useEffect(() => {
      setDraftValue(normalizedValue);
    }, [normalizedValue]);

    function commitValue() {
      if (draftValue === normalizedValue) return;
      onChange(draftValue);
    }

    return (
      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-gray-500 font-normal">{label}</span>
        <input
          type="date"
          value={draftValue}
          onChange={(event) => setDraftValue(event.target.value)}
          onBlur={commitValue}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commitValue();
            }
          }}
          className="h-[20px] text-[10px] font-normal text-gray-700 border border-gray-200 rounded px-1.5 py-0 focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
        />
      </label>
    );
  }

  function NumberInput({
    label,
    value,
    onChange,
  }: {
    label: string;
    value?: number | null;
    onChange: (value: number | null) => void;
  }) {
    return (
      <label className="flex flex-col gap-1">
        <span className="text-[9px] text-gray-500 font-normal">{label}</span>
        <input
          type="number"
          min={0}
          value={value ?? ""}
          onChange={(event) =>
            onChange(event.target.value === "" ? null : Number(event.target.value))
          }
          className="h-[20px] text-[10px] font-normal text-gray-700 border border-gray-200 rounded px-1.5 py-0 focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
        />
      </label>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b bg-gray-50">
          <div className="flex-1">
            <h2 className="text-sm font-normal text-gray-900">
              Detalhes da Oportunidade
            </h2>
            <p className="text-xs text-gray-500">{opState.titulo}</p>
          </div>

          <div className="flex items-center gap-2">
            {onDelete && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Excluir oportunidade"
              >
                <Trash2 size={16} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
            >
              Fechar
            </button>
          </div>
        </div>

        {/* SCROLL CONTENT */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="space-y-3">
              {/* Card Principal */}
              <OportunidadeCard
                oportunidade={opState}
                mode="list"
                onPdf={() =>
                  gerarPdfOportunidade({
                    oportunidade: opState as any,
                    cliente: (opState.cliente || {}) as Record<string, unknown>,
                  })
                }
              />

              {showDates && (
                <div className="bg-white border rounded-xl p-4 text-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs text-gray-500">Prazos e Datas</div>
                    <button
                      type="button"
                      onClick={handleSavePrazos}
                      className="px-3 py-1 text-xs rounded border hover:bg-gray-100"
                    >
                      Salvar
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {nucleoPrincipal === "engenharia" && (
                      <div className="col-span-full grid grid-cols-5 gap-3">
                        <DateInput
                          label="Fechamento"
                          value={prazoDraft.data_fechamento || prazoDraft.previsao_fechamento}
                          onChange={(value) => applyPrazoChange("data_fechamento", value)}
                        />
                        <DateInput
                          label="LiberaçÍo"
                          value={prazoDraft.data_liberacao_obra}
                          onChange={(value) => applyPrazoChange("data_liberacao_obra", value)}
                        />
                        <DateInput
                          label="Início Obra"
                          value={prazoDraft.data_inicio_obra}
                          onChange={(value) => applyPrazoChange("data_inicio_obra", value)}
                        />
                        <NumberInput
                          label="Prazo (dias)"
                          value={prazoDraft.prazo_obra_dias_uteis}
                          onChange={(value) => applyPrazoChange("prazo_obra_dias_uteis", value)}
                        />
                        <DateInput
                          label="Entrega"
                          value={prazoDraft.prazo_entrega}
                          onChange={(value) => applyPrazoChange("prazo_entrega", value)}
                        />
                      </div>
                    )}

                    {nucleoPrincipal === "arquitetura" && (
                      <div className="col-span-full grid grid-cols-5 gap-3">
                        <DateInput
                          label="Fechamento"
                          value={prazoDraft.data_fechamento || prazoDraft.previsao_fechamento}
                          onChange={(value) => applyPrazoChange("data_fechamento", value)}
                        />
                        <DateInput
                          label="Início Projeto"
                          value={prazoDraft.data_inicio_projeto}
                          onChange={(value) => applyPrazoChange("data_inicio_projeto", value)}
                        />
                        <DateInput
                          label="Briefing"
                          value={prazoDraft.prazo_briefing}
                          onChange={(value) => applyPrazoChange("prazo_briefing", value)}
                        />
                        <DateInput
                          label="Anteprojeto"
                          value={prazoDraft.prazo_anteprojeto}
                          onChange={(value) => applyPrazoChange("prazo_anteprojeto", value)}
                        />
                        <DateInput
                          label="Executivo"
                          value={prazoDraft.prazo_projeto_executivo}
                          onChange={(value) => applyPrazoChange("prazo_projeto_executivo", value)}
                        />
                      </div>
                    )}

                    {nucleoPrincipal === "marcenaria" && (
                      <div className="col-span-full grid grid-cols-4 gap-3">
                        <DateInput
                          label="Fechamento"
                          value={prazoDraft.data_fechamento || prazoDraft.previsao_fechamento}
                          onChange={(value) => applyPrazoChange("data_fechamento", value)}
                        />
                        <DateInput
                          label="MediçÍo"
                          value={prazoDraft.data_medicao}
                          onChange={(value) => applyPrazoChange("data_medicao", value)}
                        />
                        <DateInput
                          label="Executivo"
                          value={prazoDraft.prazo_executivo}
                          onChange={(value) => applyPrazoChange("prazo_executivo", value)}
                        />
                        <DateInput
                          label="Assinatura"
                          value={prazoDraft.data_assinatura_executivo}
                          onChange={(value) => applyPrazoChange("data_assinatura_executivo", value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Observações */}
              {opState.observacoes && (
                <div className="bg-white border rounded-xl p-4 text-sm">
                  <div className="text-xs text-gray-500 mb-1">Observações</div>
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {opState.observacoes}
                  </p>
                </div>
              )}

              {/* ─── LIZ INTEGRATION — 2026-03-28 ─────────────────────── */}
              {(opState.pipeline_status || opState.briefing_texto || opState.projeto_path) && (
                <div className="bg-white border rounded-xl p-4 space-y-3">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Liz — Pipeline & Briefing
                  </div>

                  {/* Pipeline Status */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-24">Pipeline</span>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      opState.pipeline_status === 'lead_novo'   ? 'bg-blue-50 text-blue-700' :
                      opState.pipeline_status === 'briefing'    ? 'bg-indigo-50 text-indigo-700' :
                      opState.pipeline_status === 'em_proposta' ? 'bg-yellow-50 text-yellow-700' :
                      opState.pipeline_status === 'negociacao'  ? 'bg-orange-50 text-orange-700' :
                      opState.pipeline_status === 'fechamento'  ? 'bg-green-50 text-green-700' :
                      opState.pipeline_status === 'perdido'     ? 'bg-red-50 text-red-700' :
                      'bg-gray-50 text-gray-600'
                    }`}>
                      {{
                        lead_novo:   '🔵 Lead Novo',
                        briefing:    '📋 Briefing',
                        em_proposta: '📤 Em Proposta',
                        negociacao:  '🤝 NegociaçÍo',
                        fechamento:  '✅ Fechamento',
                        perdido:     '❌ Perdido',
                      }[opState.pipeline_status as string] ?? opState.pipeline_status}
                    </span>
                  </div>

                  {/* Briefing gerado pela Liz */}
                  {opState.briefing_texto && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Briefing (Liz)</div>
                      <div className="p-3 bg-blue-50 rounded-lg text-xs text-gray-700 whitespace-pre-wrap max-h-40 overflow-y-auto">
                        {opState.briefing_texto}
                      </div>
                    </div>
                  )}

                  {/* Pasta do projeto */}
                  {opState.projeto_path && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Pasta do Projeto</div>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1 truncate">
                          {opState.projeto_path}
                        </code>
                        {opState.projeto_tipo && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            {opState.projeto_tipo}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Motivo da perda */}
                  {opState.pipeline_status === 'perdido' && opState.motivo_perda && (
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Motivo da perda</div>
                      <div className="p-2 bg-red-50 rounded text-xs text-red-700">
                        {opState.motivo_perda}
                      </div>
                    </div>
                  )}
                </div>
              )}
              {/* ─────────────────────────────────────────────────────── */}

              {/* CHECKLISTS */}
              <div className="bg-white border rounded-xl p-4 space-y-4">
                <CardChecklist
                  oportunidadeId={opState.id}
                  nucleo={nucleoPrincipal}
                  onCriarNotaJornada={handleCriarNotaCliente}
                  onCronogramaChecklist={handleSincronizarCronograma}
                  cronogramaChecklistLoadingId={sincronizandoChecklistId}
                  cronogramaResultadoPorChecklist={cronogramaResultadoPorChecklist}
                  desabilitarCronogramaChecklist={!opState.cliente?.id}
                />
                <div className="border-t pt-3">
                  {criandoNota && (
                    <p className="text-xs text-gray-500">Atualizando nota da jornada...</p>
                  )}
                  {notaClienteCriada && !criandoNota && (
                    <p className="text-xs text-green-600">
                      Nota da jornada sincronizada para a área do cliente.
                    </p>
                  )}
                  {!opState.cliente?.id && (
                    <p className="text-xs text-amber-600">
                      Oportunidade sem cliente vinculado.
                    </p>
                  )}
                </div>
              </div>

              {/* ARQUIVOS E DOCUMENTOS */}
              <div className="bg-white border rounded-xl p-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-normal text-gray-800">
                    Arquivos e Documentos
                  </h3>
                  <span className="text-[10px] text-gray-400">
                    Plantas, fotos, docs
                  </span>
                </div>
                <OportunidadeArquivos
                  oportunidadeId={opState.id}
                  clienteNome={
                    opState.cliente?.nome || opState.cliente?.razao_social || "Cliente"
                  }
                />
              </div>
          </div>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÍO DE EXCLUSÍO */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Remover Oportunidade deste Núcleo?"
        message={`Deseja remover a oportunidade "${opState.titulo}" deste núcleo? A oportunidade continuará disponível nos outros núcleos.`}
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        type="warning"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */


