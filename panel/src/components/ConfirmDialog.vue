<template>
  <Teleport to="body">
    <div v-if="modelValue" class="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style="background:rgba(0,0,0,0.35)" @click.self="$emit('cancel')">
      <div class="w-full max-w-sm rounded-xl overflow-hidden"
        style="background:#ffffff;box-shadow:0 20px 40px rgba(0,0,0,0.14)">

        <div class="p-5">
          <div class="flex items-start gap-3 mb-4">
            <div class="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              :style="`background:${iconBg}`">
              <component :is="icon" class="w-4.5 h-4.5" :style="`color:${iconColor};width:18px;height:18px`" />
            </div>
            <div>
              <p class="text-[13px] font-semibold" style="color:#111827">{{ title }}</p>
              <p class="text-[12px] mt-1 leading-relaxed" style="color:#6b7280">{{ message }}</p>
            </div>
          </div>

          <div class="flex items-center justify-end gap-2 pt-1">
            <button @click="$emit('cancel')"
              class="btn btn-secondary">
              Cancelar
            </button>
            <button @click="$emit('confirm')" :class="`btn ${confirmClass}`">
              {{ confirmLabel }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'
import { TrashIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'

const props = defineProps({
  modelValue:   { type: Boolean, default: false },
  title:        { type: String,  default: '¿Estás seguro?' },
  message:      { type: String,  default: 'Esta acción no se puede deshacer.' },
  confirmLabel: { type: String,  default: 'Confirmar' },
  variant:      { type: String,  default: 'danger' }, // danger | warning
})
defineEmits(['confirm', 'cancel'])

const iconBg    = computed(() => props.variant === 'danger' ? '#fef2f2' : '#fffbeb')
const iconColor = computed(() => props.variant === 'danger' ? '#dc2626' : '#d97706')
const icon      = computed(() => props.variant === 'danger' ? TrashIcon : ExclamationTriangleIcon)
const confirmClass = computed(() => props.variant === 'danger' ? 'btn-danger' : 'btn-secondary')
</script>
