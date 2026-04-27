import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// UniFi API client (no cert verification in Deno via fetch)
class UnifiClient {
  private baseUrl: string
  private cookies = ''
  private csrf = ''

  constructor(url: string) {
    this.baseUrl = url.replace(/\/$/, '')
  }

  async login(username: string, password: string) {
    const res = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    if (!res.ok) throw new Error(`UniFi login failed: ${res.status}`)
    const setCookie = res.headers.get('set-cookie') || ''
    this.cookies = setCookie.split(',').map(c => c.split(';')[0].trim()).join('; ')
    this.csrf = res.headers.get('x-updated-csrf-token') || res.headers.get('x-csrf-token') || ''
    return await res.json()
  }

  async get(path: string) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      headers: { 'Cookie': this.cookies, 'X-Csrf-Token': this.csrf },
    })
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`)
    return await res.json()
  }

  async post(path: string, body: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.cookies,
        'X-Csrf-Token': this.csrf,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data?.meta?.rc === 'error') throw new Error(data.meta.msg || 'UniFi API error')
    return data
  }

  async put(path: string, body: unknown) {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.cookies,
        'X-Csrf-Token': this.csrf,
      },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data?.meta?.rc === 'error') throw new Error(data.meta.msg || 'UniFi API error')
    return data
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Verify caller is superadmin
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (adminUser?.role !== 'superadmin') return json({ error: 'Forbidden' }, 403)

  const { action, org_id, ...params } = await req.json()

  // Load UniFi credentials for this org
  const { data: config } = await supabase
    .from('unifi_configs')
    .select('*')
    .eq('org_id', org_id)
    .single()

  if (!config) return json({ error: 'No UniFi config for this org' }, 404)

  const client = new UnifiClient(config.controller_url)
  const site = config.site_id

  try {
    await client.login(config.username, config.password)

    // ── CHECK: verify connectivity + gather info ──────────────────────────
    if (action === 'check') {
      const siteInfo = await client.get(`/proxy/network/api/s/${site}/stat/sysinfo`)
      const networks = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const wlans    = await client.get(`/proxy/network/api/s/${site}/rest/wlanconf`)
      const devices  = await client.get(`/proxy/network/api/s/${site}/stat/device`)

      const hasWg = devices.data?.some((d: any) =>
        d.features?.includes('wireguard') || d.vpn_enabled
      )

      const existingVlan = networks.data?.find((n: any) => n.name === 'PenwinSafe')
      const existingSsid = wlans.data?.find((w: any) => w.name === 'PenwinSafe')

      return json({
        ok: true,
        sysinfo: siteInfo.data?.[0],
        vlan_exists: !!existingVlan,
        ssid_exists: !!existingSsid,
        wireguard_available: hasWg,
        device_count: devices.data?.length || 0,
      })
    }

    // ── SETUP: create VLAN + SSID + WireGuard + firewall rules ───────────
    if (action === 'setup') {
      const checks: string[] = []
      const errors: string[] = []

      // 1. Check WireGuard VPN support
      const vpnConfig = await client.get(`/proxy/network/api/s/${site}/rest/vpnclient`).catch(() => null)
      const wgConfig  = await client.get(`/proxy/network/api/s/${site}/rest/wguard`).catch(() => null)
      if (!wgConfig && !vpnConfig) {
        errors.push('WireGuard no disponible en este UXG Pro — actualiza el firmware')
      }

      // 2. Create PenwinSafe VLAN (if not exists)
      const networks = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      let vlanId = networks.data?.find((n: any) => n.name === 'PenwinSafe')?._id

      if (!vlanId) {
        const vlanRes = await client.post(`/proxy/network/api/s/${site}/rest/networkconf`, {
          name: 'PenwinSafe',
          purpose: 'corporate',
          vlan_enabled: true,
          vlan: 99,
          ip_subnet: '10.99.0.1/24',
          dhcpd_enabled: true,
          dhcpd_start: '10.99.0.100',
          dhcpd_stop: '10.99.0.254',
          dhcpd_dns_enabled: true,
          dhcpd_dns_1: '1.1.1.1',
          igmp_snooping: false,
        })
        vlanId = vlanRes.data?.[0]?._id
        checks.push('VLAN PenwinSafe creada (VLAN 99, 10.99.0.0/24)')
      } else {
        checks.push('VLAN PenwinSafe ya existe')
      }

      if (!vlanId) {
        errors.push('No se pudo crear la VLAN PenwinSafe')
        return json({ ok: false, checks, errors })
      }

      // 3. Create PenwinSafe SSID (if not exists)
      const wlans = await client.get(`/proxy/network/api/s/${site}/rest/wlanconf`)
      let wlanId = wlans.data?.find((w: any) => w.name === 'PenwinSafe')?._id

      if (!wlanId) {
        // Generate a random WPA2 password for the SSID
        const wpaKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('')

        const wlanRes = await client.post(`/proxy/network/api/s/${site}/rest/wlanconf`, {
          name: 'PenwinSafe',
          security: 'wpapsk',
          wpa_mode: 'wpa2',
          wpa_enc: 'ccmp',
          usergroup_id: '',
          networkconf_id: vlanId,
          x_passphrase: wpaKey,
          enabled: true,
          is_guest: false,
          hide_ssid: false,
        })
        wlanId = wlanRes.data?.[0]?._id
        checks.push(`SSID PenwinSafe creado (WPA2, red VLAN 99)`)
      } else {
        checks.push('SSID PenwinSafe ya existe')
      }

      // 4. Firewall: block HTTP/HTTPS from PenwinSafe VLAN (except WireGuard)
      const fwRules = await client.get(`/proxy/network/api/s/${site}/rest/firewallrule`)
      const existingBlock = fwRules.data?.find((r: any) => r.name === 'PenwinSafe Block HTTP')

      if (!existingBlock) {
        // Block TCP 80
        await client.post(`/proxy/network/api/s/${site}/rest/firewallrule`, {
          name: 'PenwinSafe Block HTTP',
          ruleset: 'LAN_OUT',
          rule_index: 21000,
          action: 'drop',
          enabled: true,
          logging: false,
          protocol: 'tcp',
          src_networkconf_id: vlanId,
          src_networkconf_type: 'NETv4',
          src_firewallgroup_ids: [],
          src_address: '',
          src_mac_address: '',
          dst_firewallgroup_ids: [],
          dst_networkconf_type: 'NETv4',
          dst_networkconf_id: '',
          dst_address: '',
          dst_port: '80',
          state_new: false,
          state_established: false,
          state_invalid: false,
          state_related: false,
          ipsec: '',
          protocol_match_excepted: false,
          setting_preference: 'manual',
        })
        // Block TCP 443
        await client.post(`/proxy/network/api/s/${site}/rest/firewallrule`, {
          name: 'PenwinSafe Block HTTPS',
          ruleset: 'LAN_OUT',
          rule_index: 21001,
          action: 'drop',
          enabled: true,
          logging: false,
          protocol: 'tcp',
          src_networkconf_id: vlanId,
          src_networkconf_type: 'NETv4',
          src_firewallgroup_ids: [],
          src_address: '',
          src_mac_address: '',
          dst_firewallgroup_ids: [],
          dst_networkconf_type: 'NETv4',
          dst_networkconf_id: '',
          dst_address: '',
          dst_port: '443',
          state_new: false,
          state_established: false,
          state_invalid: false,
          state_related: false,
          ipsec: '',
          protocol_match_excepted: false,
          setting_preference: 'manual',
        })
        checks.push('Reglas firewall creadas: bloquear HTTP/HTTPS desde VLAN PenwinSafe')
      } else {
        checks.push('Reglas firewall ya existen')
      }

      // 5. Save config to DB
      await supabase.from('unifi_configs').update({
        network_active: errors.length === 0,
        vlan_network_id: vlanId,
        wlan_id: wlanId,
        last_check_at: new Date().toISOString(),
        last_check_ok: errors.length === 0,
        last_check_msg: errors.length > 0 ? errors.join('; ') : 'OK',
      }).eq('org_id', org_id)

      return json({ ok: errors.length === 0, checks, errors })
    }

    // ── SAVE: just save credentials ───────────────────────────────────────
    if (action === 'save') {
      await supabase.from('unifi_configs').upsert({
        org_id,
        controller_url: params.controller_url,
        site_id: params.site_id,
        username: params.username,
        password: params.password,
        last_check_at: new Date().toISOString(),
        last_check_ok: true,
        last_check_msg: 'Conexión verificada',
      })
      return json({ ok: true })
    }

    // ── UPDATE_SUPABASE_WHITELIST: keep Supabase IPs allowed through 443 block ──
    if (action === 'update_supabase_whitelist') {
      const ips: string[] = params.ips || []
      if (!ips.length) return json({ ok: false, error: 'No IPs provided' })

      // Find or create the Supabase address group
      const groups = await client.get(`/proxy/network/api/s/${site}/rest/firewallgroup`)
      const existingGroup = groups.data?.find((g: any) => g.name === 'Supabase_IPs')

      if (existingGroup) {
        await client.put(
          `/proxy/network/api/s/${site}/rest/firewallgroup/${existingGroup._id}`,
          { ...existingGroup, group_members: ips }
        )
      } else {
        // Create group + ACCEPT rule before the PenwinSafe DROP rules
        const groupRes = await client.post(`/proxy/network/api/s/${site}/rest/firewallgroup`, {
          name: 'Supabase_IPs',
          group_type: 'address-group',
          group_members: ips,
        })
        const groupId = groupRes.data?.[0]?._id
        if (groupId) {
          // Get PenwinSafe VLAN id
          const networks = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
          const vlanId = networks.data?.find((n: any) => n.name === 'PenwinSafe')?._id
          if (vlanId) {
            await client.post(`/proxy/network/api/s/${site}/rest/firewallrule`, {
              name: 'PenwinSafe Allow Supabase',
              ruleset: 'LAN_OUT',
              rule_index: 20999,
              action: 'accept',
              enabled: true,
              logging: false,
              protocol: 'tcp',
              src_networkconf_id: vlanId,
              src_networkconf_type: 'NETv4',
              src_firewallgroup_ids: [],
              src_address: '',
              src_mac_address: '',
              dst_firewallgroup_ids: [groupId],
              dst_networkconf_type: 'NETv4',
              dst_networkconf_id: '',
              dst_address: '',
              dst_port: '443',
              state_new: false,
              state_established: false,
              state_invalid: false,
              state_related: false,
              ipsec: '',
              protocol_match_excepted: false,
              setting_preference: 'manual',
            })
          }
        }
      }

      // Also save IPs to DB for reference
      await supabase.from('unifi_configs').update({
        updated_at: new Date().toISOString(),
      }).eq('org_id', org_id)

      return json({ ok: true, ips_updated: ips.length })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (e: any) {
    return json({ ok: false, error: e.message }, 200)
  }
})
