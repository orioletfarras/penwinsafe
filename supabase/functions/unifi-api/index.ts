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
  cookies = ''
  csrf = ''

  constructor(url: string) {
    let u = url.trim()
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u
    this.baseUrl = u.replace(/\/$/, '')
  }

  /** Load a previously-cached session (skip if blank) */
  loadSession(cookie: string, csrf: string) {
    if (cookie) { this.cookies = cookie; this.csrf = csrf || '' }
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

  /** Try a lightweight authenticated call; returns true if session is still valid */
  async sessionValid(site: string): Promise<boolean> {
    if (!this.cookies) return false
    try {
      const res = await fetch(`${this.baseUrl}/proxy/network/api/s/${site}/stat/health`, {
        headers: { 'Cookie': this.cookies, 'X-Csrf-Token': this.csrf },
      })
      return res.ok
    } catch { return false }
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

  // Verify caller is authenticated
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: adminUser } = await supabase
    .from('admin_users')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!adminUser) return json({ error: 'Forbidden' }, 403)
  const isSuperAdmin = adminUser.role === 'superadmin'

  const { action, org_id, ...params } = await req.json()

  // Read-only actions available to any admin of the org
  const readOnlyActions = new Set(['get_traffic'])
  if (!isSuperAdmin && !readOnlyActions.has(action)) return json({ error: 'Forbidden' }, 403)
  if (!isSuperAdmin && org_id && adminUser.org_id !== org_id) return json({ error: 'Forbidden' }, 403)

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
    // Try cached session first (avoids 429 from repeated logins)
    const sessionAge = config.session_at
      ? (Date.now() - new Date(config.session_at).getTime()) / 1000
      : Infinity
    const sessionFresh = sessionAge < 3600 // 1 h TTL
    let needLogin = true

    if (sessionFresh && config.session_cookie) {
      client.loadSession(config.session_cookie, config.session_csrf || '')
      needLogin = !(await client.sessionValid(site))
    }

    if (needLogin) {
      await client.login(config.username, config.password)
      // Persist new session
      await supabase.from('unifi_configs').update({
        session_cookie: client.cookies,
        session_csrf:   client.csrf,
        session_at:     new Date().toISOString(),
      }).eq('org_id', org_id)
    }

    // ── CHECK: verify connectivity + gather info ──────────────────────────
    if (action === 'check') {
      const siteInfo = await client.get(`/proxy/network/api/s/${site}/stat/sysinfo`)
      const networks = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const wlans    = await client.get(`/proxy/network/api/s/${site}/rest/wlanconf`)
      const devices  = await client.get(`/proxy/network/api/s/${site}/stat/device`)

      const hasWg = devices.data?.some((d: any) =>
        d.features?.includes('wireguard') || d.vpn_enabled
      )

      const info = siteInfo.data?.[0] || {}
      const sysinfoModel = (info.model || info.ubnt_device_type || '').toLowerCase()

      // Also check the devices list — the gateway device (type=ugw) has the real model
      const gatewayDevice = (devices.data || []).find((d: any) =>
        d.type === 'ugw' || d.type === 'usg' ||
        (d.model || '').toLowerCase().includes('uxg') ||
        (d.model || '').toLowerCase().includes('ugw') ||
        (d.model || '').toLowerCase().includes('udm')
      )
      const deviceModel = (gatewayDevice?.model || '').toLowerCase()
      const gatewayModel = deviceModel || sysinfoModel

      // /proxy/network/ is ONLY available on UniFi OS (UXG, UDM, CloudKey G2+)
      // If we successfully fetched sysinfo via that path, it's confirmed UniFi OS
      const isUXG = true

      const existingVlan = networks.data?.find((n: any) => n.name === 'PenwinSafe')
      const existingSsid = wlans.data?.find((w: any) => w.name === 'PenwinSafe')
      const dnsZonesCreated = networks.data?.some((n: any) => n.name?.startsWith('PenwinSafe —'))

      return json({
        ok: true,
        sysinfo: info,
        gateway_model: gatewayModel || sysinfoModel || 'desconocido',
        is_uxg: isUXG,
        vlan_exists: !!existingVlan,
        ssid_exists: !!existingSsid,
        dns_zones_created: dnsZonesCreated,
        wireguard_available: hasWg,
        device_count: devices.data?.length || 0,
      })
    }

    // ── CONFIGURE_DNS_ZONES: create per-zone VLANs + DoH on UXG ──────────
    if (action === 'configure_dns_zones') {
      // 1. Load Cloudflare config (DoH URLs per zone)
      const { data: cfCfg } = await supabase
        .from('cloudflare_configs')
        .select('zone_students_doh, zone_teachers_doh, zone_admin_doh, zone_students_name, zone_teachers_name, zone_admin_name')
        .eq('org_id', org_id)
        .single()
      if (!cfCfg?.zone_students_doh) throw new Error('Configura primero las zonas DNS en Cloudflare Gateway (DNS Escolar)')

      // 2. Detect UXG / UniFi OS
      const sysinfoRes = await client.get(`/proxy/network/api/s/${site}/stat/sysinfo`)
      const info = sysinfoRes.data?.[0] || {}
      const gatewayModel = (info.model || info.ubnt_device_type || '').toLowerCase()
      const isUXG = gatewayModel.includes('uxg') || gatewayModel.includes('udm') ||
                    gatewayModel.includes('unifi') || !!info.unifi_os_version
      if (!isUXG) throw new Error(`Dispositivo no compatible (${gatewayModel || 'desconocido'}). Esta función requiere UXG o UDM con UniFi OS.`)

      const checks: string[] = []
      const errors: string[] = []

      // 3. Define zones — each VLAN uses the UXG's own gateway IP as DNS.
      //    The UXG is configured per-VLAN via DoH stub resolver entries.
      const zoneDefs = [
        { key: 'students', name: cfCfg.zone_students_name || 'Alumnos',       vlan: 10, subnet: '10.10.0', doh: cfCfg.zone_students_doh },
        { key: 'teachers', name: cfCfg.zone_teachers_name || 'Profesores',    vlan: 20, subnet: '10.20.0', doh: cfCfg.zone_teachers_doh },
        { key: 'admin',    name: cfCfg.zone_admin_name    || 'Administración', vlan: 30, subnet: '10.30.0', doh: cfCfg.zone_admin_doh },
      ]

      // 4. Try to configure global DoH on the UXG (students zone = most restrictive as default)
      //    Different API versions use different paths — probe until one works.
      const defaultDohUrl = `https://${cfCfg.zone_students_doh}.cloudflare-gateway.com/dns-query`
      let dohConfigured = false

      const dohAttempts: Array<{ method: string; path: string; body: unknown }> = [
        // UniFi OS v3+ (UXG Pro, UDM)
        { method: 'PUT',  path: `/proxy/network/v2/api/site/${site}/setting/super_dns`,
          body: { dns_shield_enabled: true, custom_dns_over_https: true, dns_over_https_url: defaultDohUrl } },
        { method: 'PUT',  path: `/proxy/network/v2/api/site/${site}/setting/super_dns`,
          body: { enabled: true, upstreams: [{ url: defaultDohUrl, name: 'PenwinSafe' }] } },
        // Legacy Network Application
        { method: 'POST', path: `/proxy/network/api/s/${site}/set/setting/super_dns`,
          body: { dns_over_https_enabled: true, x_dns_over_https_url: defaultDohUrl } },
        { method: 'POST', path: `/proxy/network/api/s/${site}/set/setting/super_dns`,
          body: { nameserver_1: defaultDohUrl } },
      ]

      for (const { method, path, body } of dohAttempts) {
        try {
          if (method === 'PUT') await client.put(path, body)
          else await client.post(path, body)
          dohConfigured = true
          checks.push(`DoH configurado en el router → ${cfCfg.zone_students_name || 'Alumnos'} (zona predeterminada)`)
          break
        } catch { /* try next */ }
      }

      if (!dohConfigured) {
        errors.push(
          `DoH no se pudo configurar automáticamente. ` +
          `Configúralo manualmente: UniFi → Settings → DNS Shield → Custom → ${defaultDohUrl}`
        )
      }

      // 5. Create or update 3 VLANs
      const networksRes = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const existingNets: any[] = networksRes.data || []

      for (const z of zoneDefs) {
        const vlanName = `PenwinSafe — ${z.name}`
        const existing = existingNets.find((n: any) => n.name === vlanName)
        const gatewayIp = `${z.subnet}.1`
        const vlanConf = {
          name: vlanName,
          purpose: 'corporate',
          vlan_enabled: true,
          vlan: z.vlan,
          ip_subnet: `${gatewayIp}/24`,
          dhcpd_enabled: true,
          dhcpd_start: `${z.subnet}.100`,
          dhcpd_stop: `${z.subnet}.254`,
          dhcpd_dns_enabled: true,
          dhcpd_dns_1: gatewayIp, // UXG gateway = DoH proxy for this VLAN
          igmp_snooping: false,
        }
        try {
          if (existing) {
            await client.put(`/proxy/network/api/s/${site}/rest/networkconf/${existing._id}`, { ...existing, ...vlanConf })
            checks.push(`VLAN "${vlanName}" actualizada (VLAN ${z.vlan}, ${gatewayIp}/24)`)
          } else {
            await client.post(`/proxy/network/api/s/${site}/rest/networkconf`, vlanConf)
            checks.push(`VLAN "${vlanName}" creada (VLAN ${z.vlan}, ${gatewayIp}/24)`)
          }
        } catch (e: any) {
          errors.push(`VLAN ${vlanName}: ${e.message}`)
        }
      }

      // 6. Firewall: block external DNS (port 53) from PenwinSafe VLANs
      //    This prevents bypassing the gateway's DoH by using 8.8.8.8 etc.
      const fwRes = await client.get(`/proxy/network/api/s/${site}/rest/firewallrule`)
      const existingFw: any[] = fwRes.data || []

      for (const z of zoneDefs) {
        const ruleName = `PenwinSafe Block DNS Bypass — ${z.name}`
        if (existingFw.find((r: any) => r.name === ruleName)) continue
        // Find the VLAN ID we just created
        const refreshedNets = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
        const vlanId = refreshedNets.data?.find((n: any) => n.name === `PenwinSafe — ${z.name}`)?._id
        if (!vlanId) continue
        try {
          await client.post(`/proxy/network/api/s/${site}/rest/firewallrule`, {
            name: ruleName,
            ruleset: 'LAN_OUT',
            rule_index: 22000 + z.vlan,
            action: 'drop',
            enabled: true,
            logging: false,
            protocol: 'tcp_udp',
            src_networkconf_id: vlanId,
            src_networkconf_type: 'NETv4',
            src_firewallgroup_ids: [],
            src_address: '',
            dst_address: '',
            dst_port: '53',
            dst_firewallgroup_ids: [],
            dst_networkconf_type: 'NETv4',
            dst_networkconf_id: '',
            state_new: false, state_established: false, state_invalid: false, state_related: false,
            ipsec: '', protocol_match_excepted: false, setting_preference: 'manual',
          })
          checks.push(`Regla firewall: bloqueo DNS externo en VLAN ${z.name}`)
        } catch (e: any) {
          errors.push(`Firewall DNS ${z.name}: ${e.message}`)
        }
      }

      await supabase.from('unifi_configs')
        .update({ dns_zones_configured: true, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)

      return json({ ok: errors.length === 0, checks, errors, doh_configured: dohConfigured })
    }

    // ── SETUP_DNS_ENFORCEMENT: replicate zone-based DNS enforcement ──────────
    // Creates DNS_Permitido + DoH_Providers groups, then ALLOW/BLOCK policies
    // that force all DNS traffic through the school's filtering server.
    if (action === 'setup_dns_enforcement') {
      const { dns_server_ip, vlan_ids } = params as { dns_server_ip?: string; vlan_ids?: string[] }
      if (!dns_server_ip) return json({ error: 'dns_server_ip is required' }, 400)

      const checks: string[] = []
      const errors: string[] = []

      const DOH_IPS = [
        '1.1.1.1','1.0.0.1',
        '8.8.8.8','8.8.4.4',
        '9.9.9.9','149.112.112.112',
        '208.67.222.222','208.67.220.220',
        '94.140.14.14','94.140.15.15',
        '76.76.2.0','76.76.10.0',
        '185.228.168.9','185.228.169.9',
        '176.103.130.130','176.103.130.131',
        '45.90.28.0','45.90.30.0',
        '101.101.101.101','101.102.103.104',
        '8.20.247.20','8.26.56.26',
        '156.154.70.1','156.154.71.1',
        '64.6.64.6','64.6.65.6',
        '195.46.39.39','195.46.39.40',
        '77.88.8.8','77.88.8.1',
        '198.101.242.72','23.253.163.53',
      ]

      // 1. Firewall groups
      const groupsRes = await client.get(`/proxy/network/api/s/${site}/rest/firewallgroup`)
      const allGroups: any[] = groupsRes.data ?? []

      let dnsGroupId = ''
      const existingDnsGroup = allGroups.find((g: any) => g.name === 'DNS_Permitido')
      if (existingDnsGroup) {
        await client.put(
          `/proxy/network/api/s/${site}/rest/firewallgroup/${existingDnsGroup._id}`,
          { ...existingDnsGroup, group_members: [dns_server_ip] }
        )
        dnsGroupId = existingDnsGroup._id
        checks.push(`Grupo DNS_Permitido actualizado → ${dns_server_ip}`)
      } else {
        const r = await client.post(`/proxy/network/api/s/${site}/rest/firewallgroup`, {
          name: 'DNS_Permitido',
          group_type: 'address-group',
          group_members: [dns_server_ip],
        })
        dnsGroupId = r.data?.[0]?._id
        if (!dnsGroupId) throw new Error('No se pudo crear el grupo DNS_Permitido')
        checks.push(`Grupo DNS_Permitido creado → ${dns_server_ip}`)
      }

      let dohGroupId = ''
      const existingDohGroup = allGroups.find((g: any) => g.name === 'DoH_Providers')
      if (existingDohGroup) {
        await client.put(
          `/proxy/network/api/s/${site}/rest/firewallgroup/${existingDohGroup._id}`,
          { ...existingDohGroup, group_members: DOH_IPS }
        )
        dohGroupId = existingDohGroup._id
        checks.push(`Grupo DoH_Providers actualizado (${DOH_IPS.length} IPs)`)
      } else {
        const r = await client.post(`/proxy/network/api/s/${site}/rest/firewallgroup`, {
          name: 'DoH_Providers',
          group_type: 'address-group',
          group_members: DOH_IPS,
        })
        dohGroupId = r.data?.[0]?._id
        if (!dohGroupId) throw new Error('No se pudo crear el grupo DoH_Providers')
        checks.push(`Grupo DoH_Providers creado (${DOH_IPS.length} IPs)`)
      }

      // 2. Get zone IDs from zone-matrix
      const zoneMatrixRes = await client.get(`/proxy/network/v2/api/site/${site}/firewall/zone-matrix`)
      const rawZones: any[] = zoneMatrixRes.zones ?? zoneMatrixRes.data ?? (Array.isArray(zoneMatrixRes) ? zoneMatrixRes : [])
      const zoneByName: Record<string, string> = {}
      for (const z of rawZones) {
        const id   = z._id || z.id || ''
        const name = (z.name || z.type || '').toLowerCase()
        if (id && name) zoneByName[name] = id
      }
      const internalZoneId = zoneByName['internal'] ?? ''
      const externalZoneId = zoneByName['external'] ?? ''
      const hotspotZoneId  = zoneByName['hotspot']  ?? ''
      const vpnZoneId      = zoneByName['vpn']       ?? ''
      const dmzZoneId      = zoneByName['dmz']       ?? ''
      if (!internalZoneId || !externalZoneId)
        throw new Error(`No se obtuvieron zonas del firewall. zone-matrix: ${JSON.stringify(rawZones).slice(0, 300)}`)

      // 3. Existing policy names (to skip duplicates)
      const rawPolicies = await client.get(`/proxy/network/v2/api/site/${site}/firewall-policies`)
      const existingPolicies: any[] = Array.isArray(rawPolicies)
        ? rawPolicies
        : (rawPolicies.data ?? rawPolicies.policies ?? [])
      const policyNames = new Set(existingPolicies.map((p: any) => p.name))

      const scheduleAlways = { mode: 'ALWAYS', repeat_on_days: [], time_all_day: false }
      const basePolicy = {
        connection_state_type: 'ALL',
        connection_states: [],
        create_allow_respond: false,
        enabled: true,
        ip_version: 'IPV4',
        logging: false,
        match_ip_sec: false,
        match_ip_sec_type: 'MATCH_IP_SEC',
        match_opposite_protocol: false,
        predefined: false,
        schedule: scheduleAlways,
      }

      // 4. ALLOW port 53 from each zone → DNS_Permitido in Internal
      const srcZones = [
        { name: 'Internal', id: internalZoneId },
        { name: 'External', id: externalZoneId },
        ...(hotspotZoneId ? [{ name: 'Hotspot', id: hotspotZoneId }] : []),
        ...(vpnZoneId     ? [{ name: 'VPN',     id: vpnZoneId     }] : []),
        ...(dmzZoneId     ? [{ name: 'DMZ',     id: dmzZoneId     }] : []),
      ]

      let policyIdx = 10000
      for (const sz of srcZones) {
        const name = `PenwinSafe Permitir DNS (${sz.name})`
        if (!policyNames.has(name)) {
          try {
            await client.post(`/proxy/network/v2/api/site/${site}/firewall-policies`, {
              ...basePolicy,
              action: 'ALLOW',
              name,
              protocol: 'tcp_udp',
              source: {
                match_opposite_ports: false,
                matching_target: 'ANY',
                matching_target_type: 'SPECIFIC',
                port_matching_type: 'ANY',
                zone_id: sz.id,
              },
              destination: {
                ip_group_id: dnsGroupId,
                ips: [],
                match_opposite_ips: false,
                match_opposite_ports: false,
                matching_target: 'IP',
                matching_target_type: 'OBJECT',
                port: '53',
                port_matching_type: 'SPECIFIC',
                zone_id: internalZoneId,
              },
              index: policyIdx++,
            })
            checks.push(`ALLOW DNS (${sz.name}) creada`)
          } catch (e: any) {
            errors.push(`ALLOW DNS ${sz.name}: ${e.message}`)
          }
        } else {
          checks.push(`ALLOW DNS (${sz.name}) ya existe`)
        }
      }

      // 5. Determine target VLANs
      const networksRes = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const allNets: any[] = networksRes.data ?? []
      let targetVlans: Array<{ id: string; name: string }>
      if (vlan_ids?.length) {
        targetVlans = vlan_ids.map(id => ({
          id, name: allNets.find((n: any) => n._id === id)?.name ?? id,
        }))
      } else {
        targetVlans = allNets
          .filter((n: any) => n.vlan_enabled && n.vlan && n.purpose !== 'wan' && n.purpose !== 'wan2')
          .map((n: any) => ({ id: n._id, name: n.name }))
      }

      // 6. BLOCK rules per VLAN
      policyIdx = 11000
      for (const vlan of targetVlans) {
        // Block DNS to Internal (unauthorized LAN DNS servers)
        const blockLanName = `PenwinSafe Bloquear DNS LAN ${vlan.name}`
        if (!policyNames.has(blockLanName)) {
          try {
            await client.post(`/proxy/network/v2/api/site/${site}/firewall-policies`, {
              ...basePolicy,
              action: 'BLOCK',
              name: blockLanName,
              protocol: 'tcp_udp',
              source: {
                match_opposite_ports: false,
                matching_target: 'NETWORK',
                matching_target_type: 'SPECIFIC',
                network_id: vlan.id,
                port_matching_type: 'ANY',
                zone_id: internalZoneId,
              },
              destination: {
                ips: [],
                match_opposite_ips: false,
                match_opposite_ports: false,
                matching_target: 'ANY',
                matching_target_type: 'SPECIFIC',
                port: '53',
                port_matching_type: 'SPECIFIC',
                zone_id: internalZoneId,
              },
              index: policyIdx++,
            })
            checks.push(`BLOCK DNS LAN (${vlan.name}) creada`)
          } catch (e: any) {
            errors.push(`BLOCK DNS LAN ${vlan.name}: ${e.message}`)
          }
        } else {
          checks.push(`BLOCK DNS LAN (${vlan.name}) ya existe`)
        }

        // Block DNS to External (direct internet DNS queries)
        const blockWanName = `PenwinSafe Bloquear DNS WAN ${vlan.name}`
        if (!policyNames.has(blockWanName)) {
          try {
            await client.post(`/proxy/network/v2/api/site/${site}/firewall-policies`, {
              ...basePolicy,
              action: 'BLOCK',
              name: blockWanName,
              protocol: 'tcp_udp',
              source: {
                match_opposite_ports: false,
                matching_target: 'NETWORK',
                matching_target_type: 'SPECIFIC',
                network_id: vlan.id,
                port_matching_type: 'ANY',
                zone_id: internalZoneId,
              },
              destination: {
                ips: [],
                match_opposite_ips: false,
                match_opposite_ports: false,
                matching_target: 'ANY',
                matching_target_type: 'SPECIFIC',
                port: '53',
                port_matching_type: 'SPECIFIC',
                zone_id: externalZoneId,
              },
              index: policyIdx++,
            })
            checks.push(`BLOCK DNS WAN (${vlan.name}) creada`)
          } catch (e: any) {
            errors.push(`BLOCK DNS WAN ${vlan.name}: ${e.message}`)
          }
        } else {
          checks.push(`BLOCK DNS WAN (${vlan.name}) ya existe`)
        }

        // Block DoH (port 443 TCP to known DoH providers)
        const blockDohName = `PenwinSafe Bloquear DoH ${vlan.name}`
        if (!policyNames.has(blockDohName)) {
          try {
            await client.post(`/proxy/network/v2/api/site/${site}/firewall-policies`, {
              ...basePolicy,
              action: 'BLOCK',
              name: blockDohName,
              protocol: 'tcp',
              source: {
                match_opposite_ports: false,
                matching_target: 'NETWORK',
                matching_target_type: 'SPECIFIC',
                network_id: vlan.id,
                port_matching_type: 'ANY',
                zone_id: internalZoneId,
              },
              destination: {
                ip_group_id: dohGroupId,
                ips: [],
                match_opposite_ips: false,
                match_opposite_ports: false,
                matching_target: 'IP',
                matching_target_type: 'OBJECT',
                port: '443',
                port_matching_type: 'SPECIFIC',
                zone_id: externalZoneId,
              },
              index: policyIdx++,
            })
            checks.push(`BLOCK DoH (${vlan.name}) creada`)
          } catch (e: any) {
            errors.push(`BLOCK DoH ${vlan.name}: ${e.message}`)
          }
        } else {
          checks.push(`BLOCK DoH (${vlan.name}) ya existe`)
        }
      }

      await supabase.from('unifi_configs')
        .update({ dns_zones_configured: true, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)

      return json({
        ok: errors.length === 0,
        checks,
        errors,
        groups: { dns_group_id: dnsGroupId, doh_group_id: dohGroupId },
        zones: { internal: internalZoneId, external: externalZoneId },
        vlans_configured: targetVlans.length,
        vlans: targetVlans.map(v => v.name),
      })
    }

    // ── PROBE_FIREWALL: exhaustive search for DNS rules + groups ─────────────
    if (action === 'probe_firewall') {
      const endpoints = [
        // Legacy REST
        `/proxy/network/api/s/${site}/rest/firewallrule`,
        `/proxy/network/api/s/${site}/rest/firewallgroup`,
        `/proxy/network/api/s/${site}/rest/portforward`,
        `/proxy/network/api/s/${site}/rest/routing`,
        // v2 firewall
        `/proxy/network/v2/api/site/${site}/firewall/rules`,
        `/proxy/network/v2/api/site/${site}/firewall/groups`,
        `/proxy/network/v2/api/site/${site}/firewall/nat`,
        `/proxy/network/v2/api/site/${site}/firewall/policies`,
        `/proxy/network/v2/api/site/${site}/firewall/zones`,
        `/proxy/network/v2/api/site/${site}/firewall/zone-matrix`,
        `/proxy/network/v2/api/site/${site}/firewall`,
        // Zone-based firewall (hyphen variant — confirmed endpoint)
        `/proxy/network/v2/api/site/${site}/firewall-policies`,
        `/proxy/network/v2/api/site/${site}/zbf`,
        `/proxy/network/v2/api/site/${site}/zbf/rules`,
        // Traffic/security
        `/proxy/network/v2/api/site/${site}/trafficrules`,
        `/proxy/network/v2/api/site/${site}/trafficrule`,
        `/proxy/network/v2/api/site/${site}/security`,
        `/proxy/network/v2/api/site/${site}/security/firewall`,
        // IP/port groups
        `/proxy/network/v2/api/site/${site}/ipgroup`,
        `/proxy/network/v2/api/site/${site}/portgroup`,
        // NAT
        `/proxy/network/v2/api/site/${site}/nat`,
        `/proxy/network/v2/api/site/${site}/nat/rules`,
      ]

      const results: Record<string, any> = {}
      await Promise.all(endpoints.map(async (ep) => {
        const r = await client.probe(ep)
        if (r !== null) results[ep] = r
      }))

      // Extract firewall groups (DNS_Permitido, DoH_Providers)
      const groups = results[`/proxy/network/api/s/${site}/rest/firewallgroup`]?.data ?? []
      const dnsGroup = groups.find((g: any) => g.name?.toLowerCase().includes('dns'))
      const dohGroup = groups.find((g: any) => g.name?.toLowerCase().includes('doh'))

      return json({
        ok: true,
        endpoints_with_data: Object.keys(results),
        firewall_groups: groups,
        dns_permitido_group: dnsGroup ?? null,
        doh_providers_group: dohGroup ?? null,
        raw: results,
      })
    }

    // ── PROBE_VLAN: dump raw networkconf for a VLAN by name (for debugging) ──
    if (action === 'probe_vlan') {
      const { vlan_name } = params as { vlan_name?: string }
      const raw = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const nets: any[] = raw.data ?? []
      if (vlan_name) {
        const found = nets.filter((n: any) =>
          n.name?.toLowerCase().includes(vlan_name.toLowerCase())
        )
        return json({ ok: true, vlans: found, total: nets.length })
      }
      // Also dump DNS-shield related settings
      const superDns = await client.probe(`/proxy/network/api/s/${site}/get/setting/super_dns`)
      const superDnsV2 = await client.probe(`/proxy/network/v2/api/site/${site}/setting/super_dns`)
      const dnsShieldList = await client.probe(`/proxy/network/v2/api/site/${site}/dns-shield/servers`)
      const dnsShieldListV1 = await client.probe(`/proxy/network/api/s/${site}/rest/dns-shield`)
      return json({
        ok: true,
        total_vlans: nets.length,
        vlan_names: nets.map((n: any) => ({ id: n._id, name: n.name, vlan: n.vlan })),
        super_dns_legacy: superDns,
        super_dns_v2: superDnsV2,
        dns_shield_servers_v2: dnsShieldList,
        dns_shield_servers_v1: dnsShieldListV1,
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

    // ── get_networks: list wired networks with client counts + stored zone map ──
    if (action === 'get_networks') {
      const [networksRes, staRes] = await Promise.all([
        client.get(`/proxy/network/api/s/${site}/rest/networkconf`),
        client.get(`/proxy/network/api/s/${site}/stat/sta`).catch(() => ({ data: [] })),
      ])

      const clients: any[] = staRes.data || []
      const clientsByNet: Record<string, number> = {}
      for (const c of clients) {
        const key = c.network_id || c.networkconf_id || ''
        if (key) clientsByNet[key] = (clientsByNet[key] || 0) + 1
      }

      const networks = (networksRes.data || [])
        .filter((n: any) => n.purpose !== 'wan' && n.purpose !== 'wan2' && n.enabled !== false)
        .map((n: any) => ({
          id:           n._id,
          name:         n.name,
          vlan:         n.vlan ?? null,
          purpose:      n.purpose,
          subnet:       n.ip_subnet ?? null,
          dhcp_enabled: !!n.dhcpd_enabled,
          dhcp_dns:     n.dhcpd_dns_1 ?? null,
          client_count: clientsByNet[n._id] || 0,
        }))

      // Load stored zone map
      const { data: uCfg } = await supabase
        .from('unifi_configs').select('network_zone_map').eq('org_id', org_id).single()
      let zoneMap: Record<string, string> = (uCfg?.network_zone_map as Record<string, string>) || {}

      // Auto-detect from UniFi DNS filter profiles (if zone_map not yet saved)
      if (!Object.keys(zoneMap).length) {
        try {
          const { data: cfCfg } = await supabase
            .from('cloudflare_configs')
            .select('zone_students_doh, zone_teachers_doh, zone_admin_doh, zone_students_ip, zone_teachers_ip, zone_admin_ip')
            .eq('org_id', org_id).single()

          // Build lookup: DoH subdomain or IP → zone key
          const dohToZone: Record<string, string> = {}
          if (cfCfg?.zone_students_doh) dohToZone[cfCfg.zone_students_doh] = 'students'
          if (cfCfg?.zone_teachers_doh) dohToZone[cfCfg.zone_teachers_doh] = 'teachers'
          if (cfCfg?.zone_admin_doh)    dohToZone[cfCfg.zone_admin_doh]    = 'admin'
          const ipToZone: Record<string, string> = {}
          for (const ip of ((cfCfg?.zone_students_ip as string[]) || [])) ipToZone[ip] = 'students'
          for (const ip of ((cfCfg?.zone_teachers_ip as string[]) || [])) ipToZone[ip] = 'teachers'
          for (const ip of ((cfCfg?.zone_admin_ip    as string[]) || [])) ipToZone[ip] = 'admin'

          const netById: Record<string, boolean> = {}
          for (const n of networks) netById[n.id] = true
          const netByName: Record<string, string> = {}
          for (const n of networks) netByName[n.name.toLowerCase()] = n.id

          // 1. Try UniFi DNS filter profiles API (v2)
          const profiles = await client.probe(`/proxy/network/v2/api/site/${site}/dnsfilter/profiles`)
          const profileList: any[] = Array.isArray(profiles) ? profiles
            : (profiles?.data || profiles?.result || [])

          for (const p of profileList) {
            // Match profile to zone via DoH or IP
            let matchedZone: string | null = null
            const dohRaw: string = p.doh || p.doh_url || p.cloudflare_doh || p.resolver_url || ''
            for (const [sub, z] of Object.entries(dohToZone)) {
              if (dohRaw.includes(sub)) { matchedZone = z; break }
            }
            // Fallback: match by DHCP DNS IP in profile
            if (!matchedZone) {
              const dnsIp: string = p.dns_ip || p.primary_dns || ''
              if (dnsIp && ipToZone[dnsIp]) matchedZone = ipToZone[dnsIp]
            }
            if (!matchedZone) continue

            // Collect network IDs assigned to this profile
            const profileNets: any[] = p.networks || p.network_ids || p.origins || p.sources || []
            for (const pn of profileNets) {
              const netId = typeof pn === 'string'
                ? (netById[pn] ? pn : netByName[pn.toLowerCase()] || '')
                : (pn._id || pn.id || '')
              if (netId && netById[netId]) zoneMap[netId] = matchedZone
            }
          }

          // 2. Fallback: infer from DHCP DNS of each network
          if (!Object.keys(zoneMap).length) {
            for (const net of networks) {
              if (net.dhcp_dns && ipToZone[net.dhcp_dns]) {
                zoneMap[net.id] = ipToZone[net.dhcp_dns]
              }
            }
          }

          // Persist inferred map so it loads fast next time
          if (Object.keys(zoneMap).length) {
            await supabase.from('unifi_configs')
              .update({ network_zone_map: zoneMap, updated_at: new Date().toISOString() })
              .eq('org_id', org_id)
          }
        } catch { /* auto-detect failed — user assigns manually */ }
      }

      return json({ ok: true, networks, zone_map: zoneMap })
    }

    // ── apply_network_dns: set DHCP DNS on networks + persist zone map ───────
    if (action === 'apply_network_dns') {
      const zoneMap: Record<string, string> = body.zone_map || {}

      await supabase.from('unifi_configs')
        .update({ network_zone_map: zoneMap, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)

      const { data: cfCfg } = await supabase
        .from('cloudflare_configs')
        .select('zone_students_ip, zone_teachers_ip, zone_admin_ip')
        .eq('org_id', org_id).single()

      const zoneIps: Record<string, string> = {
        students: (cfCfg?.zone_students_ip as string[])?.[0] || '',
        teachers: (cfCfg?.zone_teachers_ip as string[])?.[0] || '',
        admin:    (cfCfg?.zone_admin_ip    as string[])?.[0] || '',
      }

      const networksRes = await client.get(`/proxy/network/api/s/${site}/rest/networkconf`)
      const allNets: any[] = networksRes.data || []

      const checks: string[] = []
      const errors: string[] = []

      for (const [netId, zone] of Object.entries(zoneMap)) {
        const net = allNets.find((n: any) => n._id === netId)
        if (!net || !net.dhcpd_enabled) continue
        const ip = zoneIps[zone]
        if (!ip) continue
        try {
          await client.put(`/proxy/network/api/s/${site}/rest/networkconf/${netId}`, {
            ...net,
            dhcpd_dns_enabled: true,
            dhcpd_dns_1: ip,
          })
          checks.push(`${net.name} → ${ip}`)
        } catch (e: any) { errors.push(`${net.name}: ${e.message}`) }
      }

      return json({ ok: errors.length === 0, checks, errors })
    }

    // ── get_traffic: DPI stats + hourly chart ────────────────────────────
    if (action === 'get_traffic') {
      // Uses the outer `client` and `site` (already authenticated with session cache)
      const base = `/proxy/network/api/s/${site}`
      const base2 = `/proxy/network/v2/api/site/${site}`

      // Known DPI app IDs → names (matches UniFi Activity page categories)
      const DPI_NAMES: Record<number, string> = {
        0: 'Otros', 1: 'HTTP', 2: 'SSL/TLS', 3: 'HTTPS', 4: 'QUIC',
        5: 'YouTube', 6: 'Transferencia Web', 7: 'Instagram', 8: 'Streaming',
        9: 'BitTorrent', 10: 'eDonkey', 11: 'Gnutella', 12: 'Kazaa',
        13: 'SoulSeek', 14: 'Facebook', 15: 'WhatsApp', 16: 'WeChat',
        17: 'Spotify', 18: 'Pandora', 19: 'Deezer', 20: 'Netflix',
        21: 'Twitch', 22: 'Hulu', 23: 'Steam', 24: 'Xbox Live',
        25: 'iCloud', 26: 'DNS', 27: 'NTP', 28: 'Apple Services',
        29: 'Windows Update', 30: 'Skype', 31: 'Facetime', 32: 'Viber',
        33: 'Line', 34: 'Facebook Messenger', 35: 'Snapchat', 36: 'Twitter / X',
        37: 'Pinterest', 38: 'Tumblr', 39: 'Reddit', 40: 'LinkedIn',
        41: 'Google Services', 42: 'Google Maps', 43: 'Google Play',
        44: 'Gmail', 45: 'YouTube Music', 46: 'Google Meet', 47: 'TikTok',
        48: 'Amazon Video', 49: 'Twilio', 50: 'Discord', 51: 'Slack',
        52: 'Zoom', 53: 'Webex', 54: 'GoToMeeting', 55: 'Microsoft Teams',
        56: 'Office 365', 57: 'OneDrive', 58: 'SharePoint', 59: 'Azure',
        60: 'Google', 61: 'Bing', 62: 'Yahoo', 63: 'DuckDuckGo',
        64: 'Cloudflare DNS', 65: 'OpenDNS', 66: 'Apple TV', 67: 'Roku',
        68: 'Windows Update', 69: 'Apple Update', 70: 'Android Update',
        71: 'Playstation Network', 72: 'Nintendo', 73: 'EA Games',
        74: 'Riot Games', 75: 'Microsoft Office', 76: 'Dropbox',
        77: 'Box', 78: 'Google Drive', 79: 'iCloud Drive', 80: 'Mega',
        81: 'MediaFire', 82: 'WeTransfer', 83: 'Wetransfer', 84: 'SMTP',
        85: 'IMAP/POP3', 86: 'VoIP', 87: 'SIP', 88: 'RTP',
        89: 'Google Drive', 90: 'Dropbox', 91: 'GitHub', 92: 'GitLab',
        93: 'Jira', 94: 'Confluence', 95: 'SharePoint', 96: 'Salesforce',
        97: 'Zendesk', 98: 'HubSpot', 99: 'Shopify', 100: 'WooCommerce',
        101: 'Stripe', 102: 'PayPal', 103: 'Venmo', 104: 'Cash App',
        105: 'Coinbase', 106: 'Binance', 107: 'Roblox', 108: 'Minecraft',
        109: 'Fortnite', 110: 'Amazon', 111: 'eBay', 112: 'AliExpress',
        113: 'Alibaba', 114: 'Etsy', 115: 'Cloudflare', 116: 'Fastly',
        117: 'Akamai', 118: 'AWS', 119: 'Google Cloud', 120: 'Azure',
        121: 'Telegram', 122: 'Signal', 123: 'Wickr', 124: 'Threema',
        125: 'Kahoot', 126: 'Quizlet', 127: 'Duolingo', 128: 'Khan Academy',
        129: 'Coursera', 130: 'Canva', 131: 'Adobe Creative', 132: 'Figma',
        133: 'Notion', 134: 'Airtable', 135: 'Trello', 136: 'Asana',
        137: 'Monday.com', 138: 'ClickUp', 139: 'Basecamp', 140: 'Epic Games',
        141: 'Ubisoft', 142: 'Activision', 143: 'Blizzard', 144: 'Valve',
        145: 'EA / Origin', 146: 'GOG', 147: 'Humble Bundle', 148: 'itch.io',
        149: 'Crunchyroll', 150: 'PlayStation', 151: 'Discovery+',
        152: 'Peacock', 153: 'Paramount+', 154: 'HBO Max', 155: 'Xbox',
        156: 'Apple Music', 157: 'Tidal', 158: 'SoundCloud', 159: 'Bandcamp',
        160: 'Disney+', 161: 'ESPN+', 162: 'FuboTV', 163: 'Sling TV',
        164: 'YouTube TV', 165: 'Prime Video', 166: 'Audible', 167: 'Kindle',
        168: 'Scribd', 169: 'Issuu', 170: 'Academia.edu',
        171: 'Google Photos', 172: 'iCloud Photos', 173: 'OneDrive Photos',
        174: 'Google Workspace', 175: 'Microsoft 365', 176: 'Atlassian',
        177: 'Trello', 178: 'Asana', 179: 'Slack',
        180: 'Zoom Video', 181: 'Google Meet', 182: 'Microsoft Teams Video',
        183: 'Webex', 184: 'FaceTime', 185: 'Apple Push',
        186: 'Apple iMessage', 187: 'Siri', 188: 'Apple Maps',
        189: 'Apple App Store', 190: 'Apple Services',
        191: 'Google Play Store', 192: 'Google Analytics', 193: 'Google Ads',
        194: 'Firebase', 195: 'Google Cloud', 196: 'Microsoft Azure',
        197: 'AWS S3', 198: 'AWS CloudFront', 199: 'AWS EC2',
        200: 'Twitch Stream', 201: 'YouTube Live', 202: 'TikTok Live',
        203: 'Instagram Live', 204: 'Facebook Live', 205: 'Snapchat',
        206: 'Pinterest', 207: 'LinkedIn', 208: 'Reddit',
        209: 'Twitter/X Media', 210: 'Tumblr', 211: 'Flickr',
        212: 'Imgur', 213: 'Giphy', 214: 'Tenor',
        215: 'Vimeo', 216: 'Dailymotion', 217: 'Veoh',
        218: 'Plex', 219: 'Jellyfin', 220: 'Emby',
        221: 'Nintendo Switch', 222: 'PlayStation Network',
        223: 'Xbox Network', 224: 'Steam Download', 225: 'Origin/EA',
        226: 'Ubisoft Connect', 227: 'Battle.net', 228: 'GOG Galaxy',
        229: 'Epic Games Launcher', 230: 'Riot Client',
        231: 'Valorant', 232: 'League of Legends', 233: 'CSGO',
        234: 'Dota 2', 235: 'Overwatch', 236: 'World of Warcraft',
        237: 'Minecraft Multiplayer', 238: 'Roblox Studio', 239: 'Among Us',
        240: 'VPN tráfico', 241: 'Tor', 242: 'Proxy',
        243: 'BitTorrent', 244: 'eDonkey', 245: 'Gnutella',
        246: 'SMTP salida', 247: 'IMAP', 248: 'POP3',
        249: 'DNS', 250: 'NTP', 251: 'DHCP', 252: 'ICMP',
        253: 'Multicast', 254: 'Broadcast', 255: 'Otros',
      }

      const CATEGORY_NAMES: Record<number, string> = {
        0: 'General', 1: 'Sistema', 2: 'Mensajería instantánea',
        3: 'Streaming video', 4: 'Streaming', 5: 'Redes sociales',
        6: 'Juegos', 7: 'Productividad', 8: 'Transferencia de archivos',
        9: 'VPN / Proxy', 10: 'Seguridad', 11: 'Red',
        12: 'Acceso remoto', 13: 'Correo electrónico', 14: 'Audio streaming',
        15: 'Web', 16: 'Cloud', 17: 'Actualizaciones', 18: 'CDN',
        19: 'Almacenamiento cloud', 20: 'Notificaciones push',
        21: 'Noticias / Media', 22: 'Comercio', 23: 'Finanzas',
      }

      const nowMs = Date.now()

      // Hourly bandwidth chart (last 24 h) — confirmed working
      let chart: any[] = []
      try {
        const r = await client.post(`${base}/stat/report/hourly.site`, {
          attrs: ['wan-rx_bytes', 'wan-tx_bytes'],
          start: nowMs - 86400000,
          end: nowMs,
        }) as any
        const startSec = Math.floor((nowMs - 86400000) / 1000)
        chart = (r?.data || []).map((p: any, i: number) => ({
          time: p.time ?? p.datetime ?? (startSec + i * 3600),
          rx: p['wan-rx_bytes'] || 0,
          tx: p['wan-tx_bytes'] || 0,
        }))
      } catch (_) {}

      // v2 per-app DPI traffic — exact endpoints used by UniFi Activity page
      // Confirmed from nginx logs: POST app-traffic-rate + GET traffic with ms timestamps
      let apps: any[] = []
      const timeParams = `start=${nowMs - 86400000}&end=${nowMs}&includeUnidentified=true`

      // GET /traffic — per-app totals (327 KB, confirmed in nginx logs)
      let trafficRaw: any = null
      try {
        const tRes = await fetch(
          `${config.controller_url.replace(/\/$/, '')}${base2}/traffic?${timeParams}`,
          { headers: { 'Cookie': client.cookies, 'X-Csrf-Token': client.csrf } }
        )
        if (tRes.ok) trafficRaw = await tRes.json()
      } catch (_) {}

      if (params.debug) return json({
        ok: true,
        traffic_status: trafficRaw ? 'ok' : 'failed',
        traffic_keys: trafficRaw ? Object.keys(trafficRaw) : null,
        total_usage_preview: trafficRaw?.total_usage_by_app?.slice(0, 5) ?? null,
        client_usage_count: trafficRaw?.client_usage_by_app?.length ?? 0,
      })

      // Parse /traffic response — keys: total_usage_by_app + client_usage_by_app
      if (trafficRaw) {
        // Build per-app client stats: count + top client
        const appClientMap: Record<number, { count: number; topClient: string; topBytes: number }> = {}
        for (const entry of (trafficRaw.client_usage_by_app || [])) {
          const clientName = entry.client?.name || entry.client?.hostname || entry.client?.mac || 'Unknown'
          for (const usage of (entry.usage_by_app || [])) {
            const appId: number = usage.application
            if (!appClientMap[appId]) appClientMap[appId] = { count: 0, topClient: '', topBytes: 0 }
            appClientMap[appId].count++
            if ((usage.total_bytes ?? 0) > appClientMap[appId].topBytes) {
              appClientMap[appId].topBytes = usage.total_bytes ?? 0
              appClientMap[appId].topClient = clientName
            }
          }
        }

        const rows: any[] = trafficRaw.total_usage_by_app || []
        if (rows.length) {
          apps = rows
            .filter((a: any) => a && typeof a === 'object')
            .map((a: any) => {
              const appId: number = a.application
              const rx = a.bytes_received ?? 0
              const tx = a.bytes_transmitted ?? 0
              const total = a.total_bytes ?? (rx + tx)
              const name = DPI_NAMES[appId] ?? (CATEGORY_NAMES[a.category] !== undefined ? `${CATEGORY_NAMES[a.category]} #${appId}` : `App ${appId}`)
              const ci = appClientMap[appId] || { count: 0, topClient: '', topBytes: 0 }
              return { name, app_id: appId, rx_bytes: rx, tx_bytes: tx, total_bytes: total,
                clients: ci.count, top_client: ci.topClient }
            })
            .filter((a: any) => a.total_bytes > 0)
            .sort((a: any, b: any) => b.total_bytes - a.total_bytes)
            .slice(0, 30)
        }
      }

      // Per-device 24h traffic via hourly user report
      let devices: any[] = []
      let totalRx = 0, totalTx = 0

      // Our device DB for name/student cross-reference
      const { data: dbDevices } = await supabase
        .from('devices').select('mac, name, student_name, group_name').eq('org_id', org_id)
      const deviceByMac: Record<string, any> = {}
      for (const d of dbDevices || []) {
        if (d.mac) deviceByMac[d.mac.toLowerCase()] = d
      }

      // UniFi known clients (hostname, alias, custom name)
      const unifiClients: Record<string, string> = {}
      try {
        const allUserRes = await client.get(`${base}/stat/alluser`) as any
        for (const c of (allUserRes?.data || [])) {
          const mac = (c.mac || '').toLowerCase()
          if (mac) unifiClients[mac] = c.alias || c.name || c.hostname || ''
        }
      } catch (_) {
        try {
          const staRes = await client.get(`${base}/stat/sta`) as any
          for (const c of (staRes?.data || [])) {
            const mac = (c.mac || '').toLowerCase()
            if (mac) unifiClients[mac] = c.alias || c.name || c.hostname || ''
          }
        } catch (_) {}
      }

      function resolveDeviceName(mac: string): string {
        const db = deviceByMac[mac]
        if (db?.name) return db.name
        const unifi = unifiClients[mac]
        if (unifi) return unifi
        // Show vendor prefix as fallback
        return mac.toUpperCase().replace(/:/g, '').slice(0, 6)
      }

      try {
        const userReport = await client.post(`${base}/stat/report/hourly.user`, {
          attrs: ['rx_bytes', 'tx_bytes'],
          start: nowMs - 86400000,
          end: nowMs,
        }) as any

        // Aggregate hourly rows per device
        const byMac: Record<string, { rx: number; tx: number }> = {}
        for (const row of (userReport?.data || [])) {
          const mac = (row.mac || row.user || '').toLowerCase()
          if (!mac) continue
          if (!byMac[mac]) byMac[mac] = { rx: 0, tx: 0 }
          byMac[mac].rx += row.rx_bytes || 0
          byMac[mac].tx += row.tx_bytes || 0
        }

        devices = Object.entries(byMac)
          .map(([mac, d]) => {
            const db = deviceByMac[mac]
            const rx = d.rx, tx = d.tx
            totalRx += rx; totalTx += tx
            return {
              mac,
              name: resolveDeviceName(mac),
              student: db?.student_name || null,
              group: db?.group_name || null,
              rx_bytes: rx,
              tx_bytes: tx,
              total_bytes: rx + tx,
            }
          })
          .filter(d => d.total_bytes > 0)
          .sort((a, b) => b.total_bytes - a.total_bytes)
          .slice(0, 30)
      } catch (_) {
        const staRes = await client.get(`${base}/stat/sta`) as any
        devices = (staRes?.data || [])
          .map((s: any) => {
            const mac = (s.mac || '').toLowerCase()
            const rx = s.rx_bytes || 0
            const tx = s.tx_bytes || 0
            totalRx += rx; totalTx += tx
            const db = deviceByMac[mac]
            return { mac, name: resolveDeviceName(mac), student: db?.student_name || null, group: db?.group_name || null, rx_bytes: rx, tx_bytes: tx, total_bytes: rx + tx }
          })
          .filter((d: any) => d.total_bytes > 0)
          .sort((a: any, b: any) => b.total_bytes - a.total_bytes)
          .slice(0, 30)
      }

      // If chart has data but total_rx/tx are still 0, sum from chart
      if (totalRx === 0 && totalTx === 0 && chart.length) {
        for (const p of chart) { totalRx += p.rx; totalTx += p.tx }
      }

      return json({ ok: true, total_rx: totalRx, total_tx: totalTx, devices, apps, chart })
    }

    return json({ error: 'Unknown action' }, 400)

  } catch (e: any) {
    return json({ ok: false, error: e.message }, 200)
  }
})
