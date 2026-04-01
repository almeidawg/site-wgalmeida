import { describe, it, expect } from "vitest";
import { calcularCriticalPath, type TaskNode } from "../criticalPath";

// ============================================================
// calcularCriticalPath — caminho crítico CPM
// ============================================================

const task = (id: string, inicio: string, fim: string, depende_de?: string[]): TaskNode => ({
  id, titulo: `Task ${id}`, inicio, fim, depende_de,
});

describe("calcularCriticalPath", () => {
  it("lista vazia retorna valores padrÍo", () => {
    const r = calcularCriticalPath([]);
    expect(r.caminhoCritico).toEqual([]);
    expect(r.duracaoProjeto).toBe(-Infinity);
  });

  it("task única: é o caminho crítico", () => {
    const tasks = [task("A", "2026-03-01", "2026-03-05")]; // 4 dias
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toContain("A");
    expect(r.duracaoProjeto).toBe(4);
  });

  it("duas tasks sem dependência: ambas sÍo críticas", () => {
    const tasks = [
      task("A", "2026-03-01", "2026-03-05"), // 4 dias
      task("B", "2026-03-01", "2026-03-05"), // 4 dias
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toContain("A");
    expect(r.caminhoCritico).toContain("B");
  });

  it("cadeia sequencial: todas as tasks sÍo críticas", () => {
    const tasks = [
      task("A", "2026-03-01", "2026-03-03"), // 2 dias
      task("B", "2026-03-03", "2026-03-06", ["A"]), // 3 dias
      task("C", "2026-03-06", "2026-03-10", ["B"]), // 4 dias
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toEqual(["A", "B", "C"]);
    expect(r.duracaoProjeto).toBe(9);
  });

  it("slack zero = task no caminho crítico", () => {
    const tasks = [
      task("A", "2026-03-01", "2026-03-11"), // 10 dias — longa
      task("B", "2026-03-01", "2026-03-04"), // 3 dias — curta (tem folga)
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toContain("A");
    expect(r.mapaSlack["A"]).toBe(0);
    expect(r.mapaSlack["B"]).toBeGreaterThan(0);
  });

  it("caminho paralelo: só o mais longo é crítico", () => {
    // A → C (4+5=9 dias) e B → C (2+5=7 dias) — A é o gargalo
    const tasks = [
      task("A", "2026-03-01", "2026-03-05"), // 4 dias
      task("B", "2026-03-01", "2026-03-03"), // 2 dias
      task("C", "2026-03-05", "2026-03-10", ["A", "B"]), // 5 dias
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toContain("A");
    expect(r.caminhoCritico).toContain("C");
    expect(r.caminhoCritico).not.toContain("B");
  });

  it("duracaoProjeto é a maior soma de earliestFinish", () => {
    const tasks = [
      task("A", "2026-03-01", "2026-03-08"), // 7 dias
      task("B", "2026-03-01", "2026-03-04"), // 3 dias
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.duracaoProjeto).toBe(7);
  });

  it("mapaSlack contém todas as tasks", () => {
    const tasks = [
      task("X", "2026-03-01", "2026-03-03"),
      task("Y", "2026-03-01", "2026-03-06"),
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.mapaSlack).toHaveProperty("X");
    expect(r.mapaSlack).toHaveProperty("Y");
  });

  it("slack nunca é negativo", () => {
    const tasks = [
      task("A", "2026-03-01", "2026-03-05"),
      task("B", "2026-03-05", "2026-03-08", ["A"]),
      task("C", "2026-03-01", "2026-03-03"),
    ];
    const r = calcularCriticalPath(tasks);
    Object.values(r.mapaSlack).forEach((s) => {
      expect(s).toBeGreaterThanOrEqual(0);
    });
  });

  it("retorna arrays e objetos (não undefined)", () => {
    const tasks = [task("A", "2026-03-01", "2026-03-02")];
    const r = calcularCriticalPath(tasks);
    expect(Array.isArray(r.caminhoCritico)).toBe(true);
    expect(typeof r.duracaoProjeto).toBe("number");
    expect(typeof r.mapaSlack).toBe("object");
  });

  it("task com mesmo início e fim tem duraçÍo mínima 1", () => {
    const tasks = [task("A", "2026-03-01", "2026-03-01")]; // 0 dias → forçado para 1
    const r = calcularCriticalPath(tasks);
    expect(r.duracaoProjeto).toBe(1);
  });

  it("projeto realista: fundaçÍo → estrutura → acabamento", () => {
    const tasks = [
      task("fundacao",   "2026-03-01", "2026-03-31"),              // 30 dias
      task("estrutura",  "2026-03-31", "2026-05-15", ["fundacao"]), // 45 dias
      task("acabamento", "2026-05-15", "2026-06-14", ["estrutura"]), // 30 dias
    ];
    const r = calcularCriticalPath(tasks);
    expect(r.caminhoCritico).toEqual(["fundacao", "estrutura", "acabamento"]);
    expect(r.duracaoProjeto).toBe(105);
  });
});


