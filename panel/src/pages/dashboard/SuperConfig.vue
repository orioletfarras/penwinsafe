<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-[18px] font-semibold" style="color:#111827">SuperConfig</h1>
      <p class="text-[13px] mt-1" style="color:#6b7280">
        Configuración avanzada para <strong>{{ currentOrgName }}</strong>
      </p>
    </div>

    <!-- New school form -->
    <div v-if="showNewOrg" class="card p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#faf5ff">
          <PlusCircleIcon class="w-4 h-4" style="color:#7c3aed" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Crear nuevo colegio</h2>
          <p class="text-[12px]" style="color:#6b7280">Añade un nuevo centro educativo a PenwinSafe</p>
        </div>
        <button @click="showNewOrg = false" class="text-[11px] px-2 py-1 rounded transition-colors"
          style="color:#9ca3af"
          @mouseenter="e => e.currentTarget.style.color='#374151'"
          @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
          Cancelar
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Nombre del colegio</label>
          <input v-model="newOrgForm.name" @input="onOrgNameInput" type="text" placeholder="IES Ejemplo"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#7c3aed'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Slug (identificador único)</label>
          <input v-model="newOrgForm.slug" type="text" placeholder="ies-ejemplo"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-mono transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#7c3aed'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
          <p class="text-[11px] mt-1" style="color:#9ca3af">Solo letras minúsculas, números y guiones</p>
        </div>
        <div class="flex gap-3 pt-1">
          <button @click="createOrg" :disabled="creatingOrg"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity"
            style="background:#7c3aed"
            :style="creatingOrg ? 'opacity:0.6' : ''">
            <ArrowPathIcon v-if="creatingOrg" class="w-3.5 h-3.5 animate-spin" />
            <PlusCircleIcon v-else class="w-3.5 h-3.5" />
            {{ creatingOrg ? 'Creando...' : 'Crear colegio' }}
          </button>
        </div>
        <p v-if="newOrgMsg" class="text-[12px]" :style="newOrgOk ? 'color:#16a34a' : 'color:#dc2626'">
          {{ newOrgMsg }}
        </p>
      </div>
    </div>

    <!-- New school toggle (when form hidden) -->
    <div v-else class="flex justify-end">
      <button @click="showNewOrg = true"
        class="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors"
        style="color:#7c3aed;border:1px solid #e9d5ff;background:#faf5ff"
        @mouseenter="e => e.currentTarget.style.background='#f3e8ff'"
        @mouseleave="e => e.currentTarget.style.background='#faf5ff'">
        <PlusCircleIcon class="w-3.5 h-3.5" />
        Crear nuevo colegio
      </button>
    </div>

    <!-- UniFi Connection wizard -->
    <div class="card overflow-hidden">

      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4" style="border-bottom:1px solid #f3f4f6">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#eff6ff">
          <WifiIcon class="w-4 h-4" style="color:#006fff" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Controlador UniFi</h2>
          <p class="text-[12px]" style="color:#6b7280">Vincula el UXG Pro de este colegio</p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="config.last_check_ok === true"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Conectado
          </span>
          <span v-else-if="config.last_check_ok === false"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
            Error de conexión
          </span>
          <button v-if="config.last_check_ok === true" @click="wStep = 1; wDone = false"
            class="text-[11px] px-2 py-1 rounded transition-colors"
            style="color:#6b7280;border:1px solid #e5e7eb"
            @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
            @mouseleave="e => e.currentTarget.style.background='transparent'">
            Reconfigurar
          </button>
        </div>
      </div>

      <!-- Connected summary -->
      <div v-if="config.last_check_ok === true && !wDone && wStep === 0" class="px-6 py-4">
        <div class="flex items-center gap-3 p-3 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
          <CheckCircleIcon class="w-4 h-4 flex-shrink-0" style="color:#16a34a" />
          <div>
            <p class="text-[12px] font-medium" style="color:#15803d">Controlador conectado</p>
            <p class="text-[11px] mt-0.5" style="color:#16a34a">{{ config.controller_url }} · Site: {{ config.site_id }}</p>
          </div>
        </div>
      </div>

      <!-- Wizard steps -->
      <div v-else class="px-6 py-5">

        <!-- Step indicators -->
        <div class="flex items-center gap-2 mb-6">
          <div v-for="(s, i) in wSteps" :key="i" class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                :style="wStep > i
                  ? 'background:#006fff;color:#fff'
                  : wStep === i
                    ? 'background:#006fff;color:#fff'
                    : 'background:#f3f4f6;color:#9ca3af'">
                <CheckCircleIcon v-if="wStep > i" class="w-3 h-3" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="text-[11px] font-medium"
                :style="wStep === i ? 'color:#006fff' : wStep > i ? 'color:#374151' : 'color:#9ca3af'">
                {{ s }}
              </span>
            </div>
            <div v-if="i < wSteps.length - 1" class="flex-1 h-px w-6"
              :style="wStep > i ? 'background:#006fff' : 'background:#e5e7eb'"></div>
          </div>
        </div>

        <!-- Step 1: Controller URL -->
        <div v-if="wStep === 1" class="space-y-4">
          <div>
            <label class="block text-[12px] font-medium mb-1" style="color:#374151">URL del controlador UniFi</label>
            <p class="text-[11px] mb-2" style="color:#9ca3af">La dirección donde accedes al panel de UniFi. Incluye el puerto si es necesario.</p>
            <input v-model="form.controller_url" type="text" placeholder="https://192.168.1.1"
              class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
              style="border:1px solid #d1d5db;color:#111827"
              @focus="e => e.target.style.borderColor='#006fff'"
              @blur="e => e.target.style.borderColor='#d1d5db'"
              @keydown.enter="wStep1Next" />
          </div>
          <div class="flex justify-end">
            <button @click="wStep1Next" :disabled="!form.controller_url.trim()"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="!form.controller_url.trim() ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              Continuar
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Step 2: Credentials -->
        <div v-if="wStep === 2" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Usuario</label>
              <input v-model="form.username" type="text" placeholder="admin"
                class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#006fff'"
                @blur="e => e.target.style.borderColor='#d1d5db'" />
            </div>
            <div>
              <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Contraseña</label>
              <input v-model="form.password" type="password" placeholder="••••••••"
                class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#006fff'"
                @blur="e => e.target.style.borderColor='#d1d5db'"
                @keydown.enter="fetchSites" />
            </div>
          </div>
          <div class="flex items-center justify-between pt-1">
            <button @click="wStep = 1" class="text-[12px]" style="color:#6b7280">← Volver</button>
            <button @click="fetchSites" :disabled="fetchingSites || !form.username || !form.password"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="(fetchingSites || !form.username || !form.password) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              <ArrowPathIcon v-if="fetchingSites" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ fetchingSites ? 'Conectando...' : 'Conectar' }}</span>
            </button>
          </div>
          <p v-if="fetchSitesError" class="text-[12px]" style="color:#dc2626">{{ fetchSitesError }}</p>
        </div>

        <!-- Step 3: Select site -->
        <div v-if="wStep === 3" class="space-y-4">
          <div>
            <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Selecciona el site</label>
            <p class="text-[11px] mb-2" style="color:#9ca3af">Estos son los sites disponibles en tu controlador.</p>
            <select v-model="form.site_id"
              class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
              style="border:1px solid #d1d5db;color:#111827;background:#fff"
              @focus="e => e.target.style.borderColor='#006fff'"
              @blur="e => e.target.style.borderColor='#d1d5db'">
              <option v-for="s in availableSites" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="flex items-center justify-between pt-1">
            <button @click="wStep = 2" class="text-[12px]" style="color:#6b7280">← Volver</button>
            <button @click="testAndSave" :disabled="savingConfig || !form.site_id"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="(savingConfig || !form.site_id) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              <ArrowPathIcon v-if="savingConfig" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ savingConfig ? 'Verificando...' : 'Confirmar site' }}</span>
            </button>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-if="wStep === 4" class="space-y-4">
          <div v-if="saveOk" class="flex items-start gap-3 p-4 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
            <CheckCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#16a34a" />
            <div>
              <p class="text-[13px] font-medium" style="color:#15803d">Conexión establecida</p>
              <p class="text-[12px] mt-0.5" style="color:#16a34a">{{ saveMsg }}</p>
            </div>
          </div>
          <div v-else class="flex items-start gap-3 p-4 rounded-lg" style="background:#fef2f2;border:1px solid #fecaca">
            <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#dc2626" />
            <div>
              <p class="text-[13px] font-medium" style="color:#991b1b">No se pudo conectar</p>
              <p class="text-[12px] mt-0.5" style="color:#dc2626">{{ saveMsg }}</p>
            </div>
          </div>
          <div class="flex justify-end">
            <button v-if="!saveOk" @click="wStep = 1"
              class="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
              style="border:1px solid #e5e7eb;color:#374151"
              @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
              @mouseleave="e => e.currentTarget.style.background='transparent'">
              Reintentar
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- PenwinSafe Network -->
    <div class="card p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
          :style="config.network_active ? 'background:#f0fdf4' : 'background:#f9fafb'">
          <ShieldCheckIcon class="w-4 h-4" :style="config.network_active ? 'color:#16a34a' : 'color:#9ca3af'" />
        </div>
        <div>
          <h2 class="text-[14px] font-semibold" style="color:#111827">Red PenwinSafe</h2>
          <p class="text-[12px]" style="color:#6b7280">VLAN + SSID + WireGuard + firewall</p>
        </div>
        <div class="ml-auto">
          <span v-if="config.network_active"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Activa
          </span>
          <span v-else
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">
            Inactiva
          </span>
        </div>
      </div>

      <!-- What will be created -->
      <div v-if="!config.network_active" class="mb-5 space-y-2">
        <p class="text-[12px] font-medium mb-2" style="color:#374151">Se creará automáticamente:</p>
        <div v-for="item in setupItems" :key="item.label"
          class="flex items-start gap-2.5 text-[12px]" style="color:#6b7280">
          <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style="background:#006fff"></div>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Active info -->
      <div v-else class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-lg p-3" style="background:#f9fafb;border:1px solid #e5e7eb">
          <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#9ca3af">VLAN ID</p>
          <p class="text-[12px] font-mono font-medium" style="color:#111827">{{ config.vlan_network_id || '—' }}</p>
        </div>
        <div class="rounded-lg p-3" style="background:#f9fafb;border:1px solid #e5e7eb">
          <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#9ca3af">SSID</p>
          <p class="text-[12px] font-mono font-medium" style="color:#111827">PenwinSafe</p>
        </div>
      </div>

      <!-- Setup result -->
      <div v-if="setupResult" class="mb-4 rounded-lg p-3"
        :style="setupResult.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
        <div v-for="(msg, i) in setupResult.checks" :key="i"
          class="flex items-center gap-2 text-[12px] mb-1" style="color:#16a34a">
          <CheckCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
          {{ msg }}
        </div>
        <div v-for="(err, i) in setupResult.errors" :key="'e'+i"
          class="flex items-center gap-2 text-[12px] mb-1" style="color:#dc2626">
          <ExclamationCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
          {{ err }}
        </div>
      </div>

      <div class="flex gap-3">
        <button v-if="!config.network_active" @click="activateNetwork"
          :disabled="!config.last_check_ok || activating"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
          :style="(!config.last_check_ok || activating) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
          <ArrowPathIcon v-if="activating" class="w-3.5 h-3.5 animate-spin" />
          <WifiIcon v-else class="w-3.5 h-3.5" />
          {{ activating ? 'Configurando...' : 'Activar red PenwinSafe' }}
        </button>
        <button v-else @click="activateNetwork"
          :disabled="activating"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151">
          <ArrowPathIcon class="w-3.5 h-3.5" :class="activating ? 'animate-spin' : ''" />
          Reconfigurar
        </button>
      </div>
      <p v-if="!config.last_check_ok && !config.network_active" class="text-[11px] mt-2" style="color:#9ca3af">
        Guarda y verifica la conexión UniFi primero
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs, switchOrg, loadUserContext, orgSwitchKey } from '../../lib/orgStore'
import {
  WifiIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon, PlusCircleIcon, ArrowRightIcon
} from '@heroicons/vue/24/outline'

const route  = useRoute()
const router = useRouter()

// ── New org form ──────────────────────────────────────────────────────────
const showNewOrg  = ref(route.query.new === '1')
const newOrgForm  = ref({ name: '', slug: '' })
const creatingOrg = ref(false)
const newOrgMsg   = ref('')
const newOrgOk    = ref(false)

function autoSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onOrgNameInput() {
  newOrgForm.value.slug = autoSlug(newOrgForm.value.name)
}

async function createOrg() {
  if (!newOrgForm.value.name.trim() || !newOrgForm.value.slug.trim()) {
    newOrgMsg.value = 'Rellena el nombre y el slug'
    newOrgOk.value = false
    return
  }
  creatingOrg.value = true
  newOrgMsg.value = ''
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: newOrgForm.value.name.trim(), slug: newOrgForm.value.slug.trim() })
      .select('id, name, slug')
      .single()
    if (error) throw error
    newOrgMsg.value = `Colegio "${data.name}" creado correctamente`
    newOrgOk.value = true
    newOrgForm.value = { name: '', slug: '' }
    // Reload org list and switch to new org
    await loadUserContext()
    await switchOrg(data.id)
    router.replace('/dashboard/superconfig')
    showNewOrg.value = false
    await loadConfig()
  } catch (e) {
    newOrgMsg.value = `Error: ${e.message}`
    newOrgOk.value = false
  } finally {
    creatingOrg.value = false
  }
}

const currentOrgName = computed(() =>
  allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || '...'
)

const config = ref({
  controller_url: '',
  site_id: '',
  username: '',
  password: '',
  network_active: false,
  vlan_network_id: null,
  wlan_id: null,
  last_check_ok: null,
  last_check_msg: null,
})

const form = ref({
  controller_url: '',
  site_id: '',
  username: '',
  password: '',
})

const savingConfig = ref(false)
const saveMsg      = ref('')
const saveOk       = ref(false)
const activating   = ref(false)
const setupResult  = ref(null)

// Wizard
const wSteps = ['URL', 'Credenciales', 'Site', 'Resultado']
const wStep  = ref(1)   // 0 = show summary if connected, 1-4 = wizard steps
const wDone  = ref(false)

const fetchingSites  = ref(false)
const fetchSitesError = ref('')
const availableSites = ref([])

function wStep1Next() {
  let url = form.value.controller_url.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  form.value.controller_url = url
  wStep.value = 2
}

async function fetchSites() {
  if (!form.value.username || !form.value.password) return
  fetchingSites.value = true
  fetchSitesError.value = ''
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_sites',
          controller_url: form.value.controller_url,
          username: form.value.username,
          password: form.value.password,
        }),
      }
    )
    const result = await res.json()
    if (!result.ok) throw new Error(result.error || 'Error desconocido')
    availableSites.value = result.sites
    if (result.sites.length === 1) form.value.site_id = result.sites[0].id
    wStep.value = 3
  } catch (e) {
    fetchSitesError.value = e.message
  } finally {
    fetchingSites.value = false
  }
}

const setupItems = [
  { label: 'VLAN "PenwinSafe" (VLAN 99 — 10.99.0.0/24)' },
  { label: 'SSID "PenwinSafe" asociado a esa VLAN' },
  { label: 'Reglas firewall: bloquear HTTP/HTTPS directo desde VLAN PenwinSafe' },
  { label: 'Servidor WireGuard para túnel seguro' },
]

async function loadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('unifi_configs')
    .select('*')
    .eq('org_id', selectedOrgId.value)
    .single()
  if (data) {
    config.value = data
    form.value = {
      controller_url: data.controller_url || '',
      site_id:        data.site_id || '',
      username:       data.username || '',
      password:       data.password || '',
    }
    // If already connected, show summary; otherwise start wizard from step 1
    if (data.last_check_ok === true) {
      wStep.value = 0
      if (data.site_id) availableSites.value = [{ id: data.site_id, label: data.site_id }]
    } else {
      wStep.value = 1
    }
  } else {
    wStep.value = 1
  }
}

async function callUnifiApi(action, extra = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, org_id: selectedOrgId.value, ...extra }),
    }
  )
  return await res.json()
}

async function testAndSave() {
  if (!form.value.controller_url || !form.value.site_id || !form.value.username || !form.value.password) {
    saveMsg.value = 'Rellena todos los campos'
    saveOk.value = false
    return
  }

  savingConfig.value = true
  saveMsg.value = ''

  try {
    await supabase.from('unifi_configs').upsert({
      org_id:         selectedOrgId.value,
      controller_url: form.value.controller_url,
      site_id:        form.value.site_id,
      username:       form.value.username,
      password:       form.value.password,
    })

    const result = await callUnifiApi('check')

    if (result.ok) {
      await supabase.from('unifi_configs').update({
        last_check_ok: true,
        last_check_at: new Date().toISOString(),
        last_check_msg: `OK — ${result.device_count} dispositivos, firmware ${result.sysinfo?.version || '?'}`,
      }).eq('org_id', selectedOrgId.value)
      saveMsg.value = `Conectado. ${result.device_count} dispositivo(s) en el site.`
      saveOk.value = true
      config.value.last_check_ok = true
    } else {
      await supabase.from('unifi_configs').update({
        last_check_ok: false,
        last_check_at: new Date().toISOString(),
        last_check_msg: result.error || 'Error desconocido',
      }).eq('org_id', selectedOrgId.value)
      saveMsg.value = result.error || 'Error desconocido'
      saveOk.value = false
    }
    wStep.value = 4
    await loadConfig()
  } catch (e) {
    saveMsg.value = e.message
    saveOk.value = false
    wStep.value = 4
  } finally {
    savingConfig.value = false
  }
}

async function activateNetwork() {
  activating.value = true
  setupResult.value = null
  try {
    const result = await callUnifiApi('setup')
    // Normalize: edge function may return { error: "..." } instead of { errors: [...] }
    if (!result.errors) result.errors = result.error ? [result.error] : []
    if (!result.checks) result.checks = []
    setupResult.value = result
    if (result.ok) await loadConfig()
  } catch (e) {
    setupResult.value = { ok: false, checks: [], errors: [e.message] }
  } finally {
    activating.value = false
  }
}

onMounted(loadConfig)
watch(orgSwitchKey, () => { if (selectedOrgId.value) loadConfig() })
</script>
