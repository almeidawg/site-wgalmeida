/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// DASHBOARD DE COMPRAS
// Baseado em análise do Obra Prima
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from 'react';
import {
  ShoppingCart, Package, FileText, ClipboardCheck, Truck,
  TrendingUp, DollarSign, BarChart3, Clock, CheckCircle,
  AlertTriangle, RefreshCw, Filter, Calendar, Building2,
  ArrowRight, Eye, Plus
} from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useUsuarioLogado } from '../../hooks/useUsuarioLogado';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart
} from 'recharts';

// Tipos
interface ResumoCompras {
  totalSolicitacoes: number;
  totalCotacoes: number;
  totalOrdensCompra: number;
  valorTotalCompras: number;
  valorOrcado: number;
  valorRealizado: number;
  economiaGerada: number;
}

interface GastoCategoria {
  categoria: string;
  orcado: number;
  realizado: number;
}

interface EvolucaoMensal {
  mes: string;
  orcado: number;
  realizado: number;
  acumuladoOrcado: number;
  acumuladoRealizado: number;
}

interface SolicitacaoPendente {
  id: string;
  descricao: string;
  quantidade: number;
  unidade: string;
  status: string;
  data_criacao: string;
  solicitante?: string;
  obra_nome?: string;
}

// Cores
const CORES = {
  orcado: '#3b82f6',
  realizado: '#10b981',
  materiais: '#f59e0b',
  maoObra: '#8b5cf6',
  equipamentos: '#ec4899',
  fretes: '#06b6d4',
};

const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function DashboardComprasPage() {
  const { showToast } = useToast();
  const { usuario } = useUsuarioLogado();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [obraSelecionada, setObraSelecionada] = useState<string>('todas');
  const [obras, setObras] = useState<{ id: string; nome: string }[]>([]);

  // Estados de dados
  const [resumo, setResumo] = useState<ResumoCompras>({
    totalSolicitacoes: 0,
    totalCotacoes: 0,
    totalOrdensCompra: 0,
    valorTotalCompras: 0,
    valorOrcado: 0,
    valorRealizado: 0,
    economiaGerada: 0,
  });
  const [gastosPorCategoria, setGastosPorCategoria] = useState<GastoCategoria[]>([]);
  const [evolucaoMensal, setEvolucaoMensal] = useState<EvolucaoMensal[]>([]);
  const [solicitacoesPendentes, setSolicitacoesPendentes] = useState<SolicitacaoPendente[]>([]);

  // Carregar obras
  useEffect(() => {
    if (usuario?.empresa_id) {
      carregarObras();
    }
  }, [usuario?.empresa_id]);

  // Carregar dados
  useEffect(() => {
    if (usuario?.empresa_id) {
      carregarDados();
    }
  }, [usuario?.empresa_id, obraSelecionada]);

  const carregarObras = async () => {
    const { data } = await supabase
      .from('obras')
      .select('id, nome')
      .eq('empresa_id', usuario!.empresa_id)
      .eq('status', 'em_andamento')
      .order('nome');

    if (data) setObras(data);
  };

  const carregarDados = async () => {
    if (!usuario?.empresa_id) return;
    setLoading(true);

    try {
      // Construir query base
      let queryPedidos = supabase
        .from('pedidos_materiais')
        .select('*, obras(nome)')
        .eq('empresa_id', usuario.empresa_id);

      if (obraSelecionada !== 'todas') {
        queryPedidos = queryPedidos.eq('obra_id', obraSelecionada);
      }

      const { data: pedidos, error } = await queryPedidos;
      if (error) throw error;

      // Processar resumo
      let totalSolicitacoes = 0;
      let totalCotacoes = 0;
      let totalOrdensCompra = 0;
      let valorTotalCompras = 0;

      const solicitacoesTemp: SolicitacaoPendente[] = [];

      pedidos?.forEach(pedido => {
        const valor = parseFloat(pedido.valor_total) || 0;
        valorTotalCompras += valor;

        switch (pedido.status) {
          case 'solicitado':
          case 'pendente':
            totalSolicitacoes++;
            solicitacoesTemp.push({
              id: pedido.id,
              descricao: pedido.descricao || 'Pedido de material',
              quantidade: pedido.quantidade || 1,
              unidade: pedido.unidade || 'un',
              status: pedido.status,
              data_criacao: pedido.created_at,
              obra_nome: pedido.obras?.nome,
            });
            break;
          case 'cotando':
          case 'em_cotacao':
            totalCotacoes++;
            break;
          case 'aprovado':
          case 'comprado':
          case 'entregue':
            totalOrdensCompra++;
            break;
        }
      });

      // Simular dados de orçado vs realizado (baseado em orçamentos)
      const valorOrcado = valorTotalCompras * 1.15; // Simulando orçado 15% maior
      const economiaGerada = valorOrcado - valorTotalCompras;

      // Gastos por categoria (simulado baseado nos pedidos)
      const categorias: Record<string, { orcado: number; realizado: number }> = {
        'Materiais': { orcado: 0, realizado: 0 },
        'MÍo de Obra': { orcado: 0, realizado: 0 },
        'Equipamentos': { orcado: 0, realizado: 0 },
        'Fretes': { orcado: 0, realizado: 0 },
      };

      pedidos?.forEach(pedido => {
        const valor = parseFloat(pedido.valor_total) || 0;
        const cat = pedido.categoria || 'Materiais';
        if (categorias[cat]) {
          categorias[cat].realizado += valor;
          categorias[cat].orcado += valor * 1.1;
        } else {
          categorias['Materiais'].realizado += valor;
          categorias['Materiais'].orcado += valor * 1.1;
        }
      });

      const gastosProcessados = Object.entries(categorias).map(([categoria, valores]) => ({
        categoria,
        orcado: valores.orcado,
        realizado: valores.realizado,
      }));

      // EvoluçÍo mensal (últimos 6 meses)
      const evolucao: EvolucaoMensal[] = [];
      const hoje = new Date();
      let acumuladoOrcado = 0;
      let acumuladoRealizado = 0;

      for (let i = 5; i >= 0; i--) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
        const mes = data.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });

        // Filtrar pedidos do mês
        const pedidosMes = pedidos?.filter(p => {
          const pedidoData = new Date(p.created_at);
          return pedidoData.getMonth() === data.getMonth() &&
                 pedidoData.getFullYear() === data.getFullYear();
        }) || [];

        const realizadoMes = pedidosMes.reduce((acc, p) => acc + (parseFloat(p.valor_total) || 0), 0);
        const orcadoMes = realizadoMes * 1.12;

        acumuladoOrcado += orcadoMes;
        acumuladoRealizado += realizadoMes;

        evolucao.push({
          mes,
          orcado: orcadoMes,
          realizado: realizadoMes,
          acumuladoOrcado,
          acumuladoRealizado,
        });
      }

      // Atualizar estados
      setResumo({
        totalSolicitacoes,
        totalCotacoes,
        totalOrdensCompra,
        valorTotalCompras,
        valorOrcado,
        valorRealizado: valorTotalCompras,
        economiaGerada,
      });
      setGastosPorCategoria(gastosProcessados);
      setEvolucaoMensal(evolucao);
      setSolicitacoesPendentes(solicitacoesTemp.slice(0, 5));

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      showToast('Erro ao carregar dados de compras', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Card de contagem circular
  const CardContagem = ({
    titulo, valor, total, cor, icone: Icone, onClick
  }: {
    titulo: string;
    valor: number;
    total: number;
    cor: string;
    icone: React.ElementType;
    onClick?: () => void;
  }) => {
    const percentual = total > 0 ? (valor / total) * 100 : 0;
    const circunferencia = 2 * Math.PI * 35;
    const offset = circunferencia - (percentual / 100) * circunferencia;

    return (
      <div
        className={`bg-white rounded-xl shadow-sm border p-4 hover:shadow-md transition ${onClick ? 'cursor-pointer' : ''}`}
        onClick={onClick}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="6"
              />
              <circle
                cx="40"
                cy="40"
                r="35"
                fill="none"
                stroke={cor}
                strokeWidth="6"
                strokeDasharray={circunferencia}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-lg font-normal text-gray-800">{valor}</span>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{titulo}</p>
            <p className="text-xs text-gray-400 mt-1">
              {percentual.toFixed(0)}% do total
            </p>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw size={32} className="animate-spin text-blue-600" />
      </div>
    );
  }

  const totalPedidos = resumo.totalSolicitacoes + resumo.totalCotacoes + resumo.totalOrdensCompra;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-800 flex items-center gap-2">
            <ShoppingCart className="text-blue-600" />
            Dashboard de Compras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhamento de solicitações, cotações e ordens de compra
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Filtro de Obra */}
          <select
            value={obraSelecionada}
            onChange={(e) => setObraSelecionada(e.target.value)}
            className="px-3 py-2 border rounded-lg bg-white text-sm min-w-[200px]"
          >
            <option value="todas">Todas as obras</option>
            {obras.map(obra => (
              <option key={obra.id} value={obra.id}>{obra.nome}</option>
            ))}
          </select>

          <button
            onClick={() => navigate('/compras/novo')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition"
          >
            <Plus size={18} />
            Nova SolicitaçÍo
          </button>
        </div>
      </div>

      {/* Cards de Contagem */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardContagem
          titulo="Solicitações"
          valor={resumo.totalSolicitacoes}
          total={totalPedidos}
          cor="#f59e0b"
          icone={FileText}
          onClick={() => navigate('/compras?status=solicitado')}
        />
        <CardContagem
          titulo="Cotações"
          valor={resumo.totalCotacoes}
          total={totalPedidos}
          cor="#8b5cf6"
          icone={ClipboardCheck}
          onClick={() => navigate('/compras?status=cotando')}
        />
        <CardContagem
          titulo="Ordens de Compra"
          valor={resumo.totalOrdensCompra}
          total={totalPedidos}
          cor="#10b981"
          icone={Truck}
          onClick={() => navigate('/compras?status=aprovado')}
        />
      </div>

      {/* Resumo de Valores */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white">
        <h3 className="text-lg font-normal mb-4">Resumo de Compras</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-green-100 text-sm">Orçado</p>
            <p className="text-2xl font-normal">{formatarMoeda(resumo.valorOrcado)}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Realizado</p>
            <p className="text-2xl font-normal">{formatarMoeda(resumo.valorRealizado)}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">Economia</p>
            <p className="text-2xl font-normal text-yellow-300">{formatarMoeda(resumo.economiaGerada)}</p>
          </div>
          <div>
            <p className="text-green-100 text-sm">% Economia</p>
            <p className="text-2xl font-normal">
              {resumo.valorOrcado > 0 ? ((resumo.economiaGerada / resumo.valorOrcado) * 100).toFixed(1) : 0}%
            </p>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gastos por Categoria */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-normal text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-600" />
            Orçado x Realizado por Categoria
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={gastosPorCategoria} barGap={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="categoria" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Legend />
              <Bar dataKey="orcado" name="Orçado" fill={CORES.orcado} radius={[4, 4, 0, 0]} />
              <Bar dataKey="realizado" name="Realizado" fill={CORES.realizado} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* EvoluçÍo Acumulada */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-normal text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-green-600" />
            EvoluçÍo Acumulada
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={evolucaoMensal}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(value: number) => formatarMoeda(value)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="acumuladoOrcado"
                name="Orçado Acumulado"
                fill="#3b82f620"
                stroke="#3b82f6"
                strokeWidth={2}
              />
              <Line
                type="monotone"
                dataKey="acumuladoRealizado"
                name="Realizado Acumulado"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* MediçÍo Acumulada e Solicitações Pendentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ApropriaçÍo por Categoria */}
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <h3 className="font-normal text-gray-800 mb-4">Resumo da ApropriaçÍo</h3>
          <div className="space-y-4">
            {gastosPorCategoria.map((cat, index) => {
              const percentual = cat.orcado > 0 ? (cat.realizado / cat.orcado) * 100 : 0;
              return (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">{cat.categoria}</span>
                    <span className="text-sm font-medium">
                      {formatarMoeda(cat.realizado)} / {formatarMoeda(cat.orcado)}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        percentual > 100 ? 'bg-red-500' :
                        percentual > 80 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentual, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-right text-gray-400 mt-1">
                    {percentual.toFixed(1)}% utilizado
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Solicitações Pendentes */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-4">
            <h3 className="font-normal text-white flex items-center gap-2">
              <Clock size={20} />
              Solicitações Pendentes
              <span className="ml-auto bg-white/20 px-2 py-0.5 rounded text-sm">
                {solicitacoesPendentes.length}
              </span>
            </h3>
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {solicitacoesPendentes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <CheckCircle size={40} className="mx-auto text-green-400 mb-2" />
                <p>Nenhuma solicitaçÍo pendente</p>
              </div>
            ) : (
              solicitacoesPendentes.map(sol => (
                <div key={sol.id} className="p-3 hover:bg-gray-50 flex items-center gap-3">
                  <Package size={20} className="text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{sol.descricao}</p>
                    <p className="text-xs text-gray-500">
                      {sol.obra_nome || 'Sem obra'} • {sol.quantidade} {sol.unidade}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/compras/editar/${sol.id}`)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Eye size={16} />
                  </button>
                </div>
              ))
            )}
          </div>
          {solicitacoesPendentes.length > 0 && (
            <div className="p-3 border-t">
              <button
                onClick={() => navigate('/compras?status=pendente')}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
              >
                Ver todas <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

