<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold text-gray-900 tracking-tight">Tráfico de Red</h1>
        <p class="text-xs text-gray-400 mt-0.5">Consumo real · últimas 24 h</p>
      </div>
      <button @click="load" :disabled="loading"
        class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
        <ArrowPathIcon class="w-3.5 h-3.5" :class="loading ? 'animate-spin' : ''" />
        Actualizar
      </button>
    </div>

    <!-- Loading -->
    <div v-if="loading && !data"
      class="rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-2.5 py-20 text-gray-300">
      <ArrowPathIcon class="w-5 h-5 animate-spin" />
      <span class="text-sm">Cargando tráfico…</span>
    </div>

    <!-- Error -->
    <div v-else-if="!data && error"
      class="rounded-2xl border border-dashed border-gray-200 p-12 text-center bg-gray-50 space-y-2">
      <p class="text-sm font-semibold text-gray-600">{{ error }}</p>
      <p class="text-xs text-gray-400">Comprueba que UniFi esté configurado en SuperConfig</p>
    </div>

    <template v-else-if="data">

      <!-- KPI bar -->
      <div class="grid grid-cols-3 gap-3">
        <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100">
          <p class="text-3xl font-black text-blue-700 tabular-nums">{{ fmt(data.total_rx) }}</p>
          <p class="text-xs font-bold text-blue-500 mt-1 uppercase tracking-wide">Descargado</p>
        </div>
        <div class="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-100">
          <p class="text-3xl font-black text-violet-700 tabular-nums">{{ fmt(data.total_tx) }}</p>
          <p class="text-xs font-bold text-violet-500 mt-1 uppercase tracking-wide">Subido</p>
        </div>
        <div class="rounded-2xl p-5 bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200">
          <p class="text-3xl font-black text-gray-800 tabular-nums">{{ fmt(data.total_rx + data.total_tx) }}</p>
          <p class="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Total</p>
        </div>
      </div>

      <!-- Area chart -->
      <div v-if="data.chart.length" class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
        <p class="text-sm font-bold text-gray-800">Tráfico por hora</p>
        <div class="relative" style="height:140px">
          <svg class="w-full h-full" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
            <defs>
              <linearGradient id="rxGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
              </linearGradient>
              <linearGradient id="txGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.4"/>
                <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
              </linearGradient>
            </defs>
            <path :d="areaPath('rx')" fill="url(#rxGrad)" />
            <path :d="linePath('rx')" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
            <path :d="areaPath('tx')" fill="url(#txGrad)" />
            <path :d="linePath('tx')" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="absolute top-0 left-0 flex flex-col justify-between h-full pointer-events-none">
            <span class="text-[9px] text-gray-300">{{ fmt(chartMaxVal) }}</span>
            <span class="text-[9px] text-gray-300">0</span>
          </div>
          <div class="absolute bottom-0 left-6 right-0 flex justify-between pointer-events-none">
            <span v-for="label in chartXLabels" :key="label" class="text-[9px] text-gray-300">{{ label }}</span>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-1 rounded-full bg-sky-400"></div>
            <span class="text-xs text-gray-500">Descarga</span>
          </div>
          <div class="flex items-center gap-1.5">
            <div class="w-3 h-1 rounded-full bg-violet-400"></div>
            <span class="text-xs text-gray-500">Subida</span>
          </div>
        </div>
      </div>

      <!-- Apps table (when available from v2 API) -->
      <div v-if="data.apps && data.apps.length" class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div class="grid items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide"
          style="grid-template-columns:2fr 1fr 1fr 1fr auto">
          <span>Aplicación</span>
          <span class="text-right">Total</span>
          <span class="text-right text-sky-400">Descarga</span>
          <span class="text-right text-violet-400">Subida</span>
          <span class="text-right">Clientes</span>
        </div>
        <div class="divide-y divide-gray-50">
          <div v-for="app in data.apps" :key="app.name"
            class="grid items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
            style="grid-template-columns:2fr 1fr 1fr 1fr auto">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                :style="`background:#${BRAND_ICONS[app.name]?.hex || 'f3f4f6'}18`">
                <svg v-if="BRAND_ICONS[app.name]" viewBox="0 0 24 24" class="w-3.5 h-3.5"
                  :fill="`#${BRAND_ICONS[app.name].hex === '000000' ? '374151' : BRAND_ICONS[app.name].hex}`">
                  <path :d="BRAND_ICONS[app.name].path" />
                </svg>
                <span v-else class="text-xs">🌐</span>
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-gray-800 truncate">{{ app.name }}</p>
                <div class="mt-0.5 h-1 rounded-full bg-gray-100 overflow-hidden" style="width:80px">
                  <div class="h-full rounded-full transition-all duration-500"
                    :style="`width:${pctApp(app.total_bytes)}%;background:${BRAND_ICONS[app.name] ? '#'+BRAND_ICONS[app.name].hex : '#94a3b8'}`" />
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-gray-700">{{ fmt(app.total_bytes) }}</p>
              <p class="text-[10px] text-gray-400">{{ pctApp(app.total_bytes) }}%</p>
            </div>
            <p class="text-xs font-semibold text-sky-500 text-right">{{ fmt(app.rx_bytes) }}</p>
            <p class="text-xs font-semibold text-violet-500 text-right">{{ fmt(app.tx_bytes) }}</p>
            <p class="text-xs font-bold text-gray-400 text-right">{{ app.clients || '—' }}</p>
          </div>
        </div>
      </div>

      <!-- Device table (fallback) -->
      <div v-else class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
        <div class="grid items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide"
          style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
          <span>Dispositivo</span>
          <span class="text-right">Total</span>
          <span class="text-right text-sky-400">Descarga</span>
          <span class="text-right text-violet-400">Subida</span>
          <span class="text-right">Grupo</span>
        </div>

        <div v-if="!data.devices.length" class="py-12 text-center text-sm text-gray-300">
          Sin dispositivos activos en las últimas 24 h
        </div>

        <div class="divide-y divide-gray-50">
          <div v-for="device in data.devices" :key="device.mac"
            class="grid items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
            style="grid-template-columns:2fr 1fr 1fr 1fr 1fr">
            <div class="flex items-center gap-2.5 min-w-0">
              <div class="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <ComputerDesktopIcon class="w-4 h-4 text-gray-400" />
              </div>
              <div class="min-w-0">
                <p class="text-xs font-bold text-gray-800 truncate">{{ device.student || device.name }}</p>
                <div class="mt-0.5 flex items-center gap-1.5">
                  <div class="h-1 rounded-full bg-gray-100 overflow-hidden" style="width:60px">
                    <div class="h-full rounded-full bg-sky-400 transition-all duration-500"
                      :style="`width:${pctDev(device.total_bytes)}%`" />
                  </div>
                  <span class="text-[10px] text-gray-400">{{ pctDev(device.total_bytes) }}%</span>
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-gray-700">{{ fmt(device.total_bytes) }}</p>
            </div>
            <p class="text-xs font-semibold text-sky-500 text-right">{{ fmt(device.rx_bytes) }}</p>
            <p class="text-xs font-semibold text-violet-500 text-right">{{ fmt(device.tx_bytes) }}</p>
            <p class="text-xs text-gray-400 text-right truncate">{{ device.group || '—' }}</p>
          </div>
        </div>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId } from '../../lib/orgStore'
import { ArrowPathIcon, ComputerDesktopIcon } from '@heroicons/vue/24/outline'
import {
  siYoutube, siTiktok, siInstagram, siFacebook, siWhatsapp,
  siX, siNetflix, siTwitch, siSpotify, siRoblox, siSteam,
  siDiscord, siSnapchat, siGoogle, siApple, siCloudflare,
  siTelegram, siKahoot, siDuolingo, siZoom, siDropbox,
  siEpicgames, siEa, siPlaystation, siHbo, siAkamai, siFastly,
} from 'simple-icons'

const WINDOWS_ICON = {
  hex: '0078D4',
  path: 'M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.051M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.851',
}

const BRAND_ICONS = {
  'YouTube':            siYoutube,
  'TikTok':             siTiktok,
  'Instagram':          siInstagram,
  'Facebook':           siFacebook,
  'WhatsApp':           siWhatsapp,
  'Twitter / X':        siX,
  'Snapchat':           siSnapchat,
  'Telegram':           siTelegram,
  'Discord':            siDiscord,
  'Netflix':            siNetflix,
  'Twitch':             siTwitch,
  'Spotify':            siSpotify,
  'HBO / Max':          siHbo,
  'Roblox':             siRoblox,
  'Steam':              siSteam,
  'Epic Games':         siEpicgames,
  'EA / Origin':        siEa,
  'PlayStation':        siPlaystation,
  'Google':             siGoogle,
  'Google Drive':       siGoogle,
  'iCloud':             siApple,
  'Apple Services':     siApple,
  'Microsoft Office':   WINDOWS_ICON,
  'Microsoft Teams':    WINDOWS_ICON,
  'Windows Update':     WINDOWS_ICON,
  'SharePoint':         WINDOWS_ICON,
  'Kahoot':             siKahoot,
  'Duolingo':           siDuolingo,
  'Zoom':               siZoom,
  'Dropbox':            siDropbox,
  'Cloudflare':         siCloudflare,
  'Akamai':             siAkamai,
}

// ── State ──────────────────────────────────────────────────────────────────
const data    = ref(null)
const loading = ref(false)
const error   = ref(null)

// ── Helpers ────────────────────────────────────────────────────────────────
function fmt(bytes) {
  if (!bytes) return '0 B'
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`
  if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(0)} MB`
  if (bytes >= 1e3)  return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

const maxApp = computed(() =>
  Math.max(1, ...(data.value?.apps || []).map(a => a.total_bytes))
)
const maxDev = computed(() =>
  Math.max(1, ...(data.value?.devices || []).map(d => d.total_bytes))
)
function pctApp(bytes) { return Math.round(bytes / maxApp.value * 100) }
function pctDev(bytes) { return Math.round(bytes / maxDev.value * 100) }

// ── Chart ──────────────────────────────────────────────────────────────────
const chartW = 600
const chartH = 100
const chartPad = { l: 24, r: 4, t: 4, b: 16 }

const chartMaxVal = computed(() => {
  if (!data.value?.chart.length) return 0
  return Math.max(...data.value.chart.map(p => Math.max(p.rx, p.tx)))
})

function chartPoints(field) {
  const pts = data.value?.chart || []
  if (!pts.length) return []
  const maxV = chartMaxVal.value || 1
  const w = chartW - chartPad.l - chartPad.r
  const h = chartH - chartPad.t - chartPad.b
  return pts.map((p, i) => ({
    x: chartPad.l + (i / (pts.length - 1 || 1)) * w,
    y: chartPad.t + h - (p[field] / maxV) * h,
  }))
}

function linePath(field) {
  const pts = chartPoints(field)
  if (!pts.length) return ''
  return pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${d} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }, '')
}

function areaPath(field) {
  const pts = chartPoints(field)
  if (!pts.length) return ''
  const bottom = chartH - chartPad.b
  return `${linePath(field)} L${pts[pts.length - 1].x},${bottom} L${pts[0].x},${bottom} Z`
}

const chartXLabels = computed(() => {
  const pts = data.value?.chart || []
  if (!pts.length) return []
  const indices = [0, Math.floor(pts.length / 4), Math.floor(pts.length / 2), Math.floor(pts.length * 3 / 4), pts.length - 1]
  return indices.map(i => {
    const t = pts[i]?.time
    if (!t) return ''
    const d = new Date(t * 1000)
    return `${d.getHours()}:00`
  })
})

// ── Load ───────────────────────────────────────────────────────────────────
async function load() {
  loading.value = true
  error.value = null
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'get_traffic', org_id: selectedOrgId.value }),
      }
    )
    const r = await res.json()
    if (r.ok) data.value = r
    else error.value = r.error || 'Error desconocido'
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

onMounted(load)
</script>
