import React, { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { Loader2, AlertTriangle } from "lucide-react";
import EasyRealStateDashboard from "@/pages/easy-real-state/EasyRealStateDashboard";

type TenantPortal = {
  id: string;
  nome_empresa: string;
  status: string;
  dominio: string;
  config_white_label: {
    primary_color?: string;
    secondary_color?: string;
    logo_url?: string;
    favicon_url?: string;
  } | null;
  saas_produtos: {
    nome: string;
    slug: string;
  } | null;
};

export default function TenantPortalPage() {
  const { tenantSlug } = useParams<{ tenantSlug: string }>();

  const { data: tenant, isLoading, error } = useQuery({
    queryKey: ["tenant-portal", tenantSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saas_tenants")
        .select("id, nome_empresa, status, dominio, config_white_label, saas_produtos(nome, slug)")
        .eq("dominio", tenantSlug)
        .single();
      if (error) throw error;
      return data as TenantPortal;
    },
    enabled: !!tenantSlug,
    retry: false,
  });

  // Apply white-label CSS variables
  useEffect(() => {
    if (!tenant?.config_white_label) return;
    const { primary_color, secondary_color } = tenant.config_white_label;
    if (primary_color) {
      document.documentElement.style.setProperty("--portal-primary", primary_color);
    }
    if (secondary_color) {
      document.documentElement.style.setProperty("--portal-secondary", secondary_color);
    }
    return () => {
      document.documentElement.style.removeProperty("--portal-primary");
      document.documentElement.style.removeProperty("--portal-secondary");
    };
  }, [tenant]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-gray-400" size={32} />
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 text-gray-500">
        <AlertTriangle size={40} className="text-gray-300" />
        <p className="text-lg font-medium">Portal não encontrado</p>
        <p className="text-sm">Verifique o endereço ou entre em contato.</p>
      </div>
    );
  }

  if (tenant.status === "suspenso" || tenant.status === "inativo") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 gap-3 text-gray-500">
        <AlertTriangle size={40} className="text-yellow-400" />
        <p className="text-lg font-medium">Portal temporariamente indisponível</p>
        <p className="text-sm">Entre em contato com o suporte.</p>
      </div>
    );
  }

  const wl = tenant.config_white_label || {};
  const primaryColor = wl.primary_color || "#F25C26";
  const logoUrl = wl.logo_url || "";
  const produtoSlug = tenant.saas_produtos?.slug || "";
  const produtoNome = tenant.saas_produtos?.nome || "Portal";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Branded header */}
      <header
        className="px-6 py-4 flex items-center gap-4 shadow-sm"
        style={{ backgroundColor: primaryColor }}
      >
        {logoUrl ? (
          <img src={logoUrl} alt={tenant.nome_empresa} className="h-9 object-contain" />
        ) : (
          <span className="text-white font-bold text-xl tracking-tight">
            {tenant.nome_empresa}
          </span>
        )}
        <span className="ml-auto text-white/70 text-sm font-medium">{produtoNome}</span>
      </header>

      {/* Product content */}
      <main className="flex-1">
        {produtoSlug === "easy-real-state" || produtoSlug === "easyrealstate" ? (
          <EasyRealStateDashboard />
        ) : produtoSlug === "obra-easy" || produtoSlug === "obraeasy" ? (
          <ObraEasyPortal tenantNome={tenant.nome_empresa} primaryColor={primaryColor} />
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-400">
            Produto não configurado.
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-3 text-xs text-gray-400 border-t bg-white">
        Powered by{" "}
        <span className="font-semibold" style={{ color: primaryColor }}>
          WG Build Tech
        </span>
      </footer>
    </div>
  );
}

function ObraEasyPortal({
  tenantNome,
  primaryColor,
}: {
  tenantNome: string;
  primaryColor: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-gray-500">
      <p className="text-lg font-medium">Bem-vindo ao ObraEasy — {tenantNome}</p>
      <a
        href="/login"
        className="px-6 py-2 rounded-lg text-white font-semibold shadow"
        style={{ backgroundColor: primaryColor }}
      >
        Acessar sistema
      </a>
    </div>
  );
}
