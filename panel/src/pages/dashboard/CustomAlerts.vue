<template>
  <div class="space-y-4">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <p class="text-[13px] font-semibold" style="color:#111827">Alertas personalizadas</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Define reglas para detectar actividad específica en tus dispositivos</p>
      </div>
      <button @click="openNew" class="btn btn-primary">
        <PlusIcon class="w-3.5 h-3.5" /> Nueva regla
      </button>
    </div>

    <!-- DB Setup notice -->
    <div v-if="dbError" class="card px-4 py-3 flex items-start gap-3" style="background:#fffbeb;border:1px solid #fde68a">
      <ExclamationTriangleIcon class="w-4 h-4 flex-shrink-0 mt-0.5" style="color:#d97706" />
      <div>
        <p class="text-[12px] font-medium" style="color:#92400e">Tabla no encontrada</p>
        <p class="text-[11px] mt-0.5" style="color:#92400e">Crea la tabla en el dashboard de Supabase:</p>
        <pre class="text-[10px] mt-2 p-2 rounded overflow-auto" style="background:#fef3c7;color:#78350f;white-space:pre-wrap">{{ CREATE_SQL }}</pre>
      </div>
    </div>

    <!-- Rules list -->
    <div class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #f0f2f5">
        <p class="section-label">Reglas activas</p>
      </div>

      <!-- Skeleton -->
      <div v-if="loading" class="p-4 space-y-3">
        <Skeleton v-for="i in 3" :key="i" height="52px" />
      </div>

      <div v-else>
        <div v-for="rule in rules" :key="rule.id"
          class="px-4 py-3 flex items-center gap-3 transition-colors"
          style="border-bottom:1px solid #f3f4f6"
          onmouseenter="this.style.background='#f9fafb'"
          onmouseleave="this.style.background='transparent'">

          <!-- Toggle -->
          <button @click="toggleRule(rule)"
            class="w-8 h-4.5 rounded-full flex-shrink-0 transition-colors relative"
            :style="rule.enabled ? 'background:#006fff' : 'background:#d1d5db'">
            <span class="absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white shadow transition-transform"
              :style="rule.enabled ? 'left:calc(100% - 14px - 2px)' : 'left:2px'"></span>
          </button>

          <!-- Type icon -->
          <div class="w-7 h-7 rounded flex items-center justify-center flex-shrink-0" :class="typeBg(rule.type)">
            <component :is="typeIcon(rule.type)" class="w-3.5 h-3.5" :class="typeIconColor(rule.type)" />
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <p class="text-[12px] font-medium" style="color:#111827">{{ rule.name }}</p>
              <span class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded" :class="severityPill(rule.severity)">
                {{ rule.severity }}
              </span>
            </div>
            <p class="text-[11px] mt-0.5" style="color:#6b7280">
              {{ typeLabel(rule.type) }}: <span class="font-mono">{{ rule.value }}</span>
            </p>
          </div>

          <div class="flex items-center gap-1.5">
            <button @click="editRule(rule)" class="action-btn action-btn-default">
              <PencilIcon class="w-3.5 h-3.5" />
            </button>
            <button @click="deleteRule(rule)" class="action-btn action-btn-danger">
              <TrashIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div v-if="rules.length === 0 && !loading" class="empty-state">
          <div class="empty-state-icon"><BellAlertIcon /></div>
          <p class="empty-state-title">Sin reglas personalizadas</p>
          <p class="empty-state-desc">Crea reglas para detectar palabras clave, categorías o dominios específicos.</p>
        </div>
      </div>
    </div>

    <!-- How it works -->
    <div class="card p-4">
      <div class="flex items-center gap-2 mb-3">
        <InformationCircleIcon class="w-4 h-4" style="color:#006fff" />
        <p class="text-[12px] font-semibold" style="color:#111827">Cómo funcionan las reglas</p>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div v-for="t in RULE_TYPES" :key="t.type" class="px-3 py-2.5 rounded" style="background:#f9fafb;border:1px solid #f3f4f6">
          <div class="flex items-center gap-2 mb-1.5">
            <component :is="t.icon" class="w-3.5 h-3.5 flex-shrink-0" :style="`color:${t.color}`" />
            <p class="text-[11px] font-semibold" style="color:#111827">{{ t.label }}</p>
          </div>
          <p class="text-[11px]" style="color:#6b7280">{{ t.desc }}</p>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <Teleport to="body">
      <div v-if="modalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.4)">
        <div class="w-full max-w-md rounded-xl overflow-hidden" style="background:#fff;box-shadow:0 24px 64px rgba(0,0,0,0.15)">
          <div class="flex items-center justify-between px-5 py-4" style="border-bottom:1px solid #f3f4f6">
            <p class="text-[14px] font-semibold" style="color:#111827">{{ editingRule?.id ? 'Editar regla' : 'Nueva regla' }}</p>
            <button @click="modalOpen = false" class="w-6 h-6 flex items-center justify-center rounded" style="color:#9ca3af" onmouseenter="this.style.background='#f3f4f6'" onmouseleave="this.style.background='transparent'">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
          <div class="p-5 space-y-4">
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre de la regla</label>
              <input v-model="form.name" placeholder="Ej: Bloquear redes sociales" class="input w-full" />
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Tipo</label>
              <div class="grid grid-cols-3 gap-2">
                <button v-for="t in RULE_TYPES" :key="t.type"
                  @click="form.type = t.type"
                  class="px-3 py-2.5 rounded text-[11px] font-medium text-center transition-colors"
                  :style="form.type === t.type
                    ? `background:${t.color}14;border:1px solid ${t.color}44;color:${t.color}`
                    : 'background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280'">
                  {{ t.label }}
                </button>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">
                {{ form.type === 'keyword' ? 'Palabra clave' : form.type === 'category' ? 'Categoría IA' : 'Dominio' }}
              </label>
              <input v-if="form.type !== 'category'" v-model="form.value"
                :placeholder="form.type === 'keyword' ? 'Ej: proxy, vpn, hack' : 'Ej: tiktok.com'"
                class="input w-full" />
              <select v-else v-model="form.value" class="input w-full">
                <option value="">Selecciona categoría</option>
                <option v-for="c in AI_CATEGORIES" :key="c" :value="c">{{ c }}</option>
              </select>
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Severidad</label>
              <div class="flex gap-2">
                <button v-for="s in SEVERITIES" :key="s.value"
                  @click="form.severity = s.value"
                  class="flex-1 py-1.5 rounded text-[11px] font-semibold uppercase transition-colors"
                  :class="form.severity === s.value ? s.active : s.inactive">
                  {{ s.value }}
                </button>
              </div>
            </div>
          </div>
          <div class="px-5 py-4 flex justify-end gap-2" style="border-top:1px solid #f3f4f6">
            <button @click="modalOpen = false" class="btn btn-secondary">Cancelar</button>
            <button @click="saveRule" :disabled="!form.name || !form.value || saving" class="btn btn-primary disabled:opacity-50">
              {{ saving ? 'Guardando...' : (editingRule?.id ? 'Guardar cambios' : 'Crear regla') }}
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
  PlusIcon, PencilIcon, TrashIcon, XMarkIcon, BellAlertIcon,
  MagnifyingGlassIcon, GlobeAltIcon, TagIcon,
  ExclamationTriangleIcon, InformationCircleIcon,
} from '@heroicons/vue/24/outline'
import Skeleton from '../../components/Skeleton.vue'
import { useToast } from '../../lib/toast'

const { error: toastError, success: toastSuccess } = useToast()

const CREATE_SQL = `create table if not exists custom_alert_rules (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organizations(id) on delete cascade,
  name text not null,
  type text not null,
  value text not null,
  severity text not null default 'warning',
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);
alter table custom_alert_rules enable row level security;
create policy "Admins" on custom_alert_rules for all to authenticated using (true) with check (true);`

const RULE_TYPES = [
  { type: 'keyword',  label: 'Palabra clave', icon: MagnifyingGlassIcon, color: '#006fff', desc: 'Se activa cuando un dispositivo busca esta palabra o frase.' },
  { type: 'category', label: 'Categoría IA',  icon: TagIcon,             color: '#7c3aed', desc: 'Se activa cuando la IA clasifica una búsqueda en esta categoría.' },
  { type: 'domain',   label: 'Dominio',       icon: GlobeAltIcon,        color: '#f59e0b', desc: 'Se activa cuando un dispositivo visita este dominio.' },
]

const AI_CATEGORIES = ['inapropiado', 'preocupante', 'violencia', 'adulto', 'juegos', 'redes_sociales', 'drogas', 'bullying', 'otro']

const SEVERITIES = [
  { value: 'info',     active: 'bg-blue-100 text-blue-700 border border-blue-300',     inactive: 'bg-gray-50 text-gray-400 border border-gray-200' },
  { value: 'warning',  active: 'bg-yellow-100 text-yellow-700 border border-yellow-300', inactive: 'bg-gray-50 text-gray-400 border border-gray-200' },
  { value: 'danger',   active: 'bg-orange-100 text-orange-700 border border-orange-300', inactive: 'bg-gray-50 text-gray-400 border border-gray-200' },
  { value: 'critical', active: 'bg-red-100 text-red-700 border border-red-300',         inactive: 'bg-gray-50 text-gray-400 border border-gray-200' },
]

const rules      = ref([])
const loading    = ref(true)
const dbError    = ref(false)
const modalOpen  = ref(false)
const saving     = ref(false)
const editingRule = ref(null)

const form = ref({ name: '', type: 'keyword', value: '', severity: 'warning' })

async function loadRules() {
  loading.value = true
  dbError.value = false
  const { data, error } = await supabase
    .from('custom_alert_rules')
    .select('*')
    .eq('org_id', activeOrgId.value)
    .order('created_at', { ascending: false })
  if (error?.code === '42P01') { dbError.value = true }
  rules.value = data || []
  loading.value = false
}

onMounted(loadRules)
watch(activeOrgId, loadRules)

function openNew() {
  editingRule.value = null
  form.value = { name: '', type: 'keyword', value: '', severity: 'warning' }
  modalOpen.value = true
}

function editRule(rule) {
  editingRule.value = rule
  form.value = { name: rule.name, type: rule.type, value: rule.value, severity: rule.severity }
  modalOpen.value = true
}

async function saveRule() {
  if (!form.value.name || !form.value.value) return
  saving.value = true
  const payload = { ...form.value, org_id: activeOrgId.value }
  let error
  if (editingRule.value?.id) {
    ;({ error } = await supabase.from('custom_alert_rules').update(payload).eq('id', editingRule.value.id))
  } else {
    ;({ error } = await supabase.from('custom_alert_rules').insert(payload))
  }
  saving.value = false
  if (error) { toastError('Error: ' + error.message); return }
  toastSuccess(editingRule.value?.id ? 'Regla actualizada' : 'Regla creada')
  logAction(editingRule.value?.id ? 'custom_alert_update' : 'custom_alert_create', form.value.name)
  modalOpen.value = false
  loadRules()
}

async function toggleRule(rule) {
  rule.enabled = !rule.enabled
  await supabase.from('custom_alert_rules').update({ enabled: rule.enabled }).eq('id', rule.id)
}

async function deleteRule(rule) {
  if (!confirm(`¿Eliminar la regla "${rule.name}"?`)) return
  const { error } = await supabase.from('custom_alert_rules').delete().eq('id', rule.id)
  if (error) { toastError('Error: ' + error.message); return }
  logAction('custom_alert_delete', rule.name)
  rules.value = rules.value.filter(r => r.id !== rule.id)
  toastSuccess('Regla eliminada')
}

function typeBg(t)        { return { keyword: 'bg-blue-50', category: 'bg-violet-50', domain: 'bg-amber-50' }[t] }
function typeIconColor(t) { return { keyword: 'text-blue-500', category: 'text-violet-500', domain: 'text-amber-500' }[t] }
function typeIcon(t)      { return { keyword: MagnifyingGlassIcon, category: TagIcon, domain: GlobeAltIcon }[t] }
function typeLabel(t)     { return { keyword: 'Palabra clave', category: 'Categoría IA', domain: 'Dominio' }[t] }
function severityPill(s)  { return { info: 'bg-blue-50 text-blue-600 border border-blue-200', warning: 'bg-yellow-50 text-yellow-700 border border-yellow-200', danger: 'bg-orange-50 text-orange-600 border border-orange-200', critical: 'bg-red-50 text-red-600 border border-red-200' }[s] }
</script>
