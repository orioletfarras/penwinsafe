<template>
  <div class="min-h-screen flex" style="font-family:'Inter',system-ui,sans-serif;background:#0e1016;color:#e5e7eb">

    <!-- Sidebar -->
    <aside class="w-[220px] flex-shrink-0 fixed h-full flex flex-col" style="background:#111318;border-right:1px solid rgba(255,255,255,0.07)">

      <!-- Logo -->
      <div class="h-12 flex items-center px-4 flex-shrink-0" style="border-bottom:1px solid rgba(255,255,255,0.07)">
        <Logo :size="24" text-class="text-[13px] font-semibold text-white" />
      </div>

      <!-- Org block -->
      <div class="px-3 pt-3 pb-2 flex-shrink-0">
        <div class="flex items-center gap-2.5 px-2.5 py-2 rounded" style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06)">
          <div class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style="background:#006fff">
            {{ orgInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-medium text-white leading-none truncate">{{ orgName || '...' }}</p>
            <p class="text-[10px] mt-0.5" style="color:#4b5563">Administrador</p>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-3 mb-1" style="height:1px;background:rgba(255,255,255,0.07)"></div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-1 space-y-px overflow-y-auto">

        <NavItem v-for="item in mainNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />

        <div class="pt-3 pb-1 px-1">
          <p class="text-[10px] font-semibold uppercase tracking-widest" style="color:#374151">Gestión</p>
        </div>

        <NavItem v-for="item in mgmtNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />

      </nav>

      <!-- User footer -->
      <div class="px-2 py-2 flex-shrink-0" style="border-top:1px solid rgba(255,255,255,0.07)">
        <button @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded transition-colors text-left group"
          style="color:#6b7280"
          onmouseenter="this.style.background='rgba(255,255,255,0.04)';this.style.color='#9ca3af'"
          onmouseleave="this.style.background='transparent';this.style.color='#6b7280'">
          <div class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style="background:#1d4ed8">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] leading-none truncate" style="color:#9ca3af">{{ userEmail }}</p>
          </div>
          <ArrowRightStartOnRectangleIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#4b5563" />
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="ml-[220px] flex-1 flex flex-col min-h-screen">

      <!-- Top bar -->
      <header class="h-12 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10"
        style="background:#0e1016;border-bottom:1px solid rgba(255,255,255,0.07)">
        <div class="flex items-center gap-1.5">
          <span class="text-[13px] font-medium text-white">{{ currentPageTitle }}</span>
          <ChevronRightIcon class="w-3 h-3" style="color:#374151" />
          <span class="text-[12px]" style="color:#4b5563">{{ orgName }}</span>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded"
            style="color:#4ade80;background:rgba(74,222,128,0.07);border:1px solid rgba(74,222,128,0.12)">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#4ade80"></span>
            DNS activo
          </div>
          <div class="relative">
            <button class="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style="color:#6b7280"
              onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
              onmouseleave="this.style.background='transparent'">
              <BellIcon class="w-4 h-4" />
            </button>
            <span v-if="alertCount > 0"
              class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style="background:#ef4444">
              {{ alertCount > 9 ? '9+' : alertCount }}
            </span>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-6">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { supabase } from '../../lib/supabase'
import Logo from '../../components/Logo.vue'
import {
  Squares2X2Icon, ComputerDesktopIcon, BellIcon, DocumentTextIcon,
  Cog6ToothIcon, ArrowRightStartOnRectangleIcon, ChevronUpDownIcon, ChevronRightIcon
} from '@heroicons/vue/24/outline'

// ── NavItem component ──────────────────────────────────────────────────────
const NavItem = defineComponent({
  props: { to: String, label: String, icon: Object, badge: Number, active: Boolean },
  setup(props) {
    return () => h(RouterLink, { to: props.to, class: 'block' }, () =>
      h('div', {
        class: 'flex items-center gap-2.5 px-2.5 py-[6px] text-[12px] transition-all cursor-pointer relative rounded-[2px]',
        style: props.active
          ? 'background:rgba(0,111,255,0.08);color:#ffffff;border-left:2px solid #006fff;padding-left:8px'
          : 'color:#6b7280;border-left:2px solid transparent;padding-left:8px',
      }, [
        h(props.icon, {
          class: 'w-[15px] h-[15px] flex-shrink-0',
          style: props.active ? 'color:#006fff' : 'color:#4b5563',
        }),
        h('span', { class: 'flex-1 font-medium' }, props.label),
        props.badge
          ? h('span', {
              class: 'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              style: 'background:rgba(239,68,68,0.12);color:#f87171'
            }, props.badge)
          : null,
      ])
    )
  }
})

// ── Setup ──────────────────────────────────────────────────────────────────
const router = useRouter()
const route  = useRoute()

const userEmail  = ref('')
const orgName    = ref('')
const alertCount = ref(0)

const userInitials = computed(() => {
  const p = userEmail.value.split('@')[0].split(/[._-]/)
  return p.map(s => s[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AD'
})
const orgInitial = computed(() => orgName.value[0]?.toUpperCase() || 'C')

const mainNav = computed(() => [
  { to: '/dashboard',         label: 'Resumen',      icon: Squares2X2Icon },
  { to: '/dashboard/devices', label: 'Dispositivos', icon: ComputerDesktopIcon },
  { to: '/dashboard/alerts',  label: 'Alertas',      icon: BellIcon, badge: alertCount.value || undefined },
])
const mgmtNav = [
  { to: '/dashboard/reports',  label: 'Informes',      icon: DocumentTextIcon },
  { to: '/dashboard/settings', label: 'Configuración', icon: Cog6ToothIcon },
]

const pageMap = {
  '/dashboard':          'Resumen',
  '/dashboard/devices':  'Dispositivos',
  '/dashboard/alerts':   'Alertas',
  '/dashboard/reports':  'Informes',
  '/dashboard/settings': 'Configuración',
}
const currentPageTitle = computed(() => pageMap[route.path] || 'Panel')

function isActive(to) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  userEmail.value = user.email
  const { data: admin } = await supabase
    .from('admin_users')
    .select('organizations(name)')
    .eq('id', user.id)
    .single()
  if (admin?.organizations) orgName.value = admin.organizations.name
  const { count } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false)
  alertCount.value = count || 0
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
