import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.27.0'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

const anthropic = new Anthropic({
  apiKey: Deno.env.get('ANTHROPIC_API_KEY')!
})

const CATEGORIES = [
  'educativo', 'noticias', 'entretenimiento', 'juegos',
  'redes_sociales', 'compras', 'tecnologia', 'inapropiado',
  'violencia', 'preocupante'
]

const CONCERNING_KEYWORDS = [
  'suicid', 'autolesion', 'bulling', 'bullying', 'acoso',
  'droga', 'alcohol', 'arma', 'explosivo', 'odio'
]

interface SearchEvent {
  id: string
  device_id: string
  query: string
  engine: string
}

async function classifyBatch(events: SearchEvent[]) {
  if (events.length === 0) return

  const queries = events.map((e, i) => `${i + 1}. "${e.query}"`).join('\n')

  // Claude Haiku para clasificación rápida y barata
  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    system: `Eres un sistema de clasificación de búsquedas de niños en edad escolar.
Para cada búsqueda devuelve exactamente: NÚMERO|CATEGORÍA|RIESGO
Categorías válidas: ${CATEGORIES.join(', ')}
Niveles de riesgo: safe, low, medium, high, critical
Solo devuelve las líneas, sin explicaciones.`,
    messages: [{
      role: 'user',
      content: `Clasifica estas búsquedas:\n${queries}`
    }]
  })

  const lines = (message.content[0] as { text: string }).text.trim().split('\n')

  const updates = []
  const alertsToCreate = []

  for (const line of lines) {
    const parts = line.split('|')
    if (parts.length !== 3) continue

    const idx = parseInt(parts[0]) - 1
    const category = parts[1].trim().toLowerCase()
    const risk = parts[2].trim().toLowerCase()

    if (idx < 0 || idx >= events.length) continue

    const event = events[idx]
    updates.push({
      id: event.id,
      ai_category: category,
      ai_risk_level: risk
    })

    // Si riesgo alto o crítico → generar alerta detallada con Sonnet
    if (risk === 'high' || risk === 'critical') {
      alertsToCreate.push({ event, category, risk })
    }
  }

  // Actualizar eventos en lote
  for (const update of updates) {
    await supabase
      .from('search_events')
      .update({ ai_category: update.ai_category, ai_risk_level: update.ai_risk_level })
      .eq('id', update.id)
  }

  // Generar alertas con Sonnet para casos graves
  for (const { event, category, risk } of alertsToCreate) {
    await generateAlert(event, category, risk)
  }
}

async function generateAlert(event: SearchEvent, category: string, risk: string) {
  // Claude Sonnet para análisis contextual detallado
  const analysis = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    system: `Eres un sistema de protección infantil en un entorno escolar.
Analiza búsquedas preocupantes y genera alertas breves para los responsables del centro.
Sé objetivo, profesional y evita el alarmismo injustificado.
Responde en español.`,
    messages: [{
      role: 'user',
      content: `Un alumno ha buscado: "${event.query}"
Categoría detectada: ${category}
Nivel de riesgo: ${risk}

Genera un mensaje de alerta breve (máx 2 frases) para el tutor, indicando qué se buscó y por qué es relevante supervisarlo.`
    }]
  })

  const summary = (analysis.content[0] as { text: string }).text.trim()

  await supabase.from('alerts').insert({
    device_id: event.device_id,
    type: 'concerning_search',
    severity: risk === 'critical' ? 'critical' : 'danger',
    message: `Búsqueda preocupante detectada: "${event.query}"`,
    ai_summary: summary
  })
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Obtener búsquedas sin clasificar (lotes de 20)
    const { data: events, error } = await supabase
      .from('search_events')
      .select('id, device_id, query, engine')
      .is('ai_category', null)
      .order('searched_at', { ascending: true })
      .limit(20)

    if (error) throw error
    if (!events || events.length === 0) {
      return new Response(JSON.stringify({ classified: 0 }), {
        headers: { 'Content-Type': 'application/json' }
      })
    }

    await classifyBatch(events)

    return new Response(JSON.stringify({ classified: events.length }), {
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (err) {
    console.error(err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
