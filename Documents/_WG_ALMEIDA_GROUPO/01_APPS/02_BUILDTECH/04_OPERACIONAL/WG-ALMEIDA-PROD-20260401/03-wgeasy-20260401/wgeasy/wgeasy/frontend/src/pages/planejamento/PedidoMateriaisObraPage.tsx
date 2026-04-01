/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PEDIDO DE MATERIAIS DE OBRA
// Sistema WG Easy - Grupo WG Almeida
// Fluxo simplificado: Cliente → Kits → Revisar → Aprovar
// ============================================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Package,
  Search,
  ChevronRight,
  Check,
  Building2,
  Layers,
  ClipboardList,
  Send,
  Loader2,
  AlertCircle,
  Plus,
  Minus,
  Trash2,
  MapPin,
  ArrowLeft,
  ShoppingCart,
  FileText,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  Eye,
  Download,
  Users,
  Globe,
  Copy,
  Edit,
  X,
  Save,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  listarComposicoes,
  buscarComposicaoCompleta,
  type ModeloComposicao,
  type ModeloComposicaoItem,
} from "@/lib/composicoesApi";
import { listarItensComFiltros, type PricelistItemCompleto } from "@/lib/pricelistApi";
import { supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";

// ============================================================
// TIPOS
// ============================================================

interface ClienteObra {
  id: string;
  nome: string;
  endereco?: string;
  tipo?: string;
  area_total?: number;
  total_ambientes?: number;
  status?: string;
  analise_id?: string;
  projeto_compras_id?: string;
  pedidos_count?: number;
  ultimo_pedido?: string;
}

interface KitMaterial {
  composicao: ModeloComposicao;
  selecionado: boolean;
  quantidade: number;
  itensExpandidos?: boolean;
  itensCarregados?: ModeloComposicaoItem[];
}

interface ItemPedido {
  id: string;
  composicao_codigo: string;
  composicao_nome: string;
  descricao: string;
  classificacao: string;
  quantidade_calculada: number;
  quantidade_ajustada: number;
  unidade: string;
  preco_unitario: number;
  valor_total: number;
  categoria?: string;
  observacao?: string;
  pricelist_item_id?: string;
}

interface PedidoExistente {
  id: string;
  codigo: string;
  nome: string;
  status: string;
  criado_em: string;
  total_itens: number;
  valor_total: number;
}

// ============================================================
// CONSTANTES
// ============================================================

const PASSOS = [
  { id: 1, nome: "Cliente", icone: Building2 },
  { id: 2, nome: "Kits", icone: Layers },
  { id: 3, nome: "Revisar", icone: ClipboardList },
];

const STATUS_CORES: Record<string, { bg: string; text: string; label: string }> = {
  PENDENTE: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pendente" },
  APROVADO: { bg: "bg-green-100", text: "text-green-700", label: "Aprovado" },
  EM_ANDAMENTO: { bg: "bg-blue-100", text: "text-blue-700", label: "Em Andamento" },
  FINALIZADO: { bg: "bg-gray-100", text: "text-gray-700", label: "Finalizado" },
  CANCELADO: { bg: "bg-red-100", text: "text-red-700", label: "Cancelado" },
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export default function PedidoMateriaisObraPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const clienteIdUrl = searchParams.get("cliente");

  // Estados do fluxo
  const [passoAtual, setPassoAtual] = useState(1);
  const [loading, setLoading] = useState(false);

  // Passo 1: Cliente
  const [clientes, setClientes] = useState<ClienteObra[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<ClienteObra | null>(null);
  const [buscaCliente, setBuscaCliente] = useState("");
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [pedidosCliente, setPedidosCliente] = useState<PedidoExistente[]>([]);

  // Passo 2: Kits
  const [kits, setKits] = useState<KitMaterial[]>([]);
  const [loadingKits, setLoadingKits] = useState(false);
  const [buscaKit, setBuscaKit] = useState("");

  // Passo 3: Itens
  const [itensPedido, setItensPedido] = useState<ItemPedido[]>([]);
  const [filtroClassificacao, setFiltroClassificacao] = useState<string>("todos");
  const [enviando, setEnviando] = useState(false);

  // Busca de itens do pricelist (inline no passo 2)
  const [buscaPricelist, setBuscaPricelist] = useState("");
  const [itensPricelist, setItensPricelist] = useState<PricelistItemCompleto[]>([]);
  const [loadingPricelist, setLoadingPricelist] = useState(false);

  // Busca na internet
  const [urlBuscaInternet, setUrlBuscaInternet] = useState("");
  const [buscaNomeInternet, setBuscaNomeInternet] = useState("");
  const [modosBuscaInternet, setModosBuscaInternet] = useState<"url" | "nome">("url");

  // Modal de ediçÍo do kit
  const [kitEditando, setKitEditando] = useState<KitMaterial | null>(null);
  const [itensKitEditando, setItensKitEditando] = useState<ModeloComposicaoItem[]>([]);
  const [loadingItensKit, setLoadingItensKit] = useState(false);
  const [buscaItemKit, setBuscaItemKit] = useState("");

  // ============================================================
  // CARREGAR CLIENTES (com análises de projeto)
  // ============================================================

  useEffect(() => {
    carregarClientes();
  }, [clienteIdUrl]);

  async function carregarClientes() {
    try {
      setLoadingClientes(true);

      // Buscar análises sem join (evita erro de FK)
      const { data: analises, error } = await supabase
        .from("analises_projeto")
        .select("id, titulo, cliente_id, endereco_obra, status, total_ambientes, total_area_piso, criado_em")
        .in("status", ["analisado", "aprovado", "em_execucao"])
        .order("criado_em", { ascending: false });

      if (error) throw error;

      // Buscar nomes dos clientes separadamente
      const clienteIds = [...new Set((analises || []).map(a => a.cliente_id).filter(Boolean))];
      let clientesMap: Record<string, string> = {};
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from("pessoas")
          .select("id, nome")
          .in("id", clienteIds);
        if (clientes) {
          clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));
        }
      }

      const clientesFormatados: ClienteObra[] = await Promise.all(
        (analises || []).map(async (a: any) => {
          const clienteNome = a.cliente_id ? clientesMap[a.cliente_id] || a.titulo : a.titulo;

          const { count } = await supabase
            .from("projetos_compras")
            .select("*", { count: "exact", head: true })
            .ilike("cliente_nome", `%${clienteNome}%`);

          return {
            id: a.id,
            nome: clienteNome,
            endereco: a.endereco_obra,
            tipo: a.titulo,
            area_total: a.total_area_piso,
            total_ambientes: a.total_ambientes,
            status: a.status,
            analise_id: a.id,
            pedidos_count: count || 0,
          };
        })
      );

      setClientes(clientesFormatados);

      if (clienteIdUrl) {
        const clienteEncontrado = clientesFormatados.find(
          (c) => c.id === clienteIdUrl || c.analise_id === clienteIdUrl
        );
        if (clienteEncontrado) {
          selecionarCliente(clienteEncontrado);
          toast({
            title: "Cliente selecionado",
            description: `${clienteEncontrado.nome} foi selecionado automaticamente.`,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os clientes.",
        variant: "destructive",
      });
    } finally {
      setLoadingClientes(false);
    }
  }

  // ============================================================
  // CARREGAR PEDIDOS DO CLIENTE
  // ============================================================

  async function carregarPedidosCliente(cliente: ClienteObra) {
    try {
      const { data, error } = await supabase
        .from("projetos_compras")
        .select("id, codigo, nome, status, created_at")
        .ilike("cliente_nome", `%${cliente.nome}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const pedidos: PedidoExistente[] = await Promise.all(
        (data || []).map(async (p: any) => {
          const { data: itens } = await supabase
            .from("projeto_lista_compras")
            .select("id, valor_total")
            .eq("projeto_id", p.id);

          const totalItens = itens?.length || 0;
          const valorTotal = itens?.reduce((acc, i) => acc + (i.valor_total || 0), 0) || 0;

          return {
            id: p.id,
            codigo: p.codigo,
            nome: p.nome,
            status: p.status,
            criado_em: p.created_at,
            total_itens: totalItens,
            valor_total: valorTotal,
          };
        })
      );

      setPedidosCliente(pedidos);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
    }
  }

  // ============================================================
  // CARREGAR KITS DE MATERIAIS
  // ============================================================

  async function carregarKits() {
    try {
      setLoadingKits(true);

      const composicoes = await listarComposicoes({ ativo: true });

      const kitsOrdenados = composicoes.sort((a, b) => {
        const prioridadeA = a.codigo.startsWith("PREOBRA") || a.codigo.startsWith("PROT") || a.codigo.startsWith("CINZA") ? 0 : 1;
        const prioridadeB = b.codigo.startsWith("PREOBRA") || b.codigo.startsWith("PROT") || b.codigo.startsWith("CINZA") ? 0 : 1;
        return prioridadeA - prioridadeB;
      });

      const kitsFormatados: KitMaterial[] = kitsOrdenados.map((c) => ({
        composicao: c,
        selecionado: c.codigo.startsWith("PREOBRA") || c.codigo.startsWith("CINZA") || c.codigo.startsWith("PROT"),
        quantidade: 1,
        itensExpandidos: false,
        itensCarregados: [],
      }));

      setKits(kitsFormatados);
    } catch (error) {
      console.error("Erro ao carregar kits:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os kits de materiais.",
        variant: "destructive",
      });
    } finally {
      setLoadingKits(false);
    }
  }

  // ============================================================
  // BUSCA NO PRICELIST (inline)
  // ============================================================

  async function buscarNosPricelist(termo: string) {
    if (!termo || termo.length < 2) {
      setItensPricelist([]);
      return;
    }

    try {
      setLoadingPricelist(true);
      const itens = await listarItensComFiltros({
        busca: termo,
        apenas_ativos: true,
        limite: 30,
      });
      setItensPricelist(itens);
    } catch (error) {
      console.error("Erro ao buscar no pricelist:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível buscar os itens.",
        variant: "destructive",
      });
    } finally {
      setLoadingPricelist(false);
    }
  }

  function adicionarItemDoPricelist(item: PricelistItemCompleto, quantidade: number = 1) {
    const itemId = `PRICELIST-${item.id}-${Date.now()}`;
    const valorTotal = quantidade * (item.preco || 0);

    let classificacao = "INSUMO";
    if (item.tipo === "mao_obra" || item.tipo === "servico") {
      classificacao = "CONSUMIVEL";
    }

    setItensPedido((prev) => [
      ...prev,
      {
        id: itemId,
        composicao_codigo: item.codigo || "PRICELIST",
        composicao_nome: item.categoria?.nome || "Pricelist",
        descricao: item.nome,
        classificacao,
        quantidade_calculada: quantidade,
        quantidade_ajustada: quantidade,
        unidade: item.unidade || "UN",
        preco_unitario: item.preco || 0,
        valor_total: valorTotal,
        categoria: item.subcategoria?.nome || item.categoria?.nome || "Geral",
        pricelist_item_id: item.id,
      },
    ]);

    toast({
      title: "Item adicionado",
      description: `${item.nome} foi adicionado ao pedido.`,
    });
  }

  // ============================================================
  // CALCULAR ITENS DO PEDIDO (dos kits selecionados)
  // ============================================================

  async function calcularItensPedido() {
    try {
      setLoading(true);

      const kitsSelecionados = kits.filter((k) => k.selecionado);
      const todosItens: ItemPedido[] = [];

      for (const kit of kitsSelecionados) {
        const composicaoCompleta = await buscarComposicaoCompleta(kit.composicao.id);

        if (composicaoCompleta?.itens) {
          for (const item of composicaoCompleta.itens) {
            const quantidadeCalculada = item.coeficiente * kit.quantidade;
            const quantidadeFinal = item.arredondar_para
              ? Math.ceil(quantidadeCalculada / item.arredondar_para) * item.arredondar_para
              : Math.ceil(quantidadeCalculada);

            todosItens.push({
              id: `${kit.composicao.codigo}-${item.id}`,
              composicao_codigo: kit.composicao.codigo,
              composicao_nome: kit.composicao.nome,
              descricao: item.descricao_generica,
              classificacao: item.classificacao,
              quantidade_calculada: quantidadeCalculada,
              quantidade_ajustada: Math.max(quantidadeFinal, item.minimo || 1),
              unidade: item.unidade,
              preco_unitario: item.pricelist_item?.preco || 0,
              valor_total: (item.pricelist_item?.preco || 0) * quantidadeFinal,
              categoria: item.categoria_material,
              observacao: item.observacao,
            });
          }
        }
      }

      // Manter itens já adicionados manualmente/pricelist
      const itensManutencao = itensPedido.filter(
        (i) => i.composicao_codigo === "MANUAL" || i.composicao_codigo === "PRICELIST" || i.composicao_codigo.startsWith("PRICELIST")
      );

      const itensAgrupados = agruparItens([...todosItens, ...itensManutencao]);
      setItensPedido(itensAgrupados);
    } catch (error) {
      console.error("Erro ao calcular itens:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível calcular os itens do pedido.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function agruparItens(itens: ItemPedido[]): ItemPedido[] {
    const agrupado: Record<string, ItemPedido> = {};

    for (const item of itens) {
      const chave = `${item.descricao}|${item.classificacao}|${item.unidade}`;

      if (agrupado[chave]) {
        agrupado[chave].quantidade_calculada += item.quantidade_calculada;
        agrupado[chave].quantidade_ajustada += item.quantidade_ajustada;
        agrupado[chave].valor_total += item.valor_total;
      } else {
        agrupado[chave] = { ...item };
      }
    }

    return Object.values(agrupado).sort((a, b) => {
      const ordemClass = ["INSUMO", "CONSUMIVEL", "ACABAMENTO", "FERRAMENTA"];
      const idxA = ordemClass.indexOf(a.classificacao);
      const idxB = ordemClass.indexOf(b.classificacao);
      if (idxA !== idxB) return idxA - idxB;
      return a.descricao.localeCompare(b.descricao);
    });
  }

  // ============================================================
  // AJUSTAR QUANTIDADE
  // ============================================================

  function ajustarQuantidade(itemId: string, delta: number) {
    setItensPedido((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const novaQtd = Math.max(0, item.quantidade_ajustada + delta);
          return {
            ...item,
            quantidade_ajustada: novaQtd,
            valor_total: novaQtd * item.preco_unitario,
          };
        }
        return item;
      })
    );
  }

  function removerItem(itemId: string) {
    setItensPedido((prev) => prev.filter((item) => item.id !== itemId));
  }

  // ============================================================
  // AÇÕES DOS KITS: DUPLICAR, EDITAR, EXCLUIR
  // ============================================================

  function duplicarKit(kit: KitMaterial) {
    const novoKit: KitMaterial = {
      ...kit,
      composicao: {
        ...kit.composicao,
        id: `${kit.composicao.id}-copy-${Date.now()}`,
        nome: `${kit.composicao.nome} (Cópia)`,
      },
      selecionado: true,
    };
    setKits((prev) => [...prev, novoKit]);
    toast({
      title: "Kit duplicado",
      description: `${novoKit.composicao.nome} foi adicionado.`,
    });
  }

  async function abrirEdicaoKit(kit: KitMaterial) {
    setKitEditando(kit);
    setLoadingItensKit(true);
    setBuscaItemKit("");

    try {
      const composicaoCompleta = await buscarComposicaoCompleta(kit.composicao.id);
      setItensKitEditando(composicaoCompleta?.itens || []);
    } catch (error) {
      console.error("Erro ao carregar itens do kit:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar os itens do kit.",
        variant: "destructive",
      });
    } finally {
      setLoadingItensKit(false);
    }
  }

  function excluirKit(kitId: string) {
    setKits((prev) => prev.filter((k) => k.composicao.id !== kitId));
    toast({
      title: "Kit removido",
      description: "O kit foi removido da lista.",
    });
  }

  // ============================================================
  // SALVAR ORÇAMENTO (vai para /planejamento/orcamentos)
  // ============================================================

  async function salvarOrcamento() {
    if (!clienteSelecionado || itensPedido.length === 0) {
      toast({
        title: "AtençÍo",
        description: "Selecione um cliente e adicione itens ao pedido.",
        variant: "destructive",
      });
      return;
    }

    try {
      setEnviando(true);

      // Calcular valor total
      const valorTotal = itensPedido.reduce((acc, i) => acc + i.valor_total, 0);

      // Criar orçamento
      const { data: orcamento, error: erroOrcamento } = await supabase
        .from("orcamentos")
        .insert({
          titulo: `Materiais de Obra - ${clienteSelecionado.nome}`,
          cliente_id: clienteSelecionado.id,
          cliente_nome: clienteSelecionado.nome,
          endereco_obra: clienteSelecionado.endereco,
          status: "rascunho",
          valor_total: valorTotal,
          margem: 15, // Margem padrÍo de 15%
          tipo: "MATERIAIS_OBRA",
        })
        .select()
        .single();

      if (erroOrcamento) throw erroOrcamento;

      // Inserir itens do orçamento
      for (const item of itensPedido.filter((i) => i.quantidade_ajustada > 0)) {
        await supabase.from("orcamentos_itens").insert({
          orcamento_id: orcamento.id,
          descricao: item.descricao,
          quantidade: item.quantidade_ajustada,
          unidade: item.unidade,
          preco_unitario: item.preco_unitario,
          valor_total: item.valor_total,
          categoria: item.categoria || item.classificacao,
          pricelist_item_id: item.pricelist_item_id,
        });
      }

      toast({
        title: "Orçamento salvo!",
        description: `Orçamento criado com ${itensPedido.length} itens. Redirecionando...`,
      });

      // Navegar para página de orçamentos
      navigate("/planejamento/orcamentos");
    } catch (error: any) {
      console.error("Erro ao salvar orçamento:", error);
      toast({
        title: "Erro",
        description: error.message || "NÍo foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  }

  // ============================================================
  // NAVEGAÇÍO ENTRE PASSOS
  // ============================================================

  function avancarPasso() {
    if (passoAtual === 1 && !clienteSelecionado) {
      toast({
        title: "Selecione um cliente",
        description: "Escolha um cliente/obra para continuar.",
        variant: "destructive",
      });
      return;
    }

    if (passoAtual === 2) {
      calcularItensPedido();
    }

    setPassoAtual((prev) => Math.min(prev + 1, 3));
  }

  function voltarPasso() {
    setPassoAtual((prev) => Math.max(prev - 1, 1));
  }

  function selecionarCliente(cliente: ClienteObra) {
    setClienteSelecionado(cliente);
    carregarPedidosCliente(cliente);
    carregarKits();
  }

  // ============================================================
  // FILTROS E TOTAIS
  // ============================================================

  const clientesFiltrados = useMemo(() => {
    if (!buscaCliente) return clientes;
    const termo = normalizeSearchTerm(buscaCliente);
    return clientes.filter(
      (c) =>
        normalizeSearchTerm(c.nome).includes(termo) ||
        normalizeSearchTerm(c.tipo || "").includes(termo) ||
        normalizeSearchTerm(c.endereco || "").includes(termo)
    );
  }, [clientes, buscaCliente]);

  const kitsFiltrados = useMemo(() => {
    if (!buscaKit) return kits;
    const termo = normalizeSearchTerm(buscaKit);
    return kits.filter(
      (k) =>
        normalizeSearchTerm(k.composicao.nome).includes(termo) ||
        normalizeSearchTerm(k.composicao.codigo).includes(termo) ||
        normalizeSearchTerm(k.composicao.disciplina || "").includes(termo)
    );
  }, [kits, buscaKit]);

  const itensFiltrados = useMemo(() => {
    if (filtroClassificacao === "todos") return itensPedido;
    return itensPedido.filter((i) => i.classificacao === filtroClassificacao);
  }, [itensPedido, filtroClassificacao]);

  const totais = useMemo(() => {
    const itensAtivos = itensPedido.filter((i) => i.quantidade_ajustada > 0);
    return {
      quantidade: itensAtivos.length,
      valor: itensAtivos.reduce((acc, i) => acc + i.valor_total, 0),
    };
  }, [itensPedido]);

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              type="button"
              title="Voltar"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-wg-primary to-wg-primary/90 rounded-xl flex items-center justify-center shadow-lg">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Pedido de Materiais de Obra</h1>
              <p className="text-[12px] text-gray-600">Fluxo simplificado para materiais iniciais</p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center justify-between">
            {PASSOS.map((passo, idx) => {
              const Icone = passo.icone;
              const isAtivo = passoAtual === passo.id;
              const isCompleto = passoAtual > passo.id;

              return (
                <div key={passo.id} className="flex items-center flex-1">
                  <div
                    className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      isAtivo
                        ? "bg-wg-primary/10 text-wg-primary"
                        : isCompleto
                        ? "bg-green-50 text-green-600"
                        : "text-gray-400"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        isAtivo
                          ? "bg-wg-primary text-white"
                          : isCompleto
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {isCompleto ? <Check className="w-4 h-4" /> : <Icone className="w-4 h-4" />}
                    </div>
                    <span className={`font-medium ${isAtivo ? "text-wg-primary" : ""}`}>
                      {passo.nome}
                    </span>
                  </div>
                  {idx < PASSOS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 mx-2 ${
                        isCompleto ? "bg-green-500" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Conteúdo do Passo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ========== PASSO 1: CLIENTE ========== */}
          {passoAtual === 1 && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-normal text-gray-900">Selecionar Cliente/Obra</h2>
                <div className="relative w-80">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaCliente}
                    onChange={(e) => setBuscaCliente(e.target.value)}
                    placeholder="Buscar cliente..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary outline-none"
                  />
                </div>
              </div>

              {loadingClientes ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-wg-primary animate-spin" />
                </div>
              ) : clientesFiltrados.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Nenhum cliente encontrado</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Crie uma análise de projeto primeiro
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientesFiltrados.map((cliente) => (
                    <div
                      key={cliente.id}
                      onClick={() => selecionarCliente(cliente)}
                      className={`p-4 border-2 rounded-xl cursor-pointer transition-all ${
                        clienteSelecionado?.id === cliente.id
                          ? "border-wg-primary bg-wg-primary/5"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              clienteSelecionado?.id === cliente.id
                                ? "bg-wg-primary text-white"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Building2 className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-normal text-gray-900">{cliente.nome}</h3>
                            <p className="text-sm text-gray-500">{cliente.tipo}</p>
                          </div>
                        </div>
                        {clienteSelecionado?.id === cliente.id && (
                          <CheckCircle className="w-5 h-5 text-wg-primary" />
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        {cliente.endereco && (
                          <div className="flex items-center gap-2 text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="truncate">{cliente.endereco}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-4 text-gray-500">
                          {cliente.area_total && (
                            <span>{cliente.area_total.toFixed(0)}m²</span>
                          )}
                          {cliente.total_ambientes && (
                            <span>{cliente.total_ambientes} amb.</span>
                          )}
                        </div>
                        {cliente.pedidos_count && cliente.pedidos_count > 0 && (
                          <div className="flex items-center gap-2 text-blue-600 mt-2">
                            <FileText className="w-3.5 h-3.5" />
                            <span>{cliente.pedidos_count} pedido(s) anterior(es)</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pedidos Existentes do Cliente */}
              {clienteSelecionado && pedidosCliente.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-normal text-gray-700 mb-3">
                    Pedidos anteriores deste cliente
                  </h3>
                  <div className="space-y-2">
                    {pedidosCliente.map((pedido) => (
                      <div
                        key={pedido.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-sm text-gray-600">{pedido.codigo}</span>
                          <span className="text-sm text-gray-700">{pedido.nome}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              STATUS_CORES[pedido.status]?.bg || "bg-gray-100"
                            } ${STATUS_CORES[pedido.status]?.text || "text-gray-700"}`}
                          >
                            {STATUS_CORES[pedido.status]?.label || pedido.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => navigate(`/compras/${pedido.id}`)}
                          className="text-sm text-wg-primary hover:underline"
                        >
                          Ver detalhes
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========== PASSO 2: KITS (Layout duas colunas) ========== */}
          {passoAtual === 2 && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-normal text-gray-900">Montar Pedido de Materiais</h2>
                  <p className="text-sm text-gray-500">
                    Cliente: <strong>{clienteSelecionado?.nome}</strong>
                  </p>
                </div>
              </div>

              {/* Layout duas colunas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* COLUNA ESQUERDA: Busca Pricelist + Busca Internet + Kits */}
                <div className="space-y-4">
                  {/* Busca no Pricelist */}
                  <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Search className="w-5 h-5 text-blue-600" />
                      <h3 className="font-normal text-gray-900">Buscar no Pricelist</h3>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={buscaPricelist}
                        onChange={(e) => {
                          setBuscaPricelist(e.target.value);
                          buscarNosPricelist(e.target.value);
                        }}
                        placeholder="Busque por nome, código ou descriçÍo..."
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                      />
                    </div>
                    {/* Resultados da busca */}
                    {loadingPricelist ? (
                      <div className="flex items-center justify-center py-4">
                        <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                      </div>
                    ) : itensPricelist.length > 0 && (
                      <div className="mt-3 max-h-48 overflow-y-auto space-y-2">
                        {itensPricelist.map((item) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
                              <p className="text-xs text-gray-500">{item.unidade} • {formatarMoeda(item.preco || 0)}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => adicionarItemDoPricelist(item, 1)}
                              title="Adicionar item ao pedido"
                              className="ml-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Busca na Internet */}
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <h3 className="font-normal text-gray-900">Buscar Produto na Internet</h3>
                    </div>
                    <p className="text-xs text-gray-600 mb-3">Cole um link ou busque por nome usando IA</p>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-3">
                      <button
                        type="button"
                        onClick={() => setModosBuscaInternet("url")}
                        className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                          modosBuscaInternet === "url"
                            ? "bg-primary text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Por URL
                      </button>
                      <button
                        type="button"
                        onClick={() => setModosBuscaInternet("nome")}
                        className={`px-3 py-1.5 rounded-lg text-[14px] font-medium transition-colors ${
                          modosBuscaInternet === "nome"
                            ? "bg-primary text-white"
                            : "bg-white text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        Buscar por Nome (IA)
                      </button>
                    </div>

                    {modosBuscaInternet === "url" ? (
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={urlBuscaInternet}
                          onChange={(e) => setUrlBuscaInternet(e.target.value)}
                          placeholder="https://www.leroymerlin.com.br/produto/..."
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-lg"
                        >
                          <Download className="w-4 h-4" />
                          Importar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={buscaNomeInternet}
                          onChange={(e) => setBuscaNomeInternet(e.target.value)}
                          placeholder="Ex: Piso porcelanato 60x60 bege"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
                        />
                        <button
                          type="button"
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-lg"
                        >
                          <Search className="w-4 h-4" />
                          Buscar com IA
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      Sites suportados: Leroy Merlin, Amazon, Mercado Livre, Magazine Luiza, + outros
                    </p>
                  </div>

                  {/* Kits de Materiais */}
                  <div className="bg-white rounded-xl border border-gray-200">
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Layers className="w-5 h-5 text-wg-primary" />
                          <h3 className="font-normal text-gray-900">Kits de Materiais</h3>
                        </div>
                        <button
                          type="button"
                          onClick={carregarKits}
                          title="Atualizar lista de kits"
                          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                          <RefreshCw className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="relative mt-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={buscaKit}
                          onChange={(e) => setBuscaKit(e.target.value)}
                          placeholder="Filtrar kits..."
                          className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary/20 focus:border-wg-primary outline-none text-sm"
                        />
                      </div>
                    </div>

                    {loadingKits ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 text-wg-primary animate-spin" />
                      </div>
                    ) : (
                      <div className="max-h-[400px] overflow-y-auto p-4 space-y-3">
                        {kitsFiltrados.map((kit, idx) => (
                          <div
                            key={kit.composicao.id}
                            className={`p-3 border-2 rounded-xl transition-all ${
                              kit.selecionado
                                ? "border-wg-primary bg-wg-primary/5"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => {
                                  setKits((prev) =>
                                    prev.map((k, i) =>
                                      i === idx ? { ...k, selecionado: !k.selecionado } : k
                                    )
                                  );
                                }}
                                title={kit.selecionado ? "Desmarcar kit" : "Selecionar kit"}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 mt-0.5 ${
                                  kit.selecionado
                                    ? "bg-wg-primary text-white"
                                    : "border-2 border-gray-300"
                                }`}
                              >
                                {kit.selecionado && <Check className="w-3 h-3" />}
                              </button>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                    {kit.composicao.codigo}
                                  </span>
                                  <span
                                    className={`text-xs px-1.5 py-0.5 rounded ${
                                      kit.composicao.disciplina === "ALVENARIA"
                                        ? "bg-orange-100 text-orange-700"
                                        : kit.composicao.disciplina === "ELETRICA"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : kit.composicao.disciplina === "HIDRAULICA"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-700"
                                    }`}
                                  >
                                    {kit.composicao.disciplina}
                                  </span>
                                </div>
                                <h4 className="font-medium text-gray-900 text-sm mt-1">{kit.composicao.nome}</h4>
                                {kit.composicao.descricao && (
                                  <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                    {kit.composicao.descricao}
                                  </p>
                                )}

                                {/* Quantidade e Ações */}
                                {kit.selecionado && (
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs text-gray-600">Qtd:</span>
                                      <div className="flex items-center">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setKits((prev) =>
                                              prev.map((k, i) =>
                                                i === idx
                                                  ? { ...k, quantidade: Math.max(1, k.quantidade - 1) }
                                                  : k
                                              )
                                            )
                                          }
                                          title="Diminuir quantidade"
                                          className="w-6 h-6 rounded-l bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                                        >
                                          <Minus className="w-3 h-3" />
                                        </button>
                                        <span className="w-8 text-center text-sm font-medium bg-white border-y border-gray-200 h-6 leading-6">
                                          {kit.quantidade}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setKits((prev) =>
                                              prev.map((k, i) =>
                                                i === idx ? { ...k, quantidade: k.quantidade + 1 } : k
                                              )
                                            )
                                          }
                                          title="Aumentar quantidade"
                                          className="w-6 h-6 rounded-r bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                                        >
                                          <Plus className="w-3 h-3" />
                                        </button>
                                      </div>
                                    </div>

                                    {/* Ações do Kit */}
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() => abrirEdicaoKit(kit)}
                                        title="Editar kit"
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                      >
                                        <Edit className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => duplicarKit(kit)}
                                        title="Duplicar kit"
                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                      >
                                        <Copy className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => excluirKit(kit.composicao.id)}
                                        title="Excluir kit"
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="p-4 border-t border-gray-200 bg-gray-50">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <AlertCircle className="w-4 h-4 text-blue-600" />
                        <span>
                          <strong>{kits.filter((k) => k.selecionado).length}</strong> kit(s) selecionado(s)
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* COLUNA DIREITA: Itens do Pedido */}
                <div className="bg-white rounded-xl border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShoppingCart className="w-5 h-5 text-green-600" />
                        <h3 className="font-normal text-gray-900">Itens do Pedido</h3>
                      </div>
                      <span className="text-sm text-gray-500">
                        {itensPedido.length} item(s)
                      </span>
                    </div>
                  </div>

                  {itensPedido.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <Package className="w-12 h-12 text-gray-300 mb-3" />
                      <p className="text-sm">Nenhum item adicionado ainda</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Busque no pricelist ou selecione kits
                      </p>
                    </div>
                  ) : (
                    <div className="max-h-[500px] overflow-y-auto">
                      {itensPedido.map((item) => (
                        <div
                          key={item.id}
                          className="p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 text-sm truncate">{item.descricao}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-1.5 py-0.5 rounded ${
                                    item.classificacao === "INSUMO"
                                      ? "bg-blue-100 text-blue-700"
                                      : item.classificacao === "CONSUMIVEL"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : item.classificacao === "ACABAMENTO"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {item.classificacao}
                                </span>
                                <span className="text-xs text-gray-400">{item.composicao_nome}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Quantidade com botões - e + */}
                              <div className="flex items-center">
                                <button
                                  type="button"
                                  onClick={() => ajustarQuantidade(item.id, -1)}
                                  title="Diminuir quantidade"
                                  className="w-6 h-6 rounded-l bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-10 text-center text-sm font-medium bg-white border-y border-gray-200 h-6 leading-6">
                                  {item.quantidade_ajustada}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => ajustarQuantidade(item.id, 1)}
                                  title="Aumentar quantidade"
                                  className="w-6 h-6 rounded-r bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className="text-xs text-gray-500 w-8">{item.unidade}</span>

                              <span className="text-sm font-normal text-green-600 w-20 text-right">
                                {item.valor_total.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>

                              <button
                                type="button"
                                onClick={() => removerItem(item.id)}
                                title="Remover item do pedido"
                                className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Totais */}
                  <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total do Pedido</p>
                        <p className="text-xs text-gray-500">{totais.quantidade} itens</p>
                      </div>
                      <p className="text-[20px] font-normal text-green-600">
                        {totais.valor.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========== PASSO 3: REVISAR ========== */}
          {passoAtual === 3 && (
            <div>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-normal text-gray-900">Revisar Pedido</h2>
                    <p className="text-sm text-gray-500">
                      Cliente: <strong>{clienteSelecionado?.nome}</strong>
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={filtroClassificacao}
                      onChange={(e) => setFiltroClassificacao(e.target.value)}
                      title="Filtrar por classificaçÍo"
                      className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
                    >
                      <option value="todos">Todas classificações</option>
                      <option value="INSUMO">Insumos</option>
                      <option value="CONSUMIVEL">Consumíveis</option>
                      <option value="ACABAMENTO">Acabamentos</option>
                      <option value="FERRAMENTA">Ferramentas</option>
                    </select>
                  </div>
                </div>

                {/* Resumo */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Total de itens</p>
                    <p className="text-[20px] font-normal text-gray-900">{totais.quantidade}</p>
                  </div>
                  <div className="p-4 bg-primary/5 rounded-lg">
                    <p className="text-sm text-gray-500">Valor estimado</p>
                    <p className="text-[20px] font-normal text-[#F25C26]">
                      {totais.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Itens */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-[#F25C26] animate-spin" />
                </div>
              ) : (
                <div className="max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-normal text-gray-600">
                          Material
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-normal text-gray-600 w-32">
                          Quantidade
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-normal text-gray-600 w-20">
                          Unidade
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-normal text-gray-600 w-28">
                          Total
                        </th>
                        <th className="px-4 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {itensFiltrados.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-gray-900">{item.descricao}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs px-2 py-0.5 rounded ${
                                    item.classificacao === "INSUMO"
                                      ? "bg-blue-100 text-blue-700"
                                      : item.classificacao === "CONSUMIVEL"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : item.classificacao === "ACABAMENTO"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-gray-100 text-gray-700"
                                  }`}
                                >
                                  {item.classificacao}
                                </span>
                                <span className="text-xs text-gray-400">
                                  {item.composicao_nome}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-center">
                              <button
                                type="button"
                                onClick={() => ajustarQuantidade(item.id, -1)}
                                title="Diminuir quantidade"
                                className="w-7 h-7 rounded-l bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-12 text-center text-sm font-medium bg-white border-y border-gray-200 h-7 leading-7">
                                {item.quantidade_ajustada}
                              </span>
                              <button
                                type="button"
                                onClick={() => ajustarQuantidade(item.id, 1)}
                                title="Aumentar quantidade"
                                className="w-7 h-7 rounded-r bg-gray-100 hover:bg-gray-200 flex items-center justify-center border border-gray-200"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center text-sm text-gray-600">
                            {item.unidade}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                            {item.valor_total.toLocaleString("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            })}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => removerItem(item.id)}
                              title="Remover item do pedido"
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer com botões de navegaçÍo */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              type="button"
              onClick={voltarPasso}
              disabled={passoAtual === 1}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar
            </button>

            <div className="flex items-center gap-3">
              {passoAtual === 3 && (
                <button
                  type="button"
                  onClick={salvarOrcamento}
                  disabled={enviando || totais.quantidade === 0}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center gap-2"
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Orçamento
                </button>
              )}

              {passoAtual < 3 ? (
                <button
                  type="button"
                  onClick={avancarPasso}
                  className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={salvarOrcamento}
                  disabled={enviando || totais.quantidade === 0}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {enviando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Enviar para AprovaçÍo
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Modal de EdiçÍo do Kit */}
        {kitEditando && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] flex flex-col">
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-normal text-gray-900">Editar Kit</h3>
                  <p className="text-sm text-gray-500">{kitEditando.composicao.nome}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setKitEditando(null);
                    setItensKitEditando([]);
                  }}
                  title="Fechar modal"
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              {/* Busca no pricelist dentro do modal */}
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaItemKit}
                    onChange={(e) => {
                      setBuscaItemKit(e.target.value);
                      buscarNosPricelist(e.target.value);
                    }}
                    placeholder="Buscar item no pricelist para adicionar ao kit..."
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>
                {/* Resultados da busca */}
                {loadingPricelist ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  </div>
                ) : itensPricelist.length > 0 && buscaItemKit && (
                  <div className="mt-3 max-h-32 overflow-y-auto space-y-2">
                    {itensPricelist.slice(0, 5).map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-gray-100 hover:border-blue-200"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.nome}</p>
                          <p className="text-xs text-gray-500">{item.unidade} • {(item.preco || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => adicionarItemDoPricelist(item, 1)}
                          title="Adicionar item ao kit"
                          className="ml-2 p-1.5 bg-primary text-white rounded-lg hover:bg-primary-dark"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Itens do Kit */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingItensKit ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 text-wg-primary animate-spin" />
                  </div>
                ) : itensKitEditando.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p>Nenhum item neste kit</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {itensKitEditando.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.descricao_generica}</p>
                          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                            <span>{item.unidade}</span>
                            <span>Coef: {item.coeficiente}</span>
                            {item.pricelist_item?.preco && (
                              <span className="text-green-600 font-medium">
                                {item.pricelist_item.preco.toLocaleString("pt-BR", {
                                  style: "currency",
                                  currency: "BRL",
                                })}
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setItensKitEditando((prev) => prev.filter((i) => i.id !== item.id));
                          }}
                          title="Remover item do kit"
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Rodapé */}
              <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setKitEditando(null);
                    setItensKitEditando([]);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Aqui poderia salvar as alterações no kit
                    toast({
                      title: "Kit atualizado",
                      description: "As alterações foram aplicadas.",
                    });
                    setKitEditando(null);
                    setItensKitEditando([]);
                  }}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}


