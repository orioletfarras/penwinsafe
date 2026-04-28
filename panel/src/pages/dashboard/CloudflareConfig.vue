<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-[18px] font-semibold" style="color:#111827">DNS Cloudflare Gateway</h1>
      <p class="text-[13px] mt-1" style="color:#6b7280">
        Filtrado DNS avanzado para <strong>{{ currentOrgName }}</strong> — tres zonas con categorías y dominios configurables
      </p>
    </div>

    <!-- ── Credentials card ─────────────────────────────────────────────── -->
    <div class="card overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4" style="border-bottom:1px solid #f3f4f6">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#fff7ed">
          <CloudIcon class="w-4 h-4" style="color:#f97316" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Cuenta Cloudflare</h2>
          <p class="text-[12px]" style="color:#6b7280">API Token con permiso <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px">Cloudflare Gateway: Edit</code></p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="cfg.last_check_ok === true"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Conectado
          </span>
          <span v-else-if="cfg.last_check_ok === false"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
            Error
          </span>
          <button v-if="cfg.last_check_ok === true" @click="credStep = 1"
            class="text-[11px] px-2 py-1 rounded transition-colors"
            style="color:#6b7280;border:1px solid #e5e7eb"
            @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
            @mouseleave="e => e.currentTarget.style.background='transparent'">
            Cambiar
          </button>
        </div>
      </div>

      <!-- Connected summary -->
      <div v-if="cfg.last_check_ok === true && credStep === 0" class="px-6 py-4">
        <div class="flex items-center gap-3 p-3 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
          <CheckCircleIcon class="w-4 h-4 flex-shrink-0" style="color:#16a34a" />
          <div class="flex-1">
            <p class="text-[12px] font-medium" style="color:#15803d">Cuenta verificada</p>
            <p class="text-[11px] mt-0.5 font-mono" style="color:#16a34a">{{ cfg.account_id?.slice(0,8) }}…</p>
          </div>
          <button v-if="!categories.length" @click="fetchCategories" :disabled="loadingCats"
            class="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg text-white transition-all"
            :style="loadingCats ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
            <ArrowPathIcon class="w-3 h-3" :class="loadingCats ? 'animate-spin' : ''" />
            {{ loadingCats ? 'Cargando...' : 'Cargar categorías' }}
          </button>
        </div>
      </div>

      <!-- Credential form -->
      <div v-else-if="credStep === 1" class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-[12px] font-medium mb-1" style="color:#374151">Account ID</label>
          <p class="text-[11px] mb-1.5" style="color:#9ca3af">Panel Cloudflare → Workers & Pages → columna derecha</p>
          <input v-model="form.account_id" type="text" placeholder="a1b2c3d4e5f6..."
            class="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#f97316'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>
        <div>
          <label class="block text-[12px] font-medium mb-1" style="color:#374151">API Token</label>
          <p class="text-[11px] mb-1.5" style="color:#9ca3af">Mi perfil → API Tokens → crear con permisos Gateway:Edit</p>
          <input v-model="form.api_token" type="password" placeholder="••••••••••••••••••••"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#f97316'"
            @blur="e => e.target.style.borderColor='#d1d5db'"
            @keydown.enter="verifyCreds" />
        </div>
        <div class="flex justify-end">
          <button @click="verifyCreds" :disabled="verifying || !form.account_id.trim() || !form.api_token.trim()"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            :style="(verifying || !form.account_id.trim() || !form.api_token.trim()) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
            <ArrowPathIcon v-if="verifying" class="w-3.5 h-3.5 animate-spin" />
            {{ verifying ? 'Verificando...' : 'Verificar y guardar' }}
          </button>
        </div>
        <p v-if="credError" class="text-[12px]" style="color:#dc2626">{{ credError }}</p>
      </div>
    </div>

    <!-- ── Zone configuration (only when connected) ─────────────────────── -->
    <template v-if="cfg.last_check_ok">

      <!-- Loading categories notice -->
      <div v-if="loadingCats" class="flex items-center gap-3 p-4 rounded-xl" style="background:#fff7ed;border:1px solid #fed7aa">
        <ArrowPathIcon class="w-4 h-4 animate-spin flex-shrink-0" style="color:#f97316" />
        <p class="text-[12px]" style="color:#9a3412">Cargando categorías de Cloudflare Gateway…</p>
      </div>

      <!-- Zone cards -->
      <div v-if="categories.length" class="space-y-4">

        <div class="flex items-center justify-between">
          <h2 class="text-[15px] font-semibold" style="color:#111827">Configuración de zonas</h2>
          <div class="flex items-center gap-2">
            <span v-if="cfg.zones_created"
              class="text-[11px] font-medium px-2 py-1 rounded"
              style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
              Activas en Cloudflare
            </span>
          </div>
        </div>

        <!-- One card per zone -->
        <div v-for="zone in zones" :key="zone.key" class="card overflow-hidden">

          <!-- Zone header -->
          <div class="flex items-center gap-3 px-5 py-4" :style="`border-bottom:1px solid #f3f4f6;background:${zone.headerBg}`">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center" :style="`background:${zone.color}22`">
              <component :is="zone.icon" class="w-4 h-4" :style="`color:${zone.color}`" />
            </div>
            <div class="flex-1">
              <input v-model="zoneNames[zone.key]" type="text"
                class="text-[14px] font-semibold bg-transparent outline-none border-b transition-all"
                style="border-bottom:1px solid transparent;color:#111827;width:180px"
                @focus="e => e.target.style.borderBottomColor=zone.color"
                @blur="e => e.target.style.borderBottomColor='transparent'" />
              <p class="text-[11px] mt-0.5" :style="`color:${zone.color}`">{{ zone.level }}</p>
            </div>
            <div class="text-right">
              <p class="text-[11px] font-medium" style="color:#6b7280">
                {{ selectedCats(zone.key).length }} categorías
                <span v-if="customDomains[zone.key].filter(Boolean).length" class="ml-2">
                  · {{ customDomains[zone.key].filter(Boolean).length }} dominios
                </span>
              </p>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex" style="border-bottom:1px solid #f3f4f6">
            <button v-for="tab in ['Categorías', 'Dominios']" :key="tab"
              @click="activeTab[zone.key] = tab"
              class="px-5 py-2.5 text-[12px] font-medium transition-all"
              :style="activeTab[zone.key] === tab
                ? `border-bottom:2px solid ${zone.color};color:${zone.color};margin-bottom:-1px`
                : 'color:#9ca3af;border-bottom:2px solid transparent;margin-bottom:-1px'">
              {{ tab }}
            </button>
          </div>

          <!-- Tab: Categories -->
          <div v-if="activeTab[zone.key] === 'Categorías'" class="px-5 py-4">

            <!-- Group selector -->
            <div class="flex items-center gap-3 mb-4">
              <button v-for="grp in catGroups" :key="grp.key"
                @click="activeCatGroup[zone.key] = grp.key"
                class="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
                :style="activeCatGroup[zone.key] === grp.key
                  ? `background:${zone.color};color:#fff`
                  : 'background:#f3f4f6;color:#6b7280'">
                {{ grp.label }}
                <span class="ml-1.5 text-[10px] font-bold">
                  {{ groupCats(grp.key).filter(c => isCatSelected(zone.key, c.id)).length }}/{{ groupCats(grp.key).length }}
                </span>
              </button>
              <div class="flex-1"></div>
              <button @click="selectAll(zone.key, activeCatGroup[zone.key])"
                class="text-[11px] px-2 py-1 rounded transition-colors"
                style="color:#6b7280"
                @mouseenter="e => e.currentTarget.style.color='#374151'"
                @mouseleave="e => e.currentTarget.style.color='#6b7280'">
                Selec. todos
              </button>
              <button @click="clearAll(zone.key, activeCatGroup[zone.key])"
                class="text-[11px] px-2 py-1 rounded transition-colors"
                style="color:#6b7280"
                @mouseenter="e => e.currentTarget.style.color='#374151'"
                @mouseleave="e => e.currentTarget.style.color='#6b7280'">
                Limpiar
              </button>
            </div>

            <!-- Category grid -->
            <div class="grid grid-cols-2 gap-1.5">
              <label v-for="cat in groupCats(activeCatGroup[zone.key])" :key="cat.id"
                class="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all"
                :style="isCatSelected(zone.key, cat.id)
                  ? `background:${zone.color}14;border:1px solid ${zone.color}44`
                  : 'background:#f9fafb;border:1px solid transparent'"
                @mouseenter="e => { if(!isCatSelected(zone.key, cat.id)) e.currentTarget.style.background='#f3f4f6' }"
                @mouseleave="e => { if(!isCatSelected(zone.key, cat.id)) e.currentTarget.style.background='#f9fafb' }">
                <input type="checkbox" :checked="isCatSelected(zone.key, cat.id)"
                  @change="toggleCat(zone.key, cat.id)"
                  class="rounded"
                  :style="`accent-color:${zone.color}`" />
                <span class="text-[12px]" style="color:#374151">{{ cat.name }}</span>
              </label>
            </div>

          </div>

          <!-- Tab: Custom domains -->
          <div v-if="activeTab[zone.key] === 'Dominios'" class="px-5 py-4 space-y-3">
            <p class="text-[12px]" style="color:#6b7280">
              Añade dominios específicos a bloquear en esta zona, además de las categorías.
              Un dominio por línea. Puedes usar <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px">*.ejemplo.com</code> para wildcards.
            </p>
            <textarea v-model="domainInputs[zone.key]"
              @blur="parseDomains(zone.key)"
              rows="6"
              placeholder="ejemplo.com&#10;*.redesocial.com&#10;streaming.net"
              class="w-full px-3 py-2.5 rounded-lg text-[12px] font-mono outline-none resize-none transition-all"
              style="border:1px solid #d1d5db;color:#374151"
              @focus="e => e.target.style.borderColor=zone.color"
              @blur2="e => e.target.style.borderColor='#d1d5db'"></textarea>
            <div v-if="customDomains[zone.key].filter(Boolean).length" class="flex flex-wrap gap-1.5">
              <span v-for="d in customDomains[zone.key].filter(Boolean)" :key="d"
                class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono"
                :style="`background:${zone.color}14;color:${zone.color};border:1px solid ${zone.color}33`">
                {{ d }}
                <button @click="removeDomain(zone.key, d)" style="opacity:0.6"
                  @mouseenter="e => e.currentTarget.style.opacity='1'"
                  @mouseleave="e => e.currentTarget.style.opacity='0.6'">×</button>
              </span>
            </div>
          </div>

        </div>

        <!-- DoH URLs (when zones are active) -->
        <div v-if="cfg.zones_created" class="card p-5">
          <h3 class="text-[13px] font-semibold mb-4" style="color:#111827">URLs DNS-over-HTTPS</h3>
          <div class="space-y-2.5">
            <div v-for="zone in zones" :key="zone.key"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg"
              style="background:#f9fafb;border:1px solid #e5e7eb">
              <div class="w-5 h-5 rounded flex items-center justify-center flex-shrink-0" :style="`background:${zone.color}22`">
                <component :is="zone.icon" class="w-3 h-3" :style="`color:${zone.color}`" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[11px] font-medium" style="color:#374151">{{ zoneNames[zone.key] }}</p>
                <code v-if="cfg[`zone_${zone.key}_doh`]" class="text-[10px] truncate block" style="color:#6b7280">
                  https://{{ cfg[`zone_${zone.key}_doh`] }}.cloudflare-gateway.com/dns-query
                </code>
                <span v-else class="text-[10px]" style="color:#9ca3af">Sin DoH asignado</span>
              </div>
              <button v-if="cfg[`zone_${zone.key}_doh`]" @click="copyDoh(zone.key)"
                class="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg transition-all"
                style="color:#6b7280;border:1px solid #e5e7eb"
                @mouseenter="e => { e.currentTarget.style.background='#f0f2f5'; e.currentTarget.style.color='#374151' }"
                @mouseleave="e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#6b7280' }">
                <ClipboardDocumentIcon class="w-3 h-3" />
                Copiar
              </button>
            </div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex items-center gap-3">
          <button @click="createZones" :disabled="creatingZones"
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all"
            :style="creatingZones ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
            <ArrowPathIcon v-if="creatingZones" class="w-4 h-4 animate-spin" />
            <ShieldCheckIcon v-else class="w-4 h-4" />
            {{ creatingZones ? 'Creando zonas...' : cfg.zones_created ? 'Actualizar zonas' : 'Crear zonas de protección' }}
          </button>
          <button v-if="cfg.zones_created" @click="deleteZones" :disabled="deletingZones"
            class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            style="border:1px solid #fecaca;color:#dc2626;background:#fef2f2"
            @mouseenter="e => e.currentTarget.style.background='#fee2e2'"
            @mouseleave="e => e.currentTarget.style.background='#fef2f2'">
            <ArrowPathIcon v-if="deletingZones" class="w-3.5 h-3.5 animate-spin" />
            <TrashIcon v-else class="w-3.5 h-3.5" />
            {{ deletingZones ? 'Eliminando...' : 'Eliminar zonas' }}
          </button>
        </div>

        <!-- Zone result -->
        <div v-if="zonesResult" class="rounded-xl p-4"
          :style="zonesResult.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
          <div class="flex items-center gap-2.5">
            <CheckCircleIcon v-if="zonesResult.ok" class="w-4 h-4 flex-shrink-0" style="color:#16a34a" />
            <ExclamationCircleIcon v-else class="w-4 h-4 flex-shrink-0" style="color:#dc2626" />
            <p class="text-[12px] font-medium" :style="zonesResult.ok ? 'color:#15803d' : 'color:#991b1b'">{{ zonesResult.msg }}</p>
          </div>
        </div>

      </div>

      <!-- Prompt to load categories when not loaded yet -->
      <div v-else-if="!loadingCats && cfg.last_check_ok" class="card p-6 text-center space-y-3">
        <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style="background:#fff7ed">
          <CloudIcon class="w-5 h-5" style="color:#f97316" />
        </div>
        <p class="text-[13px] font-medium" style="color:#374151">Cargar categorías de Cloudflare Gateway</p>
        <p class="text-[12px]" style="color:#9ca3af">Las categorías se obtienen desde tu cuenta Cloudflare en tiempo real</p>
        <button @click="fetchCategories" :disabled="loadingCats"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white mx-auto transition-all"
          :style="loadingCats ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
          <ArrowPathIcon class="w-3.5 h-3.5" :class="loadingCats ? 'animate-spin' : ''" />
          {{ loadingCats ? 'Cargando...' : 'Cargar categorías' }}
        </button>
      </div>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs, orgSwitchKey } from '../../lib/orgStore'
import { useToast } from '../../lib/toast'
const toast = useToast()
import {
  CloudIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon, ClipboardDocumentIcon, TrashIcon,
  ShieldExclamationIcon, UserGroupIcon, WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'

const currentOrgName = computed(() =>
  allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || '...'
)

// ── State ─────────────────────────────────────────────────────────────────

const cfg = ref({
  last_check_ok: null,
  account_id: '',
  zones_created: false,
  zone_students_doh: '',
  zone_teachers_doh: '',
  zone_admin_doh: '',
  categories_students: [],
  categories_teachers: [],
  categories_admin: [],
  custom_blocked_students: [],
  custom_blocked_teachers: [],
  custom_blocked_admin: [],
  available_categories: [],
})

const form     = ref({ account_id: '', api_token: '' })
const credStep = ref(1)
const verifying = ref(false)
const credError = ref('')

const categories   = ref([])
const loadingCats  = ref(false)

const zoneNames = ref({ students: 'Alumnos', teachers: 'Profesores', admin: 'Administración' })

const selectedCategories = ref({ students: [], teachers: [], admin: [] })
const customDomains      = ref({ students: [], teachers: [], admin: [] })
const domainInputs       = ref({ students: '', teachers: '', admin: '' })

const activeTab     = ref({ students: 'Categorías', teachers: 'Categorías', admin: 'Categorías' })
const activeCatGroup = ref({ students: 'security', teachers: 'security', admin: 'security' })

const creatingZones = ref(false)
const deletingZones = ref(false)
const zonesResult   = ref(null)

// ── Zone definitions ──────────────────────────────────────────────────────

const zones = [
  {
    key: 'students',
    level: 'Máxima protección',
    color: '#dc2626',
    headerBg: '#fef2f200',
    icon: ShieldExclamationIcon,
  },
  {
    key: 'teachers',
    level: 'Protección media',
    color: '#d97706',
    headerBg: '#fffbeb00',
    icon: UserGroupIcon,
  },
  {
    key: 'admin',
    level: 'Protección básica',
    color: '#2563eb',
    headerBg: '#eff6ff00',
    icon: WrenchScrewdriverIcon,
  },
]

const catGroups = [
  { key: 'security', label: 'Seguridad' },
  { key: 'content',  label: 'Contenido' },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function groupCats(group) {
  return categories.value.filter(c =>
    group === 'security' ? c.class === 'security' : c.class !== 'security'
  )
}

function selectedCats(key) { return selectedCategories.value[key] || [] }
function isCatSelected(key, id) { return selectedCats(key).includes(id) }

function toggleCat(key, id) {
  const arr = selectedCategories.value[key]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function selectAll(key, group) {
  const ids = groupCats(group).map(c => c.id)
  const arr = selectedCategories.value[key]
  ids.forEach(id => { if (!arr.includes(id)) arr.push(id) })
}

function clearAll(key, group) {
  const ids = groupCats(group).map(c => c.id)
  selectedCategories.value[key] = selectedCategories.value[key].filter(id => !ids.includes(id))
}

function parseDomains(key) {
  const lines = domainInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean)
  customDomains.value[key] = [...new Set(lines)]
}

function removeDomain(key, domain) {
  customDomains.value[key] = customDomains.value[key].filter(d => d !== domain)
  domainInputs.value[key] = customDomains.value[key].join('\n')
}

async function callApi(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudflare-api`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ ...body, org_id: selectedOrgId.value }),
    }
  )
  return await res.json()
}

// ── Load ──────────────────────────────────────────────────────────────────

async function loadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('cloudflare_configs').select('*').eq('org_id', selectedOrgId.value).single()
  if (data) {
    cfg.value = data
    credStep.value = data.last_check_ok === true ? 0 : 1
    zoneNames.value = {
      students: data.zone_students_name || 'Alumnos',
      teachers: data.zone_teachers_name || 'Profesores',
      admin:    data.zone_admin_name    || 'Administración',
    }
    selectedCategories.value = {
      students: data.categories_students || [],
      teachers: data.categories_teachers || [],
      admin:    data.categories_admin    || [],
    }
    customDomains.value = {
      students: data.custom_blocked_students || [],
      teachers: data.custom_blocked_teachers || [],
      admin:    data.custom_blocked_admin    || [],
    }
    domainInputs.value = {
      students: (data.custom_blocked_students || []).join('\n'),
      teachers: (data.custom_blocked_teachers || []).join('\n'),
      admin:    (data.custom_blocked_admin    || []).join('\n'),
    }
    if (data.available_categories?.length) {
      categories.value = data.available_categories
    }
  }
}

async function fetchCategories() {
  loadingCats.value = true
  try {
    const result = await callApi({ action: 'get_categories' })
    if (result.ok) {
      categories.value = result.categories
    } else {
      toast.error(result.error || 'Error al cargar categorías')
    }
  } catch (e) {
    toast.error(e.message)
  } finally {
    loadingCats.value = false
  }
}

// ── Actions ───────────────────────────────────────────────────────────────

async function verifyCreds() {
  if (!form.value.account_id.trim() || !form.value.api_token.trim()) return
  verifying.value = true
  credError.value = ''
  try {
    const result = await callApi({
      action: 'verify',
      account_id: form.value.account_id.trim(),
      api_token:  form.value.api_token.trim(),
    })
    if (result.ok) {
      await supabase.from('cloudflare_configs').upsert({
        org_id:       selectedOrgId.value,
        account_id:   form.value.account_id.trim(),
        api_token:    form.value.api_token.trim(),
        last_check_ok:  true,
        last_check_at:  new Date().toISOString(),
        last_check_msg: `Cuenta verificada`,
        updated_at:     new Date().toISOString(),
      })
      cfg.value.last_check_ok = true
      cfg.value.account_id    = form.value.account_id.trim()
      credStep.value = 0
      toast.success('Cuenta Cloudflare conectada')
      await fetchCategories()
    } else {
      credError.value = result.error || 'Error desconocido'
      await supabase.from('cloudflare_configs').upsert({
        org_id: selectedOrgId.value,
        account_id: form.value.account_id.trim(),
        api_token:  form.value.api_token.trim(),
        last_check_ok: false,
        last_check_at: new Date().toISOString(),
        last_check_msg: result.error,
        updated_at: new Date().toISOString(),
      })
    }
  } catch (e) {
    credError.value = e.message
  } finally {
    verifying.value = false
  }
}

async function createZones() {
  // Parse domains before sending
  zones.forEach(z => parseDomains(z.key))

  creatingZones.value = true
  zonesResult.value = null
  try {
    const result = await callApi({
      action: 'create_zones',
      zone_names: {
        students: zoneNames.value.students || 'Alumnos',
        teachers: zoneNames.value.teachers || 'Profesores',
        admin:    zoneNames.value.admin    || 'Administración',
      },
      categories_students: selectedCategories.value.students,
      categories_teachers: selectedCategories.value.teachers,
      categories_admin:    selectedCategories.value.admin,
      custom_blocked_students: customDomains.value.students,
      custom_blocked_teachers: customDomains.value.teachers,
      custom_blocked_admin:    customDomains.value.admin,
    })
    if (result.ok) {
      zonesResult.value = { ok: true, msg: 'Zonas creadas y activas en Cloudflare Gateway' }
      toast.success('Zonas DNS creadas')
      await loadConfig()
    } else {
      zonesResult.value = { ok: false, msg: result.error || 'Error al crear las zonas' }
    }
  } catch (e) {
    zonesResult.value = { ok: false, msg: e.message }
  } finally {
    creatingZones.value = false
  }
}

async function deleteZones() {
  if (!confirm('¿Eliminar las tres zonas de Cloudflare Gateway? Esta acción eliminará las ubicaciones, reglas y listas de dominios.')) return
  deletingZones.value = true
  zonesResult.value = null
  try {
    const result = await callApi({ action: 'delete_zones' })
    if (result.ok) {
      zonesResult.value = { ok: true, msg: 'Zonas eliminadas de Cloudflare Gateway' }
      toast.success('Zonas eliminadas')
      await loadConfig()
    } else {
      zonesResult.value = { ok: false, msg: result.error || 'Error al eliminar las zonas' }
    }
  } catch (e) {
    zonesResult.value = { ok: false, msg: e.message }
  } finally {
    deletingZones.value = false
  }
}

function copyDoh(key) {
  const subdomain = cfg.value[`zone_${key}_doh`]
  if (!subdomain) return
  navigator.clipboard.writeText(`https://${subdomain}.cloudflare-gateway.com/dns-query`)
  toast.success('URL DoH copiada')
}

onMounted(loadConfig)
watch(orgSwitchKey, () => { if (selectedOrgId.value) loadConfig() })
</script>
