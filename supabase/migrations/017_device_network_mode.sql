ALTER TABLE devices
  ADD COLUMN IF NOT EXISTS network_mode text
    CHECK (network_mode IN ('direct','tunnel','supabase_only','no_internet'));
