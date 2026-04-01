// ============================================================
// CONSTANTES: Bancos Brasileiros
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

export interface Banco {
  codigo: string;
  nome: string;
  nome_completo: string;
}

/**
 * Lista dos principais bancos brasileiros
 * Ordenados por relevância/uso comum
 */
export const BANCOS_BRASILEIROS: Banco[] = [
  // Bancos mais usados
  { codigo: '001', nome: 'Banco do Brasil', nome_completo: 'Banco do Brasil S.A.' },
  { codigo: '104', nome: 'Caixa Econômica', nome_completo: 'Caixa Econômica Federal' },
  { codigo: '237', nome: 'Bradesco', nome_completo: 'Banco Bradesco S.A.' },
  { codigo: '341', nome: 'Itaú', nome_completo: 'Itaú Unibanco S.A.' },
  { codigo: '033', nome: 'Santander', nome_completo: 'Banco Santander Brasil S.A.' },

  // Bancos digitais populares
  { codigo: '260', nome: 'Nubank', nome_completo: 'Nu Pagamentos S.A.' },
  { codigo: '290', nome: 'Pagseguro', nome_completo: 'Pagseguro Internet S.A.' },
  { codigo: '077', nome: 'Banco Inter', nome_completo: 'Banco Inter S.A.' },
  { codigo: '336', nome: 'Banco C6', nome_completo: 'Banco C6 S.A.' },
  { codigo: '323', nome: 'Mercado Pago', nome_completo: 'Mercado Pago' },
  { codigo: '380', nome: 'PicPay', nome_completo: 'PicPay Serviços S.A.' },

  // Outros bancos tradicionais
  { codigo: '422', nome: 'Safra', nome_completo: 'Banco Safra S.A.' },
  { codigo: '041', nome: 'Banrisul', nome_completo: 'Banco do Estado do Rio Grande do Sul S.A.' },
  { codigo: '389', nome: 'Banco Mercantil', nome_completo: 'Banco Mercantil do Brasil S.A.' },
  { codigo: '756', nome: 'Sicoob', nome_completo: 'Banco Cooperativo do Brasil S.A.' },
  { codigo: '748', nome: 'Sicredi', nome_completo: 'Banco Cooperativo Sicredi S.A.' },
  { codigo: '655', nome: 'Neon', nome_completo: 'Banco Neon S.A.' },
  { codigo: '212', nome: 'Banco Original', nome_completo: 'Banco Original S.A.' },
  { codigo: '246', nome: 'Banco ABC Brasil', nome_completo: 'Banco ABC Brasil S.A.' },
  { codigo: '318', nome: 'BMG', nome_completo: 'Banco BMG S.A.' },

  // Bancos de investimento
  { codigo: '208', nome: 'BTG Pactual', nome_completo: 'Banco BTG Pactual S.A.' },
  { codigo: '096', nome: 'Banco BM&F', nome_completo: 'Banco BM&F de Serviços de LiquidaçÍo e Custódia S.A.' },
  { codigo: '124', nome: 'Banco Woori', nome_completo: 'Banco Woori Bank do Brasil S.A.' },
  { codigo: '623', nome: 'Banco Pan', nome_completo: 'Banco Pan S.A.' },
  { codigo: '633', nome: 'Banco Rendimento', nome_completo: 'Banco Rendimento S.A.' },
  { codigo: '070', nome: 'BRB', nome_completo: 'BRB - Banco de Brasília S.A.' },

  // Fintech e outros
  { codigo: '102', nome: 'XP Investimentos', nome_completo: 'XP Investimentos S.A.' },
  { codigo: '197', nome: 'Stone', nome_completo: 'Stone Pagamentos S.A.' },
  { codigo: '169', nome: 'Banco Olé Consignado', nome_completo: 'Banco Olé Bonsucesso Consignado S.A.' },
  { codigo: '654', nome: 'Banco Digimais', nome_completo: 'Banco Digimais S.A.' },
  { codigo: '348', nome: 'Banco XP', nome_completo: 'Banco XP S.A.' },
];

/**
 * Buscar banco por código
 */
export function buscarBancoPorCodigo(codigo: string): Banco | undefined {
  const codigoLimpo = codigo.replace(/\D/g, '').padStart(3, '0');
  return BANCOS_BRASILEIROS.find((b) => b.codigo === codigoLimpo);
}

/**
 * Buscar bancos por nome (busca parcial)
 */
export function buscarBancosPorNome(termo: string): Banco[] {
  const termoLower = termo.toLowerCase();
  return BANCOS_BRASILEIROS.filter(
    (b) =>
      b.nome.toLowerCase().includes(termoLower) ||
      b.nome_completo.toLowerCase().includes(termoLower) ||
      b.codigo.includes(termo)
  );
}

/**
 * Formatar opçÍo de banco para select
 */
export function formatarOpcaoBanco(banco: Banco): string {
  return `${banco.codigo} - ${banco.nome}`;
}

/**
 * Obter lista de opções para select
 */
export function getOpcoesBancos(): { value: string; label: string }[] {
  return BANCOS_BRASILEIROS.map((banco) => ({
    value: banco.codigo,
    label: formatarOpcaoBanco(banco),
  }));
}

// Compatibilidade com código antigo
export const bancos = BANCOS_BRASILEIROS.map((b) => ({
  nome: b.nome,
  codigo: b.codigo,
}));

