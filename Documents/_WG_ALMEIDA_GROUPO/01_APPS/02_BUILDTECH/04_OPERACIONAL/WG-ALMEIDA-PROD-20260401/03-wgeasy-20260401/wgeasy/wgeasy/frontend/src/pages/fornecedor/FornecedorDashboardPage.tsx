/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Dashboard do Fornecedor
 * VisÍo geral de cotações, serviços e financeiro
 */

import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import { useImpersonation, ImpersonationBar } from "@/hooks/useImpersonation";
import {
  FileSearch,
  Wallet,
  Briefcase,
  TrendingUp,
  ArrowRight,
  Clock,
  CheckCircle2,
  Send,
  DollarSign,
  AlertCircle,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  listarCotacoesParaFornecedor,
  listarServicosContratados,
  obterResumoFinanceiroFornecedor,
  CotacaoParaFornecedor,
  FornecedorServico,
  ResumoFinanceiroFornecedor,
} from "@/lib/fornecedorAreaApi";

export default function FornecedorDashboardPage() {
  const { usuarioCompleto } = useAuth();
  const [searchParams] = useSearchParams();
  const {
    isImpersonating,
    impersonatedUser,
    stopImpersonation,
    effectiveUserId,
    loading: impersonationLoading,
  } = useImpersonation();

  const [loading, setLoading] = useState(true);
  const [cotacoes, setCotacoes] = useState<CotacaoParaFornecedor[]>([]);
  const [servicos, setServicos] = useState<FornecedorServico[]>([]);
  const [resumoFinanceiro, setResumoFinanceiro] =
    useState<ResumoFinanceiroFornecedor | null>(null);

  // Determinar o ID do fornecedor a ser usado (impersonado ou real)
  const fornecedorId = effectiveUserId || usuarioCompleto?.pessoa_id;

  useEffect(() => {
    const carregarDados = async () => {
      if (!fornecedorId || impersonationLoading) return;

      try {
        setLoading(true);

        const [cotacoesData, servicosData, resumoData] = await Promise.all([
          listarCotacoesParaFornecedor(fornecedorId),
          listarServicosContratados(fornecedorId),
          obterResumoFinanceiroFornecedor(fornecedorId),
        ]);

        setCotacoes(cotacoesData);
        setServicos(servicosData);
        setResumoFinanceiro(resumoData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarDados();
  }, [fornecedorId, impersonationLoading]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const cotacoesAbertas = cotacoes.filter((c) => c.status === "aberta");
  const cotacoesPendentes = cotacoes.filter(
    (c) => c.proposta_status === "rascunho" || !c.proposta_id
  );

  const getStatusServicoBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      contratado: { label: "Contratado", variant: "outline" },
      em_execucao: { label: "Em ExecuçÍo", variant: "default" },
      pausado: { label: "Pausado", variant: "secondary" },
      concluido: { label: "Concluído", variant: "secondary" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading || impersonationLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
      </div>
    );
  }

  // Nome a exibir (impersonado ou real)
  const nomeExibicao = isImpersonating
    ? impersonatedUser?.nome
    : (usuarioCompleto?.empresa || usuarioCompleto?.nome?.split(" ")[0]);

  return (
    <>
      {/* Barra de impersonaçÍo */}
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="FORNECEDOR"
          onExit={stopImpersonation}
        />
      )}

      <div className={`space-y-6 ${isImpersonating ? "pt-14" : ""}`}>
        {/* Header */}
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
            Bem-vindo, {nomeExibicao}!
        </h1>
        <p className="text-gray-500 mt-1">
          Acompanhe suas cotações, serviços e pagamentos
        </p>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cotações Abertas */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-gray-500">
                  Cotações Abertas
                </p>
                <p className="text-[20px] font-normal text-gray-900 mt-1">
                  {cotacoesAbertas.length}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileSearch className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Serviços Ativos */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-gray-500">
                  Serviços Ativos
                </p>
                <p className="text-[20px] font-normal text-gray-900 mt-1">
                  {servicos.filter((s) => s.status === "em_execucao").length}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* A Receber */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-gray-500">A Receber</p>
                <p className="text-[20px] font-normal text-gray-900 mt-1">
                  {formatarMoeda(resumoFinanceiro?.valor_pendente || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-amber-100 rounded-lg flex items-center justify-center">
                <Wallet className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Recebido */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[12px] font-medium text-gray-500">Recebido</p>
                <p className="text-[20px] font-normal text-gray-900 mt-1">
                  {formatarMoeda(resumoFinanceiro?.valor_pago || 0)}
                </p>
              </div>
              <div className="h-10 w-10 sm:h-12 sm:w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Conteúdo Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cotações */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cotações Pendentes */}
          {cotacoesPendentes.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-normal flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-5 w-5" />
                  Cotações Aguardando Sua Proposta
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cotacoesPendentes.slice(0, 3).map((cotacao) => {
                    const prazoRestante = Math.ceil(
                      (new Date(cotacao.data_limite).getTime() - Date.now()) /
                        (1000 * 60 * 60 * 24)
                    );
                    return (
                      <Link
                        key={cotacao.id}
                        to={`/fornecedor/cotacoes/${cotacao.id}`}
                        className="block p-4 bg-white rounded-lg border hover:border-[#F25C26] transition-colors"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">
                              {cotacao.titulo}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                              {cotacao.categoria} • {cotacao.projeto_nome || "Projeto"}
                            </p>
                          </div>
                          <Badge
                            variant={prazoRestante <= 2 ? "destructive" : "secondary"}
                          >
                            {prazoRestante} dias
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            Prazo: {formatarData(cotacao.data_limite)}
                          </span>
                          <Button size="sm" variant="default" className="text-[14px]">
                            <Send className="h-4 w-4 mr-1" />
                            Enviar Proposta
                          </Button>
                        </div>
                      </Link>
                    );
                  })}
                </div>
                {cotacoesPendentes.length > 3 && (
                  <Button
                    variant="ghost"
                    className="w-full mt-3 text-amber-700 text-[14px]"
                    asChild
                  >
                    <Link to="/fornecedor/cotacoes">
                      Ver todas as {cotacoesPendentes.length} cotações
                      <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Serviços Contratados */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg font-normal">
                Meus Serviços
              </CardTitle>
              <Button variant="ghost" size="sm" asChild className="text-[14px]">
                <Link to="/fornecedor/servicos">
                  Ver todos
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              {servicos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum serviço contratado ainda</p>
                  <p className="text-sm mt-1">
                    Participe das cotações para ser contratado
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {servicos.slice(0, 4).map((servico) => (
                    <div
                      key={servico.id}
                      className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {servico.descricao}
                          </p>
                          <p className="text-sm text-gray-500">
                            {servico.projeto?.cliente_nome || "Cliente"} •{" "}
                            {servico.categoria?.nome || "Serviço"}
                          </p>
                        </div>
                        {getStatusServicoBadge(servico.status)}
                      </div>

                      {/* Progresso do serviço */}
                      <div className="mt-3">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">ExecuçÍo</span>
                          <span className="font-medium">
                            {servico.percentual_execucao}%
                          </span>
                        </div>
                        <Progress
                          value={servico.percentual_execucao}
                          className="h-1.5"
                        />
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t">
                        <span className="text-sm font-normal text-[#F25C26]">
                          {formatarMoeda(servico.valor_contratado)}
                        </span>
                        <span className="text-xs text-gray-500">
                          Contratado em {formatarData(servico.data_contratacao)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - Financeiro */}
        <div className="space-y-4">
          {/* Resumo Financeiro */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-normal">Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Total Contratado */}
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-700 mb-1">
                    <Briefcase className="h-4 w-4" />
                    <span className="text-sm font-medium">Total Contratado</span>
                  </div>
                  <p className="text-[20px] font-normal text-blue-900">
                    {formatarMoeda(resumoFinanceiro?.valor_contratado || 0)}
                  </p>
                </div>

                {/* Barra de progresso */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">Recebido</span>
                    <span className="font-medium">
                      {resumoFinanceiro &&
                        Math.round(
                          (resumoFinanceiro.valor_pago /
                            (resumoFinanceiro.valor_contratado || 1)) *
                            100
                        )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={
                      resumoFinanceiro
                        ? (resumoFinanceiro.valor_pago /
                            (resumoFinanceiro.valor_contratado || 1)) *
                          100
                        : 0
                    }
                    className="h-2"
                  />
                </div>

                {/* Detalhamento */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-1 text-green-700 mb-1">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-medium">Recebido</span>
                    </div>
                    <p className="text-[20px] font-normal text-green-900">
                      {formatarMoeda(resumoFinanceiro?.valor_pago || 0)}
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-lg">
                    <div className="flex items-center gap-1 text-amber-700 mb-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-medium">Pendente</span>
                    </div>
                    <p className="text-[20px] font-normal text-amber-900">
                      {formatarMoeda(resumoFinanceiro?.valor_pendente || 0)}
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full text-[14px]" asChild>
                  <Link to="/fornecedor/financeiro">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Propostas Enviadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-normal">
                Minhas Propostas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cotacoes.filter((c) => c.proposta_status === "enviada").length ===
              0 ? (
                <div className="text-center py-6 text-gray-500">
                  <Send className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Nenhuma proposta enviada</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cotacoes
                    .filter((c) => c.proposta_status === "enviada")
                    .slice(0, 3)
                    .map((cotacao) => (
                      <div
                        key={cotacao.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {cotacao.titulo}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <Badge variant="secondary" className="text-xs">
                            Em análise
                          </Badge>
                          <span className="text-sm font-normal text-[#F25C26]">
                            {formatarMoeda(cotacao.proposta_valor || 0)}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estatísticas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-normal">
                Estatísticas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    Total de Serviços
                  </span>
                  <span className="font-normal">
                    {resumoFinanceiro?.total_servicos || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">
                    Propostas Enviadas
                  </span>
                  <span className="font-normal">
                    {cotacoes.filter((c) => c.proposta_id).length}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">Taxa de Sucesso</span>
                  <span className="font-normal">
                    {(() => {
                      const propostasEnviadas = cotacoes.filter((c) => c.proposta_id).length;
                      if (propostasEnviadas === 0) return 0;
                      return Math.round((servicos.length / propostasEnviadas) * 100);
                    })()}
                    %
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>
    </>
  );
}

