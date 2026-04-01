/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// DASHBOARD CURVA ABC
// WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BarChart3, PieChart as PieChartIcon, TrendingUp, Download, Filter, Search, AlertTriangle, Package, DollarSign } from 'lucide-react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { normalizeSearchTerm } from '@/utils/searchUtils';
import {
  precificacaoService,
  ItemOrcamentoPrecificado,
  CurvaABC,
  formatarMoedaBRL,
} from '../../lib/precificacaoAutomatizada';

// Cores para os gráficos
const CORES_CURVA = {
  A: '#ef4444', // Vermelho
  B: '#eab308', // Amarelo
  C: '#22c55e', // Verde
};

interface ItemOrcamento {
  id: string;
  descricao: string;
  codigo?: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
  preco_total: number;
  categoria?: string;
}

interface OrcamentoSelecionado {
  id: string;
  nome: string;
  cliente_nome?: string;
  valor_total: number;
}

export default function CurvaABCPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [orcamentos, setOrcamentos] = useState<OrcamentoSelecionado[]>([]);
  const [orcamentoSelecionado, setOrcamentoSelecionado] = useState<string>('');
  const [itensOrcamento, setItensOrcamento] = useState<ItemOrcamento[]>([]);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('');
  const [busca, setBusca] = useState('');

  // Carregar orçamentos disponíveis
  useEffect(() => {
    async function carregarOrcamentos() {
      try {
        const { data, error } = await supabase
          .from('orcamentos')
          .select('id, nome, cliente_nome, valor_total')
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;
        setOrcamentos(data || []);
      } catch (error) {
        console.error('Erro ao carregar orçamentos:', error);
      } finally {
        setLoading(false);
      }
    }
    carregarOrcamentos();
  }, []);

  // Carregar itens do orçamento selecionado
  const carregarItensOrcamento = useCallback(async (orcamentoId: string) => {
    if (!orcamentoId) {
      setItensOrcamento([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orcamento_itens')
        .select('*')
        .eq('orcamento_id', orcamentoId)
        .order('preco_total', { ascending: false });

      if (error) throw error;

      const itens = (data || []).map(item => ({
        id: item.id,
        descricao: item.descricao || item.nome,
        codigo: item.codigo,
        unidade: item.unidade || 'UN',
        quantidade: item.quantidade || 0,
        preco_unitario: item.preco_unitario || item.valor_unitario || 0,
        preco_total: item.preco_total || item.valor_total || (item.quantidade * (item.preco_unitario || item.valor_unitario || 0)),
        categoria: item.categoria,
      }));

      setItensOrcamento(itens);
    } catch (error) {
      console.error('Erro ao carregar itens:', error);
      showToast('Erro ao carregar itens do orçamento', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (orcamentoSelecionado) {
      carregarItensOrcamento(orcamentoSelecionado);
    }
  }, [orcamentoSelecionado, carregarItensOrcamento]);

  // Calcular Curva ABC
  const curvaABC = useMemo(() => {
    if (itensOrcamento.length === 0) return null;

    // Filtrar itens
    let itensFiltrados = itensOrcamento;
    if (filtroCategoria) {
      itensFiltrados = itensFiltrados.filter(item => item.categoria === filtroCategoria);
    }
    if (busca) {
      const termoBusca = normalizeSearchTerm(busca);
      itensFiltrados = itensFiltrados.filter(item =>
        normalizeSearchTerm(item.descricao || '').includes(termoBusca) ||
        normalizeSearchTerm(item.codigo || '').includes(termoBusca)
      );
    }

    // Converter para formato esperado
    const itensParaClassificar: ItemOrcamentoPrecificado[] = itensFiltrados.map(item => ({
      id: item.id,
      codigo: item.codigo || '',
      descricao: item.descricao,
      unidade: item.unidade,
      quantidade: item.quantidade,
      precoUnitario: item.preco_unitario,
      precoTotal: item.preco_total,
      fonte: 'catalogo',
      categoria: item.categoria || 'Geral',
    }));

    return precificacaoService.classificarCurvaABC(itensParaClassificar);
  }, [itensOrcamento, filtroCategoria, busca]);

  // Obter categorias únicas
  const categorias = useMemo(() => {
    const cats = new Set(itensOrcamento.map(item => item.categoria).filter(Boolean));
    return Array.from(cats).sort();
  }, [itensOrcamento]);

  // Exportar para Excel
  const exportarExcel = () => {
    if (!curvaABC) return;

    // Criar CSV
    const linhas: string[] = [];
    linhas.push('ClassificaçÍo,Código,DescriçÍo,Unidade,Quantidade,Preço Unitário,Preço Total,% do Total');

    const adicionarItens = (curva: CurvaABC) => {
      curva.itens.forEach(item => {
        linhas.push([
          curva.classificacao,
          item.codigo,
          `"${item.descricao.replace(/"/g, '""')}"`,
          item.unidade,
          item.quantidade,
          item.precoUnitario.toFixed(2),
          item.precoTotal.toFixed(2),
          (item.percentualTotal || 0).toFixed(2),
        ].join(','));
      });
    };

    adicionarItens(curvaABC.curvaA);
    adicionarItens(curvaABC.curvaB);
    adicionarItens(curvaABC.curvaC);

    const csv = linhas.join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `curva-abc-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    showToast('Arquivo exportado com sucesso', 'success');
  };

  // Renderizar card de curva
  const renderCardCurva = (curva: CurvaABC, cor: string, bgCor: string) => {
    const coresGradiente: Record<string, string> = {
      A: 'from-red-500 to-red-600',
      B: 'from-yellow-500 to-yellow-600',
      C: 'from-green-500 to-green-600',
    };

    return (
      <div className={`${bgCor} rounded-xl p-5 border`}>
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${coresGradiente[curva.classificacao]} flex items-center justify-center`}>
            <span className="text-white text-xl font-normal">{curva.classificacao}</span>
          </div>
          <div className="text-right">
            <p className="text-[20px] font-normal text-gray-800">
              {curva.percentualValor.toFixed(1)}%
            </p>
            <p className="text-xs text-gray-500">do valor total</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Valor</span>
            <span className="font-medium">{formatarMoedaBRL(curva.valorTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Itens</span>
            <span className="font-medium">
              {curva.quantidadeItens} ({curva.percentualItens.toFixed(1)}%)
            </span>
          </div>
        </div>

        {/* Barra de progresso */}
        <div className="mt-4 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${coresGradiente[curva.classificacao]}`}
            style={{ width: `${curva.percentualValor}%` }}
          />
        </div>
      </div>
    );
  };

  // Renderizar item da lista
  const renderItemLista = (item: ItemOrcamentoPrecificado, classificacao: string, index: number) => {
    const cores: Record<string, string> = {
      A: 'border-l-red-500 bg-red-50',
      B: 'border-l-yellow-500 bg-yellow-50',
      C: 'border-l-green-500 bg-green-50',
    };

    return (
      <div
        key={item.id}
        className={`p-3 border-l-4 ${cores[classificacao]} rounded-r-lg mb-2 hover:shadow-md transition`}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-gray-500">#{index + 1}</span>
              {item.codigo && (
                <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded">{item.codigo}</span>
              )}
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                classificacao === 'A' ? 'bg-red-200 text-red-700' :
                classificacao === 'B' ? 'bg-yellow-200 text-yellow-700' :
                'bg-green-200 text-green-700'
              }`}>
                {classificacao}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-800 mt-1 line-clamp-1">
              {item.descricao}
            </p>
            <p className="text-xs text-gray-500">
              {item.quantidade} {item.unidade} × {formatarMoedaBRL(item.precoUnitario)}
            </p>
          </div>
          <div className="text-right ml-4">
            <p className="font-normal text-gray-800">{formatarMoedaBRL(item.precoTotal)}</p>
            <p className="text-xs text-gray-500">{(item.percentualTotal || 0).toFixed(2)}%</p>
          </div>
        </div>
      </div>
    );
  };

  if (loading && orcamentos.length === 0) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-blue-600" />
            Análise Curva ABC
          </h1>
          <p className="text-[12px] text-gray-500 mt-1">
            ClassificaçÍo de itens por representatividade no orçamento
          </p>
        </div>
        {curvaABC && (
          <button
            onClick={exportarExcel}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            <Download size={18} />
            <span className="text-[14px]">Exportar</span>
          </button>
        )}
      </div>

      {/* Seletor de Orçamento */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="text-xs text-gray-600 mb-1 block">Selecione o Orçamento</label>
            <select
              value={orcamentoSelecionado}
              onChange={(e) => setOrcamentoSelecionado(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
            >
              <option value="">-- Selecione um orçamento --</option>
              {orcamentos.map(orc => (
                <option key={orc.id} value={orc.id}>
                  {orc.nome} {orc.cliente_nome ? `- ${orc.cliente_nome}` : ''} ({formatarMoedaBRL(orc.valor_total || 0)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600 mb-1 block">Filtrar por Categoria</label>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
              className="w-full p-2 border rounded border-gray-300 focus:border-blue-500 text-[14px]"
              disabled={categorias.length === 0}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Busca */}
        <div className="mt-4">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descriçÍo ou código..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="w-full pl-10 p-2 border rounded border-gray-300 focus:border-blue-500 text-lg"
            />
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      {!orcamentoSelecionado ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <PieChartIcon size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-[16px] font-normal text-gray-600 mb-2">Selecione um Orçamento</h3>
          <p className="text-[12px] text-gray-500">
            Escolha um orçamento acima para visualizar a análise da Curva ABC
          </p>
        </div>
      ) : loading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
          <p className="text-gray-500 mt-4">Carregando itens...</p>
        </div>
      ) : itensOrcamento.length === 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center border border-gray-200">
          <Package size={64} className="mx-auto text-gray-300 mb-4" />
          <h3 className="text-[16px] font-normal text-gray-600 mb-2">Orçamento Vazio</h3>
          <p className="text-[12px] text-gray-500">
            Este orçamento nÍo possui itens para análise
          </p>
        </div>
      ) : curvaABC ? (
        <>
          {/* Cards de Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {renderCardCurva(curvaABC.curvaA, 'red', 'bg-white border-red-200')}
            {renderCardCurva(curvaABC.curvaB, 'yellow', 'bg-white border-yellow-200')}
            {renderCardCurva(curvaABC.curvaC, 'green', 'bg-white border-green-200')}
          </div>

          {/* Resumo Geral */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 mb-6 text-white">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-blue-200 text-sm">Valor Total</p>
                <p className="text-[20px] font-normal">{formatarMoedaBRL(curvaABC.resumo.valorTotal)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Total de Itens</p>
                <p className="text-[20px] font-normal">{curvaABC.resumo.quantidadeTotal}</p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Itens Classe A</p>
                <p className="text-[20px] font-normal">
                  {curvaABC.curvaA.quantidadeItens}
                  <span className="text-sm font-normal text-blue-200 ml-1">
                    ({curvaABC.curvaA.percentualItens.toFixed(0)}%)
                  </span>
                </p>
              </div>
              <div>
                <p className="text-blue-200 text-sm">Valor Classe A</p>
                <p className="text-[20px] font-normal">
                  {curvaABC.curvaA.percentualValor.toFixed(0)}%
                  <span className="text-sm font-normal text-blue-200 ml-1">
                    do total
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Gráficos Interativos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Gráfico de Pizza - DistribuiçÍo por Valor */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-[16px] font-normal text-gray-800 mb-4 flex items-center gap-2">
                <PieChartIcon size={20} className="text-blue-600" />
                DistribuiçÍo por Valor
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Classe A', value: curvaABC.curvaA.valorTotal, percentual: curvaABC.curvaA.percentualValor },
                      { name: 'Classe B', value: curvaABC.curvaB.valorTotal, percentual: curvaABC.curvaB.percentualValor },
                      { name: 'Classe C', value: curvaABC.curvaC.valorTotal, percentual: curvaABC.curvaC.percentualValor },
                    ]}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percentual }) => `${name}: ${percentual.toFixed(1)}%`}
                    labelLine={{ stroke: '#9ca3af', strokeWidth: 1 }}
                  >
                    <Cell fill={CORES_CURVA.A} />
                    <Cell fill={CORES_CURVA.B} />
                    <Cell fill={CORES_CURVA.C} />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => formatarMoedaBRL(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Gráfico de Barras - Comparativo */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-[16px] font-normal text-gray-800 mb-4 flex items-center gap-2">
                <BarChart3 size={20} className="text-blue-600" />
                Comparativo Valor vs Itens
              </h3>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={[
                    {
                      classe: 'Classe A',
                      valor: curvaABC.curvaA.percentualValor,
                      itens: curvaABC.curvaA.percentualItens,
                      fill: CORES_CURVA.A,
                    },
                    {
                      classe: 'Classe B',
                      valor: curvaABC.curvaB.percentualValor,
                      itens: curvaABC.curvaB.percentualItens,
                      fill: CORES_CURVA.B,
                    },
                    {
                      classe: 'Classe C',
                      valor: curvaABC.curvaC.percentualValor,
                      itens: curvaABC.curvaC.percentualItens,
                      fill: CORES_CURVA.C,
                    },
                  ]}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} unit="%" />
                  <YAxis type="category" dataKey="classe" width={80} />
                  <Tooltip
                    formatter={(value: number) => `${value.toFixed(1)}%`}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
                  />
                  <Legend />
                  <Bar dataKey="valor" name="% do Valor" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="itens" name="% dos Itens" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Barra de Progresso Visual */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6 border border-gray-200">
            <h3 className="text-[20px] font-normal text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-blue-600" />
              DistribuiçÍo Acumulada
            </h3>
            <div className="flex h-10 rounded-lg overflow-hidden shadow-inner">
              <div
                className="bg-gradient-to-r from-red-500 to-red-600 flex items-center justify-center text-white text-sm font-medium transition-all hover:brightness-110"
                style={{ width: `${curvaABC.curvaA.percentualValor}%` }}
                title={`Classe A: ${formatarMoedaBRL(curvaABC.curvaA.valorTotal)}`}
              >
                A ({curvaABC.curvaA.percentualValor.toFixed(0)}%)
              </div>
              <div
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 flex items-center justify-center text-white text-sm font-medium transition-all hover:brightness-110"
                style={{ width: `${curvaABC.curvaB.percentualValor}%` }}
                title={`Classe B: ${formatarMoedaBRL(curvaABC.curvaB.valorTotal)}`}
              >
                B ({curvaABC.curvaB.percentualValor.toFixed(0)}%)
              </div>
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center text-white text-sm font-medium transition-all hover:brightness-110"
                style={{ width: `${curvaABC.curvaC.percentualValor}%` }}
                title={`Classe C: ${formatarMoedaBRL(curvaABC.curvaC.valorTotal)}`}
              >
                C ({curvaABC.curvaC.percentualValor.toFixed(0)}%)
              </div>
            </div>
            <div className="flex mt-3 text-xs text-gray-600">
              <div style={{ width: `${curvaABC.curvaA.percentualValor}%` }} className="text-center">
                <span className="font-medium">{curvaABC.curvaA.quantidadeItens}</span> itens
              </div>
              <div style={{ width: `${curvaABC.curvaB.percentualValor}%` }} className="text-center">
                <span className="font-medium">{curvaABC.curvaB.quantidadeItens}</span> itens
              </div>
              <div style={{ width: `${curvaABC.curvaC.percentualValor}%` }} className="text-center">
                <span className="font-medium">{curvaABC.curvaC.quantidadeItens}</span> itens
              </div>
            </div>
          </div>

          {/* Recomendações */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-medium text-amber-800 mb-2">Recomendações de GestÍo</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• <strong>Classe A:</strong> Negociar intensamente com fornecedores, buscar descontos por volume</li>
                  <li>• <strong>Classe B:</strong> Avaliar alternativas de mercado, manter estoque controlado</li>
                  <li>• <strong>Classe C:</strong> Simplificar processo de compra, priorizar disponibilidade</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Lista de Itens por ClassificaçÍo */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Classe A */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-red-500 to-red-600 p-4">
                <h3 className="text-[16px] font-normal text-white flex items-center gap-2">
                  <DollarSign size={20} />
                  Classe A - Críticos
                </h3>
                <p className="text-red-100 text-sm">
                  {curvaABC.curvaA.quantidadeItens} itens = {curvaABC.curvaA.percentualValor.toFixed(1)}% do valor
                </p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {curvaABC.curvaA.itens.map((item, i) => renderItemLista(item, 'A', i))}
              </div>
            </div>

            {/* Classe B */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-500 to-yellow-600 p-4">
                <h3 className="text-[16px] font-normal text-white flex items-center gap-2">
                  <TrendingUp size={20} />
                  Classe B - Intermediários
                </h3>
                <p className="text-yellow-100 text-sm">
                  {curvaABC.curvaB.quantidadeItens} itens = {curvaABC.curvaB.percentualValor.toFixed(1)}% do valor
                </p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {curvaABC.curvaB.itens.map((item, i) => renderItemLista(item, 'B', i))}
              </div>
            </div>

            {/* Classe C */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-green-600 p-4">
                <h3 className="text-[16px] font-normal text-white flex items-center gap-2">
                  <Package size={20} />
                  Classe C - Rotina
                </h3>
                <p className="text-green-100 text-sm">
                  {curvaABC.curvaC.quantidadeItens} itens = {curvaABC.curvaC.percentualValor.toFixed(1)}% do valor
                </p>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                {curvaABC.curvaC.itens.slice(0, 20).map((item, i) => renderItemLista(item, 'C', i))}
                {curvaABC.curvaC.itens.length > 20 && (
                  <div className="text-center text-gray-500 text-sm py-2">
                    + {curvaABC.curvaC.itens.length - 20} itens adicionais
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

