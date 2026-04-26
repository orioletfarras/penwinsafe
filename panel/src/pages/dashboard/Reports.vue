<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Informes semanales generados por IA</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Se generan automaticamente cada domingo para cada dispositivo</p>
      </div>
      <button @click="generateNow" :disabled="generating"
        class="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 rounded transition-colors disabled:opacity-50"
        style="background:#006fff;color:#ffffff;border:1px solid #006fff">
        <SparklesIcon class="w-3.5 h-3.5" />
        {{ generating ? 'Generando...' : 'Generar ahora' }}
      </button>
    </div>

    <!-- Filtro por dispositivo -->
    <div>
      <select v-model="selectedDevice"
        class="rounded px-2.5 py-1.5 text-[12px] focus:outline-none transition-colors"
        style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
        <option value="">Todos los dispositivos</option>
        <option v-for="d in devices" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <!-- Sin informes -->
    <div v-if="!loading && filteredReports.length === 0"
      class="rounded p-12 text-center" style="background:#ffffff;border:1px solid #e5e7eb">
      <DocumentTextIcon class="w-7 h-7 mx-auto mb-3" style="color:#9ca3af" />
      <p class="text-[13px] font-medium mb-1" style="color:#111827">Sin informes aun</p>
      <p class="text-[12px]" style="color:#6b7280">Los informes se generan cada domingo o puedes generarlos manualmente.</p>
    </div>

    <!-- Skeleton loading -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="rounded h-14 animate-pulse" style="background:#f9fafb;border:1px solid #e5e7eb"></div>
    </div>

    <!-- Lista de informes -->
    <div v-for="r in filteredReports" :key="r.id"
      class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">

      <!-- Report header row -->
      <div class="px-4 py-3 flex items-center justify-between"
        style="border-bottom:1px solid #e5e7eb">
        <div>
          <p class="text-[13px] font-semibold" style="color:#111827">{{ r.devices?.name }}</p>
          <p class="text-[11px] mt-0.5" style="color:#6b7280">
            Semana del {{ formatDate(r.week_start) }} al {{ formatDate(r.week_end) }}
          </p>
        </div>
        <div class="flex items-center gap-2.5">
          <span class="text-[11px] font-semibold px-2 py-0.5 rounded" :class="riskStyle(r.risk_score)">
            Riesgo {{ r.risk_score }}/100
          </span>
          <button @click="r._expanded = !r._expanded"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#6b7280"
            onmouseenter="this.style.background='#f9fafb'"
            onmouseleave="this.style.background='transparent'">
            <ChevronDownIcon class="w-3.5 h-3.5 transition-transform" :class="r._expanded ? 'rotate-180' : ''" />
          </button>
        </div>
      </div>

      <!-- Categorias -->
      <div v-if="r.top_categories && Object.keys(r.top_categories).length"
        class="px-4 py-2.5 flex flex-wrap gap-1.5" style="border-bottom:1px solid #f3f4f6">
        <span v-for="(count, cat) in r.top_categories" :key="cat"
          class="text-[10px] px-1.5 py-0.5 rounded"
          style="background:#eff6ff;border:1px solid #bfdbfe;color:#2563eb">
          {{ cat }}: {{ count }}
        </span>
      </div>

      <!-- Resumen IA expandido -->
      <div v-if="r._expanded" class="px-4 py-4">
        <div class="flex items-center gap-1.5 mb-2.5" style="padding-bottom:8px;border-bottom:1px solid #f3f4f6">
          <SparklesIcon class="w-3 h-3" style="color:#7c3aed" />
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Analisis generado por IA</p>
        </div>
        <div class="text-[12px] leading-relaxed whitespace-pre-wrap" style="color:#6b7280">{{ r.summary_md }}</div>
      </div>
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
  if (score >= 70) return 'bg-red-50 text-red-600 border border-red-200'
  if (score >= 40) return 'bg-yellow-50 text-yellow-700 border border-yellow-200'
  return 'bg-green-50 text-green-700 border border-green-200'
}

function formatDate(d) {
  return new Date(d).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}
</script>
