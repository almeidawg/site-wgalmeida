// ============================================================
// HOOK: useConfiguracoesPagamento
// Lê/salva configurações de plataforma de pagamento + taxas de cartÍo
// do Supabase (tabela configuracoes_pagamento)
// Fall-back: localStorage("precificacao_empresa_*") para compatibilidade
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";

// ── Tipos ──────────────────────────────────────────────────
export interface TaxaCartaoItem {
  parcelas: number;
  nome: string;
  percentual: number;
}

export type PlataformaPagamento =
  | "infinitpay"
  | "asaas"
  | "stone"
  | "cielo"
  | "pagseguro"
  | "outro";

export interface ConfiguracoesPagamento {
  id?: string;
  empresa_id?: string | null;
  plataforma: PlataformaPagamento;
  taxas_cartao: TaxaCartaoItem[];
  taxa_pix: number;
  taxa_boleto: number;
}

// ── Presets por plataforma ──────────────────────────────────
export const PLATAFORMAS_INFO: Record<
  PlataformaPagamento,
  { label: string; cor: string; site: string }
> = {
  infinitpay: {
    label: "InfinitPay",
    cor: "bg-purple-100 text-purple-800",
    site: "infinitpay.com",
  },
  asaas: {
    label: "Asaas",
    cor: "bg-blue-100 text-blue-800",
    site: "asaas.com",
  },
  stone: {
    label: "Stone",
    cor: "bg-green-100 text-green-800",
    site: "stone.com.br",
  },
  cielo: {
    label: "Cielo",
    cor: "bg-yellow-100 text-yellow-800",
    site: "cielo.com.br",
  },
  pagseguro: {
    label: "PagSeguro",
    cor: "bg-orange-100 text-orange-800",
    site: "pagseguro.com.br",
  },
  outro: {
    label: "Outro / Personalizado",
    cor: "bg-gray-100 text-gray-700",
    site: "",
  },
};

const makePreset = (taxas: number[]): TaxaCartaoItem[] => [
  { parcelas: 1, nome: "Crédito à vista", percentual: taxas[0] },
  { parcelas: 2, nome: "2x", percentual: taxas[1] },
  { parcelas: 3, nome: "3x", percentual: taxas[2] },
  { parcelas: 4, nome: "4x", percentual: taxas[3] },
  { parcelas: 5, nome: "5x", percentual: taxas[4] },
  { parcelas: 6, nome: "6x", percentual: taxas[5] },
  { parcelas: 7, nome: "7x", percentual: taxas[6] },
  { parcelas: 8, nome: "8x", percentual: taxas[7] },
  { parcelas: 9, nome: "9x", percentual: taxas[8] },
  { parcelas: 10, nome: "10x", percentual: taxas[9] },
  { parcelas: 11, nome: "11x", percentual: taxas[10] },
  { parcelas: 12, nome: "12x", percentual: taxas[11] },
];

// Taxas de referência por plataforma (verificar taxas atuais no site)
export const PRESETS_PLATAFORMA: Record<PlataformaPagamento, TaxaCartaoItem[]> =
  {
    infinitpay: makePreset([
      2.19, 3.49, 4.09, 4.69, 5.29, 5.89, 6.49, 7.09, 7.69, 8.29, 8.89, 9.49,
    ]),
    asaas: makePreset([
      2.99, 4.19, 4.89, 5.59, 6.29, 6.99, 7.69, 8.39, 9.09, 9.79, 10.49,
      11.19,
    ]),
    stone: makePreset([
      1.99, 3.39, 4.09, 4.79, 5.49, 6.19, 6.89, 7.59, 8.29, 8.99, 9.69, 10.39,
    ]),
    cielo: makePreset([
      2.49, 3.89, 4.59, 5.29, 5.99, 6.69, 7.39, 8.09, 8.79, 9.49, 10.19,
      10.89,
    ]),
    pagseguro: makePreset([
      3.19, 4.49, 5.19, 5.89, 6.59, 7.29, 7.99, 8.69, 9.39, 10.09, 10.79,
      11.49,
    ]),
    outro: makePreset([
      3.15, 5.39, 6.12, 6.85, 7.57, 8.28, 8.99, 9.69, 10.38, 11.06, 11.74,
      12.4,
    ]),
  };

const TAXA_PIX_PADRAO: Record<PlataformaPagamento, number> = {
  infinitpay: 0.75,
  asaas: 0.99,
  stone: 0.75,
  cielo: 0.99,
  pagseguro: 0.99,
  outro: 0.99,
};

const TAXA_BOLETO_PADRAO: Record<PlataformaPagamento, number> = {
  infinitpay: 0,
  asaas: 1.99,
  stone: 1.5,
  cielo: 2.0,
  pagseguro: 1.99,
  outro: 1.99,
};

// ── Valores padrÍo ─────────────────────────────────────────
const CONFIG_PADRAO: ConfiguracoesPagamento = {
  plataforma: "outro",
  taxas_cartao: PRESETS_PLATAFORMA.outro,
  taxa_pix: 0.99,
  taxa_boleto: 1.99,
};

// ── Hook ───────────────────────────────────────────────────
export function useConfiguracoesPagamento(empresaId?: string | null) {
  const [config, setConfig] = useState<ConfiguracoesPagamento>(CONFIG_PADRAO);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Carregar do Supabase (ou localStorage como fallback)
  useEffect(() => {
    let cancelled = false;

    async function carregar() {
      setLoading(true);
      try {
        let query = supabase
          .from("configuracoes_pagamento")
          .select("*")
          .order("criado_em", { ascending: true })
          .limit(1);

        if (empresaId) {
          query = supabase
            .from("configuracoes_pagamento")
            .select("*")
            .eq("empresa_id", empresaId)
            .limit(1);
        }

        const { data, error } = await query;

        if (!cancelled) {
          if (!error && data && data.length > 0) {
            const row = data[0];
            setConfig({
              id: row.id,
              empresa_id: row.empresa_id,
              plataforma: (row.plataforma as PlataformaPagamento) || "outro",
              taxas_cartao: row.taxas_cartao || PRESETS_PLATAFORMA.outro,
              taxa_pix: row.taxa_pix ?? 0.99,
              taxa_boleto: row.taxa_boleto ?? 1.99,
            });
          } else {
            // Fall-back para localStorage (compatibilidade PrecificacaoPage)
            const lsKey = `precificacao_empresa_${empresaId || "global"}`;
            const lsData = localStorage.getItem(lsKey);
            if (lsData) {
              try {
                const parsed = JSON.parse(lsData);
                const cartaoItems = parsed?.itemsByTab?.cartao || [];
                if (cartaoItems.length > 0) {
                  const taxas: TaxaCartaoItem[] = cartaoItems.map(
                    (item: { nome: string; valor: number }, i: number) => ({
                      parcelas: i + 1,
                      nome: item.nome,
                      percentual: item.valor,
                    })
                  );
                  setConfig((prev) => ({ ...prev, taxas_cartao: taxas }));
                }
              } catch {
                // ignora erro de parse
              }
            }
          }
        }
      } catch {
        // mantém defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    carregar();
    return () => {
      cancelled = true;
    };
  }, [empresaId]);

  // Salvar no Supabase
  const salvar = useCallback(
    async (novaConfig: Partial<ConfiguracoesPagamento>) => {
      setSalvando(true);
      const updated = { ...config, ...novaConfig };
      try {
        const payload = {
          plataforma: updated.plataforma,
          taxas_cartao: updated.taxas_cartao,
          taxa_pix: updated.taxa_pix,
          taxa_boleto: updated.taxa_boleto,
          empresa_id: empresaId || null,
          atualizado_em: new Date().toISOString(),
        };

        let error: unknown;
        if (config.id) {
          const res = await supabase
            .from("configuracoes_pagamento")
            .update(payload)
            .eq("id", config.id);
          error = res.error;
        } else {
          const res = await supabase
            .from("configuracoes_pagamento")
            .insert(payload)
            .select()
            .single();
          error = res.error;
          if (!error && res.data) {
            updated.id = res.data.id;
          }
        }

        if (!error) {
          setConfig(updated);
          return { ok: true };
        }
        return { ok: false, error };
      } catch (err) {
        return { ok: false, error: err };
      } finally {
        setSalvando(false);
      }
    },
    [config, empresaId]
  );

  // Aplicar preset de uma plataforma
  const aplicarPreset = useCallback(
    (plataforma: PlataformaPagamento) => {
      setConfig((prev) => ({
        ...prev,
        plataforma,
        taxas_cartao: PRESETS_PLATAFORMA[plataforma],
        taxa_pix: TAXA_PIX_PADRAO[plataforma],
        taxa_boleto: TAXA_BOLETO_PADRAO[plataforma],
      }));
    },
    []
  );

  // Retorna taxa de cartÍo para N parcelas
  const getTaxaCartao = useCallback(
    (parcelas: number): number => {
      const item = config.taxas_cartao.find((t) => t.parcelas === parcelas);
      if (item) return item.percentual;
      // fallback: última taxa
      const sorted = [...config.taxas_cartao].sort(
        (a, b) => a.parcelas - b.parcelas
      );
      if (parcelas <= 1) return sorted[0]?.percentual ?? 3.15;
      if (parcelas >= 12) return sorted[sorted.length - 1]?.percentual ?? 12.4;
      return sorted.find((t) => t.parcelas === parcelas)?.percentual ?? 12.4;
    },
    [config.taxas_cartao]
  );

  return {
    config,
    setConfig,
    loading,
    salvando,
    salvar,
    aplicarPreset,
    getTaxaCartao,
    taxasCartao: config.taxas_cartao,
    plataforma: config.plataforma,
    taxaPix: config.taxa_pix,
    taxaBoleto: config.taxa_boleto,
  };
}

