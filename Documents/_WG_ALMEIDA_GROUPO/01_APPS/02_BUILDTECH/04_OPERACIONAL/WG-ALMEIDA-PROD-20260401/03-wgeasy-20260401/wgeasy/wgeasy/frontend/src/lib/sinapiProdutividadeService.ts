/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// SERVIÇO DE PRODUTIVIDADE SINAPI - WG EASY
// Dados de produtividade baseados no SINAPI/TCPO para
// cálculo automático de cronogramas
// ============================================================

/**
 * Unidade de medida para produtividade
 */
export type UnidadeProdutividade =
  | 'm²/dia'
  | 'ml/dia'
  | 'm³/dia'
  | 'un/dia'
  | 'pt/dia'  // ponto por dia (elétrica/hidráulica)
  | 'kg/dia'; // para armaduras

/**
 * ComposiçÍo de equipe padrÍo
 */
export interface EquipePadrao {
  pedreiro?: number;
  servente?: number;
  eletricista?: number;
  encanador?: number;
  pintor?: number;
  azulejista?: number;
  gesseiro?: number;
  carpinteiro?: number;
  armador?: number;
  serralheiro?: number;
  vidraceiro?: number;
}

/**
 * Dados de produtividade de um serviço
 */
export interface DadosProdutividade {
  codigo_sinapi?: string;
  servico: string;
  categoria: string;
  subcategoria?: string;
  unidade: string;

  // Produtividade por equipe
  produtividade_minima: number;  // m²/dia, ml/dia, etc
  produtividade_media: number;
  produtividade_maxima: number;
  unidade_produtividade: UnidadeProdutividade;

  // ComposiçÍo de equipe para essa produtividade
  equipe_padrao: EquipePadrao;

  // Fator de ajuste por complexidade
  fator_complexidade_baixa: number;   // Multiplica a produtividade
  fator_complexidade_media: number;
  fator_complexidade_alta: number;

  // Observações
  observacoes?: string;

  // Tempo de cura/secagem (impacta cronograma)
  tempo_cura_horas?: number;
  permite_trabalho_paralelo?: boolean;
}

/**
 * Resultado de cálculo de prazo
 */
export interface ResultadoCalculoPrazo {
  servico: string;
  quantidade: number;
  unidade: string;
  produtividade_usada: number;
  unidade_produtividade: UnidadeProdutividade;
  dias_trabalho: number;
  equipe_necessaria: EquipePadrao;
  tempo_cura_adicional_dias: number;
  prazo_total_dias: number;
  observacoes: string[];
}

/**
 * Opções para cálculo de prazo
 */
export interface OpcoesCalculoPrazo {
  complexidade: 'baixa' | 'media' | 'alta';
  horasTrabalhoDia?: number; // PadrÍo 8h
  multiplicadorEquipe?: number; // Para dobrar/triplicar equipe
  considerarCura?: boolean;
}

// ============================================================
// BASE DE DADOS DE PRODUTIVIDADE
// Fonte: SINAPI, TCPO 14, experiência WG Almeida
// ============================================================

export const PRODUTIVIDADE_SINAPI: DadosProdutividade[] = [
  // ================== DEMOLIÇÍO ==================
  {
    codigo_sinapi: '97622',
    servico: 'DemoliçÍo de alvenaria de bloco cerâmico',
    categoria: 'DemoliçÍo',
    unidade: 'm²',
    produtividade_minima: 15,
    produtividade_media: 20,
    produtividade_maxima: 30,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { servente: 2 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    observacoes: 'Inclui empilhamento. não inclui remoçÍo do entulho.',
  },
  {
    codigo_sinapi: '97631',
    servico: 'RemoçÍo de revestimento de argamassa',
    categoria: 'DemoliçÍo',
    unidade: 'm²',
    produtividade_minima: 12,
    produtividade_media: 18,
    produtividade_maxima: 25,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },
  {
    codigo_sinapi: '97632',
    servico: 'RemoçÍo de piso cerâmico',
    categoria: 'DemoliçÍo',
    unidade: 'm²',
    produtividade_minima: 10,
    produtividade_media: 15,
    produtividade_maxima: 22,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { servente: 2 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    observacoes: 'Piso sobre contrapiso. Com argamassa colante forte pode reduzir 30%.',
  },
  {
    codigo_sinapi: '97641',
    servico: 'RemoçÍo de forro de gesso',
    categoria: 'DemoliçÍo',
    unidade: 'm²',
    produtividade_minima: 25,
    produtividade_media: 35,
    produtividade_maxima: 50,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { servente: 2 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.8,
  },

  // ================== ALVENARIA ==================
  {
    codigo_sinapi: '87472',
    servico: 'Alvenaria de bloco cerâmico 9cm',
    categoria: 'Alvenaria',
    unidade: 'm²',
    produtividade_minima: 12,
    produtividade_media: 18,
    produtividade_maxima: 25,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    observacoes: 'Parede com poucos recortes. Complexidade alta: muitas instalações.',
    tempo_cura_horas: 48,
  },
  {
    codigo_sinapi: '87476',
    servico: 'Alvenaria de bloco cerâmico 14cm',
    categoria: 'Alvenaria',
    unidade: 'm²',
    produtividade_minima: 10,
    produtividade_media: 15,
    produtividade_maxima: 22,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 48,
  },
  {
    codigo_sinapi: '87500',
    servico: 'Verga e contraverga',
    categoria: 'Alvenaria',
    unidade: 'ml',
    produtividade_minima: 8,
    produtividade_media: 12,
    produtividade_maxima: 18,
    unidade_produtividade: 'ml/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 72,
  },

  // ================== REVESTIMENTO ==================
  {
    codigo_sinapi: '87879',
    servico: 'Chapisco interno com rolo',
    categoria: 'Revestimento',
    subcategoria: 'Chapisco',
    unidade: 'm²',
    produtividade_minima: 80,
    produtividade_media: 100,
    produtividade_maxima: 130,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.1,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.9,
    tempo_cura_horas: 24,
  },
  {
    codigo_sinapi: '87529',
    servico: 'Emboço interno',
    categoria: 'Revestimento',
    subcategoria: 'Emboço',
    unidade: 'm²',
    produtividade_minima: 15,
    produtividade_media: 22,
    produtividade_maxima: 30,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 168, // 7 dias para cura completa
  },
  {
    codigo_sinapi: '87891',
    servico: 'Reboco',
    categoria: 'Revestimento',
    subcategoria: 'Reboco',
    unidade: 'm²',
    produtividade_minima: 12,
    produtividade_media: 18,
    produtividade_maxima: 25,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 72,
  },
  {
    codigo_sinapi: '87895',
    servico: 'Gesso liso em parede',
    categoria: 'Revestimento',
    subcategoria: 'Gesso',
    unidade: 'm²',
    produtividade_minima: 25,
    produtividade_media: 35,
    produtividade_maxima: 50,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { gesseiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 48,
    observacoes: 'Paredes lisas e aprumadas. Complexidade alta: paredes tortas.',
  },
  {
    codigo_sinapi: '88497',
    servico: 'Massa corrida PVA',
    categoria: 'Revestimento',
    subcategoria: 'Massa',
    unidade: 'm²',
    produtividade_minima: 40,
    produtividade_media: 55,
    produtividade_maxima: 75,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pintor: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 24,
    observacoes: 'Primeira demÍo. Segunda demÍo após lixamento.',
  },

  // ================== PISO ==================
  {
    codigo_sinapi: '87622',
    servico: 'Contrapiso 3cm',
    categoria: 'Piso',
    subcategoria: 'Contrapiso',
    unidade: 'm²',
    produtividade_minima: 20,
    produtividade_media: 28,
    produtividade_maxima: 38,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 2 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 72,
  },
  {
    codigo_sinapi: '87261',
    servico: 'Piso cerâmico 30x30',
    categoria: 'Piso',
    subcategoria: 'Cerâmica',
    unidade: 'm²',
    produtividade_minima: 8,
    produtividade_media: 12,
    produtividade_maxima: 16,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { azulejista: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    tempo_cura_horas: 48,
    observacoes: 'PaginaçÍo simples. Diagonais reduzem 30%.',
  },
  {
    codigo_sinapi: '87263',
    servico: 'Piso cerâmico 45x45',
    categoria: 'Piso',
    subcategoria: 'Cerâmica',
    unidade: 'm²',
    produtividade_minima: 10,
    produtividade_media: 14,
    produtividade_maxima: 20,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { azulejista: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    tempo_cura_horas: 48,
  },
  {
    codigo_sinapi: '87266',
    servico: 'Porcelanato 60x60',
    categoria: 'Piso',
    subcategoria: 'Porcelanato',
    unidade: 'm²',
    produtividade_minima: 8,
    produtividade_media: 12,
    produtividade_maxima: 18,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { azulejista: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    tempo_cura_horas: 48,
    observacoes: 'Requer dupla colagem em porcelanato retificado.',
  },
  {
    codigo_sinapi: '87270',
    servico: 'Piso vinílico click',
    categoria: 'Piso',
    subcategoria: 'Vinílico',
    unidade: 'm²',
    produtividade_minima: 25,
    produtividade_media: 35,
    produtividade_maxima: 50,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { carpinteiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 0,
    permite_trabalho_paralelo: true,
  },
  {
    codigo_sinapi: '87272',
    servico: 'Piso laminado',
    categoria: 'Piso',
    subcategoria: 'Laminado',
    unidade: 'm²',
    produtividade_minima: 20,
    produtividade_media: 30,
    produtividade_maxima: 45,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { carpinteiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 0,
    permite_trabalho_paralelo: true,
  },

  // ================== AZULEJO ==================
  {
    servico: 'Azulejo parede',
    categoria: 'Revestimento',
    subcategoria: 'Azulejo',
    unidade: 'm²',
    produtividade_minima: 6,
    produtividade_media: 10,
    produtividade_maxima: 15,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { azulejista: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.4,
    tempo_cura_horas: 48,
    observacoes: 'Meia-parede simples. Box com nichos reduz 50%.',
  },

  // ================== PINTURA ==================
  {
    codigo_sinapi: '88485',
    servico: 'Pintura látex PVA interno',
    categoria: 'Pintura',
    unidade: 'm²',
    produtividade_minima: 50,
    produtividade_media: 70,
    produtividade_maxima: 100,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pintor: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 4,
    observacoes: 'Uma demÍo. Total 2-3 demÍos. Intervalo mínimo 4h.',
  },
  {
    codigo_sinapi: '88490',
    servico: 'Pintura acrílica externa',
    categoria: 'Pintura',
    unidade: 'm²',
    produtividade_minima: 40,
    produtividade_media: 60,
    produtividade_maxima: 85,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pintor: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 6,
    observacoes: 'Necessita andaime. Chuva impede trabalho.',
  },
  {
    codigo_sinapi: '88494',
    servico: 'Pintura esmalte sintético',
    categoria: 'Pintura',
    unidade: 'm²',
    produtividade_minima: 20,
    produtividade_media: 30,
    produtividade_maxima: 45,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pintor: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 12,
    observacoes: 'Portas, janelas, grades. Necessita lixamento entre demÍos.',
  },
  {
    codigo_sinapi: '88515',
    servico: 'Textura acrílica',
    categoria: 'Pintura',
    subcategoria: 'Textura',
    unidade: 'm²',
    produtividade_minima: 30,
    produtividade_media: 45,
    produtividade_maxima: 65,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pintor: 1 },
    fator_complexidade_baixa: 1.1,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.8,
    tempo_cura_horas: 24,
  },

  // ================== ELÉTRICA ==================
  {
    codigo_sinapi: '91853',
    servico: 'Ponto de tomada 2P+T',
    categoria: 'Elétrica',
    unidade: 'un',
    produtividade_minima: 4,
    produtividade_media: 6,
    produtividade_maxima: 8,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { eletricista: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    observacoes: 'Inclui eletroduto, caixa e fiaçÍo. Paredes prontas.',
  },
  {
    codigo_sinapi: '91856',
    servico: 'Ponto de iluminaçÍo teto',
    categoria: 'Elétrica',
    unidade: 'un',
    produtividade_minima: 4,
    produtividade_media: 6,
    produtividade_maxima: 8,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { eletricista: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
  },
  {
    codigo_sinapi: '91859',
    servico: 'Ponto de interruptor simples',
    categoria: 'Elétrica',
    unidade: 'un',
    produtividade_minima: 6,
    produtividade_media: 8,
    produtividade_maxima: 12,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { eletricista: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
  },
  {
    codigo_sinapi: '91928',
    servico: 'Quadro de distribuiçÍo 8 disjuntores',
    categoria: 'Elétrica',
    subcategoria: 'Quadro',
    unidade: 'un',
    produtividade_minima: 1,
    produtividade_media: 2,
    produtividade_maxima: 3,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { eletricista: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },

  // ================== HIDRÁULICA ==================
  {
    codigo_sinapi: '89357',
    servico: 'Ponto de água fria 20mm',
    categoria: 'Hidráulica',
    unidade: 'un',
    produtividade_minima: 3,
    produtividade_media: 5,
    produtividade_maxima: 7,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { encanador: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    observacoes: 'Inclui tubulaçÍo, conexões. Paredes abertas.',
  },
  {
    codigo_sinapi: '89360',
    servico: 'Ponto de água quente 22mm',
    categoria: 'Hidráulica',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 4,
    produtividade_maxima: 6,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { encanador: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
    observacoes: 'PPR ou CPVC. Requer isolamento térmico.',
  },
  {
    codigo_sinapi: '89401',
    servico: 'Ponto de esgoto 50mm',
    categoria: 'Hidráulica',
    subcategoria: 'Esgoto',
    unidade: 'un',
    produtividade_minima: 3,
    produtividade_media: 5,
    produtividade_maxima: 7,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { encanador: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
  },
  {
    codigo_sinapi: '89402',
    servico: 'Ponto de esgoto 100mm',
    categoria: 'Hidráulica',
    subcategoria: 'Esgoto',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 4,
    produtividade_maxima: 6,
    unidade_produtividade: 'pt/dia',
    equipe_padrao: { encanador: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.5,
  },

  // ================== LOUÇAS E METAIS ==================
  {
    codigo_sinapi: '86911',
    servico: 'InstalaçÍo vaso sanitário',
    categoria: 'Louças e Metais',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 4,
    produtividade_maxima: 6,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { encanador: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },
  {
    codigo_sinapi: '86920',
    servico: 'InstalaçÍo lavatório com coluna',
    categoria: 'Louças e Metais',
    unidade: 'un',
    produtividade_minima: 3,
    produtividade_media: 5,
    produtividade_maxima: 7,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { encanador: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.8,
  },
  {
    codigo_sinapi: '86940',
    servico: 'InstalaçÍo pia de cozinha',
    categoria: 'Louças e Metais',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 3,
    produtividade_maxima: 4,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { encanador: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },

  // ================== FORRO ==================
  {
    codigo_sinapi: '96117',
    servico: 'Forro de gesso liso',
    categoria: 'Forro',
    unidade: 'm²',
    produtividade_minima: 10,
    produtividade_media: 15,
    produtividade_maxima: 22,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { gesseiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 48,
    observacoes: 'Sancas e tabicas reduzem produtividade em 40%.',
  },
  {
    codigo_sinapi: '96118',
    servico: 'Forro de gesso acartonado (drywall)',
    categoria: 'Forro',
    unidade: 'm²',
    produtividade_minima: 12,
    produtividade_media: 18,
    produtividade_maxima: 25,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { gesseiro: 2, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 24,
  },
  {
    codigo_sinapi: '96123',
    servico: 'Forro de PVC',
    categoria: 'Forro',
    unidade: 'm²',
    produtividade_minima: 15,
    produtividade_media: 22,
    produtividade_maxima: 32,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { carpinteiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 0,
  },

  // ================== ESQUADRIAS ==================
  {
    codigo_sinapi: '91306',
    servico: 'InstalaçÍo porta madeira 80cm',
    categoria: 'Esquadrias',
    subcategoria: 'Portas',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 3,
    produtividade_maxima: 5,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { carpinteiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    observacoes: 'Porta pronta com batente. Portas sob medida reduzem 40%.',
  },
  {
    codigo_sinapi: '91320',
    servico: 'InstalaçÍo janela alumínio correr',
    categoria: 'Esquadrias',
    subcategoria: 'Janelas',
    unidade: 'un',
    produtividade_minima: 2,
    produtividade_media: 4,
    produtividade_maxima: 6,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { serralheiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },
  {
    codigo_sinapi: '91335',
    servico: 'Box de vidro temperado',
    categoria: 'Esquadrias',
    subcategoria: 'Box',
    unidade: 'un',
    produtividade_minima: 1,
    produtividade_media: 2,
    produtividade_maxima: 3,
    unidade_produtividade: 'un/dia',
    equipe_padrao: { vidraceiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
  },

  // ================== IMPERMEABILIZAÇÍO ==================
  {
    codigo_sinapi: '98557',
    servico: 'ImpermeabilizaçÍo manta asfáltica 3mm',
    categoria: 'ImpermeabilizaçÍo',
    unidade: 'm²',
    produtividade_minima: 20,
    produtividade_media: 30,
    produtividade_maxima: 45,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 24,
    observacoes: 'Lajes planas. Ralos e rodapés reduzem produtividade.',
  },
  {
    codigo_sinapi: '98560',
    servico: 'ImpermeabilizaçÍo argamassa polimérica',
    categoria: 'ImpermeabilizaçÍo',
    unidade: 'm²',
    produtividade_minima: 25,
    produtividade_media: 40,
    produtividade_maxima: 55,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { pedreiro: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.7,
    tempo_cura_horas: 72,
    observacoes: 'Áreas molhadas. Mínimo 3 demÍos cruzadas.',
  },

  // ================== ESTRUTURA ==================
  {
    codigo_sinapi: '94964',
    servico: 'Concreto usinado FCK 25 MPa',
    categoria: 'Estrutura',
    subcategoria: 'Concreto',
    unidade: 'm³',
    produtividade_minima: 10,
    produtividade_media: 15,
    produtividade_maxima: 25,
    unidade_produtividade: 'm³/dia',
    equipe_padrao: { pedreiro: 2, servente: 4 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    tempo_cura_horas: 504, // 21 dias para cura
    observacoes: 'Lançamento e adensamento. Cura 21 dias para desforma total.',
  },
  {
    codigo_sinapi: '92792',
    servico: 'Armadura aço CA-50',
    categoria: 'Estrutura',
    subcategoria: 'ArmaçÍo',
    unidade: 'kg',
    produtividade_minima: 80,
    produtividade_media: 120,
    produtividade_maxima: 160,
    unidade_produtividade: 'kg/dia',
    equipe_padrao: { armador: 1, servente: 1 },
    fator_complexidade_baixa: 1.3,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    observacoes: 'Corte, dobra e montagem. Pilares e vigas.',
  },
  {
    codigo_sinapi: '92426',
    servico: 'Forma de madeira',
    categoria: 'Estrutura',
    subcategoria: 'Forma',
    unidade: 'm²',
    produtividade_minima: 5,
    produtividade_media: 8,
    produtividade_maxima: 12,
    unidade_produtividade: 'm²/dia',
    equipe_padrao: { carpinteiro: 1, servente: 1 },
    fator_complexidade_baixa: 1.2,
    fator_complexidade_media: 1.0,
    fator_complexidade_alta: 0.6,
    observacoes: 'ConfecçÍo e montagem. 3 reaproveitamentos em média.',
  },
];

// ============================================================
// CLASSE DO SERVIÇO DE PRODUTIVIDADE
// ============================================================

export class SINAPIProdutividadeService {
  private dados: DadosProdutividade[];

  constructor() {
    this.dados = PRODUTIVIDADE_SINAPI;
  }

  /**
   * Buscar dados de produtividade por serviço
   */
  buscarPorServico(termo: string): DadosProdutividade[] {
    const termoLower = termo.toLowerCase();
    return this.dados.filter(d =>
      d.servico.toLowerCase().includes(termoLower) ||
      d.categoria.toLowerCase().includes(termoLower) ||
      d.subcategoria?.toLowerCase().includes(termoLower) ||
      d.codigo_sinapi?.includes(termo)
    );
  }

  /**
   * Buscar por categoria
   */
  buscarPorCategoria(categoria: string): DadosProdutividade[] {
    return this.dados.filter(d =>
      d.categoria.toLowerCase() === categoria.toLowerCase()
    );
  }

  /**
   * Buscar por código SINAPI
   */
  buscarPorCodigoSINAPI(codigo: string): DadosProdutividade | undefined {
    return this.dados.find(d => d.codigo_sinapi === codigo);
  }

  /**
   * Obter todas as categorias disponíveis
   */
  listarCategorias(): string[] {
    const categorias = new Set(this.dados.map(d => d.categoria));
    return Array.from(categorias).sort();
  }

  /**
   * Calcular prazo para executar um serviço
   */
  calcularPrazo(
    servico: string | DadosProdutividade,
    quantidade: number,
    opcoes: OpcoesCalculoPrazo = { complexidade: 'media' }
  ): ResultadoCalculoPrazo | null {
    // Obter dados do serviço
    let dados: DadosProdutividade | undefined;
    if (typeof servico === 'string') {
      dados = this.buscarPorServico(servico)[0];
    } else {
      dados = servico;
    }

    if (!dados) return null;

    const horasDia = opcoes.horasTrabalhoDia || 8;
    const multiplicador = opcoes.multiplicadorEquipe || 1;

    // Selecionar produtividade base pela complexidade
    let produtividadeBase: number;
    let fatorComplexidade: number;

    switch (opcoes.complexidade) {
      case 'baixa':
        produtividadeBase = dados.produtividade_maxima;
        fatorComplexidade = dados.fator_complexidade_baixa;
        break;
      case 'alta':
        produtividadeBase = dados.produtividade_minima;
        fatorComplexidade = dados.fator_complexidade_alta;
        break;
      default:
        produtividadeBase = dados.produtividade_media;
        fatorComplexidade = dados.fator_complexidade_media;
    }

    // Aplicar fator de complexidade e multiplicador de equipe
    const produtividadeFinal = produtividadeBase * fatorComplexidade * multiplicador;

    // Calcular dias de trabalho
    const diasTrabalho = Math.ceil(quantidade / produtividadeFinal);

    // Calcular tempo de cura adicional
    let tempoCuraAdicionalDias = 0;
    if (opcoes.considerarCura && dados.tempo_cura_horas) {
      tempoCuraAdicionalDias = Math.ceil(dados.tempo_cura_horas / 24);
    }

    // Ajustar equipe pelo multiplicador
    const equipeAjustada: EquipePadrao = {};
    for (const [cargo, qtd] of Object.entries(dados.equipe_padrao)) {
      if (qtd) {
        equipeAjustada[cargo as keyof EquipePadrao] = Math.ceil(qtd * multiplicador);
      }
    }

    const observacoes: string[] = [];
    if (dados.observacoes) observacoes.push(dados.observacoes);
    if (multiplicador > 1) {
      observacoes.push(`Equipe multiplicada por ${multiplicador}x.`);
    }
    if (tempoCuraAdicionalDias > 0) {
      observacoes.push(`Tempo de cura/secagem: ${tempoCuraAdicionalDias} dia(s).`);
    }

    return {
      servico: dados.servico,
      quantidade,
      unidade: dados.unidade,
      produtividade_usada: produtividadeFinal,
      unidade_produtividade: dados.unidade_produtividade,
      dias_trabalho: diasTrabalho,
      equipe_necessaria: equipeAjustada,
      tempo_cura_adicional_dias: tempoCuraAdicionalDias,
      prazo_total_dias: diasTrabalho + tempoCuraAdicionalDias,
      observacoes,
    };
  }

  /**
   * Calcular prazos para múltiplos serviços
   */
  calcularPrazosMultiplos(
    itens: Array<{ servico: string; quantidade: number }>,
    opcoes: OpcoesCalculoPrazo = { complexidade: 'media' }
  ): {
    resultados: ResultadoCalculoPrazo[];
    prazoTotalSequencial: number;
    prazoTotalParalelo: number;
    equipeConsolidada: EquipePadrao;
  } {
    const resultados: ResultadoCalculoPrazo[] = [];
    let prazoTotalSequencial = 0;
    let prazoTotalParalelo = 0;
    const equipeConsolidada: EquipePadrao = {};

    for (const item of itens) {
      const resultado = this.calcularPrazo(item.servico, item.quantidade, opcoes);
      if (resultado) {
        resultados.push(resultado);
        prazoTotalSequencial += resultado.prazo_total_dias;
        prazoTotalParalelo = Math.max(prazoTotalParalelo, resultado.prazo_total_dias);

        // Consolidar equipe
        for (const [cargo, qtd] of Object.entries(resultado.equipe_necessaria)) {
          if (qtd) {
            const atual = equipeConsolidada[cargo as keyof EquipePadrao] || 0;
            equipeConsolidada[cargo as keyof EquipePadrao] = Math.max(atual, qtd);
          }
        }
      }
    }

    return {
      resultados,
      prazoTotalSequencial,
      prazoTotalParalelo,
      equipeConsolidada,
    };
  }

  /**
   * Estimar cronograma detalhado
   */
  gerarCronogramaEstimado(
    itens: Array<{ servico: string; quantidade: number }>,
    dataInicio: Date,
    opcoes: OpcoesCalculoPrazo & {
      diasUteisSemana?: number;
      folgas?: Date[];
    } = { complexidade: 'media' }
  ): Array<{
    servico: string;
    dataInicio: Date;
    dataFim: Date;
    diasUteis: number;
    observacoes: string[];
  }> {
    const diasUteisSemana = opcoes.diasUteisSemana || 5;
    const folgas = opcoes.folgas || [];
    const cronograma: Array<{
      servico: string;
      dataInicio: Date;
      dataFim: Date;
      diasUteis: number;
      observacoes: string[];
    }> = [];

    let dataAtual = new Date(dataInicio);

    for (const item of itens) {
      const resultado = this.calcularPrazo(item.servico, item.quantidade, opcoes);
      if (!resultado) continue;

      const dataInicioItem = new Date(dataAtual);
      let diasContados = 0;

      while (diasContados < resultado.prazo_total_dias) {
        const diaSemana = dataAtual.getDay();
        const ehFimDeSemana = diaSemana === 0 || diaSemana === 6;
        const ehFolga = folgas.some(f =>
          f.getFullYear() === dataAtual.getFullYear() &&
          f.getMonth() === dataAtual.getMonth() &&
          f.getDate() === dataAtual.getDate()
        );

        if (!ehFimDeSemana && !ehFolga) {
          diasContados++;
        }

        dataAtual.setDate(dataAtual.getDate() + 1);
      }

      cronograma.push({
        servico: resultado.servico,
        dataInicio: dataInicioItem,
        dataFim: new Date(dataAtual.getTime() - 24 * 60 * 60 * 1000),
        diasUteis: resultado.prazo_total_dias,
        observacoes: resultado.observacoes,
      });
    }

    return cronograma;
  }

  /**
   * Obter todos os dados de produtividade
   */
  obterTodos(): DadosProdutividade[] {
    return [...this.dados];
  }

  /**
   * Adicionar dados de produtividade personalizados
   */
  adicionarDados(dados: DadosProdutividade): void {
    this.dados.push(dados);
  }
}

// ============================================================
// INSTÂNCIA GLOBAL
// ============================================================

export const produtividadeService = new SINAPIProdutividadeService();

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Formatar duraçÍo em dias para texto legível
 */
export function formatarDuracaoDias(dias: number): string {
  if (dias < 1) return 'menos de 1 dia';
  if (dias === 1) return '1 dia';
  if (dias < 7) return `${dias} dias`;

  const semanas = Math.floor(dias / 5); // dias úteis
  const diasRestantes = dias % 5;

  if (diasRestantes === 0) {
    return semanas === 1 ? '1 semana' : `${semanas} semanas`;
  }

  return `${semanas} semana${semanas > 1 ? 's' : ''} e ${diasRestantes} dia${diasRestantes > 1 ? 's' : ''}`;
}

/**
 * Formatar equipe para texto
 */
export function formatarEquipe(equipe: EquipePadrao): string {
  const partes: string[] = [];

  const nomes: Record<keyof EquipePadrao, string> = {
    pedreiro: 'Pedreiro',
    servente: 'Servente',
    eletricista: 'Eletricista',
    encanador: 'Encanador',
    pintor: 'Pintor',
    azulejista: 'Azulejista',
    gesseiro: 'Gesseiro',
    carpinteiro: 'Carpinteiro',
    armador: 'Armador',
    serralheiro: 'Serralheiro',
    vidraceiro: 'Vidraceiro',
  };

  for (const [cargo, qtd] of Object.entries(equipe)) {
    if (qtd && qtd > 0) {
      const nome = nomes[cargo as keyof EquipePadrao] || cargo;
      partes.push(`${qtd} ${nome}${qtd > 1 ? 's' : ''}`);
    }
  }

  return partes.join(', ') || 'não especificada';
}



