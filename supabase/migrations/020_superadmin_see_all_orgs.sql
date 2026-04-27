-- Superadmin must be able to see all organizations to populate the school switcher.
-- All other tables remain org-isolated via my_org_id() / superadmin_session.
CREATE POLICY "superadmin_all_orgs" ON organizations
  FOR SELECT USING (my_role() = 'superadmin');
