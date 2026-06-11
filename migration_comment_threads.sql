-- =====================================================
-- MIGRACIÓN: Hilos de respuestas en daily_comments
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Añadir columna parent_id (respuesta a otro comentario)
ALTER TABLE daily_comments
    ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES daily_comments(id) ON DELETE CASCADE;

-- Índice para recuperar respuestas rápidamente por padre
CREATE INDEX IF NOT EXISTS idx_daily_comments_parent
    ON daily_comments (parent_id)
    WHERE parent_id IS NOT NULL;
