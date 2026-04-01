// ============================================================
// BillingPage — Gerenciamento de Assinatura via Asaas (Brasil)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  CheckCircle2,
  Zap,
  Building2,
  ArrowLeft,
  ExternalLink,
  Clock,
  AlertCircle,
  Sparkles,
  Users,
  FileText,
  MessageSquare,
  Activity,
  QrCode,
  Receipt,
} from "lucide-react";
import { TYPOGRAPHY } from "@/constants/typography";
import { LAYOUT } from "@/constants/layout";
import { useAuth } from "@/auth/AuthContext";

// ============================================================
// TIPOS
// ============================================================

interface Plano {
  id: string;
  nome: string;
  slug: string;
  preco_mensal: number;
  descricao: string | null;
  limite_usuarios: number;
  limite_clientes: number;
  permite_ia: boolean;
  permite_relatorios_avancados: boolean;
  permite_integracao_nfe: boolean;
  permite_whatsapp: boolean;
}

interface AssinaturaAtiva {
  id: string;
  plano: Plano;
  status: string;
  trial_end: string | null;
  periodo_fim: string | null;
  asaas_subscription_id?: string | null;
}

type FormaPagamento = "PIX" | "BOLETO" | "CREDIT_CARD";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
// Fallback para WG Almeida quando orgId nÍo disponível (usuário nÍo vinculado a org)
const ORG_ID_FALLBACK = "00000000-0000-0000-0000-000000000001";

// ============================================================
// STATUS BADGE
// ============================================================

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string; cls: string }> = {
    active: { label: "✅ Ativa", cls: "bg-green-100 text-green-700 border border-green-200" },
    trialing: { label: "🔬 Trial gratuito", cls: "bg-blue-100 text-blue-700 border border-blue-200" },
    past_due: { label: "⚠️ Pagamento pendente", cls: "bg-amber-100 text-amber-700 border border-amber-200" },
    canceled: { label: "❌ Cancelada", cls: "bg-red-100 text-red-700 border border-red-200" },
    incomplete: { label: "⏳ Incompleta", cls: "bg-gray-100 text-gray-600 border border-gray-200" },
  };
  const config = configs[status] ?? { label: status, cls: "bg-gray-100 text-gray-600" };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${config.cls}`}>
      {config.label}
    </span>
  );
}

// ============================================================
// SELETOR DE FORMA DE PAGAMENTO
// ============================================================

function SeletorPagamento({
  value,
  onChange,
}: {
  value: FormaPagamento;
  onChange: (v: FormaPagamento) => void;
}) {
  const opcoes: { value: FormaPagamento; label: string; icon: React.ReactNode; desc: string }[] = [
    { value: "PIX", label: "PIX", icon: <QrCode className="w-4 h-4" />, desc: "Instantâneo" },
    { value: "BOLETO", label: "Boleto", icon: <Receipt className="w-4 h-4" />, desc: "1–2 dias úteis" },
    { value: "CREDIT_CARD", label: "CartÍo", icon: <CreditCard className="w-4 h-4" />, desc: "Recorrente auto" },
  ];
  return (
    <div className="flex gap-2">
      {opcoes.map((op) => (
        <button
          key={op.value}
          onClick={() => onChange(op.value)}
          className={`flex-1 flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-sm transition-all ${
            value === op.value
              ? "border-orange-500 bg-orange-50 text-orange-700"
              : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {op.icon}
          <span className="font-semibold">{op.label}</span>
          <span className="text-xs text-gray-400">{op.desc}</span>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// CARD DE PLANO
// ============================================================

function PlanoCard({
  plano,
  isAtual,
  onEscolher,
  loadingSlug,
}: {
  plano: Plano;
  isAtual: boolean;
  onEscolher: (slug: string) => void;
  loadingSlug: string | null;
}) {
  const recursos = [
    { label: `${plano.limite_usuarios === -1 ? "Ilimitados" : plano.limite_usuarios} usuários`, ok: true },
    { label: `${plano.limite_clientes === -1 ? "Ilimitados" : plano.limite_clientes} clientes`, ok: true },
    { label: "IA integrada (Claude + GPT)", ok: plano.permite_ia },
    { label: "Relatórios avançados", ok: plano.permite_relatorios_avancados },
    { label: "IntegraçÍo NF-e / NFS-e", ok: plano.permite_integracao_nfe },
    { label: "AutomaçÍo WhatsApp", ok: plano.permite_whatsapp },
  ];
  const isLoading = loadingSlug === plano.slug;
  const isDestaque = plano.slug === "pro";

  return (
    <div
      className={`relative flex flex-col rounded-2xl border-2 p-6 transition-all ${
        isDestaque
          ? "border-orange-500 shadow-lg shadow-orange-100"
          : isAtual
          ? "border-green-400 bg-green-50"
          : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
      }`}
    >
      {isDestaque && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full">
            ⭐ Mais Popular
          </span>
        </div>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900">{plano.nome}</h3>
        <p className="text-sm text-gray-500 mt-1">{plano.descricao}</p>
      </div>

      <div className="mb-6">
        <span className="text-3xl font-black text-gray-900">
          R$ {plano.preco_mensal.toFixed(0)}
        </span>
        <span className="text-gray-500 text-sm">/mês</span>
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {recursos.map((r, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            {r.ok ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />
            )}
            <span className={r.ok ? "text-gray-700" : "text-gray-400 line-through"}>{r.label}</span>
          </li>
        ))}
      </ul>

      {isAtual ? (
        <div className="text-center py-2 rounded-xl bg-green-100 text-green-700 font-semibold text-sm">
          Plano atual
        </div>
      ) : (
        <button
          onClick={() => onEscolher(plano.slug)}
          disabled={isLoading}
          className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
            isDestaque
              ? "bg-orange-500 hover:bg-orange-600 text-white"
              : "bg-gray-100 hover:bg-gray-200 text-gray-700"
          } disabled:opacity-60`}
        >
          {isLoading ? "Gerando cobrança..." : "Assinar — 14 dias grátis"}
        </button>
      )}
    </div>
  );
}

// ============================================================
// MODAL PIX QR CODE
// ============================================================

function ModalPix({
  qrCode,
  cobrancaUrl,
  onFechar,
}: {
  qrCode?: string;
  cobrancaUrl?: string;
  onFechar: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 text-center">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Pague com PIX</h3>
        <p className="text-sm text-gray-500 mb-4">
          Escaneie o QR code ou copie o código PIX abaixo. Após pagamento confirmado, seu trial será ativado.
        </p>
        {qrCode && (
          <div className="flex justify-center mb-4">
            <img
              src={`data:image/png;base64,${qrCode}`}
              alt="QR Code PIX"
              className="w-48 h-48 rounded-xl border border-gray-200"
            />
          </div>
        )}
        {cobrancaUrl && (
          <a
            href={cobrancaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full py-2.5 rounded-xl bg-orange-500 text-white font-semibold text-sm hover:bg-orange-600 transition-all mb-3"
          >
            <ExternalLink className="inline w-4 h-4 mr-1" />
            Abrir fatura no Asaas
          </a>
        )}
        <button
          onClick={onFechar}
          className="w-full py-2 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50"
        >
          Fechar
        </button>
      </div>
    </div>
  );
}

// ============================================================
// PÁGINA PRINCIPAL
// ============================================================

export default function BillingPage() {
  const navigate = useNavigate();
  const { orgId, usuarioCompleto } = useAuth();
  const orgIdAtivo = orgId || ORG_ID_FALLBACK;
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [assinatura, setAssinatura] = useState<AssinaturaAtiva | null>(null);
  const [loadingPlanos, setLoadingPlanos] = useState(true);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>("PIX");
  const [erro, setErro] = useState<string | null>(null);
  const [pixModal, setPixModal] = useState<{ qrCode?: string; url?: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${BACKEND_URL}/api/billing/planos`).then((r) => r.json()),
      fetch(`${BACKEND_URL}/api/billing/assinatura/${orgIdAtivo}`).then((r) => r.json()),
    ])
      .then(([planosData, assinaturaData]) => {
        setPlanos(planosData.planos ?? []);
        setAssinatura(assinaturaData.assinatura ?? null);
      })
      .catch(() => setErro("Erro ao carregar billing. Configure ASAAS_API_KEY no backend."))
      .finally(() => setLoadingPlanos(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const diasTrial = assinatura?.trial_end
    ? Math.max(0, Math.ceil((new Date(assinatura.trial_end).getTime() - Date.now()) / 86400000))
    : null;

  async function handleEscolherPlano(slug: string) {
    setLoadingSlug(slug);
    setErro(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizacao_id: orgIdAtivo,
          email: usuarioCompleto?.email || "admin@wgeasy.com.br",
          nome_org: usuarioCompleto?.empresa || "Grupo WG Almeida",
          plano_slug: slug,
          billing_type: formaPagamento,
        }),
      });
      const data = await res.json();
      if (data.assinatura) {
        if (formaPagamento === "PIX" && (data.pixQrCode || data.cobrancaUrl)) {
          setPixModal({ qrCode: data.pixQrCode, url: data.cobrancaUrl });
        } else if (data.cobrancaUrl) {
          window.open(data.cobrancaUrl, "_blank");
        }
        // Recarregar assinatura
        const refreshed = await fetch(`${BACKEND_URL}/api/billing/assinatura/${orgIdAtivo}`).then((r) => r.json());
        setAssinatura(refreshed.assinatura ?? null);
      } else {
        throw new Error(data.error || "Erro ao criar assinatura");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao processar pagamento");
    } finally {
      setLoadingSlug(null);
    }
  }

  async function handlePortal() {
    setLoadingPortal(true);
    setErro(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/billing/portal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizacao_id: orgIdAtivo }),
      });
      const data = await res.json();
      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        setErro("Nenhuma cobrança em aberto no momento.");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir portal");
    } finally {
      setLoadingPortal(false);
    }
  }

  return (
    <div className={LAYOUT.pageContainer}>
      {/* Modal PIX */}
      {pixModal && (
        <ModalPix
          qrCode={pixModal.qrCode}
          cobrancaUrl={pixModal.url}
          onFechar={() => setPixModal(null)}
        />
      )}

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div>
          <h1 className={TYPOGRAPHY.pageTitle}>
            <CreditCard className="inline w-6 h-6 mr-2 text-orange-500" />
            Assinatura & Billing
          </h1>
          <p className={TYPOGRAPHY.pageSubtitle}>
            Pagamentos via PIX, Boleto ou CartÍo · Processado pelo Asaas (Brasil)
          </p>
        </div>
      </div>

      {/* Alerta de erro */}
      {erro && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{erro}</p>
        </div>
      )}

      {/* Status da assinatura atual */}
      {assinatura && (
        <div className="mb-8 p-6 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-xl font-bold text-gray-900">Plano {assinatura.plano.nome}</h2>
                <StatusBadge status={assinatura.status} />
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {diasTrial !== null && assinatura.status === "trialing" && (
                  <span className="flex items-center gap-1 text-blue-600 font-medium">
                    <Clock className="w-4 h-4" />
                    {diasTrial} dias de trial restantes
                  </span>
                )}
                {assinatura.periodo_fim && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    Próxima cobrança: {new Date(assinatura.periodo_fim).toLocaleDateString("pt-BR")}
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handlePortal}
              disabled={loadingPortal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition-all disabled:opacity-60"
            >
              <ExternalLink className="w-4 h-4" />
              {loadingPortal ? "Abrindo..." : "Ver cobrança aberta"}
            </button>
          </div>
          {/* Recursos */}
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: <Users className="w-4 h-4" />, label: "Usuários", value: assinatura.plano.limite_usuarios === -1 ? "Ilimitados" : assinatura.plano.limite_usuarios },
              { icon: <Building2 className="w-4 h-4" />, label: "Clientes", value: assinatura.plano.limite_clientes === -1 ? "Ilimitados" : assinatura.plano.limite_clientes },
              { icon: <Activity className="w-4 h-4" />, label: "IA", value: assinatura.plano.permite_ia ? "Habilitada" : "Indisponível" },
              { icon: <MessageSquare className="w-4 h-4" />, label: "WhatsApp", value: assinatura.plano.permite_whatsapp ? "Habilitado" : "Indisponível" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="text-orange-500">{item.icon}</div>
                <div>
                  <div className="text-xs text-gray-500">{item.label}</div>
                  <div className="text-sm font-semibold text-gray-800">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trial banner */}
      {!assinatura && !loadingPlanos && (
        <div className="mb-6 p-5 bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">14 dias grátis, sem compromisso</p>
            <p className="text-sm text-gray-600">Escolha o plano e a forma de pagamento. A primeira cobrança só ocorre após o trial.</p>
          </div>
        </div>
      )}

      {/* Seletor de forma de pagamento */}
      {!assinatura && (
        <div className="mb-6">
          <p className="text-sm font-semibold text-gray-700 mb-2">Forma de pagamento preferida:</p>
          <SeletorPagamento value={formaPagamento} onChange={setFormaPagamento} />
        </div>
      )}

      {/* Planos */}
      <div className="mb-2">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Planos disponíveis</h2>
        <p className="text-sm text-gray-500">Cancele quando quiser. Sem taxa de cancelamento.</p>
      </div>

      {loadingPlanos ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-80 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : planos.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Configure <code className="text-xs bg-gray-100 px-1 rounded">ASAAS_API_KEY</code> no backend para habilitar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
          {planos.map((plano) => (
            <PlanoCard
              key={plano.id}
              plano={plano}
              isAtual={assinatura?.plano?.id === plano.id}
              onEscolher={handleEscolherPlano}
              loadingSlug={loadingSlug}
            />
          ))}
        </div>
      )}

      {/* Rodapé */}
      <div className="mt-8 text-center text-sm text-gray-400 flex items-center justify-center gap-2">
        <Zap className="w-4 h-4 text-orange-400" />
        <span>Pagamentos processados pelo <strong>Asaas</strong> · PIX grátis · Boleto · CartÍo · Seguro e 100% brasileiro</span>
      </div>
    </div>
  );
}


