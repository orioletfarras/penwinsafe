create table if not exists cloudflare_configs (
  id                   uuid primary key default gen_random_uuid(),
  org_id               uuid not null references organizations(id) on delete cascade,
  account_id           text,
  api_token            text,

  -- Zone names
  zone_students_name   text default 'Alumnos',
  zone_teachers_name   text default 'Profesores',
  zone_admin_name      text default 'Administración',

  -- Gateway location IDs returned by Cloudflare
  zone_students_id     text,
  zone_teachers_id     text,
  zone_admin_id        text,

  -- DoH subdomains (https://{subdomain}.cloudflare-gateway.com/dns-query)
  zone_students_doh    text,
  zone_teachers_doh    text,
  zone_admin_doh       text,

  -- Cloudflare List IDs for custom blocked domains per zone
  zone_students_list_id text,
  zone_teachers_list_id text,
  zone_admin_list_id    text,

  -- Selected category IDs per zone (array of ints)
  categories_students  jsonb default '[]',
  categories_teachers  jsonb default '[]',
  categories_admin     jsonb default '[]',

  -- Custom blocked domains per zone (array of strings)
  custom_blocked_students jsonb default '[]',
  custom_blocked_teachers jsonb default '[]',
  custom_blocked_admin    jsonb default '[]',

  -- Cached list of available Cloudflare Gateway categories
  available_categories jsonb default '[]',

  -- Policy rule IDs so we can update/delete them
  zone_students_rules  jsonb default '[]',
  zone_teachers_rules  jsonb default '[]',
  zone_admin_rules     jsonb default '[]',

  -- Status
  last_check_ok        boolean,
  last_check_at        timestamptz,
  last_check_msg       text,
  zones_created        boolean default false,
  zones_created_at     timestamptz,

  created_at           timestamptz default now(),
  updated_at           timestamptz default now(),

  unique(org_id)
);

alter table cloudflare_configs enable row level security;

create policy "superadmin_all_cloudflare" on cloudflare_configs
  for all using (
    exists (
      select 1 from admin_users
      where admin_users.id = auth.uid()
      and admin_users.role = 'superadmin'
    )
  );
