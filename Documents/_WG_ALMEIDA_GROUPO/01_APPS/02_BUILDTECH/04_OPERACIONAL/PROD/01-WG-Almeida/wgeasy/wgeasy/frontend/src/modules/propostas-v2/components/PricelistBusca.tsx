// ============================================================
// PricelistBusca - Busca no pricelist (coluna central)
// Sistema WG Easy - Grupo WG Almeida
// Com menus de categorias recolhíveis e imagens circulares
// ============================================================

import { useState, useMemo, useEffect } from "react";
import { Search, Plus, Package, Loader2, Sparkles, ChevronDown, ChevronRight, Image as ImageIcon, LayoutGrid, List } from "lucide-react";
import Badge from "@/components/ui/badge";
import type { ItemPricelist, FiltrosPricelist, Ambiente, TipoItem, SugestaoIA } from "../types";
import { formatarMoeda } from "@/lib/utils";
import { TYPOGRAPHY } from "@/constants/typography";
import { listarCategorias, type PricelistCategoria } from "@/lib/pricelistApi";

interface PricelistBuscaProps {
  itens: ItemPricelist[];
  todosItens?: ItemPricelist[]; // Todos os itens do pricelist (para categorias)
  loading: boolean;
  filtros: FiltrosPricelist;
  ambientes: Ambiente[];
  sugestoes: SugestaoIA[];
  onBuscar: (termo: string) => void;
  onFiltrar: (filtros: FiltrosPricelist) => void;
  onAdicionar: (item: ItemPricelist, ambienteId?: string) => void;
  onCriarNovo: () => void;
}

function getBadgeVariant(tipo: TipoItem) {
  switch (tipo) {
    case "material": return "info";
    case "mao_obra": return "success";
    case "servico": return "warning";
    case "produto": return "primary";
    default: return "default";
  }
}

function getTipoLabel(tipo: TipoItem) {
  switch (tipo) {
    case "material": return "Mat";
    case "mao_obra": return "MO";
    case "servico": return "Serv";
    case "produto": return "Prod";
    case "ambos": return "M+MO";
    default: return tipo;
  }
}

// Componente de imagem circular
function ItemImage({ url, nome }: { url?: string | null; nome: string }) {
  const [hasError, setHasError] = useState(false);

  if (!url || hasError) {
    return (
      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
        <ImageIcon className="w-4 h-4 text-gray-400" />
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={nome}
      className="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200"
      onError={() => setHasError(true)}
    />
  );
}

// Componente de categoria expandível
interface CategoriaExpandivelProps {
  categoria: string;
  itens: ItemPricelist[];
  ambienteSelecionado: string;
  onAdicionar: (item: ItemPricelist, ambienteId?: string) => void;
}

function CategoriaExpandivel({ categoria, itens, ambienteSelecionado, onAdicionar }: CategoriaExpandivelProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-3 py-2 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          {expandido ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <span className={TYPOGRAPHY.cardTitle}>{categoria}</span>
          <span className={`px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full ${TYPOGRAPHY.caption}`}>
            {itens.length}
          </span>
        </div>
      </button>

      {expandido && (
        <div className="p-2 space-y-1.5 bg-white">
          {itens.map((item) => (
            <div
              key={item.id}
              className="p-2 border border-gray-100 rounded-lg hover:border-blue-300 hover:bg-blue-50/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ItemImage url={item.imagem_url} nome={item.nome} />
                <div className="flex-1 min-w-0">
                  <p className={`${TYPOGRAPHY.cardTitle} truncate`}>{item.nome}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant={getBadgeVariant(item.tipo) as any} size="sm" className="text-[8px] px-1 py-0">
                      {getTipoLabel(item.tipo)}
                    </Badge>
                    <span className={TYPOGRAPHY.caption}>{formatarMoeda(item.preco)}/{item.unidade}</span>
                  </div>
                </div>
                <button
                  onClick={() => onAdicionar(item, ambienteSelecionado || undefined)}
                  className="p-1 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors flex-shrink-0"
                  title="Adicionar à proposta"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PricelistBusca({
  itens,
  todosItens,
  loading,
  filtros,
  ambientes,
  sugestoes,
  onBuscar,
  onFiltrar,
  onAdicionar,
  onCriarNovo,
}: PricelistBuscaProps) {
  const [ambienteSelecionado, setAmbienteSelecionado] = useState<string>("");
  const [modoVisualizacao, setModoVisualizacao] = useState<"blocos" | "lista">("blocos");
  const [categoriasDb, setCategoriasDb] = useState<PricelistCategoria[]>([]);
  const [loadingCategorias, setLoadingCategorias] = useState(true);

  // Carregar categorias do banco de dados
  useEffect(() => {
    async function carregarCategorias() {
      try {
        setLoadingCategorias(true);
        const cats = await listarCategorias();
        setCategoriasDb(cats.filter(c => c.ativo));
      } catch (error) {
        console.error("Erro ao carregar categorias:", error);
      } finally {
        setLoadingCategorias(false);
      }
    }
    carregarCategorias();
  }, []);

  const handleAdicionar = (item: ItemPricelist, ambienteId?: string) => {
    onAdicionar(item, ambienteId || ambienteSelecionado || undefined);
  };

  // Usar todos os itens para agrupar por categoria (não apenas os filtrados)
  const itensParaCategorias = todosItens || itens;

  // Agrupar itens por categoria_id (usando categorias do DB)
  const itensPorCategoriaDb = useMemo(() => {
    const grupos: Record<string, ItemPricelist[]> = {};

    itensParaCategorias.forEach((item) => {
      const catId = item.categoria_id || "sem_categoria";
      if (!grupos[catId]) {
        grupos[catId] = [];
      }
      // Aplicar filtro de tipo se selecionado
      if (!filtros.tipo || item.tipo === filtros.tipo) {
        grupos[catId].push(item);
      }
    });

    return grupos;
  }, [itensParaCategorias, filtros.tipo]);

  // Agrupar itens por categoria (para resultados de busca)
  const itensPorCategoria = useMemo(() => {
    const grupos: Record<string, ItemPricelist[]> = {};

    itens.forEach((item) => {
      const cat = item.categoria || "Sem categoria";
      if (!grupos[cat]) {
        grupos[cat] = [];
      }
      grupos[cat].push(item);
    });

    // Ordenar categorias alfabeticamente
    const categoriasOrdenadas = Object.keys(grupos).sort((a, b) => {
      if (a === "Sem categoria") return 1;
      if (b === "Sem categoria") return -1;
      return a.localeCompare(b, "pt-BR");
    });

    return categoriasOrdenadas.map((cat) => ({
      categoria: cat,
      itens: grupos[cat],
    }));
  }, [itens]);

  // Verificar se está buscando (tem termo de busca válido)
  const estaBuscando = Boolean(filtros.busca && filtros.busca.trim().length >= 2);

  const tiposFiltro: { value: TipoItem | null; label: string }[] = [
    { value: null, label: "Todos" },
    { value: "material", label: "Materiais" },
    { value: "mao_obra", label: "MÍo de obra" },
    { value: "servico", label: "Serviços" },
    { value: "produto", label: "Produtos" },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col h-full">
      {/* Header com busca */}
      <div className="p-3 border-b border-gray-200 space-y-2">
        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar itens, materiais, serviços..."
            value={filtros.busca || ""}
            onChange={(e) => onBuscar(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26] text-xs"
          />
        </div>

        {/* Filtros por tipo */}
        <div className="flex items-center gap-1 flex-wrap">
          {tiposFiltro.map((tipo) => (
            <button
              key={tipo.value || "all"}
              onClick={() => onFiltrar({ ...filtros, tipo: tipo.value })}
              className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors whitespace-nowrap ${
                filtros.tipo === tipo.value
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {tipo.label}
            </button>
          ))}
        </div>

        {/* Seletor de ambiente para aplicar metragem */}
        {ambientes.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="ambiente-select" className={`${TYPOGRAPHY.caption} text-gray-500 whitespace-nowrap`}>
              Ambiente:
            </label>
            <select
              id="ambiente-select"
              title="Selecionar ambiente"
              value={ambienteSelecionado}
              onChange={(e) => setAmbienteSelecionado(e.target.value)}
              className="flex-1 px-2 py-1 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#F25C26]"
            >
              <option value="">Quantidade manual</option>
              {ambientes.map((amb) => (
                <option key={amb.id} value={amb.id}>
                  {amb.nome} ({amb.area_piso.toFixed(1)}m²)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Toggle Blocos / Lista */}
        <div className="flex items-center justify-center gap-1 pt-1">
          <button
            type="button"
            onClick={() => setModoVisualizacao("blocos")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              modoVisualizacao === "blocos"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Blocos
          </button>
          <button
            type="button"
            onClick={() => setModoVisualizacao("lista")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              modoVisualizacao === "lista"
                ? "bg-primary text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <List className="w-3.5 h-3.5" />
            Lista
          </button>
        </div>
      </div>

      {/* Sugestões da IA */}
      {sugestoes.length > 0 && (
        <div className="p-2 bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-purple-200">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span className={`${TYPOGRAPHY.caption} font-medium text-purple-700 uppercase`}>
              Sugestões IA ({sugestoes.length})
            </span>
          </div>
          <div className="space-y-1 max-h-24 overflow-y-auto">
            {sugestoes.slice(0, 5).map((sug) => (
              <button
                key={sug.id}
                onClick={() => sug.itemSugerido && handleAdicionar(sug.itemSugerido)}
                disabled={!sug.itemSugerido}
                className="w-full p-1.5 bg-white rounded border border-purple-200 text-left hover:border-purple-400 transition-colors disabled:opacity-50"
              >
                <p className={`${TYPOGRAPHY.caption} font-medium text-gray-900 truncate`}>
                  {sug.itemSugerido?.nome || sug.descricao}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="flex-1 overflow-y-auto">
        {loading || loadingCategorias ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : estaBuscando ? (
          // Modo busca - mostrar resultados
          <div className="p-2 space-y-2">
            {itens.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className={TYPOGRAPHY.cardSubtitle}>Nenhum item encontrado</p>
                <button
                  type="button"
                  onClick={onCriarNovo}
                  className="mt-3 px-3 py-1.5 bg-primary text-white rounded-lg text-xs font-medium hover:bg-primary/90 transition-colors"
                >
                  + Criar novo item
                </button>
              </div>
            ) : modoVisualizacao === "blocos" ? (
              // Resultados agrupados por categoria
              <div className="space-y-2">
                {itensPorCategoria.map(({ categoria, itens: itensCategoria }) => (
                  <CategoriaExpandivel
                    key={categoria}
                    categoria={categoria}
                    itens={itensCategoria}
                    ambienteSelecionado={ambienteSelecionado}
                    onAdicionar={handleAdicionar}
                  />
                ))}
              </div>
            ) : (
              // Resultados em lista
              itens.map((item) => (
                <ItemListaSimples
                  key={item.id}
                  item={item}
                  onAdicionar={() => handleAdicionar(item)}
                />
              ))
            )}
          </div>
        ) : (
          // Modo padrÍo - mostrar CATEGORIAS expandíveis
          <div className="p-2">
            <div className="mb-2 px-1">
              <span className={`${TYPOGRAPHY.overline} text-gray-500`}>CATEGORIAS</span>
            </div>
            <div className="space-y-1">
              {categoriasDb.map((cat) => {
                const itensCategoria = itensPorCategoriaDb[cat.id] || [];
                return (
                  <CategoriaExpandivelDb
                    key={cat.id}
                    categoria={cat}
                    itens={itensCategoria}
                    ambienteSelecionado={ambienteSelecionado}
                    onAdicionar={handleAdicionar}
                  />
                );
              })}
              {/* Itens sem categoria */}
              {itensPorCategoriaDb["sem_categoria"]?.length > 0 && (
                <CategoriaExpandivelDb
                  categoria={{ id: "sem_categoria", nome: "Sem categoria", codigo: null, descricao: null, ordem: 999, ativo: true, cor: null, created_at: "", updated_at: "" }}
                  itens={itensPorCategoriaDb["sem_categoria"]}
                  ambienteSelecionado={ambienteSelecionado}
                  onAdicionar={handleAdicionar}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer com contagem */}
      {estaBuscando && itens.length > 0 && (
        <div className="p-2 border-t border-gray-200 text-center">
          <span className={TYPOGRAPHY.caption}>
            {itens.length} {itens.length === 1 ? "item encontrado" : "itens encontrados"}
          </span>
        </div>
      )}
    </div>
  );
}

// Componente de categoria expandível usando dados do DB
interface CategoriaExpandivelDbProps {
  categoria: PricelistCategoria;
  itens: ItemPricelist[];
  ambienteSelecionado: string;
  onAdicionar: (item: ItemPricelist, ambienteId?: string) => void;
}

function CategoriaExpandivelDb({ categoria, itens, ambienteSelecionado, onAdicionar }: CategoriaExpandivelDbProps) {
  const [expandido, setExpandido] = useState(false);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setExpandido(!expandido)}
        className="w-full px-3 py-2.5 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
      >
        <span className={`${TYPOGRAPHY.cardTitle} text-gray-700`}>{categoria.nome}</span>
        <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${expandido ? "rotate-90" : ""}`} />
      </button>

      {expandido && (
        <div className="border-t border-gray-100 bg-gray-50/50 max-h-64 overflow-y-auto">
          {itens.length === 0 ? (
            <div className="p-3 text-center">
              <p className={`${TYPOGRAPHY.caption} text-gray-400`}>Nenhum item nesta categoria</p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {itens.map((item) => (
                <div
                  key={item.id}
                  className="p-2 bg-white border border-gray-100 rounded-lg hover:border-[#F25C26] hover:bg-orange-50/30 transition-colors cursor-pointer group"
                  onClick={() => onAdicionar(item, ambienteSelecionado || undefined)}
                >
                  <div className="flex items-center gap-2">
                    <ItemImage url={item.imagem_url} nome={item.nome} />
                    <div className="flex-1 min-w-0">
                      <p className={`${TYPOGRAPHY.cardTitle} truncate group-hover:text-[#F25C26]`}>{item.nome}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant={getBadgeVariant(item.tipo) as any} size="sm" className="text-[8px] px-1 py-0">
                          {getTipoLabel(item.tipo)}
                        </Badge>
                        <span className={TYPOGRAPHY.caption}>{formatarMoeda(item.preco)}/{item.unidade}</span>
                      </div>
                    </div>
                    <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#F25C26] transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente de item em lista simples
function ItemListaSimples({ item, onAdicionar }: { item: ItemPricelist; onAdicionar: () => void }) {
  return (
    <div
      className="p-2 border border-gray-200 rounded-lg hover:border-[#F25C26] hover:bg-orange-50/30 transition-colors cursor-pointer group"
      onClick={onAdicionar}
    >
      <div className="flex items-center gap-2">
        <ItemImage url={item.imagem_url} nome={item.nome} />
        <div className="flex-1 min-w-0">
          <p className={`${TYPOGRAPHY.cardTitle} truncate group-hover:text-[#F25C26]`}>{item.nome}</p>
          {item.descricao && (
            <p className={`${TYPOGRAPHY.caption} text-gray-500 line-clamp-1 mt-0.5`}>{item.descricao}</p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <Badge variant={getBadgeVariant(item.tipo) as any} size="sm" className="text-[8px] px-1 py-0">
            {getTipoLabel(item.tipo)}
          </Badge>
          {item.categoria && (
            <Badge variant="default" size="sm" className="bg-gray-100 text-gray-600 text-[8px] px-1 py-0">
              {item.categoria}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className={TYPOGRAPHY.moneySmall}>
            {formatarMoeda(item.preco)}/{item.unidade}
          </span>
          <Plus className="w-4 h-4 text-gray-300 group-hover:text-[#F25C26] transition-colors" />
        </div>
      </div>
    </div>
  );
}


