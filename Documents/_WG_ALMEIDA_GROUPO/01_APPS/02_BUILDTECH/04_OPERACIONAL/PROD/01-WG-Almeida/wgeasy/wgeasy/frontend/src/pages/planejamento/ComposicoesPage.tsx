/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// COMPOSIÇÕES DE MATERIAIS
// Sistema WG Easy - Grupo WG Almeida
// Gerenciamento de composições para orçamento
// ==========================================

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Search,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Package,
  Zap,
  Droplets,
  PaintBucket,
  Hammer,
  Grid3X3,
  Loader2,
  AlertCircle,
  CheckCircle,
  Info,
  Copy,
  Eye,
} from "lucide-react";
import {
  listarComposicoes,
  buscarComposicaoCompleta,
  criarComposicao,
  atualizarComposicao,
  excluirComposicao,
  adicionarItemComposicao,
  atualizarItemComposicao,
  excluirItemComposicao,
  obterEstatisticasComposicoes,
  type ModeloComposicao,
  type ModeloComposicaoItem,
  type Disciplina,
  type ClassificacaoMaterial,
  type CalculoTipo,
} from "@/lib/composicoesApi";
import { useToast } from "@/hooks/use-toast";

// Cores e ícones por disciplina
import { normalizeSearchTerm } from "@/utils/searchUtils";
const DISCIPLINA_CONFIG: Record<string, { cor: string; corLight: string; icon: React.ReactNode; label: string }> = {
  ELETRICA: { cor: "#F59E0B", corLight: "#FEF3C7", icon: <Zap className="w-5 h-5" />, label: "Elétrica" },
  HIDRAULICA: { cor: "#3B82F6", corLight: "#DBEAFE", icon: <Droplets className="w-5 h-5" />, label: "Hidráulica" },
  REVESTIMENTOS: { cor: "#8B5CF6", corLight: "#EDE9FE", icon: <Grid3X3 className="w-5 h-5" />, label: "Revestimentos" },
  PINTURA: { cor: "#EC4899", corLight: "#FCE7F3", icon: <PaintBucket className="w-5 h-5" />, label: "Pintura" },
  GESSO: { cor: "#6B7280", corLight: "#F3F4F6", icon: <Layers className="w-5 h-5" />, label: "Gesso" },
  ALVENARIA: { cor: "#EF4444", corLight: "#FEE2E2", icon: <Hammer className="w-5 h-5" />, label: "Alvenaria" },
};

// Cores por classificaçÍo
const CLASSIFICACAO_CONFIG: Record<ClassificacaoMaterial, { cor: string; corLight: string; label: string }> = {
  ACABAMENTO: { cor: "#10B981", corLight: "#D1FAE5", label: "Acabamento" },
  INSUMO: { cor: "#3B82F6", corLight: "#DBEAFE", label: "Insumo" },
  CONSUMIVEL: { cor: "#F59E0B", corLight: "#FEF3C7", label: "Consumível" },
  FERRAMENTA: { cor: "#6B7280", corLight: "#F3F4F6", label: "Ferramenta" },
};

// Labels de cálculo
const CALCULO_LABELS: Record<CalculoTipo, string> = {
  POR_AREA: "Por Área (m²)",
  POR_PERIMETRO: "Por Perímetro (ml)",
  POR_UNIDADE: "Por Unidade",
  FIXO: "Fixo",
  PROPORCIONAL: "Proporcional",
};

export default function ComposicoesPage() {
  const { toast } = useToast();
  const [composicoes, setComposicoes] = useState<ModeloComposicao[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>("todos");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [composicaoSelecionada, setComposicaoSelecionada] = useState<ModeloComposicao | null>(null);
  const [loadingDetalhes, setLoadingDetalhes] = useState(false);
  const [estatisticas, setEstatisticas] = useState<any>(null);

  // Modal de ediçÍo
  const [modalAberto, setModalAberto] = useState(false);
  const [modoEdicao, setModoEdicao] = useState<"criar" | "editar">("criar");
  const [formComposicao, setFormComposicao] = useState<Partial<ModeloComposicao>>({});
  const [salvando, setSalvando] = useState(false);

  // Modal de item
  const [modalItemAberto, setModalItemAberto] = useState(false);
  const [formItem, setFormItem] = useState<Partial<ModeloComposicaoItem>>({});
  const [modoEdicaoItem, setModoEdicaoItem] = useState<"criar" | "editar">("criar");

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [lista, stats] = await Promise.all([
        listarComposicoes({ ativo: true }),
        obterEstatisticasComposicoes(),
      ]);
      setComposicoes(lista);
      setEstatisticas(stats);
    } catch (error) {
      console.error("Erro ao carregar composições:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar as composições.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  // Filtrar composições
  const composicoesFiltradas = composicoes.filter((c) => {
    const matchDisciplina = filtroDisciplina === "todos" || c.disciplina === filtroDisciplina;
    const matchBusca =
      !busca ||
      normalizeSearchTerm(c.nome).includes(normalizeSearchTerm(busca)) ||
      normalizeSearchTerm(c.codigo).includes(normalizeSearchTerm(busca));
    return matchDisciplina && matchBusca;
  });

  // Agrupar por disciplina
  const composicoesPorDisciplina = composicoesFiltradas.reduce((acc, c) => {
    if (!acc[c.disciplina]) acc[c.disciplina] = [];
    acc[c.disciplina].push(c);
    return acc;
  }, {} as Record<string, ModeloComposicao[]>);

  // Toggle expandir
  function toggleExpandir(id: string) {
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) {
        novo.delete(id);
      } else {
        novo.add(id);
      }
      return novo;
    });
  }

  // Carregar detalhes da composiçÍo
  async function carregarDetalhes(composicao: ModeloComposicao) {
    try {
      setLoadingDetalhes(true);
      const completa = await buscarComposicaoCompleta(composicao.id);
      setComposicaoSelecionada(completa);
    } catch (error) {
      console.error("Erro ao carregar detalhes:", error);
    } finally {
      setLoadingDetalhes(false);
    }
  }

  // Abrir modal para criar
  function abrirModalCriar() {
    setModoEdicao("criar");
    setFormComposicao({
      disciplina: "ELETRICA" as Disciplina,
      unidade_base: "un",
      ativo: true,
    });
    setModalAberto(true);
  }

  // Abrir modal para editar
  function abrirModalEditar(composicao: ModeloComposicao) {
    setModoEdicao("editar");
    setFormComposicao(composicao);
    setModalAberto(true);
  }

  // Salvar composiçÍo
  async function salvarComposicao() {
    if (!formComposicao.codigo || !formComposicao.nome) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o código e nome da composiçÍo.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);
      if (modoEdicao === "criar") {
        await criarComposicao(formComposicao);
        toast({ title: "ComposiçÍo criada com sucesso!" });
      } else {
        await atualizarComposicao(formComposicao.id!, formComposicao);
        toast({ title: "ComposiçÍo atualizada com sucesso!" });
      }
      setModalAberto(false);
      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }

  // Excluir composiçÍo
  async function handleExcluir(composicao: ModeloComposicao) {
    if (!confirm(`Excluir a composiçÍo "${composicao.nome}"?`)) return;

    try {
      await excluirComposicao(composicao.id);
      toast({ title: "ComposiçÍo excluída com sucesso!" });
      setComposicaoSelecionada(null);
      carregarDados();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  }

  // Abrir modal de item
  function abrirModalItem(modo: "criar" | "editar", item?: ModeloComposicaoItem) {
    setModoEdicaoItem(modo);
    if (modo === "editar" && item) {
      setFormItem(item);
    } else {
      setFormItem({
        composicao_id: composicaoSelecionada?.id,
        classificacao: "INSUMO",
        calculo_tipo: "POR_UNIDADE",
        coeficiente: 1,
        obrigatorio: true,
      });
    }
    setModalItemAberto(true);
  }

  // Salvar item
  async function salvarItem() {
    if (!formItem.descricao_generica || !formItem.unidade) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha a descriçÍo e unidade.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);
      if (modoEdicaoItem === "criar") {
        await adicionarItemComposicao(formItem);
        toast({ title: "Item adicionado!" });
      } else {
        await atualizarItemComposicao(formItem.id!, formItem);
        toast({ title: "Item atualizado!" });
      }
      setModalItemAberto(false);
      if (composicaoSelecionada) {
        carregarDetalhes(composicaoSelecionada);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }

  // Excluir item
  async function handleExcluirItem(item: ModeloComposicaoItem) {
    if (!confirm(`Excluir "${item.descricao_generica}"?`)) return;

    try {
      await excluirItemComposicao(item.id);
      toast({ title: "Item excluído!" });
      if (composicaoSelecionada) {
        carregarDetalhes(composicaoSelecionada);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-wg-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando composições...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-wg-primary to-wg-primary/80 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
              <Layers className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Composições</h1>
              <p className="text-[12px] text-gray-600">Modelos de calculo automatico de materiais</p>
            </div>
          </div>
          <button
            type="button"
            onClick={abrirModalCriar}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 font-medium flex items-center justify-center gap-2 shadow-md transition-colors whitespace-nowrap shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>Nova ComposiçÍo</span>
          </button>
        </div>

        {/* Estatísticas */}
        {estatisticas && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Layers className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Composições</p>
                  <p className="text-[20px] font-normal text-gray-900">{estatisticas.totalComposicoes}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Itens</p>
                  <p className="text-[20px] font-normal text-gray-900">{estatisticas.totalItens}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Disciplinas</p>
                  <p className="text-[20px] font-normal text-gray-900">{Object.keys(estatisticas.porDisciplina).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Info className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Classificações</p>
                  <p className="text-[20px] font-normal text-gray-900">{Object.keys(estatisticas.porClassificacao).length}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar composiçÍo..."
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setFiltroDisciplina("todos")}
                className={`px-4 py-2 rounded-lg font-medium text-[14px] transition-all ${
                  filtroDisciplina === "todos"
                    ? "bg-gray-900 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                Todos
              </button>
              {Object.entries(DISCIPLINA_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFiltroDisciplina(key)}
                  style={{
                    backgroundColor: filtroDisciplina === key ? config.cor : config.corLight,
                    color: filtroDisciplina === key ? "white" : config.cor,
                  }}
                  className="px-4 py-2 rounded-lg font-medium text-[14px] transition-all flex items-center gap-2"
                >
                  {config.icon}
                  {config.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Layout com lista e detalhes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Lista de Composições */}
          <div className="lg:col-span-2 space-y-4">
            {Object.entries(composicoesPorDisciplina).map(([disciplina, lista]) => {
              const config = DISCIPLINA_CONFIG[disciplina] || DISCIPLINA_CONFIG.ELETRICA;
              const isExpandido = expandidos.has(disciplina);

              return (
                <div
                  key={disciplina}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Header da disciplina */}
                  <div
                    className="p-4 cursor-pointer flex items-center justify-between"
                    style={{ backgroundColor: config.corLight }}
                    onClick={() => toggleExpandir(disciplina)}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: config.cor, color: "white" }}
                      >
                        {config.icon}
                      </div>
                      <div>
                        <h3 className="font-normal text-gray-900">{config.label}</h3>
                        <p className="text-sm text-gray-600">
                          {lista.length} composiç{lista.length > 1 ? "ões" : "Ío"}
                        </p>
                      </div>
                    </div>
                    {isExpandido ? (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-500" />
                    )}
                  </div>

                  {/* Lista de composições */}
                  {isExpandido && (
                    <div className="divide-y divide-gray-100">
                      {lista.map((composicao) => (
                        <div
                          key={composicao.id}
                          className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                            composicaoSelecionada?.id === composicao.id ? "bg-orange-50" : ""
                          }`}
                          onClick={() => carregarDetalhes(composicao)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                  {composicao.codigo}
                                </span>
                                <h4 className="font-medium text-gray-900">{composicao.nome}</h4>
                              </div>
                              {composicao.descricao && (
                                <p className="text-sm text-gray-500 mt-1">{composicao.descricao}</p>
                              )}
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                                  Base: {composicao.unidade_base}
                                </span>
                                {composicao.categoria && (
                                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-600 rounded">
                                    {composicao.categoria}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  abrirModalEditar(composicao);
                                }}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleExcluir(composicao);
                                }}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {composicoesFiltradas.length === 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <Layers className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[18px] font-normal text-gray-700 mb-2">
                  Nenhuma composicao encontrada
                </h3>
                <p className="text-gray-500 mb-4">
                  Ajuste os filtros ou crie uma nova composiçÍo
                </p>
                <button
                  type="button"
                  onClick={abrirModalCriar}
                  className="px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90"
                >
                  Criar ComposiçÍo
                </button>
              </div>
            )}
          </div>

          {/* Detalhes da ComposiçÍo */}
          <div className="lg:col-span-1">
            {loadingDetalhes ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Loader2 className="w-8 h-8 text-wg-primary animate-spin mx-auto" />
                <p className="text-gray-500 mt-2">Carregando...</p>
              </div>
            ) : composicaoSelecionada ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden sticky top-8">
                {/* Header */}
                <div
                  className="p-4"
                  style={{
                    backgroundColor:
                      DISCIPLINA_CONFIG[composicaoSelecionada.disciplina]?.corLight || "#F3F4F6",
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-sm bg-white/50 px-2 py-0.5 rounded">
                      {composicaoSelecionada.codigo}
                    </span>
                    <span
                      className="text-xs font-medium px-2 py-1 rounded"
                      style={{
                        backgroundColor: DISCIPLINA_CONFIG[composicaoSelecionada.disciplina]?.cor,
                        color: "white",
                      }}
                    >
                      {DISCIPLINA_CONFIG[composicaoSelecionada.disciplina]?.label}
                    </span>
                  </div>
                  <h3 className="text-lg font-normal text-gray-900">{composicaoSelecionada.nome}</h3>
                  {composicaoSelecionada.descricao && (
                    <p className="text-sm text-gray-600 mt-1">{composicaoSelecionada.descricao}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2">
                    Unidade base: <strong>{composicaoSelecionada.unidade_base}</strong>
                  </p>
                </div>

                {/* Itens */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-normal text-gray-900">
                      Itens ({composicaoSelecionada.itens?.length || 0})
                    </h4>
                    <button
                      type="button"
                      onClick={() => abrirModalItem("criar")}
                      className="text-sm text-wg-primary hover:text-wg-primary/80 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </button>
                  </div>

                  {composicaoSelecionada.itens && composicaoSelecionada.itens.length > 0 ? (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {composicaoSelecionada.itens.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 bg-gray-50 rounded-lg border border-gray-100"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="text-xs font-medium px-2 py-0.5 rounded"
                                  style={{
                                    backgroundColor: CLASSIFICACAO_CONFIG[item.classificacao]?.corLight,
                                    color: CLASSIFICACAO_CONFIG[item.classificacao]?.cor,
                                  }}
                                >
                                  {CLASSIFICACAO_CONFIG[item.classificacao]?.label}
                                </span>
                                {!item.obrigatorio && (
                                  <span className="text-xs text-gray-400">Opcional</span>
                                )}
                              </div>
                              <p className="font-medium text-gray-900 text-sm">
                                {item.descricao_generica}
                              </p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>Coef: {item.coeficiente}</span>
                                <span>Un: {item.unidade}</span>
                                <span>{CALCULO_LABELS[item.calculo_tipo]}</span>
                              </div>
                              {item.observacao && (
                                <p className="text-xs text-gray-400 mt-1 italic">{item.observacao}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => abrirModalItem("editar", item)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleExcluirItem(item)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Nenhum item cadastrado</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
                <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h4 className="font-normal text-gray-700 mb-1">Selecione uma composiçÍo</h4>
                <p className="text-sm text-gray-500">
                  Clique em uma composiçÍo para ver os detalhes
                </p>
              </div>
            )}
          </div>
        </div>

      {/* Modal de ComposiçÍo */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-normal text-gray-900">
                {modoEdicao === "criar" ? "Nova ComposiçÍo" : "Editar ComposiçÍo"}
              </h2>
            </div>
            <div className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
                  <input
                    type="text"
                    value={formComposicao.codigo || ""}
                    onChange={(e) =>
                      setFormComposicao({ ...formComposicao, codigo: e.target.value.toUpperCase() })
                    }
                    placeholder="ELE-TOMADA"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina *</label>
                  <select
                    value={formComposicao.disciplina || ""}
                    onChange={(e) =>
                      setFormComposicao({ ...formComposicao, disciplina: e.target.value as Disciplina })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  >
                    {Object.entries(DISCIPLINA_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  value={formComposicao.nome || ""}
                  onChange={(e) => setFormComposicao({ ...formComposicao, nome: e.target.value })}
                  placeholder="Ponto de Tomada 4x2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo</label>
                <textarea
                  value={formComposicao.descricao || ""}
                  onChange={(e) => setFormComposicao({ ...formComposicao, descricao: e.target.value })}
                  placeholder="Materiais necessários para instalaçÍo de tomada..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade Base *</label>
                  <select
                    value={formComposicao.unidade_base || "un"}
                    onChange={(e) =>
                      setFormComposicao({ ...formComposicao, unidade_base: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="m2">Metro quadrado (m²)</option>
                    <option value="ml">Metro linear (ml)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formComposicao.categoria || ""}
                    onChange={(e) =>
                      setFormComposicao({ ...formComposicao, categoria: e.target.value })
                    }
                    placeholder="PONTOS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalAberto(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarComposicao}
                disabled={salvando}
                className="px-6 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Item */}
      {modalItemAberto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-normal text-gray-900">
                {modoEdicaoItem === "criar" ? "Novo Item" : "Editar Item"}
              </h2>
            </div>
            <div className="p-3 sm:p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo *</label>
                <input
                  type="text"
                  value={formItem.descricao_generica || ""}
                  onChange={(e) =>
                    setFormItem({ ...formItem, descricao_generica: e.target.value })
                  }
                  placeholder="Tomada 2P+T 10A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ClassificaçÍo *</label>
                  <select
                    value={formItem.classificacao || "INSUMO"}
                    onChange={(e) =>
                      setFormItem({ ...formItem, classificacao: e.target.value as ClassificacaoMaterial })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  >
                    {Object.entries(CLASSIFICACAO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Cálculo *</label>
                  <select
                    value={formItem.calculo_tipo || "POR_UNIDADE"}
                    onChange={(e) =>
                      setFormItem({ ...formItem, calculo_tipo: e.target.value as CalculoTipo })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  >
                    {Object.entries(CALCULO_LABELS).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Coeficiente *</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={formItem.coeficiente || 1}
                    onChange={(e) =>
                      setFormItem({ ...formItem, coeficiente: parseFloat(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade *</label>
                  <input
                    type="text"
                    value={formItem.unidade || ""}
                    onChange={(e) => setFormItem({ ...formItem, unidade: e.target.value })}
                    placeholder="un, m, rolo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                  <input
                    type="text"
                    value={formItem.categoria_material || ""}
                    onChange={(e) =>
                      setFormItem({ ...formItem, categoria_material: e.target.value })
                    }
                    placeholder="TOMADAS"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Arredondar para</label>
                  <input
                    type="number"
                    step="1"
                    value={formItem.arredondar_para || ""}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        arredondar_para: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="100 (ex: rolo 100m)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mínimo</label>
                  <input
                    type="number"
                    step="1"
                    value={formItem.minimo || ""}
                    onChange={(e) =>
                      setFormItem({
                        ...formItem,
                        minimo: e.target.value ? parseFloat(e.target.value) : undefined,
                      })
                    }
                    placeholder="Quantidade mínima"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ObservaçÍo</label>
                <input
                  type="text"
                  value={formItem.observacao || ""}
                  onChange={(e) => setFormItem({ ...formItem, observacao: e.target.value })}
                  placeholder="8m por ponto | Rolo 100m"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="obrigatorio"
                  checked={formItem.obrigatorio ?? true}
                  onChange={(e) => setFormItem({ ...formItem, obrigatorio: e.target.checked })}
                  className="w-4 h-4 text-wg-primary border-gray-300 rounded focus:ring-wg-primary"
                />
                <label htmlFor="obrigatorio" className="text-sm text-gray-700">
                  Item obrigatório
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setModalItemAberto(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarItem}
                disabled={salvando}
                className="px-6 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 disabled:opacity-50 flex items-center gap-2"
              >
                {salvando && <Loader2 className="w-4 h-4 animate-spin" />}
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


