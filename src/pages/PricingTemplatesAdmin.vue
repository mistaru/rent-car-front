<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useVehiclesAdminStore } from '@/stores/vehicles-admin';
import type { PricingTemplate } from '@/stores/vehicles-admin';

const store = useVehiclesAdminStore();

const loading = ref(false);
const formDialog = ref(false);
const deleteDialog = ref(false);
const isEditing = ref(false);
const selectedTemplate = ref<PricingTemplate | null>(null);
const searchText = ref('');
const saving = ref(false);
const formError = ref('');

interface TemplateForm {
  name: string;
  description: string;
  currency: string;
  tiers: Array<{ minDays: number; maxDays: number | null; pricePerDay: number; unlimited: boolean }>;
}

const emptyForm = (): TemplateForm => ({
  name: '',
  description: '',
  currency: 'USD',
  tiers: [{ minDays: 1, maxDays: 3, pricePerDay: 0, unlimited: false }],
});

const form = ref<TemplateForm>(emptyForm());

const headers = [
  { title: 'ID', key: 'id', width: '60px' },
  { title: 'Название', key: 'name' },
  { title: 'Описание', key: 'description' },
  { title: 'Уровни', key: 'tiers', sortable: false },
  { title: 'Мин. цена', key: 'minPricePerDay', align: 'end' as const },
  { title: 'Статус', key: 'active', align: 'center' as const },
  { title: '', key: 'actions', sortable: false, width: '160px', align: 'center' as const },
];

const filteredTemplates = computed(() => {
  if (!searchText.value.trim()) return store.pricingTemplates;
  const q = searchText.value.toLowerCase();
  return store.pricingTemplates.filter(t =>
    t.name.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
  );
});

const activeCount = computed(() => store.pricingTemplates.filter(t => t.active).length);

const fetchData = async () => {
  loading.value = true;
  try {
    await store.fetchPricingTemplates();
  } finally {
    loading.value = false;
  }
};

const openCreate = () => {
  isEditing.value = false;
  selectedTemplate.value = null;
  form.value = emptyForm();
  formError.value = '';
  formDialog.value = true;
};

const openEdit = (tmpl: PricingTemplate) => {
  isEditing.value = true;
  selectedTemplate.value = tmpl;
  formError.value = '';
  form.value = {
    name: tmpl.name,
    description: tmpl.description || '',
    currency: tmpl.currency || 'USD',
    tiers: tmpl.tiers.length
      ? tmpl.tiers.map(t => ({
          minDays: t.minDays,
          maxDays: t.maxDays,
          pricePerDay: t.pricePerDay,
          unlimited: t.maxDays === null,
        }))
      : [{ minDays: 1, maxDays: 3, pricePerDay: 0, unlimited: false }],
  };
  formDialog.value = true;
};

const openDelete = (tmpl: PricingTemplate) => {
  selectedTemplate.value = tmpl;
  deleteDialog.value = true;
};

const addTier = () => {
  const tiers = form.value.tiers;
  const last = tiers[tiers.length - 1];
  const nextMin = last ? (last.unlimited ? (last.minDays + 1) : ((last.maxDays ?? last.minDays) + 1)) : 1;
  tiers.push({ minDays: nextMin, maxDays: nextMin + 6, pricePerDay: 0, unlimited: false });
};

const removeTier = (index: number) => {
  form.value.tiers.splice(index, 1);
};

const onUnlimitedChange = (index: number) => {
  if (form.value.tiers[index].unlimited) {
    form.value.tiers[index].maxDays = null;
  } else {
    form.value.tiers[index].maxDays = form.value.tiers[index].minDays + 6;
  }
};

/** Валидация тарифных диапазонов */
const validateTiers = (): string | null => {
  const tiers = form.value.tiers;
  if (!tiers.length) return 'Добавьте хотя бы один тарифный уровень';

  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    if (t.minDays <= 0) return `Уровень ${i + 1}: минимум дней должен быть > 0`;
    if (t.pricePerDay <= 0) return `Уровень ${i + 1}: укажите цену за день`;
    if (!t.unlimited && t.maxDays !== null && t.maxDays < t.minDays)
      return `Уровень ${i + 1}: макс. дней не может быть меньше мин.`;
  }

  // Проверка на пересечения и разрывы
  const sorted = [...tiers].sort((a, b) => a.minDays - b.minDays);
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.unlimited) return 'Уровень "без ограничения" должен быть последним';
    const prevMax = prev.maxDays ?? Infinity;
    if (curr.minDays <= prevMax) return `Диапазоны пересекаются: уровни ${i} и ${i + 1}`;
    if (curr.minDays > prevMax + 1) return `Разрыв между уровнями ${i} и ${i + 1} (${prevMax + 1}–${curr.minDays - 1} дней не покрыты)`;
  }

  return null;
};

const saveTemplate = async () => {
  const error = validateTiers();
  if (error) {
    formError.value = error;
    return;
  }
  if (!form.value.name.trim()) {
    formError.value = 'Укажите название шаблона';
    return;
  }

  saving.value = true;
  formError.value = '';
  try {
    const payload = {
      name: form.value.name.trim(),
      description: form.value.description.trim(),
      currency: form.value.currency,
      tiers: form.value.tiers.map(t => ({
        minDays: t.minDays,
        maxDays: t.unlimited ? null : t.maxDays,
        pricePerDay: t.pricePerDay,
      })),
    };
    if (isEditing.value && selectedTemplate.value) {
      await store.updatePricingTemplate(selectedTemplate.value.id, payload);
    } else {
      await store.createPricingTemplate(payload);
    }
    formDialog.value = false;
  } catch (e: any) {
    formError.value = e.message || 'Ошибка сохранения';
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  if (!selectedTemplate.value) return;
  try {
    await store.deletePricingTemplate(selectedTemplate.value.id);
    deleteDialog.value = false;
    selectedTemplate.value = null;
  } catch (e: any) {
    formError.value = e.message || 'Невозможно удалить (шаблон привязан к автомобилям)';
  }
};

const toggleActive = async (tmpl: PricingTemplate) => {
  await store.togglePricingTemplateActive(tmpl.id);
};

const formatMoney = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

onMounted(fetchData);
</script>

<template>
  <v-container fluid class="pricing-admin pa-6">
    <!-- Header -->
    <div class="d-flex align-center justify-space-between mb-6">
      <div class="d-flex align-center ga-3">
        <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
          <v-icon size="22">mdi-cash-multiple</v-icon>
        </v-avatar>
        <div>
          <h1 class="text-h4 font-weight-bold">Тарифные шаблоны</h1>
          <p class="text-body-2 text-medium-emphasis">Динамическое ценообразование по длительности аренды</p>
        </div>
      </div>
      <v-btn color="primary" variant="flat" rounded="lg" size="large" @click="openCreate">
        <v-icon start>mdi-plus</v-icon>
        Новый шаблон
      </v-btn>
    </div>

    <!-- Summary -->
    <v-row class="mb-6">
      <v-col cols="12" sm="4">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="primary" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-format-list-numbered</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Всего шаблонов</div>
              <div class="text-h5 font-weight-bold">{{ store.pricingTemplates.length }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="success" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-check-circle</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Активных</div>
              <div class="text-h5 font-weight-bold text-success">{{ activeCount }}</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="stat-card" rounded="xl" elevation="0">
          <v-card-text class="d-flex align-center ga-4 pa-5">
            <v-avatar size="48" color="info" variant="tonal" rounded="lg">
              <v-icon size="24">mdi-information-outline</v-icon>
            </v-avatar>
            <div>
              <div class="text-caption text-medium-emphasis text-uppercase font-weight-medium ls-wide">Подсказка</div>
              <div class="text-body-2">Привяжите шаблон к авто в форме редактирования</div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Table -->
    <v-card elevation="0" rounded="xl" class="table-card">
      <div class="d-flex align-center justify-space-between flex-wrap ga-3 pa-5 pb-3">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="22">mdi-table</v-icon>
          <span class="text-subtitle-1 font-weight-bold">Список шаблонов</span>
          <v-chip size="small" color="primary" variant="tonal" class="ml-1">{{ filteredTemplates.length }}</v-chip>
        </div>
        <div class="d-flex ga-3 align-center">
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
            placeholder="Поиск..."
          />
          <v-btn color="primary" variant="tonal" rounded="lg" density="compact" @click="fetchData" :loading="loading">
            <v-icon>mdi-refresh</v-icon>
          </v-btn>
        </div>
      </div>

      <v-data-table
        :headers="headers"
        :items="filteredTemplates"
        :loading="loading"
        item-value="id"
        hover
        items-per-page="15"
        class="admin-table"
      >
        <!-- Tiers -->
        <template #item.tiers="{ item }">
          <div class="d-flex flex-wrap ga-1 py-1">
            <v-chip
              v-for="tier in item.tiers"
              :key="tier.minDays"
              size="small"
              variant="tonal"
              color="primary"
            >
              {{ tier.minDays }}–{{ tier.maxDays ?? '∞' }}д: ${{ tier.pricePerDay }}
            </v-chip>
          </div>
        </template>

        <!-- Min Price -->
        <template #item.minPricePerDay="{ item }">
          <span class="font-weight-bold" v-if="item.minPricePerDay">
            от {{ formatMoney(item.minPricePerDay) }}
          </span>
          <span v-else class="text-medium-emphasis">—</span>
        </template>

        <!-- Status -->
        <template #item.active="{ item }">
          <v-chip
            :color="item.active ? 'success' : 'grey'"
            size="small"
            variant="tonal"
            @click="toggleActive(item)"
            style="cursor: pointer"
          >
            {{ item.active ? 'Активен' : 'Неактивен' }}
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

        <!-- Empty -->
        <template #no-data>
          <div class="text-center py-10">
            <v-icon size="64" color="grey-lighten-1">mdi-cash-multiple</v-icon>
            <div class="text-h6 text-grey mt-3">Шаблонов нет</div>
            <div class="text-body-2 text-grey-darken-1 mb-4">Создайте первый тарифный шаблон</div>
            <v-btn color="primary" variant="tonal" rounded="lg" @click="openCreate">
              <v-icon start>mdi-plus</v-icon> Создать
            </v-btn>
          </div>
        </template>
      </v-data-table>
    </v-card>

    <!-- Create / Edit Dialog -->
    <v-dialog v-model="formDialog" max-width="780" scrollable>
      <v-card rounded="xl">
        <div class="dialog-header pa-6 pb-4">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="primary" variant="tonal" rounded="lg">
              <v-icon size="22">{{ isEditing ? 'mdi-pencil' : 'mdi-plus' }}</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold">
                {{ isEditing ? 'Редактировать шаблон' : 'Новый тарифный шаблон' }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Настройте тарифные уровни по количеству дней аренды
              </div>
            </div>
          </div>
        </div>
        <v-divider />
        <v-card-text class="pa-6">
          <v-row dense>
            <v-col cols="12" sm="8">
              <v-text-field
                v-model="form.name"
                label="Название шаблона"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                placeholder="Стандартный / Премиум / Эконом"
                persistent-placeholder
                :rules="[v => !!v || 'Обязательное поле']"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-select
                v-model="form.currency"
                :items="['USD', 'EUR', 'KGS']"
                label="Валюта"
                variant="outlined"
                rounded="lg"
                density="comfortable"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                label="Описание"
                variant="outlined"
                rounded="lg"
                density="comfortable"
                rows="2"
                auto-grow
                placeholder="Описание тарифного плана..."
                persistent-placeholder
              />
            </v-col>
          </v-row>

          <!-- Tiers Section -->
          <div class="d-flex align-center ga-2 mt-4 mb-3">
            <v-icon size="18" color="primary">mdi-layers-outline</v-icon>
            <span class="detail-section__title" style="margin: 0">Тарифные уровни</span>
            <v-spacer />
            <v-btn size="small" variant="tonal" color="primary" rounded="lg" @click="addTier">
              <v-icon start size="16">mdi-plus</v-icon>
              Добавить уровень
            </v-btn>
          </div>

          <v-card
            v-for="(tier, index) in form.tiers"
            :key="index"
            elevation="0"
            rounded="lg"
            class="mb-3 tier-card"
          >
            <v-card-text class="pa-4">
              <div class="d-flex align-center ga-2 mb-3">
                <v-chip size="small" color="primary" variant="flat">{{ index + 1 }}</v-chip>
                <span class="text-body-2 font-weight-bold">
                  {{ tier.minDays }}–{{ tier.unlimited ? '∞' : tier.maxDays }} дней
                </span>
                <v-spacer />
                <v-btn
                  v-if="form.tiers.length > 1"
                  icon size="x-small" variant="text" color="error"
                  @click="removeTier(index)"
                >
                  <v-icon size="18">mdi-close</v-icon>
                </v-btn>
              </div>
              <v-row dense>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model.number="tier.minDays"
                    label="Мин. дней"
                    type="number"
                    variant="outlined"
                    rounded="lg"
                    density="compact"
                    :min="1"
                    :rules="[v => v > 0 || '> 0']"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model.number="tier.maxDays"
                    label="Макс. дней"
                    type="number"
                    variant="outlined"
                    rounded="lg"
                    density="compact"
                    :disabled="tier.unlimited"
                    :min="tier.minDays"
                  />
                </v-col>
                <v-col cols="12" sm="3">
                  <v-text-field
                    v-model.number="tier.pricePerDay"
                    label="Цена/день ($)"
                    type="number"
                    variant="outlined"
                    rounded="lg"
                    density="compact"
                    :rules="[v => v > 0 || 'Укажите цену']"
                  />
                </v-col>
                <v-col cols="12" sm="3" class="d-flex align-center">
                  <v-checkbox
                    v-model="tier.unlimited"
                    label="Без ограничения"
                    density="compact"
                    hide-details
                    @update:model-value="onUnlimitedChange(index)"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Validation hint -->
          <v-alert
            v-if="form.tiers.length > 1"
            type="info"
            variant="tonal"
            density="compact"
            class="mt-2"
            icon="mdi-information-outline"
          >
            Диапазоны не должны пересекаться и между ними не должно быть разрывов.
            Последний уровень можно пометить «без ограничения» (∞).
          </v-alert>

          <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-divider />
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="formDialog = false">Отмена</v-btn>
          <v-btn color="primary" variant="flat" rounded="lg" :loading="saving" @click="saveTemplate">
            {{ isEditing ? 'Сохранить' : 'Создать' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete Dialog -->
    <v-dialog v-model="deleteDialog" max-width="480">
      <v-card rounded="xl">
        <v-card-title class="pa-6 pb-3">
          <div class="d-flex align-center ga-3">
            <v-avatar size="40" color="error" variant="tonal" rounded="lg">
              <v-icon size="22">mdi-delete-outline</v-icon>
            </v-avatar>
            <span class="text-h6 font-weight-bold">Удалить шаблон</span>
          </div>
        </v-card-title>
        <v-card-text class="px-6" v-if="selectedTemplate">
          <v-alert type="error" variant="tonal" class="mb-4" density="compact">
            Это действие нельзя отменить. Шаблон можно удалить только если он не привязан к автомобилям.
          </v-alert>
          <div class="text-body-1">
            Удалить шаблон <strong>{{ selectedTemplate.name }}</strong>?
          </div>
          <div class="text-body-2 text-medium-emphasis mt-1">
            {{ selectedTemplate.tiers.length }} тарифных уровней
          </div>
          <v-alert v-if="formError" type="error" variant="tonal" density="compact" class="mt-3">
            {{ formError }}
          </v-alert>
        </v-card-text>
        <v-card-actions class="pa-5">
          <v-spacer />
          <v-btn variant="tonal" rounded="lg" @click="deleteDialog = false">Отмена</v-btn>
          <v-btn color="error" variant="flat" rounded="lg" @click="confirmDelete">Удалить</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<style scoped>
.pricing-admin {
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

.ls-wide { letter-spacing: 0.08em; }

.table-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
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

.tier-card {
  border: 1px solid rgba(103, 58, 183, 0.12);
  background: rgba(103, 58, 183, 0.02);
}
</style>

