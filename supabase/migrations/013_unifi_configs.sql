-- UniFi controller credentials per organization (superadmin only)
CREATE TABLE unifi_configs (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  controller_url  text NOT NULL,
  site_id         text NOT NULL,
  username        text NOT NULL,
  password        text NOT NULL,
  network_active  boolean NOT NULL DEFAULT false,
  vlan_network_id text,
  wlan_id         text,
  wg_server_pubkey  text,
  wg_endpoint     text,
  wg_preshared_key  text,
  last_check_at   timestamptz,
  last_check_ok   boolean,
  last_check_msg  text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE unifi_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "superadmin_only" ON unifi_configs
  FOR ALL USING (my_role() = 'superadmin');

CREATE TRIGGER unifi_configs_updated_at
  BEFORE UPDATE ON unifi_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
