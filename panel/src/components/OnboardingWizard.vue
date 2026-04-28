<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style="background:rgba(15,23,42,0.7);backdrop-filter:blur(4px)">
      <div class="w-full max-w-lg rounded-2xl overflow-hidden"
        style="background:#fff;box-shadow:0 32px 80px rgba(0,0,0,0.25)">

        <!-- Progress -->
        <div class="h-1" style="background:#f3f4f6">
          <div class="h-1 transition-all" style="background:linear-gradient(90deg,#006fff,#7c3aed)"
            :style="`width:${(step / 3) * 100}%`"></div>
        </div>

        <!-- Step 1: Bienvenida / nombre del centro -->
        <div v-if="step === 1" class="p-8">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style="background:#eff6ff">
            <BuildingOfficeIcon class="w-6 h-6" style="color:#006fff" />
          </div>
          <p class="text-[20px] font-bold mb-1" style="color:#111827">Bienvenido a PenwinSafe</p>
          <p class="text-[13px] mb-6" style="color:#6b7280">Configuremos tu centro en 3 pasos rápidos.</p>
          <div class="mb-6">
            <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre del centro educativo</label>
            <input v-model="orgName" placeholder="IES Ejemplo, CEIP San José..." class="input w-full text-[13px]" @keyup.enter="step1Next" />
          </div>
          <button @click="step1Next" :disabled="!orgName.trim() || saving"
            class="btn btn-primary w-full justify-center text-[13px]" style="height:40px">
            {{ saving ? 'Guardando...' : 'Continuar' }}
            <ArrowRightIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Step 2: Crear primera clase -->
        <div v-if="step === 2" class="p-8">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style="background:#f5f3ff">
            <UserGroupIcon class="w-6 h-6" style="color:#7c3aed" />
          </div>
          <p class="text-[20px] font-bold mb-1" style="color:#111827">Crea tu primera clase</p>
          <p class="text-[13px] mb-6" style="color:#6b7280">Las clases agrupan dispositivos y aplican filtros comunes.</p>
          <div class="mb-4">
            <label class="block text-[11px] font-medium mb-1.5" style="color:#6b7280">Nombre de la clase</label>
            <input v-model="groupName" placeholder="Ej: 1º ESO A, Sala de informática..." class="input w-full text-[13px]" @keyup.enter="step2Next" />
          </div>
          <p class="text-[11px] mb-6" style="color:#9ca3af">Puedes crear más clases después desde Gestión → Clases.</p>
          <div class="flex gap-2">
            <button @click="step = 1" class="btn btn-secondary flex-1 justify-center">Atrás</button>
            <button @click="step2Next" :disabled="saving"
              class="btn btn-primary flex-1 justify-center text-[13px]">
              {{ groupName.trim() ? (saving ? 'Guardando...' : 'Continuar') : 'Omitir' }}
              <ArrowRightIcon class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Step 3: Código de instalación -->
        <div v-if="step === 3" class="p-8">
          <div class="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style="background:#f0fdf4">
            <ComputerDesktopIcon class="w-6 h-6" style="color:#16a34a" />
          </div>
          <p class="text-[20px] font-bold mb-1" style="color:#111827">Instala el agente</p>
          <p class="text-[13px] mb-5" style="color:#6b7280">Usa este código al instalar PenwinSafe en los equipos del centro.</p>

          <div class="rounded-xl px-6 py-4 text-center mb-5" style="background:#f9fafb;border:2px dashed #e5e7eb">
            <p class="text-[11px] font-medium mb-2" style="color:#9ca3af">Código de centro</p>
            <p class="text-[32px] font-bold font-mono tracking-[0.3em]" style="color:#111827">{{ centerCode }}</p>
            <button @click="copyCode" class="mt-2 text-[11px] font-medium px-3 py-1 rounded transition-colors"
              style="color:#006fff" onmouseenter="this.style.background='#eff6ff'" onmouseleave="this.style.background='transparent'">
              {{ copied ? '✓ Copiado' : 'Copiar código' }}
            </button>
          </div>

          <div class="rounded-lg px-4 py-3 mb-6 text-[11px] leading-relaxed" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1d4ed8">
            Descarga el instalador desde <span class="font-semibold">safe.penwin.cloud/install</span> e introduce este código durante la instalación.
          </div>

          <button @click="finish" class="btn btn-primary w-full justify-center text-[13px]" style="height:40px">
            Ir al panel
            <CheckIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Skip -->
        <div v-if="step < 3" class="px-8 pb-4 text-center">
          <button @click="finish" class="text-[11px]" style="color:#9ca3af">Configurar más tarde</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { activeOrgId } from '../lib/orgStore'
import {
  BuildingOfficeIcon, UserGroupIcon, ComputerDesktopIcon,
  ArrowRightIcon, CheckIcon,
} from '@heroicons/vue/24/outline'

const props = defineProps({ modelValue: Boolean, initialOrgName: String, initialCenterCode: String })
const emit  = defineEmits(['update:modelValue', 'done'])

const visible   = ref(props.modelValue)
const step      = ref(1)
const saving    = ref(false)
const orgName   = ref(props.initialOrgName || '')
const groupName = ref('')
const centerCode = ref(props.initialCenterCode || '—')
const copied    = ref(false)

async function step1Next() {
  if (!orgName.value.trim()) return
  saving.value = true
  await supabase.from('organizations').update({ name: orgName.value.trim() }).eq('id', activeOrgId.value)
  saving.value = false
  step.value = 2
}

async function step2Next() {
  if (groupName.value.trim()) {
    saving.value = true
    await supabase.from('groups').insert({ name: groupName.value.trim(), org_id: activeOrgId.value })
    saving.value = false
  }
  step.value = 3
}

async function copyCode() {
  await navigator.clipboard.writeText(centerCode.value)
  copied.value = true
  setTimeout(() => copied.value = false, 2000)
}

function finish() {
  emit('update:modelValue', false)
  emit('done')
  localStorage.setItem('pws_onboarding_done', '1')
}
</script>
