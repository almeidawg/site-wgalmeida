/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/MarcenariaPage.tsx

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useAuth } from "@/auth/AuthContext";
import DashboardMarcenariaStatus from "@/components/DashboardMarcenariaStatus";
import UploadTecnicoMarcenaria from "@/components/UploadTecnicoMarcenaria";

interface ItemMarcenaria {
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

export default function MarcenariaPage() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const [itens, setItens] = useState<ItemMarcenaria[]>([]);
  const [loading, setLoading] = useState(true);

  if (!user && !authLoading) {
    throw new Error("Usuário nÍo autenticado");
  }

  const userId = user?.id;

  useEffect(() => {
    async function carregar() {
      if (!userId) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("marcenaria_itens")
        .select("*")
        .eq("responsavel", userId)
        .order("ambiente", { ascending: true });

      if (error) console.error(error.message);
      else setItens(data || []);
      setLoading(false);
    }
    carregar();
  }, [userId]);

  async function handleAtualizarStatus(id: string, novoStatus: string) {
    const { error } = await supabase
      .from("marcenaria_itens")
      .update({ status: novoStatus })
      .eq("id", id)
      .eq("responsavel", userId);

    if (error) toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar status" });
    else setItens(itens.map(i => i.id === id ? { ...i, status: novoStatus } : i));
  }

  async function handleExcluir(id: string) {
    const confirmar = confirm("Deseja excluir este item?");
    if (!confirmar) return;

    const { error } = await supabase
      .from("marcenaria_itens")
      .delete()
      .eq("id", id)
      .eq("responsavel", userId);

    if (error) { toast({ variant: "destructive", title: "Erro ao excluir", description: error.message }); }
    else setItens(itens.filter(i => i.id !== id));
  }

  if (authLoading || loading) return <p>Carregando itens de marcenaria...</p>;

  const agrupado = itens.reduce((acc, item) => {
    acc[item.ambiente] = acc[item.ambiente] || [];
    acc[item.ambiente].push(item);
    return acc;
  }, {} as Record<string, ItemMarcenaria[]>);

  return (
    <div className="p-6">
      {userId && <DashboardMarcenariaStatus obraId={userId} />}

      {Object.entries(agrupado).map(([ambiente, lista]) => (
        <div key={ambiente} style={{ marginBottom: "32px" }}>
          <h3 className="text-[20px] font-normal text-[#8B5E3C] mb-4">{ambiente}</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }} className="text-lg">
            <thead>
              <tr>
                <th>DescriçÍo</th>
                <th>Qtd</th>
                <th>LxAxP</th>
                <th>Acabamento</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {lista.map(item => (
                <>
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td>{item.descricao}</td>
                    <td>{item.quantidade}</td>
                    <td>{item.largura}x{item.altura}x{item.profundidade}</td>
                    <td>{item.acabamento}</td>
                    <td>
                      <select value={item.status} onChange={(e) => handleAtualizarStatus(item.id, e.target.value)} className="text-lg">
                        <option value="pendente">Pendente</option>
                        <option value="em_producao">Em ProduçÍo</option>
                        <option value="entregue">Entregue</option>
                      </select>
                    </td>
                    <td>
                      <button onClick={() => handleExcluir(item.id)} className="bg-red-600 text-white px-2 py-1 rounded text-lg">Excluir</button>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={6}>
                      <UploadTecnicoMarcenaria itemId={item.id} />
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
