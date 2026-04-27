ALTER TABLE unifi_configs
  ADD COLUMN IF NOT EXISTS wg_server_public_key  text,
  ADD COLUMN IF NOT EXISTS wg_server_private_key  text;
