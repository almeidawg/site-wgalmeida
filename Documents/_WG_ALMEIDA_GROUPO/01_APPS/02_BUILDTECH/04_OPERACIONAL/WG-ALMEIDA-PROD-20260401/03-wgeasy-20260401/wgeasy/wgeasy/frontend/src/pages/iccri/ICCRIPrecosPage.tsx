// ============================================================
// ICCRI Preços Regionais — GestÍo por estado/tipo-cidade
// WG Easy · Sistema · MASTER only
// ============================================================

import React, { useEffect, useState } from "react";
import {
  getPrecosRegionais, upsertPrecoRegional, deletePrecoRegional,
  type ICCRIPrecoRegional,
} from "@/lib/iccriApi";
import { Plus, Edit2, Save, X, RefreshCw, Trash2 } from "lucide-react";

const ESTADOS = [
  "AC","AL","AM","AP","BA","CE","DF","ES","GO","MA","MG","MS","MT","PA",
  "PB","PE","PI","PR","RJ","RN","RO","RR","RS","SC","SE","SP","TO",
];

const ESTADOS_NOMES: Record<string, string> = {
  AC:"Acre",AL:"Alagoas",AM:"Amazonas",AP:"Amapá",BA:"Bahia",CE:"Ceará",
  DF:"Distrito Federal",ES:"Espírito Santo",GO:"Goiás",MA:"MaranhÍo",
  MG:"Minas Gerais",MS:"Mato Grosso do Sul",MT:"Mato Grosso",PA:"Pará",
  PB:"Paraíba",PE:"Pernambuco",PI:"Piauí",PR:"Paraná",RJ:"Rio de Janeiro",
  RN:"Rio Grande do Norte",RO:"Rondônia",RR:"Roraima",RS:"Rio Grande do Sul",
  SC:"Santa Catarina",SE:"Sergipe",SP:"SÍo Paulo",TO:"Tocantins",
};

type EditState = Partial<ICCRIPrecoRegional> | null;

const inp = "w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500";

function fatorColor(v: number) {
  if (v >= 1.0) return "text-green-600 dark:text-green-400";
  if (v >= 0.85) return "text-yellow-600 dark:text-yellow-400";
  return "text-red-600 dark:text-red-400";
}

export default function ICCRIPrecosPage() {
  const [precos, setPrecos] = useState<ICCRIPrecoRegional[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [edit, setEdit] = useState<EditState>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [filtEstado, setFiltEstado] = useState("");

  async function load() {
    setLoading(true);
    try {
      const data = await getPrecosRegionais();
      setPrecos(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!edit) return;
    setSaving(true);
    try {
      await upsertPrecoRegional(edit as Partial<ICCRIPrecoRegional>);
      setEdit(null);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este preço regional?")) return;
    setDeleting(id);
    try {
      await deletePrecoRegional(id);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao remover");
    } finally {
      setDeleting(null);
    }
  }

  const filtered = filtEstado
    ? precos.filter(p => p.estado === filtEstado)
    : precos;

  // Group by estado
  const grouped = ESTADOS.reduce<Record<string, ICCRIPrecoRegional[]>>((acc, uf) => {
    const rows = filtered.filter(p => p.estado === uf);
    if (rows.length > 0) acc[uf] = rows;
    return acc;
  }, {});

  if (loading) return (
    <div className="flex justify-center p-12">
      <RefreshCw size={24} className="animate-spin text-blue-500" />
    </div>
  );

  return (
    <div className="max-w-5xl space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Preços Regionais ICCRI</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {precos.length} registros · Fatores por estado e tipo de cidade
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filtEstado}
            onChange={e => setFiltEstado(e.target.value)}
            className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os estados</option>
            {ESTADOS.map(uf => (
              <option key={uf} value={uf}>{uf} — {ESTADOS_NOMES[uf]}</option>
            ))}
          </select>
          <button
            onClick={() => setEdit({ estado: "", cidade_tipo: "capital", fator_regional: 1.0, ativo: true })}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <Plus size={14} /> Novo
          </button>
          <button
            onClick={load}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg font-medium transition-colors"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-600 text-sm flex justify-between">
          {error}
          <button onClick={() => setError(null)}><X size={14} /></button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-sm text-blue-700 dark:text-blue-300">
        <strong>Referência:</strong> SP Capital = 1.00 · Fórmula: P = (MDO + MAT + EQP) × <strong>Fator Regional</strong> × ÍÍndice ICCRI × Margem
      </div>

      {/* Modal */}
      {edit && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
              {edit.id ? "Editar" : "Novo"} Preço Regional
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Estado</label>
                  <select
                    className={inp}
                    value={edit.estado ?? ""}
                    onChange={e => setEdit({ ...edit, estado: e.target.value })}
                  >
                    <option value="">Selecione</option>
                    {ESTADOS.map(uf => (
                      <option key={uf} value={uf}>{uf} — {ESTADOS_NOMES[uf]}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Tipo</label>
                  <select
                    className={inp}
                    value={edit.cidade_tipo ?? "capital"}
                    onChange={e => setEdit({ ...edit, cidade_tipo: e.target.value as "capital" | "interior" })}
                  >
                    <option value="capital">Capital</option>
                    <option value="interior">Interior</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                  Fator Regional (SP Capital = 1.00)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.5"
                  className={inp}
                  value={edit.fator_regional ?? 1.0}
                  onChange={e => setEdit({ ...edit, fator_regional: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Fonte</label>
                <input
                  className={inp}
                  placeholder="ex: SINAPI, Pesquisa WG, etc."
                  value={edit.fonte ?? ""}
                  onChange={e => setEdit({ ...edit, fonte: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vigência (mês/ano)</label>
                <input
                  className={inp}
                  placeholder="ex: Mar/2026"
                  value={edit.vigencia ?? ""}
                  onChange={e => setEdit({ ...edit, vigencia: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Observações</label>
                <textarea
                  className={inp}
                  rows={2}
                  value={edit.observacoes ?? ""}
                  onChange={e => setEdit({ ...edit, observacoes: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ativo"
                  checked={edit.ativo ?? true}
                  onChange={e => setEdit({ ...edit, ativo: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="ativo" className="text-sm text-gray-700 dark:text-gray-300">Ativo</label>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button
                onClick={() => setEdit(null)}
                className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <X size={14} className="inline mr-1" />Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors disabled:opacity-60"
              >
                {saving ? <RefreshCw size={14} className="inline animate-spin mr-1" /> : <Save size={14} className="inline mr-1" />}
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750">
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Estado</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Tipo</th>
              <th className="px-4 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fator Regional</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Vigência</th>
              <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Fonte</th>
              <th className="px-4 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
              <th className="px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {Object.keys(grouped).length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">
                  Nenhum preço regional cadastrado
                </td>
              </tr>
            )}
            {Object.entries(grouped).map(([uf, rows]) => (
              <React.Fragment key={uf}>
                {/* Estado header row */}
                <tr className="bg-gray-50 dark:bg-gray-750 border-b border-gray-200 dark:border-gray-700">
                  <td colSpan={7} className="px-4 py-1.5">
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {uf} — {ESTADOS_NOMES[uf]}
                    </span>
                  </td>
                </tr>
                {rows.map(p => (
                  <tr
                    key={p.id}
                    className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 group"
                  >
                    <td className="px-4 py-2.5 font-mono text-xs font-bold text-gray-600 dark:text-gray-400">{p.estado}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                        p.cidade_tipo === "capital"
                          ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                      }`}>
                        {p.cidade_tipo === "capital" ? "Capital" : "Interior"}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-bold font-mono ${fatorColor(p.fator_regional)}`}>
                      {(p.fator_regional ?? 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{p.vigencia ?? "—"}</td>
                    <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 text-xs">{p.fonte ?? "—"}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className={`inline-block w-2 h-2 rounded-full ${p.ativo ? "bg-green-500" : "bg-gray-300"}`} />
                    </td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => setEdit({ ...p })}
                          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                        >
                          <Edit2 size={12} className="text-gray-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"
                        >
                          {deleting === p.id
                            ? <RefreshCw size={12} className="text-red-400 animate-spin" />
                            : <Trash2 size={12} className="text-red-400" />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Referência rápida */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h3 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
          Referência — Fatores Sugeridos (SINAPI 2025)
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-400">
          {[
            {uf:"SP",cap:1.00,int:0.88},{uf:"RJ",cap:0.97,int:0.84},{uf:"MG",cap:0.89,int:0.77},
            {uf:"RS",cap:0.87,int:0.76},{uf:"PR",cap:0.86,int:0.75},{uf:"SC",cap:0.85,int:0.74},
            {uf:"GO",cap:0.82,int:0.72},{uf:"DF",cap:0.90,int:0.80},{uf:"BA",cap:0.80,int:0.69},
            {uf:"PE",cap:0.79,int:0.68},{uf:"CE",cap:0.78,int:0.67},{uf:"AM",cap:0.82,int:0.70},
            {uf:"PA",cap:0.77,int:0.66},{uf:"MT",cap:0.80,int:0.70},{uf:"MS",cap:0.79,int:0.69},
            {uf:"AC",cap:0.73,int:0.63},
          ].map(({ uf, cap, int }) => (
            <div key={uf} className="flex items-center justify-between px-2 py-1 bg-gray-50 dark:bg-gray-700/50 rounded">
              <span className="font-bold">{uf}</span>
              <span className={`${fatorColor(cap)}`}>{(cap ?? 0).toFixed(2)}</span>
              <span className="text-gray-400">/</span>
              <span className={`${fatorColor(int)}`}>{(int ?? 0).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">Cap / Int</p>
      </div>
    </div>
  );
}

