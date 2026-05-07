<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../lib/supabase'
import Logo from '../components/Logo.vue'

// Read org context from URL query (?org_id=xxx) or from session
const urlParams = new URLSearchParams(window.location.search)
const orgIdFromUrl = urlParams.get('org_id') || null

const step = ref('form') // 'form' | 'submitting' | 'success' | 'error'
const errorMsg = ref(null)

const fiscal = ref({
  razon_social: '',
  cif: '',
  direccion: '',
  codigo_postal: '',
  ciudad: '',
  provincia: '',
  titular_nombre: '',
  titular_email: '',
  titular_telefono: '',
  email_facturacion: '',
})

const contract = ref({
  plan: 'starter',
  seats: '',
  notes: '',
})

const result = ref(null) // { fiscal_data_id, contract_id }

const PLANS = [
  { value: 'starter', label: 'Starter', desc: '79 €/mes · hasta 30 dispositivos' },
  { value: 'pro',     label: 'Pro',     desc: '149 €/mes · hasta 100 dispositivos' },
  { value: 'enterprise', label: 'Enterprise', desc: 'Precio personalizado · ilimitado' },
]

const isValid = computed(() => {
  const f = fiscal.value
  return (
    f.razon_social.trim() &&
    f.cif.trim() &&
    f.direccion.trim() &&
    f.codigo_postal.trim() &&
    f.ciudad.trim() &&
    f.provincia.trim() &&
    f.titular_nombre.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.titular_email.trim()) &&
    contract.value.plan
  )
})

async function submit() {
  if (!isValid.value) return
  step.value = 'submitting'
  errorMsg.value = null

  const f = fiscal.value
  const c = contract.value

  const { data, error } = await supabase.rpc('submit_contract', {
    p_razon_social:      f.razon_social.trim(),
    p_cif:               f.cif.trim().toUpperCase(),
    p_direccion:         f.direccion.trim(),
    p_codigo_postal:     f.codigo_postal.trim(),
    p_ciudad:            f.ciudad.trim(),
    p_provincia:         f.provincia.trim(),
    p_titular_nombre:    f.titular_nombre.trim(),
    p_titular_email:     f.titular_email.trim(),
    p_titular_telefono:  f.titular_telefono.trim() || null,
    p_email_facturacion: f.email_facturacion.trim() || null,
    p_org_id:            orgIdFromUrl,
    p_plan:              c.plan,
    p_seats:             c.seats ? Number(c.seats) : 0,
    p_notes:             c.notes.trim() || null,
  })

  if (error) {
    errorMsg.value = 'Ha ocurrido un error al procesar la solicitud. Por favor inténtalo de nuevo o escríbenos a hola@penwin.org.'
    step.value = 'form'
    return
  }

  result.value = data
  step.value = 'success'
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

      <!-- success -->
      <div v-if="step === 'success'" class="max-w-md w-full text-center">
        <div class="w-16 h-16 bg-brand-600/20 border border-brand-600/30 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-6">
          ✅
        </div>
        <h1 class="text-2xl font-bold text-white mb-3">¡Solicitud recibida!</h1>
        <p class="text-gray-400 text-[15px] leading-relaxed mb-2">
          Hemos recibido tu solicitud de contrato. Nuestro equipo la revisará y se pondrá en contacto contigo en las próximas <strong class="text-white">24–48 horas</strong> para confirmar los detalles y activar el plan.
        </p>
        <p class="text-gray-500 text-[13px] mb-8">
          Referencia: <span class="font-mono text-gray-400">{{ result?.contract_id?.slice(0, 8).toUpperCase() }}</span>
        </p>
        <div class="space-y-3">
          <a
            href="/dashboard"
            class="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[14px] transition-all"
          >
            Volver al panel →
          </a>
          <a
            href="/"
            class="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-gray-400 hover:text-white text-[13px] transition-all"
          >
            ← Inicio
          </a>
        </div>
      </div>

      <!-- form -->
      <div v-else class="max-w-xl w-full">

        <div class="mb-8">
          <h1 class="text-3xl font-black text-white tracking-tight mb-2">Contratar PenwinSafe</h1>
          <p class="text-gray-400 text-[14px]">
            Completa los datos fiscales de tu centro. Nuestro equipo confirmará el contrato en 24–48 h.
          </p>
        </div>

        <!-- Plan selector -->
        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6 mb-4">
          <h2 class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-3">Plan</h2>
          <div class="space-y-2">
            <label
              v-for="p in PLANS"
              :key="p.value"
              class="flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all"
              :class="contract.plan === p.value
                ? 'border-brand-600/60 bg-brand-600/10'
                : 'border-white/8 hover:border-white/15 hover:bg-white/3'"
            >
              <input type="radio" v-model="contract.plan" :value="p.value" class="sr-only" />
              <div class="flex-1 min-w-0">
                <div class="text-[13px] font-semibold text-white">{{ p.label }}</div>
                <div class="text-[11px] text-gray-400 mt-0.5">{{ p.desc }}</div>
              </div>
              <div
                class="w-4 h-4 rounded-full border-2 shrink-0"
                :class="contract.plan === p.value ? 'border-brand-500 bg-brand-500' : 'border-white/20'"
              />
            </label>
          </div>

          <div class="mt-4">
            <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              Nº de dispositivos estimado
            </label>
            <input
              v-model="contract.seats"
              type="number"
              min="1"
              placeholder="Ej: 50"
              class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
            />
          </div>
        </div>

        <!-- Fiscal data -->
        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6 mb-4">
          <h2 class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Datos fiscales</h2>
          <div class="space-y-3">

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Razón social <span class="text-red-400">*</span>
              </label>
              <input
                v-model="fiscal.razon_social"
                type="text"
                placeholder="CEIP Nombre del Centro"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                CIF / NIF <span class="text-red-400">*</span>
              </label>
              <input
                v-model="fiscal.cif"
                type="text"
                placeholder="S2800000A"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all font-mono"
              />
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Dirección fiscal <span class="text-red-400">*</span>
              </label>
              <input
                v-model="fiscal.direccion"
                type="text"
                placeholder="Calle Ejemplo, 12"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  CP <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="fiscal.codigo_postal"
                  type="text"
                  placeholder="28001"
                  maxlength="5"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all font-mono"
                />
              </div>
              <div class="col-span-2">
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Ciudad <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="fiscal.ciudad"
                  type="text"
                  placeholder="Madrid"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Provincia <span class="text-red-400">*</span>
              </label>
              <input
                v-model="fiscal.provincia"
                type="text"
                placeholder="Madrid"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Contact person -->
        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6 mb-4">
          <h2 class="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-4">Titular / Representante legal</h2>
          <div class="space-y-3">

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Nombre completo <span class="text-red-400">*</span>
              </label>
              <input
                v-model="fiscal.titular_nombre"
                type="text"
                placeholder="Nombre y apellidos"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Email <span class="text-red-400">*</span>
                </label>
                <input
                  v-model="fiscal.titular_email"
                  type="email"
                  placeholder="direccion@centro.es"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                />
              </div>
              <div>
                <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                  Teléfono
                </label>
                <input
                  v-model="fiscal.titular_telefono"
                  type="tel"
                  placeholder="+34 6XX XXX XXX"
                  class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
                />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                Email para facturas
                <span class="text-gray-500 font-normal normal-case tracking-normal ml-1">(si es distinto del anterior)</span>
              </label>
              <input
                v-model="fiscal.email_facturacion"
                type="email"
                placeholder="facturas@centro.es"
                class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all"
              />
            </div>
          </div>
        </div>

        <!-- Notes -->
        <div class="bg-dark-800 border border-white/8 rounded-2xl p-6 mb-6">
          <label class="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            Notas adicionales (opcional)
          </label>
          <textarea
            v-model="contract.notes"
            rows="3"
            placeholder="Fechas preferidas de inicio, preguntas sobre el contrato…"
            class="w-full bg-dark-700 border border-white/8 rounded-lg px-3 py-2.5 text-[13px] text-white placeholder:text-gray-600 focus:outline-none focus:border-brand-600/60 transition-all resize-none"
          />
        </div>

        <p v-if="errorMsg" class="mb-4 text-red-400 text-[13px] p-3 bg-red-400/10 border border-red-400/20 rounded-xl">
          {{ errorMsg }}
        </p>

        <button
          class="w-full py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-[15px] transition-all hover:shadow-lg hover:shadow-brand-600/25 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isValid || step === 'submitting'"
          @click="submit"
        >
          {{ step === 'submitting' ? 'Enviando solicitud…' : 'Solicitar contrato' }}
        </button>

        <p class="text-center text-[11px] text-gray-600 mt-4 leading-relaxed">
          Al enviar esta solicitud confirmas los datos fiscales.<br>
          Nuestro equipo te enviará el contrato para su revisión en 24–48 horas.<br>
          El pago se realizará por transferencia bancaria una vez confirmado.
        </p>

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
