import { useState, useEffect, useMemo, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { registrarUltimoAcesso } from "@/lib/usuariosApi";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ArrowRight, User } from "lucide-react";

// ============================================
// PALETA OFICIAL - GRUPO WG ALMEIDA (2026)
// ============================================
const WG_COLORS = {
  // Cor Principal - O Ponto da CriaçÍo
  laranja: "#F25C26",

  // Cores por Unidade de Negócio
  arquitetura: "#5E9B94", // Verde Mineral
  engenharia: "#2B4580", // Azul Técnico
  marcenaria: "#8B5E3C", // Marrom Carvalho

  // Cores Neutras Institucionais
  preto: "#2E2E2E",
  cinza: "#4C4C4C",
  cinzaClaro: "#F3F3F3",
  branco: "#FFFFFF",
};

// Array de cores da marca para as partículas (ordem da jornada)
const BRAND_COLORS = [
  WG_COLORS.laranja, // Ideia
  WG_COLORS.arquitetura, // ConcepçÍo
  WG_COLORS.engenharia, // Estrutura
  WG_COLORS.marcenaria, // MaterializaçÍo
  WG_COLORS.preto, // Elegância
];

// Componente de partículas animadas com cores da marca
function FloatingParticles() {
  const particles = useMemo(() => {
    return [...Array(30)].map((_, i) => ({
      id: i,
      size: Math.random() * 14 + 6,
      color: BRAND_COLORS[i % BRAND_COLORS.length],
      left: Math.random() * 100,
      top: Math.random() * 100,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 4,
      xOffset: Math.random() * 40 - 20,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: `${p.left}%`,
            top: `${p.top}%`,
            opacity: 0.5,
          }}
          animate={{
            y: [0, -50, 0],
            x: [0, p.xOffset, 0],
            opacity: [0.2, 0.6, 0.2],
            scale: [1, 1.4, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

// Componente de loading com círculo multicolorido
function LoadingSpinner() {
  return (
    <div className="relative w-8 h-8">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          border: "3px solid transparent",
          borderTopColor: WG_COLORS.branco,
          borderRightColor: WG_COLORS.arquitetura,
        }}
        animate={{ rotate: 360 }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: "linear",
        }}
      />
    </div>
  );
}

// Componente de loading avançado durante autenticaçÍo
function AuthLoadingScreen() {
  const loadingTexts = [
    "Verificando credenciais...",
    "Conectando ao sistema...",
    "Carregando permissões...",
    "Preparando dashboard...",
  ];

  const [textIndex, setTextIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 1500);
    return () => clearInterval(interval);
  }, [loadingTexts.length]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: WG_COLORS.branco }}
    >
      <div className="text-center">
        {/* Logo animado com círculo das cores WG */}
        <motion.div
          className="mb-8"
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <div className="w-28 h-28 mx-auto relative">
            {/* Círculo externo com gradiente das cores WG (jornada) */}
            <motion.div
              className="absolute inset-0 rounded-full p-1"
              style={{
                background: `conic-gradient(from 0deg,
                  ${WG_COLORS.laranja},
                  ${WG_COLORS.arquitetura},
                  ${WG_COLORS.engenharia},
                  ${WG_COLORS.marcenaria},
                  ${WG_COLORS.laranja})`,
              }}
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            >
              <div
                className="w-full h-full rounded-full flex items-center justify-center p-4"
                style={{ background: WG_COLORS.branco }}
              >
                <img
                  src="/simbolo-wg.svg"
                  alt="WG"
                  className="w-full h-full object-contain"
                />
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Barra de progresso com gradiente da jornada */}
        <div
          className="w-64 h-1.5 rounded-full overflow-hidden mb-4"
          style={{ background: WG_COLORS.cinzaClaro }}
        >
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg,
                ${WG_COLORS.laranja},
                ${WG_COLORS.arquitetura},
                ${WG_COLORS.engenharia},
                ${WG_COLORS.marcenaria})`,
            }}
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </div>

        {/* Texto animado */}
        <AnimatePresence mode="wait">
          <motion.p
            key={textIndex}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            style={{ color: WG_COLORS.cinza }}
            className="text-sm"
          >
            {loadingTexts[textIndex]}
          </motion.p>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) return value;
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export default function LoginPage() {
  const [emailOrCpf, setEmailOrCpf] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // Nota: não limpamos sessÍo ao montar /login.
  // PublicRoute já permite acesso autenticado a /login (para troca de conta).
  // Chamar signOut() aqui destruía sessões válidas em casos de token refresh
  // ou navegaçÍo direta para /login, causando loop de autenticaçÍo.

  async function login(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isSubmitting || isLoading) {
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const rawIdentifier = emailOrCpf.trim();
      const rawPassword = password.trim();

      const isEmail = rawIdentifier.includes("@");
      let email = "";

      if (isEmail) {
        email = rawIdentifier.toLowerCase();
      } else {
        // Buscar email pelo CPF usando funçÍo RPC (bypass RLS para permitir busca antes do login)
        const { data: rpcData, error: rpcError } = await supabase
          .rpc("buscar_email_por_cpf", { p_cpf: rawIdentifier });

        if (rpcError) {
          console.error("Erro ao buscar CPF:", rpcError);
          throw new Error("Erro ao verificar CPF. Tente novamente.");
        }

        const usuarioData = rpcData && rpcData.length > 0 ? rpcData[0] : null;

        if (!usuarioData) {
          throw new Error("CPF não encontrado no sistema");
        }

        if (!usuarioData.email) {
          throw new Error(
            "Este CPF não possui email cadastrado. Use o email para entrar."
          );
        }

        if (!usuarioData.ativo) {
          throw new Error(
            "Conta inativa. Entre em contato com o administrador."
          );
        }

        email = usuarioData.email;
      }

      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email,
          password: rawPassword,
        });

      if (authError) {
        const invalidCred = authError.message === "Invalid login credentials";
        throw new Error(
          invalidCred ? "Email/CPF ou senha incorretos" : authError.message
        );
      }

      const effectiveUser =
        authData.user || (await supabase.auth.getUser()).data.user;

      if (!effectiveUser?.id) {
        throw new Error("Falha na autenticaçÍo");
      }

      const { data: usuario, error: usuarioError } = await supabase
        .from("usuarios")
        .select("id, tipo_usuario, pessoa_id, email_contato, cpf, ativo")
        .eq("auth_user_id", effectiveUser.id)
        .maybeSingle();

      if (usuarioError) {
        console.error("Erro ao buscar usuario:", usuarioError);
      }

      if (!usuario || !usuario.ativo) {
        await supabase.auth.signOut();
        throw new Error(
          "Perfil não encontrado ou inativo. Contate o administrador."
        );
      }

      if (usuario.cpf) {
        try {
          await registrarUltimoAcesso(usuario.cpf);
        } catch (registroError) {
          console.warn("[Login] Falha ao registrar ultimo acesso:", registroError);
        }
      }

      let redirectUrl = "/";
      let welcomeMessage = `Bem-vindo! Você é um ${usuario.tipo_usuario}`;

      switch (usuario.tipo_usuario) {
        case "MASTER":
          // Founder & CEO - Acesso total + dashboard executivo
          redirectUrl = "/";
          welcomeMessage = "Bem-vindo, Founder & CEO! 🎯";
          break;
        case "ADMIN":
          // Administrador - Acesso administrativo
          redirectUrl = "/";
          welcomeMessage = "Bem-vindo, Administrador!";
          break;
        case "COMERCIAL":
          redirectUrl = "/oportunidades";
          welcomeMessage = "Bem-vindo ao Comercial!";
          break;
        case "ATENDIMENTO":
          redirectUrl = "/";
          welcomeMessage = "Bem-vindo ao Atendimento!";
          break;
        case "JURIDICO":
          redirectUrl = "/juridico";
          welcomeMessage = "Bem-vindo ao Jurídico!";
          break;
        case "FINANCEIRO":
          redirectUrl = "/financeiro";
          welcomeMessage = "Bem-vindo ao Financeiro!";
          break;
        case "CLIENTE":
          redirectUrl = usuario.pessoa_id
            ? `/wgx?cliente_id=${usuario.pessoa_id}`
            : "/wgx";
          welcomeMessage = "Bem-vindo à Área do Cliente!";
          break;
        case "FORNECEDOR":
          redirectUrl = "/fornecedor";
          welcomeMessage = "Bem-vindo, Fornecedor!";
          break;
        case "COLABORADOR":
          redirectUrl = "/colaborador";
          welcomeMessage = "Bem-vindo, Colaborador!";
          break;
        case "ESPECIFICADOR":
          redirectUrl = "/especificador";
          welcomeMessage = "Bem-vindo, Especificador!";
          break;
        default:
          redirectUrl = "/";
      }

      setSuccessMessage(welcomeMessage);

      await new Promise((resolve) => setTimeout(resolve, 1200));
      navigate(redirectUrl);
    } catch (err: unknown) {
      console.error("Erro no login:", err);
      const message =
        err instanceof Error
          ? err.message
          : "Erro ao fazer login. Tente novamente.";
      setError(message);
    } finally {
      setIsLoading(false);
      setIsSubmitting(false);
    }
  }

  async function loginWithGoogle() {
    setIsLoading(true);
    setError("");

    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setIsLoading(false);
      }
    } catch (err: unknown) {
      console.error("Erro no login Google:", err);
      setError("Erro ao conectar com Google. Tente novamente.");
      setIsLoading(false);
    }
  }

  return (
    <>
      <AnimatePresence>{isLoading && <AuthLoadingScreen />}</AnimatePresence>

      <div
        className="min-h-[100dvh] flex items-center justify-center relative overflow-x-hidden overflow-y-auto py-6"
        style={{
          background: `linear-gradient(135deg, ${WG_COLORS.branco} 0%, ${WG_COLORS.cinzaClaro} 50%, ${WG_COLORS.branco} 100%)`,
        }}
      >
        {/* Partículas flutuantes coloridas */}
        <FloatingParticles />

        {/* Gradiente de fundo animado com cores da jornada */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 15% 25%, ${WG_COLORS.laranja}25 0%, transparent 35%),
                         radial-gradient(circle at 85% 20%, ${WG_COLORS.arquitetura}20 0%, transparent 35%),
                         radial-gradient(circle at 75% 75%, ${WG_COLORS.engenharia}15 0%, transparent 35%),
                         radial-gradient(circle at 25% 80%, ${WG_COLORS.marcenaria}15 0%, transparent 35%)`,
          }}
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Card de Login */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          {/* Efeito de brilho atrás do card */}
          <motion.div
            className="absolute -inset-1 rounded-3xl opacity-30 blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${WG_COLORS.laranja}, ${WG_COLORS.arquitetura}, ${WG_COLORS.engenharia})`,
            }}
            animate={{
              opacity: [0.15, 0.3, 0.15],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* Card Principal */}
          <div
            className="relative rounded-3xl p-8 backdrop-blur-xl"
            style={{
              background: `rgba(255, 255, 255, 0.9)`,
              border: `1px solid rgba(255, 255, 255, 0.5)`,
              boxShadow: `0 25px 50px -12px rgba(0, 0, 0, 0.12), 0 0 0 1px ${WG_COLORS.laranja}10`,
            }}
          >
            {/* Logo e Título */}
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {/* Logo WG Real - Grupo WG Almeida */}
              <motion.div
                className="w-28 h-28 mx-auto mb-4 rounded-2xl flex items-center justify-center relative overflow-hidden p-2"
                style={{
                  background: WG_COLORS.branco,
                  boxShadow: `0 10px 30px ${WG_COLORS.laranja}25`,
                  border: `2px solid ${WG_COLORS.laranja}20`,
                }}
                whileHover={{ scale: 1.05, rotate: 2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <img
                  src="/imagens/logoscomfundotransparente/logogrupoWgAlmeida.png"
                  alt="Grupo WG Almeida"
                  className="w-full h-full object-contain"
                />

                {/* Brilho animado */}
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background:
                      "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.4) 50%, transparent 70%)",
                  }}
                  animate={{
                    x: ["-150%", "150%"],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: "easeInOut",
                  }}
                />
              </motion.div>

              <h1
                className="text-2xl font-normal mb-2"
                style={{
                  color: WG_COLORS.preto,
                  fontFamily: "Oswald, sans-serif",
                }}
              >
                Bem-vindo ao WGEasy
              </h1>
              <p style={{ color: WG_COLORS.cinza }} className="text-sm">
                Sistema de GestÍo do Grupo WG Almeida
              </p>
            </motion.div>

            {/* Erro */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 p-3 rounded-xl text-sm text-center"
                  style={{
                    background: "rgba(220, 38, 38, 0.1)",
                    border: "1px solid rgba(220, 38, 38, 0.2)",
                    color: "#DC2626",
                  }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sucesso */}
            <AnimatePresence>
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto" }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  className="mb-4 p-3 rounded-xl text-sm text-center"
                  style={{
                    background: "rgba(34, 197, 94, 0.1)",
                    border: "1px solid rgba(34, 197, 94, 0.2)",
                    color: "#16A34A",
                  }}
                >
                  {successMessage}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Formulário */}
            <form onSubmit={login} className="space-y-5">
              {/* Campo Email ou CPF */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                {/* Label mobile: ícone + texto acima do campo */}
                <div className="flex items-center gap-2 mb-2 sm:hidden">
                  <User className="w-4 h-4" style={{ color: focusedField === "emailOrCpf" ? WG_COLORS.laranja : WG_COLORS.cinza }} />
                  <span className="text-sm font-medium" style={{ color: WG_COLORS.cinza }}>Email ou CPF</span>
                </div>
                <div
                  className={`relative rounded-xl transition-all duration-300`}
                  style={{
                    background: WG_COLORS.cinzaClaro,
                    border:
                      focusedField === "emailOrCpf"
                        ? `2px solid ${WG_COLORS.laranja}`
                        : `1px solid rgba(0, 0, 0, 0.08)`,
                    boxShadow:
                      focusedField === "emailOrCpf"
                        ? `0 0 0 3px ${WG_COLORS.laranja}20`
                        : "none",
                  }}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:block">
                    <User
                      className="w-5 h-5 transition-colors duration-300"
                      style={{
                        color:
                          focusedField === "emailOrCpf"
                            ? WG_COLORS.laranja
                            : WG_COLORS.cinza,
                      }}
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Email ou CPF"
                    value={emailOrCpf}
                    autoComplete="username"
                    onChange={(e) => {
                      let value = e.target.value;
                      if (/^\d+$/.test(value) && value.length === 11) {
                        value = formatCPF(value);
                      }
                      setEmailOrCpf(value);
                    }}
                    onFocus={() => setFocusedField("emailOrCpf")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent placeholder-gray-400 pr-4 py-4 rounded-xl focus:outline-none pl-4 sm:pl-12"
                    style={{ color: WG_COLORS.preto }}
                    required
                  />
                  <span
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: WG_COLORS.cinza }}
                  >
                    {emailOrCpf.includes("@") ? "Email" : "CPF"}
                  </span>
                </div>
              </motion.div>

              {/* Ajuda sobre Email/CPF */}

              {/* Campo Senha */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                {/* Label mobile: ícone + texto acima do campo */}
                <div className="flex items-center gap-2 mb-2 sm:hidden">
                  <Lock className="w-4 h-4" style={{ color: focusedField === "password" ? WG_COLORS.laranja : WG_COLORS.cinza }} />
                  <span className="text-sm font-medium" style={{ color: WG_COLORS.cinza }}>Senha</span>
                </div>
                <div
                  className={`relative rounded-xl transition-all duration-300`}
                  style={{
                    background: WG_COLORS.cinzaClaro,
                    border:
                      focusedField === "password"
                        ? `2px solid ${WG_COLORS.laranja}`
                        : `1px solid rgba(0, 0, 0, 0.08)`,
                    boxShadow:
                      focusedField === "password"
                        ? `0 0 0 3px ${WG_COLORS.laranja}20`
                        : "none",
                  }}
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 hidden sm:block">
                    <Lock
                      className="w-5 h-5 transition-colors duration-300"
                      style={{
                        color:
                          focusedField === "password"
                            ? WG_COLORS.laranja
                            : WG_COLORS.cinza,
                      }}
                    />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Sua senha"
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => setPassword(e.target.value)}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField(null)}
                    className="w-full bg-transparent placeholder-gray-400 pr-12 py-4 rounded-xl focus:outline-none pl-4 sm:pl-12"
                    style={{ color: WG_COLORS.preto }}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: WG_COLORS.cinza }}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>

              {/* BotÍo Entrar */}
              <motion.button
                type="submit"
                disabled={isLoading}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{
                  scale: 1.02,
                  boxShadow: `0 15px 40px ${WG_COLORS.laranja}40`,
                }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-4 rounded-xl font-normal text-white flex items-center justify-center gap-2 transition-all duration-300 disabled:opacity-50"
                style={{
                  background: `linear-gradient(135deg, ${WG_COLORS.laranja}, ${WG_COLORS.laranja}DD)`,
                  boxShadow: `0 10px 30px ${WG_COLORS.laranja}30`,
                }}
              >
                {isLoading ? (
                  <LoadingSpinner />
                ) : (
                  <>
                    Entrar
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </form>

            {/* Divisor */}
            <motion.div
              className="flex items-center gap-4 my-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${WG_COLORS.cinza}40, transparent)`,
                }}
              />
              <span style={{ color: WG_COLORS.cinza }} className="text-sm">
                ou
              </span>
              <div
                className="flex-1 h-px"
                style={{
                  background: `linear-gradient(to right, transparent, ${WG_COLORS.cinza}40, transparent)`,
                }}
              />
            </motion.div>

            {/* BotÍo Google */}
            <motion.button
              onClick={loginWithGoogle}
              disabled={isLoading}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02, background: WG_COLORS.cinzaClaro }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-medium flex items-center justify-center gap-3 transition-all duration-300 disabled:opacity-50"
              style={{
                background: `${WG_COLORS.cinzaClaro}80`,
                border: `1px solid rgba(0, 0, 0, 0.08)`,
                color: WG_COLORS.preto,
              }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Entrar com Google
            </motion.button>

            {/* Link esqueci senha */}
            <motion.div
              className="text-center mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <button
                type="button"
                onClick={() => navigate('/reset-password')}
                className="text-sm transition-colors hover:underline"
                style={{ color: WG_COLORS.cinza }}
              >
                Esqueceu sua senha?
              </button>
            </motion.div>
          </div>

          {/* Footer */}
          <motion.p
            className="text-center text-xs mt-6"
            style={{ color: WG_COLORS.cinza }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            © 2026 Grupo WG Almeida. Todos os direitos reservados.
          </motion.p>
        </motion.div>

        {/* DecoraçÍo - Círculos com cores da jornada */}
        <motion.div
          className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full"
          style={{
            background: `radial-gradient(circle, ${WG_COLORS.laranja}20 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute -top-32 -right-32 w-72 h-72 rounded-full"
          style={{
            background: `radial-gradient(circle, ${WG_COLORS.arquitetura}15 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-1/4 -left-20 w-40 h-40 rounded-full"
          style={{
            background: `radial-gradient(circle, ${WG_COLORS.engenharia}12 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, 30, 0],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 -right-16 w-32 h-32 rounded-full"
          style={{
            background: `radial-gradient(circle, ${WG_COLORS.marcenaria}12 0%, transparent 70%)`,
          }}
          animate={{
            y: [0, -25, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
    </>
  );
}


