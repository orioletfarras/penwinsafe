-- Stores the currently selected org for each superadmin session
CREATE TABLE superadmin_session (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_org_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE superadmin_session ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_session" ON superadmin_session
  FOR ALL USING (user_id = auth.uid());

-- Update my_org_id() to respect superadmin session
CREATE OR REPLACE FUNCTION my_org_id()
RETURNS uuid LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT CASE
    WHEN (SELECT role FROM admin_users WHERE id = auth.uid()) = 'superadmin'
    THEN COALESCE(
      (SELECT selected_org_id FROM superadmin_session WHERE user_id = auth.uid()),
      (SELECT org_id FROM admin_users WHERE id = auth.uid())
    )
    ELSE (SELECT org_id FROM admin_users WHERE id = auth.uid())
  END
$$;

-- RPC to switch org (called from panel when superadmin switches school)
CREATE OR REPLACE FUNCTION set_superadmin_org(org_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (SELECT role FROM admin_users WHERE id = auth.uid()) != 'superadmin' THEN
    RAISE EXCEPTION 'Not a superadmin';
  END IF;
  INSERT INTO superadmin_session (user_id, selected_org_id, updated_at)
  VALUES (auth.uid(), org_id, now())
  ON CONFLICT (user_id) DO UPDATE SET selected_org_id = org_id, updated_at = now();
END;
$$;
