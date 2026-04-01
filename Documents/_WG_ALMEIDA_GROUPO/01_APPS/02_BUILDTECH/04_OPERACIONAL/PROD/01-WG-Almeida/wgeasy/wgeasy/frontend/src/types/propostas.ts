// ============================================================
// TIPOS: Propostas Comerciais
// ============================================================

export type PropostaStatus = 'rascunho' | 'enviada' | 'aprovada' | 'rejeitada' | 'cancelada' | 'em_revisao';
export type FormaPagamento = 'a_vista' | 'parcelado' | 'etapas';
export type TipoItem = 'material' | 'mao_obra' | 'ambos' | 'servico' | 'produto';
export type Nucleo = 'arquitetura' | 'engenharia' | 'marcenaria';
export type NucleoItem = 'arquitetura' | 'engenharia' | 'marcenaria' | 'produtos';

export interface Proposta {
  id: string;
  cliente_id: string;
  oportunidade_id?: string | null;
  analise_projeto_id?: string | null;
  nucleo?: Nucleo | null;
  numero?: string | null;
  titulo: string;
  descricao?: string | null;
  forma_pagamento?: FormaPagamento | null;
  percentual_entrada?: number;
  numero_parcelas?: number;
  validade_dias?: number;
  prazo_execucao_dias?: number;
  valor_materiais: number;
  valor_mao_obra: number;
  valor_total: number;
  exibir_valores: boolean;
  pagamento_cartao?: boolean;
  status: PropostaStatus;
  criado_em: string;
  updated_at?: string;
  created_by?: string | null;
  // Compartilhamento e tracking
  token_compartilhamento?: string | null;
  token_expira_em?: string | null;
  observacoes_internas?: string | null;
  observacoes_cliente?: string | null;
  enviada_em?: string | null;
  enviada_para?: string | null;
  enviada_via?: string | null;
  visualizada_em?: string | null;
  // Rastreabilidade de escopo
  riscos_analise?: any[] | null;
  metadados_escopo?: Record<string, any> | null;
}

export interface PropostaItem {
  id: string;
  proposta_id: string;
  pricelist_item_id?: string | null;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  tipo: TipoItem;
  unidade?: string | null;
  quantidade: number;
  valor_unitario: number;
  valor_subtotal: number;
  descricao_customizada?: string | null;
  ambiente_id?: string | null;
  nucleo?: NucleoItem | null;
  contratado_pelo_cliente?: boolean | null;
  prioridade?: 'critica' | 'alta' | 'media' | 'baixa' | null;
  status_item?: 'a_definir' | 'aprovado' | 'excluido' | 'em_andamento' | 'concluido' | null;
  ordem: number;
  criado_em: string;
}

export interface PropostaCompleta extends Proposta {
  cliente_nome?: string;
  cliente_avatar_url?: string | null;
  itens: PropostaItem[];
}

export interface DadosBancariosPDF {
  nucleo: string;
  nome?: string | null;
  banco: string;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  pix_chave?: string | null;
  pix_tipo?: string | null;
}

export interface PropostaVisualizacao extends PropostaCompleta {
  cliente_email?: string | null;
  cliente_telefone?: string | null;
  cliente_foto_url?: string | null;
  cliente_endereco?: string | null;
  dados_bancarios?: DadosBancariosPDF[];
}

export interface PropostaFormData {
  cliente_id: string;
  oportunidade_id?: string | null;
  titulo: string;
  descricao?: string | null;
  forma_pagamento?: FormaPagamento;
  percentual_entrada?: number;
  numero_parcelas?: number;
  validade_dias?: number;
  prazo_execucao_dias?: number;
  exibir_valores?: boolean;
  pagamento_cartao?: boolean; // Se true, aplica taxa de cartÍo ao valor total
  valor_total?: number; // Valor total já com taxa de cartÍo aplicada (se houver)
  valor_materiais?: number; // Valor total dos materiais
  valor_mao_obra?: number; // Valor total da mÍo de obra
  metodo_entrada?: string; // pix, boleto, cartao_credito, transferencia
  metodo_saldo?: string; // pix, boleto, cartao_credito, transferencia
  parcelas_cartao_saldo?: number; // Parcelas no cartÍo para o saldo (1-10)
  taxa_cartao_percentual?: number; // Taxa de cartÍo aplicada (%)
  valor_taxa_cartao?: number; // Valor da taxa em reais
}

export interface PropostaItemInput {
  pricelist_item_id?: string | null;
  codigo?: string | null;
  nome: string;
  descricao?: string | null;
  categoria?: string | null;
  tipo: TipoItem;
  unidade?: string | null;
  quantidade: number;
  valor_unitario: number;
  descricao_customizada?: string | null;
  ambiente_id?: string | null;
  ordem?: number;
  nucleo?: string | null;
  contratado_pelo_cliente?: boolean;
  prioridade?: string | null;
  status_item?: string | null;
}

// Funções helper
export function getStatusPropostaLabel(status: PropostaStatus): string {
  const labels: Record<PropostaStatus, string> = {
    rascunho: 'Rascunho',
    enviada: 'Enviada',
    aprovada: 'Aprovada',
    rejeitada: 'Rejeitada',
    cancelada: 'Cancelada',
    em_revisao: 'Em RevisÍo',
  };
  return labels[status];
}

export function getStatusPropostaColor(status: PropostaStatus): string {
  const colors: Record<PropostaStatus, string> = {
    rascunho: '#6B7280',
    enviada: '#3B82F6',
    aprovada: '#10B981',
    rejeitada: '#EF4444',
    cancelada: '#9CA3AF',
    em_revisao: '#F59E0B',
  };
  return colors[status];
}

export function getFormaPagamentoLabel(forma: FormaPagamento): string {
  const labels: Record<FormaPagamento, string> = {
    a_vista: 'À Vista',
    parcelado: 'Parcelado',
    etapas: 'Sinal + Etapas',
  };
  return labels[forma];
}

export function getNucleoLabel(nucleo: Nucleo): string {
  const labels: Record<Nucleo, string> = {
    arquitetura: 'Arquitetura',
    engenharia: 'Engenharia',
    marcenaria: 'Marcenaria',
  };
  return labels[nucleo];
}

export function getNucleoColor(nucleo: Nucleo): string {
  const colors: Record<Nucleo, string> = {
    arquitetura: '#5E9B94', // Verde mineral - design racional, equilíbrio e intençÍo
    engenharia: '#2B4580',  // Azul técnico - estrutura, método e precisÍo
    marcenaria: '#8B5E3C',  // Marrom carvalho - materialidade, artesania e luxo discreto
  };
  return colors[nucleo];
}

// Cor para produtos (itens sem núcleo específico)
export function getCorProdutos(): string {
  return '#F25C26'; // Laranja WG - energia, inovaçÍo e açÍo
}

