<template>
  <v-card class="search-bar-card" elevation="2" rounded="xl">
    <v-card-text>
      <v-row align="center" dense>
        <v-col cols="12" sm="6" md="3">
          <v-autocomplete
            v-model="selectedVehicleId"
            :items="vehicleStore.vehicles"
            :item-title="vehicleLabel"
            item-value="id"
            label="Vehicle"
            prepend-inner-icon="mdi-car"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            placeholder="Search vehicle..."
            persistent-placeholder
            no-data-text="No vehicles found"
            clearable
            @update:model-value="onVehicleSelected"
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #subtitle>{{ item.raw.carClass }} · {{ item.raw.fuelType }} · from ${{ item.raw.minPricePerDay || item.raw.pricePerDay }}/day</template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="6" md="2">
          <v-autocomplete
            v-model="vehicleStore.searchParams.pickupLocation"
            :items="vehicleStore.locations"
            item-title="name"
            item-value="id"
            label="Pick-up Location"
            prepend-inner-icon="mdi-map-marker"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            placeholder="Search location..."
            persistent-placeholder
            no-data-text="No locations found"
            clearable
          >
            <template #item="{ item, props }">
              <v-list-item v-bind="props">
                <template #subtitle>{{ item.raw.city }}, {{ item.raw.country }}</template>
              </v-list-item>
            </template>
          </v-autocomplete>
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="vehicleStore.searchParams.pickupDate"
            label="Pick-up Date & Time"
            prepend-inner-icon="mdi-calendar"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            type="datetime-local"
            hide-details
            persistent-placeholder
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="vehicleStore.searchParams.dropoffDate"
            label="Drop-off Date & Time"
            prepend-inner-icon="mdi-calendar-check"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            type="datetime-local"
            hide-details
            persistent-placeholder
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-btn
            block
            color="primary"
            size="large"
            rounded="lg"
            elevation="0"
            @click="vehicleStore.updateSearch({})"
          >
            <v-icon start>mdi-magnify</v-icon>
            Update Search
          </v-btn>
        </v-col>
      </v-row>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useVehicleStore } from '@/stores/vehicles';
import type { Vehicle } from '@/stores/vehicles';

const vehicleStore = useVehicleStore();
const router = useRouter();

const selectedVehicleId = ref<number | null>(null);

function vehicleLabel(item: Vehicle) {
  return `${item.brand} ${item.model}`;
}

function onVehicleSelected(id: number | null) {
  if (id) {
    router.push({ name: 'Checkout', params: { id } });
  }
}

onMounted(() => {
  if (vehicleStore.locations.length === 0) {
    vehicleStore.fetchLocations();
  }
});
</script>

<style scoped>
.search-bar-card {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(63, 81, 181, 0.05));
  border: 1px solid rgba(103, 58, 183, 0.08);
}
</style>
