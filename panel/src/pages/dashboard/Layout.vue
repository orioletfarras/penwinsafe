<template>
  <div class="min-h-screen flex" style="font-family:'Inter',system-ui,sans-serif;background:#ffffff;color:#111827">

    <!-- Sidebar -->
    <aside
      class="flex-shrink-0 fixed h-full flex flex-col transition-all duration-300"
      :style="`width:${sidebarCollapsed ? 64 : 240}px;background:#0f172a`">

      <!-- Logo -->
      <div class="flex items-center flex-shrink-0 transition-all duration-300"
        :style="`height:56px;border-bottom:1px solid rgba(255,255,255,0.07);${sidebarCollapsed ? 'justify-content:center;padding:0' : 'padding:0 20px'}`">
        <div v-if="sidebarCollapsed"
          class="w-8 h-8 rounded-lg flex items-center justify-center text-[14px] font-bold text-white flex-shrink-0"
          style="background:#006fff">P</div>
        <Logo v-else :size="26" text-class="text-[14px] font-bold text-white" />
      </div>

      <!-- Org block -->
      <div class="pt-3 pb-2 flex-shrink-0 relative" :class="sidebarCollapsed ? 'px-2' : 'px-3'">
        <div
          class="flex items-center rounded-lg cursor-pointer select-none transition-all duration-300"
          :class="sidebarCollapsed ? 'justify-center p-1.5' : 'gap-2.5 px-3 py-2.5'"
          :style="isSuperAdmin
            ? 'background:rgba(124,58,237,0.18);border:1px solid rgba(124,58,237,0.3)'
            : 'background:rgba(0,111,255,0.15);border:1px solid rgba(0,111,255,0.25)'"
          :title="sidebarCollapsed ? orgName : undefined"
          @click="isSuperAdmin && !sidebarCollapsed && (orgDropdownOpen = !orgDropdownOpen)">
          <div class="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            :style="isSuperAdmin ? 'background:#7c3aed' : 'background:#006fff'">
            {{ orgInitial }}
          </div>
          <template v-if="!sidebarCollapsed">
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-semibold leading-none truncate" style="color:#f8fafc">{{ orgName || '...' }}</p>
              <p class="text-[10px] mt-1 font-medium" :style="isSuperAdmin ? 'color:#a78bfa' : 'color:#60a5fa'">
                {{ isSuperAdmin ? 'Superadmin' : 'Administrador' }}
              </p>
            </div>
            <ChevronDownIcon v-if="isSuperAdmin" class="w-3.5 h-3.5 flex-shrink-0 transition-transform"
              :style="(isSuperAdmin ? 'color:#a78bfa' : 'color:#60a5fa') + (orgDropdownOpen ? ';transform:rotate(180deg)' : '')" />
          </template>
        </div>

        <!-- Org dropdown (only when expanded) -->
        <div v-if="orgDropdownOpen && isSuperAdmin && !sidebarCollapsed"
          class="absolute left-3 right-3 top-full mt-1 rounded-lg z-50 overflow-hidden"
          style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.1)">
          <div class="px-2.5 py-2" style="border-bottom:1px solid #f3f4f6">
            <div class="flex items-center gap-2 px-2.5 rounded-md" style="background:#f9fafb;border:1px solid #e5e7eb;height:30px">
              <MagnifyingGlassIcon class="w-3 h-3 flex-shrink-0" style="color:#9ca3af" />
              <input v-model="orgSearch" placeholder="Buscar colegio..."
                class="flex-1 text-[11px] bg-transparent outline-none" style="color:#374151" @click.stop />
            </div>
          </div>
          <div class="py-1 max-h-56 overflow-y-auto">
            <button v-for="org in filteredOrgs" :key="org.id"
              class="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[12px] transition-colors"
              :style="org.id === selectedOrgId ? 'background:#f0f0ff;color:#7c3aed;font-weight:600' : 'color:#374151'"
              @mouseenter="e => e.currentTarget.style.background = org.id === selectedOrgId ? '#f0f0ff' : '#f9fafb'"
              @mouseleave="e => e.currentTarget.style.background = org.id === selectedOrgId ? '#f0f0ff' : 'transparent'"
              @click="handleSwitchOrg(org.id)">
              <BuildingOfficeIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#9ca3af" />
              {{ org.name }}
            </button>
            <p v-if="filteredOrgs.length === 0" class="px-3 py-2 text-[11px]" style="color:#9ca3af">Sin resultados</p>
          </div>
          <div style="border-top:1px solid #f3f4f6">
            <button class="w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] transition-colors font-medium"
              style="color:#7c3aed"
              @mouseenter="e => e.currentTarget.style.background='#faf5ff'"
              @mouseleave="e => e.currentTarget.style.background='transparent'"
              @click="handleCreateOrg">
              <PlusCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
              Nuevo colegio
            </button>
          </div>
        </div>
      </div>

      <!-- Nav -->
      <nav class="flex-1 py-2 overflow-y-auto overflow-x-hidden" :class="sidebarCollapsed ? 'px-2' : 'px-3'" style="display:flex;flex-direction:column;gap:1px">

        <NavItem v-for="item in mainNav" :key="item.to" v-bind="item" :active="isActive(item.to)" :collapsed="sidebarCollapsed" />

        <div v-if="!sidebarCollapsed" class="px-1 pt-5 pb-2">
          <p class="text-[9px] font-semibold uppercase tracking-widest" style="color:rgba(255,255,255,0.3)">Gestión</p>
        </div>
        <div v-else class="pt-3 pb-1" style="border-top:1px solid rgba(255,255,255,0.07);margin:4px 0"></div>

        <NavItem v-for="item in mgmtNav" :key="item.to" v-bind="item" :active="isActive(item.to)" :collapsed="sidebarCollapsed" />

        <!-- Collapse toggle button -->
        <div class="mt-auto pt-2">
          <button
            @click="toggleSidebar"
            class="w-full flex items-center rounded-md py-[7px] transition-all"
            :class="sidebarCollapsed ? 'justify-center px-1' : 'gap-2.5 px-2.5'"
            style="color:rgba(255,255,255,0.35)"
            onmouseenter="this.style.background='rgba(255,255,255,0.07)';this.style.color='rgba(255,255,255,0.7)'"
            onmouseleave="this.style.background='transparent';this.style.color='rgba(255,255,255,0.35)'">
            <ChevronLeftIcon v-if="!sidebarCollapsed" class="w-[15px] h-[15px] flex-shrink-0" />
            <ChevronRightIcon v-else class="w-[15px] h-[15px] flex-shrink-0" />
            <span v-if="!sidebarCollapsed" class="text-[12px]">Colapsar</span>
          </button>
        </div>

      </nav>

      <!-- User footer -->
      <div class="user-menu-area flex-shrink-0 relative" :class="sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-3'" style="border-top:1px solid rgba(255,255,255,0.07)">
        <!-- User menu popup -->
        <div v-if="userMenuOpen"
          class="absolute left-3 right-3 bottom-full mb-1 rounded-lg overflow-hidden z-50"
          style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 16px 40px rgba(0,0,0,0.25)">
          <div class="px-3 py-2.5" style="border-bottom:1px solid #f3f4f6">
            <p class="text-[12px] font-semibold truncate" style="color:#111827">{{ userEmail }}</p>
            <p class="text-[10px] mt-0.5 font-mono" style="color:#9ca3af" :title="buildTime">build {{ buildShort }}</p>
          </div>
          <button @click="handleLogout"
            class="w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-[12px] transition-colors"
            style="color:#dc2626"
            onmouseenter="this.style.background='#fef2f2'"
            onmouseleave="this.style.background='transparent'">
            <ArrowRightStartOnRectangleIcon class="w-3.5 h-3.5 flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>

        <button @click="userMenuOpen = !userMenuOpen"
          class="w-full flex items-center rounded-lg transition-colors text-left"
          :class="sidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 px-3 py-2.5'"
          :style="userMenuOpen ? 'background:rgba(255,255,255,0.08)' : ''"
          :title="sidebarCollapsed ? userEmail : undefined"
          onmouseenter="this.style.background='rgba(255,255,255,0.08)'"
          onmouseleave="e => { if (!this._userMenuOpen) this.style.background='transparent' }">
          <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style="background:#006fff">
            {{ userInitials }}
          </div>
          <template v-if="!sidebarCollapsed">
            <div class="flex-1 min-w-0">
              <p class="text-[12px] font-medium leading-none truncate" style="color:rgba(255,255,255,0.85)">{{ userEmail }}</p>
              <p class="text-[10px] mt-1" style="color:rgba(255,255,255,0.35)">Mi cuenta</p>
            </div>
            <ChevronDownIcon class="w-3.5 h-3.5 flex-shrink-0 transition-transform" style="color:rgba(255,255,255,0.3)"
              :style="userMenuOpen ? 'transform:rotate(180deg)' : ''" />
          </template>
        </button>
      </div>
    </aside>

    <!-- Main area -->
    <div class="flex-1 flex flex-col min-h-screen transition-all duration-300" :style="`margin-left:${sidebarCollapsed ? 64 : 240}px`">

      <!-- Progress bar -->
      <div class="sticky top-0 z-20" style="height:2px">
        <div v-if="routeLoading" class="h-full progress-bar" style="background:#006fff"></div>
      </div>

      <!-- Top bar -->
      <header class="flex items-center justify-between px-6 flex-shrink-0 sticky z-10"
        style="top:2px;height:52px;background:#ffffff;border-bottom:1px solid #e8eaed;box-shadow:0 1px 8px rgba(0,0,0,0.06)">
        <!-- Global search -->
        <div class="search-area relative flex-1 max-w-sm">
          <div class="flex items-center gap-2 px-3 rounded-lg transition-all"
            style="height:32px;background:#f9fafb;border:1px solid #e5e7eb">
            <MagnifyingGlassIcon class="w-3.5 h-3.5 flex-shrink-0" style="color:#9ca3af" />
            <input
              v-model="searchQuery"
              @focus="searchOpen = true"
              @input="runSearch"
              placeholder="Buscar dispositivos, alertas..."
              class="flex-1 bg-transparent text-[12px] outline-none"
              style="color:#111827" />
            <kbd v-if="!searchQuery" class="text-[9px] px-1.5 py-0.5 rounded" style="color:#d1d5db;border:1px solid #e5e7eb;font-family:inherit">⌘K</kbd>
            <button v-if="searchQuery" @click="clearSearch" style="color:#9ca3af">
              <XMarkIcon class="w-3 h-3" />
            </button>
          </div>

          <!-- Results dropdown -->
          <div v-if="searchOpen"
            class="absolute left-0 right-0 top-full mt-1.5 rounded-xl overflow-hidden z-50"
            style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 12px 32px rgba(0,0,0,0.12)">

            <!-- Quick actions (always shown when focused) -->
            <div>
              <div class="px-3 py-1.5" style="background:#f9fafb;border-bottom:1px solid #f3f4f6">
                <p class="section-label">Acciones rápidas</p>
              </div>
              <button v-for="action in QUICK_ACTIONS" :key="action.label"
                @click="action.action()"
                class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                onmouseenter="this.style.background='#f9fafb'"
                onmouseleave="this.style.background='transparent'">
                <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" :style="`background:${action.color}14`">
                  <component :is="action.icon" class="w-3.5 h-3.5" :style="`color:${action.color}`" />
                </div>
                <p class="text-[12px] font-medium" style="color:#111827">{{ action.label }}</p>
              </button>
            </div>

            <div v-if="searchLoading" class="px-4 py-3 text-[12px]" style="color:#9ca3af;border-top:1px solid #f3f4f6">Buscando...</div>

            <template v-else-if="searchResults.length">
              <div v-for="group in searchResults" :key="group.type">
                <div class="px-3 py-1.5" style="background:#f9fafb;border-bottom:1px solid #f3f4f6;border-top:1px solid #f3f4f6">
                  <p class="section-label">{{ group.label }}</p>
                </div>
                <button v-for="item in group.items" :key="item.id"
                  @click="goToResult(item)"
                  class="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                  onmouseenter="this.style.background='#f9fafb'"
                  onmouseleave="this.style.background='transparent'">
                  <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" :style="`background:${item.color}14`">
                    <component :is="item.icon" class="w-3.5 h-3.5" :style="`color:${item.color}`" />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-[12px] font-medium truncate" style="color:#111827">{{ item.title }}</p>
                    <p v-if="item.subtitle" class="text-[10px] truncate" style="color:#9ca3af">{{ item.subtitle }}</p>
                  </div>
                </button>
              </div>
            </template>

            <div v-else-if="searchQuery.length > 1" class="px-4 py-4 text-center" style="border-top:1px solid #f3f4f6">
              <p class="text-[12px]" style="color:#9ca3af">Sin resultados para "{{ searchQuery }}"</p>
            </div>
          </div>
        </div>

        <div class="flex items-center gap-2.5">
          <div class="flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded"
            style="color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            DNS activo
          </div>

          <!-- Activity feed button -->
          <Tooltip text="Actividad en tiempo real">
          <div class="relative">
            <button @click="openActivity"
              class="w-7 h-7 flex items-center justify-center rounded transition-colors"
              :style="activityOpen ? 'background:#f0f2f5;color:#111827' : 'color:#6b7280'"
              onmouseenter="this.style.background='#f0f2f5'"
              onmouseleave="e => { this.style.background=this._activityOpen?'#f0f2f5':'transparent' }">
              <BoltIcon class="w-4 h-4" />
            </button>
            <span v-if="activityBadge > 0"
              class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center pointer-events-none"
              style="background:#7c3aed">
              {{ activityBadge > 9 ? '9+' : activityBadge }}
            </span>
          </div>
          </Tooltip>

          <Tooltip text="Alertas">
          <div class="bell-menu-area relative">
            <button @click="bellOpen = !bellOpen"
              class="w-7 h-7 flex items-center justify-center rounded transition-colors"
              :style="bellOpen ? 'background:#f0f2f5;color:#111827' : 'color:#6b7280'"
              onmouseenter="this.style.background='#f0f2f5'"
              onmouseleave="e => { if (!this._bellOpen) this.style.background='transparent' }">
              <BellIcon class="w-4 h-4" />
            </button>
            <span v-if="alertCount > 0"
              class="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center pointer-events-none"
              style="background:#dc2626">
              {{ alertCount > 9 ? '9+' : alertCount }}
            </span>

            <!-- Bell dropdown -->
            <div v-if="bellOpen"
              class="absolute right-0 top-full mt-1.5 w-80 rounded-xl overflow-hidden z-50"
              style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 12px 32px rgba(0,0,0,0.12)">
              <div class="flex items-center justify-between px-4 py-3" style="border-bottom:1px solid #f3f4f6">
                <div class="flex items-center gap-1.5">
                  <BellIcon class="w-3.5 h-3.5" style="color:#111827" />
                  <p class="text-[12px] font-semibold" style="color:#111827">Alertas</p>
                  <span v-if="alertCount > 0" class="text-[10px] font-bold px-1.5 py-0.5 rounded"
                    style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">{{ alertCount }}</span>
                </div>
                <router-link to="/dashboard/alerts" @click="bellOpen = false"
                  class="text-[11px] font-medium" style="color:#006fff">Ver todo</router-link>
              </div>

              <div class="max-h-72 overflow-y-auto">
                <div v-for="a in bellAlerts" :key="a.id"
                  class="px-4 py-3 transition-colors"
                  style="border-bottom:1px solid #f9fafb"
                  onmouseenter="this.style.background='#f9fafb'"
                  onmouseleave="this.style.background='transparent'">
                  <div class="flex items-start gap-2.5">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                      :style="{ background: { critical:'#ef4444', danger:'#f97316', warning:'#eab308', info:'#3b82f6' }[a.severity] || '#9ca3af' }"></span>
                    <div class="flex-1 min-w-0">
                      <p class="text-[12px] leading-snug" style="color:#111827">{{ a.message }}</p>
                      <p class="text-[10px] mt-0.5" style="color:#9ca3af">{{ formatBellDate(a.created_at) }}</p>
                    </div>
                    <button v-if="!a.resolved" @click="resolveBell(a)"
                      class="text-[10px] px-2 py-0.5 rounded flex-shrink-0"
                      style="color:#6b7280;border:1px solid #e5e7eb;white-space:nowrap"
                      onmouseenter="this.style.background='#f3f4f6'"
                      onmouseleave="this.style.background='transparent'">
                      Resolver
                    </button>
                    <span v-else class="text-[10px] flex-shrink-0" style="color:#16a34a">✓</span>
                  </div>
                </div>
                <div v-if="bellAlerts.length === 0" class="px-4 py-6 text-center">
                  <p class="text-[12px]" style="color:#9ca3af">Sin alertas pendientes</p>
                </div>
              </div>
            </div>
          </div>
          </Tooltip>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-6">
        <div style="max-width:1280px;margin:0 auto">
          <router-view v-if="selectedOrgId" v-slot="{ Component }">
            <transition name="page">
              <component :is="Component" :key="route.path + orgSwitchKey" />
            </transition>
          </router-view>
        </div>
      </main>
    </div>

    <!-- Activity Feed Drawer -->
    <Teleport to="body">
      <!-- Backdrop -->
      <div v-if="activityOpen"
        class="fixed inset-0 z-40"
        style="background:rgba(0,0,0,0.3)"
        @click="activityOpen = false">
      </div>
      <!-- Drawer -->
      <div
        class="fixed top-0 right-0 h-full z-50 flex flex-col transition-transform duration-300"
        style="width:320px;background:#fff;border-left:1px solid #e5e7eb;box-shadow:-8px 0 32px rgba(0,0,0,0.12)"
        :style="activityOpen ? 'transform:translateX(0)' : 'transform:translateX(100%)'">
        <div class="flex items-center justify-between px-4 py-3 flex-shrink-0" style="border-bottom:1px solid #f3f4f6">
          <div class="flex items-center gap-2">
            <BoltIcon class="w-4 h-4" style="color:#7c3aed" />
            <p class="text-[13px] font-semibold" style="color:#111827">Actividad en tiempo real</p>
          </div>
          <button @click="activityOpen = false"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#9ca3af"
            onmouseenter="this.style.background='#f3f4f6'"
            onmouseleave="this.style.background='transparent'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
        <div class="flex-1 overflow-y-auto">
          <div v-if="activityFeed.length === 0" class="flex flex-col items-center justify-center h-full gap-3 p-8">
            <BoltIcon class="w-8 h-8" style="color:#e5e7eb" />
            <p class="text-[12px] text-center" style="color:#9ca3af">Los eventos de dispositivos y alertas aparecerán aquí en tiempo real</p>
          </div>
          <div v-else>
            <div v-for="event in activityFeed" :key="event.id"
              class="px-4 py-3 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2.5">
                <div class="w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5"
                  :style="`background:${event.color}14`">
                  <component :is="event.icon" class="w-3.5 h-3.5" :style="`color:${event.color}`" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-medium" style="color:#111827">{{ event.title }}</p>
                  <p v-if="event.subtitle" class="text-[10px] mt-0.5" style="color:#9ca3af">{{ event.subtitle }}</p>
                  <p class="text-[9px] mt-1" style="color:#d1d5db">{{ event.time }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="px-4 py-2 flex-shrink-0" style="border-top:1px solid #f3f4f6">
          <button @click="activityFeed = []"
            class="text-[11px] w-full py-1.5 rounded transition-colors"
            style="color:#9ca3af"
            onmouseenter="this.style.background='#f9fafb'"
            onmouseleave="this.style.background='transparent'">
            Limpiar historial
          </button>
        </div>
      </div>
    </Teleport>

  </div>
  <ToastContainer />
  <OnboardingWizard v-model="showOnboarding" :initial-org-name="onboardingOrgName" :initial-center-code="onboardingCenterCode" />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, defineComponent, h } from 'vue'
import { useRouter, useRoute, RouterLink } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { loadUserContext, isSuperAdmin, allOrgs, selectedOrgId, switchOrg, selectedOrgName, orgSwitchKey } from '../../lib/orgStore'
import Logo from '../../components/Logo.vue'
import ToastContainer from '../../components/ToastContainer.vue'
import Tooltip from '../../components/Tooltip.vue'
import OnboardingWizard from '../../components/OnboardingWizard.vue'
import {
  Squares2X2Icon, ComputerDesktopIcon, BellIcon, DocumentTextIcon,
  Cog6ToothIcon, ArrowRightStartOnRectangleIcon, ChevronRightIcon,
  UserGroupIcon, ShieldExclamationIcon, WrenchScrewdriverIcon,
  ChevronDownIcon, BuildingOfficeIcon, MagnifyingGlassIcon, PlusCircleIcon,
  UsersIcon, XMarkIcon, ExclamationTriangleIcon, ClipboardDocumentListIcon,
  BellAlertIcon, ClockIcon, ChevronLeftIcon, BoltIcon, CloudIcon, ChartBarIcon,
} from '@heroicons/vue/24/outline'

// ── NavItem component ──────────────────────────────────────────────────────
const NavItem = defineComponent({
  props: { to: String, label: String, icon: Object, badge: Number, active: Boolean, collapsed: Boolean },
  setup(props) {
    return () => h(RouterLink, { to: props.to, class: 'block' }, () =>
      h('div', {
        class: props.collapsed
          ? 'flex items-center justify-center py-[7px] text-[12px] transition-all cursor-pointer rounded-md'
          : 'flex items-center gap-2.5 px-2.5 py-[7px] text-[12px] transition-all cursor-pointer rounded-md',
        title: props.collapsed ? props.label : undefined,
        style: props.active
          ? 'background:rgba(0,111,255,0.22);color:#ffffff;font-weight:600'
          : 'color:rgba(255,255,255,0.55)',
        onmouseenter(e) { if (!props.active) e.currentTarget.style.background = 'rgba(255,255,255,0.07)' },
        onmouseleave(e) { if (!props.active) e.currentTarget.style.background = 'transparent' },
      }, [
        h(props.icon, {
          class: 'w-[15px] h-[15px] flex-shrink-0',
          style: props.active ? 'color:#60a5fa' : 'color:rgba(255,255,255,0.4)',
        }),
        !props.collapsed ? h('span', { class: 'flex-1' }, props.label) : null,
        !props.collapsed && props.badge
          ? h('span', {
              class: 'text-[10px] font-semibold px-1.5 py-0.5 rounded',
              style: 'background:rgba(239,68,68,0.25);color:#fca5a5;border:1px solid rgba(239,68,68,0.3)'
            }, props.badge)
          : null,
      ])
    )
  }
})

// ── Setup ──────────────────────────────────────────────────────────────────
const router = useRouter()
const route  = useRoute()
const routeLoading = ref(false)

router.beforeEach(() => { routeLoading.value = true })
router.afterEach(()  => { setTimeout(() => { routeLoading.value = false }, 300) })

const userEmail  = ref('')
const orgName    = ref('')
const alertCount = ref(0)
const orgDropdownOpen = ref(false)
const orgSearch = ref('')
const userMenuOpen = ref(false)
const bellOpen = ref(false)
const bellAlerts = ref([])
const searchQuery = ref('')
const showOnboarding = ref(false)
const onboardingOrgName = ref('')
const onboardingCenterCode = ref('')
const searchOpen = ref(false)
const searchLoading = ref(false)
const searchResults = ref([])

// Sidebar collapse
const sidebarCollapsed = ref(localStorage.getItem('pws_sidebar_collapsed') === 'true')

// Show DNS Escolar nav item when cloudflare zones are active for this org
const cfActive = ref(false)
async function checkCfActive() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('cloudflare_configs')
    .select('zones_created')
    .eq('org_id', selectedOrgId.value)
    .single()
  cfActive.value = data?.zones_created === true
}
function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('pws_sidebar_collapsed', sidebarCollapsed.value)
}

// Activity feed
const activityOpen = ref(false)
const activityFeed = ref([])
const activityBadge = ref(0)

function openActivity() {
  activityOpen.value = true
  activityBadge.value = 0
}

function pushActivity(event) {
  activityFeed.value.unshift({ ...event, id: Date.now() + Math.random(), time: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })
  if (activityFeed.value.length > 30) activityFeed.value = activityFeed.value.slice(0, 30)
  if (!activityOpen.value) activityBadge.value++
}

// Quick actions for command palette
const QUICK_ACTIONS = [
  { label: 'Ver alertas críticas', icon: BellIcon, color: '#ef4444', action: () => { router.push('/dashboard/alerts'); clearSearch() } },
  { label: 'Generar informe',      icon: DocumentTextIcon, color: '#006fff', action: () => { router.push('/dashboard/reports'); clearSearch() } },
  { label: 'Gestionar clases',     icon: UserGroupIcon, color: '#7c3aed', action: () => { router.push('/dashboard/groups'); clearSearch() } },
  { label: 'Registros',            icon: ClipboardDocumentListIcon, color: '#6b7280', action: () => { router.push('/dashboard/audit'); clearSearch() } },
]

const buildTime  = __BUILD_TIME__
const buildShort = computed(() => {
  const d = new Date(buildTime)
  return d.toLocaleDateString('es-ES', { day:'2-digit', month:'2-digit', year:'2-digit' })
    + ' ' + d.toLocaleTimeString('es-ES', { hour:'2-digit', minute:'2-digit' })
})

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
  { to: '/dashboard/groups',        label: 'Clases',            icon: UserGroupIcon },
  { to: '/dashboard/filters',       label: 'Filtros',           icon: ShieldExclamationIcon },
  { to: '/dashboard/custom-alerts', label: 'Alertas custom',    icon: BellAlertIcon },
  { to: '/dashboard/kiosk',         label: 'Horario kiosco',    icon: ClockIcon },
  { to: '/dashboard/users',         label: 'Usuarios',          icon: UsersIcon },
  { to: '/dashboard/reports',       label: 'Informes',          icon: DocumentTextIcon },
  { to: '/dashboard/audit',         label: 'Registro',          icon: ClipboardDocumentListIcon },
  { to: '/dashboard/settings',      label: 'Configuración',     icon: Cog6ToothIcon },
  ...(isSuperAdmin.value ? [{ to: '/dashboard/superconfig', label: 'SuperConfig', icon: WrenchScrewdriverIcon }] : []),
  ...(cfActive.value ? [{ to: '/dashboard/cloudflare', label: 'DNS Escolar', icon: CloudIcon }] : []),
  { to: '/dashboard/traffic', label: 'Tráfico', icon: ChartBarIcon },
])

const pageMap = {
  '/dashboard':             { title: 'Resumen',        desc: 'Actividad y estado general del centro' },
  '/dashboard/devices':     { title: 'Dispositivos',   desc: 'Gestiona y monitoriza los equipos del centro' },
  '/dashboard/alerts':      { title: 'Alertas',        desc: 'Notificaciones de actividad sospechosa' },
  '/dashboard/groups':      { title: 'Clases',         desc: 'Asigna tutores y configura notificaciones por aula' },
  '/dashboard/filters':     { title: 'Filtros',        desc: 'Palabras clave y categorías bloqueadas' },
  '/dashboard/reports':       { title: 'Informes',          desc: 'Resúmenes semanales de actividad por dispositivo' },
  '/dashboard/custom-alerts': { title: 'Alertas custom',    desc: 'Reglas personalizadas de detección de actividad' },
  '/dashboard/kiosk':         { title: 'Horario kiosco',    desc: 'Bloqueo automático de dispositivos por horario' },
  '/dashboard/users':         { title: 'Usuarios',          desc: 'Administradores con acceso al panel' },
  '/dashboard/settings':    { title: 'Configuración',  desc: 'Datos del centro y preferencias de la cuenta' },
  '/dashboard/superconfig': { title: 'SuperConfig',    desc: 'Gestión global de centros y configuración avanzada' },
  '/dashboard/cloudflare':  { title: 'DNS Escolar', desc: 'Filtrado DNS con tres zonas de protección por perfil' },
  '/dashboard/traffic':     { title: 'Tráfico',     desc: 'Consumo real de ancho de banda por aplicación y alumno' },
}
const currentPageTitle = computed(() => pageMap[route.path]?.title || 'Panel')
const currentPageDesc  = computed(() => pageMap[route.path]?.desc  || '')

function isActive(to) {
  return to === '/dashboard' ? route.path === '/dashboard' : route.path.startsWith(to)
}

async function loadAlertCount() {
  const [{ count }, { data }] = await Promise.all([
    supabase.from('alerts').select('*', { count: 'exact', head: true }).eq('resolved', false),
    supabase.from('alerts').select('id,message,severity,created_at,resolved').eq('resolved', false).order('created_at', { ascending: false }).limit(10),
  ])
  alertCount.value = count || 0
  bellAlerts.value = data || []
}

async function resolveBell(alert) {
  await supabase.from('alerts').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', alert.id)
  alert.resolved = true
  alertCount.value = Math.max(0, alertCount.value - 1)
}

function formatBellDate(d) {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'ahora mismo'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}

let activityChannel = null

onMounted(async () => {
  const admin = await loadUserContext()
  if (!admin) return
  userEmail.value = supabase.auth.currentSession?.user?.email || ''
  const { data: { user } } = await supabase.auth.getUser()
  userEmail.value = user?.email || ''
  orgName.value = isSuperAdmin.value ? (selectedOrgName() || 'Penwin') : (admin?.organizations?.name || '')
  await loadAlertCount()
  await checkCfActive()

  // Show onboarding for new orgs (no devices, not dismissed)
  if (!localStorage.getItem('pws_onboarding_done')) {
    const { count } = await supabase.from('devices').select('*', { count: 'exact', head: true })
    if ((count || 0) === 0) {
      onboardingOrgName.value = orgName.value
      const { data: org } = await supabase.from('organizations').select('center_code').eq('id', selectedOrgId.value).single()
      onboardingCenterCode.value = org?.center_code || '—'
      showOnboarding.value = true
    }
  }

  // Activity feed subscriptions
  activityChannel = supabase.channel('layout-activity')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, p => {
      if (p.new.status !== p.old?.status) {
        const statusLabel = { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[p.new.status] || p.new.status
        pushActivity({
          type: 'device',
          icon: ComputerDesktopIcon,
          color: p.new.status === 'online' ? '#16a34a' : p.new.status === 'locked' ? '#dc2626' : '#9ca3af',
          title: p.new.name || 'Dispositivo',
          subtitle: `Estado cambiado a ${statusLabel}`,
        })
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'alerts' }, p => {
      pushActivity({
        type: 'alert',
        icon: BellIcon,
        color: { critical: '#ef4444', danger: '#f97316', warning: '#eab308', info: '#3b82f6' }[p.new.severity] || '#9ca3af',
        title: 'Nueva alerta',
        subtitle: p.new.message?.slice(0, 60),
      })
    })
    .subscribe()
})

onUnmounted(() => {
  if (activityChannel) supabase.removeChannel(activityChannel)
})

async function handleSwitchOrg(orgId) {
  await switchOrg(orgId)
  orgName.value = allOrgs.value.find(o => o.id === orgId)?.name || ''
  orgDropdownOpen.value = false
  orgSearch.value = ''
  loadAlertCount()
  checkCfActive()
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

function handleClickOutside(e) {
  if (userMenuOpen.value && !e.target.closest('.user-menu-area')) userMenuOpen.value = false
  if (bellOpen.value && !e.target.closest('.bell-menu-area')) bellOpen.value = false
  if (searchOpen.value && !e.target.closest('.search-area')) { searchOpen.value = false }
}

let searchTimer = null
async function runSearch() {
  searchResults.value = []
  if (searchQuery.value.length < 2) return
  clearTimeout(searchTimer)
  searchTimer = setTimeout(async () => {
    searchLoading.value = true
    const q = searchQuery.value.trim()
    const [{ data: devices }, { data: alerts }] = await Promise.all([
      supabase.from('devices').select('id,name,ip_address,status').ilike('name', `%${q}%`).limit(5),
      supabase.from('alerts').select('id,message,severity').ilike('message', `%${q}%`).eq('resolved', false).limit(5),
    ])
    const groups = []
    if (devices?.length) groups.push({
      type: 'devices', label: 'Dispositivos',
      items: devices.map(d => ({
        id: d.id, title: d.name, subtitle: d.ip_address,
        icon: ComputerDesktopIcon, color: '#006fff',
        to: '/dashboard/devices',
      }))
    })
    if (alerts?.length) groups.push({
      type: 'alerts', label: 'Alertas',
      items: alerts.map(a => ({
        id: a.id, title: a.message, subtitle: a.severity,
        icon: ExclamationTriangleIcon, color: '#ef4444',
        to: '/dashboard/alerts',
      }))
    })
    searchResults.value = groups
    searchLoading.value = false
  }, 250)
}

function goToResult(item) {
  router.push(item.to)
  clearSearch()
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  searchOpen.value = false
}
let lastKey = ''
let lastKeyTime = 0

function handleKeydown(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchOpen.value = true
    document.querySelector('.search-area input')?.focus()
    return
  }
  if (e.key === 'Escape') { clearSearch(); userMenuOpen.value = false; bellOpen.value = false; activityOpen.value = false; return }

  // Atajos tipo g+x (sólo si no hay foco en un input)
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
  const now = Date.now()
  if (lastKey === 'g' && now - lastKeyTime < 1000) {
    const map = { d: '/dashboard/devices', a: '/dashboard/alerts', r: '/dashboard/resumen', c: '/dashboard/groups', f: '/dashboard/filters', u: '/dashboard/users', s: '/dashboard/settings' }
    if (map[e.key]) { router.push(map[e.key]); lastKey = ''; return }
  }
  lastKey = e.key; lastKeyTime = now
}
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  document.addEventListener('keydown', handleKeydown)
})
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
  document.removeEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.progress-bar {
  animation: progress 1.2s ease-in-out infinite;
  transform-origin: left;
}
@keyframes progress {
  0%   { transform: scaleX(0.05); opacity: 1; }
  60%  { transform: scaleX(0.8);  opacity: 1; }
  100% { transform: scaleX(1);    opacity: 0; }
}

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
