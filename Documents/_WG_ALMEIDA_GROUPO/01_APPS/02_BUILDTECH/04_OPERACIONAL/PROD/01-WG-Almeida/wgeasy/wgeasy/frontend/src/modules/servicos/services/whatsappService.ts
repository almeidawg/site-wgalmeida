// Módulo de Serviços - WhatsApp Service
// WGeasy - GeraçÍo de mensagens e links para WhatsApp

import type { SolicitacaoServico } from '../types';

/**
 * Gera a mensagem formatada para envio via WhatsApp
 */
export function gerarMensagemWhatsApp(
  servico: SolicitacaoServico,
  linkAceite: string
): string {
  const categoria = servico.categoria?.nome || 'Serviço';
  const valor = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(servico.valor_servico);

  let mensagem = `*SOLICITACAO DE SERVICO*\n\n`;
  mensagem += `*${servico.numero}*\n`;
  mensagem += `Tipo: *${categoria}*\n\n`;

  mensagem += `*Descricao:*\n${servico.descricao || servico.titulo}\n\n`;

  if (servico.coletar_endereco_completo) {
    mensagem += `*Coletar em:*\n${servico.coletar_endereco_completo}\n`;
    if (servico.coletar_referencia) {
      mensagem += `Ref: ${servico.coletar_referencia}\n`;
    }
    mensagem += `\n`;
  }

  if (servico.entregar_endereco_completo) {
    mensagem += `*Entregar em:*\n${servico.entregar_endereco_completo}\n`;
    if (servico.entregar_referencia) {
      mensagem += `Ref: ${servico.entregar_referencia}\n`;
    }
    mensagem += `\n`;
  }

  if (servico.data_necessidade) {
    const data = new Date(servico.data_necessidade).toLocaleDateString('pt-BR');
    mensagem += `*Data necessaria:* ${data}\n\n`;
  }

  mensagem += `*Valor:* ${valor}\n\n`;

  mensagem += `Clique no link abaixo para *ACEITAR*:\n`;
  mensagem += `${linkAceite}\n\n`;

  mensagem += `_O primeiro a aceitar garante o servico._\n`;
  mensagem += `_Grupo WG Almeida_`;

  return mensagem;
}

/**
 * Gera a URL do WhatsApp com a mensagem
 */
export function gerarUrlWhatsApp(mensagem: string, telefone?: string): string {
  const encoded = encodeURIComponent(mensagem);

  if (telefone) {
    // Remove caracteres não numéricos
    let tel = telefone.replace(/\D/g, '');

    // Adiciona código do Brasil se não tiver
    if (!tel.startsWith('55')) {
      tel = `55${tel}`;
    }

    return `https://wa.me/${tel}?text=${encoded}`;
  }

  return `https://wa.me/?text=${encoded}`;
}

/**
 * Gera o link de aceite do serviço
 */
export function gerarLinkAceite(token: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/servico/aceitar/${token}`;
}

/**
 * Gera o link de aceite individual por prestador
 */
export function gerarLinkAceitePrestador(tokenConvidado: string, baseUrl?: string): string {
  const base = baseUrl || window.location.origin;
  return `${base}/servico/aceitar/p/${tokenConvidado}`;
}

/**
 * Abre o WhatsApp com a mensagem
 */
export function abrirWhatsApp(mensagem: string, telefone?: string): void {
  const url = gerarUrlWhatsApp(mensagem, telefone);
  window.open(url, '_blank');
}

/**
 * Gera mensagem de confirmaçÍo de aceite
 */
export function gerarMensagemConfirmacao(servico: SolicitacaoServico): string {
  const valor = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(servico.valor_servico);

  let mensagem = `*SERVICO CONFIRMADO*\n\n`;
  mensagem += `Voce aceitou o servico *${servico.numero}*\n\n`;
  mensagem += `*${servico.titulo}*\n`;
  mensagem += `Valor: ${valor}\n\n`;

  if (servico.data_necessidade) {
    const data = new Date(servico.data_necessidade).toLocaleDateString('pt-BR');
    mensagem += `Data prevista: ${data}\n\n`;
  }

  mensagem += `Entraremos em contato para mais detalhes.\n`;
  mensagem += `_Grupo WG Almeida_`;

  return mensagem;
}

/**
 * Copia texto para a área de transferência
 */
export async function copiarParaClipboard(texto: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(texto);
    return true;
  } catch {
    // Fallback para navegadores mais antigos
    const textArea = document.createElement('textarea');
    textArea.value = texto;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
}


