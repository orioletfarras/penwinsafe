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
  <div class="min-h-screen bg-dark-900 flex flex-col">

    <!-- nav -->
    <nav class="px-6 py-4 border-b border-white/5 flex items-center justify-between max-w-6xl mx-auto w-full">
      <a href="/" class="flex items-center gap-2">
        <Logo :size="28" text-class="text-base text-white" />
      </a>
      <a href="/login" class="text-sm text-gray-400 hover:text-white transition-colors">
        Acceder al panel →
      </a>
    </nav>

    <div class="flex-1 flex items-center justify-center px-4 py-16">

      <!-- ── success: demo ──────────────────────────────────────────────────── -->
      <div v-if="step === 'success-demo'" class="max-w-md w-full">
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-brand-600/20 border border-brand-600/30 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5">
            🚀
          </div>
          <h1 class="text-2xl font-bold text-white mb-2">¡Demo activada!</h1>
          <p class="text-gray-400 text-[14px]">
            Ya puedes acceder al panel y empezar a probar PenwinSafe.
          </p>
        </div>

        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6 mb-4">
          <div class="text-center mb-5">
            <p class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">Código de acceso del centro</p>
            <div class="inline-flex items-center gap-2 bg-brand-600/10 border border-brand-600/30 rounded-xl px-5 py-3">
              <span class="text-2xl font-mono font-bold text-brand-400 tracking-widest">
                {{ demoResult?.center_code }}
              </span>
            </div>
          </div>

          <div class="space-y-3 text-[13px] text-gray-400 border-t border-white/5 pt-4">
            <div class="flex items-start gap-2.5">
              <svg class="w-4 h-4 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Acceso al panel de administración durante <strong class="text-white">30 días</strong></span>
            </div>
            <div class="flex items-start gap-2.5">
              <svg class="w-4 h-4 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Enrola hasta <strong class="text-white">3 dispositivos</strong> con PenwinSafe</span>
            </div>
            <div class="flex items-start gap-2.5">
              <svg class="w-4 h-4 text-brand-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Demo expira el <strong class="text-white">{{ formatDate(demoResult?.demo_expires_at) }}</strong></span>
            </div>
          </div>
        </div>

        <div class="space-y-3">
          <a
            href="/login"
            class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[14px] transition-all hover:shadow-lg hover:shadow-brand-600/25"
          >
            Acceder al panel →
          </a>
          <a
            href="/"
            class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-400 hover:text-white text-[13px] font-medium transition-all"
          >
            ← Volver a inicio
          </a>
        </div>

        <p class="text-center text-[11px] text-gray-600 mt-4">
          Usa el código para instalar PenwinSafe en los dispositivos.<br>Nuestro equipo también te contactará para ayudarte.
        </p>
      </div>

      <!-- ── success: meeting ───────────────────────────────────────────────── -->
      <div v-else-if="step === 'success-meeting'" class="max-w-md w-full text-center">
        <div class="w-16 h-16 bg-brand-600/20 border border-brand-600/30 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
          📞
        </div>
        <h1 class="text-2xl font-bold text-white mb-3">¡Solicitud recibida!</h1>
        <p class="text-gray-400 text-[15px] leading-relaxed mb-8">
          Nuestro equipo comercial se pondrá en contacto contigo en las próximas <strong class="text-white">24 horas</strong>.
        </p>
        <a
          href="/"
          class="inline-flex items-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all"
        >
          ← Volver a inicio
        </a>
      </div>

      <!-- ── choose path ────────────────────────────────────────────────────── -->
      <div v-else-if="step === 'choose'" class="max-w-xl w-full">
        <div class="text-center mb-10">
          <h1 class="text-3xl font-black text-white tracking-tight mb-2">Empieza hoy</h1>
          <p class="text-gray-400">¿Cómo quieres conocer PenwinSafe?</p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <!-- demo card -->
          <button
            class="group text-left bg-dark-800 border border-white/8 hover:border-brand-600/50 hover:bg-brand-600/5 rounded-2xl p-6 transition-all cursor-pointer"
            @click="choosePath('demo')"
          >
            <div class="text-3xl mb-4">🚀</div>
            <h2 class="text-[15px] font-bold text-white mb-1.5">Demo gratuita</h2>
            <p class="text-[13px] text-gray-400 leading-relaxed mb-4">
              Activa tu centro al instante. Prueba PenwinSafe 30 días con hasta 3 dispositivos, sin necesidad de hablar con nadie.
            </p>
            <div class="flex items-center gap-1.5 text-brand-400 text-[12px] font-semibold">
              Activar ahora
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          </button>

          <!-- meeting card -->
          <button
            class="group text-left bg-dark-800 border border-white/8 hover:border-white/20 hover:bg-white/3 rounded-2xl p-6 transition-all cursor-pointer"
            @click="choosePath('meeting')"
          >
            <div class="text-3xl mb-4">📞</div>
            <h2 class="text-[15px] font-bold text-white mb-1.5">Hablar con un comercial</h2>
            <p class="text-[13px] text-gray-400 leading-relaxed mb-4">
              Resuelve tus dudas, conoce precios y planes. Te llamamos en menos de 24 horas para adaptar la solución a tu centro.
            </p>
            <div class="flex items-center gap-1.5 text-gray-400 text-[12px] font-semibold">
              Solicitar reunión
              <svg class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
              </svg>
            </div>
          </button>
        </div>
      </div>

      <!-- ── form ───────────────────────────────────────────────────────────── -->
      <div v-else class="max-w-lg w-full">

        <!-- back + header -->
        <div class="mb-6">
          <button
            class="flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-white transition-colors mb-5"
            @click="step = 'choose'"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
            Volver
          </button>

          <div class="flex items-center gap-3 mb-1">
            <span class="text-2xl">{{ path === 'demo' ? '🚀' : '📞' }}</span>
            <h1 class="text-2xl font-black text-white tracking-tight">
              {{ path === 'demo' ? 'Demo gratuita' : 'Hablar con un comercial' }}
            </h1>
          </div>
          <p class="text-gray-400 text-[13px]">
            {{ path === 'demo'
              ? '30 días · 3 dispositivos máx · Sin compromiso'
              : 'Te contactamos en menos de 24 horas' }}
          </p>
        </div>

        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6">
          <div class="space-y-4">

            <!-- school name with autocomplete -->
            <div class="relative">
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Centro educativo <span class="text-red-400">*</span>
              </label>
              <input
                v-model="schoolQuery"
                type="text"
                placeholder="Busca tu centro o escribe el nombre…"
                autocomplete="off"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                @blur="setTimeout(() => { showDropdown = false }, 150)"
                @focus="schoolResults.length && (showDropdown = true)"
              />
              <!-- dropdown -->
              <div
                v-if="showDropdown"
                class="absolute left-0 right-0 top-full mt-1 bg-dark-800 border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-50 overflow-hidden max-h-56 overflow-y-auto"
              >
                <button
                  v-for="s in schoolResults"
                  :key="s.id"
                  class="w-full text-left px-3.5 py-2.5 hover:bg-white/5 transition-colors border-b border-white/5 last:border-0"
                  @mousedown.prevent="selectSchool(s)"
                >
                  <div class="text-[13px] text-white font-medium leading-tight">{{ s.name }}</div>
                  <div class="text-[11px] text-gray-500 mt-0.5">
                    {{ [s.short_type, s.city, s.province].filter(Boolean).join(' · ') }}
                  </div>
                </button>
              </div>
            </div>

            <!-- contact fields -->
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Tu nombre <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="form.contact_name"
                  type="text"
                  placeholder="Nombre completo"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Teléfono
                </label>
                <input
                  v-model="form.contact_phone"
                  type="tel"
                  placeholder="+34 6XX XXX XXX"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Email de contacto <span class="text-red-400">*</span>
              </label>
              <input
                v-model="form.contact_email"
                type="email"
                placeholder="tu@centro.es"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Nº aproximado de dispositivos
              </label>
              <input
                v-model="form.devices_estimate"
                type="number"
                min="1"
                placeholder="Ej: 30"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <!-- meeting-only: preferred date -->
            <div v-if="path === 'meeting'">
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Fecha preferida (opcional)
              </label>
              <input
                v-model="form.preferred_date"
                type="date"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Mensaje (opcional)
              </label>
              <textarea
                v-model="form.message"
                rows="3"
                :placeholder="path === 'demo'
                  ? 'Cuéntanos sobre tu centro o tus dudas…'
                  : 'Describe tu situación, número de aulas, dudas sobre precios…'"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all resize-none"
              />
            </div>
          </div>

          <p v-if="errorMsg" class="mt-3 text-red-400 text-[12px]">{{ errorMsg }}</p>

          <button
            class="mt-5 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[14px] transition-all hover:shadow-lg hover:shadow-brand-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="!isValid || step === 'submitting'"
            @click="submit"
          >
            <span v-if="step === 'submitting'">
              {{ path === 'demo' ? 'Activando demo…' : 'Enviando solicitud…' }}
            </span>
            <span v-else>
              {{ path === 'demo' ? 'Activar demo gratuita 🚀' : 'Solicitar reunión' }}
            </span>
          </button>

          <p class="text-center text-[11px] text-gray-600 mt-3">
            <template v-if="path === 'demo'">
              Sin compromiso · 30 días · 3 dispositivos máx
            </template>
            <template v-else>
              Sin compromiso · Respuesta en &lt;24 horas
            </template>
          </p>
        </div>
      </div>

    </div>

    <!-- footer -->
    <footer class="border-t border-white/5 py-6 px-6">
      <div class="max-w-6xl mx-auto flex items-center justify-between">
        <p class="text-sm text-gray-600">© {{ new Date().getFullYear() }} Penwin · Todos los derechos reservados</p>
        <a href="mailto:hola@penwin.org" class="text-sm text-gray-600 hover:text-white transition-colors">hola@penwin.org</a>
      </div>
    </footer>

  </div>
</template>
