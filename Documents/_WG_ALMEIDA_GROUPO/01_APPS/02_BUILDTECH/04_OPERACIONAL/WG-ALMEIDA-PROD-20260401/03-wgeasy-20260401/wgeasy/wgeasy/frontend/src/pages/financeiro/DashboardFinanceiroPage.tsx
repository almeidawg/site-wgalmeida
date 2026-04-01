/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// DASHBOARD FINANCEIRO AVANÇADO
// Baseado em análise do Obra Prima
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Building2,
  ArrowUpRight, ArrowDownRight, Wallet, CreditCard, Receipt,
  AlertTriangle, CheckCircle, Clock, Filter, Download,
  ChevronLeft, ChevronRight, RefreshCw, Eye, BarChart3
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';
import { formatarMoeda, formatarData } from '@/lib/utils';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// Tipos
interface ResumoFinanceiro {
  saldoAtual: number;
  totalRecebido: number;
  totalPago: number;
  aReceber: number;
  aPagar: number;
  contasVencidas: number;
  receitaMes: number;
  despesaMes: number;
}

interface FluxoCaixaDia {
  data: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface ContaPendente {
  id: string;
  descricao: string;
  valor: number;
  vencimento: string;
  tipo: 'pagar' | 'receber';
  status: 'pendente' | 'vencido' | 'hoje';
  categoria?: string;
  pessoa_nome?: string;
}

interface DespesaCategoria {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
}

// Cores para gráficos
const CORES_CATEGORIAS = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

// FunçÍo auxiliar para formataçÍo curta de data em gráficos
const formatarDataCurta = (data: string) =>
  new Date(data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export default function DashboardFinanceiroPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState<'7d' | '30d' | '90d' | '12m'>('30d');
  const [mesAtual, setMesAtual] = useState(() => {
    const hoje = new Date();
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
  });

  // Estados de dados
  const [resumo, setResumo] = useState<ResumoFinanceiro>({
    saldoAtual: 0,
    totalRecebido: 0,
    totalPago: 0,
    aReceber: 0,
    aPagar: 0,
    contasVencidas: 0,
    receitaMes: 0,
    despesaMes: 0,
  });
  const [fluxoCaixa, setFluxoCaixa] = useState<FluxoCaixaDia[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPendente[]>([]);
  const [contasReceber, setContasReceber] = useState<ContaPendente[]>([]);
  const [despesasPorCategoria, setDespesasPorCategoria] = useState<DespesaCategoria[]>([]);

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, [periodo, mesAtual]);

  const carregarDados = async () => {
    setLoading(true);

    try {
      const hoje = new Date();
      const inicioMes = `${mesAtual}-01`;
      const fimMes = new Date(parseInt(mesAtual.split('-')[0]), parseInt(mesAtual.split('-')[1]), 0)
        .toISOString().split('T')[0];

      // Calcular data inicial baseado no período
      let dataInicio = new Date();
      switch (periodo) {
        case '7d': dataInicio.setDate(dataInicio.getDate() - 7); break;
        case '30d': dataInicio.setDate(dataInicio.getDate() - 30); break;
        case '90d': dataInicio.setDate(dataInicio.getDate() - 90); break;
        case '12m': dataInicio.setMonth(dataInicio.getMonth() - 12); break;
      }
      const dataInicioStr = dataInicio.toISOString().split('T')[0];

      // Buscar lançamentos
      // NOTA: Tabela financeiro_lancamentos nÍo tem campo empresa_id
      // Usar vencimento ao invés de data_vencimento
      const { data: lancamentos, error } = await supabase
        .from('financeiro_lancamentos')
        .select('*, fin_categories:categoria_id(name)')
        .gte('vencimento', dataInicioStr)
        .not('status', 'in', '(cancelado,Cancelado)')
        .order('vencimento', { ascending: true });

      if (error) throw error;

      // Processar resumo
      let totalRecebido = 0;
      let totalPago = 0;
      let aReceber = 0;
      let aPagar = 0;
      let contasVencidas = 0;
      let receitaMes = 0;
      let despesaMes = 0;

      const hojeStr = hoje.toISOString().split('T')[0];
      const contasPagarTemp: ContaPendente[] = [];
      const contasReceberTemp: ContaPendente[] = [];
      const categoriasTotais: Record<string, number> = {};

      lancamentos?.forEach(lanc => {
        // Usar valor_total que é o campo correto na tabela
        const valor = parseFloat(lanc.valor_total) || parseFloat(lanc.valor) || 0;
        const vencimento = lanc.vencimento || lanc.data_vencimento;
        const pago = lanc.status === 'pago' || lanc.status === 'recebido';
        const categoria = lanc.fin_categories?.name || lanc.categoria || 'Outros';

        // Receitas vs Despesas
        if (lanc.tipo === 'receita' || lanc.tipo === 'entrada') {
          if (pago) totalRecebido += valor;
          else aReceber += valor;

          if (vencimento >= inicioMes && vencimento <= fimMes) {
            if (pago) receitaMes += valor;
          }

          if (!pago) {
            const status = vencimento < hojeStr ? 'vencido' : vencimento === hojeStr ? 'hoje' : 'pendente';
            if (status === 'vencido') contasVencidas++;
            contasReceberTemp.push({
              id: lanc.id,
              descricao: lanc.descricao || 'Receita',
              valor,
              vencimento,
              tipo: 'receber',
              status,
              categoria,
              pessoa_nome: lanc.pessoa_nome,
            });
          }
        } else {
          if (pago) {
            totalPago += valor;
            categoriasTotais[categoria] = (categoriasTotais[categoria] || 0) + valor;
          } else {
            aPagar += valor;
          }

          if (vencimento >= inicioMes && vencimento <= fimMes) {
            if (pago) despesaMes += valor;
          }

          if (!pago) {
            const status = vencimento < hojeStr ? 'vencido' : vencimento === hojeStr ? 'hoje' : 'pendente';
            if (status === 'vencido') contasVencidas++;
            contasPagarTemp.push({
              id: lanc.id,
              descricao: lanc.descricao || 'Despesa',
              valor,
              vencimento,
              tipo: 'pagar',
              status,
              categoria,
              pessoa_nome: lanc.pessoa_nome,
            });
          }
        }
      });

      // Calcular saldo
      const saldoAtual = totalRecebido - totalPago;

      // Processar despesas por categoria
      const totalDespesas = Object.values(categoriasTotais).reduce((a, b) => a + b, 0);
      const categoriasProcessadas = Object.entries(categoriasTotais)
        .map(([categoria, valor], index) => ({
          categoria,
          valor,
          percentual: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0,
          cor: CORES_CATEGORIAS[index % CORES_CATEGORIAS.length],
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);

      // Gerar fluxo de caixa diário
      const fluxoPorDia: Record<string, { entradas: number; saidas: number }> = {};
      lancamentos?.filter(l => l.status === 'pago' || l.status === 'recebido').forEach(lanc => {
        const data = lanc.data_pagamento || lanc.vencimento || lanc.data_vencimento;
        if (!data || !fluxoPorDia) return;
        if (!fluxoPorDia[data]) fluxoPorDia[data] = { entradas: 0, saidas: 0 };
        const valor = parseFloat(lanc.valor_total) || parseFloat(lanc.valor) || 0;
        if (lanc.tipo === 'receita' || lanc.tipo === 'entrada') {
          fluxoPorDia[data].entradas += valor;
        } else {
          fluxoPorDia[data].saidas += valor;
        }
      });

      let saldoAcumulado = 0;
      const fluxoProcessado = Object.entries(fluxoPorDia)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-30)
        .map(([data, valores]) => {
          saldoAcumulado += valores.entradas - valores.saidas;
          return {
            data,
            entradas: valores.entradas,
            saidas: valores.saidas,
            saldo: saldoAcumulado,
          };
        });

      // Atualizar estados
      setResumo({
        saldoAtual,
        totalRecebido,
        totalPago,
        aReceber,
        aPagar,
        contasVencidas,
        receitaMes,
        despesaMes,
      });
      setFluxoCaixa(fluxoProcessado);
      setContasPagar(contasPagarTemp.slice(0, 10));
      setContasReceber(contasReceberTemp.slice(0, 10));
      setDespesasPorCategoria(categoriasProcessadas);

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados financeiros', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Navegar meses
  const navegarMes = (direcao: number) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + direcao, 1);
    setMesAtual(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
  };

  // Card de indicador
  const CardIndicador = ({
    titulo, valor, icone: Icone, cor, variacao, subtitulo
  }: {
    titulo: string;
    valor: number;
    icone: React.ElementType;
    cor: string;
    variacao?: number;
    subtitulo?: string;
  }) => (
    <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${cor.replace('text-', 'bg-').replace('600', '50')}`}>
          <Icone className={`w-4 h-4 ${cor}`} />
        </div>
        <span className={`text-[18px] font-light ${cor}`}>{formatarMoeda(valor)}</span>
        <span className="text-[12px] text-gray-500">{titulo}</span>
      </div>
      {variacao !== undefined && (
        <div className={`flex items-center gap-1 mt-2 text-[12px] ${variacao >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {variacao >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{Math.abs(variacao).toFixed(1)}% vs mês anterior</span>
        </div>
      )}
    </div>
  );

  // Tooltip customizado para gráficos
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border text-[12px]">
          <p className="font-normal text-gray-800 mb-1">{formatarDataCurta(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatarMoeda(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Dashboard Financeiro</h1>
              <p className="text-[12px] text-gray-600">Visao geral das financas da empresa</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* NavegaçÍo de Mês */}
            <div className="flex items-center gap-1 bg-white rounded-lg border border-gray-200 px-2 py-1.5">
              <button onClick={() => navegarMes(-1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-normal text-gray-700 min-w-[100px] text-center text-[13px]">
                {formatarData(mesAtual + '-01', 'longo')}
              </span>
              <button onClick={() => navegarMes(1)} className="p-1 hover:bg-gray-100 rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Período */}
            <select
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as any)}
              className="px-3 py-2 border border-gray-200 rounded-lg bg-white text-[13px] font-normal"
            >
              <option value="7d">Ultimos 7 dias</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="90d">Ultimos 90 dias</option>
              <option value="12m">Ultimos 12 meses</option>
            </select>

            <button
              onClick={carregarDados}
              className="p-2.5 bg-gradient-to-r from-[#16a34a] to-[#15803d] text-white rounded-lg hover:opacity-90 transition-all shadow-lg"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Indicadores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardIndicador
          titulo="Saldo Atual"
          valor={resumo.saldoAtual}
          icone={Wallet}
          cor={resumo.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}
        />
        <CardIndicador
          titulo="A Receber"
          valor={resumo.aReceber}
          icone={TrendingUp}
          cor="text-blue-600"
          subtitulo={`${contasReceber.length} parcelas pendentes`}
        />
        <CardIndicador
          titulo="A Pagar"
          valor={resumo.aPagar}
          icone={TrendingDown}
          cor="text-orange-600"
          subtitulo={`${contasPagar.length} contas pendentes`}
        />
        <CardIndicador
          titulo="Contas Vencidas"
          valor={resumo.contasVencidas}
          icone={AlertTriangle}
          cor="text-red-600"
          subtitulo="Requer atençÍo imediata"
        />
      </div>

      {/* Resultado do Mês */}
      <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] rounded-xl p-4 sm:p-6 text-white">
        <h3 className="text-[18px] font-light mb-3 sm:mb-4">Resultado do Mes</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div>
            <p className="text-green-100 text-[12px]">Receitas</p>
            <p className="text-[18px] font-light">{formatarMoeda(resumo.receitaMes)}</p>
          </div>
          <div>
            <p className="text-green-100 text-[12px]">Despesas</p>
            <p className="text-[18px] font-light">{formatarMoeda(resumo.despesaMes)}</p>
          </div>
          <div>
            <p className="text-green-100 text-[12px]">Resultado</p>
            <p className={`text-[18px] font-light ${resumo.receitaMes - resumo.despesaMes >= 0 ? 'text-white' : 'text-red-200'}`}>
              {formatarMoeda(resumo.receitaMes - resumo.despesaMes)}
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fluxo de Caixa */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-[18px] font-light text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#16a34a]" />
            Fluxo de Caixa Diario
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={fluxoCaixa}>
              <defs>
                <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="data"
                tickFormatter={formatarDataCurta}
                tick={{ fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 11 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="saldo"
                name="Saldo"
                stroke="#3b82f6"
                fill="url(#colorSaldo)"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="entradas"
                name="Entradas"
                stroke="#10b981"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="saidas"
                name="Saídas"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Despesas por Categoria */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="text-[18px] font-light text-gray-800 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-purple-600" />
            Despesas por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={despesasPorCategoria}
                dataKey="valor"
                nameKey="categoria"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                label={({ percentual }) => `${percentual.toFixed(0)}%`}
                labelLine={false}
              >
                {despesasPorCategoria.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.cor} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 max-h-32 overflow-y-auto">
            {despesasPorCategoria.map((cat, i) => (
                <div key={i} className="flex items-center justify-between text-[12px]">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.cor }} />
                    <span className="text-gray-600 truncate max-w-[120px]">{cat.categoria}</span>
                </div>
                  <span className="font-normal text-gray-800">{formatarMoeda(cat.valor)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contas a Pagar e Receber */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contas a Pagar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-red-500 p-4">
            <h3 className="text-[18px] font-light text-white flex items-center gap-2">
              <TrendingDown className="w-5 h-5" />
              Contas a Pagar
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[12px]">
                {formatarMoeda(resumo.aPagar)}
              </span>
            </h3>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {contasPagar.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                <p>Nenhuma conta pendente</p>
              </div>
            ) : (
              contasPagar.map(conta => (
                <div key={conta.id} className="p-3 hover:bg-gray-50 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    conta.status === 'vencido' ? 'bg-red-500' :
                    conta.status === 'hoje' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-normal text-gray-800 truncate">{conta.descricao}</p>
                    <p className="text-[12px] text-gray-500">
                      {conta.categoria} • Venc: {formatarData(conta.vencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-light text-red-600 text-[12px]">{formatarMoeda(conta.valor)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      conta.status === 'vencido' ? 'bg-red-100 text-red-700' :
                      conta.status === 'hoje' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {conta.status === 'vencido' ? 'Vencido' : conta.status === 'hoje' ? 'Hoje' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Contas a Receber */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#16a34a] to-[#15803d] p-4">
            <h3 className="text-[18px] font-light text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Contas a Receber
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-[12px]">
                {formatarMoeda(resumo.aReceber)}
              </span>
            </h3>
          </div>
          <div className="divide-y max-h-80 overflow-y-auto">
            {contasReceber.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Receipt size={40} className="mx-auto text-gray-300 mb-2" />
                <p>Nenhuma receita pendente</p>
              </div>
            ) : (
              contasReceber.map(conta => (
                <div key={conta.id} className="p-3 hover:bg-gray-50 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    conta.status === 'vencido' ? 'bg-red-500' :
                    conta.status === 'hoje' ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-normal text-gray-800 truncate">{conta.descricao}</p>
                    <p className="text-[12px] text-gray-500">
                      {conta.pessoa_nome || conta.categoria} • Venc: {formatarData(conta.vencimento)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-light text-green-600 text-[12px]">{formatarMoeda(conta.valor)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      conta.status === 'vencido' ? 'bg-red-100 text-red-700' :
                      conta.status === 'hoje' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {conta.status === 'vencido' ? 'Vencido' : conta.status === 'hoje' ? 'Hoje' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

