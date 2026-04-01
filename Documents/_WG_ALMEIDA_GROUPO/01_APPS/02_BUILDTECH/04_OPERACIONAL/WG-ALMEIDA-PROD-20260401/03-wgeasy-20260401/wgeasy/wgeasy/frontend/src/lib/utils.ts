/* eslint-disable @typescript-eslint/no-unused-vars, react-hooks/exhaustive-deps */
// ============================================================
// UTILITÁRIOS CENTRALIZADOS
// Funções auxiliares reutilizáveis em todo o sistema
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// ============================================================
// UTILITÁRIOS DE CLASSES CSS
// ============================================================

/**
 * Combina classes CSS com suporte ao Tailwind
 * Mescla classes condicionalmente e resolve conflitos do Tailwind
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================
// FORMATAÇÍO DE MOEDA
// ============================================================

/**
 * Formata número como moeda brasileira
 */
export function formatarMoeda(valor: number, opcoes?: {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: opcoes?.minimumFractionDigits ?? 2,
    maximumFractionDigits: opcoes?.maximumFractionDigits ?? 2,
  }).format(valor);
}

/**
 * Formata número como moeda compacta (1.5k, 2.3M)
 */
export function formatarMoedaCompacta(valor: number): string {
  if (valor >= 1000000) {
    return `R$ ${(valor / 1000000).toFixed(1)}M`;
  }
  if (valor >= 1000) {
    return `R$ ${(valor / 1000).toFixed(1)}k`;
  }
  return formatarMoeda(valor, { maximumFractionDigits: 0 });
}

/**
 * Parse moeda brasileira para número
 */
export function parseMoeda(valor: string): number {
  return parseFloat(
    valor
      .replace(/[^\d,]/g, "")
      .replace(",", ".")
  ) || 0;
}

// ============================================================
// FORMATAÇÍO DE DATA E HORA
// ============================================================

/**
 * Formata data no formato brasileiro
 */
export function formatarData(data: string | Date, formato: "curto" | "medio" | "longo" = "curto"): string {
  const date = typeof data === "string"
    ? parseDataLocal(data)
    : data;

  const formatos = {
    curto: { day: "2-digit", month: "2-digit", year: "numeric" },
    medio: { day: "2-digit", month: "short", year: "numeric" },
    longo: { day: "2-digit", month: "long", year: "numeric" },
  };

  return date.toLocaleDateString("pt-BR", formatos[formato] as Intl.DateTimeFormatOptions);
}

function parseDataLocal(valor: string): Date {
  const isoSemHora = valor.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoSemHora) {
    const [, ano, mes, dia] = isoSemHora;
    return new Date(Number(ano), Number(mes) - 1, Number(dia));
  }
  return new Date(valor);
}

/**
 * Formata data e hora
 */
export function formatarDataHora(data: string | Date): string {
  const date = typeof data === "string"
    ? parseDataLocal(data)
    : data;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Calcula diferença de dias entre duas datas
 */
export function diferencaDias(data1: string | Date, data2: string | Date): number {
  const d1 = typeof data1 === "string" ? new Date(data1) : data1;
  const d2 = typeof data2 === "string" ? new Date(data2) : data2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Verifica se uma data está no passado
 */
export function estaNoPassado(data: string | Date): boolean {
  const d = typeof data === "string" ? new Date(data) : data;
  return d < new Date();
}

/**
 * Adiciona dias a uma data
 */
export function adicionarDias(data: string | Date, dias: number): Date {
  const d = typeof data === "string" ? new Date(data) : new Date(data);
  d.setDate(d.getDate() + dias);
  return d;
}

/**
 * Formata tempo decorrido de forma humanizada
 */
export function tempoDecorrido(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data) : data;
  const agora = new Date();
  const diffMs = agora.getTime() - d.getTime();
  const diffMinutos = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);
  const diffMeses = Math.floor(diffDias / 30);
  const diffAnos = Math.floor(diffDias / 365);

  if (diffMinutos < 1) return "agora";
  if (diffMinutos < 60) return `${diffMinutos}m atrás`;
  if (diffHoras < 24) return `${diffHoras}h atrás`;
  if (diffDias === 1) return "ontem";
  if (diffDias < 7) return `${diffDias}d atrás`;
  if (diffDias < 30) return `${Math.floor(diffDias / 7)} sem atrás`;
  if (diffMeses < 12) return `${diffMeses} ${diffMeses === 1 ? "mês" : "meses"} atrás`;
  return `${diffAnos} ${diffAnos === 1 ? "ano" : "anos"} atrás`;
}

// ============================================================
// FORMATAÇÍO DE TEXTO
// ============================================================

/**
 * Capitaliza primeira letra
 */
export function capitalize(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1).toLowerCase();
}

/**
 * Trunca texto com reticências
 */
export function truncar(texto: string, maxLength: number): string {
  if (texto.length <= maxLength) return texto;
  return texto.substring(0, maxLength) + "...";
}

/**
 * Remove acentos de uma string
 */
export function removerAcentos(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Gera slug a partir de texto
 */
export function gerarSlug(texto: string): string {
  return removerAcentos(texto)
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

/**
 * Extrai iniciais de um nome
 */
export function extrairIniciais(nome: string): string {
  const partes = nome.trim().split(" ");
  if (partes.length >= 2) {
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }
  return nome.substring(0, 2).toUpperCase();
}

// ============================================================
// VALIDAÇÕES
// ============================================================

/**
 * Valida CPF
 */
export function validarCPF(cpf: string): boolean {
  const cleaned = cpf.replace(/\D/g, "");
  if (cleaned.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let digit1 = remainder >= 10 ? 0 : remainder;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let digit2 = remainder >= 10 ? 0 : remainder;

  return (
    parseInt(cleaned.charAt(9)) === digit1 &&
    parseInt(cleaned.charAt(10)) === digit2
  );
}

/**
 * Valida CNPJ
 */
export function validarCNPJ(cnpj: string): boolean {
  const cleaned = cnpj.replace(/\D/g, "");
  if (cleaned.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  let size = cleaned.length - 2;
  let numbers = cleaned.substring(0, size);
  const digits = cleaned.substring(size);
  let sum = 0;
  let pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== parseInt(digits.charAt(0))) return false;

  size = size + 1;
  numbers = cleaned.substring(0, size);
  sum = 0;
  pos = size - 7;

  for (let i = size; i >= 1; i--) {
    sum += parseInt(numbers.charAt(size - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  return result === parseInt(digits.charAt(1));
}

/**
 * Valida email
 */
export function validarEmail(email: string): boolean {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

/**
 * Valida telefone brasileiro
 */
export function validarTelefone(telefone: string): boolean {
  const cleaned = telefone.replace(/\D/g, "");
  return cleaned.length === 10 || cleaned.length === 11;
}

// ============================================================
// MÁSCARAS
// ============================================================

/**
 * Aplica máscara de CPF
 */
export function mascararCPF(cpf: string): string {
  return cpf
    .replace(/\D/g, "")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

/**
 * Aplica máscara de CNPJ
 */
export function mascararCNPJ(cnpj: string): string {
  return cnpj
    .replace(/\D/g, "")
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .replace(/(-\d{2})\d+?$/, "$1");
}

/**
 * Aplica máscara de telefone
 */
export function mascararTelefone(telefone: string): string {
  const cleaned = telefone.replace(/\D/g, "");
  if (cleaned.length === 11) {
    return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }
  return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

/**
 * Aplica máscara de CEP
 */
export function mascararCEP(cep: string): string {
  return cep.replace(/\D/g, "").replace(/(\d{5})(\d)/, "$1-$2");
}

// ============================================================
// CORES E TEMAS
// ============================================================

/**
 * Gera cor aleatória para avatar
 */
export function gerarCorAvatar(texto: string): string {
  const cores = [
    "#F25C26", "#8B5CF6", "#3B82F6", "#10B981",
    "#F59E0B", "#EF4444", "#EC4899", "#06B6D4",
  ];

  let hash = 0;
  for (let i = 0; i < texto.length; i++) {
    hash = texto.charCodeAt(i) + ((hash << 5) - hash);
  }

  return cores[Math.abs(hash) % cores.length];
}

/**
 * Converte hex para RGB
 */
export function hexParaRGB(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

// ============================================================
// UTILITÁRIOS GERAIS
// ============================================================

/**
 * Gera ID único
 */
export function gerarId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Download de arquivo
 */
export function downloadArquivo(conteudo: string, nomeArquivo: string, tipo: string = "text/plain") {
  const blob = new Blob([conteudo], { type: tipo });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * Copia texto para clipboard
 */
export async function copiarParaClipboard(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Aguarda X milissegundos
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Agrupa array por chave
 */
export function agruparPor<T>(array: T[], chave: keyof T): Record<string, T[]> {
  return array.reduce((acc, item) => {
    const key = String(item[chave]);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {} as Record<string, T[]>);
}

/**
 * Remove duplicatas de array
 */
export function removerDuplicatas<T>(array: T[]): T[] {
  return Array.from(new Set(array));
}

/**
 * Ordena array de objetos por chave
 */
export function ordenarPor<T>(
  array: T[],
  chave: keyof T,
  ordem: "asc" | "desc" = "asc"
): T[] {
  return [...array].sort((a, b) => {
    if (a[chave] < b[chave]) return ordem === "asc" ? -1 : 1;
    if (a[chave] > b[chave]) return ordem === "asc" ? 1 : -1;
    return 0;
  });
}


