-- Add tutor info and notification categories to groups
ALTER TABLE groups ADD COLUMN IF NOT EXISTS tutor_name  text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS tutor_email text;
ALTER TABLE groups ADD COLUMN IF NOT EXISTS notify_categories text[] NOT NULL DEFAULT '{}';
ALTER TABLE groups ADD COLUMN IF NOT EXISTS active_categories text[] NOT NULL DEFAULT '{pornografia,contenido_adulto,violencia,drogas,apuestas,odio}';
