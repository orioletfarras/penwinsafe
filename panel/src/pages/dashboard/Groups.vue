<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Clases y tutores</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Asigna tutores y configura qué categorías generan notificación por email</p>
      </div>
      <button @click="openNew"
        class="flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded transition-colors"
        style="background:#006fff;color:#ffffff">
        <PlusIcon class="w-3.5 h-3.5" />
        Nueva clase
      </button>
    </div>

    <!-- Skeleton -->
    <div v-if="loading" class="space-y-2">
      <div v-for="i in 3" :key="i" class="h-16 rounded animate-pulse" style="background:#ffffff;border:1px solid #e5e7eb"></div>
    </div>

    <!-- Empty -->
    <div v-else-if="groups.length === 0"
      class="rounded p-12 text-center" style="background:#ffffff;border:1px solid #e5e7eb">
      <UserGroupIcon class="w-7 h-7 mx-auto mb-3" style="color:#9ca3af" />
      <p class="text-[13px] font-medium mb-1" style="color:#111827">Sin clases</p>
      <p class="text-[12px]" style="color:#6b7280">Crea la primera clase para asignar dispositivos y tutores.</p>
    </div>

    <!-- Groups list -->
    <div v-else class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div v-for="(g, i) in groups" :key="g.id"
        class="px-4 py-3 flex items-center gap-4 transition-colors"
        :style="i < groups.length - 1 ? 'border-bottom:1px solid #f3f4f6' : ''"
        onmouseenter="this.style.background='#f9fafb'"
        onmouseleave="this.style.background='transparent'">

        <!-- Icon -->
        <div class="w-8 h-8 rounded flex items-center justify-center flex-shrink-0" style="background:#eff6ff">
          <UserGroupIcon class="w-4 h-4" style="color:#006fff" />
        </div>

        <!-- Info -->
        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2">
            <p class="text-[12px] font-semibold" style="color:#111827">{{ g.name }}</p>
            <span class="text-[10px] px-1.5 py-0.5 rounded" style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">
              {{ g._deviceCount }} dispositivos
            </span>
          </div>
          <div class="flex items-center gap-3 mt-0.5">
            <span v-if="g.tutor_email" class="text-[11px]" style="color:#6b7280">
              {{ g.tutor_name || 'Tutor' }} · {{ g.tutor_email }}
            </span>
            <span v-else class="text-[11px]" style="color:#9ca3af">Sin tutor asignado</span>
          </div>
        </div>

        <!-- Notify badges -->
        <div class="flex flex-wrap gap-1 max-w-[220px]">
          <span v-for="cat in (g.notify_categories || [])" :key="cat"
            class="text-[9px] px-1.5 py-0.5 rounded font-semibold"
            :style="catStyle(cat)">
            {{ catLabel(cat) }}
          </span>
          <span v-if="!g.notify_categories?.length" class="text-[10px]" style="color:#9ca3af">Sin notificaciones</span>
        </div>

        <!-- Edit -->
        <button @click="openEdit(g)"
          class="text-[11px] font-medium px-2.5 py-1 rounded transition-colors flex-shrink-0"
          style="color:#374151;background:#ffffff;border:1px solid #e5e7eb">
          Editar
        </button>
      </div>
    </div>

  </div>

  <!-- Modal -->
  <Teleport to="body">
    <div v-if="modal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.35)">
      <div class="w-full max-w-lg rounded-xl overflow-hidden" style="background:#ffffff;box-shadow:0 20px 40px rgba(0,0,0,0.12)">

        <!-- Modal header -->
        <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid #e5e7eb">
          <p class="text-[14px] font-semibold" style="color:#111827">{{ modal.id ? 'Editar clase' : 'Nueva clase' }}</p>
          <button @click="modal = null" class="w-6 h-6 flex items-center justify-center rounded" style="color:#9ca3af"
            onmouseenter="this.style.background='#f9fafb'" onmouseleave="this.style.background='transparent'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <div class="p-5 space-y-4">

          <!-- Nombre -->
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Nombre de la clase</label>
            <input v-model="modal.name" type="text" placeholder="Ej: 4º A Primaria"
              class="w-full px-3 py-2 rounded text-[12px] focus:outline-none transition-colors"
              style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
          </div>

          <!-- Tutor -->
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Nombre del tutor</label>
              <input v-model="modal.tutor_name" type="text" placeholder="Ej: María García"
                class="w-full px-3 py-2 rounded text-[12px] focus:outline-none transition-colors"
                style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
            </div>
            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Email del tutor</label>
              <input v-model="modal.tutor_email" type="email" placeholder="tutor@colegio.es"
                class="w-full px-3 py-2 rounded text-[12px] focus:outline-none transition-colors"
                style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
            </div>
          </div>

          <!-- Categorías de notificación -->
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">
              Notificar al tutor cuando se bloquee
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="cat in ALL_CATEGORIES" :key="cat.id"
                class="flex items-start gap-2.5 px-3 py-2.5 rounded cursor-pointer transition-colors"
                :style="modal.notify_categories.includes(cat.id)
                  ? 'background:#eff6ff;border:1px solid #bfdbfe'
                  : 'border:1px solid #e5e7eb'">
                <input type="checkbox"
                  :checked="modal.notify_categories.includes(cat.id)"
                  @change="toggleCategory(cat.id)"
                  class="mt-0.5 flex-shrink-0"
                  style="accent-color:#006fff" />
                <div>
                  <p class="text-[11px] font-semibold" style="color:#111827">{{ cat.label }}</p>
                  <p class="text-[10px]" style="color:#9ca3af">{{ cat.desc }}</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Categorías bloqueadas activas en esta clase -->
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">
              Categorías de bloqueo activas en esta clase
            </label>
            <div class="grid grid-cols-2 gap-2">
              <label v-for="cat in ALL_BLOCK_CATEGORIES" :key="cat.id"
                class="flex items-center gap-2.5 px-3 py-2 rounded cursor-pointer transition-colors"
                :style="modal.active_categories.includes(cat.id)
                  ? 'background:#eff6ff;border:1px solid #bfdbfe'
                  : 'border:1px solid #e5e7eb'">
                <input type="checkbox"
                  :checked="modal.active_categories.includes(cat.id)"
                  @change="toggleActiveCategory(cat.id)"
                  class="flex-shrink-0"
                  style="accent-color:#006fff" />
                <span class="text-[11px] font-medium" style="color:#111827">{{ cat.label }}</span>
              </label>
            </div>
          </div>

          <!-- Filtro DNS -->
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Nivel de filtro DNS</label>
            <div class="flex gap-2">
              <label v-for="level in filterLevels" :key="level.value"
                class="flex-1 flex items-center gap-2 px-3 py-2 rounded cursor-pointer transition-colors text-[11px]"
                :style="modal.filter_level === level.value
                  ? 'background:#eff6ff;border:1px solid #bfdbfe;color:#006fff'
                  : 'border:1px solid #e5e7eb;color:#374151'">
                <input type="radio" v-model="modal.filter_level" :value="level.value" style="accent-color:#006fff" />
                {{ level.label }}
              </label>
            </div>
          </div>

          <!-- Error / actions -->
          <div class="flex items-center justify-between pt-1">
            <p v-if="saveError" class="text-[11px] text-red-600">{{ saveError }}</p>
            <span v-else></span>
            <div class="flex items-center gap-2">
              <button @click="modal = null"
                class="text-[12px] px-3 py-1.5 rounded transition-colors"
                style="color:#374151;background:#ffffff;border:1px solid #e5e7eb">
                Cancelar
              </button>
              <button @click="saveGroup" :disabled="saving"
                class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                style="background:#006fff;color:#ffffff">
                {{ saving ? 'Guardando...' : 'Guardar' }}
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { PlusIcon, UserGroupIcon, XMarkIcon } from '@heroicons/vue/24/outline'

const groups    = ref([])
const loading   = ref(true)
const modal     = ref(null)
const saving    = ref(false)
const saveError = ref('')

const ALL_CATEGORIES = [
  { id: 'pornografia',      label: 'Pornografía',        desc: 'Contenido sexual explícito' },
  { id: 'contenido_adulto', label: 'Contenido adulto',   desc: 'Desnudos, erótico, OnlyFans' },
  { id: 'violencia',        label: 'Violencia',          desc: 'Gore, snuff, torturas' },
  { id: 'drogas',           label: 'Drogas',             desc: 'Compra/venta de sustancias' },
  { id: 'apuestas',         label: 'Apuestas',           desc: 'Casinos online, apuestas' },
  { id: 'odio',             label: 'Discurso de odio',   desc: 'Racismo, nazismo, odio' },
  { id: 'dns_filter',       label: 'Bloqueo DNS',        desc: 'Dominios bloqueados por filtro' },
]

// Same list used for both block-active and notify selectors
const ALL_BLOCK_CATEGORIES = ALL_CATEGORIES

const filterLevels = [
  { value: 'family',   label: 'Family' },
  { value: 'adult',    label: 'Adult' },
  { value: 'security', label: 'Security' },
]

const CAT_STYLE = {
  pornografia:      'background:#fef2f2;color:#dc2626;border:1px solid #fecaca',
  contenido_adulto: 'background:#fff7ed;color:#ea580c;border:1px solid #fed7aa',
  violencia:        'background:#fef2f2;color:#dc2626;border:1px solid #fecaca',
  drogas:           'background:#faf5ff;color:#7c3aed;border:1px solid #e9d5ff',
  apuestas:         'background:#fffbeb;color:#d97706;border:1px solid #fde68a',
  odio:             'background:#f1f5f9;color:#475569;border:1px solid #cbd5e1',
  dns_filter:       'background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe',
}

const catLabel = id => ALL_CATEGORIES.find(c => c.id === id)?.label || id
const catStyle = id => CAT_STYLE[id] || 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb'

onMounted(loadGroups)

async function loadGroups() {
  loading.value = true
  const { data } = await supabase.from('groups').select('*, devices(id)').order('name')
  groups.value = (data || []).map(g => ({ ...g, _deviceCount: g.devices?.length || 0 }))
  loading.value = false
}

function openNew() {
  modal.value = {
    name: '', tutor_name: '', tutor_email: '',
    notify_categories: [],
    active_categories: ['pornografia','contenido_adulto','violencia','drogas','apuestas','odio'],
    filter_level: 'family',
  }
  saveError.value = ''
}

function openEdit(g) {
  modal.value = {
    id: g.id,
    name: g.name,
    tutor_name:        g.tutor_name || '',
    tutor_email:       g.tutor_email || '',
    notify_categories: [...(g.notify_categories || [])],
    active_categories: [...(g.active_categories || ['pornografia','contenido_adulto','violencia','drogas','apuestas','odio'])],
    filter_level:      g.filter_level || 'family',
  }
  saveError.value = ''
}

function toggleCategory(id) {
  const arr = modal.value.notify_categories
  const idx = arr.indexOf(id)
  idx === -1 ? arr.push(id) : arr.splice(idx, 1)
}

function toggleActiveCategory(id) {
  const arr = modal.value.active_categories
  const idx = arr.indexOf(id)
  idx === -1 ? arr.push(id) : arr.splice(idx, 1)
}

async function saveGroup() {
  if (!modal.value.name.trim()) { saveError.value = 'El nombre es obligatorio'; return }
  saving.value = true
  saveError.value = ''

  const { data: { user } } = await supabase.auth.getUser()
  const { data: admin }    = await supabase.from('admin_users').select('org_id').eq('id', user.id).single()

  const payload = {
    name:              modal.value.name.trim(),
    tutor_name:        modal.value.tutor_name  || null,
    tutor_email:       modal.value.tutor_email || null,
    notify_categories: modal.value.notify_categories,
    active_categories: modal.value.active_categories,
    filter_level:      modal.value.filter_level,
  }

  const { error } = modal.value.id
    ? await supabase.from('groups').update(payload).eq('id', modal.value.id)
    : await supabase.from('groups').insert({ ...payload, org_id: admin.org_id })

  saving.value = false
  if (error) { saveError.value = error.message; return }
  modal.value = null
  await loadGroups()
}
</script>
