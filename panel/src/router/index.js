import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
  { path: '/',          name: 'home',      component: () => import('../pages/Landing.vue') },
  { path: '/login',     name: 'login',     component: () => import('../pages/Login.vue') },
  { path: '/privacy',   name: 'privacy',   component: () => import('../pages/PrivacyPolicy.vue') },
  { path: '/solicitar', name: 'solicitar', component: () => import('../pages/Solicitar.vue') },
  { path: '/contratar', name: 'contratar', component: () => import('../pages/Contratar.vue') },
  {
    path: '/dashboard',
    component: () => import('../pages/dashboard/Layout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '',         name: 'dashboard', component: () => import('../pages/dashboard/Overview.vue') },
      { path: 'devices',  name: 'devices',   component: () => import('../pages/dashboard/Devices.vue') },
      { path: 'groups',   name: 'groups',    component: () => import('../pages/dashboard/Groups.vue') },
      { path: 'alerts',   name: 'alerts',    component: () => import('../pages/dashboard/Alerts.vue') },
      { path: 'reports',  name: 'reports',   component: () => import('../pages/dashboard/Reports.vue') },
      { path: 'settings', name: 'settings',  component: () => import('../pages/dashboard/Settings.vue') },
      { path: 'filters',        name: 'filters',        component: () => import('../pages/dashboard/Filters.vue') },
      { path: 'users',          name: 'users',          component: () => import('../pages/dashboard/Users.vue') },
      { path: 'audit',          name: 'audit',          component: () => import('../pages/dashboard/AuditLog.vue') },
      { path: 'custom-alerts',  name: 'custom-alerts',  component: () => import('../pages/dashboard/CustomAlerts.vue') },
      { path: 'kiosk',          name: 'kiosk',          component: () => import('../pages/dashboard/KioskSchedule.vue') },
      { path: 'superconfig',    name: 'superconfig',    component: () => import('../pages/dashboard/SuperConfig.vue'), meta: { requiresSuperAdmin: true } },
      { path: 'dnsescolar',     name: 'dnsescolar',     component: () => import('../pages/dashboard/CloudflareConfig.vue') },
      { path: 'devices/:id',   name: 'device-detail',  component: () => import('../pages/dashboard/DeviceDetail.vue') },
    ]
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return { name: 'login', query: { redirect: to.fullPath } }
  if (to.meta.requiresSuperAdmin) {
    const { data: admin } = await supabase.from('admin_users').select('role').eq('id', session.user.id).single()
    if (admin?.role !== 'superadmin') return { name: 'dashboard' }
  }
  return true
})

export default router
