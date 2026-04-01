// ============================================================
// TESTES — Schemas Zod (validaçÍo de formulários)
// ============================================================

import { describe, it, expect } from "vitest";
import {
  schemaCliente,
  schemaOportunidade,
  schemaProposta,
  schemaContrato,
  schemaLancamento,
  schemaProjeto,
} from "@/lib/schemas";

// ============================================================
// schemaCliente
// ============================================================

describe("schemaCliente", () => {
  it("aceita dados mínimos válidos", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo Silva" });
    expect(r.success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    const r = schemaCliente.safeParse({ nome: "J" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("2 caracteres");
  });

  it("rejeita email inválido", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", email: "invalido" });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0].message).toContain("E-mail");
  });

  it("aceita email vazio (opcional)", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", email: "" });
    expect(r.success).toBe(true);
  });

  it("rejeita telefone no formato errado", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", telefone: "11999887766" });
    expect(r.success).toBe(false);
  });

  it("aceita telefone formatado", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", telefone: "(11) 99988-7766" });
    expect(r.success).toBe(true);
  });

  it("rejeita CPF no formato errado", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", cpf: "12345678901" });
    expect(r.success).toBe(false);
  });

  it("aceita CPF formatado", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", cpf: "529.982.247-25" });
    expect(r.success).toBe(true);
  });

  it("rejeita CNPJ inválido", () => {
    const r = schemaCliente.safeParse({ nome: "Empresa", cnpj: "12345678000195" });
    expect(r.success).toBe(false);
  });

  it("aceita CNPJ formatado", () => {
    const r = schemaCliente.safeParse({ nome: "Empresa", cnpj: "12.345.678/0001-95" });
    expect(r.success).toBe(true);
  });

  it("rejeita CEP inválido", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", cep: "12345678" });
    expect(r.success).toBe(false);
  });

  it("aceita CEP formatado", () => {
    const r = schemaCliente.safeParse({ nome: "JoÍo", cep: "01310-100" });
    expect(r.success).toBe(true);
  });

  it("aceita tipo_pessoa juridica", () => {
    const r = schemaCliente.safeParse({ nome: "Empresa Ltda", tipo_pessoa: "juridica" });
    expect(r.success).toBe(true);
  });
});

// ============================================================
// schemaOportunidade
// ============================================================

describe("schemaOportunidade", () => {
  const base = { titulo: "Apto 42m²", cliente_nome: "Ana Lima" };

  it("aceita dados válidos mínimos", () => {
    expect(schemaOportunidade.safeParse(base).success).toBe(true);
  });

  it("rejeita título muito curto", () => {
    const r = schemaOportunidade.safeParse({ ...base, titulo: "Ab" });
    expect(r.success).toBe(false);
  });

  it("rejeita valor negativo", () => {
    const r = schemaOportunidade.safeParse({ ...base, valor_estimado: -100 });
    expect(r.success).toBe(false);
  });

  it("aceita valor zero (gratuito)", () => {
    const r = schemaOportunidade.safeParse({ ...base, valor_estimado: 0 });
    expect(r.success).toBe(true);
  });

  it("rejeita estagio inválido", () => {
    const r = schemaOportunidade.safeParse({ ...base, estagio: "inexistente" });
    expect(r.success).toBe(false);
  });

  it("aceita todos os estágios válidos", () => {
    const estagios = ["lead", "contato", "proposta", "negociacao", "fechado", "perdido"];
    estagios.forEach((estagio) => {
      expect(schemaOportunidade.safeParse({ ...base, estagio }).success).toBe(true);
    });
  });

  it("rejeita probabilidade acima de 100", () => {
    const r = schemaOportunidade.safeParse({ ...base, probabilidade: 101 });
    expect(r.success).toBe(false);
  });
});

// ============================================================
// schemaProposta
// ============================================================

describe("schemaProposta", () => {
  const base = {
    titulo: "Proposta Arquitetônica",
    cliente_id: "abc123",
    valor_total: 18000,
  };

  it("aceita dados válidos", () => {
    expect(schemaProposta.safeParse(base).success).toBe(true);
  });

  it("rejeita valor_total zero", () => {
    const r = schemaProposta.safeParse({ ...base, valor_total: 0 });
    expect(r.success).toBe(false);
  });

  it("rejeita validade_dias > 365", () => {
    const r = schemaProposta.safeParse({ ...base, validade_dias: 366 });
    expect(r.success).toBe(false);
  });

  it("rejeita desconto maior que 100%", () => {
    const r = schemaProposta.safeParse({ ...base, desconto_percentual: 101 });
    expect(r.success).toBe(false);
  });

  it("aceita desconto 100%", () => {
    const r = schemaProposta.safeParse({ ...base, desconto_percentual: 100 });
    expect(r.success).toBe(true);
  });

  it("aceita todos os status válidos", () => {
    ["rascunho", "enviada", "aprovada", "recusada", "expirada"].forEach((status) => {
      expect(schemaProposta.safeParse({ ...base, status }).success).toBe(true);
    });
  });
});

// ============================================================
// schemaContrato
// ============================================================

describe("schemaContrato", () => {
  const base = {
    titulo: "Contrato de Projeto Arquitetônico",
    cliente_id: "cli123",
    valor_total: 25000,
    data_inicio: "2026-03-01",
    descricao_servicos: "Desenvolvimento completo do projeto arquitetônico residencial",
  };

  it("aceita dados válidos completos", () => {
    expect(schemaContrato.safeParse(base).success).toBe(true);
  });

  it("rejeita descriçÍo muito curta", () => {
    const r = schemaContrato.safeParse({ ...base, descricao_servicos: "Curta" });
    expect(r.success).toBe(false);
  });

  it("rejeita data_inicio ausente", () => {
    const r = schemaContrato.safeParse({ ...base, data_inicio: "" });
    expect(r.success).toBe(false);
  });

  it("rejeita número de parcelas > 120", () => {
    const r = schemaContrato.safeParse({ ...base, numero_parcelas: 121 });
    expect(r.success).toBe(false);
  });

  it("aceita todas as formas de pagamento", () => {
    ["avista", "parcelado", "mensal", "personalizado"].forEach((forma_pagamento) => {
      expect(schemaContrato.safeParse({ ...base, forma_pagamento }).success).toBe(true);
    });
  });
});

// ============================================================
// schemaLancamento
// ============================================================

describe("schemaLancamento", () => {
  const base = {
    descricao: "Honorários arquitetônicos",
    valor: 5000,
    tipo: "receita" as const,
    categoria_id: "cat-001",
    data_lancamento: "2026-03-03",
  };

  it("aceita lançamento de receita válido", () => {
    expect(schemaLancamento.safeParse(base).success).toBe(true);
  });

  it("aceita lançamento de despesa", () => {
    expect(schemaLancamento.safeParse({ ...base, tipo: "despesa", valor: -500 }).success).toBe(true);
  });

  it("rejeita valor zero", () => {
    const r = schemaLancamento.safeParse({ ...base, valor: 0 });
    expect(r.success).toBe(false);
  });

  it("rejeita URL de comprovante inválida", () => {
    const r = schemaLancamento.safeParse({ ...base, comprovante_url: "nao-e-url" });
    expect(r.success).toBe(false);
  });

  it("aceita comprovante vazio", () => {
    expect(schemaLancamento.safeParse({ ...base, comprovante_url: "" }).success).toBe(true);
  });
});

// ============================================================
// schemaProjeto
// ============================================================

describe("schemaProjeto", () => {
  const base = {
    nome: "Residencial Almeida",
    cliente_id: "cli-001",
    data_inicio_previsto: "2026-04-01",
  };

  it("aceita projeto válido mínimo", () => {
    expect(schemaProjeto.safeParse(base).success).toBe(true);
  });

  it("rejeita nome muito curto", () => {
    const r = schemaProjeto.safeParse({ ...base, nome: "AB" });
    expect(r.success).toBe(false);
  });

  it("rejeita área_m2 zero", () => {
    const r = schemaProjeto.safeParse({ ...base, area_m2: 0 });
    expect(r.success).toBe(false);
  });

  it("aceita área_m2 positiva", () => {
    expect(schemaProjeto.safeParse({ ...base, area_m2: 42 }).success).toBe(true);
  });

  it("rejeita status inválido", () => {
    const r = schemaProjeto.safeParse({ ...base, status: "invalido" });
    expect(r.success).toBe(false);
  });

  it("aceita todos os tipos de projeto", () => {
    ["residencial", "comercial", "industrial", "outro"].forEach((tipo) => {
      expect(schemaProjeto.safeParse({ ...base, tipo }).success).toBe(true);
    });
  });

  it("aceita todos os status válidos", () => {
    ["planejamento", "em_andamento", "pausado", "concluido", "cancelado"].forEach((status) => {
      expect(schemaProjeto.safeParse({ ...base, status }).success).toBe(true);
    });
  });
});

