<template>
  <div class="relative inline-flex group" style="min-width:0">
    <slot />
    <div
      class="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50"
      style="background:#1f2937;color:#f9fafb;box-shadow:0 4px 12px rgba(0,0,0,0.15)">
      {{ text }}
      <div class="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0"
        style="border-left:4px solid transparent;border-right:4px solid transparent;border-top:4px solid #1f2937"></div>
    </div>
  </div>
</template>

<script setup>
defineProps({ text: { type: String, required: true } })
</script>
