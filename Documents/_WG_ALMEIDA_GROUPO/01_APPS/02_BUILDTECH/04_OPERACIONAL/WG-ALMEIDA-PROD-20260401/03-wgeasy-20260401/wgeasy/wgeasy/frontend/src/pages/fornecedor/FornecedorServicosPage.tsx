/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
/**
 * Página de Serviços Contratados do Fornecedor
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/auth/AuthContext";
import {
  Briefcase,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  Pause,
  Play,
  Filter,
  DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  listarServicosContratados,
  FornecedorServico,
} from "@/lib/fornecedorAreaApi";

export default function FornecedorServicosPage() {
  const { usuarioCompleto } = useAuth();
  const [loading, setLoading] = useState(true);
  const [servicos, setServicos] = useState<FornecedorServico[]>([]);
  const [statusFiltro, setStatusFiltro] = useState<string>("todos");

  useEffect(() => {
    const carregarServicos = async () => {
      if (!usuarioCompleto?.pessoa_id) return;

      try {
        setLoading(true);
        const data = await listarServicosContratados(usuarioCompleto.pessoa_id);
        setServicos(data);
      } catch (error) {
        console.error("Erro ao carregar serviços:", error);
      } finally {
        setLoading(false);
      }
    };

    carregarServicos();
  }, [usuarioCompleto?.pessoa_id]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data?: string) => {
    if (!data) return "-";
    return new Date(data).toLocaleDateString("pt-BR");
  };

  const getStatusConfig = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      contratado: { label: "Contratado", color: "bg-blue-100 text-blue-800", icon: Briefcase },
      em_execucao: { label: "Em ExecuçÍo", color: "bg-green-100 text-green-800", icon: Play },
      pausado: { label: "Pausado", color: "bg-amber-100 text-amber-800", icon: Pause },
      concluido: { label: "Concluído", color: "bg-gray-100 text-gray-600", icon: CheckCircle2 },
      cancelado: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: Clock },
    };
    return config[status] || { label: status, color: "bg-gray-100 text-gray-600", icon: Briefcase };
  };

  const calcularValorPago = (parcelas?: FornecedorServico["parcelas"]) => {
    if (!parcelas) return 0;
    return parcelas.reduce((acc, p) => acc + (p.valor_pago || 0), 0);
  };

  const servicosFiltrados = servicos.filter(
    (s) => statusFiltro === "todos" || s.status === statusFiltro
  );

  // Resumo
  const totalContratado = servicos.reduce((acc, s) => acc + s.valor_contratado, 0);
  const totalPago = servicos.reduce((acc, s) => acc + calcularValorPago(s.parcelas), 0);
  const servicosAtivos = servicos.filter((s) => s.status === "em_execucao").length;

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
          <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Meus Serviços</h1>
          <p className="text-[16px] text-gray-500 mt-1">
            Serviços contratados pelo Grupo WG
          </p>
        </div>
        <Select value={statusFiltro} onValueChange={setStatusFiltro}>
          <SelectTrigger className="w-[180px] text-[14px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="contratado">Contratados</SelectItem>
            <SelectItem value="em_execucao">Em ExecuçÍo</SelectItem>
            <SelectItem value="pausado">Pausados</SelectItem>
            <SelectItem value="concluido">Concluídos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Contratado</p>
                <p className="text-[20px] font-normal text-gray-900 mt-1">
                  {formatarMoeda(totalContratado)}
                </p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Recebido</p>
                <p className="text-[20px] font-normal text-green-600 mt-1">
                  {formatarMoeda(totalPago)}
                </p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Em ExecuçÍo</p>
                <p className="text-[20px] font-normal text-[#F25C26] mt-1">
                  {servicosAtivos} serviço{servicosAtivos !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Play className="h-6 w-6 text-[#F25C26]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Serviços */}
      {servicosFiltrados.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-gray-500">
              <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium text-[14px]">Nenhum serviço encontrado</p>
              <p className="text-sm mt-1">
                {statusFiltro !== "todos"
                  ? "Tente ajustar os filtros"
                  : "Participe das cotações para ser contratado"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {servicosFiltrados.map((servico) => {
            const statusConfig = getStatusConfig(servico.status);
            const StatusIcon = statusConfig.icon;
            const valorPago = calcularValorPago(servico.parcelas);
            const percentualPago = (valorPago / servico.valor_contratado) * 100;

            return (
              <Card key={servico.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${statusConfig.color}`}>
                            <StatusIcon className="h-5 w-5" />
                          </div>
                          <div>
                            <h3 className="font-normal text-gray-900 text-[20px]">
                              {servico.descricao}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Building2 className="h-3 w-3" />
                              <span>{servico.projeto?.cliente_nome || "Cliente WG"}</span>
                              {servico.categoria && (
                                <>
                                  <span>•</span>
                                  <span>{servico.categoria.nome}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusConfig.color}`}>
                        {statusConfig.label}
                      </span>
                    </div>

                    {/* Progresso */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* ExecuçÍo */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Progresso de ExecuçÍo</span>
                          <span className="font-medium">{servico.percentual_execucao}%</span>
                        </div>
                        <Progress value={servico.percentual_execucao} className="h-2" />
                      </div>

                      {/* Pagamento */}
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-gray-500">Pagamento</span>
                          <span className="font-medium">{Math.round(percentualPago)}%</span>
                        </div>
                        <Progress value={percentualPago} className="h-2 [&>div]:bg-green-500" />
                      </div>
                    </div>

                    {/* Info Financeira */}
                    <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t">
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>Contratado: {formatarData(servico.data_contratacao)}</span>
                        </div>
                        {servico.data_fim_prevista && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>PrevisÍo: {formatarData(servico.data_fim_prevista)}</span>
                          </div>
                        )}
                        {servico.garantia_meses && (
                          <Badge variant="outline">
                            Garantia: {servico.garantia_meses} meses
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-[12px] text-gray-500">Valor Contratado</p>
                          <p className="text-[20px] font-normal text-gray-900">
                            {formatarMoeda(servico.valor_contratado)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[12px] text-gray-500">Recebido</p>
                          <p className="text-[20px] font-normal text-green-600">
                            {formatarMoeda(valorPago)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Parcelas */}
                    {servico.parcelas && servico.parcelas.length > 0 && (
                      <div className="pt-4 border-t">
                        <p className="text-sm font-medium text-gray-700 mb-2">Parcelas</p>
                        <div className="flex flex-wrap gap-2">
                          {servico.parcelas.map((parcela) => (
                            <div
                              key={parcela.id}
                              className={`px-3 py-1.5 rounded-lg text-sm ${
                                parcela.data_pagamento
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              <span className="font-medium">
                                {parcela.numero_parcela}ª
                              </span>
                              <span className="mx-1">-</span>
                              <span>{formatarMoeda(parcela.valor)}</span>
                              {parcela.data_pagamento && (
                                <CheckCircle2 className="h-3 w-3 inline ml-1" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

