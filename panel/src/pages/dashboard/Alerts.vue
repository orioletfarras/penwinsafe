<template>
  <div class="space-y-3">

    <!-- Stat strip -->
    <div class="grid grid-cols-4 gap-3">
      <div v-for="s in alertStats" :key="s.label"
        class="rounded px-3 py-2.5 flex items-center gap-3"
        style="background:#ffffff;border:1px solid #e5e7eb">
        <span class="w-2 h-2 rounded-full flex-shrink-0" :class="s.dot"></span>
        <div>
          <p class="text-[20px] font-bold leading-none" style="color:#111827">{{ s.count }}</p>
          <p class="text-[10px] mt-0.5" style="color:#6b7280">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Lista de alertas -->
    <div class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-1.5">
          <SparklesIcon class="w-3 h-3" style="color:#7c3aed" />
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Alertas generadas por IA</p>
        </div>
        <label class="flex items-center gap-2 text-[11px] cursor-pointer" style="color:#6b7280">
          <input type="checkbox" v-model="showResolved" class="rounded" style="accent-color:#006fff" />
          Mostrar resueltas
        </label>
      </div>

      <div>
        <div v-for="a in filteredAlerts" :key="a.id"
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
                <button v-if="!a.resolved" @click="resolve(a)"
                  class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                  style="color:#006fff;background:#ffffff;border:1px solid #e5e7eb">
                  Marcar como resuelta
                </button>
                <span v-else class="text-[10px]" style="color:#9ca3af">Resuelta</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredAlerts.length === 0" class="px-4 py-12 text-center text-[12px]" style="color:#9ca3af">
          Sin alertas pendientes
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { SparklesIcon, ExclamationTriangleIcon, ExclamationCircleIcon, InformationCircleIcon, FireIcon } from '@heroicons/vue/24/outline'

const alerts       = ref([])
const showResolved = ref(false)

const filteredAlerts = computed(() =>
  alerts.value.filter(a => showResolved.value || !a.resolved)
)

const alertStats = computed(() => [
  { label: 'Criticas',  count: alerts.value.filter(a => a.severity === 'critical' && !a.resolved).length, dot: 'bg-red-500' },
  { label: 'Peligro',   count: alerts.value.filter(a => a.severity === 'danger'   && !a.resolved).length, dot: 'bg-orange-400' },
  { label: 'Aviso',     count: alerts.value.filter(a => a.severity === 'warning'  && !a.resolved).length, dot: 'bg-yellow-400' },
  { label: 'Resueltas', count: alerts.value.filter(a => a.resolved).length, dot: 'bg-green-500' },
])

onMounted(async () => {
  const { data } = await supabase.from('alerts').select('*').order('created_at', { ascending: false }).limit(50)
  alerts.value = data || []
})

async function resolve(alert) {
  await supabase.from('alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', alert.id)
  alert.resolved = true
}

function severityBg(s)        { return { info: 'bg-blue-50', warning: 'bg-yellow-50', danger: 'bg-orange-50', critical: 'bg-red-50' }[s] }
function severityIconColor(s) { return { info: 'text-blue-500', warning: 'text-yellow-500', danger: 'text-orange-500', critical: 'text-red-500' }[s] }
function severityPill(s)      { return { info: 'bg-blue-50 text-blue-600 border border-blue-200', warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200', danger: 'bg-orange-50 text-orange-600 border border-orange-200', critical: 'bg-red-50 text-red-600 border border-red-200' }[s] }
function severityIcon(s)      { return { info: InformationCircleIcon, warning: ExclamationTriangleIcon, danger: ExclamationCircleIcon, critical: FireIcon }[s] || ExclamationTriangleIcon }
function formatDate(d)        { return new Date(d).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }
</script>
