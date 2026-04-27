-- Allow superadmin to access all organizations and their data

-- Organizations: superadmin sees all
CREATE POLICY "superadmin_bypass" ON organizations
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON admin_users
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON groups
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON devices
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON device_configs
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON schedules
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON url_events
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON search_events
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON blocked_events
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON alerts
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON weekly_reports
  FOR ALL USING (my_role() = 'superadmin');

CREATE POLICY "superadmin_bypass" ON rtc_sessions
  FOR ALL USING (my_role() = 'superadmin');
