/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PAGINA: Categorias Financeiras Hierarquicas
// Sistema WG Easy - Grupo WG Almeida
// CRUD com arvore expansivel de 3 niveis
// ============================================================

import React, { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  Folder,
  FolderOpen,
  Tag,
  Search,
  Filter,
  MoreVertical,
  Copy,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { cn } from "@/lib/utils";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { useToast } from "@/components/ui/use-toast";

// Tipos
interface Categoria {
  id: string;
  name: string;
  kind: "income" | "expense";
  nucleo: string | null;
  nivel: number;
  codigo: string | null;
  ordem: number;
  parent_id: string | null;
  icone: string | null;
  cor: string | null;
  ativo: boolean;
  created_at?: string;
  children?: Categoria[];
}

// Nucleos disponiveis
const NUCLEOS = [
  { value: "", label: "Todos os Núcleos", cor: "#6B7280" },
  { value: "arquitetura", label: "Arquitetura", cor: "#5E9B94" },
  { value: "engenharia", label: "Engenharia", cor: "#3B82F6" },
  { value: "marcenaria", label: "Marcenaria", cor: "#8B5E3C" },
  { value: "geral", label: "Geral", cor: "#6B7280" },
];

// Cores por nucleo
const getCorNucleo = (nucleo: string | null): string => {
  const cores: Record<string, string> = {
    arquitetura: "#5E9B94",
    engenharia: "#3B82F6",
    marcenaria: "#8B5E3C",
    designer: "#9333EA",
    geral: "#6B7280",
  };
  return cores[nucleo || "geral"] || "#6B7280";
};

// Icones por nivel
const getIconeNivel = (nivel: number, expandido: boolean) => {
  if (nivel === 1) return expandido ? <FolderOpen className="h-5 w-5" /> : <Folder className="h-5 w-5" />;
  if (nivel === 2) return expandido ? <FolderOpen className="h-4 w-4" /> : <Folder className="h-4 w-4" />;
  return <Tag className="h-3.5 w-3.5" />;
};

export default function CategoriasPage() {
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null);
  const [parentCategoria, setParentCategoria] = useState<Categoria | null>(null);
  const [filterNucleo, setFilterNucleo] = useState("");
  const [filterKind, setFilterKind] = useState<"" | "income" | "expense">("");
  const [busca, setBusca] = useState("");
  const [expandidas, setExpandidas] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({ receitas: 0, despesas: 0, total: 0 });
  const [duplicados, setDuplicados] = useState<{ nome: string; itens: Categoria[]; temFilhos: Set<string> }[]>([]);
  const [showDuplicados, setShowDuplicados] = useState(false);
  const [removendoDuplicados, setRemovendoDuplicados] = useState(false);

  // Carregar categorias
  async function carregarCategorias() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fin_categories")
        .select("*")
        .order("ordem", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;

      const lista = data || [];

      // Calcular stats
      const receitas = lista.filter((c) => c.kind === "income" && c.nivel === 1).length;
      const despesas = lista.filter((c) => c.kind === "expense" && c.nivel === 1).length;
      setStats({ receitas, despesas, total: lista.length });

      // Detectar duplicados (mesmo nome, mesmo nivel, mesmo kind)
      const gruposDuplicados = detectarDuplicados(lista);
      setDuplicados(gruposDuplicados);

      // Construir arvore
      const arvore = construirArvore(lista);
      setCategorias(arvore);

      // Manter tudo recolhido por padrÍo
      setExpandidas(new Set());
    } catch (error: any) {
      console.error("Erro ao carregar categorias:", error);
      toast({ variant: "destructive", title: "Erro ao carregar categorias", description: error?.message });
    } finally {
      setLoading(false);
    }
  }

  // Detectar categorias duplicadas (SEGURO - nÍo considera categorias com filhos)
  function detectarDuplicados(lista: Categoria[]): { nome: string; itens: Categoria[]; temFilhos: Set<string> }[] {
    // Primeiro, identificar quais categorias sÍo pais (têm filhos)
    const categoriasComFilhos = new Set<string>();
    lista.forEach((cat) => {
      if (cat.parent_id) {
        categoriasComFilhos.add(cat.parent_id);
      }
    });

    const grupos = new Map<string, Categoria[]>();

    lista.forEach((cat) => {
      // Chave: nome normalizado + nivel + kind + parent_id
      const nomeNormalizado = cat.name.toLowerCase().trim();
      const chave = `${nomeNormalizado}|${cat.nivel}|${cat.kind}|${cat.parent_id || "root"}`;

      if (!grupos.has(chave)) {
        grupos.set(chave, []);
      }
      grupos.get(chave)!.push(cat);
    });

    // Retornar apenas grupos com mais de 1 item (duplicados)
    const duplicados: { nome: string; itens: Categoria[]; temFilhos: Set<string> }[] = [];
    grupos.forEach((itens, chave) => {
      if (itens.length > 1) {
        // Ordenar: categorias COM filhos primeiro, depois por data de criaçÍo
        const ordenados = itens.sort((a, b) => {
          const aTemFilhos = categoriasComFilhos.has(a.id);
          const bTemFilhos = categoriasComFilhos.has(b.id);

          // Categorias com filhos vêm primeiro (serÍo mantidas)
          if (aTemFilhos && !bTemFilhos) return -1;
          if (!aTemFilhos && bTemFilhos) return 1;

          // Se ambos têm ou nÍo têm filhos, ordenar por data (mais antigo primeiro)
          return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
        });

        duplicados.push({
          nome: itens[0].name,
          itens: ordenados,
          temFilhos: categoriasComFilhos,
        });
      }
    });

    return duplicados;
  }

  // Remover duplicados automaticamente (mantém o que tem filhos ou mais antigo)
  async function removerDuplicados() {
    if (duplicados.length === 0) {
      toast({ title: "Nenhum duplicado encontrado!" });
      return;
    }

    // Contar apenas os que podem ser removidos (sem filhos)
    let totalRemovíveis = 0;
    for (const grupo of duplicados) {
      for (let i = 1; i < grupo.itens.length; i++) {
        if (!grupo.temFilhos.has(grupo.itens[i].id)) {
          totalRemovíveis++;
        }
      }
    }

    if (totalRemovíveis === 0) {
      toast({ title: "Nenhum duplicado seguro para remover.", description: "Todas as categorias duplicadas possuem subcategorias." });
      return;
    }

    if (!confirm(`Deseja remover ${totalRemovíveis} categoria(s) duplicada(s)?\n\nSerá mantida a versÍo que possui subcategorias ou a mais antiga.\nCategorias com subcategorias NÍO serÍo removidas.`)) {
      return;
    }

    setRemovendoDuplicados(true);

    try {
      let removidos = 0;
      let ignorados = 0;

      for (const grupo of duplicados) {
        // Mantém o primeiro (com filhos ou mais antigo), remove os demais SEM filhos
        for (let i = 1; i < grupo.itens.length; i++) {
          const cat = grupo.itens[i];

          // NUNCA remover categoria que tem filhos
          if (grupo.temFilhos.has(cat.id)) {
            if (import.meta.env.DEV) console.log(`Ignorando ${cat.name} (${cat.id}) - possui subcategorias`);
            ignorados++;
            continue;
          }

          const { error } = await supabase.from("fin_categories").delete().eq("id", cat.id);
          if (error) {
            console.error(`Erro ao remover ${cat.id}:`, error);
          } else {
            removidos++;
          }
        }
      }

      let msg = `${removidos} categoria(s) duplicada(s) removida(s) com sucesso!`;
      if (ignorados > 0) {
        msg += `\n${ignorados} categoria(s) ignorada(s) (possuem subcategorias).`;
      }
      toast({ title: msg });
      setShowDuplicados(false);
      carregarCategorias();
    } catch (error: any) {
      console.error("Erro ao remover duplicados:", error);
      toast({ variant: "destructive", title: "Erro ao remover duplicados", description: error?.message });
    } finally {
      setRemovendoDuplicados(false);
    }
  }

  // Remover um duplicado específico (com verificaçÍo de filhos)
  async function removerDuplicadoEspecifico(id: string, temFilhos: boolean) {
    if (temFilhos) {
      toast({ variant: "destructive", title: "NÍo é possível remover", description: "Esta categoria possui subcategorias. Remova as subcategorias primeiro." });
      return;
    }

    if (!confirm("Deseja remover esta categoria duplicada?")) return;

    try {
      const { error } = await supabase.from("fin_categories").delete().eq("id", id);
      if (error) throw error;

      toast({ title: "Categoria removida com sucesso!" });
      carregarCategorias();
    } catch (error: any) {
      console.error("Erro ao remover:", error);
      toast({ variant: "destructive", title: "Erro ao remover categoria", description: error?.message });
    }
  }

  useEffect(() => {
    carregarCategorias();
  }, []);

  // Construir arvore hierarquica
  function construirArvore(lista: Categoria[]): Categoria[] {
    const mapa = new Map<string, Categoria>();
    const raizes: Categoria[] = [];

    // Criar mapa com children vazios
    lista.forEach((cat) => {
      mapa.set(cat.id, { ...cat, children: [] });
    });

    // Construir hierarquia
    lista.forEach((cat) => {
      const catComFilhos = mapa.get(cat.id)!;
      if (cat.parent_id && mapa.has(cat.parent_id)) {
        mapa.get(cat.parent_id)!.children!.push(catComFilhos);
      } else if (cat.nivel === 1) {
        raizes.push(catComFilhos);
      }
    });

    // Ordenar filhos
    const ordenar = (lista: Categoria[]) => {
      lista.sort((a, b) => (a.ordem || 0) - (b.ordem || 0) || a.name.localeCompare(b.name));
      lista.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          ordenar(cat.children);
        }
      });
    };
    ordenar(raizes);

    return raizes;
  }

  // Filtrar categorias
  const categoriasFiltradas = useMemo(() => {
    let resultado = categorias;

    // Filtro por tipo (income/expense)
    if (filterKind) {
      resultado = resultado.filter((c) => c.kind === filterKind);
    }

    // Filtro por nucleo
    if (filterNucleo) {
      resultado = resultado.filter(
        (c) => c.nucleo === filterNucleo || c.nucleo === "geral" || !c.nucleo
      );
    }

    // Filtro por busca
    if (busca.trim()) {
      const termo = normalizeSearchTerm(busca);
      const filtrar = (lista: Categoria[]): Categoria[] => {
        const res: Categoria[] = [];
        for (const cat of lista) {
          const matchNome = normalizeSearchTerm(cat.name).includes(termo);
          const matchCodigo = normalizeSearchTerm(cat.codigo || "").includes(termo);
          const filhosFiltrados = cat.children ? filtrar(cat.children) : [];

          if (matchNome || matchCodigo || filhosFiltrados.length > 0) {
            res.push({
              ...cat,
              children: filhosFiltrados.length > 0 ? filhosFiltrados : cat.children,
            });
          }
        }
        return res;
      };
      resultado = filtrar(resultado);
    }

    return resultado;
  }, [categorias, filterKind, filterNucleo, busca]);

  // Separar receitas e despesas
  const receitas = categoriasFiltradas.filter((c) => c.kind === "income");
  const despesas = categoriasFiltradas.filter((c) => c.kind === "expense");

  // Toggle expansao
  function toggleExpansao(id: string) {
    const novos = new Set(expandidas);
    if (novos.has(id)) {
      novos.delete(id);
    } else {
      novos.add(id);
    }
    setExpandidas(novos);
  }

  // Expandir/colapsar tudo
  function expandirTudo() {
    const todos = new Set<string>();
    const coletar = (lista: Categoria[]) => {
      lista.forEach((cat) => {
        if (cat.children && cat.children.length > 0) {
          todos.add(cat.id);
          coletar(cat.children);
        }
      });
    };
    coletar(categorias);
    setExpandidas(todos);
  }

  function colapsarTudo() {
    setExpandidas(new Set());
  }

  // Abrir form para nova categoria
  function abrirFormNovo(parent?: Categoria) {
    setEditingCategoria(null);
    setParentCategoria(parent || null);
    setIsFormOpen(true);
  }

  // Abrir form para editar
  function abrirFormEditar(cat: Categoria) {
    setEditingCategoria(cat);
    setParentCategoria(null);
    setIsFormOpen(true);
  }

  // Excluir categoria
  async function handleDelete(cat: Categoria) {
    const temFilhos = cat.children && cat.children.length > 0;

    if (temFilhos) {
      toast({ variant: "destructive", title: "NÍo é possível excluir", description: "Esta categoria possui subcategorias. Remova as subcategorias primeiro." });
      return;
    }

    if (!confirm(`Deseja excluir a categoria "${cat.name}"?`)) return;

    try {
      const { error } = await supabase.from("fin_categories").delete().eq("id", cat.id);

      if (error) throw error;
      toast({ title: "Categoria excluída com sucesso!" });
      carregarCategorias();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({ variant: "destructive", title: "Erro ao excluir categoria", description: error?.message });
    }
  }

  // Renderizar item da arvore
  function renderizarItem(cat: Categoria, profundidade: number = 0): React.ReactNode {
    const temFilhos = cat.children && cat.children.length > 0;
    const estaExpandida = expandidas.has(cat.id);
    const cor = cat.cor || getCorNucleo(cat.nucleo);
    const nivelLabels = ["", "Categoria", "Subcategoria", "Item"];

    return (
      <div key={cat.id}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className={cn(
            "group flex items-center gap-2 px-3 py-2.5 border-l-4 transition-colors hover:bg-gray-50",
            cat.ativo === false && "opacity-50"
          )}
          style={{
            paddingLeft: `${12 + profundidade * 20}px`,
            borderLeftColor: cor,
          }}
        >
          {/* Seta de expansao */}
          {temFilhos ? (
            <button
              onClick={() => toggleExpansao(cat.id)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {estaExpandida ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
            </button>
          ) : (
            <span className="w-6" />
          )}

          {/* Icone */}
          <span style={{ color: cor }}>{getIconeNivel(cat.nivel, estaExpandida)}</span>

          {/* Nome e detalhes */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-normal text-gray-900 truncate">{cat.name}</span>
              {cat.codigo && (
                <span className="text-[12px] font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                  {cat.codigo}
                </span>
              )}
              {cat.ativo === false && (
                <span className="text-[12px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                  Inativo
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[12px] text-gray-400">{nivelLabels[cat.nivel] || `Nível ${cat.nivel}`}</span>
              {cat.nucleo && cat.nivel === 1 && (
                <span
                  className="text-[12px] px-1.5 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: cor }}
                >
                  {cat.nucleo}
                </span>
              )}
              {temFilhos && (
                <span className="text-[12px] text-gray-400">
                  ({cat.children!.length} {cat.children!.length === 1 ? "item" : "itens"})
                </span>
              )}
            </div>
          </div>

          {/* Acoes */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Adicionar subcategoria (apenas nivel 1 e 2) */}
            {cat.nivel < 3 && (
              <button
                onClick={() => abrirFormNovo(cat)}
                className="p-1.5 hover:bg-green-100 rounded-md transition-colors"
                title={`Adicionar ${cat.nivel === 1 ? "subcategoria" : "item"}`}
              >
                <Plus className="h-3.5 w-3.5 text-green-600" />
              </button>
            )}

            {/* Editar */}
            <button
              onClick={() => abrirFormEditar(cat)}
              className="p-1.5 hover:bg-blue-100 rounded-md transition-colors"
              title="Editar"
            >
              <Edit className="h-3.5 w-3.5 text-blue-500" />
            </button>

            {/* Excluir */}
            <button
              onClick={() => handleDelete(cat)}
              className="p-1.5 hover:bg-red-100 rounded-md transition-colors"
              title="Excluir"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </motion.div>

        {/* Filhos */}
        <AnimatePresence>
          {temFilhos && estaExpandida && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
            >
              {cat.children!.map((filho) => renderizarItem(filho, profundidade + 1))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Categorias Financeiras</h1>
              <p className="text-[12px] text-gray-600">
                {stats.total} categorias ({stats.receitas} receitas, {stats.despesas} despesas)
              </p>
            </div>
          </div>

        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar..."
              className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-lg text-[12px] placeholder:text-[12px] w-40 focus:ring-2 focus:ring-orange-200 focus:outline-none"
            />
          </div>

          {/* Filtro tipo */}
          <select
            value={filterKind}
            onChange={(e) => setFilterKind(e.target.value as "" | "income" | "expense")}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-[12px] focus:ring-2 focus:ring-orange-200 focus:outline-none"
          >
            <option value="">Receitas e Despesas</option>
            <option value="income">Receitas</option>
            <option value="expense">Despesas</option>
          </select>

          {/* Filtro nucleo */}
          <select
            value={filterNucleo}
            onChange={(e) => setFilterNucleo(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-[12px] focus:ring-2 focus:ring-orange-200 focus:outline-none"
          >
            {NUCLEOS.map((n) => (
              <option key={n.value} value={n.value}>
                {n.label}
              </option>
            ))}
          </select>

          {/* Expandir/Colapsar */}
          <button
            onClick={expandirTudo}
            className="px-2 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Expandir
          </button>
          <button
            onClick={colapsarTudo}
            className="px-2 py-1.5 text-[13px] text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Colapsar
          </button>

          {/* Duplicados */}
          {duplicados.length > 0 && (
            <button
              onClick={() => setShowDuplicados(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[13px] font-normal hover:bg-amber-200 transition-colors"
            >
              <AlertCircle className="w-4 h-4" />
              {duplicados.reduce((acc, g) => acc + g.itens.length - 1, 0)} duplicados
            </button>
          )}

          {/* Nova categoria */}
          <button
            onClick={() => abrirFormNovo()}
            className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" /> Nova Categoria
          </button>
        </div>
      </div>
      </div>

      {/* Conteudo */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#16a34a] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando categorias...</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RECEITAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-light text-green-700 flex items-center gap-2">
                  <span className="text-lg">📈</span> Receitas (Entradas)
                </h2>
                <span className="text-[12px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full">
                  {receitas.length} {receitas.length === 1 ? "categoria" : "categorias"}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {receitas.length === 0 ? (
                <div className="text-center py-12 text-[12px] text-gray-500">
                  Nenhuma categoria de receita encontrada
                </div>
              ) : (
                receitas.map((cat) => renderizarItem(cat))
              )}
            </div>
          </div>

          {/* DESPESAS */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
              <div className="flex items-center justify-between">
                <h2 className="text-[18px] font-light text-red-700 flex items-center gap-2">
                  <span className="text-lg">📉</span> Despesas (Saidas)
                </h2>
                <span className="text-[12px] bg-red-200 text-red-800 px-2 py-0.5 rounded-full">
                  {despesas.length} {despesas.length === 1 ? "categoria" : "categorias"}
                </span>
              </div>
            </div>
            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {despesas.length === 0 ? (
                <div className="text-center py-12 text-[12px] text-gray-500">
                  Nenhuma categoria de despesa encontrada
                </div>
              ) : (
                despesas.map((cat) => renderizarItem(cat))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de formulario */}
      {isFormOpen && (
        <CategoriaForm
          categoria={editingCategoria}
          parentCategoria={parentCategoria}
          onClose={() => {
            setIsFormOpen(false);
            setEditingCategoria(null);
            setParentCategoria(null);
          }}
          onSuccess={() => {
            setIsFormOpen(false);
            setEditingCategoria(null);
            setParentCategoria(null);
            carregarCategorias();
          }}
        />
      )}

      {/* Modal de duplicados */}
      {showDuplicados && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
          >
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-[18px] font-light text-wg-neutral flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Categorias Duplicadas
                </h2>
                <p className="text-[12px] text-gray-500 mt-1">
                  {duplicados.length} grupo(s) com duplicados encontrado(s)
                </p>
              </div>
              <button
                onClick={() => setShowDuplicados(false)}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {duplicados.map((grupo, idx) => {
                const temFilhosSet = grupo.temFilhos;
                return (
                  <div key={idx} className="border border-amber-200 bg-amber-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-[13px] font-normal text-amber-800">
                        "{grupo.nome}" ({grupo.itens.length} ocorrências)
                      </h3>
                      <span className="text-[11px] bg-amber-200 text-amber-700 px-2 py-0.5 rounded">
                        Nível {grupo.itens[0].nivel} • {grupo.itens[0].kind === "income" ? "Receita" : "Despesa"}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {grupo.itens.map((cat, i) => {
                        const catTemFilhos = temFilhosSet.has(cat.id);
                        return (
                          <div
                            key={cat.id}
                            className={cn(
                              "flex items-center justify-between p-2 rounded-lg",
                              i === 0 ? "bg-green-100 border border-green-300" :
                              catTemFilhos ? "bg-blue-50 border border-blue-200" : "bg-white border border-gray-200"
                            )}
                          >
                            <div className="flex items-center gap-2">
                              {i === 0 ? (
                                <span className="text-[10px] bg-green-500 text-white px-1.5 py-0.5 rounded">MANTER</span>
                              ) : catTemFilhos ? (
                                <span className="text-[10px] bg-blue-500 text-white px-1.5 py-0.5 rounded">TEM FILHOS</span>
                              ) : (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">DUPLICADO</span>
                              )}
                              <span className="text-[13px] text-gray-700">{cat.name}</span>
                              {cat.codigo && (
                                <span className="text-[11px] font-mono text-gray-400 bg-gray-100 px-1 rounded">
                                  {cat.codigo}
                                </span>
                              )}
                              {catTemFilhos && (
                                <span className="text-[10px] text-blue-600 italic">
                                  (possui subcategorias - protegido)
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-gray-400">
                                {cat.created_at ? new Date(cat.created_at).toLocaleDateString("pt-BR") : "—"}
                              </span>
                              {i > 0 && !catTemFilhos && (
                                <button
                                  onClick={() => removerDuplicadoEspecifico(cat.id, catTemFilhos)}
                                  className="p-1 hover:bg-red-100 rounded text-red-500"
                                  title="Remover este duplicado"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                              {i > 0 && catTemFilhos && (
                                <span className="text-[10px] text-blue-500" title="NÍo pode ser removido">
                                  🔒
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-5 py-4 border-t flex justify-between">
              <button
                onClick={() => setShowDuplicados(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-[13px] hover:bg-gray-50 transition-colors"
              >
                Fechar
              </button>
              <button
                onClick={removerDuplicados}
                disabled={removendoDuplicados}
                className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[13px] transition-colors disabled:opacity-50"
              >
                {removendoDuplicados ? (
                  <>
                    <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                    Removendo...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Remover Todos Duplicados
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// COMPONENTE: Formulario de Categoria
// ============================================================

interface CategoriaFormProps {
  categoria: Categoria | null;
  parentCategoria: Categoria | null;
  onClose: () => void;
  onSuccess: () => void;
}

function CategoriaForm({ categoria, parentCategoria, onClose, onSuccess }: CategoriaFormProps) {
  const { toast } = useToast();
  const isEditing = !!categoria;
  const novoNivel = parentCategoria ? parentCategoria.nivel + 1 : 1;

  const [formData, setFormData] = useState({
    name: categoria?.name || "",
    kind: (categoria?.kind || parentCategoria?.kind || "expense") as "income" | "expense",
    nucleo: categoria?.nucleo || parentCategoria?.nucleo || "geral",
    codigo: categoria?.codigo || "",
    icone: categoria?.icone || "",
    cor: categoria?.cor || "",
    ativo: categoria?.ativo ?? true,
  });

  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({ variant: "destructive", title: "Preencha o nome da categoria." });
      return;
    }

    setSaving(true);

    try {
      const dados = {
        name: formData.name.trim(),
        kind: formData.kind,
        nucleo: formData.nucleo || null,
        codigo: formData.codigo.trim() || null,
        icone: formData.icone.trim() || null,
        cor: formData.cor.trim() || null,
        ativo: formData.ativo,
        nivel: isEditing ? categoria!.nivel : novoNivel,
        parent_id: isEditing ? categoria!.parent_id : parentCategoria?.id || null,
      };

      if (isEditing) {
        const { error } = await supabase.from("fin_categories").update(dados).eq("id", categoria!.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("fin_categories").insert([dados]);
        if (error) throw error;
      }

      toast({ title: `Categoria ${isEditing ? "atualizada" : "criada"} com sucesso!` });
      onSuccess();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({ variant: "destructive", title: "Erro ao salvar categoria", description: error?.message });
    } finally {
      setSaving(false);
    }
  }

  const nivelLabels = ["", "Categoria Principal", "Subcategoria", "Item"];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-xl shadow-2xl w-full max-w-md"
      >
        <div className="px-5 py-4 border-b">
          <h2 className="text-[18px] font-light text-wg-neutral">
            {isEditing ? "Editar Categoria" : `Nova ${nivelLabels[novoNivel] || "Categoria"}`}
          </h2>
          {parentCategoria && (
            <p className="text-[12px] text-gray-500 mt-1">
              Dentro de: <span className="font-normal">{parentCategoria.name}</span>
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-[12px] font-normal mb-1.5 text-gray-700">Nome *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="Ex: Salarios e Encargos"
              autoFocus
            />
          </div>

          {/* Tipo (apenas para nivel 1) */}
          {!parentCategoria && !isEditing && (
            <div>
              <label className="block text-[12px] font-normal mb-1.5 text-gray-700">Tipo *</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: "expense" })}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[13px] font-normal transition-colors border",
                    formData.kind === "expense"
                      ? "bg-red-500 text-white border-red-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  )}
                >
                  📉 Despesa
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, kind: "income" })}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[13px] font-normal transition-colors border",
                    formData.kind === "income"
                      ? "bg-green-500 text-white border-green-500"
                      : "bg-white text-gray-600 border-gray-300 hover:border-gray-400"
                  )}
                >
                  📈 Receita
                </button>
              </div>
            </div>
          )}

          {/* Nucleo */}
          <div>
            <label className="block text-[12px] font-normal mb-1.5 text-gray-700">Núcleo</label>
            <select
              value={formData.nucleo || "geral"}
              onChange={(e) => setFormData({ ...formData, nucleo: e.target.value })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-orange-200"
            >
              <option value="geral">Geral (Todos)</option>
              <option value="arquitetura">Arquitetura</option>
              <option value="engenharia">Engenharia</option>
              <option value="marcenaria">Marcenaria</option>
            </select>
          </div>

          {/* Codigo */}
          <div>
            <label className="block text-[12px] font-normal mb-1.5 text-gray-700">
              Código <span className="font-normal text-gray-400">(opcional)</span>
            </label>
            <input
              type="text"
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
              placeholder="Ex: S.PES.01.001"
            />
          </div>

          {/* Cor (apenas nivel 1) */}
          {(novoNivel === 1 || categoria?.nivel === 1) && (
            <div>
              <label className="block text-[12px] font-normal mb-1.5 text-gray-700">
                Cor <span className="font-normal text-gray-400">(opcional)</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={formData.cor || "#6B7280"}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="w-10 h-10 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.cor}
                  onChange={(e) => setFormData({ ...formData, cor: e.target.value })}
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-[12px] font-mono focus:outline-none focus:ring-2 focus:ring-orange-200"
                  placeholder="#6B7280"
                />
              </div>
            </div>
          )}

          {/* Ativo */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="ativo"
              checked={formData.ativo}
              onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-200"
            />
            <label htmlFor="ativo" className="text-[12px] text-gray-700">
              Categoria ativa
            </label>
          </div>

          {/* Botoes */}
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[13px] hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-3 py-2 bg-wg-primary hover:bg-wg-primary/90 text-white rounded-lg text-[13px] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="h-3.5 w-3.5" />
                  {isEditing ? "Atualizar" : "Criar"}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}


