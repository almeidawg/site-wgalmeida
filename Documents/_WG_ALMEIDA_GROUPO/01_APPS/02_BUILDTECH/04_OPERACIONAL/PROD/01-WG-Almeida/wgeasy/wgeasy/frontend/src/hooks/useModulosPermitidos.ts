// src/hooks/useModulosPermitidos.ts
// Hook para carregar módulos permitidos baseado nas permissões do banco E do plano do Tenant

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUsuarioLogado } from "./useUsuarioLogado";
import { usePreviewTipoUsuario } from "./usePreviewTipoUsuario";
import { useTenant } from "./useTenant";

// Normaliza string removendo acentos e convertendo para minúsculas
function normalizar(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export interface ModuloPermitido {
  codigo: string;
  nome: string;
  secao: string;
  path: string | null;
  pode_visualizar: boolean;
  status_saas?: string; // ativo, bloqueado, trial
}

interface UseModulosPermitidosReturn {
  modulos: ModuloPermitido[];
  loading: boolean;
  podeVerModulo: (codigoOuPath: string) => boolean;
  podeVerSecao: (secao: string) => boolean;
  recarregar: () => Promise<void>;
}

export function useModulosPermitidos(): UseModulosPermitidosReturn {
  const [modulos, setModulos] = useState<ModuloPermitido[]>([]);
  const [loading, setLoading] = useState(true);
  const { usuario, isMaster } = useUsuarioLogado();
  const { previewTipo, isPreviewMode } = usePreviewTipoUsuario();
  const { tenant } = useTenant();

  // Tipo efetivo: se em preview, usa o tipo de preview
  const tipoEfetivo = isPreviewMode ? previewTipo : usuario?.tipo_usuario;

  const carregarModulos = useCallback(async () => {
    if (!tipoEfetivo) {
      setModulos([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Buscar permissões base do Tipo de Usuário
      const { data: permUser, error: errUser } = await supabase
        .from("permissoes_tipo_usuario")
        .select(`
          pode_visualizar,
          sistema_modulos:modulo_id ( id, codigo, nome, secao, path, ativo )
        `)
        .eq("tipo_usuario", tipoEfetivo);

      if (errUser) throw errUser;

      // 2. Se for um Tenant SaaS (não é o Master), buscar permissões da EMPRESA
      let modulosSaaS: any[] = [];
      if (tipoEfetivo !== "MASTER" && tenant?.id) {
        const { data } = await supabase
          .from("saas_tenant_modulos")
          .select("modulo_id, status")
          .eq("tenant_id", tenant.id);
        modulosSaaS = data || [];
      }

      // 3. Cruzar dados: Usuário pode ver + Empresa tem contratado
      const permitidos = (permUser || [])
        .filter((p: any) => p.pode_visualizar && p.sistema_modulos?.ativo)
        .map((p: any) => {
          const modSaaS = modulosSaaS.find(ms => ms.modulo_id === p.sistema_modulos.id);
          
          // Se não for Master e não tiver registro na saas_tenant_modulos, assumimos bloqueado por padrÍo (Segurança First)
          const statusSaaS = tipoEfetivo === "MASTER" ? "ativo" : (modSaaS?.status || "bloqueado");

          return {
            codigo: p.sistema_modulos.codigo,
            nome: p.sistema_modulos.nome,
            secao: p.sistema_modulos.secao,
            path: p.sistema_modulos.path,
            pode_visualizar: statusSaaS !== "bloqueado", // Regra de Ouro: Só visualiza se contratado ou trial
            status_saas: statusSaaS
          };
        });

      setModulos(permitidos);
    } catch (err) {
      console.error("[useModulosPermitidos] Erro fatal:", err);
      setModulos([]);
    } finally {
      setLoading(false);
    }
  }, [tipoEfetivo, tenant?.id, isPreviewMode]);

  useEffect(() => {
    carregarModulos();
  }, [carregarModulos]);

  // Resto do componente (podeVerModulo, podeVerSecao) continua igual, 
  // mas agora ele usa o array 'modulos' já filtrado pela regra SaaS.
  
  const podeVerModulo = useCallback(
    (codigoOuPath: string): boolean => {
      if (isMaster && !isPreviewMode) return true;
      return modulos.some(
        (m) =>
          m.pode_visualizar &&
          (m.codigo === codigoOuPath ||
            m.path === codigoOuPath ||
            (m.path && codigoOuPath.startsWith(m.path)))
      );
    },
    [modulos, isMaster, isPreviewMode]
  );

  const podeVerSecao = useCallback(
    (secao: string): boolean => {
      if (isMaster && !isPreviewMode) return true;
      const secaoNorm = normalizar(secao);
      return modulos.some(
        (m) =>
          m.pode_visualizar &&
          normalizar(m.secao) === secaoNorm
      );
    },
    [modulos, isMaster, isPreviewMode]
  );

  return {
    modulos,
    loading,
    podeVerModulo,
    podeVerSecao,
    recarregar: carregarModulos,
  };
}


