-- Restore last_check_ok for orgs that have an active network
-- (was incorrectly set to false by the setup action on previous failed attempts)
UPDATE unifi_configs
  SET last_check_ok = true
  WHERE network_active = true
    AND (last_check_ok = false OR last_check_ok IS NULL);
