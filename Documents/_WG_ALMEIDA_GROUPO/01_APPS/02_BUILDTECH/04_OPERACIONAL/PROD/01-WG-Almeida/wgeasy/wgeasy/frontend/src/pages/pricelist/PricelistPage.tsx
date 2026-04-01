/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Pricelist (Catálogo de Itens)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  listarCategorias,
  listarSubcategorias,
  listarItens,
  atualizarItem,
  criarItem,
  deletarItem,
  type PricelistCategoria,
  type PricelistItemFormData,
  type PricelistItemCompleto,
  type PricelistSubcategoria,
} from "@/lib/pricelistApi";
import { sincronizarItensComPricelist, sincronizarItensPorPricelistItem } from "@/lib/propostasApi";
import { supabase } from "@/lib/supabaseClient";
import { listarNucleos, type Nucleo } from "@/lib/nucleosApi";
import {
  getTipoItemLabel,
  getTipoItemColor,
  type TipoPricelist,
} from "@/types/pricelist";
import { getCorCategoria, getOrdemCategoria } from "@/config/categoriasConfig";
import { formatNumber } from "@/design-system";
import PricelistToolsModal from "@/components/pricelist/PricelistToolsModal";
import { normalizeSearchTerm } from "@/utils/searchUtils";

export default function PricelistPage() {
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<PricelistSubcategoria[]>([]);
  const [itens, setItens] = useState<PricelistItemCompleto[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string | null>(
    null
  );
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] =
    useState<string | null>(null);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [filtroNucleo, setFiltroNucleo] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroTipoServico, setFiltroTipoServico] = useState<string>("");
  const [filtroGuia, setFiltroGuia] = useState<string>("");
  const [filtroAmbiente, setFiltroAmbiente] = useState<string>("");
  const [precosEmEdicao, setPrecosEmEdicao] = useState<Record<string, string>>(
    {}
  );
  const [salvandoInline, setSalvandoInline] = useState<Record<string, boolean>>(
    {}
  );
  const [sincronizando, setSincronizando] = useState(false);
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [modoVisualizacao, setModoVisualizacao] = useState<"tabela" | "cards" | "categorias">("categorias");
  const [itensSelecionados, setItensSelecionados] = useState<Set<string>>(new Set());
  const [processandoAcao, setProcessandoAcao] = useState(false);
  const [showToolsModal, setShowToolsModal] = useState(false);
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set());
  const ITENS_POR_PAGINA = 50;
  const CARDS_POR_PAGINA = 32; // 8 cards por linha x 4 linhas

  // Sincronizar itens do pricelist com propostas existentes
  async function handleSincronizarPropostas() {
    if (!confirm("Deseja sincronizar todos os itens das propostas com os dados atuais do pricelist?\n\nIsso atualizará categoria, núcleo e tipo de todos os itens vinculados.")) {
      return;
    }

    setSincronizando(true);
    try {
      const resultado = await sincronizarItensComPricelist();
      toast({ title: "SincronizaçÍo concluída", description: resultado.detalhes[0] || `${resultado.atualizados} itens atualizados${resultado.erros > 0 ? ` | ⚠️ ${resultado.erros} erros` : ""}` });
    } catch (error) {
      console.error("Erro ao sincronizar:", error);
      toast({ title: "Erro", description: "Erro ao sincronizar itens. Verifique o console.", variant: "destructive" });
    } finally {
      setSincronizando(false);
    }
  }

  // Funções de seleçÍo
  function toggleSelecaoItem(itemId: string) {
    setItensSelecionados(prev => {
      const novoSet = new Set(prev);
      if (novoSet.has(itemId)) {
        novoSet.delete(itemId);
      } else {
        novoSet.add(itemId);
      }
      return novoSet;
    });
  }

  function toggleSelecaoTodos() {
    if (itensSelecionados.size === itensPaginados.length) {
      setItensSelecionados(new Set());
    } else {
      setItensSelecionados(new Set(itensPaginados.map(i => i.id)));
    }
  }

  function limparSelecao() {
    setItensSelecionados(new Set());
  }

  // Duplicar itens selecionados
  async function duplicarSelecionados() {
    if (itensSelecionados.size === 0) return;

    if (!confirm(`Deseja duplicar ${itensSelecionados.size} item(ns)?\n\nOs itens duplicados terÍo "(Cópia)" no nome.`)) {
      return;
    }

    setProcessandoAcao(true);
    let sucesso = 0;
    let erros = 0;

    for (const itemId of itensSelecionados) {
      const itemOriginal = itens.find(i => i.id === itemId);
      if (!itemOriginal) continue;

      try {
        await criarItem({
          nome: `${itemOriginal.nome} (Cópia)`,
          categoria_id: itemOriginal.categoria_id,
          subcategoria_id: itemOriginal.subcategoria_id,
          nucleo_id: itemOriginal.nucleo_id,
          codigo: itemOriginal.codigo ? `${itemOriginal.codigo}-COPIA` : undefined,
          descricao: itemOriginal.descricao || undefined,
          unidade: itemOriginal.unidade,
          preco: itemOriginal.preco,
          producao_diaria: itemOriginal.producao_diaria,
          custo_aquisicao: itemOriginal.custo_aquisicao,
          margem_lucro: itemOriginal.margem_lucro,
          markup: itemOriginal.markup,
          custo_operacional: itemOriginal.custo_operacional,
          fabricante: itemOriginal.fabricante,
          linha: itemOriginal.linha,
          modelo: itemOriginal.modelo,
          formato: itemOriginal.formato,
          imagem_url: itemOriginal.imagem_url || undefined,
          link_produto: itemOriginal.link_produto,
          ativo: true,
        });
        sucesso++;
      } catch (error) {
        console.error("Erro ao duplicar item:", error);
        erros++;
      }
    }

    setProcessandoAcao(false);
    limparSelecao();

    if (sucesso > 0) {
      await carregarDados();
      toast({ title: "Sucesso", description: `${sucesso} item(ns) duplicado(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ""}` });
    } else {
      toast({ title: "Erro", description: "Erro ao duplicar itens.", variant: "destructive" });
    }
  }

  // Excluir itens selecionados
  async function excluirSelecionados() {
    if (itensSelecionados.size === 0) return;

    if (!confirm(`⚠️ ATENÇÍO: Deseja EXCLUIR permanentemente ${itensSelecionados.size} item(ns)?\n\nEsta açÍo nÍo pode ser desfeita!`)) {
      return;
    }

    setProcessandoAcao(true);
    let sucesso = 0;
    let erros = 0;

    for (const itemId of itensSelecionados) {
      try {
        await deletarItem(itemId);
        sucesso++;
      } catch (error) {
        console.error("Erro ao excluir item:", error);
        erros++;
      }
    }

    setProcessandoAcao(false);
    limparSelecao();

    if (sucesso > 0) {
      await carregarDados();
      toast({ title: "Sucesso", description: `${sucesso} item(ns) excluído(s) com sucesso!${erros > 0 ? ` (${erros} erro(s))` : ""}` });
    } else {
      toast({ title: "Erro", description: "Erro ao excluir itens.", variant: "destructive" });
    }
  }

  // Mesclar itens selecionados (mantém o primeiro, exclui os demais)
  async function mesclarSelecionados() {
    if (itensSelecionados.size < 2) {
      toast({ title: "AtençÍo", description: "Selecione pelo menos 2 itens para mesclar." });
      return;
    }

    // Pegar os itens selecionados
    const idsArray = Array.from(itensSelecionados);
    const itensSelecionadosArray = idsArray
      .map(id => itens.find(i => i.id === id))
      .filter((i): i is PricelistItemCompleto => i !== undefined);

    if (itensSelecionadosArray.length < 2) return;

    // Montar lista para o usuário escolher qual manter
    const opcoes = itensSelecionadosArray
      .map((item, index) => `${index + 1}. ${item.nome} (R$ ${item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })})`)
      .join("\n");

    const escolha = prompt(
      `🔀 MESCLAR ITENS\n\nEscolha o número do item que será MANTIDO (os demais serÍo excluídos):\n\n${opcoes}\n\nDigite o número (1-${itensSelecionadosArray.length}):`
    );

    if (!escolha) return;

    const iÍndice = parseInt(escolha, 10) - 1;
    if (isNaN(iÍndice) || iÍndice < 0 || iÍndice >= itensSelecionadosArray.length) {
      toast({ title: "AtençÍo", description: "Número inválido. OperaçÍo cancelada." });
      return;
    }

    const itemPrincipal = itensSelecionadosArray[iÍndice];
    const itensParaExcluir = itensSelecionadosArray.filter((_, i) => i !== iÍndice);

    const confirmar = confirm(
      `✅ Item a MANTER:\n${itemPrincipal.nome}\n\n❌ Itens a EXCLUIR (${itensParaExcluir.length}):\n${itensParaExcluir.map(i => `• ${i.nome}`).join("\n")}\n\nConfirmar mesclagem?`
    );

    if (!confirmar) return;

    setProcessandoAcao(true);
    let excluidos = 0;
    let erros = 0;

    for (const item of itensParaExcluir) {
      try {
        await deletarItem(item.id);
        excluidos++;
      } catch (error) {
        console.error("Erro ao excluir item na mesclagem:", error);
        erros++;
      }
    }

    setProcessandoAcao(false);
    limparSelecao();

    if (excluidos > 0) {
      await carregarDados();
      toast({ title: "Mesclagem concluída", description: `✅ Item mantido: ${itemPrincipal.nome} | ❌ ${excluidos} item(ns) excluído(s)${erros > 0 ? ` | ⚠️ ${erros} erro(s)` : ""}` });
    } else {
      toast({ title: "Erro", description: "Erro ao mesclar itens.", variant: "destructive" });
    }
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      const [categoriasData, subcategoriasData, itensData, nucleosData] = await Promise.all([
        listarCategorias(),
        listarSubcategorias(),
        listarItens(),
        listarNucleos(),
      ]);
      const ordemNucleos = [
        "Arquitetura",
        "Engenharia",
        "Marcenaria",
        "Materiais",
        "Geral",
        "Produtos",
      ];
      const nucleosFiltrados = nucleosData
        .filter((n) => ordemNucleos.includes(n.nome))
        .sort(
          (a, b) => ordemNucleos.indexOf(a.nome) - ordemNucleos.indexOf(b.nome)
        );

      setCategorias(categoriasData);
      setSubcategorias(subcategoriasData);
      setNucleos(nucleosFiltrados);
      setItens(itensData);
    } catch (error) {
      console.error("Erro ao carregar pricelist:", error);
    } finally {
      setLoading(false);
    }
  }


  const tipoOptions: { value: TipoPricelist; label: string }[] = (
    ["mao_obra", "material", "servico", "produto"] as TipoPricelist[]
  ).map((tipo) => ({
    value: tipo,
    label: getTipoItemLabel(tipo),
  }));

  const tipoServicosDisponiveis = useMemo(() => {
    const values = categorias
      .map((cat) => cat.tipo_servico)
      .filter((valor): valor is string => Boolean(valor));
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [categorias]);

  const guiasDisponiveis = useMemo(() => {
    const values = categorias.flatMap((cat) => [
      cat.guia_principal,
      ...(cat.guias || []),
    ]);
    const filtrados = values.filter((valor): valor is string => Boolean(valor));
    return Array.from(new Set(filtrados)).sort((a, b) => a.localeCompare(b));
  }, [categorias]);

  const ambientesDisponiveis = useMemo(() => {
    const values = categorias.flatMap((cat) =>
      (cat.ambientes || []).map((amb) => amb.nome)
    );
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  }, [categorias]);


  
  function formatarNucleoLabel(nucleo?: Nucleo | null) {
    if (!nucleo) return "Sem nucleo";
    if (nucleo.nome === "Geral") return "Materiais";
    return nucleo.nome;
  }

  function formatarLabelCategoria(cat: PricelistCategoria) {
    if (!cat) return "-";

    const nomeOriginal = cat.nome || "";
    const nomeSemPrefixoCodigo = nomeOriginal
      .replace(/^\s*\d{1,4}\s*[/-]\s*/i, "")
      .replace(/^\s*[A-Z]{2,10}\s*[/-]\s*/i, "")
      .trim();

    if (cat.codigo) {
      const nomeExibicao = nomeSemPrefixoCodigo || nomeOriginal;
      if (!nomeExibicao) return cat.codigo;
      return `${cat.codigo} - ${nomeExibicao}`;
    }

    return `${String(cat.ordem || 0).padStart(3, "0")} - ${cat.nome}`;
  }

  async function salvarInline(
    itemId: string,
    campo: "categoria" | "subcategoria" | "tipo" | "preco" | "nucleo",
    payload: Partial<
      Pick<
        PricelistItemCompleto,
        "categoria_id" | "subcategoria_id" | "tipo" | "preco" | "nucleo_id"
      >
    >
  ) {
    const itemAnterior = itens.find((i) => i.id === itemId);
    if (!itemAnterior) return;

    setSalvandoInline((prev) => ({ ...prev, [`${itemId}-${campo}`]: true }));

    setItens((prev) =>
      prev.map((item) => {
        if (item.id !== itemId) return item;

        const categoriaAtualizada =
          payload.categoria_id !== undefined
            ? payload.categoria_id
              ? categorias.find((cat) => cat.id === payload.categoria_id) || null
              : null
            : item.categoria;
        const subcategoriaAtualizada =
          payload.subcategoria_id !== undefined
            ? payload.subcategoria_id
              ? subcategorias.find((sub) => sub.id === payload.subcategoria_id) ||
                null
              : null
            : item.subcategoria;

        return {
          ...item,
          ...payload,
          nucleo_id:
            payload.nucleo_id !== undefined ? payload.nucleo_id : item.nucleo_id,
          categoria: categoriaAtualizada || undefined,
          subcategoria: subcategoriaAtualizada || undefined,
        };
      })
    );

    const payloadLimpo: Partial<
      Pick<
        PricelistItemFormData,
        "categoria_id" | "subcategoria_id" | "tipo" | "preco" | "nucleo_id"
      >
    > =
      {};
    if (payload.categoria_id !== undefined) payloadLimpo.categoria_id = payload.categoria_id;
    if (payload.subcategoria_id !== undefined) payloadLimpo.subcategoria_id = payload.subcategoria_id;
    if (payload.tipo != null) payloadLimpo.tipo = payload.tipo;
    if (payload.preco !== undefined) payloadLimpo.preco = payload.preco;
    if (payload.nucleo_id !== undefined) payloadLimpo.nucleo_id = payload.nucleo_id;

    try {
      await atualizarItem(itemId, payloadLimpo);
      if (campo !== "preco") {
        try {
          await sincronizarItensPorPricelistItem(itemId);
        } catch (syncError) {
          console.warn("Falha ao sincronizar item editado com propostas:", syncError);
        }
      }
    } catch (error) {
      console.error("Erro ao salvar edi‡Æo r pida do item:", error);
      setItens((prev) =>
        prev.map((item) => (item.id === itemId && itemAnterior ? itemAnterior : item))
      );
      toast({ title: "Erro", description: "NÍo foi possível salvar a alteraçÍo. Tente novamente.", variant: "destructive" });
    } finally {
      setSalvandoInline((prev) => {
        const novo = { ...prev };
        delete novo[`${itemId}-${campo}`];
        return novo;
      });
    }
  }

  const handleSalvarPreco = async (item: PricelistItemCompleto) => {
    const precoFormatadoAtual = item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const valorDigitado = precosEmEdicao[item.id] ?? precoFormatadoAtual;

    const valorLimpo = valorDigitado.trim();
    if (!valorLimpo) {
      toast({ title: "AtençÍo", description: "Digite um valor de preço válido." });
      setPrecosEmEdicao((prev) => ({ ...prev, [item.id]: precoFormatadoAtual }));
      return;
    }

    const normalizado = Number(
      valorLimpo.replace(/\s/g, "").replace(/\./g, "").replace(",", ".")
    );

    if (Number.isNaN(normalizado)) {
      toast({ title: "AtençÍo", description: "Digite um valor de preço válido." });
      setPrecosEmEdicao((prev) => ({ ...prev, [item.id]: precoFormatadoAtual }));
      return;
    }

    await salvarInline(item.id, "preco", { preco: normalizado });
    // Formatar no padrÍo brasileiro após salvar
    const novoPrecoFormatado = normalizado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    setPrecosEmEdicao((prev) => ({ ...prev, [item.id]: novoPrecoFormatado }));
  };

  const handleCategoriaChange = async (
    item: PricelistItemCompleto,
    categoriaId: string
  ) => {
    await salvarInline(item.id, "categoria", {
      categoria_id: categoriaId || null,
      subcategoria_id: null,
    });
  };

  const handleSubcategoriaChange = async (
    item: PricelistItemCompleto,
    subcategoriaId: string
  ) => {
    await salvarInline(item.id, "subcategoria", {
      subcategoria_id: subcategoriaId || null,
    });
  };

  const handleTipoChange = async (item: PricelistItemCompleto, tipo: TipoPricelist) => {
    await salvarInline(item.id, "tipo", { tipo });
  };

  const handleNucleoChange = async (item: PricelistItemCompleto, nucleoId: string) => {
    await salvarInline(item.id, "nucleo", {
      nucleo_id: nucleoId || null,
      categoria_id: null,
    });
  };

  // Filtrar itens
  const itensFiltrados = itens.filter((item) => {
    // Filtro por núcleo
    if (filtroNucleo && item.nucleo_id !== filtroNucleo) {
      return false;
    }
    // Filtro por categoria
    if (categoriaSelecionada && item.categoria_id !== categoriaSelecionada) {
      return false;
    }
    // Filtro por subcategoria
    if (subcategoriaSelecionada && item.subcategoria_id !== subcategoriaSelecionada) {
      return false;
    }

    // Filtro por tipo
    if (filtroTipo !== "todos" && item.tipo !== filtroTipo) {
      return false;
    }

    // Filtro por tipo de serviço
    const categoriaAtual = item.categoria;
    if (
      filtroTipoServico &&
      categoriaAtual?.tipo_servico !== filtroTipoServico
    ) {
      return false;
    }

    // Filtro por guia
    if (filtroGuia) {
      const guiasDisponiveisItem = new Set<string>();
      if (categoriaAtual?.guia_principal) {
        guiasDisponiveisItem.add(categoriaAtual.guia_principal);
      }
      if (categoriaAtual?.guias) {
        categoriaAtual.guias.forEach((guia) => guiasDisponiveisItem.add(guia));
      }
      if (!guiasDisponiveisItem.has(filtroGuia)) {
        return false;
      }
    }

    // Filtro por ambiente
    if (filtroAmbiente) {
      const ambientesItem = categoriaAtual?.ambientes || [];
      if (!ambientesItem.some((amb) => amb.nome === filtroAmbiente)) {
        return false;
      }
    }

    // Busca por nome/código
    if (busca) {
      const buscaLower = normalizeSearchTerm(busca);
      return (
        normalizeSearchTerm(item.nome).includes(buscaLower) ||
        normalizeSearchTerm(item.codigo || "").includes(buscaLower)
      );
    }

    return true;
  });

  // PaginaçÍo (nÍo aplicada no modo categorias)
  const itensPorPagina = modoVisualizacao === "cards" ? CARDS_POR_PAGINA : ITENS_POR_PAGINA;
  const totalPaginas = modoVisualizacao === "categorias" ? 1 : Math.ceil(itensFiltrados.length / itensPorPagina);
  const iÍndiceInicio = (paginaAtual - 1) * itensPorPagina;
  const itensPaginados = modoVisualizacao === "categorias"
    ? itensFiltrados
    : itensFiltrados.slice(iÍndiceInicio, iÍndiceInicio + itensPorPagina);

  // Agrupar itens por categoria para modo categorias
  const itensPorCategoria = useMemo(() => {
    const grupos: Record<string, PricelistItemCompleto[]> = {};
    const categoriasValidas = new Set(categorias.map((categoria) => categoria.id));

    itensFiltrados.forEach((item) => {
      const categoriaIdValida = item.categoria_id && categoriasValidas.has(item.categoria_id);
      const catId = categoriaIdValida ? item.categoria_id! : "sem_categoria";
      if (!grupos[catId]) {
        grupos[catId] = [];
      }
      grupos[catId].push(item);
    });

    return grupos;
  }, [categorias, itensFiltrados]);

  const filtrosAtivos = Boolean(
    busca.trim() ||
      filtroTipo !== "todos" ||
      filtroNucleo ||
      categoriaSelecionada ||
      subcategoriaSelecionada ||
      filtroTipoServico ||
      filtroGuia ||
      filtroAmbiente
  );

  const categoriasExibidas = useMemo(
    () =>
      categorias
        .filter((cat) => cat.ativo)
        .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
        .filter(
          (cat) => !filtrosAtivos || (itensPorCategoria[cat.id]?.length ?? 0) > 0
        ),
    [categorias, filtrosAtivos, itensPorCategoria]
  );

  // FunçÍo para alternar expansÍo de categoria
  function toggleCategoriaExpandida(categoriaId: string) {
    setCategoriasExpandidas((prev) => {
      const novoSet = new Set(prev);
      if (novoSet.has(categoriaId)) {
        novoSet.delete(categoriaId);
      } else {
        novoSet.add(categoriaId);
      }
      return novoSet;
    });
  }

  // Expandir/colapsar todas as categorias
  function expandirTodasCategorias() {
    const todasIds = categoriasExibidas.map((c) => c.id);
    if (itensPorCategoria["sem_categoria"]?.length > 0) {
      todasIds.push("sem_categoria");
    }
    setCategoriasExpandidas(new Set(todasIds));
  }

  function colapsarTodasCategorias() {
    setCategoriasExpandidas(new Set());
  }

  // Reset página e seleçÍo quando filtros ou modo de visualizaçÍo mudam
  useEffect(() => {
    setPaginaAtual(1);
    setItensSelecionados(new Set());
  }, [
    busca,
    filtroTipo,
    filtroNucleo,
    categoriaSelecionada,
    subcategoriaSelecionada,
    filtroTipoServico,
    filtroGuia,
    filtroAmbiente,
    modoVisualizacao,
  ]);

  useEffect(() => {
    if (modoVisualizacao !== "categorias" || !filtrosAtivos) {
      return;
    }

    const ids = categoriasExibidas.map((categoria) => categoria.id);
    if (itensPorCategoria["sem_categoria"]?.length > 0) {
      ids.push("sem_categoria");
    }

    setCategoriasExpandidas(new Set(ids));
  }, [modoVisualizacao, filtrosAtivos, categoriasExibidas, itensPorCategoria]);

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-wg-primary to-wg-primary/80 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Pricelist</h1>
              <p className="text-[12px] text-gray-600">Catalogo de itens de mao de obra e materiais</p>
            </div>
          </div>

          {/* Botoes de acao */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setShowToolsModal(true)}
              className="px-3 py-1.5 border border-indigo-300 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 text-[14px] flex items-center gap-1.5"
              title="Ferramentas: DetecçÍo de duplicados e SincronizaçÍo SINAPI"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Ferramentas
            </button>
            <button
              type="button"
              onClick={() => navigate("/pricelist/categorias")}
              className="px-3 py-1.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-[13px] font-normal"
            >
              Categorias
            </button>
          <button
            type="button"
            onClick={handleSincronizarPropostas}
            disabled={sincronizando}
            className="px-3 py-1.5 border border-purple-300 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-[14px] flex items-center gap-1.5 disabled:opacity-50"
            title="Atualiza categoria, núcleo e tipo dos itens em todas as propostas"
          >
            {sincronizando ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            {sincronizando ? "Sincronizando..." : "Sincronizar Propostas"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricelist/importar-imagens")}
            className="px-3 py-1.5 border border-orange-300 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 text-[14px] flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            Importar Imagens
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricelist/importar-lote")}
            className="px-3 py-1.5 border border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-[14px] flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Importar em Lote
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricelist/exportar-importar")}
            className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[14px] flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={() => navigate("/pricelist/novo")}
            className="px-3 py-1.5 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 text-[14px] flex items-center gap-1.5"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Novo Item
            </button>
          </div>
        </div>
      </div>

      {/* Busca e Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
        {/* Busca */}
        <div className="relative">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome ou código..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary"
          />
        </div>

        {/* Filtros - Linha única com scroll horizontal */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2">
          {/* Núcleo */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Núcleo:</span>
            <select
              value={filtroNucleo || ""}
              onChange={(e) => {
                setFiltroNucleo(e.target.value || null);
                setCategoriaSelecionada(null);
                setSubcategoriaSelecionada(null);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary"
            >
              <option value="">Todos</option>
              {nucleos.map((n) => (
                <option key={n.id} value={n.id}>
                  {formatarNucleoLabel(n)}
                </option>
              ))}
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          {/* Tipo */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Tipo:</span>
            <div className="flex gap-1">
              {[
                { value: "todos", label: "TODOS" },
                { value: "mao_obra", label: "MDO" },
                { value: "material", label: "MAT" },
                { value: "servico", label: "SERV" },
                { value: "produto", label: "PROD" },
              ].map((tipo) => (
                <button
                  key={tipo.value}
                  onClick={() => setFiltroTipo(tipo.value)}
                  className={`px-2 py-1 rounded text-[11px] ${
                    filtroTipo === tipo.value
                      ? "bg-wg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tipo.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          {/* Categoria */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Cat:</span>
            <select
              value={categoriaSelecionada || ""}
              onChange={(e) => {
                setCategoriaSelecionada(e.target.value || null);
                setSubcategoriaSelecionada(null);
              }}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary max-w-[150px]"
            >
              <option value="">Todas</option>
              {categorias.map((cat) => {
                const codigoDisplay = cat.ordem !== undefined && cat.codigo
                  ? `${String(cat.ordem).padStart(3, "0")}-${cat.codigo} - `
                  : cat.codigo
                  ? `${cat.codigo} - `
                  : "";
                return (
                  <option key={cat.id} value={cat.id}>
                    {codigoDisplay}{cat.nome}
                  </option>
                );
              })}
            </select>
          </div>

          {/* Subcategoria */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Sub:</span>
            <select
              value={subcategoriaSelecionada || ""}
              onChange={(e) => setSubcategoriaSelecionada(e.target.value || null)}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary max-w-[120px]"
            >
              <option value="">Todas</option>
              {subcategorias
                .filter((sub) =>
                  categoriaSelecionada ? sub.categoria_id === categoriaSelecionada : true
                )
                .map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.nome}
                  </option>
                ))}
            </select>
          </div>

          <div className="w-px h-6 bg-gray-200 shrink-0" />

          {/* Tipo de Serviço */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Serviço:</span>
            <select
              value={filtroTipoServico}
              onChange={(e) => setFiltroTipoServico(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary max-w-[100px]"
            >
              <option value="">Todos</option>
              {tipoServicosDisponiveis.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>

          {/* Guia */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Guia:</span>
            <select
              value={filtroGuia}
              onChange={(e) => setFiltroGuia(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary max-w-[100px]"
            >
              <option value="">Todos</option>
              {guiasDisponiveis.map((guia) => (
                <option key={guia} value={guia}>
                  {guia}
                </option>
              ))}
            </select>
          </div>

          {/* Ambiente */}
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[11px] text-gray-600">Amb:</span>
            <select
              value={filtroAmbiente}
              onChange={(e) => setFiltroAmbiente(e.target.value)}
              className="px-2 py-1 border border-gray-300 rounded text-[12px] focus:outline-none focus:ring-1 focus:ring-wg-primary max-w-[100px]"
            >
              <option value="">Todos</option>
              {ambientesDisponiveis.map((amb) => (
                <option key={amb} value={amb}>
                  {amb}
                </option>
              ))}
            </select>
          </div>

          {/* Seletor de VisualizaçÍo */}
          <div className="flex items-center gap-1 ml-auto shrink-0">
            <button
              type="button"
              onClick={() => setModoVisualizacao("categorias")}
              className={`p-1.5 rounded ${
                modoVisualizacao === "categorias"
                  ? "bg-wg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Categorias"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao("tabela")}
              className={`p-1.5 rounded ${
                modoVisualizacao === "tabela"
                  ? "bg-wg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Tabela"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setModoVisualizacao("cards")}
              className={`p-1.5 rounded ${
                modoVisualizacao === "cards"
                  ? "bg-wg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
              title="Cards"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Barra de Ações em Massa */}
      {itensSelecionados.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[14px] text-blue-800 font-medium">
              {itensSelecionados.size} item(ns) selecionado(s)
            </span>
            <button
              type="button"
              onClick={limparSelecao}
              className="text-[12px] text-blue-600 hover:text-blue-800 underline"
            >
              Limpar seleçÍo
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={duplicarSelecionados}
              disabled={processandoAcao}
              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-[14px] flex items-center gap-1.5 disabled:opacity-50"
            >
              {processandoAcao ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
              Duplicar
            </button>
            {itensSelecionados.size >= 2 && (
              <button
                type="button"
                onClick={mesclarSelecionados}
                disabled={processandoAcao}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-[14px] flex items-center gap-1.5 disabled:opacity-50"
              >
                {processandoAcao ? (
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                )}
                Mesclar
              </button>
            )}
            <button
              type="button"
              onClick={excluirSelecionados}
              disabled={processandoAcao}
              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-[14px] flex items-center gap-1.5 disabled:opacity-50"
            >
              {processandoAcao ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              )}
              Excluir
            </button>
          </div>
        </div>
      )}

      {/* Conteúdo - Tabela ou Cards */}
      {loading ? (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
          <p className="text-[12px] text-gray-600 mt-2">Carregando itens...</p>
        </div>
      ) : modoVisualizacao === "cards" ? (
        /* VisualizaçÍo em Cards - 8 por linha */
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {itensPaginados.map((item) => (
            <div
              key={item.id}
              onClick={() => navigate(`/pricelist/${item.id}`)}
              className={`bg-white border rounded-xl overflow-hidden hover:shadow-md hover:border-wg-primary/30 cursor-pointer transition-all ${
                itensSelecionados.has(item.id) ? "border-blue-400 bg-blue-50/50" : "border-gray-200"
              }`}
            >
              {/* Imagem */}
              <div className="aspect-square bg-gray-50 relative">
                {item.imagem_url ? (
                  <img
                    src={item.imagem_url}
                    alt={item.nome}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {/* Checkbox de seleçÍo */}
                <div
                  className="absolute top-1 left-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSelecaoItem(item.id);
                  }}
                >
                  <input
                    type="checkbox"
                    checked={itensSelecionados.has(item.id)}
                    onChange={() => {}}
                    className="w-4 h-4 rounded border-gray-300 text-wg-primary focus:ring-wg-primary cursor-pointer bg-white"
                  />
                </div>
                {/* Badge Tipo */}
                <span className={`absolute top-1 right-1 text-[8px] px-1 py-0.5 rounded ${
                  item.tipo === "mao_obra" ? "bg-blue-100 text-blue-700" :
                  item.tipo === "material" ? "bg-orange-100 text-orange-700" :
                  "bg-purple-100 text-purple-700"
                }`}>
                  {item.tipo === "mao_obra" ? "MO" : item.tipo === "material" ? "MAT" : "SERV"}
                </span>
              </div>
              {/* Info */}
              <div className="p-2">
                <p className="text-[11px] text-gray-900 font-light line-clamp-2 leading-tight mb-1" title={item.nome}>
                  {item.nome}
                </p>
                {item.codigo && (
                  <p className="text-[9px] font-mono text-gray-400 mb-1">{item.codigo}</p>
                )}
                <p className="text-[12px] text-wg-primary font-light">
                  R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/{item.unidade}
                </p>
                <div className="flex flex-wrap gap-1 mt-2 text-[10px] text-gray-600">
                  {item.categoria?.tipo_servico && (
                    <span className="px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50">
                      {item.categoria.tipo_servico}
                    </span>
                  )}
                  {item.categoria?.guia_principal && (
                    <span className="px-2 py-0.5 rounded-full border border-orange-200 bg-orange-50 text-orange-700">
                      {item.categoria.guia_principal}
                    </span>
                  )}
                  {item.categoria?.ambientes?.map((ambiente) => (
                    <span key={ambiente.id} className="px-2 py-0.5 rounded-full border border-gray-200 bg-gray-50">
                      {ambiente.nome}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : modoVisualizacao === "categorias" ? (
        /* VisualizaçÍo por Categorias Colapsáveis */
        <div className="space-y-2">
          {/* Barra de ações para categorias */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[12px] text-gray-500">
              {categoriasExibidas.length} categorias • {itensFiltrados.length} itens
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={expandirTodasCategorias}
                className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
              >
                Expandir todas
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={colapsarTodasCategorias}
                className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline"
              >
                Colapsar todas
              </button>
            </div>
          </div>

          {/* Lista de categorias colapsáveis */}
          {categoriasExibidas
            .map((categoria, index) => {
              const itensCategoria = itensPorCategoria[categoria.id] || [];
              const isExpandido = categoriasExpandidas.has(categoria.id);
              const corConfig = getCorCategoria(categoria.nome);
              const corCategoria = corConfig !== "#6B7280" ? corConfig : (categoria.cor || corConfig);
              // Usar íÍndice sequencial (1-based) como número da categoria
              const numeroCategoria = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={categoria.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm"
                >
                  {/* Header da Categoria */}
                  <button
                    type="button"
                    onClick={() => toggleCategoriaExpandida(categoria.id)}
                    className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-gray-50"
                    style={{
                      borderLeft: `4px solid ${corCategoria}`,
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[11px] font-medium"
                        style={{ backgroundColor: corCategoria }}
                      >
                        {numeroCategoria}
                      </div>
                      <div className="text-left">
                        <span className="text-[13px] font-medium text-gray-800">{categoria.nome}</span>
                        {categoria.descricao && (
                          <p className="text-[11px] text-gray-500 line-clamp-1">{categoria.descricao}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                        style={{
                          backgroundColor: `${corCategoria}15`,
                          color: corCategoria,
                        }}
                      >
                        {itensCategoria.length} itens
                      </span>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${isExpandido ? "rotate-180" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </button>

                  {/* Conteúdo Expandido */}
                  {isExpandido && (
                    <div className="border-t border-gray-100">
                      {itensCategoria.length === 0 ? (
                        <div className="p-4 text-center text-[12px] text-gray-400">
                          Nenhum item nesta categoria
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {itensCategoria.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => navigate(`/pricelist/${item.id}`)}
                              className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              {/* Imagem */}
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                {item.imagem_url ? (
                                  <img
                                    src={item.imagem_url}
                                    alt={item.nome}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                <p className="text-[12px] text-gray-900 font-medium truncate">{item.nome}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  {item.codigo && (
                                    <span className="text-[10px] font-mono text-gray-400">{item.codigo}</span>
                                  )}
                                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                                    item.tipo === "mao_obra" ? "bg-blue-100 text-blue-700" :
                                    item.tipo === "material" ? "bg-orange-100 text-orange-700" :
                                    item.tipo === "servico" ? "bg-purple-100 text-purple-700" :
                                    "bg-gray-100 text-gray-700"
                                  }`}>
                                    {getTipoItemLabel(item.tipo || "material")}
                                  </span>
                                </div>
                              </div>

                              {/* Preço */}
                              <div className="text-right flex-shrink-0">
                                <p className="text-[13px] font-medium text-wg-primary">
                                  R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-[10px] text-gray-400">/{item.unidade}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Itens sem categoria */}
          {itensPorCategoria["sem_categoria"]?.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              <button
                type="button"
                onClick={() => toggleCategoriaExpandida("sem_categoria")}
                className="w-full px-4 py-3 flex items-center justify-between transition-colors hover:bg-gray-50"
                style={{ borderLeft: "4px solid #9CA3AF" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-400 text-white text-[11px] font-medium">
                    ?
                  </div>
                  <span className="text-[13px] font-medium text-gray-800">Sem categoria</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-gray-100 text-gray-600">
                    {itensPorCategoria["sem_categoria"].length} itens
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${categoriasExpandidas.has("sem_categoria") ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {categoriasExpandidas.has("sem_categoria") && (
                <div className="border-t border-gray-100 divide-y divide-gray-100">
                  {itensPorCategoria["sem_categoria"].map((item) => (
                    <div
                      key={item.id}
                      onClick={() => navigate(`/pricelist/${item.id}`)}
                      className="px-4 py-2.5 flex items-center gap-3 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.imagem_url ? (
                          <img src={item.imagem_url} alt={item.nome} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] text-gray-900 font-medium truncate">{item.nome}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.codigo && <span className="text-[10px] font-mono text-gray-400">{item.codigo}</span>}
                          <span className={`text-[9px] px-1.5 py-0.5 rounded ${
                            item.tipo === "mao_obra" ? "bg-blue-100 text-blue-700" :
                            item.tipo === "material" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-700"
                          }`}>
                            {getTipoItemLabel(item.tipo || "material")}
                          </span>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[13px] font-medium text-wg-primary">
                          R$ {item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] text-gray-400">/{item.unidade}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* VisualizaçÍo em Tabela */
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-2 py-3 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider w-10">
                  <input
                    type="checkbox"
                    checked={itensPaginados.length > 0 && itensSelecionados.size === itensPaginados.length}
                    onChange={toggleSelecaoTodos}
                    className="w-4 h-4 rounded border-gray-300 text-wg-primary focus:ring-wg-primary cursor-pointer"
                    title="Selecionar todos"
                  />
                </th>
                <th className="px-2 py-3 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider w-16">
                  Imagem
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider w-[280px] min-w-[200px]">
                  Nome
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Fabricante
                </th>
                <th className="px-4 py-3 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  M²/Cx
                </th>
                <th className="px-1 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider w-[90px]">
                  Núcleo
                </th>
                <th className="px-1 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider w-[120px]">
                  Categoria
                </th>
                <th className="px-1 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider w-[80px]">
                  Tipo
                </th>
                <th className="px-1 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider w-[100px]">
                  Subcat.
                </th>
                <th className="px-4 py-3 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">
                  Preço
                </th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200">
              {itensPaginados.map((item) => {
                // Formatar preço no padrÍo brasileiro (1.234,56)
                const precoFormatado = item.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const precoEmEdicao = precosEmEdicao[item.id] ?? precoFormatado;
                return (
                  <tr
                    key={item.id}
                    className={`hover:bg-gray-50 cursor-pointer transition-colors ${itensSelecionados.has(item.id) ? "bg-blue-50" : ""}`}
                    onClick={() => navigate(`/pricelist/${item.id}`)}
                  >
                    {/* Checkbox */}
                    <td className="px-2 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={itensSelecionados.has(item.id)}
                        onChange={() => toggleSelecaoItem(item.id)}
                        className="w-4 h-4 rounded border-gray-300 text-wg-primary focus:ring-wg-primary cursor-pointer"
                      />
                    </td>
                    {/* Imagem */}
                    <td className="px-2 py-2 text-center">
                      {item.imagem_url ? (
                        <img
                          src={item.imagem_url}
                          alt={item.nome}
                          className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </td>
                    {/* Código */}
                    <td className="px-4 py-3">
                      <span className="font-mono text-[12px] text-gray-600">
                        {item.codigo || "-"}
                      </span>
                    </td>
                    {/* Nome */}
                    <td className="px-4 py-2 max-w-[280px]">
                      <span className="text-gray-900 text-[12px] line-clamp-2" title={item.nome}>
                        {item.nome}
                      </span>
                      {item.modelo && (
                        <p className="text-[11px] text-gray-500 truncate">{item.modelo}</p>
                      )}
                    </td>
                    {/* Fabricante */}
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-[12px]">
                        {item.fabricante || "-"}
                      </span>
                    </td>
                    {/* Formato */}
                    <td className="px-4 py-3">
                      <span className="text-gray-700 text-[12px]">
                        {item.formato || "-"}
                      </span>
                    </td>
                    {/* M²/Caixa */}
                    <td className="px-4 py-3 text-right">
                      <span className="text-gray-700 text-[12px]">
                        {item.m2_caixa ? formatNumber(item.m2_caixa, 2) : "-"}
                      </span>
                    </td>
                    {/* Núcleo */}
                    <td className="px-1 py-1">
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={item.nucleo_id || ""}
                          onChange={(e) =>
                            handleNucleoChange(item, e.target.value)
                          }
                          disabled={!!salvandoInline[`${item.id}-nucleo`]}
                          className="w-[85px] px-1 py-0.5 border border-gray-300 rounded text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-wg-primary truncate"
                        >
                          <option value="">-</option>
                          {nucleos.map((n) => (
                            <option key={n.id} value={n.id}>
                              {formatarNucleoLabel(n)}
                            </option>
                          ))}
                        </select>
                        {salvandoInline[`${item.id}-nucleo`] && (
                          <span className="text-[9px] text-gray-400">...</span>
                        )}
                      </div>
                      <div className="mt-1 space-y-1 text-[10px] text-gray-500">
                        {item.categoria?.tipo_servico && (
                          <p className="leading-tight">
                            Serviço: {item.categoria.tipo_servico}
                          </p>
                        )}
                        {item.categoria?.guia_principal && (
                          <p className="leading-tight">
                            Guia: {item.categoria.guia_principal}
                          </p>
                        )}
                        {item.categoria?.ambientes?.length ? (
                          <p className="leading-tight">
                            Ambientes: {item.categoria.ambientes.map((amb) => amb.nome).join(", ")}
                          </p>
                        ) : null}
                      </div>
                    </td>
                    {/* Categoria */}
                    <td className="px-1 py-1">
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          value={item.categoria_id || ""}
                          onChange={(e) =>
                            handleCategoriaChange(item, e.target.value)
                          }
                          disabled={!!salvandoInline[`${item.id}-categoria`]}
                          className="w-[115px] px-1 py-0.5 border border-gray-300 rounded text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-wg-primary truncate"
                        >
                          <option value="">-</option>
                          {categorias.map((cat) => (
                            <option key={cat.id} value={cat.id}>
                              {formatarLabelCategoria(cat)}
                            </option>
                          ))}
                        </select>
                        {salvandoInline[`${item.id}-categoria`] && (
                          <span className="text-[9px] text-gray-400">...</span>
                        )}
                      </div>
                    </td>
                    {/* Tipo */}
                    <td className="px-1 py-1">
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          title="Selecionar tipo"
                          value={item.tipo || "material"}
                          onChange={(e) =>
                            handleTipoChange(item, e.target.value as TipoPricelist)
                          }
                          disabled={!!salvandoInline[`${item.id}-tipo`]}
                          className="w-[75px] px-1 py-0.5 border border-gray-300 rounded text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-wg-primary truncate"
                        >
                          {tipoOptions.map((tipo) => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                        {salvandoInline[`${item.id}-tipo`] && (
                          <span className="text-[9px] text-gray-400">...</span>
                        )}
                      </div>
                    </td>
                    {/* Subcategoria */}
                    <td className="px-1 py-1">
                      <div
                        className="flex items-center gap-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <select
                          title="Selecionar subcategoria"
                          value={item.subcategoria_id || ""}
                          onChange={(e) =>
                            handleSubcategoriaChange(item, e.target.value)
                          }
                          disabled={!!salvandoInline[`${item.id}-subcategoria`]}
                          className="w-[95px] px-1 py-0.5 border border-gray-300 rounded text-[12px] bg-white focus:outline-none focus:ring-1 focus:ring-wg-primary truncate"
                        >
                          <option value="">-</option>
                          {subcategorias
                            .filter((sub) =>
                              item.categoria_id ? sub.categoria_id === item.categoria_id : true
                            )
                            .map((sub) => (
                              <option key={sub.id} value={sub.id}>
                                {sub.nome}
                              </option>
                            ))}
                        </select>
                        {salvandoInline[`${item.id}-subcategoria`] && (
                          <span className="text-[9px] text-gray-400">...</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div
                        className="flex items-center justify-end gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="text-[12px] text-gray-600">R$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={precoEmEdicao}
                          onChange={(e) =>
                            setPrecosEmEdicao((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          onBlur={() => handleSalvarPreco(item)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSalvarPreco(item);
                            }
                          }}
                          disabled={!!salvandoInline[`${item.id}-preco`]}
                          className="w-28 px-2 py-1 border border-gray-300 rounded-lg text-right text-[12px] focus:outline-none focus:ring-2 focus:ring-wg-primary focus:border-transparent"
                        />
                        <span className="text-[12px] text-gray-500">
                          / {item.unidade}
                        </span>
                        {salvandoInline[`${item.id}-preco`] && (
                          <span className="text-[12px] text-gray-400">Salvando...</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/pricelist/editar/${item.id}`);
                        }}
                        className="text-wg-primary hover:text-wg-primary/90 font-medium"
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {itensFiltrados.length === 0 && (
                <tr>
                  <td colSpan={13} className="px-4 py-8 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg
                        className="w-12 h-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      <p className="text-gray-600 font-medium">
                        {busca || filtroTipo !== "todos" || categoriaSelecionada || filtroNucleo
                          ? "Nenhum item encontrado com esses filtros"
                          : "Nenhum item cadastrado"}
                      </p>
                      {!busca && filtroTipo === "todos" && !categoriaSelecionada && !filtroNucleo && (
                        <p className="text-[12px] text-gray-500">
                          Comece criando um novo item
                        </p>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {/* PaginaçÍo */}
      {!loading && itensFiltrados.length > itensPorPagina && (
        <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-[12px] text-gray-600">
            Mostrando {iÍndiceInicio + 1}-{Math.min(iÍndiceInicio + itensPorPagina, itensFiltrados.length)} de {itensFiltrados.length} itens
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPaginaAtual(p => Math.max(1, p - 1))}
              disabled={paginaAtual === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Anterior
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let pagina: number;
                if (totalPaginas <= 5) {
                  pagina = i + 1;
                } else if (paginaAtual <= 3) {
                  pagina = i + 1;
                } else if (paginaAtual >= totalPaginas - 2) {
                  pagina = totalPaginas - 4 + i;
                } else {
                  pagina = paginaAtual - 2 + i;
                }
                return (
                  <button
                    type="button"
                    key={pagina}
                    onClick={() => setPaginaAtual(pagina)}
                    className={`w-8 h-8 rounded-lg text-[14px] font-medium ${
                      paginaAtual === pagina
                        ? "bg-wg-primary text-white"
                        : "hover:bg-gray-100 text-gray-700"
                    }`}
                  >
                    {pagina}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setPaginaAtual(p => Math.min(totalPaginas, p + 1))}
              disabled={paginaAtual === totalPaginas}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-[14px] font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Próximo
            </button>
          </div>
        </div>
      )}

      {/* Estatísticas */}
      {!loading && itens.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] text-gray-500">
              Total de Itens
            </p>
            <p className="text-[18px] font-light text-gray-900 mt-1">
              {itens.length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] text-gray-500">
              MÍo de Obra
            </p>
            <p className="text-[18px] font-light text-blue-600 mt-1">
              {itens.filter((i) => i.tipo === "mao_obra").length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] text-gray-500">
              Materiais
            </p>
            <p className="text-[18px] font-light text-orange-600 mt-1">
              {itens.filter((i) => i.tipo === "material").length}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <p className="text-[12px] text-gray-500">
              Estoque Baixo
            </p>
            <p className="text-[18px] font-light text-red-600 mt-1">
              {
                itens.filter(
                  (i) =>
                    i.controla_estoque &&
                    (i.estoque_atual ?? 0) < (i.estoque_minimo ?? 0)
                ).length
              }
            </p>
          </div>
        </div>
      )}

      {/* Modal de Ferramentas */}
      <PricelistToolsModal
        isOpen={showToolsModal}
        onClose={() => setShowToolsModal(false)}
        itens={itens}
        categorias={categorias}
        nucleos={nucleos}
        onMergeItems={async (manterId, excluirIds) => {
          const relacoesParaAtualizar: Array<{ tabela: string; coluna: string }> = [
            { tabela: "propostas_itens", coluna: "pricelist_item_id" },
            { tabela: "analises_projeto_servicos", coluna: "pricelist_item_id" },
            { tabela: "contratos_itens", coluna: "pricelist_item_id" },
            { tabela: "pedidos_compra_itens", coluna: "pricelist_item_id" },
            { tabela: "projeto_lista_compras", coluna: "pricelist_id" },
          ];

          for (const relacao of relacoesParaAtualizar) {
            const { error } = await supabase
              .from(relacao.tabela as any)
              .update({ [relacao.coluna]: manterId } as any)
              .in(relacao.coluna, excluirIds);

            if (error) {
              console.warn(
                `[Merge Pricelist] Falha ao migrar referência em ${relacao.tabela}.${relacao.coluna}:`,
                error.message
              );
            }
          }

          // Excluir itens duplicados
          for (const id of excluirIds) {
            await deletarItem(id);
          }
        }}
        onUpdatePrice={async (itemId, novoPreco) => {
          await atualizarItem(itemId, { preco: novoPreco });
        }}
        onRefresh={carregarDados}
      />
    </div>
  );
}

