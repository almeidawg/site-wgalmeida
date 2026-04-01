/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// FINANCEIRO JURÍDICO - GESTÍO DE LANÇAMENTOS FINANCEIROS
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  DollarSign,
  Plus,
  Search,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  FileText,
  Building2,
  User,
  Edit,
  Trash2,
  AlertCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  Receipt,
  Banknote,
  CreditCard,
  XCircle,
  Scale,
  Wallet,
  PiggyBank,
  Award,
} from "lucide-react";
import {
  listarFinanceiroJuridico,
  criarLancamentoJuridico,
  atualizarLancamentoJuridico,
  deletarLancamentoJuridico,
  obterResumoFinanceiroJuridico,
  type FinanceiroJuridicoDetalhado,
  type TipoLancamento,
  type Natureza,
  type StatusFinanceiro,
} from "@/lib/juridicoApi";
import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { normalizeSearchTerm } from "@/utils/searchUtils";

/* ==================== CONSTANTES ==================== */

const TIPO_LANCAMENTO_CONFIG: Record<TipoLancamento, { label: string; icone: typeof Receipt }> = {
  HONORARIO: { label: "Honorários", icone: Banknote },
  CUSTAS: { label: "Custas Processuais", icone: Receipt },
  TAXA: { label: "Taxas", icone: CreditCard },
  ACORDO: { label: "Acordo", icone: FileText },
  MULTA: { label: "Multa", icone: AlertTriangle },
  MENSALIDADE: { label: "Mensalidade", icone: Calendar },
  OUTROS: { label: "Outros", icone: DollarSign },
};

const NATUREZA_CONFIG: Record<Natureza, { label: string; cor: string; icone: typeof TrendingUp }> = {
  RECEITA: { label: "Receita", cor: "#10B981", icone: TrendingUp },
  DESPESA: { label: "Despesa", cor: "#EF4444", icone: TrendingDown },
};

const STATUS_CONFIG: Record<StatusFinanceiro, { label: string; cor: string }> = {
  PENDENTE: { label: "Pendente", cor: "#F59E0B" },
  PAGO: { label: "Pago", cor: "#10B981" },
  PARCIAL: { label: "Parcial", cor: "#3B82F6" },
  ATRASADO: { label: "Atrasado", cor: "#EF4444" },
  CANCELADO: { label: "Cancelado", cor: "#6B7280" },
};

// Abas de classificaçÍo financeira jurídica
type AbaFinanceiro = "todos" | "recebido" | "custas" | "a_pagar" | "recebiveis";

const ABAS_CONFIG: Record<AbaFinanceiro, { label: string; descricao: string; icone: typeof DollarSign; cor: string }> = {
  todos: {
    label: "Todos",
    descricao: "Todos os lançamentos",
    icone: FileText,
    cor: "#6B7280"
  },
  recebido: {
    label: "Recebido pelo Escritório",
    descricao: "Honorários e mensalidades recebidas",
    icone: Banknote,
    cor: "#10B981"
  },
  custas: {
    label: "Custas e Perícias",
    descricao: "Custas processuais, taxas e perícias",
    icone: Receipt,
    cor: "#3B82F6"
  },
  a_pagar: {
    label: "A Pagar",
    descricao: "Acordos, processos e pagamentos pendentes",
    icone: Wallet,
    cor: "#F59E0B"
  },
  recebiveis: {
    label: "Processos Ganhos / Recebíveis",
    descricao: "Valores a receber de processos ganhos",
    icone: Award,
    cor: "#8B5CF6"
  },
};

/* ==================== COMPONENTE PRINCIPAL ==================== */

export default function FinanceiroJuridicoPage() {
  const { toast } = useToast();
  // Estados
  const [lancamentos, setLancamentos] = useState<FinanceiroJuridicoDetalhado[]>([]);
  const [loading, setLoading] = useState(true);
  const [abaAtiva, setAbaAtiva] = useState<AbaFinanceiro>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<StatusFinanceiro | "">("");
  const [filtroTipo, setFiltroTipo] = useState<TipoLancamento | "">("");
  const [filtroNatureza, setFiltroNatureza] = useState<Natureza | "">("");
  const [filtroMes, setFiltroMes] = useState("");
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<FinanceiroJuridicoDetalhado | null>(null);
  const [pessoas, setPessoas] = useState<Array<{ id: string; nome: string }>>([]);
  const [empresas, setEmpresas] = useState<Array<{ id: string; razao_social: string }>>([]);
  const [resumoMensal, setResumoMensal] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    tipo: "HONORARIO" as TipoLancamento,
    natureza: "RECEITA" as Natureza,
    descricao: "",
    observacoes: "",
    valor: 0,
    valor_pago: 0,
    data_competencia: new Date().toISOString().split("T")[0],
    data_vencimento: new Date().toISOString().split("T")[0],
    data_pagamento: "",
    status: "PENDENTE" as StatusFinanceiro,
    parcela_atual: 1,
    total_parcelas: 1,
    nucleo: "",
    pessoa_id: "",
    empresa_id: "",
    assistencia_id: "",
    contrato_id: "",
  });

  // Carregar dados
  async function carregarDados() {
    setLoading(true);
    try {
      const result = await listarFinanceiroJuridico(
        { pageSize: 20, offset: (currentPage - 1) * 20 },
        {
          status: filtroStatus || undefined,
          tipo: filtroTipo || undefined,
          natureza: filtroNatureza || undefined,
          mes: filtroMes || undefined,
          busca: searchTerm || undefined,
        },
        { sortBy: "data_vencimento", sortOrder: "desc" }
      );
      setLancamentos(result.data);
      setTotalCount(result.count);
    } catch (error: any) {
      console.error("Erro ao carregar lançamentos:", error);
    } finally {
      setLoading(false);
    }
  }

  async function carregarResumo() {
    try {
      const data = await obterResumoFinanceiroJuridico();
      setResumoMensal(data || []);
    } catch (error) {
      console.error("Erro ao carregar resumo:", error);
    }
  }

  async function carregarPessoas() {
    try {
      const { data } = await supabase
        .from("pessoas")
        .select("id, nome")
        .eq("ativo", true)
        .order("nome");
      setPessoas(data || []);
    } catch (error) {
      console.error("Erro ao carregar pessoas:", error);
    }
  }

  async function carregarEmpresas() {
    try {
      const { data } = await supabase
        .from("empresas_grupo")
        .select("id, razao_social")
        .eq("ativo", true)
        .order("razao_social");
      setEmpresas(data || []);
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
    }
  }

  useEffect(() => {
    carregarDados();
    carregarResumo();
    carregarPessoas();
    carregarEmpresas();
  }, [currentPage, filtroStatus, filtroTipo, filtroNatureza, filtroMes]);

  // Estatísticas por classificaçÍo (separando receitas escritório vs despesas)
  const statsGerais = {
    // Receitas do escritório: Honorários + Mensalidades PAGOS
    recebidoEscritorio: lancamentos
      .filter((l) =>
        (l.tipo === "HONORARIO" || l.tipo === "MENSALIDADE") &&
        l.natureza === "RECEITA" &&
        l.status === "PAGO"
      )
      .reduce((acc, l) => acc + (l.valor_pago || 0), 0),

    // Custas e despesas operacionais jurídicas
    custasProcessuais: lancamentos
      .filter((l) =>
        (l.tipo === "CUSTAS" || l.tipo === "TAXA" || l.tipo === "OUTROS") &&
        l.natureza === "DESPESA"
      )
      .reduce((acc, l) => acc + (l.valor || 0), 0),

    // Valores a pagar (despesas pendentes)
    aPagar: lancamentos
      .filter((l) =>
        l.natureza === "DESPESA" &&
        (l.status === "PENDENTE" || l.status === "ATRASADO" || l.status === "PARCIAL")
      )
      .reduce((acc, l) => acc + (l.valor - (l.valor_pago || 0)), 0),

    // Recebíveis (valores a receber de processos ganhos)
    recebiveis: lancamentos
      .filter((l) =>
        l.natureza === "RECEITA" &&
        (l.status === "PENDENTE" || l.status === "PARCIAL") &&
        (l.tipo === "ACORDO" || l.tipo === "HONORARIO" || l.tipo === "MULTA")
      )
      .reduce((acc, l) => acc + (l.valor - (l.valor_pago || 0)), 0),

    // Totais gerais
    totalLancamentos: totalCount,
    qtdAtrasados: lancamentos.filter((l) => l.status === "ATRASADO").length,
  };

  // Stats baseado na aba para o card principal
  const stats = {
    totalLancamentos: totalCount,
    totalReceitas: statsGerais.recebidoEscritorio,
    totalDespesas: statsGerais.custasProcessuais,
    totalPendente: statsGerais.aPagar,
    totalPago: statsGerais.recebidoEscritorio,
    qtdAtrasados: statsGerais.qtdAtrasados,
  };

  // Handlers
  const handleSearch = () => {
    setCurrentPage(1);
    carregarDados();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dadosEnvio = {
        ...formData,
        pessoa_id: formData.pessoa_id || null,
        empresa_id: formData.empresa_id || null,
        assistencia_id: formData.assistencia_id || null,
        contrato_id: formData.contrato_id || null,
        nucleo: formData.nucleo || null,
        data_pagamento: formData.data_pagamento || null,
        criado_por: null,
        atualizado_por: null,
      };

      if (editingItem) {
        await atualizarLancamentoJuridico(editingItem.id, dadosEnvio);
      } else {
        await criarLancamentoJuridico(dadosEnvio);
      }
      setShowModal(false);
      setEditingItem(null);
      resetForm();
      carregarDados();
      carregarResumo();
    } catch (error: any) {
      console.error("Erro ao salvar:", error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao salvar: : ${error.message}` });
    }
  };

  const handleEdit = (item: FinanceiroJuridicoDetalhado) => {
    setEditingItem(item);
    setFormData({
      tipo: item.tipo,
      natureza: item.natureza,
      descricao: item.descricao,
      observacoes: item.observacoes || "",
      valor: item.valor,
      valor_pago: item.valor_pago || 0,
      data_competencia: item.data_competencia,
      data_vencimento: item.data_vencimento,
      data_pagamento: item.data_pagamento || "",
      status: item.status,
      parcela_atual: item.parcela_atual,
      total_parcelas: item.total_parcelas,
      nucleo: item.nucleo || "",
      pessoa_id: item.pessoa_id || "",
      empresa_id: item.empresa_id || "",
      assistencia_id: item.assistencia_id || "",
      contrato_id: item.contrato_id || "",
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este lançamento?")) return;
    try {
      await deletarLancamentoJuridico(id);
      carregarDados();
      carregarResumo();
    } catch (error: any) {
      console.error("Erro ao excluir:", error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao excluir: : ${error.message}` });
    }
  };

  const handleStatusChange = async (id: string, novoStatus: StatusFinanceiro) => {
    try {
      const updates: any = { status: novoStatus };
      if (novoStatus === "PAGO") {
        const item = lancamentos.find((l) => l.id === id);
        if (item) {
          updates.valor_pago = item.valor;
          updates.data_pagamento = new Date().toISOString().split("T")[0];
        }
      }
      await atualizarLancamentoJuridico(id, updates);
      carregarDados();
      carregarResumo();
    } catch (error: any) {
      console.error("Erro ao atualizar status:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      tipo: "HONORARIO",
      natureza: "RECEITA",
      descricao: "",
      observacoes: "",
      valor: 0,
      valor_pago: 0,
      data_competencia: new Date().toISOString().split("T")[0],
      data_vencimento: new Date().toISOString().split("T")[0],
      data_pagamento: "",
      status: "PENDENTE",
      parcela_atual: 1,
      total_parcelas: 1,
      nucleo: "",
      pessoa_id: "",
      empresa_id: "",
      assistencia_id: "",
      contrato_id: "",
    });
  };

  // FormataçÍo
  const formatarMoeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);

  const formatarData = (data: string) =>
    data ? new Date(data).toLocaleDateString("pt-BR") : "-";

  // Filtrar por aba (classificaçÍo de negócio)
  function filtrarPorAba(item: FinanceiroJuridicoDetalhado): boolean {
    switch (abaAtiva) {
      case "todos":
        return true;
      case "recebido":
        // Receitas do escritório: Honorários e Mensalidades PAGOS
        return (
          (item.tipo === "HONORARIO" || item.tipo === "MENSALIDADE") &&
          item.natureza === "RECEITA" &&
          item.status === "PAGO"
        );
      case "custas":
        // Despesas operacionais: Custas, Taxas, perícias
        return (
          (item.tipo === "CUSTAS" || item.tipo === "TAXA" || item.tipo === "OUTROS") &&
          item.natureza === "DESPESA"
        );
      case "a_pagar":
        // Valores pendentes de pagamento (qualquer tipo)
        return (
          item.natureza === "DESPESA" &&
          (item.status === "PENDENTE" || item.status === "ATRASADO" || item.status === "PARCIAL")
        );
      case "recebiveis":
        // Receitas a receber: Acordos de processos ganhos ou honorários pendentes
        return (
          item.natureza === "RECEITA" &&
          (item.status === "PENDENTE" || item.status === "PARCIAL") &&
          (item.tipo === "ACORDO" || item.tipo === "HONORARIO" || item.tipo === "MULTA")
        );
      default:
        return true;
    }
  }

  // Filtrar local com busca e aba
  const lancamentosFiltrados = lancamentos.filter((item) => {
    // Primeiro filtra pela aba
    if (!filtrarPorAba(item)) return false;

    // Depois filtra pela busca textual
    if (!searchTerm) return true;
    const termo = normalizeSearchTerm(searchTerm);
    return (
      normalizeSearchTerm(item.descricao).includes(termo) ||
      normalizeSearchTerm(item.pessoa_nome || "").includes(termo) ||
      normalizeSearchTerm(item.empresa_nome || "").includes(termo)
    );
  });

  if (loading && lancamentos.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F25C26] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando financeiro jurídico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-[18px] sm:text-[24px] font-normal text-[#1A1A1A] flex items-center gap-2">
            <span className="text-2xl">⚖️</span>
            <DollarSign className="h-6 w-6 text-[#F25C26]" />
            Financeiro Jurídico
          </h1>
          <p className="text-[16px] text-gray-500 mt-1">
            GestÍo de honorários, custas processuais e lançamentos financeiros
          </p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setEditingItem(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Novo Lançamento
        </button>
      </div>

      {/* NAVEGAÇÍO POR ABAS */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="grid grid-cols-2 md:grid-cols-5 divide-x divide-gray-100">
          {(Object.keys(ABAS_CONFIG) as AbaFinanceiro[]).map((aba) => {
            const config = ABAS_CONFIG[aba];
            const Icone = config.icone;
            const isAtiva = abaAtiva === aba;

            // Valor exibido em cada aba
            let valorAba = 0;
            let labelValor = "";
            switch (aba) {
              case "todos":
                valorAba = stats.totalLancamentos;
                labelValor = "lançamentos";
                break;
              case "recebido":
                valorAba = statsGerais.recebidoEscritorio;
                labelValor = formatarMoeda(valorAba);
                break;
              case "custas":
                valorAba = statsGerais.custasProcessuais;
                labelValor = formatarMoeda(valorAba);
                break;
              case "a_pagar":
                valorAba = statsGerais.aPagar;
                labelValor = formatarMoeda(valorAba);
                break;
              case "recebiveis":
                valorAba = statsGerais.recebiveis;
                labelValor = formatarMoeda(valorAba);
                break;
            }

            return (
              <button
                key={aba}
                type="button"
                onClick={() => setAbaAtiva(aba)}
                className={`
                  p-4 text-left transition-all relative
                  ${isAtiva
                    ? "bg-gradient-to-b from-gray-50 to-white"
                    : "hover:bg-gray-50"
                  }
                `}
              >
                {isAtiva && (
                  <div
                    className="absolute top-0 left-0 right-0 h-1 rounded-t"
                    style={{ backgroundColor: config.cor }}
                  />
                )}
                <div className="flex items-center gap-3">
                  <div
                    className="p-2 rounded-lg"
                    style={{
                      backgroundColor: isAtiva ? `${config.cor}15` : "#F3F4F6",
                    }}
                  >
                    <Icone
                      className="h-5 w-5"
                      style={{ color: isAtiva ? config.cor : "#6B7280" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div
                      className={`text-sm font-normal truncate ${
                        isAtiva ? "text-gray-900" : "text-gray-600"
                      }`}
                    >
                      {config.label}
                    </div>
                    <div
                      className="text-xs font-medium"
                      style={{ color: isAtiva ? config.cor : "#9CA3AF" }}
                    >
                      {aba === "todos" ? `${valorAba} ${labelValor}` : labelValor}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RESUMO DA ABA SELECIONADA */}
      {abaAtiva !== "todos" && (
        <div
          className="bg-gradient-to-r from-white to-gray-50 rounded-xl border p-4 flex items-center gap-4"
          style={{ borderColor: `${ABAS_CONFIG[abaAtiva].cor}40` }}
        >
          <div
            className="p-3 rounded-xl"
            style={{ backgroundColor: `${ABAS_CONFIG[abaAtiva].cor}15` }}
          >
            {(() => {
              const Icone = ABAS_CONFIG[abaAtiva].icone;
              return (
                <Icone
                  className="h-6 w-6"
                  style={{ color: ABAS_CONFIG[abaAtiva].cor }}
                />
              );
            })()}
          </div>
          <div>
            <h3 className="text-[20px] font-normal text-gray-900">
              {ABAS_CONFIG[abaAtiva].label}
            </h3>
            <p className="text-[16px] text-gray-500">
              {ABAS_CONFIG[abaAtiva].descricao}
            </p>
          </div>
          <div className="ml-auto text-right">
            <div
              className="text-2xl font-normal"
              style={{ color: ABAS_CONFIG[abaAtiva].cor }}
            >
              {formatarMoeda(
                abaAtiva === "recebido"
                  ? statsGerais.recebidoEscritorio
                  : abaAtiva === "custas"
                  ? statsGerais.custasProcessuais
                  : abaAtiva === "a_pagar"
                  ? statsGerais.aPagar
                  : statsGerais.recebiveis
              )}
            </div>
            <div className="text-xs text-gray-500">
              {lancamentosFiltrados.length} lançamento(s)
            </div>
          </div>
        </div>
      )}

      {/* CARDS RÁPIDOS (somente na aba TODOS) */}
      {abaAtiva === "todos" && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <Banknote className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-[20px] font-normal text-green-600">
                  {formatarMoeda(statsGerais.recebidoEscritorio)}
                </div>
                <div className="text-[12px] text-gray-500">Recebido</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Receipt className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-[20px] font-normal text-blue-600">
                  {formatarMoeda(statsGerais.custasProcessuais)}
                </div>
                <div className="text-[12px] text-gray-500">Custas</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Wallet className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-[20px] font-normal text-yellow-600">
                  {formatarMoeda(statsGerais.aPagar)}
                </div>
                <div className="text-[12px] text-gray-500">A Pagar</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Award className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-[20px] font-normal text-purple-600">
                  {formatarMoeda(statsGerais.recebiveis)}
                </div>
                <div className="text-[12px] text-gray-500">Recebíveis</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FILTROS */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por descriçÍo, pessoa ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26] focus:border-transparent"
            />
          </div>

          <select
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as StatusFinanceiro | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todos os Status</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filtroNatureza}
            onChange={(e) => setFiltroNatureza(e.target.value as Natureza | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todas Naturezas</option>
            {Object.entries(NATUREZA_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value as TipoLancamento | "")}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          >
            <option value="">Todos os Tipos</option>
            {Object.entries(TIPO_LANCAMENTO_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.label}
              </option>
            ))}
          </select>

          <input
            type="month"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
          />
        </div>
      </div>

      {/* LISTA DE LANÇAMENTOS */}
      {lancamentosFiltrados.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-gray-300 p-12 text-center">
          <DollarSign className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-[20px] font-normal text-gray-600 mb-2">
            Nenhum lançamento encontrado
          </h3>
          <p className="text-[16px] text-gray-500 mb-4">
            {searchTerm
              ? "Tente ajustar os filtros de busca"
              : "Clique em 'Novo Lançamento' para registrar uma movimentaçÍo financeira"}
          </p>
          <button
            onClick={() => {
              resetForm();
              setEditingItem(null);
              setShowModal(true);
            }}
            className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Lançamento
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-[16px] font-normal text-gray-600">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-left text-[16px] font-normal text-gray-600">
                    DescriçÍo
                  </th>
                  <th className="px-4 py-3 text-left text-[16px] font-normal text-gray-600">
                    Pessoa/Empresa
                  </th>
                  <th className="px-4 py-3 text-center text-[16px] font-normal text-gray-600">
                    Núcleo
                  </th>
                  <th className="px-4 py-3 text-right text-[16px] font-normal text-gray-600">
                    Valor
                  </th>
                  <th className="px-4 py-3 text-center text-[16px] font-normal text-gray-600">
                    Vencimento
                  </th>
                  <th className="px-4 py-3 text-center text-[16px] font-normal text-gray-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-[16px] font-normal text-gray-600">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {lancamentosFiltrados.map((item) => {
                  const tipoConfig = TIPO_LANCAMENTO_CONFIG[item.tipo];
                  const naturezaConfig = NATUREZA_CONFIG[item.natureza];
                  const statusConfig = STATUS_CONFIG[item.status];
                  const TipoIcon = tipoConfig.icone;
                  const NaturezaIcon = naturezaConfig.icone;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div
                            className="p-1.5 rounded"
                            style={{ backgroundColor: `${naturezaConfig.cor}15` }}
                          >
                            <NaturezaIcon
                              className="h-4 w-4"
                              style={{ color: naturezaConfig.cor }}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {tipoConfig.label}
                            </div>
                            <div className="text-xs text-gray-500">{naturezaConfig.label}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-900 max-w-xs truncate">
                          {item.descricao}
                        </div>
                        {item.total_parcelas > 1 && (
                          <div className="text-xs text-gray-500">
                            Parcela {item.parcela_atual}/{item.total_parcelas}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.pessoa_nome ? (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <User className="h-3.5 w-3.5 text-gray-400" />
                            {item.pessoa_nome}
                          </div>
                        ) : item.empresa_nome ? (
                          <div className="flex items-center gap-1 text-sm text-gray-700">
                            <Building2 className="h-3.5 w-3.5 text-gray-400" />
                            {item.empresa_nome}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {item.nucleo ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 capitalize">
                            {item.nucleo.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div
                          className="text-sm font-normal"
                          style={{ color: naturezaConfig.cor }}
                        >
                          {item.natureza === "DESPESA" ? "-" : ""}
                          {formatarMoeda(item.valor)}
                        </div>
                        {item.valor_pago > 0 && item.valor_pago < item.valor && (
                          <div className="text-xs text-gray-500">
                            Pago: {formatarMoeda(item.valor_pago)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="text-sm text-gray-700">
                          {formatarData(item.data_vencimento)}
                        </div>
                        {item.dias_atraso > 0 && (
                          <div className="text-xs text-red-600">
                            {item.dias_atraso} dias em atraso
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.status}
                          onChange={(e) =>
                            handleStatusChange(item.id, e.target.value as StatusFinanceiro)
                          }
                          className="text-xs border rounded px-2 py-1 focus:ring-1 focus:ring-[#F25C26]"
                          style={{
                            borderColor: statusConfig.cor,
                            color: statusConfig.cor,
                          }}
                        >
                          {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                            <option key={key} value={key}>
                              {config.label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* PAGINAÇÍO */}
      {totalCount > 20 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-gray-300 rounded text-[14px] disabled:opacity-50"
          >
            Anterior
          </button>
          <span className="text-[16px] text-gray-600">
            Página {currentPage} de {Math.ceil(totalCount / 20)}
          </span>
          <button
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={currentPage >= Math.ceil(totalCount / 20)}
            className="px-3 py-1 border border-gray-300 rounded text-[14px] disabled:opacity-50"
          >
            Próxima
          </button>
        </div>
      )}

      {/* AVISO INFORMATIVO */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <span className="text-lg">⚖️</span>
          <div>
            <h4 className="text-[20px] font-normal text-blue-800">ClassificaçÍo Financeira Jurídica</h4>
            <p className="text-[16px] text-blue-700 mt-1">
              <strong>Recebido pelo Escritório:</strong> Honorários e mensalidades pagos (receitas).{" "}
              <strong>Custas:</strong> Despesas processuais, taxas e perícias.{" "}
              <strong>A Pagar:</strong> Despesas pendentes.{" "}
              <strong>Recebíveis:</strong> Valores a receber de processos ganhos e acordos.
            </p>
          </div>
        </div>
      </div>

      {/* MODAL DE CADASTRO/EDIÇÍO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                {editingItem ? "Editar Lançamento" : "Novo Lançamento Financeiro"}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-3 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                  <select
                    value={formData.tipo}
                    onChange={(e) =>
                      setFormData({ ...formData, tipo: e.target.value as TipoLancamento })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    {Object.entries(TIPO_LANCAMENTO_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Natureza */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Natureza *</label>
                  <select
                    value={formData.natureza}
                    onChange={(e) =>
                      setFormData({ ...formData, natureza: e.target.value as Natureza })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  >
                    {Object.entries(NATUREZA_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* DescriçÍo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">DescriçÍo *</label>
                <input
                  type="text"
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-[#F25C26]"
                  placeholder="Ex: Honorários advocatícios processo 123"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor *</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) =>
                      setFormData({ ...formData, valor: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    placeholder="0,00"
                    required
                  />
                </div>

                {/* Data Competência */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Competência *
                  </label>
                  <input
                    type="date"
                    value={formData.data_competencia}
                    onChange={(e) =>
                      setFormData({ ...formData, data_competencia: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  />
                </div>

                {/* Data Vencimento */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Vencimento *
                  </label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) =>
                      setFormData({ ...formData, data_vencimento: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pessoa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pessoa (Cliente/Fornecedor)
                  </label>
                  <select
                    value={formData.pessoa_id}
                    onChange={(e) => setFormData({ ...formData, pessoa_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="">Selecione...</option>
                    {pessoas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Empresa */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa do Grupo
                  </label>
                  <select
                    value={formData.empresa_id}
                    onChange={(e) => setFormData({ ...formData, empresa_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  >
                    <option value="">Selecione...</option>
                    {empresas.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.razao_social}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Parcela Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parcela Atual
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.parcela_atual}
                    onChange={(e) =>
                      setFormData({ ...formData, parcela_atual: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>

                {/* Total Parcelas */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Parcelas
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.total_parcelas}
                    onChange={(e) =>
                      setFormData({ ...formData, total_parcelas: parseInt(e.target.value) || 1 })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as StatusFinanceiro })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[14px] focus:ring-2 focus:ring-[#F25C26]"
                  >
                    {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                      <option key={key} value={key}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                <textarea
                  value={formData.observacoes}
                  onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-[#F25C26]"
                  rows={2}
                  placeholder="Observações adicionais..."
                />
              </div>

              {/* Botões */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingItem(null);
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-[14px] transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary hover:bg-[#D94F1E] text-white rounded-lg text-[14px] transition-colors"
                >
                  {editingItem ? "Salvar Alterações" : "Criar Lançamento"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
