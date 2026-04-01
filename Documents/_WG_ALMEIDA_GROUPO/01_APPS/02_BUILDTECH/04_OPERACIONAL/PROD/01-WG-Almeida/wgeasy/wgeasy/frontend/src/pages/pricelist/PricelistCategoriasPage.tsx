/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Gerenciamento de Categorias de Pricelist
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  listarCategorias,
  listarAmbientesPricelist,
  criarCategoria,
  atualizarCategoria,
  deletarCategoria,
  salvarAmbientesCategoria,
  salvarGuiasCategoria,
  salvarFluxoCategoriaBackend,
  autoMapearCategoriasEVF,
  atualizarEvfCategoriaMapping,
  type PricelistAmbiente,
  type PricelistCategoria,
  type PricelistCategoriaFormData,
} from "@/lib/pricelistApi";
import { buscarCategoriasConfig } from "@/lib/evfApi";
import type { EVFCategoriaConfig, TipoCategoria } from "@/types/evf";
import { FASES_EVF } from "@/types/evf";
import GuiasReordenaveis from "@/components/GuiasReordenaveis";
import { obterDiagnosticoPricelistMaoObra, type DiagnosticoPricelistMaoObra } from "@/lib/apiSecure";
import {
  FLOW_RESOURCE_LABELS,
  FlowResourceKey,
  PricelistTaskFlow,
  getTipoItemLabel,
  getTipoItemColor,
} from "@/types/pricelist";
import { PRICELIST_CATEGORY_FLOWS, EVF_CATEGORIA_TO_FLOW } from "@/lib/pricelistCategoryFlows";
import { getCorCategoria } from "@/config/categoriasConfig";

export default function PricelistCategoriasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState<PricelistCategoria | null>(null);
  const [errosCodigo, setErrosCodigo] = useState<string>("");
  const [diagnostico, setDiagnostico] = useState<DiagnosticoPricelistMaoObra | null>(null);
  const [diagnosticoLoading, setDiagnosticoLoading] = useState(false);
  const [diagnosticoError, setDiagnosticoError] = useState("");
  const [ambientes, setAmbientes] = useState<PricelistAmbiente[]>([]);
  const [evfCategorias, setEvfCategorias] = useState<EVFCategoriaConfig[]>([]);
  const [autoMapeando, setAutoMapeando] = useState(false);
  const tipoServicoOpcoes = [
    "DemoliçÍo",
    "Revestimento",
    "InstalaçÍo",
    "Acabamento",
    "Hidrosanitária",
    "Infra",
    "Serviços Gerais",
    "Insumos",
  ];

  const [formData, setFormData] = useState<PricelistCategoriaFormData>({
    nome: "",
    codigo: "",
    tipo: "material",
    descricao: "",
    ativo: true,
    tipo_servico: "",
    guia_principal: "",
    tags: [],
    guias: [],
    ambientes: [],
    aplicacao_obra: "ambos",
  });

  const referenceFlows = [
    PRICELIST_CATEGORY_FLOWS.pontoTomada,
    PRICELIST_CATEGORY_FLOWS.pintura,
    PRICELIST_CATEGORY_FLOWS.cortinasPersianas,
    PRICELIST_CATEGORY_FLOWS.moveisConvencionais,
  ];

  const getResourceLabel = (key: FlowResourceKey) => FLOW_RESOURCE_LABELS[key] || key;

  const renderTaskResources = (task: PricelistTaskFlow) => {
    const entries = Object.entries(task.recursos || {}).filter(
      ([, value]) => typeof value === "string" && value.trim().length > 0
    );

    if (entries.length === 0) return null;

    return (
      <dl className="grid grid-cols-2 gap-2 text-[12px] text-gray-600">
        {entries.map(([key, value]) => (
          <div key={`${task.id}-${key}`} className="flex gap-1">
            <span className="font-semibold text-gray-800">{getResourceLabel(key as FlowResourceKey)}:</span>
            <span>{value}</span>
          </div>
        ))}
      </dl>
    );
  };

  const chooseFlowIdForCategory = (nome?: string, codigo?: string) => {
    // Normalizar nome para código EVF (ex: "Cortinas e Persianas" → "cortinas_e_persianas")
    const normalizado = (nome || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()
      .replace(/&/g, "_e_")
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "")
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");

    // 1. Match direto no mapeamento EVF → Flow
    if (normalizado && EVF_CATEGORIA_TO_FLOW[normalizado]) {
      return EVF_CATEGORIA_TO_FLOW[normalizado];
    }

    // 2. Tentar match parcial (nome contém chave do mapeamento)
    for (const [evfKey, flowKey] of Object.entries(EVF_CATEGORIA_TO_FLOW)) {
      if (normalizado.includes(evfKey) || evfKey.includes(normalizado)) {
        return flowKey;
      }
    }

    // 3. Fallback por código curto (ex: "CTP" → busca no CATEGORIAS_CONFIG)
    const codigoNorm = (codigo || "").toLowerCase();
    if (codigoNorm === "ctp") return "cortinasPersianas";
    if (codigoNorm === "mvc") return "moveisConvencionais";

    return null;
  };

  const persistFlow = async (
    categoriaId: string,
    nome?: string,
    codigo?: string
  ) => {
    const flowId = chooseFlowIdForCategory(nome, codigo);
    if (!flowId) {
      return;
    }

    const fluxo = PRICELIST_CATEGORY_FLOWS[flowId];
    if (!fluxo) {
      return;
    }

    try {
      await salvarFluxoCategoriaBackend(
        categoriaId,
        flowId,
        fluxo as unknown as Record<string, unknown>
      );
    } catch (error: unknown) {
      console.warn("NÍo foi possível persistir o fluxo da categoria:", error);
    }
  };

  const carregarCategorias = useCallback(async () => {
    try {
      setLoading(true);
      const data = await listarCategorias();
      setCategorias(data);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
      toast({ title: "Erro", description: "Erro ao carregar categorias", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, []);

  const carregarAmbientes = useCallback(async () => {
    try {
      const data = await listarAmbientesPricelist();
      setAmbientes(data);
    } catch (error) {
      console.error("Erro ao carregar ambientes:", error);
    }
  }, []);

  const carregarEvfCategorias = useCallback(async () => {
    try {
      const data = await buscarCategoriasConfig();
      setEvfCategorias(data);
    } catch (error) {
      console.error("Erro ao carregar categorias EVF:", error);
    }
  }, []);

  const handleAutoMapear = useCallback(async () => {
    try {
      setAutoMapeando(true);
      const resultado = await autoMapearCategoriasEVF();
      toast({ title: "Auto-mapeamento concluído", description: `${resultado.mapeadas} categorias mapeadas de ${resultado.total} total.` });
      await carregarCategorias();
    } catch (error) {
      console.error("Erro ao auto-mapear:", error);
      toast({ title: "Erro", description: "Erro ao auto-mapear categorias", variant: "destructive" });
    } finally {
      setAutoMapeando(false);
    }
  }, [carregarCategorias]);

  const handleEvfMappingChange = useCallback(async (categoriaId: string, evfCodigo: string | null) => {
    try {
      await atualizarEvfCategoriaMapping(categoriaId, evfCodigo);
      setCategorias((prev) =>
        prev.map((cat) =>
          cat.id === categoriaId ? { ...cat, evf_categoria_codigo: evfCodigo } : cat
        )
      );
    } catch (error) {
      console.error("Erro ao atualizar mapeamento EVF:", error);
      toast({ title: "Erro", description: "Erro ao atualizar mapeamento EVF", variant: "destructive" });
    }
  }, []);

  const carregarDiagnostico = useCallback(async () => {
    try {
      setDiagnosticoLoading(true);
      setDiagnosticoError("");
      const data = await obterDiagnosticoPricelistMaoObra();
      setDiagnostico(data);
    } catch (error: unknown) {
      console.error("Erro ao carregar diagnóstico:", error);
      const mensagemErro = error instanceof Error ? error.message : String(error);
      setDiagnosticoError(mensagemErro || "NÍo foi possível carregar o diagnóstico.");
    } finally {
      setDiagnosticoLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarCategorias();
    carregarDiagnostico();
    carregarAmbientes();
    carregarEvfCategorias();
  }, [carregarCategorias, carregarDiagnostico, carregarAmbientes, carregarEvfCategorias]);

  function abrirModal(categoria?: PricelistCategoria) {
    if (categoria) {
      setEditando(categoria);
      setFormData({
        nome: categoria.nome,
        codigo: categoria.codigo || "",
        tipo: categoria.tipo || "material",
        descricao: categoria.descricao || "",
        ativo: categoria.ativo,
        tipo_servico: categoria.tipo_servico || "",
        guia_principal: categoria.guia_principal || "",
        tags: categoria.tags || [],
        guias: categoria.guias || [],
        ambientes: categoria.ambientes?.map((amb) => amb.id) || [],
        aplicacao_obra: categoria.aplicacao_obra ?? "ambos",
      });
    } else {
      setEditando(null);
      setFormData({
        nome: "",
        codigo: "",
        tipo: "material",
        descricao: "",
        ativo: true,
        tipo_servico: "",
        guia_principal: "",
        tags: [],
        guias: [],
        ambientes: [],
      });
    }
    setErrosCodigo("");
    setShowModal(true);
  }

  function fecharModal() {
    setShowModal(false);
    setEditando(null);
    setErrosCodigo("");
  }

  // ValidaçÍo prévia: verificar se código já existe
  function validarCodigoDuplicado(): boolean {
    if (!formData.codigo) return true; // Código vazio é permitido
    const codigoNormalizado = formData.codigo.toUpperCase();

    const codigoExistente = categorias.find(
      (cat) => cat.codigo?.toUpperCase() === codigoNormalizado && cat.id !== editando?.id
    );

    if (codigoExistente) {
      setErrosCodigo(`Código "${formData.codigo}" já está em uso pela categoria "${codigoExistente.nome}"`);
      return false;
    }

    setErrosCodigo("");
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // ValidaçÍo prévia
    if (!validarCodigoDuplicado()) {
      return;
    }

    try {
      const payload: PricelistCategoriaFormData = {
        ...formData,
        tags: formData.tags || [],
        guias: formData.guias || [],
      };

      if (editando) {
        await atualizarCategoria(editando.id, payload);
        await Promise.all([
          salvarAmbientesCategoria(editando.id, formData.ambientes || []),
          salvarGuiasCategoria(editando.id, formData.guias || []),
        ]);
        toast({ title: "Sucesso", description: "Categoria atualizada com sucesso!" });
      } else {
        const nova = await criarCategoria(payload);
        if (nova?.id) {
          await Promise.all([
            salvarAmbientesCategoria(nova.id, formData.ambientes || []),
            salvarGuiasCategoria(nova.id, formData.guias || []),
          ]);
        }
        toast({ title: "Sucesso", description: "Categoria criada com sucesso!" });
      }
      fecharModal();
      carregarCategorias();
    } catch (error: unknown) {
      console.error("Erro ao salvar categoria:", error);

      // Traduzir erros do banco de dados
      const mensagemErro = error instanceof Error ? error.message : String(error);
      if (mensagemErro.includes("duplicate key")) {
        setErrosCodigo("Este código já está em uso por outra categoria");
        return;
      }

      toast({ title: "Erro", description: `Erro ao salvar categoria: ${mensagemErro}`, variant: "destructive" });
    }
  }

  async function handleDeletar(id: string) {
    if (!confirm("Tem certeza que deseja deletar esta categoria?")) return;

    try {
      await deletarCategoria(id);
      toast({ title: "Sucesso", description: "Categoria deletada com sucesso!" });
      carregarCategorias();
    } catch (error: unknown) {
      console.error("Erro ao deletar categoria:", error);
      const mensagemErro = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: `Erro ao deletar categoria: ${mensagemErro}`, variant: "destructive" });
    }
  }

  function handleListInputChange(field: "tags" | "guias", value: string) {
    const parsed = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    setFormData((prev) => ({ ...prev, [field]: parsed }));
  }

  function toggleAmbienteSelecionado(id: string) {
    setFormData((prev) => {
      const listaAtual = prev.ambientes || [];
      const existe = listaAtual.includes(id);
      const atualizados = existe
        ? listaAtual.filter((amb) => amb !== id)
        : [...listaAtual, id];
      return { ...prev, ambientes: atualizados };
    });
  }

  // Handler para salvar guias reordenadas/editadas diretamente no card
  const handleGuiasChange = useCallback(
    async (categoriaId: string, novasGuias: string[]) => {
      try {
        await salvarGuiasCategoria(categoriaId, novasGuias);
        setCategorias((prev) =>
          prev.map((cat) =>
            cat.id === categoriaId ? { ...cat, guias: novasGuias } : cat
          )
        );
      } catch (error) {
        console.error("Erro ao salvar guias:", error);
        toast({ title: "Erro", description: "Erro ao salvar guias. Tente novamente.", variant: "destructive" });
      }
    },
    []
  );

  // EVF tipo badge helpers
  const EVF_TIPO_BADGE: Record<TipoCategoria, { label: string; cor: string; bg: string }> = {
    servico: { label: "SRV", cor: "#2563EB", bg: "#DBEAFE" },
    mao_de_obra: { label: "MDO", cor: "#16A34A", bg: "#DCFCE7" },
    material: { label: "MAT", cor: "#D97706", bg: "#FEF3C7" },
    equipamento: { label: "EQP", cor: "#7C3AED", bg: "#EDE9FE" },
  };

  // Cobertura EVF
  const categoriasComEvf = categorias.filter((c) => c.evf_categoria_codigo);
  const coberturaEvf = categorias.length > 0
    ? `${categoriasComEvf.length}/${categorias.length}`
    : "0/0";

  // Agrupar categorias EVF por fase para o select
  const evfCategoriasAgrupadasPorFase = FASES_EVF.map((fase) => ({
    ...fase,
    categorias: evfCategorias.filter((c) => c.fase === fase.fase),
  })).filter((g) => g.categorias.length > 0);

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-wg-primary" />
          <p className="text-[12px] text-gray-600 mt-4">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/pricelist")}
            className="text-gray-600 hover:text-gray-900 mb-2 flex items-center gap-1 text-[12px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-wg-neutral">Categorias de Pricelist</h1>
          <p className="text-[12px] text-gray-600 mt-1">
            Gerencie as categorias de mÍo de obra e materiais
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-medium">
            EVF: {coberturaEvf} mapeadas
          </span>
          <button
            onClick={handleAutoMapear}
            disabled={autoMapeando}
            className="px-3 py-1.5 border border-blue-300 text-blue-600 rounded-lg hover:bg-blue-50 flex items-center gap-1.5 text-[14px] disabled:opacity-50"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            {autoMapeando ? "Mapeando..." : "Auto-mapear EVF"}
          </button>
          <button
            onClick={() => navigate("/pricelist/subcategorias")}
            className="px-3 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-1.5 text-[14px]"
          >
            Subcategorias
          </button>
          <button
            onClick={() => carregarDiagnostico()}
            className="px-3 py-1.5 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-1.5 text-[14px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Diagnóstico
          </button>
          <button
            onClick={() => abrirModal()}
            className="px-3 py-1.5 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 flex items-center gap-1.5 text-[14px]"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Categoria
          </button>
        </div>
      </div>

      <section className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
            <div>
              <p className="text-sm font-semibold text-wg-neutral">Diagnóstico de MÍo de Obra</p>
              <p className="text-xs text-gray-500">
                Dados atualizados pelo canal principal /pricelist/categorias e fontes conectadas (SINAPI, análise de projeto).
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="text-[12px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                <strong>{diagnostico?.categorias.length ?? "-"}</strong> categorias mapeadas
              </span>
              <span className="text-[12px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                <strong>
                  {diagnostico?.sugestoes
                    ? diagnostico.sugestoes.filter((s) => s.precisaCriarSubcategoriaMaoObra).length
                    : 0}
                </strong>{" "}
                sem subcategoria criada
              </span>
            </div>
          </div>

          <div className="mt-3">
            {diagnosticoLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border border-gray-300 border-t-transparent" />
                Carregando diagnóstico...
              </div>
            ) : diagnosticoError ? (
              <p className="text-xs text-red-500">{diagnosticoError}</p>
            ) : diagnostico ? (
              <>
                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  {diagnostico.fontes.map((fonte) => (
                    <div key={fonte.fonteId} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">{fonte.nome}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {fonte.estimativas.map((item) => (
                          <span
                            key={`${fonte.fonteId}-${item.categoriaId}`}
                            className="px-2 py-0.5 bg-white border border-gray-200 rounded-full text-[11px] text-gray-600"
                          >
                            {item.categoriaId.toUpperCase()}·{item.estimativaItens.toLocaleString("pt-BR")}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  <p className="text-xs text-gray-500">Sugestões mais urgentes</p>
                  {diagnostico.sugestoes.length === 0 ? (
                    <p className="text-sm text-gray-600 mt-1">Nenhuma sugestÍo gerada.</p>
                  ) : (
                    <ul className="mt-2 divide-y divide-gray-100">
                      {diagnostico.sugestoes.slice(0, 4).map((sugestao) => (
                        <li key={sugestao.categoriaId} className="py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="text-sm font-medium text-wg-neutral">
                                {sugestao.categoriaNome || sugestao.categoriaId}
                              </p>
                              {sugestao.mensagem && (
                                <p className="text-[12px] text-gray-500 mt-1">{sugestao.mensagem}</p>
                              )}
                            </div>
                            <span
                              className={`text-[11px] font-semibold rounded-full px-3 py-0.5 ${
                                sugestao.precisaCriarSubcategoriaMaoObra
                                  ? "bg-amber-100 text-amber-700"
                                  : sugestao.temSubcategoriaMaoObra
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {sugestao.temSubcategoriaMaoObra
                                ? "Subcategoria criada"
                                : sugestao.precisaCriarSubcategoriaMaoObra
                                ? "Criar MÍo de Obra"
                                : "Analisar"}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {sugestao.fontes.map((fonte) => (
                              <span
                                key={`${sugestao.categoriaId}-${fonte.fonteId}`}
                                className="text-[11px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-600"
                              >
                                <span className="font-semibold">{fonte.fonteNome}</span>
                                {fonte.aplicavel ? fonte.estimativaItens.toLocaleString("pt-BR") : "n/a"}
                              </span>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-gray-500">Diagnóstico ainda nÍo disponível.</p>
            )}
          </div>
        </div>
      </section>

      <section className="mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-wg-neutral">Fluxos referenciais</p>
              <p className="text-xs text-gray-500">
                Cada fluxo documentado pode servir de base para montar kits, ambientes e checklists de etapas.
              </p>
            </div>
          </div>
          <div className="mt-4 space-y-4">
            {referenceFlows.map((flow) => (
              <div key={flow.id} className="space-y-2">
                <div className="text-[13px] font-semibold text-gray-800">{flow.nome}</div>
                {flow.fases.map((phase) => (
                  <details
                    key={phase.id}
                    className="border border-gray-100 rounded-lg bg-gray-50"
                    open
                  >
                    <summary className="px-3 py-2 text-xs font-semibold text-gray-600 cursor-pointer">
                      {phase.nome}
                    </summary>
                    <div className="px-3 py-3 space-y-2">
                      {phase.tasks.map((task) => (
                        <article
                          key={task.id}
                          className="border border-gray-200 rounded-lg p-3 bg-white space-y-2 text-sm text-gray-700"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-gray-900">{task.nome}</span>
                            {task.tempoEstimadoMinutos && (
                              <span className="text-xs text-gray-500">
                                {task.tempoEstimadoMinutos} min
                              </span>
                            )}
                          </div>
                          {task.kits && task.kits.length > 0 && (
                            <p className="text-[11px] text-gray-500">
                              Kit: {task.kits.join(", ")}
                            </p>
                          )}
                          {task.ambientes && task.ambientes.length > 0 && (
                            <p className="text-[11px] text-gray-500">
                              Ambientes: {task.ambientes.join(", ")}
                            </p>
                          )}
                          {renderTaskResources(task)}
                        </article>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lista de Categorias */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {categorias.map((categoria) => {
          const tipoCategoria = categoria.tipo || "material";
          // Usa cor do config > cor do tipo como fallback
          const corConfig = getCorCategoria(categoria.nome);
          const corTipo = getTipoItemColor(tipoCategoria);
          // Se config retornar cor default (gray), usar cor do tipo
          const corCategoria = corConfig !== "#6B7280" ? corConfig : corTipo;
          return (
          <div
            key={categoria.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow border-l-4"
            style={{ borderLeftColor: corCategoria }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded font-normal"
                    style={{ backgroundColor: corCategoria + "20", color: corCategoria }}
                  >
                    {categoria.codigo
                      ? categoria.codigo
                      : String(categoria.ordem || 0).padStart(3, "0")}
                  </span>
                  <span
                    className="px-2 py-0.5 text-xs font-medium rounded"
                    style={{
                      backgroundColor: getTipoItemColor(tipoCategoria) + "20",
                      color: getTipoItemColor(tipoCategoria),
                    }}
                  >
                    {getTipoItemLabel(tipoCategoria)}
                  </span>
                </div>
                <h3 className="font-normal text-[14px] text-wg-neutral">{categoria.nome}</h3>
                <p className="text-[12px] text-gray-500 mt-1">
                  {categoria.descricao || "Sem descriçÍo"}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {categoria.tipo_servico && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50 text-gray-600">
                      {categoria.tipo_servico}
                    </span>
                  )}
                  {categoria.guia_principal && (
                    <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700">
                      {categoria.guia_principal}
                    </span>
                  )}
                  {categoria.aplicacao_obra && categoria.aplicacao_obra !== "ambos" && (
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      categoria.aplicacao_obra === "reforma"
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700"
                    }`}>
                      {categoria.aplicacao_obra === "reforma" ? "Reforma" : "ConstruçÍo"}
                    </span>
                  )}
                </div>
                {categoria.ambientes && categoria.ambientes.length > 0 && (
                  <p className="text-[10px] text-gray-500 mt-1">
                    Ambientes:{" "}
                    {categoria.ambientes.map((amb) => amb.nome).join(", ")}
                  </p>
                )}
                {/* Guias Reordenáveis */}
                <div className="mt-2">
                  <p className="text-[10px] text-gray-400 mb-1">Guias extras:</p>
                  <GuiasReordenaveis
                    guias={categoria.guias || []}
                    onChange={(novasGuias) => handleGuiasChange(categoria.id, novasGuias)}
                  />
                </div>
                {/* Mapeamento EVF */}
                <div className="mt-2 pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-400 mb-1">Categoria EVF:</p>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={categoria.evf_categoria_codigo || ""}
                      onChange={(e) => handleEvfMappingChange(categoria.id, e.target.value || null)}
                      className="flex-1 text-[11px] px-1.5 py-1 border border-gray-200 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-400"
                    >
                      <option value="">-- Sem mapeamento --</option>
                      {evfCategoriasAgrupadasPorFase.map((grupo) => (
                        <optgroup key={grupo.fase} label={`F${grupo.fase} — ${grupo.nome}`}>
                          {grupo.categorias.map((evfCat) => (
                            <option key={evfCat.codigo} value={evfCat.codigo}>
                              {evfCat.nome}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                    {categoria.evf_categoria_codigo && (() => {
                      const evfCat = evfCategorias.find((c) => c.codigo === categoria.evf_categoria_codigo);
                      const tipo = evfCat?.tipo as TipoCategoria | undefined;
                      const badge = tipo ? EVF_TIPO_BADGE[tipo] : null;
                      return badge ? (
                        <span
                          className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: badge.bg, color: badge.cor }}
                        >
                          {badge.label}
                        </span>
                      ) : null;
                    })()}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <span
                className={`text-[12px] font-medium ${
                  categoria.ativo ? "text-green-600" : "text-gray-400"
                }`}
              >
                {categoria.ativo ? "Ativa" : "Inativa"}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => abrirModal(categoria)}
                  className="px-2 py-1 text-[14px] text-blue-600 hover:bg-blue-50 rounded"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDeletar(categoria.id)}
                  className="px-2 py-1 text-[14px] text-red-600 hover:bg-red-50 rounded"
                >
                  Deletar
                </button>
              </div>
            </div>
          </div>
        );
        })}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">Nenhuma categoria encontrada</p>
          <button
            onClick={() => abrirModal()}
            className="mt-4 text-wg-primary hover:underline text-[14px]"
          >
            Criar primeira categoria
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-normal mb-4">
              {editando ? "Editar Categoria" : "Nova Categoria"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  Código
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => {
                    setFormData({ ...formData, codigo: e.target.value.toUpperCase() });
                    setErrosCodigo(""); // Limpar erro ao digitar
                  }}
                  placeholder="Ex: ARQ, ENG, EST"
                  maxLength={10}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 text-[14px] placeholder:text-[10px] ${
                    errosCodigo
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-wg-primary"
                  }`}
                />
                {errosCodigo ? (
                  <p className="text-[12px] text-red-600 mt-1">{errosCodigo}</p>
                ) : (
                  <p className="text-[12px] text-gray-500 mt-1">
                    Código abreviado da categoria (será exibido como 001-ARQ)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={formData.tipo || "material"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      tipo: e.target.value as PricelistCategoriaFormData["tipo"],
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                  required
                >
                  <option value="material">Material</option>
                  <option value="mao_obra">Mao de Obra</option>
                  <option value="servico">Servico</option>
                  <option value="produto">Produto</option>
                </select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-normal text-gray-700 mb-2">
                    Tipo de Serviço
                  </label>
                  <input
                    list="tipo-servico-options"
                    value={formData.tipo_servico}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_servico: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                    placeholder="Ex: DemoliçÍo, Revestimento"
                  />
                  <datalist id="tipo-servico-options">
                    {tipoServicoOpcoes.map((opcao) => (
                      <option key={opcao} value={opcao} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-[12px] font-normal text-gray-700 mb-2">
                    Guia principal
                  </label>
                  <input
                    type="text"
                    value={formData.guia_principal}
                    onChange={(e) =>
                      setFormData({ ...formData, guia_principal: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                    placeholder="Ex: Hidrosanitária"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  AplicaçÍo de Obra
                </label>
                <select
                  value={formData.aplicacao_obra ?? "ambos"}
                  onChange={(e) =>
                    setFormData({ ...formData, aplicacao_obra: e.target.value as 'reforma' | 'construcao' | 'ambos' })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px] bg-white"
                >
                  <option value="ambos">Ambos (Reforma e ConstruçÍo)</option>
                  <option value="reforma">Reforma</option>
                  <option value="construcao">ConstruçÍo</option>
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  DescriçÍo
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                  rows={3}
                />
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <label className="block text-[12px] font-normal text-gray-700 mb-2">
                    Tags (vírgulas entre as palavras-chave)
                  </label>
                  <input
                    type="text"
                    value={(formData.tags || []).join(", ")}
                    onChange={(e) => handleListInputChange("tags", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                    placeholder="banheiro, revestimento, piso"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-normal text-gray-700 mb-2">
                    Guias extras
                  </label>
                  <input
                    type="text"
                    value={(formData.guias || []).join(", ")}
                    onChange={(e) => handleListInputChange("guias", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary text-[14px]"
                    placeholder="MÍo de obra, Infra, Insumos"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-normal text-gray-700 mb-2">
                  Ambientes associados
                </label>
                <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 max-h-48 overflow-auto pr-2">
                  {ambientes.length > 0 ? (
                    ambientes.map((ambiente) => (
                      <label
                        key={ambiente.id}
                        className="inline-flex items-center gap-2 text-[12px] text-gray-700 bg-gray-50 px-2 py-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={(formData.ambientes || []).includes(ambiente.id)}
                          onChange={() => toggleAmbienteSelecionado(ambiente.id)}
                          className="w-4 h-4"
                        />
                        {ambiente.nome}
                      </label>
                    ))
                  ) : (
                    <p className="text-[12px] text-gray-500">Carregando ambientes...</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={formData.ativo}
                  onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                  className="w-4 h-4"
                />
                <label htmlFor="ativo" className="text-[12px] text-gray-700">
                  Categoria ativa
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={fecharModal}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-[14px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 text-[14px]"
                >
                  {editando ? "Atualizar" : "Criar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

