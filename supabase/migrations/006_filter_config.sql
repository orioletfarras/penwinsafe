ALTER TABLE organizations ADD COLUMN IF NOT EXISTS filter_config jsonb NOT NULL DEFAULT '{}';
