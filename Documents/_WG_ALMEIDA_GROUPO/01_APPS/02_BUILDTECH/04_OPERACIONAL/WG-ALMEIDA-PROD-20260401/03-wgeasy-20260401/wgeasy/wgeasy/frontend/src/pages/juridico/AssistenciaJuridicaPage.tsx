/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// ASSISTÊNCIA JURÍDICA - GESTÍO DE PROCESSOS E INTERMEDIAÇÕES
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  Scale,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  FileText,
  User,
  Calendar,
  DollarSign,
  Building2,
  ChevronRight,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Folder,
  X,
} from "lucide-react";
import {
  listarAssistencias,
  criarAssistencia,
  atualizarAssistencia,
  deletarAssistencia,
  type AssistenciaJuridica,
  type StatusAssistencia,
  type Prioridade,
  type TipoProcesso,
  type TipoSolicitante,
} from "@/lib/juridicoApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import DocumentosJuridicosCliente from "@/components/juridico/DocumentosJuridicosCliente";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { normalizeSearchTerm } from "@/utils/searchUtils";

/* ==================== CONSTANTES ==================== */

const STATUS_CONFIG: Record<StatusAssistencia, { label: string; cor: string; icone: typeof Clock }> = {
  PENDENTE: { label: "Pendente", cor: "#F59E0B", icone: Clock },
  EM_ANALISE: { label: "Em Análise", cor: "#3B82F6", icone: Eye },
  EM_ANDAMENTO: { label: "Em Andamento", cor: "#8B5CF6", icone: RefreshCw },
  RESOLVIDO: { label: "Resolvido", cor: "#10B981", icone: CheckCircle },
  ARQUIVADO: { label: "Arquivado", cor: "#6B7280", icone: XCircle },
};

const PRIORIDADE_CONFIG: Record<Prioridade, { label: string; cor: string }> = {
  BAIXA: { label: "Baixa", cor: "#6B7280" },
  MEDIA: { label: "Média", cor: "#3B82F6" },
  ALTA: { label: "Alta", cor: "#F59E0B" },
  URGENTE: { label: "Urgente", cor: "#EF4444" },
};

const TIPO_PROCESSO_CONFIG: Record<TipoProcesso, { label: string; icone: string }> = {
  TRABALHISTA: { label: "Trabalhista", icone: "👷" },
  CLIENTE_CONTRA_EMPRESA: { label: "Cliente vs Empresa", icone: "⚖️" },
  EMPRESA_CONTRA_CLIENTE: { label: "Empresa vs Cliente", icone: "🏢" },
  INTERMEDIACAO: { label: "IntermediaçÍo", icone: "🤝" },
  OUTRO: { label: "Outro", icone: "📋" },
};

const TIPO_SOLICITANTE_CONFIG: Record<TipoSolicitante, { label: string; cor: string }> = {
  CLIENTE: { label: "Cliente", cor: "#F25C26" },
  COLABORADOR: { label: "Colaborador", cor: "#3B82F6" },
  FORNECEDOR: { label: "Fornecedor", cor: "#8B5CF6" },
};

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function AssistenciaJuridicaPage() {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Estados
  const [assistencias, setAssistencias] = useState<AssistenciaJuridica[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusAssistencia | "">("");
  const [filtroPrioridade, setFiltroPrioridade] = useState<Prioridade | "">("");
  const [filtroTipo, setFiltroTipo] = useState<TipoProcesso | "">("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<AssistenciaJuridica | null>(null);
  const [pessoas, setPessoas] = useState<Array<{ id: string; nome: string; tipo: string }>>([]);
  const [clienteDocumentos, setClienteDocumentos] = useState<{ id: string; nome: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    tipo_solicitante: "CLIENTE" as TipoSolicitante,
    solicitante_id: "",
    tipo_processo: "INTERMEDIACAO" as TipoProcesso,
    titulo: "",
    descricao: "",
    prioridade: "MEDIA" as Prioridade,
    numero_processo: "",
    vara: "",
    comarca: "",
    advogado_responsavel: "",
    valor_causa: 0,
    data_audiencia: "",
    observacoes: "",
  });

  // Carregar dados
  async function carregarDados() {
    setLoading(true);
    try {
      const result = await listarAssistencias(
        { pageSize: 20, offset: (currentPage - 1) * 20 },
        {
          status: filtroStatus || undefined,
          prioridade: filtroPrioridade || undefined,
          tipo_processo: filtroTipo || undefined,
          busca: searchTerm || undefined,
        },
        { sortBy: "data_abertura", sortOrder: "desc" }
      );
      setAssistencias(result.data);
      setTotalCount(result.count);
    } catch (error: any) {
      console.error("Erro ao carregar assistências:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarPessoas() {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select("id, nome, tipo")
        .eq("ativo", true)
        .order("nome");
      setPessoas(data || []);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
    }
  }

  useEffect(() => {
    carregarDados();
    carregarPessoas();
  }, [currentPage, filtroStatus, filtroPrioridade, filtroTipo]);

  // Estatísticas
  const stats = {
    total: totalCount,
    pendentes: assistencias.filter((a) => a.status === "PENDENTE").length,
    emAnalise: assistencias.filter((a) => a.status === "EM_ANALISE").length,
    emAndamento: assistencias.filter((a) => a.status === "EM_ANDAMENTO").length,
    resolvidos: assistencias.filter((a) => a.status === "RESOLVIDO").length,
    urgentes: assistencias.filter((a) => a.prioridade === "URGENTE").length,
    valorTotal: assistencias.reduce((acc, a) => acc + (a.valor_causa || 0), 0),
  };

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    carregarDados();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await atualizarAssistencia(editingItem.id, formData);
      } else {
        await criarAssistencia({
          ...formData,
          status: "PENDENTE",
          valor_acordo: null,
          data_abertura: new Date().toISOString().split("T")[0],
          data_encerramento: null,
          criado_por: null,
          atualizado_por: null,
        });
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao salvar: : ${error.message}` });
    }
  };

  const handleEdit = (item: AssistenciaJuridica) => {
    setEditingItem(item);
    setFormData({
      tipo_solicitante: item.tipo_solicitante,
      solicitante_id: item.solicitante_id,
      tipo_processo: item.tipo_processo,
      titulo: item.titulo,
      descricao: item.descricao || "",
      prioridade: item.prioridade,
      numero_processo: item.numero_processo || "",
      vara: item.vara || "",
      comarca: item.comarca || "",
      advogado_responsavel: item.advogado_responsavel || "",
      valor_causa: item.valor_causa || 0,
      data_audiencia: item.data_audiencia || "",
      observacoes: item.observacoes || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta assistência?")) return;
    try {
      await deletarAssistencia(id);
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao excluir: : ${error.message}` });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: StatusAssistencia) => {
    try {
      await atualizarAssistencia(id, { status: novoStatus });
      carregarDados();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo_solicitante: "CLIENTE",
      solicitante_id: "",
      tipo_processo: "INTERMEDIACAO",
      titulo: "",
      descricao: "",
      prioridade: "MEDIA",
      numero_processo: "",
      vara: "",
      comarca: "",
      advogado_responsavel: "",
      valor_causa: 0,
      data_audiencia: "",
      observacoes: "",
    });
  };

  // FormataçÍo
  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const formatarData = (data: string) =>
    data ? new Date(data).toLocaleDateString("pt-BR") : "-";

  // Filtrar local
  const assistenciasFiltradas = assistencias.filter((item) => {
    if (!searchTerm) return true;
    const termo = normalizeSearchTerm(searchTerm);
    return (
      normalizeSearchTerm(item.titulo).includes(termo) ||
      normalizeSearchTerm(item.descricao || "").includes(termo) ||
      normalizeSearchTerm(item.numero_processo || "").includes(termo)
    );
  });

  if (loading && assistencias.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando assistências jurídicas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${LAYOUT.pageContainer} py-4 sm:py-6 space-y-4 sm:space-y-6`}>
      {/* HEADER */}
      <div className={LAYOUT.pageHeader}>
        <div>
          <h1 className={`${TYPOGRAPHY.pageTitle} flex items-center gap-2`}>
            <span className="text-2xl">⚖️</span>
            Assistência Jurídica
          </h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-1`}>
            GestÍo de processos, intermediações e suporte jurídico
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova SolicitaçÍo
        </button>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className={LAYOUT.gridStats}>
        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-gray-50 rounded-lg">
              <FileText className={`${TYPOGRAPHY.iconMedium} text-gray-600`} />
            </div>
            <div>
              <div className={TYPOGRAPHY.statNumber}>{stats.total}</div>
              <div className={TYPOGRAPHY.statLabel}>Total</div>
            </div>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-yellow-50 rounded-lg">
              <Clock className={`${TYPOGRAPHY.iconMedium} text-yellow-600`} />
            </div>
            <div>
              <div className={`${TYPOGRAPHY.statNumber} text-yellow-600`}>{stats.pendentes}</div>
              <div className={TYPOGRAPHY.statLabel}>Pendentes</div>
            </div>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
              <Eye className={`${TYPOGRAPHY.iconMedium} text-blue-600`} />
            </div>
            <div>
              <div className={`${TYPOGRAPHY.statNumber} text-blue-600`}>{stats.emAnalise}</div>
              <div className={TYPOGRAPHY.statLabel}>Em Análise</div>
            </div>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg">
              <RefreshCw className={`${TYPOGRAPHY.iconMedium} text-purple-600`} />
            </div>
            <div>
              <div className={`${TYPOGRAPHY.statNumber} text-purple-600`}>{stats.emAndamento}</div>
              <div className={TYPOGRAPHY.statLabel}>Em Andamento</div>
            </div>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg">
              <CheckCircle className={`${TYPOGRAPHY.iconMedium} text-green-600`} />
            </div>
            <div>
              <div className={`${TYPOGRAPHY.statNumber} text-green-600`}>{stats.resolvidos}</div>
              <div className={TYPOGRAPHY.statLabel}>Resolvidos</div>
            </div>
          </div>
        </div>

        <div className={LAYOUT.card}>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="p-1.5 sm:p-2 bg-red-50 rounded-lg">
              <AlertTriangle className={`${TYPOGRAPHY.iconMedium} text-red-600`} />
            </div>
            <div>
              <div className={`${TYPOGRAPHY.statNumber} text-red-600`}>{stats.urgentes}</div>
              <div className={TYPOGRAPHY.statLabel}>Urgentes</div>
            </div>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por título, descriçÍo ou número do processo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusAssistencia | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filtroPrioridade}
            onChange={(e) => setFiltroPrioridade(e.target.value as Prioridade | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todas Prioridades</option>
            {Object.entries(PRIORIDADE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoProcesso | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todos os Tipos</option>
            {Object.entries(TIPO_PROCESSO_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icone} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTA DE ASSISTÊNCIAS */}
      {assistenciasFiltradas.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <span className="text-6xl mx-auto mb-4 block text-center opacity-30">⚖️</span>
          <h3 className="text-[20px] font-normal text-gray-600 mb-2">
            Nenhuma solicitaçÍo encontrada
          </h3>
          <p className="text-[16px] text-gray-500 mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Clique em 'Nova SolicitaçÍo' para registrar uma assistência jurídica"}
          </p>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova SolicitaçÍo
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {assistenciasFiltradas.map((item) => {
            const statusConfig = STATUS_CONFIG[item.status];
            const prioridadeConfig = PRIORIDADE_CONFIG[item.prioridade];
            const tipoConfig = TIPO_PROCESSO_CONFIG[item.tipo_processo];
            const solicitanteConfig = TIPO_SOLICITANTE_CONFIG[item.tipo_solicitante];
            const StatusIcon = statusConfig.icone;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    {/* Info Principal */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="text-3xl">{tipoConfig.icone}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-normal text-gray-900 text-[20px] truncate">
                            {item.titulo}
                          </h3>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${prioridadeConfig.cor}15`,
                              color: prioridadeConfig.cor,
                            }}
                          >
                            {prioridadeConfig.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: solicitanteConfig.cor }}
                            ></span>
                            {solicitanteConfig.label}
                          </span>
                          <span>|</span>
                          <span>{tipoConfig.label}</span>
                          {item.numero_processo && (
                            <>
                              <span>|</span>
                              <span className="font-mono">{item.numero_processo}</span>
                            </>
                          )}
                        </div>

                        {item.descricao && (
                          <p className="text-[16px] text-gray-600 line-clamp-2">{item.descricao}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            Abertura: {formatarData(item.data_abertura)}
                          </span>
                          {item.data_audiencia && (
                            <span className="flex items-center gap-1 text-blue-600">
                              <Scale className="h-3.5 w-3.5" />
                              Audiência: {formatarData(item.data_audiencia)}
                            </span>
                          )}
                          {item.valor_causa > 0 && (
                            <span className="flex items-center gap-1 text-[#F25C26] font-medium">
                              <DollarSign className="h-3.5 w-3.5" />
                              {formatarMoeda(item.valor_causa)}
                            </span>
                          )}
                          {item.advogado_responsavel && (
                            <span className="flex items-center gap-1">
                              <User className="h-3.5 w-3.5" />
                              {item.advogado_responsavel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Status e Ações */}
                    <div className="flex flex-col items-end gap-3">
                      <div
                        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: `${statusConfig.cor}15`,
                          color: statusConfig.cor,
                        }}
                      >
                        <StatusIcon className="h-4 w-4" />
                        {statusConfig.label}
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as StatusAssistencia)
                          }
                          className="text-xs border border-gray-200 rounded px-2 py-1 focus:ring-1 focus:ring-[#F25C26]"
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          ))}
                        </select>

                        {/* BotÍo Ver Documentos - apenas para clientes */}
                        {item.tipo_solicitante === "CLIENTE" && (
                          <button
                            type="button"
                            onClick={() => {
                              const pessoa = pessoas.find(p => p.id === item.solicitante_id);
                              setClienteDocumentos({
                                id: item.solicitante_id,
                                nome: pessoa?.nome || "Cliente"
                              });
                            }}
                            className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors"
                            title="Ver Documentos Jurídicos"
                          >
                            <Folder className="h-4 w-4" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DOCUMENTOS JURÍDICOS DO CLIENTE */}
      {clienteDocumentos && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[20px] font-normal text-gray-900">
              Documentos Jurídicos - {clienteDocumentos.nome}
            </h3>
            <button
              type="button"
              onClick={() => setClienteDocumentos(null)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <X className="h-4 w-4" />
              Fechar
            </button>
          </div>
          <DocumentosJuridicosCliente
            clienteId={clienteDocumentos.id}
            clienteNome={clienteDocumentos.nome}
          />
        </div>
      )}

      {/* PAGINAÇÍO */}
      {totalCount > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-[14px] disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-[16px] text-gray-600">
            Página {currentPage} de {Math.ceil(totalCount / 20)}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= Math.ceil(totalCount / 20)}
            className="px-3 py-1 border border-gray-300 rounded text-[14px] disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}


      {/* MODAL DE CADASTRO/EDIÇÍO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                {editingItem ? "Editar SolicitaçÍo" : "Nova SolicitaçÍo de Assistência"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo Solicitante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Solicitante *
                  </label>
                  <select
                    value={formData.tipo_solicitante}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_solicitante: e.target.value as TipoSolicitante })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    {Object.entries(TIPO_SOLICITANTE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Solicitante */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Solicitante *
                  </label>
                  <select
                    value={formData.solicitante_id}
                    onChange={(e) => setFormData({ ...formData, solicitante_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    <option value="">Selecione...</option>
                    {pessoas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tipo Processo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Processo *
                  </label>
                  <select
                    value={formData.tipo_processo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo_processo: e.target.value as TipoProcesso })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    {Object.entries(TIPO_PROCESSO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.icone} {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Prioridade */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade *</label>
                  <select
                    value={formData.prioridade}
                    onChange={(e) =>
                      setFormData({ ...formData, prioridade: e.target.value as Prioridade })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    {Object.entries(PRIORIDADE_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-[#F25C26]"
                  placeholder="Ex: Processo trabalhista JoÍo Silva"
                  required
                />
              </div>

              {/* DescriçÍo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo</label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-[#F25C26]"
                  rows={3}
                  placeholder="Descreva detalhes da solicitaçÍo..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Número do Processo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número do Processo
                  </label>
                  <input
                    type="text"
                    value={formData.numero_processo}
                    onChange={(e) => setFormData({ ...formData, numero_processo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="0000000-00.0000.0.00.0000"
                  />
                </div>

                {/* Vara */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vara</label>
                  <input
                    type="text"
                    value={formData.vara}
                    onChange={(e) => setFormData({ ...formData, vara: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="Ex: 1ª Vara do Trabalho"
                  />
                </div>

                {/* Comarca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Comarca</label>
                  <input
                    type="text"
                    value={formData.comarca}
                    onChange={(e) => setFormData({ ...formData, comarca: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="Ex: SÍo Paulo/SP"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Advogado Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Advogado Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.advogado_responsavel}
                    onChange={(e) =>
                      setFormData({ ...formData, advogado_responsavel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="Nome do advogado"
                  />
                </div>

                {/* Valor da Causa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor da Causa
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor_causa}
                    onChange={(e) =>
                      setFormData({ ...formData, valor_causa: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="0,00"
                  />
                </div>

                {/* Data Audiência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data da Audiência
                  </label>
                  <input
                    type="date"
                    value={formData.data_audiencia}
                    onChange={(e) => setFormData({ ...formData, data_audiencia: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-[#F25C26]"
                  rows={2}
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-[14px] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] transition-colors"
                >
                  {editingItem ? "Salvar Alterações" : "Criar SolicitaçÍo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
