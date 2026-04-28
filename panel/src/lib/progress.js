import { ref } from 'vue'

const active = ref(0)

export const isLoading = { value: false }

export function startProgress() { active.value++ }
export function stopProgress()  { active.value = Math.max(0, active.value - 1) }
export function useProgress()   { return active }
