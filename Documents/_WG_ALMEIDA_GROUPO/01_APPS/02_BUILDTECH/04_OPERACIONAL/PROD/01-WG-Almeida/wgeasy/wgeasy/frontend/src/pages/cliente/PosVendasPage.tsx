/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// src/pages/cliente/PosVendasPage.tsx
// Página de Pós Vendas para a Área do Cliente WGxperience

import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Package, Truck, CheckCircle2, Clock, AlertCircle, FileText, Calendar, Phone, MessageSquare, ArrowLeft, ChevronRight, ThumbsUp, Settings } from "lucide-react";
import { useImpersonation, ImpersonationBar } from "@/hooks/useImpersonation";
import WGStarIcon from "@/components/icons/WGStarIcon";

// Dados simulados de entregas/pedidos
const pedidosEntrega = [
  {
    id: "PED-001",
    titulo: "Marcenaria Cozinha",
    status: "entregue",
    dataEntrega: "2024-12-10",
    dataPrevista: "2024-12-08",
    itens: ["Armários superiores", "Armários inferiores", "Bancada"],
    nucleo: "Marcenaria",
    avaliacao: 5,
  },
  {
    id: "PED-002",
    titulo: "InstalaçÍo Ar Condicionado",
    status: "em_transito",
    dataEntrega: null,
    dataPrevista: "2024-12-18",
    itens: ["Split 12.000 BTUs - Sala", "Split 9.000 BTUs - Quarto"],
    nucleo: "Engenharia",
    avaliacao: null,
  },
  {
    id: "PED-003",
    titulo: "Louças e Metais - Banheiro",
    status: "preparando",
    dataEntrega: null,
    dataPrevista: "2024-12-22",
    itens: ["Cuba de apoio", "Torneira monocomando", "Acessórios"],
    nucleo: "Arquitetura",
    avaliacao: null,
  },
];

const statusConfig = {
  entregue: {
    label: "Entregue",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle2,
  },
  em_transito: {
    label: "Em Trânsito",
    color: "bg-blue-100 text-blue-700 border-blue-200",
    icon: Truck,
  },
  preparando: {
    label: "Preparando",
    color: "bg-orange-100 text-orange-700 border-orange-200",
    icon: Package,
  },
  pendente: {
    label: "Pendente",
    color: "bg-gray-100 text-gray-700 border-gray-200",
    icon: Clock,
  },
  problema: {
    label: "Problema",
    color: "bg-red-100 text-red-700 border-red-200",
    icon: AlertCircle,
  },
};

// Histórico de atendimentos pós-vendas
const historicoAtendimentos = [
  {
    id: "AT-001",
    data: "2024-12-05",
    tipo: "Dúvida",
    assunto: "ManutençÍo preventiva marcenaria",
    status: "resolvido",
    resposta: "Orientações enviadas por email",
  },
  {
    id: "AT-002",
    data: "2024-12-08",
    tipo: "SolicitaçÍo",
    assunto: "Manual de uso dos equipamentos",
    status: "resolvido",
    resposta: "DocumentaçÍo disponibilizada no Drive",
  },
];

export default function PosVendasPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [tabAtiva, setTabAtiva] = useState<"entregas" | "historico" | "avaliacoes">("entregas");
  const clienteId = searchParams.get("cliente_id");

  // Hook de impersonaçÍo
  const {
    isImpersonating,
    impersonatedUser,
    stopImpersonation,
    canImpersonate,
  } = useImpersonation();

  // SEGURANÇA: Só propaga cliente_id na URL se o usuário for ADMIN/MASTER
  const clienteIdSeguro = clienteId && canImpersonate ? clienteId : null;

  const handleVoltar = () => {
    navigate(clienteIdSeguro ? `/wgx?cliente_id=${clienteIdSeguro}` : "/wgx");
  };

  return (
    <>
      {/* Barra de impersonaçÍo */}
      {isImpersonating && impersonatedUser && (
        <ImpersonationBar
          userName={impersonatedUser.nome}
          userType="CLIENTE"
          onExit={stopImpersonation}
        />
      )}

      <div className={`min-h-screen bg-gray-50 ${isImpersonating ? "pt-14" : ""}`}>
        {/* Header da página */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
            <div className="flex items-center gap-4 mb-4">
              <button
                type="button"
                onClick={handleVoltar}
                className="p-2 rounded-lg hover:bg-gray-100 transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-[18px] sm:text-[24px] font-normal text-gray-900">
                  {isImpersonating ? `Pós Vendas - ${impersonatedUser?.nome}` : "Pós Vendas"}
                </h1>
                <p className="text-sm text-gray-500">
                  Acompanhe entregas, avalie serviços e solicite suporte
                </p>
              </div>
            </div>

          {/* Tabs */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTabAtiva("entregas")}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium transition ${
                tabAtiva === "entregas"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4" />
                Entregas
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("historico")}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium transition ${
                tabAtiva === "historico"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Atendimentos
              </div>
            </button>
            <button
              type="button"
              onClick={() => setTabAtiva("avaliacoes")}
              className={`px-4 py-2 rounded-lg text-[14px] font-medium transition ${
                tabAtiva === "avaliacoes"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <WGStarIcon className="w-4 h-4" />
                Avaliações
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Tab: Entregas */}
        {tabAtiva === "entregas" && (
          <div className="space-y-6">
            {/* Cards de resumo */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-md">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <span className="text-[20px] font-normal text-gray-900">
                    {pedidosEntrega.filter((p) => p.status === "entregue").length}
                  </span>
                  <span className="text-xs text-gray-500">Entregues</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <Truck className="w-4 h-4 text-blue-600" />
                  </div>
                  <span className="text-[20px] font-normal text-gray-900">
                    {pedidosEntrega.filter((p) => p.status === "em_transito").length}
                  </span>
                  <span className="text-xs text-gray-500">Em Trânsito</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-100 rounded-md">
                    <Package className="w-4 h-4 text-orange-600" />
                  </div>
                  <span className="text-[20px] font-normal text-gray-900">
                    {pedidosEntrega.filter((p) => p.status === "preparando").length}
                  </span>
                  <span className="text-xs text-gray-500">Preparando</span>
                </div>
              </div>
              <div className="bg-white rounded-lg px-3 py-2 border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-gray-100 rounded-md">
                    <Calendar className="w-4 h-4 text-gray-600" />
                  </div>
                  <span className="text-[20px] font-normal text-gray-900">{pedidosEntrega.length}</span>
                  <span className="text-xs text-gray-500">Total</span>
                </div>
              </div>
            </div>

            {/* Lista de pedidos */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[20px] font-normal text-gray-900">Seus Pedidos</h2>
                <p className="text-sm text-gray-500">Acompanhe o status de cada entrega</p>
              </div>
              <div className="divide-y divide-gray-100">
                {pedidosEntrega.map((pedido) => {
                  const statusInfo = statusConfig[pedido.status as keyof typeof statusConfig];
                  const StatusIcon = statusInfo.icon;
                  return (
                    <div
                      key={pedido.id}
                      className="p-6 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-xs font-mono text-gray-400">{pedido.id}</span>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusInfo.label}
                            </span>
                            <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                              {pedido.nucleo}
                            </span>
                          </div>
                          <h3 className="text-base font-normal text-gray-900 mb-1">
                            {pedido.titulo}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {pedido.itens.map((item, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              PrevisÍo: {new Date(pedido.dataPrevista).toLocaleDateString("pt-BR")}
                            </span>
                            {pedido.dataEntrega && (
                              <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Entregue:{" "}
                                {new Date(pedido.dataEntrega).toLocaleDateString("pt-BR")}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {pedido.avaliacao ? (
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <WGStarIcon
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < pedido.avaliacao!
                                      ? "text-yellow-400 fill-yellow-400"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          ) : pedido.status === "entregue" ? (
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-medium hover:bg-orange-600 transition"
                            >
                              Avaliar
                            </button>
                          ) : null}
                          <ChevronRight className="w-5 h-5 text-gray-400" />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Histórico de Atendimentos */}
        {tabAtiva === "historico" && (
          <div className="space-y-6">
            {/* BotÍo novo atendimento */}
            <div className="flex justify-end">
              <button
                type="button"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-[14px] font-medium hover:bg-[#d94d1a] transition"
              >
                <MessageSquare className="w-4 h-4" />
                Nova SolicitaçÍo
              </button>
            </div>

            {/* Lista de atendimentos */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[20px] font-normal text-gray-900">Histórico de Atendimentos</h2>
                <p className="text-sm text-gray-500">Suas solicitações e respostas da equipe WG</p>
              </div>
              <div className="divide-y divide-gray-100">
                {historicoAtendimentos.map((atendimento) => (
                  <div key={atendimento.id} className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-gray-400">{atendimento.id}</span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs">
                            {atendimento.tipo}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs ${
                              atendimento.status === "resolvido"
                                ? "bg-green-100 text-green-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {atendimento.status === "resolvido" ? "Resolvido" : "Em análise"}
                          </span>
                        </div>
                        <h3 className="text-base font-normal text-gray-900">
                          {atendimento.assunto}
                        </h3>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(atendimento.data).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                    {atendimento.resposta && (
                      <div className="mt-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-500 mb-1">Resposta da equipe:</p>
                        <p className="text-sm text-gray-700">{atendimento.resposta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Canais de contato */}
            <div className="rounded-2xl bg-gradient-to-r from-gray-900 to-gray-800 p-6 text-white">
              <h3 className="text-[20px] font-normal mb-4">Canais de Atendimento</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <a
                  href="https://wa.me/5511999999999"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition"
                >
                  <Phone className="w-5 h-5 text-green-400" />
                  <div>
                    <p className="text-sm font-medium">WhatsApp</p>
                    <p className="text-xs text-gray-400">Resposta em até 2h</p>
                  </div>
                </a>
                <a
                  href="mailto:suporte@wgalmeida.com.br"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition"
                >
                  <MessageSquare className="w-5 h-5 text-blue-400" />
                  <div>
                    <p className="text-sm font-medium">E-mail</p>
                    <p className="text-xs text-gray-400">suporte@wgalmeida.com.br</p>
                  </div>
                </a>
                <a
                  href="tel:+551130001234"
                  className="flex items-center gap-3 p-4 rounded-xl bg-white/10 hover:bg-white/20 transition"
                >
                  <Phone className="w-5 h-5 text-orange-400" />
                  <div>
                    <p className="text-sm font-medium">Telefone</p>
                    <p className="text-xs text-gray-400">(11) 3000-1234</p>
                  </div>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Avaliações */}
        {tabAtiva === "avaliacoes" && (
          <div className="space-y-6">
            {/* Resumo de avaliações */}
            <div className="rounded-2xl bg-white border border-gray-200 p-6 shadow-sm">
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <p className="text-4xl font-normal text-gray-900">4.8</p>
                  <div className="flex items-center gap-1 mt-1">
                    {[...Array(5)].map((_, i) => (
                      <WGStarIcon
                        key={i}
                        className={`w-4 h-4 ${
                          i < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Média geral</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    Sua satisfaçÍo é muito importante para nós! Avalie cada entrega e serviço
                    para nos ajudar a melhorar continuamente.
                  </p>
                </div>
              </div>
            </div>

            {/* Lista de avaliações pendentes */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[20px] font-normal text-gray-900">Avaliações Pendentes</h2>
                <p className="text-sm text-gray-500">
                  Itens entregues aguardando sua avaliaçÍo
                </p>
              </div>
              <div className="p-6">
                {pedidosEntrega.filter((p) => p.status === "entregue" && !p.avaliacao).length ===
                0 ? (
                  <div className="text-center py-8">
                    <ThumbsUp className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-sm text-gray-600">
                      Todas as entregas foram avaliadas!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pedidosEntrega
                      .filter((p) => p.status === "entregue" && !p.avaliacao)
                      .map((pedido) => (
                        <div
                          key={pedido.id}
                          className="flex items-center justify-between p-4 rounded-xl bg-gray-50"
                        >
                          <div>
                            <h4 className="text-sm font-normal text-gray-900">
                              {pedido.titulo}
                            </h4>
                            <p className="text-xs text-gray-500">
                              Entregue em{" "}
                              {new Date(pedido.dataEntrega!).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <button
                            type="button"
                            className="px-4 py-2 rounded-lg bg-orange-500 text-white text-[14px] font-medium hover:bg-orange-600 transition"
                          >
                            Avaliar agora
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Avaliações realizadas */}
            <div className="rounded-2xl bg-white border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-[20px] font-normal text-gray-900">Suas Avaliações</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {pedidosEntrega
                  .filter((p) => p.avaliacao)
                  .map((pedido) => (
                    <div key={pedido.id} className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-normal text-gray-900">{pedido.titulo}</h4>
                          <p className="text-xs text-gray-500 mb-2">{pedido.nucleo}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <WGStarIcon
                                key={i}
                                className={`w-4 h-4 ${
                                  i < pedido.avaliacao!
                                    ? "text-yellow-400 fill-yellow-400"
                                    : "text-gray-300"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs text-gray-500">
                          {new Date(pedido.dataEntrega!).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
}

