-- Fix configs that have credentials saved but last_check_ok = false
-- (caused by setup action incorrectly overwriting last_check_ok)
UPDATE unifi_configs
  SET last_check_ok = true
  WHERE controller_url IS NOT NULL
    AND username IS NOT NULL
    AND (last_check_ok = false OR last_check_ok IS NULL);
