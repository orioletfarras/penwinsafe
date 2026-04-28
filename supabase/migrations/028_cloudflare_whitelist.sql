-- Whitelist domains per zone (domains to allow even if category-blocked)
alter table cloudflare_configs
  add column if not exists whitelist_students jsonb default '[]',
  add column if not exists whitelist_teachers jsonb default '[]',
  add column if not exists whitelist_admin    jsonb default '[]',

  -- Cloudflare List IDs for whitelist domains
  add column if not exists zone_students_allow_list_id text,
  add column if not exists zone_teachers_allow_list_id text,
  add column if not exists zone_admin_allow_list_id    text,

  -- Cloudflare allow rule IDs (precedence above block rules)
  add column if not exists zone_students_allow_rule_id text,
  add column if not exists zone_teachers_allow_rule_id text,
  add column if not exists zone_admin_allow_rule_id    text;

-- Allow regular org admins to read non-sensitive config fields
-- and update zone content (categories, domains, whitelists)
-- Credentials (account_id, api_token) are only accessible server-side via service role
create policy "admin_read_cloudflare" on cloudflare_configs
  for select using (
    exists (
      select 1 from admin_users
      where admin_users.user_id = auth.uid()
      and admin_users.org_id = cloudflare_configs.org_id
    )
  );
