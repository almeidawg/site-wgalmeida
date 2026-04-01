import { describe, it, expect } from "vitest";
import {
  buscarBancoPorCodigo,
  buscarBancosPorNome,
  formatarOpcaoBanco,
  getOpcoesBancos,
  BANCOS_BRASILEIROS,
} from "../bancos";

// ============================================================
// BANCOS_BRASILEIROS — dados estáticos
// ============================================================
describe("BANCOS_BRASILEIROS", () => {
  it("lista tem pelo menos 20 bancos", () => {
    expect(BANCOS_BRASILEIROS.length).toBeGreaterThanOrEqual(20);
  });
  it("todos os bancos têm código, nome e nome_completo", () => {
    BANCOS_BRASILEIROS.forEach((b) => {
      expect(b.codigo).toBeTruthy();
      expect(b.nome).toBeTruthy();
      expect(b.nome_completo).toBeTruthy();
    });
  });
  it("códigos têm 3 dígitos", () => {
    BANCOS_BRASILEIROS.forEach((b) => {
      expect(b.codigo).toMatch(/^\d{3}$/);
    });
  });
  it("contém os 5 grandes bancos brasileiros", () => {
    const nomes = BANCOS_BRASILEIROS.map((b) => b.nome);
    expect(nomes).toContain("Banco do Brasil");
    expect(nomes).toContain("Caixa Econômica");
    expect(nomes).toContain("Bradesco");
    expect(nomes).toContain("Itaú");
    expect(nomes).toContain("Santander");
  });
  it("contém bancos digitais populares", () => {
    const nomes = BANCOS_BRASILEIROS.map((b) => b.nome);
    expect(nomes).toContain("Nubank");
    expect(nomes).toContain("Banco Inter");
  });
});

// ============================================================
// buscarBancoPorCodigo
// ============================================================
describe("buscarBancoPorCodigo", () => {
  it("encontra Bradesco pelo código 237", () => {
    const banco = buscarBancoPorCodigo("237");
    expect(banco?.nome).toBe("Bradesco");
  });
  it("encontra Nubank pelo código 260", () => {
    const banco = buscarBancoPorCodigo("260");
    expect(banco?.nome).toBe("Nubank");
  });
  it("normaliza código com padding (1 → 001)", () => {
    const banco = buscarBancoPorCodigo("1");
    expect(banco?.nome).toBe("Banco do Brasil");
  });
  it("normaliza código com formataçÍo '001'", () => {
    const banco = buscarBancoPorCodigo("001");
    expect(banco?.nome).toBe("Banco do Brasil");
  });
  it("retorna undefined para código inexistente", () => {
    expect(buscarBancoPorCodigo("999")).toBeUndefined();
  });
  it("retorna undefined para string vazia", () => {
    expect(buscarBancoPorCodigo("")).toBeUndefined();
  });
  it("banco retornado tem todas as propriedades", () => {
    const banco = buscarBancoPorCodigo("341");
    expect(banco).toHaveProperty("codigo");
    expect(banco).toHaveProperty("nome");
    expect(banco).toHaveProperty("nome_completo");
  });
});

// ============================================================
// buscarBancosPorNome
// ============================================================
describe("buscarBancosPorNome", () => {
  it("busca parcial case insensitive: 'brad' → Bradesco", () => {
    const resultado = buscarBancosPorNome("brad");
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado[0].nome).toBe("Bradesco");
  });
  it("busca 'banco' retorna múltiplos resultados", () => {
    const resultado = buscarBancosPorNome("banco");
    expect(resultado.length).toBeGreaterThan(3);
  });
  it("busca por nome completo funciona", () => {
    const resultado = buscarBancosPorNome("Nu Pagamentos");
    expect(resultado.length).toBeGreaterThan(0);
  });
  it("termo sem correspondência retorna array vazio", () => {
    const resultado = buscarBancosPorNome("xyzabcdef123");
    expect(resultado).toHaveLength(0);
  });
  it("busca por código também funciona", () => {
    const resultado = buscarBancosPorNome("260");
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado[0].codigo).toBe("260");
  });
});

// ============================================================
// formatarOpcaoBanco
// ============================================================
describe("formatarOpcaoBanco", () => {
  it("formata como 'CODIGO - NOME'", () => {
    const banco = { codigo: "237", nome: "Bradesco", nome_completo: "Banco Bradesco S.A." };
    expect(formatarOpcaoBanco(banco)).toBe("237 - Bradesco");
  });
  it("formato correto para Nubank", () => {
    const banco = BANCOS_BRASILEIROS.find((b) => b.codigo === "260")!;
    expect(formatarOpcaoBanco(banco)).toBe("260 - Nubank");
  });
});

// ============================================================
// getOpcoesBancos
// ============================================================
describe("getOpcoesBancos", () => {
  it("retorna array com value e label", () => {
    const opcoes = getOpcoesBancos();
    expect(opcoes.length).toBeGreaterThan(0);
    opcoes.forEach((op) => {
      expect(op).toHaveProperty("value");
      expect(op).toHaveProperty("label");
    });
  });
  it("value é o código do banco", () => {
    const opcoes = getOpcoesBancos();
    const bradesco = opcoes.find((o) => o.value === "237");
    expect(bradesco?.label).toContain("Bradesco");
  });
  it("mesma quantidade que BANCOS_BRASILEIROS", () => {
    expect(getOpcoesBancos().length).toBe(BANCOS_BRASILEIROS.length);
  });
});

