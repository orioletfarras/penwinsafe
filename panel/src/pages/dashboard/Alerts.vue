<template>
  <div>
    <h1 class="text-2xl font-bold text-white mb-8">Alertas</h1>

    <div class="glass rounded-2xl divide-y divide-dark-700">
      <div v-for="alert in alerts" :key="alert.id"
        class="p-5 flex gap-4 hover:bg-white/3 transition-colors"
        :class="alert.resolved ? 'opacity-50' : ''"
      >
        <div :class="severityBadge(alert.severity)" class="flex-shrink-0 w-2 self-stretch rounded-full"></div>
        <div class="flex-1 min-w-0">
          <div class="flex items-start justify-between gap-4">
            <p class="text-sm font-medium text-white">{{ alert.message }}</p>
            <span :class="severityPill(alert.severity)" class="text-xs px-2 py-0.5 rounded-full flex-shrink-0">
              {{ alert.severity }}
            </span>
          </div>
          <p v-if="alert.ai_summary" class="text-sm text-gray-400 mt-1">{{ alert.ai_summary }}</p>
          <p class="text-xs text-dark-500 mt-2">{{ formatDate(alert.created_at) }}</p>
        </div>
        <button
          v-if="!alert.resolved"
          @click="resolve(alert)"
          class="flex-shrink-0 text-xs text-brand-400 hover:text-brand-300 transition-colors self-start"
        >
          Resolver
        </button>
      </div>
      <div v-if="alerts.length === 0" class="p-12 text-center text-dark-500 text-sm">
        Sin alertas
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const alerts = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('alerts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)
  alerts.value = data || []
})

async function resolve(alert) {
  await supabase.from('alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', alert.id)
  alert.resolved = true
}

function severityBadge(s) {
  return { info: 'bg-blue-400', warning: 'bg-yellow-400', danger: 'bg-orange-400', critical: 'bg-red-500' }[s]
}
function severityPill(s) {
  return { info: 'bg-blue-500/10 text-blue-400', warning: 'bg-yellow-500/10 text-yellow-400', danger: 'bg-orange-500/10 text-orange-400', critical: 'bg-red-500/10 text-red-400' }[s]
}
function formatDate(d) {
  return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
