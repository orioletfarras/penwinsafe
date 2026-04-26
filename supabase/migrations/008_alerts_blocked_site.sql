-- Allow 'blocked_site' as alert type (keyword blocks)
ALTER TABLE alerts DROP CONSTRAINT IF EXISTS alerts_type_check;
ALTER TABLE alerts ADD CONSTRAINT alerts_type_check
  CHECK (type IN ('concerning_search','pattern_detected','excessive_blocked','offline','blocked_site'));
