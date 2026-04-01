// ============================================================
// PÁGINA: Importar Produto
// ImportaçÍo de produtos de sites externos
// ============================================================

import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import {
  importarProdutoPorLink,
  validarUrlProduto,
  formatarPreco,
  type ProdutoImportado,
} from "@/lib/importadorProdutos";
import { adicionarItemImportado } from "@/lib/comprasApiNova";
import StarRating from "@/components/StarRating";

export default function ImportarProdutoPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get("pedido_id");

  const [url, setUrl] = useState("");
  const [importando, setImportando] = useState(false);
  const [produto, setProduto] = useState<ProdutoImportado | null>(null);
  const [erro, setErro] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  const handleImportar = async () => {
    setErro("");
    setProduto(null);

    if (!url.trim()) {
      setErro("Por favor, informe a URL do produto");
      return;
    }

    if (!validarUrlProduto(url)) {
      setErro("URL inválida ou site nÍo suportado. Sites suportados: Leroy Merlin, Amazon, Mercado Livre");
      return;
    }

    setImportando(true);

    try {
      const produtoImportado = await importarProdutoPorLink(url);
      setProduto(produtoImportado);
      setErro("");
    } catch (error: any) {
      setErro(error.message || "Erro ao importar produto");
      setProduto(null);
    } finally {
      setImportando(false);
    }
  };

  const handleSalvar = async () => {
    if (!produto || !pedidoId) return;

    setSalvando(true);

    try {
      await adicionarItemImportado(pedidoId, produto, quantidade);
      setSucesso(true);

      // Redirecionar após 1 segundo
      setTimeout(() => {
        navigate(`/compras/editar/${pedidoId}`);
      }, 1000);

    } catch (error: any) {
      setErro(error.message || "Erro ao salvar produto");
    } finally {
      setSalvando(false);
    }
  };

  const handleNovo = () => {
    setUrl("");
    setProduto(null);
    setErro("");
    setSucesso(false);
    setQuantidade(1);
  };

  return (
    <div className="min-h-screen bg-[#F3F3F3] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(pedidoId ? `/compras/editar/${pedidoId}` : '/compras')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-[#1A1A1A]" />
          </button>

          <div className="flex-1">
            <h1 className="text-[18px] sm:text-[24px] font-normal text-[#1A1A1A]">
              Importar Produto
            </h1>
            <p className="text-[12px] text-gray-600 mt-1">
              Cole o link do produto de sites como Leroy Merlin, Amazon ou Mercado Livre
            </p>
          </div>
        </div>

        {/* Formulário de ImportaçÍo */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="mb-4">
            <label className="block text-[14px] font-medium text-[#1A1A1A] mb-2">
              URL do Produto
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleImportar()}
                placeholder="https://www.leroymerlin.com.br/produto/..."
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                disabled={importando}
              />
              <button
                onClick={handleImportar}
                disabled={importando}
                className="px-6 py-3 text-[14px] bg-[#C9A86A] text-white rounded-lg hover:bg-[#B8985A] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {importando ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download size={20} />
                    Importar
                  </>
                )}
              </button>
            </div>

            {/* Sites Suportados */}
            <div className="mt-3 text-xs text-gray-500">
              Sites suportados: Leroy Merlin, Amazon, Mercado Livre, Magazine Luiza, Casas Bahia
            </div>
          </div>

          {/* Mensagens de Erro/Sucesso */}
          {erro && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-red-900">Erro</div>
                <div className="text-sm text-red-700 mt-1">{erro}</div>
              </div>
            </div>
          )}

          {sucesso && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
              <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-medium text-green-900">Produto adicionado com sucesso!</div>
                <div className="text-sm text-green-700 mt-1">Redirecionando...</div>
              </div>
            </div>
          )}
        </div>

        {/* Preview do Produto */}
        {produto && !sucesso && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-[16px] font-normal text-[#1A1A1A] mb-4">
              Preview do Produto
            </h2>

            <div className="flex gap-6">
              {/* Imagem */}
              <div className="flex-shrink-0">
                {produto.imagem_url ? (
                  <img
                    src={produto.imagem_url}
                    alt={produto.titulo}
                    className="w-32 h-32 object-cover rounded-lg border border-gray-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-32 h-32 bg-[#F3F3F3] rounded-lg flex items-center justify-center text-gray-400 text-4xl">
                    📦
                  </div>
                )}
              </div>

              {/* Informações */}
              <div className="flex-1">
                <h3 className="text-base font-normal text-[#1A1A1A] mb-2">
                  {produto.titulo}
                </h3>

                {produto.sku && (
                  <div className="text-sm text-gray-600 mb-2">
                    SKU: {produto.sku}
                  </div>
                )}

                <div className="text-[20px] font-normal text-[#C9A86A] mb-2">
                  {formatarPreco(produto.preco)}
                </div>

                {/* AvaliaçÍo */}
                {produto.avaliacao && produto.avaliacao > 0 && (
                  <div className="mb-4">
                    <StarRating
                      rating={produto.avaliacao}
                      totalReviews={produto.total_avaliacoes}
                      size="md"
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-[#1A1A1A] mb-2">
                    Quantidade
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={quantidade}
                    onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C9A86A] focus:border-transparent"
                  />
                </div>

                <div className="text-sm text-gray-600 mb-4">
                  Total: {formatarPreco(produto.preco * quantidade)}
                </div>

                {/* Botões de AçÍo */}
                <div className="flex gap-3">
                  {pedidoId && (
                    <button
                      onClick={handleSalvar}
                      disabled={salvando}
                      className="px-6 py-3 text-[14px] bg-[#C9A86A] text-white rounded-lg hover:bg-[#B8985A] transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {salvando ? 'Salvando...' : 'Adicionar ao Pedido'}
                    </button>
                  )}

                  <button
                    onClick={handleNovo}
                    className="px-6 py-3 text-[14px] bg-white text-[#1A1A1A] border border-gray-300 rounded-lg hover:bg-gray-50 transition-all"
                  >
                    Importar Outro
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

