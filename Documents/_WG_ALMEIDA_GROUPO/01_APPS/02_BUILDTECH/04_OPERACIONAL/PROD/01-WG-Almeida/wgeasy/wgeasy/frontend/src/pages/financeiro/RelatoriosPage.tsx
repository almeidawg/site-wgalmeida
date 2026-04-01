/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { formatarData, formatarMoeda } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  FileText,
  Download,
  Filter,
  Calendar,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  RefreshCw,
  FileSpreadsheet,
  Printer,
  Eye,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DateInputBR } from '@/components/ui/DateInputBR';
import { supabaseRaw as supabase } from "@/lib/supabaseClient";

interface ResumoFinanceiro {
  totalEntradas: number;
  totalSaidas: number;
  saldo: number;
  countEntradas: number;
  countSaidas: number;
}

interface LancamentoAgrupado {
  categoria: string;
  tipo: string;
  total: number;
  count: number;
}

const RelatoriosPage = () => {
  const { toast } = useToast();
  const [tipoRelatorio, setTipoRelatorio] = useState('fluxo-caixa');
  const [dataInicio, setDataInicio] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [dataFim, setDataFim] = useState(() => new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);
  const [dadosRelatorio, setDadosRelatorio] = useState<any>(null);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [lancamentosPorCategoria, setLancamentosPorCategoria] = useState<LancamentoAgrupado[]>([]);

  const relatoriosDisponiveis = [
    { id: 'fluxo-caixa', nome: 'Fluxo de Caixa', descricao: 'Entradas e saídas de recursos', icon: TrendingUp },
    { id: 'dre', nome: 'DRE Simplificado', descricao: 'DemonstraçÍo do Resultado', icon: BarChart3 },
    { id: 'categorias', nome: 'Por Categoria', descricao: 'Despesas agrupadas por categoria', icon: PieChart },
    { id: 'nucleos', nome: 'Por Núcleo', descricao: 'Resultado por unidade de negócio', icon: DollarSign },
  ];

  // Carregar dados do relatório
  const carregarRelatorio = async () => {
    if (!dataInicio || !dataFim) {
      toast({ variant: 'destructive', title: 'Selecione o período' });
      return;
    }

    setLoading(true);
    try {
      // Buscar lançamentos do período (range de até 50000 para evitar limite padrÍo de 1000)
      const { data: lancamentos, error } = await supabase
        .from('financeiro_lancamentos')
        .select(`
          *,
          categoria:fin_categories(name, kind),
          pessoa:pessoas!financeiro_lancamentos_pessoa_id_fkey(nome)
        `)
        .gte('data_competencia', dataInicio)
        .lte('data_competencia', dataFim)
        .order('data_competencia', { ascending: true })
        .range(0, 49999);

      if (error) throw error;

      // Calcular resumo
      const entradas = lancamentos?.filter(l => l.tipo === 'entrada') || [];
      const saidas = lancamentos?.filter(l => l.tipo === 'saida') || [];

      const totalEntradas = entradas.reduce((acc, l) => acc + (l.valor_total || 0), 0);
      const totalSaidas = saidas.reduce((acc, l) => acc + (l.valor_total || 0), 0);

      setResumo({
        totalEntradas,
        totalSaidas,
        saldo: totalEntradas - totalSaidas,
        countEntradas: entradas.length,
        countSaidas: saidas.length,
      });

      // Agrupar por categoria
      const porCategoria: Record<string, LancamentoAgrupado> = {};
      lancamentos?.forEach(l => {
        const cat = l.categoria?.name || 'Sem Categoria';
        const key = `${cat}-${l.tipo}`;
        if (!porCategoria[key]) {
          porCategoria[key] = { categoria: cat, tipo: l.tipo, total: 0, count: 0 };
        }
        porCategoria[key].total += l.valor_total || 0;
        porCategoria[key].count += 1;
      });

      setLancamentosPorCategoria(Object.values(porCategoria).sort((a, b) => b.total - a.total));
      setDadosRelatorio(lancamentos);

      toast({ title: 'Relatório gerado', description: `${lancamentos?.length || 0} lançamentos encontrados` });
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
    } finally {
      setLoading(false);
    }
  };

  // Exportar para CSV
  const exportarCSV = () => {
    if (!dadosRelatorio || dadosRelatorio.length === 0) {
      toast({ variant: 'destructive', title: 'Nenhum dado para exportar' });
      return;
    }

    const headers = ['Data', 'DescriçÍo', 'Tipo', 'Categoria', 'Núcleo', 'Valor', 'Status'];
    const rows = dadosRelatorio.map((l: any) => [
      formatarData(l.data_competencia),
      l.descricao,
      l.tipo === 'entrada' ? 'Entrada' : 'Saída',
      l.categoria?.name || '-',
      l.nucleo || '-',
      l.valor_total?.toFixed(2) || '0.00',
      l.status || '-',
    ]);

    const csvContent = [headers.join(';'), ...rows.map((r: string[]) => r.join(';'))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-financeiro-${dataInicio}-${dataFim}.csv`;
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: 'Exportado!', description: 'Arquivo CSV baixado com sucesso' });
  };

  // Imprimir relatório
  const imprimirRelatorio = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-[#16a34a] to-[#15803d] rounded-xl flex items-center justify-center shadow-lg">
            <FileText className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Relatórios Financeiros</h1>
            <p className="text-[12px] text-gray-600">Análises e exportações do módulo financeiro</p>
          </div>
        </div>
      </div>

      {/* CONFIGURACAO DO RELATORIO */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
          <div>
            <label className="block text-[12px] font-normal text-gray-500 mb-1">Tipo</label>
            <Select value={tipoRelatorio} onValueChange={setTipoRelatorio}>
              <SelectTrigger className="h-10 text-[13px] border-gray-200">
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {relatoriosDisponiveis.map(rel => (
                  <SelectItem key={rel.id} value={rel.id} className="text-[13px]">{rel.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-[12px] font-normal text-gray-500 mb-1">Data Início</label>
            <DateInputBR
              value={dataInicio}
              onChange={setDataInicio}
              className="h-10 text-[13px] flex w-full rounded-lg border border-gray-200 bg-white px-3 py-2 focus:ring-2 focus:ring-[#16a34a]/20"
              placeholder="dd/mm/aaaa"
            />
          </div>

          <div>
            <label className="block text-[12px] font-normal text-gray-500 mb-1">Data Fim</label>
            <DateInputBR
              value={dataFim}
              onChange={setDataFim}
              className="h-9 text-[14px] flex w-full rounded-md border border-input bg-background px-3 py-2"
              placeholder="dd/mm/aaaa"
            />
          </div>

          <Button
            onClick={carregarRelatorio}
            disabled={loading}
            className="bg-wg-primary hover:bg-wg-primary/90 h-9 text-[14px]"
          >
            {loading ? <RefreshCw className="w-4 h-4 mr-1 animate-spin" /> : <Eye className="w-4 h-4 mr-1" />}
            Gerar
          </Button>

          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={exportarCSV} disabled={!dadosRelatorio} className="h-9 text-[14px] flex-1">
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
              CSV
            </Button>
            <Button variant="outline" size="sm" onClick={imprimirRelatorio} disabled={!dadosRelatorio} className="h-9 text-[14px] flex-1">
              <Printer className="w-3.5 h-3.5 mr-1" />
              Imprimir
            </Button>
          </div>
        </div>
      </div>

      {/* Cards de Resumo */}
      {resumo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 print:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-green-50 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Entradas</p>
                <p className="text-[18px] font-light text-green-600">
                  {formatarMoeda(resumo.totalEntradas)}
                </p>
                <p className="text-[12px] text-gray-400">{resumo.countEntradas} lançamentos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-lg shadow-sm p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-red-50 rounded-lg">
                <TrendingDown className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Saídas</p>
                <p className="text-[18px] font-light text-red-600">
                  {formatarMoeda(resumo.totalSaidas)}
                </p>
                <p className="text-[12px] text-gray-400">{resumo.countSaidas} lançamentos</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-lg shadow-sm p-3"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg ${resumo.saldo >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                <DollarSign className={`w-4 h-4 ${resumo.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Saldo</p>
                <p className={`text-[18px] font-light ${resumo.saldo >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                  {formatarMoeda(resumo.saldo)}
                </p>
                <p className="text-[12px] text-gray-400">Período selecionado</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-lg shadow-sm p-3"
          >
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-50 rounded-lg">
                <PieChart className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-[12px] text-gray-500 uppercase">Categorias</p>
                <p className="text-[18px] font-light text-purple-600">{lancamentosPorCategoria.length}</p>
                <p className="text-[12px] text-gray-400">Categorias distintas</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Tabela por Categoria */}
      {lancamentosPorCategoria.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h3 className="text-[20px] font-light text-gray-800">Resumo por Categoria</h3>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-4 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider">Qtd</th>
                <th className="px-4 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lancamentosPorCategoria.map((item, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50">
                  <td className="px-4 py-2 text-gray-800 text-[12px]">{item.categoria}</td>
                  <td className="px-4 py-2 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-normal ${
                      item.tipo === 'entrada' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                      {item.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-center text-gray-600 text-[12px]">{item.count}</td>
                  <td className={`px-4 py-2 text-right font-light text-[12px] ${
                    item.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatarMoeda(item.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Lista de Lançamentos */}
      {dadosRelatorio && dadosRelatorio.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-[20px] font-light text-gray-800">Lançamentos Detalhados</h3>
            <span className="text-[12px] text-gray-400">{dadosRelatorio.length} registros</span>
          </div>
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-[12px]">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">DescriçÍo</th>
                  <th className="px-3 py-2 text-left text-[13px] font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-3 py-2 text-center text-[13px] font-medium text-gray-500 uppercase tracking-wider">Núcleo</th>
                  <th className="px-3 py-2 text-right text-[13px] font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {dadosRelatorio.map((l: any) => (
                  <tr key={l.id} className="hover:bg-gray-50/50">
                    <td className="px-3 py-2 text-gray-600 text-[12px]">
                      {formatarData(l.data_competencia)}
                    </td>
                    <td className="px-3 py-2 text-gray-800 text-[12px] max-w-[200px] truncate" title={l.descricao}>
                      {l.descricao}
                    </td>
                    <td className="px-3 py-2 text-gray-600 text-[12px]">{l.categoria?.name || '-'}</td>
                    <td className="px-3 py-2 text-center text-gray-500 text-[12px]">{l.nucleo || '-'}</td>
                    <td className={`px-3 py-2 text-right font-light text-[12px] ${
                      l.tipo === 'entrada' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {l.tipo === 'entrada' ? '+' : '-'}{formatarMoeda(l.valor_total || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado Vazio */}
      {!dadosRelatorio && (
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="text-center">
            <Calendar className="mx-auto mb-3 text-gray-300 w-12 h-12" />
            <p className="text-gray-600 text-[12px]">Selecione o período e clique em "Gerar" para visualizar o relatório</p>
          </div>
        </div>
      )}

      {/* Tipos de Relatórios Disponíveis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {relatoriosDisponiveis.map((relatorio, index) => {
          const Icon = relatorio.icon;
          const isSelected = tipoRelatorio === relatorio.id;
          return (
            <motion.button
              key={relatorio.id}
              type="button"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => setTipoRelatorio(relatorio.id)}
              className={`p-3 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-wg-primary text-white shadow-md'
                  : 'bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <div className="flex items-start gap-2">
                <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white/20' : 'bg-gray-100'}`}>
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-normal text-[14px] ${isSelected ? 'text-white' : 'text-gray-800'}`}>
                    {relatorio.nome}
                  </h3>
                  <p className={`text-[12px] mt-0.5 ${isSelected ? 'text-white/80' : 'text-gray-500'}`}>
                    {relatorio.descricao}
                  </p>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Estilos de ImpressÍo */}
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:grid-cols-4, .print\\:grid-cols-4 * { visibility: visible; }
          .bg-white { box-shadow: none !important; }
          button { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default RelatoriosPage;

