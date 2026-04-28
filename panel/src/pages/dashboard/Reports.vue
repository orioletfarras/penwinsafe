<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Informes semanales generados por IA</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Se generan automaticamente cada domingo para cada dispositivo</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="exportPDF" class="btn btn-secondary">
          <ArrowDownTrayIcon class="w-3.5 h-3.5" /> Exportar PDF
        </button>
        <button @click="generateNow" :disabled="generating" class="btn btn-primary">
          <SparklesIcon class="w-3.5 h-3.5" />
          {{ generating ? 'Generando...' : 'Generar ahora' }}
        </button>
      </div>
    </div>
    <p v-if="generateMsg" class="text-[12px] mt-2 text-right"
      :style="generateOk ? 'color:#16a34a' : 'color:#dc2626'">{{ generateMsg }}</p>

    <!-- Filtros -->
    <div class="flex items-center gap-2 flex-wrap">
      <select v-model="selectedGroup" @change="selectedDevice = ''"
        class="rounded px-2.5 py-1.5 text-[12px] focus:outline-none transition-colors"
        style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
        <option value="">Todas las clases</option>
        <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
      </select>
      <select v-model="selectedDevice"
        class="rounded px-2.5 py-1.5 text-[12px] focus:outline-none transition-colors"
        style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
        <option value="">Todos los dispositivos</option>
        <option v-for="d in (selectedGroup ? devices.filter(x => x.group_id === selectedGroup) : devices)" :key="d.id" :value="d.id">{{ d.name }}</option>
      </select>
    </div>

    <!-- Sin informes -->
    <div v-if="!loading && filteredReports.length === 0"
      class="card p-12 text-center">
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
      class="card overflow-hidden">

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
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { activeOrgId } from '../../lib/orgStore'
import { SparklesIcon, DocumentTextIcon, ChevronDownIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'

const reports        = ref([])
const devices        = ref([])
const groups         = ref([])
const selectedDevice = ref('')
const selectedGroup  = ref('')
const loading        = ref(true)
const generating     = ref(false)

const filteredReports = computed(() => {
  let r = reports.value
  if (selectedGroup.value) {
    const groupDeviceIds = devices.value.filter(d => d.group_id === selectedGroup.value).map(d => d.id)
    r = r.filter(rep => groupDeviceIds.includes(rep.device_id))
  }
  if (selectedDevice.value) r = r.filter(rep => rep.device_id === selectedDevice.value)
  return r
})

async function loadData() {
  loading.value = true
  const [{ data: reps }, { data: devs }, { data: grps }] = await Promise.all([
    supabase.from('weekly_reports').select('*, devices(name, group_id)').order('week_start', { ascending: false }).limit(50),
    supabase.from('devices').select('id, name, group_id').order('name'),
    supabase.from('groups').select('id, name').eq('org_id', activeOrgId.value).order('name'),
  ])
  reports.value = (reps || []).map(r => ({ ...r, _expanded: false }))
  devices.value = devs || []
  groups.value  = grps || []
  loading.value = false
}

onMounted(loadData)
watch(activeOrgId, () => { selectedDevice.value = ''; selectedGroup.value = ''; loadData() })

const generateMsg = ref('')
const generateOk  = ref(false)

async function generateNow() {
  generating.value = true
  generateMsg.value = ''
  try {
    const { data, error } = await supabase.functions.invoke('weekly-report', { method: 'POST' })
    if (error) throw new Error(error.message)
    const count = data?.generated ?? 0
    generateOk.value = true
    generateMsg.value = count > 0
      ? `${count} informe(s) generado(s) correctamente`
      : 'No hay datos suficientes para generar informes esta semana'
    const { data: reps } = await supabase.from('weekly_reports').select('*, devices(name, group_id)').order('week_start', { ascending: false }).limit(50)
    reports.value = (reps || []).map(r => ({ ...r, _expanded: false }))
  } catch (e) {
    generateOk.value = false
    generateMsg.value = `Error: ${e.message}`
  } finally {
    generating.value = false
  }
}

function exportPDF() {
  const reps = filteredReports.value
  if (!reps.length) return

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Informes PenwinSafe</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #111827; padding: 32px; max-width: 780px; margin: 0 auto; }
    h1 { font-size: 20px; margin-bottom: 4px; }
    .sub { color: #6b7280; font-size: 13px; margin-bottom: 32px; }
    .report { border: 1px solid #e5e7eb; border-radius: 8px; margin-bottom: 24px; page-break-inside: avoid; }
    .report-header { padding: 14px 18px; border-bottom: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
    .device-name { font-size: 14px; font-weight: 600; }
    .period { font-size: 12px; color: #6b7280; margin-top: 2px; }
    .badge { font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 4px; }
    .risk-low { background: #f0fdf4; color: #15803d; }
    .risk-mid { background: #fffbeb; color: #b45309; }
    .risk-high { background: #fef2f2; color: #dc2626; }
    .summary { padding: 16px 18px; font-size: 12px; line-height: 1.7; color: #374151; white-space: pre-wrap; }
    .cats { padding: 8px 18px; border-top: 1px solid #f3f4f6; display: flex; gap: 6px; flex-wrap: wrap; }
    .cat { font-size: 10px; padding: 2px 6px; border-radius: 4px; background: #eff6ff; color: #2563eb; }
    @media print { body { padding: 16px } }
  </style></head><body>
  <h1>Informes semanales — PenwinSafe</h1>
  <p class="sub">Generado el ${new Date().toLocaleDateString('es-ES', { dateStyle: 'long' })}</p>
  ${reps.map(r => `
  <div class="report">
    <div class="report-header">
      <div>
        <div class="device-name">${r.devices?.name || '—'}</div>
        <div class="period">Semana del ${formatDate(r.week_start)} al ${formatDate(r.week_end)}</div>
      </div>
      <span class="badge ${r.risk_score >= 70 ? 'risk-high' : r.risk_score >= 40 ? 'risk-mid' : 'risk-low'}">Riesgo ${r.risk_score}/100</span>
    </div>
    ${r.top_categories && Object.keys(r.top_categories).length ? `<div class="cats">${Object.entries(r.top_categories).map(([c,n]) => `<span class="cat">${c}: ${n}</span>`).join('')}</div>` : ''}
    <div class="summary">${r.summary_md || 'Sin resumen disponible'}</div>
  </div>`).join('')}
  </body></html>`

  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  win.onload = () => win.print()
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
