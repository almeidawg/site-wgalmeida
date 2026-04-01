// ============================================================
// COMPONENTE: WGStoreSection
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// SeçÍo da WG Store - Catálogo de produtos
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { formatarMoeda } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  ShoppingCart,
  Search,
  Filter,
  Grid3X3,
  List,
  Image as ImageIcon,
  Globe,
  Loader2,
  ChevronRight
} from "lucide-react";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  imagem?: string;
  preco?: number;
}

interface WGStoreSectionProps {
  clienteId: string;
  contratoId?: string;
  limite?: number;
}

export default function WGStoreSection({ clienteId: _clienteId, contratoId: _contratoId, limite = 8 }: WGStoreSectionProps) {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [visualizacao, setVisualizacao] = useState<"grid" | "lista">("grid");
  const totalImagens = 204;

  const carregarProdutos = useCallback(async () => {
    try {
      setLoading(true);

      // Buscar produtos do catálogo
      const { data, error } = await supabase
        .from("catalogo_produtos")
        .select("*")
        .limit(limite)
        .order("nome", { ascending: true });

      if (error || !data || data.length === 0) {
        // Dados de exemplo
        setProdutos([]);
        return;
      }

      setProdutos(data);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }, [limite]);

  useEffect(() => {
    carregarProdutos();
  }, [carregarProdutos]);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-wg-primary/10 rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-wg-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">WG Store</CardTitle>
              <p className="text-sm text-gray-500">Catálogo de produtos do Grupo WG Almeida</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/wgx/store')}
              className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
            >
              <ImageIcon className="w-4 h-4" />
              Importar Imagens ({totalImagens})
            </button>
            <button
              onClick={() => navigate('/wgx/store')}
              className="flex items-center gap-2 px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 transition-colors text-sm font-medium"
            >
              <Globe className="w-4 h-4" />
              Importar da Internet
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4">
        {/* Barra de busca e filtros */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-wg-primary focus:border-transparent text-sm"
            />
          </div>

          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-wg-primary"
          >
            <option value="todas">Todas categorias</option>
            <option value="moveis">Móveis</option>
            <option value="iluminacao">IluminaçÍo</option>
            <option value="acabamentos">Acabamentos</option>
            <option value="decoracao">DecoraçÍo</option>
          </select>

          <select
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 focus:ring-2 focus:ring-wg-primary"
          >
            <option value="nome-az">Nome A-Z</option>
            <option value="nome-za">Nome Z-A</option>
            <option value="preco-menor">Menor preço</option>
            <option value="preco-maior">Maior preço</option>
          </select>

          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => setVisualizacao("grid")}
              className={`p-2 ${visualizacao === "grid" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <Grid3X3 className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setVisualizacao("lista")}
              className={`p-2 ${visualizacao === "lista" ? "bg-gray-100" : "hover:bg-gray-50"}`}
            >
              <List className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
            <Filter className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Grid de produtos ou mensagem vazia */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando produtos...</span>
          </div>
        ) : produtos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-xl">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-normal text-gray-600">Catálogo em construçÍo</h3>
            <p className="text-sm text-gray-400 mt-2">
              Os produtos do seu projeto aparecerÍo aqui em breve
            </p>
            <button
              onClick={() => navigate('/wgx/store')}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-wg-primary text-white rounded-lg hover:bg-wg-primary/90 transition-colors text-sm font-medium"
            >
              Acessar WG Store
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className={`grid ${visualizacao === "grid" ? "grid-cols-2 md:grid-cols-4 gap-4" : "grid-cols-1 gap-2"}`}>
            {produtos.map((produto) => (
              <div
                key={produto.id}
                className={`bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${
                  visualizacao === "lista" ? "flex items-center p-3" : ""
                }`}
              >
                {visualizacao === "grid" ? (
                  <>
                    <div className="aspect-square bg-gray-100">
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-medium text-gray-900 text-sm truncate">{produto.nome}</p>
                      <p className="text-xs text-gray-500">{produto.categoria}</p>
                      {produto.preco && (
                        <p className="text-sm font-normal text-wg-primary mt-1">
                          {formatarMoeda(produto.preco)}
                        </p>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex-shrink-0">
                      {produto.imagem ? (
                        <img
                          src={produto.imagem}
                          alt={produto.nome}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 ml-3">
                      <p className="font-medium text-gray-900">{produto.nome}</p>
                      <p className="text-sm text-gray-500">{produto.categoria}</p>
                    </div>
                    {produto.preco && (
                      <p className="font-normal text-wg-primary">
                        {formatarMoeda(produto.preco)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

