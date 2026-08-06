-- =====================================================
-- MIGRACION: Tareas personales generales por dia
-- Ejecutar en Supabase SQL Editor
-- =====================================================

CREATE TABLE IF NOT EXISTS day_personal_tasks (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    owner_initials text NOT NULL,
    task_date date NOT NULL,
    text text NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_day_personal_tasks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_day_personal_tasks_updated_at ON day_personal_tasks;
CREATE TRIGGER trg_day_personal_tasks_updated_at
BEFORE UPDATE ON day_personal_tasks
FOR EACH ROW
EXECUTE FUNCTION set_day_personal_tasks_updated_at();

ALTER TABLE day_personal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on day_personal_tasks"
    ON day_personal_tasks FOR ALL
    USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_day_personal_tasks_owner_date
    ON day_personal_tasks (owner_initials, task_date);
