import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

interface TenantConfig {
  id: string;
  nome_empresa: string;
  config_white_label: { primary_color: string; secondary_color: string };
  modulos_ativos: string[]; // Exemplo: ["CRM", "Financeiro"]
}

interface TenantContextType {
  tenant: TenantConfig | null;
  isLoading: boolean;
  error: Error | null;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
}

export const TenantProvider = ({ children }: TenantProviderProps) => {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Get current user on mount
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id || null);
    });
    // Also check for existing session on initial load
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserId(session?.user?.id || null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Query to fetch tenant data based on the logged-in user's ID
  const { data, isLoading, error } = useQuery<TenantConfig, Error>({
    queryKey: ['tenant', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User not logged in');

      // First, get the empresa_id from the 'pessoas' table for the current user
      const { data: pessoaData, error: pessoaError } = await supabase
        .from('pessoas')
        .select('empresa_id')
        .eq('auth_user_id', userId)
        .single();

      if (pessoaError) throw pessoaError;
      if (!pessoaData?.empresa_id) throw new Error('Empresa não encontrada para o usuário.');

      // Then, use empresa_id to get the tenant details from 'saas_tenants'
      const { data: tenantData, error: tenantError } = await supabase
        .from('saas_tenants')
        .select('id, nome_empresa, config_white_label, saas_tenant_modulos(modulos(*))')
        .eq('owner_id', userId) // Assuming owner_id is the direct link for now
        .single();
      
      if (tenantError) throw tenantError;
      if (!tenantData) throw new Error('Tenant não encontrado.');

      // Flatten the modules for easier access
      const modulos_ativos = tenantData.saas_tenant_modulos.map((stm: any) => stm.modulos.slug);

      return {
        id: tenantData.id,
        nome_empresa: tenantData.nome_empresa,
        config_white_label: tenantData.config_white_label,
        modulos_ativos,
      };
    },
    enabled: !!userId, // Only run this query if a userId is available
    retry: false, // Do not retry on error, especially for 'User not logged in'
  });

  return (
    <TenantContext.Provider value={{ tenant: data || null, isLoading, error }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};


