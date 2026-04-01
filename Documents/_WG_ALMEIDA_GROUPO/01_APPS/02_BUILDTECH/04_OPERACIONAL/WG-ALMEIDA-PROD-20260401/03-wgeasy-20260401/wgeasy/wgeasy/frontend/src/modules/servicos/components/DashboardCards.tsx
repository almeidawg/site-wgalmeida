// Cards de Dashboard do Módulo de Serviços
import {
  FileText,
  Send,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import type { DashboardServicos } from '../types';

interface DashboardCardsProps {
  dashboard: DashboardServicos;
}

export function DashboardCards({ dashboard }: DashboardCardsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const cards = [
    {
      label: 'Criados',
      value: dashboard.total_criados,
      icon: FileText,
      color: 'text-gray-600',
      bg: 'bg-gray-100',
    },
    {
      label: 'Enviados',
      value: dashboard.total_enviados,
      icon: Send,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      label: 'Aceitos',
      value: dashboard.total_aceitos,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bg: 'bg-emerald-100',
    },
    {
      label: 'Em Andamento',
      value: dashboard.total_em_andamento,
      icon: Clock,
      color: 'text-amber-600',
      bg: 'bg-amber-100',
    },
    {
      label: 'Concluídos',
      value: dashboard.total_concluidos,
      icon: CheckCircle2,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      label: 'Cancelados',
      value: dashboard.total_cancelados,
      icon: XCircle,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-4">
      {/* Cards de Status */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {cards.map((card) => (
          <div
            key={card.label}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.bg}`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
              <div>
                <p className="text-2xl font-normal text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-500">{card.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Cards de Valor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor Concluído (Mês)</p>
              <p className="text-xl font-normal text-gray-900">
                {formatCurrency(dashboard.valor_total_concluido)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Valor em ExecuçÍo</p>
              <p className="text-xl font-normal text-gray-900">
                {formatCurrency(dashboard.valor_em_execucao)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

