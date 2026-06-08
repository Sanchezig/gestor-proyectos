-- =====================================================
-- MIGRACIÓN: Weekly Tasks & Incidents
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- Tabla para tareas/objetivos semanales (widget WEEKLY)
CREATE TABLE IF NOT EXISTS project_weekly_tasks (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  text REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    week_start  date NOT NULL,           -- Lunes de la semana (YYYY-MM-DD)
    text        text NOT NULL,
    done        boolean DEFAULT false,
    position    integer DEFAULT 0,       -- Orden dentro de la semana
    created_by  text,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE project_weekly_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on project_weekly_tasks"
    ON project_weekly_tasks FOR ALL
    USING (true) WITH CHECK (true);

-- Índice para consultas frecuentes por proyecto y semana
CREATE INDEX IF NOT EXISTS idx_weekly_tasks_project_week
    ON project_weekly_tasks (project_id, week_start);


-- Tabla para incidencias (widget INCIDENCIAS)
CREATE TABLE IF NOT EXISTS project_incidents (
    id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id  text REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    description text NOT NULL,
    resolved    boolean DEFAULT false,
    created_by  text,
    created_at  timestamptz DEFAULT now()
);

ALTER TABLE project_incidents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all on project_incidents"
    ON project_incidents FOR ALL
    USING (true) WITH CHECK (true);

-- Índice para consultas por proyecto
CREATE INDEX IF NOT EXISTS idx_incidents_project
    ON project_incidents (project_id);
