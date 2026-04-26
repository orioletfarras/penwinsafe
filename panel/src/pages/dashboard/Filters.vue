<template>
  <div class="max-w-2xl space-y-4">

    <div>
      <p class="text-[13px] font-semibold" style="color:#111827">Filtros de palabras clave</p>
      <p class="text-[11px] mt-0.5" style="color:#6b7280">
        El navegador PenwinSafe bloquea búsquedas que contengan estas palabras. Puedes activar/desactivar categorías y añadir términos personalizados.
      </p>
    </div>

    <!-- Categories -->
    <div v-for="cat in categories" :key="cat.id"
      class="rounded overflow-hidden" style="background:#ffffff;border:1px solid #e5e7eb">

      <!-- Cat header -->
      <div class="px-4 py-3 flex items-center justify-between" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-3">
          <span class="w-2.5 h-2.5 rounded-full flex-shrink-0" :style="`background:${cat.color}`"></span>
          <div>
            <p class="text-[12px] font-semibold" style="color:#111827">{{ cat.label }}</p>
            <p class="text-[11px]" style="color:#6b7280">{{ cat.desc }}</p>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-[10px]" style="color:#9ca3af">
            {{ cat.keywords.length + (customWords[cat.id] || []).length }} palabras
          </span>
          <!-- Toggle switch -->
          <button @click="toggleCat(cat.id)"
            class="relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors"
            :style="enabledCats[cat.id] !== false ? 'background:#006fff' : 'background:#d1d5db'">
            <span class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :style="enabledCats[cat.id] !== false ? 'transform:translateX(16px)' : 'transform:translateX(0)'">
            </span>
          </button>
        </div>
      </div>

      <!-- Keywords -->
      <div class="px-4 py-3 space-y-3" :style="enabledCats[cat.id] === false ? 'opacity:0.4;pointer-events:none' : ''">

        <!-- Built-in chips -->
        <div class="flex flex-wrap gap-1.5">
          <span v-for="kw in cat.keywords" :key="kw"
            class="text-[10px] px-2 py-0.5 rounded font-medium"
            style="background:#f9fafb;color:#374151;border:1px solid #e5e7eb">
            {{ kw }}
          </span>
        </div>

        <!-- Custom words -->
        <div v-if="(customWords[cat.id] || []).length" class="flex flex-wrap gap-1.5">
          <span v-for="(kw, i) in customWords[cat.id]" :key="kw"
            class="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-medium"
            style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
            {{ kw }}
            <button @click="removeCustom(cat.id, i)" class="ml-0.5 hover:text-red-500 transition-colors">×</button>
          </span>
        </div>

        <!-- Add custom word -->
        <div class="flex items-center gap-2">
          <input
            v-model="newWord[cat.id]"
            type="text"
            :placeholder="`Añadir palabra a ${cat.label}...`"
            class="flex-1 px-2.5 py-1.5 rounded text-[11px] focus:outline-none transition-colors"
            style="background:#f9fafb;border:1px solid #e5e7eb;color:#111827"
            @keydown.enter="addCustom(cat.id)" />
          <button @click="addCustom(cat.id)"
            class="text-[11px] font-medium px-2.5 py-1.5 rounded transition-colors flex-shrink-0"
            style="background:#006fff;color:#ffffff">
            Añadir
          </button>
        </div>
      </div>
    </div>

    <!-- Save -->
    <div class="flex items-center justify-between">
      <p v-if="savedMsg" class="text-[11px]" :class="savedMsg.includes('Error') ? 'text-red-600' : 'text-green-700'">{{ savedMsg }}</p>
      <span v-else></span>
      <button @click="saveFilters" :disabled="saving"
        class="text-[12px] font-semibold px-4 py-2 rounded transition-colors disabled:opacity-50"
        style="background:#006fff;color:#ffffff">
        {{ saving ? 'Guardando...' : 'Guardar configuración' }}
      </button>
    </div>

  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { supabase } from '../../lib/supabase'

const saving   = ref(false)
const savedMsg = ref('')

const BUILT_IN = {
  pornografia: [
    'porn','porno','pornografia','pornography','xxx','hentai',
    'xvideos','pornhub','redtube','xnxx','xhamster','youporn','brazzers',
    'fakings','bangbros','mia khalifa','lana rhoades','riley reid',
    'johnny sins','lisa ann','sunny leone','alexis texas','sasha grey',
  ],
  contenido_adulto: [
    'sexo','nude','desnudo','desnuda','erotic','erotico','onlyfans',
    'stripper','escort','prostitutas','camgirl','webcam sex','nudes',
    'orgasmo','masturbacion','milf','threesome','fetish','bdsm',
  ],
  violencia: [
    'snuff','gore','liveleak murder','beheading video','torture video',
    'kill video','murder video','execution video','decapitation',
  ],
  drogas: [
    'como comprar droga','comprar cocaina','comprar heroina','dealer droga',
    'buy weed online','buy cocaine','buy heroin','darknet drugs',
  ],
  apuestas: [
    'casino online','apuestas deportivas','bet365','pokerstars',
    'ruleta online','poker real money','tragaperras',
  ],
  odio: [
    'nazismo','neo nazi','white supremacy','kkk','ku klux klan',
    'racism propaganda','odio racial',
  ],
}

const categories = [
  { id: 'pornografia',      label: 'Pornografía',       color: '#dc2626', desc: 'Sitios y búsquedas de contenido sexual explícito',   keywords: BUILT_IN.pornografia },
  { id: 'contenido_adulto', label: 'Contenido adulto',  color: '#ea580c', desc: 'Desnudos, erótico, plataformas adultas',             keywords: BUILT_IN.contenido_adulto },
  { id: 'violencia',        label: 'Violencia',         color: '#b91c1c', desc: 'Vídeos gore, ejecuciones, torturas',                 keywords: BUILT_IN.violencia },
  { id: 'drogas',           label: 'Drogas',            color: '#7c3aed', desc: 'Compra y venta de sustancias ilegales',              keywords: BUILT_IN.drogas },
  { id: 'apuestas',         label: 'Apuestas',          color: '#d97706', desc: 'Casinos online, apuestas deportivas',                keywords: BUILT_IN.apuestas },
  { id: 'odio',             label: 'Discurso de odio',  color: '#475569', desc: 'Racismo, nazismo, incitación al odio',              keywords: BUILT_IN.odio },
]

const customWords  = reactive({})  // { catId: ['word1', 'word2'] }
const enabledCats  = reactive({})  // { catId: true/false }
const newWord      = reactive({})
const orgId        = ref('')

onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { data: admin } = await supabase.from('admin_users').select('org_id').eq('id', user.id).single()
  if (!admin) return
  orgId.value = admin.org_id

  // Load saved filter config from org settings (stored in organizations.filter_config jsonb)
  const { data: org } = await supabase.from('organizations').select('filter_config').eq('id', admin.org_id).single()
  const config = org?.filter_config || {}

  categories.forEach(cat => {
    customWords[cat.id]  = config[cat.id]?.custom || []
    enabledCats[cat.id]  = config[cat.id]?.enabled !== false
    newWord[cat.id]      = ''
  })
})

function toggleCat(id) {
  enabledCats[id] = enabledCats[id] === false ? true : false
}

function addCustom(catId) {
  const w = (newWord[catId] || '').trim().toLowerCase()
  if (!w) return
  if (!customWords[catId]) customWords[catId] = []
  if (!customWords[catId].includes(w)) customWords[catId].push(w)
  newWord[catId] = ''
}

function removeCustom(catId, idx) {
  customWords[catId].splice(idx, 1)
}

async function saveFilters() {
  if (!orgId.value) return
  saving.value = true
  savedMsg.value = ''

  const config = {}
  categories.forEach(cat => {
    config[cat.id] = {
      enabled: enabledCats[cat.id] !== false,
      custom:  customWords[cat.id] || [],
    }
  })

  const { error } = await supabase
    .from('organizations')
    .update({ filter_config: config })
    .eq('id', orgId.value)

  saving.value = false
  savedMsg.value = error ? `Error: ${error.message}` : 'Configuración guardada'
  setTimeout(() => savedMsg.value = '', 3000)
}
</script>
