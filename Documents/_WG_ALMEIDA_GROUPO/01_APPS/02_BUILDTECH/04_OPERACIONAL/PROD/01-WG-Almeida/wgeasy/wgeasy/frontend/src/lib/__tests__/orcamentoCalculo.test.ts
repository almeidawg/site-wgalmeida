import { describe, it, expect } from "vitest";
import { calcularOrcamento } from "../orcamentoCalculo";

// ============================================================
// calcularOrcamento — 15% margem + 7% imposto
// ============================================================
describe("calcularOrcamento", () => {
  it("retorna zeros para lista vazia", () => {
    const r = calcularOrcamento([]);
    expect(r.totalGeral).toBe(0);
    expect(r.margem).toBe(0);
    expect(r.imposto).toBe(0);
    expect(r.totalFinal).toBe(0);
  });

  it("calcula total geral somando subtotais", () => {
    const itens = [{ subtotal: 1000 }, { subtotal: 500 }];
    expect(calcularOrcamento(itens).totalGeral).toBe(1500);
  });

  it("margem é 15% do total geral", () => {
    const itens = [{ subtotal: 1000 }];
    expect(calcularOrcamento(itens).margem).toBe(150);
  });

  it("imposto é 7% do total geral", () => {
    const itens = [{ subtotal: 1000 }];
    expect(calcularOrcamento(itens).imposto).toBe(70);
  });

  it("totalFinal = total + margem + imposto", () => {
    const itens = [{ subtotal: 1000 }];
    const r = calcularOrcamento(itens);
    expect(r.totalFinal).toBe(1000 + 150 + 70);
  });

  it("totalFinal é 122% do total geral (15+7=22%)", () => {
    const itens = [{ subtotal: 2000 }];
    const r = calcularOrcamento(itens);
    expect(r.totalFinal).toBe(2000 * 1.22);
  });

  it("lida com subtotal como string numérica", () => {
    const itens = [{ subtotal: "500" }, { subtotal: "300" }];
    expect(calcularOrcamento(itens).totalGeral).toBe(800);
  });

  it("subtotal undefined/null conta como 0", () => {
    const itens = [{ subtotal: 1000 }, { subtotal: undefined }, { subtotal: null }];
    expect(calcularOrcamento(itens).totalGeral).toBe(1000);
  });

  it("múltiplos itens de projeto arquitetônico (42m² × R$180)", () => {
    const itens = [{ subtotal: 42 * 180 }]; // R$ 7.560,00
    const r = calcularOrcamento(itens);
    expect(r.totalGeral).toBe(7560);
    expect(r.margem).toBe(1134);
    expect(r.imposto).toBeCloseTo(529.2);
    expect(r.totalFinal).toBeCloseTo(9223.2);
  });

  it("valores decimais sÍo tratados corretamente", () => {
    const itens = [{ subtotal: 333.33 }, { subtotal: 666.67 }];
    expect(calcularOrcamento(itens).totalGeral).toBeCloseTo(1000);
  });

  it("item único com valor zero", () => {
    const r = calcularOrcamento([{ subtotal: 0 }]);
    expect(r.totalGeral).toBe(0);
    expect(r.totalFinal).toBe(0);
  });

  it("valores altos (contrato enterprise)", () => {
    const itens = [{ subtotal: 500000 }];
    const r = calcularOrcamento(itens);
    expect(r.margem).toBe(75000);
    expect(r.imposto).toBe(35000);
    expect(r.totalFinal).toBe(610000);
  });
});

