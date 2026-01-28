-- Criar tabela propostas_solicitadas para o formulário de solicitação de propostas
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.propostas_solicitadas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  telefone VARCHAR(50),
  tipo_imovel VARCHAR(255),
  area_aproximada VARCHAR(100),
  descricao_projeto TEXT,
  origem VARCHAR(100) DEFAULT 'site',
  status VARCHAR(50) DEFAULT 'nova',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.propostas_solicitadas ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT de qualquer usuário (anônimo ou autenticado)
CREATE POLICY "Permitir insert de propostas" ON public.propostas_solicitadas
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir SELECT apenas para usuários autenticados (admin)
CREATE POLICY "Permitir select para autenticados" ON public.propostas_solicitadas
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_propostas_solicitadas_email ON public.propostas_solicitadas(email);
CREATE INDEX IF NOT EXISTS idx_propostas_solicitadas_status ON public.propostas_solicitadas(status);
CREATE INDEX IF NOT EXISTS idx_propostas_solicitadas_created ON public.propostas_solicitadas(created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_propostas_solicitadas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_propostas_solicitadas_updated_at
  BEFORE UPDATE ON public.propostas_solicitadas
  FOR EACH ROW
  EXECUTE FUNCTION update_propostas_solicitadas_updated_at();

-- Comentário na tabela
COMMENT ON TABLE public.propostas_solicitadas IS 'Propostas solicitadas via formulário do site';
