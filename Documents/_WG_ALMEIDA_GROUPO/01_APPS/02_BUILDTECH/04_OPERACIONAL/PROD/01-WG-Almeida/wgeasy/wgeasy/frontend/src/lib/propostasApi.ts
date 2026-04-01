/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// API: Propostas Comerciais
// ============================================================

import { supabase } from "./supabaseClient";
import type {
  Proposta,
  PropostaItem,
  PropostaCompleta,
  PropostaVisualizacao,
  PropostaFormData,
  PropostaItemInput,
} from "@/types/propostas";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function inferirContratadoPeloClienteProposta(item: Partial<PropostaItemInput>): boolean {
  if (typeof item.contratado_pelo_cliente === "boolean") {
    return item.contratado_pelo_cliente;
  }

  const descricao = String(item.descricao_customizada || item.descricao || item.nome || "").toLowerCase();
  const tipo = String(item.tipo || "").toLowerCase();

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

  return tipo.includes("cliente");
}

function sanitizarItensParaPersistencia(itens: PropostaItemInput[]): {
  itens: PropostaItemInput[];
  descartes: Record<string, number>;
} {
  const descartes: Record<string, number> = {};
  const chaves = new Set<string>();

  const registrarDescarte = (motivo: string) => {
    descartes[motivo] = (descartes[motivo] || 0) + 1;
  };

  const normalizarTexto = (valor?: string | null) =>
    (valor || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase();

  const normalizarUnidade = (valor?: string | null) => {
    const unidade = (valor || "un").trim().toLowerCase();
    if (unidade === "m²") return "m2";
    return unidade;
  };

  const resultado: PropostaItemInput[] = [];

  for (const item of itens) {
    const quantidade = Number(item.quantidade);
    const valorUnitario = Number(item.valor_unitario);
    const pricelistValido = !!item.pricelist_item_id && UUID_REGEX.test(item.pricelist_item_id);

    if (!item.nome || !item.nome.trim()) {
      registrarDescarte("nome_invalido");
      continue;
    }

    if (!Number.isFinite(quantidade) || quantidade <= 0) {
      registrarDescarte("quantidade_invalida");
      continue;
    }

    if (!Number.isFinite(valorUnitario) || valorUnitario < 0) {
      registrarDescarte("valor_unitario_invalido");
      continue;
    }

    if (!pricelistValido && valorUnitario === 0) {
      registrarDescarte("custom_sem_preco");
      continue;
    }

    const ambienteId = item.ambiente_id || "sem_ambiente";
    const chave = [
      pricelistValido ? item.pricelist_item_id : "sem_pricelist",
      ambienteId,
      normalizarTexto(item.descricao_customizada || item.nome),
      quantidade.toFixed(4),
      valorUnitario.toFixed(4),
    ].join("|");

    if (chaves.has(chave)) {
      registrarDescarte("duplicado");
      continue;
    }

    chaves.add(chave);
    resultado.push({
      ...item,
      pricelist_item_id: pricelistValido ? item.pricelist_item_id : null,
      categoria: normalizarTexto(item.categoria),
      tipo: (item.tipo || "material").toLowerCase() as any,
      contratado_pelo_cliente: inferirContratadoPeloClienteProposta(item),
      unidade: normalizarUnidade(item.unidade),
      quantidade,
      valor_unitario: valorUnitario,
    });
  }

  const itensComOrdem = resultado.map((item, index) => ({
    ...item,
    ordem: index,
  }));

  return { itens: itensComOrdem, descartes };
}

function extrairColunaInexistente(error: any): string | null {
  const mensagemErro = String(error?.message || "");
  const detalhesErro = String(error?.details || "");
  const hintErro = String(error?.hint || "");
  const textoErroCompleto = `${mensagemErro} ${detalhesErro} ${hintErro}`.toLowerCase();

  const matchColuna = mensagemErro.match(/column\s+"([^"]+)"/i)
    || mensagemErro.match(/Could not find the '([^']+)' column/i)
    || detalhesErro.match(/column\s+"([^"]+)"/i)
    || detalhesErro.match(/'([^']+)'/)
    || mensagemErro.match(/'([^']+)'/);
  const coluna = matchColuna?.[1] || null;
  const code = String(error?.code || "").toUpperCase();
  const colunaInexistente =
    code === "42703" ||
    code === "PGRST204" ||
    textoErroCompleto.includes("does not exist") ||
    textoErroCompleto.includes("could not find the") ||
    textoErroCompleto.includes("column");

  return colunaInexistente ? coluna : null;
}

function ehConflitoUnicidade(error: any): boolean {
  const code = String(error?.code || "").toUpperCase();
  const status = Number(error?.status || 0);
  const texto = `${String(error?.message || "")} ${String(error?.details || "")}`.toLowerCase();
  return (
    code === "23505" ||
    status === 409 ||
    texto.includes("duplicate key") ||
    texto.includes("already exists") ||
    texto.includes("unique constraint")
  );
}

function conflitoEnvolveNumeroProposta(error: any): boolean {
  const texto = `${String(error?.message || "")} ${String(error?.details || "")} ${String(error?.hint || "")}`.toLowerCase();
  return (
    texto.includes("numero") ||
    texto.includes("propostas_numero") ||
    texto.includes("propostas_numero_key")
  );
}

function ehFkClienteLegadoInvalido(error: any): boolean {
  const code = String(error?.code || "").toUpperCase();
  const texto = `${String(error?.message || "")} ${String(error?.details || "")} ${String(error?.hint || "")}`.toLowerCase();
  return (
    code === "23503" &&
    (texto.includes("propostas_cliente_id_fkey") || texto.includes("cliente_id_fkey")) &&
    texto.includes("clientes")
  );
}

async function resolverClienteIdLegado(clienteIdAtual?: string | null): Promise<string | null> {
  const clienteId = (clienteIdAtual || "").trim();
  if (!clienteId) return null;

  // 1) Se o ID já existe em clientes, usa ele.
  try {
    const { data } = await supabase
      .from("clientes")
      .select("id")
      .eq("id", clienteId)
      .maybeSingle();
    if (data?.id) return data.id as string;
  } catch (err) {
    console.warn("[resolverClienteIdLegado] Falha ao validar ID direto em clientes:", err);
  }

  // 2) Busca dados da pessoa para tentar mapear no legado.
  let pessoa: any = null;
  try {
    const { data } = await supabase
      .from("pessoas")
      .select("id, nome, email, telefone, cpf, cnpj")
      .eq("id", clienteId)
      .maybeSingle();
    pessoa = data || null;
  } catch (err) {
    console.warn("[resolverClienteIdLegado] Falha ao buscar pessoa para mapeamento:", err);
  }

  if (!pessoa) return null;

  const buscarPorCampo = async (campo: string, valor: string) => {
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id")
        .eq(campo as any, valor as any)
        .limit(1)
        .maybeSingle();
      if (!error && data?.id) return data.id as string;
    } catch (err) {
      // Ignora para ambientes onde a coluna não existe no legado.
      console.warn(`[resolverClienteIdLegado] Busca por ${campo} indisponivel:`, err);
    }
    return null;
  };

  const cpf = String(pessoa.cpf || "").trim();
  const cnpj = String(pessoa.cnpj || "").trim();
  const email = String(pessoa.email || "").trim();
  const nome = String(pessoa.nome || "").trim();

  if (cpf) {
    const idPorCpf = await buscarPorCampo("cpf", cpf);
    if (idPorCpf) return idPorCpf;
  }
  if (cnpj) {
    const idPorCnpj = await buscarPorCampo("cnpj", cnpj);
    if (idPorCnpj) return idPorCnpj;
  }
  if (email) {
    const idPorEmail = await buscarPorCampo("email", email);
    if (idPorEmail) return idPorEmail;
  }
  if (nome) {
    const idPorNome = await buscarPorCampo("nome", nome);
    if (idPorNome) return idPorNome;
  }

  return null;
}

function extrairColunaNotNull(error: any): string | null {
  const mensagem = String(error?.message || "");
  const details = String(error?.details || "");
  const match =
    mensagem.match(/null value in column\s+"([^"]+)"/i) ||
    details.match(/column\s+"([^"]+)"/i);
  return match?.[1] || null;
}

function valorPadraoColunaClienteLegado(coluna: string, pessoa: any): any {
  const agoraIso = new Date().toISOString();
  const mapa: Record<string, any> = {
    id: pessoa?.id || null,
    nome: pessoa?.nome || "Cliente",
    email: pessoa?.email || null,
    telefone: pessoa?.telefone || null,
    cpf: pessoa?.cpf || null,
    cnpj: pessoa?.cnpj || null,
    tipo: "CLIENTE",
    status: "ativo",
    ativo: true,
    created_at: agoraIso,
    updated_at: agoraIso,
  };
  return Object.prototype.hasOwnProperty.call(mapa, coluna) ? mapa[coluna] : null;
}

async function criarClienteLegadoAPartirPessoa(clienteIdPessoa: string): Promise<string | null> {
  const { data: pessoa } = await supabase
    .from("pessoas")
    .select("id, nome, email, telefone, cpf, cnpj")
    .eq("id", clienteIdPessoa)
    .maybeSingle();

  if (!pessoa?.id) return null;

  let payload: Record<string, any> = {
    id: pessoa.id,
    nome: pessoa.nome || "Cliente",
    email: pessoa.email || null,
    telefone: pessoa.telefone || null,
    cpf: pessoa.cpf || null,
    cnpj: pessoa.cnpj || null,
    tipo: "CLIENTE",
    status: "ativo",
    ativo: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  for (let tentativa = 1; tentativa <= 5; tentativa += 1) {
    const { data, error } = await supabase
      .from("clientes")
      .insert(payload as any)
      .select("id")
      .maybeSingle();

    if (!error) {
      return (data?.id as string) || pessoa.id;
    }

    // Já existe no legado: resolve e retorna.
    if (String(error?.code || "").toUpperCase() === "23505") {
      const existente = await resolverClienteIdLegado(clienteIdPessoa);
      if (existente) return existente;
    }

    const colunaInexistente = extrairColunaInexistente(error);
    if (colunaInexistente && colunaInexistente in payload) {
      const { [colunaInexistente]: _drop, ...restante } = payload;
      payload = restante;
      continue;
    }

    const colunaNotNull = extrairColunaNotNull(error);
    if (colunaNotNull && !(colunaNotNull in payload)) {
      const valor = valorPadraoColunaClienteLegado(colunaNotNull, pessoa);
      if (valor !== null) {
        payload[colunaNotNull] = valor;
        continue;
      }
    }

    // Erro de contrato inválido no on_conflict/endpoint não recuperável por retry.
    const textoErro = `${String(error?.message || "")} ${String(error?.details || "")}`.toLowerCase();
    if (textoErro.includes("on conflict") || textoErro.includes("there is no unique or exclusion constraint")) {
      console.warn("[criarClienteLegadoAPartirPessoa] Insert legado não suporta on conflict/constraint esperada. Abortando retries.");
      return null;
    }

    console.warn("[criarClienteLegadoAPartirPessoa] Falha ao criar cliente legado:", {
      code: error?.code,
      message: error?.message,
      details: error?.details,
      hint: error?.hint,
      payload,
    });
    return null;
  }

  return null;
}

// ============================================================
// PROPOSTAS
// ============================================================

export async function listarPropostas(): Promise<PropostaCompleta[]> {
  // Usar vw_propostas_detalhadas para resolver nome do cliente via COALESCE(pessoas, clientes legado)
  const PAGE_SIZE = 1000;
  let allData: any[] = [];
  let page = 0;
  let hasMore = true;

  while (hasMore) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from("vw_propostas_detalhadas")
      .select("id, numero, titulo, status, valor_total, valor_materiais, valor_mao_obra, nucleo, nucleo_id, oportunidade_id, criado_em, created_at, enviada_em, visualizada_em, arquivada_em, forma_pagamento, percentual_entrada, numero_parcelas, prazo_execucao_dias, validade_dias, exibir_valores, cliente_id, pessoa_id, obra_id, created_by, nome_cliente_resolvido, cliente_avatar_url, email_cliente_resolvido, criador_nome")
      .order("criado_em", { ascending: false })
      .range(from, to);

    if (error) throw error;
    const rows = data ?? [];
    allData = allData.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    page++;
  }

  return allData.map((row: any) => ({
    ...row,
    cliente_nome: row.nome_cliente_resolvido || "Cliente não encontrado",
    cliente_avatar_url: row.cliente_avatar_url || null,
    itens: [], // Itens carregados separadamente quando necessário
  }));
}

export async function buscarProposta(id: string): Promise<PropostaCompleta> {
  const propostaId = (id || "").trim();
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(propostaId)) {
    throw new Error(`ID de proposta inválido: "${id}"`);
  }

  // Buscar proposta
  const { data: proposta, error: propostaError, status: propostaStatus } = await supabase
    .from("propostas")
    .select("*")
    .eq("id", propostaId)
    .maybeSingle();

  if (propostaError) {
    const mensagem = [
      `Erro ao buscar proposta ${propostaId}`,
      `status=${propostaStatus || "N/A"}`,
      `code=${(propostaError as any)?.code || "N/A"}`,
      `msg=${propostaError.message || "N/A"}`,
      (propostaError as any)?.hint ? `hint=${(propostaError as any).hint}` : null,
      (propostaError as any)?.details ? `details=${(propostaError as any).details}` : null,
    ].filter(Boolean).join(" | ");
    console.error("[buscarProposta]", mensagem, propostaError);
    throw new Error(mensagem);
  }
  if (!proposta) throw new Error(`Proposta não encontrada: ${propostaId}`);

  // Buscar nome e avatar do cliente via vw_propostas_detalhadas (resolve pessoas E legado)
  let clienteNome = "Cliente não encontrado";
  let clienteAvatarUrl: string | null = null;
  {
    const { data: propostaView } = await supabase
      .from("vw_propostas_detalhadas")
      .select("nome_cliente_resolvido, cliente_avatar_url, email_cliente_resolvido")
      .eq("id", propostaId)
      .maybeSingle();

    if (propostaView?.nome_cliente_resolvido) {
      clienteNome = propostaView.nome_cliente_resolvido;
      clienteAvatarUrl = propostaView.cliente_avatar_url || null;
    }
  }

  // Buscar itens da proposta.
  // Em alguns ambientes o PostgREST nao enxerga a relacao (FK) entre propostas_itens e pricelist_itens,
  // entao tentamos o JOIN embutido e fazemos fallback para um fetch separado quando necessario.
  const selectComPricelist = `
      *,
      pricelist:pricelist_itens!pricelist_item_id(
        id,
        codigo,
        nome,
        descricao,
        categoria,
        categoria_id,
        subcategoria_id,
        tipo,
        unidade,
        nucleo_id,
        imagem_url
      )
    `;

  let itens: any[] = [];

  const { data: itensJoin, error: itensJoinError, status: itensJoinStatus } = await supabase
    .from("propostas_itens")
    .select(selectComPricelist)
    .eq("proposta_id", propostaId)
    .order("ordem", { ascending: true });

  console.log(`[buscarProposta] Query JOIN: status=${itensJoinStatus}, data=${itensJoin?.length ?? "null"}, error=${itensJoinError ? JSON.stringify({ code: (itensJoinError as any)?.code, msg: itensJoinError.message }) : "none"}`);

  if (itensJoinError) {
    const errCode = (itensJoinError as any)?.code;
    // Fallback sem JOIN para qualquer erro de schema/relaçÍo PostgREST
    console.warn(`[buscarProposta] Erro na query JOIN (code=${errCode}), tentando fallback sem JOIN...`);
    const { data: itensSemJoin, error: itensSemJoinError, status: itensSemJoinStatus } = await supabase
      .from("propostas_itens")
      .select("*")
      .eq("proposta_id", propostaId)
      .order("ordem", { ascending: true });

    console.log(`[buscarProposta] Query fallback: status=${itensSemJoinStatus}, data=${itensSemJoin?.length ?? "null"}, error=${itensSemJoinError ? JSON.stringify({ code: (itensSemJoinError as any)?.code, msg: itensSemJoinError.message }) : "none"}`);

    if (itensSemJoinError) throw itensSemJoinError;
    itens = (itensSemJoin || []) as any[];
  } else {
    itens = (itensJoin || []) as any[];
  }

  // Alguns fluxos podem arquivar os itens em propostas_itens_backup (sem FK/relacionamentos).
  // Se nao retornou nenhum item da tabela principal, tentar recuperar do backup.
  if (!itens || itens.length === 0) {
    console.warn(`[buscarProposta] 0 itens na tabela principal para proposta ${propostaId}. Tentando backup...`);

    // Diagnóstico: contar quantos itens existem sem filtros complexos
    const { count: rawCount } = await supabase
      .from("propostas_itens")
      .select("id", { count: "exact", head: true })
      .eq("proposta_id", propostaId);
    console.log(`[buscarProposta] COUNT direto propostas_itens: ${rawCount ?? "null"}`);

    const { data: itensBackup, error: itensBackupError } = await supabase
      .from("propostas_itens_backup")
      .select("*")
      .eq("proposta_id", propostaId)
      .order("ordem", { ascending: true });

    console.log(`[buscarProposta] Backup: data=${itensBackup?.length ?? "null"}, error=${itensBackupError ? itensBackupError.message : "none"}`);

    if (!itensBackupError && itensBackup && itensBackup.length > 0) {
      itens = itensBackup as any[];
      console.warn("[buscarProposta] Itens carregados via propostas_itens_backup:", itens.length);
    }

    // Se COUNT mostra itens mas data veio vazio, tentar query mínima
    if (rawCount && rawCount > 0 && itens.length === 0) {
      console.warn(`[buscarProposta] COUNT=${rawCount} mas data vazio! Tentando query mínima...`);
      const { data: itensMinimos, error: itensMinimosError } = await supabase
        .from("propostas_itens")
        .select("id, proposta_id, pricelist_item_id, quantidade, valor_unitario, ordem")
        .eq("proposta_id", propostaId)
        .order("ordem", { ascending: true });

      console.log(`[buscarProposta] Query mínima: data=${itensMinimos?.length ?? "null"}, error=${itensMinimosError ? itensMinimosError.message : "none"}`);

      if (!itensMinimosError && itensMinimos && itensMinimos.length > 0) {
        itens = itensMinimos as any[];
        console.warn("[buscarProposta] Itens carregados via query mínima (colunas básicas):", itens.length);
      }
    }
  }

  // Montar mapa do pricelist (dados do JOIN + fallback via IN())
  let pricelistMap: Record<string, any> = {};
  for (const item of itens) {
    if (item?.pricelist?.id) {
      pricelistMap[item.pricelist.id] = item.pricelist;
    }
  }

  const pricelistIds = [
    ...new Set((itens || []).map((i: any) => i.pricelist_item_id).filter(Boolean)),
  ];
  const pricelistIdsParaBuscar = pricelistIds.filter((pid: string) => !pricelistMap[pid]);

  if (pricelistIdsParaBuscar.length > 0) {
    const { data: pricelistRows, error: pricelistError } = await supabase
      .from("pricelist_itens")
      .select("id,codigo,nome,descricao,categoria,categoria_id,subcategoria_id,tipo,unidade,nucleo_id,imagem_url")
      .in("id", pricelistIdsParaBuscar);

    if (pricelistError) throw pricelistError;
    if (pricelistRows) {
      for (const pl of pricelistRows as any[]) {
        if (pl?.id) pricelistMap[pl.id] = pl;
      }
    }
  }

  // Buscar nucleos separadamente (evita erro de FK)
  const nucleoIds = [
    ...new Set(
      (itens || [])
        .map((i: any) => (i.pricelist?.nucleo_id ?? pricelistMap[i.pricelist_item_id]?.nucleo_id))
        .filter(Boolean)
    ),
  ];
  let nucleosMap: Record<string, string> = {};
  if (nucleoIds.length > 0) {
    const { data: nucleos } = await supabase
      .from("nucleos")
      .select("id, nome")
      .in("id", nucleoIds);
    if (nucleos) {
      nucleosMap = Object.fromEntries(nucleos.map(n => [n.id, n.nome]));
    }
  }

  // Mesclar dados do item da proposta com dados do pricelist
  const itensCompletos = (itens || []).map((item: any) => {
    const pricelist = item.pricelist || (item.pricelist_item_id ? pricelistMap[item.pricelist_item_id] : undefined);

    return {
      ...item,
      // Normalizar para sempre ter o objeto pricelist quando existir referencia.
      pricelist,
      // Se tiver dados do pricelist, mesclar com os dados do item
      nome: item.nome || pricelist?.nome || "Item sem nome",
      descricao: item.descricao || pricelist?.descricao || "",
      categoria: item.categoria || pricelist?.categoria || "",
      tipo: item.tipo || pricelist?.tipo || "material",
      unidade: item.unidade || pricelist?.unidade || "un",
      // Usar nome do nucleo do mapa
      nucleo: item.nucleo || (pricelist?.nucleo_id ? nucleosMap[pricelist.nucleo_id] : undefined),
      nucleo_id: item.nucleo_id || pricelist?.nucleo_id || undefined,
      categoria_id: item.categoria_id || pricelist?.categoria_id || undefined,
      subcategoria_id: item.subcategoria_id || pricelist?.subcategoria_id || undefined,
      codigo: item.codigo || pricelist?.codigo || "",
      imagem_url: item.imagem_url || pricelist?.imagem_url || undefined,
    };
  });

  return {
    ...proposta,
    cliente_nome: clienteNome,
    cliente_avatar_url: clienteAvatarUrl,
    itens: itensCompletos,
  };
}

export async function criarProposta(
  dados: PropostaFormData,
  itens: PropostaItemInput[] = []
): Promise<PropostaCompleta> {
  const { itens: itensSanitizados, descartes } = sanitizarItensParaPersistencia(itens);
  const totalDescartado = Object.values(descartes).reduce((acc, atual) => acc + atual, 0);
  if (totalDescartado > 0) {
    console.warn("[criarProposta] Itens descartados na validaçÍo:", descartes);
  }

  if (itens.length > 0 && itensSanitizados.length === 0) {
    throw new Error("Nenhum item válido para criar proposta após validaçÍo.");
  }

  // Calcular totais
  const totais = itensSanitizados.reduce(
    (acc, item) => {
      const subtotal = item.quantidade * item.valor_unitario;
      if (item.tipo === "material") {
        acc.materiais += subtotal;
      } else if (item.tipo === "mao_obra") {
        acc.maoObra += subtotal;
      } else {
        acc.materiais += subtotal / 2;
        acc.maoObra += subtotal / 2;
      }
      acc.total += subtotal;
      return acc;
    },
    { materiais: 0, maoObra: 0, total: 0 }
  );



  // Buscar usuário autenticado (auth_user_id é usado como created_by → auth.users)
  const { data: { user } } = await supabase.auth.getUser();
  const { data: { session } } = await supabase.auth.getSession();
  let pessoaId: string | null = null;
  const authUserId: string | null = user?.id || session?.user?.id || null;
  if (authUserId) {
    // Buscar pessoa vinculada ao auth_user_id
    const { data: usuario } = await supabase
      .from("usuarios")
      .select("pessoa_id")
      .eq("auth_user_id", authUserId)
      .single();
    pessoaId = usuario?.pessoa_id || null;
  }

  // ValidaçÍo básica do payload

  if (!dados.cliente_id || !dados.titulo) {
    throw new Error("Campos obrigatórios faltando para criar proposta (cliente_id ou titulo).");
  }

  if (!authUserId || typeof authUserId !== 'string' || authUserId.length < 10) {
    throw new Error("não foi possível identificar o autor da proposta (created_by ausente ou inválido). Faça login novamente ou contate o suporte.");
  }

  // Tenta gerar o numero explicitamente para evitar propostas sem numero no compartilhamento.
  let numeroGerado: string | null = null;
  try {
    const { data: numeroRpc, error: numeroRpcError } = await supabase.rpc("gerar_numero_proposta");
    if (!numeroRpcError && typeof numeroRpc === "string" && numeroRpc.trim().length > 0) {
      numeroGerado = numeroRpc.trim();
    } else if (numeroRpcError) {
      console.warn("[criarProposta] Falha ao gerar numero via RPC:", numeroRpcError);
    }
  } catch (err) {
    console.warn("[criarProposta] Erro inesperado ao gerar numero da proposta:", err);
  }

  const payload: Record<string, any> = {
    cliente_id: dados.cliente_id,
    oportunidade_id: dados.oportunidade_id || null,
    titulo: dados.titulo,
    descricao: dados.descricao || null,
    forma_pagamento: dados.forma_pagamento || 'parcelado',
    percentual_entrada: dados.percentual_entrada || 30,
    numero_parcelas: dados.numero_parcelas || 3,
    validade_dias: dados.validade_dias || 30,
    prazo_execucao_dias: dados.prazo_execucao_dias || 60,
    valor_materiais: totais.materiais,
    valor_mao_obra: totais.maoObra,
    valor_total: totais.total,
    exibir_valores: dados.exibir_valores ?? true,
    status: 'rascunho',
    created_by: authUserId,
  };
  if (numeroGerado) payload.numero = numeroGerado;
  // Log para debug
  if (typeof window !== 'undefined') console.log('Payload proposta:', payload);

  // Criar proposta usando INSERT direto com header Accept forçado
  let payloadInsercao: Record<string, any> = { ...payload };
  let novaProposta: any = null;
  for (let tentativa = 1; tentativa <= Object.keys(payload).length + 1; tentativa += 1) {
    const { data, error } = await supabase
      .from("propostas")
      .insert(payloadInsercao as any)
      .select()
      .single();

    if (!error) {
      novaProposta = data;
      break;
    }

    const coluna = extrairColunaInexistente(error);
    if (coluna && coluna in payloadInsercao) {
      const { [coluna]: _removida, ...restante } = payloadInsercao;
      payloadInsercao = restante;
      console.warn(`[criarProposta] Coluna ausente em propostas (${coluna}), removendo do payload e tentando novamente.`);
      continue;
    }

    if (ehFkClienteLegadoInvalido(error)) {
      const clienteOriginal = String(payloadInsercao.cliente_id || "");
      const clienteLegadoId = await resolverClienteIdLegado(clienteOriginal);
      if (clienteLegadoId && clienteLegadoId !== clienteOriginal) {
        payloadInsercao = {
          ...payloadInsercao,
          cliente_id: clienteLegadoId,
        };
        console.warn(`[criarProposta] cliente_id ajustado para compatibilidade legado: ${clienteOriginal} -> ${clienteLegadoId}`);
        continue;
      }

      const clienteCriadoId = await criarClienteLegadoAPartirPessoa(clienteOriginal);
      if (clienteCriadoId) {
        payloadInsercao = {
          ...payloadInsercao,
          cliente_id: clienteCriadoId,
        };
        console.warn(`[criarProposta] Cliente legado criado automaticamente: ${clienteOriginal} -> ${clienteCriadoId}`);
        continue;
      }

      console.warn("[criarProposta] Nao foi possivel resolver cliente_id na tabela clientes (legado).", {
        cliente_id: clienteOriginal,
      });
    }

    if (ehConflitoUnicidade(error)) {
      console.warn("[criarProposta] Conflito de unicidade ao inserir proposta:", {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        payloadInsercao,
      });

      // Caso clássico de ambiente concorrente: número duplicado.
      // Regenera e tenta novamente sem interromper o usuário.
      if (conflitoEnvolveNumeroProposta(error) && tentativa <= 5) {
        try {
          const { data: novoNumero, error: novoNumeroError } = await supabase.rpc("gerar_numero_proposta");
          if (!novoNumeroError && typeof novoNumero === "string" && novoNumero.trim().length > 0) {
            payloadInsercao = {
              ...payloadInsercao,
              numero: novoNumero.trim(),
            };
            console.warn(`[criarProposta] Regerando número após conflito (tentativa ${tentativa}): ${payloadInsercao.numero}`);
            continue;
          }
        } catch (erroNumero) {
          console.warn("[criarProposta] Falha ao regenerar número após conflito:", erroNumero);
        }

        // Último fallback: deixa o banco gerar número por trigger/default, quando existir.
        const { numero: _numero, ...semNumero } = payloadInsercao;
        payloadInsercao = semNumero;
        console.warn("[criarProposta] Tentando inserir sem campo numero após conflito.");
        continue;
      }
    }

    const mensagemErro = [
      "Erro ao criar proposta",
      `status=${String(error?.status || "N/A")}`,
      `code=${String(error?.code || "N/A")}`,
      `msg=${String(error?.message || "N/A")}`,
      error?.details ? `details=${String(error.details)}` : null,
      error?.hint ? `hint=${String(error.hint)}` : null,
    ].filter(Boolean).join(" | ");
    console.error("[criarProposta] Falha definitiva no insert:", mensagemErro, error);
    throw new Error(mensagemErro);
  }

  if (!novaProposta) throw new Error("Erro ao criar proposta");

  // Usar a proposta criada
  const proposta = novaProposta as Record<string, any>;

  // Fallback: se ainda ficou sem numero, tenta gerar e persistir imediatamente.
  if (!proposta.numero) {
    try {
      const { data: numeroFallback, error: numeroFallbackError } = await supabase.rpc("gerar_numero_proposta");
      if (!numeroFallbackError && typeof numeroFallback === "string" && numeroFallback.trim().length > 0) {
        const numero = numeroFallback.trim();
        proposta.numero = numero;
        await supabase
          .from("propostas")
          .update({ numero, updated_at: new Date().toISOString() })
          .eq("id", proposta.id);
      } else if (numeroFallbackError) {
        console.warn("[criarProposta] Fallback de numero falhou:", numeroFallbackError);
      }
    } catch (err) {
      console.warn("[criarProposta] Erro no fallback de numero:", err);
    }
  }

  // Criar itens da proposta
  if (itensSanitizados.length > 0) {
    const itensParaInserir = itensSanitizados.map((item, index) => {
      const row: Record<string, any> = {
        proposta_id: proposta.id,
        pricelist_item_id: item.pricelist_item_id,
        nome: item.nome,
        descricao: item.descricao,
        descricao_customizada: item.descricao_customizada || null,
        categoria: item.categoria,
        tipo: item.tipo,
        contratado_pelo_cliente: inferirContratadoPeloClienteProposta(item),
        unidade: item.unidade,
        quantidade: item.quantidade,
        valor_unitario: item.valor_unitario,
        ordem: item.ordem ?? index,
        nucleo: item.nucleo ?? null,
      };
      if (item.ambiente_id) row.ambiente_id = item.ambiente_id;
      return row;
    });

    let itensParaInserirAtual = itensParaInserir.map((item) => ({ ...item }));
    for (let tentativa = 1; tentativa <= 20; tentativa += 1) {
      const { error: itensError } = await supabase
        .from("propostas_itens")
        .insert(itensParaInserirAtual as any);

      if (!itensError) break;

      const coluna = extrairColunaInexistente(itensError);
      const colunaExisteNoPayload = coluna
        ? itensParaInserirAtual.some((item) => Object.prototype.hasOwnProperty.call(item, coluna))
        : false;

      if (coluna && colunaExisteNoPayload) {
        itensParaInserirAtual = itensParaInserirAtual.map((item) => {
          const { [coluna]: _removida, ...restante } = item;
          return restante;
        });
        console.warn(`[criarProposta] Coluna ausente em propostas_itens (${coluna}), removendo do payload e tentando novamente.`);
        continue;
      }

      throw itensError;
    }
  }

  // Retornar proposta completa
  return buscarProposta(proposta.id);
}

export async function atualizarProposta(
  id: string,
  dados: Partial<PropostaFormData> & Record<string, any>
): Promise<Proposta> {
  const propostaId = (id || "").trim();
  const payloadInicial = Object.fromEntries(
    Object.entries(dados || {}).filter(([, value]) => value !== undefined)
  );

  let payloadAtual: Record<string, any> = { ...payloadInicial };
  const maxTentativas = Object.keys(payloadAtual).length + 1;
  let tentativa = 0;
  let data: any = null;
  let error: any = null;

  while (tentativa < maxTentativas) {
    tentativa += 1;

    // Nada para atualizar (todas as colunas opcionais foram removidas por fallback)
    if (Object.keys(payloadAtual).length === 0) {
      const { data: propostaExistente, error: errExistente } = await supabase
        .from("propostas")
        .select("*")
        .eq("id", propostaId)
        .single();
      if (errExistente) throw errExistente;
      if (!propostaExistente) throw new Error("Proposta não encontrada");
      return propostaExistente as Proposta;
    }

    ({ data, error } = await supabase
      .from("propostas")
      .update(payloadAtual)
      .eq("id", propostaId)
      .select()
      .single());

    if (!error) break;

    // ProduçÍo pode estar sem alguma coluna de migrations recentes.
    // Se for coluna inexistente, remove do payload e tenta novamente.
    const mensagemErro = String(error.message || "");
    const detalhesErro = String((error as any)?.details || "");
    const hintErro = String((error as any)?.hint || "");
    const textoErroCompleto = `${mensagemErro} ${detalhesErro} ${hintErro}`.toLowerCase();

    const matchColuna = mensagemErro.match(/column\s+"([^"]+)"/i)
      || mensagemErro.match(/Could not find the '([^']+)' column/i)
      || detalhesErro.match(/column\s+"([^"]+)"/i)
      || detalhesErro.match(/'([^']+)'/)
      || mensagemErro.match(/'([^']+)'/);
    const coluna = matchColuna?.[1];
    const code = String(error.code || "").toUpperCase();
    const colunaInexistente =
      code === "42703" ||
      code === "PGRST204" ||
      textoErroCompleto.includes("does not exist") ||
      textoErroCompleto.includes("could not find the") ||
      textoErroCompleto.includes("schema cache");

    if (colunaInexistente && coluna && coluna in payloadAtual) {
      const { [coluna]: _omit, ...resto } = payloadAtual;
      payloadAtual = resto;
      continue;
    }

    // Ambiente legado pode ter tipo incompatível para valor_raw (espera numeric em vez de JSON/texto).
    if (
      code === "22P02" &&
      "valor_raw" in payloadAtual &&
      typeof payloadAtual.valor_raw === "string" &&
      payloadAtual.valor_raw.trim().startsWith("{")
    ) {
      const { valor_raw: _omitValorRaw, ...resto } = payloadAtual;
      payloadAtual = resto;
      console.warn("[atualizarProposta] Removendo valor_raw por incompatibilidade de tipo no banco legado.");
      continue;
    }

    const mensagem = [
      `Erro ao atualizar proposta ${propostaId}`,
      `status=${(error as any)?.status || "N/A"}`,
      `code=${(error as any)?.code || "N/A"}`,
      `msg=${error.message || "N/A"}`,
      (error as any)?.hint ? `hint=${(error as any).hint}` : null,
      (error as any)?.details ? `details=${(error as any).details}` : null,
    ].filter(Boolean).join(" | ");
    throw new Error(mensagem);
  }

  if (error) {
    const mensagem = [
      `Erro ao atualizar proposta ${propostaId}`,
      `code=${(error as any)?.code || "N/A"}`,
      `msg=${error.message || "N/A"}`,
    ].join(" | ");
    throw new Error(mensagem);
  }

  if (!data) throw new Error("Proposta não encontrada");
  return data;
}

export async function atualizarStatusProposta(
  id: string,
  status: string
): Promise<Proposta> {
  const { data, error } = await supabase
    .from("propostas")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Proposta não encontrada");

  return data;
}

export async function deletarProposta(id: string): Promise<void> {
  const { error } = await supabase.from("propostas").delete().eq("id", id);

  if (error) throw error;
}

/**
 * Gerar número de revisÍo para proposta duplicada
 * Formato: NÚCLEO/DATA-SEQ#CLIENTE/REV01
 */
async function gerarNumeroRevisao(
  numeroOriginal: string | null,
  clienteId: string,
  nucleo: string
): Promise<string | null> {
  if (!numeroOriginal) return null;

  // Buscar todas as propostas com o mesmo número base (original + revisões)
  const numeroBase = numeroOriginal.split("/REV")[0]; // Remove /REV01, /REV02, etc.

  const { data: propostas } = await supabase
    .from("propostas")
    .select("numero")
    .eq("cliente_id", clienteId)
    .ilike("numero", `${numeroBase}%`)
    .order("numero", { ascending: false });

  if (!propostas || propostas.length === 0) {
    // Primeira revisÍo
    return `${numeroBase}/REV01`;
  }

  // Encontrar o maior número de revisÍo
  let maiorRevisao = 0;
  propostas.forEach((p) => {
    if (p.numero) {
      const match = p.numero.match(/\/REV(\d+)$/);
      if (match) {
        const numRevisao = parseInt(match[1], 10);
        if (numRevisao > maiorRevisao) {
          maiorRevisao = numRevisao;
        }
      }
    }
  });

  // Próxima revisÍo
  const proximaRevisao = (maiorRevisao + 1).toString().padStart(2, "0");
  return `${numeroBase}/REV${proximaRevisao}`;
}

/**
 * Duplicar uma proposta existente (cópia completa com todos os itens)
 */
export async function duplicarProposta(id: string): Promise<string> {
  // 1. Buscar proposta original
  const propostaOriginal = await buscarProposta(id);

  // 2. Gerar número de revisÍo
  const numeroRevisao = await gerarNumeroRevisao(
    propostaOriginal.numero ?? null,
    propostaOriginal.cliente_id,
    propostaOriginal.nucleo || ""
  );

  // Buscar auth user para popular created_by
  const { data: { user } } = await supabase.auth.getUser();
  const authUserId = user?.id || null;

  // 3. Criar nova proposta (sem ID, com numero de revisÍo, status rascunho)
  const { data: novaProposta, error: erroproposta } = await supabase
    .from("propostas")
    .insert({
      cliente_id: propostaOriginal.cliente_id,
      titulo: propostaOriginal.titulo,
      descricao: propostaOriginal.descricao,
      valor_total: propostaOriginal.valor_total,
      valor_materiais: propostaOriginal.valor_materiais,
      valor_mao_obra: propostaOriginal.valor_mao_obra,
      numero_parcelas: propostaOriginal.numero_parcelas,
      percentual_entrada: propostaOriginal.percentual_entrada,
      forma_pagamento: propostaOriginal.forma_pagamento,
      prazo_execucao_dias: propostaOriginal.prazo_execucao_dias,
      validade_dias: propostaOriginal.validade_dias,
      exibir_valores: propostaOriginal.exibir_valores,
      status: "rascunho",
      nucleo: propostaOriginal.nucleo,
      numero: numeroRevisao,
      created_by: authUserId,
    })
    .select()
    .single();

  if (erroproposta) throw erroproposta;
  if (!novaProposta) throw new Error("Erro ao criar cópia da proposta");

  // 3. Copiar todos os itens (valor_subtotal é calculado automaticamente)
  if (propostaOriginal.itens && propostaOriginal.itens.length > 0) {
    const itensParaCopiar = propostaOriginal.itens.map((item: any) => ({
      proposta_id: novaProposta.id,
      pricelist_item_id: item.pricelist_item_id,
      nome: item.nome,
      descricao: item.descricao,
      descricao_customizada: item.descricao_customizada,
      quantidade: item.quantidade,
      unidade: item.unidade,
      valor_unitario: item.valor_unitario,
      contratado_pelo_cliente: inferirContratadoPeloClienteProposta(item),
      // valor_subtotal: REMOVIDO - é coluna calculada automaticamente (quantidade * valor_unitario)
      categoria: item.categoria,
      tipo: item.tipo,
      nucleo: item.nucleo,
      ordem: item.ordem,
    }));

    const { error: erroItens } = await supabase
      .from("propostas_itens")
      .insert(itensParaCopiar);

    if (erroItens) throw erroItens;
  }

  return novaProposta.id;
}

// ============================================================
// ITENS DA PROPOSTA
// ============================================================

export async function adicionarItemProposta(
  propostaId: string,
  item: PropostaItemInput
): Promise<PropostaItem> {
  const { itens: itensSanitizados } = sanitizarItensParaPersistencia([item]);
  if (itensSanitizados.length === 0) {
    throw new Error("Item inválido para inclusÍo na proposta.");
  }
  const itemSanitizado = itensSanitizados[0];

  const row: Record<string, any> = {
    proposta_id: propostaId,
    pricelist_item_id: itemSanitizado.pricelist_item_id,
    nome: itemSanitizado.nome,
    descricao: itemSanitizado.descricao,
    descricao_customizada: itemSanitizado.descricao_customizada || null,
    categoria: itemSanitizado.categoria,
    tipo: itemSanitizado.tipo,
    contratado_pelo_cliente: inferirContratadoPeloClienteProposta(itemSanitizado),
    unidade: itemSanitizado.unidade,
    quantidade: itemSanitizado.quantidade,
    valor_unitario: itemSanitizado.valor_unitario,
    ordem: itemSanitizado.ordem || 0,
    nucleo: itemSanitizado.nucleo ?? null,
  };
  if (itemSanitizado.ambiente_id) row.ambiente_id = itemSanitizado.ambiente_id;

  const { data, error } = await supabase
    .from("propostas_itens")
    .insert(row)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Erro ao adicionar item");

  return data;
}

export async function atualizarItemProposta(
  itemId: string,
  dados: Partial<PropostaItemInput>
): Promise<PropostaItem> {
  const { data, error } = await supabase
    .from("propostas_itens")
    .update(dados)
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error("Item não encontrado");

  return data;
}

export async function deletarItemProposta(itemId: string): Promise<void> {
  const { error } = await supabase
    .from("propostas_itens")
    .delete()
    .eq("id", itemId);

  if (error) throw error;
}

// ============================================================
// SINCRONIZAR ITENS COM PRICELIST
// Atualiza categoria, núcleo e tipo dos itens das propostas
// com base nos dados atuais do pricelist
// ============================================================

export interface SincronizacaoResultado {
  total: number;
  atualizados: number;
  erros: number;
  detalhes: string[];
}

// Tipos válidos para propostas_itens.tipo (conforme ENUM ou CHECK constraint)
const TIPOS_VALIDOS = ['material', 'mao_obra', 'ambos', 'servico', 'produto'];

// Núcleos válidos para propostas_itens.nucleo (conforme CHECK constraint)
const NUCLEOS_VALIDOS = ['arquitetura', 'engenharia', 'marcenaria', 'produtos'];

/**
 * Mapeia tipo do pricelist para tipo válido em propostas_itens
 */
function mapearTipoValido(tipo: string | null): string | null {
  if (!tipo) return null;

  const tipoLower = tipo.toLowerCase().trim();

  // Se já é um tipo válido, retornar
  if (TIPOS_VALIDOS.includes(tipoLower)) {
    return tipoLower;
  }

  // Mapeamentos comuns
  const mapeamentos: Record<string, string> = {
    'mÍo de obra': 'mao_obra',
    'mao de obra': 'mao_obra',
    'mÍo-de-obra': 'mao_obra',
    'mao-de-obra': 'mao_obra',
    'serviço': 'servico',
    'service': 'servico',
    'materials': 'material',
    'produtos': 'produto',
    'product': 'produto',
    'both': 'ambos',
  };

  if (mapeamentos[tipoLower]) {
    return mapeamentos[tipoLower];
  }

  // Default: material (mais comum)
  console.warn(`[Sync] Tipo "${tipo}" não reconhecido, usando "material"`);
  return 'material';
}

/**
 * Mapeia nome do núcleo para código válido em propostas_itens
 */
function mapearNucleoValido(nucleo: string | null): string | null {
  if (!nucleo) return null;

  const nucleoLower = nucleo.toLowerCase().trim();

  // Se já é um código válido, retornar
  if (NUCLEOS_VALIDOS.includes(nucleoLower)) {
    return nucleoLower;
  }

  // Mapeamentos de nomes para códigos
  const mapeamentos: Record<string, string> = {
    'arquitetura': 'arquitetura',
    'engenharia': 'engenharia',
    'marcenaria': 'marcenaria',
    'produtos': 'produtos',
    // Variações comuns
    'arq': 'arquitetura',
    'eng': 'engenharia',
    'marc': 'marcenaria',
    'prod': 'produtos',
  };

  if (mapeamentos[nucleoLower]) {
    return mapeamentos[nucleoLower];
  }

  // Tentar normalizar removendo acentos
  const nucleoNormalizado = nucleoLower
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (NUCLEOS_VALIDOS.includes(nucleoNormalizado)) {
    return nucleoNormalizado;
  }

  console.warn(`[Sync] Núcleo "${nucleo}" não reconhecido, ignorando`);
  return null;
}

/**
 * Sincroniza TODOS os itens de propostas com o pricelist atual
 * Atualiza os campos que existirem na tabela
 */
export async function sincronizarItensComPricelist(): Promise<SincronizacaoResultado> {
  const resultado: SincronizacaoResultado = {
    total: 0,
    atualizados: 0,
    erros: 0,
    detalhes: [],
  };

  // 1. Buscar todos os itens de propostas que têm vínculo com pricelist
  const { data: itensPropostas, error: erroItens } = await supabase
    .from("propostas_itens")
    .select("*")
    .not("pricelist_item_id", "is", null);

  if (erroItens) {
    throw new Error(`Erro ao buscar itens: ${erroItens.message}`);
  }

  if (!itensPropostas || itensPropostas.length === 0) {
    resultado.detalhes.push("Nenhum item vinculado ao pricelist encontrado.");
    return resultado;
  }

  resultado.total = itensPropostas.length;

  // Detectar quais colunas existem baseado no primeiro item
  const primeiroItem = itensPropostas[0];
  const colunasExistentes = Object.keys(primeiroItem);
  console.log("[Sync] Colunas existentes em propostas_itens:", colunasExistentes);

  // 2. Buscar todos os itens do pricelist de uma vez (mais eficiente)
  const pricelistIds = [...new Set(itensPropostas.map(i => i.pricelist_item_id))];

  const { data: itensPricelist, error: erroPricelist } = await supabase
    .from("pricelist_itens")
    .select(`
      id,
      codigo,
      nome,
      descricao,
      categoria,
      tipo,
      unidade,
      nucleo_id
    `)
    .in("id", pricelistIds);

  if (erroPricelist) {
    throw new Error(`Erro ao buscar pricelist: ${erroPricelist.message}`);
  }

  // Buscar núcleos separadamente (evita erro de FK)
  const nucleoIds = [...new Set((itensPricelist || []).map((i: any) => i.nucleo_id).filter(Boolean))];
  let nucleosMap: Record<string, string> = {};
  if (nucleoIds.length > 0) {
    const { data: nucleos } = await supabase
      .from("nucleos")
      .select("id, nome")
      .in("id", nucleoIds);
    if (nucleos) {
      nucleosMap = Object.fromEntries(nucleos.map(n => [n.id, n.nome]));
    }
  }

  // Criar mapa para acesso rápido
  const pricelistMap = new Map(
    (itensPricelist || []).map((item: any) => [item.id, item])
  );

  // Log dos tipos únicos encontrados no pricelist
  const tiposUnicos = [...new Set((itensPricelist || []).map((i: any) => i.tipo))];
  console.log("[Sync] Tipos únicos no pricelist:", tiposUnicos);

  // 3. Atualizar cada item da proposta - apenas campos que existem
  for (const itemProposta of itensPropostas) {
    const pricelistItem = pricelistMap.get(itemProposta.pricelist_item_id);

    if (!pricelistItem) {
      resultado.erros++;
      continue;
    }

    // Buscar nome do núcleo do mapa
    const nucleoNome = pricelistItem.nucleo_id ? nucleosMap[pricelistItem.nucleo_id] : null;

    // Montar objeto de update apenas com campos que existem na tabela
    const dadosUpdate: Record<string, any> = {};

    // Verificar cada campo e só incluir se existir na tabela
    // IMPORTANTE: Mapear tipo para valor válido
    if (colunasExistentes.includes('tipo') && pricelistItem.tipo) {
      const tipoMapeado = mapearTipoValido(pricelistItem.tipo);
      if (tipoMapeado) {
        dadosUpdate.tipo = tipoMapeado;
      }
    }
    // IMPORTANTE: Mapear núcleo para código válido (arquitetura, engenharia, etc.)
    if (colunasExistentes.includes('nucleo') && nucleoNome) {
      const nucleoMapeado = mapearNucleoValido(nucleoNome);
      if (nucleoMapeado) {
        dadosUpdate.nucleo = nucleoMapeado;
      }
    }
    if (colunasExistentes.includes('categoria') && pricelistItem.categoria) {
      dadosUpdate.categoria = pricelistItem.categoria;
    }
    if (colunasExistentes.includes('unidade') && pricelistItem.unidade) {
      dadosUpdate.unidade = pricelistItem.unidade;
    }
    if (colunasExistentes.includes('codigo') && pricelistItem.codigo) {
      dadosUpdate.codigo = pricelistItem.codigo;
    }

    // Só fazer update se tiver algo para atualizar
    if (Object.keys(dadosUpdate).length === 0) {
      resultado.atualizados++;
      continue;
    }

    // Log detalhado do primeiro update para debug
    if (resultado.atualizados === 0 && resultado.erros === 0) {
      console.log("[Sync] Primeiro update - dados:", dadosUpdate);
      console.log("[Sync] Item ID:", itemProposta.id);
    }

    const { error: erroUpdate, data: dataUpdate } = await supabase
      .from("propostas_itens")
      .update(dadosUpdate)
      .eq("id", itemProposta.id)
      .select();

    if (erroUpdate) {
      resultado.erros++;
      // Log detalhado nos primeiros 3 erros
      if (resultado.erros <= 3) {
        console.error("[Sync] Erro ao atualizar item:", {
          itemId: itemProposta.id,
          dadosEnviados: dadosUpdate,
          erro: erroUpdate,
          mensagem: erroUpdate.message,
          codigo: erroUpdate.code,
          detalhes: erroUpdate.details,
          hint: erroUpdate.hint,
        });
        resultado.detalhes.push(
          `Erro ${resultado.erros}: ${erroUpdate.message} (code: ${erroUpdate.code})`
        );
      }
    } else {
      resultado.atualizados++;
    }
  }

  resultado.detalhes.unshift(
    `✅ ${resultado.atualizados} itens atualizados de ${resultado.total} total`
  );

  if (resultado.erros > 0) {
    resultado.detalhes.push(
      `Tipos válidos para propostas_itens: ${TIPOS_VALIDOS.join(', ')}`
    );
  }

  return resultado;
}

/**
 * Sincroniza itens de UMA proposta específica com o pricelist atual
 */
export async function sincronizarItensProposta(propostaId: string): Promise<SincronizacaoResultado> {
  const resultado: SincronizacaoResultado = {
    total: 0,
    atualizados: 0,
    erros: 0,
    detalhes: [],
  };

  // 1. Buscar itens desta proposta que têm vínculo com pricelist
  const { data: itensPropostas, error: erroItens } = await supabase
    .from("propostas_itens")
    .select("id, pricelist_item_id, nome")
    .eq("proposta_id", propostaId)
    .not("pricelist_item_id", "is", null);

  if (erroItens) {
    throw new Error(`Erro ao buscar itens: ${erroItens.message}`);
  }

  if (!itensPropostas || itensPropostas.length === 0) {
    resultado.detalhes.push("Nenhum item vinculado ao pricelist nesta proposta.");
    return resultado;
  }

  resultado.total = itensPropostas.length;

  // 2. Buscar dados atualizados do pricelist
  const pricelistIds = [...new Set(itensPropostas.map(i => i.pricelist_item_id))];

  const { data: itensPricelist, error: erroPricelist } = await supabase
    .from("pricelist_itens")
    .select("id, codigo, nome, descricao, categoria, tipo, unidade, nucleo_id")
    .in("id", pricelistIds);

  if (erroPricelist) {
    throw new Error(`Erro ao buscar pricelist: ${erroPricelist.message}`);
  }

  // Buscar núcleos separadamente (evita erro de FK)
  const nucleoIds = [...new Set((itensPricelist || []).map((i: any) => i.nucleo_id).filter(Boolean))];
  let nucleosMap: Record<string, string> = {};
  if (nucleoIds.length > 0) {
    const { data: nucleos } = await supabase
      .from("nucleos")
      .select("id, nome")
      .in("id", nucleoIds);
    if (nucleos) {
      nucleosMap = Object.fromEntries(nucleos.map(n => [n.id, n.nome]));
    }
  }

  const pricelistMap = new Map(
    (itensPricelist || []).map((item: any) => [item.id, item])
  );

  // 3. Atualizar cada item
  for (const itemProposta of itensPropostas) {
    const pricelistItem = pricelistMap.get(itemProposta.pricelist_item_id);

    if (!pricelistItem) {
      resultado.erros++;
      continue;
    }

    const nucleoNome = pricelistItem.nucleo_id ? nucleosMap[pricelistItem.nucleo_id] : null;

    // Atualizar apenas campos essenciais (tipo e nucleo) - com mapeamento
    const dadosUpdate: Record<string, any> = {};
    if (pricelistItem.tipo) {
      const tipoMapeado = mapearTipoValido(pricelistItem.tipo);
      if (tipoMapeado) dadosUpdate.tipo = tipoMapeado;
    }
    if (nucleoNome) {
      const nucleoMapeado = mapearNucleoValido(nucleoNome);
      if (nucleoMapeado) dadosUpdate.nucleo = nucleoMapeado;
    }

    if (Object.keys(dadosUpdate).length === 0) {
      resultado.atualizados++;
      continue;
    }

    const { error: erroUpdate } = await supabase
      .from("propostas_itens")
      .update(dadosUpdate)
      .eq("id", itemProposta.id);

    if (erroUpdate) {
      resultado.erros++;
    } else {
      resultado.atualizados++;
    }
  }

  return resultado;
}

/**
 * Sincroniza itens de propostas vinculados a UM item específico do pricelist.
 * Útil para atualizaçÍo automática após ediçÍo de item no Pricelist.
 */
export async function sincronizarItensPorPricelistItem(pricelistItemId: string): Promise<SincronizacaoResultado> {
  const resultado: SincronizacaoResultado = {
    total: 0,
    atualizados: 0,
    erros: 0,
    detalhes: [],
  };

  if (!UUID_REGEX.test(pricelistItemId)) {
    resultado.detalhes.push("ID de item do pricelist inválido para sincronizaçÍo.");
    return resultado;
  }

  const { data: rowsProposta, error: erroRows } = await supabase
    .from("propostas_itens")
    .select("*")
    .eq("pricelist_item_id", pricelistItemId);

  if (erroRows) throw new Error(`Erro ao buscar itens da proposta: ${erroRows.message}`);
  if (!rowsProposta || rowsProposta.length === 0) {
    resultado.detalhes.push("Nenhum item de proposta vinculado a este item do pricelist.");
    return resultado;
  }

  resultado.total = rowsProposta.length;
  const colunasExistentes = Object.keys(rowsProposta[0] || {});

  const { data: itemPricelist, error: erroPricelist } = await supabase
    .from("pricelist_itens")
    .select("id, codigo, nome, descricao, categoria, categoria_id, subcategoria_id, tipo, unidade, nucleo_id")
    .eq("id", pricelistItemId)
    .maybeSingle();

  if (erroPricelist) throw new Error(`Erro ao buscar item do pricelist: ${erroPricelist.message}`);
  if (!itemPricelist) {
    resultado.detalhes.push("Item do pricelist não encontrado.");
    return resultado;
  }

  let nucleoNome: string | null = null;
  if (itemPricelist.nucleo_id) {
    const { data: nucleo } = await supabase
      .from("nucleos")
      .select("nome")
      .eq("id", itemPricelist.nucleo_id)
      .maybeSingle();
    nucleoNome = nucleo?.nome || null;
  }

  const dadosUpdate: Record<string, any> = {};

  if (colunasExistentes.includes("nome") && itemPricelist.nome) dadosUpdate.nome = itemPricelist.nome;
  if (colunasExistentes.includes("descricao")) dadosUpdate.descricao = itemPricelist.descricao || "";
  if (colunasExistentes.includes("categoria")) dadosUpdate.categoria = itemPricelist.categoria || "";
  if (colunasExistentes.includes("codigo")) dadosUpdate.codigo = itemPricelist.codigo || null;
  if (colunasExistentes.includes("unidade")) dadosUpdate.unidade = itemPricelist.unidade || "un";
  if (colunasExistentes.includes("categoria_id")) dadosUpdate.categoria_id = itemPricelist.categoria_id || null;
  if (colunasExistentes.includes("subcategoria_id")) dadosUpdate.subcategoria_id = itemPricelist.subcategoria_id || null;
  if (colunasExistentes.includes("nucleo_id")) dadosUpdate.nucleo_id = itemPricelist.nucleo_id || null;

  if (colunasExistentes.includes("tipo") && itemPricelist.tipo) {
    const tipoMapeado = mapearTipoValido(itemPricelist.tipo);
    if (tipoMapeado) dadosUpdate.tipo = tipoMapeado;
  }

  if (colunasExistentes.includes("nucleo") && nucleoNome) {
    const nucleoMapeado = mapearNucleoValido(nucleoNome);
    if (nucleoMapeado) dadosUpdate.nucleo = nucleoMapeado;
  }

  if (Object.keys(dadosUpdate).length === 0) {
    resultado.detalhes.push("Nenhuma coluna sincronizável encontrada em propostas_itens.");
    return resultado;
  }

  const { data: updatedRows, error: erroUpdate } = await supabase
    .from("propostas_itens")
    .update(dadosUpdate)
    .eq("pricelist_item_id", pricelistItemId)
    .select("id");

  if (erroUpdate) throw new Error(`Erro ao sincronizar item nas propostas: ${erroUpdate.message}`);

  resultado.atualizados = updatedRows?.length || 0;
  resultado.detalhes.push(
    `✅ ${resultado.atualizados} item(ns) de proposta sincronizado(s) para o item ${pricelistItemId}.`
  );

  return resultado;
}

// ============================================================
// ATUALIZAR PREÇOS DE PROPOSTAS EM ABERTO COM PRICELIST ATUAL
// ============================================================

export interface AtualizacaoPropostasResultado {
  propostas_atualizadas: number;
  itens_atualizados: number;
  erros: number;
  detalhes: string[];
}

/**
 * Atualiza os valor_unitario de itens em propostas abertas (rascunho/enviada)
 * com os preços atuais do pricelist. Recalcula valor_total de cada proposta.
 */
export async function atualizarPrecosPropostasAbertas(): Promise<AtualizacaoPropostasResultado> {
  const resultado: AtualizacaoPropostasResultado = {
    propostas_atualizadas: 0,
    itens_atualizados: 0,
    erros: 0,
    detalhes: [],
  };

  // 1. Buscar propostas em aberto
  const { data: propostas, error: errPropostas } = await supabase
    .from("propostas")
    .select("id, titulo, numero, valor_total, status")
    .in("status", ["rascunho", "enviada"])
    .order("created_at", { ascending: false });

  if (errPropostas) throw new Error(`Erro ao buscar propostas: ${errPropostas.message}`);
  if (!propostas || propostas.length === 0) {
    resultado.detalhes.push("Nenhuma proposta em aberto encontrada.");
    return resultado;
  }

  // 2. Buscar todos os itens dessas propostas
  const propostaIds = propostas.map(p => p.id);
  const { data: itensPropostas, error: errItens } = await supabase
    .from("propostas_itens")
    .select("id, proposta_id, pricelist_item_id, quantidade, valor_unitario")
    .in("proposta_id", propostaIds);

  if (errItens) throw new Error(`Erro ao buscar itens: ${errItens.message}`);
  if (!itensPropostas || itensPropostas.length === 0) {
    resultado.detalhes.push("Nenhum item vinculado nas propostas em aberto.");
    return resultado;
  }

  // 3. Buscar preços atuais do pricelist (só itens referenciados)
  const pricelistIds = [...new Set(
    itensPropostas
      .map(i => i.pricelist_item_id)
      .filter(Boolean)
  )];

  if (pricelistIds.length === 0) {
    resultado.detalhes.push("Nenhum item vinculado ao pricelist.");
    return resultado;
  }

  const { data: pricelistItens, error: errPricelist } = await supabase
    .from("pricelist_itens")
    .select("id, preco, nome")
    .in("id", pricelistIds);

  if (errPricelist) throw new Error(`Erro ao buscar pricelist: ${errPricelist.message}`);

  const precoMap = new Map<string, number>();
  (pricelistItens || []).forEach(p => {
    if (p.preco != null) precoMap.set(p.id, p.preco);
  });

  // 4. Atualizar cada item onde o preço mudou
  const propostasAfetadas = new Set<string>();

  for (const item of itensPropostas) {
    if (!item.pricelist_item_id || !precoMap.has(item.pricelist_item_id)) continue;

    const precoAtual = precoMap.get(item.pricelist_item_id)!;
    const precoAntigo = item.valor_unitario || 0;

    // Só atualizar se o preço mudou (tolerância de 1 centavo)
    if (Math.abs(precoAtual - precoAntigo) < 0.01) continue;

    const { error: errUpdate } = await supabase
      .from("propostas_itens")
      .update({ valor_unitario: precoAtual })
      .eq("id", item.id);

    if (errUpdate) {
      resultado.erros++;
      continue;
    }

    resultado.itens_atualizados++;
    propostasAfetadas.add(item.proposta_id);
  }

  // 5. Recalcular valor_total de cada proposta afetada
  for (const propostaId of propostasAfetadas) {
    const { data: itensAtualizados } = await supabase
      .from("propostas_itens")
      .select("quantidade, valor_unitario, tipo")
      .eq("proposta_id", propostaId);

    if (!itensAtualizados) continue;

    let valorMateriais = 0;
    let valorMaoObra = 0;
    let valorTotal = 0;

    for (const it of itensAtualizados) {
      const sub = (it.quantidade || 0) * (it.valor_unitario || 0);
      valorTotal += sub;
      if (it.tipo === "mao_obra" || it.tipo === "servico") {
        valorMaoObra += sub;
      } else {
        valorMateriais += sub;
      }
    }

    const { error: errProposta } = await supabase
      .from("propostas")
      .update({
        valor_total: Number(valorTotal.toFixed(2)),
        valor_materiais: Number(valorMateriais.toFixed(2)),
        valor_mao_obra: Number(valorMaoObra.toFixed(2)),
        valor_raw: null, // Limpar metadata antiga (preços agora sÍo do pricelist direto)
      })
      .eq("id", propostaId);

    if (errProposta) {
      resultado.erros++;
    } else {
      resultado.propostas_atualizadas++;
    }
  }

  resultado.detalhes.push(
    `${resultado.propostas_atualizadas} proposta(s) atualizada(s), ${resultado.itens_atualizados} item(ns) com novo preço.`
  );

  return resultado;
}

// ============================================================
// BUSCAR PROPOSTA PARA PDF / VISUALIZAÇÍO
// ============================================================

export async function buscarPropostaParaPDF(id: string): Promise<PropostaVisualizacao> {
  // Buscar proposta base + itens (reutiliza lógica existente)
  const propostaBase = await buscarProposta(id);

  // Buscar dados adicionais do cliente para visualizaçÍo
  let clienteEmail: string | null = null;
  let clienteTelefone: string | null = null;
  let clienteAvatarUrl: string | null = null;
  let clienteFotoUrl: string | null = null;
  let clienteEndereco: string | null = null;

  if (propostaBase.cliente_id) {
    const { data: cliente } = await supabase
      .from("pessoas")
      .select("nome, email, telefone, celular, avatar_url, foto_url, logradouro, numero, complemento, bairro, cidade, estado, cep, obra_endereco_diferente, obra_logradouro, obra_numero, obra_complemento, obra_bairro, obra_cidade, obra_estado, obra_cep")
      .eq("id", propostaBase.cliente_id)
      .single();

    if (cliente) {
      clienteEmail = cliente.email || null;
      clienteTelefone = cliente.celular || cliente.telefone || null;
      clienteAvatarUrl = cliente.avatar_url || null;
      clienteFotoUrl = cliente.foto_url || null;

      // Montar endereço - usar endereço da obra se ativado, senão endereço principal
      const useObra = cliente.obra_endereco_diferente && cliente.obra_logradouro;
      const partes = useObra
        ? [
            cliente.obra_logradouro,
            cliente.obra_numero ? `${cliente.obra_numero}` : null,
            cliente.obra_complemento,
            cliente.obra_bairro,
            cliente.obra_cidade && cliente.obra_estado ? `${cliente.obra_cidade} - ${cliente.obra_estado}` : (cliente.obra_cidade || cliente.obra_estado),
            cliente.obra_cep,
          ].filter(Boolean)
        : [
            cliente.logradouro,
            cliente.numero ? `${cliente.numero}` : null,
            cliente.complemento,
            cliente.bairro,
            cliente.cidade && cliente.estado ? `${cliente.cidade} - ${cliente.estado}` : (cliente.cidade || cliente.estado),
            cliente.cep,
          ].filter(Boolean);
      clienteEndereco = partes.length > 0 ? partes.join(" · ") : null;
    }
  }

  // Buscar prazo real atualizado do contrato (se existir)
  let prazoRealDias: number | null = null;
  {
    const { data: contrato } = await supabase
      .from("contratos")
      .select("duracao_dias_uteis")
      .eq("proposta_id", id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (contrato?.duracao_dias_uteis) {
      prazoRealDias = contrato.duracao_dias_uteis;
    }
  }

  // Buscar dados bancários das empresas por núcleo
  // Pegar núcleos distintos dos itens da proposta + nucleo da proposta
  const nucleosSet = new Set<string>();
  if (propostaBase.nucleo) nucleosSet.add(propostaBase.nucleo);
  for (const item of propostaBase.itens || []) {
    if ((item as any).nucleo) nucleosSet.add((item as any).nucleo);
  }
  const nucleosDistintos = [...nucleosSet].filter(Boolean);

  let dadosBancarios: any[] = [];
  if (nucleosDistintos.length > 0) {
    // Buscar nucleos IDs a partir dos nomes
    const { data: nucleosDB } = await supabase
      .from("nucleos")
      .select("id, nome")
      .in("nome", nucleosDistintos.map(n => n.charAt(0).toUpperCase() + n.slice(1)));

    // Fallback: tentar com nomes lowercase também
    let nucleoIds: string[] = (nucleosDB || []).map(n => n.id);
    if (nucleoIds.length === 0) {
      const { data: nucleosDB2 } = await supabase
        .from("nucleos")
        .select("id, nome");
      if (nucleosDB2) {
        const nucleoMap = new Map(nucleosDB2.map(n => [n.nome.toLowerCase(), n.id]));
        nucleoIds = nucleosDistintos
          .map(n => nucleoMap.get(n.toLowerCase()))
          .filter(Boolean) as string[];
      }
    }

    if (nucleoIds.length > 0) {
      // Buscar empresas vinculadas a esses núcleos
      const { data: empresas } = await supabase
        .from("empresas_grupo")
        .select("id, nome_fantasia, nucleo_id")
        .eq("ativo", true)
        .in("nucleo_id", nucleoIds);

      if (empresas && empresas.length > 0) {
        const empresaIds = empresas.map(e => e.id);

        // Buscar contas bancárias das empresas
        const { data: contas } = await supabase
          .from("empresas_contas_bancarias")
          .select("empresa_id, banco_nome, banco_codigo, agencia, agencia_digito, conta, conta_digito, tipo_conta, pix_chave, pix_tipo, apelido, padrao")
          .eq("ativo", true)
          .in("empresa_id", empresaIds)
          .order("padrao", { ascending: false });

        if (contas && contas.length > 0) {
          // Mapear nucleo_id -> nome do nucleo
          const nucleoNomeMap = new Map<string, string>();
          if (nucleosDB && nucleosDB.length > 0) {
            nucleosDB.forEach(n => nucleoNomeMap.set(n.id, n.nome));
          }

          // Para cada empresa, pegar a conta padrÍo (ou primeira ativa)
          for (const empresa of empresas) {
            const contaEmpresa = contas.find(c => c.empresa_id === empresa.id);
            if (contaEmpresa) {
              const nucleoNome = empresa.nucleo_id ? nucleoNomeMap.get(empresa.nucleo_id) || "" : "";
              dadosBancarios.push({
                nucleo: nucleoNome.toLowerCase() || "grupo",
                nome: empresa.nome_fantasia || contaEmpresa.apelido || null,
                banco: contaEmpresa.banco_nome || contaEmpresa.banco_codigo,
                agencia: contaEmpresa.agencia ? `${contaEmpresa.agencia}${contaEmpresa.agencia_digito ? `-${contaEmpresa.agencia_digito}` : ""}` : null,
                conta: contaEmpresa.conta ? `${contaEmpresa.conta}${contaEmpresa.conta_digito ? `-${contaEmpresa.conta_digito}` : ""}` : null,
                tipo_conta: contaEmpresa.tipo_conta || null,
                pix_chave: contaEmpresa.pix_chave || null,
                pix_tipo: contaEmpresa.pix_tipo || null,
              });
            }
          }
        }
      }
    }
  }

  return {
    ...propostaBase,
    cliente_email: clienteEmail,
    cliente_telefone: clienteTelefone,
    cliente_avatar_url: clienteAvatarUrl || propostaBase.cliente_avatar_url || null,
    cliente_foto_url: clienteFotoUrl,
    cliente_endereco: clienteEndereco,
    dados_bancarios: dadosBancarios,
    prazo_execucao_dias: prazoRealDias || propostaBase.prazo_execucao_dias,
  };
}

// ============================================================
// COMPARTILHAMENTO DE PROPOSTAS (Token-based)
// ============================================================

const PRODUCTION_URL = "https://easy.wgalmeida.com.br";

function getBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
    return PRODUCTION_URL;
  }
  return typeof window !== "undefined" ? window.location.origin : PRODUCTION_URL;
}

/**
 * Gera token de compartilhamento e marca proposta como enviada.
 * Retorna a URL publica para o cliente.
 */
export async function gerarTokenCompartilhamento(
  propostaId: string,
  options?: {
    validadeDias?: number;
    enviadaPara?: string;
    enviadaVia?: "email" | "whatsapp" | "link_direto";
  }
): Promise<{ token: string; url: string; expiraEm: string; numero: string | null }> {
  // Verificar se ja tem token valido
  const { data: existente } = await supabase
    .from("propostas")
    .select("token_compartilhamento, token_expira_em, numero")
    .eq("id", propostaId)
    .single();

  let token = existente?.token_compartilhamento;
  let numero = existente?.numero || null;
  const tokenExpirado = existente?.token_expira_em && new Date(existente.token_expira_em) < new Date();

  // Gerar novo token se nao existe ou expirou
  if (!token || tokenExpirado) {
    token = crypto.randomUUID();
  }

  const expiraEm = new Date();
  expiraEm.setDate(expiraEm.getDate() + (options?.validadeDias || 30));

  const updateData: Record<string, any> = {
    token_compartilhamento: token,
    token_expira_em: expiraEm.toISOString(),
    status: "enviada",
    enviada_em: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Garante numero da proposta antes do compartilhamento para evitar "Proposta: N/A" no WhatsApp.
  if (!numero) {
    try {
      const { data: numeroRpc, error: numeroRpcError } = await supabase.rpc("gerar_numero_proposta");
      if (!numeroRpcError && typeof numeroRpc === "string" && numeroRpc.trim().length > 0) {
        numero = numeroRpc.trim();
        updateData.numero = numero;
      } else if (numeroRpcError) {
        console.warn("[gerarTokenCompartilhamento] Falha ao gerar numero via RPC:", numeroRpcError);
      }
    } catch (err) {
      console.warn("[gerarTokenCompartilhamento] Erro inesperado ao gerar numero:", err);
    }
  }

  if (options?.enviadaPara) updateData.enviada_para = options.enviadaPara;
  if (options?.enviadaVia) updateData.enviada_via = options.enviadaVia;

  const { error } = await supabase
    .from("propostas")
    .update(updateData)
    .eq("id", propostaId);

  if (error) throw error;

  const url = `${getBaseUrl()}/proposta/p/${token}`;
  return { token, url, expiraEm: expiraEm.toISOString(), numero };
}

/**
 * Busca proposta por token de compartilhamento (acesso publico).
 * Registra visualizacao na primeira abertura.
 */
export async function buscarPropostaPorToken(
  token: string
): Promise<PropostaVisualizacao | null> {
  // Buscar proposta usando maybeSingle para não tratar "não encontrado" como erro
  const { data: proposta, error } = await supabase
    .from("propostas")
    .select("id, token_expira_em, visualizada_em, validade_dias, created_at")
    .eq("token_compartilhamento", token)
    .maybeSingle();

  if (error) {
    console.error("[buscarPropostaPorToken] Erro na query:", error);
    return null;
  }

  if (!proposta) {
    console.warn("[buscarPropostaPorToken] Token não encontrado:", token);
    return null;
  }

  // Verificar expiraçÍo do token de compartilhamento
  if (proposta.token_expira_em && new Date(proposta.token_expira_em) < new Date()) {
    console.warn("[buscarPropostaPorToken] Token expirado:", proposta.token_expira_em, "- renovando...");
    // Auto-renovar token expirado (30 dias) para não bloquear o cliente
    const novaExpiracao = new Date();
    novaExpiracao.setDate(novaExpiracao.getDate() + 30);
    await supabase
      .from("propostas")
      .update({ token_expira_em: novaExpiracao.toISOString() })
      .eq("id", proposta.id);
  }

  // Registrar primeira visualizacao
  if (!proposta.visualizada_em) {
    await supabase
      .from("propostas")
      .update({ visualizada_em: new Date().toISOString() })
      .eq("id", proposta.id);
  }

  // Reutilizar buscarPropostaParaPDF para dados completos
  return buscarPropostaParaPDF(proposta.id);
}

/**
 * Cliente solicita revisao com feedback.
 */
export async function solicitarRevisaoProposta(
  propostaId: string,
  observacoesCliente: string
): Promise<void> {
  const { data: proposta } = await supabase
    .from("propostas")
    .select("numero, cliente_id")
    .eq("id", propostaId)
    .single();

  const { error } = await supabase
    .from("propostas")
    .update({
      status: "em_revisao",
      observacoes_cliente: observacoesCliente,
      updated_at: new Date().toISOString(),
    })
    .eq("id", propostaId);

  if (error) throw error;

  await supabase.from("notificacoes").insert({
    tipo: "proposta_revisao",
    titulo: `Proposta ${proposta?.numero || ""} - cliente solicitou revisÍo`,
    descricao: observacoesCliente.substring(0, 300),
    dados: { proposta_id: propostaId },
  });
}

/**
 * Cliente rejeita proposta com motivo opcional.
 */
export async function rejeitarPropostaComMotivo(
  propostaId: string,
  motivo?: string
): Promise<void> {
  const updateData: Record<string, any> = {
    status: "rejeitada",
    updated_at: new Date().toISOString(),
  };
  if (motivo) updateData.observacoes_cliente = motivo;

  const { error } = await supabase
    .from("propostas")
    .update(updateData)
    .eq("id", propostaId);

  if (error) throw error;

  const { data: proposta } = await supabase
    .from("propostas")
    .select("numero")
    .eq("id", propostaId)
    .single();

  await supabase.from("notificacoes").insert({
    tipo: "proposta_recusada",
    titulo: `Proposta ${proposta?.numero || ""} recusada pelo cliente`,
    descricao: motivo ? `Motivo: ${motivo.substring(0, 300)}` : "Cliente recusou a proposta.",
    dados: { proposta_id: propostaId },
  });
}

/**
 * Retorna URL existente da proposta (se token ja foi gerado).
 */
export async function obterLinkProposta(
  propostaId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("propostas")
    .select("token_compartilhamento, token_expira_em")
    .eq("id", propostaId)
    .single();

  if (!data?.token_compartilhamento) return null;
  if (data.token_expira_em && new Date(data.token_expira_em) < new Date()) return null;

  return `${getBaseUrl()}/proposta/p/${data.token_compartilhamento}`;
}

/**
 * Gera mensagem formatada para WhatsApp.
 */
export function gerarMensagemPropostaWhatsApp(
  clienteNome: string,
  propostaNumero: string | null,
  valorTotal: number,
  url: string
): string {
  const valor = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valorTotal);
  const urlProd = url.replace(/http:\/\/localhost:\d+/, PRODUCTION_URL);

  return [
    `Olá ${clienteNome}!`,
    "",
    "Sua proposta comercial está pronta!",
    "",
    `Proposta: ${propostaNumero || "N/A"}`,
    `Valor: ${valor}`,
    "",
    "Acesse o link para visualizar e aprovar:",
    urlProd,
    "",
    "Grupo WG Almeida",
  ].join("\n");
}

// Exportar tipos também
export type {
  Proposta,
  PropostaItem,
  PropostaCompleta,
  PropostaVisualizacao,
  PropostaFormData,
  PropostaItemInput,
};


