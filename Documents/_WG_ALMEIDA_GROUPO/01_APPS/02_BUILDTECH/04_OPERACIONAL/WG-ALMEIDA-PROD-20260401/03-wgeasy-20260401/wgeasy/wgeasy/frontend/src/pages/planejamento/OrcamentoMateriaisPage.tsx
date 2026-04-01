/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// ORÇAMENTO AUTOMÁTICO DE MATERIAIS
// Sistema WG Easy - Grupo WG Almeida
// IntegraçÍo: Análise de Projeto → Composições → Lista de Materiais
// ==========================================

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Calculator,
  FileSearch,
  Package,
  Layers,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ShoppingCart,
  Download,
  Loader2,
  Building2,
  Zap,
  Droplets,
  PaintBucket,
  Grid3X3,
  Sparkles,
  Eye,
  RefreshCw,
  Filter,
  Home,
  DoorOpen,
  Lightbulb,
  ToggleLeft,
  Droplet,
  Flame,
  ArrowRight,
  Plus,
  Minus,
  DollarSign,
  ClipboardCheck,
  Send,
  Search,
  Tag,
  Trash2,
} from "lucide-react";
import {
  listarAnalisesAprovadas,
  buscarAnalise,
  type AnaliseProjetoCompleta,
  type AnaliseProjetoAmbiente,
} from "@/lib/analiseProjetoApi";
import {
  listarComposicoes,
  buscarComposicaoCompleta,
  calcularMateriaisComposicao,
  gerarListaComprasDeOrcamento,
  type ModeloComposicao,
  type MaterialCalculado,
  type ClassificacaoMaterial,
} from "@/lib/composicoesApi";
import { atualizarItem as atualizarItemPricelist } from "@/lib/pricelistApi";
import { useToast } from "@/hooks/use-toast";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { formatarMoeda } from "@/lib/utils";

const loadXLSX = () => import("@/lib/xlsxCompat");

// ============================================================
// TIPOS
// ============================================================

interface ItemOrcamento {
  ambiente_id: string;
  ambiente_nome: string;
  composicao_codigo: string;
  composicao_nome: string;
  disciplina: string;
  quantidade_base: number;
  unidade_base: string;
  materiais: MaterialCalculado[];
}

interface ResumoClassificacao {
  classificacao: ClassificacaoMaterial;
  itens: number;
  valorTotal: number;
}

interface ResumoTotais {
  totalItens: number;
  totalQuantidade: number;
  valorTotalMateriais: number;
  valorTotalComAjustes: number;
}

// ============================================================
// CONFIGURAÇÕES
// ============================================================

const DISCIPLINA_CONFIG: Record<string, { cor: string; corLight: string; icon: React.ReactNode; label: string }> = {
  ELETRICA: { cor: "#F59E0B", corLight: "#FEF3C7", icon: <Zap className="w-4 h-4" />, label: "Elétrica" },
  HIDRAULICA: { cor: "#3B82F6", corLight: "#DBEAFE", icon: <Droplets className="w-4 h-4" />, label: "Hidráulica" },
  REVESTIMENTOS: { cor: "#8B5CF6", corLight: "#EDE9FE", icon: <Grid3X3 className="w-4 h-4" />, label: "Revestimentos" },
  PINTURA: { cor: "#EC4899", corLight: "#FCE7F3", icon: <PaintBucket className="w-4 h-4" />, label: "Pintura" },
  GESSO: { cor: "#6B7280", corLight: "#F3F4F6", icon: <Layers className="w-4 h-4" />, label: "Gesso" },
};

const CLASSIFICACAO_CONFIG: Record<ClassificacaoMaterial, { cor: string; corLight: string; label: string; descricao: string }> = {
  ACABAMENTO: { cor: "#10B981", corLight: "#D1FAE5", label: "Acabamento", descricao: "Escolha do cliente" },
  INSUMO: { cor: "#3B82F6", corLight: "#DBEAFE", label: "Insumo", descricao: "Materiais de instalaçÍo" },
  CONSUMIVEL: { cor: "#F59E0B", corLight: "#FEF3C7", label: "Consumível", descricao: "Uso na obra" },
  FERRAMENTA: { cor: "#6B7280", corLight: "#F3F4F6", label: "Ferramenta", descricao: "Equipamentos" },
};

// Opções de unidades para o dropdown (nome completo para seleçÍo)
const UNIDADES_OPCOES = [
  { value: "un", label: "Unidade" },
  { value: "pç", label: "Peça" },
  { value: "kg", label: "Quilograma" },
  { value: "g", label: "Grama" },
  { value: "m", label: "Metro" },
  { value: "m²", label: "Metro Quadrado" },
  { value: "m³", label: "Metro Cúbico" },
  { value: "ml", label: "Metro Linear" },
  { value: "L", label: "Litro" },
  { value: "cx", label: "Caixa" },
  { value: "sc", label: "Saco" },
  { value: "pct", label: "Pacote" },
  { value: "rl", label: "Rolo" },
  { value: "tb", label: "Tubo" },
  { value: "gl", label: "GalÍo" },
  { value: "lt", label: "Lata" },
  { value: "bj", label: "Balde" },
  { value: "vb", label: "Verba" },
  { value: "conj", label: "Conjunto" },
  { value: "par", label: "Par" },
  { value: "jg", label: "Jogo" },
];

// Etapas de obra em ordem cronológica
const ETAPAS_OBRA = [
  { codigo: "PRE_OBRA", label: "Pré Obra", cor: "#6B7280", corLight: "#F3F4F6", ordem: 1 },
  { codigo: "DEMOLICAO", label: "DemoliçÍo", cor: "#EF4444", corLight: "#FEE2E2", ordem: 2 },
  { codigo: "ALVENARIA", label: "Alvenaria", cor: "#78716C", corLight: "#F5F5F4", ordem: 3 },
  { codigo: "ELETRICA", label: "Elétrica", cor: "#F59E0B", corLight: "#FEF3C7", ordem: 4 },
  { codigo: "HIDRAULICA", label: "Hidráulica", cor: "#3B82F6", corLight: "#DBEAFE", ordem: 5 },
  { codigo: "FORRO", label: "Forro/Gesso", cor: "#A1A1AA", corLight: "#F4F4F5", ordem: 6 },
  { codigo: "PAREDE", label: "Parede", cor: "#8B5CF6", corLight: "#EDE9FE", ordem: 7 },
  { codigo: "PISO", label: "Piso", cor: "#14B8A6", corLight: "#CCFBF1", ordem: 8 },
  { codigo: "TETO", label: "Teto", cor: "#64748B", corLight: "#F1F5F9", ordem: 9 },
  { codigo: "PINTURA", label: "Pintura", cor: "#EC4899", corLight: "#FCE7F3", ordem: 10 },
  { codigo: "ACABAMENTO", label: "Acabamento", cor: "#10B981", corLight: "#D1FAE5", ordem: 11 },
];

// Mapeamento de código de composiçÍo para etapa de obra
function identificarEtapaObra(codigoComposicao: string, descricao: string): string {
  const codigo = codigoComposicao.toUpperCase();
  const desc = descricao.toLowerCase();

  if (codigo.includes("ELE-") || desc.includes("elétric") || desc.includes("tomada") || desc.includes("interruptor")) return "ELETRICA";
  if (codigo.includes("HID-") || desc.includes("hidráulic") || desc.includes("água") || desc.includes("esgoto")) return "HIDRAULICA";
  if (codigo.includes("PISO") || desc.includes("piso") || desc.includes("porcelanato piso")) return "PISO";
  if (codigo.includes("PAREDE") || codigo.includes("REV-") || desc.includes("revestimento") || desc.includes("parede")) return "PAREDE";
  if (codigo.includes("TETO") || desc.includes("teto") && !desc.includes("forro")) return "TETO";
  if (codigo.includes("GESSO") || codigo.includes("FORRO") || desc.includes("gesso") || desc.includes("forro") || desc.includes("sanca")) return "FORRO";
  if (codigo.includes("PINT-") || desc.includes("pintura") || desc.includes("tinta") || desc.includes("primer")) return "PINTURA";
  if (codigo.includes("ALV-") || desc.includes("alvenaria") || desc.includes("tijolo") || desc.includes("bloco")) return "ALVENARIA";
  if (codigo.includes("DEM-") || desc.includes("demoliçÍo") || desc.includes("remoçÍo")) return "DEMOLICAO";
  if (desc.includes("acabamento") || desc.includes("louça") || desc.includes("metais")) return "ACABAMENTO";

  return "PRE_OBRA";
}

// Mapeamento de tipo de ambiente para composições sugeridas
const MAPEAMENTO_AMBIENTE_COMPOSICOES: Record<string, string[]> = {
  banheiro: ["HID-AF", "HID-AQ", "HID-ESG-50", "HID-INST-BACIA", "HID-INST-CUBA", "REV-PAREDE-PORC", "PISO-PORC", "PINT-TETO"],
  lavabo: ["HID-AF", "HID-ESG-50", "HID-INST-CUBA", "REV-PAREDE-PORC", "PISO-PORC", "PINT-TETO"],
  cozinha: ["HID-AF", "HID-AQ", "HID-ESG-100", "HID-INST-CUBA", "REV-PAREDE-PORC", "PISO-PORC", "PINT-TETO"],
  area_servico: ["HID-AF", "HID-AQ", "HID-ESG-100", "PISO-PORC", "PINT-PAREDE", "PINT-TETO"],
  lavanderia: ["HID-AF", "HID-AQ", "HID-ESG-100", "PISO-PORC", "PINT-PAREDE", "PINT-TETO"],
  quarto: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO", "GESSO-FORRO"],
  suite: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO", "GESSO-FORRO"],
  sala: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO", "GESSO-FORRO", "GESSO-SANCA"],
  escritorio: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO", "GESSO-FORRO"],
  closet: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO"],
  corredor: ["PISO-LAMINADO", "PINT-PAREDE", "PINT-TETO"],
  hall: ["PISO-PORC", "PINT-PAREDE", "PINT-TETO"],
  varanda: ["PISO-PORC", "PINT-PAREDE", "PINT-TETO"],
  sacada: ["PISO-PORC", "PINT-PAREDE", "PINT-TETO"],
  outro: ["PINT-PAREDE", "PINT-TETO"],
};

// Composições elétricas (aplicadas por quantidade de pontos)
const COMPOSICOES_ELETRICAS = {
  tomada_simples: "ELE-TOMADA",
  tomada_4x4: "ELE-TOMADA-4X4",
  ponto_luz: "ELE-LUZ",
  interruptor_simples: "ELE-INT-SIMPLES",
  interruptor_paralelo: "ELE-INT-PARALELO",
};

export default function OrcamentoMateriaisPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [analises, setAnalises] = useState<AnaliseProjetoCompleta[]>([]);
  const [loadingAnalises, setLoadingAnalises] = useState(true);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<AnaliseProjetoCompleta | null>(null);
  const [loadingAnalise, setLoadingAnalise] = useState(false);

  const [composicoes, setComposicoes] = useState<ModeloComposicao[]>([]);
  const [composicoesCompletas, setComposicoesCompletas] = useState<Map<string, ModeloComposicao>>(new Map());
  const [loadingComposicoes, setLoadingComposicoes] = useState(true);

  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);
  const [calculando, setCalculando] = useState(false);

  const [filtroClassificacao, setFiltroClassificacao] = useState<string>("todos");
  const [filtroDisciplina, setFiltroDisciplina] = useState<string>("todos");
  const [filtroEtapa, setFiltroEtapa] = useState<string>("todos");
  const [buscaMaterial, setBuscaMaterial] = useState<string>("");
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set());
  const [gerandoLista, setGerandoLista] = useState(false);
  const [ajustesManuais, setAjustesManuais] = useState<Record<string, number>>({});
  const [itensRemovidos, setItensRemovidos] = useState<Set<string>>(new Set());

  // Estados para ediçÍo inline de preço
  const [editandoPreco, setEditandoPreco] = useState<string | null>(null);
  const [salvandoEdicao, setSalvandoEdicao] = useState<string | null>(null);

  // FunçÍo para salvar unidade/preço no pricelist
  async function handleSalvarEdicaoPricelist(
    chave: string,
    pricelistId: string | null | undefined,
    campo: 'unidade' | 'preco',
    valor: string | number
  ) {
    if (!pricelistId) {
      toast({
        title: "Erro",
        description: "Este item nÍo está vinculado ao Pricelist.",
        variant: "destructive",
      });
      return;
    }

    setSalvandoEdicao(chave);
    try {
      const payload = campo === 'unidade' ? { unidade: valor as string } : { preco: valor as number };
      await atualizarItemPricelist(pricelistId, payload);

      // Atualizar localmente os itens do orçamento
      setItensOrcamento(prev => prev.map(item => ({
        ...item,
        materiais: item.materiais.map(mat => {
          if (mat.pricelist_item_id === pricelistId) {
            return {
              ...mat,
              [campo === 'unidade' ? 'unidade' : 'preco_unitario']: valor,
            };
          }
          return mat;
        }),
      })));

      toast({
        title: "Salvo!",
        description: `${campo === 'unidade' ? 'Unidade' : 'Preço'} atualizado no Pricelist.`,
      });
    } catch (error) {
      console.error("Erro ao salvar no pricelist:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível salvar a alteraçÍo.",
        variant: "destructive",
      });
    } finally {
      setSalvandoEdicao(null);
      setEditandoPreco(null);
    }
  }

  // Carregar dados iniciais
  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  async function carregarDadosIniciais() {
    try {
      setLoadingAnalises(true);
      setLoadingComposicoes(true);

      const [analisesData, composicoesData] = await Promise.all([
        listarAnalisesAprovadas(),
        listarComposicoes({ ativo: true }),
      ]);

      setAnalises(analisesData);
      setComposicoes(composicoesData);

      // Pré-carregar composições completas
      const mapaComposicoes = new Map<string, ModeloComposicao>();
      for (const comp of composicoesData) {
        try {
          const completa = await buscarComposicaoCompleta(comp.id);
          if (completa) {
            mapaComposicoes.set(comp.codigo, completa);
          }
        } catch (err) {
          console.warn(`Erro ao carregar composiçÍo ${comp.codigo}:`, err);
        }
      }
      setComposicoesCompletas(mapaComposicoes);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalises(false);
      setLoadingComposicoes(false);
    }
  }

  // Selecionar análise
  async function handleSelecionarAnalise(analise: AnaliseProjetoCompleta) {
    try {
      setLoadingAnalise(true);
      const analiseCompleta = await buscarAnalise(analise.id);
      setAnaliseSelecionada(analiseCompleta);
      setItensOrcamento([]);

      toast({
        title: "Análise carregada!",
        description: `${analiseCompleta.ambientes?.length || 0} ambientes encontrados.`,
      });
    } catch (error) {
      console.error("Erro ao carregar análise:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar a análise.",
        variant: "destructive",
      });
    } finally {
      setLoadingAnalise(false);
    }
  }

  // Calcular materiais automaticamente
  async function calcularMateriais() {
    if (!analiseSelecionada?.ambientes) {
      toast({
        title: "Selecione uma análise",
        description: "Escolha uma análise de projeto para calcular os materiais.",
        variant: "destructive",
      });
      return;
    }

    setCalculando(true);
    const novosItens: ItemOrcamento[] = [];

    try {
      for (const ambiente of analiseSelecionada.ambientes) {
        const tipoAmbiente = ambiente.tipo || inferirTipoAmbiente(ambiente.nome);

        // 1. Composições por tipo de ambiente (revestimentos, pintura, etc.)
        const composicoesAmbiente = MAPEAMENTO_AMBIENTE_COMPOSICOES[tipoAmbiente] || MAPEAMENTO_AMBIENTE_COMPOSICOES.outro;

        for (const codigoComposicao of composicoesAmbiente) {
          const composicao = composicoesCompletas.get(codigoComposicao);
          if (!composicao || !composicao.itens) continue;

          // Determinar quantidade base pelo tipo de composiçÍo
          let quantidadeBase = 0;
          let unidadeBase = composicao.unidade_base;

          if (composicao.unidade_base === "m2") {
            // Composições por área
            if (composicao.codigo.includes("PISO") || composicao.codigo.includes("TETO")) {
              quantidadeBase = ambiente.area_piso || 0;
            } else if (composicao.codigo.includes("PAREDE")) {
              quantidadeBase = ambiente.area_paredes_liquida || ambiente.area_paredes_bruta || 0;
            } else if (composicao.codigo.includes("FORRO") || composicao.codigo.includes("SANCA")) {
              quantidadeBase = ambiente.area_teto || ambiente.area_piso || 0;
            }
          } else if (composicao.unidade_base === "ml") {
            // Composições por metro linear (perímetro)
            quantidadeBase = ambiente.perimetro || 0;
          } else {
            // Composições por unidade
            quantidadeBase = 1;
          }

          if (quantidadeBase <= 0) continue;

          const materiais = calcularMateriaisComposicao(composicao, quantidadeBase, {
            area: ambiente.area_piso || 0,
            perimetro: ambiente.perimetro || 0,
          });

          if (materiais.length > 0) {
            novosItens.push({
              ambiente_id: ambiente.id,
              ambiente_nome: ambiente.nome,
              composicao_codigo: composicao.codigo,
              composicao_nome: composicao.nome,
              disciplina: composicao.disciplina,
              quantidade_base: quantidadeBase,
              unidade_base: unidadeBase,
              materiais,
            });
          }
        }

        // 2. Composições Elétricas (por quantidade de pontos)
        const pontosEletricos = [
          { codigo: "ELE-TOMADA", qtd: (ambiente.tomadas_110v || 0) + (ambiente.tomadas_220v || 0) },
          { codigo: "ELE-LUZ", qtd: ambiente.pontos_iluminacao || 0 },
          { codigo: "ELE-INT-SIMPLES", qtd: ambiente.interruptores_simples || 0 },
          { codigo: "ELE-INT-PARALELO", qtd: ambiente.interruptores_paralelo || 0 },
        ];

        for (const ponto of pontosEletricos) {
          if (ponto.qtd <= 0) continue;

          const composicao = composicoesCompletas.get(ponto.codigo);
          if (!composicao || !composicao.itens) continue;

          const materiais = calcularMateriaisComposicao(composicao, ponto.qtd, {
            unidades: ponto.qtd,
          });

          if (materiais.length > 0) {
            novosItens.push({
              ambiente_id: ambiente.id,
              ambiente_nome: ambiente.nome,
              composicao_codigo: composicao.codigo,
              composicao_nome: composicao.nome,
              disciplina: composicao.disciplina,
              quantidade_base: ponto.qtd,
              unidade_base: "un",
              materiais,
            });
          }
        }

        // 3. Composições Hidráulicas (por quantidade de pontos)
        const pontosHidraulicos = [
          { codigo: "HID-AF", qtd: ambiente.pontos_agua_fria || 0 },
          { codigo: "HID-AQ", qtd: ambiente.pontos_agua_quente || 0 },
          { codigo: "HID-ESG-50", qtd: ambiente.pontos_esgoto || 0 },
        ];

        for (const ponto of pontosHidraulicos) {
          if (ponto.qtd <= 0) continue;

          const composicao = composicoesCompletas.get(ponto.codigo);
          if (!composicao || !composicao.itens) continue;

          const materiais = calcularMateriaisComposicao(composicao, ponto.qtd, {
            unidades: ponto.qtd,
          });

          if (materiais.length > 0) {
            novosItens.push({
              ambiente_id: ambiente.id,
              ambiente_nome: ambiente.nome,
              composicao_codigo: composicao.codigo,
              composicao_nome: composicao.nome,
              disciplina: composicao.disciplina,
              quantidade_base: ponto.qtd,
              unidade_base: "un",
              materiais,
            });
          }
        }
      }

      setItensOrcamento(novosItens);

      const totalMateriais = novosItens.reduce((acc, item) => acc + item.materiais.length, 0);
      toast({
        title: "Materiais calculados!",
        description: `${totalMateriais} itens em ${novosItens.length} composições.`,
      });
    } catch (error) {
      console.error("Erro ao calcular materiais:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao calcular os materiais.",
        variant: "destructive",
      });
    } finally {
      setCalculando(false);
    }
  }

  // Inferir tipo de ambiente pelo nome
  function inferirTipoAmbiente(nome: string): string {
    const nomeLower = nome.toLowerCase();
    if (nomeLower.includes("banheiro") || nomeLower.includes("wc")) return "banheiro";
    if (nomeLower.includes("lavabo")) return "lavabo";
    if (nomeLower.includes("cozinha")) return "cozinha";
    if (nomeLower.includes("área de serviço") || nomeLower.includes("area de servico")) return "area_servico";
    if (nomeLower.includes("lavanderia")) return "lavanderia";
    if (nomeLower.includes("suíte") || nomeLower.includes("suite")) return "suite";
    if (nomeLower.includes("quarto")) return "quarto";
    if (nomeLower.includes("sala")) return "sala";
    if (nomeLower.includes("escritório") || nomeLower.includes("escritorio") || nomeLower.includes("home office")) return "escritorio";
    if (nomeLower.includes("closet")) return "closet";
    if (nomeLower.includes("corredor") || nomeLower.includes("circulaçÍo")) return "corredor";
    if (nomeLower.includes("hall")) return "hall";
    if (nomeLower.includes("varanda")) return "varanda";
    if (nomeLower.includes("sacada")) return "sacada";
    return "outro";
  }

  // Calcular resumo por classificaçÍo
  const resumoClassificacao = useMemo(() => {
    const resumo: Record<ClassificacaoMaterial, ResumoClassificacao> = {
      ACABAMENTO: { classificacao: "ACABAMENTO", itens: 0, valorTotal: 0 },
      INSUMO: { classificacao: "INSUMO", itens: 0, valorTotal: 0 },
      CONSUMIVEL: { classificacao: "CONSUMIVEL", itens: 0, valorTotal: 0 },
      FERRAMENTA: { classificacao: "FERRAMENTA", itens: 0, valorTotal: 0 },
    };

    for (const item of itensOrcamento) {
      for (const material of item.materiais) {
        resumo[material.classificacao].itens += 1;
        resumo[material.classificacao].valorTotal += material.valor_total || 0;
      }
    }

    return resumo;
  }, [itensOrcamento]);

  // Calcular totais gerais (com e sem ajustes)
  const resumoTotais = useMemo((): ResumoTotais => {
    let totalItens = 0;
    let totalQuantidade = 0;
    let valorTotalMateriais = 0;
    let valorTotalComAjustes = 0;

    const materiaisAgrupados: Record<string, { quantidade: number; preco: number; chave: string }> = {};

    for (const item of itensOrcamento) {
      for (const material of item.materiais) {
        const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;

        if (!materiaisAgrupados[chave]) {
          materiaisAgrupados[chave] = { quantidade: 0, preco: material.preco_unitario || 0, chave };
        }
        materiaisAgrupados[chave].quantidade += material.quantidade_final;
      }
    }

    for (const [chave, dados] of Object.entries(materiaisAgrupados)) {
      totalItens += 1;
      const qtdOriginal = dados.quantidade;
      const qtdAjustada = ajustesManuais[chave] ?? qtdOriginal;
      totalQuantidade += qtdAjustada;
      valorTotalMateriais += qtdOriginal * dados.preco;
      valorTotalComAjustes += qtdAjustada * dados.preco;
    }

    return { totalItens, totalQuantidade, valorTotalMateriais, valorTotalComAjustes };
  }, [itensOrcamento, ajustesManuais]);

  // Agrupar materiais consolidados
  const materiaisConsolidados = useMemo(() => {
    const mapa: Record<string, MaterialCalculado & { ambientes: string[]; etapa: string; composicaoCodigo: string }> = {};

    for (const item of itensOrcamento) {
      for (const material of item.materiais) {
        const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;
        const etapa = identificarEtapaObra(item.composicao_codigo, material.item_descricao);

        if (mapa[chave]) {
          mapa[chave].quantidade_calculada += material.quantidade_calculada;
          mapa[chave].quantidade_final += material.quantidade_final;
          mapa[chave].valor_total = (mapa[chave].valor_total || 0) + (material.valor_total || 0);
          if (!mapa[chave].ambientes.includes(item.ambiente_nome)) {
            mapa[chave].ambientes.push(item.ambiente_nome);
          }
        } else {
          mapa[chave] = {
            ...material,
            ambientes: [item.ambiente_nome],
            etapa,
            composicaoCodigo: item.composicao_codigo,
          };
        }
      }
    }

    // Filtrar
    let resultado = Object.entries(mapa)
      .filter(([chave]) => !itensRemovidos.has(chave))
      .map(([, m]) => m);

    // Filtro por classificaçÍo
    if (filtroClassificacao !== "todos") {
      resultado = resultado.filter((m) => m.classificacao === filtroClassificacao);
    }

    // Filtro por etapa de obra
    if (filtroEtapa !== "todos") {
      resultado = resultado.filter((m) => (m as any).etapa === filtroEtapa);
    }

    // Filtro por busca textual
    if (buscaMaterial.trim()) {
      const termo = normalizeSearchTerm(buscaMaterial);
      resultado = resultado.filter((m) =>
        normalizeSearchTerm(m.item_descricao).includes(termo) ||
        (m as any).ambientes.some((a: string) => normalizeSearchTerm(a).includes(termo))
      );
    }

    // Ordenar por etapa de obra (cronológica) e depois por descriçÍo
    resultado.sort((a, b) => {
      const etapaA = ETAPAS_OBRA.find(e => e.codigo === (a as any).etapa)?.ordem || 99;
      const etapaB = ETAPAS_OBRA.find(e => e.codigo === (b as any).etapa)?.ordem || 99;

      if (etapaA !== etapaB) {
        return etapaA - etapaB;
      }

      // Dentro da mesma etapa, ordenar por classificaçÍo
      if (a.classificacao !== b.classificacao) {
        const ordemClass = ["ACABAMENTO", "INSUMO", "CONSUMIVEL", "FERRAMENTA"];
        return ordemClass.indexOf(a.classificacao) - ordemClass.indexOf(b.classificacao);
      }

      return a.item_descricao.localeCompare(b.item_descricao);
    });

    return resultado;
  }, [itensOrcamento, filtroClassificacao, filtroEtapa, buscaMaterial, itensRemovidos]);

  // Remover item da lista
  function handleRemoverItem(chave: string) {
    setItensRemovidos((prev) => {
      const novo = new Set(prev);
      novo.add(chave);
      return novo;
    });
    toast({
      title: "Item removido",
      description: "O item foi removido da lista de materiais.",
    });
  }

  // Restaurar item removido
  function handleRestaurarItem(chave: string) {
    setItensRemovidos((prev) => {
      const novo = new Set(prev);
      novo.delete(chave);
      return novo;
    });
  }

  // Toggle expandir ambiente
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

  // Gerar lista de compras
  async function handleGerarListaCompras() {
    if (!analiseSelecionada || itensOrcamento.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione uma análise e calcule os materiais primeiro.",
        variant: "destructive",
      });
      return;
    }

    setGerandoLista(true);

    try {
      // Preparar materiais com ajustes manuais aplicados
      const materiaisAjustados: MaterialCalculado[] = [];
      const ambientesPorMaterial: Record<string, string[]> = {};

      for (const item of itensOrcamento) {
        for (const material of item.materiais) {
          const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;

          // Aplicar ajuste manual se existir
          const ajuste = ajustesManuais[chave];
          const materialAjustado = ajuste !== undefined
            ? { ...material, quantidade_final: ajuste, valor_total: ajuste * (material.preco_unitario || 0) }
            : material;

          materiaisAjustados.push(materialAjustado);

          // Mapear ambientes
          if (!ambientesPorMaterial[chave]) {
            ambientesPorMaterial[chave] = [];
          }
          if (!ambientesPorMaterial[chave].includes(item.ambiente_nome)) {
            ambientesPorMaterial[chave].push(item.ambiente_nome);
          }
        }
      }

      const resultado = await gerarListaComprasDeOrcamento(
        analiseSelecionada.id,
        analiseSelecionada.titulo,
        analiseSelecionada.cliente_nome || "Cliente",
        materiaisAjustados,
        ambientesPorMaterial
      );

      toast({
        title: "Enviado para AprovaçÍo!",
        description: `${resultado.totalItens} itens aguardando aprovaçÍo do cliente.`,
      });

      // Navegar para o módulo de aprovações (fluxo: Orçamento → Aprovações → Compras)
      navigate(`/planejamento/aprovacoes?projeto=${resultado.projetoId}&origem=orcamento-materiais`);
    } catch (error) {
      console.error("Erro ao gerar lista de compras:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível gerar a lista de compras.",
        variant: "destructive",
      });
    } finally {
      setGerandoLista(false);
    }
  }

  // Exportar para Excel
  async function handleExportarExcel() {
    if (!analiseSelecionada || materiaisConsolidados.length === 0) {
      toast({
        title: "Erro",
        description: "Calcule os materiais primeiro para exportar.",
        variant: "destructive",
      });
      return;
    }

    try {
      const XLSX = await loadXLSX();
      // Preparar dados para a planilha consolidada
      const dadosConsolidados = materiaisConsolidados.map((material) => {
        const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;
        const qtdFinal = ajustesManuais[chave] ?? material.quantidade_final;

        return {
          "ClassificaçÍo": CLASSIFICACAO_CONFIG[material.classificacao]?.label || material.classificacao,
          "DescriçÍo": material.item_descricao,
          "Quantidade": qtdFinal,
          "Unidade": material.unidade,
          "Preço Unitário": material.preco_unitario || 0,
          "Valor Total": qtdFinal * (material.preco_unitario || 0),
          "Ambientes": (material as any).ambientes?.join(", ") || "",
        };
      });

      // Preparar dados detalhados por ambiente
      const dadosDetalhados: any[] = [];
      for (const item of itensOrcamento) {
        for (const mat of item.materiais) {
          dadosDetalhados.push({
            "Ambiente": item.ambiente_nome,
            "Disciplina": DISCIPLINA_CONFIG[item.disciplina]?.label || item.disciplina,
            "ComposiçÍo": `${item.composicao_codigo} - ${item.composicao_nome}`,
            "Qtd Base": item.quantidade_base,
            "Un. Base": item.unidade_base,
            "ClassificaçÍo": CLASSIFICACAO_CONFIG[mat.classificacao]?.label || mat.classificacao,
            "Material": mat.item_descricao,
            "Quantidade": mat.quantidade_final,
            "Unidade": mat.unidade,
            "Preço Unit.": mat.preco_unitario || 0,
            "Valor Total": mat.valor_total || 0,
          });
        }
      }

      // Resumo por classificaçÍo
      const dadosResumo = Object.entries(resumoClassificacao).map(([classif, dados]) => ({
        "ClassificaçÍo": CLASSIFICACAO_CONFIG[classif as ClassificacaoMaterial]?.label || classif,
        "DescriçÍo": CLASSIFICACAO_CONFIG[classif as ClassificacaoMaterial]?.descricao || "",
        "Qtd Itens": dados.itens,
        "Valor Total": dados.valorTotal,
      }));

      // Criar workbook com múltiplas abas
      const wb = XLSX.utils.book_new();

      // Aba 1: Lista Consolidada
      const wsConsolidado = XLSX.utils.json_to_sheet(dadosConsolidados);
      wsConsolidado["!cols"] = [
        { wch: 15 }, // ClassificaçÍo
        { wch: 50 }, // DescriçÍo
        { wch: 12 }, // Quantidade
        { wch: 8 },  // Unidade
        { wch: 14 }, // Preço Unitário
        { wch: 14 }, // Valor Total
        { wch: 40 }, // Ambientes
      ];
      XLSX.utils.book_append_sheet(wb, wsConsolidado, "Lista Consolidada");

      // Aba 2: Detalhamento por Ambiente
      const wsDetalhado = XLSX.utils.json_to_sheet(dadosDetalhados);
      wsDetalhado["!cols"] = [
        { wch: 20 }, // Ambiente
        { wch: 15 }, // Disciplina
        { wch: 30 }, // ComposiçÍo
        { wch: 10 }, // Qtd Base
        { wch: 8 },  // Un. Base
        { wch: 15 }, // ClassificaçÍo
        { wch: 40 }, // Material
        { wch: 12 }, // Quantidade
        { wch: 8 },  // Unidade
        { wch: 12 }, // Preço Unit.
        { wch: 14 }, // Valor Total
      ];
      XLSX.utils.book_append_sheet(wb, wsDetalhado, "Por Ambiente");

      // Aba 3: Resumo
      const wsResumo = XLSX.utils.json_to_sheet(dadosResumo);
      wsResumo["!cols"] = [
        { wch: 15 }, // ClassificaçÍo
        { wch: 30 }, // DescriçÍo
        { wch: 12 }, // Qtd Itens
        { wch: 14 }, // Valor Total
      ];
      XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

      // Gerar arquivo
      const nomeArquivo = `Orcamento_Materiais_${analiseSelecionada.titulo.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, nomeArquivo);

      toast({
        title: "Exportado com sucesso!",
        description: `Arquivo ${nomeArquivo} gerado.`,
      });
    } catch (error) {
      console.error("Erro ao exportar Excel:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível exportar para Excel.",
        variant: "destructive",
      });
    }
  }

  // Ajustar quantidade manualmente
  function handleAjusteQuantidade(chave: string, delta: number) {
    setAjustesManuais((prev) => {
      const materialOriginal = materiaisConsolidados.find(
        (m) => `${m.item_descricao}|${m.classificacao}|${m.unidade}` === chave
      );
      if (!materialOriginal) return prev;

      const valorAtual = prev[chave] ?? materialOriginal.quantidade_final;
      const novoValor = Math.max(0, valorAtual + delta);

      return { ...prev, [chave]: novoValor };
    });
  }

  // Definir quantidade manualmente
  function handleDefinirQuantidade(chave: string, valor: number) {
    setAjustesManuais((prev) => ({
      ...prev,
      [chave]: Math.max(0, valor),
    }));
  }

  // Resetar ajustes
  function handleResetarAjustes() {
    setAjustesManuais({});
    toast({
      title: "Ajustes resetados",
      description: "Todas as quantidades voltaram aos valores calculados.",
    });
  }

  if (loadingAnalises || loadingComposicoes) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-wg-primary animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-[#FAFAFA]">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-wg-primary to-wg-primary/90 rounded-2xl flex items-center justify-center shadow-lg">
              <Calculator className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Orçamento de Materiais</h1>
              <p className="text-[12px] text-gray-600">Calculo automatico a partir da Analise de Projeto</p>
            </div>
          </div>
        </div>

        {/* Fluxo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-8">
              {/* Step 1 */}
              <div className={`flex items-center gap-3 ${analiseSelecionada ? "opacity-50" : ""}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${analiseSelecionada ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                  {analiseSelecionada ? <CheckCircle className="w-5 h-5" /> : <FileSearch className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">1. Selecionar Análise</p>
                  <p className="text-sm text-gray-500">Escolha um projeto analisado</p>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-300" />

              {/* Step 2 */}
              <div className={`flex items-center gap-3 ${itensOrcamento.length > 0 ? "opacity-50" : analiseSelecionada ? "" : "opacity-30"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${itensOrcamento.length > 0 ? "bg-green-100 text-green-600" : analiseSelecionada ? "bg-blue-100 text-blue-600" : "bg-gray-100 text-gray-400"}`}>
                  {itensOrcamento.length > 0 ? <CheckCircle className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">2. Calcular Materiais</p>
                  <p className="text-sm text-gray-500">Aplicar composições</p>
                </div>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-300" />

              {/* Step 3 */}
              <div className={`flex items-center gap-3 ${itensOrcamento.length > 0 ? "" : "opacity-30"}`}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${itensOrcamento.length > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">3. AprovaçÍo do Cliente</p>
                  <p className="text-sm text-gray-500">Enviar para aprovaçÍo</p>
                </div>
              </div>
            </div>

            {itensOrcamento.length > 0 && (
              <div className="flex gap-2">
                {Object.keys(ajustesManuais).length > 0 && (
                  <button
                    type="button"
                    onClick={handleResetarAjustes}
                    className="px-4 py-2 border border-orange-300 text-orange-600 rounded-lg hover:bg-orange-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Resetar Ajustes
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleExportarExcel}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Exportar Excel
                </button>
                <button
                  type="button"
                  onClick={handleGerarListaCompras}
                  disabled={gerandoLista}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {gerandoLista ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  {gerandoLista ? "Enviando..." : "Enviar para AprovaçÍo"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* SeleçÍo de Análise */}
        {!analiseSelecionada && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <h2 className="text-lg font-normal text-gray-900 mb-4 flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-blue-600" />
              Análises de Projeto Disponíveis
            </h2>

            {analises.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-[18px] font-normal text-gray-700 mb-2">Nenhuma analise disponivel</h3>
                <p className="text-gray-500 mb-4">Crie uma análise de projeto primeiro.</p>
                <button
                  type="button"
                  onClick={() => navigate("/analise-projeto")}
                  className="px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90"
                >
                  Ir para Análises
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {analises.map((analise) => (
                  <div
                    key={analise.id}
                    onClick={() => handleSelecionarAnalise(analise)}
                    className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:shadow-md cursor-pointer transition-all bg-white"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Building2 className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-normal text-gray-900">{analise.titulo}</h3>
                          <p className="text-sm text-gray-500">{analise.cliente_nome}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${analise.status === "aprovado" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {analise.status === "aprovado" ? "Aprovado" : "Analisado"}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1 text-gray-600">
                        <Home className="w-4 h-4" />
                        <span>{analise.total_ambientes || 0} ambientes</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Grid3X3 className="w-4 h-4" />
                        <span>{(analise.total_area_piso || 0).toFixed(0)} m²</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Análise Selecionada */}
        {analiseSelecionada && (
          <>
            {/* Card da Análise */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-6 mb-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Building2 className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-normal text-gray-900">{analiseSelecionada.titulo}</h2>
                    <p className="text-gray-600">{analiseSelecionada.cliente_nome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[20px] font-normal text-blue-600">{analiseSelecionada.ambientes?.length || 0}</p>
                    <p className="text-[12px] text-gray-500">ambientes</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setAnaliseSelecionada(null);
                      setItensOrcamento([]);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Resumo dos Ambientes */}
              {analiseSelecionada.ambientes && (
                <div className="mt-4 grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white/50 rounded-lg p-3 text-center">
                    <Grid3X3 className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-lg font-normal text-gray-900">
                      {analiseSelecionada.ambientes.reduce((acc, a) => acc + (a.area_piso || 0), 0).toFixed(0)} m²
                    </p>
                    <p className="text-xs text-gray-500">Área Total</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 text-center">
                    <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-normal text-gray-900">
                      {analiseSelecionada.ambientes.reduce((acc, a) => acc + (a.tomadas_110v || 0) + (a.tomadas_220v || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Tomadas</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 text-center">
                    <Lightbulb className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
                    <p className="text-lg font-normal text-gray-900">
                      {analiseSelecionada.ambientes.reduce((acc, a) => acc + (a.pontos_iluminacao || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Pontos de Luz</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 text-center">
                    <Droplet className="w-5 h-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-lg font-normal text-gray-900">
                      {analiseSelecionada.ambientes.reduce((acc, a) => acc + (a.pontos_agua_fria || 0) + (a.pontos_agua_quente || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Pontos de Água</p>
                  </div>
                  <div className="bg-white/50 rounded-lg p-3 text-center">
                    <Droplets className="w-5 h-5 mx-auto mb-1 text-gray-500" />
                    <p className="text-lg font-normal text-gray-900">
                      {analiseSelecionada.ambientes.reduce((acc, a) => acc + (a.pontos_esgoto || 0), 0)}
                    </p>
                    <p className="text-xs text-gray-500">Pontos de Esgoto</p>
                  </div>
                </div>
              )}

              {/* BotÍo Calcular */}
              {itensOrcamento.length === 0 && (
                <div className="mt-6 text-center">
                  <button
                    type="button"
                    onClick={calcularMateriais}
                    disabled={calculando}
                    className="px-8 py-3 bg-wg-primary text-white rounded-xl font-normal hover:bg-wg-primary/90 disabled:opacity-50 flex items-center gap-2 mx-auto shadow-lg"
                  >
                    {calculando ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Sparkles className="w-5 h-5" />
                    )}
                    Calcular Materiais Automaticamente
                  </button>
                </div>
              )}
            </div>

            {/* Resultados */}
            {itensOrcamento.length > 0 && (
              <>
                {/* Cards de Totais */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-[12px] font-medium">Total de Itens</p>
                        <p className="text-[20px] font-normal mt-1">{resumoTotais.totalItens}</p>
                        <p className="text-blue-100 text-xs mt-1">materiais diferentes</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg">
                        <Package className="w-7 h-7" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-[12px] font-medium">Quantidade Total</p>
                        <p className="text-[20px] font-normal mt-1">{resumoTotais.totalQuantidade.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</p>
                        <p className="text-purple-100 text-xs mt-1">unidades/peças</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg">
                        <Layers className="w-7 h-7" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-5 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-[12px] font-medium">Valor Calculado</p>
                        <p className="text-[20px] font-normal mt-1">
                          {formatarMoeda(resumoTotais.valorTotalMateriais)}
                        </p>
                        <p className="text-green-100 text-xs mt-1">estimativa inicial</p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg">
                        <Calculator className="w-7 h-7" />
                      </div>
                    </div>
                  </div>

                  <div className={`rounded-xl shadow-lg p-5 text-white ${
                    Object.keys(ajustesManuais).length > 0
                      ? 'bg-gradient-to-br from-orange-500 to-orange-600'
                      : 'bg-gradient-to-br from-teal-500 to-teal-600'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/80 text-[12px] font-medium">
                          {Object.keys(ajustesManuais).length > 0 ? 'Valor com Ajustes' : 'Valor Total'}
                        </p>
                        <p className="text-[20px] font-normal mt-1">
                          {formatarMoeda(resumoTotais.valorTotalComAjustes)}
                        </p>
                        <p className="text-white/80 text-xs mt-1">
                          {Object.keys(ajustesManuais).length > 0
                            ? `${Object.keys(ajustesManuais).length} ajustes aplicados`
                            : 'valor final'}
                        </p>
                      </div>
                      <div className="p-3 bg-white/20 rounded-lg">
                        <DollarSign className="w-7 h-7" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Resumo por ClassificaçÍo */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                  {Object.entries(CLASSIFICACAO_CONFIG).map(([key, config]) => {
                    const resumo = resumoClassificacao[key as ClassificacaoMaterial];
                    return (
                      <div
                        key={key}
                        onClick={() => setFiltroClassificacao(filtroClassificacao === key ? "todos" : key)}
                        className={`bg-white rounded-xl shadow-sm border p-4 cursor-pointer transition-all ${filtroClassificacao === key ? "border-2 border-" + config.cor : "border-gray-200 hover:border-gray-300"}`}
                        style={{ borderColor: filtroClassificacao === key ? config.cor : undefined }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg" style={{ backgroundColor: config.corLight }}>
                            <Package className="w-5 h-5" style={{ color: config.cor }} />
                          </div>
                          <div>
                            <p className="text-[20px] font-normal text-gray-900">{resumo?.itens ?? 0}</p>
                            <p className="text-[12px] text-gray-500">{config.label}</p>
                          </div>
                        </div>
                        <p className="text-xs text-gray-400 mt-2">{config.descricao}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Lista Consolidada de Materiais */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Header com busca */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-normal text-gray-900">
                        Lista Consolidada de Materiais
                        <span className="text-gray-500 font-normal ml-2">
                          ({materiaisConsolidados.length} itens)
                        </span>
                      </h3>

                      {/* Campo de busca */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Buscar material ou ambiente..."
                          value={buscaMaterial}
                          onChange={(e) => setBuscaMaterial(e.target.value)}
                          className="pl-10 pr-4 py-2 w-72 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                        />
                        {buscaMaterial && (
                          <button
                            type="button"
                            onClick={() => setBuscaMaterial("")}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Filtros de Etapa de Obra */}
                    <div className="mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Etapa da Obra:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setFiltroEtapa("todos")}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                            filtroEtapa === "todos"
                              ? "bg-gray-900 text-white"
                              : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                          }`}
                        >
                          Todas
                        </button>
                        {ETAPAS_OBRA.map((etapa) => (
                          <button
                            key={etapa.codigo}
                            type="button"
                            onClick={() => setFiltroEtapa(etapa.codigo)}
                            style={{
                              backgroundColor: filtroEtapa === etapa.codigo ? etapa.cor : etapa.corLight,
                              color: filtroEtapa === etapa.codigo ? "white" : etapa.cor,
                            }}
                            className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                          >
                            {etapa.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filtros de ClassificaçÍo */}
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-gray-500" />
                      <span className="text-sm font-medium text-gray-700">ClassificaçÍo:</span>
                      <button
                        type="button"
                        onClick={() => setFiltroClassificacao("todos")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filtroClassificacao === "todos" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}
                      >
                        Todos
                      </button>
                      {Object.entries(CLASSIFICACAO_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setFiltroClassificacao(key)}
                          style={{
                            backgroundColor: filtroClassificacao === key ? config.cor : config.corLight,
                            color: filtroClassificacao === key ? "white" : config.cor,
                          }}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                    {materiaisConsolidados.map((material, index) => {
                      const config = CLASSIFICACAO_CONFIG[material.classificacao];
                      const chave = `${material.item_descricao}|${material.classificacao}|${material.unidade}`;
                      const qtdFinal = ajustesManuais[chave] ?? material.quantidade_final;
                      const foiAjustado = ajustesManuais[chave] !== undefined;
                      const valorTotalAjustado = qtdFinal * (material.preco_unitario || 0);
                      const etapaMaterial = (material as any).etapa;
                      const etapaConfig = ETAPAS_OBRA.find(e => e.codigo === etapaMaterial);

                      return (
                        <div key={index} className={`p-4 hover:bg-gray-50 ${foiAjustado ? "bg-orange-50/50" : ""}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {/* Tag de Etapa de Obra */}
                              {etapaConfig && (
                                <span
                                  className="px-2 py-1 text-xs font-medium rounded-full"
                                  style={{ backgroundColor: etapaConfig.corLight, color: etapaConfig.cor }}
                                >
                                  {etapaConfig.label}
                                </span>
                              )}
                              {/* Tag de ClassificaçÍo */}
                              <span
                                className="px-2 py-1 text-xs font-medium rounded"
                                style={{ backgroundColor: config.corLight, color: config.cor }}
                              >
                                {config.label}
                              </span>
                              <div>
                                <p className="font-medium text-gray-900">{material.item_descricao}</p>
                                <p className="text-xs text-gray-500">
                                  {(material as any).ambientes?.join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {/* Controles de ajuste */}
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  title="Diminuir quantidade"
                                  onClick={() => handleAjusteQuantidade(chave, -1)}
                                  className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  title="Quantidade do material"
                                  value={qtdFinal.toFixed(2)}
                                  onChange={(e) => handleDefinirQuantidade(chave, parseFloat(e.target.value) || 0)}
                                  className={`w-20 text-center text-sm font-medium border rounded-md px-2 py-1 ${foiAjustado ? "border-orange-300 bg-orange-50 text-orange-700" : "border-gray-200"}`}
                                />
                                <button
                                  type="button"
                                  title="Aumentar quantidade"
                                  onClick={() => handleAjusteQuantidade(chave, 1)}
                                  className="w-7 h-7 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                {/* Unidade - Dropdown */}
                                <select
                                  title="Selecionar unidade do material"
                                  value={material.unidade}
                                  onChange={(e) => {
                                    const novaUnidade = e.target.value;
                                    if (novaUnidade !== material.unidade) {
                                      handleSalvarEdicaoPricelist(chave, material.pricelist_item_id, 'unidade', novaUnidade);
                                    }
                                  }}
                                  disabled={salvandoEdicao === chave}
                                  className="text-sm text-gray-600 ml-1 px-2 py-1 rounded border border-gray-200 bg-white hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {/* Se a unidade atual nÍo está na lista, adicionar como opçÍo */}
                                  {!UNIDADES_OPCOES.find(u => u.value === material.unidade) && (
                                    <option value={material.unidade}>{material.unidade}</option>
                                  )}
                                  {UNIDADES_OPCOES.map((unidade) => (
                                    <option key={unidade.value} value={unidade.value}>
                                      {unidade.label}
                                    </option>
                                  ))}
                                </select>
                                {salvandoEdicao === chave && (
                                  <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                                )}
                              </div>

                              {/* Preço unitário e Total - NA MESMA LINHA */}
                              <div className="flex items-center gap-2">
                                {foiAjustado && (
                                  <span className="text-xs text-gray-400 line-through">
                                    {material.quantidade_final.toFixed(2)}
                                  </span>
                                )}
                                {/* Preço Unitário - Editável */}
                                {editandoPreco === chave ? (
                                  <input
                                    type="number"
                                    step="0.01"
                                    autoFocus
                                    title="Editar preço unitário"
                                    placeholder="0.00"
                                    defaultValue={material.preco_unitario || 0}
                                    onBlur={(e) => {
                                      const novoPreco = parseFloat(e.target.value) || 0;
                                      if (novoPreco !== (material.preco_unitario || 0)) {
                                        handleSalvarEdicaoPricelist(chave, material.pricelist_item_id, 'preco', novoPreco);
                                      } else {
                                        setEditandoPreco(null);
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const novoPreco = parseFloat((e.target as HTMLInputElement).value) || 0;
                                        if (novoPreco !== (material.preco_unitario || 0)) {
                                          handleSalvarEdicaoPricelist(chave, material.pricelist_item_id, 'preco', novoPreco);
                                        } else {
                                          setEditandoPreco(null);
                                        }
                                      } else if (e.key === 'Escape') {
                                        setEditandoPreco(null);
                                      }
                                    }}
                                    className="w-20 text-center text-sm border border-green-300 rounded px-1 py-0.5 bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-400"
                                  />
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setEditandoPreco(chave)}
                                    className="text-xs text-gray-500 hover:bg-green-50 hover:text-green-600 px-1.5 py-0.5 rounded transition-colors whitespace-nowrap"
                                    title="Clique para editar o preço"
                                  >
                                    {salvandoEdicao === chave ? (
                                      <Loader2 className="w-3 h-3 animate-spin inline" />
                                    ) : (
                                      <>R$ {(material.preco_unitario || 0).toFixed(2)}/{material.unidade}</>
                                    )}
                                  </button>
                                )}
                                {/* Separador e Total */}
                                <span className={`text-sm font-normal whitespace-nowrap ${foiAjustado ? "text-orange-600" : "text-green-600"}`}>
                                  = R$ {valorTotalAjustado.toFixed(2)}
                                </span>
                              </div>

                              {/* BotÍo Excluir */}
                              <button
                                type="button"
                                title="Remover item da lista"
                                onClick={() => handleRemoverItem(chave)}
                                className="w-7 h-7 rounded-md bg-red-50 hover:bg-red-100 flex items-center justify-center text-red-500 hover:text-red-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Detalhamento por Ambiente */}
                <div className="mt-8">
                  <h3 className="text-lg font-normal text-gray-900 mb-4">Detalhamento por Ambiente</h3>

                  <div className="space-y-4">
                    {analiseSelecionada.ambientes?.map((ambiente) => {
                      const itensAmbiente = itensOrcamento.filter((i) => i.ambiente_id === ambiente.id);
                      const isExpandido = expandidos.has(ambiente.id);

                      if (itensAmbiente.length === 0) return null;

                      return (
                        <div key={ambiente.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                          <div
                            className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50"
                            onClick={() => toggleExpandir(ambiente.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-gray-100 rounded-lg">
                                <Home className="w-5 h-5 text-gray-600" />
                              </div>
                              <div>
                                <h4 className="font-normal text-gray-900">{ambiente.nome}</h4>
                                <p className="text-sm text-gray-500">
                                  {(ambiente.area_piso || 0).toFixed(1)} m² | {itensAmbiente.length} composições
                                </p>
                              </div>
                            </div>
                            {isExpandido ? (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronRight className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {isExpandido && (
                            <div className="border-t border-gray-200 p-4 bg-gray-50">
                              <div className="space-y-3">
                                {itensAmbiente.map((item, idx) => {
                                  const disciplinaConfig = DISCIPLINA_CONFIG[item.disciplina] || DISCIPLINA_CONFIG.ELETRICA;
                                  return (
                                    <div key={idx} className="bg-white rounded-lg p-3 border border-gray-200">
                                      <div className="flex items-center gap-2 mb-2">
                                        <span
                                          className="px-2 py-0.5 text-xs font-medium rounded flex items-center gap-1"
                                          style={{ backgroundColor: disciplinaConfig.corLight, color: disciplinaConfig.cor }}
                                        >
                                          {disciplinaConfig.icon}
                                          {disciplinaConfig.label}
                                        </span>
                                        <span className="font-mono text-xs text-gray-500">{item.composicao_codigo}</span>
                                        <span className="text-sm text-gray-700">{item.composicao_nome}</span>
                                        <span className="text-xs text-gray-400 ml-auto">
                                          {item.quantidade_base.toFixed(1)} {item.unidade_base}
                                        </span>
                                      </div>
                                      <div className="pl-4 space-y-1">
                                        {item.materiais.map((mat, midx) => {
                                          const classConfig = CLASSIFICACAO_CONFIG[mat.classificacao];
                                          return (
                                            <div key={midx} className="flex items-center justify-between text-sm">
                                              <div className="flex items-center gap-2">
                                                <span
                                                  className="w-2 h-2 rounded-full"
                                                  style={{ backgroundColor: classConfig.cor }}
                                                />
                                                <span className="text-gray-700">{mat.item_descricao}</span>
                                              </div>
                                              <span className="text-gray-600 font-medium">
                                                {mat.quantidade_final.toFixed(2)} {mat.unidade}
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </>
        )}
    </div>
  );
}


