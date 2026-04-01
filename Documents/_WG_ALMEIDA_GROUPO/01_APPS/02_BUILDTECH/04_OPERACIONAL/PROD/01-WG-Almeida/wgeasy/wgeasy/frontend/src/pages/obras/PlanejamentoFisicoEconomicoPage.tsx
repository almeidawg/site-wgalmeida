/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PLANEJAMENTO FÍSICO-ECONÔMICO
// Baseado em análise do Obra Prima
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Calendar, DollarSign, BarChart3, Download,
  ChevronLeft, ChevronRight, RefreshCw, Building2, Filter,
  AlertTriangle, CheckCircle, Target, Eye, Settings
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';
import { useParams } from 'react-router-dom';
import {
  LineChart, Line, AreaChart, Area, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ReferenceLine
} from 'recharts';

// Tipos
interface DadosMensais {
  mes: string;
  mesLabel: string;
  previstoMensal: number;
  realizadoMensal: number;
  previstoAcumulado: number;
  realizadoAcumulado: number;
  desvio: number;
  desvioPercentual: number;
}

interface EtapaPlanejamento {
  id: string;
  nome: string;
  valorPrevisto: number;
  valorRealizado: number;
  percentualPrevisto: number;
  percentualRealizado: number;
  status: 'no_prazo' | 'atrasado' | 'adiantado' | 'concluido';
}

interface ResumoGeral {
  valorTotalPrevisto: number;
  valorTotalRealizado: number;
  percentualFisicoPrevisto: number;
  percentualFisicoRealizado: number;
  desvioTotal: number;
  desvioPercentual: number;
  tendencia: 'positiva' | 'negativa' | 'estavel';
}

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatarPercentual = (valor: number) => `${valor.toFixed(1)}%`;

export default function PlanejamentoFisicoEconomicoPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();
  const { obraId } = useParams();

  const [loading, setLoading] = useState(true);
  const [obra, setObra] = useState<{ id: string; nome: string; valor_contrato?: number } | null>(null);
  const [dadosMensais, setDadosMensais] = useState<DadosMensais[]>([]);
  const [etapas, setEtapas] = useState<EtapaPlanejamento[]>([]);
  const [resumo, setResumo] = useState<ResumoGeral>({
    valorTotalPrevisto: 0,
    valorTotalRealizado: 0,
    percentualFisicoPrevisto: 0,
    percentualFisicoRealizado: 0,
    desvioTotal: 0,
    desvioPercentual: 0,
    tendencia: 'estavel',
  });
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [visualizacao, setVisualizacao] = useState<'curvaS' | 'barras' | 'tabela'>('curvaS');

  // Carregar dados
  useEffect(() => {
    if (obraId && usuario?.empresa_id) {
      carregarDados();
    }
  }, [obraId, usuario?.empresa_id, anoSelecionado]);

  const carregarDados = async () => {
    if (!obraId || !usuario?.empresa_id) return;
    setLoading(true);

    try {
      // Carregar obra
      const { data: obraData } = await supabase
        .from('obras')
        .select('id, nome, valor_contrato')
        .eq('id', obraId)
        .single();

      if (obraData) setObra(obraData);

      const valorContrato = parseFloat(obraData?.valor_contrato) || 500000;

      // Carregar cronograma/tarefas
      const { data: tarefas } = await supabase
        .from('cronograma_tarefas')
        .select('*')
        .eq('projeto_id', obraId)
        .order('data_inicio');

      // Carregar lançamentos financeiros da obra
      const { data: lancamentos } = await supabase
        .from('financeiro_lancamentos')
        .select('*')
        .eq('obra_id', obraId)
        .gte('data_vencimento', `${anoSelecionado}-01-01`)
        .lte('data_vencimento', `${anoSelecionado}-12-31`);

      // Processar dados mensais
      const meses: DadosMensais[] = [];
      let previstoAcumulado = 0;
      let realizadoAcumulado = 0;

      // Distribuir valor do contrato ao longo dos meses (simulaçÍo)
      const valorMensalPrevisto = valorContrato / 12;

      for (let m = 0; m < 12; m++) {
        const mesStr = `${anoSelecionado}-${String(m + 1).padStart(2, '0')}`;
        const mesLabel = new Date(anoSelecionado, m, 1).toLocaleDateString('pt-BR', { month: 'short' });

        // Calcular realizado do mês
        const lancamentosMes = lancamentos?.filter(l => {
          const dataLanc = l.data_pagamento || l.data_vencimento;
          return dataLanc?.startsWith(mesStr) && (l.status === 'pago' || l.status === 'recebido');
        }) || [];

        const realizadoMensal = lancamentosMes.reduce((acc, l) =>
          acc + (l.tipo === 'despesa' || l.tipo === 'saida' ? parseFloat(l.valor) || 0 : 0), 0);

        // Curva S típica (distribuiçÍo nÍo linear)
        const fatorCurvaS = calcularFatorCurvaS(m, 12);
        const previstoMensal = valorContrato * fatorCurvaS;

        previstoAcumulado += previstoMensal;
        realizadoAcumulado += realizadoMensal;

        const desvio = realizadoAcumulado - previstoAcumulado;
        const desvioPercentual = previstoAcumulado > 0 ? (desvio / previstoAcumulado) * 100 : 0;

        meses.push({
          mes: mesStr,
          mesLabel,
          previstoMensal,
          realizadoMensal,
          previstoAcumulado,
          realizadoAcumulado,
          desvio,
          desvioPercentual,
        });
      }

      setDadosMensais(meses);

      // Processar etapas
      const etapasProcessadas: EtapaPlanejamento[] = [];
      const gruposPorEtapa: Record<string, { previsto: number; realizado: number }> = {};

      tarefas?.forEach(tarefa => {
        const etapa = tarefa.etapa || tarefa.nome || 'Geral';
        if (!gruposPorEtapa[etapa]) {
          gruposPorEtapa[etapa] = { previsto: 0, realizado: 0 };
        }
        gruposPorEtapa[etapa].previsto += parseFloat(tarefa.custo_previsto) || 0;
        gruposPorEtapa[etapa].realizado += parseFloat(tarefa.custo_realizado) || 0;
      });

      const totalPrevistoEtapas = Object.values(gruposPorEtapa).reduce((a, b) => a + b.previsto, 0) || valorContrato;

      Object.entries(gruposPorEtapa).forEach(([nome, valores]) => {
        const percentPrevisto = (valores.previsto / totalPrevistoEtapas) * 100;
        const percentRealizado = valores.previsto > 0 ? (valores.realizado / valores.previsto) * 100 : 0;

        let status: EtapaPlanejamento['status'] = 'no_prazo';
        if (percentRealizado >= 100) status = 'concluido';
        else if (percentRealizado < percentPrevisto - 10) status = 'atrasado';
        else if (percentRealizado > percentPrevisto + 10) status = 'adiantado';

        etapasProcessadas.push({
          id: nome,
          nome,
          valorPrevisto: valores.previsto,
          valorRealizado: valores.realizado,
          percentualPrevisto: percentPrevisto,
          percentualRealizado: percentRealizado,
          status,
        });
      });

      setEtapas(etapasProcessadas);

      // Calcular resumo
      const ultimoMes = meses[meses.length - 1] || { previstoAcumulado: 0, realizadoAcumulado: 0 };
      const desvioTotal = ultimoMes.realizadoAcumulado - ultimoMes.previstoAcumulado;

      setResumo({
        valorTotalPrevisto: valorContrato,
        valorTotalRealizado: ultimoMes.realizadoAcumulado,
        percentualFisicoPrevisto: (ultimoMes.previstoAcumulado / valorContrato) * 100,
        percentualFisicoRealizado: (ultimoMes.realizadoAcumulado / valorContrato) * 100,
        desvioTotal,
        desvioPercentual: valorContrato > 0 ? (desvioTotal / valorContrato) * 100 : 0,
        tendencia: desvioTotal > 0 ? 'negativa' : desvioTotal < -valorContrato * 0.05 ? 'positiva' : 'estavel',
      });

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar planejamento', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Calcular fator da curva S (distribuiçÍo beta simplificada)
  const calcularFatorCurvaS = (mes: number, totalMeses: number): number => {
    const t = (mes + 1) / totalMeses;
    // Curva S usando funçÍo logística simplificada
    const curvaS = 1 / (1 + Math.exp(-10 * (t - 0.5)));
    const curvaAnterior = mes === 0 ? 0 : 1 / (1 + Math.exp(-10 * ((mes / totalMeses) - 0.5)));
    return curvaS - curvaAnterior;
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dados = dadosMensais.find(d => d.mesLabel === label);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border text-sm">
          <p className="font-normal text-gray-800 mb-2">{label} {anoSelecionado}</p>
          <div className="space-y-1">
            <p className="text-blue-600">
              Previsto: {formatarMoeda(dados?.previstoAcumulado || 0)}
            </p>
            <p className="text-green-600">
              Realizado: {formatarMoeda(dados?.realizadoAcumulado || 0)}
            </p>
            <p className={`font-medium ${(dados?.desvio || 0) >= 0 ? 'text-red-600' : 'text-green-600'}`}>
              Desvio: {formatarMoeda(dados?.desvio || 0)} ({formatarPercentual(dados?.desvioPercentual || 0)})
            </p>
          </div>
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
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
            <TrendingUp className="text-blue-600" />
            Planejamento Fisico-Economico
          </h1>
          <p className="text-[16px] text-gray-500 mt-1">
            {obra?.nome || 'Carregando...'} • Curva S e Análise de Desvios
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* NavegaçÍo de Ano */}
          <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2">
            <button onClick={() => setAnoSelecionado(a => a - 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={18} />
            </button>
            <span className="font-medium text-gray-700 min-w-[60px] text-center">
              {anoSelecionado}
            </span>
            <button onClick={() => setAnoSelecionado(a => a + 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Tipo de VisualizaçÍo */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {[
              { key: 'curvaS', label: 'Curva S' },
              { key: 'barras', label: 'Barras' },
              { key: 'tabela', label: 'Tabela' },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setVisualizacao(key as any)}
                className={`px-3 py-1 text-lg rounded ${
                  visualizacao === key
                    ? 'bg-white shadow text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200">
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-[16px] text-gray-500">Valor Previsto</p>
          <p className="text-2xl font-normal text-blue-600 mt-1">
            {formatarMoeda(resumo.valorTotalPrevisto)}
          </p>
          <p className="text-sm text-gray-400 mt-1">Contrato total</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-[16px] text-gray-500">Valor Realizado</p>
          <p className="text-2xl font-normal text-green-600 mt-1">
            {formatarMoeda(resumo.valorTotalRealizado)}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {formatarPercentual(resumo.percentualFisicoRealizado)} do total
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-[16px] text-gray-500">Desvio</p>
          <p className={`text-2xl font-normal mt-1 ${
            resumo.desvioTotal > 0 ? 'text-red-600' : 'text-green-600'
          }`}>
            {formatarMoeda(Math.abs(resumo.desvioTotal))}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            {resumo.desvioTotal > 0 ? 'Acima do previsto' : 'Abaixo do previsto'}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-[16px] text-gray-500">Tendencia</p>
          <div className="flex items-center gap-2 mt-1">
            {resumo.tendencia === 'positiva' && (
              <>
                <CheckCircle size={24} className="text-green-600" />
                <span className="text-lg font-normal text-green-600">Positiva</span>
              </>
            )}
            {resumo.tendencia === 'negativa' && (
              <>
                <AlertTriangle size={24} className="text-red-600" />
                <span className="text-lg font-normal text-red-600">Negativa</span>
              </>
            )}
            {resumo.tendencia === 'estavel' && (
              <>
                <Target size={24} className="text-blue-600" />
                <span className="text-lg font-normal text-blue-600">Estável</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gráfico Principal */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-[20px] font-normal text-gray-800 mb-4">
          {visualizacao === 'curvaS' && 'Curva S - Previsto x Realizado'}
          {visualizacao === 'barras' && 'Evolucao Mensal'}
          {visualizacao === 'tabela' && 'Detalhamento Mensal'}
        </h3>

        {visualizacao === 'curvaS' && (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dadosMensais}>
              <defs>
                <linearGradient id="gradientPrevisto" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="gradientRealizado" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
              <YAxis
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Area
                type="monotone"
                dataKey="previstoAcumulado"
                name="Previsto"
                stroke="#3b82f6"
                fill="url(#gradientPrevisto)"
                strokeWidth={2}
                strokeDasharray="5 5"
              />
              <Line
                type="monotone"
                dataKey="realizadoAcumulado"
                name="Realizado"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {visualizacao === 'barras' && (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={dadosMensais}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="previstoMensal"
                name="Previsto Mensal"
                fill="#3b82f620"
                stroke="#3b82f6"
              />
              <Line
                type="monotone"
                dataKey="realizadoMensal"
                name="Realizado Mensal"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981' }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}

        {visualizacao === 'tabela' && (
          <div className="overflow-x-auto">
            <table className="w-full text-lg">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-medium text-gray-600 text-sm">Mes</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">Previsto Mes</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">Realizado Mes</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">Previsto Acum.</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">Realizado Acum.</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">Desvio</th>
                  <th className="text-right p-3 font-medium text-gray-600 text-sm">%</th>
                </tr>
              </thead>
              <tbody>
                {dadosMensais.map((mes, i) => (
                  <tr key={i} className="border-t hover:bg-gray-50">
                    <td className="p-3 font-medium">{mes.mesLabel}</td>
                    <td className="p-3 text-right text-blue-600">{formatarMoeda(mes.previstoMensal)}</td>
                    <td className="p-3 text-right text-green-600">{formatarMoeda(mes.realizadoMensal)}</td>
                    <td className="p-3 text-right">{formatarMoeda(mes.previstoAcumulado)}</td>
                    <td className="p-3 text-right">{formatarMoeda(mes.realizadoAcumulado)}</td>
                    <td className={`p-3 text-right font-medium ${mes.desvio > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatarMoeda(mes.desvio)}
                    </td>
                    <td className={`p-3 text-right ${mes.desvioPercentual > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatarPercentual(mes.desvioPercentual)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Etapas */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <h3 className="text-[20px] font-normal text-gray-800 mb-4">Medicao por Etapa</h3>
        <div className="space-y-4">
          {etapas.length === 0 ? (
            <p className="text-center text-[16px] text-gray-500 py-8">
              Nenhuma etapa cadastrada no cronograma
            </p>
          ) : (
            etapas.map(etapa => (
              <div key={etapa.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      etapa.status === 'concluido' ? 'bg-green-500' :
                      etapa.status === 'atrasado' ? 'bg-red-500' :
                      etapa.status === 'adiantado' ? 'bg-blue-500' :
                      'bg-gray-400'
                    }`} />
                    <span className="text-lg font-medium text-gray-800">{etapa.nome}</span>
                  </div>
                  <span className={`text-sm px-2 py-1 rounded ${
                    etapa.status === 'concluido' ? 'bg-green-100 text-green-700' :
                    etapa.status === 'atrasado' ? 'bg-red-100 text-red-700' :
                    etapa.status === 'adiantado' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {etapa.status === 'concluido' ? 'Concluido' :
                     etapa.status === 'atrasado' ? 'Atrasado' :
                     etapa.status === 'adiantado' ? 'Adiantado' : 'No Prazo'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-[16px] text-gray-500 mb-2">
                  <span>Previsto: {formatarMoeda(etapa.valorPrevisto)}</span>
                  <span>Realizado: {formatarMoeda(etapa.valorRealizado)}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      etapa.percentualRealizado > 100 ? 'bg-red-500' :
                      etapa.percentualRealizado > 80 ? 'bg-green-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(etapa.percentualRealizado, 100)}%` }}
                  />
                </div>
                <p className="text-sm text-right text-gray-400 mt-1">
                  {formatarPercentual(etapa.percentualRealizado)} executado
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

