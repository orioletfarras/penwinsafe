<template>
  <div class="space-y-3">

    <!-- Filtros -->
    <div class="flex items-center gap-2.5">
      <div class="flex-1 relative max-w-xs">
        <MagnifyingGlassIcon class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style="color:#4b5563" />
        <input v-model="search" type="text" placeholder="Buscar dispositivo..."
          class="w-full pl-8 pr-3 py-1.5 rounded text-[12px] text-white placeholder-gray-600 focus:outline-none transition-colors"
          style="background:#141820;border:1px solid rgba(255,255,255,0.07);color:#e5e7eb" />
      </div>
      <select v-model="filterStatus"
        class="rounded px-2.5 py-1.5 text-[12px] focus:outline-none transition-colors"
        style="background:#141820;border:1px solid rgba(255,255,255,0.07);color:#9ca3af">
        <option value="">Todos los estados</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="locked">Bloqueado</option>
      </select>
      <div class="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded" style="color:#4b5563;background:#141820;border:1px solid rgba(255,255,255,0.07)">
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#4ade80"></span>
        {{ onlineCount }} online
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <table class="w-full">
        <thead>
          <tr style="border-bottom:1px solid rgba(255,255,255,0.07)">
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Dispositivo</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Aula</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Estado</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">Ultima actividad</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#374151">IP</th>
            <th class="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in filteredDevices" :key="d.id"
            class="transition-colors"
            style="border-bottom:1px solid rgba(255,255,255,0.04)"
            onmouseenter="this.style.background='rgba(255,255,255,0.02)'"
            onmouseleave="this.style.background='transparent'">
            <td class="px-4 py-2">
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                  :style="d.status === 'online' ? 'background:rgba(74,222,128,0.08)' : d.status === 'locked' ? 'background:rgba(239,68,68,0.08)' : 'background:rgba(255,255,255,0.04)'">
                  <ComputerDesktopIcon class="w-3.5 h-3.5"
                    :style="d.status === 'online' ? 'color:#4ade80' : d.status === 'locked' ? 'color:#f87171' : 'color:#374151'" />
                </div>
                <div>
                  <p class="text-[12px] font-medium text-white">{{ d.name }}</p>
                  <p class="text-[10px]" style="color:#374151">{{ d.os_info || 'Windows' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-2">
              <span class="text-[11px] px-1.5 py-0.5 rounded" style="background:rgba(255,255,255,0.04);color:#6b7280;border:1px solid rgba(255,255,255,0.06)">
                {{ d.groups?.name || '—' }}
              </span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(d.status)"></span>
                <span class="text-[12px] font-medium" :class="statusText(d.status)">{{ statusLabel(d.status) }}</span>
              </div>
            </td>
            <td class="px-4 py-2 text-[11px]" style="color:#4b5563">
              {{ d.last_seen ? timeAgo(d.last_seen) : 'Nunca' }}
            </td>
            <td class="px-4 py-2 text-[11px] font-mono" style="color:#4b5563">{{ d.ip_address || '—' }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1.5">
                <button v-if="d.status === 'online'" @click="watchLive(d)"
                  class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                  style="color:#006fff;background:rgba(0,111,255,0.08);border:1px solid rgba(0,111,255,0.2)">
                  Ver en vivo
                </button>
                <button @click="toggleLock(d)"
                  class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                  :style="d.status === 'locked'
                    ? 'color:#4ade80;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.15)'
                    : 'color:#f87171;background:rgba(239,68,68,0.07);border:1px solid rgba(239,68,68,0.12)'">
                  {{ d.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDevices.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-[12px]" style="color:#374151">Sin dispositivos</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal vista en vivo -->
  <Teleport to="body">
    <div v-if="liveDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.6)">
      <div class="w-full max-w-lg rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.1)">
        <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
          <div class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#4ade80"></span>
            <span class="text-[13px] font-semibold text-white">{{ liveDevice.name }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="background:rgba(0,111,255,0.1);color:#006fff;border:1px solid rgba(0,111,255,0.2)">En vivo</span>
          </div>
          <button @click="liveDevice = null"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#6b7280"
            onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
            onmouseleave="this.style.background='transparent'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="p-8 text-center space-y-4" style="min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="w-10 h-10 rounded flex items-center justify-center mx-auto" style="background:rgba(0,111,255,0.1)">
            <SignalIcon class="w-5 h-5" style="color:#006fff" />
          </div>
          <div>
            <p class="text-[13px] font-semibold text-white mb-1">Vista en vivo disponible proximamente</p>
            <p class="text-[12px] leading-relaxed" style="color:#4b5563">La conexion WebRTC con Cloudflare TURN esta en desarrollo.<br>Podras ver la pantalla del alumno en tiempo real.</p>
          </div>
          <div class="text-[11px] px-3 py-2 rounded font-mono" style="background:rgba(255,255,255,0.03);color:#4b5563;border:1px solid rgba(255,255,255,0.06)">
            {{ liveDevice.name }} &middot; {{ liveDevice.ip_address }} &middot; {{ liveDevice.os_info }}
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
