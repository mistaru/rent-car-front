<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from "@/axios/api";


interface CalendarBooking {
  id: number;
  vehicleName: string;
  vehicleImage: string;
  carClass: string;
  customerName: string;
  pickupDate: string;
  dropoffDate: string;
  days: number;
  status: string;
  paymentStatus: string;
  totalAmount: number;
  color: string;
}

const bookings = ref<CalendarBooking[]>([]);
const loading = ref(false);
const viewMode = ref<'month' | 'week'>('month');
const currentDate = ref(new Date());
const detailDialog = ref(false);
const selectedBooking = ref<CalendarBooking | null>(null);

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  CONFIRMED: { color: 'success', icon: 'mdi-check-circle', label: 'Подтверждён' },
  PENDING_PAYMENT: { color: 'warning', icon: 'mdi-clock-outline', label: 'Ожидает' },
  CANCELLED: { color: 'error', icon: 'mdi-close-circle', label: 'Отменён' },
  DRAFT: { color: 'grey', icon: 'mdi-pencil-outline', label: 'Черновик' },
};

async function fetchCalendar() {
  loading.value = true;
  try {
    bookings.value = await api.get<CalendarBooking[]>(`/api/v1/bookings/calendar`);
  } catch (e) {
    console.error('fetchCalendar error:', e);
  } finally {
    loading.value = false;
  }
}

// Calendar helpers
const currentMonth = computed(() =>
  currentDate.value.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })
);

const currentWeekLabel = computed(() => {
  const start = getWeekStart(currentDate.value);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })} — ${end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })}`;
});

function getWeekStart(d: Date) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(date.setDate(diff));
}

// Generate days for month view
const calendarDays = computed(() => {
  const year = currentDate.value.getFullYear();
  const month = currentDate.value.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Monday
  let startDayOfWeek = firstDay.getDay();
  if (startDayOfWeek === 0) startDayOfWeek = 7;
  const startDate = new Date(firstDay);
  startDate.setDate(startDate.getDate() - (startDayOfWeek - 1));

  const days: Array<{ date: Date; dateStr: string; isCurrentMonth: boolean; isToday: boolean; bookings: CalendarBooking[] }> = [];

  for (let i = 0; i < 42; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateISO(d);
    const isCurrentMonth = d.getMonth() === month;
    const isToday = dateStr === formatDateISO(new Date());

    const dayBookings = bookings.value.filter(b => {
      return dateStr >= b.pickupDate && dateStr <= b.dropoffDate;
    });

    days.push({ date: d, dateStr, isCurrentMonth, isToday, bookings: dayBookings });
  }
  return days;
});

// Week view days
const weekDays = computed(() => {
  const start = getWeekStart(currentDate.value);
  const days: Array<{ date: Date; dateStr: string; isToday: boolean; bookings: CalendarBooking[] }> = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const dateStr = formatDateISO(d);
    const isToday = dateStr === formatDateISO(new Date());
    const dayBookings = bookings.value.filter(b => dateStr >= b.pickupDate && dateStr <= b.dropoffDate);
    days.push({ date: d, dateStr, isToday, bookings: dayBookings });
  }
  return days;
});

function formatDateISO(d: Date) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function prevPeriod() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') d.setMonth(d.getMonth() - 1);
  else d.setDate(d.getDate() - 7);
  currentDate.value = d;
}

function nextPeriod() {
  const d = new Date(currentDate.value);
  if (viewMode.value === 'month') d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  currentDate.value = d;
}

function goToday() {
  currentDate.value = new Date();
}

function openBookingDetail(b: CalendarBooking) {
  selectedBooking.value = b;
  detailDialog.value = true;
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v ?? 0);

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d + 'T00:00:00').toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};

const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

// Summary stats
const totalActive = computed(() => bookings.value.filter(b => b.status !== 'CANCELLED').length);
const todayBookings = computed(() => {
  const today = formatDateISO(new Date());
  return bookings.value.filter(b => today >= b.pickupDate && today <= b.dropoffDate && b.status !== 'CANCELLED').length;
});

onMounted(fetchCalendar);
</script>

<template>
  <v-container fluid class="calendar-page pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Календарь бронирований</h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ totalActive }} активных · {{ todayBookings }} сегодня
        </p>
      </div>
      <div class="d-flex ga-2">
        <v-btn-toggle v-model="viewMode" mandatory variant="outlined" rounded="lg" density="comfortable" color="primary">
          <v-btn value="month" size="small"><v-icon start size="18">mdi-calendar-month</v-icon>Месяц</v-btn>
          <v-btn value="week" size="small"><v-icon start size="18">mdi-calendar-week</v-icon>Неделя</v-btn>
        </v-btn-toggle>
        <v-btn color="primary" variant="tonal" rounded="lg" to="/bookings">
          <v-icon start>mdi-table</v-icon>Таблица
        </v-btn>
      </div>
    </div>

    <!-- Legend -->
    <v-row class="mb-4">
      <v-col cols="auto" v-for="(cfg, key) in statusConfig" :key="key">
        <div class="d-flex align-center ga-2">
          <div :style="{ width: '12px', height: '12px', borderRadius: '3px', background: key === 'CONFIRMED' ? '#4CAF50' : key === 'PENDING_PAYMENT' ? '#FF9800' : key === 'CANCELLED' ? '#F44336' : '#9E9E9E' }" />
          <span class="text-caption text-medium-emphasis">{{ cfg.label }}</span>
        </div>
      </v-col>
    </v-row>

    <!-- Navigation -->
    <v-card elevation="0" rounded="xl" class="calendar-card">
      <div class="d-flex align-center justify-space-between pa-4 pb-2">
        <div class="d-flex align-center ga-2">
          <v-btn icon variant="text" size="small" @click="prevPeriod"><v-icon>mdi-chevron-left</v-icon></v-btn>
          <span class="text-h6 font-weight-bold text-capitalize" style="min-width: 220px; text-align: center">
            {{ viewMode === 'month' ? currentMonth : currentWeekLabel }}
          </span>
          <v-btn icon variant="text" size="small" @click="nextPeriod"><v-icon>mdi-chevron-right</v-icon></v-btn>
        </div>
        <v-btn variant="tonal" size="small" rounded="lg" @click="goToday">Сегодня</v-btn>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center pa-12">
        <v-progress-circular indeterminate color="primary" size="48" />
      </div>

      <!-- Month View -->
      <div v-else-if="viewMode === 'month'" class="calendar-grid pa-4 pt-2">
        <!-- Day headers -->
        <div class="calendar-row calendar-header">
          <div v-for="name in dayNames" :key="name" class="calendar-cell header-cell">
            <span class="text-caption font-weight-bold text-medium-emphasis">{{ name }}</span>
          </div>
        </div>
        <!-- Day cells -->
        <div v-for="(week, wi) in [0,1,2,3,4,5]" :key="wi" class="calendar-row">
          <div
            v-for="day in calendarDays.slice(wi * 7, wi * 7 + 7)"
            :key="day.dateStr"
            class="calendar-cell day-cell"
            :class="{
              'other-month': !day.isCurrentMonth,
              'today-cell': day.isToday,
              'has-bookings': day.bookings.length > 0,
            }"
          >
            <div class="day-number" :class="{ 'today-badge': day.isToday }">
              {{ day.date.getDate() }}
            </div>
            <div class="day-bookings">
              <div
                v-for="b in day.bookings.slice(0, 3)"
                :key="b.id"
                class="booking-chip"
                :style="{ background: b.color + '22', borderLeft: `3px solid ${b.color}` }"
                @click.stop="openBookingDetail(b)"
              >
                <span class="booking-chip-text">{{ b.vehicleName }}</span>
              </div>
              <div v-if="day.bookings.length > 3" class="text-caption text-primary font-weight-medium mt-1">
                +{{ day.bookings.length - 3 }} ещё
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Week View -->
      <div v-else class="week-grid pa-4 pt-2">
        <div v-for="day in weekDays" :key="day.dateStr" class="week-day" :class="{ 'today-cell': day.isToday }">
          <div class="week-day-header">
            <span class="text-caption font-weight-bold text-medium-emphasis">
              {{ dayNames[day.date.getDay() === 0 ? 6 : day.date.getDay() - 1] }}
            </span>
            <span class="text-body-1 font-weight-bold" :class="{ 'text-primary': day.isToday }">
              {{ day.date.getDate() }}
            </span>
          </div>
          <div class="week-day-bookings">
            <v-card
              v-for="b in day.bookings"
              :key="b.id"
              elevation="0"
              rounded="lg"
              class="week-booking-card mb-2"
              :style="{ borderLeft: `4px solid ${b.color}` }"
              @click="openBookingDetail(b)"
            >
              <v-card-text class="pa-3">
                <div class="d-flex align-center ga-2">
                  <v-avatar size="28" rounded="lg">
                    <v-img :src="b.vehicleImage" cover />
                  </v-avatar>
                  <div>
                    <div class="text-body-2 font-weight-bold">{{ b.vehicleName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ b.customerName }}</div>
                  </div>
                </div>
                <div class="d-flex align-center justify-space-between mt-2">
                  <span class="text-caption">{{ formatDate(b.pickupDate) }} → {{ formatDate(b.dropoffDate) }}</span>
                  <span class="text-caption font-weight-bold">{{ formatMoney(b.totalAmount) }}</span>
                </div>
              </v-card-text>
            </v-card>
            <div v-if="!day.bookings.length" class="text-center text-caption text-medium-emphasis pa-4">
              Нет бронирований
            </div>
          </div>
        </div>
      </div>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="480" scrollable>
      <v-card rounded="xl" v-if="selectedBooking">
        <div class="d-flex align-center ga-3 pa-5 pb-3">
          <v-avatar size="48" rounded="lg">
            <v-img :src="selectedBooking.vehicleImage" cover />
          </v-avatar>
          <div>
            <div class="text-h6 font-weight-bold">{{ selectedBooking.vehicleName }}</div>
            <div class="text-caption text-medium-emphasis">
              Бронь #{{ selectedBooking.id }} · {{ selectedBooking.carClass }}
            </div>
          </div>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="detailDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </div>
        <v-divider />
        <v-card-text class="pa-5">
          <div class="d-flex flex-column ga-3">
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Клиент</span>
              <span class="text-body-2 font-weight-bold">{{ selectedBooking.customerName }}</span>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Даты</span>
              <span class="text-body-2">{{ formatDate(selectedBooking.pickupDate) }} → {{ formatDate(selectedBooking.dropoffDate) }}</span>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Дней</span>
              <v-chip size="small" color="primary" variant="tonal">{{ selectedBooking.days }}</v-chip>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Статус</span>
              <v-chip :color="statusConfig[selectedBooking.status]?.color || 'grey'" size="small" variant="tonal"
                :prepend-icon="statusConfig[selectedBooking.status]?.icon">
                {{ statusConfig[selectedBooking.status]?.label || selectedBooking.status }}
              </v-chip>
            </div>
            <div class="d-flex align-center justify-space-between">
              <span class="text-body-2 text-medium-emphasis">Сумма</span>
              <span class="text-h6 font-weight-bold text-success">{{ formatMoney(selectedBooking.totalAmount) }}</span>
            </div>
          </div>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-4">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" :to="`/bookings`">Все бронирования</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.calendar-page {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.calendar-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

/* Month Grid */
.calendar-grid {
  display: flex;
  flex-direction: column;
}
.calendar-row {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1px;
}
.calendar-cell {
  min-height: 40px;
  padding: 4px;
}
.header-cell {
  text-align: center;
  padding: 8px 4px;
}
.day-cell {
  min-height: 100px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  cursor: default;
  transition: background 0.15s;
}
.day-cell:hover {
  background: #fafafe;
}
.day-cell.other-month {
  opacity: 0.4;
}
.day-cell.today-cell {
  border-color: #673ab7;
}
.day-number {
  font-size: 0.85rem;
  font-weight: 600;
  padding: 2px 6px;
  display: inline-block;
}
.today-badge {
  background: #673ab7;
  color: white;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.day-bookings {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 2px;
}
.booking-chip {
  padding: 2px 6px;
  border-radius: 4px;
  cursor: pointer;
  transition: filter 0.15s;
}
.booking-chip:hover {
  filter: brightness(0.92);
}
.booking-chip-text {
  font-size: 0.7rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: block;
}

/* Week Grid */
.week-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 8px;
}
.week-day {
  min-height: 200px;
  background: white;
  border: 1px solid #f0f0f0;
  border-radius: 12px;
  padding: 8px;
}
.week-day.today-cell {
  border-color: #673ab7;
  background: #faf5ff;
}
.week-day-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.week-day-bookings {
  display: flex;
  flex-direction: column;
}
.week-booking-card {
  background: #fafafa !important;
  cursor: pointer;
  transition: background 0.15s;
}
.week-booking-card:hover {
  background: #f0f0f0 !important;
}
</style>

