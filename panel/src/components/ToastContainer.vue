<template>
  <Teleport to="body">
    <div class="fixed bottom-5 right-5 z-[100] flex flex-col gap-2" style="max-width:360px">
      <TransitionGroup name="toast">
        <div v-for="t in toasts" :key="t.id"
          class="flex items-start gap-3 px-4 py-3 rounded-xl shadow-lg"
          :style="styles[t.type]">
          <component :is="icons[t.type]" style="width:16px;height:16px;flex-shrink:0;margin-top:1px" />
          <p class="flex-1 text-[12px] font-medium leading-snug">{{ t.message }}</p>
          <button @click="dismiss(t.id)" style="opacity:0.6;flex-shrink:0" class="transition-opacity hover:opacity-100">
            <XMarkIcon style="width:14px;height:14px" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon, ExclamationCircleIcon } from '@heroicons/vue/24/outline'
import { useToast } from '../lib/toast'

const { toasts, dismiss } = useToast()

const styles = {
  error:   'background:#1f1f1f;color:#fff;border:1px solid #374151',
  success: 'background:#052e16;color:#86efac;border:1px solid #166534',
  warning: 'background:#1c1917;color:#fde68a;border:1px solid #78350f',
}
const icons = {
  error:   ExclamationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
}
</script>

<style scoped>
.toast-enter-active { transition: all 0.2s ease; }
.toast-leave-active { transition: all 0.15s ease; }
.toast-enter-from   { opacity: 0; transform: translateY(8px); }
.toast-leave-to     { opacity: 0; transform: translateX(16px); }
</style>
