/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ==========================================
// HOOK: useFinanceiroMarcenaria
// Gerenciamento financeiro de projetos de marcenaria
// ==========================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/use-toast';

// ==========================================
// TIPOS
// ==========================================

export interface CustoMarcenaria {
  id: string;
  projeto_id: string;
  tipo: 'material' | 'mao_obra' | 'transporte' | 'montagem' | 'acabamento' | 'outros';
  descricao: string;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor_previsto: number;
  valor_realizado: number;
  data_previsao?: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'parcial' | 'cancelado';
  nota_fiscal?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

export interface ResumoFinanceiroProjeto {
  projeto_id: string;
  projeto_nome: string;
  cliente_nome: string;
  valor_contrato: number;
  custo_total_previsto: number;
  custo_total_realizado: number;
  margem_prevista: number;
  margem_realizada: number;
  percentual_margem_prevista: number;
  percentual_margem_realizada: number;
  valor_pago: number;
  valor_pendente: number;
  status: 'em_andamento' | 'finalizado' | 'cancelado';
}

export interface PagamentoFornecedor {
  id: string;
  fornecedor_id: string;
  fornecedor_nome: string;
  projeto_id: string;
  projeto_nome: string;
  pedido_id?: string;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  forma_pagamento?: string;
  comprovante_url?: string;
}

export interface FaturamentoMarcenaria {
  id: string;
  projeto_id: string;
  projeto_nome: string;
  cliente_id: string;
  cliente_nome: string;
  parcela: number;
  total_parcelas: number;
  valor: number;
  data_vencimento: string;
  data_pagamento?: string;
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado';
  nota_fiscal?: string;
  boleto_url?: string;
}

export interface FinanceiroStats {
  total_projetos: number;
  valor_total_contratos: number;
  custo_total_previsto: number;
  custo_total_realizado: number;
  margem_total_prevista: number;
  margem_total_realizada: number;
  percentual_margem_media: number;
  valor_a_receber: number;
  valor_a_pagar: number;
  valor_atrasado_receber: number;
  valor_atrasado_pagar: number;
}

// ==========================================
// HOOK PRINCIPAL
// ==========================================

export function useFinanceiroMarcenaria(projetoId?: string) {
  const [custos, setCustos] = useState<CustoMarcenaria[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroProjeto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Buscar custos do projeto
  const fetchCustos = useCallback(async () => {
    if (!projetoId) return;

    try {
      setLoading(true);

      // SimulaçÍo - substituir por query real quando tabelas existirem
      const mockCustos: CustoMarcenaria[] = [
        {
          id: '1',
          projeto_id: projetoId,
          tipo: 'material',
          descricao: 'MDF 18mm Branco',
          fornecedor_nome: 'Duratex',
          valor_previsto: 5000,
          valor_realizado: 4800,
          status: 'pago',
          data_pagamento: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          projeto_id: projetoId,
          tipo: 'mao_obra',
          descricao: 'Marceneiro - ProduçÍo',
          valor_previsto: 3000,
          valor_realizado: 0,
          status: 'pendente',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      setCustos(mockCustos);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar custos:', err);
      setError('Erro ao carregar custos do projeto');
    } finally {
      setLoading(false);
    }
  }, [projetoId]);

  useEffect(() => {
    fetchCustos();
  }, [fetchCustos]);

  // Adicionar custo
  const adicionarCusto = async (custo: Omit<CustoMarcenaria, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // SimulaçÍo - implementar insert real
      const novoCusto: CustoMarcenaria = {
        ...custo,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      setCustos(prev => [...prev, novoCusto]);

      toast({
        title: 'Custo adicionado',
        description: 'O custo foi registrado com sucesso'
      });

      return novoCusto;
    } catch (err) {
      console.error('Erro ao adicionar custo:', err);
      toast({
        title: 'Erro',
        description: 'não foi possível adicionar o custo',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // Atualizar custo
  const atualizarCusto = async (id: string, dados: Partial<CustoMarcenaria>) => {
    try {
      setCustos(prev => prev.map(c =>
        c.id === id
          ? { ...c, ...dados, updated_at: new Date().toISOString() }
          : c
      ));

      toast({
        title: 'Custo atualizado',
        description: 'Os dados foram atualizados com sucesso'
      });
    } catch (err) {
      console.error('Erro ao atualizar custo:', err);
      toast({
        title: 'Erro',
        description: 'não foi possível atualizar o custo',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // Registrar pagamento
  const registrarPagamento = async (custoId: string, dataPagamento: string, valorPago: number) => {
    try {
      setCustos(prev => prev.map(c =>
        c.id === custoId
          ? {
              ...c,
              valor_realizado: valorPago,
              data_pagamento: dataPagamento,
              status: 'pago' as const,
              updated_at: new Date().toISOString()
            }
          : c
      ));

      toast({
        title: 'Pagamento registrado',
        description: 'O pagamento foi registrado com sucesso'
      });
    } catch (err) {
      console.error('Erro ao registrar pagamento:', err);
      toast({
        title: 'Erro',
        description: 'não foi possível registrar o pagamento',
        variant: 'destructive'
      });
      throw err;
    }
  };

  // Calcular totais
  const totais = {
    previsto: custos.reduce((acc, c) => acc + c.valor_previsto, 0),
    realizado: custos.reduce((acc, c) => acc + c.valor_realizado, 0),
    pendente: custos.filter(c => c.status === 'pendente').reduce((acc, c) => acc + c.valor_previsto, 0),
    pago: custos.filter(c => c.status === 'pago').reduce((acc, c) => acc + c.valor_realizado, 0)
  };

  return {
    custos,
    resumo,
    totais,
    loading,
    error,
    adicionarCusto,
    atualizarCusto,
    registrarPagamento,
    refetch: fetchCustos
  };
}

// ==========================================
// HOOK: useFinanceiroStats
// Estatísticas gerais do financeiro de marcenaria
// ==========================================

export function useFinanceiroStats() {
  const [stats, setStats] = useState<FinanceiroStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // SimulaçÍo - implementar query real
        const mockStats: FinanceiroStats = {
          total_projetos: 12,
          valor_total_contratos: 450000,
          custo_total_previsto: 315000,
          custo_total_realizado: 298000,
          margem_total_prevista: 135000,
          margem_total_realizada: 152000,
          percentual_margem_media: 32.5,
          valor_a_receber: 125000,
          valor_a_pagar: 45000,
          valor_atrasado_receber: 15000,
          valor_atrasado_pagar: 8000
        };

        setStats(mockStats);
      } catch (err) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return { stats, loading };
}

// ==========================================
// HOOK: usePagamentosFornecedores
// Pagamentos pendentes a fornecedores
// ==========================================

export function usePagamentosFornecedores() {
  const [pagamentos, setPagamentos] = useState<PagamentoFornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchPagamentos = async () => {
      try {
        // SimulaçÍo
        const mockPagamentos: PagamentoFornecedor[] = [
          {
            id: '1',
            fornecedor_id: 'f1',
            fornecedor_nome: 'Duratex',
            projeto_id: 'p1',
            projeto_nome: 'Cozinha Planejada - Silva',
            valor: 12500,
            data_vencimento: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pendente'
          },
          {
            id: '2',
            fornecedor_id: 'f2',
            fornecedor_nome: 'Hettich',
            projeto_id: 'p2',
            projeto_nome: 'Closet Master - Oliveira',
            valor: 8900,
            data_vencimento: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'atrasado'
          }
        ];

        setPagamentos(mockPagamentos);
      } catch (err) {
        console.error('Erro ao buscar pagamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPagamentos();
  }, []);

  const registrarPagamento = async (pagamentoId: string, comprovante?: string) => {
    try {
      setPagamentos(prev => prev.map(p =>
        p.id === pagamentoId
          ? { ...p, status: 'pago' as const, data_pagamento: new Date().toISOString(), comprovante_url: comprovante }
          : p
      ));

      toast({
        title: 'Pagamento registrado',
        description: 'O pagamento ao fornecedor foi registrado'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'não foi possível registrar o pagamento',
        variant: 'destructive'
      });
    }
  };

  return { pagamentos, loading, registrarPagamento };
}

// ==========================================
// HOOK: useFaturamento
// Faturamento e cobranças de clientes
// ==========================================

export function useFaturamento() {
  const [faturamentos, setFaturamentos] = useState<FaturamentoMarcenaria[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchFaturamentos = async () => {
      try {
        // SimulaçÍo
        const mockFaturamentos: FaturamentoMarcenaria[] = [
          {
            id: '1',
            projeto_id: 'p1',
            projeto_nome: 'Cozinha Planejada - Silva',
            cliente_id: 'c1',
            cliente_nome: 'JoÍo Silva',
            parcela: 2,
            total_parcelas: 4,
            valor: 15000,
            data_vencimento: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pendente'
          },
          {
            id: '2',
            projeto_id: 'p2',
            projeto_nome: 'Closet Master - Oliveira',
            cliente_id: 'c2',
            cliente_nome: 'Maria Oliveira',
            parcela: 1,
            total_parcelas: 3,
            valor: 22000,
            data_vencimento: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'atrasado'
          }
        ];

        setFaturamentos(mockFaturamentos);
      } catch (err) {
        console.error('Erro ao buscar faturamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFaturamentos();
  }, []);

  const registrarRecebimento = async (faturamentoId: string, notaFiscal?: string) => {
    try {
      setFaturamentos(prev => prev.map(f =>
        f.id === faturamentoId
          ? { ...f, status: 'pago' as const, data_pagamento: new Date().toISOString(), nota_fiscal: notaFiscal }
          : f
      ));

      toast({
        title: 'Recebimento registrado',
        description: 'O pagamento do cliente foi registrado'
      });
    } catch (err) {
      toast({
        title: 'Erro',
        description: 'não foi possível registrar o recebimento',
        variant: 'destructive'
      });
    }
  };

  const gerarBoleto = async (faturamentoId: string) => {
    toast({
      title: 'Boleto gerado',
      description: 'O boleto foi gerado e enviado ao cliente'
    });
  };

  return { faturamentos, loading, registrarRecebimento, gerarBoleto };
}

// ==========================================
// HOOK: useResumoFinanceiroProjetos
// Resumo financeiro de todos os projetos
// ==========================================

export function useResumoFinanceiroProjetos() {
  const [resumos, setResumos] = useState<ResumoFinanceiroProjeto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResumos = async () => {
      try {
        // SimulaçÍo
        const mockResumos: ResumoFinanceiroProjeto[] = [
          {
            projeto_id: 'p1',
            projeto_nome: 'Cozinha Planejada - Silva',
            cliente_nome: 'JoÍo Silva',
            valor_contrato: 60000,
            custo_total_previsto: 42000,
            custo_total_realizado: 38500,
            margem_prevista: 18000,
            margem_realizada: 21500,
            percentual_margem_prevista: 30,
            percentual_margem_realizada: 35.83,
            valor_pago: 30000,
            valor_pendente: 30000,
            status: 'em_andamento'
          },
          {
            projeto_id: 'p2',
            projeto_nome: 'Closet Master - Oliveira',
            cliente_nome: 'Maria Oliveira',
            valor_contrato: 45000,
            custo_total_previsto: 31500,
            custo_total_realizado: 29800,
            margem_prevista: 13500,
            margem_realizada: 15200,
            percentual_margem_prevista: 30,
            percentual_margem_realizada: 33.78,
            valor_pago: 22000,
            valor_pendente: 23000,
            status: 'em_andamento'
          }
        ];

        setResumos(mockResumos);
      } catch (err) {
        console.error('Erro ao buscar resumos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchResumos();
  }, []);

  return { resumos, loading };
}


