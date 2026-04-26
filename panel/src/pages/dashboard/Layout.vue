<template>
  <div class="min-h-screen bg-dark-900 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-dark-800 border-r border-dark-600 flex flex-col fixed h-full">
      <div class="p-6 border-b border-dark-600">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🛡️</span>
          <span class="font-bold text-lg gradient-text">PenwinSafe</span>
        </div>
        <p class="text-xs text-dark-500 mt-1">Panel de administración</p>
      </div>

      <nav class="flex-1 p-4 space-y-1">
        <router-link
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-all"
          active-class="bg-brand-600/20 text-brand-400 border border-brand-600/30"
          exact-active-class="bg-brand-600/20 text-brand-400 border border-brand-600/30"
        >
          <span class="text-base">{{ item.icon }}</span>
          {{ item.label }}
        </router-link>
      </nav>

      <div class="p-4 border-t border-dark-600">
        <div class="flex items-center gap-3 px-3 py-2 mb-2">
          <div class="w-8 h-8 bg-brand-600/30 rounded-full flex items-center justify-center text-brand-400 text-sm font-bold">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm text-white truncate">{{ userEmail }}</p>
            <p class="text-xs text-dark-500">Administrador</p>
          </div>
        </div>
        <button
          @click="handleLogout"
          class="w-full text-left px-3 py-2 text-sm text-dark-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/5"
        >
          Cerrar sesión
        </button>
      </div>
    </aside>

    <!-- Main content -->
    <main class="ml-64 flex-1 p-8">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'

const router = useRouter()
const userEmail = ref('')

const userInitials = computed(() => {
  const parts = userEmail.value.split('@')[0].split('.')
  return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AD'
})

const navItems = [
  { to: '/dashboard',          icon: '📊', label: 'Resumen' },
  { to: '/dashboard/devices',  icon: '🖥️', label: 'Dispositivos' },
  { to: '/dashboard/alerts',   icon: '🔔', label: 'Alertas' },
  { to: '/dashboard/reports',  icon: '📄', label: 'Informes' },
  { to: '/dashboard/settings', icon: '⚙️', label: 'Configuración' },
]

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) userEmail.value = user.email
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
