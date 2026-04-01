/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA: Listagem de Propostas
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate, useLocation } from "react-router-dom";
import { listarPropostas, buscarProposta, duplicarProposta, gerarTokenCompartilhamento, gerarMensagemPropostaWhatsApp, obterLinkProposta, atualizarPrecosPropostasAbertas } from "@/lib/propostasApi";
import type { PropostaCompleta, PropostaStatus } from "@/types/propostas";
import { getStatusPropostaLabel, getStatusPropostaColor } from "@/types/propostas";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { gerarPropostaPDF, type DadosBancariosNucleo } from "@/lib/propostaPdfUtils";
import { CORES_NUCLEOS, type Nucleo } from "@/constants/oportunidades";
import { Plus, Search, Filter, FileText, Eye, Pencil, Mail, Send, CheckCircle, Copy, Trash2, Clock, XCircle, FileCheck, MessageSquare, Link as LinkIcon, X, ExternalLink, Check, ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import Avatar from "@/components/common/Avatar";

export default function PropostasPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();
  const [propostas, setPropostas] = useState<PropostaCompleta[]>([]);
  const [propostasFiltradas, setPropostasFiltradas] = useState<PropostaCompleta[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<PropostaStatus | "todas">("todas");

  // Estado para modal de envio/compartilhamento
  const [showModalEnvio, setShowModalEnvio] = useState(false);
  const [linkGerado, setLinkGerado] = useState("");
  const [propostaEnvio, setPropostaEnvio] = useState<PropostaCompleta | null>(null);
  const [copiouLink, setCopiouLink] = useState(false);
  const [gerandoLink, setGerandoLink] = useState(false);

  // Estado para atualizaçÍo de preços em massa
  const [atualizandoPrecos, setAtualizandoPrecos] = useState(false);

  const handleAtualizarPrecos = async () => {
    if (!confirm(
      "Atualizar preços de todas as propostas em aberto?\n\n" +
      "Os itens vinculados ao pricelist terÍo o valor unitário atualizado " +
      "para o preço de venda atual. Propostas aprovadas/recusadas NÍO serÍo afetadas."
    )) return;

    setAtualizandoPrecos(true);
    try {
      const resultado = await atualizarPrecosPropostasAbertas();
      toast({ title: "Sucesso", description: `AtualizaçÍo concluída! ${resultado.propostas_atualizadas} proposta(s) atualizada(s), ${resultado.itens_atualizados} item(ns) com novo preço` + (resultado.erros > 0 ? `, ${resultado.erros} erro(s)` : "") });
      // Recarregar propostas
      carregarPropostas();
    } catch (err: any) {
      console.error("[PropostasPage] Erro ao atualizar preços:", err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao atualizar preços: " + (err.message || "Tente novamente") });
    } finally {
      setAtualizandoPrecos(false);
    }
  };

  // Helper para obter cor do núcleo
  const getCorNucleo = (nucleo: string | null | undefined): { primary: string; secondary: string; text: string; border: string; hover: string } => {
    const defaultCor = CORES_NUCLEOS.Arquitetura;

    if (!nucleo) return defaultCor;

    // Mapear string do banco para tipo Nucleo (capitalizar primeira letra)
    const nucleoKey = nucleo.charAt(0).toUpperCase() + nucleo.slice(1).toLowerCase();

    if (nucleoKey === "Arquitetura" || nucleoKey === "Engenharia" || nucleoKey === "Marcenaria") {
      return CORES_NUCLEOS[nucleoKey as Nucleo];
    }

    return defaultCor;
  };

  // Estado para controlar quais propostas têm contrato emitido
  const [propostasComContrato, setPropostasComContrato] = useState<Set<string>>(new Set());

  // Agrupamento por cliente (colapsável)
  const [clientesExpandidos, setClientesExpandidos] = useState<Set<string>>(new Set());

  // FunçÍo para carregar propostas
  const carregarPropostas = async () => {
    try {
      setLoading(true);
      const data = await listarPropostas();
      setPropostas(data);
      setPropostasFiltradas(data);

      // Buscar quais propostas já têm contrato emitido
      const propostaIds = data.map(p => p.id);
      if (propostaIds.length > 0) {
        const { data: contratos } = await supabase
          .from("contratos")
          .select("proposta_id")
          .in("proposta_id", propostaIds)
          .not("proposta_id", "is", null);

        if (contratos) {
          const idsComContrato = new Set(contratos.map(c => c.proposta_id).filter(Boolean) as string[]);
          setPropostasComContrato(idsComContrato);
        }
      }
    } catch (error) {
      console.error("Erro ao carregar propostas:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao carregar propostas" });
    } finally {
      setLoading(false);
    }
  };

  // Verificar se a proposta pode ser editada
  const podeEditar = (proposta: PropostaCompleta): boolean => {
    // Propostas rejeitadas ou canceladas nÍo podem ser editadas
    if (proposta.status === "rejeitada" || proposta.status === "cancelada") {
      return false;
    }
    // Se a proposta já tem contrato emitido, nÍo pode ser editada
    if (propostasComContrato.has(proposta.id)) {
      return false;
    }
    // Pode editar rascunho, enviada, em_revisao e aprovada (sem contrato)
    return true;
  };

  // Carregar propostas no mount e sempre que voltar para esta página
  useEffect(() => {
    carregarPropostas();
  }, [location.key]); // Recarrega toda vez que a navegaçÍo muda

  // Aplicar filtros
  useEffect(() => {
    let resultado = [...propostas];

    // Filtro por busca
    if (busca.trim()) {
        const buscaLower = normalizeSearchTerm(busca);
      resultado = resultado.filter(
        (p) =>
            normalizeSearchTerm(p.titulo || "").includes(buscaLower) ||
            normalizeSearchTerm(p.numero || "").includes(buscaLower) ||
            normalizeSearchTerm(p.cliente_nome || "").includes(buscaLower)
      );
    }

    // Filtro por status
    if (filtroStatus !== "todas") {
      resultado = resultado.filter((p) => p.status === filtroStatus);
    }

    setPropostasFiltradas(resultado);
  }, [busca, filtroStatus, propostas]);

  // Estatísticas
  const stats = {
    total: propostas.length,
    rascunho: propostas.filter((p) => p.status === "rascunho").length,
    enviada: propostas.filter((p) => p.status === "enviada").length,
    aprovada: propostas.filter((p) => p.status === "aprovada").length,
    rejeitada: propostas.filter((p) => p.status === "rejeitada").length,
    em_revisao: propostas.filter((p) => p.status === "em_revisao").length,
  };

  // Agrupar propostas por cliente
  const gruposPorCliente = (() => {
    const grupos: Record<string, { clienteId: string; clienteNome: string; clienteAvatar?: string | null; propostas: PropostaCompleta[]; totalValor: number }> = {};
    propostasFiltradas.forEach(p => {
      const key = p.cliente_id;
      if (!grupos[key]) {
        grupos[key] = {
          clienteId: key,
          clienteNome: p.cliente_nome || "Sem cliente",
          clienteAvatar: p.cliente_avatar_url,
          propostas: [],
          totalValor: 0,
        };
      }
      grupos[key].propostas.push(p);
      grupos[key].totalValor += p.valor_total || 0;
    });
    // Ordenar por nome do cliente, clientes com mais propostas primeiro
    return Object.values(grupos).sort((a, b) => {
      if (b.propostas.length !== a.propostas.length) return b.propostas.length - a.propostas.length;
      return (a.clienteNome || "").localeCompare(b.clienteNome || "");
    });
  })();

  const toggleCliente = (clienteId: string) => {
    setClientesExpandidos(prev => {
      const next = new Set(prev);
      if (next.has(clienteId)) {
        next.delete(clienteId);
      } else {
        next.add(clienteId);
      }
      return next;
    });
  };

  const expandirTodos = () => setClientesExpandidos(new Set(gruposPorCliente.map(g => g.clienteId)));
  const colapsarTodos = () => setClientesExpandidos(new Set());

  // Enviar proposta - gera token e abre modal de compartilhamento
  async function handleEnviarProposta(propostaId: string) {
    const proposta = propostas.find((p) => p.id === propostaId);
    if (!proposta) return;

    try {
      setGerandoLink(true);
      setPropostaEnvio(proposta);

      // Gerar token e obter link
      const resultado = await gerarTokenCompartilhamento(propostaId, { validadeDias: 30 });
      setLinkGerado(resultado.url);
      if (resultado.numero) {
        setPropostaEnvio((prev) => (prev ? { ...prev, numero: resultado.numero || prev.numero } : prev));
      }
      setCopiouLink(false);
      setShowModalEnvio(true);

      // Recarregar propostas (status mudou para enviada)
      const data = await listarPropostas();
      setPropostas(data);
    } catch (error) {
      console.error("Erro ao gerar link de compartilhamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao gerar link de compartilhamento" });
    } finally {
      setGerandoLink(false);
    }
  }

  // Copiar link para clipboard
  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkGerado);
      setCopiouLink(true);
      setTimeout(() => setCopiouLink(false), 3000);
    } catch {
      // Fallback para navegadores antigos
      const input = document.createElement("input");
      input.value = linkGerado;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiouLink(true);
      setTimeout(() => setCopiouLink(false), 3000);
    }
  }

  // Aprovar proposta
  async function aprovarProposta(propostaId: string) {
    if (!confirm("Deseja aprovar esta proposta e criar o contrato?")) return;

    try {
      const { error } = await supabase
        .from("propostas")
        .update({ status: "aprovada" })
        .eq("id", propostaId);

      if (error) throw error;

      toast({ title: "Sucesso", description: "Proposta aprovada com sucesso!" });

      // Recarregar propostas
      const data = await listarPropostas();
      setPropostas(data);
      setPropostasFiltradas(data);

      // Navegar para criaçÍo de contrato
      navigate(`/contratos/novo?proposta_id=${propostaId}`);
    } catch (error) {
      console.error("Erro ao aprovar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao aprovar proposta" });
    }
  }

  // Gerar PDF da proposta
  async function handleGerarPDF(propostaId: string) {
    try {
      setLoading(true);

      // Buscar proposta completa com itens
      const propostaCompleta = await buscarProposta(propostaId);

      const buscarDadosBancarios = async (nucleo?: string | null): Promise<DadosBancariosNucleo | null> => {
        if (!nucleo) return null;
        try {
          const { data, error } = await supabase
            .from("contas_bancarias")
            .select("banco, agencia, conta, tipo_conta, pix_chave, pix_tipo, nome, nucleo")
            .eq("ativo", true)
            .in("nucleo", [nucleo, "grupo"])
            .order("nucleo", { ascending: false });

          if (error) return null;
          const conta = (data || []).find((item) => item.nucleo === nucleo) || (data || [])[0];
          return conta || null;
        } catch (error) {
          console.warn("Falha ao carregar contas bancarias:", error);
          return null;
        }
      };

      const dadosBancarios = await buscarDadosBancarios(propostaCompleta.nucleo || null);

      // Gerar PDF
      await gerarPropostaPDF(propostaCompleta, dadosBancarios);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao gerar PDF da proposta" });
    } finally {
      setLoading(false);
    }
  }

  // Excluir proposta
  async function excluirProposta(propostaId: string, titulo: string) {
    if (!confirm(`Tem certeza que deseja excluir a proposta "${titulo}"?\n\nEsta açÍo nÍo pode ser desfeita.`)) {
      return;
    }

    try {
      setLoading(true);

      // Deletar itens da proposta primeiro (por causa da FK)
      const { error: erroItens } = await supabase
        .from("propostas_itens")
        .delete()
        .eq("proposta_id", propostaId);

      if (erroItens) throw erroItens;

      // Deletar proposta
      const { error: erroProposta } = await supabase
        .from("propostas")
        .delete()
        .eq("id", propostaId);

      if (erroProposta) throw erroProposta;

      toast({ title: "Sucesso", description: "Proposta excluída com sucesso!" });

      // Recarregar propostas
      const data = await listarPropostas();
      setPropostas(data);
      setPropostasFiltradas(data);
    } catch (error) {
      console.error("Erro ao excluir proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao excluir proposta" });
    } finally {
      setLoading(false);
    }
  }

  // Enviar por email (a partir do modal de envio)
  function enviarPorEmail() {
    if (!propostaEnvio || !linkGerado) return;

    const assunto = `Proposta Comercial ${propostaEnvio.numero || ""} - Grupo WG Almeida`;
    const corpo = `Prezado(a) ${propostaEnvio.cliente_nome},\n\nSua proposta comercial está pronta para visualizaçÍo.\n\nAcesse pelo link abaixo para visualizar, aprovar ou solicitar revisÍo:\n${linkGerado}\n\nAtenciosamente,\nGrupo WG Almeida`;

    globalThis.location.href = `mailto:?subject=${encodeURIComponent(assunto)}&body=${encodeURIComponent(corpo)}`;
  }

  // Enviar por WhatsApp (a partir do modal de envio)
  function enviarPorWhatsApp() {
    if (!propostaEnvio || !linkGerado) return;

    const mensagem = gerarMensagemPropostaWhatsApp(
      propostaEnvio.cliente_nome || "Cliente",
      propostaEnvio.numero || propostaEnvio.titulo,
      propostaEnvio.valor_total,
      linkGerado
    );

    globalThis.open(`https://wa.me/?text=${encodeURIComponent(mensagem)}`, "_blank");
  }

  // Reenviar proposta em_revisao
  async function handleReenviarProposta(propostaId: string) {
    const proposta = propostas.find((p) => p.id === propostaId);
    if (!proposta) return;

    try {
      setGerandoLink(true);
      setPropostaEnvio(proposta);

      // Verificar se já tem link válido
      const linkExistente = await obterLinkProposta(propostaId);

      if (linkExistente) {
        setLinkGerado(linkExistente);
        if (!proposta.numero) {
          const atualizado = await gerarTokenCompartilhamento(propostaId, { validadeDias: 30 });
          if (atualizado.numero) {
            setPropostaEnvio((prev) => (prev ? { ...prev, numero: atualizado.numero || prev.numero } : prev));
          }
        }
      } else {
        const resultado = await gerarTokenCompartilhamento(propostaId, { validadeDias: 30 });
        setLinkGerado(resultado.url);
        if (resultado.numero) {
          setPropostaEnvio((prev) => (prev ? { ...prev, numero: resultado.numero || prev.numero } : prev));
        }
      }

      // Atualizar status para enviada
      await supabase
        .from("propostas")
        .update({ status: "enviada", enviada_em: new Date().toISOString() })
        .eq("id", propostaId);

      setCopiouLink(false);
      setShowModalEnvio(true);

      // Recarregar propostas
      const data = await listarPropostas();
      setPropostas(data);
    } catch (error) {
      console.error("Erro ao reenviar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao reenviar proposta" });
    } finally {
      setGerandoLink(false);
    }
  }

  // Duplicar proposta
  async function handleDuplicarProposta(propostaId: string) {
    if (!confirm("Deseja duplicar esta proposta? Uma cópia será criada como rascunho.")) return;

    try {
      setLoading(true);
      const novaPropostaId = await duplicarProposta(propostaId);

      toast({ title: "Sucesso", description: "Proposta duplicada com sucesso!" });

      // Redirecionar para editar a nova proposta
      navigate(`/propostas/${novaPropostaId}/editar`);
    } catch (error) {
      console.error("Erro ao duplicar proposta:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar proposta" });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`min-h-screen bg-white ${LAYOUT.pageContainer} py-6 flex items-center justify-center`}>
        <div className="flex flex-col items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 border-3 border-[#F25C26] border-t-transparent rounded-full animate-spin" />
          <p className={TYPOGRAPHY.statLabel}>Carregando propostas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-white ${LAYOUT.pageContainer} py-4 sm:py-6`}>
      {/* Header */}
      <div className={LAYOUT.pageHeaderSpacing}>
        <div className={LAYOUT.pageHeader}>
          <div className={LAYOUT.pageTitleWrapper}>
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-xl flex items-center justify-center shadow-lg">
              <FileText className={TYPOGRAPHY.iconLarge + " text-white"} />
            </div>
            <div>
              <h1 className={TYPOGRAPHY.pageTitle}>Propostas Comerciais</h1>
              <p className={TYPOGRAPHY.pageSubtitle}>
                Gerencie suas propostas comerciais e crie contratos
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAtualizarPrecos}
              disabled={atualizandoPrecos}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 border border-[#E7DED2] bg-white text-[#5C5148] rounded-lg text-[12px] sm:text-[13px] font-normal hover:border-[#0ABAB5] hover:text-[#0ABAB5] disabled:opacity-50 transition-all"
              title="Atualizar preços das propostas em aberto com valores atuais do pricelist"
            >
              <RefreshCw className={`${TYPOGRAPHY.iconMedium} ${atualizandoPrecos ? "animate-spin" : ""}`} />
              <span className={LAYOUT.hideOnMobile}>{atualizandoPrecos ? "Atualizando..." : "Atualizar Preços"}</span>
            </button>
            <button
              onClick={() => navigate("/propostas/nova")}
              className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] text-white rounded-lg text-[12px] sm:text-[13px] font-normal hover:opacity-90 transition-all shadow-lg"
            >
              <Plus className={TYPOGRAPHY.iconMedium} />
              <span className={LAYOUT.hideOnMobile}>Nova Proposta</span>
              <span className={LAYOUT.showOnMobile}>Nova</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de Estatisticas */}
      <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-6 gap-2 sm:gap-3 mb-4 sm:mb-6">
        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-gray-100 rounded-md">
              <FileText className={TYPOGRAPHY.iconSmall + " text-gray-600"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.total}</span>
            <span className={TYPOGRAPHY.statLabel}>Total</span>
          </div>
        </div>

        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-gray-100 rounded-md">
              <Clock className={TYPOGRAPHY.iconSmall + " text-gray-500"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.rascunho}</span>
            <span className={TYPOGRAPHY.statLabel}>Rascunhos</span>
          </div>
        </div>

        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-blue-100 rounded-md">
              <Send className={TYPOGRAPHY.iconSmall + " text-blue-600"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.enviada}</span>
            <span className={TYPOGRAPHY.statLabel}>Enviadas</span>
          </div>
        </div>

        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-amber-100 rounded-md">
              <MessageSquare className={TYPOGRAPHY.iconSmall + " text-amber-600"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.em_revisao}</span>
            <span className={TYPOGRAPHY.statLabel}>Revisao</span>
          </div>
        </div>

        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-green-100 rounded-md">
              <CheckCircle className={TYPOGRAPHY.iconSmall + " text-green-600"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.aprovada}</span>
            <span className={TYPOGRAPHY.statLabel}>Aprovadas</span>
          </div>
        </div>

        <div className={`${LAYOUT.card} px-2 sm:px-3 py-2`}>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="p-1 sm:p-1.5 bg-red-100 rounded-md">
              <XCircle className={TYPOGRAPHY.iconSmall + " text-red-600"} />
            </div>
            <span className={TYPOGRAPHY.statNumber}>{stats.rejeitada}</span>
            <span className={TYPOGRAPHY.statLabel}>Rejeitadas</span>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className={`${LAYOUT.card} p-3 sm:p-4 mb-4 sm:mb-6`}>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
          {/* Busca */}
          <div className="flex-1 relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 ${TYPOGRAPHY.iconMedium} text-gray-400`} />
            <input
              type="text"
              placeholder="Buscar por titulo, numero ou cliente..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className={`w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent outline-none ${TYPOGRAPHY.bodySmall}`}
            />
          </div>

          {/* Filtro Status */}
          <div className="flex items-center gap-2">
            <Filter className={`${TYPOGRAPHY.iconMedium} text-gray-400 ${LAYOUT.hideOnMobile}`} />
            <select
              value={filtroStatus}
              onChange={(e) => setFiltroStatus(e.target.value as PropostaStatus | "todas")}
              className={`w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#F25C26] focus:border-transparent outline-none ${TYPOGRAPHY.bodySmall}`}
            >
              <option value="todas">Todos os Status</option>
              <option value="rascunho">Rascunho</option>
              <option value="enviada">Enviada</option>
              <option value="em_revisao">Em Revisao</option>
              <option value="aprovada">Aprovada</option>
              <option value="rejeitada">Rejeitada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Listagem agrupada por cliente */}
      {propostasFiltradas.length === 0 ? (
        <div className={`${LAYOUT.card} p-8 sm:p-12 text-center`}>
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-3 sm:mb-4" />
          <h3 className={`${TYPOGRAPHY.sectionTitle} mb-2`}>
            {busca || filtroStatus !== "todas" ? "Nenhuma proposta encontrada" : "Nenhuma proposta ainda"}
          </h3>
          <p className={`${TYPOGRAPHY.pageSubtitle} mb-4 sm:mb-6`}>
            {busca || filtroStatus !== "todas"
              ? "Tente ajustar os filtros de busca."
              : "Comece criando sua primeira proposta comercial."}
          </p>
          {!busca && filtroStatus === "todas" && (
            <button
              onClick={() => navigate("/propostas/nova")}
              className="inline-flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-primary text-white rounded-lg text-[12px] sm:text-[13px] font-normal hover:bg-primary/90 transition-all"
            >
              <Plus className={TYPOGRAPHY.iconMedium} />
              Criar Primeira Proposta
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {/* Botões expandir/colapsar */}
          {gruposPorCliente.length > 1 && (
            <div className="flex justify-end gap-2 mb-1">
              <button
                type="button"
                onClick={expandirTodos}
                className={`${TYPOGRAPHY.caption} text-gray-500 hover:text-[#F25C26] transition-colors`}
              >
                Expandir todos
              </button>
              <span className="text-gray-300">|</span>
              <button
                type="button"
                onClick={colapsarTodos}
                className={`${TYPOGRAPHY.caption} text-gray-500 hover:text-[#F25C26] transition-colors`}
              >
                Colapsar todos
              </button>
            </div>
          )}

          {gruposPorCliente.map((grupo) => {
            const isExpanded = clientesExpandidos.has(grupo.clienteId);
            const temMultiplas = grupo.propostas.length > 1;
            // Se só tem 1 proposta, mostra direto (sem accordion)
            const propostasVisiveis = temMultiplas && !isExpanded ? [] : grupo.propostas;

            return (
              <div key={grupo.clienteId} className="space-y-0">
                {/* Header do grupo (só se tem mais de 1 proposta) */}
                {temMultiplas && (
                  <button
                    type="button"
                    onClick={() => toggleCliente(grupo.clienteId)}
                    className={`w-full flex items-center gap-3 px-4 py-3 bg-white border border-gray-200 hover:bg-gray-50 transition-colors ${
                      isExpanded ? "rounded-t-xl border-b-0" : "rounded-xl"
                    }`}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Avatar
                      nome={grupo.clienteNome}
                      avatar_url={grupo.clienteAvatar}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 text-left min-w-0">
                      <span className={`${TYPOGRAPHY.cardTitle}`}>{grupo.clienteNome}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`${TYPOGRAPHY.badgeSmall} bg-gray-100 text-gray-600`}>
                        {grupo.propostas.length} proposta{grupo.propostas.length > 1 ? "s" : ""}
                      </span>
                      <span className={`${TYPOGRAPHY.cardSubtitle} font-mono`}>
                        {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(grupo.totalValor)}
                      </span>
                    </div>
                  </button>
                )}

                {/* Propostas do grupo */}
                <div className={temMultiplas && isExpanded ? "border border-gray-200 border-t-0 rounded-b-xl overflow-hidden" : ""}>
                  {(temMultiplas ? propostasVisiveis : grupo.propostas).map((proposta) => (
                  <div
                    key={proposta.id}
                    className={`${temMultiplas ? "bg-white border-t border-gray-100 p-3 sm:p-4 cursor-pointer hover:bg-gray-50 group" : `${LAYOUT.cardHover} p-3 sm:p-5 cursor-pointer group`}`}
                    onClick={() => navigate(`/propostas/${proposta.id}/visualizar`)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-0">
                      {/* Info Principal */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        {!temMultiplas && (
                          <Avatar
                            nome={proposta.cliente_nome || "Cliente"}
                            avatar_url={proposta.cliente_avatar_url}
                            size="lg"
                            className="flex-shrink-0"
                          />
                        )}

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                            <h3 className={`${TYPOGRAPHY.cardTitle} group-hover:text-[#F25C26] transition-colors`}>
                              {proposta.titulo}
                            </h3>
                            {proposta.numero && (
                              <span className={`${TYPOGRAPHY.caption} font-mono bg-gray-100 text-gray-600 px-1.5 sm:px-2 py-0.5 rounded`}>
                                {proposta.numero}
                              </span>
                            )}
                            <span
                              className={TYPOGRAPHY.badgeSmall}
                              style={{
                                backgroundColor: `${getStatusPropostaColor(proposta.status)}20`,
                                color: getStatusPropostaColor(proposta.status),
                              }}
                            >
                              {getStatusPropostaLabel(proposta.status)}
                            </span>
                          </div>

                          <p className={`${TYPOGRAPHY.cardSubtitle} mb-1 sm:mb-2`}>
                            {!temMultiplas && <span className="text-gray-900">{proposta.cliente_nome} - </span>}
                            <span className="text-gray-400">{new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(proposta.valor_total)}</span>
                          </p>

                          <div className={`flex items-center gap-3 sm:gap-4 ${TYPOGRAPHY.cardMeta}`}>
                            {proposta.prazo_execucao_dias && (
                              <span className="flex items-center gap-1">
                                <Clock className={TYPOGRAPHY.iconSmall} />
                                {proposta.prazo_execucao_dias} dias
                              </span>
                            )}
                            <span>{new Date(proposta.criado_em).toLocaleDateString("pt-BR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}</span>
                          </div>

                          {/* Feedback do cliente em revisÍo */}
                          {proposta.status === "em_revisao" && proposta.observacoes_cliente && (
                            <div className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                              <div className="flex items-start gap-1.5">
                                <MessageSquare className="w-3 h-3 text-amber-600 mt-0.5 flex-shrink-0" />
                                <p className={`${TYPOGRAPHY.caption} text-amber-800 line-clamp-2`}>
                                  {proposta.observacoes_cliente}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Acoes */}
                      <div className="flex flex-wrap items-center gap-1 sm:gap-2 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/propostas/${proposta.id}/visualizar`);
                          }}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-[#F25C26] hover:bg-primary/10 rounded-lg transition-all"
                          title="Visualizar"
                        >
                          <Eye className={TYPOGRAPHY.iconMedium} />
                        </button>

                        {podeEditar(proposta) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/propostas/${proposta.id}/editar`);
                            }}
                            className="p-1.5 sm:p-2 text-gray-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg transition-all"
                            title="Editar proposta"
                          >
                            <Pencil className={TYPOGRAPHY.iconMedium} />
                          </button>
                        )}

                        {proposta.status === "rascunho" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEnviarProposta(proposta.id);
                            }}
                            disabled={gerandoLink}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-primary text-white rounded-lg ${TYPOGRAPHY.cardMeta} font-normal flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-all disabled:opacity-50`}
                            title="Enviar proposta ao cliente"
                          >
                            <Send className={TYPOGRAPHY.iconSmall} />
                            <span className={LAYOUT.hideOnMobile}>Enviar</span>
                          </button>
                        )}

                        {proposta.status === "em_revisao" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleReenviarProposta(proposta.id);
                            }}
                            disabled={gerandoLink}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-amber-500 text-white rounded-lg ${TYPOGRAPHY.cardMeta} font-normal flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-all disabled:opacity-50`}
                            title="Reenviar proposta revisada"
                          >
                            <Send className={TYPOGRAPHY.iconSmall} />
                            <span className={LAYOUT.hideOnMobile}>Reenviar</span>
                          </button>
                        )}

                        {proposta.status === "enviada" && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              aprovarProposta(proposta.id);
                            }}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-green-600 text-white rounded-lg ${TYPOGRAPHY.cardMeta} font-normal flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-all`}
                            title="Aprovar proposta"
                          >
                            <CheckCircle className={TYPOGRAPHY.iconSmall} />
                            <span className={LAYOUT.hideOnMobile}>Aprovar</span>
                          </button>
                        )}

                        {proposta.status === "aprovada" && !propostasComContrato.has(proposta.id) && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/contratos/novo?proposta_id=${proposta.id}`);
                            }}
                            style={{ backgroundColor: getCorNucleo(proposta.nucleo).primary }}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 text-white rounded-lg ${TYPOGRAPHY.cardMeta} font-normal flex items-center gap-1 sm:gap-1.5 hover:opacity-90 transition-all`}
                            title="Emitir contrato"
                          >
                            <FileCheck className={TYPOGRAPHY.iconSmall} />
                            <span className={LAYOUT.hideOnMobile}>Emitir Contrato</span>
                          </button>
                        )}

                        {proposta.status === "aprovada" && propostasComContrato.has(proposta.id) && (
                          <span className={`px-2 sm:px-3 py-1 sm:py-1.5 bg-gray-400 text-white rounded-lg ${TYPOGRAPHY.cardMeta} font-normal flex items-center gap-1 sm:gap-1.5`}>
                            <CheckCircle className={TYPOGRAPHY.iconSmall} />
                            <span className={LAYOUT.hideOnMobile}>Contrato Emitido</span>
                          </span>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleGerarPDF(proposta.id);
                          }}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Gerar PDF"
                        >
                          <FileText className={TYPOGRAPHY.iconMedium} />
                        </button>

                        {(proposta.status === "enviada" || proposta.token_compartilhamento) && (
                          <button
                            type="button"
                            onClick={async (e) => {
                              e.stopPropagation();
                              const link = await obterLinkProposta(proposta.id);
                              if (link) {
                                setPropostaEnvio(proposta);
                                setLinkGerado(link);
                                setCopiouLink(false);
                                setShowModalEnvio(true);
                              } else {
                                handleEnviarProposta(proposta.id);
                              }
                            }}
                            className={`p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all ${LAYOUT.hideOnMobile}`}
                            title="Compartilhar link"
                          >
                            <LinkIcon className={TYPOGRAPHY.iconMedium} />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicarProposta(proposta.id);
                          }}
                          className={`p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all ${LAYOUT.hideOnMobile}`}
                          title="Duplicar proposta"
                        >
                          <Copy className={TYPOGRAPHY.iconMedium} />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            excluirProposta(proposta.id, proposta.titulo);
                          }}
                          className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                          title="Excluir"
                        >
                          <Trash2 className={TYPOGRAPHY.iconMedium} />
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Envio / Compartilhamento */}
      {showModalEnvio && propostaEnvio && linkGerado && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModalEnvio(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Send className="w-4 h-4 text-[#F25C26]" />
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>Enviar Proposta</h3>
                  <p className={TYPOGRAPHY.cardSubtitle}>{propostaEnvio.titulo}</p>
                </div>
              </div>
              <button type="button" onClick={() => setShowModalEnvio(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors" title="Fechar">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Conteudo */}
            <div className="p-4 sm:p-5 space-y-4">
              {/* Info da proposta */}
              <div className="flex items-center justify-between bg-gray-50 rounded-lg p-3">
                <div>
                  <p className={TYPOGRAPHY.cardTitle}>{propostaEnvio.cliente_nome}</p>
                  <p className={TYPOGRAPHY.caption}>{propostaEnvio.numero || "Sem numero"}</p>
                </div>
                <p className={TYPOGRAPHY.moneyMedium}>
                  {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(propostaEnvio.valor_total)}
                </p>
              </div>

              {/* Link copiavel */}
              <div>
                <label className={`${TYPOGRAPHY.formLabel} mb-1.5 block`}>Link de compartilhamento</label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 overflow-hidden">
                    <p className={`${TYPOGRAPHY.caption} text-gray-600 truncate font-mono`}>{linkGerado}</p>
                  </div>
                  <button
                    type="button"
                    onClick={copiarLink}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] sm:text-[12px] font-normal transition-all ${
                      copiouLink
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-primary text-white hover:opacity-90"
                    }`}
                  >
                    {copiouLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiouLink ? "Copiado!" : "Copiar"}
                  </button>
                </div>
                <p className={`${TYPOGRAPHY.caption} text-gray-400 mt-1`}>
                  Link valido por 30 dias. O cliente pode aprovar, recusar ou solicitar revisao.
                </p>
              </div>

              {/* Botoes de envio */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={enviarPorWhatsApp}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-lg text-[12px] sm:text-[13px] font-normal hover:bg-green-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Enviar por WhatsApp
                </button>

                <button
                  type="button"
                  onClick={enviarPorEmail}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[12px] sm:text-[13px] font-normal hover:bg-gray-200 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Enviar por Email
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className={`${TYPOGRAPHY.caption} text-gray-400 text-center`}>
                O cliente podera visualizar, aprovar ou solicitar revisao diretamente pelo link.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

