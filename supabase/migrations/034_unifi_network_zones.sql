ALTER TABLE unifi_configs
  ADD COLUMN IF NOT EXISTS network_zone_map jsonb DEFAULT '{}';
