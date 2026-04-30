<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVehiclesAdminStore } from '@/stores/vehicles-admin';
import type { VehicleAdmin, VehicleFormData, BlockedPeriod, CreateBlockedPeriodData } from '@/stores/vehicles-admin';
import ModalDialog from '@/components/UserModal.vue';
import CarImageCarousel from '@/components/rental/CarImageCarousel.vue';
import { BASE_URL } from '@/axios/api';
import api from '@/axios/api';

const store = useVehiclesAdminStore();

const loading = ref(false);
const formDialog = ref(false);
const deleteDialog = ref(false);
const blockDialog = ref(false);
const deleteBlockDialog = ref(false);
const isEditing = ref(false);
const selectedVehicle = ref<VehicleAdmin | null>(null);
const selectedBlock = ref<BlockedPeriod | null>(null);
const searchText = ref('');
const statusFilter = ref('all');
const dateFrom = ref('');
const dateTo = ref('');
const blockSaving = ref(false);
const blockError = ref('');
const pendingDeleteImageIds = ref<number[]>([]);
const lightbox = ref(false);
const lightboxSrc = ref('');

const openLightbox = (url: string) => {
  lightboxSrc.value = url;
  lightbox.value = true;
};


const reasonOptions = [
  'Техобслуживание',
  'Ремонт',
  'Сезонное хранение',
  'Подготовка к продаже',
  'Страховой случай',
  'Другое',
];

const emptyBlockForm = (): CreateBlockedPeriodData => ({
  vehicleId: 0,
  startDate: '',
  endDate: '',
  reason: '',
});
const blockForm = ref<CreateBlockedPeriodData>(emptyBlockForm());
const isEditingBlock = ref(false);

const emptyForm = (): VehicleFormData => ({
  brand: '',
  model: '',
  licensePlate: '',
  pricePerDay: 0,
  minPricePerDay: null,
  image: '',
  carClass: '',
  status: 'available',
  locationId: null,
  pricingTemplateId: null,
});

const form = ref<VehicleFormData>(emptyForm());

const vehicleAttributes = ref<Array<{
  id: number; code: string; name: string; valueType: string;
  possibleValues: string[]; filterable: boolean; active: boolean;
}>>([]);
const attributeValues = ref<Record<string, string>>({});

// Загрузка справочника атрибутов
const fetchAttributes = async () => {
  try {
    vehicleAttributes.value = await api.get('/api/v1/vehicle-attributes');
  } catch (e) {
    console.error('fetchAttributes error:', e);
  }
};

// Загрузка значений атрибутов для конкретного авто
const fetchAttributeValues = async (vehicleId: number) => {
  try {
    attributeValues.value = await api.get(`/api/v1/vehicle-attributes/vehicle/${vehicleId}`);
  } catch (e) {
    attributeValues.value = {};
  }
};

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Фото', key: 'image', width: '70px', sortable: false },
  { title: 'Марка / Модель', key: 'brand' },
  { title: 'Гос. номер', key: 'licensePlate' },
  { title: 'Класс', key: 'carClass' },
  { title: 'Цена/день', key: 'pricePerDay', align: 'end' as const },
  { title: 'Статус', key: 'status', align: 'center' as const },
  { title: '', key: 'actions', sortable: false, width: '160px', align: 'center' as const },
];

const statusOptions = [
  { title: 'Все', value: 'all' },
  { title: 'Доступен', value: 'available' },
  { title: 'Забронирован', value: 'booked' },
  { title: 'Зарезервирован', value: 'reserved' },
  { title: 'Недоступен', value: 'unavailable' },
];

const statusConfig: Record<string, { color: string; icon: string; label: string }> = {
  available: { color: 'success', icon: 'mdi-check-circle', label: 'Доступен' },
  reserved: { color: 'info', icon: 'mdi-clock-outline', label: 'Зарезервирован' },
  booked: { color: 'warning', icon: 'mdi-car-key', label: 'Забронирован' },
  unavailable: { color: 'error', icon: 'mdi-close-circle', label: 'Недоступен' },
};

const carClassOptions = ['Economy', 'Comfort', 'Business', 'Premium', 'Luxury Sedan', 'Sports Car', 'SUV', 'Electric', 'Off-Road'];

const pricingTemplateOptions = computed(() => {
  return store.pricingTemplates.map(t => ({
    title: `${t.name}${t.active ? '' : ' (неактивен)'}${t.minPricePerDay ? ` — от $${t.minPricePerDay}` : ''}`,
    value: t.id,
  }));
});

const selectedTemplateTiers = computed(() => {
  if (!form.value.pricingTemplateId) return [];
  const tmpl = store.pricingTemplates.find(t => t.id === form.value.pricingTemplateId);
  return tmpl?.tiers || [];
});

const selectedTemplateMinPrice = computed(() => {
  if (!form.value.pricingTemplateId) return null;
  const tmpl = store.pricingTemplates.find(t => t.id === form.value.pricingTemplateId);
  return tmpl?.minPricePerDay ?? null;
});

const formStatusOptions = [
  { title: 'Доступен', value: 'available' },
  { title: 'Зарезервирован', value: 'reserved' },
  { title: 'Забронирован', value: 'booked' },
  { title: 'Недоступен', value: 'unavailable' },
];

/** Проверяет, заблокирован ли автомобиль в выбранном диапазоне дат */
const isBlockedInRange = (vehicleId: number): boolean => {
  if (!dateFrom.value || !dateTo.value) return false;
  const from = new Date(dateFrom.value);
  const to = new Date(dateTo.value);
  return store.blockedPeriods.some(bp => {
    if (bp.vehicleId !== vehicleId) return false;
    const bpStart = new Date(bp.startDate);
    const bpEnd = new Date(bp.endDate);
    return bpStart <= to && bpEnd >= from;
  });
};

/** Эффективный статус авто с учётом блокировок в выбранном диапазоне */
const effectiveStatus = (v: VehicleAdmin): string => {
  if (dateFrom.value && dateTo.value && isBlockedInRange(v.id)) return 'unavailable';
  return v.status;
};

const filteredVehicles = computed(() => {
  let result = store.vehicles;
  if (statusFilter.value !== 'all') {
    result = result.filter(v => effectiveStatus(v) === statusFilter.value);
  }
  if (searchText.value.trim()) {
    const q = searchText.value.toLowerCase();
    result = result.filter(v =>
      `${v.brand} ${v.model}`.toLowerCase().includes(q) ||
      (v.licensePlate && v.licensePlate.toLowerCase().includes(q)) ||
      (v.carClass && v.carClass.toLowerCase().includes(q)) ||
      String(v.id).includes(q)
    );
  }
  return result;
});

const availableCount = computed(() => store.vehicles.filter(v => effectiveStatus(v) === 'available').length);
const bookedCount = computed(() => store.vehicles.filter(v => {
  const s = effectiveStatus(v);
  return s === 'booked' || s === 'reserved';
}).length);
const unavailableCount = computed(() => store.vehicles.filter(v => effectiveStatus(v) === 'unavailable').length);

const clearDateFilter = () => {
  dateFrom.value = '';
  dateTo.value = '';
};

const fetchData = async () => {
  loading.value = true;
  try {
    await Promise.all([store.fetchAllVehicles(), store.fetchLocations(), store.fetchBlockedPeriods(), store.fetchPricingTemplates()]);
  } finally {
    loading.value = false;
  }
};

// --- Blocked Periods ---

const openBlockDialog = (vehicle: VehicleAdmin) => {
  isEditingBlock.value = false;
  selectedVehicle.value = vehicle;
  selectedBlock.value = null;
  blockForm.value = {
    vehicleId: vehicle.id,
    startDate: '',
    endDate: '',
    reason: '',
  };
  blockError.value = '';
  blockDialog.value = true;
};

const openEditBlock = (bp: BlockedPeriod) => {
  isEditingBlock.value = true;
  selectedBlock.value = bp;
  blockForm.value = {
    vehicleId: bp.vehicleId,
    startDate: bp.startDate,
    endDate: bp.endDate,
    reason: bp.reason,
  };
  blockError.value = '';
  blockDialog.value = true;
};

const openDeleteBlock = (bp: BlockedPeriod) => {
  selectedBlock.value = bp;
  deleteBlockDialog.value = true;
};

const saveBlock = async () => {
  blockSaving.value = true;
  blockError.value = '';
  try {
    if (isEditingBlock.value && selectedBlock.value) {
      await store.updateBlockedPeriod(selectedBlock.value.id, blockForm.value);
    } else {
      await store.createBlockedPeriod(blockForm.value);
    }
    blockDialog.value = false;
  } catch (e: any) {
    blockError.value = e.message || 'Ошибка сохранения';
  } finally {
    blockSaving.value = false;
  }
};

const confirmDeleteBlock = async () => {
  if (!selectedBlock.value) return;
  await store.deleteBlockedPeriod(selectedBlock.value.id);
  deleteBlockDialog.value = false;
  selectedBlock.value = null;
};

const vehicleBlockedPeriods = (vehicleId: number): BlockedPeriod[] => {
  return store.blockedPeriods.filter(bp => bp.vehicleId === vehicleId);
};

const openCreate = () => {
  isEditing.value = false;
  selectedVehicle.value = null;
  form.value = emptyForm();
  attributeValues.value = {};
  if (store.locations.length > 0) {
    form.value.locationId = store.locations[0].id;
  }
  formDialog.value = true;
};

const openEdit = (vehicle: VehicleAdmin) => {
  isEditing.value = true;
  selectedVehicle.value = vehicle;
  pendingDeleteImageIds.value = [];
  form.value = {
    brand: vehicle.brand,
    model: vehicle.model,
    licensePlate: vehicle.licensePlate || '',
    pricePerDay: vehicle.pricePerDay,
    minPricePerDay: vehicle.minPricePerDay,
    image: vehicle.image || '',
    carClass: vehicle.carClass || '',
    status: vehicle.status || 'available',
    locationId: vehicle.locationId,
    pricingTemplateId: vehicle.pricingTemplateId,
  };
  store.fetchImages(vehicle.id);
  fetchAttributeValues(vehicle.id);
  formDialog.value = true;
};

const openDelete = (vehicle: VehicleAdmin) => {
  selectedVehicle.value = vehicle;
  deleteDialog.value = true;
};

const saveVehicle = async () => {
  if (isEditing.value && selectedVehicle.value) {
    await Promise.all(
      pendingDeleteImageIds.value.map(id =>
        store.deleteImage(id, selectedVehicle.value!.id)
      )
    );
    pendingDeleteImageIds.value = [];
    await store.updateVehicle(selectedVehicle.value.id, {
      ...form.value,
      attributes: { ...attributeValues.value },
    });
  } else {
    await store.createVehicle({
      ...form.value,
      attributes: { ...attributeValues.value },
    });
  }
  formDialog.value = false;
};

const confirmDelete = async () => {
  if (!selectedVehicle.value) return;
  await store.deleteVehicle(selectedVehicle.value.id);
  deleteDialog.value = false;
  selectedVehicle.value = null;
};

const formatMoney = (v: number) => {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);
};

const onImageUpload = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file || !selectedVehicle.value) return;
  const isFirst = !(store.vehicleImages[selectedVehicle.value.id]?.length);
  await store.uploadImage(selectedVehicle.value.id, file, isFirst);
};

const markImageForDelete = (imageId: number) => {
  pendingDeleteImageIds.value.push(imageId);
};

const isMarkedForDelete = (imageId: number) => {
  return pendingDeleteImageIds.value.includes(imageId);
};

const carouselImages = computed(() => {
  if (!selectedVehicle.value) return [];
  const imgs = store.vehicleImages[selectedVehicle.value.id] || [];
  return imgs
    .filter(img => !isMarkedForDelete(img.id))
    .sort((a, b) => (a.main ? -1 : 1))
    .map(img => BASE_URL + img.url);
});

onMounted(async () => {
  await fetchData();
  await fetchAttributes();
});
</script>

<template>
  <v-container fluid class="vehicles-admin pa-6">
    <!-- Page Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center ga-3">
        <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
          <v-icon size="22">mdi-car-cog</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold">Автомобили</h1>
          <p class="text-body-2 text-medium-emphasis">Управление автопарком</p>
        </div>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" @click="openCreate">
        <v-icon start>mdi-plus</v-icon>
        Добавить авто
      </v-btn>
    </div>

    <!-- Summary Cards -->
    <v-row class="mb-6">
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="primary" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-car-multiple</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Всего</div>
              <div class="text-h5 font-weight-bold">{{ store.vehicles.length }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="success" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-check-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Доступно</div>
              <div class="text-h5 font-weight-bold text-success">{{ availableCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="warning" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-car-key</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">В аренде</div>
              <div class="text-h5 font-weight-bold text-warning">{{ bookedCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="error" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-car-off</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Недоступно</div>
              <div class="text-h5 font-weight-bold text-error">{{ unavailableCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table Card -->
    <v-card elevation="0" rounded="xl" class="table-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="22">mdi-table</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Список автомобилей</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-1">{{ filteredVehicles.length }}</v-chip>
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
            placeholder="Поиск по марке, номеру, классу..."
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
            style="min-width: 180px; max-width: 200px"
          />
          <v-text-field
            v-model="dateFrom"
            type="date"
            variant="solo-filled"
            flat
            density="compact"
            rounded="lg"
            hide-details
            style="min-width: 150px; max-width: 170px"
            label="С"
          />
          <v-text-field
            v-model="dateTo"
            type="date"
            variant="solo-filled"
            flat
            density="compact"
            rounded="lg"
            hide-details
            style="min-width: 150px; max-width: 170px"
            label="По"
          />
          <v-btn
            v-if="dateFrom || dateTo"
            icon
            variant="text"
            size="small"
            color="grey"
            @click="clearDateFilter"
          >
            <v-icon size="18">mdi-close-circle</v-icon>
          </v-btn>
          <v-btn color="primary" variant="tonal" rounded="lg" density="compact" @click="fetchData" :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredVehicles"
        :loading="loading"
        item-value="id"
        hover
        items-per-page="15"
        class="admin-table"
      >
        <!-- Image -->
        <template #item.image="{ item }">
          <v-avatar size="44" rounded="lg" class="vehicle-avatar my-1">
            <v-img v-if="item.image" :src="item.image" cover />
            <v-icon v-else color="grey-lighten-1">mdi-car</v-icon>
          </v-avatar>
        </template>

        <!-- Brand/Model -->
        <template #item.brand="{ item }">
          <div>
            <div class="text-body-2 font-weight-bold">{{ item.brand }} {{ item.model }}</div>
          </div>
        </template>

        <!-- Price -->
        <template #item.pricePerDay="{ item }">
          <div>
            <div class="text-body-2 font-weight-bold">{{ formatMoney(item.pricePerDay) }}</div>
            <div v-if="item.minPricePerDay" class="text-caption text-medium-emphasis">от {{ formatMoney(item.minPricePerDay) }}</div>
          </div>
        </template>

        <!-- Status -->
        <template #item.status="{ item }">
          <div>
            <v-chip
              :color="statusConfig[effectiveStatus(item)]?.color || 'grey'"
              size="small"
              variant="tonal"
              :prepend-icon="statusConfig[effectiveStatus(item)]?.icon"
            >
              {{ statusConfig[effectiveStatus(item)]?.label || item.status }}
            </v-chip>
            <div v-if="dateFrom && dateTo && isBlockedInRange(item.id)" class="mt-1">
              <v-chip size="x-small" color="error" variant="flat" prepend-icon="mdi-lock-clock">
                Заблокирован в периоде
              </v-chip>
            </div>
            <div v-else-if="vehicleBlockedPeriods(item.id).length" class="mt-1">
              <v-chip size="x-small" color="error" variant="flat" prepend-icon="mdi-lock-clock">
                {{ vehicleBlockedPeriods(item.id).length }} блок.
              </v-chip>
            </div>
          </div>
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
            <v-tooltip text="Блокировка дат" location="top">
              <template #activator="{ props }">
                <v-btn v-bind="props" icon variant="text" size="small" color="warning" @click="openBlockDialog(item)">
                  <v-icon size="20">mdi-lock-clock</v-icon>
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

        <!-- Empty -->
        <template #no-data>
          <div class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-car-off</v-icon>
            <div class="text-h6 text-grey mt-3">Автомобилей не найдено</div>
            <div class="text-body-2 text-grey-darken-1 mb-4">Добавьте первый автомобиль в автопарк</div>
            <v-btn color="primary" variant="tonal" rounded="lg" @click="openCreate">
              <v-icon start>mdi-plus</v-icon> Добавить
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="720" scrollable>
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">{{ isEditing ? 'Редактировать автомобиль' : 'Новый автомобиль' }}</div>
              <div class="text-caption text-medium-emphasis">Заполните данные автомобиля</div>
            </div>
          </div>
        </div>
        <v-divider />
        <CarImageCarousel
          v-if="isEditing && selectedVehicle && carouselImages.length"
          :images="carouselImages"
          :height="220"
          :alt="`${form.brand} ${form.model}`"
        />
        <v-card-text class="pa-6">
          <v-row dense>
            <!-- Brand & Model -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.brand"
                label="Марка"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="Mercedes-Benz"
                persistent-placeholder
                :rules="[v => !!v || 'Обязательное поле']"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.model"
                label="Модель"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="S-Class"
                persistent-placeholder
                :rules="[v => !!v || 'Обязательное поле']"
              />
            </v-col>

            <!-- License Plate & Car Class -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="form.licensePlate"
                label="Гос. номер"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="01 KG 001 AAA"
                persistent-placeholder
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-combobox
                v-model="form.carClass"
                :items="carClassOptions"
                label="Класс авто"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Price -->
            <v-col cols="12" sm="6">
              <v-text-field
                v-model.number="form.pricePerDay"
                label="Базовая цена за день ($)"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                type="number"
                :rules="[v => v > 0 || 'Укажите цену']"
                hint="Используется если тарифный шаблон не назначен"
                persistent-hint
              />
            </v-col>

            <!-- Status -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.status"
                :items="formStatusOptions"
                item-title="title"
                item-value="value"
                label="Статус"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Pricing Template -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.pricingTemplateId"
                :items="pricingTemplateOptions"
                item-title="title"
                item-value="value"
                label="Тарифный шаблон"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                clearable
                hint="Динамическая цена в зависимости от длительности аренды"
                persistent-hint
              />
            </v-col>

            <!-- Pricing Tiers Preview -->
            <v-col cols="12" v-if="selectedTemplateTiers.length">
              <v-card elevation="0" rounded="lg" style="border: 1px solid rgba(103,58,183,0.15); background: rgba(103,58,183,0.02)">
                <v-card-text class="pa-4">
                  <div class="d-flex align-center ga-2 mb-3">
                    <v-icon size="18" color="primary">mdi-cash-multiple</v-icon>
                    <span class="text-body-2 font-weight-bold text-uppercase" style="letter-spacing:0.05em; color: rgba(0,0,0,0.5)">
                      Тарифы по длительности аренды
                    </span>
                    <v-spacer />
                    <v-chip size="x-small" color="success" variant="tonal" v-if="selectedTemplateMinPrice">
                      от ${{ selectedTemplateMinPrice }}
                    </v-chip>
                  </div>
                  <v-table density="compact" class="rounded-lg" style="background: transparent">
                    <thead>
                      <tr>
                        <th class="text-left text-caption font-weight-bold">Диапазон</th>
                        <th class="text-right text-caption font-weight-bold">Цена/день</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="tier in selectedTemplateTiers" :key="tier.minDays">
                        <td class="text-body-2">
                          {{ tier.minDays }}–{{ tier.maxDays ? tier.maxDays : '∞' }} дней
                        </td>
                        <td class="text-right text-body-2 font-weight-bold text-primary">
                          ${{ tier.pricePerDay }}
                        </td>
                      </tr>
                    </tbody>
                  </v-table>
                </v-card-text>
              </v-card>
            </v-col>

            <!-- Location -->
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.locationId"
                :items="store.locations"
                item-title="name"
                item-value="id"
                label="Локация"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>

            <!-- Динамические характеристики -->
            <v-col cols="12" v-if="vehicleAttributes.length">
              <v-divider class="my-2" />
              <div class="detail-section__title mb-3">
                <v-icon size="16" color="primary">mdi-tune-variant</v-icon>
                Характеристики
              </div>
              <v-row dense>
                <v-col
                  v-for="attr in vehicleAttributes.filter(a => a.active)"
                  :key="attr.code"
                  cols="12"
                  sm="6"
                >
                  <!-- ENUM → v-select -->
                  <v-select
                    v-if="attr.valueType === 'ENUM'"
                    v-model="attributeValues[attr.code]"
                    :items="attr.possibleValues"
                    :label="attr.name"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    clearable
                    hide-details="auto"
                    class="mb-1"
                  />
                  <!-- BOOLEAN → v-select да/нет -->
                  <v-select
                    v-else-if="attr.valueType === 'BOOLEAN'"
                    v-model="attributeValues[attr.code]"
                    :items="[{ title: 'Да', value: 'true' }, { title: 'Нет', value: 'false' }]"
                    item-title="title"
                    item-value="value"
                    :label="attr.name"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    clearable
                    hide-details="auto"
                    class="mb-1"
                  />
                  <!-- NUMBER → number input -->
                  <v-text-field
                    v-else-if="attr.valueType === 'NUMBER'"
                    v-model="attributeValues[attr.code]"
                    :label="attr.name"
                    type="number"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    hide-details="auto"
                    class="mb-1"
                  />
                  <!-- TEXT → text input -->
                  <v-text-field
                    v-else
                    v-model="attributeValues[attr.code]"
                    :label="attr.name"
                    variant="outlined"
                    rounded="lg"
                    density="comfortable"
                    hide-details="auto"
                    class="mb-1"
                  />
                </v-col>
              </v-row>
            </v-col>

            <!-- Image URL -->
            <v-col cols="12">
              <v-text-field
                v-model="form.image"
                label="URL изображения"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="https://images.unsplash.com/..."
                persistent-placeholder
              />
            </v-col>

            <!-- Image Preview -->
            <v-col cols="12" v-if="form.image">
              <v-card elevation="0" rounded="lg" class="overflow-hidden" style="border: 1px solid rgba(0,0,0,0.06)">
                <v-img :src="form.image" height="200" cover>
                  <template #error>
                    <div class="d-flex align-center justify-center fill-height bg-grey-lighten-3">
                      <v-icon size="48" color="grey-lighten-1">mdi-image-broken</v-icon>
                    </div>
                  </template>
                </v-img>
              </v-card>
            </v-col>

            <!-- Images Section (только при редактировании существующего авто) -->
            <v-col cols="12" v-if="isEditing && selectedVehicle">
              <v-divider class="my-2" />
              <div class="detail-section__title mb-3">
                <v-icon size="16" color="primary">mdi-image-multiple</v-icon>
                Фотографии
              </div>

              <!-- Список загруженных -->
              <div class="d-flex flex-wrap ga-2 mb-3">
                <div
                  v-for="img in store.vehicleImages[selectedVehicle.id] || []"
                  :key="img.id"
                  class="image-thumb"
                  :class="{
      'image-thumb--main': img.main,
      'image-thumb--deleted': isMarkedForDelete(img.id)
    }"
                >
                  <v-img
                    :src="BASE_URL + img.url"
                    width="90"
                    height="70"
                    cover
                    rounded="lg"
                    style="cursor: zoom-in"
                    @click="!isMarkedForDelete(img.id) && openLightbox(BASE_URL + img.url)"
                  />

                  <!-- Оверлей "помечено на удаление" -->
                  <div v-if="isMarkedForDelete(img.id)" class="image-thumb__delete-overlay">
                    <v-icon color="white" size="20">mdi-delete-clock</v-icon>
                    <span class="text-caption text-white" style="font-size: 10px">Удалится</span>
                    <!-- Отменить -->
                    <v-btn
                      icon size="x-small" variant="flat"
                      style="background: rgba(255,255,255,0.2)"
                      @click.stop="pendingDeleteImageIds = pendingDeleteImageIds.filter(id => id !== img.id)"
                    >
                      <v-icon size="12" color="white">mdi-undo</v-icon>
                    </v-btn>
                  </div>

                  <div class="image-thumb__actions" v-if="!isMarkedForDelete(img.id)">
                    <v-btn
                      icon size="x-small" variant="flat" color="warning"
                      :disabled="img.main"
                      @click.stop="store.setMainImage(img.id, selectedVehicle!.id)"
                    >
                      <v-icon size="14">mdi-star</v-icon>
                    </v-btn>
                    <v-btn
                      icon size="x-small" variant="flat" color="error"
                      @click.stop="markImageForDelete(img.id)"
                    >
                      <v-icon size="14">mdi-delete</v-icon>
                    </v-btn>
                  </div>

                  <v-chip v-if="img.main && !isMarkedForDelete(img.id)" size="x-small" color="warning" class="image-thumb__badge">
                    Главное
                  </v-chip>
                </div>
              </div>

              <!-- Загрузка нового -->
              <v-file-input
                label="Добавить фото"
                accept="image/jpeg,image/png,image/webp"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                prepend-icon=""
                prepend-inner-icon="mdi-upload"
                hide-details
                @change="onImageUpload"
              />
            </v-col>
          </v-row>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" @click="saveVehicle">
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <ModalDialog
      v-model:dialog="deleteDialog"
      title="Удалить автомобиль"
      confirm-text="Удалить"
      @confirm="confirmDelete"
      @close="deleteDialog = false"
    >
      <div v-if="selectedVehicle">
        <v-alert type="error" variant="tonal" class="mb-4" density="compact">
          Это действие нельзя отменить. Все связанные данные будут потеряны.
        </v-alert>
        <div class="d-flex align-center ga-3">
          <v-avatar size="48" rounded="lg">
            <v-img v-if="selectedVehicle.image" :src="selectedVehicle.image" cover />
            <v-icon v-else color="grey-lighten-1">mdi-car</v-icon>
          </v-avatar>
          <div>
            <div class="text-body-1 font-weight-bold">
              {{ selectedVehicle.brand }} {{ selectedVehicle.model }}
            </div>
            <div class="text-body-2 text-medium-emphasis">
              {{ selectedVehicle.licensePlate }} · {{ selectedVehicle.carClass }} · {{ formatMoney(selectedVehicle.pricePerDay) }}/день
            </div>
          </div>
        </div>
      </div>
    </ModalDialog>

    <!-- Block Period Dialog (Create / Edit) -->
    <v-dialog v-model="blockDialog" max-width="640" scrollable>
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="warning" variant="tonal" rounded="lg">
              <v-icon size="22">mdi-lock-clock</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ isEditingBlock ? 'Редактировать блокировку' : 'Заблокировать даты' }}
              </div>
              <div class="text-caption text-medium-emphasis" v-if="selectedVehicle && !isEditingBlock">
                {{ selectedVehicle.brand }} {{ selectedVehicle.model }}
              </div>
              <div class="text-caption text-medium-emphasis" v-if="isEditingBlock && selectedBlock">
                {{ selectedBlock.vehicleName }}
              </div>
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <!-- Существующие блокировки для данного авто -->
          <div v-if="!isEditingBlock && selectedVehicle && vehicleBlockedPeriods(selectedVehicle.id).length" class="mb-5">
            <div class="detail-section__title mb-2">
              <v-icon size="16" color="primary">mdi-history</v-icon>
              Текущие блокировки
            </div>
            <v-list density="compact" class="rounded-lg" style="border: 1px solid rgba(0,0,0,0.06)">
              <v-list-item
                v-for="bp in vehicleBlockedPeriods(selectedVehicle.id)"
                :key="bp.id"
                class="px-4"
              >
                <template #prepend>
                  <v-icon size="18" color="error">mdi-lock</v-icon>
                </template>
                <v-list-item-title class="text-body-2">
                  {{ bp.startDate }} → {{ bp.endDate }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption">{{ bp.reason }}</v-list-item-subtitle>
                <template #append>
                  <div class="d-flex ga-1">
                    <v-btn icon variant="text" size="x-small" color="primary" @click="openEditBlock(bp)">
                      <v-icon size="16">mdi-pencil</v-icon>
                    </v-btn>
                    <v-btn icon variant="text" size="x-small" color="error" @click="openDeleteBlock(bp)">
                      <v-icon size="16">mdi-delete</v-icon>
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <div class="detail-section__title mb-2">
            <v-icon size="16" color="primary">mdi-calendar-lock</v-icon>
            {{ isEditingBlock ? 'Изменить период' : 'Новый период блокировки' }}
          </div>
          <v-row dense>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="blockForm.startDate"
                label="Дата начала"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="blockForm.endDate"
                label="Дата окончания"
                type="date"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-combobox
                v-model="blockForm.reason"
                :items="reasonOptions"
                label="Причина блокировки"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="Выберите или введите свою"
              />
            </v-col>
          </v-row>
          <v-alert v-if="blockError" type="error" variant="tonal" density="compact" class="mt-2">
            {{ blockError }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="blockDialog = false">Отмена</v-btn>
          <v-btn color="warning" variant="flat" rounded="lg" :loading="blockSaving" @click="saveBlock">
            {{ isEditingBlock ? 'Сохранить' : 'Заблокировать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Block Confirmation -->
    <ModalDialog
      v-model:dialog="deleteBlockDialog"
      title="Удалить блокировку"
      confirm-text="Удалить"
      @confirm="confirmDeleteBlock"
      @close="deleteBlockDialog = false"
    >
      <div v-if="selectedBlock">
        <div class="text-body-1">
          Удалить блокировку для <strong>{{ selectedBlock.vehicleName }}</strong>?
        </div>
        <div class="text-body-2 text-medium-emphasis mt-2">
          {{ selectedBlock.startDate }} → {{ selectedBlock.endDate }} · {{ selectedBlock.reason }}
        </div>
      </div>
    </ModalDialog>
  </v-container>
</template>

<style scoped>
.vehicles-admin {
  background: #f8f7fc;
  min-height: 100vh;
  max-width: 1400px;
  margin: 0 auto;
}

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

.table-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.vehicle-avatar {
  border: 2px solid rgba(103, 58, 183, 0.15);
}

.admin-table :deep(th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: rgba(0, 0, 0, 0.5) !important;
}

.dialog-header {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(40, 53, 147, 0.05));
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
}

.image-thumb {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition: border-color 0.2s;
}
.image-thumb--main {
  border-color: #FB8C00;
}
.image-thumb__actions {
  position: absolute;
  top: 2px;
  right: 2px;
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
}
.image-thumb:hover .image-thumb__actions {
  opacity: 1;
}
.image-thumb__badge {
  position: absolute;
  bottom: 3px;
  left: 3px;
}
</style>

