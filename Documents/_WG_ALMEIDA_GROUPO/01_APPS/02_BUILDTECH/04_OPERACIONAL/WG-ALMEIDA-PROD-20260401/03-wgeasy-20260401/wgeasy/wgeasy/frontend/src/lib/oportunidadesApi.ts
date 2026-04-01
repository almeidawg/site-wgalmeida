// src/lib/oportunidadesApi.ts
import { supabase } from "@/lib/supabaseClient";

export type EstagioOportunidade =
  | "qualificacao"
  | "proposta"
  | "negociacao"
  | "fechamento";

export type StatusOportunidade =
  | "novo"
  | "em_andamento"
  | "proposta_enviada"
  | "negociacao"
  | "ganho"
  | "perdido"
  | "cancelado";

export interface Oportunidade {
  id: string;
  titulo: string;
  cliente_id: string;
  descricao?: string | null;
  valor: number | null;
  moeda?: string;
  estagio: EstagioOportunidade | null;
  status: StatusOportunidade;
  origem: string | null;
  responsavel_id: string | null;
  data_abertura?: string;
  data_fechamento_prevista: string | null;
  data_fechamento_real?: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
  pessoas?: { nome: string } | null;
}

export async function listarOportunidades(): Promise<Oportunidade[]> {
  // PaginaçÍo automática (contorna limite 1000 rows Supabase)
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data: pageData, error } = await supabase
      .from("oportunidades")
      .select("*")
      .order("criado_em", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = pageData ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  const data = allData;

  // Buscar nomes dos clientes manualmente
  if (data && data.length > 0) {
    const clienteIds = data.map(o => o.cliente_id).filter(Boolean);
    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase
        .from("pessoas")
        .select("id, nome")
        .in("id", clienteIds);

      const clientesMap = new Map(clientes?.map(c => [c.id, c]) || []);
      return data.map(o => ({
        ...o,
        pessoas: o.cliente_id ? clientesMap.get(o.cliente_id) : null
      })) as any;
    }
  }

  return data as any;
}

export async function listarOportunidadesPorEstagio(estagio: EstagioOportunidade) {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("estagio", estagio)
    .order("criado_em", { ascending: false });

  if (error) throw error;

  // Buscar nomes dos clientes manualmente
  if (data && data.length > 0) {
    const clienteIds = data.map(o => o.cliente_id).filter(Boolean);
    if (clienteIds.length > 0) {
      const { data: clientes } = await supabase
        .from("pessoas")
        .select("id, nome")
        .in("id", clienteIds);

      const clientesMap = new Map(clientes?.map(c => [c.id, c]) || []);
      return data.map(o => ({
        ...o,
        pessoas: o.cliente_id ? clientesMap.get(o.cliente_id) : null
      })) as any;
    }
  }

  return data as any;
}

export async function buscarOportunidade(id: string): Promise<Oportunidade> {
  const { data, error } = await supabase
    .from("oportunidades")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;

  // Buscar nome do cliente manualmente
  if (data && data.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("id", data.cliente_id)
      .single();

    return {
      ...data,
      pessoas: cliente
    } as any;
  }

  return data as any;
}

export async function criarOportunidade(payload: Partial<Oportunidade>) {
  const { data, error } = await supabase
    .from("oportunidades")
    .insert(payload)
    .select("*")
    .single();

  if (error) throw error;

  // Buscar nome do cliente manualmente
  if (data && data.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("id", data.cliente_id)
      .single();

    return {
      ...data,
      pessoas: cliente
    } as any;
  }

  return data as any;
}

export async function atualizarOportunidade(
  id: string,
  payload: Partial<Oportunidade>
) {
  const { data, error } = await supabase
    .from("oportunidades")
    .update(payload)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  // Buscar nome do cliente manualmente
  if (data && data.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("id", data.cliente_id)
      .single();

    return {
      ...data,
      pessoas: cliente
    } as any;
  }

  return data as any;
}

export async function moverOportunidade(
  id: string,
  novoEstagio: EstagioOportunidade
) {
  const { data, error } = await supabase
    .from("oportunidades")
    .update({ estagio: novoEstagio })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;

  // Buscar nome do cliente manualmente
  if (data && data.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("id, nome")
      .eq("id", data.cliente_id)
      .single();

    return {
      ...data,
      pessoas: cliente
    } as any;
  }

  return data as any;
}

// ─── LIZ INTEGRATION — adicionado em 2026-03-28 ──────────────────────────────

export type PipelineStatus =
  | 'lead_novo'
  | 'briefing'
  | 'em_proposta'
  | 'negociacao'
  | 'fechamento'
  | 'perdido'

export type ProjetoTipo = 'SITE' | 'SISTEMA' | 'LANDING' | 'CONSULTORIA'

/** Atualizar briefing (Liz chama após auditagem da conversa) */
export async function atualizarBriefingOportunidade(
  id: string,
  briefingTexto: string
): Promise<void> {
  const { error } = await supabase
    .from('oportunidades')
    .update({
      briefing_texto: briefingTexto,
      pipeline_status: 'briefing',
      pipeline_updated: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

/** Atualizar link do projeto (Ollama chama após criar a pasta) */
export async function atualizarProjetoOportunidade(
  id: string,
  projetoPath: string,
  projetoTipo: ProjetoTipo
): Promise<void> {
  const { error } = await supabase
    .from('oportunidades')
    .update({
      projeto_path: projetoPath,
      projeto_tipo: projetoTipo,
      pipeline_status: 'em_proposta',
      pipeline_updated: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

/** Mover no pipeline (William ou Liz) */
export async function moverPipelineLiz(
  id: string,
  status: PipelineStatus,
  motivoPerda?: string
): Promise<void> {
  const { error } = await supabase
    .from('oportunidades')
    .update({
      pipeline_status: status,
      motivo_perda: motivoPerda ?? null,
      pipeline_updated: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) throw error
}

/** Criar oportunidade a partir de lead do WhatsApp */
export async function criarOportunidadeDoLead(payload: {
  titulo: string
  clienteId: string
  descricao?: string
  origem?: string
  briefingTexto?: string
  projetoTipo?: ProjetoTipo
}): Promise<string> {
  const { data, error } = await supabase
    .from('oportunidades')
    .insert({
      titulo: payload.titulo,
      cliente_id: payload.clienteId,
      descricao: payload.descricao ?? null,
      origem: payload.origem ?? 'whatsapp',
      briefing_texto: payload.briefingTexto ?? null,
      projeto_tipo: payload.projetoTipo ?? null,
      pipeline_status: payload.briefingTexto ? 'briefing' : 'lead_novo',
      pipeline_updated: new Date().toISOString(),
      status: 'novo',
      estagio: 'qualificacao',
      valor: null,
      data_fechamento_prevista: null,
      observacoes: null,
    })
    .select('id')
    .single()
  if (error) throw error
  return data.id
}

