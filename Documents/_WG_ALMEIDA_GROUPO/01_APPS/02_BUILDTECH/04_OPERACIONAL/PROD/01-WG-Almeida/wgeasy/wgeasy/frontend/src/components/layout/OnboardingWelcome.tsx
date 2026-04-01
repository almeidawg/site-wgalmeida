// ============================================================
// COMPONENTE: OnboardingWelcome
// Modal de boas-vindas para novos usuários / primeira visita
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowRight,
  Users,
  FileText,
  TrendingUp,
  Settings,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";

const ONBOARDING_KEY = "wg-onboarding-v1-seen";

interface Step {
  emoji: string;
  title: string;
  description: string;
  cta?: string;
  path?: string;
  icon: React.ReactNode;
  cor: string;
}

const STEPS: Step[] = [
  {
    emoji: "👋",
    icon: <Sparkles className="w-6 h-6 text-orange-500" />,
    cor: "from-orange-50 to-amber-50 border-orange-100",
    title: "Bem-vindo ao WG Easy!",
    description: "Sua plataforma de gestÍo completa para escritórios de arquitetura e construçÍo. Veja um resumo rápido de tudo que você pode fazer.",
  },
  {
    emoji: "👥",
    icon: <Users className="w-6 h-6 text-blue-500" />,
    cor: "from-blue-50 to-indigo-50 border-blue-100",
    title: "Cadastre seus Clientes",
    description: "Gerencie clientes, especificadores e colaboradores em um único lugar. Vincule-os a propostas, contratos e projetos automaticamente.",
    cta: "Cadastrar cliente",
    path: "/pessoas/clientes/novo",
  },
  {
    emoji: "📄",
    icon: <FileText className="w-6 h-6 text-green-500" />,
    cor: "from-green-50 to-emerald-50 border-green-100",
    title: "Crie sua Primeira Proposta",
    description: "Use o wizard inteligente com importaçÍo de análise de projeto, catálogo de preços e geraçÍo automática de itens por m².",
    cta: "Nova Proposta",
    path: "/propostas/nova",
  },
  {
    emoji: "🎯",
    icon: <TrendingUp className="w-6 h-6 text-purple-500" />,
    cor: "from-purple-50 to-violet-50 border-purple-100",
    title: "Acompanhe o Funil de Vendas",
    description: "Visualize suas oportunidades em kanban, receba insights de IA sobre quais clientes têm maior chance de fechar negócio.",
    cta: "Ver Oportunidades",
    path: "/oportunidades",
  },
  {
    emoji: "⚙️",
    icon: <Settings className="w-6 h-6 text-gray-600" />,
    cor: "from-gray-50 to-slate-50 border-gray-200",
    title: "Configure sua Conta",
    description: "Defina sua empresa, plataforma de pagamento (InfinitPay, Asaas, etc), taxas de cartÍo e personalize o sistema para seu escritório.",
    cta: "Configurar agora",
    path: "/sistema/configuracoes",
  },
];

export default function OnboardingWelcome() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const navigate = useNavigate();
  const { usuario, loading } = useUsuarioLogado();

  useEffect(() => {
    if (loading) return;
    // Mostrar apenas se nunca viu antes e usuário é Admin/Master
    const visto = localStorage.getItem(ONBOARDING_KEY);
    if (!visto && usuario && (usuario.tipo_usuario === "MASTER" || usuario.tipo_usuario === "ADMIN")) {
      // Pequeno delay para não aparecer imediatamente no carregamento
      const t = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(t);
    }
  }, [loading, usuario]);

  function fechar() {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setVisible(false);
  }

  function avancar() {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      fechar();
    }
  }

  function irPara(path?: string) {
    fechar();
    if (path) navigate(path);
  }

  const atual = STEPS[step];
  const isUltimo = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]"
            onClick={fechar}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] w-full max-w-md px-3 sm:px-0"
          >
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Conteúdo do passo atual */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.2 }}
                  className={`p-6 bg-gradient-to-br ${atual.cor} border-b`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center text-2xl">
                      {atual.emoji}
                    </div>
                    <button
                      type="button"
                      onClick={fechar}
                      className="p-1.5 hover:bg-white/60 rounded-lg transition-colors text-gray-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <h2 className="text-[18px] font-semibold text-gray-900 mb-2">
                    {atual.title}
                  </h2>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    {atual.description}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Footer */}
              <div className="p-4 flex items-center justify-between bg-white">
                {/* Indicadores de passo */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setStep(i)}
                      className={`rounded-full transition-all ${
                        i === step
                          ? "w-5 h-2 bg-primary"
                          : "w-2 h-2 bg-gray-200 hover:bg-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Botões */}
                <div className="flex items-center gap-2">
                  {atual.cta && atual.path && (
                    <button
                      type="button"
                      onClick={() => irPara(atual.path)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-[12px] text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      {atual.cta}
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={avancar}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-[#D94E1A] text-white rounded-lg text-[12px] font-medium transition-colors"
                  >
                    {isUltimo ? "Começar!" : "Próximo"}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


