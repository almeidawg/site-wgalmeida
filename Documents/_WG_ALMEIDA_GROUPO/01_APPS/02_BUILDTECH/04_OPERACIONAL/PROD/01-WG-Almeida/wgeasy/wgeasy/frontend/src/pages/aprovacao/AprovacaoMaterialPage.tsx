/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// PÁGINA PÚBLICA: AprovaçÍo de Pedido de Materiais
// Sistema WG Easy - Grupo WG Almeida
// Cliente aprova ou recusa pedido via link
// ============================================================

import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  Package,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Building2,
  Calendar,
  FileText,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface PedidoMaterial {
  id: string;
  descricao: string;
  itens: Array<{
    nome: string;
    quantidade: number;
    unidade: string;
  }>;
  prioridade: string;
  observacoes?: string;
  status: string;
  created_at: string;
  projeto_id?: string;
  cliente_nome?: string;
  projeto_numero?: string;
}

type StatusPagina = "carregando" | "pendente" | "aprovado" | "recusado" | "erro" | "expirado";

export default function AprovacaoMaterialPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPagina>("carregando");
  const [pedido, setPedido] = useState<PedidoMaterial | null>(null);
  const [observacoes, setObservacoes] = useState("");
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    if (token) {
      carregarPedido();
    }
  }, [token]);

  async function carregarPedido() {
    try {
      // Buscar pedido pelo token de aprovaçÍo
      const { data: pedidoData, error } = await supabase
        .from("pedidos_materiais")
        .select("*")
        .eq("link_aprovacao", token)
        .single();

      if (error || !pedidoData) {
        setStatus("erro");
        setErro("Pedido não encontrado ou link inválido.");
        return;
      }

      // Verificar status
      if (pedidoData.status === "aprovado" || pedidoData.status === "aprovado_cliente") {
        setStatus("aprovado");
        setPedido(pedidoData);
        return;
      }

      if (pedidoData.status === "recusado" || pedidoData.status === "recusado_cliente") {
        setStatus("recusado");
        setPedido(pedidoData);
        return;
      }

      if (pedidoData.status !== "aguardando_aprovacao") {
        setStatus("expirado");
        setErro("Este pedido não está mais disponível para aprovaçÍo.");
        return;
      }

      // Buscar dados do projeto/cliente
      let cliente_nome = "";
      let projeto_numero = "";

      if (pedidoData.projeto_id) {
        const { data: contrato } = await supabase
          .from("contratos")
          .select("numero, cliente:pessoas!contratos_cliente_id_fkey(nome)")
          .eq("id", pedidoData.projeto_id)
          .single();

        if (contrato) {
          projeto_numero = contrato.numero || "";
          cliente_nome = (contrato.cliente as any)?.nome || "";
        }
      }

      setPedido({
        ...pedidoData,
        cliente_nome,
        projeto_numero,
      });
      setStatus("pendente");
    } catch (error) {
      console.error("Erro ao carregar pedido:", error);
      setStatus("erro");
      setErro("Erro ao carregar pedido. Tente novamente.");
    }
  }

  async function handleAprovar() {
    if (!pedido) return;

    try {
      setProcessando(true);
      setErro("");

      const { error } = await supabase
        .from("pedidos_materiais")
        .update({
          status: "aprovado_cliente",
          aprovado_cliente_em: new Date().toISOString(),
          observacoes_cliente: observacoes || undefined,
        })
        .eq("id", pedido.id);

      if (error) throw error;

      setStatus("aprovado");
    } catch (error) {
      console.error("Erro ao aprovar:", error);
      setErro("Erro ao aprovar pedido. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  async function handleRecusar() {
    if (!pedido) return;

    if (!observacoes.trim()) {
      setErro("Por favor, informe o motivo da recusa.");
      return;
    }

    try {
      setProcessando(true);
      setErro("");

      const { error } = await supabase
        .from("pedidos_materiais")
        .update({
          status: "recusado_cliente",
          recusado_cliente_em: new Date().toISOString(),
          observacoes_cliente: observacoes,
        })
        .eq("id", pedido.id);

      if (error) throw error;

      setStatus("recusado");
    } catch (error) {
      console.error("Erro ao recusar:", error);
      setErro("Erro ao recusar pedido. Tente novamente.");
    } finally {
      setProcessando(false);
    }
  }

  // Tela de carregamento
  if (status === "carregando") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#F25C26] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando pedido...</p>
        </div>
      </div>
    );
  }

  // Tela de erro
  if (status === "erro" || status === "expirado") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            {status === "expirado" ? "Pedido Expirado" : "Erro"}
          </h1>
          <p className="text-gray-600">{erro}</p>
        </div>
      </div>
    );
  }

  // Tela de aprovado
  if (status === "aprovado") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Pedido Aprovado!
          </h1>
          <p className="text-gray-600 mb-6">
            O pedido de materiais foi aprovado com sucesso. Nossa equipe dará
            continuidade ao processo.
          </p>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-500">
              Você receberá atualizações sobre o andamento do pedido.
            </p>
          </div>
          <p className="text-xs text-gray-400 mt-6">Grupo WG Almeida</p>
        </div>
      </div>
    );
  }

  // Tela de recusado
  if (status === "recusado") {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-normal text-gray-900 mb-2">
            Pedido Recusado
          </h1>
          <p className="text-gray-600 mb-6">
            O pedido de materiais foi recusado. Nossa equipe entrará em contato
            para entender suas necessidades.
          </p>
          <p className="text-xs text-gray-400 mt-6">Grupo WG Almeida</p>
        </div>
      </div>
    );
  }

  // Tela de aprovaçÍo pendente
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#F25C26] to-[#e04a1a] rounded-t-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-normal">Pedido de Materiais</h1>
              <p className="text-sm opacity-90">Aguardando sua aprovaçÍo</p>
            </div>
          </div>
        </div>

        {/* Conteúdo */}
        <div className="bg-white rounded-b-2xl shadow-xl">
          {/* Info do Pedido */}
          <div className="p-6 border-b border-gray-200">
            <h2 className="font-normal text-gray-900 mb-4">
              {pedido?.descricao || "Pedido de Materiais"}
            </h2>

            <div className="grid grid-cols-2 gap-4 text-sm">
              {pedido?.cliente_nome && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Building2 className="w-4 h-4" />
                  <span>{pedido.cliente_nome}</span>
                </div>
              )}
              {pedido?.projeto_numero && (
                <div className="flex items-center gap-2 text-gray-600">
                  <FileText className="w-4 h-4" />
                  <span>Contrato: {pedido.projeto_numero}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>
                  {pedido?.created_at
                    ? new Date(pedido.created_at).toLocaleDateString("pt-BR")
                    : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    pedido?.prioridade === "urgente"
                      ? "bg-red-100 text-red-700"
                      : pedido?.prioridade === "baixa"
                      ? "bg-green-100 text-green-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  Prioridade: {pedido?.prioridade || "Normal"}
                </span>
              </div>
            </div>
          </div>

          {/* Lista de Itens */}
          <div className="p-6 border-b border-gray-200">
            <h3 className="font-medium text-gray-900 mb-3">
              Itens Solicitados ({pedido?.itens?.length || 0})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {pedido?.itens?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-900">{item.nome}</span>
                  <span className="text-sm text-gray-500">
                    {item.quantidade} {item.unidade}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Observações do pedido */}
          {pedido?.observacoes && (
            <div className="p-6 border-b border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
              <p className="text-gray-600 text-sm">{pedido.observacoes}</p>
            </div>
          )}

          {/* Campo de observações do cliente */}
          <div className="p-6 border-b border-gray-200">
            <label className="block font-medium text-gray-900 mb-2">
              Suas observações (opcional para aprovar, obrigatório para recusar)
            </label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Adicione comentários ou instruções..."
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
            />
          </div>

          {/* Mensagem de erro */}
          {erro && (
            <div className="px-6 py-3 bg-red-50 text-red-700 text-sm">
              {erro}
            </div>
          )}

          {/* Botões de açÍo */}
          <div className="p-6 flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleRecusar}
              disabled={processando}
              className="flex-1 px-6 py-3 border-2 border-red-500 text-red-600 rounded-xl font-normal hover:bg-red-50 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <XCircle className="w-5 h-5" />
              )}
              Recusar
            </button>
            <button
              type="button"
              onClick={handleAprovar}
              disabled={processando}
              className="flex-1 px-6 py-3 bg-green-600 text-white rounded-xl font-normal hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {processando ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5" />
              )}
              Aprovar Pedido
            </button>
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 rounded-b-2xl text-center">
            <p className="text-xs text-gray-400">
              Grupo WG Almeida - Sistema WG Easy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


