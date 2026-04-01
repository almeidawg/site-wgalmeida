/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, FolderTree, Layers, ListFilter, RefreshCw, Search } from "lucide-react";
import {
  listarCategorias,
  listarItensComFiltros,
  listarSubcategorias,
  type PricelistCategoria,
  type PricelistItemCompleto,
  type PricelistSubcategoria,
} from "@/lib/pricelistApi";
import { formatarMoeda } from "@/lib/utils";

function textoItemCategoria(item: PricelistItemCompleto): string {
  if (typeof item.categoria === "object" && item.categoria?.nome) return item.categoria.nome;
  if (typeof item.categoria === "string") return item.categoria;
  return "";
}

function textoItemSubcategoria(item: PricelistItemCompleto): string {
  if (typeof item.subcategoria === "object" && item.subcategoria?.nome) return item.subcategoria.nome;
  if (typeof item.subcategoria === "string") return item.subcategoria;
  return "";
}

export default function PricelistWorkflowPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [mostrarInativos, setMostrarInativos] = useState(false);
  const [categoriaIdSelecionada, setCategoriaIdSelecionada] = useState<string>("");
  const [subcategoriaIdSelecionada, setSubcategoriaIdSelecionada] = useState<string>("");
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<PricelistSubcategoria[]>([]);
  const [itens, setItens] = useState<PricelistItemCompleto[]>([]);

  const carregar = async () => {
    try {
      setLoading(true);
      setErro("");
      const [cats, subs, itensData] = await Promise.all([
        listarCategorias(),
        listarSubcategorias(),
        listarItensComFiltros({ limite: 5000 }),
      ]);
      setCategorias(cats);
      setSubcategorias(subs);
      setItens(itensData);
    } catch (e: any) {
      setErro(e?.message || "Erro ao carregar dados do pricelist");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const categoriasVisiveis = useMemo(() => {
    return categorias.filter((cat) => (mostrarInativos ? true : cat.ativo));
  }, [categorias, mostrarInativos]);

  const subcategoriasVisiveis = useMemo(() => {
    return subcategorias.filter((sub) => (mostrarInativos ? true : sub.ativo));
  }, [subcategorias, mostrarInativos]);

  const contagemCategoria = useMemo(() => {
    const map = new Map<string, number>();
    itens.forEach((item) => {
      if (!item.categoria_id) return;
      map.set(item.categoria_id, (map.get(item.categoria_id) || 0) + 1);
    });
    return map;
  }, [itens]);

  const contagemSubcategoria = useMemo(() => {
    const map = new Map<string, number>();
    itens.forEach((item) => {
      if (!item.subcategoria_id) return;
      map.set(item.subcategoria_id, (map.get(item.subcategoria_id) || 0) + 1);
    });
    return map;
  }, [itens]);

  const subcategoriasDaCategoria = useMemo(() => {
    if (!categoriaIdSelecionada) return [];
    return subcategoriasVisiveis
      .filter((sub) => sub.categoria_id === categoriaIdSelecionada)
      .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome));
  }, [subcategoriasVisiveis, categoriaIdSelecionada]);

  const itensFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((item) => {
      if (!mostrarInativos && item.ativo === false) return false;
      if (categoriaIdSelecionada && item.categoria_id !== categoriaIdSelecionada) return false;
      if (subcategoriaIdSelecionada && item.subcategoria_id !== subcategoriaIdSelecionada) return false;
      if (!termo) return true;
      const alvo = [
        item.nome || "",
        item.codigo || "",
        item.descricao || "",
        textoItemCategoria(item),
        textoItemSubcategoria(item),
      ]
        .join(" ")
        .toLowerCase();
      return alvo.includes(termo);
    });
  }, [itens, busca, categoriaIdSelecionada, subcategoriaIdSelecionada, mostrarInativos]);

  const itensSemCategoria = useMemo(() => itens.filter((i) => !i.categoria_id).length, [itens]);
  const itensSemSubcategoria = useMemo(() => itens.filter((i) => !i.subcategoria_id).length, [itens]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-4 md:p-6 space-y-4">
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/pricelist")}
            className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Pricelist Workflow Mockup</h1>
            <p className="text-sm text-gray-500">VisÍo unificada de categorias, subcategorias e itens</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/pricelist/novo")}
            className="px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
          >
            Novo Item
          </button>
          <button
            type="button"
            onClick={carregar}
            className="inline-flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Categorias</p>
          <p className="text-2xl font-semibold text-gray-900">{categorias.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Subcategorias</p>
          <p className="text-2xl font-semibold text-gray-900">{subcategorias.length}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Itens sem categoria</p>
          <p className="text-2xl font-semibold text-amber-600">{itensSemCategoria}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3">
          <p className="text-xs text-gray-500">Itens sem subcategoria</p>
          <p className="text-2xl font-semibold text-amber-600">{itensSemSubcategoria}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-4">
        <aside className="bg-white border border-gray-200 rounded-xl p-3 h-fit">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-[#F25C26]" />
              <h2 className="font-semibold text-gray-900 text-sm">Categorias</h2>
            </div>
            <label className="text-xs text-gray-500 flex items-center gap-1">
              <input
                type="checkbox"
                checked={mostrarInativos}
                onChange={(e) => setMostrarInativos(e.target.checked)}
              />
              Inativos
            </label>
          </div>

          <div className="space-y-1 max-h-[70vh] overflow-y-auto pr-1">
            <button
              type="button"
              onClick={() => {
                setCategoriaIdSelecionada("");
                setSubcategoriaIdSelecionada("");
              }}
              className={`w-full text-left px-2 py-2 rounded-lg border text-sm ${
                !categoriaIdSelecionada ? "border-[#F25C26] bg-orange-50 text-[#F25C26]" : "border-gray-200 hover:bg-gray-50"
              }`}
            >
              Todas categorias <span className="text-xs text-gray-500">({itens.length})</span>
            </button>

            {categoriasVisiveis
              .slice()
              .sort((a, b) => a.ordem - b.ordem || a.nome.localeCompare(b.nome))
              .map((cat) => {
                const ativa = categoriaIdSelecionada === cat.id;
                return (
                  <div key={cat.id} className="border border-gray-100 rounded-lg">
                    <button
                      type="button"
                      onClick={() => {
                        setCategoriaIdSelecionada(cat.id);
                        setSubcategoriaIdSelecionada("");
                      }}
                      className={`w-full text-left px-2 py-2 rounded-lg text-sm flex items-center justify-between ${
                        ativa ? "bg-orange-50 text-[#F25C26]" : "hover:bg-gray-50"
                      }`}
                    >
                      <span className="truncate">{cat.codigo ? `${cat.codigo} / ` : ""}{cat.nome}</span>
                      <span className="text-xs text-gray-500 ml-2">{contagemCategoria.get(cat.id) || 0}</span>
                    </button>

                    {ativa && (
                      <div className="px-2 pb-2 space-y-1">
                        <button
                          type="button"
                          onClick={() => setSubcategoriaIdSelecionada("")}
                          className={`w-full text-left px-2 py-1 rounded text-xs ${
                            !subcategoriaIdSelecionada ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                          }`}
                        >
                          Sem filtro de subcategoria
                        </button>
                        {subcategoriasDaCategoria.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => setSubcategoriaIdSelecionada(sub.id)}
                            className={`w-full text-left px-2 py-1 rounded text-xs flex items-center justify-between ${
                              subcategoriaIdSelecionada === sub.id ? "bg-blue-50 text-blue-700" : "hover:bg-gray-50 text-gray-600"
                            }`}
                          >
                            <span className="truncate">{sub.nome}</span>
                            <span>{contagemSubcategoria.get(sub.id) || 0}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </aside>

        <section className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="p-3 border-b border-gray-100 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
              <Layers className="w-4 h-4 text-[#F25C26]" />
              Itens do Pricelist
              <span className="ml-1 text-xs text-gray-500">({itensFiltrados.length})</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar item, código, descriçÍo, categoria..."
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-orange-100 focus:border-[#F25C26] outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setBusca("");
                  setCategoriaIdSelecionada("");
                  setSubcategoriaIdSelecionada("");
                }}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm"
              >
                <ListFilter className="w-4 h-4" />
                Limpar filtros
              </button>
            </div>
          </div>

          <div className="overflow-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-gray-500">Carregando dados...</div>
            ) : erro ? (
              <div className="p-8 text-center text-sm text-red-600">{erro}</div>
            ) : itensFiltrados.length === 0 ? (
              <div className="p-8 text-center text-sm text-gray-500">Nenhum item encontrado com os filtros atuais.</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Código</th>
                    <th className="text-left px-3 py-2 font-medium">Item</th>
                    <th className="text-left px-3 py-2 font-medium">Categoria</th>
                    <th className="text-left px-3 py-2 font-medium">Subcategoria</th>
                    <th className="text-right px-3 py-2 font-medium">Preço</th>
                    <th className="text-center px-3 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {itensFiltrados.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50/70">
                      <td className="px-3 py-2 text-gray-600">{item.codigo || "-"}</td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-gray-900">{item.nome}</div>
                        {item.descricao && <div className="text-xs text-gray-500 truncate max-w-[520px]">{item.descricao}</div>}
                      </td>
                      <td className="px-3 py-2 text-gray-700">{textoItemCategoria(item) || "-"}</td>
                      <td className="px-3 py-2 text-gray-700">{textoItemSubcategoria(item) || "-"}</td>
                      <td className="px-3 py-2 text-right font-medium text-gray-900">{formatarMoeda(item.preco || 0)}</td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs ${
                            item.ativo === false ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                          }`}
                        >
                          {item.ativo === false ? "Inativo" : "Ativo"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

