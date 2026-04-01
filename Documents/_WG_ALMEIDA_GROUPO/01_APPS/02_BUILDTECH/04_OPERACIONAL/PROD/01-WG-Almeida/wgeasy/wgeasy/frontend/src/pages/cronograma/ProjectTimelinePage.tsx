/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/ProjectTimelinePage.tsx
import { useEffect, useState } from "react";
import { listarTasks } from "@/lib/tasksApi";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";

export default function ProjectTimelinePage() {
  const { id } = useParams();
  const [tarefas, setTarefas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregar() {
    if (!id) return;
    setLoading(true);
    const lista = await listarTasks(id);
    setTarefas(lista);
    setLoading(false);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-wg-text-muted">
        Carregando timeline...
      </div>
    );
  }

  if (!tarefas.length) {
    return (
      <div className="flex justify-center items-center h-[50vh] text-wg-text-muted">
        Nenhuma tarefa cadastrada.
      </div>
    );
  }

  // ===============================
  // CÁLCULOS DE GANTT
  // ===============================

  const inicioProjeto = dayjs(
    tarefas.reduce(
      (menor, t) => (dayjs(t.inicio).isBefore(dayjs(menor)) ? t.inicio : menor),
      tarefas[0].inicio
    )
  );

  function diasEntre(i: string, f: string) {
    return dayjs(f).diff(dayjs(i), "day") || 1;
  }

  return (
    <div className="space-y-8">

      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-normal text-wg-text">Linha do Tempo (Gantt)</h1>
        <p className="text-sm text-wg-text-muted">
          VisualizaçÍo executiva do cronograma do projeto.
        </p>
      </div>

      {/* Gantt Chart */}
      <div className="bg-white border border-wg-border rounded-xl shadow p-6 overflow-x-auto">

        <table className="min-w-[900px] w-full text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left">Tarefa</th>
              <th className="p-2 text-left">Responsável</th>
              <th className="p-2 text-left">Linha do Tempo</th>
            </tr>
          </thead>

          <tbody>
            {tarefas.map((t) => {
              const offsetDias = diasEntre(
                inicioProjeto.format("YYYY-MM-DD"),
                t.inicio
              );

              const duracaoDias = diasEntre(t.inicio, t.fim);

              // pixels por dia (ajustável)
              const pxPorDia = 22;

              return (
                <tr key={t.id} className="border-b hover:bg-wg-bg">

                  {/* Nome */}
                  <td className="p-3 font-medium text-wg-text">{t.titulo}</td>

                  {/* Responsável */}
                  <td className="p-3 text-wg-text-muted">{t.responsavel || "-"}</td>

                  {/* Barra */}
                  <td className="p-3">
                    <div className="relative h-6 min-h-[24px] rounded-lg bg-wg-bg border border-wg-border">
                      <div
                        className="absolute h-6 rounded-lg shadow-md transition-all bg-primary"
                        style={{
                          marginLeft: offsetDias * pxPorDia,
                          width: duracaoDias * pxPorDia,
                        }}
                      />
                    </div>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>

      </div>
    </div>
  );
}

