import { supabaseRaw as supabase } from '@/lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://ahlqzzkxuutwoepirpzr.supabase.co';

interface CreatePaymentLinkParams {
  parcelaId: string;
  valor: number;
  descricao?: string;
  clienteNome?: string;
  clienteEmail?: string;
}

interface PaymentLinkResponse {
  success: boolean;
  paymentLink?: {
    id: string;
    url: string;
  };
  error?: string;
}

/**
 * Cria um Payment Link no Stripe para uma parcela
 */
export async function createPaymentLink(params: CreatePaymentLinkParams): Promise<PaymentLinkResponse> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !sessionData.session) {
      throw new Error('Usuário nÍo autenticado');
    }

    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-payment-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionData.session.access_token}`,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro ao criar link de pagamento');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao criar Payment Link:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Busca o status de pagamento de uma parcela
 */
export async function getPaymentStatus(parcelaId: string) {
  try {
    const { data, error } = await supabase
      .from('financeiro_parcelas')
      .select('stripe_payment_status, stripe_payment_link_url, stripe_paid_at')
      .eq('id', parcelaId)
      .single();

    if (error) throw error;

    return {
      success: true,
      status: data?.stripe_payment_status || 'not_created',
      paymentUrl: data?.stripe_payment_link_url,
      paidAt: data?.stripe_paid_at,
    };
  } catch (error) {
    console.error('Erro ao buscar status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro desconhecido',
    };
  }
}

/**
 * Copia link de pagamento para área de transferência
 */
export function copyPaymentLink(url: string): Promise<void> {
  return navigator.clipboard.writeText(url);
}

/**
 * Envia link de pagamento por WhatsApp
 */
export function sendPaymentLinkViaWhatsApp(
  phoneNumber: string,
  paymentUrl: string,
  clienteNome: string,
  valor: number
): void {
  const message = encodeURIComponent(
    `Olá ${clienteNome}! 👋\n\n` +
    `Segue o link para pagamento da sua parcela no valor de R$ ${valor.toFixed(2)}:\n\n` +
    `${paymentUrl}\n\n` +
    `Você pode pagar com cartÍo de crédito, PIX ou boleto de forma segura através do Stripe.\n\n` +
    `Qualquer dúvida, estamos à disposiçÍo!`
  );

  const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${message}`;
  window.open(whatsappUrl, '_blank');
}

/**
 * Envia link de pagamento por Email
 */
export function sendPaymentLinkViaEmail(
  email: string,
  paymentUrl: string,
  clienteNome: string,
  valor: number
): void {
  const subject = encodeURIComponent('Link de Pagamento - WGEASY');
  const body = encodeURIComponent(
    `Olá ${clienteNome},\n\n` +
    `Segue o link para pagamento da sua parcela no valor de R$ ${valor.toFixed(2)}:\n\n` +
    `${paymentUrl}\n\n` +
    `Você pode pagar com cartÍo de crédito, PIX ou boleto de forma segura através do Stripe.\n\n` +
    `Atenciosamente,\n` +
    `Equipe WGEASY`
  );

  window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

/**
 * Formata status do Stripe para exibiçÍo
 */
export function formatStripeStatus(status: string | null): { label: string; color: string } {
  switch (status) {
    case 'pending':
      return { label: 'Aguardando Pagamento', color: 'bg-yellow-100 text-yellow-700' };
    case 'paid':
      return { label: 'Pago via Stripe', color: 'bg-green-100 text-green-700' };
    case 'expired':
      return { label: 'Link Expirado', color: 'bg-gray-100 text-gray-700' };
    case 'canceled':
      return { label: 'Cancelado', color: 'bg-red-100 text-red-700' };
    default:
      return { label: 'NÍo criado', color: 'bg-gray-100 text-gray-600' };
  }
}

