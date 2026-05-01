import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  const authHeader = req.headers.get('authorization')
  if (!authHeader) return json({ error: 'Unauthorized' }, 401)

  const { data: { user }, error: authErr } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user) return json({ error: 'Unauthorized' }, 401)

  const { data: caller } = await supabase
    .from('admin_users')
    .select('role, org_id')
    .eq('id', user.id)
    .single()

  if (!caller || !['superadmin', 'admin'].includes(caller.role))
    return json({ error: 'Forbidden' }, 403)

  const { action, org_id, ...params } = await req.json()

  // Superadmin can manage any org; admin only their own
  const targetOrg = (caller.role === 'superadmin' && org_id) ? org_id : caller.org_id

  // ── LIST ─────────────────────────────────────────────────────────────────
  if (action === 'list') {
    const { data: members } = await supabase
      .from('admin_users')
      .select('id, role')
      .eq('org_id', targetOrg)

    if (!members?.length) return json({ ok: true, users: [] })

    const ids = members.map((m: any) => m.id)
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers()
    const emailMap = Object.fromEntries(
      (authUsers ?? []).filter((u: any) => ids.includes(u.id)).map((u: any) => [u.id, u.email])
    )

    return json({
      ok: true,
      users: members.map((m: any) => ({
        id: m.id,
        role: m.role,
        email: emailMap[m.id] ?? '—',
      })),
    })
  }

  // ── INVITE ───────────────────────────────────────────────────────────────
  if (action === 'invite') {
    const { email, role } = params
    if (!email || !['admin', 'viewer'].includes(role))
      return json({ error: 'Email y rol requeridos (admin o viewer)' }, 400)

    // Check if auth user already exists
    const { data: { users: existing } } = await supabase.auth.admin.listUsers()
    let authUser = existing?.find((u: any) => u.email === email)

    if (!authUser) {
      const { data, error } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        password: Math.random().toString(36).slice(-12) + 'Aa1!',
      })
      if (error) return json({ error: error.message })
      authUser = data.user
    }

    // Check if already in this org
    const { data: existing_member } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', authUser!.id)
      .eq('org_id', targetOrg)
      .single()

    if (existing_member) return json({ error: 'Este usuario ya pertenece a esta organización' })

    const name = (params.name as string)?.trim() || email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
    const { error: insertErr } = await supabase
      .from('admin_users')
      .insert({ id: authUser!.id, org_id: targetOrg, role, email, name })

    if (insertErr) return json({ error: insertErr.message })

    // Send password reset so the user can set their own password
    await supabase.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo: `${Deno.env.get('SITE_URL') ?? 'https://safe.penwin.cloud'}/login` },
    })

    return json({ ok: true, email })
  }

  // ── UPDATE ROLE ──────────────────────────────────────────────────────────
  if (action === 'update_role') {
    const { user_id, role } = params
    if (!user_id || !['admin', 'viewer'].includes(role))
      return json({ error: 'Parámetros inválidos' }, 400)

    // Can't demote yourself
    if (user_id === user.id) return json({ error: 'No puedes cambiar tu propio rol' })

    const { error } = await supabase
      .from('admin_users')
      .update({ role })
      .eq('id', user_id)
      .eq('org_id', targetOrg)

    if (error) return json({ error: error.message })
    return json({ ok: true })
  }

  // ── REMOVE ───────────────────────────────────────────────────────────────
  if (action === 'remove') {
    const { user_id } = params
    if (!user_id) return json({ error: 'user_id requerido' }, 400)
    if (user_id === user.id) return json({ error: 'No puedes eliminarte a ti mismo' })

    const { error } = await supabase
      .from('admin_users')
      .delete()
      .eq('id', user_id)
      .eq('org_id', targetOrg)

    if (error) return json({ error: error.message })
    return json({ ok: true })
  }

  return json({ error: 'Unknown action' }, 400)
})
