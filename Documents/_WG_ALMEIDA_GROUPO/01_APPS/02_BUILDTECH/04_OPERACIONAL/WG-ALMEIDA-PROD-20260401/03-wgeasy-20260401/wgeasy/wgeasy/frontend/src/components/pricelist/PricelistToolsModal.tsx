/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// MODAL DE FERRAMENTAS DO PRICELIST
// DetecçÍo de duplicidades + SincronizaçÍo SINAPI
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  PricelistDuplicateService,
  type ResultadoAnalise,
  type GrupoDuplicados,
  type ConfiguracaoDeteccao,
  type SugestaoDeduplicacaoBanco,
  type RegraDescritivoCanonico,
} from "@/lib/pricelistDuplicateService";
import {
  PricelistSinapiSyncService,
  type ResultadoSincronizacao,
  type MatchSINAPI,
  type ConfiguracaoSync,
  obterEstatisticasCoberturaSINAPI,
} from "@/lib/pricelistSinapiSyncService";
import type { PricelistItemCompleto, PricelistCategoria } from "@/types/pricelist";
import type { Nucleo } from "@/lib/nucleosApi";
import type { EstadoBrasil } from "@/lib/sinapiIntegracaoService";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  itens: PricelistItemCompleto[];
  categorias: PricelistCategoria[];
  nucleos: Nucleo[];
  onMergeItems?: (manterItemId: string, excluirItemIds: string[]) => Promise<void>;
  onUpdatePrice?: (itemId: string, novoPreco: number) => Promise<void>;
  onRefresh?: () => Promise<void>;
}

type TabAtiva = "duplicados" | "sinapi";

export default function PricelistToolsModal({
  isOpen,
  onClose,
  itens,
  categorias,
  nucleos,
  onMergeItems,
  onUpdatePrice,
  onRefresh,
}: Props) {
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>("duplicados");

  // Estado - Duplicados
  const [analisandoDuplicados, setAnalisandoDuplicados] = useState(false);
  const [resultadoDuplicados, setResultadoDuplicados] = useState<ResultadoAnalise | null>(null);
  const [configDuplicados, setConfigDuplicados] = useState<ConfiguracaoDeteccao>({
    limiarSimilaridade: 0.80,
    ignorarMaiusculas: true,
    ignorarAcentos: true,
    compararCodigos: true,
    compararNomes: true,
    compararFabricante: true,
  });
  const [grupoExpandido, setGrupoExpandido] = useState<string | null>(null);
  const [processandoMerge, setProcessandoMerge] = useState(false);
  const [carregandoSugestoesBanco, setCarregandoSugestoesBanco] = useState(false);
  const [sugestoesBanco, setSugestoesBanco] = useState<SugestaoDeduplicacaoBanco[]>([]);
  const [selecionadasBanco, setSelecionadasBanco] = useState<Set<string>>(new Set());
  const [processandoBanco, setProcessandoBanco] = useState(false);
  const [scoreMinLoteSeguro, setScoreMinLoteSeguro] = useState(1);
  const [limiteLoteSeguro, setLimiteLoteSeguro] = useState(100);
  const [filtroTextoBanco, setFiltroTextoBanco] = useState("");
  const [filtroMotivoBanco, setFiltroMotivoBanco] = useState("todos");
  const [filtroScoreMinBanco, setFiltroScoreMinBanco] = useState(0);
  const [filtroScoreMaxBanco, setFiltroScoreMaxBanco] = useState(1);
  const [paginaBanco, setPaginaBanco] = useState(1);
  const [itensPorPaginaBanco, setItensPorPaginaBanco] = useState(25);
  const [carregandoRegrasBanco, setCarregandoRegrasBanco] = useState(false);
  const [processandoRegrasBanco, setProcessandoRegrasBanco] = useState(false);
  const [regrasDescritivoBanco, setRegrasDescritivoBanco] = useState<RegraDescritivoCanonico[]>([]);
  const [filtroTipoRegraBanco, setFiltroTipoRegraBanco] = useState<"todos" | "sinonimo" | "stopword">("todos");
  const [novaRegraTipo, setNovaRegraTipo] = useState<"sinonimo" | "stopword">("sinonimo");
  const [novaRegraTermo, setNovaRegraTermo] = useState("");
  const [novaRegraSubstituto, setNovaRegraSubstituto] = useState("");
  const [novaRegraPrioridade, setNovaRegraPrioridade] = useState(100);

  // Estado - SINAPI
  const [analisandoSINAPI, setAnalisandoSINAPI] = useState(false);
  const [resultadoSINAPI, setResultadoSINAPI] = useState<ResultadoSincronizacao | null>(null);
  const [estatisticasCobertura, setEstatisticasCobertura] = useState<{
    totalPricelist: number;
    comCodigoSINAPI: number;
    semCodigoSINAPI: number;
    percentualCobertura: number;
  } | null>(null);
  const [configSINAPI, setConfigSINAPI] = useState<ConfiguracaoSync>({
    estado: "SP" as EstadoBrasil,
    limiarDiferencaPreco: 0.05, // 5%
    incluirSemCodigo: true,
  });
  const [processandoAtualizacao, setProcessandoAtualizacao] = useState(false);
  const [itensSelecionadosSync, setItensSelecionadosSync] = useState<Set<string>>(new Set());

  // Resetar ao abrir
  useEffect(() => {
    if (isOpen) {
      setResultadoDuplicados(null);
      setResultadoSINAPI(null);
      setGrupoExpandido(null);
      setItensSelecionadosSync(new Set());
    }
  }, [isOpen]);

  // Carregar estatísticas de cobertura SINAPI
  useEffect(() => {
    if (isOpen && tabAtiva === "sinapi") {
      obterEstatisticasCoberturaSINAPI(configSINAPI.estado)
        .then(setEstatisticasCobertura)
        .catch(console.error);
    }
  }, [isOpen, tabAtiva, configSINAPI.estado]);

  // Analisar duplicados
  const analisarDuplicados = useCallback(async () => {
    setAnalisandoDuplicados(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      const resultado = await service.analisarDuplicidades(itens);
      setResultadoDuplicados(resultado);
    } catch (error) {
      console.error("Erro ao analisar duplicados:", error);
      alert("Erro ao analisar duplicados. Verifique o console.");
    } finally {
      setAnalisandoDuplicados(false);
    }
  }, [itens, configDuplicados]);

  // Analisar SINAPI
  const analisarSINAPI = useCallback(async () => {
    setAnalisandoSINAPI(true);
    try {
      const service = new PricelistSinapiSyncService();
      const resultado = await service.analisarSincronizacao(configSINAPI);
      setResultadoSINAPI(resultado);
    } catch (error) {
      console.error("Erro ao analisar SINAPI:", error);
      alert("Erro ao analisar sincronizaçÍo SINAPI. Verifique o console.");
    } finally {
      setAnalisandoSINAPI(false);
    }
  }, [configSINAPI]);

  // Mesclar itens duplicados
  const handleMergeGrupo = async (grupo: GrupoDuplicados, manterItemId: string) => {
    if (!onMergeItems) return;

    const excluirIds = grupo.itens
      .filter(item => item.id !== manterItemId)
      .map(item => item.id);

    if (excluirIds.length === 0) return;

    const confirmar = confirm(
      `Manter "${grupo.itens.find(i => i.id === manterItemId)?.nome}" e excluir ${excluirIds.length} item(ns)?`
    );

    if (!confirmar) return;

    setProcessandoMerge(true);
    try {
      await onMergeItems(manterItemId, excluirIds);
      // Reanalisar após merge
      if (onRefresh) await onRefresh();
      await analisarDuplicados();
    } catch (error) {
      console.error("Erro ao mesclar:", error);
      alert("Erro ao mesclar itens.");
    } finally {
      setProcessandoMerge(false);
    }
  };

  const carregarSugestoesBanco = useCallback(async () => {
    setCarregandoSugestoesBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      const data = await service.listarSugestoesPendentesBanco(250);
      setSugestoesBanco(data);
      setSelecionadasBanco(new Set());
    } catch (error) {
      console.error("Erro ao carregar sugestões pendentes:", error);
      alert("Erro ao carregar sugestões pendentes de deduplicaçÍo.");
    } finally {
      setCarregandoSugestoesBanco(false);
    }
  }, [configDuplicados]);

  const carregarRegrasDescritivoBanco = useCallback(async () => {
    setCarregandoRegrasBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      const data = await service.listarRegrasDescritivoBanco(filtroTipoRegraBanco);
      setRegrasDescritivoBanco(data);
    } catch (error) {
      console.error("Erro ao carregar regras de descritivo:", error);
      alert("Erro ao carregar regras de descritivo. Confirme se a migration foi aplicada.");
    } finally {
      setCarregandoRegrasBanco(false);
    }
  }, [configDuplicados, filtroTipoRegraBanco]);

  const gerarSugestoesBanco = useCallback(async () => {
    setProcessandoBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      await service.gerarSugestoesBanco({
        limiar: configDuplicados.limiarSimilaridade,
        limite: 3000,
      });
      await carregarSugestoesBanco();
    } catch (error) {
      console.error("Erro ao gerar sugestões no banco:", error);
      alert("Erro ao gerar sugestões de deduplicaçÍo no banco.");
    } finally {
      setProcessandoBanco(false);
    }
  }, [configDuplicados, carregarSugestoesBanco]);

  const toggleSelecaoSugestaoBanco = (id: string) => {
    setSelecionadasBanco((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const aplicarSelecionadasBanco = useCallback(async () => {
    if (selecionadasBanco.size === 0) return;
    const confirmar = confirm(`Aplicar ${selecionadasBanco.size} sugestÍo(ões) selecionadas?`);
    if (!confirmar) return;

    setProcessandoBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      let sucesso = 0;
      let erro = 0;
      for (const id of selecionadasBanco) {
        try {
          await service.aplicarSugestaoBanco(id);
          sucesso += 1;
        } catch {
          erro += 1;
        }
      }
      await carregarSugestoesBanco();
      if (onRefresh) await onRefresh();
      alert(`Merge concluído: ${sucesso} aplicado(s), ${erro} erro(s).`);
    } catch (error) {
      console.error("Erro ao aplicar sugestões selecionadas:", error);
      alert("Erro ao aplicar sugestões.");
    } finally {
      setProcessandoBanco(false);
    }
  }, [selecionadasBanco, configDuplicados, carregarSugestoesBanco, onRefresh]);

  const rejeitarSelecionadasBanco = useCallback(async () => {
    if (selecionadasBanco.size === 0) return;
    const confirmar = confirm(`Rejeitar ${selecionadasBanco.size} sugestÍo(ões) selecionadas?`);
    if (!confirmar) return;

    setProcessandoBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      for (const id of selecionadasBanco) {
        await service.rejeitarSugestaoBanco(id, "RejeiçÍo manual via ferramentas");
      }
      await carregarSugestoesBanco();
      alert("Sugestões rejeitadas.");
    } catch (error) {
      console.error("Erro ao rejeitar sugestões:", error);
      alert("Erro ao rejeitar sugestões.");
    } finally {
      setProcessandoBanco(false);
    }
  }, [selecionadasBanco, configDuplicados, carregarSugestoesBanco]);

  const executarLoteSeguroBanco = useCallback(async (dryRun: boolean) => {
    setProcessandoBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      const resultado = await service.aplicarLoteSeguroBanco({
        minScore: scoreMinLoteSeguro,
        limit: limiteLoteSeguro,
        dryRun,
      });

      if (dryRun) {
        alert(`Lote seguro (simulaçÍo): ${resultado.selecionadas ?? 0} sugestÍo(ões) elegível(eis).`);
      } else {
        alert(`Lote seguro aplicado: ${resultado.aplicadas ?? 0} merge(s), ${resultado.erros ?? 0} erro(s).`);
        if (onRefresh) await onRefresh();
      }

      await carregarSugestoesBanco();
    } catch (error) {
      console.error("Erro no lote seguro:", error);
      alert("Erro ao executar lote seguro de deduplicaçÍo.");
    } finally {
      setProcessandoBanco(false);
    }
  }, [
    configDuplicados,
    scoreMinLoteSeguro,
    limiteLoteSeguro,
    onRefresh,
    carregarSugestoesBanco,
  ]);

  const criarRegraDescritivoBanco = useCallback(async () => {
    if (!novaRegraTermo.trim()) {
      alert("Informe o termo da regra.");
      return;
    }

    setProcessandoRegrasBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      await service.criarRegraDescritivoBanco({
        tipo: novaRegraTipo,
        termo: novaRegraTermo.trim(),
        substituto: novaRegraTipo === "sinonimo" ? (novaRegraSubstituto.trim() || null) : null,
        prioridade: novaRegraPrioridade,
        ativo: true,
      });
      setNovaRegraTermo("");
      setNovaRegraSubstituto("");
      await carregarRegrasDescritivoBanco();
    } catch (error) {
      console.error("Erro ao criar regra de descritivo:", error);
      alert("Erro ao criar regra.");
    } finally {
      setProcessandoRegrasBanco(false);
    }
  }, [
    configDuplicados,
    novaRegraTipo,
    novaRegraTermo,
    novaRegraSubstituto,
    novaRegraPrioridade,
    carregarRegrasDescritivoBanco,
  ]);

  const toggleAtivoRegraDescritivoBanco = useCallback(async (regra: RegraDescritivoCanonico) => {
    setProcessandoRegrasBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      await service.atualizarRegraDescritivoBanco(regra.id, { ativo: !regra.ativo });
      await carregarRegrasDescritivoBanco();
    } catch (error) {
      console.error("Erro ao atualizar regra:", error);
      alert("Erro ao atualizar regra.");
    } finally {
      setProcessandoRegrasBanco(false);
    }
  }, [configDuplicados, carregarRegrasDescritivoBanco]);

  const excluirRegraDescritivoBanco = useCallback(async (regra: RegraDescritivoCanonico) => {
    const confirmar = confirm(`Excluir regra "${regra.tipo}: ${regra.termo}"?`);
    if (!confirmar) return;

    setProcessandoRegrasBanco(true);
    try {
      const service = new PricelistDuplicateService(configDuplicados);
      await service.excluirRegraDescritivoBanco(regra.id);
      await carregarRegrasDescritivoBanco();
    } catch (error) {
      console.error("Erro ao excluir regra:", error);
      alert("Erro ao excluir regra.");
    } finally {
      setProcessandoRegrasBanco(false);
    }
  }, [configDuplicados, carregarRegrasDescritivoBanco]);

  const motivosBanco = useMemo(() => {
    const unicos = new Set<string>();
    for (const s of sugestoesBanco) {
      if (s.motivo) unicos.add(s.motivo);
    }
    return Array.from(unicos).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [sugestoesBanco]);

  const sugestoesBancoFiltradas = useMemo(() => {
    const termo = filtroTextoBanco.trim().toLowerCase();
    const scoreMinEfetivo = Math.min(filtroScoreMinBanco, filtroScoreMaxBanco);
    const scoreMaxEfetivo = Math.max(filtroScoreMinBanco, filtroScoreMaxBanco);
    return sugestoesBanco.filter((s) => {
      const scoreOk = s.score >= scoreMinEfetivo && s.score <= scoreMaxEfetivo;
      if (!scoreOk) return false;

      if (filtroMotivoBanco !== "todos" && s.motivo !== filtroMotivoBanco) return false;

      if (!termo) return true;
      const alvo = [
        s.item_principal_nome,
        s.item_duplicado_nome,
        s.item_principal_unidade,
        s.item_duplicado_unidade,
        s.motivo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }, [
    sugestoesBanco,
    filtroTextoBanco,
    filtroMotivoBanco,
    filtroScoreMinBanco,
    filtroScoreMaxBanco,
  ]);

  const totalPaginasBanco = Math.max(
    1,
    Math.ceil(sugestoesBancoFiltradas.length / itensPorPaginaBanco)
  );

  const sugestoesBancoPaginadas = useMemo(() => {
    const inicio = (paginaBanco - 1) * itensPorPaginaBanco;
    return sugestoesBancoFiltradas.slice(inicio, inicio + itensPorPaginaBanco);
  }, [sugestoesBancoFiltradas, paginaBanco, itensPorPaginaBanco]);

  const todasPaginaSelecionadas =
    sugestoesBancoPaginadas.length > 0 &&
    sugestoesBancoPaginadas.every((s) => selecionadasBanco.has(s.id));

  const toggleSelecionarPaginaBanco = () => {
    setSelecionadasBanco((prev) => {
      const next = new Set(prev);
      if (todasPaginaSelecionadas) {
        for (const s of sugestoesBancoPaginadas) next.delete(s.id);
      } else {
        for (const s of sugestoesBancoPaginadas) next.add(s.id);
      }
      return next;
    });
  };

  useEffect(() => {
    setPaginaBanco(1);
  }, [filtroTextoBanco, filtroMotivoBanco, filtroScoreMinBanco, filtroScoreMaxBanco, itensPorPaginaBanco]);

  useEffect(() => {
    if (paginaBanco > totalPaginasBanco) {
      setPaginaBanco(totalPaginasBanco);
    }
  }, [paginaBanco, totalPaginasBanco]);

  // Atualizar preços selecionados do SINAPI
  const handleAtualizarPrecosSelecionados = async () => {
    if (!onUpdatePrice || itensSelecionadosSync.size === 0) return;

    const confirmar = confirm(
      `Atualizar preços de ${itensSelecionadosSync.size} item(ns) com valores SINAPI?`
    );

    if (!confirmar) return;

    setProcessandoAtualizacao(true);
    let sucesso = 0;
    let erros = 0;

    for (const itemId of itensSelecionadosSync) {
      const match = resultadoSINAPI?.sugestoesAtualizacao.find(
        m => m.itemPricelist.id === itemId
      );

      if (match?.itemSINAPI) {
        try {
          await onUpdatePrice(itemId, match.itemSINAPI.preco_mediano);
          sucesso++;
        } catch {
          erros++;
        }
      }
    }

    setProcessandoAtualizacao(false);
    setItensSelecionadosSync(new Set());

    if (onRefresh) await onRefresh();

    alert(`AtualizaçÍo concluída: ${sucesso} sucesso(s), ${erros} erro(s).`);
  };

  // Toggle seleçÍo item SINAPI
  const toggleSelecaoSINAPI = (itemId: string) => {
    setItensSelecionadosSync(prev => {
      const novo = new Set(prev);
      if (novo.has(itemId)) {
        novo.delete(itemId);
      } else {
        novo.add(itemId);
      }
      return novo;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-wg-primary to-wg-primary/80 px-6 py-4 flex items-center justify-between">
          <h2 className="text-[18px] font-light text-white">Ferramentas do Pricelist</h2>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition text-2xl"
          >
            &times;
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setTabAtiva("duplicados")}
            className={`flex-1 px-4 py-3 text-[14px] font-medium transition ${
              tabAtiva === "duplicados"
                ? "text-wg-primary border-b-2 border-wg-primary bg-wg-primary/5"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            DetecçÍo de Duplicados
          </button>
          <button
            onClick={() => setTabAtiva("sinapi")}
            className={`flex-1 px-4 py-3 text-[14px] font-medium transition ${
              tabAtiva === "sinapi"
                ? "text-wg-primary border-b-2 border-wg-primary bg-wg-primary/5"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            SincronizaçÍo SINAPI
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-auto p-6">
          {tabAtiva === "duplicados" && (
            <div className="space-y-6">
              {/* Configurações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-gray-800 mb-3">Configurações</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-[12px] text-gray-600 block mb-1">
                      Limiar de Similaridade
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.05"
                      value={configDuplicados.limiarSimilaridade}
                      onChange={(e) =>
                        setConfigDuplicados({
                          ...configDuplicados,
                          limiarSimilaridade: parseFloat(e.target.value),
                        })
                      }
                      className="w-full"
                    />
                    <span className="text-[11px] text-gray-500">
                      {Math.round(configDuplicados.limiarSimilaridade * 100)}%
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={configDuplicados.compararNomes}
                      onChange={(e) =>
                        setConfigDuplicados({
                          ...configDuplicados,
                          compararNomes: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Comparar nomes
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={configDuplicados.compararCodigos}
                      onChange={(e) =>
                        setConfigDuplicados({
                          ...configDuplicados,
                          compararCodigos: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Comparar códigos
                  </label>
                  <label className="flex items-center gap-2 text-[12px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={configDuplicados.compararFabricante}
                      onChange={(e) =>
                        setConfigDuplicados({
                          ...configDuplicados,
                          compararFabricante: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Comparar fabricante
                  </label>
                </div>

                <button
                  onClick={analisarDuplicados}
                  disabled={analisandoDuplicados}
                  className="mt-4 px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 disabled:opacity-50 text-[14px] flex items-center gap-2"
                >
                  {analisandoDuplicados ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      Analisar {itens.length} itens
                    </>
                  )}
                </button>
              </div>

              {/* Resultado */}
              {resultadoDuplicados && (
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                      <p className="text-[20px] font-light text-blue-600">
                        {resultadoDuplicados.totalItens}
                      </p>
                      <p className="text-[11px] text-blue-700">Total Analisado</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                      <p className="text-[20px] font-light text-amber-600">
                        {resultadoDuplicados.gruposDuplicados.length}
                      </p>
                      <p className="text-[11px] text-amber-700">Grupos Duplicados</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                      <p className="text-[20px] font-light text-red-600">
                        {resultadoDuplicados.duplicadosPotenciais.length}
                      </p>
                      <p className="text-[11px] text-red-700">Pares Duplicados</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                      <p className="text-[20px] font-light text-green-600">
                        {resultadoDuplicados.tempoAnaliseMs}ms
                      </p>
                      <p className="text-[11px] text-green-700">Tempo de Análise</p>
                    </div>
                  </div>

                  {/* Lista de grupos */}
                  {resultadoDuplicados.gruposDuplicados.length > 0 ? (
                    <div className="space-y-3">
                      <h4 className="text-[14px] font-medium text-gray-800">
                        Grupos de Duplicados ({resultadoDuplicados.gruposDuplicados.length})
                      </h4>

                      {resultadoDuplicados.gruposDuplicados.map((grupo) => (
                        <div
                          key={grupo.id}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() =>
                              setGrupoExpandido(
                                grupoExpandido === grupo.id ? null : grupo.id
                              )
                            }
                            className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-[14px] font-medium text-gray-800">
                                {grupo.itens.length} itens similares
                              </span>
                              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                                {Math.round(grupo.similaridadeMedia * 100)}% similar
                              </span>
                              <span className="text-[11px] text-gray-500">
                                Motivo: {grupo.motivoPrincipal}
                              </span>
                            </div>
                            <svg
                              className={`w-5 h-5 text-gray-400 transition-transform ${
                                grupoExpandido === grupo.id ? "rotate-180" : ""
                              }`}
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>

                          {grupoExpandido === grupo.id && (
                            <div className="p-4 space-y-2">
                              {grupo.itens.map((item) => (
                                <div
                                  key={item.id}
                                  className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg"
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    {item.imagem_url ? (
                                      <img
                                        src={item.imagem_url}
                                        alt={item.nome}
                                        className="w-10 h-10 object-cover rounded"
                                      />
                                    ) : (
                                      <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-[13px] font-medium text-gray-800 truncate">
                                        {item.nome}
                                      </p>
                                      <p className="text-[11px] text-gray-500">
                                        {item.codigo || "Sem código"} · R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleMergeGrupo(grupo, item.id)}
                                    disabled={processandoMerge}
                                    className="px-3 py-1.5 text-[12px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                                  >
                                    Manter este
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[14px]">Nenhum duplicado encontrado!</p>
                      <p className="text-[12px]">Seus itens estÍo bem organizados.</p>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-4 border-t border-gray-200 pt-4">
                <div className="flex flex-wrap gap-2 items-center justify-between">
                  <h4 className="text-[14px] font-medium text-gray-800">
                    DeduplicaçÍo no Banco (Fase 2)
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={carregarSugestoesBanco}
                      disabled={carregandoSugestoesBanco || processandoBanco}
                      className="px-3 py-1.5 text-[12px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      {carregandoSugestoesBanco ? "Carregando..." : "Carregar pendentes"}
                    </button>
                    <button
                      onClick={gerarSugestoesBanco}
                      disabled={processandoBanco}
                      className="px-3 py-1.5 text-[12px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Gerar sugestões
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-gray-50 p-3 rounded-lg">
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Score mínimo (lote)</label>
                    <input
                      type="number"
                      min={0.5}
                      max={1}
                      step={0.01}
                      value={scoreMinLoteSeguro}
                      onChange={(e) => setScoreMinLoteSeguro(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Limite lote</label>
                    <input
                      type="number"
                      min={1}
                      max={500}
                      step={1}
                      value={limiteLoteSeguro}
                      onChange={(e) => setLimiteLoteSeguro(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                    />
                  </div>
                  <button
                    onClick={() => executarLoteSeguroBanco(true)}
                    disabled={processandoBanco}
                    className="px-3 py-1.5 text-[12px] bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50 self-end"
                  >
                    Simular lote seguro
                  </button>
                  <button
                    onClick={() => executarLoteSeguroBanco(false)}
                    disabled={processandoBanco}
                    className="px-3 py-1.5 text-[12px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 self-end"
                  >
                    Aplicar lote seguro
                  </button>
                </div>

                {sugestoesBanco.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[12px] text-gray-700">
                        Pendentes: <strong>{sugestoesBanco.length}</strong> · Filtradas:{" "}
                        <strong>{sugestoesBancoFiltradas.length}</strong> · Página{" "}
                        <strong>{paginaBanco}</strong>/<strong>{totalPaginasBanco}</strong>
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={aplicarSelecionadasBanco}
                          disabled={processandoBanco || selecionadasBanco.size === 0}
                          className="px-3 py-1.5 text-[12px] bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          Aplicar selecionadas ({selecionadasBanco.size})
                        </button>
                        <button
                          onClick={rejeitarSelecionadasBanco}
                          disabled={processandoBanco || selecionadasBanco.size === 0}
                          className="px-3 py-1.5 text-[12px] bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                        >
                          Rejeitar selecionadas
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg">
                      <div className="md:col-span-2">
                        <label className="text-[11px] text-gray-600 block mb-1">Busca</label>
                        <input
                          type="text"
                          value={filtroTextoBanco}
                          onChange={(e) => setFiltroTextoBanco(e.target.value)}
                          placeholder="Nome principal/duplicado, motivo, unidade..."
                          className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Motivo</label>
                        <select
                          value={filtroMotivoBanco}
                          onChange={(e) => setFiltroMotivoBanco(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                        >
                          <option value="todos">Todos</option>
                          {motivosBanco.map((motivo) => (
                            <option key={motivo} value={motivo}>
                              {motivo}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Score mín.</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={filtroScoreMinBanco}
                          onChange={(e) => setFiltroScoreMinBanco(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-600 block mb-1">Score máx.</label>
                        <input
                          type="number"
                          min={0}
                          max={1}
                          step={0.01}
                          value={filtroScoreMaxBanco}
                          onChange={(e) => setFiltroScoreMaxBanco(Number(e.target.value))}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                        />
                      </div>
                    </div>

                    <div className="max-h-80 overflow-auto border border-gray-200 rounded-lg">
                      <table className="w-full text-[12px]">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="p-2 text-left"></th>
                            <th className="p-2 text-left">Score</th>
                            <th className="p-2 text-left">Principal</th>
                            <th className="p-2 text-left">Duplicado</th>
                            <th className="p-2 text-left">Motivo</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sugestoesBancoPaginadas.map((s) => (
                            <tr key={s.id} className="border-t border-gray-100">
                              <td className="p-2">
                                <input
                                  type="checkbox"
                                  checked={selecionadasBanco.has(s.id)}
                                  onChange={() => toggleSelecaoSugestaoBanco(s.id)}
                                />
                              </td>
                              <td className="p-2">{(s.score * 100).toFixed(1)}%</td>
                              <td className="p-2">
                                <div className="font-medium text-gray-800">{s.item_principal_nome}</div>
                                <div className="text-gray-500">
                                  {s.item_principal_unidade || "-"} · R$ {(s.item_principal_preco || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td className="p-2">
                                <div className="font-medium text-gray-800">{s.item_duplicado_nome}</div>
                                <div className="text-gray-500">
                                  {s.item_duplicado_unidade || "-"} · R$ {(s.item_duplicado_preco || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </div>
                              </td>
                              <td className="p-2">
                                <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                                  {s.motivo}
                                </span>
                              </td>
                            </tr>
                          ))}
                          {sugestoesBancoPaginadas.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-3 text-center text-gray-500">
                                Nenhuma sugestÍo para os filtros atuais.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={toggleSelecionarPaginaBanco}
                          disabled={sugestoesBancoPaginadas.length === 0}
                          className="px-3 py-1.5 text-[12px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          {todasPaginaSelecionadas ? "Desmarcar página" : "Selecionar página"}
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-[11px] text-gray-600">Itens/página</label>
                        <select
                          value={itensPorPaginaBanco}
                          onChange={(e) => setItensPorPaginaBanco(Number(e.target.value))}
                          className="px-2 py-1 border border-gray-300 rounded text-[12px]"
                        >
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                        </select>
                        <button
                          onClick={() => setPaginaBanco((p) => Math.max(1, p - 1))}
                          disabled={paginaBanco <= 1}
                          className="px-3 py-1.5 text-[12px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          Anterior
                        </button>
                        <button
                          onClick={() => setPaginaBanco((p) => Math.min(totalPaginasBanco, p + 1))}
                          disabled={paginaBanco >= totalPaginasBanco}
                          className="px-3 py-1.5 text-[12px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                        >
                          Próxima
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3 border-t border-gray-200 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-[14px] font-medium text-gray-800">
                    Dicionário Canônico de Descritivos (Fase 2.1)
                  </h4>
                  <div className="flex gap-2">
                    <select
                      value={filtroTipoRegraBanco}
                      onChange={(e) => setFiltroTipoRegraBanco(e.target.value as "todos" | "sinonimo" | "stopword")}
                      className="px-2 py-1 border border-gray-300 rounded text-[12px]"
                    >
                      <option value="todos">Todos</option>
                      <option value="sinonimo">Sinônimos</option>
                      <option value="stopword">Stopwords</option>
                    </select>
                    <button
                      onClick={carregarRegrasDescritivoBanco}
                      disabled={carregandoRegrasBanco || processandoRegrasBanco}
                      className="px-3 py-1.5 text-[12px] bg-gray-100 text-gray-700 rounded hover:bg-gray-200 disabled:opacity-50"
                    >
                      {carregandoRegrasBanco ? "Carregando..." : "Carregar regras"}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-2 bg-gray-50 p-2 rounded-lg">
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Tipo</label>
                    <select
                      value={novaRegraTipo}
                      onChange={(e) => setNovaRegraTipo(e.target.value as "sinonimo" | "stopword")}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                    >
                      <option value="sinonimo">Sinônimo</option>
                      <option value="stopword">Stopword</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Termo</label>
                    <input
                      type="text"
                      value={novaRegraTermo}
                      onChange={(e) => setNovaRegraTermo(e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Substituto</label>
                    <input
                      type="text"
                      value={novaRegraSubstituto}
                      onChange={(e) => setNovaRegraSubstituto(e.target.value)}
                      disabled={novaRegraTipo !== "sinonimo"}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px] disabled:bg-gray-100"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-600 block mb-1">Prioridade</label>
                    <input
                      type="number"
                      min={1}
                      max={999}
                      value={novaRegraPrioridade}
                      onChange={(e) => setNovaRegraPrioridade(Number(e.target.value))}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-[12px]"
                    />
                  </div>
                  <button
                    onClick={criarRegraDescritivoBanco}
                    disabled={processandoRegrasBanco}
                    className="px-3 py-1.5 text-[12px] bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 self-end"
                  >
                    Adicionar regra
                  </button>
                </div>

                {regrasDescritivoBanco.length > 0 && (
                  <div className="max-h-72 overflow-auto border border-gray-200 rounded-lg">
                    <table className="w-full text-[12px]">
                      <thead className="bg-gray-50 sticky top-0">
                        <tr>
                          <th className="p-2 text-left">Tipo</th>
                          <th className="p-2 text-left">Termo</th>
                          <th className="p-2 text-left">Substituto</th>
                          <th className="p-2 text-left">Prioridade</th>
                          <th className="p-2 text-left">Ativo</th>
                          <th className="p-2 text-left">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regrasDescritivoBanco.map((regra) => (
                          <tr key={regra.id} className="border-t border-gray-100">
                            <td className="p-2">{regra.tipo}</td>
                            <td className="p-2 font-medium text-gray-800">{regra.termo}</td>
                            <td className="p-2">{regra.substituto || "-"}</td>
                            <td className="p-2">{regra.prioridade}</td>
                            <td className="p-2">
                              <button
                                onClick={() => toggleAtivoRegraDescritivoBanco(regra)}
                                disabled={processandoRegrasBanco}
                                className={`px-2 py-0.5 rounded text-[11px] ${
                                  regra.ativo
                                    ? "bg-green-100 text-green-700"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {regra.ativo ? "Ativo" : "Inativo"}
                              </button>
                            </td>
                            <td className="p-2">
                              <button
                                onClick={() => excluirRegraDescritivoBanco(regra)}
                                disabled={processandoRegrasBanco}
                                className="px-2 py-0.5 rounded text-[11px] bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                Excluir
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {tabAtiva === "sinapi" && (
            <div className="space-y-6">
              {/* Estatísticas de Cobertura */}
              {estatisticasCobertura && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                    <p className="text-[20px] font-light text-blue-600">
                      {estatisticasCobertura.totalPricelist}
                    </p>
                    <p className="text-[11px] text-blue-700">Total Pricelist</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                    <p className="text-[20px] font-light text-green-600">
                      {estatisticasCobertura.comCodigoSINAPI}
                    </p>
                    <p className="text-[11px] text-green-700">Com Código SINAPI</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-center">
                    <p className="text-[20px] font-light text-amber-600">
                      {estatisticasCobertura.semCodigoSINAPI}
                    </p>
                    <p className="text-[11px] text-amber-700">Sem Código SINAPI</p>
                  </div>
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                    <p className="text-[20px] font-light text-purple-600">
                      {estatisticasCobertura.percentualCobertura.toFixed(1)}%
                    </p>
                    <p className="text-[11px] text-purple-700">Cobertura</p>
                  </div>
                </div>
              )}

              {/* Configurações */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-[14px] font-medium text-gray-800 mb-3">Configurações</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[12px] text-gray-600 block mb-1">Estado</label>
                    <select
                      value={configSINAPI.estado}
                      onChange={(e) =>
                        setConfigSINAPI({
                          ...configSINAPI,
                          estado: e.target.value as EstadoBrasil,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-[13px]"
                    >
                      <option value="SP">SÍo Paulo</option>
                      <option value="RJ">Rio de Janeiro</option>
                      <option value="MG">Minas Gerais</option>
                      <option value="PR">Paraná</option>
                      <option value="RS">Rio Grande do Sul</option>
                      <option value="BA">Bahia</option>
                      <option value="DF">Distrito Federal</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[12px] text-gray-600 block mb-1">
                      Limiar de Diferença (%)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={Math.round(configSINAPI.limiarDiferencaPreco * 100)}
                      onChange={(e) =>
                        setConfigSINAPI({
                          ...configSINAPI,
                          limiarDiferencaPreco: parseInt(e.target.value) / 100,
                        })
                      }
                      className="w-full px-2 py-1.5 border border-gray-300 rounded text-[13px]"
                    />
                    <span className="text-[10px] text-gray-500">
                      Sugerir atualizaçÍo se diferença for maior
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-[12px] text-gray-700">
                    <input
                      type="checkbox"
                      checked={configSINAPI.incluirSemCodigo}
                      onChange={(e) =>
                        setConfigSINAPI({
                          ...configSINAPI,
                          incluirSemCodigo: e.target.checked,
                        })
                      }
                      className="w-4 h-4"
                    />
                    Incluir itens sem código SINAPI
                  </label>
                </div>

                <button
                  onClick={analisarSINAPI}
                  disabled={analisandoSINAPI}
                  className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-[14px] flex items-center gap-2"
                >
                  {analisandoSINAPI ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Analisando...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Analisar SincronizaçÍo
                    </>
                  )}
                </button>
              </div>

              {/* Resultado SINAPI */}
              {resultadoSINAPI && (
                <div className="space-y-4">
                  {/* Estatísticas */}
                  <div className="grid grid-cols-5 gap-3">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-2 text-center">
                      <p className="text-[16px] font-light text-gray-600">
                        {resultadoSINAPI.totalAnalisado}
                      </p>
                      <p className="text-[10px] text-gray-500">Analisados</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center">
                      <p className="text-[16px] font-light text-green-600">
                        {resultadoSINAPI.comMatchExato}
                      </p>
                      <p className="text-[10px] text-green-700">Match Exato</p>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 text-center">
                      <p className="text-[16px] font-light text-blue-600">
                        {resultadoSINAPI.comMatchAproximado}
                      </p>
                      <p className="text-[10px] text-blue-700">Aproximado</p>
                    </div>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-center">
                      <p className="text-[16px] font-light text-amber-600">
                        {resultadoSINAPI.semMatch}
                      </p>
                      <p className="text-[10px] text-amber-700">Sem Match</p>
                    </div>
                    <div className="bg-red-50 border border-red-200 rounded-lg p-2 text-center">
                      <p className="text-[16px] font-light text-red-600">
                        {resultadoSINAPI.precosDesatualizados}
                      </p>
                      <p className="text-[10px] text-red-700">Desatualizados</p>
                    </div>
                  </div>

                  {/* Sugestões de atualizaçÍo */}
                  {resultadoSINAPI.sugestoesAtualizacao.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[14px] font-medium text-gray-800">
                          Sugestões de AtualizaçÍo ({resultadoSINAPI.sugestoesAtualizacao.length})
                        </h4>
                        {itensSelecionadosSync.size > 0 && onUpdatePrice && (
                          <button
                            onClick={handleAtualizarPrecosSelecionados}
                            disabled={processandoAtualizacao}
                            className="px-3 py-1.5 bg-green-600 text-white rounded text-[12px] hover:bg-green-700 disabled:opacity-50 flex items-center gap-1"
                          >
                            {processandoAtualizacao ? "Atualizando..." : `Atualizar ${itensSelecionadosSync.size} selecionado(s)`}
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-auto space-y-2">
                        {resultadoSINAPI.sugestoesAtualizacao.map((match) => (
                          <div
                            key={match.itemPricelist.id}
                            className={`p-3 border rounded-lg ${
                              itensSelecionadosSync.has(match.itemPricelist.id)
                                ? "border-blue-400 bg-blue-50"
                                : "border-gray-200"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              {onUpdatePrice && match.itemSINAPI && (
                                <input
                                  type="checkbox"
                                  checked={itensSelecionadosSync.has(match.itemPricelist.id)}
                                  onChange={() => toggleSelecaoSINAPI(match.itemPricelist.id)}
                                  className="w-4 h-4 mt-1"
                                />
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-gray-800 truncate">
                                  {match.itemPricelist.nome}
                                </p>
                                <div className="flex items-center gap-4 mt-1 text-[11px]">
                                  <span className="text-gray-500">
                                    Atual: R$ {match.itemPricelist.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                  </span>
                                  {match.itemSINAPI && (
                                    <>
                                      <span className="text-green-600">
                                        SINAPI: R$ {match.itemSINAPI.preco_mediano.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.5 rounded ${
                                          (match.percentualDiferenca || 0) > 0
                                            ? "bg-red-100 text-red-700"
                                            : "bg-green-100 text-green-700"
                                        }`}
                                      >
                                        {(match.percentualDiferenca || 0) > 0 ? "+" : ""}
                                        {((match.percentualDiferenca || 0) * 100).toFixed(1)}%
                                      </span>
                                    </>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      match.tipoMatch === "exato"
                                        ? "bg-green-100 text-green-700"
                                        : match.tipoMatch === "aproximado"
                                        ? "bg-blue-100 text-blue-700"
                                        : match.tipoMatch === "sugerido"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {match.tipoMatch}
                                  </span>
                                  <span
                                    className={`text-[10px] px-1.5 py-0.5 rounded ${
                                      match.recomendacao === "atualizar"
                                        ? "bg-green-100 text-green-700"
                                        : match.recomendacao === "revisar"
                                        ? "bg-amber-100 text-amber-700"
                                        : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {match.recomendacao}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {resultadoSINAPI.sugestoesAtualizacao.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <svg className="w-12 h-12 mx-auto text-green-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-[14px]">Preços estÍo atualizados!</p>
                      <p className="text-[12px]">Nenhuma diferença significativa encontrada.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-[14px]"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}
/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */

