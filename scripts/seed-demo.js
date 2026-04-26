#!/usr/bin/env node
'use strict'

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = 'https://usmpicfqqiowdlridybh.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVzbXBpY2ZxcWlvd2RscmlkeWJoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzIyOTk2OSwiZXhwIjoyMDkyODA1OTY5fQ.tmsahqusmat_i3StqL-DvhtiafsT40_umGaeoo4RRxA'

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Datos del colegio de muestra ────────────────────────────────────────────

const ADMIN_EMAIL    = 'director@colegiosantjordi.es'
const ADMIN_PASSWORD = 'PenwinDemo2026!'

const ORG = {
  name: 'Colegio Sant Jordi',
  slug: 'sant-jordi'
}

const GROUPS = [
  { name: '1º Primaria A', filter_level: 'family', kiosk_mode: false },
  { name: '2º Primaria B', filter_level: 'family', kiosk_mode: false },
  { name: '5º Primaria',   filter_level: 'family', kiosk_mode: false },
  { name: '6º Primaria',   filter_level: 'adult',  kiosk_mode: false },
]

const DEVICES_PER_GROUP = [
  ['Aula 1 — PC 1', 'Aula 1 — PC 2', 'Aula 1 — PC 3'],
  ['Aula 2 — PC 1', 'Aula 2 — PC 2', 'Aula 2 — PC 3'],
  ['Aula 5 — PC 1', 'Aula 5 — PC 2'],
  ['Aula 6 — PC 1', 'Aula 6 — PC 2', 'Aula 6 — PC 3', 'Aula 6 — PC 4'],
]

const SAMPLE_SEARCHES = [
  { query: 'dinosaurios para niños',           engine: 'google',  risk: 'safe',     cat: 'educativo' },
  { query: 'tabla de multiplicar ejercicios',  engine: 'google',  risk: 'safe',     cat: 'educativo' },
  { query: 'minecraft como hacer una casa',    engine: 'youtube', risk: 'low',      cat: 'juegos' },
  { query: 'fortnite skins gratis 2026',       engine: 'google',  risk: 'low',      cat: 'juegos' },
  { query: 'sistema solar planetas',           engine: 'google',  risk: 'safe',     cat: 'educativo' },
  { query: 'videojuegos violentos online',     engine: 'google',  risk: 'medium',   cat: 'juegos' },
  { query: 'como hackear wifi escuela',        engine: 'google',  risk: 'high',     cat: 'tecnologia' },
  { query: 'recetas fáciles para niños',       engine: 'youtube', risk: 'safe',     cat: 'educativo' },
  { query: 'roblox jugar gratis',              engine: 'google',  risk: 'low',      cat: 'juegos' },
  { query: 'bullying como defenderse',         engine: 'google',  risk: 'medium',   cat: 'educativo' },
  { query: 'como hacer una bomba casera',      engine: 'google',  risk: 'critical', cat: 'preocupante' },
  { query: 'animales en peligro extinción',    engine: 'google',  risk: 'safe',     cat: 'educativo' },
  { query: 'tiktok sin cuenta ver videos',     engine: 'google',  risk: 'medium',   cat: 'redes_sociales' },
  { query: 'fracciones matemáticas ejercicios',engine: 'google',  risk: 'safe',     cat: 'educativo' },
  { query: 'como adelgazar rápido niños',      engine: 'google',  risk: 'high',     cat: 'preocupante' },
]

const SAMPLE_URLS = [
  { url: 'https://www.google.com',           domain: 'google.com',       cat: 'buscador' },
  { url: 'https://www.youtube.com/watch?v=dinosaurios', domain: 'youtube.com', cat: 'educativo' },
  { url: 'https://www.wikipedia.org/wiki/Sistema_solar', domain: 'wikipedia.org', cat: 'educativo' },
  { url: 'https://www.math-drills.com',      domain: 'math-drills.com',  cat: 'educativo' },
  { url: 'https://www.minecraft.net',        domain: 'minecraft.net',    cat: 'juegos' },
  { url: 'https://www.roblox.com',           domain: 'roblox.com',       cat: 'juegos' },
  { url: 'https://educacion.primaria.es',    domain: 'primaria.es',      cat: 'educativo' },
  { url: 'https://www.nationalgeographic.com', domain: 'nationalgeographic.com', cat: 'educativo' },
]

const SAMPLE_BLOCKED = [
  { url: 'https://www.pornhub.com',     domain: 'pornhub.com',    reason: 'dns_filter' },
  { url: 'https://www.tiktok.com',      domain: 'tiktok.com',     reason: 'blacklist' },
  { url: 'https://www.twitch.tv',       domain: 'twitch.tv',      reason: 'blacklist' },
  { url: 'https://www.bet365.com',      domain: 'bet365.com',     reason: 'dns_filter' },
  { url: 'https://proxy-free.net',      domain: 'proxy-free.net', reason: 'dns_filter' },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function hoursAgo(h) {
  return new Date(Date.now() - h * 3600 * 1000).toISOString()
}

function pick(arr) {
  return arr[randomInt(0, arr.length - 1)]
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function run() {
  console.log('\n🏫 Creando colegio de muestra: Colegio Sant Jordi\n')

  // 1. Crear usuario admin en Supabase Auth
  console.log('👤 Creando usuario admin...')
  const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true
  })
  if (authErr && !authErr.message.includes('already been registered')) {
    throw new Error(`Auth error: ${authErr.message}`)
  }

  // Si ya existe, buscamos su ID
  let userId = authData?.user?.id
  if (!userId) {
    const { data: { users } } = await supabase.auth.admin.listUsers()
    userId = users.find(u => u.email === ADMIN_EMAIL)?.id
  }
  console.log(`   ✓ Usuario: ${ADMIN_EMAIL} (id: ${userId})`)

  // 2. Organización
  console.log('🏫 Creando organización...')
  const { data: existingOrg } = await supabase.from('organizations').select('id').eq('slug', ORG.slug).single()
  let orgId = existingOrg?.id

  if (!orgId) {
    const { data: org, error } = await supabase.from('organizations').insert(ORG).select().single()
    if (error) throw error
    orgId = org.id
  }
  console.log(`   ✓ Organización: ${ORG.name} (id: ${orgId})`)

  // 3. Admin user
  console.log('🔑 Vinculando admin con la organización...')
  await supabase.from('admin_users').upsert({
    id: userId, org_id: orgId, name: 'Director Sant Jordi',
    email: ADMIN_EMAIL, role: 'admin'
  }, { onConflict: 'id' })
  console.log('   ✓ Admin vinculado')

  // 4. Grupos/aulas
  console.log('📚 Creando aulas...')
  const groupIds = []
  for (const g of GROUPS) {
    const { data: existing } = await supabase.from('groups').select('id').eq('org_id', orgId).eq('name', g.name).single()
    if (existing) { groupIds.push(existing.id); continue }
    const { data: group, error } = await supabase.from('groups').insert({ ...g, org_id: orgId }).select().single()
    if (error) throw error
    groupIds.push(group.id)
    console.log(`   ✓ ${g.name}`)
  }

  // 5. Dispositivos
  console.log('🖥️  Creando dispositivos...')
  const deviceIds = []
  for (let gi = 0; gi < GROUPS.length; gi++) {
    for (const devName of DEVICES_PER_GROUP[gi]) {
      const { data: existing } = await supabase.from('devices').select('id').eq('org_id', orgId).eq('name', devName).single()
      if (existing) { deviceIds.push(existing.id); continue }

      const isOnline = Math.random() > 0.3
      const { data: device, error } = await supabase.from('devices').insert({
        org_id:          orgId,
        group_id:        groupIds[gi],
        name:            devName,
        status:          isOnline ? 'online' : 'offline',
        last_seen:       hoursAgo(randomInt(0, 3)),
        browser_version: '1.0.0',
        ip_address:      `192.168.1.${randomInt(10, 99)}`,
        os_info:         pick(['Windows 11', 'Windows 10', 'macOS 14'])
      }).select().single()
      if (error) throw error
      deviceIds.push(device.id)
      console.log(`   ✓ ${devName} (${isOnline ? 'online' : 'offline'})`)
    }
  }

  // 6. Búsquedas de muestra
  console.log('🔍 Insertando búsquedas de muestra...')
  const searchEvents = []
  for (let i = 0; i < 60; i++) {
    const s = pick(SAMPLE_SEARCHES)
    searchEvents.push({
      device_id:    pick(deviceIds),
      query:        s.query,
      engine:       s.engine,
      searched_at:  hoursAgo(randomInt(0, 48)),
      ai_category:  s.cat,
      ai_risk_level: s.risk
    })
  }
  await supabase.from('search_events').insert(searchEvents)
  console.log(`   ✓ ${searchEvents.length} búsquedas insertadas`)

  // 7. URLs visitadas
  console.log('🌐 Insertando historial de URLs...')
  const urlEvents = []
  for (let i = 0; i < 80; i++) {
    const u = pick(SAMPLE_URLS)
    urlEvents.push({
      device_id:    pick(deviceIds),
      url:          u.url,
      domain:       u.domain,
      title:        u.domain,
      visited_at:   hoursAgo(randomInt(0, 48)),
      duration_sec: randomInt(10, 600),
      ai_category:  u.cat,
      ai_risk_level: 'safe'
    })
  }
  await supabase.from('url_events').insert(urlEvents)
  console.log(`   ✓ ${urlEvents.length} URLs insertadas`)

  // 8. Intentos bloqueados
  console.log('🚫 Insertando intentos bloqueados...')
  const blockedEvents = []
  for (let i = 0; i < 20; i++) {
    const b = pick(SAMPLE_BLOCKED)
    blockedEvents.push({
      device_id:   pick(deviceIds),
      url:         b.url,
      domain:      b.domain,
      reason:      b.reason,
      blocked_at:  hoursAgo(randomInt(0, 48)),
      ai_category: 'inapropiado'
    })
  }
  await supabase.from('blocked_events').insert(blockedEvents)
  console.log(`   ✓ ${blockedEvents.length} bloqueos insertados`)

  // 9. Alertas
  console.log('🚨 Creando alertas...')
  const alerts = [
    {
      device_id:  pick(deviceIds),
      type:       'concerning_search',
      severity:   'critical',
      message:    'Búsqueda preocupante detectada: "como hacer una bomba casera"',
      ai_summary: 'Un alumno buscó instrucciones para fabricar explosivos caseros. Se recomienda hablar con el alumno y notificar a los padres.',
      resolved:   false
    },
    {
      device_id:  pick(deviceIds),
      type:       'concerning_search',
      severity:   'danger',
      message:    'Búsqueda preocupante detectada: "como adelgazar rápido niños"',
      ai_summary: 'Búsqueda relacionada con posibles hábitos alimentarios preocupantes. Podría indicar presión social o inicio de trastorno alimentario.',
      resolved:   false
    },
    {
      device_id:  pick(deviceIds),
      type:       'concerning_search',
      severity:   'warning',
      message:    'Búsqueda detectada: "bullying como defenderse"',
      ai_summary: 'El alumno buscó información sobre cómo hacer frente al acoso escolar. Puede ser un indicio de que está sufriendo bullying.',
      resolved:   false
    },
    {
      device_id:  pick(deviceIds),
      type:       'excessive_blocked',
      severity:   'info',
      message:    '5 intentos de acceso bloqueado en menos de 10 minutos',
      ai_summary: 'El dispositivo ha intentado acceder repetidamente a sitios bloqueados por el filtro DNS.',
      resolved:   true
    },
  ]

  for (const alert of alerts) {
    await supabase.from('alerts').insert(alert)
  }
  console.log(`   ✓ ${alerts.length} alertas creadas`)

  // 10. Horarios
  console.log('⏱️  Creando horarios...')
  for (const groupId of groupIds) {
    await supabase.from('schedules').insert({
      group_id:   groupId,
      name:       'Horario escolar',
      days:       [1, 2, 3, 4, 5],
      start_time: '08:30',
      end_time:   '14:30',
      active:     true
    })
  }
  console.log('   ✓ Horarios creados (L-V 08:30-14:30)')

  console.log('\n✅ Colegio de muestra creado correctamente!\n')
  console.log('─────────────────────────────────────────')
  console.log(`🌐 Panel:      https://panel-sigma-six.vercel.app`)
  console.log(`📧 Email:      ${ADMIN_EMAIL}`)
  console.log(`🔑 Contraseña: ${ADMIN_PASSWORD}`)
  console.log('─────────────────────────────────────────\n')
}

run().catch(err => {
  console.error('\n❌ Error:', err.message)
  process.exit(1)
})
