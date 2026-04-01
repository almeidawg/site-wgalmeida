/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Página de Cotações do Fornecedor
 * Lista de cotações disponíveis e propostas enviadas
 */

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";
import {
  FileSearch,
  Clock,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Filter,
  Calendar,
  ArrowRight,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  listarCotacoesParaFornecedor,
  CotacaoParaFornecedor,
} from "@/lib/fornecedorAreaApi";

export default function FornecedorCotacoesPage() {
  const { usuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(true);
  const [cotacoes, setCotacoes] = useState<CotacaoParaFornecedor[]>([]);
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>("todas");

  useEffect(() => {
    const carregarCotacoes = async () => {
      if (!usuarioCompleto?.pessoa_id) return;

      try {
        setLoading(true);
        const data = await listarCotacoesParaFornecedor(usuarioCompleto.pessoa_id);
        setCotacoes(data);
      } catch (error) {
        console.error("Erro ao carregar cotações:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarCotacoes();
  }, [usuarioCompleto?.pessoa_id]);

  const formatarMoeda = (valor?: number) => {
    if (!valor) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const calcularDiasRestantes = (dataLimite: string) => {
    const dias = Math.ceil(
      (new Date(dataLimite).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return dias;
  };

  // Categorias únicas
  const categorias = [...new Set(cotacoes.map((c) => c.categoria))];

  // Filtrar por categoria
  const cotacoesFiltradas = cotacoes.filter(
    (c) => categoriaFiltro === "todas" || c.categoria === categoriaFiltro
  );

  // Separar por status
  const cotacoesAbertas = cotacoesFiltradas.filter(
    (c) => c.status === "aberta" && (!c.proposta_id || c.proposta_status === "rascunho")
  );
  const propostasEnviadas = cotacoesFiltradas.filter(
    (c) => c.proposta_status && ["enviada", "em_analise"].includes(c.proposta_status)
  );
  const propostasRespondidas = cotacoesFiltradas.filter(
    (c) => c.proposta_status && ["aprovada", "rejeitada", "vencedora"].includes(c.proposta_status)
  );

  const getPropostaStatusBadge = (status?: string) => {
    if (!status) return null;
    const config: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      rascunho: { label: "Rascunho", variant: "outline" },
      enviada: { label: "Enviada", variant: "default" },
      em_analise: { label: "Em Análise", variant: "default" },
      aprovada: { label: "Aprovada", variant: "secondary" },
      rejeitada: { label: "Rejeitada", variant: "destructive" },
      vencedora: { label: "Vencedora!", variant: "default" },
    };
    const c = config[status] || { label: status, variant: "outline" as const };
    return <Badge variant={c.variant}>{c.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#F25C26]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Cotações</h1>
          <p className="text-[16px] text-gray-500 mt-1">
            Participe das cotações e envie suas propostas
          </p>
        </div>
        <Select value={categoriaFiltro} onValueChange={setCategoriaFiltro}>
          <SelectTrigger className="w-[180px] text-[14px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas Categorias</SelectItem>
            {categorias.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-amber-100 rounded-lg flex items-center justify-center">
                <FileSearch className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-[20px] font-normal">{cotacoesAbertas.length}</p>
                <p className="text-[12px] text-gray-500">Aguardando Proposta</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Send className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-[20px] font-normal">{propostasEnviadas.length}</p>
                <p className="text-[12px] text-gray-500">Em Análise</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-[20px] font-normal">
                  {propostasRespondidas.filter((p) => p.proposta_status === "vencedora").length}
                </p>
                <p className="text-[12px] text-gray-500">Vencidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="abertas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="abertas" className="relative">
            Abertas
            {cotacoesAbertas.length > 0 && (
              <span className="ml-2 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center">
                {cotacoesAbertas.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="enviadas">Em Análise</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
        </TabsList>

        {/* Cotações Abertas */}
        <TabsContent value="abertas">
          {cotacoesAbertas.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-[14px]">Nenhuma cotaçÍo aberta</p>
                  <p className="text-sm mt-1">
                    Novas cotações aparecerÍo aqui quando estiverem disponíveis
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {cotacoesAbertas.map((cotacao) => {
                const diasRestantes = calcularDiasRestantes(cotacao.data_limite);
                const urgente = diasRestantes <= 2;
                return (
                  <Card
                    key={cotacao.id}
                    className={`hover:shadow-md transition-shadow ${
                      urgente ? "border-amber-300 bg-amber-50/30" : ""
                    }`}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start gap-3">
                            {urgente && (
                              <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <h3 className="font-normal text-gray-900 text-[20px]">
                                {cotacao.titulo}
                              </h3>
                              <p className="text-sm text-gray-500 mt-1">
                                {cotacao.categoria} - {cotacao.projeto_nome || "Projeto WG"}
                              </p>
                              {cotacao.descricao && (
                                <p className="text-[16px] text-gray-600 mt-2 line-clamp-2">
                                  {cotacao.descricao}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-4 w-4" />
                              <span>Prazo: {formatarData(cotacao.data_limite)}</span>
                            </div>
                            <Badge variant={urgente ? "destructive" : "secondary"}>
                              {diasRestantes > 0 ? `${diasRestantes} dias restantes` : "Encerra hoje!"}
                            </Badge>
                            {cotacao.prazo_execucao_dias && (
                              <span className="text-gray-500">
                                ExecuçÍo: {cotacao.prazo_execucao_dias} dias
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 lg:flex-shrink-0">
                          <Button asChild className="text-[14px]">
                            <Link to={`/fornecedor/cotacoes/${cotacao.id}`}>
                              <Send className="h-4 w-4 mr-2" />
                              Enviar Proposta
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Propostas Enviadas */}
        <TabsContent value="enviadas">
          {propostasEnviadas.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Send className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-[14px]">Nenhuma proposta em análise</p>
                  <p className="text-sm mt-1">
                    Suas propostas enviadas aparecerÍo aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {propostasEnviadas.map((cotacao) => (
                <Card key={cotacao.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{cotacao.titulo}</h3>
                        <p className="text-sm text-gray-500">
                          {cotacao.categoria} • {cotacao.projeto_nome}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPropostaStatusBadge(cotacao.proposta_status)}
                        <span className="font-normal text-[#F25C26]">
                          {formatarMoeda(cotacao.proposta_valor)}
                        </span>
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/fornecedor/cotacoes/${cotacao.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico">
          {propostasRespondidas.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium text-[14px]">Nenhum histórico</p>
                  <p className="text-sm mt-1">
                    Cotações finalizadas aparecerÍo aqui
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {propostasRespondidas.map((cotacao) => (
                <Card
                  key={cotacao.id}
                  className={`${
                    cotacao.proposta_status === "vencedora"
                      ? "border-green-300 bg-green-50/30"
                      : ""
                  }`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{cotacao.titulo}</h3>
                          {cotacao.proposta_status === "vencedora" && (
                            <Badge className="bg-green-500">Vencedor!</Badge>
                          )}
                        </div>
                        <p className="text-sm text-gray-500">
                          {cotacao.categoria} • {cotacao.projeto_nome}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getPropostaStatusBadge(cotacao.proposta_status)}
                        <span className="font-normal text-gray-700">
                          {formatarMoeda(cotacao.proposta_valor)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

