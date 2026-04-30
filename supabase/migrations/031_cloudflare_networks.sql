alter table cloudflare_configs
  add column if not exists zone_students_networks jsonb default '[]',
  add column if not exists zone_teachers_networks jsonb default '[]',
  add column if not exists zone_admin_networks    jsonb default '[]';
