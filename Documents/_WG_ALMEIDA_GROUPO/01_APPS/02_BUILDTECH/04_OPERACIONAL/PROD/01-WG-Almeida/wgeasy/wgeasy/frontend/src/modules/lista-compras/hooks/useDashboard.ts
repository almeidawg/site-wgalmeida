/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// Hook: useDashboard
// Dashboard financeiro da lista de compras
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { TotalizacaoProjeto, DashboardFinanceiro } from '../types';

interface UseDashboardReturn {
  // Estados
  dados: TotalizacaoProjeto | null;
  dashboardCompleto: DashboardFinanceiro | null;
  loading: boolean;
  error: string | null;

  // Ações
  recarregar: () => Promise<void>;
}

export function useDashboard(projetoId: string): UseDashboardReturn {
  const [dados, setDados] = useState<TotalizacaoProjeto | null>(null);
  const [dashboardCompleto, setDashboardCompleto] = useState<DashboardFinanceiro | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // CARREGAR DADOS
  // ============================================================
  const recarregar = useCallback(async () => {
    if (!projetoId) {
      setDados(null);
      setDashboardCompleto(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Tentar usar a function RPC primeiro
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'totalizar_lista_compras_projeto',
        { p_projeto_id: projetoId }
      );

      if (!rpcError && rpcData && rpcData.length > 0) {
        const totais = rpcData[0];
        setDados({
          total_itens: totais.total_itens || 0,
          valor_total: totais.valor_total || 0,
          valor_wg_compra: totais.valor_wg_compra || 0,
          valor_cliente_direto: totais.valor_cliente_direto || 0,
          valor_fee: totais.valor_fee || 0,
          conta_real: totais.conta_real || 0,
          conta_virtual: totais.conta_virtual || 0,
        });

        // Tentar obter dashboard completo da view
        await carregarDashboardCompleto();
        return;
      }

      // Fallback: calcular localmente
      console.log('Fallback para cálculo local do dashboard');
      await calcularLocalmente();
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
      setError('Erro ao carregar dashboard');
      // Tentar fallback
      await calcularLocalmente();
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  // ============================================================
  // CARREGAR DASHBOARD COMPLETO (VIEW)
  // ============================================================
  const carregarDashboardCompleto = useCallback(async () => {
    try {
      const { data, error: viewError } = await supabase
        .from('v_lista_compras_dashboard')
        .select('*')
        .eq('projeto_id', projetoId)
        .single();

      if (!viewError && data) {
        setDashboardCompleto(data as DashboardFinanceiro);
      }
    } catch {
      // Silencioso - view pode não existir
    }
  }, [projetoId]);

  // ============================================================
  // CALCULAR LOCALMENTE (FALLBACK)
  // ============================================================
  const calcularLocalmente = useCallback(async () => {
    try {
      const { data: itens, error: fetchError } = await supabase
        .from('lista_compras_itens')
        .select('valor_total, valor_fee, tipo_compra, tipo_conta, status')
        .eq('projeto_id', projetoId)
        .neq('status', 'CANCELADO');

      if (fetchError) throw fetchError;

      const totais = (itens || []).reduce(
        (acc, item) => {
          acc.total_itens += 1;
          acc.valor_total += item.valor_total || 0;
          acc.valor_fee += item.valor_fee || 0;

          if (item.tipo_compra === 'WG_COMPRA') {
            acc.valor_wg_compra += item.valor_total || 0;
          } else {
            acc.valor_cliente_direto += item.valor_total || 0;
          }

          if (item.tipo_conta === 'REAL') {
            acc.conta_real += item.valor_total || 0;
          } else {
            acc.conta_virtual += item.valor_fee || 0;
          }

          return acc;
        },
        {
          total_itens: 0,
          valor_total: 0,
          valor_wg_compra: 0,
          valor_cliente_direto: 0,
          valor_fee: 0,
          conta_real: 0,
          conta_virtual: 0,
        }
      );

      setDados(totais);
    } catch (err) {
      console.error('Erro no cálculo local:', err);
      // Definir valores zerados
      setDados({
        total_itens: 0,
        valor_total: 0,
        valor_wg_compra: 0,
        valor_cliente_direto: 0,
        valor_fee: 0,
        conta_real: 0,
        conta_virtual: 0,
      });
    }
  }, [projetoId]);

  // Carregar ao montar ou mudar projeto
  useEffect(() => {
    recarregar();
  }, [recarregar]);

  return {
    dados,
    dashboardCompleto,
    loading,
    error,
    recarregar,
  };
}

export default useDashboard;


