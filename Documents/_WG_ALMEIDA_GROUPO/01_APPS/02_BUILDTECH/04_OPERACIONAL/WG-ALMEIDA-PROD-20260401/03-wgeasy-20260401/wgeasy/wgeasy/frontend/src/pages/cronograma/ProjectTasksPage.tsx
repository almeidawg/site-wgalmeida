/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/ProjectTasksPage.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { listarTasks, criarTask, deletarTask } from "@/lib/tasksApi";
import { useParams } from "react-router-dom";
import { DateInputBR } from "@/components/ui/DateInputBR";
import { formatarData } from "@/lib/utils";

interface Tarefa {
  id: string;
  titulo: string;
  responsavel: string;
  inicio: string;
  fim: string;
  descricao: string;
  project_id: string;
}

export default function ProjectTasksPage() {
  const { id } = useParams();
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [novo, setNovo] = useState({
    titulo: "",
    responsavel: "",
    inicio: "",
    fim: "",
    descricao: ""
  });

  async function carregar() {
    if (!id) return;
    try {
      const data = await listarTasks(id);
      setTarefas(data);
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      alert("Erro ao carregar tarefas. Tente novamente.");
    }
  }

  useEffect(() => {
    carregar();
  }, [id]);

  function handle(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setNovo({ ...novo, [e.target.name]: e.target.value });
  }

  async function adicionar() {
    if (!novo.titulo.trim()) {
      alert("O título da tarefa é obrigatório.");
      return;
    }
    try {
      await criarTask({ ...novo, project_id: id! });
      setNovo({ titulo: "", responsavel: "", inicio: "", fim: "", descricao: "" });
      carregar();
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
      alert("Erro ao adicionar tarefa. Tente novamente.");
    }
  }

  async function remover(taskId: string) {
    if (!confirm("Deseja remover esta tarefa?")) return;
    try {
      await deletarTask(taskId);
      carregar();
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
      alert("Erro ao remover tarefa. Tente novamente.");
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">Tarefas do Projeto</h1>

      {/* Novo */}
      <div className="bg-white border p-4 rounded-xl shadow space-y-3">
        <input
          name="titulo"
          value={novo.titulo}
          onChange={handle}
          className="border p-2 rounded w-full"
          placeholder="Título da tarefa"
        />
        <input
          name="responsavel"
          value={novo.responsavel}
          onChange={handle}
          className="border p-2 rounded w-full"
          placeholder="Responsável"
        />
        <div className="grid grid-cols-2 gap-3">
          <DateInputBR
            value={novo.inicio}
            onChange={(val) => setNovo({ ...novo, inicio: val })}
            placeholder="Data início"
            className="border p-2 rounded"
          />
          <DateInputBR
            value={novo.fim}
            onChange={(val) => setNovo({ ...novo, fim: val })}
            placeholder="Data fim"
            className="border p-2 rounded"
          />
        </div>
        <textarea
          name="descricao"
          value={novo.descricao}
          onChange={handle}
          className="border p-2 rounded w-full h-20"
          placeholder="DescriçÍo da tarefa"
        />

        <button
          type="button"
          onClick={adicionar}
          className="px-4 py-2 text-[14px] bg-primary text-white rounded"
        >
          Adicionar Tarefa
        </button>
      </div>

      {/* Lista */}
      <div className="bg-white border rounded-xl shadow p-4">
        {tarefas.map((t) => (
          <div
            key={t.id}
            className="border-b py-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium">{t.titulo}</p>
              <p className="text-xs text-[#4C4C4C]">
                {formatarData(t.inicio)} → {formatarData(t.fim)} · Resp.: {t.responsavel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => remover(t.id)}
              className="text-[14px] text-red-600 hover:underline"
            >
              Remover
            </button>
          </div>
        ))}
      </div>

    </div>
  );
}

