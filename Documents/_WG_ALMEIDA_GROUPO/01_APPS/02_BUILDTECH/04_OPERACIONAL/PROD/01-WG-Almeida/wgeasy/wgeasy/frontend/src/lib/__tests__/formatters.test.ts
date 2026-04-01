import { describe, it, expect } from "vitest";
import {
  removeNonDigits,
  formatTelefone,
  formatCPF,
  formatCNPJ,
  formatRG,
  formatCEP,
  validarCPF,
  validarCEP,
  validarTelefone,
} from "../formatters";

// ============================================================
// removeNonDigits
// ============================================================
describe("removeNonDigits", () => {
  it("remove pontos, traços e barras", () => {
    expect(removeNonDigits("123.456.789-00")).toBe("12345678900");
  });
  it("remove parênteses e espaços", () => {
    expect(removeNonDigits("(11) 99999-9999")).toBe("11999999999");
  });
  it("mantém só números", () => {
    expect(removeNonDigits("abc123def456")).toBe("123456");
  });
  it("string vazia retorna vazia", () => {
    expect(removeNonDigits("")).toBe("");
  });
  it("só letras retorna vazia", () => {
    expect(removeNonDigits("abc")).toBe("");
  });
  it("número limpo não muda", () => {
    expect(removeNonDigits("12345")).toBe("12345");
  });
});

// ============================================================
// formatTelefone
// ============================================================
describe("formatTelefone", () => {
  it("celular completo: (XX) XXXXX-XXXX", () => {
    expect(formatTelefone("11987654321")).toBe("(11) 98765-4321");
  });
  it("fixo completo: (XX) XXXX-XXXX", () => {
    expect(formatTelefone("1133334444")).toBe("(11) 3333-4444");
  });
  it("entrada já formatada: remove e reformata", () => {
    expect(formatTelefone("(11) 98765-4321")).toBe("(11) 98765-4321");
  });
  it("string vazia retorna vazia", () => {
    expect(formatTelefone("")).toBe("");
  });
  it("apenas DDD: só abre parêntese", () => {
    expect(formatTelefone("11")).toBe("(11");
  });
  it("DDD + início número", () => {
    expect(formatTelefone("1199")).toBe("(11) 99");
  });
  it("11 dígitos sempre formata como celular", () => {
    expect(formatTelefone("11912345678")).toBe("(11) 91234-5678");
  });
});

// ============================================================
// formatCPF
// ============================================================
describe("formatCPF", () => {
  it("CPF completo: XXX.XXX.XXX-XX", () => {
    expect(formatCPF("12345678900")).toBe("123.456.789-00");
  });
  it("entrada já formatada: mantém formato", () => {
    expect(formatCPF("123.456.789-00")).toBe("123.456.789-00");
  });
  it("string vazia retorna vazia", () => {
    expect(formatCPF("")).toBe("");
  });
  it("3 dígitos: sem pontuaçÍo ainda", () => {
    expect(formatCPF("123")).toBe("123");
  });
  it("4 dígitos: primeiro ponto", () => {
    expect(formatCPF("1234")).toBe("123.4");
  });
  it("7 dígitos: dois pontos", () => {
    expect(formatCPF("1234567")).toBe("123.456.7");
  });
  it("10 dígitos: ponto + traço parcial", () => {
    expect(formatCPF("1234567890")).toBe("123.456.789-0");
  });
});

// ============================================================
// formatCNPJ
// ============================================================
describe("formatCNPJ", () => {
  it("CNPJ completo: XX.XXX.XXX/XXXX-XX", () => {
    expect(formatCNPJ("12345678000195")).toBe("12.345.678/0001-95");
  });
  it("entrada já formatada: mantém", () => {
    expect(formatCNPJ("12.345.678/0001-95")).toBe("12.345.678/0001-95");
  });
  it("string vazia retorna vazia", () => {
    expect(formatCNPJ("")).toBe("");
  });
  it("2 dígitos: sem separadores", () => {
    expect(formatCNPJ("12")).toBe("12");
  });
  it("3 dígitos: primeiro ponto", () => {
    expect(formatCNPJ("123")).toBe("12.3");
  });
});

// ============================================================
// formatRG
// ============================================================
describe("formatRG", () => {
  it("RG completo: XX.XXX.XXX-X", () => {
    expect(formatRG("123456789")).toBe("12.345.678-9");
  });
  it("string vazia retorna vazia", () => {
    expect(formatRG("")).toBe("");
  });
  it("2 dígitos: sem pontuaçÍo", () => {
    expect(formatRG("12")).toBe("12");
  });
});

// ============================================================
// formatCEP
// ============================================================
describe("formatCEP", () => {
  it("CEP completo: XXXXX-XXX", () => {
    expect(formatCEP("12345678")).toBe("12345-678");
  });
  it("entrada já formatada", () => {
    expect(formatCEP("12345-678")).toBe("12345-678");
  });
  it("string vazia retorna vazia", () => {
    expect(formatCEP("")).toBe("");
  });
  it("5 dígitos: sem traço ainda", () => {
    expect(formatCEP("12345")).toBe("12345");
  });
});

// ============================================================
// validarCPF
// ============================================================
describe("validarCPF", () => {
  it("CPF válido real", () => {
    expect(validarCPF("529.982.247-25")).toBe(true);
  });
  it("CPF válido sem formataçÍo", () => {
    expect(validarCPF("52998224725")).toBe(true);
  });
  it("CPF inválido: sequência repetida", () => {
    expect(validarCPF("111.111.111-11")).toBe(false);
  });
  it("CPF inválido: dígito verificador errado", () => {
    expect(validarCPF("123.456.789-01")).toBe(false);
  });
  it("CPF inválido: menos de 11 dígitos", () => {
    expect(validarCPF("123.456.78")).toBe(false);
  });
  it("CPF todos zeros: inválido", () => {
    expect(validarCPF("000.000.000-00")).toBe(false);
  });
  it("CPF todos noves: inválido", () => {
    expect(validarCPF("999.999.999-99")).toBe(false);
  });
});

// ============================================================
// validarCEP
// ============================================================
describe("validarCEP", () => {
  it("CEP válido formatado", () => {
    expect(validarCEP("12345-678")).toBe(true);
  });
  it("CEP válido sem traço", () => {
    expect(validarCEP("12345678")).toBe(true);
  });
  it("CEP inválido: 7 dígitos", () => {
    expect(validarCEP("1234567")).toBe(false);
  });
  it("CEP inválido: 9 dígitos", () => {
    expect(validarCEP("123456789")).toBe(false);
  });
  it("CEP vazio: inválido", () => {
    expect(validarCEP("")).toBe(false);
  });
});

// ============================================================
// validarTelefone
// ============================================================
describe("validarTelefone", () => {
  it("celular 11 dígitos: válido", () => {
    expect(validarTelefone("(11) 98765-4321")).toBe(true);
  });
  it("fixo 10 dígitos: válido", () => {
    expect(validarTelefone("(11) 3333-4444")).toBe(true);
  });
  it("9 dígitos: inválido", () => {
    expect(validarTelefone("987654321")).toBe(false);
  });
  it("12 dígitos: inválido", () => {
    expect(validarTelefone("119876543210")).toBe(false);
  });
  it("vazio: inválido", () => {
    expect(validarTelefone("")).toBe(false);
  });
});


