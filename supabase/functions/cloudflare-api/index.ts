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

  async verifyToken()    { return this.req('GET', '/user/tokens/verify') }
  async getAccount()     { return this.req('GET', `/accounts/${this.accountId}`) }
  async getCategories()  { return this.req('GET', `/accounts/${this.accountId}/gateway/categories`) }
  async listLocations()  { return this.req('GET', `/accounts/${this.accountId}/gateway/locations`) }
  async listLists()      { return this.req('GET', `/accounts/${this.accountId}/gateway/lists`) }
  async listRules()      { return this.req('GET', `/accounts/${this.accountId}/gateway/rules`) }

  async createLocation(name: string) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/locations`, {
      name, client_default: false, ecs_support: false, networks: [],
    })
  }

  async deleteLocation(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/locations/${id}`)
  }

  async createList(name: string, domains: string[]) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/lists`, {
      name,
      type: 'DOMAIN',
      description: `PenwinSafe custom blocked domains — ${name}`,
      items: domains.map(d => ({ value: d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0] })),
    })
  }

  async updateList(listId: string, domains: string[]) {
    return this.req('PUT', `/accounts/${this.accountId}/gateway/lists/${listId}`, {
      name: undefined,
      items: domains.map(d => ({ value: d.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0] })),
    })
  }

  async deleteList(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/lists/${id}`)
  }

  async createRule(rule: unknown) {
    return this.req('POST', `/accounts/${this.accountId}/gateway/rules`, rule)
  }

  async deleteRule(id: string) {
    return this.req('DELETE', `/accounts/${this.accountId}/gateway/rules/${id}`)
  }
}

// ── Build Gateway DNS rule ────────────────────────────────────────────────

function buildRule(
  name: string,
  locationId: string,
  secCatIds: number[],
  contCatIds: number[],
  listId: string | null,
  precedence: number,
) {
  const conditions: string[] = []

  if (secCatIds.length > 0) {
    conditions.push(`any(dns.security_category[*] in {${secCatIds.join(' ')}})`)
  }
  if (contCatIds.length > 0) {
    conditions.push(`any(dns.content_category[*] in {${contCatIds.join(' ')}})`)
  }
  if (listId) {
    conditions.push(`any(dns.domains[*] in $${listId})`)
  }

  if (conditions.length === 0) return null

  const traffic = `dns.location.id == "${locationId}" and (${conditions.join(' or ')})`

  return {
    name,
    description: `PenwinSafe — ${name}`,
    enabled: true,
    precedence,
    action: 'block',
    filters: ['dns'],
    traffic,
    rule_settings: { block_page_enabled: false },
  }
}

// ── Auth ──────────────────────────────────────────────────────────────────

async function requireSuperAdmin(authHeader: string | null) {
  if (!authHeader) throw new Error('No autorizado')
  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) throw new Error('No autorizado')
  const { data: admin } = await supabase
    .from('admin_users').select('role').eq('user_id', user.id).single()
  if (admin?.role !== 'superadmin') throw new Error('Solo superadmin')
}

// ── Helper: clean up old PenwinSafe resources ─────────────────────────────

async function cleanupOld(cf: CF, cfg: Record<string, unknown>) {
  // Delete old locations
  for (const key of ['zone_students_id', 'zone_teachers_id', 'zone_admin_id']) {
    const id = cfg[key] as string | null
    if (id) try { await cf.deleteLocation(id) } catch (_) { /* ignore */ }
  }
  // Delete old rules
  for (const key of ['zone_students_rules', 'zone_teachers_rules', 'zone_admin_rules']) {
    const rules = (cfg[key] || []) as string[]
    for (const rid of rules) try { await cf.deleteRule(rid) } catch (_) { /* ignore */ }
  }
  // Delete old lists
  for (const key of ['zone_students_list_id', 'zone_teachers_list_id', 'zone_admin_list_id']) {
    const id = cfg[key] as string | null
    if (id) try { await cf.deleteList(id) } catch (_) { /* ignore */ }
  }
}

// ── Main ──────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    await requireSuperAdmin(req.headers.get('Authorization'))

    const body = await req.json()
    const { action, org_id } = body

    // ── verify ────────────────────────────────────────────────────────────
    if (action === 'verify') {
      const cf = new CF(body.account_id, body.api_token)
      await cf.verifyToken()
      const account = await cf.getAccount()
      return json({ ok: true, account_name: account.name, account_type: account.type })
    }

    // ── get_categories ────────────────────────────────────────────────────
    if (action === 'get_categories') {
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('account_id, api_token').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')

      const cf = new CF(cfg.account_id, cfg.api_token)
      const categories = await cf.getCategories()

      // Normalize and group
      const result = (categories as { id: number; name: string; class: string; beta?: boolean }[])
        .filter(c => !c.beta)
        .map(c => ({ id: c.id, name: c.name, class: c.class }))

      // Cache in DB
      await supabase.from('cloudflare_configs')
        .update({ available_categories: result, updated_at: new Date().toISOString() })
        .eq('org_id', org_id)

      return json({ ok: true, categories: result })
    }

    // ── create_zones ──────────────────────────────────────────────────────
    if (action === 'create_zones') {
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')

      const cf = new CF(cfg.account_id, cfg.api_token)

      const names = body.zone_names || {
        students: cfg.zone_students_name || 'Alumnos',
        teachers: cfg.zone_teachers_name || 'Profesores',
        admin:    cfg.zone_admin_name    || 'Administración',
      }

      // Selected category IDs per zone (split by class)
      const categories: { id: number; class: string }[] = cfg.available_categories || []
      const toSec  = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && c.class === 'security'))
      const toCont = (ids: number[]) => ids.filter(id => categories.find(c => c.id === id && c.class !== 'security'))

      const selStudents: number[] = body.categories_students ?? cfg.categories_students ?? []
      const selTeachers: number[] = body.categories_teachers ?? cfg.categories_teachers ?? []
      const selAdmin:    number[] = body.categories_admin    ?? cfg.categories_admin    ?? []

      const customStudents: string[] = body.custom_blocked_students ?? cfg.custom_blocked_students ?? []
      const customTeachers: string[] = body.custom_blocked_teachers ?? cfg.custom_blocked_teachers ?? []
      const customAdmin:    string[] = body.custom_blocked_admin    ?? cfg.custom_blocked_admin    ?? []

      // Clean up previous zones
      await cleanupOld(cf, cfg)

      // Create custom domain lists (if any)
      let listStudents: { id: string } | null = null
      let listTeachers: { id: string } | null = null
      let listAdmin:    { id: string } | null = null

      if (customStudents.length > 0) {
        listStudents = await cf.createList(`PenwinSafe ${names.students}`, customStudents)
      }
      if (customTeachers.length > 0) {
        listTeachers = await cf.createList(`PenwinSafe ${names.teachers}`, customTeachers)
      }
      if (customAdmin.length > 0) {
        listAdmin = await cf.createList(`PenwinSafe ${names.admin}`, customAdmin)
      }

      // Create Gateway locations
      const locStudents = await cf.createLocation(`PenwinSafe — ${names.students}`)
      const locTeachers = await cf.createLocation(`PenwinSafe — ${names.teachers}`)
      const locAdmin    = await cf.createLocation(`PenwinSafe — ${names.admin}`)

      // Build and create rules (skip if nothing to block)
      const ruleStudentsBody = buildRule(
        `PenwinSafe ${names.students}`, locStudents.id,
        toSec(selStudents), toCont(selStudents), listStudents?.id ?? null, 10
      )
      const ruleTeachersBody = buildRule(
        `PenwinSafe ${names.teachers}`, locTeachers.id,
        toSec(selTeachers), toCont(selTeachers), listTeachers?.id ?? null, 11
      )
      const ruleAdminBody = buildRule(
        `PenwinSafe ${names.admin}`, locAdmin.id,
        toSec(selAdmin), toCont(selAdmin), listAdmin?.id ?? null, 12
      )

      const ruleStudents = ruleStudentsBody ? await cf.createRule(ruleStudentsBody) : null
      const ruleTeachers = ruleTeachersBody ? await cf.createRule(ruleTeachersBody) : null
      const ruleAdmin    = ruleAdminBody    ? await cf.createRule(ruleAdminBody)    : null

      // Persist
      await supabase.from('cloudflare_configs').upsert({
        org_id,
        zone_students_name: names.students,
        zone_teachers_name: names.teachers,
        zone_admin_name:    names.admin,
        zone_students_id:   locStudents.id,
        zone_teachers_id:   locTeachers.id,
        zone_admin_id:      locAdmin.id,
        zone_students_doh:  locStudents.doh_subdomain,
        zone_teachers_doh:  locTeachers.doh_subdomain,
        zone_admin_doh:     locAdmin.doh_subdomain,
        zone_students_list_id: listStudents?.id ?? null,
        zone_teachers_list_id: listTeachers?.id ?? null,
        zone_admin_list_id:    listAdmin?.id ?? null,
        zone_students_rules: ruleStudents ? [ruleStudents.id] : [],
        zone_teachers_rules: ruleTeachers ? [ruleTeachers.id] : [],
        zone_admin_rules:    ruleAdmin    ? [ruleAdmin.id]    : [],
        categories_students: selStudents,
        categories_teachers: selTeachers,
        categories_admin:    selAdmin,
        custom_blocked_students: customStudents,
        custom_blocked_teachers: customTeachers,
        custom_blocked_admin:    customAdmin,
        zones_created:     true,
        zones_created_at:  new Date().toISOString(),
        last_check_ok:     true,
        last_check_at:     new Date().toISOString(),
        last_check_msg:    'Zonas creadas correctamente',
        updated_at:        new Date().toISOString(),
      })

      return json({
        ok: true,
        students: { id: locStudents.id, doh: locStudents.doh_subdomain },
        teachers: { id: locTeachers.id, doh: locTeachers.doh_subdomain },
        admin:    { id: locAdmin.id,    doh: locAdmin.doh_subdomain },
      })
    }

    // ── delete_zones ──────────────────────────────────────────────────────
    if (action === 'delete_zones') {
      const { data: cfg } = await supabase
        .from('cloudflare_configs').select('*').eq('org_id', org_id).single()
      if (!cfg) throw new Error('Configuración no encontrada')

      const cf = new CF(cfg.account_id, cfg.api_token)
      await cleanupOld(cf, cfg)

      await supabase.from('cloudflare_configs').update({
        zone_students_id: null, zone_teachers_id: null, zone_admin_id: null,
        zone_students_doh: null, zone_teachers_doh: null, zone_admin_doh: null,
        zone_students_list_id: null, zone_teachers_list_id: null, zone_admin_list_id: null,
        zone_students_rules: [], zone_teachers_rules: [], zone_admin_rules: [],
        zones_created: false, zones_created_at: null,
        updated_at: new Date().toISOString(),
      }).eq('org_id', org_id)

      return json({ ok: true })
    }

    return json({ ok: false, error: 'Acción desconocida' }, 400)

  } catch (e) {
    return json({ ok: false, error: (e as Error).message })
  }
})
