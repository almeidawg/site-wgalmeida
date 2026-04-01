/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API: Contratos
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { supabaseRaw as supabase } from "@/lib/supabaseClient";
import { ativarContrato } from "@/lib/workflows/contratoWorkflow";
import type {
  Contrato,
  ContratoCompleto,
  ContratoFormData,
  ContratoItem,
  ContratoItemFormData,
  ContratoAssinatura,
  ContratosFiltros,
  ContratosEstatisticas,
  TipoItemContrato,
} from "@/types/contratos";
import type {
  ContratoExtendido,
  ContratoMultiNucleoFormData,
  ContratoEtapa,
  ContratoItemExtendido,
  ContratoMarcemariaAmbiente,
  ContratoDocumento,
  ContratoPagamento,
  StatusEtapa,
  StatusPagamento,
} from "@/types/contratos-extended";
import {
  adicionarDiasUteis,
  calcularCronogramaEtapas,
  proximoDiaUtil,
} from "@/lib/diasUteisUtils";
import type { UnidadeNegocio } from "@/types/contratos";

let contratosItensHasPricelistItemColumn: boolean | null = null;

async function contratosItensSuportaPricelistItem(): Promise<boolean> {
  if (contratosItensHasPricelistItemColumn !== null) {
    return contratosItensHasPricelistItemColumn;
  }

  const { error } = await supabase
    .from("contratos_itens")
    .select("pricelist_item_id")
    .limit(0);

  contratosItensHasPricelistItemColumn = !error;

  if (error) {
    console.warn(
      "Contrátos_itens não possui a coluna pricelist_item_id (anotada como opcional)."
    );
  }

  return contratosItensHasPricelistItemColumn;
}

async function prepararPayloadItemContrato(
  payload: Record<string, any>
): Promise<Record<string, any>> {
  const suporta = await contratosItensSuportaPricelistItem();
  if (suporta) {
    return payload;
  }

  const { pricelist_item_id, ...rest } = payload;
  return rest;
}

function normalizarTipoItemContrato(tipo?: string | null): TipoItemContrato {
  const t = (tipo || "").toLowerCase();
  if (
    t === "mao_obra" ||
    t === "mÍo_obra" ||
    t === "mao de obra" ||
    t === "mÍo de obra" ||
    t === "servico" ||
    t === "serviço"
  ) {
    return "mao_obra";
  }
  // "material", "produto", "ambos" ou vazio => trata como material
  return "material";
}

function inferirContratadoPeloCliente(item: Partial<ContratoItemExtendido> & Record<string, any>): boolean {
  if (typeof item.contratado_pelo_cliente === "boolean") {
    return item.contratado_pelo_cliente;
  }

  const descricao = String(item.descricao || item.nome || "").toLowerCase();
  const tipo = String(item.tipo || "").toLowerCase();
  const tipoFinanceiro = String(item.tipo_financeiro || "").toLowerCase();

  if (
    descricao.includes("por conta do cliente") ||
    descricao.includes("fornecimento cliente") ||
    descricao.includes("contratado pelo cliente") ||
    descricao.includes("ar condicionado")
  ) {
    return true;
  }

  if (descricao.includes("#contratacao") || descricao.includes("#fornecedor")) {
    return true;
  }

  if (tipo.includes("cliente") || tipoFinanceiro.includes("cliente")) {
    return true;
  }

  return false;
}

// Re-exportar tipos para compatibilidade com imports existentes
export type {
  Contrato,
  ContratoCompleto,
  ContratoFormData,
  ContratoItem,
  ContratoItemFormData,
  ContratoAssinatura,
  ContratosFiltros,
  ContratosEstatisticas,
};

// Compatibilidade com imports antigos
export { listarContratos as listarContratosCompletos };

function normalizarNucleoKanban(
  unidadeNegocio?: string | null
): "arquitetura" | "engenharia" | "marcenaria" | null {
  const valor = (unidadeNegocio || "").toLowerCase().trim();
  if (valor === "arquitetura" || valor === "engenharia" || valor === "marcenaria") {
    return valor;
  }
  return null;
}

async function garantirCardNucleoContrato(
  contratoId: string,
  unidadeNegocio?: string | null,
  oportunidadeId?: string | null,
  valorPrevisto?: number | null,
  dataInicio?: string | null
): Promise<void> {
  const nucleo = normalizarNucleoKanban(unidadeNegocio);
  if (!nucleo) return;

  const { data: existente, error: buscaError } = await supabase
    .from("contratos_nucleos")
    .select("id")
    .eq("contrato_id", contratoId)
    .eq("nucleo", nucleo)
    .limit(1)
    .maybeSingle();

  if (buscaError) {
    console.warn("[contratosApi] Falha ao verificar card de núcleo:", buscaError);
    return;
  }

  if (existente?.id) return;

  const { error: insertError } = await supabase.from("contratos_nucleos").insert({
    contrato_id: contratoId,
    oportunidade_id: oportunidadeId || null,
    nucleo,
    status_kanban: "backlog",
    progresso: 0,
    valor_previsto: valorPrevisto || 0,
    valor_executado: 0,
    data_inicio: dataInicio || new Date().toISOString(),
  });

  if (insertError) {
    console.warn("[contratosApi] Falha ao criar card de núcleo:", insertError);
  }
}

// ============================================================
// CONTRATOS
// ============================================================

/**
 * Listar todos os contratos
 */
export async function listarContratos(): Promise<ContratoCompleto[]> {
  // PaginaçÍo automática (contorna limite 1000 rows Supabase)
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("contratos")
      .select("*, especificador:especificador_id(id, nome)")
      .order("id", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = data ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  // Mapear para incluir nome do especificador
  return allData.map((c: any) => ({
    ...c,
    especificador_nome: c.especificador?.nome || null,
  }));
}

/**
 * Listar contratos com filtros
 */
export async function listarContratosComFiltros(
  filtros: ContratosFiltros
): Promise<ContratoCompleto[]> {
  let query = supabase
    .from("contratos")
    .select("*")
    .order("id", { ascending: false });

  if (filtros.status && filtros.status.length > 0) {
    query = query.in("status", filtros.status);
  }

  if (filtros.unidade_negocio && filtros.unidade_negocio.length > 0) {
    query = query.in("unidade_negocio", filtros.unidade_negocio);
  }

  if (filtros.cliente_id) {
    query = query.eq("cliente_id", filtros.cliente_id);
  }

  if (filtros.data_inicio) {
    query = query.gte("data_inicio", filtros.data_inicio);
  }

  if (filtros.data_fim) {
    query = query.lte("data_previsao_termino", filtros.data_fim);
  }

  if (filtros.busca) {
    query = query.or(
      `numero.ilike.%${filtros.busca}%,cliente_nome.ilike.%${filtros.busca}%`
    );
  }

  const { data, error } = await query;

  if (error) throw error;
  return data as any;
}

/**
 * Buscar contrato por ID
 */
export async function buscarContrato(id: string): Promise<ContratoCompleto> {
  // Usar view vw_contratos_completo que inclui cliente_nome via join com pessoas
  const { data, error } = await supabase
    .from("vw_contratos_completo")
    .select("*")
    .eq("id", id)
    .limit(1);

  if (error) {
    // Fallback para tabela contratos se view não existir
    console.warn("View vw_contratos_completo não disponível, usando tabela contratos");
    const { data: fallbackData, error: fallbackError } = await supabase
      .from("contratos")
      .select("*, pessoas:cliente_id(nome, email, telefone, avatar_url, foto_url)")
      .eq("id", id)
      .limit(1);

    if (fallbackError) throw fallbackError;

    if (!fallbackData || fallbackData.length === 0) {
      throw new Error("Contrato não encontrado");
    }

    const contrato = fallbackData[0] as any;
    const itens = await listarItensContrato(id);

    return {
      ...contrato,
      cliente_nome: contrato.pessoas?.nome || null,
      cliente_email: contrato.pessoas?.email || null,
      cliente_telefone: contrato.pessoas?.telefone || null,
      cliente_avatar_url: contrato.pessoas?.avatar_url || null,
      cliente_foto_url: contrato.pessoas?.foto_url || null,
      itens,
    } as any;
  }

  if (!data || data.length === 0) {
    throw new Error("Contrato não encontrado");
  }

  // Buscar itens do contrato
  const itens = await listarItensContrato(id);

  return { ...(data[0] as ContratoCompleto), itens } as any;
}

/**
 * Buscar contratos por oportunidade
 */
export async function buscarContratosPorOportunidade(
  oportunidade_id: string
): Promise<ContratoCompleto[]> {
  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("oportunidade_id", oportunidade_id)
    .order("id", { ascending: false });

  if (error) throw error;
  return data as any;
}

/**
 * Criar contrato
 */
export async function criarContrato(
  payload: ContratoFormData,
  ativarAutomaticamente: boolean = true // OPÇÍO 3: Ativar por padrÍo sempre
): Promise<Contrato> {
  // Buscar nome do cliente se não veio no payload
  let clienteNome = (payload as any).cliente_nome as string | undefined;
  if (!clienteNome && payload.cliente_id) {
    const { data: pessoa } = await supabase
      .from("pessoas")
      .select("nome")
      .eq("id", payload.cliente_id)
      .single();
    clienteNome = pessoa?.nome || "";
  }

  // Gerar número do contrato usando funçÍo com núcleo + cliente
  const { data: numeroData, error: numeroError } = await supabase.rpc(
    "gerar_numero_contrato",
    {
      nucleo: (payload as any).unidade_negocio || "arquitetura",
      cliente_nome: clienteNome || "",
    }
  );

  if (numeroError || !numeroData) throw numeroError || new Error("Falha ao gerar número do contrato");

  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contratos")
    .insert({
      numero: numeroData,
      ...payload,
      tipo_contrato: (payload as any).tipo_contrato || (payload as any).unidade_negocio || "servico",
      status: "aguardando_assinatura", // Rascunho fica apenas em Propostas
      created_by: userData?.user?.id,
    })
    .select()
    .single();

  if (error) throw error;

  await garantirCardNucleoContrato(
    data.id,
    (data as any).unidade_negocio ?? (payload as any).unidade_negocio,
    (data as any).oportunidade_id ?? (payload as any).oportunidade_id,
    (data as any).valor_total ?? (payload as any).valor_total,
    (data as any).data_inicio ?? (payload as any).data_inicio
  );

  // ATIVAÇÍO AUTOMÁTICA (OPÇÍO 3)
  if (ativarAutomaticamente) {
    try {
      console.log(`🚀 Ativando contrato automaticamente: ${data.numero}`);

      await ativarContrato({
        contrato_id: data.id,
        gerar_financeiro: true,
        gerar_compras: true,
        gerar_cronograma: true,
        ativacao_automatica: true, // Pula validaçÍo de assinaturas
        configuracao_parcelas: {
          numero_parcelas: (payload as any).numero_parcelas || 3,
          dia_vencimento: payload.data_inicio
            ? new Date(payload.data_inicio).getDate()
            : new Date().getDate(),
          periodicidade: "mensal",
          valor_entrada:
            (payload as any).valor_entrada ||
            (((payload as any).valor_total || 0) *
              ((payload as any).percentual_entrada || 0) /
              100),
          percentual_entrada: (payload as any).percentual_entrada || 0,
          primeira_parcela_entrada:
            ((payload as any).percentual_entrada || 0) > 0,
        }
      });

      console.log(`✅ Contrato ${data.numero} ativado automaticamente!`);
      console.log(`   - Financeiro: ✅ Receita e parcelas criadas`);
      console.log(`   - Compras: ✅ Pedido criado (se houver materiais)`);
      console.log(`   - Cronograma: ✅ Projeto e tarefas criadas`);

      // Recarregar contrato atualizado
      const { data: contratoAtualizado } = await supabase
        .from("contratos")
        .select("*")
        .eq("id", data.id)
        .single();

      return contratoAtualizado as any;
    } catch (error) {
      console.warn(`⚠️ Erro na ativaçÍo automática:`, error);
      // não falha a criaçÍo do contrato, apenas loga o aviso
    }
  }

  return data as any;
}

/**
 * Atualizar contrato
 */
export async function atualizarContrato(
  id: string,
  payload: Partial<ContratoFormData>
): Promise<Contrato> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contratos")
    .update({
      ...payload,
      updated_by: userData?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Deletar contrato
 */
export async function deletarContrato(id: string): Promise<void> {
  const { error } = await supabase.from("contratos").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Alterar status do contrato
 */
export async function alterarStatusContrato(
  id: string,
  status: Contrato["status"]
): Promise<Contrato> {
  const { data: userData } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("contratos")
    .update({
      status,
      updated_by: userData?.user?.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

// ============================================================
// ITENS DO CONTRATO
// ============================================================

/**
 * Listar itens do contrato
 */
export async function listarItensContrato(
  contrato_id: string
): Promise<ContratoItem[]> {
  const { data, error } = await supabase
    .from("contratos_itens")
    .select("*")
    .eq("contrato_id", contrato_id)
    .order("id", { ascending: true });

  if (error) throw error;
  const itens = data || [];

  const propostaItemIds = Array.from(
    new Set(
      itens
        .map((item: any) => item.proposta_item_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  );
  const pricelistIds = Array.from(
    new Set(
      itens
        .map((item: any) => item.pricelist_item_id)
        .filter((id: string | null): id is string => Boolean(id))
    )
  );

  const propostaItensMap = new Map<
    string,
    {
      nome?: string | null;
      descricao?: string | null;
      descricao_customizada?: string | null;
    }
  >();
  const pricelistItensMap = new Map<string, { descricao?: string | null }>();

  if (propostaItemIds.length > 0) {
    const { data: propostasItens, error: propostasItensError } = await supabase
      .from("propostas_itens")
      .select("id, nome, descricao, descricao_customizada")
      .in("id", propostaItemIds);

    if (propostasItensError) throw propostasItensError;

    (propostasItens || []).forEach((pi: any) => {
      propostaItensMap.set(pi.id, {
        nome: pi.nome,
        descricao: pi.descricao,
        descricao_customizada: pi.descricao_customizada,
      });
    });
  }

  if (pricelistIds.length > 0) {
    const { data: itensPricelist, error: pricelistError } = await supabase
      .from("pricelist_itens")
      .select("id, descricao")
      .in("id", pricelistIds);

    if (pricelistError) throw pricelistError;

    (itensPricelist || []).forEach((pl: any) => {
      pricelistItensMap.set(pl.id, { descricao: pl.descricao });
    });
  }

  const propostaContratadoMap = new Map<string, boolean>();

  if (propostaItemIds.length > 0) {
    const { data: propostasItensRows } = await supabase
      .from("propostas_itens")
      .select("id, contratado_pelo_cliente")
      .in("id", propostaItemIds);

    for (const row of propostasItensRows || []) {
      propostaContratadoMap.set(
        String((row as any).id),
        Boolean((row as any).contratado_pelo_cliente)
      );
    }
  }

  return itens.map((item: any) => {
    const infoProposta = item.proposta_item_id
      ? propostaItensMap.get(item.proposta_item_id)
      : undefined;
    const infoPricelist = item.pricelist_item_id
      ? pricelistItensMap.get(item.pricelist_item_id)
      : undefined;

    const descricaoAtual =
      typeof item.descricao === "string" ? item.descricao.trim() : "";
    const descricaoCustom =
      typeof infoProposta?.descricao_customizada === "string"
        ? infoProposta.descricao_customizada.trim()
        : "";
    const descricaoProposta =
      typeof infoProposta?.descricao === "string"
        ? infoProposta.descricao.trim()
        : "";
    const nomeProposta =
      typeof infoProposta?.nome === "string" ? infoProposta.nome.trim() : "";
    const descricaoPricelist =
      typeof infoPricelist?.descricao === "string"
        ? infoPricelist.descricao.trim()
        : "";

    const descricaoFinal =
      descricaoAtual ||
      descricaoCustom ||
      descricaoProposta ||
      nomeProposta ||
      descricaoPricelist ||
      "Item da Proposta";

    const valor_unitario = item.valor_unitario ?? item.preco_unitario ?? 0;
    const valor_total =
      item.valor_total ??
      item.preco_total ??
      valor_unitario * (item.quantidade || 0);
    const producao_diaria = item.producao_diaria ?? null;
    const dias_estimados =
      item.dias_estimados ??
      (producao_diaria && producao_diaria > 0
        ? (item.quantidade || 0) / producao_diaria
        : null);

    return {
      ...item,
      descricao: descricaoFinal,
      valor_unitario,
      valor_total,
      producao_diaria,
      dias_estimados,
      preco_unitario: item.preco_unitario ?? valor_unitario,
      preco_total: item.preco_total ?? valor_total,
    };
  }) as any;
}

/**
 * Criar item do contrato
 */
export async function criarItemContrato(
  contrato_id: string,
  payload: ContratoItemFormData
): Promise<ContratoItem> {
  const valor_total = payload.quantidade * payload.valor_unitario;
  const dias_estimados =
    payload.producao_diaria && payload.producao_diaria > 0
      ? payload.quantidade / payload.producao_diaria
      : null;

  const insertData = await prepararPayloadItemContrato({
    contrato_id,
    ...payload,
    contratado_pelo_cliente: inferirContratadoPeloCliente(payload as any),
    valor_total,
    dias_estimados,
  });

  const { data, error } = await supabase
    .from("contratos_itens")
    .insert(insertData as any)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Atualizar item do contrato
 */
export async function atualizarItemContrato(
  id: string,
  payload: Partial<ContratoItemFormData>
): Promise<ContratoItem> {
  const updateData: any = { ...payload };

  const precisaRecalcular =
    payload.quantidade !== undefined ||
    payload.valor_unitario !== undefined ||
    payload.producao_diaria !== undefined;

  if (precisaRecalcular) {
    const { data: itemAtual } = await supabase
      .from("contratos_itens")
      .select("quantidade, valor_unitario, producao_diaria")
      .eq("id", id)
      .single();

    const quantidade = payload.quantidade ?? itemAtual?.quantidade ?? 0;
    const valor_unitario =
      payload.valor_unitario ?? itemAtual?.valor_unitario ?? 0;
    const producao_diaria =
      payload.producao_diaria ?? itemAtual?.producao_diaria ?? null;

    updateData.valor_total = quantidade * valor_unitario;
    updateData.dias_estimados =
      producao_diaria && producao_diaria > 0
        ? quantidade / producao_diaria
        : null;
  }

  const { data, error } = await supabase
    .from("contratos_itens")
    .update(await prepararPayloadItemContrato(updateData))
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

/**
 * Deletar item do contrato
 */
export async function deletarItemContrato(id: string): Promise<void> {
  const { error } = await supabase.from("contratos_itens").delete().eq("id", id);

  if (error) throw error;
}

// ============================================================
// ASSINATURA
// ============================================================

/**
 * Assinar contrato
 */
export async function assinarContrato(
  assinatura: ContratoAssinatura
): Promise<Contrato> {
  const { contrato_id, tipo, assinatura_base64 } = assinatura;

  const updateData: any = {
    data_assinatura: new Date().toISOString(),
  };

  if (tipo === "cliente") {
    updateData.assinatura_cliente_base64 = assinatura_base64;
  } else {
    updateData.assinatura_responsavel_base64 = assinatura_base64;
  }

  // Verificar se ambas as assinaturas foram coletadas
  const { data: contratoAtual } = await supabase
    .from("contratos")
    .select("assinatura_cliente_base64, assinatura_responsavel_base64")
    .eq("id", contrato_id)
    .single();

  const clienteAssinado =
    tipo === "cliente"
      ? assinatura_base64
      : contratoAtual?.assinatura_cliente_base64;
  const responsavelAssinado =
    tipo === "responsavel"
      ? assinatura_base64
      : contratoAtual?.assinatura_responsavel_base64;

  // Se ambas as assinaturas estÍo presentes, mudar status para ativo
  if (clienteAssinado && responsavelAssinado) {
    updateData.status = "ativo";
  } else {
    updateData.status = "aguardando_assinatura";
  }

  const { data, error } = await supabase
    .from("contratos")
    .update(updateData)
    .eq("id", contrato_id)
    .select()
    .single();

  if (error) throw error;
  return data as any;
}

// ============================================================
// ESTATÍSTICAS
// ============================================================

/**
 * Obter estatísticas de contratos
 */
export async function obterEstatisticasContratos(): Promise<ContratosEstatisticas> {
  const { data: contratos, error } = await supabase
    .from("contratos")
    .select("status, valor_total, created_at");

  if (error) throw error;

  const hoje = new Date();
  const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  const contratosMes = contratos.filter((c: any) => {
    const dataCriacao = new Date(c.created_at);
    return dataCriacao >= inicioMes;
  });

  const stats: ContratosEstatisticas = {
    total_contratos: contratos.length,
    contratos_rascunho: contratos.filter((c: any) => c.status === "aguardando_assinatura")
      .length, // Rascunho agora fica em Propostas - aqui contamos aguardando_assinatura
    contratos_ativos: contratos.filter((c: any) => c.status === "ativo").length,
    contratos_concluidos: contratos.filter((c: any) => c.status === "concluido")
      .length,
    contratos_cancelados: contratos.filter((c: any) => c.status === "cancelado")
      .length,
    valor_total_ativos: contratos
      .filter((c: any) => c.status === "ativo")
      .reduce((acc: number, c: any) => acc + (c.valor_total || 0), 0),
    valor_total_mes: contratosMes.reduce(
      (acc: number, c: any) => acc + (c.valor_total || 0),
      0
    ),
  };

  return stats;
}

/**
 * Duplicar contrato
 */
export async function duplicarContrato(id: string): Promise<Contrato> {
  // Buscar contrato original
  const contratoOriginal = await buscarContrato(id);

  // Criar novo contrato
  const novoContrato = await criarContrato({
    oportunidade_id: contratoOriginal.oportunidade_id || undefined,
    cliente_id: contratoOriginal.cliente_id || "",
    unidade_negocio: contratoOriginal.unidade_negocio,
    observacoes: contratoOriginal.observacoes || undefined,
    condicoes_contratuais: contratoOriginal.condicoes_contratuais || undefined,
  });

  // Duplicar itens
  if (contratoOriginal.itens) {
    for (const item of contratoOriginal.itens) {
      await criarItemContrato(novoContrato.id, {
        tipo: item.tipo,
        pricelist_item_id: item.pricelist_item_id || undefined,
        descricao: item.descricao,
        quantidade: item.quantidade,
        unidade: item.unidade,
        valor_unitario: item.valor_unitario ?? item.preco_unitario ?? 0,
        producao_diaria: item.producao_diaria,
        percentual_valor: item.percentual_valor || undefined,
        ordem_execucao: item.ordem_execucao,
        especificacoes: item.especificacoes || undefined,
      });
    }
  }

  return novoContrato;
}

// ============================================================
// MULTI-NÚCLEO: CriaçÍo de Contratos por Proposta
// ============================================================

/**
 * Gerar número de contrato no formato ARQ-2025-0001, ENG-2025-0001, MAR-2025-0001
 */
export async function gerarNumeroContrato(
  unidadeNegocio: UnidadeNegocio
): Promise<string> {
  const ano = new Date().getFullYear();
  const prefixo = unidadeNegocio === "arquitetura" ? "ARQ" :
                  unidadeNegocio === "engenharia" ? "ENG" : "MAR";

  // Buscar o último contrato do núcleo no ano
  const { data, error } = await supabase
    .from("contratos")
    .select("numero")
    .eq("unidade_negocio", unidadeNegocio)
    .like("numero", `${prefixo}-${ano}-%`)
    .order("numero", { ascending: false })
    .limit(1);

  if (error && error.code !== "PGRST116") throw error; // Ignora erro de "not found"

  let proximoNumero = 1;

  if (data && data.length > 0) {
    const ultimoNumero = data[0].numero;
    const partes = ultimoNumero.split("-");
    if (partes.length === 3) {
      proximoNumero = parseInt(partes[2]) + 1;
    }
  }

  return `${prefixo}-${ano}-${proximoNumero.toString().padStart(4, "0")}`;
}

/**
 * Criar contratos multi-núcleo a partir de uma proposta
 * Cria 1, 2 ou 3 contratos dependendo dos núcleos selecionados
 */
export async function criarContratoMultiNucleo(
  formData: ContratoMultiNucleoFormData
): Promise<{
  contratosIds: string[];
  contratoGrupoId: string;
  totalContratos: number;
}> {
  const contratosIds: string[] = [];
  const contratoGrupoId = crypto.randomUUID();
  const { data: userData } = await supabase.auth.getUser();

  // Criar um contrato para cada núcleo selecionado
  for (const nucleo of formData.nucleos_selecionados) {
    const prazo = formData.prazos_por_nucleo[nucleo];
    const valores = formData.valores_por_nucleo[nucleo];

    // Calcular data de término em dias úteis
    const dataInicio = prazo.data_inicio
      ? new Date(prazo.data_inicio)
      : new Date();
    const dataPrevisaoTermino = adicionarDiasUteis(
      dataInicio,
      prazo.duracao_dias_uteis
    );

    // NOVO: Usar configuraçÍo de pagamento POR NÚCLEO se disponível
    const pagamentoNucleo = (formData as any).pagamento_por_nucleo?.[nucleo];
    const percentualEntrada = pagamentoNucleo?.percentual_entrada ?? formData.percentual_entrada;
    const numeroParcelas = pagamentoNucleo?.numero_parcelas ?? formData.numero_parcelas;
    const formaPagamento = pagamentoNucleo?.forma_pagamento ?? formData.forma_pagamento;
    const diaVencimento = pagamentoNucleo?.dia_vencimento ?? 10;
    const contaTipo = pagamentoNucleo?.conta_tipo ?? "real";

    // NOVO: Campos de modalidade de materiais (Engenharia)
    const modalidadeMateriais = pagamentoNucleo?.modalidade_materiais ?? "revenda";
    const feeGestaoPercentual = pagamentoNucleo?.fee_gestao_percentual ?? 15;

    // Calcular valores de pagamento
    const valorEntrada = valores.valor_total * (percentualEntrada / 100);
    const valorRestante = valores.valor_total - valorEntrada;
    const valorParcela = numeroParcelas > 0
      ? valorRestante / numeroParcelas
      : 0;

    // Gerar número do contrato
    const numero = await gerarNumeroContrato(nucleo);

    // Criar contrato
    const { data: contrato, error: contratoError } = await supabase
      .from("contratos")
      .insert({
        numero,
        tipo_contrato: nucleo, // tipo_contrato baseado no nucleo
        proposta_id: formData.proposta_id,
        oportunidade_id: formData.oportunidade_id,
        cliente_id: formData.cliente_id,
        unidade_negocio: nucleo,
        nucleos_selecionados: formData.nucleos_selecionados,
        contrato_grupo_id: contratoGrupoId,
        descricao: formData.descricao,
        observacoes: formData.observacoes,
        data_inicio: dataInicio.toISOString(),
        duracao_dias_uteis: prazo.duracao_dias_uteis,
        data_previsao_termino: dataPrevisaoTermino.toISOString(),
        valor_total: valores.valor_total,
        valor_mao_obra: valores.valor_mao_obra,
        valor_materiais: valores.valor_materiais,
        forma_pagamento: formaPagamento,
        percentual_entrada: percentualEntrada,
        valor_entrada: valorEntrada,
        numero_parcelas: numeroParcelas,
        valor_parcela: valorParcela,
        dados_cliente_json: formData.dados_cliente,
        dados_imovel_json: formData.dados_imovel,
        // Dados do especificador/indicaçÍo
        especificador_id: formData.especificador_id || null,
        tem_especificador: formData.tem_especificador || false,
        codigo_rastreamento: formData.codigo_rastreamento || null,
        observacoes_indicacao: formData.observacoes_indicacao || null,
        status: "aguardando_assinatura", // Rascunho fica apenas em Propostas
        created_by: userData?.user?.id,
      })
      .select()
      .single();

    if (contratoError) throw contratoError;

    contratosIds.push(contrato.id);

    // NOVO: Inserir configuraçÍo de pagamento na tabela contratos_pagamentos_nucleo
    // Esta tabela dispara trigger para criar lançamentos e cobranças automaticamente
    try {
      // Calcular fee de gestÍo (apenas se modalidade = gestao)
      const feeGestaoValor = modalidadeMateriais === "gestao"
        ? valores.valor_materiais * (feeGestaoPercentual / 100)
        : 0;

      const { error: pagamentoNucleoError } = await supabase
        .from("contratos_pagamentos_nucleo")
        .insert({
          contrato_id: contrato.id,
          nucleo: nucleo,
          valor_total: valores.valor_total,
          percentual_entrada: percentualEntrada,
          valor_entrada: valorEntrada,
          numero_parcelas: numeroParcelas,
          valor_parcela: valorParcela,
          forma_pagamento: formaPagamento,
          dia_vencimento: diaVencimento,
          conta_tipo: contaTipo,
          // NOVO: Campos de modalidade de materiais
          modalidade_materiais: modalidadeMateriais,
          valor_materiais: valores.valor_materiais,
          valor_mao_obra: valores.valor_mao_obra,
          fee_gestao_percentual: feeGestaoPercentual,
          fee_gestao_valor: feeGestaoValor,
          status: "pendente",
        });

      if (pagamentoNucleoError) {
        console.warn(
          `⚠️ Tabela contratos_pagamentos_nucleo não existe ou erro: ${pagamentoNucleoError.message}`
        );
        // não falha - a tabela pode ainda não existir
      } else {
        console.log(
          `✅ ConfiguraçÍo de pagamento por núcleo criada para ${nucleo}`
        );
      }
    } catch (err) {
      console.warn("⚠️ Erro ao criar pagamento por núcleo:", err);
    }

    // Criar itens do contrato (memorial)
    if (formData.itens_por_nucleo && formData.itens_por_nucleo[nucleo]) {
      await criarItensContratoEmLote(
        contrato.id,
        formData.itens_por_nucleo[nucleo]
      );
    }

    // Criar etapas padrÍo
    await criarEtapasPadraoContrato(
      contrato.id,
      nucleo,
      valores.valor_total,
      dataInicio,
      prazo.duracao_dias_uteis
    );

    // Se for marcenaria, criar ambientes
    if (nucleo === "marcenaria" && formData.ambientes_marcenaria) {
      await criarAmbientesMarcenariaEmLote(
        contrato.id,
        formData.ambientes_marcenaria
      );
    }

    // Criar pagamentos (entrada + parcelas)
    await criarPagamentosContrato(
      contrato.id,
      valorEntrada,
      valorParcela,
      numeroParcelas,
      dataInicio
    );

    // ⚠️ CORREÇÍO CRÍTICA: Ativar workflow para gerar financeiro e cronograma
    try {
      console.log(`🚀 Ativando contrato ${numero} automaticamente...`);

      await ativarContrato({
        contrato_id: contrato.id,
        gerar_financeiro: true,
        gerar_compras: true,
        gerar_cronograma: true,
        ativacao_automatica: true, // Pula validaçÍo de assinaturas
        configuracao_parcelas: {
          numero_parcelas: numeroParcelas,
          dia_vencimento: diaVencimento,
          periodicidade: "mensal",
          valor_entrada: valorEntrada,
          percentual_entrada: percentualEntrada,
          primeira_parcela_entrada: percentualEntrada > 0,
        },
      });

      console.log(`✅ Contrato ${numero} ativado com sucesso!`);
      console.log(`   - Financeiro: ✅ Receita e parcelas criadas`);
      console.log(`   - Compras: ✅ Pedido criado (se houver materiais)`);
      console.log(`   - Cronograma: ✅ Projeto e tarefas criadas`);
    } catch (error) {
      console.error(`❌ Erro ao ativar contrato ${numero}:`, error);
      // não falha a criaçÍo, apenas loga o erro
      // O contrato ficará em rascunho e pode ser ativado manualmente depois
    }
  }

  return {
    contratosIds,
    contratoGrupoId,
    totalContratos: contratosIds.length,
  };
}

/**
 * Buscar contratos por grupo (contratos da mesma proposta)
 */
export async function buscarContratosPorGrupo(
  contratoGrupoId: string
): Promise<ContratoExtendido[]> {
  const { data, error } = await supabase
    .from("contratos")
    .select("*")
    .eq("contrato_grupo_id", contratoGrupoId)
    .order("unidade_negocio", { ascending: true });

  if (error) throw error;
  return data as ContratoExtendido[];
}

// ============================================================
// ETAPAS DO CONTRATO
// ============================================================

/**
 * Buscar etapas padrÍo por núcleo
 */
export async function buscarEtapasPadrao(
  unidadeNegocio: UnidadeNegocio
): Promise<any[]> {
  const { data, error } = await supabase
    .from("contratos_etapas_padrao")
    .select("*")
    .eq("unidade_negocio", unidadeNegocio)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data;
}

/**
 * Criar etapas padrÍo para um contrato baseado no núcleo
 */
export async function criarEtapasPadraoContrato(
  contratoId: string,
  unidadeNegocio: UnidadeNegocio,
  valorTotal: number,
  dataInicio: Date,
  duracaoTotalDiasUteis: number
): Promise<void> {
  // Buscar etapas padrÍo
  const etapasPadrao = await buscarEtapasPadrao(unidadeNegocio);

  if (etapasPadrao.length === 0) return;

  // Calcular durações proporcionais
  const somaPercentuais = etapasPadrao.reduce(
    (acc, e) => acc + (e.percentual_prazo || 0),
    0
  );

  const etapasComDuracao = etapasPadrao.map((etapa) => ({
    nome: etapa.nome,
    descricao: etapa.descricao,
    percentual_prazo: etapa.percentual_prazo,
    percentual_pagamento: etapa.percentual_pagamento,
    duracaoDiasUteis: Math.round(
      (etapa.percentual_prazo / somaPercentuais) * duracaoTotalDiasUteis
    ),
  }));

  // Calcular cronograma com datas
  const cronograma = calcularCronogramaEtapas(
    dataInicio,
    etapasComDuracao.map((e) => ({
      nome: e.nome,
      duracaoDiasUteis: e.duracaoDiasUteis,
    }))
  );

  // Criar etapas no banco
  const etapasParaInserir = cronograma.map((item, index) => {
    const etapaPadrao = etapasComDuracao[index];
    const valorPagamento =
      valorTotal * (etapaPadrao.percentual_pagamento / 100);

    return {
      contrato_id: contratoId,
      ordem: index + 1,
      nome: item.nome,
      descricao: etapaPadrao.descricao,
      prazo_dias_uteis: item.duracaoDiasUteis,
      data_inicio_prevista: item.dataInicio.toISOString(),
      data_termino_prevista: item.dataFim.toISOString(),
      percentual_pagamento: etapaPadrao.percentual_pagamento,
      valor_pagamento: valorPagamento,
      pago: false,
      status: "pendente" as StatusEtapa,
    };
  });

  const { error } = await supabase
    .from("contratos_etapas")
    .insert(etapasParaInserir);

  if (error) throw error;
}

/**
 * Buscar etapas de um contrato
 */
export async function buscarEtapasContrato(
  contratoId: string
): Promise<ContratoEtapa[]> {
  const { data, error } = await supabase
    .from("contratos_etapas")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as ContratoEtapa[];
}

/**
 * Atualizar etapa do contrato
 */
export async function atualizarEtapaContrato(
  etapaId: string,
  payload: Partial<ContratoEtapa>
): Promise<ContratoEtapa> {
  const { data, error } = await supabase
    .from("contratos_etapas")
    .update(payload)
    .eq("id", etapaId)
    .select()
    .single();

  if (error) throw error;
  return data as ContratoEtapa;
}

/**
 * Marcar etapa como concluída
 */
export async function concluirEtapaContrato(etapaId: string): Promise<void> {
  const { error } = await supabase
    .from("contratos_etapas")
    .update({
      status: "concluida" as StatusEtapa,
      data_termino_real: new Date().toISOString(),
    })
    .eq("id", etapaId);

  if (error) throw error;
}

// ============================================================
// ITENS DO CONTRATO (Memorial Extendido)
// ============================================================

/**
 * Criar múltiplos itens de uma vez (memorial)
 */
export async function criarItensContratoEmLote(
  contratoId: string,
  itens: Partial<ContratoItemExtendido>[]
): Promise<void> {
  const pricelistIds = Array.from(
    new Set(
      itens
        .map((item) => item.pricelist_item_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const pricelistMap = new Map<
    string,
    { preco: number; producao_diaria: number | null; categoria: string | null }
  >();

  if (pricelistIds.length > 0) {
    const { data: itensPricelist, error: pricelistError } = await supabase
      .from("pricelist_itens")
      .select("id, preco, producao_diaria, categoria")
      .in("id", pricelistIds);

    if (pricelistError) throw pricelistError;

    (itensPricelist || []).forEach((pl: any) => {
      pricelistMap.set(pl.id, {
        preco: pl.preco ?? 0,
        producao_diaria: pl.producao_diaria ?? null,
        categoria: pl.categoria ?? null,
      });
    });
  }

  // Buscar flag contratado_pelo_cliente dos itens da proposta (se vinculados)
  const propostaItemIds = Array.from(
    new Set(
      itens
        .map((item) => item.proposta_item_id)
        .filter((id): id is string => Boolean(id))
    )
  );

  const propostaContratadoMap = new Map<string, boolean>();
  if (propostaItemIds.length > 0) {
    const { data: propostasItensRows } = await supabase
      .from("propostas_itens")
      .select("id, contratado_pelo_cliente")
      .in("id", propostaItemIds);

    for (const row of propostasItensRows || []) {
      propostaContratadoMap.set(
        String((row as any).id),
        Boolean((row as any).contratado_pelo_cliente)
      );
    }
  }

  const itensParaInserir = itens.map((item, index) => {
    const info = item.pricelist_item_id
      ? pricelistMap.get(item.pricelist_item_id)
      : undefined;

    const valor_unitario = item.valor_unitario ?? info?.preco ?? 0;

    const quantidade = item.quantidade ?? 0;
    const producao_diaria =
      item.producao_diaria ??
      info?.producao_diaria ??
      null;
    const valor_total =
      item.valor_total ??
      valor_unitario * quantidade;
    const dias_estimados =
      producao_diaria && producao_diaria > 0
        ? quantidade / producao_diaria
        : null;

    const descricaoBase =
      (typeof item.descricao === "string" && item.descricao.trim()) ||
      (typeof item.nome === "string" && item.nome.trim()) ||
      (typeof (item as any).descricao_customizada === "string" &&
        (item as any).descricao_customizada.trim()) ||
      "";
    const contratadoPeloCliente =
      propostaContratadoMap.get(String(item.proposta_item_id || "")) ??
      inferirContratadoPeloCliente(item as any);

    return {
      contrato_id: contratoId,
      proposta_item_id: item.proposta_item_id,
      // pricelist_item_id: removido - coluna não existe em contratos_itens
      tipo: normalizarTipoItemContrato(item.tipo), // Normaliza "servico"/"produto"/"ambos" para "mao_obra"/"material"
      descricao: descricaoBase || "Item da Proposta",
      quantidade,
      unidade: item.unidade,
      valor_unitario,
      valor_total,
      producao_diaria,
      dias_estimados,
      categoria: item.categoria || info?.categoria || null,
      nucleo: item.nucleo,
      contratado_pelo_cliente: contratadoPeloCliente,
      ordem: item.ordem || index + 1,
    };
  });

  const { error } = await supabase
    .from("contratos_itens")
    .insert(itensParaInserir as any);

  if (error) throw error;
}

/**
 * Buscar itens do contrato agrupados por núcleo
 */
export async function buscarItensContratoPorNucleo(
  contratoId: string
): Promise<Record<UnidadeNegocio, ContratoItemExtendido[]>> {
  const { data, error } = await supabase
    .from("contratos_itens")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("nucleo", { ascending: true })
    .order("ordem", { ascending: true });

  if (error) throw error;

  const itens = data as ContratoItemExtendido[];
  const grupos: Record<string, ContratoItemExtendido[]> = {
    arquitetura: [],
    engenharia: [],
    marcenaria: [],
  };

  itens.forEach((item) => {
    if (item.nucleo && grupos[item.nucleo]) {
      grupos[item.nucleo].push(item);
    }
  });

  return grupos as Record<UnidadeNegocio, ContratoItemExtendido[]>;
}

// ============================================================
// AMBIENTES DE MARCENARIA
// ============================================================

/**
 * Criar múltiplos ambientes de marcenaria
 */
export async function criarAmbientesMarcenariaEmLote(
  contratoId: string,
  ambientes: Partial<ContratoMarcemariaAmbiente>[]
): Promise<void> {
  const ambientesParaInserir = ambientes.map((ambiente, index) => ({
    contrato_id: contratoId,
    ambiente: ambiente.ambiente,
    ordem: ambiente.ordem || index + 1,
    caixas: ambiente.caixas,
    portas: ambiente.portas,
    lacca: ambiente.lacca,
    dobradica: ambiente.dobradica,
    amortecedor_dobradica: ambiente.amortecedor_dobradica,
    corredica: ambiente.corredica,
    amortecedor_corredica: ambiente.amortecedor_corredica,
    puxador: ambiente.puxador,
    acabamentos: ambiente.acabamentos,
    medidas_json: ambiente.medidas_json,
    observacoes: ambiente.observacoes,
  }));

  const { error } = await supabase
    .from("contratos_marcenaria_ambientes")
    .insert(ambientesParaInserir);

  if (error) throw error;
}

/**
 * Buscar ambientes de marcenaria de um contrato
 */
export async function buscarAmbientesMarcenaria(
  contratoId: string
): Promise<ContratoMarcemariaAmbiente[]> {
  const { data, error } = await supabase
    .from("contratos_marcenaria_ambientes")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("ordem", { ascending: true });

  if (error) throw error;
  return data as ContratoMarcemariaAmbiente[];
}

/**
 * Atualizar ambiente de marcenaria
 */
export async function atualizarAmbienteMarcenaria(
  ambienteId: string,
  payload: Partial<ContratoMarcemariaAmbiente>
): Promise<ContratoMarcemariaAmbiente> {
  const { data, error } = await supabase
    .from("contratos_marcenaria_ambientes")
    .update(payload)
    .eq("id", ambienteId)
    .select()
    .single();

  if (error) throw error;
  return data as ContratoMarcemariaAmbiente;
}

/**
 * Deletar ambiente de marcenaria
 */
export async function deletarAmbienteMarcenaria(
  ambienteId: string
): Promise<void> {
  const { error } = await supabase
    .from("contratos_marcenaria_ambientes")
    .delete()
    .eq("id", ambienteId);

  if (error) throw error;
}

// ============================================================
// PAGAMENTOS DO CONTRATO
// ============================================================

/**
 * Criar pagamentos do contrato (entrada + parcelas)
 */
export async function criarPagamentosContrato(
  contratoId: string,
  valorEntrada: number,
  valorParcela: number,
  numeroParcelas: number,
  dataInicio: Date
): Promise<void> {
  const pagamentos: any[] = [];

  // Entrada (vencimento na assinatura)
  if (valorEntrada > 0) {
    pagamentos.push({
      contrato_id: contratoId,
      numero_parcela: 0,
      valor: valorEntrada,
      data_vencimento: dataInicio.toISOString(),  // ✅ contratos_pagamentos usa data_vencimento
      forma_pagamento: "Entrada",
      status: "pendente" as StatusPagamento,
    });
  }

  // Parcelas mensais
  for (let i = 1; i <= numeroParcelas; i++) {
    const dataVencimento = new Date(dataInicio);
    dataVencimento.setMonth(dataVencimento.getMonth() + i);

    pagamentos.push({
      contrato_id: contratoId,
      numero_parcela: i,
      valor: valorParcela,
      data_vencimento: dataVencimento.toISOString(),  // ✅ contratos_pagamentos usa data_vencimento
      forma_pagamento: `Parcela ${i}/${numeroParcelas}`,
      status: "pendente" as StatusPagamento,
    });
  }

  const { error } = await supabase
    .from("contratos_pagamentos")
    .insert(pagamentos);

  if (error) throw error;
}

/**
 * Buscar pagamentos de um contrato
 */
export async function buscarPagamentosContrato(
  contratoId: string
): Promise<ContratoPagamento[]> {
  const { data, error } = await supabase
    .from("contratos_pagamentos")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("numero_parcela", { ascending: true });

  if (error) throw error;
  return data as ContratoPagamento[];
}

/**
 * Registrar pagamento
 */
export async function registrarPagamento(
  pagamentoId: string,
  dataPagamento?: Date
): Promise<void> {
  const { error } = await supabase
    .from("contratos_pagamentos")
    .update({
      status: "pago" as StatusPagamento,
      data_pagamento: (dataPagamento || new Date()).toISOString(),
    })
    .eq("id", pagamentoId);

  if (error) throw error;
}

// ============================================================
// DOCUMENTOS DO CONTRATO
// ============================================================

/**
 * Criar documento do contrato
 */
export async function criarDocumentoContrato(
  contratoId: string,
  documento: Partial<ContratoDocumento>
): Promise<ContratoDocumento> {
  const { data, error } = await supabase
    .from("contratos_documentos")
    .insert({
      contrato_id: contratoId,
      ...documento,
    })
    .select()
    .single();

  if (error) throw error;
  return data as ContratoDocumento;
}

/**
 * Buscar documentos de um contrato
 */
export async function buscarDocumentosContrato(
  contratoId: string
): Promise<ContratoDocumento[]> {
  const { data, error } = await supabase
    .from("contratos_documentos")
    .select("*")
    .eq("contrato_id", contratoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as ContratoDocumento[];
}

/**
 * Marcar documento como assinado
 */
export async function marcarDocumentoAssinado(
  documentoId: string,
  assinanteNome: string
): Promise<void> {
  const { error } = await supabase
    .from("contratos_documentos")
    .update({
      assinado: true,
      data_assinatura: new Date().toISOString(),
      assinante_nome: assinanteNome,
    })
    .eq("id", documentoId);

  if (error) throw error;
}

/**
 * Deletar documento
 */
export async function deletarDocumentoContrato(
  documentoId: string
): Promise<void> {
  const { error } = await supabase
    .from("contratos_documentos")
    .delete()
    .eq("id", documentoId);

  if (error) throw error;
}

// ============================================================
// UTILITÁRIOS
// ============================================================

/**
 * Calcular totais de um contrato (soma dos itens)
 */
export async function calcularTotaisContrato(contratoId: string): Promise<{
  valorTotal: number;
  valorMaoObra: number;
  valorMateriais: number;
  valorServicos: number;
}> {
  const { data, error } = await supabase
    .from("contratos_itens")
    .select("tipo, valor_total")
    .eq("contrato_id", contratoId);

  if (error) throw error;

  const itens = data || [];
  let valorTotal = 0;
  let valorMaoObra = 0;
  let valorMateriais = 0;
  let valorServicos = 0;

  itens.forEach((item: any) => {
    valorTotal += item.valor_total || 0;
    if (item.tipo === "mao_obra") {
      valorMaoObra += item.valor_total || 0;
    } else if (item.tipo === "material") {
      valorMateriais += item.valor_total || 0;
    } else if (item.tipo === "servico") {
      valorServicos += item.valor_total || 0;
    }
  });

  return { valorTotal, valorMaoObra, valorMateriais, valorServicos };
}

/**
 * Buscar contrato extendido com todas as relações
 */
export async function buscarContratoExtendido(
  contratoId: string
): Promise<{
  contrato: ContratoExtendido;
  etapas: ContratoEtapa[];
  itens: ContratoItemExtendido[];
  pagamentos: ContratoPagamento[];
  documentos: ContratoDocumento[];
  ambientesMarcenaria?: ContratoMarcemariaAmbiente[];
}> {
  // Buscar contrato
  const { data: contrato, error: contratoError } = await supabase
    .from("contratos")
    .select("*")
    .eq("id", contratoId)
    .single();

  if (contratoError) throw contratoError;

  // Buscar dados relacionados em paralelo
  const [etapas, itens, pagamentos, documentos, ambientes] = await Promise.all([
    buscarEtapasContrato(contratoId),
    listarItensContrato(contratoId),
    buscarPagamentosContrato(contratoId),
    buscarDocumentosContrato(contratoId),
    contrato.unidade_negocio === "marcenaria"
      ? buscarAmbientesMarcenaria(contratoId)
      : Promise.resolve([]),
  ]);

  return {
    contrato: contrato as ContratoExtendido,
    etapas,
    itens: itens as unknown as ContratoItemExtendido[],
    pagamentos,
    documentos,
    ambientesMarcenaria: ambientes.length > 0 ? ambientes : undefined,
  };
}



