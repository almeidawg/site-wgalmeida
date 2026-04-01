/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/ProjectKanbanPage.tsx
import { useEffect, useState } from "react";
import { listarTasks, atualizarTask } from "@/lib/tasksApi";
import { useParams } from "react-router-dom";
import { formatarData } from "@/lib/utils";

// ===============================
// TEMA WG EASY 2026 — PREMIUM
// ===============================
const WG = {
  texto: "#2E2E2E",
  textoSec: "#4C4C4C",
  fundoCard: "#F9F9F9",
  bordaCard: "#E5E5E5",
  branco: "#FFFFFF",
  sombra: "0 4px 12px rgba(0,0,0,0.08)",
  laranja: "#F25C26",
  cinzaColuna: "#F3F3F3",
  linha: "#E2E2E2",
  pendente: "#6D6D6D",
  andamento: "#1565C0",
  atrasado: "#C62828",
  concluida: "#2E7D32",
};

const COLUNAS = {
  pendente: { label: "Pendente", cor: WG.pendente },
  andamento: { label: "Em andamento", cor: WG.andamento },
  atrasado: { label: "Atrasado", cor: WG.atrasado },
  concluida: { label: "Concluída", cor: WG.concluida },
};

export default function ProjectKanbanPage() {
  const { id } = useParams();
  const [tasks, setTasks] = useState<any[]>([]);
  const [dragging, setDragging] = useState<any>(null);

  async function carregar() {
    if (!id) return;
    const lista = await listarTasks(id);
    setTasks(lista);
  }

  useEffect(() => {
    carregar();
  }, [id]);

  async function moverTask(task: any, novaColuna: string) {
    await atualizarTask(task.id, { status: novaColuna });
    carregar();
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">Kanban do Projeto</h1>
        <p className="text-sm text-[#4C4C4C]">OrganizaçÍo visual do cronograma</p>
      </div>

      {/* COLUNAS */}
      <div className="flex gap-6 overflow-x-auto pb-4">

        {Object.entries(COLUNAS).map(([status, meta]) => (
          <div
            key={status}
            className="rounded-xl border shadow bg-white p-4 flex-1 min-w-[220px] min-h-[500px]"
            style={{ borderColor: WG.linha }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragging && moverTask(dragging, status)}
          >
            {/* Título da coluna */}
            <h2 className="text-[20px] font-normal mb-4 flex items-center gap-2" style={{ color: meta.cor }}>
              <span className="w-3 h-3 rounded-full" style={{ background: meta.cor }}></span>
              {meta.label}
            </h2>

            <div className="space-y-4 min-h-[300px]">

              {tasks
                .filter((t) => t.status === status)
                .map((t) => (
                  <div
                    key={t.id}
                    draggable
                    onDragStart={() => setDragging(t)}
                    onDragEnd={() => setDragging(null)}
                    className="p-4 rounded-xl cursor-grab"
                    style={{
                      background: WG.fundoCard,
                      border: `1px solid ${WG.bordaCard}`,
                      boxShadow: WG.sombra,
                      opacity: dragging?.id === t.id ? 0.7 : 1,
                      transition: "0.15s ease",
                    }}
                  >
                    {/* Título */}
                    <p className="font-normal" style={{ color: WG.texto }}>
                      {t.titulo}
                    </p>

                    {/* Responsável */}
                    <p className="text-xs mt-1" style={{ color: WG.textoSec }}>
                      {t.responsavel || "Sem responsável"}
                    </p>

                    {/* Datas */}
                    <p className="text-xs mt-2" style={{ color: WG.textoSec }}>
                      {t.inicio ? formatarData(t.inicio) : "-"} → {t.fim ? formatarData(t.fim) : "-"}
                    </p>

                    {/* Progress bar */}
                    <div className="w-full h-2 rounded-full bg-[#e0e0e0] mt-3">
                      <div
                        className="h-2 rounded-full"
                        style={{
                          background: meta.cor,
                          width: `${t.progresso || 0}%`,
                          transition: "0.25s",
                        }}
                      ></div>
                    </div>
                  </div>
                ))}

              {/* Placeholder quando vazia */}
              {tasks.filter((t) => t.status === status).length === 0 && (
                <div
                  className="rounded-lg border-dashed border-2 h-28 flex items-center justify-center text-sm"
                  style={{
                    borderColor: WG.bordaCard,
                    background: "#FAFAFA",
                    color: WG.textoSec,
                  }}
                >
                  Arraste tarefas aqui
                </div>
              )}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
}

