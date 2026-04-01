import { describe, it, expect } from "vitest";
import { getTaxaCartao, TAXAS_CARTAO } from "../types/index";

describe("getTaxaCartao", () => {
  it("à vista (1 parcela) retorna taxa mínima 3.15%", () => {
    expect(getTaxaCartao(1)).toBe(3.15);
  });

  it("12 parcelas retorna taxa máxima 12.40%", () => {
    expect(getTaxaCartao(12)).toBe(12.40);
  });

  it("parcelas > 12 retorna cap de 12x", () => {
    expect(getTaxaCartao(18)).toBe(TAXAS_CARTAO[12]);
    expect(getTaxaCartao(24)).toBe(TAXAS_CARTAO[12]);
  });

  it("parcelas <= 0 retorna taxa à vista", () => {
    expect(getTaxaCartao(0)).toBe(TAXAS_CARTAO[1]);
    expect(getTaxaCartao(-1)).toBe(TAXAS_CARTAO[1]);
  });

  it("6 parcelas retorna 8.28%", () => {
    expect(getTaxaCartao(6)).toBe(8.28);
  });

  it("taxas crescem a cada parcela adicional", () => {
    for (let i = 1; i < 12; i++) {
      expect(getTaxaCartao(i)).toBeLessThan(getTaxaCartao(i + 1));
    }
  });

  it("todas as taxas sÍo percentuais positivos < 100", () => {
    for (let i = 1; i <= 12; i++) {
      const taxa = getTaxaCartao(i);
      expect(taxa).toBeGreaterThan(0);
      expect(taxa).toBeLessThan(100);
    }
  });
});

describe("TAXAS_CARTAO tabela", () => {
  it("tem exatamente 12 entradas (1 a 12 parcelas)", () => {
    expect(Object.keys(TAXAS_CARTAO).length).toBe(12);
  });

  it("todas as chaves sÍo inteiros de 1 a 12", () => {
    const chaves = Object.keys(TAXAS_CARTAO).map(Number).sort((a, b) => a - b);
    expect(chaves).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
  });

  it("taxa à vista é menor que 2 parcelas", () => {
    expect(TAXAS_CARTAO[1]).toBeLessThan(TAXAS_CARTAO[2]);
  });
});

