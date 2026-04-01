import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowRightLeft,
  Check,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLancamentosPessoais } from '../hooks';
import type { TipoLancamento, StatusLancamento } from '../types';
import { NovoLancamentoModal } from './NovoLancamentoModal';

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date: string): string {
  return new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');
}

const statusColors: Record<StatusLancamento, string> = {
  pendente: 'bg-yellow-100 text-yellow-700',
  efetivado: 'bg-green-100 text-green-700',
  agendado: 'bg-blue-100 text-blue-700',
  vencido: 'bg-red-100 text-red-700',
  cancelado: 'bg-gray-100 text-gray-500',
};

const tipoIcons: Record<TipoLancamento, typeof ArrowUpCircle> = {
  receita: ArrowUpCircle,
  despesa: ArrowDownCircle,
  transferencia: ArrowRightLeft,
};

const tipoColors: Record<TipoLancamento, string> = {
  receita: 'text-green-600',
  despesa: 'text-red-600',
  transferencia: 'text-blue-600',
};

export function LancamentosTable() {
  const [busca, setBusca] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<TipoLancamento | ''>('');
  const [modalAberto, setModalAberto] = useState(false);

  const { lancamentos, loading, totalReceitas, totalDespesas, carregar, efetivar, deletar } =
    useLancamentosPessoais();

  const lancamentosFiltrados = lancamentos.filter(l => {
    const matchBusca = !busca || l.descricao.toLowerCase().includes(busca.toLowerCase());
    const matchTipo = !tipoFiltro || l.tipo === tipoFiltro;
    return matchBusca && matchTipo;
  });

  return (
    <div className="space-y-6">
      {/* Header com totais */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-green-50 rounded-xl">
          <p className="text-sm text-green-600">Total Receitas</p>
          <p className="text-2xl font-normal text-green-700">{formatCurrency(totalReceitas)}</p>
        </div>
        <div className="p-4 bg-red-50 rounded-xl">
          <p className="text-sm text-red-600">Total Despesas</p>
          <p className="text-2xl font-normal text-red-700">{formatCurrency(totalDespesas)}</p>
        </div>
        <div className={`p-4 rounded-xl ${totalReceitas - totalDespesas >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className={`text-sm ${totalReceitas - totalDespesas >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            Saldo
          </p>
          <p className={`text-2xl font-normal ${totalReceitas - totalDespesas >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>
            {formatCurrency(totalReceitas - totalDespesas)}
          </p>
        </div>
      </div>

      {/* Filtros e Ações */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-2 flex-1">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar lançamento..."
              value={busca}
              onChange={e => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={tipoFiltro}
            onChange={e => setTipoFiltro(e.target.value as TipoLancamento | '')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
            <option value="transferencia">Transferências</option>
          </select>
        </div>

        <Button onClick={() => setModalAberto(true)} className="bg-primary hover:bg-[#D94D1A]">
          <Plus className="w-4 h-4 mr-2" />
          Novo Lançamento
        </Button>
      </div>

      {/* Tabela */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Carregando...</div>
        ) : lancamentosFiltrados.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Nenhum lançamento encontrado
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    DescriçÍo
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoria
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Data
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lancamentosFiltrados.map((lanc, index) => {
                  const TipoIcon = tipoIcons[lanc.tipo];
                  return (
                    <motion.tr
                      key={lanc.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="hover:bg-gray-50"
                    >
                      <td className="px-4 py-3">
                        <TipoIcon className={`w-5 h-5 ${tipoColors[lanc.tipo]}`} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{lanc.descricao}</p>
                        {lanc.conta && (
                          <p className="text-xs text-gray-400">{lanc.conta.nome}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {lanc.categoria ? (
                          <span
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs"
                            style={{
                              backgroundColor: `${lanc.categoria.cor}20`,
                              color: lanc.categoria.cor,
                            }}
                          >
                            {lanc.categoria.nome}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">
                        {formatDate(lanc.data_lancamento)}
                      </td>
                      <td className={`px-4 py-3 text-right font-medium ${tipoColors[lanc.tipo]}`}>
                        {lanc.tipo === 'despesa' ? '-' : ''}
                        {formatCurrency(lanc.valor)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${statusColors[lanc.status]}`}>
                          {lanc.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {lanc.status === 'pendente' && (
                            <button
                              onClick={() => efetivar(lanc.id)}
                              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                              title="Efetivar"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              if (window.confirm(`Excluir lançamento "${lanc.descricao}"?`)) {
                                deletar(lanc.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      <NovoLancamentoModal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        onSuccess={() => {
          setModalAberto(false);
          carregar();
        }}
      />
    </div>
  );
}

