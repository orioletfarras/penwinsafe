import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''

const CATEGORY_LABELS: Record<string, string> = {
  pornografia:      'Pornografía',
  contenido_adulto: 'Contenido adulto',
  violencia:        'Violencia',
  drogas:           'Drogas',
  apuestas:         'Apuestas',
  odio:             'Discurso de odio',
  dns_filter:       'Dominio bloqueado (DNS)',
  keyword_filter:   'Palabra clave bloqueada',
}

serve(async (req) => {
  const { device_id, url, domain, reason, category } = await req.json()

  // Get device with group + org info
  const { data: device } = await supabase
    .from('devices')
    .select('name, group_id, org_id, groups(name, tutor_name, tutor_email, notify_categories)')
    .eq('id', device_id)
    .single()

  if (!device?.groups?.tutor_email) {
    return new Response(JSON.stringify({ skipped: 'no tutor email' }), { status: 200 })
  }

  const group = device.groups as any
  const notifyCategories: string[] = group.notify_categories || []

  // Determine effective category
  const effectiveCategory = category || reason

  // Check if this category should trigger notification
  const shouldNotify =
    notifyCategories.includes(effectiveCategory) ||
    notifyCategories.includes(reason)

  if (!shouldNotify) {
    return new Response(JSON.stringify({ skipped: 'category not in notify list' }), { status: 200 })
  }

  if (!RESEND_API_KEY) {
    console.log('No RESEND_API_KEY — skipping email')
    return new Response(JSON.stringify({ skipped: 'no resend key' }), { status: 200 })
  }

  const categoryLabel = CATEGORY_LABELS[effectiveCategory] || effectiveCategory
  const now = new Date().toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'PenwinSafe <alertas@penwin.org>',
      to: group.tutor_email,
      subject: `⚠️ Acceso bloqueado en ${device.name} — ${categoryLabel}`,
      html: `
        <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:24px">
          <div style="background:#006fff;border-radius:8px;padding:20px 24px;margin-bottom:24px">
            <h1 style="color:white;margin:0;font-size:18px;font-weight:700">PenwinSafe</h1>
            <p style="color:rgba(255,255,255,0.8);margin:4px 0 0;font-size:13px">Sistema de seguridad escolar</p>
          </div>

          <h2 style="font-size:16px;color:#111827;margin:0 0 8px">Acceso bloqueado detectado</h2>
          <p style="font-size:13px;color:#6b7280;margin:0 0 20px">
            Hola ${group.tutor_name || 'Tutor'}, se ha bloqueado un intento de acceso en tu clase <strong>${group.name}</strong>.
          </p>

          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin-bottom:20px">
            <table style="width:100%;border-collapse:collapse;font-size:12px">
              <tr><td style="color:#6b7280;padding:4px 0;width:130px">Dispositivo</td><td style="color:#111827;font-weight:600">${device.name}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0">Clase</td><td style="color:#111827;font-weight:600">${group.name}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0">Categoría</td><td style="color:#dc2626;font-weight:600">${categoryLabel}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0">Dominio</td><td style="color:#111827;font-family:monospace">${domain}</td></tr>
              <tr><td style="color:#6b7280;padding:4px 0">Hora</td><td style="color:#111827">${now}</td></tr>
            </table>
          </div>

          <p style="font-size:12px;color:#9ca3af;margin:0">
            Este mensaje ha sido generado automáticamente por PenwinSafe.<br>
            Puedes gestionar las notificaciones desde el panel de administración.
          </p>
        </div>
      `,
    }),
  })

  return new Response(JSON.stringify({ sent: true, to: group.tutor_email }), { status: 200 })
})
