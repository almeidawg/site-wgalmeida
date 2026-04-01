// ─── Mock de Transações para alimentar o AVM em demonstração ─────────────────
// Baseado em dados reais de mercado imobiliário SP/RJ — Mar/2026
// Fonte: ITBI-SP (dados públicos), ZAP Imóveis, DataZap, Bel Radar benchmark
// Use para popular o Supabase antes de ter integração real com ITBI

import type { Transacao } from "../models/types";

// ─── São Paulo — Pinheiros / Vila Madalena / Jardins ─────────────────────────
export const MOCK_TRANSACOES_SP: Transacao[] = [
  // Pinheiros
  { id: "t001", endereco: "Rua dos Pinheiros, 120", cep: "05422010", bairro: "Pinheiros", cidade: "São Paulo", estado: "SP", lat: -23.5632, lng: -46.6847, area_m2: 72, valor: 864000, preco_m2: 12000, data: "2026-02-10", tipo: "apartamento", tipo_transacao: "venda", andar: 4, quartos: 2, vagas: 1, padrao: "alto", fonte: "itbi", confianca: 95 },
  { id: "t002", endereco: "Rua Wisard, 45", cep: "05434080", bairro: "Vila Madalena", cidade: "São Paulo", estado: "SP", lat: -23.5578, lng: -46.6935, area_m2: 55, valor: 660000, preco_m2: 12000, data: "2026-01-22", tipo: "apartamento", tipo_transacao: "venda", andar: 2, quartos: 1, vagas: 1, padrao: "alto", fonte: "itbi", confianca: 90 },
  { id: "t003", endereco: "Rua Teodoro Sampaio, 890", cep: "05405150", bairro: "Pinheiros", cidade: "São Paulo", estado: "SP", lat: -23.5649, lng: -46.6802, area_m2: 90, valor: 1080000, preco_m2: 12000, data: "2025-12-15", tipo: "apartamento", tipo_transacao: "venda", andar: 7, quartos: 3, vagas: 2, padrao: "alto", fonte: "itbi", confianca: 92 },
  { id: "t004", endereco: "Rua Fradique Coutinho, 200", cep: "05416010", bairro: "Vila Madalena", cidade: "São Paulo", estado: "SP", lat: -23.5601, lng: -46.6921, area_m2: 48, valor: 528000, preco_m2: 11000, data: "2026-02-28", tipo: "apartamento", tipo_transacao: "venda", andar: 1, quartos: 1, vagas: 0, padrao: "medio", fonte: "mercado", confianca: 80 },
  { id: "t005", endereco: "Alameda Franca, 1200", cep: "01422001", bairro: "Jardim Paulista", cidade: "São Paulo", estado: "SP", lat: -23.5718, lng: -46.6609, area_m2: 120, valor: 1920000, preco_m2: 16000, data: "2026-01-08", tipo: "apartamento", tipo_transacao: "venda", andar: 12, quartos: 3, vagas: 2, padrao: "luxo", fonte: "cartorio", confianca: 98 },

  // Moema / Itaim
  { id: "t006", endereco: "Rua Ministro Jesuino Cardoso, 100", cep: "04532050", bairro: "Itaim Bibi", cidade: "São Paulo", estado: "SP", lat: -23.5875, lng: -46.6742, area_m2: 85, valor: 1487500, preco_m2: 17500, data: "2026-03-05", tipo: "apartamento", tipo_transacao: "venda", andar: 8, quartos: 2, vagas: 2, padrao: "luxo", fonte: "itbi", confianca: 96 },
  { id: "t007", endereco: "Av. Ibirapuera, 2000", cep: "04029200", bairro: "Moema", cidade: "São Paulo", estado: "SP", lat: -23.5983, lng: -46.6695, area_m2: 110, valor: 1650000, preco_m2: 15000, data: "2026-02-14", tipo: "apartamento", tipo_transacao: "venda", andar: 10, quartos: 3, vagas: 2, padrao: "alto", fonte: "itbi", confianca: 94 },
  { id: "t008", endereco: "Rua Sena Madureira, 300", cep: "04021060", bairro: "Moema", cidade: "São Paulo", estado: "SP", lat: -23.5962, lng: -46.6651, area_m2: 68, valor: 918000, preco_m2: 13500, data: "2025-11-20", tipo: "apartamento", tipo_transacao: "venda", andar: 5, quartos: 2, vagas: 1, padrao: "alto", fonte: "mercado", confianca: 82 },

  // Vila Olímpia / Brooklin
  { id: "t009", endereco: "Rua Olimpíadas, 200", cep: "04551000", bairro: "Vila Olímpia", cidade: "São Paulo", estado: "SP", lat: -23.5965, lng: -46.6887, area_m2: 65, valor: 877500, preco_m2: 13500, data: "2026-01-30", tipo: "apartamento", tipo_transacao: "venda", andar: 6, quartos: 2, vagas: 1, padrao: "alto", fonte: "itbi", confianca: 91 },
  { id: "t010", endereco: "Av. das Nações Unidas, 14000", cep: "04794000", bairro: "Brooklin", cidade: "São Paulo", estado: "SP", lat: -23.6134, lng: -46.6981, area_m2: 95, valor: 950000, preco_m2: 10000, data: "2026-03-01", tipo: "apartamento", tipo_transacao: "venda", andar: 3, quartos: 3, vagas: 2, padrao: "medio", fonte: "itbi", confianca: 88 },

  // Santana / Tatuapé (médio padrão)
  { id: "t011", endereco: "Av. Braz Leme, 1500", cep: "02511001", bairro: "Santana", cidade: "São Paulo", estado: "SP", lat: -23.4856, lng: -46.6235, area_m2: 62, valor: 496000, preco_m2: 8000, data: "2026-02-07", tipo: "apartamento", tipo_transacao: "venda", andar: 3, quartos: 2, vagas: 1, padrao: "medio", fonte: "itbi", confianca: 87 },
  { id: "t012", endereco: "Rua Domingos Agostinho, 400", cep: "03315000", bairro: "Tatuapé", cidade: "São Paulo", estado: "SP", lat: -23.5384, lng: -46.5755, area_m2: 70, valor: 490000, preco_m2: 7000, data: "2025-12-10", tipo: "apartamento", tipo_transacao: "venda", andar: 2, quartos: 2, vagas: 1, padrao: "medio", fonte: "mercado", confianca: 79 },

  // Casas SP
  { id: "t013", endereco: "Rua Groenlândia, 50", cep: "01449050", bairro: "Jardim América", cidade: "São Paulo", estado: "SP", lat: -23.5689, lng: -46.6651, area_m2: 350, valor: 7000000, preco_m2: 20000, data: "2026-01-15", tipo: "casa", tipo_transacao: "venda", padrao: "luxo", fonte: "cartorio", confianca: 97 },
  { id: "t014", endereco: "Rua Mourato Coelho, 800", cep: "05417011", bairro: "Vila Madalena", cidade: "São Paulo", estado: "SP", lat: -23.5611, lng: -46.6893, area_m2: 180, valor: 2160000, preco_m2: 12000, data: "2026-02-20", tipo: "casa", tipo_transacao: "venda", padrao: "alto", fonte: "itbi", confianca: 90 },
];

// ─── Rio de Janeiro — Ipanema / Leblon / Botafogo ─────────────────────────────
export const MOCK_TRANSACOES_RJ: Transacao[] = [
  // Ipanema — referência Bel Radar (314k propriedades cadastradas)
  { id: "t101", endereco: "Rua Visconde de Pirajá, 414", cep: "22410002", bairro: "Ipanema", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9836, lng: -43.2010, area_m2: 80, valor: 1600000, preco_m2: 20000, data: "2026-02-15", tipo: "apartamento", tipo_transacao: "venda", andar: 6, quartos: 3, vagas: 1, padrao: "luxo", fonte: "cartorio", confianca: 97 },
  { id: "t102", endereco: "Rua Farme de Amoedo, 60", cep: "22420020", bairro: "Ipanema", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9872, lng: -43.1988, area_m2: 65, valor: 1170000, preco_m2: 18000, data: "2026-01-28", tipo: "apartamento", tipo_transacao: "venda", andar: 3, quartos: 2, vagas: 1, padrao: "luxo", fonte: "itbi", confianca: 95 },
  { id: "t103", endereco: "Av. Vieira Souto, 200", cep: "22420002", bairro: "Ipanema", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9855, lng: -43.1975, area_m2: 150, valor: 3600000, preco_m2: 24000, data: "2026-03-10", tipo: "apartamento", tipo_transacao: "venda", andar: 8, quartos: 4, vagas: 2, padrao: "luxo", fonte: "cartorio", confianca: 98, },

  // Leblon
  { id: "t104", endereco: "Av. Delfim Moreira, 500", cep: "22441000", bairro: "Leblon", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9858, lng: -43.2249, area_m2: 120, valor: 2880000, preco_m2: 24000, data: "2026-02-05", tipo: "apartamento", tipo_transacao: "venda", andar: 10, quartos: 3, vagas: 2, padrao: "luxo", fonte: "cartorio", confianca: 99 },
  { id: "t105", endereco: "Rua Dias Ferreira, 300", cep: "22431050", bairro: "Leblon", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9840, lng: -43.2270, area_m2: 75, valor: 1650000, preco_m2: 22000, data: "2025-12-20", tipo: "apartamento", tipo_transacao: "venda", andar: 4, quartos: 2, vagas: 1, padrao: "luxo", fonte: "itbi", confianca: 94 },

  // Botafogo / Flamengo
  { id: "t106", endereco: "Rua Voluntários da Pátria, 100", cep: "22270010", bairro: "Botafogo", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9502, lng: -43.1875, area_m2: 70, valor: 770000, preco_m2: 11000, data: "2026-01-10", tipo: "apartamento", tipo_transacao: "venda", andar: 5, quartos: 2, vagas: 1, padrao: "medio", fonte: "itbi", confianca: 86 },
  { id: "t107", endereco: "Praia do Flamengo, 200", cep: "22210030", bairro: "Flamengo", cidade: "Rio de Janeiro", estado: "RJ", lat: -22.9281, lng: -43.1754, area_m2: 90, valor: 1080000, preco_m2: 12000, data: "2026-02-25", tipo: "apartamento", tipo_transacao: "venda", andar: 7, quartos: 3, vagas: 1, padrao: "alto", fonte: "itbi", confianca: 89 },

  // Barra da Tijuca
  { id: "t108", endereco: "Av. das Américas, 3500", cep: "22640102", bairro: "Barra da Tijuca", cidade: "Rio de Janeiro", estado: "RJ", lat: -23.0003, lng: -43.3656, area_m2: 95, valor: 760000, preco_m2: 8000, data: "2026-03-08", tipo: "apartamento", tipo_transacao: "venda", andar: 4, quartos: 3, vagas: 2, padrao: "medio", fonte: "mercado", confianca: 80 },
  { id: "t109", endereco: "Av. Lúcio Costa, 1000", cep: "22620171", bairro: "Barra da Tijuca", cidade: "Rio de Janeiro", estado: "RJ", lat: -23.0090, lng: -43.3124, area_m2: 200, valor: 4000000, preco_m2: 20000, data: "2026-01-20", tipo: "apartamento", tipo_transacao: "venda", andar: 15, quartos: 4, vagas: 3, padrao: "luxo", fonte: "cartorio", confianca: 96 },
];

// Todos juntos
export const MOCK_TRANSACOES_ALL: Transacao[] = [
  ...MOCK_TRANSACOES_SP,
  ...MOCK_TRANSACOES_RJ,
];

// ─── SQL de INSERT para popular o Supabase de uma vez ─────────────────────────
// Cole no SQL Editor do Supabase após aplicar a migration_easy_real_state.sql

export function gerarInsertSQL(transacoes: Transacao[]): string {
  const rows = transacoes.map((t) => `(
    '${t.id}', '${t.endereco}', '${t.cep}', '${t.bairro}', '${t.cidade}', '${t.estado}',
    ${t.lat}, ${t.lng}, ${t.area_m2}, ${t.valor}, '${t.data}',
    '${t.tipo}', '${t.tipo_transacao}', ${t.andar ?? "NULL"}, ${t.quartos ?? "NULL"}, ${t.vagas ?? "NULL"},
    '${t.padrao ?? "medio"}', '${t.fonte}', ${t.confianca}
  )`).join(",\n");

  return `INSERT INTO real_estate_transacoes
  (id, endereco, cep, bairro, cidade, estado, lat, lng, area_m2, valor, data,
   tipo, tipo_transacao, andar, quartos, vagas, padrao, fonte, confianca)
VALUES
${rows}
ON CONFLICT (id) DO NOTHING;`;
}
