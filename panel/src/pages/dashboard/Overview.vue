<template>
  <div class="space-y-4">

    <!-- Stat cards -->
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <div v-for="s in stats" :key="s.label"
        class="rounded px-4 py-3 flex items-center gap-3"
        style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
        <div class="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" :style="`background:${s.glow}14`">
          <component :is="s.icon" class="w-[15px] h-[15px]" :style="`color:${s.glow}`" />
        </div>
        <div class="min-w-0">
          <p class="text-[22px] font-bold text-white leading-none tracking-tight">{{ s.value }}</p>
          <p class="text-[11px] mt-0.5 truncate" style="color:#6b7280">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Main grid -->
    <div class="grid xl:grid-cols-3 gap-4">

      <!-- Busquedas recientes (2/3) -->
      <div class="xl:col-span-2 rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
        <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid rgba(255,255,255,0.07)">
          <div>
            <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Busquedas recientes</p>
          </div>
          <router-link to="/dashboard/devices"
            class="text-[11px] font-medium transition-colors"
            style="color:#006fff">
            Ver todo
          </router-link>
        </div>
        <table class="w-full">
          <thead>
            <tr style="border-bottom:1px solid rgba(255,255,255,0.05)">
              <th class="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Consulta</th>
              <th class="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Dispositivo</th>
              <th class="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Categoria IA</th>
              <th class="text-left px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Hace</th>
              <th class="px-4 py-2 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in recentSearches" :key="s.id"
              class="transition-colors"
              style="border-bottom:1px solid rgba(255,255,255,0.03)"
              onmouseenter="this.style.background='rgba(255,255,255,0.02)'"
              onmouseleave="this.style.background='transparent'">
              <td class="px-4 py-2">
                <div class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    :style="`background:${engineColor(s.engine)}18;color:${engineColor(s.engine)}`">
                    {{ s.engine[0].toUpperCase() }}
                  </span>
                  <span class="text-[12px] text-white truncate max-w-[180px]">{{ s.query }}</span>
                </div>
              </td>
              <td class="px-4 py-2 text-[12px]" style="color:#6b7280">{{ s.devices?.name || '—' }}</td>
              <td class="px-4 py-2">
                <div v-if="s.ai_category" class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                  style="background:rgba(139,92,246,0.1);color:#a78bfa;border:1px solid rgba(139,92,246,0.15)">
                  <SparklesIcon class="w-2.5 h-2.5" />
                  {{ s.ai_category }}
                </div>
                <span v-else class="text-[11px]" style="color:#374151">—</span>
              </td>
              <td class="px-4 py-2 text-[11px]" style="color:#4b5563">{{ timeAgo(s.searched_at) }}</td>
              <td class="px-4 py-2 text-center">
                <span class="w-2 h-2 rounded-full inline-block" :class="riskDot(s.ai_risk_level)"></span>
              </td>
            </tr>
            <tr v-if="recentSearches.length === 0">
              <td colspan="5" class="px-4 py-10 text-center text-[12px]" style="color:#374151">Sin actividad reciente</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right column -->
      <div class="space-y-4">

        <!-- Alertas -->
        <div class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
          <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <div class="flex items-center gap-1.5">
              <SparklesIcon class="w-3 h-3" style="color:#a78bfa" />
              <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Alertas IA</p>
            </div>
            <router-link to="/dashboard/alerts"
              class="text-[11px] font-medium"
              style="color:#006fff">
              Ver todo
            </router-link>
          </div>
          <div>
            <div v-for="a in topAlerts" :key="a.id"
              class="px-4 py-3 transition-colors"
              style="border-bottom:1px solid rgba(255,255,255,0.04)"
              onmouseenter="this.style.background='rgba(255,255,255,0.02)'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <div class="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5" :class="severityBar(a.severity)"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-0.5">
                    <p class="text-[12px] text-white leading-snug line-clamp-2">{{ a.message }}</p>
                    <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" :class="severityPill(a.severity)">{{ a.severity }}</span>
                  </div>
                  <p class="text-[10px]" style="color:#374151">{{ timeAgo(a.created_at) }}</p>
                </div>
              </div>
              <p v-if="a.ai_summary" class="text-[11px] mt-1.5 ml-2.5 leading-relaxed line-clamp-2" style="color:#6b7280;font-style:italic">
                "{{ a.ai_summary }}"
              </p>
            </div>
            <div v-if="topAlerts.length === 0" class="px-4 py-8 text-center text-[12px]" style="color:#374151">Sin alertas</div>
          </div>
        </div>

        <!-- Dispositivos online -->
        <div class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
          <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Online ahora</p>
          </div>
          <div>
            <div v-for="d in onlineDevices" :key="d.id"
              class="px-4 py-2.5 flex items-center justify-between transition-colors"
              style="border-bottom:1px solid rgba(255,255,255,0.03)"
              onmouseenter="this.style.background='rgba(255,255,255,0.02)'"
              onmouseleave="this.style.background='transparent'">
              <div>
                <p class="text-[12px] font-medium text-white">{{ d.name }}</p>
                <p class="text-[10px] font-mono" style="color:#374151">{{ d.ip_address }}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#4ade80"></span>
                <span class="text-[10px]" style="color:#4ade80">Online</span>
              </div>
            </div>
            <div v-if="onlineDevices.length === 0" class="px-4 py-6 text-center text-[12px]" style="color:#374151">
              Ningun dispositivo activo
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Categorias IA -->
    <div class="rounded p-4" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <div class="flex items-center gap-1.5 mb-3">
        <SparklesIcon class="w-3.5 h-3.5" style="color:#a78bfa" />
        <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Categorizacion IA — ultimas 48h</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <div v-for="cat in aiCategories" :key="cat.name"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px]"
          style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07)">
          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="`background:${cat.color}`"></span>
          <span style="color:#9ca3af">{{ cat.name }}</span>
          <span class="font-semibold text-white">{{ cat.count }}</span>
        </div>
        <div v-if="aiCategories.length === 0" class="text-[12px]" style="color:#374151">Sin datos en el periodo</div>
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
    { label: 'Dispositivos',         value: totalDevices ?? 0,  glow: '#006fff', icon: ComputerDesktopIcon, trend: null },
    { label: 'Online ahora',         value: onlineCount ?? 0,   glow: '#22c55e', icon: ComputerDesktopIcon, trend: null },
    { label: 'Alertas sin resolver', value: alertsCount ?? 0,   glow: '#ef4444', icon: BellAlertIcon,       trend: null },
    { label: 'Busquedas hoy',        value: searchesToday ?? 0, glow: '#a855f7', icon: MagnifyingGlassIcon, trend: null },
  ]

  recentSearches.value = searches || []
  topAlerts.value      = alerts || []
  onlineDevices.value  = devices || []

  // Contar categorías
  const counts = {}
  const catColors = { educativo: '#006fff', juegos: '#10b981', redes_sociales: '#f59e0b', preocupante: '#ef4444', inapropiado: '#f97316', tecnologia: '#8b5cf6', entretenimiento: '#06b6d4' }
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
