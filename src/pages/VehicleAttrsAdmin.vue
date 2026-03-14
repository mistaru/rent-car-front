<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import api from "@/axios/api";


interface VehicleAttributeItem {
  id: number;
  code: string;
  name: string;
  valueType: string;
  possibleValues: string[];
  filterable: boolean;
  sortOrder: number;
  active: boolean;
}

const items = ref<VehicleAttributeItem[]>([]);
const loading = ref(false);
const formDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const selectedItem = ref<VehicleAttributeItem | null>(null);
const searchText = ref('');

const emptyForm = () => ({
  code: '',
  name: '',
  valueType: 'ENUM',
  possibleValues: [] as string[],
  possibleValuesText: '',
  filterable: true,
  sortOrder: 0,
  active: true,
});

const form = ref(emptyForm());

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Код', key: 'code', width: '140px' },
  { title: 'Название', key: 'name' },
  { title: 'Тип', key: 'valueType', width: '100px' },
  { title: 'Значения', key: 'possibleValues' },
  { title: 'Фильтр', key: 'filterable', align: 'center' as const, width: '90px' },
  { title: 'Статус', key: 'active', align: 'center' as const, width: '90px' },
  { title: '', key: 'actions', sortable: false, width: '120px', align: 'center' as const },
];

const valueTypeOptions = [
  { title: 'Список (ENUM)', value: 'ENUM' },
  { title: 'Текст', value: 'TEXT' },
  { title: 'Число', value: 'NUMBER' },
  { title: 'Да/Нет', value: 'BOOLEAN' },
];

const typeConfig: Record<string, { color: string; icon: string }> = {
  ENUM: { color: 'primary', icon: 'mdi-format-list-bulleted' },
  TEXT: { color: 'info', icon: 'mdi-text-box-outline' },
  NUMBER: { color: 'warning', icon: 'mdi-numeric' },
  BOOLEAN: { color: 'success', icon: 'mdi-toggle-switch-outline' },
};

const filteredItems = computed(() => {
  if (!searchText.value.trim()) return items.value;
  const q = searchText.value.toLowerCase();
  return items.value.filter(i =>
    i.name.toLowerCase().includes(q) || i.code.toLowerCase().includes(q)
  );
});

async function fetchAll() {
  loading.value = true;
  try {
    items.value = await api.get<VehicleAttributeItem[]>(`/api/v1/vehicle-attributes`);
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

function openEdit(item: VehicleAttributeItem) {
  isEditing.value = true;
  selectedItem.value = item;
  form.value = {
    code: item.code,
    name: item.name,
    valueType: item.valueType,
    possibleValues: item.possibleValues || [],
    possibleValuesText: (item.possibleValues || []).join(', '),
    filterable: item.filterable,
    sortOrder: item.sortOrder,
    active: item.active,
  };
  formDialog.value = true;
}

function openDelete(item: VehicleAttributeItem) {
  selectedItem.value = item;
  deleteDialog.value = true;
}

async function saveItem() {
  const body = {
    code: form.value.code,
    name: form.value.name,
    valueType: form.value.valueType,
    possibleValues: form.value.valueType === 'ENUM'
      ? form.value.possibleValuesText.split(',').map(s => s.trim()).filter(Boolean)
      : null,
    filterable: form.value.filterable,
    sortOrder: form.value.sortOrder,
    active: form.value.active,
  };
  const url = isEditing.value && selectedItem.value
    ? `/api/v1/vehicle-attributes/${selectedItem.value.id}`
    : `/api/v1/vehicle-attributes`;
  const method = isEditing.value ? 'PUT' : 'POST';
  try {
    if (method === 'POST') {
      await api.post<VehicleAttributeItem>(url, body);
    } else {
      await api.put<VehicleAttributeItem>(url, body);
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
    await api.delete(`/api/v1/vehicle-attributes/${selectedItem.value.id}`);
    deleteDialog.value = false;
    selectedItem.value = null;
    await fetchAll();
  } catch (e) {
    console.error('delete error:', e);
  }
}

onMounted(fetchAll);
</script>

<template>
  <v-container fluid class="attrs-admin pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold mb-1">Характеристики автомобилей</h1>
        <p class="text-body-2 text-medium-emphasis">
          {{ items.length }} характеристик · {{ items.filter(i => i.filterable).length }} с фильтрами
        </p>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" @click="openCreate">
        <v-icon start>mdi-plus</v-icon>
        Добавить
      </v-btn>
    </div>

    <!-- Table -->
    <v-card elevation="0" rounded="xl" class="table-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="22">mdi-tune-variant</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Справочник</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-1">{{ filteredItems.length }}</v-chip>
        </div>
        <v-text-field v-model="searchText" prepend-inner-icon="mdi-magnify" variant="solo-filled" flat
          density="compact" rounded="lg" hide-details style="min-width: 220px; max-width: 300px"
          clearable placeholder="Поиск..." />
      </div>

      <v-data-table :headers="headers" :items="filteredItems" :loading="loading" item-value="id" hover
        items-per-page="20" class="attrs-table">

        <template #item.code="{ item }">
          <code class="text-caption">{{ item.code }}</code>
        </template>

        <template #item.valueType="{ item }">
          <v-chip :color="typeConfig[item.valueType]?.color || 'grey'" size="small" variant="tonal"
            :prepend-icon="typeConfig[item.valueType]?.icon">
            {{ item.valueType }}
          </v-chip>
        </template>

        <template #item.possibleValues="{ item }">
          <div v-if="item.possibleValues?.length" class="d-flex flex-wrap ga-1">
            <v-chip v-for="v in item.possibleValues.slice(0, 5)" :key="v" size="x-small" variant="outlined">{{ v }}</v-chip>
            <v-chip v-if="item.possibleValues.length > 5" size="x-small" variant="tonal" color="grey">
              +{{ item.possibleValues.length - 5 }}
            </v-chip>
          </div>
          <span v-else class="text-caption text-medium-emphasis">—</span>
        </template>

        <template #item.filterable="{ item }">
          <v-icon :color="item.filterable ? 'success' : 'grey'" size="20">
            {{ item.filterable ? 'mdi-filter-check' : 'mdi-filter-off' }}
          </v-icon>
        </template>

        <template #item.active="{ item }">
          <v-chip :color="item.active ? 'success' : 'grey'" size="x-small" variant="tonal">
            {{ item.active ? 'Вкл' : 'Выкл' }}
          </v-chip>
        </template>

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
            <v-icon size="64" color="grey-lighten-1">mdi-tune-variant</v-icon>
            <div class="text-h6 text-grey mt-3">Характеристик не найдено</div>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create/Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="560" scrollable>
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            </v-avatar>
            <div class="text-h6 font-weight-bold">
              {{ isEditing ? 'Редактировать' : 'Добавить характеристику' }}
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.code" label="Код (уникальный)" variant="outlined" rounded="lg"
                density="comfortable" placeholder="BODY_TYPE" :disabled="isEditing" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model="form.name" label="Название" variant="outlined" rounded="lg"
                density="comfortable" placeholder="Тип кузова" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select v-model="form.valueType" label="Тип значения" :items="valueTypeOptions"
                item-title="title" item-value="value" variant="outlined" rounded="lg" density="comfortable" />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field v-model.number="form.sortOrder" label="Порядок" type="number"
                variant="outlined" rounded="lg" density="comfortable" min="0" />
            </v-col>
            <v-col cols="12" v-if="form.valueType === 'ENUM'">
              <v-textarea v-model="form.possibleValuesText" label="Допустимые значения (через запятую)"
                variant="outlined" rounded="lg" density="comfortable" rows="2" auto-grow
                placeholder="Sedan, SUV, Coupe, Hatchback" />
            </v-col>
            <v-col cols="6">
              <v-switch v-model="form.filterable" label="Фильтр" color="primary" hide-details />
            </v-col>
            <v-col cols="6">
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
    <v-dialog v-model="deleteDialog" max-width="420">
      <v-card rounded="xl">
        <v-card-text class="pa-6">
          <div class="text-h6 font-weight-bold mb-3">Удалить характеристику?</div>
          <v-alert type="error" variant="tonal" density="compact" class="mb-4">
            Все значения этой характеристики у автомобилей будут удалены.
          </v-alert>
          <div v-if="selectedItem" class="text-body-1">
            <strong>{{ selectedItem.name }}</strong> ({{ selectedItem.code }})
          </div>
        </v-card-text>
        <v-card-actions class="pa-5 pt-0">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="confirmDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.attrs-admin {
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
.attrs-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}
</style>

