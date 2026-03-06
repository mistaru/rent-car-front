<template>
  <v-card
    class="vehicle-card h-100 d-flex flex-column"
    :class="{
      'vehicle-card--booked': vehicle.status === 'booked',
      'vehicle-card--unavailable': vehicle.status === 'unavailable',
    }"
    elevation="0"
    rounded="xl"
    hover
    @click="handleClick"
  >
    <!-- Image -->
    <div class="vehicle-card__image-wrapper">
      <v-img
        :src="vehicle.image"
        :alt="`${vehicle.brand} ${vehicle.model}`"
        height="200"
        cover
        class="vehicle-card__image"
      >
        <template #placeholder>
          <v-row align="center" justify="center" class="fill-height">
            <v-progress-circular indeterminate color="primary" />
          </v-row>
        </template>
      </v-img>


      <!-- Status Badge -->
      <v-chip
        v-if="vehicle.status !== 'available'"
        class="vehicle-card__status-badge"
        :color="vehicle.status === 'booked' ? 'warning' : 'error'"
        size="small"
        label
      >
        {{ vehicle.status === 'booked' ? 'Booked' : 'Unavailable' }}
      </v-chip>
    </div>

    <!-- Content -->
    <v-card-text class="pa-4 flex-grow-1 d-flex flex-column">
      <h3 class="text-h6 font-weight-bold mb-1">
        {{ vehicle.brand }} {{ vehicle.model }}
      </h3>

      <div class="d-flex flex-wrap ga-2 mb-3">
        <v-chip size="x-small" variant="tonal" color="grey-darken-1" prepend-icon="mdi-car">
          {{ vehicle.bodyType }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" color="grey-darken-1" prepend-icon="mdi-steering">
          {{ vehicle.drivetrain }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" color="grey-darken-1" prepend-icon="mdi-gas-station">
          {{ vehicle.fuelType }}
        </v-chip>
        <v-chip size="x-small" variant="tonal" color="grey-darken-1" prepend-icon="mdi-cog">
          {{ vehicle.transmission }}
        </v-chip>
      </div>

      <v-spacer />

      <div class="d-flex align-center justify-space-between mt-auto">
        <div>
          <span class="text-caption text-medium-emphasis">
            {{ vehicle.minPricePerDay ? 'Starting from' : 'Per day' }}
          </span>
          <div class="text-h6 font-weight-bold text-primary">
            ${{ vehicle.minPricePerDay || vehicle.pricePerDay }}<span class="text-caption font-weight-regular">/day</span>
          </div>
        </div>
        <v-btn
          color="primary"
          variant="tonal"
          rounded="lg"
          size="small"
          :disabled="vehicle.status !== 'available'"
          @click.stop="handleClick"
        >
          View Details
          <v-icon end>mdi-arrow-right</v-icon>
        </v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import type { Vehicle } from '@/stores/vehicles';
import { useVehicleStore } from '@/stores/vehicles';
import { useBookingStore } from '@/stores/booking';

const props = defineProps<{
  vehicle: Vehicle;
}>();

const router = useRouter();
const vehicleStore = useVehicleStore();
const bookingStore = useBookingStore();

function handleClick() {
  if (props.vehicle.status !== 'available') return;
  bookingStore.setVehicle(props.vehicle);
  bookingStore.setBookingFromSearch({
    pickupLocation: vehicleStore.searchParams.pickupLocation,
    pickupDate: vehicleStore.searchParams.pickupDate,
    pickupTime: vehicleStore.searchParams.pickupTime,
  });
  router.push({ name: 'Checkout', params: { id: props.vehicle.id } });
}
</script>

<style scoped>
.vehicle-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  overflow: hidden;
}

.vehicle-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 40px rgba(103, 58, 183, 0.15) !important;
  border-color: rgba(103, 58, 183, 0.2);
}

.vehicle-card--booked,
.vehicle-card--unavailable {
  opacity: 0.7;
  cursor: not-allowed;
}

.vehicle-card--booked:hover,
.vehicle-card--unavailable:hover {
  transform: none;
  box-shadow: none !important;
}

.vehicle-card__image-wrapper {
  position: relative;
  overflow: hidden;
}

.vehicle-card__image {
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.vehicle-card:hover .vehicle-card__image {
  transform: scale(1.05);
}

.vehicle-card--booked:hover .vehicle-card__image,
.vehicle-card--unavailable:hover .vehicle-card__image {
  transform: none;
}


.vehicle-card__status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
}
</style>
