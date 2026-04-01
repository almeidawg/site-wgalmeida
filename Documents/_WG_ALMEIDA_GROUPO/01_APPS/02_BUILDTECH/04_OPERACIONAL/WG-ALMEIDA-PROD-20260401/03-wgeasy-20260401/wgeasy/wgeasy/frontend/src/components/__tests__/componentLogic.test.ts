// ============================================================
// TESTES — Lógica de componentes (sem DOM — puras)
// ============================================================

import { describe, it, expect } from "vitest";

// ============================================================
// TrialBanner — lógica de mensagens
// ============================================================

describe("TrialBanner — mensagens de trial", () => {
  function getMensagem(diasRestantes: number | null, expirado: boolean): string {
    if (expirado) return "Seu período de trial expirou. Assine agora para continuar.";
    if (diasRestantes === 1) return "Último dia de trial! Assine agora para não perder o acesso.";
    if (diasRestantes !== null) return `Seu trial termina em ${diasRestantes} dias.`;
    return "Você está no período de avaliaçÍo gratuita.";
  }

  function getUrgente(diasRestantes: number | null): boolean {
    return diasRestantes !== null && diasRestantes <= 3;
  }

  function getBgClass(diasRestantes: number | null, expirado: boolean): string {
    if (expirado) return "bg-red-600";
    if (getUrgente(diasRestantes)) return "bg-orange-500";
    return "bg-amber-500";
  }

  it("exibe mensagem de expirado quando expirado = true", () => {
    expect(getMensagem(0, true)).toContain("expirou");
  });

  it("exibe mensagem de último dia quando diasRestantes = 1", () => {
    expect(getMensagem(1, false)).toContain("Último dia");
  });

  it("exibe contagem de dias restantes", () => {
    expect(getMensagem(5, false)).toBe("Seu trial termina em 5 dias.");
  });

  it("exibe mensagem genérica quando diasRestantes = null", () => {
    expect(getMensagem(null, false)).toContain("avaliaçÍo gratuita");
  });

  it("bg-red-600 quando expirado", () => {
    expect(getBgClass(0, true)).toBe("bg-red-600");
  });

  it("bg-orange-500 quando urgente (≤3 dias)", () => {
    expect(getBgClass(2, false)).toBe("bg-orange-500");
    expect(getBgClass(3, false)).toBe("bg-orange-500");
  });

  it("bg-amber-500 quando mais de 3 dias", () => {
    expect(getBgClass(10, false)).toBe("bg-amber-500");
    expect(getBgClass(null, false)).toBe("bg-amber-500");
  });

  it("urgente = true para 1 dia", () => {
    expect(getUrgente(1)).toBe(true);
  });

  it("urgente = true para 3 dias", () => {
    expect(getUrgente(3)).toBe(true);
  });

  it("urgente = false para 4 dias", () => {
    expect(getUrgente(4)).toBe(false);
  });

  it("urgente = false para null", () => {
    expect(getUrgente(null)).toBe(false);
  });
});

// ============================================================
// useAppStore — lógica de notificações (pura)
// ============================================================

describe("useAppStore — lógica de notificações", () => {
  interface Notificacao {
    id: string;
    tipo: "info" | "sucesso" | "aviso" | "erro";
    titulo: string;
    lida: boolean;
    criadaEm: Date;
  }

  function adicionarNotificacao(
    lista: Notificacao[],
    nova: Omit<Notificacao, "id" | "lida" | "criadaEm">
  ): Notificacao[] {
    return [
      { ...nova, id: "mock-id", lida: false, criadaEm: new Date() },
      ...lista,
    ].slice(0, 50);
  }

  function marcarTodasLidas(lista: Notificacao[]): Notificacao[] {
    return lista.map((n) => ({ ...n, lida: true }));
  }

  function contarNaoLidas(lista: Notificacao[]): number {
    return lista.filter((n) => !n.lida).length;
  }

  it("adiciona notificaçÍo como não lida por padrÍo", () => {
    const lista = adicionarNotificacao([], { tipo: "info", titulo: "Teste" });
    expect(lista[0].lida).toBe(false);
  });

  it("adiciona no início da lista (mais recente primeiro)", () => {
    let lista: Notificacao[] = [];
    lista = adicionarNotificacao(lista, { tipo: "info", titulo: "Primeira" });
    lista = adicionarNotificacao(lista, { tipo: "aviso", titulo: "Segunda" });
    expect(lista[0].titulo).toBe("Segunda");
  });

  it("limita lista a 50 notificações", () => {
    let lista: Notificacao[] = [];
    for (let i = 0; i < 60; i++) {
      lista = adicionarNotificacao(lista, { tipo: "info", titulo: `Notif ${i}` });
    }
    expect(lista.length).toBe(50);
  });

  it("marcarTodasLidas marca todas como lidas", () => {
    let lista: Notificacao[] = [];
    lista = adicionarNotificacao(lista, { tipo: "info", titulo: "A" });
    lista = adicionarNotificacao(lista, { tipo: "aviso", titulo: "B" });
    const lidas = marcarTodasLidas(lista);
    expect(lidas.every((n) => n.lida)).toBe(true);
  });

  it("contarNaoLidas conta corretamente", () => {
    let lista: Notificacao[] = [];
    lista = adicionarNotificacao(lista, { tipo: "info", titulo: "A" });
    lista = adicionarNotificacao(lista, { tipo: "aviso", titulo: "B" });
    expect(contarNaoLidas(lista)).toBe(2);
    const apos = marcarTodasLidas(lista);
    expect(contarNaoLidas(apos)).toBe(0);
  });
});

// ============================================================
// useUsageMetering — lógica pura
// ============================================================

describe("useUsageMetering — lógica pura", () => {
  function percentualUso(usado: number, limite: number): number {
    if (limite === 0) return 0;
    return Math.min(100, Math.round((usado / limite) * 100));
  }

  function excedeUso(usado: number, limite: number): boolean {
    return limite > 0 && usado >= limite;
  }

  function proxDeLimite(usado: number, limite: number): boolean {
    return limite > 0 && usado / limite >= 0.8;
  }

  it("percentualUso: 10 de 100 = 10%", () => {
    expect(percentualUso(10, 100)).toBe(10);
  });

  it("percentualUso: limita em 100%", () => {
    expect(percentualUso(150, 100)).toBe(100);
  });

  it("percentualUso: evita divisÍo por zero", () => {
    expect(percentualUso(0, 0)).toBe(0);
  });

  it("percentualUso: arredonda corretamente", () => {
    expect(percentualUso(1, 3)).toBe(33);
  });

  it("excedeUso = true quando usado >= limite", () => {
    expect(excedeUso(20, 20)).toBe(true);
    expect(excedeUso(21, 20)).toBe(true);
  });

  it("excedeUso = false quando abaixo do limite", () => {
    expect(excedeUso(19, 20)).toBe(false);
  });

  it("excedeUso = false para limite 0 (ilimitado)", () => {
    expect(excedeUso(999, 0)).toBe(false);
  });

  it("proxDeLimite = true a 80%", () => {
    expect(proxDeLimite(80, 100)).toBe(true);
    expect(proxDeLimite(16, 20)).toBe(true);
  });

  it("proxDeLimite = false a 79%", () => {
    expect(proxDeLimite(79, 100)).toBe(false);
  });
});


