/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: EmissÍo de Proposta Comercial
// Sistema WGEasy - Grupo WG Almeida
// Design: Apple + WG | Layout: 3 Colunas Profissionais
// ============================================================

import React, { useState, useEffect, useMemo, type KeyboardEvent } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import Badge from "@/components/ui/badge";
import { useConfiguracoesPagamento } from "@/hooks/useConfiguracoesPagamento";
import {
  Eye,
  FileText,
  Mail,
  MessageCircle,
  Cloud,
  ChevronLeft,
  Save,
  FileCheck,
  Loader2,
} from "lucide-react";
import EmptyState from "@/components/ui/EmptyState";
import Loading from "@/components/ui/Loading";
import {
  criarProposta,
  buscarProposta,
  atualizarProposta,
  type PropostaItemInput,
} from "@/lib/propostasApi";
import {
  getNucleoLabel,
  getNucleoColor,
  getCorProdutos,
  type Nucleo,
  type NucleoItem,
} from "@/types/propostas";
import { listarItens as listarItensPricelist } from "@/lib/pricelistApi";
import { listarNucleos } from "@/lib/nucleosApi";
import {
  listarAmbientesPorProposta,
  criarAmbientesEmLote,
  deletarAmbientesPorProposta,
  deletarAmbiente,
  type Ambiente as AmbienteAPI,
  type AmbienteInput,
} from "@/lib/ambientesApi";
import {
  analisarProjetoComIA,
  processarArquivoProjeto,
  validarConfiguracaoIA,
  type ProjetoAnalisado,
  type AmbienteExtraido,
} from "@/lib/projetoAnaliseAI";
import ItemMatcher from "@/components/propostas/ItemMatcher";
import SeletorDadosCliente, { type DadosImportados } from "@/components/propostas/SeletorDadosCliente";
import {
  buscarAnalise,
  listarServicosSelecionados,
  marcarServicosComoImportados,
  vincularAnaliseAProposta,
} from "@/lib/analiseProjetoApi";
import { buscarQuantitativoProjetoCompleto } from "@/services/quantitativosApi";
import { gerarPropostaPDF, type DadosBancariosNucleo } from "@/lib/propostaPdfUtils";
import type { PropostaCompleta, PropostaItem as PropostaItemType } from "@/types/propostas";
import type { ItemPriceList } from "@/types/pricelist";
import { useToast } from "@/components/ui/use-toast";

// ============================================================
// TIPOS
// ============================================================

interface Cliente {
  id: string;
  nome: string;
  cpf: string;
  email: string;
  telefone: string;
  status: "novo" | "em_obra" | "recorrente";
  avatar_url?: string;
}

interface Ambiente {
  id: string;
  nome: string;
  largura: number;
  comprimento: number;
  pe_direito: number;
  area_piso: number;
  area_parede: number;
  area_teto: number;
  perimetro: number;
}

// ItemPriceList defined in src/types/pricelist.ts


interface ItemProposta {
  id: string;
  item: ItemPriceList;
  ambiente_id?: string; // Mantido para compatibilidade
  ambientes_ids?: string[]; // Novo: múltiplos ambientes
  quantidade: number;
  valor_unitario: number;
  descricao_customizada?: string;
}

interface CondicoesComerciais {
  forma_pagamento: string;
  percentual_entrada: number;
  numero_parcelas: number;
  validade_dias: number;
  prazo_execucao_dias: number;
  pagamento_cartao: boolean; // Se true, aplica taxa de cartÍo
}

// Taxas de cartÍo por número de parcelas (da precificaçÍo)
const TAXAS_CARTAO: Record<number, number> = {
  1: 3.15,   // Crédito à vista
  2: 5.39,
  3: 6.12,
  4: 6.85,
  5: 7.57,
  6: 8.28,
  7: 8.99,
  8: 9.69,
  9: 10.38,
  10: 11.06,
  11: 11.74,
  12: 12.40,
};

// Retorna a taxa de cartÍo para o número de parcelas
function getTaxaCartao(parcelas: number): number {
  if (parcelas <= 1) return TAXAS_CARTAO[1];
  if (parcelas >= 12) return TAXAS_CARTAO[12];
  return TAXAS_CARTAO[parcelas] || TAXAS_CARTAO[12];
}

// ============================================================
// COMPONENTES AUXILIARES
// ============================================================

function getEtiquetaNucleoLabel(nucleo?: string): string {
  if (!nucleo) return "Sem núcleo";
  if (nucleo === "produtos") return "Produtos";
  if (nucleo === "arquitetura" || nucleo === "engenharia" || nucleo === "marcenaria") {
    return getNucleoLabel(nucleo as Nucleo);
  }
  return nucleo;
}

function getEtiquetaNucleoColor(nucleo?: string): string {
  if (!nucleo) return "#6B7280"; // gray-500
  if (nucleo === "produtos") return getCorProdutos();
  if (nucleo === "arquitetura" || nucleo === "engenharia" || nucleo === "marcenaria") {
    return getNucleoColor(nucleo as Nucleo);
  }
  return "#6B7280";
}

function normalizarNucleoItem(nome?: string | null): NucleoItem | undefined {
  if (!nome) return undefined;
  const v = nome.toLowerCase();
  if (v.startsWith("arq")) return "arquitetura";
  if (v.startsWith("eng")) return "engenharia";
  if (v.startsWith("mar")) return "marcenaria";
  if (v.startsWith("prod")) return "produtos";
  if (v.startsWith("mat")) return "produtos"; // Materiais/Geral tratados junto com Produtos
  if (
    v === "arquitetura" ||
    v === "engenharia" ||
    v === "marcenaria" ||
    v === "produtos"
  ) {
    return v as NucleoItem;
  }
  return undefined;
}

function normalizarCategoria(valor?: string | null): string {
  if (!valor) return "";
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizarUnidadePersistencia(unidade?: string | null): string {
  const valor = (unidade || "un").trim().toLowerCase();
  if (valor === "m²") return "m2";
  return valor;
}

interface ItemCardProps {
  item: ItemPriceList;
  ambientes: Ambiente[];
  onAdicionar: (item: ItemPriceList, ambienteId?: string) => void;
  onComparar: (item: ItemPriceList) => void;
}

function ItemCard({ item, ambientes, onAdicionar, onComparar }: ItemCardProps) {
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string>("");
  const [mostrarSeletorAmbiente, setMostrarSeletorAmbiente] = useState(false);

  function handleAdicionar() {
    if (ambientes.length > 0 && !ambienteSelecionado && (item.unidade === "m2" || item.unidade === "ml")) {
      setMostrarSeletorAmbiente(true);
      return;
    }

    onAdicionar(item, ambienteSelecionado || undefined);
    setAmbienteSelecionado("");
    setMostrarSeletorAmbiente(false);
  }

  return (
    <div className="p-3 border border-gray-200 rounded-lg hover:border-[#F25C26] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <p className="font-normal text-sm text-gray-900">{item.nome}</p>
          <p className="text-xs text-gray-600 mt-1">{item.descricao}</p>
          {item.categoria && (
            <Badge variant="default" size="sm" className="mt-1">
              {item.categoria}
            </Badge>
          )}
        </div>
      </div>

      {mostrarSeletorAmbiente && (
        <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
          <label htmlFor={`ambiente-${item.id}`} className="block text-xs font-medium text-blue-900 mb-1">
            Selecione o ambiente para aplicar metragem:
          </label>
          <select
            id={`ambiente-${item.id}`}
            value={ambienteSelecionado}
            onChange={(e) => setAmbienteSelecionado(e.target.value)}
            className="w-full px-2 py-1 border border-blue-300 rounded text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Selecionar ambiente"
          >
            <option value="">Sem ambiente (quantidade manual)</option>
            {ambientes.map((amb) => (
              <option key={amb.id} value={amb.id}>
                {amb.nome} - {item.unidade === "m2" ? `${amb.area_piso.toFixed(2)}m²` : `${amb.perimetro.toFixed(2)}ml`}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {(() => {
          const tipo = item.tipo;
          let label = "";
          let variant: any = "default";

          if (tipo === "material") {
            label = "Material";
            variant = "info";
          } else if (tipo === "mao_obra") {
            label = "MÆo de obra";
            variant = "success";
          } else if (tipo === "servico") {
            label = "Servi‡o";
            variant = "warning";
          } else if (tipo === "produto") {
            label = "Produto";
            variant = "primary";
          } else if (tipo === "ambos") {
            label = "Ambos";
            variant = "info";
          } else {
            label = tipo;
          }

          return (
            <Badge variant={variant} size="sm">
              {label}
            </Badge>
          );
        })()}
          <span className="text-sm font-normal text-gray-900">
            {formatarMoeda(item.preco)}/{item.unidade}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onComparar(item)}
            className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50"
            title="Comparar preços"
            aria-label="Comparar preços"
          >
            🔍
          </button>
          <button
            type="button"
            onClick={handleAdicionar}
            className="px-3 py-1 bg-primary text-white rounded-lg hover:bg-primary/90 text-xs font-medium"
          >
            {mostrarSeletorAmbiente ? "Confirmar" : "+ Adicionar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PropostaEmissaoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();

  // Taxas de cartÍo do Supabase (substitui as constantes hardcoded)
  const { toast } = useToast();
  const { getTaxaCartao: getTaxaCartaoSupabase } = useConfiguracoesPagamento();
  // Wrapper local que usa Supabase com fallback para constante hardcoded
  function getTaxaCartaoAtual(parcelas: number): number {
    const taxa = getTaxaCartaoSupabase(parcelas);
    return taxa > 0 ? taxa : getTaxaCartao(parcelas);
  }

  // Ler parâmetros da URL
  const oportunidadeId = searchParams.get("oportunidade_id");
  const clienteIdParam = searchParams.get("cliente_id");
  const isVisualizacao = window.location.pathname.includes("/visualizar");
  const isEdicao = window.location.pathname.includes("/editar") || Boolean(id);

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [ambientes, setAmbientes] = useState<Ambiente[]>([]);
  const [itensPriceList, setItensPriceList] = useState<ItemPriceList[]>([]);
  const [itensProposta, setItensProposta] = useState<ItemProposta[]>([]);
  const [condicoesComerciais, setCondicoesComerciais] = useState<CondicoesComerciais>({
    forma_pagamento: "parcelado",
    percentual_entrada: 30,
    numero_parcelas: 3,
    validade_dias: 30,
    prazo_execucao_dias: 60,
    pagamento_cartao: false, // Por padrÍo nÍo aplica taxa de cartÍo
  });

  // Estados de UI
  const [exibirValoresNaProposta, setExibirValoresNaProposta] = useState(true);
  const [viewMode, setViewMode] = useState<"blocos" | "lista">("blocos");
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null);
  const [buscaGlobal, setBuscaGlobal] = useState("");
  const [filtroCategoria, setFiltroCategoria] = useState<string | null>(null);
  const [filtroCategoriaPricelist, setFiltroCategoriaPricelist] = useState<string | null>(null);
  const [filtroSubcategoria, setFiltroSubcategoria] = useState<string | null>(null);
  const [filtroAmbienteCatalogo, setFiltroAmbienteCatalogo] = useState<string | null>(null);
  const [mostrarComparador, setMostrarComparador] = useState(false);
  const [itemComparador, setItemComparador] = useState<ItemPriceList | null>(null);
  const [ambienteIASelecionado, setAmbienteIASelecionado] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [propostaId, setPropostaId] = useState<string | null>(null);
  const [mostrarInformacoesInternas, setMostrarInformacoesInternas] = useState(false);
  const [quantidadesEditando, setQuantidadesEditando] = useState<{[key: string]: string}>({});

  // Estados para filtros da lista de itens da proposta
  const [filtroAmbienteProposta, setFiltroAmbienteProposta] = useState<string | null>(null);
  const [filtroAtividadeProposta, setFiltroAtividadeProposta] = useState<string | null>(null);
  const [buscaItensProposta, setBuscaItensProposta] = useState<string>("");

  // Estados para ajuste automático de valor
  const [mostrarAjusteValor, setMostrarAjusteValor] = useState(false);
  const [valorAlvo, setValorAlvo] = useState("");

  // Estados para adicionar/editar ambiente
  const [mostrarModalAmbiente, setMostrarModalAmbiente] = useState(false);
  const [editandoAmbiente, setEditandoAmbiente] = useState<string | null>(null);
const [novoAmbiente, setNovoAmbiente] = useState({
    nome: "",
    largura: 0,
    comprimento: 0,
    pe_direito: 2.7,
    area: 0,
  });
  const [novoAmbienteCampos, setNovoAmbienteCampos] = useState({
    largura: "",
    comprimento: "",
    area: "",
  });

  // Estados para importar ambientes via arquivo (PDF/imagem)
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [arquivoImportar, setArquivoImportar] = useState<File | null>(null);
  const [previewArquivo, setPreviewArquivo] = useState<string>("");
  const [importando, setImportando] = useState(false);
  const [progressoAnalise, setProgressoAnalise] = useState(0);
  const [ambientesExtraidos, setAmbientesExtraidos] = useState<AmbienteExtraido[]>([]);
  const [mostrarResultadoIA, setMostrarResultadoIA] = useState(false);

  // Estados para importar Plano de Reforma
  const [mostrarModalPlanoReforma, setMostrarModalPlanoReforma] = useState(false);
  const [arquivoPlanoReforma, setArquivoPlanoReforma] = useState<File | null>(null);
  const [previewPlanoReforma, setPreviewPlanoReforma] = useState<string>("");
  const [importandoPlano, setImportandoPlano] = useState(false);
  const [progressoPlano, setProgressoPlano] = useState(0);
  const [itensPlanoExtraidos, setItensPlanoExtraidos] = useState<Array<{
    ambiente: string;
    atividade: string;
    descricao: string;
    itemSugerido?: ItemPriceList;
  }>>([]);
  const [mostrarResultadoPlano, setMostrarResultadoPlano] = useState(false);
  const [salvandoNoDrive, setSalvandoNoDrive] = useState(false);
  // Modo texto para colar plano de reforma
  const [modoTextoPlano, setModoTextoPlano] = useState(false);
  const [textoPlanoReforma, setTextoPlanoReforma] = useState("");

  // ============================================================
  // ESTADOS PARA IMPORTAR CONTRATO COMPLETO
  // ============================================================
  const [mostrarModalImportarContrato, setMostrarModalImportarContrato] = useState(false);
  const [arquivoContrato, setArquivoContrato] = useState<File | null>(null);
  const [previewContrato, setPreviewContrato] = useState<string>("");
  const [textoContrato, setTextoContrato] = useState("");
  const [modoTextoContrato, setModoTextoContrato] = useState(false);
  const [importandoContrato, setImportandoContrato] = useState(false);
  const [progressoContrato, setProgressoContrato] = useState(0);
  const [mostrarResultadoContrato, setMostrarResultadoContrato] = useState(false);
  const [dadosContratoExtraidos, setDadosContratoExtraidos] = useState<{
    cliente?: { nome?: string; cpf?: string; email?: string; telefone?: string; endereco?: string };
    projeto?: { nome?: string; endereco?: string; descricao?: string };
    itens: Array<{ ambiente: string; atividade: string; descricao: string; quantidade?: number; valor?: number; unidade?: string; itemSugerido?: ItemPriceList }>;
    pagamento?: { forma?: string; entrada_percentual?: number; parcelas?: number; valor_total?: number; datas_parcelas?: string[] };
    cronograma?: { prazo_dias?: number; data_inicio?: string; data_termino?: string; etapas?: Array<{ nome: string; duracao_dias: number; ordem: number }> };
    observacoes?: string[];
  } | null>(null);

  // Estados para adicionar novo item ao pricelist
  const [mostrarModalNovoItem, setMostrarModalNovoItem] = useState(false);
  const [salvandoNovoItem, setSalvandoNovoItem] = useState(false);
  const [nucleosDisponiveis, setNucleosDisponiveis] = useState<any[]>([]);
  const [novoItem, setNovoItem] = useState({
    nome: "",
    descricao: "",
    nucleo_id: "",
    tipo: "material" as "material" | "mao_obra" | "servico" | "produto",
    categoria: "",
    unidade: "un" as "m2" | "ml" | "un" | "diaria" | "hora" | "empreita",
    preco: 0,
  });

  // Estados para busca de clientes
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [mostrarResultadosBusca, setMostrarResultadosBusca] = useState(false);

  // Estados para seletor de dados do cliente (análises e quantitativos)
  const [mostrarSeletorDados, setMostrarSeletorDados] = useState(false);
  const [clienteParaSeletor, setClienteParaSeletor] = useState<Cliente | null>(null);
  const [analiseVinculadaId, setAnaliseVinculadaId] = useState<string | null>(null);
  const [quantitativoVinculadoId, setQuantitativoVinculadoId] = useState<string | null>(null);
  const [importandoDados, setImportandoDados] = useState(false);

  // Categorias do sistema (carregadas do banco dinamicamente)
  const [categorias, setCategorias] = useState<string[]>([]);
  // Categorias principais do pricelist (para filtro de atividades)
  const [categoriasPricelist, setCategoriasPricelist] = useState<{id: string; nome: string; codigo: string | null}[]>([]);
  // Mapa de categoria_id -> nome para exibiçÍo no filtro
  const categoriaIdParaNome = useMemo(() => {
    const mapa: Record<string, string> = {};
    categoriasPricelist.forEach(cat => {
      mapa[cat.id] = cat.codigo ? `${cat.codigo}-${cat.nome}` : cat.nome;
    });
    return mapa;
  }, [categoriasPricelist]);
  const categoriasVisiveis = useMemo(() => {
    if (!filtroCategoriaPricelist) return categorias;
    if (categorias.includes(filtroCategoriaPricelist)) {
      return [filtroCategoriaPricelist];
    }
    return [];
  }, [categorias, filtroCategoriaPricelist]);

  const resolverCategoriaPadrao = (item: ItemPriceList): string | undefined => {
    if (item.categoria && item.categoria.trim()) return item.categoria;
    if (item.nucleo !== "marcenaria") return item.categoria;

    const categoriaMarcenaria = categorias.find((cat) =>
      normalizarCategoria(cat).includes("marcenaria")
    );
    return categoriaMarcenaria || "Marcenaria";
  };

  useEffect(() => {
    carregarDados();
  }, []);

  useEffect(() => {
    if (filtroCategoriaPricelist) {
      setCategoriaExpandida(filtroCategoriaPricelist);
    } else {
      setCategoriaExpandida(null);
    }
    setFiltroSubcategoria(null);
  }, [filtroCategoriaPricelist]);

  // Carregar núcleos para o modal de novo item
  useEffect(() => {
    async function carregarNucleos() {
      try {
        const { data } = await supabase
          .from("nucleos")
          .select("*")
          .eq("ativo", true)
          .order("nome");
        if (data) setNucleosDisponiveis(data);
      } catch (error) {
        console.error("Erro ao carregar núcleos:", error);
      }
    }
    carregarNucleos();
  }, []);

  // Enriquecer itens do pricelist em memória com o núcleo correto vindo do banco
  useEffect(() => {
    async function enrichPricelistNucleos() {
      // Se já nÍo existe nenhum item sem núcleo, nada a fazer
      if (!itensPriceList.some((i) => !i.nucleo)) {
        return;
      }

      try {
        const ids = itensPriceList.map((i) => i.id);
        if (ids.length === 0) return;

        // Buscar nucleo_id dos itens do pricelist (sem join - evita erro de FK)
        const { data } = await supabase
          .from("pricelist_itens")
          .select("id, nucleo_id")
          .in("id", ids);

        if (!data) return;

        // Buscar núcleos separadamente
        const nucleoIds = [...new Set(data.map((i: any) => i.nucleo_id).filter(Boolean))];
        let nucleosMap: Record<string, string> = {};
        if (nucleoIds.length > 0) {
          const { data: nucleos } = await supabase
            .from("nucleos")
            .select("id, nome")
            .in("id", nucleoIds);
          if (nucleos) {
            nucleosMap = Object.fromEntries(nucleos.map(n => [n.id, n.nome]));
          }
        }

        const mapNormalized = new Map<string, NucleoItem>();
        (data as any[]).forEach((row: any) => {
          // Usar o nome do núcleo do mapa
          const nomeNucleo: string | undefined = row.nucleo_id ? nucleosMap[row.nucleo_id] : undefined;
          const normalizado = normalizarNucleoItem(nomeNucleo);
          if (normalizado) {
            mapNormalized.set(row.id, normalizado);
          }
        });

        if (mapNormalized.size === 0) return;

        setItensPriceList((prev) =>
          prev.map((item) => {
            if (item.nucleo) return item;
            const n = mapNormalized.get(item.id);
            return n ? { ...item, nucleo: n } : item;
          })
        );
      } catch (error) {
        console.error("Erro ao enriquecer nucleos dos itens do pricelist:", error);
      }
    }

    if (itensPriceList.length > 0) {
      void enrichPricelistNucleos();
    }
  }, [itensPriceList]);

  async function carregarDados() {
    try {
      setLoading(true);

      // Carregar price list
      const { data: priceListData } = await supabase
        .from("pricelist_itens")
        .select("*")
        .eq("ativo", true);

      if (priceListData) {
        setItensPriceList(priceListData as any);

        // Extrair categorias únicas (subcategorias - para filtro do pricelist)
        const categoriasUnicas = [...new Set(priceListData.map((item: any) => item.categoria).filter(Boolean))];
        setCategorias(categoriasUnicas.sort());
      }

      // Carregar categorias principais do pricelist (para filtro de Atividades)
      const { data: categoriasPrincipais } = await supabase
        .from("pricelist_categorias")
        .select("id, nome, codigo")
        .eq("ativo", true)
        .order("ordem");

      if (categoriasPrincipais) {
        setCategoriasPricelist(categoriasPrincipais);
      }

      // Se tiver ID na URL, carregar proposta existente
      if (id) {
        try {
          const propostaData = await buscarProposta(id);

          if (propostaData) {
            setPropostaId(id);

            // Carregar cliente
            const { data: clienteData } = await supabase
              .from("pessoas")
              .select("*")
              .eq("id", propostaData.cliente_id)
              .single();

            if (clienteData) {
              setClienteSelecionado(clienteData as any);
            }

            // Carregar itens da proposta
            if (propostaData.itens && propostaData.itens.length > 0) {
              const itensConvertidos: ItemProposta[] = propostaData.itens.map((item: any) => ({
                id: item.id,
                item: {
                  id: item.pricelist_item_id || item.id,
                  codigo: item.codigo || "",
                  nome: item.nome,
                  descricao: item.descricao || "",
                  categoria: item.categoria || "",
                  tipo: item.tipo,
                  unidade: item.unidade || "un",
                  preco: item.valor_unitario,
                  // Preservar núcleo do item da proposta para ediçÍo
                  nucleo: item.nucleo || undefined,
                },
                quantidade: item.quantidade,
                valor_unitario: item.valor_unitario,
                descricao_customizada: item.descricao_customizada,
                // Preservar vínculo com ambiente(s) para filtros
                ambiente_id: item.ambiente_id || undefined,
                ambientes_ids: item.ambientes_ids || undefined,
              }));

              setItensProposta(itensConvertidos);
            }

            // Carregar condições comerciais
            setCondicoesComerciais({
              forma_pagamento: propostaData.forma_pagamento || "parcelado",
              percentual_entrada: propostaData.percentual_entrada || 30,
              numero_parcelas: propostaData.numero_parcelas || 3,
              validade_dias: propostaData.validade_dias || 30,
              prazo_execucao_dias: propostaData.prazo_execucao_dias || 60,
              pagamento_cartao: propostaData.pagamento_cartao || false,
            });

            setExibirValoresNaProposta(propostaData.exibir_valores ?? true);

            // Carregar ambientes da proposta
            try {
              const ambientesCarregados = await listarAmbientesPorProposta(id);
              if (ambientesCarregados && ambientesCarregados.length > 0) {
                setAmbientes(ambientesCarregados as any);
              }
            } catch (error) {
              console.error("Erro ao carregar ambientes:", error);
            }
          }
        } catch (error) {
          console.error("Erro ao carregar proposta:", error);
          toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar proposta. Redirecionando..." });
          navigate("/propostas");
        }
      }
      // Se vier de uma oportunidade, carregar dados da oportunidade
      else if (oportunidadeId) {
        // Buscar oportunidade sem join (evita erro de FK)
        const { data: oportunidade } = await supabase
          .from("oportunidades")
          .select("*")
          .eq("id", oportunidadeId)
          .single();

        // Buscar dados do cliente separadamente
        if (oportunidade?.cliente_id) {
          const { data: cliente } = await supabase
            .from("pessoas")
            .select("*")
            .eq("id", oportunidade.cliente_id)
            .single();
          if (cliente) {
            setClienteSelecionado(cliente as any);
          }
        }
      }
      // Se vier com cliente_id diretamente
      else if (clienteIdParam) {
        const { data: cliente } = await supabase
          .from("pessoas")
          .select("*")
          .eq("id", clienteIdParam)
          .eq("tipo", "CLIENTE")
          .single();

        if (cliente) {
          setClienteSelecionado(cliente as any);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  // Buscar clientes (exclui concluídos)
  async function buscarClientes(termo: string) {
    if (!termo || termo.length < 2) {
      setClientesEncontrados([]);
      setMostrarResultadosBusca(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("*")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
        .or(`nome.ilike.*${termo}*,cpf.ilike.*${termo}*,email.ilike.*${termo}*`)
        .limit(5);

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        return;
      }

      setClientesEncontrados((data || []) as Cliente[]);
      setMostrarResultadosBusca(true);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
    }
  }

  // Selecionar cliente - abre o seletor de dados se for nova proposta
  function selecionarCliente(cliente: Cliente) {
    setBuscaCliente("");
    setMostrarResultadosBusca(false);
    setClientesEncontrados([]);

    // Verificar se é nova proposta (URL termina com /nova ou /propostas/nova)
    const isNovaProposta = window.location.pathname.includes("/nova");

    // Se já tem proposta salva ou está editando, apenas seleciona o cliente
    if (propostaId || !isNovaProposta) {
      setClienteSelecionado(cliente);
      return;
    }

    // Se é nova proposta, abrir seletor de dados do cliente
    if (import.meta.env.DEV) console.log("Abrindo seletor de dados para cliente:", cliente.nome);
    setClienteParaSeletor(cliente);
    setMostrarSeletorDados(true);
  }

  // Processar seleçÍo de dados do cliente (análise ou quantitativo)
  async function processarDadosSelecionados(dados: DadosImportados) {
    if (!clienteParaSeletor) return;

    setMostrarSeletorDados(false);
    setClienteSelecionado(clienteParaSeletor);
    setClienteParaSeletor(null);

    if (dados.tipo === "nenhum") {
      // Usuário escolheu iniciar do zero
      return;
    }

    setImportandoDados(true);

    try {
      if (dados.tipo === "analise" && dados.analise) {
        await importarDadosAnalise(dados.analise.id);
      } else if (dados.tipo === "quantitativo" && dados.quantitativo) {
        await importarDadosQuantitativo(dados.quantitativo.id);
      }
    } catch (error) {
      console.error("Erro ao importar dados:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao importar dados. Verifique o console." });
    } finally {
      setImportandoDados(false);
    }
  }

  // Importar dados de uma Análise de Projeto
  async function importarDadosAnalise(analiseId: string) {
    const analise = await buscarAnalise(analiseId);
    if (!analise) {
      toast({ variant: "destructive", title: "Erro", description: "Análise nÍo encontrada" });
      return;
    }

    setAnaliseVinculadaId(analiseId);

    // Importar ambientes da análise
    const ambientesConvertidos: Ambiente[] = [];
    if (analise.ambientes && analise.ambientes.length > 0) {
      for (const amb of analise.ambientes) {
        const largura = amb.largura || 0;
        const comprimento = amb.comprimento || 0;
        const peDireito = amb.pe_direito || 2.7;
        const areaPiso = amb.area_piso || (largura * comprimento) || 0;
        const perimetro = amb.perimetro || (largura && comprimento ? 2 * (largura + comprimento) : 0);
        const areaParede = amb.area_paredes_liquida || (perimetro * peDireito) || 0;

        ambientesConvertidos.push({
          id: amb.id,
          nome: amb.nome,
          largura,
          comprimento,
          pe_direito: peDireito,
          area_piso: areaPiso,
          area_parede: areaParede,
          area_teto: amb.area_teto || areaPiso,
          perimetro,
        });
      }
      setAmbientes(ambientesConvertidos);
    }

    // Sugerir itens baseados nos acabamentos da análise
    if (analise.acabamentos && analise.acabamentos.length > 0 && itensPriceList.length > 0) {
      const itensSugeridos: ItemProposta[] = [];

      for (const acabamento of analise.acabamentos) {
        // Buscar item no pricelist que corresponda ao tipo de acabamento
        const termoBusca = acabamento.material || acabamento.tipo || "";
        const itemEncontrado = itensPriceList.find((item) => {
          const nomeNorm = item.nome.toLowerCase();
          const descNorm = (item.descricao || "").toLowerCase();
          const termoNorm = termoBusca.toLowerCase();
          return nomeNorm.includes(termoNorm) || descNorm.includes(termoNorm);
        });

        if (itemEncontrado) {
          // Encontrar o ambiente correspondente
          const ambienteEncontrado = ambientesConvertidos.find(
            (a) => a.nome.toLowerCase() === (acabamento.ambiente || "").toLowerCase()
          );

          // Calcular quantidade baseada no tipo
          let quantidade = acabamento.area || acabamento.quantidade || 1;
          if (acabamento.tipo === "piso" && ambienteEncontrado) {
            quantidade = ambienteEncontrado.area_piso;
          } else if (acabamento.tipo === "parede" && ambienteEncontrado) {
            quantidade = ambienteEncontrado.area_parede;
          } else if (acabamento.tipo === "teto" && ambienteEncontrado) {
            quantidade = ambienteEncontrado.area_teto;
          } else if (acabamento.tipo === "rodape" && ambienteEncontrado) {
            quantidade = ambienteEncontrado.perimetro;
          }

          // Evitar duplicatas
          const jaAdicionado = itensSugeridos.some(
            (i) => i.item.id === itemEncontrado.id && i.ambiente_id === ambienteEncontrado?.id
          );

          if (!jaAdicionado && quantidade > 0) {
            itensSugeridos.push({
              id: `sugerido-${Date.now()}-${Math.random().toString(36).substring(7)}`,
              item: itemEncontrado,
              ambiente_id: ambienteEncontrado?.id,
              ambientes_ids: ambienteEncontrado ? [ambienteEncontrado.id] : [],
              quantidade: Math.ceil(quantidade * 1.1), // 10% de margem
              valor_unitario: itemEncontrado.preco,
              descricao_customizada: acabamento.descricao || undefined,
            });
          }
        }
      }

      // Adicionar itens sugeridos à proposta
      if (itensSugeridos.length > 0) {
        setItensProposta((prev) => [...itensSugeridos, ...prev]);
        if (import.meta.env.DEV) console.log(`✅ ${itensSugeridos.length} item(ns) sugerido(s) a partir dos acabamentos`);
      }
    }

    // Importar serviços do escopo (analises_projeto_servicos)
    try {
      const servicos = await listarServicosSelecionados(analiseId);
      if (servicos && servicos.length > 0) {
        const itensServicos: ItemProposta[] = [];
        const servicosSemMatch: string[] = [];
        const servicosImportados: string[] = [];

        for (const servico of servicos) {
          let itemEncontrado = servico.pricelist_item_id
            ? itensPriceList.find((item) => item.id === servico.pricelist_item_id)
            : undefined;

          if (!itemEncontrado && servico.termo_busca) {
            const termo = normalizeSearchTerm(servico.termo_busca);
            itemEncontrado = itensPriceList.find((item) => {
              const nomeNorm = normalizeSearchTerm(item.nome);
              const descNorm = normalizeSearchTerm(item.descricao || "");
              return nomeNorm.includes(termo) || descNorm.includes(termo);
            });
          }

          if (!itemEncontrado && servico.descricao) {
            const termo = normalizeSearchTerm(servico.descricao);
            itemEncontrado = itensPriceList.find((item) => {
              const nomeNorm = normalizeSearchTerm(item.nome);
              const descNorm = normalizeSearchTerm(item.descricao || "");
              return nomeNorm.includes(termo) || descNorm.includes(termo);
            });
          }

          if (itemEncontrado) {
            const ambienteNome = servico.ambiente_nome || servico.ambientes_nomes?.[0];
            const ambienteEncontrado = ambienteNome
              ? ambientesConvertidos.find(
                  (a) =>
                    normalizeSearchTerm(a.nome) ===
                    normalizeSearchTerm(ambienteNome)
                )
              : undefined;

            const quantidadeBase =
              servico.quantidade ??
              servico.area ??
              servico.metragem_linear ??
              1;

            const jaAdicionado = itensServicos.some(
              (i) =>
                i.item.id === itemEncontrado!.id &&
                i.ambiente_id === ambienteEncontrado?.id
            );

            if (!jaAdicionado) {
              itensServicos.push({
                id: `servico-${servico.id}`,
                item: itemEncontrado,
                ambiente_id: ambienteEncontrado?.id,
                ambientes_ids: ambienteEncontrado ? [ambienteEncontrado.id] : [],
                quantidade: Math.ceil(Number(quantidadeBase) * 1.1),
                valor_unitario: itemEncontrado.preco,
                descricao_customizada: servico.descricao || undefined,
              });
              servicosImportados.push(servico.id);
            }
          } else {
            servicosSemMatch.push(servico.descricao || "Serviço sem descriçÍo");
          }
        }

        if (itensServicos.length > 0) {
          setItensProposta((prev) => [...itensServicos, ...prev]);
          if (import.meta.env.DEV) console.log(`✅ ${itensServicos.length} serviço(s) importado(s) do escopo`);
          if (servicosImportados.length > 0) {
            await marcarServicosComoImportados(servicosImportados);
          }
        }

        if (servicosSemMatch.length > 0) {
          console.warn("Serviços sem match no Pricelist:", servicosSemMatch);
          toast({ title: `Alguns serviços nÍo foram vinculados ao Pricelist (${servicosSemMatch.length}). Finalize a vinculaçÍo na Análise de Projeto para importar todos.` });
        }
      }
    } catch (error) {
      console.error("Erro ao importar serviços:", error);
    }
  }

  // Importar dados de um Quantitativo
  async function importarDadosQuantitativo(quantitativoId: string) {
    const quantitativo = await buscarQuantitativoProjetoCompleto(quantitativoId);
    if (!quantitativo) {
      toast({ variant: "destructive", title: "Erro", description: "Quantitativo nÍo encontrado" });
      return;
    }

    setQuantitativoVinculadoId(quantitativoId);

    // Importar ambientes do quantitativo
    if (quantitativo.ambientes && quantitativo.ambientes.length > 0) {
      const ambientesConvertidos: Ambiente[] = quantitativo.ambientes.map((amb) => {
        const largura = amb.largura || 0;
        const comprimento = amb.comprimento || 0;
        const peDireito = amb.pe_direito || 2.7;
        const areaPiso = amb.area || (largura * comprimento) || 0;
        const perimetro = amb.perimetro || (largura && comprimento ? 2 * (largura + comprimento) : 0);
        const areaParede = perimetro * peDireito;

        return {
          id: amb.id,
          nome: amb.nome,
          largura,
          comprimento,
          pe_direito: peDireito,
          area_piso: areaPiso,
          area_parede: areaParede,
          area_teto: areaPiso,
          perimetro,
        };
      });

      setAmbientes(ambientesConvertidos);
    }

    // Importar itens do quantitativo para a proposta
    if (quantitativo.ambientes) {
      const itensImportados: ItemProposta[] = [];

      for (const ambiente of quantitativo.ambientes) {
        if (!ambiente.categorias) continue;

        for (const categoria of ambiente.categorias) {
          if (!categoria.itens) continue;

          for (const item of categoria.itens) {
            // Buscar item correspondente no pricelist
            const itemPricelist = itensPriceList.find(
              (p) => p.id === item.pricelist_item_id ||
                     p.codigo === item.codigo ||
                     p.nome.toLowerCase() === item.nome.toLowerCase()
            );

            if (itemPricelist) {
              itensImportados.push({
                id: `qtd-${item.id}-${Date.now()}`,
                item: itemPricelist,
                ambiente_id: ambiente.id,
                quantidade: item.quantidade || 1,
                valor_unitario: item.preco_unitario || itemPricelist.preco,
                descricao_customizada: item.descricao || undefined,
              });
            }
          }
        }
      }

      if (itensImportados.length > 0) {
        setItensProposta(itensImportados);
      }
    }
  }

  // Fechar seletor de dados
  function fecharSeletorDados() {
    setMostrarSeletorDados(false);
    setClienteParaSeletor(null);
  }

  // Calcular totais gerais (materiais / mÍo de obra)
  const totais = itensProposta.reduce(
    (acc, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      if (item.item.tipo === "material") {
        acc.materiais += subtotal;
      } else if (item.item.tipo === "mao_obra") {
        acc.maoObra += subtotal;
      } else {
        acc.materiais += subtotal / 2;
        acc.maoObra += subtotal / 2;
      }
      acc.total += subtotal;
      return acc;
    },
    { materiais: 0, maoObra: 0, total: 0 }
  );

  // Calcular totais por núcleo (para o resumo detalhado)
  const resumoPorNucleo = itensProposta.reduce(
    (acc, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      const nucleo = item.item.nucleo || "arquitetura";
      const tipo = item.item.tipo;

      acc.totalGeral += subtotal;

      if (nucleo === "arquitetura") {
        acc.arquitetura += subtotal;
      } else if (nucleo === "engenharia") {
        if (tipo === "material") {
          acc.engenhariaMateriais += subtotal;
        } else if (tipo === "mao_obra") {
          acc.engenhariaMaoObra += subtotal;
        } else if (tipo === "ambos") {
          acc.engenhariaMateriais += subtotal / 2;
          acc.engenhariaMaoObra += subtotal / 2;
        } else {
          acc.engenhariaMaoObra += subtotal;
        }
      } else if (nucleo === "marcenaria") {
        acc.marcenaria += subtotal;
      } else if (nucleo === "produtos") {
        acc.produtos += subtotal;
      }

      return acc;
    },
    {
      arquitetura: 0,
      engenhariaMaoObra: 0,
      engenhariaMateriais: 0,
      marcenaria: 0,
      produtos: 0,
      totalGeral: 0,
    }
  );

  const custoEstimado = totais.total * 0.68; // 68% de custo
  const margem = ((totais.total - custoEstimado) / totais.total) * 100;
  const lucro = totais.total - custoEstimado;

  // Calcular taxa de cartÍo (aplicada quando forma_pagamento é parcelado + cartÍo)
  const taxaCartaoPerc = condicoesComerciais.pagamento_cartao
    ? getTaxaCartaoAtual(condicoesComerciais.numero_parcelas)
    : 0;
  const valorTaxaCartao = totais.total * (taxaCartaoPerc / 100);
  const totalComCartao = totais.total + valorTaxaCartao;

  // Calcular totais dos ambientes
  const totaisAmbientes = ambientes.reduce((acc, amb) => ({
    area_piso: acc.area_piso + amb.area_piso,
    area_parede: acc.area_parede + amb.area_parede,
    area_teto: acc.area_teto + amb.area_teto,
    perimetro: acc.perimetro + amb.perimetro,
  }), { area_piso: 0, area_parede: 0, area_teto: 0, perimetro: 0 });

  // Filtrar itens da proposta por ambiente, atividade e busca por texto
  const itensPropostaFiltrados = useMemo(() => {
    let itens = [...itensProposta];

    // Filtro por busca de texto (flexível, case-insensitive, sem acentos)
    if (buscaItensProposta.trim()) {
      const termoBusca = buscaItensProposta
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

      itens = itens.filter((item) => {
        const textoItem = [
          item.item.nome,
          item.item.descricao,
          item.item.codigo,
          item.item.categoria,
          item.descricao_customizada,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");

        return textoItem.includes(termoBusca);
      });
    }

    // Filtro por ambiente (considera ambiente_id e ambientes_ids)
    if (filtroAmbienteProposta) {
      itens = itens.filter((item) =>
        item.ambiente_id === filtroAmbienteProposta ||
        item.ambientes_ids?.includes(filtroAmbienteProposta)
      );
    }

    // Filtro por atividade (categoria_id ou categoria string)
    if (filtroAtividadeProposta) {
      itens = itens.filter((item) => {
        const catId = (item.item as any).categoria_id;
        // Compara por categoria_id ou por categoria string (fallback)
        return catId === filtroAtividadeProposta || item.item.categoria === filtroAtividadeProposta;
      });
    }

    return itens;
  }, [itensProposta, buscaItensProposta, filtroAmbienteProposta, filtroAtividadeProposta]);

  // FunçÍo para avaliar expressões matemáticas
  function avaliarExpressao(texto: string): number {
    try {
      // Remove espaços e valida apenas números e operadores básicos
      const expressaoLimpa = texto.replace(/\s+/g, '');

      // Valida se contém apenas números e operadores permitidos
      if (!/^[\d+\-*/().]+$/.test(expressaoLimpa)) {
        return parseFloat(texto) || 0;
      }

      // Avalia a expressÍo de forma segura
      const resultado = Function(`'use strict'; return (${expressaoLimpa})`)();
      return typeof resultado === 'number' && !isNaN(resultado) ? resultado : 0;
    } catch {
      return parseFloat(texto) || 0;
    }
  }

  // FunçÍo para normalizar texto (remover acentos e converter para minúsculas)
  function normalizarTexto(texto: string): string {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, ""); // Remove acentos
  }

  function extrairSubcategoria(item: ItemPriceList): string {
    const raw =
      (item as any).subcategoria ||
      (item as any).subcategoria_nome ||
      (item as any).aplicacao ||
      "";
    return typeof raw === "string" ? raw.trim() : "";
  }

  function extrairAmbienteItem(item: ItemPriceList): string {
    const raw =
      (item as any).ambiente ||
      (item as any).ambiente_nome ||
      (item as any).aplicacao ||
      "";
    return typeof raw === "string" ? raw.trim() : "";
  }

  const subcategoriasDisponiveis = useMemo(() => {
    const setSubcategorias = new Set<string>();
    itensPriceList.forEach((item) => {
      if (filtroCategoriaPricelist && item.categoria !== filtroCategoriaPricelist) {
        return;
      }
      const sub = extrairSubcategoria(item);
      if (sub) {
        setSubcategorias.add(sub);
      }
    });
    return [...setSubcategorias].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [itensPriceList, filtroCategoriaPricelist]);

  const ambientesCatalogo = useMemo(() => {
    const setAmbientes = new Set<string>();
    ambientes.forEach((ambiente) => {
      if (ambiente.nome) {
        setAmbientes.add(ambiente.nome);
      }
    });
    itensPriceList.forEach((item) => {
      const ambiente = extrairAmbienteItem(item);
      if (ambiente) {
        setAmbientes.add(ambiente);
      }
    });
    return [...setAmbientes].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [ambientes, itensPriceList]);

  const matchesFiltrosCatalogo = (item: ItemPriceList): boolean => {
    if (filtroCategoria && item.tipo !== filtroCategoria && item.tipo !== "ambos") {
      return false;
    }

    if (
      filtroCategoriaPricelist &&
      normalizarTexto(item.categoria || "") !== normalizarTexto(filtroCategoriaPricelist)
    ) {
      return false;
    }

    if (filtroSubcategoria) {
      const subcategoriaItem = normalizarTexto(extrairSubcategoria(item));
      const filtroSubNormalized = normalizarTexto(filtroSubcategoria);
      if (!subcategoriaItem || subcategoriaItem !== filtroSubNormalized) {
        return false;
      }
    }

    if (filtroAmbienteCatalogo) {
      const ambienteItem = normalizarTexto(extrairAmbienteItem(item));
      const ambienteFiltro = normalizarTexto(filtroAmbienteCatalogo);
      if (!ambienteItem || !ambienteItem.includes(ambienteFiltro)) {
        return false;
      }
    }

    return true;
  };

  // Filtrar itens pela busca global (busca flexível - todas as palavras devem estar presentes)
  const itensFiltradosBusca = buscaGlobal.trim()
    ? itensPriceList.filter((item) => {
        if (!matchesFiltrosCatalogo(item)) return false;

        // Palavras de parada (stop words) que podem ser ignoradas
        const stopWords = ["de", "do", "da", "dos", "das", "e", "em", "para", "com", "o", "a", "os", "as", "um", "uma"];

        // Dividir busca em palavras e remover stop words
        const palavrasBusca = normalizarTexto(buscaGlobal)
          .split(/\s+/)
          .filter(p => p.length > 1 && !stopWords.includes(p));

        if (palavrasBusca.length === 0) return false;

        // Concatenar todos os campos pesquisáveis
        const textoItem = normalizarTexto([
          item.nome || "",
          item.codigo || "",
          item.descricao || "",
          item.categoria || ""
        ].join(" "));

        // Verificar se TODAS as palavras da busca estÍo presentes no item
        return palavrasBusca.every(palavra => textoItem.includes(palavra));
      })
    : [];

  // Adicionar item à proposta com metragem automática
  function adicionarItemProposta(item: ItemPriceList, ambienteId?: string) {
    let quantidadeInicial = 1;

    // Se tiver ambiente selecionado e item com unidade de medida, aplicar metragem automaticamente
    if (ambienteId) {
      const ambiente = ambientes.find(a => a.id === ambienteId);
      if (ambiente) {
        // Aplicar metragem baseado na categoria e unidade
        if (item.unidade === "m2") {
          // Para m², usar área apropriada baseado na categoria
          const categoriaPiso = ["piso", "revestimento piso", "ceramica", "porcelanato", "vinilico"];
          const categoriaParede = ["revestimento", "parede", "pintura", "azulejo", "textura"];
          const categoriaTeto = ["forro", "teto", "gesso"];

          const catLower = (item.categoria || '').toLowerCase();

          if (categoriaPiso.some(c => catLower.includes(c))) {
            quantidadeInicial = Number(ambiente.area_piso.toFixed(2));
          } else if (categoriaParede.some(c => catLower.includes(c))) {
            quantidadeInicial = Number(ambiente.area_parede.toFixed(2));
          } else if (categoriaTeto.some(c => catLower.includes(c))) {
            quantidadeInicial = Number(ambiente.area_teto.toFixed(2));
          } else {
            // Se nÍo identificar, usar área do piso como padrÍo
            quantidadeInicial = Number(ambiente.area_piso.toFixed(2));
          }
        } else if (item.unidade === "ml") {
          // Para metro linear, usar perímetro
          quantidadeInicial = Number(ambiente.perimetro.toFixed(2));
        }
      }
    }

    const itemComCategoria = {
      ...item,
      categoria: resolverCategoriaPadrao(item) || item.categoria || "",
    };

    const novoItem: ItemProposta = {
      id: `${Date.now()}-${Math.random()}`,
      item: itemComCategoria,
      ambiente_id: ambienteId,
      quantidade: quantidadeInicial,
      valor_unitario: item.preco,
    };
    setItensProposta([novoItem, ...itensProposta]);
  }

  // Remover item da proposta
  function removerItemProposta(id: string) {
    setItensProposta(itensProposta.filter((item) => item.id !== id));
  }

  // Ajustar valor total da proposta proporcionalmente
  function aplicarAjusteValor() {
    const valorAlvoNumero = parseFloat(valorAlvo.replace(/[^\d,.-]/g, '').replace(',', '.'));

    if (!valorAlvoNumero || valorAlvoNumero <= 0) {
      toast({ variant: "destructive", title: "Erro", description: "Digite um valor válido" });
      return;
    }

    if (totais.total <= 0) {
      toast({ title: "Adicione itens à proposta primeiro" });
      return;
    }

    // Calcular fator de ajuste
    const fatorAjuste = valorAlvoNumero / totais.total;

    // Confirmar com o usuário
    const percentualAjuste = ((fatorAjuste - 1) * 100).toFixed(2);
    const tipoAjuste = fatorAjuste > 1 ? "aumento" : "reduçÍo";
    const confirmar = confirm(
      `Isso aplicará um ${tipoAjuste} de ${Math.abs(parseFloat(percentualAjuste))}% em todos os valores unitários.\n\n` +
      `Valor atual: ${formatarMoeda(totais.total)}\n` +
      `Valor alvo: ${formatarMoeda(valorAlvoNumero)}\n\n` +
      `Deseja continuar?`
    );

    if (!confirmar) return;

    // Aplicar fator de ajuste a todos os itens
    const itensAjustados = itensProposta.map((item) => ({
      ...item,
      valor_unitario: item.valor_unitario * fatorAjuste,
    }));

    setItensProposta(itensAjustados);
    setMostrarAjusteValor(false);
    setValorAlvo("");

    toast({ title: "Sucesso", description: `Ajuste aplicado com sucesso! Novo total: ${formatarMoeda(valorAlvoNumero)}` });
  }

  // Abrir modal para adicionar novo item ao pricelist
  function abrirModalNovoItem() {
    // Preencher o nome com o termo de busca atual
    setNovoItem({
      nome: buscaGlobal.trim(),
      descricao: "",
      nucleo_id: "",
      tipo: "material",
      categoria: "",
      unidade: "un",
      preco: 0,
    });
    setMostrarModalNovoItem(true);
  }

  // Salvar novo item no pricelist e adicionar à proposta
  async function salvarNovoItem() {
    if (!novoItem.nome.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Nome é obrigatório" });
      return;
    }
    if (!novoItem.nucleo_id) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione um núcleo" });
      return;
    }
    if (novoItem.preco <= 0) {
      toast({ variant: "destructive", title: "Erro", description: "Preço deve ser maior que zero" });
      return;
    }

    try {
      setSalvandoNovoItem(true);

      // Buscar nome do núcleo
      const nucleoSelecionado = nucleosDisponiveis.find(n => n.id === novoItem.nucleo_id);
      const nucleoNome = nucleoSelecionado?.nome?.toLowerCase() || "";

      // Gerar código único
      const timestamp = Date.now().toString(36).toUpperCase();
      const random = Math.random().toString(36).substring(2, 5).toUpperCase();
      const codigo = `NOVO-${timestamp}-${random}`;

      // Criar item no pricelist
      const { data: itemCriado, error } = await supabase
        .from("pricelist_itens")
        .insert({
          codigo,
          nome: novoItem.nome.trim(),
          descricao: novoItem.descricao.trim() || null,
          nucleo_id: novoItem.nucleo_id,
          nucleo: nucleoNome,
          tipo: novoItem.tipo,
          categoria: novoItem.categoria.trim() || null,
          unidade: novoItem.unidade,
          preco: novoItem.preco,
          ativo: true,
        })
        .select()
        .single();

      if (error) throw error;

      // Adicionar à lista local de itens do pricelist
      const novoItemPricelist: ItemPriceList = {
        id: itemCriado.id,
        codigo: itemCriado.codigo,
        nome: itemCriado.nome,
        descricao: itemCriado.descricao || "",
        categoria: itemCriado.categoria || "",
        tipo: itemCriado.tipo,
        unidade: itemCriado.unidade,
        preco: itemCriado.preco,
        nucleo: normalizarNucleoItem(nucleoNome),
      };

      setItensPriceList([novoItemPricelist, ...itensPriceList]);

      // Adicionar diretamente à proposta
      adicionarItemProposta(novoItemPricelist);

      // Fechar modal e limpar busca
      setMostrarModalNovoItem(false);
      setBuscaGlobal("");

      toast({ title: "Sucesso", description: "Item criado e adicionado à proposta com sucesso!" });
    } catch (error) {
      console.error("Erro ao criar item:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao criar item. Tente novamente." });
    } finally {
      setSalvandoNovoItem(false);
    }
  }

  // Abrir comparador
  function abrirComparador(item: ItemPriceList) {
    setItemComparador(item);
    setMostrarComparador(true);
  }


  // Selecionar arquivo para importaçÍo (imagem da planta)
  function handleArquivoImportar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tipos aceitos: apenas imagens (API de visÍo nÍo suporta PDF diretamente)
    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!tiposAceitos.includes(file.type)) {
      toast({ variant: "destructive", title: "Erro", description: "Tipo de arquivo nÍo suportado. Use JPEG, PNG, GIF ou WebP. Dica: Se você tem um PDF, converta para imagem antes de enviar." });
      return;
    }

    // Validar tamanho (20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Erro", description: "Arquivo muito grande. O limite é de 20MB." });
      return;
    }

    setArquivoImportar(file);
    setAmbientesExtraidos([]);
    setMostrarResultadoIA(false);

    // Criar preview da imagem
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewArquivo(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Analisar arquivo com IA
  async function analisarArquivoComIA() {
    if (!arquivoImportar) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um arquivo primeiro" });
      return;
    }

    // Verificar se IA está configurada
    const validacao = validarConfiguracaoIA();
    if (!validacao.valido) {
      toast({ variant: "destructive", title: "Erro", description: validacao.mensagem || "Configure as chaves da IA antes de continuar." });
      return;
    }

    try {
      setImportando(true);
      setProgressoAnalise(10);

      // Processar arquivo para base64
      const imagemBase64 = await processarArquivoProjeto(arquivoImportar);
      setProgressoAnalise(30);

      // Determinar tipo de mídia
      let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
      if (arquivoImportar.type === "image/png") mediaType = "image/png";
      else if (arquivoImportar.type === "image/gif") mediaType = "image/gif";
      else if (arquivoImportar.type === "image/webp") mediaType = "image/webp";

      // Analisar com IA (foco em ambientes)
      setProgressoAnalise(50);
      const analise = await analisarProjetoComIA(imagemBase64, "ambientes", mediaType);
      setProgressoAnalise(90);

      if (analise.ambientes && analise.ambientes.length > 0) {
        setAmbientesExtraidos(analise.ambientes);
        setMostrarResultadoIA(true);
        setProgressoAnalise(100);
      } else {
        toast({ title: "A IA nÍo conseguiu identificar ambientes neste arquivo. Tente outra imagem ou adicione manualmente." });
      }
    } catch (error: any) {
      console.error("Erro ao analisar arquivo:", error);

      // Mensagens de erro mais específicas
      let mensagemErro = "Erro ao analisar arquivo com IA.";

      if (error.message) {
        if (error.message.includes("API key") || error.message.includes("Configure")) {
          mensagemErro = "Chave da API de IA nÍo configurada. Verifique as variáveis VITE_OPENAI_API_KEY ou VITE_ANTHROPIC_API_KEY no arquivo .env";
        } else if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          mensagemErro = "Chave da API inválida ou expirada. Verifique suas credenciais.";
        } else if (error.message.includes("429") || error.message.includes("rate limit")) {
          mensagemErro = "Limite de requisições atingido. Aguarde alguns minutos e tente novamente.";
        } else if (error.message.includes("Tipo de arquivo")) {
          mensagemErro = error.message;
        } else {
          mensagemErro = error.message;
        }
      }

      toast({ variant: "destructive", title: "Erro", description: mensagemErro });
    } finally {
      setImportando(false);
      setProgressoAnalise(0);
    }
  }

  // Importar ambientes extraídos pela IA para a proposta
  async function importarAmbientesExtraidos() {
    if (ambientesExtraidos.length === 0) {
      toast({ title: "Nenhum ambiente para importar" });
      return;
    }

    // Verificar se há cliente selecionado (necessário para criar proposta)
    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um cliente antes de importar os ambientes" });
      return;
    }

    try {
      setImportando(true);

      let propostaIdParaUsar = propostaId;

      // Se nÍo existe proposta, criar uma automaticamente
      if (!propostaIdParaUsar) {
        const propostaCriada = await criarProposta(
          {
            cliente_id: clienteSelecionado.id,
            oportunidade_id: oportunidadeId,
            titulo: `Proposta para ${clienteSelecionado.nome}`,
            descricao: `Proposta comercial gerada em ${new Date().toLocaleDateString("pt-BR")}`,
            forma_pagamento: condicoesComerciais.forma_pagamento as any,
            percentual_entrada: condicoesComerciais.percentual_entrada,
            numero_parcelas: condicoesComerciais.numero_parcelas,
            validade_dias: condicoesComerciais.validade_dias,
            prazo_execucao_dias: condicoesComerciais.prazo_execucao_dias,
            exibir_valores: exibirValoresNaProposta,
            pagamento_cartao: condicoesComerciais.pagamento_cartao,
            valor_total: 0,
          },
          [] // Sem itens inicialmente
        );
        propostaIdParaUsar = propostaCriada.id;
        setPropostaId(propostaCriada.id);
      }

      // Converter ambientes extraídos para o formato da proposta
      const ambientesParaImportar: AmbienteInput[] = ambientesExtraidos.map((amb) => {
        // Se tem área mas nÍo tem dimensões, estimar como quadrado
        let largura = amb.largura || 0;
        let comprimento = amb.comprimento || 0;

        if ((!largura || !comprimento) && amb.area) {
          const lado = Math.sqrt(amb.area);
          largura = largura || lado;
          comprimento = comprimento || lado;
        }

        // Fallback mínimo
        largura = largura || 3;
        comprimento = comprimento || 3;

        return {
          proposta_id: propostaIdParaUsar,
          nome: amb.nome,
          largura,
          comprimento,
          pe_direito: amb.pe_direito || 2.7,
          observacoes: amb.descricao || amb.tipo || undefined,
        };
      });

      const novosAmbientes = await criarAmbientesEmLote(ambientesParaImportar);

      // Atualizar lista de ambientes
      setAmbientes([...ambientes, ...novosAmbientes]);

      toast({ title: "Sucesso", description: `${novosAmbientes.length} ambiente(s) importado(s) com sucesso!` });
      fecharModalImportar();
    } catch (error) {
      console.error("Erro ao importar ambientes:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao importar ambientes. Verifique o console." });
    } finally {
      setImportando(false);
    }
  }

  // Abrir modal de importaçÍo
  function abrirModalImportar() {
    setArquivoImportar(null);
    setPreviewArquivo("");
    setAmbientesExtraidos([]);
    setMostrarResultadoIA(false);
    setMostrarModalImportar(true);
  }

  // Fechar modal de importaçÍo
  function fecharModalImportar() {
    setMostrarModalImportar(false);
    setArquivoImportar(null);
    setPreviewArquivo("");
    setAmbientesExtraidos([]);
    setMostrarResultadoIA(false);
  }

  // ============================================================
  // FUNÇÕES DO PLANO DE REFORMA
  // ============================================================

  // Abrir modal do Plano de Reforma
  function abrirModalPlanoReforma() {
    setArquivoPlanoReforma(null);
    setPreviewPlanoReforma("");
    setItensPlanoExtraidos([]);
    setMostrarResultadoPlano(false);
    setModoTextoPlano(false);
    setTextoPlanoReforma("");
    setMostrarModalPlanoReforma(true);
  }

  // Fechar modal do Plano de Reforma
  function fecharModalPlanoReforma() {
    setMostrarModalPlanoReforma(false);
    setArquivoPlanoReforma(null);
    setPreviewPlanoReforma("");
    setItensPlanoExtraidos([]);
    setMostrarResultadoPlano(false);
    setModoTextoPlano(false);
    setTextoPlanoReforma("");
  }

  // Selecionar arquivo do Plano de Reforma
  function handleArquivoPlanoReforma(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Tipos aceitos: apenas imagens
    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!tiposAceitos.includes(file.type)) {
      toast({ variant: "destructive", title: "Erro", description: "Tipo de arquivo nÍo suportado. Use JPEG, PNG, GIF ou WebP. Dica: Se você tem um PDF, converta para imagem antes de enviar." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Erro", description: "Arquivo muito grande. O limite é de 20MB." });
      return;
    }

    setArquivoPlanoReforma(file);
    setItensPlanoExtraidos([]);
    setMostrarResultadoPlano(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewPlanoReforma(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Analisar Plano de Reforma com IA (suporta imagem ou texto colado)
  async function analisarPlanoReformaComIA() {
    // Verificar se tem conteúdo para analisar
    const temImagem = arquivoPlanoReforma !== null;
    const temTexto = modoTextoPlano && textoPlanoReforma.trim().length > 0;

    if (!temImagem && !temTexto) {
      toast({ variant: "destructive", title: "Erro", description: modoTextoPlano ? "Cole o texto do plano de reforma" : "Selecione um arquivo primeiro" });
      return;
    }

    const validacao = validarConfiguracaoIA();
    if (!validacao.valido) {
      toast({ variant: "destructive", title: "Erro", description: validacao.mensagem || "Configure as chaves da IA antes de continuar." });
      return;
    }

    try {
      setImportandoPlano(true);
      setProgressoPlano(10);

      // Prompt MASTER especialista em reformas residenciais e comerciais
      const promptPlanoReforma = `
Você é um ESPECIALISTA MASTER em reformas residenciais e comerciais, com mais de 30 anos de experiência em:
- Arquitetura e Design de Interiores
- Engenharia Civil e Elétrica
- Marcenaria e Acabamentos
- Gerenciamento de Obras e Orçamentos
- LEITURA E INTERPRETAÇÍO DE PLANTAS ARQUITETÔNICAS

Sua missÍo é analisar o documento/texto/planta de reforma e extrair TODAS as atividades e serviços necessários.

REGRAS DE EXTRAÇÍO:
1. Identifique CADA serviço mencionado, mesmo implícitos
2. Separe por ambiente (cômodo/espaço)
3. Use nomenclatura técnica profissional
4. Detalhe especificações quando mencionadas (materiais, medidas, cores)
5. Inclua serviços complementares necessários (preparaçÍo, acabamento, limpeza)

REGRAS PARA LEITURA DE PLANTAS E DIMENSÕES:
1. Se a ÁREA (m²) estiver indicada diretamente na planta, preencha APENAS o campo "area_m2" - NÍO é necessário preencher largura e comprimento separadamente
2. A legenda "PD" em plantas significa PÉ DIREITO (altura do ambiente) - extraia esse valor para o campo "pe_direito_m"
3. Se houver somente largura e comprimento, calcule a área e preencha os 3 campos
4. As dimensões sÍo OPCIONAIS - preencha apenas se estiverem visíveis na planta/documento

Para CADA atividade extraída, forneça:
- AMBIENTE: Nome exato do cômodo/espaço (ex: "Suíte Master", "Lavabo Social", "Varanda Gourmet")
- ATIVIDADE: Nome técnico curto do serviço (ex: "Pintura Látex PVA", "Assentamento Porcelanato 60x60", "InstalaçÍo Ponto Elétrico")
- DESCRIÇÍO: DescriçÍo detalhada incluindo especificações técnicas, materiais, e escopo do trabalho
- DIMENSÕES (quando disponíveis na planta):
  - area_m2: Área do ambiente em metros quadrados (priorize usar se estiver indicado diretamente)
  - largura_m: Largura em metros (opcional, só se nÍo tiver área direta)
  - comprimento_m: Comprimento em metros (opcional, só se nÍo tiver área direta)
  - pe_direito_m: Pé direito/altura do ambiente em metros (geralmente indicado como "PD" na planta)

Retorne APENAS um JSON válido com esta estrutura:
{
  "itens": [
    {
      "ambiente": "string",
      "atividade": "string",
      "descricao": "string",
      "area_m2": number ou null,
      "largura_m": number ou null,
      "comprimento_m": number ou null,
      "pe_direito_m": number ou null
    }
  ],
  "observacoes": ["string"]
}

IMPORTANTE:
- NÍO omita nenhum serviço ou atividade
- Se um serviço se aplica a múltiplos ambientes, crie uma entrada para CADA ambiente
- Identifique serviços implícitos (ex: se há troca de piso, inclua remoçÍo do piso antigo, contrapiso, etc.)
- Use linguagem técnica profissional brasileira
- Agrupe observações gerais que se apliquem a toda a obra
- Para dimensões: se a área já está na planta (ex: "12,5 m²"), use ela diretamente - nÍo invente largura/comprimento

${modoTextoPlano ? `
TEXTO DO PLANO DE REFORMA A ANALISAR:
"""
${textoPlanoReforma.trim()}
"""
` : "Analise a imagem do documento de reforma fornecida."}
`;

      setProgressoPlano(30);

      // Sempre usar Anthropic para evitar problemas de CORS
      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      let resultado: string;

      if (temTexto) {
        // Modo texto: apenas texto sem imagem
        setProgressoPlano(50);

        const message = await client.messages.create({
          model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{
            role: "user",
            content: promptPlanoReforma
          }]
        });

        resultado = message.content.map((p) => (p.type === "text" ? p.text : "")).join("\n").trim();
      } else {
        // Modo imagem: processar arquivo
        const imagemBase64 = await processarArquivoProjeto(arquivoPlanoReforma!);
        setProgressoPlano(50);

        // Determinar tipo de mídia
        let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
        if (arquivoPlanoReforma!.type === "image/png") mediaType = "image/png";
        else if (arquivoPlanoReforma!.type === "image/gif") mediaType = "image/gif";
        else if (arquivoPlanoReforma!.type === "image/webp") mediaType = "image/webp";

        const message = await client.messages.create({
          model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: promptPlanoReforma },
              { type: "image", source: { type: "base64", media_type: mediaType, data: imagemBase64 } }
            ]
          }]
        });

        resultado = message.content.map((p) => (p.type === "text" ? p.text : "")).join("\n").trim();
      }

      setProgressoPlano(80);

      // Parsear resultado - Melhorado para lidar com diferentes formatos
      if (import.meta.env.DEV) console.log("Resposta bruta da IA (plano):", resultado.substring(0, 500));

      let jsonStringPlano: string | null = null;
      const markdownMatchPlano = resultado.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatchPlano) {
        jsonStringPlano = markdownMatchPlano[1].trim();
      } else {
        const jsonMatch = resultado.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonStringPlano = jsonMatch[0];
        }
      }

      if (!jsonStringPlano) {
        console.error("Resposta completa da IA (plano):", resultado);
        throw new Error("Resposta da IA nÍo contém JSON válido. Verifique o console.");
      }

      // FunçÍo para limpar e corrigir JSON malformado
      function limparJSON(jsonStr: string): string {
        return jsonStr
          // Remove caracteres de controle
          // eslint-disable-next-line no-control-regex
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          // Corrige trailing commas antes de ] ou }
          .replace(/,\s*([\]}])/g, '$1')
          // Corrige aspas simples para duplas (cuidado com apóstrofos)
          .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
          .replace(/:\s*'([^']*)'/g, ': "$1"')
          // Remove espaços extras
          .trim();
      }

      let parsed;
      let jsonLimpo = limparJSON(jsonStringPlano);

      try {
        parsed = JSON.parse(jsonLimpo);
      } catch (parseError: any) {
        console.error("Erro ao fazer parse do JSON (plano):", jsonLimpo);
        console.error("Erro específico:", parseError.message);

        // Tentar extrair posiçÍo do erro para debug
        const posMatch = parseError.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          console.error("Contexto do erro:", jsonLimpo.substring(Math.max(0, pos - 50), pos + 50));
        }

        // Última tentativa: buscar apenas o array de itens
        const itensMatch = jsonLimpo.match(/"itens"\s*:\s*\[([\s\S]*?)\]/);
        if (itensMatch) {
          try {
            const itensArray = JSON.parse(`[${itensMatch[1]}]`);
            parsed = { itens: itensArray, observacoes: [] };
            if (import.meta.env.DEV) console.log("Recuperado array de itens com sucesso!");
          } catch {
            throw new Error("JSON retornado pela IA está malformado. Tente novamente ou simplifique o texto.");
          }
        } else {
          throw new Error("JSON retornado pela IA está malformado. Tente novamente ou simplifique o texto.");
        }
      }
      const itensExtraidos = parsed.itens || [];

      // Tentar encontrar itens correspondentes no pricelist
      const itensComSugestao = itensExtraidos.map((item: any) => {
        // Buscar item similar no pricelist
        const atividadeNorm = (item.atividade || "").toLowerCase();
        const itemSugerido = itensPriceList.find((pl) => {
          const nomeNorm = (pl.nome || "").toLowerCase();
          return nomeNorm.includes(atividadeNorm) || atividadeNorm.includes(nomeNorm);
        });

        return {
          ambiente: item.ambiente,
          atividade: item.atividade,
          descricao: item.descricao,
          itemSugerido,
        };
      });

      setProgressoPlano(100);
      setItensPlanoExtraidos(itensComSugestao);
      setMostrarResultadoPlano(true);

    } catch (error: any) {
      console.error("Erro ao analisar plano de reforma:", error);
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao analisar plano de reforma com IA." });
    } finally {
      setImportandoPlano(false);
      setProgressoPlano(0);
    }
  }

  // Vincular item do plano a um item do pricelist
  function vincularItemPlano(index: number, itemPricelist: ItemPriceList) {
    setItensPlanoExtraidos((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, itemSugerido: itemPricelist } : item
      )
    );
  }

  // Cadastrar e vincular novo item ao plano
  function cadastrarItemPlano(index: number, novoItem: ItemPriceList) {
    setItensPlanoExtraidos((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, itemSugerido: novoItem } : item
      )
    );
    // Adicionar ao pricelist local para futuras referências
    setItensPriceList((prev) => [...prev, novoItem]);
  }

  // Vincular item do contrato a um item do pricelist
  function vincularItemContrato(index: number, itemPricelist: ItemPriceList) {
    if (!dadosContratoExtraidos) return;

    setDadosContratoExtraidos((prev) => {
      if (!prev) return prev;
      const novosItens = [...prev.itens];
      novosItens[index] = { ...novosItens[index], itemSugerido: itemPricelist };
      return { ...prev, itens: novosItens };
    });
  }

  // Cadastrar e vincular novo item ao contrato
  function cadastrarItemContrato(index: number, novoItem: ItemPriceList) {
    if (!dadosContratoExtraidos) return;

    setDadosContratoExtraidos((prev) => {
      if (!prev) return prev;
      const novosItens = [...prev.itens];
      novosItens[index] = { ...novosItens[index], itemSugerido: novoItem };
      return { ...prev, itens: novosItens };
    });
    // Adicionar ao pricelist local para futuras referências
    setItensPriceList((prev) => [...prev, novoItem]);
  }

  // Adicionar itens do plano de reforma à proposta
  async function adicionarItensPlanoReforma() {
    if (itensPlanoExtraidos.length === 0) {
      toast({ title: "Nenhum item para adicionar" });
      return;
    }

    try {
      setImportandoPlano(true);

      // Para cada item extraído, criar um item na proposta
      const novosItens: ItemProposta[] = [];

      for (const itemPlano of itensPlanoExtraidos) {
        if (itemPlano.itemSugerido) {
          // Usar item sugerido do pricelist
          const novoItem: ItemProposta = {
            id: `plano-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item: itemPlano.itemSugerido,
            quantidade: 1,
            valor_unitario: itemPlano.itemSugerido.preco,
            descricao_customizada: `${itemPlano.ambiente}: ${itemPlano.descricao}`,
          };
          novosItens.push(novoItem);
        } else {
          // Criar item genérico de serviço
          const itemGenerico: ItemPriceList = {
            id: `servico-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            codigo: "SRV",
            nome: itemPlano.atividade,
            descricao: itemPlano.descricao,
            categoria: "Serviços",
            tipo: "servico",
            unidade: "un",
            preco: 0, // Preço a definir
          };
          const novoItem: ItemProposta = {
            id: `plano-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item: itemGenerico,
            quantidade: 1,
            valor_unitario: 0,
            descricao_customizada: `${itemPlano.ambiente}: ${itemPlano.descricao}`,
          };
          novosItens.push(novoItem);
        }
      }

      // Adicionar à lista de itens da proposta
      setItensProposta([...itensProposta, ...novosItens]);

      // Salvar documento no Google Drive do cliente (se tiver cliente selecionado)
      if (clienteSelecionado && arquivoPlanoReforma) {
        await salvarPlanoNoDrive();
      }

      toast({ title: "Sucesso", description: `${novosItens.length} item(s) adicionado(s) à proposta!` });
      fecharModalPlanoReforma();

    } catch (error) {
      console.error("Erro ao adicionar itens:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao adicionar itens. Verifique o console." });
    } finally {
      setImportandoPlano(false);
    }
  }

  // Salvar plano de reforma no Google Drive do cliente
  async function salvarPlanoNoDrive() {
    if (!clienteSelecionado || !arquivoPlanoReforma) return;

    try {
      setSalvandoNoDrive(true);

      // Buscar pasta do cliente no Drive
      const { data: pessoaData } = await supabase
        .from("pessoas")
        .select("drive_folder_id")
        .eq("id", clienteSelecionado.id)
        .single();

      if (pessoaData?.drive_folder_id) {
        // Fazer upload para o Google Drive
        const formData = new FormData();
        formData.append("file", arquivoPlanoReforma);
        formData.append("folderId", pessoaData.drive_folder_id);
        formData.append("fileName", `Plano_Reforma_${new Date().toISOString().split("T")[0]}_${arquivoPlanoReforma.name}`);

        // Usar a API do Google Drive (se disponível)
        if (import.meta.env.DEV) console.log("[Drive] Salvando plano de reforma na pasta:", pessoaData.drive_folder_id);
        // A implementaçÍo completa do upload depende da API do Google Drive configurada
      }
    } catch (error) {
      console.error("Erro ao salvar no Drive:", error);
      // NÍo bloquear o fluxo se falhar o upload
    } finally {
      setSalvandoNoDrive(false);
    }
  }

  // ============================================================
  // FUNCOES DE IMPORTACAO DE CONTRATO COMPLETO
  // ============================================================

  // Abrir modal de importacao de contrato
  function abrirModalImportarContrato() {
    setArquivoContrato(null);
    setPreviewContrato("");
    setTextoContrato("");
    setModoTextoContrato(false);
    setDadosContratoExtraidos(null);
    setMostrarResultadoContrato(false);
    setMostrarModalImportarContrato(true);
  }

  // Fechar modal de importacao de contrato
  function fecharModalImportarContrato() {
    setMostrarModalImportarContrato(false);
    setArquivoContrato(null);
    setPreviewContrato("");
    setTextoContrato("");
    setDadosContratoExtraidos(null);
    setMostrarResultadoContrato(false);
  }

  // Selecionar arquivo do contrato
  function handleArquivoContrato(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const tiposAceitos = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!tiposAceitos.includes(file.type)) {
      toast({ variant: "destructive", title: "Erro", description: "Tipo de arquivo nao suportado. Use JPEG, PNG, GIF ou WebP. Dica: Se voce tem um PDF, converta para imagem antes de enviar." });
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      toast({ variant: "destructive", title: "Erro", description: "Arquivo muito grande. O limite e de 20MB." });
      return;
    }

    setArquivoContrato(file);
    setDadosContratoExtraidos(null);
    setMostrarResultadoContrato(false);

    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreviewContrato(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  // Analisar contrato com IA - Extracao COMPLETA
  async function analisarContratoComIA() {
    const temImagem = arquivoContrato !== null;
    const temTexto = modoTextoContrato && textoContrato.trim().length > 0;

    if (!temImagem && !temTexto) {
      toast({ variant: "destructive", title: "Erro", description: modoTextoContrato ? "Cole o texto do contrato" : "Selecione um arquivo primeiro" });
      return;
    }

    const validacao = validarConfiguracaoIA();
    if (!validacao.valido) {
      toast({ variant: "destructive", title: "Erro", description: validacao.mensagem || "Configure as chaves da IA antes de continuar." });
      return;
    }

    try {
      setImportandoContrato(true);
      setProgressoContrato(10);

      // PROMPT MASTER para extracao completa de contratos
      const promptContrato = `Voce e um ESPECIALISTA MASTER em analise de contratos de reforma e construcao, com mais de 30 anos de experiencia em:
- Contratos de prestacao de servicos de reforma
- Orcamentos e propostas comerciais
- Cronogramas de obra
- Condicoes de pagamento e financeiras
- Gerenciamento de projetos de construcao

Sua missao e analisar o contrato/documento e extrair TODAS as informacoes de forma estruturada para preencher automaticamente uma proposta comercial.

INSTRUCOES DE EXTRACAO:

1. DADOS DO CLIENTE:
   - Nome completo ou Razao Social
   - CPF ou CNPJ
   - Email e telefone
   - Endereco completo

2. DADOS DO PROJETO:
   - Nome do empreendimento/projeto
   - Endereco da obra
   - Descricao geral do escopo

3. ITENS E SERVICOS (MUITO IMPORTANTE):
   Para CADA item/servico mencionado, extraia:
   - Ambiente onde sera executado
   - Nome da atividade/servico (use nomenclatura tecnica)
   - Descricao detalhada
   - Quantidade (se mencionada)
   - Valor unitario (se mencionado)
   - Unidade de medida (m2, ml, un, etc)

4. CONDICOES DE PAGAMENTO:
   - Forma de pagamento (a vista, parcelado, etc)
   - Percentual de entrada
   - Numero de parcelas
   - Valor total do contrato
   - Datas das parcelas (se mencionadas)

5. CRONOGRAMA:
   - Prazo total de execucao em dias
   - Data de inicio prevista
   - Data de termino prevista
   - Etapas com duracao (se mencionadas)

6. OBSERVACOES GERAIS:
   - Clausulas importantes
   - Garantias
   - Restricoes
   - Notas relevantes

Retorne APENAS um JSON valido com esta estrutura EXATA:
{
  "cliente": {
    "nome": "string ou null",
    "cpf": "string ou null",
    "email": "string ou null",
    "telefone": "string ou null",
    "endereco": "string ou null"
  },
  "projeto": {
    "nome": "string ou null",
    "endereco": "string ou null",
    "descricao": "string ou null"
  },
  "itens": [
    {
      "ambiente": "string",
      "atividade": "string",
      "descricao": "string",
      "quantidade": number ou null,
      "valor": number ou null,
      "unidade": "m2" | "ml" | "un" | "diaria" | "hora" | "empreita" | null
    }
  ],
  "pagamento": {
    "forma": "a_vista" | "parcelado" | "financiado" | null,
    "entrada_percentual": number ou null,
    "parcelas": number ou null,
    "valor_total": number ou null,
    "datas_parcelas": ["string"] ou null
  },
  "cronograma": {
    "prazo_dias": number ou null,
    "data_inicio": "YYYY-MM-DD" ou null,
    "data_termino": "YYYY-MM-DD" ou null,
    "etapas": [
      {
        "nome": "string",
        "duracao_dias": number,
        "ordem": number
      }
    ] ou null
  },
  "observacoes": ["string"]
}

IMPORTANTE:
- Extraia TODOS os valores monetarios encontrados
- Converta valores para numero (ex: "R$ 1.500,00" vira 1500.00)
- Se uma informacao nao estiver presente, use null
- Identifique servicos implicitos (preparacao, acabamento, limpeza)
- Use nomenclatura tecnica profissional brasileira

${modoTextoContrato ? `
TEXTO DO CONTRATO A ANALISAR:
"""
${textoContrato.trim()}
"""
` : "Analise a imagem do contrato fornecida."}`;

      setProgressoContrato(30);

      const Anthropic = (await import("@anthropic-ai/sdk")).default;
      const client = new Anthropic({
        apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
        dangerouslyAllowBrowser: true,
      });

      let resultado: string;

      if (temTexto) {
        setProgressoContrato(50);

        const message = await client.messages.create({
          model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{
            role: "user",
            content: promptContrato
          }]
        });

        resultado = message.content.map((p) => (p.type === "text" ? p.text : "")).join("\n").trim();
      } else {
        const imagemBase64 = await processarArquivoProjeto(arquivoContrato!);
        setProgressoContrato(50);

        let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";
        if (arquivoContrato!.type === "image/png") mediaType = "image/png";
        else if (arquivoContrato!.type === "image/gif") mediaType = "image/gif";
        else if (arquivoContrato!.type === "image/webp") mediaType = "image/webp";

        const message = await client.messages.create({
          model: import.meta.env.VITE_ANTHROPIC_MODEL || "claude-sonnet-4-20250514",
          max_tokens: 8000,
          messages: [{
            role: "user",
            content: [
              { type: "text", text: promptContrato },
              { type: "image", source: { type: "base64", media_type: mediaType, data: imagemBase64 } }
            ]
          }]
        });

        resultado = message.content.map((p) => (p.type === "text" ? p.text : "")).join("\n").trim();
      }

      setProgressoContrato(80);

      // Parsear resultado - Melhorado para lidar com diferentes formatos
      if (import.meta.env.DEV) console.log("Resposta bruta da IA:", resultado.substring(0, 500));

      // Tentar extrair JSON de bloco de código markdown primeiro
      let jsonString: string | null = null;
      const markdownMatch = resultado.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (markdownMatch) {
        jsonString = markdownMatch[1].trim();
      } else {
        // Tentar extrair JSON diretamente
        const jsonMatch = resultado.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          jsonString = jsonMatch[0];
        }
      }

      if (!jsonString) {
        console.error("Resposta completa da IA:", resultado);
        throw new Error("Resposta da IA nao contem JSON valido. Verifique o console para detalhes.");
      }

      // FunçÍo para limpar e corrigir JSON malformado
      function limparJSONContrato(jsonStr: string): string {
        return jsonStr
          // Remove caracteres de controle
          // eslint-disable-next-line no-control-regex
          .replace(/[\x00-\x1F\x7F]/g, ' ')
          // Corrige trailing commas antes de ] ou }
          .replace(/,\s*([\]}])/g, '$1')
          // Corrige aspas simples para duplas
          .replace(/([{,]\s*)'([^']+)'(\s*:)/g, '$1"$2"$3')
          .replace(/:\s*'([^']*)'/g, ': "$1"')
          // Remove espaços extras
          .trim();
      }

      let parsed;
      let jsonLimpo = limparJSONContrato(jsonString);

      try {
        parsed = JSON.parse(jsonLimpo);
      } catch (parseError: any) {
        console.error("Erro ao fazer parse do JSON:", jsonLimpo);
        console.error("Erro específico:", parseError.message);

        // Tentar extrair posiçÍo do erro para debug
        const posMatch = parseError.message.match(/position (\d+)/);
        if (posMatch) {
          const pos = parseInt(posMatch[1]);
          console.error("Contexto do erro:", jsonLimpo.substring(Math.max(0, pos - 50), pos + 50));
        }

        // Última tentativa: buscar apenas o array de itens
        const itensMatch = jsonLimpo.match(/"itens"\s*:\s*\[([\s\S]*?)\]/);
        if (itensMatch) {
          try {
            const itensArray = JSON.parse(`[${itensMatch[1]}]`);
            parsed = { itens: itensArray, observacoes: [] };
            if (import.meta.env.DEV) console.log("Recuperado array de itens com sucesso!");
          } catch {
            throw new Error("JSON retornado pela IA está malformado. Tente novamente ou simplifique o texto.");
          }
        } else {
          throw new Error("JSON retornado pela IA está malformado. Tente novamente ou simplifique o texto.");
        }
      }

      // Tentar encontrar itens correspondentes no pricelist
      const itensComSugestao = (parsed.itens || []).map((item: any) => {
        const atividadeNorm = (item.atividade || "").toLowerCase();
        const descricaoNorm = (item.descricao || "").toLowerCase();

        // Busca melhorada: verifica nome, categoria e descricao
        const itemSugerido = itensPriceList.find((pl) => {
          const nomeNorm = (pl.nome || "").toLowerCase();
          const categoriaNorm = (pl.categoria || "").toLowerCase();
          const descPl = (pl.descricao || "").toLowerCase();

          return (
            nomeNorm.includes(atividadeNorm) ||
            atividadeNorm.includes(nomeNorm) ||
            nomeNorm.includes(descricaoNorm.split(" ")[0]) ||
            categoriaNorm.includes(atividadeNorm.split(" ")[0])
          );
        });

        return {
          ...item,
          itemSugerido,
        };
      });

      const dadosExtraidos = {
        ...parsed,
        itens: itensComSugestao,
      };

      setProgressoContrato(100);
      setDadosContratoExtraidos(dadosExtraidos);
      setMostrarResultadoContrato(true);

      if (import.meta.env.DEV) console.log("Dados extraidos do contrato:", dadosExtraidos);

    } catch (error: any) {
      console.error("Erro ao analisar contrato:", error);
      toast({ variant: "destructive", title: "Erro", description: error.message || "Erro ao analisar contrato com IA." });
    } finally {
      setImportandoContrato(false);
      setProgressoContrato(0);
    }
  }

  // Aplicar dados do contrato na proposta
  async function aplicarDadosContrato() {
    if (!dadosContratoExtraidos) {
      toast({ title: "Nenhum dado para aplicar" });
      return;
    }

    try {
      setImportandoContrato(true);

      // 1. Aplicar condicoes de pagamento
      if (dadosContratoExtraidos.pagamento) {
        const pag = dadosContratoExtraidos.pagamento;
        setCondicoesComerciais((prev) => ({
          ...prev,
          forma_pagamento: pag.forma === "a_vista" ? "a_vista" : "parcelado",
          percentual_entrada: pag.entrada_percentual || prev.percentual_entrada,
          numero_parcelas: pag.parcelas || prev.numero_parcelas,
          prazo_execucao_dias: dadosContratoExtraidos.cronograma?.prazo_dias || prev.prazo_execucao_dias,
        }));
      }

      // 2. Criar itens da proposta
      const novosItens: ItemProposta[] = [];

      for (const itemContrato of dadosContratoExtraidos.itens) {
        if (itemContrato.itemSugerido) {
          // Usar item do pricelist
          const novoItem: ItemProposta = {
            id: `contrato-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item: itemContrato.itemSugerido,
            quantidade: itemContrato.quantidade || 1,
            valor_unitario: itemContrato.valor || itemContrato.itemSugerido.preco,
            descricao_customizada: `${itemContrato.ambiente}: ${itemContrato.descricao}`,
          };
          novosItens.push(novoItem);
        } else {
          // Criar item generico
          const itemGenerico: ItemPriceList = {
            id: `servico-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            codigo: "SRV",
            nome: itemContrato.atividade,
            descricao: itemContrato.descricao,
            categoria: "Servicos Importados",
            tipo: "servico",
            unidade: (itemContrato.unidade as any) || "un",
            preco: itemContrato.valor || 0,
          };
          const novoItem: ItemProposta = {
            id: `contrato-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            item: itemGenerico,
            quantidade: itemContrato.quantidade || 1,
            valor_unitario: itemContrato.valor || 0,
            descricao_customizada: `${itemContrato.ambiente}: ${itemContrato.descricao}`,
          };
          novosItens.push(novoItem);
        }
      }

      // Adicionar itens a proposta
      setItensProposta([...itensProposta, ...novosItens]);

      // 3. Buscar ou criar cliente (se dados disponiveis)
      if (dadosContratoExtraidos.cliente?.email && !clienteSelecionado) {
        const { data: clienteExistente } = await supabase
          .from("pessoas")
          .select("id, nome, cpf, email, telefone")
          .eq("email", dadosContratoExtraidos.cliente.email)
          .maybeSingle();

        if (clienteExistente) {
          setClienteSelecionado({
            id: clienteExistente.id,
            nome: clienteExistente.nome || "",
            cpf: clienteExistente.cpf || "",
            email: clienteExistente.email || "",
            telefone: clienteExistente.telefone || "",
            status: "novo",
          });
        }
      }

      const totalItens = novosItens.length;
      const valorTotal = dadosContratoExtraidos.pagamento?.valor_total;
      const prazo = dadosContratoExtraidos.cronograma?.prazo_dias;

      const mensagemSucesso = [
        "Contrato importado com sucesso!",
        "",
        `Itens adicionados: ${totalItens}`,
        valorTotal ? `Valor total: R$ ${valorTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "",
        prazo ? `Prazo: ${prazo} dias` : "",
        "",
        "Confira os dados e salve a proposta."
      ].filter(Boolean).join("\n");
      toast({ title: "Sucesso", description: mensagemSucesso });

      fecharModalImportarContrato();

    } catch (error) {
      console.error("Erro ao aplicar dados do contrato:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aplicar dados. Verifique o console." });
    } finally {
      setImportandoContrato(false);
    }
  }

  function interpretarExpressaoMedida(valor: string): number | null {
    if (!valor) return null;
    const sanitized = valor.replace(/\s+/g, "").replace(/,/g, ".").replace(/;/g, ".");
    if (!sanitized) return null;
    const partes = sanitized.split("+").filter((parte) => parte !== "");
    if (partes.length === 0) return null;

    let total = 0;
    for (const parte of partes) {
      const numero = Number(parte);
      if (Number.isNaN(numero)) {
        return null;
      }
      total += numero;
    }
    return Number(total.toFixed(4));
  }

  function atualizarCampoMedida(campo: "largura" | "comprimento" | "area", texto: string) {
    setNovoAmbienteCampos((prev) => ({ ...prev, [campo]: texto }));
    const valor = interpretarExpressaoMedida(texto);
    setNovoAmbiente((prev) => ({
      ...prev,
      [campo]: valor ?? 0,
    }));
  }

  function confirmarCampoMedida(campo: "largura" | "comprimento" | "area") {
    const valor = interpretarExpressaoMedida(novoAmbienteCampos[campo]);
    if (valor !== null) {
      const textoFormatado = valor.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 3,
      });
      setNovoAmbienteCampos((prev) => ({ ...prev, [campo]: textoFormatado }));
      setNovoAmbiente((prev) => ({ ...prev, [campo]: valor }));
    }
  }

  function handleMedidaKeyDown(
    campo: "largura" | "comprimento" | "area",
    event: KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Enter") {
      event.preventDefault();
      confirmarCampoMedida(campo);
    } else if (event.key === "Tab") {
      confirmarCampoMedida(campo);
    }
  }

  function formatarCampoMedida(valor?: number | null) {
    if (!valor || Number.isNaN(valor)) return "";
    return valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 3,
    });
  }

  // Adicionar ou editar ambiente
  function salvarAmbiente() {
    if (!novoAmbiente.nome.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Digite um nome para o ambiente" });
      return;
    }

    // Calcular áreas
    const usouAreaManual = novoAmbiente.area > 0;
    const possuiDimensoes = novoAmbiente.largura > 0 && novoAmbiente.comprimento > 0;

    if (!usouAreaManual && !possuiDimensoes) {
      toast({ variant: "destructive", title: "Erro", description: "Informe largura/comprimento válidos ou digite a área total do ambiente." });
      return;
    }

    const area_piso = usouAreaManual
      ? novoAmbiente.area
      : novoAmbiente.largura * novoAmbiente.comprimento;
    const area_teto = area_piso;
    const perimetro = possuiDimensoes ? 2 * (novoAmbiente.largura + novoAmbiente.comprimento) : 0;
    const area_parede = possuiDimensoes ? perimetro * novoAmbiente.pe_direito : area_piso;
    const larguraParaSalvar = possuiDimensoes
      ? novoAmbiente.largura
      : usouAreaManual
      ? Math.sqrt(area_piso)
      : 0;
    const comprimentoParaSalvar = possuiDimensoes
      ? novoAmbiente.comprimento
      : usouAreaManual
      ? Math.sqrt(area_piso)
      : 0;

    if (editandoAmbiente) {
      // EDITAR ambiente existente
      setAmbientes(ambientes.map((amb) =>
        amb.id === editandoAmbiente
          ? {
              ...amb,
              nome: novoAmbiente.nome,
              largura: larguraParaSalvar,
              comprimento: comprimentoParaSalvar,
              pe_direito: novoAmbiente.pe_direito,
              area_piso,
              area_parede,
              area_teto,
              perimetro,
            }
          : amb
      ));
    } else {
      // CRIAR novo ambiente
      const ambiente: Ambiente = {
        id: `amb-${Date.now()}`,
        nome: novoAmbiente.nome,
        largura: larguraParaSalvar,
        comprimento: comprimentoParaSalvar,
        pe_direito: novoAmbiente.pe_direito,
        area_piso,
        area_parede,
        area_teto,
        perimetro,
      };
      setAmbientes([...ambientes, ambiente]);
    }

    fecharModalAmbiente();
  }

  function abrirNovoAmbiente() {
    setEditandoAmbiente(null);
    setNovoAmbiente({
      nome: "",
      largura: 0,
      comprimento: 0,
      pe_direito: 2.7,
      area: 0,
    });
    setNovoAmbienteCampos({
      largura: "",
      comprimento: "",
      area: "",
    });
    setMostrarModalAmbiente(true);
  }

  // Abrir modal para editar ambiente
  function abrirEdicaoAmbiente(ambiente: Ambiente) {
    setNovoAmbiente({
      nome: ambiente.nome,
      largura: ambiente.largura,
      comprimento: ambiente.comprimento,
      pe_direito: ambiente.pe_direito,
      area: ambiente.area_piso || ambiente.largura * ambiente.comprimento || 0,
    });
    setNovoAmbienteCampos({
      largura: formatarCampoMedida(ambiente.largura),
      comprimento: formatarCampoMedida(ambiente.comprimento),
      area: formatarCampoMedida(ambiente.area_piso),
    });
    setEditandoAmbiente(ambiente.id);
    setMostrarModalAmbiente(true);
  }

  // Excluir um ambiente específico
  async function excluirAmbiente(ambiente: Ambiente, e: React.MouseEvent) {
    e.stopPropagation(); // Evita abrir o modal de ediçÍo

    if (!confirm(`Deseja excluir o ambiente "${ambiente.nome}"?`)) {
      return;
    }

    try {
      // Se o ambiente tem ID real (está no banco), deletar via API
      if (ambiente.id && !ambiente.id.startsWith('temp-')) {
        await deletarAmbiente(ambiente.id);
      }

      // Remover da lista local
      setAmbientes(ambientes.filter(amb => amb.id !== ambiente.id));

      // Remover referências nos itens da proposta
      setItensProposta(itensProposta.map(item => ({
        ...item,
        ambientes_ids: item.ambientes_ids?.filter(id => id !== ambiente.id) || []
      })));

    } catch (error) {
      console.error("Erro ao excluir ambiente:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir ambiente. Tente novamente." });
    }
  }

  // Fechar modal e resetar estados
  function fecharModalAmbiente() {
    setMostrarModalAmbiente(false);
    setEditandoAmbiente(null);
    setNovoAmbiente({
      nome: "",
      largura: 0,
      comprimento: 0,
      pe_direito: 2.7,
      area: 0,
    });
    setNovoAmbienteCampos({
      largura: "",
      comprimento: "",
      area: "",
    });
  }

  // SugestÍo de IA por ambiente
  async function sugerirItensPorAmbiente(ambienteId: string) {
    // SimulaçÍo de sugestÍo de IA
    toast({ title: "IA sugerindo itens para o ambiente selecionado..." });
  }

  // ============================================================
  // HANDLERS DAS AÇÕES (Visualizar, PDF, Email, WhatsApp, Drive)
  // ============================================================

  // Montar objeto PropostaCompleta a partir dos dados atuais
  function montarPropostaCompleta(): PropostaCompleta | null {
    if (!clienteSelecionado) return null;

    // Converter tipo do pricelist para TipoItem válido
    const converterTipo = (tipo: string): "material" | "mao_obra" | "ambos" => {
      if (tipo === "material" || tipo === "produto") return "material";
      if (tipo === "mao_obra" || tipo === "servico") return "mao_obra";
      return "ambos";
    };

    const itensConvertidos: PropostaItemType[] = itensProposta.map((item, index) => ({
      id: item.id,
      proposta_id: propostaId || "",
      pricelist_item_id: item.item.id,
      codigo: item.item.codigo || null,
      nome: item.item.nome,
      descricao: item.descricao_customizada || item.item.descricao || null,
      categoria: item.item.categoria || null,
      tipo: converterTipo(item.item.tipo),
      unidade: item.item.unidade || "un",
      quantidade: item.quantidade,
      valor_unitario: item.valor_unitario,
      valor_subtotal: item.quantidade * item.valor_unitario,
      nucleo: normalizarNucleoItem(item.item.nucleo) || null,
      ordem: index,
      criado_em: new Date().toISOString(),
    }));

    const valorMateriais = itensConvertidos
      .filter(i => i.tipo === "material")
      .reduce((acc, i) => acc + i.valor_subtotal, 0);
    const valorMaoObra = itensConvertidos
      .filter(i => i.tipo === "mao_obra")
      .reduce((acc, i) => acc + i.valor_subtotal, 0);
    const valorTotal = itensConvertidos.reduce((acc, i) => acc + i.valor_subtotal, 0);

    return {
      id: propostaId || "",
      cliente_id: clienteSelecionado.id,
      cliente_nome: clienteSelecionado.nome,
      titulo: `Proposta para ${clienteSelecionado.nome}`,
      nucleo: null,
      numero: null,
      descricao: null,
      forma_pagamento: condicoesComerciais.forma_pagamento as any,
      percentual_entrada: condicoesComerciais.percentual_entrada,
      numero_parcelas: condicoesComerciais.numero_parcelas,
      validade_dias: condicoesComerciais.validade_dias,
      prazo_execucao_dias: condicoesComerciais.prazo_execucao_dias,
      valor_materiais: valorMateriais,
      valor_mao_obra: valorMaoObra,
      valor_total: valorTotal,
      exibir_valores: exibirValoresNaProposta,
      pagamento_cartao: condicoesComerciais.pagamento_cartao,
      status: "rascunho",
      criado_em: new Date().toISOString(),
      itens: itensConvertidos,
    };
  }

  // VISUALIZAR - Abre a proposta em uma nova aba para preview
  function handleVisualizar() {
    if (propostaId) {
      window.open(`/propostas/${propostaId}/visualizar`, "_blank");
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Salve a proposta primeiro para visualizar" });
    }
  }

  // GERAR PDF - Gera e baixa o PDF da proposta
  async function handleGerarPDF() {
    const proposta = montarPropostaCompleta();
    if (!proposta) {
      toast({ variant: "destructive", title: "Erro", description: "Configure cliente e adicione itens antes de gerar o PDF" });
      return;
    }

    if (!propostaId) {
      toast({ variant: "destructive", title: "Erro", description: "Salve a proposta primeiro para gerar o PDF com todos os dados" });
      return;
    }

    try {
      const buscarDadosBancarios = async (nucleo?: string | null): Promise<DadosBancariosNucleo | null> => {
        if (!nucleo) return null;
        try {
          const { data, error } = await supabase
            .from("contas_bancarias")
            .select("banco, agencia, conta, tipo_conta, pix_chave, pix_tipo, nome, nucleo")
            .eq("ativo", true)
            .in("nucleo", [nucleo, "grupo"])
            .order("nucleo", { ascending: false });

          if (error) return null;
          const conta = (data || []).find((item) => item.nucleo === nucleo) || (data || [])[0];
          return conta || null;
        } catch (error) {
          console.warn("Falha ao carregar contas bancarias:", error);
          return null;
        }
      };

      const dadosBancarios = await buscarDadosBancarios(proposta.nucleo || null);
      await gerarPropostaPDF(proposta, dadosBancarios);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao gerar PDF. Tente novamente." });
    }
  }

  // EMAIL - Abre cliente de email com dados da proposta
  function handleEnviarEmail() {
    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um cliente primeiro" });
      return;
    }

    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totais.total);

    const assunto = encodeURIComponent(`Proposta Comercial - Grupo WG Almeida`);
    const corpo = encodeURIComponent(
      `Olá ${clienteSelecionado.nome},\n\n` +
      `Segue sua proposta comercial do Grupo WG Almeida.\n\n` +
      `Valor Total: ${valorFormatado}\n` +
      `Validade: ${condicoesComerciais.validade_dias} dias\n\n` +
      (propostaId
        ? `Para aprovar a proposta, acesse: ${globalThis.location.origin}/proposta/${propostaId}/aprovar\n\n`
        : "") +
      `Atenciosamente,\n` +
      `Grupo WG Almeida\n` +
      `Arquitetura • Engenharia • Marcenaria`
    );

    const emailDestino = clienteSelecionado.email || "";
    window.open(`mailto:${emailDestino}?subject=${assunto}&body=${corpo}`, "_blank");
  }

  // WHATSAPP - Abre WhatsApp com mensagem da proposta
  function handleEnviarWhatsApp() {
    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um cliente primeiro" });
      return;
    }

    const valorFormatado = new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(totais.total);

    const telefone = clienteSelecionado.telefone?.replace(/\D/g, "") || "";
    const mensagem = encodeURIComponent(
      `Olá ${clienteSelecionado.nome}! 👋\n\n` +
      `Sua proposta comercial do Grupo WG Almeida está pronta!\n\n` +
      `💰 Valor: ${valorFormatado}\n` +
      `📅 Validade: ${condicoesComerciais.validade_dias} dias\n\n` +
      (propostaId
        ? `🔗 Para aprovar: ${globalThis.location.origin}/proposta/${propostaId}/aprovar\n\n`
        : "") +
      `Grupo WG Almeida 🏗️\n` +
      `Arquitetura • Engenharia • Marcenaria`
    );

    if (telefone) {
      window.open(`https://wa.me/55${telefone}?text=${mensagem}`, "_blank");
    } else {
      window.open(`https://wa.me/?text=${mensagem}`, "_blank");
    }
  }

  // DRIVE - Salvar no Google Drive (usando estado salvandoNoDrive existente)
  async function handleSalvarDrive() {
    if (!propostaId) {
      toast({ variant: "destructive", title: "Erro", description: "Salve a proposta primeiro para enviar ao Drive" });
      return;
    }

    try {
      setSalvandoNoDrive(true);
      // Aqui pode integrar com o serviço googleDriveBrowserService
      toast({ title: "Funcionalidade de Google Drive será implementada em breve. Por enquanto, gere o PDF e faça o upload manualmente." });
    } catch (error) {
      console.error("Erro ao salvar no Drive:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar no Drive. Tente novamente." });
    } finally {
      setSalvandoNoDrive(false);
    }
  }

  // Salvar proposta
  async function salvarProposta() {
    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um cliente antes de salvar a proposta" });
      return;
    }

    if (itensProposta.length === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Adicione pelo menos um item à proposta antes de salvar" });
      return;
    }

    try {
      setSalvando(true);

      const prepararItensParaPersistencia = (itensOriginais: ItemProposta[]) => {
        const itensValidos: PropostaItemInput[] = [];
        const motivosDescarte: Record<string, number> = {};
        const chavesDeduplicacao = new Set<string>();

        const registrarDescarte = (motivo: string) => {
          motivosDescarte[motivo] = (motivosDescarte[motivo] || 0) + 1;
        };

        for (const item of itensOriginais) {
          const quantidade = Number(item.quantidade);
          const valorUnitario = Number(item.valor_unitario);
          const pricelistValido = isUuid(item.item.id);
          const descricaoBase = (item.descricao_customizada || item.item.nome || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

          if (!Number.isFinite(quantidade) || quantidade <= 0) {
            registrarDescarte("quantidade_invalida");
            continue;
          }

          if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
            registrarDescarte("valor_unitario_invalido");
            continue;
          }

          if (!pricelistValido && valorUnitario === 0) {
            registrarDescarte("custom_sem_preco");
            continue;
          }

          const ambientePersistido =
            item.ambiente_id && item.ambiente_id.startsWith("amb-")
              ? undefined
              : item.ambiente_id;

          const chave = [
            pricelistValido ? item.item.id : "sem_pricelist",
            ambientePersistido || "sem_ambiente",
            descricaoBase,
            quantidade.toFixed(4),
            valorUnitario.toFixed(4),
          ].join("|");

          if (chavesDeduplicacao.has(chave)) {
            registrarDescarte("duplicado");
            continue;
          }

          chavesDeduplicacao.add(chave);
          itensValidos.push({
            pricelist_item_id: pricelistValido ? item.item.id : null,
            codigo: item.item.codigo,
            nome: item.item.nome,
            descricao: item.item.descricao,
            categoria: normalizarCategoria(resolverCategoriaPadrao(item.item)),
            tipo: item.item.tipo,
            unidade: normalizarUnidadePersistencia(item.item.unidade),
            quantidade,
            valor_unitario: valorUnitario,
            descricao_customizada: item.descricao_customizada,
            ambiente_id: ambientePersistido,
            nucleo: item.item.nucleo || "arquitetura",
          });
        }

        const itensComOrdem = itensValidos.map((item, index) => ({
          ...item,
          ordem: index,
        }));

        return { itens: itensComOrdem, motivosDescarte };
      };

      // Converter itens para o formato da API
      const { itens: itensParaSalvar, motivosDescarte } = prepararItensParaPersistencia(itensProposta);

      const totalDescartado = Object.values(motivosDescarte).reduce((acc, atual) => acc + atual, 0);
      if (totalDescartado > 0) {
        console.warn("[PropostaEmissaoPage] Itens descartados na validaçÍo:", motivosDescarte);
        toast({ title: `Itens ajustados antes de salvar: ${Object.entries(motivosDescarte).map(([motivo, total]) => `${motivo}=${total}`).join(", ")}` });
      }

      if (itensParaSalvar.length === 0) {
        toast({ variant: "destructive", title: "Erro", description: "Nenhum item válido para salvar após validaçÍo." });
        return;
      }

      // Calcular valor total com taxa de cartÍo se aplicável
      const valorTotalFinal = condicoesComerciais.pagamento_cartao
        ? totais.total * (1 + getTaxaCartaoAtual(condicoesComerciais.numero_parcelas) / 100)
        : totais.total;

      // Criar proposta
      const propostaCriada = await criarProposta(
        {
          cliente_id: clienteSelecionado.id,
          oportunidade_id: oportunidadeId,
          titulo: `Proposta para ${clienteSelecionado.nome}`,
          descricao: `Proposta comercial gerada em ${new Date().toLocaleDateString("pt-BR")}`,
          forma_pagamento: condicoesComerciais.forma_pagamento as any,
          percentual_entrada: condicoesComerciais.percentual_entrada,
          numero_parcelas: condicoesComerciais.numero_parcelas,
          validade_dias: condicoesComerciais.validade_dias,
          prazo_execucao_dias: condicoesComerciais.prazo_execucao_dias,
          exibir_valores: exibirValoresNaProposta,
          pagamento_cartao: condicoesComerciais.pagamento_cartao,
          valor_total: valorTotalFinal,
        },
        itensParaSalvar
      );

      setPropostaId(propostaCriada.id);

      // Salvar ambientes se houver
      if (ambientes.length > 0) {
        try {
          const ambientesParaSalvar: AmbienteInput[] = ambientes.map((amb, index) => ({
            proposta_id: propostaCriada.id,
            nome: amb.nome,
            largura: amb.largura,
            comprimento: amb.comprimento,
            pe_direito: amb.pe_direito,
            ordem: index,
          }));

          await criarAmbientesEmLote(ambientesParaSalvar);
          if (import.meta.env.DEV) console.log(`✅ ${ambientes.length} ambientes salvos com sucesso`);
        } catch (error) {
          console.error("Erro ao salvar ambientes:", error);
          // NÍo bloquear o fluxo se falhar ao salvar ambientes
        }
      }

      // Vincular análise de projeto se foi usada como fonte de dados
      if (analiseVinculadaId) {
        try {
          await vincularAnaliseAProposta(analiseVinculadaId, propostaCriada.id);
          if (import.meta.env.DEV) console.log("✅ Análise vinculada à proposta com sucesso");
        } catch (error) {
          console.error("Erro ao vincular análise:", error);
          // NÍo bloquear o fluxo
        }
      }

      toast({ title: "Sucesso", description: "Proposta salva com sucesso!" });
    } catch (error) {
      console.error("Erro ao salvar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar proposta. Verifique o console para mais detalhes." });
    } finally {
      setSalvando(false);
    }
  }

  // Atualizar proposta existente
  async function atualizarPropostaExistente() {
    if (!propostaId) {
      toast({ variant: "destructive", title: "Erro", description: "Proposta nÍo encontrada" });
      return;
    }

    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Erro", description: "Selecione um cliente antes de salvar a proposta" });
      return;
    }

    if (itensProposta.length === 0) {
      toast({ variant: "destructive", title: "Erro", description: "Adicione pelo menos um item à proposta antes de salvar" });
      return;
    }

    try {
      setSalvando(true);

      const prepararItensParaPersistencia = (itensOriginais: ItemProposta[]) => {
        const itensValidos: PropostaItemInput[] = [];
        const motivosDescarte: Record<string, number> = {};
        const chavesDeduplicacao = new Set<string>();

        const registrarDescarte = (motivo: string) => {
          motivosDescarte[motivo] = (motivosDescarte[motivo] || 0) + 1;
        };

        for (const item of itensOriginais) {
          const quantidade = Number(item.quantidade);
          const valorUnitario = Number(item.valor_unitario);
          const pricelistValido = isUuid(item.item.id);
          const ambientePersistido =
            item.ambiente_id && item.ambiente_id.startsWith("amb-")
              ? undefined
              : item.ambiente_id;
          const descricaoBase = (item.descricao_customizada || item.item.nome || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .trim()
            .toLowerCase();

          if (!Number.isFinite(quantidade) || quantidade <= 0) {
            registrarDescarte("quantidade_invalida");
            continue;
          }

          if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
            registrarDescarte("valor_unitario_invalido");
            continue;
          }

          if (!pricelistValido && valorUnitario === 0) {
            registrarDescarte("custom_sem_preco");
            continue;
          }

          const chave = [
            pricelistValido ? item.item.id : "sem_pricelist",
            ambientePersistido || "sem_ambiente",
            descricaoBase,
            quantidade.toFixed(4),
            valorUnitario.toFixed(4),
          ].join("|");

          if (chavesDeduplicacao.has(chave)) {
            registrarDescarte("duplicado");
            continue;
          }

          chavesDeduplicacao.add(chave);
          itensValidos.push({
            pricelist_item_id: pricelistValido ? item.item.id : null,
            nome: item.item.nome,
            descricao: item.item.descricao,
            categoria: normalizarCategoria(resolverCategoriaPadrao(item.item)),
            tipo: item.item.tipo,
            unidade: normalizarUnidadePersistencia(item.item.unidade),
            quantidade,
            valor_unitario: valorUnitario,
            descricao_customizada: item.descricao_customizada,
            ambiente_id: ambientePersistido,
            nucleo: item.item.nucleo || "arquitetura",
          });
        }

        const itensComOrdem = itensValidos.map((item, index) => ({
          ...item,
          ordem: index,
        }));

        return { itens: itensComOrdem, motivosDescarte };
      };

      // Calcular totais dos itens
      const totais = itensProposta.reduce(
        (acc, item) => {
          const subtotal = item.quantidade * item.valor_unitario;
          const tipoItem = item.item?.tipo;
          if (tipoItem === "material") {
            acc.materiais += subtotal;
          } else if (tipoItem === "mao_obra") {
            acc.maoObra += subtotal;
          } else {
            acc.materiais += subtotal / 2;
            acc.maoObra += subtotal / 2;
          }
          acc.total += subtotal;
          return acc;
        },
        { materiais: 0, maoObra: 0, total: 0 }
      );

      // Calcular valor total com taxa de cartÍo se aplicável
      const valorTotalAtualizado = condicoesComerciais.pagamento_cartao
        ? totais.total * (1 + getTaxaCartaoAtual(condicoesComerciais.numero_parcelas) / 100)
        : totais.total;

      // Atualizar dados da proposta (incluindo valores calculados)
      await atualizarProposta(propostaId, {
        forma_pagamento: condicoesComerciais.forma_pagamento as any,
        percentual_entrada: condicoesComerciais.percentual_entrada,
        numero_parcelas: condicoesComerciais.numero_parcelas,
        validade_dias: condicoesComerciais.validade_dias,
        prazo_execucao_dias: condicoesComerciais.prazo_execucao_dias,
        exibir_valores: exibirValoresNaProposta,
        pagamento_cartao: condicoesComerciais.pagamento_cartao,
        valor_total: valorTotalAtualizado,
        valor_materiais: totais.materiais,
        valor_mao_obra: totais.maoObra,
      });

      // Atualizar itens da proposta (insert-first para evitar perda de dados)
      try {
        if (itensProposta.length > 0) {
          const { itens: itensParaInserir, motivosDescarte } = prepararItensParaPersistencia(itensProposta);

          const totalDescartado = Object.values(motivosDescarte).reduce((acc, atual) => acc + atual, 0);
          if (totalDescartado > 0) {
            console.warn("[PropostaEmissaoPage] Itens descartados na atualizaçÍo:", motivosDescarte);
            toast({ title: `Itens ajustados antes de atualizar: ${Object.entries(motivosDescarte).map(([motivo, total]) => `${motivo}=${total}`).join(", ")}` });
          }

          if (itensParaInserir.length === 0) {
            throw new Error("Nenhum item válido para atualizar a proposta.");
          }

          const payloadInsercao = itensParaInserir.map((itemProposta) => ({
            proposta_id: propostaId,
            pricelist_item_id: itemProposta.pricelist_item_id,
            nome: itemProposta.nome,
            descricao: itemProposta.descricao,
            categoria: itemProposta.categoria,
            tipo: itemProposta.tipo,
            unidade: itemProposta.unidade,
            quantidade: itemProposta.quantidade,
            valor_unitario: itemProposta.valor_unitario,
            descricao_customizada: itemProposta.descricao_customizada,
            ambiente_id: itemProposta.ambiente_id,
            ordem: itemProposta.ordem,
            nucleo: itemProposta.nucleo || "arquitetura",
          }));

          // 1. Inserir novos itens primeiro (se falhar, antigos permanecem)
          const { data: insertedItens, error: insertError } = await supabase
            .from("propostas_itens")
            .insert(payloadInsercao)
            .select();

          if (insertError) throw insertError;

          // 2. Deletar itens antigos (exceto os recém-inseridos)
          const idsNovos = (insertedItens || []).map((i: any) => i.id);
          await supabase
            .from("propostas_itens")
            .delete()
            .eq("proposta_id", propostaId)
            .not("id", "in", `(${idsNovos.join(",")})`);

          if (import.meta.env.DEV) console.log(`✅ ${itensProposta.length} itens atualizados`);
        } else {
          // Sem itens, deletar antigos
          await supabase
            .from("propostas_itens")
            .delete()
            .eq("proposta_id", propostaId);
        }
      } catch (error) {
        console.error("Erro ao atualizar itens:", error);
        throw error;
      }

      // Atualizar ambientes
      try {
        // Deletar ambientes antigos
        await deletarAmbientesPorProposta(propostaId);

        // Criar novos ambientes
        if (ambientes.length > 0) {
          const ambientesParaSalvar: AmbienteInput[] = ambientes.map((amb, index) => ({
            proposta_id: propostaId,
            nome: amb.nome,
            largura: amb.largura,
            comprimento: amb.comprimento,
            pe_direito: amb.pe_direito,
            ordem: index,
          }));

          await criarAmbientesEmLote(ambientesParaSalvar);
          if (import.meta.env.DEV) console.log(`✅ ${ambientes.length} ambientes atualizados`);
        }
      } catch (error) {
        console.error("Erro ao atualizar ambientes:", error);
      }

      toast({ title: "Sucesso", description: "Proposta atualizada com sucesso!" });

      // Redirecionar para a lista de propostas após salvar
      // Adicionando timestamp para forçar reload da lista
      navigate("/propostas?_refresh=" + Date.now());
    } catch (error) {
      console.error("Erro ao atualizar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar proposta. Verifique o console para mais detalhes." });
    } finally {
      setSalvando(false);
    }
  }

  if (loading) {
    return <Loading fullscreen text="Carregando proposta..." />;
  }

  return (
    <div className="wg-page bg-gray-50 min-h-screen">
      {/* Header Compacto */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1920px] mx-auto px-6 py-2.5">
          {/* Linha 1: Voltar + Título + Status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/propostas")}
                className="text-gray-500 hover:text-gray-900 flex items-center gap-1 text-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-normal text-[#2E2E2E]">
                  Nova Proposta Comercial
                </h1>
                <p className="text-[16px] text-gray-500">
                  Defina escopo, valores e condições comerciais desta proposta
                </p>
              </div>
            </div>
            <Badge variant="default" size="sm">
              Rascunho
            </Badge>
          </div>

          {/* Linha 2: Ações + BotÍo Principal */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleVisualizar}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Visualizar proposta"
            >
              <Eye className="w-3.5 h-3.5" />
              Visualizar
            </button>
            <button
              type="button"
              onClick={handleGerarPDF}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Gerar PDF"
            >
              <FileText className="w-3.5 h-3.5" />
              Gerar PDF
            </button>
            <button
              type="button"
              onClick={handleEnviarEmail}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Enviar por e-mail"
            >
              <Mail className="w-3.5 h-3.5" />
              E-mail
            </button>
            <button
              type="button"
              onClick={handleEnviarWhatsApp}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors"
              title="Enviar por WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp
            </button>
            <button
              type="button"
              onClick={handleSalvarDrive}
              disabled={salvandoNoDrive}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-xs font-medium flex items-center gap-1.5 transition-colors disabled:opacity-50"
              title="Salvar no Google Drive"
            >
              <Cloud className="w-3.5 h-3.5" />
              {salvandoNoDrive ? "Salvando..." : "Drive"}
            </button>

            <div className="flex-1" />

            {/* BotÍo Salvar Alterações (quando editando) */}
            {isEdicao && propostaId && (
              <button
                type="button"
                onClick={atualizarPropostaExistente}
                disabled={salvando || !clienteSelecionado || itensProposta.length === 0}
                className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            )}

            {/* BotÍo Gerar Contrato (quando proposta já existe e nÍo está editando) */}
            {propostaId && !isEdicao && (
              <button
                type="button"
                onClick={() => navigate(`/contratos/novo?proposta_id=${propostaId}`)}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <FileCheck className="w-3.5 h-3.5" />
                Gerar Contrato
              </button>
            )}

            {/* BotÍo Salvar Proposta (quando criando nova) */}
            {!propostaId && (
              <button
                type="button"
                onClick={salvarProposta}
                disabled={salvando || !clienteSelecionado || itensProposta.length === 0}
                className="px-4 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {salvando ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Salvar Proposta</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Layout de 3 Colunas */}
      <div className="max-w-[1920px] mx-auto p-6">
        <div className="grid grid-cols-12 gap-6">

          {/* ============================================================ */}
          {/* COLUNA 1: CLIENTE E CONTEXTO (25%) */}
          {/* ============================================================ */}
          <div className="col-span-3 space-y-6">

            {/* Card: Cliente */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                Cliente
              </h3>

              <div className="mb-4 relative">
                <input
                  type="text"
                  placeholder="Buscar cliente (nome, CPF, email)..."
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    buscarClientes(e.target.value);
                  }}
                  onFocus={() => {
                    if (clientesEncontrados.length > 0) {
                      setMostrarResultadosBusca(true);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent text-sm"
                />

                {/* Dropdown de resultados */}
                {mostrarResultadosBusca && clientesEncontrados.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {clientesEncontrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        onClick={() => selecionarCliente(cliente)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
                      >
                        <p className="font-medium text-gray-900 text-sm">{cliente.nome}</p>
                        <p className="text-xs text-gray-600">
                          {cliente.cpf && `CPF: ${cliente.cpf}`}
                          {cliente.email && ` • ${cliente.email}`}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {clienteSelecionado ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F25C26] to-[#e04a1a] flex items-center justify-center text-white font-normal">
                      {clienteSelecionado.nome.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-normal text-gray-900">{clienteSelecionado.nome}</p>
                      <div className="flex items-center gap-2 flex-wrap mt-1">
                        <Badge variant="success" size="sm">
                          {clienteSelecionado.status === "novo" ? "Novo" :
                           clienteSelecionado.status === "em_obra" ? "Em Obra" : "Recorrente"}
                        </Badge>
                        {analiseVinculadaId && (
                          <Badge variant="default" size="sm" className="bg-blue-50 text-blue-600 border-blue-200">
                            📋 Análise Importada
                          </Badge>
                        )}
                        {quantitativoVinculadoId && (
                          <Badge variant="default" size="sm" className="bg-purple-50 text-purple-600 border-purple-200">
                            📦 Quantitativo Importado
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-200 space-y-2 text-sm">
                    {clienteSelecionado.cpf && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span>CPF:</span>
                        <span className="font-mono">•••.•••.{clienteSelecionado.cpf.slice(-6)}</span>
                      </div>
                    )}
                    {clienteSelecionado.telefone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span>{clienteSelecionado.telefone}</span>
                      </div>
                    )}
                    {clienteSelecionado.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>{clienteSelecionado.email}</span>
                      </div>
                    )}
                  </div>

                  <button className="w-full mt-3 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium">
                    Ver Jornada Completa
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  }
                  title="Nenhum cliente selecionado"
                  description="Busque e selecione um cliente para continuar"
                />
              )}
            </div>

            {/* Card: Ambientes */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                  Ambientes
                </h3>
                <div className="flex items-center gap-3">
                  <button
                    onClick={abrirModalImportar}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Importar
                  </button>
                  <button
                  onClick={abrirNovoAmbiente}
                  className="text-[#F25C26] hover:text-[#e04a1a] text-sm font-medium"
                >
                  + Adicionar
                </button>
                </div>
              </div>

              {ambientes.length > 0 ? (
                <div className="space-y-3">
                  {ambientes.map((amb) => (
                    <div
                      key={amb.id}
                      className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-[#F25C26] hover:bg-orange-50 transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div
                          className="flex-1 cursor-pointer"
                          onClick={() => abrirEdicaoAmbiente(amb)}
                          title="Clique para editar"
                        >
                          <p className="font-normal text-sm text-gray-900">{amb.nome}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            {amb.largura.toFixed(2)} × {amb.comprimento.toFixed(2)}m | Pé-direito: {amb.pe_direito.toFixed(2)}m
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => abrirEdicaoAmbiente(amb)}
                            className="p-1.5 text-gray-400 hover:text-[#F25C26] hover:bg-orange-100 rounded transition-colors"
                            title="Editar ambiente"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={(e) => excluirAmbiente(amb, e)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                            title="Excluir ambiente"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Piso:</span>
                          <span className="font-normal ml-1">{amb.area_piso.toFixed(2)}m²</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Parede:</span>
                          <span className="font-normal ml-1">{amb.area_parede.toFixed(2)}m²</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Teto:</span>
                          <span className="font-normal ml-1">{amb.area_teto.toFixed(2)}m²</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* LINHA DE TOTAIS */}
                  {ambientes.length > 0 && (
                    <div className="p-3 bg-primary rounded-lg border-2 border-[#F25C26]">
                      <p className="font-normal text-sm text-white mb-2">📊 TOTAIS</p>
                      <div className="grid grid-cols-4 gap-2 text-xs text-white">
                        <div>
                          <span className="opacity-90">Piso:</span>
                          <p className="font-normal text-sm">{totaisAmbientes.area_piso.toFixed(2)}m²</p>
                        </div>
                        <div>
                          <span className="opacity-90">Parede:</span>
                          <p className="font-normal text-sm">{totaisAmbientes.area_parede.toFixed(2)}m²</p>
                        </div>
                        <div>
                          <span className="opacity-90">Teto:</span>
                          <p className="font-normal text-sm">{totaisAmbientes.area_teto.toFixed(2)}m²</p>
                        </div>
                        <div>
                          <span className="opacity-90">Perímetro:</span>
                          <p className="font-normal text-sm">{totaisAmbientes.perimetro.toFixed(2)}ml</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Nenhum ambiente cadastrado
                </p>
              )}
            </div>

            {/* Card: Plano de Reforma */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                    Plano de Reforma
                  </h3>
                </div>
                <button
                  onClick={abrirModalPlanoReforma}
                  className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Importar com IA
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Faça upload da imagem do plano de reforma e a IA irá identificar automaticamente os serviços e ambientes, criando os itens da proposta.
              </p>
              <p className="text-xs text-purple-600 mt-2">
                O documento será salvo no Google Drive do cliente.
              </p>
            </div>

            {/* Card: Importar Contrato Completo */}
            <div className="bg-white border-2 border-emerald-200 rounded-xl p-6 shadow-sm bg-gradient-to-br from-emerald-50 to-teal-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                      Importar Contrato
                    </h3>
                    <span className="text-xs text-emerald-600 font-medium">NOVO</span>
                  </div>
                </div>
                <button
                  onClick={abrirModalImportarContrato}
                  className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center gap-1.5"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Importar Completo
                </button>
              </div>
              <p className="text-sm text-gray-600">
                Importe um contrato existente e a IA extrai <strong>TUDO</strong>: itens, valores, pagamentos, cronograma e dados do cliente.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Itens + Valores</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Pagamento</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Cronograma</span>
                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">Cliente</span>
              </div>
            </div>

            {/* Card: Condições Comerciais */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                Condições Comerciais
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento
                  </label>
                  <select
                    value={condicoesComerciais.forma_pagamento}
                    onChange={(e) => setCondicoesComerciais({...condicoesComerciais, forma_pagamento: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                  >
                    <option value="a_vista">À Vista</option>
                    <option value="parcelado">Parcelado</option>
                    <option value="etapas">Sinal + Etapas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      % Entrada
                    </label>
                    <input
                      type="number"
                      value={condicoesComerciais.percentual_entrada}
                      onChange={(e) => setCondicoesComerciais({...condicoesComerciais, percentual_entrada: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Parcelas
                    </label>
                    <input
                      type="number"
                      value={condicoesComerciais.numero_parcelas}
                      onChange={(e) => setCondicoesComerciais({...condicoesComerciais, numero_parcelas: Number(e.target.value)})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade (dias)
                  </label>
                  <input
                    type="number"
                    value={condicoesComerciais.validade_dias}
                    onChange={(e) => setCondicoesComerciais({...condicoesComerciais, validade_dias: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prazo ExecuçÍo (dias)
                  </label>
                  <input
                    type="number"
                    value={condicoesComerciais.prazo_execucao_dias}
                    onChange={(e) => setCondicoesComerciais({...condicoesComerciais, prazo_execucao_dias: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                  />
                </div>

                {/* Pagamento com CartÍo */}
                {condicoesComerciais.forma_pagamento === "parcelado" && (
                  <div className="border-t pt-4 mt-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={condicoesComerciais.pagamento_cartao}
                        onChange={(e) => setCondicoesComerciais({...condicoesComerciais, pagamento_cartao: e.target.checked})}
                        className="w-4 h-4 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                      />
                      <span className="text-sm font-medium text-gray-700">
                        Pagamento com CartÍo de Crédito
                      </span>
                    </label>

                    {condicoesComerciais.pagamento_cartao && (
                      <div className="mt-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-orange-700">
                            Taxa do cartÍo ({condicoesComerciais.numero_parcelas}x)
                          </span>
                          <span className="font-normal text-orange-700">
                            {taxaCartaoPerc.toFixed(2)}%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-orange-600">Valor da taxa</span>
                          <span className="font-medium text-orange-600">
                            {formatarMoeda(valorTaxaCartao)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-orange-200">
                          <span className="text-sm font-normal text-gray-800">
                            Total c/ cartÍo
                          </span>
                          <span className="text-lg font-normal text-[#F25C26]">
                            {formatarMoeda(totalComCartao)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ============================================================ */}
          {/* COLUNA 2: PRICE LIST INTELIGENTE (35%) */}
          {/* ============================================================ */}
          <div className="col-span-4 space-y-6">

            {/* Card: Busca e Filtros */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="mb-4">
                <input
                  type="text"
                  value={buscaGlobal}
                  onChange={(e) => setBuscaGlobal(e.target.value)}
                  placeholder="Buscar itens, materiais, serviços..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-sm"
                />
              </div>

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setFiltroCategoria(null)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    !filtroCategoria
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFiltroCategoria("material")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filtroCategoria === "material"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Materiais
                </button>
                <button
                  onClick={() => setFiltroCategoria("mao_obra")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filtroCategoria === "mao_obra"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  MÆo de obra
                </button>
                <button
                  onClick={() => setFiltroCategoria("servico")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filtroCategoria === "servico"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Servi‡os
                </button>
                <button
                  onClick={() => setFiltroCategoria("produto")}
                  className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    filtroCategoria === "produto"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Produtos
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 mb-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Categoria</label>
                  <select
                    value={filtroCategoriaPricelist || ""}
                    onChange={(e) =>
                      setFiltroCategoriaPricelist(
                        e.target.value ? e.target.value : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Subcategoria</label>
                  <select
                    value={filtroSubcategoria || ""}
                    onChange={(e) =>
                      setFiltroSubcategoria(e.target.value ? e.target.value : null)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="">Todas as subcategorias</option>
                    {subcategoriasDisponiveis.map((subcategoria) => (
                      <option key={subcategoria} value={subcategoria}>
                        {subcategoria}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Ambiente</label>
                  <select
                    value={filtroAmbienteCatalogo || ""}
                    onChange={(e) =>
                      setFiltroAmbienteCatalogo(
                        e.target.value ? e.target.value : null
                      )
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="">Todos os ambientes</option>
                    {ambientesCatalogo.map((ambiente) => (
                      <option key={ambiente} value={ambiente}>
                        {ambiente}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("blocos")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    viewMode === "blocos"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🔲 Blocos
                </button>
                <button
                  onClick={() => setViewMode("lista")}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium ${
                    viewMode === "lista"
                      ? "bg-primary text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  ≡ Lista
                </button>
              </div>
            </div>

            {/* Resultados de Busca Global */}
            {buscaGlobal.trim() && itensFiltradosBusca.length > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                  Resultados da busca ({itensFiltradosBusca.length})
                </h3>

                <div className="space-y-3 max-h-[600px] overflow-y-auto">
                  {itensFiltradosBusca.map((item) => (
                    <ItemCard
                      key={item.id}
                      item={item}
                      ambientes={ambientes}
                      onAdicionar={adicionarItemProposta}
                      onComparar={abrirComparador}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Nenhum Item Encontrado - OpçÍo de Adicionar */}
            {buscaGlobal.trim() && itensFiltradosBusca.length === 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-normal text-gray-900 mb-2">
                    Nenhum item encontrado
                  </h3>
                  <p className="text-sm text-gray-600 mb-4">
                    NÍo encontramos "{buscaGlobal}" no catálogo.
                    <br />
                    Deseja cadastrar um novo item?
                  </p>
                  <button
                    type="button"
                    onClick={abrirModalNovoItem}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 mx-auto"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Adicionar Novo Item
                  </button>
                </div>
              </div>
            )}

            {/* Lista de Categorias e Itens */}
            {!buscaGlobal.trim() && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                  Categorias
                </h3>

                <div className="space-y-2">
                  {categoriasVisiveis.map((categoria) => (
                  <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setCategoriaExpandida(categoriaExpandida === categoria ? null : categoria)}
                      className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-sm font-medium text-gray-900"
                    >
                      <span>{categoria}</span>
                      <span>{categoriaExpandida === categoria ? "▼" : "▶"}</span>
                    </button>

                    {categoriaExpandida === categoria && (
                      <div className="p-4 bg-white space-y-3">
                        {itensPriceList
                          .filter((item) => {
                            if (item.categoria !== categoria) return false;
                            if (!matchesFiltrosCatalogo(item)) return false;

                            return true;
                          })
                          .slice(0, 20)
                          .map((item) => (
                            <ItemCard
                              key={item.id}
                              item={item}
                              ambientes={ambientes}
                              onAdicionar={adicionarItemProposta}
                              onComparar={abrirComparador}
                            />
                          ))}
                      </div>
                    )}
                  </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card: IA - SugestÍo por Ambiente (movido para o final) */}
            {ambientes.length > 0 && (
              <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-sm font-normal text-purple-900">
                    SugestÍo Inteligente de Escopo
                  </h3>
                </div>

                <p className="text-sm text-purple-700 mb-3">
                  Deixe a IA sugerir todos os itens necessários para um ambiente
                </p>

                <select
                  value={ambienteIASelecionado || ""}
                  onChange={(e) => setAmbienteIASelecionado(e.target.value)}
                  className="w-full px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm mb-3"
                  aria-label="Selecionar ambiente para sugestÍo de escopo"
                >
                  <option value="">Selecione um ambiente</option>
                  {ambientes.map((amb) => (
                    <option key={amb.id} value={amb.id}>
                      {amb.nome}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => ambienteIASelecionado && sugerirItensPorAmbiente(ambienteIASelecionado)}
                  disabled={!ambienteIASelecionado}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
                >
                  Sugerir Escopo Completo
                </button>
              </div>
            )}

          </div>

          {/* ============================================================ */}
          {/* COLUNA 3: ITENS DA PROPOSTA (40%) */}
          {/* ============================================================ */}
          <div className="col-span-5 space-y-6">

            {/* Lista de Itens da Proposta */}
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide">
                  Itens da Proposta ({itensProposta.length})
                </h3>
              </div>

              {/* Filtros */}
              {itensProposta.length > 0 && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {/* Campo de Busca por Texto */}
                  <div className="mb-3">
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      🔍 Buscar nos itens
                    </label>
                    <input
                      type="text"
                      value={buscaItensProposta}
                      onChange={(e) => setBuscaItensProposta(e.target.value)}
                      placeholder="Digite para buscar... (nome, descriçÍo, código)"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Filtro por Ambiente */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🏠 Filtrar por Ambiente
                      </label>
                      <select
                        value={filtroAmbienteProposta || ""}
                        onChange={(e) => setFiltroAmbienteProposta(e.target.value || null)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                      >
                        <option value="">Todos os ambientes</option>
                        {ambientes.map((amb) => (
                          <option key={amb.id} value={amb.id}>
                            {amb.nome}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Filtro por Atividade (Categoria Principal) */}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        🔧 Filtrar por Atividade
                      </label>
                      <select
                        value={filtroAtividadeProposta || ""}
                        onChange={(e) => setFiltroAtividadeProposta(e.target.value || null)}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                      >
                        <option value="">Todas as atividades</option>
                        {/* Categorias únicas dos itens da proposta */}
                        {(() => {
                          // Extrair categorias únicas dos itens, usando categoria_id ou categoria string
                          const categoriasUsadas = new Map<string, string>();
                          itensProposta.forEach(item => {
                            // Prioriza categoria_id (se existir no item do pricelist)
                            const catId = (item.item as any).categoria_id;
                            if (catId && categoriaIdParaNome[catId]) {
                              categoriasUsadas.set(catId, categoriaIdParaNome[catId]);
                            } else if (item.item.categoria) {
                              // Fallback: usa categoria string diretamente
                              categoriasUsadas.set(item.item.categoria, item.item.categoria);
                            }
                          });
                          return Array.from(categoriasUsadas.entries())
                            .sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'))
                            .map(([id, nome]) => (
                              <option key={id} value={id}>
                                {nome}
                              </option>
                            ));
                        })()}
                      </select>
                    </div>
                  </div>
                  {(filtroAmbienteProposta || filtroAtividadeProposta || buscaItensProposta) && (
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-gray-600">
                        Mostrando {itensPropostaFiltrados.length} de {itensProposta.length} itens
                      </span>
                      <button
                        onClick={() => {
                          setFiltroAmbienteProposta(null);
                          setFiltroAtividadeProposta(null);
                          setBuscaItensProposta("");
                        }}
                        className="text-xs text-[#F25C26] hover:underline"
                      >
                        Limpar filtros
                      </button>
                    </div>
                  )}
                </div>
              )}

              {itensPropostaFiltrados.length > 0 ? (
                <div className="space-y-4">
                  {itensPropostaFiltrados.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#F25C26] transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl">
                          📦
                        </div>

                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-normal text-gray-900">{item.item.nome}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <Badge variant="default" size="sm">
                                  {item.item.categoria}
                                </Badge>
                                <Badge
                                  variant={
                                    item.item.tipo === "material" ? "info" :
                                    item.item.tipo === "mao_obra" ? "success" :
                                    item.item.tipo === "servico" ? "warning" :
                                    item.item.tipo === "produto" ? "primary" :
                                    "default"
                                  }
                                  size="sm"
                                >
                                  {item.item.tipo === "material" ? "Material" :
                                   item.item.tipo === "mao_obra" ? "MÍo de obra" :
                                   item.item.tipo === "servico" ? "Serviço" :
                                   item.item.tipo === "produto" ? "Produto" :
                                   item.item.tipo === "ambos" ? "Ambos" :
                                   item.item.tipo}
                                </Badge>
                                {/* Tags de ambiente clicáveis para filtrar */}
                                {(() => {
                                  // Combinar ambiente_id e ambientes_ids
                                  const todosAmbientesIds = [
                                    ...(item.ambiente_id ? [item.ambiente_id] : []),
                                    ...(item.ambientes_ids || [])
                                  ].filter((id, idx, arr) => arr.indexOf(id) === idx); // Remover duplicatas

                                  if (todosAmbientesIds.length === 0) return null;

                                  return (
                                    <>
                                      {todosAmbientesIds.slice(0, 3).map((ambId) => {
                                        const amb = ambientes.find(a => a.id === ambId);
                                        if (!amb) return null;
                                        return (
                                          <button
                                            key={ambId}
                                            type="button"
                                            onClick={() => setFiltroAmbienteProposta(ambId)}
                                            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full cursor-pointer transition-colors ${
                                              filtroAmbienteProposta === ambId
                                                ? "bg-emerald-500 text-white"
                                                : "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                            }`}
                                            title={`Filtrar por ${amb.nome} - ${item.item.unidade === "m2" ? `${amb.area_piso?.toFixed(1) || 0}m²` : `${amb.perimetro?.toFixed(1) || 0}ml`}`}
                                          >
                                            {amb.nome}
                                          </button>
                                        );
                                      })}
                                      {todosAmbientesIds.length > 3 && (
                                        <span className="text-xs text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">
                                          +{todosAmbientesIds.length - 3}
                                        </span>
                                      )}
                                    </>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {item.item.nucleo && (
                                <span
                                  className="text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{
                                    background: getEtiquetaNucleoColor(item.item.nucleo),
                                    color: "#FFFFFF",
                                  }}
                                >
                                  {getEtiquetaNucleoLabel(item.item.nucleo)}
                                </span>
                              )}
                              <button
                                onClick={() => abrirComparador(item.item)}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="Comparar preços"
                              >
                                🔍
                              </button>
                              <button
                                onClick={() => removerItemProposta(item.id)}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Remover"
                              >
                                🗑
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Quantidade <span className="text-blue-600" title="Você pode usar expressões: 2+2+6 = 10">🧮</span>
                              </label>
                              <input
                                type="text"
                                value={quantidadesEditando[item.id] ?? item.quantidade.toString()}
                                onChange={(e) => {
                                  setQuantidadesEditando({
                                    ...quantidadesEditando,
                                    [item.id]: e.target.value,
                                  });
                                }}
                                onBlur={(e) => {
                                  const valorDigitado = e.target.value;
                                  const resultado = avaliarExpressao(valorDigitado);
                                  const novosItens = itensProposta.map((i) =>
                                    i.id === item.id
                                      ? { ...i, quantidade: resultado }
                                      : i
                                  );
                                  setItensProposta(novosItens);
                                  // Limpar estado de ediçÍo
                                  const { [item.id]: _, ...resto } = quantidadesEditando;
                                  setQuantidadesEditando(resto);
                                }}
                                placeholder="Ex: 2+2+6"
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Valor Unit.
                              </label>
                              <input
                                type="number"
                                value={item.valor_unitario}
                                onChange={(e) => {
                                  const novosItens = itensProposta.map((i) =>
                                    i.id === item.id
                                      ? { ...i, valor_unitario: Number(e.target.value) }
                                      : i
                                  );
                                  setItensProposta(novosItens);
                                }}
                                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 mb-1">
                                Subtotal
                              </label>
                              <p className="text-sm font-normal text-gray-900 py-1">
                                {formatarMoeda(item.quantidade * item.valor_unitario)}
                              </p>
                            </div>
                          </div>

                          {/* Ambientes vinculados ao item */}
                          {ambientes.length > 0 && (
                            <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-xs font-medium text-gray-600">
                                  📍 Ambientes aplicados:
                                </span>
                                <div className="flex items-center gap-3">
                                  <button
                                    onClick={() => {
                                      // Adicionar todos os ambientes
                                      const todosAmbientesIds = ambientes.map(a => a.id);
                                      const novaQuantidade = ambientes.reduce((total, a) => {
                                        return total + (item.item.unidade === "m2" ? (a.area_piso || 0) : (a.perimetro || 0));
                                      }, 0);
                                      const novosItens = itensProposta.map((i) =>
                                        i.id === item.id
                                          ? { ...i, ambientes_ids: todosAmbientesIds, quantidade: novaQuantidade || item.quantidade, _mostrarSeletorAmbientes: false }
                                          : i
                                      );
                                      setItensProposta(novosItens as ItemProposta[]);
                                    }}
                                    className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                                    title="Adicionar todos os ambientes"
                                  >
                                    ++ Todos
                                  </button>
                                  <button
                                    onClick={() => {
                                      // Toggle para mostrar/ocultar seletor de ambientes
                                      const novosItens = itensProposta.map((i) =>
                                        i.id === item.id
                                          ? { ...i, _mostrarSeletorAmbientes: !((i as any)._mostrarSeletorAmbientes) }
                                          : i
                                      );
                                      setItensProposta(novosItens as ItemProposta[]);
                                    }}
                                    className="text-xs text-[#F25C26] hover:underline flex items-center gap-1"
                                  >
                                    + Adicionar ambiente
                                  </button>
                                </div>
                              </div>

                              {/* Ambientes selecionados */}
                              {(item.ambientes_ids && item.ambientes_ids.length > 0) ? (
                                <div className="flex flex-wrap gap-2">
                                  {item.ambientes_ids.map((ambId) => {
                                    const amb = ambientes.find(a => a.id === ambId);
                                    if (!amb) return null;
                                    return (
                                      <span
                                        key={ambId}
                                        className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                                      >
                                        {amb.nome}
                                        <span className="text-blue-600">
                                          ({item.item.unidade === "m2" ? `${amb.area_piso?.toFixed(1) || 0}m²` : `${amb.perimetro?.toFixed(1) || 0}ml`})
                                        </span>
                                        <button
                                          onClick={() => {
                                            const novosAmbientes = item.ambientes_ids?.filter(id => id !== ambId) || [];
                                            const novaQuantidade = novosAmbientes.reduce((total, id) => {
                                              const a = ambientes.find(amb => amb.id === id);
                                              if (!a) return total;
                                              return total + (item.item.unidade === "m2" ? (a.area_piso || 0) : (a.perimetro || 0));
                                            }, 0);
                                            const novosItens = itensProposta.map((i) =>
                                              i.id === item.id
                                                ? { ...i, ambientes_ids: novosAmbientes, quantidade: novaQuantidade || 1 }
                                                : i
                                            );
                                            setItensProposta(novosItens);
                                          }}
                                          className="ml-1 text-blue-600 hover:text-blue-800"
                                        >
                                          ✕
                                        </button>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 italic">Nenhum ambiente selecionado</span>
                              )}

                              {/* Seletor de ambientes (expansível) */}
                              {(item as any)._mostrarSeletorAmbientes && (
                                <div className="mt-2 pt-2 border-t border-gray-200">
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {ambientes
                                      .filter(amb => !item.ambientes_ids?.includes(amb.id))
                                      .map((amb) => (
                                        <button
                                          key={amb.id}
                                          onClick={() => {
                                            const novosAmbientes = [...(item.ambientes_ids || []), amb.id];
                                            const novaQuantidade = novosAmbientes.reduce((total, id) => {
                                              const a = ambientes.find(ambiente => ambiente.id === id);
                                              if (!a) return total;
                                              return total + (item.item.unidade === "m2" ? (a.area_piso || 0) : (a.perimetro || 0));
                                            }, 0);
                                            const novosItens = itensProposta.map((i) =>
                                              i.id === item.id
                                                ? { ...i, ambientes_ids: novosAmbientes, quantidade: novaQuantidade || item.quantidade, _mostrarSeletorAmbientes: false }
                                                : i
                                            );
                                            setItensProposta(novosItens as ItemProposta[]);
                                          }}
                                          className="p-2 text-left text-xs bg-white border border-gray-200 rounded hover:border-[#F25C26] hover:bg-orange-50 transition-colors"
                                        >
                                          <div className="font-medium text-gray-800">{amb.nome}</div>
                                          <div className="text-gray-500">
                                            {item.item.unidade === "m2"
                                              ? `${amb.area_piso?.toFixed(1) || 0}m²`
                                              : `${amb.perimetro?.toFixed(1) || 0}ml`}
                                          </div>
                                        </button>
                                      ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={
                    <svg className="w-16 h-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  }
                  title="Nenhum item adicionado"
                  description="Selecione itens da coluna ao lado para montar sua proposta"
                />
              )}
            </div>

            {/* Toggle Exibir Valores */}
            <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={exibirValoresNaProposta}
                  onChange={(e) => setExibirValoresNaProposta(e.target.checked)}
                  className="w-5 h-5 text-[#F25C26] border-gray-300 rounded focus:ring-[#F25C26]"
                />
                <div>
                  <span className="text-sm font-normal text-orange-900">
                    Exibir valores na proposta enviada ao cliente
                  </span>
                  <p className="text-xs text-orange-700 mt-1">
                    {exibirValoresNaProposta
                      ? "Cliente verá todos os valores e totais"
                      : "Cliente receberá apenas o escopo técnico, sem preços"}
                  </p>
                </div>
              </label>
            </div>

            {/* Informações Internas - Com Toggle */}
            {exibirValoresNaProposta && totais.total > 0 && (
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide flex items-center gap-2">
                    🔒 Informações Internas
                  </h3>
                  <button
                    type="button"
                    onClick={() => setMostrarInformacoesInternas(!mostrarInformacoesInternas)}
                    className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 flex items-center gap-1"
                  >
                    {mostrarInformacoesInternas ? (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                        Ocultar
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        Visualizar
                      </>
                    )}
                  </button>
                </div>

                {mostrarInformacoesInternas ? (
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Custo Estimado</p>
                      <p className="text-lg font-normal text-gray-900">
                        {formatarMoeda(custoEstimado)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Margem</p>
                      <p className="text-lg font-normal text-blue-600">
                        {margem.toFixed(2)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 mb-1">Lucro Projetado</p>
                      <p className="text-lg font-normal text-green-600">
                        {formatarMoeda(lucro)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">
                      Clique em "Visualizar" para ver custos, margem e lucro
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* IA - SugestÍo de Complementos */}
            {itensProposta.length > 0 && (
              <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">🤖</span>
                  <h3 className="text-sm font-normal text-green-900">
                    Itens Complementares Sugeridos
                  </h3>
                </div>

                <p className="text-sm text-green-700 mb-4">
                  Com base nos itens escolhidos, recomendo avaliar:
                </p>

                <div className="space-y-2">
                  {[
                    { nome: "Argamassa ACIII", valor: 120 },
                    { nome: "Rejunte branco", valor: 45 },
                    { nome: "Cunhas niveladoras", valor: 28 },
                  ].map((sugestao, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200"
                    >
                      <div>
                        <p className="text-sm font-normal text-gray-900">{sugestao.nome}</p>
                        <p className="text-xs text-gray-600">+ {formatarMoeda(sugestao.valor)}</p>
                      </div>
                      <button className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs font-medium">
                        + Adicionar
                      </button>
                    </div>
                  ))}
                </div>

                <button className="w-full mt-3 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium">
                  Adicionar Todos
                </button>
              </div>
            )}

            {/* Resumo por Núcleo */}
            {resumoPorNucleo.totalGeral > 0 && (
              <div className="bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-normal uppercase tracking-wide mb-4">
                  Resumo por Núcleo
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Arquitetura (total)</span>
                    <span className="text-lg font-normal">
                      {formatarMoeda(resumoPorNucleo.arquitetura)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Engenharia - MÍo de obra</span>
                    <span className="text-lg font-normal">
                      {formatarMoeda(resumoPorNucleo.engenhariaMaoObra)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Engenharia - Materiais</span>
                    <span className="text-lg font-normal">
                      {formatarMoeda(resumoPorNucleo.engenhariaMateriais)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Produtos</span>
                    <span className="text-lg font-normal">
                      {formatarMoeda(resumoPorNucleo.produtos)}
                    </span>
                  </div>
                  {resumoPorNucleo.marcenaria > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm opacity-90">Marcenaria (total)</span>
                      <span className="text-lg font-normal">
                        {formatarMoeda(resumoPorNucleo.marcenaria)}
                      </span>
                    </div>
                  )}
                  <div className="h-px bg-white/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-normal">TOTAL GERAL</span>
                    <span className="text-2xl font-normal">
                      {formatarMoeda(resumoPorNucleo.totalGeral)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Resumo Total */}
            {totais.total > 0 && (
              <div className="bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-sm font-normal uppercase tracking-wide mb-4">
                  Resumo da Proposta
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Materiais</span>
                    <span className="text-lg font-normal">{formatarMoeda(totais.materiais)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">MÍo de obra</span>
                    <span className="text-lg font-normal">{formatarMoeda(totais.maoObra)}</span>
                  </div>
                  <div className="h-px bg-white/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-normal">TOTAL GERAL</span>
                    <span className="text-2xl font-normal">{formatarMoeda(totais.total)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Ajuste de Valor Total */}
            {totais.total > 0 && !isVisualizacao && (
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <button
                  onClick={() => setMostrarAjusteValor(!mostrarAjusteValor)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🎯</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Ajustar Valor Total</p>
                      <p className="text-xs text-gray-500">Aplicar ajuste proporcional a todos os itens</p>
                    </div>
                  </div>
                  <span className="text-gray-400">{mostrarAjusteValor ? '▼' : '▶'}</span>
                </button>

                {mostrarAjusteValor && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Valor-alvo desejado
                      </label>
                      <input
                        type="text"
                        value={valorAlvo}
                        onChange={(e) => setValorAlvo(e.target.value)}
                        placeholder="Ex: 64400 ou R$ 64.400,00"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Valor atual: {formatarMoeda(totais.total)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={aplicarAjusteValor}
                        disabled={!valorAlvo.trim()}
                        className="flex-1 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        Aplicar Ajuste
                      </button>
                      <button
                        onClick={() => {
                          setMostrarAjusteValor(false);
                          setValorAlvo("");
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-800">
                        <strong>💡 Dica:</strong> O ajuste será aplicado proporcionalmente ao valor unitário de todos os {itensProposta.length} itens da proposta.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      </div>

      {/* Comparador Modal */}
      {mostrarComparador && itemComparador && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setMostrarComparador(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-normal text-gray-900">Comparador de Preços</h2>
              <button
                onClick={() => setMostrarComparador(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <p className="text-sm font-normal text-orange-900 mb-1">
                  💰 Nosso Preço
                </p>
                <p className="text-2xl font-normal text-orange-600">
                  {formatarMoeda(itemComparador.preco)}/{itemComparador.unidade}
                </p>
              </div>

              <div>
                <p className="text-sm font-normal text-gray-700 mb-3">
                  🌐 Fornecedores (Web)
                </p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-normal">Leroy Merlin</p>
                      <a href="#" className="text-xs text-blue-600 hover:underline">
                        Ver no site →
                      </a>
                    </div>
                    <p className="text-lg font-normal text-green-600">
                      {formatarMoeda(itemComparador.preco * 0.95)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm font-normal">C&C</p>
                      <a href="#" className="text-xs text-blue-600 hover:underline">
                        Ver no site →
                      </a>
                    </div>
                    <p className="text-lg font-normal text-red-600">
                      {formatarMoeda(itemComparador.preco * 1.05)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-sm font-normal text-blue-900 mb-1">
                  📊 Média Regional
                </p>
                <p className="text-xl font-normal text-blue-600">
                  {formatarMoeda(itemComparador.preco * 0.98)}/{itemComparador.unidade}
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm font-normal text-purple-900 mb-2">
                  🤖 IA Sugere
                </p>
                <p className="text-sm text-purple-700">
                  "Preço levemente acima da média regional. Margem sugerida: <strong>+8%</strong>.
                  Competitivo com fornecedores locais."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Seletor de Dados do Cliente (Análises e Quantitativos) */}
      {mostrarSeletorDados && clienteParaSeletor && (
        <SeletorDadosCliente
          clienteId={clienteParaSeletor.id}
          clienteNome={clienteParaSeletor.nome}
          onSelecionar={processarDadosSelecionados}
          onFechar={fecharSeletorDados}
        />
      )}

      {/* Indicador de importaçÍo de dados */}
      {importandoDados && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 flex flex-col items-center gap-3 shadow-xl">
            <div className="w-8 h-8 border-3 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-gray-700">Importando dados...</p>
          </div>
        </div>
      )}

      {/* Modal: Adicionar/Editar Ambiente */}
      {mostrarModalAmbiente && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={fecharModalAmbiente}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-[20px] font-normal text-gray-900">
                {editandoAmbiente ? "✏️ Editar Ambiente" : "➕ Adicionar Ambiente"}
              </h2>
              <button
                onClick={fecharModalAmbiente}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Nome do Ambiente
                </label>
                <input
                  type="text"
                  value={novoAmbiente.nome}
                  onChange={(e) => setNovoAmbiente({ ...novoAmbiente, nome: e.target.value })}
                  placeholder="Ex: Sala, Cozinha, Quarto..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                />
              </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      Largura (m)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={novoAmbienteCampos.largura}
                      onChange={(e) => atualizarCampoMedida("largura", e.target.value)}
                      onBlur={() => confirmarCampoMedida("largura")}
                      onKeyDown={(event) => handleMedidaKeyDown("largura", event)}
                      placeholder="Ex: 3,25 ou 2,5+4,1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                    <p className="text-xs text-gray-500 mt-1">Tab ou Enter somam automaticamente (suporta vírgula ou ponto).</p>
                  </div>

                  <div>
                    <label className="block text-sm font-normal text-gray-700 mb-2">
                      Comprimento (m)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={novoAmbienteCampos.comprimento}
                      onChange={(e) => atualizarCampoMedida("comprimento", e.target.value)}
                      onBlur={() => confirmarCampoMedida("comprimento")}
                      onKeyDown={(event) => handleMedidaKeyDown("comprimento", event)}
                      placeholder="Ex: 4,60 ou 3+2,4"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Área (m²) — opcional (preenche piso/parede/teto)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={novoAmbienteCampos.area}
                    onChange={(e) => atualizarCampoMedida("area", e.target.value)}
                    onBlur={() => confirmarCampoMedida("area")}
                    onKeyDown={(event) => handleMedidaKeyDown("area", event)}
                    placeholder="0,00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Se informado, largura/comprimento tornam-se opcionais e usaremos esta área para piso, paredes e teto.
                  </p>
                </div>

              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Pé-direito (m)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={novoAmbiente.pe_direito || ""}
                  onChange={(e) => setNovoAmbiente({ ...novoAmbiente, pe_direito: parseFloat(e.target.value) || 2.7 })}
                  placeholder="2.70"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                />
              </div>

              {novoAmbiente.largura > 0 && novoAmbiente.comprimento > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p className="text-xs font-normal text-gray-700 uppercase">Áreas calculadas:</p>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500">Piso</p>
                      <p className="font-normal text-gray-900">
                        {(novoAmbiente.largura * novoAmbiente.comprimento).toFixed(2)}m²
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Parede</p>
                      <p className="font-normal text-gray-900">
                        {(2 * (novoAmbiente.largura + novoAmbiente.comprimento) * novoAmbiente.pe_direito).toFixed(2)}m²
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Teto</p>
                      <p className="font-normal text-gray-900">
                        {(novoAmbiente.largura * novoAmbiente.comprimento).toFixed(2)}m²
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={fecharModalAmbiente}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={salvarAmbiente}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium"
                >
                  {editandoAmbiente ? "💾 Salvar" : "➕ Adicionar"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar Ambientes via IA (PDF/Imagem) */}
      {mostrarModalImportar && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={fecharModalImportar}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[20px] font-normal text-gray-900">Importar Ambientes com IA</h2>
                  <p className="text-sm text-gray-600 mt-1">Faça upload de uma planta para leitura automática</p>
                </div>
              </div>
              <button
                onClick={fecharModalImportar}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Upload de arquivo */}
              {!arquivoImportar && (
                <div>
                  <label
                    htmlFor="arquivo-importar"
                    className="block border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-2">Clique para selecionar ou arraste aqui</p>
                    <p className="text-sm text-gray-500">Imagem da planta: JPEG, PNG, GIF ou WebP (máx. 20MB)</p>
                    <p className="text-xs text-gray-400 mt-1">Para PDFs, converta para imagem antes de enviar</p>
                    <input
                      id="arquivo-importar"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleArquivoImportar}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Arquivo selecionado */}
              {arquivoImportar && (
                <div className="space-y-4">
                  {/* Info do arquivo */}
                  <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {arquivoImportar.type.startsWith("image/") ? (
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{arquivoImportar.name}</p>
                        <p className="text-sm text-gray-500">{(arquivoImportar.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setArquivoImportar(null);
                        setPreviewArquivo("");
                        setAmbientesExtraidos([]);
                        setMostrarResultadoIA(false);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      disabled={importando}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Preview da imagem */}
                  {previewArquivo && (
                    <div className="rounded-lg overflow-hidden border border-gray-200">
                      <img src={previewArquivo} alt="Preview" className="w-full h-64 object-contain bg-gray-50" loading="lazy" />
                    </div>
                  )}

                  {/* Barra de progresso */}
                  {importando && progressoAnalise > 0 && (
                    <div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 transition-all duration-300"
                          style={{ width: `${progressoAnalise}%` }}
                        />
                      </div>
                      <p className="text-sm text-center text-gray-600 mt-2">Analisando planta... {progressoAnalise}%</p>
                    </div>
                  )}

                  {/* BotÍo Analisar (se ainda nÍo analisou) */}
                  {!mostrarResultadoIA && !importando && (
                    <button
                      onClick={analisarArquivoComIA}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-normal hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      Analisar com IA
                    </button>
                  )}

                  {/* Resultado da análise */}
                  {mostrarResultadoIA && ambientesExtraidos.length > 0 && (
                    <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                      <div className="flex items-center gap-2 mb-4">
                        <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h4 className="font-normal text-green-900">Análise concluída!</h4>
                        <span className="ml-auto text-sm text-green-700 font-medium">
                          {ambientesExtraidos.length} ambiente(s) encontrado(s)
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-2">
                        {ambientesExtraidos.map((amb, idx) => (
                          <div key={idx} className="bg-white rounded-lg p-3 border border-green-100">
                            <div className="flex items-center justify-between">
                              <p className="font-normal text-gray-900">{amb.nome}</p>
                              {amb.area && (
                                <span className="text-sm text-purple-600 font-medium">{amb.area.toFixed(2)} m²</span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 mt-1 flex gap-4">
                              {amb.largura && <span>Larg: {amb.largura.toFixed(2)}m</span>}
                              {amb.comprimento && <span>Comp: {amb.comprimento.toFixed(2)}m</span>}
                              {amb.pe_direito && <span>PD: {amb.pe_direito.toFixed(2)}m</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Botões de açÍo */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={fecharModalImportar}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  disabled={importando}
                >
                  Cancelar
                </button>
                {mostrarResultadoIA && ambientesExtraidos.length > 0 && (
                  <button
                    onClick={importarAmbientesExtraidos}
                    disabled={importando}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importando ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Importando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Importar {ambientesExtraidos.length} Ambiente(s)
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar Plano de Reforma com IA */}
      {mostrarModalPlanoReforma && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={fecharModalPlanoReforma}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[20px] font-normal text-gray-900">Importar Plano de Reforma</h2>
                  <p className="text-sm text-gray-600 mt-1">A IA irá identificar serviços e criar itens automaticamente</p>
                </div>
              </div>
              <button
                onClick={fecharModalPlanoReforma}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              {/* Tabs: Upload de Imagem ou Colar Texto */}
              {!mostrarResultadoPlano && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setModoTextoPlano(false);
                      setTextoPlanoReforma("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      !modoTextoPlano
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Imagem
                  </button>
                  <button
                    onClick={() => {
                      setModoTextoPlano(true);
                      setArquivoPlanoReforma(null);
                      setPreviewPlanoReforma("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      modoTextoPlano
                        ? "bg-white text-purple-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Colar Texto
                  </button>
                </div>
              )}

              {/* Modo Texto: Colar plano de reforma */}
              {modoTextoPlano && !mostrarResultadoPlano && (
                <div>
                  <textarea
                    value={textoPlanoReforma}
                    onChange={(e) => setTextoPlanoReforma(e.target.value)}
                    placeholder="Cole aqui o texto do plano de reforma...&#10;&#10;Exemplo:&#10;SALA DE ESTAR&#10;- Pintura das paredes em branco gelo&#10;- Troca do piso por porcelanato 60x60&#10;&#10;COZINHA&#10;- InstalaçÍo de bancada em granito preto&#10;- ColocaçÍo de revestimento tipo metrô branco"
                    className="w-full h-64 p-4 border-2 border-purple-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all resize-none text-gray-700"
                    disabled={importandoPlano}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Cole o texto do plano de reforma. A IA irá identificar automaticamente os ambientes e atividades.
                  </p>
                </div>
              )}

              {/* Modo Imagem: Upload de arquivo */}
              {!modoTextoPlano && !arquivoPlanoReforma && !mostrarResultadoPlano && (
                <div>
                  <label
                    htmlFor="arquivo-plano-reforma"
                    className="block border-2 border-dashed border-purple-300 rounded-xl p-8 text-center cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all"
                  >
                    <svg className="w-16 h-16 mx-auto text-purple-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-2">Faça upload do Plano de Reforma</p>
                    <p className="text-sm text-gray-500">Imagem: JPEG, PNG, GIF ou WebP (máx. 20MB)</p>
                    <p className="text-xs text-purple-600 mt-2">A IA identificará os serviços e ambientes automaticamente</p>
                    <input
                      id="arquivo-plano-reforma"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleArquivoPlanoReforma}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Arquivo selecionado (apenas no modo imagem) */}
              {!modoTextoPlano && arquivoPlanoReforma && !mostrarResultadoPlano && (
                <div className="space-y-4">
                  {/* Info do arquivo */}
                  <div className="bg-purple-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{arquivoPlanoReforma.name}</p>
                        <p className="text-sm text-gray-500">{(arquivoPlanoReforma.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setArquivoPlanoReforma(null);
                        setPreviewPlanoReforma("");
                        setItensPlanoExtraidos([]);
                        setMostrarResultadoPlano(false);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      disabled={importandoPlano}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  {/* Preview da imagem */}
                  {previewPlanoReforma && (
                    <div className="rounded-lg overflow-hidden border border-purple-200">
                      <img src={previewPlanoReforma} alt="Preview" className="w-full h-64 object-contain bg-gray-50" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {/* Barra de progresso (funciona para ambos os modos) */}
              {importandoPlano && progressoPlano > 0 && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-indigo-600 h-2 transition-all duration-300"
                      style={{ width: `${progressoPlano}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 mt-2">
                    {salvandoNoDrive ? "Salvando no Google Drive..." : `Analisando plano de reforma... ${progressoPlano}%`}
                  </p>
                </div>
              )}

              {/* BotÍo Analisar (funciona para ambos os modos) */}
              {!mostrarResultadoPlano && !importandoPlano && (arquivoPlanoReforma || (modoTextoPlano && textoPlanoReforma.trim())) && (
                <button
                  onClick={analisarPlanoReformaComIA}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg font-normal hover:from-purple-600 hover:to-indigo-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analisar com IA
                </button>
              )}

              {/* Resultado da análise */}
              {mostrarResultadoPlano && itensPlanoExtraidos.length > 0 && (
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h4 className="font-normal text-green-900">Análise concluída!</h4>
                    <span className="ml-auto text-sm text-green-700 font-medium">
                      {itensPlanoExtraidos.length} serviço(s) identificado(s)
                    </span>
                  </div>

                  {/* Legenda de status */}
                  <div className="flex gap-4 mb-3 text-xs">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                      Vinculado ao Pricelist
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                      NÍo encontrado - vincule ou cadastre
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto space-y-2">
                    {itensPlanoExtraidos.map((item, idx) => (
                      <ItemMatcher
                        key={idx}
                        item={item}
                        index={idx}
                        itensPriceList={itensPriceList}
                        onVincular={vincularItemPlano}
                        onCadastrar={cadastrarItemPlano}
                      />
                    ))}
                  </div>

                  {/* Contador de itens vinculados */}
                  <div className="mt-3 pt-3 border-t border-green-200 flex justify-between text-sm">
                    <span className="text-green-700">
                      {itensPlanoExtraidos.filter(i => i.itemSugerido).length} de {itensPlanoExtraidos.length} itens vinculados
                    </span>
                    {itensPlanoExtraidos.some(i => !i.itemSugerido) && (
                      <span className="text-orange-600">
                        {itensPlanoExtraidos.filter(i => !i.itemSugerido).length} item(s) pendente(s)
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Botões de açÍo */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={fecharModalPlanoReforma}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  disabled={importandoPlano}
                >
                  Cancelar
                </button>
                {mostrarResultadoPlano && itensPlanoExtraidos.length > 0 && (
                  <button
                    onClick={adicionarItensPlanoReforma}
                    disabled={importandoPlano}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importandoPlano ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {salvandoNoDrive ? "Salvando..." : "Adicionando..."}
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Adicionar {itensPlanoExtraidos.length} Item(s) à Proposta
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Importar Contrato Completo com IA */}
      {mostrarModalImportarContrato && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={fecharModalImportarContrato}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-[20px] font-normal text-gray-900">Importar Contrato Completo</h2>
                  <p className="text-sm text-gray-600 mt-1">A IA extrai itens, valores, pagamento, cronograma e cliente</p>
                </div>
              </div>
              <button
                onClick={fecharModalImportarContrato}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                x
              </button>
            </div>

            <div className="space-y-6">
              {/* Tabs: Upload ou Colar Texto */}
              {!mostrarResultadoContrato && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => {
                      setModoTextoContrato(false);
                      setTextoContrato("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      !modoTextoContrato
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Upload Imagem
                  </button>
                  <button
                    onClick={() => {
                      setModoTextoContrato(true);
                      setArquivoContrato(null);
                      setPreviewContrato("");
                    }}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                      modoTextoContrato
                        ? "bg-white text-emerald-700 shadow-sm"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Colar Texto
                  </button>
                </div>
              )}

              {/* Modo Texto */}
              {modoTextoContrato && !mostrarResultadoContrato && (
                <div>
                  <textarea
                    value={textoContrato}
                    onChange={(e) => setTextoContrato(e.target.value)}
                    placeholder="Cole aqui o texto do contrato...&#10;&#10;Exemplo:&#10;CONTRATO DE PRESTACAO DE SERVICOS&#10;&#10;CONTRATANTE: Joao da Silva, CPF 123.456.789-00&#10;&#10;ITENS:&#10;1. Pintura sala - R$ 2.500,00&#10;2. Troca piso cozinha 15m2 - R$ 4.500,00&#10;&#10;PAGAMENTO:&#10;30% entrada + 3x parcelas&#10;Total: R$ 7.000,00&#10;&#10;PRAZO: 45 dias"
                    className="w-full h-64 p-4 border-2 border-emerald-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all resize-none text-gray-700"
                    disabled={importandoContrato}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Cole o texto completo do contrato. A IA extrai automaticamente todos os dados.
                  </p>
                </div>
              )}

              {/* Modo Imagem */}
              {!modoTextoContrato && !arquivoContrato && !mostrarResultadoContrato && (
                <div>
                  <label
                    htmlFor="arquivo-contrato"
                    className="block border-2 border-dashed border-emerald-300 rounded-xl p-8 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-all"
                  >
                    <svg className="w-16 h-16 mx-auto text-emerald-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-gray-700 font-medium mb-2">Faca upload do Contrato</p>
                    <p className="text-sm text-gray-500">Imagem: JPEG, PNG, GIF ou WebP (max. 20MB)</p>
                    <p className="text-xs text-emerald-600 mt-2">A IA extrai itens, valores, pagamento e cronograma</p>
                    <input
                      id="arquivo-contrato"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                      onChange={handleArquivoContrato}
                      className="hidden"
                    />
                  </label>
                </div>
              )}

              {/* Arquivo selecionado */}
              {!modoTextoContrato && arquivoContrato && !mostrarResultadoContrato && (
                <div className="space-y-4">
                  <div className="bg-emerald-50 rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{arquivoContrato.name}</p>
                        <p className="text-sm text-gray-500">{(arquivoContrato.size / 1024).toFixed(0)} KB</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setArquivoContrato(null);
                        setPreviewContrato("");
                        setDadosContratoExtraidos(null);
                        setMostrarResultadoContrato(false);
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      disabled={importandoContrato}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  {previewContrato && (
                    <div className="rounded-lg overflow-hidden border border-emerald-200">
                      <img src={previewContrato} alt="Preview" className="w-full h-64 object-contain bg-gray-50" loading="lazy" />
                    </div>
                  )}
                </div>
              )}

              {/* Barra de progresso */}
              {importandoContrato && progressoContrato > 0 && (
                <div>
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-600 h-2 transition-all duration-300"
                      style={{ width: `${progressoContrato}%` }}
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 mt-2">
                    Analisando contrato... {progressoContrato}%
                  </p>
                </div>
              )}

              {/* Botao Analisar */}
              {!mostrarResultadoContrato && !importandoContrato && (arquivoContrato || (modoTextoContrato && textoContrato.trim())) && (
                <button
                  onClick={analisarContratoComIA}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg font-normal hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Analisar Contrato com IA
                </button>
              )}

              {/* Resultado da analise */}
              {mostrarResultadoContrato && dadosContratoExtraidos && (
                <div className="space-y-4">
                  {/* Resumo */}
                  <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-2 mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <h4 className="font-normal text-green-900">Contrato analisado com sucesso!</h4>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-normal text-emerald-600">{dadosContratoExtraidos.itens?.length || 0}</div>
                        <div className="text-xs text-gray-500">Itens</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-normal text-emerald-600">
                          {dadosContratoExtraidos.pagamento?.valor_total
                            ? `R$ ${(dadosContratoExtraidos.pagamento.valor_total / 1000).toFixed(0)}k`
                            : "-"}
                        </div>
                        <div className="text-xs text-gray-500">Valor Total</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-normal text-emerald-600">
                          {dadosContratoExtraidos.pagamento?.parcelas || "-"}x
                        </div>
                        <div className="text-xs text-gray-500">Parcelas</div>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center">
                        <div className="text-2xl font-normal text-emerald-600">
                          {dadosContratoExtraidos.cronograma?.prazo_dias || "-"}
                        </div>
                        <div className="text-xs text-gray-500">Dias</div>
                      </div>
                    </div>
                  </div>

                  {/* Cliente */}
                  {dadosContratoExtraidos.cliente?.nome && (
                    <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                      <h5 className="font-normal text-blue-900 text-sm mb-1">Cliente Identificado</h5>
                      <p className="text-blue-800">{dadosContratoExtraidos.cliente.nome}</p>
                      {dadosContratoExtraidos.cliente.email && (
                        <p className="text-sm text-blue-600">{dadosContratoExtraidos.cliente.email}</p>
                      )}
                    </div>
                  )}

                  {/* Lista de Itens */}
                  <div className="bg-white rounded-lg border border-gray-200 p-3">
                    <h5 className="font-normal text-gray-900 text-sm mb-2">Itens Extraidos ({dadosContratoExtraidos.itens?.length || 0})</h5>

                    {/* Legenda de status */}
                    <div className="flex gap-4 mb-3 text-xs">
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Vinculado ao Pricelist
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                        NÍo encontrado - vincule ou cadastre
                      </span>
                    </div>

                    <div className="max-h-64 overflow-y-auto space-y-2">
                      {dadosContratoExtraidos.itens?.map((item, idx) => (
                        <ItemMatcher
                          key={idx}
                          item={{
                            ambiente: item.ambiente || "",
                            atividade: item.atividade || "",
                            descricao: item.descricao || "",
                            itemSugerido: item.itemSugerido,
                          }}
                          index={idx}
                          itensPriceList={itensPriceList}
                          onVincular={vincularItemContrato}
                          onCadastrar={cadastrarItemContrato}
                        />
                      ))}
                    </div>

                    {/* Contador de itens vinculados */}
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between text-sm">
                      <span className="text-green-700">
                        {dadosContratoExtraidos.itens?.filter(i => i.itemSugerido).length || 0} de {dadosContratoExtraidos.itens?.length || 0} itens vinculados
                      </span>
                      {dadosContratoExtraidos.itens?.some(i => !i.itemSugerido) && (
                        <span className="text-orange-600">
                          {dadosContratoExtraidos.itens?.filter(i => !i.itemSugerido).length || 0} item(s) pendente(s)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Botoes */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={fecharModalImportarContrato}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancelar
                </button>
                {mostrarResultadoContrato && dadosContratoExtraidos && (
                  <button
                    onClick={aplicarDadosContrato}
                    disabled={importandoContrato}
                    className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {importandoContrato ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Aplicando...
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Aplicar na Proposta
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adicionar Novo Item ao Pricelist */}
      {mostrarModalNovoItem && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6"
          onClick={() => setMostrarModalNovoItem(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-[20px] font-normal text-gray-900">Adicionar Novo Item</h2>
                <p className="text-sm text-gray-600 mt-1">Cadastre um item e adicione à proposta</p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarModalNovoItem(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Nome do Item */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Nome do Item *
                </label>
                <input
                  type="text"
                  value={novoItem.nome}
                  onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                  placeholder="Ex: RegularizaçÍo de parede"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                />
              </div>

              {/* DescriçÍo */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  DescriçÍo
                </label>
                <textarea
                  value={novoItem.descricao}
                  onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                  placeholder="DescriçÍo detalhada do item..."
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] resize-none"
                />
              </div>

              {/* Núcleo */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Núcleo *
                </label>
                <select
                  value={novoItem.nucleo_id}
                  onChange={(e) => setNovoItem({ ...novoItem, nucleo_id: e.target.value })}
                  title="Selecione o núcleo do item"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                >
                  <option value="">Selecione um núcleo</option>
                  {nucleosDisponiveis.map((nucleo) => (
                    <option key={nucleo.id} value={nucleo.id}>
                      {nucleo.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Tipo *
                </label>
                <select
                  value={novoItem.tipo}
                  onChange={(e) => setNovoItem({ ...novoItem, tipo: e.target.value as any })}
                  title="Selecione o tipo do item"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                >
                  <option value="material">Material</option>
                  <option value="mao_obra">MÍo de obra</option>
                  <option value="servico">Serviço</option>
                  <option value="produto">Produto</option>
                </select>
              </div>

              {/* Categoria */}
              <div>
                <label className="block text-sm font-normal text-gray-700 mb-2">
                  Categoria
                </label>
                <input
                  type="text"
                  value={novoItem.categoria}
                  onChange={(e) => setNovoItem({ ...novoItem, categoria: e.target.value })}
                  placeholder="Ex: Pintura, Elétrica, Hidráulica..."
                  list="categorias-existentes"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                />
                <datalist id="categorias-existentes">
                  {categorias.map((cat) => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Unidade */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Unidade *
                  </label>
                  <select
                    value={novoItem.unidade}
                    onChange={(e) => setNovoItem({ ...novoItem, unidade: e.target.value as any })}
                    title="Selecione a unidade de medida"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="un">Unidade (un)</option>
                    <option value="m2">Metro² (m²)</option>
                    <option value="ml">Metro Linear (ml)</option>
                    <option value="diaria">Diária</option>
                    <option value="hora">Hora</option>
                    <option value="empreita">Empreita</option>
                  </select>
                </div>

                {/* Preço */}
                <div>
                  <label className="block text-sm font-normal text-gray-700 mb-2">
                    Preço (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={novoItem.preco || ""}
                    onChange={(e) => setNovoItem({ ...novoItem, preco: parseFloat(e.target.value) || 0 })}
                    placeholder="0,00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setMostrarModalNovoItem(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                  disabled={salvandoNovoItem}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={salvarNovoItem}
                  disabled={salvandoNovoItem || !novoItem.nome.trim() || !novoItem.nucleo_id || novoItem.preco <= 0}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {salvandoNovoItem ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Salvar e Adicionar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

