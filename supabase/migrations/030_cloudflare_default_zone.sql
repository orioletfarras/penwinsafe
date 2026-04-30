alter table cloudflare_configs
  add column if not exists default_zone text; -- 'students' | 'teachers' | 'admin' | null
