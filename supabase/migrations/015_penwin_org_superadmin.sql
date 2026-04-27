-- Create Penwin master org and promote oriol@penwin.org to superadmin
-- Run this AFTER oriol@penwin.org has signed up via the panel login

INSERT INTO organizations (id, name, slug)
VALUES ('00000000-0000-0000-0000-000000000001', 'Penwin', 'penwin')
ON CONFLICT (slug) DO NOTHING;

-- Promote oriol@penwin.org to superadmin (run after first login)
-- Replace the UUID below with the actual auth.users id after signup
-- UPDATE admin_users SET role = 'superadmin', org_id = '00000000-0000-0000-0000-000000000001'
-- WHERE email = 'oriol@penwin.org';

-- Or use this function to auto-promote on next login:
CREATE OR REPLACE FUNCTION promote_superadmin()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'oriol@penwin.org';
  IF v_user_id IS NOT NULL THEN
    INSERT INTO admin_users (id, org_id, name, email, role)
    VALUES (v_user_id, '00000000-0000-0000-0000-000000000001', 'Oriol', 'oriol@penwin.org', 'superadmin')
    ON CONFLICT (id) DO UPDATE SET role = 'superadmin', org_id = '00000000-0000-0000-0000-000000000001';
  END IF;
END;
$$;

SELECT promote_superadmin();
