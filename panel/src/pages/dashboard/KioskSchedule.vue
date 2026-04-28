<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Modo kiosco por horario</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Bloquea o desbloquea dispositivos automáticamente según el horario</p>
      </div>
      <button @click="openNew" class="btn btn-primary">
        <PlusIcon class="w-3.5 h-3.5" /> Nueva franja
      </button>
    </div>

    <!-- DB notice -->
    <div v-if="dbError" class="card px-4 py-3 flex items-start gap-3" style="background:#fffbeb;border:1px solid #fde68a">
      <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" style="color:#d97706" />
      <div>
        <p class="text-[12px] font-medium" style="color:#92400e">Tabla no encontrada — ejecuta este SQL en Supabase:</p>
        <pre class="text-[10px] mt-2 p-2 rounded overflow-auto" style="background:#fef3c7;color:#78350f;white-space:pre-wrap">{{ CREATE_SQL }}</pre>
      </div>
    </div>

    <!-- Week view -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5">
        <p class="section-label">Vista semanal</p>
      </div>
      <div class="p-4">
        <div class="grid grid-cols-7 gap-2">
          <div v-for="(day, idx) in DAYS" :key="idx">
            <p class="text-[10px] font-semibold text-center mb-2" style="color:#9ca3af">{{ day }}</p>
            <div class="space-y-1 min-h-[60px]">
              <div v-for="s in schedulesForDay(idx)" :key="s.id"
                class="px-2 py-1.5 rounded text-[10px] font-medium cursor-pointer transition-colors"
                :style="s.action === 'lock'
                  ? 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626'
                  : 'background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a'"
                @click="editRule(s)">
                <p>{{ s.start_time.slice(0,5) }}–{{ s.end_time.slice(0,5) }}</p>
                <p class="mt-0.5 opacity-70">{{ s.action === 'lock' ? '🔒 Bloqueo' : '🔓 Libre' }}</p>
              </div>
              <div v-if="schedulesForDay(idx).length === 0"
                class="h-8 rounded border border-dashed flex items-center justify-center cursor-pointer transition-colors"
                style="border-color:#e5e7eb"
                onmouseenter="this.style.background='#f9fafb'"
                onmouseleave="this.style.background='transparent'"
                @click="openNewForDay(idx)">
                <PlusIcon class="w-3 h-3" style="color:#d1d5db" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- List -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5">
        <p class="section-label">Todas las franjas</p>
      </div>
      <div v-if="loading" class="p-4 space-y-3">
        <Skeleton v-for="i in 3" :key="i" height="52px" />
      </div>
      <div v-else>
        <div v-for="s in schedules" :key="s.id"
          class="px-4 py-3 flex items-center gap-3 transition-colors"
          style="border-bottom:1px solid #f3f4f6"
          onmouseenter="this.style.background='#f9fafb'"
          onmouseleave="this.style.background='transparent'">

          <!-- Enable toggle -->
          <button @click="toggleSchedule(s)"
            class="relative rounded-full flex-shrink-0 transition-colors"
            style="width:32px;height:18px"
            :style="s.enabled ? 'background:#006fff' : 'background:#d1d5db'">
            <span class="absolute top-[2px] w-[14px] h-[14px] rounded-full bg-white shadow transition-all"
              :style="s.enabled ? 'left:calc(100% - 16px)' : 'left:2px'"></span>
          </button>

          <!-- Action icon -->
          <div class="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
            :style="s.action === 'lock' ? 'background:#fef2f2' : 'background:#f0fdf4'">
            <component :is="s.action === 'lock' ? LockClosedIcon : LockOpenIcon" class="w-3.5 h-3.5"
              :style="s.action === 'lock' ? 'color:#dc2626' : 'color:#16a34a'" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-0.5">
              <p class="text-[12px] font-medium" style="color:#111827">{{ s.name }}</p>
              <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                :style="s.action === 'lock' ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca' : 'background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0'">
                {{ s.action === 'lock' ? 'Bloqueo' : 'Acceso libre' }}
              </span>
            </div>
            <p class="text-[11px]" style="color:#6b7280">
              {{ formatDays(s.days_of_week) }} · {{ s.start_time.slice(0,5) }} – {{ s.end_time.slice(0,5) }}
              <span v-if="s.group_id"> · {{ groups.find(g => g.id === s.group_id)?.name }}</span>
              <span v-else> · Todos los grupos</span>
            </p>
          </div>

          <div class="flex items-center gap-1.5">
            <button @click="editRule(s)" class="action-btn action-btn-default"><PencilIcon class="w-3.5 h-3.5" /></button>
            <button @click="deleteSchedule(s)" class="action-btn action-btn-danger"><TrashIcon class="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div v-if="schedules.length === 0" class="empty-state">
          <div class="empty-state-icon"><ClockIcon /></div>
          <p class="empty-state-title">Sin franjas horarias</p>
          <p class="empty-state-desc">Crea franjas para bloquear dispositivos en horas de clase o de descanso.</p>
        </div>
      </div>
    </div>

    <!-- Info -->
    <div class="card p-4" style="background:#f0f9ff;border:1px solid #bae6fd">
      <div class="flex items-start gap-3">
        <InformationCircleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" style="color:#0284c7" />
        <div>
          <p class="text-[12px] font-semibold mb-1" style="color:#0c4a6e">Cómo funciona el modo kiosco</p>
          <p class="text-[11px] leading-relaxed" style="color:#0369a1">
            El agente PenwinSafe instalado en cada dispositivo consulta este horario periódicamente.
            En franjas de bloqueo, el filtro DNS redirige todo el tráfico web al portal de bloqueo.
            En franjas de acceso libre, el filtro normal se aplica según la clase del dispositivo.
          </p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.4)">
        <div class="w-full max-w-md rounded-xl overflow-hidden" style="background:#fff;box-shadow:0 24px 64px rgba(0,0,0,0.15)">
          <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid #f3f4f6">
            <p class="text-[14px] font-semibold" style="color:#111827">{{ editingSchedule?.id ? 'Editar franja' : 'Nueva franja' }}</p>
            <button @click="modalOpen = false" class="w-6 h-6 flex items-center justify-center rounded" style="color:#9ca3af" onmouseenter="this.style.background='#f3f4f6'" onmouseleave="this.style.background='transparent'">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre</label>
              <input v-model="form.name" placeholder="Ej: Horario clase mañana" class="input w-full" />
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-2" style="color:#6b7280">Días de la semana</label>
              <div class="flex gap-1.5">
                <button v-for="(day, idx) in DAYS" :key="idx"
                  @click="toggleDay(idx)"
                  class="flex-1 py-1.5 rounded text-[11px] font-semibold transition-colors"
                  :style="form.days_of_week.includes(idx)
                    ? 'background:#006fff;color:#fff;border:1px solid #006fff'
                    : 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb'">
                  {{ day[0] }}
                </button>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Hora inicio</label>
                <input v-model="form.start_time" type="time" class="input w-full" />
              </div>
              <div>
                <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Hora fin</label>
                <input v-model="form.end_time" type="time" class="input w-full" />
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Acción</label>
              <div class="grid grid-cols-2 gap-2">
                <button @click="form.action = 'lock'"
                  class="px-3 py-2.5 rounded text-[12px] font-medium transition-colors"
                  :style="form.action === 'lock'
                    ? 'background:#fef2f2;border:1px solid #fecaca;color:#dc2626'
                    : 'background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280'">
                  🔒 Bloquear dispositivos
                </button>
                <button @click="form.action = 'unlock'"
                  class="px-3 py-2.5 rounded text-[12px] font-medium transition-colors"
                  :style="form.action === 'unlock'
                    ? 'background:#f0fdf4;border:1px solid #bbf7d0;color:#16a34a'
                    : 'background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280'">
                  🔓 Acceso libre
                </button>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Aplicar a</label>
              <select v-model="form.group_id" class="input w-full">
                <option value="">Todos los grupos</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
            </div>
          </div>
          <div class="px-5 py-4 flex justify-end gap-2" style="border-top:1px solid #f3f4f6">
            <button @click="modalOpen = false" class="btn btn-secondary">Cancelar</button>
            <button @click="saveSchedule" :disabled="!form.name || !form.start_time || !form.end_time || !form.days_of_week.length || saving" class="btn btn-primary disabled:opacity-50">
              {{ saving ? 'Guardando...' : (editingSchedule?.id ? 'Guardar' : 'Crear') }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { activeOrgId } from '../../lib/orgStore'
import { logAction } from '../../lib/audit'
import {
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, ClockIcon,
  LockClosedIcon, LockOpenIcon, ExclamationTriangleIcon, InformationCircleIcon,
} from '@heroicons/vue/24/outline'
import Skeleton from '../../components/Skeleton.vue'
import { useToast } from '../../lib/toast'

const { error: toastError, success: toastSuccess } = useToast()

const CREATE_SQL = `create table if not exists kiosk_schedules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  group_id uuid references groups(id) on delete set null,
  name text not null,
  days_of_week int[] not null default '{}',
  start_time time not null,
  end_time time not null,
  action text not null default 'lock',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table kiosk_schedules enable row level security;
create policy "Admins" on kiosk_schedules for all to authenticated using (true) with check (true);`

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const schedules = ref([])
const groups    = ref([])
const loading   = ref(true)
const dbError   = ref(false)
const modalOpen = ref(false)
const saving    = ref(false)
const editingSchedule = ref(null)

const defaultForm = () => ({ name: '', days_of_week: [0,1,2,3,4], start_time: '08:00', end_time: '14:00', action: 'lock', group_id: '' })
const form = ref(defaultForm())

async function loadData() {
  loading.value = true
  dbError.value = false
  const [{ data: sched, error }, { data: grps }] = await Promise.all([
    supabase.from('kiosk_schedules').select('*').eq('org_id', activeOrgId.value).order('start_time'),
    supabase.from('groups').select('id, name').eq('org_id', activeOrgId.value).order('name'),
  ])
  if (error?.code === '42P01') dbError.value = true
  schedules.value = sched || []
  groups.value = grps || []
  loading.value = false
}

onMounted(loadData)
watch(activeOrgId, loadData)

function openNew() {
  editingSchedule.value = null
  form.value = defaultForm()
  modalOpen.value = true
}

function openNewForDay(day) {
  editingSchedule.value = null
  form.value = { ...defaultForm(), days_of_week: [day] }
  modalOpen.value = true
}

function editRule(s) {
  editingSchedule.value = s
  form.value = { name: s.name, days_of_week: [...s.days_of_week], start_time: s.start_time.slice(0,5), end_time: s.end_time.slice(0,5), action: s.action, group_id: s.group_id || '' }
  modalOpen.value = true
}

function toggleDay(idx) {
  const i = form.value.days_of_week.indexOf(idx)
  if (i >= 0) form.value.days_of_week.splice(i, 1)
  else form.value.days_of_week.push(idx)
  form.value.days_of_week.sort()
}

async function saveSchedule() {
  saving.value = true
  const payload = {
    org_id: activeOrgId.value,
    name: form.value.name,
    days_of_week: form.value.days_of_week,
    start_time: form.value.start_time,
    end_time: form.value.end_time,
    action: form.value.action,
    group_id: form.value.group_id || null,
  }
  let error
  if (editingSchedule.value?.id) {
    ;({ error } = await supabase.from('kiosk_schedules').update(payload).eq('id', editingSchedule.value.id))
  } else {
    ;({ error } = await supabase.from('kiosk_schedules').insert(payload))
  }
  saving.value = false
  if (error) { toastError('Error: ' + error.message); return }
  toastSuccess(editingSchedule.value?.id ? 'Franja actualizada' : 'Franja creada')
  logAction('kiosk_schedule_save', form.value.name)
  modalOpen.value = false
  loadData()
}

async function toggleSchedule(s) {
  s.enabled = !s.enabled
  await supabase.from('kiosk_schedules').update({ enabled: s.enabled }).eq('id', s.id)
}

async function deleteSchedule(s) {
  if (!confirm(`¿Eliminar la franja "${s.name}"?`)) return
  await supabase.from('kiosk_schedules').delete().eq('id', s.id)
  schedules.value = schedules.value.filter(x => x.id !== s.id)
  toastSuccess('Franja eliminada')
}

function schedulesForDay(day) {
  return schedules.value.filter(s => s.enabled && s.days_of_week.includes(day))
}

function formatDays(days) {
  if (!days?.length) return '—'
  if (days.length === 7) return 'Todos los días'
  if (JSON.stringify(days) === JSON.stringify([0,1,2,3,4])) return 'Lun–Vie'
  return days.map(d => DAYS[d]).join(', ')
}
</script>
