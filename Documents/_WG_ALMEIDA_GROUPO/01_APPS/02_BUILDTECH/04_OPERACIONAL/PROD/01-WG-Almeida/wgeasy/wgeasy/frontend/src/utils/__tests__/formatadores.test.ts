import { describe, it, expect } from "vitest";
import {
  formatarMoeda,
  desformatarMoeda,
  formatarMoedaInput,
  formatarMoedaCompacta,
  padronizarNome,
  formatarCPF,
  formatarRG,
  formatarTelefone,
  normalizarDataIsoOuBr,
  formatarData,
  dataParaInput,
} from "../formatadores";

// ============================================================
// formatarMoeda
// ============================================================
describe("formatarMoeda", () => {
  it("formata número positivo como R$", () => {
    const resultado = formatarMoeda(1234.56);
    // Intl pode usar espaço normal ou non-breaking space
    expect(resultado.replace(/\s/g, " ")).toBe("R$ 1.234,56");
  });

  it("formata zero", () => {
    expect(formatarMoeda(0).replace(/\s/g, " ")).toBe("R$ 0,00");
  });

  it("retorna R$ 0,00 para null", () => {
    expect(formatarMoeda(null).replace(/\s/g, " ")).toBe("R$ 0,00");
  });

  it("retorna R$ 0,00 para undefined", () => {
    expect(formatarMoeda(undefined).replace(/\s/g, " ")).toBe("R$ 0,00");
  });

  it("formata número negativo", () => {
    const resultado = formatarMoeda(-500);
    expect(resultado).toContain("500");
  });
});

// ============================================================
// desformatarMoeda
// ============================================================
describe("desformatarMoeda", () => {
  it("converte string formatada em número", () => {
    expect(desformatarMoeda("R$ 1.234,56")).toBe(1234.56);
  });

  it("round-trip: formatar → desformatar preserva valor", () => {
    const original = 9876.54;
    const formatado = formatarMoeda(original);
    const resultado = desformatarMoeda(formatado);
    expect(resultado).toBeCloseTo(original, 2);
  });

  it("retorna 0 para string vazia", () => {
    expect(desformatarMoeda("")).toBe(0);
  });

  it("retorna 0 para string inválida", () => {
    expect(desformatarMoeda("abc")).toBe(0);
  });
});

// ============================================================
// formatarMoedaInput
// ============================================================
describe("formatarMoedaInput", () => {
  it("formata centavos digitados", () => {
    const resultado = formatarMoedaInput("12345");
    expect(resultado.replace(/\s/g, " ")).toBe("R$ 123,45");
  });

  it("retorna string vazia para input vazio", () => {
    expect(formatarMoedaInput("")).toBe("");
  });
});

// ============================================================
// formatarMoedaCompacta
// ============================================================
describe("formatarMoedaCompacta", () => {
  it("formata milhÍo como M", () => {
    expect(formatarMoedaCompacta(2500000)).toBe("R$ 2.5M");
  });

  it("formata milhar como k", () => {
    expect(formatarMoedaCompacta(1500)).toBe("R$ 1.5k");
  });

  it("valores pequenos usam formataçÍo completa", () => {
    const resultado = formatarMoedaCompacta(500);
    expect(resultado).toContain("500");
  });
});

// ============================================================
// padronizarNome
// ============================================================
describe("padronizarNome", () => {
  it("capitaliza nome simples", () => {
    expect(padronizarNome("joao silva")).toBe("Joao Silva");
  });

  it("com preposições, mantém apenas primeiro e último", () => {
    expect(padronizarNome("maria da silva santos")).toBe("Maria Santos");
  });

  it("converte TUDO MAIÚSCULO", () => {
    expect(padronizarNome("CARLOS PEREIRA")).toBe("Carlos Pereira");
  });

  it("retorna vazio para string vazia", () => {
    expect(padronizarNome("")).toBe("");
  });

  it("trata espaços extras", () => {
    expect(padronizarNome("  ana   clara  ")).toBe("Ana Clara");
  });
});

// ============================================================
// formatarCPF
// ============================================================
describe("formatarCPF", () => {
  it("formata 11 dígitos como CPF", () => {
    expect(formatarCPF("12345678901")).toBe("123.456.789-01");
  });

  it("retorna vazio para null", () => {
    expect(formatarCPF(null)).toBe("");
  });

  it("retorna vazio para undefined", () => {
    expect(formatarCPF(undefined)).toBe("");
  });
});

// ============================================================
// formatarRG
// ============================================================
describe("formatarRG", () => {
  it("formata 9 dígitos como RG", () => {
    expect(formatarRG("123456789")).toBe("12.345.678-9");
  });

  it("retorna vazio para null", () => {
    expect(formatarRG(null)).toBe("");
  });
});

// ============================================================
// formatarTelefone
// ============================================================
describe("formatarTelefone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatarTelefone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata fixo com 10 dígitos", () => {
    expect(formatarTelefone("1134567890")).toBe("(11) 3456-7890");
  });

  it("retorna vazio para null", () => {
    expect(formatarTelefone(null)).toBe("");
  });
});

// ============================================================
// normalizarDataIsoOuBr
// ============================================================
describe("normalizarDataIsoOuBr", () => {
  it("converte dd/mm/aaaa para ISO", () => {
    expect(normalizarDataIsoOuBr("15/03/2025")).toBe("2025-03-15");
  });

  it("mantém ISO inalterado", () => {
    expect(normalizarDataIsoOuBr("2025-03-15")).toBe("2025-03-15");
  });

  it("aceita dd-mm-aaaa", () => {
    expect(normalizarDataIsoOuBr("01-12-2024")).toBe("2024-12-01");
  });

  it("retorna vazio para string vazia", () => {
    expect(normalizarDataIsoOuBr("")).toBe("");
  });

  it("pad de dia/mês com 1 dígito", () => {
    expect(normalizarDataIsoOuBr("5/3/2025")).toBe("2025-03-05");
  });
});

// ============================================================
// formatarData
// ============================================================
describe("formatarData", () => {
  it("formata data ISO para dd/mm/aaaa", () => {
    const resultado = formatarData("2025-03-15");
    expect(resultado).toBe("15/03/2025");
  });

  it("retorna traço para null", () => {
    expect(formatarData(null)).toBe("—");
  });

  it("retorna traço para undefined", () => {
    expect(formatarData(undefined)).toBe("—");
  });
});

// ============================================================
// dataParaInput
// ============================================================
describe("dataParaInput", () => {
  it("retorna vazio para null", () => {
    expect(dataParaInput(null)).toBe("");
  });

  it("retorna vazio para undefined", () => {
    expect(dataParaInput(undefined)).toBe("");
  });
});

