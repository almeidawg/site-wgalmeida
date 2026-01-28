-- =====================================================
-- Tabela para armazenar visualizações de ambientes
-- Módulo: Room Visualizer (IA)
-- =====================================================

-- Criar tabela de visualizações
CREATE TABLE IF NOT EXISTS room_visualizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Imagens
    original_image_url TEXT NOT NULL,
    generated_image_url TEXT NOT NULL,
    colored_image_url TEXT,

    -- Dados do moodboard usado
    moodboard_data JSONB DEFAULT '{}',
    -- Estrutura: { colors: [], styles: [] }

    -- Informações do ambiente
    room_info JSONB DEFAULT '{}',
    -- Estrutura: { roomType: { id, name }, customRoomName: string }

    -- Prompt usado na geração
    prompt_used TEXT,

    -- Metadados
    is_favorite BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT FALSE,
    share_id TEXT UNIQUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_room_visualizations_user_id ON room_visualizations(user_id);
CREATE INDEX IF NOT EXISTS idx_room_visualizations_created_at ON room_visualizations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_room_visualizations_share_id ON room_visualizations(share_id);
CREATE INDEX IF NOT EXISTS idx_room_visualizations_is_public ON room_visualizations(is_public) WHERE is_public = TRUE;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_room_visualizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_room_visualizations_updated_at
    BEFORE UPDATE ON room_visualizations
    FOR EACH ROW
    EXECUTE FUNCTION update_room_visualizations_updated_at();

-- RLS (Row Level Security)
ALTER TABLE room_visualizations ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias visualizações
CREATE POLICY "Users can view own visualizations"
    ON room_visualizations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Política: usuários podem criar suas próprias visualizações
CREATE POLICY "Users can create own visualizations"
    ON room_visualizations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Política: usuários podem atualizar suas próprias visualizações
CREATE POLICY "Users can update own visualizations"
    ON room_visualizations
    FOR UPDATE
    USING (auth.uid() = user_id);

-- Política: usuários podem deletar suas próprias visualizações
CREATE POLICY "Users can delete own visualizations"
    ON room_visualizations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Política: visualizações públicas podem ser vistas por todos
CREATE POLICY "Public visualizations are viewable by everyone"
    ON room_visualizations
    FOR SELECT
    USING (is_public = TRUE);

-- =====================================================
-- Tabela para armazenar moodboards salvos (opcional)
-- Para usuários logados que queiram salvar moodboards
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_moodboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

    -- Dados do moodboard
    name TEXT DEFAULT 'Meu Moodboard',
    colors TEXT[] DEFAULT '{}',
    styles JSONB DEFAULT '[]',
    custom_images JSONB DEFAULT '[]',

    -- Metadados
    is_default BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_saved_moodboards_user_id ON saved_moodboards(user_id);

-- Trigger para updated_at
CREATE TRIGGER trigger_update_saved_moodboards_updated_at
    BEFORE UPDATE ON saved_moodboards
    FOR EACH ROW
    EXECUTE FUNCTION update_room_visualizations_updated_at();

-- RLS
ALTER TABLE saved_moodboards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own moodboards"
    ON saved_moodboards
    FOR ALL
    USING (auth.uid() = user_id);

-- =====================================================
-- Comentários
-- =====================================================
COMMENT ON TABLE room_visualizations IS 'Armazena visualizações de ambientes geradas por IA';
COMMENT ON TABLE saved_moodboards IS 'Armazena moodboards salvos pelos usuários';
