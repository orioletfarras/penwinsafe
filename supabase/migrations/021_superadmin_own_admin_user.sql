-- When superadmin has a session set to another org, my_org_id() returns that org,
-- making the org_isolation policy on admin_users hide their own record (their org_id
-- is Penwin, not the selected org). This policy lets them always read their own row.
CREATE POLICY "own_record" ON admin_users
  FOR SELECT USING (id = auth.uid());
