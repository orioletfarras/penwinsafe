<template>
  <div class="space-y-3">

    <!-- Skeleton -->
    <template v-if="loading">
      <div class="grid grid-cols-4 gap-3">
        <div v-for="i in 4" :key="i" class="card px-3 py-3 flex items-center gap-3">
          <Skeleton height="8px" width="8px" class-name="rounded-full flex-shrink-0" />
          <div class="space-y-1.5 flex-1"><Skeleton height="20px" width="40px" /><Skeleton height="10px" width="60px" /></div>
        </div>
      </div>
      <div class="card overflow-hidden">
        <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5"><Skeleton height="12px" width="160px" /></div>
        <div class="p-4 space-y-3"><Skeleton v-for="i in 5" :key="i" height="64px" /></div>
      </div>
    </template>

    <template v-else>
    <!-- Stat strip -->
    <div class="grid grid-cols-4 gap-3">
      <div v-for="s in alertStats" :key="s.label"
        class="card px-3 py-3 flex items-center gap-3">
        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="s.dot"></span>
        <div>
          <p class="text-[20px] font-bold leading-none" style="color:#111827">{{ s.count }}</p>
          <p class="text-[10px] mt-0.5" style="color:#6b7280">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Lista de alertas -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #f0f2f5">
        <div class="flex items-center gap-1.5">
          <SparklesIcon class="w-3 h-3" style="color:#7c3aed" />
          <p class="section-label">Alertas generadas por IA</p>
        </div>
        <div class="flex items-center gap-3">
          <label class="flex items-center gap-2 text-[11px] cursor-pointer" style="color:#6b7280">
            <input type="checkbox" v-model="showResolved" class="rounded" style="accent-color:#006fff" />
            Mostrar resueltas
          </label>
          <button @click="exportCSV" class="btn btn-secondary btn-sm">
            <ArrowDownTrayIcon class="w-3 h-3" /> Exportar CSV
          </button>
        </div>
      </div>

      <div>
        <TransitionGroup name="alert-row" tag="div">
        <div v-for="a in pagedAlerts" :key="a.id"
          class="px-4 py-3 transition-colors"
          :style="[
            'border-bottom:1px solid #f3f4f6',
            a.resolved ? 'opacity:0.45' : ''
          ].join(';')"
          onmouseenter="this.style.background='#f9fafb'"
          onmouseleave="this.style.background='transparent'">
          <div class="flex items-start gap-3">
            <!-- Severity icon -->
            <div class="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center mt-0.5" :class="severityBg(a.severity)">
              <component :is="severityIcon(a.severity)" class="w-3.5 h-3.5" :class="severityIconColor(a.severity)" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 mb-1">
                <p class="text-[12px] font-medium leading-snug" style="color:#111827">{{ a.message }}</p>
                <span class="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" :class="severityPill(a.severity)">
                  {{ a.severity }}
                </span>
              </div>

              <!-- AI summary -->
              <div v-if="a.ai_summary" class="mt-1.5 px-2.5 py-2 rounded flex gap-1.5" style="background:#f5f3ff;border:1px solid #e9d5ff">
                <SparklesIcon class="w-3 h-3 flex-shrink-0 mt-0.5" style="color:#7c3aed" />
                <p class="text-[11px] leading-relaxed" style="color:#7c3aed;font-style:italic">{{ a.ai_summary }}</p>
              </div>

              <div class="flex items-center justify-between mt-2">
                <p class="text-[10px]" style="color:#9ca3af">{{ formatDate(a.created_at) }}</p>
                <button v-if="!a.resolved" @click="resolve(a)" class="btn btn-secondary btn-sm">
                  Marcar como resuelta
                </button>
                <span v-else class="text-[10px]" style="color:#9ca3af">
                  Resuelta{{ a.resolved_by ? ` por ${a.resolved_by.split('@')[0]}` : '' }}
                  {{ a.resolved_at ? '· ' + formatDate(a.resolved_at) : '' }}
                </span>
              </div>
            </div>
          </div>
        </div>
        </TransitionGroup>
        <div v-if="filteredAlerts.length === 0" class="empty-state">
          <div class="empty-state-icon"><SparklesIcon /></div>
          <p class="empty-state-title">Sin alertas pendientes</p>
          <p class="empty-state-desc">Cuando se detecte actividad sospechosa aparecerá aquí.</p>
        </div>
        <Pagination v-if="filteredAlerts.length > PAGE_SIZE"
          :model-value="alertPage" :total="filteredAlerts.length" :per-page="PAGE_SIZE"
          @change="alertPage = $event" />
      </div>
    </div>
    </template> <!-- end v-else -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/audit'
let currentUserEmail = ''
import { SparklesIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon, FireIcon, ArrowDownTrayIcon } from '@heroicons/vue/24/outline'
import Pagination from '../../components/Pagination.vue'
import Skeleton from '../../components/Skeleton.vue'
import { useToast } from '../../lib/toast'

const { error: toastError, success: toastSuccess } = useToast()

const loading      = ref(true)
const alerts       = ref([])
const showResolved = ref(false)
const alertPage    = ref(1)
const PAGE_SIZE    = 15

const filteredAlerts = computed(() =>
  alerts.value.filter(a => showResolved.value || !a.resolved)
)

watch(() => showResolved.value, () => { alertPage.value = 1 })

const pagedAlerts = computed(() => {
  const start = (alertPage.value - 1) * PAGE_SIZE
  return filteredAlerts.value.slice(start, start + PAGE_SIZE)
})

const alertStats = computed(() => [
  { label: 'Criticas',  count: alerts.value.filter(a => a.severity === 'critical' && !a.resolved).length, dot: 'bg-red-500' },
  { label: 'Peligro',   count: alerts.value.filter(a => a.severity === 'danger'   && !a.resolved).length, dot: 'bg-orange-400' },
  { label: 'Aviso',     count: alerts.value.filter(a => a.severity === 'warning'  && !a.resolved).length, dot: 'bg-yellow-400' },
  { label: 'Resueltas', count: alerts.value.filter(a => a.resolved).length, dot: 'bg-green-500' },
])

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  currentUserEmail = user?.email || user?.id || 'admin'

  const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50)
  alerts.value = data || []
  loading.value = false

  supabase.channel('alerts-rt')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, p => {
      alerts.value.unshift(p.new)
    })
    .subscribe()
})

function exportCSV() {
  const rows = [['Fecha', 'Severidad', 'Mensaje', 'Resumen IA', 'Resuelta']]
  filteredAlerts.value.forEach(a => {
    rows.push([
      new Date(a.created_at).toLocaleString('es-ES'),
      a.severity,
      `"${a.message?.replace(/"/g, '""')}"`,
      `"${(a.ai_summary || '').replace(/"/g, '""')}"`,
      a.resolved ? 'Sí' : 'No',
    ])
  })
  const csv = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `alertas_${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}

async function resolve(alert) {
  const now = new Date().toISOString()
  const { error } = await supabase.from('alerts').update({ resolved: true, resolved_at: now, resolved_by: currentUserEmail }).eq('id', alert.id)
  if (error) { toastError('Error al resolver alerta: ' + error.message); return }
  alert.resolved = true
  alert.resolved_at = now
  alert.resolved_by = currentUserEmail
  logAction('alert_resolve', alert.message?.slice(0, 60))
  toastSuccess('Alerta marcada como resuelta')
}

function severityBg(s)        { return { info: 'bg-blue-50', warning: 'bg-yellow-50', danger: 'bg-orange-50', critical: 'bg-red-50' }[s] }
function severityIconColor(s) { return { info: 'text-blue-500', warning: 'text-yellow-500', danger: 'text-orange-500', critical: 'text-red-500' }[s] }
function severityPill(s)      { return { info: 'bg-blue-50 text-blue-600 border border-blue-200', warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200', danger: 'bg-orange-50 text-orange-600 border border-orange-200', critical: 'bg-red-50 text-red-600 border border-red-200' }[s] }
function severityIcon(s)      { return { info: InformationCircleIcon, warning: ExclamationTriangleIcon, danger: ExclamationCircleIcon, critical: FireIcon }[s] || ExclamationTriangleIcon }
function formatDate(d)        { return new Date(d).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }
</script>

<style scoped>
.alert-row-leave-active {
  transition: opacity 0.3s ease, max-height 0.3s ease, padding 0.3s ease;
  overflow: hidden;
  max-height: 200px;
}
.alert-row-leave-to {
  opacity: 0;
  max-height: 0;
  padding-top: 0;
  padding-bottom: 0;
}
.alert-row-enter-active {
  transition: opacity 0.2s ease;
}
.alert-row-enter-from {
  opacity: 0;
}
</style>
