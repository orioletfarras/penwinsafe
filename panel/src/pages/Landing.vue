<template>
  <div class="min-h-screen bg-[#080c14] text-white" style="font-family: 'Inter', system-ui, sans-serif;">

    <!-- NAV -->
    <nav class="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Logo />
        <div class="hidden md:flex items-center gap-8 text-sm text-gray-500">
          <a @click.prevent="scrollTo('features')" href="#features" class="hover:text-white transition-colors cursor-pointer">Funcionalidades</a>
          <a @click.prevent="scrollTo('how')"      href="#how"      class="hover:text-white transition-colors cursor-pointer">Cómo funciona</a>
          <a @click.prevent="scrollTo('pricing')"  href="#pricing"  class="hover:text-white transition-colors cursor-pointer">Precios</a>
        </div>
        <div class="flex items-center gap-3">
          <router-link to="/login"
            class="text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors">
            Acceder al panel
          </router-link>
        </div>
      </div>
    </nav>

    <!-- HERO -->
    <section class="pt-36 pb-20 px-6 relative overflow-hidden">
      <!-- Grid background -->
      <div class="absolute inset-0 pointer-events-none"
        style="background-image: linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px); background-size: 64px 64px;">
      </div>
      <!-- Radial glow -->
      <div class="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] pointer-events-none"
        style="background: radial-gradient(ellipse at center top, rgba(37,99,235,0.15) 0%, transparent 70%);">
      </div>

      <div class="relative max-w-6xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-16 items-center">
          <!-- Left: text -->
          <div>
            <div class="inline-flex items-center gap-2 border border-brand-600/30 bg-brand-600/10 rounded-full px-3.5 py-1.5 text-xs text-brand-400 font-medium mb-8">
              <span class="w-1.5 h-1.5 bg-brand-400 rounded-full animate-pulse"></span>
              Navegación segura para colegios
            </div>
            <h1 class="text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6">
              Protege a tus<br>
              <span style="background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
                alumnos online
              </span>
            </h1>
            <p class="text-lg text-gray-400 leading-relaxed mb-10 max-w-md">
              Navegador con filtrado DNS permanente, monitorización en tiempo real y alertas por IA.
              El alumno no puede saltárselo.
            </p>
            <!-- Download buttons -->
            <div class="flex flex-col gap-3">
              <div class="flex flex-col sm:flex-row gap-3">
                <!-- Primary: detected OS -->
                <a :href="primaryDownload.url" :download="primaryDownload.filename"
                  class="flex items-center justify-center gap-3 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/25 text-sm">
                  <component :is="primaryDownload.icon" class="w-5 h-5 flex-shrink-0" />
                  <span>Descargar para {{ primaryDownload.label }}</span>
                </a>
                <router-link to="/login"
                  class="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium px-6 py-3.5 rounded-xl transition-all text-sm">
                  Acceder al panel
                </router-link>
              </div>
              <!-- Secondary: other OS -->
              <p class="text-xs text-gray-600">
                ¿Tienes {{ secondaryDownload.label }}?
                <a :href="secondaryDownload.url" class="text-gray-400 hover:text-white underline underline-offset-2 transition-colors">
                  Descargar para {{ secondaryDownload.label }}
                </a>
              </p>
            </div>
            <!-- Logos/trust -->
            <div class="mt-10 pt-10 border-t border-white/5">
              <p class="text-xs text-gray-600 mb-4 uppercase tracking-widest">Tecnología de confianza</p>
              <div class="flex items-center gap-6 flex-wrap">
                <span class="text-xs text-gray-500 font-medium">PenwinSafe DNS Filter</span>
                <span class="text-gray-700">·</span>
                <span class="text-xs text-gray-500 font-medium">Cloudflare TURN</span>
                <span class="text-gray-700">·</span>
                <span class="text-xs text-gray-500 font-medium">Claude AI</span>
                <span class="text-gray-700">·</span>
                <span class="text-xs text-gray-500 font-medium">WebRTC</span>
              </div>
            </div>
          </div>

          <!-- Right: mockup -->
          <div class="hidden lg:block">
            <BrowserMockup />
          </div>
        </div>
      </div>
    </section>

    <!-- DOWNLOAD BAR -->
    <section class="py-5 px-6 border-y border-white/5" style="background:rgba(255,255,255,0.02)">
      <div class="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-brand-600/20 border border-brand-600/30 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-brand-400"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
          <div>
            <p class="text-sm font-semibold text-white">PenwinSafe {{ appVersion }}</p>
            <p class="text-xs text-gray-500">Windows &amp; macOS · Actualización automática incluida</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <a :href="downloads.win.url"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="detectedOS === 'win'
              ? 'bg-brand-600 hover:bg-brand-500 text-white'
              : 'border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300'">
            <WindowsIcon class="w-4 h-4" />
            Windows
            <span v-if="detectedOS === 'win'" class="text-xs bg-white/20 px-1.5 py-0.5 rounded font-medium">Tu sistema</span>
          </a>
          <a :href="downloads.mac.url"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            :class="detectedOS === 'mac'
              ? 'bg-brand-600 hover:bg-brand-500 text-white'
              : 'border border-white/10 hover:border-white/20 hover:bg-white/5 text-gray-300'">
            <AppleIcon class="w-4 h-4" />
            macOS
            <span v-if="detectedOS === 'mac'" class="text-xs bg-white/20 px-1.5 py-0.5 rounded font-medium">Tu sistema</span>
          </a>
        </div>
      </div>
    </section>

    <!-- STATS -->
    <section class="py-12 px-6 border-y border-white/5">
      <div class="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        <div v-for="s in stats" :key="s.label">
          <div class="text-3xl font-black text-white mb-1">{{ s.value }}</div>
          <div class="text-sm text-gray-500">{{ s.label }}</div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-28 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Funcionalidades</p>
          <h2 class="text-4xl font-black tracking-tight mb-4">Todo en un solo sistema</h2>
          <p class="text-gray-400 text-lg max-w-xl mx-auto">
            Desde la instalación hasta los informes semanales, sin necesidad de infraestructura propia.
          </p>
        </div>

        <!-- Feature highlight -->
        <div class="grid lg:grid-cols-2 gap-6 mb-6">
          <div class="rounded-2xl border border-white/8 bg-gradient-to-br from-brand-900/40 to-transparent p-8 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-brand-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="w-10 h-10 bg-brand-600/20 border border-brand-600/30 rounded-xl flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-brand-400"><path d="M12 2L4 7v10c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V7L12 2z" fill="currentColor"/></svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Filtrado DNS permanente</h3>
            <p class="text-gray-400 leading-relaxed">
              Todo el tráfico DNS se resuelve a través del filtro PenwinSafe mediante un proxy local seguro.
              El alumno no puede desactivarlo, cambiarlo ni saltárselo. Funciona incluso en redes WiFi externas.
            </p>
          </div>
          <div class="rounded-2xl border border-white/8 bg-gradient-to-br from-purple-900/30 to-transparent p-8 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
            <div class="w-10 h-10 bg-purple-600/20 border border-purple-600/30 rounded-xl flex items-center justify-center mb-5">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" class="text-purple-400"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3M6.343 6.343l-.707-.707M12 21v-1m-6.364-1.636l.707-.707M15.536 15.536l.707.707M3.636 17.636l.707-.707" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/></svg>
            </div>
            <h3 class="text-xl font-bold mb-3">Alertas inteligentes con IA</h3>
            <p class="text-gray-400 leading-relaxed">
              La IA analiza cada búsqueda en tiempo real. Si detecta patrones preocupantes — acoso, autolesión, violencia —
              genera una alerta inmediata para el tutor con contexto y recomendaciones.
            </p>
          </div>
        </div>

        <!-- Feature grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4" style="gap:3px;">
          <div v-for="f in features" :key="f.title"
            :class="['rounded-none border-0 p-5 cursor-pointer transition-all relative',
              selectedFeature?.title === f.title
                ? 'bg-brand-900/30 outline outline-1 outline-brand-500/60 z-10'
                : 'bg-white/3 hover:bg-white/6']"
            @click="toggleFeature(f)">
            <div class="text-brand-400 mb-3" v-html="f.icon"></div>
            <h3 class="text-sm font-semibold text-white mb-2">{{ f.title }}</h3>
            <p class="text-xs text-gray-500 leading-relaxed">{{ f.desc }}</p>
            <div :class="['absolute bottom-3 right-3 transition-transform duration-300',
              selectedFeature?.title === f.title ? 'rotate-180' : '']">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                :stroke="selectedFeature?.title === f.title ? 'rgba(96,165,250,0.7)' : 'rgba(255,255,255,0.2)'"
                stroke-width="2" stroke-linecap="round"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
        </div>

        <!-- Panel de expansión -->
        <Transition name="expand">
          <div v-if="selectedFeature" :key="selectedFeature.title" id="feature-panel"
            style="border-top:2px solid rgba(59,130,246,0.45);overflow:hidden;">
            <div class="feat-panel-inner">
              <!-- Izquierda -->
              <div class="feat-col-left">
                <div class="text-brand-400 mb-5" v-html="selectedFeature.iconLg"></div>
                <h3 style="font-size:clamp(1.4rem,2.5vw,1.9rem);font-weight:800;letter-spacing:-.02em;color:#fff;margin-bottom:14px;">
                  {{ selectedFeature.title }}
                </h3>
                <p style="font-size:14px;color:rgba(255,255,255,0.5);line-height:1.75;margin-bottom:32px;max-width:340px;">
                  {{ selectedFeature.detail }}
                </p>
                <router-link to="/solicitar"
                  class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
                  Solicitar demo →
                </router-link>
              </div>
              <!-- Derecha -->
              <div class="feat-col-right">
                <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);margin-bottom:28px;">
                  Qué incluye
                </p>
                <ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:0;">
                  <li v-for="(item, i) in selectedFeature.features" :key="item"
                    class="feat-item"
                    :style="`animation-delay:${0.08 + i * 0.07}s`">
                    <span class="feat-check">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" class="text-brand-400"><path d="M20 6L9 17l-5-5"/></svg>
                    </span>
                    <span style="font-size:13px;color:rgba(255,255,255,0.7);line-height:1.5;">{{ item }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="py-28 px-6 border-y border-white/5 relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none"
        style="background: radial-gradient(ellipse at 20% 50%, rgba(37,99,235,0.07) 0%, transparent 60%);">
      </div>
      <div class="relative max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Implementación</p>
          <h2 class="text-4xl font-black tracking-tight mb-4">Listo en 10 minutos</h2>
          <p class="text-gray-400 text-lg">Sin servidores propios, sin configuración compleja.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-8">
          <div v-for="(step, i) in steps" :key="i" class="relative">
            <div v-if="i < steps.length - 1" class="hidden md:block absolute top-6 left-full w-full h-px border-t border-dashed border-white/10 z-0" style="width: calc(100% - 3rem); left: calc(100% - 1rem);"></div>
            <div class="relative z-10">
              <div class="w-12 h-12 rounded-xl bg-brand-600/15 border border-brand-600/25 flex items-center justify-center text-brand-400 font-black text-lg mb-5">
                {{ i + 1 }}
              </div>
              <h3 class="text-base font-bold mb-2">{{ step.title }}</h3>
              <p class="text-sm text-gray-500 leading-relaxed">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-28 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <p class="text-brand-400 text-sm font-semibold uppercase tracking-widest mb-3">Precios</p>
          <h2 class="text-4xl font-black tracking-tight mb-4">Transparente y escalable</h2>
          <p class="text-gray-400 text-lg">Precio por dispositivo al año. Sin permanencia.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6 items-start">
          <div v-for="plan in plans" :key="plan.name"
            :class="['rounded-2xl border p-8 flex flex-col relative overflow-hidden transition-all',
              plan.featured
                ? 'border-brand-500 bg-gradient-to-b from-brand-900/40 to-dark-800'
                : 'border-white/8 bg-white/3 hover:bg-white/5']"
          >
            <div v-if="plan.featured"
              class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400 to-transparent">
            </div>
            <div v-if="plan.featured"
              class="absolute top-3 right-4 text-xs bg-brand-600 text-white font-semibold px-2.5 py-0.5 rounded-full">
              Popular
            </div>
            <p class="text-sm text-gray-400 mb-2">{{ plan.name }}</p>
            <div class="flex items-baseline gap-1 mb-1">
              <span class="text-4xl font-black text-white">{{ plan.price }}</span>
              <span v-if="plan.price !== 'Custom'" class="text-gray-500 text-sm">/dispositivo/año</span>
            </div>
            <p class="text-xs text-gray-600 mb-6">{{ plan.sub }}</p>
            <ul class="space-y-2.5 flex-1 mb-8">
              <li v-for="item in plan.features" :key="item" class="flex items-start gap-2.5 text-sm text-gray-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="text-brand-400 mt-0.5 flex-shrink-0"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </li>
            </ul>
            <a href="/solicitar"
              :class="['text-center text-sm font-semibold py-3 rounded-xl transition-all',
                plan.featured
                  ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-lg hover:shadow-brand-600/25'
                  : 'border border-white/10 hover:border-white/20 hover:bg-white/5 text-white']"
            >
              Solicitar
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA -->
    <section class="py-28 px-6">
      <div class="max-w-3xl mx-auto text-center">
        <div class="rounded-3xl border border-white/8 p-12 relative overflow-hidden"
          style="background: radial-gradient(ellipse at 50% 0%, rgba(37,99,235,0.15) 0%, transparent 70%)">
          <div class="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-brand-400/50 to-transparent"></div>
          <div class="w-14 h-14 mx-auto bg-brand-600/20 border border-brand-600/30 rounded-2xl flex items-center justify-center mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" class="text-brand-400">
              <path d="M12 2L4 7v10c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V7L12 2z" fill="currentColor"/>
            </svg>
          </div>
          <h2 class="text-3xl md:text-4xl font-black tracking-tight mb-4">
            ¿Listo para proteger<br>a tus alumnos?
          </h2>
          <p class="text-gray-400 mb-8 text-lg">
            Demo gratuita. Lo configuramos juntos en tu colegio en menos de una hora.
          </p>
          <a href="/solicitar"
            class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-brand-600/30 text-sm">
            Solicitar demo o trial gratuito
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </a>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="border-t border-white/5 py-10 px-6">
      <div class="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <Logo :size="28" text-class="text-base text-white" />
        <p class="text-sm text-gray-600">© {{ new Date().getFullYear() }} Penwin · Todos los derechos reservados</p>
        <a href="mailto:hola@penwin.org" class="text-sm text-gray-600 hover:text-white transition-colors">hola@penwin.org</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, defineComponent, h } from 'vue'
import Logo from '../components/Logo.vue'
import BrowserMockup from '../components/BrowserMockup.vue'

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// ── Feature expansion ──────────────────────────────────────────────────────
const selectedFeature = ref(null)
function toggleFeature(f) {
  const isClosing = selectedFeature.value?.title === f.title
  selectedFeature.value = isClosing ? null : f
  if (!isClosing) {
    nextTick(() => {
      document.getElementById('feature-panel')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }
}

// ── OS detection ──────────────────────────────────────────────────────────
const ua = navigator.userAgent.toLowerCase()
const detectedOS = ua.includes('win') ? 'win' : ua.includes('mac') ? 'mac' : 'win'

const appVersion = 'v1.0.4'
const RELEASES_BASE = 'https://github.com/orioletfarras/penwinsafe/releases/latest/download'

const downloads = {
  win: {
    url:      `${RELEASES_BASE}/PenwinSafe-Setup.exe`,
    filename: 'PenwinSafe-Setup.exe',
    label:    'Windows',
  },
  mac: {
    url:      `${RELEASES_BASE}/PenwinSafe-arm64.dmg`,
    filename: 'PenwinSafe-arm64.dmg',
    label:    'macOS',
  },
}

// ── OS icon components ────────────────────────────────────────────────────
const WindowsIcon = defineComponent({
  setup: () => () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801' })
  ])
})

const AppleIcon = defineComponent({
  setup: () => () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'currentColor' }, [
    h('path', { d: 'M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z' })
  ])
})

const primaryDownload   = computed(() => ({ ...downloads[detectedOS],   icon: detectedOS === 'win' ? WindowsIcon : AppleIcon }))
const secondaryDownload = computed(() => ({ ...downloads[detectedOS === 'win' ? 'mac' : 'win'], icon: detectedOS === 'win' ? AppleIcon : WindowsIcon }))

const stats = [
  { value: '100%', label: 'Tráfico DNS filtrado' },
  { value: '<1s',  label: 'Latencia monitorización' },
  { value: '3',    label: 'Niveles de filtrado' },
  { value: '24/7', label: 'Protección activa' },
]

const svgOpen = (w) => '<svg width="' + w + '" height="' + w + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="' + (w <= 22 ? 1.8 : 1.5) + '" stroke-linecap="round" stroke-linejoin="round">'
const svgClose = '<' + '/svg>'
const I = (w, paths) => svgOpen(w) + paths + svgClose

const features = [
  {
    icon:   I(22, '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    iconLg: I(40, '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'),
    title: 'Vista en vivo',
    desc:   'Conecta en remoto con WebRTC y ve en tiempo real lo que hace cada alumno.',
    detail: 'Conecta con cualquier dispositivo en tiempo real usando WebRTC, directamente desde el panel. Sin instalar nada extra en el ordenador del tutor.',
    features: ['Conexión WebRTC peer-to-peer sin servidor intermediario', 'Vista del escritorio completo en tiempo real', 'Sin latencia apreciable en red local', 'Cierre de sesión del alumno con un clic', 'Compatible con Windows y macOS'],
  },
  {
    icon:   I(22, '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    iconLg: I(40, '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>'),
    title: 'Horarios de acceso',
    desc:   'Define cuándo pueden navegar. Fuera del horario, el navegador bloquea.',
    detail: 'Define ventanas de tiempo en las que los alumnos pueden navegar. Fuera de ese horario, el agente activa el bloqueo automáticamente.',
    features: ['Configuración por aula o grupo de dispositivos', 'Horarios diferenciados por día de la semana', 'Bloqueo inmediato al salir de la ventana horaria', 'Excepciones puntuales por dispositivo', 'Activación y desactivación remotas al instante'],
  },
  {
    icon:   I(22, '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'),
    iconLg: I(40, '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>'),
    title: 'Modo examen',
    desc:   'Bloquea todas las pestañas excepto las URLs que tú autorices.',
    detail: 'Durante un examen, el navegador solo puede acceder a las URLs autorizadas por el tutor. El alumno no puede abrir nuevas pestañas ni sitios no permitidos.',
    features: ['Allowlist de URLs configurable por sesión', 'Activación instantánea desde el panel', 'Bloqueo de apertura de nuevas pestañas', 'Registro de intentos de acceso no autorizado', 'Desactivación remota al finalizar el examen'],
  },
  {
    icon:   I(22, '<path d="M18 20V10M12 20V4M6 20v-6"/>'),
    iconLg: I(40, '<path d="M18 20V10M12 20V4M6 20v-6"/>'),
    title: 'Informes semanales',
    desc:   'La IA genera un PDF por alumno cada semana para el tutor.',
    detail: 'Cada semana se genera automáticamente un informe en PDF con el resumen de actividad de cada alumno: sitios, búsquedas, tiempo en pantalla y alertas.',
    features: ['PDF automático por alumno cada lunes', 'Resumen de categorías de contenido visitado', 'Gráficas de tiempo de uso semanal', 'Alertas de la semana incluidas con contexto', 'Envío automático al tutor por email'],
  },
  {
    icon:   I(22, '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>'),
    iconLg: I(40, '<path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><path d="M9 22V12h6v10"/>'),
    title: 'Multi-centro',
    desc:   'Gestiona varios colegios desde un único panel.',
    detail: 'Administra múltiples centros o campus desde un único panel con jerarquía de permisos por nivel y facturación unificada.',
    features: ['Estructura organización → centro → aula', 'Administradores independientes por centro', 'Dashboard global con vista de todos los centros', 'Informes agrupados por centro o red', 'Facturación unificada o separada por centro'],
  },
  {
    icon:   I(22, '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'),
    iconLg: I(40, '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>'),
    title: 'Config remota',
    desc:   'Actualiza filtros y listas sin tocar físicamente ningún PC.',
    detail: 'Actualiza las listas de filtrado, los horarios y las políticas de todos los dispositivos al instante desde el panel, sin desplazamientos al centro.',
    features: ['Cambios aplicados en <5 segundos en todos los dispositivos', 'Listas de bloqueo y de acceso sincronizadas', 'Actualización del agente en silencio', 'Rollback de configuración con un clic', 'Historial de cambios con fecha y usuario'],
  },
  {
    icon:   I(22, '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
    iconLg: I(40, '<circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>'),
    title: 'Historial búsquedas',
    desc:   'Captura lo que buscan en Google, YouTube y Bing con categorización IA.',
    detail: 'PenwinSafe intercepta las consultas en los principales buscadores y las almacena categorizadas para revisión posterior por el tutor.',
    features: ['Captura en Google, YouTube, Bing y más buscadores', 'Categorización automática con IA', 'Búsqueda y filtrado por alumno, fecha y categoría', 'Alertas automáticas por palabras clave configurables', 'Exportación del historial en CSV'],
  },
  {
    icon:   I(22, '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>'),
    iconLg: I(40, '<path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>'),
    title: 'Alertas inmediatas',
    desc:   'Notificación en segundos cuando se detecta contenido preocupante.',
    detail: 'Cuando la IA detecta una búsqueda o visita preocupante, el tutor recibe una notificación en segundos con el contexto completo del incidente.',
    features: ['Notificación push al tutor en menos de 10 segundos', 'Contexto: URL, búsqueda y categoría detectada', 'Niveles de severidad: aviso, alerta y urgente', 'Historial de alertas por alumno y período', 'Configuración de sensibilidad por categoría'],
  },
]

const steps = [
  {
    title: 'Instala PenwinSafe',
    desc: 'Descarga el instalador para Windows o macOS y ejecútalo. En 2 minutos el ordenador está registrado y protegido.'
  },
  {
    title: 'Configura desde el panel',
    desc: 'Crea aulas, asigna dispositivos, define horarios y listas de sitios permitidos.'
  },
  {
    title: 'Monitoriza y actúa',
    desc: 'Recibe alertas automáticas de la IA y conecta en vivo cuando lo necesites.'
  },
]

const plans = [
  {
    name: 'Básico', price: '2,5€', sub: 'Para centros pequeños',
    featured: false,
    features: ['Filtrado DNS PenwinSafe', 'Historial de URLs y búsquedas', 'Bloqueo remoto instantáneo', 'Hasta 30 dispositivos']
  },
  {
    name: 'Escolar', price: '3,5€', sub: 'El más completo para colegios',
    featured: true,
    features: ['Todo el plan Básico', 'Vista en vivo WebRTC', 'Alertas IA en tiempo real', 'Horarios de acceso por aula', 'Modo examen', 'Informes semanales PDF', 'Dispositivos ilimitados']
  },
  {
    name: 'Distrito', price: 'Custom', sub: 'Para redes de centros',
    featured: false,
    features: ['Todo el plan Escolar', 'Multi-centro unificado', 'SSO / Google Workspace', 'SLA garantizado', 'Soporte prioritario', 'Onboarding presencial']
  },
]
</script>

<style scoped>
/* ── Expand transition ───────────────────────────────── */
.expand-enter-active { overflow:hidden; transition:max-height .7s cubic-bezier(.22,1,.36,1), opacity .5s .05s cubic-bezier(.22,1,.36,1); }
.expand-leave-active { overflow:hidden; transition:max-height .45s cubic-bezier(.4,0,1,1), opacity .25s; }
.expand-enter-from, .expand-leave-to { max-height:0; opacity:0; }
.expand-enter-to, .expand-leave-from { max-height:800px; opacity:1; }

/* ── Panel layout ─────────────────────────────────────── */
.feat-panel-inner { display:grid; grid-template-columns:1fr 1fr; align-items:stretch; }
.feat-col-left  { background:rgba(255,255,255,0.03); padding:56px 48px; border-right:1px solid rgba(255,255,255,0.06); }
.feat-col-right { padding:56px 48px; }

/* ── Feature stagger ─────────────────────────────────── */
.feat-item {
  display:flex; align-items:flex-start; gap:14px;
  padding:13px 0; border-bottom:1px solid rgba(255,255,255,0.05);
  opacity:0; transform:translateX(12px);
  animation:featIn .5s cubic-bezier(.22,1,.36,1) forwards;
}
.feat-item:last-child { border-bottom:none; }
@keyframes featIn { to { opacity:1; transform:none; } }
.feat-check { width:18px; height:18px; border-radius:50%; border:1.5px solid rgba(59,130,246,0.5); display:flex; align-items:center; justify-content:center; flex-shrink:0; margin-top:1px; }

/* ── Responsive ──────────────────────────────────────── */
@media(max-width:768px) {
  .feat-panel-inner { grid-template-columns:1fr; }
  .feat-col-left  { padding:40px 20px; border-right:none; border-bottom:1px solid rgba(255,255,255,0.06); }
  .feat-col-right { padding:36px 20px; }
}
</style>
