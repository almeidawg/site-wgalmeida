/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { MarcenariaPrazoFornecedor } from "../types";

interface UsePrazosOptions {
  fornecedorId?: string;
  ano?: number;
  mes?: number;
}

interface UsePrazosReturn {
  prazos: MarcenariaPrazoFornecedor[];
  prazoAtual: MarcenariaPrazoFornecedor | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  salvarPrazo: (data: PrazoFormData) => Promise<boolean>;
  atualizarPrazo: (id: string, data: Partial<MarcenariaPrazoFornecedor>) => Promise<boolean>;
  deletarPrazo: (id: string) => Promise<boolean>;
  getPrazoParaMes: (fornecedorId: string, ano: number, mes: number) => MarcenariaPrazoFornecedor | null;
}

interface PrazoFormData {
  fornecedor_id: string;
  ano: number;
  mes: number;
  dias_uteis_producao: number;
  dias_coleta: number;
  dias_entrega: number;
  observacoes?: string;
}

export function usePrazos(options: UsePrazosOptions = {}): UsePrazosReturn {
  const [prazos, setPrazos] = useState<MarcenariaPrazoFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPrazos = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("marcenaria_prazos_fornecedor")
        .select(`
          *,
          fornecedor:pessoas!marcenaria_prazos_fornecedor_fornecedor_id_fkey(
            id,
            nome
          )
        `)
        .order("ano", { ascending: false })
        .order("mes_referencia", { ascending: false });

      if (options.fornecedorId) {
        query = query.eq("fornecedor_id", options.fornecedorId);
      }

      if (options.ano) {
        query = query.eq("ano", options.ano);
      }

      if (options.mes) {
        query = query.eq("mes", options.mes);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setPrazos(data || []);
    } catch (err: any) {
      console.error("Erro ao buscar prazos:", err);
      setError(err.message || "Erro ao buscar prazos");
    } finally {
      setLoading(false);
    }
  }, [options.fornecedorId, options.ano, options.mes]);

  useEffect(() => {
    fetchPrazos();
  }, [fetchPrazos]);

  // Prazo do mes atual para o fornecedor selecionado
  const prazoAtual = options.fornecedorId
    ? prazos.find((p) => {
        const agora = new Date();
        return (
          p.fornecedor_id === options.fornecedorId &&
          p.ano === agora.getFullYear() &&
          p.mes === agora.getMonth() + 1
        );
      }) || null
    : null;

  const getPrazoParaMes = (
    fornecedorId: string,
    ano: number,
    mes: number
  ): MarcenariaPrazoFornecedor | null => {
    return (
      prazos.find(
        (p) => p.fornecedor_id === fornecedorId && p.ano === ano && p.mes === mes
      ) || null
    );
  };

  const salvarPrazo = async (data: PrazoFormData): Promise<boolean> => {
    try {
      // Verificar se ja existe prazo para este fornecedor/ano/mes
      const existente = prazos.find(
        (p) =>
          p.fornecedor_id === data.fornecedor_id &&
          p.ano === data.ano &&
          p.mes === data.mes
      );

      if (existente) {
        // Atualizar existente
        return await atualizarPrazo(existente.id, data);
      }

      // Criar novo
      const { data: novoPrazo, error: insertError } = await supabase
        .from("marcenaria_prazos_fornecedor")
        .insert(data)
        .select()
        .single();

      if (insertError) throw insertError;

      setPrazos((prev) => [novoPrazo, ...prev]);
      return true;
    } catch (err: any) {
      console.error("Erro ao salvar prazo:", err);
      setError(err.message || "Erro ao salvar prazo");
      return false;
    }
  };

  const atualizarPrazo = async (
    id: string,
    data: Partial<MarcenariaPrazoFornecedor>
  ): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from("marcenaria_prazos_fornecedor")
        .update(data)
        .eq("id", id);

      if (updateError) throw updateError;

      setPrazos((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...data } : p))
      );

      return true;
    } catch (err: any) {
      console.error("Erro ao atualizar prazo:", err);
      setError(err.message || "Erro ao atualizar prazo");
      return false;
    }
  };

  const deletarPrazo = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from("marcenaria_prazos_fornecedor")
        .delete()
        .eq("id", id);

      if (deleteError) throw deleteError;

      setPrazos((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: any) {
      console.error("Erro ao deletar prazo:", err);
      setError(err.message || "Erro ao deletar prazo");
      return false;
    }
  };

  return {
    prazos,
    prazoAtual,
    loading,
    error,
    refetch: fetchPrazos,
    salvarPrazo,
    atualizarPrazo,
    deletarPrazo,
    getPrazoParaMes,
  };
}

// Hook para buscar prazo padrao do sistema
export function usePrazoPadrao() {
  const [prazoPadrao, setPrazoPadrao] = useState({
    dias_uteis_producao: 20,
    dias_coleta: 2,
    dias_entrega: 3,
    dias_montagem: 5,
  });

  useEffect(() => {
    // Poderia buscar de uma config do sistema
    // Por enquanto usa valores padrao
  }, []);

  return prazoPadrao;
}
