import { describe, it, expect } from "vitest";
import { normalizeSearchTerm, includesNormalized } from "../searchUtils";

// ============================================================
// normalizeSearchTerm
// ============================================================
describe("normalizeSearchTerm", () => {
  it("converte para minúsculas", () => {
    expect(normalizeSearchTerm("JOÍO")).toBe("joao");
  });

  it("remove acentos", () => {
    expect(normalizeSearchTerm("José")).toBe("jose");
  });

  it("remove cedilha", () => {
    expect(normalizeSearchTerm("Ação")).toBe("acao");
  });

  it("remove acentos compostos", () => {
    expect(normalizeSearchTerm("Construção Civil")).toBe("construcao civil");
  });

  it("remove espaços no início e fim", () => {
    expect(normalizeSearchTerm("  teste  ")).toBe("teste");
  });

  it("mantém números", () => {
    expect(normalizeSearchTerm("Fase 1")).toBe("fase 1");
  });

  it("string vazia retorna vazia", () => {
    expect(normalizeSearchTerm("")).toBe("");
  });

  it("string apenas espaços retorna vazia", () => {
    expect(normalizeSearchTerm("   ")).toBe("");
  });

  it("Não altera texto já normalizado", () => {
    expect(normalizeSearchTerm("joao silva")).toBe("joao silva");
  });

  it("remove múltiplos tipos de acentos", () => {
    expect(normalizeSearchTerm("Íáàâäéêíóôõú")).toBe("aaaaaeeiooou");
  });
});

// ============================================================
// includesNormalized
// ============================================================
describe("includesNormalized", () => {
  it("encontra texto com acento usando busca sem acento", () => {
    expect(includesNormalized("JoÍo Silva", "joao")).toBe(true);
  });

  it("busca case insensitive (termo deve ser pré-normalizado)", () => {
    // A função normaliza o texto mas Não o termo — callers normalizam o termo antes
    expect(includesNormalized("Pedro Santos", "pedro")).toBe(true);
  });

  it("retorna true se termo vazio (mostra tudo)", () => {
    expect(includesNormalized("qualquer texto", "")).toBe(true);
  });

  it("retorna false para text null", () => {
    expect(includesNormalized(null, "busca")).toBe(false);
  });

  it("retorna false para text undefined", () => {
    expect(includesNormalized(undefined, "busca")).toBe(false);
  });

  it("retorna false quando texto Não contém o termo", () => {
    expect(includesNormalized("JoÍo Silva", "carlos")).toBe(false);
  });

  it("funciona com cedilha no texto", () => {
    expect(includesNormalized("Construção Civil", "construcao")).toBe(true);
  });

  it("encontra substring no meio do texto", () => {
    expect(includesNormalized("Projeto Arquitetônico Premium", "arquitetonico")).toBe(true);
  });

  it("termo com acento deve ser normalizado pelo caller antes", () => {
    // includesNormalized Não normaliza o termo; caller deve chamar normalizeSearchTerm no termo
    expect(includesNormalized("Joao Silva", "joao")).toBe(true);
  });

  it("retorna false para string vazia como texto", () => {
    expect(includesNormalized("", "busca")).toBe(false);
  });
});

