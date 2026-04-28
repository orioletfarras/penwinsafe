<template>
  <div class="space-y-4">

    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 text-[12px]" style="color:#9ca3af">
      <router-link to="/dashboard/devices" class="transition-colors" style="color:#006fff" onmouseenter="this.style.opacity='0.7'" onmouseleave="this.style.opacity='1'">
        Dispositivos
      </router-link>
      <span>/</span>
      <span style="color:#374151">{{ device?.name || deviceId }}</span>
    </div>

    <!-- Loading skeleton -->
    <template v-if="loading">
      <div class="card p-5 space-y-3">
        <div class="h-5 rounded animate-pulse w-48" style="background:#f3f4f6"></div>
        <div class="h-3 rounded animate-pulse w-32" style="background:#f3f4f6"></div>
      </div>
    </template>

    <template v-else-if="!device">
      <div class="card empty-state">
        <div class="empty-state-icon"><ComputerDesktopIcon /></div>
        <p class="empty-state-title">Dispositivo no encontrado</p>
        <p class="empty-state-desc">Este dispositivo no existe o no tienes acceso.</p>
        <router-link to="/dashboard/devices" class="btn btn-primary btn-sm mt-3">Volver a Dispositivos</router-link>
      </div>
    </template>

    <template v-else>
      <!-- Device header card -->
      <div class="card p-5">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <!-- Back button + icon -->
            <button @click="$router.back()"
              class="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors mt-0.5"
              style="color:#9ca3af;border:1px solid #e5e7eb"
              onmouseenter="this.style.background='#f9fafb'"
              onmouseleave="this.style.background='transparent'">
              <ArrowLeftIcon class="w-4 h-4" />
            </button>
            <div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
              :style="device.status === 'online' ? 'background:#f0fdf4' : device.status === 'locked' ? 'background:#fef2f2' : 'background:#f9fafb'">
              <ComputerDesktopIcon class="w-6 h-6"
                :style="device.status === 'online' ? 'color:#16a34a' : device.status === 'locked' ? 'color:#dc2626' : 'color:#9ca3af'" />
            </div>
            <div>
              <div class="flex items-center gap-3 flex-wrap">
                <h1 class="text-[20px] font-bold" style="color:#111827">{{ device.name }}</h1>
                <span class="inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1 rounded-full"
                  :style="device.status === 'online'
                    ? 'background:#f0fdf4;color:#15803d;border:1px solid #bbf7d0'
                    : device.status === 'locked'
                    ? 'background:#fef2f2;color:#dc2626;border:1px solid #fecaca'
                    : 'background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb'">
                  <span class="w-2 h-2 rounded-full flex-shrink-0"
                    :style="device.status === 'online' ? 'background:#16a34a' : device.status === 'locked' ? 'background:#dc2626' : 'background:#9ca3af'"></span>
                  {{ statusLabel(device.status) }}
                </span>
                <span v-if="device.groups?.name"
                  class="inline-flex items-center text-[12px] font-medium px-3 py-1 rounded-full"
                  style="background:#eff6ff;color:#1d4ed8;border:1px solid #bfdbfe">
                  {{ device.groups.name }}
                </span>
              </div>
              <div class="flex items-center gap-4 mt-2 flex-wrap">
                <span class="flex items-center gap-1.5 text-[12px]" style="color:#6b7280">
                  <span class="font-mono">{{ device.ip_address || '—' }}</span>
                </span>
                <span v-if="device.os_info" class="text-[12px]" style="color:#9ca3af">{{ device.os_info }}</span>
                <span class="text-[12px]" style="color:#9ca3af">
                  Última actividad: <span style="color:#374151">{{ device.last_seen ? timeAgo(device.last_seen) : 'Nunca' }}</span>
                </span>
                <NetworkModeBadge :mode="device.network_mode" :status="device.status" />
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center gap-2 flex-shrink-0">
            <button v-if="device.status === 'online'" @click="takeScreenshot"
              class="btn btn-secondary btn-sm">
              <CameraIcon class="w-3.5 h-3.5" /> Screenshot
            </button>
            <button @click="toggleLock"
              class="btn btn-sm"
              :class="device.status === 'locked' ? 'btn-success' : 'btn-danger'">
              <LockOpenIcon v-if="device.status === 'locked'" class="w-3.5 h-3.5" />
              <LockClosedIcon v-else class="w-3.5 h-3.5" />
              {{ device.status === 'locked' ? 'Desbloquear' : 'Bloquear' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs + content -->
      <div class="card overflow-hidden">
        <!-- Tab bar -->
        <div class="flex" style="border-bottom:1px solid #e5e7eb;background:#f9fafb">
          <button v-for="tab in tabs" :key="tab.id"
            @click="activeTab = tab.id"
            class="relative flex items-center gap-2 px-4 py-3 text-[12px] font-medium transition-colors"
            :style="activeTab === tab.id
              ? 'color:#006fff;border-bottom:2px solid #006fff;background:#fff'
              : 'color:#6b7280;border-bottom:2px solid transparent'">
            <component :is="tab.icon" class="w-4 h-4" />
            <span>{{ tab.label }}</span>
            <span v-if="tab.count > 0"
              class="text-[10px] font-bold px-1.5 py-0.5 rounded"
              :style="activeTab === tab.id
                ? 'background:#eff6ff;color:#006fff;border:1px solid #bfdbfe'
                : 'background:#f3f4f6;color:#6b7280'">
              {{ tab.count > 99 ? '99+' : tab.count }}
            </span>
          </button>
        </div>

        <!-- Tab content area -->
        <div class="p-6">

          <!-- URLs -->
          <div v-if="activeTab === 'urls'">
            <div v-if="!loadingDetail && urlEvents.length > 0" class="mb-4">
              <div class="flex items-center gap-2 px-3 rounded-lg" style="background:#f9fafb;border:1px solid #e5e7eb;height:36px;max-width:320px">
                <MagnifyingGlassIcon class="w-4 h-4 flex-shrink-0" style="color:#9ca3af" />
                <input v-model="urlSearch" placeholder="Filtrar URLs..." class="flex-1 bg-transparent text-[13px] outline-none" style="color:#374151" />
              </div>
            </div>
            <div v-if="loadingDetail" class="space-y-2">
              <div v-for="i in 8" :key="i" class="h-12 rounded animate-pulse" style="background:#f9fafb"></div>
            </div>
            <div v-else-if="filteredUrlEvents.length === 0" class="empty-state">
              <div class="empty-state-icon"><GlobeAltIcon /></div>
              <p class="empty-state-title">{{ urlSearch ? 'Sin resultados' : 'Sin historial de navegación' }}</p>
            </div>
            <div v-else class="card overflow-hidden">
              <div v-for="e in filteredUrlEvents" :key="e.id"
                class="px-4 py-3 transition-colors flex items-start gap-3"
                style="border-bottom:1px solid #f9fafb"
                onmouseenter="this.style.background='#f9fafb'"
                onmouseleave="this.style.background='transparent'">
                <img :src="`https://www.google.com/s2/favicons?domain=${e.domain}&sz=16`"
                  class="w-4 h-4 mt-0.5 flex-shrink-0 rounded" @error="ev => ev.target.style.display='none'" />
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium truncate" style="color:#111827">{{ e.title || e.domain }}</p>
                  <div class="flex items-center gap-3 mt-0.5 flex-wrap">
                    <p class="text-[11px] truncate" style="color:#9ca3af">{{ e.domain }}</p>
                    <span v-if="e.ai_category"
                      class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style="background:#eff6ff;color:#2563eb;border:1px solid #bfdbfe">
                      {{ e.ai_category }}
                    </span>
                  </div>
                </div>
                <span class="text-[11px] flex-shrink-0" style="color:#9ca3af">{{ timeAgo(e.visited_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Búsquedas -->
          <div v-if="activeTab === 'searches'">
            <div v-if="loadingDetail" class="space-y-2">
              <div v-for="i in 8" :key="i" class="h-12 rounded animate-pulse" style="background:#f9fafb"></div>
            </div>
            <div v-else-if="searchEvents.length === 0" class="empty-state">
              <div class="empty-state-icon"><MagnifyingGlassIcon /></div>
              <p class="empty-state-title">Sin búsquedas registradas</p>
            </div>
            <div v-else class="card overflow-hidden">
              <div v-for="e in searchEvents" :key="e.id"
                class="px-4 py-3 transition-colors flex items-start gap-3"
                style="border-bottom:1px solid #f9fafb"
                onmouseenter="this.style.background='#f9fafb'"
                onmouseleave="this.style.background='transparent'">
                <MagnifyingGlassIcon class="w-4 h-4 mt-0.5 flex-shrink-0" style="color:#9ca3af" />
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium" style="color:#111827">{{ e.query }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[11px] capitalize" style="color:#9ca3af">{{ e.engine }}</span>
                    <span v-if="e.ai_risk_level && e.ai_risk_level !== 'safe'"
                      class="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                      :class="riskClass(e.ai_risk_level)">
                      {{ e.ai_risk_level }}
                    </span>
                  </div>
                </div>
                <span class="text-[11px] flex-shrink-0" style="color:#9ca3af">{{ timeAgo(e.searched_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Bloqueados -->
          <div v-if="activeTab === 'blocked'">
            <div v-if="loadingDetail" class="space-y-2">
              <div v-for="i in 8" :key="i" class="h-12 rounded animate-pulse" style="background:#f9fafb"></div>
            </div>
            <div v-else-if="blockedEvents.length === 0" class="empty-state">
              <div class="empty-state-icon"><NoSymbolIcon /></div>
              <p class="empty-state-title">Sin contenido bloqueado</p>
            </div>
            <div v-else class="card overflow-hidden">
              <div v-for="e in blockedEvents" :key="e.id"
                class="px-4 py-3 transition-colors flex items-start gap-3"
                style="border-bottom:1px solid #f9fafb"
                onmouseenter="this.style.background='#fef2f2'"
                onmouseleave="this.style.background='transparent'">
                <div class="w-5 h-5 mt-0.5 flex-shrink-0 rounded flex items-center justify-center" style="background:#fef2f2">
                  <NoSymbolIcon class="w-3.5 h-3.5" style="color:#dc2626" />
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-medium truncate" style="color:#111827">{{ e.query || e.domain }}</p>
                  <div class="flex items-center gap-2 mt-0.5">
                    <span class="text-[10px] px-1.5 py-0.5 rounded font-medium"
                      style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca">
                      {{ reasonLabel(e.reason) }}
                    </span>
                    <span v-if="e.query && e.domain !== 'search'" class="text-[11px] truncate" style="color:#9ca3af">
                      {{ e.domain }}
                    </span>
                  </div>
                </div>
                <span class="text-[11px] flex-shrink-0" style="color:#9ca3af">{{ timeAgo(e.blocked_at) }}</span>
              </div>
            </div>
          </div>

          <!-- Uso -->
          <div v-if="activeTab === 'usage'">
            <div v-if="loadingDetail" class="space-y-2">
              <div v-for="i in 8" :key="i" class="h-8 rounded animate-pulse" style="background:#f9fafb"></div>
            </div>
            <template v-else>
              <div class="grid grid-cols-2 gap-6">
                <!-- Screen time -->
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider mb-4" style="color:#6b7280">Tiempo de pantalla · 14 días</p>
                  <div v-if="screenTime.length === 0" class="text-[13px]" style="color:#9ca3af">Sin datos aún</div>
                  <div v-else class="space-y-2">
                    <div v-for="row in screenTime" :key="row.date" class="flex items-center gap-3">
                      <span class="text-[11px] font-mono w-[80px] flex-shrink-0" style="color:#6b7280">{{ formatDate(row.date) }}</span>
                      <div class="flex-1 rounded-full overflow-hidden" style="background:#f3f4f6;height:8px">
                        <div class="h-full rounded-full transition-all"
                          style="background:#006fff"
                          :style="{ width: maxScreenTimeSec > 0 ? (row.total_sec / maxScreenTimeSec * 100) + '%' : '0%' }">
                        </div>
                      </div>
                      <span class="text-[11px] w-[44px] text-right flex-shrink-0" style="color:#374151">{{ formatDuration(row.total_sec) }}</span>
                    </div>
                  </div>
                </div>
                <!-- Top domains -->
                <div>
                  <p class="text-[11px] font-semibold uppercase tracking-wider mb-4" style="color:#6b7280">Dominios por tiempo · 7 días</p>
                  <div v-if="domainTime.length === 0" class="text-[13px]" style="color:#9ca3af">Sin datos aún</div>
                  <div v-else class="space-y-2">
                    <div v-for="(row, i) in domainTime" :key="row.domain" class="flex items-center gap-3">
                      <span class="text-[11px] w-5 text-right flex-shrink-0" style="color:#9ca3af">{{ i + 1 }}</span>
                      <img :src="`https://www.google.com/s2/favicons?domain=${row.domain}&sz=16`"
                        class="w-4 h-4 flex-shrink-0 rounded" @error="e => e.target.style.display='none'" />
                      <span class="flex-1 text-[12px] truncate" style="color:#111827">{{ row.domain }}</span>
                      <div class="w-[80px] rounded-full overflow-hidden flex-shrink-0" style="background:#f3f4f6;height:6px">
                        <div class="h-full rounded-full" style="background:#6366f1"
                          :style="{ width: domainTime[0]?.sec > 0 ? (row.sec / domainTime[0].sec * 100) + '%' : '0%' }">
                        </div>
                      </div>
                      <span class="text-[11px] w-[44px] text-right flex-shrink-0" style="color:#374151">{{ formatDuration(row.sec) }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>

          <!-- Actividad -->
          <div v-if="activeTab === 'activity'">
            <p class="text-[11px] font-semibold uppercase tracking-wider mb-4" style="color:#6b7280">Búsquedas por hora · últimas 24h</p>
            <div v-if="loadingDetail" class="h-32 rounded animate-pulse" style="background:#f9fafb"></div>
            <template v-else>
              <div class="flex items-end gap-1" style="height:120px">
                <div v-for="(v, h) in activityHours" :key="h"
                  class="flex-1 rounded-sm transition-all cursor-default"
                  :title="`${h}:00 — ${v} búsquedas`"
                  :style="`height:${activityHours.some(x=>x>0) ? Math.max(4, Math.round(v/Math.max(...activityHours)*112)) : 4}px;background:${v > 0 ? '#006fff' : '#f3f4f6'};opacity:${v > 0 ? 0.3 + 0.7*(v/Math.max(1,...activityHours)) : 1};border-radius:3px`">
                </div>
              </div>
              <div class="flex justify-between mt-2">
                <span class="text-[10px]" style="color:#d1d5db">00h</span>
                <span class="text-[10px]" style="color:#d1d5db">06h</span>
                <span class="text-[10px]" style="color:#d1d5db">12h</span>
                <span class="text-[10px]" style="color:#d1d5db">18h</span>
                <span class="text-[10px]" style="color:#d1d5db">23h</span>
              </div>
              <p v-if="!activityHours.some(x=>x>0)" class="text-center text-[13px] mt-6" style="color:#9ca3af">Sin búsquedas en las últimas 24h</p>
              <div v-else class="mt-4 text-[12px]" style="color:#6b7280">
                Total: <span class="font-semibold" style="color:#111827">{{ activityHours.reduce((a,b)=>a+b,0) }}</span> búsquedas en las últimas 24h
              </div>
            </template>
          </div>

          <!-- Notas -->
          <div v-if="activeTab === 'notes'" class="max-w-lg space-y-3">
            <p class="text-[12px]" style="color:#9ca3af">Notas internas sobre este dispositivo. Solo visibles para administradores.</p>
            <textarea
              v-model="deviceNotes"
              rows="8"
              placeholder="Escribe una nota..."
              class="w-full text-[13px] rounded-lg px-4 py-3 outline-none resize-none transition-colors"
              style="background:#f9fafb;border:1px solid #e5e7eb;color:#374151;line-height:1.7"
              onfocus="this.style.borderColor='#006fff'"
              onblur="this.style.borderColor='#e5e7eb'">
            </textarea>
            <div class="flex justify-end">
              <button @click="saveNotes" :disabled="savingNotes" class="btn btn-primary">
                {{ savingNotes ? 'Guardando...' : 'Guardar nota' }}
              </button>
            </div>
          </div>

          <!-- Configuración -->
          <div v-if="activeTab === 'settings'" class="max-w-xl space-y-6">

            <!-- Nombre -->
            <div class="card p-4 space-y-3">
              <p class="text-[12px] font-semibold uppercase tracking-wider" style="color:#6b7280">Nombre del dispositivo</p>
              <div class="flex gap-3">
                <input v-model="deviceEditName" class="input flex-1" placeholder="Nombre..." />
                <button @click="saveDeviceName" :disabled="savingName || !deviceEditName.trim()" class="btn btn-primary flex-shrink-0">
                  {{ savingName ? 'Guardando...' : 'Guardar' }}
                </button>
              </div>
            </div>

            <!-- Clase -->
            <div class="card p-4 space-y-3">
              <p class="text-[12px] font-semibold uppercase tracking-wider" style="color:#6b7280">Clase asignada</p>
              <div class="flex gap-3 items-center">
                <select
                  :value="device.group_id || ''"
                  @change="assignGroup($event.target.value)"
                  class="select flex-1">
                  <option value="">Sin clase asignada</option>
                  <option v-for="g in groups" :key="g.id" :value="g.id">{{ g.name }}</option>
                </select>
                <span v-if="assigningGroup" class="text-[12px] flex-shrink-0" style="color:#9ca3af">Guardando...</span>
              </div>
            </div>

            <!-- Info -->
            <div class="card p-4 space-y-3">
              <p class="text-[12px] font-semibold uppercase tracking-wider" style="color:#6b7280">Información del dispositivo</p>
              <div class="space-y-3">
                <div class="flex justify-between text-[13px]" style="border-bottom:1px solid #f3f4f6;padding-bottom:12px">
                  <span style="color:#9ca3af">ID</span>
                  <span class="font-mono text-[11px]" style="color:#374151">{{ device.id }}</span>
                </div>
                <div class="flex justify-between text-[13px]" style="border-bottom:1px solid #f3f4f6;padding-bottom:12px">
                  <span style="color:#9ca3af">Sistema operativo</span>
                  <span style="color:#374151">{{ device.os_info || '—' }}</span>
                </div>
                <div class="flex justify-between text-[13px]" style="border-bottom:1px solid #f3f4f6;padding-bottom:12px">
                  <span style="color:#9ca3af">Dirección IP</span>
                  <span class="font-mono" style="color:#374151">{{ device.ip_address || '—' }}</span>
                </div>
                <div class="flex justify-between text-[13px]" style="border-bottom:1px solid #f3f4f6;padding-bottom:12px">
                  <span style="color:#9ca3af">Modo de red</span>
                  <NetworkModeBadge :mode="device.network_mode" :status="device.status" />
                </div>
                <div class="flex justify-between text-[13px]">
                  <span style="color:#9ca3af">Primera actividad</span>
                  <span style="color:#374151">{{ device.created_at ? new Date(device.created_at).toLocaleDateString('es-ES') : '—' }}</span>
                </div>
              </div>
            </div>

            <!-- Zona de peligro -->
            <div class="card p-4" style="border-color:#fecaca">
              <p class="text-[12px] font-semibold uppercase tracking-wider mb-3" style="color:#dc2626">Zona de peligro</p>
              <p class="text-[12px] mb-3" style="color:#9ca3af">Al eliminar el dispositivo, tendrá que volver a activarse con el código de centro.</p>
              <router-link to="/dashboard/devices"
                class="btn btn-ghost btn-sm text-[12px]" style="color:#9ca3af">
                ← Volver a Dispositivos
              </router-link>
            </div>

          </div>

        </div>
      </div>
    </template>

    <!-- Screenshot modal -->
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

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../lib/supabase'
import { logAction } from '../../lib/audit'
import NetworkModeBadge from '../../components/NetworkModeBadge.vue'
import Tooltip from '../../components/Tooltip.vue'
import { useToast } from '../../lib/toast'
import {
  ComputerDesktopIcon, MagnifyingGlassIcon, XMarkIcon, NoSymbolIcon,
  GlobeAltIcon, ChartBarIcon, BoltIcon, PencilSquareIcon, Cog6ToothIcon,
  ArrowLeftIcon, CameraIcon, LockClosedIcon, LockOpenIcon,
} from '@heroicons/vue/24/outline'

const { error: toastError, success: toastSuccess } = useToast()
const route    = useRoute()
const router   = useRouter()
const deviceId = route.params.id

const loading        = ref(true)
const loadingDetail  = ref(false)
const device         = ref(null)
const groups         = ref([])
const now            = ref(Date.now())
const activeTab      = ref('urls')
const deviceNotes    = ref('')
const savingNotes    = ref(false)
const deviceEditName = ref('')
const savingName     = ref(false)
const assigningGroup = ref(false)
const screenshotModal = ref(null)

const urlEvents      = ref([])
const searchEvents   = ref([])
const blockedEvents  = ref([])
const screenTime     = ref([])
const domainTime     = ref([])
const activityHours  = ref(new Array(24).fill(0))
const urlSearch      = ref('')

const filteredUrlEvents = computed(() => {
  if (!urlSearch.value) return urlEvents.value
  const q = urlSearch.value.toLowerCase()
  return urlEvents.value.filter(e =>
    e.domain?.toLowerCase().includes(q) || e.title?.toLowerCase().includes(q)
  )
})

const tabs = computed(() => [
  { id: 'urls',     label: 'URLs',         icon: GlobeAltIcon,        count: urlEvents.value.length },
  { id: 'searches', label: 'Búsquedas',    icon: MagnifyingGlassIcon, count: searchEvents.value.length },
  { id: 'blocked',  label: 'Bloqueados',   icon: NoSymbolIcon,        count: blockedEvents.value.length },
  { id: 'usage',    label: 'Uso',          icon: ChartBarIcon,        count: 0 },
  { id: 'activity', label: 'Actividad',    icon: BoltIcon,            count: 0 },
  { id: 'notes',    label: 'Notas',        icon: PencilSquareIcon,    count: 0 },
  { id: 'settings', label: 'Configuración',icon: Cog6ToothIcon,       count: 0 },
])

const maxScreenTimeSec = computed(() =>
  screenTime.value.reduce((m, r) => Math.max(m, r.total_sec), 1)
)

onMounted(async () => {
  const [{ data: dev }, { data: grps }] = await Promise.all([
    supabase.from('devices').select('*, groups(name)').eq('id', deviceId).single(),
    supabase.from('groups').select('id, name').order('name'),
  ])
  device.value = dev || null
  groups.value = grps || []
  loading.value = false

  if (!dev) return
  deviceNotes.value   = dev.notes || ''
  deviceEditName.value = dev.name || ''

  await loadHistory()

  const ticker = setInterval(() => { now.value = Date.now() }, 30000)
  // Subscribe to real-time updates for this device
  supabase.channel(`device-detail-${deviceId}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'devices', filter: `id=eq.${deviceId}` }, p => {
      if (device.value) Object.assign(device.value, p.new)
    })
    .subscribe()
})

async function loadHistory() {
  loadingDetail.value = true

  const [urls, searches, blocked] = await Promise.all([
    supabase.from('url_events').select('*').eq('device_id', deviceId).order('visited_at', { ascending: false }).limit(100),
    supabase.from('search_events').select('*').eq('device_id', deviceId).order('searched_at', { ascending: false }).limit(100),
    supabase.from('blocked_events').select('*').eq('device_id', deviceId).order('blocked_at', { ascending: false }).limit(100),
  ])

  urlEvents.value     = urls.data || []
  searchEvents.value  = searches.data || []
  blockedEvents.value = blocked.data || []

  // Hourly activity
  const buckets = new Array(24).fill(0)
  const since24 = Date.now() - 24 * 3600 * 1000
  searchEvents.value.forEach(e => {
    const t = new Date(e.searched_at).getTime()
    if (t >= since24) buckets[new Date(e.searched_at).getHours()]++
  })
  activityHours.value = buckets

  // Screen time
  const { data: st } = await supabase.from('screen_time')
    .select('date, total_sec').eq('device_id', deviceId)
    .order('date', { ascending: false }).limit(14)
  screenTime.value = st || []

  // Domain time
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
  savingNotes.value = true
  const { error } = await supabase.from('devices').update({ notes: deviceNotes.value }).eq('id', deviceId)
  savingNotes.value = false
  if (error) { toastError('Error al guardar nota'); return }
  if (device.value) device.value.notes = deviceNotes.value
  toastSuccess('Nota guardada')
}

async function saveDeviceName() {
  if (!deviceEditName.value.trim()) return
  savingName.value = true
  const { error } = await supabase.from('devices').update({ name: deviceEditName.value.trim() }).eq('id', deviceId)
  savingName.value = false
  if (error) { toastError('Error al renombrar'); return }
  if (device.value) device.value.name = deviceEditName.value.trim()
  logAction('device_rename', deviceEditName.value.trim())
  toastSuccess('Nombre actualizado')
}

async function assignGroup(groupId) {
  assigningGroup.value = true
  const newGroupId = groupId || null
  const { error } = await supabase.from('devices').update({ group_id: newGroupId }).eq('id', deviceId)
  if (error) { toastError('Error al asignar clase'); assigningGroup.value = false; return }
  if (device.value) {
    device.value.group_id = newGroupId
    device.value.groups = groups.value.find(g => g.id === newGroupId) || null
  }
  assigningGroup.value = false
  toastSuccess('Clase actualizada')
}

async function toggleLock() {
  if (!device.value) return
  const newStatus = device.value.status === 'locked' ? 'offline' : 'locked'
  const { error } = await supabase.from('devices').update({ status: newStatus }).eq('id', deviceId)
  if (error) { toastError('Error al cambiar estado'); return }
  logAction(newStatus === 'locked' ? 'device_lock' : 'device_unlock', device.value.name)
  device.value.status = newStatus
}

async function takeScreenshot() {
  if (!device.value) return
  screenshotModal.value = { deviceName: device.value.name, takenAt: 'Capturando...', image: null, reqId: null }

  const { data: req, error } = await supabase
    .from('screenshot_requests')
    .insert({ device_id: deviceId, status: 'pending' })
    .select('id').single()

  if (error || !req) { screenshotModal.value = null; return }
  screenshotModal.value.reqId = req.id

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

function statusLabel(s) { return { online: 'Online', offline: 'Offline', locked: 'Bloqueado' }[s] || s }

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
