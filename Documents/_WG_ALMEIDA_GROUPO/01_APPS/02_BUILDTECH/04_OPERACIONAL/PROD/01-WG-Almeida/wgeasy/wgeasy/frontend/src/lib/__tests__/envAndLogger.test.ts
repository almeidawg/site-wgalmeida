// ============================================================
// TESTES — envValidation.ts (validateEnv)
// ============================================================

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ============================================================
// Helpers
// ============================================================

function _mockEnv(vars: Record<string, string | undefined>) {
  const original = { ...import.meta.env };
  Object.assign(import.meta.env, vars);
  return () => {
    // Restaurar
    for (const key of Object.keys(vars)) {
      if (key in original) {
        (import.meta.env as Record<string, string | undefined>)[key] = original[key as keyof typeof original] as string | undefined;
      } else {
        delete (import.meta.env as Record<string, string | undefined>)[key];
      }
    }
  };
}

// ============================================================
// logger.ts
// ============================================================

describe("logger", () => {
  it("pode ser importado sem erro", async () => {
    const { logger } = await import("@/lib/logger");
    expect(logger).toBeDefined();
    expect(typeof logger.debug).toBe("function");
    expect(typeof logger.info).toBe("function");
    expect(typeof logger.warn).toBe("function");
    expect(typeof logger.error).toBe("function");
  });

  it("logger.debug não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.debug("teste debug")).not.toThrow();
  });

  it("logger.info não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.info("teste info")).not.toThrow();
  });

  it("logger.warn não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.warn("teste aviso")).not.toThrow();
  });

  it("logger.error não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.error("teste erro")).not.toThrow();
  });

  it("logger.component não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.component("TestComponent", "mount", { id: 1 })).not.toThrow();
  });

  it("logger.api não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.api("GET", "/api/test", { page: 1 })).not.toThrow();
  });

  it("logger.perf não lança exceçÍo", async () => {
    const { logger } = await import("@/lib/logger");
    expect(() => logger.perf("carregarClientes", Date.now() - 50)).not.toThrow();
  });

  it("disableConsoleInProduction pode ser chamada sem erro", async () => {
    const { disableConsoleInProduction } = await import("@/lib/logger");
    expect(() => disableConsoleInProduction()).not.toThrow();
  });
});

// ============================================================
// envValidation.ts
// ============================================================

describe("envValidation", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("pode ser importado sem erro", async () => {
    const mod = await import("@/lib/envValidation");
    expect(typeof mod.validateEnv).toBe("function");
  });

  it("validateEnv executa sem lançar em ambiente de teste", async () => {
    const { validateEnv } = await import("@/lib/envValidation");
    // Em vitest, import.meta.env.DEV = true, entÍo não deve lançar
    expect(() => validateEnv()).not.toThrow();
  });
});


