// ============================================================
// INTEGRAÇÍO SINAPI - WG EASY
// Sistema Nacional de Pesquisa de Custos e índices da ConstruçÍo Civil
// ============================================================

import { supabase } from '@/lib/supabaseClient';

// ============================================================
// TIPOS E INTERFACES
// ============================================================

/**
 * Estados brasileiros disponíveis no SINAPI
 */
export type EstadoBrasil =
  | 'AC' | 'AL' | 'AM' | 'AP' | 'BA' | 'CE' | 'DF' | 'ES' | 'GO'
  | 'MA' | 'MG' | 'MS' | 'MT' | 'PA' | 'PB' | 'PE' | 'PI' | 'PR'
  | 'RJ' | 'RN' | 'RO' | 'RR' | 'RS' | 'SC' | 'SE' | 'SP' | 'TO';

/**
 * Tipo de item SINAPI
 */
export type TipoItemSINAPI = 'insumo' | 'composicao' | 'servico';

/**
 * Tipo de desoneraçÍo
 */
export type TipoDesoneracao = 'desonerado' | 'nao_desonerado';

/**
 * Item SINAPI
 */
export interface ItemSINAPI {
  codigo: string;
  descricao: string;
  unidade: string;
  tipo: TipoItemSINAPI;
  preco_mediano: number;
  preco_minimo?: number;
  preco_maximo?: number;
  data_referencia: string; // YYYY-MM
  estado: EstadoBrasil;
  desoneracao: TipoDesoneracao;
  classe?: string;
  grupo?: string;
}

/**
 * ComposiçÍo analítica SINAPI
 */
export interface ComposicaoAnaliticaSINAPI {
  codigo_composicao: string;
  descricao_composicao: string;
  unidade: string;
  itens: {
    codigo_item: string;
    descricao_item: string;
    tipo: 'insumo' | 'composicao_auxiliar';
    unidade: string;
    coeficiente: number;
    preco_unitario: number;
    preco_total: number;
  }[];
  custo_total_insumos: number;
  custo_total: number;
}

/**
 * Resultado de importaçÍo SINAPI
 */
export interface ResultadoImportacaoSINAPI {
  sucesso: boolean;
  itensImportados: number;
  itensAtualizados: number;
  erros: string[];
  dataReferencia: string;
  estado: EstadoBrasil;
  duracao_ms: number;
}

/**
 * Filtros para busca SINAPI
 */
export interface FiltrosBuscaSINAPI {
  termo?: string;
  codigo?: string;
  tipo?: TipoItemSINAPI;
  estado?: EstadoBrasil;
  classe?: string;
  grupo?: string;
  preco_min?: number;
  preco_max?: number;
  data_referencia?: string;
  desoneracao?: TipoDesoneracao;
  pagina?: number;
  por_pagina?: number;
}

/**
 * Histórico de atualizações
 */
export interface HistoricoAtualizacaoSINAPI {
  id: string;
  data_importacao: string;
  data_referencia: string;
  estado: EstadoBrasil;
  tipo: 'insumos' | 'composicoes' | 'completo';
  itens_processados: number;
  sucesso: boolean;
  erros?: string[];
}

// ============================================================
// CLASSE PRINCIPAL DE INTEGRAÇÍO SINAPI
// ============================================================

export class SINAPIIntegracaoService {
  private readonly TABELA_INSUMOS = 'sinapi_insumos';
  private readonly TABELA_COMPOSICOES = 'sinapi_composicoes';
  private readonly TABELA_HISTORICO = 'sinapi_historico_importacoes';

  /**
   * Buscar itens SINAPI no banco de dados local
   */
  async buscarItens(filtros: FiltrosBuscaSINAPI): Promise<{
    itens: ItemSINAPI[];
    total: number;
    pagina: number;
    temMais: boolean;
  }> {
    try {
      const pagina = filtros.pagina || 1;
      const porPagina = filtros.por_pagina || 50;
      const offset = (pagina - 1) * porPagina;

      // Verificar se tabela existe
      const { error: checkError } = await supabase
        .from(this.TABELA_INSUMOS)
        .select('codigo')
        .limit(1);

      if (checkError?.code === '42P01') {
        // Tabela não existe ainda
        console.warn('[SINAPI] Tabela de insumos não encontrada. Execute a migraçÍo primeiro.');
        return {
          itens: [],
          total: 0,
          pagina,
          temMais: false,
        };
      }

      let query = supabase
        .from(this.TABELA_INSUMOS)
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filtros.termo) {
        query = query.or(`descricao.ilike.%${filtros.termo}%,codigo.ilike.%${filtros.termo}%`);
      }

      if (filtros.codigo) {
        query = query.eq('codigo', filtros.codigo);
      }

      if (filtros.tipo) {
        query = query.eq('tipo', filtros.tipo);
      }

      if (filtros.estado) {
        query = query.eq('estado', filtros.estado);
      }

      if (filtros.classe) {
        query = query.eq('classe', filtros.classe);
      }

      if (filtros.preco_min !== undefined) {
        query = query.gte('preco_mediano', filtros.preco_min);
      }

      if (filtros.preco_max !== undefined) {
        query = query.lte('preco_mediano', filtros.preco_max);
      }

      if (filtros.desoneracao) {
        query = query.eq('desoneracao', filtros.desoneracao);
      }

      // Ordenar e paginar
      query = query
        .order('codigo', { ascending: true })
        .range(offset, offset + porPagina - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        itens: data as ItemSINAPI[],
        total: count || 0,
        pagina,
        temMais: (count || 0) > offset + porPagina,
      };
    } catch (error) {
      console.error('[SINAPI] Erro ao buscar itens:', error);
      throw error;
    }
  }

  /**
   * Buscar composiçÍo analítica por código
   */
  async buscarComposicaoAnalitica(codigo: string, estado: EstadoBrasil = 'SP'): Promise<ComposicaoAnaliticaSINAPI | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABELA_COMPOSICOES)
        .select('*')
        .eq('codigo', codigo)
        .eq('estado', estado)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // não encontrado
        throw error;
      }

      return data as ComposicaoAnaliticaSINAPI;
    } catch (error) {
      console.error('[SINAPI] Erro ao buscar composiçÍo:', error);
      return null;
    }
  }

  /**
   * Importar dados SINAPI de arquivo Excel
   * O SINAPI disponibiliza planilhas mensais em:
   * https://www.caixa.gov.br/poder-publico/modernizacao-gestao/sinapi/Paginas/default.aspx
   */
  async importarDeExcel(
    arquivo: File,
    estado: EstadoBrasil,
    dataReferencia: string,
    tipo: 'insumos' | 'composicoes'
  ): Promise<ResultadoImportacaoSINAPI> {
    const inicio = Date.now();
    const erros: string[] = [];
    let itensImportados = 0;
    let itensAtualizados = 0;

    try {
      // Ler arquivo Excel
      // TODO: Usar biblioteca xlsx para parsing
      console.log('[SINAPI] Iniciando importaçÍo:', {
        arquivo: arquivo.name,
        estado,
        dataReferencia,
        tipo,
      });

      // Estrutura esperada das planilhas SINAPI:
      // Insumos: CODIGO | DESCRICAO DO INSUMO | UNIDADE | PRECO MEDIANO | PRECO MINIMO | PRECO MAXIMO
      // Composições: CODIGO | DESCRICAO DA COMPOSICAO | UNIDADE | CUSTO TOTAL

      // SimulaçÍo de importaçÍo
      // Em produçÍo, fazer parsing real do Excel

      const resultado: ResultadoImportacaoSINAPI = {
        sucesso: true,
        itensImportados,
        itensAtualizados,
        erros,
        dataReferencia,
        estado,
        duracao_ms: Date.now() - inicio,
      };

      // Registrar no histórico
      await this.registrarHistorico({
        data_referencia: dataReferencia,
        estado,
        tipo,
        itens_processados: itensImportados + itensAtualizados,
        sucesso: true,
      });

      return resultado;
    } catch (error) {
      erros.push(`Erro geral: ${error}`);

      return {
        sucesso: false,
        itensImportados,
        itensAtualizados,
        erros,
        dataReferencia,
        estado,
        duracao_ms: Date.now() - inicio,
      };
    }
  }

  /**
   * Registrar histórico de importaçÍo
   */
  private async registrarHistorico(dados: Omit<HistoricoAtualizacaoSINAPI, 'id' | 'data_importacao'>) {
    try {
      await supabase
        .from(this.TABELA_HISTORICO)
        .insert({
          ...dados,
          data_importacao: new Date().toISOString(),
        });
    } catch (error) {
      console.error('[SINAPI] Erro ao registrar histórico:', error);
    }
  }

  /**
   * Obter última atualizaçÍo por estado
   */
  async obterUltimaAtualizacao(estado: EstadoBrasil): Promise<HistoricoAtualizacaoSINAPI | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABELA_HISTORICO)
        .select('*')
        .eq('estado', estado)
        .eq('sucesso', true)
        .order('data_importacao', { ascending: false })
        .limit(1)
        .single();

      if (error) return null;
      return data as HistoricoAtualizacaoSINAPI;
    } catch {
      return null;
    }
  }

  /**
   * Verificar se precisa atualizaçÍo (mais de 30 dias)
   */
  async verificarNecessidadeAtualizacao(estado: EstadoBrasil): Promise<{
    precisaAtualizar: boolean;
    ultimaAtualizacao: string | null;
    diasDesdeAtualizacao: number;
  }> {
    const ultima = await this.obterUltimaAtualizacao(estado);

    if (!ultima) {
      return {
        precisaAtualizar: true,
        ultimaAtualizacao: null,
        diasDesdeAtualizacao: 999,
      };
    }

    const dataUltima = new Date(ultima.data_importacao);
    const agora = new Date();
    const diffMs = agora.getTime() - dataUltima.getTime();
    const diasDesdeAtualizacao = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      precisaAtualizar: diasDesdeAtualizacao > 30,
      ultimaAtualizacao: ultima.data_importacao,
      diasDesdeAtualizacao,
    };
  }

  /**
   * Gerar SQL para criar tabelas SINAPI
   */
  gerarMigracaoSQL(): string {
    return `
-- ============================================================
-- MIGRAÇÍO: Tabelas SINAPI para WGEasy
-- ============================================================

-- Tabela de insumos SINAPI
CREATE TABLE IF NOT EXISTS sinapi_insumos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  unidade VARCHAR(10) NOT NULL,
  tipo VARCHAR(20) DEFAULT 'insumo',
  preco_mediano DECIMAL(15,2),
  preco_minimo DECIMAL(15,2),
  preco_maximo DECIMAL(15,2),
  data_referencia VARCHAR(7) NOT NULL, -- YYYY-MM
  estado VARCHAR(2) NOT NULL,
  desoneracao VARCHAR(20) DEFAULT 'nao_desonerado',
  classe VARCHAR(100),
  grupo VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo, estado, data_referencia, desoneracao)
);

-- índices para busca eficiente
CREATE INDEX IF NOT EXISTS idx_sinapi_insumos_codigo ON sinapi_insumos(codigo);
CREATE INDEX IF NOT EXISTS idx_sinapi_insumos_estado ON sinapi_insumos(estado);
CREATE INDEX IF NOT EXISTS idx_sinapi_insumos_descricao ON sinapi_insumos USING gin(to_tsvector('portuguese', descricao));

-- Tabela de composições SINAPI
CREATE TABLE IF NOT EXISTS sinapi_composicoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL,
  descricao TEXT NOT NULL,
  unidade VARCHAR(10) NOT NULL,
  custo_total DECIMAL(15,2),
  data_referencia VARCHAR(7) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  desoneracao VARCHAR(20) DEFAULT 'nao_desonerado',
  itens JSONB, -- Array de itens da composiçÍo
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(codigo, estado, data_referencia, desoneracao)
);

-- índices
CREATE INDEX IF NOT EXISTS idx_sinapi_composicoes_codigo ON sinapi_composicoes(codigo);
CREATE INDEX IF NOT EXISTS idx_sinapi_composicoes_estado ON sinapi_composicoes(estado);

-- Tabela de histórico de importações
CREATE TABLE IF NOT EXISTS sinapi_historico_importacoes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  data_importacao TIMESTAMPTZ DEFAULT NOW(),
  data_referencia VARCHAR(7) NOT NULL,
  estado VARCHAR(2) NOT NULL,
  tipo VARCHAR(20) NOT NULL, -- 'insumos', 'composicoes', 'completo'
  itens_processados INTEGER DEFAULT 0,
  sucesso BOOLEAN DEFAULT true,
  erros TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE sinapi_insumos ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinapi_composicoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sinapi_historico_importacoes ENABLE ROW LEVEL SECURITY;

-- Permitir leitura para todos os usuários autenticados
CREATE POLICY "Permitir leitura SINAPI insumos" ON sinapi_insumos
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir leitura SINAPI composicoes" ON sinapi_composicoes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Permitir leitura SINAPI historico" ON sinapi_historico_importacoes
  FOR SELECT TO authenticated USING (true);

-- Apenas admins podem inserir/atualizar
CREATE POLICY "Admin insere SINAPI insumos" ON sinapi_insumos
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
  );

CREATE POLICY "Admin atualiza SINAPI insumos" ON sinapi_insumos
  FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM usuarios WHERE auth_id = auth.uid() AND tipo = 'admin')
  );

-- Comentários
COMMENT ON TABLE sinapi_insumos IS 'Tabela de insumos do SINAPI - atualizada mensalmente';
COMMENT ON TABLE sinapi_composicoes IS 'Tabela de composições do SINAPI com detalhamento analítico';
COMMENT ON TABLE sinapi_historico_importacoes IS 'Histórico de importações de dados SINAPI';
`;
  }
}

// ============================================================
// INSTÂNCIA GLOBAL
// ============================================================

export const sinapiService = new SINAPIIntegracaoService();

// ============================================================
// CÓDIGOS SINAPI MAIS UTILIZADOS EM REFORMAS
// ============================================================

/**
 * Códigos SINAPI organizados por categoria para fácil referência
 */
export const SINAPI_CODIGOS_REFORMA = {
  // ================== DEMOLIÇÍO E REMOÇÍO ==================
  demolicao: {
    alvenaria_tijolo: '97622', // DemoliçÍo de alvenaria de bloco cerâmico
    alvenaria_concreto: '97623', // DemoliçÍo de alvenaria de bloco de concreto
    revestimento_argamassa: '97631', // RemoçÍo de revestimento de argamassa
    piso_ceramico: '97632', // RemoçÍo de piso cerâmico
    forro_gesso: '97641', // RemoçÍo de forro de gesso
    instalacao_eletrica: '97644', // RemoçÍo de instalaçÍo elétrica
    instalacao_hidraulica: '97645', // RemoçÍo de instalaçÍo hidráulica
    esquadria_madeira: '97650', // RemoçÍo de esquadria de madeira
    esquadria_aluminio: '97651', // RemoçÍo de esquadria de alumínio
  },

  // ================== ALVENARIA ==================
  alvenaria: {
    bloco_ceramico_9cm: '87472',
    bloco_ceramico_14cm: '87476',
    bloco_ceramico_19cm: '87480',
    bloco_concreto_9cm: '87484',
    bloco_concreto_14cm: '87488',
    bloco_concreto_19cm: '87492',
    elemento_vazado: '87496',
    verga_contraverga: '87500',
  },

  // ================== REVESTIMENTO ==================
  revestimento: {
    chapisco_interno_rolo: '87879',
    chapisco_externo_rolo: '87878',
    chapisco_interno_colher: '87877',
    chapisco_externo_colher: '87876',
    emboco_interno: '87529',
    emboco_externo: '87528',
    reboco: '87891',
    gesso_liso: '87895',
    massa_corrida_pva: '88497',
    textura_acrilica: '88515',
  },

  // ================== PISO ==================
  piso: {
    contrapiso_3cm: '87622',
    contrapiso_5cm: '87623',
    regularizacao: '87624',
    ceramica_30x30: '87261',
    ceramica_45x45: '87263',
    porcelanato_60x60: '87266',
    porcelanato_80x80: '87268',
    vinilico_click: '87270',
    laminado: '87272',
    cimento_queimado: '87275',
  },

  // ================== PINTURA ==================
  pintura: {
    latex_pva_interno: '88485',
    latex_pva_externo: '88486',
    acrilica_interno: '88489',
    acrilica_externo: '88490',
    esmalte_sintetico: '88494',
    verniz: '88496',
    epoxi: '88498',
    textura: '88515',
  },

  // ================== INSTALAÇÕES ELÉTRICAS ==================
  eletrica: {
    ponto_tomada_2p_t: '91853',
    ponto_tomada_embutido: '91854',
    ponto_iluminacao_teto: '91856',
    ponto_iluminacao_parede: '91857',
    ponto_interruptor_simples: '91859',
    ponto_interruptor_paralelo: '91860',
    quadro_distribuicao_8_disjuntores: '91928',
    quadro_distribuicao_12_disjuntores: '91929',
    quadro_distribuicao_18_disjuntores: '91930',
    disjuntor_monopolar_10a: '91935',
    disjuntor_monopolar_20a: '91936',
    disjuntor_bipolar_20a: '91940',
    eletroduto_3_4: '91950',
    eletroduto_1: '91951',
    cabo_1_5mm: '91960',
    cabo_2_5mm: '91961',
    cabo_4mm: '91962',
    cabo_6mm: '91963',
  },

  // ================== INSTALAÇÕES HIDRÁULICAS ==================
  hidraulica: {
    ponto_agua_fria_20mm: '89357',
    ponto_agua_fria_25mm: '89358',
    ponto_agua_quente_22mm: '89360',
    ponto_esgoto_40mm: '89400',
    ponto_esgoto_50mm: '89401',
    ponto_esgoto_100mm: '89402',
    registro_gaveta_25mm: '89420',
    registro_pressao_20mm: '89425',
    caixa_sifonada_100mm: '89440',
    ralo_seco_100mm: '89445',
    tubo_pvc_25mm: '89350',
    tubo_pvc_32mm: '89351',
    tubo_pvc_50mm: '89352',
    tubo_pvc_100mm: '89353',
  },

  // ================== LOUÇAS E METAIS ==================
  loucas_metais: {
    vaso_sanitario_convencional: '86911',
    vaso_sanitario_caixa_acoplada: '86912',
    lavatorio_coluna: '86920',
    lavatorio_semi_encaixe: '86921',
    tanque_lavar_roupa: '86930',
    pia_cozinha_inox: '86940',
    torneira_jardim: '86950',
    torneira_lavatorio: '86951',
    torneira_pia_cozinha: '86952',
    misturador_lavatorio: '86955',
    misturador_cozinha: '86956',
    ducha_higienica: '86960',
    chuveiro_eletrico: '86965',
  },

  // ================== FORRO ==================
  forro: {
    gesso_liso: '96117',
    gesso_acartonado: '96118',
    pvc: '96123',
    madeira: '96125',
    mineral: '96127',
  },

  // ================== ESQUADRIAS ==================
  esquadrias: {
    porta_madeira_80cm: '91306',
    porta_madeira_90cm: '91307',
    porta_aluminio: '91310',
    porta_vidro: '91315',
    janela_aluminio_correr: '91320',
    janela_aluminio_maxim_ar: '91325',
    janela_vidro_temperado: '91330',
    box_vidro_temperado: '91335',
  },

  // ================== IMPERMEABILIZAÇÍO ==================
  impermeabilizacao: {
    manta_asfaltica_3mm: '98557',
    manta_asfaltica_4mm: '98558',
    argamassa_polimerica: '98560',
    membrana_acrilica: '98565',
  },

  // ================== ESTRUTURA ==================
  estrutura: {
    concreto_fck_25: '94964',
    concreto_fck_30: '94965',
    aco_ca50: '92792',
    forma_madeira: '92426',
    escoramento: '92430',
  },
};

// ============================================================
// FUNÇÕES UTILITÁRIAS
// ============================================================

/**
 * Formatar código SINAPI com zeros à esquerda
 */
export function formatarCodigoSINAPI(codigo: string | number): string {
  return String(codigo).padStart(5, '0');
}

/**
 * Validar código SINAPI
 */
export function validarCodigoSINAPI(codigo: string): boolean {
  // Códigos SINAPI sÍo numéricos, geralmente 5 dígitos
  return /^\d{4,6}$/.test(codigo);
}

/**
 * Obter URL de download da planilha SINAPI
 */
export function getURLPlanilhaSINAPI(
  estado: EstadoBrasil,
  mesAno: string, // formato YYYY-MM
  tipo: 'insumos' | 'composicoes',
  desoneracao: TipoDesoneracao = 'nao_desonerado'
): string {
  // URL base da Caixa para download
  // Nota: URLs podem mudar, verificar periodicamente
  const base = 'https://www.caixa.gov.br/Downloads/sinapi';
  const [ano, mes] = mesAno.split('-');
  const desonerado = desoneracao === 'desonerado' ? '_desonerado' : '';
  const tipoArquivo = tipo === 'insumos' ? 'insumos' : 'composicoes_analiticas';

  return `${base}/SINAPI_ref_${tipoArquivo}_${estado}_${mes}${ano}${desonerado}.xlsx`;
}


