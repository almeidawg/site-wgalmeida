// src/layout/MainLayout.tsx
import { useState, useCallback } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "@/components/sidebar/Sidebar";
import Topbar from "@/layout/Topbar";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
import { usePreviewTipoUsuario, LABELS_TIPO_USUARIO } from "@/hooks/usePreviewTipoUsuario";
import { Eye, X, Loader2 } from "lucide-react"; // Adicionado Loader2
import OnboardingWelcome from "@/components/layout/OnboardingWelcome";
import { TrialBanner } from "@/components/layout/TrialBanner";
import { useAppStore } from "@/store/useAppStore";
import { useUsuarioLogado } from "@/hooks/useUsuarioLogado";
import { usePlano } from "@/hooks/usePlano";
import { useTenant } from "@/hooks/useTenant"; // Importar useTenant
import "@/styles/mobile-nav.css";

const SIDEBAR_COLLAPSED_KEY = "wg-sidebar-collapsed";

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(getInitialCollapsed);
  const { previewTipo, isPreviewMode, stopPreview } = usePreviewTipoUsuario();
  const navigate = useNavigate();
  const { tenant, isLoading: isLoadingTenant } = useTenant(); // Usar o hook useTenant

  // Estado global de UI do Zustand (permanece o mesmo)
  const _notificacoesNaoLidas = useAppStore((s) =>
    s.notificacoes.filter((n) => !n.lida).length
  );

  // DetecçÍo de Trial (permanece o mesmo)
  const { usuario } = useUsuarioLogado();
  const orgId = usuario?.empresa_id ?? null;
  const { assinatura, estaEmTrial, diasRestantesTrial } = usePlano(orgId);

  const toggleSidebar = () => setSidebarOpen((v) => !v);
  const closeSidebar = () => setSidebarOpen(false);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Se o tenant ainda está carregando, exibe um loader ou tela de espera
  if (isLoadingTenant) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#FAFAFA]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-[#F25C26] animate-spin" />
          <p className="text-sm text-gray-500">Carregando dados da sua empresa...</p>
        </div>
      </div>
    );
  }

  // Definir variáveis CSS customizadas para white-label
  const customCssVars = {
    '--wg-primary': tenant?.config_white_label?.primary_color || '#F25C26',
    '--wg-secondary': tenant?.config_white_label?.secondary_color || '#2B4580',
    // Adicione outras variáveis CSS conforme necessário
  } as React.CSSProperties; // Type assertion for custom properties

  return (
    <div className="layout" style={customCssVars}>
      {/* TRIAL BANNER — exibe quando em período de avaliaçÍo */}
      {estaEmTrial && (
        <TrialBanner
          assinatura={assinatura}
          diasRestantes={diasRestantesTrial}
          organizacaoId={orgId ?? undefined}
        />
      )}

      {/* BANNER GLOBAL DE PREVIEW MODE */}
      {isPreviewMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-amber-500 text-white px-4 py-2 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-medium">
              Modo Preview: Visualizando como {LABELS_TIPO_USUARIO[previewTipo!]}
            </span>
          </div>
          <button
            onClick={() => {
              stopPreview();
              navigate("/sistema/planta");
            }}
            className="flex items-center gap-1 bg-amber-600 hover:bg-amber-700 px-3 py-1 rounded text-sm font-medium transition-colors"
          >
            <X className="w-4 h-4" />
            Sair do Preview
          </button>
        </div>
      )}

      {/* SIDEBAR - Desktop only */}
      <Sidebar
        open={sidebarOpen}
        onToggle={toggleSidebar}
        collapsed={sidebarCollapsed}
        onToggleCollapse={toggleCollapse}
      />

      {/* AREA PRINCIPAL */}
      <div className={`layout-main ${isPreviewMode ? "pt-10" : ""}`}>
        <Topbar />
        {/* Tabs agora estÍo integradas no Topbar */}
        <main
          className="layout-content"
          style={{ paddingTop: "8px", paddingBottom: "80px" }}
        >
          <Outlet />
        </main>
      </div>

      {/* OVERLAY MOBILE - Sidebar */}
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={closeSidebar}
          aria-hidden="true"
        />
      )}

      {/* MOBILE BOTTOM NAV */}
      <MobileBottomNav />

      {/* ONBOARDING (aparece automaticamente para novos usuários Admin/Master) */}
      <OnboardingWelcome />
    </div>
  );
}

