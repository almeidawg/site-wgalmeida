// Constantes globais do sistema WG Easy
// Centraliza valores que podem mudar e sÍo usados em vários lugares

// WhatsApp de suporte WG Almeida
// TODO: Mover para variável de ambiente ou tabela de configuraçÍo no banco
export const WG_WHATSAPP_SUPORTE = "5511999999999";

// URL formatada para abrir WhatsApp
export const WG_WHATSAPP_URL = `https://wa.me/${WG_WHATSAPP_SUPORTE}`;

// FunçÍo helper para gerar URL de WhatsApp com mensagem
export function gerarWhatsAppUrl(telefone: string, mensagem?: string): string {
  let tel = telefone.replace(/\D/g, "");
  if (!tel.startsWith("55")) {
    tel = `55${tel}`;
  }
  const base = `https://wa.me/${tel}`;
  return mensagem ? `${base}?text=${encodeURIComponent(mensagem)}` : base;
}

// Cores por núcleo de negócio - Design System WG
export const CORES_NUCLEO = {
  arquitetura: {
    main: "#5E9B94",
    bg: "bg-nucleo-arquitetura/10",
    text: "text-nucleo-arquitetura",
    border: "border-nucleo-arquitetura",
    bgSolid: "bg-nucleo-arquitetura",
  },
  engenharia: {
    main: "#2B4580",
    bg: "bg-nucleo-engenharia/10",
    text: "text-nucleo-engenharia",
    border: "border-nucleo-engenharia",
    bgSolid: "bg-nucleo-engenharia",
  },
  marcenaria: {
    main: "#8B5E3C",
    bg: "bg-nucleo-marcenaria/10",
    text: "text-nucleo-marcenaria",
    border: "border-nucleo-marcenaria",
    bgSolid: "bg-nucleo-marcenaria",
  },
} as const;

// Limites do sistema
export const LIMITES = {
  MINI_CARDS_DASHBOARD: 8,
  MESES_HISTORICO_GRAFICO: 6,
  DIAS_EVENTOS_CALENDARIO: 14,
} as const;

// Tipos de usuário e seus redirecionamentos
export const REDIRECT_POR_TIPO: Record<string, string> = {
  CLIENTE: "/wgx",
  FORNECEDOR: "/fornecedor",
  COLABORADOR: "/colaborador",
  ESPECIFICADOR: "/especificador",
  JURIDICO: "/juridico",
  FINANCEIRO: "/financeiro",
};

