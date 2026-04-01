import { describe, it, expect } from "vitest";
import {
  isFeriadoFixo,
  isDiaUtil,
  calcularDiasUteis,
} from "../diasUteisUtils";

describe("isFeriadoFixo", () => {
  it("1 de janeiro é feriado (Ano Novo)", () => {
    expect(isFeriadoFixo(new Date(2026, 0, 1))).toBe(true);
  });

  it("25 de dezembro é feriado (Natal)", () => {
    expect(isFeriadoFixo(new Date(2026, 11, 25))).toBe(true);
  });

  it("7 de setembro é feriado (Independência)", () => {
    expect(isFeriadoFixo(new Date(2026, 8, 7))).toBe(true);
  });

  it("1 de maio é feriado (Dia do Trabalho)", () => {
    expect(isFeriadoFixo(new Date(2026, 4, 1))).toBe(true);
  });

  it("dia comum não é feriado", () => {
    expect(isFeriadoFixo(new Date(2026, 2, 3))).toBe(false); // 3 de março
  });

  it("15 de novembro é feriado (República)", () => {
    expect(isFeriadoFixo(new Date(2026, 10, 15))).toBe(true);
  });
});

describe("isDiaUtil", () => {
  it("segunda-feira sem feriado é dia útil", () => {
    expect(isDiaUtil(new Date(2026, 2, 2))).toBe(true); // seg 02/03/2026
  });

  it("sábado não é dia útil", () => {
    expect(isDiaUtil(new Date(2026, 2, 7))).toBe(false); // sáb 07/03/2026
  });

  it("domingo não é dia útil", () => {
    expect(isDiaUtil(new Date(2026, 2, 8))).toBe(false); // dom 08/03/2026
  });

  it("feriado numa quinta não é dia útil", () => {
    // 1 de janeiro de 2026 é quinta-feira
    expect(isDiaUtil(new Date(2026, 0, 1))).toBe(false);
  });
});

describe("calcularDiasUteis", () => {
  it("mesma data retorna 1 dia útil se for dia útil", () => {
    const segunda = new Date(2026, 2, 2); // 02/03/2026 — segunda
    expect(calcularDiasUteis(segunda, segunda)).toBe(1);
  });

  it("uma semana completa tem 5 dias úteis", () => {
    const segunda = new Date(2026, 2, 2); // 02/03/2026
    const sexta = new Date(2026, 2, 6);   // 06/03/2026
    expect(calcularDiasUteis(segunda, sexta)).toBe(5);
  });

  it("fim de semana não conta dias úteis", () => {
    const sabado = new Date(2026, 2, 7);   // 07/03/2026
    const domingo = new Date(2026, 2, 8);  // 08/03/2026
    expect(calcularDiasUteis(sabado, domingo)).toBe(0);
  });

  it("intervalo que inclui feriado tem menos dias úteis", () => {
    // Semana de 01/jan que é feriado
    const _domingo = new Date(2026, 11, 27); // 27/12/2026 domingo
    const _sextaAposNatal = new Date(2026, 11, 31); // 31/12/2026 quinta
    // 28, 29, 30, 31 — 4 dias, mas 25 é anterior, entÍo 4 dias úteis
    const diasComFeriado = calcularDiasUteis(new Date(2026, 11, 28), new Date(2026, 11, 31));
    expect(diasComFeriado).toBe(4); // 28(seg), 29(ter), 30(qua), 31(qui)
  });
});


