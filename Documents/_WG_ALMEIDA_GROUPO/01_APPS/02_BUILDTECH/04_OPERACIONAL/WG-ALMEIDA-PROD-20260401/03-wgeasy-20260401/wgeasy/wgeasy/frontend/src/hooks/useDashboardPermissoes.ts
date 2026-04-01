// src/hooks/useDashboardPermissoes.ts
// Hook para verificar permissões de componentes do Dashboard

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useUsuarioLogado } from "./useUsuarioLogado";

export interface DashboardPermissoes {
  dashFinanceiro: boolean;
  dashContratosAtivos: boolean;
  dashContratosConcluidos: boolean;
  dashDespesasNucleo: boolean;
  dashGraficoFinanceiro: boolean;
  dashChecklistCeo: boolean;
  dashMencoes: boolean;
  dashAlertas: boolean;
  dashAgenda: boolean;
  dashFraseMotivacional: boolean;
  dashNucleoArquitetura: boolean;
  dashNucleoEngenharia: boolean;
  dashNucleoMarcenaria: boolean;
  dashNucleoDesigner: boolean;
}

const PERMISSOES_PADRAO: DashboardPermissoes = {
  dashFinanceiro: false,
  dashContratosAtivos: false,
  dashContratosConcluidos: false,
  dashDespesasNucleo: false,
  dashGraficoFinanceiro: false,
  dashChecklistCeo: false,
  dashMencoes: false,
  dashAlertas: false,
  dashAgenda: false,
  dashFraseMotivacional: false,
  dashNucleoArquitetura: false,
  dashNucleoEngenharia: false,
  dashNucleoMarcenaria: false,
  dashNucleoDesigner: false,
};

// Mapeamento de código do módulo para chave da permissÍo
const CODIGO_PARA_CHAVE: Record<string, keyof DashboardPermissoes> = {
  "dash-financeiro": "dashFinanceiro",
  "dash-contratos-ativos": "dashContratosAtivos",
  "dash-contratos-concluidos": "dashContratosConcluidos",
  "dash-despesas-nucleo": "dashDespesasNucleo",
  "dash-grafico-financeiro": "dashGraficoFinanceiro",
  "dash-checklist-ceo": "dashChecklistCeo",
  "dash-mencoes": "dashMencoes",
  "dash-alertas": "dashAlertas",
  "dash-agenda": "dashAgenda",
  "dash-frase-motivacional": "dashFraseMotivacional",
  "dash-nucleo-arquitetura": "dashNucleoArquitetura",
  "dash-nucleo-engenharia": "dashNucleoEngenharia",
  "dash-nucleo-marcenaria": "dashNucleoMarcenaria",
  "dash-nucleo-designer": "dashNucleoDesigner",
};

export function useDashboardPermissoes() {
  const { usuario, isMaster, loading: loadingUsuario } = useUsuarioLogado();
  const [permissoes, setPermissoes] = useState<DashboardPermissoes>(PERMISSOES_PADRAO);
  const [loading, setLoading] = useState(true);

  const carregarPermissoes = useCallback(async () => {
    if (!usuario?.auth_user_id) {
      setLoading(false);
      return;
    }

    // MASTER sempre tem todas as permissões
    if (isMaster) {
      setPermissoes({
        dashFinanceiro: true,
        dashContratosAtivos: true,
        dashContratosConcluidos: true,
        dashDespesasNucleo: true,
        dashGraficoFinanceiro: true,
        dashChecklistCeo: true,
        dashMencoes: true,
        dashAlertas: true,
        dashAgenda: true,
        dashFraseMotivacional: true,
        dashNucleoArquitetura: true,
        dashNucleoEngenharia: true,
        dashNucleoMarcenaria: true,
        dashNucleoDesigner: true,
      });
      setLoading(false);
      return;
    }

    try {
      // Buscar módulos do dashboard permitidos para o usuário
      const { data, error } = await supabase.rpc("listar_modulos_permitidos", {
        p_auth_user_id: usuario.auth_user_id,
      });

      if (error) {
        console.error("[useDashboardPermissoes] Erro ao carregar:", error);
        setLoading(false);
        return;
      }

      const novasPermissoes = { ...PERMISSOES_PADRAO };

      // Processar permissões retornadas
      for (const modulo of data || []) {
        const chave = CODIGO_PARA_CHAVE[modulo.codigo];
        if (chave && modulo.pode_visualizar) {
          novasPermissoes[chave] = true;
        }
      }

      setPermissoes(novasPermissoes);
    } catch (err) {
      console.error("[useDashboardPermissoes] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [usuario?.auth_user_id, isMaster]);

  useEffect(() => {
    if (!loadingUsuario) {
      carregarPermissoes();
    }
  }, [loadingUsuario, carregarPermissoes]);

  return {
    permissoes,
    loading: loading || loadingUsuario,
    recarregar: carregarPermissoes,
  };
}

export default useDashboardPermissoes;

