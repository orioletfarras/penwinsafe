ALTER TABLE rtc_sessions ADD COLUMN IF NOT EXISTS closed_at timestamptz;
-- No extra columns needed: offer_sdp and answer_sdp already exist
-- Device polls for pending sessions, admin uses Realtime for answer
