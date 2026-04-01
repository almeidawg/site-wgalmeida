/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PropostaEmissaoPageV3 - Wizard-Style Flow
// Sistema WG Easy - Grupo WG Almeida
// Layout: Passo 1 (Cliente) > Passo 2 (Orçamento) > Passo 3 (Revisar)
// ============================================================

import { useState, useCallback, useEffect, useMemo, type ComponentType } from "react";
import { useNavigate, useSearchParams, useParams, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Loader2,
  User,
  Search,
  Home,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
  DollarSign,
  Building2,
  Hammer,
  Paintbrush,
  ShoppingBag,
  Settings,
  Layers,
  CheckCircle,
  AlertCircle,
  Link2,
  LinkIcon,
  AlertTriangle,
  X,
  Upload,
  Sparkles,
  ClipboardList,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

// Hooks
import { useAmbientes } from "../hooks/useAmbientes";
import { usePricelistBusca } from "../hooks/usePricelistBusca";
import { useItensProposta, setSalvarNoPricelist } from "../hooks/useItensProposta";
import { useCondicoesComerciais } from "../hooks/useCondicoesComerciais";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

// Componentes
import PricelistBusca from "./PricelistBusca";
import ImportarAnaliseModal from "./ImportarAnaliseModal";

// Types
import type { Cliente, Ambiente, ItemPricelist, ItemProposta, GrupoNucleo, UnidadeItem } from "../types";
import { getTaxaCartao } from "../types";
import { useConfiguracoesPagamento } from "@/hooks/useConfiguracoesPagamento";
import type { NucleoItem } from "@/types/propostas";
import type { ItemUnit, TipoPricelist } from "@/types/pricelist";

// APIs
import { criarProposta, buscarProposta, atualizarProposta } from "@/lib/propostasApi";
import { listarAmbientesPorProposta, criarAmbientesEmLote, deletarAmbientesPorProposta } from "@/lib/ambientesApi";
import { listarAnalisesAprovadas, listarAnalisesPorCliente, buscarAnalise, listarServicosSelecionados } from "@/lib/analiseProjetoApi";
import { buscarItem, listarCategorias, listarSubcategorias, type PricelistCategoria, type PricelistSubcategoria } from "@/lib/pricelistApi";
import { listarNucleos, type Nucleo } from "@/lib/nucleosApi";
import { formatarMoeda } from "@/lib/utils";
import { gerarPropostaAutomatica } from "@/lib/gerarPropostaAutomatica";
import { TYPOGRAPHY } from "@/constants/typography";
import { calcularDataTermino, calcularDiasUteisRestantes, formatarDiasUteis } from "@/lib/diasUteisUtils";

// Cores dos nucleos
const CORES_NUCLEO = {
  arquitetura: { cor: "#5E9B94", label: "Arquitetura", icon: Building2 },
  engenharia: { cor: "#2B4580", label: "Engenharia", icon: Hammer },
  marcenaria: { cor: "#8B5E3C", label: "Marcenaria", icon: Paintbrush },
  produtos: { cor: "#F25C26", label: "Produtos", icon: ShoppingBag },
  sem_nucleo: { cor: "#6B7280", label: "Outros", icon: Package },
};

// Passos do Wizard
type WizardStep = {
  id: number;
  nome: string;
  descricao: string;
  icon: ComponentType<{ className?: string }>;
};

const WIZARD_STEPS: WizardStep[] = [
  { id: 1, nome: "Cliente", descricao: "Dados e Ambientes", icon: User },
  { id: 2, nome: "Orçamento", descricao: "Itens e Materiais", icon: Package },
  { id: 3, nome: "Revisar", descricao: "Condições e Salvar", icon: ClipboardList },
];

// Componente de Indicador de Passos
function StepIndicator({ steps, currentStep, onStepClick }: {
  steps: WizardStep[];
  currentStep: number;
  onStepClick?: (step: number) => void;
}) {
  return (
    <div className="w-full flex items-center gap-3 py-2">
      {steps.map((step, index) => {
        const isActive = step.id === currentStep;
        const isCompleted = step.id < currentStep;
        const Icon = step.icon;

        return (
          <div key={step.id} className="flex flex-1 items-center min-w-0">
            <button
              onClick={() => onStepClick?.(step.id)}
              disabled={!onStepClick}
              className={`w-full flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                isActive
                  ? "bg-primary text-white shadow-lg"
                  : isCompleted
                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-normal ${
                isActive ? "bg-white/20" : isCompleted ? "bg-green-500 text-white" : "bg-gray-300"
              }`}>
                {isCompleted ? <CheckCircle className={TYPOGRAPHY.iconSmall} /> : step.id}
              </div>
              <div className="hidden sm:block text-left">
                <p className={TYPOGRAPHY.cardTitle}>{step.nome}</p>
                <p className={`${TYPOGRAPHY.cardSubtitle} ${isActive ? "!text-white/80" : ""}`}>{step.descricao}</p>
              </div>
            </button>
            {index < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${isCompleted ? "bg-green-500" : "bg-gray-300"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface AnaliseDisponivel {
  id: string;
  titulo: string;
  numero?: string;
  status: string;
  criado_em: string;
  tipo_projeto?: string;
  area_total?: number;
}

interface FiltroItensProposta {
  ambienteId: string;
  categoriaId: string;
  subcategoriaId: string;
  busca: string;
}

function isUuid(value?: string | null): boolean {
  if (!value) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function sanitizeUuid(value?: string | null): string | null {
  return isUuid(value) ? value! : null;
}

export default function PropostaEmissaoPageV3() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const isVisualizacao = location.pathname.includes("/visualizar");

  // Verificar se usuário é master para habilitar ediçÍo automática no pricelist
  const { isMaster, isAdminOuMaster } = useUsuarioLogado();

  // Habilitar salvamento automático no pricelist quando usuário é master
  useEffect(() => {
    setSalvarNoPricelist(isAdminOuMaster);
    return () => setSalvarNoPricelist(false); // Desabilitar ao desmontar
  }, [isAdminOuMaster]);

  // Hook de configuraçÍo de pagamento para taxas de cartÍo dinâmicas (Supabase)
  const { config: configPagamento } = useConfiguracoesPagamento();
  const getTaxaCartaoAtual = useCallback((parcelas: number): number => {
    if (configPagamento?.taxas_cartao?.length) {
      const taxa = configPagamento.taxas_cartao.find(t => t.parcelas === parcelas);
      if (taxa) return taxa.percentual;
      const max = configPagamento.taxas_cartao[configPagamento.taxas_cartao.length - 1];
      if (parcelas >= max.parcelas) return max.percentual;
    }
    return getTaxaCartao(parcelas); // fallback hardcoded
  }, [configPagamento]);

  // Parametros da URL
  const oportunidadeId = searchParams.get("oportunidade_id");
  const clienteIdParam = searchParams.get("cliente_id");

  // Estado do cliente
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [buscandoCliente, setBuscandoCliente] = useState(false);

  // Estado da analise
  const [analisesDisponiveis, setAnalisesDisponiveis] = useState<AnaliseDisponivel[]>([]);
  const [analiseSelecionada, setAnaliseSelecionada] = useState<string | null>(null);
  const [carregandoAnalises, setCarregandoAnalises] = useState(false);

  // Estado de salvamento
  const [salvando, setSalvando] = useState(false);
  const [propostaId, setPropostaId] = useState<string | null>(id || null);
  const [loading, setLoading] = useState(!!id);
  const [propostaCriadoEm, setPropostaCriadoEm] = useState<string | null>(null);

  // Estado do Wizard
  const [passoAtual, setPassoAtual] = useState(1);

  // Ambientes expandidos
  const [ambientesExpandidos, setAmbientesExpandidos] = useState<Set<string>>(new Set());

  // Modal ediçÍo de ambiente
  const [ambienteEditandoId, setAmbienteEditandoId] = useState<string | null>(null);

  // Modal importar analise (para escopo IA)
  const [modalImportarAnalise, setModalImportarAnalise] = useState(false);

  // IA: insights de precificaçÍo após importar análise
  const [insightPrecificacao, setInsightPrecificacao] = useState<{
    totalM2: number;
    areaTotal: number;
    precoM2: number;
    itensVinculados: number;
    itensTotal: number;
  } | null>(null);

  // GeraçÍo automática de proposta
  const [gerandoAutomatica, setGerandoAutomatica] = useState(false);

  // Itens não encontrados no pricelist (para popup)
  interface ItemNaoEncontrado {
    id: string;
    nome: string;
    descricao?: string;
    categoria: string;
    ambiente?: string;
    quantidade: number;
    unidade: string;
  }
  const [itensNaoEncontrados, setItensNaoEncontrados] = useState<ItemNaoEncontrado[]>([]);
  const [modalItensNaoEncontrados, setModalItensNaoEncontrados] = useState(false);
  const [buscaVinculoModal, setBuscaVinculoModal] = useState<Record<string, string>>({});

  // Dialog "Deseja incluir material?"
  const [mostrarDialogMaterial, setMostrarDialogMaterial] = useState(false);
  const [jaGeradoAutomatica, setJaGeradoAutomatica] = useState(false);

  // Hooks customizados
  const {
    ambientes,
    totais: totaisAmbientes,
    adicionar: adicionarAmbiente,
    atualizar: atualizarAmbiente,
    remover: removerAmbiente,
    importar: importarAmbientes,
    setAmbientes,
  } = useAmbientes();

  // Ambiente em ediçÍo (precisa estar após useAmbientes para ter acesso à variável ambientes)
  const ambienteEditando = ambienteEditandoId ? ambientes.find(a => a.id === ambienteEditandoId) : null;

  const {
    itens: itensPricelist,
    itensFiltrados,
    loading: loadingPricelist,
    filtros,
    setFiltros,
    buscar,
  } = usePricelistBusca();

  const {
    itens: itensProposta,
    totais,
    totaisPorNucleo: totaisPorNucleoGeral,
    gruposPorNucleo,
    adicionar: adicionarItem,
    adicionarMultiplos,
    remover: removerItem,
    atualizarQuantidade,
    atualizarNome,
    atualizarNucleo,
    atualizarCategoria,
    atualizarSubcategoria,
    atualizarTipo,
    setItens: setItensProposta,
  } = useItensProposta();

  // Estado das categorias, subcategorias e núcleos
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<PricelistSubcategoria[]>([]);
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [filtroItens, setFiltroItens] = useState<FiltroItensProposta>({
    ambienteId: "",
    categoriaId: "",
    subcategoriaId: "",
    busca: "",
  });

  const handleFiltroItensChange = (changes: Partial<FiltroItensProposta>) => {
    setFiltroItens((prev) => {
      const atualizado = { ...prev, ...changes };
      if (changes.categoriaId && changes.categoriaId !== prev.categoriaId) {
        atualizado.subcategoriaId = "";
      }
      return atualizado;
    });
  };

  const subcategoriasFiltradas = useMemo(() => {
    if (!filtroItens.categoriaId) return subcategorias;
    return subcategorias.filter((sub) => sub.categoria_id === filtroItens.categoriaId);
  }, [subcategorias, filtroItens.categoriaId]);

  const filtrosAtivos = Boolean(
    filtroItens.ambienteId ||
    filtroItens.categoriaId ||
    filtroItens.subcategoriaId ||
    filtroItens.busca
  );

  const mensagemSemItens = filtrosAtivos
    ? "Nenhum item corresponde aos filtros aplicados"
    : "Nenhum item na proposta";

  const {
    condicoes,
    atualizarCampo,
    setCondicoes,
  } = useCondicoesComerciais(totais.total);

  const totalBruto = totais.total || 0;
  const tipoDesconto = condicoes.tipo_desconto === "valor" ? "valor" : "percentual";
  const descontoPercentualInput = Math.max(0, Number(condicoes.desconto_percentual || 0));
  const descontoValorInput = Math.max(0, Number(condicoes.desconto_valor || 0));

  const descontoValorAplicado = useMemo(() => {
    if (totalBruto <= 0) return 0;
    if (tipoDesconto === "valor") return Math.min(descontoValorInput, totalBruto);
    return Math.min((totalBruto * descontoPercentualInput) / 100, totalBruto);
  }, [tipoDesconto, descontoValorInput, descontoPercentualInput, totalBruto]);

  const descontoPercentualAplicado = useMemo(() => {
    if (totalBruto <= 0) return 0;
    return (descontoValorAplicado / totalBruto) * 100;
  }, [descontoValorAplicado, totalBruto]);

  const totalComDesconto = useMemo(() => {
    return Math.max(0, totalBruto - descontoValorAplicado);
  }, [totalBruto, descontoValorAplicado]);

  // Taxa de administraçÍo
  const taxaAdmPercentual = Math.max(0, Number(condicoes.taxa_adm_percentual || 0));
  const valorTaxaAdm = useMemo(() => {
    return totalComDesconto * (taxaAdmPercentual / 100);
  }, [totalComDesconto, taxaAdmPercentual]);

  const totalSemCartao = useMemo(() => {
    return totalComDesconto + valorTaxaAdm;
  }, [totalComDesconto, valorTaxaAdm]);

  // Taxa de cartÍo de crédito (aplicada sobre o saldo)
  const taxaCartaoInfo = useMemo(() => {
    if (condicoes.metodo_saldo !== "cartao_credito" || totalSemCartao <= 0) {
      return { percentual: 0, valorTaxa: 0, totalComCartao: totalSemCartao };
    }
    const parcelasCartao = condicoes.parcelas_cartao_saldo || condicoes.numero_parcelas;
    const taxaPerc = getTaxaCartaoAtual(parcelasCartao);
    const valorSaldo = totalSemCartao * (1 - (condicoes.percentual_entrada || 30) / 100);
    const valorTaxa = valorSaldo * (taxaPerc / 100);
    return { percentual: taxaPerc, valorTaxa, totalComCartao: totalSemCartao + valorTaxa };
  }, [totalSemCartao, condicoes.metodo_saldo, condicoes.parcelas_cartao_saldo, condicoes.numero_parcelas, condicoes.percentual_entrada]);

  const totalFinal = taxaCartaoInfo.totalComCartao;

  // Buscar clientes
  const buscarClientes = useCallback(async (termo: string) => {
    if (!termo || termo.length < 2) {
      setClientesEncontrados([]);
      return;
    }

    try {
      setBuscandoCliente(true);
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, cpf, email, telefone")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido")
        .ilike("nome", `%${termo}%`)
        .limit(10);

      if (!error) {
        setClientesEncontrados((data || []) as Cliente[]);
      }
    } finally {
      setBuscandoCliente(false);
    }
  }, []);

  // Debounce da busca
  useEffect(() => {
    const timer = setTimeout(() => buscarClientes(buscaCliente), 300);
    return () => clearTimeout(timer);
  }, [buscaCliente, buscarClientes]);

  // Carregar categorias, subcategorias e núcleos ao iniciar
  useEffect(() => {
    async function carregarDadosBase() {
      try {
        const [categoriasData, subcategoriasData, nucleosData] = await Promise.all([
          listarCategorias(),
          listarSubcategorias(),
          listarNucleos()
        ]);
        setCategorias(categoriasData);
        setSubcategorias(subcategoriasData);
        setNucleos(nucleosData);
      } catch (error) {
        console.error("Erro ao carregar dados base:", error);
      }
    }
    carregarDadosBase();
  }, []);

  // Carregar analises quando cliente muda
  useEffect(() => {
    if (clienteSelecionado) {
      carregarAnalisesDoCliente(clienteSelecionado.id);
    } else {
      setAnalisesDisponiveis([]);
      setAnaliseSelecionada(null);
    }
  }, [clienteSelecionado]);

  // Carregar proposta existente quando há ID na URL (modo ediçÍo)
  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }

    async function carregarProposta() {
      try {
        setLoading(true);
        const propostaIdUrl = id;
        if (!propostaIdUrl) return;
        const proposta = await buscarProposta(propostaIdUrl);
        console.log(`[carregarProposta] Proposta carregada: ${propostaIdUrl} (status: ${proposta.status || "N/A"})`);
        console.log(`[carregarProposta] Itens retornados pela API: ${proposta.itens?.length || 0}`);
        setPropostaCriadoEm((proposta as any)?.criado_em || (proposta as any)?.created_at || null);

        // Carregar cliente
        if (proposta.cliente_id) {
          const { data: clienteData } = await supabase
            .from("pessoas")
            .select("id, nome, cpf, email, telefone")
            .eq("id", proposta.cliente_id)
            .single();

          if (clienteData) {
            setClienteSelecionado(clienteData as Cliente);
          }
        }

        // ============================================================
        // PASSO 1: Carregar itens com valores exatos do DB
        // Os itens salvos já contêm o fatorDistribuicao embutido (desconto, taxa adm,
        // taxa cartÍo distribuídos proporcionalmente). Ao editar, carregamos os valores
        // como estÍo e iniciamos condições comerciais zeradas para evitar dupla aplicaçÍo.
        // ============================================================
        if (proposta.itens && proposta.itens.length > 0) {
          const itensFormatados = proposta.itens
            .filter((item: any) => {
              if (!item.pricelist_item_id) return true;
              if (item.pricelist_item_id.startsWith("avulso-")) return true;
              if (!item.nome || item.nome.trim() === "") {
                console.warn(`[carregarProposta] Item sem nome removido: ${item.id}`);
                return false;
              }
              return true;
            })
            .map((item: any) => ({
              id: item.id || `${Date.now()}-${Math.random().toString(36).substring(7)}`,
              item: {
                id: item.pricelist_item_id || `avulso-${item.id}`,
                codigo: item.codigo,
                nome: item.nome,
                descricao: item.descricao,
                categoria: item.categoria,
                categoria_id: item.categoria_id || null,
                subcategoria: item.subcategoria,
                subcategoria_id: item.subcategoria_id || null,
                tipo: item.tipo || "material",
                unidade: item.unidade || "un",
                preco: item.valor_unitario || 0,
                nucleo: item.nucleo as NucleoItem | undefined,
                nucleo_id: item.nucleo_id || null,
              },
              ambiente_id: item.ambiente_id,
              quantidade: item.quantidade || 1,
              valor_unitario: item.valor_unitario || 0,
              descricao_customizada: item.descricao_customizada,
            }));

          console.log(`[carregarProposta] ${itensFormatados.length} itens válidos de ${proposta.itens.length} total`);
          setItensProposta(itensFormatados);
        } else {
          console.warn("[carregarProposta] Nenhum item retornado para a proposta.");
        }

        // ============================================================
        // PASSO 2: Carregar ambientes
        // ============================================================
        try {
          const ambientesDaProposta = await listarAmbientesPorProposta(propostaIdUrl);
          if (ambientesDaProposta && ambientesDaProposta.length > 0) {
            const ambientesFormatados = ambientesDaProposta.map((amb: any) => ({
              id: amb.id,
              nome: amb.nome,
              largura: amb.largura || 0,
              comprimento: amb.comprimento || 0,
              pe_direito: amb.pe_direito || 2.7,
              area_piso: amb.area_piso || 0,
              area_parede: amb.area_parede || 0,
              area_paredes_bruta: amb.area_paredes_bruta || amb.area_parede || 0,
              area_paredes_liquida: amb.area_paredes_liquida || amb.area_parede || 0,
              area_teto: amb.area_teto || 0,
              perimetro: amb.perimetro || 0,
              portas: amb.portas || [],
              janelas: amb.janelas || [],
              vaos: amb.vaos || [],
              area_vaos_total: amb.area_vaos_total || 0,
            }));
            setAmbientes(ambientesFormatados);
            console.log(`[carregarProposta] ${ambientesFormatados.length} ambientes carregados`);
          }
        } catch (ambError) {
          console.warn("[carregarProposta] Erro ao carregar ambientes:", ambError);
        }

        // Condições comerciais: restaurar forma de pagamento, prazos, etc.
        // Desconto/taxa/cartÍo ficam zerados pois já estÍo distribuídos nos itens.
        // Se o usuário quiser aplicar novo ajuste, parte do zero sobre os valores atuais.
        setCondicoes({
          forma_pagamento: proposta.forma_pagamento || "parcelado",
          percentual_entrada: proposta.percentual_entrada || 30,
          numero_parcelas: proposta.numero_parcelas || 3,
          validade_dias: proposta.validade_dias || 30,
          prazo_execucao_dias: proposta.prazo_execucao_dias || 60,
          pagamento_cartao: false,
          observacoes: (proposta as any).observacoes || "",
          tipo_desconto: "percentual",
          desconto_percentual: 0,
          desconto_valor: 0,
          taxa_adm_percentual: 0,
          metodo_entrada: (proposta as any).metodo_entrada || undefined,
          metodo_saldo: undefined,
          parcelas_cartao_saldo: undefined,
        });

        setPropostaId(propostaIdUrl || null);

        // Ir direto para o passo 2 (Orçamento) ao editar proposta existente
        setPassoAtual(2);
      } catch (error) {
        console.error("Erro ao carregar proposta:", error);
        toast({
          title: "Erro",
          description: "não foi possível carregar a proposta",
          variant: "destructive",
        });
        navigate("/propostas");
      } finally {
        setLoading(false);
      }
    }

    carregarProposta();
  }, [id]);

  // Resolver categoria_id/nucleo_id faltantes quando categorias/nucleos forem carregados
  useEffect(() => {
    if (categorias.length === 0 || itensProposta.length === 0) return;

    const normCat = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    let atualizado = false;
    const itensCorrigidos = itensProposta.map(item => {
      let changed = false;
      const novoItem = { ...item, item: { ...item.item } };

      // Resolver categoria_id a partir do nome da categoria
      if (!novoItem.item.categoria_id && novoItem.item.categoria) {
        const catMatch = categorias.find(c =>
          normCat(c.nome) === normCat(novoItem.item.categoria) ||
          c.nome === novoItem.item.categoria
        );
        if (catMatch) {
          novoItem.item.categoria_id = catMatch.id;
          changed = true;
        }
      }

      // Resolver nucleo_id a partir do nome do nucleo
      if (!novoItem.item.nucleo_id && novoItem.item.nucleo && nucleos.length > 0) {
        const nucMatch = nucleos.find(n =>
          n.nome.toLowerCase() === (novoItem.item.nucleo || "").toLowerCase()
        );
        if (nucMatch) {
          novoItem.item.nucleo_id = nucMatch.id;
          changed = true;
        }
      }

      if (changed) atualizado = true;
      return changed ? novoItem : item;
    });

    if (atualizado) {
      console.log("[resolverIds] Corrigidos categoria_id/nucleo_id faltantes nos itens");
      setItensProposta(itensCorrigidos);
    }
  }, [categorias, nucleos, itensProposta.length]);

  async function carregarAnalisesDoCliente(clienteId: string) {
    try {
      setCarregandoAnalises(true);
      console.log(`[carregarAnalisesDoCliente] Iniciando para cliente: ${clienteId} (nome: ${clienteSelecionado?.nome || "N/A"})`);

      const statusValidos = ["analisado", "aprovado", "vinculado"];
      const analiseMap = new Map<string, any>();

      // 1. Buscar análises com cliente_id direto
      let analises = await listarAnalisesAprovadas(clienteId);
      for (const a of analises) {
        if (a.cliente_id === clienteId || !a.cliente_id) {
          analiseMap.set(a.id, a);
        }
      }

      // 2. Buscar análises vinculadas via oportunidade do cliente
      try {
        const { data: oportunidades } = await supabase
          .from("oportunidades")
          .select("id")
          .eq("cliente_id", clienteId);

        if (oportunidades && oportunidades.length > 0) {
          const opIds = oportunidades.map((o: any) => o.id);
          const { data: analisesPorOp } = await supabase
            .from("analises_projeto")
            .select("*")
            .in("oportunidade_id", opIds)
            .in("status", statusValidos)
            .order("criado_em", { ascending: false });

          if (analisesPorOp) {
            for (const a of analisesPorOp) {
              if (!analiseMap.has(a.id)) {
                analiseMap.set(a.id, a);
                console.log(`[carregarAnalisesDoCliente] Encontrada via oportunidade: ${a.titulo}`);
              }
            }
          }
        }
      } catch (err) {
        console.warn("[carregarAnalisesDoCliente] Erro ao buscar via oportunidades:", err);
      }

      // 3. Fallback: buscar todas do cliente se nenhuma encontrada
      if (analiseMap.size === 0) {
        console.log("[carregarAnalisesDoCliente] Nenhuma análise encontrada, buscando todas...");
        const todas = await listarAnalisesPorCliente(clienteId);
        for (const a of todas) {
          if (a.cliente_id === clienteId || !a.cliente_id) {
            analiseMap.set(a.id, a);
          }
        }
      }

      // Filtrar análises de OUTROS clientes (cliente_id diferente e não NULL)
      const analisesFinais = Array.from(analiseMap.values()).filter(
        (a: any) => !a.cliente_id || a.cliente_id === clienteId
      );

      console.log(`[carregarAnalisesDoCliente] Total: ${analisesFinais.length} análises para cliente ${clienteId}`);

      setAnalisesDisponiveis(analisesFinais.map((a: any) => ({
        id: a.id,
        titulo: a.titulo,
        numero: a.numero ?? undefined,
        status: a.status,
        criado_em: a.criado_em,
        tipo_projeto: a.tipo_projeto,
        area_total: a.area_total ?? undefined,
      })));
    } catch (err) {
      console.error("Erro ao carregar analises:", err);
    } finally {
      setCarregandoAnalises(false);
    }
  }

  // Stopwords em português para ignorar no matching
  const STOPWORDS = new Set([
    "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
    "para", "por", "com", "sem", "sob", "sobre", "ate", "entre",
    "um", "uma", "uns", "umas", "o", "a", "os", "as", "ao", "aos",
    "e", "ou", "que", "se", "mais", "menos", "muito", "pouco",
    "todo", "toda", "todos", "todas", "este", "esta", "esse", "essa",
    "tipo", "modelo", "marca", "cor", "tamanho", "padrao", "etc"
  ]);

  // FunçÍo para buscar melhor match no pricelist (versÍo melhorada)
  function buscarMelhorMatchPricelist(termo: string, categoria?: string): ItemPricelist | null {
    if (!termo || itensPricelist.length === 0) return null;

    const normalizar = (str: string) => str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const termoNorm = normalizar(termo);

    // Extrair palavras relevantes (excluindo stopwords e palavras curtas)
    const extrairPalavrasRelevantes = (str: string) =>
      str.split(/\s+/).filter(p => p.length > 2 && !STOPWORDS.has(p));

    const palavrasChaveTermo = extrairPalavrasRelevantes(termoNorm);

    let melhorMatch: { item: ItemPricelist | null; score: number; motivo: string } = { item: null, score: 0, motivo: "" };

    for (const item of itensPricelist) {
      const nomeNorm = normalizar(item.nome);
      const descNorm = normalizar(item.descricao || "");
      const palavrasChaveNome = extrairPalavrasRelevantes(nomeNorm);
      let score = 0;
      let motivo = "";

      // Match exato no nome (melhor caso)
      if (nomeNorm === termoNorm) {
        score = 1.0;
        motivo = "exato";
      }
      // Nome contém o termo completo
      else if (nomeNorm.includes(termoNorm)) {
        score = 0.85;
        motivo = "nome_contem_termo";
      }
      // Termo contém o nome completo (termo é mais específico)
      else if (termoNorm.includes(nomeNorm) && nomeNorm.length > 10) {
        score = 0.75;
        motivo = "termo_contem_nome";
      }
      // Match por palavras-chave relevantes
      else if (palavrasChaveTermo.length > 0 && palavrasChaveNome.length > 0) {
        // Contar matches exatos de palavras
        const matchesExatos = palavrasChaveTermo.filter(p => palavrasChaveNome.includes(p));
        // Contar matches parciais (substring)
        const matchesParciais = palavrasChaveTermo.filter(p =>
          !matchesExatos.includes(p) && palavrasChaveNome.some(pn => pn.includes(p) || p.includes(pn))
        );

        const totalPalavrasRelevantes = Math.max(palavrasChaveTermo.length, palavrasChaveNome.length);

        // Calcular score baseado em matches
        if (matchesExatos.length > 0) {
          // Mínimo 2 palavras-chave exatas para considerar válido, ou 1 se for palavra longa (>6 chars)
          const matchesSignificativos = matchesExatos.filter(m => m.length > 6).length;
          if (matchesExatos.length >= 2 || matchesSignificativos >= 1) {
            score = (matchesExatos.length / totalPalavrasRelevantes) * 0.7;
            score += (matchesParciais.length / totalPalavrasRelevantes) * 0.15;
            motivo = `palavras: ${matchesExatos.join(", ")}`;
          }
        }
      }

      // Bonus se categoria coincide
      const catItem = typeof item.categoria === "object"
        ? (item.categoria as { nome?: string } | null)?.nome
        : item.categoria;
      if (categoria && catItem) {
        const catNorm = normalizar(catItem);
        const catTermoNorm = normalizar(categoria);
        if (catNorm.includes(catTermoNorm) || catTermoNorm.includes(catNorm)) {
          score += 0.1;
        }
      }

      // Penalidade para itens que claramente não fazem sentido
      // Exemplo: se busca "pintura" mas encontrou "porcelanato", penalizar
      const termosPintura = ["pintura", "tinta", "latex", "acrilica"];
      const termosRevestimento = ["porcelanato", "ceramica", "piso", "revestimento"];
      const ehBuscaPintura = termosPintura.some(t => termoNorm.includes(t));
      const ehItemRevestimento = termosRevestimento.some(t => nomeNorm.includes(t));
      if (ehBuscaPintura && ehItemRevestimento) {
        score *= 0.3; // Penalidade severa
      }

      if (score > melhorMatch.score) {
        melhorMatch = { item, score: Math.min(score, 1), motivo };
      }
    }

    // Score mínimo aumentado para 0.6 (60%) para evitar falsos positivos
    if (melhorMatch.score >= 0.6) {
      console.log(`[Match] "${termo}" → "${melhorMatch.item?.nome}" (score: ${melhorMatch.score.toFixed(2)}, ${melhorMatch.motivo})`);
      return melhorMatch.item;
    }

    console.log(`[Match] "${termo}" → SEM MATCH (melhor score: ${melhorMatch.score.toFixed(2)})`);
    return null;
  }

  // Importar analise selecionada - COM MATCHING AUTOMÁTICO
  async function handleSelecionarAnalise(analiseId: string) {
    if (!analiseId) {
      setAnaliseSelecionada(null);
      return;
    }

    try {
      setAnaliseSelecionada(analiseId);
      setGerandoAutomatica(true);
      const analise = await buscarAnalise(analiseId);

      // Importar ambientes da analise
      let ambientesFormatados: Ambiente[] = [];
      if (analise.ambientes && analise.ambientes.length > 0) {
        ambientesFormatados = analise.ambientes.map((amb: any) => ({
          id: amb.id || `amb-${Date.now()}-${Math.random()}`,
          nome: amb.nome,
          largura: amb.largura || 0,
          comprimento: amb.comprimento || 0,
          pe_direito: amb.pe_direito || 2.7,
          area_piso: amb.area_piso || amb.area || (amb.largura * amb.comprimento) || 0,
          area_parede: amb.area_parede || 0,
          area_paredes_bruta: amb.area_paredes_bruta || amb.area_parede || 0,
          area_paredes_liquida: amb.area_paredes_liquida || amb.area_parede || 0,
          area_teto: amb.area_teto || amb.area_piso || amb.area || (amb.largura * amb.comprimento) || 0,
          perimetro: amb.perimetro || (amb.largura && amb.comprimento ? 2 * (amb.largura + amb.comprimento) : 0),
          portas: amb.portas || [],
          janelas: amb.janelas || [],
          vaos: amb.vaos || [],
          area_vaos_total: amb.area_vaos_total || 0,
        }));
        setAmbientes(ambientesFormatados);
        setAmbientesExpandidos(new Set());
      }

      // Importar servicos/itens da analise COM MATCHING AUTOMÁTICO
      const itensParaAdicionar: ItemProposta[] = [];
      const itensNaoEncontradosTemp: ItemNaoEncontrado[] = [];

      try {
        const servicos = await listarServicosSelecionados(analiseId);

        if (servicos && servicos.length > 0) {
          console.log(`[handleSelecionarAnalise] Processando ${servicos.length} serviços da análise`);

          for (const srv of servicos) {
            let itemPricelistMatch: ItemPricelist | null = null;

            console.log(`[handleSelecionarAnalise] Serviço: ${srv.descricao || "sem nome"}, pricelist_item_id: ${srv.pricelist_item_id || "nenhum"}`);

            // 1. Se tem pricelist vinculado, buscar item
            if (srv.pricelist_item_id) {
              try {
                const itemPricelist = await buscarItem(srv.pricelist_item_id);
                if (itemPricelist && itemPricelist.ativo !== false) {
                  // Verificar se o item existe na lista atual de itens do pricelist
                  const existeNoPricelist = itensPricelist.some(i => i.id === itemPricelist.id);
                  if (existeNoPricelist) {
                    itemPricelistMatch = {
                      ...itemPricelist,
                      fornecedor_id: itemPricelist.fornecedor_id || undefined,
                      fabricante: itemPricelist.fabricante || undefined,
                      modelo: itemPricelist.modelo || undefined,
                    } as unknown as ItemPricelist;
                    console.log(`[handleSelecionarAnalise] Item encontrado no pricelist: ${itemPricelist.nome}`);
                  } else {
                    console.warn(`[handleSelecionarAnalise] Item ${srv.pricelist_item_id} não está na lista ativa do pricelist, ignorando`);
                  }
                } else {
                  console.warn(`[handleSelecionarAnalise] Item ${srv.pricelist_item_id} inativo ou não encontrado`);
                }
              } catch (e) {
                console.warn("Item pricelist nao encontrado:", srv.pricelist_item_id);
              }
            }

            // 2. Se não tem vínculo, tentar matching automático pelo nome/descriçÍo
            if (!itemPricelistMatch && srv.descricao) {
              itemPricelistMatch = buscarMelhorMatchPricelist(srv.descricao, srv.categoria);
              if (itemPricelistMatch) {
                console.log(`[handleSelecionarAnalise] Match automático encontrado: ${itemPricelistMatch.nome} para "${srv.descricao}"`);
              }
            }

            // 3. Se encontrou match, adicionar à proposta
            if (itemPricelistMatch) {
              const categoriaStr = typeof itemPricelistMatch.categoria === 'object' && itemPricelistMatch.categoria
                ? (itemPricelistMatch.categoria as { nome?: string }).nome
                : (itemPricelistMatch.categoria as string | undefined);
              const nucleoStr = typeof itemPricelistMatch.nucleo === 'object' && itemPricelistMatch.nucleo
                ? (itemPricelistMatch.nucleo as { nome?: string }).nome
                : itemPricelistMatch.nucleo;
              const subcategoriaStr = typeof itemPricelistMatch.subcategoria === 'object' && itemPricelistMatch.subcategoria
                ? (itemPricelistMatch.subcategoria as { nome?: string }).nome
                : (itemPricelistMatch.subcategoria as string | undefined);
              const nucleoItem = nucleoStr && ['arquitetura', 'engenharia', 'marcenaria', 'produtos'].includes(nucleoStr.toLowerCase())
                ? nucleoStr.toLowerCase() as NucleoItem
                : "engenharia";

              // Calcular quantidade baseada no ambiente se não vier definida
              let quantidadeCalculada = srv.quantidade || 0;
              const unidadeItem = (itemPricelistMatch.unidade || "un").toLowerCase();
              const categoriaLower = (categoriaStr || "").toLowerCase();

              // Se não tem quantidade definida e tem ambiente, calcular baseado na metragem
              if (!quantidadeCalculada && srv.ambiente_id) {
                const ambienteDoItem = ambientesFormatados.find(a => a.id === srv.ambiente_id);
                if (ambienteDoItem) {
                  if (unidadeItem === "m2" || unidadeItem === "m²") {
                    // Determinar qual área usar baseado na categoria
                    const categoriasPiso = ["piso", "porcelanato", "ceramica", "vinilico", "laminado"];
                    const categoriasParede = ["parede", "revestimento", "azulejo", "pintura", "textura"];
                    const categoriasTeto = ["forro", "teto", "gesso", "drywall"];

                    if (categoriasParede.some(c => categoriaLower.includes(c))) {
                      quantidadeCalculada = ambienteDoItem.area_paredes_liquida || ambienteDoItem.area_parede || 0;
                    } else if (categoriasTeto.some(c => categoriaLower.includes(c))) {
                      quantidadeCalculada = ambienteDoItem.area_teto || ambienteDoItem.area_piso || 0;
                    } else {
                      // Piso ou padrÍo
                      quantidadeCalculada = ambienteDoItem.area_piso || 0;
                    }
                  } else if (unidadeItem === "m" || unidadeItem === "ml") {
                    // Metro linear - usar perímetro
                    quantidadeCalculada = ambienteDoItem.perimetro || 0;
                  }
                }
              }

              // Se ainda não tem quantidade, usar 1 como padrÍo
              if (!quantidadeCalculada || quantidadeCalculada <= 0) {
                quantidadeCalculada = 1;
              }

              itensParaAdicionar.push({
                id: `${Date.now()}-${Math.random().toString(36).substring(7)}`,
                item: {
                  id: itemPricelistMatch.id,
                  codigo: itemPricelistMatch.codigo ?? undefined,
                  nome: itemPricelistMatch.nome,
                  descricao: itemPricelistMatch.descricao ?? undefined,
                  categoria: categoriaStr || "geral",
                  categoria_id: itemPricelistMatch.categoria_id || null,
                  subcategoria: subcategoriaStr,
                  subcategoria_id: itemPricelistMatch.subcategoria_id || null,
                  tipo: itemPricelistMatch.tipo || "material",
                  unidade: (["m2", "ml", "un", "diaria", "hora", "empreita"].includes(String(itemPricelistMatch.unidade || "un"))
                    ? String(itemPricelistMatch.unidade || "un")
                    : "un") as ItemUnit,
                  preco: itemPricelistMatch.preco || 0,
                  nucleo: nucleoItem,
                },
                ambiente_id: srv.ambiente_id || undefined,
                ambientes_ids: srv.ambiente_id ? [srv.ambiente_id] : (srv.ambientes_nomes || []).map((nome: string) => {
                  const amb = ambientesFormatados.find(a => a.nome.toLowerCase() === nome.toLowerCase());
                  return amb?.id;
                }).filter((ambienteId): ambienteId is string => Boolean(ambienteId)),
                quantidade: Math.round(quantidadeCalculada * 100) / 100, // Arredondar para 2 casas decimais
                valor_unitario: itemPricelistMatch.preco || 0,
                descricao_customizada: srv.descricao,
              });
            } else {
              // 4. não encontrou - adicionar à lista de não encontrados
              const ambienteNome = ambientesFormatados.find(a => a.id === srv.ambiente_id)?.nome;
              itensNaoEncontradosTemp.push({
                id: srv.id,
                nome: srv.descricao || "Item sem nome",
                descricao: srv.descricao,
                categoria: srv.categoria || "geral",
                ambiente: ambienteNome,
                quantidade: srv.quantidade || 1,
                unidade: srv.unidade || "un",
              });
            }
          }

          if (itensParaAdicionar.length > 0) {
            adicionarMultiplos(itensParaAdicionar);
          }
        }
      } catch (errServicos) {
        console.error("Erro ao importar servicos:", errServicos);
      }

      // Mostrar modal se houver itens não encontrados
      if (itensNaoEncontradosTemp.length > 0) {
        setItensNaoEncontrados(itensNaoEncontradosTemp);
        setModalItensNaoEncontrados(true);
      }

      setGerandoAutomatica(false);
      toast({
        title: "Proposta gerada automaticamente",
        description: `${itensParaAdicionar.length} itens vinculados${itensNaoEncontradosTemp.length > 0 ? `, ${itensNaoEncontradosTemp.length} precisam de atençÍo` : ""}`,
      });

      // IA: calcular insight de precificaçÍo por m²
      const areaTotal = ambientesFormatados.reduce((acc, a) => acc + (a.area_piso || 0), 0);
      const totalItens = itensParaAdicionar.reduce((acc, i) => acc + (i.valor_unitario * i.quantidade), 0);
      if (areaTotal > 0 && totalItens > 0) {
        setInsightPrecificacao({
          totalM2: totalItens,
          areaTotal: Math.round(areaTotal * 100) / 100,
          precoM2: Math.round((totalItens / areaTotal) * 100) / 100,
          itensVinculados: itensParaAdicionar.length,
          itensTotal: itensParaAdicionar.length + itensNaoEncontradosTemp.length,
        });
      }
    } catch (err) {
      console.error("Erro ao importar analise:", err);
      setGerandoAutomatica(false);
      toast({
        title: "Erro",
        description: "Nao foi possivel carregar a analise",
        variant: "destructive",
      });
    }
  }

  // FunçÍo para limpar itens inválidos (órfÍos ou sem dados)
  const limparItensInvalidos = useCallback(() => {
    const itensValidos = itensProposta.filter(item => {
      // Verificar se tem nome válido
      if (!item.item.nome || item.item.nome.trim() === "") {
        console.log(`[limparItensInvalidos] Removendo item sem nome: ${item.id}`);
        return false;
      }
      // Verificar se o preço faz sentido (não pode ser negativo)
      if (item.valor_unitario < 0) {
        console.log(`[limparItensInvalidos] Removendo item com preço negativo: ${item.item.nome}`);
        return false;
      }
      return true;
    });

    const removidos = itensProposta.length - itensValidos.length;
    if (removidos > 0) {
      setItensProposta(itensValidos);
      toast({
        title: "Limpeza concluída",
        description: `${removidos} item(ns) inválido(s) removido(s)`,
      });
    } else {
      toast({
        title: "Nenhum item inválido",
        description: "Todos os itens da proposta sÍo válidos",
      });
    }
  }, [itensProposta, setItensProposta, toast]);

  // Handlers
  const handleSelecionarCliente = (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setBuscaCliente("");
    setClientesEncontrados([]);
    // Limpar dados anteriores
    setAmbientes([]);
    setItensProposta([]);
    setAnaliseSelecionada(null);
  };

  const handleAdicionarItem = useCallback((item: ItemPricelist, ambienteId?: string) => {
    adicionarItem(item, ambienteId || undefined, ambientes);
  }, [adicionarItem, ambientes]);

  const handleImportarAnalise = useCallback((dados: {
    ambientes: Ambiente[];
    itensSugeridos: any[];
    analiseId: string;
  }) => {
    if (dados.ambientes.length > 0) {
      importarAmbientes(dados.ambientes);
    }
    if (dados.itensSugeridos.length > 0) {
      adicionarMultiplos(dados.itensSugeridos);
    }
    // Salvar referência da análise para vincular à proposta
    if (dados.analiseId && !dados.analiseId.startsWith("escopo-")) {
      setAnaliseSelecionada(dados.analiseId);
    }
    setModalImportarAnalise(false);
  }, [importarAmbientes, adicionarMultiplos]);

  // Handler para gerar proposta automaticamente
  const handleGerarAutomatica = useCallback(async (incluirMateriais: boolean = true) => {
    if (!clienteSelecionado) {
      toast({ title: "AtençÍo", description: "Selecione um cliente primeiro", variant: "destructive" });
      return;
    }

    if (ambientes.length === 0) {
      toast({ title: "AtençÍo", description: "Importe ou adicione ambientes primeiro", variant: "destructive" });
      return;
    }

    if (itensPricelist.length === 0) {
      toast({ title: "AtençÍo", description: "Aguarde o carregamento do pricelist", variant: "destructive" });
      return;
    }

    try {
      setGerandoAutomatica(true);

      const resultado = await gerarPropostaAutomatica(ambientes, itensPricelist, {
        incluirMateriais,
      });

      if (resultado.itens.length > 0) {
        adicionarMultiplos(resultado.itens);
        setJaGeradoAutomatica(true);

        toast({
          title: "Proposta gerada!",
          description: `${resultado.resumo.itensGerados} itens adicionados automaticamente. Total: ${formatarMoeda(resultado.resumo.totalGeral)}`,
        });

        if (resultado.resumo.itensNaoEncontrados.length > 0) {
          console.warn("Itens não encontrados no pricelist:", resultado.resumo.itensNaoEncontrados);
        }
      } else {
        toast({
          title: "Nenhum item gerado",
          description: "não foi possível gerar itens automaticamente. Verifique os ambientes.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao gerar proposta:", error);
      toast({
        title: "Erro",
        description: "Falha ao gerar proposta automaticamente",
        variant: "destructive",
      });
    } finally {
      setGerandoAutomatica(false);
    }
  }, [clienteSelecionado, ambientes, itensPricelist, adicionarMultiplos, toast]);

  const normalizarCategoria = useCallback(
    (valor: string) =>
      valor.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim(),
    []
  );

  // Calcula áreas e perímetro a partir das dimensões do ambiente.
  // Se o backend não possuir triggers, garantimos salvar medidas consistentes.
  const calcularAreasAmbiente = useCallback((amb: Ambiente) => {
    const toNumber = (valor: any, fallback = 0) => {
      if (valor === null || valor === undefined) return fallback;
      if (typeof valor === "string") {
        const parsed = Number(valor.replace(",", "."));
        return Number.isFinite(parsed) ? parsed : fallback;
      }
      return Number.isFinite(Number(valor)) ? Number(valor) : fallback;
    };

    const largura = toNumber((amb as any).largura, 0);
    const comprimento = toNumber((amb as any).comprimento, 0);
    const pe = toNumber((amb as any).pe_direito, 2.7) || 2.7;

    const areaPisoCalc = largura * comprimento;
    const perimetroCalc = 2 * (largura + comprimento);

    const area_piso = amb.area_piso && amb.area_piso > 0 ? amb.area_piso : areaPisoCalc || 0;
    const perimetro = amb.perimetro && amb.perimetro > 0 ? amb.perimetro : perimetroCalc || 0;
    const area_teto = amb.area_teto && amb.area_teto > 0 ? amb.area_teto : area_piso;
    const area_parede =
      amb.area_parede && amb.area_parede > 0 ? amb.area_parede : perimetro * pe;

    return { largura, comprimento, pe_direito: pe, area_piso, perimetro, area_teto, area_parede };
  }, []);

  const resolverCategoriaPadrao = useCallback(
    (item: ItemProposta): string => {
      const categoriaAtual = item.item.categoria?.trim();
      if (categoriaAtual) return categoriaAtual;

      const nucleo = item.item.nucleo?.toLowerCase();
      if (nucleo === "marcenaria") {
        const categoriaMarcenaria = categorias.find((cat) =>
          normalizarCategoria(cat.nome).includes("marcenaria")
        );
        return categoriaMarcenaria?.nome ?? "Marcenaria";
      }

      return "";
    },
    [categorias, normalizarCategoria]
  );

  const handleSalvarProposta = useCallback(async () => {
    if (!clienteSelecionado) {
      toast({ title: "Atencao", description: "Selecione um cliente primeiro", variant: "destructive" });
      return;
    }

    if (itensProposta.length === 0) {
      toast({ title: "Atencao", description: "Adicione pelo menos um item a proposta", variant: "destructive" });
      return;
    }

    try {
      setSalvando(true);

      // Usar taxa de cartÍo já calculada em taxaCartaoInfo
      const taxaCartaoPercentual = taxaCartaoInfo.valorTaxa > 0 ? taxaCartaoInfo.percentual : null;
      const valorTaxaCartaoSalvar = taxaCartaoInfo.valorTaxa > 0 ? taxaCartaoInfo.valorTaxa : null;

      // Fator multiplicador para distribuir taxas nos itens:
      // totalFinal = totalBruto - desconto + taxaAdm + taxaCartao
      // fator = totalFinal / totalBruto (distribui proporcionalmente)
      const fatorDistribuicao = totalBruto > 0 ? totalFinal / totalBruto : 1;

      const valorRawMetadados = JSON.stringify({
        total_bruto: totalBruto,
        desconto_tipo: tipoDesconto,
        desconto_percentual: Number(descontoPercentualAplicado.toFixed(4)),
        desconto_valor: Number(descontoValorAplicado.toFixed(2)),
        taxa_adm_percentual: taxaAdmPercentual,
        valor_taxa_adm: Number(valorTaxaAdm.toFixed(2)),
        taxa_cartao_percentual: taxaCartaoPercentual,
        valor_taxa_cartao: valorTaxaCartaoSalvar ? Number(valorTaxaCartaoSalvar.toFixed(2)) : 0,
        total_liquido: Number(totalFinal.toFixed(2)),
      });

      const dadosProposta = {
        cliente_id: clienteSelecionado.id,
        oportunidade_id: oportunidadeId || undefined,
        analise_projeto_id: analiseSelecionada || undefined,
        titulo: `Proposta - ${clienteSelecionado.nome}`,
        descricao: `Proposta comercial para ${clienteSelecionado.nome}`,
        forma_pagamento: condicoes.forma_pagamento || "parcelado",
        percentual_entrada: condicoes.percentual_entrada || 30,
        numero_parcelas: condicoes.numero_parcelas || 3,
        validade_dias: condicoes.validade_dias || 30,
        prazo_execucao_dias: condicoes.prazo_execucao_dias || 60,
        pagamento_cartao: condicoes.metodo_saldo === "cartao_credito",
        exibir_valores: true,
        metodo_entrada: condicoes.metodo_entrada || undefined,
        metodo_saldo: condicoes.metodo_saldo || undefined,
        parcelas_cartao_saldo: condicoes.parcelas_cartao_saldo || undefined,
        taxa_cartao_percentual: taxaCartaoPercentual ?? undefined,
        valor_taxa_cartao: valorTaxaCartaoSalvar ?? undefined,
        valor_total: totalFinal,
        valor_raw: valorRawMetadados,
      };

      const normalizarUnidade = (unidade?: string | null) => {
        const valor = (unidade || "un").trim().toLowerCase();
        if (valor === "m²") return "m2";
        return valor;
      };

      const normalizarCategoriaPersistencia = (categoria?: string | null) => {
        if (!categoria) return "";
        return categoria
          .trim()
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "");
      };

      const itensBrutosParaSalvar = itensProposta.map((itemProposta, index) => {
        // Só persistir referência quando for UUID válido do pricelist.
        const pricelistIdValido = isUuid(itemProposta.item.id);
        const categoriaFinal = resolverCategoriaPadrao(itemProposta);
        const item: Record<string, any> = {
          pricelist_item_id: pricelistIdValido ? itemProposta.item.id : null,
          nome: itemProposta.item.nome,
          descricao: itemProposta.item.descricao || "",
          categoria: normalizarCategoriaPersistencia(categoriaFinal),
          tipo: (itemProposta.item.tipo || "material").toLowerCase(),
          unidade: normalizarUnidade(itemProposta.item.unidade),
          quantidade: itemProposta.quantidade,
          valor_unitario: fatorDistribuicao !== 1
            ? Number((itemProposta.valor_unitario * fatorDistribuicao).toFixed(2))
            : itemProposta.valor_unitario,
          ordem: index,
          nucleo: itemProposta.item.nucleo || null,
        };
        const ambienteIdValido = sanitizeUuid(itemProposta.ambiente_id);
        const categoriaIdValido = sanitizeUuid(itemProposta.item.categoria_id);
        const subcategoriaIdValido = sanitizeUuid(itemProposta.item.subcategoria_id);
        const nucleoIdValido = sanitizeUuid(itemProposta.item.nucleo_id);
        if (ambienteIdValido) item.ambiente_id = ambienteIdValido;
        if (categoriaIdValido) item.categoria_id = categoriaIdValido;
        if (subcategoriaIdValido) item.subcategoria_id = subcategoriaIdValido;
        if (nucleoIdValido) item.nucleo_id = nucleoIdValido;
        if (itemProposta.item.codigo) item.codigo = itemProposta.item.codigo;
        if (itemProposta.descricao_customizada) item.descricao_customizada = itemProposta.descricao_customizada;
        if (itemProposta.prioridade) item.prioridade = itemProposta.prioridade;
        if (itemProposta.status_item) item.status_item = itemProposta.status_item;
        return item;
      });

      const itensParaSalvar: Record<string, any>[] = [];
      const itensDescartados: Array<{ motivo: string; item: Record<string, any> }> = [];
      const chavesDeduplicacao = new Set<string>();

      for (const item of itensBrutosParaSalvar) {
        const quantidade = Number(item.quantidade);
        const valorUnitario = Number(item.valor_unitario);

        if (!Number.isFinite(quantidade) || quantidade <= 0) {
          itensDescartados.push({ motivo: "quantidade_invalida", item });
          continue;
        }

        if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
          itensDescartados.push({ motivo: "valor_unitario_invalido", item });
          continue;
        }

        if (!item.pricelist_item_id && valorUnitario === 0) {
          itensDescartados.push({ motivo: "custom_sem_preco", item });
          continue;
        }

        const chave = [
          item.pricelist_item_id || "sem_pricelist",
          item.ambiente_id || "sem_ambiente",
          String(item.descricao_customizada || item.nome || "")
            .trim()
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, ""),
          quantidade.toFixed(4),
          valorUnitario.toFixed(4),
        ].join("|");

        if (chavesDeduplicacao.has(chave)) {
          itensDescartados.push({ motivo: "duplicado", item });
          continue;
        }

        chavesDeduplicacao.add(chave);
        itensParaSalvar.push({
          ...item,
          quantidade,
          valor_unitario: valorUnitario,
        });
      }

      const itensNormalizados = itensParaSalvar.map((item, index) => ({
        ...item,
        ordem: index,
      }));

      if (itensDescartados.length > 0) {
        const resumo = itensDescartados.reduce<Record<string, number>>((acc, atual) => {
          acc[atual.motivo] = (acc[atual.motivo] || 0) + 1;
          return acc;
        }, {});
        console.warn("[handleSalvarProposta] Itens descartados por validaçÍo:", resumo);
        toast({
          title: "Itens ajustados antes de salvar",
          description: `${itensDescartados.length} item(ns) descartado(s): ${Object.entries(resumo)
            .map(([motivo, total]) => `${motivo}=${total}`)
            .join(", ")}`,
        });
      }

      let propostaFinal: { id: string };

      if (propostaId) {
        // Atualizar proposta existente
        await atualizarProposta(propostaId, dadosProposta);

        // Estratégia segura: inserir novos itens PRIMEIRO, só deletar antigos se insert funcionar
        // Isso evita perda de dados se o insert falhar (ex: coluna inexistente no DB)
        if (itensNormalizados.length > 0) {
          const itensComPropostaId = itensNormalizados.map(item => ({
            ...item,
            proposta_id: propostaId,
          }));

          // 1. Inserir novos itens primeiro (se falhar, os antigos permanecem intactos)
          console.log(`[handleSalvarProposta] Inserindo ${itensComPropostaId.length} itens. Colunas: ${Object.keys(itensComPropostaId[0] || {}).join(", ")}`);
          const { error: insertError, data: insertedItens, status: insertStatus } = await supabase
            .from("propostas_itens")
            .insert(itensComPropostaId)
            .select();

          console.log(`[handleSalvarProposta] Insert response: status=${insertStatus}, data=${insertedItens?.length ?? "null"}, error=${insertError ? JSON.stringify({ code: (insertError as any)?.code, msg: insertError.message, hint: (insertError as any)?.hint }) : "none"}`);

          if (insertError) {
            console.error("Erro ao inserir itens:", insertError);
            console.error("Payload enviado:", JSON.stringify(itensComPropostaId, null, 2));
            throw new Error(`Erro ao salvar itens: ${insertError.message}${insertError.hint ? ` (${insertError.hint})` : ""}`);
          }

          // 2. Insert OK - agora deletar itens antigos (que não sÍo os recém-inseridos)
          const idsNovos = (insertedItens || []).map((i: any) => i.id).filter(Boolean);

          if (idsNovos.length > 0) {
            const { error: deleteError } = await supabase
              .from("propostas_itens")
              .delete()
              .eq("proposta_id", propostaId)
              .not("id", "in", `(${idsNovos.join(",")})`);

            if (deleteError) {
              console.error("Erro ao deletar itens antigos:", deleteError);
            }
          } else {
            console.warn("[handleSalvarProposta] Insert retornou sem IDs - não deletando itens antigos para evitar perda de dados. insertedItens:", insertedItens);
          }

          console.log(`${insertedItens?.length || 0} itens salvos com sucesso`);
        } else {
          // Sem itens, apenas deletar os antigos
          const { error: deleteError } = await supabase
            .from("propostas_itens")
            .delete()
            .eq("proposta_id", propostaId);

          if (deleteError) {
            console.error("Erro ao deletar itens:", deleteError);
          }
        }

        propostaFinal = { id: propostaId };

        // Salvar ambientes da proposta
        if (ambientes && ambientes.length > 0) {
          try {
            await deletarAmbientesPorProposta(propostaId);
            const ambientesParaSalvar = ambientes.map((amb, index) => {
              const medidas = calcularAreasAmbiente(amb);
              return {
                proposta_id: propostaId,
                nome: amb.nome,
                largura: medidas.largura,
                comprimento: medidas.comprimento,
                pe_direito: medidas.pe_direito,
                ordem: index,
                area_piso: medidas.area_piso,
                area_parede: medidas.area_parede,
                area_teto: medidas.area_teto,
                perimetro: medidas.perimetro,
              };
            });
            await criarAmbientesEmLote(ambientesParaSalvar);
            console.log(`${ambientesParaSalvar.length} ambientes salvos`);
          } catch (ambError) {
            console.warn("Erro ao salvar ambientes:", ambError);
          }
        }

        toast({
          title: "Sucesso!",
          description: `Proposta atualizada com ${itensNormalizados.length} itens`,
        });
      } else {
        // Criar nova proposta
        propostaFinal = await criarProposta(dadosProposta, itensNormalizados as any);

        // Criacao via criarProposta calcula valor_total pelos itens.
        // Ajustamos em seguida para o total liquido com desconto.
        if (propostaFinal?.id) {
          try {
            await atualizarProposta(propostaFinal.id, {
              valor_total: totalFinal,
              valor_raw: valorRawMetadados,
            } as any);
          } catch (erroAjustePosCriacao) {
            console.warn("[handleSalvarProposta] Proposta criada, mas ajuste de metadados falhou:", erroAjustePosCriacao);
          }
        }

        // Salvar ambientes da nova proposta
        if (ambientes && ambientes.length > 0 && propostaFinal?.id) {
          try {
            const ambientesParaSalvar = ambientes.map((amb, index) => {
              const medidas = calcularAreasAmbiente(amb);
              return {
                proposta_id: propostaFinal.id,
                nome: amb.nome,
                largura: medidas.largura,
                comprimento: medidas.comprimento,
                pe_direito: medidas.pe_direito,
                ordem: index,
                area_piso: medidas.area_piso,
                area_parede: medidas.area_parede,
                area_teto: medidas.area_teto,
                perimetro: medidas.perimetro,
              };
            });
            await criarAmbientesEmLote(ambientesParaSalvar);
            console.log(`${ambientesParaSalvar.length} ambientes salvos na nova proposta`);
          } catch (ambError) {
            console.warn("Erro ao salvar ambientes:", ambError);
          }
        }

        toast({
          title: "Sucesso!",
          description: `Proposta ${(propostaFinal as { numero?: string }).numero || propostaFinal.id} criada com ${itensNormalizados.length} itens`,
        });
      }

      navigate("/propostas");
    } catch (error: any) {
      console.error("[handleSalvarProposta] Erro ao salvar proposta:", {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
        status: error?.status,
        original: error,
      });
      toast({
        title: "Erro ao salvar",
        description: error.message || "Nao foi possivel salvar",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  }, [
    clienteSelecionado,
    itensProposta,
    condicoes,
    oportunidadeId,
    propostaId,
    ambientes,
    navigate,
    toast,
    resolverCategoriaPadrao,
    calcularAreasAmbiente,
    totalFinal,
    totalBruto,
    tipoDesconto,
    descontoPercentualAplicado,
    descontoValorAplicado,
    taxaAdmPercentual,
    valorTaxaAdm,
    taxaCartaoInfo,
  ]);

  // Toggle ambiente expandido
  const toggleAmbiente = (id: string) => {
    setAmbientesExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const itensPropostaFiltrados = useMemo(() => {
    return itensProposta.filter((item) => {
      if (filtroItens.ambienteId && item.ambiente_id !== filtroItens.ambienteId) {
        return false;
      }

      if (filtroItens.categoriaId) {
        const categoriaSelecionada = categorias.find((c) => c.id === filtroItens.categoriaId);
        const categoriaMatch =
          item.item.categoria_id === filtroItens.categoriaId ||
          (categoriaSelecionada && item.item.categoria?.toLowerCase() === categoriaSelecionada.nome.toLowerCase());
        if (!categoriaMatch) {
          return false;
        }
      }

      if (filtroItens.subcategoriaId) {
        if (item.item.subcategoria_id !== filtroItens.subcategoriaId) {
          return false;
        }
      }

      if (filtroItens.busca) {
        const termo = filtroItens.busca.toLowerCase();
        const nome = (item.item.nome || "").toLowerCase();
        const descricao = (item.item.descricao || "").toLowerCase();
        const codigo = (item.item.codigo || "").toLowerCase();
        if (!nome.includes(termo) && !descricao.includes(termo) && !codigo.includes(termo)) {
          return false;
        }
      }

      return true;
    });
  }, [itensProposta, filtroItens, categorias]);

  const itensPropostaFiltradosIds = useMemo(() => new Set(itensPropostaFiltrados.map((item) => item.id)), [itensPropostaFiltrados]);

  const gruposFiltrados = useMemo(() => {
    return gruposPorNucleo
      .map((grupo) => {
        const itens = grupo.itens.filter((item) => itensPropostaFiltradosIds.has(item.id));
        const total = itens.reduce((acc, item) => acc + item.quantidade * item.valor_unitario, 0);
        return {
          ...grupo,
          itens,
          total,
        };
      })
      .filter((grupo) => grupo.itens.length > 0);
  }, [gruposPorNucleo, itensPropostaFiltradosIds]);

  // Calcular totais por nucleo com base nos itens filtrados
  const totaisPorNucleo = gruposFiltrados.reduce((acc, grupo) => {
    acc[grupo.nucleo] = grupo.total;
    return acc;
  }, {} as Record<string, number>);

  const totaisFiltrados = useMemo(() => {
    return itensPropostaFiltrados.reduce(
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
  }, [itensPropostaFiltrados]);

  // Separar engenharia em mao de obra e materiais (itens filtrados)
  const itensEngenharia = itensPropostaFiltrados.filter((i) => i.item.nucleo === "engenharia");
  const engenhariaMaoObra = itensEngenharia.filter((i) => ["mao_obra", "servico"].includes(i.item.tipo));
  const engenhariaMateriais = itensEngenharia.filter((i) => ["material", "produto"].includes(i.item.tipo));

  const totalEngenhariaMaoObra = engenhariaMaoObra.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);
  const totalEngenhariaMateriais = engenhariaMateriais.reduce((acc, i) => acc + i.quantidade * i.valor_unitario, 0);

  const prazos = useMemo(() => {
    if (!propostaCriadoEm) return null;
    const base = new Date(propostaCriadoEm);
    if (isNaN(base.getTime())) return null;

    const validadeDias = Number(condicoes.validade_dias || 0);
    const prazoExecucaoDias = Number(condicoes.prazo_execucao_dias || 0);

    const validadeAte = validadeDias > 0 ? calcularDataTermino(base, validadeDias) : null;
    const previsaoTermino = prazoExecucaoDias > 0 ? calcularDataTermino(base, prazoExecucaoDias) : null;

    return { base, validadeDias, prazoExecucaoDias, validadeAte, previsaoTermino };
  }, [propostaCriadoEm, condicoes.validade_dias, condicoes.prazo_execucao_dias]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#F25C26] animate-spin" />
      </div>
    );
  }

  // Funções de navegaçÍo do Wizard
  const podeAvancar = passoAtual === 1 ? !!clienteSelecionado : passoAtual === 2 ? itensProposta.length > 0 : true;
  const avancarPasso = () => {
    if (passoAtual === 1 && !clienteSelecionado) {
      toast({ title: "Selecione um cliente", description: "Escolha um cliente para continuar.", variant: "destructive" });
      return;
    }
    // Ao avançar para step 2 com ambientes e sem itens, perguntar sobre materiais
    if (passoAtual === 1 && ambientes.length > 0 && itensProposta.length === 0 && !jaGeradoAutomatica) {
      setPassoAtual(2);
      setMostrarDialogMaterial(true);
      return;
    }
    if (passoAtual < 3) setPassoAtual(passoAtual + 1);
  };
  const voltarPasso = () => { if (passoAtual > 1) setPassoAtual(passoAtual - 1); };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1920px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => passoAtual > 1 ? voltarPasso() : navigate("/propostas")} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-9 h-9 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h1 className={TYPOGRAPHY.pageTitle}>{id ? "Editar Proposta" : "Nova Proposta"}</h1>
                {clienteSelecionado && <p className={TYPOGRAPHY.pageSubtitle}>{clienteSelecionado.nome}</p>}
              </div>
            </div>
            <div className="flex items-center gap-3">
              {passoAtual < 3 ? (
                <button
                  onClick={avancarPasso}
                  disabled={!podeAvancar}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSalvarProposta}
                  disabled={salvando}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {salvando ? "Salvando..." : "Salvar Proposta"}
                </button>
              )}
            </div>
          </div>
        </div>
        {/* Step Indicator + resumo do passo 2 */}
        <div className="border-t border-gray-100 bg-gray-50/50">
          <div className="max-w-[1920px] mx-auto px-4 py-2 grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(360px,560px)] items-center gap-3">
            <StepIndicator
              steps={WIZARD_STEPS}
              currentStep={passoAtual}
              onStepClick={(step) => {
                if (step < passoAtual || (step === 2 && clienteSelecionado) || step === passoAtual) {
                  setPassoAtual(step);
                }
              }}
            />

            {passoAtual === 2 && ambientes.length > 0 && (
              <div className="bg-white rounded-xl border border-gray-200 px-4 py-2 grid grid-cols-2 items-center gap-4">
                <div className="flex min-w-0 items-center gap-2">
                  <Home className="w-4 h-4 text-emerald-600" />
                  <div className="min-w-0">
                    <p className={`${TYPOGRAPHY.cardTitle} truncate`}>{ambientes.length} ambientes cadastrados</p>
                    <p className={`${TYPOGRAPHY.cardSubtitle} truncate`}>Área total: {totaisAmbientes.area_piso.toFixed(1)}m²</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleGerarAutomatica()}
                  disabled={gerandoAutomatica || itensPricelist.length === 0}
                  className="justify-self-end shrink-0 whitespace-nowrap px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-orange-500 hover:bg-orange-600 text-white shadow-md"
                >
                  {gerandoAutomatica ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Gerar Proposta Automática
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conteudo */}
      <div className="max-w-[1920px] mx-auto px-4 py-4 space-y-4">
        {isVisualizacao && (
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className={TYPOGRAPHY.iconMedium + " text-[#F25C26]"} />
                <h2 className={TYPOGRAPHY.sectionTitle}>Prazos</h2>
              </div>
              {id && (
                <div className="text-xs text-gray-500 break-all">
                  Proposta: <span className="font-mono">{id}</span>
                </div>
              )}
            </div>

            {prazos ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className={TYPOGRAPHY.cardSubtitle}>Data base</div>
                  <div className={TYPOGRAPHY.cardTitle}>{prazos.base.toLocaleDateString("pt-BR")}</div>
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className={TYPOGRAPHY.cardSubtitle}>Validade</div>
                  <div className={TYPOGRAPHY.cardTitle}>{formatarDiasUteis(prazos.validadeDias)}</div>
                  {prazos.validadeAte && (
                    <div className={TYPOGRAPHY.cardSubtitle}>
                      Valida ate {prazos.validadeAte.toLocaleDateString("pt-BR")} ({calcularDiasUteisRestantes(prazos.validadeAte)} uteis restantes)
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200">
                  <div className={TYPOGRAPHY.cardSubtitle}>Prazo de execucao</div>
                  <div className={TYPOGRAPHY.cardTitle}>{formatarDiasUteis(prazos.prazoExecucaoDias)}</div>
                  {prazos.previsaoTermino && (
                    <div className={TYPOGRAPHY.cardSubtitle}>
                      Previsao {prazos.previsaoTermino.toLocaleDateString("pt-BR")} ({calcularDiasUteisRestantes(prazos.previsaoTermino)} uteis restantes)
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className={TYPOGRAPHY.cardSubtitle}>
                Prazos indisponiveis (sem data base da proposta).
              </div>
            )}
          </div>
        )}

        {/* ========== PASSO 1: CLIENTE + AMBIENTES + IMPORTAÇÕES ========== */}
        {passoAtual === 1 && (
          <>
            {/* Card: Cliente + Análise */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-6">
                {/* Cliente */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <User className={TYPOGRAPHY.iconMedium + " text-[#F25C26]"} />
                    <span className={TYPOGRAPHY.formLabel}>Cliente</span>
                  </div>
                  {clienteSelecionado ? (
                    <div className="flex items-center justify-between p-2 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-[11px] font-normal">
                          {clienteSelecionado.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className={TYPOGRAPHY.cardTitle}>{clienteSelecionado.nome}</p>
                          <p className={TYPOGRAPHY.cardSubtitle}>{clienteSelecionado.email || clienteSelecionado.telefone}</p>
                        </div>
                      </div>
                      <button onClick={() => setClienteSelecionado(null)} className="text-xs text-gray-500 hover:text-red-500">
                        Trocar
                      </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={buscaCliente}
                        onChange={(e) => setBuscaCliente(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
                      />
                      {clientesEncontrados.length > 0 && (
                        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-48 overflow-y-auto">
                          {clientesEncontrados.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => handleSelecionarCliente(c)}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-orange-50 border-b last:border-b-0"
                            >
                              <p className={TYPOGRAPHY.cardTitle}>{c.nome}</p>
                              <p className={TYPOGRAPHY.cardSubtitle}>{c.email || c.cpf}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

            {/* Separador */}
            <div className="w-px h-16 bg-gray-200" />

            {/* Analise disponivel */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span className={TYPOGRAPHY.formLabel}>Analise de Projeto</span>
                {analisesDisponiveis.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                    {analisesDisponiveis.length}
                  </span>
                )}
              </div>
              {carregandoAnalises ? (
                <div className={`flex items-center gap-2 ${TYPOGRAPHY.cardSubtitle}`}>
                  <Loader2 className={TYPOGRAPHY.iconSmall + " animate-spin"} />
                  Carregando...
                </div>
              ) : analisesDisponiveis.length > 0 ? (
                <select
                  value={analiseSelecionada || ""}
                  onChange={(e) => handleSelecionarAnalise(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-500 outline-none"
                >
                  <option value="">Selecione uma analise...</option>
                  {analisesDisponiveis.map((a) => {
                    const statusLabel = {
                      rascunho: "[Rascunho]",
                      analisando: "[Analisando]",
                      analisado: "[Pronta]",
                      aprovado: "[Aprovada]",
                      vinculado: "[Vinculada]",
                    }[a.status] || `[${a.status}]`;

                    return (
                      <option key={a.id} value={a.id}>
                        {statusLabel} {a.numero || a.titulo} - {a.tipo_projeto} ({a.area_total ? `${a.area_total}m²` : "s/área"})
                      </option>
                    );
                  })}
                </select>
              ) : clienteSelecionado ? (
                <div className="flex items-center gap-2">
                  <span className={TYPOGRAPHY.cardSubtitle}>Nenhuma analise disponivel</span>
                  <button
                    onClick={() => setModalImportarAnalise(true)}
                    className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  >
                    Criar com IA
                  </button>
                </div>
              ) : (
                <span className={TYPOGRAPHY.cardMeta}>Selecione um cliente primeiro</span>
              )}
            </div>
          </div>
        </div>

            {/* Cards de ImportaçÍo com IA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Card: Plano de Reforma */}
              <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <Sparkles className={TYPOGRAPHY.iconMedium + " text-white"} />
                  </div>
                  <div>
                    <h3 className={TYPOGRAPHY.cardTitle}>Plano de Reforma</h3>
                    <p className={TYPOGRAPHY.cardSubtitle}>Importe com IA</p>
                  </div>
                </div>
                <p className={TYPOGRAPHY.bodySmall + " mb-3"}>
                  Faça upload da imagem do plano de reforma e a IA identificará automaticamente os serviços e ambientes.
                </p>
                <button
                  onClick={() => setModalImportarAnalise(true)}
                  disabled={!clienteSelecionado}
                  className={`w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white ${TYPOGRAPHY.cardTitle} rounded-lg hover:from-purple-600 hover:to-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  <Upload className={TYPOGRAPHY.iconSmall} />
                  Importar Plano
                </button>
              </div>

              {/* Card: Importar Contrato */}
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                    <FileText className={TYPOGRAPHY.iconMedium + " text-white"} />
                  </div>
                  <div>
                    <h3 className={TYPOGRAPHY.cardTitle}>Importar Contrato</h3>
                    <p className={TYPOGRAPHY.cardSubtitle}>ExtraçÍo completa com IA</p>
                  </div>
                </div>
                <p className={TYPOGRAPHY.bodySmall + " mb-3"}>
                  Importe um contrato e a IA extrairá itens, valores, pagamentos e cronograma automaticamente.
                </p>
                <button
                  disabled={!clienteSelecionado}
                  className={`w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white ${TYPOGRAPHY.cardTitle} rounded-lg hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                >
                  <Upload className={TYPOGRAPHY.iconSmall} />
                  Importar Contrato
                </button>
              </div>
            </div>

        {/* Card: Ambientes */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Home className="w-4 h-4 text-emerald-600" />
              <span className={TYPOGRAPHY.formLabel}>Ambientes</span>
              {ambientes.length > 0 && (
                <span className={`px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full ${TYPOGRAPHY.badgeSmall}`}>
                  {ambientes.length}
                </span>
              )}
            </div>
            {ambientes.length > 0 && (
              <div className={`flex items-center gap-3 ${TYPOGRAPHY.caption}`}>
                <span className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded">
                  Piso: <strong>{totaisAmbientes.area_piso.toFixed(1)}m²</strong>
                </span>
                <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded">
                  Parede: <strong>{(totaisAmbientes.area_paredes_liquida || totaisAmbientes.area_parede).toFixed(1)}m²</strong>
                </span>
                <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded">
                  Teto: <strong>{totaisAmbientes.area_teto.toFixed(1)}m²</strong>
                </span>
                <span className="px-2 py-1 bg-orange-50 text-orange-700 rounded">
                  Perímetro: <strong>{totaisAmbientes.perimetro.toFixed(1)}ml</strong>
                </span>
                {totaisAmbientes.total_portas > 0 && (
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded">
                    Portas: <strong>{totaisAmbientes.total_portas}</strong>
                  </span>
                )}
                {totaisAmbientes.total_janelas > 0 && (
                  <span className="px-2 py-1 bg-cyan-50 text-cyan-700 rounded">
                    Janelas: <strong>{totaisAmbientes.total_janelas}</strong>
                  </span>
                )}
                {totaisAmbientes.area_vaos_total > 0 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded">
                    VÍos: <strong>{totaisAmbientes.area_vaos_total.toFixed(1)}m²</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {ambientes.length > 0 && (
            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-1.5">
              {ambientes.map((ambiente) => {
                const expandido = ambientesExpandidos.has(ambiente.id);
                return (
                  <div
                    key={ambiente.id}
                    className={`border rounded transition-all ${expandido ? "border-emerald-300 bg-emerald-50 col-span-2 row-span-2" : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"}`}
                  >
                    <button
                      onClick={() => toggleAmbiente(ambiente.id)}
                      className="w-full px-1.5 py-1 flex items-center justify-between text-left gap-1"
                    >
                      <div className="flex items-center gap-1 min-w-0 flex-1">
                        {expandido ? <ChevronUp className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-2.5 h-2.5 text-gray-400 flex-shrink-0" />}
                        <span className="text-[10px] font-medium text-gray-900 truncate">{ambiente.nome}</span>
                      </div>
                      <span className="text-[9px] text-emerald-600 bg-emerald-100 px-1 py-0.5 rounded flex-shrink-0">
                        {ambiente.area_piso.toFixed(0)}m²
                      </span>
                    </button>
                    {expandido && (
                      <div className="px-1.5 pb-1.5 pt-1 border-t border-emerald-200 space-y-1 text-[9px]">
                        <div className="grid grid-cols-2 gap-1">
                          <div className="bg-white rounded p-0.5 text-center">
                            <span className="text-gray-500 block text-[8px]">L</span>
                            <span className="font-normal">{ambiente.largura.toFixed(1)}m</span>
                          </div>
                          <div className="bg-white rounded p-0.5 text-center">
                            <span className="text-gray-500 block text-[8px]">C</span>
                            <span className="font-normal">{ambiente.comprimento.toFixed(1)}m</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-1">
                          <div className="bg-emerald-100 rounded p-0.5 text-center">
                            <span className="text-emerald-600 block text-[8px]">Piso</span>
                            <span className="font-normal text-emerald-700">{ambiente.area_piso.toFixed(1)}m²</span>
                          </div>
                          <div className="bg-purple-100 rounded p-0.5 text-center">
                            <span className="text-purple-600 block text-[8px]">Parede</span>
                            <span className="font-normal text-purple-700">{(ambiente.area_paredes_liquida || ambiente.area_parede).toFixed(1)}m²</span>
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm("Remover ambiente?")) removerAmbiente(ambiente.id);
                          }}
                          className="w-full py-0.5 text-red-500 hover:bg-red-50 rounded flex items-center justify-center gap-0.5 text-[8px]"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Remover
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          {ambientes.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Home className={TYPOGRAPHY.iconLarge + " mx-auto mb-3 opacity-30 !w-12 !h-12"} />
              <p className={TYPOGRAPHY.cardTitle}>Nenhum ambiente cadastrado</p>
              <p className={`${TYPOGRAPHY.cardSubtitle} mt-1`}>Importe uma análise ou adicione manualmente</p>
            </div>
          )}
        </div>

        {/* BotÍo de avançar no passo 1 */}
        <div className="flex justify-end pt-4">
          <button
            onClick={avancarPasso}
            disabled={!clienteSelecionado}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            Próximo: Elaborar Orçamento
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
          </>
        )}

        {/* ========== PASSO 2: ORÇAMENTO (CATÁLOGO + ITENS) ========== */}
        {passoAtual === 2 && (
          <>
        {/* IA: Banner de insights de precificaçÍo (exibido após importar análise) */}
        {insightPrecificacao && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-purple-700">
              <Sparkles className="w-4 h-4 flex-shrink-0" />
              <span className="text-[12px] font-semibold">Insight IA</span>
            </div>
            <div className="flex items-center gap-4 flex-wrap text-[12px]">
              <span className="text-gray-700">
                <span className="font-semibold text-purple-800">{formatarMoeda(insightPrecificacao.precoM2)}/m²</span>
                {" "}para {insightPrecificacao.areaTotal}m²
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-700">
                Total estimado: <span className="font-semibold text-green-700">{formatarMoeda(insightPrecificacao.totalM2)}</span>
              </span>
              <span className="text-gray-500">•</span>
              <span className="text-gray-600">
                {insightPrecificacao.itensVinculados}/{insightPrecificacao.itensTotal} itens vinculados ao catálogo
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInsightPrecificacao(null)}
              className="ml-auto text-purple-400 hover:text-purple-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        {/* Catálogo + Itens da Proposta */}
        <div className="grid grid-cols-1 lg:grid-cols-[345px_1fr] gap-4">

          {/* Coluna Esquerda: Busca Pricelist (compacta) */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <PricelistBusca
              itens={itensFiltrados}
              todosItens={itensPricelist}
              loading={loadingPricelist}
              filtros={filtros}
              ambientes={ambientes}
              sugestoes={[]}
              onBuscar={buscar}
              onFiltrar={setFiltros}
              onAdicionar={handleAdicionarItem}
              onCriarNovo={() => {}}
            />
          </div>

          {/* Coluna Direita: Itens da Proposta por Nucleo */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-[#F25C26]" />
              <span className={TYPOGRAPHY.sectionTitle}>Itens da Proposta</span>
              <span className={`px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full ${TYPOGRAPHY.badgeSmall}`}>
                {itensProposta.length}
                {filtrosAtivos && (
                  <span className={`ml-1 ${TYPOGRAPHY.caption}`}>({itensPropostaFiltrados.length} exib.)</span>
                )}
              </span>
              {/* BotÍo para limpar itens inválidos */}
              {itensProposta.length > 0 && (
                <button
                  type="button"
                  onClick={limparItensInvalidos}
                  className={`ml-2 px-2 py-0.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors ${TYPOGRAPHY.caption}`}
                  title="Remover itens sem nome ou dados inválidos"
                >
                  <Trash2 className={TYPOGRAPHY.iconSmall + " inline mr-1"} />
                  Limpar inválidos
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <select
                value={tipoDesconto}
                onChange={(e) => atualizarCampo("tipo_desconto", e.target.value as "percentual" | "valor")}
                className="px-2 py-1 border border-gray-200 rounded-md text-xs text-gray-600 bg-white"
                title="Tipo de desconto"
              >
                <option value="percentual">Desconto %</option>
                <option value="valor">Desconto R$</option>
              </select>
              <input
                type="number"
                min={0}
                step={tipoDesconto === "percentual" ? "0.01" : "0.01"}
                value={tipoDesconto === "percentual" ? descontoPercentualInput : descontoValorInput}
                onChange={(e) => {
                  const valor = Math.max(0, Number(e.target.value || 0));
                  if (tipoDesconto === "percentual") {
                    atualizarCampo("desconto_percentual", Math.min(valor, 100));
                  } else {
                    atualizarCampo("desconto_valor", valor);
                  }
                }}
                className="w-24 px-2 py-1 border border-gray-200 rounded-md text-xs text-right"
                placeholder={tipoDesconto === "percentual" ? "0%" : "0,00"}
                title="Valor do desconto"
              />
              <div className="flex items-center gap-2">
                <label className="text-[9px] font-normal text-gray-500 whitespace-nowrap">Adm %</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={taxaAdmPercentual || ""}
                  onChange={(e) => atualizarCampo("taxa_adm_percentual", Math.min(Math.max(0, Number(e.target.value || 0)), 100))}
                  className="w-16 px-2 py-1 border border-gray-200 rounded-md text-xs text-right"
                  placeholder="0%"
                  title="Taxa de administraçÍo (%)"
                />
              </div>
              <span className={TYPOGRAPHY.moneyMedium}>
                Total: {formatarMoeda(totalFinal)}
              </span>
            </div>
          </div>

          <div className="px-3 pb-3 border-b border-gray-100 space-y-3">
            {/* Busca flexível */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar nos itens da proposta..."
                value={filtroItens.busca}
                onChange={(e) => handleFiltroItensChange({ busca: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#F25C26] focus:border-[#F25C26]"
              />
            </div>

            {/* Filtros por Ambiente e Categoria */}
            <div className="grid grid-cols-2 gap-3">
              {/* Filtro por Ambiente */}
              <div>
                <span className={TYPOGRAPHY.overline}>Ambiente</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleFiltroItensChange({ ambienteId: "" })}
                    aria-pressed={filtroItens.ambienteId === ""}
                    className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} ${filtroItens.ambienteId === "" ? "bg-primary/10 border-[#F25C26] text-[#F25C26]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    Todos
                  </button>
                  {ambientes.slice(0, 4).map((ambiente) => (
                    <button
                      key={ambiente.id}
                      type="button"
                      onClick={() =>
                        handleFiltroItensChange({
                          ambienteId: filtroItens.ambienteId === ambiente.id ? "" : ambiente.id,
                        })
                      }
                      aria-pressed={filtroItens.ambienteId === ambiente.id}
                      className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} ${filtroItens.ambienteId === ambiente.id ? "bg-primary/10 border-[#F25C26] text-[#F25C26]" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {ambiente.nome}
                    </button>
                  ))}
                  {ambientes.length > 4 && (
                    <select
                      value={filtroItens.ambienteId}
                      onChange={(e) => handleFiltroItensChange({ ambienteId: e.target.value })}
                      className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} border-gray-200 text-gray-600 hover:border-gray-300 bg-white`}
                    >
                      <option value="">+{ambientes.length - 4} mais</option>
                      {ambientes.slice(4).map((ambiente) => (
                        <option key={ambiente.id} value={ambiente.id}>{ambiente.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              {/* Filtro por Categoria */}
              <div>
                <span className={TYPOGRAPHY.overline}>Categoria</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  <button
                    type="button"
                    onClick={() => handleFiltroItensChange({ categoriaId: "" })}
                    aria-pressed={filtroItens.categoriaId === ""}
                    className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} ${filtroItens.categoriaId === "" ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    Todas
                  </button>
                  {categorias.slice(0, 3).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        handleFiltroItensChange({
                          categoriaId: filtroItens.categoriaId === cat.id ? "" : cat.id,
                        })
                      }
                      aria-pressed={filtroItens.categoriaId === cat.id}
                      className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} ${filtroItens.categoriaId === cat.id ? "bg-blue-100 border-blue-400 text-blue-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {cat.nome}
                    </button>
                  ))}
                  {categorias.length > 3 && (
                    <select
                      value={filtroItens.categoriaId}
                      onChange={(e) => handleFiltroItensChange({ categoriaId: e.target.value })}
                      className={`px-2 py-0.5 rounded-full border transition ${TYPOGRAPHY.caption} border-gray-200 text-gray-600 hover:border-gray-300 bg-white`}
                    >
                      <option value="">+{categorias.length - 3} mais</option>
                      {categorias.slice(3).map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.nome}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Limpar filtros */}
            {filtrosAtivos && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => handleFiltroItensChange({ ambienteId: "", categoriaId: "", subcategoriaId: "", busca: "" })}
                  className={`${TYPOGRAPHY.caption} text-gray-500 hover:text-red-600`}
                >
                  Limpar todos os filtros
                </button>
              </div>
            )}
          </div>

            <div className="overflow-visible">
              {itensPropostaFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className={TYPOGRAPHY.cardTitle}>{mensagemSemItens}</p>
                  <p className={`${TYPOGRAPHY.cardSubtitle} mt-1`}>Busque e adicione itens do catálogo</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {/* ARQUITETURA */}
                  {gruposFiltrados.filter(g => g.nucleo === "arquitetura" && g.itens.length > 0).map(grupo => (
                    <GrupoNucleoCard
                      key={grupo.nucleo}
                      grupo={grupo}
                      ambientes={ambientes}
                      categorias={categorias}
                      subcategorias={subcategorias}
                      nucleos={nucleos}
                      onAtualizarQuantidade={atualizarQuantidade}
                      onAtualizarNucleo={atualizarNucleo}
                      onAtualizarCategoria={atualizarCategoria}
                      onAtualizarSubcategoria={atualizarSubcategoria}
                      onAtualizarTipo={atualizarTipo}
                      onAtualizarNome={atualizarNome}
                      onRemover={removerItem}
                      onEditarAmbiente={setAmbienteEditandoId}
                    />
                  ))}

                  {/* ENGENHARIA - Mao de Obra/Servicos */}
                  {engenhariaMaoObra.length > 0 && (
                    <GrupoNucleoCard
                      grupo={{
                        nucleo: "engenharia",
                        label: "Engenharia - Mao de Obra",
                        cor: "#2B4580",
                        itens: engenhariaMaoObra,
                        total: totalEngenhariaMaoObra,
                      }}
                      ambientes={ambientes}
                      categorias={categorias}
                      subcategorias={subcategorias}
                      nucleos={nucleos}
                      onAtualizarQuantidade={atualizarQuantidade}
                      onAtualizarNucleo={atualizarNucleo}
                      onAtualizarCategoria={atualizarCategoria}
                      onAtualizarSubcategoria={atualizarSubcategoria}
                      onAtualizarTipo={atualizarTipo}
                      onAtualizarNome={atualizarNome}
                      onEditarAmbiente={setAmbienteEditandoId}
                      onRemover={removerItem}
                      sublabel="Servicos e mao de obra"
                    />
                  )}

                  {/* ENGENHARIA - Materiais */}
                  {engenhariaMateriais.length > 0 && (
                    <GrupoNucleoCard
                      grupo={{
                        nucleo: "engenharia",
                        label: "Engenharia - Materiais",
                        cor: "#3B5998",
                        itens: engenhariaMateriais,
                        total: totalEngenhariaMateriais,
                      }}
                      ambientes={ambientes}
                      categorias={categorias}
                      subcategorias={subcategorias}
                      nucleos={nucleos}
                      onAtualizarQuantidade={atualizarQuantidade}
                      onAtualizarNucleo={atualizarNucleo}
                      onAtualizarCategoria={atualizarCategoria}
                      onAtualizarSubcategoria={atualizarSubcategoria}
                      onAtualizarTipo={atualizarTipo}
                      onAtualizarNome={atualizarNome}
                      onEditarAmbiente={setAmbienteEditandoId}
                      onRemover={removerItem}
                      sublabel="Materiais e produtos"
                    />
                  )}

                  {/* MARCENARIA */}
                  {gruposFiltrados.filter(g => g.nucleo === "marcenaria" && g.itens.length > 0).map(grupo => (
                    <GrupoNucleoCard
                      key={grupo.nucleo}
                      grupo={grupo}
                      ambientes={ambientes}
                      categorias={categorias}
                      subcategorias={subcategorias}
                      nucleos={nucleos}
                      onAtualizarQuantidade={atualizarQuantidade}
                      onAtualizarNucleo={atualizarNucleo}
                      onAtualizarCategoria={atualizarCategoria}
                      onAtualizarSubcategoria={atualizarSubcategoria}
                      onAtualizarTipo={atualizarTipo}
                      onAtualizarNome={atualizarNome}
                      onRemover={removerItem}
                      onEditarAmbiente={setAmbienteEditandoId}
                    />
                  ))}

                  {/* PRODUTOS e OUTROS */}
                  {gruposFiltrados.filter(g => !["arquitetura", "engenharia", "marcenaria"].includes(g.nucleo) && g.itens.length > 0).map(grupo => (
                    <GrupoNucleoCard
                      key={grupo.nucleo}
                      grupo={grupo}
                      ambientes={ambientes}
                      categorias={categorias}
                      subcategorias={subcategorias}
                      nucleos={nucleos}
                      onAtualizarQuantidade={atualizarQuantidade}
                      onAtualizarNucleo={atualizarNucleo}
                      onAtualizarCategoria={atualizarCategoria}
                      onAtualizarSubcategoria={atualizarSubcategoria}
                      onAtualizarTipo={atualizarTipo}
                      onAtualizarNome={atualizarNome}
                      onRemover={removerItem}
                      onEditarAmbiente={setAmbienteEditandoId}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* NavegaçÍo do Passo 2 */}
        <div className="flex justify-between pt-4">
          <button
            onClick={voltarPasso}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar: Cliente
          </button>
          <button
            onClick={avancarPasso}
            disabled={itensProposta.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            Próximo: Revisar
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
          </>
        )}

        {/* ========== PASSO 3: REVISAR E SALVAR ========== */}
        {passoAtual === 3 && (
          <>
        {/* Resumo dos Itens */}
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className={TYPOGRAPHY.iconMedium + " text-[#F25C26]"} />
              <span className={TYPOGRAPHY.sectionTitle}>Resumo da Proposta</span>
            </div>
            <span className={TYPOGRAPHY.cardSubtitle}>{itensProposta.length} itens</span>
          </div>
          <div className="py-4 px-5 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] rounded-lg text-white flex items-center justify-between">
            <div>
              <p className={`${TYPOGRAPHY.cardSubtitle} !text-white opacity-80`}>Total Geral</p>
              {(descontoValorAplicado > 0 || valorTaxaAdm > 0 || taxaCartaoInfo.valorTaxa > 0) && (
                <p className="text-[11px] opacity-80">
                  Bruto: {formatarMoeda(totalBruto)}
                  {descontoValorAplicado > 0 && <> | Desconto: -{formatarMoeda(descontoValorAplicado)}</>}
                  {valorTaxaAdm > 0 && <> | Adm {taxaAdmPercentual}%: +{formatarMoeda(valorTaxaAdm)}</>}
                  {taxaCartaoInfo.valorTaxa > 0 && <> | CartÍo {taxaCartaoInfo.percentual.toFixed(1)}%: +{formatarMoeda(taxaCartaoInfo.valorTaxa)}</>}
                </p>
              )}
            </div>
            <p className="text-3xl font-bold">{formatarMoeda(totalFinal)}</p>
          </div>
        </div>

        {/* Somatórias por núcleo + Condições */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {/* Somatorias por nucleo */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className={TYPOGRAPHY.sectionTitle}>Resumo por Nucleo</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {/* Arquitetura */}
              <div className="p-2 rounded-lg border-l-4 min-w-0" style={{ borderLeftColor: "#5E9B94", background: "linear-gradient(to right, #5E9B9410, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Building2 className="w-3 h-3 flex-shrink-0" style={{ color: "#5E9B94" }} />
                  <span className="text-[11px] font-medium text-gray-600 truncate">Arquitetura</span>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "#5E9B94" }}>
                  {formatarMoeda(totaisPorNucleoGeral.arquitetura || 0)}
                </p>
              </div>

              {/* Engenharia MO */}
              <div className="p-2 rounded-lg border-l-4 min-w-0" style={{ borderLeftColor: "#2B4580", background: "linear-gradient(to right, #2B458010, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Hammer className="w-3 h-3 flex-shrink-0" style={{ color: "#2B4580" }} />
                  <span className="text-[11px] font-medium text-gray-600 truncate">Eng. M.Obra</span>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "#2B4580" }}>
                  {formatarMoeda(totaisPorNucleoGeral.engenhariaMaoObra || 0)}
                </p>
              </div>

              {/* Engenharia Mat */}
              <div className="p-2 rounded-lg border-l-4 min-w-0" style={{ borderLeftColor: "#3B5998", background: "linear-gradient(to right, #3B599810, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="w-3 h-3 flex-shrink-0" style={{ color: "#3B5998" }} />
                  <span className="text-[11px] font-medium text-gray-600 truncate">Eng. Mat.</span>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "#3B5998" }}>
                  {formatarMoeda(totaisPorNucleoGeral.engenhariaMateriais || 0)}
                </p>
              </div>

              {/* Marcenaria */}
              <div className="p-2 rounded-lg border-l-4 min-w-0" style={{ borderLeftColor: "#8B5E3C", background: "linear-gradient(to right, #8B5E3C10, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Paintbrush className="w-3 h-3 flex-shrink-0" style={{ color: "#8B5E3C" }} />
                  <span className="text-[11px] font-medium text-gray-600 truncate">Marcenaria</span>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "#8B5E3C" }}>
                  {formatarMoeda(totaisPorNucleoGeral.marcenaria || 0)}
                </p>
              </div>

              {/* Produtos (se houver) */}
              {(totaisPorNucleoGeral.produtos || 0) > 0 && (
              <div className="p-2 rounded-lg border-l-4 min-w-0" style={{ borderLeftColor: "#F59E0B", background: "linear-gradient(to right, #F59E0B10, transparent)" }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Package className="w-3 h-3 flex-shrink-0" style={{ color: "#F59E0B" }} />
                  <span className="text-[11px] font-medium text-gray-600 truncate">Produtos</span>
                </div>
                <p className="text-sm font-semibold whitespace-nowrap" style={{ color: "#F59E0B" }}>
                  {formatarMoeda(totaisPorNucleoGeral.produtos || 0)}
                </p>
              </div>
              )}
            </div>

            {/* Taxa de adm (se houver) */}
            {valorTaxaAdm > 0 && (
              <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                <span className="text-[11px] font-medium text-amber-700">Taxa de AdministraçÍo ({taxaAdmPercentual}%)</span>
                <span className="text-sm font-semibold text-amber-700">+ {formatarMoeda(valorTaxaAdm)}</span>
              </div>
            )}

            {/* Total geral */}
            <div className="mt-2 p-3 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] rounded-lg flex items-center justify-end text-white">
              <div className="text-right">
                <span className="text-xs text-white/80">Total Geral da Proposta</span>
                <p className="text-xl font-semibold">{formatarMoeda(totalFinal)}</p>
              </div>
            </div>
          </div>

          {/* Condicoes comerciais */}
          <div className="bg-white rounded-xl border border-gray-200 p-3">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-green-600" />
              <span className={TYPOGRAPHY.sectionTitle}>Condicoes Comerciais</span>
            </div>

            {/* Linha 1: Entrada + Parcelas + Validade + Prazo + Taxa Adm */}
            <div className="grid grid-cols-5 gap-2 mb-3">
              <div>
                <label className="text-[9px] font-normal text-gray-500 mb-1 block whitespace-nowrap">Entrada (%)</label>
                <input
                  type="number"
                  value={condicoes.percentual_entrada}
                  onChange={(e) => atualizarCampo("percentual_entrada", parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-normal text-gray-500 mb-1 block whitespace-nowrap">Parcelas</label>
                <input
                  type="number"
                  value={condicoes.numero_parcelas}
                  onChange={(e) => atualizarCampo("numero_parcelas", parseInt(e.target.value) || 1)}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-normal text-gray-500 mb-1 block whitespace-nowrap">Validade (dias)</label>
                <input
                  type="number"
                  value={condicoes.validade_dias}
                  onChange={(e) => atualizarCampo("validade_dias", parseInt(e.target.value) || 15)}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-normal text-gray-500 mb-1 block whitespace-nowrap">Prazo exec. (dias)</label>
                <input
                  type="number"
                  value={condicoes.prazo_execucao_dias}
                  onChange={(e) => atualizarCampo("prazo_execucao_dias", parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-2 text-sm border border-gray-200 rounded-lg text-center font-medium focus:ring-2 focus:ring-green-200 outline-none"
                />
              </div>
              <div>
                <label className="text-[9px] font-normal text-gray-500 mb-1 block whitespace-nowrap">Taxa Adm (%)</label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  step="0.01"
                  value={condicoes.taxa_adm_percentual || ""}
                  onChange={(e) => atualizarCampo("taxa_adm_percentual", Math.min(Math.max(0, Number(e.target.value || 0)), 100))}
                  className="w-full px-2 py-2 text-sm border border-amber-300 rounded-lg text-center font-medium focus:ring-2 focus:ring-amber-200 outline-none bg-amber-50"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Entrada - Valor + Método de Pagamento */}
            <div className="p-2.5 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-700">Entrada ({condicoes.percentual_entrada}%)</span>
                <span className="text-[13px] font-medium text-[#F25C26]">{formatarMoeda(totalSemCartao * (condicoes.percentual_entrada / 100))}</span>
              </div>
              <div className="flex gap-1">
                {([
                  { value: "pix", label: "PIX" },
                  { value: "boleto", label: "Boleto" },
                  { value: "transferencia", label: "Transf." },
                  { value: "cartao_credito", label: "CartÍo" },
                ] as const).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => atualizarCampo("metodo_entrada" as any, m.value)}
                    className={`flex-1 px-1.5 py-1 rounded text-[9px] font-medium transition-colors border ${
                      condicoes.metodo_entrada === m.value
                        ? "bg-primary text-white border-[#F25C26]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Saldo - Valor + Método de Pagamento */}
            <div className="p-2.5 bg-gray-50 rounded-lg mb-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-gray-700">Saldo ({condicoes.numero_parcelas}x)</span>
                <span className="text-[13px] font-medium text-[#F25C26]">
                  {formatarMoeda((totalSemCartao * (1 - condicoes.percentual_entrada / 100)) / condicoes.numero_parcelas)}/parcela
                </span>
              </div>
              <div className="flex gap-1">
                {([
                  { value: "pix", label: "PIX" },
                  { value: "boleto", label: "Boleto" },
                  { value: "transferencia", label: "Transf." },
                  { value: "cartao_credito", label: "CartÍo" },
                ] as const).map((m) => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => {
                      atualizarCampo("metodo_saldo" as any, m.value);
                      if (m.value === "cartao_credito") {
                        atualizarCampo("pagamento_cartao", true);
                        if (!condicoes.parcelas_cartao_saldo) {
                          atualizarCampo("parcelas_cartao_saldo" as any, condicoes.numero_parcelas);
                        }
                      } else {
                        atualizarCampo("pagamento_cartao", false);
                      }
                    }}
                    className={`flex-1 px-1.5 py-1 rounded text-[9px] font-medium transition-colors border ${
                      condicoes.metodo_saldo === m.value
                        ? "bg-primary text-white border-[#F25C26]"
                        : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Detalhes cartÍo de crédito no saldo */}
              {condicoes.metodo_saldo === "cartao_credito" && taxaCartaoInfo.valorTaxa > 0 && (() => {
                const parcelasCartao = condicoes.parcelas_cartao_saldo || condicoes.numero_parcelas;
                const valorSaldoBase = totalSemCartao * (1 - condicoes.percentual_entrada / 100);
                const saldoComTaxa = valorSaldoBase + taxaCartaoInfo.valorTaxa;
                return (
                  <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-1.5">
                      <label className="text-[9px] text-orange-600">Parcelas no cartÍo:</label>
                      <select
                        value={parcelasCartao}
                        onChange={(e) => atualizarCampo("parcelas_cartao_saldo" as any, parseInt(e.target.value))}
                        className="px-2 py-0.5 text-[10px] border border-orange-200 rounded bg-white text-orange-700 focus:outline-none"
                        title="Parcelas no cartÍo de crédito"
                      >
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <option key={n} value={n}>{n}x</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between">
                        <span className="text-orange-600">Taxa cartÍo ({parcelasCartao}x)</span>
                        <span className="font-medium text-orange-700">{taxaCartaoInfo.percentual.toFixed(2)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-orange-600">Acréscimo (incluído no total)</span>
                        <span className="font-medium text-orange-700">+ {formatarMoeda(taxaCartaoInfo.valorTaxa)}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-orange-200">
                        <span className="font-medium text-gray-700">Saldo c/ cartÍo</span>
                        <span className="font-medium text-[#F25C26]">{formatarMoeda(saldoComTaxa)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Parcela</span>
                        <span className="font-medium text-[#F25C26]">{formatarMoeda(saldoComTaxa / parcelasCartao)}/mês</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* NavegaçÍo e Salvar do Passo 3 */}
        <div className="flex justify-between pt-4">
          <button
            onClick={voltarPasso}
            className="flex items-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar: Orçamento
          </button>
          <button
            onClick={handleSalvarProposta}
            disabled={salvando || itensProposta.length === 0}
            className="flex items-center gap-2 px-8 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 transition-all text-lg"
          >
            <Save className="w-5 h-5" />
            {salvando ? "Salvando..." : "Salvar Proposta"}
          </button>
        </div>
          </>
        )}
      </div>

      {/* Modal Importar Analise */}
      {modalImportarAnalise && clienteSelecionado && (
        <ImportarAnaliseModal
          clienteId={clienteSelecionado.id}
          clienteNome={clienteSelecionado.nome}
          itensPricelist={itensPricelist}
          onImportar={handleImportarAnalise}
          onClose={() => setModalImportarAnalise(false)}
        />
      )}

      {/* Dialog: Deseja incluir Material? */}
      {mostrarDialogMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className={TYPOGRAPHY.cardTitle}>Gerar Proposta Automatica</h3>
                <p className={TYPOGRAPHY.cardSubtitle}>{ambientes.length} ambientes cadastrados</p>
              </div>
            </div>
            <p className={`${TYPOGRAPHY.bodySmall} mb-6`}>
              Deseja incluir materiais na proposta ou apenas servicos (mao de obra)?
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMostrarDialogMaterial(false); handleGerarAutomatica(false); }}
                className={`flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 ${TYPOGRAPHY.cardTitle}`}
              >
                Apenas Servicos
              </button>
              <button
                type="button"
                onClick={() => { setMostrarDialogMaterial(false); handleGerarAutomatica(true); }}
                className={`flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 ${TYPOGRAPHY.cardTitle}`}
              >
                Incluir Materiais
              </button>
            </div>
            <button
              type="button"
              onClick={() => setMostrarDialogMaterial(false)}
              className={`w-full mt-3 px-4 py-2 text-gray-500 hover:text-gray-700 ${TYPOGRAPHY.caption}`}
            >
              Pular (adicionar itens manualmente)
            </button>
          </div>
        </div>
      )}

      {/* Modal Itens não Encontrados no Pricelist */}
      {modalItensNaoEncontrados && itensNaoEncontrados.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-amber-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.cardTitle}>Itens não encontrados</h3>
                  <p className={TYPOGRAPHY.cardSubtitle}>{itensNaoEncontrados.length} itens precisam ser vinculados ao catálogo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalItensNaoEncontrados(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Lista de itens */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh] space-y-3">
              {itensNaoEncontrados.map((item) => {
                const buscaAtual = buscaVinculoModal[item.id] || "";
                const itensFiltrados = buscaAtual.length >= 2
                  ? itensPricelist.filter(p =>
                      p.nome.toLowerCase().includes(buscaAtual.toLowerCase()) ||
                      (p.descricao || "").toLowerCase().includes(buscaAtual.toLowerCase())
                    ).slice(0, 5)
                  : [];

                return (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className={TYPOGRAPHY.cardTitle}>{item.nome}</p>
                        <div className={`flex items-center gap-2 mt-1 ${TYPOGRAPHY.cardSubtitle}`}>
                          {item.ambiente && (
                            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">{item.ambiente}</span>
                          )}
                          <span>{item.quantidade} {item.unidade}</span>
                          <span className="text-gray-400">•</span>
                          <span>{item.categoria}</span>
                        </div>
                      </div>
                    </div>

                    {/* Campo de busca para vincular */}
                    <div className="mt-2">
                      <input
                        type="text"
                        placeholder="Buscar no catálogo para vincular..."
                        value={buscaAtual}
                        onChange={(e) => setBuscaVinculoModal(prev => ({ ...prev, [item.id]: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:border-blue-400 outline-none"
                      />

                      {/* Resultados da busca */}
                      {itensFiltrados.length > 0 && (
                        <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden bg-white">
                          {itensFiltrados.map((priceItem) => (
                            <button
                              type="button"
                              key={priceItem.id}
                              title={`Vincular a ${priceItem.nome}`}
                              onClick={() => {
                                // Vincular: adicionar item à proposta com dados do pricelist
                                const categoriaStr = typeof priceItem.categoria === 'object' && priceItem.categoria
                                  ? (priceItem.categoria as { nome?: string }).nome
                                  : (priceItem.categoria as string | undefined);
                                const subcategoriaStr = typeof priceItem.subcategoria === 'object' && priceItem.subcategoria
                                  ? (priceItem.subcategoria as { nome?: string }).nome
                                  : (priceItem.subcategoria as string | undefined);
                                const nucleoStr = typeof priceItem.nucleo === 'object' && priceItem.nucleo
                                  ? (priceItem.nucleo as { nome?: string }).nome
                                  : priceItem.nucleo;
                                const unidadeRaw = String(priceItem.unidade || "un");
                                const unidadeNormalizada: ItemUnit = ["m2", "ml", "un", "diaria", "hora", "empreita"].includes(unidadeRaw)
                                  ? unidadeRaw as ItemUnit
                                  : "un";
                                const nucleoItem = nucleoStr && ['arquitetura', 'engenharia', 'marcenaria', 'produtos'].includes(nucleoStr.toLowerCase())
                                  ? nucleoStr.toLowerCase() as NucleoItem
                                  : "engenharia";

                                adicionarItem({
                                  id: priceItem.id,
                                  codigo: priceItem.codigo,
                                  nome: priceItem.nome,
                                  descricao: priceItem.descricao,
                                  categoria: categoriaStr || "Sem categoria",
                                  categoria_id: priceItem.categoria_id || null,
                                  subcategoria: subcategoriaStr,
                                  subcategoria_id: priceItem.subcategoria_id || null,
                                  tipo: priceItem.tipo || "material",
                                  unidade: unidadeNormalizada,
                                  preco: priceItem.preco || 0,
                                  nucleo: nucleoItem,
                                });

                                // Remover da lista de não encontrados
                                setItensNaoEncontrados(prev => prev.filter(i => i.id !== item.id));
                                setBuscaVinculoModal(prev => {
                                  const newState = { ...prev };
                                  delete newState[item.id];
                                  return newState;
                                });

                                toast({
                                  title: "Item vinculado",
                                  description: `${priceItem.nome} adicionado à proposta`,
                                });
                              }}
                              className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between border-b border-gray-100 last:border-b-0"
                            >
                              <div>
                                <p className={TYPOGRAPHY.cardTitle}>{priceItem.nome}</p>
                                <p className={TYPOGRAPHY.cardSubtitle}>{formatarMoeda(priceItem.preco || 0)}/{priceItem.unidade}</p>
                              </div>
                              <Link2 className={TYPOGRAPHY.iconSmall + " text-blue-500"} />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* AçÍo de ignorar */}
                    <div className="mt-2 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setItensNaoEncontrados(prev => prev.filter(i => i.id !== item.id))}
                        className={`${TYPOGRAPHY.cardSubtitle} hover:text-red-500`}
                        title="Ignorar este item"
                      >
                        Ignorar item
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setItensNaoEncontrados([]);
                  setModalItensNaoEncontrados(false);
                }}
                className={`${TYPOGRAPHY.bodySmall} text-gray-600 hover:text-gray-800`}
                title="Ignorar todos os itens não encontrados"
              >
                Ignorar todos
              </button>
              <button
                type="button"
                onClick={() => setModalItensNaoEncontrados(false)}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 ${TYPOGRAPHY.cardTitle}`}
                title="Concluir e fechar"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal EdiçÍo de Ambiente */}
      {ambienteEditando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-emerald-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.cardTitle}>Editar Ambiente</h3>
                  <p className={TYPOGRAPHY.cardSubtitle}>{ambienteEditando.nome}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAmbienteEditandoId(null)}
                className="text-gray-400 hover:text-gray-600"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4">
              <div>
                <label className={`${TYPOGRAPHY.formLabel} block mb-1`}>Nome do Ambiente</label>
                <div className="flex gap-2">
                  <select
                    value={ambientes.some(a => a.nome === ambienteEditando.nome && a.id !== ambienteEditando.id) ? ambienteEditando.nome : "__custom__"}
                    onChange={(e) => {
                      if (e.target.value !== "__custom__") {
                        atualizarAmbiente(ambienteEditando.id, { nome: e.target.value });
                      }
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none bg-white"
                    title="Selecione o ambiente do projeto"
                  >
                    {/* OpçÍo personalizada */}
                    <option value="__custom__">-- Digitar nome --</option>
                    {/* Lista de ambientes do projeto (exceto o atual) */}
                    {ambientes
                      .filter(a => a.id !== ambienteEditando.id)
                      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
                      .map(a => (
                        <option key={a.id} value={a.nome}>
                          {a.nome} ({(a.area_piso || 0).toFixed(1)}m²)
                        </option>
                      ))
                    }
                  </select>
                </div>
                {/* Campo de texto para nome personalizado */}
                {!ambientes.some(a => a.nome === ambienteEditando.nome && a.id !== ambienteEditando.id) && (
                  <input
                    type="text"
                    value={ambienteEditando.nome}
                    onChange={(e) => atualizarAmbiente(ambienteEditando.id, { nome: e.target.value })}
                    className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                    title="Digite o nome do ambiente"
                    placeholder="Ex: Sala de Estar"
                  />
                )}
                <p className="text-xs text-gray-500 mt-1">Selecione um ambiente do projeto ou digite um nome</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${TYPOGRAPHY.formLabel} block mb-1`}>Largura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ambienteEditando.largura || ""}
                    onChange={(e) => atualizarAmbiente(ambienteEditando.id, { largura: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                    title="Largura em metros"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className={`${TYPOGRAPHY.formLabel} block mb-1`}>Comprimento (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ambienteEditando.comprimento || ""}
                    onChange={(e) => atualizarAmbiente(ambienteEditando.id, { comprimento: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                    title="Comprimento em metros"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`${TYPOGRAPHY.formLabel} block mb-1`}>Pe Direito (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ambienteEditando.pe_direito || 2.7}
                    onChange={(e) => atualizarAmbiente(ambienteEditando.id, { pe_direito: parseFloat(e.target.value) || 2.7 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                    title="Pe direito em metros"
                    placeholder="2.70"
                  />
                </div>
                <div>
                  <label className={`${TYPOGRAPHY.formLabel} block mb-1`}>Area Manual (m²)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={ambienteEditando.area_piso || ""}
                    onChange={(e) => atualizarAmbiente(ambienteEditando.id, { area: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none"
                    title="Area manual em metros quadrados"
                    placeholder="Calc. automatico"
                  />
                </div>
              </div>

              {/* Resumo de areas calculadas */}
              <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                <h4 className={`${TYPOGRAPHY.formLabel} mb-2`}>Areas Calculadas</h4>
                <div className={`grid grid-cols-2 gap-2 ${TYPOGRAPHY.cardSubtitle}`}>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Piso:</span>
                    <span className="font-medium">{(ambienteEditando.area_piso || 0).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Teto:</span>
                    <span className="font-medium">{(ambienteEditando.area_teto || 0).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paredes (bruta):</span>
                    <span className="font-medium">{(ambienteEditando.area_paredes_bruta || 0).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Paredes (liquida):</span>
                    <span className="font-medium">{(ambienteEditando.area_paredes_liquida || 0).toFixed(2)} m²</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Perimetro:</span>
                    <span className="font-medium">{(ambienteEditando.perimetro || 0).toFixed(2)} m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Tem certeza que deseja remover o ambiente "${ambienteEditando.nome}"?`)) {
                    removerAmbiente(ambienteEditando.id);
                    setAmbienteEditandoId(null);
                  }
                }}
                className={`${TYPOGRAPHY.bodySmall} text-red-600 hover:text-red-800`}
              >
                Remover Ambiente
              </button>
              <button
                type="button"
                onClick={() => setAmbienteEditandoId(null)}
                className={`px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 ${TYPOGRAPHY.cardTitle}`}
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Componente: Card de Grupo por Nucleo
// ============================================================

interface GrupoNucleoCardProps {
  grupo: GrupoNucleo;
  ambientes: Ambiente[];
  categorias: PricelistCategoria[];
  subcategorias: PricelistSubcategoria[];
  nucleos: Nucleo[];
  onAtualizarQuantidade: (id: string, qtd: number) => void;
  onAtualizarNucleo: (id: string, nucleo: NucleoItem, nucleo_id?: string) => void;
  onAtualizarCategoria: (id: string, categoria: string, categoria_id?: string) => void;
  onAtualizarSubcategoria: (id: string, subcategoria: string, subcategoria_id?: string) => void;
  onAtualizarTipo: (id: string, tipo: "material" | "mao_obra" | "servico" | "produto" | "ambos") => void;
  onAtualizarNome: (id: string, nome: string) => void;
  onRemover: (id: string) => void;
  onEditarAmbiente?: (ambienteId: string) => void;
  sublabel?: string;
}

function GrupoNucleoCard({ grupo, ambientes, categorias, subcategorias, nucleos, onAtualizarQuantidade, onAtualizarNucleo, onAtualizarCategoria, onAtualizarSubcategoria, onAtualizarTipo, onAtualizarNome, onRemover, onEditarAmbiente, sublabel }: GrupoNucleoCardProps) {
  const [aberto, setAberto] = useState(true);

  const getAmbienteData = (item: ItemProposta) => {
    const ids = Array.from(
      new Set([
        ...(item.ambientes_ids || []),
        item.ambiente_id || "",
      ].filter(Boolean))
    );

    return ids
      .map((id) => {
        const amb = ambientes.find((a) => a.id === id);
        return amb ? { id: amb.id, nome: amb.nome } : null;
      })
      .filter((data): data is { id: string; nome: string } => Boolean(data));
  };

  return (
    <div>
      <button
        onClick={() => setAberto(!aberto)}
        className="w-full p-3 flex items-center justify-between hover:bg-gray-50"
        style={{ borderLeftWidth: 4, borderLeftColor: grupo.cor }}
      >
        <div className="flex items-center gap-2">
          {aberto ? <ChevronDown className={TYPOGRAPHY.iconSmall + " text-gray-400"} /> : <ChevronUp className={TYPOGRAPHY.iconSmall + " text-gray-400"} />}
          <span className={TYPOGRAPHY.cardTitle} style={{ color: grupo.cor }}>{grupo.label}</span>
          {sublabel && <span className={TYPOGRAPHY.caption}>({sublabel})</span>}
          <span className={TYPOGRAPHY.cardSubtitle}>({grupo.itens.length})</span>
        </div>
        <span className={TYPOGRAPHY.moneySmall}>{formatarMoeda(grupo.total)}</span>
      </button>

      {aberto && (
        <div className="px-3 pb-3 space-y-2">
          {grupo.itens.map((item) => {
            const ambientesData = getAmbienteData(item);
            const norm = (v?: string | null) => (v || "").trim().toLowerCase();
            const categoriaIdRender =
              item.item.categoria_id ||
              categorias.find((cat) => norm(cat.nome) === norm(item.item.categoria))?.id ||
              "";
            const subcategoriasDaCategoria = subcategorias.filter(
              (sub) => !categoriaIdRender || sub.categoria_id === categoriaIdRender
            );
            const subcategoriaIdRender =
              item.item.subcategoria_id ||
              subcategoriasDaCategoria.find((sub) => norm(sub.nome) === norm(item.item.subcategoria))?.id ||
              "";
            const categoriaAtual = categorias.find(
              (cat) => cat.id === categoriaIdRender
            );

            return (
              <div key={item.id} className="p-2 rounded-lg border bg-gray-50 border-gray-200 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item.descricao_customizada || item.item.nome || ""}
                        onChange={(e) => onAtualizarNome(item.id, e.target.value)}
                        className={`${TYPOGRAPHY.cardTitle} truncate bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none focus:ring-0 px-0 py-0 w-full`}
                        title="Editar nome do item"
                      />
                    </div>
                    <div className={`flex flex-wrap items-center gap-2 mt-0.5 ${TYPOGRAPHY.caption}`}>
                      {ambientesData.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {ambientesData.map((amb) => (
                            <button
                              key={`${item.id}-${amb.id}`}
                              type="button"
                              onClick={() => onEditarAmbiente?.(amb.id)}
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-full hover:bg-emerald-200 hover:text-emerald-800 transition-colors cursor-pointer ${TYPOGRAPHY.caption}`}
                              title={`Clique para editar ${amb.nome}`}
                            >
                              {amb.nome}
                            </button>
                          ))}
                        </div>
                      )}
                      <span>{formatarMoeda(item.valor_unitario)}/{item.item.unidade}</span>
                    </div>
                    {(categoriaAtual?.tipo_servico || categoriaAtual?.guia_principal) && (
                      <div className={`flex flex-wrap items-center gap-1 mt-1 ${TYPOGRAPHY.caption}`}>
                        {categoriaAtual?.tipo_servico && (
                          <span className="px-1.5 py-0.5 bg-gray-100 rounded-full">
                            Serviço: {categoriaAtual.tipo_servico}
                          </span>
                        )}
                        {categoriaAtual?.guia_principal && (
                          <span className="px-1.5 py-0.5 bg-orange-50 border border-orange-200 text-orange-700 rounded-full">
                            Guia: {categoriaAtual.guia_principal}
                          </span>
                        )}
                      </div>
                    )}
                    <div className={`flex flex-wrap items-center gap-2 mt-1 ${TYPOGRAPHY.caption}`}>
                      {/* Tag de Núcleo clicável */}
                      <div className="relative group">
                        {item.item.nucleo ? (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer transition-all hover:opacity-80"
                            style={{
                              backgroundColor: `${CORES_NUCLEO[item.item.nucleo as keyof typeof CORES_NUCLEO]?.cor || "#6B7280"}20`,
                              color: CORES_NUCLEO[item.item.nucleo as keyof typeof CORES_NUCLEO]?.cor || "#6B7280",
                              border: `1px solid ${CORES_NUCLEO[item.item.nucleo as keyof typeof CORES_NUCLEO]?.cor || "#6B7280"}40`,
                            }}
                            title="Clique para alterar núcleo"
                          >
                            {CORES_NUCLEO[item.item.nucleo as keyof typeof CORES_NUCLEO]?.label || "Outros"}
                            <ChevronDown className="w-3 h-3" />
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full cursor-pointer bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200"
                            title="Definir núcleo"
                          >
                            Sem núcleo
                            <ChevronDown className="w-3 h-3" />
                          </span>
                        )}
                        <select
                          value={item.item.nucleo || ""}
                          onChange={(e) => {
                            const nucleoSelecionado = nucleos.find(n => n.id === e.target.value);
                            const nucleoNome = nucleoSelecionado?.nome?.toLowerCase() as NucleoItem || "arquitetura";
                            onAtualizarNucleo(item.id, nucleoNome, e.target.value || undefined);
                          }}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          title="Alterar nucleo"
                        >
                          <option value="">Sem núcleo</option>
                          {nucleos.map(nuc => (
                            <option key={nuc.id} value={nuc.id}>{nuc.nome}</option>
                          ))}
                        </select>
                      </div>
                      {/* Seletor de Categoria */}
                      <select
                        value={categoriaIdRender}
                        onChange={(e) => {
                          const cat = categorias.find(c => c.id === e.target.value);
                          onAtualizarCategoria(item.id, cat?.nome || "", e.target.value || undefined);
                        }}
                        className={`px-1.5 py-0.5 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px] ${TYPOGRAPHY.caption}`}
                        title="Alterar categoria"
                      >
                        <option value="">Categoria</option>
                        {categorias.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.nome}</option>
                        ))}
                      </select>
                      {/* Seletor de Subcategoria */}
                      <select
                        value={subcategoriaIdRender}
                        onChange={(e) => {
                          const sub = subcategorias.find(s => s.id === e.target.value);
                          onAtualizarSubcategoria(item.id, sub?.nome || "", e.target.value || undefined);
                        }}
                        className={`px-1.5 py-0.5 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[100px] ${TYPOGRAPHY.caption}`}
                        title="Alterar subcategoria"
                      >
                        <option value="">Subcategoria</option>
                        {subcategorias
                          .filter(sub => !categoriaIdRender || sub.categoria_id === categoriaIdRender)
                          .map(sub => (
                            <option key={sub.id} value={sub.id}>{sub.nome}</option>
                          ))}
                      </select>
                      {/* Seletor de Tipo */}
                      <select
                        value={item.item.tipo || "material"}
                        onChange={(e) => onAtualizarTipo(item.id, e.target.value as "material" | "mao_obra" | "servico" | "produto" | "ambos")}
                        className={`px-1.5 py-0.5 border border-gray-300 rounded bg-white hover:border-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer ${TYPOGRAPHY.caption}`}
                        title="Alterar tipo"
                      >
                        <option value="material">Material</option>
                        <option value="mao_obra">MÍo de Obra</option>
                        <option value="servico">Serviço</option>
                        <option value="produto">Produto</option>
                        <option value="ambos">Mat+MO</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                      <button
                        type="button"
                        onClick={() => onAtualizarQuantidade(item.id, Math.max(0.01, item.quantidade - 1))}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border-r border-gray-200"
                        title="Diminuir"
                      >
                        <span className="text-sm font-normal">−</span>
                      </button>
                      <input
                        type="number"
                        value={item.quantidade}
                        onChange={(e) => onAtualizarQuantidade(item.id, Math.max(0.01, parseFloat(e.target.value) || 0))}
                        step="0.01"
                        min="0.01"
                        className="w-16 h-7 px-1 text-center text-sm font-medium border-0 focus:outline-none focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => onAtualizarQuantidade(item.id, item.quantidade + 1)}
                        className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors border-l border-gray-200"
                        title="Aumentar"
                      >
                        <span className="text-sm font-normal">+</span>
                      </button>
                    </div>
                    <span className={`${TYPOGRAPHY.moneySmall} min-w-[5.5rem] text-right whitespace-nowrap`}>
                      {formatarMoeda(item.quantidade * item.valor_unitario)}
                    </span>
                    <button onClick={() => onRemover(item.id)} className="p-1 text-gray-400 hover:text-red-500" title="Remover item">
                      <Trash2 className={TYPOGRAPHY.iconSmall} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


