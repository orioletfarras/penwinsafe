import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const body = await req.json()
  const { device_id, browser_version, os_info, ip_address } = body

  if (!device_id) return new Response('Missing device_id', { status: 400 })

  const { error } = await supabase
    .from('devices')
    .update({
      status: 'online',
      last_seen: new Date().toISOString(),
      browser_version,
      os_info,
      ip_address
    })
    .eq('id', device_id)

  if (error) return new Response(JSON.stringify({ error }), { status: 500 })

  // Devolver config actualizada al navegador
  const { data: device } = await supabase
    .from('devices')
    .select(`
      id, name, status,
      device_configs (*),
      groups (
        filter_level, whitelist, blacklist,
        kiosk_mode, kiosk_urls, downloads_enabled, custom_homepage,
        schedules (*)
      )
    `)
    .eq('id', device_id)
    .single()

  return new Response(JSON.stringify({ config: device }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
