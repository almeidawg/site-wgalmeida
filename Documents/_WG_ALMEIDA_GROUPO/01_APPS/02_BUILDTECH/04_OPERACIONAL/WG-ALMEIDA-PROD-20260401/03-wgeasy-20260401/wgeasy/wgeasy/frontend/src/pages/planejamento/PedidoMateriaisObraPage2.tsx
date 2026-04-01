/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Search,
  Plus,
  Minus,
  Loader2,
  Save,
  ShoppingCart,
  Package,
  Globe,
  Link2,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  getCorCategoria,
  getCorClaraCategoria,
  getOrdemCategoria,
} from "@/config/categoriasConfig";

// Tipos
interface Cliente {
  id: string;
  nome: string;
  projeto_id?: string;
}

interface ItemCatalogo {
  id: string;
  nome: string;
  unidade: string;
  preco: number;
  categoria: string;
  imagem_url?: string;
  quantidade: number;
}

// Categorias em sequência de obra (nomes do banco de dados)
const CATEGORIAS_ORDEM = [
  // Fase 1: PreparaçÍo e DemoliçÍo
  "Pré Obra e Remoções",
  "Demolições",

  // Fase 2: Estrutura e Alvenaria
  "Paredes",
  "Içamento",

  // Fase 3: Instalações
  "Hidrossanitária",
  "Elétrica",
  "Gás",
  "Infra Ar",
  "AutomaçÍo",

  // Fase 4: Ar Condicionado e Eletrodomésticos
  "Ar Condicionado",
  "Eletrodomésticos",

  // Fase 5: Revestimentos
  "Piso",
  "Gesso",

  // Fase 6: Acabamentos
  "Pintura",
  "Vidraçaria",

  // Fase 7: FinalizaçÍo
  "FinalizaçÍo",
  "Limpeza Pós Obra",
  "ProduçÍo",

  // Outros (itens sem categoria)
  "OUTROS",
];

export default function PedidoMateriaisObraPage2() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  // Estados
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [loadingClientes, setLoadingClientes] = useState(true);

  // Catálogo de itens
  const [itensCatalogo, setItensCatalogo] = useState<ItemCatalogo[]>([]);
  const [loadingCatalogo, setLoadingCatalogo] = useState(true);

  // Busca e filtros
  const [busca, setBusca] = useState("");
  const [buscaLink, setBuscaLink] = useState("");
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<string[]>(CATEGORIAS_ORDEM);

  // Salvamento
  const [salvando, setSalvando] = useState(false);

  // Carregar clientes
  useEffect(() => {
    carregarClientes();
    carregarCatalogo();
  }, []);

  // Verificar cliente da URL
  useEffect(() => {
    const clienteId = searchParams.get("cliente");
    if (clienteId && clientes.length > 0) {
      const cliente = clientes.find((c) => c.id === clienteId);
      if (cliente) setClienteSelecionado(cliente);
    }
  }, [searchParams, clientes]);

  const carregarClientes = async () => {
    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, status")
        .eq("tipo", "CLIENTE")
        .eq("ativo", true)
        .or("status.is.null,status.neq.concluido") // Excluir clientes concluídos
        .order("nome");

      if (error) throw error;
      setClientes(data || []);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
    } finally {
      setLoadingClientes(false);
    }
  };

  const carregarCatalogo = async () => {
    setLoadingCatalogo(true);
    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("id, nome, unidade, preco, imagem_url, categoria")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (error) throw error;

      // Converter para ItemCatalogo com quantidade 0
      const itens: ItemCatalogo[] = (data || []).map((item: any) => ({
        id: item.id,
        nome: item.nome || "Item sem nome",
        unidade: item.unidade || "UN",
        preco: item.preco || 0,
        categoria: item.categoria || "OUTROS",
        imagem_url: item.imagem_url,
        quantidade: 0,
      }));

      setItensCatalogo(itens);
    } catch (error) {
      console.error("Erro ao carregar catálogo:", error);
      toast({
        title: "Erro",
        description: "NÍo foi possível carregar o catálogo.",
        variant: "destructive",
      });
    } finally {
      setLoadingCatalogo(false);
    }
  };

  // Atualizar quantidade de um item
  const atualizarQuantidade = (itemId: string, delta: number) => {
    setItensCatalogo((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const novaQtd = Math.max(0, item.quantidade + delta);
          return { ...item, quantidade: novaQtd };
        }
        return item;
      })
    );
  };

  // Setar quantidade diretamente
  const setQuantidade = (itemId: string, quantidade: number) => {
    setItensCatalogo((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          return { ...item, quantidade: Math.max(0, quantidade) };
        }
        return item;
      })
    );
  };

  // Toggle categoria
  const toggleCategoria = (categoria: string) => {
    setCategoriasExpandidas((prev) =>
      prev.includes(categoria)
        ? prev.filter((c) => c !== categoria)
        : [...prev, categoria]
    );
  };

  // Filtrar itens por busca
  const itensFiltrados = useMemo(() => {
    if (!busca.trim()) return itensCatalogo;
    const termo = normalizeSearchTerm(busca);
    return itensCatalogo.filter((item) =>
      normalizeSearchTerm(item.nome).includes(termo)
    );
  }, [itensCatalogo, busca]);

  // Agrupar itens por categoria
  const itensPorCategoria = useMemo(() => {
    const grupos: Record<string, ItemCatalogo[]> = {};

    itensFiltrados.forEach((item) => {
      const cat = item.categoria;
      if (!grupos[cat]) grupos[cat] = [];
      grupos[cat].push(item);
    });

    return grupos;
  }, [itensFiltrados]);

  // Totais por categoria (só itens com quantidade > 0)
  const totaisPorCategoria = useMemo(() => {
    const totais: Record<string, number> = {};

    Object.entries(itensPorCategoria).forEach(([cat, itens]) => {
      totais[cat] = itens
        .filter((item) => item.quantidade > 0)
        .reduce((acc, item) => acc + item.quantidade * item.preco, 0);
    });

    return totais;
  }, [itensPorCategoria]);

  // Total geral (só itens com quantidade > 0)
  const totalGeral = useMemo(() => {
    return itensCatalogo
      .filter((item) => item.quantidade > 0)
      .reduce((acc, item) => acc + item.quantidade * item.preco, 0);
  }, [itensCatalogo]);

  // Quantidade total de itens selecionados
  const qtdItensSelecionados = useMemo(() => {
    return itensCatalogo.filter((item) => item.quantidade > 0).length;
  }, [itensCatalogo]);

  // Salvar orçamento
  const salvarOrcamento = async () => {
    if (!clienteSelecionado) {
      toast({
        title: "Erro",
        description: "Selecione um cliente antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    const itensParaSalvar = itensCatalogo.filter((item) => item.quantidade > 0);

    if (itensParaSalvar.length === 0) {
      toast({
        title: "Erro",
        description: "Adicione pelo menos um item ao pedido.",
        variant: "destructive",
      });
      return;
    }

    setSalvando(true);
    try {
      // Criar orçamento
      const { data: orcamento, error: orcamentoError } = await supabase
        .from("orcamentos_cliente")
        .insert({
          cliente_id: clienteSelecionado.id,
          projeto_id: clienteSelecionado.projeto_id,
          valor_total: totalGeral,
          status: "pendente",
          observacoes: `Pedido de materiais - ${itensParaSalvar.length} itens`,
        })
        .select()
        .single();

      if (orcamentoError) throw orcamentoError;

      // Inserir itens
      const itensInserir = itensParaSalvar.map((item) => ({
        orcamento_id: orcamento.id,
        pricelist_id: item.id,
        nome: item.nome,
        unidade: item.unidade,
        quantidade: item.quantidade,
        preco_unitario: item.preco,
        valor_total: item.quantidade * item.preco,
        categoria: item.categoria,
      }));

      const { error: itensError } = await supabase
        .from("orcamentos_cliente_itens")
        .insert(itensInserir);

      if (itensError) throw itensError;

      toast({
        title: "Orçamento salvo!",
        description: `${itensParaSalvar.length} itens salvos com sucesso.`,
      });

      navigate("/planejamento/orcamentos");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast({
        title: "Erro ao salvar",
        description: "NÍo foi possível salvar o orçamento.",
        variant: "destructive",
      });
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header Fixo */}
      <div className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-[1800px] mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Esquerda */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate(-1)}
                title="Voltar"
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-[#F25C26]" />
                <h1 className="text-lg font-normal text-gray-900">Pedido de Materiais</h1>
              </div>
            </div>

            {/* Centro: Busca */}
            <div className="flex-1 max-w-2xl">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={busca}
                    onChange={(e) => setBusca(e.target.value)}
                    placeholder="Buscar produto..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none text-sm"
                  />
                </div>

                <div className="relative">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={buscaLink}
                    onChange={(e) => setBuscaLink(e.target.value)}
                    placeholder="Cole um link..."
                    className="w-48 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none text-sm"
                  />
                </div>

                <button
                  type="button"
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2 text-sm whitespace-nowrap"
                >
                  <Globe className="w-4 h-4" />
                  Importar
                </button>
              </div>
            </div>

            {/* Direita */}
            <div className="flex items-center gap-4">
              <select
                value={clienteSelecionado?.id || ""}
                onChange={(e) => {
                  const cliente = clientes.find((c) => c.id === e.target.value);
                  setClienteSelecionado(cliente || null);
                }}
                title="Selecionar cliente"
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] outline-none"
              >
                <option value="">Selecione o cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente.id} value={cliente.id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>

              <div className="text-right border-l border-gray-200 pl-4">
                <p className="text-xs text-gray-500">{qtdItensSelecionados} itens</p>
                <p className="text-xl font-normal text-green-600">
                  {totalGeral.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </p>
              </div>

              <button
                type="button"
                onClick={salvarOrcamento}
                disabled={salvando || qtdItensSelecionados === 0}
                className="px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {salvando ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Salvar
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-[1800px] mx-auto px-4 py-4">
        {loadingCatalogo ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#F25C26] animate-spin" />
          </div>
        ) : (
          <div className="space-y-2">
            {CATEGORIAS_ORDEM.map((categoria) => {
              const itens = itensPorCategoria[categoria];
              if (!itens || itens.length === 0) return null;

              const isExpandida = categoriasExpandidas.includes(categoria);
              const totalCategoria = totaisPorCategoria[categoria] || 0;
              const qtdCategoria = itens.filter((i) => i.quantidade > 0).length;
              const corCategoria = getCorCategoria(categoria);

              return (
                <div key={categoria} className="bg-white rounded-lg overflow-hidden shadow-sm border-l-4" style={{ borderLeftColor: corCategoria }}>
                  {/* Header da Categoria */}
                  <button
                    type="button"
                    onClick={() => toggleCategoria(categoria)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-white transition-colors"
                    style={{ backgroundColor: corCategoria }}
                  >
                    <div className="flex items-center gap-2">
                      {isExpandida ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span className="font-medium">{categoria}</span>
                      {qtdCategoria > 0 && (
                        <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full font-normal">
                          {qtdCategoria}
                        </span>
                      )}
                    </div>
                    <span className="font-normal">
                      {totalCategoria > 0
                        ? totalCategoria.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
                        : "R$ 0,00"}
                    </span>
                  </button>

                  {/* Grid de Itens */}
                  {isExpandida && (
                    <div className="p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {itens.map((item) => (
                          <div
                            key={item.id}
                            className={`border rounded-lg p-2 transition-all ${
                              item.quantidade > 0
                                ? "border-[#F25C26] bg-orange-50"
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                          >
                            <div className="flex gap-2">
                              {/* Imagem */}
                              <div className="w-14 h-14 flex-shrink-0">
                                {item.imagem_url ? (
                                  <img
                                    src={item.imagem_url}
                                    alt={item.nome}
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gray-100 rounded flex items-center justify-center">
                                    <Package className="w-5 h-5 text-gray-400" />
                                  </div>
                                )}
                              </div>

                              {/* Info */}
                              <div className="flex-1 min-w-0">
                                {/* Linha: Qtd | Preço Unit | Total */}
                                <div className="flex items-center gap-1.5 mb-1">
                                  {/* Quantidade */}
                                  <div className="flex items-center">
                                    <button
                                      type="button"
                                      onClick={() => atualizarQuantidade(item.id, -1)}
                                      title="Diminuir quantidade"
                                      className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-l flex items-center justify-center text-gray-700"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <input
                                      type="number"
                                      value={item.quantidade}
                                      onChange={(e) => setQuantidade(item.id, parseFloat(e.target.value) || 0)}
                                      title="Quantidade"
                                      className="w-8 h-5 text-center text-xs font-normal border-y border-gray-200 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => atualizarQuantidade(item.id, 1)}
                                      title="Aumentar quantidade"
                                      className="w-5 h-5 bg-gray-200 hover:bg-gray-300 rounded-r flex items-center justify-center text-gray-700"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Preço Unitário */}
                                  <span className="text-xs text-gray-500">
                                    {item.preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>

                                  {/* Total */}
                                  <span className={`text-xs font-normal ml-auto ${
                                    item.quantidade > 0 ? "text-green-600" : "text-gray-400"
                                  }`}>
                                    {(item.quantidade * item.preco).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </span>
                                </div>

                                {/* Nome do Produto */}
                                <p className="text-xs text-gray-700 line-clamp-2 leading-tight" title={item.nome}>
                                  {item.nome}
                                </p>
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
        )}
      </div>
    </div>
  );
}


