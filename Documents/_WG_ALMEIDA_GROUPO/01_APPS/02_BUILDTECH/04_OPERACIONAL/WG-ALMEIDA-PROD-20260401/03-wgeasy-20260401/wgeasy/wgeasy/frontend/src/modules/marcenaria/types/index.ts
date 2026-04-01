// ==========================================
// MÓDULO MARCENARIA - TIPOS
// ==========================================

// Status do Contrato
export type ContratoStatus = 'rascunho' | 'ativo' | 'concluido' | 'cancelado';

// Status do Projeto
export type ProjetoStatus =
  | 'importado'
  | 'em_analise'
  | 'revisao'
  | 'aprovacao_pendente'
  | 'aprovado'
  | 'em_producao'
  | 'em_transporte'
  | 'em_montagem'
  | 'concluido'
  | 'assistencia'
  | 'aceite'
  | 'garantia';

// Status do Item
export type ItemStatus = 'pendente' | 'em_producao' | 'entregue';

// Status do Fornecedor
export type FornecedorStatus = 'pendente' | 'enviado' | 'confirmado' | 'em_producao' | 'entregue';

// Tipo do Fornecedor
export type FornecedorTipo = 'principal' | 'acessorios' | 'ferragens' | 'laminas' | 'puxadores' | 'cotacao' | 'outros';

// Status de Envio
export type EnvioStatus = 'pendente' | 'enviado' | 'confirmado' | 'erro';

// Status AprovaçÍo
export type AprovacaoStatus = 'pendente' | 'aprovado' | 'rejeitado' | 'revisao';

// Tipo AprovaçÍo
export type AprovacaoTipo = 'descritivo' | 'projeto_executivo';

// ==========================================
// INTERFACES
// ==========================================

export interface MarcenariaContrato {
  id: string;
  obra_id: string;
  cliente_id: string;
  numero_contrato: string;
  valor_total: number;
  status: ContratoStatus;
  data_ativacao?: string;
  created_at: string;
  updated_at: string;
  obra?: { id: string; nome: string; };
  cliente?: { id: string; nome: string; email?: string; telefone?: string; };
}

export interface MarcenariaProjeto {
  id: string;
  contrato_id: string;
  obra_id: string;
  nome_projeto: string;
  status: ProjetoStatus;
  fornecedor_principal_id?: string;
  data_prevista_entrega?: string;
  data_aprovacao_cliente?: string;
  created_at: string;
  updated_at: string;
  contrato?: MarcenariaContrato;
  fornecedor_principal?: { id: string; nome: string; };
  itens?: MarcenariaItem[];
}

export interface MarcenariaItem {
  id: string;
  projeto_id?: string;
  obra_id: string;
  ambiente: string;
  descricao: string;
  quantidade: number;
  largura?: number;
  altura?: number;
  profundidade?: number;
  acabamento?: string;
  observacoes?: string;
  valor_unitario?: number;
  valor_total?: number;
  status: ItemStatus;
  imagem_url?: string;
  codigo_peca?: string;
  cor?: string;
  modelo?: string;
  tipo_ferragem?: string;
  created_at: string;
}

export interface MarcenariaExecutivo {
  id: string;
  projeto_id: string;
  tipo: 'imagem' | 'pdf' | 'render_3d';
  arquivo_url: string;
  descricao?: string;
  versao: number;
  revisao: number;
  revisao_path?: string;
  aprovado_em?: string;
  aprovado_por?: string;
  rejeitado_em?: string;
  enviado_aprovacao_em?: string;
  created_at: string;
}

export interface RevisaoInfo {
  numero: number;
  codigo: string;
  arquivos: MarcenariaExecutivo[];
  data_criacao: string;
  status: 'rascunho' | 'enviado' | 'aprovado' | 'rejeitado' | 'revisao';
  observacoes?: string;
}

export interface MarcenariaAprovacao {
  id: string;
  projeto_id: string;
  tipo: AprovacaoTipo;
  status: AprovacaoStatus;
  revisao?: number;
  observacoes?: string;
  observacoes_cliente?: string;
  link_aprovacao?: string;
  aprovado_em?: string;
  created_at: string;
  projeto?: any;
}

export interface MarcenariaFornecedor {
  id: string;
  projeto_id: string;
  fornecedor_id: string;
  tipo: FornecedorTipo;
  valor_negociado?: number;
  prazo_entrega?: string;
  status: FornecedorStatus;
  created_at: string;
  fornecedor?: { id: string; nome: string; email?: string; telefone?: string; };
  projeto?: { nome_projeto?: string; contrato?: { cliente?: { nome?: string } } };
}

export interface MarcenariaPedidoFornecedor {
  id: string;
  projeto_id: string;
  fornecedor_id: string;
  numero_pedido: string;
  arquivo_enviado_url?: string;
  metodo_envio: 'email' | 'api' | 'manual';
  status_envio: EnvioStatus;
  enviado_em?: string;
  confirmado_em?: string;
  created_at: string;
  fornecedor?: { id: string; nome?: string; email?: string; telefone?: string; };
  projeto?: { nome_projeto?: string; contrato?: { cliente?: { nome?: string } } };
}

export interface MarcenariaPrazoFornecedor {
  id: string;
  fornecedor_id: string;
  ano: number;
  mes: number;
  dias_uteis_producao: number;
  dias_coleta: number;
  dias_entrega: number;
  observacoes?: string;
  created_at: string;
}

export interface MarcenariaCronograma {
  id: string;
  projeto_id: string;
  data_envio_arquivos?: string;
  data_pagamento_confirmado?: string;
  prazo_dias_uteis?: number;
  data_producao_prevista?: string;
  data_coleta_prevista?: string;
  data_entrega_prevista?: string;
  data_montagem_prevista?: string;
  data_producao_real?: string;
  data_coleta_real?: string;
  data_entrega_real?: string;
  data_montagem_real?: string;
  status: string;
  cronograma_obra_id?: string;
  created_at: string;
}

// ==========================================
// INTERFACES PARA FORMULÁRIOS
// ==========================================

export interface ContratoFormData {
  obra_id: string;
  cliente_id: string;
  numero_contrato: string;
  valor_total: number;
}

export interface XMLImportResult {
  success: boolean;
  itens_importados: number;
  itens_erro: number;
  erros: string[];
  projeto_id?: string;
}

export interface XMLItemParsed {
  ambiente: string;
  descricao: string;
  quantidade: number;
  largura: number;
  altura: number;
  profundidade: number;
  acabamento: string;
  observacoes: string;
  valor_unitario: number;
  valor_total: number;
}

