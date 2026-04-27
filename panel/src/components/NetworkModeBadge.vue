<template>
  <span v-if="label" class="inline-flex items-center gap-1 font-medium rounded"
    :class="size === 'xs' ? 'text-[9px] px-1 py-0.5' : 'text-[10px] px-1.5 py-0.5'"
    :style="style">
    <span class="rounded-full flex-shrink-0"
      :class="size === 'xs' ? 'w-1 h-1' : 'w-1.5 h-1.5'"
      :style="`background:${dotColor}`" />
    {{ label }}
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  mode:   { type: String, default: null },
  status: { type: String, default: 'offline' },
  size:   { type: String, default: 'sm' },
})

const config = computed(() => {
  if (props.status === 'offline') return null
  switch (props.mode) {
    case 'direct':
      return { label: 'Directo',      bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0', dot: '#16a34a' }
    case 'tunnel':
      return { label: 'Túnel WG',     bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe', dot: '#006fff' }
    case 'supabase_only':
      return { label: 'Solo Supabase', bg: '#fffbeb', color: '#b45309', border: '#fde68a', dot: '#f59e0b' }
    case 'no_internet':
      return { label: 'Sin internet',  bg: '#fef2f2', color: '#b91c1c', border: '#fecaca', dot: '#dc2626' }
    default:
      return null
  }
})

const label    = computed(() => config.value?.label || null)
const dotColor = computed(() => config.value?.dot || '#9ca3af')
const style    = computed(() => config.value
  ? `background:${config.value.bg};color:${config.value.color};border:1px solid ${config.value.border}`
  : ''
)
</script>
