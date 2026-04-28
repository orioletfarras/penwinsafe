<template>
  <div class="flex gap-4 h-full">

    <!-- Device list (left) -->
    <div class="flex-1 min-w-0 space-y-3">

      <!-- Filtros -->
      <div class="flex items-center gap-2 flex-wrap">
        <div class="relative" style="width:220px">
          <MagnifyingGlassIcon class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style="color:#9ca3af" />
          <input v-model="search" type="text" placeholder="Buscar dispositivo..."
            class="input pl-8" />
        </div>
        <select v-model="filterStatus" class="select" style="width:148px">
          <option value="">Todos los estados</option>
          <option value="online">Online</option>
          <option value="offline">Offline</option>
          <option value="locked">Bloqueado</option>
        </select>
        <select v-model="filterGroup" class="select" style="width:148px">
          <option value="">Todas las clases</option>
          <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
        </select>
        <select v-model="filterActivity" class="select" style="width:160px">
          <option value="">Cualquier actividad</option>
          <option value="active">Activo hoy</option>
          <option value="inactive">Sin actividad hoy</option>
          <option value="never">Nunca conectado</option>
          <option value="custom">Rango personalizado…</option>
        </select>
        <template v-if="filterActivity === 'custom'">
          <input type="date" v-model="filterDateFrom" class="select flex-shrink-0" style="width:130px" :max="filterDateTo || undefined" />
          <span class="text-[11px] flex-shrink-0" style="color:#9ca3af">–</span>
          <input type="date" v-model="filterDateTo" class="select flex-shrink-0" style="width:130px" :min="filterDateFrom || undefined" />
        </template>

        <!-- Chip filtros activos -->
        <button v-if="hasFilters" @click="clearFilters"
          class="flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded transition-colors"
          style="color:#6b7280;border:1px solid #e5e7eb"
          onmouseenter="this.style.background='#f9fafb'"
          onmouseleave="this.style.background='transparent'">
          <XMarkIcon class="w-3 h-3" />
          Limpiar filtros
        </button>

        <div class="ml-auto flex items-center gap-2">
          <!-- View toggle -->
          <div class="flex rounded overflow-hidden" style="border:1px solid #e5e7eb">
            <button @click="viewMode = 'table'"
              class="px-2 py-1 transition-colors"
              :style="viewMode === 'table' ? 'background:#006fff;color:#fff' : 'background:#fff;color:#9ca3af'">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
                <path d="M3 5h14M3 10h14M3 15h14"/>
              </svg>
            </button>
            <button @click="viewMode = 'grid'"
              class="px-2 py-1 transition-colors"
              :style="viewMode === 'grid' ? 'background:#006fff;color:#fff' : 'background:#fff;color:#9ca3af'">
              <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 20 20" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="2" width="7" height="7" rx="1"/><rect x="11" y="2" width="7" height="7" rx="1"/>
                <rect x="2" y="11" width="7" height="7" rx="1"/><rect x="11" y="11" width="7" height="7" rx="1"/>
              </svg>
            </button>
          </div>
          <div class="flex items-center gap-1.5 text-[11px] font-medium px-3 rounded" style="height:32px;color:#16a34a;background:#f0fdf4;border:1px solid #bbf7d0">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            {{ onlineCount }} online
          </div>
        </div>
      </div>

      <!-- Resumen de filtros activos -->
      <div v-if="hasFilters" class="text-[11px]" style="color:#9ca3af">
        Mostrando {{ filteredDevices.length }} de {{ devices.length }} dispositivos
      </div>

      <!-- Vista cuadrícula -->
      <div v-if="viewMode === 'grid'" class="grid grid-cols-2 xl:grid-cols-3 gap-3">
        <div v-for="d in pagedDevices" :key="d.id"
          class="card p-3 cursor-pointer transition-all"
          :style="selectedDevice?.id === d.id ? 'border:1.5px solid #006fff;background:#eff6ff' : ''"
          @click="selectDevice(d)"
          onmouseenter="this.style.background===''&&(this.style.background='#f9fafb')"
          onmouseleave="this.style.background===''&&(this.style.background='')">
          <div class="flex items-start justify-between mb-2">
            <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              :style="d.status === 'online' ? 'background:#f0fdf4' : d.status === 'locked' ? 'background:#fef2f2' : 'background:#f9fafb'">
              <ComputerDesktopIcon class="w-4 h-4"
                :style="d.status === 'online' ? 'color:#16a34a' : d.status === 'locked' ? 'color:#dc2626' : 'color:#9ca3af'" />
            </div>
            <div class="flex items-center gap-1">
              <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :class="statusDot(d.status)"></span>
              <span class="text-[10px] font-medium" :class="statusText(d.status)">{{ statusLabel(d.status) }}</span>
            </div>
          </div>
          <p class="text-[12px] font-semibold truncate" style="color:#111827">{{ d.name }}</p>
          <p class="text-[10px] mt-0.5 truncate" style="color:#9ca3af">{{ d.groups?.name || 'Sin clase' }}</p>
          <div class="flex items-center justify-between mt-2">
            <span class="text-[10px]" style="color:#9ca3af">{{ d.last_seen ? timeAgo(d.last_seen) : 'Nunca' }}</span>
            <span v-if="isInactive(d)" class="text-[9px] px-1 py-0.5 rounded font-medium"
              style="background:#fef9c3;color:#854d0e;border:1px solid #fde68a">inactivo</span>
            <NetworkModeBadge v-else :mode="d.network_mode" :status="d.status" size="xs" />
          </div>
          <div class="flex gap-1.5 mt-2.5 pt-2" style="border-top:1px solid #f3f4f6" @click.stop>
            <button v-if="d.status === 'online'" @click="takeScreenshot(d)" class="btn btn-success btn-sm flex-1 justify-center">Screenshot</button>
            <button @click="toggleLock(d)" class="btn btn-sm flex-1 justify-center"
              :class="d.status === 'locked' ? 'btn-success' : 'btn-danger'">
              {{ d.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
            </button>
            <button @click="deleteDevice(d)" class="btn btn-ghost btn-sm"><TrashIcon class="w-3.5 h-3.5" /></button>
          </div>
        </div>
        <div v-if="filteredDevices.length === 0" class="card empty-state xl:col-span-3">
          <div class="empty-state-icon"><ComputerDesktopIcon /></div>
          <p class="empty-state-title">Sin dispositivos</p>
        </div>
        <div v-if="filteredDevices.length > PAGE_SIZE" class="xl:col-span-3">
          <Pagination :model-value="devicePage" :total="filteredDevices.length" :per-page="PAGE_SIZE" @change="devicePage = $event" />
        </div>
      </div>

      <!-- Tabla -->
      <div v-else class="card overflow-hidden">
        <table class="w-full">
          <thead>
            <tr style="background:#f9fafb;border-bottom:1px solid #f0f2f5">
              <!-- Checkbox col -->
              <th class="px-3 py-3" style="width:28px">
                <input type="checkbox"
                  :checked="allSelected"
                  :indeterminate="someSelected && !allSelected"
                  @change="toggleAll"
                  class="w-3.5 h-3.5 rounded cursor-pointer"
                  style="accent-color:#006fff" />
              </th>
              <th class="text-left px-4 py-3 section-label" style="width:28%">
                <SortHeader label="Dispositivo" field="name" :sort="sort" @toggle="toggleSort" />
              </th>
              <th class="text-left px-4 py-3 section-label" style="width:15%">
                <SortHeader label="Aula" field="group" :sort="sort" @toggle="toggleSort" />
              </th>
              <th class="text-left px-4 py-3 section-label" style="width:12%">
                <SortHeader label="Estado" field="status" :sort="sort" @toggle="toggleSort" />
              </th>
              <th class="text-left px-4 py-3 section-label" style="width:9%">
                <SortHeader label="Riesgo 7d" field="risk" :sort="sort" @toggle="toggleSort" />
              </th>
              <th class="text-left px-4 py-3 section-label" style="width:14%">
                <SortHeader label="Última actividad" field="last_seen" :sort="sort" @toggle="toggleSort" />
              </th>
              <th class="px-4 py-3 text-right section-label" style="width:19%">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in pagedDevices" :key="d.id"
              class="transition-colors cursor-pointer"
              :style="[
                'border-bottom:1px solid #f3f4f6',
                selectedDevice?.id === d.id ? 'background:#eff6ff!important' : '',
                selectedIds.has(d.id) ? 'background:#f0f7ff!important' : ''
              ].join(';')"
              @click="selectDevice(d)"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background=''">

              <!-- Checkbox -->
              <td class="px-3 py-3" @click.stop>
                <input type="checkbox"
                  :checked="selectedIds.has(d.id)"
                  @change="toggleSelect(d.id)"
                  class="w-3.5 h-3.5 rounded cursor-pointer"
                  style="accent-color:#006fff" />
              </td>

              <!-- Dispositivo -->
              <td class="px-4 py-3">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    :style="d.status === 'online' ? 'background:#f0fdf4' : d.status === 'locked' ? 'background:#fef2f2' : 'background:#f9fafb'">
                    <ComputerDesktopIcon class="w-4 h-4"
                      :style="d.status === 'online' ? 'color:#16a34a' : d.status === 'locked' ? 'color:#dc2626' : 'color:#9ca3af'" />
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-1.5">
                      <!-- Inline edit: name -->
                      <template v-if="editCell?.deviceId === d.id && editCell?.field === 'name'">
                        <input
                          v-model="editCell.value"
                          class="text-[13px] font-semibold px-1.5 py-0.5 rounded outline-none"
                          style="color:#111827;border:1.5px solid #006fff;background:#eff6ff;min-width:80px;max-width:160px"
                          @click.stop
                          @keyup.enter="saveInlineEdit"
                          @keyup.escape="editCell = null"
                          @blur="saveInlineEdit" />
                      </template>
                      <p v-else
                        class="text-[13px] font-semibold truncate"
                        style="color:#111827"
                        @dblclick.stop="startInlineEdit(d, 'name')"
                        :title="'Doble clic para editar'">{{ d.name }}</p>
                      <span v-if="isInactive(d)" class="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0"
                        style="background:#fef9c3;color:#92400e;border:1px solid #fde68a">inactivo</span>
                    </div>
                    <div class="flex items-center gap-2 mt-0.5">
                      <span class="text-[10px] font-mono" style="color:#9ca3af">{{ d.ip_address || '—' }}</span>
                      <NetworkModeBadge :mode="d.network_mode" :status="d.status" size="xs" />
                    </div>
                  </div>
                </div>
              </td>

              <!-- Aula -->
              <td class="px-4 py-3">
                <!-- Inline edit: group -->
                <template v-if="editCell?.deviceId === d.id && editCell?.field === 'group'">
                  <select
                    v-model="editCell.value"
                    class="select"
                    style="width:130px;font-size:11px;height:28px"
                    @click.stop
                    @keyup.escape="editCell = null"
                    @change="saveInlineEdit">
                    <option value="">Sin clase</option>
                    <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                  </select>
                </template>
                <template v-else>
                  <span v-if="d.groups?.name"
                    class="inline-flex items-center text-[11px] font-medium px-2.5 py-1 rounded-full cursor-pointer"
                    style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe"
                    :title="'Doble clic para editar'"
                    @dblclick.stop="startInlineEdit(d, 'group')">
                    {{ d.groups.name }}
                  </span>
                  <span v-else
                    class="text-[11px] cursor-pointer"
                    style="color:#d1d5db"
                    :title="'Doble clic para asignar clase'"
                    @dblclick.stop="startInlineEdit(d, 'group')">—</span>
                </template>
              </td>

              <!-- Estado -->
              <td class="px-4 py-3">
                <span class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                  :style="d.status === 'online'
                    ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0'
                    : d.status === 'locked'
                    ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca'
                    : 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb'">
                  <span class="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    :style="d.status === 'online' ? 'background:#16a34a' : d.status === 'locked' ? 'background:#dc2626' : 'background:#9ca3af'"></span>
                  {{ statusLabel(d.status) }}
                </span>
              </td>

              <!-- Riesgo IA -->
              <td class="px-4 py-3">
                <template v-if="riskInfo(d.id)">
                  <Tooltip :text="`${riskInfo(d.id).count} búsqueda${riskInfo(d.id).count > 1 ? 's' : ''} de riesgo`">
                    <span class="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
                      :style="`background:${riskInfo(d.id).bg};color:${riskInfo(d.id).color};border:1px solid ${riskInfo(d.id).border}`">
                      <span class="w-1.5 h-1.5 rounded-full flex-shrink-0" :style="`background:${riskInfo(d.id).color}`"></span>
                      {{ riskInfo(d.id).count }}
                    </span>
                  </Tooltip>
                </template>
                <span v-else class="text-[11px]" style="color:#e5e7eb">—</span>
              </td>

              <!-- Última actividad -->
              <td class="px-4 py-3 text-[12px]" style="color:#6b7280">
                {{ d.last_seen ? timeAgo(d.last_seen) : 'Nunca' }}
              </td>

              <!-- Acciones -->
              <td class="px-4 py-3" @click.stop>
                <div class="flex items-center justify-end gap-0.5">
                  <Tooltip text="Abrir página">
                    <router-link :to="'/dashboard/devices/' + d.id" class="action-btn action-btn-default" @click.stop>
                      <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
                    </router-link>
                  </Tooltip>
                  <Tooltip text="Capturar pantalla">
                    <button v-if="d.status === 'online'" @click="takeScreenshot(d)" class="action-btn action-btn-success">
                      <CameraIcon class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Ver en directo">
                    <button v-if="d.status === 'online'" @click="watchLive(d)" class="action-btn action-btn-default">
                      <VideoCameraIcon class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip :text="d.status === 'locked' ? 'Desbloquear' : 'Bloquear acceso'">
                    <button @click="toggleLock(d)" class="action-btn"
                      :class="d.status === 'locked' ? 'action-btn-success' : 'action-btn-danger'">
                      <LockOpenIcon v-if="d.status === 'locked'" class="w-3.5 h-3.5" />
                      <LockClosedIcon v-else class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                  <Tooltip text="Eliminar dispositivo">
                    <button @click="deleteDevice(d)" class="action-btn action-btn-ghost">
                      <TrashIcon class="w-3.5 h-3.5" />
                    </button>
                  </Tooltip>
                </div>
              </td>

            </tr>
            <tr v-if="filteredDevices.length === 0">
              <td colspan="7">
                <div class="empty-state">
                  <div class="empty-state-icon"><ComputerDesktopIcon /></div>
                  <p class="empty-state-title">Sin dispositivos</p>
                  <p class="empty-state-desc">Cuando se active un equipo aparecerá aquí.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <Pagination v-if="filteredDevices.length > PAGE_SIZE"
          :model-value="devicePage" :total="filteredDevices.length" :per-page="PAGE_SIZE"
          @change="devicePage = $event" />
      </div><!-- end table card -->
    </div>

    <!-- Detail panel (right) -->
    <div v-if="selectedDevice"
      class="card w-[360px] flex-shrink-0 overflow-hidden flex flex-col"
      style="max-height:calc(100vh - 120px);position:sticky;top:0">

      <!-- Panel header -->
      <div class="px-4 py-3 flex items-center justify-between flex-shrink-0" style="border-bottom:1px solid #e5e7eb">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 rounded flex items-center justify-center"
            :style="selectedDevice.status === 'online' ? 'background:#f0fdf4' : 'background:#f9fafb'">
            <ComputerDesktopIcon class="w-3.5 h-3.5"
              :style="selectedDevice.status === 'online' ? 'color:#16a34a' : 'color:#9ca3af'" />
          </div>
          <div>
            <p class="text-[12px] font-semibold" style="color:#111827">{{ selectedDevice.name }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <p class="text-[10px]" style="color:#9ca3af">{{ selectedDevice.ip_address || '—' }}</p>
              <NetworkModeBadge :mode="selectedDevice.network_mode" :status="selectedDevice.status" size="xs" />
            </div>
          </div>
        </div>
        <div class="flex items-center gap-1">
          <Tooltip text="Abrir página completa">
            <router-link :to="'/dashboard/devices/' + selectedDevice.id"
              class="w-6 h-6 flex items-center justify-center rounded transition-colors"
              style="color:#9ca3af"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <ArrowTopRightOnSquareIcon class="w-3.5 h-3.5" />
            </router-link>
          </Tooltip>
          <button @click="selectedDevice = null"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#9ca3af"
            onmouseenter="this.style.background='#f9fafb'"
            onmouseleave="this.style.background='transparent'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="flex flex-shrink-0" style="border-bottom:1px solid #e5e7eb">
        <Tooltip v-for="tab in tabs" :key="tab.id" :text="tab.label" class="flex-1">
          <button @click="activeTab = tab.id"
            class="relative w-full flex items-center justify-center py-2.5 transition-colors"
            :style="activeTab === tab.id
              ? 'color:#006fff;border-bottom:2px solid #006fff'
              : 'color:#9ca3af;border-bottom:2px solid transparent'">
            <component :is="tab.icon" class="w-4 h-4" />
            <span v-if="tab.count > 0"
              class="absolute top-1 right-1.5 text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center"
              :style="activeTab === tab.id
                ? 'background:#006fff;color:#fff'
                : 'background:#e5e7eb;color:#6b7280'">
              {{ tab.count > 9 ? '9+' : tab.count }}
            </span>
          </button>
        </Tooltip>
      </div>

      <!-- Tab content -->
      <div class="flex-1 overflow-y-auto">

        <!-- URLs -->
        <div v-if="activeTab === 'urls'">
          <div v-if="!loadingDetail && urlEvents.length > 0" class="px-3 py-2" style="border-bottom:1px solid #f3f4f6">
            <div class="flex items-center gap-2 px-2.5 rounded" style="background:#f9fafb;border:1px solid #e5e7eb;height:28px">
              <MagnifyingGlassIcon class="w-3 h-3 flex-shrink-0" style="color:#9ca3af" />
              <input v-model="urlSearch" placeholder="Filtrar URLs..." class="flex-1 bg-transparent text-[11px] outline-none" style="color:#374151" />
            </div>
          </div>
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="filteredUrlEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            {{ urlSearch ? 'Sin resultados' : 'Sin historial de navegación' }}
          </div>
          <div v-else>
            <div v-for="e in filteredUrlEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <img :src="`https://www.google.com/s2/favicons?domain=${e.domain}&sz=16`"
                  class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded" @error="e.target.style.display='none'" />
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium truncate" style="color:#111827">{{ e.title || e.domain }}</p>
                  <p class="text-[10px] truncate" style="color:#9ca3af">{{ e.domain }}</p>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.visited_at) }}</span>
              </div>
              <div v-if="e.ai_category" class="mt-1 ml-5">
                <span class="text-[9px] px-1.5 py-0.5 rounded font-medium"
                  style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
                  {{ e.ai_category }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Búsquedas -->
        <div v-if="activeTab === 'searches'">
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="searchEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            Sin búsquedas registradas
          </div>
          <div v-else>
            <div v-for="e in searchEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <MagnifyingGlassIcon class="w-3 h-3 mt-0.5 flex-shrink-0" style="color:#9ca3af" />
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium" style="color:#111827">{{ e.query }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[9px] capitalize" style="color:#9ca3af">{{ e.engine }}</span>
                    <span v-if="e.ai_risk_level && e.ai_risk_level !== 'safe'"
                      class="text-[9px] px-1.5 py-0.5 rounded font-semibold"
                      :class="riskClass(e.ai_risk_level)">
                      {{ e.ai_risk_level }}
                    </span>
                  </div>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.searched_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bloqueados -->
        <div v-if="activeTab === 'blocked'">
          <div v-if="loadingDetail" class="p-4 space-y-2">
            <div v-for="i in 5" :key="i" class="h-9 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <div v-else-if="blockedEvents.length === 0" class="p-8 text-center text-[12px]" style="color:#9ca3af">
            Sin contenido bloqueado
          </div>
          <div v-else>
            <div v-for="e in blockedEvents" :key="e.id"
              class="px-4 py-2.5 transition-colors"
              style="border-bottom:1px solid #f9fafb"
              onmouseenter="this.style.background='#fef2f2'"
              onmouseleave="this.style.background='transparent'">
              <div class="flex items-start gap-2">
                <div class="w-3.5 h-3.5 mt-0.5 flex-shrink-0 rounded flex items-center justify-center" style="background:#fef2f2">
                  <NoSymbolIcon class="w-3 h-3" style="color:#dc2626" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[11px] font-medium truncate" style="color:#111827">
                    {{ e.query || e.domain }}
                  </p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[9px] px-1.5 py-0.5 rounded font-medium"
                      style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
                      {{ reasonLabel(e.reason) }}
                    </span>
                    <span v-if="e.query && e.domain !== 'search'" class="text-[9px] truncate" style="color:#9ca3af">
                      {{ e.domain }}
                    </span>
                  </div>
                </div>
                <span class="text-[9px] flex-shrink-0 mt-0.5" style="color:#9ca3af">{{ timeAgo(e.blocked_at) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Uso -->
        <div v-if="activeTab === 'usage'" class="p-4 space-y-5">
          <div v-if="loadingDetail" class="space-y-2">
            <div v-for="i in 6" :key="i" class="h-7 rounded animate-pulse" style="background:#f9fafb"></div>
          </div>
          <template v-else>
            <!-- Screen time last 14 days -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style="color:#6b7280">Tiempo de pantalla · 14 días</p>
              <div v-if="screenTime.length === 0" class="text-[11px]" style="color:#9ca3af">Sin datos aún</div>
              <div v-else class="space-y-1.5">
                <div v-for="row in screenTime" :key="row.date" class="flex items-center gap-2">
                  <span class="text-[10px] font-mono w-[72px] flex-shrink-0" style="color:#6b7280">{{ formatDate(row.date) }}</span>
                  <div class="flex-1 rounded overflow-hidden" style="background:#f3f4f6;height:6px">
                    <div class="h-full rounded transition-all"
                      style="background:#006fff"
                      :style="{ width: maxScreenTimeSec > 0 ? (row.total_sec / maxScreenTimeSec * 100) + '%' : '0%' }">
                    </div>
                  </div>
                  <span class="text-[10px] w-[36px] text-right flex-shrink-0" style="color:#374151">{{ formatDuration(row.total_sec) }}</span>
                </div>
              </div>
            </div>

            <!-- Top domains -->
            <div>
              <p class="text-[10px] font-semibold uppercase tracking-wider mb-2.5" style="color:#6b7280">Dominios por tiempo · 7 días</p>
              <div v-if="domainTime.length === 0" class="text-[11px]" style="color:#9ca3af">Sin datos aún</div>
              <div v-else class="space-y-1.5">
                <div v-for="(row, i) in domainTime" :key="row.domain" class="flex items-center gap-2">
                  <span class="text-[10px] w-4 text-right flex-shrink-0" style="color:#9ca3af">{{ i + 1 }}</span>
                  <img :src="`https://www.google.com/s2/favicons?domain=${row.domain}&sz=16`"
                    class="w-3 h-3 flex-shrink-0 rounded" @error="e => e.target.style.display='none'" />
                  <span class="flex-1 text-[11px] truncate" style="color:#111827">{{ row.domain }}</span>
                  <div class="w-[60px] rounded overflow-hidden flex-shrink-0" style="background:#f3f4f6;height:4px">
                    <div class="h-full rounded" style="background:#6366f1"
                      :style="{ width: domainTime[0]?.sec > 0 ? (row.sec / domainTime[0].sec * 100) + '%' : '0%' }">
                    </div>
                  </div>
                  <span class="text-[10px] w-[36px] text-right flex-shrink-0" style="color:#374151">{{ formatDuration(row.sec) }}</span>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Actividad -->
        <div v-if="activeTab === 'activity'" class="p-4">
          <p class="text-[10px] font-semibold uppercase tracking-wider mb-3" style="color:#6b7280">Búsquedas por hora · últimas 24h</p>
          <div v-if="loadingDetail" class="h-24 rounded animate-pulse" style="background:#f9fafb"></div>
          <template v-else>
            <div class="flex items-end gap-0.5" style="height:80px">
              <div v-for="(v, h) in activityHours" :key="h"
                class="flex-1 rounded-sm transition-all"
                :style="`height:${activityHours.some(x=>x>0) ? Math.max(4, Math.round(v/Math.max(...activityHours)*76)) : 4}px;background:${v > 0 ? '#006fff' : '#f3f4f6'};opacity:${v > 0 ? 0.3 + 0.7*(v/Math.max(1,...activityHours)) : 1}`">
              </div>
            </div>
            <div class="flex justify-between mt-1.5">
              <span class="text-[9px]" style="color:#d1d5db">00h</span>
              <span class="text-[9px]" style="color:#d1d5db">06h</span>
              <span class="text-[9px]" style="color:#d1d5db">12h</span>
              <span class="text-[9px]" style="color:#d1d5db">18h</span>
              <span class="text-[9px]" style="color:#d1d5db">23h</span>
            </div>
            <p v-if="!activityHours.some(x=>x>0)" class="text-center text-[12px] mt-4" style="color:#9ca3af">Sin búsquedas en las últimas 24h</p>
            <div v-else class="mt-3 text-[11px]" style="color:#6b7280">
              Total: <span class="font-semibold" style="color:#111827">{{ activityHours.reduce((a,b)=>a+b,0) }}</span> búsquedas
            </div>
          </template>
        </div>

        <!-- Notas -->
        <div v-if="activeTab === 'notes'" class="p-4 flex flex-col gap-3">
          <p class="text-[10px]" style="color:#9ca3af">Notas internas sobre este dispositivo. Solo visibles para administradores.</p>
          <textarea
            v-model="deviceNotes"
            rows="6"
            placeholder="Escribe una nota..."
            class="w-full text-[12px] rounded px-3 py-2 outline-none resize-none transition-colors"
            style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151;line-height:1.6"
            onfocus="this.style.borderColor='#006fff'"
            onblur="this.style.borderColor='#e5e7eb'">
          </textarea>
          <button @click="saveNotes" :disabled="savingNotes" class="btn btn-primary btn-sm self-end">
            {{ savingNotes ? 'Guardando...' : 'Guardar nota' }}
          </button>
        </div>

        <!-- Configuración -->
        <div v-if="activeTab === 'settings'" class="p-4 space-y-5">

          <!-- Clase -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">Clase asignada</p>
            <div class="flex gap-2 items-center">
              <select
                :value="selectedDevice.group_id || ''"
                @change="assignGroup(selectedDevice, $event.target.value)"
                class="select flex-1">
                <option value="">Sin clase asignada</option>
                <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
              </select>
              <span v-if="assigningGroup" class="text-[10px] flex-shrink-0" style="color:#9ca3af">Guardando...</span>
            </div>
          </div>

          <!-- Nombre -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">Nombre del dispositivo</p>
            <div class="flex gap-2">
              <input v-model="deviceEditName" class="input flex-1" placeholder="Nombre..." />
              <button @click="saveDeviceName" :disabled="savingName || !deviceEditName.trim()" class="btn btn-primary btn-sm flex-shrink-0">
                {{ savingName ? '...' : 'Guardar' }}
              </button>
            </div>
          </div>

          <!-- Cambiar colegio (solo superadmin) -->
          <div v-if="isSuperAdmin">
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">Colegio</p>
            <div class="flex gap-2">
              <select v-model="deviceOrgId" class="select flex-1">
                <option value="">Sin asignar</option>
                <option v-for="org in allOrgs" :key="org.id" :value="org.id">{{ org.name }}</option>
              </select>
              <button @click="saveDeviceOrg" :disabled="savingOrg" class="btn btn-primary btn-sm flex-shrink-0">
                {{ savingOrg ? '...' : 'Mover' }}
              </button>
            </div>
            <p class="text-[10px] mt-1.5" style="color:#9ca3af">El dispositivo dejará de aparecer en el colegio actual.</p>
          </div>

          <!-- Info del dispositivo -->
          <div>
            <p class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color:#6b7280">Información</p>
            <div class="space-y-2 rounded-lg p-3" style="background:#f9fafb;border:1px solid #e5e7eb">
              <div class="flex justify-between text-[11px]">
                <span style="color:#9ca3af">ID</span>
                <span class="font-mono text-[10px] truncate ml-4" style="color:#374151">{{ selectedDevice?.id }}</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span style="color:#9ca3af">Sistema</span>
                <span style="color:#374151">{{ selectedDevice?.os_info || '—' }}</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span style="color:#9ca3af">IP</span>
                <span class="font-mono" style="color:#374151">{{ selectedDevice?.ip_address || '—' }}</span>
              </div>
              <div class="flex justify-between text-[11px]">
                <span style="color:#9ca3af">Red</span>
                <NetworkModeBadge :mode="selectedDevice?.network_mode" :status="selectedDevice?.status" />
              </div>
            </div>
          </div>

          <!-- Eliminar -->
          <div class="pt-2" style="border-top:1px solid #f3f4f6">
            <button @click="deleteDevice(selectedDevice)" class="btn btn-ghost btn-sm text-[11px]" style="color:#9ca3af">
              <TrashIcon class="w-3 h-3" /> Eliminar dispositivo
            </button>
          </div>

        </div>

      </div>
    </div>

  </div>

  <!-- Modal screenshot -->
  <Teleport to="body">
    <div v-if="screenshotModal" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7)">
      <div class="rounded overflow-hidden flex flex-col" style="background:#111827;border:1px solid #374151;box-shadow:0 20px 60px rgba(0,0,0,0.5);width:900px;max-width:95vw">
        <div class="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style="border-bottom:1px solid #374151">
          <div class="flex items-center gap-2.5">
            <span class="text-[13px] font-semibold" style="color:#f9fafb">{{ screenshotModal.deviceName }}</span>
            <span class="text-[10px]" style="color:#6b7280">{{ screenshotModal.takenAt }}</span>
          </div>
          <div class="flex items-center gap-2">
            <button v-if="screenshotModal.image" @click="downloadScreenshot"
              class="text-[11px] font-medium px-2.5 py-1 rounded"
              style="background:#006fff;color:#fff">
              Descargar
            </button>
            <button @click="screenshotModal = null"
              class="w-6 h-6 flex items-center justify-center rounded"
              style="color:#9ca3af" onmouseenter="this.style.color='#f9fafb'" onmouseleave="this.style.color='#9ca3af'">
              <XMarkIcon class="w-4 h-4" />
            </button>
          </div>
        </div>
        <div style="background:#000;min-height:200px;display:flex;align-items:center;justify-content:center">
          <img v-if="screenshotModal.image" :src="screenshotModal.image" style="max-width:100%;max-height:70vh;display:block" />
          <div v-else class="flex flex-col items-center gap-2 p-8">
            <svg class="animate-spin w-6 h-6" style="color:#006fff" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p class="text-[12px]" style="color:#9ca3af">Capturando pantalla...</p>
          </div>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Modal vista en vivo -->
  <Teleport to="body">
    <div v-if="liveDevice" class="fixed inset-0 z-50 flex items-center justify-center p-4" style="background:rgba(0,0,0,0.7)">
      <div class="rounded overflow-hidden flex flex-col" style="background:#111827;border:1px solid #374151;box-shadow:0 20px 60px rgba(0,0,0,0.5);width:900px;max-width:95vw">
        <!-- Header -->
        <div class="flex items-center justify-between px-4 py-2.5 flex-shrink-0" style="border-bottom:1px solid #374151">
          <div class="flex items-center gap-2.5">
            <span class="w-1.5 h-1.5 rounded-full animate-pulse" style="background:#16a34a"></span>
            <span class="text-[13px] font-semibold" style="color:#f9fafb">{{ liveDevice.name }}</span>
            <span class="text-[10px] px-1.5 py-0.5 rounded font-medium" style="background:#064e3b;color:#34d399;border:1px solid #065f46">En vivo</span>
            <span class="text-[10px]" style="color:#6b7280">{{ liveDevice.ip_address }}</span>
          </div>
          <button @click="closeLive"
            class="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style="color:#9ca3af"
            onmouseenter="this.style.color='#f9fafb'"
            onmouseleave="this.style.color='#9ca3af'">
            <XMarkIcon class="w-4 h-4" />
          </button>
        </div>

        <!-- Video area -->
        <div style="position:relative;background:#000;aspect-ratio:16/9">
          <video ref="liveVideoEl" autoplay playsinline muted
            style="width:100%;height:100%;display:block;object-fit:contain">
          </video>

          <!-- Waiting overlay -->
          <div v-if="liveStatus !== 'streaming'"
            class="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div v-if="liveStatus === 'connecting'" class="flex flex-col items-center gap-2">
              <svg class="animate-spin w-6 h-6" style="color:#006fff" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              <p class="text-[12px]" style="color:#9ca3af">Conectando con {{ liveDevice.name }}...</p>
            </div>
            <div v-else-if="liveStatus === 'error'" class="flex flex-col items-center gap-2">
              <p class="text-[13px] font-semibold" style="color:#f87171">No se pudo conectar</p>
              <p class="text-[11px]" style="color:#6b7280">El dispositivo debe estar online y con la app abierta</p>
              <button @click="startLive(liveDevice)"
                class="text-[11px] font-medium px-3 py-1.5 rounded mt-1"
                style="background:#006fff;color:#fff">
                Reintentar
              </button>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-4 py-2 flex items-center justify-between flex-shrink-0" style="border-top:1px solid #374151">
          <span class="text-[10px] font-mono" style="color:#4b5563">{{ liveDevice.os_info }}</span>
          <span class="text-[10px]" style="color:#4b5563">WebRTC · PenwinSafe</span>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- Bulk action bar -->
  <Teleport to="body">
    <Transition name="slide-up">
      <div v-if="selectedIds.size > 0"
        class="fixed z-50 flex items-center gap-2 px-4 py-2.5"
        style="bottom:24px;left:50%;transform:translateX(-50%);background:#0f172a;border:1px solid rgba(255,255,255,0.1);border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.4);white-space:nowrap">
        <span class="text-[12px] font-semibold mr-2" style="color:#f8fafc">{{ selectedIds.size }} seleccionado{{ selectedIds.size > 1 ? 's' : '' }}</span>
        <button @click="bulkLock"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
          style="background:#7f1d1d;color:#fca5a5;border:1px solid rgba(239,68,68,0.3)"
          onmouseenter="this.style.background='#991b1b'"
          onmouseleave="this.style.background='#7f1d1d'">
          <LockClosedIcon class="w-3 h-3" /> Bloquear
        </button>
        <button @click="bulkUnlock"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
          style="background:#14532d;color:#86efac;border:1px solid rgba(22,163,74,0.3)"
          onmouseenter="this.style.background='#166534'"
          onmouseleave="this.style.background='#14532d'">
          <LockOpenIcon class="w-3 h-3" /> Desbloquear
        </button>
        <!-- Assign group dropdown -->
        <div class="relative" ref="bulkGroupRef">
          <button @click="bulkClassOpen = !bulkClassOpen"
            class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
            style="background:rgba(255,255,255,0.08);color:#f8fafc;border:1px solid rgba(255,255,255,0.15)"
            onmouseenter="this.style.background='rgba(255,255,255,0.15)'"
            onmouseleave="this.style.background='rgba(255,255,255,0.08)'">
            <UserGroupIcon class="w-3 h-3" /> Cambiar clase
          </button>
          <div v-if="bulkClassOpen"
            class="absolute bottom-full mb-1.5 left-0 rounded-lg overflow-hidden z-50"
            style="background:#fff;border:1px solid #e5e7eb;box-shadow:0 8px 24px rgba(0,0,0,0.15);min-width:160px">
            <button
              class="w-full text-left px-3 py-2 text-[12px] transition-colors"
              style="color:#374151"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'"
              @click="bulkAssignGroup(null)">
              Sin clase
            </button>
            <button v-for="g in groups" :key="g.id"
              class="w-full text-left px-3 py-2 text-[12px] transition-colors"
              style="color:#374151"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'"
              @click="bulkAssignGroup(g.id)">
              {{ g.name }}
            </button>
          </div>
        </div>
        <button @click="selectedIds = new Set()"
          class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors"
          style="background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1)"
          onmouseenter="this.style.background='rgba(255,255,255,0.05)'"
          onmouseleave="this.style.background='transparent'">
          <XMarkIcon class="w-3 h-3" /> Deseleccionar
        </button>
      </div>
    </Transition>
  </Teleport>

  <ConfirmDialog
    v-model="confirmDelete.open"
    title="Eliminar dispositivo"
    :message="`¿Eliminar &quot;${confirmDelete.device?.name}&quot;? El dispositivo tendrá que volver a activarse con el código de centro.`"
    confirm-label="Eliminar"
    variant="danger"
    @confirm="doDeleteDevice"
    @cancel="confirmDelete.open = false"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { ChevronUpIcon, ChevronDownIcon as ChevronDownSortIcon } from '@heroicons/vue/24/outline'

const SortHeader = defineComponent({
  props: { label: String, field: String, sort: Object },
  emits: ['toggle'],
  setup(props, { emit }) {
    return () => h('button', {
      class: 'flex items-center gap-1 group transition-colors',
      style: 'color:inherit',
      onClick: () => emit('toggle', props.field),
    }, [
      h('span', props.label),
      h('span', { class: 'flex flex-col opacity-40 group-hover:opacity-100 transition-opacity' }, [
        h(ChevronUpIcon, {
          style: `width:8px;height:8px;color:${props.sort.field === props.field && props.sort.dir === 'asc' ? '#006fff' : 'inherit'};opacity:${props.sort.field === props.field && props.sort.dir === 'asc' ? '1' : '0.4'}`
        }),
        h(ChevronDownSortIcon, {
          style: `width:8px;height:8px;margin-top:-2px;color:${props.sort.field === props.field && props.sort.dir === 'desc' ? '#006fff' : 'inherit'};opacity:${props.sort.field === props.field && props.sort.dir === 'desc' ? '1' : '0.4'}`
        }),
      ])
    ])
  }
})

import { supabase } from '../../lib/supabase'
import { MagnifyingGlassIcon, ComputerDesktopIcon, XMarkIcon, SignalIcon, NoSymbolIcon, UserGroupIcon, TrashIcon, CameraIcon, VideoCameraIcon, LockClosedIcon, LockOpenIcon, GlobeAltIcon, ChartBarIcon, BoltIcon, PencilSquareIcon, Cog6ToothIcon, BuildingOfficeIcon, ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/outline'
import { isSuperAdmin, allOrgs } from '../../lib/orgStore'
import { logAction } from '../../lib/audit'
import NetworkModeBadge from '../../components/NetworkModeBadge.vue'
import Pagination from '../../components/Pagination.vue'
import ConfirmDialog from '../../components/ConfirmDialog.vue'
import Tooltip from '../../components/Tooltip.vue'
import { useToast } from '../../lib/toast'
import { cached } from '../../lib/cache'

const { error: toastError, success: toastSuccess } = useToast()
const router = useRouter()

const devices        = ref([])
const groups         = ref([])
const now            = ref(Date.now())
const search         = ref('')
const filterStatus   = ref('')
const filterGroup    = ref('')
const filterActivity = ref('')
const filterDateFrom = ref('')
const filterDateTo   = ref('')
const deviceRisk     = ref({})
const sort           = ref({ field: 'status', dir: 'asc' })

// Bulk selection
const selectedIds   = ref(new Set())
const bulkClassOpen = ref(false)
const bulkGroupRef  = ref(null)

const allSelected = computed(() =>
  pagedDevices.value.length > 0 && pagedDevices.value.every(d => selectedIds.value.has(d.id))
)
const someSelected = computed(() =>
  pagedDevices.value.some(d => selectedIds.value.has(d.id))
)

function toggleSelect(id) {
  const s = new Set(selectedIds.value)
  s.has(id) ? s.delete(id) : s.add(id)
  selectedIds.value = s
}

function toggleAll() {
  if (allSelected.value) {
    const s = new Set(selectedIds.value)
    pagedDevices.value.forEach(d => s.delete(d.id))
    selectedIds.value = s
  } else {
    const s = new Set(selectedIds.value)
    pagedDevices.value.forEach(d => s.add(d.id))
    selectedIds.value = s
  }
}

async function bulkLock() {
  const ids = [...selectedIds.value]
  const { error } = await supabase.from('devices').update({ status: 'locked' }).in('id', ids)
  if (error) { toastError('Error al bloquear: ' + error.message); return }
  ids.forEach(id => {
    const d = devices.value.find(x => x.id === id)
    if (d) d.status = 'locked'
  })
  toastSuccess(`${ids.length} dispositivo(s) bloqueados`)
  selectedIds.value = new Set()
}

async function bulkUnlock() {
  const ids = [...selectedIds.value]
  const { error } = await supabase.from('devices').update({ status: 'offline' }).in('id', ids)
  if (error) { toastError('Error al desbloquear: ' + error.message); return }
  ids.forEach(id => {
    const d = devices.value.find(x => x.id === id)
    if (d) d.status = 'offline'
  })
  toastSuccess(`${ids.length} dispositivo(s) desbloqueados`)
  selectedIds.value = new Set()
}

async function bulkAssignGroup(groupId) {
  bulkClassOpen.value = false
  const ids = [...selectedIds.value]
  const { error } = await supabase.from('devices').update({ group_id: groupId || null }).in('id', ids)
  if (error) { toastError('Error al cambiar clase: ' + error.message); return }
  const grp = groupId ? groups.value.find(g => g.id === groupId) : null
  ids.forEach(id => {
    const d = devices.value.find(x => x.id === id)
    if (d) { d.group_id = groupId || null; d.groups = grp }
  })
  toastSuccess(`Clase actualizada en ${ids.length} dispositivo(s)`)
  selectedIds.value = new Set()
}

// Inline editing
const editCell = ref(null)

function startInlineEdit(device, field) {
  editCell.value = {
    deviceId: device.id,
    field,
    value: field === 'name' ? device.name : (device.group_id || ''),
  }
  nextTick(() => {
    const input = document.querySelector('.inline-edit-input')
    input?.focus()
  })
}

async function saveInlineEdit() {
  if (!editCell.value) return
  const { deviceId, field, value } = editCell.value
  editCell.value = null
  const device = devices.value.find(d => d.id === deviceId)
  if (!device) return

  if (field === 'name') {
    const trimmed = value.trim()
    if (!trimmed || trimmed === device.name) return
    const { error } = await supabase.from('devices').update({ name: trimmed }).eq('id', deviceId)
    if (error) { toastError('Error al renombrar: ' + error.message); return }
    device.name = trimmed
    if (selectedDevice.value?.id === deviceId) selectedDevice.value.name = trimmed
    logAction('device_rename', trimmed)
    toastSuccess('Nombre actualizado')
  } else if (field === 'group') {
    const groupId = value || null
    const { error } = await supabase.from('devices').update({ group_id: groupId }).eq('id', deviceId)
    if (error) { toastError('Error al asignar clase: ' + error.message); return }
    device.group_id = groupId
    device.groups = groupId ? groups.value.find(g => g.id === groupId) || null : null
    if (selectedDevice.value?.id === deviceId) {
      selectedDevice.value.group_id = groupId
      selectedDevice.value.groups = device.groups
    }
    toastSuccess('Clase actualizada')
  }
}

function isInactive(d) {
  if (!d.last_seen || d.status === 'online') return false
  return Date.now() - new Date(d.last_seen).getTime() > 7 * 24 * 3600 * 1000
}

function toggleSort(field) {
  if (sort.value.field === field) {
    sort.value.dir = sort.value.dir === 'asc' ? 'desc' : 'asc'
  } else {
    sort.value = { field, dir: 'asc' }
  }
  devicePage.value = 1
}
const viewMode       = ref('table')
const deviceNotes    = ref('')
const savingNotes    = ref(false)
const deviceEditName = ref('')
const savingName     = ref(false)
const deviceOrgId    = ref('')
const savingOrg      = ref(false)
const activityHours  = ref(new Array(24).fill(0))
const liveDevice     = ref(null)
const liveVideoEl      = ref(null)
const screenshotModal  = ref(null)
const liveStatus     = ref('connecting') // connecting | streaming | error
const livePc         = ref(null)
const liveChannel    = ref(null)
const selectedDevice = ref(null)
const activeTab      = ref('urls')
const loadingDetail  = ref(false)
const assigningGroup = ref(false)
const urlEvents      = ref([])
const urlSearch      = ref('')
const filteredUrlEvents = computed(() => {
  if (!urlSearch.value) return urlEvents.value
  const q = urlSearch.value.toLowerCase()
  return urlEvents.value.filter(e =>
    e.domain?.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q) || e.url?.toLowerCase().includes(q)
  )
})
const searchEvents   = ref([])
const blockedEvents  = ref([])
const screenTime     = ref([])
const domainTime     = ref([])

const onlineCount = computed(() => devices.value.filter(d => d.status === 'online').length)

const PAGE_SIZE   = 20
const devicePage  = ref(1)

// Reset page when filters change
watch(() => [search.value, filterStatus.value, filterGroup.value, filterActivity.value, filterDateFrom.value, filterDateTo.value], () => { devicePage.value = 1 })

const pagedDevices = computed(() => {
  const start = (devicePage.value - 1) * PAGE_SIZE
  return filteredDevices.value.slice(start, start + PAGE_SIZE)
})

const hasFilters = computed(() =>
  !!search.value || !!filterStatus.value || !!filterGroup.value || !!filterActivity.value || !!filterDateFrom.value || !!filterDateTo.value
)

function clearFilters() {
  search.value = ''
  filterStatus.value = ''
  filterGroup.value = ''
  filterActivity.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
}

const filteredDevices = computed(() => {
  const today = new Date().toISOString().split('T')[0]
  const filtered = devices.value.filter(d => {
    if (search.value && !d.name.toLowerCase().includes(search.value.toLowerCase())) return false
    if (filterStatus.value && d.status !== filterStatus.value) return false
    if (filterGroup.value && d.group_id !== filterGroup.value) return false
    if (filterActivity.value === 'active') {
      if (!d.last_seen || !d.last_seen.startsWith(today)) return false
    } else if (filterActivity.value === 'inactive') {
      if (!d.last_seen || d.last_seen.startsWith(today)) return false
    } else if (filterActivity.value === 'never') {
      if (d.last_seen) return false
    } else if (filterActivity.value === 'custom') {
      const from = filterDateFrom.value ? new Date(filterDateFrom.value).getTime() : 0
      const to   = filterDateTo.value   ? new Date(filterDateTo.value + 'T23:59:59').getTime() : Infinity
      if (!d.last_seen) return false
      const ls = new Date(d.last_seen).getTime()
      if (ls < from || ls > to) return false
    }
    return true
  })

  const { field, dir } = sort.value
  const mul = dir === 'asc' ? 1 : -1
  return [...filtered].sort((a, b) => {
    let va, vb
    if (field === 'name')     { va = a.name?.toLowerCase() ?? ''; vb = b.name?.toLowerCase() ?? '' }
    if (field === 'status')   { va = a.status ?? ''; vb = b.status ?? '' }
    if (field === 'group')    { va = a.groups?.name?.toLowerCase() ?? ''; vb = b.groups?.name?.toLowerCase() ?? '' }
    if (field === 'last_seen'){ va = a.last_seen ?? ''; vb = b.last_seen ?? '' }
    if (field === 'risk')     { va = riskScore(a.id); vb = riskScore(b.id) }
    return va < vb ? -mul : va > vb ? mul : 0
  })
})

const tabs = computed(() => [
  { id: 'urls',     label: 'URLs',       icon: GlobeAltIcon,      count: urlEvents.value.length },
  { id: 'searches', label: 'Búsquedas',  icon: MagnifyingGlassIcon, count: searchEvents.value.length },
  { id: 'blocked',  label: 'Bloqueados', icon: NoSymbolIcon,      count: blockedEvents.value.length },
  { id: 'usage',    label: 'Uso',        icon: ChartBarIcon,      count: 0 },
  { id: 'activity', label: 'Actividad',  icon: BoltIcon,          count: 0 },
  { id: 'notes',    label: 'Notas',      icon: PencilSquareIcon,  count: 0 },
  { id: 'settings', label: 'Configuración', icon: Cog6ToothIcon,  count: 0 },
])

onMounted(async () => {
  // Grupos: usar caché si existe (datos poco cambiantes)
  const cachedGroups = cached('groups-simple', () =>
    supabase.from('groups').select('id, name').order('name').then(r => r.data || [])
  )
  if (cachedGroups) groups.value = cachedGroups

  const { data: devs } = await supabase.from('devices').select('*, groups(name)').order('status').order('name')
  devices.value = devs || []

  // Risk scores: last 7 days
  const since7d = new Date(Date.now() - 7 * 24 * 3600000).toISOString()
  const { data: riskRows } = await supabase
    .from('search_events')
    .select('device_id, ai_risk_level')
    .in('ai_risk_level', ['medium', 'high', 'critical'])
    .gte('searched_at', since7d)
  const riskMap = {}
  ;(riskRows || []).forEach(r => {
    if (!riskMap[r.device_id]) riskMap[r.device_id] = { medium: 0, high: 0, critical: 0 }
    riskMap[r.device_id][r.ai_risk_level]++
  })
  deviceRisk.value = riskMap

  if (!cachedGroups) {
    const { data: grps } = await supabase.from('groups').select('id, name').order('name')
    groups.value = grps || []
  }

  const channel = supabase.channel('devices-rt')
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices' }, p => {
      const idx = devices.value.findIndex(d => d.id === p.new.id)
      if (idx !== -1) {
        Object.assign(devices.value[idx], p.new)
        if (selectedDevice.value?.id === p.new.id) Object.assign(selectedDevice.value, p.new)
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'devices' }, async p => {
      const { data } = await supabase.from('devices').select('*, groups(name)').eq('id', p.new.id).single()
      if (data) devices.value.unshift(data)
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'devices' }, p => {
      devices.value = devices.value.filter(d => d.id !== p.old.id)
      if (selectedDevice.value?.id === p.old.id) selectedDevice.value = null
    })
    .subscribe()

  // Refresca los "hace Xm" cada 30s
  const ticker = setInterval(() => { now.value = Date.now() }, 30000)

  // Close bulk group dropdown on outside click
  function closeBulkGroup(e) {
    if (bulkGroupRef.value && !bulkGroupRef.value.contains(e.target)) bulkClassOpen.value = false
  }
  document.addEventListener('click', closeBulkGroup)

  onUnmounted(() => {
    clearInterval(ticker)
    supabase.removeChannel(channel)
    document.removeEventListener('click', closeBulkGroup)
  })
})

async function selectDevice(device) {
  selectedDevice.value = device
  activeTab.value = 'urls'
  deviceNotes.value = device.notes || ''
  deviceEditName.value = device.name || ''
  deviceOrgId.value = device.org_id || ''
  await loadDeviceHistory(device.id)
}

async function loadDeviceHistory(deviceId) {
  loadingDetail.value = true
  urlEvents.value = []
  searchEvents.value = []
  blockedEvents.value = []

  const [urls, searches, blocked] = await Promise.all([
    supabase.from('url_events').select('*').eq('device_id', deviceId).order('visited_at', { ascending: false }).limit(50),
    supabase.from('search_events').select('*').eq('device_id', deviceId).order('searched_at', { ascending: false }).limit(50),
    supabase.from('blocked_events').select('*').eq('device_id', deviceId).order('blocked_at', { ascending: false }).limit(50),
  ])

  urlEvents.value     = urls.data || []
  searchEvents.value  = searches.data || []
  blockedEvents.value = blocked.data || []

  // Hourly activity (searches last 24h)
  const buckets = new Array(24).fill(0)
  const since24 = Date.now() - 24 * 3600 * 1000
  searchEvents.value.forEach(e => {
    const t = new Date(e.searched_at).getTime()
    if (t >= since24) buckets[new Date(e.searched_at).getHours()]++
  })
  activityHours.value = buckets

  // Screen time: last 14 days
  const { data: st } = await supabase.from('screen_time')
    .select('date, total_sec').eq('device_id', deviceId)
    .order('date', { ascending: false }).limit(14)
  screenTime.value = st || []

  // Domain time: aggregate from url_events (last 7 days)
  const since = new Date(); since.setDate(since.getDate() - 7)
  const { data: domUrls } = await supabase.from('url_events')
    .select('domain, duration_sec').eq('device_id', deviceId)
    .gte('visited_at', since.toISOString())
  const domMap = {}
  ;(domUrls || []).forEach(u => {
    if (u.domain) domMap[u.domain] = (domMap[u.domain] || 0) + (u.duration_sec || 0)
  })
  domainTime.value = Object.entries(domMap)
    .sort((a, b) => b[1] - a[1]).slice(0, 15)
    .map(([domain, sec]) => ({ domain, sec }))

  loadingDetail.value = false
}

async function saveNotes() {
  if (!selectedDevice.value) return
  savingNotes.value = true
  const { error } = await supabase.from('devices').update({ notes: deviceNotes.value }).eq('id', selectedDevice.value.id)
  savingNotes.value = false
  if (error) { toastError('Error al guardar nota: ' + error.message); return }
  selectedDevice.value.notes = deviceNotes.value
  const idx = devices.value.findIndex(d => d.id === selectedDevice.value.id)
  if (idx !== -1) devices.value[idx].notes = deviceNotes.value
  toastSuccess('Nota guardada')
}

async function saveDeviceName() {
  if (!selectedDevice.value || !deviceEditName.value.trim()) return
  savingName.value = true
  const { error } = await supabase.from('devices').update({ name: deviceEditName.value.trim() }).eq('id', selectedDevice.value.id)
  savingName.value = false
  if (error) { toastError('Error al renombrar: ' + error.message); return }
  const oldName = selectedDevice.value.name
  selectedDevice.value.name = deviceEditName.value.trim()
  const idx = devices.value.findIndex(d => d.id === selectedDevice.value.id)
  if (idx !== -1) devices.value[idx].name = deviceEditName.value.trim()
  logAction('device_rename', deviceEditName.value.trim(), `antes: ${oldName}`)
  toastSuccess('Nombre actualizado')
}

async function saveDeviceOrg() {
  if (!selectedDevice.value) return
  savingOrg.value = true
  const { error } = await supabase.from('devices')
    .update({ org_id: deviceOrgId.value, group_id: null })
    .eq('id', selectedDevice.value.id)
  savingOrg.value = false
  if (error) { toastError('Error al cambiar colegio: ' + error.message); return }
  selectedDevice.value.org_id = deviceOrgId.value
  selectedDevice.value.group_id = null
  selectedDevice.value.groups = null
  const idx = devices.value.findIndex(d => d.id === selectedDevice.value.id)
  if (idx !== -1) { devices.value[idx].org_id = deviceOrgId.value; devices.value[idx].group_id = null; devices.value[idx].groups = null }
  toastSuccess('Colegio actualizado — clase reiniciada')
}

async function assignGroup(device, groupId) {
  assigningGroup.value = true
  const newGroupId = groupId || null
  const { error } = await supabase.from('devices').update({ group_id: newGroupId }).eq('id', device.id)
  if (error) { toastError('Error al asignar clase: ' + error.message); assigningGroup.value = false; return }
  device.group_id = newGroupId
  device.groups = groups.value.find(g => g.id === newGroupId) || null
  const idx = devices.value.findIndex(d => d.id === device.id)
  if (idx !== -1) Object.assign(devices.value[idx], { group_id: newGroupId, groups: device.groups })
  assigningGroup.value = false
  toastSuccess('Clase actualizada')
}

async function toggleLock(device) {
  const newStatus = device.status === 'locked' ? 'offline' : 'locked'
  const { error } = await supabase.from('devices').update({ status: newStatus }).eq('id', device.id)
  if (error) { toastError('Error al cambiar estado: ' + error.message); return }
  logAction(newStatus === 'locked' ? 'device_lock' : 'device_unlock', device.name)
  device.status = newStatus
}

const confirmDelete = ref({ open: false, device: null })

function deleteDevice(device) {
  confirmDelete.value = { open: true, device }
}

async function doDeleteDevice() {
  const device = confirmDelete.value.device
  confirmDelete.value.open = false
  const { error } = await supabase.from('devices').delete().eq('id', device.id)
  if (error) { toastError('Error al eliminar: ' + error.message); return }
  devices.value = devices.value.filter(d => d.id !== device.id)
  if (selectedDevice.value?.id === device.id) selectedDevice.value = null
  logAction('device_delete', device.name)
  toastSuccess(`"${device.name}" eliminado`)
}

function watchLive(d) { startLive(d) }

async function takeScreenshot(d) {
  screenshotModal.value = { deviceName: d.name, takenAt: 'Capturando...', image: null, reqId: null }

  const { data: req, error } = await supabase
    .from('screenshot_requests')
    .insert({ device_id: d.id, status: 'pending' })
    .select('id').single()

  if (error || !req) { screenshotModal.value = null; return }
  screenshotModal.value.reqId = req.id

  // Poll for result (max 30s)
  let tries = 0
  const iv = setInterval(async () => {
    tries++
    const { data } = await supabase
      .from('screenshot_requests')
      .select('status, image_data, taken_at')
      .eq('id', req.id).single()

    if (data?.status === 'done' && data.image_data) {
      clearInterval(iv)
      screenshotModal.value.image = `data:image/png;base64,${data.image_data}`
      screenshotModal.value.takenAt = new Date(data.taken_at).toLocaleTimeString('es-ES')
    } else if (data?.status === 'error' || tries > 15) {
      clearInterval(iv)
      if (!screenshotModal.value.image) screenshotModal.value = null
    }
  }, 2000)
}

function downloadScreenshot() {
  if (!screenshotModal.value?.image) return
  const a = document.createElement('a')
  a.href = screenshotModal.value.image
  a.download = `screenshot-${screenshotModal.value.deviceName}-${Date.now()}.png`
  a.click()
}

async function startLive(d) {
  closeLive()
  liveDevice.value = d
  liveStatus.value = 'connecting'

  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
  livePc.value = pc

  pc.ontrack = async (e) => {
    liveStatus.value = 'streaming'
    await nextTick()
    if (liveVideoEl.value) liveVideoEl.value.srcObject = e.streams[0]
  }

  // Create offer — wait for ICE gathering before inserting
  const offer = await pc.createOffer()
  await pc.setLocalDescription(offer)
  await new Promise(resolve => {
    if (pc.iceGatheringState === 'complete') return resolve()
    pc.onicegatheringstatechange = () => { if (pc.iceGatheringState === 'complete') resolve() }
    setTimeout(resolve, 4000)
  })

  // Insert session with complete offer SDP
  const { data: session, error } = await supabase
    .from('rtc_sessions')
    .insert({ device_id: d.id, admin_id: (await supabase.auth.getUser()).data.user.id, offer_sdp: pc.localDescription.sdp, status: 'pending' })
    .select('id').single()

  if (error || !session) { liveStatus.value = 'error'; return }

  // Timeout
  const timeout = setTimeout(() => {
    if (liveStatus.value === 'connecting') liveStatus.value = 'error'
  }, 30000)

  // Listen for answer via Realtime postgres_changes
  const ch = supabase.channel(`rtc-answer-${session.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rtc_sessions', filter: `id=eq.${session.id}` },
      async (payload) => {
        if (payload.new.status === 'active' && payload.new.answer_sdp) {
          clearTimeout(timeout)
          try {
            await pc.setRemoteDescription({ type: 'answer', sdp: payload.new.answer_sdp })
          } catch (e) { liveStatus.value = 'error' }
        }
      })
    .subscribe()
  liveChannel.value = ch
}

function closeLive() {
  livePc.value?.close()
  livePc.value = null
  if (liveChannel.value) { supabase.removeChannel(liveChannel.value); liveChannel.value = null }
  if (liveVideoEl.value) liveVideoEl.value.srcObject = null
  liveDevice.value = null
  liveStatus.value = 'connecting'
}

function reasonLabel(r) {
  return { dns_filter: 'DNS', keyword_filter: 'Palabra clave', blacklist: 'Lista negra', schedule: 'Horario', kiosk: 'Kiosco' }[r] || r
}

function riskClass(level) {
  return {
    low:      'bg-yellow-50 text-yellow-700 border border-yellow-200',
    medium:   'bg-orange-50 text-orange-600 border border-orange-200',
    high:     'bg-red-50 text-red-600 border border-red-200',
    critical: 'bg-red-100 text-red-700 border border-red-300',
  }[level] || ''
}

function riskInfo(deviceId) {
  const r = deviceRisk.value[deviceId]
  if (!r) return null
  if (r.critical > 0) return { count: r.critical, color: '#ef4444', bg: '#fef2f2', border: '#fecaca' }
  if (r.high > 0)     return { count: r.high,     color: '#f97316', bg: '#fff7ed', border: '#fed7aa' }
  if (r.medium > 0)   return { count: r.medium,   color: '#eab308', bg: '#fefce8', border: '#fef08a' }
  return null
}

function riskScore(deviceId) {
  const r = deviceRisk.value[deviceId]
  if (!r) return 0
  return r.critical * 100 + r.high * 10 + r.medium
}

function statusDot(s)   { return { online: 'bg-green-600', offline: 'bg-gray-400', locked: 'bg-red-600' }[s] }
function statusText(s)  { return { online: 'text-green-700', offline: 'text-gray-400', locked: 'text-red-600' }[s] }
function statusLabel(s) { return { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[s] || s }

const maxScreenTimeSec = computed(() =>
  screenTime.value.reduce((m, r) => Math.max(m, r.total_sec), 1)
)

function formatDuration(sec) {
  if (!sec) return '0m'
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(d) {
  const dt = new Date(d + 'T00:00:00')
  return dt.toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })
}

function timeAgo(d) {
  const m = Math.floor((now.value - new Date(d)) / 60000)
  if (m < 1) return 'ahora'
  if (m < 60) return `hace ${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `hace ${h}h`
  return `hace ${Math.floor(h / 24)}d`
}
</script>
