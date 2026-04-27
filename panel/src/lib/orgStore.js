import { ref, computed } from 'vue'
import { supabase } from './supabase'

export const currentUser   = ref(null)   // { id, email }
export const currentRole   = ref(null)   // 'superadmin' | 'admin' | 'viewer'
export const allOrgs       = ref([])     // [{ id, name, slug }] — only for superadmin
export const selectedOrgId = ref(null)   // active org for superadmin
export const myOrgId       = ref(null)   // own org from admin_users

export const isSuperAdmin = computed(() => currentRole.value === 'superadmin')

// Returns the org_id to use for queries
export const activeOrgId = computed(() =>
  isSuperAdmin.value ? selectedOrgId.value : myOrgId.value
)

export async function loadUserContext() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  currentUser.value = { id: user.id, email: user.email }

  const { data: admin } = await supabase
    .from('admin_users')
    .select('role, org_id, organizations(id, name, slug)')
    .eq('id', user.id)
    .single()

  if (!admin) return

  currentRole.value = admin.role
  myOrgId.value = admin.org_id

  if (admin.role === 'superadmin') {
    // Load all organizations
    const { data: orgs } = await supabase
      .from('organizations')
      .select('id, name, slug')
      .order('name')
    allOrgs.value = orgs || []

    // Restore previously selected org from localStorage
    const saved = localStorage.getItem('penwin_selected_org')
    if (saved && orgs?.find(o => o.id === saved)) {
      selectedOrgId.value = saved
    } else if (orgs?.length) {
      // Default to first non-Penwin org, or first org
      const first = orgs.find(o => o.slug !== 'penwin') || orgs[0]
      selectedOrgId.value = first.id
      localStorage.setItem('penwin_selected_org', first.id)
    }
  } else {
    selectedOrgId.value = admin.org_id
  }

  return admin
}

export function switchOrg(orgId) {
  selectedOrgId.value = orgId
  localStorage.setItem('penwin_selected_org', orgId)
}

export function selectedOrgName() {
  return allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || ''
}
