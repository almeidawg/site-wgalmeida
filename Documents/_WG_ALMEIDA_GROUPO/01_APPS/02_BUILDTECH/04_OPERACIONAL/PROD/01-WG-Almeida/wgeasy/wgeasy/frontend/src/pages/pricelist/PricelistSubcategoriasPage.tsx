// ============================================================
// PÁGINA: Gerenciamento de Subcategorias do Pricelist
// Permite criar/editar/excluir subcategorias e trocar a categoria mÍe
// ============================================================

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import {
  listarCategorias,
  listarSubcategorias,
  criarSubcategoria,
  atualizarSubcategoria,
  deletarSubcategoria,
  type PricelistCategoria,
  type PricelistSubcategoria,
  type TipoPricelist,
} from "@/lib/pricelistApi";
import { getTipoItemLabel } from "@/types/pricelist";

interface FormState {
  id?: string;
  nome: string;
  categoria_id: string;
  tipo: TipoPricelist;
  ordem: number;
  ativo: boolean;
}

export default function PricelistSubcategoriasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [categorias, setCategorias] = useState<PricelistCategoria[]>([]);
  const [subcategorias, setSubcategorias] = useState<PricelistSubcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>("");
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");
  const [form, setForm] = useState<FormState>({
    nome: "",
    categoria_id: "",
    tipo: "material",
    ordem: 0,
    ativo: true,
  });

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);
      const [cats, subs] = await Promise.all([listarCategorias(), listarSubcategorias()]);
      setCategorias(cats);
      setSubcategorias(subs);
      const primeiraCategoria = cats[0];
      if (primeiraCategoria) {
        setForm((prev) => {
          if (prev.categoria_id) return prev;
          return {
            ...prev,
            categoria_id: primeiraCategoria.id,
            tipo: primeiraCategoria.tipo || prev.tipo,
          };
        });
      }
    } catch (error) {
      console.error("Erro ao carregar subcategorias:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  const categoriasPorId = useMemo(
    () => Object.fromEntries(categorias.map((c) => [c.id, c])),
    [categorias]
  );

  const subcategoriasFiltradas = subcategorias.filter((sub) => {
    if (filtroCategoria && sub.categoria_id !== filtroCategoria) return false;
    if (filtroTipo !== "todos" && sub.tipo !== filtroTipo) return false;
    return true;
  });

  function resetForm() {
    setForm({
      id: undefined,
      nome: "",
      categoria_id: categorias[0]?.id || "",
      tipo: categorias[0]?.tipo || "material",
      ordem: 0,
      ativo: true,
    });
  }

  function handleEdit(sub: PricelistSubcategoria) {
    setForm({
      id: sub.id,
      nome: sub.nome,
      categoria_id: sub.categoria_id,
      tipo: sub.tipo as TipoPricelist,
      ordem: sub.ordem ?? 0,
      ativo: sub.ativo ?? true,
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim() || !form.categoria_id) {
      toast({ title: "AtençÍo", description: "Preencha nome e categoria." });
      return;
    }
    setSalvando(true);
    try {
      const payload = {
        nome: form.nome.trim(),
        categoria_id: form.categoria_id,
        tipo: form.tipo,
        ordem: Number.isFinite(form.ordem) ? form.ordem : 0,
        ativo: form.ativo,
      };
      if (form.id) {
        await atualizarSubcategoria(form.id, payload);
      } else {
        await criarSubcategoria(payload);
      }
      await carregarDados();
      resetForm();
    } catch (error: unknown) {
      console.error("Erro ao salvar subcategoria:", error);
      const mensagemErro = error instanceof Error ? error.message : String(error);
      toast({ title: "Erro", description: mensagemErro || "Erro ao salvar subcategoria", variant: "destructive" });
    } finally {
      setSalvando(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Deseja excluir esta subcategoria?")) return;
    try {
      await deletarSubcategoria(id);
      await carregarDados();
    } catch (error) {
      console.error("Erro ao excluir subcategoria:", error);
      toast({ title: "Erro", description: "NÍo foi possível excluir.", variant: "destructive" });
    }
  }

  function handleCategoriaChange(categoriaId: string) {
    const cat = categoriasPorId[categoriaId];
    setForm((prev) => ({
      ...prev,
      categoria_id: categoriaId,
      tipo: cat?.tipo || prev.tipo,
    }));
  }

  return (
    <div className="p-3 sm:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => navigate("/pricelist/categorias")}
            className="text-sm text-gray-600 hover:text-gray-800 mb-1"
          >
            ← Voltar para Categorias
          </button>
          <h1 className="text-2xl font-normal text-[#2E2E2E]">Subcategorias</h1>
          <p className="text-sm text-gray-600 mt-1">
            Gerencie subcategorias e a categoria mÍe.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate("/pricelist")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Ir para Itens
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-normal text-gray-700 mb-1">Categoria</label>
          <select
            value={filtroCategoria}
            onChange={(e) => setFiltroCategoria(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todas</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.codigo ? `${cat.codigo} - ${cat.nome}` : cat.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-normal text-gray-700 mb-1">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="todos">Todos</option>
            <option value="mao_obra">MÍo de Obra</option>
            <option value="material">Material</option>
            <option value="servico">Serviço</option>
            <option value="produto">Produto</option>
          </select>
        </div>
        <div className="ml-auto">
          <button
            onClick={resetForm}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
          >
            Novo
          </button>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-4">
        <h3 className="text-lg font-normal text-[#2E2E2E] mb-3">
          {form.id ? "Editar Subcategoria" : "Nova Subcategoria"}
        </h3>
        <form className="grid grid-cols-4 gap-4 items-end" onSubmit={handleSubmit}>
          <div className="col-span-2">
            <label className="block text-sm font-normal text-gray-700 mb-1">Nome</label>
            <input
              type="text"
              value={form.nome}
              onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              placeholder="Ex: Piso"
            />
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Categoria mÍe</label>
            <select
              value={form.categoria_id}
              onChange={(e) => handleCategoriaChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="">Selecione</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.codigo ? `${cat.codigo} - ${cat.nome}` : cat.nome}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as TipoPricelist }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="mao_obra">MÍo de Obra</option>
              <option value="material">Material</option>
              <option value="servico">Serviço</option>
              <option value="produto">Produto</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-normal text-gray-700 mb-1">Ordem</label>
            <input
              type="number"
              value={form.ordem}
              onChange={(e) => setForm((p) => ({ ...p, ordem: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="ativo"
              type="checkbox"
              checked={form.ativo}
              onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
              className="w-4 h-4 text-[#F25C26]"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
              Ativa
            </label>
          </div>
          <div className="col-span-3 flex gap-2 justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
              disabled={salvando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm hover:bg-primary/90"
            >
              {salvando ? "Salvando..." : form.id ? "Atualizar" : "Criar"}
            </button>
          </div>
        </form>
      </div>

      {/* Lista */}
      <div className="bg-white border border-gray-200 rounded-xl">
        {loading ? (
          <div className="p-6 text-center text-sm text-gray-600">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F5F5F5] text-gray-700 uppercase text-xs font-normal">
              <tr>
                <th className="px-4 py-3 text-left">Subcategoria</th>
                <th className="px-4 py-3 text-left">Categoria mÍe</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Ordem</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {subcategoriasFiltradas.map((sub) => {
                const cat = categoriasPorId[sub.categoria_id];
                return (
                  <tr key={sub.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900 font-medium">{sub.nome}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {cat ? (cat.codigo ? `${cat.codigo} - ${cat.nome}` : cat.nome) : "-"}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{getTipoItemLabel(sub.tipo as TipoPricelist)}</td>
                    <td className="px-4 py-3 text-gray-700">{sub.ordem ?? 0}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-normal ${
                          sub.ativo ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-600"
                        }`}
                      >
                        {sub.ativo ? "Ativa" : "Inativa"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        onClick={() => handleEdit(sub)}
                        className="text-[#F25C26] hover:text-[#d94a1f] font-medium"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(sub.id)}
                        className="text-red-500 hover:text-red-600 font-medium"
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
              {subcategoriasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-600 text-sm">
                    Nenhuma subcategoria encontrada com os filtros atuais.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}


