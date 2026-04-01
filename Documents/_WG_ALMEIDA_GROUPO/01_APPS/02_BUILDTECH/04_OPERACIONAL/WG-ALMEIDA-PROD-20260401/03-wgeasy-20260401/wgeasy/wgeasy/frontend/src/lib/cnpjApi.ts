// ============================================================
// API DE CONSULTA DE CNPJ
// Consulta dados de empresas via CNPJ usando BrasilAPI
// ============================================================

export interface DadosEmpresaCNPJ {
  cnpj: string;
  razao_social: string;
  nome_fantasia: string;
  porte: string;
  natureza_juridica: string;
  capital_social: number;
  abertura: string;
  situacao: string;
  tipo: string;
  email?: string;
  telefone?: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  municipio: string;
  uf: string;
  cep: string;
  cnae_fiscal: string;
  cnae_fiscal_descricao: string;
}

/**
 * Busca dados de uma empresa pelo CNPJ usando a BrasilAPI
 * DocumentaçÍo: https://brasilapi.com.br/docs#tag/CNPJ
 */
export async function buscarEmpresaPorCNPJ(cnpj: string): Promise<DadosEmpresaCNPJ> {
  try {
    // Remover formataçÍo do CNPJ (manter apenas números)
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

    // Validar se tem 14 dígitos
    if (cnpjLimpo.length !== 14) {
      throw new Error('CNPJ inválido. Deve conter 14 dígitos.');
    }

    // Fazer requisiçÍo para a BrasilAPI
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('CNPJ não encontrado na base de dados da Receita Federal.');
      }
      throw new Error('Erro ao consultar CNPJ. Tente novamente mais tarde.');
    }

    const dados = await response.json();

    return {
      cnpj: formatarCNPJ(dados.cnpj),
      razao_social: dados.razao_social || dados.nome_fantasia || 'não informado',
      nome_fantasia: dados.nome_fantasia || dados.razao_social || '',
      porte: dados.porte || 'não informado',
      natureza_juridica: dados.natureza_juridica || '',
      capital_social: dados.capital_social || 0,
      abertura: dados.data_inicio_atividade || dados.abertura || '',
      situacao: dados.situacao_cadastral || dados.situacao || '',
      tipo: dados.tipo || '',
      email: dados.email || dados.ddd_telefone_1 || '',
      telefone: dados.ddd_telefone_1 || dados.telefone || '',
      logradouro: dados.logradouro || dados.descricao_tipo_de_logradouro + ' ' + dados.logradouro || '',
      numero: dados.numero || '',
      complemento: dados.complemento || '',
      bairro: dados.bairro || '',
      municipio: dados.municipio || '',
      uf: dados.uf || '',
      cep: dados.cep || '',
      cnae_fiscal: dados.cnae_fiscal_principal?.codigo || dados.cnae_fiscal || '',
      cnae_fiscal_descricao: dados.cnae_fiscal_principal?.descricao || dados.cnae_fiscal_descricao || '',
    };
  } catch (error: unknown) {
    console.error('Erro ao buscar CNPJ:', error);
    throw error;
  }
}

/**
 * Formata o CNPJ para o padrÍo XX.XXX.XXX/XXXX-XX
 */
export function formatarCNPJ(cnpj: string): string {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

  if (cnpjLimpo.length !== 14) {
    return cnpj;
  }

  return cnpjLimpo.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    '$1.$2.$3/$4-$5'
  );
}

/**
 * Valida se um CNPJ é válido (verifica dígitos verificadores)
 */
export function validarCNPJ(cnpj: string): boolean {
  const cnpjLimpo = cnpj.replace(/[^\d]/g, '');

  if (cnpjLimpo.length !== 14) return false;

  // Elimina CNPJs inválidos conhecidos
  const cnpjsInvalidos = [
    '00000000000000',
    '11111111111111',
    '22222222222222',
    '33333333333333',
    '44444444444444',
    '55555555555555',
    '66666666666666',
    '77777777777777',
    '88888888888888',
    '99999999999999'
  ];

  if (cnpjsInvalidos.includes(cnpjLimpo)) return false;

  // ValidaçÍo dos dígitos verificadores
  let tamanho = cnpjLimpo.length - 2;
  let numeros = cnpjLimpo.substring(0, tamanho);
  const digitos = cnpjLimpo.substring(tamanho);
  let soma = 0;
  let pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(0))) return false;

  tamanho = tamanho + 1;
  numeros = cnpjLimpo.substring(0, tamanho);
  soma = 0;
  pos = tamanho - 7;

  for (let i = tamanho; i >= 1; i--) {
    soma += parseInt(numeros.charAt(tamanho - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
  if (resultado !== parseInt(digitos.charAt(1))) return false;

  return true;
}


