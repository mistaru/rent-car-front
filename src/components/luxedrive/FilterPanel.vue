<template>
  <v-card class="filter-panel" elevation="1" rounded="xl">
    <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
      <v-icon start color="primary">mdi-filter-variant</v-icon>
      Filters
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- Car Class -->
      <div class="mb-5">
        <div class="text-caption text-medium-emphasis mb-2 font-weight-bold text-uppercase">
          Car Class
        </div>
        <v-select
          v-model="vehicleStore.filters.carClass"
          :items="vehicleStore.carClasses"
          label="All Classes"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          clearable
          hide-details
        />
      </div>

      <!-- Drivetrain -->
      <div class="mb-5">
        <div class="text-caption text-medium-emphasis mb-2 font-weight-bold text-uppercase">
          Drivetrain
        </div>
        <v-radio-group v-model="vehicleStore.filters.drivetrain" hide-details density="comfortable">
          <v-radio label="All Systems" value="all" color="primary" />
          <v-radio label="2WD" value="2WD" color="primary" />
          <v-radio label="4WD / AWD" value="4WD" color="primary" />
        </v-radio-group>
      </div>

      <!-- Fuel Type -->
      <div class="mb-5">
        <div class="text-caption text-medium-emphasis mb-2 font-weight-bold text-uppercase">
          Fuel Type
        </div>
        <v-radio-group v-model="vehicleStore.filters.fuelType" hide-details density="comfortable">
          <v-radio label="All Types" value="all" color="primary" />
          <v-radio label="Gasoline" value="Gasoline" color="primary" />
          <v-radio label="Diesel" value="Diesel" color="primary" />
          <v-radio label="Electric" value="Electric" color="primary" />
          <v-radio label="Hybrid" value="Hybrid" color="primary" />
        </v-radio-group>
      </div>

      <!-- Manufacture Year -->
      <div class="mb-4">
        <div class="text-caption text-medium-emphasis mb-2 font-weight-bold text-uppercase">
          Manufacture Year
        </div>
        <v-row dense>
          <v-col cols="6">
            <v-text-field
              v-model.number="vehicleStore.filters.yearFrom"
              label="From"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              type="number"
              hide-details
              placeholder="2020"
              persistent-placeholder
            />
          </v-col>
          <v-col cols="6">
            <v-text-field
              v-model.number="vehicleStore.filters.yearTo"
              label="To"
              variant="outlined"
              density="comfortable"
              rounded="lg"
              type="number"
              hide-details
              placeholder="2024"
              persistent-placeholder
            />
          </v-col>
        </v-row>
      </div>
    </v-card-text>

    <v-divider />

    <v-card-actions class="pa-4 d-flex flex-column ga-2">
      <v-btn
        block
        color="primary"
        variant="elevated"
        rounded="lg"
        elevation="0"
        @click="vehicleStore.applyFilters()"
      >
        <v-icon start>mdi-check</v-icon>
        Apply Filters
      </v-btn>
      <v-btn
        block
        variant="outlined"
        rounded="lg"
        color="grey"
        @click="vehicleStore.resetFilters()"
      >
        <v-icon start>mdi-refresh</v-icon>
        Reset All
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useVehicleStore } from '@/stores/vehicles';

const vehicleStore = useVehicleStore();
</script>

<style scoped>
.filter-panel {
  position: sticky;
  top: 80px;
  border: 1px solid rgba(103, 58, 183, 0.08);
}
</style>
