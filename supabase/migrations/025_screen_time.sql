CREATE TABLE IF NOT EXISTS screen_time (
  id         uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  device_id  uuid    REFERENCES devices(id) ON DELETE CASCADE NOT NULL,
  date       date    NOT NULL,
  total_sec  integer DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(device_id, date)
);

ALTER TABLE screen_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY screen_time_org ON screen_time
  FOR ALL USING (
    device_id IN (
      SELECT id FROM devices WHERE org_id = my_org_id()
    )
  );
