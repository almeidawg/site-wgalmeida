// ============================================================
// ICCRI Categorias — GestÍo hierárquica completa
// Macrocategorias → Categorias → Subcategorias
// WG Easy · Sistema · MASTER only
// ============================================================

import React, { useEffect, useState } from "react";
import {
  getMacrocategorias, getCategorias, getSubcategorias,
  upsertCategoria, upsertSubcategoria,
  type ICCRIMacrocategoria, type ICCRICategoria, type ICCRISubcategoria,
} from "@/lib/iccriApi";
import { ChevronDown, ChevronRight, Plus, Edit2, Save, X, RefreshCw } from "lucide-react";

type EditMode = { type: "cat" | "sub"; data: Partial<ICCRICategoria | ICCRISubcategoria> } | null;

export default function ICCRICategoriasPage() {
  const [macros, setMacros] = useState<ICCRIMacrocategoria[]>([]);
  const [cats, setCats] = useState<ICCRICategoria[]>([]);
  const [subs, setSubs] = useState<ICCRISubcategoria[]>([]);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [edit, setEdit] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [m, c, s] = await Promise.all([getMacrocategorias(), getCategorias(), getSubcategorias()]);
      setMacros(m);
      setCats(c);
      setSubs(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function toggle(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  async function handleSave() {
    if (!edit) return;
    setSaving(true);
    try {
      if (edit.type === "cat") {
        await upsertCategoria(edit.data as Partial<ICCRICategoria>);
      } else {
        await upsertSubcategoria(edit.data as Partial<ICCRISubcategoria>);
      }
      setEdit(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const inp = "w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

  if (loading) return <div className="flex justify-center p-12"><RefreshCw size={24} className="animate-spin text-blue-500" /></div>;

  return (
    <div className="max-w-5xl space-y-4">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Categorias ICCRI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{macros.length} macros · {cats.length} categorias · {subs.length} subcategorias</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors">
          <RefreshCw size={13} /> Atualizar
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Modal ediçÍo */}
      {edit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              {edit.data.id ? "Editar" : "Nova"} {edit.type === "cat" ? "Categoria" : "Subcategoria"}
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</label>
                <input className={inp} value={(edit.data as { codigo?: string }).codigo ?? ""}
                  onChange={e => setEdit({ ...edit, data: { ...edit.data, codigo: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nome</label>
                <input className={inp} value={(edit.data as { nome?: string }).nome ?? ""}
                  onChange={e => setEdit({ ...edit, data: { ...edit.data, nome: e.target.value } })} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">DescriçÍo</label>
                <textarea className={inp} rows={2} value={(edit.data as { descricao?: string }).descricao ?? ""}
                  onChange={e => setEdit({ ...edit, data: { ...edit.data, descricao: e.target.value } })} />
              </div>
              {edit.type === "cat" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Cor</label>
                    <input type="color" className="w-full h-9 rounded-lg border border-gray-300 dark:border-gray-600 cursor-pointer"
                      value={(edit.data as { cor_hex?: string }).cor_hex ?? "#6B7280"}
                      onChange={e => setEdit({ ...edit, data: { ...edit.data, cor_hex: e.target.value } })} />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Ícone (lucide)</label>
                    <input className={inp} placeholder="ex: Hammer"
                      value={(edit.data as { icone?: string }).icone ?? ""}
                      onChange={e => setEdit({ ...edit, data: { ...edit.data, icone: e.target.value } })} />
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setEdit(null)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <X size={14} className="inline mr-1" />Cancelar
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60">
                {saving ? <RefreshCw size={14} className="inline animate-spin mr-1" /> : <Save size={14} className="inline mr-1" />}
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabela expandível */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {macros.map(macro => {
          const macCats = cats.filter(c => c.macrocategoria_id === macro.id);
          const isMacroOpen = expanded.has(macro.id);
          return (
            <div key={macro.id}>
              {/* Macro row */}
              <button
                onClick={() => toggle(macro.id)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-750 hover:bg-gray-100 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-700 text-left transition-colors"
              >
                {isMacroOpen ? <ChevronDown size={15} className="text-gray-400" /> : <ChevronRight size={15} className="text-gray-400" />}
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400 w-28 uppercase tracking-wide">{macro.codigo}</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 flex-1">{macro.nome}</span>
                <span className="text-xs text-gray-400">{macCats.length} cats</span>
              </button>

              {isMacroOpen && macCats.map(cat => {
                const catSubs = subs.filter(s => s.categoria_id === cat.id);
                const isCatOpen = expanded.has(cat.id);
                return (
                  <div key={cat.id}>
                    {/* Cat row */}
                    <div className="flex items-center gap-3 px-4 py-2.5 pl-8 border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
                      <button onClick={() => toggle(cat.id)} className="flex items-center gap-2 flex-1 text-left">
                        {isCatOpen ? <ChevronDown size={13} className="text-gray-400 shrink-0" /> : <ChevronRight size={13} className="text-gray-400 shrink-0" />}
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ background: cat.cor_hex ?? "#6B7280" }}
                        />
                        <span className="text-xs text-gray-400 w-20 font-mono">{cat.codigo}</span>
                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{cat.nome}</span>
                        {cat.icone && <span className="text-xs text-gray-400 italic">{cat.icone}</span>}
                      </button>
                      <span className="text-xs text-gray-400">{catSubs.length} subs</span>
                      <button
                        onClick={() => setEdit({ type: "cat", data: { ...cat } })}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                      >
                        <Edit2 size={12} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => setEdit({ type: "sub", data: { categoria_id: cat.id, codigo: "", nome: "", ordem: catSubs.length } })}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-all"
                      >
                        <Plus size={12} className="text-blue-500" />
                      </button>
                    </div>

                    {/* Subcats */}
                    {isCatOpen && catSubs.map(sub => (
                      <div key={sub.id}
                        className="flex items-center gap-3 px-4 py-2 pl-16 border-b border-gray-100 dark:border-gray-700/30 hover:bg-gray-50 dark:hover:bg-gray-700/20 group"
                      >
                        <span className="text-xs text-gray-400 w-20 font-mono">{sub.codigo}</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">{sub.nome}</span>
                        <button
                          onClick={() => setEdit({ type: "sub", data: { ...sub } })}
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-all"
                        >
                          <Edit2 size={12} className="text-gray-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
              {isMacroOpen && (
                <button
                  onClick={() => setEdit({ type: "cat", data: { macrocategoria_id: macro.id, codigo: "", nome: "", cor_hex: "#6B7280", icone: "", ordem: macCats.length, ativo: true } })}
                  className="w-full flex items-center gap-2 px-4 py-2 pl-8 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-b border-gray-100 dark:border-gray-700/50 transition-colors"
                >
                  <Plus size={12} /> Nova Categoria em {macro.nome}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

