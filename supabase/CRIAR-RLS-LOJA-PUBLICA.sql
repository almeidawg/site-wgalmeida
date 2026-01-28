-- ============================================================================
-- RLS POLICIES PARA LOJA PÚBLICA DO SITE
-- Permite acesso anônimo (público) às tabelas de produtos
-- Execute este script no Supabase SQL Editor
-- Data: 2024-12-28
-- ============================================================================

-- ============================================================================
-- PASSO 1: Verificar se RLS está habilitado nas tabelas
-- Se não estiver, as políticas não são necessárias
-- ============================================================================

-- Verificar status atual do RLS
DO $$
DECLARE
    rls_pricelist_itens BOOLEAN;
    rls_pricelist_categorias BOOLEAN;
BEGIN
    SELECT relrowsecurity INTO rls_pricelist_itens
    FROM pg_class WHERE relname = 'pricelist_itens';

    SELECT relrowsecurity INTO rls_pricelist_categorias
    FROM pg_class WHERE relname = 'pricelist_categorias';

    RAISE NOTICE 'RLS pricelist_itens: %', COALESCE(rls_pricelist_itens::text, 'tabela não encontrada');
    RAISE NOTICE 'RLS pricelist_categorias: %', COALESCE(rls_pricelist_categorias::text, 'tabela não encontrada');
END $$;

-- ============================================================================
-- PASSO 2: Habilitar RLS nas tabelas (se necessário)
-- Comente estas linhas se RLS já estiver habilitado
-- ============================================================================

-- ALTER TABLE pricelist_itens ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricelist_categorias ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASSO 3: Remover políticas antigas (se existirem)
-- ============================================================================

DROP POLICY IF EXISTS "pricelist_itens_select_public" ON pricelist_itens;
DROP POLICY IF EXISTS "pricelist_itens_select_anon" ON pricelist_itens;
DROP POLICY IF EXISTS "pricelist_itens_public_read" ON pricelist_itens;
DROP POLICY IF EXISTS "pricelist_categorias_select_public" ON pricelist_categorias;
DROP POLICY IF EXISTS "pricelist_categorias_select_anon" ON pricelist_categorias;
DROP POLICY IF EXISTS "pricelist_categorias_public_read" ON pricelist_categorias;

-- ============================================================================
-- PASSO 4: Criar políticas para acesso público (anônimo)
-- Estas políticas permitem que a loja do site acesse os produtos
-- ============================================================================

-- Política para pricelist_itens: Permite leitura pública de produtos ativos
CREATE POLICY "pricelist_itens_public_read" ON pricelist_itens
    FOR SELECT
    TO anon, authenticated
    USING (
        tipo = 'produto'
        AND ativo = true
    );

-- Política para pricelist_categorias: Permite leitura pública de categorias ativas
CREATE POLICY "pricelist_categorias_public_read" ON pricelist_categorias
    FOR SELECT
    TO anon, authenticated
    USING (
        ativo = true
    );

-- ============================================================================
-- PASSO 5: Verificar políticas criadas
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN ('pricelist_itens', 'pricelist_categorias')
ORDER BY tablename, policyname;

-- ============================================================================
-- ALTERNATIVA: Se RLS estiver causando problemas, desabilitar temporariamente
-- USE COM CUIDADO - isso remove toda a segurança de linha
-- ============================================================================

-- Para desabilitar RLS (não recomendado em produção com dados sensíveis):
-- ALTER TABLE pricelist_itens DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE pricelist_categorias DISABLE ROW LEVEL SECURITY;

-- ============================================================================
-- NOTA IMPORTANTE:
-- Se você quer permitir que TODOS vejam TODOS os produtos/categorias
-- (não apenas os ativos do tipo produto), modifique as políticas acima
-- removendo as condições do USING
-- ============================================================================
