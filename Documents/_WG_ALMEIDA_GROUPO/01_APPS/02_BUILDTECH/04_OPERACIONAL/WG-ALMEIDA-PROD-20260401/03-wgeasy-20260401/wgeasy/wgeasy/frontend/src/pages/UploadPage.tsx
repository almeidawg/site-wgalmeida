import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/auth/AuthContext";

export default function UploadPage() {
  const { user } = useAuth();

  const [arquivo, setArquivo] = useState<File | null>(null);
  const [obraId, setObraId] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState("");

  async function handleUpload() {
    setMensagem("");

    if (!user) {
      setMensagem("Usuário nÍo autenticado.");
      return;
    }

    if (!arquivo) {
      setMensagem("Selecione um arquivo para enviar.");
      return;
    }

    if (!obraId.trim()) {
      setMensagem("Informe o ID da obra.");
      return;
    }

    try {
      setCarregando(true);

      const caminho = `${obraId}/${Date.now()}_${arquivo.name}`;

      const { error } = await supabase.storage
        .from("uploads")
        .upload(caminho, arquivo);

      if (error) {
        setMensagem("Erro ao enviar arquivo: " + error.message);
      } else {
        setMensagem("Arquivo enviado com sucesso!");
      }
    } catch (err) {
      console.error(err);
      setMensagem("Erro inesperado ao enviar arquivo.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h1 className="text-2xl font-normal text-gray-900">Upload de Arquivos</h1>

      <div style={{ marginTop: 20 }}>
        <label className="text-lg">ID da Obra:</label>
        <input
          type="text"
          value={obraId}
          onChange={(e) => setObraId(e.target.value)}
          style={{ display: "block", marginBottom: 12, padding: 8 }}
        />

        <input
          type="file"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
          style={{ marginBottom: 12 }}
        />

        <button
          onClick={handleUpload}
          disabled={carregando}
          className="text-lg"
          style={{
            padding: "10px 22px",
            backgroundColor: "#F25C26",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
          }}
        >
          {carregando ? "Enviando..." : "Enviar Arquivo"}
        </button>

        {mensagem && (
          <p style={{ marginTop: 14, color: "darkred", fontWeight: "bold" }}>
            {mensagem}
          </p>
        )}
      </div>
    </div>
  );
}

