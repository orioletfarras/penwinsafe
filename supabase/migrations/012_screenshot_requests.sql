CREATE TABLE screenshot_requests (
  id          uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  device_id   uuid NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  status      text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','done','error')),
  image_data  text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  taken_at    timestamptz
);

CREATE INDEX ON screenshot_requests (device_id, status, requested_at DESC);

ALTER TABLE screenshot_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_isolation" ON screenshot_requests
  FOR ALL USING (
    device_id IN (SELECT id FROM devices WHERE org_id = my_org_id())
  );

CREATE POLICY "device_insert_screenshot" ON screenshot_requests
  FOR ALL WITH CHECK (true);
