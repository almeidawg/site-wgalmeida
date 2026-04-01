// ============================================================
// SINAPI - SCRIPT DE IMPORTAÍ‡ÍƒO AUTOMÍTICA
// Processa planilhas SINAPI e importa para o banco de dados
// ============================================================

import { supabase } from '@/lib/supabaseClient';
const loadXLSX = () => import('xlsx');

// Tipos para dados SINAPI
export interface SinapiInsumo {
  codigo: string;
  descricao: string;
  unidade: string;
  preco_mediano: number;
  preco_desonerado?: number;
  origem: string;
  estado: string;
  competencia: string;
}

export interface SinapiComposicao {
  codigo: string;
  descricao: string;
  unidade: string;
  custo_total: number;
  custo_desonerado?: number;
  mao_de_obra: number;
  material: number;
  equipamento: number;
  origem: string;
  estado: string;
  competencia: string;
}

export interface ImportacaoResult {
  sucesso: boolean;
  insumosImportados: number;
  composicoesImportadas: number;
  erros: string[];
  avisos: string[];
  tempoProcessamento: number;
}

// Estados brasileiros com códigos IBGE
export const ESTADOS_BRASIL = {
  'AC': { nome: 'Acre', ibge: '12' },
  'AL': { nome: 'Alagoas', ibge: '27' },
  'AM': { nome: 'Amazonas', ibge: '13' },
  'AP': { nome: 'Amapá', ibge: '16' },
  'BA': { nome: 'Bahia', ibge: '29' },
  'CE': { nome: 'Ceará', ibge: '23' },
  'DF': { nome: 'Distrito Federal', ibge: '53' },
  'ES': { nome: 'Espírito Santo', ibge: '32' },
  'GO': { nome: 'Goiás', ibge: '52' },
  'MA': { nome: 'MaranhÍo', ibge: '21' },
  'MG': { nome: 'Minas Gerais', ibge: '31' },
  'MS': { nome: 'Mato Grosso do Sul', ibge: '50' },
  'MT': { nome: 'Mato Grosso', ibge: '51' },
  'PA': { nome: 'Pará', ibge: '15' },
  'PB': { nome: 'Paraíba', ibge: '25' },
  'PE': { nome: 'Pernambuco', ibge: '26' },
  'PI': { nome: 'Piauí', ibge: '22' },
  'PR': { nome: 'Paraná', ibge: '41' },
  'RJ': { nome: 'Rio de Janeiro', ibge: '33' },
  'RN': { nome: 'Rio Grande do Norte', ibge: '24' },
  'RO': { nome: 'Rondônia', ibge: '11' },
  'RR': { nome: 'Roraima', ibge: '14' },
  'RS': { nome: 'Rio Grande do Sul', ibge: '43' },
  'SC': { nome: 'Santa Catarina', ibge: '42' },
  'SE': { nome: 'Sergipe', ibge: '28' },
  'SP': { nome: 'SÍo Paulo', ibge: '35' },
  'TO': { nome: 'Tocantins', ibge: '17' },
};

// Mapeamento de colunas típicas das planilhas SINAPI
const COLUNAS_INSUMOS = {
  codigo: ['CODIGO', 'COD', 'CÍ“DIGO', 'CÍ“D', 'CODIGO SINAPI', 'CÍ“DIGO SINAPI'],
  descricao: ['DESCRICAO', 'DESCRIÍ‡ÍƒO', 'DESCRIÍ‡ÍƒO DO INSUMO', 'DESCRICAO DO INSUMO'],
  unidade: ['UNIDADE', 'UN', 'UND', 'UNID'],
  preco: ['PRECO', 'PREÍ‡O', 'PRECO MEDIANO', 'PREÍ‡O MEDIANO', 'VALOR', 'CUSTO'],
  precoDesonerado: ['PRECO DESONERADO', 'PREÍ‡O DESONERADO', 'DESONERADO'],
};

const COLUNAS_COMPOSICOES = {
  codigo: ['CODIGO', 'COD', 'CÍ“DIGO', 'CÍ“D', 'CODIGO SINAPI', 'CÍ“DIGO SINAPI'],
  descricao: ['DESCRICAO', 'DESCRIÍ‡ÍƒO', 'DESCRIÍ‡ÍƒO DA COMPOSIÍ‡ÍƒO', 'DESCRICAO DA COMPOSICAO'],
  unidade: ['UNIDADE', 'UN', 'UND', 'UNID'],
  custoTotal: ['CUSTO TOTAL', 'CUSTO', 'VALOR TOTAL', 'PRECO', 'PREÍ‡O'],
  maoDeObra: ['MAO DE OBRA', 'MÍƒO DE OBRA', 'M.O.', 'MO'],
  material: ['MATERIAL', 'MAT', 'MATERIAIS'],
  equipamento: ['EQUIPAMENTO', 'EQUIP', 'EQ', 'EQUIPAMENTOS'],
};

// Classe principal de importaçÍo
export class SinapiImporter {
  private erros: string[] = [];
  private avisos: string[] = [];
  private empresaId: string;
  private estado: string;
  private mesReferencia: string;
  private desonerado: boolean;

  constructor(empresaId: string, estado: string, mesReferencia: string, desonerado: boolean = false) {
    this.empresaId = empresaId;
    this.estado = estado;
    this.mesReferencia = mesReferencia;
    this.desonerado = desonerado;
  }

  // Importar arquivo Excel
  async importarExcel(file: File): Promise<ImportacaoResult> {
    const inicio = Date.now();
    this.erros = [];
    this.avisos = [];

    try {
      const XLSX = await loadXLSX();
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });

      let insumosImportados = 0;
      let composicoesImportadas = 0;

      // Processar cada aba da planilha
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const dados = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];

        if (dados.length < 2) continue;

        // Detectar tipo de dados (insumos ou composiçÍµes)
        const headers = (dados[0] as string[]).map(h => String(h || '').toUpperCase().trim());
        const tipoDetectado = this.detectarTipoAba(headers, sheetName);

        if (tipoDetectado === 'insumos') {
          const resultado = await this.processarInsumos(dados, headers);
          insumosImportados += resultado;
        } else if (tipoDetectado === 'composicoes') {
          const resultado = await this.processarComposicoes(dados, headers);
          composicoesImportadas += resultado;
        } else {
          this.avisos.push(`Aba "${sheetName}" não reconhecida como insumos ou composiçÍµes`);
        }
      }

      // Registrar importaçÍo no histórico
      await this.registrarHistorico(insumosImportados, composicoesImportadas, file.name);

      return {
        sucesso: this.erros.length === 0,
        insumosImportados,
        composicoesImportadas,
        erros: this.erros,
        avisos: this.avisos,
        tempoProcessamento: Date.now() - inicio,
      };
    } catch (error) {
      this.erros.push(`Erro ao processar arquivo: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      return {
        sucesso: false,
        insumosImportados: 0,
        composicoesImportadas: 0,
        erros: this.erros,
        avisos: this.avisos,
        tempoProcessamento: Date.now() - inicio,
      };
    }
  }

  // Detectar tipo de aba baseado nos headers
  private detectarTipoAba(headers: string[], sheetName: string): 'insumos' | 'composicoes' | 'desconhecido' {
    const nomeAba = sheetName.toUpperCase();

    // Verificar pelo nome da aba
    if (nomeAba.includes('INSUMO') || nomeAba.includes('INSUM')) {
      return 'insumos';
    }
    if (nomeAba.includes('COMPOS') || nomeAba.includes('SERV')) {
      return 'composicoes';
    }

    // Verificar pelos headers
    const temMaoDeObra = headers.some(h =>
      COLUNAS_COMPOSICOES.maoDeObra.some(col => h.includes(col))
    );
    const temMaterial = headers.some(h =>
      COLUNAS_COMPOSICOES.material.some(col => h.includes(col))
    );

    if (temMaoDeObra && temMaterial) {
      return 'composicoes';
    }

    // Assumir insumos se tiver código e preço
    const temCodigo = headers.some(h =>
      COLUNAS_INSUMOS.codigo.some(col => h.includes(col))
    );
    const temPreco = headers.some(h =>
      COLUNAS_INSUMOS.preco.some(col => h.includes(col))
    );

    if (temCodigo && temPreco) {
      return 'insumos';
    }

    return 'desconhecido';
  }

  // Encontrar índice de coluna
  private encontrarColuna(headers: string[], possiveisNomes: string[]): number {
    for (const nome of possiveisNomes) {
      const index = headers.findIndex(h => h.includes(nome));
      if (index !== -1) return index;
    }
    return -1;
  }

  // Processar insumos
  private async processarInsumos(dados: unknown[][], headers: string[]): Promise<number> {
    const colCodigo = this.encontrarColuna(headers, COLUNAS_INSUMOS.codigo);
    const colDescricao = this.encontrarColuna(headers, COLUNAS_INSUMOS.descricao);
    const colUnidade = this.encontrarColuna(headers, COLUNAS_INSUMOS.unidade);
    const colPreco = this.encontrarColuna(headers, COLUNAS_INSUMOS.preco);
    const colPrecoDesonerado = this.encontrarColuna(headers, COLUNAS_INSUMOS.precoDesonerado);

    if (colCodigo === -1 || colDescricao === -1) {
      this.erros.push('Colunas obrigatórias (código, descriçÍo) não encontradas para insumos');
      return 0;
    }

    const insumos: SinapiInsumo[] = [];

    // Processar linhas (pular header)
    for (let i = 1; i < dados.length; i++) {
      const row = dados[i] as (string | number | undefined)[];
      if (!row || !row[colCodigo]) continue;

      const codigo = String(row[colCodigo]).trim();
      if (!codigo || codigo.length < 2) continue;

      const preco = this.parseNumero(row[colPreco]);
      if (preco === 0) {
        this.avisos.push(`Insumo ${codigo}: preço zerado ou inválido`);
        continue;
      }

      insumos.push({
        codigo,
        descricao: String(row[colDescricao] || '').trim(),
        unidade: colUnidade !== -1 ? String(row[colUnidade] || 'UN').trim() : 'UN',
        preco_mediano: preco,
        preco_desonerado: colPrecoDesonerado !== -1 ? this.parseNumero(row[colPrecoDesonerado]) : undefined,
        origem: 'SINAPI',
        estado: this.estado,
        competencia: this.mesReferencia,
      });

      // Processar em lotes de 500
      if (insumos.length >= 500) {
        await this.salvarInsumos(insumos);
        insumos.length = 0;
      }
    }

    // Salvar restantes
    if (insumos.length > 0) {
      await this.salvarInsumos(insumos);
    }

    return dados.length - 1;
  }

  // Processar composiçÍµes
  private async processarComposicoes(dados: unknown[][], headers: string[]): Promise<number> {
    const colCodigo = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.codigo);
    const colDescricao = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.descricao);
    const colUnidade = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.unidade);
    const colCustoTotal = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.custoTotal);
    const colMaoDeObra = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.maoDeObra);
    const colMaterial = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.material);
    const colEquipamento = this.encontrarColuna(headers, COLUNAS_COMPOSICOES.equipamento);

    if (colCodigo === -1 || colDescricao === -1) {
      this.erros.push('Colunas obrigatórias (código, descriçÍo) não encontradas para composiçÍµes');
      return 0;
    }

    const composicoes: SinapiComposicao[] = [];

    // Processar linhas (pular header)
    for (let i = 1; i < dados.length; i++) {
      const row = dados[i] as (string | number | undefined)[];
      if (!row || !row[colCodigo]) continue;

      const codigo = String(row[colCodigo]).trim();
      if (!codigo || codigo.length < 2) continue;

      const custoTotal = colCustoTotal !== -1 ? this.parseNumero(row[colCustoTotal]) : 0;
      const maoDeObra = colMaoDeObra !== -1 ? this.parseNumero(row[colMaoDeObra]) : 0;
      const material = colMaterial !== -1 ? this.parseNumero(row[colMaterial]) : 0;
      const equipamento = colEquipamento !== -1 ? this.parseNumero(row[colEquipamento]) : 0;

      // Calcular custo total se não fornecido
      const custoCalculado = custoTotal || (maoDeObra + material + equipamento);

      if (custoCalculado === 0) {
        this.avisos.push(`ComposiçÍo ${codigo}: custo zerado ou inválido`);
        continue;
      }

      composicoes.push({
        codigo,
        descricao: String(row[colDescricao] || '').trim(),
        unidade: colUnidade !== -1 ? String(row[colUnidade] || 'UN').trim() : 'UN',
        custo_total: custoCalculado,
        mao_de_obra: maoDeObra,
        material,
        equipamento,
        origem: 'SINAPI',
        estado: this.estado,
        competencia: this.mesReferencia,
      });

      // Processar em lotes de 500
      if (composicoes.length >= 500) {
        await this.salvarComposicoes(composicoes);
        composicoes.length = 0;
      }
    }

    // Salvar restantes
    if (composicoes.length > 0) {
      await this.salvarComposicoes(composicoes);
    }

    return dados.length - 1;
  }

  // Parse número com tratamento de formatos brasileiros
  private parseNumero(valor: string | number | undefined): number {
    if (valor === undefined || valor === null || valor === '') return 0;
    if (typeof valor === 'number') return valor;

    // Remover espaços e caracteres não numéricos (exceto vírgula e ponto)
    let str = String(valor).trim();

    // Detectar formato brasileiro (1.234,56) vs americano (1,234.56)
    const temVirgula = str.includes(',');
    const temPonto = str.includes('.');

    if (temVirgula && temPonto) {
      // Formato brasileiro: 1.234,56
      if (str.lastIndexOf(',') > str.lastIndexOf('.')) {
        str = str.replace(/\./g, '').replace(',', '.');
      } else {
        // Formato americano: 1,234.56
        str = str.replace(/,/g, '');
      }
    } else if (temVirgula) {
      // Pode ser decimal brasileiro
      str = str.replace(',', '.');
    }

    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  }

  // Salvar insumos no banco
  private async salvarInsumos(insumos: SinapiInsumo[]): Promise<void> {
    try {
      const dadosParaSalvar = insumos.map(insumo => ({
        empresa_id: this.empresaId,
        codigo: insumo.codigo,
        descricao: insumo.descricao,
        unidade: insumo.unidade,
        preco_mediano: insumo.preco_mediano,
        preco_desonerado: insumo.preco_desonerado,
        origem: insumo.origem,
        estado: insumo.estado,
        mes_referencia: insumo.mes_referencia,
        ativo: true,
      }));

      const { error } = await supabase
        .from('sinapi_insumos')
        .upsert(dadosParaSalvar, {
          onConflict: 'empresa_id,codigo,estado,competencia',
        });

      if (error) {
        this.erros.push(`Erro ao salvar insumos: ${error.message}`);
      }
    } catch (error) {
      this.erros.push(`Erro ao salvar insumos: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Salvar composiçÍµes no banco
  private async salvarComposicoes(composicoes: SinapiComposicao[]): Promise<void> {
    try {
      const dadosParaSalvar = composicoes.map(comp => ({
        empresa_id: this.empresaId,
        codigo: comp.codigo,
        descricao: comp.descricao,
        unidade: comp.unidade,
        custo_total: comp.custo_total,
        custo_desonerado: comp.custo_desonerado,
        mao_de_obra: comp.mao_de_obra,
        material: comp.material,
        equipamento: comp.equipamento,
        origem: comp.origem,
        estado: comp.estado,
        mes_referencia: comp.mes_referencia,
        ativo: true,
      }));

      const { error } = await supabase
        .from('sinapi_composicoes')
        .upsert(dadosParaSalvar, {
          onConflict: 'empresa_id,codigo,estado,competencia',
        });

      if (error) {
        this.erros.push(`Erro ao salvar composiçÍµes: ${error.message}`);
      }
    } catch (error) {
      this.erros.push(`Erro ao salvar composiçÍµes: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }

  // Registrar no histórico de importaçÍµes
  private async registrarHistorico(
    insumosImportados: number,
    composicoesImportadas: number,
    nomeArquivo: string
  ): Promise<void> {
    try {
      await supabase.from('sinapi_historico_importacoes').insert({
        empresa_id: this.empresaId,
        estado: this.estado,
        competencia: this.mesReferencia,
        tipo_tabela: this.desonerado ? 'desonerado' : 'nao_desonerado',
        arquivo_origem: nomeArquivo,
        total_insumos: insumosImportados,
        total_composicoes: composicoesImportadas,
        status: this.erros.length === 0 ? 'sucesso' : 'parcial',
        observacoes: this.erros.length > 0 ? this.erros.join('; ') : null,
      });
    } catch (error) {
      console.error('Erro ao registrar histórico:', error);
    }
  }
}

// FunçÍo utilitária para download do template SINAPI
export async function gerarTemplateExcel(): Promise<Blob> {
  const XLSX = await loadXLSX();
  const wb = XLSX.utils.book_new();

  // Aba de insumos
  const insumosData = [
    ['CÍ“DIGO', 'DESCRIÍ‡ÍƒO', 'UNIDADE', 'PREÍ‡O MEDIANO', 'PREÍ‡O DESONERADO'],
    ['00000001', 'EXEMPLO DE INSUMO', 'UN', 100.00, 95.00],
  ];
  const wsInsumos = XLSX.utils.aoa_to_sheet(insumosData);
  XLSX.utils.book_append_sheet(wb, wsInsumos, 'Insumos');

  // Aba de composiçÍµes
  const composicoesData = [
    ['CÍ“DIGO', 'DESCRIÍ‡ÍƒO', 'UNIDADE', 'CUSTO TOTAL', 'MÍƒO DE OBRA', 'MATERIAL', 'EQUIPAMENTO'],
    ['00000001', 'EXEMPLO DE COMPOSIÍ‡ÍƒO', 'M2', 150.00, 80.00, 50.00, 20.00],
  ];
  const wsComposicoes = XLSX.utils.aoa_to_sheet(composicoesData);
  XLSX.utils.book_append_sheet(wb, wsComposicoes, 'ComposiçÍµes');

  // Gerar arquivo
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

// Buscar insumos SINAPI
export async function buscarInsumosSINAPI(
  empresaId: string,
  busca: string,
  estado?: string,
  limite: number = 50
): Promise<SinapiInsumo[]> {
  let query = supabase
    .from('sinapi_insumos')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .limit(limite);

  if (busca) {
    query = query.or(`codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  if (estado) {
    query = query.eq('estado', estado);
  }

  // Ordenar pelo mais recente
  query = query.order('mes_referencia', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar insumos SINAPI:', error);
    return [];
  }

  return data || [];
}

// Buscar composiçÍµes SINAPI
export async function buscarComposicoesSINAPI(
  empresaId: string,
  busca: string,
  estado?: string,
  limite: number = 50
): Promise<SinapiComposicao[]> {
  let query = supabase
    .from('sinapi_composicoes')
    .select('*')
    .eq('empresa_id', empresaId)
    .eq('ativo', true)
    .limit(limite);

  if (busca) {
    query = query.or(`codigo.ilike.%${busca}%,descricao.ilike.%${busca}%`);
  }

  if (estado) {
    query = query.eq('estado', estado);
  }

  // Ordenar pelo mais recente
  query = query.order('mes_referencia', { ascending: false });

  const { data, error } = await query;

  if (error) {
    console.error('Erro ao buscar composiçÍµes SINAPI:', error);
    return [];
  }

  return data || [];
}

// Obter histórico de importaçÍµes
export async function obterHistoricoImportacoes(empresaId: string): Promise<{
  id: string;
  estado: string;
  competencia: string;
  tipo_tabela: string;
  arquivo_origem: string;
  total_insumos: number;
  total_composicoes: number;
  status: string;
  created_at: string;
}[]> {
  const { data, error } = await supabase
    .from('sinapi_historico_importacoes')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Erro ao obter histórico:', error);
    return [];
  }

  return data || [];
}

export default SinapiImporter;


