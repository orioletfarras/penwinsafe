<template>
  <div class="space-y-4">

    <!-- Organizacion -->
    <section class="card overflow-hidden">
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
    <section class="card overflow-hidden">
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
    <section class="card overflow-hidden">
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

    <!-- API Key -->
    <section class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-2">
          <KeyIcon class="w-3.5 h-3.5" style="color:#9ca3af" />
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">API pública</p>
        </div>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Integra PenwinSafe con tus propias herramientas mediante la API REST</p>
      </div>
      <div class="p-4 space-y-3">
        <div v-if="apiKey">
          <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Tu API key</label>
          <div class="flex items-center gap-2">
            <div class="flex-1 px-3 py-2 rounded font-mono text-[12px]" style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">
              {{ apiKeyVisible ? apiKey : apiKey.slice(0, 8) + '•'.repeat(32) }}
            </div>
            <button @click="apiKeyVisible = !apiKeyVisible" class="btn btn-secondary btn-sm">{{ apiKeyVisible ? 'Ocultar' : 'Ver' }}</button>
            <button @click="copyApiKey" class="btn btn-secondary btn-sm">
              <ClipboardDocumentIcon class="w-3.5 h-3.5" />
              {{ apiKeyCopied ? 'Copiado' : 'Copiar' }}
            </button>
          </div>
        </div>
        <div v-else class="text-[12px]" style="color:#6b7280">No tienes una API key generada todavía.</div>
        <div class="flex items-center gap-2">
          <button @click="generateApiKey" :disabled="generatingKey" class="btn btn-secondary btn-sm">
            <ArrowPathIcon class="w-3.5 h-3.5" :class="generatingKey ? 'animate-spin' : ''" />
            {{ apiKey ? 'Regenerar key' : 'Generar API key' }}
          </button>
        </div>
        <div class="rounded p-3 text-[11px] leading-relaxed" style="background:#f9fafb;border:1px solid #e5e7eb;color:#6b7280">
          <p class="font-semibold mb-1" style="color:#374151">Endpoints disponibles:</p>
          <p><span class="font-mono" style="color:#006fff">GET /functions/v1/api/devices</span> — Lista de dispositivos</p>
          <p><span class="font-mono" style="color:#006fff">GET /functions/v1/api/alerts</span> — Alertas activas</p>
          <p class="mt-1">Incluye <span class="font-mono">Authorization: Bearer &lt;api-key&gt;</span> en el header.</p>
        </div>
      </div>
    </section>

    <!-- 2FA -->
    <section class="card overflow-hidden">
      <div class="px-4 py-3" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-2">
          <ShieldCheckIcon class="w-3.5 h-3.5" style="color:#9ca3af" />
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Autenticación en dos pasos (2FA)</p>
        </div>
        <p class="text-[11px] mt-0.5" style="color:#6b7280">Añade una capa extra de seguridad a tu cuenta</p>
      </div>
      <div class="p-4 space-y-3">
        <!-- Active factors -->
        <div v-if="mfaFactors.length">
          <div v-for="f in mfaFactors" :key="f.id"
            class="flex items-center justify-between px-3 py-2.5 rounded"
            style="background:#f0fdf4;border:1px solid #bbf7d0">
            <div class="flex items-center gap-2.5">
              <ShieldCheckIcon class="w-4 h-4" style="color:#16a34a" />
              <div>
                <p class="text-[12px] font-medium" style="color:#166534">2FA activado</p>
                <p class="text-[11px]" style="color:#4ade80">{{ f.friendly_name || 'Authenticator' }}</p>
              </div>
            </div>
            <button @click="unenroll2FA(f.id)" class="btn btn-secondary btn-sm" style="color:#dc2626">Desactivar</button>
          </div>
        </div>
        <!-- Enroll flow -->
        <div v-else>
          <div v-if="!mfaQR">
            <p class="text-[12px] mb-3" style="color:#6b7280">Usa una aplicación como Google Authenticator o Authy para proteger tu cuenta.</p>
            <button @click="enroll2FA" :disabled="mfaEnrolling" class="btn btn-primary btn-sm">
              <QrCodeIcon class="w-3.5 h-3.5" />
              {{ mfaEnrolling ? 'Generando...' : 'Activar 2FA' }}
            </button>
          </div>
          <div v-else class="space-y-4">
            <div class="flex gap-6 items-start">
              <img :src="mfaQR" alt="QR 2FA" class="w-36 h-36 rounded border" style="border-color:#e5e7eb" />
              <div>
                <p class="text-[12px] font-medium mb-1" style="color:#111827">Escanea el código QR</p>
                <p class="text-[11px] mb-3" style="color:#6b7280">Con tu app de autenticación (Google Authenticator, Authy, etc.)</p>
                <p class="text-[10px] font-medium mb-1" style="color:#9ca3af">O introduce manualmente:</p>
                <p class="font-mono text-[11px] px-2 py-1 rounded" style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151;word-break:break-all">{{ mfaSecret }}</p>
              </div>
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Código de verificación</label>
              <div class="flex gap-2">
                <input v-model="mfaCode" placeholder="000 000" maxlength="7"
                  class="input font-mono text-center text-[16px] tracking-widest w-36" />
                <button @click="verify2FA" :disabled="mfaCode.replace(/\s/g,'').length < 6 || mfaVerifying" class="btn btn-primary disabled:opacity-50">
                  {{ mfaVerifying ? 'Verificando...' : 'Confirmar' }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <p v-if="mfaMsg" class="text-[11px]" :class="mfaMsgOk ? 'text-green-700' : 'text-red-600'">{{ mfaMsg }}</p>
      </div>
    </section>

    <!-- Cuenta -->
    <section class="card overflow-hidden">
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
import { ClipboardDocumentIcon, ArrowPathIcon, KeyIcon, ShieldCheckIcon, QrCodeIcon } from '@heroicons/vue/24/outline'

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

// API Key
const apiKey         = ref('')
const apiKeyCopied   = ref(false)
const generatingKey  = ref(false)
const apiKeyVisible  = ref(false)

// 2FA
const mfaFactors     = ref([])
const mfaEnrolling   = ref(false)
const mfaQR          = ref('')
const mfaSecret      = ref('')
const mfaFactorId    = ref('')
const mfaCode        = ref('')
const mfaVerifying   = ref(false)
const mfaMsg         = ref('')
const mfaMsgOk       = ref(false)

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
    apiKey.value     = org.api_key || ''
  }

  // Load 2FA factors
  const { data: mfaData } = await supabase.auth.mfa.listFactors()
  mfaFactors.value = mfaData?.totp || []
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

// ── API Key ────────────────────────────────────────────────────────────────
async function generateApiKey() {
  if (!orgId.value) return
  generatingKey.value = true
  const key = 'pws_' + Array.from(crypto.getRandomValues(new Uint8Array(24))).map(b => b.toString(16).padStart(2,'0')).join('')
  const { error } = await supabase.from('organizations').update({ api_key: key }).eq('id', orgId.value)
  if (!error) { apiKey.value = key; apiKeyVisible.value = true }
  generatingKey.value = false
}

async function copyApiKey() {
  await navigator.clipboard.writeText(apiKey.value)
  apiKeyCopied.value = true
  setTimeout(() => apiKeyCopied.value = false, 2000)
}

// ── 2FA ───────────────────────────────────────────────────────────────────
async function enroll2FA() {
  mfaEnrolling.value = true
  mfaMsg.value = ''
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: 'totp',
    issuer: 'PenwinSafe',
    friendlyName: 'Authenticator',
  })
  mfaEnrolling.value = false
  if (error) { mfaMsg.value = 'Error: ' + error.message; mfaMsgOk.value = false; return }
  mfaQR.value      = data.totp.qr_code
  mfaSecret.value  = data.totp.secret
  mfaFactorId.value = data.id
}

async function verify2FA() {
  mfaVerifying.value = true
  mfaMsg.value = ''
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: mfaFactorId.value, code: mfaCode.value.replace(/\s/g,'') })
  mfaVerifying.value = false
  if (error) { mfaMsg.value = 'Código incorrecto, inténtalo de nuevo'; mfaMsgOk.value = false; return }
  mfaMsg.value = '2FA activado correctamente'
  mfaMsgOk.value = true
  mfaQR.value = ''; mfaSecret.value = ''; mfaCode.value = ''
  const { data } = await supabase.auth.mfa.listFactors()
  mfaFactors.value = data?.totp || []
}

async function unenroll2FA(factorId) {
  if (!confirm('¿Desactivar la autenticación en dos pasos?')) return
  await supabase.auth.mfa.unenroll({ factorId })
  mfaFactors.value = mfaFactors.value.filter(f => f.id !== factorId)
  mfaMsg.value = '2FA desactivado'
  mfaMsgOk.value = false
}
</script>
