/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import { ArrowRight, Calendar, CheckCircle2, FileText, FolderOpen, Image as ImageIcon, Play, X, Eye, ChevronRight, Loader2, Download, FileImage, FileVideo, FileSpreadsheet, FileType, ArrowLeft, Home, Wrench, FileCheck, LogOut, User, Menu, Package, Truck, Phone, MessageSquare, Clock, AlertCircle, CheckSquare, FileSignature, Shield, Award, ClipboardList, Headphones, Send, DollarSign, CreditCard, TrendingUp, Receipt, Banknote, Target, Layers, Instagram, HelpCircle } from "lucide-react";
import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { useImpersonation, ImpersonationBar } from "@/hooks/useImpersonation";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import DashboardProgressoNucleo from "@/components/cliente/DashboardProgressoNucleo";
import OnboardingArquitetura from "@/components/cliente/OnboardingArquitetura";
import CronogramaCliente from "@/components/cliente/CronogramaCliente";
import AtividadesNucleo from "@/components/cliente/AtividadesNucleo";
import OrcamentosPendentesCliente from "@/components/cliente/OrcamentosPendentesCliente";
import { usePanoramaCliente } from "@/hooks/usePanoramaCliente";
import IntroAreaCliente from "@/components/area-cliente/IntroAreaCliente";
import WGStarIcon from "@/components/icons/WGStarIcon";

type Pessoa = {
  id: string;
  nome: string;
  email?: string | null;
  telefone?: string | null;
  avatar_url?: string | null;
  drive_link?: string | null;
};

type ClienteFoto = {
  id: string;
  createdTime?: string;
  mimeType?: string;
  thumbnailLink?: string;
  webContentLink?: string;
};

interface Ticket {
  id: string;
  cliente_id: string;
  titulo: string;
  categoria: string;
  descricao?: string;
  status: string;
  prioridade: string;
  created_at?: string;
  updated_at?: string;
}

interface TicketFormData {
  titulo: string;
  categoria: string;
  descricao: string;
}

interface Lancamento {
  id: string;
  descricao?: string;
  valor?: number;
  data_vencimento?: string;
  data_pagamento?: string | null;
  status?: string;
  tipo?: string;
  contrato_id?: string;
  cliente_id?: string;
  forma_pagamento?: string;
  parcela_numero?: number | null;
  parcela_total?: number | null;
  observacoes?: string;
  criado_em?: string;
}

interface ResumoLancamentos {
  total: number;
  pago: number;
  pendente: number;
  vencido: number;
}

interface AreaClienteFinanceiroRpc {
  financeiro?: {
    lancamentos?: Lancamento[];
    resumo?: {
      total_contratado?: number;
      total_pago?: number;
      total_pendente?: number;
    };
  };
}

// REMOVIDO: Fallbacks fixos - cada cliente deve ver apenas seus dados
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

// Normaliza lançamentos vindos de diferentes fontes (RPC ou tabelas)
function normalizarLancamentos(lista: Lancamento[]): Lancamento[] {
  const hoje = new Date().toISOString().split("T")[0];
  return (lista || []).map((item) => ({
    ...item,
    valor: Number(item.valor ?? 0),
    status: (item.status || "").toLowerCase(),
    data_vencimento: item.data_vencimento || hoje,
  }));
}

// Calcula totais básicos de lançamentos (total, pago, pendente, vencido)
function calcularResumoLancamentos(lista: Lancamento[]) {
  const resumo = { total: 0, pago: 0, pendente: 0, vencido: 0 };
  const hoje = new Date().getTime();

  (lista || []).forEach((item) => {
    const valor = Number(item.valor ?? 0);
    resumo.total += valor;

    const pago = item.status === "pago" || Boolean(item.data_pagamento);
    if (pago) {
      resumo.pago += valor;
    } else {
      resumo.pendente += valor;
      const venc = item.data_vencimento ? new Date(item.data_vencimento).getTime() : 0;
      if (venc && venc < hoje) {
        resumo.vencido += valor;
      }
    }
  });

  return resumo;
}

// FunçÍo para extrair ID de pasta do Google Drive a partir de um link
function extractDriveFolderId(driveLink: string | null | undefined): string | null {
  if (!driveLink) return null;
  // Padrões comuns de links do Drive:
  // https://drive.google.com/drive/folders/FOLDER_ID?...
  // https://drive.google.com/drive/u/0/folders/FOLDER_ID
  const match = driveLink.match(/folders\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

// FunçÍo para agrupar fotos por semana baseado na data de criaçÍo
function agruparFotosPorSemana(fotos: ClienteFoto[]): { semana: number; inicio: string; fim: string; fotos: ClienteFoto[] }[] {
  if (!fotos || fotos.length === 0) return [];

  // Ordenar fotos por data (mais antiga primeiro)
  const fotosOrdenadas = [...fotos].sort((a, b) => {
    const dateA = new Date(a.createdTime || 0).getTime();
    const dateB = new Date(b.createdTime || 0).getTime();
    return dateA - dateB;
  });

  if (fotosOrdenadas.length === 0) return [];

  // Pegar a data da primeira foto como referência
  const primeiraData = new Date(fotosOrdenadas[0].createdTime || Date.now());

  // Agrupar por semanas
  const semanas: Map<number, any[]> = new Map();

  fotosOrdenadas.forEach(foto => {
    const dataFoto = new Date(foto.createdTime || Date.now());
    const diffTime = dataFoto.getTime() - primeiraData.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const semanaNum = Math.floor(diffDays / 7) + 1;

    if (!semanas.has(semanaNum)) {
      semanas.set(semanaNum, []);
    }
    semanas.get(semanaNum)?.push(foto);
  });

  // Converter para array com informações de período
  return Array.from(semanas.entries()).map(([semanaNum, fotosDaSemana]) => {
    const datasOrdenadas = fotosDaSemana
      .map(f => new Date(f.createdTime || Date.now()))
      .sort((a, b) => a.getTime() - b.getTime());

    const inicio = datasOrdenadas[0].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    const fim = datasOrdenadas[datasOrdenadas.length - 1].toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

    return {
      semana: semanaNum,
      inicio,
      fim,
      fotos: fotosDaSemana
    };
  }).sort((a, b) => a.semana - b.semana);
}

// DADOS DINÂMICOS: onboardingSteps e journeyHighlights agora vêm do hook usePanoramaCliente
// REMOVIDO: approvalsQueue, timelineMilestones, referenceBoards - eram dados mockados
// REMOVIDO: folderStructure estático - agora usa pastasDoCliente dinâmico do Drive

// Menu items para navegaçÍo interna (tabs - sem reload de página)
const clienteMenuItems = [
  { id: "dashboard", label: "Meu Projeto", icon: Home },
  { id: "financeiro", label: "Financeiro", icon: DollarSign },
  { id: "pos-vendas", label: "Pós Vendas", icon: Package },
  { id: "assistencia", label: "Assistência", icon: Headphones },
  { id: "termos", label: "Termos de Aceite", icon: FileSignature },
  { id: "garantia", label: "Garantia", icon: Shield },
];

// =============================================
// COMPONENTES INLINE PARA CADA MÓDULO (TAB)
// =============================================

// Componente: Pós Vendas
function TabPosVendas({ clienteNome, clienteId }: { clienteNome: string; clienteId: string | null }) {
  const [subTab, setSubTab] = useState<"entregas" | "historico" | "avaliacoes">("entregas");

  const entregas = [
    { id: 1, item: "Projeto Executivo Arquitetônico", status: "entregue", data: "10/12/2024", nucleo: "Arquitetura" },
    { id: 2, item: "Memorial Descritivo de Acabamentos", status: "entregue", data: "08/12/2024", nucleo: "Arquitetura" },
    { id: 3, item: "Projeto Luminotécnico", status: "pendente", data: "15/12/2024", nucleo: "Arquitetura" },
    { id: 4, item: "Marcenaria - Módulo Cozinha", status: "em_producao", data: "20/12/2024", nucleo: "Marcenaria" },
    { id: 5, item: "Instalações Elétricas", status: "agendado", data: "22/12/2024", nucleo: "Engenharia" },
  ];

  const historico = [
    { data: "10/12/2024", acao: "Projeto Executivo enviado para aprovaçÍo", usuario: "Ana Paula - WG Arquitetura" },
    { data: "08/12/2024", acao: "Memorial Descritivo finalizado", usuario: "Carlos - WG Arquitetura" },
    { data: "05/12/2024", acao: "ReuniÍo de alinhamento realizada", usuario: "Equipe WG" },
    { data: "01/12/2024", acao: "Contrato assinado e projeto iniciado", usuario: "Sistema" },
  ];

  const statusColors: Record<string, string> = {
    entregue: "bg-green-100 text-green-700",
    pendente: "bg-yellow-100 text-yellow-700",
    em_producao: "bg-blue-100 text-blue-700",
    agendado: "bg-purple-100 text-purple-700",
  };

  const statusLabels: Record<string, string> = {
    entregue: "Entregue",
    pendente: "Pendente",
    em_producao: "Em ProduçÍo",
    agendado: "Agendado",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-normal text-gray-900">Pós Vendas</h2>
          <p className="text-sm text-gray-500">Acompanhe suas entregas e histórico do projeto</p>
        </div>
        <div className="flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium">
          <Package className="w-4 h-4" />
          5 entregas
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {[
          { id: "entregas", label: "Entregas", icon: Truck },
          { id: "historico", label: "Histórico", icon: Clock },
          { id: "avaliacoes", label: "Avaliações", icon: WGStarIcon },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id as typeof subTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              subTab === tab.id
                ? "border-orange-500 text-orange-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Conteúdo das sub-tabs */}
      {subTab === "entregas" && (
        <div className="space-y-3">
          {entregas.map((entrega) => (
            <div key={entrega.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Package className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{entrega.item}</p>
                  <p className="text-xs text-gray-500">{entrega.nucleo} · {entrega.data}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[entrega.status]}`}>
                {statusLabels[entrega.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {subTab === "historico" && (
        <div className="space-y-4">
          {historico.map((item, idx) => (
            <div key={idx} className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100">
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                {idx < historico.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-2" />}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{item.acao}</p>
                <p className="text-xs text-gray-500">{item.data} · {item.usuario}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === "avaliacoes" && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6 text-center">
            <WGStarIcon className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h3 className="text-[20px] font-normal text-gray-900 mb-2">Avalie sua experiência</h3>
            <p className="text-sm text-gray-600 mb-4">Sua opiniÍo é muito importante para continuarmos melhorando!</p>
            <div className="flex justify-center gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button key={star} className="p-2 hover:scale-110 transition">
                  <WGStarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400 hover:fill-yellow-400" />
                </button>
              ))}
            </div>
            <textarea
              placeholder="Deixe seu comentário..."
              className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none"
              rows={3}
            />
            <button className="mt-3 px-6 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition">
              Enviar AvaliaçÍo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente: Assistência Técnica
function TabAssistencia({ clienteNome, clienteId }: { clienteNome: string; clienteId: string | null }) {
  const { toast } = useToast();
  const [novoTicket, setNovoTicket] = useState(false);
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [formData, setFormData] = useState<TicketFormData>({
    titulo: "",
    categoria: "",
    descricao: "",
  });

  const statusColors: Record<string, string> = {
    aberto: "bg-yellow-100 text-yellow-700",
    em_andamento: "bg-blue-100 text-blue-700",
    resolvido: "bg-green-100 text-green-700",
    pendente: "bg-yellow-100 text-yellow-700",
    concluido: "bg-green-100 text-green-700",
  };

  // Carregar tickets do banco de dados
  useEffect(() => {
    const carregarTickets = async () => {
      if (!clienteId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('assistencia_tecnica')
          .select('*')
          .eq('cliente_id', clienteId)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao carregar tickets:', error);
          setTickets([]);
        } else {
          setTickets(data || []);
        }
      } catch (err) {
        console.error('Erro ao carregar tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    carregarTickets();
  }, [clienteId]);

  // Enviar novo ticket
  const handleEnviar = async () => {
    if (!clienteId || !formData.titulo.trim() || !formData.categoria) {
      toast({ variant: "destructive", title: "Campo obrigatório", description: "Preencha todos os campos obrigatórios" });
      return;
    }

    try {
      setEnviando(true);

      // Criar ticket no banco
      const { data: novoTicketData, error: insertError } = await supabase
        .from('assistencia_tecnica')
        .insert({
          cliente_id: clienteId,
          titulo: formData.titulo.trim(),
          categoria: formData.categoria,
          descricao: formData.descricao.trim(),
          status: 'aberto',
          prioridade: 'normal',
        })
        .select()
        .single();

      if (insertError || !novoTicketData) {
        console.error('Erro ao criar ticket:', insertError);
        toast({ variant: "destructive", title: "Erro", description: "Erro ao enviar solicitaçÍo. Tente novamente." });
        return;
      }

      // Criar notificaçÍo para a equipe
      try {
        await supabase.from('notificacoes_sistema').insert({
          tipo: 'assistencia_tecnica',
          titulo: 'Nova solicitaçÍo de assistência técnica',
          mensagem: `${clienteNome} abriu uma solicitaçÍo: ${formData.titulo} (${formData.categoria})`,
          url_acao: '/assistencia',
          texto_acao: 'Ver SolicitaçÍo',
          lida: false
        });
      } catch (notifError) {
        console.warn('Erro ao criar notificaçÍo (nÍo crítico):', notifError);
      }

      // Atualizar lista e fechar formulário
      setTickets(prev => [novoTicketData, ...prev]);
      setFormData({ titulo: '', categoria: '', descricao: '' });
      setNovoTicket(false);
      toast({ title: "Sucesso", description: "SolicitaçÍo enviada com sucesso! Nossa equipe entrará em contato em breve." });

    } catch (err) {
      console.error('Erro ao enviar ticket:', err);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao enviar solicitaçÍo. Tente novamente." });
    } finally {
      setEnviando(false);
    }
  };

  const formatarData = (data: string) => {
    if (!data) return '-';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-normal text-gray-900">Assistência Técnica</h2>
          <p className="text-sm text-gray-500">Abra chamados e acompanhe suas solicitações</p>
        </div>
        <button
          type="button"
          onClick={() => setNovoTicket(!novoTicket)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-full text-sm font-medium hover:bg-orange-600 transition"
        >
          <MessageSquare className="w-4 h-4" />
          Nova SolicitaçÍo
        </button>
      </div>

      {novoTicket && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
          <h3 className="font-normal text-gray-900">Abrir Nova SolicitaçÍo</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Título da solicitaçÍo *"
              value={formData.titulo}
              onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            />
            <select
              value={formData.categoria}
              onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
            >
              <option value="">Selecione a categoria *</option>
              <option value="Marcenaria">Marcenaria</option>
              <option value="Elétrica">Elétrica</option>
              <option value="Hidráulica">Hidráulica</option>
              <option value="Pintura">Pintura</option>
              <option value="Gesso">Gesso</option>
              <option value="Piso">Piso</option>
              <option value="Outros">Outros</option>
            </select>
            <textarea
              placeholder="Descreva o problema em detalhes..."
              value={formData.descricao}
              onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm resize-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              rows={4}
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleEnviar}
                disabled={enviando || !formData.titulo.trim() || !formData.categoria}
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-xl text-sm font-medium hover:bg-orange-600 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {enviando ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Enviar
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setNovoTicket(false);
                  setFormData({ titulo: '', categoria: '', descricao: '' });
                }}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wider">Minhas Solicitações</h3>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Carregando...</span>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-2xl">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhuma solicitaçÍo encontrada</p>
            <p className="text-xs text-gray-400 mt-1">Clique em "Nova SolicitaçÍo" para abrir um chamado</p>
          </div>
        ) : (
          tickets.map((ticket) => (
            <div key={ticket.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  ticket.status === "resolvido" || ticket.status === "concluido" ? "bg-green-100" : "bg-orange-100"
                }`}>
                  {ticket.status === "resolvido" || ticket.status === "concluido" ? (
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  ) : (
                    <Wrench className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{ticket.titulo}</p>
                  <p className="text-xs text-gray-500">
                    {ticket.categoria} · {formatarData(ticket.created_at || "")}
                  </p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[ticket.status] || statusColors.aberto}`}>
                {ticket.status === "aberto" ? "Aberto" :
                 ticket.status === "em_andamento" ? "Em Andamento" :
                 ticket.status === "resolvido" || ticket.status === "concluido" ? "Resolvido" :
                 ticket.status === "pendente" ? "Pendente" : ticket.status}
              </span>
            </div>
          ))
        )}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-normal text-gray-900 mb-3">Contato Direto</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <a href="tel:+5511999999999" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
            <Phone className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-gray-700">(11) 99999-9999</span>
          </a>
          <a href="https://wa.me/5511999999999" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 hover:shadow-md transition">
            <MessageSquare className="w-5 h-5 text-green-500" />
            <span className="text-sm text-gray-700">WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}

// Componente: Termos de Aceite
function TabTermos({ clienteNome }: { clienteNome: string }) {
  const documentos = [
    { id: 1, titulo: "Termo de Aceite - Projeto Arquitetônico", status: "assinado", data: "05/12/2024", tipo: "projeto" },
    { id: 2, titulo: "Termo de Aceite - Memorial Descritivo", status: "pendente", data: "-", tipo: "memorial" },
    { id: 3, titulo: "Termo de Aceite - Marcenaria", status: "pendente", data: "-", tipo: "marcenaria" },
    { id: 4, titulo: "Termo de Aceite - Obra Civil", status: "pendente", data: "-", tipo: "obra" },
    { id: 5, titulo: "Termo de Entrega Final", status: "pendente", data: "-", tipo: "entrega" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-normal text-gray-900">Termos de Aceite</h2>
          <p className="text-sm text-gray-500">Documentos que precisam da sua aprovaçÍo</p>
        </div>
        <div className="flex items-center gap-2 bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-medium">
          <AlertCircle className="w-4 h-4" />
          4 pendentes
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
            <FileSignature className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h3 className="font-normal text-gray-900 mb-1">Como funciona?</h3>
            <p className="text-sm text-gray-600">
              Os termos de aceite sÍo documentos que formalizam a aprovaçÍo de cada etapa do seu projeto.
              Ao assinar, você confirma que revisou e está de acordo com o que foi entregue.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {documentos.map((doc) => (
          <div key={doc.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition">
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                doc.status === "assinado" ? "bg-green-100" : "bg-gray-100"
              }`}>
                {doc.status === "assinado" ? (
                  <CheckSquare className="w-5 h-5 text-green-600" />
                ) : (
                  <FileCheck className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-gray-900">{doc.titulo}</p>
                <p className="text-xs text-gray-500">
                  {doc.status === "assinado" ? `Assinado em ${doc.data}` : "Aguardando assinatura"}
                </p>
              </div>
            </div>
            {doc.status === "assinado" ? (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                ✓ Assinado
              </span>
            ) : (
              <button className="px-4 py-2 bg-orange-500 text-white rounded-full text-xs font-medium hover:bg-orange-600 transition">
                Assinar
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Componente: Financeiro - Lançamentos de Pagamento do Cliente
function TabFinanceiro({ clienteNome, clienteId }: { clienteNome: string; clienteId: string | null }) {
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<ResumoLancamentos>({ total: 0, pago: 0, pendente: 0, vencido: 0 });

  useEffect(() => {
    const carregarLancamentos = async () => {
      if (!clienteId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const { data: rpcDataRaw, error: rpcError } = await supabase.rpc(
          "buscar_dados_area_cliente",
          { p_cliente_id: clienteId }
        );

        const rpcData = rpcDataRaw as AreaClienteFinanceiroRpc | null;

        const lancamentosRPC = rpcData?.financeiro?.lancamentos || [];
        if (!rpcError && lancamentosRPC.length > 0) {
          const normalizados = normalizarLancamentos(lancamentosRPC);
          setLancamentos(normalizados);
          const resumoRpc = rpcData?.financeiro?.resumo;
          const calculado = calcularResumoLancamentos(normalizados);
          setResumo({
            total: resumoRpc?.total_contratado ?? calculado.total,
            pago: resumoRpc?.total_pago ?? calculado.pago,
            pendente: resumoRpc?.total_pendente ?? calculado.pendente,
            vencido: calculado.vencido,
          });
          setLoading(false);
          return;
        }

        if (import.meta.env.DEV) console.log("RPC financeiro nÍo disponível, tentando queries diretas...");

        const { data: lancamentosContratos, error: errorContratos } = await supabase
          .from("lancamentos_financeiros")
          .select(`
            id,
            descricao,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            tipo,
            contrato_id,
            contratos!inner(cliente_id, numero)
          `)
          .eq("contratos.cliente_id", clienteId)
          .eq("tipo", "receita")
          .order("data_vencimento", { ascending: true });

        if (!errorContratos && lancamentosContratos && lancamentosContratos.length > 0) {
          const normalizados = normalizarLancamentos(lancamentosContratos);
          setLancamentos(normalizados);
          setResumo(calcularResumoLancamentos(normalizados));
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("financeiro_lancamentos")
          .select(`
            id,
            descricao,
            valor,
            data_vencimento,
            data_pagamento,
            status,
            forma_pagamento,
            parcela_numero,
            parcela_total,
            observacoes,
            criado_em
          `)
          .eq("pessoa_id", clienteId)
          .eq("tipo", "RECEBER")
          .order("data_vencimento", { ascending: true });

        if (!error && data && data.length > 0) {
          const normalizados = normalizarLancamentos(data);
          setLancamentos(normalizados);
          setResumo(calcularResumoLancamentos(normalizados));
        } else {
          setLancamentos([]);
          setResumo({ total: 0, pago: 0, pendente: 0, vencido: 0 });
        }
      } catch (err) {
        console.error("Erro ao carregar lançamentos:", err);
        setLancamentos([]);
        setResumo({ total: 0, pago: 0, pendente: 0, vencido: 0 });
      } finally {
        setLoading(false);
      }
    };

    carregarLancamentos();
  }, [clienteId]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
  };

  const formatarData = (data: string) => {
    if (!data) return "-";
    return new Date(data + "T00:00:00").toLocaleDateString("pt-BR");
  };

  const getStatusInfo = (status: string, dataVencimento: string) => {
    const hoje = new Date().toISOString().split("T")[0];
    if (status === "PAGO") {
      return { label: "Pago", cor: "bg-green-100 text-green-700", icone: CheckCircle2 };
    }
    if (status === "PENDENTE" && dataVencimento < hoje) {
      return { label: "Vencido", cor: "bg-red-100 text-red-700", icone: AlertCircle };
    }
    return { label: "Pendente", cor: "bg-yellow-100 text-yellow-700", icone: Clock };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-normal text-gray-900">Financeiro</h2>
          <p className="text-sm text-gray-500">Acompanhe seus pagamentos e parcelas</p>
        </div>
        <div className="flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
          <DollarSign className="w-4 h-4" />
          {lancamentos.length} lançamentos
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Total Contrato</p>
              <p className="text-[20px] font-normal text-gray-900">{formatarMoeda(resumo.total)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Pago</p>
              <p className="text-[20px] font-normal text-green-600">{formatarMoeda(resumo.pago)}</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">A Pagar</p>
              <p className="text-[20px] font-normal text-yellow-600">{formatarMoeda(resumo.pendente)}</p>
            </div>
          </div>
        </div>

        {resumo.vencido > 0 && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-red-600 uppercase tracking-wider">Vencido</p>
                <p className="text-[20px] font-normal text-red-600">{formatarMoeda(resumo.vencido)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-normal text-gray-700">Progresso de Pagamento</h3>
          <span className="text-sm text-gray-500">
            {resumo.total > 0 ? Math.round((resumo.pago / resumo.total) * 100) : 0}% quitado
          </span>
        </div>
        <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500"
            style={{ width: resumo.total > 0 ? `${(resumo.pago / resumo.total) * 100}%` : "0%" }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          <span>Pago: {formatarMoeda(resumo.pago)}</span>
          <span>Restante: {formatarMoeda(resumo.pendente)}</span>
        </div>
      </div>

      {/* Lista de Lançamentos */}
      <div className="space-y-3">
        <h3 className="text-sm font-normal text-gray-700 uppercase tracking-wider">Parcelas e Pagamentos</h3>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            <span className="ml-2 text-sm text-gray-500">Carregando lançamentos...</span>
          </div>
        ) : lancamentos.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <Banknote className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Nenhum lançamento encontrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {lancamentos.map((lancamento) => {
              const statusInfo = getStatusInfo(lancamento.status || "PENDENTE", lancamento.data_vencimento || "");
              const StatusIcon = statusInfo.icone;

              return (
                <div
                  key={lancamento.id}
                  className={`flex items-center justify-between p-4 bg-white rounded-xl border ${
                    lancamento.status === "PAGO" ? "border-green-100" : "border-gray-100"
                  } hover:shadow-md transition`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      lancamento.status === "PAGO" ? "bg-green-100" : "bg-gray-100"
                    }`}>
                      {lancamento.status === "PAGO" ? (
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                      ) : (
                        <CreditCard className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{lancamento.descricao}</p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                        <span>Vencimento: {formatarData(lancamento.data_vencimento || "")}</span>
                        {lancamento.forma_pagamento && (
                          <span className="px-2 py-0.5 bg-gray-100 rounded-full">{lancamento.forma_pagamento}</span>
                        )}
                      </div>
                      {lancamento.status === "PAGO" && lancamento.data_pagamento && (
                        <p className="text-xs text-green-600 mt-1">
                          Pago em {formatarData(lancamento.data_pagamento)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-normal ${
                      lancamento.status === "PAGO" ? "text-green-600" : "text-gray-900"
                    }`}>
                      {formatarMoeda(lancamento.valor || 0)}
                    </p>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.cor}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Informações de Contato */}
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
            <Phone className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-normal text-gray-900 mb-1">Dúvidas sobre pagamentos?</h3>
            <p className="text-sm text-gray-600 mb-3">
              Entre em contato com nossa equipe financeira para esclarecimentos ou renegociações.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href="https://wa.me/5511999999999"
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-full text-sm font-medium hover:bg-emerald-600 transition"
              >
                <MessageSquare className="w-4 h-4" />
                WhatsApp Financeiro
              </a>
              <a
                href="mailto:financeiro@wgalmeida.com.br"
                className="inline-flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition"
              >
                Email
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente: Garantia
function TabGarantia({ clienteNome }: { clienteNome: string }) {
  const garantias = [
    { categoria: "Marcenaria", prazo: "5 anos", itens: ["Portas", "Gavetas", "Estrutura"], icone: Package },
    { categoria: "Elétrica", prazo: "2 anos", itens: ["Tomadas", "Interruptores", "FiaçÍo"], icone: AlertCircle },
    { categoria: "Hidráulica", prazo: "5 anos", itens: ["tubulação", "Registros", "Conexões"], icone: Wrench },
    { categoria: "Pintura", prazo: "1 ano", itens: ["Paredes internas", "Teto", "Rodapés"], icone: ImageIcon },
    { categoria: "Obra Civil", prazo: "5 anos", itens: ["Estrutura", "Alvenaria", "ImpermeabilizaçÍo"], icone: Home },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[20px] font-normal text-gray-900">Certificado de Garantia</h2>
          <p className="text-sm text-gray-500">Conheça as coberturas do seu projeto WG</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
          <Download className="w-4 h-4" />
          Baixar PDF
        </button>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
            <Award className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h3 className="text-[20px] font-normal text-gray-900">Garantia WG Almeida</h3>
            <p className="text-sm text-gray-600">Seu projeto está protegido pela garantia WG</p>
            <p className="text-xs text-gray-500 mt-1">Válido até: Dezembro de 2029</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {garantias.map((garantia) => (
          <div key={garantia.categoria} className="bg-white rounded-xl border border-gray-100 p-5 hover:shadow-md transition">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                <garantia.icone className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <h4 className="font-normal text-gray-900">{garantia.categoria}</h4>
                <span className="text-xs text-orange-600 font-medium">{garantia.prazo}</span>
              </div>
            </div>
            <ul className="space-y-1">
              {garantia.itens.map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="bg-gray-50 rounded-2xl p-6">
        <h3 className="font-normal text-gray-900 mb-3 flex items-center gap-2">
          <ClipboardList className="w-5 h-5" />
          Condições Gerais
        </h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li>• A garantia cobre defeitos de fabricaçÍo e instalaçÍo</li>
          <li>• NÍo cobre mau uso, desgaste natural ou modificações nÍo autorizadas</li>
          <li>• Para acionar a garantia, abra uma solicitaçÍo na aba "Assistência"</li>
          <li>• Guarde as notas fiscais e este certificado</li>
        </ul>
      </div>
    </div>
  );
}

// Gera senha dinâmica baseada no cliente: primeiras 3 letras do nome + últimos 4 dígitos do telefone
const gerarSenhaCliente = (nome: string, telefone?: string | null): string => {
  const nomeClean = nome.replace(/[^a-zA-Z]/g, "").toLowerCase();
  const prefixo = nomeClean.substring(0, 3) || "wg";
  const telefoneDigitos = (telefone || "").replace(/\D/g, "");
  const sufixo = telefoneDigitos.slice(-4) || "2025";
  return `${prefixo}${sufixo}`;
};

export default function AreaClientePage() {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clienteId: pathClienteId } = useParams<{ clienteId: string }>();

  // Hook de impersonaçÍo para acesso MASTER/ADMIN
  const {
    isImpersonating,
    impersonatedUser,
    canImpersonate,
    stopImpersonation,
    loading: impersonationLoading,
  } = useImpersonation();

  const [cliente, setCliente] = useState<Pessoa | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  // Estado para navegaçÍo por tabs (SPA - sem reload)
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [driveLink, setDriveLink] = useState<string | null>(null);
  const [driveFolderId, setDriveFolderId] = useState<string | null>(null);
  const [uploadQueue, setUploadQueue] = useState<string[]>([]);
  const [loadingCliente, setLoadingCliente] = useState(true);
  const [loadingDriveFotos, setLoadingDriveFotos] = useState(false);
  const [driveFotos, setDriveFotos] = useState<
    { id: string; name: string; image: string; title: string; description: string; createdTime: string; viewLink: string; mimeType?: string }[]
  >([]);
  const [fotosPorSemana, setFotosPorSemana] = useState<{ semana: number; inicio: string; fim: string; fotos: any[] }[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [clienteNaoEncontrado, setClienteNaoEncontrado] = useState(false);

  // Estado para verificar se cliente tem contratos (define acesso à área completa)
  const [temContrato, setTemContrato] = useState<boolean | null>(null);
  const [oportunidadeInfo, setOportunidadeInfo] = useState<{
    titulo: string;
    estagio: string;
    valor: number | null;
    responsavelNome: string | null;
    responsavelTelefone: string | null;
    nucleos: string[];
    created_at: string | null;
  } | null>(null);

  // Estados para tela de intro e login
  const [showIntro, setShowIntro] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginSenha, setLoginSenha] = useState("");
  const [loginErro, setLoginErro] = useState("");
  const [autenticado, setAutenticado] = useState(false);
  const [clienteParaLogin, setClienteParaLogin] = useState<Pessoa | null>(null);

  // States para visualizador de pastas
  const [pastaAberta, setPastaAberta] = useState<{ grupo: string; pasta: string; folderId?: string } | null>(null);
  const [arquivosDaPasta, setArquivosDaPasta] = useState<any[]>([]);
  const [carregandoArquivos, setCarregandoArquivos] = useState(false);
  const [erroArquivos, setErroArquivos] = useState<string | null>(null);

  // States para estrutura de pastas dinâmica do Drive
  const [pastasDoCliente, setPastasDoCliente] = useState<{ title: string; rows: { name: string; id: string }[] }[]>([]);
  const [carregandoPastas, setCarregandoPastas] = useState(false);

  // State para visualizador de PDF
  const [pdfParaVisualizar, setPdfParaVisualizar] = useState<{ url: string; nome: string } | null>(null);

  // Hook para dados dinâmicos do panorama do cliente
  const { data: panorama, loading: loadingPanorama } = usePanoramaCliente(cliente?.id);

  // Dados dinâmicos do panorama formatados para exibiçÍo
  const journeyHighlights = useMemo(() => {
    if (!panorama) return [];
    return [
      {
        label: "Contratos ativos",
        value: String(panorama.contratosAtivos).padStart(2, '0'),
        detail: panorama.prazoEstimadoSemanas > 0
          ? `Prazo estimado: ${panorama.prazoEstimadoSemanas} semanas`
          : "Prazo a definir"
      },
      {
        label: "Projetos em produçÍo",
        value: String(panorama.projetosEmProducao).padStart(2, '0'),
        detail: panorama.nucleosAtivos.length > 0
          ? panorama.nucleosAtivos.join(' · ')
          : "Aguardando início"
      },
      {
        label: "Solicitações respondidas",
        value: String(panorama.solicitacoesRespondidas).padStart(2, '0'),
        detail: panorama.ultimaRespostaData
          ? `Última resposta em ${panorama.ultimaRespostaData}`
          : "Nenhuma resposta ainda"
      },
      {
        label: "Aprovações pendentes",
        value: String(panorama.aprovacoesPendentes).padStart(2, '0'),
        detail: panorama.aprovacoesPendentesItens.length > 0
          ? panorama.aprovacoesPendentesItens.slice(0, 2).join(' e ')
          : "Nenhuma pendência"
      },
    ];
  }, [panorama]);

  // Onboarding steps dinâmicos
  const onboardingSteps = useMemo(() => {
    if (!panorama) return [
      { title: "Bem-vindo ao WG Easy", description: "ApresentaçÍo institucional, canais de suporte e definiçÍo dos pontos de contato.", status: "upcoming" as const },
      { title: "Kick-off do Projeto", description: "Alinhamento de objetivos, escopo contratado e integrações necessárias.", status: "upcoming" as const },
      { title: "Onboarding Financeiro", description: "Entrega de documentaçÍo, agenda de faturamento e combinaçÍo de aprovações.", status: "upcoming" as const },
      { title: "Primeira entrega de valor", description: "DisponibilizaçÍo das referências e cronograma executivo na área do cliente.", status: "upcoming" as const },
    ];
    return panorama.onboardingStatus.map(step => ({
      title: step.titulo,
      description: step.descricao,
      status: step.status,
    }));
  }, [panorama]);

  const statusStyles = useMemo(
    () => ({
      completed: "border-green-200 bg-green-50 text-emerald-700",
      current: "border-orange-300 bg-white text-orange-700 shadow-sm",
      upcoming: "border-gray-200 bg-white text-gray-500",
    }),
    []
  );

  const carregarCliente = useCallback(async () => {
    if (impersonationLoading) return;

    try {
      setLoadingCliente(true);
      setClienteNaoEncontrado(false);

      let clienteId: string | null = null;
      let precisaLogin = false;

      if (isImpersonating && impersonatedUser) {
        clienteId = impersonatedUser.id;
        precisaLogin = false;
        setAutenticado(true);
        if (import.meta.env.DEV) console.log("Carregando cliente via IMPERSONAÇÍO MASTER:", clienteId, impersonatedUser.nome);
      } else if (canImpersonate && (pathClienteId || searchParams.get("cliente_id"))) {
        clienteId = pathClienteId || searchParams.get("cliente_id");
        precisaLogin = false;
        setAutenticado(true);
        if (import.meta.env.DEV) console.log("Carregando cliente via ACESSO MASTER:", clienteId);
      } else if (pathClienteId) {
        clienteId = pathClienteId;
        precisaLogin = true;
        if (import.meta.env.DEV) console.log("Carregando cliente via PATH:", clienteId);
      }

      const urlClienteId = searchParams.get("cliente_id") || searchParams.get("id");
      const urlEmail = searchParams.get("email") || "";
      const urlSenha = searchParams.get("senha") || "";

      if (!clienteId && urlClienteId) {
        clienteId = urlClienteId;
        precisaLogin = true;
        if (import.meta.env.DEV) console.log("Carregando cliente via URL query:", clienteId);
      }

      if (!clienteId) {
        const { data: authData } = await supabase.auth.getUser();

        if (authData?.user) {
          const { data: usuarioData } = await supabase
            .from("usuarios")
            .select("pessoa_id")
            .eq("auth_user_id", authData.user.id)
            .maybeSingle();

          if (usuarioData?.pessoa_id) {
            clienteId = usuarioData.pessoa_id;
            precisaLogin = false;
            setAutenticado(true);
            if (import.meta.env.DEV) console.log("Carregando cliente via autenticaçÍo:", clienteId);
          }
        }
      }

      if (!clienteId) {
        console.warn("Nenhum cliente identificado - usuário deve estar logado");
        setClienteNaoEncontrado(true);
        setLoadingCliente(false);
        return;
      }

      const { data: clienteData, error: rpcError } = await supabase
        .rpc("buscar_cliente_area", { p_cliente_id: clienteId });

      let data = clienteData;
      if (rpcError?.message?.includes("function") || !clienteData) {
        if (import.meta.env.DEV) console.log("RPC nÍo disponível, tentando query direta...");
        const { data: queryData, error: queryError } = await supabase
          .from("pessoas")
          .select("id, nome, email, telefone, avatar_url, drive_link")
          .eq("id", clienteId)
          .maybeSingle();

        if (queryError) {
          console.error("Erro ao buscar cliente:", queryError?.message);
          setClienteNaoEncontrado(true);
          return;
        }
        data = queryData;
      }

      if (!data) {
        console.error("Cliente nÍo encontrado com ID:", clienteId);
        setClienteNaoEncontrado(true);
        return;
      }

      if (precisaLogin) {
        setClienteParaLogin(data as Pessoa);

        if (urlEmail) setLoginEmail(decodeURIComponent(urlEmail));
        if (urlSenha) setLoginSenha(decodeURIComponent(urlSenha));

        if (urlEmail && urlSenha) {
          const senhaEsperada = gerarSenhaCliente(data.nome, data.telefone);
          const senhaInformada = decodeURIComponent(urlSenha);

          if (senhaInformada === senhaEsperada) {
            setAutenticado(true);
            setCliente(data as Pessoa);
            setDriveLink(data.drive_link || null);
            const folderId = extractDriveFolderId(data.drive_link);
            setDriveFolderId(folderId);
            if (import.meta.env.DEV) console.log("Login automático: senha válida");

            try {
              const dispositivo = navigator.userAgent.substring(0, 255);
              await supabase.rpc("registrar_acesso_cliente", {
                p_cliente_id: clienteId,
                p_usuario_id: null,
                p_dispositivo: dispositivo
              });
            } catch (errAcesso) {
              console.warn("Erro ao registrar acesso (nÍo crítico):", errAcesso);
            }
            return;
          }
        }

        const skipIntro = searchParams.get("skip") === "1";
        if (skipIntro) {
          setShowLogin(true);
        } else {
          setShowIntro(true);
        }
        return;
      }

      setCliente(data as Pessoa);
      setDriveLink(data.drive_link || null);

      const folderId = extractDriveFolderId(data.drive_link);
      setDriveFolderId(folderId);

      if (import.meta.env.DEV) console.log("Cliente carregado:", data.nome, "- Drive Folder ID:", folderId);

      try {
        const { data: contratos, error: contratosError } = await supabase
          .from('contratos')
          .select('id')
          .eq('cliente_id', clienteId)
          .limit(1);

        if (!contratosError && contratos && contratos.length > 0) {
          setTemContrato(true);
          if (import.meta.env.DEV) console.log("Cliente tem contratos ativos");
        } else {
          setTemContrato(false);
          if (import.meta.env.DEV) console.log("Cliente NÍO tem contratos - fase de negociaçÍo");

          const { data: oportunidade } = await supabase
            .from('oportunidades')
            .select(`
              titulo,
              estagio,
              valor,
              created_at,
              nucleos,
              responsavel_id,
              pessoas!oportunidades_responsavel_id_fkey (nome, telefone)
            `)
            .eq('cliente_id', clienteId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (oportunidade) {
            const responsavel = oportunidade.pessoas as any;
            setOportunidadeInfo({
              titulo: oportunidade.titulo || 'Projeto em negociaçÍo',
              estagio: oportunidade.estagio || 'Em análise',
              valor: oportunidade.valor || null,
              responsavelNome: responsavel?.nome || null,
              responsavelTelefone: responsavel?.telefone || null,
              nucleos: oportunidade.nucleos || [],
              created_at: oportunidade.created_at || null
            });
          }
        }
      } catch (errContratos) {
        console.warn("Erro ao verificar contratos:", errContratos);
        setTemContrato(false);
      }

      try {
        const dispositivo = navigator.userAgent.substring(0, 255);
        await supabase.rpc("registrar_acesso_cliente", {
          p_cliente_id: clienteId,
          p_usuario_id: null,
          p_dispositivo: dispositivo
        });
        if (import.meta.env.DEV) console.log("Acesso do cliente registrado com sucesso");
      } catch (errAcesso) {
        console.warn("Erro ao registrar acesso (nÍo crítico):", errAcesso);
      }

    } catch (err) {
      console.error("Erro ao carregar cliente", err);
      setClienteNaoEncontrado(true);
    } finally {
      setLoadingCliente(false);
    }
  }, [impersonationLoading, isImpersonating, impersonatedUser, canImpersonate, pathClienteId, searchParams]);

  // Carregar dados do cliente autenticado ou via parâmetro de URL
  useEffect(() => {
    carregarCliente();
  }, [carregarCliente]);

  // Estado para loading do login
  const [loginLoading, setLoginLoading] = useState(false);

  // FunçÍo para validar login manual
  const handleLogin = async () => {
    if (!clienteParaLogin) return;

    setLoginLoading(true);
    setLoginErro("");

    // Pequeno delay para feedback visual
    await new Promise(resolve => setTimeout(resolve, 300));

    const senhaEsperada = gerarSenhaCliente(clienteParaLogin.nome, clienteParaLogin.telefone);
    if (import.meta.env.DEV) console.log("Validando login:", { senhaInformada: loginSenha, senhaEsperada: senhaEsperada.substring(0, 2) + '***' });

    if (loginSenha !== senhaEsperada) {
      setLoginErro("Senha incorreta. Verifique os dados enviados via WhatsApp ou e-mail.");
      setLoginLoading(false);
      return;
    }

    // Senha correta - liberar acesso
    if (import.meta.env.DEV) console.log("Login bem-sucedido para:", clienteParaLogin.nome);
    setAutenticado(true);
    setShowLogin(false);
    setCliente(clienteParaLogin);
    setDriveLink(clienteParaLogin.drive_link || null);
    const folderId = extractDriveFolderId(clienteParaLogin.drive_link);
    setDriveFolderId(folderId);

    // Registrar acesso
    try {
      const dispositivo = navigator.userAgent.substring(0, 255);
      await supabase.rpc("registrar_acesso_cliente", {
        p_cliente_id: clienteParaLogin.id,
        p_usuario_id: null,
        p_dispositivo: dispositivo
      });
    } catch (errAcesso) {
      console.warn("Erro ao registrar acesso (nÍo crítico):", errAcesso);
    }

    setLoginLoading(false);
  };

  const primeiroNome = useMemo(() => {
    const nomeBase =
      cliente?.nome ||
      searchParams.get("cliente_nome") ||
      searchParams.get("cliente") ||
      searchParams.get("nome");
    if (!nomeBase) return "Cliente";
    
    // Extrair primeiro e segundo nome
    const nomes = nomeBase.split(" ").filter(n => n.length > 0);
    if (nomes.length >= 2) {
      return `${nomes[0]} ${nomes[1]}`;
    }
    return nomes[0] || "Cliente";
  }, [cliente?.nome, searchParams]);

  const [userRole, setUserRole] = useState<string | null>(null);
  const isInterno = useMemo(() => {
    const role = (searchParams.get("role") || "").toLowerCase();
    const flagInternal = searchParams.get("internal") === "1";
    const roleMatch =
      role === "administrador" || role === "admin" || role === "colaborador" || role === "collaborator";
    const userRoleMatch = userRole ? ["administrador", "admin", "colaborador", "collaborator"].includes(userRole.toLowerCase()) : false;
    return flagInternal || roleMatch || userRoleMatch;
  }, [searchParams, userRole]);


  useEffect(() => {
    supabase.auth
      .getUser()
      .then((res) => {
        const meta = (res.data.user?.app_metadata as any) || {};
        const userMeta = (res.data.user?.user_metadata as any) || {};
        const papel = meta.role || meta.papel || meta.perfil || userMeta.role || userMeta.papel || userMeta.perfil;
        if (papel) setUserRole(String(papel));
      })
      .catch((e) => console.debug("Erro ao buscar metadata:", e));
  }, []);

  // FunçÍo de logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  // NavegaçÍo por tabs (SPA - sem reload de página)
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

    const handleUploadSimulado = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const nomes = Array.from(files).map((f) => f.name);
    setUploadQueue((prev) => [...nomes, ...prev]);
  };

  // Carregar estrutura de pastas do Drive do cliente
  useEffect(() => {
    const carregarPastasDoCliente = async () => {
      if (!GOOGLE_API_KEY || !driveFolderId) {
        setPastasDoCliente([]);
        return;
      }

      try {
        setCarregandoPastas(true);
        if (import.meta.env.DEV) console.log("Carregando estrutura de pastas do cliente:", driveFolderId);

        // Buscar todas as subpastas na pasta raiz do cliente
        const qFolders = encodeURIComponent(`'${driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const fieldsFolders = encodeURIComponent("files(id,name)");
        const urlFolders = `https://www.googleapis.com/drive/v3/files?q=${qFolders}&fields=${fieldsFolders}&orderBy=name&key=${GOOGLE_API_KEY}`;

        const respFolders = await fetch(urlFolders);
        const dataFolders = await respFolders.json();

        if (!dataFolders.files || dataFolders.files.length === 0) {
          setPastasDoCliente([]);
          return;
        }

        // Organizar pastas em categorias
        const categorias: { title: string; rows: { name: string; id: string }[] }[] = [];

        // Para cada pasta principal, buscar subpastas
        for (const folder of dataFolders.files) {
          const qSubFolders = encodeURIComponent(`'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
          const urlSubFolders = `https://www.googleapis.com/drive/v3/files?q=${qSubFolders}&fields=${fieldsFolders}&orderBy=name&key=${GOOGLE_API_KEY}`;
          const respSubFolders = await fetch(urlSubFolders);
          const dataSubFolders = await respSubFolders.json();

          if (dataSubFolders.files && dataSubFolders.files.length > 0) {
            categorias.push({
              title: folder.name,
              rows: dataSubFolders.files.map((f: any) => ({ name: f.name, id: f.id }))
            });
          } else {
            // Pasta sem subpastas - verificar se tem arquivos
            const qFiles = encodeURIComponent(`'${folder.id}' in parents and trashed=false`);
            const urlFiles = `https://www.googleapis.com/drive/v3/files?q=${qFiles}&fields=files(id)&pageSize=1&key=${GOOGLE_API_KEY}`;
            const respFiles = await fetch(urlFiles);
            const dataFiles = await respFiles.json();

            if (dataFiles.files && dataFiles.files.length > 0) {
              // Pasta com arquivos diretamente - adicionar como categoria única
              categorias.push({
                title: folder.name,
                rows: [{ name: folder.name, id: folder.id }]
              });
            }
          }
        }

        setPastasDoCliente(categorias);
        if (import.meta.env.DEV) console.log(`Estrutura de pastas carregada: ${categorias.length} categorias`);

      } catch (err) {
        console.error("Erro ao carregar pastas do Drive:", err);
        setPastasDoCliente([]);
      } finally {
        setCarregandoPastas(false);
      }
    };

    carregarPastasDoCliente();
  }, [driveFolderId]);

  // FunçÍo para abrir pasta e carregar arquivos reais do Drive
  const abrirPasta = async (grupo: string, pasta: string, folderId?: string) => {
    setPastaAberta({ grupo, pasta, folderId });
    setCarregandoArquivos(true);
    setErroArquivos(null);
    setArquivosDaPasta([]);

    try {
      if (!GOOGLE_API_KEY || !folderId) {
        setErroArquivos('Pasta nÍo configurada');
        return;
      }

      // Buscar arquivos reais da pasta no Google Drive
      const q = encodeURIComponent(`'${folderId}' in parents and trashed=false and mimeType!='application/vnd.google-apps.folder'`);
      const fields = encodeURIComponent("files(id,name,mimeType,size,modifiedTime,thumbnailLink,webViewLink,webContentLink)");
      const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=name&key=${GOOGLE_API_KEY}`;

      const resp = await fetch(url);
      const data = await resp.json();

      if (data.error) {
        console.error("Erro da API do Drive:", data.error);
        // Verificar se é erro de permissÍo (pasta nÍo compartilhada publicamente)
        if (data.error.code === 403 || data.error.code === 404) {
          setErroArquivos('Pasta nÍo acessível. Verifique se está compartilhada como "Qualquer pessoa com o link".');
        } else {
          setErroArquivos('Erro ao acessar pasta. Tente novamente.');
        }
        return;
      }

      const arquivos = (data?.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        mimeType: f.mimeType,
        size: f.size ? formatBytes(parseInt(f.size)) : '-',
        modifiedTime: f.modifiedTime ? new Date(f.modifiedTime).toLocaleDateString('pt-BR') : '-',
        thumbnailLink: f.thumbnailLink || (f.mimeType?.startsWith('image/') ? `https://drive.google.com/thumbnail?id=${f.id}&sz=w200` : null),
        viewLink: f.webViewLink,
        downloadLink: f.webContentLink || `https://drive.google.com/uc?export=download&id=${f.id}`
      }));

      setArquivosDaPasta(arquivos);
      if (import.meta.env.DEV) console.log(`${arquivos.length} arquivos carregados da pasta ${pasta}`);

    } catch (error: any) {
      console.error('Erro ao carregar arquivos:', error);
      setErroArquivos('Erro ao carregar arquivos da pasta');
    } finally {
      setCarregandoArquivos(false);
    }
  };

  // FunçÍo auxiliar para formatar bytes
  function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  // FunçÍo para pegar ícone do tipo de arquivo
  const getIconeArquivo = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="w-5 h-5 text-purple-600" />;
    if (mimeType.startsWith('video/')) return <FileVideo className="w-5 h-5 text-red-600" />;
    if (mimeType.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    return <FileType className="w-5 h-5 text-gray-600" />;
  };

  // Carrega fotos do diário a partir da pasta do Drive do CLIENTE ESPECÍFICO
  useEffect(() => {
    const fetchFotosDoCliente = async () => {
      // IMPORTANTE: Só carregar se tiver o ID da pasta do cliente
      if (!GOOGLE_API_KEY || !driveFolderId) {
        if (import.meta.env.DEV) console.log("Diário de obra: Aguardando pasta do Drive do cliente...", { driveFolderId });
        setDriveFotos([]);
        setFotosPorSemana([]);
        return;
      }

      try {
        setLoadingDriveFotos(true);
        if (import.meta.env.DEV) console.log("Carregando fotos do diário do cliente, pasta raiz:", driveFolderId);

        // 1. Primeiro, buscar a subpasta "Diário de Obra" ou similar
        const nomesPastaDiario = ["Diário de Obra", "04. Diário de Obra", "Diario de Obra", "diario de obra", "diário de obra"];
        let diarioFolderId = driveFolderId; // Fallback para pasta raiz

        // Buscar subpastas na pasta raiz
        const qFolders = encodeURIComponent(`'${driveFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
        const fieldsFolders = encodeURIComponent("files(id,name)");
        const urlFolders = `https://www.googleapis.com/drive/v3/files?q=${qFolders}&fields=${fieldsFolders}&key=${GOOGLE_API_KEY}`;

        const respFolders = await fetch(urlFolders);
        const dataFolders = await respFolders.json();

        if (dataFolders.files && dataFolders.files.length > 0) {
          if (import.meta.env.DEV) console.log("Subpastas encontradas:", dataFolders.files.map((f: any) => f.name));

          // Procurar por pasta de diário de obra (case-insensitive)
          const pastaDiario = dataFolders.files.find((f: any) =>
            nomesPastaDiario.some((nome) => {
              const nomeNorm = normalizeSearchTerm(f.name || "");
              return (
                nomeNorm.includes("diario") ||
                nomeNorm === normalizeSearchTerm(nome)
              );
            })
          );

          if (pastaDiario) {
            diarioFolderId = pastaDiario.id;
            if (import.meta.env.DEV) console.log("Pasta 'Diário de Obra' encontrada:", pastaDiario.name, pastaDiario.id);
          } else {
            // Tentar buscar recursivamente em subpastas (ex: Engenharia > Diário de Obra)
            for (const folder of dataFolders.files) {
              const qSubFolders = encodeURIComponent(`'${folder.id}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`);
              const urlSubFolders = `https://www.googleapis.com/drive/v3/files?q=${qSubFolders}&fields=${fieldsFolders}&key=${GOOGLE_API_KEY}`;
              const respSubFolders = await fetch(urlSubFolders);
              const dataSubFolders = await respSubFolders.json();

              if (dataSubFolders.files) {
                const subPastaDiario = dataSubFolders.files.find((f: any) =>
                  normalizeSearchTerm(f.name || "").includes("diario")
                );
                if (subPastaDiario) {
                  diarioFolderId = subPastaDiario.id;
                  if (import.meta.env.DEV) console.log(`Pasta 'Diário de Obra' encontrada em ${folder.name}:`, subPastaDiario.name);
                  break;
                }
              }
            }
          }
        }

        // 2. Buscar fotos/vídeos na pasta do diário
        if (import.meta.env.DEV) console.log("Buscando fotos na pasta:", diarioFolderId);
        const q = encodeURIComponent(`'${diarioFolderId}' in parents and trashed=false and (mimeType contains 'image/' or mimeType contains 'video/')`);
        const fields = encodeURIComponent("files(id,name,mimeType,thumbnailLink,webViewLink,webContentLink,createdTime)");
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=${fields}&orderBy=createdTime desc&key=${GOOGLE_API_KEY}`;
        const resp = await fetch(url);
        const data = await resp.json();

        if (data.error) {
          console.error("Erro da API do Drive:", data.error);
          setDriveFotos([]);
          setFotosPorSemana([]);
          return;
        }

        const files = (data?.files || []) as any[];

        const parsed = files.map((f) => {
          // Tentar extrair data do nome do arquivo
          const match = f.name.match(/(\d{4})[_-]?(\d{2})[_-]?(\d{2})/);
          const created = match ? `${match[1]}-${match[2]}-${match[3]}` : f.createdTime || "";
          const title = f.name.replace(/\.[^.]+$/, "").replace(/[_-]/g, " ").trim();
          const description = created
            ? `Capturado em ${new Date(created).toLocaleDateString("pt-BR")}`
            : "Data nÍo informada";

          return {
            id: f.id,
            name: f.name,
            image: f.thumbnailLink || `https://drive.google.com/uc?export=view&id=${f.id}`,
            title,
            description,
            createdTime: f.createdTime || created,
            viewLink: f.webViewLink || f.webContentLink || `https://drive.google.com/uc?export=view&id=${f.id}`,
            mimeType: f.mimeType,
          };
        });

        setDriveFotos(parsed);

        // Agrupar fotos por semana
        const semanas = agruparFotosPorSemana(parsed);
        setFotosPorSemana(semanas);

        if (import.meta.env.DEV) console.log(`Diário: ${parsed.length} fotos carregadas em ${semanas.length} semanas`);

      } catch (err) {
        console.error("Erro ao carregar fotos do Drive do cliente", err);
        setDriveFotos([]);
        setFotosPorSemana([]);
      } finally {
        setLoadingDriveFotos(false);
      }
    };

    fetchFotosDoCliente();
  }, [driveFolderId]); // IMPORTANTE: Depende do ID da pasta do cliente!

  // TELA DE INTRO - Apresentacao animada das funcionalidades
  if (showIntro && clienteParaLogin) {
    return (
      <IntroAreaCliente
        clienteNome={clienteParaLogin.nome}
        duration={18}
        onComplete={() => {
          setShowIntro(false);
          setShowLogin(true);
        }}
      />
    );
  }

  // TELA DE LOGIN - Se precisa autenticar via link externo
  if (showLogin && clienteParaLogin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 space-y-6">
          {/* Logo */}
          <div className="text-center">
            <img
              src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
              alt="WG Almeida"
              className="h-16 mx-auto mb-4"
            />
            <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Area do Cliente</h1>
            <p className="text-[16px] text-gray-500 mt-1">
              Ola, {clienteParaLogin.nome.split(" ")[0]}! Confirme seus dados para acessar.
            </p>
          </div>

          {/* Formulário */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={loginSenha}
                onChange={(e) => setLoginSenha(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                placeholder="Digite sua senha"
              />
            </div>

            {loginErro && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {loginErro}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loginLoading || !loginSenha}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-400 text-white font-normal py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Entrar'
              )}
            </button>
          </div>

          {/* Rodapé */}
          <div className="text-center space-y-2">
            <p className="text-xs text-gray-400">
              Suas credenciais foram enviadas via WhatsApp ou e-mail.
            </p>
            <a
              href="https://wa.me/5511943688381?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20acessar%20minha%20%C3%A1rea%20do%20cliente."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
            >
              <MessageSquare className="w-3 h-3" />
              Precisa de ajuda? Fale conosco
            </a>
          </div>
        </div>
      </div>
    );
  }

  // LOADING
  if (loadingCliente || impersonationLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-orange-500 mx-auto" />
          <p className="text-gray-600">Carregando sua area...</p>
        </div>
      </div>
    );
  }

  // CLIENTE NÍO ENCONTRADO
  if (clienteNaoEncontrado) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-xl max-w-md w-full p-8 text-center space-y-4">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Acesso nao encontrado</h1>
          <p className="text-[16px] text-gray-600">
            Nao foi possivel identificar sua conta. Verifique se o link esta correto ou entre em contato com a equipe WG Almeida.
          </p>
          <div className="pt-4 space-y-3">
            <a
              href="https://wa.me/5511943688381?text=Ol%C3%A1!%20Preciso%20de%20ajuda%20para%20acessar%20minha%20%C3%A1rea%20do%20cliente%20WG%20Almeida."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition font-medium"
            >
              <MessageSquare className="w-5 h-5" />
              Falar com a equipe WG
            </a>
            <button
              type="button"
              onClick={() => navigate("/")}
              className="w-full px-6 py-2 bg-gray-200 text-gray-700 rounded-full hover:bg-gray-300 transition"
            >
              Voltar ao inicio
            </button>
          </div>
          <p className="text-xs text-gray-400 pt-2">
            Se voce recebeu este link por WhatsApp, tente clicar novamente ou copie e cole no navegador.
          </p>
        </div>
      </div>
    );
  }

  // CLIENTE SEM CONTRATO - FASE DE NEGOCIAÇÍO
  // Mostrar tela simplificada com informações da oportunidade
  if (temContrato === false) {
    // Calcular progresso do estágio
    const estagiosOrdenados = ['Lead', 'QualificaçÍo', 'Proposta', 'NegociaçÍo', 'Fechamento', 'Ganho'];
    const estagioAtual = oportunidadeInfo?.estagio || 'Lead';
    const estagioAtualNorm = normalizeSearchTerm(estagioAtual);
    const estagioIndex = estagiosOrdenados.findIndex((e) =>
      estagioAtualNorm.includes(normalizeSearchTerm(e))
    );
    const progressoEstagio = estagioIndex >= 0 ? ((estagioIndex + 1) / estagiosOrdenados.length) * 100 : 20;

    // Formatar valor
    const formatarValor = (valor: number | null) => {
      if (!valor) return null;
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
    };

    // Formatar telefone para WhatsApp
    const formatarTelefoneWhatsApp = (telefone: string | null) => {
      if (!telefone) return '5511943688381';
      return telefone.replace(/\D/g, '');
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-amber-50">
        {/* Header elegante */}
        <header className="bg-gradient-to-r from-gray-900 to-black text-white shadow-xl">
          <div className="max-w-5xl mx-auto px-4 py-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <img
                  src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                  alt="WG Grupo"
                  className="h-10 w-auto"
                />
                <div>
                  <h1 className="text-base font-normal">Portal do Cliente</h1>
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1 animate-pulse" />
                      Em negociaçÍo
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-gray-300 hover:bg-white/10 transition"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Hero Card - Boas vindas */}
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-6 text-white">
              <div className="flex items-center gap-5">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center ring-4 ring-white/30">
                  {cliente?.avatar_url ? (
                    <img src={cliente.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover" loading="lazy" />
                  ) : (
                    <span className="text-3xl font-normal text-white">
                      {cliente?.nome?.charAt(0).toUpperCase() || "C"}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-white/80 text-sm">Bem-vindo(a) de volta,</p>
                  <h1 className="text-3xl font-normal">{primeiroNome}!</h1>
                  <p className="text-white/90 mt-1">
                    Estamos trabalhando no seu projeto.
                  </p>
                </div>
              </div>
            </div>

            {/* Barra de progresso */}
            <div className="px-8 py-6 border-b border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-700">Progresso da negociaçÍo</span>
                <span className="text-sm font-normal text-orange-600">{Math.round(progressoEstagio)}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${progressoEstagio}%` }}
                />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-gray-400 uppercase tracking-wider">
                <span>Lead</span>
                <span>Proposta</span>
                <span>NegociaçÍo</span>
                <span>Fechamento</span>
              </div>
            </div>

            {/* Info Cards */}
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl p-5 border border-orange-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                      <Target className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Estágio Atual</span>
                  </div>
                  <p className="text-[20px] font-normal text-gray-900">{oportunidadeInfo?.estagio || 'Em análise'}</p>
                </div>

                {oportunidadeInfo?.valor && (
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-5 border border-green-100">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-green-500 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-xs text-gray-500 uppercase tracking-wide">Investimento</span>
                    </div>
                    <p className="text-[20px] font-normal text-gray-900">{formatarValor(oportunidadeInfo.valor)}</p>
                  </div>
                )}

                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xs text-gray-500 uppercase tracking-wide">Projeto</span>
                  </div>
                  <p className="text-lg font-normal text-gray-900 line-clamp-1">{oportunidadeInfo?.titulo || 'Em definiçÍo'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de 2 colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Seu Consultor */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Seu Consultor
              </h3>

              {oportunidadeInfo?.responsavelNome ? (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-[20px] font-normal">
                    {oportunidadeInfo.responsavelNome.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="font-normal text-gray-900">{oportunidadeInfo.responsavelNome}</p>
                    <p className="text-sm text-gray-500">Consultor Comercial</p>
                  </div>
                  <a
                    href={`https://wa.me/${formatarTelefoneWhatsApp(oportunidadeInfo.responsavelTelefone)}?text=Ol%C3%A1%20${encodeURIComponent(oportunidadeInfo.responsavelNome.split(' ')[0])}!%20Sou%20${encodeURIComponent(primeiroNome)}%20e%20gostaria%20de%20saber%20mais%20sobre%20meu%20projeto.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition shadow-lg"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-[20px] font-normal">
                    WG
                  </div>
                  <div className="flex-1">
                    <p className="font-normal text-gray-900">Equipe WG Almeida</p>
                    <p className="text-sm text-gray-500">Atendimento Comercial</p>
                  </div>
                  <a
                    href="https://wa.me/5511943688381?text=Ol%C3%A1!%20Gostaria%20de%20saber%20mais%20sobre%20meu%20projeto%20WG%20Almeida."
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center text-white transition shadow-lg"
                  >
                    <MessageSquare className="w-5 h-5" />
                  </a>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <a
                  href={`https://wa.me/${formatarTelefoneWhatsApp(oportunidadeInfo?.responsavelTelefone || null)}?text=Ol%C3%A1!%20Sou%20${encodeURIComponent(primeiroNome)}%20e%20gostaria%20de%20conversar%20sobre%20meu%20projeto.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition font-medium text-sm"
                >
                  <MessageSquare className="w-4 h-4" />
                  WhatsApp
                </a>
                <a
                  href={`tel:+55${formatarTelefoneWhatsApp(oportunidadeInfo?.responsavelTelefone || null)}`}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition font-medium text-sm"
                >
                  <Phone className="w-4 h-4" />
                  Ligar
                </a>
              </div>
            </div>

            {/* Próximos Passos */}
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Próximos Passos
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-gray-900">Primeiro contato realizado</p>
                    <p className="text-sm text-gray-500">Você já está em nossa base de clientes</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${progressoEstagio >= 50 ? 'bg-green-500' : 'bg-orange-500 animate-pulse'}`}>
                    {progressoEstagio >= 50 ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-white text-sm font-normal">2</span>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${progressoEstagio >= 50 ? 'text-gray-900' : 'text-orange-600'}`}>
                      {progressoEstagio >= 50 ? 'Proposta apresentada' : 'Aguardando proposta'}
                    </p>
                    <p className="text-sm text-gray-500">DefiniçÍo do escopo e valores do projeto</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${progressoEstagio >= 80 ? 'bg-green-500' : 'bg-gray-200'}`}>
                    {progressoEstagio >= 80 ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <span className="text-gray-400 text-sm font-normal">3</span>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <p className={`font-medium ${progressoEstagio >= 80 ? 'text-gray-900' : 'text-gray-400'}`}>Assinatura do contrato</p>
                    <p className="text-sm text-gray-400">FormalizaçÍo da parceria</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <span className="text-gray-400 text-sm font-normal">4</span>
                  </div>
                  <div className="flex-1 pt-1">
                    <p className="font-medium text-gray-400">Acesso à área completa</p>
                    <p className="text-sm text-gray-400">Acompanhe cada detalhe do seu projeto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Serviços inclusos (se houver núcleos) */}
          {oportunidadeInfo?.nucleos && oportunidadeInfo.nucleos.length > 0 && (
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
                <Layers className="w-5 h-5 text-purple-500" />
                Serviços em NegociaçÍo
              </h3>
              <div className="flex flex-wrap gap-2">
                {oportunidadeInfo.nucleos.map((nucleo, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-purple-50 text-purple-700 border border-purple-200"
                  >
                    {nucleo}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Vídeo institucional */}
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl shadow-xl p-8 text-white">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="flex-1">
                <h3 className="text-[18px] sm:text-[24px] font-normal mb-3">Conheça a WG Almeida</h3>
                <p className="text-gray-300 mb-4">
                  Há mais de 14 anos transformando sonhos em realidade através de projetos de arquitetura,
                  engenharia e marcenaria de alto padrÍo.
                </p>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>+500 projetos entregues</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Equipe multidisciplinar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span>Garantia de qualidade</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <a
                  href="https://www.instagram.com/wgalmeida.arq/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium hover:opacity-90 transition"
                >
                  <Instagram className="w-5 h-5" />
                  Siga no Instagram
                </a>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-[20px] font-normal text-gray-900 mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-500" />
              Perguntas Frequentes
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium text-gray-900 mb-1">Quando terei acesso à área completa?</p>
                <p className="text-sm text-gray-600">
                  Assim que seu contrato for assinado, você receberá um e-mail com as credenciais de acesso à área completa,
                  onde poderá acompanhar cada etapa do seu projeto.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium text-gray-900 mb-1">Como funciona o processo de projeto?</p>
                <p className="text-sm text-gray-600">
                  Após a assinatura, iniciamos o levantamento de necessidades, desenvolvimento do projeto,
                  aprovações e acompanhamento até a entrega final.
                </p>
              </div>
              <div className="p-4 bg-gray-50 rounded-xl">
                <p className="font-medium text-gray-900 mb-1">Posso alterar o escopo durante a negociaçÍo?</p>
                <p className="text-sm text-gray-600">
                  Sim! Até a assinatura do contrato, você pode ajustar o escopo do projeto.
                  Converse com seu consultor para fazer alterações.
                </p>
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">
              Você receberá um e-mail quando seu contrato for ativado.
            </p>
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} WG Almeida Arquitetura, Engenharia e Marcenaria
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
      {/* Barra de impersonaçÍo para MASTER/ADMIN */}
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={stopImpersonation}
        />
      )}

      <div className={`min-h-screen bg-gray-50 ${isImpersonating ? "pt-12" : ""}`}>
        {/* ========== HEADER FIXO - ÁREA WGXPERIENCE ========== */}
        <header className={`sticky ${isImpersonating ? "top-12" : "top-0"} z-50 bg-black text-white shadow-lg`}>
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo WG */}
            <div className="flex items-center gap-2">
              <img
                src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                alt="WG Grupo"
                className="h-8 w-auto"
              />
              <div className="hidden sm:block">
                <h1 className="text-sm font-normal tracking-tight">Área WGxperience</h1>
                <p className="text-[9px] text-gray-400 uppercase tracking-widest">Portal do Cliente</p>
              </div>
            </div>

            {/* Menu Desktop - Tabs SPA */}
            <nav className="hidden md:flex items-center gap-0.5">
              {clienteMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => handleTabChange(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? "bg-orange-500 text-white"
                        : "text-gray-300 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Usuário + Logout */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10">
                {cliente?.avatar_url ? (
                  <img
                    src={cliente.avatar_url}
                    alt={cliente?.nome || "Avatar"}
                    className="h-7 w-7 rounded-full object-cover border border-white/30"
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-orange-500 flex items-center justify-center text-xs font-normal">
                    {cliente?.nome ? cliente.nome.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
                  </div>
                )}
                <span className="text-sm text-gray-200 max-w-[120px] truncate">
                  {cliente?.nome?.split(" ")[0] || "Cliente"}
                </span>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-300 hover:bg-red-500/20 hover:text-red-400 transition"
                title="Sair"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>

              {/* Menu Mobile Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-white/10"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Menu Mobile Expandido - Tabs SPA */}
          {mobileMenuOpen && (
            <nav className="md:hidden py-4 border-t border-white/10">
              <div className="space-y-1">
                {clienteMenuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => handleTabChange(item.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-orange-500 text-white"
                          : "text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* ========== CONTEÚDO PRINCIPAL - RENDERIZAÇÍO POR TAB ========== */}
      <main className="px-4 py-6 lg:px-10 space-y-10 max-w-7xl mx-auto">

        {/* RenderizaçÍo condicional baseada no tab ativo */}
        {activeTab === "financeiro" && (
          <TabFinanceiro clienteId={cliente?.id || null} clienteNome={primeiroNome} />
        )}

        {activeTab === "pos-vendas" && (
          <TabPosVendas clienteNome={primeiroNome} clienteId={cliente?.id || null} />
        )}

        {activeTab === "assistencia" && (
          <TabAssistencia clienteNome={primeiroNome} clienteId={cliente?.id || null} />
        )}

        {activeTab === "termos" && (
          <TabTermos clienteNome={primeiroNome} />
        )}

        {activeTab === "garantia" && (
          <TabGarantia clienteNome={primeiroNome} />
        )}

        {/* TAB DASHBOARD - Meu Projeto (conteúdo original) */}
        {activeTab === "dashboard" && (
          <>
      <section className="rounded-3xl bg-gradient-to-r from-[#121212] via-[#1f1f1f] to-[#2c2c2c] text-white p-8 lg:p-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between shadow-xl">
        <div className="space-y-4 max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-gray-400">Área do Cliente · WG Almeida</p>
          <h1 className="text-3xl lg:text-4xl font-normal">
            Bem-vindo(a), {primeiroNome}. Tudo o que acontece com o seu projeto em um único lugar.
          </h1>
          <p className="text-sm text-gray-300 leading-relaxed">
            Aqui reunimos contratos, cronogramas, aprovacoes, referencias e todo o diario de obra com fotos semanais.
            O acesso e guiado pela equipe WG, conectando nosso time ao seu passo a passo.
          </p>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-2">
              {cliente?.avatar_url ? (
                <img
                  src={cliente.avatar_url}
                  alt={cliente?.nome || "Avatar"}
                  className="h-8 w-8 rounded-full object-cover border border-white/30"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center text-sm font-normal">
                  {cliente?.nome ? cliente.nome.charAt(0).toUpperCase() : "C"}
                </div>
              )}
              <div className="text-sm text-gray-100">
                {loadingCliente ? "Carregando cliente..." : cliente?.nome || "Cliente"}
              </div>
            </div>
            {cliente?.email && <span className="text-xs text-gray-300">{cliente.email}</span>}
          </div>
          {/* TODO: Reativar quando tiver material pronto */}
          <div className="hidden flex-wrap gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-white/90 px-5 py-2 text-sm font-normal text-black hover:bg-white transition">
              Iniciar onboarding
              <ArrowRight className="w-4 h-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2 text-sm text-white/90 hover:bg-white/10">
              Assistir apresentaçÍo <Play className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-5 flex flex-col gap-3 min-w-[260px]">
          <span className="text-xs uppercase tracking-[0.3em] text-gray-300">Status do Projeto</span>
          <div className="text-4xl font-normal">{panorama?.progressoGeral || 0}%</div>
          <p className="text-sm text-gray-300">
            {panorama?.atividadesEmAberto
              ? `${panorama.atividadesEmAberto} atividade${panorama.atividadesEmAberto > 1 ? 's' : ''} em andamento`
              : 'Projeto em andamento'}
          </p>
          <div className="text-xs text-gray-400">
            {panorama?.nucleosAtivos?.length
              ? `Núcleos: ${panorama.nucleosAtivos.join(', ')}`
              : 'Acompanhe o progresso'}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-normal text-gray-900">Onboarding do Cliente</h2>
            <p className="text-sm text-gray-500">
              Acompanhamos cada etapa para garantir que todos saibam o que esperar.
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Ver cronograma completo
            <Calendar className="w-4 h-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {onboardingSteps.map((step, index) => (
            <div
              key={step.title}
              className={`rounded-2xl border p-5 transition ${statusStyles[step.status as keyof typeof statusStyles]}`}
            >
              <div className="text-[12px] uppercase tracking-[0.4em] text-gray-500">{`Etapa 0${index + 1}`}</div>
              <div className="flex items-center justify-between mt-2">
                <h3 className="text-[20px] font-normal text-gray-900">{step.title}</h3>
                {step.status === "completed" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              </div>
              <p className="mt-2 text-sm text-gray-600">{step.description}</p>
              <div className="mt-4 text-xs font-normal uppercase tracking-[0.25em] text-gray-400">
                {step.status === "completed"
                  ? "Concluído"
                  : step.status === "current"
                  ? "Em andamento"
                  : "Próxima etapa"}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-normal text-gray-900">Panorama do Cliente</h2>
            <p className="text-sm text-gray-500">Tudo o que está acontecendo agora com o seu contrato WG.</p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
            Exportar resumo
            <FileText className="w-4 h-4" />
          </button>
        </div>

        {loadingPanorama ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm animate-pulse">
                <div className="h-3 w-24 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 w-16 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 w-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : journeyHighlights.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {journeyHighlights.map((card) => (
              <div key={card.label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-xs uppercase tracking-[0.4em] text-gray-400">{card.label}</div>
                <div className="mt-3 text-4xl font-normal text-gray-900">{card.value}</div>
                <p className="mt-2 text-sm text-gray-500">{card.detail}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600 font-medium">Dados do panorama serÍo exibidos em breve</p>
            <p className="text-sm text-gray-500 mt-1">Aguardando vinculaçÍo de contratos e atividades</p>
          </div>
        )}
      </section>

      {/* Atividades Recentes e Próximas Entregas */}
      {panorama && (panorama.atividadesRecentes.length > 0 || panorama.proximasEntregas.length > 0) && (
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Atividades Recentes */}
          {panorama.atividadesRecentes.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-normal text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-blue-600" />
                  Atividades Recentes
                </h3>
                <span className="text-xs text-gray-400">Últimos 30 dias</span>
              </div>
              <div className="space-y-3">
                {panorama.atividadesRecentes.map((atividade) => (
                  <div
                    key={atividade.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-green-50 border border-green-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{atividade.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {atividade.nucleo} · {new Date(atividade.dataAtualizacao).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Próximas Entregas */}
          {panorama.proximasEntregas.length > 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[20px] font-normal text-gray-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-orange-600" />
                  Próximas Entregas
                </h3>
                <span className="text-xs text-gray-400">Em andamento</span>
              </div>
              <div className="space-y-3">
                {panorama.proximasEntregas.map((entrega) => (
                  <div
                    key={entrega.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100"
                  >
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center flex-shrink-0">
                      <AlertCircle className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{entrega.titulo}</p>
                      <p className="text-xs text-gray-500">
                        {entrega.nucleo} · {entrega.previsao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      )}

      {/* Dashboard de Progresso por Núcleo */}
      {cliente?.id && (
        <section className="space-y-4">
          <DashboardProgressoNucleo clienteId={cliente.id} />
        </section>
      )}

      {/* Atividades por Núcleo - Comentários, Tarefas e Checklists */}
      {cliente?.id && (
        <section className="space-y-4">
          <AtividadesNucleo clienteId={cliente.id} />
        </section>
      )}

      {/* Cronograma do Cliente */}
      {cliente?.id && (
        <section className="space-y-4">
          <CronogramaCliente clienteId={cliente.id} />
        </section>
      )}

      {/* Estrutura de Pastas - NavegaçÍo de Arquivos */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-normal text-gray-900">Estrutura de Pastas</h2>
            <p className="text-sm text-gray-500">Clique em uma pasta para visualizar os arquivos.</p>
          </div>
        </div>

        {/* Estado de carregamento das pastas */}
        {carregandoPastas && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400 mr-2" />
            <span className="text-sm text-gray-500">Carregando pastas do Drive...</span>
          </div>
        )}

        {/* Sem pasta do Drive configurada */}
        {!carregandoPastas && !driveFolderId && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Pasta do Google Drive nÍo configurada</p>
            <p className="text-xs text-gray-500 mt-1">Entre em contato com a equipe WG para configurar.</p>
          </div>
        )}

        {/* Sem pastas encontradas */}
        {!carregandoPastas && driveFolderId && pastasDoCliente.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600">Nenhuma pasta encontrada</p>
            <p className="text-xs text-gray-500 mt-1">Os arquivos do projeto serÍo organizados em breve.</p>
          </div>
        )}

        {/* Layout Grid - Cards de Pastas Dinâmicas do Drive */}
        {!carregandoPastas && pastasDoCliente.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pastasDoCliente.map((group) => (
              <div key={group.title} className="w-full">
                <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-white p-4 shadow-sm h-full min-h-[200px]">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="rounded-xl bg-black p-2">
                      <FolderOpen className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="text-sm font-normal text-gray-900">{group.title}</h4>
                      <p className="text-xs text-gray-500">{group.rows.length} {group.rows.length === 1 ? 'pasta' : 'pastas'}</p>
                    </div>
                  </div>
                  <div className="space-y-1.5 max-h-[280px] overflow-y-auto pr-1">
                    {group.rows.map((row) => (
                      <button
                        type="button"
                        key={row.id}
                        onClick={() => abrirPasta(group.title, row.name, row.id)}
                        className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-left transition-all hover:bg-gray-100 hover:shadow-sm ${
                          pastaAberta?.grupo === group.title && pastaAberta?.pasta === row.name
                            ? 'bg-black text-white'
                            : 'bg-gray-50 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FolderOpen className={`w-4 h-4 flex-shrink-0 ${
                            pastaAberta?.grupo === group.title && pastaAberta?.pasta === row.name
                              ? 'text-white'
                              : 'text-gray-400'
                          }`} />
                          <span className="text-xs truncate">{row.name}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 flex-shrink-0 ${
                          pastaAberta?.grupo === group.title && pastaAberta?.pasta === row.name
                            ? 'text-white'
                            : 'text-gray-400'
                        }`} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Visualizador de Arquivos */}
        {pastaAberta && (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-white shadow-lg overflow-hidden">
            {/* Header do Visualizador */}
            <div className="flex items-center justify-between bg-gradient-to-r from-gray-900 to-gray-800 text-white px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPastaAberta(null)}
                  className="rounded-full p-1.5 hover:bg-white/10 transition"
                  title="Voltar"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wider">{pastaAberta.grupo}</p>
                  <h4 className="text-lg font-normal">{pastaAberta.pasta}</h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPastaAberta(null)}
                className="rounded-full p-2 hover:bg-white/10 transition"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Visualizador */}
            <div className="p-6">
              {carregandoArquivos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">Carregando arquivos...</p>
                  </div>
                </div>
              ) : erroArquivos ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
                  <p className="text-sm text-red-600 font-medium mb-2">{erroArquivos}</p>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto">
                    Se o problema persistir, entre em contato com a equipe WG.
                  </p>
                </div>
              ) : arquivosDaPasta.length === 0 ? (
                <div className="text-center py-12">
                  <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Pasta vazia</p>
                </div>
              ) : (
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                  {arquivosDaPasta.map((arquivo) => {
                    const isPdf = arquivo.mimeType?.includes('pdf');
                    const isImage = arquivo.mimeType?.startsWith('image/');

                    return (
                      <div
                        key={arquivo.id}
                        className="group rounded-xl border border-gray-100 bg-gray-50 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all cursor-pointer"
                      >
                        {/* Thumbnail ou Ícone */}
                        <div className="aspect-square relative bg-gray-100 flex items-center justify-center">
                          {arquivo.thumbnailLink ? (
                            <img
                              src={arquivo.thumbnailLink}
                              alt={arquivo.name}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-2">
                              {getIconeArquivo(arquivo.mimeType || '')}
                              <span className="text-[10px] uppercase text-gray-400 font-normal">
                                {arquivo.name.split('.').pop()}
                              </span>
                            </div>
                          )}
                          {/* Overlay com ações */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            {(isPdf || isImage) && (
                              <button
                                type="button"
                                onClick={() => {
                                  if (isPdf) {
                                    setPdfParaVisualizar({
                                      url: `https://drive.google.com/file/d/${arquivo.id}/preview`,
                                      nome: arquivo.name
                                    });
                                  } else if (isImage) {
                                    window.open(`https://drive.google.com/uc?export=view&id=${arquivo.id}`, '_blank');
                                  }
                                }}
                                className="rounded-full bg-white p-2 hover:bg-gray-100 transition"
                                title="Visualizar"
                              >
                                <Eye className="w-4 h-4 text-gray-700" />
                              </button>
                            )}
                            <a
                              href={arquivo.downloadLink || `https://drive.google.com/uc?export=download&id=${arquivo.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-full bg-white p-2 hover:bg-gray-100 transition"
                              title="Baixar"
                            >
                              <Download className="w-4 h-4 text-gray-700" />
                            </a>
                          </div>
                        </div>
                        {/* Info do Arquivo */}
                        <div className="p-3">
                          <p className="text-xs font-medium text-gray-900 truncate" title={arquivo.name}>
                            {arquivo.name}
                          </p>
                          <div className="flex items-center justify-between mt-1">
                            <span className="text-[10px] text-gray-500">{arquivo.size}</span>
                            <span className="text-[10px] text-gray-400">{arquivo.modifiedTime}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Visualizador de PDF */}
        {pdfParaVisualizar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-2xl overflow-hidden shadow-2xl mx-4">
              {/* Header do Modal */}
              <div className="flex items-center justify-between bg-gray-900 text-white px-6 py-4">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-red-400" />
                  <span className="font-medium truncate max-w-md">{pdfParaVisualizar.nome}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPdfParaVisualizar(null)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition"
                >
                  <X className="w-5 h-5" />
                  <span>Fechar</span>
                </button>
              </div>
              {/* Iframe do PDF */}
              <iframe
                src={pdfParaVisualizar.url}
                className="w-full h-[calc(100%-64px)]"
                title={pdfParaVisualizar.nome}
                allow="autoplay"
              />
            </div>
          </div>
        )}
      </section>

      {/* Onboarding de Arquitetura - Etapas do Projeto */}
      {cliente?.id && (
        <section className="space-y-4">
          <OnboardingArquitetura
            clienteId={cliente.id}
            oportunidadeId={cliente.id}
          />
        </section>
      )}

      {/* Cronograma e Solicitações - Layout Vertical */}
      <section className="space-y-6">
        {/* Cronograma e evoluções - Componente Real */}
        {cliente?.id && (
          <CronogramaCliente
            clienteId={cliente.id}
          />
        )}

        {/* Solicitações e aprovações - Componente Real */}
        {cliente?.id && (
          <OrcamentosPendentesCliente
            clienteId={cliente.id}
            onAprovar={() => {
              // Recarregar dados após aprovaçÍo
              carregarCliente();
            }}
          />
        )}

        {/* Grid 2 colunas para Upload e Referências */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Envie seus arquivos */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[20px] font-normal text-gray-900">Envie seus arquivos</h3>
                <p className="text-sm text-gray-500">O cliente pode subir documentos e imagens.</p>
              </div>
              <FileText className="w-4 h-4 text-gray-500" />
            </div>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-xl p-4 text-sm text-gray-600 cursor-pointer hover:border-gray-300">
              <input
                type="file"
                multiple
                onChange={(e) => handleUploadSimulado(e.target.files)}
                className="hidden"
              />
              Clique para selecionar arquivos ou arraste aqui (demo)
            </label>
            {uploadQueue.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-normal text-gray-700">Arquivos recebidos (somente visual):</p>
                <ul className="space-y-1 text-xs text-gray-600">
                  {uploadQueue.map((file, idx) => (
                    <li key={`${file}-${idx}`} className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      {file}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Referências e memoriais - Integrado com Drive */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[20px] font-normal text-gray-900">Referências e memoriais</h3>
              <ImageIcon className="w-5 h-5 text-gray-500" />
            </div>
            <div className="space-y-3">
              {/* Buscar pastas de referências do Drive */}
              {pastasDoCliente.length > 0 ? (
                <>
                  {pastasDoCliente
                    .filter((pasta) => {
                      const pastaNome = normalizeSearchTerm(pasta.title);
                      return [
                        "referencia",
                        "memorial",
                        "material",
                        "moodboard",
                        "conceito",
                      ].some((termo) => pastaNome.includes(termo));
                    })
                    .slice(0, 3)
                    .map((pasta) => (
                      <button
                        key={pasta.title}
                        type="button"
                        onClick={() => handleTabChange('arquivos')}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition text-left"
                      >
                        <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                          <FolderOpen className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">{pasta.title}</p>
                          <p className="text-xs text-gray-500">{pasta.rows.length} item(ns)</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </button>
                    ))}
                  {pastasDoCliente.filter((pasta) => {
                    const pastaNome = normalizeSearchTerm(pasta.title);
                    return [
                      "referencia",
                      "memorial",
                      "material",
                      "moodboard",
                      "conceito",
                    ].some((termo) => pastaNome.includes(termo));
                  }).length === 0 && (
                    <button
                      type="button"
                      onClick={() => handleTabChange('arquivos')}
                      className="w-full text-center py-4 text-gray-500 hover:text-gray-700 transition"
                    >
                      <FolderOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">Ver todos os arquivos</p>
                      <p className="text-xs mt-1 text-gray-400">Acesse a aba Arquivos para ver os materiais</p>
                    </button>
                  )}
                </>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Referências em preparaçÍo</p>
                  <p className="text-xs mt-1">Os memoriais descritivos serÍo disponibilizados aqui</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[20px] font-normal text-gray-900">Diário de obra</h2>
            <p className="text-sm text-gray-500">
              EvoluçÍo semanal com registros fotográficos do seu projeto.
            </p>
          </div>
          {fotosPorSemana.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-500">{driveFotos.length} fotos em {fotosPorSemana.length} semanas</span>
            </div>
          )}
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm space-y-5">
          {/* Estado de carregamento */}
          {loadingDriveFotos && (
            <div className="flex items-center gap-3 py-8 justify-center">
              <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              <p className="text-sm text-gray-500">Carregando fotos do diário...</p>
            </div>
          )}

          {/* Sem pasta configurada */}
          {!loadingDriveFotos && !driveFolderId && (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Pasta do Google Drive nÍo configurada para este cliente.</p>
              <p className="text-xs mt-1">Entre em contato com a equipe WG para configurar.</p>
            </div>
          )}

          {/* Sem fotos */}
          {!loadingDriveFotos && driveFolderId && fotosPorSemana.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm">Ainda nÍo há fotos no diário de obra.</p>
              <p className="text-xs mt-1">As fotos serÍo adicionadas conforme o progresso do projeto.</p>
            </div>
          )}

          {/* Galeria organizada por semanas */}
          {!loadingDriveFotos && fotosPorSemana.length > 0 && (
            <div className="space-y-8">
              {fotosPorSemana.map((semana, semanaIdx) => (
                <div key={semana.semana} className="space-y-4">
                  {/* Cabeçalho da semana com linha horizontal */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 text-white font-normal text-sm shadow-lg">
                        {semana.semana}
                      </div>
                      <div>
                        <h3 className="text-base font-normal text-gray-900">Semana {semana.semana}</h3>
                        <p className="text-xs text-gray-500">{semana.inicio} — {semana.fim} · {semana.fotos.length} fotos</p>
                      </div>
                    </div>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 to-transparent" />
                  </div>

                  {/* Fotos da semana em scroll horizontal */}
                  <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300">
                    {semana.fotos.map((photo: any, idx: number) => {
                      // Calcular índice global para o lightbox
                      const globalIdx = fotosPorSemana.slice(0, semanaIdx).reduce((acc, s) => acc + s.fotos.length, 0) + idx;

                      return (
                        <div
                          key={photo.id || idx}
                          className="flex-shrink-0 w-48 snap-start overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                        >
                          <button
                            type="button"
                            onClick={() => setLightboxIndex(globalIdx)}
                            className="block w-full focus:outline-none"
                          >
                            {photo.mimeType?.startsWith("video") ? (
                              <div className="relative h-36 w-full bg-gray-900 flex items-center justify-center">
                                {/* Thumbnail do video usando imagem do Drive ou placeholder */}
                                <img
                                  src={photo.image || `https://drive.google.com/thumbnail?id=${photo.id}&sz=w400`}
                                  alt={photo.title}
                                  className="h-full w-full object-cover opacity-70"
                                  loading="lazy"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = 'none';
                                  }}
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                  <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                    <Play className="w-7 h-7 text-gray-900 ml-1" />
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <img
                                src={photo.image}
                                alt={photo.title}
                                className="h-36 w-full object-cover bg-gray-100"
                                loading="lazy"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = "https://via.placeholder.com/200x150?text=Foto";
                                }}
                              />
                            )}
                          </button>
                          <div className="p-3">
                            <p className="text-xs font-medium text-gray-900 truncate">{photo.title}</p>
                            <p className="text-[10px] text-gray-500 truncate">{photo.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Lightbox para visualizaçÍo em tela cheia */}
          {lightboxIndex !== null && driveFotos.length > 0 && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
              <div className="relative max-w-6xl w-full px-4">
                <button
                  type="button"
                  onClick={() => setLightboxIndex(null)}
                  className="absolute -top-12 right-4 text-white text-lg font-normal hover:text-gray-300 transition flex items-center gap-2"
                >
                  <X className="w-5 h-5" /> Fechar
                </button>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? null : (prev - 1 + driveFotos.length) % driveFotos.length
                      )
                    }
                    className="text-white text-4xl px-4 py-2 hover:text-gray-300 transition"
                  >
                    ‹
                  </button>
                  {(() => {
                    const current = driveFotos[lightboxIndex ?? 0];
                    if (!current) return null;
                    return (
                      <div className="flex-1 bg-white rounded-2xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
                        {current.mimeType?.startsWith("video") ? (
                          <video
                            controls
                            autoPlay
                            className="w-full max-h-[60vh] object-contain bg-black"
                            preload="auto"
                            playsInline
                            poster={current.image || `https://drive.google.com/thumbnail?id=${current.id}&sz=w800`}
                          >
                            <source src={`https://drive.google.com/uc?export=download&id=${current.id}`} type={current.mimeType} />
                            <source src={current.viewLink || current.image} type={current.mimeType} />
                            Seu navegador nÍo suporta reproduçÍo de vídeo.
                          </video>
                        ) : (
                          <img
                            src={current.viewLink || current.image}
                            alt={current.title}
                            className="w-full max-h-[60vh] object-contain bg-gray-50"
                            loading="lazy"
                          />
                        )}
                        <div className="p-4 bg-white">
                          <p className="text-sm font-normal text-gray-900">{current.title}</p>
                          <p className="text-xs text-gray-600">{current.description}</p>
                          <p className="text-[10px] text-gray-400 mt-2">
                            Foto {(lightboxIndex ?? 0) + 1} de {driveFotos.length}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                  <button
                    type="button"
                    onClick={() =>
                      setLightboxIndex((prev) =>
                        prev === null ? null : (prev + 1) % driveFotos.length
                      )
                    }
                    className="text-white text-4xl px-4 py-2 hover:text-gray-300 transition"
                  >
                    ›
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
          </>
        )}
      </main>
      </div>
    </>
  );
}


