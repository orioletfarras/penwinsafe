<template>
  <div class="min-h-screen flex" style="font-family:'Inter',system-ui,sans-serif;background:#f4f5f7;color:#111827">

    <!-- Sidebar -->
    <aside class="w-[220px] flex-shrink-0 fixed h-full flex flex-col" style="background:#ffffff;border-right:1px solid #e5e7eb">

      <!-- Logo -->
      <div class="h-12 flex items-center px-4 flex-shrink-0" style="border-bottom:1px solid #e5e7eb">
        <Logo :size="24" text-class="text-[13px] font-semibold text-[#111827]" />
      </div>

      <!-- Org block / Switcher -->
      <div class="px-3 pt-3 pb-2 flex-shrink-0 relative">
        <!-- Superadmin: clickable org switcher -->
        <div v-if="isSuperAdmin"
          class="flex items-center gap-2.5 px-2.5 py-2 rounded cursor-pointer select-none"
          style="background:#eff6ff;border:1px solid #bfdbfe"
          @click="orgDropdownOpen = !orgDropdownOpen">
          <div class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style="background:#7c3aed">
            {{ orgInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-medium leading-none truncate" style="color:#111827">{{ orgName || '...' }}</p>
            <p class="text-[10px] mt-0.5" style="color:#7c3aed;font-weight:600">Superadmin</p>
          </div>
          <ChevronDownIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#7c3aed" />
        </div>

        <!-- Regular admin block -->
        <div v-else class="flex items-center gap-2.5 px-2.5 py-2 rounded" style="background:#eff6ff;border:1px solid #bfdbfe">
          <div class="w-5 h-5 rounded flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
            style="background:#006fff">
            {{ orgInitial }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[12px] font-medium leading-none truncate" style="color:#111827">{{ orgName || '...' }}</p>
            <p class="text-[10px] mt-0.5" style="color:#6b7280">Administrador</p>
          </div>
        </div>

        <!-- Org dropdown -->
        <div v-if="orgDropdownOpen && isSuperAdmin"
          class="absolute left-3 right-3 top-full mt-1 rounded-lg shadow-lg z-50 overflow-hidden"
          style="background:#fff;border:1px solid #e5e7eb">
          <!-- Search -->
          <div class="px-2 py-1.5" style="border-bottom:1px solid #f3f4f6">
            <div class="flex items-center gap-1.5 px-2 py-1 rounded" style="background:#f9fafb;border:1px solid #e5e7eb">
              <MagnifyingGlassIcon class="w-3 h-3 flex-shrink-0" style="color:#9ca3af" />
              <input
                v-model="orgSearch"
                placeholder="Buscar colegio..."
                class="flex-1 text-[11px] bg-transparent outline-none"
                style="color:#374151"
                @click.stop />
            </div>
          </div>
          <!-- Org list -->
          <div class="py-1 max-h-56 overflow-y-auto">
            <button v-for="org in filteredOrgs" :key="org.id"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors"
              :style="org.id === selectedOrgId
                ? 'background:#eff6ff;color:#7c3aed;font-weight:600'
                : 'color:#374151'"
              @mouseenter="e => e.currentTarget.style.background = org.id === selectedOrgId ? '#eff6ff' : '#f9fafb'"
              @mouseleave="e => e.currentTarget.style.background = org.id === selectedOrgId ? '#eff6ff' : 'transparent'"
              @click="handleSwitchOrg(org.id)">
              <BuildingOfficeIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#9ca3af" />
              {{ org.name }}
            </button>
            <p v-if="filteredOrgs.length === 0" class="px-3 py-2 text-[11px]" style="color:#9ca3af">Sin resultados</p>
          </div>
          <!-- Create new school -->
          <div style="border-top:1px solid #f3f4f6">
            <button
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors"
              style="color:#7c3aed"
              @mouseenter="e => e.currentTarget.style.background='#faf5ff'"
              @mouseleave="e => e.currentTarget.style.background='transparent'"
              @click="handleCreateOrg">
              <PlusCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
              Crear nuevo colegio
            </button>
          </div>
        </div>
      </div>

      <!-- Divider -->
      <div class="mx-3 mb-1" style="height:1px;background:#e5e7eb"></div>

      <!-- Nav -->
      <nav class="flex-1 px-2 py-1 space-y-px overflow-y-auto">

        <NavItem v-for="item in mainNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />

        <div class="pt-3 pb-1 px-1">
          <p class="text-[10px] font-semibold uppercase tracking-wider" style="color:#9ca3af">Gestión</p>
        </div>

        <NavItem v-for="item in mgmtNav" :key="item.to" v-bind="item" :active="isActive(item.to)" />


      </nav>

      <!-- User footer -->
      <div class="px-2 py-2 flex-shrink-0" style="border-top:1px solid #e5e7eb">
        <button @click="handleLogout"
          class="w-full flex items-center gap-2.5 px-2.5 py-2 rounded transition-colors text-left group"
          style="color:#6b7280"
          onmouseenter="this.style.background='#f9fafb';this.style.color='#374151'"
          onmouseleave="this.style.background='transparent';this.style.color='#6b7280'">
          <div class="w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold text-white flex-shrink-0"
            style="background:#006fff">
            {{ userInitials }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-[11px] leading-none truncate" style="color:#6b7280">{{ userEmail }}</p>
          </div>
          <ArrowRightStartOnRectangleIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#9ca3af" />
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="ml-[220px] flex-1 flex flex-col min-h-screen">

      <!-- Top bar -->
      <header class="h-12 flex items-center justify-between px-6 flex-shrink-0 sticky top-0 z-10"
        style="background:#ffffff;border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-1.5">
          <span class="text-[13px] font-medium" style="color:#111827">{{ currentPageTitle }}</span>
          <ChevronRightIcon class="w-3 h-3" style="color:#9ca3af" />
          <span class="text-[12px]" style="color:#6b7280">{{ orgName }}</span>
        </div>
        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded"
            style="color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            DNS activo
          </div>
          <div class="relative">
            <button class="w-7 h-7 flex items-center justify-center rounded transition-colors"
              style="color:#6b7280"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <BellIcon class="w-4 h-4" />
            </button>
            <span v-if="alertCount > 0"
              class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center"
              style="background:#dc2626">
              {{ alertCount > 9 ? '9+' : alertCount }}
            </span>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-6">
        <router-view v-if="selectedOrgId" v-slot="{ Component }">
          <transition name="page">
            <component :is="Component" :key="route.path + orgSwitchKey" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, defineComponent, h } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { loadUserContext, isSuperAdmin, allOrgs, selectedOrgId, switchOrg, selectedOrgName, orgSwitchKey } from '../../lib/orgStore'
import Logo from '../../components/Logo.vue'
import {
  Squares2X2Icon, ComputerDesktopIcon, BellIcon, DocumentTextIcon,
  Cog6ToothIcon, ArrowRightStartOnRectangleIcon, ChevronRightIcon,
  UserGroupIcon, ShieldExclamationIcon, WrenchScrewdriverIcon,
  ChevronDownIcon, BuildingOfficeIcon, MagnifyingGlassIcon, PlusCircleIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

// ── NavItem component ──────────────────────────────────────────────────────
const NavItem = defineComponent({
  props: { to: String, label: String, icon: Object, badge: Number, active: Boolean },
  setup(props) {
    return () => h(RouterLink, { to: props.to, class: 'block' }, () =>
      h('div', {
        class: 'flex items-center gap-2.5 px-2.5 py-[6px] text-[12px] transition-all cursor-pointer relative rounded-[2px]',
        style: props.active
          ? 'background:rgba(0,111,255,0.05);color:#006fff;border-left:2px solid #006fff;padding-left:8px'
          : 'color:#6b7280;border-left:2px solid transparent;padding-left:8px',
      }, [
        h(props.icon, {
          class: 'w-[15px] h-[15px] flex-shrink-0',
          style: props.active ? 'color:#006fff' : 'color:#9ca3af',
        }),
        h('span', { class: 'flex-1 font-medium' }, props.label),
        props.badge
          ? h('span', {
              class: 'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              style: 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca'
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
const orgDropdownOpen = ref(false)
const orgSearch = ref('')

const userInitials = computed(() => {
  const p = userEmail.value.split('@')[0].split(/[._-]/)
  return p.map(s => s[0]?.toUpperCase() || '').join('').slice(0, 2) || 'AD'
})
const orgInitial = computed(() => orgName.value[0]?.toUpperCase() || 'C')
const filteredOrgs = computed(() => {
  const q = orgSearch.value.trim().toLowerCase()
  return q ? allOrgs.value.filter(o => o.name.toLowerCase().includes(q)) : allOrgs.value
})

const mainNav = computed(() => [
  { to: '/dashboard',         label: 'Resumen',      icon: Squares2X2Icon },
  { to: '/dashboard/devices', label: 'Dispositivos', icon: ComputerDesktopIcon },
  { to: '/dashboard/alerts',  label: 'Alertas',      icon: BellIcon, badge: alertCount.value || undefined },
])
const mgmtNav = computed(() => [
  { to: '/dashboard/groups',      label: 'Clases',         icon: UserGroupIcon },
  { to: '/dashboard/filters',     label: 'Filtros',        icon: ShieldExclamationIcon },
  { to: '/dashboard/users',       label: 'Usuarios',       icon: UsersIcon },
  { to: '/dashboard/reports',     label: 'Informes',       icon: DocumentTextIcon },
  { to: '/dashboard/settings',    label: 'Configuración',  icon: Cog6ToothIcon },
  ...(isSuperAdmin.value ? [{ to: '/dashboard/superconfig', label: 'SuperConfig', icon: WrenchScrewdriverIcon }] : []),
])

const pageMap = {
  '/dashboard':             'Resumen',
  '/dashboard/devices':     'Dispositivos',
  '/dashboard/alerts':      'Alertas',
  '/dashboard/groups':      'Clases',
  '/dashboard/filters':     'Filtros',
  '/dashboard/reports':     'Informes',
  '/dashboard/users':       'Usuarios',
  '/dashboard/settings':    'Configuración',
  '/dashboard/superconfig': 'SuperConfig',
}
const currentPageTitle = computed(() => pageMap[route.path] || 'Panel')

function isActive(to) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}

async function loadAlertCount() {
  const { count } = await supabase
    .from('alerts')
    .select('*', { count: 'exact', head: true })
    .eq('resolved', false)
  alertCount.value = count || 0
}

onMounted(async () => {
  const admin = await loadUserContext()
  if (!admin) return
  userEmail.value = supabase.auth.currentSession?.user?.email || ''
  const { data: { user } } = await supabase.auth.getUser()
  userEmail.value = user?.email || ''
  orgName.value = isSuperAdmin.value ? (selectedOrgName() || 'Penwin') : (admin?.organizations?.name || '')
  await loadAlertCount()
})

async function handleSwitchOrg(orgId) {
  await switchOrg(orgId)
  orgName.value = allOrgs.value.find(o => o.id === orgId)?.name || ''
  orgDropdownOpen.value = false
  orgSearch.value = ''
  loadAlertCount()
}

function handleCreateOrg() {
  orgDropdownOpen.value = false
  orgSearch.value = ''
  router.push('/dashboard/superconfig?new=1')
}

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>

<style scoped>
.page-enter-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-leave-active {
  transition: opacity 0.1s ease;
  position: absolute;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
}
</style>
