<template>
  <div class="min-h-screen bg-[#0a0d14] flex text-white" style="font-family:'Inter',system-ui,sans-serif">

    <!-- Sidebar -->
    <aside class="w-60 flex-shrink-0 fixed h-full flex flex-col border-r border-white/6" style="background:#0d1117">
      <!-- Logo -->
      <div class="px-5 py-5 border-b border-white/6">
        <Logo :size="32" text-class="text-base text-white" />
      </div>

      <!-- Org badge -->
      <div class="mx-3 mt-3 mb-1 px-3 py-2.5 rounded-xl bg-white/4 border border-white/6 flex items-center gap-2.5">
        <div class="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center text-xs font-black text-white flex-shrink-0">
          {{ orgInitial }}
        </div>
        <div class="min-w-0">
          <p class="text-xs font-semibold text-white truncate">{{ orgName }}</p>
          <p class="text-[10px] text-gray-600">Panel de administración</p>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        <p class="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-2 mt-1">Principal</p>
        <router-link v-for="item in mainNav" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all group"
          :class="isActive(item.to) ? 'bg-white/8 text-white' : ''"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" :class="isActive(item.to) ? 'text-brand-400' : 'text-gray-600 group-hover:text-gray-400'" />
          <span>{{ item.label }}</span>
          <span v-if="item.badge" class="ml-auto text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded-full font-semibold">{{ item.badge }}</span>
        </router-link>

        <p class="text-[10px] text-gray-600 uppercase tracking-widest px-3 py-2 mt-3">Gestión</p>
        <router-link v-for="item in mgmtNav" :key="item.to" :to="item.to"
          class="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-all group"
          :class="isActive(item.to) ? 'bg-white/8 text-white' : ''"
        >
          <component :is="item.icon" class="w-4 h-4 flex-shrink-0" :class="isActive(item.to) ? 'text-brand-400' : 'text-gray-600 group-hover:text-gray-400'" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- User -->
      <div class="px-3 py-3 border-t border-white/6">
        <div class="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-white/5 cursor-pointer transition-all group" @click="handleLogout">
          <div class="w-7 h-7 rounded-full bg-gradient-to-br from-brand-600 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-xs font-medium text-white truncate">{{ userEmail }}</p>
          </div>
          <ArrowRightStartOnRectangleIcon class="w-3.5 h-3.5 text-gray-600 group-hover:text-red-400 transition-colors flex-shrink-0" />
        </div>
      </div>
    </aside>

    <!-- Main -->
    <div class="ml-60 flex-1 flex flex-col min-h-screen">
      <!-- Topbar -->
      <header class="h-14 border-b border-white/6 flex items-center justify-between px-8 flex-shrink-0 sticky top-0 z-10 backdrop-blur-xl" style="background:rgba(10,13,20,0.8)">
        <div>
          <h1 class="text-sm font-semibold text-white">{{ currentPageTitle }}</h1>
          <p class="text-xs text-gray-600">{{ today }}</p>
        </div>
        <div class="flex items-center gap-2">
          <div class="flex items-center gap-1.5 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1.5 rounded-lg">
            <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
            DNS activo
          </div>
        </div>
      </header>

      <!-- Page content -->
      <main class="flex-1 p-8">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo.vue'

import {
  Squares2X2Icon, ComputerDesktopIcon, BellIcon,
  DocumentTextIcon, Cog6ToothIcon, ArrowRightStartOnRectangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const route  = useRoute()

const userEmail  = ref('')
const orgName    = ref('Cargando...')
const alertCount = ref(0)

const userInitials = computed(() => {
  const p = userEmail.value.split('@')[0].split('.')
  return p.map(s => s[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AD'
})
const orgInitial = computed(() => orgName.value[0]?.toUpperCase() || 'C')

const today = computed(() =>
  new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })
)

const mainNav = computed(() => [
  { to: '/dashboard',         label: 'Resumen',      icon: Squares2X2Icon },
  { to: '/dashboard/devices', label: 'Dispositivos', icon: ComputerDesktopIcon },
  { to: '/dashboard/alerts',  label: 'Alertas',      icon: BellIcon, badge: alertCount.value || null },
])

const mgmtNav = [
  { to: '/dashboard/reports',  label: 'Informes',      icon: DocumentTextIcon },
  { to: '/dashboard/settings', label: 'Configuración', icon: Cog6ToothIcon },
]

const pageMap = {
  '/dashboard':          'Resumen',
  '/dashboard/devices':  'Dispositivos',
  '/dashboard/alerts':   'Alertas',
  '/dashboard/reports':  'Informes semanales',
  '/dashboard/settings': 'Configuración',
}
const currentPageTitle = computed(() => pageMap[route.path] || 'Panel')

function isActive(to) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    userEmail.value = user.email
    const { data: admin } = await supabase.from('admin_users').select('org_id, organizations(name)').eq('id', user.id).single()
    if (admin?.organizations) orgName.value = admin.organizations.name
  }
  const { count } = await supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false)
  alertCount.value = count || 0
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
