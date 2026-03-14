<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import ModalDialog from '@/components/UserModal.vue';
import api from "@/axios/api";


interface ServiceOption {
  id: number;
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  pricePerDay: number;
  active: boolean;
  sortOrder: number;
  totalQuantity: number | null;
  availableQuantity: number | null;
  hasInventoryLimit: boolean;
}

interface ServiceOptionForm {
  code: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  pricePerDay: number;
  active: boolean;
  sortOrder: number;
  totalQuantity: number | null;
}

const items = ref<ServiceOption[]>([]);
const loading = ref(false);
const formDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const selectedItem = ref<ServiceOption | null>(null);
const searchText = ref('');
const categoryFilter = ref('all');

const emptyForm = (): ServiceOptionForm => ({
  code: '',
  name: '',
  description: '',
  category: 'EQUIPMENT',
  icon: 'mdi-plus-box',
  pricePerDay: 0,
  active: true,
  sortOrder: 0,
  totalQuantity: null,
});

const form = ref<ServiceOptionForm>(emptyForm());

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Код', key: 'code', width: '160px' },
  { title: 'Название', key: 'name' },
  { title: 'Категория', key: 'category', width: '140px' },
  { title: 'Цена/день', key: 'pricePerDay', align: 'end' as const, width: '110px' },
  { title: 'Запас', key: 'inventory', align: 'center' as const, width: '100px' },
  { title: 'Статус', key: 'active', align: 'center' as const, width: '100px' },
  { title: '', key: 'actions', sortable: false, width: '120px', align: 'center' as const },
];

const categoryOptions = [
  { title: 'Все', value: 'all' },
  { title: '🏕️ Оборудование', value: 'EQUIPMENT' },
  { title: '🚗 Доставка', value: 'DELIVERY' },
  { title: '📄 Документы', value: 'DOCUMENTS' },
  { title: '📦 Другое', value: 'OTHER' },
];

const categoryConfig: Record<string, { color: string; icon: string; label: string }> = {
  EQUIPMENT: { color: 'primary', icon: 'mdi-tent', label: 'Оборудование' },
  DELIVERY: { color: 'info', icon: 'mdi-truck-delivery-outline', label: 'Доставка' },
  DOCUMENTS: { color: 'warning', icon: 'mdi-file-document-outline', label: 'Документы' },
  OTHER: { color: 'grey', icon: 'mdi-dots-horizontal', label: 'Другое' },
};

const filteredItems = computed(() => {
  let result = items.value;
  if (categoryFilter.value !== 'all') {
    result = result.filter(i => i.category === categoryFilter.value);
  }
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase();
    result = result.filter(i =>
      i.name.toLowerCase().includes(q) ||
      i.code.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  }
  return result;
});

const activeCount = computed(() => items.value.filter(i => i.active).length);

async function fetchAll() {
  loading.value = true;
  try {
    items.value = await api.get<ServiceOption[]>(`/api/v1/service-options`);
  } catch (e) {
    console.error('fetch error:', e);
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  isEditing.value = false;
  selectedItem.value = null;
  form.value = emptyForm();
  formDialog.value = true;
}

function openEdit(item: ServiceOption) {
  isEditing.value = true;
  selectedItem.value = item;
  form.value = {
    code: item.code,
    name: item.name,
    description: item.description || '',
    category: item.category,
    icon: item.icon || 'mdi-plus-box',
    pricePerDay: item.pricePerDay,
    active: item.active,
    sortOrder: item.sortOrder,
    totalQuantity: item.totalQuantity,
  };
  formDialog.value = true;
}

function openDelete(item: ServiceOption) {
  selectedItem.value = item;
  deleteDialog.value = true;
}

async function saveItem() {
  const url = isEditing.value && selectedItem.value
    ? `/api/v1/service-options/${selectedItem.value.id}`
    : `/api/v1/service-options`;
  const method = isEditing.value ? 'PUT' : 'POST';
  try {
    if (method === 'POST') {
      await api.post<ServiceOption>(url, form.value);
    } else {
      await api.put<ServiceOption>(url, form.value);
    }
    formDialog.value = false;
    await fetchAll();
  } catch (e) {
    console.error('save error:', e);
  }
}

async function confirmDelete() {
  if (!selectedItem.value) return;
  try {
    await api.delete(`/api/v1/service-options/${selectedItem.value.id}`);
    deleteDialog.value = false;
    selectedItem.value = null;
    await fetchAll();
  } catch (e) {
    console.error('delete error:', e);
  }
}

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

onMounted(fetchAll);
</script>

<template>
  <v-container fluid class="services-admin pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Дополнительные услуги</h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ items.length }} услуг · {{ activeCount }} активных
        </p>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" @click="openCreate">
        <v-icon start>mdi-plus</v-icon>
        Добавить услугу
      </v-btn>
    </div>

    <!-- Table Card -->
    <v-card elevation="0" rounded="xl" class="table-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="22">mdi-cog-outline</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Список услуг</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-1">{{ filteredItems.length }}</v-chip>
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
            style="min-width: 220px; max-width: 280px"
            clearable
            placeholder="Поиск..."
          />
          <v-select
            v-model="categoryFilter"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            variant="solo-filled"
            flat
            density="compact"
            rounded="lg"
            hide-details
            style="min-width: 180px; max-width: 200px"
          />
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredItems"
        :loading="loading"
        item-value="id"
        hover
        items-per-page="20"
        class="services-table"
      >
        <!-- Code -->
        <template #item.code="{ item }">
          <code class="text-caption">{{ item.code }}</code>
        </template>

        <!-- Name -->
        <template #item.name="{ item }">
          <div class="d-flex align-center ga-2">
            <v-icon size="20" :color="categoryConfig[item.category]?.color || 'grey'">{{ item.icon || 'mdi-plus-box' }}</v-icon>
            <div>
              <div class="text-body-2 font-weight-bold">{{ item.name }}</div>
              <div v-if="item.description" class="text-caption text-medium-emphasis text-truncate" style="max-width: 300px">{{ item.description }}</div>
            </div>
          </div>
        </template>

        <!-- Category -->
        <template #item.category="{ item }">
          <v-chip
            :color="categoryConfig[item.category]?.color || 'grey'"
            size="small"
            variant="tonal"
            :prepend-icon="categoryConfig[item.category]?.icon"
          >
            {{ categoryConfig[item.category]?.label || item.category }}
          </v-chip>
        </template>

        <!-- Price -->
        <template #item.pricePerDay="{ item }">
          <span class="text-body-2 font-weight-bold">{{ formatMoney(item.pricePerDay) }}</span>
        </template>

        <!-- Inventory -->
        <template #item.inventory="{ item }">
          <div v-if="item.hasInventoryLimit" class="d-flex align-center justify-center ga-1">
            <v-chip
              :color="(item.availableQuantity ?? 0) > 0 ? 'success' : 'error'"
              size="small"
              variant="tonal"
            >
              {{ item.availableQuantity ?? '?' }} / {{ item.totalQuantity }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">∞</span>
        </template>

        <!-- Active -->
        <template #item.active="{ item }">
          <v-chip :color="item.active ? 'success' : 'grey'" size="small" variant="tonal">
            {{ item.active ? 'Активна' : 'Отключена' }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #item.actions="{ item }">
          <div class="d-flex ga-1 justify-center">
            <v-tooltip text="Редактировать" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="primary" @click="openEdit(item)">
                  <v-icon size="20">mdi-pencil-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
            <v-tooltip text="Удалить" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="error" @click="openDelete(item)">
                  <v-icon size="20">mdi-delete-outline</v-icon>
                </v-btn>
              </template>
            </v-tooltip>
          </div>
        </template>

        <template #no-data>
          <div class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-cog-off-outline</v-icon>
            <div class="text-h6 text-grey mt-3">Услуг не найдено</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="600" scrollable>
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            </v-avatar>
            <div class="text-h6 font-weight-bold">
              {{ isEditing ? 'Редактировать услугу' : 'Добавить услугу' }}
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.code" label="Код (уникальный)" variant="outlined" rounded="lg" density="comfortable"
                placeholder="ROOF_TENT" :disabled="isEditing" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.name" label="Название" variant="outlined" rounded="lg" density="comfortable" />
            </v-col>
            <v-col cols="12">
              <v-textarea v-model="form.description" label="Описание" variant="outlined" rounded="lg" density="comfortable"
                rows="2" auto-grow />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.category" label="Категория"
                :items="[
                  { title: 'Оборудование', value: 'EQUIPMENT' },
                  { title: 'Доставка', value: 'DELIVERY' },
                  { title: 'Документы', value: 'DOCUMENTS' },
                  { title: 'Другое', value: 'OTHER' },
                ]"
                item-title="title" item-value="value"
                variant="outlined" rounded="lg" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.icon" label="Иконка (MDI)" variant="outlined" rounded="lg" density="comfortable"
                placeholder="mdi-tent" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="form.pricePerDay" label="Цена/день ($)" type="number"
                variant="outlined" rounded="lg" density="comfortable" min="0" step="0.01" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field v-model.number="form.sortOrder" label="Порядок" type="number"
                variant="outlined" rounded="lg" density="comfortable" min="0" />
            </v-col>
            <v-col cols="12" sm="4">
              <v-text-field
                v-model.number="form.totalQuantity"
                label="Кол-во (запас)"
                type="number"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                min="0"
                clearable
                hint="Пусто = неограничено"
                persistent-hint
              />
            </v-col>
            <v-col cols="12" sm="4" class="d-flex align-center">
              <v-switch v-model="form.active" label="Активна" color="success" hide-details />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="saveItem">
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <ModalDialog
      v-model:dialog="deleteDialog"
      title="Удалить услугу"
      confirm-text="Удалить"
      @confirm="confirmDelete"
      @close="deleteDialog = false"
    >
      <div v-if="selectedItem">
        <v-alert type="error" variant="tonal" class="mb-4" density="compact">
          Услуга будет удалена. Это не затронет уже созданные бронирования.
        </v-alert>
        <div class="d-flex align-center ga-3">
          <v-icon size="32" :color="categoryConfig[selectedItem.category]?.color">{{ selectedItem.icon }}</v-icon>
          <div>
            <div class="text-body-1 font-weight-bold">{{ selectedItem.name }}</div>
            <div class="text-body-2 text-medium-emphasis">{{ selectedItem.code }} · {{ formatMoney(selectedItem.pricePerDay) }}/день</div>
          </div>
        </div>
      </div>
    </ModalDialog>
  </v-container>
</template>

<style scoped>
.services-admin {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1200px;
  margin: 0 auto;
}
.table-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}
.dialog-header {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(40, 53, 147, 0.05));
}
.services-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}
</style>

