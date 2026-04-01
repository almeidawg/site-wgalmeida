// ============================================================
// COMPONENTE: ItensEmAndamento
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// SeçÍo que mostra itens em andamento e concluídos com barras de progresso
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Clock, FileText, Loader2 } from "lucide-react";

interface ItemProgresso {
  id: string;
  nome: string;
  progresso: number;
  status: "em_andamento" | "concluido" | "pendente";
}

interface ItensEmAndamentoProps {
  clienteId: string;
  contratoId?: string;
}

export default function ItensEmAndamento({ clienteId: _clienteId, contratoId }: ItensEmAndamentoProps) {
  const [itens, setItens] = useState<ItemProgresso[]>([]);
  const [loading, setLoading] = useState(true);

  const carregarItens = useCallback(async () => {
    try {
      setLoading(true);

      type EtapaRow = { id: string; nome: string; status?: string | null; progresso?: number | null };

      // Buscar etapas do cronograma ou checklist
      let query = supabase
        .from("cronograma_etapas")
        .select("id, nome, status, progresso")
        .order("ordem", { ascending: true });

      if (contratoId) {
        query = query.eq("contrato_id", contratoId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Erro ao carregar itens:", error);
        setItens([]);
        return;
      }

      const itensFormatados: ItemProgresso[] = (data as EtapaRow[] | null || []).map((item) => {
        const progresso = item.progresso || 0;
        return {
          id: item.id,
          nome: item.nome,
          progresso,
          status: item.status === "concluido" ? "concluido" :
            progresso > 0 ? "em_andamento" : "pendente",
        };
      });

      setItens(itensFormatados);
    } catch (error) {
      console.error("Erro ao carregar itens:", error);
      setItens([]);
    } finally {
      setLoading(false);
    }
  }, [contratoId]);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Carregando itens...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const itensEmAndamento = itens.filter(i => i.status === "em_andamento" || i.status === "concluido");

  if (itensEmAndamento.length === 0) {
    return (
      <Card className="overflow-hidden">
        <CardHeader className="bg-white border-b">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="w-5 h-5 text-gray-600" />
            Itens em andamento e concluídos
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum item em andamento</p>
          <p className="text-sm text-gray-400 mt-1">As etapas do seu projeto aparecerÍo aqui</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-white border-b">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="w-5 h-5 text-gray-600" />
          Itens em andamento e concluídos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-gray-100">
          {itensEmAndamento.map((item) => (
            <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {item.status === "concluido" ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <Clock className="w-4 h-4 text-amber-500" />
                  )}
                  <span className="text-sm font-medium text-gray-700">{item.nome}</span>
                </div>
                <span className={`text-sm font-normal ${
                  item.progresso === 100 ? "text-green-600" : "text-blue-600"
                }`}>
                  {item.progresso}%
                </span>
              </div>
              <div className="relative">
                <Progress
                  value={item.progresso}
                  className={`h-2 ${item.progresso === 100 ? "[&>div]:bg-green-500" : "[&>div]:bg-blue-500"}`}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

