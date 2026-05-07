<template>
  <div class="min-h-screen bg-[#080c14] text-white" style="font-family: 'Inter', system-ui, sans-serif;">

    <!-- NAV -->
    <nav class="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#080c14]/80 backdrop-blur-xl">
      <div class="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <router-link to="/">
          <Logo />
        </router-link>
        <router-link to="/login"
          class="text-sm font-semibold bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-lg transition-colors">
          Acceder al panel
        </router-link>
      </div>
    </nav>

    <!-- CONTENT -->
    <div class="pt-32 pb-24 px-6">
      <div class="max-w-3xl mx-auto">

        <p class="text-xs text-brand-400 font-semibold uppercase tracking-widest mb-4">Legal</p>
        <h1 class="text-4xl font-black tracking-tight mb-3">Política de Privacidad</h1>
        <p class="text-gray-500 text-sm mb-12">Última actualización: 4 de mayo de 2025 · Extensión de Chrome PenwinSafe v1.0</p>

        <div class="space-y-10 text-gray-300 text-sm leading-relaxed">

          <!-- 1 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">1. Responsable del tratamiento</h2>
            <p>El responsable del tratamiento de los datos recogidos mediante la extensión de Chrome <strong class="text-white">PenwinSafe</strong> es:</p>
            <div class="mt-4 border border-white/8 rounded-xl p-4 bg-white/3 text-gray-400 space-y-1">
              <p><span class="text-white font-medium">Penwin</span></p>
              <p>Correo de contacto: <a href="mailto:privacidad@penwin.org" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">privacidad@penwin.org</a></p>
            </div>
          </section>

          <!-- 2 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">2. Finalidad única de la extensión</h2>
            <p>PenwinSafe es una extensión de filtrado de contenido web diseñada exclusivamente para centros educativos. Su única finalidad es <strong class="text-white">bloquear el acceso a contenido inapropiado</strong> (pornografía, violencia, drogas, apuestas y odio) en dispositivos escolares, e informar al centro de la actividad de navegación de sus dispositivos.</p>
          </section>

          <!-- 3 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">3. Datos que se recogen</h2>
            <div class="space-y-4">

              <div class="border border-white/8 rounded-xl p-4 bg-white/3">
                <p class="text-white font-semibold mb-1">Historial de navegación</p>
                <p>Se registra la URL visitada, el dominio y el título de la página junto con la marca de tiempo de la visita. Estos datos se envían al panel del centro escolar para su registro de actividad.</p>
              </div>

              <div class="border border-white/8 rounded-xl p-4 bg-white/3">
                <p class="text-white font-semibold mb-1">Consultas de búsqueda</p>
                <p>Las búsquedas realizadas en motores como Google, Bing o DuckDuckGo se analizan para detectar palabras clave bloqueadas. El término buscado, el motor utilizado y la marca de tiempo se registran cuando se produce un bloqueo o como actividad general.</p>
              </div>

              <div class="border border-white/8 rounded-xl p-4 bg-white/3">
                <p class="text-white font-semibold mb-1">Identificadores del dispositivo y del centro</p>
                <p>Durante la activación se asigna un identificador interno al dispositivo y se asocia al centro escolar mediante su código de centro. El nombre del dispositivo (p. ej. «Aula 3 PC 1») también se almacena. No se recoge ningún dato personal de alumnos o docentes.</p>
              </div>

              <div class="border border-white/8 rounded-xl p-4 bg-white/3">
                <p class="text-white font-semibold mb-1">Tiempo de pantalla</p>
                <p>Se contabiliza el tiempo acumulado de uso del navegador en el dispositivo (en segundos por día) para el informe de actividad del panel del centro.</p>
              </div>

            </div>
          </section>

          <!-- 4 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">4. Base jurídica del tratamiento</h2>
            <p>El tratamiento se realiza en base al <strong class="text-white">interés legítimo del centro educativo</strong> en velar por la seguridad y el uso apropiado de sus dispositivos y redes, y en cumplimiento de los acuerdos de servicio suscritos con Penwin. Los centros son responsables de comunicar a su comunidad educativa el uso de este sistema de filtrado.</p>
          </section>

          <!-- 5 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">5. Quién tiene acceso a los datos</h2>
            <p>Los datos de navegación solo son accesibles por los <strong class="text-white">administradores del centro escolar</strong> a través del panel de PenwinSafe. Penwin accede a los datos únicamente para la prestación y el mantenimiento del servicio. No se venden ni ceden datos a terceros.</p>
          </section>

          <!-- 6 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">6. Conservación de los datos</h2>
            <p>Los registros de navegación, búsqueda y bloqueos se conservan durante <strong class="text-white">90 días</strong> desde su generación, tras los cuales se eliminan automáticamente. Los datos de activación del dispositivo se conservan mientras el dispositivo esté registrado en el panel del centro.</p>
          </section>

          <!-- 7 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">7. Transferencias internacionales</h2>
            <p>Los datos se almacenan en la infraestructura de <strong class="text-white">Supabase</strong> (servidores en la Unión Europea). No se realizan transferencias a países fuera del Espacio Económico Europeo.</p>
          </section>

          <!-- 8 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">8. Derechos</h2>
            <p>El centro escolar, como responsable ante sus usuarios, puede solicitar el acceso, rectificación, supresión o portabilidad de los datos de sus dispositivos contactando con <a href="mailto:privacidad@penwin.org" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">privacidad@penwin.org</a>. También tiene derecho a presentar una reclamación ante la <strong class="text-white">Agencia Española de Protección de Datos</strong> (aepd.es).</p>
          </section>

          <!-- 9 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">9. Cambios en esta política</h2>
            <p>Cualquier cambio material en esta política se comunicará a los centros con al menos 15 días de antelación a su entrada en vigor.</p>
          </section>

          <!-- 10 -->
          <section>
            <h2 class="text-white font-bold text-base mb-3">10. Contacto</h2>
            <p>Para cualquier consulta sobre privacidad: <a href="mailto:privacidad@penwin.org" class="text-brand-400 hover:text-brand-300 underline underline-offset-2">privacidad@penwin.org</a></p>
          </section>

        </div>
      </div>
    </div>

    <!-- FOOTER -->
    <footer class="border-t border-white/5 py-8 px-6">
      <div class="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo :show-text="true" :size="24" text-class="text-sm text-white" />
        <p class="text-xs text-gray-600">© {{ new Date().getFullYear() }} Penwin. Todos los derechos reservados.</p>
      </div>
    </footer>

  </div>
</template>

<script setup>
import Logo from '../components/Logo.vue'
</script>
