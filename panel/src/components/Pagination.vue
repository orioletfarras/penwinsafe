<template>
  <div class="flex items-center justify-between px-4 py-2.5" style="border-top:1px solid #f0f2f5">
    <p class="text-[11px]" style="color:#9ca3af">
      {{ from }}–{{ to }} de <span class="font-medium" style="color:#374151">{{ total }}</span>
    </p>
    <div class="flex items-center gap-1">
      <button @click="changePage(modelValue - 1)" :disabled="modelValue === 1"
        class="w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors disabled:opacity-30"
        style="color:#374151"
        onmouseenter="this.style.background='#f3f4f6'"
        onmouseleave="this.style.background='transparent'">
        ‹
      </button>

      <button v-for="p in pages" :key="p"
        @click="p !== '…' && changePage(p)"
        class="w-7 h-7 flex items-center justify-center rounded text-[11px] font-medium transition-colors"
        :style="p === modelValue
          ? 'background:#006fff;color:#fff'
          : p === '…' ? 'color:#9ca3af;cursor:default' : 'color:#374151'"
        :onmouseenter="p !== '…' && p !== modelValue ? e => e.currentTarget.style.background='#f3f4f6' : null"
        :onmouseleave="p !== '…' && p !== modelValue ? e => e.currentTarget.style.background='transparent' : null">
        {{ p }}
      </button>

      <button @click="changePage(modelValue + 1)" :disabled="modelValue === totalPages"
        class="w-7 h-7 flex items-center justify-center rounded text-[12px] transition-colors disabled:opacity-30"
        style="color:#374151"
        onmouseenter="this.style.background='#f3f4f6'"
        onmouseleave="this.style.background='transparent'">
        ›
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue:  { type: Number, default: 1 },
  total:       { type: Number, required: true },
  perPage:     { type: Number, default: 20 },
  scrollTarget: { type: String, default: 'main' },
})

const emit = defineEmits(['change'])

function changePage(page) {
  emit('change', page)
  const el = document.querySelector(props.scrollTarget)
  if (el) el.scrollTo({ top: 0, behavior: 'smooth' })
  else window.scrollTo({ top: 0, behavior: 'smooth' })
}

const totalPages = computed(() => Math.max(1, Math.ceil(props.total / props.perPage)))
const from = computed(() => Math.min((props.modelValue - 1) * props.perPage + 1, props.total))
const to   = computed(() => Math.min(props.modelValue * props.perPage, props.total))

const pages = computed(() => {
  const total = totalPages.value
  const cur   = props.modelValue
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  if (cur <= 4)   return [1, 2, 3, 4, 5, '…', total]
  if (cur >= total - 3) return [1, '…', total-4, total-3, total-2, total-1, total]
  return [1, '…', cur-1, cur, cur+1, '…', total]
})
</script>
