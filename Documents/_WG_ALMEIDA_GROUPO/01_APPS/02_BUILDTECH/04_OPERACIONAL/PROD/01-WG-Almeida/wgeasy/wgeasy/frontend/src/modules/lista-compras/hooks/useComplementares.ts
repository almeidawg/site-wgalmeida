/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// Hook: useComplementares
// Cálculo de produtos complementares
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ComplementarCalculado } from '../types';

interface UseComplementaresReturn {
  // Estados
  complementares: ComplementarCalculado[];
  loading: boolean;
  error: string | null;

  // Ações
  calcular: (produtoId: string, quantidade: number) => Promise<ComplementarCalculado[]>;
  calcularPorCategoria: (categoria: string, quantidade: number) => Promise<ComplementarCalculado[]>;
  limpar: () => void;
  toggleSelecao: (index: number) => void;
  selecionarObrigatorios: () => void;

  // Helpers
  getComplementaresSelecionados: () => ComplementarCalculado[];
  getTotalSelecionados: () => number;
}

export function useComplementares(): UseComplementaresReturn {
  const [complementares, setComplementares] = useState<ComplementarCalculado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ============================================================
  // CALCULAR COMPLEMENTARES POR PRODUTO
  // ============================================================
  const calcular = useCallback(
    async (produtoId: string, quantidade: number): Promise<ComplementarCalculado[]> => {
      setLoading(true);
      setError(null);

      try {
        // Tentar usar a function RPC primeiro
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          'calcular_complementares_lista_compras',
          {
            p_produto_id: produtoId,
            p_quantidade: quantidade,
          }
        );

        if (!rpcError && rpcData && rpcData.length > 0) {
          const complementaresComSelecao = rpcData.map((c: ComplementarCalculado) => ({
            ...c,
            selecionado: c.obrigatoriedade === 'OBRIGATORIO',
          }));

          setComplementares(complementaresComSelecao);
          return complementaresComSelecao;
        }

        // Fallback: buscar regras gerais
        console.log('Fallback para busca de complementares por produto');
        return await buscarComplementaresDireto(produtoId, quantidade);
      } catch (err) {
        console.error('Erro ao calcular complementares:', err);
        setError('Erro ao calcular complementares');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ============================================================
  // CALCULAR COMPLEMENTARES POR CATEGORIA
  // ============================================================
  const calcularPorCategoria = useCallback(
    async (categoria: string, quantidade: number): Promise<ComplementarCalculado[]> => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: fetchError } = await supabase
          .from('lista_compras_complementares')
          .select('*')
          .eq('categoria_base', categoria)
          .eq('ativo', true);

        if (fetchError) throw fetchError;

        if (!data || data.length === 0) {
          setComplementares([]);
          return [];
        }

        const complementaresCalculados: ComplementarCalculado[] = data.map((c) => ({
          complemento_descricao: c.complemento_descricao,
          quantidade_necessaria: Math.round(quantidade * c.qtd_por_unidade * 100) / 100,
          unidade: c.unidade_calculo || 'un',
          preco_referencia: c.preco_referencia || 0,
          valor_estimado:
            Math.round(quantidade * c.qtd_por_unidade * (c.preco_referencia || 0) * 100) / 100,
          obrigatoriedade: c.obrigatoriedade,
          selecionado: c.obrigatoriedade === 'OBRIGATORIO',
        }));

        setComplementares(complementaresCalculados);
        return complementaresCalculados;
      } catch (err) {
        console.error('Erro ao calcular complementares por categoria:', err);
        setError('Erro ao calcular complementares');
        return [];
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // ============================================================
  // BUSCAR COMPLEMENTARES DIRETAMENTE (FALLBACK)
  // ============================================================
  const buscarComplementaresDireto = useCallback(
    async (produtoId: string, quantidade: number): Promise<ComplementarCalculado[]> => {
      try {
        // Buscar por produto_base_id
        const { data: porProduto, error: err1 } = await supabase
          .from('lista_compras_complementares')
          .select('*')
          .eq('produto_base_id', produtoId)
          .eq('ativo', true);

        if (!err1 && porProduto && porProduto.length > 0) {
          const complementaresCalculados = porProduto.map((c) => ({
            complemento_descricao: c.complemento_descricao,
            quantidade_necessaria: Math.round(quantidade * c.qtd_por_unidade * 100) / 100,
            unidade: c.unidade_calculo || 'un',
            preco_referencia: c.preco_referencia || 0,
            valor_estimado:
              Math.round(quantidade * c.qtd_por_unidade * (c.preco_referencia || 0) * 100) / 100,
            obrigatoriedade: c.obrigatoriedade,
            selecionado: c.obrigatoriedade === 'OBRIGATORIO',
          }));

          setComplementares(complementaresCalculados);
          return complementaresCalculados;
        }

        // não encontrou complementares
        setComplementares([]);
        return [];
      } catch (err) {
        console.error('Erro na busca direta de complementares:', err);
        return [];
      }
    },
    []
  );

  // ============================================================
  // LIMPAR
  // ============================================================
  const limpar = useCallback(() => {
    setComplementares([]);
    setError(null);
  }, []);

  // ============================================================
  // TOGGLE SELEÇÍO
  // ============================================================
  const toggleSelecao = useCallback((index: number) => {
    setComplementares((prev) =>
      prev.map((c, i) =>
        i === index
          ? {
              ...c,
              selecionado: c.obrigatoriedade === 'OBRIGATORIO' ? true : !c.selecionado,
            }
          : c
      )
    );
  }, []);

  // ============================================================
  // SELECIONAR TODOS OBRIGATÓRIOS
  // ============================================================
  const selecionarObrigatorios = useCallback(() => {
    setComplementares((prev) =>
      prev.map((c) => ({
        ...c,
        selecionado: c.obrigatoriedade === 'OBRIGATORIO',
      }))
    );
  }, []);

  // ============================================================
  // HELPERS
  // ============================================================
  const getComplementaresSelecionados = useCallback((): ComplementarCalculado[] => {
    return complementares.filter((c) => c.selecionado);
  }, [complementares]);

  const getTotalSelecionados = useCallback((): number => {
    return complementares
      .filter((c) => c.selecionado)
      .reduce((sum, c) => sum + (c.valor_estimado || 0), 0);
  }, [complementares]);

  return {
    complementares,
    loading,
    error,
    calcular,
    calcularPorCategoria,
    limpar,
    toggleSelecao,
    selecionarObrigatorios,
    getComplementaresSelecionados,
    getTotalSelecionados,
  };
}

export default useComplementares;


