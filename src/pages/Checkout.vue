<template>
  <div class="checkout-page">
    <!-- Header -->
    <div class="checkout-hero mb-6">
      <v-container>
        <div class="d-flex align-center ga-3 mb-2">
          <v-btn icon="mdi-arrow-left" variant="text" color="white" @click="goBack" />
          <v-icon color="primary" size="32">mdi-car-sports</v-icon>
          <h1 class="text-h5 font-weight-bold">Checkout</h1>
        </div>
        <p class="text-body-2 text-medium-emphasis">Complete your booking in a few steps</p>
      </v-container>
    </div>

    <v-container>
      <!-- Success Dialog -->
      <v-dialog v-model="bookingStore.submitted" persistent max-width="500">
        <v-card rounded="xl" class="pa-6 text-center">
          <v-icon size="64" color="success" class="mb-4">mdi-check-circle</v-icon>
          <h2 class="text-h5 font-weight-bold mb-2">Booking Confirmed!</h2>
          <p class="text-body-1 text-medium-emphasis mb-6">
            Your reservation has been successfully placed. You'll receive a confirmation email shortly.
          </p>
          <v-btn color="primary" rounded="lg" size="large" block @click="goToVehicles">
            Back to Catalog
          </v-btn>
        </v-card>
      </v-dialog>

      <!-- No vehicle selected -->
      <v-card
        v-if="!bookingStore.selectedVehicle"
        rounded="xl"
        elevation="0"
        class="pa-12 text-center"
      >
        <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-car-off</v-icon>
        <h3 class="text-h6 font-weight-bold mb-2">No vehicle selected</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">
          Please select a vehicle from the catalog first.
        </p>
        <v-btn color="primary" rounded="lg" @click="goToVehicles">
          Browse Vehicles
        </v-btn>
      </v-card>

      <!-- Checkout Content -->
      <v-row v-else>
        <!-- Left Column: Form -->
        <v-col cols="12" md="7" lg="8">
          <!-- Step 1: Booking Details -->
          <v-card elevation="0" rounded="xl" class="mb-4 checkout-card">
            <v-card-title class="d-flex align-center ga-3 pa-5 pb-3">
              <v-avatar color="primary" size="32">
                <span class="text-body-2 font-weight-bold text-white">1</span>
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Booking Details</span>
            </v-card-title>
            <v-card-text class="pa-5 pt-0">
              <v-row dense>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.pickupLocation"
                    label="Pick-up Location"
                    prepend-inner-icon="mdi-map-marker"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required]"
                    placeholder="City or Airport"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.dropoffLocation"
                    label="Drop-off Location"
                    prepend-inner-icon="mdi-map-marker-check"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required]"
                    placeholder="City or Airport"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.date"
                    label="Date"
                    prepend-inner-icon="mdi-calendar"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="date"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.time"
                    label="Time"
                    prepend-inner-icon="mdi-clock-outline"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="time"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Step 2: Personal Information -->
          <v-card elevation="0" rounded="xl" class="mb-4 checkout-card">
            <v-card-title class="d-flex align-center ga-3 pa-5 pb-3">
              <v-avatar color="primary" size="32">
                <span class="text-body-2 font-weight-bold text-white">2</span>
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Personal Information</span>
            </v-card-title>
            <v-card-text class="pa-5 pt-0">
              <v-row dense>
                <v-col cols="12">
                  <v-text-field
                    v-model="bookingStore.personalInfo.fullName"
                    label="Full Name"
                    prepend-inner-icon="mdi-account"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required, rules.minLength(2)]"
                    placeholder="John Doe"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.personalInfo.email"
                    label="Email"
                    prepend-inner-icon="mdi-email-outline"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required, rules.email]"
                    placeholder="john@example.com"
                    type="email"
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.personalInfo.phone"
                    label="Phone Number"
                    prepend-inner-icon="mdi-phone"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.required, rules.phone]"
                    placeholder="+1 (555) 123-4567"
                  />
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Step 3: Additional Options -->
          <v-card elevation="0" rounded="xl" class="mb-4 checkout-card">
            <v-card-title class="d-flex align-center ga-3 pa-5 pb-3">
              <v-avatar color="primary" size="32">
                <span class="text-body-2 font-weight-bold text-white">3</span>
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Additional Options</span>
            </v-card-title>
            <v-card-text class="pa-5 pt-0">
              <v-row dense>
                <v-col
                  v-for="addon in bookingStore.addons"
                  :key="addon.id"
                  cols="12"
                  sm="4"
                >
                  <v-card
                    :class="['addon-card', { 'addon-card--selected': addon.selected }]"
                    elevation="0"
                    rounded="xl"
                    @click="bookingStore.toggleAddon(addon.id)"
                  >
                    <v-card-text class="pa-4 text-center">
                      <v-icon
                        :color="addon.selected ? 'primary' : 'grey'"
                        size="36"
                        class="mb-2"
                      >
                        {{ addon.icon }}
                      </v-icon>
                      <h4 class="text-subtitle-2 font-weight-bold mb-1">{{ addon.title }}</h4>
                      <p class="text-caption text-medium-emphasis mb-2">{{ addon.description }}</p>
                      <v-chip
                        size="small"
                        :color="addon.selected ? 'primary' : 'grey-lighten-1'"
                        :variant="addon.selected ? 'elevated' : 'tonal'"
                      >
                        +${{ addon.pricePerDay }}/day
                      </v-chip>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Step 4: Payment Method -->
          <v-card elevation="0" rounded="xl" class="mb-4 checkout-card">
            <v-card-title class="d-flex align-center ga-3 pa-5 pb-3">
              <v-avatar color="primary" size="32">
                <span class="text-body-2 font-weight-bold text-white">4</span>
              </v-avatar>
              <span class="text-subtitle-1 font-weight-bold">Payment Method</span>
            </v-card-title>
            <v-card-text class="pa-5 pt-0">
              <v-radio-group v-model="bookingStore.paymentMethod" hide-details>
                <v-card
                  :class="['payment-option mb-3', { 'payment-option--selected': bookingStore.paymentMethod === 'online' }]"
                  elevation="0"
                  rounded="xl"
                  @click="bookingStore.paymentMethod = 'online'"
                >
                  <v-card-text class="d-flex align-center ga-3 pa-4">
                    <v-radio value="online" color="primary" hide-details />
                    <v-icon color="primary">mdi-credit-card</v-icon>
                    <div>
                      <div class="text-subtitle-2 font-weight-bold">Pay Online</div>
                      <div class="text-caption text-medium-emphasis">Card / Crypto</div>
                    </div>
                  </v-card-text>
                </v-card>

                <v-card
                  :class="['payment-option', { 'payment-option--selected': bookingStore.paymentMethod === 'delivery' }]"
                  elevation="0"
                  rounded="xl"
                  @click="bookingStore.paymentMethod = 'delivery'"
                >
                  <v-card-text class="d-flex align-center ga-3 pa-4">
                    <v-radio value="delivery" color="primary" hide-details />
                    <v-icon color="primary">mdi-cash</v-icon>
                    <div>
                      <div class="text-subtitle-2 font-weight-bold">Pay on Delivery</div>
                      <div class="text-caption text-medium-emphasis">Cash or card on pick-up</div>
                    </div>
                  </v-card-text>
                </v-card>
              </v-radio-group>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right Column: Summary -->
        <v-col cols="12" md="5" lg="4">
          <div class="summary-sticky">
            <v-card elevation="0" rounded="xl" class="checkout-card">
              <v-card-title class="pa-5 pb-3 text-subtitle-1 font-weight-bold">
                <v-icon start color="primary">mdi-clipboard-text</v-icon>
                Booking Summary
              </v-card-title>

              <v-divider />

              <!-- Vehicle Info -->
              <v-card-text class="pa-5">
                <div class="d-flex ga-4 mb-4">
                  <v-img
                    :src="bookingStore.selectedVehicle!.image"
                    width="120"
                    height="80"
                    cover
                    rounded="lg"
                  />
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold">
                      {{ bookingStore.selectedVehicle!.brand }} {{ bookingStore.selectedVehicle!.model }}
                    </h4>
                    <div class="text-body-2 text-primary font-weight-bold">
                      ${{ bookingStore.selectedVehicle!.pricePerDay }}/day
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ bookingStore.rentalDays }} day(s) •
                      {{ bookingStore.bookingDetails.pickupLocation || 'Location TBD' }}
                    </div>
                  </div>
                </div>

                <v-divider class="mb-4" />

                <!-- Price Breakdown -->
                <h4 class="text-subtitle-2 font-weight-bold mb-3">Price Breakdown</h4>

                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2 text-medium-emphasis">
                    Rental Rate ({{ bookingStore.rentalDays }} × ${{ bookingStore.selectedVehicle!.pricePerDay }})
                  </span>
                  <span class="text-body-2 font-weight-medium">${{ bookingStore.rentalRate }}</span>
                </div>

                <div
                  v-for="addon in selectedAddons"
                  :key="addon.id"
                  class="d-flex justify-space-between mb-2"
                >
                  <span class="text-body-2 text-medium-emphasis">
                    {{ addon.title }} ({{ bookingStore.rentalDays }} × ${{ addon.pricePerDay }})
                  </span>
                  <span class="text-body-2 font-weight-medium">
                    ${{ addon.pricePerDay * bookingStore.rentalDays }}
                  </span>
                </div>

                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2 text-medium-emphasis">Service Fee (5%)</span>
                  <span class="text-body-2 font-weight-medium">${{ bookingStore.serviceFee }}</span>
                </div>

                <v-divider class="my-3" />

                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">Total Amount</span>
                  <span class="text-h5 font-weight-bold text-primary">${{ bookingStore.totalAmount }}</span>
                </div>

                <v-chip
                  size="small"
                  color="success"
                  variant="tonal"
                  class="mb-4"
                  prepend-icon="mdi-check-circle"
                >
                  Includes VAT
                </v-chip>

                <!-- Validation messages -->
                <v-alert
                  v-if="!bookingStore.isBookingDetailsValid"
                  type="info"
                  variant="tonal"
                  density="compact"
                  rounded="lg"
                  class="mb-2"
                >
                  Please fill in pick-up and drop-off locations
                </v-alert>
                <v-alert
                  v-if="!bookingStore.isPersonalInfoValid"
                  type="info"
                  variant="tonal"
                  density="compact"
                  rounded="lg"
                  class="mb-2"
                >
                  Please complete personal information
                </v-alert>

                <v-btn
                  block
                  color="primary"
                  size="x-large"
                  rounded="lg"
                  elevation="0"
                  class="mt-4 confirm-btn"
                  :disabled="!bookingStore.canSubmit"
                  :loading="bookingStore.submitting"
                  @click="bookingStore.confirmBooking()"
                >
                  <v-icon start>mdi-check-circle</v-icon>
                  Confirm and Book
                </v-btn>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <LuxeFooter />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBookingStore } from '@/stores/booking';
import type { AddonOption } from '@/stores/booking';
import { useVehicleStore } from '@/stores/vehicles';
import LuxeFooter from '@/components/luxedrive/LuxeFooter.vue';

const router = useRouter();
const route = useRoute();
const bookingStore = useBookingStore();
const vehicleStore = useVehicleStore();

const selectedAddons = computed(() => bookingStore.addons.filter((a: AddonOption) => a.selected));

// If navigated directly, try to load vehicle by ID
if (!bookingStore.selectedVehicle && route.params.id) {
  const vehicle = vehicleStore.getVehicleById(Number(route.params.id));
  if (vehicle) {
    bookingStore.setVehicle(vehicle);
  }
}

const rules = {
  required: (v: string) => !!v?.trim() || 'This field is required',
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email format',
  phone: (v: string) => v?.trim().length >= 7 || 'Phone number must be at least 7 characters',
  minLength: (min: number) => (v: string) => v?.trim().length >= min || `Minimum ${min} characters`,
};

function goBack() {
  router.push({ name: 'Vehicles' });
}

function goToVehicles() {
  bookingStore.reset();
  router.push({ name: 'Vehicles' });
}

onBeforeUnmount(() => {
  // Don't reset if just navigating within checkout
});
</script>

<style scoped>
.checkout-page {
  background: #f8f7fc;
  min-height: 100vh;
}

.checkout-hero {
  background: linear-gradient(135deg, #311b92 0%, #4527a0 50%, #283593 100%);
  padding: 24px 0 20px;
  color: white;
}

.checkout-hero p {
  color: rgba(255, 255, 255, 0.7) !important;
}

.checkout-card {
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.summary-sticky {
  position: sticky;
  top: 80px;
}

/* Addon cards */
.addon-card {
  border: 2px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.addon-card:hover {
  border-color: rgba(103, 58, 183, 0.3);
  transform: translateY(-2px);
}

.addon-card--selected {
  border-color: #673ab7;
  background: rgba(103, 58, 183, 0.04);
}

/* Payment options */
.payment-option {
  border: 2px solid rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.2s ease;
}

.payment-option:hover {
  border-color: rgba(103, 58, 183, 0.3);
}

.payment-option--selected {
  border-color: #673ab7;
  background: rgba(103, 58, 183, 0.04);
}

/* Confirm button */
.confirm-btn {
  text-transform: none;
  font-weight: 700;
  letter-spacing: 0.5px;
}
</style>
