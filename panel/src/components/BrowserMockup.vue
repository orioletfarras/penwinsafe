<template>
  <div class="relative w-full max-w-2xl mx-auto">
    <!-- Glow -->
    <div class="absolute inset-0 bg-brand-500/20 blur-3xl rounded-3xl scale-95"></div>

    <!-- Browser frame -->
    <div class="relative bg-dark-800 rounded-2xl border border-dark-600 shadow-2xl overflow-hidden">
      <!-- Titlebar -->
      <div class="bg-dark-700 px-4 py-3 flex items-center gap-3 border-b border-dark-600">
        <!-- Traffic lights -->
        <div class="flex gap-1.5">
          <div class="w-3 h-3 rounded-full bg-red-500/60"></div>
          <div class="w-3 h-3 rounded-full bg-yellow-500/60"></div>
          <div class="w-3 h-3 rounded-full bg-green-500/60"></div>
        </div>
        <!-- Nav buttons -->
        <div class="flex gap-1">
          <div class="w-6 h-6 rounded bg-dark-600 flex items-center justify-center text-dark-400 text-xs">‹</div>
          <div class="w-6 h-6 rounded bg-dark-600 flex items-center justify-center text-dark-400 text-xs">›</div>
        </div>
        <!-- Address bar -->
        <div class="flex-1 bg-dark-900 rounded-lg px-3 py-1.5 flex items-center gap-2">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" class="text-green-400 flex-shrink-0">
            <path d="M12 2L4 7v10c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V7L12 2z" fill="currentColor" opacity="0.8"/>
          </svg>
          <span class="text-xs text-dark-400 truncate">https://www.google.com</span>
        </div>
      </div>

      <!-- Content area: simulated Google -->
      <div class="bg-white p-6">
        <!-- Google logo -->
        <div class="flex justify-center mb-6 mt-2">
          <div class="flex items-center gap-0.5 text-3xl font-bold" style="font-family: 'Product Sans', Arial, sans-serif;">
            <span style="color:#4285F4">G</span>
            <span style="color:#EA4335">o</span>
            <span style="color:#FBBC05">o</span>
            <span style="color:#4285F4">g</span>
            <span style="color:#34A853">l</span>
            <span style="color:#EA4335">e</span>
          </div>
        </div>
        <!-- Search bar -->
        <div class="max-w-md mx-auto border border-gray-300 rounded-full px-4 py-2.5 flex items-center gap-3 shadow-sm mb-4">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="text-gray-400">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span class="text-sm text-gray-500 flex-1">Buscar...</span>
          <div class="w-px h-5 bg-gray-300"></div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" class="text-blue-500">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="flex justify-center gap-3">
          <div class="text-xs bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-gray-600 cursor-pointer">Buscar con Google</div>
          <div class="text-xs bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-gray-600 cursor-pointer">Voy a tener suerte</div>
        </div>
      </div>

      <!-- Shield badge overlay -->
      <div class="absolute top-14 right-4 flex items-center gap-1.5 bg-green-500/90 backdrop-blur text-white text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-lg">
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
          <path d="M12 2L4 7v10c0 5 3.6 9.7 8 11 4.4-1.3 8-6 8-11V7L12 2z" fill="white"/>
        </svg>
        DNS protegido
      </div>
    </div>

    <!-- Floating panel card -->
    <div class="absolute -bottom-4 -right-4 glass rounded-xl p-3 shadow-xl w-44">
      <div class="flex items-center gap-2 mb-2">
        <div class="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
        <span class="text-xs text-white font-medium">Panel activo</span>
      </div>
      <div class="space-y-1.5">
        <div class="flex justify-between text-xs">
          <span class="text-dark-500">Dispositivos</span>
          <span class="text-white font-semibold">24 online</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-dark-500">Búsquedas hoy</span>
          <span class="text-white font-semibold">1,247</span>
        </div>
        <div class="flex justify-between text-xs">
          <span class="text-dark-500">Bloqueados</span>
          <span class="text-red-400 font-semibold">38</span>
        </div>
      </div>
    </div>

    <!-- Floating alert card -->
    <div class="absolute -top-4 -left-4 glass rounded-xl p-3 shadow-xl w-52">
      <div class="flex items-start gap-2">
        <div class="w-6 h-6 bg-yellow-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
          <span class="text-xs">🤖</span>
        </div>
        <div>
          <p class="text-xs font-semibold text-white">IA detectó algo</p>
          <p class="text-xs text-dark-400 mt-0.5">Búsqueda revisada en Aula 3</p>
        </div>
      </div>
    </div>
  </div>
</template>
