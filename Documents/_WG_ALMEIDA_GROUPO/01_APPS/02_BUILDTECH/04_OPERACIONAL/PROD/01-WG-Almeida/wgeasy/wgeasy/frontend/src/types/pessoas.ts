// Tipos padronizados para o sistema WG EASY 2026
// UPPERCASE seguindo convençÍo de enums TypeScript

export type PessoaTipo =
  | "CLIENTE"
  | "COLABORADOR"
  | "FORNECEDOR"
  | "ESPECIFICADOR"
  | "PRESTADOR"
  | "EMPRESA_GRUPO";  // Empresas do grupo WG (para centro de custo e lançamentos virtuais)

// Status da pessoa (para filtrar concluídos das buscas)
export type PessoaStatus = "ativo" | "concluido" | "inativo" | "suspenso";

export interface Pessoa {
  id: string;
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  rg?: string | null;
  nacionalidade?: string | null;
  estado_civil?: string | null;
  profissao?: string | null;
  cargo?: string | null;
  empresa?: string | null;
  categoria?: string | null;
  unidade?: string | null;
  tipo: PessoaTipo;

  // Endereço completo
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;

  // Endereço da obra (opcional, usado para clientes)
  obra_endereco_diferente?: boolean | null;
  obra_cep?: string | null;
  obra_logradouro?: string | null;
  obra_numero?: string | null;
  obra_complemento?: string | null;
  obra_bairro?: string | null;
  obra_cidade?: string | null;
  obra_estado?: string | null;

  // Dados bancários (fornecedores e especificadores)
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  pix?: string | null;

  // Comissionamento (especificadores)
  categoria_comissao_id?: string | null;
  is_master?: boolean | null;
  indicado_por_id?: string | null;

  // Informações adicionais
  contato_responsavel?: string | null;
  observacoes?: string | null;
  drive_link?: string | null;
  avatar?: string | null;      // Base64 para novos cadastros
  avatar_url?: string | null;  // URL do Supabase Storage
  foto_url?: string | null;

  // Data de início na WG (para "Com a WG desde...")
  data_inicio_wg?: string | null;

  // Status da pessoa (ativo, concluido, inativo, suspenso)
  status?: PessoaStatus | null;

  ativo: boolean;
  criado_em?: string | null;
  atualizado_em?: string | null;
}

// Tipo para criaçÍo/atualizaçÍo (omite campos gerados automaticamente)
export type PessoaInput = {
  nome: string;
  email: string;
  telefone?: string | null;
  cpf?: string | null;
  cnpj?: string | null;
  rg?: string | null;
  nacionalidade?: string | null;
  estado_civil?: string | null;
  profissao?: string | null;
  cargo?: string | null;
  empresa?: string | null;
  categoria?: string | null;
  unidade?: string | null;
  tipo: PessoaTipo;

  // Endereço completo
  cep?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;

  // Endereço da obra (clientes)
  obra_endereco_diferente?: boolean | null;
  obra_cep?: string | null;
  obra_logradouro?: string | null;
  obra_numero?: string | null;
  obra_complemento?: string | null;
  obra_bairro?: string | null;
  obra_cidade?: string | null;
  obra_estado?: string | null;

  // Dados bancários (fornecedores e especificadores)
  banco?: string | null;
  agencia?: string | null;
  conta?: string | null;
  tipo_conta?: string | null;
  pix?: string | null;

  // Comissionamento (especificadores)
  categoria_comissao_id?: string | null;
  is_master?: boolean | null;
  indicado_por_id?: string | null;

  // Informações adicionais
  contato_responsavel?: string | null;
  observacoes?: string | null;
  drive_link?: string | null;
  avatar?: string | null;      // Base64 para novos cadastros
  avatar_url?: string | null;  // URL do Supabase Storage
  foto_url?: string | null;

  // Data de início na WG (para "Com a WG desde...")
  data_inicio_wg?: string | null;

  // Status da pessoa (ativo, concluido, inativo, suspenso)
  status?: PessoaStatus | null;

  ativo: boolean;
};

// Tipos adicionais para relacionamentos
export interface PessoaDocumento {
  id: string;
  pessoa_id: string;
  nome: string;
  tipo: string;
  url: string;
  arquivo_url?: string; // URL do arquivo
  descricao?: string; // DescriçÍo do documento
  validade?: string | null; // Data de validade
  criado_em: string;
}

export interface PessoaAvaliacao {
  id: string;
  pessoa_id: string;
  avaliador_id: string;
  nota: number;
  comentario?: string;
  criado_em: string;
}

export interface PessoaObra {
  id: string;
  pessoa_id: string;
  obra_nome: string;
  obra_status: string;
  obras?: { nome: string } | null; // Objeto da obra (join do Supabase)
  funcao_na_obra?: string; // FunçÍo da pessoa na obra
  data_inicio?: string | null; // Data de início
  data_fim?: string | null; // Data de término
  criado_em: string;
}

