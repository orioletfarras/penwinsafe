<template>
  <div class="space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-bold text-gray-900 tracking-tight">DNS Escolar</h1>
        <p class="text-xs text-gray-400 mt-0.5">Filtrado de contenido · <span class="text-gray-600 font-medium">{{ currentOrgName }}</span></p>
      </div>
      <div class="flex items-center gap-2">
        <span v-if="cfg.zones_created"
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500">
          <span class="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>Activo
        </span>
        <span v-else
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-400">
          <span class="w-1.5 h-1.5 rounded-full bg-gray-300"></span>Sin configurar
        </span>
        <button @click="loadStats(); loadTraffic()" :disabled="loadingStats"
          class="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors">
          <ArrowPathIcon class="w-3.5 h-3.5" :class="loadingStats ? 'animate-spin' : ''" />
          Actualizar
        </button>
      </div>
    </div>

    <!-- Not configured -->
    <div v-if="!cfg.zones_created && !cfg.last_check_ok"
      class="rounded-2xl border border-dashed border-gray-200 p-12 text-center bg-gray-50 space-y-3">
      <div class="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center mx-auto">
        <CloudIcon class="w-6 h-6 text-gray-300" />
      </div>
      <p class="text-sm font-semibold text-gray-700">DNS Escolar no configurado</p>
      <p class="text-xs text-gray-400">Un superadmin debe conectar la cuenta Cloudflare en SuperConfig</p>
    </div>

    <template v-else>

      <!-- Tabs -->
      <div class="flex gap-0.5 p-0.5 rounded-lg bg-gray-100">
        <button v-for="t in mainTabs" :key="t.key"
          @click="mainTab = t.key; if(t.key==='stats' && !stats) loadStats()"
          class="flex-1 py-2 rounded-md text-xs font-bold transition-all duration-150"
          :class="mainTab === t.key
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-500 hover:text-gray-700'">
          {{ t.label }}
        </button>
      </div>

      <!-- ── ESTADÍSTICAS ──────────────────────────────────────────── -->
      <template v-if="mainTab === 'stats'">

        <!-- Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Day selector -->
          <div class="flex gap-0.5 p-0.5 rounded-lg bg-gray-100">
            <button v-for="d in [1,7,30]" :key="d"
              @click="statsDays = d; loadStats()"
              class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              :class="statsDays === d ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
              {{ d === 1 ? 'Hoy' : d === 7 ? '7 días' : '30 días' }}
            </button>
          </div>

          <!-- Zone selector -->
          <div class="flex gap-0.5 p-0.5 rounded-lg bg-gray-100">
            <button
              @click="statsZone = null; loadStats()"
              class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              :class="statsZone === null ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
              Todas
            </button>
            <button v-for="zone in zones" :key="zone.key"
              @click="statsZone = zone.key; loadStats()"
              class="px-3 py-1.5 rounded-md text-xs font-semibold transition-all"
              :class="statsZone === zone.key ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              :style="statsZone === zone.key ? `color:${zone.color}` : ''">
              {{ zoneNames[zone.key] }}
            </button>
          </div>

        </div>

        <!-- Loading -->
        <div v-if="loadingStats"
          class="rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center gap-2.5 py-16 text-gray-300">
          <ArrowPathIcon class="w-5 h-5 animate-spin" />
          <span class="text-sm">Cargando estadísticas…</span>
        </div>

        <template v-else-if="stats">

          <!-- KPI cards -->
          <div class="grid grid-cols-3 gap-3">
            <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100">
              <p class="text-3xl font-black text-blue-700 tabular-nums">{{ fmtNum(stats.total_allowed) }}</p>
              <p class="text-xs font-bold text-blue-500 mt-1 uppercase tracking-wide">Permitidas</p>
            </div>
            <div class="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-100">
              <p class="text-3xl font-black text-violet-700 tabular-nums">{{ fmtNum(stats.total_blocked) }}</p>
              <p class="text-xs font-bold text-violet-500 mt-1 uppercase tracking-wide">Bloqueadas</p>
            </div>
            <div class="rounded-2xl p-5 bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200">
              <p class="text-3xl font-black text-gray-800 tabular-nums">
                {{ stats.total_allowed + stats.total_blocked > 0
                  ? Math.round(stats.total_blocked / (stats.total_allowed + stats.total_blocked) * 100) : 0 }}%
              </p>
              <p class="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Tasa de bloqueo</p>
            </div>
          </div>

          <!-- Apps table -->
          <div v-if="appStats.length" class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div class="grid items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide"
              style="grid-template-columns:2fr 1fr 1fr 50px">
              <span>Aplicación</span>
              <span class="text-right text-sky-400">Permitidas</span>
              <span class="text-right text-violet-400">Bloqueadas</span>
              <span class="text-center">%</span>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="app in appStats" :key="app.app"
                class="grid items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
                style="grid-template-columns:2fr 1fr 1fr 50px">
                <div class="flex items-center gap-2.5 min-w-0">
                  <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                    :style="`background:#${BRAND_ICONS[app.app]?.hex || 'f3f4f6'}18`">
                    <svg v-if="BRAND_ICONS[app.app]" viewBox="0 0 24 24" class="w-3.5 h-3.5"
                      :fill="`#${BRAND_ICONS[app.app].hex === '000000' ? '374151' : BRAND_ICONS[app.app].hex}`">
                      <path :d="BRAND_ICONS[app.app].path" />
                    </svg>
                    <span v-else class="text-[11px] text-gray-400 font-bold">{{ app.app.slice(0,2).toUpperCase() }}</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-xs font-bold text-gray-800 truncate">{{ app.app }}</p>
                    <div class="mt-0.5 h-1 rounded-full bg-gray-100 overflow-hidden" style="width:80px">
                      <div class="h-full rounded-full transition-all duration-500"
                        :style="`width:${Math.round((app.allowed + app.blocked) / maxAppTotal * 100)}%;background:${BRAND_ICONS[app.app] ? '#'+BRAND_ICONS[app.app].hex : app.color}`" />
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold text-sky-500 tabular-nums">{{ app.allowed.toLocaleString() }}</p>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold tabular-nums" :class="app.blocked > 0 ? 'text-violet-500' : 'text-gray-200'">
                    {{ app.blocked > 0 ? app.blocked.toLocaleString() : '—' }}
                  </p>
                </div>
                <div class="text-center">
                  <p class="text-xs font-bold tabular-nums"
                    :class="blockRate(app) > 50 ? 'text-violet-600' : blockRate(app) > 15 ? 'text-violet-400' : 'text-gray-300'">
                    {{ blockRate(app) > 0 ? blockRate(app) + '%' : '—' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- By zone -->
          <div v-if="Object.keys(stats.by_location).length"
            class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-100">
              <p class="text-sm font-bold text-gray-800">Por zona</p>
            </div>
            <div class="divide-y divide-gray-50">
              <div v-for="(v, loc) in stats.by_location" :key="loc" class="px-4 py-3.5 space-y-2">
                <div class="flex items-center justify-between">
                  <span class="text-xs font-bold text-gray-700">{{ loc }}</span>
                  <div class="flex items-center gap-3 text-xs">
                    <span class="text-sky-600 font-semibold tabular-nums">{{ v.allowed.toLocaleString() }} permitidas</span>
                    <span class="text-violet-500 font-semibold tabular-nums">{{ v.blocked.toLocaleString() }} bloqueadas</span>
                  </div>
                </div>
                <div class="h-1.5 rounded-full bg-sky-100 overflow-hidden">
                  <div class="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500 transition-all duration-500"
                    :style="`width:${v.allowed + v.blocked > 0 ? Math.round(v.blocked / (v.allowed + v.blocked) * 100) : 0}%`" />
                </div>
              </div>
            </div>
          </div>

          <!-- Domain detail (expandable) -->
          <div class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
            <button @click="statsExpanded = !statsExpanded"
              class="w-full flex items-center justify-between px-5 py-3.5 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-colors">
              <span>Ver detalle por dominio</span>
              <ChevronDownIcon class="w-4 h-4 transition-transform duration-200" :class="statsExpanded ? 'rotate-180' : ''" />
            </button>

            <div v-if="statsExpanded" class="border-t border-gray-100">

              <!-- Search -->
              <div class="px-5 pt-4 pb-2 border-b border-gray-100">
                <input v-model="domainSearch" type="text" placeholder="Buscar dominio…"
                  class="w-full px-3 py-2 rounded-xl text-xs font-mono border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700 placeholder-gray-300" />
              </div>

              <!-- Blocked by category -->
              <div class="px-5 pt-4 pb-3">
                <div class="flex items-center gap-2 mb-3">
                  <span class="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>
                  <p class="text-xs font-bold text-red-600">Bloqueados</p>
                </div>
                <div v-if="blockedByCategory.length" class="space-y-2">
                  <div v-for="cat in blockedByCategory" :key="cat.key"
                    class="rounded-xl border border-red-100 overflow-hidden">
                    <div class="flex items-center justify-between px-3 py-2 bg-red-50">
                      <div class="flex items-center gap-2">
                        <span class="text-base leading-none">{{ cat.emoji }}</span>
                        <span class="text-xs font-bold text-red-700">{{ cat.name }}</span>
                      </div>
                      <span class="text-[10px] font-bold tabular-nums text-red-500">
                        {{ cat.items.reduce((s, i) => s + i.count, 0).toLocaleString() }}×
                      </span>
                    </div>
                    <div class="divide-y divide-red-50 max-h-40 overflow-auto">
                      <div v-for="item in cat.items.filter(x => !domainSearch || x.name.includes(domainSearch))" :key="item.name"
                        class="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50/40 transition-colors">
                        <span class="w-1.5 h-1.5 rounded-full bg-red-300 flex-shrink-0"></span>
                        <span class="flex-1 font-mono text-[11px] text-gray-700 truncate">{{ item.name }}</span>
                        <span class="flex-shrink-0 text-[10px] font-bold tabular-nums text-red-400">{{ item.count.toLocaleString() }}×</span>
                      </div>
                    </div>
                  </div>
                </div>
                <p v-else class="py-4 text-center text-xs text-gray-400">Sin bloqueos</p>
              </div>

              <!-- Divider -->
              <div class="border-t border-gray-100 mx-5"></div>

              <!-- Allowed domains -->
              <div class="px-5 pt-4 pb-4">
                <div class="flex items-center gap-2 mb-3">
                  <span class="w-2 h-2 rounded-full bg-sky-400 flex-shrink-0"></span>
                  <p class="text-xs font-bold text-sky-600">Permitidos</p>
                </div>
                <div v-if="stats.top_allowed.length" class="rounded-xl border border-sky-100 overflow-hidden divide-y divide-sky-50 max-h-52 overflow-auto">
                  <div v-for="item in stats.top_allowed.filter(x => !domainSearch || x.name.includes(domainSearch))" :key="item.name"
                    class="flex items-center gap-2 px-3 py-1.5 hover:bg-sky-50/40 transition-colors">
                    <span class="w-1.5 h-1.5 rounded-full bg-sky-300 flex-shrink-0"></span>
                    <span class="flex-1 font-mono text-[11px] text-gray-700 truncate">{{ item.name }}</span>
                    <span class="flex-shrink-0 text-[10px] font-bold tabular-nums text-sky-500">{{ item.count.toLocaleString() }}×</span>
                  </div>
                </div>
                <p v-else class="py-4 text-center text-xs text-gray-400">Sin datos</p>
              </div>

            </div>
          </div>

          <!-- ── Tráfico de red (UniFi DPI, cuando disponible) ── -->
          <template v-if="trafficData">
            <div class="flex items-center gap-3 pt-1">
              <div class="flex-1 h-px bg-gray-100"></div>
              <span class="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Tráfico · últimas 24 h</span>
              <div class="flex-1 h-px bg-gray-100"></div>
            </div>

            <div class="grid grid-cols-3 gap-3">
              <div class="rounded-2xl p-5 bg-gradient-to-br from-blue-50 to-sky-100 border border-blue-100">
                <p class="text-3xl font-black text-blue-700 tabular-nums">{{ fmt(trafficData.total_rx) }}</p>
                <p class="text-xs font-bold text-blue-500 mt-1 uppercase tracking-wide">Descargado</p>
              </div>
              <div class="rounded-2xl p-5 bg-gradient-to-br from-violet-50 to-purple-100 border border-violet-100">
                <p class="text-3xl font-black text-violet-700 tabular-nums">{{ fmt(trafficData.total_tx) }}</p>
                <p class="text-xs font-bold text-violet-500 mt-1 uppercase tracking-wide">Subido</p>
              </div>
              <div class="rounded-2xl p-5 bg-gradient-to-br from-gray-50 to-slate-100 border border-gray-200">
                <p class="text-3xl font-black text-gray-800 tabular-nums">{{ fmt(trafficData.total_rx + trafficData.total_tx) }}</p>
                <p class="text-xs font-bold text-gray-400 mt-1 uppercase tracking-wide">Total</p>
              </div>
            </div>

            <div v-if="trafficData.chart && trafficData.chart.length" class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
              <p class="text-sm font-bold text-gray-800">Tráfico por hora</p>
              <div class="relative" style="height:140px">
                <svg class="w-full h-full" :viewBox="`0 0 ${chartW} ${chartH}`" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="dnsRxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.4"/>
                      <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
                    </linearGradient>
                    <linearGradient id="dnsTxGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stop-color="#a78bfa" stop-opacity="0.4"/>
                      <stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <path :d="areaPath('rx')" fill="url(#dnsRxGrad)" />
                  <path :d="linePath('rx')" fill="none" stroke="#38bdf8" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                  <path :d="areaPath('tx')" fill="url(#dnsTxGrad)" />
                  <path :d="linePath('tx')" fill="none" stroke="#a78bfa" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
                <div class="absolute top-0 left-0 flex flex-col justify-between h-full pointer-events-none">
                  <span class="text-[9px] text-gray-300">{{ fmt(chartMaxVal) }}</span>
                  <span class="text-[9px] text-gray-300">0</span>
                </div>
                <div class="absolute bottom-0 left-6 right-0 flex justify-between pointer-events-none">
                  <span v-for="label in chartXLabels" :key="label" class="text-[9px] text-gray-300">{{ label }}</span>
                </div>
              </div>
              <div class="flex items-center gap-4">
                <div class="flex items-center gap-1.5"><div class="w-3 h-1 rounded-full bg-sky-400"></div><span class="text-xs text-gray-500">Descarga</span></div>
                <div class="flex items-center gap-1.5"><div class="w-3 h-1 rounded-full bg-violet-400"></div><span class="text-xs text-gray-500">Subida</span></div>
              </div>
            </div>

            <div v-if="trafficData.apps && trafficData.apps.length" class="rounded-2xl bg-white border border-gray-100 shadow-sm overflow-hidden">
              <div class="grid items-center px-4 py-2.5 bg-gray-50 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase tracking-wide"
                style="grid-template-columns:2fr 1fr 1fr 1.5fr 40px">
                <span>Aplicación</span>
                <span class="text-right text-sky-400">Descarga</span>
                <span class="text-right text-violet-400">Subida</span>
                <span class="text-right">Top cliente</span>
                <span class="text-center">Nº</span>
              </div>
              <div class="divide-y divide-gray-50">
                <div v-for="app in trafficData.apps" :key="app.name"
                  class="grid items-center px-4 py-3 hover:bg-gray-50/60 transition-colors"
                  style="grid-template-columns:2fr 1fr 1fr 1.5fr 40px">
                  <div class="flex items-center gap-2.5 min-w-0">
                    <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                      :style="`background:#${BRAND_ICONS[app.name]?.hex || 'f3f4f6'}18`">
                      <svg v-if="BRAND_ICONS[app.name]" viewBox="0 0 24 24" class="w-3.5 h-3.5"
                        :fill="`#${BRAND_ICONS[app.name].hex === '000000' ? '374151' : BRAND_ICONS[app.name].hex}`">
                        <path :d="BRAND_ICONS[app.name].path" />
                      </svg>
                      <span v-else class="text-[11px] text-gray-400 font-bold">{{ app.name.slice(0,2).toUpperCase() }}</span>
                    </div>
                    <div class="min-w-0">
                      <p class="text-xs font-bold text-gray-800 truncate">{{ app.name }}</p>
                      <div class="mt-0.5 h-1 rounded-full bg-gray-100 overflow-hidden" style="width:80px">
                        <div class="h-full rounded-full transition-all duration-500"
                          :style="`width:${pctApp(app.total_bytes)}%;background:${BRAND_ICONS[app.name] ? '#'+BRAND_ICONS[app.name].hex : '#94a3b8'}`" />
                      </div>
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-xs font-semibold text-sky-500">{{ fmt(app.rx_bytes) }}</p>
                    <p class="text-[10px] text-gray-400">{{ fmt(app.total_bytes) }}</p>
                  </div>
                  <p class="text-xs font-semibold text-violet-500 text-right">{{ fmt(app.tx_bytes) }}</p>
                  <p class="text-[11px] text-gray-500 text-right truncate pl-2">{{ app.top_client || '—' }}</p>
                  <p class="text-xs font-bold text-gray-400 text-center">{{ app.clients || '—' }}</p>
                </div>
              </div>
            </div>
          </template>

        </template>

        <div v-else class="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p class="text-sm text-gray-400">Pulsa "Actualizar" para cargar estadísticas</p>
        </div>

      </template>

      <!-- ── FILTRADO ─────────────────────────────────────────────────── -->
      <template v-else-if="mainTab === 'filter'">

        <div v-if="!categories.length" class="card p-8 text-center">
          <ArrowPathIcon class="w-5 h-5 mx-auto animate-spin text-gray-300 mb-2" />
          <p class="text-xs text-gray-400">Cargando configuración…</p>
        </div>

        <template v-else>

          <!-- Per-zone advanced categories -->
          <div class="card overflow-hidden">
            <div v-for="(zone, zi) in zones" :key="zone.key"
              class="px-5 py-5"
              :class="zi < zones.length - 1 ? 'border-b border-gray-100' : ''">
              <div class="flex items-center gap-2 mb-3">
                <span class="w-2 h-2 rounded-full flex-shrink-0" :style="`background:${zone.color}`"></span>
                <p class="text-[13px] font-semibold" :style="`color:${zone.color}`">{{ zoneNames[zone.key] }}</p>
              </div>
              <div class="flex gap-1 mb-3">
                <button v-for="tab in advTabs" :key="tab.key"
                  @click="activeTab[zone.key] = tab.key"
                  class="px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all"
                  :style="activeTab[zone.key] === tab.key
                    ? `background:${zone.color};color:#fff`
                    : 'background:#f3f4f6;color:#9ca3af'">
                  {{ tab.label }}
                </button>
              </div>
              <div v-if="activeTab[zone.key] === 'security' || activeTab[zone.key] === 'content'" class="grid grid-cols-3 gap-1.5">
                <label v-for="cat in groupCats(activeTab[zone.key])" :key="cat.id"
                  class="flex items-center gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all text-[11px] font-medium"
                  :style="isCatSelected(zone.key, cat.id)
                    ? `background:${zone.color}12;outline:1.5px solid ${zone.color}50;color:#111827`
                    : 'background:#f9fafb;color:#9ca3af'">
                  <input type="checkbox" :checked="isCatSelected(zone.key, cat.id)"
                    @change="toggleCat(zone.key, cat.id)"
                    class="rounded flex-shrink-0" :style="`accent-color:${zone.color}`" />
                  {{ cat.name }}
                </label>
              </div>
              <div v-else-if="activeTab[zone.key] === 'blocked'">
                <textarea v-model="domainInputs[zone.key]" @blur="parseDomains(zone.key)"
                  rows="4" placeholder="redesocial.com&#10;*.streaming.net"
                  class="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none resize-none border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-300"></textarea>
              </div>
              <div v-else-if="activeTab[zone.key] === 'allowed'">
                <textarea v-model="whitelistInputs[zone.key]" @blur="parseWhitelist(zone.key)"
                  rows="4" placeholder="recursoseducativos.com&#10;*.google.com"
                  class="w-full px-3 py-2.5 rounded-xl text-xs font-mono outline-none resize-none border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all text-gray-700 placeholder-gray-300"></textarea>
              </div>
            </div>
          </div>

          <!-- Result banner -->
          <div v-if="result"
            class="flex items-center gap-3 px-4 py-3 rounded-xl text-[12px] font-semibold"
            :class="result.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'">
            <CheckCircleIcon v-if="result.ok" class="w-4 h-4 flex-shrink-0" />
            <ExclamationCircleIcon v-else class="w-4 h-4 flex-shrink-0" />
            {{ result.msg }}
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button @click="applyFromToggles" :disabled="applying || saving"
              class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-[12px] font-semibold text-white transition-all disabled:opacity-40"
              style="background:#006fff">
              <ArrowPathIcon v-if="applying" class="w-3 h-3 animate-spin" />
              {{ applying ? 'Aplicando…' : 'Guardar y aplicar' }}
            </button>
            <p class="text-[11px]" style="color:#9ca3af">Los cambios se aplican inmediatamente en el filtro DNS</p>
          </div>

        </template>

      </template>

      <!-- ── ACCESO ──────────────────────────────────────────────────── -->
      <template v-else-if="mainTab === 'access'">

        <!-- Zone selector - same pill style as Stats -->
        <div class="flex gap-0.5 p-0.5 rounded-lg bg-gray-100 self-start">
          <button v-for="zone in zones" :key="zone.key"
            @click="activeZoneAccess = zone.key"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all duration-150"
            :class="activeZoneAccess === zone.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'">
            <span class="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-150"
              :style="`background:${activeZoneAccess === zone.key ? zone.color : '#d1d5db'}`"></span>
            {{ zoneNames[zone.key] }}
          </button>
        </div>

        <template v-if="cfg[`zone_${activeZoneAccess}_doh`]">

          <!-- Info cards -->
          <div class="space-y-3">

            <!-- DNS estándar -->
            <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <GlobeAltIcon class="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800">DNS estándar</p>
                  <p class="text-xs text-gray-400 mt-0.5">Para dispositivos dentro de la red escolar (puerto 53)</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <code class="flex-1 text-xs font-mono px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 truncate">
                  {{ (cfg[`zone_${activeZoneAccess}_ip`] || []).join('   ·   ') || 'No disponible' }}
                </code>
                <button @click="copyIp(activeZoneAccess)"
                  class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <ClipboardDocumentIcon class="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>

            <!-- DoH -->
            <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <ShieldCheckIcon class="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800">DNS-over-HTTPS</p>
                  <p class="text-xs text-gray-400 mt-0.5">Para dispositivos fuera del colegio (casa, 4G)</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <code class="flex-1 text-xs font-mono px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 truncate">
                  https://{{ cfg[`zone_${activeZoneAccess}_doh`] }}.cloudflare-gateway.com/dns-query
                </code>
                <button @click="copyDoh(activeZoneAccess)"
                  class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <ClipboardDocumentIcon class="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
            </div>

            <!-- DNS Stamp -->
            <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-3">
              <div class="flex items-start gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <LockClosedIcon class="w-4 h-4 text-blue-500" />
                </div>
                <div>
                  <p class="text-sm font-bold text-gray-800">DNS Stamp</p>
                  <p class="text-xs text-gray-400 mt-0.5">Para UniFi DNS Shield, AdGuard, DNSCrypt</p>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <code class="flex-1 text-[10px] font-mono px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 truncate">
                  {{ dnsStamp(activeZoneAccess) }}
                </code>
                <button @click="copyStamp(activeZoneAccess)"
                  class="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs font-semibold border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors flex-shrink-0">
                  <ClipboardDocumentIcon class="w-3.5 h-3.5" /> Copiar
                </button>
              </div>
              <p class="text-[10px] text-gray-400">Servidor: 162.159.36.5 · Protocolo DoH</p>
            </div>

          </div>

          <!-- Download profiles -->
          <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
            <div>
              <p class="text-sm font-bold text-gray-800">Instalar en dispositivos</p>
              <p class="text-xs text-gray-400 mt-0.5">Perfil de configuración para fuera del colegio</p>
            </div>
            <div class="grid grid-cols-3 gap-3">
              <button v-for="plat in PLATFORMS" :key="plat.key"
                @click="downloadProfile(activeZoneAccess, plat.key)"
                class="group flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50 transition-all duration-150">
                <div class="w-10 h-10 rounded-2xl flex items-center justify-center transition-transform duration-150 group-hover:scale-110"
                  :style="`background:#${plat.icon.hex}15`">
                  <svg viewBox="0 0 24 24" class="w-6 h-6"
                    :fill="`#${plat.icon.hex === '000000' ? '374151' : plat.icon.hex}`">
                    <path :d="plat.icon.path" />
                  </svg>
                </div>
                <div class="text-center">
                  <p class="text-xs font-bold text-gray-800">{{ plat.label }}</p>
                  <p class="text-[10px] text-gray-400 mt-0.5">{{ plat.sub }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- Networks -->
          <div class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-bold text-gray-800">IPs del colegio</p>
                <p class="text-xs text-gray-400 mt-0.5">Necesario para que el DNS estándar filtre correctamente</p>
              </div>
              <button @click="detectMyIp(activeZoneAccess)"
                class="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors font-semibold">
                Detectar mi IP
              </button>
            </div>
            <div class="flex flex-wrap gap-2 min-h-[28px]">
              <span v-for="net in zoneNetworks[activeZoneAccess]" :key="net"
                class="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-mono font-semibold bg-blue-50 text-blue-700 ring-1 ring-blue-200">
                {{ net }}
                <button @click="removeNetwork(activeZoneAccess, net)"
                  class="text-blue-400 hover:text-blue-700 transition-colors leading-none">×</button>
              </span>
              <span v-if="!zoneNetworks[activeZoneAccess].length" class="text-xs text-gray-400">Sin IPs registradas</span>
            </div>
            <div class="flex gap-2">
              <input v-model="networkInputs[activeZoneAccess]"
                type="text" placeholder="80.1.2.3 o 192.168.1.0/24"
                class="flex-1 px-3 py-2 rounded-xl text-xs font-mono border border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all text-gray-700 placeholder-gray-300"
                @keydown.enter="addNetwork(activeZoneAccess)" />
              <button @click="addNetwork(activeZoneAccess)"
                class="px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 transition-colors">
                Añadir
              </button>
              <button @click="registerNetworks(activeZoneAccess)" :disabled="savingNetworks[activeZoneAccess]"
                class="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-white transition-all"
                :class="savingNetworks[activeZoneAccess] ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'">
                <ArrowPathIcon v-if="savingNetworks[activeZoneAccess]" class="w-3.5 h-3.5 animate-spin" />
                Guardar
              </button>
            </div>
          </div>

          <!-- UniFi networks (only when controller is connected) -->
          <div v-if="unifiNets.length || loadingUnifiNets"
            class="rounded-2xl bg-white border border-gray-100 shadow-sm p-5 space-y-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm font-bold text-gray-800">Redes del controlador</p>
                <p class="text-xs text-gray-400 mt-0.5">Redes UniFi que filtran a través de esta zona</p>
              </div>
              <button @click="loadUnifiNets"
                class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors">
                <ArrowPathIcon class="w-4 h-4" :class="loadingUnifiNets ? 'animate-spin' : ''" />
              </button>
            </div>

            <!-- Loading skeleton -->
            <div v-if="loadingUnifiNets && !unifiNets.length" class="space-y-1.5">
              <div v-for="i in 3" :key="i" class="h-12 bg-gray-50 rounded-xl animate-pulse"></div>
            </div>

            <!-- Network list (all networks, toggle per zone) -->
            <template v-else>
              <div class="space-y-1.5">
                <button v-for="net in unifiNets" :key="net.id"
                  @click="toggleNetZone(net.id)"
                  class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left"
                  :class="unifiZoneMap[net.id] === activeZoneAccess
                    ? 'border-transparent'
                    : unifiZoneMap[net.id]
                      ? 'bg-gray-50 border-gray-100 opacity-50 cursor-not-allowed'
                      : 'bg-gray-50 border-gray-100 hover:border-blue-200 hover:bg-blue-50/50'"
                  :style="unifiZoneMap[net.id] === activeZoneAccess
                    ? `background:${zones.find(z=>z.key===activeZoneAccess)?.color}0d;border-color:${zones.find(z=>z.key===activeZoneAccess)?.color}30`
                    : ''"
                  :title="unifiZoneMap[net.id] && unifiZoneMap[net.id] !== activeZoneAccess ? `Asignada a otra zona` : ''">
                  <!-- Network icon -->
                  <svg class="w-4 h-4 flex-shrink-0 transition-colors"
                    :style="unifiZoneMap[net.id] === activeZoneAccess ? `color:${zones.find(z=>z.key===activeZoneAccess)?.color}` : 'color:#9ca3af'"
                    viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <rect x="2" y="2" width="6" height="6" rx="1"/><rect x="16" y="2" width="6" height="6" rx="1"/>
                    <rect x="9" y="16" width="6" height="6" rx="1"/>
                    <path d="M5 8v3a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8M12 13v3"/>
                  </svg>
                  <!-- Name + meta -->
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-semibold truncate transition-colors"
                      :style="unifiZoneMap[net.id] === activeZoneAccess ? `color:${zones.find(z=>z.key===activeZoneAccess)?.color}` : 'color:#374151'">
                      {{ net.name }}
                    </p>
                    <p class="text-[10px] text-gray-400">
                      {{ net.client_count }} cliente{{ net.client_count !== 1 ? 's' : '' }}{{ net.vlan ? ` · VLAN ${net.vlan}` : '' }}{{ net.subnet ? ` · ${net.subnet}` : '' }}
                    </p>
                  </div>
                  <!-- State badge -->
                  <span v-if="unifiZoneMap[net.id] === activeZoneAccess"
                    class="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    :style="`background:${zones.find(z=>z.key===activeZoneAccess)?.color}18;color:${zones.find(z=>z.key===activeZoneAccess)?.color}`">
                    <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="`background:${zones.find(z=>z.key===activeZoneAccess)?.color}`"></span>
                    Esta zona
                  </span>
                  <span v-else-if="unifiZoneMap[net.id]"
                    class="text-[10px] text-gray-400 font-medium flex-shrink-0">Otra zona</span>
                  <span v-else
                    class="text-[10px] text-blue-400 font-bold flex-shrink-0 opacity-0 group-hover:opacity-100">+ Añadir</span>
                </button>
              </div>

              <!-- Apply button -->
              <div class="flex items-center gap-3 pt-1 border-t border-gray-50">
                <button @click="applyNetworkDns" :disabled="savingUnifiNets"
                  class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white transition-all shadow-sm"
                  :class="savingUnifiNets ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:scale-95'">
                  <ArrowPathIcon v-if="savingUnifiNets" class="w-3.5 h-3.5 animate-spin" />
                  <svg v-else class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                  Aplicar DNS en redes
                </button>
                <p class="text-[10px] text-gray-400">Configura el DHCP de cada red para que use el DNS de esta zona</p>
              </div>
            </template>
          </div>

        </template>

        <div v-else class="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
          <p class="text-sm text-gray-400">No hay datos de conexión para esta zona todavía</p>
        </div>

      </template>

    </template>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs, orgSwitchKey } from '../../lib/orgStore'
import { useToast } from '../../lib/toast'
import {
  CloudIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon, ClipboardDocumentIcon, ChevronDownIcon,
  ShieldExclamationIcon, UserGroupIcon, WrenchScrewdriverIcon,
  GlobeAltIcon, LockClosedIcon,
} from '@heroicons/vue/24/outline'
import {
  siYoutube, siTiktok, siInstagram, siFacebook, siWhatsapp,
  siX, siNetflix, siTwitch, siSpotify, siRoblox, siSteam,
  siDiscord, siSnapchat, siGoogle, siApple, siCloudflare, siAndroid,
  siTelegram, siKahoot, siDuolingo, siKhanacademy, siWikipedia,
  siAkamai, siFastly, siEpicgames, siEa, siPlaystation, siHbo,
  siZoom, siDropbox,
  siPinterest, siReddit, siSignal, siVimeo, siSoundcloud, siFigma,
  siPlex, siNotion, siTrello, siPaypal, siStripe, siCrunchyroll,
  siTidal, siBandcamp, siAtlassian, siGitlab, siJira, siUbisoft,
  siViber, siLine, siTumblr, siGoogledrive, siDuckduckgo, siRoku,
  siRiotgames, siLeagueoflegends, siValorant, siBattledotnet, siMega,
  siWetransfer, siCoinbase, siBinance, siShopify, siQuizlet, siCoursera,
  siGooglecloud, siApplemusic, siWebex, siBox, siAsana, siConfluence,
  siGithub,
} from 'simple-icons'

// Windows logo path (not in simple-icons)
const WINDOWS_ICON = {
  hex: '0078D4',
  path: 'M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4h-13.051M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-13.051-1.851',
}

const BRAND_ICONS = {
  // Social / messaging
  'YouTube':          siYoutube,
  'TikTok':           siTiktok,
  'Instagram':        siInstagram,
  'Facebook':         siFacebook,
  'WhatsApp':         siWhatsapp,
  'Twitter / X':      siX,
  'Snapchat':         siSnapchat,
  'Telegram':         siTelegram,
  'Discord':          siDiscord,
  // Streaming
  'Netflix':          siNetflix,
  'Twitch':           siTwitch,
  'Spotify':          siSpotify,
  'HBO / Max':        siHbo,
  // Gaming
  'Roblox':           siRoblox,
  'Steam':            siSteam,
  'Epic / Fortnite':  siEpicgames,
  'EA / Origin':      siEa,
  'PlayStation':      siPlaystation,
  // Productivity / Education
  'Google':           siGoogle,
  'Microsoft':        WINDOWS_ICON,
  'Apple':            siApple,
  'Kahoot':           siKahoot,
  'Duolingo':         siDuolingo,
  'Khan Academy':     siKhanacademy,
  'Wikipedia':        siWikipedia,
  'Google Classroom': siGoogle,
  // Traffic DPI names (UniFi)
  'Google Services':  siGoogle,
  'Google Maps':      siGoogle,
  'Google Play':      siGoogle,
  'Google Meet':      siGoogle,
  'Gmail':            siGoogle,
  'iCloud':           siApple,
  'Apple Services':   siApple,
  'Apple Push':       siApple,
  'Apple Update':     siApple,
  'Microsoft Office': WINDOWS_ICON,
  'Microsoft Teams':  WINDOWS_ICON,
  'Windows Update':   WINDOWS_ICON,
  'SharePoint':       WINDOWS_ICON,
  'Office 365':       WINDOWS_ICON,
  'OneDrive':         WINDOWS_ICON,
  'Zoom':             siZoom,
  'Dropbox':          siDropbox,
  // Social / messaging (extended)
  'YouTube Music':    siYoutube,
  'YouTube TV':       siYoutube,
  'YouTube Live':     siYoutube,
  'Twitch Stream':    siTwitch,
  'TikTok Live':      siTiktok,
  'Instagram Live':   siInstagram,
  'Facebook Live':    siFacebook,
  'Facebook Messenger': siFacebook,
  'Pinterest':        siPinterest,
  'Tumblr':           siTumblr,
  'Reddit':           siReddit,
  'Viber':            siViber,
  'Line':             siLine,
  'Signal':           siSignal,
  'Twitter/X Media':  siX,
  // Streaming / audio
  'Amazon Video':     { hex: '00A8E1', path: 'M14.077 5.537a11.555 11.555 0 0 0-6.044 1.692L8.28 7.4C5.882 8.952 4.097 11.247 3.218 14.03a12.43 12.43 0 0 0 .504 8.65c.077.169.147.336.207.5.286.765-.093 1.609-.855 1.902a1.405 1.405 0 0 1-1.88-.857 15.325 15.325 0 0 1-.648-10.696C1.592 9.97 3.69 7.141 6.59 5.22a14.352 14.352 0 0 1 7.49-2.13 14.405 14.405 0 0 1 9.65 3.685c.584.535.624 1.444.09 2.03a1.435 1.435 0 0 1-2.022.09 11.54 11.54 0 0 0-7.72-3.358zm2.847 13.01l.001-.001.001-.001c.517-.491.509-1.316-.018-1.797a1.272 1.272 0 0 0-1.795.018l-1.098 1.048-.96-.914a1.273 1.273 0 0 0-1.796.015 1.297 1.297 0 0 0 .015 1.813l1.86 1.772a1.267 1.267 0 0 0 1.774-.006zm3.916-4.73c-.44 1.11-.997 2.112-1.65 2.98a1.408 1.408 0 0 0 .283 1.959 1.383 1.383 0 0 0 1.942-.285 16.57 16.57 0 0 0 2.09-3.777 1.419 1.419 0 0 0-.852-1.8 1.39 1.39 0 0 0-1.813.923z' },
  'Prime Video':      { hex: '00A8E1', path: 'M14.077 5.537a11.555 11.555 0 0 0-6.044 1.692L8.28 7.4C5.882 8.952 4.097 11.247 3.218 14.03a12.43 12.43 0 0 0 .504 8.65c.077.169.147.336.207.5.286.765-.093 1.609-.855 1.902a1.405 1.405 0 0 1-1.88-.857 15.325 15.325 0 0 1-.648-10.696C1.592 9.97 3.69 7.141 6.59 5.22a14.352 14.352 0 0 1 7.49-2.13 14.405 14.405 0 0 1 9.65 3.685c.584.535.624 1.444.09 2.03a1.435 1.435 0 0 1-2.022.09 11.54 11.54 0 0 0-7.72-3.358zm2.847 13.01l.001-.001.001-.001c.517-.491.509-1.316-.018-1.797a1.272 1.272 0 0 0-1.795.018l-1.098 1.048-.96-.914a1.273 1.273 0 0 0-1.796.015 1.297 1.297 0 0 0 .015 1.813l1.86 1.772a1.267 1.267 0 0 0 1.774-.006zm3.916-4.73c-.44 1.11-.997 2.112-1.65 2.98a1.408 1.408 0 0 0 .283 1.959 1.383 1.383 0 0 0 1.942-.285 16.57 16.57 0 0 0 2.09-3.777 1.419 1.419 0 0 0-.852-1.8 1.39 1.39 0 0 0-1.813.923z' },
  'Crunchyroll':      siCrunchyroll,
  'HBO Max':          siHbo,
  'Apple Music':      siApplemusic,
  'Apple Maps':       siApple,
  'Apple iMessage':   siApple,
  'Apple App Store':  siApple,
  'Apple TV':         siApple,
  'FaceTime':         siApple,
  'Siri':             siApple,
  'iCloud Drive':     siApple,
  'iCloud Photos':    siApple,
  'Google Play Store': siGoogle,
  'Google Photos':    siGoogle,
  'Google Analytics': siGoogle,
  'Google Workspace': siGoogle,
  'Google Drive':     siGoogledrive,
  'Google Cloud':     siGooglecloud,
  'OneDrive Photos':  WINDOWS_ICON,
  'Microsoft 365':    WINDOWS_ICON,
  'Microsoft Teams Video': WINDOWS_ICON,
  'Zoom Video':       siZoom,
  'Webex':            siWebex,
  'Tidal':            siTidal,
  'SoundCloud':       siSoundcloud,
  'Bandcamp':         siBandcamp,
  'Plex':             siPlex,
  'Vimeo':            siVimeo,
  'DuckDuckGo':       siDuckduckgo,
  'Roku':             siRoku,
  // Productivity / cloud
  'Box':              siBox,
  'Mega':             siMega,
  'WeTransfer':       siWetransfer,
  'Wetransfer':       siWetransfer,
  'GitHub':           siGithub,
  'GitLab':           siGitlab,
  'Jira':             siJira,
  'Confluence':       siConfluence,
  'Atlassian':        siAtlassian,
  'Figma':            siFigma,
  'Notion':           siNotion,
  'Trello':           siTrello,
  'Asana':            siAsana,
  'Shopify':          siShopify,
  'Stripe':           siStripe,
  'PayPal':           siPaypal,
  'Coinbase':         siCoinbase,
  'Binance':          siBinance,
  'Quizlet':          siQuizlet,
  'Coursera':         siCoursera,
  // Gaming (extended)
  'Roblox Studio':    siRoblox,
  'Epic Games':       siEpicgames,
  'Epic Games Launcher': siEpicgames,
  'Ubisoft':          siUbisoft,
  'Ubisoft Connect':  siUbisoft,
  'Blizzard':         siBattledotnet,
  'Battle.net':       siBattledotnet,
  'Overwatch':        siBattledotnet,
  'World of Warcraft': siBattledotnet,
  'Playstation Network': siPlaystation,
  'PlayStation Network': siPlaystation,
  'Riot Games':       siRiotgames,
  'Riot Client':      siRiotgames,
  'Valorant':         siValorant,
  'League of Legends': siLeagueoflegends,
  'Steam Download':   siSteam,
  'Origin/EA':        siEa,
  // Infrastructure
  'Amazon / AWS':     { hex: 'FF9900', path: 'M13.356 12.437c-.7.35-1.46.526-2.28.526a5.06 5.06 0 0 1-3.573-1.43 4.836 4.836 0 0 1-1.457-3.556 4.836 4.836 0 0 1 1.457-3.555 5.06 5.06 0 0 1 3.572-1.43c.82 0 1.58.176 2.28.527a4.43 4.43 0 0 1 1.64 1.484l-1.64 1.008a2.725 2.725 0 0 0-1.013-.91 2.873 2.873 0 0 0-1.267-.29 2.88 2.88 0 0 0-2.106.878 2.987 2.987 0 0 0-.878 2.288 2.99 2.99 0 0 0 .878 2.289 2.881 2.881 0 0 0 2.106.878c.468 0 .897-.097 1.267-.29a2.72 2.72 0 0 0 1.013-.912zm3.128-4.63h-2.282V6.21h6.504v1.597H18.42v5.957h-1.934zm6.066 5.957V6.21h1.934v5.958h3.516v1.596zM0 18.756c3.437 2.478 7.505 3.938 11.9 3.938 4.396 0 8.465-1.46 11.9-3.938.246-.18.027-.42-.25-.287-3.435 1.74-7.265 2.72-11.65 2.72-4.384 0-8.215-.98-11.65-2.72-.276-.133-.494.108-.25.287zm23.53-2.597c-.336-.43-2.22-.203-3.065-.102-.257.03-.296-.193-.066-.356 1.5-1.054 3.967-.75 4.253-.396.287.355-.076 2.824-1.488 4.003-.217.182-.424.085-.328-.154.32-.787 1.03-2.565.694-2.995z' },
  'Akamai CDN':       siAkamai,
  'Fastly CDN':       siFastly,
  'Cloudflare':       siCloudflare,
}

const PLATFORMS = [
  { key: 'macos',   icon: siApple,      label: 'macOS / iOS',  sub: '.mobileconfig' },
  { key: 'windows', icon: WINDOWS_ICON, label: 'Windows 11',   sub: 'URL DoH copiada' },
  { key: 'android', icon: siAndroid,    label: 'Android',      sub: 'Hostname copiado' },
]

const toast = useToast()

const currentOrgName = computed(() =>
  allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || '...'
)

// ── App domain map for stats grouping ─────────────────────────────────────
const APP_DOMAINS = [
  // ── Social / messaging ────────────────────────────────────────────────
  { app: 'YouTube',      color: '#ff0000', patterns: ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com', 'yt3.ggpht', 'youtube-nocookie'] },
  { app: 'TikTok',       color: '#010101', patterns: ['tiktok.com', 'tiktokcdn', 'muscdn.com', 'tiktokv.com', 'bytedance'] },
  { app: 'Instagram',    color: '#e1306c', patterns: ['instagram.com', 'cdninstagram'] },
  { app: 'Facebook',     color: '#1877f2', patterns: ['facebook.com', 'fb.com', 'fbcdn', 'fbsbx', 'facebook.net'] },
  { app: 'WhatsApp',     color: '#25d366', patterns: ['whatsapp.com', 'whatsapp.net'] },
  { app: 'Twitter / X',  color: '#000000', patterns: ['twitter.com', 'x.com', 'twimg.com', 't.co'] },
  { app: 'Snapchat',     color: '#fffc00', patterns: ['snapchat.com', 'sc-cdn', 'snap.com'] },
  { app: 'Telegram',     color: '#2CA5E0', patterns: ['telegram.org', 'telegram.me', 't.me', 'tdesktop'] },
  { app: 'Discord',      color: '#5865f2', patterns: ['discord.com', 'discordapp', 'discord.gg'] },
  // ── Streaming ─────────────────────────────────────────────────────────
  { app: 'Netflix',      color: '#e50914', patterns: ['netflix.com', 'nflxvideo', 'nflxso', 'nflximg'] },
  { app: 'Twitch',       color: '#9146ff', patterns: ['twitch.tv', 'jtvnw.net', 'twitchsvc', 'twitchapps'] },
  { app: 'Spotify',      color: '#1db954', patterns: ['spotify.com', 'scdn.co', 'spotifycdn', 'audio-fa.scdn'] },
  { app: 'Disney+',      color: '#0063e5', patterns: ['disneyplus.com', 'disney-plus', 'bamgrid.com', 'dssott.com'] },
  { app: 'Prime Video',  color: '#00A8E0', patterns: ['primevideo.com', 'amazon.es/gp/video', 'aiv-cdn'] },
  { app: 'HBO / Max',    color: '#002be7', patterns: ['hbomax.com', 'max.com', 'hbo.com'] },
  // ── Gaming ────────────────────────────────────────────────────────────
  { app: 'Roblox',       color: '#cc0000', patterns: ['roblox.com', 'rbxcdn'] },
  { app: 'Steam',        color: '#1b2838', patterns: ['steampowered.com', 'steamcommunity', 'steamstatic', 'steamcontent', 'steam-chat'] },
  { app: 'Epic / Fortnite', color: '#2d2d2d', patterns: ['epicgames.com', 'fortnite.com', 'unrealengine.com'] },
  { app: 'Minecraft',    color: '#4caf50', patterns: ['minecraft.net', 'minecraftservices', 'mojang.com'] },
  { app: 'EA / Origin',  color: '#f56c2d', patterns: ['ea.com', 'origin.com', 'eaassets'] },
  { app: 'PlayStation',  color: '#003791', patterns: ['playstation.com', 'sonyentertainmentnetwork', 'playstation.net'] },
  { app: 'Xbox',         color: '#107c10', patterns: ['xbox.com', 'xboxlive.com', 'xboxservices'] },
  // ── Productivity / Education ──────────────────────────────────────────
  { app: 'Google',       color: '#4285f4', patterns: ['google.com', 'google.es', 'googleapis.com', 'gstatic.com', 'googleusercontent', 'googlesyndication', 'googletagmanager', 'google-analytics', 'doubleclick', 'ggpht'] },
  { app: 'Microsoft',    color: '#0078d4', patterns: ['microsoft.com', 'office.com', 'office365', 'live.com', 'outlook.com', 'msftconnecttest', 'microsoftonline', 'office.net', 'skype.com', 'azure.com', 'sfx.ms', 'teams.microsoft', 'sharepoint.com', 'onenote.com', 'bing.com', 'msn.com'] },
  { app: 'Apple',        color: '#555555', patterns: ['apple.com', 'icloud.com', 'mzstatic.com', 'aaplimg.com', 'apple-mapkit', 'appattest'] },
  { app: 'Kahoot',       color: '#46178f', patterns: ['kahoot.com', 'kahoot.it', 'kahoot.net'] },
  { app: 'Canva',        color: '#00c4cc', patterns: ['canva.com', 'canva-apps'] },
  { app: 'ClassDojo',    color: '#00adef', patterns: ['classdojo.com'] },
  { app: 'Duolingo',     color: '#58cc02', patterns: ['duolingo.com', 'duolingo-images'] },
  { app: 'Khan Academy', color: '#14BF96', patterns: ['khanacademy.org', 'kastatic.org', 'kasandbox.org'] },
  { app: 'Wikipedia',    color: '#000000', patterns: ['wikipedia.org', 'wikimedia.org', 'wikidata.org'] },
  { app: 'Google Classroom', color: '#34A853', patterns: ['classroom.google', 'meet.google'] },
  // ── Infrastructure / CDN ─────────────────────────────────────────────
  { app: 'Amazon / AWS', color: '#ff9900', patterns: ['amazon.com', 'amazonaws.com', 'amazon.es', 'cloudfront.net', 'amazonvideo'] },
  { app: 'Akamai CDN',   color: '#009bde', patterns: ['akamai', 'akamaized.net', 'akamaihd.net', 'edgesuite.net', 'akamaiapis'] },
  { app: 'Fastly CDN',   color: '#ff282d', patterns: ['fastly.net', 'fastlylb.net', 'fastlyinsights'] },
  { app: 'Cloudflare',   color: '#f38020', patterns: ['cloudflare.com', 'cloudflare-gateway', 'cloudflarestorage', 'cloudflareinsights', '1.1.1.1', 'cloudflare-dns.com', 'cloudflare.net'] },
]

// ── Filter groups ──────────────────────────────────────────────────────────
const FILTER_GROUPS = [
  { key: 'adult',     name: 'Contenido adulto',      emoji: '🔞', desc: 'Pornografía y contenido para adultos',       locked: true,  cfSecurity: [2] },
  { key: 'threats',   name: 'Amenazas de seguridad', emoji: '🦠', desc: 'Malware, phishing, ransomware, scams',       locked: true,  cfSecurity: [21] },
  { key: 'social',    name: 'Redes sociales',         emoji: '📱', desc: 'Instagram, TikTok, Twitter, Snapchat, FB',  locked: false, domains: ['instagram.com', 'cdninstagram.com', 'tiktok.com', 'tiktokcdn.com', 'twitter.com', 'x.com', 'twimg.com', 'snapchat.com', 'sc-cdn.net', 'facebook.com', 'fbcdn.net', 'fb.com'] },
  { key: 'streaming', name: 'Vídeo & streaming',      emoji: '📺', desc: 'YouTube, Netflix, Twitch, Disney+, HBO',    locked: false, domains: ['youtube.com', 'youtu.be', 'googlevideo.com', 'ytimg.com', 'netflix.com', 'nflxvideo.net', 'twitch.tv', 'jtvnw.net', 'disneyplus.com', 'hbomax.com', 'primevideo.com'] },
  { key: 'gaming',    name: 'Videojuegos',            emoji: '🎮', desc: 'Roblox, Fortnite, Steam, Minecraft, EA',   locked: false, domains: ['roblox.com', 'rbxcdn.com', 'epicgames.com', 'fortnite.com', 'steampowered.com', 'steamcommunity.com', 'minecraft.net', 'ea.com'] },
  { key: 'gambling',  name: 'Apuestas',               emoji: '🎲', desc: 'Casinos online, apuestas deportivas',       locked: false, cfContent: [8] },
  { key: 'messaging', name: 'Mensajería',             emoji: '💬', desc: 'WhatsApp, Telegram, Discord',              locked: false, domains: ['whatsapp.com', 'whatsapp.net', 'telegram.org', 'telegram.me', 'discord.com', 'discord.gg', 'discordapp.com'] },
]

// ── Main tabs ──────────────────────────────────────────────────────────────
const mainTabs = [
  { key: 'stats',  label: 'Estadísticas' },
  { key: 'filter', label: 'Filtrado' },
  { key: 'access', label: 'Acceso' },
]
const mainTab = ref('stats')

// ── State ──────────────────────────────────────────────────────────────────
const cfg      = ref({ zones_created: false, last_check_ok: null, available_categories: [], default_zone: null })
const saving   = ref(false)
const applying = ref(false)
const result   = ref(null)
const statsExpanded  = ref(false)
const filterExpanded = ref(false)
const activeZoneAccess = ref('students')

// Stats
const statsDays    = ref(7)
const statsZone    = ref(null) // null = all zones
const loadingStats = ref(false)
const stats        = ref(null)

// Filter state per zone
const filterState = ref({
  students: { adult: true, threats: true, social: false, streaming: false, gaming: false, gambling: false, messaging: false },
  teachers: { adult: true, threats: true, social: false, streaming: false, gaming: false, gambling: false, messaging: false },
  admin:    { adult: true, threats: true, social: false, streaming: false, gaming: false, gambling: false, messaging: false },
})

// Categories (detailed)
const categories = ref([])
const zoneNames           = ref({ students: 'Alumnos', teachers: 'Profesores', admin: 'Administración' })
const selectedCategories  = ref({ students: [], teachers: [], admin: [] })
const customDomains       = ref({ students: [], teachers: [], admin: [] })
const whitelists          = ref({ students: [], teachers: [], admin: [] })
const zoneNetworks        = ref({ students: [], teachers: [], admin: [] })
const domainInputs        = ref({ students: '', teachers: '', admin: '' })
const whitelistInputs     = ref({ students: '', teachers: '', admin: '' })
const networkInputs       = ref({ students: '', teachers: '', admin: '' })
const activeTab           = ref({ students: 'security', teachers: 'security', admin: 'security' })
const savingNetworks      = ref({ students: false, teachers: false, admin: false })

const advTabs = [
  { key: 'security', label: 'Seguridad' },
  { key: 'content',  label: 'Contenido' },
  { key: 'blocked',  label: 'Bloqueados' },
  { key: 'allowed',  label: 'Permitidos' },
]

const zones = [
  { key: 'students', level: 'Máxima protección', color: '#dc2626', border: '#fecaca', icon: ShieldExclamationIcon },
  { key: 'teachers', level: 'Protección media',  color: '#d97706', border: '#fde68a', icon: UserGroupIcon },
  { key: 'admin',    level: 'Protección básica', color: '#2563eb', border: '#bfdbfe', icon: WrenchScrewdriverIcon },
]

// ── Infer why a domain was blocked ────────────────────────────────────────
function inferCategory(domainName) {
  for (const group of FILTER_GROUPS) {
    if (group.domains?.some(d => domainName.includes(d.replace('*.', '')))) return group
  }
  return null
}

const blockedByCategory = computed(() => {
  if (!stats.value?.top_blocked?.length) return []
  const groups = {}
  const uncategorized = []
  for (const item of stats.value.top_blocked) {
    const group = inferCategory(item.name)
    if (group) {
      if (!groups[group.key]) groups[group.key] = { ...group, items: [] }
      groups[group.key].items.push(item)
    } else {
      uncategorized.push(item)
    }
  }
  const result = Object.values(groups).sort((a, b) =>
    b.items.reduce((s, i) => s + i.count, 0) - a.items.reduce((s, i) => s + i.count, 0)
  )
  if (uncategorized.length) result.push({ key: 'other', name: 'Sin categorizar', emoji: '🔒', items: uncategorized })
  return result
})

// ── Computed ───────────────────────────────────────────────────────────────
function buildAppMap(items, field) {
  const apps = {}
  for (const item of items) {
    const appInfo = APP_DOMAINS.find(a => a.patterns.some(p => item.name.includes(p)))
    const key = appInfo?.app || 'Otros'
    if (!apps[key]) apps[key] = { app: key, color: appInfo?.color || '#9ca3af', count: 0 }
    apps[key].count += item.count
  }
  return Object.values(apps).sort((a, b) => b.count - a.count)
}

const topVisited = computed(() => {
  if (!stats.value) return []
  return buildAppMap(stats.value.top_allowed || [], 'allowed')
})

const topBlocked = computed(() => {
  if (!stats.value) return []
  return buildAppMap(stats.value.top_blocked || [], 'blocked')
})

const maxVisited = computed(() => Math.max(1, ...topVisited.value.map(a => a.count)))
const maxBlockedCount = computed(() => Math.max(1, ...topBlocked.value.map(a => a.count)))

// legacy — kept for by-zone section
const appStats = computed(() => {
  if (!stats.value) return []
  const apps = {}
  function add(items, blocked) {
    for (const item of items) {
      const appInfo = APP_DOMAINS.find(a => a.patterns.some(p => item.name.includes(p)))
      const key = appInfo?.app || 'Otros'
      if (!apps[key]) apps[key] = { app: key, color: appInfo?.color || '#9ca3af', allowed: 0, blocked: 0 }
      if (blocked) apps[key].blocked += item.count
      else apps[key].allowed += item.count
    }
  }
  add(stats.value.top_allowed || [], false)
  add(stats.value.top_blocked || [], true)
  return Object.values(apps).sort((a, b) => (b.allowed + b.blocked) - (a.allowed + a.blocked))
})

const maxAppTotal = computed(() =>
  Math.max(1, ...appStats.value.map(a => a.allowed + a.blocked))
)

// ── Helpers ────────────────────────────────────────────────────────────────
function groupCats(cls) {
  return categories.value.filter(c => cls === 'security'
    ? (c.class === 'free' || c.class === 'blocked')
    : (c.class !== 'free' && c.class !== 'blocked'))
}
function selectedCats(key)      { return selectedCategories.value[key] || [] }
function isCatSelected(key, id) { return selectedCats(key).includes(id) }

function toggleCat(key, id) {
  const arr = selectedCategories.value[key]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function parseDomains(key) {
  customDomains.value[key] = [...new Set(domainInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean))]
}
function parseWhitelist(key) {
  whitelists.value[key] = [...new Set(whitelistInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean))]
}

function fmtNum(n) {
  if (!n) return '0'
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (n >= 1e3) return `${(n / 1e3).toFixed(0)}K`
  return n.toLocaleString()
}

function blockRate(app) {
  const total = app.allowed + app.blocked
  return total > 0 ? Math.round(app.blocked / total * 100) : 0
}

function addNetwork(key) {
  const raw = networkInputs.value[key].trim()
  if (!raw) return
  const cidr = raw.includes('/') ? raw : `${raw}/32`
  if (!zoneNetworks.value[key].includes(cidr)) zoneNetworks.value[key].push(cidr)
  networkInputs.value[key] = ''
}
function removeNetwork(key, n) { zoneNetworks.value[key] = zoneNetworks.value[key].filter(x => x !== n) }

async function detectMyIp(key) {
  try {
    const res = await fetch('https://api.ipify.org?format=json')
    const { ip } = await res.json()
    networkInputs.value[key] = ip
    toast.success(`IP detectada: ${ip}`)
  } catch { toast.error('No se pudo detectar la IP pública') }
}

// ── Filter state ───────────────────────────────────────────────────────────
function initFilterState() {
  for (const zone of ['students', 'teachers', 'admin']) {
    const cats = selectedCategories.value[zone] || []
    const doms = customDomains.value[zone] || []
    for (const group of FILTER_GROUPS) {
      if (group.locked) { filterState.value[zone][group.key] = true; continue }
      const cfCats = [...(group.cfSecurity || []), ...(group.cfContent || [])]
      const catMatch = cfCats.length > 0 && cfCats.some(id => cats.includes(id))
      const domMatch = (group.domains || []).some(d => doms.includes(d))
      filterState.value[zone][group.key] = catMatch || domMatch
    }
  }
}

async function applyFromToggles() {
  zones.forEach(z => { parseDomains(z.key); parseWhitelist(z.key) })

  // All category IDs owned by the basic toggle groups — any ID not in this set was added via advanced mode
  const allGroupCats = new Set(FILTER_GROUPS.flatMap(g => [...(g.cfSecurity || []), ...(g.cfContent || [])]))

  for (const zone of ['students', 'teachers', 'admin']) {
    const enabledCats = []
    const enabledDoms = []
    for (const group of FILTER_GROUPS) {
      if (!filterState.value[zone][group.key]) continue
      enabledCats.push(...(group.cfSecurity || []), ...(group.cfContent || []))
      enabledDoms.push(...(group.domains || []))
    }
    // Preserve any categories selected via the advanced panel that don't belong to basic groups
    const advancedOnly = (selectedCategories.value[zone] || []).filter(id => !allGroupCats.has(id))
    selectedCategories.value[zone] = [...new Set([...enabledCats, ...advancedOnly])]
    const allGroupDoms = FILTER_GROUPS.flatMap(g => g.domains || [])
    const manualDoms = customDomains.value[zone].filter(d => !allGroupDoms.includes(d))
    customDomains.value[zone] = [...new Set([...manualDoms, ...enabledDoms])]
    domainInputs.value[zone] = customDomains.value[zone].join('\n')
  }

  await applyZones()
}

// ── API ────────────────────────────────────────────────────────────────────
async function callApi(body) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cloudflare-api`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ ...body, org_id: selectedOrgId.value }),
    }
  )
  return await res.json()
}

// ── Load ───────────────────────────────────────────────────────────────────
async function loadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('cloudflare_configs')
    .select('zones_created,last_check_ok,available_categories,default_zone,zone_students_doh,zone_teachers_doh,zone_admin_doh,zone_students_ip,zone_teachers_ip,zone_admin_ip,zone_students_name,zone_teachers_name,zone_admin_name,categories_students,categories_teachers,categories_admin,custom_blocked_students,custom_blocked_teachers,custom_blocked_admin,whitelist_students,whitelist_teachers,whitelist_admin,zone_students_networks,zone_teachers_networks,zone_admin_networks')
    .eq('org_id', selectedOrgId.value)
    .single()
  if (!data) return
  cfg.value = data
  zoneNames.value = {
    students: data.zone_students_name || 'Alumnos',
    teachers: data.zone_teachers_name || 'Profesores',
    admin:    data.zone_admin_name    || 'Administración',
  }
  selectedCategories.value = {
    students: data.categories_students || [],
    teachers: data.categories_teachers || [],
    admin:    data.categories_admin    || [],
  }
  customDomains.value = {
    students: data.custom_blocked_students || [],
    teachers: data.custom_blocked_teachers || [],
    admin:    data.custom_blocked_admin    || [],
  }
  whitelists.value = {
    students: data.whitelist_students || [],
    teachers: data.whitelist_teachers || [],
    admin:    data.whitelist_admin    || [],
  }
  domainInputs.value = {
    students: (data.custom_blocked_students || []).join('\n'),
    teachers: (data.custom_blocked_teachers || []).join('\n'),
    admin:    (data.custom_blocked_admin    || []).join('\n'),
  }
  whitelistInputs.value = {
    students: (data.whitelist_students || []).join('\n'),
    teachers: (data.whitelist_teachers || []).join('\n'),
    admin:    (data.whitelist_admin    || []).join('\n'),
  }
  zoneNetworks.value = {
    students: data.zone_students_networks || [],
    teachers: data.zone_teachers_networks || [],
    admin:    data.zone_admin_networks    || [],
  }
  if (data.available_categories?.length) categories.value = data.available_categories
  initFilterState()
}

async function loadStats() {
  loadingStats.value = true
  try {
    const body = { action: 'get_stats', days: statsDays.value }
    if (statsZone.value) {
      const name = cfg.value[`zone_${statsZone.value}_name`] || zoneNames.value[statsZone.value]
      body.location_name = name
    }
    const r = await callApi(body)
    if (r.ok) stats.value = r
  } catch { /* ignore */ }
  finally { loadingStats.value = false }
}

// ── Actions ────────────────────────────────────────────────────────────────
function currentPayload() {
  zones.forEach(z => { parseDomains(z.key); parseWhitelist(z.key) })
  return {
    zone_students_name: zoneNames.value.students,
    zone_teachers_name: zoneNames.value.teachers,
    zone_admin_name:    zoneNames.value.admin,
    categories_students: selectedCategories.value.students,
    categories_teachers: selectedCategories.value.teachers,
    categories_admin:    selectedCategories.value.admin,
    custom_blocked_students: customDomains.value.students,
    custom_blocked_teachers: customDomains.value.teachers,
    custom_blocked_admin:    customDomains.value.admin,
    whitelist_students: whitelists.value.students,
    whitelist_teachers: whitelists.value.teachers,
    whitelist_admin:    whitelists.value.admin,
  }
}

async function applyZones() {
  applying.value = true
  result.value = null
  try {
    const r = await callApi({ action: 'apply_zones', ...currentPayload() })
    if (r.ok) {
      result.value = { ok: true, msg: 'Configuración aplicada en Cloudflare Gateway' }
      toast.success('Zonas actualizadas')
      await loadConfig()
    } else {
      result.value = { ok: false, msg: r.error || 'Error al aplicar' }
    }
  } catch (e) { result.value = { ok: false, msg: e.message } }
  finally { applying.value = false }
}

async function registerNetworks(key) {
  savingNetworks.value[key] = true
  try {
    const r = await callApi({ action: 'register_networks', zone: key, networks: zoneNetworks.value[key] })
    if (r.ok) toast.success('Redes guardadas')
    else toast.error(r.error || 'Error al guardar redes')
  } catch (e) { toast.error(e.message) }
  finally { savingNetworks.value[key] = false }
}

// ── Access helpers ─────────────────────────────────────────────────────────
function copyDoh(key) {
  const sub = cfg.value[`zone_${key}_doh`]
  if (sub) { navigator.clipboard.writeText(`https://${sub}.cloudflare-gateway.com/dns-query`); toast.success('URL copiada') }
}

function copyIp(key) {
  const ips = cfg.value[`zone_${key}_ip`]
  if (ips?.length) { navigator.clipboard.writeText(ips.join(', ')); toast.success('IP copiada') }
}

function dnsStamp(key) {
  const sub = cfg.value[`zone_${key}_doh`]
  if (!sub) return ''
  const hostname = `${sub}.cloudflare-gateway.com`
  const path = '/dns-query'
  const addr = '162.159.36.5'
  function lp(str) {
    const bytes = new TextEncoder().encode(str)
    const out = new Uint8Array(1 + bytes.length)
    out[0] = bytes.length; out.set(bytes, 1); return out
  }
  const parts = [new Uint8Array([0x02]), new Uint8Array(8), lp(addr), new Uint8Array([0x00]), lp(hostname), lp(path)]
  const len = parts.reduce((s, p) => s + p.length, 0)
  const buf = new Uint8Array(len)
  let off = 0; for (const p of parts) { buf.set(p, off); off += p.length }
  const b64 = btoa(String.fromCharCode(...buf)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return `sdns://${b64}`
}

function copyStamp(key) {
  const stamp = dnsStamp(key)
  if (stamp) { navigator.clipboard.writeText(stamp); toast.success('DNS stamp copiado') }
}

function downloadProfile(key, platform) {
  const sub = cfg.value[`zone_${key}_doh`]
  const name = zoneNames.value[key] || key
  if (!sub) return
  const dohUrl = `https://${sub}.cloudflare-gateway.com/dns-query`
  if (platform === 'macos') {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>DNSSettings</key>
            <dict>
                <key>DNSProtocol</key><string>HTTPS</string>
                <key>ServerAddresses</key>
                <array><string>162.159.36.5</string><string>162.159.36.20</string></array>
                <key>ServerURL</key><string>${dohUrl}</string>
            </dict>
            <key>PayloadDisplayName</key><string>PenwinSafe DNS - ${name}</string>
            <key>PayloadIdentifier</key><string>com.penwin.dns.${key}</string>
            <key>PayloadType</key><string>com.apple.dnsSettings.managed</string>
            <key>PayloadUUID</key><string>A1B2C3D4-E5F6-7890-ABCD-EF${key.padEnd(10,'0').slice(0,10)}</string>
            <key>PayloadVersion</key><integer>1</integer>
        </dict>
    </array>
    <key>PayloadDisplayName</key><string>PenwinSafe - DNS ${name}</string>
    <key>PayloadIdentifier</key><string>com.penwin.dns.${key}.profile</string>
    <key>PayloadRemovalDisallowed</key><false/>
    <key>PayloadType</key><string>Configuration</string>
    <key>PayloadUUID</key><string>B2C3D4E5-F6A7-8901-BCDE-EF${key.padEnd(10,'0').slice(0,10)}</string>
    <key>PayloadVersion</key><integer>1</integer>
</dict>
</plist>`
    const blob = new Blob([xml], { type: 'application/x-apple-aspen-config' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `PenwinSafe-${name}.mobileconfig`; a.click()
    URL.revokeObjectURL(url)
    toast.success(`Perfil ${name} descargado`)
  } else if (platform === 'windows') {
    navigator.clipboard.writeText(dohUrl)
    toast.success('URL DoH copiada — pégala en Configuración → Red → DNS de Windows 11')
  } else if (platform === 'android') {
    navigator.clipboard.writeText(`${sub}.cloudflare-gateway.com`)
    toast.success('Hostname copiado — pégalo en Ajustes → Red → DNS Privado de Android')
  }
}

// ── Traffic (UniFi DPI, optional) ─────────────────────────────────────────
const trafficData = ref(null)

function fmt(bytes) {
  if (!bytes) return '0 B'
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`
  if (bytes >= 1e9)  return `${(bytes / 1e9).toFixed(2)} GB`
  if (bytes >= 1e6)  return `${(bytes / 1e6).toFixed(0)} MB`
  if (bytes >= 1e3)  return `${(bytes / 1e3).toFixed(0)} KB`
  return `${bytes} B`
}

const maxApp = computed(() => Math.max(1, ...(trafficData.value?.apps || []).map(a => a.total_bytes)))
function pctApp(bytes) { return Math.round(bytes / maxApp.value * 100) }

const chartW = 600, chartH = 100
const chartPad = { l: 24, r: 4, t: 4, b: 16 }
const chartMaxVal = computed(() => {
  if (!trafficData.value?.chart?.length) return 0
  return Math.max(...trafficData.value.chart.map(p => Math.max(p.rx, p.tx)))
})
function chartPoints(field) {
  const pts = trafficData.value?.chart || []
  if (!pts.length) return []
  const maxV = chartMaxVal.value || 1
  const w = chartW - chartPad.l - chartPad.r
  const h = chartH - chartPad.t - chartPad.b
  return pts.map((p, i) => ({
    x: chartPad.l + (i / (pts.length - 1 || 1)) * w,
    y: chartPad.t + h - (p[field] / maxV) * h,
  }))
}
function linePath(field) {
  const pts = chartPoints(field)
  if (!pts.length) return ''
  return pts.reduce((d, p, i) => {
    if (i === 0) return `M${p.x},${p.y}`
    const prev = pts[i - 1]
    const cx = (prev.x + p.x) / 2
    return `${d} C${cx},${prev.y} ${cx},${p.y} ${p.x},${p.y}`
  }, '')
}
function areaPath(field) {
  const pts = chartPoints(field)
  if (!pts.length) return ''
  const bottom = chartH - chartPad.b
  return `${linePath(field)} L${pts[pts.length - 1].x},${bottom} L${pts[0].x},${bottom} Z`
}
const chartXLabels = computed(() => {
  const pts = trafficData.value?.chart || []
  if (!pts.length) return []
  const idxs = [0, Math.floor(pts.length / 4), Math.floor(pts.length / 2), Math.floor(pts.length * 3 / 4), pts.length - 1]
  return idxs.map(i => { const t = pts[i]?.time; if (!t) return ''; const d = new Date(t * 1000); return `${d.getHours()}:00` })
})

async function loadTraffic() {
  if (!selectedOrgId.value) return
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'get_traffic', org_id: selectedOrgId.value }),
    })
    const r = await res.json()
    if (r.ok) trafficData.value = r
  } catch { /* UniFi not configured, silently skip */ }
}

// ── Domain search ──────────────────────────────────────────────────────────
const domainSearch = ref('')

// ── UniFi network–zone assignment ──────────────────────────────────────────
const unifiNets       = ref([])
const unifiZoneMap    = ref({})
const loadingUnifiNets = ref(false)
const savingUnifiNets  = ref(false)

function netsForZone(zone) {
  return unifiNets.value.filter(n => unifiZoneMap.value[n.id] === zone)
}
const availableNets = computed(() => unifiNets.value.filter(n => !unifiZoneMap.value[n.id]))

function assignNet(netId) {
  unifiZoneMap.value = { ...unifiZoneMap.value, [netId]: activeZoneAccess.value }
}
function unassignNet(netId) {
  const m = { ...unifiZoneMap.value }
  delete m[netId]
  unifiZoneMap.value = m
}
function toggleNetZone(netId) {
  if (unifiZoneMap.value[netId] && unifiZoneMap.value[netId] !== activeZoneAccess.value) return // assigned to other zone, don't hijack
  if (unifiZoneMap.value[netId] === activeZoneAccess.value) unassignNet(netId)
  else assignNet(netId)
}

async function loadUnifiNets() {
  if (!selectedOrgId.value) return
  loadingUnifiNets.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'get_networks', org_id: selectedOrgId.value }),
    })
    const r = await res.json()
    if (r.ok) { unifiNets.value = r.networks; unifiZoneMap.value = r.zone_map || {} }
  } catch { /* UniFi not configured */ }
  finally { loadingUnifiNets.value = false }
}

async function applyNetworkDns() {
  savingUnifiNets.value = true
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
      body: JSON.stringify({ action: 'apply_network_dns', org_id: selectedOrgId.value, zone_map: unifiZoneMap.value }),
    })
    const r = await res.json()
    if (r.ok) toast.success('DNS aplicado en las redes')
    else toast.error(r.errors?.[0] || r.error || 'Error al aplicar DNS')
  } catch (e) { toast.error(e.message) }
  finally { savingUnifiNets.value = false }
}

onMounted(async () => { await loadConfig(); loadStats(); loadTraffic(); loadUnifiNets() })
watch(orgSwitchKey, async () => { if (selectedOrgId.value) { await loadConfig(); loadStats(); loadTraffic(); loadUnifiNets() } })
</script>
