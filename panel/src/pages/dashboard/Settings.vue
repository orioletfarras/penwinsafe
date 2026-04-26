<template>
  <div class="max-w-xl space-y-4">

    <!-- Organizacion -->
    <section class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
        <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Organizacion</p>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre del centro</label>
          <input v-model="orgName" type="text"
            class="w-full px-3 py-2 rounded text-[12px] text-white focus:outline-none transition-colors"
            style="background:#0e1016;border:1px solid rgba(255,255,255,0.07)" />
        </div>
        <div class="flex items-center justify-between">
          <p v-if="savedMsg" class="text-[11px]" :class="savedMsg.includes('Error') ? 'text-red-400' : 'text-green-400'">{{ savedMsg }}</p>
          <span v-else></span>
          <button @click="saveOrg" :disabled="saving"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-50"
            style="background:#006fff;color:white">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Filtro DNS -->
    <section class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
        <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Filtro DNS por defecto</p>
        <p class="text-[11px] mt-0.5" style="color:#374151">Se aplica a todos los grupos sin configuracion propia</p>
      </div>
      <div class="p-4 space-y-1.5">
        <label v-for="level in filterLevels" :key="level.value"
          class="flex items-start gap-3 px-3 py-2.5 rounded cursor-pointer transition-colors"
          :style="filterLevel === level.value
            ? 'background:rgba(0,111,255,0.07);border:1px solid rgba(0,111,255,0.18)'
            : 'border:1px solid transparent'">
          <input type="radio" v-model="filterLevel" :value="level.value" class="mt-0.5" style="accent-color:#006fff" />
          <div>
            <p class="text-[12px] font-medium text-white">{{ level.label }}</p>
            <p class="text-[11px] mt-0.5" style="color:#4b5563">{{ level.desc }}</p>
          </div>
        </label>
        <div class="flex justify-end pt-1">
          <button @click="saveDNS"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors"
            style="background:#006fff;color:white">
            Aplicar filtro
          </button>
        </div>
      </div>
    </section>

    <!-- Codigo de centro -->
    <section class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
        <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Codigo de centro</p>
        <p class="text-[11px] mt-0.5" style="color:#374151">Introduce este codigo al instalar PenwinSafe en un nuevo dispositivo</p>
      </div>
      <div class="p-4">
        <div class="flex items-center gap-3">
          <div class="flex-1 px-4 py-3 rounded font-mono text-[22px] font-bold text-white text-center tracking-[0.25em]"
            style="background:#0e1016;border:1px solid rgba(255,255,255,0.07)">
            {{ centerCode || '———' }}
          </div>
          <div class="flex flex-col gap-1.5">
            <button @click="copyCode"
              class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:#9ca3af">
              <ClipboardDocumentIcon class="w-3.5 h-3.5" />
              {{ copied ? 'Copiado' : 'Copiar' }}
            </button>
            <button @click="regenerateCode" :disabled="regenerating"
              class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors disabled:opacity-50"
              style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.07);color:#9ca3af">
              <ArrowPathIcon class="w-3.5 h-3.5" :class="regenerating ? 'animate-spin' : ''" />
              Nuevo codigo
            </button>
          </div>
        </div>
        <p class="text-[11px] mt-3" style="color:#374151">
          Si regeneras el codigo, los dispositivos no vinculados deberan usar el nuevo.
        </p>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="rounded overflow-hidden" style="background:#141820;border:1px solid rgba(255,255,255,0.07)">
      <div class="px-4 py-3" style="border-bottom:1px solid rgba(255,255,255,0.07)">
        <p class="text-[11px] font-semibold uppercase tracking-wider" style="color:#4b5563">Cuenta</p>
      </div>
      <div class="p-4 space-y-3">
        <div>
          <label class="block text-[11px] font-medium mb-1" style="color:#6b7280">Email</label>
          <p class="text-[12px] text-white">{{ userEmail }}</p>
        </div>
        <div>
          <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nueva contrasena</label>
          <input v-model="newPassword" type="password" placeholder="Minimo 8 caracteres"
            class="w-full px-3 py-2 rounded text-[12px] text-white focus:outline-none transition-colors"
            style="background:#0e1016;border:1px solid rgba(255,255,255,0.07)" />
        </div>
        <div class="flex items-center justify-between">
          <p v-if="pwMsg" class="text-[11px]" :class="pwMsg.includes('Error') ? 'text-red-400' : 'text-green-400'">{{ pwMsg }}</p>
          <span v-else></span>
          <button @click="changePassword" :disabled="!newPassword || newPassword.length < 8"
            class="text-[12px] font-semibold px-3 py-1.5 rounded transition-colors disabled:opacity-30"
            style="background:#006fff;color:white">
            Cambiar contrasena
          </button>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
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

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  userEmail.value = user.email

  const { data: admin } = await supabase
    .from('admin_users')
    .select('org_id, organizations(id, name, slug, center_code)')
    .eq('id', user.id)
    .single()

  if (admin?.organizations) {
    orgName.value    = admin.organizations.name
    orgId.value      = admin.organizations.id
    centerCode.value = admin.organizations.center_code || '—'
  }
})

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
