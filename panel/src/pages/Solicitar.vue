<script setup>
import { ref, computed, watch } from 'vue'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo.vue'

// ─── state machine ───────────────────────────────────────────────────────────
// step: 'choose' | 'form' | 'submitting' | 'success-demo' | 'success-meeting'
const step = ref('choose')
const path = ref('') // 'demo' | 'meeting'
const errorMsg = ref(null)

// ─── form ─────────────────────────────────────────────────────────────────────
const form = ref({
  school_name: '',
  school_directory_id: null,
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  devices_estimate: '',
  preferred_date: '',
  message: '',
})

// ─── school autocomplete ─────────────────────────────────────────────────────
const schoolQuery   = ref('')
const schoolResults = ref([])
const showDropdown  = ref(false)
let searchTimeout   = null

watch(schoolQuery, (q) => {
  form.value.school_name = q
  form.value.school_directory_id = null
  clearTimeout(searchTimeout)
  if (q.length < 3) { schoolResults.value = []; showDropdown.value = false; return }
  searchTimeout = setTimeout(async () => {
    const { data } = await supabase
      .from('school_directory')
      .select('id, name, city, province, short_type')
      .ilike('name', `%${q}%`)
      .limit(8)
    schoolResults.value = data || []
    showDropdown.value = schoolResults.value.length > 0
  }, 250)
})

function selectSchool(school) {
  schoolQuery.value = school.name
  form.value.school_name = school.name
  form.value.school_directory_id = school.id
  showDropdown.value = false
}

// ─── result (demo) ───────────────────────────────────────────────────────────
const demoResult = ref(null) // { org_id, center_code, demo_expires_at, org_name }

// ─── validation ──────────────────────────────────────────────────────────────
const isValid = computed(() =>
  form.value.school_name.trim() &&
  form.value.contact_name.trim() &&
  form.value.contact_email.trim() &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.value.contact_email.trim()),
)

// ─── actions ─────────────────────────────────────────────────────────────────
function choosePath(p) {
  path.value = p
  step.value = 'form'
}

async function submit() {
  if (!isValid.value) return
  step.value = 'submitting'
  errorMsg.value = null

  if (path.value === 'demo') {
    const { data, error } = await supabase.rpc('create_demo_org', {
      p_school_name:      form.value.school_name.trim(),
      p_contact_name:     form.value.contact_name.trim(),
      p_contact_email:    form.value.contact_email.trim(),
      p_contact_phone:    form.value.contact_phone.trim() || null,
      p_devices_estimate: form.value.devices_estimate ? Number(form.value.devices_estimate) : null,
      p_message:          form.value.message.trim() || null,
    })

    if (error) {
      errorMsg.value = 'Ha ocurrido un error al crear la demo. Por favor inténtalo de nuevo.'
      step.value = 'form'
      return
    }
    demoResult.value = data
    step.value = 'success-demo'
  } else {
    const { error } = await supabase.from('lead_requests').insert({
      school_name:        form.value.school_name.trim(),
      contact_name:       form.value.contact_name.trim(),
      contact_email:      form.value.contact_email.trim(),
      contact_phone:      form.value.contact_phone.trim() || null,
      request_type:       'meeting',
      devices_estimate:   form.value.devices_estimate ? Number(form.value.devices_estimate) : null,
      preferred_date:     form.value.preferred_date || null,
      message:            form.value.message.trim() || null,
      school_directory_id: form.value.school_directory_id,
    })

    if (error) {
      errorMsg.value = 'Ha ocurrido un error. Por favor inténtalo de nuevo.'
      step.value = 'form'
      return
    }
    step.value = 'success-meeting'
  }
}

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
}
</script>

<template>
  <div class="min-h-screen text-white flex flex-col" style="background:#080c14;font-family:'Inter',system-ui,sans-serif;">

    <!-- fondo grid sutil -->
    <div class="fixed inset-0 pointer-events-none" style="background-image:linear-gradient(rgba(59,130,246,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(59,130,246,0.03) 1px,transparent 1px);background-size:64px 64px;"></div>

    <!-- nav -->
    <nav class="relative z-10 border-b border-white/5 px-6" style="background:rgba(8,12,20,0.8);backdrop-filter:blur(20px);">
      <div class="max-w-6xl mx-auto h-16 flex items-center justify-between">
        <a href="/"><Logo :size="28" text-class="text-base text-white" /></a>
        <a href="/login" class="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1.5">
          Acceder al panel
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </a>
      </div>
    </nav>

    <div class="relative z-10 flex-1 flex items-center justify-center px-4 py-16">

      <!-- ── success: demo ──────────────────────────────────────────────────── -->
      <div v-if="step === 'success-demo'" class="max-w-md w-full">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-brand-600/15 border border-brand-600/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" class="text-brand-400" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 2L4 7v10c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V7L12 2z" fill="currentColor" fill-opacity=".15"/><path d="M9 12l2 2 4-4"/></svg>
          </div>
          <h1 class="text-3xl font-black text-white tracking-tight mb-3">¡Demo activada!</h1>
          <p class="text-gray-400">Ya puedes acceder al panel y empezar a probar PenwinSafe.</p>
        </div>

        <div class="rounded-2xl border border-white/8 p-6 mb-4 relative overflow-hidden" style="background:rgba(255,255,255,0.02);">
          <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/40 to-transparent"></div>
          <div class="text-center mb-6">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-3">Código de acceso del centro</p>
            <div class="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/30 rounded-xl px-6 py-3">
              <span class="text-2xl font-mono font-bold text-brand-400 tracking-widest">{{ demoResult?.center_code }}</span>
            </div>
          </div>
          <div class="space-y-3 text-[13px] text-gray-400 border-t border-white/5 pt-5">
            <div v-for="item in [
              '30 días de acceso al panel de administración',
              'Hasta 3 dispositivos protegidos con PenwinSafe',
              `Demo expira el ${formatDate(demoResult?.demo_expires_at)}`
            ]" :key="item" class="flex items-start gap-3">
              <svg class="w-4 h-4 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              <span>{{ item }}</span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <a href="/login" class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm transition-all hover:shadow-lg hover:shadow-brand-600/25">
            Acceder al panel →
          </a>
          <a href="/" class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/8 hover:border-white/15 hover:bg-white/3 text-gray-400 hover:text-white text-sm font-medium transition-all">
            ← Volver a inicio
          </a>
        </div>
        <p class="text-center text-[11px] text-gray-600 mt-5">Usa el código al instalar PenwinSafe en los dispositivos.<br>Nuestro equipo también te contactará para ayudarte.</p>
      </div>

      <!-- ── success: meeting ───────────────────────────────────────────────── -->
      <div v-else-if="step === 'success-meeting'" class="max-w-md w-full text-center">
        <div class="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-green-400"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 9.87 19.8 19.8 0 01.01 1.25 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
        </div>
        <h1 class="text-3xl font-black text-white tracking-tight mb-3">¡Solicitud recibida!</h1>
        <p class="text-gray-400 text-[15px] leading-relaxed mb-8">
          Nuestro equipo se pondrá en contacto contigo en las próximas <span class="text-white font-semibold">24 horas</span>.
        </p>
        <a href="/" class="inline-flex items-center gap-2 border border-white/8 hover:border-white/15 hover:bg-white/3 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all">
          ← Volver a inicio
        </a>
      </div>

      <!-- ── choose path ────────────────────────────────────────────────────── -->
      <div v-else-if="step === 'choose'" class="max-w-xl w-full">
        <div class="text-center mb-12">
          <div class="inline-flex items-center gap-2 border border-brand-600/30 bg-brand-600/10 rounded-full px-3.5 py-1.5 text-xs text-brand-400 font-medium mb-6">
            <span class="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse"></span>
            Sin compromiso · Sin tarjeta de crédito
          </div>
          <h1 class="text-4xl font-black text-white tracking-tight mb-3">Empieza hoy</h1>
          <p class="text-gray-400 text-lg">¿Cómo quieres conocer PenwinSafe?</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button class="group text-left rounded-2xl border border-white/8 hover:border-brand-500/50 p-7 transition-all cursor-pointer relative overflow-hidden" style="background:rgba(255,255,255,0.02);" @click="choosePath('demo')">
            <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/0 group-hover:via-brand-400/40 to-transparent transition-all"></div>
            <div class="w-10 h-10 bg-brand-600/15 border border-brand-600/25 rounded-xl flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-brand-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            </div>
            <h2 class="text-[15px] font-bold text-white mb-2">Demo gratuita</h2>
            <p class="text-[13px] text-gray-400 leading-relaxed mb-5">Activa tu centro en minutos. 30 días con hasta 3 dispositivos, sin necesidad de hablar con nadie.</p>
            <div class="flex items-center gap-1.5 text-brand-400 text-[12px] font-semibold">
              Activar ahora
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </div>
          </button>

          <button class="group text-left rounded-2xl border border-white/8 hover:border-white/20 p-7 transition-all cursor-pointer relative overflow-hidden" style="background:rgba(255,255,255,0.02);" @click="choosePath('meeting')">
            <div class="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-gray-400"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 9.87 19.8 19.8 0 01.01 1.25 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            </div>
            <h2 class="text-[15px] font-bold text-white mb-2">Hablar con un comercial</h2>
            <p class="text-[13px] text-gray-400 leading-relaxed mb-5">Resuelve tus dudas y adapta la solución a tu centro. Te contactamos en menos de 24 horas.</p>
            <div class="flex items-center gap-1.5 text-gray-400 text-[12px] font-semibold">
              Solicitar reunión
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ── form ───────────────────────────────────────────────────────────── -->
      <div v-else class="max-w-lg w-full">
        <div class="mb-8">
          <button class="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-white transition-colors mb-6" @click="step = 'choose'">
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
            Volver
          </button>
          <div class="flex items-center gap-3 mb-1">
            <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" :class="path === 'demo' ? 'bg-brand-600/15 border border-brand-600/25' : 'bg-white/5 border border-white/10'">
              <svg v-if="path === 'demo'" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-brand-400"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              <svg v-else width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" class="text-gray-400"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.8 19.8 0 01-8.63-3.07A19.5 19.5 0 013.07 9.87 19.8 19.8 0 01.01 1.25 2 2 0 012 .01h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z"/></svg>
            </div>
            <h1 class="text-2xl font-black text-white tracking-tight">{{ path === 'demo' ? 'Demo gratuita' : 'Hablar con un comercial' }}</h1>
          </div>
          <p class="text-gray-500 text-[13px] ml-12">{{ path === 'demo' ? '30 días · 3 dispositivos máx · Sin compromiso' : 'Te contactamos en menos de 24 horas' }}</p>
        </div>

        <div class="rounded-2xl border border-white/8 p-6 relative overflow-hidden" style="background:rgba(255,255,255,0.02);">
          <div class="absolute top-0 inset-x-0 h-px" :class="path === 'demo' ? 'bg-gradient-to-r from-transparent via-brand-400/40 to-transparent' : 'bg-gradient-to-r from-transparent via-white/10 to-transparent'"></div>
          <div class="space-y-4">

            <div class="relative">
              <label class="sol-label">Centro educativo <span class="text-red-400/80">*</span></label>
              <input v-model="schoolQuery" type="text" placeholder="Busca tu centro o escribe el nombre…" autocomplete="off" class="sol-input"
                @blur="setTimeout(() => { showDropdown = false }, 150)"
                @focus="schoolResults.length && (showDropdown = true)" />
              <div v-if="showDropdown" class="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 shadow-2xl shadow-black/60 z-50 overflow-hidden max-h-56 overflow-y-auto" style="background:#0f1520;">
                <button v-for="s in schoolResults" :key="s.id" class="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0" @mousedown.prevent="selectSchool(s)">
                  <div class="text-[13px] text-white font-medium leading-tight">{{ s.name }}</div>
                  <div class="text-[11px] text-gray-500 mt-0.5">{{ [s.short_type, s.city, s.province].filter(Boolean).join(' · ') }}</div>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="sol-label">Tu nombre <span class="text-red-400/80">*</span></label>
                <input v-model="form.contact_name" type="text" placeholder="Nombre completo" class="sol-input" />
              </div>
              <div>
                <label class="sol-label">Teléfono</label>
                <input v-model="form.contact_phone" type="tel" placeholder="+34 6XX XXX XXX" class="sol-input" />
              </div>
            </div>

            <div>
              <label class="sol-label">Email de contacto <span class="text-red-400/80">*</span></label>
              <input v-model="form.contact_email" type="email" placeholder="tu@centro.es" class="sol-input" />
            </div>

            <div>
              <label class="sol-label">Nº aproximado de dispositivos</label>
              <input v-model="form.devices_estimate" type="number" min="1" placeholder="Ej: 30" class="sol-input" />
            </div>

            <div v-if="path === 'meeting'">
              <label class="sol-label">Fecha preferida (opcional)</label>
              <input v-model="form.preferred_date" type="date" class="sol-input" />
            </div>

            <div>
              <label class="sol-label">Mensaje (opcional)</label>
              <textarea v-model="form.message" rows="3" :placeholder="path === 'demo' ? 'Cuéntanos sobre tu centro o tus dudas…' : 'Describe tu situación, número de aulas, dudas sobre precios…'" class="sol-input resize-none" />
            </div>
          </div>

          <p v-if="errorMsg" class="mt-3 text-red-400 text-[12px] flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {{ errorMsg }}
          </p>

          <button class="mt-5 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[14px] transition-all hover:shadow-lg hover:shadow-brand-600/25 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            :disabled="!isValid || step === 'submitting'" @click="submit">
            <svg v-if="step === 'submitting'" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
            <span v-if="step === 'submitting'">{{ path === 'demo' ? 'Activando demo…' : 'Enviando solicitud…' }}</span>
            <span v-else>{{ path === 'demo' ? 'Activar demo gratuita' : 'Solicitar reunión' }}</span>
          </button>

          <p class="text-center text-[11px] text-gray-600 mt-3">
            <template v-if="path === 'demo'">Sin compromiso · 30 días · 3 dispositivos máx</template>
            <template v-else>Sin compromiso · Respuesta en &lt;24 horas</template>
          </p>
        </div>
      </div>

    </div>

    <!-- footer -->
    <footer class="relative z-10 border-t border-white/5 py-6 px-6">
      <div class="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
        <p class="text-sm text-gray-600">© {{ new Date().getFullYear() }} Penwin · Todos los derechos reservados</p>
        <div class="flex items-center gap-5">
          <a href="https://penwin.org" target="_blank" class="text-sm text-gray-600 hover:text-white transition-colors">penwin.org</a>
          <a href="mailto:hola@penwin.org" class="text-sm text-gray-600 hover:text-white transition-colors">hola@penwin.org</a>
        </div>
      </div>
    </footer>

  </div>
</template>

<style scoped>
.sol-label { display:block; font-size:11px; font-weight:600; text-transform:uppercase; letter-spacing:.08em; color:rgba(255,255,255,0.35); margin-bottom:6px; }
.sol-input { width:100%; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:10px; padding:10px 14px; font-size:13px; color:#fff; outline:none; transition:border-color .2s; font-family:inherit; }
.sol-input::placeholder { color:rgba(255,255,255,0.2); }
.sol-input:focus { border-color:rgba(37,99,235,0.5); }
</style>
