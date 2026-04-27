<template>
  <div class="max-w-2xl mx-auto space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-[18px] font-semibold" style="color:#111827">SuperConfig</h1>
      <p class="text-[13px] mt-1" style="color:#6b7280">
        Configuración avanzada para <strong>{{ currentOrgName }}</strong>
      </p>
    </div>

    <!-- UniFi Connection -->
    <div class="rounded-xl p-6" style="background:#fff;border:1px solid #e5e7eb">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#eff6ff">
          <WifiIcon class="w-4 h-4" style="color:#006fff" />
        </div>
        <div>
          <h2 class="text-[14px] font-semibold" style="color:#111827">Controlador UniFi</h2>
          <p class="text-[12px]" style="color:#6b7280">Vincula el UXG Pro de este colegio</p>
        </div>
        <!-- Status badge -->
        <div class="ml-auto">
          <span v-if="config.last_check_ok === true"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Conectado
          </span>
          <span v-else-if="config.last_check_ok === false"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
            Error
          </span>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">URL del controlador</label>
          <input v-model="form.controller_url" type="text" placeholder="https://mi-unifi.ejemplo.com"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#006fff'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Site ID</label>
          <input v-model="form.site_id" type="text" placeholder="default"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#006fff'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>
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
              @blur="e => e.target.style.borderColor='#d1d5db'" />
          </div>
        </div>

        <div class="flex gap-3 pt-1">
          <button @click="testAndSave"
            :disabled="savingConfig"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity"
            style="background:#006fff"
            :style="savingConfig ? 'opacity:0.6' : ''">
            <ArrowPathIcon v-if="savingConfig" class="w-3.5 h-3.5 animate-spin" />
            <CheckCircleIcon v-else class="w-3.5 h-3.5" />
            {{ savingConfig ? 'Verificando...' : 'Guardar y verificar' }}
          </button>
        </div>

        <p v-if="saveMsg" class="text-[12px] mt-2"
          :style="saveOk ? 'color:#16a34a' : 'color:#dc2626'">
          {{ saveMsg }}
        </p>
      </div>
    </div>

    <!-- PenwinSafe Network -->
    <div class="rounded-xl p-6" style="background:#fff;border:1px solid #e5e7eb">
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
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs } from '../../lib/orgStore'
import {
  WifiIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/vue/24/outline'

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

const setupItems = [
  { label: 'VLAN "PenwinSafe" (VLAN 99 — 10.99.0.0/24)' },
  { label: 'SSID "PenwinSafe" asociado a esa VLAN' },
  { label: 'Reglas firewall: bloquear HTTP/HTTPS directo desde VLAN PenwinSafe' },
  { label: 'Servidor WireGuard para túnel seguro (próximamente)' },
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
      controller_url: data.controller_url,
      site_id:        data.site_id,
      username:       data.username,
      password:       data.password,
    }
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
    // First upsert the config so edge function can read it
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
      saveMsg.value = `Conectado correctamente. ${result.device_count} dispositivo(s) en el site.`
      saveOk.value = true
    } else {
      await supabase.from('unifi_configs').update({
        last_check_ok: false,
        last_check_at: new Date().toISOString(),
        last_check_msg: result.error || 'Error desconocido',
      }).eq('org_id', selectedOrgId.value)
      saveMsg.value = `Error: ${result.error}`
      saveOk.value = false
    }
    await loadConfig()
  } catch (e) {
    saveMsg.value = `Error: ${e.message}`
    saveOk.value = false
  } finally {
    savingConfig.value = false
  }
}

async function activateNetwork() {
  activating.value = true
  setupResult.value = null
  try {
    const result = await callUnifiApi('setup')
    setupResult.value = result
    if (result.ok) await loadConfig()
  } catch (e) {
    setupResult.value = { ok: false, checks: [], errors: [e.message] }
  } finally {
    activating.value = false
  }
}

onMounted(loadConfig)
</script>
