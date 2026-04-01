import { describe, it, expect } from "vitest";
import {
  calcularPrecoMinimo,
  calcularPrecoComMarkup,
  calcularLucroEstimado,
  calcularMargemReal,
  gerarCodigoAutomatico,
  formatarPreco,
  formatarCodigo,
  formatarPercentual,
  validarItem,
  validarCategoria,
  calcularPrecoTotal,
  verificarEstoqueBaixo,
  estimarCustoDePreco,
  filtrarUnidades,
  UNIDADES_MAO_OBRA,
  UNIDADES_MATERIAL,
  UNIDADES_SERVICO,
  UNIDADES_PRODUTO,
} from "../pricelist";
import type { PricelistItem, PricelistItemFormData, PricelistCategoriaFormData } from "../pricelist";

// ============================================================
// calcularPrecoMinimo
// ============================================================
describe("calcularPrecoMinimo", () => {
  it("calcula com margem de 30%", () => {
    expect(calcularPrecoMinimo(100, 30)).toBe(130);
  });

  it("margem 0% retorna custo", () => {
    expect(calcularPrecoMinimo(100, 0)).toBe(100);
  });

  it("margem 100% dobra o custo", () => {
    expect(calcularPrecoMinimo(100, 100)).toBe(200);
  });
});

// ============================================================
// calcularPrecoComMarkup
// ============================================================
describe("calcularPrecoComMarkup", () => {
  it("markup de 50% sobre custo 100", () => {
    expect(calcularPrecoComMarkup(100, 50)).toBe(150);
  });

  it("markup de 0%", () => {
    expect(calcularPrecoComMarkup(250, 0)).toBe(250);
  });
});

// ============================================================
// calcularLucroEstimado
// ============================================================
describe("calcularLucroEstimado", () => {
  it("calcula lucro sem custo operacional", () => {
    expect(calcularLucroEstimado(150, 100)).toBe(50);
  });

  it("calcula lucro com custo operacional", () => {
    expect(calcularLucroEstimado(150, 100, 20)).toBe(30);
  });

  it("lucro negativo quando preço abaixo do custo", () => {
    expect(calcularLucroEstimado(80, 100)).toBe(-20);
  });
});

// ============================================================
// calcularMargemReal
// ============================================================
describe("calcularMargemReal", () => {
  it("calcula margem real em %", () => {
    // margem = ((200 - 100) / 200) * 100 = 50%
    expect(calcularMargemReal(200, 100)).toBe(50);
  });

  it("com custo operacional", () => {
    // margem = ((200 - 100 - 30) / 200) * 100 = 35%
    expect(calcularMargemReal(200, 100, 30)).toBe(35);
  });

  it("retorna 0 quando preço é zero (guarda contra divisÍo por zero)", () => {
    expect(calcularMargemReal(0, 100)).toBe(0);
  });

  it("margem negativa quando custo > preço", () => {
    expect(calcularMargemReal(100, 150)).toBeLessThan(0);
  });
});

// ============================================================
// gerarCodigoAutomatico
// ============================================================
describe("gerarCodigoAutomatico", () => {
  it("gera código para material", () => {
    expect(gerarCodigoAutomatico("material", 1)).toBe("MAT-00001");
  });

  it("gera código para mÍo de obra", () => {
    expect(gerarCodigoAutomatico("mao_obra", 42)).toBe("MO-00042");
  });

  it("gera código para serviço", () => {
    expect(gerarCodigoAutomatico("servico", 100)).toBe("SERV-00100");
  });

  it("gera código para produto", () => {
    expect(gerarCodigoAutomatico("produto", 7)).toBe("PROD-00007");
  });
});

// ============================================================
// formatarPreco
// ============================================================
describe("formatarPreco", () => {
  it("formata preço com símbolo R$", () => {
    const resultado = formatarPreco(1500);
    expect(resultado).toContain("1.500");
    expect(resultado).toContain("R$");
  });

  it("formata zero", () => {
    const resultado = formatarPreco(0);
    expect(resultado).toContain("0");
  });
});

// ============================================================
// formatarCodigo
// ============================================================
describe("formatarCodigo", () => {
  it("converte para maiúsculas", () => {
    expect(formatarCodigo("abc")).toBe("ABC");
  });

  it("retorna traço para null", () => {
    expect(formatarCodigo(null)).toBe("-");
  });
});

// ============================================================
// formatarPercentual
// ============================================================
describe("formatarPercentual", () => {
  it("formata percentual com 2 casas decimais", () => {
    expect(formatarPercentual(30)).toBe("30.00%");
  });

  it("retorna traço para null", () => {
    expect(formatarPercentual(null)).toBe("-");
  });

  it("retorna traço para undefined", () => {
    expect(formatarPercentual(undefined)).toBe("-");
  });
});

// ============================================================
// validarItem
// ============================================================
describe("validarItem", () => {
  it("item válido retorna array vazio", () => {
    const item: PricelistItemFormData = {
      nome: "Cimento CP II",
      tipo: "material",
      unidade: "sc",
      preco: 35,
    };
    expect(validarItem(item)).toEqual([]);
  });

  it("item sem nome retorna erro", () => {
    const item: PricelistItemFormData = {
      nome: "",
      tipo: "material",
      unidade: "sc",
      preco: 35,
    };
    const erros = validarItem(item);
    expect(erros).toContain("Nome é obrigatório");
  });

  it("item sem tipo retorna erro", () => {
    const item: PricelistItemFormData = {
      nome: "Cimento",
      unidade: "sc",
      preco: 35,
    };
    const erros = validarItem(item);
    expect(erros).toContain("Tipo é obrigatório");
  });

  it("item sem unidade retorna erro", () => {
    const item: PricelistItemFormData = {
      nome: "Cimento",
      tipo: "material",
      unidade: "",
      preco: 35,
    };
    const erros = validarItem(item);
    expect(erros).toContain("Unidade é obrigatória");
  });
});

// ============================================================
// validarCategoria
// ============================================================
describe("validarCategoria", () => {
  it("categoria válida retorna array vazio", () => {
    const cat: PricelistCategoriaFormData = {
      nome: "Elétrica",
      tipo: "material",
    };
    expect(validarCategoria(cat)).toEqual([]);
  });

  it("categoria sem nome retorna erro", () => {
    const cat: PricelistCategoriaFormData = {
      nome: "",
      tipo: "material",
    };
    expect(validarCategoria(cat)).toContain("Nome é obrigatório");
  });
});

// ============================================================
// calcularPrecoTotal
// ============================================================
describe("calcularPrecoTotal", () => {
  it("multiplica preço pela quantidade", () => {
    const item = { preco: 50 } as PricelistItem;
    expect(calcularPrecoTotal(item, 10)).toBe(500);
  });

  it("quantidade zero retorna zero", () => {
    const item = { preco: 50 } as PricelistItem;
    expect(calcularPrecoTotal(item, 0)).toBe(0);
  });
});

// ============================================================
// verificarEstoqueBaixo
// ============================================================
describe("verificarEstoqueBaixo", () => {
  it("retorna true quando estoque abaixo do mínimo", () => {
    const item = {
      controla_estoque: true,
      estoque_minimo: 10,
      estoque_atual: 3,
    } as PricelistItem;
    expect(verificarEstoqueBaixo(item)).toBe(true);
  });

  it("retorna false quando estoque acima do mínimo", () => {
    const item = {
      controla_estoque: true,
      estoque_minimo: 10,
      estoque_atual: 15,
    } as PricelistItem;
    expect(verificarEstoqueBaixo(item)).toBe(false);
  });

  it("retorna false quando nÍo controla estoque", () => {
    const item = {
      controla_estoque: false,
      estoque_minimo: 10,
      estoque_atual: 3,
    } as PricelistItem;
    expect(verificarEstoqueBaixo(item)).toBe(false);
  });
});

// ============================================================
// estimarCustoDePreco
// ============================================================
describe("estimarCustoDePreco", () => {
  it("calcula custo com margem padrÍo de 30%", () => {
    // custo = 130 / (1 + 30/100) = 100
    expect(estimarCustoDePreco(130)).toBeCloseTo(100, 2);
  });

  it("calcula custo com margem customizada", () => {
    // custo = 150 / (1 + 50/100) = 100
    expect(estimarCustoDePreco(150, 50)).toBeCloseTo(100, 2);
  });
});

// ============================================================
// filtrarUnidades
// ============================================================
describe("filtrarUnidades", () => {
  it("retorna unidades de mÍo de obra", () => {
    expect(filtrarUnidades("mao_obra")).toBe(UNIDADES_MAO_OBRA);
  });

  it("retorna unidades de material", () => {
    expect(filtrarUnidades("material")).toBe(UNIDADES_MATERIAL);
  });

  it("retorna unidades de serviço", () => {
    expect(filtrarUnidades("servico")).toBe(UNIDADES_SERVICO);
  });

  it("retorna unidades de produto", () => {
    expect(filtrarUnidades("produto")).toBe(UNIDADES_PRODUTO);
  });
});

