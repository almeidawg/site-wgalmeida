// ========================================
// SERVIÇO DE IA PARA CLASSIFICAÇÍO DE EXTRATOS
// Com matching inteligente, validaçÍo e métricas
// ========================================

import { supabase } from '@/lib/supabaseClient';
import type { LinhaExtrato } from './extratoParserService';

// ========================================
// TIPOS E INTERFACES
// ========================================

export interface ClassificacaoIA {
  categoria_id: string | null;
  categoria_sugerida: string | null;
  projeto_id: string | null;
  projeto_sugerido: string | null;
  contrato_id: string | null;
  contrato_sugerido: string | null;
  pessoa_id: string | null;
  pessoa_sugerida: string | null;
  centro_custo_id: string | null;
  centro_custo_sugerido: string | null;
  nucleo: string | null;
  conta_id: string | null;
  conta_sugerida: string | null;
  confianca: number; // 0-100
  motivo: string;
  descricao_formatada: string;
  // Métricas de match detalhadas
  match_scores: {
    categoria: number;
    projeto: number;
    pessoa: number;
    centro_custo: number;
    conta: number;
    nucleo: number;
  };
}

export interface MetricasValidacao {
  total_linhas: number;
  linhas_validas: number;
  linhas_com_data: number;
  linhas_com_valor: number;
  linhas_com_descricao: number;
  match_categoria: number;
  match_projeto: number;
  match_pessoa: number;
  match_centro_custo: number;
  match_conta: number;
  match_nucleo: number;
  confianca_media: number;
  valor_total_entradas: number;
  valor_total_saidas: number;
  periodo_inicio: string | null;
  periodo_fim: string | null;
  duplicatas_encontradas: number;
}

interface PadraoAprendido {
  id: string;
  padrao_texto: string;
  tipo_match: string;
  categoria_id: string | null;
  projeto_id: string | null;
  contrato_id: string | null;
  pessoa_id: string | null;
  centro_custo_id: string | null;
  nucleo: string | null;
  vezes_usado: number;
}

interface ProjetoCompleto {
  id: string;
  nome?: string;
  numero?: string;
  titulo?: string;
  cliente_id?: string;
  cliente_nome?: string;
  status?: string;
}

interface ContratoCompleto {
  id: string;
  numero?: string;
  titulo?: string;
  cliente_id?: string;
  cliente_nome?: string;
  projeto_id?: string;
  valor_total?: number;
}

interface CategoriaFinanceira {
  id: string;
  nome: string;
  tipo: string;
  palavras_chave?: string[];
}

interface PessoaCompleta {
  id: string;
  nome: string;
  razao_social?: string;
  cpf?: string;
  cnpj?: string;
  tipo: string;
  email?: string;
}

interface CentroCustoCompleto {
  id: string;
  nome: string;
  codigo?: string;
  projeto_id?: string;
  cliente_id?: string;
}

interface ContaBancaria {
  id: string;
  nome: string;
  banco?: string;
  agencia?: string;
  numero?: string;
}

type SupabaseClienteRelacao = {
  nome?: string | null;
};

type ProjetoComCliente = ProjetoCompleto & { clientes?: SupabaseClienteRelacao | SupabaseClienteRelacao[] | null };
type ContratoComCliente = ContratoCompleto & { clientes?: SupabaseClienteRelacao | SupabaseClienteRelacao[] | null };

// ========================================
// CACHE DE DADOS DE REFERÊNCIA
// ========================================

let cacheReferencias: {
  padroes: PadraoAprendido[];
  projetos: ProjetoCompleto[];
  contratos: ContratoCompleto[];
  categorias: CategoriaFinanceira[];
  pessoas: PessoaCompleta[];
  centrosCusto: CentroCustoCompleto[];
  contas: ContaBancaria[];
  lastUpdate: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// ========================================
// PALAVRAS-CHAVE PARA CLASSIFICAÇÍO
// ========================================

const KEYWORDS_CATEGORIAS: Record<string, string[]> = {
  // Despesas de Pessoal
  'MAO_DE_OBRA': ['PEDREIRO', 'AJUDANTE', 'SERVENTE', 'ELETRICISTA', 'ENCANADOR', 'PINTOR', 'GESSEIRO', 'MARCENEIRO', 'SERRALHEIRO', 'VIDRACEIRO'],
  'SALARIO': ['FOLHA', 'SALARIO', 'SAL.', 'PAGTO FUNC', 'ADIANTAMENTO', 'FERIAS', '13', 'RESCISAO', 'PRO-LABORE', 'PROLABORE'],
  'ENCARGOS': ['FGTS', 'INSS', 'GPS', 'IRRF', 'CONTRIBUICAO', 'SINDICATO'],

  // Impostos e Taxas
  'IMPOSTOS': ['DARF', 'DAS', 'SIMPLES', 'ICMS', 'ISS', 'IPTU', 'IPVA', 'COFINS', 'PIS', 'CSLL', 'IRPJ'],
  'TAXAS': ['TAXA', 'LICENCA', 'ALVARA', 'ART', 'RRT', 'CREA', 'CAU'],

  // Utilidades
  'ENERGIA': ['CEMIG', 'CPFL', 'LIGHT', 'ELETROPAULO', 'ENERGIA', 'CELESC', 'COPEL', 'ELETROBRAS', 'LUZ'],
  'AGUA': ['COPASA', 'SABESP', 'CEDAE', 'SANEPAR', 'AGUA', 'SANEAMENTO', 'CAGECE'],
  'TELEFONE': ['VIVO', 'CLARO', 'TIM', 'OI', 'TELEFONE', 'CELULAR', 'TELEFONICA'],
  'INTERNET': ['INTERNET', 'FIBRA', 'BANDA LARGA', 'NET', 'GVT'],

  // Infraestrutura
  'ALUGUEL': ['ALUGUEL', 'LOCACAO', 'CONDOMINIO', 'IPTU'],
  'COMBUSTIVEL': ['POSTO', 'COMBUSTIVEL', 'GASOLINA', 'DIESEL', 'ETANOL', 'SHELL', 'IPIRANGA', 'BR DISTRIBUIDORA', 'PETROBRAS'],

  // Materiais e Suprimentos
  'MATERIAL_CONSTRUCAO': ['MATERIAL', 'LEROY', 'TELHANORTE', 'C&C', 'TUMELERO', 'CIMENTO', 'AREIA', 'BRITA', 'FERRAG', 'MADEIRA', 'TIJOLO', 'BLOCO'],
  'MATERIAL_ELETRICO': ['ELETRICO', 'FIO', 'CABO', 'DISJUNTOR', 'TOMADA', 'INTERRUPTOR', 'LAMPADA'],
  'MATERIAL_HIDRAULICO': ['HIDRAULICO', 'TUBO', 'CONEXAO', 'REGISTRO', 'TORNEIRA', 'VALVULA'],
  'ACABAMENTO': ['PORCELANATO', 'CERAMICA', 'PISO', 'REVESTIMENTO', 'TINTA', 'MASSA', 'GESSO'],

  // Serviços
  'SERVICOS_TERCEIROS': ['SERVICO', 'TERCEIRIZADO', 'PRESTADOR', 'EMPREITEIRO', 'EMPREITADA'],
  'CONSULTORIA': ['CONSULTORIA', 'ASSESSORIA', 'HONORARIO'],
  'FRETE': ['FRETE', 'TRANSPORTE', 'CARRETO', 'ENTREGA', 'LOGISTICA'],

  // Operacional
  'ALIMENTACAO': ['RESTAURANTE', 'LANCHONETE', 'IFOOD', 'RAPPI', 'ALIMENTA', 'REFEICAO', 'ALMOCO'],
  'ESCRITORIO': ['PAPELARIA', 'MATERIAL ESCRITORIO', 'CARTUCHOS', 'TONER'],
  'VIAGEM': ['UBER', '99', 'CABIFY', 'PEDAGIO', 'ESTACIONAMENTO', 'PASSAGEM', 'HOTEL', 'HOSPEDAGEM'],

  // Bancário
  'TAXAS_BANCARIAS': ['TARIFA', 'IOF', 'TED', 'DOC', 'MANUT CONTA', 'ANUIDADE', 'JUROS', 'MULTA', 'CESTA'],

  // Receitas
  'RECEITA_PROJETO': ['RECEBIMENTO', 'PARCELA', 'MEDICAO', 'ENTRADA'],
  'RECEITA_SERVICO': ['HONORARIO', 'TAXA ADM', 'COMISSAO'],
};

// Mapeamento de Núcleos
const NUCLEOS_MAPPING: Record<string, string[]> = {
  'ARQUITETURA': ['ARQ', 'ARQUITETURA', 'ARQUIT', 'PROJETO ARQ'],
  'ENGENHARIA': ['ENG', 'ENGENHARIA', 'OBRA', 'CONSTRUCAO'],
  'MARCENARIA': ['MARC', 'MARCENARIA', 'MOVEIS', 'MOBILIARIO'],
  'GERAL': ['GERAL', 'ADM', 'ADMINISTRATIVO', 'CORPORATIVO'],
};

// ========================================
// FUNÇÕES DE NORMALIZAÇÍO
// ========================================

function normalizar(texto?: string | null): string {
  if (!texto) return '';
  return texto
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function slug(texto?: string | null): string {
  return normalizar(texto).replace(/[^A-Z0-9]/g, '');
}

function extrairNumeros(texto?: string | null): string {
  if (!texto) return '';
  return texto.replace(/\D/g, '');
}

// ========================================
// ALGORITMO DE SCORE DE MATCH
// ========================================

function calcularScoreMatch(alvo: string, candidato: string): number {
  if (!alvo || !candidato) return 0;

  const alvoNorm = normalizar(alvo);
  const candNorm = normalizar(candidato);

  // Match exato
  if (alvoNorm === candNorm) return 100;

  // Match por slug (sem caracteres especiais)
  if (slug(alvo) === slug(candidato)) return 95;

  // Match por início/fim
  if (candNorm.startsWith(alvoNorm) || alvoNorm.startsWith(candNorm)) return 90;
  if (candNorm.endsWith(alvoNorm) || alvoNorm.endsWith(candNorm)) return 88;

  // Match por contençÍo
  if (candNorm.includes(alvoNorm)) return 85;
  if (alvoNorm.includes(candNorm)) return 80;

  // Match por tokens (palavras)
  const tokensAlvo = alvoNorm.split(' ').filter(t => t.length > 2);
  const tokensCand = candNorm.split(' ').filter(t => t.length > 2);
  const intersecao = tokensAlvo.filter(t => tokensCand.some(tc => tc.includes(t) || t.includes(tc)));

  if (intersecao.length >= 3) return 78;
  if (intersecao.length === 2) return 72;
  if (intersecao.length === 1) return 65;

  // Match por similaridade de Levenshtein simplificada
  const similaridade = calcularSimilaridade(alvoNorm, candNorm);
  if (similaridade > 0.8) return 60;
  if (similaridade > 0.6) return 50;

  return 0;
}

function calcularSimilaridade(s1: string, s2: string): number {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;

  if (longer.length === 0) return 1.0;

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(s1: string, s2: string): number {
  const costs: number[] = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

// ========================================
// FUNÇÕES DE MATCH ESPECÍFICAS
// ========================================

function encontrarMelhorMatch<T extends { id: string }>(
  lista: T[],
  campos: (keyof T)[],
  valorBusca?: string | null,
  scoreMinimo: number = 70
): { item: T | null; score: number } {
  const alvo = normalizar(valorBusca);
  if (!alvo) return { item: null, score: 0 };

  let melhorItem: T | null = null;
  let melhorScore = 0;

  for (const item of lista) {
    for (const campo of campos) {
      const valorCampo = String(item[campo] ?? '');
      const score = calcularScoreMatch(alvo, valorCampo);

      if (score > melhorScore) {
        melhorScore = score;
        melhorItem = item;
      }
    }
  }

  return {
    item: melhorScore >= scoreMinimo ? melhorItem : null,
    score: melhorScore
  };
}

function identificarNucleo(descricao: string, categoriaMatch?: string): string | null {
  const descNorm = normalizar(descricao);

  for (const [nucleo, keywords] of Object.entries(NUCLEOS_MAPPING)) {
    for (const keyword of keywords) {
      if (descNorm.includes(keyword)) {
        return nucleo;
      }
    }
  }

  // Inferir pelo tipo de categoria
  if (categoriaMatch) {
    const catNorm = normalizar(categoriaMatch);
    if (catNorm.includes('ARQ') || catNorm.includes('PROJETO')) return 'ARQUITETURA';
    if (catNorm.includes('OBRA') || catNorm.includes('CONSTRUCAO')) return 'ENGENHARIA';
    if (catNorm.includes('MARC') || catNorm.includes('MOVEL')) return 'MARCENARIA';
  }

  return null;
}

function identificarCategoriaPorKeywords(
  descricao: string,
  tipo: 'entrada' | 'saida',
  categorias: CategoriaFinanceira[]
): { categoria: CategoriaFinanceira | null; score: number } {
  const descNorm = normalizar(descricao);

  let melhorCategoria: CategoriaFinanceira | null = null;
  let melhorScore = 0;

  for (const [tipoCategoria, keywords] of Object.entries(KEYWORDS_CATEGORIAS)) {
    for (const keyword of keywords) {
      if (descNorm.includes(keyword)) {
        // Encontrar categoria correspondente
        const categoria = categorias.find(c => {
          const nomeNorm = normalizar(c.nome);
          return nomeNorm.includes(tipoCategoria) ||
                 tipoCategoria.includes(nomeNorm) ||
                 calcularScoreMatch(tipoCategoria.replace(/_/g, ' '), c.nome) > 70;
        });

        if (categoria) {
          const score = 75 + (keywords.indexOf(keyword) === 0 ? 10 : 0);
          if (score > melhorScore) {
            melhorScore = score;
            melhorCategoria = categoria;
          }
        }
      }
    }
  }

  return { categoria: melhorCategoria, score: melhorScore };
}

function extrairFavorecidoDaDescricao(descricao: string): string | null {

  // Padrões comuns de favorecido
  const padroes = [
    /(?:PIX|TED|DOC|TRANSF)(?:\s+(?:ENVIADO?|RECEBID[OA]|PARA|DE))?\s+[-:]\s*(.+?)(?:\s+[-*]|$)/i,
    /PAGAMENTO\s+(?:A|PARA)\s+(.+?)(?:\s+[-*]|$)/i,
    /(?:DEPOSITO|DEP)\s+(?:DE|PARA)\s+(.+?)(?:\s+[-*]|$)/i,
    /BOLETO\s+(.+?)(?:\s+[-*]|$)/i,
    /FAVORECIDO[:\s]+(.+?)(?:\s+[-*]|$)/i,
  ];

  for (const padrao of padroes) {
    const match = descricao.match(padrao);
    if (match && match[1]) {
      const favorecido = match[1].trim();
      if (favorecido.length > 3) {
        return favorecido;
      }
    }
  }

  return null;
}

// ========================================
// CARREGAR DADOS DE REFERÊNCIA
// ========================================

async function carregarReferencias(): Promise<typeof cacheReferencias> {
  if (cacheReferencias && Date.now() - cacheReferencias.lastUpdate < CACHE_TTL) {
    return cacheReferencias;
  }

  const [padroes, projetos, contratos, categorias, pessoas, centrosCusto, contas] = await Promise.all([
    carregarPadroes(),
    carregarProjetos(),
    carregarContratos(),
    carregarCategorias(),
    carregarPessoas(),
    carregarCentrosCusto(),
    carregarContas(),
  ]);

  cacheReferencias = {
    padroes,
    projetos,
    contratos,
    categorias,
    pessoas,
    centrosCusto,
    contas,
    lastUpdate: Date.now(),
  };

  return cacheReferencias;
}

async function carregarPadroes(): Promise<PadraoAprendido[]> {
  try {
    const { data } = await supabase
      .from('financeiro_padroes_aprendidos')
      .select('*')
      .eq('ativo', true)
      .order('vezes_usado', { ascending: false })
      .limit(500);
    return data || [];
  } catch {
    return [];
  }
}

async function carregarProjetos(): Promise<ProjetoCompleto[]> {
  try {
    const { data } = await supabase
      .from('projetos')
      .select(`
        id, nome, numero, titulo, status,
        cliente_id,
        clientes:cliente_id (nome)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    return (data || []).map((p: ProjetoComCliente) => {
      const cliente = Array.isArray(p.clientes) ? p.clientes[0] : p.clientes;
      return {
        ...p,
        cliente_nome: cliente?.nome || undefined,
      };
    });
  } catch {
    return [];
  }
}

async function carregarContratos(): Promise<ContratoCompleto[]> {
  try {
    const { data } = await supabase
      .from('contratos')
      .select(`
        id, numero, titulo, valor_total, projeto_id,
        cliente_id,
        clientes:cliente_id (nome)
      `)
      .order('created_at', { ascending: false })
      .limit(200);

    return (data || []).map((c: ContratoComCliente) => {
      const cliente = Array.isArray(c.clientes) ? c.clientes[0] : c.clientes;
      return {
        ...c,
        cliente_nome: cliente?.nome || undefined,
      };
    });
  } catch {
    return [];
  }
}

async function carregarCategorias(): Promise<CategoriaFinanceira[]> {
  try {
    const { data: categoriasNovas, error: erroCategoriasNovas } = await supabase
      .from('fin_categories')
      .select('id, name, kind, ativo')
      .eq('ativo', true)
      .order('name');

    if (!erroCategoriasNovas && categoriasNovas && categoriasNovas.length > 0) {
      return categoriasNovas.map((categoria: any) => ({
        id: categoria.id,
        nome: categoria.name,
        tipo: categoria.kind === 'income' ? 'entrada' : 'saida',
      }));
    }

    const { data: categoriasLegadas } = await supabase
      .from('financeiro_categorias')
      .select('id, nome, tipo')
      .order('nome');

    return categoriasLegadas || [];
  } catch {
    return [];
  }
}

async function carregarPessoas(): Promise<PessoaCompleta[]> {
  try {
    const { data } = await supabase
      .from('pessoas')
      .select('id, nome, razao_social, cpf, cnpj, tipo, email')
      .in('tipo', [
        'CLIENTE', 'FORNECEDOR', 'COLABORADOR', 'ESPECIFICADOR', 'PRESTADOR',
        'cliente', 'fornecedor', 'colaborador', 'especificador', 'prestador'
      ])
      .order('nome')
      .limit(1000);
    return data || [];
  } catch {
    return [];
  }
}

async function carregarCentrosCusto(): Promise<CentroCustoCompleto[]> {
  try {
    const { data } = await supabase
      .from('financeiro_centros_custo')
      .select('id, nome, codigo, projeto_id, cliente_id')
      .order('nome')
      .limit(300);
    return data || [];
  } catch {
    return [];
  }
}

async function carregarContas(): Promise<ContaBancaria[]> {
  try {
    const { data } = await supabase
      .from('contas_bancarias')
      .select('id, nome, banco, agencia, numero')
      .order('nome')
      .limit(50);
    return data || [];
  } catch {
    return [];
  }
}

// ========================================
// CLASSIFICADOR PRINCIPAL
// ========================================

export async function classificarLinhas(
  linhas: LinhaExtrato[],
  promptPersonalizado?: string
): Promise<Map<number, ClassificacaoIA>> {
  const resultados = new Map<number, ClassificacaoIA>();

  // Carregar dados de referência
  const refs = await carregarReferencias();
  if (!refs) {
    console.error('[IA] Falha ao carregar referências');
    return resultados;
  }

  // Processar prompt personalizado para regras extras
  const regrasExtras = promptPersonalizado
    ? processarPromptPersonalizado(promptPersonalizado)
    : [];

  // Classificar cada linha
  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const classificacao = await classificarLinha(linha, refs, regrasExtras);
    resultados.set(i, classificacao);
  }

  return resultados;
}

// ========================================
// CLASSIFICAR UMA LINHA
// ========================================

async function classificarLinha(
  linha: LinhaExtrato,
  refs: NonNullable<typeof cacheReferencias>,
  regrasExtras: PadraoAprendido[]
): Promise<ClassificacaoIA> {
  const descricao = linha.descricao;
  const descNorm = normalizar(descricao);

  const resultado: ClassificacaoIA = {
    categoria_id: null,
    categoria_sugerida: null,
    projeto_id: null,
    projeto_sugerido: null,
    contrato_id: null,
    contrato_sugerido: null,
    pessoa_id: null,
    pessoa_sugerida: null,
    centro_custo_id: null,
    centro_custo_sugerido: null,
    nucleo: null,
    conta_id: null,
    conta_sugerida: null,
    confianca: 0,
    motivo: 'NÍo identificado',
    descricao_formatada: formatarDescricao(descricao),
    match_scores: {
      categoria: 0,
      projeto: 0,
      pessoa: 0,
      centro_custo: 0,
      conta: 0,
      nucleo: 0,
    },
  };

  // 1. VERIFICAR PADRÕES APRENDIDOS (maior prioridade)
  const padraoMatch = encontrarPadrao(descNorm, [...refs.padroes, ...regrasExtras]);
  if (padraoMatch) {
    resultado.categoria_id = padraoMatch.categoria_id;
    resultado.projeto_id = padraoMatch.projeto_id;
    resultado.contrato_id = padraoMatch.contrato_id;
    resultado.pessoa_id = padraoMatch.pessoa_id;
    resultado.centro_custo_id = padraoMatch.centro_custo_id;
    resultado.nucleo = padraoMatch.nucleo;
    resultado.confianca = 95;
    resultado.motivo = 'PadrÍo aprendido';
    resultado.match_scores.categoria = padraoMatch.categoria_id ? 95 : 0;
    resultado.match_scores.projeto = padraoMatch.projeto_id ? 95 : 0;
    resultado.match_scores.pessoa = padraoMatch.pessoa_id ? 95 : 0;
  }

  // 2. BUSCAR PROJETO
  if (!resultado.projeto_id) {
    // Primeiro pelo nome do projeto na linha
    const projetoMatch = encontrarMelhorMatch(
      refs.projetos,
      ['nome', 'numero', 'cliente_nome'] as (keyof ProjetoCompleto)[],
      linha.projeto_nome || descricao
    );

    if (projetoMatch.item) {
      resultado.projeto_id = projetoMatch.item.id;
      resultado.projeto_sugerido = projetoMatch.item.nome || projetoMatch.item.numero || null;
      resultado.match_scores.projeto = projetoMatch.score;

      // Se encontrou projeto, pode inferir cliente
      if (!resultado.pessoa_id && projetoMatch.item.cliente_id) {
        const cliente = refs.pessoas.find(p => p.id === projetoMatch.item!.cliente_id);
        if (cliente && linha.tipo === 'entrada') {
          resultado.pessoa_id = cliente.id;
          resultado.pessoa_sugerida = cliente.nome;
          resultado.match_scores.pessoa = 80;
        }
      }
    }
  }

  // 3. BUSCAR CONTRATO
  if (!resultado.contrato_id) {
    const contratoMatch = encontrarMelhorMatch(
      refs.contratos,
      ['numero', 'titulo', 'cliente_nome'] as (keyof ContratoCompleto)[],
      linha.contrato || linha.centro_custo_nome || descricao
    );

    if (contratoMatch.item) {
      resultado.contrato_id = contratoMatch.item.id;
      resultado.contrato_sugerido = contratoMatch.item.numero || contratoMatch.item.titulo || null;

      // Preencher projeto do contrato se nÍo tiver
      if (!resultado.projeto_id && contratoMatch.item.projeto_id) {
        resultado.projeto_id = contratoMatch.item.projeto_id;
      }
    }
  }

  // 4. BUSCAR PESSOA/FAVORECIDO
  if (!resultado.pessoa_id) {
    // Extrair favorecido da descriçÍo
    const favorecidoExtraido = extrairFavorecidoDaDescricao(descricao) || linha.pessoa_nome;

    // Filtrar por tipo de transaçÍo
    const pessoasFiltradas = linha.tipo === 'entrada'
      ? refs.pessoas.filter(p => ['CLIENTE', 'cliente'].includes(p.tipo))
      : refs.pessoas.filter(p => ['FORNECEDOR', 'COLABORADOR', 'ESPECIFICADOR', 'PRESTADOR', 'fornecedor', 'colaborador', 'especificador', 'prestador'].includes(p.tipo));

    const pessoaMatch = encontrarMelhorMatch(
      pessoasFiltradas.length > 0 ? pessoasFiltradas : refs.pessoas,
      ['nome', 'razao_social'] as (keyof PessoaCompleta)[],
      favorecidoExtraido || descricao,
      65
    );

    if (pessoaMatch.item) {
      resultado.pessoa_id = pessoaMatch.item.id;
      resultado.pessoa_sugerida = pessoaMatch.item.nome;
      resultado.match_scores.pessoa = pessoaMatch.score;
    }

    // Match por documento (CPF/CNPJ)
    if (!resultado.pessoa_id && linha.documento) {
      const docLimpo = extrairNumeros(linha.documento);
      const pessoaPorDoc = refs.pessoas.find(p => {
        const cpf = extrairNumeros(p.cpf);
        const cnpj = extrairNumeros(p.cnpj);
        return (cpf && cpf === docLimpo) || (cnpj && cnpj === docLimpo);
      });

      if (pessoaPorDoc) {
        resultado.pessoa_id = pessoaPorDoc.id;
        resultado.pessoa_sugerida = pessoaPorDoc.nome;
        resultado.match_scores.pessoa = 90;
      }
    }
  }

  // 5. BUSCAR CATEGORIA
  if (!resultado.categoria_id) {
    // Filtrar por tipo
    const categoriasDoTipo = refs.categorias.filter(c => {
      const t = normalizar(c.tipo);
      return linha.tipo === 'entrada'
        ? t.includes('ENTRADA') || t.includes('RECEITA')
        : t.includes('SAIDA') || t.includes('DESPESA') || t.includes('PAGAR');
    });

    // Tentar match por nome da planilha
    const categoriaMatch = encontrarMelhorMatch(
      categoriasDoTipo.length > 0 ? categoriasDoTipo : refs.categorias,
      ['nome'] as (keyof CategoriaFinanceira)[],
      linha.categoria_nome
    );

    if (categoriaMatch.item) {
      resultado.categoria_id = categoriaMatch.item.id;
      resultado.categoria_sugerida = categoriaMatch.item.nome;
      resultado.match_scores.categoria = categoriaMatch.score;
    } else {
      // Tentar por keywords
      const categoriaKeyword = identificarCategoriaPorKeywords(descricao, linha.tipo, refs.categorias);
      if (categoriaKeyword.categoria) {
        resultado.categoria_id = categoriaKeyword.categoria.id;
        resultado.categoria_sugerida = categoriaKeyword.categoria.nome;
        resultado.match_scores.categoria = categoriaKeyword.score;
      }
    }
  }

  // 6. BUSCAR CENTRO DE CUSTO
  if (!resultado.centro_custo_id) {
    const ccMatch = encontrarMelhorMatch(
      refs.centrosCusto,
      ['nome', 'codigo'] as (keyof CentroCustoCompleto)[],
      linha.centro_custo_nome || linha.projeto_nome
    );

    if (ccMatch.item) {
      resultado.centro_custo_id = ccMatch.item.id;
      resultado.centro_custo_sugerido = ccMatch.item.nome;
      resultado.match_scores.centro_custo = ccMatch.score;
    }

    // Se tem projeto, buscar centro de custo do projeto
    if (!resultado.centro_custo_id && resultado.projeto_id) {
      const ccProjeto = refs.centrosCusto.find(cc => cc.projeto_id === resultado.projeto_id);
      if (ccProjeto) {
        resultado.centro_custo_id = ccProjeto.id;
        resultado.centro_custo_sugerido = ccProjeto.nome;
        resultado.match_scores.centro_custo = 75;
      }
    }
  }

  // 7. IDENTIFICAR NÚCLEO
  if (!resultado.nucleo) {
    resultado.nucleo = identificarNucleo(descricao, resultado.categoria_sugerida || undefined) ||
                       linha.nucleo ||
                       null;
    resultado.match_scores.nucleo = resultado.nucleo ? 70 : 0;
  }

  // 8. BUSCAR CONTA BANCÁRIA
  if (!resultado.conta_id && linha.conta_nome) {
    const contaMatch = encontrarMelhorMatch(
      refs.contas,
      ['nome', 'banco', 'numero'] as (keyof ContaBancaria)[],
      linha.conta_nome
    );

    if (contaMatch.item) {
      resultado.conta_id = contaMatch.item.id;
      resultado.conta_sugerida = contaMatch.item.nome;
      resultado.match_scores.conta = contaMatch.score;
    }
  }

  // 9. CALCULAR CONFIANÇA FINAL
  const scores = resultado.match_scores;
  const camposPreenchidos = [
    scores.categoria > 0,
    scores.projeto > 0,
    scores.pessoa > 0,
    scores.centro_custo > 0,
  ].filter(Boolean).length;

  const somaScores = scores.categoria + scores.projeto + scores.pessoa + scores.centro_custo;
  const mediaScores = camposPreenchidos > 0 ? somaScores / (camposPreenchidos * 100) * 100 : 0;

  if (resultado.confianca < 95) {
    resultado.confianca = Math.round(Math.max(resultado.confianca, mediaScores));
  }

  // Definir motivo
  if (resultado.confianca >= 80) {
    const motivos: string[] = [];
    if (scores.projeto > 0) motivos.push('projeto');
    if (scores.pessoa > 0) motivos.push('favorecido');
    if (scores.categoria > 0) motivos.push('categoria');
    resultado.motivo = `Match automático: ${motivos.join(', ')}`;
  } else if (resultado.confianca >= 50) {
    resultado.motivo = 'Match parcial - requer revisÍo';
  } else {
    resultado.motivo = 'A definir - classificaçÍo manual necessária';
  }

  return resultado;
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function encontrarPadrao(descricao: string, padroes: PadraoAprendido[]): PadraoAprendido | null {
  for (const padrao of padroes) {
    const texto = normalizar(padrao.padrao_texto);

    switch (padrao.tipo_match) {
      case 'exact':
        if (descricao === texto) return padrao;
        break;
      case 'starts_with':
        if (descricao.startsWith(texto)) return padrao;
        break;
      case 'contains':
        if (descricao.includes(texto)) return padrao;
        break;
      case 'regex':
        try {
          if (new RegExp(padrao.padrao_texto, 'i').test(descricao)) return padrao;
        } catch {
          // Regex inválido
        }
        break;
      default:
        if (descricao.includes(texto)) return padrao;
    }
  }
  return null;
}

function processarPromptPersonalizado(prompt: string): PadraoAprendido[] {
  const padroes: PadraoAprendido[] = [];

  // Extrair padrões do texto do prompt
  const regexPadrao = /(?:pagamento|despesa|transaçÍo|gasto|recebimento)s?\s+(?:para|com|de)\s+['"]([^'"]+)['"]/gi;
  let match;

  while ((match = regexPadrao.exec(prompt)) !== null) {
    padroes.push({
      id: `custom-${padroes.length}`,
      padrao_texto: match[1],
      tipo_match: 'contains',
      categoria_id: null,
      projeto_id: null,
      contrato_id: null,
      pessoa_id: null,
      centro_custo_id: null,
      nucleo: null,
      vezes_usado: 0,
    });
  }

  return padroes;
}

function formatarDescricao(descricao: string): string {
  let formatada = descricao.replace(/\s+/g, ' ').trim();

  // Capitalizar primeira letra de cada palavra
  formatada = formatada
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, a => a.toUpperCase());

  // Manter siglas em maiúsculas
  formatada = formatada.replace(
    /\b(PIX|TED|DOC|DARF|GPS|FGTS|INSS|ICMS|ISS|CNPJ|CPF|BTG|ITAU|BRADESCO|BB|CEF|SANTANDER)\b/gi,
    m => m.toUpperCase()
  );

  return formatada;
}

// ========================================
// VERIFICAR DUPLICATAS MELHORADO
// ========================================

export async function verificarDuplicatas(
  linhas: LinhaExtrato[]
): Promise<Map<number, string>> {
  const duplicatas = new Map<number, string>();

  // Agrupar por data+valor para busca otimizada
  const grupos: Map<string, number[]> = new Map();
  linhas.forEach((linha, index) => {
    const chave = `${linha.data}|${linha.valor.toFixed(2)}`;
    if (!grupos.has(chave)) {
      grupos.set(chave, []);
    }
    grupos.get(chave)!.push(index);
  });

  // Buscar duplicatas no banco
  for (const [chave, índices] of grupos.entries()) {
    const [data, valorStr] = chave.split('|');
    const valor = parseFloat(valorStr);

    const { data: existentes } = await supabase
      .from('financeiro_lancamentos')
      .select('id, descricao')
      .eq('data_competencia', data)
      .gte('valor_total', valor - 0.01)
      .lte('valor_total', valor + 0.01)
      .limit(1);

    if (existentes && existentes.length > 0) {
      for (const idx of índices) {
        duplicatas.set(idx, existentes[0].id);
      }
    }
  }

  return duplicatas;
}

// ========================================
// SALVAR PADRÍO APRENDIDO MELHORADO
// ========================================

export async function salvarPadraoAprendido(
  padrao: string,
  classificacao: {
    categoria_id?: string;
    projeto_id?: string;
    contrato_id?: string;
    pessoa_id?: string;
    centro_custo_id?: string;
    nucleo?: string;
  }
): Promise<void> {
  try {
    // Verificar se padrÍo já existe
    const { data: existente } = await supabase
      .from('financeiro_padroes_aprendidos')
      .select('id, vezes_usado')
      .eq('padrao_texto', padrao)
      .maybeSingle();

    if (existente) {
      // Incrementar contador
      await supabase
        .from('financeiro_padroes_aprendidos')
        .update({
          ...classificacao,
          vezes_usado: (existente.vezes_usado || 0) + 1,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', existente.id);
    } else {
      // Criar novo padrÍo
      await supabase
        .from('financeiro_padroes_aprendidos')
        .insert({
          padrao_texto: padrao,
          tipo_match: 'contains',
          ...classificacao,
          vezes_usado: 1,
          ativo: true,
        });
    }

    // Invalidar cache
    cacheReferencias = null;
  } catch (error) {
    console.error('[IA] Erro ao salvar padrÍo:', error);
  }
}

// ========================================
// CALCULAR MÉTRICAS DE VALIDAÇÍO
// ========================================

export function calcularMetricasValidacao(
  linhas: LinhaExtrato[],
  classificacoes: Map<number, ClassificacaoIA>,
  duplicatas: Map<number, string>
): MetricasValidacao {
  const total = linhas.length;

  let linhasValidas = 0;
  let linhasComData = 0;
  let linhasComValor = 0;
  let linhasComDescricao = 0;
  let matchCategoria = 0;
  let matchProjeto = 0;
  let matchPessoa = 0;
  let matchCentroCusto = 0;
  let matchConta = 0;
  let matchNucleo = 0;
  let somaConfianca = 0;
  let valorEntradas = 0;
  let valorSaidas = 0;
  let dataMin: string | null = null;
  let dataMax: string | null = null;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const classif = classificacoes.get(i);

    // ValidaçÍo básica
    if (linha.data) linhasComData++;
    if (linha.valor > 0) linhasComValor++;
    if (linha.descricao && linha.descricao.length > 3) linhasComDescricao++;

    if (linha.data && linha.valor > 0 && linha.descricao) {
      linhasValidas++;
    }

    // Match de campos
    if (classif) {
      if (classif.categoria_id) matchCategoria++;
      if (classif.projeto_id) matchProjeto++;
      if (classif.pessoa_id) matchPessoa++;
      if (classif.centro_custo_id) matchCentroCusto++;
      if (classif.conta_id) matchConta++;
      if (classif.nucleo) matchNucleo++;
      somaConfianca += classif.confianca;
    }

    // Valores
    if (linha.tipo === 'entrada') {
      valorEntradas += linha.valor;
    } else {
      valorSaidas += linha.valor;
    }

    // Período
    if (linha.data) {
      if (!dataMin || linha.data < dataMin) dataMin = linha.data;
      if (!dataMax || linha.data > dataMax) dataMax = linha.data;
    }
  }

  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0;

  return {
    total_linhas: total,
    linhas_validas: linhasValidas,
    linhas_com_data: linhasComData,
    linhas_com_valor: linhasComValor,
    linhas_com_descricao: linhasComDescricao,
    match_categoria: pct(matchCategoria),
    match_projeto: pct(matchProjeto),
    match_pessoa: pct(matchPessoa),
    match_centro_custo: pct(matchCentroCusto),
    match_conta: pct(matchConta),
    match_nucleo: pct(matchNucleo),
    confianca_media: total > 0 ? Math.round(somaConfianca / total) : 0,
    valor_total_entradas: valorEntradas,
    valor_total_saidas: valorSaidas,
    periodo_inicio: dataMin,
    periodo_fim: dataMax,
    duplicatas_encontradas: duplicatas.size,
  };
}

// ========================================
// LIMPAR CACHE
// ========================================

export function limparCacheReferencias(): void {
  cacheReferencias = null;
}

// ========================================
// SISTEMA DE VALIDAÇÍO AUTOMÁTICA
// ========================================

export interface ResultadoValidacao {
  valido: boolean;
  erros: string[];
  avisos: string[];
  sugestoes: string[];
  detalhes: {
    linhasInvalidas: number[];
    linhasSemCategoria: number[];
    linhasSemProjeto: number[];
    linhasSemFavorecido: number[];
    valoresZerados: number[];
    datasFuturas: number[];
    datasAntigas: number[];
    possivelDuplicata: number[];
  };
}

export function validarImportacao(
  linhas: LinhaExtrato[],
  classificacoes: Map<number, ClassificacaoIA>,
  opcoes?: {
    exigirCategoria?: boolean;
    exigirProjeto?: boolean;
    exigirFavorecido?: boolean;
    diasMaximoPassado?: number;
    permitirFuturo?: boolean;
  }
): ResultadoValidacao {
  const config = {
    exigirCategoria: opcoes?.exigirCategoria ?? false,
    exigirProjeto: opcoes?.exigirProjeto ?? false,
    exigirFavorecido: opcoes?.exigirFavorecido ?? false,
    diasMaximoPassado: opcoes?.diasMaximoPassado ?? 365,
    permitirFuturo: opcoes?.permitirFuturo ?? false,
  };

  const resultado: ResultadoValidacao = {
    valido: true,
    erros: [],
    avisos: [],
    sugestoes: [],
    detalhes: {
      linhasInvalidas: [],
      linhasSemCategoria: [],
      linhasSemProjeto: [],
      linhasSemFavorecido: [],
      valoresZerados: [],
      datasFuturas: [],
      datasAntigas: [],
      possivelDuplicata: [],
    },
  };

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dataLimitePassado = new Date(hoje);
  dataLimitePassado.setDate(dataLimitePassado.getDate() - config.diasMaximoPassado);

  // Mapa para detectar duplicatas internas
  const transacoesVistas = new Map<string, number>();

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const classif = classificacoes.get(i);

    // 1. ValidaçÍo básica (data, valor, descriçÍo)
    if (!linha.data || !linha.valor || !linha.descricao) {
      resultado.detalhes.linhasInvalidas.push(i);
      resultado.erros.push(`Linha ${i + 1}: Falta data, valor ou descriçÍo`);
      resultado.valido = false;
      continue;
    }

    // 2. Validar valor
    if (linha.valor <= 0) {
      resultado.detalhes.valoresZerados.push(i);
      resultado.avisos.push(`Linha ${i + 1}: Valor zerado ou negativo (${linha.valor})`);
    }

    // 3. Validar data
    const dataLinha = new Date(linha.data + 'T00:00:00');

    if (!config.permitirFuturo && dataLinha > hoje) {
      resultado.detalhes.datasFuturas.push(i);
      resultado.avisos.push(`Linha ${i + 1}: Data no futuro (${linha.data})`);
    }

    if (dataLinha < dataLimitePassado) {
      resultado.detalhes.datasAntigas.push(i);
      resultado.avisos.push(`Linha ${i + 1}: Data muito antiga (${linha.data})`);
    }

    // 4. Validar categoria (se exigido)
    if (config.exigirCategoria && !classif?.categoria_id) {
      resultado.detalhes.linhasSemCategoria.push(i);
      if (resultado.detalhes.linhasSemCategoria.length <= 5) {
        resultado.avisos.push(`Linha ${i + 1}: Sem categoria identificada`);
      }
    }

    // 5. Validar projeto (se exigido)
    if (config.exigirProjeto && !classif?.projeto_id) {
      resultado.detalhes.linhasSemProjeto.push(i);
    }

    // 6. Validar favorecido (se exigido)
    if (config.exigirFavorecido && !classif?.pessoa_id) {
      resultado.detalhes.linhasSemFavorecido.push(i);
    }

    // 7. Detectar possíveis duplicatas internas
    const chave = `${linha.data}|${linha.valor.toFixed(2)}|${normalizar(linha.descricao).substring(0, 30)}`;
    if (transacoesVistas.has(chave)) {
      resultado.detalhes.possivelDuplicata.push(i);
      resultado.avisos.push(
        `Linha ${i + 1}: Possível duplicata da linha ${transacoesVistas.get(chave)! + 1}`
      );
    } else {
      transacoesVistas.set(chave, i);
    }
  }

  // Gerar resumo de avisos agregados
  if (resultado.detalhes.linhasSemCategoria.length > 5) {
    resultado.avisos.push(
      `${resultado.detalhes.linhasSemCategoria.length} linhas sem categoria identificada`
    );
  }

  if (resultado.detalhes.linhasSemProjeto.length > 0) {
    resultado.sugestoes.push(
      `${resultado.detalhes.linhasSemProjeto.length} linhas sem projeto - considere vincular manualmente`
    );
  }

  if (resultado.detalhes.linhasSemFavorecido.length > 0) {
    resultado.sugestoes.push(
      `${resultado.detalhes.linhasSemFavorecido.length} linhas sem favorecido identificado`
    );
  }

  // Sugestões baseadas em padrões
  const pctComCategoria = classificacoes.size > 0
    ? (Array.from(classificacoes.values()).filter(c => c.categoria_id).length / classificacoes.size) * 100
    : 0;

  if (pctComCategoria < 50) {
    resultado.sugestoes.push(
      'Menos de 50% das linhas têm categoria - considere configurar padrões de categorizaçÍo'
    );
  }

  if (resultado.detalhes.possivelDuplicata.length > 0) {
    resultado.sugestoes.push(
      `${resultado.detalhes.possivelDuplicata.length} possíveis duplicatas internas - revise antes de importar`
    );
  }

  return resultado;
}

// ========================================
// EXPORTAR PARA REVISÍO EXTERNA
// ========================================

export interface LinhaRevisao {
  índice: number;
  data: string;
  descricao: string;
  valor: number;
  tipo: 'entrada' | 'saida';
  categoria_sugerida: string | null;
  projeto_sugerido: string | null;
  pessoa_sugerida: string | null;
  confianca: number;
  motivo: string;
  requer_revisao: boolean;
  motivo_revisao: string[];
}

export function gerarRevisaoManual(
  linhas: LinhaExtrato[],
  classificacoes: Map<number, ClassificacaoIA>
): LinhaRevisao[] {
  const revisoes: LinhaRevisao[] = [];

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const classif = classificacoes.get(i);

    const motivosRevisao: string[] = [];
    let requerRevisao = false;

    // Verificar confiança baixa
    if (!classif || classif.confianca < 50) {
      requerRevisao = true;
      motivosRevisao.push('Confiança baixa na classificaçÍo');
    }

    // Verificar campos vazios importantes
    if (!classif?.categoria_id) {
      motivosRevisao.push('Sem categoria');
    }

    if (!classif?.projeto_id && !classif?.centro_custo_id) {
      motivosRevisao.push('Sem projeto ou centro de custo');
    }

    if (!classif?.pessoa_id && linha.tipo === 'saida') {
      motivosRevisao.push('Saída sem favorecido identificado');
    }

    // Valor alto sem projeto
    if (linha.valor > 10000 && !classif?.projeto_id) {
      requerRevisao = true;
      motivosRevisao.push('Valor alto sem projeto vinculado');
    }

    revisoes.push({
      índice: i,
      data: linha.data,
      descricao: linha.descricao,
      valor: linha.valor,
      tipo: linha.tipo,
      categoria_sugerida: classif?.categoria_sugerida || null,
      projeto_sugerido: classif?.projeto_sugerido || null,
      pessoa_sugerida: classif?.pessoa_sugerida || null,
      confianca: classif?.confianca || 0,
      motivo: classif?.motivo || 'NÍo classificado',
      requer_revisao: requerRevisao || motivosRevisao.length > 2,
      motivo_revisao: motivosRevisao,
    });
  }

  return revisoes;
}


