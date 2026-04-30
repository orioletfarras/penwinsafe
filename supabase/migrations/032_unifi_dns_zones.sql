alter table unifi_configs
  add column if not exists dns_zones_configured boolean default false;
