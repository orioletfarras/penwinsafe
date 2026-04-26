import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../lib/supabase'

const routes = [
  { path: '/',        name: 'home',     component: () => import('../pages/Landing.vue') },
  { path: '/login',   name: 'login',    component: () => import('../pages/Login.vue') },
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
      { path: 'filters',  name: 'filters',   component: () => import('../pages/dashboard/Filters.vue') },
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
  return true
})

export default router
