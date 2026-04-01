/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ========================================
// PAGINA DE IMPORTACAO EM LOTE - PRICELIST
// Cole multiplos produtos (um por linha) para importar
// ========================================

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Upload,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Play,
  Pause,
  Package,
  Image,
  Trash2,
  Edit2,
  Save,
  Sparkles,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";
import { buscarProdutoNaInternet, type ProdutoImportado } from "@/lib/importadorProdutos";
import { gerarCodigoItem } from "@/lib/pricelistApi";
import { Input } from "@/components/ui/input";
import { parseTextoCompleto, calcularEstatisticasParsing, type DadosExtraidos } from "@/lib/parserTextoInteligente";
import { listarSubcategoriasPorCategoria, type PricelistSubcategoria } from "@/lib/pricelistApi";
import { listarNucleos, type Nucleo } from "@/lib/nucleosApi";

interface ProdutoLote {
  id: string;
  linhaOriginal: string;
  nome: string;
  status: "pendente" | "buscando" | "encontrado" | "erro" | "salvo" | "extraido";
  dadosEncontrados?: ProdutoImportado;
  dadosExtraidos?: DadosExtraidos; // Dados extraídos do texto colado
  erro?: string;
  selecionado: boolean;
  // Campos editaveis
  nomeEditado?: string;
  precoEditado?: number;
  unidadeEditada?: string;
  quantidadeEditada?: number;
  imagemEditada?: string;
  editando?: boolean;
}

type TipoPricelist = "mao_obra" | "material" | "servico" | "produto";

export default function ImportarLotePage() {
  const navigate = useNavigate();
  const [textoLote, setTextoLote] = useState("");
  const [produtos, setProdutos] = useState<ProdutoLote[]>([]);
  const [processando, setProcessando] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [iÍndiceAtual, setIÍndiceAtual] = useState(0);
  const [tipoSelecionado, setTipoSelecionado] = useState<TipoPricelist>("material");
  const [nucleoSelecionado, setNucleoSelecionado] = useState<string>("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState<string>("");
  const [subcategoriaSelecionada, setSubcategoriaSelecionada] = useState<string>("");
  const [nucleos, setNucleos] = useState<Nucleo[]>([]);
  const [categorias, setCategorias] = useState<{ id: string; nome: string; codigo?: string }[]>([]);
  const [subcategorias, setSubcategorias] = useState<PricelistSubcategoria[]>([]);
  const [etapa, setEtapa] = useState<"entrada" | "processando" | "revisao" | "salvando">("entrada");

  // Carregar categorias e núcleos do pricelist
  useEffect(() => {
    async function carregarDadosIniciais() {
      // Carregar categorias
      const { data: categoriasData } = await supabase
        .from("pricelist_categorias")
        .select("id, nome, codigo")
        .eq("ativo", true)
        .order("nome");
      if (categoriasData) setCategorias(categoriasData);

      // Carregar núcleos
      try {
        const nucleosData = await listarNucleos();
        setNucleos(nucleosData);
      } catch (error) {
        console.error("Erro ao carregar núcleos:", error);
      }
    }
    carregarDadosIniciais();
  }, []);

  // Carregar subcategorias quando categoria é selecionada
  useEffect(() => {
    async function carregarSubcategorias() {
      if (!categoriaSelecionada) {
        setSubcategorias([]);
        setSubcategoriaSelecionada("");
        return;
      }
      try {
        const subs = await listarSubcategoriasPorCategoria(categoriaSelecionada);
        setSubcategorias(subs);
        setSubcategoriaSelecionada(""); // Reset subcategoria
      } catch (error) {
        console.error("Erro ao carregar subcategorias:", error);
        setSubcategorias([]);
      }
    }
    carregarSubcategorias();
  }, [categoriaSelecionada]);

  // Estatisticas
  const estatisticas = {
    total: produtos.length,
    pendentes: produtos.filter((p) => p.status === "pendente").length,
    extraidos: produtos.filter((p) => p.status === "extraido").length,
    encontrados: produtos.filter((p) => p.status === "encontrado").length,
    erros: produtos.filter((p) => p.status === "erro").length,
    salvos: produtos.filter((p) => p.status === "salvo").length,
    selecionados: produtos.filter((p) => p.selecionado && (p.status === "encontrado" || p.status === "extraido")).length,
  };

  // Processar texto colado e criar lista de produtos com parser inteligente
  function processarTexto() {
    if (!textoLote.trim()) {
      toast.warning("Cole a lista de produtos primeiro");
      return;
    }

    // Usar parser inteligente
    const dadosExtraidos = parseTextoCompleto(textoLote);

    if (dadosExtraidos.length === 0) {
      toast.warning("Nenhum produto encontrado no texto");
      return;
    }

    // Calcular estatísticas do parsing
    const stats = calcularEstatisticasParsing(dadosExtraidos);

    const novosProdutos: ProdutoLote[] = dadosExtraidos.map((dados, index) => ({
      id: `produto-${index}-${Date.now()}`,
      linhaOriginal: dados.linhaOriginal,
      nome: dados.nome,
      // Se extraiu preço, marca como "extraido", senÍo "pendente" para buscar na internet
      status: dados.fonte === "extraido" ? "extraido" : "pendente",
      dadosExtraidos: dados,
      selecionado: true,
      // Pré-preencher campos editáveis
      nomeEditado: dados.nome,
      precoEditado: dados.preco || undefined,
      unidadeEditada: dados.unidade,
      quantidadeEditada: dados.quantidade || undefined,
    }));

    setProdutos(novosProdutos);

    // Se todos têm preço extraído, ir direto para revisÍo
    // SenÍo, ir para etapa de processamento (busca na internet)
    if (stats.semPreco === 0) {
      setEtapa("revisao");
      toast.success(
        `${novosProdutos.length} produtos extraídos com sucesso! ` +
        `Selecione a categoria e salve.`
      );
    } else {
      setEtapa("processando");
      // Mensagem com estatísticas
      if (stats.comPreco > 0) {
        toast.success(
          `${novosProdutos.length} produtos carregados! ` +
          `${stats.comPreco} com preço extraído, ` +
          `${stats.semPreco} para buscar na internet.`
        );
      } else {
        toast.success(`${novosProdutos.length} produtos carregados para buscar na internet`);
      }
    }
  }

  // Buscar dados de um produto
  async function buscarDadosProduto(produto: ProdutoLote): Promise<ProdutoLote> {
    try {
      // Buscar na internet
      const resultados = await buscarProdutoNaInternet(produto.nome);

      if (resultados && resultados.length > 0) {
        const melhorResultado = resultados[0];
        return {
          ...produto,
          status: "encontrado",
          dadosEncontrados: melhorResultado,
          nomeEditado: melhorResultado.titulo,
          precoEditado: melhorResultado.preco,
          imagemEditada: melhorResultado.imagem_url,
        };
      } else {
        return {
          ...produto,
          status: "erro",
          erro: "Produto nao encontrado",
        };
      }
    } catch (error: unknown) {
      const mensagemErro = error instanceof Error ? error.message : String(error);
      return {
        ...produto,
        status: "erro",
        erro: mensagemErro || "Erro na busca",
      };
    }
  }

  // Iniciar busca em lote
  async function iniciarBuscaEmLote() {
    const produtosPendentes = produtos.filter((p) => p.status === "pendente");

    if (produtosPendentes.length === 0) {
      toast.warning("Nenhum produto pendente para buscar");
      return;
    }

    setProcessando(true);
    setPausado(false);
    setProgresso(0);

    for (let i = 0; i < produtosPendentes.length; i++) {
      if (pausado) {
        setIÍndiceAtual(i);
        break;
      }

      const produto = produtosPendentes[i];

      // Atualizar status para buscando
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, status: "buscando" } : p))
      );

      // Buscar dados
      const produtoAtualizado = await buscarDadosProduto(produto);

      // Atualizar na lista
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? produtoAtualizado : p))
      );

      // Atualizar progresso
      setProgresso(Math.round(((i + 1) / produtosPendentes.length) * 100));
      setIÍndiceAtual(i + 1);

      // Delay entre requisicoes
      if (i < produtosPendentes.length - 1 && !pausado) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setProcessando(false);
    if (!pausado) {
      setEtapa("revisao");
      toast.success("Busca concluida! Revise os produtos antes de salvar.");
    }
  }

  // Continuar busca
  async function continuarBusca() {
    setPausado(false);
    const produtosPendentes = produtos.filter((p) => p.status === "pendente");

    setProcessando(true);

    for (let i = 0; i < produtosPendentes.length; i++) {
      if (pausado) {
        setIÍndiceAtual(i);
        break;
      }

      const produto = produtosPendentes[i];

      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, status: "buscando" } : p))
      );

      const produtoAtualizado = await buscarDadosProduto(produto);

      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? produtoAtualizado : p))
      );

      setProgresso(Math.round(((i + 1) / produtosPendentes.length) * 100));

      if (i < produtosPendentes.length - 1 && !pausado) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }

    setProcessando(false);
    if (!pausado) {
      setEtapa("revisao");
    }
  }

  // Pausar busca
  function pausarBusca() {
    setPausado(true);
    toast.info("Busca pausada");
  }

  // Salvar produtos selecionados
  async function salvarProdutos() {
    const produtosParaSalvar = produtos.filter(
      (p) => p.selecionado && (p.status === "encontrado" || p.status === "extraido")
    );

    if (produtosParaSalvar.length === 0) {
      toast.warning("Nenhum produto selecionado para salvar");
      return;
    }

    if (!categoriaSelecionada) {
      toast.warning("Selecione uma categoria");
      return;
    }

    setEtapa("salvando");
    let salvos = 0;
    let erros = 0;

    // Obter código da categoria selecionada para prefixo do código do item
    const categoriaAtual = categorias.find(c => c.id === categoriaSelecionada);
    const categoriaCodigo = categoriaAtual?.codigo || null;

    for (const produto of produtosParaSalvar) {
      try {
        // Prioridade: editado > extraído > encontrado > padrÍo
        const nome = produto.nomeEditado || produto.dadosExtraidos?.nome || produto.dadosEncontrados?.titulo || produto.nome;
        const preco = produto.precoEditado ?? produto.dadosExtraidos?.preco ?? produto.dadosEncontrados?.preco ?? 0;
        const unidade = produto.unidadeEditada || produto.dadosExtraidos?.unidade || "un";

        // Gerar código único para o item
        const codigo = await gerarCodigoItem(tipoSelecionado, categoriaCodigo);

        const { error } = await supabase.from("pricelist_itens").insert({
          codigo,
          nome,
          tipo: tipoSelecionado,
          nucleo_id: nucleoSelecionado || null,
          categoria_id: categoriaSelecionada,
          subcategoria_id: subcategoriaSelecionada || null,
          preco,
          imagem_url: produto.imagemEditada || produto.dadosEncontrados?.imagem_url,
          link_produto: produto.dadosEncontrados?.url_origem,
          descricao: produto.dadosEncontrados?.descricao,
          fabricante: produto.dadosEncontrados?.marca,
          unidade,
          ativo: true,
        });

        if (error) throw error;

        setProdutos((prev) =>
          prev.map((p) => (p.id === produto.id ? { ...p, status: "salvo" } : p))
        );
        salvos++;
      } catch (error) {
        erros++;
        console.error("Erro ao salvar produto:", error);
      }
    }

    toast.success(`${salvos} produtos salvos${erros > 0 ? `, ${erros} erros` : ""}`);
  }

  // Remover produto da lista
  function removerProduto(id: string) {
    setProdutos((prev) => prev.filter((p) => p.id !== id));
  }

  // Toggle edicao
  function toggleEdicao(id: string) {
    setProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, editando: !p.editando } : p))
    );
  }

  // Atualizar campo editado
  function atualizarCampo(
    id: string,
    campo: keyof ProdutoLote,
    valor: string | number | boolean | undefined
  ) {
    setProdutos((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [campo]: valor } : p))
    );
  }

  // Renderizar badge de status
  function renderStatus(status: ProdutoLote["status"]) {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="outline" className="gap-1">
            <Search className="h-3 w-3" />
            Buscar
          </Badge>
        );
      case "extraido":
        return (
          <Badge className="bg-amber-100 text-amber-700 gap-1">
            <Sparkles className="h-3 w-3" />
            Extraído
          </Badge>
        );
      case "buscando":
        return (
          <Badge className="bg-blue-100 text-blue-700">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Buscando
          </Badge>
        );
      case "encontrado":
        return (
          <Badge className="bg-green-100 text-green-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Encontrado
          </Badge>
        );
      case "erro":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
      case "salvo":
        return (
          <Badge className="bg-purple-100 text-purple-700">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Salvo
          </Badge>
        );
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pricelist")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-normal text-gray-800">Importar em Lote</h1>
            <p className="text-gray-500">
              Cole uma lista de produtos (um por linha) para buscar e importar
            </p>
          </div>
        </div>
      </div>

      {/* Etapa 1: Entrada de texto */}
      {etapa === "entrada" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Lista de Produtos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Parser Inteligente:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-700">
                    <li>Cole textos de <strong>planilhas, listas de preços ou orçamentos de fornecedores</strong></li>
                    <li>O sistema extrai automaticamente: <strong>nome, unidade (m², kg, un...) e preço</strong></li>
                    <li>Funciona com texto separado por TAB, pipe (|) ou formato livre</li>
                    <li>Itens sem preço serÍo buscados na internet automaticamente</li>
                  </ul>
                </div>
              </div>
            </div>

            <Textarea
              placeholder={`Exemplos de formatos aceitos:

Nome simples:
Torneira monocomando cozinha
Piso porcelanato 60x60

Com preço (R$ 89,90/m²):
Porcelanato 60x60 - R$ 89,90/m²
Tinta 18L R$ 450,00

Planilha (TAB):
Cimento CP2	sc	R$ 32,50
Argamassa AC3	kg	R$ 2,80

Orçamento fornecedor:
45m² Piso vinílico = R$ 4.045,50
10un Luminárias LED - R$ 1.200,00`}
              value={textoLote}
              onChange={(e) => setTextoLote(e.target.value)}
              className="min-h-[300px] font-mono text-sm"
            />

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {textoLote.split("\n").filter((l) => l.trim().length > 3).length} produtos
                detectados
              </span>
              <Button
                onClick={processarTexto}
                className="bg-primary hover:bg-[#D94E1F]"
              >
                <Upload className="h-4 w-4 mr-2" />
                Processar Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Etapa 2: Processamento */}
      {(etapa === "processando" || etapa === "revisao" || etapa === "salvando") && (
        <>
          {/* Cards de estatisticas */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-gray-800">{estatisticas.total}</div>
                <p className="text-sm text-gray-500">Total</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-amber-600">{estatisticas.extraidos}</div>
                <p className="text-sm text-gray-500">Extraídos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-blue-600">{estatisticas.pendentes}</div>
                <p className="text-sm text-gray-500">P/ Buscar</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-green-600">{estatisticas.encontrados}</div>
                <p className="text-sm text-gray-500">Encontrados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-red-600">{estatisticas.erros}</div>
                <p className="text-sm text-gray-500">Erros</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-2xl font-normal text-purple-600">{estatisticas.salvos}</div>
                <p className="text-sm text-gray-500">Salvos</p>
              </CardContent>
            </Card>
          </div>

          {/* Ações na etapa de processamento */}
          {etapa === "processando" && !processando && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">
                      {estatisticas.extraidos} itens prontos para salvar
                    </h3>
                    <p className="text-sm text-gray-500">
                      {estatisticas.pendentes > 0
                        ? `${estatisticas.pendentes} itens precisam buscar preço na internet`
                        : "Todos os itens foram extraídos com sucesso"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {estatisticas.pendentes > 0 && (
                      <Button variant="outline" onClick={iniciarBuscaEmLote}>
                        <Search className="h-4 w-4 mr-2" />
                        Buscar Preços ({estatisticas.pendentes})
                      </Button>
                    )}
                    <Button
                      onClick={() => setEtapa("revisao")}
                      className="bg-primary hover:bg-[#D94E1F]"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Ir para RevisÍo
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Progresso */}
          {processando && (
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-normal">Buscando produtos...</h3>
                    <p className="text-sm text-gray-500">
                      {iÍndiceAtual} de {estatisticas.pendentes + iÍndiceAtual} processados
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!pausado ? (
                      <Button variant="outline" onClick={pausarBusca}>
                        <Pause className="h-4 w-4 mr-2" />
                        Pausar
                      </Button>
                    ) : (
                      <Button onClick={continuarBusca}>
                        <Play className="h-4 w-4 mr-2" />
                        Continuar
                      </Button>
                    )}
                  </div>
                </div>
                <Progress value={progresso} className="h-3" />
              </CardContent>
            </Card>
          )}

          {/* Controles de núcleo, categoria e tipo */}
          {etapa === "revisao" && (
            <Card>
              <CardContent className="pt-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-medium mb-1 block">
                      Tipo de Item
                    </label>
                    <Select
                      value={tipoSelecionado}
                      onValueChange={(v) => setTipoSelecionado(v as TipoPricelist)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="material">Material</SelectItem>
                        <SelectItem value="mao_obra">MÍo de Obra</SelectItem>
                        <SelectItem value="servico">Serviço</SelectItem>
                        <SelectItem value="produto">Produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[150px]">
                    <label className="text-sm font-medium mb-1 block">
                      Núcleo
                    </label>
                    <Select
                      value={nucleoSelecionado}
                      onValueChange={setNucleoSelecionado}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione (opcional)..." />
                      </SelectTrigger>
                      <SelectContent>
                        {nucleos.map((nucleo) => (
                          <SelectItem key={nucleo.id} value={nucleo.id}>
                            {nucleo.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm font-medium mb-1 block">
                      Categoria *
                    </label>
                    <Select
                      value={categoriaSelecionada}
                      onValueChange={setCategoriaSelecionada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {categorias.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.codigo ? `${cat.codigo} - ` : ""}{cat.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {subcategorias.length > 0 && (
                    <div className="flex-1 min-w-[200px]">
                      <label className="text-sm font-medium mb-1 block">
                        Subcategoria
                      </label>
                      <Select
                        value={subcategoriaSelecionada}
                        onValueChange={setSubcategoriaSelecionada}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione (opcional)..." />
                        </SelectTrigger>
                        <SelectContent>
                          {subcategorias.map((sub) => (
                            <SelectItem key={sub.id} value={sub.id}>
                              {sub.nome}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="flex items-end gap-2">
                    {estatisticas.pendentes > 0 && (
                      <Button
                        variant="outline"
                        onClick={iniciarBuscaEmLote}
                        disabled={processando}
                      >
                        <Play className="h-4 w-4 mr-2" />
                        Buscar Pendentes ({estatisticas.pendentes})
                      </Button>
                    )}
                    <Button
                      onClick={salvarProdutos}
                      disabled={estatisticas.selecionados === 0 || !categoriaSelecionada}
                      className="bg-primary hover:bg-[#D94E1F]"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar Selecionados ({estatisticas.selecionados})
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tabela de produtos */}
          <Card>
            <CardHeader>
              <CardTitle>Produtos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          checked={
                            produtos.filter((p) => p.status === "encontrado" || p.status === "extraido").length > 0 &&
                            produtos
                              .filter((p) => p.status === "encontrado" || p.status === "extraido")
                              .every((p) => p.selecionado)
                          }
                          onChange={(e) => {
                            setProdutos((prev) =>
                              prev.map((p) =>
                                p.status === "encontrado" || p.status === "extraido"
                                  ? { ...p, selecionado: e.target.checked }
                                  : p
                              )
                            );
                          }}
                        />
                      </TableHead>
                      <TableHead className="w-16">Img</TableHead>
                      <TableHead>Texto Original</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-20">Unid.</TableHead>
                      <TableHead className="w-24">Preço</TableHead>
                      <TableHead className="w-24">Status</TableHead>
                      <TableHead className="w-20">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {produtos.map((produto) => (
                      <TableRow key={produto.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={produto.selecionado}
                            disabled={produto.status !== "encontrado" && produto.status !== "extraido"}
                            onChange={(e) =>
                              atualizarCampo(produto.id, "selecionado", e.target.checked)
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {produto.imagemEditada || produto.dadosEncontrados?.imagem_url ? (
                            <img
                              src={produto.imagemEditada || produto.dadosEncontrados?.imagem_url}
                              alt=""
                              className="w-12 h-12 object-cover rounded border"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                              <Image className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-500 line-clamp-2">{produto.linhaOriginal}</span>
                        </TableCell>
                        <TableCell>
                          {produto.editando ? (
                            <Input
                              value={produto.nomeEditado || ""}
                              onChange={(e) =>
                                atualizarCampo(produto.id, "nomeEditado", e.target.value)
                              }
                              className="text-sm"
                            />
                          ) : (
                            <span className="font-medium">
                              {produto.nomeEditado ||
                                produto.dadosExtraidos?.nome ||
                                produto.dadosEncontrados?.titulo ||
                                "-"}
                            </span>
                          )}
                          {produto.erro && (
                            <p className="text-xs text-red-500">{produto.erro}</p>
                          )}
                        </TableCell>
                        <TableCell>
                          {produto.editando ? (
                            <Input
                              value={produto.unidadeEditada || "un"}
                              onChange={(e) =>
                                atualizarCampo(produto.id, "unidadeEditada", e.target.value)
                              }
                              className="w-16 text-sm"
                            />
                          ) : (
                            <span className="text-sm">
                              {produto.unidadeEditada || produto.dadosExtraidos?.unidade || "un"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {produto.editando ? (
                            <Input
                              type="number"
                              step="0.01"
                              value={produto.precoEditado || ""}
                              onChange={(e) =>
                                atualizarCampo(
                                  produto.id,
                                  "precoEditado",
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 text-sm"
                            />
                          ) : (
                            <span>
                              {(produto.precoEditado ?? produto.dadosExtraidos?.preco ?? produto.dadosEncontrados?.preco ?? 0) > 0
                                ? `R$ ${(produto.precoEditado ?? produto.dadosExtraidos?.preco ?? produto.dadosEncontrados?.preco ?? 0).toFixed(2)}`
                                : "-"}
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{renderStatus(produto.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {(produto.status === "encontrado" || produto.status === "extraido") && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleEdicao(produto.id)}
                                title={produto.editando ? "Salvar" : "Editar"}
                              >
                                {produto.editando ? (
                                  <Save className="h-4 w-4" />
                                ) : (
                                  <Edit2 className="h-4 w-4" />
                                )}
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removerProduto(produto.id)}
                              title="Remover"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {/* Botao de voltar */}
          <div className="flex justify-start">
            <Button
              variant="outline"
              onClick={() => {
                setEtapa("entrada");
                setProdutos([]);
                setProgresso(0);
              }}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar e Recomecar
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

