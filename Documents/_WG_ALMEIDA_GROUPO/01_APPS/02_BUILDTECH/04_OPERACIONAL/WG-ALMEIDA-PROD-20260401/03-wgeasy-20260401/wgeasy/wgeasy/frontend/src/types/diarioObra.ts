/**
 * Tipos para o módulo de Diário de Obra (baseado em obra_registros)
 */

export interface DiarioObra {
  id: string;
  cliente_id: string;
  colaborador_id: string;
  data_registro: string; // ISO date
  titulo: string | null;
  descricao: string | null;
  clima: string | null;
  equipe_presente: number | null;
  percentual_avanco: number | null;
  pendencias: string | null;
  observacoes: string | null;
  etapa_cronograma_id: string | null;
  criado_em: string;
  atualizado_em: string;

  // Relacionamentos (quando carregados com join)
  cliente?: {
    id: string;
    nome: string;
    avatar_url?: string | null;
    foto_url?: string | null;
  };
  colaborador?: {
    id: string;
    nome: string;
    avatar_url: string | null;
  };
  fotos?: DiarioObraFoto[];
}

export interface DiarioObraFoto {
  id: string;
  registro_id: string;
  arquivo_url: string;
  descricao: string | null;
  legenda: string | null;
  ordem: number;
  criado_em: string;
}

export interface DiarioObraInput {
  cliente_id: string;
  colaborador_id: string;
  data_registro?: string; // Se nÍo informado, usa data atual
  titulo?: string;
  descricao?: string;
  clima?: string;
  equipe_presente?: number;
  percentual_avanco?: number;
  pendencias?: string;
  observacoes?: string;
}

export interface DiarioObraFotoInput {
  registro_id: string;
  arquivo_url: string;
  descricao?: string;
  ordem?: number;
}

export interface DiarioObraUpdateInput {
  titulo?: string;
  descricao?: string;
  clima?: string;
  equipe_presente?: number;
  percentual_avanco?: number;
  pendencias?: string;
  observacoes?: string;
}

export interface DiarioObraFotoUpdateInput {
  descricao?: string;
  ordem?: number;
}

// Para listagem agrupada por data
export interface DiarioObraAgrupado {
  data: string;
  registros: DiarioObra[];
  totalFotos: number;
}

// Para filtros de busca
export interface DiarioObraFiltros {
  cliente_id?: string;
  projeto_id?: string;
  colaborador_id?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Para o componente de captura de foto
export interface FotoCapturaPreview {
  id: string; // ID temporário para preview
  file: File;
  previewUrl: string;
  descricao?: string;
  legenda?: string;
  ordem: number;
  uploading: boolean;
  uploaded: boolean;
  error?: string;
}

// OpçÍo de obra para o dropdown (mantido para compatibilidade)
export interface OportunidadeOption {
  id: string;
  nome: string;
  cliente_nome: string;
  drive_folder_id?: string;
}

