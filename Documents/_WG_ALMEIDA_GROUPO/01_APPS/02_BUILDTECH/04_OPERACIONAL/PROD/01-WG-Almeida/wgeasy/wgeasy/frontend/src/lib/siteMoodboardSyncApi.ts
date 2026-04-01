/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API: SincronizaçÍo Site <-> WG Easy (Moodboard)
// Sistema WG Easy 2026 - Grupo WG Almeida
// Importa e sincroniza moodboards criados no site
// ============================================================

import { supabase } from "@/lib/supabaseClient";
import type { MoodboardCliente, PaletaCliente as ClientePaleta } from "@/types/moodboardCliente";

// ============================================================
// TIPOS DO SITE
// ============================================================

/**
 * Estrutura do moodboard salvo no localStorage do site
 */
interface SiteMoodboardData {
  id: string;
  cores: {
    hex: string;
    nome?: string;
    fonte?: "suvinil" | "custom" | "ai";
  }[];
  estilos: string[];
  referencias: {
    url: string;
    descricao?: string;
  }[];
  email?: string;
  telefone?: string;
  nome?: string;
  created_at: string;
  updated_at: string;
}

interface ImportResult {
  sucesso: boolean;
  moodboard_id?: string;
  paleta_id?: string;
  mensagem: string;
  ja_existia?: boolean;
}

// ============================================================
// FUNÇÕES DE SINCRONIZAÇÍO
// ============================================================

/**
 * Buscar moodboards pendentes de sincronizaçÍo do site
 * (moodboards que foram criados no site mas ainda não vinculados a um cliente)
 */
export async function buscarMoodboardsPendentesSite(): Promise<SiteMoodboardData[]> {
  // Em um cenário real, isso seria uma tabela temporária ou fila
  // Por enquanto, retornamos vazio pois dependemos do site enviar os dados
  const { data, error } = await supabase
    .from("site_moodboards_pendentes")
    .select("*")
    .eq("sincronizado", false)
    .order("created_at", { ascending: false });

  if (error && error.code !== "42P01") throw error; // 42P01 = table doesn't exist
  return (data || []) as unknown as SiteMoodboardData[];
}

/**
 * Importar moodboard do site para o sistema
 */
export async function importarMoodboardDoSite(
  siteMoodboard: SiteMoodboardData,
  clienteId: string,
  contratoId?: string
): Promise<ImportResult> {
  try {
    // Verificar se já existe moodboard com esse ID do site
    const { data: existente } = await supabase
      .from("cliente_moodboards")
      .select("id")
      .eq("site_moodboard_id", siteMoodboard.id)
      .single();

    if (existente) {
      return {
        sucesso: true,
        moodboard_id: existente.id,
        mensagem: "Moodboard já sincronizado anteriormente",
        ja_existia: true,
      };
    }

    // Criar paleta de cores
    let paletaId: string | null = null;
    if (siteMoodboard.cores && siteMoodboard.cores.length > 0) {
      const { data: paleta, error: paletaError } = await supabase
        .from("cliente_paletas")
        .insert({
          cliente_id: clienteId,
          nome: "Paleta do Site",
          cores: siteMoodboard.cores,
          is_favorita: true,
          origem: "site",
        })
        .select()
        .single();

      if (paletaError) throw paletaError;
      paletaId = paleta.id;
    }

    // Criar moodboard
    const { data: moodboard, error: moodboardError } = await supabase
      .from("cliente_moodboards")
      .insert({
        cliente_id: clienteId,
        contrato_id: contratoId,
        titulo: "Moodboard do Site",
        descricao: "Importado automaticamente do site wgalmeida.com.br",
        paleta_id: paletaId,
        estilos: siteMoodboard.estilos || [],
        imagens_referencia: siteMoodboard.referencias || [],
        status: "rascunho",
        origem: "site",
        site_moodboard_id: siteMoodboard.id,
      })
      .select()
      .single();

    if (moodboardError) throw moodboardError;

    // Marcar como sincronizado na tabela do site (se existir)
    await supabase
      .from("site_moodboards_pendentes")
      .update({ sincronizado: true, moodboard_id: moodboard.id })
      .eq("site_id", siteMoodboard.id);

    return {
      sucesso: true,
      moodboard_id: moodboard.id,
      paleta_id: paletaId || undefined,
      mensagem: "Moodboard importado com sucesso",
      ja_existia: false,
    };
  } catch (error) {
    console.error("Erro ao importar moodboard do site:", error);
    return {
      sucesso: false,
      mensagem: `Erro ao importar: ${(error as Error).message}`,
    };
  }
}

/**
 * Buscar cliente por email ou telefone (para vincular moodboard do site)
 */
export async function buscarClientePorContato(
  email?: string,
  telefone?: string
): Promise<{ id: string; nome: string } | null> {
  if (!email && !telefone) return null;

  let query = supabase.from("pessoas").select("id, nome").eq("tipo", "CLIENTE");

  if (email) {
    query = query.eq("email", email);
  } else if (telefone) {
    // Limpar telefone para busca
    const telLimpo = telefone.replace(/\D/g, "");
    query = query.or(`telefone.ilike.%${telLimpo}%,celular.ilike.%${telLimpo}%`);
  }

  const { data, error } = await query.limit(1).single();

  if (error && error.code !== "PGRST116") throw error;
  return data as { id: string; nome: string } | null;
}

/**
 * Sincronizar moodboard quando cliente fecha contrato
 */
export async function sincronizarAoFecharContrato(
  contratoId: string,
  clienteId: string,
  clienteEmail?: string,
  clienteTelefone?: string
): Promise<ImportResult> {
  try {
    // Buscar moodboards pendentes do site para este cliente
    const { data: pendentes, error } = await supabase
      .from("site_moodboards_pendentes")
      .select("*")
      .eq("sincronizado", false)
      .or(`email.eq.${clienteEmail},telefone.ilike.%${clienteTelefone?.replace(/\D/g, "")}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error && error.code !== "42P01") throw error;

    if (!pendentes || pendentes.length === 0) {
      return {
        sucesso: true,
        mensagem: "Nenhum moodboard pendente do site encontrado",
      };
    }

    // Importar o moodboard mais recente
    const siteMoodboard = pendentes[0] as unknown as SiteMoodboardData;
    return await importarMoodboardDoSite(siteMoodboard, clienteId, contratoId);
  } catch (error) {
    console.error("Erro na sincronizaçÍo ao fechar contrato:", error);
    return {
      sucesso: false,
      mensagem: `Erro: ${(error as Error).message}`,
    };
  }
}

/**
 * Verificar se cliente tem moodboard do site para importar
 */
export async function verificarMoodboardSitePendente(
  email?: string,
  telefone?: string
): Promise<boolean> {
  if (!email && !telefone) return false;

  try {
    let query = supabase
      .from("site_moodboards_pendentes")
      .select("id")
      .eq("sincronizado", false);

    if (email) {
      query = query.eq("email", email);
    } else if (telefone) {
      const telLimpo = telefone.replace(/\D/g, "");
      query = query.ilike("telefone", `%${telLimpo}%`);
    }

    const { data, error } = await query.limit(1);

    if (error && error.code !== "42P01") return false;
    return !!data && data.length > 0;
  } catch {
    return false;
  }
}

/**
 * Merge de moodboards: combinar moodboard do site com um existente
 */
export async function mergeMoodboards(
  moodboardDestinoId: string,
  siteMoodboard: SiteMoodboardData
): Promise<{ sucesso: boolean; mensagem: string }> {
  try {
    // Buscar moodboard destino
    const { data: destino, error: fetchError } = await supabase
      .from("cliente_moodboards")
      .select("*, paleta:cliente_paletas!paleta_id(*)")
      .eq("id", moodboardDestinoId)
      .single();

    if (fetchError) throw fetchError;

    // Merge de estilos (sem duplicatas)
    const estilosMerged = [
      ...new Set([...(destino.estilos || []), ...(siteMoodboard.estilos || [])]),
    ];

    // Merge de referências
    const referenciasMerged = [
      ...(destino.imagens_referencia || []),
      ...(siteMoodboard.referencias || []),
    ];

    // Atualizar moodboard
    const { error: updateError } = await supabase
      .from("cliente_moodboards")
      .update({
        estilos: estilosMerged,
        imagens_referencia: referenciasMerged,
        site_moodboard_id: siteMoodboard.id,
      })
      .eq("id", moodboardDestinoId);

    if (updateError) throw updateError;

    // Merge de cores na paleta
    if (destino.paleta && siteMoodboard.cores) {
      const coresMerged = [
        ...(destino.paleta.cores || []),
        ...siteMoodboard.cores.filter(
          (c: { hex: string }) => !destino.paleta.cores?.some((p: { hex: string }) => p.hex === c.hex)
        ),
      ];

      await supabase
        .from("cliente_paletas")
        .update({ cores: coresMerged })
        .eq("id", destino.paleta.id);
    }

    return {
      sucesso: true,
      mensagem: "Moodboards combinados com sucesso",
    };
  } catch (error) {
    console.error("Erro ao combinar moodboards:", error);
    return {
      sucesso: false,
      mensagem: `Erro: ${(error as Error).message}`,
    };
  }
}

// ============================================================
// WEBHOOK HANDLER (para receber dados do site)
// ============================================================

/**
 * Handler para webhook do site quando moodboard é salvo
 * Isso seria chamado por uma Edge Function do Supabase
 */
export async function handleSiteMoodboardWebhook(
  payload: SiteMoodboardData
): Promise<{ success: boolean; message: string }> {
  try {
    // Salvar na tabela de pendentes
    const { error } = await supabase.from("site_moodboards_pendentes").upsert(
      {
        site_id: payload.id,
        dados: payload,
        email: payload.email,
        telefone: payload.telefone,
        nome: payload.nome,
        sincronizado: false,
        created_at: payload.created_at,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "site_id" }
    );

    if (error) throw error;

    // Tentar vincular automaticamente se tiver email/telefone
    if (payload.email || payload.telefone) {
      const cliente = await buscarClientePorContato(payload.email, payload.telefone);
      if (cliente) {
        // Buscar contrato ativo do cliente
        const { data: contrato } = await supabase
          .from("contratos")
          .select("id")
          .eq("cliente_id", cliente.id)
          .in("status", ["em_andamento", "em_execucao"])
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        // Importar automaticamente
        await importarMoodboardDoSite(payload, cliente.id, contrato?.id);
      }
    }

    return { success: true, message: "Moodboard recebido e processado" };
  } catch (error) {
    console.error("Erro no webhook:", error);
    return { success: false, message: (error as Error).message };
  }
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Gerar link de compartilhamento do moodboard
 */
export function gerarLinkCompartilhamento(shareToken: string): string {
  // Em produçÍo, usar URL real do site
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://wgalmeida.com.br";
  return `${baseUrl}/moodboard/${shareToken}`;
}

/**
 * Validar estrutura de moodboard do site
 */
export function validarMoodboardSite(data: unknown): data is SiteMoodboardData {
  if (!data || typeof data !== "object") return false;

  const mb = data as Record<string, unknown>;
  return (
    typeof mb.id === "string" &&
    Array.isArray(mb.cores) &&
    typeof mb.created_at === "string"
  );
}



