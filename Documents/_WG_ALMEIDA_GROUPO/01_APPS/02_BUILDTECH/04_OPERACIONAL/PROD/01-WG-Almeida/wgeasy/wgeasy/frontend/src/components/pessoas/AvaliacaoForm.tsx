// src/components/pessoas/AvaliacaoForm.tsx
import React, { useState } from "react";
import { criarAvaliacao } from "@/lib/pessoasApi";
import { useAuth } from "@/auth/AuthContext";

interface Props {
  pessoaId: string;
  onSaved: () => void;
}

const AvaliacaoForm: React.FC<Props> = ({ pessoaId, onSaved }) => {
  const { user } = useAuth();
  const [nota, setNota] = useState<number>(10);
  const [comentario, setComentario] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!user?.id) {
      setErro("Usuário não autenticado.");
      return;
    }

    setErro(null);
    setLoading(true);

    try {
      await criarAvaliacao(pessoaId, user.id, nota, comentario);
      setNota(10);
      setComentario("");
      onSaved();
    } catch (err: any) {
      setErro(err?.message ?? "Erro ao salvar avaliaçÍo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-normal uppercase tracking-[0.2em] text-[#4C4C4C]">
        Nova AvaliaçÍo
      </div>

      {erro && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <select
          value={nota}
          onChange={(e) => setNota(Number(e.target.value))}
          className="rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#F25C26]"
        >
          {Array.from({ length: 10 }).map((_, index) => {
            const valor = 10 - index;
            return (
              <option key={valor} value={valor}>
                Nota {valor}
              </option>
            );
          })}
        </select>

        <textarea
          value={comentario}
          onChange={(e) => setComentario(e.target.value)}
          placeholder="Comentário (opcional)"
          className="min-h-[80px] rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#F25C26]"
        />

        <button
          type="button"
          onClick={enviar}
          disabled={loading}
          className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[#e25221] transition disabled:opacity-60"
        >
          {loading ? "Salvando..." : "Salvar AvaliaçÍo"}
        </button>
      </div>
    </div>
  );
};

export default AvaliacaoForm;


