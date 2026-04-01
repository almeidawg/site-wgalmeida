// ============================================================
// TYPES: ImportaçÍo de Pedidos de Fornecedores
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

/**
 * Dados do fornecedor extraídos do pedido
 */
export interface FornecedorPedido {
  nome: string;
  cnpj: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  // ID se já existir no sistema
  id?: string;
  existeNoSistema?: boolean;
}

/**
 * Dados do cliente/comprador extraídos do pedido
 */
export interface ClientePedido {
  codigo?: string;
  nome: string;
  cnpj?: string;
  endereco?: string;
  telefone?: string;
}

/**
 * Item individual do pedido importado
 */
export interface ItemPedidoImportado {
  codigo_fornecedor: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  preco_unitario: number;
  valor_total: number;
  // Match com pricelist
  pricelist_item_id?: string;
  pricelist_match?: {
    id: string;
    nome: string;
    preco: number;
    similaridade: number; // 0-100
  };
  // Status do match
  status_match: "encontrado" | "similar" | "nao_encontrado";
  // Se deve ser cadastrado no pricelist
  cadastrar_pricelist?: boolean;
}

/**
 * Dados de pagamento do pedido
 */
export interface PagamentoPedido {
  forma: string; // "BOLETO", "PIX", "CARTAO", etc.
  condicao?: string; // "28/42/56 DIAS", "À VISTA", etc.
  valor_produtos: number;
  valor_frete: number;
  valor_desconto?: number;
  valor_total: number;
  valor_pendente?: number;
}

/**
 * Pedido completo importado do PDF
 */
export interface PedidoImportado {
  // IdentificaçÍo
  numero_sequencia: string;
  data_pedido: string; // ISO date
  hora_pedido?: string;
  tipo?: string; // "VENDA", "ORCAMENTO", etc.

  // Partes envolvidas
  fornecedor: FornecedorPedido;
  cliente: ClientePedido;
  vendedor?: string;

  // Itens
  itens: ItemPedidoImportado[];

  // Pagamento
  pagamento: PagamentoPedido;

  // Observações
  observacoes?: string[];

  // Metadados
  arquivo_origem?: string;
  data_importacao: string;
}

/**
 * Resultado do parsing do PDF
 */
export interface ResultadoParsing {
  sucesso: boolean;
  pedido?: PedidoImportado;
  erros?: string[];
  avisos?: string[];
}

/**
 * Status de processamento do item
 */
export type StatusProcessamentoItem =
  | "pendente"
  | "processando"
  | "sucesso"
  | "erro";

/**
 * Item processado para importaçÍo final
 */
export interface ItemProcessado extends ItemPedidoImportado {
  status_processamento: StatusProcessamentoItem;
  erro_processamento?: string;
  // Dados para cadastro no pricelist
  dados_pricelist?: {
    nome: string;
    codigo: string;
    unidade: string;
    preco: number;
    tipo: "material";
    fornecedor_id?: string;
    categoria_id?: string;
  };
}

/**
 * ConfiguraçÍo de mapeamento de unidades
 * Mapeia unidades do fornecedor para unidades do sistema
 */
export const MAPA_UNIDADES: Record<string, string> = {
  UN: "und",
  UND: "und",
  UNID: "und",
  UNIDADE: "und",
  PC: "pc",
  PÇ: "pç",
  PEÇA: "pc",
  PECAS: "pç",
  CX: "cx",
  CAIXA: "cx",
  M: "m",
  ML: "m",
  METRO: "m",
  "M²": "m²",
  M2: "m²",
  "METRO QUADRADO": "m²",
  KG: "kg",
  QUILO: "kg",
  L: "l",
  LT: "l",
  LITRO: "l",
  SC: "sc",
  SACO: "sc",
  BD: "und", // Balde
  CT: "ct", // Cento
  CENTO: "ct",
  MI: "mi", // Milheiro
  MILHEIRO: "mi",
  CE: "ct", // Cento
  PAR: "par",
  CONJ: "conj",
  CONJUNTO: "conj",
  ROLO: "rolo",
  RL: "rolo",
};

/**
 * Normaliza unidade do fornecedor para o sistema
 */
export function normalizarUnidade(unidadeFornecedor: string): string {
  const unidadeUpper = unidadeFornecedor.trim().toUpperCase();
  return MAPA_UNIDADES[unidadeUpper] || unidadeFornecedor.toLowerCase();
}

/**
 * Limpa e formata CNPJ
 */
export function formatarCNPJ(cnpj: string): string {
  const numeros = cnpj.replace(/\D/g, "");
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
 * Limpa CNPJ para comparaçÍo
 */
export function limparCNPJ(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Calcula similaridade entre duas strings (Levenshtein simplificado)
 */
export function calcularSimilaridade(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().trim();
  const s2 = str2.toLowerCase().trim();

  if (s1 === s2) return 100;

  // Verifica se uma contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    const maior = Math.max(s1.length, s2.length);
    const menor = Math.min(s1.length, s2.length);
    return Math.round((menor / maior) * 100);
  }

  // Conta palavras em comum
  const palavras1 = s1.split(/\s+/).filter((p) => p.length > 2);
  const palavras2 = s2.split(/\s+/).filter((p) => p.length > 2);

  let matches = 0;
  for (const p1 of palavras1) {
    for (const p2 of palavras2) {
      if (p1 === p2 || p1.includes(p2) || p2.includes(p1)) {
        matches++;
        break;
      }
    }
  }

  const totalPalavras = Math.max(palavras1.length, palavras2.length);
  if (totalPalavras === 0) return 0;

  return Math.round((matches / totalPalavras) * 100);
}

