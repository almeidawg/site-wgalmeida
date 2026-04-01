// src/components/pessoas/UploadDocumento.tsx
import React, { useState } from "react";
import { uploadDocumentoPessoa } from "@/lib/uploadDocumentoPessoa";

interface Props {
  pessoaId: string;
  onUploaded: () => void;
}

const UploadDocumento: React.FC<Props> = ({ pessoaId, onUploaded }) => {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [tipo, setTipo] = useState("");
  const [validade, setValidade] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar() {
    if (!arquivo || !tipo) {
      setErro("Arquivo e tipo sÍo obrigatórios.");
      return;
    }

    setErro(null);
    setLoading(true);

    try {
      await uploadDocumentoPessoa(pessoaId, arquivo, tipo, validade);
      setArquivo(null);
      setTipo("");
      setValidade("");
      onUploaded();
    } catch (err: any) {
      setErro(err?.message ?? "Erro ao enviar documento.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border border-[#E5E5E5] bg-white p-4 shadow-sm">
      <div className="mb-2 text-xs font-normal uppercase tracking-[0.2em] text-[#4C4C4C]">
        Enviar novo documento
      </div>

      {erro && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {erro}
        </div>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <select
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
          className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#F25C26]"
        >
          <option value="">Tipo do documento</option>
          <option value="RG">RG</option>
          <option value="CPF">CPF</option>
          <option value="CNH">CNH</option>
          <option value="Comprovante">Comprovante</option>
          <option value="Contrato">Contrato</option>
        </select>

        <input
          type="date"
          value={validade}
          onChange={(e) => setValidade(e.target.value)}
          className="w-full rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm outline-none focus:border-[#F25C26]"
        />

        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0] || null;
            setArquivo(file);
          }}
          className="w-full cursor-pointer rounded-lg border border-[#E5E5E5] px-3 py-2 text-sm"
        />
      </div>

      <button
        type="button"
        onClick={enviar}
        disabled={loading}
        className="mt-4 rounded-full bg-primary px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-[#e25221] transition disabled:opacity-60"
      >
        {loading ? "Enviando..." : "Enviar"}
      </button>
    </div>
  );
};

export default UploadDocumento;

