// src/components/ImportadorMarcenaria.tsx

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { parseStringPromise } from "xml2js";

interface ItemXML {
  ambiente: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  profundidade: number;
  acabamento: string;
  observacoes: string;
  valor_unitario: number;
  valor_total: number;
}

export default function ImportadorMarcenaria({ obraId }: { obraId: string }) {
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function handleImportar() {
    if (!arquivo) return alert("Selecione um arquivo XML.");
    setCarregando(true);

    const texto = await arquivo.text();
    const json = await parseStringPromise(texto, { explicitArray: false });

    const blocos = json?.projeto?.ambientes?.ambiente || [];
    const itens: ItemXML[] = [];

    for (const bloco of Array.isArray(blocos) ? blocos : [blocos]) {
      const ambiente = bloco.nome;
      const pecas = Array.isArray(bloco.peca) ? bloco.peca : [bloco.peca];

      for (const peca of pecas) {
        itens.push({
          ambiente,
          descricao: peca.nome,
          quantidade: Number(peca.qtd || 1),
          largura: Number(peca.largura || 0),
          altura: Number(peca.altura || 0),
          profundidade: Number(peca.profundidade || 0),
          acabamento: peca.acabamento || "",
          observacoes: peca.observacao || "",
          valor_unitario: Number(peca.valor_unitario || 0),
          valor_total: Number(peca.valor_total || 0),
        });
      }
    }

    // InserçÍo no Supabase
    const payload = itens.map((item) => ({ ...item, obra_id: obraId }));
    const { error } = await supabase.from("marcenaria_itens").insert(payload);

    setCarregando(false);
    if (error) {
      console.error("Erro ao importar:", error.message);
      alert("Erro ao importar itens.");
    } else {
      alert("Itens importados com sucesso!");
    }
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h3>Importar XML de Marcenaria</h3>
      <input type="file" accept=".xml" onChange={(e) => setArquivo(e.target.files?.[0] || null)} />
      <button onClick={handleImportar} disabled={carregando}>
        {carregando ? "Importando..." : "Importar"}
      </button>
    </div>
  );
}

