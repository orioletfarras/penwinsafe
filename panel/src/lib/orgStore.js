import { ref, computed } from 'vue'
import { supabase } from './supabase'

export const currentUser   = ref(null)   // { id, email }
export const currentRole   = ref(null)   // 'superadmin' | 'admin' | 'viewer'
export const allOrgs       = ref([])     // [{ id, name, slug }] — only for superadmin
export const selectedOrgId = ref(null)   // active org for superadmin
export const myOrgId       = ref(null)   // own org from admin_users
export const orgSwitchKey  = ref(0)      // increment to force page remount on org switch

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

    // Priority: DB session (persists across browsers) > localStorage > first org
    const { data: dbSession } = await supabase
      .from('superadmin_session')
      .select('selected_org_id')
      .eq('user_id', user.id)
      .single()

    let initialOrgId = null
    const dbOrg = dbSession?.selected_org_id
    const saved  = localStorage.getItem('penwin_selected_org')

    if (dbOrg && orgs?.find(o => o.id === dbOrg)) {
      initialOrgId = dbOrg
    } else if (saved && orgs?.find(o => o.id === saved)) {
      initialOrgId = saved
    } else if (orgs?.length) {
      const first = orgs.find(o => o.slug !== 'penwin') || orgs[0]
      initialOrgId = first.id
    }

    if (initialOrgId) {
      selectedOrgId.value = initialOrgId
      localStorage.setItem('penwin_selected_org', initialOrgId)
      await supabase.rpc('set_superadmin_org', { org_id: initialOrgId })
    }
  } else {
    selectedOrgId.value = admin.org_id
  }

  return admin
}

export async function switchOrg(orgId) {
  selectedOrgId.value = orgId
  localStorage.setItem('penwin_selected_org', orgId)
  await supabase.rpc('set_superadmin_org', { org_id: orgId })
  orgSwitchKey.value++
}

export function selectedOrgName() {
  return allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || ''
}
