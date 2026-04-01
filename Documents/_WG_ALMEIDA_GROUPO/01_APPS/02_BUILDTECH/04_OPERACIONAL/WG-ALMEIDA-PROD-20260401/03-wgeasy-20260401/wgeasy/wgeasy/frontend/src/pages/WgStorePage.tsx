/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// WG STORE - LOJA VIRTUAL
// Sistema WG Easy - Grupo WG Almeida
// Catálogo de produtos usando pricelist_itens
// ==========================================

import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Grid3X3, List, Package, ShoppingCart, ExternalLink, X, AlertCircle, Globe, ImageIcon, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase, supabaseUrl } from "@/lib/supabaseClient";
import type { PricelistItemCompleto, PricelistCategoria } from "@/types/pricelist";
import { formatarPreco } from "@/types/pricelist";
import BuscaProdutoInternet from "@/components/common/BuscaProdutoInternet";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import type { ProdutoImportado } from "@/lib/importadorProdutos";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import WGStarIcon from "@/components/icons/WGStarIcon";

// ==========================================
// Tipos
// ==========================================

interface ProdutoLoja extends PricelistItemCompleto {
  categoria?: PricelistCategoria;
  url_referencia?: string | null;
}

type ViewMode = "grid" | "list";

// ==========================================
// Componente Principal
// ==========================================

export default function WgStorePage() {
  const { toast } = useToast();

  // Estado
  const [produtos, setProdutos] = useState<ProdutoLoja[]>([]);
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("");
  const [fabricanteFiltro, setFabricanteFiltro] = useState<string>("");
  const [ordenacao, setOrdenacao] = useState<string>("nome");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [showFilters, setShowFilters] = useState(false);

  // Importar produto
  const [mostrarImportador, setMostrarImportador] = useState(false);
  const [salvandoProduto, setSalvandoProduto] = useState(false);

  // Importar imagens em lote
  const [modalImportarImagens, setModalImportarImagens] = useState(false);
  const [importandoImagens, setImportandoImagens] = useState(false);
  const [progressoImagens, setProgressoImagens] = useState(0);
  const [totalProdutosSemImagem, setTotalProdutosSemImagem] = useState(0);
  const [imagensImportadas, setImagensImportadas] = useState(0);
  const [errosImportacao, setErrosImportacao] = useState(0);
  const [logImportacao, setLogImportacao] = useState<string[]>([]);

  // ==========================================
  // Carregar Dados
  // ==========================================

  useEffect(() => {
    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);
      setError(null);

      // Carregar produtos do tipo "produto" ativos
      const { data: produtosData, error: produtosError } = await supabase
        .from("pricelist_itens")
        .select(
          `
          *,
          categoria:pricelist_categorias!categoria_id (
            id,
            nome,
            codigo,
            tipo
          ),
          subcategoria:pricelist_subcategorias!subcategoria_id (
            id,
            nome
          )
        `
        )
        .eq("tipo", "produto")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (produtosError) throw produtosError;

      // Carregar categorias
      const { data: categoriasData, error: categoriasError } = await supabase
        .from("pricelist_categorias")
        .select("*")
        .eq("tipo", "produto")
        .eq("ativo", true)
        .order("nome", { ascending: true });

      if (categoriasError) throw categoriasError;

      setProdutos(produtosData || []);
      setCategorias(categoriasData || []);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
      setError(err.message || "Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // Filtros e OrdenaçÍo
  // ==========================================

  const fabricantesUnicos = useMemo(() => {
    const fabricantes = produtos
      .map((p) => p.fabricante)
      .filter((f): f is string => !!f);
    return [...new Set(fabricantes)].sort((a, b) => a.localeCompare(b));
  }, [produtos]);

  const produtosFiltrados = useMemo(() => {
    let resultado = [...produtos];

    // Filtro de busca
    if (busca) {
      const termoBusca = normalizeSearchTerm(busca);
      resultado = resultado.filter(
        (p) =>
          normalizeSearchTerm(p.nome).includes(termoBusca) ||
          normalizeSearchTerm(p.descricao || "").includes(termoBusca) ||
          normalizeSearchTerm(p.codigo || "").includes(termoBusca) ||
          normalizeSearchTerm(p.fabricante || "").includes(termoBusca) ||
          normalizeSearchTerm(p.modelo || "").includes(termoBusca)
      );
    }

    // Filtro de categoria
    if (categoriaFiltro) {
      resultado = resultado.filter((p) => p.categoria_id === categoriaFiltro);
    }

    // Filtro de fabricante
    if (fabricanteFiltro) {
      resultado = resultado.filter((p) => p.fabricante === fabricanteFiltro);
    }

    // OrdenaçÍo
    resultado.sort((a, b) => {
      switch (ordenacao) {
        case "nome":
          return a.nome.localeCompare(b.nome);
        case "preco_asc":
          return (a.preco || 0) - (b.preco || 0);
        case "preco_desc":
          return (b.preco || 0) - (a.preco || 0);
        case "avaliacao":
          return (b.avaliacao || 0) - (a.avaliacao || 0);
        case "fabricante":
          return (a.fabricante || "").localeCompare(b.fabricante || "");
        default:
          return 0;
      }
    });

    return resultado;
  }, [produtos, busca, categoriaFiltro, fabricanteFiltro, ordenacao]);

  // ==========================================
  // Limpar Filtros
  // ==========================================

  function limparFiltros() {
    setBusca("");
    setCategoriaFiltro("");
    setFabricanteFiltro("");
    setOrdenacao("nome");
  }

  const temFiltrosAtivos = busca || categoriaFiltro || fabricanteFiltro;

  // ==========================================
  // Salvar Produto Importado
  // ==========================================

  async function handleProdutoImportado(produto: ProdutoImportado) {
    try {
      setSalvandoProduto(true);

      // Gerar código único
      const codigo = `PROD-${Date.now().toString(36).toUpperCase()}`;

      // Buscar ou criar categoria "Produtos Importados"
      let categoriaId = null;
      const { data: categoriaExistente } = await supabase
        .from("pricelist_categorias")
        .select("id")
        .eq("nome", "Produtos Importados")
        .eq("tipo", "produto")
        .single();

      if (categoriaExistente) {
        categoriaId = categoriaExistente.id;
      } else {
        const { data: novaCategoria, error: erroCat } = await supabase
          .from("pricelist_categorias")
          .insert({
            nome: "Produtos Importados",
            tipo: "produto",
            ativo: true,
          })
          .select()
          .single();

        if (erroCat) throw erroCat;
        categoriaId = novaCategoria.id;
      }

      // Criar produto no PriceList
      const { error: erroProduto } = await supabase
        .from("pricelist_itens")
        .insert({
          codigo,
          nome: produto.titulo,
          descricao: produto.descricao || produto.titulo,
          categoria_id: categoriaId,
          tipo: "produto",
          preco: produto.preco,
          unidade: "un",
          ativo: true,
          imagem_url: produto.imagem_url,
          url_referencia: produto.url_origem,
          fabricante: produto.marca,
          avaliacao: produto.avaliacao,
        })
        .select()
        .single();

      if (erroProduto) throw erroProduto;

      toast({
        title: "Produto importado!",
        description: `"${produto.titulo}" foi adicionado à loja`,
      });

      // Recarregar dados
      setMostrarImportador(false);
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Erro ao importar",
        description: error.message || "NÍo foi possível salvar o produto",
        variant: "destructive",
      });
    } finally {
      setSalvandoProduto(false);
    }
  }

  // ==========================================
  // Importar Imagens em Lote
  // ==========================================

  // Contar produtos sem imagem
  const produtosSemImagem = useMemo(() => {
    return produtos.filter((p) => !p.imagem_url);
  }, [produtos]);

  // Abrir modal de importaçÍo
  function abrirModalImportarImagens() {
    setTotalProdutosSemImagem(produtosSemImagem.length);
    setProgressoImagens(0);
    setImagensImportadas(0);
    setErrosImportacao(0);
    setLogImportacao([]);
    setModalImportarImagens(true);
  }

  // Buscar imagem via Edge Function
  async function buscarImagemProduto(produto: ProdutoLoja): Promise<string | null> {
    try {
      // Obter token de autenticaçÍo
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const EDGE_FUNCTION_URL = `${supabaseUrl}/functions/v1/buscar-produto-ia`;

      // Primeiro tentar extrair da URL de referência se existir
      if (produto.url_referencia) {
        const response = await fetch(EDGE_FUNCTION_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            termoBusca: produto.url_referencia,
            tipo: 'extrair_imagem_url'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.imagem_url) {
            return data.imagem_url;
          }
        }
      }

      // Fallback: buscar imagem via IA pelo nome do produto
      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          termoBusca: JSON.stringify({
            nome: produto.nome,
            fabricante: produto.fabricante,
            url_referencia: produto.url_referencia,
          }),
          tipo: 'buscar_imagem'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.imagem_url) {
          return data.imagem_url;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao buscar imagem:', error);
      return null;
    }
  }

  // Importar imagens em lote
  async function iniciarImportacaoImagens() {
    if (produtosSemImagem.length === 0) {
      toast({
        title: "Nenhum produto sem imagem",
        description: "Todos os produtos já possuem imagens",
      });
      return;
    }

    setImportandoImagens(true);
    setProgressoImagens(0);
    setImagensImportadas(0);
    setErrosImportacao(0);
    setLogImportacao([`Iniciando importaçÍo de ${produtosSemImagem.length} imagens...`]);

    let sucessos = 0;
    let erros = 0;

    for (let i = 0; i < produtosSemImagem.length; i++) {
      const produto = produtosSemImagem[i];
      const progresso = Math.round(((i + 1) / produtosSemImagem.length) * 100);
      setProgressoImagens(progresso);

      setLogImportacao((prev) => [...prev, `[${i + 1}/${produtosSemImagem.length}] Buscando: ${produto.nome.substring(0, 40)}...`]);

      try {
        const imagemUrl = await buscarImagemProduto(produto);

        if (imagemUrl) {
          // Atualizar no banco
          const { error: updateError } = await supabase
            .from("pricelist_itens")
            .update({ imagem_url: imagemUrl })
            .eq("id", produto.id);

          if (updateError) {
            throw updateError;
          }

          sucessos++;
          setImagensImportadas(sucessos);
          setLogImportacao((prev) => [...prev, `✅ Imagem encontrada para: ${produto.nome.substring(0, 40)}`]);
        } else {
          erros++;
          setErrosImportacao(erros);
          setLogImportacao((prev) => [...prev, `❌ Sem imagem: ${produto.nome.substring(0, 40)}`]);
        }
      } catch (error: any) {
        erros++;
        setErrosImportacao(erros);
        setLogImportacao((prev) => [...prev, `❌ Erro: ${produto.nome.substring(0, 40)} - ${error.message}`]);
      }

      // Pequeno delay para nÍo sobrecarregar a API
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setLogImportacao((prev) => [...prev, `\n=== CONCLUÍDO ===`, `Importadas: ${sucessos}`, `Sem imagem: ${erros}`]);
    setImportandoImagens(false);

    toast({
      title: "ImportaçÍo concluída!",
      description: `${sucessos} imagens importadas, ${erros} nÍo encontradas`,
    });

    // Recarregar dados
    carregarDados();
  }

  // ==========================================
  // Render: Loading
  // ==========================================

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-gray-200 rounded w-48" />
            <div className="h-12 bg-gray-200 rounded" />
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
              {Array.from(new Array(12)).map((_, i) => (
                <div key={`skeleton-loading`} className="h-56 bg-gray-200 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Erro
  // ==========================================

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-[1800px] mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-[20px] font-normal text-red-800 mb-2">
              Erro ao carregar loja
            </h2>
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={carregarDados} variant="outline">
              Tentar novamente
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // Render: Principal
  // ==========================================

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-wg-primary/10 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-wg-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-normal text-gray-900">WG Store</h1>
                <p className="text-[16px] text-gray-600">
                  Catálogo de produtos do Grupo WG Almeida
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* BotÍo Importar Imagens */}
              {produtosSemImagem.length > 0 && (
                <Button
                  variant="outline"
                  onClick={abrirModalImportarImagens}
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Importar Imagens ({produtosSemImagem.length})
                </Button>
              )}

              {/* BotÍo Importar Produto */}
              <Button
                onClick={() => setMostrarImportador(!mostrarImportador)}
                className={mostrarImportador ? "bg-gray-600" : "bg-wg-primary hover:bg-wg-primary/90"}
              >
                {mostrarImportador ? (
                  <>
                    <X className="w-4 h-4 mr-2" />
                    Fechar
                  </>
                ) : (
                  <>
                    <Globe className="w-4 h-4 mr-2" />
                    Importar da Internet
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Importador de Produtos */}
        {mostrarImportador && (
          <div className="mb-6">
            <BuscaProdutoInternet
              onProdutoSelecionado={handleProdutoImportado}
              onClose={() => setMostrarImportador(false)}
              titulo="Importar Produto para Loja"
              subtitulo="Busque produtos na internet e adicione à WG Store com imagens"
            />
          </div>
        )}

        {/* Barra de Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Busca */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Categoria */}
            <Select value={categoriaFiltro || "__all__"} onValueChange={(v) => setCategoriaFiltro(v === "__all__" ? "" : v)}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Todas categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* OrdenaçÍo */}
            <Select value={ordenacao} onValueChange={setOrdenacao}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nome">Nome A-Z</SelectItem>
                <SelectItem value="preco_asc">Menor preço</SelectItem>
                <SelectItem value="preco_desc">Maior preço</SelectItem>
                <SelectItem value="avaliacao">Melhor avaliaçÍo</SelectItem>
                <SelectItem value="fabricante">Fabricante</SelectItem>
              </SelectContent>
            </Select>

            {/* Botões */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowFilters(!showFilters)}
                className={showFilters ? "bg-gray-100" : ""}
              >
                <Filter className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("grid")}
                className={viewMode === "grid" ? "bg-gray-100" : ""}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setViewMode("list")}
                className={viewMode === "list" ? "bg-gray-100" : ""}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Filtros Expandidos */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t flex flex-wrap gap-4">
              <Select
                value={fabricanteFiltro || "__all__"}
                onValueChange={(v) => setFabricanteFiltro(v === "__all__" ? "" : v)}
              >
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Fabricante" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">Todos fabricantes</SelectItem>
                  {fabricantesUnicos.map((fab) => (
                    <SelectItem key={fab} value={fab}>
                      {fab}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {temFiltrosAtivos && (
                <Button variant="ghost" size="sm" onClick={limparFiltros}>
                  <X className="w-4 h-4 mr-1" />
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Contagem de Resultados */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {produtosFiltrados.length} produto{produtosFiltrados.length === 1 ? '' : 's'} encontrado{produtosFiltrados.length === 1 ? '' : 's'}
          </p>

          {temFiltrosAtivos && (
            <div className="flex gap-2">
              {busca && (
                <Badge variant="secondary" className="gap-1">
                  Busca: {busca}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setBusca("")}
                  />
                </Badge>
              )}
              {categoriaFiltro && (
                <Badge variant="secondary" className="gap-1">
                  {categorias.find((c) => c.id === categoriaFiltro)?.nome}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setCategoriaFiltro("")}
                  />
                </Badge>
              )}
              {fabricanteFiltro && (
                <Badge variant="secondary" className="gap-1">
                  {fabricanteFiltro}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setFabricanteFiltro("")}
                  />
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Lista de Produtos */}
        {produtosFiltrados.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-[20px] font-normal text-gray-700 mb-2">
              Nenhum produto encontrado
            </h2>
            <p className="text-[16px] text-gray-500 mb-4">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
            {temFiltrosAtivos && (
              <Button variant="outline" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          // OrganizaçÍo por categoria (etapa) - 8 itens por linha em XL
          <div className="space-y-8">
            {(() => {
              // Agrupar produtos por categoria
              const produtosPorCategoria = produtosFiltrados.reduce((acc, produto) => {
                const catNome = produto.categoria?.nome || "Outros";
                if (!acc[catNome]) acc[catNome] = [];
                acc[catNome].push(produto);
                return acc;
              }, {} as Record<string, ProdutoLoja[]>);

              // Se há filtro de categoria ativo, mostrar grid direto
              if (categoriaFiltro) {
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {produtosFiltrados.map((produto) => (
                      <ProdutoCard key={produto.id} produto={produto} />
                    ))}
                  </div>
                );
              }

              // Sem filtro: agrupar por categoria/etapa
              return Object.entries(produtosPorCategoria).map(([catNome, prods]) => (
                <div key={catNome} className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-[20px] font-normal text-gray-800 flex items-center gap-2">
                      <span className="w-1 h-6 bg-wg-primary rounded-full" />
                      {catNome}
                    </h2>
                    <span className="text-sm text-gray-500">{prods.length} produto{prods.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {prods.map((produto) => (
                      <ProdutoCard key={produto.id} produto={produto} />
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <div className="space-y-4">
            {produtosFiltrados.map((produto) => (
              <ProdutoListItem key={produto.id} produto={produto} />
            ))}
          </div>
        )}
      </div>

      {/* Modal Importar Imagens */}
      <Dialog open={modalImportarImagens} onOpenChange={(open) => !importandoImagens && setModalImportarImagens(open)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-600" />
              Importar Imagens dos Produtos
            </DialogTitle>
            <DialogDescription>
              Busca automática de imagens para produtos sem foto cadastrada.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-normal text-gray-900">{totalProdutosSemImagem}</p>
                <p className="text-xs text-gray-500">Sem imagem</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-normal text-green-600">{imagensImportadas}</p>
                <p className="text-xs text-gray-500">Importadas</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-normal text-red-600">{errosImportacao}</p>
                <p className="text-xs text-gray-500">NÍo encontradas</p>
              </div>
            </div>

            {/* Barra de Progresso */}
            {importandoImagens && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Progresso</span>
                  <span className="font-medium">{progressoImagens}%</span>
                </div>
                <Progress value={progressoImagens} className="h-2" />
              </div>
            )}

            {/* Log de ImportaçÍo */}
            {logImportacao.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-3 max-h-48 overflow-y-auto">
                <div className="space-y-1 font-mono text-xs text-gray-300">
                  {logImportacao.slice(-15).map((log, i) => (
                    <p key={`log-${i}-${log.slice(0,10)}`} className={
                      log.startsWith("✅")
                        ? "text-green-400"
                        : log.startsWith("❌")
                        ? "text-red-400"
                        : ""
                    }>
                      {log}
                    </p>
                  ))}
                </div>
              </div>
            )}

            {/* Aviso */}
            {!importandoImagens && logImportacao.length === 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-800">
                  <strong>Como funciona:</strong> O sistema vai buscar imagens automaticamente
                  para cada produto sem foto, usando a URL de referência ou buscando na internet.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            {importandoImagens === false ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => setModalImportarImagens(false)}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={iniciarImportacaoImagens}
                  className="bg-purple-600 hover:bg-purple-700"
                  disabled={totalProdutosSemImagem === 0}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Iniciar ImportaçÍo
                </Button>
              </>
            ) : (
              <Button disabled className="w-full">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importando... {progressoImagens}%
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// Componente: Card de Produto (Grid)
// ==========================================

function ProdutoCard({ produto }: Readonly<{ produto: ProdutoLoja }>) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
      {/* Imagem */}
      <div className="aspect-square bg-gray-100 relative overflow-hidden">
        {produto.imagem_url && !imageError ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}

        {/* Badge de Fabricante */}
        {produto.fabricante && (
          <Badge className="absolute top-1.5 left-1.5 bg-white/90 text-gray-700 text-[10px] px-1.5 py-0.5">
            {produto.fabricante}
          </Badge>
        )}

        {/* AvaliaçÍo */}
        {produto.avaliacao && (
          <div className="absolute top-1.5 right-1.5 bg-white/90 rounded-full px-1.5 py-0.5 flex items-center gap-0.5">
            <WGStarIcon className="w-2.5 h-2.5 fill-yellow-400 text-yellow-400" />
            <span className="text-[10px] font-medium">{produto.avaliacao}</span>
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="p-3">
        {/* Categoria */}
        {produto.categoria && (
          <p className="text-[10px] text-gray-500 mb-0.5 truncate">{produto.categoria.nome}</p>
        )}

        {/* Nome */}
        <h3 className="font-normal text-gray-900 text-sm line-clamp-2 mb-1 min-h-[36px]">
          {produto.nome}
        </h3>

        {/* Código */}
        {produto.codigo && (
          <p className="text-[10px] text-gray-400 font-mono mb-1 truncate">
            {produto.codigo}
          </p>
        )}

        {/* Preço */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-normal text-wg-primary">
              {formatarPreco(produto.preco)}
            </p>
            {produto.unidade && produto.unidade !== "un" && (
              <p className="text-[10px] text-gray-500">/{produto.unidade}</p>
            )}
          </div>

          {/* Link Fabricante */}
          {produto.link_produto && (
            <a
              href={produto.link_produto}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-wg-primary transition-colors"
              title="Ver no site do fabricante"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>

      {/* BotÍo Ver Detalhes */}
      <div className="px-3 pb-3">
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => navigate(`/pricelist/${produto.id}`)}
        >
          Ver Detalhes
        </Button>
      </div>
    </div>
  );
}

// ==========================================
// Componente: Item de Produto (Lista)
// ==========================================

function ProdutoListItem({ produto }: Readonly<{ produto: ProdutoLoja }>) {
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 flex gap-4 hover:shadow-md transition-shadow">
      {/* Imagem */}
      <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {produto.imagem_url && !imageError ? (
          <img
            src={produto.imagem_url}
            alt={produto.nome}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            {/* Categoria */}
            {produto.categoria && (
              <p className="text-xs text-gray-500 mb-1">
                {produto.categoria.nome}
              </p>
            )}

            {/* Nome */}
            <h3 className="font-normal text-gray-900 truncate">
              {produto.nome}
            </h3>

            {/* Fabricante e Código */}
            <div className="flex items-center gap-3 mt-1">
              {produto.fabricante && (
                <Badge variant="secondary" className="text-xs">
                  {produto.fabricante}
                </Badge>
              )}
              {produto.codigo && (
                <span className="text-xs text-gray-400 font-mono">
                  {produto.codigo}
                </span>
              )}
            </div>

            {/* DescriçÍo */}
            {produto.descricao && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-1">
                {produto.descricao}
              </p>
            )}
          </div>

          {/* Preço e Ações */}
          <div className="text-right flex-shrink-0">
            <p className="text-lg font-normal text-wg-primary">
              {formatarPreco(produto.preco)}
            </p>
            {produto.unidade && produto.unidade !== "un" && (
              <p className="text-xs text-gray-500">por {produto.unidade}</p>
            )}

            {/* AvaliaçÍo */}
            {produto.avaliacao && (
              <div className="flex items-center justify-end gap-1 mt-1">
                <WGStarIcon className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{produto.avaliacao}</span>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => navigate(`/pricelist/${produto.id}`)}
            >
              Ver Detalhes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

