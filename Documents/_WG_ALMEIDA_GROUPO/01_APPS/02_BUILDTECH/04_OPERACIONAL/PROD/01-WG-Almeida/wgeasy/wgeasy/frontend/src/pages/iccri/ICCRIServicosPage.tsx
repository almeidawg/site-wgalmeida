// ============================================================
// ICCRI Serviços — CRUD completo de serviços e MDO
// Código · Unidade · Categoria · Tipo · Complexidade
// WG Easy · Sistema · MASTER only
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getServicos, getCategorias, getSubcategorias,
  upsertServico, deleteServico,
  type ICCRIServico, type ICCRICategoria, type ICCRISubcategoria,
} from "@/lib/iccriApi";
import {
  Plus, Search, Edit2, Trash2, Save, X, RefreshCw,
  ChevronRight, Layers,
} from "lucide-react";

const TIPOS = ["servico", "material", "mdo", "equipamento"] as const;
const PADROES = ["basico", "intermediario", "alto", "todos"] as const;
const COMPLEXIDADES = ["baixa", "media", "alta", "muito_alta"] as const;
const UNIDADES = ["m²", "m³", "m", "un", "kg", "saco", "lata", "rolo", "caixa", "dia", "ponto", "conjunto", "h"];

const TIPO_BADGE: Record<string, string> = {
  servico: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  material: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  mdo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  equipamento: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const COMPLEXIDADE_BADGE: Record<string, string> = {
  baixa: "bg-green-100 text-green-700",
  media: "bg-yellow-100 text-yellow-700",
  alta: "bg-orange-100 text-orange-700",
  muito_alta: "bg-red-100 text-red-700",
};

type Modal = { mode: "new" | "edit"; data: Partial<ICCRIServico> } | null;

const inp = "w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";
const sel = inp + " cursor-pointer";

export default function ICCRIServicosPage() {
  const navigate = useNavigate();
  const [servicos, setServicos] = useState<ICCRIServico[]>([]);
  const [cats, setCats] = useState<ICCRICategoria[]>([]);
  const [subs, setSubs] = useState<ICCRISubcategoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal>(null);

  // Filtros
  const [busca, setBusca] = useState("");
  const [filtCat, setFiltCat] = useState("");
  const [filtTipo, setFiltTipo] = useState("");
  const [pagina, setPagina] = useState(0);
  const PER_PAGE = 50;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, c, sb] = await Promise.all([
        getServicos({ busca: busca || undefined, categoria_id: filtCat || undefined, tipo: filtTipo || undefined }),
        getCategorias(),
        getSubcategorias(),
      ]);
      setServicos(s);
      setCats(c);
      setSubs(sb);
      setPagina(0);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [busca, filtCat, filtTipo]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!modal) return;
    setSaving(true);
    setError(null);
    try {
      await upsertServico(modal.data);
      setModal(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Inativar este serviço?")) return;
    await deleteServico(id);
    await load();
  }

  function setField(k: keyof ICCRIServico, v: unknown) {
    if (!modal) return;
    setModal({ ...modal, data: { ...modal.data, [k]: v } });
  }

  const paginados = servicos.slice(pagina * PER_PAGE, (pagina + 1) * PER_PAGE);
  const totalPag = Math.ceil(servicos.length / PER_PAGE);

  return (
    <div className="max-w-7xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Serviços ICCRI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{servicos.length} serviços · {cats.length} categorias</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-lg font-medium transition-colors">
            <RefreshCw size={13} />
          </button>
          <button
            onClick={() => setModal({ mode: "new", data: { tipo: "servico", padrao: "intermediario", complexidade: "media", ativo: true, unidade: "m²" } })}
            className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition-colors"
          >
            <Plus size={14} /> Novo Serviço
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex justify-between">
          {error} <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Buscar por nome..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={filtCat} onChange={e => setFiltCat(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
          <option value="">Todas as categorias</option>
          {cats.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
        </select>
        <select value={filtTipo} onChange={e => setFiltTipo(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none">
          <option value="">Todos os tipos</option>
          {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>

      {/* Tabela */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-10"><RefreshCw size={22} className="animate-spin text-blue-500" /></div>
        ) : paginados.length === 0 ? (
          <div className="text-center p-10 text-gray-400 text-sm">Nenhum serviço encontrado</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                <th className="px-4 py-3 text-left">Código</th>
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="px-4 py-3 text-left">Categoria</th>
                <th className="px-4 py-3 text-left">Tipo</th>
                <th className="px-4 py-3 text-left">Unid.</th>
                <th className="px-4 py-3 text-left">Complexidade</th>
                <th className="px-4 py-3 text-left">SINAPI</th>
                <th className="px-4 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {paginados.map(s => (
                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors group">
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{s.codigo}</td>
                  <td className="px-4 py-2.5">
                    <p className="font-medium text-gray-800 dark:text-gray-200">{s.nome}</p>
                    {s.descricao && <p className="text-xs text-gray-400 truncate max-w-xs">{s.descricao}</p>}
                  </td>
                  <td className="px-4 py-2.5">
                    {s.categoria && (
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        <span className="w-2 h-2 rounded-full inline-block mr-1" style={{ background: s.categoria.cor_hex ?? "#6B7280" }} />
                        {s.categoria.nome}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TIPO_BADGE[s.tipo] ?? ""}`}>
                      {s.tipo}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">{s.unidade}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${COMPLEXIDADE_BADGE[s.complexidade] ?? ""}`}>
                      {s.complexidade.replace("_", " ")}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-400">{s.codigo_sinapi ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => navigate(`/sistema/iccri/composicoes?servico=${s.id}`)}
                        className="p-1.5 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded text-blue-500 transition-colors"
                        title="Ver ComposiçÍo"
                      >
                        <Layers size={13} />
                      </button>
                      <button
                        onClick={() => setModal({ mode: "edit", data: { ...s } })}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(s.id)}
                        className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded text-red-500 transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                      <button
                        onClick={() => navigate(`/sistema/iccri/composicoes?servico=${s.id}`)}
                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-400 transition-colors"
                      >
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {totalPag > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500">Página {pagina + 1} de {totalPag} · {servicos.length} total</p>
            <div className="flex gap-1">
              <button onClick={() => setPagina(p => Math.max(0, p - 1))} disabled={pagina === 0}
                className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                ← Anterior
              </button>
              <button onClick={() => setPagina(p => Math.min(totalPag - 1, p + 1))} disabled={pagina >= totalPag - 1}
                className="px-3 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-700">
                Próxima →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl my-4">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              {modal.mode === "new" ? "Novo Serviço" : "Editar Serviço"}
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Código</label>
                  <input className={inp} placeholder="ex: 001-001" value={modal.data.codigo ?? ""}
                    onChange={e => setField("codigo", e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Unidade</label>
                  <select className={sel} value={modal.data.unidade ?? "m²"} onChange={e => setField("unidade", e.target.value)}>
                    {UNIDADES.map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Nome</label>
                <input className={inp} value={modal.data.nome ?? ""}
                  onChange={e => setField("nome", e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">DescriçÍo</label>
                <textarea className={inp} rows={2} value={modal.data.descricao ?? ""}
                  onChange={e => setField("descricao", e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Categoria</label>
                  <select className={sel} value={modal.data.categoria_id ?? ""} onChange={e => setField("categoria_id", e.target.value)}>
                    <option value="">— Selecione —</option>
                    {cats.map(c => <option key={c.id} value={c.id}>{c.codigo} — {c.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Subcategoria</label>
                  <select className={sel} value={modal.data.subcategoria_id ?? ""} onChange={e => setField("subcategoria_id", e.target.value)}>
                    <option value="">— Selecione —</option>
                    {subs.filter(s => !modal.data.categoria_id || s.categoria_id === modal.data.categoria_id)
                      .map(s => <option key={s.id} value={s.id}>{s.codigo} — {s.nome}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Tipo</label>
                  <select className={sel} value={modal.data.tipo ?? "servico"} onChange={e => setField("tipo", e.target.value)}>
                    {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">PadrÍo</label>
                  <select className={sel} value={modal.data.padrao ?? "intermediario"} onChange={e => setField("padrao", e.target.value)}>
                    {PADROES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Complexidade</label>
                  <select className={sel} value={modal.data.complexidade ?? "media"} onChange={e => setField("complexidade", e.target.value)}>
                    {COMPLEXIDADES.map(c => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Prod. Diária</label>
                  <input className={inp} type="number" placeholder="m² ou un/dia"
                    value={modal.data.produtividade_diaria ?? ""}
                    onChange={e => setField("produtividade_diaria", parseFloat(e.target.value) || null)} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Código SINAPI</label>
                  <input className={inp} placeholder="ex: 94971"
                    value={modal.data.codigo_sinapi ?? ""}
                    onChange={e => setField("codigo_sinapi", e.target.value || null)} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={() => setModal(null)} className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
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
    </div>
  );
}

