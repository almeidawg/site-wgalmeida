import { describe, it, expect } from "vitest";
import { calcularForcaSenha } from "../PasswordStrengthIndicator";

describe("calcularForcaSenha", () => {
  it("senha vazia retorna score 0 (muito fraca)", () => {
    const r = calcularForcaSenha("");
    expect(r.score).toBe(0);
    expect(r.label).toBe("Muito fraca");
    expect(r.checks.length).toBe(false);
  });

  it("senha curta sem complexidade: score 0", () => {
    const r = calcularForcaSenha("abc");
    expect(r.score).toBe(0);
    expect(r.checks.length).toBe(false);
    expect(r.checks.uppercase).toBe(false);
    expect(r.checks.number).toBe(false);
    expect(r.checks.symbol).toBe(false);
  });

  it("senha com >= 12 chars apenas: score 1 (fraca)", () => {
    const r = calcularForcaSenha("aaaaaaaaaaaa"); // 12 chars
    expect(r.score).toBe(1);
    expect(r.checks.length).toBe(true);
    expect(r.checks.uppercase).toBe(false);
    expect(r.label).toBe("Fraca");
  });

  it("com maiúscula: score 2 (média)", () => {
    const r = calcularForcaSenha("Aaaaaaaaaaaa"); // 12 chars + maiúscula
    expect(r.score).toBe(2);
    expect(r.checks.uppercase).toBe(true);
    expect(r.label).toBe("Média");
  });

  it("com maiúscula + número: score 3 (boa)", () => {
    const r = calcularForcaSenha("Aaaaaaaaaaa1"); // 12 chars + maiúscula + número
    expect(r.score).toBe(3);
    expect(r.checks.number).toBe(true);
    expect(r.label).toBe("Boa");
  });

  it("senha forte com todos critérios: score 4", () => {
    const r = calcularForcaSenha("Senha@Forte123!");
    expect(r.score).toBe(4);
    expect(r.checks.length).toBe(true);
    expect(r.checks.uppercase).toBe(true);
    expect(r.checks.number).toBe(true);
    expect(r.checks.symbol).toBe(true);
    expect(r.label).toBe("Forte");
  });

  it("símbolo detectado corretamente", () => {
    const r = calcularForcaSenha("@");
    expect(r.checks.symbol).toBe(true);
  });

  it("número detectado corretamente", () => {
    const r = calcularForcaSenha("9");
    expect(r.checks.number).toBe(true);
  });

  it("senha com exatamente 11 chars não passa no critério length", () => {
    const r = calcularForcaSenha("aaaaaaaaaaa"); // 11 chars
    expect(r.checks.length).toBe(false);
  });

  it("senha com exatamente 12 chars passa no critério length", () => {
    const r = calcularForcaSenha("aaaaaaaaaaaa"); // 12 chars
    expect(r.checks.length).toBe(true);
  });

  it("retorna cor e bgColor para cada nível", () => {
    const forte = calcularForcaSenha("Senha@Forte123!");
    expect(forte.color).toBe("text-green-600");
    expect(forte.bgColor).toBe("bg-green-500");
  });
});


