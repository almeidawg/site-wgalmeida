import { Route, Navigate } from "react-router-dom";
import PublicRoute from "@/auth/PublicRoute";
import LoginPage from "@/auth/LoginPage";
import SignupPage from "@/auth/SignupPage";
import ConfirmEmailPage from "@/auth/ConfirmEmailPage";
import ResetPasswordPage from "@/auth/ResetPasswordPage";
import {
  SpotifyCallbackPage,
  CadastroPublicoPage,
  SolicitarPropostaPage,
  TurnKeyAltoPadraoPage,
  ApresentacaoSistemaPage,
  PropostaVisualizarPage,
  PropostaAcaoClientePage,
  AceitarServicoPage,
  AprovacaoMaterialPage,
  MoodboardClientePage,
  EVFPublicPage,
  OnboardingWizard,
  ConvitePage,
  LandingPageDinamica,
  TenantPortalPage,
} from "./lazyImports";

/**
 * Rotas públicas — acessíveis sem autenticaçÍo.
 * Inclui login, signup, reset de senha, e páginas de acesso por token.
 */
export const publicRoutes = (
  <>
    {/* LOGIN */}
    <Route
      path="/login"
      element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      }
    />
    <Route path="/auth/login" element={<Navigate to="/login" replace />} />

    {/* SIGNUP - CriaçÍo de novas contas */}
    <Route
      path="/auth/signup"
      element={
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      }
    />

    {/* RESET DE SENHA (sem autenticacao) */}
    <Route
      path="/reset-password"
      element={
        <PublicRoute>
          <ResetPasswordPage />
        </PublicRoute>
      }
    />

    {/* CONFIRMAÇÍO DE EMAIL */}
    <Route
      path="/auth/confirm-email/:token"
      element={
        <PublicRoute>
          <ConfirmEmailPage />
        </PublicRoute>
      }
    />

    {/* SPOTIFY CALLBACK (sem autenticacao) */}
    <Route
      path="/spotify-callback"
      element={
        <PublicRoute>
          <SpotifyCallbackPage />
        </PublicRoute>
      }
    />

    {/* CADASTRO PUBLICO (sem autenticacao) */}
    <Route
      path="/cadastro/:token"
      element={
        <PublicRoute>
          <CadastroPublicoPage />
        </PublicRoute>
      }
    />
    {/* Rota alternativa para cadastro publico (URLs geradas usam este path) */}
    <Route
      path="/cadastro-publico/:token"
      element={
        <PublicRoute>
          <CadastroPublicoPage />
        </PublicRoute>
      }
    />

    {/* SOLICITAR PROPOSTA - Página pública com vídeo de fundo */}
    <Route
      path="/solicite-sua-proposta"
      element={
        <PublicRoute>
          <SolicitarPropostaPage />
        </PublicRoute>
      }
    />

    {/* Landing Turn Key Google Ads */}
    <Route
      path="/turn-key/alto_padrao"
      element={
        <PublicRoute>
          <TurnKeyAltoPadraoPage />
        </PublicRoute>
      }
    />
    <Route
      path="/turn-key/alto_padrÍo"
      element={<Navigate to="/turn-key/alto_padrao" replace />}
    />

    {/* APRESENTAÇÍO DO SISTEMA - Página pública animada */}
    <Route
      path="/conheca-wgx"
      element={
        <PublicRoute>
          <ApresentacaoSistemaPage />
        </PublicRoute>
      }
    />

    {/* PROPOSTA COMPARTILHADA - Token-based public access (sem PublicRoute para nÍo redirecionar logados) */}
    <Route path="/proposta/p/:token" element={<PropostaVisualizarPage />} />

    {/* EVF COMPARTILHADO - Token-based public access (sem PublicRoute para nÍo redirecionar logados) */}
    <Route path="/evf/p/:token" element={<EVFPublicPage />} />

    {/* VISUALIZAÇÍO DE PROPOSTA - Link público para cliente aprovar/recusar (legado com ID) */}
    <Route
      path="/proposta/:id/visualizar"
      element={
        <PublicRoute>
          <PropostaVisualizarPage />
        </PublicRoute>
      }
    />

    {/* AÇÍO DO CLIENTE NA PROPOSTA - Aprovar/Recusar (público) */}
    <Route
      path="/proposta/:id/:acao"
      element={
        <PublicRoute>
          <PropostaAcaoClientePage />
        </PublicRoute>
      }
    />

    {/* ACEITAR SERVIÇO - Página pública para prestadores */}
    <Route
      path="/servico/aceitar/:token"
      element={
        <PublicRoute>
          <AceitarServicoPage />
        </PublicRoute>
      }
    />
    <Route
      path="/servico/aceitar/p/:token"
      element={
        <PublicRoute>
          <AceitarServicoPage />
        </PublicRoute>
      }
    />

    {/* APROVAÇÍO DE MATERIAL - Página pública para clientes */}
    <Route
      path="/aprovacao/material/:token"
      element={
        <PublicRoute>
          <AprovacaoMaterialPage />
        </PublicRoute>
      }
    />

    {/* MOODBOARD CLIENTE - Acesso público via token de compartilhamento */}
    <Route
      path="/moodboard/:token"
      element={
        <PublicRoute>
          <MoodboardClientePage />
        </PublicRoute>
      }
    />

    {/* ONBOARDING WIZARD - Cadastro de novos tenants */}
    <Route path="/onboarding" element={<OnboardingWizard />} />

    {/* CONVITE DE COLABORADOR - Aceitar convite por token */}
    <Route path="/convite/:token" element={<ConvitePage />} />

    {/* LANDING PAGES DINÂMICAS SAAS */}
    <Route path="/lp/:slug" element={<LandingPageDinamica />} />

    {/* PORTAL DE PARCEIROS/TENANTS — must be last (catch-all slug) */}
    <Route path="/:tenantSlug" element={<TenantPortalPage />} />
  </>
);

