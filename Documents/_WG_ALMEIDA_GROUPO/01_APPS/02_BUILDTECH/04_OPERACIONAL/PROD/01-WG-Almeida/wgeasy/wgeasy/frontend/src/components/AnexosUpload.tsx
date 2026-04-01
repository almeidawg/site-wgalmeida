import { FormEvent, useState, ChangeEvent } from "react";
import { supabase } from "@/lib/supabaseClient";

const TIPOS_ACEITOS = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/msword", "application/vnd.ms-excel",
];
const TAMANHO_MAX_MB = 20;

const CATEGORIAS = [
  { value: "contratos", label: "Contratos" },
  { value: "plantas", label: "Plantas / Arquitetura" },
  { value: "tecnico", label: "Técnico / Marcenaria" },
  { value: "fotos", label: "Fotos da obra" },
  { value: "relatorios", label: "Relatórios" },
  { value: "outros", label: "Outros" },
];

type Props = {
  obraId: string;
  userId: string | null;
  onUploaded: () => void;
};

const BUCKET = "wgeasy_obras";

export default function AnexosUpload({ obraId, userId, onUploaded }: Props) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [categoria, setCategoria] = useState("fotos");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setArquivo(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!obraId) {
      setErro("Obra inválida.");
      return;
    }

    if (!arquivo) {
      setErro("Selecione um arquivo para enviar.");
      return;
    }

    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      setErro("Tipo de arquivo não permitido. Envie imagens, PDFs, Word ou Excel.");
      return;
    }

    if (arquivo.size > TAMANHO_MAX_MB * 1024 * 1024) {
      setErro(`O arquivo excede o limite de ${TAMANHO_MAX_MB}MB.`);
      return;
    }

    setEnviando(true);

    try {
      const caminho = `${obraId}/${categoria}/${Date.now()}_${arquivo.name}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, arquivo);

      if (uploadError) {
        console.error(uploadError);
        setErro("Falha ao enviar o arquivo.");
        setEnviando(false);
        return;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(BUCKET).getPublicUrl(caminho);

      const { error: insertError } = await supabase.from("obras_anexos").insert({
        obra_id: obraId,
        categoria,
        nome_arquivo: arquivo.name,
        url_publica: publicUrl,
        mime_type: arquivo.type || null,
        tamanho_bytes: arquivo.size,
        criado_por: userId,
      });

      if (insertError) {
        console.error(insertError);
        setErro("Arquivo enviado, mas falhou ao registrar no banco.");
        setEnviando(false);
        return;
      }

      setArquivo(null);
      const inputElement = document.getElementById("anexos-input") as HTMLInputElement | null;
      if (inputElement) {
        inputElement.value = "";
      }
      onUploaded();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="anexos-upload" onSubmit={handleSubmit}>
      <select
        value={categoria}
        onChange={(e) => setCategoria(e.target.value)}
        className="anexos-upload-select"
      >
        {CATEGORIAS.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>

      <label className="anexos-upload-label">
        <span>Selecionar arquivo</span>
        <input
          id="anexos-input"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,.doc,.docx,.xls,.xlsx"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </label>

      <button
        type="submit"
        className="anexos-upload-btn"
        disabled={enviando || !arquivo}
      >
        {enviando ? "Enviando..." : "Enviar"}
      </button>

      {erro && <p className="anexos-upload-erro">{erro}</p>}
    </form>
  );
}


