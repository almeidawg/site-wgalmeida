/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/ProjectFormPage.tsx
import { useEffect, useState } from "react";
import { criarProject, atualizarProject, buscarProject } from "@/lib/projectsApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { useParams, useNavigate } from "react-router-dom";
import { DateInputBR } from "@/components/ui/DateInputBR";

export default function ProjectFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nome: "",
    obra_id: "",
    descricao: "",
    inicio: "",
    fim: "",
  });

  const [obras, setObras] = useState<any[]>([]);

  async function carregarObras() {
    const { data } = await supabase.from("obras").select("id, nome");
    setObras(data || []);
  }

  async function carregarProjeto() {
    if (!id) return;

    const p = await buscarProject(id);
    if (!p) return;
    setForm({
      nome: p.nome,
      obra_id: p.obra_id ?? "",
      descricao: p.descricao ?? "",
      inicio: p.inicio ?? "",
      fim: p.fim ?? "",
    });
  }

  useEffect(() => {
    carregarObras();
    carregarProjeto();
  }, []);

  function handle(e: any) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function salvar() {
    // ValidaçÍo básica
    if (!form.nome.trim()) {
      alert("O nome do projeto é obrigatório.");
      return;
    }

    try {
      if (id) {
        await atualizarProject(id, form);
      } else {
        await criarProject(form);
      }
      navigate("/cronograma/projects");
    } catch (error) {
      console.error("Erro ao salvar projeto:", error);
      alert("Erro ao salvar projeto. Tente novamente.");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="bg-white p-6 rounded-xl border border-[#E5E5E5] shadow space-y-4">
        <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
          {id ? "Editar Projeto" : "Novo Projeto"}
        </h1>

        <input
          name="nome"
          value={form.nome}
          onChange={handle}
          className="border p-2 rounded w-full"
          placeholder="Nome do projeto"
        />

        <select
          name="obra_id"
          value={form.obra_id}
          onChange={handle}
          className="border p-2 rounded w-full"
          aria-label="Vincular a obra"
        >
          <option value="">Sem vinculaçÍo</option>
          {obras.map((o) => (
            <option key={o.id} value={o.id}>
              {o.nome}
            </option>
          ))}
        </select>

        <textarea
          name="descricao"
          value={form.descricao}
          onChange={handle}
          className="border p-2 rounded w-full h-24"
          placeholder="DescriçÍo do projeto"
        />

        <DateInputBR
          value={form.inicio}
          onChange={(val) => setForm({ ...form, inicio: val })}
          placeholder="Data início"
          className="border p-2 rounded w-full"
        />

        <DateInputBR
          value={form.fim}
          onChange={(val) => setForm({ ...form, fim: val })}
          placeholder="Data fim"
          className="border p-2 rounded w-full"
        />

        <button
          type="button"
          onClick={salvar}
          className="w-full px-4 py-2 text-[14px] bg-primary text-white rounded hover:bg-primary/90"
        >
          Salvar
        </button>
      </div>
    </div>
  );
}

