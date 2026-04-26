<template>
  <div class="space-y-3">

    <!-- Filtros -->
    <div class="flex items-center gap-2.5">
      <div class="flex-1 relative max-w-xs">
        <MagnifyingGlassIcon class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2" style="color:#9ca3af" />
        <input v-model="search" type="text" placeholder="Buscar dispositivo..."
          class="w-full pl-8 pr-3 py-1.5 rounded text-[12px] focus:outline-none transition-colors"
          style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
      </div>
      <select v-model="filterStatus"
        class="rounded px-2.5 py-1.5 text-[12px] focus:outline-none transition-colors"
        style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
        <option value="">Todos los estados</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
        <option value="locked">Bloqueado</option>
      </select>
      <div class="flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded" style="color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0">
        <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
        {{ onlineCount }} online
      </div>
    </div>

    <!-- Tabla -->
    <div class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <table class="w-full">
        <thead>
          <tr style="background:#f9fafb;border-bottom:1px solid #e5e7eb">
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Dispositivo</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Aula</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Estado</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Ultima actividad</th>
            <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">IP</th>
            <th class="px-4 py-2.5"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="d in filteredDevices" :key="d.id"
            class="transition-colors"
            style="border-bottom:1px solid #f3f4f6"
            onmouseenter="this.style.background='#f9fafb'"
            onmouseleave="this.style.background='transparent'">
            <td class="px-4 py-2">
              <div class="flex items-center gap-2.5">
                <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                  :style="d.status === 'online' ? 'background:#f0fdf4' : d.status === 'locked' ? 'background:#fef2f2' : 'background:#f9fafb'">
                  <ComputerDesktopIcon class="w-3.5 h-3.5"
                    :style="d.status === 'online' ? 'color:#16a34a' : d.status === 'locked' ? 'color:#dc2626' : 'color:#9ca3af'" />
                </div>
                <div>
                  <p class="text-[12px] font-medium" style="color:#111827">{{ d.name }}</p>
                  <p class="text-[10px]" style="color:#9ca3af">{{ d.os_info || 'Windows' }}</p>
                </div>
              </div>
            </td>
            <td class="px-4 py-2">
              <span class="text-[11px] px-1.5 py-0.5 rounded" style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">
                {{ d.groups?.name || '—' }}
              </span>
            </td>
            <td class="px-4 py-2">
              <div class="flex items-center gap-1.5">
                <span class="w-1.5 h-1.5 rounded-full" :class="statusDot(d.status)"></span>
                <span class="text-[12px] font-medium" :class="statusText(d.status)">{{ statusLabel(d.status) }}</span>
              </div>
            </td>
            <td class="px-4 py-2 text-[11px]" style="color:#9ca3af">
              {{ d.last_seen ? timeAgo(d.last_seen) : 'Nunca' }}
            </td>
            <td class="px-4 py-2 text-[11px] font-mono" style="color:#9ca3af">{{ d.ip_address || '—' }}</td>
            <td class="px-4 py-2">
              <div class="flex items-center justify-end gap-1.5">
                <button v-if="d.status === 'online'" @click="watchLive(d)"
                  class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                  style="color:#006fff;background:#ffffff;border:1px solid #006fff">
                  Ver en vivo
                </button>
                <button @click="toggleLock(d)"
                  class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                  :style="d.status === 'locked'
                    ? 'color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0'
                    : 'color:#dc2626;background:#fef2f2;border:1px solid #fecaca'">
                  {{ d.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
                </button>
              </div>
            </td>
          </tr>
          <tr v-if="filteredDevices.length === 0">
            <td colspan="6" class="px-4 py-12 text-center text-[12px]" style="color:#9ca3af">Sin dispositivos</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  <!-- Modal vista en vivo -->
  <Teleport to="body">
    <div v-if="liveDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.4)">
      <div class="w-full max-w-lg rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb;box-shadow:0 10px 25px rgba(0,0,0,0.1)">
        <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid #e5e7eb">
          <div class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            <span class="text-[13px] font-semibold" style="color:#111827">{{ liveDevice.name }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="background:#eff6ff;color:#006fff;border:1px solid #bfdbfe">En vivo</span>
          </div>
          <button @click="liveDevice = null"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#6b7280"
            onmouseenter="this.style.background='#f9fafb'"
            onmouseleave="this.style.background='transparent'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="p-8 text-center space-y-4" style="min-height:240px;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="w-10 h-10 rounded flex items-center justify-center mx-auto" style="background:#eff6ff">
            <SignalIcon class="w-5 h-5" style="color:#006fff" />
          </div>
          <div>
            <p class="text-[13px] font-semibold mb-1" style="color:#111827">Vista en vivo disponible proximamente</p>
            <p class="text-[12px] leading-relaxed" style="color:#6b7280">La conexion WebRTC con Cloudflare TURN esta en desarrollo.<br>Podras ver la pantalla del alumno en tiempo real.</p>
          </div>
          <div class="text-[11px] px-3 py-2 rounded font-mono" style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">
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
function statusDot(s)   { return { online: 'bg-green-600', offline: 'bg-gray-400', locked: 'bg-red-600' }[s] }
function statusText(s)  { return { online: 'text-green-700', offline: 'text-gray-400', locked: 'text-red-600' }[s] }
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
