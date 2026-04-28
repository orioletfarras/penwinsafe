<template>
  <div class="min-h-screen flex" style="font-family:'Inter',system-ui,sans-serif">

    <!-- Left panel — branding -->
    <div class="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-10" style="background:#0f172a">
      <div>
        <Logo :size="32" text-class="text-[18px] font-bold text-white" />
      </div>
      <div>
        <h2 class="text-[28px] font-bold leading-snug mb-4" style="color:#f8fafc">
          Seguridad digital<br/>para centros educativos
        </h2>
        <p class="text-[14px] leading-relaxed mb-8" style="color:rgba(255,255,255,0.5)">
          Monitorización en tiempo real, filtros de contenido y alertas inteligentes para proteger a tus alumnos en internet.
        </p>
        <div class="space-y-3">
          <div v-for="feat in features" :key="feat" class="flex items-center gap-3">
            <div class="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style="background:rgba(0,111,255,0.25)">
              <svg class="w-3 h-3" fill="none" viewBox="0 0 12 12" stroke="#60a5fa" stroke-width="2">
                <path d="M2 6l3 3 5-5"/>
              </svg>
            </div>
            <span class="text-[13px]" style="color:rgba(255,255,255,0.6)">{{ feat }}</span>
          </div>
        </div>
      </div>
      <p class="text-[11px]" style="color:rgba(255,255,255,0.2)">© 2025 Penwin · hola@penwin.org</p>
    </div>

    <!-- Right panel — form -->
    <div class="flex-1 flex items-center justify-center px-6" style="background:#f8fafc">
      <div class="w-full max-w-sm">

        <!-- Mobile logo -->
        <div class="flex justify-center mb-8 lg:hidden">
          <Logo :size="32" text-class="text-[18px] font-bold" />
        </div>

        <h1 class="text-[22px] font-bold mb-1" style="color:#111827">Bienvenido</h1>
        <p class="text-[13px] mb-8" style="color:#6b7280">Accede a tu panel de administración</p>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Email</label>
            <input v-model="email" type="email" required placeholder="director@colegio.es"
              class="input" style="height:42px;font-size:13px" />
          </div>
          <div>
            <label class="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style="color:#6b7280">Contraseña</label>
            <input v-model="password" type="password" required placeholder="••••••••"
              class="input" style="height:42px;font-size:13px" />
          </div>

          <div v-if="error" class="flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px]"
            style="background:#fef2f2;border:1px solid #fecaca;color:#dc2626">
            <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/>
            </svg>
            {{ error }}
          </div>

          <button type="submit" :disabled="loading" class="btn btn-primary w-full justify-center" style="height:42px;font-size:13px;font-weight:600">
            <span v-if="loading" class="w-4 h-4 border-2 rounded-full animate-spin flex-shrink-0" style="border-color:rgba(255,255,255,0.3);border-top-color:#fff"></span>
            {{ loading ? 'Entrando...' : 'Entrar al panel' }}
          </button>
        </form>

        <p class="mt-8 text-center text-[12px]" style="color:#9ca3af">
          ¿No tienes cuenta?
          <a href="mailto:hola@penwin.org" class="font-medium transition-colors" style="color:#006fff">Contacta con Penwin</a>
        </p>

        <div class="mt-6 flex justify-center">
          <router-link to="/" class="text-[11px] transition-colors" style="color:#d1d5db">← Volver a la web</router-link>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue'
import Logo from '../components/Logo.vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route  = useRoute()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

const features = [
  'Monitorización en tiempo real de todos los dispositivos',
  'Filtros de contenido por categoría y clase',
  'Alertas inteligentes generadas por IA',
  'Informes semanales para tutores',
]

async function handleLogin() {
  loading.value = true
  error.value   = ''
  const { error: err } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
  if (err) { error.value = 'Email o contraseña incorrectos.'; loading.value = false; return }
  router.push(route.query.redirect || '/dashboard')
}
</script>
