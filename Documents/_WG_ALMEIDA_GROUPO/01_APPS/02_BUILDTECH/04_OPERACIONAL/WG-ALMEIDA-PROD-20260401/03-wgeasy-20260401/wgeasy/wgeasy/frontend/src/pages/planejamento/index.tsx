// ============================================================
// DASHBOARD DE PLANEJAMENTO
// Sistema WG Easy - Grupo WG Almeida
// VisÍo geral + ações rápidas
// ============================================================

import { useState, useEffect, type MouseEvent } from "react";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Plus,
  Package,
  ShoppingCart,
  CheckCircle,
  Clock,
  AlertCircle,
  ArrowRight,
  Layers,
  FileCheck,
  TrendingUp,
  Loader2,
  Building2,
  Calendar,
  Zap,
  MapPin,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface DashboardStats {
  emAnalise: number;
  pendentesAprovacao: number;
  aprovados: number;
  comprasPendentes: number;
  valorTotalPendente: number;
  valorTotalAprovado: number;
}

interface OrcamentoRecente {
  id: string;
  titulo: string;
  cliente_nome: string;
  status: string;
  valor_total: number;
  criado_em: string;
}

interface ClienteAtivo {
  id: string;
  nome: string;
  endereco?: string;
  tipo?: string;
  area_total?: number;
  total_ambientes?: number;
  status?: string;
  analise_id?: string;
  origem: "analise" | "cliente";
}

export default function PlanejamentoDashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    emAnalise: 0,
    pendentesAprovacao: 0,
    aprovados: 0,
    comprasPendentes: 0,
    valorTotalPendente: 0,
    valorTotalAprovado: 0,
  });
  const [orcamentosRecentes, setOrcamentosRecentes] = useState<OrcamentoRecente[]>([]);
  const [clientesAtivos, setClientesAtivos] = useState<ClienteAtivo[]>([]);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      setLoading(true);

      // Buscar estatísticas de orçamentos
      const { data: orcamentos, error: orcError } = await supabase
        .from("orcamentos")
        .select("id, titulo, cliente_id, status, valor_total, criado_em")
        .order("criado_em", { ascending: false })
        .limit(50);

      if (orcError) throw orcError;

      // Buscar nomes dos clientes
      const clienteIds = [...new Set(orcamentos?.map(o => o.cliente_id).filter(Boolean))];
      let clientesMap: Record<string, string> = {};
      if (clienteIds.length > 0) {
        const { data: clientes } = await supabase
          .from("pessoas")
          .select("id, nome")
          .in("id", clienteIds);
        if (clientes) {
          clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));
        }
      }

      // Adicionar cliente_nome aos orçamentos
      const orcamentosComNome = orcamentos?.map(o => ({
        ...o,
        cliente_nome: o.cliente_id ? clientesMap[o.cliente_id] || "Cliente nÍo informado" : "Cliente nÍo informado"
      })) || [];

      // Calcular estatísticas
      const emAnalise = orcamentos?.filter(o => o.status === "rascunho").length || 0;
      const pendentes = orcamentos?.filter(o => o.status === "enviado").length || 0;
      const aprovados = orcamentos?.filter(o => o.status === "aprovado").length || 0;

      const valorPendente = orcamentos
        ?.filter(o => o.status === "enviado")
        .reduce((acc, o) => acc + (o.valor_total || 0), 0) || 0;

      const valorAprovado = orcamentos
        ?.filter(o => o.status === "aprovado")
        .reduce((acc, o) => acc + (o.valor_total || 0), 0) || 0;

      // Buscar compras pendentes
      const { count: comprasPendentes } = await supabase
        .from("pedidos_compra")
        .select("*", { count: "exact", head: true })
        .eq("status", "PENDENTE");

      setStats({
        emAnalise,
        pendentesAprovacao: pendentes,
        aprovados,
        comprasPendentes: comprasPendentes || 0,
        valorTotalPendente: valorPendente,
        valorTotalAprovado: valorAprovado,
      });

      // Últimos orçamentos
      setOrcamentosRecentes(orcamentosComNome.slice(0, 5));

      // Buscar clientes ativos para Pedidos Rápidos
      const clientesFormatados: ClienteAtivo[] = [];

      // Buscar análises de projeto ativas
      // Buscar análises sem join (evita erro de FK)
      const { data: analises } = await supabase
        .from("analises_projeto")
        .select("id, titulo, cliente_id, endereco_obra, status, total_ambientes, total_area_piso")
        .in("status", ["analisado", "aprovado", "em_execucao"])
        .order("criado_em", { ascending: false })
        .limit(6);

      if (analises && analises.length > 0) {
        // Buscar nomes dos clientes separadamente
        const clienteIds = [...new Set(analises.map(a => a.cliente_id).filter(Boolean))];
        let clientesMap: Record<string, string> = {};
        if (clienteIds.length > 0) {
          const { data: clientes } = await supabase
            .from("pessoas")
            .select("id, nome")
            .in("id", clienteIds);
          if (clientes) {
            clientesMap = Object.fromEntries(clientes.map(c => [c.id, c.nome]));
          }
        }

        for (const a of analises) {
          const clienteNome = a.cliente_id ? clientesMap[a.cliente_id] || a.titulo : a.titulo;
          clientesFormatados.push({
            id: a.id,
            nome: clienteNome,
            endereco: a.endereco_obra,
            tipo: a.titulo,
            area_total: a.total_area_piso,
            total_ambientes: a.total_ambientes,
            status: a.status,
            analise_id: a.id,
            origem: "analise",
          });
        }
      }

      setClientesAtivos(clientesFormatados);

    } catch (error) {
      console.error("Erro ao carregar dashboard:", error);
    } finally {
      setLoading(false);
    }
  }

  const STATUS_CONFIG: Record<string, { bg: string; text: string; label: string }> = {
    rascunho: { bg: "bg-gray-100", text: "text-gray-600", label: "Rascunho" },
    enviado: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Aguardando" },
    aprovado: { bg: "bg-green-100", text: "text-green-700", label: "Aprovado" },
    rejeitado: { bg: "bg-red-100", text: "text-red-700", label: "Rejeitado" },
  };

  function handleEditarOrcamento(e: MouseEvent, id: string) {
    e.stopPropagation();
    navigate(`/orcamentos/${id}/editar`);
  }

  async function handleDuplicarOrcamento(e: MouseEvent, orcamento: OrcamentoRecente) {
    e.stopPropagation();
    if (!confirm(`Deseja duplicar o orçamento "${orcamento.titulo}"?`)) return;

    try {
      // Buscar itens do orçamento original
      const { data: itens } = await supabase
        .from("orcamento_itens")
        .select("*")
        .eq("orcamento_id", orcamento.id);

      // Buscar dados completos do orçamento
      const { data: orcamentoOriginal } = await supabase
        .from("orcamentos")
        .select("*")
        .eq("id", orcamento.id)
        .single();

      if (!orcamentoOriginal) throw new Error("Orçamento nÍo encontrado");

      // Criar novo orçamento
      const { data: novoOrcamento, error } = await supabase
        .from("orcamentos")
        .insert({
          titulo: `${orcamento.titulo} (Cópia)`,
          cliente_id: orcamentoOriginal.cliente_id,
          obra_id: orcamentoOriginal.obra_id,
          valor_total: orcamentoOriginal.valor_total,
          margem: orcamentoOriginal.margem,
          status: "rascunho",
        })
        .select()
        .single();

      if (error) throw error;

      // Duplicar itens se existirem
      if (itens && itens.length > 0 && novoOrcamento) {
        const novosItens = itens.map(({ id, orcamento_id, criado_em, atualizado_em, ...item }: any) => ({
          ...item,
          orcamento_id: novoOrcamento.id,
        }));
        await supabase.from("orcamento_itens").insert(novosItens);
      }

      toast({ title: "Sucesso", description: "Orçamento duplicado com sucesso!" });
      carregarDados();
    } catch (error) {
      console.error("Erro ao duplicar orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: "Erro ao duplicar orçamento" });
    }
  }

  async function handleExcluirOrcamento(e: MouseEvent, orcamento: OrcamentoRecente) {
    e.stopPropagation();
    if (!confirm(`Deseja excluir o orçamento "${orcamento.titulo}"? Esta açÍo nÍo pode ser desfeita.`)) return;

    try {
      if (import.meta.env.DEV) console.log("[Excluir] Iniciando exclusÍo do orçamento:", orcamento.id);

      // Excluir itens primeiro (se existirem)
      const { error: erroItens } = await supabase
        .from("orcamento_itens")
        .delete()
        .eq("orcamento_id", orcamento.id);

      if (erroItens) {
        console.error("[Excluir] Erro ao excluir itens:", erroItens);
      } else {
        if (import.meta.env.DEV) console.log("[Excluir] Itens excluídos com sucesso");
      }

      // Excluir orçamento e retornar dados para verificar
      const { error, data } = await supabase
        .from("orcamentos")
        .delete()
        .eq("id", orcamento.id)
        .select();

      if (import.meta.env.DEV) console.log("[Excluir] Resultado:", { error, data });

      if (error) {
        console.error("[Excluir] Erro ao excluir orçamento:", error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.warn("[Excluir] Nenhum registro foi excluído - possível problema de RLS");
        toast({ title: "NÍo foi possível excluir o orçamento. Verifique suas permissões." });
        return;
      }

      toast({ title: "Sucesso", description: "Orçamento excluído com sucesso!" });
      carregarDados();
    } catch (error) {
      console.error("Erro ao excluir orçamento:", error);
      toast({ variant: "destructive", title: "Erro", description: `Erro ao excluir orçamento: : ${error instanceof Error ? error.message : "Erro desconhecido"}` });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F25C26] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-[#F25C26] to-[#e04a1a] rounded-2xl flex items-center justify-center shadow-lg">
              <ClipboardList className="w-7 h-7 text-white" />
            </div>
            <div className="page-header-inline">
              <div className="page-header-first-line">
                <h1 className="page-header-title">Planejamento</h1>
              </div>
              <p className="page-header-subtitle-inline">
                Gerencie orçamentos, materiais e aprovações
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/planejamento/novo")}
            className="px-6 py-3 bg-primary text-white rounded-xl font-normal hover:bg-primary/90 shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" />
            Novo Pedido
          </button>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Em Análise */}
          <div
            onClick={() => navigate("/planejamento/orcamentos?status=rascunho")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-blue-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-100 rounded-xl">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-3xl font-normal text-gray-900">{stats.emAnalise}</span>
            </div>
            <p className="text-gray-600 font-medium">Em Análise</p>
            <p className="text-xs text-gray-400 mt-1">Orçamentos em rascunho</p>
          </div>

          {/* Pendentes AprovaçÍo */}
          <div
            onClick={() => navigate("/planejamento/aprovacoes")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-yellow-100 rounded-xl">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
              <span className="text-3xl font-normal text-gray-900">{stats.pendentesAprovacao}</span>
            </div>
            <p className="text-gray-600 font-medium">Pendentes</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.valorTotalPendente.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>

          {/* Aprovados */}
          <div
            onClick={() => navigate("/planejamento/orcamentos?status=aprovado")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-green-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-3xl font-normal text-gray-900">{stats.aprovados}</span>
            </div>
            <p className="text-gray-600 font-medium">Aprovados</p>
            <p className="text-xs text-gray-400 mt-1">
              {stats.valorTotalAprovado.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </p>
          </div>

          {/* Compras Pendentes */}
          <div
            onClick={() => navigate("/compras")}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 cursor-pointer hover:shadow-md hover:border-purple-300 transition-all"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-100 rounded-xl">
                <ShoppingCart className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-3xl font-normal text-gray-900">{stats.comprasPendentes}</span>
            </div>
            <p className="text-gray-600 font-medium">Compras</p>
            <p className="text-xs text-gray-400 mt-1">Pedidos pendentes</p>
          </div>
        </div>

        {/* Pedidos Rápidos - Clientes Ativos */}
        {clientesAtivos.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                Pedidos Rápidos
              </h2>
              <button
                type="button"
                onClick={() => navigate("/planejamento/novo")}
                className="text-sm text-[#F25C26] hover:underline flex items-center gap-1"
              >
                Ver todos clientes <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientesAtivos.map((cliente) => (
                <button
                  key={cliente.id}
                  type="button"
                  onClick={() => navigate(`/planejamento/novo?analise=${cliente.analise_id || cliente.id}`)}
                  className="bg-white rounded-xl border-2 border-gray-200 p-4 hover:border-[#F25C26] hover:shadow-md transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center group-hover:from-[#F25C26] group-hover:to-[#e04a1a] transition-colors">
                        <Building2 className="w-5 h-5 text-amber-600 group-hover:text-white transition-colors" />
                      </div>
                      <div>
                        <h3 className="font-normal text-gray-900 text-sm">{cliente.nome}</h3>
                        {cliente.tipo && cliente.tipo !== cliente.nome && (
                          <p className="text-xs text-gray-500 truncate max-w-[150px]">{cliente.tipo}</p>
                        )}
                      </div>
                    </div>
                    <Plus className="w-5 h-5 text-gray-300 group-hover:text-[#F25C26] transition-colors" />
                  </div>
                  <div className="space-y-1 text-xs text-gray-500">
                    {cliente.endereco && (
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{cliente.endereco}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      {cliente.area_total && <span>{cliente.area_total.toFixed(0)}m²</span>}
                      {cliente.total_ambientes && <span>{cliente.total_ambientes} amb.</span>}
                      {cliente.status && (
                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px] font-medium">
                          {cliente.status}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ações Rápidas */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-normal text-gray-900 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F25C26]" />
              Ações Rápidas
            </h2>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => navigate("/planejamento/novo")}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[#F25C26] to-[#e04a1a] text-white rounded-xl shadow-lg hover:shadow-xl transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5" />
                  <div className="text-left">
                    <p className="font-normal">Novo Pedido de Materiais</p>
                    <p className="text-xs text-white/80">Criar orçamento de materiais</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/planejamento/orcamentos/composicoes")}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#F25C26] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Layers className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <p className="font-normal text-gray-900">Gerenciar Composições</p>
                    <p className="text-xs text-gray-500">Kits de materiais</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F25C26] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/planejamento/aprovacoes")}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#F25C26] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <FileCheck className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <p className="font-normal text-gray-900">Ver Aprovações</p>
                    <p className="text-xs text-gray-500">{stats.pendentesAprovacao} pendentes</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F25C26] group-hover:translate-x-1 transition-all" />
              </button>

              <button
                type="button"
                onClick={() => navigate("/analise-projeto")}
                className="w-full flex items-center justify-between p-4 bg-white rounded-xl border border-gray-200 hover:border-[#F25C26] hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <p className="font-normal text-gray-900">Análises de Projeto</p>
                    <p className="text-xs text-gray-500">Calcular materiais automático</p>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-[#F25C26] group-hover:translate-x-1 transition-all" />
              </button>
            </div>
          </div>

          {/* Orçamentos Recentes */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-normal text-gray-900 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#F25C26]" />
                Orçamentos Recentes
              </h2>
              <button
                type="button"
                onClick={() => navigate("/planejamento/orcamentos")}
                className="text-sm text-[#F25C26] hover:underline flex items-center gap-1"
              >
                Ver todos <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {orcamentosRecentes.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-normal text-gray-700 mb-2">Nenhum orçamento ainda</h3>
                  <p className="text-gray-500 mb-4">Crie seu primeiro pedido de materiais</p>
                  <button
                    type="button"
                    onClick={() => navigate("/planejamento/novo")}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Criar Pedido
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {orcamentosRecentes.map((orcamento) => {
                    const statusConfig = STATUS_CONFIG[orcamento.status] || STATUS_CONFIG.rascunho;
                    return (
                      <div
                        key={orcamento.id}
                        onClick={() => navigate(`/planejamento/orcamentos/${orcamento.id}`)}
                        className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{orcamento.titulo}</h3>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded ${statusConfig.bg} ${statusConfig.text}`}>
                                {statusConfig.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-500">
                              <span className="flex items-center gap-1">
                                <Building2 className="w-3.5 h-3.5" />
                                {orcamento.cliente_nome || "Sem cliente"}
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(orcamento.criado_em).toLocaleDateString("pt-BR")}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="font-normal text-gray-900">
                              {(orcamento.valor_total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                            </p>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => handleEditarOrcamento(e, orcamento.id)}
                                className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDuplicarOrcamento(e, orcamento)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Duplicar"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleExcluirOrcamento(e, orcamento)}
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
