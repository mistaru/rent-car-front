<template>
  <v-card class="filter-panel" elevation="1" rounded="xl">
    <v-card-title class="text-subtitle-1 font-weight-bold pa-4 pb-2">
      <v-icon start color="primary">mdi-filter-variant</v-icon>
      Filters
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-4">
      <!-- Car Class (static - from vehicle data) -->
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

      <!-- Dynamic Attribute Filters -->
      <div v-for="df in vehicleStore.dynamicFilters" :key="df.code" class="mb-5">
        <div class="text-caption text-medium-emphasis mb-2 font-weight-bold text-uppercase">
          {{ df.name }}
        </div>

        <!-- BOOLEAN → checkbox / switch -->
        <v-switch
          v-if="df.filterType === 'checkbox'"
          v-model="vehicleStore.filters[df.code]"
          :label="vehicleStore.filters[df.code] === 'true' ? 'Да' : 'Все'"
          true-value="true"
          false-value=""
          color="primary"
          hide-details
          density="comfortable"
        />

        <!-- radio (2 values) -->
        <v-radio-group
          v-else-if="df.filterType === 'radio'"
          v-model="vehicleStore.filters[df.code]"
          hide-details
          density="comfortable"
        >
          <v-radio label="All" value="" color="primary" />
          <v-radio
            v-for="val in df.usedValues"
            :key="val"
            :label="val"
            :value="val"
            color="primary"
          />
        </v-radio-group>

        <!-- select (>2 values) -->
        <v-select
          v-else
          v-model="vehicleStore.filters[df.code]"
          :items="df.usedValues"
          label="All"
          variant="outlined"
          density="comfortable"
          rounded="lg"
          clearable
          hide-details
        />
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
import { onMounted } from 'vue';
import { useVehicleStore } from '@/stores/vehicles';

const vehicleStore = useVehicleStore();

onMounted(() => {
  vehicleStore.fetchDynamicFilters();
});
</script>

<style scoped>
.filter-panel {
  position: sticky;
  top: 100px;
  max-height: calc(100vh - 110px);
  overflow-y: auto;
  border: 1px solid rgba(103, 58, 183, 0.08);
}
</style>
