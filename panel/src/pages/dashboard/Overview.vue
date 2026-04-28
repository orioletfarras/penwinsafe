<template>
  <div class="space-y-4">

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <div v-for="i in 4" :key="i" class="card px-4 py-3.5 flex items-center gap-3">
          <Skeleton height="32px" width="32px" class-name="rounded-lg flex-shrink-0" />
          <div class="flex-1 space-y-2">
            <Skeleton height="22px" width="60px" />
            <Skeleton height="11px" width="80%" />
          </div>
        </div>
      </div>
      <div class="grid xl:grid-cols-3 gap-4">
        <div class="card xl:col-span-2 overflow-hidden">
          <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5"><Skeleton height="12px" width="140px" /></div>
          <div class="p-4 space-y-3">
            <Skeleton v-for="i in 6" :key="i" height="36px" />
          </div>
        </div>
        <div class="space-y-4">
          <div class="card overflow-hidden">
            <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5"><Skeleton height="12px" width="100px" /></div>
            <div class="p-4 space-y-3"><Skeleton v-for="i in 3" :key="i" height="48px" /></div>
          </div>
          <div class="card overflow-hidden">
            <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5"><Skeleton height="12px" width="80px" /></div>
            <div class="p-4 space-y-3"><Skeleton v-for="i in 3" :key="i" height="36px" /></div>
          </div>
        </div>
      </div>
    </template>

    <!-- Stat cards -->
    <template v-else>
    <div class="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <div v-for="s in stats" :key="s.label"
        class="card px-4 py-3.5 flex items-center gap-3"
        :style="`border-left-width:3px;border-left-color:${s.glow}`">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" :style="`background:${s.glow}14`">
          <component :is="s.icon" class="w-[15px] h-[15px]" :style="`color:${s.glow}`" />
        </div>
        <div class="min-w-0 flex-1">
          <div class="flex items-end gap-2">
            <p class="text-[22px] font-bold leading-none tracking-tight" style="color:#111827">{{ s.value }}</p>
            <span v-if="s.trend !== null" class="text-[10px] font-semibold pb-0.5"
              :style="s.trend >= 0 ? 'color:#16a34a' : 'color:#dc2626'">
              {{ s.trend >= 0 ? '↑' : '↓' }}{{ Math.abs(s.trend) }}%
            </span>
          </div>
          <p class="text-[11px] mt-0.5 truncate" style="color:#6b7280">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Accesos rápidos + config -->
    <div class="flex items-center justify-between gap-2 flex-wrap">
    <div class="flex items-center gap-2 flex-wrap">
      <router-link to="/dashboard/devices" class="btn btn-secondary">
        <ComputerDesktopIcon class="w-3.5 h-3.5" /> Ver dispositivos
      </router-link>
      <router-link to="/dashboard/groups" class="btn btn-secondary">
        <UserGroupIcon class="w-3.5 h-3.5" /> Gestionar clases
      </router-link>
      <router-link to="/dashboard/alerts" class="btn btn-secondary">
        <BellAlertIcon class="w-3.5 h-3.5" />
        Alertas
        <span v-if="pendingAlerts > 0" class="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">{{ pendingAlerts }}</span>
      </router-link>
      <router-link to="/dashboard/reports" class="btn btn-secondary">
        <DocumentTextIcon class="w-3.5 h-3.5" /> Informes
      </router-link>
    </div>
    <!-- Widget config panel -->
    <div class="relative">
      <button @click="showWidgetPanel = !showWidgetPanel" class="btn btn-secondary btn-sm" :style="showWidgetPanel ? 'background:#f0f2f5' : ''">
        <Cog6ToothIcon class="w-3.5 h-3.5" /> Configurar
      </button>
      <div v-if="showWidgetPanel"
        class="absolute right-0 top-full mt-1.5 w-56 rounded-xl overflow-hidden z-50"
        style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 12px 32px rgba(0,0,0,0.1)">
        <div class="flex items-center justify-between px-3 py-2.5" style="border-bottom:1px solid #f3f4f6">
          <p class="text-[12px] font-semibold" style="color:#111827">Widgets visibles</p>
          <button @click="showWidgetPanel = false" style="color:#9ca3af"><XMarkIcon class="w-3.5 h-3.5" /></button>
        </div>
        <div class="py-1.5">
          <label v-for="w in WIDGET_DEFS" :key="w.key"
            class="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer transition-colors"
            onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='transparent'">
            <input type="checkbox" :checked="show(w.key)" @change="toggleWidget(w.key)"
              style="accent-color:#006fff" class="rounded" />
            <span class="text-[12px]" style="color:#374151">{{ w.label }}</span>
          </label>
        </div>
      </div>
    </div>
    </div>

    <!-- Main grid -->
    <div class="grid xl:grid-cols-3 gap-4">

      <!-- Busquedas recientes (2/3) -->
      <div v-if="show('searches')" class="card xl:col-span-2 overflow-hidden">
        <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #f0f2f5">
          <div>
            <p class="section-label">Búsquedas recientes</p>
          </div>
          <router-link to="/dashboard/devices"
            class="text-[11px] font-medium transition-colors"
            style="color:#006fff">
            Ver todo
          </router-link>
        </div>
        <table class="w-full">
          <thead>
            <tr style="background:#f9fafb;border-bottom:1px solid #f3f4f6">
              <th class="text-left px-4 py-3 section-label">Consulta</th>
              <th class="text-left px-4 py-3 section-label">Dispositivo</th>
              <th class="text-left px-4 py-3 section-label">Categoría IA</th>
              <th class="text-left px-4 py-3 section-label">Hace</th>
              <th class="px-4 py-3 section-label">Riesgo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in recentSearches" :key="s.id"
              class="transition-colors"
              style="border-bottom:1px solid #f0f2f5"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="w-4 h-4 rounded flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                    :style="`background:${engineColor(s.engine)}18;color:${engineColor(s.engine)}`">
                    {{ s.engine[0].toUpperCase() }}
                  </span>
                  <span class="text-[12px] truncate max-w-[180px]" style="color:#111827">{{ s.query }}</span>
                </div>
              </td>
              <td class="px-4 py-2 text-[12px]" style="color:#6b7280">{{ s.devices?.name || '—' }}</td>
              <td class="px-4 py-2">
                <div v-if="s.ai_category" class="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded"
                  style="background:#f5f3ff;color:#7c3aed;border:1px solid #e9d5ff">
                  <SparklesIcon class="w-2.5 h-2.5" />
                  {{ s.ai_category }}
                </div>
                <span v-else class="text-[11px]" style="color:#9ca3af">—</span>
              </td>
              <td class="px-4 py-2 text-[11px]" style="color:#9ca3af">{{ timeAgo(s.searched_at) }}</td>
              <td class="px-4 py-2 text-center">
                <span class="w-2 h-2 rounded-full inline-block" :class="riskDot(s.ai_risk_level)"></span>
              </td>
            </tr>
            <tr v-if="recentSearches.length === 0">
              <td colspan="5">
                <div class="empty-state">
                  <div class="empty-state-icon"><MagnifyingGlassIcon /></div>
                  <p class="empty-state-title">Sin búsquedas recientes</p>
                  <p class="empty-state-desc">Las búsquedas de los dispositivos aparecerán aquí.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right column -->
      <div class="space-y-4">

        <!-- Alertas -->
        <div v-if="show('alerts')" class="card overflow-hidden">
          <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #f0f2f5">
            <div class="flex items-center gap-1.5">
              <SparklesIcon class="w-3 h-3" style="color:#7c3aed" />
              <p class="section-label">Alertas IA</p>
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
              style="border-bottom:1px solid #f3f4f6"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <div class="w-0.5 self-stretch rounded-full flex-shrink-0 mt-0.5" :class="severityBar(a.severity)"></div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-2 mb-0.5">
                    <p class="text-[12px] leading-snug line-clamp-2" style="color:#111827">{{ a.message }}</p>
                    <span class="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" :class="severityPill(a.severity)">{{ a.severity }}</span>
                  </div>
                  <p class="text-[10px]" style="color:#9ca3af">{{ timeAgo(a.created_at) }}</p>
                </div>
              </div>
              <p v-if="a.ai_summary" class="text-[11px] mt-1.5 ml-2.5 leading-relaxed line-clamp-2" style="color:#6b7280;font-style:italic">
                "{{ a.ai_summary }}"
              </p>
            </div>
            <div v-if="topAlerts.length === 0" class="empty-state">
              <div class="empty-state-icon"><SparklesIcon /></div>
              <p class="empty-state-title">Sin alertas</p>
              <p class="empty-state-desc">Todo en orden por ahora.</p>
            </div>
          </div>
        </div>

        <!-- Dispositivos online -->
        <div v-if="show('online')" class="card overflow-hidden">
          <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5">
            <p class="section-label">Online ahora</p>
          </div>
          <div>
            <div v-for="d in onlineDevices" :key="d.id"
              class="px-4 py-2.5 flex items-center justify-between transition-colors"
              style="border-bottom:1px solid #f3f4f6"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div>
                <p class="text-[12px] font-medium" style="color:#111827">{{ d.name }}</p>
                <p class="text-[10px] font-mono" style="color:#9ca3af">{{ d.ip_address }}</p>
              </div>
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
                <span class="text-[10px]" style="color:#16a34a">Online</span>
              </div>
            </div>
            <div v-if="onlineDevices.length === 0" class="empty-state" style="padding:24px">
              <div class="empty-state-icon"><ComputerDesktopIcon /></div>
              <p class="empty-state-title">Ningún dispositivo activo</p>
            </div>
          </div>
        </div>

        <!-- Dispositivos sin conectar -->
        <div v-if="show('offline')" class="card overflow-hidden">
          <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #f0f2f5">
            <p class="section-label">Sin actividad reciente</p>
            <router-link to="/dashboard/devices" class="text-[11px] font-medium" style="color:#006fff">Ver todo</router-link>
          </div>
          <div>
            <div v-for="d in offlineDevices" :key="d.id"
              class="px-4 py-2.5 flex items-center justify-between transition-colors"
              style="border-bottom:1px solid #f3f4f6"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div>
                <p class="text-[12px] font-medium" style="color:#111827">{{ d.name }}</p>
                <p class="text-[10px]" style="color:#9ca3af">{{ timeAgo(d.last_seen) }}</p>
              </div>
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" style="background:#d1d5db"></span>
            </div>
            <div v-if="offlineDevices.length === 0" class="empty-state" style="padding:20px">
              <p class="empty-state-title" style="font-size:12px">Todos conectados recientemente</p>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Gráfico actividad -->
    <div v-if="show('chart')" class="card p-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="section-label">Actividad de búsquedas</p>
          <p class="text-[11px] mt-0.5" style="color:#9ca3af">Últimas 24 horas</p>
        </div>
        <div class="flex items-center gap-1.5 text-[11px]" style="color:#6b7280">
          <span class="w-2 h-2 rounded-full" style="background:#006fff"></span>
          Total búsquedas
        </div>
      </div>

      <!-- SVG chart -->
      <div class="relative" style="height:120px">
        <svg v-if="chartPoints.length" width="100%" height="100%" viewBox="0 0 720 120" preserveAspectRatio="none" class="absolute inset-0">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#006fff" stop-opacity="0.15"/>
              <stop offset="100%" stop-color="#006fff" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <!-- Grid lines -->
          <line x1="0" y1="30" x2="720" y2="30" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="0" y1="60" x2="720" y2="60" stroke="#f3f4f6" stroke-width="1"/>
          <line x1="0" y1="90" x2="720" y2="90" stroke="#f3f4f6" stroke-width="1"/>
          <!-- Area fill -->
          <path :d="chartAreaPath" fill="url(#chartGrad)"/>
          <!-- Line -->
          <path :d="chartLinePath" fill="none" stroke="#006fff" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>
          <!-- Dots -->
          <circle v-for="(p, i) in chartPoints" :key="i"
            :cx="p.x" :cy="p.y" r="2.5"
            fill="#006fff" opacity="0.7"/>
        </svg>
        <div v-if="!chartPoints.length" class="absolute inset-0 flex items-center justify-center">
          <p class="text-[12px]" style="color:#9ca3af">Sin datos en las últimas 24h</p>
        </div>
      </div>

      <!-- Hour labels -->
      <div class="flex justify-between mt-2 px-0.5">
        <span v-for="label in chartLabels" :key="label" class="text-[9px]" style="color:#d1d5db">{{ label }}</span>
      </div>
    </div>

    <!-- Top sitios -->
    <div v-if="show('topsites')" class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5">
        <p class="section-label">Top sitios visitados — últimas 24h</p>
      </div>
      <div v-if="topDomains.length === 0" class="px-4 py-4 text-[12px]" style="color:#9ca3af">Sin datos</div>
      <div v-else class="p-4 flex flex-col gap-2">
        <div v-for="(d, i) in topDomains" :key="d.domain" class="flex items-center gap-3">
          <span class="text-[10px] font-mono w-4 text-right flex-shrink-0" style="color:#d1d5db">{{ i+1 }}</span>
          <img :src="`https://www.google.com/s2/favicons?domain=${d.domain}&sz=16`"
            class="w-3.5 h-3.5 flex-shrink-0 rounded" @error="e => e.target.style.display='none'" />
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[11px] font-medium truncate" style="color:#374151">{{ d.domain }}</span>
              <span class="text-[10px] flex-shrink-0" style="color:#9ca3af">{{ d.count }}</span>
            </div>
            <div class="h-1 rounded-full" style="background:#f3f4f6">
              <div class="h-1 rounded-full" style="background:#006fff"
                :style="`width:${Math.round((d.count / topDomains[0].count) * 100)}%`"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Mapa de calor horario -->
    <div v-if="show('heatmap')" class="card p-4">
      <div class="flex items-center justify-between mb-4">
        <div>
          <p class="section-label">Mapa de calor horario</p>
          <p class="text-[11px] mt-0.5" style="color:#9ca3af">Actividad por hora del día · últimos 7 días</p>
        </div>
        <div class="flex items-center gap-1.5 text-[10px]" style="color:#9ca3af">
          <span class="w-3 h-3 rounded-sm inline-block" style="background:#dbeafe"></span>
          <span>Bajo</span>
          <span class="w-3 h-3 rounded-sm inline-block ml-1" style="background:#006fff"></span>
          <span>Alto</span>
        </div>
      </div>
      <div class="flex items-end gap-1" style="height:60px">
        <div v-for="(v, h) in heatmapData" :key="h"
          class="flex-1 rounded-sm flex flex-col items-center justify-end"
          style="position:relative">
          <div class="w-full rounded-sm"
            :style="`height:${heatmapData.some(x=>x>0) ? Math.max(4, Math.round(v/Math.max(...heatmapData)*52)) : 4}px;background:${v > 0 ? '#006fff' : '#f3f4f6'};opacity:${v > 0 ? 0.2 + 0.8*(v/Math.max(1,...heatmapData)) : 1};transition:all 0.2s`">
          </div>
        </div>
      </div>
      <div class="flex justify-between mt-1.5 px-0.5">
        <span v-for="label in ['00h','03h','06h','09h','12h','15h','18h','21h','23h']" :key="label"
          class="text-[9px]" style="color:#d1d5db">{{ label }}</span>
      </div>
    </div>

    <!-- Categorias IA -->
    <div v-if="show('categories')" class="card p-4">
      <div class="flex items-center gap-1.5 mb-3">
        <SparklesIcon class="w-3.5 h-3.5" style="color:#7c3aed" />
        <p class="section-label">Categorización IA — últimas 48h</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <div v-for="cat in aiCategories" :key="cat.name"
          class="flex items-center gap-2 px-2.5 py-1.5 rounded text-[11px]"
          style="background:#f9fafb;border:1px solid #e5e7eb">
          <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="`background:${cat.color}`"></span>
          <span style="color:#6b7280">{{ cat.name }}</span>
          <span class="font-semibold" style="color:#111827">{{ cat.count }}</span>
        </div>
        <div v-if="aiCategories.length === 0" class="text-[12px]" style="color:#9ca3af">Sin datos en el periodo</div>
      </div>
    </div>

    </template> <!-- end v-else -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { SparklesIcon, Cog6ToothIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { ComputerDesktopIcon, MagnifyingGlassIcon, NoSymbolIcon, BellAlertIcon, UserGroupIcon, DocumentTextIcon } from '@heroicons/vue/24/outline'
import Skeleton from '../../components/Skeleton.vue'

// ── Configurable widgets ───────────────────────────────────────────────────
const WIDGET_DEFS = [
  { key: 'searches',   label: 'Búsquedas recientes' },
  { key: 'alerts',     label: 'Alertas IA' },
  { key: 'online',     label: 'Online ahora' },
  { key: 'offline',    label: 'Sin actividad reciente' },
  { key: 'chart',      label: 'Gráfico de actividad' },
  { key: 'topsites',   label: 'Top sitios visitados' },
  { key: 'heatmap',    label: 'Mapa de calor horario' },
  { key: 'categories', label: 'Categorización IA' },
]
const STORAGE_KEY = 'pws_overview_widgets'
function loadWidgets() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null') } catch { return null }
}
const widgetConfig = ref(loadWidgets() || Object.fromEntries(WIDGET_DEFS.map(w => [w.key, true])))
function saveWidgets() { localStorage.setItem(STORAGE_KEY, JSON.stringify(widgetConfig.value)) }
function toggleWidget(key) { widgetConfig.value[key] = !widgetConfig.value[key]; saveWidgets() }
const showWidgetPanel = ref(false)
const show = (key) => widgetConfig.value[key] !== false

const loading        = ref(true)
const pendingAlerts  = ref(0)
const topDomains     = ref([])
const stats          = ref([])
const recentSearches = ref([])
const topAlerts      = ref([])
const onlineDevices  = ref([])
const offlineDevices = ref([])
const aiCategories   = ref([])
const hourlySearches = ref(new Array(24).fill(0))
const heatmapData    = ref(new Array(24).fill(0))

const chartLabels = computed(() => {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const h = new Date(now - (23 - Math.round(i * 23 / 6)) * 3600000)
    return h.getHours().toString().padStart(2, '0') + 'h'
  })
})

const chartPoints = computed(() => {
  const data = hourlySearches.value
  const max = Math.max(...data, 1)
  const W = 720, H = 110, pad = 4
  return data.map((v, i) => ({
    x: (i / 23) * W,
    y: pad + (1 - v / max) * (H - pad * 2),
  }))
})

const chartLinePath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
})

const chartAreaPath = computed(() => {
  const pts = chartPoints.value
  if (!pts.length) return ''
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  return `${line} L${pts[pts.length - 1].x},120 L0,120 Z`
})

onMounted(async () => {
  try {
  const today = new Date().toISOString().split('T')[0]

  const since24h = new Date(Date.now() - 24 * 3600 * 1000).toISOString()

  const lastWeekStart = new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString().split('T')[0]
  const weekAgo       = new Date(Date.now() -  7 * 24 * 3600 * 1000).toISOString().split('T')[0]

  const [
    { count: totalDevices },
    { count: onlineCount },
    { count: alertsCount },
    { count: searchesToday },
    { count: searchesLastWeek },
    { data: searches },
    { data: alerts },
    { data: devices },
    { data: catData },
    { data: hourlyData },
    { data: topDomainsData },
    { data: weeklyHourlyData },
    { data: offlineDevicesData },
  ] = await Promise.all([
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'online'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('search_events').select('*', { count: 'exact', head: true }).gte('searched_at', today),
    supabase.from('search_events').select('*', { count: 'exact', head: true }).gte('searched_at', lastWeekStart).lt('searched_at', weekAgo),
    supabase.from('search_events').select('id,query,engine,searched_at,ai_category,ai_risk_level,device_id,devices(name)').order('searched_at', { ascending: false }).limit(8),
    supabase.from('alerts').select('*').eq('resolved', false).order('created_at', { ascending: false }).limit(3),
    supabase.from('devices').select('id,name,ip_address').eq('status', 'online').limit(5),
    supabase.from('search_events').select('ai_category').not('ai_category', 'is', null).gte('searched_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString()),
    supabase.from('search_events').select('searched_at').gte('searched_at', since24h),
    supabase.from('url_events').select('domain').gte('visited_at', since24h).not('domain', 'is', null),
    supabase.from('search_events').select('searched_at').gte('searched_at', new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString()).limit(2000),
    supabase.from('devices').select('id,name,last_seen').neq('status','online').not('last_seen','is',null).order('last_seen',{ascending:true}).limit(5),
  ])

  // Agrupar búsquedas por hora (slot 0 = hace 23h, slot 23 = hora actual)
  const now = Date.now()
  const buckets = new Array(24).fill(0)
  ;(hourlyData || []).forEach(r => {
    const slot = 23 - Math.floor((now - new Date(r.searched_at).getTime()) / 3600000)
    if (slot >= 0 && slot < 24) buckets[slot]++
  })
  hourlySearches.value = buckets

  // Heatmap: searches per hour of day (last 7 days)
  const heatBuckets = new Array(24).fill(0)
  ;(weeklyHourlyData || []).forEach(r => {
    heatBuckets[new Date(r.searched_at).getHours()]++
  })
  heatmapData.value = heatBuckets

  // Comparativa semanal búsquedas
  const todayCount     = searchesToday ?? 0
  const lastWeekCount  = searchesLastWeek ?? 0
  const weeklyTrend    = lastWeekCount > 0 ? Math.round(((todayCount - lastWeekCount) / lastWeekCount) * 100) : null

  // Top dominios
  const domCount = {}
  ;(topDomainsData || []).forEach(r => { domCount[r.domain] = (domCount[r.domain] || 0) + 1 })
  topDomains.value = Object.entries(domCount).sort((a,b) => b[1]-a[1]).slice(0,8).map(([domain,count]) => ({ domain, count }))

  pendingAlerts.value = alertsCount ?? 0
  stats.value = [
    { label: 'Dispositivos',         value: totalDevices ?? 0,  glow: '#006fff', icon: ComputerDesktopIcon, trend: null },
    { label: 'Online ahora',         value: onlineCount ?? 0,   glow: '#22c55e', icon: ComputerDesktopIcon, trend: null },
    { label: 'Alertas sin resolver', value: alertsCount ?? 0,   glow: '#ef4444', icon: BellAlertIcon,       trend: null },
    { label: 'Busquedas hoy',        value: todayCount,         glow: '#a855f7', icon: MagnifyingGlassIcon, trend: weeklyTrend },
  ]

  recentSearches.value = searches || []
  topAlerts.value      = alerts || []
  onlineDevices.value  = devices || []
  offlineDevices.value = offlineDevicesData || []

  // Contar categorías
  const counts = {}
  const catColors = { educativo: '#006fff', juegos: '#10b981', redes_sociales: '#f59e0b', preocupante: '#ef4444', inapropiado: '#f97316', tecnologia: '#8b5cf6', entretenimiento: '#06b6d4' }
  ;(catData || []).forEach(r => {
    if (r.ai_category) counts[r.ai_category] = (counts[r.ai_category] || 0) + 1
  })
  aiCategories.value = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count, color: catColors[name] || '#6b7280' }))

  const channel = supabase.channel('overview-devices-rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, p => {
      const idx = onlineDevices.value.findIndex(d => d.id === p.new.id)
      if (p.new.status === 'online') {
        if (idx === -1) onlineDevices.value.unshift({ id: p.new.id, name: p.new.name, ip_address: p.new.ip_address })
        else Object.assign(onlineDevices.value[idx], p.new)
      } else {
        if (idx !== -1) onlineDevices.value.splice(idx, 1)
      }
      // Actualizar stat "Online ahora"
      const onlineStat = stats.value.find(s => s.label === 'Online ahora')
      if (onlineStat) onlineStat.value = onlineDevices.value.length
    })
    .subscribe()

  onUnmounted(() => supabase.removeChannel(channel))

  } catch (e) {
    console.error('Overview load error:', e)
  } finally {
    loading.value = false
  }
})

function engineColor(e) {
  return { google: '#4285f4', youtube: '#ef4444', bing: '#00809d', duckduckgo: '#de5833' }[e] || '#6b7280'
}
function riskDot(r) {
  return { safe: 'bg-green-500', low: 'bg-blue-400', medium: 'bg-yellow-400', high: 'bg-orange-400', critical: 'bg-red-500' }[r] || 'bg-gray-400'
}
function severityBar(s) {
  return { info: 'bg-blue-500', warning: 'bg-yellow-400', danger: 'bg-orange-400', critical: 'bg-red-500' }[s]
}
function severityPill(s) {
  return { info: 'bg-blue-50 text-blue-600', warning: 'bg-yellow-50 text-yellow-600', danger: 'bg-orange-50 text-orange-600', critical: 'bg-red-50 text-red-600' }[s]
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
