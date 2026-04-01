// ============================================================
// ICCRI Fluxos — Projeção de Fluxo de Caixa de Obras
// WG Almeida · ObraEasy · baseado em preços ICCRI regionais
// ============================================================

import React, { useState, useEffect } from "react";
import { getindiceAtual, type ICCRIindice } from "@/lib/iccriApi";

const ESTADOS = [
  "SP","RJ","MG","ES","DF","GO","MT","MS","PR","SC","RS",
  "BA","PE","CE","MA","PI","RN","PB","AL","SE","PA","AM",
  "AC","RO","RR","AP","TO"
];

const FATOR_REGIONAL: Record<string, { capital: number; interior: number }> = {
  SP:{capital:1.00,interior:0.83},RJ:{capital:0.95,interior:0.82},MG:{capital:0.86,interior:0.76},
  ES:{capital:0.83,interior:0.75},DF:{capital:0.93,interior:0.93},GO:{capital:0.82,interior:0.74},
  MT:{capital:0.80,interior:0.72},MS:{capital:0.80,interior:0.73},PR:{capital:0.89,interior:0.80},
  SC:{capital:0.90,interior:0.82},RS:{capital:0.87,interior:0.79},BA:{capital:0.80,interior:0.71},
  PE:{capital:0.79,interior:0.70},CE:{capital:0.79,interior:0.69},MA:{capital:0.74,interior:0.66},
  PI:{capital:0.73,interior:0.65},RN:{capital:0.76,interior:0.68},PB:{capital:0.75,interior:0.67},
  AL:{capital:0.74,interior:0.66},SE:{capital:0.76,interior:0.68},PA:{capital:0.75,interior:0.67},
  AM:{capital:0.77,interior:0.69},AC:{capital:0.72,interior:0.64},RO:{capital:0.73,interior:0.65},
  RR:{capital:0.71,interior:0.63},AP:{capital:0.72,interior:0.64},TO:{capital:0.73,interior:0.65},
};

// Distribuição mensal de obra (curva S simplificada)
function curvaS(meses: number): number[] {
  // Distribuição em S: início lento, pico no meio, fim lento
  const dist: number[] = [];
  for (let i = 0; i < meses; i++) {
    const x = (i + 0.5) / meses;
    // Função sigmoide: concentração maior no meio
    const v = Math.sin(Math.PI * x);
    dist.push(v);
  }
  const total = dist.reduce((a, b) => a + b, 0);
  return dist.map(v => v / total);
}

interface Linha {
  mes: number;
  label: string;
  materiais: number;
  mdo: number;
  total: number;
  acumulado: number;
}

const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const pct = (v: number) => v.toFixed(1) + "%";

const S: Record<string, React.CSSProperties> = {
  page:   { padding: 24, fontFamily: "'Inter',sans-serif", color: "#e2e8f0", background: "#0B0F1A", minHeight: "100vh" },
  title:  { fontSize: 22, fontWeight: 800, margin: "0 0 4px" },
  sub:    { fontSize: 13, color: "#64748b", marginBottom: 24 },
  grid:   { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16, marginBottom: 28 },
  card:   { background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 18 },
  clabel: { fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".06em", color: "#64748b", marginBottom: 8 },
  cval:   { fontSize: 22, fontWeight: 800, color: "#e2e8f0" },
  csub:   { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  inputs: { background: "#111827", border: "1px solid #1f2937", borderRadius: 14, padding: 20, marginBottom: 24 },
  row:    { display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 16 },
  label:  { display: "block", fontSize: 11, fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" as const, letterSpacing: ".06em", marginBottom: 6 },
  select: { width: "100%", background: "#1e2433", border: "1px solid #2d3a50", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none" },
  input:  { width: "100%", background: "#1e2433", border: "1px solid #2d3a50", borderRadius: 8, color: "#e2e8f0", padding: "9px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" as const },
  btn:    { background: "#3b82f6", color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, cursor: "pointer", marginTop: 16 },
  table:  { width: "100%", borderCollapse: "collapse" as const, background: "#111827", borderRadius: 12, overflow: "hidden" },
  th:     { background: "#1e2433", color: "#94a3b8", fontSize: 11, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: ".06em", padding: "12px 16px", textAlign: "left" as const },
  td:     { padding: "10px 16px", borderBottom: "1px solid #1f2937", fontSize: 13 },
  bar:    { height: 8, borderRadius: 4, background: "#1e2433", overflow: "hidden" as const, marginTop: 4 },
};

export default function ICCRIFluxosPage() {
  const [indice, setIndice]       = useState<ICCRIindice | null>(null);
  const [estado, setEstado]       = useState("SP");
  const [cidade, setCidade]       = useState<"capital"|"interior">("capital");
  const [padrao, setPadrao]       = useState<"basico"|"intermediario"|"alto">("intermediario");
  const [prazo, setPrazo]         = useState(12);
  const [valorTotal, setValorTotal] = useState(500000);
  const [percMat, setPercMat]     = useState(45); // % materiais do total
  const [linhas, setLinhas]       = useState<Linha[]>([]);

  useEffect(() => { getindiceAtual().then(setIndice); }, []);

  function calcular() {
    const fatorReg = FATOR_REGIONAL[estado]?.[cidade] ?? 0.80;
    const iccriAtual = indice?.valor_iccri ?? 174.1;
    const fatorIccri = iccriAtual / 100;

    // Valor ajustado
    const valorAjustado = valorTotal * fatorReg * fatorIccri;
    const totalMat = valorAjustado * (percMat / 100);
    const totalMdo = valorAjustado - totalMat;

    // Curva S para distribuição
    const curva = curvaS(prazo);

    // Materiais: 60% antecipados (mês anterior), 40% conforme curva
    const novas: Linha[] = [];
    let acumulado = 0;

    for (let i = 0; i < prazo; i++) {
      const pesos_mdo = curva[i];
      // Materiais: adiantados 1 mês (i-1), último mês sem materiais antecipados
      const peso_mat = i < prazo - 1 ? curva[i] : 0;
      const mat = totalMat * peso_mat;
      const mdo = totalMdo * pesos_mdo;
      const total = mat + mdo;
      acumulado += total;

      const d = new Date();
      d.setMonth(d.getMonth() + i);
      const label = d.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });

      novas.push({ mes: i + 1, label, materiais: mat, mdo, total, acumulado });
    }
    setLinhas(novas);
  }

  const totalGerado = linhas.reduce((s, l) => s + l.total, 0);
  const maxMes = Math.max(...linhas.map(l => l.total), 1);

  function exportCSV() {
    const rows = [
      ["Mês", "Período", "Materiais", "Mão de Obra", "Total Mês", "Acumulado"],
      ...linhas.map(l => [l.mes, l.label, l.materiais.toFixed(2), l.mdo.toFixed(2), l.total.toFixed(2), l.acumulado.toFixed(2)]),
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `fluxo-obra-${estado}-${prazo}m.csv`;
    a.click();
  }

  const padroLabel = { basico: "Básico", intermediario: "Intermediário", alto: "Alto" };

  return (
    <div style={S.page}>
      <h1 style={S.title}>Fluxo de Caixa</h1>
      <p style={S.sub}>Projeção mensal baseada em preços ICCRI regionais · Curva S de distribuição</p>

      {/* Cards de contexto */}
      <div style={S.grid}>
        <div style={S.card}>
          <div style={S.clabel}>Índice ICCRI Atual</div>
          <div style={S.cval}>{indice?.valor_iccri?.toFixed(1) ?? "—"}</div>
          <div style={S.csub}>Base 100 = Jan/2020 · {indice?.variacao_mensal != null ? `+${indice.variacao_mensal}%/mês` : ""}</div>
        </div>
        <div style={S.card}>
          <div style={S.clabel}>Fator Regional</div>
          <div style={S.cval}>×{(FATOR_REGIONAL[estado]?.[cidade] ?? 0.80).toFixed(2)}</div>
          <div style={S.csub}>{estado} — {cidade === "capital" ? "Capital" : "Interior"}</div>
        </div>
        <div style={S.card}>
          <div style={S.clabel}>Padrão</div>
          <div style={S.cval}>{padroLabel[padrao]}</div>
          <div style={S.csub}>{prazo} meses de obra</div>
        </div>
        {totalGerado > 0 && (
          <div style={S.card}>
            <div style={S.clabel}>Total Projetado</div>
            <div style={{ ...S.cval, fontSize: 18 }}>{fmt(totalGerado)}</div>
            <div style={S.csub}>Ajustado por ICCRI + regional</div>
          </div>
        )}
      </div>

      {/* Inputs */}
      <div style={S.inputs}>
        <div style={{ fontWeight: 700, marginBottom: 16, fontSize: 14 }}>Parâmetros da Simulação</div>
        <div style={S.row}>
          <div>
            <label style={S.label}>Estado</label>
            <select style={S.select} value={estado} onChange={e => setEstado(e.target.value)}>
              {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Localização</label>
            <select style={S.select} value={cidade} onChange={e => setCidade(e.target.value as "capital"|"interior")}>
              <option value="capital">Capital</option>
              <option value="interior">Interior</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Padrão de Obra</label>
            <select style={S.select} value={padrao} onChange={e => setPadrao(e.target.value as typeof padrao)}>
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="alto">Alto Padrão</option>
            </select>
          </div>
          <div>
            <label style={S.label}>Prazo (meses)</label>
            <input style={S.input} type="number" min={1} max={60} value={prazo} onChange={e => setPrazo(+e.target.value)} />
          </div>
          <div>
            <label style={S.label}>Valor Total (R$)</label>
            <input style={S.input} type="number" min={0} step={1000} value={valorTotal} onChange={e => setValorTotal(+e.target.value)} />
          </div>
          <div>
            <label style={S.label}>% Materiais</label>
            <input style={S.input} type="number" min={10} max={90} value={percMat} onChange={e => setPercMat(+e.target.value)} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <button style={S.btn} onClick={calcular}>Calcular Fluxo</button>
          {linhas.length > 0 && (
            <button style={{ ...S.btn, background: "#1e2433", border: "1px solid #2d3a50", color: "#94a3b8" }} onClick={exportCSV}>
              Exportar CSV
            </button>
          )}
        </div>
      </div>

      {/* Tabela */}
      {linhas.length > 0 && (
        <>
          <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 12 }}>
            Projeção Mensal — {prazo} meses · Distribuição Curva S
          </div>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Mês</th>
                <th style={S.th}>Período</th>
                <th style={{ ...S.th, color: "#60a5fa" }}>Materiais</th>
                <th style={{ ...S.th, color: "#34d399" }}>Mão de Obra</th>
                <th style={S.th}>Total Mês</th>
                <th style={S.th}>Distribuição</th>
                <th style={S.th}>Acumulado</th>
                <th style={{ ...S.th, color: "#94a3b8" }}>% Acum.</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map(l => (
                <tr key={l.mes}>
                  <td style={{ ...S.td, color: "#64748b", fontSize: 12 }}>{l.mes}</td>
                  <td style={{ ...S.td, fontWeight: 600 }}>{l.label}</td>
                  <td style={{ ...S.td, color: "#60a5fa" }}>{fmt(l.materiais)}</td>
                  <td style={{ ...S.td, color: "#34d399" }}>{fmt(l.mdo)}</td>
                  <td style={{ ...S.td, fontWeight: 700 }}>{fmt(l.total)}</td>
                  <td style={{ ...S.td, width: 140 }}>
                    <div style={{ fontSize: 11, color: "#64748b", marginBottom: 2 }}>{pct((l.total / totalGerado) * 100)}</div>
                    <div style={S.bar}>
                      <div style={{ height: "100%", width: pct((l.total / maxMes) * 100), background: "#3b82f6", borderRadius: 4, transition: "width .3s" }} />
                    </div>
                  </td>
                  <td style={S.td}>{fmt(l.acumulado)}</td>
                  <td style={{ ...S.td, color: "#94a3b8", fontSize: 12 }}>{pct((l.acumulado / totalGerado) * 100)}</td>
                </tr>
              ))}
              <tr style={{ background: "#1e2433", fontWeight: 800 }}>
                <td colSpan={2} style={{ ...S.td, color: "#94a3b8" }}>TOTAL</td>
                <td style={{ ...S.td, color: "#60a5fa" }}>{fmt(linhas.reduce((s,l)=>s+l.materiais,0))}</td>
                <td style={{ ...S.td, color: "#34d399" }}>{fmt(linhas.reduce((s,l)=>s+l.mdo,0))}</td>
                <td colSpan={4} style={S.td}>{fmt(totalGerado)}</td>
              </tr>
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
