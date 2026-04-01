// src/pages/publico/ApresentacaoSistemaPage.tsx
// Apresentacao do Sistema WG Easy - Area do Cliente
// Estilo similar a Solicite Proposta com animacoes

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Camera,
  FileText,
  Calendar,
  DollarSign,
  CheckCircle,
  Shield,
  Headphones,
  FolderOpen,
  MessageSquare,
  ClipboardList,
  LayoutDashboard,
  Sparkles,
  Lock,
  User
} from "lucide-react";

// Cores da marca WG Almeida
const WG_COLORS = {
  laranja: "#F25C26",
  preto: "#2E2E2E",
  cinza: "#4C4C4C",
  cinzaClaro: "#F3F3F3",
  branco: "#FFFFFF",
  arquitetura: "#5E9B94",
  engenharia: "#2B4580",
  marcenaria: "#8B5E3C",
};

// Funcionalidades da Area do Cliente
const FUNCIONALIDADES = [
  {
    id: 1,
    nome: "Dashboard Personalizado",
    icon: LayoutDashboard,
    cor: WG_COLORS.laranja,
    descricao: "Visao geral do seu projeto com progresso em tempo real"
  },
  {
    id: 2,
    nome: "Diario de Obra",
    icon: Camera,
    cor: WG_COLORS.arquitetura,
    descricao: "Fotos e atualizacoes diarias do andamento da sua obra"
  },
  {
    id: 3,
    nome: "Documentos",
    icon: FileText,
    cor: WG_COLORS.engenharia,
    descricao: "Contratos, projetos, plantas e arquivos do seu projeto"
  },
  {
    id: 4,
    nome: "Cronograma",
    icon: Calendar,
    cor: WG_COLORS.marcenaria,
    descricao: "Etapas, prazos e marcos importantes do projeto"
  },
];

const FUNCIONALIDADES_EXTRA = [
  {
    id: 5,
    nome: "Financeiro",
    icon: DollarSign,
    cor: WG_COLORS.laranja,
    descricao: "Acompanhe pagamentos e faturamento"
  },
  {
    id: 6,
    nome: "Comentarios",
    icon: MessageSquare,
    cor: WG_COLORS.arquitetura,
    descricao: "Comunique-se diretamente com a equipe"
  },
  {
    id: 7,
    nome: "Checklists",
    icon: ClipboardList,
    cor: WG_COLORS.engenharia,
    descricao: "Acompanhe itens pendentes e aprovacoes"
  },
  {
    id: 8,
    nome: "Arquivos Drive",
    icon: FolderOpen,
    cor: WG_COLORS.marcenaria,
    descricao: "Todos os seus documentos em um so lugar"
  },
];

const RECURSOS_AVANCADOS = [
  {
    id: 9,
    nome: "Aprovacoes Online",
    icon: CheckCircle,
    cor: WG_COLORS.arquitetura,
    descricao: "Aprove orcamentos e materiais pelo celular"
  },
  {
    id: 10,
    nome: "Garantia Digital",
    icon: Shield,
    cor: WG_COLORS.engenharia,
    descricao: "Termos e certificados de garantia"
  },
  {
    id: 11,
    nome: "Suporte Tecnico",
    icon: Headphones,
    cor: WG_COLORS.marcenaria,
    descricao: "Assistencia tecnica pos-entrega"
  },
  {
    id: 12,
    nome: "IA Integrada",
    icon: Sparkles,
    cor: WG_COLORS.laranja,
    descricao: "Analises inteligentes do seu projeto"
  },
];

export default function ApresentacaoSistemaPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const skipIntro = searchParams.get("skip") === "1";

  const [currentStep, setCurrentStep] = useState(skipIntro ? 5 : 0);
  const [isMobile, setIsMobile] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(!skipIntro);

  // Detectar mobile
  useEffect(() => {
    const checkMobile = () => {
      const isMobileWidth = window.innerWidth < 768;
      const isPortrait = window.innerHeight > window.innerWidth;
      setIsMobile(isMobileWidth || isPortrait);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Auto-avancar steps
  useEffect(() => {
    if (!autoAdvance) return;

    const timers = [3000, 4000, 4000, 4000, 5000]; // Tempo para cada step
    const timer = setTimeout(() => {
      if (currentStep < 5) {
        setCurrentStep(currentStep + 1);
      }
    }, timers[currentStep] || 3000);

    return () => clearTimeout(timer);
  }, [currentStep, autoAdvance]);

  const videoSrc = isMobile
    ? "/videos/hero/VERTICAL.mp4"
    : "/videos/hero/HORIZONTAL.mp4";

  const handleIrParaLogin = () => {
    navigate("/login");
  };

  const handlePular = () => {
    setAutoAdvance(false);
    setCurrentStep(5);
  };

  const progress = (currentStep / 5) * 100;

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      {/* Video de fundo */}
      <div className="absolute inset-0 z-0 w-full h-full overflow-hidden">
        <video
          key={videoSrc}
          className="absolute top-1/2 left-1/2 w-full h-full min-w-full min-h-full object-cover transform -translate-x-1/2 -translate-y-1/2"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/70" />
      </div>

      {/* Gradientes animados */}
      <motion.div
        className="absolute inset-0 z-[1] opacity-30 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 15% 25%, ${WG_COLORS.laranja}30 0%, transparent 35%),
                       radial-gradient(circle at 85% 20%, ${WG_COLORS.arquitetura}25 0%, transparent 35%),
                       radial-gradient(circle at 75% 75%, ${WG_COLORS.engenharia}20 0%, transparent 35%),
                       radial-gradient(circle at 25% 80%, ${WG_COLORS.marcenaria}20 0%, transparent 35%)`,
        }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Progress bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-30">
        <motion.div
          className="h-full bg-gradient-to-r from-[#F25C26] to-[#5E9B94]"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Botao Pular */}
      {currentStep < 5 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handlePular}
          className="absolute top-6 right-6 z-30 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium hover:bg-white/20 transition-all"
        >
          Pular
        </motion.button>
      )}

      {/* Logo WG */}
      <div className="absolute top-6 left-6 z-30">
        <motion.img
          src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
          alt="WG Almeida"
          className="h-10 opacity-80"
          animate={{ opacity: [0.6, 0.9, 0.6] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      </div>

      {/* Conteudo principal */}
      <div className="relative z-10 w-full max-w-4xl mx-auto px-4">
        <AnimatePresence mode="wait">
          {/* Step 0: Logo e Boas-vindas */}
          {currentStep === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="text-center"
            >
              <motion.div
                className="w-32 h-32 md:w-40 md:h-40 mx-auto mb-8 rounded-2xl flex items-center justify-center relative overflow-hidden p-4"
                style={{
                  background: WG_COLORS.branco,
                  boxShadow: `0 20px 60px ${WG_COLORS.laranja}40`,
                  border: `3px solid ${WG_COLORS.laranja}30`,
                }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <img
                  src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                  alt="WG Almeida"
                  className="w-full h-full object-contain"
                />
              </motion.div>
              <h1 className="text-2xl md:text-4xl font-normal text-white mb-4">
                WG Easy
              </h1>
              <p className="text-white/80 text-lg md:text-xl">
                Sua Area do Cliente Exclusiva
              </p>
            </motion.div>
          )}

          {/* Step 1: Introducao */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="text-center max-w-2xl mx-auto"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-20 h-20 bg-gradient-to-br from-[#F25C26] to-[#5E9B94] rounded-2xl flex items-center justify-center mx-auto mb-6"
              >
                <LayoutDashboard className="w-10 h-10 text-white" />
              </motion.div>
              <h2 className="text-2xl md:text-3xl font-normal text-white mb-4">
                Bem-vindo ao WG Easy
              </h2>
              <p className="text-white/80 text-lg md:text-lg mb-8">
                Aqui voce acompanha seu projeto em tempo real, com transparencia
                total e controle na palma da sua mao.
              </p>
              <motion.div
                className="w-32 h-1.5 mx-auto rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${WG_COLORS.laranja}, ${WG_COLORS.arquitetura}, ${WG_COLORS.engenharia})`,
                }}
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              />
            </motion.div>
          )}

          {/* Step 2: Funcionalidades Principais */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full"
            >
              <h2 className="text-2xl font-normal text-white mb-8">
                O que voce encontrara:
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {FUNCIONALIDADES.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="p-4 md:p-5 rounded-xl backdrop-blur-md relative overflow-hidden"
                      style={{
                        background: `linear-gradient(135deg, ${item.cor}50, ${item.cor}25)`,
                        border: `1px solid ${item.cor}70`,
                        boxShadow: `0 10px 30px ${item.cor}30`,
                      }}
                    >
                      <Icon className="w-8 h-8 md:w-10 md:h-10 text-white mb-2 mx-auto" />
                      <h3 className="text-sm md:text-base font-normal text-white mb-1">
                        {item.nome}
                      </h3>
                      <p className="text-white/70 text-xs">{item.descricao}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Mais Recursos */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full"
            >
              <h2 className="text-2xl font-normal text-white mb-8">
                E muito mais:
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {FUNCIONALIDADES_EXTRA.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.12 }}
                      className="p-4 md:p-5 rounded-xl backdrop-blur-md"
                      style={{
                        background: `linear-gradient(135deg, ${item.cor}40, ${item.cor}20)`,
                        border: `1px solid ${item.cor}50`,
                        boxShadow: `0 8px 25px ${item.cor}25`,
                      }}
                    >
                      <Icon className="w-7 h-7 md:w-9 md:h-9 text-white mb-2 mx-auto" />
                      <h3 className="text-sm md:text-base font-normal text-white mb-1">
                        {item.nome}
                      </h3>
                      <p className="text-white/70 text-xs">{item.descricao}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 4: Recursos Avancados */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center w-full"
            >
              <h2 className="text-2xl font-normal text-white mb-8">
                Recursos exclusivos:
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-5">
                {RECURSOS_AVANCADOS.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.12 }}
                      className="p-4 md:p-5 rounded-xl backdrop-blur-md"
                      style={{
                        background: `linear-gradient(135deg, ${item.cor}40, ${item.cor}20)`,
                        border: `1px solid ${item.cor}50`,
                        boxShadow: `0 8px 25px ${item.cor}25`,
                      }}
                    >
                      <Icon className="w-7 h-7 md:w-9 md:h-9 text-white mb-2 mx-auto" />
                      <h3 className="text-sm md:text-base font-normal text-white mb-1">
                        {item.nome}
                      </h3>
                      <p className="text-white/70 text-xs">{item.descricao}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 5: Login */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md mx-auto"
            >
              <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#F25C26] to-[#5E9B94] p-6 text-center">
                  <motion.div
                    className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Lock className="w-8 h-8 text-[#F25C26]" />
                  </motion.div>
                  <h2 className="text-2xl font-normal text-white mb-2">
                    Acesse sua Area
                  </h2>
                  <p className="text-white/90 text-sm">
                    Entre com suas credenciais para acessar
                  </p>
                </div>

                {/* Conteudo */}
                <div className="p-3 sm:p-6 space-y-4">
                  <div className="text-center mb-6">
                    <p className="text-gray-600 text-sm">
                      Sua area exclusiva com tudo sobre seu projeto WG Almeida
                    </p>
                  </div>

                  {/* Resumo do que tem */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Dashboard personalizado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Fotos e atualizacoes da obra</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Documentos e contratos</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Cronograma atualizado</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span>Comunicacao direta com a equipe</span>
                    </div>
                  </div>

                  {/* Botao de Login */}
                  <button
                    onClick={handleIrParaLogin}
                    className="w-full py-4 bg-gradient-to-r from-[#F25C26] to-[#D94E1F] text-white rounded-xl font-normal text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <User className="w-5 h-5" />
                    Fazer Login
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  <p className="text-center text-xs text-gray-400 mt-4">
                    Nao possui acesso? Entre em contato com seu consultor WG Almeida
                  </p>
                </div>
              </div>

              {/* Rodape */}
              <div className="text-center mt-6">
                <p className="text-white/60 text-xs">
                  WG Almeida Engenharia e Construcoes
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Indicadores de Step */}
      {currentStep < 5 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-30">
          {[0, 1, 2, 3, 4].map((step) => (
            <button
              key={step}
              onClick={() => {
                setAutoAdvance(false);
                setCurrentStep(step);
              }}
              className={`w-2 h-2 rounded-full transition-all ${
                step === currentStep
                  ? "w-8 bg-primary"
                  : step < currentStep
                  ? "bg-white/60"
                  : "bg-white/30"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
