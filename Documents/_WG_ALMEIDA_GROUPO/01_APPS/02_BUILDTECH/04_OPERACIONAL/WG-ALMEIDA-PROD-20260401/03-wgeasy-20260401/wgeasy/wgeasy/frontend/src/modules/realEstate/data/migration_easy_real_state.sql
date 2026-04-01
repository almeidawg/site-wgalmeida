-- ─── EasyRealState — Migration ───────────────────────────────────────────────
-- Apliar via: Supabase SQL Editor ou curl REST API
-- Prefixo: ers_ (Easy Real State)

-- Transações imobiliárias (base de dados de mercado)
CREATE TABLE IF NOT EXISTS real_estate_transacoes (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endereco        text NOT NULL,
  cep             text NOT NULL,
  bairro          text NOT NULL,
  cidade          text NOT NULL,
  estado          char(2) NOT NULL,
  lat             double precision NOT NULL,
  lng             double precision NOT NULL,
  area_m2         numeric(10,2) NOT NULL,
  valor           numeric(14,2) NOT NULL,
  preco_m2        numeric(10,2) NOT NULL GENERATED ALWAYS AS (valor / NULLIF(area_m2, 0)) STORED,
  data            date NOT NULL,
  tipo            text NOT NULL CHECK (tipo IN ('apartamento','casa','comercial','terreno','galpao')),
  tipo_transacao  text NOT NULL DEFAULT 'venda' CHECK (tipo_transacao IN ('venda','locacao')),
  andar           int,
  quartos         int,
  vagas           int,
  padrao          text CHECK (padrao IN ('popular','medio','alto','luxo')),
  fonte           text NOT NULL DEFAULT 'manual' CHECK (fonte IN ('itbi','mercado','cartorio','manual')),
  confianca       int DEFAULT 80 CHECK (confianca BETWEEN 0 AND 100),
  tenant_id       uuid REFERENCES saas_tenants(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- Imóveis cadastrados para avaliação
CREATE TABLE IF NOT EXISTS real_estate_imoveis (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endereco        text NOT NULL,
  cep             text NOT NULL,
  bairro          text,
  cidade          text,
  estado          char(2),
  lat             double precision,
  lng             double precision,
  area_m2         numeric(10,2) NOT NULL,
  area_util       numeric(10,2),
  tipo            text NOT NULL CHECK (tipo IN ('apartamento','casa','comercial','terreno','galpao')),
  padrao          text NOT NULL DEFAULT 'medio' CHECK (padrao IN ('popular','medio','alto','luxo')),
  ano_construcao  int,
  quartos         int,
  banheiros       int,
  vagas           int,
  andar           int,
  total_andares   int,
  tem_vista       boolean DEFAULT false,
  reformado       boolean DEFAULT false,
  tenant_id       uuid REFERENCES saas_tenants(id) ON DELETE CASCADE,
  criado_por      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em       timestamptz DEFAULT now(),
  atualizado_em   timestamptz DEFAULT now()
);

-- Cache de radar de preço por CEP (atualizado periodicamente)
CREATE TABLE IF NOT EXISTS real_estate_radar_cache (
  cep                   text PRIMARY KEY,
  bairro                text,
  cidade                text,
  estado                char(2),
  lat                   double precision,
  lng                   double precision,
  preco_m2_mediana      numeric(10,2),
  preco_m2_media        numeric(10,2),
  preco_m2_min          numeric(10,2),
  preco_m2_max          numeric(10,2),
  total_transacoes      int DEFAULT 0,
  periodo_analise_meses int DEFAULT 12,
  liquidez_media_dias   int,
  tendencia             text DEFAULT 'estavel' CHECK (tendencia IN ('alta','estavel','queda')),
  variacao_12m          numeric(6,2),
  ultima_atualizacao    timestamptz DEFAULT now()
);

-- Histórico de avaliações AVM
CREATE TABLE IF NOT EXISTS real_estate_avaliacoes (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id             uuid REFERENCES real_estate_imoveis(id) ON DELETE CASCADE,
  preco_m2_base         numeric(10,2),
  preco_m2_ajustado     numeric(10,2),
  preco_total_estimado  numeric(14,2),
  faixa_minima          numeric(14,2),
  faixa_maxima          numeric(14,2),
  score_confianca       int,
  total_comparaveis     int,
  fatores               jsonb,
  insight_label         text,
  insight_descricao     text,
  insight_desvio        numeric(6,2),
  tenant_id             uuid REFERENCES saas_tenants(id) ON DELETE SET NULL,
  criado_por            uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  criado_em             timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transacoes_geo ON real_estate_transacoes (lat, lng);
CREATE INDEX IF NOT EXISTS idx_transacoes_cep ON real_estate_transacoes (cep);
CREATE INDEX IF NOT EXISTS idx_transacoes_tipo ON real_estate_transacoes (tipo, tipo_transacao);
CREATE INDEX IF NOT EXISTS idx_transacoes_data ON real_estate_transacoes (data DESC);
CREATE INDEX IF NOT EXISTS idx_imoveis_tenant ON real_estate_imoveis (tenant_id);
CREATE INDEX IF NOT EXISTS idx_avaliacoes_imovel ON real_estate_avaliacoes (imovel_id);

-- RLS
ALTER TABLE real_estate_transacoes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_imoveis     ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_avaliacoes  ENABLE ROW LEVEL SECURITY;

-- Policies básicas (ajustar conforme RBAC do WGEasy)
CREATE POLICY "transacoes_leitura_autenticados" ON real_estate_transacoes
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "imoveis_tenant_isolation" ON real_estate_imoveis
  FOR ALL USING (
    tenant_id IS NULL OR
    tenant_id IN (
      SELECT id FROM saas_tenants WHERE id = tenant_id
    )
  );

-- Função: atualizar cache de radar por CEP
CREATE OR REPLACE FUNCTION real_estate_atualizar_radar(p_cep text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO real_estate_radar_cache (
    cep, preco_m2_mediana, preco_m2_media, preco_m2_min,
    preco_m2_max, total_transacoes, ultima_atualizacao
  )
  SELECT
    cep,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY preco_m2) AS mediana,
    AVG(preco_m2)  AS media,
    MIN(preco_m2)  AS minimo,
    MAX(preco_m2)  AS maximo,
    COUNT(*)       AS total,
    NOW()
  FROM real_estate_transacoes
  WHERE cep = p_cep
    AND data >= NOW() - INTERVAL '24 months'
  GROUP BY cep
  ON CONFLICT (cep) DO UPDATE SET
    preco_m2_mediana   = EXCLUDED.preco_m2_mediana,
    preco_m2_media     = EXCLUDED.preco_m2_media,
    preco_m2_min       = EXCLUDED.preco_m2_min,
    preco_m2_max       = EXCLUDED.preco_m2_max,
    total_transacoes   = EXCLUDED.total_transacoes,
    ultima_atualizacao = NOW();
END;
$$;
