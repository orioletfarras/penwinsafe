<template>
  <div>
    <h1 class="text-2xl font-bold text-white mb-8">Resumen general</h1>

    <!-- Stats -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div v-for="stat in stats" :key="stat.label" class="glass rounded-2xl p-5">
        <div class="text-2xl mb-2">{{ stat.icon }}</div>
        <div class="text-2xl font-bold text-white">{{ stat.value }}</div>
        <div class="text-sm text-gray-500 mt-1">{{ stat.label }}</div>
      </div>
    </div>

    <!-- Grid 2 cols -->
    <div class="grid lg:grid-cols-2 gap-6">
      <!-- Dispositivos online -->
      <div class="glass rounded-2xl p-6">
        <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
          <span>🖥️</span> Dispositivos activos
        </h2>
        <div class="space-y-3">
          <div v-for="d in onlineDevices" :key="d.id" class="flex items-center justify-between py-2 border-b border-dark-600 last:border-0">
            <div>
              <p class="text-sm text-white font-medium">{{ d.name }}</p>
              <p class="text-xs text-dark-500">{{ d.ip_address || 'IP desconocida' }}</p>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span class="text-xs text-green-400">Online</span>
            </div>
          </div>
          <p v-if="onlineDevices.length === 0" class="text-sm text-dark-500 text-center py-4">
            Ningún dispositivo conectado ahora mismo
          </p>
        </div>
      </div>

      <!-- Alertas recientes -->
      <div class="glass rounded-2xl p-6">
        <h2 class="font-semibold text-white mb-4 flex items-center gap-2">
          <span>🔔</span> Alertas recientes
        </h2>
        <div class="space-y-3">
          <div v-for="alert in recentAlerts" :key="alert.id" class="flex gap-3 py-2 border-b border-dark-600 last:border-0">
            <span :class="severityDot(alert.severity)" class="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"></span>
            <div>
              <p class="text-sm text-white">{{ alert.message }}</p>
              <p class="text-xs text-dark-500 mt-0.5">{{ formatDate(alert.created_at) }}</p>
            </div>
          </div>
          <p v-if="recentAlerts.length === 0" class="text-sm text-dark-500 text-center py-4">
            Sin alertas recientes
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const stats = ref([
  { icon: '🖥️', value: '—', label: 'Dispositivos totales' },
  { icon: '🟢', value: '—', label: 'Online ahora' },
  { icon: '🔔', value: '—', label: 'Alertas sin resolver' },
  { icon: '🔍', value: '—', label: 'Búsquedas hoy' },
])

const onlineDevices = ref([])
const recentAlerts = ref([])

onMounted(async () => {
  const [
    { count: total },
    { count: online },
    { count: unresolved },
    { count: searches },
    { data: devices },
    { data: alerts }
  ] = await Promise.all([
    supabase.from('devices').select('*', { count: 'exact', head: true }),
    supabase.from('devices').select('*', { count: 'exact', head: true }).eq('status', 'online'),
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('search_events').select('*', { count: 'exact', head: true })
      .gte('searched_at', new Date().toISOString().split('T')[0]),
    supabase.from('devices').select('id, name, ip_address').eq('status', 'online').limit(5),
    supabase.from('alerts').select('id, message, severity, created_at').eq('resolved', false)
      .order('created_at', { ascending: false }).limit(5),
  ])

  stats.value[0].value = total ?? 0
  stats.value[1].value = online ?? 0
  stats.value[2].value = unresolved ?? 0
  stats.value[3].value = searches ?? 0
  onlineDevices.value = devices || []
  recentAlerts.value = alerts || []
})

function severityDot(s) {
  return { info: 'bg-blue-400', warning: 'bg-yellow-400', danger: 'bg-orange-400', critical: 'bg-red-500' }[s] || 'bg-gray-400'
}

function formatDate(d) {
  return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
