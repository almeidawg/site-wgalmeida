/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// ImportaçÍo de Price List via Excel
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { importarItens, gerarCodigoItem } from './pricelistApi';
import type { PricelistItemFormData, TipoPricelist } from '@/types/pricelist';

const loadXLSX = () => import('./xlsxCompat');

/**
 * Interface para linha do Excel
 */
interface LinhaExcel {
  categoria?: string;
  codigo?: string;
  descricao?: string;
  tipo?: string;
  unidade?: string;
  preco?: number | string;
  fornecedor?: string;
  marca?: string;
  estoque_minimo?: number | string;
  estoque_atual?: number | string;
}

/**
 * Ler arquivo Excel e retornar dados
 */
export async function lerArquivoExcel(arquivo: File): Promise<LinhaExcel[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const XLSX = await loadXLSX();
        const data = e.target?.result;
        if (!(data instanceof ArrayBuffer)) {
          reject(new Error('Falha ao ler arquivo Excel'));
          return;
        }
        const workbook = await XLSX.read(data, { type: 'array' });

        // Pegar a primeira planilha
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Converter para JSON
        const json = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        resolve(json as LinhaExcel[]);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(arquivo);
  });
}

/**
 * Processar linha do Excel e converter para PricelistItemFormData
 */
function processarLinhaExcel(linha: LinhaExcel, indice: number): PricelistItemFormData | null {
  // Tipo padrÍo
  let tipo: TipoPricelist = 'material';

  if (linha.tipo) {
    const tipoStr = linha.tipo.toString().toLowerCase().trim();
    if (tipoStr.includes('mao') || tipoStr.includes('mÍo') || tipoStr.includes('obra')) {
      tipo = 'mao_obra';
    }
  }

  // Preço
  const preco = typeof linha.preco === 'number'
    ? linha.preco
    : parseFloat(String(linha.preco || '0').replace(/[^\d.,-]/g, '').replace(',', '.'));

  if (isNaN(preco) || preco < 0) {
    console.warn(`Linha ${indice + 2}: Preço inválido`);
    return null;
  }

  // Unidade padrÍo
  const unidade = linha.unidade?.toString().trim() || 'UN';

  // Código - será gerado se não fornecido
  const codigo = linha.codigo?.toString().trim() || '';

  // DescriçÍo - será gerada se não fornecida
  const descricao = linha.descricao?.toString().trim() || '';

  // Estoque
  const estoque_minimo = linha.estoque_minimo
    ? parseFloat(String(linha.estoque_minimo).replace(',', '.'))
    : undefined;

  const estoque_atual = linha.estoque_atual
    ? parseFloat(String(linha.estoque_atual).replace(',', '.'))
    : undefined;

  const controla_estoque = estoque_minimo !== undefined || estoque_atual !== undefined;

  return {
    codigo: codigo || undefined,
    nome: descricao || "Item sem nome", // nome is required in PricelistItemFormData
    descricao: descricao || undefined,
    tipo,
    unidade,
    preco: preco,
    marca: linha.marca?.toString().trim() || undefined,
    controla_estoque,
    estoque_minimo,
    estoque_atual,
    ativo: true,
  };
}

/**
 * Importar arquivo Excel completo
 */
export async function importarExcelPricelist(arquivo: File): Promise<{
  sucesso: number;
  erros: number;
  total: number;
  mensagens: string[];
}> {
  const mensagens: string[] = [];

  try {
    // Ler arquivo
    mensagens.push('📄 Lendo arquivo Excel...');
    const linhas = await lerArquivoExcel(arquivo);

    if (!linhas || linhas.length === 0) {
      throw new Error('Arquivo Excel vazio ou inválido');
    }

    mensagens.push(`✅ ${linhas.length} linhas encontradas`);

    // Processar linhas
    mensagens.push('🔄 Processando itens...');
    const itensParaImportar: PricelistItemFormData[] = [];

    for (let i = 0; i < linhas.length; i++) {
      const item = processarLinhaExcel(linhas[i], i);
      if (item) {
        itensParaImportar.push(item);
      } else {
        mensagens.push(`⚠️ Linha ${i + 2}: Dados inválidos, pulando...`);
      }
    }

    if (itensParaImportar.length === 0) {
      throw new Error('Nenhum item válido encontrado no arquivo');
    }

    mensagens.push(`✅ ${itensParaImportar.length} itens válidos para importar`);

    // Importar itens (com geraçÍo automática de códigos)
    mensagens.push('💾 Importando para o banco de dados...');
    const resultado = await importarItens(itensParaImportar);

    mensagens.push(`✅ ImportaçÍo concluída!`);
    mensagens.push(`✔️ Sucesso: ${resultado.sucesso} itens`);
    if (resultado.erros > 0) {
      mensagens.push(`❌ Erros: ${resultado.erros} itens`);
    }

    return {
      sucesso: resultado.sucesso,
      erros: resultado.erros,
      total: linhas.length,
      mensagens,
    };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    mensagens.push(`❌ Erro: ${errorMessage}`);
    throw error;
  }
}

/**
 * Validar formato do arquivo Excel antes de importar
 */
export function validarFormatoExcel(linhas: LinhaExcel[]): {
  valido: boolean;
  erros: string[];
} {
  const erros: string[] = [];

  if (!linhas || linhas.length === 0) {
    erros.push('Arquivo vazio');
    return { valido: false, erros };
  }

  // Verificar se tem as colunas essenciais
  const primeiraLinha = linhas[0];
  const colunasEsperadas = ['tipo', 'unidade', 'preco'];
  const colunas = Object.keys(primeiraLinha).map(k => k.toLowerCase());

  for (const coluna of colunasEsperadas) {
    if (!colunas.some(c => c.includes(coluna))) {
      erros.push(`Coluna "${coluna}" não encontrada`);
    }
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

/**
 * Gerar template Excel para download
 */
export async function gerarTemplateExcel(): Promise<Blob> {
  const XLSX = await loadXLSX();
  const dados = [
    {
      codigo: 'MAT-00001',
      descricao: 'Tinta Acrílica Branca 18L',
      tipo: 'material',
      unidade: 'UN',
      preco: 150.00,
      marca: 'Suvinil',
      fornecedor: 'Fornecedor XYZ',
      estoque_minimo: 5,
      estoque_atual: 10,
    },
    {
      codigo: 'MO-00001',
      descricao: 'Pintura de parede',
      tipo: 'mao_obra',
      unidade: 'm²',
      preco: 25.00,
      marca: '',
      fornecedor: '',
      estoque_minimo: '',
      estoque_atual: '',
    },
  ];

  const worksheet = XLSX.utils.json_to_sheet(dados);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Price List');

  const excelBuffer = await XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  return new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}


