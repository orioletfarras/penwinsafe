<template>
  <div>
    <div class="flex items-center justify-between mb-8">
      <h1 class="text-2xl font-bold text-white">Dispositivos</h1>
      <div class="flex items-center gap-2 text-sm text-dark-500">
        <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
        {{ onlineCount }} online
      </div>
    </div>

    <div class="glass rounded-2xl overflow-hidden">
      <table class="w-full">
        <thead class="border-b border-dark-600">
          <tr class="text-left text-xs text-dark-500 uppercase tracking-wider">
            <th class="px-6 py-4">Dispositivo</th>
            <th class="px-6 py-4">Grupo</th>
            <th class="px-6 py-4">Estado</th>
            <th class="px-6 py-4">Última actividad</th>
            <th class="px-6 py-4">Acciones</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-dark-700">
          <tr v-for="d in devices" :key="d.id" class="hover:bg-white/3 transition-colors">
            <td class="px-6 py-4">
              <div>
                <p class="text-sm font-medium text-white">{{ d.name }}</p>
                <p class="text-xs text-dark-500">{{ d.ip_address || '—' }}</p>
              </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-400">{{ d.groups?.name || '—' }}</td>
            <td class="px-6 py-4">
              <span :class="statusClass(d.status)" class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(d.status)"></span>
                {{ statusLabel(d.status) }}
              </span>
            </td>
            <td class="px-6 py-4 text-sm text-gray-400">
              {{ d.last_seen ? formatDate(d.last_seen) : 'Nunca' }}
            </td>
            <td class="px-6 py-4">
              <div class="flex items-center gap-2">
                <button
                  v-if="d.status === 'online'"
                  @click="watchLive(d)"
                  class="text-xs bg-brand-600/20 hover:bg-brand-600/30 text-brand-400 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Ver en vivo
                </button>
                <button
                  @click="toggleLock(d)"
                  :class="d.status === 'locked' ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400'"
                  class="text-xs px-3 py-1.5 rounded-lg transition-colors"
                >
                  {{ d.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="devices.length === 0">
            <td colspan="5" class="px-6 py-12 text-center text-dark-500 text-sm">
              No hay dispositivos registrados todavía
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const devices = ref([])

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length)

onMounted(async () => {
  const { data } = await supabase
    .from('devices')
    .select('*, groups(name)')
    .order('last_seen', { ascending: false })
  devices.value = data || []

  // Tiempo real
  supabase.channel('devices')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, (p) => {
      const idx = devices.value.findIndex(d => d.id === p.new.id)
      if (idx !== -1) devices.value[idx] = { ...devices.value[idx], ...p.new }
    })
    .subscribe()
})

async function toggleLock(device) {
  const newStatus = device.status === 'locked' ? 'offline' : 'locked'
  await supabase.from('devices').update({ status: newStatus }).eq('id', device.id)
  device.status = newStatus
}

function watchLive(device) {
  alert(`Vista en vivo de ${device.name} — próximamente con WebRTC`)
}

function statusClass(s) {
  return { online: 'bg-green-500/10 text-green-400', offline: 'bg-dark-600 text-dark-400', locked: 'bg-red-500/10 text-red-400' }[s]
}
function statusDot(s) {
  return { online: 'bg-green-400', offline: 'bg-dark-500', locked: 'bg-red-400' }[s]
}
function statusLabel(s) {
  return { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[s] || s
}
function formatDate(d) {
  return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}
</script>
