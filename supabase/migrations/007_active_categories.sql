ALTER TABLE groups ADD COLUMN IF NOT EXISTS active_categories text[] NOT NULL DEFAULT '{pornografia,contenido_adulto,violencia,drogas,apuestas,odio}';
