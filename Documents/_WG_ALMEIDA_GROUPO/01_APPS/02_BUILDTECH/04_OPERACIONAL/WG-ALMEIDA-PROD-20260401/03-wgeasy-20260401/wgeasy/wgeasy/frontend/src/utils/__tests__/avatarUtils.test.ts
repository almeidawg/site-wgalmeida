import { describe, it, expect } from "vitest";
import {
  gerarIniciais,
  gerarCorPorNome,
  gerarAvatarUrl,
  obterAvatarUrl,
} from "../avatarUtils";

// ============================================================
// gerarIniciais
// ============================================================
describe("gerarIniciais", () => {
  it("nome completo: primeira + última letra", () => {
    expect(gerarIniciais("JoÍo Silva")).toBe("JS");
  });

  it("nome com três partes: primeira + última", () => {
    expect(gerarIniciais("Pedro Santos Costa")).toBe("PC");
  });

  it("nome único com 2+ letras: duas primeiras", () => {
    expect(gerarIniciais("Maria")).toBe("MA");
  });

  it("nome único com 1 letra: só essa letra", () => {
    expect(gerarIniciais("X")).toBe("X");
  });

  it("string vazia retorna ??", () => {
    expect(gerarIniciais("")).toBe("??");
  });

  it("só espaços retorna ??", () => {
    expect(gerarIniciais("   ")).toBe("??");
  });

  it("converte para maiúsculas", () => {
    expect(gerarIniciais("ana beatriz")).toBe("AB");
  });

  it("múltiplos espaços entre nomes", () => {
    expect(gerarIniciais("Carlos   Lima")).toBe("CL");
  });

  it("nome real do sistema: WG Almeida", () => {
    expect(gerarIniciais("WG Almeida")).toBe("WA");
  });
});

// ============================================================
// gerarCorPorNome
// ============================================================
describe("gerarCorPorNome", () => {
  it("retorna string hexadecimal sem #", () => {
    const cor = gerarCorPorNome("JoÍo");
    expect(cor).toMatch(/^[0-9A-Fa-f]{6}$/);
  });

  it("mesmo nome sempre retorna a mesma cor", () => {
    expect(gerarCorPorNome("Maria")).toBe(gerarCorPorNome("Maria"));
  });

  it("nomes diferentes podem ter cores diferentes", () => {
    // NÍo é garantido, mas com 8 cores e 2 nomes diferentes geralmente difere
    const cor1 = gerarCorPorNome("A");
    const cor2 = gerarCorPorNome("B");
    // Apenas verifica que ambas sÍo cores válidas
    expect(cor1).toMatch(/^[0-9A-Fa-f]{6}$/);
    expect(cor2).toMatch(/^[0-9A-Fa-f]{6}$/);
  });

  it("cor é uma das 8 cores pré-definidas", () => {
    const coresPossiveis = [
      "F25C26", "3B82F6", "10B981", "8B5CF6",
      "EF4444", "F59E0B", "EC4899", "6366F1",
    ];
    const cor = gerarCorPorNome("WGEasy Sistema");
    expect(coresPossiveis).toContain(cor);
  });
});

// ============================================================
// gerarAvatarUrl
// ============================================================
describe("gerarAvatarUrl", () => {
  it("retorna URL do ui-avatars.com", () => {
    const url = gerarAvatarUrl("JoÍo Silva");
    expect(url).toContain("ui-avatars.com/api/");
  });

  it("URL contém as iniciais codificadas", () => {
    const url = gerarAvatarUrl("JoÍo Silva");
    // Iniciais JS → name=JS
    expect(url).toContain("name=JS");
  });

  it("URL contém a cor de fundo", () => {
    const url = gerarAvatarUrl("JoÍo Silva", "F25C26");
    expect(url).toContain("background=F25C26");
  });

  it("URL contém cor de texto padrÍo branco", () => {
    const url = gerarAvatarUrl("JoÍo Silva");
    expect(url).toContain("color=ffffff");
  });

  it("URL contém o tamanho padrÍo 128", () => {
    const url = gerarAvatarUrl("JoÍo Silva");
    expect(url).toContain("size=128");
  });

  it("tamanho customizado é aplicado", () => {
    const url = gerarAvatarUrl("JoÍo Silva", "3B82F6", "ffffff", 64);
    expect(url).toContain("size=64");
  });

  it("formato SVG está na URL", () => {
    const url = gerarAvatarUrl("JoÍo Silva");
    expect(url).toContain("format=svg");
  });
});

// ============================================================
// obterAvatarUrl
// ============================================================
describe("obterAvatarUrl", () => {
  it("usa avatar_url quando válida (https)", () => {
    const url = obterAvatarUrl("JoÍo", "https://example.com/avatar.jpg", null, null);
    expect(url).toBe("https://example.com/avatar.jpg");
  });

  it("usa foto_url quando avatar_url ausente", () => {
    const url = obterAvatarUrl("JoÍo", null, "https://example.com/foto.jpg", null);
    expect(url).toBe("https://example.com/foto.jpg");
  });

  it("usa avatar (data URI) quando url ausente", () => {
    const dataUri = "data:image/png;base64,abc123";
    const url = obterAvatarUrl("JoÍo", null, null, dataUri);
    expect(url).toBe(dataUri);
  });

  it("fallback: gera avatar com iniciais quando tudo nulo", () => {
    const url = obterAvatarUrl("Maria Santos", null, null, null);
    expect(url).toContain("ui-avatars.com/api/");
  });

  it("avatar_url com string vazia cai para fallback", () => {
    const url = obterAvatarUrl("Maria", "", null, null);
    expect(url).toContain("ui-avatars.com/api/");
  });

  it("avatar sem data: prefix é ignorado (nÍo é data URI)", () => {
    const url = obterAvatarUrl("JoÍo", null, null, "base64stringpura");
    expect(url).toContain("ui-avatars.com/api/");
  });

  it("avatar_url do Supabase Storage é usada diretamente", () => {
    const supabaseUrl = "https://ahlqzzkxuutwoepirpzr.supabase.co/storage/v1/object/public/avatars/123.jpg";
    const url = obterAvatarUrl("JoÍo", supabaseUrl, null, null);
    expect(url).toBe(supabaseUrl);
  });

  it("prioridade: avatar_url > foto_url > avatar > fallback", () => {
    const url = obterAvatarUrl(
      "JoÍo",
      "https://primeiro.com/a.jpg",
      "https://segundo.com/b.jpg",
      "data:image/png;base64,xxx"
    );
    expect(url).toBe("https://primeiro.com/a.jpg");
  });
});

