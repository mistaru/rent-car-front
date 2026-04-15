<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/axios/api';

interface BookingBar {
  id: number;
  customerName: string;
  customerEmail: string;
  pickupDate: string;
  dropoffDate: string;
  totalAmount: number;
  addOns: string[];
  status: string;
  paymentStatus: string;
}

interface VehicleRow {
  id: number;
  brand: string;
  model: string;
  licensePlate: string;
  year: number | null;
  bookings: BookingBar[];
}

// ─── State ────────────────────────────────────────────────
const loading    = ref(false);
const vehicles   = ref<VehicleRow[]>([]);
const startDate = ref<string>(getDefaultStartDate());   // ISO yyyy-MM-dd
const tooltip    = ref<{ visible: boolean; booking: BookingBar | null; x: number; y: number }>({
  visible: false, booking: null, x: 0, y: 0,
});

function getDefaultEndDate(): string {
  const today = new Date();
  today.setDate(today.getDate() + 17); // ~3 недели вперёд
  return today.toISOString().split('T')[0];
}

const endDateInput = ref<string>(getDefaultEndDate());

const daysCount = computed(() => {
  return daysBetween(startDate.value, endDateInput.value) + 1;
});

function getDefaultStartDate(): string {
  const today = new Date();
  today.setDate(today.getDate() - 3);
  return today.toISOString().split('T')[0];
}

// ─── Date helpers ─────────────────────────────────────────
function toISO(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(iso: string, n: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + n);
  return toISO(d);
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

const dateRange = computed<string[]>(() => {
  const range: string[] = [];
  for (let i = 0; i < daysCount.value; i++) {
    range.push(addDays(startDate.value, i));
  }
  return range;
});

const endDate = computed(() => endDateInput.value);

// ─── Navigation ───────────────────────────────────────────
function prevWeek() {
  startDate.value    = addDays(startDate.value, -7);
  endDateInput.value = addDays(endDateInput.value, -7);
  fetchData();
}
function nextWeek() {
  startDate.value    = addDays(startDate.value, 7);
  endDateInput.value = addDays(endDateInput.value, 7);
  fetchData();
}
function goToToday() {
  startDate.value    = getDefaultStartDate();
  endDateInput.value = getDefaultEndDate();
  fetchData();
}

// ─── Day label helpers ────────────────────────────────────
const weekdayShort = ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'];
const monthShort   = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

function dayLabel(iso: string): { wd: string; d: number; m: string } {
  const d = new Date(iso);
  return { wd: weekdayShort[d.getDay()], d: d.getDate(), m: monthShort[d.getMonth()] };
}

function isToday(iso: string): boolean {
  return iso === toISO(new Date());
}

function isWeekend(iso: string): boolean {
  const day = new Date(iso).getDay();
  return day === 0 || day === 6;
}

// ─── Gantt bar calculations ───────────────────────────────
const COL_W = 48; // px per day column

function barStyle(booking: BookingBar): Record<string, string> | null {
  const rangeStart = startDate.value;
  const rangeEnd   = endDate.value;

  // clip to visible range
  const bStart = booking.pickupDate  > rangeStart ? booking.pickupDate  : rangeStart;
  const bEnd   = booking.dropoffDate < rangeEnd   ? booking.dropoffDate : rangeEnd;

  if (bStart > rangeEnd || bEnd < rangeStart) return null;

  const offsetDays = daysBetween(rangeStart, bStart);
  const spanDays   = daysBetween(bStart, bEnd) + 1;

  const left  = offsetDays * COL_W;
  const width = spanDays   * COL_W - 4;

  return {
    left:  `${left}px`,
    width: `${width}px`,
  };
}

// ─── Status colors ────────────────────────────────────────
const statusColors: Record<string, string> = {
  CONFIRMED:       '#22c55e',
  PENDING_PAYMENT: '#f59e0b',
  CANCELLED:       '#ef4444',
  DRAFT:           '#94a3b8',
};

function bookingColor(booking: BookingBar): string {
  return statusColors[booking.status] || '#6366f1';
}

// ─── Tooltip ──────────────────────────────────────────────
function showTooltip(e: MouseEvent, booking: BookingBar) {
  tooltip.value = { visible: true, booking, x: e.clientX + 12, y: e.clientY - 8 };
}
function hideTooltip() {
  tooltip.value.visible = false;
}

// ─── API ──────────────────────────────────────────────────
async function fetchData() {
  loading.value = true;
  try {
    const data = await api.get<VehicleRow[]>('/api/v1/bookings/table-calendar', {
      params: { from: startDate.value, to: endDate.value },
    });
    vehicles.value = data;
  } catch (e) {
    console.error('Calendar fetch error:', e);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchData();
});

// ─── Misc ─────────────────────────────────────────────────
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${monthShort[d.getMonth()]} ${d.getFullYear()}`;
}

const totalWidth = computed(() => daysCount.value * COL_W);
</script>

<template>
  <div class="booking-calendar">

    <!-- ── Page Header ── -->
    <div class="cal-header mb-5">
      <v-container fluid class="px-6 py-5">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <div class="d-flex align-center ga-3">
            <v-avatar size="42" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">mdi-calendar-month</v-icon>
            </v-avatar>
            <div>
              <h1 class="text-h5 font-weight-bold">Календарь бронирований</h1>
              <p class="text-caption text-medium-emphasis">
                {{ formatDate(startDate) }} — {{ formatDate(endDate) }}
              </p>
            </div>
          </div>

          <!-- Nav controls -->
          <div class="d-flex align-center ga-2">
            <v-btn-group variant="outlined" density="compact" rounded="lg">
              <v-btn @click="prevWeek" icon="mdi-chevron-left" />
              <v-btn @click="goToToday" class="px-4">Сегодня</v-btn>
              <v-btn @click="nextWeek" icon="mdi-chevron-right" />
            </v-btn-group>

            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model="startDate"
                label="С"
                type="date"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                style="width: 160px"
                @change="fetchData"
              />
              <v-text-field
                v-model="endDateInput"
                label="По"
                type="date"
                variant="outlined"
                density="compact"
                rounded="lg"
                hide-details
                style="width: 160px"
                :min="startDate"
                @change="fetchData"
              />
            </div>

            <v-btn
              color="primary"
              variant="tonal"
              density="compact"
              rounded="lg"
              icon="mdi-refresh"
              :loading="loading"
              @click="fetchData"
            />
          </div>
        </div>
      </v-container>
    </div>

    <!-- ── Legend ── -->
    <v-container fluid class="px-6 pb-2">
      <div class="d-flex align-center ga-4 flex-wrap">
        <div v-for="(color, status) in statusColors" :key="status" class="d-flex align-center ga-1">
          <div class="legend-dot" :style="{ background: color }" />
          <span class="text-caption text-medium-emphasis">{{ status }}</span>
        </div>
      </div>
    </v-container>

    <!-- ── Loading ── -->
    <div v-if="loading" class="d-flex justify-center pa-12">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>

    <!-- ── Gantt table ── -->
    <v-container fluid class="px-6 pb-8" v-else>
      <v-card elevation="0" rounded="xl" class="gantt-card overflow-hidden">
        <div class="gantt-scroll-wrapper">
          <div class="gantt-table" :style="{ minWidth: `${280 + totalWidth}px` }">

            <!-- ── Column headers ── -->
            <div class="gantt-head">
              <!-- Sticky vehicle info header -->
              <div class="gantt-head__fixed">
                <span class="text-caption font-weight-bold text-medium-emphasis text-uppercase" style="letter-spacing:.06em">
                  Автомобиль
                </span>
              </div>

              <!-- Date columns -->
              <div class="gantt-head__dates" :style="{ width: `${totalWidth}px` }">
                <div
                  v-for="iso in dateRange"
                  :key="iso"
                  class="gantt-head__day"
                  :class="{
                    'gantt-head__day--today':   isToday(iso),
                    'gantt-head__day--weekend': isWeekend(iso),
                  }"
                  :style="{ width: `${COL_W}px` }"
                >
                  <span class="day-wd">{{ dayLabel(iso).wd }}</span>
                  <span class="day-d">{{ dayLabel(iso).d }}</span>
                  <span class="day-m">{{ dayLabel(iso).m }}</span>
                </div>
              </div>
            </div>

            <!-- ── Vehicle rows ── -->
            <div
              v-for="vehicle in vehicles"
              :key="vehicle.id"
              class="gantt-row"
            >
              <!-- Fixed left column: vehicle info -->
              <div class="gantt-row__fixed">
                <div class="vehicle-info">
                  <div class="text-body-2 font-weight-bold text-truncate" style="max-width:160px">
                    {{ vehicle.brand }} {{ vehicle.model }}
                  </div>
                  <div class="d-flex align-center ga-2 mt-0">
                    <span v-if="vehicle.licensePlate" class="plate-badge">{{ vehicle.licensePlate }}</span>
                    <span v-if="vehicle.year" class="text-caption text-medium-emphasis">{{ vehicle.year }}</span>
                  </div>
                </div>
              </div>

              <!-- Scrollable booking area -->
              <div class="gantt-row__bars" :style="{ width: `${totalWidth}px` }">
                <!-- Grid lines -->
                <div
                  v-for="iso in dateRange"
                  :key="iso"
                  class="gantt-grid-col"
                  :class="{
                    'gantt-grid-col--today':   isToday(iso),
                    'gantt-grid-col--weekend': isWeekend(iso),
                  }"
                  :style="{ width: `${COL_W}px`, left: `${daysBetween(startDate, iso) * COL_W}px` }"
                />

                <!-- Booking bars -->
                <template v-for="booking in vehicle.bookings" :key="booking.id">
                  <div
                    v-if="barStyle(booking)"
                    class="booking-bar"
                    :style="{
                      ...barStyle(booking),
                      background: bookingColor(booking),
                    }"
                    @mouseenter="showTooltip($event, booking)"
                    @mouseleave="hideTooltip"
                  >
                    <span class="booking-bar__text">
                      {{ booking.customerName }} ·
                      {{ booking.totalAmount.toFixed(0) }}$
                      <template v-if="booking.addOns.length">
                        · {{ booking.addOns.join(', ') }}
                      </template>
                    </span>
                  </div>
                </template>
              </div>
            </div>

            <!-- Empty state -->
            <div v-if="vehicles.length === 0" class="text-center py-12">
              <v-icon size="56" color="grey-lighten-2">mdi-calendar-blank</v-icon>
              <div class="text-body-2 text-medium-emphasis mt-2">Бронирований не найдено</div>
            </div>

          </div>
        </div>
      </v-card>
    </v-container>

    <!-- ── Tooltip ── -->
    <Teleport to="body">
      <div
        v-if="tooltip.visible && tooltip.booking"
        class="cal-tooltip"
        :style="{ top: `${tooltip.y}px`, left: `${tooltip.x}px` }"
      >
        <div class="cal-tooltip__name">{{ tooltip.booking.customerName }}</div>
        <div class="cal-tooltip__email text-caption">{{ tooltip.booking.customerEmail }}</div>
        <v-divider class="my-1" />
        <div class="cal-tooltip__row">
          <v-icon size="12">mdi-calendar-arrow-right</v-icon>
          {{ formatDate(tooltip.booking.pickupDate) }}
        </div>
        <div class="cal-tooltip__row">
          <v-icon size="12">mdi-calendar-arrow-left</v-icon>
          {{ formatDate(tooltip.booking.dropoffDate) }}
        </div>
        <div class="cal-tooltip__row">
          <v-icon size="12">mdi-cash</v-icon>
          ${{ tooltip.booking.totalAmount.toFixed(2) }}
        </div>
        <div v-if="tooltip.booking.addOns.length" class="cal-tooltip__row mt-1">
          <v-icon size="12">mdi-plus-box-multiple</v-icon>
          {{ tooltip.booking.addOns.join(', ') }}
        </div>
        <div class="cal-tooltip__status mt-1"
             :style="{ background: bookingColor(tooltip.booking) + '22', color: bookingColor(tooltip.booking) }">
          {{ tooltip.booking.status }}
        </div>
      </div>
    </Teleport>

  </div>
</template>

<style scoped>
.booking-calendar {
  background: #f8f7fc;
  min-height: 100vh;
}

/* Header */
.cal-header {
  background: white;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

/* Legend */
.legend-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Gantt card */
.gantt-card {
  border: 1px solid rgba(0,0,0,0.06);
}

.gantt-scroll-wrapper {
  overflow-x: auto;
  overflow-y: visible;
}

.gantt-table {
  display: flex;
  flex-direction: column;
  font-size: 13px;
}

/* ── Head ── */
.gantt-head {
  display: flex;
  align-items: stretch;
  background: #f8f7fc;
  border-bottom: 2px solid rgba(103,58,183,0.12);
  position: sticky;
  top: 0;
  z-index: 20;
}

.gantt-head__fixed {
  width: 280px;
  min-width: 280px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(0,0,0,0.07);
  position: sticky;
  left: 0;
  background: #f8f7fc;
  z-index: 21;
}

.gantt-head__dates {
  display: flex;
  flex-shrink: 0;
}

.gantt-head__day {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 6px 2px;
  border-right: 1px solid rgba(0,0,0,0.05);
  gap: 1px;
  flex-shrink: 0;
}

.gantt-head__day--today {
  background: rgba(103,58,183,0.08);
}

.gantt-head__day--weekend {
  background: rgba(0,0,0,0.025);
}

.day-wd {
  font-size: 10px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.day-d {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1;
}
.day-m {
  font-size: 9px;
  color: #94a3b8;
  text-transform: uppercase;
}

.gantt-head__day--today .day-d {
  color: #673ab7;
}
.gantt-head__day--today .day-wd,
.gantt-head__day--today .day-m {
  color: #9c6fd4;
}

/* ── Rows ── */
.gantt-row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  min-height: 52px;
}

.gantt-row:hover {
  background: rgba(103,58,183,0.02);
}

.gantt-row__fixed {
  width: 280px;
  min-width: 280px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  border-right: 1px solid rgba(0,0,0,0.07);
  position: sticky;
  left: 0;
  background: white;
  z-index: 10;
}

.gantt-row:hover .gantt-row__fixed {
  background: #faf9fe;
}

.vehicle-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.plate-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 6px;
  background: rgba(103,58,183,0.1);
  color: #673ab7;
  border-radius: 4px;
  letter-spacing: 0.04em;
}

/* Bars area */
.gantt-row__bars {
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
}

/* Grid columns (backgrounds) */
.gantt-grid-col {
  position: absolute;
  top: 0;
  bottom: 0;
  border-right: 1px solid rgba(0,0,0,0.04);
  pointer-events: none;
}

.gantt-grid-col--today {
  background: rgba(103,58,183,0.05);
}

.gantt-grid-col--weekend {
  background: rgba(0,0,0,0.018);
}

/* Booking bars */
.booking-bar {
  position: absolute;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 8px;
  cursor: pointer;
  overflow: hidden;
  transition: filter 0.15s ease, transform 0.15s ease;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}

.booking-bar:hover {
  filter: brightness(1.08);
  transform: scaleY(1.06);
  z-index: 5;
}

.booking-bar__text {
  font-size: 11px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  text-shadow: 0 1px 2px rgba(0,0,0,0.2);
  pointer-events: none;
}

/* ── Tooltip ── */
.cal-tooltip {
  position: fixed;
  z-index: 9999;
  background: white;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 10px;
  padding: 10px 12px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  min-width: 200px;
  max-width: 280px;
  pointer-events: none;
}

.cal-tooltip__name {
  font-size: 13px;
  font-weight: 700;
  color: #1e293b;
}

.cal-tooltip__email {
  color: #64748b;
  margin-top: 1px;
}

.cal-tooltip__row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #475569;
  margin-top: 3px;
}

.cal-tooltip__status {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 20px;
  letter-spacing: 0.05em;
}
</style>
