/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// FLUXO DE CAIXA DETALHADO
// Baseado em análise do Obra Prima
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  DollarSign, TrendingUp, TrendingDown, Calendar, Download,
  ChevronLeft, ChevronRight, RefreshCw, Filter, Building2,
  AlertTriangle, CheckCircle, Plus, Eye, Settings, ArrowRight,
  ArrowUpCircle, ArrowDownCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';
import { formatarMoeda } from '@/lib/utils';
import {
  BarChart, Bar, LineChart, Line, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';

// Tipos
interface FluxoMensal {
  mes: string;
  mesLabel: string;
  saldoAnterior: number;
  entradas: number;
  saidas: number;
  saldoFinal: number;
  entradasPrevistas: number;
  saidasPrevistas: number;
}

interface DetalhePorCategoria {
  categoria: string;
  entradas: number;
  saidas: number;
  saldo: number;
}

interface ProjecaoFluxo {
  mes: string;
  previsto: number;
  realizado: number;
  projetado: number;
}

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function FluxoCaixaDetalhadoPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();

  const [loading, setLoading] = useState(true);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [fluxoMensal, setFluxoMensal] = useState<FluxoMensal[]>([]);
  const [detalhesCategorias, setDetalhesCategorias] = useState<DetalhePorCategoria[]>([]);
  const [visualizacao, setVisualizacao] = useState<'grafico' | 'tabela'>('tabela');
  const [filtroTipo, setFiltroTipo] = useState<'todos' | 'entradas' | 'saidas'>('todos');

  // Resumo
  const [resumo, setResumo] = useState({
    saldoAtual: 0,
    totalEntradas: 0,
    totalSaidas: 0,
    previsaoProximoMes: 0,
  });

  // Carregar dados
  useEffect(() => {
    carregarDados();
  }, [anoSelecionado]);

  const carregarDados = async () => {
    setLoading(true);

    try {
      // Buscar lançamentos do ano
      const { data: lancamentos, error } = await supabase
        .from('financeiro_lancamentos')
        .select('*, fin_categories:categoria_id(name)')
        .gte('vencimento', `${anoSelecionado}-01-01`)
        .lte('vencimento', `${anoSelecionado}-12-31`)
        .order('vencimento');

      if (error) throw error;

      // Buscar saldo inicial (lançamentos anteriores)
      const { data: lancamentosAnteriores } = await supabase
        .from('financeiro_lancamentos')
        .select('tipo, valor_total, status')
        .lt('vencimento', `${anoSelecionado}-01-01`);

      let saldoInicial = 0;
      lancamentosAnteriores?.forEach(l => {
        if (l.status === 'pago' || l.status === 'recebido') {
          const valor = Number(l.valor_total || 0);
          if (l.tipo === 'receita' || l.tipo === 'entrada') {
            saldoInicial += valor;
          } else {
            saldoInicial -= valor;
          }
        }
      });

      // Processar fluxo mensal
      const fluxo: FluxoMensal[] = [];
      const categoriasTotais: Record<string, { entradas: number; saidas: number }> = {};
      let saldoAnterior = saldoInicial;
      let totalEntradasAno = 0;
      let totalSaidasAno = 0;

      for (let m = 0; m < 12; m++) {
        const mesStr = `${anoSelecionado}-${String(m + 1).padStart(2, '0')}`;

        const lancamentosMes = lancamentos?.filter(l =>
          (l.vencimento || l.data_vencimento || '').startsWith(mesStr)
        ) || [];

        let entradas = 0;
        let saidas = 0;
        let entradasPrevistas = 0;
        let saidasPrevistas = 0;

        lancamentosMes.forEach(l => {
          const valor = Number(l.valor_total || l.valor || 0);
          const pago = l.status === 'pago' || l.status === 'recebido';
          const categoria = l.fin_categories?.name || 'Outros';

          if (!categoriasTotais[categoria]) {
            categoriasTotais[categoria] = { entradas: 0, saidas: 0 };
          }

          if (l.tipo === 'receita' || l.tipo === 'entrada') {
            if (pago) {
              entradas += valor;
              categoriasTotais[categoria].entradas += valor;
            }
            entradasPrevistas += valor;
          } else {
            if (pago) {
              saidas += valor;
              categoriasTotais[categoria].saidas += valor;
            }
            saidasPrevistas += valor;
          }
        });

        totalEntradasAno += entradas;
        totalSaidasAno += saidas;

        const saldoFinal = saldoAnterior + entradas - saidas;

        fluxo.push({
          mes: mesStr,
          mesLabel: MESES[m],
          saldoAnterior,
          entradas,
          saidas,
          saldoFinal,
          entradasPrevistas,
          saidasPrevistas,
        });

        saldoAnterior = saldoFinal;
      }

      setFluxoMensal(fluxo);

      // Processar categorias
      const detalhes = Object.entries(categoriasTotais).map(([categoria, valores]) => ({
        categoria,
        entradas: valores.entradas,
        saidas: valores.saidas,
        saldo: valores.entradas - valores.saidas,
      })).sort((a, b) => Math.abs(b.saldo) - Math.abs(a.saldo));

      setDetalhesCategorias(detalhes);

      // Calcular resumo
      const ultimoMes = fluxo[fluxo.length - 1];
      const mesAtualIndex = new Date().getMonth();
      const proximoMes = fluxo[mesAtualIndex + 1] || fluxo[mesAtualIndex];

      setResumo({
        saldoAtual: ultimoMes?.saldoFinal || 0,
        totalEntradas: totalEntradasAno,
        totalSaidas: totalSaidasAno,
        previsaoProximoMes: (proximoMes?.entradasPrevistas || 0) - (proximoMes?.saidasPrevistas || 0),
      });

    } catch (error) {
      console.error('Erro ao carregar fluxo de caixa:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Tooltip customizado
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dados = fluxoMensal.find(f => f.mesLabel === label);
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border text-[12px]">
          <p className="text-gray-800 mb-2">{label} {anoSelecionado}</p>
          <div className="space-y-1">
            <p className="text-gray-500">Saldo Anterior: {formatarMoeda(dados?.saldoAnterior || 0)}</p>
            <p className="text-green-600">Entradas: {formatarMoeda(dados?.entradas || 0)}</p>
            <p className="text-red-600">Saídas: {formatarMoeda(dados?.saidas || 0)}</p>
            <hr className="my-1" />
            <p className="text-blue-600">Saldo Final: {formatarMoeda(dados?.saldoFinal || 0)}</p>
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
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-800 flex items-center gap-2">
            <DollarSign className="text-green-600" />
            Fluxo de Caixa Detalhado
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            ProjeçÍo e acompanhamento financeiro mensal
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* NavegaçÍo de Ano */}
          <div className="flex items-center gap-1 sm:gap-2 bg-white rounded-lg border px-2 sm:px-3 py-1.5 sm:py-2">
            <button onClick={() => setAnoSelecionado(a => a - 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
            <span className="text-gray-700 min-w-[50px] sm:min-w-[60px] text-center text-[12px]">
              {anoSelecionado}
            </span>
            <button onClick={() => setAnoSelecionado(a => a + 1)} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>

          {/* Tipo de VisualizaçÍo */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setVisualizacao('tabela')}
              className={`px-2 sm:px-3 py-1 text-[12px] rounded ${
                visualizacao === 'tabela' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              Tabela
            </button>
            <button
              onClick={() => setVisualizacao('grafico')}
              className={`px-2 sm:px-3 py-1 text-[12px] rounded ${
                visualizacao === 'grafico' ? 'bg-white shadow text-blue-600' : 'text-gray-500'
              }`}
            >
              Gráfico
            </button>
          </div>

          <button
            onClick={carregarDados}
            className="p-1.5 sm:p-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
          >
            <RefreshCw size={16} className="sm:w-[18px] sm:h-[18px]" />
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">Saldo Atual</p>
            <DollarSign size={18} className={`sm:w-5 sm:h-5 ${resumo.saldoAtual >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </div>
          <p className={`text-[18px] font-light mt-1 ${resumo.saldoAtual >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatarMoeda(resumo.saldoAtual)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">Total Entradas</p>
            <ArrowUpCircle size={18} className="sm:w-5 sm:h-5 text-green-500" />
          </div>
          <p className="text-[18px] font-light text-green-600 mt-1">
            {formatarMoeda(resumo.totalEntradas)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500">Total Saídas</p>
            <ArrowDownCircle size={18} className="sm:w-5 sm:h-5 text-red-500" />
          </div>
          <p className="text-[18px] font-light text-red-600 mt-1">
            {formatarMoeda(resumo.totalSaidas)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <p className="text-[12px] text-gray-500 truncate">PrevisÍo Próx.</p>
            <TrendingUp size={18} className="sm:w-5 sm:h-5 text-blue-500" />
          </div>
          <p className={`text-[18px] font-light mt-1 ${resumo.previsaoProximoMes >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatarMoeda(resumo.previsaoProximoMes)}
          </p>
        </div>
      </div>

      {/* VisualizaçÍo Principal */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {visualizacao === 'grafico' ? (
          <div className="p-4">
            <h3 className="text-[20px] font-light text-gray-800 mb-4">EvoluçÍo do Fluxo de Caixa</h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={fluxoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mesLabel" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="entradas" name="Entradas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saidas" name="Saídas" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Line
                  type="monotone"
                  dataKey="saldoFinal"
                  name="Saldo"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left p-4 text-[13px] font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50">DescriçÍo</th>
                  {MESES.map(mes => (
                    <th key={mes} className="text-right p-4 text-[13px] font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      {mes}
                    </th>
                  ))}
                  <th className="text-right p-4 text-[13px] font-medium text-gray-500 uppercase tracking-wider min-w-[120px] bg-blue-50">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Saldo Anterior */}
                <tr className="border-b bg-gray-50">
                  <td className="p-4 text-gray-600 sticky left-0 bg-gray-50">Saldo Anterior</td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className={`p-4 text-right ${mes.saldoAnterior >= 0 ? 'text-gray-700' : 'text-red-600'}`}>
                      {formatarMoeda(mes.saldoAnterior)}
                    </td>
                  ))}
                  <td className="p-4 text-right bg-blue-50">-</td>
                </tr>

                {/* Entradas */}
                <tr className="border-b hover:bg-green-50/50">
                  <td className="p-4 text-green-700 sticky left-0 bg-white flex items-center gap-2">
                    <ArrowUpCircle size={16} /> Entradas
                  </td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className="p-4 text-right text-green-600">
                      {formatarMoeda(mes.entradas)}
                    </td>
                  ))}
                  <td className="p-4 text-right text-green-700 bg-blue-50">
                    {formatarMoeda(resumo.totalEntradas)}
                  </td>
                </tr>

                {/* Saídas */}
                <tr className="border-b hover:bg-red-50/50">
                  <td className="p-4 text-red-700 sticky left-0 bg-white flex items-center gap-2">
                    <ArrowDownCircle size={16} /> Saídas
                  </td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className="p-4 text-right text-red-600">
                      {formatarMoeda(mes.saidas)}
                    </td>
                  ))}
                  <td className="p-4 text-right text-red-700 bg-blue-50">
                    {formatarMoeda(resumo.totalSaidas)}
                  </td>
                </tr>

                {/* Saldo Final */}
                <tr className="bg-blue-50 font-normal">
                  <td className="p-4 text-blue-800 sticky left-0 bg-blue-50">Saldo Final</td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className={`p-4 text-right ${mes.saldoFinal >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      {formatarMoeda(mes.saldoFinal)}
                    </td>
                  ))}
                  <td className={`p-4 text-right ${resumo.saldoAtual >= 0 ? 'text-blue-800' : 'text-red-700'}`}>
                    {formatarMoeda(resumo.saldoAtual)}
                  </td>
                </tr>

                {/* Previsto */}
                <tr className="border-t-2 border-dashed">
                  <td colSpan={14} className="p-2 text-xs text-gray-400 uppercase tracking-wider">
                    Valores Previstos (nÍo realizados)
                  </td>
                </tr>
                <tr className="border-b text-gray-400">
                  <td className="p-4 sticky left-0 bg-white">Entradas Previstas</td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className="p-4 text-right">
                      {formatarMoeda(mes.entradasPrevistas)}
                    </td>
                  ))}
                  <td className="p-4 text-right bg-blue-50">
                    {formatarMoeda(fluxoMensal.reduce((a, b) => a + b.entradasPrevistas, 0))}
                  </td>
                </tr>
                <tr className="text-gray-400">
                  <td className="p-4 sticky left-0 bg-white">Saídas Previstas</td>
                  {fluxoMensal.map((mes, i) => (
                    <td key={i} className="p-4 text-right">
                      {formatarMoeda(mes.saidasPrevistas)}
                    </td>
                  ))}
                  <td className="p-4 text-right bg-blue-50">
                    {formatarMoeda(fluxoMensal.reduce((a, b) => a + b.saidasPrevistas, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detalhes por Categoria */}
      <div className="bg-white rounded-xl shadow-sm border p-3 sm:p-4">
        <h3 className="font-normal text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">Resumo por Categoria</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {detalhesCategorias.slice(0, 9).map((cat, i) => (
            <div key={i} className="border rounded-lg p-3">
              <p className="font-medium text-gray-800 mb-2">{cat.categoria}</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-green-600">+{formatarMoeda(cat.entradas)}</span>
                <span className="text-red-600">-{formatarMoeda(cat.saidas)}</span>
              </div>
              <div className={`text-right font-medium mt-1 ${cat.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                = {formatarMoeda(cat.saldo)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

