<template>
  <v-card class="search-bar-card mb-6" elevation="2" rounded="xl">
    <v-card-text>
      <v-row align="center" dense>
        <v-col cols="12" sm="6" md="3">
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
import { onMounted } from 'vue';
import { useVehicleStore } from '@/stores/vehicles';

const vehicleStore = useVehicleStore();

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
