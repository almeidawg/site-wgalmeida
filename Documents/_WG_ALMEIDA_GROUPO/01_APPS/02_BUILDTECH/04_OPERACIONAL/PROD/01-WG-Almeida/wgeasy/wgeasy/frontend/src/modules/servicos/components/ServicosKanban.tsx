// VisualizaçÍo Kanban do Módulo de Serviços
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Calendar, DollarSign, User } from 'lucide-react';
import type { SolicitacaoServico, StatusServico } from '../types';
import { STATUS_SERVICO_CONFIG } from '../types';

interface ServicosKanbanProps {
  servicos: SolicitacaoServico[];
  loading: boolean;
  onVerDetalhe: (servico: SolicitacaoServico) => void;
}

const KANBAN_COLUMNS: StatusServico[] = [
  'criado',
  'enviado',
  'aceito',
  'em_andamento',
  'concluido',
];

export function ServicosKanban({ servicos, loading, onVerDetalhe }: ServicosKanbanProps) {
  // Agrupar serviços por status
  const colunas = useMemo(() => {
    const grupos: Record<StatusServico, SolicitacaoServico[]> = {
      criado: [],
      enviado: [],
      aceito: [],
      em_andamento: [],
      concluido: [],
      cancelado: [],
    };

    servicos.forEach((servico) => {
      if (grupos[servico.status]) {
        grupos[servico.status].push(servico);
      }
    });

    return grupos;
  }, [servicos]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date?: string) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]"></div>
      </div>
    );
  }

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {KANBAN_COLUMNS.map((status) => {
        const config = STATUS_SERVICO_CONFIG[status];
        const items = colunas[status];

        return (
          <div
            key={status}
            className="flex flex-col bg-gray-100 rounded-lg flex-1 min-w-[220px] min-h-[500px]"
          >
            {/* Header da Coluna */}
            <div
              className="px-3 py-2 rounded-t-lg flex items-center justify-between"
              style={{ backgroundColor: config.corBg }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: config.cor }}
                />
                <span className="text-[20px] font-normal text-gray-700">
                  {config.label}
                </span>
              </div>
              <span
                className="text-xs font-normal px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: config.cor,
                  color: 'white',
                }}
              >
                {items.length}
              </span>
            </div>

            {/* Cards */}
            <div className="p-2 space-y-2 flex-1 overflow-y-auto">
              {items.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  Nenhum serviço
                </div>
              ) : (
                items.map((servico, index) => (
                  <motion.div
                    key={servico.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => onVerDetalhe(servico)}
                    className="bg-white rounded-lg border border-gray-200 p-3 cursor-pointer hover:shadow-md transition-shadow"
                  >
                    {/* Número e Categoria */}
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">
                        {servico.numero}
                      </span>
                      {servico.categoria && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{
                            backgroundColor: servico.categoria.cor + '20',
                            color: servico.categoria.cor,
                          }}
                        >
                          {servico.categoria.nome}
                        </span>
                      )}
                    </div>

                    {/* Título */}
                    <h4 className="text-[20px] font-normal text-gray-900 line-clamp-2 mb-2">
                      {servico.titulo}
                    </h4>

                    {/* Endereços */}
                    <div className="space-y-1 mb-2">
                      {servico.coletar_cidade && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          <span className="truncate">De: {servico.coletar_cidade}</span>
                        </div>
                      )}
                      {servico.entregar_cidade && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 text-green-500" />
                          <span className="truncate">Para: {servico.entregar_cidade}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      {/* Data */}
                      {servico.data_necessidade && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          {formatDate(servico.data_necessidade)}
                        </div>
                      )}

                      {/* Valor */}
                      <div className="flex items-center gap-1 text-xs font-medium text-green-600">
                        <DollarSign className="w-3 h-3" />
                        {formatCurrency(servico.valor_servico)}
                      </div>
                    </div>

                    {/* Prestador (se houver) */}
                    {servico.prestador && (
                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 text-xs text-gray-600">
                        <User className="w-3 h-3" />
                        <span className="truncate">{servico.prestador.nome}</span>
                      </div>
                    )}
                  </motion.div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

