import { describe, it, expect } from "vitest";
import {
  valorPorExtenso,
  validarDadosContrato,
  gerarTabelaParcelas,
  formatarCPF,
  formatarCNPJ,
  formatarTelefone,
  formatarCEP,
} from "../juridico/contratoUtils";
import type { DadosContrato } from "../juridico/contratoUtils";

// ============================================================
// valorPorExtenso
// ============================================================
describe("valorPorExtenso", () => {
  it("zero reais", () => {
    expect(valorPorExtenso(0)).toBe("zero reais");
  });
  it("um real (singular)", () => {
    expect(valorPorExtenso(1)).toBe("um real");
  });
  it("dois reais", () => {
    expect(valorPorExtenso(2)).toBe("dois reais");
  });
  it("cem reais", () => {
    expect(valorPorExtenso(100)).toBe("cem reais");
  });
  it("cento e um reais", () => {
    expect(valorPorExtenso(101)).toBe("cento e um reais");
  });
  it("mil reais", () => {
    expect(valorPorExtenso(1000)).toBe("mil reais");
  });
  it("um projeto arquitetônico 42m² × R$180", () => {
    expect(valorPorExtenso(7560)).toContain("sete mil");
  });
  it("valor com centavos", () => {
    const result = valorPorExtenso(10.5);
    expect(result).toContain("dez reais");
    expect(result).toContain("cinquenta centavos");
  });
  it("um centavo (singular)", () => {
    const result = valorPorExtenso(0.01);
    expect(result).toContain("um centavo");
  });
  it("quinhentos mil reais", () => {
    expect(valorPorExtenso(500000)).toContain("quinhentos mil");
  });
  it("um milhÍo", () => {
    expect(valorPorExtenso(1000000)).toContain("um milhÍo");
  });
  it("dois milhões", () => {
    expect(valorPorExtenso(2000000)).toContain("dois milhões");
  });
  it("vinte reais", () => {
    expect(valorPorExtenso(20)).toBe("vinte reais");
  });
  it("trinta e cinco reais", () => {
    expect(valorPorExtenso(35)).toBe("trinta e cinco reais");
  });
});

// ============================================================
// formatarCPF (contratoUtils)
// ============================================================
describe("formatarCPF (contratoUtils)", () => {
  it("formata CPF com pontos e traço", () => {
    expect(formatarCPF("52998224725")).toBe("529.982.247-25");
  });
  it("CPF já formatado: mantém", () => {
    expect(formatarCPF("529.982.247-25")).toBe("529.982.247-25");
  });
});

// ============================================================
// formatarCNPJ (contratoUtils)
// ============================================================
describe("formatarCNPJ (contratoUtils)", () => {
  it("formata CNPJ completo", () => {
    expect(formatarCNPJ("12345678000195")).toBe("12.345.678/0001-95");
  });
});

// ============================================================
// formatarTelefone (contratoUtils)
// ============================================================
describe("formatarTelefone (contratoUtils)", () => {
  it("celular 11 dígitos", () => {
    expect(formatarTelefone("11987654321")).toBe("(11) 98765-4321");
  });
  it("fixo 10 dígitos", () => {
    expect(formatarTelefone("1133334444")).toBe("(11) 3333-4444");
  });
});

// ============================================================
// formatarCEP (contratoUtils)
// ============================================================
describe("formatarCEP (contratoUtils)", () => {
  it("formata CEP com traço", () => {
    expect(formatarCEP("12345678")).toBe("12345-678");
  });
});

// ============================================================
// validarDadosContrato
// ============================================================
describe("validarDadosContrato", () => {
  const dadosCompletos: DadosContrato = {
    empresa: {
      id: "1", razao_social: "WG Almeida", nome_fantasia: "WGEasy",
      cnpj: "12.345.678/0001-95", endereco_completo: "Rua Teste, 100",
    },
    pessoa: {
      id: "2", nome: "JoÍo Silva", cpf_cnpj: "529.982.247-25",
      tipo_pessoa: "fisica",
    },
    contrato: {
      id: "3", numero: "001/2026", valor_total: 7560,
    },
    parcelas: [],
    memorial: null,
  };

  it("sem variáveis obrigatórias: sem erros", () => {
    expect(validarDadosContrato(dadosCompletos, [])).toHaveLength(0);
  });

  it("variáveis nulas: sem erros", () => {
    expect(validarDadosContrato(dadosCompletos, null)).toHaveLength(0);
  });

  it("variável não-obrigatória não gera erro (sem formato categoria.campo)", () => {
    expect(validarDadosContrato(dadosCompletos, ["nome"])).toHaveLength(0);
  });

  it("variável obrigatória preenchida: sem erro", () => {
    expect(validarDadosContrato(dadosCompletos, ["pessoa.nome"])).toHaveLength(0);
  });

  it("pessoa nula + variável obrigatória pessoa: gera erro", () => {
    const dados = { ...dadosCompletos, pessoa: null };
    const erros = validarDadosContrato(dados, ["pessoa.nome"]);
    expect(erros.length).toBeGreaterThan(0);
  });

  it("empresa nula + variável obrigatória empresa: gera erro", () => {
    const dados = { ...dadosCompletos, empresa: null };
    const erros = validarDadosContrato(dados, ["empresa.razao_social"]);
    expect(erros.length).toBeGreaterThan(0);
  });

  it("contrato nulo + variável obrigatória contrato: gera erro", () => {
    const dados = { ...dadosCompletos, contrato: null };
    const erros = validarDadosContrato(dados, ["contrato.numero"]);
    expect(erros.length).toBeGreaterThan(0);
  });

  it("aceita array de objetos com 'nome' como variáveis", () => {
    const erros = validarDadosContrato(dadosCompletos, [{ nome: "pessoa.nome" }]);
    expect(erros).toHaveLength(0);
  });
});

// ============================================================
// gerarTabelaParcelas
// ============================================================
describe("gerarTabelaParcelas", () => {
  it("lista vazia retorna string vazia", () => {
    expect(gerarTabelaParcelas([])).toBe("");
  });

  it("retorna HTML com table", () => {
    const parcelas = [
      { numero: 1, descricao: "Entrada 30%", valor: 2268, data_vencimento: "2026-03-01", forma_pagamento: "PIX" },
    ];
    const html = gerarTabelaParcelas(parcelas);
    expect(html).toContain("<table");
    expect(html).toContain("</table>");
  });

  it("HTML contém dados da parcela", () => {
    const parcelas = [
      { numero: 1, descricao: "Sinal", valor: 1000, data_vencimento: "2026-03-15" },
    ];
    const html = gerarTabelaParcelas(parcelas);
    expect(html).toContain("Sinal");
    expect(html).toContain("1ª");
  });

  it("linha TOTAL aparece com valor somado", () => {
    const parcelas = [
      { numero: 1, descricao: "Parcela 1", valor: 3000, data_vencimento: "2026-03-01" },
      { numero: 2, descricao: "Parcela 2", valor: 4560, data_vencimento: "2026-04-01" },
    ];
    const html = gerarTabelaParcelas(parcelas);
    expect(html).toContain("TOTAL");
    // Total = 7560
    expect(html).toContain("7.560");
  });

  it("múltiplas parcelas geram múltiplos <tr>", () => {
    const parcelas = [
      { numero: 1, descricao: "P1", valor: 1000, data_vencimento: "2026-03-01" },
      { numero: 2, descricao: "P2", valor: 2000, data_vencimento: "2026-04-01" },
      { numero: 3, descricao: "P3", valor: 3000, data_vencimento: "2026-05-01" },
    ];
    const html = gerarTabelaParcelas(parcelas);
    // thead tr + 3 data trs + total tr = 5 <tr> tags
    const trCount = (html.match(/<tr/g) || []).length;
    expect(trCount).toBeGreaterThanOrEqual(5);
  });
});


