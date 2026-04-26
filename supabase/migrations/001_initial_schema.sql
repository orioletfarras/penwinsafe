-- ============================================================
-- PenwinSafe — Schema inicial
-- ============================================================

-- Extensiones
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm"; -- búsqueda de texto rápida

-- ============================================================
-- ORGANIZACIONES (colegios)
-- ============================================================
create table organizations (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  slug        text not null unique,
  logo_url    text,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- USUARIOS ADMIN (vinculados a Supabase Auth)
-- ============================================================
create table admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  org_id      uuid not null references organizations(id) on delete cascade,
  name        text not null,
  email       text not null,
  role        text not null default 'viewer' check (role in ('superadmin','admin','viewer')),
  created_at  timestamptz not null default now()
);

-- ============================================================
-- GRUPOS (aulas)
-- ============================================================
create table groups (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  name            text not null,
  filter_level    text not null default 'family' check (filter_level in ('family','adult','security')),
  whitelist       text[] not null default '{}',
  blacklist       text[] not null default '{}',
  kiosk_urls      text[] not null default '{}',
  kiosk_mode      boolean not null default false,
  downloads_enabled boolean not null default false,
  custom_homepage text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- DISPOSITIVOS (PCs con PenwinSafe)
-- ============================================================
create table devices (
  id              uuid primary key default uuid_generate_v4(),
  org_id          uuid not null references organizations(id) on delete cascade,
  group_id        uuid references groups(id) on delete set null,
  name            text not null,
  status          text not null default 'offline' check (status in ('online','offline','locked')),
  last_seen       timestamptz,
  browser_version text,
  ip_address      text,
  os_info         text,
  created_at      timestamptz not null default now()
);

-- ============================================================
-- CONFIGURACIÓN POR DISPOSITIVO (override del grupo)
-- ============================================================
create table device_configs (
  id                uuid primary key default uuid_generate_v4(),
  device_id         uuid not null unique references devices(id) on delete cascade,
  locked            boolean not null default false,
  filter_level      text check (filter_level in ('family','adult','security')),
  whitelist         text[],
  blacklist         text[],
  kiosk_mode        boolean,
  kiosk_urls        text[],
  downloads_enabled boolean,
  custom_homepage   text,
  updated_at        timestamptz not null default now()
);

-- ============================================================
-- HORARIOS DE ACCESO
-- ============================================================
create table schedules (
  id          uuid primary key default uuid_generate_v4(),
  group_id    uuid not null references groups(id) on delete cascade,
  name        text not null,
  days        smallint[] not null, -- 0=dom, 1=lun … 6=sab
  start_time  time not null,
  end_time    time not null,
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- EVENTOS DE URL
-- ============================================================
create table url_events (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  url           text not null,
  domain        text not null,
  title         text,
  visited_at    timestamptz not null default now(),
  duration_sec  integer,
  ai_category   text,
  ai_risk_level text check (ai_risk_level in ('safe','low','medium','high','critical'))
);

-- ============================================================
-- EVENTOS DE BÚSQUEDA
-- ============================================================
create table search_events (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  query         text not null,
  engine        text not null default 'google',
  searched_at   timestamptz not null default now(),
  ai_category   text,
  ai_risk_level text check (ai_risk_level in ('safe','low','medium','high','critical'))
);

-- ============================================================
-- EVENTOS BLOQUEADOS
-- ============================================================
create table blocked_events (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  url           text not null,
  domain        text not null,
  reason        text not null, -- 'dns_filter' | 'blacklist' | 'schedule' | 'kiosk'
  blocked_at    timestamptz not null default now(),
  ai_category   text
);

-- ============================================================
-- ALERTAS
-- ============================================================
create table alerts (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  type          text not null, -- 'concerning_search' | 'pattern_detected' | 'excessive_blocked' | 'offline'
  severity      text not null check (severity in ('info','warning','danger','critical')),
  message       text not null,
  ai_summary    text,
  resolved      boolean not null default false,
  resolved_by   uuid references admin_users(id),
  resolved_at   timestamptz,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- REPORTES SEMANALES (generados por IA)
-- ============================================================
create table weekly_reports (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  week_start    date not null,
  week_end      date not null,
  summary_md    text not null,
  top_categories jsonb,
  risk_score    smallint, -- 0-100
  generated_at  timestamptz not null default now(),
  unique(device_id, week_start)
);

-- ============================================================
-- SESIONES WebRTC (señalización para vista en vivo)
-- ============================================================
create table rtc_sessions (
  id            uuid primary key default uuid_generate_v4(),
  device_id     uuid not null references devices(id) on delete cascade,
  admin_id      uuid not null references admin_users(id) on delete cascade,
  offer_sdp     text,
  answer_sdp    text,
  status        text not null default 'pending' check (status in ('pending','active','closed')),
  created_at    timestamptz not null default now(),
  closed_at     timestamptz
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index on url_events (device_id, visited_at desc);
create index on url_events (domain);
create index on url_events using gin (title gin_trgm_ops);
create index on search_events (device_id, searched_at desc);
create index on search_events using gin (query gin_trgm_ops);
create index on blocked_events (device_id, blocked_at desc);
create index on alerts (device_id, created_at desc);
create index on alerts (resolved, severity);
create index on devices (org_id, status);
create index on devices (group_id);

-- ============================================================
-- FUNCIÓN: extraer dominio de URL
-- ============================================================
create or replace function extract_domain(url text)
returns text language plpgsql immutable as $$
begin
  return regexp_replace(
    regexp_replace(url, '^https?://(www\.)?', ''),
    '/.*$', ''
  );
end;
$$;

-- ============================================================
-- TRIGGER: actualizar device_configs.updated_at
-- ============================================================
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger device_configs_updated_at
  before update on device_configs
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table organizations    enable row level security;
alter table admin_users      enable row level security;
alter table groups           enable row level security;
alter table devices          enable row level security;
alter table device_configs   enable row level security;
alter table schedules        enable row level security;
alter table url_events       enable row level security;
alter table search_events    enable row level security;
alter table blocked_events   enable row level security;
alter table alerts           enable row level security;
alter table weekly_reports   enable row level security;
alter table rtc_sessions     enable row level security;

-- Helper: org del usuario autenticado
create or replace function my_org_id()
returns uuid language sql security definer stable as $$
  select org_id from admin_users where id = auth.uid()
$$;

-- Helper: rol del usuario autenticado
create or replace function my_role()
returns text language sql security definer stable as $$
  select role from admin_users where id = auth.uid()
$$;

-- Policies: cada admin solo ve su organización
create policy "org_isolation" on organizations
  for all using (id = my_org_id());

create policy "org_isolation" on admin_users
  for all using (org_id = my_org_id());

create policy "org_isolation" on groups
  for all using (org_id = my_org_id());

create policy "org_isolation" on devices
  for all using (org_id = my_org_id());

create policy "org_isolation" on device_configs
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on schedules
  for all using (
    group_id in (select id from groups where org_id = my_org_id())
  );

create policy "org_isolation" on url_events
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on search_events
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on blocked_events
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on alerts
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on weekly_reports
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

create policy "org_isolation" on rtc_sessions
  for all using (
    device_id in (select id from devices where org_id = my_org_id())
  );

-- Los viewers no pueden modificar configuración
create policy "viewers_readonly_configs" on device_configs
  for insert with check (my_role() in ('superadmin','admin'));

create policy "viewers_readonly_configs" on groups
  for insert with check (my_role() in ('superadmin','admin'));

-- Service role (para el navegador PenwinSafe) — usa API key separada
-- Los devices insertan eventos con una clave de servicio anon restringida
create policy "device_insert_url_events" on url_events
  for insert with check (true); -- restringido por API key en el navegador

create policy "device_insert_search_events" on search_events
  for insert with check (true);

create policy "device_insert_blocked_events" on blocked_events
  for insert with check (true);

create policy "device_upsert_status" on devices
  for update using (true) with check (true);
