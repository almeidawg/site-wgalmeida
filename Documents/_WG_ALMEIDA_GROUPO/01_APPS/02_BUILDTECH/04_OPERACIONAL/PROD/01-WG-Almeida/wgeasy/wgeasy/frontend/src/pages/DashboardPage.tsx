/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// DASHBOARD EXECUTIVO - CEO & FOUNDER
// Sistema WG Easy - Grupo WG Almeida
// VisÍo completa e em tempo real da empresa
// ============================================================

import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { useDashboardPermissoes } from "@/hooks/useDashboardPermissoes";
import { useToast } from "@/components/ui/use-toast";
import {
  obterChecklistDiario,
  adicionarItemComMencoes,
  toggleItemConcluido,
  removerItem,
  calcularProgresso,
  buscarMencoesUsuario,
  importarMencaoParaChecklist,
  type CEOChecklist,
} from "@/lib/ceoChecklistApi";
import {
  obterFraseDoDiaComFallback,
  type FraseMotivacional,
} from "@/lib/frasesMotivacionaisApi";
import { useDashboardPessoal } from "@/modules/financeiro-pessoal/hooks";
import WGStarIcon from "@/components/icons/WGStarIcon";
import { CEOChecklistCard } from "@/components/checklists/CEOChecklistCard";
import GrupoEmpresasSection from "@/components/dashboard/GrupoEmpresasSection";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
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
  Plus,
  Activity,
  Copy,
  Sparkles,
  Sun,
  Moon,
  Sunset,
  Check,
  Loader2,
  Trash2,
  Quote,
  X,
  AtSign,
  MessageSquare,
  ArrowRight,
  Wallet,
  CreditCard,
  ArrowUpCircle,
  ArrowDownCircle,
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
  valorContratos: number;
  // Por núcleo
  nucleoArquitetura: number;
  nucleoEngenharia: number;
  nucleoMarcenaria: number;
}

interface Evento {
  id: string;
  titulo: string;
  data: string;
  hora?: string;
  tipo: "reuniao" | "entrega" | "visita" | "deadline";
  cliente?: string;
}

interface ContratoAtivo {
  id: string;
  codigo?: string;
  status: string;
  valor_total?: number;
  nucleo?: string;
  clienteTelefone?: string | null;
  obra?: {
    nome?: string;
    endereco?: string;
  } | null;
  cliente?: {
    nome?: string;
  } | null;
}

interface Alerta {
  id: string;
  tipo: "urgente" | "atencao" | "info";
  mensagem: string;
  acao?: string;
  link?: string;
}

interface Mencao {
  id: string;
  comentario: string;
  created_at: string;
  task?: {
    id: string;
    titulo: string;
    project?: {
      id: string;
      nome: string;
    };
  };
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { usuario, loading: loadingUsuario } = useUsuarioLogado();
  const { permissoes, loading: loadingPermissoes } = useDashboardPermissoes();
  const [loading, setLoading] = useState(true);

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
    valorContratos: 0,
    nucleoArquitetura: 0,
    nucleoEngenharia: 0,
    nucleoMarcenaria: 0,
  });

  const [eventos, setEventos] = useState<Evento[]>([]);

  // Checklist persistente do banco de dados
  const [ceoChecklist, setCeoChecklist] = useState<CEOChecklist | null>(null);
  const [novoItemTexto, setNovoItemTexto] = useState("");
  const [adicionandoItem, setAdicionandoItem] = useState(false);
  const [salvandoItem, setSalvandoItem] = useState(false);

  // Frase motivacional do dia
  const [fraseDoDia, setFraseDoDia] = useState<FraseMotivacional | null>(null);

  // Menções do CEO em tarefas
  const [mencoes, setMencoes] = useState<Mencao[]>([]);
  const [importandoMencao, setImportandoMencao] = useState<string | null>(null);

  const [alertas, setAlertas] = useState<Alerta[]>([]);
  const [dadosMensais, setDadosMensais] = useState<any[]>([]);

  // Lista de contratos ativos para exibiçÍo nos cards
  const [contratosAtivosList, setContratosAtivosList] = useState<
    ContratoAtivo[]
  >([]);

  // Estado para expand/collapse dos cards de contratos ativos
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>(
    {}
  );

  // FunçÍo para toggle expand/collapse dos cards
  const handleToggleExpand = useCallback((id: string) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

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
            inicio: inicio.toISOString().split('T')[0],
            fim: proximoMes.toISOString().split('T')[0],
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
          financeiroReceitaResult,
          financeiroReceitaAnoAnteriorResult,
          financeiroDespesaResult,
          obrasResult,
        ] = await Promise.all([
          // Clientes ativos
          supabase
            .from("pessoas")
            .select("id, created_at", { count: "exact" })
            .eq("tipo", "CLIENTE"),
          // Propostas
          supabase
            .from("propostas")
            .select("id, status, valor_total, created_at"),
          // Contratos com dados do cliente
          supabase.from("contratos").select(`
            id, codigo, status, valor_total, unidade_negocio,
            cliente:cliente_id (
              id, nome
            ),
            obra:obra_id (
              id, nome, endereco
            )
          `),
          // Projetos
          supabase.from("projetos").select("id, status, nucleo, created_at"),
          // Receitas do mês (tipo = entrada)
          supabase
            .from("financeiro_lancamentos")
            .select("valor_total")
            .eq("tipo", "entrada")
            .gte("data_competencia", inicioMes)
            .lt("data_competencia", fimMes),
          supabase
            .from("financeiro_lancamentos")
            .select("valor_total")
            .eq("tipo", "entrada")
            .gte("data_competencia", inicioMesAnoAnterior)
            .lt("data_competencia", fimMesAnoAnterior),
          // Despesas do mês (tipo = saida)
          supabase
            .from("financeiro_lancamentos")
            .select("valor_total")
            .eq("tipo", "saida")
            .gte("data_competencia", inicioMes)
            .lt("data_competencia", fimMes),
          // Obras
          supabase.from("obras").select("id, status, nucleo_id"),
        ]);

        // Calcular métricas
        const clientes = clientesResult.data || [];
        const propostas = propostasResult.data || [];
        const contratos = contratosResult.data || [];
        const projetos = projetosResult.data || [];
        const obras = obrasResult.data || [];

        // Clientes novos este mês
        const clientesNovosMes = clientes.filter(
          (c) => c.created_at && new Date(c.created_at) >= new Date(inicioMes)
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

        // Contratos
        const contratosAtivos = contratos.filter(
          (c) => c.status === "ativo" || c.status === "em_andamento"
        ).length;
        const valorContratos = contratos
          .filter((c) => c.status === "ativo" || c.status === "em_andamento")
          .reduce((acc, c) => acc + (c.valor_total || 0), 0);

        // Por núcleo
        const nucleoArq = contratos.filter(
          (c) => c.unidade_negocio?.toLowerCase() === "arquitetura"
        ).length;
        const nucleoEng = contratos.filter(
          (c) => c.unidade_negocio?.toLowerCase() === "engenharia"
        ).length;
        const nucleoMarc = contratos.filter(
          (c) => c.unidade_negocio?.toLowerCase() === "marcenaria"
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

        // Financeiro
        const receitaMes = (financeiroReceitaResult.data || []).reduce(
          (acc, r) => acc + (Number(r.valor_total) || 0),
          0
        );
        const receitaAnoAnterior = (
          financeiroReceitaAnoAnteriorResult.data || []
        ).reduce((acc, r) => acc + (Number(r.valor_total) || 0), 0);
        const despesaMes = (financeiroDespesaResult.data || []).reduce(
          (acc, d) => acc + (Number(d.valor_total) || 0),
          0
        );

        setMetrics({
          receitaMes,
          despesaMes,
          receitaAnoAnterior,
          projetosAtivos:
            projetosAtivos ||
            obras.filter((o) => o.status === "andamento").length,
          projetosNovos,
          projetosConcluidos,
          clientesAtivos: clientes.length,
          clientesNovos: clientesNovosMes,
          propostasAbertas,
          propostasAprovadas,
          valorPropostas,
          contratosAtivos,
          valorContratos,
          nucleoArquitetura: nucleoArq || Math.floor(contratosAtivos * 0.35),
          nucleoEngenharia: nucleoEng || Math.floor(contratosAtivos * 0.4),
          nucleoMarcenaria: nucleoMarc || Math.floor(contratosAtivos * 0.25),
        });

        // Salvar lista de contratos ativos para os cards
        // Preferir a funçÍo dedicada (SECURITY DEFINER) para garantir retorno mesmo com RLS
        let listaContratosAtivos: ContratoAtivo[] = [];

        // 1) RPC (SECURITY DEFINER) -> garante acesso mesmo com RLS
        const contratosAtivosHoje = await supabase.rpc(
          "obter_contratos_ativos_hoje"
        );
        if (contratosAtivosHoje.data && contratosAtivosHoje.data.length > 0) {
          listaContratosAtivos = contratosAtivosHoje.data.map((c: any) => ({
            id: c.id,
            codigo: c.numero,
            status: c.dias_restantes
              ? `${c.dias_restantes} dias restantes`
              : "Em andamento",
            valor_total: c.valor_total,
            nucleo: c.unidade_negocio,
            clienteTelefone: c.cliente_telefone,
            obra: {
              nome: undefined,
              endereco: c.endereco_obra,
            },
            cliente: { nome: c.cliente_nome },
          }));
        }

        // 2) Fallback via view (view liberada por GRANT SELECT) se RPC nÍo retornou
        if (listaContratosAtivos.length === 0) {
          const contratosView = await supabase
            .from("vw_contratos_completo")
            .select(
              "id, numero, status, valor_total, unidade_negocio, cliente_nome, cliente_telefone"
            )
            .in("status", ["ativo", "em_andamento", "em_execucao"]);

          if (contratosView.data && contratosView.data.length > 0) {
            listaContratosAtivos = contratosView.data.map((c: any) => ({
              id: c.id,
              codigo: c.numero,
              status: c.status || "Em andamento",
              valor_total: c.valor_total,
              nucleo: c.unidade_negocio,
              clienteTelefone: c.cliente_telefone,
              cliente: { nome: c.cliente_nome },
              obra: null,
            }));
          }
        }

        // 3) Fallback final: tabela contratos (se RLS permitir)
        if (listaContratosAtivos.length === 0) {
          listaContratosAtivos = contratos
            .filter((c) => c.status === "ativo" || c.status === "em_andamento")
            .map((c) => ({
              id: c.id,
              codigo: c.codigo,
              status: c.status,
              valor_total: c.valor_total,
              nucleo: c.unidade_negocio,
              clienteTelefone: undefined,
              // Supabase retorna relações como objeto único ou null
              cliente: c.cliente as { nome?: string } | null,
              obra: c.obra as { nome?: string; endereco?: string } | null,
            }));
        }

        // Limitar para evitar overflow visual
        listaContratosAtivos = listaContratosAtivos.slice(0, 18);

        setContratosAtivosList(listaContratosAtivos);

        // Gerar dados mensais para grafico (ultimos 6 meses)
        const meses = [
          "Jan",
          "Fev",
          "Mar",
          "Abr",
          "Mai",
          "Jun",
          "Jul",
          "Ago",
          "Set",
          "Out",
          "Nov",
          "Dez",
        ];
        const dadosGrafico = await Promise.all(
          Array.from({ length: 6 }).map(async (_, idx) => {
            const offset = 5 - idx;
            const base = new Date(
              hoje.getFullYear(),
              hoje.getMonth() - offset,
              1
            );
            const { inicio, fim } = getMonthRange(base);
            const [receitasMesResult, despesasMesResult, projetosMesResult] =
              await Promise.all([
                supabase
                  .from("financeiro_lancamentos")
                  .select("valor_total")
                  .eq("tipo", "entrada")
                  .gte("data_competencia", inicio)
                  .lt("data_competencia", fim),
                supabase
                  .from("financeiro_lancamentos")
                  .select("valor_total")
                  .eq("tipo", "saida")
                  .gte("data_competencia", inicio)
                  .lt("data_competencia", fim),
                supabase
                  .from("projetos")
                  .select("id", { count: "exact" })
                  .gte("created_at", inicio)
                  .lt("created_at", fim),
              ]);
            const receitasMes = (receitasMesResult.data || []).reduce(
              (acc, r) => acc + (Number(r.valor_total) || 0),
              0
            );
            const despesasMes = (despesasMesResult.data || []).reduce(
              (acc, d) => acc + (Number(d.valor_total) || 0),
              0
            );
            return {
              mes: meses[base.getMonth()],
              receitas: Math.round(receitasMes),
              despesas: Math.round(despesasMes),
              projetos: projetosMesResult.count || 0,
            };
          })
        );
        setDadosMensais(dadosGrafico);

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

        // Carregar eventos reais do cronograma (próximos 14 dias)
        const dataLimite = new Date();
        dataLimite.setDate(dataLimite.getDate() + 14);

        const { data: tarefasCronograma } = await supabase
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

        const eventosReais: Evento[] = (tarefasCronograma || []).map(
          (tarefa: any) => {
            const dataTarefa = new Date(tarefa.data_termino);
            const hojeDate = new Date();
            hojeDate.setHours(0, 0, 0, 0);
            const amanha = new Date(hojeDate);
            amanha.setDate(amanha.getDate() + 1);

            let dataLabel = "";
            if (dataTarefa.toDateString() === hojeDate.toDateString()) {
              dataLabel = "Hoje";
            } else if (dataTarefa.toDateString() === amanha.toDateString()) {
              dataLabel = "AmanhÍ";
            } else {
              dataLabel = dataTarefa.toLocaleDateString("pt-BR", {
                weekday: "short",
                day: "numeric",
              });
            }

            return {
              id: tarefa.id,
              titulo: tarefa.titulo,
              data: dataLabel,
              tipo: "deadline" as const,
              cliente: tarefa.projeto?.nome || tarefa.nucleo || undefined,
            };
          }
        );

        // Se nÍo houver eventos reais, mostrar mensagem
        if (eventosReais.length === 0) {
          setEventos([
            {
              id: "empty",
              titulo: "Nenhum deadline próximo",
              data: "Próximos 14 dias",
              tipo: "deadline",
            },
          ]);
        } else {
          setEventos(eventosReais);
        }

        // Carregar frase do dia
        const frase = await obterFraseDoDiaComFallback();
        setFraseDoDia(frase);

        // Carregar checklist do CEO
        if (usuario?.id) {
          try {
            const checklistDiario = await obterChecklistDiario(usuario.id);
            setCeoChecklist(checklistDiario);
          } catch (err) {
            console.error("Erro ao carregar checklist:", err);
          }

          // Carregar menções do CEO
          try {
            const mencoesRecentes = await buscarMencoesUsuario(usuario.id, 7);
            setMencoes(mencoesRecentes);
          } catch (err) {
            console.error("Erro ao carregar menções:", err);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar Dashboard:", error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [usuario?.id, loadingUsuario]);

  // Toggle checklist item (persistente)
  const toggleChecklist = useCallback(
    async (itemId: string) => {
      if (!ceoChecklist?.itens) return;

      const item = ceoChecklist.itens.find((i) => i.id === itemId);
      if (!item) return;

      try {
        const itemAtualizado = await toggleItemConcluido(
          itemId,
          !item.concluido
        );
        setCeoChecklist((prev) =>
          prev
            ? {
                ...prev,
                itens: prev.itens?.map((i) =>
                  i.id === itemId ? itemAtualizado : i
                ),
              }
            : null
        );
      } catch (err) {
        console.error("Erro ao atualizar item:", err);
      }
    },
    [ceoChecklist]
  );

  // Adicionar novo item ao checklist
  const handleAdicionarItem = useCallback(async () => {
    const autorId = usuario?.id;
    if (
      !ceoChecklist?.id ||
      !novoItemTexto.trim() ||
      !autorId ||
      autorId.trim() === ""
    ) {
      console.warn(
        "[Checklist] NÍo foi possível adicionar item: dados incompletos",
        {
          checklistId: ceoChecklist?.id,
          texto: novoItemTexto.trim(),
          autorId,
        }
      );
      return;
    }

    setSalvandoItem(true);
    try {
      const novoItem = await adicionarItemComMencoes(
        ceoChecklist.id,
        {
          texto: novoItemTexto.trim(),
          prioridade: "media",
        },
        autorId
      );
      setCeoChecklist((prev) =>
        prev
          ? {
              ...prev,
              itens: [novoItem, ...(prev.itens || [])],
            }
          : null
      );
      setNovoItemTexto("");
      setAdicionandoItem(false);
    } catch (err) {
      console.error("Erro ao adicionar item:", err);
        toast({ variant: "destructive", title: "Erro ao adicionar item", description: err instanceof Error ? err.message : "Erro ao adicionar item." });
    } finally {
      setSalvandoItem(false);
    }
  }, [ceoChecklist?.id, novoItemTexto, usuario?.id]);

  // Remover item do checklist
  const handleRemoverItem = useCallback(
    async (itemId: string) => {
      if (!ceoChecklist?.itens) return;

      try {
        await removerItem(itemId);
        setCeoChecklist((prev) =>
          prev
            ? {
                ...prev,
                itens: prev.itens?.filter((i) => i.id !== itemId),
              }
            : null
        );
      } catch (err) {
        console.error("Erro ao remover item:", err);
      }
    },
    [ceoChecklist]
  );

  // Importar mençÍo para o checklist
  const handleImportarMencao = useCallback(
    async (mencao: Mencao) => {
      if (!ceoChecklist?.id) return;

      setImportandoMencao(mencao.id);
      try {
        const textoTarefa = mencao.task?.titulo
          ? `[MençÍo] ${mencao.task.titulo}`
          : `[MençÍo] ${mencao.comentario.substring(0, 50)}...`;

        const novoItem = await importarMencaoParaChecklist(
          ceoChecklist.id,
          mencao.id,
          textoTarefa
        );
        setCeoChecklist((prev) =>
          prev
            ? {
                ...prev,
                itens: [novoItem, ...(prev.itens || [])],
              }
            : null
        );

        // Remover da lista de menções exibidas
        setMencoes((prev) => prev.filter((m) => m.id !== mencao.id));
      } catch (err) {
        console.error("Erro ao importar mençÍo:", err);
      } finally {
        setImportandoMencao(null);
      }
    },
    [ceoChecklist?.id]
  );

  // Calcular progresso do checklist
  const checklistProgress = useMemo(() => {
    if (!ceoChecklist?.itens || ceoChecklist.itens.length === 0) return 0;
    return calcularProgresso(ceoChecklist.itens);
  }, [ceoChecklist?.itens]);

  // VariaçÍo percentual (reservado para uso futuro)
  const _variacaoReceita = useMemo(() => {
    if (metrics.receitaAnoAnterior === 0) return 0;
    return (
      ((metrics.receitaMes - metrics.receitaAnoAnterior) /
        metrics.receitaAnoAnterior) *
      100
    );
  }, [metrics]);

  if (loading || loadingUsuario) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
            <img src="/imagens/wg-icon.png" alt="WG" className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" loading="lazy" />
          </div>
          <span className="text-slate-400 text-body font-medium">
            Preparando seu dashboard...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className={`${LAYOUT.contentContainer} space-y-4 sm:space-y-6`}>
        {/* ====== BANNER HEADER ====== */}
        <header className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 lg:gap-6">
            <div className="flex items-center gap-4">
              {/* Avatar do usuário */}
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-lg overflow-hidden">
                  {usuario?.foto_url ? (
                    <img
                      src={usuario.foto_url ?? undefined}
                      alt={usuario.nome ?? undefined}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[18px] font-light text-white">
                      {usuario?.nome?.charAt(0) || "W"}
                    </span>
                  )}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center ring-2 ring-white">
                  <Check className="w-3.5 h-3.5 text-white" />
                </div>
              </div>

              <div>
                <p className="text-caption text-gray-400 uppercase tracking-wider mb-1">
                  WG Easy · Dashboard Executivo
                </p>
                <div className="flex items-center gap-2">
                  <saudacao.icon className={`w-5 h-5 ${saudacao.cor}`} />
                  <h1 className="text-[18px] sm:text-[18px] sm:text-[24px] font-light tracking-tight text-white">
                    {saudacao.texto},{" "}
                    <span className="font-normal text-orange-400">
                      {usuario?.nome?.split(" ")[0] || "CEO"}
                    </span>
                  </h1>
                </div>
                <p className="text-gray-400 text-body capitalize">{dataHoje}</p>
              </div>
            </div>

            {/* Frase motivacional e botões */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {fraseDoDia && (
                <div className="flex items-start gap-2 w-full sm:max-w-md bg-slate-700/50 rounded-xl p-3 sm:p-4 border border-slate-600/50">
                  <Quote className="w-4 h-4 text-orange-400/80 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-body text-gray-200 italic leading-relaxed">
                      "{fraseDoDia.frase}"
                    </p>
                    <p className="text-caption text-gray-400 mt-1">
                      — {fraseDoDia.autor}
                    </p>
                  </div>
                </div>
              )}

              {/* Status Geral */}
              <div className="bg-slate-700/50 rounded-xl p-3 sm:p-4 border border-slate-600/50 w-full sm:min-w-[180px]">
                <p className="text-caption text-gray-400 uppercase tracking-wider mb-1">
                  Status Geral
                </p>
                <p className="text-[18px] font-light text-white">72%</p>
                <p className="text-caption text-gray-400">
                  Sprint global WG concluída nesta semana.
                </p>
                <div className="mt-2 h-2 bg-slate-600 rounded-full overflow-hidden">
                  <div className="h-full w-[72%] bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          {/* Botões de açÍo no banner */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t border-slate-700/50">
            <button
              type="button"
              onClick={() => navigate("/area-cliente")}
              className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-900 font-medium rounded-xl transition-all"
            >
              Abrir experiência do cliente
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate("/sistema/acessos")}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-700/50 hover:bg-slate-600/50 text-white font-medium rounded-xl border border-slate-600/50 transition-all"
            >
              <FileText className="w-4 h-4" />
              Configurar acessos
            </button>
          </div>
        </header>

        {/* ====== GRUPO WG ALMEIDA — EMPRESAS ====== */}
        <GrupoEmpresasSection />

        {/* ====== SEGUNDA LINHA: 3 COLUNAS ====== */}
        <div className={LAYOUT.gridDashboard}>
          {/* COLUNA 1: Contratos Ativos do Dia */}
          <div className={`${LAYOUT.card} rounded-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className={TYPOGRAPHY.sectionTitle}>
                  Contratos ativos do dia
                </h3>
                <p className="text-body text-gray-500">
                  Mini cards com avatar, acesso rápido ao contato do cliente e
                  endereço da obra
                </p>
              </div>
              <div className="text-right">
                <p className="text-caption text-gray-400 uppercase tracking-wider">
                  Clientes Ativos
                </p>
                <p className="text-[18px] font-light text-gray-900">
                  {metrics.contratosAtivos}
                </p>
              </div>
            </div>

            {/* Cards dinâmicos de contratos ativos do dia */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 mt-4">
              {(contratosAtivosList || []).map((contrato) => {
                const expanded = expandedCards[contrato.id] || false;
                const obra = contrato.obra;
                const cliente = contrato.cliente;
                const clienteNome = cliente?.nome || "Cliente";
                const obraNome = obra?.nome || "Projeto";
                const enderecoObra = obra?.endereco || "";
                const obraInfo = enderecoObra
                  ? `${obraNome} - ${enderecoObra}`
                  : obraNome;
                const shareText =
                  `Cliente: ${clienteNome}\n` +
                  `Obra: ${obraNome}\n` +
                  `Endereço Obra: ${enderecoObra}\n` +
                  `Horário Seg a Sex:  \n` +
                  `Horário Sábados: \n` +
                  `Observações: `;
                return (
                  <div
                    key={contrato.id}
                    className="relative flex flex-col items-center p-3 sm:p-4 bg-gray-50 hover:bg-gray-100 rounded-xl w-full sm:min-w-[180px] transition-colors shadow group"
                  >
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-2 overflow-hidden">
                      <Users className="w-6 h-6 text-orange-500" />
                    </div>
                    <p className="text-caption font-medium text-gray-700 text-center truncate w-full">
                      {clienteNome}
                    </p>
                    <p className="text-caption-sm text-gray-400">
                      {contrato.codigo || contrato.id}
                    </p>
                    <div className="flex gap-2 mt-2">
                      {/* Expand/Collapse */}
                      <button
                        type="button"
                        onClick={() => handleToggleExpand(contrato.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                        title={
                          expanded
                            ? "Ocultar dados da obra"
                            : "Mostrar dados da obra"
                        }
                      >
                        {expanded ? (
                          <ChevronRight className="w-4 h-4 rotate-90" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      {/* Copy */}
                      <button
                        type="button"
                        onClick={() => navigator.clipboard.writeText(shareText)}
                        className="p-1.5 text-gray-400 hover:text-gray-600"
                        title="Copiar dados da obra"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      {/* WhatsApp */}
                      <a
                        href={`https://wa.me/?text=${encodeURIComponent(
                          shareText
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 text-green-500 hover:text-green-700"
                        title="Compartilhar via WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>
                    </div>
                    {expanded && (
                      <div className="mt-2 w-full text-caption text-left bg-white rounded p-2 border border-gray-200">
                        <div>
                          <span className="font-normal">Obra:</span>{" "}
                          {obraInfo}
                        </div>
                        {contrato.status && (
                          <div>
                            <span className="font-normal">Status:</span>{" "}
                            {contrato.status}
                          </div>
                        )}
                        {contrato.nucleo && (
                          <div>
                            <span className="font-normal">Núcleo:</span>{" "}
                            {contrato.nucleo}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* COLUNA 2: Calendário / Agenda (CENTRO) */}
          <div className={`${LAYOUT.card} rounded-2xl`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-normal text-gray-900">Calendário</h3>
                  <p className="text-caption text-gray-500">Próximos eventos</p>
                </div>
              </div>
            </div>

            <div className="space-y-3 max-h-[280px] overflow-y-auto">
              {eventos.map((evento) => (
                <div
                  key={evento.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${
                      evento.tipo === "reuniao"
                        ? "bg-blue-500"
                        : evento.tipo === "entrega"
                        ? "bg-emerald-500"
                        : evento.tipo === "visita"
                        ? "bg-violet-500"
                        : "bg-amber-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-gray-700 truncate">
                      {evento.titulo}
                    </p>
                    <div className="flex items-center gap-2 text-caption text-gray-500 mt-1">
                      <span>{evento.data}</span>
                      {evento.hora && (
                        <>
                          <span>•</span>
                          <span>{evento.hora}</span>
                        </>
                      )}
                    </div>
                    {evento.cliente && (
                      <p className="text-caption text-gray-400 mt-0.5">
                        {evento.cliente}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate("/cronograma")}
              className="w-full mt-4 py-2.5 text-body text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors"
            >
              Ver calendário completo →
            </button>
          </div>

          {/* COLUNA 3: Checklist do Dia (DIREITA) - Componente Avancado com Mencoes @ */}
          <div className={`${LAYOUT.card} rounded-2xl`}>
            {usuario?.id && (
              <CEOChecklistCard
                usuarioId={usuario.id}
                compact={true}
                maxItems={5}
              />
            )}
          </div>
        </div>

        {/* ====== TERCEIRA LINHA: DASHBOARD FINANCEIRO ====== */}
        {permissoes.dashFinanceiro && (
        <div className={`${LAYOUT.card} rounded-2xl`}>
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
                <p className="text-body text-gray-500">
                  VisÍo executiva consolidada
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex bg-gray-100 rounded-lg p-1 flex-shrink-0">
                <button
                  type="button"
                  className="px-3 py-1.5 text-caption font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                >
                  3 Meses
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-caption font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                >
                  6 Meses
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-caption font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                >
                  Este Ano
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-caption font-medium text-gray-600 hover:text-gray-900 rounded-md transition-colors"
                >
                  12 Meses
                </button>
                <button
                  type="button"
                  className="px-3 py-1.5 text-caption font-medium bg-slate-800 text-white rounded-md transition-colors"
                >
                  Todos
                </button>
              </div>
              <button
                type="button"
                onClick={() => navigate("/financeiro")}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Ver detalhes"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* 5 KPI Cards - Estilo Laranja Gradiente */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3 mb-4 sm:mb-6">
            {/* Saldo Atual */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-white" />
              </div>
              <p className="text-caption-sm uppercase tracking-wider text-white/80 mb-1">
                Saldo Atual
              </p>
              <p className="text-[18px] font-light">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(metrics.receitaMes - metrics.despesaMes)}
              </p>
              <p className="text-caption-sm text-white/70 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> +12.5% mês
              </p>
            </div>

            {/* Receitas */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-white" />
              </div>
              <p className="text-caption-sm uppercase tracking-wider text-white/80 mb-1">
                Receitas
              </p>
              <p className="text-[18px] font-light">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(metrics.receitaMes)}
              </p>
              <p className="text-caption-sm text-white/70 mt-1">
                ↗ {metrics.contratosAtivos} contratos
              </p>
            </div>

            {/* Custos Totais */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-white relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-white" />
              </div>
              <p className="text-caption-sm uppercase tracking-wider text-white/80 mb-1">
                Custos Totais
              </p>
              <p className="text-[18px] font-light">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(metrics.despesaMes)}
              </p>
              <p className="text-caption-sm text-white/70 mt-1">↘ 4 categorias</p>
            </div>

            {/* Contratos Ativos */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-caption-sm uppercase tracking-wider text-gray-500 mb-1">
                Contratos Ativos
              </p>
              <p className="text-[18px] font-light text-gray-900">
                {metrics.contratosAtivos}
              </p>
              <p className="text-caption-sm text-gray-500 mt-1">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                  notation: "compact",
                }).format(metrics.receitaMes / (metrics.contratosAtivos || 1))}
              </p>
            </div>

            {/* Concluídos */}
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 relative overflow-hidden">
              <div className="absolute top-2 right-2 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-gray-500" />
              </div>
              <p className="text-caption-sm uppercase tracking-wider text-gray-500 mb-1">
                Concluídos
              </p>
              <p className="text-[18px] font-light text-gray-900">285</p>
              <p className="text-caption-sm text-gray-500 mt-1">
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
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: "12px",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                  }}
                  labelStyle={{ color: "#374151", fontWeight: 600 }}
                  formatter={(value: number, name: string) => [
                    new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(value),
                    name === "receitas" ? "Entradas" : "Saídas",
                  ]}
                />
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
              <span className="text-body text-gray-500">Entradas</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full" />
              <span className="text-body text-gray-500">Saídas</span>
            </div>
          </div>
        </div>
        )}

        {/* ====== QUARTA LINHA: 3 BLOCOS EM LINHA (Despesas, AtençÍo, Propostas) ====== */}
        <div className={LAYOUT.gridDashboard}>
          {/* Despesas por Núcleo */}
          {permissoes.dashDespesasNucleo && (
          <div className={`${LAYOUT.card} rounded-2xl min-w-0`}>
            <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
              Despesas por Núcleo
            </h3>
            <div className="space-y-4">
              {/* Designer */}
              <div className="flex items-center gap-4">
                <span className="text-body text-gray-600 w-24">designer</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full"
                    style={{ width: "85%" }}
                  />
                </div>
              </div>
              {/* Arquitetura */}
              <div className="flex items-center gap-4">
                <span className="text-body text-gray-600 w-24">
                  arquitetura
                </span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: "65%" }}
                  />
                </div>
              </div>
              {/* Engenharia */}
              <div className="flex items-center gap-4">
                <span className="text-body text-gray-600 w-24">engenharia</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-300 rounded-full"
                    style={{ width: "45%" }}
                  />
                </div>
              </div>
              {/* Marcenaria */}
              <div className="flex items-center gap-4">
                <span className="text-body text-gray-600 w-24">marcenaria</span>
                <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-200 rounded-full"
                    style={{ width: "30%" }}
                  />
                </div>
              </div>
            </div>
          </div>
          )}

          {/* AtençÍo / Alertas */}
          {permissoes.dashAlertas && (
          <div className={`${LAYOUT.card} rounded-2xl min-w-0`}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="font-normal text-gray-900">AtençÍo</h3>
                <p className="text-caption text-gray-500">
                  {alertas.length} itens requerem açÍo
                </p>
              </div>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {alertas.length > 0 ? (
                alertas.map((alerta) => (
                  <div
                    key={alerta.id}
                    onClick={() => alerta.link && navigate(alerta.link)}
                    className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                      alerta.tipo === "urgente"
                        ? "bg-red-50 border border-red-100 hover:bg-red-100"
                        : alerta.tipo === "atencao"
                        ? "bg-amber-50 border border-amber-100 hover:bg-amber-100"
                        : "bg-blue-50 border border-blue-100 hover:bg-blue-100"
                    }`}
                  >
                    <p className="text-body text-gray-700">{alerta.mensagem}</p>
                    {alerta.acao && (
                      <span
                        className={`text-caption font-medium ${
                          alerta.tipo === "urgente"
                            ? "text-red-600"
                            : alerta.tipo === "atencao"
                            ? "text-amber-600"
                            : "text-blue-600"
                        }`}
                      >
                        {alerta.acao} →
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-body text-gray-400 text-center py-4">
                  Nenhum alerta no momento
                </p>
              )}
            </div>
          </div>
          )}

          {/* Propostas Comerciais */}
          <div className={`${LAYOUT.card} rounded-2xl min-w-0`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h3 className="font-normal text-gray-900">
                    Propostas Comerciais
                  </h3>
                  <p className="text-caption text-gray-500">
                    ConversÍo e pipeline
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/propostas")}
                className="text-body text-violet-600 hover:text-violet-700 transition-colors"
              >
                Ver todas →
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-[18px] font-light text-amber-600">
                  {metrics.propostasAbertas}
                </p>
                <p className="text-caption text-gray-500 mt-1">Aguardando</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-[18px] font-light text-emerald-600">
                  {metrics.propostasAprovadas}
                </p>
                <p className="text-caption text-gray-500 mt-1">Aprovadas</p>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-[18px] font-light text-gray-900">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                    notation: "compact",
                  }).format(metrics.valorPropostas)}
                </p>
                <p className="text-caption text-gray-500 mt-1">Valor Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* ====== QUINTA LINHA: GRID PRINCIPAL (Gráficos e Detalhes) ====== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUNA ESQUERDA - Gráficos e Finanças */}
          <div className="lg:col-span-8 space-y-6">
            {/* Gráfico Financeiro */}
            <div className={`${LAYOUT.card} rounded-2xl`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className={TYPOGRAPHY.sectionTitle}>
                    Curva S (Acumulado)
                  </h3>
                  <p className="text-body text-gray-500">
                    Receitas vs Despesas - Últimos 6 meses
                  </p>
                </div>
                <div className="flex items-center gap-4 text-body">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                    <span className="text-gray-500">Receitas</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    <span className="text-gray-500">Despesas</span>
                  </div>
                </div>
              </div>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dadosMensais}>
                    <defs>
                      <linearGradient
                        id="colorReceitasCEO"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorDespesasCEO"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#9ca3af"
                          stopOpacity={0.2}
                        />
                        <stop
                          offset="95%"
                          stopColor="#9ca3af"
                          stopOpacity={0}
                        />
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
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#9ca3af"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "12px",
                        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                      }}
                      labelStyle={{ color: "#374151" }}
                      formatter={(value: number) => [
                        new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(value),
                        "",
                      ]}
                    />
                    <Area
                      type="monotone"
                      dataKey="receitas"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorReceitasCEO)"
                      name="Receitas"
                    />
                    <Area
                      type="monotone"
                      dataKey="despesas"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorDespesasCEO)"
                      name="Despesas"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* COLUNA DIREITA - Menções e Alertas */}
          <div className="lg:col-span-4 space-y-6">
            {/* Menções do CEO */}
            {mencoes.length > 0 && (
              <div className={`${LAYOUT.card} rounded-2xl`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                      <AtSign className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h3 className={TYPOGRAPHY.cardTitle}>
                        Você foi Mencionado
                      </h3>
                      <p className="text-caption text-gray-500">
                        {mencoes.length}{" "}
                        {mencoes.length === 1
                          ? "mençÍo recente"
                          : "menções recentes"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {mencoes.map((mencao) => (
                    <div
                      key={mencao.id}
                      className="group flex items-start gap-3 p-3 bg-gray-50 hover:bg-gray-100 rounded-xl transition-all"
                    >
                      <MessageSquare className="w-4 h-4 text-purple-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        {mencao.task?.titulo && (
                          <p className="text-body font-medium text-gray-900 truncate">
                            {mencao.task.titulo}
                          </p>
                        )}
                        <p className="text-caption text-gray-500 line-clamp-2 mt-0.5">
                          {mencao.comentario.substring(0, 100)}...
                        </p>
                        {mencao.task?.project?.nome && (
                          <p className="text-caption text-purple-600 mt-1">
                            {mencao.task.project.nome}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleImportarMencao(mencao)}
                        disabled={importandoMencao === mencao.id}
                        className="opacity-0 group-hover:opacity-100 p-1.5 bg-purple-100 hover:bg-purple-200 rounded-lg transition-all"
                        title="Adicionar ao checklist"
                      >
                        {importandoMencao === mencao.id ? (
                          <Loader2 className="w-3.5 h-3.5 text-purple-600 animate-spin" />
                        ) : (
                          <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Acesso Rápido */}
            <div className={`${LAYOUT.card} rounded-2xl`}>
              <h3 className={`${TYPOGRAPHY.sectionTitle} mb-4`}>
                Acesso Rápido
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => navigate("/propostas")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-orange-50 border border-transparent hover:border-orange-100 rounded-xl transition-all"
                >
                  <FileText className="w-5 h-5 text-orange-500" />
                  <span className="text-caption text-gray-600">Propostas</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/contratos")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-xl transition-all"
                >
                  <Briefcase className="w-5 h-5 text-blue-500" />
                  <span className="text-caption text-gray-600">Contratos</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/financeiro")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-xl transition-all"
                >
                  <DollarSign className="w-5 h-5 text-emerald-500" />
                  <span className="text-caption text-gray-600">Financeiro</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/meu-financeiro")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-xl transition-all"
                >
                  <Wallet className="w-5 h-5 text-amber-500" />
                  <span className="text-caption text-gray-600">Meu Financeiro</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/pessoas/clientes")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-violet-50 border border-transparent hover:border-violet-100 rounded-xl transition-all"
                >
                  <Users className="w-5 h-5 text-violet-500" />
                  <span className="text-caption text-gray-600">Clientes</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/cronograma")}
                  className="flex flex-col items-center gap-2 p-4 bg-gray-50 hover:bg-cyan-50 border border-transparent hover:border-cyan-100 rounded-xl transition-all"
                >
                  <Calendar className="w-5 h-5 text-cyan-500" />
                  <span className="text-caption text-gray-600">Cronograma</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ====== FOOTER ====== */}
        <footer className="pt-6 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <p className="text-body text-gray-500">
              WG Easy · Dashboard Executivo
            </p>
          </div>
          <p className="text-caption text-gray-400">
            Grupo WG Almeida · v2.0 CEO Edition
          </p>
        </footer>
      </div>
    </div>
  );
}

