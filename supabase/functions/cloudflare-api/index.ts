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

  private headers() {
    return { 'Authorization': `Bearer ${this.token}`, 'Content-Type': 'application/json' }
  }

  private async req(method: string, path: string, body?: unknown) {
    const res = await fetch(`${this.base}${path}`, {
      method,
      headers: this.headers(),
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
  listLocations() { return this.req('GET', `/accounts/${this.accountId}/gateway/locations`) }

  createLocation(name: string) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/locations`, {
      name, client_default: false, ecs_support: false, networks: [],
    })
  }
  deleteLocation(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/locations/${id}`)
  }

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

function buildBlockRule(
  name: string, locationId: string,
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
    traffic: `dns.location.id == "${locationId}" and (${conds.join(' or ')})`,
    rule_settings: { block_page_enabled: false },
  }
}

function buildAllowRule(name: string, locationId: string, allowListId: string, precedence: number) {
  return {
    name: `${name} — permitidos`, description: `PenwinSafe whitelist — ${name}`,
    enabled: true, precedence, action: 'allow', filters: ['dns'],
    traffic: `dns.location.id == "${locationId}" and any(dns.domains[*] in $${allowListId})`,
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

async function getCallerRole(authHeader: string | null, orgId: string) {
  if (!authHeader) throw new Error('No autorizado')
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('No autorizado')
  const { data: admin } = await supabase
    .from('admin_users').select('role, org_id').eq('user_id', user.id).single()
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
    .from('admin_users').select('role').eq('user_id', user.id).single()
  if (admin?.role !== 'superadmin') throw new Error('Solo superadmin')
}

// ── Cleanup helper ────────────────────────────────────────────────────────

async function cleanupOld(cf: CF, cfg: Record<string, unknown>) {
  for (const key of ['zone_students_id', 'zone_teachers_id', 'zone_admin_id']) {
    const id = cfg[key] as string | null
    if (id) try { await cf.deleteLocation(id) } catch (_) { /* ignore */ }
  }
  const ruleKeys = [
    'zone_students_rules', 'zone_teachers_rules', 'zone_admin_rules',
    'zone_students_allow_rule_id', 'zone_teachers_allow_rule_id', 'zone_admin_allow_rule_id',
  ]
  for (const key of ruleKeys) {
    const val = cfg[key]
    const ids = Array.isArray(val) ? val : (val ? [val] : [])
    for (const id of ids) try { await cf.deleteRule(id as string) } catch (_) { /* ignore */ }
  }
  const listKeys = [
    'zone_students_list_id', 'zone_teachers_list_id', 'zone_admin_list_id',
    'zone_students_allow_list_id', 'zone_teachers_allow_list_id', 'zone_admin_allow_list_id',
  ]
  for (const key of listKeys) {
    const id = cfg[key] as string | null
    if (id) try { await cf.deleteList(id) } catch (_) { /* ignore */ }
  }
}

// ── Apply zones from stored config ────────────────────────────────────────

async function applyZones(cf: CF, cfg: Record<string, unknown>, orgId: string) {
  await cleanupOld(cf, cfg)

  const categories: { id: number; class: string }[] = (cfg.available_categories as unknown[]) || []
  const toSec  = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && c.class === 'security'))
  const toCont = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && c.class !== 'security'))

  const zones = [
    { key: 'students', name: cfg.zone_students_name as string || 'Alumnos',    prec: 10 },
    { key: 'teachers', name: cfg.zone_teachers_name as string || 'Profesores', prec: 11 },
    { key: 'admin',    name: cfg.zone_admin_name    as string || 'Administración', prec: 12 },
  ]

  const results: Record<string, { id: string; doh: string }> = {}
  const dbUpdate: Record<string, unknown> = {
    zones_created: true, zones_created_at: new Date().toISOString(),
    last_check_ok: true, last_check_at: new Date().toISOString(),
    last_check_msg: 'Zonas aplicadas correctamente', updated_at: new Date().toISOString(),
  }

  for (const z of zones) {
    const selCats: number[] = (cfg[`categories_${z.key}`] as number[]) || []
    const blocked: string[] = (cfg[`custom_blocked_${z.key}`] as string[]) || []
    const allowed: string[] = (cfg[`whitelist_${z.key}`] as string[]) || []

    // Create Gateway location
    const loc = await cf.createLocation(`PenwinSafe — ${z.name}`)
    results[z.key] = { id: loc.id, doh: loc.doh_subdomain }
    dbUpdate[`zone_${z.key}_id`]  = loc.id
    dbUpdate[`zone_${z.key}_doh`] = loc.doh_subdomain

    // Block list
    let blockListId: string | null = null
    if (blocked.length > 0) {
      const list = await cf.createList(`PenwinSafe Block ${z.name}`, blocked)
      blockListId = list.id
      dbUpdate[`zone_${z.key}_list_id`] = list.id
    }

    // Allow list (whitelist)
    if (allowed.length > 0) {
      const allowList = await cf.createList(`PenwinSafe Allow ${z.name}`, allowed)
      dbUpdate[`zone_${z.key}_allow_list_id`] = allowList.id
      const allowRule = await cf.createRule(buildAllowRule(z.name, loc.id, allowList.id, z.prec - 5))
      dbUpdate[`zone_${z.key}_allow_rule_id`] = allowRule.id
    }

    // Block rule
    const blockRuleBody = buildBlockRule(
      `PenwinSafe ${z.name}`, loc.id,
      toSec(selCats), toCont(selCats), blockListId, z.prec,
    )
    if (blockRuleBody) {
      const blockRule = await cf.createRule(blockRuleBody)
      dbUpdate[`zone_${z.key}_rules`] = [blockRule.id]
    }
  }

  await supabase.from('cloudflare_configs').update(dbUpdate).eq('org_id', orgId)
  return results
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
      return json({ ok: true, account_name: account.name, account_type: account.type })
    }

    // ── get_categories (superadmin only) ──────────────────────────────────
    if (action === 'get_categories') {
      await requireSuperAdmin(authHeader)
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')
      const cf = new CF(cfg.account_id, cfg.api_token)
      const categories = await cf.getCategories()
      const result = (categories as { id: number; name: string; class: string; beta?: boolean }[])
        .filter(c => !c.beta)
        .map(c => ({ id: c.id, name: c.name, class: c.class }))
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
      const results = await applyZones(cf, cfg, org_id)
      return json({ ok: true, ...results })
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
      const results = await applyZones(cf, cfg!, org_id)
      return json({ ok: true, ...results })
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
        zone_students_list_id: null, zone_teachers_list_id: null, zone_admin_list_id: null,
        zone_students_allow_list_id: null, zone_teachers_allow_list_id: null, zone_admin_allow_list_id: null,
        zone_students_rules: [], zone_teachers_rules: [], zone_admin_rules: [],
        zone_students_allow_rule_id: null, zone_teachers_allow_rule_id: null, zone_admin_allow_rule_id: null,
        zones_created: false, zones_created_at: null, updated_at: new Date().toISOString(),
      }).eq('org_id', org_id)
      return json({ ok: true })
    }

    return json({ ok: false, error: 'Acción desconocida' }, 400)

  } catch (e) {
    return json({ ok: false, error: (e as Error).message })
  }
})
