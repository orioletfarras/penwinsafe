-- The superadmin_bypass policies returned ALL rows for superadmin, bypassing org isolation.
-- Now that my_org_id() respects the superadmin_session table, the existing org_isolation
-- policies work correctly for superadmins too. Drop the bypasses so superadmin only sees
-- the selected org's data.

DROP POLICY IF EXISTS "superadmin_bypass" ON organizations;
DROP POLICY IF EXISTS "superadmin_bypass" ON admin_users;
DROP POLICY IF EXISTS "superadmin_bypass" ON groups;
DROP POLICY IF EXISTS "superadmin_bypass" ON devices;
DROP POLICY IF EXISTS "superadmin_bypass" ON device_configs;
DROP POLICY IF EXISTS "superadmin_bypass" ON schedules;
DROP POLICY IF EXISTS "superadmin_bypass" ON url_events;
DROP POLICY IF EXISTS "superadmin_bypass" ON search_events;
DROP POLICY IF EXISTS "superadmin_bypass" ON blocked_events;
DROP POLICY IF EXISTS "superadmin_bypass" ON alerts;
DROP POLICY IF EXISTS "superadmin_bypass" ON weekly_reports;
DROP POLICY IF EXISTS "superadmin_bypass" ON rtc_sessions;
DROP POLICY IF EXISTS "superadmin_bypass" ON unifi_configs;
