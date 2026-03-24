<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue';
import { usePaymentStore } from '@/stores/payments';
import { useBookingsAdminStore } from '@/stores/bookings-admin';
import type { ProcessPaymentRequest, PaymentMethod, PaymentStatus, PaymentDto } from '@/types/payment';

const paymentStore = usePaymentStore();
const bookingsStore = useBookingsAdminStore();

const createDialog = ref(false);
const showProcessDialog = ref(false);
const search = ref('');

// Form for creating a new payment
const newPaymentForm = ref({
  bookingId: null as number | null,
  amount: 0,
  method: 'ONLINE' as PaymentMethod,
  status: 'INITIATED' as PaymentStatus,
});

// Form for processing an existing payment
const processForm = ref<ProcessPaymentRequest>({
  paymentId: 0,
  bookingId: 0,
  paymentMethod: 'ONLINE',
  transactionId: '',
});

const paymentMethods: PaymentMethod[] = ['ONLINE', 'ON_DELIVERY'];

const headers = [
  { title: 'ID', key: 'id', width: '80px' },
  { title: 'Бронирование', key: 'bookingId', width: '140px' },
  { title: 'Сумма', key: 'amount', align: 'end' as const },
  { title: 'Метод', key: 'method' },
  { title: 'Статус', key: 'status', align: 'center' as const },
  { title: 'Транзакция', key: 'transactionId' },
  { title: 'Дата создания', key: 'createdAt' },
  { title: 'Действия', key: 'actions', sortable: false, align: 'center' as const },
];

const getNormalizedValue = (value: any): string => {
  if (!value) return value;
  if (typeof value === 'object') {
    if (value.VALUE) return value.VALUE;
    if (value.value) return value.value;
    if (value.name) return value.name;
  }
  return value;
};

const unpaidBookings = computed(() => {
  return bookingsStore.bookings.filter(booking => {
    const status = getNormalizedValue(booking.paymentStatus);
    return ['UNPAID', 'FAILED'].includes(status);
    //return ['PENDING_PAYMENT', 'UNPAID', 'INITIATED', 'PENDING'].includes(status);
  });
});

// When a booking is selected in the create dialog, auto-fill the amount
watch(() => newPaymentForm.value.bookingId, (newId) => {
  if (newId) {
    const booking = bookingsStore.bookings.find(b => b.id === newId);
    if (booking) {
      newPaymentForm.value.amount = booking.totalAmount;
    }
  } else {
    newPaymentForm.value.amount = 0;
  }
});

const handleInitiate = async () => {
  if (!newPaymentForm.value.bookingId) return;

  try {
    // We need to adapt the store action to accept the whole form object
    // For now, let's assume it does, and we'll fix the store next.
    await paymentStore.initiatePayment(newPaymentForm.value);
    createDialog.value = false;
    newPaymentForm.value = { // Reset form
      bookingId: null,
      amount: 0,
      method: 'ONLINE',
      status: 'PENDING_PAYMENT',
    };
  } catch (e) {
    console.error('Initiation failed', e);
  }
};

const openProcessDialog = (payment: any) => {
  processForm.value.paymentId = payment.id;
  processForm.value.bookingId = payment.bookingId;
  processForm.value.paymentMethod = getNormalizedValue(payment.method) as PaymentMethod;
  processForm.value.transactionId = payment.transactionId || '';
  showProcessDialog.value = true;
};

const handleProcess = async () => {
  try {
    await paymentStore.processPayment(processForm.value);
    showProcessDialog.value = false;
  } catch (e) {
    console.error('Processing failed', e);
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'USD' }).format(amount);
};

const getStatusColor = (status: any) => {
  const normalizedStatus = getNormalizedValue(status);
  switch (normalizedStatus) {
    case 'SUCCESS': return 'success';
    case 'PAID': return 'success';
    case 'INITIATED': return 'warning';
    case 'UNPAID': return 'warning';
    case 'PENDING': return 'warning';
    case 'FAILED': return 'error';
    default: return 'grey';
  }
};

const methodLabels: Record<PaymentMethod, string> = {
  ONLINE: 'Онлайн оплата',
  ON_DELIVERY: 'При получении'
};

onMounted(() => {
  bookingsStore.fetchAllBookings();
  paymentStore.fetchAllPayments();
});
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header Section -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center ga-3">
        <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
          <v-icon size="22">mdi-cash-register</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold">Платежи</h1>
          <p class="text-body-2 text-medium-emphasis">Управление финансовыми транзакциями</p>
        </div>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" @click="createDialog = true">
        <v-icon start>mdi-plus</v-icon>
        Добавить
      </v-btn>
    </div>

    <!-- Stats Cards -->
    <v-row>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-5" rounded="xl" border elevation="0">
          <div class="d-flex align-center ga-4">
            <v-avatar size="48" color="success" variant="tonal" rounded="lg">
              <v-icon>mdi-cash-check</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Всего оплачено</div>
              <div class="text-h5 font-weight-bold">
                {{ formatCurrency(paymentStore.payments.filter(p => ['PAID', 'SUCCESS'].includes(getNormalizedValue(p.status))).reduce((acc, p) => acc + p.amount, 0)) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="4">
        <v-card class="pa-5" rounded="xl" border elevation="0">
          <div class="d-flex align-center ga-4">
            <v-avatar size="48" color="warning" variant="tonal" rounded="lg">
              <v-icon>mdi-cash-clock</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-bold">Ожидает оплаты</div>
              <div class="text-h5 font-weight-bold">
                {{ formatCurrency(paymentStore.payments.filter(p => ['INITIATED', 'FAILED'].includes(getNormalizedValue(p.status))).reduce((acc, p) => acc + p.amount, 0)) }}
              </div>
            </div>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Payments Table Card -->
    <v-card class="mt-6" rounded="xl" elevation="0" border>
      <div class="pa-5 d-flex align-center justify-space-between flex-wrap ga-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary">mdi-table</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Список транзакций</span>
          <v-chip size="x-small" color="primary" variant="tonal">{{ paymentStore.payments.length }}</v-chip>
        </div>
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Поиск по ID или транзакции"
          variant="solo-filled"
          flat
          density="compact"
          rounded="lg"
          hide-details
          style="max-width: 400px; width: 100%"
        />
      </div>

      <v-data-table
        :headers="headers"
        :items="paymentStore.payments"
        :search="search"
        :loading="paymentStore.loading"
        hover
        class="payment-table"
      >
        <template #item.bookingId="{ item }">
          <span class="font-weight-medium text-primary">#{{ item.bookingId }}</span>
        </template>
        <template #item.amount="{ item }">
          <span class="font-weight-bold">{{ formatCurrency(item.amount) }}</span>
        </template>
        <template #item.method="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="small" color="medium-emphasis">
              {{ getNormalizedValue(item.method) === 'ONLINE' ? 'mdi-earth' : 'mdi-hand-coin' }}
            </v-icon>
            <span class="text-body-2">{{ methodLabels[getNormalizedValue(item.method) as PaymentMethod] }}</span>
          </div>
        </template>
        <template #item.status="{ item }">
          <v-chip
            :color="getStatusColor(item.status)"
            size="x-small"
            variant="flat"
            class="text-uppercase font-weight-bold px-3"
          >
            {{ getNormalizedValue(item.status) }}
          </v-chip>
        </template>
        <template #item.transactionId="{ item }">
          <code v-if="item.transactionId" class="text-caption px-2 py-1 rounded bg-grey-lighten-4">
            {{ item.transactionId }}
          </code>
          <span v-else class="text-caption text-medium-emphasis italic">отсутствует</span>
        </template>
        <template #item.createdAt="{ item }">
          <div class="text-caption">
            <div>{{ new Date(item.createdAt).toLocaleDateString() }}</div>
            <div class="text-medium-emphasis">{{ new Date(item.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) }}</div>
          </div>
        </template>
        <template #item.actions="{ item }">
          <v-btn
            v-if="['INITIATED', 'FAILED'].includes(getNormalizedValue(item.status))"
            icon="mdi-check-circle"
            variant="text"
            size="small"
            color="success"
            @click="openProcessDialog(item)"
          />
          <v-btn
            v-else
            icon="mdi-eye-outline"
            variant="text"
            size="small"
            color="primary"
            class="action-btn"
          />
        </template>
        <template #no-data>
          <div class="pa-10 text-center">
            <v-icon size="64" color="grey-lighten-1">mdi-cash-off</v-icon>
            <div class="text-h6 text-medium-emphasis mt-4">Транзакций не найдено</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create Payment Dialog -->
    <v-dialog v-model="createDialog" max-width="600" scrollable>
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2">
          <div class="d-flex align-center ga-3">
            <v-avatar color="primary" variant="tonal" size="40">
              <v-icon>mdi-plus-circle</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-bold">Создать новый платеж</span>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12">
              <v-autocomplete
                v-model="newPaymentForm.bookingId"
                :items="unpaidBookings"
                item-title="id"
                item-value="id"
                label="Выберите бронирование для оплаты"
                variant="outlined"
                placeholder="Начните вводить ID или имя клиента"
                persistent-placeholder
                :loading="bookingsStore.loading"
                clearable
                rounded="lg"
                no-data-text="Нет бронирований, ожидающих оплату"
              >
                <template #selection="{ item }">
                  <span class="font-weight-medium">Бронирование #{{ item.raw.id }}</span>
                </template>
                <template #item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template #title>
                      <div class="font-weight-bold">Бронирование #{{ item.raw.id }}</div>
                    </template>
                    <template #subtitle>
                      <div>{{ item.raw.customer.fullName }} | {{ item.raw.vehicle.brand }} {{ item.raw.vehicle.model }}</div>
                      <div class="text-primary font-weight-medium">{{ formatCurrency(item.raw.totalAmount) }}</div>
                    </template>
                    <template #append>
                      <v-chip size="x-small" :color="getStatusColor(item.raw.paymentStatus)">
                        {{ getNormalizedValue(item.raw.paymentStatus) }}
                      </v-chip>
                    </template>
                  </v-list-item>
                </template>
              </v-autocomplete>
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="newPaymentForm.amount"
                label="Сумма платежа"
                type="number"
                variant="outlined"
                rounded="lg"
                prefix="$"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="newPaymentForm.method"
                :items="paymentMethods"
                label="Способ оплаты"
                variant="outlined"
                rounded="lg"
              />
            </v-col>
            <v-col cols="12">
              <p class="text-caption text-medium-emphasis">
                Статус будет установлен как <strong>{{ newPaymentForm.status }}</strong>.
                <br>
                Дата создания: <strong>{{ new Date().toLocaleString() }}</strong>
              </p>
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="createDialog = false">Отмена</v-btn>
          <v-btn
            color="primary"
            variant="flat"
            rounded="lg"
            :loading="paymentStore.loading"
            :disabled="!newPaymentForm.bookingId || newPaymentForm.amount <= 0"
            @click="handleInitiate"
          >
            Создать платеж
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Process Payment Dialog (Remains the same) -->
    <v-dialog v-model="showProcessDialog" max-width="500">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-2">
          <div class="d-flex align-center ga-3">
            <v-avatar color="success" variant="tonal" size="40">
              <v-icon>mdi-cash-check</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-bold">Подтверждение оплаты</span>
          </div>
        </v-card-title>
        <v-card-text class="pa-6">
          <v-select
            v-model="processForm.paymentMethod"
            :items="paymentMethods"
            label="Способ оплаты"
            variant="outlined"
            rounded="lg"
            class="mb-4"
          >
            <template #item="{ props, item }">
              <v-list-item v-bind="props" :title="methodLabels[item.value as PaymentMethod]" />
            </template>
            <template #selection="{ item }">
              {{ methodLabels[item.value as PaymentMethod] }}
            </template>
          </v-select>
          <v-text-field
            v-model="processForm.transactionId"
            label="ID транзакции"
            placeholder="Напр. банковский код или чек"
            variant="outlined"
            rounded="lg"
            hide-details
          />
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-6">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="showProcessDialog = false">Отмена</v-btn>
          <v-btn
            color="success"
            variant="flat"
            rounded="lg"
            :loading="paymentStore.loading"
            @click="handleProcess"
          >
            Подтвердить получение
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.payment-table :deep(th) {
  text-transform: uppercase;
  font-size: 0.75rem !important;
  font-weight: 700 !important;
  color: rgba(0, 0, 0, 0.45) !important;
  letter-spacing: 0.05em;
}

.payment-table :deep(td) {
  font-size: 0.875rem !important;
}

.action-btn {
  opacity: 0.5;
}
</style>
