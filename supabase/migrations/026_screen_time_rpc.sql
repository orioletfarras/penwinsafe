CREATE OR REPLACE FUNCTION increment_screen_time(
  p_device_id uuid,
  p_date      date,
  p_seconds   integer
) RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  INSERT INTO screen_time (device_id, date, total_sec, updated_at)
  VALUES (p_device_id, p_date, p_seconds, now())
  ON CONFLICT (device_id, date)
  DO UPDATE SET
    total_sec  = screen_time.total_sec + p_seconds,
    updated_at = now();
$$;
