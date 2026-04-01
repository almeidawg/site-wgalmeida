// ============================================================
// ICCRI Composições — GestÍo de composições por serviço
// MDO + Materiais + Equipamentos · Fórmulas e Cálculos
// WG Easy · Sistema · MASTER only
// ============================================================

import React, { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  getServicos, getServico, getComposicoesByServico, getComposicaoItens,
  upsertComposicaoItem, deleteComposicaoItem, calcularComposicao,
  type ICCRIServico, type ICCRIComposicao, type ICCRIComposicaoItem,
  type CalculoComposicaoOutput,
} from "@/lib/iccriApi";
import {
  Search, Plus, Trash2, Save, X, RefreshCw,
  Calculator, ChevronDown, Layers, AlertTriangle,
} from "lucide-react";

const TIPOS_ITEM = ["material", "mdo", "equipamento"] as const;
const UNIDADES = ["m²", "m³", "m", "un", "kg", "saco", "lata", "rolo", "caixa", "dia", "h", "ponto"];

const TIPO_COLOR: Record<string, string> = {
  mdo: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  material: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  equipamento: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
};

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const fmtN = (v: number) => v.toLocaleString("pt-BR", { maximumFractionDigits: 4 });

const inp = "w-full px-2.5 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function ICCRIComposicoesPage() {
  const [searchParams] = useSearchParams();
  const servicoIdParam = searchParams.get("servico");

  const [servicos, setServicos] = useState<ICCRIServico[]>([]);
  const [servicoSel, setServicoSel] = useState<ICCRIServico | null>(null);
  const [composicoes, setComposicoes] = useState<ICCRIComposicao[]>([]);
  const [composicaoSel, setComposicaoSel] = useState<ICCRIComposicao | null>(null);
  const [itens, setItens] = useState<ICCRIComposicaoItem[]>([]);
  const [busca, setBusca] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Novo item inline
  const NOVO_ITEM: Partial<ICCRIComposicaoItem> = {
    tipo: "material", nome: "", unidade: "un", quantidade: 1,
    coeficiente: 1, fator_perda: 0.05, preco_ref_sp: 0,
  };
  const [novoItem, setNovoItem] = useState<Partial<ICCRIComposicaoItem>>(NOVO_ITEM);
  const [addingItem, setAddingItem] = useState(false);

  // SimulaçÍo de preço
  const [simEstado, setSimEstado] = useState("SP");
  const [simCidade, setSimCidade] = useState<"capital" | "interior">("capital");
  const [simPadrao, setSimPadrao] = useState<"basico" | "intermediario" | "alto">("intermediario");
  const [simQtd, setSimQtd] = useState(1);
  const [calculo, setCalculo] = useState<CalculoComposicaoOutput | null>(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Carregar serviços
  useEffect(() => {
    getServicos().then(setServicos);
  }, []);

  // Se vier parâmetro da URL, selecionar automaticamente
  useEffect(() => {
    if (servicoIdParam) {
      getServico(servicoIdParam).then(s => {
        if (s) selecionarServico(s);
      });
    }
  }, [servicoIdParam]);

  const selecionarServico = useCallback(async (s: ICCRIServico) => {
    setServicoSel(s);
    setComposicaoSel(null);
    setItens([]);
    setCalculo(null);
    setLoading(true);
    try {
      const comps = await getComposicoesByServico(s.id);
      setComposicoes(comps);
      if (comps.length > 0) {
        const ativa = comps.find(c => c.ativa) ?? comps[0];
        setComposicaoSel(ativa);
        const its = await getComposicaoItens(ativa.id);
        setItens(its);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setLoading(false);
    }
  }, []);

  const selecionarComposicao = async (comp: ICCRIComposicao) => {
    setComposicaoSel(comp);
    setCalculo(null);
    const its = await getComposicaoItens(comp.id);
    setItens(its);
  };

  async function handleSaveItem(item?: Partial<ICCRIComposicaoItem>) {
    if (!composicaoSel) return;
    const payload = item ?? { ...novoItem, composicao_id: composicaoSel.id };
    if (!payload.composicao_id) payload.composicao_id = composicaoSel.id;
    setSaving(payload.id ?? "new");
    setError(null);
    try {
      await upsertComposicaoItem(payload);
      const its = await getComposicaoItens(composicaoSel.id);
      setItens(its);
      if (!payload.id) { setNovoItem(NOVO_ITEM); setAddingItem(false); }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(null);
    }
  }

  async function handleDeleteItem(id: string) {
    if (!composicaoSel) return;
    if (!confirm("Remover este item?")) return;
    await deleteComposicaoItem(id);
    const its = await getComposicaoItens(composicaoSel.id);
    setItens(its);
  }

  async function handleCalcular() {
    if (!composicaoSel) return;
    setCalcLoading(true);
    try {
      const r = await calcularComposicao({
        composicao_id: composicaoSel.id,
        quantidade: simQtd,
        estado: simEstado,
        cidade_tipo: simCidade,
        padrao: simPadrao,
      });
      setCalculo(r);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erro no cálculo");
    } finally {
      setCalcLoading(false);
    }
  }

  // Totais por tipo
  const totalMDO = itens.filter(i => i.tipo === "mdo").length;
  const totalMat = itens.filter(i => i.tipo === "material").length;
  const totalEqp = itens.filter(i => i.tipo === "equipamento").length;
  const servicosFiltrados = servicos.filter(s =>
    !busca || s.nome.toLowerCase().includes(busca.toLowerCase()) || s.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div className="max-w-7xl">
      <h1 className="text-xl font-black text-gray-900 dark:text-white mb-4">Composições ICCRI</h1>

      <div className="grid grid-cols-12 gap-4 h-[calc(100vh-12rem)]">

        {/* Painel esquerdo — Lista de serviços */}
        <div className="col-span-3 flex flex-col bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-3 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                placeholder="Buscar serviço..."
                value={busca}
                onChange={e => setBusca(e.target.value)}
                className="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
            {servicosFiltrados.map(s => (
              <button
                key={s.id}
                onClick={() => selecionarServico(s)}
                className={`w-full text-left px-3 py-2.5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${servicoSel?.id === s.id ? "bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500" : ""}`}
              >
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{s.nome}</p>
                <p className="text-xs text-gray-400 font-mono">{s.codigo} · {s.unidade}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Painel central — Itens da composiçÍo */}
        <div className="col-span-6 flex flex-col space-y-3 overflow-y-auto">
          {!servicoSel ? (
            <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-10">
              <div className="text-center">
                <Layers size={32} className="mx-auto mb-2 opacity-30" />
                Selecione um serviço para ver/editar a composiçÍo
              </div>
            </div>
          ) : (
            <>
              {/* Header serviço */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-black text-gray-900 dark:text-white">{servicoSel.nome}</p>
                    <p className="text-xs text-gray-400">{servicoSel.codigo} · {servicoSel.unidade} · {servicoSel.complexidade}</p>
                  </div>
                  <div className="flex gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">{totalMDO} MDO</span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">{totalMat} MAT</span>
                    <span className="px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700">{totalEqp} EQP</span>
                  </div>
                </div>

                {/* Seletor de composiçÍo */}
                {composicoes.length > 1 && (
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {composicoes.map(c => (
                      <button
                        key={c.id}
                        onClick={() => selecionarComposicao(c)}
                        className={`text-xs px-3 py-1 rounded-full border transition-colors ${composicaoSel?.id === c.id ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                      >
                        v{c.versao} {c.ativa ? "✓" : ""}
                      </button>
                    ))}
                  </div>
                )}

                {composicoes.length === 0 && (
                  <div className="mt-2 flex items-center gap-2 text-amber-600 text-xs">
                    <AlertTriangle size={13} />
                    Sem composiçÍo. Adicione itens abaixo para criar automaticamente.
                  </div>
                )}
              </div>

              {loading ? (
                <div className="flex justify-center p-8"><RefreshCw size={20} className="animate-spin text-blue-500" /></div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {error && (
                    <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-xs flex justify-between">
                      {error} <button onClick={() => setError(null)}><X size={12} /></button>
                    </div>
                  )}

                  {/* Tabela de itens */}
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                        <th className="px-3 py-2 text-left">Tipo</th>
                        <th className="px-3 py-2 text-left">Nome</th>
                        <th className="px-3 py-2 text-right">Qtd</th>
                        <th className="px-3 py-2 text-left">Un.</th>
                        <th className="px-3 py-2 text-right">Perda%</th>
                        <th className="px-3 py-2 text-right">R$/un SP</th>
                        <th className="px-3 py-2 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {itens.map(item => (
                        <EditableItemRow
                          key={item.id}
                          item={item}
                          onSave={updated => handleSaveItem(updated)}
                          onDelete={() => handleDeleteItem(item.id)}
                          saving={saving === item.id}
                        />
                      ))}

                      {/* Linha novo item */}
                      {addingItem && (
                        <tr className="bg-blue-50/50 dark:bg-blue-900/10">
                          <td className="px-3 py-1.5">
                            <select className={inp} value={novoItem.tipo} onChange={e => setNovoItem(p => ({ ...p, tipo: e.target.value as "material" | "mdo" | "equipamento" }))}>
                              {TIPOS_ITEM.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input className={inp} placeholder="Nome do item" value={novoItem.nome ?? ""} onChange={e => setNovoItem(p => ({ ...p, nome: e.target.value }))} />
                          </td>
                          <td className="px-3 py-1.5">
                            <input className={`${inp} text-right`} type="number" step="0.001" value={novoItem.quantidade ?? 1} onChange={e => setNovoItem(p => ({ ...p, quantidade: parseFloat(e.target.value) }))} />
                          </td>
                          <td className="px-3 py-1.5">
                            <select className={inp} value={novoItem.unidade ?? "un"} onChange={e => setNovoItem(p => ({ ...p, unidade: e.target.value }))}>
                              {UNIDADES.map(u => <option key={u}>{u}</option>)}
                            </select>
                          </td>
                          <td className="px-3 py-1.5">
                            <input className={`${inp} text-right`} type="number" step="0.01" placeholder="0.05" value={novoItem.fator_perda ?? 0.05} onChange={e => setNovoItem(p => ({ ...p, fator_perda: parseFloat(e.target.value) }))} />
                          </td>
                          <td className="px-3 py-1.5">
                            <input className={`${inp} text-right`} type="number" step="0.01" value={novoItem.preco_ref_sp ?? 0} onChange={e => setNovoItem(p => ({ ...p, preco_ref_sp: parseFloat(e.target.value) }))} />
                          </td>
                          <td className="px-3 py-1.5">
                            <div className="flex gap-1 justify-end">
                              <button onClick={() => handleSaveItem()} disabled={saving === "new"} className="p-1 bg-blue-600 rounded text-white hover:bg-blue-700">
                                {saving === "new" ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
                              </button>
                              <button onClick={() => { setAddingItem(false); setNovoItem(NOVO_ITEM); }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-500">
                                <X size={11} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {!addingItem && composicaoSel && (
                    <button
                      onClick={() => setAddingItem(true)}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-t border-gray-100 dark:border-gray-700 transition-colors"
                    >
                      <Plus size={12} /> Adicionar item à composiçÍo
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Painel direito — Simulador de preço */}
        <div className="col-span-3 flex flex-col space-y-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Calculator size={15} className="text-blue-500" />
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase">Simulador de Preço</p>
            </div>

            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">Estado</label>
              <input className={inp} value={simEstado} onChange={e => setSimEstado(e.target.value.toUpperCase())} maxLength={2} />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">Tipo cidade</label>
              <select className={`${inp} cursor-pointer`} value={simCidade} onChange={e => setSimCidade(e.target.value as "capital" | "interior")}>
                <option value="capital">Capital</option>
                <option value="interior">Interior</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">PadrÍo</label>
              <select className={`${inp} cursor-pointer`} value={simPadrao} onChange={e => setSimPadrao(e.target.value as "basico" | "intermediario" | "alto")}>
                <option value="basico">Básico</option>
                <option value="intermediario">Intermediário</option>
                <option value="alto">Alto</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 font-semibold uppercase">Quantidade ({servicoSel?.unidade ?? "un"})</label>
              <input className={inp} type="number" min={0.1} step={0.5} value={simQtd} onChange={e => setSimQtd(parseFloat(e.target.value))} />
            </div>

            <button
              onClick={handleCalcular}
              disabled={!composicaoSel || calcLoading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2"
            >
              {calcLoading ? <RefreshCw size={13} className="animate-spin" /> : <Calculator size={13} />}
              {calcLoading ? "Calculando..." : "Calcular Preço"}
            </button>
          </div>

          {/* Resultado do cálculo */}
          {calculo && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-blue-200 dark:border-blue-700 p-4 space-y-2">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">Resultado</p>
              <div className="text-center py-2">
                <p className="text-2xl font-black text-gray-900 dark:text-white">{fmt(calculo.preco_final)}</p>
                <p className="text-xs text-gray-500">= {fmt(calculo.preco_por_unidade)} / {servicoSel?.unidade}</p>
              </div>
              <div className="space-y-1 text-xs">
                {[
                  { l: "MDO", v: calculo.custo_mdo, c: "text-purple-600" },
                  { l: "Materiais", v: calculo.custo_materiais, c: "text-amber-600" },
                  { l: "Equipamentos", v: calculo.custo_equipamentos, c: "text-cyan-600" },
                  { l: "Base total", v: calculo.custo_base, c: "text-gray-700 dark:text-gray-300 font-bold" },
                ].map(({ l, v, c }) => (
                  <div key={l} className="flex justify-between">
                    <span className="text-gray-500">{l}</span>
                    <span className={c}>{fmt(v)}</span>
                  </div>
                ))}
                <div className="pt-1 border-t border-gray-100 dark:border-gray-700 space-y-1">
                  <div className="flex justify-between"><span className="text-gray-500">Fator regional</span><span>×{calculo.fator_regional.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Fator ICCRI</span><span>×{calculo.fator_iccri.toFixed(3)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Margem</span><span>×{calculo.margem.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Linha editável inline ───────────────────────────────────

function EditableItemRow({
  item, onSave, onDelete, saving,
}: {
  item: ICCRIComposicaoItem;
  onSave: (updated: Partial<ICCRIComposicaoItem>) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Partial<ICCRIComposicaoItem>>(item);
  const inp = "w-full px-1.5 py-0.5 text-xs border border-blue-300 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none";

  if (!editing) {
    return (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/30 group">
        <td className="px-3 py-1.5">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${TIPO_COLOR[item.tipo] ?? ""}`}>{item.tipo}</span>
        </td>
        <td className="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300">{item.nome}</td>
        <td className="px-3 py-1.5 text-right text-xs tabular-nums">{fmtN(item.quantidade)}</td>
        <td className="px-3 py-1.5 text-xs text-gray-500">{item.unidade}</td>
        <td className="px-3 py-1.5 text-right text-xs text-gray-500">{(item.fator_perda * 100).toFixed(0)}%</td>
        <td className="px-3 py-1.5 text-right text-xs tabular-nums">{item.preco_ref_sp != null ? `R$ ${item.preco_ref_sp.toFixed(2)}` : "—"}</td>
        <td className="px-3 py-1.5">
          <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setEditing(true)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400">
              <ChevronDown size={11} />
            </button>
            <button onClick={onDelete} className="p-1 hover:bg-red-100 rounded text-red-400">
              <Trash2 size={11} />
            </button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="bg-blue-50/30 dark:bg-blue-900/10">
      <td className="px-3 py-1">
        <select className={inp} value={draft.tipo} onChange={e => setDraft(d => ({ ...d, tipo: e.target.value as "material" | "mdo" | "equipamento" }))}>
          {["material", "mdo", "equipamento"].map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </td>
      <td className="px-3 py-1">
        <input className={inp} value={draft.nome ?? ""} onChange={e => setDraft(d => ({ ...d, nome: e.target.value }))} />
      </td>
      <td className="px-3 py-1">
        <input className={`${inp} text-right`} type="number" step="0.001" value={draft.quantidade ?? 1} onChange={e => setDraft(d => ({ ...d, quantidade: parseFloat(e.target.value) }))} />
      </td>
      <td className="px-3 py-1">
        <select className={inp} value={draft.unidade ?? "un"} onChange={e => setDraft(d => ({ ...d, unidade: e.target.value }))}>
          {["m²", "m³", "m", "un", "kg", "saco", "lata", "rolo", "caixa", "dia", "h", "ponto"].map(u => <option key={u}>{u}</option>)}
        </select>
      </td>
      <td className="px-3 py-1">
        <input className={`${inp} text-right`} type="number" step="0.01" value={draft.fator_perda ?? 0.05} onChange={e => setDraft(d => ({ ...d, fator_perda: parseFloat(e.target.value) }))} />
      </td>
      <td className="px-3 py-1">
        <input className={`${inp} text-right`} type="number" step="0.01" value={draft.preco_ref_sp ?? 0} onChange={e => setDraft(d => ({ ...d, preco_ref_sp: parseFloat(e.target.value) }))} />
      </td>
      <td className="px-3 py-1">
        <div className="flex gap-1 justify-end">
          <button onClick={() => { onSave(draft); setEditing(false); }} disabled={saving}
            className="p-1 bg-blue-600 rounded text-white hover:bg-blue-700">
            {saving ? <RefreshCw size={11} className="animate-spin" /> : <Save size={11} />}
          </button>
          <button onClick={() => setEditing(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-400">
            <X size={11} />
          </button>
        </div>
      </td>
    </tr>
  );
}

