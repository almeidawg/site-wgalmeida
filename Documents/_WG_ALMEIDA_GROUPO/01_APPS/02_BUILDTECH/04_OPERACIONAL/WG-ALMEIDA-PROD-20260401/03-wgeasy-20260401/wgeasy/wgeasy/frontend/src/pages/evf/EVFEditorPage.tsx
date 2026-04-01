/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================================
// EVF EDITOR PAGE - Editor de Estudo de Viabilidade Financeira
// Sistema WG Easy - Grupo WG Almeida
// ============================================================================

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Save,
  Calculator,
  FileSpreadsheet,
  FileText,
  Mail,
  Home,
  Ruler,
  TrendingUp,
  DollarSign,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import {
  buscarEstudo,
  criarEstudo,
  atualizarEstudo,
  buscarCategoriasConfig,
  sincronizarCategoriasEVFComPricelist,
  atualizarItemEstudoReal,
  recalcularTotais,
  gerarLinkPublicoEVF,
} from "@/lib/evfApi";
import { listarItens, listarCategorias } from "@/lib/pricelistApi";
import type {
  EVFItem,
  PadraoAcabamento,
  EVFCategoriaConfig,
} from "@/types/evf";
import {
  PADRAO_LABELS,
  PADRAO_MULTIPLICADORES,
  FASES_EVF,
  calcularItensEVF,
  calcularTotaisEVF,
  calcularPercentuais,
  formatarMoeda,
  formatarNumero,
  getCorCategoria as getCorCategoriaEVF,
  agruparItensPorFase,
} from "@/types/evf";
import type { GrupoFaseEVF } from "@/types/evf";
import { exportarEVFParaPDF, exportarEVFParaExcel } from "@/lib/exportarEVF";
import { listarPessoas, Pessoa } from "@/lib/pessoasApi";
import {
  getCorCategoria as getCorCategoriaPricelist,
} from "@/config/categoriasConfig";
import { TYPOGRAPHY } from "@/constants/typography";
import EVFCategoriaExpandida from "@/components/evf/EVFCategoriaExpandida";
import { PRICELIST_CATEGORY_FLOWS, EVF_CATEGORIA_TO_FLOW } from "@/lib/pricelistCategoryFlows";
import type { PricelistItemCompleto, PricelistCategoryFlow, PricelistCategoria } from "@/types/pricelist";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

// Subcategorias principais para distribuiçÍo de valores por categoria
const SUBCATEGORIAS_EVF = [
  { prefixo: "MDO", nome: "Serviço/MÍo de Obra", percentual: 0.35 }, // 35% do valor
  { prefixo: "MAT", nome: "Material", percentual: 0.45 }, // 45% do valor
  { prefixo: "PRO", nome: "Produto", percentual: 0.2 }, // 20% do valor
];

type DistribuicaoTiposCategoria = {
  mdo: number;
  material: number;
  produto: number;
};

function normalizarChaveCategoria(nome: string): string {
  return nome
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function mapearTipoParaBucket(tipo?: string): keyof DistribuicaoTiposCategoria | null {
  if (!tipo) return null;
  const tipoNormalizado = tipo.toLowerCase();
  if (tipoNormalizado === "servico" || tipoNormalizado === "mao_obra") return "mdo";
  if (tipoNormalizado === "material") return "material";
  if (tipoNormalizado === "produto") return "produto";
  return null;
}

function obterValorReferenciaM2(item: any): number {
  // Prioridade 1: preco_m2 explícito
  const precoM2 = Number(item?.preco_m2);
  if (Number.isFinite(precoM2) && precoM2 > 0) return precoM2;

  // Prioridade 2: preco unitário — SOMENTE se unidade é m2 ou ml (referência de área)
  const unidade = (item?.unidade || "").toLowerCase();
  if (unidade === "m2" || unidade === "ml") {
    const preco = Number(item?.preco);
    if (Number.isFinite(preco) && preco > 0) return preco;
  }

  // NÍo usar preco de itens unitários (un, diaria, hora, empreita) como valor/m²
  return 0;
}

function sincronizarCategoriasComPricelist(
  categoriasEVF: EVFCategoriaConfig[],
  itensPricelist: any[]
): {
  categorias: EVFCategoriaConfig[];
  sincronizadas: number;
  semMatch: number;
} {
  // Mapa por evf_categoria_codigo (FK explícita — prioridade)
  const mapaFk = new Map<string, { soma: number; count: number }>();
  // Mapa por nome normalizado (fallback)
  const mapaNome = new Map<string, { soma: number; count: number }>();

  for (const item of itensPricelist || []) {
    const valorRef = obterValorReferenciaM2(item);
    if (!valorRef) continue;

    const evfCodigo = item?.categoria?.evf_categoria_codigo;
    if (evfCodigo) {
      // Via FK explícita — confiável para cálculo de valor/m²
      const atual = mapaFk.get(evfCodigo) || { soma: 0, count: 0 };
      atual.soma += valorRef;
      atual.count += 1;
      mapaFk.set(evfCodigo, atual);
    } else {
      // Fallback por nome normalizado (match direto, SEM aliases)
      // Aliases servem para agrupar itens na expansÍo, mas NÍO devem
      // sobrescrever o valor/m² curado da categoria EVF destino.
      const nomeCategoria = item?.categoria?.nome;
      if (!nomeCategoria) continue;
      const sintetico = gerarCodigoSintetico(nomeCategoria);
      if (sintetico && CATEGORIAS_EXCLUIDAS_EVF.has(sintetico)) continue;
      // Pular itens que seriam resolvidos via alias (nÍo contaminam o valor base)
      if (sintetico && PRICELIST_PARA_EVF_ALIASES[sintetico]) continue;
      const chave = normalizarChaveCategoria(nomeCategoria);
      const atual = mapaNome.get(chave) || { soma: 0, count: 0 };
      atual.soma += valorRef;
      atual.count += 1;
      mapaNome.set(chave, atual);
    }
  }

  let sincronizadas = 0;
  let semMatch = 0;

  const categoriasSincronizadas = categoriasEVF.map((categoria) => {
    // Prioridade 1: match por FK
    const dadosFk = mapaFk.get(categoria.codigo);
    // Prioridade 2: fallback por nome
    const dadosNome = mapaNome.get(normalizarChaveCategoria(categoria.nome));
    const dados = dadosFk || dadosNome;

    if (!dados || dados.count === 0) {
      semMatch += 1;
      return categoria;
    }

    const valorMedio = dados.soma / dados.count;
    if (!Number.isFinite(valorMedio) || valorMedio <= 0) {
      semMatch += 1;
      return categoria;
    }

    sincronizadas += 1;
    return {
      ...categoria,
      valor_m2_padrao: Number(valorMedio.toFixed(2)),
    };
  });

  return {
    categorias: categoriasSincronizadas,
    sincronizadas,
    semMatch,
  };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace("#", "").trim();
  if (![3, 6].includes(sanitized.length)) return null;
  const fullHex =
    sanitized.length === 3
      ? sanitized
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      : sanitized;
  const int = Number.parseInt(fullHex, 16);
  if (!Number.isFinite(int)) return null;
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
}

function withAlpha(hex: string, alpha: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

function getTextColorForBackground(hex: string): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#FFFFFF";
  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#111827" : "#FFFFFF";
}

// ============================================================================
// HELPERS: SincronizaçÍo EVF ↔ Pricelist
// ============================================================================

/** Gera um código EVF sintético a partir do nome de uma categoria pricelist.
 *  Remove prefixos numéricos (ex: "001/Arquitetura" → "arquitetura") */
function gerarCodigoSintetico(nome?: string | null): string | null {
  if (!nome) return null;
  // Remover prefixo numérico tipo "001/", "01 - ", "1/"
  const semPrefixo = nome.replace(/^\d{1,3}\s*[/\-]\s*/, "");
  return semPrefixo
    .normalize("NFD")
    .replaceAll(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "_e_")
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "")
    .replace(/^_+|_+$/g, "")        // trim underscores
    .replace(/_+/g, "_");           // colapsar underscores duplos
}

/**
 * Mapa de aliases: categorias do pricelist que devem redirecionar
 * para uma categoria EVF existente (evitando duplicatas).
 * Chave = código sintético LIMPO (sem prefixo numérico), Valor = código EVF destino.
 */
const PRICELIST_PARA_EVF_ALIASES: Record<string, string> = {
  // ── Variações de nome que sÍo a MESMA coisa ──
  infra_ar:                        "ar_condicionado",
  infra_de_ar:                     "ar_condicionado",
  infra_ar_condicionado:           "ar_condicionado",
  infra_de_ar_condicionado:        "ar_condicionado",
  loucas_metais:                   "cubas_loucas_metais",
  loucas_e_metais:                 "cubas_loucas_metais",
  pre_obra:                        "pre_obra_protecoes",
  pre_obra_e_remocoes:             "pre_obra_protecoes",
  remocoes_e_demolicoes:           "demolicoes",
  remocoes_demolicoes:             "demolicoes",
  demolicao:                       "demolicoes",
  material_eletrico_e_hidraulico:  "material_basico",
  material_eletrico_hidraulico:    "material_basico",
  materiais_composicoes:           "material_basico",
  limpeza_pos_obra:                "limpeza",
  aquecedor_a_gas:                 "gas",
  aquecedor_gas:                   "gas",
  // ── Subcategorias de fase (piso/paredes) → categoria principal ──
  pisopreparacao:                  "piso",
  piso_preparacao:                 "piso",
  pisoacabamentos:                 "piso",
  piso_acabamentos:                "piso",
  paredes:                         "alvenaria",
  paredesprepracao:                "alvenaria",
  paredes_preparacao:              "alvenaria",
  paredes_prepracao:               "alvenaria",
  paredesacabamentos:              "acabamentos",
  paredes_acabamentos:             "acabamentos",
  // ── Equipamentos / eletro ──
  eletrodomesticos:                "eletros",
  eletroportateis:                 "eletros",
  // ── Cortinas e Persianas ──
  cortinas:                        "cortinas_persianas",
  persianas:                       "cortinas_persianas",
  cortinas_e_persianas:            "cortinas_persianas",
  // ── Móveis Convencionais ──
  moveis:                          "moveis_convencionais",
  moveis_soltos:                   "moveis_convencionais",
  mobiliario:                      "moveis_convencionais",
};

/**
 * Categorias operacionais/meta do pricelist que NÍO devem aparecer
 * como linhas individuais no EVF (sÍo custos internos, nÍo de obra).
 */
const CATEGORIAS_EXCLUIDAS_EVF = new Set([
  "staff",
  "kick_off",
  "kickoff",
  "mao_obra",
  "mao_de_obra_geral",
  "producao",
  "finalizacao",
  "produtos_importados",
]);

/**
 * Resolve o código EVF final para uma categoria do pricelist.
 * Prioridade: FK explícita → alias → código sintético → null (excluída)
 */
function resolverCodigoEVFParaPricelist(catPL: PricelistCategoria): string | null {
  // 1. FK explícita (campo evf_categoria_codigo no banco)
  if (catPL.evf_categoria_codigo) {
    return catPL.evf_categoria_codigo;
  }

  // 2. Gerar código sintético
  const sintetico = gerarCodigoSintetico(catPL.nome);
  if (!sintetico) return null;

  // 3. Verificar se é excluída
  if (CATEGORIAS_EXCLUIDAS_EVF.has(sintetico)) return null;

  // 4. Verificar alias
  if (PRICELIST_PARA_EVF_ALIASES[sintetico]) {
    return PRICELIST_PARA_EVF_ALIASES[sintetico];
  }

  return sintetico;
}

/** Mapeia tipo do pricelist para tipo do EVF */
function mapearTipoPricelistParaEVF(tipo?: string | null): "servico" | "material" | "mao_de_obra" | "equipamento" {
  if (!tipo) return "servico";
  const t = tipo.toLowerCase();
  if (t === "mao_obra") return "mao_de_obra";
  if (t === "material") return "material";
  if (t === "produto") return "equipamento";
  return "servico";
}

/** Infere a fase EVF (0-7) a partir do tipo da categoria pricelist */
function inferirFaseEVF(tipo?: string | null): { fase: number; fase_nome: string } {
  const t = (tipo || "").toLowerCase();
  if (t === "produto") return { fase: 6, fase_nome: "F6 Equipamentos e Complementos" };
  if (t === "mao_obra") return { fase: 3, fase_nome: "F3 Acabamentos Técnicos" };
  if (t === "material") return { fase: 2, fase_nome: "F2 Infra e Acabamentos Base" };
  return { fase: 3, fase_nome: "F3 Acabamentos Técnicos" };
}

/**
 * Enriquece a lista de categorias EVF adicionando categorias do pricelist
 * que ainda nÍo existem no EVF, e reordena tudo pela sequência numérica
 * do pricelist (campo `ordem`).
 *
 * Regras de deduplicaçÍo:
 * - Categorias com alias conhecido → redirecionadas para EVF existente
 * - Categorias operacionais (staff, kick_off, etc.) → excluídas do EVF
 * - Categorias já mapeadas via FK → nÍo duplicam
 */
function enriquecerCategoriasEVFComPricelist(
  categoriasEVF: EVFCategoriaConfig[],
  categoriasPricelist: PricelistCategoria[],
  itensPricelist: PricelistItemCompleto[],
): EVFCategoriaConfig[] {
  // Conjunto de códigos EVF já existentes
  const codigosExistentes = new Set(categoriasEVF.map((c) => c.codigo));
  // Mapa de código EVF → ordem do pricelist (para reordenaçÍo)
  const ordemPricelist = new Map<string, number>();

  // Primeira passada: registrar ordens e identificar mapeamentos
  for (const catPL of categoriasPricelist) {
    if (!catPL.ativo) continue;
    const codigoEVF = resolverCodigoEVFParaPricelist(catPL);
    if (!codigoEVF) continue; // Excluída

    // Registrar a menor ordem encontrada para cada código EVF
    const ordemAtual = ordemPricelist.get(codigoEVF);
    if (ordemAtual === undefined || catPL.ordem < ordemAtual) {
      ordemPricelist.set(codigoEVF, catPL.ordem);
    }
  }

  // Segunda passada: criar entradas sintéticas para categorias sem match EVF
  const categoriasSinteticas: EVFCategoriaConfig[] = [];
  for (const catPL of categoriasPricelist) {
    if (!catPL.ativo) continue;

    const codigoFinal = resolverCodigoEVFParaPricelist(catPL);
    // Pular: excluída (null) ou já existe no EVF (por código ou por alias)
    if (!codigoFinal || codigosExistentes.has(codigoFinal)) continue;

    // Calcular valor médio por m² dos itens desta categoria
    const itensCategoria = itensPricelist.filter(
      (item: any) => item?.categoria_id === catPL.id || item?.categoria?.id === catPL.id
    );
    let valorM2 = 0;
    if (itensCategoria.length > 0) {
      let somaM2 = 0;
      let countM2 = 0;
      for (const item of itensCategoria) {
        const ref = obterValorReferenciaM2(item);
        if (ref > 0) { somaM2 += ref; countM2++; }
      }
      valorM2 = countM2 > 0 ? Number((somaM2 / countM2).toFixed(2)) : 0;
    }

    const { fase, fase_nome } = inferirFaseEVF(catPL.tipo);

    categoriasSinteticas.push({
      id: `sintetico_${codigoFinal}`,
      codigo: codigoFinal,
      nome: catPL.nome,
      valor_m2_padrao: valorM2,
      icone: null,
      cor: catPL.cor || null,
      ordem: catPL.ordem,
      ativo: true,
      updated_at: catPL.updated_at,
      fase,
      fase_nome,
      tipo: mapearTipoPricelistParaEVF(catPL.tipo),
    });

    codigosExistentes.add(codigoFinal);
  }

  // Combinar e reordenar: usa ordem do pricelist quando disponível, senÍo mantém ordem original
  const todasCategorias = [...categoriasEVF, ...categoriasSinteticas];

  todasCategorias.sort((a, b) => {
    const ordemA = ordemPricelist.get(a.codigo) ?? a.ordem;
    const ordemB = ordemPricelist.get(b.codigo) ?? b.ordem;
    return ordemA - ordemB;
  });

  // Recalcular ordem sequencial (1, 2, 3, ...)
  return todasCategorias.map((cat, idx) => ({
    ...cat,
    ordem: idx + 1,
  }));
}

/**
 * Mescla itens existentes do banco com as categorias enriquecidas:
 * - Preserva valores editados dos itens existentes (valorEstudoReal)
 * - Adiciona categorias novas (do pricelist) que nÍo existiam no estudo
 * - Reordena tudo pela sequência das categorias enriquecidas (pricelist)
 */
function mesclarItensComCategoriasEnriquecidas(
  itensExistentes: EVFItem[],
  categoriasEnriquecidas: EVFCategoriaConfig[],
  metragem: number,
  padrao: PadraoAcabamento,
): EVFItem[] {
  const multiplicador = PADRAO_MULTIPLICADORES[padrao];
  // Mapa de itens existentes por código de categoria
  const mapaExistentes = new Map<string, EVFItem>();
  for (const item of itensExistentes) {
    mapaExistentes.set(item.categoria, item);
  }

  // Para cada categoria enriquecida: usar item existente (preservando valor editado) ou criar novo
  const itensMesclados: EVFItem[] = categoriasEnriquecidas.map((cat, idx) => {
    const existente = mapaExistentes.get(cat.codigo);
    const ordem = idx + 1;

    if (existente) {
      // Preservar valores editados, mas atualizar ordem e recalcular previsÍo
      const valorM2Ajustado = cat.valor_m2_padrao * multiplicador;
      const valorPrevisao = valorM2Ajustado * metragem;
      return {
        ...existente,
        nome: cat.nome, // Atualizar nome caso tenha mudado
        valorM2Base: cat.valor_m2_padrao,
        valorM2Ajustado,
        valorPrevisao,
        valorMinimo: valorPrevisao * 0.85,
        valorMaximo: valorPrevisao * 1.15,
        // Preservar valorEstudoReal se foi editado, senÍo usar nova previsÍo
        valorEstudoReal: existente.valorEstudoReal !== existente.valorPrevisao
          ? existente.valorEstudoReal
          : valorPrevisao,
        ordem,
      };
    }

    // Categoria nova — calcular do zero
    const valorM2Ajustado = cat.valor_m2_padrao * multiplicador;
    const valorPrevisao = valorM2Ajustado * metragem;
    return {
      categoria: cat.codigo,
      nome: cat.nome,
      valorM2Base: cat.valor_m2_padrao,
      valorM2Ajustado,
      valorPrevisao,
      valorMinimo: valorPrevisao * 0.85,
      valorMaximo: valorPrevisao * 1.15,
      valorEstudoReal: valorPrevisao,
      percentualTotal: 0,
      ordem,
    };
  });

  return calcularPercentuais(itensMesclados);
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export default function EVFEditorPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const isEdicao = !!id;

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const isCarregandoInicialRef = useRef(true);
  const skipNextRecalcRef = useRef(false); // Pular próximo recálculo após carregar dados do banco

  // Estados do formulário
  const [titulo, setTitulo] = useState("");
  const [metragem, setMetragem] = useState(0);
  const [padrao, setPadrao] = useState<PadraoAcabamento>("medio_alto");
  const [observacoes, setObservacoes] = useState("");
  const [itens, setItens] = useState<EVFItem[]>([]);

  // Estados auxiliares
  const [categoriasConfig, setCategoriasConfig] = useState<
    EVFCategoriaConfig[]
  >([]);
  const [clientes, setClientes] = useState<Pessoa[]>([]);
  const [clienteId, setClienteId] = useState("");
  const [composicaoTiposPorCategoria, setComposicaoTiposPorCategoria] = useState<
    Record<string, DistribuicaoTiposCategoria>
  >({});
  const [itensPorCategoriaEVF, setItensPorCategoriaEVF] = useState<
    Record<string, PricelistItemCompleto[]>
  >({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );
  const [matchPricelistInfo, setMatchPricelistInfo] = useState<{
    sincronizadas: number;
    semMatch: number;
  }>({ sincronizadas: 0, semMatch: 0 });

  // Carregar dados iniciais
  useEffect(() => {
    isCarregandoInicialRef.current = true; // Resetar flag quando o ID muda
    carregarDadosIniciais();
  }, [id]);

  async function carregarDadosIniciais() {
    if (import.meta.env.DEV) console.log('🚀 Iniciando carregamento - ID:', id, 'isEdicao:', isEdicao);
    try {
      setLoading(true);

      const resumoSync = await sincronizarCategoriasEVFComPricelist();

      // Carregar configuraçÍo de categorias e clientes (incluir concluídos para nÍo perder referência)
      const [categorias, clientesList, itensPricelist, categoriasPricelist] = await Promise.all([
        buscarCategoriasConfig(),
        listarPessoas({ tipo: "CLIENTE", ativo: true, incluirConcluidos: true }),
        listarItens(),
        listarCategorias(),
      ]);
      const categoriasComMatch = sincronizarCategoriasComPricelist(categorias, itensPricelist || []);

      // ── Enriquecer categorias EVF com categorias do pricelist que ainda nÍo existem ──
      const categoriasEnriquecidas = enriquecerCategoriasEVFComPricelist(
        categoriasComMatch.categorias,
        categoriasPricelist || [],
        (itensPricelist || []) as PricelistItemCompleto[],
      );

      setCategoriasConfig(categoriasEnriquecidas);
      setMatchPricelistInfo({
        sincronizadas: Math.max(categoriasComMatch.sincronizadas, resumoSync.sincronizadas || 0),
        semMatch: Math.max(categoriasComMatch.semMatch, resumoSync.sem_match || 0),
      });

      const composicaoPorCategoria = (itensPricelist || []).reduce<Record<string, DistribuicaoTiposCategoria>>(
        (acc, item: any) => {
          const bucket = mapearTipoParaBucket(item?.tipo);
          if (!bucket) return acc;

          // Resolver código EVF com aliases (mesma lógica de deduplicaçÍo)
          let chave = item?.categoria?.evf_categoria_codigo || null;
          if (!chave && item?.categoria?.nome) {
            const sintetico = gerarCodigoSintetico(item.categoria.nome);
            if (sintetico && CATEGORIAS_EXCLUIDAS_EVF.has(sintetico)) return acc;
            chave = (sintetico && PRICELIST_PARA_EVF_ALIASES[sintetico]) || sintetico;
          }
          if (!chave) return acc;

          if (!acc[chave]) {
            acc[chave] = { mdo: 0, material: 0, produto: 0 };
          }

          const pesoPreco = Number(item?.preco);
          const peso = Number.isFinite(pesoPreco) && pesoPreco > 0 ? pesoPreco : 1;
          acc[chave][bucket] += peso;
          return acc;
        },
        {}
      );
      setComposicaoTiposPorCategoria(composicaoPorCategoria);

      // Agrupar itens do pricelist por código EVF resolvido (com aliases e exclusões)
      const mapaItensPorEVF: Record<string, PricelistItemCompleto[]> = {};
      for (const item of (itensPricelist || []) as PricelistItemCompleto[]) {
        const catItem = (item as any)?.categoria;
        // Resolver código EVF usando mesma lógica de deduplicaçÍo
        let chave = catItem?.evf_categoria_codigo || null;
        if (!chave && catItem?.nome) {
          const sintetico = gerarCodigoSintetico(catItem.nome);
          if (sintetico && CATEGORIAS_EXCLUIDAS_EVF.has(sintetico)) continue;
          chave = (sintetico && PRICELIST_PARA_EVF_ALIASES[sintetico]) || sintetico;
        }
        if (!chave) continue;
        if (!mapaItensPorEVF[chave]) {
          mapaItensPorEVF[chave] = [];
        }
        mapaItensPorEVF[chave].push(item);
      }
      setItensPorCategoriaEVF(mapaItensPorEVF);

      // Ordenar clientes alfabeticamente por nome
      const clientesOrdenados = [...clientesList].sort((a, b) =>
        (a.nome || "").localeCompare(b.nome || "", "pt-BR", { sensitivity: "base" })
      );
      setClientes(clientesOrdenados);

      // Se for ediçÍo, carregar estudo existente
      if (id) {
        if (import.meta.env.DEV) console.log('🔍 Buscando estudo com ID:', id);
        const estudoExistente = await buscarEstudo(id);

        if (!estudoExistente) {
          console.error('❌ Estudo nÍo encontrado para ID:', id);
          toast({
            title: "Estudo nÍo encontrado",
            description: "O estudo solicitado nÍo existe ou foi removido.",
            variant: "destructive",
          });
          return;
        }

        if (import.meta.env.DEV) console.log('📊 Estudo carregado:', estudoExistente);
        if (import.meta.env.DEV) console.log('📋 Itens carregados:', estudoExistente.itens?.length || 0, 'itens');
        if (import.meta.env.DEV) console.log('📏 Metragem:', estudoExistente.metragem_total);
        if (import.meta.env.DEV) console.log('🏷️ Título:', estudoExistente.titulo);
        if (import.meta.env.DEV) console.log('👤 Cliente ID:', estudoExistente.cliente_id);

        // IMPORTANTE: Marcar para pular o próximo recálculo ANTES de setar os estados
        skipNextRecalcRef.current = true;

        // Setar todos os estados com os dados carregados do banco
        setTitulo(estudoExistente.titulo || "");
        setClienteId(estudoExistente.cliente_id || "");
        setMetragem(estudoExistente.metragem_total || 0);
        setPadrao(estudoExistente.padrao_acabamento || "medio_alto");
        setObservacoes(estudoExistente.observacoes || "");

        // Mesclar itens do banco com categorias enriquecidas (novas do pricelist + reordenaçÍo)
        if (estudoExistente.itens && estudoExistente.itens.length > 0) {
          const itensMesclados = mesclarItensComCategoriasEnriquecidas(
            estudoExistente.itens,
            categoriasEnriquecidas,
            estudoExistente.metragem_total || 0,
            estudoExistente.padrao_acabamento || "medio_alto",
          );
          if (import.meta.env.DEV) console.log('✅ Mesclados:', itensMesclados.length, 'itens (banco:', estudoExistente.itens.length, '+ novas categorias)');
          setItens(itensMesclados);
        } else {
          if (import.meta.env.DEV) console.log('⚠️ Nenhum item no banco, calculando novos itens');
          const novosItens = calcularItensEVF(
            estudoExistente.metragem_total || 0,
            estudoExistente.padrao_acabamento || "medio_alto",
            categoriasEnriquecidas
          );
          setItens(novosItens.toSorted((a, b) => a.ordem - b.ordem));
        }
      } else {
        // Novo estudo - calcular itens com valores padrÍo (já vem ordenado)
        const novosItens = calcularItensEVF(0, "medio_alto", categoriasEnriquecidas);
        const itensOrdenados = novosItens.toSorted((a, b) => a.ordem - b.ordem);
        setItens(itensOrdenados);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar dados",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      // IMPORTANTE: Marcar que o carregamento inicial foi concluído ANTES de setLoading
      // para evitar que o useEffect de recálculo sobrescreva os itens carregados
      isCarregandoInicialRef.current = false;
      setLoading(false);
    }
  }

  // Recalcular itens quando metragem ou padrÍo mudam (mas nÍo durante carregamento inicial)
  useEffect(() => {
    // NÍo recalcular durante o carregamento inicial para preservar valores do banco
    if (isCarregandoInicialRef.current) {
      if (import.meta.env.DEV) console.log('⏭️ Ignorando - carregamento inicial em andamento');
      return;
    }

    // NÍo recalcular se ainda está carregando
    if (loading) {
      if (import.meta.env.DEV) console.log('⏭️ Ignorando - loading=true');
      return;
    }

    // NÍo recalcular se nÍo há metragem ou categorias
    if (metragem <= 0 || categoriasConfig.length === 0) {
      if (import.meta.env.DEV) console.log('⏭️ Ignorando - metragem ou categorias vazias', { metragem, categoriasCount: categoriasConfig.length });
      return;
    }

    // Pular recálculo se acabamos de carregar dados do banco
    if (skipNextRecalcRef.current) {
      if (import.meta.env.DEV) console.log('⏭️ Pulando recálculo - dados carregados do banco (skipNextRecalcRef=true)');
      skipNextRecalcRef.current = false;
      return;
    }

    if (import.meta.env.DEV) console.log('🔄 Recalculando itens - metragem:', metragem, 'padrao:', padrao);

    const novosItens = calcularItensEVF(metragem, padrao, categoriasConfig);

    // Preservar valores editados manualmente (se existirem)
    const itensAtualizados = novosItens.map((novoItem) => {
      const itemExistente = itens.find(
        (i) => i.categoria === novoItem.categoria
      );
      if (
        itemExistente &&
        itemExistente.valorEstudoReal !== itemExistente.valorPrevisao
      ) {
        return {
          ...novoItem,
          valorEstudoReal: itemExistente.valorEstudoReal,
        };
      }
      return novoItem;
    });

    // Ordenar por ordem sequencial (já reflete a sequência do pricelist)
    const itensOrdenados = itensAtualizados.toSorted((a, b) => {
      return a.ordem - b.ordem || a.nome.localeCompare(b.nome, "pt-BR");
    });
    setItens(calcularPercentuais(itensOrdenados));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metragem, padrao, categoriasConfig]); // Removido 'loading' para evitar recálculo ao carregar dados do banco

  // Atualizar valor de estudo real de um item
  function handleValorEstudoRealChange(categoria: string, valor: number) {
    const novosItens = itens.map((item) =>
      item.categoria === categoria ? { ...item, valorEstudoReal: valor } : item
    );
    setItens(calcularPercentuais(novosItens));
  }

  // Resetar valor para previsÍo
  function handleResetarValor(categoria: string) {
    const novosItens = itens.map((item) =>
      item.categoria === categoria
        ? { ...item, valorEstudoReal: item.valorPrevisao }
        : item
    );
    setItens(calcularPercentuais(novosItens));
  }

  // Salvar estudo
  async function handleSalvar() {
    if (import.meta.env.DEV) console.log('💾 Salvando estudo...', { titulo, clienteId, metragem, padrao, isEdicao, id });

    if (!titulo) {
      toast({
        title: "Erro",
        description: "Informe o título do estudo",
        variant: "destructive",
      });
      return;
    }
    if (!clienteId) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }
    if (metragem <= 0) {
      toast({
        title: "Erro",
        description: "A metragem deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    try {
      setSalvando(true);
      if (import.meta.env.DEV) console.log('💾 Iniciando salvamento no try...');

      if (isEdicao && id) {
        if (import.meta.env.DEV) console.log('💾 Modo ediçÍo - atualizando estudo...');
        await atualizarEstudo(id, {
          titulo,
          cliente_id: clienteId || null,
          metragem_total: metragem,
          padrao_acabamento: padrao,
          observacoes,
        });
        if (import.meta.env.DEV) console.log('💾 atualizarEstudo concluído');

        // Atualizar valores editados
        for (const item of itens) {
          if (item.valorEstudoReal !== item.valorPrevisao) {
            await atualizarItemEstudoReal(
              id,
              item.categoria,
              item.valorEstudoReal
            );
          }
        }
        await recalcularTotais(id);

        toast({
          title: "Estudo atualizado",
          description: "As alterações foram salvas.",
        });
      } else {
        const novoEstudo = await criarEstudo({
          cliente_id: clienteId,
          titulo,
          metragem_total: metragem,
          padrao_acabamento: padrao,
          observacoes,
        });

        toast({
          title: "Estudo criado",
          description: "O estudo foi criado com sucesso.",
        });
        navigate(`/evf/${novoEstudo.id}`);
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

  // Calcular totais
  const totais = useMemo(() => {
    return calcularTotaisEVF(itens, metragem);
  }, [itens, metragem]);

  function resolverCorCategoria(item: EVFItem): string {
    // 1. Cor do categoriasConfig (inclui categorias sintéticas do pricelist)
    const configCat = categoriasConfig.find((c) => c.codigo === item.categoria);
    if (configCat?.cor && configCat.cor !== "#6B7280") {
      return configCat.cor;
    }
    // 2. Cor do pricelist config estático
    const corPricelist = getCorCategoriaPricelist(item.nome);
    if (corPricelist && corPricelist !== "#6B7280") {
      return corPricelist;
    }
    // 3. Fallback EVF config local
    return getCorCategoriaEVF(item.categoria);
  }

  function obterTipoCategoria(item: EVFItem): string | null {
    const config = categoriasConfig.find((c) => c.codigo === item.categoria);
    return config?.tipo || null;
  }

  function obterDistribuicaoSubcategorias(item: EVFItem) {
    const tipoEVF = obterTipoCategoria(item);

    // Se a categoria EVF tem tipo definido, respeitar:
    // - servico: coluna única "Serviço" (100%)
    // - material: coluna única "Material" (100%)
    // - equipamento: coluna única "Equipamento" (100%)
    // - mao_de_obra: MDO + Material Embutido
    if (tipoEVF === "servico") {
      return [{ prefixo: "SRV", nome: "Serviço", percentual: 1 }];
    }
    if (tipoEVF === "material") {
      return [{ prefixo: "MAT", nome: "Material", percentual: 1 }];
    }
    if (tipoEVF === "equipamento") {
      return [{ prefixo: "EQP", nome: "Equipamento", percentual: 1 }];
    }
    if (tipoEVF === "mao_de_obra") {
      // Tentar obter distribuiçÍo real do pricelist
      const chave = item.categoria; // código EVF direto
      const composicao = composicaoTiposPorCategoria[chave]
        || composicaoTiposPorCategoria[normalizarChaveCategoria(item.nome)];

      if (composicao) {
        const somaMdoMat = composicao.mdo + composicao.material + composicao.produto;
        if (somaMdoMat > 0) {
          const distribuicao = [
            { prefixo: "MDO", nome: "MÍo de Obra", percentual: composicao.mdo / somaMdoMat },
            { prefixo: "MAT", nome: "Material Embutido", percentual: (composicao.material + composicao.produto) / somaMdoMat },
          ].filter((sub) => sub.percentual > 0);
          if (distribuicao.length > 0) return distribuicao;
        }
      }
      // Fallback para MDO sem dados de composiçÍo
      return [
        { prefixo: "MDO", nome: "MÍo de Obra", percentual: 0.6 },
        { prefixo: "MAT", nome: "Material Embutido", percentual: 0.4 },
      ];
    }

    // Fallback: sem tipo definido, usar dados do pricelist como antes
    const chave = item.categoria;
    const composicao = composicaoTiposPorCategoria[chave]
      || composicaoTiposPorCategoria[normalizarChaveCategoria(item.nome)];

    if (!composicao) {
      return SUBCATEGORIAS_EVF;
    }

    const soma = composicao.mdo + composicao.material + composicao.produto;
    if (soma <= 0) {
      return SUBCATEGORIAS_EVF;
    }

    const distribuicao = [
      {
        prefixo: "MDO",
        nome: "Serviço/MÍo de Obra",
        percentual: composicao.mdo / soma,
      },
      {
        prefixo: "MAT",
        nome: "Material",
        percentual: composicao.material / soma,
      },
      {
        prefixo: "PRO",
        nome: "Produto",
        percentual: composicao.produto / soma,
      },
    ].filter((sub) => sub.percentual > 0);

    return distribuicao.length > 0 ? distribuicao : SUBCATEGORIAS_EVF;
  }

  function resolverFlowParaCategoria(categoriaEVFCodigo: string): PricelistCategoryFlow | null {
    const flowKey = EVF_CATEGORIA_TO_FLOW[categoriaEVFCodigo];
    if (flowKey && PRICELIST_CATEGORY_FLOWS[flowKey]) {
      return PRICELIST_CATEGORY_FLOWS[flowKey];
    }
    return null;
  }

  const itensOrdenadosExibicao = useMemo(() => {
    return [...itens].sort((a, b) => {
      const ordemA = Number.isFinite(a.ordem) ? a.ordem : Number.MAX_SAFE_INTEGER;
      const ordemB = Number.isFinite(b.ordem) ? b.ordem : Number.MAX_SAFE_INTEGER;
      return ordemA - ordemB || a.nome.localeCompare(b.nome, "pt-BR");
    });
  }, [itens]);

  // Agrupar itens por fase
  const itensPorFase = useMemo<GrupoFaseEVF[]>(() => {
    return agruparItensPorFase(itensOrdenadosExibicao, categoriasConfig);
  }, [itensOrdenadosExibicao, categoriasConfig]);

  // Obter nome do cliente selecionado
  const clienteSelecionado = useMemo(() => {
    if (clienteId) {
      return clientes.find((c) => c.id === clienteId)?.nome;
    }
    return undefined;
  }, [clienteId, clientes]);

  // Exportar para Excel
  function handleExportarExcel() {
    exportarEVFParaExcel({
      titulo,
      cliente: clienteSelecionado,
      metragem,
      padrao,
      valorTotal: totais.valorTotal,
      valorM2Medio: totais.valorM2Medio,
      itens,
      observacoes,
      categoriasConfig,
    });
    toast({
      title: "Exportado",
      description: "Arquivo Excel gerado com sucesso.",
    });
  }

  // Exportar para PDF
  function handleExportarPDF() {
    exportarEVFParaPDF({
      titulo,
      cliente: clienteSelecionado,
      metragem,
      padrao,
      valorTotal: totais.valorTotal,
      valorM2Medio: totais.valorM2Medio,
      itens,
      observacoes,
      categoriasConfig,
    });
    toast({
      title: "Exportado",
      description: "Arquivo PDF gerado com sucesso.",
    });
  }

  function gerarHtmlEVFCliente(): string {
    const dataEmissao = new Date().toLocaleDateString("pt-BR");
    const partesGradiente = dadosGrafico.reduce<string[]>((acc, item, index) => {
      const inicio = dadosGrafico
        .slice(0, index)
        .reduce((sum, atual) => sum + atual.percentual, 0);
      const fim = inicio + item.percentual;
      acc.push(`${item.cor} ${inicio}% ${fim}%`);
      return acc;
    }, []);

    const gradienteConico = partesGradiente.length
      ? `conic-gradient(${partesGradiente.join(", ")})`
      : "conic-gradient(#E5E7EB 0% 100%)";

    const linhasTabela = itensPorFase
      .map((grupo) => {
        const headerFase = `
          <tr>
            <td colspan="6" style="padding:6px 8px;background:${grupo.cor}18;border-bottom:1px solid #E5E7EB;">
              <strong style="font-size:11px;text-transform:uppercase;letter-spacing:0.5px;color:${grupo.cor};">Fase ${grupo.fase} — ${grupo.nome}</strong>
              <span style="float:right;font-size:11px;font-weight:600;color:${grupo.cor};">${formatarMoeda(grupo.subtotal)}</span>
            </td>
          </tr>
        `;
        const linhasItens = grupo.itens
          .map(
            (item, index) => `
              <tr>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:center;color:#6B7280;">${String(item.ordem || index + 1).padStart(2, "0")}</td>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;">
                  <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${resolverCorCategoria(item)};margin-right:8px;"></span>
                  ${item.nome}
                </td>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;">${formatarMoeda(item.valorM2Ajustado)}</td>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;">${formatarMoeda(item.valorPrevisao)}</td>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:right;font-weight:600;">${formatarMoeda(item.valorEstudoReal)}</td>
                <td style="padding:8px;border-bottom:1px solid #E5E7EB;text-align:center;">${formatarNumero(item.percentualTotal, 1)}%</td>
              </tr>
            `
          )
          .join("");
        return headerFase + linhasItens;
      })
      .join("");

    const linhasLegenda = dadosGrafico
      .map(
        (item) => `
          <div style="display:flex;align-items:center;gap:8px;padding:4px 0;">
            <span style="width:10px;height:10px;border-radius:9999px;background:${item.cor};display:inline-block;"></span>
            <span style="font-size:12px;color:#374151;flex:1;">${item.name}</span>
            <strong style="font-size:12px;color:#111827;">${item.percentual.toFixed(1)}%</strong>
          </div>
        `
      )
      .join("");

    return `
      <!doctype html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>${titulo}</title>
      </head>
      <body style="font-family:Arial,Helvetica,sans-serif;background:#F9FAFB;margin:0;padding:24px;color:#111827;">
        <div style="max-width:1080px;margin:0 auto;background:#FFFFFF;border:1px solid #E5E7EB;border-radius:12px;padding:20px;">
          <h1 style="margin:0 0 4px 0;font-size:24px;color:#F25C26;">${titulo}</h1>
          <p style="margin:0 0 16px 0;color:#6B7280;">Estudo de Viabilidade Financeira • Emitido em ${dataEmissao}</p>

          <div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-bottom:16px;">
            <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#6B7280;">Metragem</div>
              <div style="font-size:16px;font-weight:600;">${formatarNumero(metragem)} m²</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#6B7280;">PadrÍo</div>
              <div style="font-size:16px;font-weight:600;">${PADRAO_LABELS[padrao].label}</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#6B7280;">Total Estimado</div>
              <div style="font-size:16px;font-weight:600;">${formatarMoeda(totais.valorTotal)}</div>
            </div>
            <div style="background:#F8FAFC;border:1px solid #E5E7EB;border-radius:8px;padding:10px;">
              <div style="font-size:11px;color:#6B7280;">Valor/m²</div>
              <div style="font-size:16px;font-weight:600;">${formatarMoeda(totais.valorM2Medio)}</div>
            </div>
          </div>

          <div style="display:grid;grid-template-columns:1.7fr 1fr;gap:16px;align-items:start;">
            <div>
              <h2 style="margin:0 0 10px 0;font-size:16px;">Categorias de Investimento</h2>
              <table style="width:100%;border-collapse:collapse;font-size:12px;">
                <thead>
                  <tr style="background:#F3F4F6;">
                    <th style="padding:8px;text-align:center;">#</th>
                    <th style="padding:8px;text-align:left;">Itens</th>
                    <th style="padding:8px;text-align:right;">R$/m²</th>
                    <th style="padding:8px;text-align:right;">PrevisÍo</th>
                    <th style="padding:8px;text-align:right;">Estudo Real</th>
                    <th style="padding:8px;text-align:center;">%</th>
                  </tr>
                </thead>
                <tbody>
                  ${linhasTabela}
                </tbody>
              </table>
            </div>

            <div>
              <h2 style="margin:0 0 10px 0;font-size:16px;">DistribuiçÍo por Categoria</h2>
              <div style="display:flex;justify-content:center;align-items:center;padding:8px 0 12px 0;">
                <div style="width:180px;height:180px;border-radius:50%;background:${gradienteConico};position:relative;"></div>
              </div>
              <div style="border-top:1px solid #E5E7EB;padding-top:8px;">
                ${linhasLegenda}
              </div>
            </div>
          </div>

          <div style="margin-top:20px;border-top:1px solid #E5E7EB;padding-top:12px;display:flex;gap:8px;">
            <a href="mailto:?subject=${encodeURIComponent(`AprovaçÍo EVF - ${titulo}`)}&body=${encodeURIComponent("Aprovado")}" style="text-decoration:none;padding:10px 14px;border-radius:8px;background:#10B981;color:#fff;font-size:12px;">Aprovar</a>
            <a href="mailto:?subject=${encodeURIComponent(`RevisÍo EVF - ${titulo}`)}&body=${encodeURIComponent("Solicitar ajustes")}" style="text-decoration:none;padding:10px 14px;border-radius:8px;background:#F25C26;color:#fff;font-size:12px;">Solicitar Ajustes</a>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async function handleEnviarParaCliente() {
    const cliente = clientes.find((item) => item.id === clienteId);
    if (!isEdicao || !id) {
      toast({
        title: "Salve antes de enviar",
        description: "Salve o EVF para gerar envio com ID definitivo.",
        variant: "destructive",
      });
      return;
    }

    if (!cliente?.email && !cliente?.telefone) {
      toast({
        title: "Contato do cliente ausente",
        description: "Cliente sem e-mail/telefone para envio.",
        variant: "destructive",
      });
      return;
    }

    try {
      const html = gerarHtmlEVFCliente();
      let canalEnvio: "email" | "whatsapp" | "manual" = "manual";
      if (cliente.email) {
        canalEnvio = "email";
      } else if (cliente.telefone) {
        canalEnvio = "whatsapp";
      }
      const { linkPublico } = await gerarLinkPublicoEVF(id, html, canalEnvio);

      if (cliente.email) {
        await fetch(`${BACKEND_URL}/api/email/send`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Internal-Key": INTERNAL_API_KEY,
          },
          body: JSON.stringify({
            to: cliente.email,
            subject: `EVF para aprovaçÍo - ${titulo}`,
            template: "notification",
            data: {
              titulo: "Estudo de Viabilidade para AprovaçÍo",
              mensagem: `
                <p>Olá ${cliente.nome?.split(" ")[0] || "cliente"},</p>
                <p>Segue o EVF <strong>${titulo}</strong> para sua aprovaçÍo.</p>
                <p>Acesse pelo link abaixo para aprovar ou rejeitar o estudo.</p>
              `,
              actionUrl: linkPublico,
              actionText: "Abrir EVF para AprovaçÍo",
            },
          }),
        });
      }

      if (cliente.telefone) {
        const telefoneLimpo = cliente.telefone.replaceAll(/\D/g, "");
        const telefoneComCodigo = telefoneLimpo.startsWith("55")
          ? telefoneLimpo
          : `55${telefoneLimpo}`;
        const mensagem = `Olá ${cliente.nome?.split(" ")[0] || ""}! O EVF "${titulo}" está disponível para aprovaçÍo em: ${linkPublico}`;
        globalThis.open(
          `https://wa.me/${telefoneComCodigo}?text=${encodeURIComponent(mensagem)}`,
          "_blank"
        );
      }

      toast({
        title: "EVF enviado",
        description: "Link público de aprovaçÍo gerado e envio preparado para o cliente.",
      });
    } catch (error: any) {
      toast({
        title: "Falha no envio",
        description: error?.message || "NÍo foi possível enviar o EVF para o cliente.",
        variant: "destructive",
      });
    }
  }

  // Dados para o gráfico pizza
  const dadosGrafico = useMemo(() => {
    return itensOrdenadosExibicao
      .filter((item) => item.valorEstudoReal > 0)
      .map((item) => ({
        name: item.nome,
        value: item.valorEstudoReal,
        percentual: item.percentualTotal,
        cor: resolverCorCategoria(item),
      }));
  }, [itensOrdenadosExibicao]);

  // Loading
  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className={`${TYPOGRAPHY.iconLarge} text-wg-primary animate-spin mx-auto mb-4`} />
          <p className={TYPOGRAPHY.bodyMedium}>Carregando estudo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/evf")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wg-primary/10 rounded-lg">
                <Calculator className="w-6 h-6 text-wg-primary" />
              </div>
              <div>
                <h1 className={TYPOGRAPHY.pageTitle}>
                  {isEdicao ? "Editar Estudo" : "Novo Estudo de Viabilidade"}
                </h1>
                <p className={TYPOGRAPHY.pageSubtitle}>
                  Estimativa de investimento baseada em metragem e padrÍo
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportarExcel}
              disabled={!titulo || metragem <= 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Excel
            </Button>
            <Button
              variant="outline"
              onClick={handleExportarPDF}
              disabled={!titulo || metragem <= 0}
            >
              <FileText className="w-4 h-4 mr-2" />
              PDF
            </Button>
            <Button
              variant="outline"
              onClick={handleEnviarParaCliente}
              disabled={!id || !clienteId}
            >
              <Mail className="w-4 h-4 mr-2" />
              Enviar Cliente
            </Button>
            <Button
              onClick={handleSalvar}
              disabled={salvando}
              className="bg-wg-primary hover:bg-wg-primary/90"
            >
              {salvando ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Salvar
            </Button>
          </div>
        </div>

        {/* Cards de Resumo - Compacto */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-blue-500">
            <div className="flex items-center gap-2">
              <Ruler className={`${TYPOGRAPHY.iconLarge} text-blue-500`} />
              <div>
                <p className={TYPOGRAPHY.statLabel}>Metragem</p>
                <p className={TYPOGRAPHY.statNumber}>
                  {formatarNumero(metragem)} m²
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-purple-500">
            <div className="flex items-center gap-2">
              <Home className={`${TYPOGRAPHY.iconLarge} text-purple-500`} />
              <div>
                <p className={TYPOGRAPHY.statLabel}>PadrÍo</p>
                <p className={TYPOGRAPHY.statNumber}>
                  {PADRAO_LABELS[padrao]?.label}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-green-500">
            <div className="flex items-center gap-2">
              <TrendingUp className={`${TYPOGRAPHY.iconLarge} text-green-500`} />
              <div>
                <p className={TYPOGRAPHY.statLabel}>Total Estimado</p>
                <p className={TYPOGRAPHY.moneyLarge}>
                  {formatarMoeda(totais.valorTotal)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-3 border-l-4 border-orange-500">
            <div className="flex items-center gap-2">
              <DollarSign className={`${TYPOGRAPHY.iconLarge} text-orange-500`} />
              <div>
                <p className={TYPOGRAPHY.statLabel}>Valor/m²</p>
                <p className={TYPOGRAPHY.statNumber}>
                  {formatarMoeda(totais.valorM2Medio)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Formulário Completo - Todos os campos em uma linha */}
        <div className="bg-white rounded-lg shadow-sm p-3 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {/* Cliente - Campo obrigatório principal */}
            <div>
              <Label className={TYPOGRAPHY.formLabel}>Cliente *</Label>
              <Select
                value={clienteId || "none"}
                onValueChange={(val) => setClienteId(val === "none" ? "" : val)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Selecione...</SelectItem>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{cliente.nome}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Título */}
            <div>
              <Label htmlFor="titulo" className={TYPOGRAPHY.formLabel}>Título do Estudo *</Label>
              <Input
                id="titulo"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                placeholder="Ex: EVF - Apartamento"
                className="mt-1"
              />
            </div>

            {/* Metragem */}
            <div>
              <Label htmlFor="metragem" className={TYPOGRAPHY.formLabel}>Metragem (m²) *</Label>
              <Input
                id="metragem"
                type="number"
                value={metragem}
                onChange={(e) => setMetragem(Number.parseFloat(e.target.value) || 0)}
                className="mt-1"
                step="0.01"
              />
            </div>

            {/* PadrÍo de Acabamento */}
            <div>
              <Label className={TYPOGRAPHY.formLabel}>PadrÍo de Acabamento</Label>
              <div className="flex gap-1 mt-1">
                {(
                  ["economico", "medio_alto", "alto_luxo"] as PadraoAcabamento[]
                ).map((p) => (
                  <TooltipProvider key={p}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          type="button"
                          size="sm"
                          variant={padrao === p ? "default" : "outline"}
                          className={`flex-1 text-xs px-2 ${
                            padrao === p ? "bg-wg-primary" : ""
                          }`}
                          onClick={() => setPadrao(p)}
                        >
                          {PADRAO_LABELS[p].label.split("/")[0]}
                          <span className="ml-1 opacity-70">
                            {PADRAO_MULTIPLICADORES[p]}x
                          </span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{PADRAO_LABELS[p].descricao}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Categorias + Gráfico */}
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.7fr)_minmax(340px,1fr)] gap-5 mb-5">
          {/* Tabela */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
              <h2 className={TYPOGRAPHY.sectionTitle}>
                Categorias de Investimento
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                OrganizaçÍo por ordem cronológica e análise de variaçÍo
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Match Pricelist: {matchPricelistInfo.sincronizadas} categorias sincronizadas
                {matchPricelistInfo.semMatch > 0
                  ? ` • ${matchPricelistInfo.semMatch} sem correspondência`
                  : ""}
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50/90 border-b border-slate-200">
                  <tr>
                    <th className={`px-2 py-2 text-left ${TYPOGRAPHY.tableHeader}`}>
                      Itens
                    </th>
                    <th className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableHeader}`}>
                      R$/m²
                    </th>
                    <th className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableHeader}`}>
                      PrevisÍo
                    </th>
                    <th className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableHeader}`}>
                      VariaçÍo ±15%
                    </th>
                    <th className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableHeader}`}>
                      Estudo Real
                    </th>
                    <th className={`px-2 py-2 text-center ${TYPOGRAPHY.tableHeader}`}>
                      %
                    </th>
                    <th className="px-1 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itensPorFase.map((grupo) => (
                    <React.Fragment key={`fase-${grupo.fase}`}>
                      {/* Header da Fase */}
                      <tr
                        style={{ backgroundColor: `${grupo.cor}18` }}
                        className="border-b border-slate-200"
                      >
                        <td colSpan={5} className="px-3 py-1.5">
                          <span
                            className="text-[11px] font-semibold uppercase tracking-wide"
                            style={{ color: grupo.cor }}
                          >
                            Fase {grupo.fase} — {grupo.nome}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right" colSpan={2}>
                          <span
                            className="text-[11px] font-semibold"
                            style={{ color: grupo.cor }}
                          >
                            {formatarMoeda(grupo.subtotal)}
                          </span>
                        </td>
                      </tr>
                      {/* Itens da fase */}
                      {grupo.itens.map((item) => {
                        const dentroVariacao =
                          item.valorEstudoReal >= item.valorMinimo &&
                          item.valorEstudoReal <= item.valorMaximo;
                        const editado = item.valorEstudoReal !== item.valorPrevisao;
                        const isExpanded = expandedCategories.has(item.categoria);
                        let classeInputValor = "";
                        if (dentroVariacao) {
                          if (editado) {
                            classeInputValor = "border-blue-300 bg-blue-50";
                          }
                        } else {
                          classeInputValor = "border-red-300 bg-red-50";
                        }
                        return (
                          <React.Fragment key={item.categoria}>
                            <tr
                              className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                              onClick={() => {
                                const newExpanded = new Set(expandedCategories);
                                if (isExpanded) {
                                  newExpanded.delete(item.categoria);
                                } else {
                                  newExpanded.add(item.categoria);
                                }
                                setExpandedCategories(newExpanded);
                              }}
                            >
                              <td className="px-2 py-2">
                                <div className="flex items-center gap-2">
                                  {isExpanded ? (
                                    <ChevronDown className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  ) : (
                                    <ChevronRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                                  )}
                                  <div
                                    className="w-6 h-6 rounded flex items-center justify-center text-[12px] font-normal flex-shrink-0"
                                    style={{
                                      backgroundColor: resolverCorCategoria(item),
                                      color: getTextColorForBackground(resolverCorCategoria(item)),
                                    }}
                                  >
                                    {String(item.ordem).padStart(2, "0")}
                                  </div>
                                  <span className={`font-normal text-gray-900 truncate ${TYPOGRAPHY.tableCell}`}>
                                    {item.nome}
                                  </span>
                                  {(() => {
                                    const tipo = obterTipoCategoria(item);
                                    if (!tipo) return null;
                                    const badges: Record<string, { label: string; cor: string; bg: string }> = {
                                      servico: { label: "SRV", cor: "#2563EB", bg: "#DBEAFE" },
                                      mao_de_obra: { label: "MDO", cor: "#16A34A", bg: "#DCFCE7" },
                                      material: { label: "MAT", cor: "#D97706", bg: "#FEF3C7" },
                                      equipamento: { label: "EQP", cor: "#7C3AED", bg: "#EDE9FE" },
                                    };
                                    const badge = badges[tipo];
                                    if (!badge) return null;
                                    return (
                                      <span
                                        className="text-[8px] font-bold px-1 py-0.5 rounded ml-1 flex-shrink-0"
                                        style={{ backgroundColor: badge.bg, color: badge.cor }}
                                      >
                                        {badge.label}
                                      </span>
                                    );
                                  })()}
                                </div>
                              </td>
                              <td className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableCell}`}>
                                {formatarMoeda(item.valorM2Ajustado)}
                              </td>
                              <td className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableCell}`}>
                                {formatarMoeda(item.valorPrevisao)}
                              </td>
                              <td className={`px-2 py-2 text-right whitespace-nowrap ${TYPOGRAPHY.tableCellSmall}`}>
                                {formatarMoeda(item.valorMinimo)} -{" "}
                                {formatarMoeda(item.valorMaximo)}
                              </td>
                              <td
                                className="px-2 py-2 text-right"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {isExpanded ? (
                                  <Input
                                    type="number"
                                    value={item.valorEstudoReal}
                                    onChange={(e) =>
                                      handleValorEstudoRealChange(
                                        item.categoria,
                                        Number.parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className={`w-28 text-right text-[11px] sm:text-[12px] ${classeInputValor}`}
                                    step="0.01"
                                  />
                                ) : (
                                  <span className="text-[11px] sm:text-[12px]">{formatarMoeda(item.valorEstudoReal)}</span>
                                )}
                              </td>
                              <td className="px-2 py-2 text-center text-gray-600 whitespace-nowrap text-[11px] sm:text-[12px]">
                                {formatarNumero(item.percentualTotal, 1)}%
                              </td>
                              <td
                                className="px-1 py-2 text-center"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {editado && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResetarValor(item.categoria)}
                                    title="Resetar para previsÍo"
                                  >
                                    <RefreshCw className="w-3 h-3" />
                                  </Button>
                                )}
                              </td>
                            </tr>
                            {/* Linha expandida — itens reais do pricelist */}
                            {isExpanded && (
                              <tr
                                key={`${item.categoria}-detail`}
                                className="bg-gray-50/70"
                              >
                                <td colSpan={7} className="p-0">
                                  <EVFCategoriaExpandida
                                    categoriaEVF={item.categoria}
                                    categoriaNome={item.nome}
                                    itensPricelist={itensPorCategoriaEVF[item.categoria] || []}
                                    flow={resolverFlowParaCategoria(item.categoria)}
                                    valorTotal={item.valorEstudoReal}
                                    corCategoria={resolverCorCategoria(item)}
                                  />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
                <tfoot className="bg-gray-100 font-normal">
                  <tr>
                    <td className={`px-2 py-2 text-gray-900 ${TYPOGRAPHY.tableCell}`}>TOTAL</td>
                    <td className={`px-2 py-2 text-right text-gray-600 whitespace-nowrap ${TYPOGRAPHY.tableCell}`}>
                      {formatarMoeda(totais.valorM2Medio)}
                    </td>
                    <td className={`px-2 py-2 text-right text-gray-600 whitespace-nowrap ${TYPOGRAPHY.tableCell}`}>
                      {formatarMoeda(totais.valorPrevisaoTotal)}
                    </td>
                    <td className={`px-2 py-2 text-right text-gray-500 whitespace-nowrap ${TYPOGRAPHY.tableCell}`}>
                      {formatarMoeda(totais.valorMinimoTotal)} -{" "}
                      {formatarMoeda(totais.valorMaximoTotal)}
                    </td>
                    <td className={`px-2 py-2 text-right font-normal whitespace-nowrap ${TYPOGRAPHY.moneyMedium}`}>
                      {formatarMoeda(totais.valorTotal)}
                    </td>
                    <td className={`px-2 py-2 text-center ${TYPOGRAPHY.tableCell}`}>100%</td>
                    <td className="px-1"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Gráfico Pizza */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4">
            <h2 className={`${TYPOGRAPHY.sectionTitle} mb-1`}>
              DistribuiçÍo por Categoria
            </h2>
            <p className="text-[11px] text-slate-500 mb-3">
              Leitura visual da participaçÍo de cada categoria no total
            </p>
            <div className="h-[340px] rounded-xl border border-slate-100 bg-gradient-to-b from-slate-50/60 to-white p-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosGrafico}
                    cx="50%"
                    cy="50%"
                    innerRadius={72}
                    outerRadius={126}
                    paddingAngle={2}
                    dataKey="value"
                    isAnimationActive={true}
                    animationBegin={120}
                    animationDuration={1100}
                    animationEasing="ease-out"
                    label={({ name, percentual }) =>
                      percentual > 5 ? `${percentual.toFixed(1)}%` : ""
                    }
                    labelLine={false}
                  >
                    {dadosGrafico.map((entry) => (
                      <Cell key={entry.name} fill={entry.cor} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    formatter={(value: number, name: string) => [
                      formatarMoeda(value),
                      name,
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 border-t border-slate-200 pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-3 gap-y-1.5 max-h-[180px] overflow-y-auto pr-1">
              {dadosGrafico.map((item) => (
                <div key={item.name} className="flex items-center gap-2 text-[11px] rounded-md px-2 py-1 bg-slate-50/80">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.cor }} />
                  <span className="truncate text-slate-600 flex-1">{item.name}</span>
                  <span className="font-normal text-slate-800">{item.percentual.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      {/* Observações */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <Label htmlFor="observacoes" className={TYPOGRAPHY.formLabel}>Observações</Label>
        <Textarea
          id="observacoes"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Notas adicionais sobre o estudo..."
          className={`mt-1 ${TYPOGRAPHY.bodySmall}`}
          rows={3}
        />
      </div>
    </div>
  );
}

