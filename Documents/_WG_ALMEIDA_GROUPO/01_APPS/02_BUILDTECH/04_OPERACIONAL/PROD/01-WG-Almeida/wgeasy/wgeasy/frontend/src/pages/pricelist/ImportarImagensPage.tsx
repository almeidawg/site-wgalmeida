// ========================================
// PAGINA DE IMPORTACAO DE IMAGENS PRICELIST
// Busca automatica de imagens para produtos sem imagem
// ========================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Image,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  ArrowLeft,
  Play,
  Pause,
  ImageOff,
  ExternalLink,
  AlertCircle,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  buscarProdutosSemImagem,
  buscarImagemProduto,
  atualizarImagemProduto,
  type ProdutoSemImagem,
} from "@/lib/importarImagensPricelist";
import { listarCategorias, type PricelistCategoria } from "@/lib/pricelistApi";

type Etapa = "lista" | "buscando" | "concluido";

interface ProdutoComStatus extends ProdutoSemImagem {
  status: "pendente" | "buscando" | "encontrado" | "nao_encontrado" | "erro";
  imagem_url?: string;
  descricao_encontrada?: string;
  link_encontrado?: string;
  selecionado: boolean;
}

export default function ImportarImagensPage() {
  const navigate = useNavigate();
  const [etapa, setEtapa] = useState<Etapa>("lista");
  const [loading, setLoading] = useState(true);
  const [produtos, setProdutos] = useState<ProdutoComStatus[]>([]);
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("todas");
  const [busca, setBusca] = useState("");
  const [totalSemImagem, setTotalSemImagem] = useState(0);

  // Controle da busca em lote
  const [buscandoEmLote, setBuscandoEmLote] = useState(false);
  const [pausado, setPausado] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [iÍndiceAtual, setIÍndiceAtual] = useState(0);

  // Estatisticas
  const estatisticas = {
    total: produtos.length,
    pendentes: produtos.filter((p) => p.status === "pendente").length,
    encontrados: produtos.filter((p) => p.status === "encontrado").length,
    naoEncontrados: produtos.filter((p) => p.status === "nao_encontrado").length,
    erros: produtos.filter((p) => p.status === "erro").length,
    selecionados: produtos.filter((p) => p.selecionado).length,
    comDescricao: produtos.filter((p) => p.descricao_encontrada).length,
  };

  // Carregar dados iniciais
  const carregarDados = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriasData, produtosData] = await Promise.all([
        listarCategorias(),
        buscarProdutosSemImagem(
          200,
          0,
          filtroCategoria !== "todas" ? filtroCategoria : undefined
        ),
      ]);

      setCategorias(categoriasData);
      setTotalSemImagem(produtosData.total);

      const produtosComStatus: ProdutoComStatus[] = produtosData.produtos.map(
        (p) => ({
          ...p,
          status: "pendente",
          selecionado: true,
        })
      );

      setProdutos(produtosComStatus);
    } catch (error: unknown) {
      console.error("Erro ao carregar dados:", error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setLoading(false);
    }
  }, [filtroCategoria]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // Buscar imagem para um produto individual
  async function buscarImagemIndividual(produtoId: string) {
    const produto = produtos.find((p) => p.id === produtoId);
    if (!produto) return;

    // Atualizar status para buscando
    setProdutos((prev) =>
      prev.map((p) => (p.id === produtoId ? { ...p, status: "buscando" } : p))
    );

    try {
      const resultado = await buscarImagemProduto(produto);

      setProdutos((prev) =>
        prev.map((p) => {
          if (p.id === produtoId) {
            if (resultado.sucesso && resultado.imagem_url) {
              return {
                ...p,
                status: "encontrado",
                imagem_url: resultado.imagem_url,
                descricao_encontrada: resultado.descricao || undefined,
                link_encontrado: resultado.link_produto || undefined,
              };
            } else {
              return { ...p, status: "nao_encontrado" };
            }
          }
          return p;
        })
      );

      if (resultado.sucesso) {
        const msg = resultado.descricao
          ? `Imagem e descriçÍo encontradas para ${produto.nome}`
          : `Imagem encontrada para ${produto.nome}`;
        toast.success(msg);
      } else {
        toast.info(`Imagem nao encontrada para ${produto.nome}`);
      }
    } catch (error: unknown) {
      setProdutos((prev) =>
        prev.map((p) => (p.id === produtoId ? { ...p, status: "erro" } : p))
      );
      toast.error("Erro ao buscar imagem");
      console.error("Erro ao buscar imagem individual:", error);
    }
  }

  // Buscar imagens em lote
  async function iniciarBuscaEmLote() {
    const produtosSelecionados = produtos.filter(
      (p) => p.selecionado && p.status === "pendente"
    );

    if (produtosSelecionados.length === 0) {
      toast.warning("Nenhum produto selecionado para buscar");
      return;
    }

    setEtapa("buscando");
    setBuscandoEmLote(true);
    setPausado(false);
    setProgresso(0);
    setIÍndiceAtual(0);

    for (let i = 0; i < produtosSelecionados.length; i++) {
      // Verificar se foi pausado
      if (pausado) {
        setIÍndiceAtual(i);
        break;
      }

      const produto = produtosSelecionados[i];

      // Atualizar status para buscando
      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, status: "buscando" } : p))
      );

      try {
        const resultado = await buscarImagemProduto(produto);

        setProdutos((prev) =>
          prev.map((p) => {
            if (p.id === produto.id) {
              if (resultado.sucesso && resultado.imagem_url) {
                // Atualiza no banco automaticamente (com descriçÍo e link se disponíveis)
                atualizarImagemProduto(
                  produto.id,
                  resultado.imagem_url,
                  resultado.descricao,
                  resultado.link_produto
                );
                return {
                  ...p,
                  status: "encontrado",
                  imagem_url: resultado.imagem_url,
                  descricao_encontrada: resultado.descricao || undefined,
                  link_encontrado: resultado.link_produto || undefined,
                };
              } else {
                return { ...p, status: "nao_encontrado" };
              }
            }
            return p;
          })
        );
      } catch (error: unknown) {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === produto.id ? { ...p, status: "erro" } : p
          )
        );
        console.error("Erro ao buscar imagem em lote:", error);
      }

      // Atualizar progresso
      const novoProgresso = Math.round(((i + 1) / produtosSelecionados.length) * 100);
      setProgresso(novoProgresso);
      setIÍndiceAtual(i + 1);

      // Delay entre requisicoes (1.5 segundos)
      if (i < produtosSelecionados.length - 1 && !pausado) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    setBuscandoEmLote(false);
    if (!pausado) {
      setEtapa("concluido");
      toast.success("Busca de imagens concluida!");
    }
  }

  // Continuar busca pausada
  async function continuarBusca() {
    setPausado(false);
    const produtosSelecionados = produtos.filter(
      (p) => p.selecionado && p.status === "pendente"
    );

    for (let i = iÍndiceAtual; i < produtosSelecionados.length; i++) {
      if (pausado) {
        setIÍndiceAtual(i);
        break;
      }

      const produto = produtosSelecionados[i];

      setProdutos((prev) =>
        prev.map((p) => (p.id === produto.id ? { ...p, status: "buscando" } : p))
      );

      try {
        const resultado = await buscarImagemProduto(produto);

        setProdutos((prev) =>
          prev.map((p) => {
            if (p.id === produto.id) {
              if (resultado.sucesso && resultado.imagem_url) {
                atualizarImagemProduto(
                  produto.id,
                  resultado.imagem_url,
                  resultado.descricao,
                  resultado.link_produto
                );
                return {
                  ...p,
                  status: "encontrado",
                  imagem_url: resultado.imagem_url,
                  descricao_encontrada: resultado.descricao || undefined,
                  link_encontrado: resultado.link_produto || undefined,
                };
              } else {
                return { ...p, status: "nao_encontrado" };
              }
            }
            return p;
          })
        );
      } catch (error: unknown) {
        setProdutos((prev) =>
          prev.map((p) =>
            p.id === produto.id ? { ...p, status: "erro" } : p
          )
        );
        console.error("Erro ao continuar busca de imagens:", error);
      }

      const novoProgresso = Math.round(((i + 1) / produtosSelecionados.length) * 100);
      setProgresso(novoProgresso);
      setIÍndiceAtual(i + 1);

      if (i < produtosSelecionados.length - 1 && !pausado) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }
    }

    if (!pausado) {
      setBuscandoEmLote(false);
      setEtapa("concluido");
      toast.success("Busca de imagens concluida!");
    }
  }

  // Pausar busca
  function pausarBusca() {
    setPausado(true);
    toast.info("Busca pausada");
  }

  // Selecionar/Deselecionar todos
  function toggleSelecionarTodos(checked: boolean) {
    setProdutos((prev) =>
      prev.map((p) => ({
        ...p,
        selecionado: p.status === "pendente" ? checked : p.selecionado,
      }))
    );
  }

  // Filtrar produtos pela busca
  const produtosFiltrados = produtos.filter((p) =>
    normalizeSearchTerm(p.nome).includes(normalizeSearchTerm(busca))
  );

  // Renderizar badge de status
  function renderStatus(status: ProdutoComStatus["status"]) {
    switch (status) {
      case "pendente":
        return (
          <Badge variant="outline" className="text-gray-500">
            Pendente
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
      case "nao_encontrado":
        return (
          <Badge className="bg-yellow-100 text-yellow-700">
            <ImageOff className="h-3 w-3 mr-1" />
            Nao encontrado
          </Badge>
        );
      case "erro":
        return (
          <Badge className="bg-red-100 text-red-700">
            <XCircle className="h-3 w-3 mr-1" />
            Erro
          </Badge>
        );
    }
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/pricelist")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-normal text-gray-800">
              Importar Imagens
            </h1>
            <p className="text-gray-500">
              Busca automatica de imagens para produtos do catalogo
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={carregarDados} disabled={loading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Atualizar Lista
          </Button>
        </div>
      </div>

      {/* Cards de estatisticas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-normal text-gray-800">
              {totalSemImagem}
            </div>
            <p className="text-sm text-gray-500">Total sem imagem</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-normal text-blue-600">
              {estatisticas.pendentes}
            </div>
            <p className="text-sm text-gray-500">Pendentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-normal text-green-600">
              {estatisticas.encontrados}
            </div>
            <p className="text-sm text-gray-500">Imagens encontradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-normal text-yellow-600">
              {estatisticas.naoEncontrados}
            </div>
            <p className="text-sm text-gray-500">Nao encontradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-normal text-orange-600">
              {estatisticas.selecionados}
            </div>
            <p className="text-sm text-gray-500">Selecionados</p>
          </CardContent>
        </Card>
      </div>

      {/* Progresso da busca em lote */}
      {(etapa === "buscando" || etapa === "concluido") && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-normal">Progresso da Busca</h3>
                <p className="text-sm text-gray-500">
                  {iÍndiceAtual} de {estatisticas.selecionados} produtos
                  processados
                </p>
              </div>
              <div className="flex items-center gap-2">
                {buscandoEmLote && !pausado && (
                  <Button variant="outline" onClick={pausarBusca}>
                    <Pause className="h-4 w-4 mr-2" />
                    Pausar
                  </Button>
                )}
                {pausado && (
                  <Button onClick={continuarBusca}>
                    <Play className="h-4 w-4 mr-2" />
                    Continuar
                  </Button>
                )}
                {etapa === "concluido" && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-4 w-4 mr-1" />
                    Concluido
                  </Badge>
                )}
              </div>
            </div>
            <Progress value={progresso} className="h-3" />
            <div className="grid grid-cols-4 gap-4 text-center text-sm">
              <div>
                <span className="font-normal text-green-600">
                  {estatisticas.encontrados}
                </span>{" "}
                imagens
              </div>
              <div>
                <span className="font-normal text-blue-600">
                  {estatisticas.comDescricao}
                </span>{" "}
                descricoes
              </div>
              <div>
                <span className="font-normal text-yellow-600">
                  {estatisticas.naoEncontrados}
                </span>{" "}
                nao encontradas
              </div>
              <div>
                <span className="font-normal text-red-600">
                  {estatisticas.erros}
                </span>{" "}
                erros
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros e acoes */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select
              value={filtroCategoria}
              onValueChange={setFiltroCategoria}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categorias.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={iniciarBuscaEmLote}
              disabled={
                buscandoEmLote || estatisticas.selecionados === 0 || loading
              }
              className="bg-primary hover:bg-[#D94E1F]"
            >
              {buscandoEmLote ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  Buscar Imagens ({estatisticas.selecionados})
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Aviso sobre a busca */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Como funciona a busca de imagens e descricoes:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>
                  Busca automatica na <strong>Leroy Merlin</strong> para encontrar
                  imagens e descricoes dos produtos
                </li>
                <li>
                  Se o produto tiver um link cadastrado, os dados serao extraidos
                  diretamente
                </li>
                <li>
                  A busca e feita de forma sequencial com intervalo de 1.5s para
                  evitar bloqueios
                </li>
                <li>
                  Voce pode pausar e continuar a busca a qualquer momento
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de produtos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Produtos sem Imagem</span>
            <div className="flex items-center gap-2">
              <Checkbox
                id="selecionar-todos"
                checked={
                  produtosFiltrados.filter((p) => p.status === "pendente")
                    .length > 0 &&
                  produtosFiltrados
                    .filter((p) => p.status === "pendente")
                    .every((p) => p.selecionado)
                }
                onCheckedChange={(checked) =>
                  toggleSelecionarTodos(checked as boolean)
                }
              />
              <label
                htmlFor="selecionar-todos"
                className="text-sm font-normal"
              >
                Selecionar todos
              </label>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#F25C26]" />
            </div>
          ) : produtosFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-lg font-medium">
                Todos os produtos possuem imagem!
              </p>
              <p className="text-sm">
                Nao ha produtos pendentes para buscar imagens.
              </p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead className="w-20">Imagem</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-16">Desc.</TableHead>
                    <TableHead className="w-20">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {produtosFiltrados.slice(0, 50).map((produto) => (
                    <TableRow key={produto.id}>
                      <TableCell>
                        <Checkbox
                          checked={produto.selecionado}
                          disabled={produto.status !== "pendente"}
                          onCheckedChange={(checked) => {
                            setProdutos((prev) =>
                              prev.map((p) =>
                                p.id === produto.id
                                  ? { ...p, selecionado: checked as boolean }
                                  : p
                              )
                            );
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {produto.imagem_url ? (
                          <img
                            src={produto.imagem_url}
                            alt={produto.nome}
                            className="w-12 h-12 object-cover rounded border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%239ca3af' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect width='18' height='18' x='3' y='3' rx='2' ry='2'/%3E%3Ccircle cx='9' cy='9' r='2'/%3E%3Cpath d='m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21'/%3E%3C/svg%3E";
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                            <ImageOff className="h-5 w-5 text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="font-medium truncate" title={produto.nome}>
                            {produto.nome}
                          </p>
                          {produto.codigo && (
                            <p className="text-xs text-gray-500">
                              {produto.codigo}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {produto.categoria_nome || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {produto.fabricante || "-"}
                        </span>
                      </TableCell>
                      <TableCell>{renderStatus(produto.status)}</TableCell>
                      <TableCell>
                        {produto.descricao_encontrada ? (
                          <div
                            className="flex items-center gap-1 text-green-600 cursor-help"
                            title={produto.descricao_encontrada}
                          >
                            <FileText className="h-4 w-4" />
                            <span className="text-xs">Sim</span>
                          </div>
                        ) : produto.status === "encontrado" ? (
                          <span className="text-xs text-gray-400">-</span>
                        ) : null}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {produto.status === "pendente" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => buscarImagemIndividual(produto.id)}
                              title="Buscar imagem"
                            >
                              <Search className="h-4 w-4" />
                            </Button>
                          )}
                          {produto.link_produto && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                window.open(produto.link_produto, "_blank")
                              }
                              title="Abrir link do produto"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {produtosFiltrados.length > 50 && (
                <div className="p-4 text-center text-sm text-gray-500 border-t">
                  Mostrando 50 de {produtosFiltrados.length} produtos.
                  Use a busca para filtrar.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

