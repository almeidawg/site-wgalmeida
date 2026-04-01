// Módulo de Serviços - Tipos TypeScript
// WGeasy - GestÍo de solicitações de serviços

// =====================
// ENUMS E TIPOS BASE
// =====================

export type StatusServico =
  | 'criado'
  | 'enviado'
  | 'aceito'
  | 'em_andamento'
  | 'concluido'
  | 'cancelado';

export type TipoVinculo = 'projeto' | 'obra' | 'contrato' | 'avulso';

export type TipoPrestador = 'fornecedor' | 'colaborador';

export type TipoEndereco = 'obra' | 'fornecedor' | 'cliente' | 'manual';

export type StatusConvidado =
  | 'convidado'
  | 'visualizado'
  | 'aceito'
  | 'recusado'
  | 'expirado';

// =====================
// INTERFACES
// =====================

export interface ServicoCategoria {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  ativo: boolean;
  ordem: number;
}

export interface PrestadorCategoriaVinculo {
  id: string;
  prestador_id: string;
  categoria_id: string;
  principal: boolean;
  observacoes?: string;
}

export interface Prestador {
  id: string;
  nome: string;
  email?: string;
  telefone?: string;
  tipo_pessoa: 'FORNECEDOR' | 'COLABORADOR';
  prestador_tipo: TipoPrestador;
  categoria_id: string;
  categoria_codigo: string;
  categoria_nome: string;
  principal: boolean;
  ativo: boolean;
}

export interface EnderecoServico {
  tipo?: TipoEndereco;
  pessoa_id?: string;
  endereco_completo?: string;
  cep?: string;
  logradouro?: string;
  numero?: string;
  complemento?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  referencia?: string;
}

export interface SolicitacaoServico {
  id: string;
  numero: string;

  // Vínculo
  tipo_vinculo: TipoVinculo;
  projeto_id?: string;
  cliente_id?: string;

  // Categoria
  categoria_id: string;
  categoria?: ServicoCategoria;

  // DescriçÍo
  titulo: string;
  descricao?: string;

  // Endereços (flatten)
  coletar_tipo?: TipoEndereco;
  coletar_pessoa_id?: string;
  coletar_endereco_completo?: string;
  coletar_cep?: string;
  coletar_logradouro?: string;
  coletar_numero?: string;
  coletar_complemento?: string;
  coletar_bairro?: string;
  coletar_cidade?: string;
  coletar_estado?: string;
  coletar_referencia?: string;

  entregar_tipo?: TipoEndereco;
  entregar_pessoa_id?: string;
  entregar_endereco_completo?: string;
  entregar_cep?: string;
  entregar_logradouro?: string;
  entregar_numero?: string;
  entregar_complemento?: string;
  entregar_bairro?: string;
  entregar_cidade?: string;
  entregar_estado?: string;
  entregar_referencia?: string;

  // Valor
  valor_servico: number;
  forma_pagamento?: string;
  observacoes_pagamento?: string;

  // Prestador
  prestador_id?: string;
  prestador_tipo?: TipoPrestador;
  prestador?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };

  // Datas
  data_solicitacao: string;
  data_necessidade?: string;
  data_aceite?: string;
  data_inicio_execucao?: string;
  data_conclusao?: string;

  // Status
  status: StatusServico;

  // Link
  token_aceite: string;
  link_expira_em?: string;

  // IntegraçÍo
  lancamento_id?: string;
  solicitacao_pagamento_id?: string;

  // Cancelamento
  motivo_cancelamento?: string;

  // Auditoria
  criado_por?: string;
  criado_em: string;
  atualizado_em?: string;

  // Joins
  projeto?: {
    id: string;
    numero: string;
    cliente_id?: string;
    dados_cliente_json?: {
      nome?: string;
    };
    dados_imovel_json?: {
      endereco_completo?: string;
      logradouro?: string;
      numero?: string;
      bairro?: string;
      cidade?: string;
      estado?: string;
      cep?: string;
    };
  };
  cliente?: {
    id: string;
    nome: string;
    telefone?: string;
  };
  convidados?: PrestadorConvidado[];
}

export interface PrestadorConvidado {
  id: string;
  solicitacao_id: string;
  prestador_id: string;
  prestador_tipo: TipoPrestador;
  status: StatusConvidado;
  link_enviado_em?: string;
  visualizado_em?: string;
  respondido_em?: string;
  motivo_recusa?: string;
  token: string;
  criado_em: string;
  prestador?: {
    id: string;
    nome: string;
    telefone?: string;
    email?: string;
  };
}

export interface ServicoHistorico {
  id: string;
  solicitacao_id: string;
  status_anterior?: StatusServico;
  status_novo: StatusServico;
  observacao?: string;
  criado_por?: string;
  criado_em: string;
}

export interface ServicoAnexo {
  id: string;
  solicitacao_id: string;
  tipo?: string;
  nome: string;
  arquivo_url: string;
  tamanho_bytes?: number;
  criado_em: string;
}

// =====================
// FORMS
// =====================

export interface NovoServicoForm {
  tipo_vinculo: TipoVinculo;
  projeto_id?: string;
  cliente_id?: string;
  categoria_id: string;
  titulo: string;
  descricao?: string;

  // Coletar
  coletar_tipo?: TipoEndereco;
  coletar_pessoa_id?: string;
  coletar_endereco_completo?: string;
  coletar_cep?: string;
  coletar_logradouro?: string;
  coletar_numero?: string;
  coletar_complemento?: string;
  coletar_bairro?: string;
  coletar_cidade?: string;
  coletar_estado?: string;
  coletar_referencia?: string;

  // Entregar
  entregar_tipo?: TipoEndereco;
  entregar_pessoa_id?: string;
  entregar_endereco_completo?: string;
  entregar_cep?: string;
  entregar_logradouro?: string;
  entregar_numero?: string;
  entregar_complemento?: string;
  entregar_bairro?: string;
  entregar_cidade?: string;
  entregar_estado?: string;
  entregar_referencia?: string;

  valor_servico: number;
  forma_pagamento?: string;
  data_necessidade?: string;
  observacoes_pagamento?: string;
}

export interface FiltrosServico {
  status?: StatusServico;
  categoria_id?: string;
  tipo_vinculo?: TipoVinculo;
  projeto_id?: string;
  prestador_id?: string;
  prestador_relacionado_id?: string;
  data_inicio?: string;
  data_fim?: string;
  busca?: string;
}

export interface DashboardServicos {
  total_criados: number;
  total_enviados: number;
  total_aceitos: number;
  total_em_andamento: number;
  total_concluidos: number;
  total_cancelados: number;
  valor_total_concluido: number;
  valor_em_execucao: number;
  total_geral: number;
}

// =====================
// CONSTANTES
// =====================

export const STATUS_SERVICO_CONFIG: Record<StatusServico, {
  label: string;
  cor: string;
  corBg: string;
  icone: string;
  proximo?: StatusServico[];
}> = {
  criado: {
    label: 'Criado',
    cor: '#6B7280',
    corBg: '#F3F4F6',
    icone: 'FileText',
    proximo: ['enviado', 'cancelado']
  },
  enviado: {
    label: 'Enviado',
    cor: '#3B82F6',
    corBg: '#DBEAFE',
    icone: 'Send',
    proximo: ['aceito', 'cancelado']
  },
  aceito: {
    label: 'Aceito',
    cor: '#10B981',
    corBg: '#D1FAE5',
    icone: 'CheckCircle',
    proximo: ['em_andamento', 'cancelado']
  },
  em_andamento: {
    label: 'Em Andamento',
    cor: '#F59E0B',
    corBg: '#FEF3C7',
    icone: 'Clock',
    proximo: ['concluido', 'cancelado']
  },
  concluido: {
    label: 'Concluído',
    cor: '#22C55E',
    corBg: '#DCFCE7',
    icone: 'CheckCircle2',
    proximo: []
  },
  cancelado: {
    label: 'Cancelado',
    cor: '#EF4444',
    corBg: '#FEE2E2',
    icone: 'XCircle',
    proximo: []
  },
};

export const TIPO_VINCULO_OPTIONS = [
  { value: 'avulso', label: 'Avulso (Independente)' },
  { value: 'projeto', label: 'Vinculado a Projeto/Obra' },
  { value: 'contrato', label: 'Vinculado a Contrato' },
];

export const TIPO_ENDERECO_OPTIONS = [
  { value: 'obra', label: 'Endereço da Obra' },
  { value: 'fornecedor', label: 'Endereço do Fornecedor' },
  { value: 'cliente', label: 'Endereço do Cliente' },
  { value: 'manual', label: 'Informar Manualmente' },
];

export const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência Bancária' },
  { value: 'boleto', label: 'Boleto' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cartao', label: 'CartÍo' },
];

