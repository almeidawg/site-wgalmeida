// ============================================================
// TIPOS DO SISTEMA OCR - WG Easy
// Estruturas de dados para extraçÍo de documentos
// ============================================================

/**
 * Tipos de documentos suportados pelo OCR
 */
export type TipoDocumento =
  | 'nota_fiscal'
  | 'cupom_fiscal'
  | 'recibo'
  | 'comprovante_pix'
  | 'comprovante_ted'
  | 'boleto'
  | 'orcamento_fornecedor'
  | 'outro';

/**
 * Campo extraído com indicador de confiança
 */
export interface CampoExtraido<T> {
  valor: T | null;
  confianca: number; // 0-100
  origem: 'ocr' | 'inferido' | 'manual';
}

/**
 * Resultado principal do OCR
 */
export interface ResultadoOCR {
  tipo: TipoDocumento;
  confiancaGeral: number; // 0-100
  textoCompleto: string; // Texto bruto extraído

  // Dados comuns a todos os documentos
  dadosComuns: {
    data: CampoExtraido<string>; // ISO date
    valor: CampoExtraido<number>;
    descricao: CampoExtraido<string>;
  };

  // Dados específicos por tipo
  notaFiscal?: DadosNotaFiscal;
  cupomFiscal?: DadosCupomFiscal;
  comprovante?: DadosComprovante;
  orcamento?: DadosOrcamento;

  // Metadados
  imagemOriginal: string; // base64
  processadoEm: string; // timestamp
}

/**
 * Dados específicos de Nota Fiscal (NF-e / NFC-e)
 */
export interface DadosNotaFiscal {
  numero: CampoExtraido<string>;
  serie: CampoExtraido<string>;
  chaveAcesso: CampoExtraido<string>; // 44 dígitos
  emitente: {
    nome: CampoExtraido<string>;
    cnpj: CampoExtraido<string>;
    endereco: CampoExtraido<string>;
  };
  itens: ItemNota[];
  impostos?: {
    icms: CampoExtraido<number>;
    pis: CampoExtraido<number>;
    cofins: CampoExtraido<number>;
  };
}

/**
 * Item de Nota Fiscal
 */
export interface ItemNota {
  descricao: CampoExtraido<string>;
  quantidade: CampoExtraido<number>;
  unidade: CampoExtraido<string>;
  valorUnitario: CampoExtraido<number>;
  valorTotal: CampoExtraido<number>;
  codigo?: CampoExtraido<string>;
  ncm?: CampoExtraido<string>;
  produtoVinculado?: string; // ID do pricelist (se vinculado)
}

/**
 * Dados de Cupom Fiscal
 */
export interface DadosCupomFiscal {
  numero: CampoExtraido<string>;
  coo: CampoExtraido<string>; // Contador de Ordem de OperaçÍo
  estabelecimento: {
    nome: CampoExtraido<string>;
    cnpj: CampoExtraido<string>;
    endereco: CampoExtraido<string>;
  };
  itens: ItemCupom[];
  formaPagamento: CampoExtraido<string>;
  troco?: CampoExtraido<number>;
}

/**
 * Item de Cupom Fiscal
 */
export interface ItemCupom {
  descricao: CampoExtraido<string>;
  quantidade: CampoExtraido<number>;
  valorUnitario: CampoExtraido<number>;
  valorTotal: CampoExtraido<number>;
  codigo?: CampoExtraido<string>;
}

/**
 * Dados de Comprovante de Pagamento (PIX/TED/Boleto)
 */
export interface DadosComprovante {
  tipoTransacao: CampoExtraido<'pix' | 'ted' | 'boleto' | 'debito' | 'credito' | 'dinheiro'>;
  idTransacao: CampoExtraido<string>;
  codigoAutenticacao: CampoExtraido<string>;
  favorecido: {
    nome: CampoExtraido<string>;
    documento: CampoExtraido<string>; // CPF/CNPJ
    banco: CampoExtraido<string>;
    agencia?: CampoExtraido<string>;
    conta?: CampoExtraido<string>;
    chavePix?: CampoExtraido<string>;
  };
  pagador: {
    nome: CampoExtraido<string>;
    documento: CampoExtraido<string>;
    banco?: CampoExtraido<string>;
  };
}

/**
 * Dados de Orçamento de Fornecedor
 */
export interface DadosOrcamento {
  numero: CampoExtraido<string>;
  fornecedor: {
    nome: CampoExtraido<string>;
    cnpj: CampoExtraido<string>;
    contato: CampoExtraido<string>;
  };
  validade: CampoExtraido<string>;
  condicaoPagamento: CampoExtraido<string>;
  prazoEntrega: CampoExtraido<string>;
  itens: ItemOrcamento[];
  observacoes: CampoExtraido<string>;
}

/**
 * Item de Orçamento
 */
export interface ItemOrcamento {
  codigo: CampoExtraido<string>;
  descricao: CampoExtraido<string>;
  quantidade: CampoExtraido<number>;
  unidade: CampoExtraido<string>;
  valorUnitario: CampoExtraido<number>;
  valorTotal: CampoExtraido<number>;
  disponibilidade?: CampoExtraido<string>;
}

/**
 * Resposta da Edge Function de OCR
 */
export interface RespostaOCR {
  sucesso: boolean;
  resultado?: ResultadoOCR;
  erro?: string;
  tempoProcessamento?: number; // ms
}

/**
 * Configurações do Scanner
 */
export interface ConfiguracaoScanner {
  tiposAceitos?: TipoDocumento[];
  modo?: 'camera' | 'upload' | 'ambos';
  qualidadeImagem?: 'baixa' | 'media' | 'alta';
  maxTamanhoMB?: number;
  permitirPDF?: boolean;
}

/**
 * Estado do componente Scanner
 */
export type EstadoScanner =
  | 'idle'
  | 'capturando'
  | 'processando'
  | 'preview'
  | 'erro';

/**
 * Helpers para criar campos extraídos
 */
export function criarCampo<T>(
  valor: T | null,
  confianca: number = 0,
  origem: 'ocr' | 'inferido' | 'manual' = 'ocr'
): CampoExtraido<T> {
  return { valor, confianca, origem };
}

/**
 * Verifica se um campo tem alta confiança (>= 80%)
 */
export function campoConfiavel<T>(campo: CampoExtraido<T>): boolean {
  return campo.confianca >= 80 && campo.valor !== null;
}

/**
 * Verifica se um campo precisa de revisÍo (< 60%)
 */
export function campoPrecisaRevisao<T>(campo: CampoExtraido<T>): boolean {
  return campo.confianca < 60 || campo.valor === null;
}

/**
 * Retorna cor baseada na confiança (para UI)
 */
export function corConfianca(confianca: number): string {
  if (confianca >= 80) return 'text-green-600';
  if (confianca >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

/**
 * Retorna cor de fundo baseada na confiança (para UI)
 */
export function bgConfianca(confianca: number): string {
  if (confianca >= 80) return 'bg-green-50 border-green-200';
  if (confianca >= 60) return 'bg-yellow-50 border-yellow-200';
  return 'bg-red-50 border-red-200';
}

