// ============================================================
// UTILIDADES: FormataçÍo de Campos de Cadastro
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

/**
 * Remove todos os caracteres não numéricos de uma string
 */
export function removeNonDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Formata telefone brasileiro
 * Aceita: (XX) XXXXX-XXXX (celular) ou (XX) XXXX-XXXX (fixo)
 */
export function formatTelefone(value: string): string {
  const digits = removeNonDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Telefone fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6, 10)}`;
  }
  // Celular: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formata CPF brasileiro
 * Formato: XXX.XXX.XXX-XX
 */
export function formatCPF(value: string): string {
  const digits = removeNonDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Formata CNPJ brasileiro
 * Formato: XX.XXX.XXX/XXXX-XX
 */
export function formatCNPJ(value: string): string {
  const digits = removeNonDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formata RG brasileiro
 * Formato genérico: XX.XXX.XXX-X
 */
export function formatRG(value: string): string {
  const digits = removeNonDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}-${digits.slice(8, 9)}`;
}

/**
 * Formata CEP brasileiro
 * Formato: XXXXX-XXX
 */
export function formatCEP(value: string): string {
  const digits = removeNonDigits(value);

  if (digits.length === 0) return "";
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5, 8)}`;
}

/**
 * Valida CPF brasileiro
 */
export function validarCPF(cpf: string): boolean {
  const digits = removeNonDigits(cpf);

  if (digits.length !== 11) return false;

  // Verifica sequências iguais (111.111.111-11, etc)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // ValidaçÍo do primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(digits.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(digits.charAt(9))) return false;

  // ValidaçÍo do segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(digits.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(digits.charAt(10));
}

/**
 * Valida CEP brasileiro
 */
export function validarCEP(cep: string): boolean {
  const digits = removeNonDigits(cep);
  return digits.length === 8;
}

/**
 * Valida telefone brasileiro
 */
export function validarTelefone(telefone: string): boolean {
  const digits = removeNonDigits(telefone);
  // Aceita telefone fixo (10 dígitos) ou celular (11 dígitos)
  return digits.length === 10 || digits.length === 11;
}


