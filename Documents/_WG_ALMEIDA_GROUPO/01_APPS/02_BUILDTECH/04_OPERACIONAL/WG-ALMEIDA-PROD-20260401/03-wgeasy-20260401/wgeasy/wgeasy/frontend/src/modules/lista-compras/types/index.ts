// ============================================================
// Lista de Compras - Tipos TypeScript
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

// Tipos de compra
export type TipoCompra = 'WG_COMPRA' | 'CLIENTE_DIRETO';

// Tipos de conta (separaçÍo fiscal)
export type TipoConta = 'REAL' | 'VIRTUAL';

// Status do item
export type StatusItem = 'PENDENTE' | 'APROVADO' | 'COMPRADO' | 'ENTREGUE' | 'CANCELADO';

// Obrigatoriedade de complementar
export type Obrigatoriedade = 'OBRIGATORIO' | 'RECOMENDADO' | 'OPCIONAL';

// Unidades de medida
export type Unidade = 'm²' | 'm' | 'un' | 'kg' | 'L' | 'sc' | 'cx' | 'kit' | 'rolo' | 'folha' | 'lata' | 'par' | 'pç' | 'ml';

// ============================================================
// INTERFACES PRINCIPAIS
// ============================================================

/**
 * Item da Lista de Compras
 */
export interface ItemListaCompra {
  id: string;
  projeto_id: string;
  contrato_id?: string;
  quantitativo_id?: string;
  pricelist_item_id?: string;

  // LocalizaçÍo
  ambiente: string;
  categoria: string;

  // Produto
  item: string;
  descricao?: string;
  imagem_url?: string;
  link_produto?: string;

  // Quantidade e valores
  qtd_compra: number;
  unidade: string;
  preco_unit: number;
  valor_total: number;

  // Tipo de compra e conta (FEE)
  tipo_compra: TipoCompra;
  tipo_conta: TipoConta;
  taxa_fee_percent: number;
  valor_fee: number;

  // Fornecedor
  fornecedor_id?: string;
  fornecedor_nome?: string;

  // Status e datas
  status: StatusItem;
  data_aprovacao?: string;
  data_compra?: string;
  data_entrega?: string;

  // Nota fiscal
  numero_nf?: string;

  // Complementar
  is_complementar: boolean;
  item_pai_id?: string;

  // Observações
  observacoes?: string;

  // Auditoria
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
}

/**
 * Item da Lista Completa (view com joins)
 */
export interface ItemListaCompraCompleta extends ItemListaCompra {
  projeto_nome?: string;
  contrato_numero?: string;
  cliente_nome?: string;
  produto_codigo?: string;
  fabricante?: string;
  modelo?: string;
  linha?: string;
  fornecedor?: string;
}

/**
 * Quantitativo do Projeto (dados da arquiteta)
 */
export interface QuantitativoProjeto {
  id: string;
  projeto_id: string;
  contrato_id?: string;
  ambiente: string;
  assunto?: string;
  aplicacao?: string;
  descricao_projeto: string;
  qtd_projeto: number;
  unidade: string;
  fornecedor?: string;
  fabricante?: string;
  modelo?: string;
  codigo_fabricante?: string;
  qtd_compra?: number;
  pricelist_item_id?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Produto do Pricelist (resultado da busca)
 */
export interface ProdutoPricelist {
  id: string;
  codigo?: string;
  nome: string;
  descricao?: string;
  fabricante?: string;
  modelo?: string;
  linha?: string;
  preco: number;
  unidade: string;
  imagem_url?: string;
  link_produto?: string;
  categoria_id?: string;
  fornecedor_id?: string;
}

/**
 * Produto Complementar
 */
export interface ProdutoComplementar {
  id: string;
  produto_base_id?: string;
  categoria_base?: string;
  complemento_id?: string;
  complemento_descricao: string;
  categoria_complemento?: string;
  qtd_por_unidade: number;
  unidade_calculo: string;
  tipo?: string;
  obrigatoriedade: Obrigatoriedade;
  preco_referencia?: number;
  ativo: boolean;
}

/**
 * Complementar Calculado (retorno da function)
 */
export interface ComplementarCalculado {
  complemento_descricao: string;
  quantidade_necessaria: number;
  unidade: string;
  preco_referencia: number;
  valor_estimado: number;
  obrigatoriedade: Obrigatoriedade;
  selecionado?: boolean;
}

/**
 * Dashboard Financeiro do Projeto
 */
export interface DashboardFinanceiro {
  projeto_id: string;
  projeto_nome?: string;
  contrato_numero?: string;
  cliente_nome?: string;
  total_itens: number;
  valor_total_lista: number;
  total_wg_compra: number;
  total_cliente_direto: number;
  total_fee: number;
  conta_real: number;
  conta_virtual: number;
  valor_pendente: number;
  valor_aprovado: number;
  valor_comprado: number;
  valor_entregue: number;
}

/**
 * TotalizaçÍo do Projeto (retorno da function)
 */
export interface TotalizacaoProjeto {
  total_itens: number;
  valor_total: number;
  valor_wg_compra: number;
  valor_cliente_direto: number;
  valor_fee: number;
  conta_real: number;
  conta_virtual: number;
}

/**
 * SeparaçÍo Fiscal (REAL vs VIRTUAL)
 */
export interface SeparacaoFiscal {
  tipo_conta: TipoConta;
  total_itens: number;
  total_compras_wg: number;
  total_cliente_direto: number;
  total_fee: number;
  total_liquido: number;
}

/**
 * Fluxo Financeiro de Compras
 */
export interface FluxoFinanceiroCompra {
  id: string;
  projeto_id?: string;
  contrato_id?: string;
  lista_compra_id?: string;
  data: string;
  cliente_id?: string;
  cliente_nome?: string;
  categoria?: string;
  descricao?: string;
  tipo_compra: TipoCompra;
  tipo_conta: TipoConta;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  valor_bruto: number;
  taxa_fee_percent: number;
  valor_fee: number;
  valor_liquido: number;
  status: 'PENDENTE' | 'EFETIVADO' | 'CANCELADO';
  lancamento_id?: string;
  numero_nf?: string;
  data_nf?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================
// TIPOS AUXILIARES
// ============================================================

/**
 * Filtros da Lista de Compras
 */
export interface FiltrosListaCompras {
  ambiente?: string;
  categoria?: string;
  status?: StatusItem;
  tipo_compra?: TipoCompra;
  fornecedor?: string;
  busca?: string;
}

/**
 * Dados para criar novo item
 */
export interface NovoItemListaCompra {
  projeto_id: string;
  contrato_id?: string;
  pricelist_item_id?: string;
  ambiente: string;
  categoria?: string;
  item: string;
  descricao?: string;
  imagem_url?: string;
  link_produto?: string;
  qtd_compra: number;
  unidade: string;
  preco_unit: number;
  tipo_compra: TipoCompra;
  taxa_fee_percent?: number;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  is_complementar?: boolean;
  item_pai_id?: string;
  observacoes?: string;
}

/**
 * Dados para atualizar item
 */
export interface AtualizarItemListaCompra {
  id: string;
  qtd_compra?: number;
  preco_unit?: number;
  tipo_compra?: TipoCompra;
  taxa_fee_percent?: number;
  status?: StatusItem;
  fornecedor_id?: string;
  fornecedor_nome?: string;
  observacoes?: string;
}

/**
 * Agrupamento por ambiente
 */
export interface GrupoAmbiente {
  ambiente: string;
  itens: ItemListaCompra[];
  totalValor: number;
  totalFee: number;
}

/**
 * Opções de Status para Select
 */
export const STATUS_OPTIONS: { value: StatusItem; label: string; color: string }[] = [
  { value: 'PENDENTE', label: 'Pendente', color: 'gray' },
  { value: 'APROVADO', label: 'Aprovado', color: 'blue' },
  { value: 'COMPRADO', label: 'Comprado', color: 'green' },
  { value: 'ENTREGUE', label: 'Entregue', color: 'emerald' },
  { value: 'CANCELADO', label: 'Cancelado', color: 'red' },
];

/**
 * Opções de Tipo de Compra
 */
export const TIPO_COMPRA_OPTIONS: { value: TipoCompra; label: string; color: string; description: string }[] = [
  {
    value: 'WG_COMPRA',
    label: 'WG Compra',
    color: 'green',
    description: 'WG compra e fatura para cliente (CONTA REAL)'
  },
  {
    value: 'CLIENTE_DIRETO',
    label: 'Cliente Direto',
    color: 'amber',
    description: 'Cliente compra direto na loja (CONTA VIRTUAL + FEE)'
  },
];

/**
 * Cores de obrigatoriedade
 */
export const OBRIGATORIEDADE_COLORS: Record<Obrigatoriedade, string> = {
  OBRIGATORIO: 'red',
  RECOMENDADO: 'amber',
  OPCIONAL: 'gray',
};

