// ============================================================
// INFINITEPAY API - Client Frontend
// Sistema WG Easy - Grupo WG Almeida
// ============================================================

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:3001";
const INTERNAL_API_KEY = import.meta.env.VITE_INTERNAL_API_KEY || "";

function getHeaders(): HeadersInit {
  return {
    "Content-Type": "application/json",
    "x-internal-key": INTERNAL_API_KEY,
  };
}

// ============================================================
// INTERFACES
// ============================================================

export interface GerarLinkParams {
  cobrancaId: string;
  valor: number;
  descricao?: string;
  cliente?: {
    nome: string;
    email?: string;
    telefone?: string;
    cpfCnpj?: string;
  };
  metodosPagamento?: string[];
}

export interface GerarLinkResult {
  success: boolean;
  id?: string;
  url?: string;
  error?: string;
}

export interface StatusPagamentoResult {
  success: boolean;
  status?: "approved" | "pending" | "expired";
  amount?: number;
  paidAt?: string;
  error?: string;
}

// ============================================================
// GERAR LINK DE PAGAMENTO
// ============================================================

export async function gerarLinkPagamento(params: GerarLinkParams): Promise<GerarLinkResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/infinitepay/checkout-links`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      id: data.id,
      url: data.url,
    };
  } catch (error) {
    console.error("[InfinitePay] Erro ao gerar link:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// ============================================================
// CONSULTAR STATUS
// ============================================================

export async function consultarStatusPagamento(checkoutLinkId: string): Promise<StatusPagamentoResult> {
  try {
    const response = await fetch(`${BACKEND_URL}/api/infinitepay/status/${checkoutLinkId}`, {
      method: "GET",
      headers: getHeaders(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Erro desconhecido" }));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      status: data.status,
      amount: data.amount,
      paidAt: data.paidAt,
    };
  } catch (error) {
    console.error("[InfinitePay] Erro ao consultar status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Erro desconhecido",
    };
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Copia link de pagamento para clipboard
 */
export async function copiarLinkPagamento(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Abre WhatsApp com link de pagamento
 */
export function enviarLinkWhatsApp(telefone: string, url: string, clienteNome?: string) {
  const mensagem = clienteNome
    ? `Olá ${clienteNome}! Segue o link para pagamento:\n${url}`
    : `Segue o link para pagamento:\n${url}`;
  const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, "")}?text=${encodeURIComponent(mensagem)}`;
  window.open(whatsappUrl, "_blank");
}

/**
 * Formata status do InfinitePay para exibiçÍo
 */
export function formatarStatusInfinitePay(status: string): { label: string; cor: string } {
  switch (status) {
    case "approved":
      return { label: "Pago", cor: "bg-green-100 text-green-700" };
    case "pending":
      return { label: "Aguardando", cor: "bg-yellow-100 text-yellow-700" };
    case "expired":
      return { label: "Expirado", cor: "bg-gray-100 text-gray-600" };
    case "failed":
      return { label: "Falhou", cor: "bg-red-100 text-red-700" };
    default:
      return { label: status, cor: "bg-gray-100 text-gray-600" };
  }
}

