<template>
  <div class="space-y-6">

    <!-- Header -->
    <div>
      <h1 class="text-[18px] font-semibold" style="color:#111827">SuperConfig</h1>
      <p class="text-[13px] mt-1" style="color:#6b7280">
        Configuración avanzada para <strong>{{ currentOrgName }}</strong>
      </p>
    </div>

    <!-- New school form -->
    <div v-if="showNewOrg" class="card p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#faf5ff">
          <PlusCircleIcon class="w-4 h-4" style="color:#7c3aed" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Crear nuevo colegio</h2>
          <p class="text-[12px]" style="color:#6b7280">Añade un nuevo centro educativo a PenwinSafe</p>
        </div>
        <button @click="showNewOrg = false" class="text-[11px] px-2 py-1 rounded transition-colors"
          style="color:#9ca3af"
          @mouseenter="e => e.currentTarget.style.color='#374151'"
          @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
          Cancelar
        </button>
      </div>
      <div class="space-y-4">
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Nombre del colegio</label>
          <input v-model="newOrgForm.name" @input="onOrgNameInput" type="text" placeholder="IES Ejemplo"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#7c3aed'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>
        <div>
          <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Slug (identificador único)</label>
          <input v-model="newOrgForm.slug" type="text" placeholder="ies-ejemplo"
            class="w-full px-3 py-2 rounded-lg text-[13px] outline-none font-mono transition-all"
            style="border:1px solid #d1d5db;color:#111827"
            @focus="e => e.target.style.borderColor='#7c3aed'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
          <p class="text-[11px] mt-1" style="color:#9ca3af">Solo letras minúsculas, números y guiones</p>
        </div>
        <div class="flex gap-3 pt-1">
          <button @click="createOrg" :disabled="creatingOrg"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-opacity"
            style="background:#7c3aed"
            :style="creatingOrg ? 'opacity:0.6' : ''">
            <ArrowPathIcon v-if="creatingOrg" class="w-3.5 h-3.5 animate-spin" />
            <PlusCircleIcon v-else class="w-3.5 h-3.5" />
            {{ creatingOrg ? 'Creando...' : 'Crear colegio' }}
          </button>
        </div>
        <p v-if="newOrgMsg" class="text-[12px]" :style="newOrgOk ? 'color:#16a34a' : 'color:#dc2626'">
          {{ newOrgMsg }}
        </p>
      </div>
    </div>

    <!-- New school toggle (when form hidden) -->
    <div v-else class="flex justify-end">
      <button @click="showNewOrg = true"
        class="flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg transition-colors"
        style="color:#7c3aed;border:1px solid #e9d5ff;background:#faf5ff"
        @mouseenter="e => e.currentTarget.style.background='#f3e8ff'"
        @mouseleave="e => e.currentTarget.style.background='#faf5ff'">
        <PlusCircleIcon class="w-3.5 h-3.5" />
        Crear nuevo colegio
      </button>
    </div>

    <!-- UniFi Connection wizard -->
    <div class="card overflow-hidden">

      <!-- Header -->
      <div class="flex items-center gap-3 px-6 py-4" style="border-bottom:1px solid #f3f4f6">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#eff6ff">
          <WifiIcon class="w-4 h-4" style="color:#006fff" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Controlador UniFi</h2>
          <p class="text-[12px]" style="color:#6b7280">Vincula el UXG Pro de este colegio</p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="config.last_check_ok === true"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Conectado
          </span>
          <span v-else-if="config.last_check_ok === false"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
            Error de conexión
          </span>
          <button v-if="config.last_check_ok === true" @click="wStep = 1; wDone = false"
            class="text-[11px] px-2 py-1 rounded transition-colors"
            style="color:#6b7280;border:1px solid #e5e7eb"
            @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
            @mouseleave="e => e.currentTarget.style.background='transparent'">
            Reconfigurar
          </button>
        </div>
      </div>

      <!-- Connected summary -->
      <div v-if="config.last_check_ok === true && !wDone && wStep === 0" class="px-6 py-4 space-y-3">
        <div class="flex items-center gap-3 p-3 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
          <CheckCircleIcon class="w-4 h-4 flex-shrink-0" style="color:#16a34a" />
          <div class="flex-1">
            <p class="text-[12px] font-medium" style="color:#15803d">Controlador conectado</p>
            <p class="text-[11px] mt-0.5" style="color:#16a34a">{{ config.controller_url }} · Site: {{ config.site_id }}</p>
          </div>
          <div v-if="unifiStatus" class="flex items-center gap-1.5">
            <span class="text-[10px] font-medium px-2 py-0.5 rounded"
              :style="unifiStatus.is_uxg
                ? 'background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe'
                : 'background:#fff7ed;color:#c2410c;border:1px solid #fed7aa'">
              {{ unifiStatus.is_uxg ? 'UXG / UDM ✓' : 'USG (limitado)' }}
            </span>
          </div>
        </div>

        <!-- DNS Zone configuration (only if UXG detected and CF zones exist) -->
        <div v-if="config.last_check_ok" class="rounded-lg p-3" style="background:#f8fafc;border:1px solid #e2e8f0">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-[12px] font-medium" style="color:#374151">Filtrado DNS por zonas</p>
              <p class="text-[11px] mt-0.5" style="color:#6b7280">
                <span v-if="config.dns_zones_configured" style="color:#16a34a">✓ VLANs y DoH configurados en el router</span>
                <span v-else>Crea las VLANs y configura DoH automáticamente en el UXG</span>
              </p>
            </div>
            <button @click="configureDnsZones" :disabled="configuringDns"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-white transition-all flex-shrink-0"
              :style="configuringDns ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              <ArrowPathIcon v-if="configuringDns" class="w-3 h-3 animate-spin" />
              <ServerIcon v-else class="w-3 h-3" />
              {{ configuringDns ? 'Configurando...' : config.dns_zones_configured ? 'Reconfigurar' : 'Configurar ahora' }}
            </button>
          </div>

          <!-- Result of DNS zone configuration -->
          <div v-if="dnsZoneResult" class="mt-3 space-y-1">
            <p v-for="c in dnsZoneResult.checks" :key="c" class="text-[11px] flex items-center gap-1.5" style="color:#16a34a">
              <span>✓</span> {{ c }}
            </p>
            <p v-for="e in dnsZoneResult.errors" :key="e" class="text-[11px] flex items-center gap-1.5" style="color:#dc2626">
              <span>✗</span> {{ e }}
            </p>
          </div>

          <!-- DNS probe (diagnóstico) -->
          <div class="mt-3 pt-3" style="border-top:1px solid #e2e8f0">
            <p class="text-[11px] font-medium mb-2" style="color:#6b7280">Diagnóstico DNS por VLAN</p>
            <div class="flex gap-2 flex-wrap">
              <button v-for="vlan in ['Aulas', 'Clases', 'Usuarios Profesores', '']" :key="vlan"
                @click="probeVlanDns(vlan)"
                :disabled="probingVlan"
                class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                style="background:#f1f5f9;color:#475569;border:1px solid #e2e8f0"
                @mouseenter="e => e.currentTarget.style.background='#e2e8f0'"
                @mouseleave="e => e.currentTarget.style.background='#f1f5f9'">
                {{ probingVlan ? '...' : (vlan || 'Ver todo') }}
              </button>
              <button @click="probeFirewall"
                :disabled="probingVlan"
                class="px-2.5 py-1 rounded text-[11px] font-medium transition-colors"
                style="background:#fef3c7;color:#92400e;border:1px solid #fde68a"
                @mouseenter="e => e.currentTarget.style.background='#fde68a'"
                @mouseleave="e => e.currentTarget.style.background='#fef3c7'">
                {{ probingVlan ? '...' : 'Firewall DNS' }}
              </button>
            </div>
            <pre v-if="probeResult" class="mt-2 text-[10px] rounded p-2 overflow-auto max-h-48"
              style="background:#0f172a;color:#94a3b8;white-space:pre-wrap;word-break:break-all">{{ JSON.stringify(probeResult, null, 2) }}</pre>
          </div>
        </div>
      </div>

      <!-- Wizard steps -->
      <div v-else class="px-6 py-5">

        <!-- Step indicators -->
        <div class="flex items-center gap-2 mb-6">
          <div v-for="(s, i) in wSteps" :key="i" class="flex items-center gap-2">
            <div class="flex items-center gap-1.5">
              <div class="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-all"
                :style="wStep > i
                  ? 'background:#006fff;color:#fff'
                  : wStep === i
                    ? 'background:#006fff;color:#fff'
                    : 'background:#f3f4f6;color:#9ca3af'">
                <CheckCircleIcon v-if="wStep > i" class="w-3 h-3" />
                <span v-else>{{ i + 1 }}</span>
              </div>
              <span class="text-[11px] font-medium"
                :style="wStep === i ? 'color:#006fff' : wStep > i ? 'color:#374151' : 'color:#9ca3af'">
                {{ s }}
              </span>
            </div>
            <div v-if="i < wSteps.length - 1" class="flex-1 h-px w-6"
              :style="wStep > i ? 'background:#006fff' : 'background:#e5e7eb'"></div>
          </div>
        </div>

        <!-- Step 1: Controller URL -->
        <div v-if="wStep === 1" class="space-y-4">
          <div>
            <label class="block text-[12px] font-medium mb-1" style="color:#374151">URL del controlador UniFi</label>
            <p class="text-[11px] mb-2" style="color:#9ca3af">La dirección donde accedes al panel de UniFi. Incluye el puerto si es necesario.</p>
            <input v-model="form.controller_url" type="text" placeholder="https://192.168.1.1"
              class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
              style="border:1px solid #d1d5db;color:#111827"
              @focus="e => e.target.style.borderColor='#006fff'"
              @blur="e => e.target.style.borderColor='#d1d5db'"
              @keydown.enter="wStep1Next" />
          </div>
          <div class="flex justify-end">
            <button @click="wStep1Next" :disabled="!form.controller_url.trim()"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="!form.controller_url.trim() ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              Continuar
              <ArrowRightIcon class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Step 2: Credentials -->
        <div v-if="wStep === 2" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Usuario</label>
              <input v-model="form.username" type="text" placeholder="admin"
                class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#006fff'"
                @blur="e => e.target.style.borderColor='#d1d5db'" />
            </div>
            <div>
              <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Contraseña</label>
              <input v-model="form.password" type="password" placeholder="••••••••"
                class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#006fff'"
                @blur="e => e.target.style.borderColor='#d1d5db'"
                @keydown.enter="fetchSites" />
            </div>
          </div>
          <div class="flex items-center justify-between pt-1">
            <button @click="wStep = 1" class="text-[12px]" style="color:#6b7280">← Volver</button>
            <button @click="fetchSites" :disabled="fetchingSites || !form.username || !form.password"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="(fetchingSites || !form.username || !form.password) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              <ArrowPathIcon v-if="fetchingSites" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ fetchingSites ? 'Conectando...' : 'Conectar' }}</span>
            </button>
          </div>
          <p v-if="fetchSitesError" class="text-[12px]" style="color:#dc2626">{{ fetchSitesError }}</p>
        </div>

        <!-- Step 3: Select site -->
        <div v-if="wStep === 3" class="space-y-4">
          <div>
            <label class="block text-[12px] font-medium mb-1.5" style="color:#374151">Selecciona el site</label>
            <p class="text-[11px] mb-2" style="color:#9ca3af">Estos son los sites disponibles en tu controlador.</p>
            <select v-model="form.site_id"
              class="w-full px-3 py-2 rounded-lg text-[13px] outline-none transition-all"
              style="border:1px solid #d1d5db;color:#111827;background:#fff"
              @focus="e => e.target.style.borderColor='#006fff'"
              @blur="e => e.target.style.borderColor='#d1d5db'">
              <option v-for="s in availableSites" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
          </div>
          <div class="flex items-center justify-between pt-1">
            <button @click="wStep = 2" class="text-[12px]" style="color:#6b7280">← Volver</button>
            <button @click="testAndSave" :disabled="savingConfig || !form.site_id"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="(savingConfig || !form.site_id) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
              <ArrowPathIcon v-if="savingConfig" class="w-3.5 h-3.5 animate-spin" />
              <span>{{ savingConfig ? 'Verificando...' : 'Confirmar site' }}</span>
            </button>
          </div>
        </div>

        <!-- Step 4: Result -->
        <div v-if="wStep === 4" class="space-y-4">
          <div v-if="saveOk" class="flex items-start gap-3 p-4 rounded-lg" style="background:#f0fdf4;border:1px solid #bbf7d0">
            <CheckCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#16a34a" />
            <div>
              <p class="text-[13px] font-medium" style="color:#15803d">Conexión establecida</p>
              <p class="text-[12px] mt-0.5" style="color:#16a34a">{{ saveMsg }}</p>
            </div>
          </div>
          <div v-else class="flex items-start gap-3 p-4 rounded-lg" style="background:#fef2f2;border:1px solid #fecaca">
            <ExclamationCircleIcon class="w-5 h-5 flex-shrink-0 mt-0.5" style="color:#dc2626" />
            <div>
              <p class="text-[13px] font-medium" style="color:#991b1b">No se pudo conectar</p>
              <p class="text-[12px] mt-0.5" style="color:#dc2626">{{ saveMsg }}</p>
            </div>
          </div>
          <div class="flex justify-end">
            <button v-if="!saveOk" @click="wStep = 1"
              class="text-[12px] px-3 py-1.5 rounded-lg transition-colors"
              style="border:1px solid #e5e7eb;color:#374151"
              @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
              @mouseleave="e => e.currentTarget.style.background='transparent'">
              Reintentar
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- DNS Enforcement (zone-based firewall) -->
    <div v-if="config.last_check_ok" class="card overflow-hidden">
      <div class="flex items-center gap-3 px-6 py-4" style="border-bottom:1px solid #f3f4f6">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#fef3c7">
          <ShieldCheckIcon class="w-4 h-4" style="color:#d97706" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">Refuerzo DNS (Firewall)</h2>
          <p class="text-[12px]" style="color:#6b7280">Obliga a que todo el DNS pase por el servidor filtrado. Compatible con UXG / UDM.</p>
        </div>
      </div>

      <div class="px-6 py-5 space-y-4">
        <div>
          <label class="block text-[12px] font-medium mb-1" style="color:#374151">IP del servidor DNS filtrado</label>
          <p class="text-[11px] mb-1.5" style="color:#9ca3af">Ej: 192.168.1.215 (Windows Server con CleanBrowsing) o IP de Cloudflare Gateway</p>
          <input v-model="dnsEnfIp" type="text" placeholder="192.168.x.x"
            class="w-full px-3 py-2 rounded-lg text-[13px] font-mono outline-none transition-all"
            style="border:1px solid #d1d5db;color:#111827;max-width:260px"
            @focus="e => e.target.style.borderColor='#d97706'"
            @blur="e => e.target.style.borderColor='#d1d5db'" />
        </div>

        <div class="rounded-lg p-3 text-[11px]" style="background:#fef9ec;border:1px solid #fde68a;color:#92400e">
          <p class="font-medium mb-1">Se creará automáticamente:</p>
          <ul class="space-y-0.5 pl-2">
            <li>• Grupo "DNS_Permitido" con la IP del servidor filtrado</li>
            <li>• Grupo "DoH_Providers" ({{ dohIpCount }} IPs de proveedores DoH conocidos)</li>
            <li>• Reglas ALLOW: puerto 53 desde todas las zonas → servidor filtrado</li>
            <li>• Reglas BLOCK: bloquea puerto 53 desde cada VLAN hacia cualquier otro destino (LAN + WAN)</li>
            <li>• Reglas BLOCK: bloquea DNS-over-HTTPS (puerto 443 TCP) hacia proveedores DoH</li>
          </ul>
        </div>

        <div class="flex gap-3">
          <button @click="setupDnsEnforcement"
            :disabled="!dnsEnfIp.trim() || enforcingDns"
            class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
            :style="(!dnsEnfIp.trim() || enforcingDns) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#d97706'">
            <ArrowPathIcon v-if="enforcingDns" class="w-3.5 h-3.5 animate-spin" />
            <ShieldCheckIcon v-else class="w-3.5 h-3.5" />
            {{ enforcingDns ? 'Configurando...' : 'Aplicar reglas DNS' }}
          </button>
        </div>

        <div v-if="dnsEnfResult" class="rounded-lg p-3 space-y-0.5"
          :style="dnsEnfResult.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
          <p v-for="c in dnsEnfResult.checks" :key="c" class="text-[11px] flex items-center gap-1.5" style="color:#16a34a">
            <span>✓</span> {{ c }}
          </p>
          <p v-for="e in dnsEnfResult.errors" :key="e" class="text-[11px] flex items-center gap-1.5" style="color:#dc2626">
            <span>✗</span> {{ e }}
          </p>
          <p v-if="dnsEnfResult.vlans_configured !== undefined" class="text-[11px] pt-1" style="color:#6b7280;border-top:1px solid #e5e7eb;margin-top:4px">
            {{ dnsEnfResult.vlans_configured }} VLANs: {{ (dnsEnfResult.vlans || []).join(', ') }}
          </p>
        </div>
      </div>
    </div>

    <!-- PenwinSafe Network -->
    <div class="card p-6">
      <div class="flex items-center gap-3 mb-5">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center"
          :style="config.network_active ? 'background:#f0fdf4' : 'background:#f9fafb'">
          <ShieldCheckIcon class="w-4 h-4" :style="config.network_active ? 'color:#16a34a' : 'color:#9ca3af'" />
        </div>
        <div>
          <h2 class="text-[14px] font-semibold" style="color:#111827">Red PenwinSafe</h2>
          <p class="text-[12px]" style="color:#6b7280">VLAN + SSID + WireGuard + firewall</p>
        </div>
        <div class="ml-auto">
          <span v-if="config.network_active"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">
            Activa
          </span>
          <span v-else
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">
            Inactiva
          </span>
        </div>
      </div>

      <!-- What will be created -->
      <div v-if="!config.network_active" class="mb-5 space-y-2">
        <p class="text-[12px] font-medium mb-2" style="color:#374151">Se creará automáticamente:</p>
        <div v-for="item in setupItems" :key="item.label"
          class="flex items-start gap-2.5 text-[12px]" style="color:#6b7280">
          <div class="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style="background:#006fff"></div>
          <span>{{ item.label }}</span>
        </div>
      </div>

      <!-- Active info -->
      <div v-else class="mb-5 grid grid-cols-2 gap-3">
        <div class="rounded-lg p-3" style="background:#f9fafb;border:1px solid #e5e7eb">
          <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#9ca3af">VLAN ID</p>
          <p class="text-[12px] font-mono font-medium" style="color:#111827">{{ config.vlan_network_id || '—' }}</p>
        </div>
        <div class="rounded-lg p-3" style="background:#f9fafb;border:1px solid #e5e7eb">
          <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#9ca3af">SSID</p>
          <p class="text-[12px] font-mono font-medium" style="color:#111827">PenwinSafe</p>
        </div>
      </div>

      <!-- Setup result -->
      <div v-if="setupResult" class="mb-4 rounded-lg p-3"
        :style="setupResult.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
        <div v-for="(msg, i) in setupResult.checks" :key="i"
          class="flex items-center gap-2 text-[12px] mb-1" style="color:#16a34a">
          <CheckCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
          {{ msg }}
        </div>
        <div v-for="(err, i) in setupResult.errors" :key="'e'+i"
          class="flex items-center gap-2 text-[12px] mb-1" style="color:#dc2626">
          <ExclamationCircleIcon class="w-3.5 h-3.5 flex-shrink-0" />
          {{ err }}
        </div>
      </div>

      <div class="flex gap-3">
        <button v-if="!config.network_active" @click="activateNetwork"
          :disabled="!config.last_check_ok || activating"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
          :style="(!config.last_check_ok || activating) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#006fff'">
          <ArrowPathIcon v-if="activating" class="w-3.5 h-3.5 animate-spin" />
          <WifiIcon v-else class="w-3.5 h-3.5" />
          {{ activating ? 'Configurando...' : 'Activar red PenwinSafe' }}
        </button>
        <button v-else @click="activateNetwork"
          :disabled="activating"
          class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium transition-all"
          style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151">
          <ArrowPathIcon class="w-3.5 h-3.5" :class="activating ? 'animate-spin' : ''" />
          Reconfigurar
        </button>
      </div>
      <p v-if="!config.last_check_ok && !config.network_active" class="text-[11px] mt-2" style="color:#9ca3af">
        Guarda y verifica la conexión UniFi primero
      </p>
    </div>

    <!-- Cloudflare DNS Gateway -->
    <div class="card overflow-hidden">

      <div class="flex items-center gap-3 px-6 py-4" style="border-bottom:1px solid #f3f4f6">
        <div class="w-8 h-8 rounded-lg flex items-center justify-center" style="background:#fff7ed">
          <CloudIcon class="w-4 h-4" style="color:#f97316" />
        </div>
        <div class="flex-1">
          <h2 class="text-[14px] font-semibold" style="color:#111827">DNS Escolar (Cloudflare Gateway)</h2>
          <p class="text-[12px]" style="color:#6b7280">Tres zonas de filtrado DNS para el centro</p>
        </div>
        <div class="flex items-center gap-2">
          <span v-if="cfCfg.zones_created"
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f0fdf4;color:#16a34a;border:1px solid #bbf7d0">Activo</span>
          <span v-else
            class="text-[11px] font-medium px-2 py-1 rounded"
            style="background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb">Sin configurar</span>
          <button @click="cfOpen = !cfOpen"
            class="text-[11px] px-2 py-1 rounded transition-colors"
            style="color:#6b7280;border:1px solid #e5e7eb"
            @mouseenter="e => e.currentTarget.style.background='#f9fafb'"
            @mouseleave="e => e.currentTarget.style.background='transparent'">
            {{ cfOpen ? 'Cerrar' : 'Configurar' }}
          </button>
        </div>
      </div>

      <div v-if="cfOpen" class="px-6 py-5 space-y-5">

        <!-- Tab nav -->
        <div class="flex gap-1 border-b" style="border-color:#f3f4f6">
          <button v-for="t in ['Configuración','Estadísticas']" :key="t"
            @click="cfTab = t"
            class="px-3 py-1.5 text-[12px] font-medium transition-all -mb-px"
            :style="cfTab === t
              ? 'color:#f97316;border-bottom:2px solid #f97316'
              : 'color:#9ca3af;border-bottom:2px solid transparent'">
            {{ t }}
          </button>
        </div>

        <!-- Stats tab -->
        <div v-if="cfTab === 'Estadísticas'" class="space-y-4">
          <div class="flex items-center gap-3">
            <div class="flex gap-1 p-0.5 rounded-lg" style="background:#f3f4f6">
              <button v-for="d in [1,7,30]" :key="d"
                @click="cfStatsDays = d; cfLoadStats()"
                class="px-2.5 py-1 rounded-md text-[11px] font-medium transition-all"
                :style="cfStatsDays === d ? 'background:#fff;color:#f97316;box-shadow:0 1px 2px rgba(0,0,0,.08)' : 'color:#6b7280'">
                {{ d === 1 ? 'Hoy' : d === 7 ? '7 días' : '30 días' }}
              </button>
            </div>
            <button @click="cfLoadStats" :disabled="cfLoadingStats"
              class="flex items-center gap-1 text-[11px] px-2 py-1 rounded transition-colors"
              style="color:#9ca3af"
              @mouseenter="e => e.currentTarget.style.color='#374151'"
              @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
              <ArrowPathIcon class="w-3 h-3" :class="cfLoadingStats ? 'animate-spin' : ''" />
              Actualizar
            </button>
          </div>

          <!-- Loading -->
          <div v-if="cfLoadingStats" class="flex items-center gap-2 py-8 justify-center" style="color:#9ca3af">
            <ArrowPathIcon class="w-4 h-4 animate-spin" />
            <span class="text-[12px]">Cargando estadísticas...</span>
          </div>

          <!-- No data -->
          <div v-else-if="!cfStats && !cfCfg.zones_created" class="py-6 text-center text-[12px]" style="color:#9ca3af">
            Crea las zonas DNS primero para ver estadísticas
          </div>

          <!-- Stats -->
          <div v-else-if="cfStats" class="space-y-4">

            <!-- Summary cards -->
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-xl p-4" style="background:#f0fdf4;border:1px solid #bbf7d0">
                <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#16a34a">Permitidas</p>
                <p class="text-[22px] font-bold" style="color:#15803d">{{ cfStats.total_allowed.toLocaleString() }}</p>
                <p class="text-[10px] mt-0.5" style="color:#16a34a">últimos {{ cfStats.days }} días</p>
              </div>
              <div class="rounded-xl p-4" style="background:#fef2f2;border:1px solid #fecaca">
                <p class="text-[10px] uppercase tracking-wide mb-1" style="color:#dc2626">Bloqueadas</p>
                <p class="text-[22px] font-bold" style="color:#991b1b">{{ cfStats.total_blocked.toLocaleString() }}</p>
                <p class="text-[10px] mt-0.5" style="color:#dc2626">
                  {{ cfStats.total_allowed + cfStats.total_blocked > 0
                    ? Math.round(cfStats.total_blocked / (cfStats.total_allowed + cfStats.total_blocked) * 100)
                    : 0 }}% del total
                </p>
              </div>
            </div>

            <!-- By location -->
            <div v-if="Object.keys(cfStats.by_location).length" class="rounded-xl p-4 space-y-2" style="background:#f9fafb;border:1px solid #e5e7eb">
              <p class="text-[11px] font-semibold mb-2" style="color:#374151">Por zona</p>
              <div v-for="(v, loc) in cfStats.by_location" :key="loc" class="space-y-1">
                <div class="flex items-center justify-between text-[11px]">
                  <span style="color:#374151">{{ loc }}</span>
                  <span style="color:#6b7280">
                    <span style="color:#16a34a">{{ v.allowed.toLocaleString() }}</span>
                    <span class="mx-1">·</span>
                    <span style="color:#dc2626">{{ v.blocked.toLocaleString() }} bloq</span>
                  </span>
                </div>
                <div class="h-1.5 rounded-full overflow-hidden" style="background:#e5e7eb">
                  <div class="h-full rounded-full" style="background:#dc2626;transition:width .3s"
                    :style="`width:${v.allowed + v.blocked > 0 ? Math.round(v.blocked / (v.allowed + v.blocked) * 100) : 0}%`">
                  </div>
                </div>
              </div>
            </div>

            <!-- Top blocked -->
            <div v-if="cfStats.top_blocked.length" class="rounded-xl overflow-hidden" style="border:1px solid #e5e7eb">
              <div class="px-4 py-2.5 flex items-center justify-between" style="background:#fef2f2;border-bottom:1px solid #fecaca">
                <p class="text-[11px] font-semibold" style="color:#991b1b">Dominios más bloqueados</p>
                <span class="text-[10px]" style="color:#dc2626">{{ cfStats.top_blocked.length }} únicos</span>
              </div>
              <div class="divide-y" style="divide-color:#f3f4f6">
                <div v-for="item in cfStats.top_blocked" :key="item.name"
                  class="flex items-center justify-between px-4 py-2 text-[11px]">
                  <span class="font-mono truncate" style="color:#374151;max-width:70%">{{ item.name }}</span>
                  <span class="font-medium flex-shrink-0 ml-2 px-1.5 py-0.5 rounded text-[10px]"
                    style="background:#fef2f2;color:#dc2626">
                    {{ item.count.toLocaleString() }}×
                  </span>
                </div>
              </div>
            </div>

            <p v-if="!cfStats.top_blocked.length && !cfStats.total_blocked" class="text-[12px] text-center py-4" style="color:#9ca3af">
              Sin bloqueos en este período — todo el tráfico permitido ✓
            </p>
          </div>
        </div>

        <!-- Credentials (only shown in config tab) -->
        <div v-if="cfTab === 'Configuración'" class="space-y-3">
          <p class="text-[12px] font-medium" style="color:#374151">Credenciales Cloudflare</p>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium mb-1" style="color:#6b7280">Account ID</label>
              <input v-model="cfForm.account_id" type="text" placeholder="a1b2c3d4..."
                class="w-full px-2.5 py-1.5 rounded-lg text-[12px] font-mono outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#f97316'"
                @blur="e => e.target.style.borderColor='#d1d5db'" />
            </div>
            <div>
              <label class="block text-[11px] font-medium mb-1" style="color:#6b7280">API Token <span style="color:#9ca3af">(Gateway:Edit)</span></label>
              <input v-model="cfForm.api_token" type="password" placeholder="••••••••••••••"
                class="w-full px-2.5 py-1.5 rounded-lg text-[12px] outline-none transition-all"
                style="border:1px solid #d1d5db;color:#111827"
                @focus="e => e.target.style.borderColor='#f97316'"
                @blur="e => e.target.style.borderColor='#d1d5db'" />
            </div>
          </div>
          <div class="flex items-center gap-3">
            <button @click="cfVerify" :disabled="cfVerifying || !cfForm.account_id || !cfForm.api_token"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-all"
              :style="(cfVerifying || !cfForm.account_id || !cfForm.api_token) ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
              <ArrowPathIcon class="w-3 h-3" :class="cfVerifying ? 'animate-spin' : ''" />
              {{ cfVerifying ? 'Verificando...' : cfCfg.last_check_ok ? 'Reverificar' : 'Verificar cuenta' }}
            </button>
            <button v-if="cfCfg.last_check_ok && !cfCategories.length" @click="cfLoadCats" :disabled="cfLoadingCats"
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-white transition-all"
              :style="cfLoadingCats ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
              <ArrowPathIcon class="w-3 h-3" :class="cfLoadingCats ? 'animate-spin' : ''" />
              {{ cfLoadingCats ? 'Cargando...' : 'Cargar categorías' }}
            </button>
            <span v-if="cfCfg.last_check_ok" class="text-[11px]" style="color:#16a34a">✓ Cuenta verificada</span>
            <span v-if="cfCredError" class="text-[11px]" style="color:#dc2626">{{ cfCredError }}</span>
          </div>
        </div>

        <!-- Zone config (only when categories loaded) -->
        <div v-if="cfCategories.length && cfTab === 'Configuración'" class="space-y-4">
          <p class="text-[12px] font-medium" style="color:#374151">
            Configuración de zonas
            <span class="ml-2 text-[11px] font-normal" style="color:#9ca3af">{{ cfCategories.length }} categorías disponibles</span>
          </p>

          <div v-for="zone in cfZones" :key="zone.key" class="rounded-xl overflow-hidden" :style="`border:1px solid ${zone.border}`">
            <!-- Zone header -->
            <div class="flex items-center gap-2.5 px-4 py-3" :style="`background:${zone.bg}`">
              <component :is="zone.icon" class="w-4 h-4 flex-shrink-0" :style="`color:${zone.color}`" />
              <input v-model="cfZoneNames[zone.key]" type="text"
                class="flex-1 bg-transparent text-[13px] font-semibold outline-none"
                :style="`color:${zone.color}`" />
              <span class="text-[10px]" :style="`color:${zone.color}`">
                {{ cfSelCats[zone.key].length }} cats · {{ cfDomains[zone.key].filter(Boolean).length }} dominios
              </span>
              <button @click="cfActiveZone = cfActiveZone === zone.key ? null : zone.key"
                class="text-[10px] px-2 py-0.5 rounded transition-colors"
                :style="`color:${zone.color};border:1px solid ${zone.border}`"
                @mouseenter="e => e.currentTarget.style.opacity='0.7'"
                @mouseleave="e => e.currentTarget.style.opacity='1'">
                {{ cfActiveZone === zone.key ? 'Cerrar' : 'Editar' }}
              </button>
            </div>

            <!-- Zone editor -->
            <div v-if="cfActiveZone === zone.key" class="px-4 py-4 space-y-4" style="background:#fff">
              <!-- Tab nav -->
              <div class="flex gap-1">
                <button v-for="tab in ['Seguridad', 'Contenido', 'Dominios']" :key="tab"
                  @click="cfZoneTab[zone.key] = tab"
                  class="px-3 py-1.5 text-[11px] font-medium rounded-lg transition-all"
                  :style="cfZoneTab[zone.key] === tab ? `background:${zone.color};color:#fff` : 'background:#f3f4f6;color:#6b7280'">
                  {{ tab }}
                  <span v-if="tab !== 'Dominios'" class="ml-1 text-[10px] font-bold opacity-75">
                    {{ cfSelCats[zone.key].filter(id => cfGroupCats(tab === 'Seguridad' ? 'security' : 'content').map(c=>c.id).includes(id)).length }}/{{ cfGroupCats(tab === 'Seguridad' ? 'security' : 'content').length }}
                  </span>
                </button>
                <div class="flex-1"></div>
                <button @click="cfSelectAll(zone.key, cfZoneTab[zone.key])"
                  class="text-[10px] px-2 py-1 rounded" style="color:#9ca3af"
                  @mouseenter="e => e.currentTarget.style.color='#374151'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
                  Todo
                </button>
                <button @click="cfClearAll(zone.key, cfZoneTab[zone.key])"
                  class="text-[10px] px-2 py-1 rounded" style="color:#9ca3af"
                  @mouseenter="e => e.currentTarget.style.color='#374151'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
                  Ninguno
                </button>
              </div>

              <!-- Categories grid -->
              <div v-if="cfZoneTab[zone.key] !== 'Dominios'" class="grid grid-cols-3 gap-1.5">
                <label v-for="cat in cfGroupCats(cfZoneTab[zone.key] === 'Seguridad' ? 'security' : 'content')" :key="cat.id"
                  class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all text-[11px]"
                  :style="cfSelCats[zone.key].includes(cat.id)
                    ? `background:${zone.color}14;border:1px solid ${zone.color}44;color:#111827`
                    : 'background:#f9fafb;border:1px solid transparent;color:#6b7280'"
                  @mouseenter="e => { if(!cfSelCats[zone.key].includes(cat.id)) e.currentTarget.style.background='#f3f4f6' }"
                  @mouseleave="e => { if(!cfSelCats[zone.key].includes(cat.id)) e.currentTarget.style.background='#f9fafb' }">
                  <input type="checkbox" :checked="cfSelCats[zone.key].includes(cat.id)"
                    @change="cfToggleCat(zone.key, cat.id)"
                    class="rounded flex-shrink-0" :style="`accent-color:${zone.color}`" />
                  {{ cat.name }}
                </label>
              </div>

              <!-- Custom domains -->
              <div v-else class="space-y-2">
                <p class="text-[11px]" style="color:#9ca3af">Un dominio por línea. Se bloquearán además de las categorías.</p>
                <textarea v-model="cfDomainInputs[zone.key]" @blur="cfParseDomains(zone.key)"
                  rows="4" placeholder="ejemplo.com&#10;*.redesocial.com"
                  class="w-full px-3 py-2 rounded-lg text-[12px] font-mono outline-none resize-none transition-all"
                  style="border:1px solid #d1d5db;color:#374151"
                  @focus="e => e.target.style.borderColor=zone.color"
                  @blur2="e => e.target.style.borderColor='#d1d5db'"></textarea>
              </div>
            </div>
          </div>

          <!-- DNS endpoints when active -->
          <div v-if="cfCfg.zones_created" class="rounded-xl p-4 space-y-4" style="background:#f9fafb;border:1px solid #e5e7eb">
            <p class="text-[11px] font-semibold" style="color:#374151">Servidores DNS activos</p>
            <div v-for="zone in cfZones" :key="zone.key" class="space-y-1.5">
              <div class="flex items-center gap-1.5 mb-1">
                <component :is="zone.icon" class="w-3 h-3 flex-shrink-0" :style="`color:${zone.color}`" />
                <span class="text-[11px] font-semibold" :style="`color:${zone.color}`">{{ cfZoneNames[zone.key] }}</span>
              </div>
              <!-- Standard DNS -->
              <div v-if="cfCfg[`zone_${zone.key}_ip`]?.length" class="flex items-center gap-2 pl-4">
                <span class="text-[10px] w-20 flex-shrink-0" style="color:#9ca3af">DNS estándar</span>
                <code class="text-[10px] font-mono" style="color:#374151">{{ cfCfg[`zone_${zone.key}_ip`].join(', ') }}</code>
                <button @click="cfCopyIp(zone.key)"
                  class="text-[10px] px-1.5 py-0.5 rounded" style="color:#9ca3af;border:1px solid #e5e7eb"
                  @mouseenter="e => e.currentTarget.style.color='#374151'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
                  Copiar
                </button>
              </div>
              <!-- DoH -->
              <div v-if="cfCfg[`zone_${zone.key}_doh`]" class="flex items-center gap-2 pl-4">
                <span class="text-[10px] w-20 flex-shrink-0" style="color:#9ca3af">DNS-over-HTTPS</span>
                <code class="flex-1 text-[10px] truncate font-mono" style="color:#374151">
                  https://{{ cfCfg[`zone_${zone.key}_doh`] }}.cloudflare-gateway.com/dns-query
                </code>
                <button @click="cfCopyDoh(zone.key)"
                  class="text-[10px] px-1.5 py-0.5 rounded" style="color:#9ca3af;border:1px solid #e5e7eb"
                  @mouseenter="e => e.currentTarget.style.color='#374151'"
                  @mouseleave="e => e.currentTarget.style.color='#9ca3af'">
                  Copiar
                </button>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-3">
            <button @click="cfCreateZones" :disabled="cfCreating"
              class="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] font-medium text-white transition-all"
              :style="cfCreating ? 'background:#9ca3af;cursor:not-allowed' : 'background:#f97316'">
              <ArrowPathIcon v-if="cfCreating" class="w-3.5 h-3.5 animate-spin" />
              <ShieldCheckIcon v-else class="w-3.5 h-3.5" />
              {{ cfCreating ? 'Creando zonas...' : cfCfg.zones_created ? 'Actualizar zonas' : 'Crear zonas de protección' }}
            </button>
            <button v-if="cfCfg.zones_created" @click="cfDeleteZones" :disabled="cfDeleting"
              class="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-medium transition-all"
              style="border:1px solid #fecaca;color:#dc2626;background:#fef2f2"
              @mouseenter="e => e.currentTarget.style.background='#fee2e2'"
              @mouseleave="e => e.currentTarget.style.background='#fef2f2'">
              <TrashIcon class="w-3.5 h-3.5" />
              Eliminar
            </button>
          </div>

          <div v-if="cfResult" class="rounded-lg p-3"
            :style="cfResult.ok ? 'background:#f0fdf4;border:1px solid #bbf7d0' : 'background:#fef2f2;border:1px solid #fecaca'">
            <p class="text-[12px]" :style="cfResult.ok ? 'color:#15803d' : 'color:#991b1b'">{{ cfResult.msg }}</p>
          </div>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { selectedOrgId, allOrgs, switchOrg, loadUserContext, orgSwitchKey } from '../../lib/orgStore'
import {
  WifiIcon, ShieldCheckIcon, ArrowPathIcon, CheckCircleIcon,
  ExclamationCircleIcon, PlusCircleIcon, ArrowRightIcon,
  CloudIcon, ShieldExclamationIcon, UserGroupIcon, WrenchScrewdriverIcon,
  TrashIcon, ClipboardDocumentIcon, ServerIcon,
} from '@heroicons/vue/24/outline'

const route  = useRoute()
const router = useRouter()

// ── New org form ──────────────────────────────────────────────────────────
const showNewOrg  = ref(route.query.new === '1')
const newOrgForm  = ref({ name: '', slug: '' })
const creatingOrg = ref(false)
const newOrgMsg   = ref('')
const newOrgOk    = ref(false)

function autoSlug(name) {
  return name.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function onOrgNameInput() {
  newOrgForm.value.slug = autoSlug(newOrgForm.value.name)
}

async function createOrg() {
  if (!newOrgForm.value.name.trim() || !newOrgForm.value.slug.trim()) {
    newOrgMsg.value = 'Rellena el nombre y el slug'
    newOrgOk.value = false
    return
  }
  creatingOrg.value = true
  newOrgMsg.value = ''
  try {
    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: newOrgForm.value.name.trim(), slug: newOrgForm.value.slug.trim() })
      .select('id, name, slug')
      .single()
    if (error) throw error
    newOrgMsg.value = `Colegio "${data.name}" creado correctamente`
    newOrgOk.value = true
    newOrgForm.value = { name: '', slug: '' }
    // Reload org list and switch to new org
    await loadUserContext()
    await switchOrg(data.id)
    router.replace('/dashboard/superconfig')
    showNewOrg.value = false
    await loadConfig()
  } catch (e) {
    newOrgMsg.value = `Error: ${e.message}`
    newOrgOk.value = false
  } finally {
    creatingOrg.value = false
  }
}

const currentOrgName = computed(() =>
  allOrgs.value.find(o => o.id === selectedOrgId.value)?.name || '...'
)

const config = ref({
  controller_url: '',
  site_id: '',
  username: '',
  password: '',
  network_active: false,
  vlan_network_id: null,
  wlan_id: null,
  last_check_ok: null,
  last_check_msg: null,
})

const form = ref({
  controller_url: '',
  site_id: '',
  username: '',
  password: '',
})

const savingConfig = ref(false)
const saveMsg      = ref('')
const saveOk       = ref(false)
const activating   = ref(false)
const setupResult  = ref(null)

// UniFi DNS zones
const unifiStatus    = ref(null)
const configuringDns = ref(false)
const dnsZoneResult  = ref(null)
const probingVlan    = ref(false)
const probeResult    = ref(null)

// Wizard
const wSteps = ['URL', 'Credenciales', 'Site', 'Resultado']
const wStep  = ref(1)   // 0 = show summary if connected, 1-4 = wizard steps
const wDone  = ref(false)

const fetchingSites  = ref(false)
const fetchSitesError = ref('')
const availableSites = ref([])

function wStep1Next() {
  let url = form.value.controller_url.trim()
  if (!url) return
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url
  form.value.controller_url = url
  wStep.value = 2
}

async function fetchSites() {
  if (!form.value.username || !form.value.password) return
  fetchingSites.value = true
  fetchSitesError.value = ''
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          action: 'get_sites',
          controller_url: form.value.controller_url,
          username: form.value.username,
          password: form.value.password,
        }),
      }
    )
    const result = await res.json()
    if (!result.ok) throw new Error(result.error || 'Error desconocido')
    availableSites.value = result.sites
    if (result.sites.length === 1) form.value.site_id = result.sites[0].id
    wStep.value = 3
  } catch (e) {
    fetchSitesError.value = e.message
  } finally {
    fetchingSites.value = false
  }
}

const setupItems = [
  { label: 'VLAN "PenwinSafe" (VLAN 99 — 10.99.0.0/24)' },
  { label: 'SSID "PenwinSafe" asociado a esa VLAN' },
  { label: 'Reglas firewall: bloquear HTTP/HTTPS directo desde VLAN PenwinSafe' },
  { label: 'Servidor WireGuard para túnel seguro' },
]

async function loadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('unifi_configs')
    .select('*')
    .eq('org_id', selectedOrgId.value)
    .single()
  if (data) {
    config.value = data
    form.value = {
      controller_url: data.controller_url || '',
      site_id:        data.site_id || '',
      username:       data.username || '',
      password:       data.password || '',
    }
    // If already connected, show summary; otherwise start wizard from step 1
    if (data.last_check_ok === true) {
      wStep.value = 0
      if (data.site_id) availableSites.value = [{ id: data.site_id, label: data.site_id }]
      checkUnifiStatus()
    } else {
      wStep.value = 1
    }
  } else {
    wStep.value = 1
  }
}

async function callUnifiApi(action, extra = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/unifi-api`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ action, org_id: selectedOrgId.value, ...extra }),
    }
  )
  return await res.json()
}

async function checkUnifiStatus() {
  if (!config.value.last_check_ok) return
  try {
    const r = await callUnifiApi('check')
    if (r.ok) unifiStatus.value = r
  } catch { /* silent */ }
}

async function configureDnsZones() {
  configuringDns.value = true
  dnsZoneResult.value = null
  try {
    const r = await callUnifiApi('configure_dns_zones')
    dnsZoneResult.value = r
    if (r.ok) {
      config.value.dns_zones_configured = true
      toast.success('VLANs y DNS configurados en el router')
    } else if (r.error) {
      toast.error(r.error)
    }
  } catch (e) {
    toast.error(e.message)
  } finally {
    configuringDns.value = false
  }
}

async function probeVlanDns(vlanName) {
  probingVlan.value = true
  probeResult.value = null
  try {
    const r = await callUnifiApi('probe_vlan', { vlan_name: vlanName || '' })
    probeResult.value = r
  } catch (e) {
    probeResult.value = { error: e.message }
  } finally {
    probingVlan.value = false
  }
}

// ── DNS Enforcement ───────────────────────────────────────────────────────
const dnsEnfIp      = ref('')
const enforcingDns  = ref(false)
const dnsEnfResult  = ref(null)
const dohIpCount    = 32 // matches DOH_IPS array in edge function

async function setupDnsEnforcement() {
  if (!dnsEnfIp.value.trim()) return
  enforcingDns.value = true
  dnsEnfResult.value = null
  try {
    const r = await callUnifiApi('setup_dns_enforcement', { dns_server_ip: dnsEnfIp.value.trim() })
    dnsEnfResult.value = r
    if (r.ok) config.value.dns_zones_configured = true
  } catch (e) {
    dnsEnfResult.value = { ok: false, checks: [], errors: [e.message] }
  } finally {
    enforcingDns.value = false
  }
}

async function probeFirewall() {
  probingVlan.value = true
  probeResult.value = null
  try {
    const r = await callUnifiApi('probe_firewall')
    probeResult.value = r
  } catch (e) {
    probeResult.value = { error: e.message }
  } finally {
    probingVlan.value = false
  }
}

async function testAndSave() {
  if (!form.value.controller_url || !form.value.site_id || !form.value.username || !form.value.password) {
    saveMsg.value = 'Rellena todos los campos'
    saveOk.value = false
    return
  }

  savingConfig.value = true
  saveMsg.value = ''

  try {
    await supabase.from('unifi_configs').upsert({
      org_id:         selectedOrgId.value,
      controller_url: form.value.controller_url,
      site_id:        form.value.site_id,
      username:       form.value.username,
      password:       form.value.password,
    })

    const result = await callUnifiApi('check')

    if (result.ok) {
      await supabase.from('unifi_configs').update({
        last_check_ok: true,
        last_check_at: new Date().toISOString(),
        last_check_msg: `OK — ${result.device_count} dispositivos, firmware ${result.sysinfo?.version || '?'}`,
      }).eq('org_id', selectedOrgId.value)
      saveMsg.value = `Conectado. ${result.device_count} dispositivo(s) en el site.`
      saveOk.value = true
      config.value.last_check_ok = true
    } else {
      await supabase.from('unifi_configs').update({
        last_check_ok: false,
        last_check_at: new Date().toISOString(),
        last_check_msg: result.error || 'Error desconocido',
      }).eq('org_id', selectedOrgId.value)
      saveMsg.value = result.error || 'Error desconocido'
      saveOk.value = false
    }
    wStep.value = 4
    await loadConfig()
  } catch (e) {
    saveMsg.value = e.message
    saveOk.value = false
    wStep.value = 4
  } finally {
    savingConfig.value = false
  }
}

async function activateNetwork() {
  activating.value = true
  setupResult.value = null
  try {
    const result = await callUnifiApi('setup')
    // Normalize: edge function may return { error: "..." } instead of { errors: [...] }
    if (!result.errors) result.errors = result.error ? [result.error] : []
    if (!result.checks) result.checks = []
    setupResult.value = result
    if (result.ok) await loadConfig()
  } catch (e) {
    setupResult.value = { ok: false, checks: [], errors: [e.message] }
  } finally {
    activating.value = false
  }
}

// ── Cloudflare DNS ────────────────────────────────────────────────────────

const cfOpen        = ref(false)
const cfTab         = ref('Configuración')
const cfStatsDays   = ref(7)
const cfLoadingStats = ref(false)
const cfStats       = ref(null)
const cfVerifying   = ref(false)
const cfCredError   = ref('')
const cfLoadingCats = ref(false)
const cfCreating    = ref(false)
const cfDeleting    = ref(false)
const cfResult      = ref(null)
const cfActiveZone  = ref(null)

const cfCfg = ref({
  last_check_ok: null, zones_created: false,
  zone_students_doh: '', zone_teachers_doh: '', zone_admin_doh: '',
  available_categories: [],
})
const cfForm = ref({ account_id: '', api_token: '' })
const cfCategories = ref([])
const cfZoneNames = ref({ students: 'Alumnos', teachers: 'Profesores', admin: 'Administración' })
const cfSelCats   = ref({ students: [], teachers: [], admin: [] })
const cfDomains   = ref({ students: [], teachers: [], admin: [] })
const cfDomainInputs = ref({ students: '', teachers: '', admin: '' })
const cfZoneTab   = ref({ students: 'Seguridad', teachers: 'Seguridad', admin: 'Seguridad' })

const cfZones = [
  { key: 'students', color: '#dc2626', bg: '#fef2f200', border: '#fecaca', icon: ShieldExclamationIcon },
  { key: 'teachers', color: '#d97706', bg: '#fffbeb00', border: '#fde68a', icon: UserGroupIcon },
  { key: 'admin',    color: '#2563eb', bg: '#eff6ff00', border: '#bfdbfe', icon: WrenchScrewdriverIcon },
]

function cfGroupCats(cls) {
  // Cloudflare uses class:'free'|'blocked' for security/threat categories, 'premium'|'removalPending' for content
  return cfCategories.value.filter(c => cls === 'security'
    ? (c.class === 'free' || c.class === 'blocked')
    : (c.class !== 'free' && c.class !== 'blocked'))
}

function cfToggleCat(key, id) {
  const arr = cfSelCats.value[key]
  const idx = arr.indexOf(id)
  if (idx === -1) arr.push(id)
  else arr.splice(idx, 1)
}

function cfSelectAll(key, tab) {
  const cls = tab === 'Seguridad' ? 'security' : 'content'
  const ids = cfGroupCats(cls).map(c => c.id)
  ids.forEach(id => { if (!cfSelCats.value[key].includes(id)) cfSelCats.value[key].push(id) })
}

function cfClearAll(key, tab) {
  const cls = tab === 'Seguridad' ? 'security' : 'content'
  const ids = cfGroupCats(cls).map(c => c.id)
  cfSelCats.value[key] = cfSelCats.value[key].filter(id => !ids.includes(id))
}

function cfParseDomains(key) {
  const lines = cfDomainInputs.value[key].split('\n').map(l => l.trim()).filter(Boolean)
  cfDomains.value[key] = [...new Set(lines)]
}

async function cfCallApi(body) {
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

async function cfLoadConfig() {
  if (!selectedOrgId.value) return
  const { data } = await supabase
    .from('cloudflare_configs').select('*').eq('org_id', selectedOrgId.value).single()
  if (data) {
    cfCfg.value = data
    cfForm.value = { account_id: data.account_id || '', api_token: '' }
    cfZoneNames.value = {
      students: data.zone_students_name || 'Alumnos',
      teachers: data.zone_teachers_name || 'Profesores',
      admin:    data.zone_admin_name    || 'Administración',
    }
    cfSelCats.value = {
      students: data.categories_students || [],
      teachers: data.categories_teachers || [],
      admin:    data.categories_admin    || [],
    }
    cfDomains.value = {
      students: data.custom_blocked_students || [],
      teachers: data.custom_blocked_teachers || [],
      admin:    data.custom_blocked_admin    || [],
    }
    cfDomainInputs.value = {
      students: (data.custom_blocked_students || []).join('\n'),
      teachers: (data.custom_blocked_teachers || []).join('\n'),
      admin:    (data.custom_blocked_admin    || []).join('\n'),
    }
    if (data.available_categories?.length) cfCategories.value = data.available_categories
    if (data.last_check_ok) cfOpen.value = true

    // Auto-fetch IPs from Cloudflare if zones exist but IPs weren't saved yet
    if (data.zones_created && !data.zone_students_ip?.length) {
      cfCallApi({ action: 'refresh_ips' }).then(() => cfLoadConfig())
    }
  }
}

async function cfLoadStats() {
  cfLoadingStats.value = true
  try {
    const r = await cfCallApi({ action: 'get_stats', days: cfStatsDays.value })
    if (r.ok) cfStats.value = r
  } catch { /* ignore */ }
  finally { cfLoadingStats.value = false }
}

async function cfVerify() {
  if (!cfForm.value.account_id || !cfForm.value.api_token) return
  cfVerifying.value = true
  cfCredError.value = ''
  try {
    const result = await cfCallApi({ action: 'verify', account_id: cfForm.value.account_id.trim(), api_token: cfForm.value.api_token.trim() })
    if (result.ok) {
      // Credentials already saved server-side by the edge function
      cfCfg.value.last_check_ok = true
      if (!cfCategories.value.length) await cfLoadCats()
    } else {
      cfCredError.value = result.error || 'Error desconocido'
    }
  } catch (e) { cfCredError.value = e.message }
  finally { cfVerifying.value = false }
}

async function cfLoadCats() {
  cfLoadingCats.value = true
  cfCredError.value = ''
  try {
    const result = await cfCallApi({ action: 'get_categories' })
    if (result.ok) {
      cfCategories.value = result.categories
    } else {
      cfCredError.value = result.error || 'Error al cargar categorías'
    }
  } catch (e) {
    cfCredError.value = e.message
  } finally {
    cfLoadingCats.value = false
  }
}

async function cfCreateZones() {
  cfZones.forEach(z => cfParseDomains(z.key))
  cfCreating.value = true
  cfResult.value = null
  try {
    const result = await cfCallApi({
      action: 'create_zones',
      zone_names: { students: cfZoneNames.value.students, teachers: cfZoneNames.value.teachers, admin: cfZoneNames.value.admin },
      categories_students: cfSelCats.value.students,
      categories_teachers: cfSelCats.value.teachers,
      categories_admin:    cfSelCats.value.admin,
      custom_blocked_students: cfDomains.value.students,
      custom_blocked_teachers: cfDomains.value.teachers,
      custom_blocked_admin:    cfDomains.value.admin,
    })
    cfResult.value = result.ok
      ? { ok: true, msg: 'Zonas creadas correctamente en Cloudflare Gateway' }
      : { ok: false, msg: result.error || 'Error al crear las zonas' }
    if (result.ok) await cfLoadConfig()
  } catch (e) { cfResult.value = { ok: false, msg: e.message } }
  finally { cfCreating.value = false }
}

async function cfDeleteZones() {
  if (!confirm('¿Eliminar las tres zonas de Cloudflare Gateway?')) return
  cfDeleting.value = true
  try {
    const result = await cfCallApi({ action: 'delete_zones' })
    cfResult.value = result.ok ? { ok: true, msg: 'Zonas eliminadas' } : { ok: false, msg: result.error }
    if (result.ok) await cfLoadConfig()
  } catch (e) { cfResult.value = { ok: false, msg: e.message } }
  finally { cfDeleting.value = false }
}

function cfCopyDoh(key) {
  const sub = cfCfg.value[`zone_${key}_doh`]
  if (sub) navigator.clipboard.writeText(`https://${sub}.cloudflare-gateway.com/dns-query`)
}

function cfCopyIp(key) {
  const ips = cfCfg.value[`zone_${key}_ip`]
  if (ips?.length) navigator.clipboard.writeText(ips.join(', '))
}

onMounted(() => { loadConfig(); cfLoadConfig() })
watch(orgSwitchKey, () => { if (selectedOrgId.value) { loadConfig(); cfLoadConfig() } })
</script>
