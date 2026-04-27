<template>
  <div class="max-w-xl space-y-4">

    <!-- Organizacion -->
    <section class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Organizacion</p>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre del centro</label>
          <input v-model="orgName" type="text"
            class="w-full px-3 py-2 rounded text-[12px] focus:outline-none transition-colors"
            style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
        </div>
        <div class="flex items-center justify-between">
          <p v-if="savedMsg" class="text-[11px]" :class="savedMsg.includes('Error') ? 'text-red-600' : 'text-green-700'">{{ savedMsg }}</p>
          <span v-else></span>
          <button @click="saveOrg" :disabled="saving"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            style="background:#006fff;color:#ffffff">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Filtro DNS -->
    <section class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Filtro DNS por defecto</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Se aplica a todos los grupos sin configuracion propia</p>
      </div>
      <div class="p-4 space-y-1.5">
        <label v-for="level in filterLevels" :key="level.value"
          class="flex items-start gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors"
          :style="filterLevel === level.value
            ? 'background:#eff6ff;border:1px solid #bfdbfe'
            : 'border:1px solid transparent'">
          <input type="radio" v-model="filterLevel" :value="level.value" class="mt-0.5" style="accent-color:#006fff" />
          <div>
            <p class="text-[12px] font-medium" style="color:#111827">{{ level.label }}</p>
            <p class="text-[11px] mt-0.5" style="color:#6b7280">{{ level.desc }}</p>
          </div>
        </label>
        <div class="flex justify-end pt-1">
          <button @click="saveDNS"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors"
            style="background:#006fff;color:#ffffff">
            Aplicar filtro
          </button>
        </div>
      </div>
    </section>

    <!-- Codigo de centro -->
    <section class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Codigo de centro</p>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Introduce este codigo al instalar PenwinSafe en un nuevo dispositivo</p>
      </div>
      <div class="p-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 px-4 py-3 rounded font-mono text-[22px] font-bold text-center tracking-[0.25em]"
            style="background:#f9fafb;border:1px solid #e5e7eb;color:#111827">
            {{ centerCode || '———' }}
          </div>
          <div class="flex flex-col gap-1.5">
            <button @click="copyCode"
              class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors"
              style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
              <ClipboardDocumentIcon class="w-3.5 h-3.5" />
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
            <button @click="regenerateCode" :disabled="regenerating"
              class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
              style="background:#ffffff;border:1px solid #e5e7eb;color:#374151">
              <ArrowPathIcon class="w-3.5 h-3.5" :class="regenerating ? 'animate-spin' : ''" />
              Nuevo codigo
            </button>
          </div>
        </div>
        <p class="text-[11px] mt-3" style="color:#9ca3af">
          Si regeneras el codigo, los dispositivos no vinculados deberan usar el nuevo.
        </p>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Cuenta</p>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <label class="block text-[11px] font-medium mb-1" style="color:#6b7280">Email</label>
          <p class="text-[12px]" style="color:#111827">{{ userEmail }}</p>
        </div>
        <div>
          <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nueva contrasena</label>
          <input v-model="newPassword" type="password" placeholder="Minimo 8 caracteres"
            class="w-full px-3 py-2 rounded text-[12px] focus:outline-none transition-colors"
            style="background:#ffffff;border:1px solid #e5e7eb;color:#111827" />
        </div>
        <div class="flex items-center justify-between">
          <p v-if="pwMsg" class="text-[11px]" :class="pwMsg.includes('Error') ? 'text-red-600' : 'text-green-700'">{{ pwMsg }}</p>
          <span v-else></span>
          <button @click="changePassword" :disabled="!newPassword || newPassword.length < 8"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-30"
            style="background:#006fff;color:#ffffff">
            Cambiar contrasena
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, orgSwitchKey } from '../../lib/orgStore'
import { ClipboardDocumentIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

const orgName     = ref('')
const orgId       = ref('')
const centerCode  = ref('')
const filterLevel = ref('family')
const userEmail   = ref('')
const newPassword = ref('')
const saving      = ref(false)
const savedMsg    = ref('')
const pwMsg       = ref('')
const copied      = ref(false)
const regenerating = ref(false)

const filterLevels = [
  { value: 'family',   label: 'Family Filter',   desc: 'Bloquea contenido adulto, proxies y anuncios. Recomendado para primaria.' },
  { value: 'adult',    label: 'Adult Filter',    desc: 'Bloquea solo contenido adulto explicito. Para secundaria.' },
  { value: 'security', label: 'Security Filter', desc: 'Solo bloquea malware y phishing. Filtrado minimo.' },
]

async function loadSettings() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  userEmail.value = user.email

  const targetOrg = selectedOrgId.value
  if (!targetOrg) return

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, center_code')
    .eq('id', targetOrg)
    .single()

  if (org) {
    orgName.value    = org.name
    orgId.value      = org.id
    centerCode.value = org.center_code || '—'
  }
}

onMounted(loadSettings)
watch(orgSwitchKey, loadSettings)

async function saveOrg() {
  if (!orgId.value) return
  saving.value = true
  savedMsg.value = ''
  const { error } = await supabase.from('organizations').update({ name: orgName.value }).eq('id', orgId.value)
  saving.value = false
  savedMsg.value = error ? `Error: ${error.message}` : 'Guardado correctamente'
  setTimeout(() => savedMsg.value = '', 3000)
}

async function saveDNS() {
  if (!orgId.value) return
  await supabase.from('groups').update({ filter_level: filterLevel.value }).eq('org_id', orgId.value)
}

async function changePassword() {
  pwMsg.value = ''
  const { error } = await supabase.auth.updateUser({ password: newPassword.value })
  pwMsg.value = error ? `Error: ${error.message}` : 'Contrasena actualizada'
  if (!error) newPassword.value = ''
  setTimeout(() => pwMsg.value = '', 4000)
}

async function copyCode() {
  await navigator.clipboard.writeText(centerCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

async function regenerateCode() {
  if (!orgId.value) return
  regenerating.value = true
  const { data, error } = await supabase.rpc('generate_center_code')
  if (!error && data) {
    await supabase.from('organizations').update({ center_code: data }).eq('id', orgId.value)
    centerCode.value = data
  }
  regenerating.value = false
}
</script>
