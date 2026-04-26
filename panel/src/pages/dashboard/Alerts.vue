<template>
  <div class="space-y-4">

    <!-- Header con stats -->
    <div class="grid grid-cols-4 gap-3">
      <div v-for="s in alertStats" :key="s.label"
        class="rounded-xl border border-white/6 px-4 py-3 flex items-center gap-3" style="background:#0d1117">
        <div class="w-2 h-2 rounded-full flex-shrink-0" :class="s.dot"></div>
        <div>
          <p class="text-lg font-black text-white">{{ s.count }}</p>
          <p class="text-[11px] text-gray-600">{{ s.label }}</p>
        </div>
      </div>
    </div>

    <!-- Lista de alertas -->
    <div class="rounded-xl border border-white/6 overflow-hidden" style="background:#0d1117">
      <div class="px-5 py-4 border-b border-white/6 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <SparklesIcon class="w-4 h-4 text-purple-400" />
          <h2 class="text-sm font-semibold text-white">Alertas generadas por IA</h2>
        </div>
        <label class="flex items-center gap-2 text-xs text-gray-500 cursor-pointer">
          <input type="checkbox" v-model="showResolved" class="rounded" />
          Mostrar resueltas
        </label>
      </div>

      <div class="divide-y divide-white/4">
        <div v-for="a in filteredAlerts" :key="a.id"
          class="px-5 py-4 hover:bg-white/2 transition-colors"
          :class="a.resolved ? 'opacity-40' : ''">
          <div class="flex items-start gap-4">
            <!-- Severity indicator -->
            <div class="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center" :class="severityBg(a.severity)">
              <component :is="severityIcon(a.severity)" class="w-4 h-4" :class="severityIconColor(a.severity)" />
            </div>

            <div class="flex-1 min-w-0">
              <div class="flex items-start justify-between gap-3 mb-1">
                <p class="text-sm font-semibold text-white">{{ a.message }}</p>
                <span class="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md flex-shrink-0" :class="severityPill(a.severity)">
                  {{ a.severity }}
                </span>
              </div>

              <!-- IA summary destacado -->
              <div v-if="a.ai_summary" class="mt-2 p-3 rounded-lg border border-purple-400/15 bg-purple-400/5 flex gap-2">
                <SparklesIcon class="w-3.5 h-3.5 text-purple-400 flex-shrink-0 mt-0.5" />
                <p class="text-xs text-gray-300 leading-relaxed italic">{{ a.ai_summary }}</p>
              </div>

              <div class="flex items-center justify-between mt-2">
                <p class="text-[11px] text-gray-600">{{ formatDate(a.created_at) }}</p>
                <button v-if="!a.resolved" @click="resolve(a)"
                  class="text-[11px] font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 border border-brand-500/20 px-2.5 py-1 rounded-lg transition-all">
                  Marcar como resuelta
                </button>
                <span v-else class="text-[11px] text-gray-600">✓ Resuelta</span>
              </div>
            </div>
          </div>
        </div>
        <div v-if="filteredAlerts.length === 0" class="px-5 py-12 text-center text-sm text-gray-600">
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
  { label: 'Críticas',  count: alerts.value.filter(a => a.severity === 'critical' && !a.resolved).length, dot: 'bg-red-500' },
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

function severityBg(s)        { return { info: 'bg-blue-500/10', warning: 'bg-yellow-500/10', danger: 'bg-orange-500/10', critical: 'bg-red-500/15' }[s] }
function severityIconColor(s) { return { info: 'text-blue-400', warning: 'text-yellow-400', danger: 'text-orange-400', critical: 'text-red-400' }[s] }
function severityPill(s)      { return { info: 'bg-blue-500/10 text-blue-400', warning: 'bg-yellow-500/10 text-yellow-300', danger: 'bg-orange-500/10 text-orange-400', critical: 'bg-red-500/15 text-red-400' }[s] }
function severityIcon(s)      { return { info: InformationCircleIcon, warning: ExclamationTriangleIcon, danger: ExclamationCircleIcon, critical: FireIcon }[s] || ExclamationTriangleIcon }
function formatDate(d)        { return new Date(d).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' }) }
</script>
