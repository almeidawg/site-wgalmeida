/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// DASHBOARD EXECUTIVO - CEO & FOUNDER
// Sistema WG Easy - Grupo WG Almeida
// VisÍo completa e em tempo real da empresa
// ============================================================

// Backend URL para chamadas de API em produçÍo
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { listarFinanceiro } from "@/lib/financeiroApi";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import type { ContratoDadosImovel } from "@/types/contratos";
// CEO Checklist API removida - agora usamos o checklist interno
import {
  obterFraseDoDiaComFallback,
  type FraseMotivacional,
} from "@/lib/frasesMotivacionaisApi";
import { verificarPermissao } from "@/lib/permissoesModuloApi";
import GoogleCalendarWidget from "@/components/dashboard/GoogleCalendarWidget";
// MentionInput removido - nÍo é mais usado após remoçÍo do CEO Checklist
import { useDashboardPessoal } from "@/modules/financeiro-pessoal/hooks";
import { TYPOGRAPHY } from "@/constants/typography";
import {
  listarNotasHierarquico,
  CORES_NOTAS,
  type NotaSistema,
  type FiltroChecklist,
} from "@/lib/notasSistemaApi";
import {
  identificarOportunidadesInteligentes,
  type OportunidadeIdentificada,
} from "@/services/oportunidadesInteligentesService";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Briefcase,
  Calendar,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ChevronRight,
  Activity,
  Sun,
  Moon,
  Sunset,
  Check,
  Loader2,
  Quote,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Copy,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Sparkles,
} from "lucide-react";
// Redirecionamento por tipo de usuário
const REDIRECT_POR_TIPO: Record<string, string> = {
  JURIDICO: "/juridico",
  FINANCEIRO: "/financeiro",
};

interface DashboardMetrics {
  // Financeiro
  receitaMes: number;
  despesaMes: number;
  receitaAnoAnterior: number;
  // Projetos
  projetosAtivos: number;
  projetosNovos: number;
  projetosConcluidos: number;
  // Clientes
  clientesAtivos: number;
  clientesNovos: number;
  // Propostas
  propostasAbertas: number;
  propostasAprovadas: number;
  valorPropostas: number;
  // Contratos
  contratosAtivos: number;
  contratosConcluidos: number;
  valorContratos: number;
  // Por núcleo
  nucleoArquitetura: number;
  nucleoEngenharia: number;
  nucleoMarcenaria: number;
  // Despesas por núcleo (valores reais)
  despesaDesigner: number;
  despesaArquitetura: number;
  despesaEngenharia: number;
  despesaMarcenaria: number;
  categoriasDespesaMes: number;
  // Status geral (tarefas)
  tarefasTotais: number;
  tarefasConcluidas: number;
}

interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora?: string;
  tipo: "reuniao" | "entrega" | "visita" | "deadline";
  cliente?: string;
}

interface CronogramaTarefa {
  id: string;
  titulo: string;
  data_termino: string;
  prioridade?: string | null;
  nucleo?: string | null;
  projeto?: {
    nome?: string | null;
  } | null;
}

interface Alerta {
  id: string;
  tipo: "urgente" | "atencao" | "info";
  mensagem: string;
  acao?: string;
  link?: string;
}

interface ClienteAtivo {
  id: string;
  nome: string;
  foto_url: string | null;
  avatar_url: string | null;
  contrato_id: string;
  nucleo: string | null;
  telefone: string | null;
  email: string | null;
  endereco_obra: string | null;
  horario_seg_sex?: string | null;
  horario_sabado?: string | null;
  observacoes?: string | null;
  dadosImovel?: ContratoDadosImovel | null;
  // Novos campos da oportunidade
  condominio_nome?: string | null;
  condominio_contato?: string | null;
}

interface DashboardKpiAudit {
  clientesAtivosFonte: string;
  contratosAtivosFonte: string;
  financeiroFonte: string;
  categoriasDespesaFonte: string;
  atualizadoEm: string;
  contratosAtivosCount: number;
  clientesAtivosCount: number;
  categoriasDespesaMes: number;
}

type PeriodoFluxoFinanceiro = "3m" | "6m" | "ytd" | "12m" | "all";

interface ResumoFinanceiroCards {
  saldoTotal: number;
  receitasTotal: number;
  custosTotal: number;
  contratosAtivos: number;
  valorContratosAtivos: number;
  contratosConcluidos: number;
  categoriasCustos: number;
}

const parseDadosImovelJson = (raw: unknown): ContratoDadosImovel | null => {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as ContratoDadosImovel;
    } catch {
      return null;
    }
  }
  return raw as ContratoDadosImovel;
};

const obterCampo = (
  dados: ContratoDadosImovel | null,
  campo: string
): string | null => {
  if (!dados) return null;
  const registro = dados as unknown as Record<string, unknown>;
  const campoNormalizado = campo.toLowerCase();
  const entrada = Object.keys(registro).find(
    (key) => key.toLowerCase() === campoNormalizado
  );
  if (entrada) {
    const valor = registro[entrada];
    if (typeof valor === "string" && valor.trim()) return valor.trim();
    if (typeof valor === "number" || typeof valor === "boolean") {
      return String(valor);
    }
    return null;
  }
  const valor = registro[campo];
  if (typeof valor === "string" && valor.trim()) return valor.trim();
  if (typeof valor === "number" || typeof valor === "boolean") {
    return String(valor);
  }
  return null;
};

const formatCidadeEstado = (
  cidade?: string | null,
  estado?: string | null
): string | null => {
  if (!cidade) return null;
  if (!estado) return cidade;
  return `${cidade}/${estado}`;
};

const formatEnderecoDetalhado = (
  dados?: ContratoDadosImovel | null
): string | null => {
  if (!dados) return null;

  const linhas: string[] = [];

  // Linha 1: Endereço principal (Logradouro, Número, CEP)
  const logradouro = obterCampo(dados, "logradouro");
  const numero = obterCampo(dados, "numero");
  const cep = obterCampo(dados, "cep");
  const enderecoCompleto = obterCampo(dados, "endereco_completo") || obterCampo(dados, "endereco");

  if (enderecoCompleto) {
    linhas.push(enderecoCompleto);
  } else if (logradouro) {
    const partes = [logradouro];
    if (numero) partes.push(`Número ${numero}`);
    if (cep) partes.push(`CEP ${cep}`);
    linhas.push(partes.join(", "));
  }

  // Linha 2: Complemento (se houver)
  const complemento = obterCampo(dados, "complemento");
  if (complemento) {
    linhas.push(`Complemento: ${complemento}`);
  }

  // Linha 3: Bairro e Cidade/Estado
  const bairro = obterCampo(dados, "bairro");
  const cidade = obterCampo(dados, "cidade");
  const estado = obterCampo(dados, "estado");
  const cidadeEstado = formatCidadeEstado(cidade, estado);
  if (bairro || cidade) {
    const partesBairro: string[] = [];
    if (bairro) partesBairro.push(`Bairro: ${bairro}`);
    if (cidadeEstado) partesBairro.push(`Cidade: ${cidadeEstado}`);
    linhas.push(partesBairro.join(" - "));
  }

  if (!linhas.length) return null;
  return linhas.join("\n");
};

const formatEnderecoCurto = (
  dados?: ContratoDadosImovel | null
): string | null => {
  if (!dados?.endereco_completo) return null;
  const numero = dados.numero ? `, ${dados.numero}` : "";
  const bairro = dados.bairro ? ` - ${dados.bairro}` : "";
  const cidade = dados.cidade ? `, ${dados.cidade}` : "";
  return `${dados.endereco_completo}${numero}${bairro}${cidade}`;
};

const getGridColsClass = (count: number): string => {
  if (count >= 3) return "lg:grid-cols-3";
  if (count === 2) return "lg:grid-cols-2";
  return "lg:grid-cols-1";
};

const getNucleoClasses = (nucleo?: string | null) => {
  const nucleoKey = nucleo?.toLowerCase();
  if (nucleoKey === "arquitetura") {
    return {
      bgClass: "bg-orange-100 ring-orange-200",
      textClass: "text-orange-500",
      borderClass: "border-orange-200 hover:border-orange-300",
    };
  }
  if (nucleoKey === "engenharia") {
    return {
      bgClass: "bg-blue-100 ring-blue-200",
      textClass: "text-blue-500",
      borderClass: "border-blue-200 hover:border-blue-300",
    };
  }
  return {
    bgClass: "bg-amber-100 ring-amber-200",
    textClass: "text-amber-500",
    borderClass: "border-amber-200 hover:border-amber-300",
  };
};

type LancamentoResumo = {
  valor_total?: number;
  status?: string | null;
  tipo?: string | null;
  natureza?: string | null;
  data_competencia?: string | null;
  vencimento?: string | null;
  created_at?: string | null;
  nucleo?: string | null;
};

const carregarTodosLancamentosFinanceiros = async (): Promise<LancamentoResumo[]> => {
  const lancamentos = (await listarFinanceiro()) as LancamentoResumo[];
  return (lancamentos || []).filter((l) => {
    const status = String(l.status || "").trim().toLowerCase();
    return status !== "cancelado";
  });
};

const formatarMoeda = (value: number): string =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);

const NOTA_COR_CLASSES: Record<string, string> = {
  [CORES_NOTAS.amarelo]: "bg-[#FFF9C4]",
  [CORES_NOTAS.laranja]: "bg-[#FFE0B2]",
  [CORES_NOTAS.rosa]: "bg-[#F8BBD9]",
  [CORES_NOTAS.roxo]: "bg-[#E1BEE7]",
  [CORES_NOTAS.azul]: "bg-[#BBDEFB]",
  [CORES_NOTAS.verde]: "bg-[#C8E6C9]",
  [CORES_NOTAS.cinza]: "bg-[#F5F5F5]",
  [CORES_NOTAS.branco]: "bg-[#FFFFFF]",
};

const getNotaCorClass = (cor?: string | null): string =>
  (cor && NOTA_COR_CLASSES[cor]) || NOTA_COR_CLASSES[CORES_NOTAS.cinza];

const getAlertaCardClass = (
  tipo: Alerta["tipo"],
  variant: "compact" | "full"
): string => {
  if (tipo === "urgente") {
    return variant === "compact"
      ? "bg-red-50 border border-red-100"
      : "bg-red-50 border border-red-100 hover:bg-red-100";
  }
  if (tipo === "atencao") {
    return variant === "compact"
      ? "bg-amber-50 border border-amber-100"
      : "bg-amber-50 border border-amber-100 hover:bg-amber-100";
  }
  return variant === "compact"
    ? "bg-blue-50 border border-blue-100"
    : "bg-blue-50 border border-blue-100 hover:bg-blue-100";
};

const getAlertaAcaoClass = (tipo: Alerta["tipo"]): string => {
  if (tipo === "urgente") return "text-red-600";
  if (tipo === "atencao") return "text-amber-600";
  return "text-blue-600";
};

const FinanceiroTooltip = ({
  active,
  payload,
  label,
}: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-3 shadow-md">
      <p className="text-[11px] font-semibold text-gray-700">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((item) => {
          const nome = item.name === "receitas" ? "Entradas" : "Saídas";
          const valor = typeof item.value === "number" ? item.value : 0;
          return (
            <div key={String(item.dataKey)} className="flex items-center justify-between gap-4">
              <span className="text-[11px] text-gray-500">{nome}</span>
              <span className="text-[11px] font-medium text-gray-700">
                {formatarMoeda(valor)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};


export default function DashboardPage() {
  // VERSÍO 2.0 - Layout com 3 colunas e Dashboard Financeiro

  const navigate = useNavigate();
  const { usuario, loading: loadingUsuario, isAdminOuMaster, isMaster } = useUsuarioLogado();
  const [loading, setLoading] = useState(true);
  const [notasChecklist, setNotasChecklist] = useState<NotaSistema[]>([]);
  const [loadingNotasChecklist, setLoadingNotasChecklist] = useState(false);
  const [bannerAvatarError, setBannerAvatarError] = useState(false);

  // Insights de IA (oportunidades inteligentes)
  const [insightsIA, setInsightsIA] = useState<OportunidadeIdentificada[]>([]);
  const [loadingInsightsIA, setLoadingInsightsIA] = useState(false);

  // Permissões para módulos do Dashboard - baseadas na configuraçÍo de Planta do Sistema
  const [permissoesDash, setPermissoesDash] = useState({
    financeiro: false,        // dash-financeiro
    checklistCeo: false,      // dash-checklist-ceo (checklist interno)
    contratosAtivos: false,   // dash-contratos-ativos
    agenda: false,            // dash-agenda (Google Calendar)
  });

  // Verificar permissões de todos os módulos do Dashboard quando usuário carregar
  useEffect(() => {
    async function verificarPermissoesDashboard() {
      if (!usuario?.auth_user_id) {
        setPermissoesDash({
          financeiro: false,
          checklistCeo: false,
          contratosAtivos: false,
          agenda: false,
        });
        return;
      }

      // MASTER e ADMIN têm acesso total a todos os dashboards
      if (isAdminOuMaster) {
        setPermissoesDash({
          financeiro: true,
          checklistCeo: true,
          contratosAtivos: true,
          agenda: true,
        });
        if (import.meta.env.DEV) console.log("[DashboardPage] MASTER/ADMIN - Acesso total aos dashboards");
        return;
      }

      try {
        // Verificar permissões em paralelo para melhor performance
        const [financeiro, checklistCeo, contratosAtivos, agenda] = await Promise.all([
          verificarPermissao(usuario.auth_user_id, "dash-financeiro", "pode_visualizar"),
          verificarPermissao(usuario.auth_user_id, "dash-checklist-ceo", "pode_visualizar"),
          verificarPermissao(usuario.auth_user_id, "dash-contratos-ativos", "pode_visualizar"),
          verificarPermissao(usuario.auth_user_id, "dash-agenda", "pode_visualizar"),
        ]);

        setPermissoesDash({
          financeiro,
          checklistCeo,
          contratosAtivos,
          agenda,
        });

        if (import.meta.env.DEV) console.log("[DashboardPage] Permissões Dashboard:", {
          financeiro, checklistCeo, contratosAtivos, agenda
        });
      } catch (error) {
        console.error("[DashboardPage] Erro ao verificar permissões Dashboard:", error);
        setPermissoesDash({
          financeiro: false,
          checklistCeo: false,
          contratosAtivos: false,
          agenda: false,
        });
      }
    }
    verificarPermissoesDashboard();
  }, [usuario?.auth_user_id, isAdminOuMaster]);

  const carregarNotasChecklist = useCallback(async () => {
    if (!usuario?.id || !usuario?.pessoa_id) {
      setNotasChecklist([]);
      return;
    }

    setLoadingNotasChecklist(true);
    try {
      const filtro: FiltroChecklist = isAdminOuMaster ? "todas" : "minhas";
      const notas = await listarNotasHierarquico({
        usuarioId: usuario.id,
        pessoaId: usuario.pessoa_id,
        tipoUsuario: usuario.tipo_usuario,
        filtro,
        authUserId: usuario.auth_user_id,
      });
      setNotasChecklist(notas);
    } catch (error) {
      console.error("Erro ao carregar notas do checklist:", error);
      setNotasChecklist([]);
    } finally {
      setLoadingNotasChecklist(false);
    }
  }, [usuario?.id, usuario?.pessoa_id, usuario?.tipo_usuario, isAdminOuMaster]);

  useEffect(() => {
    if (permissoesDash.checklistCeo) {
      carregarNotasChecklist();
    }
  }, [permissoesDash.checklistCeo, carregarNotasChecklist]);

  // Aliases para compatibilidade
  const podeVerFinanceiro = permissoesDash.financeiro;

  // Dados do financeiro pessoal do CEO
  const { data: dadosPessoais, loading: loadingPessoal } =
    useDashboardPessoal();

  const [metrics, setMetrics] = useState<DashboardMetrics>({
    receitaMes: 0,
    despesaMes: 0,
    receitaAnoAnterior: 0,
    projetosAtivos: 0,
    projetosNovos: 0,
    projetosConcluidos: 0,
    clientesAtivos: 0,
    clientesNovos: 0,
    propostasAbertas: 0,
    propostasAprovadas: 0,
    valorPropostas: 0,
    contratosAtivos: 0,
    contratosConcluidos: 0,
    valorContratos: 0,
    nucleoArquitetura: 0,
    nucleoEngenharia: 0,
    nucleoMarcenaria: 0,
    despesaDesigner: 0,
    despesaArquitetura: 0,
    despesaEngenharia: 0,
    despesaMarcenaria: 0,
    categoriasDespesaMes: 0,
    tarefasTotais: 0,
    tarefasConcluidas: 0,
  });


  // Frase motivacional do dia
  const [fraseDoDia, setFraseDoDia] = useState<FraseMotivacional | null>(null);

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [periodoFluxoFinanceiro, setPeriodoFluxoFinanceiro] =
    useState<PeriodoFluxoFinanceiro>("all");
  const [fluxoMensalCompleto, setFluxoMensalCompleto] = useState<
    Array<{ mes: string; entrada: number; saida: number; saldo: number }>
  >([]);
  const [resumoFinanceiroCards, setResumoFinanceiroCards] =
    useState<ResumoFinanceiroCards>({
      saldoTotal: 0,
      receitasTotal: 0,
      custosTotal: 0,
      contratosAtivos: 0,
      valorContratosAtivos: 0,
      contratosConcluidos: 0,
      categoriasCustos: 0,
    });

  // Clientes com contratos ativos (para mostrar na seçÍo de Contratos Ativos)
  const [clientesAtivos, setClientesAtivos] = useState<ClienteAtivo[]>([]);
  const [copiado, setCopiado] = useState<string | null>(null);
  const [kpiAudit, setKpiAudit] = useState<DashboardKpiAudit | null>(null);

  const dadosMensais = useMemo(() => {
    if (!fluxoMensalCompleto.length) return [];
    const dados = fluxoMensalCompleto;
    let filtrado = dados;
    if (periodoFluxoFinanceiro === "3m") filtrado = dados.slice(-3);
    if (periodoFluxoFinanceiro === "6m") filtrado = dados.slice(-6);
    if (periodoFluxoFinanceiro === "12m") filtrado = dados.slice(-12);
    if (periodoFluxoFinanceiro === "ytd") {
      const mesAtual = new Date().getMonth() + 1;
      filtrado = dados.slice(-mesAtual);
    }
    return filtrado.map((item) => ({
      mes: item.mes,
      receitas: Math.round(item.entrada),
      despesas: Math.round(item.saida),
    }));
  }, [fluxoMensalCompleto, periodoFluxoFinanceiro]);

  // SaudaçÍo baseada na hora
  const saudacao = useMemo(() => {
    const hora = new Date().getHours();
    if (hora >= 5 && hora < 12)
      return { texto: "Bom dia", icon: Sun, cor: "text-amber-400" };
    if (hora >= 12 && hora < 18)
      return { texto: "Boa tarde", icon: Sunset, cor: "text-orange-400" };
    return { texto: "Boa noite", icon: Moon, cor: "text-indigo-400" };
  }, []);

  // Data formatada
  const dataHoje = useMemo(() => {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(new Date());
  }, []);

  // Redirecionar usuários restritos
  useEffect(() => {
    if (!loadingUsuario && usuario?.tipo_usuario) {
      const redirectPath = REDIRECT_POR_TIPO[usuario.tipo_usuario];
      if (redirectPath) {
        navigate(redirectPath, { replace: true });
      }
    }
  }, [usuario?.tipo_usuario, loadingUsuario, navigate]);

  // Carregar dados reais do Supabase
  useEffect(() => {
    async function carregarDados() {
      if (loadingUsuario) return;
      if (!usuario) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Datas para filtros
        const hoje = new Date();
        const getMonthRange = (dataBase: Date) => {
          const inicio = new Date(
            dataBase.getFullYear(),
            dataBase.getMonth(),
            1
          );
          const proximoMes = new Date(
            dataBase.getFullYear(),
            dataBase.getMonth() + 1,
            1
          );
          return {
            inicio: inicio.toISOString(),
            fim: proximoMes.toISOString(),
          };
        };
        const { inicio: inicioMes, fim: fimMes } = getMonthRange(hoje);
        const { inicio: inicioMesAnoAnterior, fim: fimMesAnoAnterior } =
          getMonthRange(new Date(hoje.getFullYear() - 1, hoje.getMonth(), 1));

        // Buscar todas as métricas em paralelo
        const [
          clientesResult,
          propostasResult,
          contratosResult,
          projetosResult,
          obrasResult,
          tarefasResult,
        ] = await Promise.all([
          // Clientes ativos
          supabase
            .from("pessoas")
            .select("id, criado_em, ativo", { count: "exact" })
            .eq("tipo", "CLIENTE"),
          // Propostas
          supabase
            .from("propostas")
            .select("id, status, valor_total, criado_em"),
          // Contratos com dados do cliente e obra (para minicards)
          supabase.from("contratos").select(`
            id, status, valor_total, unidade_negocio,
            dados_imovel_json,
            cliente:cliente_id (
              id, nome, foto_url, avatar_url, telefone, email
            )
          `),
          // Projetos
          supabase.from("projetos").select("id, status, nucleo, created_at"),
          // Obras
          supabase.from("obras").select("id, status, nucleo_id"),
          // Tarefas do cronograma (para status geral)
          supabase
            .from("cronograma_tarefas")
            .select("id, status")
            .gte(
              "data_inicio",
              new Date(hoje.getFullYear(), hoje.getMonth(), 1)
                .toISOString()
                .split("T")[0]
            ),
        ]);

        // Calcular métricas
        const clientes = clientesResult.data || [];
        const propostas = propostasResult.data || [];
        const contratos = contratosResult.data || [];
        const projetos = projetosResult.data || [];
        const obras = obrasResult.data || [];
        const todosLancamentos = await carregarTodosLancamentosFinanceiros();
        const normalizar = (texto?: string | null) =>
          String(texto || "")
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "");

        // Bloco financeiro principal: mesma lógica do FinanceiroDashboardNew
        const transacoes = (todosLancamentos || [])
          .map((l: any) => ({
            valor_total: Number(l.valor_total || 0),
            tipo: String(l.tipo || ""),
            data_competencia: String(
              l.data_competencia || l.vencimento || l.created_at || ""
            ),
            categoria_id: l.categoria_id || null,
            unidade_negocio: l.unidade_negocio || null,
            nucleo: l.nucleo || null,
            descricao: String(l.descricao || ""),
            status: l.status || null,
          }))
          .filter((t) => Boolean(t.data_competencia));

        const totalEntradas = transacoes
          .filter((t) => t.tipo === "entrada")
          .reduce((acc, t) => acc + Number(t.valor_total), 0);
        const totalSaidas = transacoes
          .filter((t) => t.tipo === "saida")
          .reduce((acc, t) => acc + Number(t.valor_total), 0);

        const categoriasConfig = [
          {
            termos: ["mao de obra", "salario", "equipe", "funcionario"],
          },
          {
            termos: ["servico", "instalacao", "montagem", "execucao"],
          },
          {
            termos: ["produto", "equipamento", "movel", "eletrodomestico"],
          },
          {
            termos: ["material", "insumo", "materia", "madeira", "ferragem"],
          },
        ];

        const totalCategoriasCusto = categoriasConfig.reduce((acc, categoria) => {
          const termos = categoria.termos.map((termo) => normalizar(termo));
          const valorCategoria = transacoes
            .filter((t) => t.tipo === "saida")
            .filter((t) => {
              const desc = normalizar(t.descricao);
              const catId = normalizar(String(t.categoria_id || ""));
              return termos.some(
                (termo) => desc.includes(termo) || catId.includes(termo)
              );
            })
            .reduce((total, t) => total + Number(t.valor_total), 0);
          return acc + (valorCategoria > 0 ? 1 : 0);
        }, 0);

        const contratosAtivosFinanceiro = contratos.filter((c: any) => {
          const status = normalizar(c.status);
          return !["rascunho", "concluido", "cancelado"].includes(status);
        });
        const valorContratosAtivosFinanceiro = contratosAtivosFinanceiro.reduce(
          (acc: number, c: any) => acc + Number(c.valor_total || 0),
          0
        );
        const contratosConcluidosSistema = contratos.filter((c: any) =>
          ["concluido", "finalizado", "entregue"].includes(normalizar(c.status))
        ).length;
        const clientesHistoricoAtivos = clientes.filter(
          (c: any) => c.ativo !== false
        ).length;
        const contratosConcluidosFinanceiro =
          clientesHistoricoAtivos + contratosConcluidosSistema;

        setResumoFinanceiroCards({
          saldoTotal: totalEntradas - totalSaidas,
          receitasTotal: totalEntradas,
          custosTotal: totalSaidas,
          contratosAtivos: contratosAtivosFinanceiro.length,
          valorContratosAtivos: valorContratosAtivosFinanceiro,
          contratosConcluidos: contratosConcluidosFinanceiro,
          categoriasCustos: totalCategoriasCusto,
        });

        const fluxoPorMes = new Map<
          string,
          { mes: string; entrada: number; saida: number; dataBase: Date }
        >();
        transacoes.forEach((t) => {
          const data = new Date(t.data_competencia);
          if (Number.isNaN(data.getTime())) return;
          const chave = `${data.getFullYear()}-${String(
            data.getMonth() + 1
          ).padStart(2, "0")}`;
          const atual = fluxoPorMes.get(chave) || {
            mes: data.toLocaleString("pt-BR", { month: "short" }),
            entrada: 0,
            saida: 0,
            dataBase: new Date(data.getFullYear(), data.getMonth(), 1),
          };
          if (t.tipo === "entrada") atual.entrada += Number(t.valor_total);
          else if (t.tipo === "saida") atual.saida += Number(t.valor_total);
          fluxoPorMes.set(chave, atual);
        });

        let saldoAcumulado = 0;
        const fluxoOrdenado = Array.from(fluxoPorMes.values())
          .sort((a, b) => a.dataBase.getTime() - b.dataBase.getTime())
          .map((item) => {
            saldoAcumulado += item.entrada - item.saida;
            return {
              mes: item.mes,
              entrada: item.entrada,
              saida: item.saida,
              saldo: saldoAcumulado,
            };
          });
        setFluxoMensalCompleto(fluxoOrdenado);

        // Clientes novos este mês
        const clientesNovosMes = clientes.filter(
          (c) => c.criado_em && new Date(c.criado_em) >= new Date(inicioMes)
        ).length;

        // Propostas
        const propostasAbertas = propostas.filter(
          (p) => p.status === "rascunho" || p.status === "enviada"
        ).length;
        const propostasAprovadas = propostas.filter(
          (p) => p.status === "aprovada"
        ).length;
        const valorPropostas = propostas
          .filter((p) => p.status === "aprovada")
          .reduce((acc, p) => acc + (p.valor_total || 0), 0);

        // Contratos - status ativos: ativo, em_execucao, assinado, aguardando, em_andamento
        const statusAtivos = new Set([
          "ativo",
          "em_execucao",
          "assinado",
          "aguardando",
          "em_andamento",
        ]);
        const contratosAtivosFiltered = contratos.filter(
          (c) => statusAtivos.has(c.status)
        );
        const contratosAtivosCount = contratosAtivosFiltered.length;
        const valorContratos = contratosAtivosFiltered.reduce(
          (acc, c) => acc + (c.valor_total || 0),
          0
        );

        const contratosPorId = new Map(contratos.map((c) => [c.id, c]));

        const criarClienteAtivo = (payload: {
          id?: string;
          nome?: string;
          contratoId?: string;
          nucleo?: string | null;
          telefone?: string | null;
          email?: string | null;
          enderecoObra?: string | null;
          horarioSegSex?: string | null;
          horarioSabado?: string | null;
          observacoes?: string | null;
          foto?: string | null;
          avatar?: string | null;
          dadosImovel?: ContratoDadosImovel | null;
          condominioNome?: string | null;
          condominioContato?: string | null;
        }): ClienteAtivo => {
          const contratoBase = payload.contratoId
            ? contratosPorId.get(payload.contratoId)
            : undefined;
          const dadosExtra = contratoBase
            ? parseDadosImovelJson(
                (contratoBase as { dados_imovel_json?: unknown })
                  .dados_imovel_json
              )
            : null;
          return {
            id: payload.id || "",
            nome: payload.nome || "Cliente",
            foto_url: payload.foto || null,
            avatar_url: payload.avatar || null,
            contrato_id: payload.contratoId || "",
            nucleo: payload.nucleo || null,
            telefone: payload.telefone ?? null,
            email: payload.email ?? null,
            endereco_obra: payload.enderecoObra ?? null,
            horario_seg_sex: payload.horarioSegSex ?? "",
            horario_sabado: payload.horarioSabado ?? "",
            observacoes: payload.observacoes ?? "",
            dadosImovel: payload.dadosImovel ?? dadosExtra,
            condominio_nome: payload.condominioNome ?? null,
            condominio_contato: payload.condominioContato ?? null,
          };
        };

        // Extrair clientes ativos com fallback em view/RPC para nÍo quebrar com RLS
        let clientesComContrato: ClienteAtivo[] = [];
        let fonteContratosAtivos = "query:contratos";

        // 1) RPC obter_contratos_ativos_hoje (SECURITY DEFINER)
        const contratosAtivosRPC = await supabase.rpc(
          "obter_contratos_ativos_hoje"
        );
        if (contratosAtivosRPC.data && contratosAtivosRPC.data.length > 0) {
          fonteContratosAtivos = "rpc:obter_contratos_ativos_hoje";
          clientesComContrato = contratosAtivosRPC.data.map((c: any) =>
            criarClienteAtivo({
              id: c.cliente_id || c.id || "",
              nome: c.cliente_nome || "Cliente",
              contratoId: c.id,
              nucleo: c.unidade_negocio || null,
              telefone: c.cliente_telefone || null,
              email: c.cliente_email || null,
              enderecoObra: c.endereco_obra || null,
              horarioSegSex: c.horario_seg_sex || "",
              horarioSabado: c.horario_sabado || "",
              observacoes: c.observacoes || "",
              foto: c.cliente_foto_url || null,
              avatar: c.cliente_avatar_url || null,
              condominioNome: c.condominio_nome || null,
              condominioContato: c.condominio_contato || null,
            })
          );
        }

        // 2) View consolidada se RPC vier vazio
        if (clientesComContrato.length === 0) {
          const contratosView = await supabase
            .from("vw_contratos_completo")
            .select(
              "id, cliente_id, cliente_nome, cliente_email, cliente_telefone, unidade_negocio, oportunidade_titulo, dados_imovel_json"
            )
            .in("status", ["ativo", "em_execucao", "assinado", "em_andamento", "aguardando"]);

          if (contratosView.data && contratosView.data.length > 0) {
            fonteContratosAtivos = "view:vw_contratos_completo";
            clientesComContrato = contratosView.data.map((c: any) => {
              const dadosImovel = parseDadosImovelJson(c.dados_imovel_json);
              return criarClienteAtivo({
                id: c.cliente_id || c.id || "",
                nome: c.cliente_nome || "Cliente",
                contratoId: c.id,
                nucleo: c.unidade_negocio || null,
                telefone: c.cliente_telefone || null,
                email: c.cliente_email || null,
                enderecoObra: dadosImovel?.endereco_completo || c.oportunidade_titulo || null,
                dadosImovel,
              });
            });
          }
        }

        // 3) Fallback final: usar contratos carregados (se RLS permitir)
        if (clientesComContrato.length === 0) {
          fonteContratosAtivos = "query:contratos";
          clientesComContrato = contratosAtivosFiltered
            .filter((c) => c.cliente)
            .map((c) => {
              const dadosImovel = parseDadosImovelJson(
                (c as { dados_imovel_json?: unknown }).dados_imovel_json
              );
              const enderecoObra = formatEnderecoCurto(dadosImovel);
              return criarClienteAtivo({
                id: (c.cliente as { id?: string })?.id || "",
                nome: (c.cliente as { nome?: string })?.nome || "Cliente",
                contratoId: c.id,
                nucleo: (c as { unidade_negocio?: string | null }).unidade_negocio || null,
                telefone: (c.cliente as { telefone?: string | null })?.telefone || null,
                email: (c.cliente as { email?: string | null })?.email || null,
                enderecoObra,
                horarioSegSex: "",
                horarioSabado: "",
                observacoes: "",
                foto: (c.cliente as { foto_url?: string | null })?.foto_url || null,
                avatar: (c.cliente as { avatar_url?: string | null })?.avatar_url || null,
                dadosImovel,
              });
            });
        }

        const contratosAtivosMap = new Map(
          contratosAtivosFiltered.map((c) => [c.id, c])
        );

        clientesComContrato = clientesComContrato.map((cliente) => {
          if (cliente.dadosImovel) return cliente;
          const contratoExtra = contratosAtivosMap.get(cliente.contrato_id);
          if (!contratoExtra) return cliente;
          return {
            ...cliente,
            dadosImovel: parseDadosImovelJson(
              (contratoExtra as { dados_imovel_json?: unknown }).dados_imovel_json
            ),
          };
        });

        const clientesAtivosUnicosMap = new Map<string, ClienteAtivo>();
        for (const cliente of clientesComContrato) {
          const key = (cliente.id && cliente.id.trim()) || `${cliente.nome}::${cliente.email || cliente.telefone || cliente.contrato_id}`;
          const atual = clientesAtivosUnicosMap.get(key);
          if (!atual) {
            clientesAtivosUnicosMap.set(key, cliente);
            continue;
          }
          // Prefere manter o registro mais completo para exibiçÍo no card
          const atualScore = Number(Boolean(atual.dadosImovel)) + Number(Boolean(atual.endereco_obra));
          const novoScore = Number(Boolean(cliente.dadosImovel)) + Number(Boolean(cliente.endereco_obra));
          if (novoScore > atualScore) {
            clientesAtivosUnicosMap.set(key, cliente);
          }
        }
        const clientesAtivosUnicos = Array.from(clientesAtivosUnicosMap.values());

        // Limitar a 12 para caber no grid
        setClientesAtivos(clientesAtivosUnicos.slice(0, 12));

        const contratosAtivosReaisCount =
          clientesComContrato.length > 0
            ? clientesComContrato.length
            : contratosAtivosCount;

        const clientesAtivosIds = new Set(
          clientesAtivosUnicos
            .map((cliente) => cliente.id)
            .filter((id) => typeof id === "string" && id.trim().length > 0)
        );

        const clientesAtivosReaisCount =
          clientesAtivosIds.size > 0
            ? clientesAtivosIds.size
            : new Set(
                contratosAtivosFiltered
                  .map((c) => (c.cliente as { id?: string } | null)?.id)
                  .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
              ).size || contratosAtivosReaisCount;

        // Por núcleo (usando apenas contratos ativos)
        const nucleoArq = contratosAtivosFiltered.filter(
          (c) => (c as any).unidade_negocio?.toLowerCase() === "arquitetura"
        ).length;
        const nucleoEng = contratosAtivosFiltered.filter(
          (c) => (c as any).unidade_negocio?.toLowerCase() === "engenharia"
        ).length;
        const nucleoMarc = contratosAtivosFiltered.filter(
          (c) => (c as any).unidade_negocio?.toLowerCase() === "marcenaria"
        ).length;

        // Projetos
        const projetosAtivos = projetos.filter(
          (p) => p.status === "em_andamento" || p.status === "ativo"
        ).length;
        const projetosConcluidos = projetos.filter(
          (p) => p.status === "concluido"
        ).length;
        const projetosNovos = projetos.filter(
          (p) => p.created_at && new Date(p.created_at) >= new Date(inicioMes)
        ).length;

        // Helper para verificar se é receita
        // Tipos válidos: 'entrada' (principal), 'receita_cliente', ou natureza = 'RECEITA'
        const isReceita = (l: any) =>
          l.tipo === "entrada" ||
          l.tipo?.toLowerCase()?.includes("receita") ||
          l.natureza === "RECEITA" ||
          l.tipo === "receita_cliente";

        // Helper para verificar se é despesa
        // Tipos válidos: 'saida' (principal), ou natureza = 'DESPESA'
        const isDespesa = (l: any) =>
          l.tipo === "saida" ||
          l.tipo?.toLowerCase()?.includes("despesa") ||
          l.natureza === "DESPESA" ||
          l.tipo === "despesa_fornecedor" ||
          l.tipo === "despesa_operacional";

        // Helper para obter data do lançamento (prioriza data_competencia)
        const getDataLancamento = (l: any) => {
          const dataStr = l.data_competencia || l.vencimento || l.created_at;
          return dataStr ? new Date(dataStr) : null;
        };

        // Helper para verificar se está no período
        const estaNoMes = (l: any, inicio: string, fim: string) => {
          const data = getDataLancamento(l);
          if (!data) return false;
          return data >= new Date(inicio) && data < new Date(fim);
        };

        // Calcular receitas do mês atual
        const receitaMes = todosLancamentos
          .filter((l: any) => isReceita(l) && estaNoMes(l, inicioMes, fimMes))
          .reduce((acc: number, r: any) => acc + (Number(r.valor_total) || 0), 0);

        // Calcular receitas do mesmo mês ano anterior
        const receitaAnoAnterior = todosLancamentos
          .filter((l: any) => isReceita(l) && estaNoMes(l, inicioMesAnoAnterior, fimMesAnoAnterior))
          .reduce((acc: number, r: any) => acc + (Number(r.valor_total) || 0), 0);

        // Calcular despesas do mês atual
        const despesaMes = todosLancamentos
          .filter((l: any) => isDespesa(l) && estaNoMes(l, inicioMes, fimMes))
          .reduce((acc: number, d: any) => acc + (Number(d.valor_total) || 0), 0);

        // Log detalhado para debug
        if (import.meta.env.DEV) console.log("[Dashboard] ================== DEBUG ==================");
        if (import.meta.env.DEV) console.log("[Dashboard] Usuário autenticado:", usuario?.email);
        if (import.meta.env.DEV) console.log("[Dashboard] Clientes carregados:", clientes.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Propostas carregadas:", propostas.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Contratos carregados:", contratos.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Contratos ativos (filtrados):", contratosAtivosCount);
        if (import.meta.env.DEV) console.log("[Dashboard] Projetos carregados:", projetos.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Obras carregadas:", obras.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Lançamentos encontrados:", todosLancamentos.length);
        if (import.meta.env.DEV) console.log("[Dashboard] Tipos de lançamentos:", [...new Set(todosLancamentos.map((l: any) => l.tipo))]);
        if (import.meta.env.DEV) console.log("[Dashboard] Receitas do mês:", receitaMes);
        if (import.meta.env.DEV) console.log("[Dashboard] Despesas do mês:", despesaMes);
        if (import.meta.env.DEV) console.log("[Dashboard] ============================================");

        // Contratos concluídos
        const contratosConcluidos = contratos.filter(
          (c) =>
            c.status === "concluido" ||
            c.status === "finalizado" ||
            c.status === "encerrado"
        ).length;

        // Despesas por núcleo (calcular do financeiro_lancamentos já carregados)
        const despesasDoMes = todosLancamentos
          .filter((d: any) => isDespesa(d) && estaNoMes(d, inicioMes, fimMes));

        const despesaDesigner = despesasDoMes
          .filter((d: any) => d.nucleo?.toLowerCase()?.includes("designer"))
          .reduce((acc: number, d: any) => acc + (Number(d.valor_total) || 0), 0);
        const despesaArquitetura = despesasDoMes
          .filter((d: any) => d.nucleo?.toLowerCase()?.includes("arquitetura"))
          .reduce((acc: number, d: any) => acc + (Number(d.valor_total) || 0), 0);
        const despesaEngenharia = despesasDoMes
          .filter((d: any) => d.nucleo?.toLowerCase()?.includes("engenharia"))
          .reduce((acc: number, d: any) => acc + (Number(d.valor_total) || 0), 0);
        const despesaMarcenaria = despesasDoMes
          .filter((d: any) => d.nucleo?.toLowerCase()?.includes("marcenaria"))
          .reduce((acc: number, d: any) => acc + (Number(d.valor_total) || 0), 0);
        const categoriasDespesaMes = new Set(
          despesasDoMes
            .map((d: any) =>
              String(d.categoria || d.nucleo || "").trim().toLowerCase()
            )
            .filter((categoria: string) => categoria.length > 0)
        ).size;

        if (import.meta.env.DEV) console.log("[Dashboard] Despesas por núcleo:", {
          designer: despesaDesigner,
          arquitetura: despesaArquitetura,
          engenharia: despesaEngenharia,
          marcenaria: despesaMarcenaria,
        });
        const auditPayload: DashboardKpiAudit = {
          clientesAtivosFonte: fonteContratosAtivos,
          contratosAtivosFonte: fonteContratosAtivos,
          financeiroFonte: "api:listarFinanceiro",
          categoriasDespesaFonte: "api:listarFinanceiro(categoria|nucleo)",
          atualizadoEm: new Date().toISOString(),
          contratosAtivosCount: contratosAtivosReaisCount,
          clientesAtivosCount: clientesAtivosReaisCount,
          categoriasDespesaMes,
        };
        setKpiAudit(auditPayload);
        if (import.meta.env.DEV) {
          if (import.meta.env.DEV) console.log("[Dashboard][AUDITORIA_KPI]", auditPayload);
        }

        // Tarefas para status geral (sprint do mês)
        const tarefas = tarefasResult.data || [];
        const tarefasTotais = tarefas.length;
        const tarefasConcluidas = tarefas.filter(
          (t: any) =>
            t.status === "concluido" ||
            t.status === "concluída" ||
            t.status === "done"
        ).length;

        setMetrics({
          receitaMes,
          despesaMes,
          receitaAnoAnterior,
          projetosAtivos:
            projetosAtivos ||
            obras.filter((o) => o.status === "andamento").length,
          projetosNovos,
          projetosConcluidos,
          clientesAtivos: clientesAtivosReaisCount,
          clientesNovos: clientesNovosMes,
          propostasAbertas,
          propostasAprovadas,
          valorPropostas,
          contratosAtivos: contratosAtivosReaisCount,
          contratosConcluidos,
          valorContratos,
          nucleoArquitetura: nucleoArq,
          nucleoEngenharia: nucleoEng,
          nucleoMarcenaria: nucleoMarc,
          despesaDesigner,
          despesaArquitetura,
          despesaEngenharia,
          despesaMarcenaria,
          categoriasDespesaMes,
          tarefasTotais,
          tarefasConcluidas,
        });
        // Alertas baseados em dados reais
        const novosAlertas: Alerta[] = [];
        if (propostasAbertas > 5) {
          novosAlertas.push({
            id: "1",
            tipo: "atencao",
            mensagem: `${propostasAbertas} propostas aguardando aprovaçÍo`,
            acao: "Revisar",
            link: "/propostas",
          });
        }
        if (despesaMes > receitaMes * 0.8) {
          novosAlertas.push({
            id: "2",
            tipo: "urgente",
            mensagem: "Despesas acima de 80% das receitas",
            acao: "Analisar",
            link: "/financeiro",
          });
        }
        if (clientesNovosMes > 0) {
          novosAlertas.push({
            id: "3",
            tipo: "info",
            mensagem: `${clientesNovosMes} novos clientes este mês`,
            acao: "Ver",
            link: "/pessoas/clientes",
          });
        }
        setAlertas(novosAlertas);

        // Carregar insights de IA em background (nÍo bloqueia o loading principal)
        if (isAdminOuMaster && usuario) {
          setLoadingInsightsIA(true);
          const eid = usuario.empresa_id || usuario.id;
          identificarOportunidadesInteligentes(eid)
            .then(result => result && setInsightsIA((result.oportunidades || []).slice(0, 5)))
            .catch(() => setInsightsIA([]))
            .finally(() => setLoadingInsightsIA(false));
        }

        // Carregar eventos reais do cronograma (próximos 14 dias)
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + 14);

        const { data: _tarefasCronograma } = await supabase
          .from("cronograma_tarefas")
          .select(
            `
            id,
            titulo,
            data_termino,
            prioridade,
            nucleo,
            projeto:projetos(nome)
          `
          )
          .gte("data_termino", hoje.toISOString().split("T")[0])
          .lte("data_termino", dataLimite.toISOString().split("T")[0])
          .not("status", "in", '("concluido","cancelado")')
          .order("data_termino", { ascending: true })
          .limit(7);

        // Carregar frase do dia
        const frase = await obterFraseDoDiaComFallback();
        setFraseDoDia(frase);
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, loadingUsuario]);

  // Status Geral - percentual de tarefas concluídas no mês
  const statusGeral = useMemo(() => {
    if (metrics.tarefasTotais === 0) return 0;
    return Math.round(
      (metrics.tarefasConcluidas / metrics.tarefasTotais) * 100
    );
  }, [metrics.tarefasTotais, metrics.tarefasConcluidas]);

  // Despesas por núcleo - calcular percentual relativo ao total
  const despesasNucleoPercent = useMemo(() => {
    const total =
      metrics.despesaDesigner +
      metrics.despesaArquitetura +
      metrics.despesaEngenharia +
      metrics.despesaMarcenaria;
    if (total === 0)
      return { designer: 0, arquitetura: 0, engenharia: 0, marcenaria: 0 };
    return {
      designer: Math.round((metrics.despesaDesigner / total) * 100),
      arquitetura: Math.round((metrics.despesaArquitetura / total) * 100),
      engenharia: Math.round((metrics.despesaEngenharia / total) * 100),
      marcenaria: Math.round((metrics.despesaMarcenaria / total) * 100),
    };
  }, [
    metrics.despesaDesigner,
    metrics.despesaArquitetura,
    metrics.despesaEngenharia,
    metrics.despesaMarcenaria,
  ]);

  const gridColsClass = getGridColsClass(
    [
      permissoesDash.contratosAtivos,
      permissoesDash.agenda,
      permissoesDash.checklistCeo,
    ].filter(Boolean).length
  );

  const renderNotasChecklist = () => {
    if (loadingNotasChecklist) {
      return (
        <div className={`flex items-center justify-center py-6 text-gray-400 ${TYPOGRAPHY.bodySmall}`}>
          <Loader2 className="w-4 h-4 animate-spin mr-2" />
          Carregando notas...
        </div>
      );
    }

    if (notasChecklist.length === 0) {
      return (
        <div className={`${TYPOGRAPHY.bodySmall} text-gray-500`}>
          Nenhuma nota criada ainda.
        </div>
      );
    }

    return notasChecklist.slice(0, 5).map((nota) => {
      const totalItens = nota.itens?.length || 0;
      const itensConcluidos = nota.itens?.filter((item) => item.checked).length || 0;
      const pendentes = Math.max(0, totalItens - itensConcluidos);
      const descricao = nota.descricao?.trim();
      let descricaoCurta = descricao;
      if (descricao && descricao.length > 80) {
        descricaoCurta = `${descricao.slice(0, 80)}...`;
      }
      const dataAtualizacao = nota.atualizado_em
        ? new Date(nota.atualizado_em).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
          })
        : "";

      return (
        <button
          key={nota.id}
          type="button"
          onClick={() => navigate(`/criacao-checklist?nota=${nota.id}`)}
          className="w-full text-left flex items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 hover:bg-gray-100 transition-colors"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${getNotaCorClass(nota.cor)}`}
              />
              <p className={`${TYPOGRAPHY.cardTitle} font-medium truncate`}>
                {nota.titulo}
              </p>
              {nota.vinculo_tipo === "cliente" && (
                <span className={`${TYPOGRAPHY.badgeSmall} uppercase tracking-wide text-emerald-600 bg-emerald-50`}>
                  Cliente
                </span>
              )}
            </div>
            <div className={`${TYPOGRAPHY.cardMeta} mt-1`}>
              {itensConcluidos}/{totalItens} itens concluídos
              {dataAtualizacao && ` • ${dataAtualizacao}`}
            </div>
            <div className={`${TYPOGRAPHY.cardMeta} mt-1`}>
              {descricaoCurta || `${pendentes} itens pendentes`}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400" />
        </button>
      );
    });
  };

  const renderAlertasPessoais = () => {
    if (!dadosPessoais) return null;

    if (dadosPessoais.lancamentos_vencidos > 0) {
      return (
        <div className={`flex items-center gap-2 text-red-600 ${TYPOGRAPHY.bodySmall}`}>
          <Clock className="w-3 h-3" />
          <strong>{dadosPessoais.lancamentos_vencidos}</strong> vencido(s)
        </div>
      );
    }

    if (dadosPessoais.lancamentos_pendentes > 0) {
      return (
        <div className={`flex items-center gap-2 text-amber-600 ${TYPOGRAPHY.bodySmall}`}>
          <Clock className="w-3 h-3" />
          <strong>{dadosPessoais.lancamentos_pendentes}</strong> pendente(s)
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-2 text-emerald-600 ${TYPOGRAPHY.bodySmall}`}>
        <CheckCircle2 className="w-3 h-3" />
        Tudo em dia!
      </div>
    );
  };

  const renderPessoalContent = () => {
    if (loadingPessoal) {
      return (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 animate-pulse rounded-xl"
            />
          ))}
        </div>
      );
    }

    if (!dadosPessoais) {
      return (
        <div className="text-center py-6">
          <Wallet className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className={`${TYPOGRAPHY.bodySmall} text-gray-500`}>Dados nÍo disponíveis</p>
          <button
            type="button"
            onClick={() => navigate("/meu-financeiro")}
            className={`mt-2 text-orange-600 hover:text-orange-700 ${TYPOGRAPHY.bodySmall}`}
          >
            Configurar finanças pessoais
          </button>
        </div>
      );
    }

    return (
      <>
        {/* KPIs Pessoais - 2x2 grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Saldo Total */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-600 to-orange-500">
            <div className="flex items-center gap-1 mb-1">
              <Wallet className="w-3 h-3 text-white/80" />
              <span className={`${TYPOGRAPHY.statLabel} text-white/80`}>
                Saldo Total
              </span>
            </div>
            <p className={`${TYPOGRAPHY.statNumber} text-white`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(dadosPessoais.saldo_total)}
            </p>
          </div>

          {/* Receitas do Mês */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400">
            <div className="flex items-center gap-1 mb-1">
              <ArrowUpCircle className="w-3 h-3 text-white/80" />
              <span className={`${TYPOGRAPHY.statLabel} text-white/80`}>Receitas</span>
            </div>
            <p className={`${TYPOGRAPHY.statNumber} text-white`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(dadosPessoais.receitas_mes)}
            </p>
          </div>

          {/* Despesas do Mês */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-orange-400 to-amber-400">
            <div className="flex items-center gap-1 mb-1">
              <ArrowDownCircle className="w-3 h-3 text-white/80" />
              <span className={`${TYPOGRAPHY.statLabel} text-white/80`}>Despesas</span>
            </div>
            <p className={`${TYPOGRAPHY.statNumber} text-white`}>
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(dadosPessoais.despesas_mes)}
            </p>
          </div>

          {/* Balanço do Mês */}
          <div className="p-3 rounded-xl bg-gradient-to-br from-amber-400 to-amber-300">
            <div className="flex items-center gap-1 mb-1">
              {dadosPessoais.balanco_mes >= 0 ? (
                <TrendingUp className="w-3 h-3 text-white/80" />
              ) : (
                <TrendingDown className="w-3 h-3 text-white/80" />
              )}
              <span className={`${TYPOGRAPHY.statLabel} text-white/80`}>Balanço</span>
            </div>
            <p
              className={`${TYPOGRAPHY.statNumber} ${
                dadosPessoais.balanco_mes >= 0
                  ? "text-white"
                  : "text-red-600"
              }`}
            >
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
                notation: "compact",
              }).format(dadosPessoais.balanco_mes)}
            </p>
          </div>
        </div>

        {/* Alertas compactos */}
        <div className="p-2 bg-gray-50 rounded-xl border border-gray-100">
          {renderAlertasPessoais()}
        </div>
      </>
    );
  };

  if (loading || loadingUsuario) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Banner skeleton */}
          <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl py-5 px-6 flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-700 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-5 w-48 bg-slate-700 rounded animate-pulse" />
              <div className="h-3 w-32 bg-slate-700/60 rounded animate-pulse" />
            </div>
          </div>
          {/* KPI cards skeleton */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse" />
                </div>
                <div className="h-7 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-3 w-20 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-3 h-64">
                <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="space-y-2">
                  {[1,2,3,4].map(j => (
                    <div key={j} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        {/* ====== BANNER HEADER (Compacto -15%) ====== */}
        <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl py-3 px-4 sm:py-4 sm:px-5 lg:py-5 lg:px-6 shadow-lg">
          {/* Linha principal: Avatar/Nome | Frase Central | Status Geral */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* ESQUERDA: Avatar + Nome */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Avatar do usuário */}
              <div className="relative">
                <div className="w-14 h-14 lg:w-16 lg:h-16 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {(usuario?.avatar_url || usuario?.foto_url) && !bannerAvatarError ? (
                    <img
                      src={usuario.avatar_url || usuario.foto_url || ""}
                      alt={usuario?.nome || "Usuário"}
                      className="w-full h-full object-cover"
                      onError={() => setBannerAvatarError(true)}
                    />
                  ) : (
                    <span className={`${TYPOGRAPHY.statNumber} text-white`}>
                      {usuario?.nome?.charAt(0) || "W"}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-slate-800">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>

              <div>
                <p className={`${TYPOGRAPHY.overline} text-gray-400 mb-0.5`}>
                  WG Easy · Dashboard Executivo
                </p>
                <div className="flex items-center gap-1.5">
                  <saudacao.icon className={`w-4 h-4 ${saudacao.cor}`} />
                  <h1 className={`${TYPOGRAPHY.pageTitle} text-white`}>
                    {saudacao.texto},{" "}
                    <span className="font-normal text-orange-400">
                      {usuario?.nome?.split(" ")[0] || "CEO"}
                    </span>
                  </h1>
                </div>
                <p className={`${TYPOGRAPHY.caption} text-gray-400 capitalize`}>{dataHoje}</p>
              </div>
            </div>

            {/* CENTRO: Frase motivacional */}
            {fraseDoDia && (
              <div className="flex-1 flex justify-center">
                <div className="flex items-center gap-2 max-w-lg bg-slate-700/30 rounded-lg px-4 py-2 border border-slate-600/30">
                  <Quote className="w-3.5 h-3.5 text-orange-400/80 flex-shrink-0" />
                  <p className={`${TYPOGRAPHY.bodySmall} text-gray-200 italic text-center`}>
                    "{fraseDoDia.frase}"{" "}
                    <span className={`${TYPOGRAPHY.caption} text-gray-400 not-italic`}>
                      — {fraseDoDia.autor}
                    </span>
                  </p>
                </div>
              </div>
            )}

            {/* DIREITA: Status Geral */}
            <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600/50 w-full sm:min-w-[160px] sm:w-auto flex-shrink-0">
              <p className={`${TYPOGRAPHY.overline} text-gray-400 mb-0.5`}>
                Status Geral
              </p>
              <p className={`${TYPOGRAPHY.statNumber} text-white`}>{statusGeral}%</p>
              <p className={`${TYPOGRAPHY.caption} text-gray-400`}>
                {metrics.tarefasConcluidas}/{metrics.tarefasTotais} tarefas do
                mês
              </p>
              <div className="mt-1.5">
                <progress
                  className="wg-progress wg-progress--slim wg-progress--track-slate wg-progress--emerald"
                  value={statusGeral}
                  max={100}
                />
              </div>
            </div>
          </div>

          {/* Botões de açÍo no banner */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 mt-3 sm:mt-4 pt-3 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => navigate("/area-cliente")}
              className={`flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-all ${TYPOGRAPHY.bodySmall}`}
            >
              Experiência do cliente
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/sistema/acessos")}
              className={`flex items-center gap-1.5 px-3 py-2 bg-slate-700/50 hover:bg-slate-600/50 text-white rounded-lg border border-slate-600/50 transition-all ${TYPOGRAPHY.bodySmall}`}
            >
              <FileText className="w-3.5 h-3.5" />
              Configurar acessos
            </button>
          </div>
        </header>


        {/* ====== ACESSO RÁPIDO (Logo abaixo do banner) ====== */}
        <div className="bg-white rounded-2xl p-3 sm:p-4 shadow-sm border border-gray-100">
          <div className="grid grid-cols-4 gap-2 sm:flex sm:flex-wrap sm:gap-2 sm:justify-center lg:justify-start">
            <button
              type="button"
              onClick={() => navigate("/propostas")}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-50 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 rounded-lg transition-all"
            >
              <FileText className="w-5 h-5 sm:w-4 sm:h-4 text-orange-500" />
              <span className={`${TYPOGRAPHY.bodySmall} text-gray-700 whitespace-nowrap`}>Propostas</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/contratos")}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-50 hover:bg-blue-50 border border-gray-200 hover:border-blue-200 rounded-lg transition-all"
            >
              <Briefcase className="w-5 h-5 sm:w-4 sm:h-4 text-blue-500" />
              <span className={`${TYPOGRAPHY.bodySmall} text-gray-700 whitespace-nowrap`}>Contratos</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/pessoas/clientes")}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-50 hover:bg-violet-50 border border-gray-200 hover:border-violet-200 rounded-lg transition-all"
            >
              <Users className="w-5 h-5 sm:w-4 sm:h-4 text-violet-500" />
              <span className={`${TYPOGRAPHY.bodySmall} text-gray-700 whitespace-nowrap`}>Clientes</span>
            </button>
            <button
              type="button"
              onClick={() => navigate("/cronograma")}
              className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 px-2 sm:px-3 py-2 bg-gray-50 hover:bg-cyan-50 border border-gray-200 hover:border-cyan-200 rounded-lg transition-all"
            >
              <Calendar className="w-5 h-5 sm:w-4 sm:h-4 text-cyan-500" />
              <span className={`${TYPOGRAPHY.bodySmall} text-gray-700 whitespace-nowrap`}>Cronograma</span>
            </button>
          </div>
        </div>

        {/* ====== SEGUNDA LINHA: CONTRATOS | CALENDÁRIO | CHECKLIST ====== */}
        {/* Grid dinâmico baseado nas permissões do usuário */}

        {/* ====== WIDGET DE IA: INSIGHTS INTELIGENTES ====== */}
        {isAdminOuMaster && (insightsIA.length > 0 || loadingInsightsIA) && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl p-4 border border-purple-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className={`${TYPOGRAPHY.sectionTitle} text-purple-900`}>Insights de IA</h3>
                  <p className={`${TYPOGRAPHY.caption} text-purple-600`}>Oportunidades identificadas automaticamente</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/oportunidades/inteligentes")}
                className={`flex items-center gap-1 text-purple-600 hover:text-purple-800 ${TYPOGRAPHY.bodySmall}`}
              >
                Ver todas
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            {loadingInsightsIA ? (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {[1,2,3].map(i => (
                  <div key={i} className="flex-shrink-0 w-48 h-20 bg-white/60 animate-pulse rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="flex gap-3 overflow-x-auto pb-1">
                {insightsIA.map((insight) => {
                  const corUrgencia = insight.urgencia === "alta"
                    ? "border-red-200 bg-red-50"
                    : insight.urgencia === "media"
                    ? "border-amber-200 bg-amber-50"
                    : "border-blue-200 bg-blue-50";
                  const corBadge = insight.urgencia === "alta"
                    ? "bg-red-100 text-red-700"
                    : insight.urgencia === "media"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-blue-100 text-blue-700";
                  return (
                    <div
                      key={insight.oportunidade_id || insight.cliente_id || insight.titulo}
                      className={`flex-shrink-0 w-52 p-3 border rounded-xl cursor-pointer hover:shadow-md transition-all ${corUrgencia}`}
                      onClick={() => navigate("/oportunidades/inteligentes")}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${corBadge}`}>
                          {insight.urgencia === "alta" ? "🔴 Alta" : insight.urgencia === "media" ? "🟡 Média" : "🔵 Baixa"}
                        </span>
                        <span className={`text-[10px] text-gray-500 ${insight.fonte === "ia" ? "text-purple-600" : ""}`}>
                          {insight.fonte === "ia" ? "✨ IA" : "📋 Regra"}
                        </span>
                      </div>
                      <p className={`${TYPOGRAPHY.cardTitle} text-gray-900 line-clamp-2 mb-1`}>{insight.titulo}</p>
                      {insight.cliente_nome && (
                        <p className={`${TYPOGRAPHY.caption} text-gray-500 truncate`}>{insight.cliente_nome}</p>
                      )}
                      {insight.valor_estimado && insight.valor_estimado > 0 && (
                        <p className={`${TYPOGRAPHY.caption} font-semibold text-green-700 mt-1`}>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact" }).format(insight.valor_estimado)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        <div className={`grid grid-cols-1 gap-6 ${gridColsClass}`}>
          {/* COLUNA 1: Contratos Ativos do Dia */}
          {permissoesDash.contratosAtivos && (
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={TYPOGRAPHY.sectionTitle}>
                  Contratos ativos do dia
                </h3>
                <p className={TYPOGRAPHY.sectionSubtitle}>
                  Mini cards com avatar, acesso rápido ao contato do cliente e
                  endereço da obra
                </p>
              </div>
              <div className="text-right">
                <p className={`${TYPOGRAPHY.overline} text-gray-400`}>
                  Clientes Ativos
                </p>
                <p className={TYPOGRAPHY.statNumber}>
                  {metrics.contratosAtivos}
                </p>
              </div>
            </div>

            {/* Cards de clientes ativos com açÍo de copiar */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-4">
              {clientesAtivos.length > 0 ? (
                clientesAtivos.map((cliente) => {
                  const { bgClass, textClass, borderClass } = getNucleoClasses(
                    cliente.nucleo
                  );

                  const enderecoDetalhado = formatEnderecoDetalhado(
                    cliente.dadosImovel
                  );
                  const enderecoParaCopiar = enderecoDetalhado || cliente.endereco_obra;
                  const enderecoTooltip =
                    enderecoDetalhado?.replaceAll("\n", " ") ||
                    cliente.endereco_obra ||
                    "Sem endereço";

                  // FunçÍo para copiar dados
                  const copiarDados = (e: React.MouseEvent, tipo: string, valor: string | null) => {
                    e.stopPropagation();
                    if (!valor) return;
                    navigator.clipboard.writeText(valor);
                    setCopiado(`${cliente.id}-${tipo}`);
                    setTimeout(() => setCopiado(null), 2000);
                  };

                  // Montar texto padronizado para cópia/compartilhamento
                  const linhasDados = [
                    `Cliente: ${cliente.nome}`,
                    `Endereço: ${enderecoDetalhado || cliente.endereco_obra || "NÍo informado"}`,
                    cliente.condominio_nome ? `Condomínio: ${cliente.condominio_nome}` : null,
                    cliente.horario_seg_sex ? `Horário Seg a Sex: ${cliente.horario_seg_sex}` : null,
                    cliente.horario_sabado ? `Horário Sábados: ${cliente.horario_sabado}` : null,
                    cliente.observacoes ? `Observações: ${cliente.observacoes}` : null,
                  ].filter(Boolean) as string[];
                  const dadosCompletos = linhasDados.join("\n");
                  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
                    dadosCompletos
                  )}`;

                  return (
                    <div
                      key={cliente.contrato_id}
                      className={`relative flex flex-col bg-white rounded-xl border ${borderClass} transition-all w-full sm:min-w-[140px] sm:max-w-[180px] overflow-hidden group`}
                    >
                      {/* Header com avatar e nome - clicável */}
                      <button
                        onClick={() => navigate(`/contratos/${cliente.contrato_id}`)}
                        type="button"
                        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
                      >
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ring-2 flex-shrink-0 ${bgClass}`}
                        >
                          {cliente.avatar_url || cliente.foto_url ? (
                            <img
                              src={cliente.avatar_url || cliente.foto_url || ""}
                              alt={cliente.nome}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className={`${TYPOGRAPHY.cardTitle} ${textClass}`}>
                              {cliente.nome?.charAt(0)?.toUpperCase() || "C"}
                            </span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className={`${TYPOGRAPHY.cardTitle} truncate`}
                            title={cliente.nome}
                          >
                            {cliente.nome?.split(" ").slice(0, 2).join(" ") || "Cliente"}
                          </p>
                          <p className={`${TYPOGRAPHY.caption} uppercase`}>
                            {cliente.nucleo?.substring(0, 3) || "WG"}
                          </p>
                        </div>
                      </button>

                      {/* Botões de copiar */}
                      <div className="flex items-center justify-between px-2 py-1.5 bg-gray-50 border-t border-gray-100">
                        {/* Copiar telefone */}
                        <button
                          type="button"
                          onClick={(e) => copiarDados(e, 'tel', cliente.telefone)}
                          disabled={!cliente.telefone}
                          className={`p-1.5 rounded-md transition-colors ${
                            cliente.telefone
                              ? 'hover:bg-green-100 text-green-600'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={cliente.telefone || 'Sem telefone'}
                        >
                          {copiado === `${cliente.id}-tel` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Phone className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Copiar email */}
                        <button
                          type="button"
                          onClick={(e) => copiarDados(e, 'email', cliente.email)}
                          disabled={!cliente.email}
                          className={`p-1.5 rounded-md transition-colors ${
                            cliente.email
                              ? 'hover:bg-blue-100 text-blue-600'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={cliente.email || 'Sem email'}
                        >
                          {copiado === `${cliente.id}-email` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Copiar endereço da obra */}
                        <button
                          type="button"
                          onClick={(e) => copiarDados(e, 'end', enderecoParaCopiar)}
                          disabled={!enderecoParaCopiar}
                          className={`p-1.5 rounded-md transition-colors ${
                            enderecoParaCopiar
                              ? 'hover:bg-orange-100 text-orange-600'
                              : 'text-gray-300 cursor-not-allowed'
                          }`}
                          title={enderecoTooltip}
                        >
                          {copiado === `${cliente.id}-end` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <MapPin className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Copiar tudo */}
                        <button
                          type="button"
                          onClick={(e) => copiarDados(e, 'all', dadosCompletos)}
                          className="p-1.5 rounded-md hover:bg-purple-100 text-purple-600 transition-colors"
                          title="Copiar todos os dados"
                        >
                          {copiado === `${cliente.id}-all` ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <a
                          href={whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 rounded-md hover:bg-green-100 text-green-600 transition-colors"
                          title="Compartilhar via WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center w-full py-6 text-center">
                  <Users className="w-8 h-8 text-gray-300 mb-2" />
                  <p className={TYPOGRAPHY.cardSubtitle}>Nenhum contrato ativo</p>
                </div>
              )}
            </div>

            {clientesAtivos.length > 0 && (
              <button
                type="button"
                onClick={() => navigate("/contratos")}
                className={`w-full mt-4 py-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors ${TYPOGRAPHY.bodySmall}`}
              >
                Ver todos os contratos →
              </button>
            )}
          </div>
          )}

          {/* COLUNA 2: Google Calendar (CENTRO) */}
          {permissoesDash.agenda && (
            <GoogleCalendarWidget userEmail={usuario?.google_workspace_email || undefined} />
          )}

          {/* COLUNA 3: Notas Compartilhadas */}
          {permissoesDash.checklistCeo && (
            <div className="w-full bg-white rounded-xl shadow p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>Checklist Interno</h3>
                  <p className={TYPOGRAPHY.sectionSubtitle}>
                    Notas e tarefas colaborativas do time
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/criacao-checklist")}
                  className={`px-3 py-1.5 text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-colors ${TYPOGRAPHY.actionTitle}`}
                >
                  Abrir
                </button>
              </div>
              <div className={`mt-3 ${TYPOGRAPHY.caption}`}>
                Centralize tarefas internas e acompanhamentos em um único lugar.
              </div>
              <div className="mt-4 space-y-3">
                {renderNotasChecklist()}
              </div>
            </div>
          )}
        </div>

        {/* ====== TERCEIRA LINHA: DASHBOARD FINANCEIRO (apenas Admin/Master) ====== */}
        {podeVerFinanceiro && (
        <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
          {/* Header com título e filtros de período */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className={TYPOGRAPHY.sectionTitle}>
                  Dashboard Financeiro
                </h3>
                <p className={TYPOGRAPHY.sectionSubtitle}>
                  VisÍo executiva consolidada
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setPeriodoFluxoFinanceiro("3m")}
                  className={`px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${TYPOGRAPHY.bodySmall} ${
                    periodoFluxoFinanceiro === "3m"
                      ? "bg-slate-800 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  3 Meses
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoFluxoFinanceiro("6m")}
                  className={`px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${TYPOGRAPHY.bodySmall} ${
                    periodoFluxoFinanceiro === "6m"
                      ? "bg-slate-800 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  6 Meses
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoFluxoFinanceiro("ytd")}
                  className={`px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${TYPOGRAPHY.bodySmall} ${
                    periodoFluxoFinanceiro === "ytd"
                      ? "bg-slate-800 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Este Ano
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoFluxoFinanceiro("12m")}
                  className={`px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${TYPOGRAPHY.bodySmall} ${
                    periodoFluxoFinanceiro === "12m"
                      ? "bg-slate-800 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  12 Meses
                </button>
                <button
                  type="button"
                  onClick={() => setPeriodoFluxoFinanceiro("all")}
                  className={`px-2 sm:px-3 py-1.5 rounded-md transition-colors whitespace-nowrap ${TYPOGRAPHY.bodySmall} ${
                    periodoFluxoFinanceiro === "all"
                      ? "bg-slate-800 text-white"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                >
                  Todos
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/financeiro")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                title="Ver detalhes"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 5 KPI Cards - Estilo Laranja Gradiente */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
            {/* Saldo Atual */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <p className={`${TYPOGRAPHY.overline} text-white/80 mb-1`}>
                Saldo Atual
              </p>
              <p className={`${TYPOGRAPHY.statNumber} text-white`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(resumoFinanceiroCards.saldoTotal)}
              </p>
              <p className={`${TYPOGRAPHY.statDescription} text-white/70 mt-1 flex items-center gap-1`}>
                <TrendingUp className="w-3 h-3" /> +12.5% mês
              </p>
            </div>

            {/* Receitas */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className={`${TYPOGRAPHY.overline} text-white/80 mb-1`}>
                Receitas
              </p>
              <p className={`${TYPOGRAPHY.statNumber} text-white`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(resumoFinanceiroCards.receitasTotal)}
              </p>
              <p className={`${TYPOGRAPHY.statDescription} text-white/70 mt-1`}>
                ↗ {resumoFinanceiroCards.contratosAtivos} contratos
              </p>
            </div>

            {/* Custos Totais */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <p className={`${TYPOGRAPHY.overline} text-white/80 mb-1`}>
                Custos Totais
              </p>
              <p className={`${TYPOGRAPHY.statNumber} text-white`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(resumoFinanceiroCards.custosTotal)}
              </p>
              <p className={`${TYPOGRAPHY.statDescription} text-white/70 mt-1`}>
                ↘ {resumoFinanceiroCards.categoriasCustos} categorias
              </p>
            </div>

            {/* Contratos Ativos */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-gray-500" />
              </div>
              <p className={`${TYPOGRAPHY.overline} text-gray-500 mb-1`}>
                Contratos Ativos
              </p>
              <p className={TYPOGRAPHY.statNumber}>
                {resumoFinanceiroCards.contratosAtivos}
              </p>
              <p className={`${TYPOGRAPHY.statDescription} mt-1`}>
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  notation: "compact",
                }).format(
                  resumoFinanceiroCards.contratosAtivos > 0
                    ? resumoFinanceiroCards.valorContratosAtivos /
                        resumoFinanceiroCards.contratosAtivos
                    : 0
                )}
              </p>
            </div>

            {/* Concluídos */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-gray-500" />
              </div>
              <p className={`${TYPOGRAPHY.overline} text-gray-500 mb-1`}>
                Concluídos
              </p>
              <p className={TYPOGRAPHY.statNumber}>
                {resumoFinanceiroCards.contratosConcluidos}
              </p>
              <p className={`${TYPOGRAPHY.statDescription} mt-1`}>
                Histórico + Sistema
              </p>
            </div>
          </div>

          {/* Gráfico de Área - Entradas vs Saídas */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosMensais}>
                <defs>
                  <linearGradient
                    id="colorEntradasFin"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient
                    id="colorSaidasFin"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip content={FinanceiroTooltip} />
                <Area
                  type="monotone"
                  dataKey="receitas"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEntradasFin)"
                  name="receitas"
                />
                <Area
                  type="monotone"
                  dataKey="despesas"
                  stroke="#f97316"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorSaidasFin)"
                  name="despesas"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Legenda */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-emerald-500 rounded-full" />
              <span className={TYPOGRAPHY.caption}>Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className={TYPOGRAPHY.caption}>Saídas</span>
            </div>
          </div>
        </div>
        )}

        {/* ====== ROW: Propostas, Finanças Pessoais e Despesas por Núcleo (3 colunas) ====== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* COLUNA 1: Propostas Comerciais */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>
                    Propostas Comerciais
                  </h3>
                  <p className={TYPOGRAPHY.sectionSubtitle}>
                    ConversÍo e pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/propostas")}
                className={`${TYPOGRAPHY.actionTitle} text-violet-600 hover:text-violet-700 transition-colors`}
              >
                Ver todas →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className={`${TYPOGRAPHY.statNumber} text-amber-600`}>
                  {metrics.propostasAbertas}
                </p>
                <p className={`${TYPOGRAPHY.statDescription} mt-1`}>Aguardando</p>
              </div>
              <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className={`${TYPOGRAPHY.statNumber} text-emerald-600`}>
                  {metrics.propostasAprovadas}
                </p>
                <p className={`${TYPOGRAPHY.statDescription} mt-1`}>Aprovadas</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className={TYPOGRAPHY.statNumber}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.valorPropostas)}
                </p>
                <p className={`${TYPOGRAPHY.statDescription} mt-1`}>Valor Total</p>
              </div>
            </div>
          </div>

          {/* COLUNA 2: Alertas */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className={TYPOGRAPHY.sectionTitle}>AtençÍo</h3>
                <p className={TYPOGRAPHY.sectionSubtitle}>
                  {alertas.length} itens requerem açÍo
                </p>
              </div>
            </div>
            <div className="space-y-2">
              {alertas.slice(0, 3).map((alerta) => {
                const alertaClass = getAlertaCardClass(alerta.tipo, "compact");
                return (
                  <button
                    key={alerta.id}
                    type="button"
                    onClick={() => alerta.link && navigate(alerta.link)}
                    className={`w-full text-left flex items-center justify-between p-2 rounded-lg transition-all ${TYPOGRAPHY.bodySmall} ${alertaClass}`}
                  >
                    <p className={`${TYPOGRAPHY.bodySmall} text-gray-700 truncate`}>{alerta.mensagem}</p>
                  </button>
                );
              })}
              {alertas.length === 0 && (
                <div className="flex items-center gap-2 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className={`${TYPOGRAPHY.bodySmall} text-emerald-700`}>Nenhum alerta</span>
                </div>
              )}
            </div>
          </div>

          {/* COLUNA 3: Despesas por Núcleo */}
          {(podeVerFinanceiro || isAdminOuMaster) ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
              Despesas por Núcleo
            </h3>
            <div className="space-y-3">
              {/* Designer */}
              <div className="flex items-center gap-3">
                <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 min-w-[96px]`}>designer</span>
                <div className="flex-1">
                  <progress
                    className="wg-progress wg-progress--thick wg-progress--track-gray wg-progress--orange-500"
                    value={despesasNucleoPercent.designer || 0}
                    max={100}
                  />
                </div>
                <span className={`${TYPOGRAPHY.cardMeta} w-14 text-right`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.despesaDesigner)}
                </span>
              </div>
              {/* Arquitetura */}
              <div className="flex items-center gap-3">
                <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 min-w-[96px]`}>
                  arquitetura
                </span>
                <div className="flex-1">
                  <progress
                    className="wg-progress wg-progress--thick wg-progress--track-gray wg-progress--orange-400"
                    value={despesasNucleoPercent.arquitetura || 0}
                    max={100}
                  />
                </div>
                <span className={`${TYPOGRAPHY.cardMeta} w-14 text-right`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.despesaArquitetura)}
                </span>
              </div>
              {/* Engenharia */}
              <div className="flex items-center gap-3">
                <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 min-w-[96px]`}>engenharia</span>
                <div className="flex-1">
                  <progress
                    className="wg-progress wg-progress--thick wg-progress--track-gray wg-progress--orange-300"
                    value={despesasNucleoPercent.engenharia || 0}
                    max={100}
                  />
                </div>
                <span className={`${TYPOGRAPHY.cardMeta} w-14 text-right`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.despesaEngenharia)}
                </span>
              </div>
              {/* Marcenaria */}
              <div className="flex items-center gap-3">
                <span className={`${TYPOGRAPHY.bodySmall} text-gray-600 min-w-[96px]`}>marcenaria</span>
                <div className="flex-1">
                  <progress
                    className="wg-progress wg-progress--thick wg-progress--track-gray wg-progress--orange-200"
                    value={despesasNucleoPercent.marcenaria || 0}
                    max={100}
                  />
                </div>
                <span className={`${TYPOGRAPHY.cardMeta} w-14 text-right`}>
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.despesaMarcenaria)}
                </span>
              </div>
            </div>
          </div>
          ) : (
            /* Para usuários sem permissÍo financeira, mostrar contratos */
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>Contratos</h3>
                  <p className={TYPOGRAPHY.sectionSubtitle}>Resumo geral</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-100">
                  <p className={`${TYPOGRAPHY.statNumber} text-blue-600`}>
                    {metrics.contratosAtivos}
                  </p>
                  <p className={`${TYPOGRAPHY.statDescription} mt-1`}>Ativos</p>
                </div>
                <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                  <p className={`${TYPOGRAPHY.statNumber} text-emerald-600`}>
                    {metrics.contratosConcluidos}
                  </p>
                  <p className={`${TYPOGRAPHY.statDescription} mt-1`}>Concluídos</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ====== FOOTER ====== */}
        <footer className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 overflow-hidden p-1">
              <img
                src="/imagens/logoscomfundotransparente/simbolo%20marcadores.png"
                alt="WG"
                className="w-full h-full object-contain"
              />
            </div>
            <p className={`${TYPOGRAPHY.caption} text-gray-500`}>
              WG Easy · Dashboard Executivo
            </p>
          </div>
          <p className={`${TYPOGRAPHY.caption} text-gray-400`}>
            Grupo WG Almeida · v2.0 CEO Edition
          </p>
        </footer>
      </div>
    </div>
  );
}

