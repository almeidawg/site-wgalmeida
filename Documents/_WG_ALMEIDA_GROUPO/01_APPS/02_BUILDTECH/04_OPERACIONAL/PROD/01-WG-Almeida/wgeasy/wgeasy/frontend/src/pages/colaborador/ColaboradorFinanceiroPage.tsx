/**
 * Página Financeira do Colaborador
 * Valores a receber, histórico de pagamentos, solicitações de reembolso
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth } from "@/auth/AuthContext";
import { formatarData, formatarMoeda } from "@/lib/utils";
import {
  Wallet,
  TrendingUp,
  Clock,
  Calendar,
  Building2,
  Receipt,
  CreditCard,
  Plus,
  ChevronDown,
  Banknote,
  FileText,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { Progress } from "@/components/ui/progress";
import { normalizeSearchTerm } from "@/utils/searchUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  listarValoresReceber,
  obterResumoFinanceiroColaborador,
  listarLancamentosFavorecido,
  ColaboradorValorReceber,
  ResumoFinanceiroColaborador,
  ColaboradorLancamento,
} from "@/lib/colaboradorApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SolicitacaoReembolsoModal } from "@/components/reembolso/SolicitacaoReembolsoModal";
import { supabase } from "@/lib/supabaseClient";

const getClienteNomeExibicao = (nome?: string | null) =>
  nome?.trim() || "Sem cliente";

const getLancamentoClienteLabel = (lancamento: ColaboradorLancamento) =>
  lancamento.contrato?.numero || lancamento.projeto?.nome || "Sem contrato";

const inferirNucleoFinanceiro = (lancamento: ColaboradorLancamento): string => {
  const nucleo = String(lancamento.nucleo || "").trim();
  if (nucleo) return nucleo;

  const base = `${lancamento.categoria || ""} ${lancamento.descricao || ""}`.toLowerCase();
  if (base.includes("eng")) return "engenharia";
  if (base.includes("marc")) return "marcenaria";
  if (base.includes("arq")) return "arquitetura";
  return "geral";
};

const getCentroCustoLancamento = (lancamento: ColaboradorLancamento): string =>
  String(lancamento.centro_custos || lancamento.centro_custo || "").trim();

interface SolicitacaoReembolso {
  id: string;
  tipo: "reembolso" | "pagamento";
  descricao: string;
  valor: number;
  data_despesa: string;
  categoria: string;
  status: string;
  cliente_nome?: string;
  contrato_numero?: string;
  created_at: string;
}

export default function ColaboradorFinanceiroPage() {
  const { usuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(true);
  const [valores, setValores] = useState<ColaboradorValorReceber[]>([]);
  const [resumo, setResumo] = useState<ResumoFinanceiroColaborador | null>(null);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos");
  const [clienteFiltroSolicitacao, setClienteFiltroSolicitacao] = useState<string>("todos");
  const [buscaClienteSolicitacao, setBuscaClienteSolicitacao] = useState<string>("");
  const [clienteFiltroLancamento, setClienteFiltroLancamento] = useState<string>("todos");
  const [buscaClientePagamento, setBuscaClientePagamento] = useState<string>("");

  // Estado para lançamentos (pagamentos recebidos)
  const [lancamentos, setLancamentos] = useState<ColaboradorLancamento[]>([]);
  const [loadingLancamentos, setLoadingLancamentos] = useState(false);


  // Filtro de Centro de Custo (usando coluna centro_custos dos lançamentos)
  const [centroCusto, setCentroCusto] = useState<string>("todos");
  // Obter lista única de centro de custos dos lançamentos
  const centrosCustoDisponiveis = useMemo(() => {
    const centros = lancamentos
      .map((l) => getCentroCustoLancamento(l))
      .filter(Boolean);
    return [...new Set(centros)].filter(Boolean);
  }, [lancamentos]);

  // Estados para solicitações
  const [solicitacoes, setSolicitacoes] = useState<SolicitacaoReembolso[]>([]);
  const [loadingSolicitacoes, setLoadingSolicitacoes] = useState(false);
  const [showModalReembolso, setShowModalReembolso] = useState(false);
  const [tipoSolicitacao, setTipoSolicitacao] = useState<"reembolso" | "pagamento">("reembolso");
  const [activeTab, setActiveTab] = useState("pagamentos");

  // (removido duplicidade)

  // Carregar lançamentos do financeiro (pagamentos recebidos)
  const carregarLancamentos = useCallback(async () => {
    if (!usuarioCompleto?.pessoa_id) return;

    setLoadingLancamentos(true);
    try {
      const data = await listarLancamentosFavorecido(usuarioCompleto.pessoa_id);
      setLancamentos(data);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    } finally {
      setLoadingLancamentos(false);
    }
  }, [usuarioCompleto?.pessoa_id]);

  // Carregar solicitações
  const carregarSolicitacoes = useCallback(async () => {
    if (!usuarioCompleto?.pessoa_id) return;

    setLoadingSolicitacoes(true);
    try {
      const { data, error } = await supabase
        .from("solicitacoes_reembolso")
        .select(`
          *,
          cliente:pessoas!solicitacoes_reembolso_cliente_id_fkey(nome),
          contrato:contratos(numero)
        `)
        .eq("solicitante_id", usuarioCompleto.pessoa_id)
        .order("created_at", { ascending: false });

      if (!error) {
        setSolicitacoes(
          (data || []).map((s: any) => ({
            ...s,
            cliente_nome: s.cliente?.nome,
            contrato_numero: s.contrato?.numero,
          }))
        );
      }
    } catch (error) {
      console.error("Erro ao carregar solicitações:", error);
    } finally {
      setLoadingSolicitacoes(false);
    }
  }, [usuarioCompleto?.pessoa_id]);

  useEffect(() => {
    const carregarDados = async () => {
      if (!usuarioCompleto?.pessoa_id) return;

      try {
        setLoading(true);
        const [valoresData, resumoData] = await Promise.all([
          listarValoresReceber(usuarioCompleto.pessoa_id),
          obterResumoFinanceiroColaborador(usuarioCompleto.pessoa_id),
        ]);
        setValores(valoresData);
        setResumo(resumoData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
    carregarSolicitacoes();
    carregarLancamentos();
  }, [usuarioCompleto?.pessoa_id, carregarSolicitacoes, carregarLancamentos]);

  const clientesSolicitacoesDisponiveis = useMemo(() => {
    return Array.from(
      new Set(solicitacoes.map((sol) => getClienteNomeExibicao(sol.cliente_nome)))
    );
  }, [solicitacoes]);

  const solicitacoesFiltradas = useMemo(() => {
    const busca = normalizeSearchTerm(buscaClienteSolicitacao);
    return solicitacoes.filter((sol) => {
      const nome = getClienteNomeExibicao(sol.cliente_nome);
      const matchCliente =
        clienteFiltroSolicitacao === "todos" || nome === clienteFiltroSolicitacao;
      const matchBusca = !busca || normalizeSearchTerm(nome).includes(busca);
      return matchCliente && matchBusca;
    });
  }, [solicitacoes, clienteFiltroSolicitacao, buscaClienteSolicitacao]);

  const totalSolicitacoesFiltradas = solicitacoesFiltradas.reduce(
    (acc, s) => acc + s.valor,
    0
  );

  // Abrir modal de solicitaçÍo
  const abrirModalSolicitacao = (tipo: "reembolso" | "pagamento") => {
    setTipoSolicitacao(tipo);
    setShowModalReembolso(true);
  };


  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      previsto: { label: "Previsto", color: "bg-yellow-100 text-yellow-800" },
      aprovado: { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
      liberado: { label: "Liberado", color: "bg-emerald-100 text-emerald-800" },
      pago: { label: "Pago", color: "bg-green-100 text-green-800" },
      cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const getTipoBadge = (tipo: string) => {
    const tipoConfig: Record<string, { label: string; color: string }> = {
      comissao: { label: "ComissÍo", color: "bg-purple-100 text-purple-800" },
      honorario: { label: "Honorário", color: "bg-indigo-100 text-indigo-800" },
      fee_projeto: { label: "Fee Projeto", color: "bg-cyan-100 text-cyan-800" },
      bonus: { label: "Bônus", color: "bg-pink-100 text-pink-800" },
      repasse: { label: "Repasse", color: "bg-orange-100 text-orange-800" },
      outros: { label: "Outros", color: "bg-gray-100 text-gray-600" },
    };

    const config = tipoConfig[tipo] || {
      label: tipo,
      color: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  const valoresFiltrados = valores.filter((v) => {
    const matchStatus = statusFiltro === "todos" || v.status === statusFiltro;
    const matchTipo = tipoFiltro === "todos" || v.tipo === tipoFiltro;
    // NÍo filtra valores por centro de custo, pois só lançamentos têm centro_custos
    return matchStatus && matchTipo;
  });

  const lancamentosFiltradosBase = useMemo(() => {
    return lancamentos.filter((l) => {
      const matchCentro =
        centroCusto === "todos" || getCentroCustoLancamento(l) === centroCusto;
      return matchCentro;
    });
  }, [lancamentos, centroCusto]);

  const lancamentosFiltrados = useMemo(() => {
    const termo = normalizeSearchTerm(buscaClientePagamento);
    return lancamentosFiltradosBase.filter((lancamento) => {
      const label = getLancamentoClienteLabel(lancamento);
      const matchCliente =
        clienteFiltroLancamento === "todos" || label === clienteFiltroLancamento;
      const matchBusca = !termo || normalizeSearchTerm(label).includes(termo);
      return matchCliente && matchBusca;
    });
  }, [lancamentosFiltradosBase, clienteFiltroLancamento, buscaClientePagamento]);

  const lancamentosClientesDisponiveis = useMemo(() => {
    return Array.from(new Set(lancamentos.map(getLancamentoClienteLabel)));
  }, [lancamentos]);

  const totalFiltrado = valoresFiltrados.reduce((acc, v) => acc + v.valor, 0);
  const valorRecebidoTotal = lancamentosFiltrados
    .filter((l) => l.status === "pago")
    .reduce((acc, l) => acc + l.valor_total, 0);

  // Status badge para solicitações
  const getStatusSolicitacaoBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; color: string }> = {
      pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
      aprovado: { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
      rejeitado: { label: "Rejeitado", color: "bg-red-100 text-red-800" },
      pago: { label: "Pago", color: "bg-green-100 text-green-800" },
      faturado: { label: "Faturado", color: "bg-purple-100 text-purple-800" },
      cancelado: { label: "Cancelado", color: "bg-gray-100 text-gray-600" },
    };

    const config = statusConfig[status] || {
      label: status,
      color: "bg-gray-100 text-gray-600",
    };
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}
      >
        {config.label}
      </span>
    );
  };

  // Contadores de solicitações
  const solicitacoesPendentes = solicitacoes.filter(
    (s) => s.status === "pendente"
  ).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
      </div>
    );
  }
  if (!loading && valores.length === 0 && resumo === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-600">
        <p>Erro ao carregar dados financeiros. Verifique sua conexÍo ou tente novamente mais tarde.</p>
      </div>
    );
  }

  return (
    <div className={LAYOUT.pageContainer}>
      <div className={LAYOUT.sectionGap}>
      {/* Filtro de Centro de Custo */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <label className={TYPOGRAPHY.formLabel}>Centro de Custo:</label>
        <Select value={centroCusto} onValueChange={setCentroCusto}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="Todos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            {centrosCustoDisponiveis.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {/* Header - Mobile Optimized */}
      <div className={LAYOUT.pageHeader}>
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>Meu Financeiro</h1>
          <p className={`${TYPOGRAPHY.pageSubtitle} mt-0.5 sm:mt-1`}>Acompanhe seus valores</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="bg-wg-primary hover:bg-wg-primary/90 text-lg">
              <Plus className="h-4 w-4 mr-2" />
              Solicitações
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => abrirModalSolicitacao("pagamento")}>
              <CreditCard className="h-4 w-4 mr-2 text-blue-500" />
              Solicitar Pagamento
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => abrirModalSolicitacao("reembolso")}>
              <Receipt className="h-4 w-4 mr-2 text-green-500" />
              Solicitar Reembolso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Cards de Resumo - Filtro aplicado */}
      <div className={LAYOUT.gridStats}>
        {/* A Receber */}
        <Card className={LAYOUT.cardStat}>
          <CardContent className={LAYOUT.cardPadding}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`${TYPOGRAPHY.overline} truncate`}>
                  A Receber
                </p>
                <p className={`${TYPOGRAPHY.statNumber} text-violet-600 mt-0.5 sm:mt-1 truncate`}>
                  {formatarMoeda(totalFiltrado)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 bg-violet-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Wallet className={`${TYPOGRAPHY.iconMedium} text-violet-500`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pagamentos Pendentes */}
        <Card className={LAYOUT.cardStat}>
          <CardContent className={LAYOUT.cardPadding}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`${TYPOGRAPHY.overline} truncate`}>
                  Pendentes
                </p>
                <p className={`${TYPOGRAPHY.statNumber} text-amber-600 mt-0.5 sm:mt-1`}>
                  {valoresFiltrados.filter(
                    (v) => v.status === "liberado" || v.status === "aprovado"
                  ).length}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 bg-amber-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className={`${TYPOGRAPHY.iconMedium} text-amber-500`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ja Recebido */}
        <Card className={LAYOUT.cardStat}>
          <CardContent className={LAYOUT.cardPadding}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`${TYPOGRAPHY.overline} truncate`}>
                  Recebido
                </p>
                <p className={`${TYPOGRAPHY.statNumber} text-emerald-600 mt-0.5 sm:mt-1 truncate`}>
                  {formatarMoeda(valorRecebidoTotal)}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 bg-emerald-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className={`${TYPOGRAPHY.iconMedium} text-emerald-500`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Solicitacoes Pendentes */}
        <Card
          className={`${LAYOUT.cardStat} cursor-pointer hover:shadow-md transition-shadow`}
          onClick={() => setActiveTab("solicitacoes")}
        >
          <CardContent className={LAYOUT.cardPadding}>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className={`${TYPOGRAPHY.overline} truncate`}>
                  Solicitacoes
                </p>
                <p className={`${TYPOGRAPHY.statNumber} text-orange-600 mt-0.5 sm:mt-1`}>
                  {solicitacoesPendentes}
                </p>
              </div>
              <div className="h-9 w-9 sm:h-12 sm:w-12 bg-orange-50 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <Receipt className={`${TYPOGRAPHY.iconMedium} text-orange-500`} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs para Valores, Pagamentos e Solicitações - Mobile Optimized */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          <TabsTrigger value="pagamentos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Banknote className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Pagamentos</span>
            <span className="sm:hidden">Pagos</span>
            {lancamentosFiltrados.filter((l) => l.status === "pago").length > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-green-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                {lancamentosFiltrados.filter((l) => l.status === "pago").length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="valores" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Wallet className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Valores a Receber</span>
            <span className="sm:hidden">Receber</span>
          </TabsTrigger>
          <TabsTrigger value="solicitacoes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm py-2">
            <Receipt className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden sm:inline">Solicitações</span>
            <span className="sm:hidden">Pedidos</span>
            {solicitacoesPendentes > 0 && (
              <span className="ml-0.5 sm:ml-1 bg-orange-500 text-white text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full">
                {solicitacoesPendentes}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Valores a Receber */}
        <TabsContent value="valores" className="space-y-4 mt-4">
          {/* Barra de Progresso Global */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-normal text-gray-900">
                  Progresso de Recebimentos
                </h3>
                <span className="text-sm text-gray-500">
                  {resumo &&
                    Math.round(
                      (resumo.valor_pago /
                        (resumo.valor_previsto +
                          resumo.valor_aprovado +
                          resumo.valor_liberado +
                          resumo.valor_pago || 1)) *
                        100
                    )}
                  % concluído
                </span>
              </div>
              <Progress
                value={
                  resumo
                    ? (resumo.valor_pago /
                        (resumo.valor_previsto +
                          resumo.valor_aprovado +
                          resumo.valor_liberado +
                          resumo.valor_pago || 1)) *
                      100
                    : 0
                }
                className="h-3"
              />
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>
                  Total:{" "}
                  {formatarMoeda(
                    (resumo?.valor_previsto || 0) +
                      (resumo?.valor_aprovado || 0) +
                      (resumo?.valor_liberado || 0) +
                      (resumo?.valor_pago || 0)
                  )}
                </span>
                <span>Recebido: {formatarMoeda(resumo?.valor_pago || 0)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Valores */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Valores a Receber</CardTitle>
                <div className="flex gap-2">
                  <Select value={statusFiltro} onValueChange={setStatusFiltro}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="previsto">Previstos</SelectItem>
                      <SelectItem value="aprovado">Aprovados</SelectItem>
                      <SelectItem value="liberado">Liberados</SelectItem>
                      <SelectItem value="pago">Pagos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="comissao">ComissÍo</SelectItem>
                      <SelectItem value="honorario">Honorário</SelectItem>
                      <SelectItem value="fee_projeto">Fee Projeto</SelectItem>
                      <SelectItem value="bonus">Bônus</SelectItem>
                      <SelectItem value="repasse">Repasse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {valoresFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum valor encontrado</p>
                  <p className="text-sm mt-1">
                    {statusFiltro !== "todos" || tipoFiltro !== "todos"
                      ? "Tente ajustar os filtros"
                      : "Você ainda nÍo possui valores a receber registrados"}
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Projeto</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>DescriçÍo</TableHead>
                          <TableHead>Data Prevista</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {valoresFiltrados.map((valor) => (
                          <TableRow key={valor.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {valor.projeto?.cliente_nome || "Geral"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{getTipoBadge(valor.tipo)}</TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {valor.descricao || "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {valor.data_prevista ? formatarData(valor.data_prevista) : "-"}
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(valor.status)}</TableCell>
                            <TableCell className="text-right font-normal text-wg-primary">
                              {formatarMoeda(valor.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total Filtrado */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">
                      {valoresFiltrados.length} registro
                      {valoresFiltrados.length !== 1 ? "s" : ""}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="ml-2 text-lg font-normal text-wg-primary">
                        {formatarMoeda(totalFiltrado)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Pagamentos Recebidos (Lançamentos do Financeiro) */}
        <TabsContent value="pagamentos" className="mt-4">
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={buscaClientePagamento}
              onChange={(e) => setBuscaClientePagamento(e.target.value)}
              placeholder="Buscar cliente ou contrato..."
              className="w-full sm:w-64"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Cliente
              </span>
              <Select
                value={clienteFiltroLancamento}
                onValueChange={setClienteFiltroLancamento}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {lancamentosClientesDisponiveis.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-green-600" />
                  Histórico de Pagamentos
                </CardTitle>
                <p className="text-sm text-gray-500">
                  Pagamentos registrados no sistema financeiro
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {loadingLancamentos ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
                </div>
              ) : lancamentosFiltrados.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Banknote className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhum pagamento registrado</p>
                  <p className="text-sm mt-1">
                    Seus pagamentos aparecerÍo aqui quando forem lançados no sistema financeiro
                  </p>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>DescriçÍo</TableHead>
                          <TableHead>Contrato/Projeto</TableHead>
                          <TableHead>Núcleo / Centro Custo</TableHead>
                          <TableHead>Vencimento</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lancamentosFiltrados.map((lancamento) => (
                          <TableRow key={lancamento.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-gray-400" />
                                <span className="font-medium max-w-[200px] truncate">
                                  {lancamento.descricao || "Pagamento"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span>
                                  {lancamento.contrato?.numero || lancamento.projeto?.nome || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-100 text-indigo-700 capitalize">
                                  {inferirNucleoFinanceiro(lancamento)}
                                </span>
                                {getCentroCustoLancamento(lancamento) ? (
                                  <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-700">
                                    CC: {getCentroCustoLancamento(lancamento)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">Sem CC</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {lancamento.vencimento
                                  ? formatarData(lancamento.vencimento)
                                  : lancamento.data_competencia
                                    ? formatarData(lancamento.data_competencia)
                                    : "-"}
                              </div>
                            </TableCell>
                            <TableCell>
                              {(() => {
                                const statusConfig: Record<string, { label: string; color: string }> = {
                                  pendente: { label: "Pendente", color: "bg-yellow-100 text-yellow-800" },
                                  aprovado: { label: "Aprovado", color: "bg-blue-100 text-blue-800" },
                                  pago: { label: "Pago", color: "bg-green-100 text-green-800" },
                                  cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800" },
                                  agendado: { label: "Agendado", color: "bg-purple-100 text-purple-800" },
                                };
                                const config = statusConfig[lancamento.status || "pendente"] || {
                                  label: lancamento.status || "Pendente",
                                  color: "bg-gray-100 text-gray-600",
                                };
                                return (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                                    {config.label}
                                  </span>
                                );
                              })()}
                            </TableCell>
                            <TableCell className="text-right font-normal text-green-600">
                              {formatarMoeda(lancamento.valor_total)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total de Pagamentos */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">
                      {lancamentosFiltrados.length} pagamento{lancamentosFiltrados.length !== 1 ? "s" : ""}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total Recebido:</span>
                      <span className="ml-2 text-lg font-normal text-green-600">
                        {formatarMoeda(valorRecebidoTotal)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Minhas Solicitações */}
        <TabsContent value="solicitacoes" className="mt-4">
          <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              value={buscaClienteSolicitacao}
              onChange={(e) => setBuscaClienteSolicitacao(e.target.value)}
              placeholder="Buscar cliente ..."
              className="w-full sm:w-64"
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-500">
                Cliente
              </span>
              <Select
                value={clienteFiltroSolicitacao}
                onValueChange={setClienteFiltroSolicitacao}
              >
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Todos os clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  {clientesSolicitacoesDisponiveis.map((nome) => (
                    <SelectItem key={nome} value={nome}>
                      {nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <CardTitle>Minhas Solicitações</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => abrirModalSolicitacao("pagamento")}
                    className="text-lg"
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pagamento
                  </Button>
                  <Button
                    size="sm"
                    className="bg-wg-primary hover:bg-wg-primary/90 text-lg"
                    onClick={() => abrirModalSolicitacao("reembolso")}
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Reembolso
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSolicitacoes ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-wg-primary" />
                </div>
              ) : solicitacoesFiltradas.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">Nenhuma solicitaçÍo</p>
                  <p className="text-sm mt-1">
                    Ajuste os filtros para encontrar solicitações registradas
                  </p>
                  <div className="flex gap-2 justify-center mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => abrirModalSolicitacao("pagamento")}
                      className="text-lg"
                    >
                      <CreditCard className="h-4 w-4 mr-2" />
                      Solicitar Pagamento
                    </Button>
                    <Button
                      size="sm"
                      className="bg-wg-primary hover:bg-wg-primary/90 text-lg"
                      onClick={() => abrirModalSolicitacao("reembolso")}
                    >
                      <Receipt className="h-4 w-4 mr-2" />
                      Solicitar Reembolso
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead>DescriçÍo</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Valor</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {solicitacoesFiltradas.map((sol) => (
                          <TableRow key={sol.id}>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {sol.tipo === "reembolso" ? (
                                  <Receipt className="h-4 w-4 text-green-500" />
                                ) : (
                                  <CreditCard className="h-4 w-4 text-blue-500" />
                                )}
                                <span className="text-sm capitalize">
                                  {sol.tipo}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-4 w-4 text-gray-400" />
                                <span className="font-medium">
                                  {sol.cliente_nome || "-"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate">
                              {sol.descricao}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Calendar className="h-3 w-3" />
                                {formatarData(sol.data_despesa)}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusSolicitacaoBadge(sol.status)}
                            </TableCell>
                            <TableCell className="text-right font-normal text-wg-primary">
                              {formatarMoeda(sol.valor)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Total */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <span className="text-sm text-gray-500">
                      {solicitacoesFiltradas.length} solicitaçÍo
                      {solicitacoesFiltradas.length !== 1 ? "ões" : ""}
                    </span>
                    <div className="text-right">
                      <span className="text-sm text-gray-500">Total:</span>
                      <span className="ml-2 text-lg font-normal text-wg-primary">
                        {formatarMoeda(totalSolicitacoesFiltradas)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Solicitacao */}
      <SolicitacaoReembolsoModal
        open={showModalReembolso}
        onClose={() => setShowModalReembolso(false)}
        onSuccess={carregarSolicitacoes}
        tipo={tipoSolicitacao}
        solicitanteId={usuarioCompleto?.pessoa_id || ""}
      />
      </div>
    </div>
  );
}

