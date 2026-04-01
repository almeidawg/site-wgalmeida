/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/OrcamentoFormPage.tsx
import { useEffect, useState, ChangeEvent } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  criarOrcamento,
  atualizarOrcamento,
  buscarOrcamento,
  Orcamento,
} from "@/lib/orcamentoApi";
import { supabase } from "@/lib/supabaseClient";
import { useNavigate, useParams } from "react-router-dom";

interface ObraResumo {
  id: string;
  nome: string;
}

export default function OrcamentoFormPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { id } = useParams();

  const [form, setForm] = useState<Orcamento>({
    cliente_id: "",
    titulo: "",
    obra_id: null,
    valor_total: 0,
    margem: 0,
    imposto: 0,
    status: "rascunho",
    id: "",
    cliente: null,
    enviado_em: null,
    aprovado_em: null,
    rejeitado_em: null,
    aprovado_por: null,
    motivo_rejeicao: null,
    link_aprovacao: null,
    validade: null,
    observacoes_cliente: null,
    criado_em: null,
    atualizado_em: null,
  });

  const [obras, setObras] = useState<ObraResumo[]>([]);
  const [loading, setLoading] = useState(true);

  async function carregarObras() {
    try {
      const { data, error } = await supabase
        .from("obras")
        .select("id, nome")
        .order("nome", { ascending: true });
      if (error) throw error;
      setObras((data || []) as ObraResumo[]);
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
    }
  }

  async function carregarOrcamento() {
    if (!id) return;

    try {
      const dados = await buscarOrcamento(id);
      if (dados) setForm(dados);
    } catch (error) {
      console.error("Erro ao carregar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar orçamento." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    carregarObras();
    carregarOrcamento();
    setLoading(false);
  }, [id]);

  function handle(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }


  async function salvar() {
    if (!form.cliente_id || !form.titulo) {
      return toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha cliente e título." });
    }

    try {
      if (id) {
        await atualizarOrcamento(id, form);
      } else {
        const novo = await criarOrcamento(form);
        if (novo?.id) {
          navigate(`/orcamentos/itens/${novo.id}`);
          return;
        }
      }

      navigate("/orcamentos");
    } catch (error) {
      console.error("Erro ao salvar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao salvar orçamento. Tente novamente." });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">Carregando...</div>
    );
  }

  return (
    <div className="max-w-xl mx-auto bg-white shadow-md rounded-xl border border-[#E5E5E5] p-6 space-y-5">
      <h1 className="text-[18px] sm:text-[24px] font-normal text-[#2E2E2E]">
        {id ? "Editar Orçamento" : "Novo Orçamento"}
      </h1>


      <input
        name="cliente_id"
        value={form.cliente_id ?? ""}
        onChange={handle}
        placeholder="ID do Cliente"
        className="border p-2 rounded w-full"
      />

      <textarea
        name="titulo"
        value={form.titulo ?? ""}
        onChange={handle}
        placeholder="Título do orçamento"
        className="border p-2 rounded w-full h-24"
      />

      <select
        name="obra_id"
        value={form.obra_id ?? ""}
        onChange={handle}
        className="border p-2 rounded w-full"
      >
        <option value="">Sem vinculaçÍo de obra</option>
        {obras.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nome}
          </option>
        ))}
      </select>

      <button
        onClick={salvar}
        className="w-full px-4 py-2 text-[14px] bg-primary text-white rounded hover:bg-[#d54b1c]"
      >
        Salvar Orçamento
      </button>
    </div>
  );
}
