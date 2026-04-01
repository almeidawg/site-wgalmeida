// Lista de Serviços em formato tabela
import { Eye, MapPin, Calendar, DollarSign } from 'lucide-react';
import type { SolicitacaoServico } from '../types';
import { STATUS_SERVICO_CONFIG } from '../types';

interface ServicosListProps {
  servicos: SolicitacaoServico[];
  loading: boolean;
  onVerDetalhe: (servico: SolicitacaoServico) => void;
}

export function ServicosList({ servicos, loading, onVerDetalhe }: ServicosListProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]"></div>
        </div>
      </div>
    );
  }

  if (servicos.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">Nenhuma solicitaçÍo encontrada</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Número
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Título / Categoria
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Endereços
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Prestador
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {servicos.map((servico) => {
              const statusConfig = STATUS_SERVICO_CONFIG[servico.status];

              return (
                <tr
                  key={servico.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => onVerDetalhe(servico)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {servico.numero}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900 line-clamp-1">
                        {servico.titulo}
                      </p>
                      <p className="text-xs text-gray-500">
                        {servico.categoria?.nome || '-'}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-gray-600 space-y-1">
                      {servico.coletar_cidade && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span>De: {servico.coletar_cidade}</span>
                        </div>
                      )}
                      {servico.entregar_cidade && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-green-500" />
                          <span>Para: {servico.entregar_cidade}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar className="w-3 h-3" />
                      {formatDate(servico.data_necessidade)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-sm font-medium text-gray-900">
                      <DollarSign className="w-3 h-3 text-green-600" />
                      {formatCurrency(servico.valor_servico)}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: statusConfig.corBg,
                        color: statusConfig.cor,
                      }}
                    >
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-sm text-gray-600">
                      {servico.prestador?.nome || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onVerDetalhe(servico);
                      }}
                      className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      title="Ver detalhes"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

