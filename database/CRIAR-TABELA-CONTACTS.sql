-- Criar tabela contacts para o formulário de contato
-- Execute este SQL no Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

-- Política para permitir INSERT de qualquer usuário (anônimo ou autenticado)
CREATE POLICY "Permitir insert de contatos" ON public.contacts
  FOR INSERT
  WITH CHECK (true);

-- Política para permitir SELECT apenas para usuários autenticados (admin)
CREATE POLICY "Permitir select para autenticados" ON public.contacts
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_created ON public.contacts(created_at DESC);

-- Comentário na tabela
COMMENT ON TABLE public.contacts IS 'Contatos recebidos via formulário do site';
