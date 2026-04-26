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
            <div class="flex flex-col sm:flex-row gap-3">
              <router-link to="/login"
                class="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-6 py-3.5 rounded-xl transition-all hover:shadow-lg hover:shadow-brand-600/25 text-sm">
                Acceder al panel
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </router-link>
              <a href="mailto:hola@penwin.org"
                class="flex items-center justify-center gap-2 border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium px-6 py-3.5 rounded-xl transition-all text-sm">
                Contactar
              </a>
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
              Claude analiza cada búsqueda en tiempo real. Si detecta patrones preocupantes — acoso, autolesión, violencia —
              genera una alerta inmediata para el tutor con contexto y recomendaciones.
            </p>
          </div>
        </div>

        <!-- Feature grid -->
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="f in features" :key="f.title"
            class="rounded-xl border border-white/8 hover:border-white/15 bg-white/3 hover:bg-white/5 p-5 transition-all">
            <div class="text-2xl mb-3">{{ f.icon }}</div>
            <h3 class="text-sm font-semibold text-white mb-2">{{ f.title }}</h3>
            <p class="text-xs text-gray-500 leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
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
          <p class="text-gray-400 text-lg">Precio por dispositivo al mes. Sin permanencia.</p>
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
              <span v-if="plan.price !== 'Custom'" class="text-gray-500 text-sm">/dispositivo/mes</span>
            </div>
            <p class="text-xs text-gray-600 mb-6">{{ plan.sub }}</p>
            <ul class="space-y-2.5 flex-1 mb-8">
              <li v-for="item in plan.features" :key="item" class="flex items-start gap-2.5 text-sm text-gray-300">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" class="text-brand-400 mt-0.5 flex-shrink-0"><path d="M20 6L9 17l-5-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                {{ item }}
              </li>
            </ul>
            <a href="mailto:hola@penwin.org"
              :class="['text-center text-sm font-semibold py-3 rounded-xl transition-all',
                plan.featured
                  ? 'bg-brand-600 hover:bg-brand-500 text-white hover:shadow-lg hover:shadow-brand-600/25'
                  : 'border border-white/10 hover:border-white/20 hover:bg-white/5 text-white']"
            >
              Contactar
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
          <a href="mailto:hola@penwin.org"
            class="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:shadow-xl hover:shadow-brand-600/30 text-sm">
            Contactar con Penwin
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
import Logo from '../components/Logo.vue'
import BrowserMockup from '../components/BrowserMockup.vue'

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const stats = [
  { value: '100%', label: 'Tráfico DNS filtrado' },
  { value: '<1s',  label: 'Latencia monitorización' },
  { value: '3',    label: 'Niveles de filtrado' },
  { value: '24/7', label: 'Protección activa' },
]

const features = [
  { icon: '👁️', title: 'Vista en vivo',       desc: 'Conecta en remoto con WebRTC y ve en tiempo real lo que hace cada alumno.' },
  { icon: '⏱️', title: 'Horarios de acceso',  desc: 'Define cuándo pueden navegar. Fuera del horario, el navegador bloquea.' },
  { icon: '🔒', title: 'Modo examen',         desc: 'Bloquea todas las pestañas excepto las URLs que tú autorices.' },
  { icon: '📊', title: 'Informes semanales',  desc: 'La IA genera un PDF por alumno cada semana para el tutor.' },
  { icon: '🏫', title: 'Multi-centro',        desc: 'Gestiona varios colegios desde un único panel.' },
  { icon: '⚙️', title: 'Config remota',       desc: 'Actualiza filtros y listas sin tocar físicamente ningún PC.' },
  { icon: '🔍', title: 'Historial búsquedas', desc: 'Captura lo que buscan en Google, YouTube y Bing con categorización IA.' },
  { icon: '🚨', title: 'Alertas inmediatas',  desc: 'Notificación en segundos cuando se detecta contenido preocupante.' },
]

const steps = [
  {
    title: 'Instala PenwinSafe',
    desc: 'Descarga el instalador y ejecútalo. En 2 minutos el PC está registrado y protegido.'
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
    name: 'Básico', price: '2€', sub: 'Para centros pequeños',
    featured: false,
    features: ['Filtrado DNS PenwinSafe', 'Historial de URLs y búsquedas', 'Bloqueo remoto instantáneo', 'Hasta 30 dispositivos']
  },
  {
    name: 'Escolar', price: '3€', sub: 'El más completo para colegios',
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
