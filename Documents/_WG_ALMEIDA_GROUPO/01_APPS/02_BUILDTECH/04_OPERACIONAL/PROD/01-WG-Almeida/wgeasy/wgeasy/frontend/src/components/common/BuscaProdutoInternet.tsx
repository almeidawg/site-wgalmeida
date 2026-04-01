// ==========================================
// BUSCA PRODUTO NA INTERNET
// Componente reutilizável para importar produtos
// Sistema WG Easy - Grupo WG Almeida
// ==========================================

import { useState } from "react";
import { Globe, Search, Download, Package, X, ExternalLink, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  importarProdutoPorLink,
  validarUrlProduto,
  buscarProdutoNaInternet,
  formatarPreco,
  type ProdutoImportado,
} from "@/lib/importadorProdutos";

interface BuscaProdutoInternetProps {
  onProdutoSelecionado: (produto: ProdutoImportado) => void;
  onClose?: () => void;
  titulo?: string;
  subtitulo?: string;
  mostrarBotaoFechar?: boolean;
}

type TabAtiva = "url" | "busca";

export default function BuscaProdutoInternet({
  onProdutoSelecionado,
  onClose,
  titulo = "Buscar Produto na Internet",
  subtitulo = "Cole um link ou busque por nome usando IA",
  mostrarBotaoFechar = false,
}: BuscaProdutoInternetProps) {
  // Estados
  const [tabAtiva, setTabAtiva] = useState<TabAtiva>("url");
  const [urlProduto, setUrlProduto] = useState("");
  const [termoBuscaInternet, setTermoBuscaInternet] = useState("");
  const [importando, setImportando] = useState(false);
  const [buscandoInternet, setBuscandoInternet] = useState(false);
  const [produtoImportado, setProdutoImportado] = useState<ProdutoImportado | null>(null);
  const [resultadosBusca, setResultadosBusca] = useState<ProdutoImportado[]>([]);
  const [erroImportacao, setErroImportacao] = useState("");

  // Importar produto por URL
  async function handleImportarProduto() {
    setErroImportacao("");
    setProdutoImportado(null);

    if (!urlProduto.trim()) {
      setErroImportacao("Digite a URL do produto");
      return;
    }

    if (!validarUrlProduto(urlProduto)) {
      setErroImportacao("URL inválida ou site não suportado");
      return;
    }

    try {
      setImportando(true);
      const produto = await importarProdutoPorLink(urlProduto);
      setProdutoImportado(produto);
      setErroImportacao("");
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao importar produto";
      setErroImportacao(mensagem);
      setProdutoImportado(null);
    } finally {
      setImportando(false);
    }
  }

  // Buscar produto por texto usando IA
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
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : "Erro ao buscar produtos";
      setErroImportacao(mensagem);
    } finally {
      setBuscandoInternet(false);
    }
  }

  // Selecionar resultado da busca
  function selecionarResultadoBusca(produto: ProdutoImportado) {
    setProdutoImportado(produto);
    setResultadosBusca([]);
  }

  // Confirmar seleçÍo do produto
  function confirmarSelecao() {
    if (produtoImportado) {
      onProdutoSelecionado(produtoImportado);
      limparImportacao();
    }
  }

  // Limpar importaçÍo
  function limparImportacao() {
    setUrlProduto("");
    setProdutoImportado(null);
    setErroImportacao("");
    setResultadosBusca([]);
    setTermoBuscaInternet("");
  }

  // Sites suportados
  const sitesSuportados = [
    "Leroy Merlin",
    "Amazon",
    "Mercado Livre",
    "Magazine Luiza",
    "Casas Bahia",
    "+ outros",
  ];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow p-5 border-2 border-blue-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
            <Globe className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-normal text-gray-900 uppercase tracking-wide">
              {titulo}
            </h3>
            <p className="text-xs text-gray-600">{subtitulo}</p>
          </div>
        </div>
        {mostrarBotaoFechar && onClose && (
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {/* Tabs */}
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          <button
            type="button"
            onClick={() => {
              setTabAtiva("url");
              setResultadosBusca([]);
              setTermoBuscaInternet("");
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tabAtiva === "url"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Por URL
          </button>
          <button
            type="button"
            onClick={() => {
              setTabAtiva("busca");
              setUrlProduto("");
              setProdutoImportado(null);
            }}
            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition ${
              tabAtiva === "busca"
                ? "bg-blue-100 text-blue-700"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Buscar por Nome (IA)
          </button>
        </div>

        {/* Tab: URL */}
        {tabAtiva === "url" && (
          <div className="flex gap-2">
            <Input
              type="url"
              value={urlProduto}
              onChange={(e) => setUrlProduto(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleImportarProduto()}
              placeholder="https://www.leroymerlin.com.br/produto/..."
              className="flex-1"
              disabled={importando}
            />
            <Button
              onClick={handleImportarProduto}
              disabled={importando || !urlProduto.trim()}
              className="bg-wg-primary hover:bg-wg-primary/90"
            >
              {importando ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Importar
                </>
              )}
            </Button>
          </div>
        )}

        {/* Tab: Busca por Nome */}
        {tabAtiva === "busca" && (
          <div className="flex gap-2">
            <Input
              type="text"
              value={termoBuscaInternet}
              onChange={(e) => setTermoBuscaInternet(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleBuscarNaInternet()}
              placeholder="Ex: Piso porcelanato 60x60 bege"
              className="flex-1"
              disabled={buscandoInternet}
            />
            <Button
              onClick={handleBuscarNaInternet}
              disabled={buscandoInternet || !termoBuscaInternet.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {buscandoInternet ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4 mr-2" />
                  Buscar com IA
                </>
              )}
            </Button>
          </div>
        )}

        {/* Resultados da Busca */}
        {resultadosBusca.length > 0 && (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            <p className="text-sm font-medium text-gray-700">
              Resultados encontrados ({resultadosBusca.length}):
            </p>
            {resultadosBusca.map((produto, index) => (
              <button
                key={index}
                type="button"
                onClick={() => selecionarResultadoBusca(produto)}
                className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition text-left flex items-start gap-3"
              >
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.titulo}
                    className="w-16 h-16 object-cover rounded border border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center flex-shrink-0">
                    <Package className="w-8 h-8 text-gray-300" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 text-sm line-clamp-2">
                    {produto.titulo}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-600">
                      {produto.marca || "Sem marca"}
                    </span>
                    <span className="text-sm font-normal text-green-600">
                      {formatarPreco(produto.preco)}
                    </span>
                  </div>
                  {produto.url_origem && (
                    <span className="text-xs text-blue-500 truncate block mt-1">
                      {new URL(produto.url_origem).hostname.replace("www.", "")}
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
          {sitesSuportados.map((site) => (
            <Badge key={site} variant="default" className="text-xs">
              {site}
            </Badge>
          ))}
        </div>

        {/* Erro */}
        {erroImportacao && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
            <X className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
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
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Package className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <div className="flex-1">
                <p className="font-normal text-gray-900 mb-1 line-clamp-2">
                  {produtoImportado.titulo}
                </p>
                {produtoImportado.sku && (
                  <p className="text-xs text-gray-600 mb-1">
                    SKU: {produtoImportado.sku}
                  </p>
                )}
                {produtoImportado.marca && (
                  <Badge variant="outline" className="text-xs mb-2">
                    {produtoImportado.marca}
                  </Badge>
                )}
                <p className="text-2xl font-normal text-green-600">
                  {formatarPreco(produtoImportado.preco)}
                </p>
                {produtoImportado.url_origem && (
                  <a
                    href={produtoImportado.url_origem}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline mt-1 inline-flex items-center gap-1"
                  >
                    Ver produto original
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-200">
              <div className="flex items-center gap-2 text-green-700">
                <Check className="w-5 h-5" />
                <span className="text-sm font-medium">Produto importado!</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={limparImportacao}>
                  Limpar
                </Button>
                <Button
                  size="sm"
                  onClick={confirmarSelecao}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Check className="w-4 h-4 mr-1" />
                  Usar Produto
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


