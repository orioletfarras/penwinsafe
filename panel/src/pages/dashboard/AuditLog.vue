<template>
  <div class="space-y-4">

    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Registro de actividad</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Acciones realizadas por los administradores del panel</p>
      </div>
      <button @click="exportCSV" class="btn btn-secondary">
        <ArrowDownTrayIcon class="w-3.5 h-3.5" /> Exportar CSV
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 flex-wrap">
      <select v-model="filterAction" class="select" style="width:160px">
        <option value="">Todas las acciones</option>
        <option value="device_delete">Eliminar dispositivo</option>
        <option value="device_lock">Bloquear dispositivo</option>
        <option value="device_unlock">Desbloquear dispositivo</option>
        <option value="device_rename">Renombrar dispositivo</option>
        <option value="device_org">Cambiar colegio</option>
        <option value="alert_resolve">Resolver alerta</option>
        <option value="group_save">Guardar clase</option>
        <option value="filters_save">Guardar filtros</option>
      </select>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="card overflow-hidden">
      <div v-for="i in 6" :key="i" class="px-4 py-3 flex items-center gap-3" style="border-bottom:1px solid #f3f4f6">
        <Skeleton height="28px" width="28px" class-name="rounded-lg flex-shrink-0" />
        <div class="flex-1 space-y-1.5"><Skeleton height="12px" width="200px" /><Skeleton height="10px" width="140px" /></div>
        <Skeleton height="10px" width="80px" />
      </div>
    </div>

    <!-- List -->
    <div v-else-if="filteredLogs.length" class="card overflow-hidden">
      <div v-for="log in filteredLogs" :key="log.id"
        class="px-4 py-3 flex items-start gap-3 transition-colors"
        style="border-bottom:1px solid #f3f4f6"
        onmouseenter="this.style.background='#f9fafb'"
        onmouseleave="this.style.background='transparent'">
        <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          :style="actionStyle(log.action).bg">
          <component :is="actionStyle(log.action).icon" class="w-3.5 h-3.5" :style="actionStyle(log.action).color" />
        </div>
        <div class="flex-1 min-w-0">
          <p class="text-[12px] font-medium" style="color:#111827">{{ actionLabel(log.action) }}
            <span v-if="log.target_name" class="font-normal" style="color:#6b7280"> — {{ log.target_name }}</span>
          </p>
          <p v-if="log.details" class="text-[10px] mt-0.5 truncate" style="color:#9ca3af">{{ log.details }}</p>
        </div>
        <div class="text-right flex-shrink-0">
          <p class="text-[10px]" style="color:#9ca3af">{{ log.user_email?.split('@')[0] }}</p>
          <p class="text-[10px] mt-0.5" style="color:#d1d5db">{{ formatDate(log.created_at) }}</p>
        </div>
      </div>
    </div>

    <div v-else-if="!loading" class="card">
      <div class="empty-state">
        <div class="empty-state-icon"><ClipboardDocumentListIcon /></div>
        <p class="empty-state-title">Sin registros</p>
        <p class="empty-state-desc">Las acciones de los administradores aparecerán aquí.</p>
      </div>
    </div>

    <Pagination v-if="totalLogs > PAGE_SIZE"
      :model-value="page" :total="totalLogs" :per-page="PAGE_SIZE"
      @change="page = $event; loadLogs()" />

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { ArrowDownTrayIcon, ClipboardDocumentListIcon, TrashIcon, LockClosedIcon, LockOpenIcon, PencilSquareIcon, BuildingOfficeIcon, BellIcon, UserGroupIcon, FunnelIcon } from '@heroicons/vue/24/outline'
import Skeleton from '../../components/Skeleton.vue'
import Pagination from '../../components/Pagination.vue'

const logs        = ref([])
const loading     = ref(true)
const page        = ref(1)
const totalLogs   = ref(0)
const filterAction = ref('')
const PAGE_SIZE   = 30

const filteredLogs = computed(() =>
  filterAction.value ? logs.value.filter(l => l.action === filterAction.value) : logs.value
)

onMounted(loadLogs)

async function loadLogs() {
  loading.value = true
  const from = (page.value - 1) * PAGE_SIZE
  const { data, count } = await supabase
    .from('audit_log')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, from + PAGE_SIZE - 1)
  logs.value    = data || []
  totalLogs.value = count || 0
  loading.value = false
}

const ACTION_META = {
  device_delete:  { label: 'Dispositivo eliminado',    icon: TrashIcon,            bg: 'background:#fef2f2', color: 'color:#dc2626' },
  device_lock:    { label: 'Dispositivo bloqueado',    icon: LockClosedIcon,       bg: 'background:#fef2f2', color: 'color:#dc2626' },
  device_unlock:  { label: 'Dispositivo desbloqueado', icon: LockOpenIcon,         bg: 'background:#f0fdf4', color: 'color:#16a34a' },
  device_rename:  { label: 'Dispositivo renombrado',   icon: PencilSquareIcon,     bg: 'background:#eff6ff', color: 'color:#2563eb' },
  device_org:     { label: 'Colegio cambiado',         icon: BuildingOfficeIcon,   bg: 'background:#f5f3ff', color: 'color:#7c3aed' },
  alert_resolve:  { label: 'Alerta resuelta',          icon: BellIcon,             bg: 'background:#f0fdf4', color: 'color:#16a34a' },
  group_save:     { label: 'Clase guardada',           icon: UserGroupIcon,        bg: 'background:#eff6ff', color: 'color:#2563eb' },
  filters_save:   { label: 'Filtros actualizados',     icon: FunnelIcon,           bg: 'background:#fffbeb', color: 'color:#d97706' },
}

function actionLabel(a)  { return ACTION_META[a]?.label || a }
function actionStyle(a)  { return ACTION_META[a] || { bg: 'background:#f9fafb', color: 'color:#6b7280', icon: ClipboardDocumentListIcon } }
function formatDate(d)   { return new Date(d).toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }) }

function exportCSV() {
  const rows = [['Fecha','Acción','Objetivo','Detalles','Usuario']]
  logs.value.forEach(l => rows.push([
    new Date(l.created_at).toLocaleString('es-ES'),
    actionLabel(l.action),
    l.target_name || '',
    `"${(l.details || '').replace(/"/g,'""')}"`,
    l.user_email || '',
  ]))
  const csv  = rows.map(r => r.join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = `audit_log_${new Date().toISOString().split('T')[0]}.csv`
  a.click(); URL.revokeObjectURL(url)
}
</script>
