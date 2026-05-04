'use strict'

// Watch for search form submissions to catch queries before navigation
document.addEventListener('submit', async (e) => {
  const form = e.target
  const input = form.querySelector('input[name="q"], input[name="query"], input[name="search_query"]')
  if (!input || !input.value.trim()) return

  const result = await chrome.runtime.sendMessage({ type: 'check_keyword', text: input.value.trim() })
  if (result?.blocked) {
    e.preventDefault()
    chrome.runtime.sendMessage({ type: 'log_blocked', url: location.href, reason: 'keyword_filter', query: input.value.trim() })
    showBlockedOverlay(input.value.trim(), result.category)
  }
}, true)

function showBlockedOverlay(query, category) {
  const existing = document.getElementById('penwinsafe-block')
  if (existing) existing.remove()

  const overlay = document.createElement('div')
  overlay.id = 'penwinsafe-block'
  overlay.style.cssText = `
    position:fixed;top:0;left:0;right:0;bottom:0;z-index:2147483647;
    background:#fff;display:flex;align-items:center;justify-content:center;
    font-family:-apple-system,BlinkMacSystemFont,'Inter',sans-serif;
  `
  overlay.innerHTML = `
    <div style="text-align:center;max-width:380px;padding:32px">
      <div style="width:56px;height:56px;background:#fef2f2;border-radius:16px;display:flex;align-items:center;justify-content:center;margin:0 auto 16px">
        <svg width="24" height="24" fill="none" stroke="#dc2626" stroke-width="2" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </div>
      <p style="font-size:17px;font-weight:700;color:#111827;margin:0 0 8px">Búsqueda bloqueada</p>
      <p style="font-size:13px;color:#6b7280;margin:0 0 4px">La búsqueda <strong style="color:#374151">"${escapeHtml(query)}"</strong> contiene contenido no permitido.</p>
      <p style="font-size:11px;color:#9ca3af;margin:0">PenwinSafe · Protección activa</p>
    </div>
  `
  document.body.appendChild(overlay)
  setTimeout(() => overlay.remove(), 4000)
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
}
