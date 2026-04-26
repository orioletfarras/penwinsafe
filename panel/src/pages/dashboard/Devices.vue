<template>
  <div class="space-y-4">

    <!-- Filtros -->
    <div class="flex items-center gap-3">
      <div class="flex-1 relative">
        <MagnifyingGlassIcon class="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
        <input v-model="search" type="text" placeholder="Buscar dispositivo..."
          class="w-full pl-9 pr-4 py-2 bg-white/4 border border-white/8 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-brand-500 transition-colors" />
      </div>
      <select v-model="filterStatus"
        class="bg-white/4 border border-white/8 rounded-lg px-3 py-2 text-sm text-gray-400 focus:outline-none focus:border-brand-500 transition-colors">
        <option value="">Todos los estados</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="locked">Bloqueado</option>
      </select>
      <div class="flex items-center gap-1.5 text-xs text-gray-500 bg-white/4 border border-white/8 px-3 py-2 rounded-lg">
        <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
        {{ onlineCount }} online
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded-xl border border-white/6 overflow-hidden" style="background:#0d1117">
      <table class="w-full">
        <thead>
          <tr class="border-b border-white/6">
            <th class="text-left px-5 py-3 text-[11px] uppercase tracking-widest text-gray-600 font-semibold">Dispositivo</th>
            <th class="text-left px-5 py-3 text-[11px] uppercase tracking-widest text-gray-600 font-semibold">Aula</th>
            <th class="text-left px-5 py-3 text-[11px] uppercase tracking-widest text-gray-600 font-semibold">Estado</th>
            <th class="text-left px-5 py-3 text-[11px] uppercase tracking-widest text-gray-600 font-semibold">Última actividad</th>
            <th class="text-left px-5 py-3 text-[11px] uppercase tracking-widest text-gray-600 font-semibold">IP</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody class="divide-y divide-white/4">
          <tr v-for="d in filteredDevices" :key="d.id" class="hover:bg-white/2 transition-colors">
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-3">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  :class="d.status === 'online' ? 'bg-green-500/10' : d.status === 'locked' ? 'bg-red-500/10' : 'bg-white/5'">
                  <ComputerDesktopIcon class="w-3.5 h-3.5"
                    :class="d.status === 'online' ? 'text-green-400' : d.status === 'locked' ? 'text-red-400' : 'text-gray-600'" />
                </div>
                <div>
                  <p class="text-sm font-medium text-white">{{ d.name }}</p>
                  <p class="text-[11px] text-gray-600">{{ d.os_info || 'Windows' }}</p>
                </div>
              </div>
            </td>
            <td class="px-5 py-3.5">
              <span class="text-xs text-gray-400 bg-white/5 border border-white/8 px-2 py-1 rounded-md">{{ d.groups?.name || '—' }}</span>
            </td>
            <td class="px-5 py-3.5">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(d.status)"></span>
                <span class="text-xs font-medium" :class="statusText(d.status)">{{ statusLabel(d.status) }}</span>
              </div>
            </td>
            <td class="px-5 py-3.5 text-xs text-gray-500">
              {{ d.last_seen ? timeAgo(d.last_seen) : 'Nunca' }}
            </td>
            <td class="px-5 py-3.5 text-xs text-gray-600 font-mono">{{ d.ip_address || '—' }}</td>
            <td class="px-5 py-3.5">
              <div class="flex items-center justify-end gap-2">
                <button v-if="d.status === 'online'" @click="watchLive(d)"
                  class="text-[11px] font-medium text-brand-400 hover:text-brand-300 bg-brand-500/10 hover:bg-brand-500/20 border border-brand-500/20 px-2.5 py-1.5 rounded-lg transition-all">
                  Ver en vivo
                </button>
                <button @click="toggleLock(d)"
                  :class="d.status === 'locked'
                    ? 'text-green-400 bg-green-500/10 hover:bg-green-500/20 border-green-500/20'
                    : 'text-red-400 bg-red-500/8 hover:bg-red-500/15 border-red-500/15'"
                  class="text-[11px] font-medium border px-2.5 py-1.5 rounded-lg transition-all">
                  {{ d.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDevices.length === 0">
            <td colspan="6" class="px-5 py-12 text-center text-sm text-gray-600">Sin dispositivos</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal vista en vivo -->
  <Teleport to="body">
    <div v-if="liveDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7);backdrop-filter:blur(8px)">
      <div class="w-full max-w-2xl rounded-2xl border border-white/10 overflow-hidden" style="background:#0b0e16">
        <div class="flex items-center justify-between px-5 py-4 border-b border-white/6">
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-1.5">
              <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span class="text-sm font-semibold text-white">{{ liveDevice.name }}</span>
            </div>
            <span class="text-xs px-2 py-0.5 rounded-md" style="background:rgba(37,99,235,0.1);color:#93c5fd">En vivo</span>
          </div>
          <button @click="liveDevice = null" class="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            <XMarkIcon class="w-4 h-4" style="color:#6b7280" />
          </button>
        </div>
        <div class="p-6 text-center space-y-4" style="min-height:300px;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto" style="background:rgba(37,99,235,0.1)">
            <SignalIcon class="w-7 h-7" style="color:#3b82f6" />
          </div>
          <div>
            <p class="text-sm font-semibold text-white mb-1">Vista en vivo disponible próximamente</p>
            <p class="text-xs" style="color:#6b7280">La conexión WebRTC con Cloudflare TURN está en desarrollo.<br>Podrás ver la pantalla del alumno en tiempo real.</p>
          </div>
          <div class="text-xs px-3 py-2 rounded-lg" style="background:rgba(255,255,255,0.04);color:#4b5563">
            Dispositivo: {{ liveDevice.name }} · IP: {{ liveDevice.ip_address }} · {{ liveDevice.os_info }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { MagnifyingGlassIcon, ComputerDesktopIcon, XMarkIcon, SignalIcon } from '@heroicons/vue/24/outline'

const devices      = ref([])
const search       = ref('')
const filterStatus = ref('')
const liveDevice   = ref(null)

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length)

const filteredDevices = computed(() =>
  devices.value.filter(d => {
    const matchSearch = !search.value || d.name.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = !filterStatus.value || d.status === filterStatus.value
    return matchSearch && matchStatus
  })
)

onMounted(async () => {
  const { data } = await supabase.from('devices').select('*, groups(name)').order('status').order('name')
  devices.value = data || []

  supabase.channel('devices-rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, p => {
      const idx = devices.value.findIndex(d => d.id === p.new.id)
      if (idx !== -1) Object.assign(devices.value[idx], p.new)
    })
    .subscribe()
})

async function toggleLock(device) {
  const newStatus = device.status === 'locked' ? 'offline' : 'locked'
  await supabase.from('devices').update({ status: newStatus }).eq('id', device.id)
  device.status = newStatus
}

function watchLive(d) { liveDevice.value = d }
function statusDot(s)   { return { online: 'bg-green-400', offline: 'bg-gray-600', locked: 'bg-red-400' }[s] }
function statusText(s)  { return { online: 'text-green-400', offline: 'text-gray-500', locked: 'text-red-400' }[s] }
function statusLabel(s) { return { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[s] || s }
function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h/24)}d`
}
</script>
