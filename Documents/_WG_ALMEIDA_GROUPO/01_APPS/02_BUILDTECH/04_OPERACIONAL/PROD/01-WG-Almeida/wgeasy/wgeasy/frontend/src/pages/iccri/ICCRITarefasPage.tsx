// ============================================================
// ICCRI Tarefas — Templates de tarefas de obra
// WG Almeida · ObraEasy · Motor de Precificação
// ============================================================

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getServicos, type ICCRIServico } from "@/lib/iccriApi";

interface ICCRITarefa {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  servico_id: string | null;
  unidade: string;
  duracao_dias: number;
  dependencias: string | null;
  fase: "planejamento" | "execucao" | "acabamento" | "entrega";
  ativa: boolean;
  criado_em: string;
}

const FASES: { value: ICCRITarefa["fase"]; label: string; color: string }[] = [
  { value: "planejamento", label: "Planejamento", color: "#60a5fa" },
  { value: "execucao",     label: "Execução",     color: "#34d399" },
  { value: "acabamento",   label: "Acabamento",   color: "#f59e0b" },
  { value: "entrega",      label: "Entrega",      color: "#a78bfa" },
];

const S: Record<string, React.CSSProperties> = {
  page:    { padding: 24, fontFamily: "'Inter',sans-serif", color: "#e2e8f0", background: "#0B0F1A", minHeight: "100vh" },
  header:  { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title:   { fontSize: 22, fontWeight: 800, margin: 0 },
  sub:     { fontSize: 13, color: "#64748b", marginTop: 4 },
  btnPri:  { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer" },
  filters: { display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" as const },
  input:   { background: "#1e2433", border: "1px solid #2d3a50", borderRadius: 8, color: "#e2e8f0", padding: "8px 12px", fontSize: 13, outline: "none" },
  table:   { width: "100%", borderCollapse: "collapse" as const, background: "#111827", borderRadius: 12, overflow: "hidden" },
  th:      { background: "#1e2433", color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".06em", padding: "12px 16px", textAlign: "left" as const },
  td:      { padding: "12px 16px", borderBottom: "1px solid #1f2937", fontSize: 13 },
  badge:   { borderRadius: 6, padding: "2px 8px", fontSize: 11, fontWeight: 700 },
  modal:   { position: "fixed" as const, inset: 0, background: "rgba(0,0,0,.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 },
  card:    { background: "#111827", border: "1px solid #1f2937", borderRadius: 16, padding: 28, width: 520, maxHeight: "80vh", overflowY: "auto" as const },
  label:   { display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 6 },
  field:   { width: "100%", background: "#1e2433", border: "1px solid #2d3a50", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  row:     { marginBottom: 16 },
  actions: { display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 20 },
  btnSec:  { background: "transparent", border: "1px solid #2d3a50", color: "#94a3b8", borderRadius: 8, padding: "9px 16px", fontSize: 13, cursor: "pointer" },
  warn:    { background: "rgba(251,191,36,.08)", border: "1px solid rgba(251,191,36,.25)", borderRadius: 12, padding: "16px 20px", marginBottom: 20 },
  empty:   { textAlign: "center" as const, padding: "60px 20px", color: "#64748b" },
};

const empty: Omit<ICCRITarefa, "id" | "criado_em"> = {
  codigo: "", nome: "", descricao: null, servico_id: null,
  unidade: "un", duracao_dias: 1, dependencias: null, fase: "execucao", ativa: true,
};

export default function ICCRITarefasPage() {
  const [tarefas, setTarefas]   = useState<ICCRITarefa[]>([]);
  const [servicos, setServicos] = useState<ICCRIServico[]>([]);
  const [loading, setLoading]   = useState(true);
  const [dbMissing, setDbMissing] = useState(false);
  const [busca, setBusca]       = useState("");
  const [filtroFase, setFiltroFase] = useState("");
  const [modal, setModal]       = useState<Partial<ICCRITarefa> | null>(null);
  const [saving, setSaving]     = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [{ data, error }, svcs] = await Promise.all([
        supabase.from("iccri_tarefas").select("*").order("codigo"),
        getServicos({ ativo: true }),
      ]);
      if (error?.code === "42P01") { setDbMissing(true); return; }
      if (error) throw error;
      setTarefas(data ?? []);
      setServicos(svcs);
    } catch {
      setDbMissing(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const filtered = tarefas.filter(t => {
    if (busca && !t.nome.toLowerCase().includes(busca.toLowerCase()) && !t.codigo.toLowerCase().includes(busca.toLowerCase())) return false;
    if (filtroFase && t.fase !== filtroFase) return false;
    return true;
  });

  async function save() {
    if (!modal) return;
    setSaving(true);
    try {
      if (modal.id) {
        await supabase.from("iccri_tarefas").update({ ...modal }).eq("id", modal.id);
      } else {
        await supabase.from("iccri_tarefas").insert({ ...modal, criado_em: new Date().toISOString() });
      }
      setModal(null);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function toggle(t: ICCRITarefa) {
    await supabase.from("iccri_tarefas").update({ ativa: !t.ativa }).eq("id", t.id);
    setTarefas(prev => prev.map(x => x.id === t.id ? { ...x, ativa: !x.ativa } : x));
  }

  const getFase = (f: string) => FASES.find(x => x.value === f);
  const getServico = (id: string | null) => servicos.find(s => s.id === id);

  return (
    <div style={S.page}>
      <div style={S.header}>
        <div>
          <h1 style={S.title}>Tarefas de Obra</h1>
          <p style={S.sub}>Templates de atividades vinculadas ao ICCRI · {tarefas.length} tarefas cadastradas</p>
        </div>
        {!dbMissing && (
          <button style={S.btnPri} onClick={() => setModal({ ...empty })}>+ Nova Tarefa</button>
        )}
      </div>

      {dbMissing && (
        <div style={S.warn}>
          <div style={{ fontWeight: 700, color: "#fbbf24", marginBottom: 6 }}>⚠️ Tabela iccri_tarefas não encontrada</div>
          <div style={{ fontSize: 12, color: "#d97706", lineHeight: 1.6 }}>
            Execute o SQL de migration no Supabase SQL Editor:<br />
            <code style={{ background: "rgba(0,0,0,.3)", padding: "2px 6px", borderRadius: 4, fontSize: 11 }}>
              CREATE TABLE iccri_tarefas (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, codigo text NOT NULL, nome text NOT NULL, descricao text, servico_id uuid REFERENCES iccri_servicos(id), unidade text DEFAULT 'un', duracao_dias int DEFAULT 1, dependencias text, fase text DEFAULT 'execucao', ativa boolean DEFAULT true, criado_em timestamptz DEFAULT now());
            </code>
          </div>
        </div>
      )}

      {!dbMissing && (
        <>
          <div style={S.filters}>
            <input style={{ ...S.input, width: 260 }} placeholder="Buscar por nome ou código..." value={busca} onChange={e => setBusca(e.target.value)} />
            <select style={S.input} value={filtroFase} onChange={e => setFiltroFase(e.target.value)}>
              <option value="">Todas as fases</option>
              {FASES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>

          {loading ? (
            <div style={S.empty}>Carregando...</div>
          ) : filtered.length === 0 ? (
            <div style={S.empty}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
              <div>Nenhuma tarefa cadastrada</div>
              <div style={{ fontSize: 12, marginTop: 8 }}>Clique em "Nova Tarefa" para começar</div>
            </div>
          ) : (
            <table style={S.table}>
              <thead>
                <tr>
                  <th style={S.th}>Código</th>
                  <th style={S.th}>Nome</th>
                  <th style={S.th}>Fase</th>
                  <th style={S.th}>Duração</th>
                  <th style={S.th}>Serviço</th>
                  <th style={S.th}>Status</th>
                  <th style={S.th}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const fase = getFase(t.fase);
                  const svc  = getServico(t.servico_id);
                  return (
                    <tr key={t.id} style={{ opacity: t.ativa ? 1 : 0.45 }}>
                      <td style={{ ...S.td, fontFamily: "monospace", color: "#94a3b8", fontSize: 12 }}>{t.codigo}</td>
                      <td style={{ ...S.td, fontWeight: 600 }}>{t.nome}</td>
                      <td style={S.td}>
                        {fase && (
                          <span style={{ ...S.badge, background: fase.color + "22", color: fase.color }}>{fase.label}</span>
                        )}
                      </td>
                      <td style={S.td}>{t.duracao_dias}d</td>
                      <td style={{ ...S.td, fontSize: 12, color: "#94a3b8" }}>{svc?.nome ?? "—"}</td>
                      <td style={S.td}>
                        <span style={{ ...S.badge, background: t.ativa ? "rgba(52,211,153,.12)" : "rgba(148,163,184,.1)", color: t.ativa ? "#34d399" : "#94a3b8" }}>
                          {t.ativa ? "Ativa" : "Inativa"}
                        </span>
                      </td>
                      <td style={S.td}>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button style={{ ...S.btnSec, padding: "5px 10px", fontSize: 12 }} onClick={() => setModal(t)}>✏️</button>
                          <button style={{ ...S.btnSec, padding: "5px 10px", fontSize: 12 }} onClick={() => toggle(t)}>{t.ativa ? "🔇" : "✅"}</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      {modal && (
        <div style={S.modal} onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div style={S.card}>
            <h2 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 800 }}>
              {modal.id ? "Editar Tarefa" : "Nova Tarefa"}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={S.row}>
                <label style={S.label}>Código</label>
                <input style={S.field} value={modal.codigo ?? ""} onChange={e => setModal(m => ({ ...m!, codigo: e.target.value }))} placeholder="TRF-001" />
              </div>
              <div style={S.row}>
                <label style={S.label}>Unidade</label>
                <input style={S.field} value={modal.unidade ?? "un"} onChange={e => setModal(m => ({ ...m!, unidade: e.target.value }))} />
              </div>
            </div>
            <div style={S.row}>
              <label style={S.label}>Nome</label>
              <input style={S.field} value={modal.nome ?? ""} onChange={e => setModal(m => ({ ...m!, nome: e.target.value }))} placeholder="Ex: Chapisco e Emboço de parede" />
            </div>
            <div style={S.row}>
              <label style={S.label}>Descrição</label>
              <textarea style={{ ...S.field, height: 72, resize: "none" }} value={modal.descricao ?? ""} onChange={e => setModal(m => ({ ...m!, descricao: e.target.value }))} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
              <div style={S.row}>
                <label style={S.label}>Fase</label>
                <select style={S.field} value={modal.fase ?? "execucao"} onChange={e => setModal(m => ({ ...m!, fase: e.target.value as ICCRITarefa["fase"] }))}>
                  {FASES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>
              <div style={S.row}>
                <label style={S.label}>Duração (dias)</label>
                <input style={S.field} type="number" min={1} value={modal.duracao_dias ?? 1} onChange={e => setModal(m => ({ ...m!, duracao_dias: +e.target.value }))} />
              </div>
            </div>
            <div style={S.row}>
              <label style={S.label}>Serviço ICCRI vinculado</label>
              <select style={S.field} value={modal.servico_id ?? ""} onChange={e => setModal(m => ({ ...m!, servico_id: e.target.value || null }))}>
                <option value="">— Nenhum —</option>
                {servicos.map(s => <option key={s.id} value={s.id}>{s.codigo} — {s.nome}</option>)}
              </select>
            </div>
            <div style={S.row}>
              <label style={S.label}>Dependências (texto livre)</label>
              <input style={S.field} value={modal.dependencias ?? ""} onChange={e => setModal(m => ({ ...m!, dependencias: e.target.value || null }))} placeholder="Ex: TRF-002, TRF-003" />
            </div>
            <div style={S.actions}>
              <button style={S.btnSec} onClick={() => setModal(null)}>Cancelar</button>
              <button style={{ ...S.btnPri, opacity: saving ? .6 : 1 }} disabled={saving} onClick={save}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
