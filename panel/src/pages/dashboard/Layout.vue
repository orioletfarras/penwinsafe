<template>
  <div class="min-h-screen flex text-white" style="font-family:'Inter',system-ui,sans-serif;background:#07090f">

    <!-- Sidebar -->
    <aside class="w-56 flex-shrink-0 fixed h-full flex flex-col" style="background:#0b0e16;border-right:1px solid rgba(255,255,255,0.06)">

      <!-- Logo -->
      <div class="h-14 flex items-center px-5" style="border-bottom:1px solid rgba(255,255,255,0.06)">
        <Logo :size="28" text-class="text-sm font-semibold text-white" />
      </div>

      <!-- Org selector -->
      <div class="px-3 pt-4 pb-2">
        <div class="flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer hover:bg-white/4 transition-colors group">
          <div class="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-black text-white flex-shrink-0"
            style="background:linear-gradient(135deg,#2563eb,#7c3aed)">
            {{ orgInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[13px] font-medium text-white leading-none truncate">{{ orgName }}</p>
            <p class="text-[10px] mt-0.5" style="color:#4b5563">Administrador</p>
          </div>
          <ChevronUpDownIcon class="w-3.5 h-3.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" style="color:#6b7280" />
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-3 mb-2" style="height:1px;background:rgba(255,255,255,0.05)"></div>

      <!-- Nav -->
      <nav class="flex-1 px-3 space-y-0.5 overflow-y-auto py-1">

        <NavItem v-for="item in mainNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />

        <div class="pt-4 pb-1">
          <p class="px-2.5 text-[10px] font-semibold uppercase tracking-widest" style="color:#374151">Gestión</p>
        </div>

        <NavItem v-for="item in mgmtNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />

      </nav>

      <!-- User footer -->
      <div class="px-3 py-3" style="border-top:1px solid rgba(255,255,255,0.06)">
        <button @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-white/4 transition-colors group text-left">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style="background:linear-gradient(135deg,#2563eb,#7c3aed)">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-medium leading-none truncate" style="color:#e5e7eb">{{ userEmail }}</p>
          </div>
          <ArrowRightStartOnRectangleIcon class="w-3.5 h-3.5 flex-shrink-0 transition-colors group-hover:text-red-400" style="color:#4b5563" />
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="ml-56 flex-1 flex flex-col min-h-screen">

      <!-- Top bar -->
      <header class="h-14 flex items-center justify-between px-7 flex-shrink-0 sticky top-0 z-10"
        style="background:rgba(7,9,15,0.85);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,0.06)">
        <div class="flex items-center gap-2">
          <span class="text-sm font-semibold text-white">{{ currentPageTitle }}</span>
          <ChevronRightIcon class="w-3.5 h-3.5" style="color:#374151" />
          <span class="text-sm" style="color:#6b7280">{{ orgName }}</span>
        </div>
        <div class="flex items-center gap-3">
          <div class="flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1.5 rounded-lg"
            style="color:#4ade80;background:rgba(74,222,128,0.08);border:1px solid rgba(74,222,128,0.15)">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#4ade80"></span>
            DNS protegido
          </div>
          <div class="relative">
            <button class="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
              <BellIcon class="w-4 h-4" style="color:#6b7280" />
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
      <main class="flex-1 p-7">
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
        class: [
          'flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition-all cursor-pointer',
          props.active
            ? 'font-medium'
            : 'hover:bg-white/4',
        ].join(' '),
        style: props.active
          ? 'background:rgba(37,99,235,0.12);color:#93c5fd'
          : 'color:#9ca3af',
      }, [
        h(props.icon, {
          class: 'w-4 h-4 flex-shrink-0',
          style: props.active ? 'color:#60a5fa' : 'color:#6b7280',
        }),
        h('span', { class: 'flex-1' }, props.label),
        props.badge
          ? h('span', {
              class: 'text-[10px] font-semibold px-1.5 py-0.5 rounded-full',
              style: 'background:rgba(239,68,68,0.15);color:#f87171'
            }, props.badge)
          : null,
        props.active
          ? h('span', {
              class: 'w-1 h-4 rounded-full flex-shrink-0',
              style: 'background:#3b82f6'
            })
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
