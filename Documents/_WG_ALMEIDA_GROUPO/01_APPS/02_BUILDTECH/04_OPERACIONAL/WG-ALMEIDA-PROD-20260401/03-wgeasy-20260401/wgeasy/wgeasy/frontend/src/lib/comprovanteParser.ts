// ============================================================
// PARSER: Extrator de Dados de Comprovantes Bancários
// Sistema WG Easy - Grupo WG Almeida
// Suporta: PIX, TED, DOC, Boleto
// SEM IA - Apenas regex e parsing de texto
// ============================================================

export interface DadosComprovante {
  tipo: 'PIX' | 'TED' | 'DOC' | 'BOLETO' | 'TRANSFERENCIA' | 'DESCONHECIDO';
  valor: number;
  valorFormatado: string;
  data: Date | null;
  dataFormatada: string;
  hora: string;

  // Recebedor
  recebedorNome: string;
  recebedorDocumento: string; // CPF ou CNPJ
  recebedorTipoDocumento: 'CPF' | 'CNPJ' | '';
  recebedorBanco: string;
  recebedorAgencia: string;
  recebedorConta: string;
  recebedorChavePix: string;

  // Pagador
  pagadorNome: string;
  pagadorDocumento: string;
  pagadorTipoDocumento: 'CPF' | 'CNPJ' | '';
  pagadorBanco: string;
  pagadorAgencia: string;
  pagadorConta: string;

  // Identificadores
  idTransacao: string;
  codigoAutenticacao: string;

  // Metadados
  textoOriginal: string;
  confianca: number; // 0-100 - quÍo confiável é o parsing
  camposEncontrados: string[];
  camposNaoEncontrados: string[];
}

// ============================================================
// FUNCAO PRINCIPAL
// ============================================================

export function parseComprovante(texto: string): DadosComprovante {
  const resultado: DadosComprovante = {
    tipo: 'DESCONHECIDO',
    valor: 0,
    valorFormatado: '',
    data: null,
    dataFormatada: '',
    hora: '',
    recebedorNome: '',
    recebedorDocumento: '',
    recebedorTipoDocumento: '',
    recebedorBanco: '',
    recebedorAgencia: '',
    recebedorConta: '',
    recebedorChavePix: '',
    pagadorNome: '',
    pagadorDocumento: '',
    pagadorTipoDocumento: '',
    pagadorBanco: '',
    pagadorAgencia: '',
    pagadorConta: '',
    idTransacao: '',
    codigoAutenticacao: '',
    textoOriginal: texto,
    confianca: 0,
    camposEncontrados: [],
    camposNaoEncontrados: [],
  };

  if (!texto || texto.trim().length === 0) {
    return resultado;
  }

  // Normalizar texto
  const textoNormalizado = texto
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim();

  // Detectar tipo de comprovante
  resultado.tipo = detectarTipo(textoNormalizado);

  // Extrair valor
  const valor = extrairValor(textoNormalizado);
  if (valor) {
    resultado.valor = valor.numero;
    resultado.valorFormatado = valor.formatado;
    resultado.camposEncontrados.push('valor');
  } else {
    resultado.camposNaoEncontrados.push('valor');
  }

  // Extrair data e hora
  const dataHora = extrairDataHora(textoNormalizado);
  if (dataHora) {
    resultado.data = dataHora.data;
    resultado.dataFormatada = dataHora.dataFormatada;
    resultado.hora = dataHora.hora;
    resultado.camposEncontrados.push('data');
  } else {
    resultado.camposNaoEncontrados.push('data');
  }

  // Extrair dados do recebedor
  const recebedor = extrairRecebedor(textoNormalizado);
  if (recebedor.nome) {
    resultado.recebedorNome = recebedor.nome;
    resultado.camposEncontrados.push('recebedorNome');
  }
  if (recebedor.documento) {
    resultado.recebedorDocumento = recebedor.documento;
    resultado.recebedorTipoDocumento = recebedor.tipoDocumento;
    resultado.camposEncontrados.push('recebedorDocumento');
  }
  if (recebedor.banco) {
    resultado.recebedorBanco = recebedor.banco;
    resultado.camposEncontrados.push('recebedorBanco');
  }
  if (recebedor.chavePix) {
    resultado.recebedorChavePix = recebedor.chavePix;
    resultado.camposEncontrados.push('recebedorChavePix');
  }

  // Extrair dados do pagador
  const pagador = extrairPagador(textoNormalizado);
  if (pagador.nome) {
    resultado.pagadorNome = pagador.nome;
    resultado.camposEncontrados.push('pagadorNome');
  }
  if (pagador.documento) {
    resultado.pagadorDocumento = pagador.documento;
    resultado.pagadorTipoDocumento = pagador.tipoDocumento;
    resultado.camposEncontrados.push('pagadorDocumento');
  }
  if (pagador.banco) {
    resultado.pagadorBanco = pagador.banco;
    resultado.camposEncontrados.push('pagadorBanco');
  }

  // Extrair ID da transaçÍo
  const idTransacao = extrairIdTransacao(textoNormalizado);
  if (idTransacao) {
    resultado.idTransacao = idTransacao;
    resultado.camposEncontrados.push('idTransacao');
  }

  // Extrair agência e conta (formato geral)
  const agConta = extrairAgenciaConta(textoNormalizado);
  if (agConta) {
    if (!resultado.pagadorAgencia) resultado.pagadorAgencia = agConta.agencia;
    if (!resultado.pagadorConta) resultado.pagadorConta = agConta.conta;
  }

  // Calcular confiança
  const camposPrincipais = ['valor', 'data', 'recebedorNome'];
  const encontrados = camposPrincipais.filter(c => resultado.camposEncontrados.includes(c));
  resultado.confianca = Math.round((encontrados.length / camposPrincipais.length) * 100);

  return resultado;
}

// ============================================================
// FUNCOES AUXILIARES
// ============================================================

function detectarTipo(texto: string): DadosComprovante['tipo'] {
  const textoLower = texto.toLowerCase();

  if (textoLower.includes('pix') || textoLower.includes('chave')) {
    return 'PIX';
  }
  if (textoLower.includes('ted')) {
    return 'TED';
  }
  if (textoLower.includes('doc')) {
    return 'DOC';
  }
  if (textoLower.includes('boleto') || textoLower.includes('código de barras')) {
    return 'BOLETO';
  }
  if (textoLower.includes('transferência') || textoLower.includes('transferencia')) {
    return 'TRANSFERENCIA';
  }

  return 'DESCONHECIDO';
}

function extrairValor(texto: string): { numero: number; formatado: string } | null {
  // Padrões comuns de valor
  const padroes = [
    // R$ 3.500,00 ou R$3.500,00
    /R\$\s*([\d.,]+)/i,
    // Valor: 3.500,00 ou Valor pago: 3.500,00
    /valor(?:\s+pago)?[:\s]*([\d.,]+)/i,
    // 3.500,00 (número isolado grande)
    /(\d{1,3}(?:\.\d{3})*,\d{2})/,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      const valorStr = match[1].trim();
      // Converter formato brasileiro para número
      const numero = parseFloat(
        valorStr
          .replace(/\./g, '')  // Remove pontos de milhar
          .replace(',', '.')   // Troca vírgula por ponto
      );

      if (!isNaN(numero) && numero > 0) {
        return {
          numero,
          formatado: `R$ ${valorStr}`,
        };
      }
    }
  }

  return null;
}

function extrairDataHora(texto: string): { data: Date; dataFormatada: string; hora: string } | null {
  // Padrões de data/hora
  const padroes = [
    // 09/01/2026 - 16:43:08 ou 09/01/2026 16:43:08
    /(\d{2}\/\d{2}\/\d{4})\s*[-–]?\s*(\d{2}:\d{2}(?::\d{2})?)/,
    // 2026-01-09 16:43:08
    /(\d{4}-\d{2}-\d{2})\s*[-–]?\s*(\d{2}:\d{2}(?::\d{2})?)/,
    // Data e hora da transaçÍo\n09/01/2026 - 16:43:08
    /data\s*(?:e\s*hora)?[^\n]*\n\s*(\d{2}\/\d{2}\/\d{4})\s*[-–]?\s*(\d{2}:\d{2}(?::\d{2})?)/i,
    // Apenas data: 09/01/2026
    /(\d{2}\/\d{2}\/\d{4})/,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match) {
      let dataStr = match[1];
      const horaStr = match[2] || '00:00:00';

      // Converter para Date
      let data: Date;
      if (dataStr.includes('/')) {
        // Formato DD/MM/YYYY
        const [dia, mes, ano] = dataStr.split('/').map(Number);
        data = new Date(ano, mes - 1, dia);
      } else {
        // Formato YYYY-MM-DD
        data = new Date(dataStr);
      }

      if (!isNaN(data.getTime())) {
        return {
          data,
          dataFormatada: dataStr,
          hora: horaStr,
        };
      }
    }
  }

  return null;
}

function extrairRecebedor(texto: string): {
  nome: string;
  documento: string;
  tipoDocumento: 'CPF' | 'CNPJ' | '';
  banco: string;
  chavePix: string;
} {
  const resultado = {
    nome: '',
    documento: '',
    tipoDocumento: '' as 'CPF' | 'CNPJ' | '',
    banco: '',
    chavePix: '',
  };

  // Dividir em linhas para análise
  const linhas = texto.split('\n').map(l => l.trim());

  // Encontrar seçÍo do recebedor
  let emSecaoRecebedor = false;
  let proximoEhNome = false;
  let proximoEhCnpj = false;
  let proximoEhCpf = false;
  let proximoEhBanco = false;
  let proximoEhChave = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaLower = linha.toLowerCase();

    // Detectar seçÍo do recebedor
    if (linhaLower.includes('recebedor') || linhaLower.includes('favorecido') || linhaLower.includes('destinatário')) {
      emSecaoRecebedor = true;
      continue;
    }

    // Detectar seçÍo do pagador (sai da seçÍo recebedor)
    if (linhaLower.includes('pagador') || linhaLower.includes('origem')) {
      emSecaoRecebedor = false;
      continue;
    }

    // Labels que indicam o próximo valor
    if (linhaLower === 'para' || linhaLower === 'nome' || linhaLower === 'favorecido') {
      proximoEhNome = true;
      continue;
    }
    if (linhaLower === 'cnpj') {
      proximoEhCnpj = true;
      continue;
    }
    if (linhaLower === 'cpf') {
      proximoEhCpf = true;
      continue;
    }
    if (linhaLower === 'instituiçÍo' || linhaLower === 'banco') {
      if (emSecaoRecebedor || !resultado.banco) {
        proximoEhBanco = true;
      }
      continue;
    }
    if (linhaLower === 'chave' || linhaLower === 'chave pix') {
      proximoEhChave = true;
      continue;
    }

    // Capturar valores
    if (proximoEhNome && linha.length > 2) {
      resultado.nome = linha;
      proximoEhNome = false;
      continue;
    }
    if (proximoEhCnpj && linha.length > 2) {
      resultado.documento = linha;
      resultado.tipoDocumento = 'CNPJ';
      proximoEhCnpj = false;
      continue;
    }
    if (proximoEhCpf && linha.length > 2) {
      resultado.documento = linha;
      resultado.tipoDocumento = 'CPF';
      proximoEhCpf = false;
      continue;
    }
    if (proximoEhBanco && linha.length > 2 && emSecaoRecebedor) {
      resultado.banco = linha;
      proximoEhBanco = false;
      continue;
    }
    if (proximoEhChave && linha.length > 2) {
      resultado.chavePix = linha;
      proximoEhChave = false;
      continue;
    }
  }

  return resultado;
}

function extrairPagador(texto: string): {
  nome: string;
  documento: string;
  tipoDocumento: 'CPF' | 'CNPJ' | '';
  banco: string;
} {
  const resultado = {
    nome: '',
    documento: '',
    tipoDocumento: '' as 'CPF' | 'CNPJ' | '',
    banco: '',
  };

  const linhas = texto.split('\n').map(l => l.trim());

  let emSecaoPagador = false;
  let proximoEhNome = false;
  let proximoEhCnpj = false;
  let proximoEhCpf = false;
  let proximoEhBanco = false;

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const linhaLower = linha.toLowerCase();

    // Detectar seçÍo do pagador
    if (linhaLower.includes('pagador') || linhaLower.includes('origem') || linhaLower.includes('dados do pagador')) {
      emSecaoPagador = true;
      continue;
    }

    // Labels
    if (emSecaoPagador) {
      if (linhaLower === 'de' || linhaLower === 'nome' || linhaLower === 'pagador') {
        proximoEhNome = true;
        continue;
      }
      if (linhaLower === 'cnpj') {
        proximoEhCnpj = true;
        continue;
      }
      if (linhaLower === 'cpf') {
        proximoEhCpf = true;
        continue;
      }
      if (linhaLower === 'instituiçÍo' || linhaLower === 'banco') {
        proximoEhBanco = true;
        continue;
      }

      // Capturar valores
      if (proximoEhNome && linha.length > 2) {
        resultado.nome = linha;
        proximoEhNome = false;
        continue;
      }
      if (proximoEhCnpj && linha.length > 2) {
        resultado.documento = linha;
        resultado.tipoDocumento = 'CNPJ';
        proximoEhCnpj = false;
        continue;
      }
      if (proximoEhCpf && linha.length > 2) {
        resultado.documento = linha;
        resultado.tipoDocumento = 'CPF';
        proximoEhCpf = false;
        continue;
      }
      if (proximoEhBanco && linha.length > 2) {
        resultado.banco = linha;
        proximoEhBanco = false;
        continue;
      }
    }
  }

  return resultado;
}

function extrairIdTransacao(texto: string): string | null {
  // Padrões de ID de transaçÍo
  const padroes = [
    // PIX: E + números
    /(?:ID|TransaçÍo|ID\/TransaçÍo)[:\s]*\n?\s*(E\d{20,})/i,
    /\b(E\d{20,})\b/,
    // TED/DOC: números longos
    /(?:autenticaçÍo|comprovante|protocolo)[:\s]*\n?\s*(\d{15,})/i,
  ];

  for (const padrao of padroes) {
    const match = texto.match(padrao);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function extrairAgenciaConta(texto: string): { agencia: string; conta: string } | null {
  // Ag 0112 Cc 1066401-8 ou Ag: 0112 Conta: 1066401-8
  const padrao = /ag[:\s]*(\d{4})\s*(?:cc|conta|c\/c)?[:\s]*(\d+-?\d*)/i;
  const match = texto.match(padrao);

  if (match) {
    return {
      agencia: match[1],
      conta: match[2],
    };
  }

  return null;
}

// ============================================================
// FUNCAO DE FORMATACAO PARA EXIBICAO
// ============================================================

export function formatarResumoComprovante(dados: DadosComprovante): string {
  const linhas: string[] = [];

  linhas.push(`📄 ${dados.tipo}`);
  if (dados.valorFormatado) linhas.push(`💰 ${dados.valorFormatado}`);
  if (dados.dataFormatada) linhas.push(`📅 ${dados.dataFormatada} ${dados.hora}`);
  if (dados.recebedorNome) linhas.push(`➡️ Para: ${dados.recebedorNome}`);
  if (dados.pagadorNome) linhas.push(`⬅️ De: ${dados.pagadorNome}`);
  if (dados.idTransacao) linhas.push(`🔑 ID: ${dados.idTransacao.substring(0, 20)}...`);

  return linhas.join('\n');
}

// ============================================================
// FUNCAO PARA SUGERIR DESCRICAO DO LANCAMENTO
// ============================================================

export function sugerirDescricaoLancamento(dados: DadosComprovante): string {
  const partes: string[] = [];

  // Tipo
  partes.push(dados.tipo);

  // De quem
  if (dados.pagadorNome) {
    partes.push(`de ${dados.pagadorNome}`);
  }

  // Banco de origem
  if (dados.pagadorBanco) {
    const bancoSimplificado = dados.pagadorBanco
      .replace(/BANCO\s*/i, '')
      .replace(/\s*S\.?A\.?/i, '')
      .replace(/\(BRASIL\)/i, '')
      .trim();
    partes.push(`(${bancoSimplificado})`);
  }

  return partes.join(' ');
}

