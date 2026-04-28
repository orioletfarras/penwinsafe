<template>
  <div class="space-y-6">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-[18px] font-semibold" style="color:#111827">Usuarios</h1>
        <p class="text-[13px] mt-0.5" style="color:#6b7280">Administradores con acceso al panel</p>
      </div>
      <button @click="showInvite = true"
        class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white"
        style="background:#006fff">
        <PlusIcon class="w-3.5 h-3.5" />
        Añadir usuario
      </button>
    </div>

    <!-- Invite form -->
    <div v-if="showInvite" class="card p-5">
      <h2 class="text-[13px] font-semibold mb-4" style="color:#111827">Nuevo usuario</h2>
      <div class="flex gap-3">
        <input v-model="inviteEmail" type="email" placeholder="email@colegio.com"
          class="flex-1 px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
          style="border:1px solid #d1d5db;color:#111827"
          @focus="e => e.target.style.borderColor='#006fff'"
          @blur="e => e.target.style.borderColor='#d1d5db'"
          @keydown.enter="doInvite" />
        <select v-model="inviteRole"
          class="px-3 py-2 rounded-lg text-[13px] outline-none"
          style="border:1px solid #d1d5db;color:#111827;background:#fff">
          <option value="admin">Administrador</option>
          <option value="viewer">Solo lectura</option>
        </select>
        <button @click="doInvite" :disabled="inviting"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity"
          style="background:#006fff"
          :style="inviting ? 'opacity:0.6' : ''">
          <ArrowPathIcon v-if="inviting" class="w-3.5 h-3.5 animate-spin" />
          <span>{{ inviting ? 'Enviando...' : 'Enviar invitación' }}</span>
        </button>
        <button @click="showInvite = false; inviteMsg = ''"
          class="px-3 py-2 rounded-lg text-[13px] transition-colors"
          style="color:#6b7280;border:1px solid #e5e7eb"
          @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
          @mouseleave="e => e.currentTarget.style.background='transparent'">
          Cancelar
        </button>
      </div>
      <p v-if="inviteMsg" class="text-[12px] mt-2.5"
        :style="inviteOk ? 'color:#16a34a' : 'color:#dc2626'">{{ inviteMsg }}</p>
    </div>

    <!-- Users list -->
    <div class="card overflow-hidden">
      <!-- Skeleton -->
      <div v-if="loading">
        <div v-for="i in 4" :key="i" class="px-5 py-3.5 flex items-center gap-4" style="border-bottom:1px solid #f3f4f6">
          <Skeleton height="28px" width="28px" class-name="rounded-full flex-shrink-0" />
          <div class="flex-1 space-y-1.5"><Skeleton height="13px" width="200px" /><Skeleton height="10px" width="80px" /></div>
          <Skeleton height="22px" width="60px" class-name="rounded" />
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="!users.length" class="flex flex-col items-center justify-center py-12 gap-2">
        <UsersIcon class="w-8 h-8" style="color:#e5e7eb" />
        <p class="text-[13px]" style="color:#9ca3af">No hay usuarios todavía</p>
      </div>

      <!-- Table -->
      <table v-else class="w-full">
        <thead>
          <tr style="border-bottom:1px solid #f3f4f6">
            <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style="color:#9ca3af">Email</th>
            <th class="px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wide" style="color:#9ca3af">Rol</th>
            <th class="px-5 py-3"></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in users" :key="u.id"
            class="transition-colors"
            style="border-bottom:1px solid #f9fafb"
            @mouseenter="e => e.currentTarget.style.background='#fafafa'"
            @mouseleave="e => e.currentTarget.style.background='transparent'">
            <td class="px-5 py-3">
              <div class="flex items-center gap-2.5">
                <div class="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
                  style="background:#006fff">
                  {{ u.email[0]?.toUpperCase() }}
                </div>
                <span class="text-[13px]" style="color:#111827">{{ u.email }}</span>
              </div>
            </td>
            <td class="px-5 py-3">
              <select v-if="editingRole === u.id"
                v-model="editRoleValue"
                @change="saveRole(u)"
                @blur="editingRole = null"
                class="px-2 py-1 rounded text-[12px] outline-none"
                style="border:1px solid #d1d5db;color:#111827;background:#fff">
                <option value="admin">Administrador</option>
                <option value="viewer">Solo lectura</option>
              </select>
              <button v-else @click="startEditRole(u)"
                class="flex items-center gap-1.5 text-[12px] px-2 py-1 rounded transition-colors"
                :style="u.role === 'superadmin'
                  ? 'background:#faf5ff;color:#7c3aed;border:1px solid #e9d5ff'
                  : u.role === 'admin'
                    ? 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe'
                    : 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb'">
                {{ roleLabel(u.role) }}
                <PencilIcon v-if="u.role !== 'superadmin'" class="w-2.5 h-2.5 opacity-50" />
              </button>
            </td>
            <td class="px-5 py-3 text-right">
              <button v-if="u.id !== currentUserId && u.role !== 'superadmin'"
                @click="removeUser(u)"
                class="text-[12px] px-2.5 py-1 rounded transition-colors"
                style="color:#dc2626"
                @mouseenter="e => e.currentTarget.style.background='#fef2f2'"
                @mouseleave="e => e.currentTarget.style.background='transparent'">
                Eliminar
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, currentUser, isSuperAdmin } from '../../lib/orgStore'
import { PlusIcon, ArrowPathIcon, PencilIcon, UsersIcon } from '@heroicons/vue/24/outline'
import Skeleton from '../../components/Skeleton.vue'

const loading     = ref(true)
const users       = ref([])
const showInvite  = ref(false)
const inviteEmail = ref('')
const inviteRole  = ref('admin')
const inviting    = ref(false)
const inviteMsg   = ref('')
const inviteOk    = ref(false)
const editingRole = ref(null)
const editRoleValue = ref('')

const currentUserId = computed(() => currentUser.value?.id)

function roleLabel(role) {
  return role === 'superadmin' ? 'Superadmin' : role === 'admin' ? 'Administrador' : 'Solo lectura'
}

async function call(action, params = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token}`,
      },
      body: JSON.stringify({ action, org_id: selectedOrgId.value, ...params }),
    }
  )
  return res.json()
}

async function loadUsers() {
  loading.value = true
  const result = await call('list')
  users.value = result.users ?? []
  loading.value = false
}

async function doInvite() {
  if (!inviteEmail.value.trim()) return
  inviting.value = true
  inviteMsg.value = ''
  const result = await call('invite', { email: inviteEmail.value.trim(), role: inviteRole.value })
  if (result.ok) {
    inviteMsg.value = `Invitación enviada a ${result.email}. Recibirá un email para establecer su contraseña.`
    inviteOk.value = true
    inviteEmail.value = ''
    await loadUsers()
  } else {
    inviteMsg.value = result.error || 'Error desconocido'
    inviteOk.value = false
  }
  inviting.value = false
}

function startEditRole(u) {
  if (u.role === 'superadmin') return
  editingRole.value = u.id
  editRoleValue.value = u.role
}

async function saveRole(u) {
  if (editRoleValue.value === u.role) { editingRole.value = null; return }
  await call('update_role', { user_id: u.id, role: editRoleValue.value })
  u.role = editRoleValue.value
  editingRole.value = null
}

async function removeUser(u) {
  if (!confirm(`¿Eliminar a ${u.email} del panel?`)) return
  const result = await call('remove', { user_id: u.id })
  if (result.ok) users.value = users.value.filter(x => x.id !== u.id)
}

onMounted(loadUsers)
</script>
