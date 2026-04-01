import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/lib/supabaseClient";

interface TenantConfig {
  id: string;
  nome_empresa: string;
  config_white_label: {
    primary_color: string;
    secondary_color: string;
    logo_url?: string;
  };
}

interface TenantContextData {
  tenant: TenantConfig | null;
  loading: boolean;
  setTenantOverride: (tenant: any) => void;
}

const TenantContext = createContext<TenantContextData>({} as TenantContextData);

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);

  const applyTheme = (config: any) => {
    if (config.primary_color) {
      document.documentElement.style.setProperty("--primary", config.primary_color);
      document.documentElement.style.setProperty("--wg-orange", config.primary_color); // Compatibilidade legado
    }
    if (config.secondary_color) {
      document.documentElement.style.setProperty("--secondary", config.secondary_color);
    }
  };

  const setTenantOverride = (newTenant: any) => {
    setTenant(newTenant);
    if (newTenant?.config_white_label) {
      applyTheme(newTenant.config_white_label);
    }
  };

  useEffect(() => {
    async function loadTenant() {
      try {
        const hostname = window.location.hostname;
        
        // No desenvolvimento, simulamos um domínio se estiver em localhost
        const domainToSearch = hostname === "localhost" ? "will.hub.com.br" : hostname;

        const { data, error } = await supabase
          .from("saas_tenants")
          .select("id, nome_empresa, config_white_label")
          .eq("dominio_personalizado", domainToSearch)
          .maybeSingle();

        if (data && !error) {
          setTenant(data as any);
          applyTheme(data.config_white_label);
        }
      } catch (err) {
        console.error("Erro ao carregar tenant:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, []);

  return (
    <TenantContext.Provider value={{ tenant, loading, setTenantOverride }}>
      {children}
    </TenantContext.Provider>
  );
}

export const useTenant = () => useContext(TenantContext);
