/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// ORÇAMENTOS
// Sistema WG Easy - Grupo WG Almeida
// Com agrupamento por cliente
// ==========================================

import { useState, useEffect, useMemo, type MouseEvent } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listarOrcamentos, type Orcamento } from "@/lib/orcamentoApi";
import { formatarMoeda, formatarData } from "@/lib/utils";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { ChevronDown, ChevronRight, Plus, Calculator, Pencil, Copy, Share2 } from "lucide-react";
import { useSwipe } from "@/hooks/useSwipe";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import Avatar from "@/components/common/Avatar";
import { normalizeSearchTerm } from "@/utils/searchUtils";

interface OrcamentoComCliente extends Omit<Orcamento, "cliente"> {
  cliente?: {
    nome: string;
    avatar_url?: string | null;
  } | null;
  obra?: {
    nome: string;
  };
}

interface GrupoOrcamentos {
  cliente_id: string | null;
  cliente_nome: string;
  cliente_avatar_url?: string | null;
  orcamentos: OrcamentoComCliente[];
  valor_total: number;
  quantidade: number;
}

export default function OrcamentosPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [orcamentos, setOrcamentos] = useState<OrcamentoComCliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string>("todos");
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(
    new Set()
  );
  const [modoVisualizacao, setModoVisualizacao] = useState<
    "agrupado" | "individual"
  >("agrupado");
  const { onTouchStart, onTouchEnd } = useSwipe({
    onSwipeLeft: () => navigate("/"),
    onSwipeRight: () => navigate(-1),
  });

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  useEffect(() => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      setFiltroStatus(statusParam);
    }
  }, [searchParams]);

  async function carregarOrcamentos() {
    try {
      setLoading(true);

      // Buscar orçamentos sem join (evita erro de FK)
      const { data, error } = await supabase
        .from("orcamentos")
        .select("*")
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Buscar nomes e fotos dos clientes separadamente
      const clienteIds = [...new Set((data || []).map(o => o.cliente_id).filter(Boolean))];
      let clientesMap: Record<string, { nome: string; avatar_url?: string | null }> = {};
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from("pessoas")
          .select("id, nome, avatar_url")
          .in("id", clienteIds);
        if (clientes) {
          clientesMap = Object.fromEntries(clientes.map(c => [c.id, { nome: c.nome, avatar_url: c.avatar_url }]));
        }
      }

      const orcamentosComCliente = (data || []).map(o => ({
        ...o,
        cliente: o.cliente_id && clientesMap[o.cliente_id]
          ? { nome: clientesMap[o.cliente_id].nome, avatar_url: clientesMap[o.cliente_id].avatar_url }
          : { nome: null, avatar_url: null }
      }));

      setOrcamentos(orcamentosComCliente);
    } catch (error) {
      console.error("Erro ao carregar orçamentos:", error);
    } finally {
      setLoading(false);
    }
  }

  function handleNovoOrcamento() {
    navigate("/orcamentos/novo");
  }

  function handleVisualizarOrcamento(id: string) {
    navigate(`/orcamentos/${id}`);
  }

  function handleEditarOrcamento(e: MouseEvent, id: string) {
    e.stopPropagation();
    navigate(`/orcamentos/${id}/editar`);
  }

  async function handleDuplicarOrcamento(e: MouseEvent, orcamento: OrcamentoComCliente) {
    e.stopPropagation();
    if (!confirm(`Deseja duplicar o orçamento "${orcamento.titulo}"?`)) return;

    try {
      // Buscar itens do orçamento original
      const { data: itens } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamento.id);

      // Criar novo orçamento
      const { data: novoOrcamento, error } = await supabase
        .from("orcamentos")
        .insert({
          titulo: `${orcamento.titulo} (Cópia)`,
          cliente_id: orcamento.cliente_id,
          obra_id: orcamento.obra_id,
          valor_total: orcamento.valor_total,
          margem: orcamento.margem,
          status: "rascunho",
        })
        .select()
        .single();

      if (error) throw error;

      // Duplicar itens se existirem
      if (itens && itens.length > 0 && novoOrcamento) {
        const novosItens = itens.map(({ id, orcamento_id, criado_em, atualizado_em, ...item }) => ({
          ...item,
          orcamento_id: novoOrcamento.id,
        }));
        await supabase.from("orcamento_itens").insert(novosItens);
      }

      toast({ title: "Sucesso", description: "Orçamento duplicado com sucesso!" });
      carregarOrcamentos();
    } catch (error) {
      console.error("Erro ao duplicar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar orçamento" });
    }
  }

  function handleCompartilharOrcamento(e: MouseEvent, orcamento: OrcamentoComCliente) {
    e.stopPropagation();
    const url = `${window.location.origin}/orcamentos/${orcamento.id}`;

    if (navigator.share) {
      navigator.share({
        title: orcamento.titulo || "Orçamento",
        text: `Orçamento: ${orcamento.titulo} - ${formatarMoeda(orcamento.valor_total || 0)}`,
        url: url,
      }).catch(() => {
        // Fallback se o usuário cancelar o share
        navigator.clipboard.writeText(url);
        toast({ title: "Link copiado para a área de transferência!" });
      });
    } else {
      navigator.clipboard.writeText(url);
      toast({ title: "Link copiado para a área de transferência!" });
    }
  }

  // Filtrar orçamentos
  const orcamentosFiltrados = orcamentos.filter((orc) => {
    const matchBusca =
      !busca ||
      normalizeSearchTerm(orc.titulo || "").includes(normalizeSearchTerm(busca)) ||
      normalizeSearchTerm(orc.cliente?.nome || "").includes(normalizeSearchTerm(busca)) ||
      normalizeSearchTerm(orc.obra?.nome || "").includes(normalizeSearchTerm(busca));

    const matchStatus =
      filtroStatus === "todos" || orc.status === filtroStatus;

    return matchBusca && matchStatus;
  });

  // Agrupar orçamentos por cliente
  const gruposOrcamentos = useMemo((): GrupoOrcamentos[] => {
    const grupos: Record<string, GrupoOrcamentos> = {};

    orcamentosFiltrados.forEach((orc) => {
      const clienteId = orc.cliente_id || "sem_cliente";
      const clienteNome = orc.cliente?.nome || "Sem Cliente";
      const clienteAvatarUrl = orc.cliente?.avatar_url;

      if (!grupos[clienteId]) {
        grupos[clienteId] = {
          cliente_id: orc.cliente_id,
          cliente_nome: clienteNome,
          cliente_avatar_url: clienteAvatarUrl,
          orcamentos: [],
          valor_total: 0,
          quantidade: 0,
        };
      }

      grupos[clienteId].orcamentos.push(orc);
      grupos[clienteId].valor_total += orc.valor_total || 0;
      grupos[clienteId].quantidade += 1;
    });

    // Ordenar por valor total decrescente
    return Object.values(grupos).sort((a, b) => b.valor_total - a.valor_total);
  }, [orcamentosFiltrados]);

  // Toggle para expandir/colapsar grupo
  function toggleGrupo(clienteId: string) {
    setGruposExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(clienteId)) {
        novo.delete(clienteId);
      } else {
        novo.add(clienteId);
      }
      return novo;
    });
  }

  // Expandir todos
  function expandirTodos() {
    setGruposExpandidos(
      new Set(gruposOrcamentos.map((g) => g.cliente_id || "sem_cliente"))
    );
  }

  // Colapsar todos
  function colapsarTodos() {
    setGruposExpandidos(new Set());
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-wg-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando orçamentos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
        {/* Header */}
        <div className={LAYOUT.pageHeader}>
          <div className={LAYOUT.pageTitleWrapper}>
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>Orcamentos</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                Gestao de orcamentos e estimativas de projetos
              </p>
            </div>
          </div>
          <div className={LAYOUT.pageActions}>
            <button
              type="button"
              onClick={() => navigate("/planejamento/novo")}
              className="px-4 py-2.5 bg-white text-wg-primary rounded-lg hover:bg-wg-primary/10 text-[13px] flex items-center gap-2 shadow-sm transition-colors border border-wg-primary"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Pedido</span>
            </button>
            <button
              type="button"
              onClick={handleNovoOrcamento}
              className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg hover:opacity-90 text-[13px] flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Orcamento</span>
            </button>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-3 sm:p-4">
          <div className="flex gap-3 flex-wrap items-center">
            <div className="flex-1 min-w-[200px]">
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por titulo, cliente ou obra..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/20 focus:border-transparent"
              />
            </div>

            {/* Toggle Modo de VisualizaçÍo */}
            <div className="flex items-center gap-2">
              <span className={TYPOGRAPHY.cardMeta}>Visualizacao:</span>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("agrupado")}
                  className={`px-3 py-1.5 text-[12px] transition-colors ${
                    modoVisualizacao === "agrupado"
                      ? "bg-[#16a34a] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Por Cliente
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao("individual")}
                  className={`px-3 py-1.5 text-[12px] transition-colors ${
                    modoVisualizacao === "individual"
                      ? "bg-[#16a34a] text-white"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Individual
                </button>
              </div>
            </div>

            {/* Botões Expandir/Colapsar */}
            {modoVisualizacao === "agrupado" && gruposOrcamentos.length > 0 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={expandirTodos}
                  className="px-2 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Expandir
                </button>
                <button
                  type="button"
                  onClick={colapsarTodos}
                  className="px-2 py-1.5 text-[12px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Colapsar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Lista de Orçamentos */}
        {orcamentosFiltrados.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calculator className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>
              {busca
                ? "Nenhum orcamento encontrado"
                : "Nenhum orcamento cadastrado"}
            </h2>
            <p className={`${TYPOGRAPHY.cardSubtitle} mb-6`}>
              {busca
                ? "Tente ajustar os filtros de busca"
                : "Comece criando seu primeiro orcamento"}
            </p>
            {!busca && (
              <button
                type="button"
                onClick={handleNovoOrcamento}
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg hover:opacity-90 text-[13px] inline-flex items-center gap-2 shadow-lg transition-all"
              >
                <Plus className="w-4 h-4" />
                Criar Primeiro Orcamento
              </button>
            )}
          </div>
        ) : modoVisualizacao === "agrupado" ? (
          /* MODO AGRUPADO POR CLIENTE */
          <div className="space-y-4">
            {gruposOrcamentos.map((grupo) => {
              const grupoKey = grupo.cliente_id || "sem_cliente";
              const isExpandido = gruposExpandidos.has(grupoKey);

              return (
                <div
                  key={grupoKey}
                  className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
                >
                  {/* Header do Grupo (Clicável) */}
                  <div
                    className="bg-gradient-to-r from-[#16a34a] to-[#15803d] p-3 sm:p-4 text-white cursor-pointer flex items-center justify-between"
                    onClick={() => toggleGrupo(grupoKey)}
                  >
                    <div className="flex items-center gap-3">
                      {isExpandido ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <Avatar nome={grupo.cliente_nome} avatar_url={grupo.cliente_avatar_url} size="sm" className="border-2 border-white/30" />
                      <div>
                        <h3 className="text-[14px] text-white">
                          {grupo.cliente_nome}
                        </h3>
                        <p className="text-[11px] text-white/80">
                          {grupo.quantidade} orcamento{grupo.quantidade > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[16px] text-white">
                        {formatarMoeda(grupo.valor_total)}
                      </p>
                      <p className="text-[10px] text-white/80">Valor Total</p>
                    </div>
                  </div>

                  {/* Lista de Orçamentos do Grupo (Expandível) */}
                  {isExpandido && (
                    <div className="p-3 sm:p-4 bg-gray-50">
                      <div className={LAYOUT.gridCards}>
                        {grupo.orcamentos.map((orcamento) => (
                          <div
                            key={orcamento.id}
                            className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden"
                            onClick={() =>
                              handleVisualizarOrcamento(orcamento.id)
                            }
                          >
                            <div className="p-3 sm:p-4 space-y-2">
                              <h4 className={`${TYPOGRAPHY.cardTitle} truncate`}>
                                {orcamento.titulo || "Sem titulo"}
                              </h4>

                              {orcamento.obra?.nome && (
                                <div className="flex items-center gap-2">
                                  <span className={`${TYPOGRAPHY.cardMeta} truncate`}>
                                    {orcamento.obra.nome}
                                  </span>
                                </div>
                              )}

                              <div className="pt-2 border-t border-gray-100">
                                <div className="flex items-center justify-between">
                                  <span className={TYPOGRAPHY.cardMeta}>Valor</span>
                                  <span className={TYPOGRAPHY.moneyMedium}>
                                    {formatarMoeda(orcamento.valor_total || 0)}
                                  </span>
                                </div>

                                {orcamento.margem !== null && (
                                  <div className="flex items-center justify-between mt-1">
                                    <span className={TYPOGRAPHY.cardMeta}>Margem</span>
                                    <span className="text-[12px] text-green-600">
                                      {orcamento.margem.toFixed(2)}%
                                    </span>
                                  </div>
                                )}
                              </div>

                              <div className={TYPOGRAPHY.caption}>
                                {formatarData(orcamento.criado_em || "")}
                              </div>
                            </div>

                            <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                className="flex-1 px-3 py-1.5 text-[12px] text-[#16a34a] hover:bg-[#16a34a] hover:text-white rounded-lg transition-colors border border-[#16a34a]"
                              >
                                Ver Detalhes
                              </button>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleEditarOrcamento(e, orcamento.id)}
                                  className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleDuplicarOrcamento(e, orcamento)}
                                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Duplicar"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => handleCompartilharOrcamento(e, orcamento)}
                                  className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                  title="Compartilhar"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          /* MODO INDIVIDUAL */
          <div className={LAYOUT.gridCards}>
            {orcamentosFiltrados.map((orcamento) => (
              <div
                key={orcamento.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer border border-gray-100 overflow-hidden"
                onClick={() => handleVisualizarOrcamento(orcamento.id)}
              >
                {/* Header do Card */}
                <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] p-3 sm:p-4 text-white">
                  <div className="flex items-center gap-3">
                    <Avatar nome={orcamento.cliente?.nome || "?"} size="sm" className="border-2 border-white/30" />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[13px] text-white truncate">
                        {orcamento.titulo || "Sem titulo"}
                      </h3>
                      <p className="text-[11px] text-white/80 truncate">
                        {orcamento.cliente?.nome || "Cliente nao informado"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Conteúdo do Card */}
                <div className="p-3 sm:p-4 space-y-2">
                  {orcamento.obra?.nome && (
                    <p className={`${TYPOGRAPHY.cardMeta} truncate`}>
                      {orcamento.obra.nome}
                    </p>
                  )}

                  <div className="pt-2 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-1">
                      <span className={TYPOGRAPHY.cardMeta}>Valor Total</span>
                      <span className={TYPOGRAPHY.moneyMedium}>
                        {formatarMoeda(orcamento.valor_total || 0)}
                      </span>
                    </div>

                    {orcamento.margem !== null && (
                      <div className="flex items-center justify-between">
                        <span className={TYPOGRAPHY.cardMeta}>Margem</span>
                        <span className="text-[12px] text-green-600">
                          {orcamento.margem.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <div className={TYPOGRAPHY.caption}>
                    Criado em {formatarData(orcamento.criado_em || "")}
                  </div>
                </div>

                {/* Footer do Card */}
                <div className="px-3 py-2 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    className="flex-1 px-3 py-1.5 text-[12px] text-[#16a34a] hover:bg-[#16a34a] hover:text-white rounded-lg transition-colors border border-[#16a34a]"
                  >
                    Ver Detalhes
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleEditarOrcamento(e, orcamento.id)}
                      className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDuplicarOrcamento(e, orcamento)}
                      className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Duplicar"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleCompartilharOrcamento(e, orcamento)}
                      className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      title="Compartilhar"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Estatísticas */}
        {orcamentos.length > 0 && (
          <div className="mt-6 sm:mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Total de Orçamentos</p>
                  <p className="text-[20px] font-normal text-gray-900">
                    {orcamentos.length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4 sm:p-6 border border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg
                    className="w-6 h-6 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-[12px] text-gray-600">Valor Total</p>
                  <p className="text-[20px] font-normal text-gray-900">
                    {formatarMoeda(
                      orcamentos.reduce(
                        (sum, orc) => sum + (orc.valor_total || 0),
                        0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
    </div>
  );
}
