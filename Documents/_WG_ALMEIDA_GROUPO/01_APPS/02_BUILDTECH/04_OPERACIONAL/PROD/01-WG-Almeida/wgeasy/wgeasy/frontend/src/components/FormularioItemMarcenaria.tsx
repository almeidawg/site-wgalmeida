// src/components/FormularioItemMarcenaria.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/components/ui/use-toast";

const TIPOS_IMAGEM_ACEITOS = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const TAMANHO_MAX_MB = 5;

interface Props {
  obraId: string;
  onSalvar: () => void;
}

export default function FormularioItemMarcenaria({ obraId, onSalvar }: Props) {
  const { toast } = useToast();
  const [descricao, setDescricao] = useState("");
  const [ambiente, setAmbiente] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [largura, setLargura] = useState(0);
  const [altura, setAltura] = useState(0);
  const [profundidade, setProfundidade] = useState(0);
  const [acabamento, setAcabamento] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [status, setStatus] = useState("pendente");
  const [valorUnitario, setValorUnitario] = useState(0);
  const [imagem, setImagem] = useState<File | null>(null);

  async function handleSalvar() {
    const valor_total = quantidade * valorUnitario;

    let imagem_url = "";
    if (imagem) {
      // ValidaçÍo de tipo
      if (!TIPOS_IMAGEM_ACEITOS.includes(imagem.type)) {
        toast({ variant: "destructive", title: "Tipo de arquivo inválido", description: "Envie apenas imagens JPG, PNG, WebP ou GIF." });
        return;
      }
      // ValidaçÍo de tamanho
      if (imagem.size > TAMANHO_MAX_MB * 1024 * 1024) {
        toast({ variant: "destructive", title: "Arquivo muito grande", description: `O tamanho máximo permitido é ${TAMANHO_MAX_MB}MB.` });
        return;
      }

      const nomeArquivo = `${obraId}/marcenaria/${Date.now()}_${imagem.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documentos")
        .upload(nomeArquivo, imagem);

      if (uploadError) {
        toast({ variant: "destructive", title: "Erro ao enviar imagem", description: uploadError.message });
        return;
      }

      imagem_url = supabase.storage.from("documentos").getPublicUrl(nomeArquivo).data.publicUrl;
    }

    const { error } = await supabase.from("marcenaria_itens").insert({
      obra_id: obraId,
      ambiente,
      descricao,
      quantidade,
      largura,
      altura,
      profundidade,
      acabamento,
      observacoes,
      valor_unitario: valorUnitario,
      valor_total,
      status,
      imagem_url,
    });

    if (error) {
      toast({ variant: "destructive", title: "Erro ao salvar item", description: error.message });
    } else {
      toast({ title: "Item salvo com sucesso!" });
      onSalvar();
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Adicionar Item de Marcenaria</h3>
      <input value={ambiente} onChange={(e) => setAmbiente(e.target.value)} placeholder="Ambiente" />
      <input value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="DescriçÍo" />
      <input type="number" value={quantidade} onChange={(e) => setQuantidade(+e.target.value)} placeholder="Qtd" />
      <input type="number" value={largura} onChange={(e) => setLargura(+e.target.value)} placeholder="Largura" />
      <input type="number" value={altura} onChange={(e) => setAltura(+e.target.value)} placeholder="Altura" />
      <input type="number" value={profundidade} onChange={(e) => setProfundidade(+e.target.value)} placeholder="Profundidade" />
      <input value={acabamento} onChange={(e) => setAcabamento(e.target.value)} placeholder="Acabamento" />
      <textarea value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observações" />
      <select value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="pendente">Pendente</option>
        <option value="em_producao">Em ProduçÍo</option>
        <option value="entregue">Entregue</option>
      </select>
      <input type="number" value={valorUnitario} onChange={(e) => setValorUnitario(+e.target.value)} placeholder="Valor Unitário" />
      <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={(e) => setImagem(e.target.files?.[0] || null)} />
      <button onClick={handleSalvar}>Salvar Item</button>
    </div>
  );
}

