<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from '@/axios/api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditLog {
  id: number;
  managerId: number;
  managerLogin: string | null;
  entityType: string;
  entityId: number;
  action: string;
  diffJson: string | null;
  createdAt: string;
}

interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

// ─── State ────────────────────────────────────────────────────────────────────

const loading = ref(false);
const logs = ref<AuditLog[]>([]);
const totalItems = ref(0);
const page = ref(1);
const itemsPerPage = ref(20);

// Filters
const filterEntityType = ref<string | null>(null);
const filterManagerLogin = ref<string>('');
const filterEntityId = ref<string>('');
const filterDateFrom = ref<string>('');
const filterDateTo = ref<string>('');

// Detail dialog
const detailDialog = ref(false);
const selectedLog = ref<AuditLog | null>(null);

// ─── Constants ────────────────────────────────────────────────────────────────

const entityTypes = [
  { title: 'Все', value: null },
  { title: 'Бронирование', value: 'BOOKING' },
  { title: 'Автомобиль', value: 'VEHICLE' },
  { title: 'Платёж', value: 'PAYMENT' },
  { title: 'Блокировка авто', value: 'VEHICLE_BLOCKED_PERIOD' },
  { title: 'Доп. услуга', value: 'SERVICE_OPTION' },
  { title: 'Тарифный шаблон', value: 'PRICING_TEMPLATE' },
  { title: 'Характеристика', value: 'VEHICLE_ATTRIBUTE' },
  { title: 'Пользователь', value: 'AUTH_USER' },
];

const actionLabels: Record<string, { text: string; color: string; icon: string }> = {
  CREATE:        { text: 'Создание',      color: 'success',  icon: 'mdi-plus-circle-outline' },
  UPDATE:        { text: 'Изменение',     color: 'info',     icon: 'mdi-pencil-outline' },
  DELETE:        { text: 'Удаление',      color: 'error',    icon: 'mdi-delete-outline' },
  STATUS_CHANGE: { text: 'Смена статуса', color: 'warning',  icon: 'mdi-swap-horizontal' },
  CANCEL:        { text: 'Отмена',        color: 'grey',     icon: 'mdi-cancel' },
  UPLOAD:        { text: 'Загрузка',      color: 'primary',  icon: 'mdi-upload' },
  BLOCK:         { text: 'Блокировка',    color: 'error',    icon: 'mdi-lock-outline' },
  UNBLOCK:       { text: 'Разблокировка', color: 'success',  icon: 'mdi-lock-open-outline' },
};

const entityTypeLabels: Record<string, string> = {
  BOOKING: 'Бронирование',
  VEHICLE: 'Автомобиль',
  PAYMENT: 'Платёж',
  VEHICLE_BLOCKED_PERIOD: 'Блокировка авто',
  SERVICE_OPTION: 'Доп. услуга',
  PRICING_TEMPLATE: 'Тарифный шаблон',
  VEHICLE_ATTRIBUTE: 'Характеристика',
  AUTH_USER: 'Пользователь',
};

const headers = [
  { title: 'ID', key: 'id', width: '70px' },
  { title: 'Дата', key: 'createdAt', width: '170px' },
  { title: 'Менеджер', key: 'managerLogin', width: '140px' },
  { title: 'Сущность', key: 'entityType', width: '160px' },
  { title: 'ID сущн.', key: 'entityId', width: '90px' },
  { title: 'Действие', key: 'action', width: '150px' },
  { title: '', key: 'actions', sortable: false, width: '60px' },
];

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchLogs() {
  loading.value = true;
  try {
    const params: Record<string, string | number> = {
      page: page.value - 1,
      size: itemsPerPage.value,
    };
    if (filterEntityType.value) params.entityType = filterEntityType.value;
    if (filterManagerLogin.value) params.managerLogin = filterManagerLogin.value;
    if (filterEntityId.value) params.entityId = filterEntityId.value;
    if (filterDateFrom.value) params.from = filterDateFrom.value + 'T00:00:00';
    if (filterDateTo.value) params.to = filterDateTo.value + 'T23:59:59';

    const data = await api.get<PageResponse<AuditLog>>('/api/v1/audit-logs', { params });
    logs.value = data.content;
    totalItems.value = data.totalElements;
  } catch (e) {
    logs.value = [];
    totalItems.value = 0;
  } finally {
    loading.value = false;
  }
}

function resetFilters() {
  filterEntityType.value = null;
  filterManagerLogin.value = '';
  filterEntityId.value = '';
  filterDateFrom.value = '';
  filterDateTo.value = '';
  page.value = 1;
  fetchLogs();
}

function onPageChange(p: number) {
  page.value = p;
  fetchLogs();
}

// ─── Detail ───────────────────────────────────────────────────────────────────

function openDetail(log: AuditLog) {
  selectedLog.value = log;
  detailDialog.value = true;
}

function formatDate(dateStr: string) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function getActionInfo(action: string) {
  return actionLabels[action] || { text: action, color: 'grey', icon: 'mdi-help-circle-outline' };
}

function getEntityLabel(type: string) {
  return entityTypeLabels[type] || type;
}

function formatJson(json: string | null): string {
  if (!json) return '—';
  try {
    return JSON.stringify(JSON.parse(json), null, 2);
  } catch {
    return json;
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const statsToday = computed(() => {
  const today = new Date().toISOString().slice(0, 10);
  return logs.value.filter(l => l.createdAt?.startsWith(today)).length;
});

// ─── Lifecycle ────────────────────────────────────────────────────────────────

onMounted(fetchLogs);
</script>

<template>
  <v-container fluid class="pa-6">
    <!-- Header -->
    <div class="d-flex align-center mb-6">
      <div>
        <h1 class="text-h5 font-weight-bold">Журнал действий</h1>
        <p class="text-body-2 text-medium-emphasis mt-1">
          Аудит-лог всех операций менеджеров
        </p>
      </div>
      <v-spacer />
      <v-chip variant="tonal" color="primary" class="mr-2">
        <v-icon start size="16">mdi-file-document-outline</v-icon>
        {{ totalItems }} записей
      </v-chip>
      <v-btn icon variant="text" @click="fetchLogs" :loading="loading">
        <v-icon>mdi-refresh</v-icon>
      </v-btn>
    </div>

    <!-- Filters -->
    <v-card variant="outlined" rounded="lg" class="mb-5">
      <v-card-text>
        <v-row dense align="center">
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filterEntityType"
              :items="entityTypes"
              item-title="title"
              item-value="value"
              label="Сущность"
              density="compact"
              variant="outlined"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filterManagerLogin"
              label="Логин менеджера"
              density="compact"
              variant="outlined"
              hide-details
              prepend-inner-icon="mdi-account-search"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filterEntityId"
              label="ID сущности"
              density="compact"
              variant="outlined"
              hide-details
              type="number"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filterDateFrom"
              label="Дата от"
              density="compact"
              variant="outlined"
              hide-details
              type="date"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-text-field
              v-model="filterDateTo"
              label="Дата до"
              density="compact"
              variant="outlined"
              hide-details
              type="date"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2" class="d-flex ga-2">
            <v-btn color="primary" variant="flat" @click="page = 1; fetchLogs()" :loading="loading">
              <v-icon start>mdi-magnify</v-icon>
              Найти
            </v-btn>
            <v-btn variant="tonal" @click="resetFilters">
              <v-icon>mdi-filter-remove-outline</v-icon>
            </v-btn>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Table -->
    <v-card variant="outlined" rounded="lg">
      <v-data-table
        :headers="headers"
        :items="logs"
        :loading="loading"
        :items-per-page="itemsPerPage"
        hide-default-footer
        density="comfortable"
        hover
        class="audit-table"
      >
        <template #item.createdAt="{ item }">
          <span class="text-body-2">{{ formatDate(item.createdAt) }}</span>
        </template>

        <template #item.managerLogin="{ item }">
          <v-chip size="small" variant="tonal" color="primary">
            <v-icon start size="14">mdi-account</v-icon>
            {{ item.managerLogin || `#${item.managerId}` }}
          </v-chip>
        </template>

        <template #item.entityType="{ item }">
          <span class="text-body-2 font-weight-medium">{{ getEntityLabel(item.entityType) }}</span>
        </template>

        <template #item.entityId="{ item }">
          <v-chip size="small" variant="outlined" color="secondary">
            #{{ item.entityId }}
          </v-chip>
        </template>

        <template #item.action="{ item }">
          <v-chip
            size="small"
            :color="getActionInfo(item.action).color"
            variant="tonal"
          >
            <v-icon start size="14">{{ getActionInfo(item.action).icon }}</v-icon>
            {{ getActionInfo(item.action).text }}
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            icon
            variant="text"
            size="small"
            @click="openDetail(item)"
            :disabled="!item.diffJson"
          >
            <v-icon size="18">mdi-code-json</v-icon>
            <v-tooltip activator="parent" location="top">Просмотр данных</v-tooltip>
          </v-btn>
        </template>

        <template #no-data>
          <div class="text-center py-8">
            <v-icon size="48" color="grey-lighten-1" class="mb-3">mdi-clipboard-text-search-outline</v-icon>
            <div class="text-body-1 text-medium-emphasis">Записи не найдены</div>
            <div class="text-body-2 text-disabled">Попробуйте изменить фильтры</div>
          </div>
        </template>
      </v-data-table>

      <!-- Pagination -->
      <v-divider />
      <div class="d-flex align-center justify-space-between px-4 py-2">
        <span class="text-caption text-medium-emphasis">
          Показано {{ logs.length }} из {{ totalItems }}
        </span>
        <v-pagination
          v-model="page"
          :length="Math.ceil(totalItems / itemsPerPage) || 1"
          :total-visible="5"
          density="compact"
          @update:model-value="onPageChange"
        />
      </div>
    </v-card>

    <!-- Detail Dialog -->
    <v-dialog v-model="detailDialog" max-width="700" scrollable>
      <v-card rounded="lg" v-if="selectedLog">
        <v-card-title class="d-flex align-center pa-4">
          <v-icon class="mr-2" color="primary">mdi-file-document-outline</v-icon>
          <span class="text-h6">Запись #{{ selectedLog.id }}</span>
          <v-spacer />
          <v-btn icon variant="text" size="small" @click="detailDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>

        <v-divider />

        <v-card-text class="pa-5">
          <v-row dense>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis mb-1">Дата</div>
              <div class="text-body-2 font-weight-medium">{{ formatDate(selectedLog.createdAt) }}</div>
            </v-col>
            <v-col cols="6">
              <div class="text-caption text-medium-emphasis mb-1">Менеджер</div>
              <v-chip size="small" variant="tonal" color="primary">
                <v-icon start size="14">mdi-account</v-icon>
                {{ selectedLog.managerLogin || `#${selectedLog.managerId}` }}
              </v-chip>
            </v-col>
            <v-col cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">Сущность</div>
              <div class="text-body-2 font-weight-medium">
                {{ getEntityLabel(selectedLog.entityType) }}
                <v-chip size="x-small" variant="outlined" class="ml-1">#{{ selectedLog.entityId }}</v-chip>
              </div>
            </v-col>
            <v-col cols="6" class="mt-3">
              <div class="text-caption text-medium-emphasis mb-1">Действие</div>
              <v-chip
                size="small"
                :color="getActionInfo(selectedLog.action).color"
                variant="tonal"
              >
                <v-icon start size="14">{{ getActionInfo(selectedLog.action).icon }}</v-icon>
                {{ getActionInfo(selectedLog.action).text }}
              </v-chip>
            </v-col>
          </v-row>

          <div class="mt-5" v-if="selectedLog.diffJson">
            <div class="text-caption text-medium-emphasis mb-2">Данные (JSON)</div>
            <v-sheet
              rounded="lg"
              color="grey-darken-4"
              class="pa-4 json-viewer"
            >
              <pre class="text-body-2" style="white-space: pre-wrap; word-break: break-all; color: #a5d6a7; margin: 0;">{{ formatJson(selectedLog.diffJson) }}</pre>
            </v-sheet>
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.audit-table :deep(th) {
  font-weight: 600 !important;
  text-transform: uppercase;
  font-size: 0.7rem !important;
  letter-spacing: 0.05em;
}

.json-viewer {
  max-height: 400px;
  overflow-y: auto;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 0.8rem;
}
</style>

