<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-start justify-between">
      <div>
        <h1 class="text-[18px] font-semibold" style="color:#111827">DNS Escolar</h1>
        <p class="text-[13px] mt-1" style="color:#6b7280">
          Configura las tres zonas de filtrado DNS para <strong>{{ currentOrgName }}</strong>
        </p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="cfg.zones_created"
          class="text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
          style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
          Activo en Cloudflare
        </span>
        <span v-else
          class="text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
          style="background:#fff7ed;color:#c2410c;border:1px solid #fed7aa">
          Sin aplicar
        </span>
      </div>
    </div>

    <!-- Not configured yet -->
    <div v-if="!cfg.zones_created && !cfg.last_check_ok" class="card p-8 text-center space-y-3">
      <div class="w-10 h-10 rounded-xl flex items-center justify-center mx-auto" style="background:#f3f4f6">
        <CloudIcon class="w-5 h-5" style="color:#9ca3af" />
      </div>
      <p class="text-[13px] font-medium" style="color:#374151">DNS Escolar no configurado</p>
      <p class="text-[12px]" style="color:#9ca3af">Un superadmin debe conectar la cuenta Cloudflare en SuperConfig</p>
    </div>

    <template v-else>

      <!-- Categories not loaded yet -->
      <div v-if="!categories.length" class="card p-6 text-center space-y-3">
        <ArrowPathIcon class="w-5 h-5 mx-auto animate-spin" style="color:#9ca3af" />
        <p class="text-[12px]" style="color:#9ca3af">Cargando configuración…</p>
      </div>

      <template v-else>

        <!-- Zone cards -->
        <div v-for="zone in zones" :key="zone.key" class="card overflow-hidden">

          <!-- Zone header -->
          <div class="flex items-center gap-3 px-5 py-4" :style="`border-bottom:1px solid ${zone.border}`">
            <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" :style="`background:${zone.color}1a`">
              <component :is="zone.icon" class="w-4 h-4" :style="`color:${zone.color}`" />
            </div>
            <div class="flex-1">
              <input v-model="zoneNames[zone.key]" type="text"
                class="text-[14px] font-semibold bg-transparent outline-none transition-all"
                style="color:#111827;border-bottom:1px solid transparent;width:200px"
                @focus="e => e.target.style.borderBottomColor=zone.color"
                @blur="e => e.target.style.borderBottomColor='transparent'" />
              <p class="text-[11px] mt-0.5 font-medium" :style="`color:${zone.color}`">{{ zone.level }}</p>
            </div>
            <div class="text-right shrink-0">
              <p class="text-[11px]" style="color:#6b7280">
                <span class="font-medium" style="color:#374151">{{ selectedCats(zone.key).length }}</span> categorías ·
                <span class="font-medium" style="color:#374151">{{ customDomains[zone.key].length }}</span> bloqueados ·
                <span class="font-medium" style="color:#374151">{{ whitelists[zone.key].length }}</span> permitidos
              </p>
              <div v-if="cfg[`zone_${zone.key}_doh`]" class="flex items-center gap-1.5 justify-end mt-1">
                <code class="text-[9px] truncate max-w-[220px]" style="color:#9ca3af">
                  https://{{ cfg[`zone_${zone.key}_doh`] }}.cloudflare-gateway.com/dns-query
                </code>
                <button @click="copyDoh(zone.key)" class="flex-shrink-0" style="color:#9ca3af"
                  @mouseenter="e => e.currentTarget.style.color='#374151'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
                  <ClipboardDocumentIcon class="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="flex" style="border-bottom:1px solid #f3f4f6">
            <button v-for="tab in zoneTabs" :key="tab.key"
              @click="activeTab[zone.key] = tab.key"
              class="px-5 py-2.5 text-[12px] font-medium transition-all"
              :style="activeTab[zone.key] === tab.key
                ? `border-bottom:2px solid ${zone.color};color:${zone.color};margin-bottom:-1px`
                : 'color:#9ca3af;border-bottom:2px solid transparent;margin-bottom:-1px'">
              {{ tab.label }}
              <span class="ml-1.5 text-[10px]" :style="activeTab[zone.key] === tab.key ? `color:${zone.color}` : 'color:#d1d5db'">
                <template v-if="tab.key === 'security'">{{ selectedCats(zone.key).filter(id => groupCats('security').map(c=>c.id).includes(id)).length }}/{{ groupCats('security').length }}</template>
                <template v-else-if="tab.key === 'content'">{{ selectedCats(zone.key).filter(id => groupCats('content').map(c=>c.id).includes(id)).length }}/{{ groupCats('content').length }}</template>
                <template v-else-if="tab.key === 'blocked'">{{ customDomains[zone.key].length }}</template>
                <template v-else-if="tab.key === 'allowed'">{{ whitelists[zone.key].length }}</template>
              </span>
            </button>
          </div>

          <!-- Tab content -->
          <div class="px-5 py-4">

            <!-- Security / Content categories -->
            <template v-if="activeTab[zone.key] === 'security' || activeTab[zone.key] === 'content'">
              <div class="flex items-center gap-2 mb-3">
                <button @click="selectAll(zone.key, activeTab[zone.key])"
                  class="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                  style="border:1px solid #e5e7eb;color:#6b7280"
                  @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
                  @mouseleave="e => e.currentTarget.style.background='transparent'">
                  Seleccionar todos
                </button>
                <button @click="clearAll(zone.key, activeTab[zone.key])"
                  class="text-[11px] px-2.5 py-1 rounded-lg transition-all"
                  style="border:1px solid #e5e7eb;color:#6b7280"
                  @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
                  @mouseleave="e => e.currentTarget.style.background='transparent'">
                  Ninguno
                </button>
              </div>
              <div class="grid grid-cols-3 gap-1.5">
                <label v-for="cat in groupCats(activeTab[zone.key])" :key="cat.id"
                  class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all text-[12px]"
                  :style="isCatSelected(zone.key, cat.id)
                    ? `background:${zone.color}12;border:1px solid ${zone.color}40;color:#111827`
                    : 'background:#f9fafb;border:1px solid transparent;color:#6b7280'"
                  @mouseenter="e => { if(!isCatSelected(zone.key, cat.id)) e.currentTarget.style.background='#f3f4f6' }"
                  @mouseleave="e => { if(!isCatSelected(zone.key, cat.id)) e.currentTarget.style.background=isCatSelected(zone.key, cat.id)?`${zone.color}12`:'#f9fafb' }">
                  <input type="checkbox" :checked="isCatSelected(zone.key, cat.id)"
                    @change="toggleCat(zone.key, cat.id)"
                    class="rounded flex-shrink-0" :style="`accent-color:${zone.color}`" />
                  {{ cat.name }}
                </label>
              </div>
            </template>

            <!-- Custom blocked domains -->
            <template v-else-if="activeTab[zone.key] === 'blocked'">
              <p class="text-[12px] mb-3" style="color:#6b7280">
                Dominios adicionales a bloquear en esta zona, además de las categorías seleccionadas.
                Un dominio por línea. Admite <code style="background:#f3f4f6;padding:1px 4px;border-radius:3px;font-size:11px">*.ejemplo.com</code>
              </p>
              <textarea v-model="domainInputs[zone.key]" @blur="parseDomains(zone.key)"
                rows="6" placeholder="redesocial.com&#10;*.streaming.net&#10;juego.io"
                class="w-full px-3 py-2.5 rounded-lg text-[12px] font-mono outline-none resize-none transition-all"
                style="border:1px solid #d1d5db;color:#374151"
                @focus="e => e.target.style.borderColor=zone.color"
                @blur2="e => e.target.style.borderColor='#d1d5db'"></textarea>
              <div v-if="customDomains[zone.key].length" class="flex flex-wrap gap-1.5 mt-2">
                <span v-for="d in customDomains[zone.key]" :key="d"
                  class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono"
                  :style="`background:${zone.color}14;color:${zone.color};border:1px solid ${zone.color}33`">
                  {{ d }}
                  <button @click="removeDomain(zone.key, d)" style="opacity:0.6"
                    @mouseenter="e => e.currentTarget.style.opacity='1'"
                    @mouseleave="e => e.currentTarget.style.opacity='0.6'">×</button>
                </span>
              </div>
            </template>

            <!-- Whitelist (allowed domains) -->
            <template v-else-if="activeTab[zone.key] === 'allowed'">
              <p class="text-[12px] mb-3" style="color:#6b7280">
                Dominios que <strong>siempre se permitirán</strong> en esta zona aunque estén en una categoría bloqueada.
                Un dominio por línea.
              </p>
              <textarea v-model="whitelistInputs[zone.key]" @blur="parseWhitelist(zone.key)"
                rows="6" placeholder="recursoseducativos.com&#10;*.google.com&#10;moodle.escuela.es"
                class="w-full px-3 py-2.5 rounded-lg text-[12px] font-mono outline-none resize-none transition-all"
                style="border:1px solid #d1d5db;color:#374151"
                @focus="e => e.target.style.borderColor='#16a34a'"
                @blur2="e => e.target.style.borderColor='#d1d5db'"></textarea>
              <div v-if="whitelists[zone.key].length" class="flex flex-wrap gap-1.5 mt-2">
                <span v-for="d in whitelists[zone.key]" :key="d"
                  class="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md font-mono"
                  style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
                  {{ d }}
                  <button @click="removeWhitelist(zone.key, d)" style="opacity:0.6"
                    @mouseenter="e => e.currentTarget.style.opacity='1'"
                    @mouseleave="e => e.currentTarget.style.opacity='0.6'">×</button>
                </span>
              </div>
            </template>

          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center gap-3 flex-wrap">
          <button @click="saveOnly" :disabled="saving || applying"
            class="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all"
            :style="(saving || applying) ? 'background:#f3f4f6;color:#9ca3af;cursor:not-allowed' : 'background:#f3f4f6;color:#374151;border:1px solid #e5e7eb'"
            @mouseenter="e => { if(!saving && !applying) e.currentTarget.style.background='#e5e7eb' }"
            @mouseleave="e => { if(!saving && !applying) e.currentTarget.style.background='#f3f4f6' }">
            <ArrowPathIcon v-if="saving" class="w-3.5 h-3.5 animate-spin" />
            <span>{{ saving ? 'Guardando...' : 'Guardar configuración' }}</span>
          </button>

          <button @click="applyZones" :disabled="applying || saving"
            class="flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-medium text-white transition-all"
            :style="(applying || saving) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
            <ArrowPathIcon v-if="applying" class="w-4 h-4 animate-spin" />
            <ShieldCheckIcon v-else class="w-4 h-4" />
            {{ applying ? 'Aplicando...' : 'Guardar y aplicar a Cloudflare' }}
          </button>

          <p class="text-[11px]" style="color:#9ca3af">
            "Guardar" guarda localmente · "Aplicar" envía los cambios a Cloudflare
          </p>
        </div>

        <!-- Result -->
        <div v-if="result" class="rounded-xl p-4"
          :style="result.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
          <div class="flex items-center gap-2.5">
            <CheckCircleIcon v-if="result.ok" class="w-4 h-4 flex-shrink-0" style="color:#16a34a" />
            <ExclamationCircleIcon v-else class="w-4 h-4 flex-shrink-0" style="color:#dc2626" />
            <p class="text-[12px] font-medium" :style="result.ok ? 'color:#15803d' : 'color:#991b1b'">{{ result.msg }}</p>
          </div>
        </div>

      </template>
    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs, orgSwitchKey } from '../../lib/orgStore'
import { useToast } from '../../lib/toast'
import {
  CloudIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon, ClipboardDocumentIcon,
  ShieldExclamationIcon, UserGroupIcon, WrenchScrewdriverIcon,
} from '@heroicons/vue/24/outline'

const toast = useToast()

const currentOrgName = computed(() =>
  allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || '...'
)

// ── State ─────────────────────────────────────────────────────────────────

const cfg        = ref({ zones_created: false, last_check_ok: null, available_categories: [] })
const categories = ref([])
const saving     = ref(false)
const applying   = ref(false)
const result     = ref(null)

const zoneNames       = ref({ students: 'Alumnos', teachers: 'Profesores', admin: 'Administración' })
const selectedCategories = ref({ students: [], teachers: [], admin: [] })
const customDomains   = ref({ students: [], teachers: [], admin: [] })
const whitelists      = ref({ students: [], teachers: [], admin: [] })
const domainInputs    = ref({ students: '', teachers: '', admin: '' })
const whitelistInputs = ref({ students: '', teachers: '', admin: '' })
const activeTab       = ref({ students: 'security', teachers: 'security', admin: 'security' })

const zoneTabs = [
  { key: 'security', label: 'Seguridad' },
  { key: 'content',  label: 'Contenido' },
  { key: 'blocked',  label: 'Bloqueados' },
  { key: 'allowed',  label: 'Permitidos' },
]

const zones = [
  { key: 'students', level: 'Máxima protección', color: '#dc2626', border: '#fecaca', icon: ShieldExclamationIcon },
  { key: 'teachers', level: 'Protección media',  color: '#d97706', border: '#fde68a', icon: UserGroupIcon },
  { key: 'admin',    level: 'Protección básica', color: '#2563eb', border: '#bfdbfe', icon: WrenchScrewdriverIcon },
]

// ── Helpers ───────────────────────────────────────────────────────────────

function groupCats(cls) {
  return categories.value.filter(c => cls === 'security' ? c.class === 'security' : c.class !== 'security')
}
function selectedCats(key)        { return selectedCategories.value[key] || [] }
function isCatSelected(key, id)   { return selectedCats(key).includes(id) }

function toggleCat(key, id) {
  const arr = selectedCategories.value[key]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function selectAll(key, tab) {
  const ids = groupCats(tab).map(c => c.id)
  ids.forEach(id => { if (!selectedCategories.value[key].includes(id)) selectedCategories.value[key].push(id) })
}

function clearAll(key, tab) {
  const ids = groupCats(tab).map(c => c.id)
  selectedCategories.value[key] = selectedCategories.value[key].filter(id => !ids.includes(id))
}

function parseDomains(key) {
  customDomains.value[key] = [...new Set(domainInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean))]
}
function parseWhitelist(key) {
  whitelists.value[key] = [...new Set(whitelistInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean))]
}
function removeDomain(key, d)    { customDomains.value[key] = customDomains.value[key].filter(x => x !== d); domainInputs.value[key] = customDomains.value[key].join('\n') }
function removeWhitelist(key, d) { whitelists.value[key] = whitelists.value[key].filter(x => x !== d); whitelistInputs.value[key] = whitelists.value[key].join('\n') }

async function callApi(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudflare-api`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...body, org_id: selectedOrgId.value }),
    }
  )
  return await res.json()
}

function currentPayload() {
  zones.forEach(z => { parseDomains(z.key); parseWhitelist(z.key) })
  return {
    zone_students_name: zoneNames.value.students,
    zone_teachers_name: zoneNames.value.teachers,
    zone_admin_name:    zoneNames.value.admin,
    categories_students: selectedCategories.value.students,
    categories_teachers: selectedCategories.value.teachers,
    categories_admin:    selectedCategories.value.admin,
    custom_blocked_students: customDomains.value.students,
    custom_blocked_teachers: customDomains.value.teachers,
    custom_blocked_admin:    customDomains.value.admin,
    whitelist_students: whitelists.value.students,
    whitelist_teachers: whitelists.value.teachers,
    whitelist_admin:    whitelists.value.admin,
  }
}

// ── Load ──────────────────────────────────────────────────────────────────

async function loadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('cloudflare_configs')
    .select('zones_created, last_check_ok, available_categories, zone_students_doh, zone_teachers_doh, zone_admin_doh, zone_students_name, zone_teachers_name, zone_admin_name, categories_students, categories_teachers, categories_admin, custom_blocked_students, custom_blocked_teachers, custom_blocked_admin, whitelist_students, whitelist_teachers, whitelist_admin')
    .eq('org_id', selectedOrgId.value)
    .single()
  if (!data) return

  cfg.value = data
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
  whitelists.value = {
    students: data.whitelist_students || [],
    teachers: data.whitelist_teachers || [],
    admin:    data.whitelist_admin    || [],
  }
  domainInputs.value = {
    students: (data.custom_blocked_students || []).join('\n'),
    teachers: (data.custom_blocked_teachers || []).join('\n'),
    admin:    (data.custom_blocked_admin    || []).join('\n'),
  }
  whitelistInputs.value = {
    students: (data.whitelist_students || []).join('\n'),
    teachers: (data.whitelist_teachers || []).join('\n'),
    admin:    (data.whitelist_admin    || []).join('\n'),
  }
  if (data.available_categories?.length) categories.value = data.available_categories
}

// ── Actions ───────────────────────────────────────────────────────────────

async function saveOnly() {
  saving.value = true
  result.value = null
  try {
    const r = await callApi({ action: 'save_zone_config', ...currentPayload() })
    if (r.ok) {
      toast.success('Configuración guardada')
    } else {
      result.value = { ok: false, msg: r.error || 'Error al guardar' }
    }
  } catch (e) {
    result.value = { ok: false, msg: e.message }
  } finally {
    saving.value = false
  }
}

async function applyZones() {
  applying.value = true
  result.value = null
  try {
    const r = await callApi({ action: 'apply_zones', ...currentPayload() })
    if (r.ok) {
      result.value = { ok: true, msg: 'Configuración guardada y aplicada en Cloudflare Gateway' }
      toast.success('Zonas actualizadas')
      await loadConfig()
    } else {
      result.value = { ok: false, msg: r.error || 'Error al aplicar' }
    }
  } catch (e) {
    result.value = { ok: false, msg: e.message }
  } finally {
    applying.value = false
  }
}

function copyDoh(key) {
  const sub = cfg.value[`zone_${key}_doh`]
  if (sub) { navigator.clipboard.writeText(`https://${sub}.cloudflare-gateway.com/dns-query`); toast.success('URL copiada') }
}

onMounted(loadConfig)
watch(orgSwitchKey, () => { if (selectedOrgId.value) loadConfig() })
</script>
