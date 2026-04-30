-- Standard DNS IPv4 addresses assigned by Cloudflare Gateway per location
alter table cloudflare_configs
  add column if not exists zone_students_ip jsonb default '[]',
  add column if not exists zone_teachers_ip  jsonb default '[]',
  add column if not exists zone_admin_ip     jsonb default '[]';
