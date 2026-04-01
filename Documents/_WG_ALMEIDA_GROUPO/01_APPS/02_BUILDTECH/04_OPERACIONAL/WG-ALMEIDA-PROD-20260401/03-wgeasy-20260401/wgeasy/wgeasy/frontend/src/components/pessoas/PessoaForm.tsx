import React, { useState, useEffect } from "react";
import { listarPessoas } from "@/lib/pessoasApi";
import type { PessoaInput, PessoaTipo } from "@/types/pessoas";
import PessoaAvatarUploader from "@/components/pessoas/PessoaAvatarUploader";

type PessoaFormProps = {
  tipo: PessoaTipo;
  onSubmit: (data: PessoaInput) => Promise<void>;
  onCancel?: () => void;
};

export function PessoaForm({ tipo, onSubmit, onCancel }: Readonly<PessoaFormProps>) {
  const [form, setForm] = useState<PessoaInput>({
    nome: "",
    email: "",
    telefone: "",
    cargo: "",
    unidade: "",
    tipo,
    avatar_url: null,
    foto_url: null,
    avatar: null,
    ativo: true,
  });

  const [loading, setLoading] = useState(false);
  const [especificadores, setEspecificadores] = useState<any[]>([]);

  useEffect(() => {
    async function fetchEspecificadores() {
      const lista = await listarPessoas({ tipo: "ESPECIFICADOR", ativo: true });
      setEspecificadores(lista);
    }
    fetchEspecificadores();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAvatarChange = (data: any) => {
    setForm((prev) => ({ ...prev, ...data }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.nome || !form.email) {
      alert("Nome e E-mail sÍo obrigatórios.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit(form);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-4xl mx-auto space-y-6 mt-8 font-poppins bg-white p-8 rounded-lg shadow-md"
    >
      <div className="flex flex-col items-center mb-6">
        <PessoaAvatarUploader
          nome={form.nome || "Sem nome"}
          avatar_url={form.avatar_url}
          foto_url={form.foto_url}
          avatar={form.avatar}
          onChange={handleAvatarChange}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Nome */}
        <div>
          <label className="block text-sm font-medium mb-1">Nome *</label>
          <label htmlFor="nome" className="block text-sm font-medium mb-1">Nome *</label>
          <input
            id="nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
            required
            title="Nome completo"
            placeholder="Digite o nome"
          />
        </div>
        {/* E-mail */}
        <div>
          <label className="block text-sm font-medium mb-1">E-mail *</label>
          <label htmlFor="email" className="block text-sm font-medium mb-1">E-mail *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
            required
            title="E-mail"
            placeholder="Digite o e-mail"
          />
        </div>
        {/* Telefone */}
        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <label htmlFor="telefone" className="block text-sm font-medium mb-1">Telefone</label>
          <input
            id="telefone"
            name="telefone"
            value={form.telefone ?? ""}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
            title="Telefone"
            placeholder="Digite o telefone"
          />
        </div>
        {/* Cargo */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Cargo / FunçÍo
          </label>
          <label htmlFor="cargo" className="block text-sm font-medium mb-1">Cargo / FunçÍo</label>
          <input
            id="cargo"
            name="cargo"
            value={form.cargo ?? ""}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
            title="Cargo ou funçÍo"
            placeholder="Digite o cargo ou funçÍo"
          />
        </div>
        {/* Unidade */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Unidade / RegiÍo
          </label>
          <label htmlFor="unidade" className="block text-sm font-medium mb-1">Unidade / RegiÍo</label>
          <input
            id="unidade"
            name="unidade"
            value={form.unidade ?? ""}
            onChange={handleChange}
            className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
            title="Unidade ou regiÍo"
            placeholder="Digite a unidade ou regiÍo"
          />
        </div>
        {/* Especificador (apenas para CLIENTE) */}
        {tipo === "CLIENTE" && (
          <div>
            <label htmlFor="indicado_por_id" className="block text-sm font-medium mb-1">Especificador (IndicaçÍo)</label>
              <select
                id="indicado_por_id"
                name="indicado_por_id"
                value={form.indicado_por_id ?? ""}
                onChange={handleChange}
                className="w-full border rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#F25C26]"
                title="Selecione o especificador"
            >
              <option value="">Nenhum</option>
              {especificadores.map((esp) => (
                <option key={esp.id} value={esp.id}>
                  {esp.nome}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ativo */}
      <div className="flex items-center gap-2 mt-4">
        <input
          type="checkbox"
          title="Ativo"
          placeholder="Ativo"
          name="ativo"
          checked={form.ativo ?? true}
          onChange={handleChange}
        />
        <span className="text-sm">Cadastro ativo</span>
      </div>

      {/* Botões */}
      <div className="flex gap-2 pt-6 justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md border text-sm hover:bg-gray-50"
          >
            Cancelar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2 rounded-md text-sm font-normal bg-primary text-white hover:bg-[#d94d1a] disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </form>
  );
}

