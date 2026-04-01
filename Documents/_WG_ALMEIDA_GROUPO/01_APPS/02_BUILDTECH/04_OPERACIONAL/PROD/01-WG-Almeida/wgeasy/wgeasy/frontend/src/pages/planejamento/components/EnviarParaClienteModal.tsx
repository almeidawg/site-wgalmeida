/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// MODAL: Enviar para AprovaçÍo do Cliente
// Sistema WG Easy - Grupo WG Almeida
// Permite enviar pedido de materiais para aprovaçÍo via Email ou WhatsApp
// ============================================================

// Backend URL para chamadas de API em produçÍo
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

import { useState, useEffect } from "react";
import { X, Mail, MessageCircle, Send, Loader2, Copy, Check, ExternalLink } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

interface EnviarParaClienteModalProps {
  isOpen: boolean;
  onClose: () => void;
  pedidoId: string;
  pedidoTitulo: string;
  clienteNome?: string;
  onEnviado: () => void;
}

interface DadosCliente {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
}

export default function EnviarParaClienteModal({
  isOpen,
  onClose,
  pedidoId,
  pedidoTitulo,
  clienteNome,
  onEnviado,
}: EnviarParaClienteModalProps) {
  const [loading, setLoading] = useState(false);
  const [loadingCliente, setLoadingCliente] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [canalSelecionado, setCanalSelecionado] = useState<"email" | "whatsapp" | null>(null);
  const [cliente, setCliente] = useState<DadosCliente | null>(null);
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [mensagemPersonalizada, setMensagemPersonalizada] = useState("");
  const [linkAprovacao, setLinkAprovacao] = useState("");
  const [copiado, setCopiado] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  // Carregar dados do cliente ao abrir
  useEffect(() => {
    if (isOpen && pedidoId) {
      carregarDadosCliente();
      gerarLinkAprovacao();
    }
  }, [isOpen, pedidoId]);

  async function carregarDadosCliente() {
    try {
      setLoadingCliente(true);

      // Buscar pedido de materiais para pegar o projeto_id
      const { data: pedido, error: errPedido } = await supabase
        .from("pedidos_materiais")
        .select("projeto_id")
        .eq("id", pedidoId)
        .single();

      if (errPedido || !pedido?.projeto_id) {
        if (import.meta.env.DEV) console.log("Pedido sem projeto vinculado");
        return;
      }

      // Buscar contrato para pegar cliente_id
      const { data: contrato, error: errContrato } = await supabase
        .from("contratos")
        .select("cliente_id")
        .eq("id", pedido.projeto_id)
        .single();

      if (errContrato || !contrato?.cliente_id) {
        if (import.meta.env.DEV) console.log("Contrato sem cliente vinculado");
        return;
      }

      // Buscar dados do cliente
      const { data: clienteData, error: errCliente } = await supabase
        .from("pessoas")
        .select("id, nome, email, telefone")
        .eq("id", contrato.cliente_id)
        .single();

      if (!errCliente && clienteData) {
        setCliente(clienteData);
        setEmail(clienteData.email || "");
        setTelefone(clienteData.telefone || "");
      }
    } catch (error) {
      console.error("Erro ao carregar dados do cliente:", error);
    } finally {
      setLoadingCliente(false);
    }
  }

  async function gerarLinkAprovacao() {
    // Gerar token único para aprovaçÍo
    const token = `${pedidoId}-${Date.now().toString(36)}`;
    const baseUrl = window.location.origin;
    const link = `${baseUrl}/aprovacao/material/${token}`;
    setLinkAprovacao(link);

    // Salvar token no pedido
    try {
      await supabase
        .from("pedidos_materiais")
        .update({ link_aprovacao: token })
        .eq("id", pedidoId);
    } catch (error) {
      console.error("Erro ao salvar link de aprovaçÍo:", error);
    }
  }

  function gerarMensagemWhatsApp(): string {
    let mensagem = `*PEDIDO DE MATERIAIS - APROVAÇÍO*\n\n`;
    mensagem += `Olá${cliente?.nome ? ` ${cliente.nome.split(" ")[0]}` : ""}!\n\n`;
    mensagem += `Temos um pedido de materiais aguardando sua aprovaçÍo:\n\n`;
    mensagem += `*${pedidoTitulo}*\n\n`;

    if (mensagemPersonalizada) {
      mensagem += `${mensagemPersonalizada}\n\n`;
    }

    mensagem += `Clique no link abaixo para *APROVAR* ou *RECUSAR*:\n`;
    mensagem += `${linkAprovacao}\n\n`;
    mensagem += `_Grupo WG Almeida_`;

    return mensagem;
  }

  async function enviarPorEmail() {
    if (!email) {
      setErro("E-mail do cliente é obrigatório");
      return;
    }

    try {
      setEnviando(true);
      setErro("");

      // Chamar API de envio de email
      const response = await fetch(`${BACKEND_URL}/api/email/send`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Internal-Key": INTERNAL_API_KEY,
        },
        body: JSON.stringify({
          to: email,
          subject: `AprovaçÍo de Pedido de Materiais - ${pedidoTitulo}`,
          template: "notification",
          data: {
            titulo: "Pedido de Materiais Aguardando AprovaçÍo",
            mensagem: `
              <p>Olá${cliente?.nome ? ` ${cliente.nome.split(" ")[0]}` : ""}!</p>
              <p>Temos um pedido de materiais aguardando sua aprovaçÍo:</p>
              <p><strong>${pedidoTitulo}</strong></p>
              ${mensagemPersonalizada ? `<p>${mensagemPersonalizada}</p>` : ""}
              <p>Clique no botÍo abaixo para revisar e aprovar ou recusar o pedido.</p>
            `,
            actionUrl: linkAprovacao,
            actionText: "Revisar Pedido",
          },
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar e-mail");
      }

      // Atualizar status do pedido
      await supabase
        .from("pedidos_materiais")
        .update({
          status: "aguardando_aprovacao",
          enviado_cliente_em: new Date().toISOString(),
          enviado_cliente_canal: "email",
        })
        .eq("id", pedidoId);

      setSucesso("E-mail enviado com sucesso!");
      setTimeout(() => {
        onEnviado();
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Erro ao enviar e-mail:", error);
      setErro("Erro ao enviar e-mail. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function enviarPorWhatsApp() {
    if (!telefone) {
      setErro("Telefone do cliente é obrigatório");
      return;
    }

    try {
      setEnviando(true);
      setErro("");

      // Atualizar status do pedido
      await supabase
        .from("pedidos_materiais")
        .update({
          status: "aguardando_aprovacao",
          enviado_cliente_em: new Date().toISOString(),
          enviado_cliente_canal: "whatsapp",
        })
        .eq("id", pedidoId);

      // Gerar URL do WhatsApp
      const mensagem = gerarMensagemWhatsApp();
      let tel = telefone.replace(/\D/g, "");
      if (!tel.startsWith("55")) {
        tel = `55${tel}`;
      }
      const url = `https://wa.me/${tel}?text=${encodeURIComponent(mensagem)}`;

      // Abrir WhatsApp
      window.open(url, "_blank");

      setSucesso("WhatsApp aberto! Envie a mensagem para o cliente.");
      setTimeout(() => {
        onEnviado();
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Erro ao preparar WhatsApp:", error);
      setErro("Erro ao preparar WhatsApp. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  }

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(linkAprovacao);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setErro("Erro ao copiar link");
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div>
            <h2 className="text-lg font-normal text-gray-900">
              Enviar para AprovaçÍo do Cliente
            </h2>
            <p className="text-sm text-gray-500 mt-1">{pedidoTitulo}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Dados do Cliente */}
          {loadingCliente ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 text-[#F25C26] animate-spin" />
            </div>
          ) : (
            <>
              {/* SeleçÍo de Canal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Como deseja enviar?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCanalSelecionado("email")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      canalSelecionado === "email"
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <Mail
                      className={`w-8 h-8 mx-auto mb-2 ${
                        canalSelecionado === "email" ? "text-blue-500" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        canalSelecionado === "email" ? "text-blue-700" : "text-gray-600"
                      }`}
                    >
                      E-mail
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCanalSelecionado("whatsapp")}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      canalSelecionado === "whatsapp"
                        ? "border-green-500 bg-green-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <MessageCircle
                      className={`w-8 h-8 mx-auto mb-2 ${
                        canalSelecionado === "whatsapp" ? "text-green-500" : "text-gray-400"
                      }`}
                    />
                    <p
                      className={`text-sm font-medium ${
                        canalSelecionado === "whatsapp" ? "text-green-700" : "text-gray-600"
                      }`}
                    >
                      WhatsApp
                    </p>
                  </button>
                </div>
              </div>

              {/* Campos baseados no canal */}
              {canalSelecionado === "email" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail do Cliente *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="cliente@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {canalSelecionado === "whatsapp" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telefone do Cliente *
                  </label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}

              {/* Mensagem Personalizada */}
              {canalSelecionado && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensagem Adicional (opcional)
                  </label>
                  <textarea
                    value={mensagemPersonalizada}
                    onChange={(e) => setMensagemPersonalizada(e.target.value)}
                    placeholder="Adicione uma observaçÍo para o cliente..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F25C26]"
                  />
                </div>
              )}

              {/* Link de AprovaçÍo */}
              {linkAprovacao && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <label className="block text-xs font-medium text-gray-500 mb-2">
                    Link de AprovaçÍo
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={linkAprovacao}
                      readOnly
                      className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600"
                    />
                    <button
                      type="button"
                      onClick={copiarLink}
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      title="Copiar link"
                    >
                      {copiado ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-600" />
                      )}
                    </button>
                    <a
                      href={linkAprovacao}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
                      title="Abrir link"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-600" />
                    </a>
                  </div>
                </div>
              )}

              {/* Mensagens de Erro/Sucesso */}
              {erro && (
                <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {erro}
                </div>
              )}
              {sucesso && (
                <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {sucesso}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          {canalSelecionado === "email" && (
            <button
              type="button"
              onClick={enviarPorEmail}
              disabled={enviando || !email}
              className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Mail className="w-4 h-4" />
              )}
              Enviar E-mail
            </button>
          )}
          {canalSelecionado === "whatsapp" && (
            <button
              type="button"
              onClick={enviarPorWhatsApp}
              disabled={enviando || !telefone}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {enviando ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageCircle className="w-4 h-4" />
              )}
              Abrir WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


