<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-sm font-semibold text-white">Informes semanales generados por IA</h2>
        <p class="text-xs mt-0.5" style="color:#6b7280">Se generan automáticamente cada domingo para cada dispositivo</p>
      </div>
      <button @click="generateNow" :disabled="generating"
        class="flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
        style="background:rgba(37,99,235,0.15);border:1px solid rgba(37,99,235,0.25);color:#93c5fd">
        <SparklesIcon class="w-4 h-4" />
        {{ generating ? 'Generando...' : 'Generar ahora' }}
      </button>
    </div>

    <!-- Filtro por dispositivo -->
    <div class="flex items-center gap-3">
      <select v-model="selectedDevice"
        class="px-3 py-2 rounded-lg text-sm text-white focus:outline-none transition-colors"
        style="background:#0b0e16;border:1px solid rgba(255,255,255,0.08);color:#9ca3af">
        <option value="">Todos los dispositivos</option>
        <option v-for="d in devices" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <!-- Sin informes -->
    <div v-if="!loading && filteredReports.length === 0"
      class="rounded-xl border border-white/6 p-12 text-center" style="background:#0b0e16">
      <DocumentTextIcon class="w-8 h-8 mx-auto mb-3" style="color:#374151" />
      <p class="text-sm font-medium text-white mb-1">Sin informes aún</p>
      <p class="text-xs" style="color:#6b7280">Los informes se generan cada domingo o puedes generarlos manualmente.</p>
    </div>

    <!-- Lista de informes -->
    <div v-for="r in filteredReports" :key="r.id"
      class="rounded-xl border border-white/6 overflow-hidden" style="background:#0b0e16">
      <div class="px-5 py-4 border-b border-white/6 flex items-center justify-between"
        style="border-bottom-color:rgba(255,255,255,0.06)">
        <div>
          <p class="text-sm font-semibold text-white">{{ r.devices?.name }}</p>
          <p class="text-xs mt-0.5" style="color:#6b7280">Semana del {{ formatDate(r.week_start) }} al {{ formatDate(r.week_end) }}</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="text-xs font-semibold px-2.5 py-1 rounded-lg" :class="riskStyle(r.risk_score)">
            Riesgo {{ r.risk_score }}/100
          </div>
          <button @click="r._expanded = !r._expanded"
            class="w-7 h-7 flex items-center justify-center rounded-lg transition-colors hover:bg-white/5">
            <ChevronDownIcon class="w-4 h-4 transition-transform" :class="r._expanded ? 'rotate-180' : ''" style="color:#6b7280" />
          </button>
        </div>
      </div>

      <!-- Categorías -->
      <div v-if="r.top_categories && Object.keys(r.top_categories).length" class="px-5 py-3 flex flex-wrap gap-2 border-b border-white/4">
        <span v-for="(count, cat) in r.top_categories" :key="cat"
          class="text-[11px] px-2 py-0.5 rounded-full"
          style="background:rgba(37,99,235,0.1);border:1px solid rgba(37,99,235,0.2);color:#93c5fd">
          {{ cat }}: {{ count }}
        </span>
      </div>

      <!-- Resumen IA expandido -->
      <div v-if="r._expanded" class="px-5 py-4">
        <div class="flex items-center gap-2 mb-3">
          <SparklesIcon class="w-3.5 h-3.5" style="color:#a78bfa" />
          <span class="text-xs font-semibold" style="color:#a78bfa">Análisis generado por IA</span>
        </div>
        <div class="text-sm leading-relaxed whitespace-pre-wrap" style="color:#d1d5db">{{ r.summary_md }}</div>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div v-for="i in 3" :key="i" class="rounded-xl border border-white/6 h-16 animate-pulse" style="background:#0b0e16"></div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { SparklesIcon, DocumentTextIcon, ChevronDownIcon } from '@heroicons/vue/24/outline'

const reports        = ref([])
const devices        = ref([])
const selectedDevice = ref('')
const loading        = ref(true)
const generating     = ref(false)

const filteredReports = computed(() =>
  selectedDevice.value
    ? reports.value.filter(r => r.device_id === selectedDevice.value)
    : reports.value
)

onMounted(async () => {
  const [{ data: reps }, { data: devs }] = await Promise.all([
    supabase.from('weekly_reports').select('*, devices(name)').order('week_start', { ascending: false }).limit(30),
    supabase.from('devices').select('id, name').order('name'),
  ])
  reports.value  = (reps || []).map(r => ({ ...r, _expanded: false }))
  devices.value  = devs || []
  loading.value  = false
})

async function generateNow() {
  generating.value = true
  try {
    await supabase.functions.invoke('weekly-report', { method: 'POST' })
    const { data } = await supabase.from('weekly_reports').select('*, devices(name)').order('week_start', { ascending: false }).limit(30)
    reports.value = (data || []).map(r => ({ ...r, _expanded: false }))
  } finally {
    generating.value = false
  }
}

function riskStyle(score) {
  if (score >= 70) return 'bg-red-500/10 text-red-400'
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-300'
  return 'bg-green-500/10 text-green-400'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}
</script>
