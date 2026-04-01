/**
 * Página de Materiais do Colaborador
 * Fluxo: Pedido → Verifica Pricelist → Orçamento → AprovaçÍo → Compras
 */

import { useState, useEffect, useCallback, type ComponentType } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  Package,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ShoppingCart,
  FileText,
  ArrowRight,
  Building2,
  Eye,
  Send,
  LayoutGrid,
  LayoutList,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabaseClient";
import { formatarData } from "@/lib/utils";
import { normalizeSearchTerm } from "@/utils/searchUtils";

interface Cliente {
  id: string;
  nome: string;
}
interface Projeto {
  id: string;
  numero: string;
  cliente: { nome: string } | { nome: string }[] | null;
}
import { useToast } from "@/components/ui/use-toast";

interface PedidoMaterial {
  id: string;
  projeto_id: string;
  projeto_nome?: string;
  cliente_nome?: string;
  descricao: string;
  itens: ItemPedido[];
  status: string;
  prioridade: string;
  observacoes?: string;
  orcamento_id?: string;
  criado_por?: string;
  created_at: string;
}

interface ItemPedido {
  id?: string;
  nome: string;
  quantidade: number;
  unidade: string;
  pricelist_id?: string;
  valor_unitario?: number;
  observacoes?: string;
}

interface PricelistItem {
  id: string;
  nome: string;
  codigo?: string;
  unidade?: string;
  preco?: number;
  categoria_id?: string;
  pricelist_categorias?: { nome: string } | null;
}

// Unidades com nomes completos
const UNIDADES = [
  { value: "un", label: "Unidade" },
  { value: "m", label: "Metro" },
  { value: "m²", label: "Metro quadrado" },
  { value: "m³", label: "Metro cúbico" },
  { value: "kg", label: "Quilograma" },
  { value: "g", label: "Grama" },
  { value: "l", label: "Litro" },
  { value: "ml", label: "Mililitro" },
  { value: "cx", label: "Caixa" },
  { value: "pc", label: "Peça" },
  { value: "pct", label: "Pacote" },
  { value: "rolo", label: "Rolo" },
  { value: "galao", label: "GalÍo" },
  { value: "saco", label: "Saco" },
  { value: "lata", label: "Lata" },
  { value: "balde", label: "Balde" },
  { value: "conjunto", label: "Conjunto" },
  { value: "par", label: "Par" },
];

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: ComponentType<{ className?: string }> }
> = {
  rascunho: {
    label: "Rascunho",
    color: "bg-gray-100 text-gray-800",
    icon: FileText,
  },
  enviado: {
    label: "Enviado",
    color: "bg-yellow-100 text-yellow-800",
    icon: Send,
  },
  em_orcamento: {
    label: "Em Orçamento",
    color: "bg-blue-100 text-blue-800",
    icon: ShoppingCart,
  },
  aguardando_aprovacao: {
    label: "Aguardando AprovaçÍo",
    color: "bg-purple-100 text-purple-800",
    icon: Clock,
  },
  aprovado: {
    label: "Aprovado",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle2,
  },
  em_compra: {
    label: "Em Compra",
    color: "bg-orange-100 text-orange-800",
    icon: ShoppingCart,
  },
  concluido: {
    label: "Concluído",
    color: "bg-emerald-100 text-emerald-800",
    icon: CheckCircle2,
  },
  recusado: {
    label: "Recusado",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle,
  },
};

export default function ColaboradorMateriaisPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [pedidos, setPedidos] = useState<PedidoMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [viewMode, setViewMode] = useState<"list" | "cards">("cards");
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [clienteNome, setClienteNome] = useState<string>("");
  const [showClienteSugestoes, setShowClienteSugestoes] = useState(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);

  // Form novo pedido
  const [novoPedido, setNovoPedido] = useState({
    projeto_id: "",
    descricao: "",
    prioridade: "normal",
    observacoes: "",
  });
  const [enviando, setEnviando] = useState(false);
  const [itensNovoPedido, setItensNovoPedido] = useState<ItemPedido[]>([
    { nome: "", quantidade: 1, unidade: "un" },
  ]);

  // Pricelist search states
  const [sugestoesPricelist, setSugestoesPricelist] = useState<{ [key: number]: PricelistItem[] }>({});
  const [showSugestoes, setShowSugestoes] = useState<{ [key: number]: boolean }>({});
  const [loadingBusca, setLoadingBusca] = useState<{ [key: number]: boolean }>({});

  const carregarPedidos = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // Buscar pedidos de materiais do colaborador (sem join - FK nÍo existe)
      // Usa user.id (auth.uid()) para corresponder à RLS policy
      const { data, error } = await supabase
        .from("pedidos_materiais")
        .select("*")
        .eq("criado_por", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Erro ao carregar pedidos:", error);
        setPedidos([]);
        return;
      }

      // Buscar dados do projeto/cliente separadamente se necessário
      const pedidosComDados = await Promise.all(
        (data || []).map(async (p: PedidoMaterial) => {
          let projeto_nome = "";
          let cliente_nome = "";

            if (p.projeto_id) {
              const { data: contrato } = await supabase
                .from("contratos")
                .select("numero, cliente:pessoas!contratos_cliente_id_fkey(nome)")
                .eq("id", p.projeto_id)
                .single();

            if (contrato) {
              const cliente = (contrato as Projeto).cliente;
              const clienteObj = Array.isArray(cliente) ? cliente[0] : cliente;
              projeto_nome = (contrato as Projeto).numero || "";
              cliente_nome = clienteObj?.nome || "";
            }
          }

          return {
            ...p,
            projeto_nome,
            cliente_nome,
            itens: p.itens || [],
          };
        })
      );

      setPedidos(pedidosComDados);
    } catch (error) {
      console.error("Erro ao carregar pedidos:", error);
      setPedidos([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Carregar clientes ao abrir modal (exclui concluídos)
  const carregarClientes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, status")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
        .order("nome");
      if (!error) setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    }
  }, []);

  // Carregar projetos do cliente selecionado
  const carregarProjetos = useCallback(async () => {
    if (!clienteSelecionado) {
      setProjetos([]);
      return;
    }
    try {
      const { data } = await supabase
        .from("contratos")
        .select("id, numero, cliente:pessoas!contratos_cliente_id_fkey(nome)")
        .eq("cliente_id", clienteSelecionado)
        .not("status", "in", "(rascunho,concluido,cancelado)")
        .order("numero", { ascending: false });
      setProjetos((data as unknown as Projeto[]) || []);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  }, [clienteSelecionado]);

  useEffect(() => {
    carregarPedidos();
  }, [carregarPedidos]);

  // Carregar clientes ao abrir modal de novo pedido
  useEffect(() => {
    if (showNovoModal) {
      carregarClientes();
    }
  }, [showNovoModal, carregarClientes]);

  // Carregar projetos ao selecionar cliente
  useEffect(() => {
    if (showNovoModal) {
      carregarProjetos();
      setNovoPedido((prev) => ({ ...prev, projeto_id: "" }));
    }
  }, [clienteSelecionado, showNovoModal, carregarProjetos]);

  // Buscar itens no pricelist com debounce
  const buscarNoPricelist = useCallback(async (termo: string, index: number) => {
    if (!termo || termo.length < 2) {
      setSugestoesPricelist((prev) => ({ ...prev, [index]: [] }));
      setShowSugestoes((prev) => ({ ...prev, [index]: false }));
      return;
    }

    setLoadingBusca((prev) => ({ ...prev, [index]: true }));

    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, codigo, unidade, preco, categoria_id, pricelist_categorias(nome)")
        .or(`nome.ilike.%${termo}%,codigo.ilike.%${termo}%`)
        .eq("ativo", true)
        .limit(10);

      if (error) {
        console.error("Erro ao buscar pricelist:", error);
        return;
      }

      const sugestoes: PricelistItem[] = ((data as any[]) || []).map((item) => ({
        ...item,
        pricelist_categorias: Array.isArray(item.pricelist_categorias)
          ? item.pricelist_categorias[0] || null
          : item.pricelist_categorias || null,
      }));

      setSugestoesPricelist((prev) => ({ ...prev, [index]: sugestoes }));
      setShowSugestoes((prev) => ({ ...prev, [index]: (data || []).length > 0 }));
    } catch (error) {
      console.error("Erro ao buscar pricelist:", error);
    } finally {
      setLoadingBusca((prev) => ({ ...prev, [index]: false }));
    }
  }, []);

  // Debounce para busca
  useEffect(() => {
    const timers: { [key: number]: NodeJS.Timeout } = {};

    itensNovoPedido.forEach((item, index) => {
      if (item.nome && item.nome.length >= 2 && !item.pricelist_id) {
        timers[index] = setTimeout(() => {
          buscarNoPricelist(item.nome, index);
        }, 300);
      }
    });

    return () => {
      Object.values(timers).forEach((timer) => clearTimeout(timer));
    };
  }, [itensNovoPedido, buscarNoPricelist]);

  // Selecionar item do pricelist
  const selecionarItemPricelist = (index: number, pricelistItem: PricelistItem) => {
    const novosItens = [...itensNovoPedido];
    novosItens[index] = {
      ...novosItens[index],
      nome: pricelistItem.nome,
      pricelist_id: pricelistItem.id,
      unidade: pricelistItem.unidade || novosItens[index].unidade,
      valor_unitario: pricelistItem.preco,
    };
    setItensNovoPedido(novosItens);
    setShowSugestoes((prev) => ({ ...prev, [index]: false }));
  };

  const adicionarItem = () => {
    setItensNovoPedido([
      ...itensNovoPedido,
      { nome: "", quantidade: 1, unidade: "un" },
    ]);
  };

  const removerItem = (index: number) => {
    if (itensNovoPedido.length > 1) {
      setItensNovoPedido(itensNovoPedido.filter((_, i) => i !== index));
    }
  };

  const atualizarItem = <K extends keyof ItemPedido>(
    index: number,
    campo: K,
    valor: ItemPedido[K]
  ) => {
    const novosItens = [...itensNovoPedido];
    novosItens[index] = { ...novosItens[index], [campo]: valor };
    setItensNovoPedido(novosItens);
  };

  const handleCriarPedido = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente",
        variant: "destructive",
      });
      return;
    }

    const itensValidos = itensNovoPedido.filter((i) => i.nome.trim());
    if (itensValidos.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item",
        variant: "destructive",
      });
      return;
    }

    setEnviando(true);
    try {
      // Buscar projeto ativo do cliente (se existir)
      // Se nÍo houver projeto, usa o cliente_id diretamente via a tabela contratos
      let projetoId = projetos.length > 0 ? projetos[0].id : null;

      // Se nÍo há projeto vinculado, criar um pedido vinculado ao contrato do cliente
      // A tabela pedidos_materiais usa projeto_id que referencia contratos
      if (!projetoId && clienteSelecionado) {
        // Buscar qualquer contrato do cliente (mesmo inativo) para vincular o pedido
        const { data: contrato } = await supabase
          .from("contratos")
          .select("id")
          .eq("cliente_id", clienteSelecionado)
          .limit(1)
          .single();

        if (contrato) {
          projetoId = contrato.id;
        }
      }

      const { error } = await supabase.from("pedidos_materiais").insert({
        projeto_id: projetoId,
        descricao:
          novoPedido.descricao || `Pedido de ${itensValidos.length} item(ns)`,
        prioridade: novoPedido.prioridade,
        observacoes: novoPedido.observacoes || null,
        itens: itensValidos,
        status: "enviado",
        criado_por: user?.id, // Deve ser auth.uid() para passar na RLS
      });

      if (error) throw error;

      // Notificar administraçÍo via email (nÍo bloqueante)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
          await fetch(`${backendUrl}/api/notify/publicacao-material`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              tipo: "pedido_material",
              colaborador_nome: user?.email || "Colaborador",
              cliente_nome: clienteNome || undefined,
              descricao: novoPedido.descricao || `Pedido com ${itensValidos.length} item(ns)`,
            }),
          });
        }
      } catch {
        // Silencioso — email falhou mas publicaçÍo foi bem-sucedida
      }

      toast({
        title: "Sucesso",
        description:
          "Pedido de materiais enviado! Será processado pelo setor de planejamento.",
      });

      setShowNovoModal(false);
      setClienteSelecionado("");
      setClienteNome("");
      setNovoPedido({
        projeto_id: "",
        descricao: "",
        prioridade: "normal",
        observacoes: "",
      });
      setItensNovoPedido([{ nome: "", quantidade: 1, unidade: "un" }]);
      carregarPedidos();
    } catch (error) {
      console.error("Erro ao criar pedido:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível criar o pedido",
        variant: "destructive",
      });
    } finally {
      setEnviando(false);
    }
  };

  const pedidosFiltrados = pedidos.filter((p) => {
    const matchBusca =
      !busca ||
      normalizeSearchTerm(p.descricao || "").includes(normalizeSearchTerm(busca)) ||
      normalizeSearchTerm(p.cliente_nome || "").includes(normalizeSearchTerm(busca)) ||
      normalizeSearchTerm(p.projeto_nome || "").includes(normalizeSearchTerm(busca));
    const matchStatus = statusFiltro === "todos" || p.status === statusFiltro;
    return matchBusca && matchStatus;
  });


  // Contadores
  const totalEnviados = pedidos.filter((p) => p.status === "enviado").length;
  const totalEmOrcamento = pedidos.filter((p) =>
    ["em_orcamento", "aguardando_aprovacao"].includes(p.status)
  ).length;
  const totalAprovados = pedidos.filter((p) =>
    ["aprovado", "em_compra", "concluido"].includes(p.status)
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Materiais</h1>
          <p className="text-sm text-gray-500">
            Solicite materiais para suas obras
          </p>
        </div>
        <Dialog open={showNovoModal} onOpenChange={setShowNovoModal}>
          <DialogTrigger asChild>
            <Button className="bg-wg-primary hover:bg-wg-primary/90 text-[14px]">
              <Plus className="h-4 w-4 mr-2" />
              Novo Pedido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] sm:max-h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-4 pt-4 sm:px-6 sm:pt-6 pb-2 shrink-0">
              <DialogTitle>Novo Pedido de Materiais</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto px-4 sm:px-6 space-y-4">
              {/* Campo de busca de cliente com autocomplete */}
              <div className="relative">
                <Label>Cliente / Obra *</Label>
                <div className="relative mt-1">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Digite para buscar cliente..."
                    value={clienteNome}
                    onChange={(e) => {
                      setClienteNome(e.target.value);
                      setShowClienteSugestoes(true);
                      // Limpar seleçÍo se o usuário editar
                      if (clienteSelecionado) {
                        setClienteSelecionado("");
                      }
                    }}
                    onFocus={() => setShowClienteSugestoes(true)}
                    onBlur={() => {
                      // Delay para permitir clique nas sugestões
                      setTimeout(() => setShowClienteSugestoes(false), 200);
                    }}
                    className="pl-10"
                  />
                  {clienteSelecionado && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                        Selecionado
                      </span>
                    </div>
                  )}
                </div>
                {/* Dropdown de sugestões de clientes */}
                {showClienteSugestoes && clienteNome.length >= 1 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {clientes
                      .filter((c) =>
                        normalizeSearchTerm(c.nome).includes(
                          normalizeSearchTerm(clienteNome)
                        )
                      )
                      .slice(0, 10)
                      .map((cliente) => (
                        <button
                          key={cliente.id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0 flex items-center gap-2"
                          onClick={() => {
                            setClienteSelecionado(cliente.id);
                            setClienteNome(cliente.nome);
                            setShowClienteSugestoes(false);
                          }}
                        >
                          <Building2 className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{cliente.nome}</span>
                        </button>
                      ))}
                    {clientes.filter((c) =>
                      normalizeSearchTerm(c.nome).includes(
                        normalizeSearchTerm(clienteNome)
                      )
                    ).length === 0 && (
                      <div className="px-3 py-2 text-sm text-gray-500">
                        Nenhum cliente encontrado
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <Label>DescriçÍo do Pedido</Label>
                <Input
                  value={novoPedido.descricao}
                  onChange={(e) =>
                    setNovoPedido({ ...novoPedido, descricao: e.target.value })
                  }
                  placeholder="Ex: Materiais para fase de acabamento"
                />
              </div>

              {/* Lista de Itens */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Itens do Pedido *</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={adicionarItem}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Adicionar Item
                  </Button>
                </div>
                <div className="space-y-3 max-h-[180px] sm:max-h-[250px] overflow-y-auto border rounded-lg p-2 sm:p-3">
                  {itensNovoPedido.map((item, index) => (
                    <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                      <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-start">
                        {/* Campo de busca com autocomplete */}
                        <div className="flex-1 relative min-w-0">
                          <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Buscar material no pricelist..."
                              value={item.nome}
                              onChange={(e) => {
                                atualizarItem(index, "nome", e.target.value);
                                // Limpar pricelist_id se usuário editar manualmente
                                if (item.pricelist_id) {
                                  atualizarItem(index, "pricelist_id", undefined);
                                }
                              }}
                              onFocus={() => {
                                if (sugestoesPricelist[index]?.length > 0) {
                                  setShowSugestoes((prev) => ({ ...prev, [index]: true }));
                                }
                              }}
                              onBlur={() => {
                                // Delay para permitir clique nas sugestões
                                setTimeout(() => {
                                  setShowSugestoes((prev) => ({ ...prev, [index]: false }));
                                }, 200);
                              }}
                              className="pl-8"
                            />
                            {loadingBusca[index] && (
                              <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-wg-primary" />
                              </div>
                            )}
                          </div>

                          {/* Dropdown de sugestões */}
                          {showSugestoes[index] && sugestoesPricelist[index]?.length > 0 && (
                            <div className="fixed left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-2rem)] max-w-[400px] bg-white border rounded-lg shadow-xl max-h-48 overflow-y-auto">
                              {sugestoesPricelist[index].map((pricelistItem) => (
                                <button
                                  key={pricelistItem.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 border-b last:border-b-0"
                                  onClick={() => selecionarItemPricelist(index, pricelistItem)}
                                >
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">{pricelistItem.nome}</p>
                                      <p className="text-xs text-gray-500">
                                        {pricelistItem.codigo && `Cód: ${pricelistItem.codigo} • `}
                                        {pricelistItem.pricelist_categorias?.nome}
                                      </p>
                                    </div>
                                    {pricelistItem.preco && pricelistItem.preco > 0 && (
                                      <span className="text-xs font-medium text-green-600">
                                        R$ {pricelistItem.preco.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Indicador de item vinculado ao pricelist */}
                          {item.pricelist_id && (
                            <div className="absolute -top-2 -right-2">
                              <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                                Pricelist
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Quantidade, Unidade e Remover - ficam em linha no mobile */}
                        <div className="flex gap-2 items-center">
                          <Input
                            type="number"
                            placeholder="Qtd"
                            value={item.quantidade}
                            onChange={(e) =>
                              atualizarItem(
                                index,
                                "quantidade",
                                Number(e.target.value)
                              )
                            }
                            className="w-20 shrink-0"
                            min={1}
                          />
                          <Select
                            value={item.unidade}
                            onValueChange={(v) =>
                              atualizarItem(index, "unidade", v)
                            }
                          >
                            <SelectTrigger className="w-28 sm:w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {UNIDADES.map((u) => (
                                <SelectItem key={u.value} value={u.value}>
                                  {u.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {itensNovoPedido.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removerItem(index)}
                              className="text-red-500 hover:text-red-700 shrink-0"
                            >
                              ×
                            </Button>
                          )}
                        </div>
                      </div>
                      {/* Dica para o usuário */}
                      {!item.pricelist_id && item.nome.length >= 2 && !loadingBusca[index] && sugestoesPricelist[index]?.length === 0 && (
                        <p className="text-xs text-amber-600 pl-1">
                          Item nÍo encontrado no pricelist. Será incluído manualmente.
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={novoPedido.observacoes}
                  onChange={(e) =>
                    setNovoPedido({
                      ...novoPedido,
                      observacoes: e.target.value,
                    })
                  }
                  placeholder="Informações adicionais..."
                  rows={2}
                />
              </div>

              {/* Fluxo explicativo */}
              <div className="bg-blue-50 rounded-lg p-3 sm:p-4 mb-2">
                <p className="text-xs sm:text-sm font-medium text-blue-900 mb-2">
                  Fluxo do Pedido:
                </p>
                <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-blue-700 flex-wrap">
                  <span className="bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    1. Pedido
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    2. Orçamento
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    3. AprovaçÍo
                  </span>
                  <ArrowRight className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                  <span className="bg-blue-100 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded">
                    4. Compras
                  </span>
                </div>
              </div>
            </div>

            {/* Footer sticky com botões */}
            <div className="shrink-0 border-t bg-gray-50 px-4 py-3 sm:px-6 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setShowNovoModal(false)}
                disabled={enviando}
                className="w-full sm:w-auto text-[14px]"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCriarPedido}
                disabled={enviando}
                className="bg-wg-primary hover:bg-wg-primary/90 w-full sm:w-auto text-[14px]"
              >
                {enviando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Enviando...
                  </>
                ) : (
                  "Enviar Pedido"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Enviados
                </p>
                <p className="text-[20px] font-normal text-yellow-600 mt-1">
                  {totalEnviados}
                </p>
              </div>
              <div className="h-12 w-12 bg-yellow-50 rounded-xl flex items-center justify-center">
                <Send className="h-6 w-6 text-yellow-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Em Orçamento/AprovaçÍo
                </p>
                <p className="text-[20px] font-normal text-blue-600 mt-1">
                  {totalEmOrcamento}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-0 shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Aprovados/Concluídos
                </p>
                <p className="text-[20px] font-normal text-green-600 mt-1">
                  {totalAprovados}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar pedidos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFiltro} onValueChange={setStatusFiltro}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="enviado">Enviados</SelectItem>
                <SelectItem value="em_orcamento">Em Orçamento</SelectItem>
                <SelectItem value="aguardando_aprovacao">
                  Aguardando AprovaçÍo
                </SelectItem>
                <SelectItem value="aprovado">Aprovados</SelectItem>
                <SelectItem value="em_compra">Em Compra</SelectItem>
                <SelectItem value="concluido">Concluídos</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              <Button
                variant={viewMode === "cards" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("cards")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Pedidos */}
      {pedidosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">Nenhum pedido encontrado</p>
            <p className="text-sm mt-1">
              {busca || statusFiltro !== "todos"
                ? "Tente ajustar os filtros"
                : "Faça seu primeiro pedido de materiais!"}
            </p>
          </CardContent>
        </Card>
      ) : viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {pedidosFiltrados.map((pedido) => {
            const statusConfig =
              STATUS_CONFIG[pedido.status] || STATUS_CONFIG.rascunho;
            const StatusIcon = statusConfig.icon;

            return (
              <Card
                key={pedido.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <Package className="h-4 w-4 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-600">
                        {pedido.itens?.length || 0} item(ns)
                      </span>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                    >
                      <StatusIcon className="inline-block h-3 w-3 mr-1" aria-hidden />
                      {statusConfig.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-900 font-medium line-clamp-2 mb-3">
                    {pedido.descricao || "Pedido de materiais"}
                  </p>

                  {pedido.cliente_nome && (
                    <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                      <Building2 className="h-3 w-3" />
                      <span>
                        {pedido.projeto_nome} - {pedido.cliente_nome}
                      </span>
                    </div>
                  )}

                  {/* Preview dos itens */}
                  <div className="text-xs text-gray-500 mb-3">
                    {pedido.itens?.slice(0, 2).map((item, i) => (
                      <div key={i}>
                        • {item.quantidade} {item.unidade} - {item.nome}
                      </div>
                    ))}
                    {pedido.itens?.length > 2 && (
                      <div className="text-gray-400">
                        +{pedido.itens.length - 2} mais
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between mt-4 pt-3 border-t">
                    <span className="text-xs text-gray-400">
                      {formatarData(pedido.created_at)}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-wg-primary"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Projeto</TableHead>
                    <TableHead>DescriçÍo</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pedidosFiltrados.map((pedido) => {
                    const statusConfig =
                      STATUS_CONFIG[pedido.status] || STATUS_CONFIG.rascunho;

                    return (
                      <TableRow
                        key={pedido.id}
                        className="cursor-pointer hover:bg-gray-50"
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium">{pedido.projeto_nome}</p>
                            <p className="text-xs text-gray-500">
                              {pedido.cliente_nome}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{pedido.descricao || "-"}</TableCell>
                        <TableCell>
                          {pedido.itens?.length || 0} item(ns)
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}
                          >
                            {statusConfig.label}
                          </span>
                        </TableCell>
                        <TableCell>{formatarData(pedido.created_at)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
/* eslint-disable no-redeclare */

