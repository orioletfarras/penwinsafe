<template>
  <div class="max-w-2xl space-y-5">

    <!-- Organización -->
    <section class="rounded-xl border border-white/6 overflow-hidden" style="background:#0b0e16">
      <div class="px-5 py-4 border-b border-white/6">
        <h2 class="text-sm font-semibold text-white">Organización</h2>
        <p class="text-xs mt-0.5" style="color:#6b7280">Información del centro escolar</p>
      </div>
      <div class="p-5 space-y-4">
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:#9ca3af">Nombre del centro</label>
          <input v-model="orgName" type="text"
            class="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none transition-colors"
            style="background:#0d1117;border:1px solid rgba(255,255,255,0.08)" />
        </div>
        <div class="flex justify-end">
          <button @click="saveOrg" :disabled="saving"
            class="text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
            style="background:#2563eb;color:white">
            {{ saving ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </div>
        <p v-if="savedMsg" class="text-xs text-green-400">{{ savedMsg }}</p>
      </div>
    </section>

    <!-- Filtro DNS -->
    <section class="rounded-xl border border-white/6 overflow-hidden" style="background:#0b0e16">
      <div class="px-5 py-4 border-b border-white/6">
        <h2 class="text-sm font-semibold text-white">Filtro DNS por defecto</h2>
        <p class="text-xs mt-0.5" style="color:#6b7280">Se aplica a todos los grupos sin configuración propia</p>
      </div>
      <div class="p-5 space-y-2">
        <label v-for="level in filterLevels" :key="level.value"
          class="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-white/3"
          :style="filterLevel === level.value ? 'background:rgba(37,99,235,0.08);border:1px solid rgba(37,99,235,0.2)' : 'border:1px solid transparent'">
          <input type="radio" v-model="filterLevel" :value="level.value" class="mt-0.5 accent-blue-600" />
          <div>
            <p class="text-sm font-medium text-white">{{ level.label }}</p>
            <p class="text-xs mt-0.5" style="color:#6b7280">{{ level.desc }}</p>
          </div>
        </label>
        <div class="flex justify-end pt-2">
          <button @click="saveDNS" class="text-sm font-semibold px-4 py-2 rounded-lg transition-colors" style="background:#2563eb;color:white">
            Aplicar filtro
          </button>
        </div>
      </div>
    </section>

    <!-- Código de centro -->
    <section class="rounded-xl border border-white/6 overflow-hidden" style="background:#0b0e16">
      <div class="px-5 py-4 border-b border-white/6">
        <h2 class="text-sm font-semibold text-white">Código de centro</h2>
        <p class="text-xs mt-0.5" style="color:#6b7280">Introduce este código al instalar PenwinSafe en un nuevo dispositivo</p>
      </div>
      <div class="p-5">
        <div class="flex items-center gap-3">
          <div class="flex-1 px-4 py-3 rounded-lg font-mono text-lg font-bold tracking-widest text-white text-center"
            style="background:#0d1117;border:1px solid rgba(255,255,255,0.08);letter-spacing:0.3em">
            {{ centerCode || '———' }}
          </div>
          <button @click="copyCode"
            class="flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-lg transition-colors"
            style="background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);color:#9ca3af">
            <ClipboardDocumentIcon class="w-4 h-4" />
            {{ copied ? 'Copiado' : 'Copiar' }}
          </button>
        </div>
        <p class="text-xs mt-3" style="color:#4b5563">
          Este código identifica tu centro. Cada dispositivo con PenwinSafe lo usará una sola vez para vincularse automáticamente.
        </p>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="rounded-xl border border-white/6 overflow-hidden" style="background:#0b0e16">
      <div class="px-5 py-4 border-b border-white/6">
        <h2 class="text-sm font-semibold text-white">Cuenta</h2>
      </div>
      <div class="p-5 space-y-3">
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:#9ca3af">Email</label>
          <p class="text-sm text-white">{{ userEmail }}</p>
        </div>
        <div>
          <label class="block text-xs font-medium mb-1.5" style="color:#9ca3af">Nueva contraseña</label>
          <input v-model="newPassword" type="password" placeholder="Mínimo 8 caracteres"
            class="w-full px-3 py-2.5 rounded-lg text-sm text-white focus:outline-none transition-colors"
            style="background:#0d1117;border:1px solid rgba(255,255,255,0.08)" />
        </div>
        <div class="flex justify-end">
          <button @click="changePassword" :disabled="!newPassword || newPassword.length < 8"
            class="text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-30"
            style="background:#2563eb;color:white">
            Cambiar contraseña
          </button>
        </div>
        <p v-if="pwMsg" class="text-xs" :class="pwMsg.includes('Error') ? 'text-red-400' : 'text-green-400'">{{ pwMsg }}</p>
      </div>
    </section>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'

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

const filterLevels = [
  { value: 'family',   label: 'Family Filter',   desc: 'Bloquea contenido adulto, proxies y anuncios. Recomendado para primaria.' },
  { value: 'adult',    label: 'Adult Filter',    desc: 'Bloquea solo contenido adulto explícito. Para secundaria.' },
  { value: 'security', label: 'Security Filter', desc: 'Solo bloquea malware y phishing. Filtrado mínimo.' },
]

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  userEmail.value = user.email

  const { data: admin } = await supabase
    .from('admin_users')
    .select('org_id, organizations(id, name, slug)')
    .eq('id', user.id)
    .single()

  if (admin?.organizations) {
    orgName.value    = admin.organizations.name
    orgId.value      = admin.organizations.id
    centerCode.value = admin.organizations.slug.toUpperCase().replace(/-/g, '')
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
  pwMsg.value = error ? `Error: ${error.message}` : 'Contraseña actualizada'
  if (!error) newPassword.value = ''
  setTimeout(() => pwMsg.value = '', 4000)
}

async function copyCode() {
  await navigator.clipboard.writeText(centerCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}
</script>
