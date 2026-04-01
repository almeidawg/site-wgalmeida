/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Editor de Análise de Projeto
// Sistema WG Easy - Grupo WG Almeida
// Layout 3 colunas profissional
// ============================================================

import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Ruler,
  Upload,
  Sparkles,
  Plus,
  Minus,
  Trash2,
  Copy,
  Edit3,
  Check,
  X,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronsUpDown,
  Building2,
  Zap,
  Droplets,
  FileText,
  CheckCircle,
  Loader2,
  FileImage,
  DoorOpen,
  Square,
  Maximize2,
  PanelTop,
  RefreshCw,
  Search,
  ClipboardList,
  Hammer,
  Package,
  Wrench,
  Layers,
  GripVertical,
  Link2,
  PlusCircle,
  Unlink,
  ExternalLink,
  ArrowRightLeft,
} from "lucide-react";
import {
  criarAnalise,
  buscarAnalise,
  atualizarAnalise,
  atualizarStatusAnalise,
  salvarResultadoAnaliseIA,
  criarAmbiente,
  atualizarAmbiente,
  deletarAmbiente,
  listarServicos,
  vincularServicoAoPricelist,
  type ServicoAnalise,
} from "@/lib/analiseProjetoApi";
import {
  listarCategorias,
  listarItensComFiltros,
  criarItem,
  gerarCodigoItem,
  type PricelistCategoria,
  type PricelistItemCompleto,
  type PricelistItemFormData,
} from "@/lib/pricelistApi";
import {
  analisarProjetoComIA,
  analisarEscopoComIA,
  analisarDocumentoEscopo,
  processarArquivoProjeto,
  validarConfiguracaoIA,
  setAIProvider,
} from "@/lib/projetoAnaliseAI";
import { extrairTextoDocx, isDocxFile } from "@/lib/docxParser";
import { supabase } from "@/lib/supabaseClient";
import type {
  AnaliseProjetoCompleta,
  AnaliseIAResultado,
  AnaliseProjetoAmbiente,
  AnaliseProjetoFormData,
  CategoriaServico,
  TipoProjeto,
  TipoImovel,
  PadraoConstrutivo,
  TipoAmbiente,
  TipoServico,
  ServicoIA,
  VaoPorta,
  VaoJanela,
  VaoGenerico,
  VaoEnvidracamento,
} from "@/types/analiseProjeto";
import {
  getStatusLabel,
  getStatusColor,
  TIPO_PROJETO_LABELS,
  TIPO_IMOVEL_LABELS,
  PADRAO_CONSTRUTIVO_LABELS,
  TIPO_AMBIENTE_LABELS,
  formatarArea,
  formatarMetragemLinear,
  inferirTipoAmbiente,
  calcularAreaVaos,
} from "@/types/analiseProjeto";
import { useToast } from "@/components/ui/use-toast";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  convertPDFToImages,
  dataUrlToFile,
  isPDFFile,
} from "@/lib/pdfToImage";
import { ProgressoIA, useProgressoIA } from "@/components/ui/ProgressoIA";
import { useTiposAmbiente } from "@/hooks/useTiposAmbiente";

// ============================================================
// Interfaces Locais
// ============================================================

interface Cliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  // Endereço principal
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  // Endereço da obra
  obra_endereco_diferente?: boolean;
  obra_cep?: string;
  obra_logradouro?: string;
  obra_numero?: string;
  obra_complemento?: string;
  obra_bairro?: string;
  obra_cidade?: string;
  obra_estado?: string;
}

// ============================================================
// Componente Principal
// ============================================================

export default function AnaliseProjetoEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = Boolean(id);

  // Estados Gerais
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [analise, setAnalise] = useState<AnaliseProjetoCompleta | null>(null);

  // Estados do Formulário (Coluna 1)
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [titulo, setTitulo] = useState("");

  // Estados para busca de cliente
  const [clienteBuscaAberta, setClienteBuscaAberta] = useState(false);
  const [clienteTermoBusca, setClienteTermoBusca] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipoProjeto, setTipoProjeto] = useState<TipoProjeto>("reforma");
  const [tipoImovel, setTipoImovel] = useState<TipoImovel | "">("");
  const [areaTotal, setAreaTotal] = useState("");
  const [peDireitoPadrao, setPeDireitoPadrao] = useState("2.70");
  const [enderecoObra, setEnderecoObra] = useState("");
  const [padraoConstrutivo, setPadraoConstrutivo] = useState<PadraoConstrutivo | "">("");

  // Estados de Upload/Análise (Coluna 2)
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [arquivoSelecionado, setArquivoSelecionado] = useState(0); // índice do arquivo selecionado para análise
  const [processandoPDF, setProcessandoPDF] = useState(false); // Estado de processamento de PDF
  const [memorialDescritivo, setMemorialDescritivo] = useState("");
  const [docxCarregado, setDocxCarregado] = useState(false); // Indica se memorial veio de .docx
  const [contratoTexto, setContratoTexto] = useState("");
  const [analisando, setAnalisando] = useState(false);
  const [provedorIA, setProvedorIA] = useState<"openai" | "anthropic">("anthropic");
  const [promptPersonalizado, setPromptPersonalizado] = useState("");
  const [mostrarPromptAvancado, setMostrarPromptAvancado] = useState(false);

  // Hook de progresso com etapas detalhadas
  const progresso = useProgressoIA();

  // Estados dos Ambientes (Coluna 3)
  const [ambientes, setAmbientes] = useState<AnaliseProjetoAmbiente[]>([]);
  const [expandedAmbientes, setExpandedAmbientes] = useState<Set<string>>(new Set());
  const [editandoAmbiente, setEditandoAmbiente] = useState<string | null>(null);
  const [novoAmbiente, setNovoAmbiente] = useState(false);

  // Drag & Drop para reordenar ambientes
  const [draggedAmbiente, setDraggedAmbiente] = useState<string | null>(null);
  const [dragOverAmbiente, setDragOverAmbiente] = useState<string | null>(null);

  // Hook de Tipos de Ambiente (dinâmico do banco)
  const {
    tipos: tiposAmbiente,
    loading: loadingTipos,
    isMaster,
    adicionar: adicionarTipoAmbiente,
    atualizar: atualizarTipoAmbiente,
  } = useTiposAmbiente();

  // Estados para ediçÍo inline de tipos de ambiente
  const [editandoTipo, setEditandoTipo] = useState<string | null>(null);
  const [novoTipoNome, setNovoTipoNome] = useState("");
  const [adicionandoTipo, setAdicionandoTipo] = useState(false);

  // Estados dos Serviços/Itens Extraídos (Coluna 2 - Escopo)
  const [servicosExtraidos, setServicosExtraidos] = useState<ServicoAnalise[]>([]);
  const [expandedCategoria, setExpandedCategoria] = useState<string | null>(null);

  // Estados do Modal de VinculaçÍo Pricelist
  const [modalVinculacaoAberto, setModalVinculacaoAberto] = useState(false);
  const [servicoSelecionado, setServicoSelecionado] = useState<ServicoAnalise | null>(null);
  const [modoVinculacao, setModoVinculacao] = useState<"vincular" | "criar">("vincular");
  const [pricelistCategorias, setPricelistCategorias] = useState<PricelistCategoria[]>([]);
  const [pricelistItens, setPricelistItens] = useState<PricelistItemCompleto[]>([]);
  const [buscaPricelist, setBuscaPricelist] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [vinculandoPricelist, setVinculandoPricelist] = useState(false);
  const [replicarSimilares, setReplicarSimilares] = useState(true);
  const [autoVinculandoPricelist, setAutoVinculandoPricelist] = useState(false);
  const [modoAnalise, setModoAnalise] = useState<"ia" | "sistema">("ia");
  const filaVinculacaoRef = useRef<ServicoAnalise[]>([]);
  const [filaVinculacao, setFilaVinculacao] = useState<ServicoAnalise[]>([]);

  // Estados para criar novo item no pricelist
  const [novoItemNome, setNovoItemNome] = useState("");
  const [novoItemUnidade, setNovoItemUnidade] = useState("un");
  const [novoItemPreco, setNovoItemPreco] = useState("");
  const [novoItemCategoria, setNovoItemCategoria] = useState("");

  // Carregar dados iniciais
  useEffect(() => {
    carregarClientes();
    if (isEdit && id) {
      carregarAnalise(id);
    }
  }, [id]);

  const carregarClientes = async () => {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select(`
          id, nome, email, telefone, status,
          cep, logradouro, numero, complemento, bairro, cidade, estado,
          obra_endereco_diferente, obra_cep, obra_logradouro, obra_numero,
          obra_complemento, obra_bairro, obra_cidade, obra_estado
        `)
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
        .order("nome");
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  };

  const carregarAnalise = async (analiseId: string) => {
    try {
      setLoading(true);
      const data = await buscarAnalise(analiseId);
      setAnalise(data);

      // Preencher formulário
      setClienteId(data.cliente_id);
      setTitulo(data.titulo || "");
      setDescricao(data.descricao || "");
      setTipoProjeto(data.tipo_projeto);
      setTipoImovel(data.tipo_imovel || "");
      setAreaTotal(data.area_total?.toString() || "");
      setPeDireitoPadrao(data.pe_direito_padrao?.toString() || "2.70");
      setEnderecoObra(data.endereco_obra || "");
      setPadraoConstrutivo(data.padrao_construtivo || "");
      setMemorialDescritivo(data.memorial_descritivo || "");
      setContratoTexto(data.contrato_texto || "");
      setAmbientes(data.ambientes || []);

      // Ambientes ficam RECOLHIDOS por padrÍo
      setExpandedAmbientes(new Set());

      // Carregar serviços extraídos
      try {
        const servicos = await listarServicos(analiseId);
        setServicosExtraidos(servicos);
      } catch (err) {
        console.warn("Serviços não encontrados:", err);
        setServicosExtraidos([]);
      }
    } catch (error: any) {
      console.error("Erro ao carregar análise:", error);
      toast({
        title: "Erro ao carregar",
        description: error.message || "não foi possível carregar a análise.",
        variant: "destructive",
      });
      navigate("/analise-projeto");
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // Funções de VinculaçÍo com Pricelist
  // ============================================================

  // Carregar categorias do pricelist
  const carregarCategoriasPricelist = async () => {
    try {
      const cats = await listarCategorias();
      setPricelistCategorias(cats.filter(c => c.ativo));
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  };

  const STOPWORDS_BUSCA_PRICELIST = new Set([
    "de", "da", "do", "das", "dos", "em", "na", "no", "nas", "nos",
    "um", "uma", "uns", "umas", "o", "a", "os", "as", "e", "ou",
    "para", "por", "com", "sem", "que", "se", "ao", "aos", "a", "as",
    "pelo", "pela", "pelos", "pelas", "este", "esta", "esse", "essa",
    "aquele", "aquela", "isto", "isso", "aquilo",
  ]);

  const tokenizarBuscaPricelist = (texto: string): string[] => {
    const base = normalizeSearchTerm(texto || "")
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!base) return [];
    return base
      .split(" ")
      .filter((t) => t.length >= 2 && !STOPWORDS_BUSCA_PRICELIST.has(t));
  };

  const pontuarItemBuscaPricelist = (
    item: PricelistItemCompleto,
    termoBusca: string,
    tokensBusca: string[],
    contextoServico: string
  ): number => {
    const nome = normalizeSearchTerm(item.nome || "");
    const codigo = normalizeSearchTerm(item.codigo || "");
    const descricao = normalizeSearchTerm(item.descricao || "");
    const categoriaNome = normalizeSearchTerm((item as any)?.categoria?.nome || "");
    const textoCompleto = `${nome} ${codigo} ${descricao} ${categoriaNome}`.trim();

    if (!textoCompleto) return 0;

    let score = 0;

    if (termoBusca) {
      if (codigo === termoBusca) score += 140;
      if (nome === termoBusca) score += 120;
      if (nome.startsWith(termoBusca)) score += 80;
      if (nome.includes(termoBusca)) score += 55;
      if (descricao.includes(termoBusca)) score += 35;
      if (categoriaNome.includes(termoBusca)) score += 20;
      if (codigo.includes(termoBusca)) score += 20;
    }

    if (tokensBusca.length > 0) {
      let tokensEmNome = 0;
      let tokensEmDescricao = 0;
      let tokensEmCodigo = 0;
      let tokensEmCategoria = 0;

      for (const token of tokensBusca) {
        if (nome.includes(token)) tokensEmNome += 1;
        if (descricao.includes(token)) tokensEmDescricao += 1;
        if (codigo.includes(token)) tokensEmCodigo += 1;
        if (categoriaNome.includes(token)) tokensEmCategoria += 1;
      }

      const tokensCobertos = new Set<number>();
      for (let i = 0; i < tokensBusca.length; i += 1) {
        const tk = tokensBusca[i];
        if (nome.includes(tk) || descricao.includes(tk) || codigo.includes(tk) || categoriaNome.includes(tk)) {
          tokensCobertos.add(i);
        }
      }

      const cobertura = tokensCobertos.size / tokensBusca.length;
      score += tokensEmNome * 24;
      score += tokensEmDescricao * 10;
      score += tokensEmCodigo * 8;
      score += tokensEmCategoria * 6;
      score += Math.round(cobertura * 45);
      if (cobertura === 1) score += 20;
    }

    if (contextoServico) {
      const tokensContexto = tokenizarBuscaPricelist(contextoServico);
      const intersecao = tokensContexto.filter((tk) => textoCompleto.includes(tk)).length;
      if (intersecao > 0) score += Math.min(18, intersecao * 3);
    }

    return score;
  };

  // Buscar itens do pricelist
  const buscarItensPricelist = async (termo: string, categoriaId?: string) => {
    try {
      if (import.meta.env.DEV) console.log("[Pricelist] Buscando:", { termo, categoriaId });

      const termoLimpo = (termo || "").trim();
      const termoNormalizado = normalizeSearchTerm(termoLimpo);
      const tokensBusca = tokenizarBuscaPricelist(termoLimpo);
      const contextoServico = normalizeSearchTerm(servicoSelecionado?.descricao || "");

      const itens = await listarItensComFiltros({
        busca: termoLimpo || undefined,
        categoria_id: categoriaId?.trim() || undefined,
        apenas_ativos: true,
        // Janela maior para permitir ranking local por relevância.
        limite: termoLimpo ? 200 : 40,
      });

      const itensRankeados = termoNormalizado
        ? itens
            .map((item) => ({
              item,
              score: pontuarItemBuscaPricelist(item, termoNormalizado, tokensBusca, contextoServico),
            }))
            .filter((x) => x.score > 0)
            .sort((a, b) => b.score - a.score || (a.item.nome || "").localeCompare(b.item.nome || ""))
            .map((x) => x.item)
            .slice(0, 30)
        : itens.slice(0, 40);

      if (import.meta.env.DEV) console.log("[Pricelist] Itens encontrados:", itens.length, "| exibidos:", itensRankeados.length);
      setPricelistItens(itensRankeados);
    } catch (error) {
      console.error("Erro ao buscar itens:", error);
      setPricelistItens([]);
    }
  };

  // Abrir modal de vinculaçÍo
  const handleAbrirModalVinculacao = async (servico: ServicoAnalise, modo: "vincular" | "criar") => {
    setServicoSelecionado(servico);
    setModoVinculacao(modo);
    setModalVinculacaoAberto(true);

    // Carregar categorias se ainda não carregadas
    if (pricelistCategorias.length === 0) {
      await carregarCategoriasPricelist();
    }

    // Se for vincular, buscar itens relacionados
    if (modo === "vincular") {
      // Usar termo de busca sugerido ou palavra-chave principal
      const palavraChave = servico.termo_busca ||
        servico.descricao.split(" ").filter(p => p.length > 3)[0] || "";
      setBuscaPricelist(palavraChave);

      // Buscar itens - se não tiver termo, lista todos os primeiros itens
      await buscarItensPricelist(palavraChave);
    }

    // Se for criar, preencher com dados do serviço
    if (modo === "criar") {
      setNovoItemNome(servico.descricao);
      setNovoItemUnidade(servico.unidade || "un");
      setNovoItemPreco("");
      setNovoItemCategoria(servico.categoria_sugerida || "");
    }
  };

  // Fechar modal de vinculaçÍo
  const handleFecharModalVinculacao = () => {
    setModalVinculacaoAberto(false);
    setServicoSelecionado(null);
    setBuscaPricelist("");
    setPricelistItens([]);
    setNovoItemNome("");
    setNovoItemUnidade("un");
    setNovoItemPreco("");
    setNovoItemCategoria("");
  };

  const abrirProximoDaFila = async (servicoId?: string) => {
    if (!servicoId) return;
    filaVinculacaoRef.current = filaVinculacaoRef.current.filter((s) => s.id !== servicoId);
    setFilaVinculacao([...filaVinculacaoRef.current]);
    const proximo = filaVinculacaoRef.current[0];
    if (proximo) {
      await handleAbrirModalVinculacao(proximo, "vincular");
    }
  };

  // Normalizar texto para comparaçÍo de similaridade
  const normalizarTexto = (texto: string): string => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/[^a-z0-9\s]/g, "") // Remove caracteres especiais
      .trim();
  };

  const normalizarTokens = (texto: string): string[] => {
    const stopWords = new Set([
      "de", "da", "do", "das", "dos", "em", "com", "para", "e", "ou", "no", "na", "nos", "nas",
      "ao", "aos", "a", "o", "as", "os", "por", "que", "ser", "sera", "incluindo", "conforme",
      "existente", "novo", "novos", "novas", "area", "areas", "internas", "externas",
    ]);
    return normalizarTexto(texto)
      .split(/\s+/)
      .filter((p) => p.length > 2 && !stopWords.has(p));
  };

  const calcularSimilaridade = (a: string, b: string): number => {
    const aNorm = normalizarTexto(a);
    const bNorm = normalizarTexto(b);
    if (!aNorm || !bNorm) return 0;
    if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) return 0.9;
    const tokensA = new Set(normalizarTokens(a));
    const tokensB = new Set(normalizarTokens(b));
    if (tokensA.size === 0 || tokensB.size === 0) return 0;
    let inter = 0;
    tokensA.forEach((t) => {
      if (tokensB.has(t)) inter += 1;
    });
    const union = tokensA.size + tokensB.size - inter;
    return union === 0 ? 0 : inter / union;
  };

  const extrairAmbientesDoTexto = (texto: string): string[] => {
    const textoNorm = normalizarTexto(texto);
    const encontrados = new Set<string>();

    const ambientesBase = [
      { termos: ["cozinha"], label: "Cozinha" },
      { termos: ["lavanderia"], label: "Lavanderia" },
      { termos: ["lavabo"], label: "Lavabo" },
      { termos: ["banheiro", "banheiros"], label: "Banheiro" },
      { termos: ["suite master", "suíte master"], label: "Suíte Master" },
      { termos: ["suite", "suíte", "suites", "suítes"], label: "Suíte" },
      { termos: ["sala de estar"], label: "Sala de Estar" },
      { termos: ["sala de jantar"], label: "Sala de Jantar" },
      { termos: ["terraço social", "terraco social"], label: "Terraço Social" },
      { termos: ["terraço", "terraco"], label: "Terraço" },
      { termos: ["circulacao intima", "circulaçÍo íntima"], label: "CirculaçÍo Íntima" },
      { termos: ["circulacao", "circulaçÍo"], label: "CirculaçÍo" },
      { termos: ["area de banho", "área de banho"], label: "Área de Banho" },
      { termos: ["area externa", "área externa"], label: "Área Externa" },
      { termos: ["quarto", "quartos"], label: "Quarto" },
    ];

    ambientesBase.forEach((amb) => {
      amb.termos.forEach((termo) => {
        if (textoNorm.includes(normalizarTexto(termo))) {
          encontrados.add(amb.label);
        }
      });
    });

    // Tentar casar com ambientes já cadastrados
    ambientes.forEach((amb) => {
      const nomeNorm = normalizarTexto(amb.nome || "");
      if (nomeNorm && textoNorm.includes(nomeNorm)) {
        encontrados.add(amb.nome);
      }
    });

    return Array.from(encontrados);
  };

  const inferirCategoriaETipo = (texto: string): { categoria: CategoriaServico; tipo: TipoServico | string } => {
    const textoNorm = normalizarTexto(texto);
    let categoria: CategoriaServico = "outros";
    let tipo: TipoServico | string = "servico_personalizado";

    if (/demol|remoc|retirad|recorte|abertura|fechamento/.test(textoNorm)) {
      categoria = "demolicao";
      if (/revestimento/.test(textoNorm)) tipo = "demolicao_revestimento";
      else if (/piso/.test(textoNorm)) tipo = "demolicao_piso";
      else if (/parede|alvenaria/.test(textoNorm)) tipo = "demolicao_parede";
      else if (/forro|gesso/.test(textoNorm)) tipo = "demolicao_forro";
      else if (/porta/.test(textoNorm)) tipo = "remocao_portas";
      else if (/janela|esquadria/.test(textoNorm)) tipo = "remocao_janelas";
      else if (/box/.test(textoNorm)) tipo = "remocao_box";
      else if (/nicho/.test(textoNorm)) tipo = "recorte_nicho";
    }

    if (/contrapiso|alvenaria|impermeabiliz|regulariza|nivelamento|gesso/.test(textoNorm)) {
      categoria = "construcao";
      if (/contrapiso/.test(textoNorm)) tipo = "regularizacao_contrapiso";
      else if (/impermeabiliz/.test(textoNorm)) {
        if (/box|banho/.test(textoNorm)) tipo = "impermeabilizacao_box";
        else if (/parede/.test(textoNorm)) tipo = "impermeabilizacao_parede";
        else if (/terra[cç]o|sacada/.test(textoNorm)) tipo = "impermeabilizacao_terraço";
        else tipo = "impermeabilizacao_piso";
      } else if (/alvenaria/.test(textoNorm)) tipo = "execucao_alvenaria";
      else if (/gesso|forro/.test(textoNorm)) tipo = "execucao_gesso";
    }

    if (/eletric|iluminacao|tomada|circuito|interruptor|dados|rede/.test(textoNorm)) {
      categoria = "instalacoes_eletricas";
      if (/iluminacao/.test(textoNorm)) tipo = "ponto_iluminacao";
      else if (/tomada/.test(textoNorm)) tipo = "ponto_tomada_especial";
      else if (/circuito/.test(textoNorm)) tipo = "circuito_eletrico";
      else if (/dados|rede|hdmi/.test(textoNorm)) tipo = "tubulacao_seca_dados";
    }

    if (/hidraul|agua|esgoto|gas|ralo|aquecedor/.test(textoNorm)) {
      categoria = "instalacoes_hidraulicas";
      if (/gas/.test(textoNorm)) tipo = "ponto_gas";
      else if (/ralo/.test(textoNorm)) tipo = "ralo_linear";
      else if (/agua/.test(textoNorm)) tipo = "ponto_agua_fria";
      else if (/esgoto/.test(textoNorm)) tipo = "ponto_esgoto";
    }

    if (/porcelanato|revestimento|piso|rodape|vinil|laminado/.test(textoNorm)) {
      categoria = "revestimentos";
      if (/vinil/.test(textoNorm)) tipo = "assentamento_piso_vinilico";
      else if (/porcelanato/.test(textoNorm)) tipo = "assentamento_porcelanato";
      else if (/parede/.test(textoNorm)) tipo = "revestimento_parede";
    }

    if (/pintura|massa corrida|grafiato|textura/.test(textoNorm)) {
      categoria = "pintura";
      if (/teto/.test(textoNorm)) tipo = "pintura_teto";
      else tipo = "pintura_parede";
    }

    if (/forro|tabica/.test(textoNorm)) {
      categoria = "forros";
      tipo = /tabica/.test(textoNorm) ? "execucao_tabica" : "forro_gesso_acartonado";
    }

    if (/porta|janela|esquadria|box|envidrac/.test(textoNorm)) {
      categoria = "esquadrias";
      if (/box/.test(textoNorm)) tipo = "instalacao_box_vidro";
      else if (/porta/.test(textoNorm)) tipo = "instalacao_porta";
      else if (/janela/.test(textoNorm)) tipo = "instalacao_janela";
      else if (/envidrac/.test(textoNorm)) tipo = "envidracamento_varanda";
    }

    if (/louca|louças|metais|bancada|pia|cuba|chuveiro|torneira/.test(textoNorm)) {
      categoria = "louças_metais";
      if (/bancada/.test(textoNorm)) tipo = "instalacao_bancada_granito";
      else if (/pia|cuba/.test(textoNorm)) tipo = "instalacao_cuba";
      else if (/chuveiro/.test(textoNorm)) tipo = "instalacao_chuveiro";
    }

    return { categoria, tipo };
  };

  const inferirUnidadeQuantidade = (texto: string): Pick<ServicoIA, "unidade" | "quantidade" | "area" | "metragem_linear"> => {
    const matchM2 = texto.match(/(\d+(?:[.,]\d+)?)\s*(m²|m2)/i);
    if (matchM2) {
      return {
        unidade: "m2",
        quantidade: parseFloat(matchM2[1].replace(",", ".")),
        area: parseFloat(matchM2[1].replace(",", ".")),
      };
    }

    const matchMl = texto.match(/(\d+(?:[.,]\d+)?)\s*(ml|m linear|metros? lineares?)/i);
    if (matchMl) {
      return {
        unidade: "ml",
        quantidade: parseFloat(matchMl[1].replace(",", ".")),
        metragem_linear: parseFloat(matchMl[1].replace(",", ".")),
      };
    }

    const matchUn = texto.match(/(\d+(?:[.,]\d+)?)\s*(un|unid|unidade|pç|pcs|peças)/i);
    if (matchUn) {
      return {
        unidade: "un",
        quantidade: parseFloat(matchUn[1].replace(",", ".")),
      };
    }

    if (/porta|janela|box|ralo|ponto/.test(normalizarTexto(texto))) {
      return { unidade: "un", quantidade: 1 };
    }

    return { unidade: "vb" };
  };

  const criarServicosSistema = (texto: string): ServicoIA[] => {
    const linhas = texto
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const servicos: ServicoIA[] = [];

    linhas.forEach((linha, index) => {
      const { categoria, tipo } = inferirCategoriaETipo(linha);
      const ambientesIdentificados = extrairAmbientesDoTexto(linha);
      const medidas = inferirUnidadeQuantidade(linha);
      const textoNorm = normalizarTexto(linha);

      const ambientesCadastrados = ambientesIdentificados.length
        ? ambientes.filter((amb) => {
            const nomeNorm = normalizarTexto(amb.nome || "");
            return ambientesIdentificados.some((nome) => nomeNorm && normalizarTexto(nome).includes(nomeNorm));
          })
        : [];

      const areaPisoTotal = ambientesCadastrados.reduce((acc, amb) => acc + (amb.area_piso || 0), 0);
      const areaParedeTotal = ambientesCadastrados.reduce(
        (acc, amb) => acc + (amb.area_paredes_liquida || amb.area_paredes_bruta || 0),
        0
      );
      const perimetroTotal = ambientesCadastrados.reduce((acc, amb) => acc + (amb.perimetro || 0), 0);

      let areaCalculada = medidas.area;
      let metragemLinearCalculada = medidas.metragem_linear;
      let unidadeCalculada = medidas.unidade;

      if (!areaCalculada && areaPisoTotal > 0 && /piso|porcelanato|vinil|laminado/.test(textoNorm)) {
        areaCalculada = areaPisoTotal;
        unidadeCalculada = "m2";
      }

      if (!areaCalculada && areaParedeTotal > 0 && /parede|pintura|revestimento/.test(textoNorm)) {
        areaCalculada = areaParedeTotal;
        unidadeCalculada = "m2";
      }

      if (!metragemLinearCalculada && perimetroTotal > 0 && /rodape|soleira/.test(textoNorm)) {
        metragemLinearCalculada = perimetroTotal;
        unidadeCalculada = "ml";
      }

      const palavrasChave = normalizarTokens(linha).slice(0, 6);
      const termoBusca = palavrasChave.slice(0, 3).join(" ");

      servicos.push({
        categoria,
        tipo,
        descricao: linha,
        ambiente: ambientesIdentificados[0],
        ambientes: ambientesIdentificados.length > 0 ? ambientesIdentificados : undefined,
        unidade: unidadeCalculada,
        quantidade: medidas.quantidade,
        area: areaCalculada,
        metragem_linear: metragemLinearCalculada,
        vinculo_pricelist: {
          termo_busca: termoBusca || linha.split(" ").slice(0, 3).join(" "),
          palavras_chave: palavrasChave,
        },
        ordem: index,
      });
    });

    return servicos;
  };

  const obterTermosBuscaServico = (servico: ServicoAnalise): string[] => {
    const termos = new Set<string>();
    if (servico.termo_busca) termos.add(servico.termo_busca);
    (servico.palavras_chave || []).forEach((p) => termos.add(p));
    const palavras = normalizarTokens(servico.descricao);
    palavras.slice(0, 4).forEach((p) => termos.add(p));
    if (servico.categoria_sugerida) termos.add(servico.categoria_sugerida);
    return Array.from(termos).filter((t) => t && t.length > 2);
  };

  const autoVincularServicosPricelist = async (servicosOverride?: ServicoAnalise[]) => {
    const servicosParaVincular = servicosOverride || servicosExtraidos;
    if (servicosParaVincular.length === 0) {
      toast({ title: "Nenhum serviço para vincular", variant: "destructive" });
      return;
    }

    setAutoVinculandoPricelist(true);
    const cacheBusca = new Map<string, PricelistItemCompleto[]>();
    const servicosSemMatch: ServicoAnalise[] = [];

    try {
      for (const servico of servicosParaVincular) {
        if (servico.pricelist_item_id) continue;

        let melhorItem: PricelistItemCompleto | null = null;
        let melhorScoreComposto = 0;
        let melhorScoreSimilaridade = 0;
        const termos = obterTermosBuscaServico(servico);
        const contextoServico = normalizeSearchTerm(
          `${servico.descricao || ""} ${servico.termo_busca || ""} ${(servico.palavras_chave || []).join(" ")}`
        );
        const candidatosMap = new Map<
          string,
          { item: PricelistItemCompleto; scoreComposto: number; scoreSimilaridade: number }
        >();

        for (const termo of termos) {
          const termoChave = normalizeSearchTerm(termo);
          if (!termoChave) continue;

          if (!cacheBusca.has(termoChave)) {
            const itens = await listarItensComFiltros({
              busca: termo,
              apenas_ativos: true,
              limite: 120,
            });
            cacheBusca.set(termoChave, itens);
          }

          const candidatos = cacheBusca.get(termoChave) || [];
          const tokensTermo = tokenizarBuscaPricelist(termo);

          for (const item of candidatos) {
            const scoreSimilaridade = Math.max(
              calcularSimilaridade(servico.descricao, item.nome),
              calcularSimilaridade(servico.descricao, item.descricao || "")
            );

            // Reaproveita o mesmo ranking "inteligente" da busca manual
            const scoreBusca = pontuarItemBuscaPricelist(item, termoChave, tokensTermo, contextoServico);
            let scoreComposto = scoreBusca + Math.round(scoreSimilaridade * 100);

            // Bônus leve se unidade coincide (reduz falso positivo)
            if (servico.unidade && item.unidade && servico.unidade === item.unidade) {
              scoreComposto += 8;
            }

            const existente = candidatosMap.get(item.id);
            if (!existente || scoreComposto > existente.scoreComposto) {
              candidatosMap.set(item.id, { item, scoreComposto, scoreSimilaridade });
            }
          }
        }

        for (const candidato of candidatosMap.values()) {
          if (candidato.scoreComposto > melhorScoreComposto) {
            melhorScoreComposto = candidato.scoreComposto;
            melhorScoreSimilaridade = candidato.scoreSimilaridade;
            melhorItem = candidato.item;
          }
        }

        // Gate de confiança:
        // - Similaridade textual alta OU
        // - Score composto suficientemente alto
        if (melhorItem && (melhorScoreSimilaridade >= 0.55 || melhorScoreComposto >= 85)) {
          const matchScoreNormalizado = Math.max(
            0.55,
            Math.min(1, melhorScoreComposto / 140, melhorScoreSimilaridade)
          );
          await vincularServicoAoPricelist(servico.id, melhorItem.id, matchScoreNormalizado);
          const melhorItemData = { tipo: melhorItem.tipo || "outro", nome: melhorItem.nome };
          setServicosExtraidos((prev) =>
            prev.map((s) =>
              s.id === servico.id
                ? { ...s, pricelist_item_id: melhorItem!.id, termo_busca: melhorItem!.nome, pricelist_item: melhorItemData }
                : s
            )
          );
        } else {
          servicosSemMatch.push(servico);
        }
      }

      setFilaVinculacao(servicosSemMatch);
      filaVinculacaoRef.current = servicosSemMatch;

      if (servicosSemMatch.length > 0) {
        toast({
          title: "Alguns serviços precisam de revisÍo",
          description: `${servicosSemMatch.length} item(ns) sem match automático.`,
        });
        await handleAbrirModalVinculacao(servicosSemMatch[0], "vincular");
      } else {
        toast({ title: "VinculaçÍo automática concluída" });
      }
    } catch (error) {
      console.error("Erro ao auto vincular:", error);
      toast({
        title: "Erro ao vincular automaticamente",
        description: "não foi possível completar a vinculaçÍo automática.",
        variant: "destructive",
      });
    } finally {
      setAutoVinculandoPricelist(false);
    }
  };

  // Encontrar serviços similares ao selecionado
  const encontrarServicosSimilares = (servico: ServicoAnalise): ServicoAnalise[] => {
    const descricaoNorm = normalizarTexto(servico.descricao);

    // Extrair palavras-chave principais (ignorar preposições e artigos)
    const palavrasIgnorar = ["de", "da", "do", "das", "dos", "em", "com", "para", "e", "ou", "no", "na", "nos", "nas", "ao", "aos"];
    const palavrasChave = descricaoNorm
      .split(/\s+/)
      .filter(p => p.length > 2 && !palavrasIgnorar.includes(p))
      .slice(0, 3); // Primeiras 3 palavras significativas

    if (palavrasChave.length === 0) return [];

    // Encontrar serviços que contenham as mesmas palavras-chave
    return servicosExtraidos.filter(s => {
      if (s.id === servico.id) return false; // Ignorar o próprio serviço
      if (s.pricelist_item_id) return false; // Já vinculado

      const descNorm = normalizarTexto(s.descricao);
      // Verificar se pelo menos 2 palavras-chave coincidem
      const coincidencias = palavrasChave.filter(p => descNorm.includes(p));
      return coincidencias.length >= Math.min(2, palavrasChave.length);
    });
  };

  // Vincular serviço a item do pricelist
  const handleVincularServico = async (pricelistItemId: string, pricelistItem: PricelistItemCompleto) => {
    if (!servicoSelecionado || !id) return;

    setVinculandoPricelist(true);
    try {
      // Vincular o serviço selecionado (score de 0 a 1)
      await vincularServicoAoPricelist(servicoSelecionado.id, pricelistItemId, 1.0);

      // Atualizar estado local - incluir pricelist_item para resumo por tipo
      const pricelistItemData = { tipo: pricelistItem.tipo || "outro", nome: pricelistItem.nome };
      setServicosExtraidos(prev => prev.map(s =>
        s.id === servicoSelecionado.id
          ? { ...s, pricelist_item_id: pricelistItemId, termo_busca: pricelistItem.nome, pricelist_item: pricelistItemData }
          : s
      ));

      // Se replicar similares estiver ativo
      if (replicarSimilares) {
        const similares = encontrarServicosSimilares(servicoSelecionado);
        if (similares.length > 0) {
          // Vincular todos os similares (score 0.9 = 90%)
          for (const similar of similares) {
            await vincularServicoAoPricelist(similar.id, pricelistItemId, 0.9);
          }

          // Atualizar estado local para todos os similares - incluir pricelist_item
          setServicosExtraidos(prev => prev.map(s => {
            if (similares.find(sim => sim.id === s.id)) {
              return { ...s, pricelist_item_id: pricelistItemId, termo_busca: pricelistItem.nome, pricelist_item: pricelistItemData };
            }
            return s;
          }));

          toast({
            title: "VinculaçÍo replicada!",
            description: `Vinculado "${pricelistItem.nome}" ao serviço + ${similares.length} similares`,
          });
        } else {
          toast({
            title: "Vinculado!",
            description: `"${pricelistItem.nome}" vinculado ao serviço`,
          });
        }
      } else {
        toast({
          title: "Vinculado!",
          description: `"${pricelistItem.nome}" vinculado ao serviço`,
        });
      }

      handleFecharModalVinculacao();
      await abrirProximoDaFila(servicoSelecionado.id);
    } catch (error: any) {
      console.error("Erro ao vincular:", error);
      toast({
        title: "Erro ao vincular",
        description: error.message || "não foi possível vincular o serviço",
        variant: "destructive",
      });
    } finally {
      setVinculandoPricelist(false);
    }
  };

  // Criar novo item no pricelist e vincular
  const handleCriarEVincular = async () => {
    if (!servicoSelecionado || !id || !novoItemNome.trim() || !novoItemCategoria) {
      toast({
        title: "Dados incompletos",
        description: "Preencha o nome e selecione uma categoria",
        variant: "destructive",
      });
      return;
    }

    setVinculandoPricelist(true);
    try {
      // Gerar código único para o item
      const codigoGerado = await gerarCodigoItem("mao_obra");

      // Criar o item no pricelist
      const novoItem = await criarItem({
        codigo: codigoGerado,
        nome: novoItemNome.trim(),
        tipo: "mao_obra", // PadrÍo para serviços de obra
        categoria_id: novoItemCategoria,
        unidade: novoItemUnidade,
        preco: novoItemPreco ? parseFloat(novoItemPreco.replace(",", ".")) : 0,
        ativo: true,
      });

      // Vincular o serviço ao novo item (score de 0 a 1)
      await vincularServicoAoPricelist(servicoSelecionado.id, novoItem.id, 1.0);

      // Atualizar estado local - incluir pricelist_item para resumo por tipo
      const novoItemData = { tipo: novoItem.tipo || "outro", nome: novoItem.nome };
      setServicosExtraidos(prev => prev.map(s =>
        s.id === servicoSelecionado.id
          ? { ...s, pricelist_item_id: novoItem.id, termo_busca: novoItem.nome, pricelist_item: novoItemData }
          : s
      ));

      // Se replicar similares estiver ativo
      if (replicarSimilares) {
        const similares = encontrarServicosSimilares(servicoSelecionado);
        if (similares.length > 0) {
          for (const similar of similares) {
            await vincularServicoAoPricelist(similar.id, novoItem.id, 0.9);
          }

          setServicosExtraidos(prev => prev.map(s => {
            if (similares.find(sim => sim.id === s.id)) {
              return { ...s, pricelist_item_id: novoItem.id, termo_busca: novoItem.nome, pricelist_item: novoItemData };
            }
            return s;
          }));

          toast({
            title: "Item criado e vinculado!",
            description: `"${novoItem.nome}" criado e vinculado a ${similares.length + 1} serviços`,
          });
        } else {
          toast({
            title: "Item criado e vinculado!",
            description: `"${novoItem.nome}" adicionado ao pricelist`,
          });
        }
      } else {
        toast({
          title: "Item criado e vinculado!",
          description: `"${novoItem.nome}" adicionado ao pricelist`,
        });
      }

      handleFecharModalVinculacao();
      await abrirProximoDaFila(servicoSelecionado.id);
    } catch (error: any) {
      console.error("Erro ao criar item:", error);
      toast({
        title: "Erro ao criar item",
        description: error.message || "não foi possível criar o item",
        variant: "destructive",
      });
    } finally {
      setVinculandoPricelist(false);
    }
  };

  // Desvincular serviço do pricelist
  const handleDesvincularServico = async (servico: ServicoAnalise) => {
    try {
      await vincularServicoAoPricelist(servico.id, "", 0);
      setServicosExtraidos(prev => prev.map(s =>
        s.id === servico.id
          ? { ...s, pricelist_item_id: undefined, pricelist_match_score: undefined, pricelist_item: null }
          : s
      ));
      toast({
        title: "Desvinculado",
        description: "Serviço desvinculado do pricelist",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desvincular",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  // Filtrar clientes para busca
  const clientesFiltrados = clienteTermoBusca.length >= 2
    ? clientes.filter((c) => {
        const termo = normalizeSearchTerm(clienteTermoBusca);
        const termoNumerico = termo.replace(/\D/g, "");
        const matchTelefone = termoNumerico.length > 0 &&
          (c.telefone || "").includes(termoNumerico);
        return (
          normalizeSearchTerm(c.nome).includes(termo) ||
          normalizeSearchTerm(c.email || "").includes(termo) ||
          matchTelefone
        );
      }).slice(0, 10)
    : clientes.slice(0, 10);

  // Obter nome do cliente selecionado
  const clienteSelecionado = clientes.find(c => c.id === clienteId);
  const valorBuscaCliente = clienteBuscaAberta
    ? clienteTermoBusca
    : (clienteSelecionado?.nome || clienteTermoBusca);

  // Auto-preencher quando selecionar cliente
  const handleClienteChange = (novoClienteId: string) => {
    setClienteId(novoClienteId);
    setClienteBuscaAberta(false);
    setClienteTermoBusca("");

    // Se estiver editando e já tiver dados, não sobrescrever
    if (isEdit && analise) return;

    const cliente = clientes.find((c) => c.id === novoClienteId);
    if (!cliente) return;

    // Auto-preencher endereço da obra
    // Prioriza endereço da obra se existir, senão usa endereço principal
    if (cliente.obra_endereco_diferente && cliente.obra_logradouro) {
      const partes = [
        cliente.obra_logradouro,
        cliente.obra_numero,
        cliente.obra_complemento,
        cliente.obra_bairro,
        cliente.obra_cidade,
        cliente.obra_estado,
      ].filter(Boolean);
      setEnderecoObra(partes.join(", "));

      // Título: usar complemento da obra se existir
      if (cliente.obra_complemento && !titulo) {
        setTitulo(cliente.obra_complemento);
      }
    } else if (cliente.logradouro) {
      const partes = [
        cliente.logradouro,
        cliente.numero,
        cliente.complemento,
        cliente.bairro,
        cliente.cidade,
        cliente.estado,
      ].filter(Boolean);
      setEnderecoObra(partes.join(", "));

      // Título: usar complemento do endereço principal se existir
      if (cliente.complemento && !titulo) {
        setTitulo(cliente.complemento);
      }
    }
  };

  // Salvar análise e todos os ambientes
  const handleSalvar = async () => {
    if (!clienteId) {
      toast({ title: "Selecione um cliente", variant: "destructive" });
      return;
    }
    if (!titulo.trim()) {
      toast({ title: "Informe um título", variant: "destructive" });
      return;
    }

    // Evitar enviar NaN para campos numéricos (gera 400 no PostgREST)
    const areaTotalSanitizada = (() => {
      const valor = areaTotal.trim().replace(",", ".");
      const num = valor ? Number.parseFloat(valor) : null;
      return Number.isFinite(num) ? num : null;
    })();

    const peDireitoSanitizado = (() => {
      const valor = peDireitoPadrao.trim().replace(",", ".");
      const num = valor ? Number.parseFloat(valor) : null;
      return typeof num === "number" && Number.isFinite(num) ? num : 2.7;
    })();

    setSaving(true);
    try {
      const dados: AnaliseProjetoFormData = {
        cliente_id: clienteId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        tipo_projeto: tipoProjeto,
        tipo_imovel: tipoImovel || undefined,
        area_total: areaTotalSanitizada,
        pe_direito_padrao: peDireitoSanitizado,
        endereco_obra: enderecoObra.trim() || undefined,
        padrao_construtivo: padraoConstrutivo || undefined,
        memorial_descritivo: memorialDescritivo.trim() || undefined,
        contrato_texto: contratoTexto.trim() || undefined,
      };

      let analiseId = id;

      if (isEdit && id) {
        await atualizarAnalise(id, dados);
      } else {
        const novaAnalise = await criarAnalise(dados);
        analiseId = novaAnalise.id;
        if (!novaAnalise.numero) {
          toast({
            title: "Analise criada sem numero",
            description: "O numero sequencial nao foi gerado. Pode ajustar mais tarde.",
          });
        }
      }

      // Salvar todos os ambientes (criar novos ou atualizar existentes)
      if (analiseId) {
        const ambientesAtualizados: AnaliseProjetoAmbiente[] = [];

        // CORREÇÍO: Buscar ambientes existentes no banco para deletar os removidos
        try {
          const { data: ambientesExistentes } = await supabase
            .from("analises_projeto_ambientes")
            .select("id")
            .eq("analise_id", analiseId);

          if (ambientesExistentes && ambientesExistentes.length > 0) {
            // IDs dos ambientes no estado local (exceto temporários)
            const idsLocais = new Set(
              ambientes
                .filter(a => !a.id.startsWith('temp-'))
                .map(a => a.id)
            );

            // Deletar ambientes que existem no banco mas não estÍo no estado local
            for (const ambExistente of ambientesExistentes) {
              if (!idsLocais.has(ambExistente.id)) {
                if (import.meta.env.DEV) console.log(`[Salvar] Deletando ambiente órfÍo: ${ambExistente.id}`);
                await deletarAmbiente(ambExistente.id);
              }
            }
          }
        } catch (err) {
          console.warn("Erro ao verificar ambientes órfÍos:", err);
        }

        // Criar/atualizar ambientes
        for (let i = 0; i < ambientes.length; i++) {
          const ambiente = ambientes[i];
          const ordemAtualizada = i; // Atualizar ordem baseado na posiçÍo atual

          try {
            if (ambiente.id.startsWith('temp-')) {
              // Ambiente novo - criar no banco
              const novoAmbiente = await criarAmbiente({
                ...ambiente,
                analise_id: analiseId,
                ordem: ordemAtualizada,
              });
              ambientesAtualizados.push(novoAmbiente);
            } else {
              // Ambiente existente - atualizar
              const ambienteAtualizado = await atualizarAmbiente(ambiente.id, {
                ...ambiente,
                ordem: ordemAtualizada,
              });
              ambientesAtualizados.push(ambienteAtualizado);
            }
          } catch (err: any) {
            console.error(`Erro ao salvar ambiente ${ambiente.nome}:`, err);
            // Continuar salvando os outros ambientes
          }
        }

        // Atualizar lista local com IDs reais do banco
        setAmbientes(ambientesAtualizados);
      }

      toast({ title: isEdit ? "Análise atualizada com sucesso!" : "Análise criada com sucesso!" });

      if (!isEdit && analiseId) {
        navigate(`/analise-projeto/${analiseId}`);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload de arquivos (múltiplos) - Suporta imagens, PDFs, DWG e DOCX
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const tiposAceitosImagem = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    const novosArquivos: File[] = [];
    const novasPreviewUrls: string[] = [];
    const previewPendentes: number[] = [];
    const arquivosPDF: File[] = [];
    const arquivosDocx: File[] = [];

    // Separar imagens, PDFs e DOCX
    Array.from(files).forEach((file) => {
      const extensao = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      const isDWG = extensao === ".dwg";
      if (isDocxFile(file)) {
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: "Documento muito grande",
            description: `${file.name}: O limite para DOCX é de 20MB.`,
            variant: "destructive",
          });
          return;
        }
        arquivosDocx.push(file);
      } else if (isPDFFile(file)) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "PDF muito grande",
            description: `${file.name}: O limite para PDF é de 50MB.`,
            variant: "destructive",
          });
          return;
        }
        arquivosPDF.push(file);
      } else if (tiposAceitosImagem.includes(file.type)) {
        if (file.size > 20 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name}: O limite é de 20MB por imagem.`,
            variant: "destructive",
          });
          return;
        }
        novosArquivos.push(file);
        novasPreviewUrls.push("");
        previewPendentes.push(novosArquivos.length - 1);
      } else if (isDWG) {
        if (file.size > 50 * 1024 * 1024) {
          toast({
            title: "Arquivo muito grande",
            description: `${file.name}: O limite para DWG é de 50MB.`,
            variant: "destructive",
          });
          return;
        }
        novosArquivos.push(file);
        novasPreviewUrls.push("");
      } else {
        toast({
          title: "Arquivo não suportado",
          description: `${file.name}: Use imagens (JPEG, PNG, GIF, WebP), PDF, DWG ou DOCX.`,
          variant: "destructive",
        });
      }
    });

    // Processar DOCX (extrair texto para memorial)
    if (arquivosDocx.length > 0) {
      for (const docxFile of arquivosDocx) {
        try {
          const texto = await extrairTextoDocx(docxFile);
          if (texto.trim().length > 0) {
            setMemorialDescritivo((prev) =>
              prev.trim() ? `${prev}\n\n--- ${docxFile.name} ---\n${texto}` : texto
            );
            setDocxCarregado(true);
            // Adicionar à lista de arquivos para referência visual (sem preview de imagem)
            novosArquivos.push(docxFile);
            novasPreviewUrls.push("");
            toast({
              title: "Documento carregado!",
              description: `${docxFile.name}: ${texto.length} caracteres extraídos para análise de escopo.`,
            });
          } else {
            toast({
              title: "Documento vazio",
              description: `${docxFile.name}: Nenhum texto foi extraído.`,
              variant: "destructive",
            });
          }
        } catch (err) {
          console.error("Erro ao processar DOCX:", err);
          toast({
            title: "Erro ao ler documento",
            description: `${docxFile.name}: ${err instanceof Error ? err.message : "Erro desconhecido"}`,
            variant: "destructive",
          });
        }
      }
    }

    // Processar PDFs (converter para imagens)
    if (arquivosPDF.length > 0) {
      setProcessandoPDF(true);
      toast({
        title: "Processando PDF...",
        description: "Convertendo páginas do PDF em imagens.",
      });

      for (const pdfFile of arquivosPDF) {
        const result = await convertPDFToImages(pdfFile, 2, 10); // Scale 2x, máx 10 páginas

        if (result.success && result.pages.length > 0) {
          // Converter cada página em File e adicionar
          result.pages.forEach((page) => {
            const pageFile = dataUrlToFile(
              page.dataUrl,
              `${pdfFile.name.replace(".pdf", "")}_pagina${page.pageNumber}.png`
            );
            novosArquivos.push(pageFile);
            novasPreviewUrls.push(page.dataUrl);
          });

          toast({
            title: "PDF convertido!",
            description: `${result.pages.length} página(s) de ${result.totalPages} extraídas de ${pdfFile.name}`,
          });
        } else {
          toast({
            title: "Erro ao processar PDF",
            description: result.error || `não foi possível converter ${pdfFile.name}`,
            variant: "destructive",
          });
        }
      }

      setProcessandoPDF(false);
    }

    if (novosArquivos.length === 0) return;

    // Gerar previews apenas para imagens selecionadas (PDFs já têm preview)
    if (previewPendentes.length > 0) {
      const previews = await Promise.all(
        previewPendentes.map((idx) => {
          const file = novosArquivos[idx];
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });
        })
      );

      previewPendentes.forEach((idx, i) => {
        novasPreviewUrls[idx] = previews[i];
      });
    }

    setArquivos((prev) => [...prev, ...novosArquivos]);
    setPreviewUrls((prev) => [...prev, ...novasPreviewUrls]);
  };

  // Remover arquivo
  const handleRemoverArquivo = (index: number) => {
    setArquivos((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
    if (arquivoSelecionado >= index && arquivoSelecionado > 0) {
      setArquivoSelecionado(arquivoSelecionado - 1);
    }
  };

  // Analisar com IA
  const handleAnalisar = async () => {
    const arquivosParaAnalise = arquivos.filter((arquivo) => arquivo.type.startsWith("image/"));
    const temArquivos = arquivosParaAnalise.length > 0;
    const temMemorial = memorialDescritivo.trim().length > 0;
    const usarIA = modoAnalise === "ia";

    // ValidaçÍo: precisa ter pelo menos arquivos OU memorial
    if (!temArquivos && !temMemorial) {
      const temSomenteCad = arquivos.length > 0;
      toast({
        title: "Adicione conteúdo para analisar",
        description: temSomenteCad
          ? "Arquivos DWG foram anexados, mas a IA precisa de imagens/PDF, DOCX ou memorial textual."
          : "Adicione imagens de plantas, documento DOCX OU cole o plano de obra/memorial.",
        variant: "destructive",
      });
      return;
    }

    if (!isEdit || !id) {
      toast({ title: "Salve a análise primeiro", variant: "destructive" });
      return;
    }

    if (!usarIA && temArquivos) {
      toast({
        title: "Modo sistema é textual",
        description: "Para analisar plantas, selecione o modo IA.",
        variant: "destructive",
      });
      return;
    }

    if (usarIA) {
      setAIProvider(provedorIA);
      const validacao = validarConfiguracaoIA();
      if (!validacao.valido) {
        toast({
          title: "IA não configurada",
          description: validacao.mensagem,
          variant: "destructive",
        });
        return;
      }
    }

    setAnalisando(true);
    progresso.iniciar();

    try {
      // ============================================
      // ANÁLISE SÓ DE MEMORIAL/ESCOPO (sem imagens)
      // Extrai apenas itens de serviço do texto
      // ============================================
      if (!temArquivos && temMemorial) {
        progresso.avancarPara("processando");
        progresso.atualizarProgresso(30);

        if (usarIA) {
          const isDocx = docxCarregado;
          if (import.meta.env.DEV) console.log(`[IA] Modo: Análise de ESCOPO (${isDocx ? "DOCX" : "texto"}, sem imagens)`);
          if (import.meta.env.DEV) console.log(`[IA] Memorial: ${memorialDescritivo.length} caracteres`);

          // Usar ambientes já cadastrados como contexto
          const ambientesConhecidos = ambientes.map(a => ({
            nome: a.nome,
            area: a.area_piso ?? undefined,
            largura: a.largura ?? undefined,
            comprimento: a.comprimento ?? undefined,
          }));

          // Combinar memorial com instruções adicionais se houver
          const textoParaAnalise = promptPersonalizado.trim()
            ? `${memorialDescritivo}\n\n--- INSTRUÇÕES ADICIONAIS ---\n${promptPersonalizado}`
            : memorialDescritivo;

          // DOCX usa analisarDocumentoEscopo (prompt especializado para escopo técnico)
          // Memorial digitado usa analisarEscopoComIA (prompt genérico)
          const resultado = isDocx
            ? await analisarDocumentoEscopo(textoParaAnalise, {
                areaTotalCadastrada: areaTotal ? parseFloat(areaTotal) : undefined,
                tipoImovel: tipoImovel || undefined,
                tipoProjeto: tipoProjeto || undefined,
                padraoConstrutivo: padraoConstrutivo || undefined,
              })
            : await analisarEscopoComIA(
                textoParaAnalise,
                ambientesConhecidos
              );

          if (import.meta.env.DEV) console.log(`[Análise Escopo] IA extraiu ${resultado.servicos?.length || 0} serviços do texto`);
          if (import.meta.env.DEV) console.log(`[Análise Escopo] Ambientes identificados: ${resultado.ambientes?.length || 0}`);
          if (import.meta.env.DEV) console.log("[Análise Escopo] Resultado completo:", JSON.stringify(resultado, null, 2).substring(0, 2000));

          // Se não houver serviços, mostrar aviso
          if (!resultado.servicos || resultado.servicos.length === 0) {
            console.warn("[Análise Escopo] ATENÇÍO: Nenhum serviço foi extraído pela IA!");
            toast({
              title: "Análise incompleta",
              description: "A IA não conseguiu extrair serviços do texto. Verifique o console para mais detalhes.",
              variant: "destructive",
            });
          }

          progresso.avancarPara("ia");
          progresso.atualizarProgresso(70);

          // Salvar resultado (com todos os parâmetros necessários)
          await salvarResultadoAnaliseIA(
            id,
            resultado as any,
            provedorIA,
            provedorIA === "anthropic" ? "claude-sonnet-4" : "gpt-4o",
            progresso.tempoDecorrido * 1000,
            memorialDescritivo
          );

          // Se veio de DOCX, salvar metadados de escopo na tabela analises_projeto
          if (isDocx && resultado.metadados) {
            const meta = resultado.metadados;
            const camposEscopo: Record<string, any> = {};
            if (meta.estilo_conceito) camposEscopo.estilo_conceito = meta.estilo_conceito;
            if (meta.intervencao_principal) camposEscopo.intervencao_principal = meta.intervencao_principal;
            if (meta.proximos_passos) camposEscopo.proximos_passos = meta.proximos_passos;
            if (meta.perfil_cliente) camposEscopo.perfil_cliente = meta.perfil_cliente;

            if (Object.keys(camposEscopo).length > 0) {
              const { error: errEscopo } = await supabase
                .from("analises_projeto")
                .update(camposEscopo)
                .eq("id", id);
              if (errEscopo) {
                console.warn("[DOCX] Erro ao salvar metadados de escopo:", errEscopo);
              } else {
                if (import.meta.env.DEV) console.log("[DOCX] Metadados de escopo salvos:", Object.keys(camposEscopo));
              }
            }
          }
        } else {
          if (import.meta.env.DEV) console.log("[Sistema] Modo: Análise de ESCOPO (regras, sem IA)");
          const textoParaAnalise = promptPersonalizado.trim()
            ? `${memorialDescritivo}\n\n--- INSTRUÇÕES ADICIONAIS ---\n${promptPersonalizado}`
            : memorialDescritivo;

          const servicosSistema = criarServicosSistema(textoParaAnalise);
          const resultadoSistema: AnaliseIAResultado = {
            ambientes: [],
            elementos: [],
            acabamentos: [],
            servicos: servicosSistema,
            riscos: [],
            observacoes: ["Análise de escopo via regras do sistema"],
          };

          if (servicosSistema.length === 0) {
            toast({
              title: "Nenhum serviço identificado",
              description: "O texto não foi reconhecido pelo modo sistema.",
              variant: "destructive",
            });
          }

          await salvarResultadoAnaliseIA(
            id,
            resultadoSistema,
            "sistema",
            "motor-regras",
            progresso.tempoDecorrido * 1000,
            memorialDescritivo
          );
        }

        progresso.avancarPara("finalizando");
        progresso.atualizarProgresso(90);

        // Recarregar análise completa (ambientes + serviços) do banco
        // IMPORTANTE: Após salvarResultadoAnaliseIA, os ambientes têm novos IDs no banco
        if (import.meta.env.DEV) console.log("[Análise Escopo] Recarregando análise completa...");
        const analiseAtualizada = await buscarAnalise(id);
        setAmbientes(analiseAtualizada.ambientes || []);
        if (import.meta.env.DEV) console.log(`[Análise Escopo] Ambientes recarregados: ${analiseAtualizada.ambientes?.length || 0}`);

        // Recarregar serviços
        if (import.meta.env.DEV) console.log("[Análise Escopo] Buscando serviços salvos...");
        const servicosAtualizados = await listarServicos(id);
        if (import.meta.env.DEV) console.log(`[Análise Escopo] Serviços recuperados do banco: ${servicosAtualizados.length}`);
        setServicosExtraidos(servicosAtualizados);
        await autoVincularServicosPricelist(servicosAtualizados);

        await atualizarStatusAnalise(id, "analisado");

        progresso.atualizarProgresso(100);
        progresso.finalizar();

        toast({
          title: "Escopo analisado!",
          description: `${servicosAtualizados.length} itens de serviço extraídos do memorial.`,
        });

        setAnalisando(false);
        return;
      }

      // ============================================
      // ANÁLISE COM IMAGENS (código existente)
      // ============================================
      // Etapa 1: Atualizar status
      progresso.avancarPara("upload");
      await atualizarStatusAnalise(id, "analisando");
      progresso.atualizarProgresso(50);

      // ============================================
      // ANALISAR TODOS OS ARQUIVOS (não só 1)
      // ============================================
      const resultadosArquivos: any[] = [];
      const totalArquivos = arquivosParaAnalise.length;

      // Etapa 2: Processar TODOS os arquivos
      progresso.avancarPara("processando");

      // Contexto para a IA com área cadastrada
      const areaCadastrada = areaTotal ? parseFloat(areaTotal) : undefined;

      for (let i = 0; i < totalArquivos; i++) {
        const arquivo = arquivosParaAnalise[i];
        const progArquivo = Math.round(((i + 1) / totalArquivos) * 100);
        progresso.atualizarProgresso(progArquivo);

        try {
          const imagemBase64 = await processarArquivoProjeto(arquivo);

          // Determinar media type
          let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
          if (arquivo.type === "image/png") mediaType = "image/png";
          else if (arquivo.type === "image/gif") mediaType = "image/gif";
          else if (arquivo.type === "image/webp") mediaType = "image/webp";

          // Analisar cada arquivo COM CONTEXTO DA ÁREA CADASTRADA
          const resultadoArquivo = await analisarProjetoComIA(
            imagemBase64,
            "completo",
            mediaType,
            promptPersonalizado || undefined,
            {
              areaTotalCadastrada: areaCadastrada,
              tipoImovel: tipoImovel || undefined,
              tipoProjeto: tipoProjeto || undefined,
              padraoConstrutivo: padraoConstrutivo || undefined,
              numeroArquivos: totalArquivos,
              arquivoAtual: i + 1,
            }
          );

          resultadosArquivos.push(resultadoArquivo);
          if (import.meta.env.DEV) console.log(`[IA] Arquivo ${i + 1}/${totalArquivos} analisado: ${arquivo.name}`);
        } catch (err) {
          console.warn(`[IA] Erro no arquivo ${i + 1}: ${arquivo.name}`, err);
        }
      }

      // Etapa 3: Combinar resultados de todos os arquivos
      progresso.avancarPara("ia", true);

      // FunçÍo para normalizar nomes de ambientes (remove acentos, variações)
      const normalizarNomeAmbiente = (nome: string): string => {
        if (!nome) return '';
        return nome
          .toLowerCase()
          .trim()
          // Remover acentos
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          // Variações comuns
          .replace(/suite/g, 'suite')
          .replace(/suíte/g, 'suite')
          .replace(/banheiro/g, 'banho')
          .replace(/lavabo/g, 'lavabo')
          .replace(/cozinha americana/g, 'cozinha')
          .replace(/sala de estar/g, 'sala estar')
          .replace(/sala de jantar/g, 'sala jantar')
          .replace(/sala de tv/g, 'sala tv')
          .replace(/home office/g, 'escritorio')
          .replace(/home theater/g, 'home theater')
          // Remover números e sufixos como "1", "2", "master", "social"
          .replace(/\s*(master|social|intimo|intima|servico|hóspedes|hospedes|casal|solteiro|principal)\s*/g, ' ')
          .replace(/\s*\d+\s*/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      // Merge de ambientes (evitar duplicados por nome normalizado)
      const ambientesMap = new Map<string, any>();
      const elementosTodos: any[] = [];
      const acabamentosTodos: any[] = [];
      const servicosTodos: any[] = [];

      for (const resultado of resultadosArquivos) {
        // Ambientes - merge por nome normalizado
        for (const amb of resultado.ambientes || []) {
          const chave = normalizarNomeAmbiente(amb.nome);
          if (!ambientesMap.has(chave)) {
            ambientesMap.set(chave, amb);
          } else {
            // Merge de dados (pegar valores maiores/melhores)
            const existente = ambientesMap.get(chave);
            ambientesMap.set(chave, {
              ...existente,
              // Manter o nome original do primeiro encontrado
              area: Math.max(existente.area || 0, amb.area || 0),
              largura: existente.largura || amb.largura,
              comprimento: existente.comprimento || amb.comprimento,
              pe_direito: existente.pe_direito || amb.pe_direito,
            });
          }
        }

        // Elementos - acumular todos
        elementosTodos.push(...(resultado.elementos || []));

        // Acabamentos - acumular todos
        acabamentosTodos.push(...(resultado.acabamentos || []));

        // Serviços - acumular todos
        servicosTodos.push(...(resultado.servicos || []));
      }

      // Resultado combinado
      const resultadoCombinado = {
        ambientes: Array.from(ambientesMap.values()),
        elementos: elementosTodos,
        acabamentos: acabamentosTodos,
        servicos: servicosTodos,
      };

      // Se tem memorial/plano de obra, adicionar contexto extra
      if (memorialDescritivo && memorialDescritivo.trim().length > 50) {
        if (import.meta.env.DEV) console.log("[IA] Incluindo memorial/plano de obra na análise...");
        try {
          const { analisarEscopoComIA } = await import("@/lib/projetoAnaliseAI");
          const resultadoMemorial = await analisarEscopoComIA(memorialDescritivo);

          // Adicionar serviços do memorial
          resultadoCombinado.servicos.push(...(resultadoMemorial.servicos || []));

          // Adicionar ambientes do memorial (se não existirem - usando mesma normalizaçÍo)
          for (const amb of resultadoMemorial.ambientes || []) {
            const chave = normalizarNomeAmbiente(amb.nome);
            if (!ambientesMap.has(chave)) {
              ambientesMap.set(chave, amb); // Adicionar ao map para evitar duplicaçÍo futura
              resultadoCombinado.ambientes.push(amb);
            }
          }

          if (import.meta.env.DEV) console.log(`[IA] Memorial: +${resultadoMemorial.servicos?.length || 0} serviços adicionados`);
        } catch (err) {
          console.warn("[IA] Erro ao analisar memorial:", err);
        }
      }

      // Etapa 4: Salvar resultado combinado
      progresso.avancarPara("salvando");
      progresso.atualizarProgresso(30);
      await salvarResultadoAnaliseIA(
        id,
        resultadoCombinado as any,
        provedorIA,
        provedorIA === "anthropic" ? "claude-sonnet-4" : "gpt-4o",
        progresso.tempoDecorrido * 1000,
        promptPersonalizado || undefined
      );
      progresso.atualizarProgresso(100);

      // Concluído
      progresso.finalizar();

      const numServicos = resultadoCombinado.servicos?.length || 0;
      toast({
        title: "Análise concluída!",
        description: `${totalArquivos} arquivos analisados: ${resultadoCombinado.ambientes.length} ambientes e ${numServicos} serviços identificados em ${progresso.tempoDecorrido}s.`,
      });

      // Recarregar dados
      await carregarAnalise(id);
    } catch (error: any) {
      console.error("Erro na análise:", error);
      progresso.resetar();
      toast({
        title: "Erro na análise",
        description: error.message,
        variant: "destructive",
      });
      if (id) {
        await atualizarStatusAnalise(id, "rascunho");
      }
    } finally {
      setAnalisando(false);
    }
  };

  // Aprovar análise
  const handleAprovar = async () => {
    if (!id) return;
    try {
      await atualizarStatusAnalise(id, "aprovado");
      toast({ title: "Análise aprovada!" });
      await carregarAnalise(id);
    } catch (error: any) {
      toast({ title: "Erro ao aprovar", description: error.message, variant: "destructive" });
    }
  };

  // Toggle ambiente expandido
  const toggleAmbiente = (ambienteId: string) => {
    const newExpanded = new Set(expandedAmbientes);
    if (newExpanded.has(ambienteId)) {
      newExpanded.delete(ambienteId);
    } else {
      newExpanded.add(ambienteId);
    }
    setExpandedAmbientes(newExpanded);
  };

  // Drag & Drop handlers para reordenar ambientes
  const handleDragStart = (e: React.DragEvent, ambienteId: string) => {
    setDraggedAmbiente(ambienteId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", ambienteId);
    // Adicionar classe visual ao elemento arrastado
    const target = e.currentTarget as HTMLElement;
    setTimeout(() => target.classList.add("opacity-50"), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove("opacity-50");
    setDraggedAmbiente(null);
    setDragOverAmbiente(null);
  };

  const handleDragOver = (e: React.DragEvent, ambienteId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedAmbiente && draggedAmbiente !== ambienteId) {
      setDragOverAmbiente(ambienteId);
    }
  };

  const handleDragLeave = () => {
    setDragOverAmbiente(null);
  };

  const handleDrop = (e: React.DragEvent, targetAmbienteId: string) => {
    e.preventDefault();
    if (!draggedAmbiente || draggedAmbiente === targetAmbienteId) return;

    // Reordenar ambientes
    setAmbientes((prev) => {
      const newAmbientes = [...prev];
      const draggedIndex = newAmbientes.findIndex((a) => a.id === draggedAmbiente);
      const targetIndex = newAmbientes.findIndex((a) => a.id === targetAmbienteId);

      if (draggedIndex === -1 || targetIndex === -1) return prev;

      // Remover o item arrastado e inserir na nova posiçÍo
      const [draggedItem] = newAmbientes.splice(draggedIndex, 1);
      newAmbientes.splice(targetIndex, 0, draggedItem);

      // Atualizar ordem no objeto
      return newAmbientes.map((amb, idx) => ({ ...amb, ordem: idx + 1 }));
    });

    setDraggedAmbiente(null);
    setDragOverAmbiente(null);
  };

  // Deletar ambiente
  const handleDeletarAmbiente = async (ambienteId: string) => {
    if (!confirm("Tem certeza que deseja excluir este ambiente?")) return;
    try {
      // Se for ambiente temporário (não salvo no banco), apenas remover do estado
      if (ambienteId.startsWith('temp-')) {
        setAmbientes((prev) => prev.filter((a) => a.id !== ambienteId));
        toast({ title: "Ambiente removido" });
        return;
      }
      // Ambiente salvo no banco - chamar API
      await deletarAmbiente(ambienteId);
      setAmbientes((prev) => prev.filter((a) => a.id !== ambienteId));
      toast({ title: "Ambiente excluído" });
    } catch (error: any) {
      toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" });
    }
  };

  // Adicionar novo tipo de ambiente (apenas MASTER)
  const handleAdicionarNovoTipo = async () => {
    if (!novoTipoNome.trim()) return;
    try {
      await adicionarTipoAmbiente(novoTipoNome.trim());
      toast({ title: "Tipo adicionado", description: `"${novoTipoNome}" adicionado com sucesso` });
      setAdicionandoTipo(false);
      setNovoTipoNome("");
    } catch (error: any) {
      toast({ title: "Erro ao adicionar tipo", description: error.message, variant: "destructive" });
    }
  };

  // Duplicar ambiente existente
  const handleDuplicarAmbiente = (ambiente: AnaliseProjetoAmbiente) => {
    const novoId = `temp-${Date.now()}`;
    // Gerar novo nome com sufixo (Cópia)
    const nomeBase = ambiente.nome.replace(/ \(Cópia\d*\)$/, '');
    const copias = ambientes.filter(a =>
      a.nome === nomeBase || a.nome.startsWith(`${nomeBase} (Cópia`)
    ).length;
    const novoNome = copias > 0
      ? `${nomeBase} (Cópia ${copias})`
      : `${nomeBase} (Cópia)`;

    const ambienteDuplicado: AnaliseProjetoAmbiente = {
      ...ambiente,
      id: novoId,
      nome: novoNome,
      ordem: 0,
      origem: 'manual',
      editado_manualmente: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };

    // Inserir logo após o ambiente original
    const indexOriginal = ambientes.findIndex(a => a.id === ambiente.id);
    setAmbientes(prev => {
      const novosAmbientes = [...prev];
      novosAmbientes.splice(indexOriginal + 1, 0, ambienteDuplicado);
      return novosAmbientes;
    });

    // Expandir o novo ambiente
    setExpandedAmbientes(prev => new Set([...prev, novoId]));

    toast({
      title: "Ambiente duplicado",
      description: `"${novoNome}" criado com sucesso`
    });
  };

  // FunçÍo auxiliar para gerar nome sequencial do ambiente
  const gerarNomeAmbiente = (tipoBase: TipoAmbiente | string | null): string => {
    // Buscar nome do tipo nos tipos dinâmicos do hook
    const tipoEncontrado = tipoBase ? tiposAmbiente.find(t => t.codigo === tipoBase) : null;

    if (!tipoBase || !tipoEncontrado) {
      return `Ambiente ${ambientes.length + 1}`;
    }

    const nomeBase = tipoEncontrado.nome;
    // Contar quantos ambientes do mesmo tipo já existem
    const existentes = ambientes.filter(a => a.tipo === tipoBase).length;

    // Para tipos que normalmente têm apenas 1 (cozinha, lavabo, etc.), não numerar
    const tiposSemNumero = ['cozinha', 'lavabo', 'area_servico', 'lavanderia', 'corredor', 'hall', 'deposito', 'garagem'];
    if (tiposSemNumero.includes(tipoBase) && existentes === 0) {
      return nomeBase;
    }

    return `${nomeBase} ${existentes + 1}`;
  };

  // Adicionar novo ambiente manualmente
  const handleAdicionarAmbiente = () => {
    const novoId = `temp-${Date.now()}`;
    const peDireito = parseFloat(peDireitoPadrao) || 2.7;
    const novoAmbienteData: AnaliseProjetoAmbiente = {
      id: novoId,
      analise_id: id || '',
      nome: gerarNomeAmbiente(null),
      tipo: null,
      codigo: null,
      largura: 3.00,
      comprimento: 4.00,
      pe_direito: peDireito,
      area_piso: 12.00,
      area_teto: 12.00,
      perimetro: 14.00,
      area_paredes_bruta: 14.00 * peDireito,
      area_paredes_liquida: 14.00 * peDireito,
      portas: [],
      janelas: [],
      vaos: [],
      envidracamentos: [],
      area_vaos_total: 0,
      tomadas_110v: 0,
      tomadas_220v: 0,
      tomadas_especiais: [],
      pontos_iluminacao: 0,
      interruptores_simples: 0,
      interruptores_paralelo: 0,
      interruptores_intermediario: 0,
      circuitos: [],
      pontos_agua_fria: 0,
      pontos_agua_quente: 0,
      pontos_esgoto: 0,
      pontos_gas: 0,
      tubulacao_seca: [],
      piso_tipo: null,
      piso_area: null,
      parede_tipo: null,
      parede_area: null,
      teto_tipo: null,
      teto_area: null,
      rodape_tipo: null,
      rodape_ml: null,
      ordem: 0,
      observacoes: null,
      alertas: [],
      origem: 'manual',
      editado_manualmente: true,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString(),
    };
    // Adicionar na PRIMEIRA posiçÍo da lista
    setAmbientes(prev => [novoAmbienteData, ...prev]);
    setExpandedAmbientes(prev => new Set([...prev, novoId]));
    setEditandoAmbiente(novoId);
    setNovoAmbiente(false);
    toast({ title: "Ambiente adicionado", description: "Edite os campos conforme necessário." });
  };

  // FunçÍo para normalizar entrada numérica (aceita vírgula como separador decimal)
  const normalizarNumero = (texto: string): string => {
    // Substitui vírgula por ponto em qualquer posiçÍo
    return texto.replace(/,/g, '.');
  };

  // FunçÍo para formatar número para exibiçÍo (usando vírgula como separador decimal)
  const formatarParaExibicao = (valor: number | null | undefined): string => {
    if (valor === null || valor === undefined || isNaN(valor)) return '';
    return valor.toString().replace('.', ',');
  };

  // Estado para inputs em ediçÍo (permite digitar vírgula temporariamente)
  const [inputsEmEdicao, setInputsEmEdicao] = useState<Record<string, string>>({});

  // Obter valor do input (prioriza valor em ediçÍo, senão usa valor do ambiente)
  const getInputValue = (ambienteId: string, campo: string, valorReal: number | null | undefined): string => {
    const key = `${ambienteId}-${campo}`;
    if (inputsEmEdicao[key] !== undefined) {
      return inputsEmEdicao[key];
    }
    return valorReal !== null && valorReal !== undefined ? valorReal.toString() : '';
  };

  // Handler para onChange de inputs numéricos (mantém valor temporário com vírgula)
  const handleInputChange = (ambienteId: string, campo: string, valor: string) => {
    const key = `${ambienteId}-${campo}`;
    setInputsEmEdicao(prev => ({ ...prev, [key]: valor }));
  };

  // Handler para onBlur de inputs numéricos (converte e salva)
  const handleInputBlur = (ambienteId: string, campo: keyof AnaliseProjetoAmbiente, valor: string) => {
    const key = `${ambienteId}-${campo}`;
    const valorNumerico = avaliarExpressao(valor);
    handleAtualizarCampoAmbiente(ambienteId, campo, valorNumerico);
    // Limpar estado de ediçÍo
    setInputsEmEdicao(prev => {
      const novo = { ...prev };
      delete novo[key];
      return novo;
    });
  };

  // Handler para inputs de vÍos (porta/janela/vÍo) - aceita vírgula
  const getVaoInputValue = (ambienteId: string, tipo: string, idx: number, campo: string, valorReal: number): string => {
    const key = `${ambienteId}-${tipo}-${idx}-${campo}`;
    if (inputsEmEdicao[key] !== undefined) {
      return inputsEmEdicao[key];
    }
    return valorReal.toString();
  };

  const handleVaoInputChange = (ambienteId: string, tipo: string, idx: number, campo: string, valor: string) => {
    const key = `${ambienteId}-${tipo}-${idx}-${campo}`;
    setInputsEmEdicao(prev => ({ ...prev, [key]: valor }));
  };

  const limparVaoInput = (ambienteId: string, tipo: string, idx: number, campo: string) => {
    const key = `${ambienteId}-${tipo}-${idx}-${campo}`;
    setInputsEmEdicao(prev => {
      const novo = { ...prev };
      delete novo[key];
      return novo;
    });
  };

  // FunçÍo para avaliar expressões matemáticas (ex: 3+2+1.5 = 6.5)
  const avaliarExpressao = (texto: string): number => {
    try {
      // Normaliza vírgula para ponto e remove espaços
      const limpo = normalizarNumero(texto).replace(/\s+/g, '');
      // Valida se contém apenas números, +, -, *, / e .
      if (!/^[\d+\-*/().]+$/.test(limpo) || limpo === '') {
        return parseFloat(limpo) || 0;
      }
      // Avalia a expressÍo de forma segura
      const resultado = Function(`'use strict'; return (${limpo})`)();
      return typeof resultado === 'number' && !isNaN(resultado) ? Math.round(resultado * 100) / 100 : 0;
    } catch {
      return parseFloat(normalizarNumero(texto)) || 0;
    }
  };

  // Handler para inputs com suporte a expressões matemáticas
  const handleInputExpressao = (
    ambienteId: string,
    campo: keyof AnaliseProjetoAmbiente,
    inputValue: string,
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      const valorCalculado = avaliarExpressao(inputValue);
      handleAtualizarCampoAmbiente(ambienteId, campo, valorCalculado);
      // Atualiza o valor do input para mostrar o resultado
      (e.target as HTMLInputElement).value = valorCalculado.toString();
    }
  };

  // Atualizar campo do ambiente
  const handleAtualizarCampoAmbiente = (ambienteId: string, campo: keyof AnaliseProjetoAmbiente, valor: any) => {
    setAmbientes(prev => prev.map(a => {
      if (a.id !== ambienteId) return a;

      const updated = { ...a, [campo]: valor, editado_manualmente: true };
      const peDireito = a.pe_direito || parseFloat(peDireitoPadrao) || 2.7;

      // Recalcular áreas se dimensões mudaram
      if (campo === 'largura' || campo === 'comprimento') {
        const largura = campo === 'largura' ? valor : a.largura || 0;
        const comprimento = campo === 'comprimento' ? valor : a.comprimento || 0;
        const areaPiso = largura * comprimento;
        updated.area_piso = areaPiso;
        updated.area_teto = areaPiso;
        updated.perimetro = 2 * (largura + comprimento);
        const areaBruta = updated.perimetro * peDireito;
        const areaVaos = calcularAreaVaos(a.portas || [], a.janelas || [], a.vaos || [], a.envidracamentos || []);
        updated.area_paredes_bruta = areaBruta;
        updated.area_paredes_liquida = Math.max(0, areaBruta - areaVaos);
        // Sincronizar revestimentos
        updated.piso_area = areaPiso;
        updated.parede_area = Math.max(0, areaBruta - areaVaos);
      }

      // Se alterou a área diretamente, calcular perímetro como se fosse ambiente quadrado
      if (campo === 'area_piso') {
        const area = valor || 0;
        updated.area_teto = area;
        // Calcular perímetro para ambiente quadrado equivalente
        const ladoQuadrado = Math.sqrt(area);
        updated.perimetro = 4 * ladoQuadrado;
        // Calcular área de paredes
        const areaBruta = updated.perimetro * peDireito;
        const areaVaos = calcularAreaVaos(a.portas || [], a.janelas || [], a.vaos || [], a.envidracamentos || []);
        updated.area_paredes_bruta = areaBruta;
        updated.area_paredes_liquida = Math.max(0, areaBruta - areaVaos);
        // Sincronizar revestimentos
        updated.piso_area = area;
        updated.parede_area = Math.max(0, areaBruta - areaVaos);
      }

      if (campo === 'pe_direito') {
        const perimetro = a.perimetro || 0;
        const areaBruta = perimetro * (valor || parseFloat(peDireitoPadrao) || 2.7);
        const areaVaos = calcularAreaVaos(a.portas || [], a.janelas || [], a.vaos || [], a.envidracamentos || []);
        updated.area_paredes_bruta = areaBruta;
        updated.area_paredes_liquida = Math.max(0, areaBruta - areaVaos);
        // Sincronizar revestimento parede
        updated.parede_area = Math.max(0, areaBruta - areaVaos);
      }

      // Se mudou o tipo, sugerir atualizaçÍo do nome
      if (campo === 'tipo' && valor) {
        const novoNome = gerarNomeAmbiente(valor as TipoAmbiente);
        // Só atualizar o nome se for o nome genérico padrÍo
        if (a.nome.startsWith('Ambiente ')) {
          updated.nome = novoNome;
        }
      }

      return updated;
    }));
  };

  // Loading
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0ABAB5] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Carregando análise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-[1800px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/analise-projeto")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-[#0ABAB5] to-[#0A8C88] rounded-xl flex items-center justify-center">
                  <Ruler className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-normal text-gray-900">
                    {isEdit ? "Editar Análise" : "Nova Análise de Projeto"}
                  </h1>
                  {analise && (
                    <div className="flex items-center gap-2 mt-0.5">
                      {analise.numero && (
                        <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                          {analise.numero}
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{
                          backgroundColor: `${getStatusColor(analise.status)}20`,
                          color: getStatusColor(analise.status),
                        }}
                      >
                        {getStatusLabel(analise.status)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Botao Aprovar - aparece para rascunho, analisando e analisado */}
              {analise?.status && ["rascunho", "analisando", "analisado"].includes(analise.status) && (
                <button
                  onClick={handleAprovar}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Aprovar
                </button>
              )}
              <button
                onClick={handleSalvar}
                disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-[#0ABAB5] text-white rounded-lg font-medium hover:bg-[#0A8C88] transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo - 3 Colunas: Projeto+Upload | Escopo/Plano | Ambientes */}
      <div className="max-w-[1800px] mx-auto px-6 py-6">
        <div className="grid grid-cols-[0.85fr_1.15fr_2fr] gap-4">
          {/* COLUNA 1: Informações do Projeto */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h2 className="text-sm font-normal text-gray-900 mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#0ABAB5]" />
                Informações do Projeto
              </h2>

              <div className="space-y-2">
                {/* Cliente - Sistema de Busca */}
                <div className="relative">
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Cliente *
                  </label>

                  {/* Campo de busca */}
                  <div className="relative">
                    <input
                      type="text"
                      value={valorBuscaCliente}
                      onChange={(e) => {
                        setClienteTermoBusca(e.target.value);
                        if (!clienteBuscaAberta) {
                          setClienteBuscaAberta(true);
                        }
                      }}
                      onFocus={() => setClienteBuscaAberta(true)}
                      placeholder="Buscar cliente..."
                      className={`w-full px-3 py-1.5 pr-9 text-sm border rounded-lg transition-all focus:outline-none ${
                        clienteBuscaAberta
                          ? "border-[#0ABAB5] ring-2 ring-[#0ABAB5]"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    />
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>

                  {/* Dropdown de busca */}
                  {clienteBuscaAberta && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-300 rounded-xl shadow-2xl z-50 overflow-hidden">
                      {/* Campo de busca */}
                      <div className="p-2 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Digite para buscar..."
                            value={clienteTermoBusca}
                            onChange={(e) => setClienteTermoBusca(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5]"
                            autoFocus
                          />
                        </div>
                      </div>

                      {/* Lista de resultados */}
                      <div className="max-h-60 overflow-y-auto">
                        {clientesFiltrados.length > 0 ? (
                          clientesFiltrados.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleClienteChange(c.id)}
                              className={`w-full p-3 text-left hover:bg-[#0ABAB5]/10 border-b border-gray-100 last:border-b-0 transition-colors ${
                                c.id === clienteId ? "bg-[#0ABAB5]/5" : ""
                              }`}
                            >
                              <p className="font-medium text-gray-900 text-sm">{c.nome}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {c.email && (
                                  <span className="text-xs text-gray-500">{c.email}</span>
                                )}
                                {c.telefone && (
                                  <span className="text-xs text-gray-400">• {c.telefone}</span>
                                )}
                              </div>
                              {/* Mostrar endereço da obra se existir */}
                              {(c.obra_endereco_diferente && c.obra_cidade) && (
                                <span className="text-xs text-[#0ABAB5] mt-1 block">
                                  📍 {c.obra_cidade}{c.obra_estado ? `, ${c.obra_estado}` : ""}
                                </span>
                              )}
                            </button>
                          ))
                        ) : clienteTermoBusca.length >= 2 ? (
                          <div className="p-4 text-center text-gray-500 text-sm">
                            Nenhum cliente encontrado
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-400 text-sm">
                            {clientes.length > 0
                              ? `${clientes.length} clientes • Digite para filtrar`
                              : "Carregando clientes..."}
                          </div>
                        )}
                      </div>

                      {/* BotÍo cancelar */}
                      <div className="p-2 border-t border-gray-200 bg-gray-50">
                        <button
                          type="button"
                          onClick={() => {
                            setClienteBuscaAberta(false);
                            setClienteTermoBusca("");
                          }}
                          className="w-full py-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Título */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-0.5">
                    Título do Projeto *
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Reforma Apartamento 302"
                    className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                  />
                </div>

                {/* Tipo de Projeto e Imóvel em linha */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Tipo Projeto
                    </label>
                    <select
                      value={tipoProjeto}
                      onChange={(e) => setTipoProjeto(e.target.value as TipoProjeto)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                    >
                      {Object.entries(TIPO_PROJETO_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Tipo Imóvel
                    </label>
                    <select
                      value={tipoImovel}
                      onChange={(e) => setTipoImovel(e.target.value as TipoImovel | "")}
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                    >
                      <option value="">Selecione</option>
                      {Object.entries(TIPO_IMOVEL_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Área Total, Pé-direito e PadrÍo - Mesma linha */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Área (m²)
                    </label>
                    <input
                      type="number"
                      value={areaTotal}
                      onChange={(e) => setAreaTotal(e.target.value)}
                      placeholder="85"
                      step="0.01"
                      className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      Pé-dir. (m)
                    </label>
                    <div className="flex gap-1 items-center">
                      <input
                        type="text"
                        value={peDireitoPadrao}
                        onChange={(e) => setPeDireitoPadrao(normalizarNumero(e.target.value))}
                        onBlur={(e) => {
                          const valor = parseFloat(normalizarNumero(e.target.value));
                          if (!isNaN(valor) && valor > 0) {
                            setPeDireitoPadrao(valor.toFixed(2));
                          }
                        }}
                        placeholder="2,70"
                        className="flex-1 min-w-0 px-1.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none text-center"
                      />
                      {ambientes.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const novoPeDireito = parseFloat(peDireitoPadrao) || 2.7;
                            setAmbientes(prev => prev.map(a => {
                              const perimetro = a.perimetro || 0;
                              const areaBruta = perimetro * novoPeDireito;
                              const areaVaos = calcularAreaVaos(a.portas || [], a.janelas || [], a.vaos || [], a.envidracamentos || []);
                              return {
                                ...a,
                                pe_direito: novoPeDireito,
                                area_paredes_bruta: areaBruta,
                                area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                parede_area: Math.max(0, areaBruta - areaVaos)
                              };
                            }));
                            toast({ title: "Pé-direito aplicado!" });
                          }}
                          className="p-1 bg-[#0ABAB5]/10 text-[#0ABAB5] rounded hover:bg-[#0ABAB5]/20 transition-colors flex-shrink-0"
                          title="Aplicar a todos"
                        >
                          <RefreshCw className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-0.5">
                      PadrÍo
                    </label>
                    <select
                      value={padraoConstrutivo}
                      onChange={(e) => setPadraoConstrutivo(e.target.value as PadraoConstrutivo | "")}
                      className="w-full px-1.5 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                    >
                      <option value="">-</option>
                      {Object.entries(PADRAO_CONSTRUTIVO_LABELS).map(([key, label]) => (
                        <option key={key} value={key}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Upload de Plantas (Múltiplas) - Agora dentro da Coluna 1 */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-normal text-gray-900 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#0ABAB5]" />
                  Plantas do Projeto
                </h2>
                {arquivos.length > 0 && (
                  <span className="text-xs text-gray-500">
                    {arquivos.length} {arquivos.length === 1 ? "arquivo" : "arquivos"}
                  </span>
                )}
              </div>

              {/* Área de upload - Compacta */}
              <div
                onClick={() => !processandoPDF && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-lg p-3 text-center transition-all mb-2 ${
                  processandoPDF
                    ? "border-purple-300 bg-purple-50 cursor-wait"
                    : "border-gray-300 cursor-pointer hover:border-[#0ABAB5] hover:bg-[#0ABAB5]/5"
                }`}
              >
                {processandoPDF ? (
                  <>
                    <Loader2 className="w-6 h-6 text-purple-500 mx-auto mb-1 animate-spin" />
                    <p className="text-purple-700 font-medium text-xs">Processando PDF...</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                    <p className="text-gray-700 font-medium text-xs">Clique para adicionar plantas</p>
                    <p className="text-[10px] text-gray-500">Imagens, PDF, DWG ou DOCX (máx. 20MB/50MB)</p>
                  </>
                )}
              </div>

              {/* Lista de arquivos - Compacta */}
              {arquivos.length > 0 && (
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {arquivos.map((arquivo, index) => (
                    <div
                      key={index}
                      onClick={() => setArquivoSelecionado(index)}
                      className={`bg-gray-50 rounded p-2 flex items-center justify-between cursor-pointer transition-all ${
                        arquivoSelecionado === index
                          ? "ring-1 ring-[#0ABAB5] bg-[#0ABAB5]/5"
                          : "hover:bg-gray-100"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#0ABAB5]/10 rounded flex items-center justify-center overflow-hidden">
                          {previewUrls[index] ? (
                            <img src={previewUrls[index]} alt="" className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <FileText className="w-4 h-4 text-[#0ABAB5]" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-xs truncate max-w-[120px]">{arquivo.name}</p>
                          <span className="text-[10px] text-gray-500">{(arquivo.size / 1024).toFixed(0)} KB</span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleRemoverArquivo(index); }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-0.5"
                        disabled={analisando}
                        title="Remover arquivo"
                        type="button"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Preview do arquivo selecionado - Menor */}
              {previewUrls[arquivoSelecionado] && (
                <div className="mt-2 rounded-lg overflow-hidden border border-gray-200">
                  <img src={previewUrls[arquivoSelecionado]} alt="Preview" className="w-full h-32 object-contain bg-gray-50" loading="lazy" />
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,.dwg,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileSelect}
                className="hidden"
                multiple
                title="Selecionar arquivos de plantas"
              />
            </div>

            {/* Análise Inteligente - Compacta */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h2 className="text-sm font-normal text-gray-900 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#0ABAB5]" />
                Análise Inteligente
              </h2>

              {/* Modo de Análise */}
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModoAnalise("ia")}
                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                      modoAnalise === "ia"
                        ? "border-[#0ABAB5] bg-[#0ABAB5]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={analisando}
                    title="Análise com IA (Claude/GPT)"
                  >
                    <p className="font-normal text-gray-900 text-xs">IA</p>
                    <p className="text-[10px] text-gray-600">Claude/GPT</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoAnalise("sistema")}
                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                      modoAnalise === "sistema"
                        ? "border-[#0ABAB5] bg-[#0ABAB5]/10"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={analisando}
                    title="Análise por regras do sistema"
                  >
                    <p className="font-normal text-gray-900 text-xs">Sistema</p>
                    <p className="text-[10px] text-gray-600">Regras internas</p>
                  </button>
                </div>
                <p className="text-[10px] text-gray-500 mt-2">
                  {modoAnalise === "ia"
                    ? "IA para plantas e memorial."
                    : "Sistema analisa apenas o texto do memorial."}
                </p>
              </div>

              {/* Provedor de IA - Compacto */}
              {modoAnalise === "ia" && (
              <div className="mb-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProvedorIA("anthropic")}
                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                      provedorIA === "anthropic"
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={analisando}
                    title="Claude (Anthropic) - Recomendado"
                  >
                    <p className="font-normal text-gray-900 text-xs">Claude</p>
                    <p className="text-[10px] text-gray-600">Recomendado</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setProvedorIA("openai")}
                    className={`p-2 rounded-lg border-2 text-left transition-all ${
                      provedorIA === "openai"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    disabled={analisando}
                    title="OpenAI GPT-4 Vision"
                  >
                    <p className="font-normal text-gray-900 text-xs">GPT-4</p>
                    <p className="text-[10px] text-gray-600">Vision</p>
                  </button>
                </div>
              </div>
              )}

              {/* Prompt Personalizado - Colapsado */}
              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setMostrarPromptAvancado(!mostrarPromptAvancado)}
                  className="flex items-center gap-1 text-xs text-[#0ABAB5] hover:text-[#0A8C88] font-medium"
                  disabled={analisando}
                >
                  {mostrarPromptAvancado ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  Instruções personalizadas
                </button>

                {mostrarPromptAvancado && (
                  <div className="mt-2">
                    <textarea
                      value={promptPersonalizado}
                      onChange={(e) => setPromptPersonalizado(e.target.value)}
                      placeholder="Ex: Foque nos ambientes do térreo..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-none focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none"
                      rows={2}
                      disabled={analisando}
                    />
                  </div>
                )}
              </div>

              {/* Barra de Progresso */}
              {analisando && progresso.ativo && (
                <div className="mb-3">
                  <ProgressoIA
                    etapaAtual={progresso.etapaAtual}
                    progressoEtapa={progresso.progressoEtapa}
                    tempoDecorrido={progresso.tempoDecorrido}
                    mostrarTempo={true}
                  />
                </div>
              )}

              {/* BotÍo Analisar - Compacto */}
              <button
                onClick={handleAnalisar}
                disabled={analisando || (arquivos.length === 0 && !memorialDescritivo.trim()) || !isEdit}
                className="w-full px-4 py-2 bg-gradient-to-r from-[#0ABAB5] to-[#0A8C88] text-white rounded-lg font-medium text-sm hover:from-[#0A9B97] hover:to-[#087A76] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                type="button"
              >
                {analisando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {modoAnalise === "ia"
                      ? arquivos.length > 0 && memorialDescritivo.trim()
                        ? "Análise Completa (Plantas + Escopo)"
                        : arquivos.length > 0
                          ? "Analisar Plantas"
                          : docxCarregado
                            ? "Analisar Documento de Escopo"
                            : "Analisar Escopo"
                      : "Analisar Escopo (Sistema)"}
                  </>
                )}
              </button>

              {!isEdit && (
                <p className="text-[10px] text-center text-amber-600 mt-1">
                  Salve a análise primeiro
                </p>
              )}
              {isEdit && arquivos.length === 0 && !memorialDescritivo.trim() && (
                <p className="text-[10px] text-center text-gray-500 mt-1">
                  Adicione plantas ou cole o memorial/plano de obra
                </p>
              )}
              {/* Aviso quando analisar só texto sem ambientes */}
              {isEdit && arquivos.length === 0 && memorialDescritivo.trim() && ambientes.length === 0 && (
                <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[10px] text-amber-700 flex items-start gap-1">
                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Sem ambientes cadastrados:</strong> A análise extrairá os serviços,
                      mas as metragens ficarÍo pendentes. Para cálculo automático de áreas,
                      cadastre os ambientes primeiro ou analise uma imagem de planta.
                    </span>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 2: Escopo do Projeto / Plano Executivo */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <h2 className="text-sm font-normal text-gray-900 mb-3 flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#0ABAB5]" />
                Escopo do Projeto
                {servicosExtraidos.length > 0 && (
                  <div className="ml-auto flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => autoVincularServicosPricelist()}
                      disabled={autoVinculandoPricelist}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#0ABAB5] hover:text-[#0A8C88] hover:bg-[#0ABAB5]/10 rounded transition-colors"
                      title="Vincular automaticamente ao Pricelist"
                    >
                      {autoVinculandoPricelist ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <RefreshCw className="w-3 h-3" />
                      )}
                      Auto vincular
                    </button>
                    {filaVinculacao.length > 0 && (
                      <span className="text-[10px] text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                        Pendentes: {filaVinculacao.length}
                      </span>
                    )}
                    <span className="text-xs bg-[#0ABAB5]/15 text-[#0A8C88] px-2 py-0.5 rounded-full">
                      {servicosExtraidos.length} itens
                    </span>
                  </div>
                )}
              </h2>

              {servicosExtraidos.length === 0 ? (
                <div className="text-center py-6">
                  <ClipboardList className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-xs">
                    Nenhum serviço identificado.
                    <br />
                    Analise o memorial ou as plantas.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[500px] overflow-y-auto">
                  {/* Agrupar por categoria */}
                  {Object.entries(
                    servicosExtraidos.reduce((acc, srv) => {
                      const cat = srv.categoria || "Outros";
                      if (!acc[cat]) acc[cat] = [];
                      acc[cat].push(srv);
                      return acc;
                    }, {} as Record<string, ServicoAnalise[]>)
                  ).map(([categoria, servicos]) => (
                    <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header da categoria */}
                      <button
                        type="button"
                        onClick={() => setExpandedCategoria(expandedCategoria === categoria ? null : categoria)}
                        className="w-full flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          {normalizeSearchTerm(categoria).includes("material") ? (
                            <Package className="w-3.5 h-3.5 text-amber-600" />
                          ) : normalizeSearchTerm(categoria).includes("servi") ? (
                            <Wrench className="w-3.5 h-3.5 text-blue-600" />
                          ) : normalizeSearchTerm(categoria).includes("mao") ? (
                            <Hammer className="w-3.5 h-3.5 text-green-600" />
                          ) : (
                            <Layers className="w-3.5 h-3.5 text-purple-600" />
                          )}
                          <span className="font-medium text-xs text-gray-900">{categoria}</span>
                          <span className="text-[10px] text-gray-500">({servicos.length})</span>
                        </div>
                        {expandedCategoria === categoria ? (
                          <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                        )}
                      </button>

                      {/* Lista de serviços da categoria */}
                      {expandedCategoria === categoria && (
                        <div className="divide-y divide-gray-100">
                          {servicos.map((srv, idx) => (
                            <div key={srv.id || idx} className="p-2 hover:bg-gray-50">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-medium text-gray-900 truncate">
                                    {srv.descricao}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {srv.quantidade && (
                                      <span className="text-[10px] text-gray-500">
                                        Qtd: {srv.quantidade} {srv.unidade || "un"}
                                      </span>
                                    )}
                                    {srv.area && (
                                      <span className="text-[10px] text-gray-500">
                                        Área: {srv.area.toFixed(2)} m²
                                      </span>
                                    )}
                                    {srv.tipo && (
                                      <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">
                                        {srv.tipo}
                                      </span>
                                    )}
                                  </div>
                                  {srv.termo_busca && (
                                    <p className="text-[10px] text-[#0ABAB5] mt-0.5 truncate">
                                      🔗 {srv.termo_busca}
                                    </p>
                                  )}
                                </div>
                                {/* Ações de vinculaçÍo */}
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  {srv.pricelist_item_id ? (
                                    <>
                                      <div className="w-2 h-2 rounded-full bg-green-500" title="Vinculado" />
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDesvincularServico(srv);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                        title="Desvincular do Pricelist"
                                      >
                                        <Unlink className="w-3 h-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAbrirModalVinculacao(srv, "vincular");
                                        }}
                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Vincular a item existente no Pricelist"
                                      >
                                        <Link2 className="w-3 h-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleAbrirModalVinculacao(srv, "criar");
                                        }}
                                        className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                        title="Criar novo item no Pricelist"
                                      >
                                        <PlusCircle className="w-3 h-3" />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Resumo por tipo - usa o tipo do pricelist vinculado quando disponível */}
              {servicosExtraidos.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className="text-sm font-normal text-blue-600">
                        {servicosExtraidos.filter(s => {
                          const tipo = s.pricelist_item?.tipo || s.tipo;
                          return tipo === "servico" || normalizeSearchTerm(tipo || "").includes("servi");
                        }).length}
                      </p>
                      <p className="text-[10px] text-gray-500">Serviços</p>
                    </div>
                    <div>
                      <p className="text-sm font-normal text-amber-600">
                        {servicosExtraidos.filter(s => {
                          const tipo = s.pricelist_item?.tipo || s.tipo;
                          return (
                            tipo === "material" ||
                            tipo === "produto" ||
                            normalizeSearchTerm(tipo || "").includes("material")
                          );
                        }).length}
                      </p>
                      <p className="text-[10px] text-gray-500">Materiais</p>
                    </div>
                    <div>
                      <p className="text-sm font-normal text-green-600">
                        {servicosExtraidos.filter(s => {
                          const tipo = s.pricelist_item?.tipo || s.tipo;
                          return (
                            tipo === "mao_obra" ||
                            normalizeSearchTerm(tipo || "").includes("mao")
                          );
                        }).length}
                      </p>
                      <p className="text-[10px] text-gray-500">M. Obra</p>
                    </div>
                    <div>
                      <p className="text-sm font-normal text-[#0ABAB5]">
                        {servicosExtraidos.filter(s => s.pricelist_item_id).length}
                      </p>
                      <p className="text-[10px] text-gray-500">Vinculados</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Memorial/Plano de Obra na Coluna 2 - Sempre visível e editável */}
            <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-normal text-gray-900 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#0ABAB5]" />
                  Plano de Obra / Memorial
                </h2>
                {memorialDescritivo.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => { setMemorialDescritivo(""); setDocxCarregado(false); }}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                    title="Limpar texto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Limpar
                  </button>
                )}
              </div>
              <textarea
                value={memorialDescritivo}
                onChange={(e) => setMemorialDescritivo(e.target.value)}
                placeholder="Cole aqui o plano de obra, memorial descritivo ou escopo dos serviços...

A IA irá analisar este texto e extrair TODOS os itens de serviço automaticamente.

• Só memorial → Extrai itens de escopo
• Plantas + memorial → Análise completa (ambientes + serviços)"
                rows={12}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-xs resize-y focus:ring-2 focus:ring-[#0ABAB5] focus:border-transparent outline-none min-h-[150px] max-h-[400px]"
              />
              {memorialDescritivo.trim().length > 0 && (
                <p className="text-[10px] text-gray-400 mt-1">
                  {memorialDescritivo.length} caracteres • {memorialDescritivo.split(/\n/).filter(l => l.trim()).length} linhas
                </p>
              )}
            </div>
          </div>

          {/* COLUNA 3: Ambientes Extraídos */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                  <Ruler className="w-5 h-5 text-[#0ABAB5]" />
                  Ambientes ({ambientes.length})
                </h2>
                <div className="flex items-center gap-2">
                  {/* Botões Expandir/Recolher Todos */}
                  {ambientes.length > 0 && (
                    <div className="flex items-center gap-1 border-r border-gray-200 pr-2 mr-1">
                      <button
                        type="button"
                        onClick={() => setExpandedAmbientes(new Set(ambientes.map(a => a.id)))}
                        className="p-1.5 text-gray-400 hover:text-[#0ABAB5] hover:bg-[#0ABAB5]/10 rounded transition-colors"
                        title="Expandir todos"
                      >
                        <ChevronsUpDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedAmbientes(new Set())}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="Recolher todos"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={handleAdicionarAmbiente}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[#0ABAB5]/10 text-[#0ABAB5] rounded-lg font-medium hover:bg-[#0ABAB5]/20 transition-colors"
                    title="Adicionar ambiente manualmente"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar
                  </button>
                </div>
              </div>

              {/* Totais */}
              {ambientes.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <p className="text-lg font-normal text-[#0ABAB5]">
                      {formatarArea(ambientes.reduce((acc, a) => acc + (a.area_piso || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500">Área Total Piso</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-normal text-[#0ABAB5]">
                      {formatarArea(ambientes.reduce((acc, a) => acc + (a.area_paredes_liquida || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500">Área Paredes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-normal text-[#0ABAB5]">
                      {formatarMetragemLinear(ambientes.reduce((acc, a) => acc + (a.perimetro || 0), 0))}
                    </p>
                    <p className="text-xs text-gray-500">Perímetro Total</p>
                  </div>
                </div>
              )}

              {/* Lista de Ambientes */}
              {ambientes.length === 0 ? (
                <div className="text-center py-8">
                  <Ruler className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">
                    Nenhum ambiente ainda.
                    <br />
                    Faça upload de uma planta e analise com IA.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {ambientes.map((ambiente, index) => (
                    <div
                      key={ambiente.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, ambiente.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, ambiente.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, ambiente.id)}
                      className={`border rounded-lg overflow-hidden transition-all duration-200 ${
                        dragOverAmbiente === ambiente.id
                          ? "border-[#0ABAB5] border-2 bg-[#0ABAB5]/5 scale-[1.02]"
                          : draggedAmbiente === ambiente.id
                          ? "border-gray-300 opacity-50"
                          : "border-gray-200"
                      }`}
                    >
                      {/* Header do Ambiente */}
                      <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors">
                        {/* Drag Handle */}
                        <div
                          className="flex items-center justify-center px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-gray-200 transition-colors border-r border-gray-200"
                          title="Arraste para reordenar"
                        >
                          <GripVertical className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* Conteúdo clicável */}
                        <div
                          className="flex-1 flex items-center justify-between p-3 cursor-pointer"
                          onClick={() => toggleAmbiente(ambiente.id)}
                        >
                        <div className="flex items-center gap-3">
                          {expandedAmbientes.has(ambiente.id) ? (
                            <ChevronUp className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          )}
                          <div className="flex-1">
                            <input
                              type="text"
                              value={ambiente.nome ?? ""}
                              onChange={(e) => handleAtualizarCampoAmbiente(ambiente.id, 'nome', e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="font-medium text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#0ABAB5] focus:outline-none w-full"
                              title="Nome do ambiente"
                              autoComplete="off"
                              data-lpignore="true"
                              data-form-type="other"
                            />
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                              <div className="flex items-center gap-1">
                                <select
                                  value={ambiente.tipo || ''}
                                  onChange={(e) => handleAtualizarCampoAmbiente(ambiente.id, 'tipo', e.target.value || null)}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-gray-200 px-1.5 py-0.5 rounded text-xs border-none cursor-pointer hover:bg-gray-300"
                                  title="Tipo do ambiente"
                                >
                                  <option value="">Tipo...</option>
                                  {tiposAmbiente.map((tipo) => (
                                    <option key={tipo.codigo} value={tipo.codigo}>{tipo.nome}</option>
                                  ))}
                                </select>
                                {/* BotÍo adicionar tipo - apenas MASTER */}
                                {isMaster && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setAdicionandoTipo(true);
                                      setNovoTipoNome("");
                                    }}
                                    className="p-0.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded"
                                    title="Adicionar novo tipo de ambiente"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <span>{formatarArea(ambiente.area_piso)}</span>
                              {ambiente.origem === "ia" && (
                                <span className="text-purple-500">IA</span>
                              )}
                              {ambiente.editado_manualmente && (
                                <span className="text-amber-500">Editado</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDuplicarAmbiente(ambiente);
                            }}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="Duplicar ambiente"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletarAmbiente(ambiente.id);
                            }}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="Excluir ambiente"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        </div>
                      </div>

                      {/* Detalhes do Ambiente */}
                      {expandedAmbientes.has(ambiente.id) && (
                        <div className="p-4 space-y-3 border-t border-gray-100">
                          {/* Dimensões Editáveis - Suporta expressões com + (ex: 3+2.5) e vírgula */}
                          <div className="grid grid-cols-5 gap-2">
                            <div className="min-w-0">
                              <label className="text-[10px] text-gray-500 block mb-0.5 truncate">Larg. (m)</label>
                              <input
                                type="text"
                                value={getInputValue(ambiente.id, 'largura', ambiente.largura)}
                                onChange={(e) => handleInputChange(ambiente.id, 'largura', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInputBlur(ambiente.id, 'largura', e.currentTarget.value);
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) => handleInputBlur(ambiente.id, 'largura', e.target.value)}
                                className="w-full px-1 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] outline-none text-center"
                                title="Largura (use + para somar: 3+2 ou vírgula: 3,5)"
                                placeholder="0"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="text-[10px] text-gray-500 block mb-0.5 truncate">Comp. (m)</label>
                              <input
                                type="text"
                                value={getInputValue(ambiente.id, 'comprimento', ambiente.comprimento)}
                                onChange={(e) => handleInputChange(ambiente.id, 'comprimento', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInputBlur(ambiente.id, 'comprimento', e.currentTarget.value);
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) => handleInputBlur(ambiente.id, 'comprimento', e.target.value)}
                                className="w-full px-1 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] outline-none text-center"
                                title="Comprimento (use + para somar ou vírgula)"
                                placeholder="0"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="text-[10px] text-gray-500 block mb-0.5 truncate">Área m²</label>
                              <input
                                type="text"
                                value={getInputValue(ambiente.id, 'area_piso', ambiente.area_piso)}
                                onChange={(e) => handleInputChange(ambiente.id, 'area_piso', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInputBlur(ambiente.id, 'area_piso', e.currentTarget.value);
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) => handleInputBlur(ambiente.id, 'area_piso', e.target.value)}
                                className="w-full px-1 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] outline-none bg-blue-50 text-center"
                                title="Área (use + para somar ou vírgula)"
                                placeholder="0"
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="text-[10px] text-gray-500 block mb-0.5 truncate">PD (m)</label>
                              <input
                                type="text"
                                value={getInputValue(ambiente.id, 'pe_direito', ambiente.pe_direito)}
                                onChange={(e) => handleInputChange(ambiente.id, 'pe_direito', e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleInputBlur(ambiente.id, 'pe_direito', e.currentTarget.value);
                                    e.currentTarget.blur();
                                  }
                                }}
                                onBlur={(e) => handleInputBlur(ambiente.id, 'pe_direito', e.target.value)}
                                className="w-full px-1 py-1 border border-gray-200 rounded text-xs font-medium focus:ring-1 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] outline-none text-center"
                                title="Pé-direito (use vírgula: 2,70)"
                                placeholder={peDireitoPadrao}
                              />
                            </div>
                            <div className="min-w-0">
                              <label className="text-[10px] text-gray-500 block mb-0.5 truncate">Perím.</label>
                              <div className="w-full px-1 py-1 bg-gray-50 border border-gray-200 rounded text-xs font-medium text-center text-gray-700 truncate">
                                {(ambiente.perimetro || 0).toFixed(1)}m
                              </div>
                            </div>
                          </div>

                          {/* Áreas Calculadas - Linha única */}
                          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">Área Piso</p>
                              <p className="text-xs font-normal text-gray-900">{formatarArea(ambiente.area_piso)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">Perímetro</p>
                              <p className="text-xs font-normal text-gray-900">{formatarMetragemLinear(ambiente.perimetro)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">Paredes Bruta</p>
                              <p className="text-xs font-normal text-gray-900">{formatarArea(ambiente.area_paredes_bruta)}</p>
                            </div>
                            <div className="text-center">
                              <p className="text-[10px] text-gray-500">Paredes Líq.</p>
                              <p className="text-xs font-normal text-[#0ABAB5]">{formatarArea(ambiente.area_paredes_liquida)}</p>
                            </div>
                          </div>

                          {/* VÍos, Portas, Janelas - Layout em 3 colunas */}
                          <div className="pt-2 border-t border-gray-100">
                            <div className="grid grid-cols-3 gap-2">
                              {/* Portas */}
                              <div className="bg-amber-50/50 rounded-lg p-2">
                                {/* Header + Input na mesma linha */}
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-[10px] font-medium text-amber-700 flex items-center gap-1 whitespace-nowrap">
                                    <DoorOpen className="w-3 h-3" /> Portas ({(ambiente.portas || []).length})
                                  </span>
                                  <input type="text"
                                    placeholder="0,80"
                                    value={inputsEmEdicao[`${ambiente.id}-novaPorta-0-largura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novaPorta', 0, 'largura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const largura = parseFloat(normalizarNumero(e.currentTarget.value)) || 0.80;
                                        const alturaInput = inputsEmEdicao[`${ambiente.id}-novaPorta-0-altura`];
                                        const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 2.10 : 2.10;
                                        if (largura > 0) {
                                          const novaPorta: VaoPorta = { largura, altura };
                                          const novasPortas = [...(ambiente.portas || []), novaPorta];
                                          const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, portas: novasPortas, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novaPorta', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novaPorta', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-amber-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <span className="text-gray-400 text-[10px]">×</span>
                                  <input type="text"
                                    placeholder="2,10"
                                    value={inputsEmEdicao[`${ambiente.id}-novaPorta-0-altura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novaPorta', 0, 'altura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const larguraInput = inputsEmEdicao[`${ambiente.id}-novaPorta-0-largura`];
                                        const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 0.80 : 0.80;
                                        const altura = parseFloat(normalizarNumero(e.currentTarget.value)) || 2.10;
                                        if (altura > 0) {
                                          const novaPorta: VaoPorta = { largura, altura };
                                          const novasPortas = [...(ambiente.portas || []), novaPorta];
                                          const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, portas: novasPortas, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novaPorta', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novaPorta', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-amber-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <button type="button" onClick={() => {
                                    const larguraInput = inputsEmEdicao[`${ambiente.id}-novaPorta-0-largura`];
                                    const alturaInput = inputsEmEdicao[`${ambiente.id}-novaPorta-0-altura`];
                                    const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 0.80 : 0.80;
                                    const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 2.10 : 2.10;
                                    const novaPorta: VaoPorta = { largura, altura };
                                    const novasPortas = [...(ambiente.portas || []), novaPorta];
                                    const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                    const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                    setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                      ...a, portas: novasPortas, area_vaos_total: areaVaos,
                                      area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                      parede_area: Math.max(0, areaBruta - areaVaos)
                                    } : a));
                                    limparVaoInput(ambiente.id, 'novaPorta', 0, 'largura');
                                    limparVaoInput(ambiente.id, 'novaPorta', 0, 'altura');
                                  }} className="text-amber-500 hover:text-amber-700 p-0.5" title="Adicionar"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {(ambiente.portas || []).map((porta, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-[10px] bg-white p-1.5 rounded">
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'porta', idx, 'largura', porta.largura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'porta', idx, 'largura', e.target.value)}
                                        onBlur={(e) => {
                                          const novasPortas = [...(ambiente.portas || [])];
                                          novasPortas[idx] = { ...porta, largura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, portas: novasPortas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'porta', idx, 'largura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-400">×</span>
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'porta', idx, 'altura', porta.altura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'porta', idx, 'altura', e.target.value)}
                                        onBlur={(e) => {
                                          const novasPortas = [...(ambiente.portas || [])];
                                          novasPortas[idx] = { ...porta, altura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, portas: novasPortas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'porta', idx, 'altura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-500 text-[9px] flex-1 text-right">{(porta.largura * porta.altura).toFixed(1)}m²</span>
                                      <button type="button" onClick={() => {
                                        const novasPortas = (ambiente.portas || []).filter((_, i) => i !== idx);
                                        const areaVaos = calcularAreaVaos(novasPortas, ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, portas: novasPortas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                      }} className="text-red-400 hover:text-red-600 p-0.5"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Janelas */}
                              <div className="bg-blue-50/50 rounded-lg p-2">
                                {/* Header + Input na mesma linha */}
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-[10px] font-medium text-blue-700 flex items-center gap-1 whitespace-nowrap">
                                    <Square className="w-3 h-3" /> Janelas ({(ambiente.janelas || []).length})
                                  </span>
                                  <input type="text"
                                    placeholder="1,20"
                                    value={inputsEmEdicao[`${ambiente.id}-novaJanela-0-largura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novaJanela', 0, 'largura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const largura = parseFloat(normalizarNumero(e.currentTarget.value)) || 1.20;
                                        const alturaInput = inputsEmEdicao[`${ambiente.id}-novaJanela-0-altura`];
                                        const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 1.20 : 1.20;
                                        if (largura > 0) {
                                          const novaJanela: VaoJanela = { largura, altura };
                                          const novasJanelas = [...(ambiente.janelas || []), novaJanela];
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, janelas: novasJanelas, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novaJanela', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novaJanela', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-blue-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <span className="text-gray-400 text-[10px]">×</span>
                                  <input type="text"
                                    placeholder="1,20"
                                    value={inputsEmEdicao[`${ambiente.id}-novaJanela-0-altura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novaJanela', 0, 'altura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const larguraInput = inputsEmEdicao[`${ambiente.id}-novaJanela-0-largura`];
                                        const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 1.20 : 1.20;
                                        const altura = parseFloat(normalizarNumero(e.currentTarget.value)) || 1.20;
                                        if (altura > 0) {
                                          const novaJanela: VaoJanela = { largura, altura };
                                          const novasJanelas = [...(ambiente.janelas || []), novaJanela];
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, janelas: novasJanelas, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novaJanela', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novaJanela', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-blue-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <button type="button" onClick={() => {
                                    const larguraInput = inputsEmEdicao[`${ambiente.id}-novaJanela-0-largura`];
                                    const alturaInput = inputsEmEdicao[`${ambiente.id}-novaJanela-0-altura`];
                                    const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 1.20 : 1.20;
                                    const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 1.20 : 1.20;
                                    const novaJanela: VaoJanela = { largura, altura };
                                    const novasJanelas = [...(ambiente.janelas || []), novaJanela];
                                    const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                    const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                    setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                      ...a, janelas: novasJanelas, area_vaos_total: areaVaos,
                                      area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                      parede_area: Math.max(0, areaBruta - areaVaos)
                                    } : a));
                                    limparVaoInput(ambiente.id, 'novaJanela', 0, 'largura');
                                    limparVaoInput(ambiente.id, 'novaJanela', 0, 'altura');
                                  }} className="text-blue-500 hover:text-blue-700 p-0.5" title="Adicionar"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {(ambiente.janelas || []).map((janela, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-[10px] bg-white p-1.5 rounded">
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'janela', idx, 'largura', janela.largura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'janela', idx, 'largura', e.target.value)}
                                        onBlur={(e) => {
                                          const novasJanelas = [...(ambiente.janelas || [])];
                                          novasJanelas[idx] = { ...janela, largura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, janelas: novasJanelas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'janela', idx, 'largura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-400">×</span>
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'janela', idx, 'altura', janela.altura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'janela', idx, 'altura', e.target.value)}
                                        onBlur={(e) => {
                                          const novasJanelas = [...(ambiente.janelas || [])];
                                          novasJanelas[idx] = { ...janela, altura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, janelas: novasJanelas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'janela', idx, 'altura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-500 text-[9px] flex-1 text-right">{(janela.largura * janela.altura).toFixed(1)}m²</span>
                                      <button type="button" onClick={() => {
                                        const novasJanelas = (ambiente.janelas || []).filter((_, i) => i !== idx);
                                        const areaVaos = calcularAreaVaos(ambiente.portas || [], novasJanelas, ambiente.vaos || [], ambiente.envidracamentos || []);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, janelas: novasJanelas, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                      }} className="text-red-400 hover:text-red-600 p-0.5"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* VÍos Genéricos */}
                              <div className="bg-purple-50/50 rounded-lg p-2">
                                {/* Header + Input na mesma linha */}
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-[10px] font-medium text-purple-700 flex items-center gap-1 whitespace-nowrap">
                                    <Maximize2 className="w-3 h-3" /> VÍos ({(ambiente.vaos || []).length})
                                  </span>
                                  <input type="text"
                                    placeholder="1,00"
                                    value={inputsEmEdicao[`${ambiente.id}-novoVao-0-largura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novoVao', 0, 'largura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const largura = parseFloat(normalizarNumero(e.currentTarget.value)) || 1.00;
                                        const alturaInput = inputsEmEdicao[`${ambiente.id}-novoVao-0-altura`];
                                        const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 2.10 : 2.10;
                                        if (largura > 0) {
                                          const novoVao: VaoGenerico = { largura, altura };
                                          const novosVaos = [...(ambiente.vaos || []), novoVao];
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, vaos: novosVaos, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novoVao', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novoVao', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-purple-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <span className="text-gray-400 text-[10px]">×</span>
                                  <input type="text"
                                    placeholder="2,10"
                                    value={inputsEmEdicao[`${ambiente.id}-novoVao-0-altura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'novoVao', 0, 'altura', e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const larguraInput = inputsEmEdicao[`${ambiente.id}-novoVao-0-largura`];
                                        const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 1.00 : 1.00;
                                        const altura = parseFloat(normalizarNumero(e.currentTarget.value)) || 2.10;
                                        if (altura > 0) {
                                          const novoVao: VaoGenerico = { largura, altura };
                                          const novosVaos = [...(ambiente.vaos || []), novoVao];
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                            ...a, vaos: novosVaos, area_vaos_total: areaVaos,
                                            area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                            parede_area: Math.max(0, areaBruta - areaVaos)
                                          } : a));
                                          limparVaoInput(ambiente.id, 'novoVao', 0, 'largura');
                                          limparVaoInput(ambiente.id, 'novoVao', 0, 'altura');
                                        }
                                      }
                                    }}
                                    className="w-11 px-1 border border-purple-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <button type="button" onClick={() => {
                                    const larguraInput = inputsEmEdicao[`${ambiente.id}-novoVao-0-largura`];
                                    const alturaInput = inputsEmEdicao[`${ambiente.id}-novoVao-0-altura`];
                                    const largura = larguraInput ? parseFloat(normalizarNumero(larguraInput)) || 1.00 : 1.00;
                                    const altura = alturaInput ? parseFloat(normalizarNumero(alturaInput)) || 2.10 : 2.10;
                                    const novoVao: VaoGenerico = { largura, altura };
                                    const novosVaos = [...(ambiente.vaos || []), novoVao];
                                    const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                    const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                    setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                      ...a, vaos: novosVaos, area_vaos_total: areaVaos,
                                      area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                      parede_area: Math.max(0, areaBruta - areaVaos)
                                    } : a));
                                    limparVaoInput(ambiente.id, 'novoVao', 0, 'largura');
                                    limparVaoInput(ambiente.id, 'novoVao', 0, 'altura');
                                  }} className="text-purple-500 hover:text-purple-700 p-0.5" title="Adicionar"><Plus className="w-3 h-3" /></button>
                                </div>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {(ambiente.vaos || []).map((vao, idx) => (
                                    <div key={idx} className="flex items-center gap-1 text-[10px] bg-white p-1.5 rounded">
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'vao', idx, 'largura', vao.largura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'vao', idx, 'largura', e.target.value)}
                                        onBlur={(e) => {
                                          const novosVaos = [...(ambiente.vaos || [])];
                                          novosVaos[idx] = { ...vao, largura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, vaos: novosVaos, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'vao', idx, 'largura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-400">×</span>
                                      <input type="text"
                                        value={getVaoInputValue(ambiente.id, 'vao', idx, 'altura', vao.altura)}
                                        onChange={(e) => handleVaoInputChange(ambiente.id, 'vao', idx, 'altura', e.target.value)}
                                        onBlur={(e) => {
                                          const novosVaos = [...(ambiente.vaos || [])];
                                          novosVaos[idx] = { ...vao, altura: avaliarExpressao(e.target.value) };
                                          const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                          const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                          setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, vaos: novosVaos, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                          limparVaoInput(ambiente.id, 'vao', idx, 'altura');
                                        }}
                                        className="w-11 px-1 border border-gray-200 rounded text-center text-[10px]"
                                      />
                                      <span className="text-gray-500 text-[9px] flex-1 text-right">{(vao.largura * vao.altura).toFixed(1)}m²</span>
                                      <button type="button" onClick={() => {
                                        const novosVaos = (ambiente.vaos || []).filter((_, i) => i !== idx);
                                        const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], novosVaos, ambiente.envidracamentos || []);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, vaos: novosVaos, area_vaos_total: areaVaos, area_paredes_liquida: Math.max(0, areaBruta - areaVaos), parede_area: Math.max(0, areaBruta - areaVaos) } : a));
                                      }} className="text-red-400 hover:text-red-600 p-0.5"><X className="w-3 h-3" /></button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Envidraçamentos (para varandas/terraços) */}
                            {(ambiente.tipo === 'varanda' || ambiente.tipo === 'sacada' || normalizeSearchTerm(ambiente.nome || "").includes('terraco') || normalizeSearchTerm(ambiente.nome || "").includes('varanda') || normalizeSearchTerm(ambiente.nome || "").includes('sacada')) && (
                              <div className="mb-2">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-gray-600">Envidraçamentos ({(ambiente.envidracamentos || []).length})</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const novoEnvid: VaoEnvidracamento = { largura: 3.00, altura: 2.50 };
                                      const novosEnvids = [...(ambiente.envidracamentos || []), novoEnvid];
                                      const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], ambiente.vaos || [], novosEnvids);
                                      const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                      setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                        ...a,
                                        envidracamentos: novosEnvids,
                                        area_vaos_total: areaVaos,
                                        area_paredes_liquida: Math.max(0, areaBruta - areaVaos)
                                      } : a));
                                    }}
                                    className="text-[10px] text-[#0ABAB5] hover:underline flex items-center gap-0.5"
                                    title="Adicionar envidraçamento"
                                  >
                                    <Plus className="w-3 h-3" /> Adicionar
                                  </button>
                                </div>
                                {(ambiente.envidracamentos || []).map((envid, idx) => (
                                  <div key={idx} className="flex items-center gap-1 text-xs bg-cyan-50 p-1.5 rounded mb-1">
                                    <PanelTop className="w-3 h-3 text-cyan-600" />
                                    <input
                                      type="text"
                                      placeholder="3,00"
                                      value={getVaoInputValue(ambiente.id, 'envid', idx, 'largura', envid.largura)}
                                      onChange={(e) => handleVaoInputChange(ambiente.id, 'envid', idx, 'largura', e.target.value)}
                                      onBlur={(e) => {
                                        const novosEnvids = [...(ambiente.envidracamentos || [])];
                                        novosEnvids[idx] = { ...envid, largura: avaliarExpressao(e.target.value) };
                                        const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], ambiente.vaos || [], novosEnvids);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                          ...a,
                                          envidracamentos: novosEnvids,
                                          area_vaos_total: areaVaos,
                                          area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                          parede_area: Math.max(0, areaBruta - areaVaos)
                                        } : a));
                                        limparVaoInput(ambiente.id, 'envid', idx, 'largura');
                                      }}
                                      className="w-14 px-1 py-0.5 border rounded text-center text-[10px]"
                                      title="Largura do envidraçamento (aceita soma: 2+1,5)"
                                    />
                                    <span>×</span>
                                    <input
                                      type="text"
                                      placeholder="2,50"
                                      value={getVaoInputValue(ambiente.id, 'envid', idx, 'altura', envid.altura)}
                                      onChange={(e) => handleVaoInputChange(ambiente.id, 'envid', idx, 'altura', e.target.value)}
                                      onBlur={(e) => {
                                        const novosEnvids = [...(ambiente.envidracamentos || [])];
                                        novosEnvids[idx] = { ...envid, altura: avaliarExpressao(e.target.value) };
                                        const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], ambiente.vaos || [], novosEnvids);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                          ...a,
                                          envidracamentos: novosEnvids,
                                          area_vaos_total: areaVaos,
                                          area_paredes_liquida: Math.max(0, areaBruta - areaVaos),
                                          parede_area: Math.max(0, areaBruta - areaVaos)
                                        } : a));
                                        limparVaoInput(ambiente.id, 'envid', idx, 'altura');
                                      }}
                                      className="w-14 px-1 py-0.5 border rounded text-center text-[10px]"
                                      title="Altura do envidraçamento (aceita soma: 2+0,5)"
                                    />
                                    <span className="text-gray-500 text-[10px]">= {(envid.largura * envid.altura).toFixed(2)}m²</span>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const novosEnvids = (ambiente.envidracamentos || []).filter((_, i) => i !== idx);
                                        const areaVaos = calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], ambiente.vaos || [], novosEnvids);
                                        const areaBruta = (ambiente.perimetro || 0) * (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? {
                                          ...a,
                                          envidracamentos: novosEnvids,
                                          area_vaos_total: areaVaos,
                                          area_paredes_liquida: Math.max(0, areaBruta - areaVaos)
                                        } : a));
                                      }}
                                      className="text-red-400 hover:text-red-600 ml-auto"
                                      title="Remover envidraçamento"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Total de VÍos + Revestimentos */}
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="bg-gray-100 p-2 rounded text-xs text-center">
                                <span className="text-gray-500 text-[10px] block">Total VÍos</span>
                                <span className="font-normal text-gray-900">
                                  {formatarArea(ambiente.area_vaos_total || calcularAreaVaos(ambiente.portas || [], ambiente.janelas || [], ambiente.vaos || [], ambiente.envidracamentos || []))}
                                </span>
                              </div>

                              {/* Rev. Piso - Duas caixas (largura × comprimento) */}
                              <div className="bg-emerald-50/50 rounded-lg p-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-medium text-emerald-700 whitespace-nowrap">Rev. Piso</span>
                                  <input
                                    type="text"
                                    title="Largura"
                                    placeholder={String((ambiente.largura || 0).toFixed(2)).replace('.', ',')}
                                    value={inputsEmEdicao[`${ambiente.id}-revPiso-0-largura`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'revPiso', 0, 'largura', e.target.value)}
                                    onBlur={(e) => {
                                      const largura = avaliarExpressao(e.target.value) || ambiente.largura || 0;
                                      const compInput = inputsEmEdicao[`${ambiente.id}-revPiso-0-comprimento`];
                                      const comprimento = compInput ? avaliarExpressao(compInput) : (ambiente.comprimento || 0);
                                      const novaArea = largura * comprimento;
                                      if (novaArea > 0) {
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, piso_area: novaArea } : a));
                                      }
                                      limparVaoInput(ambiente.id, 'revPiso', 0, 'largura');
                                    }}
                                    className="w-10 px-1 border border-emerald-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <span className="text-gray-400 text-[10px]">×</span>
                                  <input
                                    type="text"
                                    title="Comprimento"
                                    placeholder={String((ambiente.comprimento || 0).toFixed(2)).replace('.', ',')}
                                    value={inputsEmEdicao[`${ambiente.id}-revPiso-0-comprimento`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'revPiso', 0, 'comprimento', e.target.value)}
                                    onBlur={(e) => {
                                      const largInput = inputsEmEdicao[`${ambiente.id}-revPiso-0-largura`];
                                      const largura = largInput ? avaliarExpressao(largInput) : (ambiente.largura || 0);
                                      const comprimento = avaliarExpressao(e.target.value) || ambiente.comprimento || 0;
                                      const novaArea = largura * comprimento;
                                      if (novaArea > 0) {
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, piso_area: novaArea } : a));
                                      }
                                      limparVaoInput(ambiente.id, 'revPiso', 0, 'comprimento');
                                    }}
                                    className="w-10 px-1 border border-emerald-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const largInput = inputsEmEdicao[`${ambiente.id}-revPiso-0-largura`];
                                      const compInput = inputsEmEdicao[`${ambiente.id}-revPiso-0-comprimento`];
                                      const largura = largInput ? avaliarExpressao(largInput) : (ambiente.largura || 0);
                                      const comprimento = compInput ? avaliarExpressao(compInput) : (ambiente.comprimento || 0);
                                      const novaArea = largura * comprimento;
                                      setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, piso_area: novaArea } : a));
                                      limparVaoInput(ambiente.id, 'revPiso', 0, 'largura');
                                      limparVaoInput(ambiente.id, 'revPiso', 0, 'comprimento');
                                    }}
                                    className="text-emerald-500 hover:text-emerald-700 p-0.5"
                                    title="Adicionar Rev. Piso"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                {ambiente.piso_area !== null && ambiente.piso_area !== undefined && ambiente.piso_area > 0 && (
                                  <div className="flex items-center justify-between bg-white rounded px-2 py-1 mt-1">
                                    <span className="text-[10px] text-emerald-700 font-normal">{formatarArea(ambiente.piso_area)}</span>
                                    <button
                                      type="button"
                                      onClick={() => setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, piso_area: null } : a))}
                                      className="text-red-400 hover:text-red-600 p-0.5"
                                      title="Remover"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>

                              {/* Rev. Parede - Duas caixas (perímetro × pé-direito) */}
                              <div className="bg-orange-50/50 rounded-lg p-2">
                                <div className="flex items-center gap-1">
                                  <span className="text-[10px] font-medium text-orange-700 whitespace-nowrap">Rev. Parede</span>
                                  <input
                                    type="text"
                                    title="Perímetro"
                                    placeholder={String((ambiente.perimetro || 0).toFixed(2)).replace('.', ',')}
                                    value={inputsEmEdicao[`${ambiente.id}-revParede-0-perimetro`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'revParede', 0, 'perimetro', e.target.value)}
                                    onBlur={(e) => {
                                      const perimetro = avaliarExpressao(e.target.value) || ambiente.perimetro || 0;
                                      const pdInput = inputsEmEdicao[`${ambiente.id}-revParede-0-peDireito`];
                                      const peDireito = pdInput ? avaliarExpressao(pdInput) : (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                      const areaVaos = ambiente.area_vaos_total || 0;
                                      const novaArea = Math.max(0, (perimetro * peDireito) - areaVaos);
                                      if (novaArea > 0) {
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, parede_area: novaArea } : a));
                                      }
                                      limparVaoInput(ambiente.id, 'revParede', 0, 'perimetro');
                                    }}
                                    className="w-10 px-1 border border-orange-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <span className="text-gray-400 text-[10px]">×</span>
                                  <input
                                    type="text"
                                    title="Pé-direito"
                                    placeholder={String((ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7).toFixed(2)).replace('.', ',')}
                                    value={inputsEmEdicao[`${ambiente.id}-revParede-0-peDireito`] || ''}
                                    onChange={(e) => handleVaoInputChange(ambiente.id, 'revParede', 0, 'peDireito', e.target.value)}
                                    onBlur={(e) => {
                                      const perimInput = inputsEmEdicao[`${ambiente.id}-revParede-0-perimetro`];
                                      const perimetro = perimInput ? avaliarExpressao(perimInput) : (ambiente.perimetro || 0);
                                      const peDireito = avaliarExpressao(e.target.value) || ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7;
                                      const areaVaos = ambiente.area_vaos_total || 0;
                                      const novaArea = Math.max(0, (perimetro * peDireito) - areaVaos);
                                      if (novaArea > 0) {
                                        setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, parede_area: novaArea } : a));
                                      }
                                      limparVaoInput(ambiente.id, 'revParede', 0, 'peDireito');
                                    }}
                                    className="w-10 px-1 border border-orange-200 rounded text-center text-[10px] bg-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const perimInput = inputsEmEdicao[`${ambiente.id}-revParede-0-perimetro`];
                                      const pdInput = inputsEmEdicao[`${ambiente.id}-revParede-0-peDireito`];
                                      const perimetro = perimInput ? avaliarExpressao(perimInput) : (ambiente.perimetro || 0);
                                      const peDireito = pdInput ? avaliarExpressao(pdInput) : (ambiente.pe_direito || parseFloat(peDireitoPadrao) || 2.7);
                                      const areaVaos = ambiente.area_vaos_total || 0;
                                      const novaArea = Math.max(0, (perimetro * peDireito) - areaVaos);
                                      setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, parede_area: novaArea } : a));
                                      limparVaoInput(ambiente.id, 'revParede', 0, 'perimetro');
                                      limparVaoInput(ambiente.id, 'revParede', 0, 'peDireito');
                                    }}
                                    className="text-orange-500 hover:text-orange-700 p-0.5"
                                    title="Adicionar Rev. Parede"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                {ambiente.parede_area !== null && ambiente.parede_area !== undefined && ambiente.parede_area > 0 && (
                                  <div className="flex items-center justify-between bg-white rounded px-2 py-1 mt-1">
                                    <span className="text-[10px] text-orange-700 font-normal">{formatarArea(ambiente.parede_area)}</span>
                                    <button
                                      type="button"
                                      onClick={() => setAmbientes(prev => prev.map(a => a.id === ambiente.id ? { ...a, parede_area: null } : a))}
                                      className="text-red-400 hover:text-red-600 p-0.5"
                                      title="Remover"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Instalações */}
                          {(ambiente.tomadas_110v > 0 ||
                            ambiente.tomadas_220v > 0 ||
                            ambiente.pontos_iluminacao > 0 ||
                            ambiente.pontos_agua_fria > 0) && (
                            <div className="pt-2 border-t border-gray-100">
                              <p className="text-xs font-medium text-gray-700 mb-2">Instalações</p>
                              <div className="grid grid-cols-4 gap-2 text-xs">
                                {ambiente.tomadas_110v > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-amber-500" />
                                    <span>{ambiente.tomadas_110v} tom. 110V</span>
                                  </div>
                                )}
                                {ambiente.tomadas_220v > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Zap className="w-3 h-3 text-red-500" />
                                    <span>{ambiente.tomadas_220v} tom. 220V</span>
                                  </div>
                                )}
                                {ambiente.pontos_iluminacao > 0 && (
                                  <div className="flex items-center gap-1">
                                    <span>{ambiente.pontos_iluminacao} pontos luz</span>
                                  </div>
                                )}
                                {ambiente.pontos_agua_fria > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Droplets className="w-3 h-3 text-blue-500" />
                                    <span>{ambiente.pontos_agua_fria} água fria</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Alertas */}
                          {ambiente.alertas && ambiente.alertas.length > 0 && (
                            <div className="pt-2 border-t border-gray-100">
                              <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <div>
                                  {ambiente.alertas.map((alerta, i) => (
                                    <p key={i}>{alerta}</p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal para Adicionar Novo Tipo de Ambiente */}
      {adicionandoTipo && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
          onClick={() => setAdicionandoTipo(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-normal text-gray-900 mb-4">
              Adicionar Tipo de Ambiente
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Tipo
                </label>
                <input
                  type="text"
                  value={novoTipoNome}
                  onChange={(e) => setNovoTipoNome(e.target.value)}
                  placeholder="Ex: Home Office, Varanda Gourmet..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0ABAB5] focus:border-[#0ABAB5] outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && novoTipoNome.trim()) {
                      handleAdicionarNovoTipo();
                    } else if (e.key === "Escape") {
                      setAdicionandoTipo(false);
                    }
                  }}
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setAdicionandoTipo(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleAdicionarNovoTipo}
                  disabled={!novoTipoNome.trim()}
                  className="px-4 py-2 bg-[#0ABAB5] text-white rounded-lg hover:bg-[#0A8C88] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de VinculaçÍo/CriaçÍo no Pricelist */}
      {modalVinculacaoAberto && servicoSelecionado && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do Modal */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-normal text-gray-900 flex items-center gap-2">
                  {modoVinculacao === "vincular" ? (
                    <>
                      <Link2 className="w-5 h-5 text-blue-600" />
                      Vincular ao Pricelist
                    </>
                  ) : (
                    <>
                      <PlusCircle className="w-5 h-5 text-green-600" />
                      Criar Item no Pricelist
                    </>
                  )}
                </h3>
                <p className="text-xs text-gray-500 mt-1 truncate max-w-md">
                  Serviço: {servicoSelecionado.descricao}
                </p>
              </div>
              <button
                type="button"
                onClick={handleFecharModalVinculacao}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setModoVinculacao("vincular")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  modoVinculacao === "vincular"
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Link2 className="w-4 h-4 inline-block mr-1" />
                Vincular Existente
              </button>
              <button
                type="button"
                onClick={() => setModoVinculacao("criar")}
                className={`flex-1 px-4 py-2 text-sm font-medium transition-colors ${
                  modoVinculacao === "criar"
                    ? "text-green-600 border-b-2 border-green-600 bg-green-50"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <PlusCircle className="w-4 h-4 inline-block mr-1" />
                Criar Novo
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="flex-1 overflow-y-auto p-4">
              {modoVinculacao === "vincular" ? (
                <div className="space-y-4">
                  {/* Busca */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={buscaPricelist}
                        onChange={(e) => setBuscaPricelist(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            buscarItensPricelist(buscaPricelist, categoriaSelecionada);
                          }
                        }}
                        placeholder="Buscar no pricelist..."
                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <select
                      value={categoriaSelecionada}
                      onChange={(e) => {
                        setCategoriaSelecionada(e.target.value);
                        buscarItensPricelist(buscaPricelist, e.target.value);
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      <option value="">Todas categorias</option>
                      {pricelistCategorias.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nome}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => buscarItensPricelist(buscaPricelist, categoriaSelecionada)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors text-sm"
                    >
                      Buscar
                    </button>
                  </div>

                  {/* Lista de itens */}
                  <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-64 overflow-y-auto">
                    {pricelistItens.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Nenhum item encontrado</p>
                        <p className="text-xs mt-1">Tente buscar por outro termo</p>
                      </div>
                    ) : (
                      pricelistItens.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleVincularServico(item.id, item)}
                          disabled={vinculandoPricelist}
                          className="w-full p-3 text-left hover:bg-blue-50 transition-colors flex items-center justify-between gap-2 disabled:opacity-50"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.nome}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.codigo && (
                                <span className="text-xs text-gray-400">{item.codigo}</span>
                              )}
                              <span className="text-xs text-gray-500">
                                {item.unidade}
                              </span>
                              {item.preco > 0 && (
                                <span className="text-xs font-medium text-green-600">
                                  R$ {item.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                </span>
                              )}
                            </div>
                          </div>
                          <Link2 className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Formulário de criaçÍo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome do Item *
                    </label>
                    <input
                      type="text"
                      value={novoItemNome}
                      onChange={(e) => setNovoItemNome(e.target.value)}
                      placeholder="Nome do item no pricelist"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Categoria *
                      </label>
                      <select
                        value={novoItemCategoria}
                        onChange={(e) => setNovoItemCategoria(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="">Selecione...</option>
                        {pricelistCategorias.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nome}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Unidade
                      </label>
                      <select
                        value={novoItemUnidade}
                        onChange={(e) => setNovoItemUnidade(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                      >
                        <option value="un">Unidade (un)</option>
                        <option value="m2">Metro quadrado (m²)</option>
                        <option value="ml">Metro linear (ml)</option>
                        <option value="vb">Verba (vb)</option>
                        <option value="pt">Ponto (pt)</option>
                        <option value="h">Hora (h)</option>
                        <option value="dia">Dia</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Preço Unitário (R$)
                    </label>
                    <input
                      type="text"
                      value={novoItemPreco}
                      onChange={(e) => setNovoItemPreco(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
                    />
                  </div>
                </div>
              )}

              {/* OpçÍo de replicar */}
              <div className="mt-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={replicarSimilares}
                    onChange={(e) => setReplicarSimilares(e.target.checked)}
                    className="w-4 h-4 rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <span className="text-sm font-medium text-purple-900 flex items-center gap-1">
                      <ArrowRightLeft className="w-4 h-4" />
                      Replicar para itens similares
                    </span>
                    <p className="text-xs text-purple-600 mt-0.5">
                      {servicoSelecionado && (
                        <>
                          {encontrarServicosSimilares(servicoSelecionado).length > 0
                            ? `Encontrados ${encontrarServicosSimilares(servicoSelecionado).length} itens similares que serÍo vinculados automaticamente`
                            : "Nenhum item similar encontrado"}
                        </>
                      )}
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="p-4 border-t border-gray-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleFecharModalVinculacao}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                Cancelar
              </button>
              {modoVinculacao === "criar" && (
                <button
                  type="button"
                  onClick={handleCriarEVincular}
                  disabled={vinculandoPricelist || !novoItemNome.trim() || !novoItemCategoria}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                >
                  {vinculandoPricelist ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <PlusCircle className="w-4 h-4" />
                  )}
                  Criar e Vincular
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


