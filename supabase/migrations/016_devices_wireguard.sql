ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS wg_public_key  text,
  ADD COLUMN IF NOT EXISTS wg_assigned_ip text;

ALTER TABLE unifi_configs
  ADD COLUMN IF NOT EXISTS wg_server_ip   text,
  ADD COLUMN IF NOT EXISTS wg_port        integer DEFAULT 51820,
  ADD COLUMN IF NOT EXISTS wg_network     text DEFAULT '10.99.1.0/24';
