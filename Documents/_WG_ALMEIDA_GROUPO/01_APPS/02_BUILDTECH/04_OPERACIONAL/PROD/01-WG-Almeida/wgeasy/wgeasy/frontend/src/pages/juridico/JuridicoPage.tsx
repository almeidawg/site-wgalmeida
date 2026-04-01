/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { normalizeSearchTerm } from "@/utils/searchUtils";
// ============================================================
// MÓDULO JURÍDICO - PÁGINA PRINCIPAL
// Sistema WG Easy - Grupo WG Almeida
// Acesso restrito: Conforme permissões por tipo de usuário
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Filter,
  FileText,
  Edit,
  Trash2,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Archive,
  Send,
  Copy,
  MoreVertical,
  Building2,
  Shield,
  AlertTriangle,
  History,
} from "lucide-react";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { verificarPermissao as verificarPermissaoModulo } from "@/lib/permissoesModuloApi";
import { useToast } from "@/components/ui/use-toast";

/* ==================== TIPOS ==================== */

type StatusModelo = "rascunho" | "em_revisao" | "aprovado" | "publicado" | "arquivado";
type NucleoContrato = "arquitetura" | "engenharia" | "marcenaria" | "produtos" | "materiais" | "empreitada" | "geral";

type ModeloContrato = {
  id: string;
  codigo: string;
  nome: string;
  descricao: string | null;
  empresa_id: string | null;
  nucleo: NucleoContrato;
  status: StatusModelo;
  versao: number;
  versao_texto: string;
  conteudo_html: string;
  clausulas: any[];
  variaveis_obrigatorias: string[];
  prazo_execucao_padrao: number;
  prorrogacao_padrao: number;
  criado_por: string | null;
  aprovado_por: string | null;
  data_aprovacao: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
  empresa?: {
    id: string;
    razao_social: string;
    nome_fantasia: string;
  };
  criador?: {
    id: string;
    nome: string;
  };
  aprovador?: {
    id: string;
    nome: string;
  };
};

type Empresa = {
  id: string;
  razao_social: string;
  nome_fantasia: string;
};

/* ==================== CONSTANTES ==================== */

const STATUS_CONFIG: Record<StatusModelo, { label: string; cor: string; icone: React.ElementType }> = {
  rascunho: { label: "Rascunho", cor: "#6B7280", icone: Edit },
  em_revisao: { label: "Em RevisÍo", cor: "#F59E0B", icone: Clock },
  aprovado: { label: "Aprovado", cor: "#10B981", icone: CheckCircle },
  publicado: { label: "Publicado", cor: "#3B82F6", icone: Send },
  arquivado: { label: "Arquivado", cor: "#9CA3AF", icone: Archive },
};

const NUCLEO_CONFIG: Record<NucleoContrato, { label: string; icone: string; cor: string }> = {
  arquitetura: { label: "Arquitetura", icone: "🏛️", cor: "#F25C26" },
  engenharia: { label: "Engenharia", icone: "⚙️", cor: "#3B82F6" },
  marcenaria: { label: "Marcenaria", icone: "🪵", cor: "#8B5CF6" },
  produtos: { label: "Produtos", icone: "🛒", cor: "#10B981" },
  materiais: { label: "Materiais", icone: "🧰", cor: "#F59E0B" },
  empreitada: { label: "Empreitada", icone: "🔨", cor: "#EF4444" },
  geral: { label: "Geral", icone: "📄", cor: "#6B7280" },
};

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function JuridicoPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Estados
  const [modelos, setModelos] = useState<ModeloContrato[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusModelo | "todos">("todos");
  const [filtroNucleo, setFiltroNucleo] = useState<NucleoContrato | "todos">("todos");
  const [filtroEmpresa, setFiltroEmpresa] = useState<string>("todos");
  const [menuAberto, setMenuAberto] = useState<string | null>(null);
  const [usuarioPermitido, setUsuarioPermitido] = useState<boolean | null>(null);
  const [permissoes, setPermissoes] = useState({
    podeCriar: false,
    podeEditar: false,
    podeExcluir: false,
  });

  // Verificar permissÍo do usuário usando sistema de permissões
  async function verificarPermissao() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setUsuarioPermitido(false);
        return;
      }

      // Primeiro verificar se é MASTER ou ADMIN (sempre tem acesso)
      const { data: usuarioData } = await supabase
        .from("usuarios")
        .select("tipo_usuario")
        .eq("auth_user_id", user.id)
        .single();

      // MASTER, ADMIN e JURIDICO sempre têm acesso total ao módulo jurídico
      if (usuarioData?.tipo_usuario === "MASTER" || usuarioData?.tipo_usuario === "ADMIN" || usuarioData?.tipo_usuario === "JURIDICO") {
        setUsuarioPermitido(true);
        setPermissoes({
          podeCriar: true,
          podeEditar: true,
          podeExcluir: usuarioData?.tipo_usuario !== "JURIDICO", // JURIDICO pode criar/editar mas nÍo excluir
        });
        return;
      }

      // Para outros tipos, verificar permissÍo no módulo JURIDICO
      try {
        const podeVisualizar = await verificarPermissaoModulo(user.id, "JURIDICO", "pode_visualizar");
        const podeCriar = await verificarPermissaoModulo(user.id, "JURIDICO", "pode_criar");
        const podeEditar = await verificarPermissaoModulo(user.id, "JURIDICO", "pode_editar");
        const podeExcluir = await verificarPermissaoModulo(user.id, "JURIDICO", "pode_excluir");

        setUsuarioPermitido(podeVisualizar);
        setPermissoes({
          podeCriar,
          podeEditar,
          podeExcluir,
        });
      } catch (rpcError) {
        // Se a funçÍo RPC falhar, verificar diretamente na tabela
        console.warn("Erro na funçÍo RPC, usando fallback:", rpcError);

        // Verificar tipo de usuário e conceder acesso baseado no tipo
        const tiposPermitidos = ["MASTER", "ADMIN", "JURIDICO", "FINANCEIRO"];
        const temAcesso = tiposPermitidos.includes(usuarioData?.tipo_usuario || "");

        setUsuarioPermitido(temAcesso);
        setPermissoes({
          podeCriar: temAcesso,
          podeEditar: temAcesso,
          podeExcluir: usuarioData?.tipo_usuario === "MASTER",
        });
      }
    } catch (error) {
      console.error("Erro ao verificar permissÍo:", error);
      // Fallback: permitir acesso se houver erro (para nÍo bloquear sistema)
      const { data: { user } } = await supabase.auth.getUser();
      setUsuarioPermitido(!!user);
      setPermissoes({ podeCriar: true, podeEditar: true, podeExcluir: false });
    }
  }

  // Carregar dados
  async function carregarDados() {
    setLoading(true);
    try {
      // Carregar modelos (sem JOINs para evitar erros de FK)
      const { data: modelosData, error: modelosError } = await supabase
        .from("juridico_modelos_contrato")
        .select("*")
        .eq("ativo", true)
        .order("updated_at", { ascending: false });

      if (modelosError) throw modelosError;

      setModelos(modelosData || []);
      setEmpresas([]);
    } catch (error: any) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    verificarPermissao();
    carregarDados();
  }, []);

  // Ações do modelo
  async function alterarStatus(id: string, novoStatus: StatusModelo) {
    try {
      const updateData: any = { status: novoStatus };

      if (novoStatus === "aprovado") {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.aprovado_por = user?.id;
        updateData.data_aprovacao = new Date().toISOString();
      }

      const { error } = await supabase
        .from("juridico_modelos_contrato")
        .update(updateData)
        .eq("id", id);

      if (error) throw error;

      // Registrar auditoria
      await registrarAuditoria(id, novoStatus === "aprovado" ? "aprovar" : "editar", { status: novoStatus });

      toast({ title: "Sucesso", description: `Status alterado para ${STATUS_CONFIG[novoStatus].label}` });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao alterar status: " + error.message });
    }
    setMenuAberto(null);
  }

  async function duplicarModelo(modelo: ModeloContrato) {
    try {
      const novoCodigo = `${modelo.codigo}-COPIA-${Date.now().toString(36).toUpperCase()}`;

      const { error } = await supabase.from("juridico_modelos_contrato").insert([
        {
          codigo: novoCodigo,
          nome: `${modelo.nome} (Cópia)`,
          descricao: modelo.descricao,
          empresa_id: modelo.empresa_id,
          nucleo: modelo.nucleo,
          status: "rascunho",
          conteudo_html: modelo.conteudo_html,
          clausulas: modelo.clausulas,
          variaveis_obrigatorias: modelo.variaveis_obrigatorias,
          prazo_execucao_padrao: modelo.prazo_execucao_padrao,
          prorrogacao_padrao: modelo.prorrogacao_padrao,
        },
      ]);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Modelo duplicado com sucesso!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar: " + error.message });
    }
    setMenuAberto(null);
  }

  async function excluirModelo(id: string) {
    if (!confirm("Deseja realmente excluir este modelo? Esta açÍo nÍo pode ser desfeita.")) return;

    try {
      const { error } = await supabase
        .from("juridico_modelos_contrato")
        .update({ ativo: false })
        .eq("id", id);

      if (error) throw error;

      await registrarAuditoria(id, "arquivar");

      toast({ title: "Sucesso", description: "Modelo excluído com sucesso!" });
      carregarDados();
    } catch (error: any) {
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir: " + error.message });
    }
    setMenuAberto(null);
  }

  async function registrarAuditoria(entidadeId: string, acao: string, dados?: any) {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from("juridico_auditoria").insert([
        {
          entidade: "juridico_modelos_contrato",
          entidade_id: entidadeId,
          acao,
          dados_depois: dados,
          usuario_id: user?.id,
        },
      ]);
    } catch (error) {
      console.error("Erro ao registrar auditoria:", error);
    }
  }

  // Filtrar modelos
  const modelosFiltrados = modelos.filter((modelo) => {
    const termo = normalizeSearchTerm(searchTerm);
    const matchSearch =
      normalizeSearchTerm(modelo.nome).includes(termo) ||
      normalizeSearchTerm(modelo.codigo).includes(termo);
    const matchStatus = filtroStatus === "todos" || modelo.status === filtroStatus;
    const matchNucleo = filtroNucleo === "todos" || modelo.nucleo === filtroNucleo;
    const matchEmpresa = filtroEmpresa === "todos" || modelo.empresa_id === filtroEmpresa;

    return matchSearch && matchStatus && matchNucleo && matchEmpresa;
  });

  // Estatísticas
  const stats = {
    total: modelos.length,
    rascunho: modelos.filter((m) => m.status === "rascunho").length,
    em_revisao: modelos.filter((m) => m.status === "em_revisao").length,
    aprovado: modelos.filter((m) => m.status === "aprovado").length,
    publicado: modelos.filter((m) => m.status === "publicado").length,
  };

  // VerificaçÍo de acesso
  if (usuarioPermitido === null) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Verificando permissoes...</p>
          </div>
        </div>
      </div>
    );
  }

  if (usuarioPermitido === false) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <span className="text-6xl mx-auto mb-4 block text-center">⚖️</span>
            <h2 className="text-[24px] font-light text-gray-900 mb-2">Acesso Restrito</h2>
            <p className="text-[14px] text-gray-600 mb-4">
              Este modulo e exclusivo para o departamento Juridico e Diretoria.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-primary text-white rounded-lg hover:bg-primary/90 text-[13px] font-normal"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-3 sm:p-6">
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-3 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
            <p className="text-[12px] text-gray-500">Carregando modulo juridico...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-3 sm:p-6">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#F25C26] to-[#d94d1f] rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-2xl">⚖️</span>
            </div>
            <div>
              <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-gray-900">Jurídico WG</h1>
              <p className="text-[12px] text-gray-600">GestÍo de Modelos de Contrato</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/juridico/variaveis")}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[13px] font-normal flex items-center gap-2 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Variaveis
            </button>
            <button
              onClick={() => navigate("/juridico/auditoria")}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-[13px] font-normal flex items-center gap-2 transition-colors"
            >
              <History className="h-4 w-4" />
              Auditoria
            </button>
            {permissoes.podeCriar && (
              <button
                onClick={() => navigate("/juridico/novo")}
                className="flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#F25C26] to-[#d94d1f] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
              >
                <Plus className="h-5 w-5" />
                Novo Modelo
              </button>
            )}
          </div>
        </div>
      </div>

      {/* CARDS DE ESTATÍSTICAS */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <FileText className="w-4 h-4 text-gray-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{stats.total}</span>
            <span className="text-[12px] text-gray-500">Total</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-md">
              <Edit className="w-4 h-4 text-gray-500" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{stats.rascunho}</span>
            <span className="text-[12px] text-gray-500">Rascunhos</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-yellow-50 rounded-md">
              <Clock className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{stats.em_revisao}</span>
            <span className="text-[12px] text-gray-500">Revisao</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-green-50 rounded-md">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{stats.aprovado}</span>
            <span className="text-[12px] text-gray-500">Aprovados</span>
          </div>
        </div>
        <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <Send className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-[18px] font-light text-gray-900">{stats.publicado}</span>
            <span className="text-[12px] text-gray-500">Publicados</span>
          </div>
        </div>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          {/* Busca */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por codigo ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-[13px] font-normal focus:ring-2 focus:ring-[#F25C26]/20 focus:border-[#F25C26]"
            />
          </div>

          {/* Filtro Status */}
          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-normal focus:ring-2 focus:ring-[#F25C26]/20 bg-white"
          >
            <option value="todos">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Filtro Núcleo */}
          <select
            value={filtroNucleo}
            onChange={(e) => setFiltroNucleo(e.target.value as any)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-normal focus:ring-2 focus:ring-[#F25C26]/20 bg-white"
          >
            <option value="todos">Todos os Nucleos</option>
            {Object.entries(NUCLEO_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icone} {config.label}
              </option>
            ))}
          </select>

          {/* Filtro Empresa */}
          <select
            value={filtroEmpresa}
            onChange={(e) => setFiltroEmpresa(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-[13px] font-normal focus:ring-2 focus:ring-[#F25C26]/20 bg-white"
          >
            <option value="todos">Todas as Empresas</option>
            {empresas.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.nome_fantasia || emp.razao_social}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* LISTA DE MODELOS */}
      {modelosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center border border-gray-100 shadow-sm">
          <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[18px] font-normal text-gray-700 mb-2">
            Nenhum modelo encontrado
          </h3>
          <p className="text-[12px] text-gray-500 mb-6">
            {searchTerm || filtroStatus !== "todos" || filtroNucleo !== "todos"
              ? "Tente ajustar os filtros de busca"
              : "Crie seu primeiro modelo de contrato"}
          </p>
          <button
            onClick={() => navigate("/juridico/novo")}
            className="inline-flex items-center gap-2 px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#F25C26] to-[#d94d1f] text-white rounded-lg text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Criar Modelo
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {modelosFiltrados.map((modelo) => {
            const statusConfig = STATUS_CONFIG[modelo.status];
            const nucleoConfig = NUCLEO_CONFIG[modelo.nucleo];
            const StatusIcon = statusConfig.icone;

            return (
              <motion.div
                key={modelo.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                {/* Header do Card */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{nucleoConfig.icone}</span>
                      <div>
                        <span className="text-xs font-mono text-gray-500">{modelo.codigo}</span>
                        <h3 className="font-normal text-gray-900 text-sm">{modelo.nome}</h3>
                      </div>
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setMenuAberto(menuAberto === modelo.id ? null : modelo.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                      >
                        <MoreVertical className="h-5 w-5 text-gray-400" />
                      </button>

                      {/* Menu Dropdown */}
                      <AnimatePresence>
                        {menuAberto === modelo.id && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-xl border border-gray-200 py-1 z-10"
                          >
                            {permissoes.podeEditar && (
                              <button
                                onClick={() => {
                                  navigate(`/juridico/editar/${modelo.id}`);
                                  setMenuAberto(null);
                                }}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Edit className="h-4 w-4" /> Editar
                              </button>
                            )}
                            <button
                              onClick={() => {
                                navigate(`/juridico/visualizar/${modelo.id}`);
                                setMenuAberto(null);
                              }}
                              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" /> Visualizar
                            </button>
                            {permissoes.podeCriar && (
                              <button
                                onClick={() => duplicarModelo(modelo)}
                                className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                              >
                                <Copy className="h-4 w-4" /> Duplicar
                              </button>
                            )}
                            {permissoes.podeEditar && (
                              <>
                                <hr className="my-1" />
                                {modelo.status === "rascunho" && (
                                  <button
                                    onClick={() => alterarStatus(modelo.id, "em_revisao")}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 text-yellow-700 flex items-center gap-2"
                                  >
                                    <Clock className="h-4 w-4" /> Enviar p/ RevisÍo
                                  </button>
                                )}
                                {modelo.status === "em_revisao" && (
                                  <>
                                    <button
                                      onClick={() => alterarStatus(modelo.id, "aprovado")}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-700 flex items-center gap-2"
                                    >
                                      <CheckCircle className="h-4 w-4" /> Aprovar
                                    </button>
                                    <button
                                      onClick={() => alterarStatus(modelo.id, "rascunho")}
                                      className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-700 flex items-center gap-2"
                                    >
                                      <XCircle className="h-4 w-4" /> Rejeitar
                                    </button>
                                  </>
                                )}
                                {modelo.status === "aprovado" && (
                                  <button
                                    onClick={() => alterarStatus(modelo.id, "publicado")}
                                    className="w-full px-4 py-2 text-left text-sm hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                                  >
                                    <Send className="h-4 w-4" /> Publicar
                                  </button>
                                )}
                              </>
                            )}
                            {permissoes.podeExcluir && (
                              <>
                                <hr className="my-1" />
                                <button
                                  onClick={() => excluirModelo(modelo.id)}
                                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                >
                                  <Trash2 className="h-4 w-4" /> Excluir
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Body do Card */}
                <div className="p-4 space-y-3">
                  {modelo.descricao && (
                    <p className="text-xs text-gray-600 line-clamp-2">{modelo.descricao}</p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-normal"
                      style={{
                        backgroundColor: `${statusConfig.cor}15`,
                        color: statusConfig.cor,
                      }}
                    >
                      <StatusIcon className="h-3 w-3" />
                      {statusConfig.label}
                    </span>
                    <span
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-normal"
                      style={{
                        backgroundColor: `${nucleoConfig.cor}15`,
                        color: nucleoConfig.cor,
                      }}
                    >
                      {nucleoConfig.label}
                    </span>
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                      v{modelo.versao_texto}
                    </span>
                  </div>

                  {/* Empresa */}
                  {modelo.empresa && (
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Building2 className="h-3 w-3" />
                      {modelo.empresa.nome_fantasia || modelo.empresa.razao_social}
                    </div>
                  )}
                </div>

                {/* Footer do Card */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Atualizado em {new Date(modelo.updated_at).toLocaleDateString("pt-BR")}
                  </span>
                  {modelo.aprovador && (
                    <span className="text-green-600">
                      Aprovado por {modelo.aprovador.nome?.split(" ")[0]}
                    </span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* AVISO DE WORKFLOW */}
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="text-[13px] font-normal text-amber-800">Workflow Obrigatório</h4>
            <p className="text-[12px] text-amber-700 mt-1">
              Somente modelos com status "Publicado" podem ser utilizados para gerar contratos.
              Todos os contratos gerados ficam vinculados a versao do modelo no momento da geracao (snapshot imutavel).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

