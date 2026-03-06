<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useBookingsAdminStore } from '@/stores/bookings-admin';
import type { BookingAdmin, UpdateBookingData, BookingHistoryItem } from '@/stores/bookings-admin';
import ModalDialog from '@/components/UserModal.vue';

const store = useBookingsAdminStore();

const loading = ref(false);
const detailDialog = ref(false);
const cancelDialog = ref(false);
const editDialog = ref(false);
const selectedBooking = ref<BookingAdmin | null>(null);
const statusFilter = ref('all');
const searchText = ref('');
const bookingHistory = ref<BookingHistoryItem[]>([]);
const historyLoading = ref(false);

// Locations для выпадающих списков в форме редактирования
interface LocationItem { id: number; name: string; city: string; country: string }
const locations = ref<LocationItem[]>([]);

// Форма редактирования
const editForm = ref<UpdateBookingData>({});
const editSaving = ref(false);
const headers = [
  { title: '№', key: 'id', width: '60px' },
  { title: 'Автомобиль', key: 'vehicle' },
  { title: 'Клиент', key: 'customer' },
  { title: 'Период', key: 'dates' },
  { title: 'Дней', key: 'days', width: '65px', align: 'center' as const },
  { title: 'Итого', key: 'totalAmount', align: 'end' as const },
  { title: 'Статус', key: 'status', align: 'center' as const },
  { title: 'Оплата', key: 'paymentStatus', align: 'center' as const },
  { title: '', key: 'actions', sortable: false, width: '150px', align: 'center' as const },
];

const statusOptions = [
  { title: 'Все статусы', value: 'all' },
  { title: '✅ Подтверждено', value: 'CONFIRMED' },
  { title: '⏳ Ожидает оплаты', value: 'PENDING_PAYMENT' },
  { title: '❌ Отменено', value: 'CANCELLED' },
  { title: '📝 Черновик', value: 'DRAFT' },
];

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  CONFIRMED: { color: 'success', icon: 'mdi-check-circle', label: 'Подтверждён' },
  PENDING_PAYMENT: { color: 'warning', icon: 'mdi-clock-outline', label: 'Ожидает' },
  CANCELLED: { color: 'error', icon: 'mdi-close-circle', label: 'Отменён' },
  DRAFT: { color: 'grey', icon: 'mdi-pencil-outline', label: 'Черновик' },
};

const paymentConfig: Record<string, { color: string; icon: string; label: string }> = {
  PAID: { color: 'success', icon: 'mdi-cash-check', label: 'Оплачен' },
  UNPAID: { color: 'warning', icon: 'mdi-cash-remove', label: 'Не оплачен' },
  FAILED: { color: 'error', icon: 'mdi-alert-circle', label: 'Ошибка' },
};

const filteredBookings = computed(() => {
  let result = store.bookings;
  if (statusFilter.value !== 'all') {
    result = result.filter(b => b.status === statusFilter.value);
  }
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase();
    result = result.filter(b =>
      b.customer.fullName.toLowerCase().includes(q) ||
      b.customer.email.toLowerCase().includes(q) ||
      `${b.vehicle.brand} ${b.vehicle.model}`.toLowerCase().includes(q) ||
      String(b.id).includes(q)
    );
  }
  return result;
});

const totalRevenue = computed(() =>
  store.bookings
    .filter(b => b.status === 'CONFIRMED' && b.paymentStatus === 'PAID')
    .reduce((sum, b) => sum + b.totalAmount, 0)
);

const confirmedCount = computed(() => store.bookings.filter(b => b.status === 'CONFIRMED').length);
const pendingCount = computed(() => store.bookings.filter(b => b.status === 'PENDING_PAYMENT').length);
const cancelledCount = computed(() => store.bookings.filter(b => b.status === 'CANCELLED').length);

const todayLabel = computed(() => {
  const d = new Date();
  return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
});

const fetchBookings = async () => {
  loading.value = true;
  try {
    await store.fetchAllBookings();
    // Загружаем локации для формы редактирования
    try {
      const res = await fetch('http://localhost:8081/api/v1/locations');
      if (res.ok) locations.value = await res.json();
    } catch (e) { /* ignore */ }
  } finally {
    loading.value = false;
  }
};

const detailTab = ref('info');

const openDetail = async (booking: BookingAdmin) => {
  selectedBooking.value = booking;
  detailTab.value = 'info';
  bookingHistory.value = [];
  detailDialog.value = true;
  // Load history in background
  historyLoading.value = true;
  try {
    bookingHistory.value = await store.fetchBookingHistory(booking.id);
  } finally {
    historyLoading.value = false;
  }
};

const actionLabels: Record<string, { icon: string; color: string; label: string }> = {
  CREATED: { icon: 'mdi-plus-circle', color: 'success', label: 'Создано' },
  UPDATED: { icon: 'mdi-pencil', color: 'info', label: 'Изменено' },
  CANCELLED: { icon: 'mdi-close-circle', color: 'error', label: 'Отменено' },
  STATUS_CHANGED: { icon: 'mdi-swap-horizontal', color: 'warning', label: 'Статус' },
  DATES_CHANGED: { icon: 'mdi-calendar-edit', color: 'primary', label: 'Даты' },
  CUSTOMER_UPDATED: { icon: 'mdi-account-edit', color: 'info', label: 'Клиент' },
  PAYMENT_INITIATED: { icon: 'mdi-cash-clock', color: 'warning', label: 'Оплата' },
  PAYMENT_COMPLETED: { icon: 'mdi-cash-check', color: 'success', label: 'Оплачено' },
  COMMENT: { icon: 'mdi-comment-text-outline', color: 'secondary', label: 'Комментарий' },
};

const openEdit = (booking: BookingAdmin) => {
  selectedBooking.value = booking;
  editForm.value = {
    pickupDate: booking.pickupDate,
    dropoffDate: booking.dropoffDate,
    pickupLocationId: booking.pickupLocation?.id,
    dropoffLocationId: booking.dropoffLocation?.id,
    status: booking.status,
    customerFullName: booking.customer.fullName,
    customerEmail: booking.customer.email,
    customerPhone: booking.customer.phone,
    customerAdditionalInfo: '',
    managerComment: '',
  };
  editDialog.value = true;
};

const saveEdit = async () => {
  if (!selectedBooking.value) return;
  editSaving.value = true;
  try {
    await store.updateBooking(selectedBooking.value.id, editForm.value);
    editDialog.value = false;
    selectedBooking.value = null;
  } catch (e) {
    // handled in store
  } finally {
    editSaving.value = false;
  }
};

const openCancelDialog = (booking: BookingAdmin) => {
  selectedBooking.value = booking;
  cancelDialog.value = true;
};

const confirmCancel = async () => {
  if (!selectedBooking.value) return;
  try {
    await store.cancelBooking(selectedBooking.value.id);
    cancelDialog.value = false;
    selectedBooking.value = null;
  } catch (e) {
    // error handled in store
  }
};

const formatDate = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' });
};

const formatDateFull = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleDateString('ru-RU');
};

const formatDateTime = (d: string) => {
  if (!d) return '';
  return new Date(d).toLocaleString('ru-RU');
};

const formatMoney = (v: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
};

onMounted(fetchBookings);
</script>

<template>
  <v-container fluid class="bookings-admin pa-6">
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Бронирования</h1>
        <p class="text-body-2 text-medium-emphasis text-capitalize">{{ todayLabel }}</p>
      </div>
      <v-btn
        color="primary"
        variant="flat"
        rounded="lg"
        size="large"
        @click="fetchBookings"
        :loading="loading"
      >
        <v-icon start>mdi-refresh</v-icon>
        Обновить
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" lg>
        <v-card class="stat-card stat-card--total" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="primary" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-clipboard-list</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Всего</div>
              <div class="text-h5 font-weight-bold">{{ store.bookings.length }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg>
        <v-card class="stat-card stat-card--confirmed" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="success" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-check-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Подтверждено</div>
              <div class="text-h5 font-weight-bold text-success">{{ confirmedCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg>
        <v-card class="stat-card stat-card--pending" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="warning" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-clock-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Ожидает</div>
              <div class="text-h5 font-weight-bold text-warning">{{ pendingCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg>
        <v-card class="stat-card stat-card--cancelled" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="error" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-close-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Отменено</div>
              <div class="text-h5 font-weight-bold text-error">{{ cancelledCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" lg>
        <v-card class="stat-card stat-card--revenue" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="info" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-cash-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Доход</div>
              <div class="text-h5 font-weight-bold text-info">{{ formatMoney(totalRevenue) }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Main Table Card -->
    <v-card elevation="0" rounded="xl" class="table-card">
      <!-- Toolbar -->
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="22">mdi-table</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Список бронирований</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-1">{{ filteredBookings.length }}</v-chip>
        </div>
        <div class="d-flex ga-3 align-center flex-wrap">
          <v-text-field
            v-model="searchText"
            prepend-inner-icon="mdi-magnify"
            variant="solo-filled"
            flat
            density="compact"
            rounded="lg"
            hide-details
            style="min-width: 240px; max-width: 300px"
            clearable
            placeholder="Поиск по ID, клиенту, авто..."
          />
          <v-select
            v-model="statusFilter"
            :items="statusOptions"
            item-title="title"
            item-value="value"
            variant="solo-filled"
            flat
            density="compact"
            rounded="lg"
            hide-details
            style="min-width: 200px; max-width: 220px"
          />
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredBookings"
        :loading="loading"
        item-value="id"
        hover
        items-per-page="10"
        class="bookings-table"
      >
        <!-- ID -->
        <template #item.id="{ item }">
          <span class="text-body-2 font-weight-bold text-primary">#{{ item.id }}</span>
        </template>

        <!-- Vehicle -->
        <template #item.vehicle="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-avatar size="42" rounded="lg" class="vehicle-avatar">
              <v-img :src="item.vehicle.image" cover />
            </v-avatar>
            <div>
              <div class="text-body-2 font-weight-bold">{{ item.vehicle.brand }} {{ item.vehicle.model }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.vehicle.carClass }}</div>
            </div>
          </div>
        </template>

        <!-- Customer -->
        <template #item.customer="{ item }">
          <div>
            <div class="text-body-2 font-weight-medium">{{ item.customer.fullName }}</div>
            <div class="text-caption text-medium-emphasis">{{ item.customer.phone || item.customer.email }}</div>
          </div>
        </template>

        <!-- Dates -->
        <template #item.dates="{ item }">
          <div class="d-flex align-center ga-1">
            <v-icon size="14" color="success">mdi-circle-small</v-icon>
            <span class="text-body-2">{{ formatDate(item.pickupDate) }}</span>
            <v-icon size="14">mdi-arrow-right</v-icon>
            <span class="text-body-2">{{ formatDate(item.dropoffDate) }}</span>
          </div>
        </template>

        <!-- Days -->
        <template #item.days="{ item }">
          <v-chip size="x-small" variant="tonal" color="primary">{{ item.days }}д</v-chip>
        </template>

        <!-- Total Amount -->
        <template #item.totalAmount="{ item }">
          <span class="text-body-2 font-weight-bold">{{ formatMoney(item.totalAmount) }}</span>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <v-chip
            :color="statusConfig[item.status]?.color || 'grey'"
            size="small"
            variant="tonal"
            :prepend-icon="statusConfig[item.status]?.icon"
          >
            {{ statusConfig[item.status]?.label || item.status }}
          </v-chip>
        </template>

        <!-- Payment Status -->
        <template #item.paymentStatus="{ item }">
          <v-chip
            :color="paymentConfig[item.paymentStatus]?.color || 'grey'"
            size="small"
            variant="tonal"
            :prepend-icon="paymentConfig[item.paymentStatus]?.icon"
          >
            {{ paymentConfig[item.paymentStatus]?.label || item.paymentStatus }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-center">
            <v-tooltip text="Подробнее" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="primary" @click="openDetail(item)">
                  <v-icon size="20">mdi-eye-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="item.status !== 'CANCELLED'" text="Редактировать" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="warning" @click="openEdit(item)">
                  <v-icon size="20">mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip v-if="item.status !== 'CANCELLED'" text="Отменить" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="error" @click="openCancelDialog(item)">
                  <v-icon size="20">mdi-cancel</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>

        <!-- Empty state -->
        <template #no-data>
          <div class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-calendar-blank</v-icon>
            <div class="text-h6 text-grey mt-3">Бронирований не найдено</div>
            <div class="text-body-2 text-grey-darken-1">Попробуйте изменить фильтры</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="720" scrollable>
      <v-card rounded="xl" v-if="selectedBooking">
        <!-- Header with gradient -->
        <div class="detail-header pa-6 pb-4">
          <div class="d-flex align-center justify-space-between">
            <div class="d-flex align-center ga-3">
              <v-avatar size="52" rounded="lg" class="vehicle-avatar">
                <v-img :src="selectedBooking.vehicle.image" cover />
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  {{ selectedBooking.vehicle.brand }} {{ selectedBooking.vehicle.model }}
                </div>
                <div class="text-body-2 text-medium-emphasis">
                  Бронирование #{{ selectedBooking.id }} · {{ selectedBooking.vehicle.carClass }}
                </div>
              </div>
            </div>
            <v-btn icon variant="text" @click="detailDialog = false">
              <v-icon>mdi-close</v-icon>
            </v-btn>
          </div>
          <div class="d-flex ga-2 mt-3">
            <v-chip
              :color="statusConfig[selectedBooking.status]?.color"
              :prepend-icon="statusConfig[selectedBooking.status]?.icon"
              variant="flat"
              size="small"
            >
              {{ statusConfig[selectedBooking.status]?.label }}
            </v-chip>
            <v-chip
              :color="paymentConfig[selectedBooking.paymentStatus]?.color"
              :prepend-icon="paymentConfig[selectedBooking.paymentStatus]?.icon"
              variant="flat"
              size="small"
            >
              {{ paymentConfig[selectedBooking.paymentStatus]?.label }}
            </v-chip>
          </div>
        </div>

        <v-divider />

        <!-- Tabs -->
        <v-tabs v-model="detailTab" color="primary" density="compact" class="px-4">
          <v-tab value="info" prepend-icon="mdi-information-outline" size="small">Детали</v-tab>
          <v-tab value="history" prepend-icon="mdi-history" size="small">
            История
            <v-chip v-if="bookingHistory.length" size="x-small" color="primary" variant="tonal" class="ml-2">
              {{ bookingHistory.length }}
            </v-chip>
          </v-tab>
        </v-tabs>
        <v-divider />

        <v-window v-model="detailTab">
          <!-- Info Tab -->
          <v-window-item value="info">
            <v-card-text class="pa-6">
              <v-row dense>
                <!-- Customer -->
                <v-col cols="12" sm="6">
                  <div class="detail-section">
                    <div class="detail-section__title">
                      <v-icon size="16" color="primary">mdi-account</v-icon>
                      Клиент
                    </div>
                    <div class="text-body-1 font-weight-bold">{{ selectedBooking.customer.fullName }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ selectedBooking.customer.email }}</div>
                    <div class="text-body-2 text-medium-emphasis">{{ selectedBooking.customer.phone }}</div>
                  </div>
                </v-col>

                <!-- Dates -->
                <v-col cols="12" sm="6">
                  <div class="detail-section">
                    <div class="detail-section__title">
                      <v-icon size="16" color="primary">mdi-calendar-range</v-icon>
                      Период аренды
                    </div>
                    <div class="text-body-1">
                      {{ formatDateFull(selectedBooking.pickupDate) }} → {{ formatDateFull(selectedBooking.dropoffDate) }}
                    </div>
                    <v-chip size="small" color="primary" variant="tonal" class="mt-1">{{ selectedBooking.days }} дней</v-chip>
                  </div>
                </v-col>

                <!-- Locations -->
                <v-col cols="12" sm="6">
                  <div class="detail-section">
                    <div class="detail-section__title">
                      <v-icon size="16" color="primary">mdi-map-marker</v-icon>
                      Локации
                    </div>
                    <div class="d-flex align-center ga-1 text-body-1">
                      <v-icon size="14" color="success">mdi-circle</v-icon>
                      {{ selectedBooking.pickupLocation.name }}
                    </div>
                    <div class="d-flex align-center ga-1 text-body-1 mt-1">
                      <v-icon size="14" color="error">mdi-map-marker</v-icon>
                      {{ selectedBooking.dropoffLocation.name }}
                    </div>
                  </div>
                </v-col>

                <!-- Pricing -->
                <v-col cols="12" sm="6">
                  <div class="detail-section">
                    <div class="detail-section__title">
                      <v-icon size="16" color="primary">mdi-receipt-text</v-icon>
                      Стоимость
                    </div>
                    <div class="text-body-2 text-medium-emphasis" v-if="selectedBooking.priceTierDescription">
                      {{ selectedBooking.priceTierDescription }}
                    </div>
                    <table class="pricing-table">
                      <tr>
                        <td class="text-body-2 text-medium-emphasis">{{ selectedBooking.days }}д × {{ formatMoney(selectedBooking.pricePerDay) }}</td>
                        <td class="text-body-1 text-right">{{ formatMoney(selectedBooking.baseAmount) }}</td>
                      </tr>
                      <tr>
                        <td class="text-body-2 text-medium-emphasis">Доп. услуги</td>
                        <td class="text-body-1 text-right">{{ formatMoney(selectedBooking.addOnsAmount) }}</td>
                      </tr>
                      <tr>
                        <td class="text-body-2 text-medium-emphasis">Сервисный сбор</td>
                        <td class="text-body-1 text-right">{{ formatMoney(selectedBooking.serviceFee) }}</td>
                      </tr>
                      <tr class="pricing-total">
                        <td class="text-body-1 font-weight-bold">Итого</td>
                        <td class="text-h6 font-weight-bold text-right text-primary">{{ formatMoney(selectedBooking.totalAmount) }}</td>
                      </tr>
                    </table>
                    <div class="d-flex align-center ga-2 mt-2">
                      <span class="text-body-2 text-medium-emphasis">Предоплата 15%:</span>
                      <span class="text-body-1 font-weight-medium">{{ formatMoney(selectedBooking.prepaymentAmount) }}</span>
                      <v-chip
                        :color="selectedBooking.prepaymentPaid ? 'success' : 'warning'"
                        size="x-small"
                        variant="flat"
                        :prepend-icon="selectedBooking.prepaymentPaid ? 'mdi-check' : 'mdi-clock-outline'"
                      >
                        {{ selectedBooking.prepaymentPaid ? 'Оплачена' : 'Ожидает' }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>

                <!-- Add-ons -->
                <v-col cols="12" v-if="selectedBooking.addOns?.length">
                  <div class="detail-section">
                    <div class="detail-section__title">
                      <v-icon size="16" color="primary">mdi-plus-box-multiple</v-icon>
                      Дополнительные услуги
                    </div>
                    <div class="d-flex flex-wrap ga-2">
                      <v-chip v-for="addon in selectedBooking.addOns" :key="addon" size="small" variant="tonal" color="primary" prepend-icon="mdi-check">
                        {{ addon.replace(/_/g, ' ') }}
                      </v-chip>
                    </div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-window-item>

          <!-- History Tab -->
          <v-window-item value="history">
            <v-card-text class="pa-6">
              <div v-if="historyLoading" class="text-center py-6">
                <v-progress-circular indeterminate color="primary" size="32" />
                <div class="text-body-2 text-medium-emphasis mt-2">Загрузка истории…</div>
              </div>

              <div v-else-if="!bookingHistory.length" class="text-center py-6">
                <v-icon size="48" color="grey-lighten-1">mdi-history</v-icon>
                <div class="text-body-2 text-medium-emphasis mt-2">История изменений пуста</div>
              </div>

              <v-timeline v-else density="compact" side="end" line-color="grey-lighten-3">
                <v-timeline-item
                  v-for="entry in bookingHistory"
                  :key="entry.id"
                  :dot-color="actionLabels[entry.action]?.color || 'grey'"
                  :icon="actionLabels[entry.action]?.icon || 'mdi-circle-small'"
                  size="small"
                >
                  <div class="d-flex align-center justify-space-between mb-1">
                    <v-chip
                      :color="actionLabels[entry.action]?.color || 'grey'"
                      size="x-small"
                      variant="tonal"
                    >
                      {{ actionLabels[entry.action]?.label || entry.action }}
                    </v-chip>
                    <span class="text-caption text-medium-emphasis">
                      {{ formatDateTime(entry.createdAt) }}
                    </span>
                  </div>

                  <div v-if="entry.field" class="text-body-2 mt-1">
                    <span class="font-weight-medium">{{ entry.field }}:</span>
                    <span v-if="entry.oldValue" class="text-medium-emphasis text-decoration-line-through ml-1">{{ entry.oldValue }}</span>
                    <v-icon v-if="entry.oldValue && entry.newValue" size="14" class="mx-1">mdi-arrow-right</v-icon>
                    <span v-if="entry.newValue" class="font-weight-medium">{{ entry.newValue }}</span>
                  </div>
                  <div v-else-if="entry.newValue" class="text-body-2 mt-1">
                    {{ entry.newValue }}
                  </div>

                  <div v-if="entry.comment" class="text-caption text-medium-emphasis mt-1 font-italic">
                    💬 {{ entry.comment }}
                  </div>

                  <div class="text-caption text-medium-emphasis mt-1">
                    <v-icon size="12">mdi-account</v-icon>
                    {{ entry.performedBy }}
                  </div>
                </v-timeline-item>
              </v-timeline>
            </v-card-text>
          </v-window-item>
        </v-window>

        <v-divider />

        <v-card-actions class="pa-5">
          <span class="text-caption text-medium-emphasis">
            Создано: {{ formatDateTime(selectedBooking.createdAt) }}
          </span>
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="detailDialog = false">
            Закрыть
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Booking Dialog -->
    <v-dialog v-model="editDialog" max-width="720" scrollable>
      <v-card rounded="xl" v-if="selectedBooking">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="warning" variant="tonal" rounded="lg">
              <v-icon size="22">mdi-pencil</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">Редактировать бронирование #{{ selectedBooking.id }}</div>
              <div class="text-caption text-medium-emphasis">
                {{ selectedBooking.vehicle.brand }} {{ selectedBooking.vehicle.model }}
              </div>
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <v-row dense>
            <!-- Даты -->
            <v-col cols="12" class="mb-1">
              <div class="detail-section__title">
                <v-icon size="16" color="primary">mdi-calendar-range</v-icon>
                Период аренды
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.pickupDate"
                label="Дата получения"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.dropoffDate"
                label="Дата возврата"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Локации -->
            <v-col cols="12" class="mb-1">
              <div class="detail-section__title">
                <v-icon size="16" color="primary">mdi-map-marker</v-icon>
                Локации
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editForm.pickupLocationId"
                :items="locations"
                item-title="name"
                item-value="id"
                label="Получение"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editForm.dropoffLocationId"
                :items="locations"
                item-title="name"
                item-value="id"
                label="Возврат"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Статус -->
            <v-col cols="12" class="mb-1">
              <div class="detail-section__title">
                <v-icon size="16" color="primary">mdi-tag-outline</v-icon>
                Статус
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="editForm.status"
                :items="[
                  { title: 'Черновик', value: 'DRAFT' },
                  { title: 'Ожидает оплаты', value: 'PENDING_PAYMENT' },
                  { title: 'Подтверждён', value: 'CONFIRMED' },
                  { title: 'Отменён', value: 'CANCELLED' },
                ]"
                item-title="title"
                item-value="value"
                label="Статус бронирования"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Клиентские данные -->
            <v-col cols="12" class="mb-1">
              <div class="detail-section__title">
                <v-icon size="16" color="primary">mdi-account</v-icon>
                Данные клиента
              </div>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.customerFullName"
                label="ФИО"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.customerEmail"
                label="Email"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                type="email"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.customerPhone"
                label="Телефон"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="editForm.customerAdditionalInfo"
                label="Доп. информация"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="editForm.managerComment"
                label="Комментарий менеджера"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                rows="2"
                auto-grow
                hint="Будет записан в историю изменений"
                persistent-hint
                prepend-inner-icon="mdi-comment-text-outline"
              />
            </v-col>
          </v-row>

          <v-alert v-if="editForm.pickupDate !== selectedBooking.pickupDate || editForm.dropoffDate !== selectedBooking.dropoffDate" type="info" variant="tonal" density="compact" class="mt-3">
            При изменении дат стоимость бронирования будет пересчитана автоматически
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="editDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="editSaving" @click="saveEdit">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Cancel Confirmation Dialog -->
    <ModalDialog
      v-model:dialog="cancelDialog"
      title="Отмена бронирования"
      confirm-text="Отменить бронирование"
      @confirm="confirmCancel"
      @close="cancelDialog = false"
    >
      <div v-if="selectedBooking">
        <v-alert type="warning" variant="tonal" class="mb-4" density="compact">
          Это действие нельзя отменить. Автомобиль станет доступен для других бронирований.
        </v-alert>
        <div class="d-flex align-center ga-3 mb-3">
          <v-avatar size="40" rounded="lg">
            <v-img :src="selectedBooking.vehicle.image" cover />
          </v-avatar>
          <div>
            <div class="text-body-2 font-weight-bold">
              {{ selectedBooking.vehicle.brand }} {{ selectedBooking.vehicle.model }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ selectedBooking.customer.fullName }} · {{ formatDateFull(selectedBooking.pickupDate) }} — {{ formatDateFull(selectedBooking.dropoffDate) }}
            </div>
          </div>
        </div>
        <div class="text-body-1 font-weight-bold">
          Сумма: {{ formatMoney(selectedBooking.totalAmount) }}
        </div>
      </div>
    </ModalDialog>
  </v-container>
</template>

<style scoped>
.bookings-admin {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

/* Stat cards */
.stat-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(103, 58, 183, 0.15) !important;
  border-color: rgba(103, 58, 183, 0.2);
}

.ls-wide {
  letter-spacing: 0.08em;
}

/* Table card */
.table-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.vehicle-avatar {
  border: 2px solid rgba(103, 58, 183, 0.15);
}

.bookings-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}

/* Detail dialog */
.detail-header {
  background: linear-gradient(135deg, #311b92 0%, #4527a0 50%, #283593 100%);
  color: white;
}
.detail-header .text-medium-emphasis {
  color: rgba(255, 255, 255, 0.7) !important;
}

.detail-section {
  margin-bottom: 16px;
}
.detail-section__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(0, 0, 0, 0.45);
  margin-bottom: 8px;
}

.pricing-table {
  width: 100%;
  border-collapse: collapse;
}
.pricing-table td {
  padding: 2px 0;
}
.pricing-total td {
  padding-top: 6px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.dialog-header {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(40, 53, 147, 0.05));
}
</style>
