// ============================================================
// TIPOS: Análise de Projeto (Pré-Proposta)
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

// ============================================================
// Enums e Types
// ============================================================

export type StatusAnaliseProjeto = 'rascunho' | 'analisando' | 'analisado' | 'aprovado' | 'vinculado';
export type TipoProjeto = 'reforma' | 'obra_nova' | 'ampliacao';
export type TipoImovel = 'apartamento' | 'casa' | 'comercial' | 'industrial';
export type PadraoConstrutivo = 'alto' | 'medio' | 'economico';
export type OrigemDado = 'ia' | 'manual';
export type TipoElemento = 'porta' | 'janela' | 'vao' | 'tomada' | 'interruptor' | 'luminaria' | 'circuito';
// Tipos expandidos para cobrir todos os serviços de obra
export type TipoAcabamento = 'piso' | 'parede' | 'teto' | 'pintura' | 'revestimento' | 'rodape' | 'forro' | 'papel_parede' | 'marmore' | 'vidro' | 'box' | 'espelho';

// Categorias de serviços de obra (escopo completo)
export type CategoriaServico =
  | 'gerais'           // ProteçÍo, limpeza, descarte, administraçÍo
  | 'demolicao'        // DemoliçÍo de pisos, paredes, forros, remoções
  | 'construcao'       // Contrapiso, alvenaria, drywall, impermeabilizaçÍo
  | 'instalacoes_eletricas'   // Pontos, circuitos, quadros, iluminaçÍo
  | 'instalacoes_hidraulicas' // Água, esgoto, gás, tubulações
  | 'revestimentos'    // Pisos, paredes, azulejos, porcelanatos
  | 'pintura'          // Látex, acrílica, PVA, verniz
  | 'esquadrias'       // Portas, janelas, box, envidraçamento
  | 'forros'           // Gesso, PVC, madeira
  | 'marcenaria'       // Móveis planejados, armários, closets
  | 'louças_metais'    // Louças sanitárias, metais, acessórios
  | 'pedras'           // Granitos, mármores, quartzos
  | 'vidracaria'       // Box, espelhos, divisórias
  | 'serralheria'      // Grades, portões, corrimÍos
  | 'climatizacao'     // Ar-condicionado, exaustores
  | 'automacao'        // Fechaduras digitais, automaçÍo residencial
  | 'paisagismo'       // Jardins, irrigaçÍo
  | 'outros';

// Tipos específicos de serviços
export type TipoServico =
  // GERAIS
  | 'protecao_piso' | 'protecao_portas' | 'protecao_esquadrias' | 'protecao_elevadores'
  | 'limpeza_obra' | 'retirada_entulho' | 'descarte_entulho'
  | 'administracao_obra' | 'mobilizacao' | 'desmobilizacao'
  // DEMOLIÇÍO
  | 'demolicao_piso' | 'demolicao_parede' | 'demolicao_forro' | 'demolicao_teto'
  | 'demolicao_revestimento' | 'demolicao_contrapiso'
  | 'remocao_loucas' | 'remocao_metais' | 'remocao_bancadas' | 'remocao_moveis'
  | 'remocao_portas' | 'remocao_janelas' | 'remocao_box'
  | 'remanejamento_porta' | 'abertura_vao' | 'recorte_parede' | 'recorte_nicho'
  | 'fechamento_vao'
  // CONSTRUÇÍO
  | 'execucao_contrapiso' | 'regularizacao_contrapiso' | 'nivelamento_piso'
  | 'execucao_alvenaria' | 'execucao_drywall' | 'execucao_divisoria'
  | 'impermeabilizacao_piso' | 'impermeabilizacao_parede' | 'impermeabilizacao_box'
  | 'impermeabilizacao_terraço' | 'impermeabilizacao_sacada'
  | 'execucao_reboco' | 'execucao_gesso' | 'execucao_massa_corrida'
  | 'execucao_nicho' | 'execucao_sanca' | 'execucao_tabica'
  // INSTALAÇÕES ELÉTRICAS
  | 'ponto_tomada_110v' | 'ponto_tomada_220v' | 'ponto_tomada_especial'
  | 'ponto_interruptor' | 'ponto_iluminacao' | 'ponto_led'
  | 'circuito_eletrico' | 'quadro_distribuicao' | 'disjuntor'
  | 'passagem_infraestrutura' | 'tubulacao_seca_hdmi' | 'tubulacao_seca_dados'
  | 'automacao_iluminacao' | 'instalacao_ar_condicionado'
  // INSTALAÇÕES HIDRÁULICAS
  | 'ponto_agua_fria' | 'ponto_agua_quente' | 'ponto_esgoto' | 'ponto_gas'
  | 'adequacao_hidraulica' | 'adequacao_gas'
  | 'instalacao_aquecedor' | 'instalacao_pressurizador'
  | 'ralo_linear' | 'ralo_quadrado' | 'ralo_sifonado'
  | 'caixa_gordura' | 'caixa_passagem'
  // REVESTIMENTOS
  | 'assentamento_porcelanato' | 'assentamento_ceramica' | 'assentamento_piso_vinilico'
  | 'assentamento_piso_laminado' | 'assentamento_piso_madeira'
  | 'revestimento_parede' | 'revestimento_pastilha'
  | 'rejunte' | 'baguete_pedra' | 'soleira' | 'peitoril'
  // PINTURA
  | 'pintura_parede' | 'pintura_teto' | 'pintura_porta' | 'pintura_esquadria'
  | 'pintura_latex' | 'pintura_acrilica' | 'pintura_epoxi' | 'pintura_verniz'
  | 'aplicacao_textura' | 'aplicacao_grafiato' | 'aplicacao_cimento_queimado'
  // FORROS
  | 'forro_gesso' | 'forro_gesso_acartonado' | 'forro_pvc' | 'forro_madeira'
  | 'recomposicao_forro' | 'recorte_forro'
  // ESQUADRIAS
  | 'instalacao_porta' | 'instalacao_janela' | 'instalacao_box_vidro'
  | 'instalacao_box_acrilico' | 'envidracamento_sacada' | 'envidracamento_varanda'
  | 'instalacao_fechadura' | 'instalacao_macaneta' | 'instalacao_dobradica'
  | 'instalacao_trilho' | 'instalacao_roldana'
  // LOUÇAS E METAIS
  | 'instalacao_vaso_sanitario' | 'instalacao_cuba' | 'instalacao_pia'
  | 'instalacao_tanque' | 'instalacao_torneira' | 'instalacao_misturador'
  | 'instalacao_chuveiro' | 'instalacao_ducha_higienica'
  | 'instalacao_acessorio_banheiro' | 'instalacao_saboneteira' | 'instalacao_papeleira'
  // PEDRAS
  | 'instalacao_bancada_granito' | 'instalacao_bancada_marmore' | 'instalacao_bancada_quartzo'
  | 'instalacao_rodape_marmore' | 'instalacao_soleira_granito'
  // VIDRAÇARIA
  | 'instalacao_espelho' | 'instalacao_prateleira_vidro' | 'instalacao_divisoria_vidro'
  // MARCENARIA
  | 'instalacao_armario' | 'instalacao_closet' | 'instalacao_cozinha_planejada'
  | 'instalacao_estante' | 'instalacao_painel_tv'
  // OUTROS
  | 'individualizacao_caixa' | 'instalacao_acabamentos_eletricos'
  | 'servico_personalizado';
export type TipoAmbiente = 'quarto' | 'suite' | 'sala' | 'cozinha' | 'banheiro' | 'lavabo' | 'area_servico' | 'lavanderia' | 'varanda' | 'sacada' | 'escritorio' | 'closet' | 'corredor' | 'hall' | 'deposito' | 'garagem' | 'area_externa' | 'outro';

// Prioridade e Status de itens de escopo
export type PrioridadeEscopo = 'critica' | 'alta' | 'media' | 'baixa';
export type StatusItemEscopo = 'a_definir' | 'aprovado' | 'excluido' | 'em_andamento' | 'concluido';

// Severidade de riscos
export type SeveridadeRisco = 'alto' | 'medio' | 'baixo';

// ============================================================
// Interface: Análise de Projeto Principal
// ============================================================

export interface AnaliseProjeto {
  id: string;

  // Relacionamentos
  cliente_id: string;
  oportunidade_id?: string | null;
  proposta_id?: string | null;

  // IdentificaçÍo
  numero?: string | null;
  titulo: string;
  descricao?: string | null;

  // Dados do Projeto
  tipo_projeto: TipoProjeto;
  tipo_imovel?: TipoImovel | null;
  area_total?: number | null;
  pe_direito_padrao: number;
  endereco_obra?: string | null;
  padrao_construtivo?: PadraoConstrutivo | null;

  // Arquivos
  plantas_urls: string[];
  memorial_descritivo?: string | null;
  contrato_texto?: string | null;

  // Escopo Técnico (extraído do documento de análise)
  estilo_conceito?: string | null;          // ex: "Industrial / Contemporâneo / Moderno"
  intervencao_principal?: string | null;    // DescriçÍo da intervençÍo principal e viabilidade
  proximos_passos?: string[] | null;        // Lista de próximas ações
  perfil_cliente?: string | null;           // Perfil/preferências do cliente (pet friendly, etc.)

  // Análise IA
  analise_ia?: AnaliseIAResultado | null;
  prompt_utilizado?: string | null;
  provedor_ia?: 'openai' | 'anthropic' | null;
  modelo_ia?: string | null;
  confiabilidade_analise: number;
  tempo_processamento_ms?: number | null;

  // Totais Calculados
  total_ambientes: number;
  total_area_piso: number;
  total_area_paredes: number;
  total_perimetro: number;

  // Status
  status: StatusAnaliseProjeto;

  // Auditoria
  criado_por?: string | null;
  atualizado_por?: string | null;
  criado_em: string;
  atualizado_em: string;
}

// ============================================================
// Interface: Ambiente Extraído
// ============================================================

export interface AnaliseProjetoAmbiente {
  id: string;
  analise_id: string;

  // IdentificaçÍo
  nome: string;
  tipo?: TipoAmbiente | null;
  codigo?: string | null;

  // Dimensões Básicas
  largura?: number | null;
  comprimento?: number | null;
  pe_direito: number;

  // Áreas Calculadas
  area_piso?: number | null;
  area_teto?: number | null;
  perimetro?: number | null;
  area_paredes_bruta?: number | null;
  area_paredes_liquida?: number | null;

  // VÍos
  portas: VaoPorta[];
  janelas: VaoJanela[];
  vaos: VaoGenerico[];
  envidracamentos: VaoEnvidracamento[];
  area_vaos_total: number;

  // Instalações Elétricas
  tomadas_110v: number;
  tomadas_220v: number;
  tomadas_especiais: TomadaEspecial[];
  pontos_iluminacao: number;
  interruptores_simples: number;
  interruptores_paralelo: number;
  interruptores_intermediario: number;
  circuitos: Circuito[];

  // Instalações Hidráulicas
  pontos_agua_fria: number;
  pontos_agua_quente: number;
  pontos_esgoto: number;
  pontos_gas: number;
  tubulacao_seca: TubulacaoSeca[];

  // Acabamentos Previstos
  piso_tipo?: string | null;
  piso_area?: number | null;
  parede_tipo?: string | null;
  parede_area?: number | null;
  teto_tipo?: string | null;
  teto_area?: number | null;
  rodape_tipo?: string | null;
  rodape_ml?: number | null;

  // Metadados
  ordem: number;
  observacoes?: string | null;
  alertas: string[];
  origem: OrigemDado;
  editado_manualmente: boolean;

  criado_em: string;
  atualizado_em: string;
}

// ============================================================
// Interfaces Auxiliares
// ============================================================

export interface VaoPorta {
  largura: number;
  altura: number;
  tipo?: string; // comum, correr, pivotante, etc.
  descricao?: string;
}

export interface VaoJanela {
  largura: number;
  altura: number;
  tipo?: string; // maxim-ar, correr, guilhotina, etc.
  descricao?: string;
}

export interface VaoEnvidracamento {
  largura: number;
  altura: number;
  tipo?: string; // sacada, fechamento, pele_vidro, etc.
  descricao?: string;
}

export interface VaoGenerico {
  largura: number;
  altura: number;
  tipo?: string;
  descricao?: string;
}

export interface TomadaEspecial {
  tipo: string; // ar_condicionado, forno, cooktop, etc.
  voltagem: number;
  descricao?: string;
}

export interface Circuito {
  numero: number;
  tipo: string;
  carga?: number;
  descricao?: string;
}

export interface TubulacaoSeca {
  tipo: string;
  diametro: number;
  metragem?: number;
}

// ============================================================
// Interface: Resultado da Análise IA (JSON armazenado)
// ============================================================

export interface AnaliseIAResultado {
  ambientes: AmbienteIA[];
  elementos: ElementoIA[];
  acabamentos: AcabamentoIA[];
  servicos: ServicoIA[];
  riscos: RiscoAnalise[];          // Pontos de atençÍo com severidade
  observacoes: string[];
  metadados?: {
    tipo_projeto?: string;
    escala?: string;
    data_projeto?: string;
    estilo_conceito?: string;       // Industrial / Contemporâneo / etc.
    intervencao_principal?: string;  // DescriçÍo da intervençÍo principal
    proximos_passos?: string[];     // Ações recomendadas
    perfil_cliente?: string;        // Preferências do cliente
  };
}

// Interface para serviços extraídos do escopo
export interface ServicoIA {
  id?: string;
  categoria: CategoriaServico;
  tipo: TipoServico | string;
  descricao: string;
  ambiente?: string;           // Ambiente específico ou "geral"
  ambientes?: string[];        // Lista de ambientes afetados
  unidade: 'm2' | 'ml' | 'un' | 'vb' | 'pt' | 'cx' | 'kg' | 'pç';
  quantidade?: number;
  area?: number;               // Área em m² quando aplicável
  metragem_linear?: number;    // Metros lineares quando aplicável
  especificacoes?: {
    material?: string;
    dimensoes?: string;
    espessura?: number;
    modelo?: string;
    marca?: string;
  };
  vinculo_pricelist?: {
    termo_busca: string;       // Termo para buscar no pricelist
    palavras_chave: string[];  // Keywords alternativas
    categoria_sugerida?: string;
  };
  prioridade?: PrioridadeEscopo;  // Criticidade do item (critica/alta/media/baixa)
  status_item?: StatusItemEscopo; // Status do item no escopo (a_definir/aprovado/excluido/...)
  observacoes?: string;
  ordem: number;               // Ordem de execuçÍo na obra
}

// Interface para riscos/pontos de atençÍo estruturados
export interface RiscoAnalise {
  tema: string;                    // ex: "Parede entre Dorm. 2 e Suíte"
  severidade: SeveridadeRisco;     // alto | medio | baixo
  descricao: string;               // DescriçÍo do risco e impacto
  acao_necessaria?: string;        // AçÍo para mitigar o risco
}

export interface AmbienteIA {
  nome: string;
  largura?: number;
  comprimento?: number;
  area?: number;
  pe_direito?: number;
  tipo?: string;
  descricao?: string;
}

export interface ElementoIA {
  tipo: TipoElemento;
  ambiente?: string;
  quantidade: number;
  descricao?: string;
  medidas?: {
    largura?: number;
    altura?: number;
    profundidade?: number;
  };
}

export interface AcabamentoIA {
  tipo: TipoAcabamento;
  ambiente?: string;
  material?: string;
  area?: number;
  metragem_linear?: number;
  quantidade?: number;
  descricao?: string;
}

// ============================================================
// Interface: Análise Completa (com joins)
// ============================================================

export interface AnaliseProjetoCompleta extends AnaliseProjeto {
  cliente_nome?: string;
  cliente_email?: string;
  cliente_telefone?: string;
  oportunidade_titulo?: string;
  proposta_titulo?: string;
  proposta_numero?: string;
  ambientes?: AnaliseProjetoAmbiente[];
  acabamentos?: AcabamentoIA[];
}

// ============================================================
// Interfaces: Formulários
// ============================================================

export interface AnaliseProjetoFormData {
  cliente_id: string;
  oportunidade_id?: string | null;
  titulo: string;
  descricao?: string | null;
  tipo_projeto: TipoProjeto;
  tipo_imovel?: TipoImovel | null;
  area_total?: number | null;
  pe_direito_padrao?: number;
  endereco_obra?: string | null;
  padrao_construtivo?: PadraoConstrutivo | null;
  plantas_urls?: string[];
  memorial_descritivo?: string | null;
  contrato_texto?: string | null;
  estilo_conceito?: string | null;
  intervencao_principal?: string | null;
  proximos_passos?: string[] | null;
  perfil_cliente?: string | null;
}

export interface AnaliseAmbienteFormData {
  analise_id: string;
  nome: string;
  tipo?: TipoAmbiente | null;
  codigo?: string | null;
  largura?: number | null;
  comprimento?: number | null;
  pe_direito?: number;
  area_piso?: number | null;
  observacoes?: string | null;
  ordem?: number;
}

// ============================================================
// Constantes e Helpers
// ============================================================

export const STATUS_LABELS: Record<StatusAnaliseProjeto, string> = {
  rascunho: 'Rascunho',
  analisando: 'Analisando...',
  analisado: 'Analisado',
  aprovado: 'Aprovado',
  vinculado: 'Vinculado à Proposta',
};

export const STATUS_COLORS: Record<StatusAnaliseProjeto, string> = {
  rascunho: '#6B7280',
  analisando: '#F59E0B',
  analisado: '#3B82F6',
  aprovado: '#10B981',
  vinculado: '#8B5CF6',
};

export const TIPO_PROJETO_LABELS: Record<TipoProjeto, string> = {
  reforma: 'Reforma',
  obra_nova: 'Obra Nova',
  ampliacao: 'AmpliaçÍo',
};

export const TIPO_IMOVEL_LABELS: Record<TipoImovel, string> = {
  apartamento: 'Apartamento',
  casa: 'Casa',
  comercial: 'Comercial',
  industrial: 'Industrial',
};

export const PADRAO_CONSTRUTIVO_LABELS: Record<PadraoConstrutivo, string> = {
  alto: 'Alto PadrÍo',
  medio: 'Médio PadrÍo',
  economico: 'Econômico',
};

export const PRIORIDADE_ESCOPO_LABELS: Record<PrioridadeEscopo, string> = {
  critica: 'Critica',
  alta: 'Alta',
  media: 'Media',
  baixa: 'Baixa',
};

export const PRIORIDADE_ESCOPO_COLORS: Record<PrioridadeEscopo, string> = {
  critica: '#DC2626',
  alta: '#F59E0B',
  media: '#3B82F6',
  baixa: '#6B7280',
};

export const STATUS_ITEM_ESCOPO_LABELS: Record<StatusItemEscopo, string> = {
  a_definir: 'A Definir',
  aprovado: 'Aprovado',
  excluido: 'Excluido',
  em_andamento: 'Em Andamento',
  concluido: 'Concluido',
};

export const SEVERIDADE_RISCO_LABELS: Record<SeveridadeRisco, string> = {
  alto: 'Alto',
  medio: 'Medio',
  baixo: 'Baixo',
};

export const SEVERIDADE_RISCO_COLORS: Record<SeveridadeRisco, string> = {
  alto: '#DC2626',
  medio: '#F59E0B',
  baixo: '#3B82F6',
};

export const TIPO_AMBIENTE_LABELS: Record<TipoAmbiente, string> = {
  quarto: 'Quarto',
  suite: 'Suíte',
  sala: 'Sala',
  cozinha: 'Cozinha',
  banheiro: 'Banheiro',
  lavabo: 'Lavabo',
  area_servico: 'Área de Serviço',
  lavanderia: 'Lavanderia',
  varanda: 'Varanda',
  sacada: 'Sacada',
  escritorio: 'Escritório',
  closet: 'Closet',
  corredor: 'Corredor',
  hall: 'Hall',
  deposito: 'Depósito',
  garagem: 'Garagem',
  area_externa: 'Área Externa',
  outro: 'Outro',
};

// ============================================================
// Funções Helpers
// ============================================================

export function getStatusLabel(status: StatusAnaliseProjeto): string {
  return STATUS_LABELS[status] || status;
}

export function getStatusColor(status: StatusAnaliseProjeto): string {
  return STATUS_COLORS[status] || '#6B7280';
}

export function getTipoProjetoLabel(tipo: TipoProjeto): string {
  return TIPO_PROJETO_LABELS[tipo] || tipo;
}

export function getTipoImovelLabel(tipo: TipoImovel): string {
  return TIPO_IMOVEL_LABELS[tipo] || tipo;
}

export function getPadraoConstrutLabel(padrao: PadraoConstrutivo): string {
  return PADRAO_CONSTRUTIVO_LABELS[padrao] || padrao;
}

export function getTipoAmbienteLabel(tipo: TipoAmbiente): string {
  return TIPO_AMBIENTE_LABELS[tipo] || tipo;
}

/**
 * Calcular área de paredes considerando perímetro, pé-direito e vÍos
 */
export function calcularAreaParedes(
  perimetro: number,
  peDireito: number,
  areaVaos: number = 0
): number {
  const areaBruta = perimetro * peDireito;
  return Math.max(0, areaBruta - areaVaos);
}

/**
 * Calcular perímetro a partir de largura e comprimento
 */
export function calcularPerimetro(largura: number, comprimento: number): number {
  return 2 * (largura + comprimento);
}

/**
 * Calcular área do piso
 */
export function calcularAreaPiso(largura: number, comprimento: number): number {
  return largura * comprimento;
}

/**
 * Calcular área de vÍos (portas + janelas + vÍos genéricos + envidraçamentos)
 */
export function calcularAreaVaos(
  portas: VaoPorta[],
  janelas: VaoJanela[],
  vaos?: VaoGenerico[],
  envidracamentos?: VaoEnvidracamento[]
): number {
  const areaPortas = portas.reduce((acc, p) => acc + (p.largura * p.altura), 0);
  const areaJanelas = janelas.reduce((acc, j) => acc + (j.largura * j.altura), 0);
  const areaVaos = (vaos || []).reduce((acc, v) => acc + (v.largura * v.altura), 0);
  const areaEnvid = (envidracamentos || []).reduce((acc, e) => acc + (e.largura * e.altura), 0);
  return areaPortas + areaJanelas + areaVaos + areaEnvid;
}

/**
 * Inferir tipo de ambiente pelo nome
 */
export function inferirTipoAmbiente(nome: string): TipoAmbiente {
  const nomeLower = nome.toLowerCase();

  if (nomeLower.includes('suíte') || nomeLower.includes('suite')) return 'suite';
  if (nomeLower.includes('quarto')) return 'quarto';
  if (nomeLower.includes('sala')) return 'sala';
  if (nomeLower.includes('cozinha')) return 'cozinha';
  if (nomeLower.includes('banheiro') || nomeLower.includes('wc')) return 'banheiro';
  if (nomeLower.includes('lavabo')) return 'lavabo';
  if (nomeLower.includes('área de serviço') || nomeLower.includes('area de servico')) return 'area_servico';
  if (nomeLower.includes('lavanderia')) return 'lavanderia';
  if (nomeLower.includes('varanda')) return 'varanda';
  if (nomeLower.includes('sacada')) return 'sacada';
  if (nomeLower.includes('escritório') || nomeLower.includes('escritorio') || nomeLower.includes('home office')) return 'escritorio';
  if (nomeLower.includes('closet')) return 'closet';
  if (nomeLower.includes('corredor') || nomeLower.includes('circulaçÍo') || nomeLower.includes('circulacao')) return 'corredor';
  if (nomeLower.includes('hall')) return 'hall';
  if (nomeLower.includes('depósito') || nomeLower.includes('deposito')) return 'deposito';
  if (nomeLower.includes('garagem')) return 'garagem';

  return 'outro';
}

/**
 * Formatar área com unidade
 */
export function formatarArea(area: number | null | undefined): string {
  if (area == null) return '-';
  return `${area.toFixed(2)} m²`;
}

/**
 * Formatar metragem linear
 */
export function formatarMetragemLinear(ml: number | null | undefined): string {
  if (ml == null) return '-';
  return `${ml.toFixed(2)} m`;
}

/**
 * Calcular totais de uma análise
 */
export function calcularTotaisAnalise(ambientes: AnaliseProjetoAmbiente[]): {
  total_ambientes: number;
  total_area_piso: number;
  total_area_paredes: number;
  total_perimetro: number;
} {
  return {
    total_ambientes: ambientes.length,
    total_area_piso: ambientes.reduce((acc, a) => acc + (a.area_piso || 0), 0),
    total_area_paredes: ambientes.reduce((acc, a) => acc + (a.area_paredes_liquida || 0), 0),
    total_perimetro: ambientes.reduce((acc, a) => acc + (a.perimetro || 0), 0),
  };
}

