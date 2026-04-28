<template>
  <div class="animate-pulse rounded" :class="className" :style="`height:${height};width:${width};background:#f0f2f5`"></div>
</template>

<script setup>
defineProps({
  height:    { type: String, default: '14px' },
  width:     { type: String, default: '100%' },
  className: { type: String, default: '' },
})
</script>
