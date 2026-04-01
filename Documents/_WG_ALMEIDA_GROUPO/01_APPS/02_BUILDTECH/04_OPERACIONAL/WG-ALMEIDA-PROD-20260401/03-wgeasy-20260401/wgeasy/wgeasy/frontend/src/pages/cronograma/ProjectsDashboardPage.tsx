// src/pages/ProjectsDashboardPage.tsx
import { useEffect, useState } from "react";
import { formatarMoeda } from "@/lib/utils";
import { listarProjects, Project } from "@/lib/projectsApi";
import { listarTasks } from "@/lib/tasksApi";
import { calcularCriticalPath, TaskNode } from "@/lib/criticalPath";
import { preverAtrasoProjeto, TaskAI, PredictResult } from "@/lib/projectAI";
import {
  buscarResumoProjetoFinanceiro,
  ResumoProjetoFinanceiro,
} from "@/lib/projectsIntegration";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// Tema WG EASY
const WG = {
  texto: "#2E2E2E",
  textoSec: "#4C4C4C",
  laranja: "#F25C26",
  verde: "#2E7D32",
  vermelho: "#C62828",
  azul: "#1565C0",
  borda: "#E5E5E5",
  fundoCard: "#FFFFFF",
};

interface ProjetoComResumo {
  projeto: Project;
  risco: PredictResult;
  resumoFin: ResumoProjetoFinanceiro | null;
}

export default function ProjectsDashboardPage() {
  const [projetos, setProjetos] = useState<ProjetoComResumo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      setLoading(true);
      const listaProjects = await listarProjects();

      const resultado: ProjetoComResumo[] = [];

      for (const p of listaProjects) {
        if (!p.id) continue;
        // Carrega tarefas do projeto
        const tarefas = await listarTasks(p.id);
        // Se nÍo tiver tarefa, assume risco baixo
        if (!tarefas.length) {
          const resumoFin = await buscarResumoProjetoFinanceiro(p.id);
          resultado.push({
            projeto: p,
            risco: {
              risco: "baixo",
              score: 0,
              atrasoPrevistoDias: 0,
            },
            resumoFin,
          });
          continue;
        }

        // Adapta tasks para critical path
        const nodes: TaskNode[] = tarefas.map((t: any) => ({
          id: t.id,
          titulo: t.titulo,
          inicio: t.inicio,
          fim: t.fim,
          depende_de: [], // Dependências podem ser integradas depois
        }));

        const cp = calcularCriticalPath(nodes);

        // Monta payload para IA
        const tasksAi: TaskAI[] = tarefas.map((t: any) => ({
          id: t.id,
          titulo: t.titulo,
          inicio: t.inicio,
          fim: t.fim,
          progresso: t.progresso || 0,
          caminhoCritico: cp.caminhoCritico.includes(t.id),
        }));

        const risco = preverAtrasoProjeto(tasksAi);
        const resumoFin = await buscarResumoProjetoFinanceiro(p.id);

        resultado.push({
          projeto: p,
          risco,
          resumoFin,
        });
      }

      setProjetos(resultado);
      setLoading(false);
    }

    carregar();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-[#4C4C4C]">
        Carregando dashboard de projetos...
      </div>
    );
  }

  // Dados para gráfico: orçado x realizado (saída) por projeto
  const graficoOrcadoRealizado = projetos
    .filter((p) => p.resumoFin)
    .map((p) => ({
      nome: p.projeto.nome,
      orcado: p.resumoFin?.orcado || 0,
      realizado: p.resumoFin?.realizadoSaida || 0,
    }));

  const totalProjetos = projetos.length;
  const qtdAltoRisco = projetos.filter((p) => p.risco.risco === "alto").length;
  const qtdMedioRisco = projetos.filter((p) => p.risco.risco === "medio").length;
  const qtdBaixoRisco = projetos.filter((p) => p.risco.risco === "baixo").length;

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal" style={{ color: WG.texto }}>
            Dashboard de Projetos
          </h1>
          <p className="text-[12px]" style={{ color: WG.textoSec }}>
            VisÍo executiva: risco, atraso previsto e orçamento x realizado.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <section className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <KpiCard titulo="Projetos Ativos" valor={totalProjetos} cor={WG.azul} />
        <KpiCard titulo="Alto risco" valor={qtdAltoRisco} cor={WG.vermelho} />
        <KpiCard titulo="Risco médio" valor={qtdMedioRisco} cor={WG.laranja} />
        <KpiCard titulo="Risco baixo" valor={qtdBaixoRisco} cor={WG.verde} />
      </section>

      {/* GRÁFICO ORÇADO x REALIZADO */}
      {graficoOrcadoRealizado.length > 0 && (
        <section className="bg-white rounded-xl shadow border border-[#E5E5E5] p-6">
          <h2 className="text-lg font-normal mb-4" style={{ color: WG.texto }}>
            Orçado x Realizado (Saída) por Projeto
          </h2>

          <div className="h-80 min-h-[320px]">
            <ResponsiveContainer width="100%" height="100%" aspect={2}>
              <BarChart data={graficoOrcadoRealizado}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="nome" stroke={WG.textoSec} />
                <YAxis stroke={WG.textoSec} />
                <Tooltip />
                <Bar dataKey="orcado" fill={WG.azul} name="Orçado" />
                <Bar dataKey="realizado" fill={WG.laranja} name="Realizado" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* LISTA DETALHADA DE PROJETOS */}
      <section className="bg-white rounded-xl shadow border border-[#E5E5E5] p-3 sm:p-4 lg:p-6">
        <h2 className="text-base sm:text-lg font-normal mb-3 sm:mb-4" style={{ color: WG.texto }}>
          Projetos - Risco e Financeiro
        </h2>

        <div className="overflow-x-auto -mx-3 sm:mx-0">
          <table className="w-full text-xs sm:text-sm min-w-[700px]">
            <thead className="bg-[#F3F3F3]">
              <tr>
                <th className="p-3 text-left">Projeto</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Risco / Score</th>
                <th className="p-3 text-left">Atraso Previsto</th>
                <th className="p-3 text-left">Orçado</th>
                <th className="p-3 text-left">Realizado (Saída)</th>
                <th className="p-3 text-left">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {projetos.map((p) => {
                const fin = p.resumoFin;
                const riscoColor =
                  p.risco.risco === "alto"
                    ? WG.vermelho
                    : p.risco.risco === "medio"
                    ? WG.laranja
                    : WG.verde;

                return (
                  <tr key={p.projeto.id} className="border-b hover:bg-[#FAFAFA]">
                    <td className="p-3">{p.projeto.nome}</td>
                    <td className="p-3 capitalize">{p.projeto.status}</td>
                    <td className="p-3">
                      <span
                        className="px-2 py-1 rounded-full text-xs font-normal"
                        style={{
                          color: "#fff",
                          background: riscoColor,
                        }}
                      >
                        {p.risco.risco.toUpperCase()} · {p.risco.score}
                      </span>
                    </td>
                    <td className="p-3">
                      {p.risco.atrasoPrevistoDias > 0
                        ? `${p.risco.atrasoPrevistoDias} dia(s)`
                        : "Sem atraso previsto"}
                    </td>
                    <td className="p-3">
                      {fin ? formatarMoeda(fin.orcado) : "—"}
                    </td>
                    <td className="p-3">
                      {fin ? formatarMoeda(fin.realizadoSaida) : "—"}
                    </td>
                    <td className="p-3">
                      {fin ? formatarMoeda(fin.saldo) : "—"}
                    </td>
                  </tr>
                );
              })}

              {projetos.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-3 text-center text-[#4C4C4C]">
                    Nenhum projeto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({ titulo, valor, cor }: Readonly<{ titulo: string; valor: number; cor: string }>) {
  return (
    <div className="p-3 sm:p-4 rounded-xl shadow bg-white border border-[#E5E5E5]">
      <p className="text-[12px] text-[#4C4C4C]">{titulo}</p>
      <p className="text-[20px] font-normal mt-1 sm:mt-2" style={{ color: cor }}>
        {valor}
      </p>
    </div>
  );
}

