<template>
  <div class="vehicles-page">
    <!-- Hero Header -->
    <div class="vehicles-hero mb-6">
      <v-container>
        <div class="d-flex align-center ga-3 mb-2">
          <v-icon color="primary" size="36">mdi-car-sports</v-icon>
          <h1 class="text-h4 font-weight-bold">LuxeDrive</h1>
        </div>
        <p class="text-body-1 text-medium-emphasis">
          Premium car rental — explore our exclusive fleet
        </p>
      </v-container>
    </div>

    <v-container fluid class="px-6">
      <!-- Search Bar -->
      <SearchBar />

      <v-row>
        <!-- Filters Sidebar -->
        <v-col cols="12" md="3" lg="2">
          <FilterPanel />
        </v-col>

        <!-- Vehicle Grid -->
        <v-col cols="12" md="9" lg="10">
          <!-- Loading State -->
          <div v-if="vehicleStore.loading" class="d-flex justify-center pa-12">
            <v-progress-circular indeterminate color="primary" size="48" />
          </div>

          <!-- Error State -->
          <v-alert
            v-else-if="vehicleStore.error"
            type="error"
            variant="tonal"
            rounded="xl"
            class="mb-6"
          >
            {{ vehicleStore.error }}
          </v-alert>

          <!-- Empty State -->
          <v-card
            v-else-if="vehicleStore.vehicles.length === 0"
            elevation="0"
            rounded="xl"
            class="pa-12 text-center"
          >
            <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-car-off</v-icon>
            <h3 class="text-h6 font-weight-bold mb-2">No vehicles found</h3>
            <p class="text-body-2 text-medium-emphasis mb-4">
              Try adjusting your filters or search criteria
            </p>
            <v-btn color="primary" variant="tonal" rounded="lg" @click="vehicleStore.resetFilters()">
              Reset Filters
            </v-btn>
          </v-card>

          <!-- Vehicle Grid -->
          <template v-else>
            <!-- Results Counter -->
            <div class="d-flex align-center justify-space-between mb-4">
              <span class="text-body-2 text-medium-emphasis">
                Displaying <strong>{{ vehicleStore.vehicles.length }}</strong>
                of <strong>{{ vehicleStore.totalCount }}</strong> vehicles
              </span>
            </div>

            <v-row>
              <v-col
                v-for="vehicle in vehicleStore.vehicles"
                :key="vehicle.id"
                cols="12"
                sm="6"
                lg="4"
                xl="3"
              >
                <VehicleCard :vehicle="vehicle" />
              </v-col>
            </v-row>

            <!-- Load More -->
            <div v-if="vehicleStore.page < vehicleStore.totalPages - 1" class="text-center mt-8">
              <v-btn
                color="primary"
                variant="outlined"
                rounded="lg"
                size="large"
                @click="vehicleStore.nextPage()"
              >
                <v-icon start>mdi-plus</v-icon>
                Load More Results
              </v-btn>
            </div>
          </template>
        </v-col>
      </v-row>
    </v-container>

    <!-- Footer -->
    <LuxeFooter />
  </div>
</template>

<script setup lang="ts">
import { useVehicleStore } from '@/stores/vehicles';
import SearchBar from '@/components/luxedrive/SearchBar.vue';
import FilterPanel from '@/components/luxedrive/FilterPanel.vue';
import VehicleCard from '@/components/luxedrive/VehicleCard.vue';
import LuxeFooter from '@/components/luxedrive/LuxeFooter.vue';

const vehicleStore = useVehicleStore();
</script>

<style scoped>
.vehicles-page {
  background: #f8f7fc;
  min-height: 100vh;
}

.vehicles-hero {
  background: linear-gradient(135deg, #311b92 0%, #4527a0 50%, #283593 100%);
  padding: 32px 0 28px;
  color: white;
}

.vehicles-hero p {
  color: rgba(255, 255, 255, 0.7) !important;
}
</style>
