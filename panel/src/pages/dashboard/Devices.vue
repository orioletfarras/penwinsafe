<template>
  <div class="flex gap-4 h-full">

    <!-- Device list (left) -->
    <div class="flex-1 min-w-0 space-y-3">

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
              <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Última actividad</th>
              <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">IP</th>
              <th class="text-left px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider" style="color:#6b7280">Red</th>
              <th class="px-4 py-2.5"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in filteredDevices" :key="d.id"
              class="transition-colors cursor-pointer"
              :style="[
                'border-bottom:1px solid #f3f4f6',
                selectedDevice?.id === d.id ? 'background:#eff6ff' : ''
              ].join(';')"
              @click="selectDevice(d)"
              onmouseenter="if(!this.classList.contains('selected'))this.style.background='#f9fafb'"
              onmouseleave="if(!this.classList.contains('selected'))this.style.background=''">
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
                <NetworkModeBadge :mode="d.network_mode" :status="d.status" />
              </td>
              <td class="px-4 py-2" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <button v-if="d.status === 'online'" @click="takeScreenshot(d)"
                    class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                    style="color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0">
                    Screenshot
                  </button>
                  <button v-if="d.status === 'online'" @click="watchLive(d)"
                    class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors"
                    style="color:#006fff;background:#ffffff;border:1px solid #006fff">
                    En vivo
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

    <!-- Detail panel (right) -->
    <div v-if="selectedDevice"
      class="w-[360px] flex-shrink-0 rounded overflow-hidden flex flex-col"
      style="background:#ffffff;border:1px solid #e5e7eb;max-height:calc(100vh - 120px);position:sticky;top:0">

      <!-- Panel header -->
      <div class="px-4 py-3 flex items-center justify-between flex-shrink-0" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded flex items-center justify-center"
            :style="selectedDevice.status === 'online' ? 'background:#f0fdf4' : 'background:#f9fafb'">
            <ComputerDesktopIcon class="w-3.5 h-3.5"
              :style="selectedDevice.status === 'online' ? 'color:#16a34a' : 'color:#9ca3af'" />
          </div>
          <div>
            <p class="text-[12px] font-semibold" style="color:#111827">{{ selectedDevice.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <p class="text-[10px]" style="color:#9ca3af">{{ selectedDevice.ip_address || '—' }}</p>
              <NetworkModeBadge :mode="selectedDevice.network_mode" :status="selectedDevice.status" size="xs" />
            </div>
          </div>
        </div>
        <button @click="selectedDevice = null"
          class="w-6 h-6 flex items-center justify-center rounded transition-colors"
          style="color:#9ca3af"
          onmouseenter="this.style.background='#f9fafb'"
          onmouseleave="this.style.background='transparent'">
          <XMarkIcon class="w-4 h-4" />
        </button>
      </div>

      <!-- Asignar clase -->
      <div class="px-4 py-2.5 flex items-center gap-2 flex-shrink-0" style="border-bottom:1px solid #e5e7eb;background:#f9fafb">
        <UserGroupIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#9ca3af" />
        <select
          :value="selectedDevice.group_id || ''"
          @change="assignGroup(selectedDevice, $event.target.value)"
          class="flex-1 text-[11px] rounded px-2 py-1 focus:outline-none transition-colors"
          style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
          <option value="">Sin clase asignada</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <span v-if="assigningGroup" class="text-[10px]" style="color:#9ca3af">Guardando...</span>
      </div>

      <!-- Tabs -->
      <div class="flex flex-shrink-0" style="border-bottom:1px solid #e5e7eb">
        <button v-for="tab in tabs" :key="tab.id" @click="activeTab = tab.id"
          class="flex-1 px-3 py-2 text-[11px] font-medium transition-colors relative"
          :style="activeTab === tab.id
            ? 'color:#006fff;border-bottom:2px solid #006fff'
            : 'color:#6b7280;border-bottom:2px solid transparent'">
          {{ tab.label }}
          <span v-if="tab.count > 0"
            class="ml-1 text-[9px] px-1 py-0.5 rounded font-semibold"
            :style="activeTab === tab.id
              ? 'background:#eff6ff;color:#006fff'
              : 'background:#f3f4f6;color:#6b7280'">
            {{ tab.count }}
          </span>
        </button>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto">

        <!-- URLs -->
        <div v-if="activeTab === 'urls'">
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="urlEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            Sin historial de navegación
          </div>
          <div v-else>
            <div v-for="e in urlEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <img :src="`https://www.google.com/s2/favicons?domain=${e.domain}&sz=16`"
                  class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded" @error="e.target.style.display='none'" />
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium truncate" style="color:#111827">{{ e.title || e.domain }}</p>
                  <p class="text-[10px] truncate" style="color:#9ca3af">{{ e.domain }}</p>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.visited_at) }}</span>
              </div>
              <div v-if="e.ai_category" class="mt-1 ml-5">
                <span class="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
                  {{ e.ai_category }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Búsquedas -->
        <div v-if="activeTab === 'searches'">
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="searchEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            Sin búsquedas registradas
          </div>
          <div v-else>
            <div v-for="e in searchEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <MagnifyingGlassIcon class="w-3 h-3 mt-0.5 flex-shrink-0" style="color:#9ca3af" />
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium" style="color:#111827">{{ e.query }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[9px] capitalize" style="color:#9ca3af">{{ e.engine }}</span>
                    <span v-if="e.ai_risk_level && e.ai_risk_level !== 'safe'"
                      class="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                      :class="riskClass(e.ai_risk_level)">
                      {{ e.ai_risk_level }}
                    </span>
                  </div>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.searched_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloqueados -->
        <div v-if="activeTab === 'blocked'">
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="blockedEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            Sin contenido bloqueado
          </div>
          <div v-else>
            <div v-for="e in blockedEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#fef2f2'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <div class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded flex items-center justify-center" style="background:#fef2f2">
                  <NoSymbolIcon class="w-3 h-3" style="color:#dc2626" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium truncate" style="color:#111827">
                    {{ e.query || e.domain }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
                      {{ reasonLabel(e.reason) }}
                    </span>
                    <span v-if="e.query && e.domain !== 'search'" class="text-[9px] truncate" style="color:#9ca3af">
                      {{ e.domain }}
                    </span>
                  </div>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.blocked_at) }}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

  </div>

  <!-- Modal screenshot -->
  <Teleport to="body">
    <div v-if="screenshotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7)">
      <div class="rounded overflow-hidden flex flex-col" style="background:#111827;border:1px solid #374151;box-shadow:0 20px 60px rgba(0,0,0,0.5);width:900px;max-width:95vw">
        <div class="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style="border-bottom:1px solid #374151">
          <div class="flex items-center gap-2.5">
            <span class="text-[13px] font-semibold" style="color:#f9fafb">{{ screenshotModal.deviceName }}</span>
            <span class="text-[10px]" style="color:#6b7280">{{ screenshotModal.takenAt }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="screenshotModal.image" @click="downloadScreenshot"
              class="text-[11px] font-medium px-2.5 py-1 rounded"
              style="background:#006fff;color:#fff">
              Descargar
            </button>
            <button @click="screenshotModal = null"
              class="w-6 h-6 flex items-center justify-center rounded"
              style="color:#9ca3af" onmouseenter="this.style.color='#f9fafb'" onmouseleave="this.style.color='#9ca3af'">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div style="background:#000;min-height:200px;display:flex;align-items:center;justify-content:center">
          <img v-if="screenshotModal.image" :src="screenshotModal.image" style="max-width:100%;max-height:70vh;display:block" />
          <div v-else class="flex flex-col items-center gap-2 p-8">
            <svg class="animate-spin w-6 h-6" style="color:#006fff" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p class="text-[12px]" style="color:#9ca3af">Capturando pantalla...</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal vista en vivo -->
  <Teleport to="body">
    <div v-if="liveDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7)">
      <div class="rounded overflow-hidden flex flex-col" style="background:#111827;border:1px solid #374151;box-shadow:0 20px 60px rgba(0,0,0,0.5);width:900px;max-width:95vw">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style="border-bottom:1px solid #374151">
          <div class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            <span class="text-[13px] font-semibold" style="color:#f9fafb">{{ liveDevice.name }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="background:#064e3b;color:#34d399;border:1px solid #065f46">En vivo</span>
            <span class="text-[10px]" style="color:#6b7280">{{ liveDevice.ip_address }}</span>
          </div>
          <button @click="closeLive"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#9ca3af"
            onmouseenter="this.style.color='#f9fafb'"
            onmouseleave="this.style.color='#9ca3af'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Video area -->
        <div style="position:relative;background:#000;aspect-ratio:16/9">
          <video ref="liveVideoEl" autoplay playsinline muted
            style="width:100%;height:100%;display:block;object-fit:contain">
          </video>

          <!-- Waiting overlay -->
          <div v-if="liveStatus !== 'streaming'"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div v-if="liveStatus === 'connecting'" class="flex flex-col items-center gap-2">
              <svg class="animate-spin w-6 h-6" style="color:#006fff" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p class="text-[12px]" style="color:#9ca3af">Conectando con {{ liveDevice.name }}...</p>
            </div>
            <div v-else-if="liveStatus === 'error'" class="flex flex-col items-center gap-2">
              <p class="text-[13px] font-semibold" style="color:#f87171">No se pudo conectar</p>
              <p class="text-[11px]" style="color:#6b7280">El dispositivo debe estar online y con la app abierta</p>
              <button @click="startLive(liveDevice)"
                class="text-[11px] font-medium px-3 py-1.5 rounded mt-1"
                style="background:#006fff;color:#fff">
                Reintentar
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 flex items-center justify-between flex-shrink-0" style="border-top:1px solid #374151">
          <span class="text-[10px] font-mono" style="color:#4b5563">{{ liveDevice.os_info }}</span>
          <span class="text-[10px]" style="color:#4b5563">WebRTC · PenwinSafe</span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { supabase } from '../../lib/supabase'
import { MagnifyingGlassIcon, ComputerDesktopIcon, XMarkIcon, SignalIcon, NoSymbolIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
import NetworkModeBadge from '../../components/NetworkModeBadge.vue'

const devices        = ref([])
const groups         = ref([])
const search         = ref('')
const filterStatus   = ref('')
const liveDevice     = ref(null)
const liveVideoEl      = ref(null)
const screenshotModal  = ref(null)
const liveStatus     = ref('connecting') // connecting | streaming | error
const livePc         = ref(null)
const liveChannel    = ref(null)
const selectedDevice = ref(null)
const activeTab      = ref('urls')
const loadingDetail  = ref(false)
const assigningGroup = ref(false)
const urlEvents      = ref([])
const searchEvents   = ref([])
const blockedEvents  = ref([])

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length)

const filteredDevices = computed(() =>
  devices.value.filter(d => {
    const matchSearch = !search.value || d.name.toLowerCase().includes(search.value.toLowerCase())
    const matchStatus = !filterStatus.value || d.status === filterStatus.value
    return matchSearch && matchStatus
  })
)

const tabs = computed(() => [
  { id: 'urls',     label: 'URLs',       count: urlEvents.value.length },
  { id: 'searches', label: 'Búsquedas',  count: searchEvents.value.length },
  { id: 'blocked',  label: 'Bloqueados', count: blockedEvents.value.length },
])

onMounted(async () => {
  const [{ data: devs }, { data: grps }] = await Promise.all([
    supabase.from('devices').select('*, groups(name)').order('status').order('name'),
    supabase.from('groups').select('id, name').order('name'),
  ])
  devices.value = devs || []
  groups.value  = grps || []

  supabase.channel('devices-rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, p => {
      const idx = devices.value.findIndex(d => d.id === p.new.id)
      if (idx !== -1) Object.assign(devices.value[idx], p.new)
    })
    .subscribe()
})

async function selectDevice(device) {
  selectedDevice.value = device
  activeTab.value = 'urls'
  await loadDeviceHistory(device.id)
}

async function loadDeviceHistory(deviceId) {
  loadingDetail.value = true
  urlEvents.value = []
  searchEvents.value = []
  blockedEvents.value = []

  const [urls, searches, blocked] = await Promise.all([
    supabase.from('url_events').select('*').eq('device_id', deviceId).order('visited_at', { ascending: false }).limit(50),
    supabase.from('search_events').select('*').eq('device_id', deviceId).order('searched_at', { ascending: false }).limit(50),
    supabase.from('blocked_events').select('*').eq('device_id', deviceId).order('blocked_at', { ascending: false }).limit(50),
  ])

  urlEvents.value     = urls.data || []
  searchEvents.value  = searches.data || []
  blockedEvents.value = blocked.data || []
  loadingDetail.value = false
}

async function assignGroup(device, groupId) {
  assigningGroup.value = true
  const newGroupId = groupId || null
  await supabase.from('devices').update({ group_id: newGroupId }).eq('id', device.id)
  device.group_id = newGroupId
  device.groups = groups.value.find(g => g.id === newGroupId) || null
  // Update in main list too
  const idx = devices.value.findIndex(d => d.id === device.id)
  if (idx !== -1) Object.assign(devices.value[idx], { group_id: newGroupId, groups: device.groups })
  assigningGroup.value = false
}

async function toggleLock(device) {
  const newStatus = device.status === 'locked' ? 'offline' : 'locked'
  await supabase.from('devices').update({ status: newStatus }).eq('id', device.id)
  device.status = newStatus
}

function watchLive(d) { startLive(d) }

async function takeScreenshot(d) {
  screenshotModal.value = { deviceName: d.name, takenAt: 'Capturando...', image: null, reqId: null }

  const { data: req, error } = await supabase
    .from('screenshot_requests')
    .insert({ device_id: d.id, status: 'pending' })
    .select('id').single()

  if (error || !req) { screenshotModal.value = null; return }
  screenshotModal.value.reqId = req.id

  // Poll for result (max 30s)
  let tries = 0
  const iv = setInterval(async () => {
    tries++
    const { data } = await supabase
      .from('screenshot_requests')
      .select('status, image_data, taken_at')
      .eq('id', req.id).single()

    if (data?.status === 'done' && data.image_data) {
      clearInterval(iv)
      screenshotModal.value.image = `data:image/png;base64,${data.image_data}`
      screenshotModal.value.takenAt = new Date(data.taken_at).toLocaleTimeString('es-ES')
    } else if (data?.status === 'error' || tries > 15) {
      clearInterval(iv)
      if (!screenshotModal.value.image) screenshotModal.value = null
    }
  }, 2000)
}

function downloadScreenshot() {
  if (!screenshotModal.value?.image) return
  const a = document.createElement('a')
  a.href = screenshotModal.value.image
  a.download = `screenshot-${screenshotModal.value.deviceName}-${Date.now()}.png`
  a.click()
}

async function startLive(d) {
  closeLive()
  liveDevice.value = d
  liveStatus.value = 'connecting'

  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
  livePc.value = pc

  pc.ontrack = async (e) => {
    liveStatus.value = 'streaming'
    await nextTick()
    if (liveVideoEl.value) liveVideoEl.value.srcObject = e.streams[0]
  }

  // Create offer — wait for ICE gathering before inserting
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve()
    pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') resolve() }
    setTimeout(resolve, 4000)
  })

  // Insert session with complete offer SDP
  const { data: session, error } = await supabase
    .from('rtc_sessions')
    .insert({ device_id: d.id, admin_id: (await supabase.auth.getUser()).data.user.id, offer_sdp: pc.localDescription.sdp, status: 'pending' })
    .select('id').single()

  if (error || !session) { liveStatus.value = 'error'; return }

  // Timeout
  const timeout = setTimeout(() => {
    if (liveStatus.value === 'connecting') liveStatus.value = 'error'
  }, 30000)

  // Listen for answer via Realtime postgres_changes
  const ch = supabase.channel(`rtc-answer-${session.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rtc_sessions', filter: `id=eq.${session.id}` },
      async (payload) => {
        if (payload.new.status === 'active' && payload.new.answer_sdp) {
          clearTimeout(timeout)
          try {
            await pc.setRemoteDescription({ type: 'answer', sdp: payload.new.answer_sdp })
          } catch (e) { liveStatus.value = 'error' }
        }
      })
    .subscribe()
  liveChannel.value = ch
}

function closeLive() {
  livePc.value?.close()
  livePc.value = null
  if (liveChannel.value) { supabase.removeChannel(liveChannel.value); liveChannel.value = null }
  if (liveVideoEl.value) liveVideoEl.value.srcObject = null
  liveDevice.value = null
  liveStatus.value = 'connecting'
}

function reasonLabel(r) {
  return { dns_filter: 'DNS', keyword_filter: 'Palabra clave', blacklist: 'Lista negra', schedule: 'Horario', kiosk: 'Kiosco' }[r] || r
}

function riskClass(level) {
  return {
    low:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
    medium:   'bg-orange-50 text-orange-600 border border-orange-200',
    high:     'bg-red-50 text-red-600 border border-red-200',
    critical: 'bg-red-100 text-red-700 border border-red-300',
  }[level] || ''
}

function statusDot(s)   { return { online: 'bg-green-600', offline: 'bg-gray-400', locked: 'bg-red-600' }[s] }
function statusText(s)  { return { online: 'text-green-700', offline: 'text-gray-400', locked: 'text-red-600' }[s] }
function statusLabel(s) { return { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[s] || s }

function timeAgo(d) {
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}
</script>
