-- MIGRACION: usuarios de aplicacion para login por iniciales
-- Ejecutar en Supabase SQL Editor una sola vez.

CREATE TABLE IF NOT EXISTS app_users (
    initials TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION set_app_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_app_users_updated_at ON app_users;
CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW
EXECUTE FUNCTION set_app_users_updated_at();

INSERT INTO app_users (initials, email)
VALUES
    ('AP', 'alvaro.perez@wtwco.com'),
    ('AR', 'ana.real@wtwco.com'),
    ('HR', 'huri.rodriguez@wtwco.com'),
    ('IS', 'ignacio.sanchez@wtwco.com'),
    ('MR', 'mileni.rodriguez@wtwco.com'),
    ('PU', 'polina.utkina@wtwco.com')
ON CONFLICT (initials) DO UPDATE
SET email = EXCLUDED.email;