import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { x25519 } from 'https://esm.sh/@noble/curves@1.3.0/ed25519'

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
    let u = url.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    this.baseUrl = u.replace(/\/$/, '')
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
    const text = await res.text()
    let data: any
    try { data = JSON.parse(text) } catch { data = { _raw: text } }
    if (!res.ok) throw new Error(`POST ${path} ${res.status}: ${text.slice(0, 200)}`)
    if (data?.meta?.rc === 'error') throw new Error(data.meta.msg || 'UniFi API error')
    return data
  }

  // Probe: GET without throwing — returns null if not found/error
  async probe(path: string): Promise<any> {
    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        headers: { 'Cookie': this.cookies, 'X-Csrf-Token': this.csrf },
      })
      if (!res.ok) return null
      const text = await res.text()
      try { return JSON.parse(text) } catch { return null }
    } catch { return null }
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

  // ── GET_SITES: login with provided credentials and return site list ──────
  // Credentials are passed directly (not yet saved to DB)
  if (action === 'get_sites') {
    const { controller_url, username, password } = params
    if (!controller_url || !username || !password)
      return json({ error: 'Faltan parámetros' }, 400)
    try {
      const client = new UnifiClient(controller_url)
      await client.login(username, password)
      // UniFi OS (UXG Pro, UDM) uses /proxy/network prefix; standalone uses /api directly
      let raw: any = null
      try {
        raw = await client.get('/proxy/network/api/self/sites')
      } catch {
        raw = await client.get('/api/self/sites')
      }
      const list: any[] = Array.isArray(raw) ? raw : (raw?.data ?? [])
      const sites = list.map((s: any) => ({ id: s.name, label: s.desc || s.name }))
      return json({ ok: true, sites })
    } catch (e: any) {
      return json({ ok: false, error: e.message })
    }
  }

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

      // 1. WireGuard server keypair + UXG Pro configuration
      let wgPubKey = config.wg_server_public_key
      if (!wgPubKey) {
        try {
          // Generate Curve25519 keypair — WireGuard native format
          const privRaw = x25519.utils.randomPrivateKey()
          const pubRaw  = x25519.getPublicKey(privRaw)
          const privB64 = btoa(String.fromCharCode(...privRaw))
          const pubB64  = btoa(String.fromCharCode(...pubRaw))
          wgPubKey = pubB64

          // Try to configure WireGuard VPN server on UXG Pro via multiple known endpoints
          const controllerHost = config.controller_url.replace(/^https?:\/\//, '').split(':')[0].split('/')[0]
          let wgApiOk = false
          const listenPort = config.wg_port ?? 51820
          const wgNetwork  = config.wg_network ?? '10.99.1.0/24'

          // Payloads differ slightly between API versions
          const wgPayloadV2 = {
            enabled: true,
            interface_name: 'wg0',
            private_key: privB64,
            listen_port: listenPort,
            ip_subnets: [wgNetwork],
            site_name: site,
          }
          const wgPayloadV1 = {
            enabled: true,
            name: 'PenwinSafe',
            private_key: privB64,
            server_addr: wgNetwork.split('/')[0],
            listen_port: listenPort,
            type: 'wireguard',
          }

          // Endpoint candidates: probe each, then POST to first that responds
          const wgCandidates: Array<{ path: string; payload: object }> = [
            { path: `/proxy/network/v2/api/site/${site}/vpn-server`,          payload: wgPayloadV2 },
            { path: `/proxy/network/v2/api/site/${site}/vpn/wireguard-server`, payload: wgPayloadV2 },
            { path: `/proxy/network/v2/api/site/${site}/teleport/servers`,     payload: wgPayloadV2 },
            { path: `/proxy/network/v2/api/site/${site}/vpn`,                  payload: wgPayloadV2 },
            { path: `/proxy/network/api/s/${site}/rest/vpnserver`,             payload: wgPayloadV1 },
            { path: `/proxy/network/api/s/${site}/rest/vpn-server`,            payload: wgPayloadV1 },
          ]

          for (const { path, payload } of wgCandidates) {
            const probed = await client.probe(path)
            if (probed !== null) {
              try {
                await client.post(path, payload)
                wgApiOk = true
                checks.push(`Servidor WireGuard configurado en el UXG Pro (puerto ${listenPort})`)
                break
              } catch { /* endpoint exists but POST failed — try next */ }
            }
          }

          // If none of the probed endpoints accepted the POST, try posting to all blindly
          if (!wgApiOk) {
            for (const { path, payload } of wgCandidates) {
              try {
                await client.post(path, payload)
                wgApiOk = true
                checks.push(`Servidor WireGuard configurado en el UXG Pro (puerto ${listenPort})`)
                break
              } catch { /* try next */ }
            }
          }

          if (!wgApiOk) {
            errors.push(
              `WireGuard: no se encontró un endpoint compatible en el controlador. ` +
              `Activa el servidor WireGuard manualmente en Settings → Teleport & VPN → WireGuard ` +
              `usando la clave pública: ${pubB64}, puerto ${listenPort}.`
            )
          }

          // Save keys and server details to DB regardless
          await supabase.from('unifi_configs').update({
            wg_server_public_key: pubB64,
            wg_server_private_key: privB64,
            wg_server_ip: controllerHost,
            wg_port: config.wg_port ?? 51820,
            wg_network: config.wg_network ?? '10.99.1.0/24',
          }).eq('org_id', org_id)

        } catch (e: any) {
          errors.push(`WireGuard: error generando claves — ${e.message}`)
        }
      } else {
        checks.push('WireGuard: claves del servidor ya generadas')
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
      // Case-insensitive search to catch partial previous attempts
      let wlanId = wlans.data?.find((w: any) =>
        w.name?.toLowerCase() === 'penwinsafe'
      )?._id

      if (!wlanId) {
        const wpaKey = Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map(b => b.toString(16).padStart(2, '0')).join('')

        // Copy ap_group_ids from any existing WLAN (most reliable source)
        let apGroupIds: string[] = (wlans.data ?? [])
          .map((w: any) => w.ap_group_ids ?? [])
          .find((ids: string[]) => ids.length > 0) ?? []

        if (!apGroupIds.length) {
          try {
            const apGroups = await client.get(`/proxy/network/api/s/${site}/rest/apgroup`)
            const list = apGroups?.data ?? (Array.isArray(apGroups) ? apGroups : [])
            apGroupIds = list.map((g: any) => g._id).filter(Boolean)
          } catch { /* ignore */ }
        }

        try {
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
            ap_group_mode: 'all',
            ap_group_ids: apGroupIds,
          })
          wlanId = wlanRes.data?.[0]?._id
          checks.push('SSID PenwinSafe creado (WPA2, red VLAN 99)')
        } catch (e: any) {
          if (e.message?.includes('TooManyWirelessNetwork')) {
            errors.push(
              `El controlador ha alcanzado el límite de SSIDs. ` +
              `Elimina algún SSID que no uses desde el panel de UniFi (` +
              `Configuración → WiFi) y vuelve a intentarlo. ` +
              `Actualmente tienes ${wlans.data?.length ?? '?'} SSIDs configurados.`
            )
            return json({ ok: false, checks, errors })
          }
          throw e
        }
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

      // 5. Save config to DB — do NOT touch last_check_ok (that's only for the connection wizard)
      await supabase.from('unifi_configs').update({
        network_active: errors.length === 0,
        vlan_network_id: vlanId,
        wlan_id: wlanId,
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
