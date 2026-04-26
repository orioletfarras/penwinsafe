import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
})

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  const weekEnd = new Date()
  weekEnd.setHours(23, 59, 59, 999)
  const weekStart = new Date(weekEnd)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const { data: devices } = await supabase.from('devices').select('id, name')
  if (!devices) return new Response('No devices', { status: 200 })

  let generated = 0

  for (const device of devices) {
    const [{ data: searches }, { data: urls }, { data: blocked }, { data: alerts }] =
      await Promise.all([
        supabase.from('search_events')
          .select('query, ai_category, ai_risk_level, searched_at')
          .eq('device_id', device.id)
          .gte('searched_at', weekStart.toISOString())
          .order('searched_at', { ascending: false })
          .limit(100),
        supabase.from('url_events')
          .select('domain, ai_category, duration_sec')
          .eq('device_id', device.id)
          .gte('visited_at', weekStart.toISOString())
          .limit(200),
        supabase.from('blocked_events')
          .select('domain, reason')
          .eq('device_id', device.id)
          .gte('blocked_at', weekStart.toISOString()),
        supabase.from('alerts')
          .select('severity, message, ai_summary')
          .eq('device_id', device.id)
          .gte('created_at', weekStart.toISOString())
      ])

    if (!searches?.length && !urls?.length) continue

    const topCategories: Record<string, number> = {}
    urls?.forEach(u => {
      if (u.ai_category) topCategories[u.ai_category] = (topCategories[u.ai_category] || 0) + 1
    })

    const riskSearches = searches?.filter(s =>
      s.ai_risk_level === 'high' || s.ai_risk_level === 'critical'
    ) || []

    const prompt = `Genera un informe semanal de navegación para el alumno "${device.name}".

PERÍODO: ${weekStart.toLocaleDateString('es-ES')} — ${weekEnd.toLocaleDateString('es-ES')}

BÚSQUEDAS REALIZADAS (${searches?.length || 0}):
${searches?.slice(0, 20).map(s => `- "${s.query}" [${s.ai_category || 'sin clasificar'}]`).join('\n') || 'Ninguna'}

DOMINIOS MÁS VISITADOS:
${Object.entries(topCategories).map(([cat, n]) => `- ${cat}: ${n} visitas`).join('\n') || 'Ninguno'}

INTENTOS BLOQUEADOS: ${blocked?.length || 0}
ALERTAS GENERADAS: ${alerts?.length || 0}
${riskSearches.length > 0 ? `\nBÚSQUEDAS DE RIESGO DETECTADAS: ${riskSearches.length}` : ''}

Escribe un informe breve en markdown (máx 300 palabras) para el tutor con:
1. Resumen general de la actividad
2. Aspectos positivos
3. Puntos de atención (si los hay)
4. Recomendaciones

Sé objetivo y profesional. Usa lenguaje accesible para docentes.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }]
    })

    const summaryMd = (response.content[0] as { text: string }).text

    const riskScore = Math.min(100, (riskSearches.length * 20) + (alerts?.length || 0) * 10)

    await supabase.from('weekly_reports').upsert({
      device_id: device.id,
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
      summary_md: summaryMd,
      top_categories: topCategories,
      risk_score: riskScore
    }, { onConflict: 'device_id,week_start' })

    generated++
  }

  return new Response(JSON.stringify({ generated }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
