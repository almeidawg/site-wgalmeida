/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// NOVO ORÇAMENTO
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import Avatar from "@/components/common/Avatar";
import { criarOrcamento, buscarOrcamento, criarItem, type Orcamento } from "@/lib/orcamentoApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import {
  importarProdutoPorLink,
  validarUrlProduto,
  formatarPreco,
  buscarProdutoNaInternet,
  type ProdutoImportado,
} from "@/lib/importadorProdutos";
import type { ItemPriceList } from "@/types/pricelist";

interface Cliente {
  id: string;
  nome: string;
  cpf?: string;
  email?: string;
  avatar_url?: string | null;
  avatar?: string | null;
}



interface CategoriaPriceList {
  id: string;
  nome: string;
  descricao?: string;
  cor?: string;
  subcategorias?: SubcategoriaPriceList[];
}

interface SubcategoriaPriceList {
  id: string;
  nome: string;
  categoria_id: string;
}

interface ItemOrcamento {
  id: string;
  pricelist_item_id?: string;
  descricao: string;
  quantidade: number;
  valor_unitario: number;
  subtotal: number;
  imagem_url?: string | null;
}

export default function NovoOrcamentoPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdicao = Boolean(id);
  const { toast } = useToast();

  // Estados principais
  const [loading, setLoading] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Dados do orçamento
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [titulo, setTitulo] = useState("");
  const [itens, setItens] = useState<ItemOrcamento[]>([]);

  // Busca de clientes
  const [buscaCliente, setBuscaCliente] = useState("");
  const [clientesEncontrados, setClientesEncontrados] = useState<Cliente[]>([]);
  const [mostrarResultadosCliente, setMostrarResultadosCliente] = useState(false);

  // Busca de produtos
  const [buscaProduto, setBuscaProduto] = useState("");
  const [produtosEncontrados, setProdutosEncontrados] = useState<ItemPriceList[]>([]);
  const [mostrarResultadosProduto, setMostrarResultadosProduto] = useState(false);

  // Item sendo adicionado
  const [novoItem, setNovoItem] = useState({
    descricao: "",
    quantidade: 1,
    valor_unitario: 0,
  });

  // ImportaçÍo de produtos
  const [urlProduto, setUrlProduto] = useState("");
  const [importando, setImportando] = useState(false);
  const [produtoImportado, setProdutoImportado] = useState<ProdutoImportado | null>(null);
  const [erroImportacao, setErroImportacao] = useState("");

  // Busca por texto
  const [termoBuscaInternet, setTermoBuscaInternet] = useState("");
  const [buscandoInternet, setBuscandoInternet] = useState(false);
  const [resultadosBusca, setResultadosBusca] = useState<ProdutoImportado[]>([]);

  // Modal Salvar no PriceList
  const [mostrarModalPriceList, setMostrarModalPriceList] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaPriceList[]>([]);
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [novaCategoria, setNovaCategoria] = useState("");
  const [salvandoPriceList, setSalvandoPriceList] = useState(false);

  // Subcategorias
  const [subcategorias, setSubcategorias] = useState<SubcategoriaPriceList[]>([]);
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string>("");
  const [novaSubcategoria, setNovaSubcategoria] = useState("");
  const [carregandoSubcategorias, setCarregandoSubcategorias] = useState(false);

  useEffect(() => {
    if (id) {
      carregarOrcamento();
    }
  }, [id]);

  async function carregarOrcamento() {
    if (!id) return;

    try {
      setLoading(true);
      const orcamento = await buscarOrcamento(id);

      if (orcamento) {
        setTitulo(orcamento.titulo || "");

        // Carregar cliente
        if (orcamento.cliente_id) {
          const { data: cliente } = await supabase
            .from("pessoas")
            .select("*")
            .eq("id", orcamento.cliente_id)
            .single();

          if (cliente) {
            setClienteSelecionado(cliente as Cliente);
          }
        }

        // Carregar itens do orçamento para ediçÍo
        try {
          const { listarItens } = await import("@/lib/orcamentoApi");
          const itensExistentes = await listarItens(id);
          // Adaptar para o formato esperado pelo estado 'itens'
          setItens(
            (itensExistentes || []).map(item => ({
              id: item.id,
              descricao: item.descricao,
              quantidade: item.quantidade,
              valor_unitario: item.valor_unitario,
              subtotal: item.subtotal,
              imagem_url: (item as { imagem_url?: string | null }).imagem_url || null,
            }))
          );
        } catch (e) {
          console.error("Erro ao carregar itens do orçamento:", e);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar orçamento" });
    } finally {
      setLoading(false);
    }
  }

  async function buscarClientes(termo: string) {
    if (!termo || termo.length < 2) {
      setClientesEncontrados([]);
      setMostrarResultadosCliente(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pessoas")
        .select("id, nome, cpf, email, avatar_url, avatar")
        .ilike("tipo", "cliente")
        .or(`nome.ilike.*${termo}*,cpf.ilike.*${termo}*,email.ilike.*${termo}*`)
        .limit(10);

      if (error) {
        console.error("Erro ao buscar clientes:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao buscar clientes. Verifique o console." });
        throw error;
      }

      setClientesEncontrados((data || []) as Cliente[]);
      setMostrarResultadosCliente(true);
    } catch (error) {
      console.error("Erro ao buscar clientes:", error);
      setClientesEncontrados([]);
      setMostrarResultadosCliente(false);
    }
  }

  async function buscarProdutos(termo: string) {
    if (!termo || termo.length < 2) {
      setProdutosEncontrados([]);
      setMostrarResultadosProduto(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("pricelist_itens")
        .select("*")
        .eq("ativo", true)
        .or(`nome.ilike.*${termo}*,codigo.ilike.*${termo}*,descricao.ilike.*${termo}*`)
        .limit(10);

      if (error) {
        console.error("Erro ao buscar produtos:", error);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao buscar produtos. Verifique o console." });
        throw error;
      }

      setProdutosEncontrados((data || []) as ItemPriceList[]);
      setMostrarResultadosProduto(true);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
      setProdutosEncontrados([]);
      setMostrarResultadosProduto(false);
    }
  }

  function selecionarCliente(cliente: Cliente) {
    setClienteSelecionado(cliente);
    setBuscaCliente("");
    setMostrarResultadosCliente(false);
  }

  function selecionarProduto(produto: ItemPriceList) {
    setNovoItem({
      descricao: produto.nome,
      quantidade: 1,
      valor_unitario: produto.preco,
    });
    setBuscaProduto("");
    setMostrarResultadosProduto(false);
  }

  function adicionarItem() {
    if (!novoItem.descricao || novoItem.quantidade <= 0 || novoItem.valor_unitario <= 0) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha todos os campos do item" });
      return;
    }

    const item: ItemOrcamento = {
      id: `temp-${Date.now()}`,
      descricao: novoItem.descricao,
      quantidade: novoItem.quantidade,
      valor_unitario: novoItem.valor_unitario,
      subtotal: novoItem.quantidade * novoItem.valor_unitario,
    };

    setItens([...itens, item]);
    setNovoItem({
      descricao: "",
      quantidade: 1,
      valor_unitario: 0,
    });
  }

  function removerItem(id: string) {
    setItens(itens.filter(item => item.id !== id));
  }

  async function handleImportarProduto() {
    setErroImportacao("");
    setProdutoImportado(null);

    if (!urlProduto.trim()) {
      setErroImportacao("Digite a URL do produto");
      return;
    }

    if (!validarUrlProduto(urlProduto)) {
      setErroImportacao("URL inválida ou site nÍo suportado");
      return;
    }

    try {
      setImportando(true);
      const produto = await importarProdutoPorLink(urlProduto);
      setProdutoImportado(produto);

      // Preencher o formulário com os dados do produto
      setNovoItem({
        descricao: produto.titulo,
        quantidade: 1,
        valor_unitario: produto.preco,
      });

      setErroImportacao("");
    } catch (error: any) {
      setErroImportacao(error.message || "Erro ao importar produto");
      setProdutoImportado(null);
    } finally {
      setImportando(false);
    }
  }

  function limparImportacao() {
    setUrlProduto("");
    setProdutoImportado(null);
    setErroImportacao("");
    setResultadosBusca([]);
    setTermoBuscaInternet("");
  }

  // Buscar produto por texto na internet usando IA
  async function handleBuscarNaInternet() {
    if (!termoBuscaInternet.trim()) {
      setErroImportacao("Digite o nome do produto para buscar");
      return;
    }

    try {
      setBuscandoInternet(true);
      setErroImportacao("");
      setResultadosBusca([]);

      const resultados = await buscarProdutoNaInternet(termoBuscaInternet);
      setResultadosBusca(resultados);

      if (resultados.length === 0) {
        setErroImportacao("Nenhum produto encontrado. Tente outros termos.");
      }
    } catch (error: any) {
      setErroImportacao(error.message || "Erro ao buscar produtos");
    } finally {
      setBuscandoInternet(false);
    }
  }

  // Selecionar resultado da busca
  function selecionarResultadoBusca(produto: ProdutoImportado) {
    setProdutoImportado(produto);
    setNovoItem({
      descricao: produto.titulo,
      quantidade: 1,
      valor_unitario: produto.preco,
    });
    setResultadosBusca([]);
  }

  // Carregar categorias do PriceList
  async function carregarCategorias() {
    try {
      const { data, error } = await supabase
        .from("pricelist_categorias")
        .select("*")
        .order("nome");

      if (error) throw error;
      setCategorias((data || []) as CategoriaPriceList[]);
    } catch (error) {
      console.error("Erro ao carregar categorias:", error);
    }
  }

  // Carregar subcategorias por categoria
  async function carregarSubcategorias(categoriaId: string) {
    if (!categoriaId) {
      setSubcategorias([]);
      return;
    }

    try {
      setCarregandoSubcategorias(true);
      const { data, error } = await supabase
        .from("pricelist_subcategorias")
        .select("*")
        .eq("categoria_id", categoriaId)
        .order("nome");

      if (error) throw error;
      setSubcategorias((data || []) as SubcategoriaPriceList[]);
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error);
      setSubcategorias([]);
    } finally {
      setCarregandoSubcategorias(false);
    }
  }

  // Abrir modal para salvar no PriceList
  function abrirModalSalvarPriceList() {
    if (!novoItem.descricao || novoItem.valor_unitario <= 0) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha a descriçÍo e valor do item primeiro" });
      return;
    }
    carregarCategorias();
    // Resetar estados
    setCategoriaSelecionada("");
    setNovaCategoria("");
    setSubcategoriaSelecionada("");
    setNovaSubcategoria("");
    setSubcategorias([]);
    setMostrarModalPriceList(true);
  }

  // Salvar produto no PriceList
  async function salvarNoPriceList() {
    if (!categoriaSelecionada && !novaCategoria.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione ou crie uma categoria" });
      return;
    }

    // Validar subcategoria (obrigatória)
    if (!subcategoriaSelecionada && !novaSubcategoria.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione ou crie uma subcategoria para o produto" });
      return;
    }

    try {
      setSalvandoPriceList(true);

      let categoriaId = categoriaSelecionada;

      // Criar nova categoria se necessário
      if (novaCategoria.trim() && !categoriaSelecionada) {
        const { data: novaCat, error: erroCat } = await supabase
          .from("pricelist_categorias")
          .insert({
            nome: novaCategoria.trim(),
            tipo: "material", // tipo padrÍo para produtos importados
            ativo: true
          })
          .select()
          .single();

        if (erroCat) throw erroCat;
        categoriaId = novaCat.id;
      }

      let subcategoriaId = subcategoriaSelecionada;

      // Criar nova subcategoria se necessário
      if (novaSubcategoria.trim() && !subcategoriaSelecionada) {
        const { data: novaSubcat, error: erroSubcat } = await supabase
          .from("pricelist_subcategorias")
          .insert({
            nome: novaSubcategoria.trim(),
            categoria_id: categoriaId,
            tipo: "material", // tipo padrÍo para produtos importados
            ativo: true
          })
          .select()
          .single();

        if (erroSubcat) throw erroSubcat;
        subcategoriaId = novaSubcat.id;
      }

      // Gerar código único
      const codigo = `IMP-${Date.now().toString(36).toUpperCase()}`;

      // Criar item no PriceList com categoria E subcategoria
      const { data: novoItemPriceList, error: erroItem } = await supabase
        .from("pricelist_itens")
        .insert({
          codigo,
          nome: novoItem.descricao,
          descricao: produtoImportado?.descricao || novoItem.descricao,
          categoria_id: categoriaId,
          subcategoria_id: subcategoriaId,
          tipo: "material", // tipo padrÍo para produtos importados
          preco: novoItem.valor_unitario,
          unidade: "un",
          ativo: true,
          imagem_url: produtoImportado?.imagem_url,
          url_referencia: produtoImportado?.url_origem,
          marca: produtoImportado?.marca,
        })
        .select()
        .single();

      if (erroItem) throw erroItem;

      // Buscar nome da categoria e subcategoria para exibir na mensagem
      const categoriaNome = novaCategoria.trim() || categorias.find(c => c.id === categoriaId)?.nome || "";
      const subcategoriaNome = novaSubcategoria.trim() || subcategorias.find(s => s.id === subcategoriaId)?.nome || "";

      toast({ title: "Sucesso", description: `Produto "${novoItem.descricao}" salvo no PriceList! Categoria: ${categoriaNome} | Subcategoria: ${subcategoriaNome} | Código: ${codigo}` });
      setMostrarModalPriceList(false);
      setCategoriaSelecionada("");
      setNovaCategoria("");
      setSubcategoriaSelecionada("");
      setNovaSubcategoria("");
      setSubcategorias([]);

    } catch (error: any) {
      console.error("Erro ao salvar no PriceList:", error);
      const mensagemErro = error?.message || error?.details || JSON.stringify(error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao salvar produto no PriceList: ${mensagemErro}` });
    } finally {
      setSalvandoPriceList(false);
    }
  }

  function calcularTotais() {
    const total = itens.reduce((sum, item) => sum + (typeof item.subtotal === 'number' && !isNaN(item.subtotal) ? item.subtotal : (item.quantidade * item.valor_unitario || 0)), 0);
    const margem = 15; // 15% padrÍo
    const imposto = 7; // 7% padrÍo

    return {
      total,
      margem,
      imposto,
    };
  }

  async function salvarOrcamento() {
    if (!clienteSelecionado) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Selecione um cliente" });
      return;
    }

    if (itens.length === 0) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Adicione pelo menos um item ao orçamento" });
      return;
    }

    if (!titulo.trim()) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Digite um título para o orçamento" });
      return;
    }

    try {
      setSalvando(true);

      const totais = calcularTotais();

      // Criar orçamento
      const orcamentoData: Partial<Orcamento> = {
        cliente_id: clienteSelecionado.id,
        titulo,
        valor_total: totais.total,
        margem: totais.margem,
        imposto: totais.imposto,
      };

      const orcamentoCriado = await criarOrcamento(orcamentoData);

      // Adicionar itens (subtotal é gerado automaticamente pelo banco)
      for (const item of itens) {
        await criarItem({
          orcamento_id: orcamentoCriado.id,
          descricao: item.descricao,
          quantidade: item.quantidade,
          valor_unitario: item.valor_unitario,
        });
      }

      toast({ title: "Sucesso", description: "Orçamento salvo com sucesso!" });
      navigate("/planejamento/orcamentos");
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar orçamento. Verifique o console para mais detalhes." });
    } finally {
      setSalvando(false);
    }
  }

  const totais = calcularTotais();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#F25C26] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => navigate("/planejamento/orcamentos")}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Voltar
          </button>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">
            {isEdicao ? "Editar Orçamento" : "Novo Orçamento"}
          </h1>
          <p className="text-[12px] text-gray-600">
            Crie orçamentos de produtos, materiais e itens para seus clientes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Coluna 1: Informações Básicas */}
          <div className="lg:col-span-1 space-y-6">

            {/* Cliente */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-[16px] font-normal text-gray-700 mb-4">
                Cliente
              </h3>

              <div className="mb-4 relative">
                <input
                  type="text"
                  value={buscaCliente}
                  onChange={(e) => {
                    setBuscaCliente(e.target.value);
                    buscarClientes(e.target.value);
                  }}
                  onFocus={() => {
                    if (clientesEncontrados.length > 0) {
                      setMostrarResultadosCliente(true);
                    }
                  }}
                  placeholder="Buscar cliente..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-lg"
                />

                {/* Dropdown de resultados */}
                {mostrarResultadosCliente && clientesEncontrados.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {clientesEncontrados.map((cliente) => (
                      <button
                        key={cliente.id}
                        type="button"
                        onClick={() => selecionarCliente(cliente)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                      >
                        <p className="font-medium text-gray-900 text-[14px]">{cliente.nome}</p>
                        {cliente.cpf && (
                          <p className="text-xs text-gray-600">CPF: {cliente.cpf}</p>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {clienteSelecionado ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar
                      nome={clienteSelecionado.nome}
                      avatar_url={clienteSelecionado.avatar_url}
                      avatar={clienteSelecionado.avatar}
                      size={48}
                    />
                    <div className="flex-1">
                      <p className="font-normal text-gray-900">{clienteSelecionado.nome}</p>
                      {clienteSelecionado.email && (
                        <p className="text-xs text-gray-600">{clienteSelecionado.email}</p>
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setClienteSelecionado(null)}
                    className="text-[14px] text-red-600 hover:text-red-800"
                  >
                    Remover cliente
                  </button>
                </div>
              ) : (
                <p className="text-[12px] text-gray-500 text-center py-4">
                  Nenhum cliente selecionado
                </p>
              )}
            </div>

            {/* Informações do Orçamento */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-[16px] font-normal text-gray-700 mb-4">
                Informações
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[14px] font-medium text-gray-700 mb-1">
                    Título do Orçamento
                  </label>
                  <input
                    type="text"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="Ex: Reforma Completa Apartamento"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-[14px]"
                  />
                </div>
              </div>
            </div>

            {/* Resumo */}
            {itens.length > 0 && (
              <div className="bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-lg p-6 text-white shadow-lg">
                <h3 className="text-[16px] font-normal mb-4">
                  Resumo
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm opacity-90">Total de Itens</span>
                    <span className="text-[14px] font-normal">{itens.length}</span>
                  </div>
                  <div className="h-px bg-white/30" />
                  <div className="flex items-center justify-between">
                    <span className="text-[14px] font-normal">TOTAL</span>
                    <span className="text-[20px] font-normal">{formatarMoeda(totais.total)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Coluna 2 e 3: Itens */}
          <div className="lg:col-span-2 space-y-6">

            {/* Importar Produto da Internet */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-6 border-2 border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-[16px] font-normal text-gray-900">
                    Buscar Produto na Internet
                  </h3>
                  <p className="text-sm text-gray-600">
                    Cole um link ou busque por nome usando IA
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Tabs: URL ou Busca por Texto */}
                <div className="flex gap-2 border-b border-gray-200 pb-2">
                  <button
                    type="button"
                    onClick={() => { setResultadosBusca([]); setTermoBuscaInternet(""); }}
                    className={`px-4 py-2 text-[14px] font-medium rounded-t-lg transition ${!termoBuscaInternet && resultadosBusca.length === 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Por URL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUrlProduto(""); setProdutoImportado(null); }}
                    className={`px-4 py-2 text-[14px] font-medium rounded-t-lg transition ${termoBuscaInternet || resultadosBusca.length > 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Por URL
                  </button>
                  <button
                    type="button"
                    onClick={() => { setUrlProduto(""); setProdutoImportado(null); }}
                    className={`px-4 py-2 text-[14px] font-medium rounded-t-lg transition ${termoBuscaInternet || resultadosBusca.length > 0 ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    Buscar por Nome (IA)
                  </button>
                </div>

                {/* OpçÍo 1: URL do Produto */}
                {!termoBuscaInternet && resultadosBusca.length === 0 && (
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={urlProduto}
                      onChange={(e) => setUrlProduto(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleImportarProduto()}
                      placeholder="https://www.leroymerlin.com.br/produto/..."
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      disabled={importando}
                    />
                    <button
                      type="button"
                      onClick={handleImportarProduto}
                      disabled={importando || !urlProduto.trim()}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {importando ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Importando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Importar
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* OpçÍo 2: Busca por Texto com IA */}
                {(termoBuscaInternet || resultadosBusca.length > 0 || (!urlProduto && !produtoImportado)) && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={termoBuscaInternet}
                      onChange={(e) => setTermoBuscaInternet(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleBuscarNaInternet()}
                      placeholder="Ex: Piso porcelanato 60x60 bege"
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                      disabled={buscandoInternet}
                    />
                    <button
                      type="button"
                      onClick={handleBuscarNaInternet}
                      disabled={buscandoInternet || !termoBuscaInternet.trim()}
                      className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {buscandoInternet ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Buscando...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                          Buscar com IA
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Resultados da Busca por Texto */}
                {resultadosBusca.length > 0 && (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    <p className="text-sm font-medium text-gray-700">Resultados encontrados ({resultadosBusca.length}):</p>
                    {resultadosBusca.map((produto, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          if (import.meta.env.DEV) console.log("Produto selecionado:", produto);
                          selecionarResultadoBusca(produto);
                        }}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left flex items-start gap-3"
                      >
                        {/* Imagem do Produto */}
                        {produto.imagem_url ? (
                          <img
                            src={produto.imagem_url}
                            alt={produto.titulo}
                            className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                            onError={(e) => {
                              if (import.meta.env.DEV) console.log("Erro ao carregar imagem:", produto.imagem_url);
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center text-2xl flex-shrink-0">
                            📦
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 text-sm line-clamp-2">{produto.titulo}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">{produto.marca || 'Sem marca'}</span>
                            <span className="text-sm font-normal text-green-600">{formatarPreco(produto.preco)}</span>
                          </div>
                          {produto.url_origem && (
                            <span className="text-xs text-blue-500 truncate block mt-1">
                              {new URL(produto.url_origem).hostname.replace('www.', '')}
                            </span>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Sites Suportados */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="font-medium">Sites suportados:</span>
                  <span className="px-2 py-1 bg-white rounded border border-gray-200">Leroy Merlin</span>
                  <span className="px-2 py-1 bg-white rounded border border-gray-200">Amazon</span>
                  <span className="px-2 py-1 bg-white rounded border border-gray-200">Mercado Livre</span>
                  <span className="px-2 py-1 bg-white rounded border border-gray-200">Magazine Luiza</span>
                  <span className="px-2 py-1 bg-white rounded border border-gray-200">+ outros</span>
                </div>

                {/* Erro de ImportaçÍo */}
                {erroImportacao && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-red-800">{erroImportacao}</p>
                  </div>
                )}

                {/* Preview do Produto Importado */}
                {produtoImportado && (
                  <div className="p-4 bg-white rounded-lg border-2 border-green-300">
                    <div className="flex items-start gap-4 mb-3">
                      {produtoImportado.imagem_url ? (
                        <img
                          src={produtoImportado.imagem_url}
                          alt={produtoImportado.titulo}
                          className="w-24 h-24 object-cover rounded-lg border border-gray-200"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl">
                          📦
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-normal text-gray-900 mb-1">{produtoImportado.titulo}</p>
                        {produtoImportado.sku && (
                          <p className="text-xs text-gray-600 mb-2">SKU: {produtoImportado.sku}</p>
                        )}
                        <p className="text-[20px] font-normal text-green-600">{formatarPreco(produtoImportado.preco)}</p>
                        <a
                          href={produtoImportado.url_origem}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                        >
                          Ver produto original →
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-medium text-green-700">
                          Produto importado! Use o formulário abaixo para adicionar.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={limparImportacao}
                        className="text-sm text-gray-600 hover:text-gray-900 underline"
                      >
                        Limpar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Adicionar Item */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                Adicionar Item
              </h3>

              <div className="space-y-4">
                {/* Busca de Produto */}
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buscar Produto (Price List)
                  </label>
                  <input
                    type="text"
                    value={buscaProduto}
                    onChange={(e) => {
                      setBuscaProduto(e.target.value);
                      buscarProdutos(e.target.value);
                    }}
                    onFocus={() => {
                      if (produtosEncontrados.length > 0) {
                        setMostrarResultadosProduto(true);
                      }
                    }}
                    placeholder="Busque por nome, código ou descriçÍo..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  />

                  {/* Dropdown de produtos */}
                  {mostrarResultadosProduto && produtosEncontrados.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                      {produtosEncontrados.map((produto) => (
                        <button
                          key={produto.id}
                          type="button"
                          onClick={() => selecionarProduto(produto)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                        >
                          <p className="font-medium text-gray-900">{produto.nome}</p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-xs text-gray-600">
                              {produto.codigo} • {produto.categoria}
                            </span>
                            <span className="text-sm font-normal text-[#F25C26]">
                              {formatarMoeda(produto.preco)}/{produto.unidade}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* DescriçÍo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DescriçÍo do Item
                  </label>
                  <input
                    type="text"
                    value={novoItem.descricao}
                    onChange={(e) => setNovoItem({ ...novoItem, descricao: e.target.value })}
                    placeholder="Ex: Piso Porcelanato 60x60"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>

                {/* Quantidade e Valor */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantidade
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.01"
                      value={novoItem.quantidade}
                      onChange={(e) => setNovoItem({ ...novoItem, quantidade: parseFloat(e.target.value) || 0 })}
                      placeholder="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor Unitário
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={novoItem.valor_unitario}
                      onChange={(e) => setNovoItem({ ...novoItem, valor_unitario: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                    />
                  </div>
                </div>

                {/* Subtotal e Botões */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <p className="text-[12px] text-gray-600">Subtotal</p>
                    <p className="text-[20px] font-normal text-gray-900">
                      {formatarMoeda(novoItem.quantidade * novoItem.valor_unitario)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* BotÍo Salvar no PriceList */}
                    <button
                      type="button"
                      onClick={abrirModalSalvarPriceList}
                      disabled={!novoItem.descricao || novoItem.valor_unitario <= 0}
                      className="px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Salvar este produto no PriceList para uso futuro"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Salvar no PriceList
                    </button>
                    {/* BotÍo Adicionar Item */}
                    <button
                      type="button"
                      onClick={adicionarItem}
                      className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Adicionar Item
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
              <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wide mb-4">
                Itens do Orçamento ({itens.length})
              </h3>

              {itens.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-gray-500">Nenhum item adicionado</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Use o formulário acima para adicionar itens
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itens.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-4 border border-gray-200 rounded-lg hover:border-[#F25C26] transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={item.descricao}
                            onChange={e => {
                              const novaDesc = e.target.value;
                              setItens(itens => itens.map((it, i) => i === idx ? {
                                ...it,
                                descricao: novaDesc
                              } : it));
                            }}
                            className="font-normal text-gray-900 mb-2 border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                            style={{ width: '110%', fontSize: 15, marginBottom: 8 }}
                          />
                          <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                            <span>
                              Qtd: <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.quantidade}
                                onChange={e => {
                                  const novaQtd = parseFloat(e.target.value) || 0;
                                  setItens(itens => itens.map((it, i) => i === idx ? {
                                    ...it,
                                    quantidade: novaQtd,
                                    subtotal: (novaQtd * it.valor_unitario)
                                  } : it));
                                }}
                                className="w-18 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-gray-900 text-right"
                                style={{ fontSize: 14, width: '110%' }}
                              />
                            </span>
                            <span>•</span>
                            <span>
                              Unit: <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.valor_unitario}
                                onChange={e => {
                                  const novoValor = parseFloat(e.target.value) || 0;
                                  setItens(itens => itens.map((it, i) => i === idx ? {
                                    ...it,
                                    valor_unitario: novoValor,
                                    subtotal: (it.quantidade * novoValor)
                                  } : it));
                                }}
                                className="w-24 px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#F25C26] text-gray-900 text-right"
                                style={{ fontSize: 14, width: '110%' }}
                              />
                            </span>
                            <span>•</span>
                            <span className="font-normal text-gray-900">
                              Total: {formatarMoeda(
                                typeof item.subtotal === 'number' && !isNaN(item.subtotal)
                                  ? item.subtotal
                                  : (item.quantidade * item.valor_unitario || 0)
                              )}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerItem(item.id)}
                          className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          title="Remover item"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Botões de AçÍo */}
            <div className="flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate("/planejamento/orcamentos")}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarOrcamento}
                disabled={salvando || !clienteSelecionado || itens.length === 0 || !titulo.trim()}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvando ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    Salvar Orçamento
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Salvar no PriceList */}
      {mostrarModalPriceList && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md animate-in zoom-in-95">
            {/* Header do Modal */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-normal text-gray-900">Salvar no PriceList</h3>
                    <p className="text-xs text-gray-500">Cadastrar produto para uso futuro</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMostrarModalPriceList(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                  title="Fechar modal"
                  aria-label="Fechar modal"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Corpo do Modal */}
            <div className="px-6 py-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Preview do Produto */}
              <div className="p-4 bg-gray-50 rounded-lg flex gap-3">
                {produtoImportado?.imagem_url && (
                  <img
                    src={produtoImportado.imagem_url}
                    alt={novoItem.descricao}
                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{novoItem.descricao}</p>
                  <p className="text-[14px] font-normal text-green-600 mt-1">{formatarMoeda(novoItem.valor_unitario)}</p>
                  {produtoImportado?.marca && (
                    <p className="text-xs text-gray-500 mt-1">Marca: {produtoImportado.marca}</p>
                  )}
                </div>
              </div>

              {/* SEÇÍO: CATEGORIA */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="text-sm font-normal text-blue-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  1. Categoria Principal
                </h4>

                {/* SeleçÍo de Categoria */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Selecionar categoria existente
                  </label>
                  <select
                    value={categoriaSelecionada}
                    onChange={(e) => {
                      const catId = e.target.value;
                      setCategoriaSelecionada(catId);
                      setSubcategoriaSelecionada("");
                      setNovaSubcategoria("");
                      if (catId) {
                        setNovaCategoria("");
                        carregarSubcategorias(catId);
                      } else {
                        setSubcategorias([]);
                      }
                    }}
                    aria-label="Selecionar categoria"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  >
                    <option value="">Selecione uma categoria...</option>
                    {categorias.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* ou Criar Nova Categoria */}
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex-1 h-px bg-blue-200" />
                  <span className="text-xs text-blue-400">ou criar nova</span>
                  <div className="flex-1 h-px bg-blue-200" />
                </div>
                <input
                  type="text"
                  value={novaCategoria}
                  onChange={(e) => {
                    setNovaCategoria(e.target.value);
                    if (e.target.value) {
                      setCategoriaSelecionada("");
                      setSubcategorias([]);
                      setSubcategoriaSelecionada("");
                    }
                  }}
                  placeholder="Ex: Pintura, Elétrica, Hidráulica..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              {/* SEÇÍO: SUBCATEGORIA */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h4 className="text-sm font-normal text-orange-800 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                  2. Subcategoria (Tipo do Produto)
                </h4>

                {/* SeleçÍo de Subcategoria */}
                {(categoriaSelecionada || novaCategoria.trim()) ? (
                  <>
                    {carregandoSubcategorias ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <span className="ml-2 text-sm text-gray-600">Carregando subcategorias...</span>
                      </div>
                    ) : (
                      <>
                        {subcategorias.length > 0 && categoriaSelecionada && (
                          <div className="mb-3">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Selecionar subcategoria existente
                            </label>
                            <select
                              value={subcategoriaSelecionada}
                              onChange={(e) => {
                                setSubcategoriaSelecionada(e.target.value);
                                if (e.target.value) setNovaSubcategoria("");
                              }}
                              aria-label="Selecionar subcategoria"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                            >
                              <option value="">Selecione uma subcategoria...</option>
                              {subcategorias.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.nome}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}

                        {/* Criar Nova Subcategoria */}
                        {(subcategorias.length > 0 && categoriaSelecionada) && (
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex-1 h-px bg-orange-200" />
                            <span className="text-xs text-orange-400">ou criar nova</span>
                            <div className="flex-1 h-px bg-orange-200" />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            {subcategorias.length === 0 || novaCategoria.trim() ? 'Nome da subcategoria' : 'Criar nova subcategoria'}
                          </label>
                          <input
                            type="text"
                            value={novaSubcategoria}
                            onChange={(e) => {
                              setNovaSubcategoria(e.target.value);
                              if (e.target.value) setSubcategoriaSelecionada("");
                            }}
                            placeholder="Ex: Material de Pintura, Insumos de Pintura..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                          />
                        </div>
                      </>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Selecione ou crie uma categoria primeiro
                  </p>
                )}
              </div>

              {/* Dica */}
              <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">
                <strong>💡 Exemplo:</strong> Para "Tinta Acrílica", selecione a categoria <strong>Pintura</strong> e subcategoria <strong>Material de Pintura</strong>.
              </div>
            </div>

            {/* Footer do Modal */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalPriceList(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={salvarNoPriceList}
                disabled={
                  salvandoPriceList ||
                  (!categoriaSelecionada && !novaCategoria.trim()) ||
                  (!subcategoriaSelecionada && !novaSubcategoria.trim())
                }
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {salvandoPriceList ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Salvar Produto
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

