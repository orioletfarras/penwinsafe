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

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// ── Cloudflare API client ─────────────────────────────────────────────────

class CF {
  private accountId: string
  private token: string
  private base = 'https://api.cloudflare.com/client/v4'

  constructor(accountId: string, token: string) {
    this.accountId = accountId
    this.token = token
  }

  private async req(method: string, path: string, body?: unknown) {
    const headers: Record<string, string> = { 'Authorization': `Bearer ${this.token}` }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })
    const data = await res.json()
    if (!data.success) {
      const msg = data.errors?.[0]?.message || `HTTP ${res.status}`
      throw new Error(msg)
    }
    return data.result
  }

  verifyToken()   { return this.req('GET', '/user/tokens/verify') }
  getAccount()    { return this.req('GET', `/accounts/${this.accountId}`) }
  getCategories() { return this.req('GET', `/accounts/${this.accountId}/gateway/categories`) }
  listLocations(): Promise<{ id: string; name: string }[]> { return this.req('GET', `/accounts/${this.accountId}/gateway/locations`) }

  getLocation(id: string) {
    return this.req('GET', `/accounts/${this.accountId}/gateway/locations/${id}`)
  }
  updateLocation(id: string, patch: unknown) {
    return this.req('PUT', `/accounts/${this.accountId}/gateway/locations/${id}`, patch)
  }
  createLocation(name: string) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/locations`, {
      name, client_default: false, ecs_support: false, networks: [],
    })
  }
  deleteLocation(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/locations/${id}`)
  }

  listLists(): Promise<{ id: string; name: string }[]>  { return this.req('GET', `/accounts/${this.accountId}/gateway/lists`) }
  listRules(): Promise<{ id: string; name: string }[]>  { return this.req('GET', `/accounts/${this.accountId}/gateway/rules`) }

  createList(name: string, domains: string[]) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/lists`, {
      name, type: 'DOMAIN',
      description: `PenwinSafe — ${name}`,
      items: domains.map(d => ({ value: d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0] })),
    })
  }
  deleteList(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/lists/${id}`)
  }

  createRule(rule: unknown) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/rules`, rule)
  }
  deleteRule(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/rules/${id}`)
  }
}

// ── Rule builders ─────────────────────────────────────────────────────────

// Note: dns.location.id is not supported on Cloudflare Zero Trust free plan.
// Rules are account-global; locations differentiate endpoints via unique DoH URLs.
function buildBlockRule(
  name: string,
  secIds: number[], contIds: number[], blockListId: string | null,
  precedence: number,
) {
  const conds: string[] = []
  if (secIds.length)  conds.push(`any(dns.security_category[*] in {${secIds.join(' ')}})`)
  if (contIds.length) conds.push(`any(dns.content_category[*] in {${contIds.join(' ')}})`)
  if (blockListId)    conds.push(`any(dns.domains[*] in $${blockListId})`)
  if (!conds.length)  return null

  return {
    name, description: `PenwinSafe — ${name}`, enabled: true, precedence,
    action: 'block', filters: ['dns'],
    traffic: conds.join(' or '),
    rule_settings: { block_page_enabled: false },
  }
}

function buildAllowRule(name: string, allowListId: string, precedence: number) {
  return {
    name: `${name} — permitidos`, description: `PenwinSafe whitelist — ${name}`,
    enabled: true, precedence, action: 'allow', filters: ['dns'],
    traffic: `any(dns.domains[*] in $${allowListId})`,
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

async function getCallerRole(authHeader: string | null, orgId: string) {
  if (!authHeader) throw new Error('No autorizado')
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('No autorizado')
  const { data: admin } = await supabase
    .from('admin_users').select('role, org_id').eq('id', user.id).single()
  if (!admin) throw new Error('No autorizado')
  if (admin.role !== 'superadmin' && admin.org_id !== orgId) throw new Error('Sin acceso a este centro')
  return admin.role as 'superadmin' | 'admin' | 'viewer'
}

async function requireSuperAdmin(authHeader: string | null) {
  if (!authHeader) throw new Error('No autorizado')
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('No autorizado')
  const { data: admin } = await supabase
    .from('admin_users').select('role').eq('id', user.id).single()
  if (admin?.role !== 'superadmin') throw new Error('Solo superadmin')
}

// ── Helpers ───────────────────────────────────────────────────────────────

function catHelpers(cfg: Record<string, unknown>) {
  const categories: { id: number; class: string }[] = (cfg.available_categories as unknown[]) || []
  const toSec  = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && (c.class === 'free' || c.class === 'blocked')))
  const toCont = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && c.class !== 'free' && c.class !== 'blocked'))
  return { toSec, toCont }
}

// Deletes only rules and lists — never touches locations
async function cleanupRulesAndLists(cf: CF, cfg: Record<string, unknown>) {
  try {
    const rules = await cf.listRules()
    for (const r of rules) {
      if (r.name.startsWith('PenwinSafe')) try { await cf.deleteRule(r.id) } catch (_) {}
    }
  } catch (_) {}
  try {
    const lists = await cf.listLists()
    for (const l of lists) {
      if (l.name.startsWith('PenwinSafe')) try { await cf.deleteList(l.id) } catch (_) {}
    }
  } catch (_) {}
}

// ── Apply zones (update rules only, keep existing locations) ──────────────

async function applyZones(cf: CF, cfg: Record<string, unknown>, orgId: string) {
  await cleanupRulesAndLists(cf, cfg)

  const { toSec, toCont } = catHelpers(cfg)
  const zones = [
    { key: 'students', name: cfg.zone_students_name as string || 'Alumnos',       prec: 10 },
    { key: 'teachers', name: cfg.zone_teachers_name as string || 'Profesores',    prec: 11 },
    { key: 'admin',    name: cfg.zone_admin_name    as string || 'Administración', prec: 12 },
  ]

  const dbUpdate: Record<string, unknown> = {
    last_check_ok: true, last_check_at: new Date().toISOString(),
    last_check_msg: 'Reglas aplicadas correctamente', updated_at: new Date().toISOString(),
  }

  for (const z of zones) {
    const selCats: number[] = (cfg[`categories_${z.key}`] as number[]) || []
    const blocked: string[] = (cfg[`custom_blocked_${z.key}`] as string[]) || []
    const allowed: string[] = (cfg[`whitelist_${z.key}`] as string[]) || []

    dbUpdate[`zone_${z.key}_list_id`]       = null
    dbUpdate[`zone_${z.key}_allow_list_id`] = null
    dbUpdate[`zone_${z.key}_allow_rule_id`] = null
    dbUpdate[`zone_${z.key}_rules`]         = []

    let blockListId: string | null = null
    if (blocked.length > 0) {
      const list = await cf.createList(`PenwinSafe Block ${z.name}`, blocked)
      blockListId = list.id
      dbUpdate[`zone_${z.key}_list_id`] = list.id
    }

    if (allowed.length > 0) {
      const allowList = await cf.createList(`PenwinSafe Allow ${z.name}`, allowed)
      dbUpdate[`zone_${z.key}_allow_list_id`] = allowList.id
      const allowRule = await cf.createRule(buildAllowRule(z.name, allowList.id, z.prec - 5))
      dbUpdate[`zone_${z.key}_allow_rule_id`] = allowRule.id
    }

    const blockRuleBody = buildBlockRule(`PenwinSafe ${z.name}`, toSec(selCats), toCont(selCats), blockListId, z.prec)
    if (blockRuleBody) {
      const blockRule = await cf.createRule(blockRuleBody)
      dbUpdate[`zone_${z.key}_rules`] = [blockRule.id]
    }
  }

  await supabase.from('cloudflare_configs').update(dbUpdate).eq('org_id', orgId)
}

// ── Create zones (first setup — creates locations + rules) ────────────────

async function createZones(cf: CF, cfg: Record<string, unknown>, orgId: string) {
  // Clean rules/lists first
  await cleanupRulesAndLists(cf, cfg)

  // Delete non-default locations by stored ID
  for (const key of ['zone_students_id', 'zone_teachers_id', 'zone_admin_id']) {
    const id = cfg[key] as string | null
    if (id) try { await cf.deleteLocation(id) } catch (_) {}
  }
  // Also remove orphaned non-default PenwinSafe locations
  try {
    const locs = await cf.listLocations()
    for (const loc of locs) {
      if (loc.name.startsWith('PenwinSafe') && !loc['client_default']) {
        try { await cf.deleteLocation(loc.id) } catch (_) {}
      }
    }
  } catch (_) {}

  const { toSec, toCont } = catHelpers(cfg)
  const zones = [
    { key: 'students', name: cfg.zone_students_name as string || 'Alumnos',       prec: 10 },
    { key: 'teachers', name: cfg.zone_teachers_name as string || 'Profesores',    prec: 11 },
    { key: 'admin',    name: cfg.zone_admin_name    as string || 'Administración', prec: 12 },
  ]

  const dbUpdate: Record<string, unknown> = {
    zones_created: true, zones_created_at: new Date().toISOString(),
    last_check_ok: true, last_check_at: new Date().toISOString(),
    last_check_msg: 'Zonas creadas correctamente', updated_at: new Date().toISOString(),
  }

  for (const z of zones) {
    const selCats: number[] = (cfg[`categories_${z.key}`] as number[]) || []
    const blocked: string[] = (cfg[`custom_blocked_${z.key}`] as string[]) || []
    const allowed: string[] = (cfg[`whitelist_${z.key}`] as string[]) || []

    const loc = await cf.createLocation(`PenwinSafe — ${z.name}`)
    dbUpdate[`zone_${z.key}_id`]  = loc.id
    dbUpdate[`zone_${z.key}_doh`] = loc.doh_subdomain
    dbUpdate[`zone_${z.key}_ip`]  = [loc.ipv4_destination, loc.ipv4_destination_backup].filter(Boolean)

    let blockListId: string | null = null
    if (blocked.length > 0) {
      const list = await cf.createList(`PenwinSafe Block ${z.name}`, blocked)
      blockListId = list.id
      dbUpdate[`zone_${z.key}_list_id`] = list.id
    }

    if (allowed.length > 0) {
      const allowList = await cf.createList(`PenwinSafe Allow ${z.name}`, allowed)
      dbUpdate[`zone_${z.key}_allow_list_id`] = allowList.id
      const allowRule = await cf.createRule(buildAllowRule(z.name, allowList.id, z.prec - 5))
      dbUpdate[`zone_${z.key}_allow_rule_id`] = allowRule.id
    }

    const blockRuleBody = buildBlockRule(`PenwinSafe ${z.name}`, toSec(selCats), toCont(selCats), blockListId, z.prec)
    if (blockRuleBody) {
      const blockRule = await cf.createRule(blockRuleBody)
      dbUpdate[`zone_${z.key}_rules`] = [blockRule.id]
    }
  }

  await supabase.from('cloudflare_configs').update(dbUpdate).eq('org_id', orgId)
}

// ── Main handler ──────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const body = await req.json()
    const { action, org_id } = body
    const authHeader = req.headers.get('Authorization')

    // ── verify (superadmin only) ──────────────────────────────────────────
    if (action === 'verify') {
      await requireSuperAdmin(authHeader)
      const cf = new CF(body.account_id, body.api_token)
      await cf.verifyToken()
      const account = await cf.getAccount()
      // Save credentials server-side via service_role (bypasses RLS)
      await supabase.from('cloudflare_configs').upsert({
        org_id:         org_id,
        account_id:     body.account_id,
        api_token:      body.api_token,
        last_check_ok:  true,
        last_check_at:  new Date().toISOString(),
        last_check_msg: `Cuenta verificada: ${account.name}`,
        updated_at:     new Date().toISOString(),
      })
      return json({ ok: true, account_name: account.name, account_type: account.type })
    }

    // ── debug_categories (superadmin only — temporary) ───────────────────
    if (action === 'debug_categories') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const categories = await cf.getCategories()
      return json({ ok: true, sample: (categories as unknown[]).slice(0, 5), total: (categories as unknown[]).length })
    }

    // ── get_categories (superadmin only) ──────────────────────────────────
    if (action === 'get_categories') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const categories = await cf.getCategories()
      // Log first category to see real structure
      if ((categories as unknown[]).length > 0) {
        console.log('CF category sample:', JSON.stringify((categories as unknown[])[0]))
      }
      const result = (categories as { id: number; name: string; class?: string; subcategories?: unknown[]; beta?: boolean }[])
        .filter(c => !c.beta)
        .map(c => ({
          id: c.id,
          name: c.name,
          // Cloudflare may return class as 'security'|'content'|'utm' or nested in subcategories
          class: c.class ?? (c.subcategories && c.subcategories.length === 0 ? 'security' : 'content'),
        }))
      await supabase.from('cloudflare_configs')
        .update({ available_categories: result, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)
      return json({ ok: true, categories: result })
    }

    // ── save_zone_config (superadmin or org admin) ────────────────────────
    // Persists config to DB without touching Cloudflare
    if (action === 'save_zone_config') {
      await getCallerRole(authHeader, org_id)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      const editableFields = [
        'zone_students_name', 'zone_teachers_name', 'zone_admin_name',
        'categories_students', 'categories_teachers', 'categories_admin',
        'custom_blocked_students', 'custom_blocked_teachers', 'custom_blocked_admin',
        'whitelist_students', 'whitelist_teachers', 'whitelist_admin',
      ]
      for (const f of editableFields) {
        if (body[f] !== undefined) patch[f] = body[f]
      }
      await supabase.from('cloudflare_configs').update(patch).eq('org_id', org_id)
      return json({ ok: true })
    }

    // ── apply_zones (superadmin or org admin) ─────────────────────────────
    // Optionally saves new config first, then reads from DB and pushes to Cloudflare
    if (action === 'apply_zones') {
      await getCallerRole(authHeader, org_id)

      // Save any config passed in the body before applying
      const editableFields = [
        'zone_students_name', 'zone_teachers_name', 'zone_admin_name',
        'categories_students', 'categories_teachers', 'categories_admin',
        'custom_blocked_students', 'custom_blocked_teachers', 'custom_blocked_admin',
        'whitelist_students', 'whitelist_teachers', 'whitelist_admin',
      ]
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      let hasPatch = false
      for (const f of editableFields) {
        if (body[f] !== undefined) { patch[f] = body[f]; hasPatch = true }
      }
      if (hasPatch) await supabase.from('cloudflare_configs').update(patch).eq('org_id', org_id)

      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      if (!cfg.account_id || !cfg.api_token) throw new Error('Credenciales no configuradas (requiere superadmin)')
      const cf = new CF(cfg.account_id, cfg.api_token)
      await applyZones(cf, cfg, org_id)
      return json({ ok: true })
    }

    // ── create_zones (superadmin only — saves config + applies) ──────────
    if (action === 'create_zones') {
      await requireSuperAdmin(authHeader)
      const { data: existing } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      const accountId = body.account_id || existing?.account_id
      const apiToken  = body.api_token  || existing?.api_token
      if (!accountId || !apiToken) throw new Error('Credenciales no encontradas')

      const names = body.zone_names || {}

      // Save the full config to DB first
      await supabase.from('cloudflare_configs').upsert({
        org_id,
        account_id: accountId, api_token: apiToken,
        zone_students_name: names.students || 'Alumnos',
        zone_teachers_name: names.teachers || 'Profesores',
        zone_admin_name:    names.admin    || 'Administración',
        categories_students: body.categories_students ?? [],
        categories_teachers: body.categories_teachers ?? [],
        categories_admin:    body.categories_admin    ?? [],
        custom_blocked_students: body.custom_blocked_students ?? [],
        custom_blocked_teachers: body.custom_blocked_teachers ?? [],
        custom_blocked_admin:    body.custom_blocked_admin    ?? [],
        updated_at: new Date().toISOString(),
      })

      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      const cf = new CF(accountId, apiToken)
      await createZones(cf, cfg!, org_id)
      return json({ ok: true })
    }

    // ── set_default_zone (superadmin or admin) ───────────────────────────
    // Sets one zone as client_default (filters unregistered source IPs)
    if (action === 'set_default_zone') {
      await getCallerRole(authHeader, org_id)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      if (!cfg.account_id || !cfg.api_token) throw new Error('Credenciales no configuradas')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const zoneKey = body.zone as string // 'students' | 'teachers' | 'admin' | null
      const zoneMap: Record<string, string> = {
        students: 'zone_students', teachers: 'zone_teachers', admin: 'zone_admin',
      }
      // Set client_default=false on all zones, then true on the selected one
      for (const key of ['students', 'teachers', 'admin']) {
        const locId = cfg[`zone_${key}_id`] as string | null
        if (!locId) continue
        const isDefault = key === zoneKey
        try {
          const loc = await cf.getLocation(locId)
          await cf.updateLocation(locId, {
            name: loc.name,
            client_default: isDefault,
            ecs_support: loc.ecs_support ?? false,
            networks: loc.networks ?? [],
          })
        } catch (_) { /* ignore */ }
      }
      await supabase.from('cloudflare_configs')
        .update({ default_zone: zoneKey || null, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)
      return json({ ok: true })
    }

    // ── register_networks (superadmin or admin) ──────────────────────────
    // Registers IP/CIDR ranges in a Gateway location — required for standard DNS filtering.
    // Without a registered source IP, Cloudflare cannot attribute the query to this account.
    if (action === 'register_networks') {
      await getCallerRole(authHeader, org_id)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      if (!cfg.account_id || !cfg.api_token) throw new Error('Credenciales no configuradas')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const zoneKey = body.zone as string
      const networks = (body.networks as string[]) || []
      const locId = cfg[`zone_${zoneKey}_id`] as string | null
      if (!locId) throw new Error('Zona no encontrada en Cloudflare')

      const loc = await cf.getLocation(locId)
      const networkObjects = networks.map((n: string) => ({
        network: n.includes('/') ? n : `${n}/32`,
      }))

      await cf.updateLocation(locId, {
        name: loc.name,
        client_default: loc.client_default ?? false,
        ecs_support: loc.ecs_support ?? false,
        networks: networkObjects,
      })

      await supabase.from('cloudflare_configs')
        .update({ [`zone_${zoneKey}_networks`]: networks, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)

      return json({ ok: true })
    }

    // ── debug_location (superadmin only — temporary) ─────────────────────
    if (action === 'debug_location') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token, zone_students_id').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const loc = await cf.getLocation(cfg.zone_students_id)
      return json({ ok: true, loc })
    }

    // ── refresh_ips (superadmin only) — fetch IPs for existing locations ──
    if (action === 'refresh_ips') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
      for (const key of ['students', 'teachers', 'admin']) {
        const locId = cfg[`zone_${key}_id`] as string | null
        if (locId) {
          const loc = await cf.getLocation(locId)
          patch[`zone_${key}_ip`] = [loc.ipv4_destination, loc.ipv4_destination_backup].filter(Boolean)
        }
      }
      await supabase.from('cloudflare_configs').update(patch).eq('org_id', org_id)
      return json({ ok: true })
    }

    // ── delete_zones (superadmin only) ────────────────────────────────────
    if (action === 'delete_zones') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      await cleanupOld(cf, cfg)
      await supabase.from('cloudflare_configs').update({
        zone_students_id: null, zone_teachers_id: null, zone_admin_id: null,
        zone_students_doh: null, zone_teachers_doh: null, zone_admin_doh: null,
        zone_students_ip: [], zone_teachers_ip: [], zone_admin_ip: [],
        zone_students_list_id: null, zone_teachers_list_id: null, zone_admin_list_id: null,
        zone_students_allow_list_id: null, zone_teachers_allow_list_id: null, zone_admin_allow_list_id: null,
        zone_students_rules: [], zone_teachers_rules: [], zone_admin_rules: [],
        zone_students_allow_rule_id: null, zone_teachers_allow_rule_id: null, zone_admin_allow_rule_id: null,
        zones_created: false, zones_created_at: null, updated_at: new Date().toISOString(),
      }).eq('org_id', org_id)
      return json({ ok: true })
    }

    // ── get_stats: Gateway DNS analytics via GraphQL ─────────────────────
    if (action === 'get_stats') {
      await getCallerRole(authHeader, org_id)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      if (!cfg?.account_id || !cfg?.api_token) throw new Error('Credenciales no configuradas')

      const days = Math.min(Number(body.days) || 7, 30)
      const now  = new Date()
      const from = new Date(now.getTime() - days * 86400_000)
      const fmt  = (d: Date) => d.toISOString().replace(/\.\d+Z$/, 'Z')

      const gql = `{
        viewer {
          accounts(filter: {accountTag: "${cfg.account_id}"}) {
            top: gatewayResolverQueriesAdaptiveGroups(
              limit: 100
              filter: { datetime_geq: "${fmt(from)}", datetime_leq: "${fmt(now)}" }
              orderBy: [count_DESC]
            ) {
              count
              dimensions { queryName locationName resolverDecision policyName }
            }
            daily: gatewayResolverQueriesAdaptiveGroups(
              limit: 200
              filter: { datetime_geq: "${fmt(from)}", datetime_leq: "${fmt(now)}" }
              orderBy: [datetimeHour_ASC]
            ) {
              count
              dimensions { datetimeHour resolverDecision }
            }
          }
        }
      }`

      const res = await fetch('https://api.cloudflare.com/client/v4/graphql', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${cfg.api_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: gql }),
      })
      const gqlData = await res.json() as any
      if (gqlData.errors) throw new Error(gqlData.errors[0]?.message || 'GraphQL error')

      const acct = gqlData.data.viewer.accounts[0]
      let top:   any[] = acct.top   ?? []
      const daily: any[] = acct.daily ?? []

      // Filter by zone location if requested
      const locationFilter = (body.location_name as string | undefined)?.trim()
      if (locationFilter) {
        top = top.filter(g => (g.dimensions.locationName || '').includes(locationFilter))
      }

      // resolverDecision: 5 = blocked, 9 = allowed (other values = allowed variants)
      const BLOCKED = new Set([5])

      const blocked = top.filter(g => BLOCKED.has(g.dimensions.resolverDecision))
      const allowed = top.filter(g => !BLOCKED.has(g.dimensions.resolverDecision))

      const totalBlocked = blocked.reduce((s, g) => s + g.count, 0)
      const totalAllowed = allowed.reduce((s, g) => s + g.count, 0)

      // Top blocked domains (deduplicated by name)
      const blockedByName: Record<string, number> = {}
      for (const g of blocked) {
        const n = g.dimensions.queryName
        blockedByName[n] = (blockedByName[n] || 0) + g.count
      }
      const topBlocked = Object.entries(blockedByName)
        .sort((a, b) => b[1] - a[1]).slice(0, 20)
        .map(([name, count]) => ({ name, count }))

      // Top allowed domains (deduplicated by name)
      const allowedByName: Record<string, number> = {}
      for (const g of allowed) {
        const n = g.dimensions.queryName
        allowedByName[n] = (allowedByName[n] || 0) + g.count
      }
      const topAllowed = Object.entries(allowedByName)
        .sort((a, b) => b[1] - a[1]).slice(0, 20)
        .map(([name, count]) => ({ name, count }))

      // By location
      const byLocation: Record<string, { allowed: number; blocked: number }> = {}
      for (const g of top) {
        const loc = g.dimensions.locationName || 'Desconocida'
        if (!byLocation[loc]) byLocation[loc] = { allowed: 0, blocked: 0 }
        if (BLOCKED.has(g.dimensions.resolverDecision)) byLocation[loc].blocked += g.count
        else byLocation[loc].allowed += g.count
      }

      // Daily chart data (group by hour, sum blocked vs allowed)
      const hourly: Record<string, { allowed: number; blocked: number }> = {}
      for (const g of daily) {
        const h = (g.dimensions.datetimeHour || '').slice(0, 13) // "2026-04-29T10"
        if (!h) continue
        if (!hourly[h]) hourly[h] = { allowed: 0, blocked: 0 }
        if (BLOCKED.has(g.dimensions.resolverDecision)) hourly[h].blocked += g.count
        else hourly[h].allowed += g.count
      }
      const chart = Object.entries(hourly).sort((a, b) => a[0].localeCompare(b[0]))
        .map(([hour, v]) => ({ hour, ...v }))

      return json({
        ok: true,
        days,
        total_allowed: totalAllowed,
        total_blocked: totalBlocked,
        top_blocked: topBlocked,
        top_allowed: topAllowed,
        by_location: byLocation,
        chart,
      })
    }

    return json({ ok: false, error: 'Acción desconocida' }, 400)

  } catch (e) {
    return json({ ok: false, error: (e as Error).message })
  }
})
