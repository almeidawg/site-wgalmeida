/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/FinanceiroClientePage.tsx
// Dashboard financeiro para área do cliente
// Mostra resumo financeiro, parcelas, pagamentos e extratos

import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { usePermissoesCliente } from "@/hooks/usePermissoesUsuario";
import { useImpersonation } from "@/hooks/useImpersonation";
import ImpersonationBar from "@/components/ui/ImpersonationBar";
import ResponsiveTable from "@/components/ResponsiveTable";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  ChevronRight,
  Receipt,
  Wallet,
  PiggyBank,
} from "lucide-react";

interface ResumoFinanceiro {
  valorTotal: number;
  valorPago: number;
  valorPendente: number;
  proximaParcela: {
    valor: number;
    vencimento: string;
    numero: number;
  } | null;
}

interface Parcela {
  id: string;
  numero: number;
  valor: number;
  vencimento: string;
  status: "pago" | "pendente" | "atrasado" | "cancelado";
  dataPagamento?: string;
  formaPagamento?: string;
}

interface Lancamento {
  id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  data: string;
  categoria?: string;
  comprovante_url?: string;
}

export default function FinanceiroClientePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const permissoes = usePermissoesCliente();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const {
    isImpersonating,
    impersonatedUser,
    stopImpersonation,
    canImpersonate,
    loading: impersonationLoading,
  } = useImpersonation();

  const [loading, setLoading] = useState(true);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [parcelas, setParcelas] = useState<Parcela[]>([]);
  const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);
  const [activeTab, setActiveTab] = useState<"parcelas" | "extrato">(
    "parcelas"
  );
  const [clienteInfo, setClienteInfo] = useState<{
    pessoaId: string;
    contratoId: string | null;
    nomeCompleto: string;
  } | null>(null);

  const clienteIdParam = searchParams.get("cliente_id");

  const parcelasColumns = [
    { label: "Número", key: "numero", render: (val: any) => `Parcela ${val}` },
    {
      label: "Vencimento",
      key: "vencimento",
      render: (val: any) => format(new Date(val), "dd/MM/yyyy"),
    },
    {
      label: "Valor",
      key: "valor",
      render: (val: any) =>
        new Intl.NumberFormat("pt-BR", {
          style: "currency",
          currency: "BRL",
        }).format(val),
    },
    {
      label: "Status",
      key: "status",
      render: (val: any) => {
        const config = {
          pago: { bg: "bg-green-100", text: "text-green-700", label: "Pago" },
          pendente: {
            bg: "bg-yellow-100",
            text: "text-yellow-700",
            label: "Pendente",
          },
          atrasado: {
            bg: "bg-red-100",
            text: "text-red-700",
            label: "Atrasado",
          },
          cancelado: {
            bg: "bg-gray-100",
            text: "text-gray-500",
            label: "Cancelado",
          },
        };
        const c = config[val as keyof typeof config] || config["pendente"];
        return (
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}
          >
            {c.label}
          </span>
        );
      },
    },
    {
      label: "Data Pagamento",
      key: "dataPagamento",
      render: (val: any) => (val ? format(new Date(val), "dd/MM/yyyy") : "—"),
    },
  ];

  useEffect(() => {
    carregarDados();
  }, [isImpersonating, impersonatedUser, clienteIdParam, canImpersonate]);

  async function carregarDados() {
    try {
      setLoading(true);

      // Determinar pessoaId
      let pessoaId: string | null = null;

      if (isImpersonating && impersonatedUser) {
        pessoaId = impersonatedUser.id;
      } else if (clienteIdParam && canImpersonate) {
        // SEGURANÇA: Só permite usar cliente_id da URL se o usuário for ADMIN/MASTER
        pessoaId = clienteIdParam;
      } else {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: usuario } = await supabase
            .from("usuarios")
            .select("pessoa_id")
            .eq("auth_user_id", user.id)
            .maybeSingle();
          pessoaId = usuario?.pessoa_id || null;
        }
      }

      if (!pessoaId) {
        setLoading(false);
        return;
      }

      // Buscar pessoa
      const { data: pessoa } = await supabase
        .from("pessoas")
        .select("id, nome")
        .eq("id", pessoaId)
        .maybeSingle();

      // Buscar contrato ativo
      const { data: contrato } = await supabase
        .from("contratos")
        .select("id, valor_total, status")
        .eq("cliente_id", pessoaId)
        .not("status", "in", "(rascunho,cancelado)")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (pessoa) {
        setClienteInfo({
          pessoaId: pessoa.id,
          contratoId: contrato?.id || null,
          nomeCompleto: pessoa.nome,
        });
      }

      if (contrato?.id) {
        await Promise.all([
          carregarParcelas(contrato.id),
          carregarLancamentos(pessoaId),
        ]);

        // Calcular resumo
        calcularResumo(contrato.valor_total || 0);
      }
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarParcelas(contratoId: string) {
    try {
      const { data } = await supabase
        .from("contrato_parcelas")
        .select("*")
        .eq("contrato_id", contratoId)
        .order("numero", { ascending: true });

      const parcelasFormatadas: Parcela[] = (data || []).map((p: any) => {
        let status: Parcela["status"] = "pendente";
        if (p.pago) status = "pago";
        else if (p.cancelado) status = "cancelado";
        else if (new Date(p.vencimento) < new Date()) status = "atrasado";

        return {
          id: p.id,
          numero: p.numero,
          valor: p.valor,
          vencimento: p.vencimento,
          status,
          dataPagamento: p.data_pagamento,
          formaPagamento: p.forma_pagamento,
        };
      });

      setParcelas(parcelasFormatadas);
    } catch (error) {
      console.error("Erro ao carregar parcelas:", error);
    }
  }

  async function carregarLancamentos(pessoaId: string) {
    try {
      // SEGURANÇA (VER-025): Filtrar apenas entradas (receitas do cliente)
      // não mostrar despesas internas que podem revelar informações confidenciais
      // SEGURANÇA (VER-028): Especificar campos em vez de SELECT *
      const { data } = await supabase
        .from("financeiro_lancamentos")
        .select("id, descricao, valor, tipo, data_lancamento, categoria, comprovante_url")
        .eq("pessoa_id", pessoaId)
        .eq("tipo", "entrada") // Apenas pagamentos do cliente
        .order("data_lancamento", { ascending: false })
        .limit(50);

      const lancamentosFormatados: Lancamento[] = (data || []).map(
        (l: any) => ({
          id: l.id,
          descricao: l.descricao,
          valor: l.valor,
          tipo: "receita" as const, // Sempre receita (filtrado acima)
          data: l.data_lancamento,
          categoria: l.categoria,
          comprovante_url: l.comprovante_url,
        })
      );

      setLancamentos(lancamentosFormatados);
    } catch (error) {
      console.error("Erro ao carregar lançamentos:", error);
    }
  }

  function calcularResumo(valorContrato: number) {
    const valorPago = parcelas
      .filter((p) => p.status === "pago")
      .reduce((sum, p) => sum + p.valor, 0);

    const valorPendente = parcelas
      .filter((p) => p.status === "pendente" || p.status === "atrasado")
      .reduce((sum, p) => sum + p.valor, 0);

    const proximaParcela = parcelas.find(
      (p) => p.status === "pendente" || p.status === "atrasado"
    );

    setResumo({
      valorTotal: valorContrato || valorPago + valorPendente,
      valorPago,
      valorPendente,
      proximaParcela: proximaParcela
        ? {
            valor: proximaParcela.valor,
            vencimento: proximaParcela.vencimento,
            numero: proximaParcela.numero,
          }
        : null,
    });
  }

  // Atualizar resumo quando parcelas mudarem
  useEffect(() => {
    if (parcelas.length > 0) {
      calcularResumo(resumo?.valorTotal || 0);
    }
  }, [parcelas]);

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor);
  };

  const formatarData = (data: string) => {
    return format(new Date(data), "dd 'de' MMM 'de' yyyy", { locale: ptBR });
  };

  const progressoPagamento = useMemo(() => {
    if (!resumo || resumo.valorTotal === 0) return 0;
    return Math.round((resumo.valorPago / resumo.valorTotal) * 100);
  }, [resumo]);

  const handleExitImpersonation = () => {
    stopImpersonation();
    navigate("/");
  };

  const getStatusConfig = (status: Parcela["status"]) => {
    switch (status) {
      case "pago":
        return {
          label: "Pago",
          color: "bg-green-100 text-green-700",
          icon: CheckCircle2,
        };
      case "atrasado":
        return {
          label: "Atrasado",
          color: "bg-red-100 text-red-700",
          icon: AlertTriangle,
        };
      case "cancelado":
        return {
          label: "Cancelado",
          color: "bg-gray-100 text-gray-500",
          icon: Clock,
        };
      default:
        return {
          label: "Pendente",
          color: "bg-yellow-100 text-yellow-700",
          icon: Clock,
        };
    }
  };

  if (loading || permissoes.loading || impersonationLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
          <p className="text-gray-600">Carregando informações financeiras...</p>
        </div>
      </div>
    );
  }

  if (!permissoes.podeVerValores) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center max-w-md p-8">
          <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900 mb-2">
            Acesso Restrito
          </h2>
          <p className="text-[16px] text-gray-600 mb-6">
            Você não tem permissÍo para visualizar informações financeiras.
          </p>
          <button
            onClick={() => navigate("/wgx")}
            className="px-4 py-2 bg-orange-500 text-white text-[14px] rounded-lg hover:bg-orange-600 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={handleExitImpersonation}
        />
      )}

      <div
        className={`min-h-screen bg-gray-50 ${isImpersonating ? "pt-16" : ""}`}
      >
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/wgx")}
              className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">Financeiro</h1>
              <p className="text-sm text-gray-500">
                Acompanhe pagamentos e extrato do seu projeto
              </p>
            </div>
          </div>

          {/* Cards de Resumo */}
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {/* Valor Total */}
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 uppercase tracking-wider">
                  Valor Total
                </p>
                <Wallet className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-3xl font-normal">
                {formatarMoeda(resumo?.valorTotal || 0)}
              </p>
              <p className="text-sm text-white/80 mt-1">Do contrato</p>
            </div>

            {/* Valor Pago */}
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 uppercase tracking-wider">
                  Valor Pago
                </p>
                <TrendingUp className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-3xl font-normal">
                {formatarMoeda(resumo?.valorPago || 0)}
              </p>
              <p className="text-sm text-white/80 mt-1">
                {progressoPagamento}% quitado
              </p>
            </div>

            {/* Valor Pendente */}
            <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 uppercase tracking-wider">
                  Valor Pendente
                </p>
                <PiggyBank className="w-5 h-5 text-white/60" />
              </div>
              <p className="text-3xl font-normal">
                {formatarMoeda(resumo?.valorPendente || 0)}
              </p>
              <p className="text-sm text-white/80 mt-1">
                {parcelas.filter((p) => p.status === "pendente").length}{" "}
                parcelas
              </p>
            </div>

            {/* Próxima Parcela */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-white/80 uppercase tracking-wider">
                  Próxima Parcela
                </p>
                <CreditCard className="w-5 h-5 text-white/60" />
              </div>
              {resumo?.proximaParcela ? (
                <>
                  <p className="text-3xl font-normal">
                    {formatarMoeda(resumo.proximaParcela.valor)}
                  </p>
                  <p className="text-sm text-white/80 mt-1">
                    Vence em{" "}
                    {format(
                      new Date(resumo.proximaParcela.vencimento),
                      "dd/MM"
                    )}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-normal">—</p>
                  <p className="text-sm text-white/80 mt-1">Tudo quitado!</p>
                </>
              )}
            </div>
          </div>

          {/* Barra de Progresso */}
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[20px] font-normal text-gray-900">
                Progresso de Pagamento
              </h3>
              <span className="text-sm text-gray-500">
                {progressoPagamento}% quitado
              </span>
            </div>
            <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500"
                style={{ width: `${progressoPagamento}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-gray-500">
              <span>{formatarMoeda(resumo?.valorPago || 0)} pago</span>
              <span>{formatarMoeda(resumo?.valorPendente || 0)} restante</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 bg-white p-1 rounded-xl shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab("parcelas")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[14px] font-medium transition-all ${
                activeTab === "parcelas"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <Receipt className="w-4 h-4" />
              Parcelas
            </button>
            <button
              onClick={() => setActiveTab("extrato")}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-[14px] font-medium transition-all ${
                activeTab === "extrato"
                  ? "bg-orange-500 text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              <FileText className="w-4 h-4" />
              Extrato
            </button>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === "parcelas" ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-[20px] font-normal text-gray-900">
                  Parcelas do Contrato
                </h3>
                <p className="text-sm text-gray-500">
                  {parcelas.length} parcelas
                </p>
              </div>

              {parcelas.length === 0 ? (
                <div className="p-8 text-center">
                  <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[16px] text-gray-600">Nenhuma parcela encontrada</p>
                </div>
              ) : (
                <ResponsiveTable
                  columns={parcelasColumns}
                  data={parcelas}
                  emptyMessage="Nenhuma parcela encontrada"
                />
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-[20px] font-normal text-gray-900">
                  Extrato de Movimentações
                </h3>
                <p className="text-sm text-gray-500">
                  Últimas {lancamentos.length} movimentações
                </p>
              </div>

              {lancamentos.length === 0 ? (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-[16px] text-gray-600">Nenhum lançamento encontrado</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {lancamentos.map((lancamento) => (
                    <div
                      key={lancamento.id}
                      className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            lancamento.tipo === "receita"
                              ? "bg-green-100"
                              : "bg-red-100"
                          }`}
                        >
                          {lancamento.tipo === "receita" ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <TrendingDown className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {lancamento.descricao}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatarData(lancamento.data)}
                            {lancamento.categoria && (
                              <span className="ml-2 text-gray-400">
                                • {lancamento.categoria}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <p
                          className={`font-normal ${
                            lancamento.tipo === "receita"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                          {lancamento.tipo === "receita" ? "+" : "-"}
                          {formatarMoeda(lancamento.valor)}
                        </p>
                        {lancamento.comprovante_url && (
                          <a
                            href={lancamento.comprovante_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Ver comprovante"
                          >
                            <Download className="w-4 h-4 text-gray-500" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aviso */}
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-center">
            <p className="text-sm text-orange-800">
              Dúvidas sobre pagamentos? Entre em contato com nosso financeiro
              pelo WhatsApp.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}


