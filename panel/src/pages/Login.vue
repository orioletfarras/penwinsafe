<template>
  <div class="min-h-screen bg-dark-900 flex items-center justify-center px-4">
    <!-- Fondo decorativo -->
    <div class="absolute inset-0 overflow-hidden pointer-events-none">
      <div class="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-600/10 rounded-full blur-3xl"></div>
    </div>

    <div class="relative w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <router-link to="/" class="inline-flex justify-center mb-2">
          <Logo :size="44" text-class="text-2xl text-white" />
        </router-link>
        <p class="text-dark-500 mt-3 text-sm">Panel de administración escolar</p>
      </div>

      <!-- Card login -->
      <div class="glass rounded-2xl p-8">
        <h1 class="text-xl font-semibold text-white mb-6 text-center">Acceder al panel</h1>

        <form @submit.prevent="handleLogin" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Email</label>
            <input
              v-model="email"
              type="email"
              required
              placeholder="director@colegio.es"
              class="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Contraseña</label>
            <input
              v-model="password"
              type="password"
              required
              placeholder="••••••••"
              class="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white placeholder-dark-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>

          <div v-if="error" class="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
            {{ error }}
          </div>

          <button
            type="submit"
            :disabled="loading"
            class="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span v-if="loading" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-dark-600 text-center">
          <p class="text-dark-500 text-sm">
            ¿No tienes cuenta?
            <a href="mailto:hola@penwin.org" class="text-brand-400 hover:text-brand-300 transition-colors">
              Contacta con Penwin
            </a>
          </p>
        </div>
      </div>

      <p class="text-center text-dark-500 text-xs mt-6">
        <router-link to="/" class="hover:text-gray-400 transition-colors">← Volver a la web</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Logo from '../components/Logo.vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../lib/supabase'

const router = useRouter()
const route = useRoute()

const email    = ref('')
const password = ref('')
const loading  = ref(false)
const error    = ref('')

async function handleLogin() {
  loading.value = true
  error.value = ''

  const { error: err } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (err) {
    error.value = 'Email o contraseña incorrectos.'
    loading.value = false
    return
  }

  const redirect = route.query.redirect || '/dashboard'
  router.push(redirect)
}
</script>
