/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// CRONOGRAMA PROJETOS - WG EASY 2026
// Lista de projetos/obras com cards de cliente
// ============================================================

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeSearchTerm } from '@/utils/searchUtils';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Trash2,
  Loader2,
  Users,
  FileText,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Filter,
  LayoutGrid,
  List,
  ArrowRight,
  Play,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { buscarProjetosCompletos } from "@/services/cronogramaService";
import type { ProjetoCompleto, Nucleo } from "@/types/cronograma";
import { getNucleoColor, getNucleoIcon, getNucleoLabel, getStatusProjetoColor, getStatusProjetoLabel } from "@/types/cronograma";
import { formatarData } from "@/lib/utils";
import { supabaseRaw } from "@/lib/supabaseClient";
import { obterAvatarUrl } from "@/utils/avatarUtils";

// ============================================================
// Componente de Card do Projeto
// ============================================================
const ProjetoCard = ({
  projeto,
  onDelete,
  onClick
}: {
  projeto: ProjetoCompleto;
  onDelete: () => void;
  onClick: () => void;
}) => {
  const navigate = useNavigate();
  const nucleoCor = getNucleoColor(projeto.nucleo);
  const statusCor = getStatusProjetoColor(projeto.status);
  const avatarUrl = obterAvatarUrl(
    projeto.cliente_nome || "Cliente",
    projeto.cliente_avatar_url,
    projeto.cliente_foto_url
  );

  // Calcular dias restantes
  const diasRestantes = projeto.data_termino
    ? Math.ceil((new Date(projeto.data_termino).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all group"
    >
      {/* Barra de cor do núcleo */}
      <div className="h-0.5" style={{ backgroundColor: nucleoCor }} />

      <div className="p-2.5">
        {/* Header com Avatar e Info */}
        <div className="flex items-start gap-1.5 mb-1.5">
          {/* Avatar do Cliente */}
          <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 shadow-sm border border-white/70">
            <img
              src={avatarUrl}
              alt={projeto.cliente_nome || "Cliente"}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex-1 min-w-0">
            <span className="text-[8px] font-normal uppercase tracking-wide block" style={{ color: nucleoCor }}>
              {getNucleoIcon(projeto.nucleo)} {getNucleoLabel(projeto.nucleo)}
            </span>
            <h3 className="text-xs font-normal text-gray-900 truncate group-hover:text-wg-primary transition-colors leading-tight">
              {projeto.nome}
            </h3>
            <p className="text-[9px] text-gray-500 truncate">
              {projeto.cliente_nome || 'Cliente nÍo definido'}
            </p>
          </div>
        </div>

        {/* Status Badge */}
        <div
          className="inline-block px-1 py-px rounded text-[8px] font-medium mb-1.5"
          style={{ backgroundColor: `${statusCor}15`, color: statusCor }}
        >
          {getStatusProjetoLabel(projeto.status)}
        </div>

        {/* DescriçÍo */}
        {projeto.descricao && (
          <p className="text-[9px] text-gray-600 mb-1.5 line-clamp-2">{projeto.descricao}</p>
        )}

        {/* Contrato */}
        {projeto.contrato_numero && (
          <div className="flex items-center gap-1 text-[9px] text-gray-500 mb-1.5">
            <FileText className="w-2.5 h-2.5" />
            <span>Contrato {projeto.contrato_numero}</span>
          </div>
        )}

        {/* Progresso */}
        <div className="mb-1.5">
          <div className="flex items-center justify-between text-[9px] mb-0.5">
            <span className="text-gray-500">Progresso</span>
            <span className="font-normal text-gray-900">{projeto.progresso}%</span>
          </div>
          <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${projeto.progresso}%` }}
              transition={{ duration: 0.8 }}
              className="h-full rounded-full"
              style={{ backgroundColor: nucleoCor }}
            />
          </div>
        </div>

        {/* Datas */}
        <div className="flex flex-col text-[8px] text-gray-500 mb-1.5">
          {projeto.data_inicio && (
            <div className="flex items-center gap-0.5">
              <Calendar className="w-2 h-2" />
              <span>Início: {formatarData(projeto.data_inicio)}</span>
            </div>
          )}
          {projeto.data_termino && (
            <div className="flex items-center gap-0.5">
              <Clock className="w-2 h-2" />
              <span>Término: {formatarData(projeto.data_termino)}</span>
            </div>
          )}
        </div>

        {/* Indicador de dias restantes */}
        {diasRestantes !== null && (
          <div className={`text-[8px] font-medium mb-1.5 ${diasRestantes < 0 ? 'text-red-600' : diasRestantes <= 7 ? 'text-orange-600' : 'text-green-600'}`}>
            {diasRestantes < 0
              ? `⚠️ Atrasado ${Math.abs(diasRestantes)} dias`
              : diasRestantes === 0
              ? '⏰ Vence hoje!'
              : `📅 ${diasRestantes} dias restantes`}
          </div>
        )}

        {/* Botões de AçÍo */}
        <div className="flex gap-1 pt-1.5 border-t border-gray-100">
          <Button
            onClick={onClick}
            size="sm"
            className="flex-1 h-8 text-xs bg-primary hover:bg-primary-dark text-white"
          >
            <Eye className="w-3.5 h-3.5 mr-1" />
            Ver Obra
          </Button>
          <Button
            type="button"
            size="sm"
            title="Gerenciar Equipe"
            className="h-8 w-8 p-0 bg-blue-50 border border-blue-300 text-blue-600 hover:bg-blue-100"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/cronograma/projects/${projeto.id}/equipe`);
            }}
          >
            <Users className="w-3.5 h-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            title="Excluir Projeto"
            className="h-8 w-8 p-0 bg-red-50 border border-red-300 text-red-500 hover:bg-red-100"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================
// Componente Principal
// ============================================================
export default function CronogramaProjectsPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [projetos, setProjetos] = useState<ProjetoCompleto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filtroNucleo, setFiltroNucleo] = useState<Nucleo | 'todos'>('todos');
  const [filtroStatus, setFiltroStatus] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [projectToDelete, setProjectToDelete] = useState<ProjetoCompleto | null>(null);

  useEffect(() => {
    carregarProjetos();
  }, []);

  async function carregarProjetos() {
    try {
      setLoading(true);
      const dados = await buscarProjetosCompletos();
      setProjetos(dados);
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
      toast({ variant: 'destructive', title: 'Erro ao carregar projetos' });
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteProject() {
    if (!projectToDelete) return;

    try {
      const { error } = await supabaseRaw
        .from('projetos')
        .delete()
        .eq('id', projectToDelete.id);

      if (error) throw error;

      setProjetos(prev => prev.filter(p => p.id !== projectToDelete.id));
      toast({ title: 'Projeto excluído com sucesso!' });
    } catch (error: any) {
      console.error("Erro ao excluir projeto:", error);
      toast({ variant: 'destructive', title: 'Erro ao excluir projeto' });
    } finally {
      setProjectToDelete(null);
    }
  }

  // Filtrar projetos
  const projetosFiltrados = projetos.filter(projeto => {
    // Filtro de busca
    const searchLower = normalizeSearchTerm(search);
    const matchSearch = !search ||
      normalizeSearchTerm(projeto.nome || '').includes(searchLower) ||
      normalizeSearchTerm(projeto.cliente_nome || '').includes(searchLower) ||
      normalizeSearchTerm(projeto.descricao || '').includes(searchLower);

    // Filtro de núcleo
    const matchNucleo = filtroNucleo === 'todos' || projeto.nucleo === filtroNucleo;

    // Filtro de status
    const matchStatus = filtroStatus === 'todos' || projeto.status === filtroStatus;

    return matchSearch && matchNucleo && matchStatus;
  });

  // Estatísticas rápidas
  const stats = {
    total: projetos.length,
    emAndamento: projetos.filter(p => p.status === 'em_andamento').length,
    atrasados: projetos.filter(p => p.status === 'atrasado').length,
    concluidos: projetos.filter(p => p.status === 'concluido').length,
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Breadcrumb */}
      <Breadcrumb
        items={[
          { label: "Cronograma", href: "/cronograma" },
          { label: "Projetos" },
        ]}
      />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-normal text-gray-900">Projetos / Obras</h1>
          <p className="text-sm text-gray-500 mt-1">Gerencie todas as obras do cronograma</p>
        </div>
        <Button
          onClick={() => navigate('/contratos')}
          className="text-lg bg-wg-primary hover:bg-wg-primary/90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Obra (via Contrato)
        </Button>
      </div>

      {/* Stats Cards - Layout compacto: Ícone + Número + Texto na mesma linha */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-md">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-xl font-normal text-gray-900">{stats.total}</span>
            <span className="text-xs text-gray-500">Total</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-100 rounded-md">
              <Play className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xl font-normal text-gray-900">{stats.emAndamento}</span>
            <span className="text-xs text-gray-500">Em Andamento</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-red-100 rounded-md">
              <AlertTriangle className="w-4 h-4 text-red-600" />
            </div>
            <span className="text-xl font-normal text-gray-900">{stats.atrasados}</span>
            <span className="text-xs text-gray-500">Atrasados</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-purple-100 rounded-md">
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xl font-normal text-gray-900">{stats.concluidos}</span>
            <span className="text-xs text-gray-500">Concluídos</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Buscar por nome, cliente ou descriçÍo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filtro Núcleo */}
          <div className="flex items-center gap-2">
            <span className="text-lg text-gray-500">Núcleo:</span>
            <div className="flex gap-1">
              {['todos', 'engenharia', 'arquitetura', 'marcenaria'].map((nucleo) => (
                <button
                  key={nucleo}
                  onClick={() => setFiltroNucleo(nucleo as any)}
                  className={`px-3 py-1.5 rounded-lg text-lg font-medium transition-all ${
                    filtroNucleo === nucleo
                      ? 'bg-wg-primary text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {nucleo === 'todos' ? 'Todos' : getNucleoIcon(nucleo as Nucleo)}
                </button>
              ))}
            </div>
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm' : ''}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-10 h-10 animate-spin text-wg-primary mx-auto mb-4" />
            <p className="text-gray-500">Carregando projetos...</p>
          </div>
        </div>
      )}

      {/* Grid de Projetos */}
      {!loading && (
        <AnimatePresence mode="popLayout">
          {projetosFiltrados.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 bg-white rounded-2xl border border-gray-100"
            >
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-2xl font-normal text-gray-900 mb-2">Nenhum projeto encontrado</h3>
              <p className="text-sm text-gray-500 mb-6">
                {search ? 'Tente ajustar seus filtros de busca' : 'Crie um novo projeto para começar'}
              </p>
              <Button onClick={() => navigate('/contratos')} className="text-lg bg-wg-primary hover:bg-wg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Criar Novo Projeto
              </Button>
            </motion.div>
          ) : (
            <div className={`grid gap-3 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {projetosFiltrados.map((projeto) => (
                <ProjetoCard
                  key={projeto.id}
                  projeto={projeto}
                  onDelete={() => setProjectToDelete(projeto)}
                  onClick={() => navigate(`/cronograma/projects/${projeto.id}`)}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      )}

      {/* Dialog de ConfirmaçÍo de ExclusÍo */}
      <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir projeto?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o projeto "{projectToDelete?.nome}"? Esta açÍo nÍo pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-red-500 hover:bg-red-600">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

