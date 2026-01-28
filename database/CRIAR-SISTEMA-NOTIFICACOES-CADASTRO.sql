-- =====================================================
-- SISTEMA DE NOTIFICACOES PARA NOVOS CADASTROS
-- Grupo WG Almeida - Site Institucional
-- =====================================================

-- 1. Criar tabela de cadastros pendentes
CREATE TABLE IF NOT EXISTS public.pending_registrations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'rejeitado')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES auth.users(id),
    notes TEXT
);

-- 2. Criar indice para consultas rapidas
CREATE INDEX IF NOT EXISTS idx_pending_registrations_status
ON public.pending_registrations(status);

CREATE INDEX IF NOT EXISTS idx_pending_registrations_created
ON public.pending_registrations(created_at DESC);

-- 3. Habilitar RLS
ALTER TABLE public.pending_registrations ENABLE ROW LEVEL SECURITY;

-- 4. Politicas de acesso
-- Usuarios autenticados podem ver seus proprios registros
CREATE POLICY "Usuarios podem ver seus cadastros"
ON public.pending_registrations FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

-- Qualquer um pode inserir (para registro publico)
CREATE POLICY "Usuarios podem registrar"
ON public.pending_registrations FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Usuarios autenticados podem atualizar seus proprios registros
CREATE POLICY "Usuarios podem atualizar seus cadastros"
ON public.pending_registrations FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR email = auth.jwt()->>'email');

-- 5. Tabela de configuracoes de notificacao
CREATE TABLE IF NOT EXISTS public.notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Inserir configuracoes padrao
INSERT INTO public.notification_settings (setting_key, setting_value, description) VALUES
('admin_email', 'contato@wgalmeida.com.br', 'Email do administrador para notificacoes'),
('daily_summary_enabled', 'true', 'Habilitar resumo diario'),
('daily_summary_time', '08:00', 'Horario do resumo diario (UTC-3)')
ON CONFLICT (setting_key) DO NOTHING;

-- 7. View para resumo de atividades do dia
CREATE OR REPLACE VIEW public.daily_activity_summary AS
SELECT
    'Novos Cadastros' as tipo,
    COUNT(*) as quantidade,
    json_agg(json_build_object(
        'nome', nome,
        'email', email,
        'data', created_at
    ) ORDER BY created_at DESC) as detalhes
FROM public.pending_registrations
WHERE created_at >= CURRENT_DATE
AND created_at < CURRENT_DATE + INTERVAL '1 day'
GROUP BY 1;

-- 8. Funcao para obter resumo do dia
CREATE OR REPLACE FUNCTION public.get_daily_summary()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'data', CURRENT_DATE,
        'cadastros_pendentes', (
            SELECT COUNT(*) FROM public.pending_registrations
            WHERE status = 'pendente'
        ),
        'cadastros_hoje', (
            SELECT COUNT(*) FROM public.pending_registrations
            WHERE created_at >= CURRENT_DATE
        ),
        'atividades', (
            SELECT json_agg(row_to_json(d))
            FROM public.daily_activity_summary d
        )
    ) INTO result;

    RETURN result;
END;
$$;

-- 9. Grant para funcao
GRANT EXECUTE ON FUNCTION public.get_daily_summary() TO authenticated;

-- =====================================================
-- INSTRUCOES PARA CONFIGURAR EMAIL:
--
-- OPCAO 1: Usar Supabase Edge Functions (Recomendado)
-- 1. Criar Edge Function para enviar emails
-- 2. Configurar webhook no Supabase para chamar a funcao
--
-- OPCAO 2: Usar pg_net (extensao do Supabase)
-- 1. Habilitar extensao pg_net
-- 2. Criar trigger que faz POST para servico de email
--
-- OPCAO 3: Usar servico externo (Resend, SendGrid)
-- 1. Criar conta no servico de email
-- 2. Configurar API key nas Edge Functions
-- =====================================================

COMMENT ON TABLE public.pending_registrations IS 'Cadastros pendentes de aprovacao do site';
COMMENT ON TABLE public.notification_settings IS 'Configuracoes de notificacoes do sistema';
