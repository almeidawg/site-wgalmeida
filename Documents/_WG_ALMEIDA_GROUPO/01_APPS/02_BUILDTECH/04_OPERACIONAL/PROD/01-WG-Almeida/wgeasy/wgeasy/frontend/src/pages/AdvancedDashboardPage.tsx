import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type StatusObra = "andamento" | "concluida" | "atrasada" | "planejada" | string;

interface Obra {
  id: string;
  nome: string;
  status: StatusObra;
  data_inicio_prevista?: string | null;
  data_fim_prevista?: string | null;
  data_fim_real?: string | null;
  progresso?: number | null;
  valor_contrato?: number | null;
}

interface KpiResumo {
  totalObras: number;
  obrasAtivas: number;
  obrasAtrasadas: number;
  taxaAtraso: number;
  valorTotalContratos: number;
}

type NivelRisco = "baixo" | "medio" | "alto";

interface ObraComRisco extends Obra {
  risco: NivelRisco;
  score: number;
}

export default function AdvancedDashboardPage() {
  const [obras, setObras] = useState<Obra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarObras() {
      try {
        const { data, error } = await supabase.from("obras").select("*");

        if (error) {
          console.error("Erro ao carregar obras:", error);
          return;
        }

        setObras((data || []) as Obra[]);
      } finally {
        setLoading(false);
      }
    }
    carregarObras();
  }, []);

  const obrasComRisco = useMemo(
    () => obras.map((obra) => calcularRiscoObra(obra)),
    [obras]
  );

  const kpi: KpiResumo = useMemo(
    () => calcularKpis(obrasComRisco),
    [obrasComRisco]
  );

  const heatmapData = useMemo(
    () => montarHeatmapData(obrasComRisco),
    [obrasComRisco]
  );

  const tendenciaAtrasoData = useMemo(
    () => montarTendenciaAtrasoData(obrasComRisco),
    [obrasComRisco]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-[#2E2E2E]">
        Carregando painel avançado...
      </div>
    );
  }

  return (
    <div className={`${LAYOUT.pageContainer} space-y-6 sm:space-y-10`}>

      {/* Cabeçalho */}
      <header>
        <h1 className={TYPOGRAPHY.pageTitle}>WG Easy · Painel Inteligente</h1>
        <p className={TYPOGRAPHY.pageSubtitle}>
          VisÍo estratégica das obras, riscos e desempenho operacional.
        </p>
      </header>

      {/* KPIs */}
      <section className={LAYOUT.gridCards}>
        <KpiCard
          titulo="Obras Ativas"
          valor={kpi.obrasAtivas}
          subtitulo={`Total: ${kpi.totalObras}`}
          destaque="OperaçÍo em curso"
        />
        <KpiCard
          titulo="Obras Atrasadas"
          valor={kpi.obrasAtrasadas}
          subtitulo={`Taxa: ${kpi.taxaAtraso.toFixed(1)}%`}
          destaque={
            kpi.taxaAtraso > 20
              ? "AtençÍo: revisar cronogramas"
              : "Controle dentro da faixa"
          }
          variante={kpi.taxaAtraso > 20 ? "alerta" : "ok"}
        />
        <KpiCard
          titulo="Valor em Contratos"
          valor={`R$ ${formatarMoeda(kpi.valorTotalContratos)}`}
          subtitulo="Obras em andamento e planejadas"
        />
        <KpiCard
          titulo="Risco Global"
          valor={calcularRiscoGlobalLabel(obrasComRisco)}
          subtitulo="Média ponderada das obras"
          variante={calcularRiscoGlobalVariante(obrasComRisco)}
        />
      </section>

      {/* Gráficos */}
      <section className={LAYOUT.gridDashboard}>

        {/* Tendência de atraso */}
        <div className={`${LAYOUT.card} lg:col-span-2`}>
          <SectionHeader
            titulo="Tendência de risco de atraso"
            descricao="ProjeçÍo baseada em progresso, prazo e status atual."
          />

          <div style={{ width: "100%", height: 350 }} className="mt-5">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendenciaAtrasoData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="riscoMedio"
                  stroke="#F25C26"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Heatmap */}
        <div className={LAYOUT.card}>
          <SectionHeader
            titulo="Mapa de calor de obras"
            descricao="DistribuiçÍo por status e nível de risco."
          />

          <div className="grid grid-cols-3 gap-2 sm:gap-3 mt-4">
            {heatmapData.map((item) => (
              <HeatmapCell
                key={item.label}
                label={item.label}
                valor={item.count}
                nivel={item.nivel}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Obras em maior risco */}
      <section className={LAYOUT.card}>
        <SectionHeader
          titulo="Obras em maior risco"
          descricao="Foco nas obras com maior probabilidade de atraso."
        />

        {obrasComRiscoFiltradas(obrasComRisco).length === 0 ? (
          <p className="text-[12px] text-[#4C4C4C] mt-2">
            Nenhuma obra em risco relevante no momento. Bom sinal.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {obrasComRiscoFiltradas(obrasComRisco).map((obra) => (
              <ObraRiscoRow key={obra.id} obra={obra} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}

/* =====================================================================
   COMPONENTES DE UI
   ===================================================================== */

function KpiCard({ titulo, valor, subtitulo, destaque, variante = "default" }: any) {
  const borda =
    variante === "alerta"
      ? "border-[#F25C26]"
      : variante === "ok"
      ? "border-[#5E9B94]"
      : "border-[#E5E5E5]";

  const badgeBg =
    variante === "alerta"
      ? "bg-primary/10 text-[#F25C26]"
      : variante === "ok"
      ? "bg-[#5E9B94]/10 text-[#2E2E2E]"
      : "bg-[#F3F3F3] text-[#4C4C4C]";

  return (
    <div className={`${LAYOUT.card} border ${borda} flex flex-col gap-2`}>
      <h2 className={TYPOGRAPHY.cardTitle}>{titulo}</h2>

      <p className={TYPOGRAPHY.statNumber}>{valor}</p>

      {subtitulo && (
        <p className="text-[12px] text-[#7A7A7A]">{subtitulo}</p>
      )}

      {destaque && (
        <span className={`inline-block px-2 py-1 rounded-full text-[12px] ${badgeBg}`}>
          {destaque}
        </span>
      )}
    </div>
  );
}

function SectionHeader({ titulo, descricao }: any) {
  return (
    <div>
      <h2 className={TYPOGRAPHY.sectionTitle}>{titulo}</h2>
      {descricao && (
        <p className={`${TYPOGRAPHY.sectionSubtitle} mt-1`}>{descricao}</p>
      )}
    </div>
  );
}

function HeatmapCell({ label, valor, nivel }: any) {
  const intensidade =
    nivel === "alto"
      ? "bg-primary/70"
      : nivel === "medio"
      ? "bg-primary/40"
      : "bg-primary/15";

  return (
    <div className={`rounded-xl p-2 sm:p-3 flex flex-col justify-between ${intensidade} text-[#2E2E2E]`}>
      <span className={TYPOGRAPHY.cardSubtitle}>{label}</span>
      <span className={`${TYPOGRAPHY.statNumber} mt-1`}>{valor}</span>
    </div>
  );
}

function ObraRiscoRow({ obra }: any) {
  const cor =
    obra.risco === "alto"
      ? "text-[#F25C26]"
      : obra.risco === "medio"
      ? "text-[#A16207]"
      : "text-[#15803D]";

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border border-[#E5E5E5] rounded-xl px-3 py-2">
      <div>
        <p className="text-[13px] font-light text-[#2E2E2E]">{obra.nome}</p>
        <p className="text-[12px] text-[#4C4C4C]">
          Status: {obra.status || "—"} · Progresso:{" "}
          {obra.progresso != null ? `${obra.progresso}%` : "nÍo informado"}
        </p>
      </div>

      <div className="flex items-center gap-3 text-[12px]">
        <span className={`${cor} font-normal capitalize`}>Risco {obra.risco}</span>
        <span className="text-[#7A7A7A]">Score: {obra.score.toFixed(0)} / 100</span>
      </div>
    </div>
  );
}

/* =====================================================================
   LÓGICA DE NEGÓCIO
   ===================================================================== */

function calcularRiscoObra(obra: Obra): ObraComRisco {
  const hoje = new Date();
  const fimPrev = obra.data_fim_prevista ? new Date(obra.data_fim_prevista) : null;
  const progresso = obra.progresso ?? 0;

  let scoreBase = 0;

  if (obra.status === "atrasada") scoreBase += 60;
  if (obra.status === "andamento") scoreBase += 30;
  if (obra.status === "planejada") scoreBase += 10;
  if (obra.status === "concluida") scoreBase -= 40;

  if (fimPrev) {
    const diffMs = fimPrev.getTime() - hoje.getTime();
    const diffDias = diffMs / (1000 * 60 * 60 * 24);

    if (diffDias < 0) scoreBase += 40;
    else if (diffDias < 15) scoreBase += 25;
    else if (diffDias < 30) scoreBase += 10;
  }

  if (progresso < 30) scoreBase += 25;
  else if (progresso < 60) scoreBase += 10;
  else if (progresso > 85) scoreBase -= 15;

  const score = Math.max(0, Math.min(100, scoreBase));

  let risco: NivelRisco = "baixo";
  if (score >= 70) risco = "alto";
  else if (score >= 40) risco = "medio";

  return { ...obra, risco, score };
}

function calcularKpis(obras: ObraComRisco[]): KpiResumo {
  const totalObras = obras.length;
  const obrasAtivas = obras.filter((o) => o.status !== "concluida").length;
  const obrasAtrasadas = obras.filter(
    (o) => o.status === "atrasada" || o.risco === "alto"
  ).length;

  const taxaAtraso =
    totalObras > 0 ? (obrasAtrasadas / totalObras) * 100 : 0;

  const valorTotalContratos = obras.reduce(
    (acc, o) => acc + (o.valor_contrato ?? 0),
    0
  );

  return {
    totalObras,
    obrasAtivas,
    obrasAtrasadas,
    taxaAtraso,
    valorTotalContratos,
  };
}

function calcularRiscoGlobalLabel(obras: ObraComRisco[]): string {
  if (!obras.length) return "Sem dados";

  const media =
    obras.reduce((acc, o) => acc + o.score, 0) / obras.length;

  if (media >= 70) return "Alto";
  if (media >= 40) return "Moderado";
  return "Baixo";
}

function calcularRiscoGlobalVariante(
  obras: ObraComRisco[]
): "default" | "alerta" | "ok" {
  if (!obras.length) return "default";

  const media =
    obras.reduce((acc, o) => acc + o.score, 0) / obras.length;

  if (media >= 70) return "alerta";
  if (media >= 40) return "default";
  return "ok";
}

function montarHeatmapData(obras: ObraComRisco[]) {
  const grupos = [
    { label: "Baixo risco", filtro: (o: ObraComRisco) => o.risco === "baixo", nivel: "baixo" },
    { label: "Risco médio", filtro: (o: ObraComRisco) => o.risco === "medio", nivel: "medio" },
    { label: "Risco alto", filtro: (o: ObraComRisco) => o.risco === "alto", nivel: "alto" },
  ];

  return grupos.map((g) => ({
    label: g.label,
    count: obras.filter(g.filtro).length,
    nivel: g.nivel,
  }));
}

function montarTendenciaAtrasoData(obras: ObraComRisco[]) {
  const mediaAtual =
    obras.length > 0
      ? obras.reduce((acc, o) => acc + o.score, 0) / obras.length
      : 0;

  const meses = ["M-2", "M-1", "Atual", "M+1", "M+2", "M+3"];

  return meses.map((mes) => {
    let fator = 1;
    if (mes === "M-2") fator = 0.7;
    else if (mes === "M-1") fator = 0.85;
    else if (mes === "Atual") fator = 1;
    else if (mes === "M+1") fator = 1.05;
    else if (mes === "M+2") fator = 1.1;
    else if (mes === "M+3") fator = 1.15;

    return {
      mes,
      riscoMedio: Math.max(0, Math.min(100, mediaAtual * fator)),
    };
  });
}

function obrasComRiscoFiltradas(obras: ObraComRisco[]): ObraComRisco[] {
  return obras
    .filter((o) => o.risco === "alto" || (o.risco === "medio" && o.status !== "concluida"))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);
}

function formatarMoeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

