/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// Página principal do Módulo de Serviços
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Truck,
  Plus,
  Search,
  Filter,
  LayoutList,
  LayoutGrid,
  RefreshCw,
} from 'lucide-react';
import { useServicos } from '../hooks/useServicos';
import { useCategorias } from '../hooks/useCategorias';
import { ServicosList } from './ServicosList';
import { ServicosKanban } from './ServicosKanban';
import { NovoServicoModal } from './NovoServicoModal';
import { ServicoDetalheModal } from './ServicoDetalheModal';
import { DashboardCards } from './DashboardCards';
import type { SolicitacaoServico, StatusServico, FiltrosServico } from '../types';
import { STATUS_SERVICO_CONFIG } from '../types';

type ViewMode = 'list' | 'kanban';

interface ServicosPageProps {
  filtrosFixos?: FiltrosServico;
  permitirCriar?: boolean;
  titulo?: string;
  subtitulo?: string;
}

export default function ServicosPage({
  filtrosFixos,
  permitirCriar = true,
  titulo = 'Serviços',
  subtitulo = 'Gerencie solicitações de fretes, coletas e serviços',
}: ServicosPageProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showDetalheModal, setShowDetalheModal] = useState(false);
  const [servicoDetalhe, setServicoDetalhe] = useState<SolicitacaoServico | null>(null);
  const [busca, setBusca] = useState('');
  const [statusFiltro, setStatusFiltro] = useState<StatusServico | ''>('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');

  const {
    servicos,
    dashboard,
    loading,
    filtros,
    setFiltros,
    carregarServicos,
    carregarDashboard,
  } = useServicos(filtrosFixos);

  const { categorias } = useCategorias();

  // Carregar dashboard ao montar
  useEffect(() => {
    carregarDashboard();
  }, [carregarDashboard]);

  // Aplicar filtros com debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      const novosFiltros: FiltrosServico = {};
      if (busca) novosFiltros.busca = busca;
      if (statusFiltro) novosFiltros.status = statusFiltro;
      if (categoriaFiltro) novosFiltros.categoria_id = categoriaFiltro;
      setFiltros(novosFiltros);
    }, 300);

    return () => clearTimeout(timer);
  }, [busca, statusFiltro, categoriaFiltro, setFiltros]);

  const handleVerDetalhe = (servico: SolicitacaoServico) => {
    setServicoDetalhe(servico);
    setShowDetalheModal(true);
  };

  const handleServicoCriado = () => {
    setShowNovoModal(false);
    carregarServicos();
    carregarDashboard();
  };

  const handleServicoAtualizado = () => {
    setShowDetalheModal(false);
    setServicoDetalhe(null);
    carregarServicos();
    carregarDashboard();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Truck className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-[20px] sm:text-[22px] lg:text-[24px] font-light tracking-tight text-gray-900">
                    {titulo}
                  </h1>
                  <p className="text-[11px] sm:text-[12px] text-gray-500">
                    {subtitulo}
                  </p>
                </div>
              </div>

              {permitirCriar && (
                <button
                  onClick={() => setShowNovoModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-[#D94E1F] transition-colors whitespace-nowrap shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nova SolicitaçÍo</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      {dashboard && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <DashboardCards dashboard={dashboard} />
        </div>
      )}

      {/* Filtros e Controles */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Busca e Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            {/* Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
            </div>

            {/* Filtro Status */}
            <select
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value as StatusServico | '')}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todos os status</option>
              {Object.entries(STATUS_SERVICO_CONFIG).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>

            {/* Filtro Categoria */}
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Todas categorias</option>
              {categorias.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>

            {/* Atualizar */}
            <button
              onClick={() => carregarServicos()}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              title="Atualizar"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toggle View */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="VisualizaçÍo Kanban"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              title="VisualizaçÍo Lista"
            >
              <LayoutList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.div
          key={viewMode}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {viewMode === 'kanban' ? (
            <ServicosKanban
              servicos={servicos}
              loading={loading}
              onVerDetalhe={handleVerDetalhe}
            />
          ) : (
            <ServicosList
              servicos={servicos}
              loading={loading}
              onVerDetalhe={handleVerDetalhe}
            />
          )}
        </motion.div>
      </div>

      {/* Modais */}
      {showNovoModal && (
        <NovoServicoModal
          onClose={() => setShowNovoModal(false)}
          onSuccess={handleServicoCriado}
        />
      )}

      {showDetalheModal && servicoDetalhe && (
        <ServicoDetalheModal
          servico={servicoDetalhe}
          onClose={() => {
            setShowDetalheModal(false);
            setServicoDetalhe(null);
          }}
          onUpdate={handleServicoAtualizado}
        />
      )}
    </div>
  );
}

