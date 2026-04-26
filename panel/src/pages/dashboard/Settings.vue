<template>
  <div>
    <h1 class="text-2xl font-bold text-white mb-8">Configuración</h1>
    <div class="max-w-2xl space-y-6">
      <div class="glass rounded-2xl p-6">
        <h2 class="font-semibold text-white mb-4">Organización</h2>
        <div class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-1.5">Nombre del centro</label>
            <input v-model="orgName" type="text" class="w-full bg-dark-800 border border-dark-600 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-500 transition-colors" />
          </div>
        </div>
        <button class="mt-4 bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
          Guardar
        </button>
      </div>

      <div class="glass rounded-2xl p-6">
        <h2 class="font-semibold text-white mb-4">Filtro DNS global</h2>
        <div class="space-y-2">
          <label v-for="level in filterLevels" :key="level.value" class="flex items-start gap-3 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors">
            <input type="radio" v-model="filterLevel" :value="level.value" class="mt-0.5" />
            <div>
              <p class="text-sm font-medium text-white">{{ level.label }}</p>
              <p class="text-xs text-gray-500">{{ level.desc }}</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const orgName = ref('')
const filterLevel = ref('family')

const filterLevels = [
  { value: 'family',   label: 'Family Filter',   desc: 'Bloquea adultos, proxies, anuncios y contenido mixto. Recomendado para primaria.' },
  { value: 'adult',    label: 'Adult Filter',    desc: 'Bloquea solo contenido adulto. Para secundaria.' },
  { value: 'security', label: 'Security Filter', desc: 'Solo bloquea malware y phishing. Mínimo filtrado.' },
]
</script>
