import { reactive } from 'vue'

const TTL = 60_000 // 1 minuto

const store = reactive({})

export function cached(key, fetcher) {
  const entry = store[key]
  const now   = Date.now()

  // Refresca en background si han pasado más de TTL ms
  const shouldRefresh = !entry || (now - entry.fetchedAt > TTL)

  if (shouldRefresh) {
    fetcher().then(data => {
      store[key] = { data, fetchedAt: Date.now() }
    })
  }

  return entry?.data ?? null
}

export function invalidate(key) {
  delete store[key]
}

export function getStore() {
  return store
}
