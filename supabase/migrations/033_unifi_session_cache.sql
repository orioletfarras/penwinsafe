alter table unifi_configs
  add column if not exists session_cookie text,
  add column if not exists session_csrf   text,
  add column if not exists session_at     timestamptz;
