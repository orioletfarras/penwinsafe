<template>
  <div>
    <h1 class="text-2xl font-bold text-white mb-8">Informes semanales</h1>
    <div class="glass rounded-2xl divide-y divide-dark-700">
      <div v-for="r in reports" :key="r.id" class="p-5">
        <div class="flex items-center justify-between mb-3">
          <div>
            <p class="text-sm font-medium text-white">{{ r.devices?.name }}</p>
            <p class="text-xs text-dark-500">{{ r.week_start }} — {{ r.week_end }}</p>
          </div>
          <div class="flex items-center gap-3">
            <span :class="riskColor(r.risk_score)" class="text-xs font-semibold px-2 py-1 rounded-full">
              Riesgo {{ r.risk_score }}/100
            </span>
          </div>
        </div>
        <div class="text-sm text-gray-400 leading-relaxed bg-dark-800 rounded-xl p-4 whitespace-pre-wrap">{{ r.summary_md }}</div>
      </div>
      <div v-if="reports.length === 0" class="p-12 text-center text-dark-500 text-sm">
        Aún no hay informes generados. Se generan cada domingo automáticamente.
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const reports = ref([])

onMounted(async () => {
  const { data } = await supabase
    .from('weekly_reports')
    .select('*, devices(name)')
    .order('week_start', { ascending: false })
    .limit(20)
  reports.value = data || []
})

function riskColor(score) {
  if (score >= 70) return 'bg-red-500/10 text-red-400'
  if (score >= 40) return 'bg-yellow-500/10 text-yellow-400'
  return 'bg-green-500/10 text-green-400'
}
</script>
