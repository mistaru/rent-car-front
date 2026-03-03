<template>
  <v-card class="search-bar-card mb-6" elevation="2" rounded="xl">
    <v-card-text>
      <v-row align="center" dense>
        <v-col cols="12" sm="6" md="3">
          <v-text-field
            v-model="vehicleStore.searchParams.pickupLocation"
            label="Pick-up Location"
            prepend-inner-icon="mdi-map-marker"
            variant="outlined"
            density="comfortable"
            rounded="lg"
            hide-details
            placeholder="City or Airport"
          />
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
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-btn
            block
            color="primary"
            size="large"
            rounded="lg"
            elevation="0"
            @click="vehicleStore.updateSearch()"
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
import { useVehicleStore } from '@/stores/vehicles';

const vehicleStore = useVehicleStore();
</script>

<style scoped>
.search-bar-card {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.03), rgba(63, 81, 181, 0.05));
  border: 1px solid rgba(103, 58, 183, 0.08);
}
</style>
