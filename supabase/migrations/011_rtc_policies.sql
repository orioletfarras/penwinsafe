DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'device_update_rtc' AND tablename = 'rtc_sessions') THEN
    CREATE POLICY "device_update_rtc" ON rtc_sessions FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'device_insert_rtc' AND tablename = 'rtc_sessions') THEN
    CREATE POLICY "device_insert_rtc" ON rtc_sessions FOR INSERT WITH CHECK (true);
  END IF;
END $$;
