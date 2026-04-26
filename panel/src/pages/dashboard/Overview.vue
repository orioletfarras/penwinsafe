<template>
  <div class="space-y-6">

    <!-- Stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="s in stats" :key="s.label"
        class="rounded-xl border border-white/6 p-5 relative overflow-hidden"
        style="background:#0d1117">
        <div class="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-30 pointer-events-none" :style="`background:${s.glow}`"></div>
        <div class="flex items-start justify-between mb-3">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center" :style="`background:${s.glow}20`">
            <component :is="s.icon" class="w-4 h-4" :style="`color:${s.glow}`" />
          </div>
          <span v-if="s.trend" class="text-[11px] font-medium px-1.5 py-0.5 rounded-md" :class="s.trend > 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'">
            {{ s.trend > 0 ? '+' : '' }}{{ s.trend }}%
          </span>
        </div>
        <p class="text-2xl font-black text-white tracking-tight">{{ s.value }}</p>
        <p class="text-xs text-gray-600 mt-0.5">{{ s.label }}</p>
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid xl:grid-cols-3 gap-4">

      <!-- Actividad reciente (2/3) -->
      <div class="xl:col-span-2 rounded-xl border border-white/6 overflow-hidden" style="background:#0d1117">
        <div class="px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div>
            <h2 class="text-sm font-semibold text-white">Búsquedas recientes</h2>
            <p class="text-xs text-gray-600 mt-0.5">Clasificadas automáticamente por IA</p>
          </div>
          <router-link to="/dashboard/devices" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">Ver todo →</router-link>
        </div>
        <div class="divide-y divide-white/4">
          <div v-for="s in recentSearches" :key="s.id" class="px-5 py-3 flex items-center gap-4 hover:bg-white/2 transition-colors">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :style="`background:${engineColor(s.engine)}15`">
              <span class="text-xs font-bold" :style="`color:${engineColor(s.engine)}`">{{ s.engine[0].toUpperCase() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm text-white truncate font-medium">{{ s.query }}</p>
              <p class="text-xs text-gray-600 mt-0.5">{{ s.devices?.name }} · {{ timeAgo(s.searched_at) }}</p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <!-- IA badge -->
              <div class="flex items-center gap-1 text-[10px] text-purple-400 bg-purple-400/10 border border-purple-400/15 px-2 py-0.5 rounded-full">
                <SparklesIcon class="w-2.5 h-2.5" />
                {{ s.ai_category || '—' }}
              </div>
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="riskDot(s.ai_risk_level)"></span>
            </div>
          </div>
          <div v-if="recentSearches.length === 0" class="px-5 py-10 text-center text-xs text-gray-600">
            Sin actividad reciente
          </div>
        </div>
      </div>

      <!-- Columna derecha -->
      <div class="space-y-4">

        <!-- Alertas IA -->
        <div class="rounded-xl border border-white/6 overflow-hidden" style="background:#0d1117">
          <div class="px-5 py-4 border-b border-white/6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <SparklesIcon class="w-3.5 h-3.5 text-purple-400" />
              <h2 class="text-sm font-semibold text-white">Alertas IA</h2>
            </div>
            <router-link to="/dashboard/alerts" class="text-xs text-brand-400 hover:text-brand-300 transition-colors">Ver todo →</router-link>
          </div>
          <div class="divide-y divide-white/4">
            <div v-for="a in topAlerts" :key="a.id" class="px-5 py-3">
              <div class="flex items-start gap-2.5">
                <div class="w-1 self-stretch rounded-full flex-shrink-0 mt-0.5" :class="severityBar(a.severity)"></div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs text-white leading-snug line-clamp-2">{{ a.message }}</p>
                  <p class="text-[10px] text-gray-600 mt-1">{{ timeAgo(a.created_at) }}</p>
                </div>
                <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0" :class="severityPill(a.severity)">{{ a.severity }}</span>
              </div>
              <p v-if="a.ai_summary" class="text-[11px] text-gray-500 mt-2 ml-3.5 leading-relaxed italic line-clamp-2">
                "{{ a.ai_summary }}"
              </p>
            </div>
            <div v-if="topAlerts.length === 0" class="px-5 py-8 text-center text-xs text-gray-600">Sin alertas</div>
          </div>
        </div>

        <!-- Dispositivos online -->
        <div class="rounded-xl border border-white/6 overflow-hidden" style="background:#0d1117">
          <div class="px-5 py-4 border-b border-white/6">
            <h2 class="text-sm font-semibold text-white">Online ahora</h2>
          </div>
          <div class="divide-y divide-white/4">
            <div v-for="d in onlineDevices" :key="d.id" class="px-5 py-2.5 flex items-center justify-between">
              <div>
                <p class="text-xs font-medium text-white">{{ d.name }}</p>
                <p class="text-[10px] text-gray-600">{{ d.ip_address }}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                <span class="text-[10px] text-green-400">Online</span>
              </div>
            </div>
            <div v-if="onlineDevices.length === 0" class="px-5 py-6 text-center text-xs text-gray-600">
              Ningún dispositivo activo
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Distribución de categorías IA -->
    <div class="rounded-xl border border-white/6 p-5" style="background:#0d1117">
      <div class="flex items-center gap-2 mb-4">
        <SparklesIcon class="w-4 h-4 text-purple-400" />
        <h2 class="text-sm font-semibold text-white">Categorización IA — últimas 48h</h2>
      </div>
      <div class="flex flex-wrap gap-2">
        <div v-for="cat in aiCategories" :key="cat.name"
          class="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/6 text-xs">
          <span class="w-2 h-2 rounded-full" :style="`background:${cat.color}`"></span>
          <span class="text-gray-400">{{ cat.name }}</span>
          <span class="text-white font-semibold">{{ cat.count }}</span>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { SparklesIcon } from '@heroicons/vue/24/outline'
import { ComputerDesktopIcon, MagnifyingGlassIcon, NoSymbolIcon, BellAlertIcon } from '@heroicons/vue/24/outline'

const stats          = ref([])
const recentSearches = ref([])
const topAlerts      = ref([])
const onlineDevices  = ref([])
const aiCategories   = ref([])

onMounted(async () => {
  const today = new Date().toISOString().split('T')[0]

  const [
    { count: totalDevices },
    { count: onlineCount },
    { count: alertsCount },
    { count: searchesToday },
    { data: searches },
    { data: alerts },
    { data: devices },
    { data: catData },
  ] = await Promise.all([
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'online'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('search_events').select('*', { count: 'exact', head: true }).gte('searched_at', today),
    supabase.from('search_events').select('id,query,engine,searched_at,ai_category,ai_risk_level,device_id,devices(name)').order('searched_at', { ascending: false }).limit(8),
    supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('devices').select('id,name,ip_address').eq('status', 'online').limit(5),
    supabase.from('search_events').select('ai_category').not('ai_category', 'is', null).gte('searched_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString()),
  ])

  stats.value = [
    { label: 'Dispositivos',       value: totalDevices ?? 0,  glow: '#3b82f6', icon: ComputerDesktopIcon, trend: null },
    { label: 'Online ahora',       value: onlineCount ?? 0,   glow: '#22c55e', icon: ComputerDesktopIcon, trend: null },
    { label: 'Alertas sin resolver', value: alertsCount ?? 0, glow: '#ef4444', icon: BellAlertIcon,       trend: null },
    { label: 'Búsquedas hoy',      value: searchesToday ?? 0, glow: '#a855f7', icon: MagnifyingGlassIcon, trend: null },
  ]

  recentSearches.value = searches || []
  topAlerts.value      = alerts || []
  onlineDevices.value  = devices || []

  // Contar categorías
  const counts = {}
  const catColors = { educativo: '#3b82f6', juegos: '#10b981', redes_sociales: '#f59e0b', preocupante: '#ef4444', inapropiado: '#f97316', tecnologia: '#8b5cf6', entretenimiento: '#06b6d4' }
  ;(catData || []).forEach(r => {
    if (r.ai_category) counts[r.ai_category] = (counts[r.ai_category] || 0) + 1
  })
  aiCategories.value = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, color: catColors[name] || '#6b7280' }))
})

function engineColor(e) {
  return { google: '#4285f4', youtube: '#ef4444', bing: '#00809d', duckduckgo: '#de5833' }[e] || '#6b7280'
}
function riskDot(r) {
  return { safe: 'bg-green-500', low: 'bg-blue-400', medium: 'bg-yellow-400', high: 'bg-orange-400', critical: 'bg-red-500' }[r] || 'bg-gray-600'
}
function severityBar(s) {
  return { info: 'bg-blue-400', warning: 'bg-yellow-400', danger: 'bg-orange-400', critical: 'bg-red-500' }[s]
}
function severityPill(s) {
  return { info: 'bg-blue-500/10 text-blue-400', warning: 'bg-yellow-500/10 text-yellow-300', danger: 'bg-orange-500/10 text-orange-400', critical: 'bg-red-500/15 text-red-400' }[s]
}
function timeAgo(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}
</script>
