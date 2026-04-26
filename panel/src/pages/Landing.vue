<template>
  <div class="min-h-screen bg-dark-900 text-white font-sans">

    <!-- NAV -->
    <nav class="fixed top-0 inset-x-0 z-50 glass border-b border-white/5">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-2xl">🛡️</span>
          <span class="text-xl font-bold gradient-text">PenwinSafe</span>
        </div>
        <div class="hidden md:flex items-center gap-8 text-sm text-gray-400">
          <a href="#features" class="hover:text-white transition-colors">Funcionalidades</a>
          <a href="#how" class="hover:text-white transition-colors">Cómo funciona</a>
          <a href="#pricing" class="hover:text-white transition-colors">Precios</a>
        </div>
        <router-link
          to="/login"
          class="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors"
        >
          Acceder al panel →
        </router-link>
      </div>
    </nav>

    <!-- HERO -->
    <section class="pt-40 pb-24 px-6 text-center relative overflow-hidden">
      <div class="absolute inset-0 pointer-events-none">
        <div class="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-600/10 rounded-full blur-3xl"></div>
        <div class="absolute top-40 left-1/4 w-72 h-72 bg-blue-700/10 rounded-full blur-3xl"></div>
      </div>
      <div class="relative max-w-4xl mx-auto">
        <div class="inline-flex items-center gap-2 glass rounded-full px-4 py-1.5 text-sm text-brand-400 mb-8">
          <span class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
          Navegación segura para centros escolares
        </div>
        <h1 class="text-5xl md:text-7xl font-extrabold leading-tight mb-6">
          Internet seguro<br>
          <span class="gradient-text">sin excepciones</span>
        </h1>
        <p class="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
          Navegador para Windows y Mac con filtrado DNS permanente, monitorización en tiempo real
          y alertas inteligentes por IA. Diseñado para colegios.
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <router-link
            to="/login"
            class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Acceder al panel
          </router-link>
          <a
            href="mailto:hola@penwin.org"
            class="glass hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            Solicitar demo
          </a>
        </div>
        <!-- Stats -->
        <div class="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto">
          <div class="text-center">
            <div class="text-3xl font-bold text-white">100%</div>
            <div class="text-sm text-gray-500 mt-1">DNS filtrado</div>
          </div>
          <div class="text-center border-x border-dark-600">
            <div class="text-3xl font-bold text-white">&lt;1s</div>
            <div class="text-sm text-gray-500 mt-1">Monitorización</div>
          </div>
          <div class="text-center">
            <div class="text-3xl font-bold text-white">IA</div>
            <div class="text-sm text-gray-500 mt-1">Alertas automáticas</div>
          </div>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <section id="features" class="py-24 px-6">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4">Todo lo que necesita tu colegio</h2>
          <p class="text-gray-400 text-lg">Un sistema completo de navegación segura y supervisión educativa</p>
        </div>
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="f in features" :key="f.title" class="glass rounded-2xl p-6 hover:bg-white/8 transition-colors">
            <div class="text-3xl mb-4">{{ f.icon }}</div>
            <h3 class="text-lg font-semibold mb-2">{{ f.title }}</h3>
            <p class="text-gray-400 text-sm leading-relaxed">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- HOW IT WORKS -->
    <section id="how" class="py-24 px-6 border-y border-dark-700">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4">Cómo funciona</h2>
          <p class="text-gray-400 text-lg">Listo en menos de 10 minutos por aula</p>
        </div>
        <div class="space-y-8">
          <div v-for="(step, i) in steps" :key="i" class="flex gap-6 items-start">
            <div class="flex-shrink-0 w-12 h-12 bg-brand-600/20 border border-brand-600/40 rounded-xl flex items-center justify-center text-brand-400 font-bold text-lg">
              {{ i + 1 }}
            </div>
            <div class="pt-2">
              <h3 class="text-lg font-semibold mb-1">{{ step.title }}</h3>
              <p class="text-gray-400">{{ step.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- PRICING -->
    <section id="pricing" class="py-24 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold mb-4">Planes sencillos</h2>
          <p class="text-gray-400 text-lg">Sin sorpresas. Precio por dispositivo/mes.</p>
        </div>
        <div class="grid md:grid-cols-3 gap-6">
          <div v-for="plan in plans" :key="plan.name"
            :class="['glass rounded-2xl p-8 flex flex-col', plan.featured ? 'border-brand-500 ring-1 ring-brand-500' : '']"
          >
            <div v-if="plan.featured" class="text-xs font-semibold text-brand-400 bg-brand-600/20 rounded-full px-3 py-1 self-start mb-4">
              Más popular
            </div>
            <h3 class="text-xl font-bold mb-2">{{ plan.name }}</h3>
            <div class="text-4xl font-extrabold my-4">
              {{ plan.price }}<span class="text-base font-normal text-gray-400">/dispositivo/mes</span>
            </div>
            <ul class="space-y-2 flex-1 mb-8">
              <li v-for="item in plan.features" :key="item" class="flex items-start gap-2 text-sm text-gray-300">
                <span class="text-green-400 mt-0.5">✓</span>{{ item }}
              </li>
            </ul>
            <a
              href="mailto:hola@penwin.org"
              :class="['text-center font-semibold py-3 rounded-xl text-sm transition-colors', plan.featured ? 'bg-brand-600 hover:bg-brand-700 text-white' : 'glass hover:bg-white/10 text-white']"
            >
              Contactar
            </a>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-24 px-6 text-center">
      <div class="max-w-2xl mx-auto glass rounded-3xl p-12">
        <span class="text-5xl">🛡️</span>
        <h2 class="text-3xl font-bold mt-6 mb-4">¿Listo para proteger a tus alumnos?</h2>
        <p class="text-gray-400 mb-8">Solicita una demo gratuita y lo configuramos juntos en tu colegio.</p>
        <a
          href="mailto:hola@penwin.org"
          class="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block"
        >
          Solicitar demo gratuita
        </a>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="border-t border-dark-700 py-8 px-6 text-center text-gray-500 text-sm">
      <div class="flex items-center justify-center gap-2 mb-2">
        <span>🛡️</span>
        <span class="font-semibold text-white">PenwinSafe</span>
        <span class="text-dark-600">by</span>
        <span class="text-white">Penwin</span>
      </div>
      <p>© {{ new Date().getFullYear() }} Penwin · <a href="mailto:hola@penwin.org" class="hover:text-white transition-colors">hola@penwin.org</a></p>
    </footer>
  </div>
</template>

<script setup>
const features = [
  {
    icon: '🌐',
    title: 'Filtrado DNS permanente',
    desc: 'Todo el tráfico DNS pasa por CleanBrowsing Family Filter. El alumno no puede desactivarlo ni cambiarlo.'
  },
  {
    icon: '👁️',
    title: 'Vista en vivo',
    desc: 'Conecta en remoto a cualquier dispositivo y ve en tiempo real lo que está viendo el alumno. Tecnología WebRTC.'
  },
  {
    icon: '🔍',
    title: 'Historial de búsquedas',
    desc: 'Captura automática de lo que buscan en Google, YouTube, Bing y otros motores con categorización por IA.'
  },
  {
    icon: '🤖',
    title: 'Alertas inteligentes por IA',
    desc: 'Claude analiza las búsquedas y genera alertas automáticas cuando detecta contenido preocupante: acoso, autolesión, violencia.'
  },
  {
    icon: '⏱️',
    title: 'Horarios de acceso',
    desc: 'Define franjas horarias por aula. Fuera del horario escolar, el navegador bloquea el acceso automáticamente.'
  },
  {
    icon: '🏫',
    title: 'Gestión multi-centro',
    desc: 'Administra varios colegios desde un solo panel. Grupos, aulas y configuraciones independientes por centro.'
  },
  {
    icon: '🔒',
    title: 'Modo examen',
    desc: 'Con un clic, bloquea todos los dispositivos de un aula excepto las URLs que tú permitas. Ideal para exámenes.'
  },
  {
    icon: '📊',
    title: 'Informes semanales',
    desc: 'Cada semana, la IA genera un informe personalizado por alumno en PDF para que el tutor pueda revisarlo.'
  },
  {
    icon: '⚙️',
    title: 'Configuración remota',
    desc: 'Actualiza filtros, listas blancas/negras y configuraciones sin tocar físicamente ningún ordenador.'
  },
]

const steps = [
  {
    title: 'Instala PenwinSafe en los ordenadores del aula',
    desc: 'Descarga el instalador y ejecútalo en cada PC. En menos de 2 minutos el navegador está activo y el dispositivo registrado en el panel.'
  },
  {
    title: 'Configura grupos y filtros desde el panel',
    desc: 'Crea tus aulas, asigna dispositivos y personaliza el nivel de filtrado, horarios y listas de sitios permitidos o bloqueados.'
  },
  {
    title: 'Monitoriza y recibe alertas automáticamente',
    desc: 'La IA analiza la actividad en tiempo real. Recibirás alertas inmediatas si detecta búsquedas preocupantes y un informe semanal por alumno.'
  },
]

const plans = [
  {
    name: 'Básico',
    price: '2€',
    featured: false,
    features: [
      'Filtrado DNS CleanBrowsing',
      'Historial de URLs',
      'Historial de búsquedas',
      'Bloqueo remoto',
      'Hasta 30 dispositivos',
    ]
  },
  {
    name: 'Escolar',
    price: '3€',
    featured: true,
    features: [
      'Todo lo del plan Básico',
      'Vista en vivo (WebRTC)',
      'Alertas IA en tiempo real',
      'Horarios de acceso',
      'Modo examen',
      'Informes semanales PDF',
      'Dispositivos ilimitados',
    ]
  },
  {
    name: 'Distrito',
    price: 'A medida',
    featured: false,
    features: [
      'Todo lo del plan Escolar',
      'Multi-centro',
      'SSO / integración con GSuite',
      'SLA garantizado',
      'Soporte prioritario',
      'Onboarding presencial',
    ]
  },
]
</script>
