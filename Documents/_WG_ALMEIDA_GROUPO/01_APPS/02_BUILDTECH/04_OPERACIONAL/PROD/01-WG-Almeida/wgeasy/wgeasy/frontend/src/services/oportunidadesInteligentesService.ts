// ============================================================
// Oportunidades Inteligentes Service — Frontend
// Sistema WG Easy - Grupo WG Almeida
// ============================================================
// Combina:
// 1. Chamada ao backend (IA + regras avançadas)
// 2. Regras diretas via Supabase (disponível offline/sem backend)
// ============================================================

import { supabase } from "@/lib/supabaseClient";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

export type TipoOportunidade =
  | "follow_up"
  | "upsell"
  | "oportunidade_travada"
  | "revisao_proposta"
  | "cliente_frio"
  | "cross_sell"
  | "ia_sugestao";

export interface OportunidadeIdentificada {
  tipo: TipoOportunidade;
  titulo: string;
  descricao: string;
  score: number;
  urgencia: "alta" | "media" | "baixa";
  cliente_id?: string;
  cliente_nome?: string;
  oportunidade_id?: string;
  contrato_id?: string;
  nucleo?: string;
  valor_estimado?: number;
  dias_sem_atividade?: number;
  acao_sugerida: string;
  fonte: "regra" | "ia";
}

export interface OportunidadesInteligenteResult {
  empresa_id: string;
  gerado_em: string;
  total: number;
  oportunidades: OportunidadeIdentificada[];
  resumo: {
    alta_urgencia: number;
    media_urgencia: number;
    baixa_urgencia: number;
    valor_potencial_total: number;
    fonte_ia: number;
    fonte_regras: number;
  };
}

// ============================================================
// REGRAS LOCAIS (direto no Supabase, funciona sem backend)
// ============================================================

async function detectarPorRegrasLocais(_empresa_id: string
): Promise<OportunidadeIdentificada[]> {
  const oportunidades: OportunidadeIdentificada[] = [];
  const hoje = new Date();

  // REGRA 1: Oportunidades travadas >30 dias no mesmo estágio
  try {
    const limite30 = new Date(hoje.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: opsTravadas } = await supabase
      .from("oportunidades")
      .select("id, titulo, estagio, valor, cliente_id, atualizado_em")
      .neq("estagio", "fechamento")
      .lte("atualizado_em", limite30)
      .limit(8);

    for (const op of opsTravadas || []) {
      const diasParado = Math.floor(
        (hoje.getTime() - new Date(op.atualizado_em).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Busca nome do cliente
      let clienteNome = "Cliente";
      if (op.cliente_id) {
        const { data: p } = await supabase
          .from("pessoas")
          .select("nome")
          .eq("id", op.cliente_id)
          .single();
        clienteNome = p?.nome || "Cliente";
      }

      oportunidades.push({
        tipo: "oportunidade_travada",
        titulo: `Oportunidade parada: ${op.titulo || "Sem título"}`,
        descricao: `Esta oportunidade está em "${op.estagio}" há ${diasParado} dias sem nenhuma atualizaçÍo.`,
        score: diasParado > 60 ? 75 : 45,
        urgencia: diasParado > 60 ? "alta" : "media",
        cliente_id: op.cliente_id,
        cliente_nome: clienteNome,
        oportunidade_id: op.id,
        valor_estimado: op.valor,
        dias_sem_atividade: diasParado,
        acao_sugerida: "Atualizar o status ou registrar contato realizado com o cliente",
        fonte: "regra",
      });
    }
  } catch { /* silencia */ }

  // REGRA 2: Contratos finalizados recentemente (upsell)
  try {
    const limite90 = new Date(hoje.getTime() - 90 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    const { data: contratosFin } = await supabase
      .from("contratos")
      .select("id, titulo, cliente_id, valor_total, unidade_negocio, updated_at")
      .in("status", ["concluido", "finalizado"])
      .gte("updated_at", limite90)
      .limit(8);

    for (const c of contratosFin || []) {
      const { data: opsAbertas } = await supabase
        .from("oportunidades")
        .select("id")
        .eq("cliente_id", c.cliente_id)
        .neq("estagio", "fechamento")
        .limit(1);

      if (!opsAbertas || opsAbertas.length === 0) {
        let clienteNome = "Cliente";
        if (c.cliente_id) {
          const { data: p } = await supabase
            .from("pessoas")
            .select("nome")
            .eq("id", c.cliente_id)
            .single();
          clienteNome = p?.nome || "Cliente";
        }

        oportunidades.push({
          tipo: "upsell",
          titulo: `Upsell: ${clienteNome} finalizou projeto`,
          descricao: `O contrato "${c.titulo}" foi concluído recentemente. Boa oportunidade para novo projeto ou indicaçÍo.`,
          score: 70,
          urgencia: "alta",
          cliente_id: c.cliente_id,
          cliente_nome: clienteNome,
          contrato_id: c.id,
          nucleo: c.unidade_negocio,
          valor_estimado: c.valor_total ? c.valor_total * 0.5 : undefined,
          acao_sugerida: "Agendar visita pós-obra e apresentar serviços complementares",
          fonte: "regra",
        });
      }
    }
  } catch { /* silencia */ }

  // REGRA 3: Clientes ativos em só 1 núcleo (cross-sell)
  try {
    const { data: contratosAtivos } = await supabase
      .from("contratos")
      .select("cliente_id, unidade_negocio")
      .in("status", ["ativo", "em_execucao", "em_andamento", "assinado"])
      .limit(100);

    const clienteNucleos: Record<string, Set<string>> = {};
    for (const c of contratosAtivos || []) {
      if (!c.unidade_negocio || !c.cliente_id) continue;
      if (!clienteNucleos[c.cliente_id]) clienteNucleos[c.cliente_id] = new Set();
      clienteNucleos[c.cliente_id].add(c.unidade_negocio);
    }

    const todosNucleos = ["Arquitetura", "Engenharia", "Marcenaria"];
    for (const [clienteId, nucleosAtivos] of Object.entries(clienteNucleos).slice(0, 5)) {
      const faltando = todosNucleos.filter((n) => !nucleosAtivos.has(n));
      if (faltando.length > 0 && faltando.length < 3) {
        const { data: p } = await supabase
          .from("pessoas")
          .select("nome")
          .eq("id", clienteId)
          .single();
        const clienteNome = p?.nome || "Cliente";

        oportunidades.push({
          tipo: "cross_sell",
          titulo: `Cross-sell ${faltando[0]}: ${clienteNome}`,
          descricao: `${clienteNome} tem contrato ativo em ${[...nucleosAtivos].join(", ")} mas nunca contratou ${faltando[0]}.`,
          score: 55,
          urgencia: "baixa",
          cliente_id: clienteId,
          cliente_nome: clienteNome,
          nucleo: faltando[0],
          acao_sugerida: `Apresentar portfólio de ${faltando[0]} durante a próxima interaçÍo`,
          fonte: "regra",
        });
      }
    }
  } catch { /* silencia */ }

  return oportunidades;
}

// ============================================================
// CHAMADA AO BACKEND (IA + regras avançadas)
// ============================================================

async function buscarDoBackend(empresa_id: string): Promise<OportunidadesInteligenteResult | null> {
  if (!BACKEND_URL || !INTERNAL_API_KEY) return null;

  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;

    const response = await fetch(`${BACKEND_URL}/api/oportunidades/inteligentes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
        "x-internal-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({ empresa_id }),
      signal: AbortSignal.timeout(15000), // timeout 15s
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

// ============================================================
// FUNÇÍO PRINCIPAL
// ============================================================

export async function identificarOportunidadesInteligentes(
  empresa_id: string
): Promise<OportunidadesInteligenteResult> {
  // Tenta backend primeiro (IA + regras completas)
  const resultadoBackend = await buscarDoBackend(empresa_id);
  if (resultadoBackend && resultadoBackend.total > 0) {
    return resultadoBackend;
  }

  // Fallback: regras locais via Supabase
  const porRegras = await detectarPorRegrasLocais(empresa_id);
  porRegras.sort((a, b) => b.score - a.score);

  const valorTotal = porRegras.reduce((acc, o) => acc + (o.valor_estimado || 0), 0);

  return {
    empresa_id,
    gerado_em: new Date().toISOString(),
    total: porRegras.length,
    oportunidades: porRegras,
    resumo: {
      alta_urgencia: porRegras.filter((o) => o.urgencia === "alta").length,
      media_urgencia: porRegras.filter((o) => o.urgencia === "media").length,
      baixa_urgencia: porRegras.filter((o) => o.urgencia === "baixa").length,
      valor_potencial_total: valorTotal,
      fonte_ia: 0,
      fonte_regras: porRegras.length,
    },
  };
}

// ============================================================
// HELPERS
// ============================================================

export const ICONES_TIPO: Record<TipoOportunidade, string> = {
  follow_up: "📞",
  upsell: "🚀",
  oportunidade_travada: "⏸️",
  revisao_proposta: "📝",
  cliente_frio: "❄️",
  cross_sell: "🔗",
  ia_sugestao: "🤖",
};

export const LABELS_TIPO: Record<TipoOportunidade, string> = {
  follow_up: "Follow-up",
  upsell: "Upsell",
  oportunidade_travada: "Oportunidade Travada",
  revisao_proposta: "RevisÍo de Proposta",
  cliente_frio: "Cliente Frio",
  cross_sell: "Cross-sell",
  ia_sugestao: "SugestÍo IA",
};

export function formatarValorEstimado(valor?: number): string {
  if (!valor) return "";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  }).format(valor);
}

