<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';

const API_BASE = 'http://localhost:8081';

interface ReportData {
  totalBookings: number;
  confirmedBookings: number;
  pendingBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageBookingAmount: number;
  averageRentalDays: number;
  totalPayments: number;
  successPayments: number;
  failedPayments: number;
  initiatedPayments: number;
  totalPaidAmount: number;
  bookingsByStatus: Record<string, number>;
  bookingsByVehicle: Record<string, number>;
  bookingsByCarClass: Record<string, number>;
  revenueByVehicle: Record<string, number>;
  revenueByMonth: Record<string, number>;
  bookings: Array<{
    id: number; vehicleName: string; carClass: string; customerName: string;
    customerEmail: string; pickupDate: string; dropoffDate: string; days: number;
    status: string; paymentStatus: string; totalAmount: number;
    prepaymentAmount: number; createdAt: string;
  }>;
  payments: Array<{
    id: number; bookingId: number; vehicleName: string; method: string;
    status: string; amount: number; transactionId: string; createdAt: string;
  }>;
}

const report = ref<ReportData | null>(null);
const loading = ref(false);
const activeTab = ref('overview');

// Filters
const dateFrom = ref('');
const dateTo = ref('');
const bookingStatus = ref('');
const carClass = ref('');

const statusOptions = [
  { title: 'Все', value: '' },
  { title: 'Подтверждённые', value: 'CONFIRMED' },
  { title: 'Ожидающие', value: 'PENDING_PAYMENT' },
  { title: 'Отменённые', value: 'CANCELLED' },
];

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  CONFIRMED: { color: 'success', icon: 'mdi-check-circle', label: 'Подтверждено' },
  PENDING_PAYMENT: { color: 'warning', icon: 'mdi-clock-outline', label: 'Ожидает' },
  CANCELLED: { color: 'error', icon: 'mdi-close-circle', label: 'Отменено' },
  DRAFT: { color: 'grey', icon: 'mdi-pencil-outline', label: 'Черновик' },
};

const paymentStatusConfig: Record<string, { color: string; label: string }> = {
  SUCCESS: { color: 'success', label: 'Успешно' },
  FAILED: { color: 'error', label: 'Ошибка' },
  INITIATED: { color: 'warning', label: 'Инициирована' },
  PAID: { color: 'success', label: 'Оплачено' },
  UNPAID: { color: 'grey', label: 'Не оплачено' },
};

async function fetchReport() {
  loading.value = true;
  try {
    const params = new URLSearchParams();
    if (dateFrom.value) params.append('dateFrom', dateFrom.value);
    if (dateTo.value) params.append('dateTo', dateTo.value);
    if (bookingStatus.value) params.append('bookingStatus', bookingStatus.value);
    if (carClass.value) params.append('carClass', carClass.value);
    const res = await fetch(`${API_BASE}/api/v1/reports?${params.toString()}`);
    if (res.ok) report.value = await res.json();
  } catch (e) {
    console.error('fetchReport error:', e);
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  dateFrom.value = '';
  dateTo.value = '';
  bookingStatus.value = '';
  carClass.value = '';
  fetchReport();
}

// Computed for charts data
const vehicleChartItems = computed(() => {
  if (!report.value?.bookingsByVehicle) return [];
  return Object.entries(report.value.bookingsByVehicle)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);
});

const classChartItems = computed(() => {
  if (!report.value?.bookingsByCarClass) return [];
  return Object.entries(report.value.bookingsByCarClass)
    .sort((a, b) => b[1] - a[1]);
});

const revenueMonthItems = computed(() => {
  if (!report.value?.revenueByMonth) return [];
  return Object.entries(report.value.revenueByMonth);
});

const maxVehicleCount = computed(() =>
  vehicleChartItems.value.length > 0 ? Math.max(...vehicleChartItems.value.map(v => v[1])) : 1
);

const maxClassCount = computed(() =>
  classChartItems.value.length > 0 ? Math.max(...classChartItems.value.map(v => v[1])) : 1
);

const maxMonthRevenue = computed(() =>
  revenueMonthItems.value.length > 0 ? Math.max(...revenueMonthItems.value.map(v => v[1])) : 1
);

const carClassOptions = computed(() => {
  const classes = report.value?.bookingsByCarClass ? Object.keys(report.value.bookingsByCarClass) : [];
  return [{ title: 'Все', value: '' }, ...classes.map(c => ({ title: c, value: c }))];
});

const bookingHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Автомобиль', key: 'vehicleName' },
  { title: 'Клиент', key: 'customerName' },
  { title: 'Даты', key: 'pickupDate' },
  { title: 'Дни', key: 'days', align: 'center' as const, width: '70px' },
  { title: 'Статус', key: 'status', width: '140px' },
  { title: 'Сумма', key: 'totalAmount', align: 'end' as const, width: '120px' },
  { title: 'Создано', key: 'createdAt', width: '130px' },
];

const paymentHeaders = [
  { title: '#', key: 'id', width: '60px' },
  { title: 'Бронь', key: 'bookingId', width: '80px' },
  { title: 'Автомобиль', key: 'vehicleName' },
  { title: 'Метод', key: 'method', width: '100px' },
  { title: 'Статус', key: 'status', width: '130px' },
  { title: 'Сумма', key: 'amount', align: 'end' as const, width: '120px' },
  { title: 'Дата', key: 'createdAt', width: '130px' },
];

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v ?? 0);

onMounted(fetchReport);
</script>

<template>
  <v-container fluid class="reports-page pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Отчётность</h1>
        <p class="text-body-2 text-medium-emphasis">Аналитика бронирований и оплат</p>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" :loading="loading" @click="fetchReport">
        <v-icon start>mdi-refresh</v-icon>
        Обновить
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card elevation="0" rounded="xl" class="filter-card mb-6">
      <v-card-text class="pa-5">
        <div class="d-flex align-center ga-2 mb-3">
          <v-icon size="18" color="primary">mdi-filter-variant</v-icon>
          <span class="text-subtitle-2 font-weight-bold">Фильтры</span>
        </div>
        <v-row dense>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="dateFrom" label="Дата от" type="date" variant="outlined"
              rounded="lg" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-text-field v-model="dateTo" label="Дата до" type="date" variant="outlined"
              rounded="lg" density="compact" hide-details clearable />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="bookingStatus" :items="statusOptions" item-title="title" item-value="value"
              label="Статус бронирования" variant="outlined" rounded="lg" density="compact" hide-details />
          </v-col>
          <v-col cols="12" sm="6" md="3">
            <v-select v-model="carClass" :items="carClassOptions" item-title="title" item-value="value"
              label="Класс авто" variant="outlined" rounded="lg" density="compact" hide-details />
          </v-col>
        </v-row>
        <div class="d-flex ga-2 mt-3">
          <v-btn color="primary" variant="flat" rounded="lg" size="small" @click="fetchReport">Применить</v-btn>
          <v-btn variant="tonal" rounded="lg" size="small" @click="resetFilters">Сбросить</v-btn>
        </div>
      </v-card-text>
    </v-card>

    <div v-if="loading && !report" class="text-center py-10">
      <v-progress-circular indeterminate color="primary" size="48" />
    </div>

    <template v-if="report">
      <!-- Summary Cards -->
      <v-row class="mb-6">
        <v-col cols="12" sm="6" lg="3">
          <v-card class="stat-card" rounded="xl" elevation="0">
            <v-card-text class="d-flex align-center ga-4 pa-5">
              <v-avatar size="48" color="primary" variant="tonal" rounded="lg">
                <v-icon size="24">mdi-clipboard-list</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Бронирования</div>
                <div class="text-h5 font-weight-bold">{{ report.totalBookings }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card class="stat-card" rounded="xl" elevation="0">
            <v-card-text class="d-flex align-center ga-4 pa-5">
              <v-avatar size="48" color="success" variant="tonal" rounded="lg">
                <v-icon size="24">mdi-cash-multiple</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Выручка</div>
                <div class="text-h5 font-weight-bold text-success">{{ formatMoney(report.totalRevenue) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card class="stat-card" rounded="xl" elevation="0">
            <v-card-text class="d-flex align-center ga-4 pa-5">
              <v-avatar size="48" color="info" variant="tonal" rounded="lg">
                <v-icon size="24">mdi-receipt-text</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Средний чек</div>
                <div class="text-h5 font-weight-bold text-info">{{ formatMoney(report.averageBookingAmount) }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col cols="12" sm="6" lg="3">
          <v-card class="stat-card" rounded="xl" elevation="0">
            <v-card-text class="d-flex align-center ga-4 pa-5">
              <v-avatar size="48" color="warning" variant="tonal" rounded="lg">
                <v-icon size="24">mdi-calendar-range</v-icon>
              </v-avatar>
              <div>
                <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium">Ср. аренда</div>
                <div class="text-h5 font-weight-bold">{{ report.averageRentalDays.toFixed(1) }} дн</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Tabs -->
      <v-tabs v-model="activeTab" color="primary" class="mb-4">
        <v-tab value="overview" prepend-icon="mdi-chart-bar">Обзор</v-tab>
        <v-tab value="bookings" prepend-icon="mdi-calendar-check">Бронирования</v-tab>
        <v-tab value="payments" prepend-icon="mdi-credit-card-outline">Оплаты</v-tab>
      </v-tabs>

      <v-window v-model="activeTab">
        <!-- Overview Tab -->
        <v-window-item value="overview">
          <v-row>
            <!-- Bookings by status -->
            <v-col cols="12" md="4">
              <v-card elevation="0" rounded="xl" class="chart-card">
                <v-card-text class="pa-5">
                  <div class="text-subtitle-2 font-weight-bold mb-4">По статусу</div>
                  <div v-for="(count, status) in report.bookingsByStatus" :key="status" class="d-flex align-center justify-space-between mb-3">
                    <div class="d-flex align-center ga-2">
                      <v-chip :color="statusConfig[status]?.color || 'grey'" size="x-small" variant="flat"
                        :prepend-icon="statusConfig[status]?.icon">
                        {{ statusConfig[status]?.label || status }}
                      </v-chip>
                    </div>
                    <span class="text-body-1 font-weight-bold">{{ count }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Bookings by vehicle (bar chart) -->
            <v-col cols="12" md="8">
              <v-card elevation="0" rounded="xl" class="chart-card">
                <v-card-text class="pa-5">
                  <div class="text-subtitle-2 font-weight-bold mb-4">По автомобилям</div>
                  <div v-for="[name, count] in vehicleChartItems" :key="name" class="mb-3">
                    <div class="d-flex justify-space-between text-body-2 mb-1">
                      <span class="font-weight-medium">{{ name }}</span>
                      <span class="text-medium-emphasis">{{ count }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="(count / maxVehicleCount) * 100"
                      color="primary"
                      rounded
                      height="8"
                    />
                  </div>
                  <div v-if="!vehicleChartItems.length" class="text-center text-medium-emphasis py-4">Нет данных</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- By car class -->
            <v-col cols="12" md="4">
              <v-card elevation="0" rounded="xl" class="chart-card">
                <v-card-text class="pa-5">
                  <div class="text-subtitle-2 font-weight-bold mb-4">По классам авто</div>
                  <div v-for="[cls, count] in classChartItems" :key="cls" class="mb-3">
                    <div class="d-flex justify-space-between text-body-2 mb-1">
                      <span class="font-weight-medium">{{ cls }}</span>
                      <span>{{ count }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="(count / maxClassCount) * 100"
                      color="info"
                      rounded
                      height="8"
                    />
                  </div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Revenue by month -->
            <v-col cols="12" md="8">
              <v-card elevation="0" rounded="xl" class="chart-card">
                <v-card-text class="pa-5">
                  <div class="text-subtitle-2 font-weight-bold mb-4">Выручка по месяцам</div>
                  <div v-for="[month, revenue] in revenueMonthItems" :key="month" class="mb-3">
                    <div class="d-flex justify-space-between text-body-2 mb-1">
                      <span class="font-weight-medium">{{ month }}</span>
                      <span class="text-success font-weight-bold">{{ formatMoney(revenue) }}</span>
                    </div>
                    <v-progress-linear
                      :model-value="(revenue / maxMonthRevenue) * 100"
                      color="success"
                      rounded
                      height="8"
                    />
                  </div>
                  <div v-if="!revenueMonthItems.length" class="text-center text-medium-emphasis py-4">Нет данных</div>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Payment summary -->
            <v-col cols="12">
              <v-card elevation="0" rounded="xl" class="chart-card">
                <v-card-text class="pa-5">
                  <div class="text-subtitle-2 font-weight-bold mb-4">Оплаты</div>
                  <v-row dense>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold">{{ report.totalPayments }}</div>
                        <div class="text-caption text-medium-emphasis">Всего</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-success">{{ report.successPayments }}</div>
                        <div class="text-caption text-medium-emphasis">Успешные</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-error">{{ report.failedPayments }}</div>
                        <div class="text-caption text-medium-emphasis">Ошибки</div>
                      </div>
                    </v-col>
                    <v-col cols="6" sm="3">
                      <div class="text-center">
                        <div class="text-h5 font-weight-bold text-success">{{ formatMoney(report.totalPaidAmount) }}</div>
                        <div class="text-caption text-medium-emphasis">Оплачено</div>
                      </div>
                    </v-col>
                  </v-row>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- Bookings Table -->
        <v-window-item value="bookings">
          <v-card elevation="0" rounded="xl" class="table-card">
            <v-card-text class="pa-0">
              <v-data-table
                :headers="bookingHeaders"
                :items="report.bookings"
                item-value="id"
                hover
                items-per-page="20"
                class="report-table"
              >
                <template #item.id="{ item }">
                  <span class="text-body-2 font-weight-bold text-primary">#{{ item.id }}</span>
                </template>
                <template #item.vehicleName="{ item }">
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ item.vehicleName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.carClass }}</div>
                  </div>
                </template>
                <template #item.customerName="{ item }">
                  <div>
                    <div class="text-body-2 font-weight-medium">{{ item.customerName }}</div>
                    <div class="text-caption text-medium-emphasis">{{ item.customerEmail }}</div>
                  </div>
                </template>
                <template #item.pickupDate="{ item }">
                  <span class="text-body-2">{{ item.pickupDate }} → {{ item.dropoffDate }}</span>
                </template>
                <template #item.status="{ item }">
                  <v-chip :color="statusConfig[item.status]?.color || 'grey'" size="small" variant="tonal">
                    {{ statusConfig[item.status]?.label || item.status }}
                  </v-chip>
                </template>
                <template #item.totalAmount="{ item }">
                  <span class="text-body-2 font-weight-bold">{{ formatMoney(item.totalAmount) }}</span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>

        <!-- Payments Table -->
        <v-window-item value="payments">
          <v-card elevation="0" rounded="xl" class="table-card">
            <v-card-text class="pa-0">
              <v-data-table
                :headers="paymentHeaders"
                :items="report.payments"
                item-value="id"
                hover
                items-per-page="20"
                class="report-table"
              >
                <template #item.id="{ item }">
                  <span class="text-body-2 font-weight-bold text-primary">#{{ item.id }}</span>
                </template>
                <template #item.bookingId="{ item }">
                  <span class="text-body-2">#{{ item.bookingId }}</span>
                </template>
                <template #item.status="{ item }">
                  <v-chip :color="paymentStatusConfig[item.status]?.color || 'grey'" size="small" variant="tonal">
                    {{ paymentStatusConfig[item.status]?.label || item.status }}
                  </v-chip>
                </template>
                <template #item.amount="{ item }">
                  <span class="text-body-2 font-weight-bold">{{ formatMoney(item.amount) }}</span>
                </template>
              </v-data-table>
            </v-card-text>
          </v-card>
        </v-window-item>
      </v-window>
    </template>
  </v-container>
</template>

<style scoped>
.reports-page {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}
.stat-card,
.filter-card,
.chart-card,
.table-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.report-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}
</style>

