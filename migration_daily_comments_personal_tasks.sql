-- =====================================================
-- MIGRACION: Tareas personales en daily_comments
-- Ejecutar en Supabase SQL Editor
-- =====================================================

ALTER TABLE daily_comments
    ADD COLUMN IF NOT EXISTS is_personal boolean NOT NULL DEFAULT false;

ALTER TABLE daily_comments
    ADD COLUMN IF NOT EXISTS owner_initials text;

-- Backfill para registros historicos
UPDATE daily_comments
SET owner_initials = COALESCE(NULLIF(trim(owner_initials), ''), user_name)
WHERE owner_initials IS NULL OR trim(owner_initials) = '';

CREATE INDEX IF NOT EXISTS idx_daily_comments_owner
    ON daily_comments (owner_initials);

CREATE INDEX IF NOT EXISTS idx_daily_comments_project_date_owner
    ON daily_comments (project_id, date, owner_initials);
