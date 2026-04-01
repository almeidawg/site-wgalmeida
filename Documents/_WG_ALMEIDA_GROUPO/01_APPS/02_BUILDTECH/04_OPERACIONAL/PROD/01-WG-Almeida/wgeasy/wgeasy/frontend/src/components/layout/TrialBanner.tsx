// ============================================================
// TRIAL BANNER — exibe quando organizaçÍo está em período de trial
// Integra com usePlano → mostra dias restantes + CTA upgrade
// ============================================================

import { X, Clock, Zap } from "lucide-react";
import { useState } from "react";
import type { AssinaturaAtiva } from "@/hooks/usePlano";

interface TrialBannerProps {
  assinatura: AssinaturaAtiva | null;
  diasRestantes: number | null;
  organizacaoId?: string;
}

export function TrialBanner({ assinatura, diasRestantes, organizacaoId }: TrialBannerProps) {
  const [fechado, setFechado] = useState(false);

  // Só exibe se estiver em trial
  if (!assinatura || assinatura.status !== "trialing" || fechado) return null;

  const urgente = diasRestantes !== null && diasRestantes <= 3;
  const expirado = diasRestantes === 0;

  const bgClass = expirado
    ? "bg-red-600"
    : urgente
    ? "bg-orange-500"
    : "bg-amber-500";

  const mensagem = expirado
    ? "Seu período de trial expirou. Assine agora para continuar."
    : diasRestantes === 1
    ? "Último dia de trial! Assine agora para não perder o acesso."
    : diasRestantes !== null
    ? `Seu trial termina em ${diasRestantes} dias.`
    : "Você está no período de avaliaçÍo gratuita.";

  const handleUpgrade = () => {
    // Redireciona para página de planos
    const url = organizacaoId
      ? `/sistema/planos?org=${organizacaoId}`
      : "/sistema/planos";
    window.location.href = url;
  };

  return (
    <div
      className={`${bgClass} text-white px-4 py-2 flex items-center justify-between shadow-md text-sm`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 shrink-0" />
        <span className="font-medium">{mensagem}</span>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleUpgrade}
          className="flex items-center gap-1 bg-white text-amber-700 hover:bg-amber-50 font-semibold px-3 py-1 rounded-full text-xs transition-colors"
          aria-label="Fazer upgrade do plano"
        >
          <Zap className="w-3 h-3" />
          Fazer upgrade
        </button>

        {!expirado && (
          <button
            onClick={() => setFechado(true)}
            className="opacity-80 hover:opacity-100 transition-opacity"
            aria-label="Fechar aviso de trial"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}


