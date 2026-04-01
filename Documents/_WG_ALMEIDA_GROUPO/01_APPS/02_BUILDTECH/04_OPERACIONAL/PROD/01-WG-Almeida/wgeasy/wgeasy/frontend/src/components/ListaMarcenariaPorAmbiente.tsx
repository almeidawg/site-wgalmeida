// src/components/ListaMarcenariaPorAmbiente.tsx

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { gerarPdfMarcenaria } from "@/utils/gerarPdfMarcenaria";
import DashboardMarcenariaStatus from "@/components/DashboardMarcenariaStatus";

interface Item {
  id: string;
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
  status: string;
}

export default function ListaMarcenariaPorAmbiente({ obraId }: { obraId: string }) {
  const [itens, setItens] = useState<Item[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      const { data, error } = await supabase
        .from("marcenaria_itens")
        .select("*")
        .eq("obra_id", obraId)
        .order("ambiente", { ascending: true });

      if (error) {
        console.error("Erro ao carregar marcenaria:", error.message);
      } else {
        setItens(data || []);
      }
      setCarregando(false);
    }

    carregar();
  }, [obraId]);

  async function atualizarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from("marcenaria_itens")
      .update({ status: novoStatus })
      .eq("id", id);

    if (error) {
      alert("Erro ao atualizar status");
    } else {
      setItens((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: novoStatus } : item))
      );
    }
  }

  const agrupado = itens.reduce((acc, item) => {
    acc[item.ambiente] = acc[item.ambiente] || [];
    acc[item.ambiente].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  function handleExportarPDF() {
    gerarPdfMarcenaria(obraId, itens);
  }

  if (carregando) return <p>Carregando marcenaria...</p>;
  if (itens.length === 0) return <p>Nenhum item de marcenaria cadastrado.</p>;

  return (
    <div>
      <DashboardMarcenariaStatus obraId={obraId} />

      <div style={{ marginBottom: "16px" }}>
        <button onClick={handleExportarPDF}>Exportar PDF</button>
      </div>

      {Object.entries(agrupado).map(([ambiente, lista]) => (
        <div key={ambiente} style={{ marginBottom: "32px" }}>
          <h3>{ambiente}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th>DescriçÍo</th>
                <th>Qtd</th>
                <th>LxAxP</th>
                <th>Acabamento</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((item) => (
                <tr key={item.id}>
                  <td>{item.descricao}</td>
                  <td>{item.quantidade}</td>
                  <td>
                    {item.largura}x{item.altura}x{item.profundidade}
                  </td>
                  <td>{item.acabamento}</td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => atualizarStatus(item.id, e.target.value)}
                    >
                      <option value="pendente">Pendente</option>
                      <option value="em_producao">Em ProduçÍo</option>
                      <option value="entregue">Entregue</option>
                    </select>
                  </td>
                  <td>R$ {item.valor_total.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

