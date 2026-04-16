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
      <v-dialog v-model="bookingStore.submitted" persistent max-width="700">
        <v-card rounded="xl" class="pa-4 text-center">
          <v-card-text class="pa-10">
            <div class="success-icon-wrapper mb-5">
              <v-icon size="72" color="success">mdi-check-circle</v-icon>
            </div>
            <h2 class="text-h4 font-weight-bold mb-3 text-black">Booking Request Sent!</h2>
            <p class="text-body-1 text-black mb-5" style="font-size: 16px;">
              Your request has been successfully submitted.
            </p>

            <v-alert type="success" variant="tonal" rounded="lg" class="text-left mb-4" density="compact">
              <div class="text-body-1 text-black">
                A confirmation email has been sent to
                <strong>{{ bookingStore.personalInfo.email }}</strong>.
                Please check your inbox.
              </div>
            </v-alert>

            <v-card variant="tonal" color="grey-lighten-3" rounded="lg" class="pa-4 text-left mb-5">
              <div class="text-body-2 text-black mb-3 font-weight-bold text-uppercase">
                What happens next?
              </div>
              <div class="d-flex align-start ga-2 mb-2">
                <v-icon size="16" color="primary" class="mt-0">mdi-clock-outline</v-icon>
                <span class="text-body-1 text-black">Our managers will review your request and confirm it shortly.</span>
              </div>
              <div class="d-flex align-start ga-2 mb-2">
                <v-icon size="16" color="primary">mdi-email-outline</v-icon>
                <span class="text-body-1 text-black">You'll receive an email once your booking status changes.</span>
              </div>
              <div class="d-flex align-start ga-2">
                <v-icon size="16" color="success">mdi-whatsapp</v-icon>
                <span class="text-body-1 text-black">
            Questions? Contact us:<br>
            <a href="mailto:admin@ironhorseasia.com" class="text-primary">admin@ironhorseasia.com</a>
            &nbsp;·&nbsp;
            <a href="https://wa.me/996500000123" target="_blank" class="text-primary">+996 500 000 123</a>
          </span>
              </div>
            </v-card>

            <v-btn color="primary" rounded="lg" size="x-large" block class="mt-4" @click="goToVehicles">
              <v-icon start>mdi-car-multiple</v-icon>
              Back to Catalog
            </v-btn>
          </v-card-text>
        </v-card>
      </v-dialog>


      <!-- ─── Confirmation Dialog ─── -->
      <v-dialog v-model="confirmDialog" max-width="700" persistent>
        <v-card rounded="xl" class="pa-4 text-center">
          <v-card-text class="pa-10">
            <div class="d-flex align-center ga-3 mb-4">
              <v-avatar color="warning" variant="tonal" size="48" rounded="lg">
                <v-icon size="26">mdi-alert-circle-outline</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">Before you confirm</div>
                <div class="text-body-2 text-medium-emphasis">Please review your details</div>
              </div>
            </div>

            <v-alert type="info" variant="tonal" rounded="lg" class="mb-4" density="compact">
              Please check your contact information. We will get back to you shortly to confirm your booking.
            </v-alert>

            <!-- Summary -->
            <div class="confirm-summary pa-3 rounded-lg mb-4">
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-black mb-3 font-weight-bold text-uppercase">Name</span>
                <span class="text-body-1 text-black mb-3 font-weight-medium">{{ bookingStore.personalInfo.fullName }}</span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-black mb-3 font-weight-bold text-uppercase">Email</span>
                <span class="text-body-1 text-black mb-3 font-weight-medium">{{ bookingStore.personalInfo.email }}</span>
              </div>
              <div class="d-flex justify-space-between mb-1">
                <span class="text-body-2 text-black mb-3 font-weight-bold text-uppercase">Phone</span>
                <span class="text-body-1 text-black mb-3 font-weight-medium">{{ bookingStore.personalInfo.phone }}</span>
              </div>
              <v-divider class="my-2" />
              <div class="d-flex justify-space-between align-center mt-2 total-box pa-3 rounded-lg">
                <span class="text-body-2 text-black mb-3 font-weight-bold text-uppercase">Total</span>
                <span class="text-h6 font-weight-bold text-primary">${{ bookingStore.totalAmount }}</span>
              </div>
            </div>
          </v-card-text>

          <v-card-actions class="px-6 pb-5 pt-0 d-flex ga-3">
            <v-btn
              variant="tonal"
              rounded="lg"
              flex="1"
              size="x-large"
              @click="confirmDialog = false"
            >
              Go Back
            </v-btn>
            <v-btn
              color="primary"
              variant="flat"
              rounded="lg"
              flex="1"
              size="x-large"
              :loading="bookingStore.submitting"
              @click="handleConfirmBooking"
            >
              <v-icon start>mdi-check-circle</v-icon>
              Yes, Confirm
            </v-btn>
          </v-card-actions>
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
                  <v-autocomplete
                    v-model="bookingStore.bookingDetails.pickupLocation"
                    :items="bookingStore.locations"
                    item-title="name"
                    item-value="id"
                    label="Pick-up Location"
                    prepend-inner-icon="mdi-map-marker"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.requiredSelect]"
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
                <v-col cols="12" sm="6">
                  <v-autocomplete
                    v-model="bookingStore.bookingDetails.dropoffLocation"
                    :items="bookingStore.locations"
                    item-title="name"
                    item-value="id"
                    label="Drop-off Location"
                    prepend-inner-icon="mdi-map-marker-check"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    :rules="[rules.requiredSelect]"
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
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.pickupDate"
                    label="Pick-up Date"
                    prepend-inner-icon="mdi-calendar-arrow-right"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="date"
                    :min="minPickupDate"
                    :rules="[rules.required]"
                    persistent-placeholder
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.pickupTime"
                    label="Pick-up Time"
                    prepend-inner-icon="mdi-clock-outline"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="time"
                    persistent-placeholder
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.dropoffDate"
                    label="Drop-off Date"
                    prepend-inner-icon="mdi-calendar-arrow-left"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="date"
                    :min="minDropoffDate"
                    :rules="[rules.required]"
                    persistent-placeholder
                  />
                </v-col>
                <v-col cols="12" sm="6">
                  <v-text-field
                    v-model="bookingStore.bookingDetails.dropoffTime"
                    label="Drop-off Time"
                    prepend-inner-icon="mdi-clock-outline"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    type="time"
                    persistent-placeholder
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
                    persistent-placeholder
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
                    persistent-placeholder
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
                    persistent-placeholder
                  />
                </v-col>
                <v-col cols="12">
                  <v-textarea
                    v-model="bookingStore.personalInfo.additionalInfo"
                    label="Additional Info"
                    prepend-inner-icon="mdi-text-box-outline"
                    variant="outlined"
                    density="comfortable"
                    rounded="lg"
                    placeholder="Special requests, notes, etc."
                    persistent-placeholder
                    rows="3"
                    auto-grow
                    hide-details
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
              <div
                v-for="(group, gi) in bookingStore.addonsByCategory"
                :key="gi"
                class="mb-5"
              >
                <div class="d-flex align-center ga-2 mb-3">
                  <v-icon size="20" color="primary">{{ group.icon }}</v-icon>
                  <span class="text-subtitle-2 font-weight-bold text-medium-emphasis text-uppercase ls-wide">{{ group.label }}</span>
                </div>
                <v-row dense>
                  <v-col
                    v-for="addon in group.items"
                    :key="addon.id"
                    cols="12"
                    sm="6"
                    md="4"
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
                          {{ addon.pricePerDay > 0 ? `+$${addon.pricePerDay}/day` : 'Free' }}
                        </v-chip>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
                <v-divider v-if="gi < bookingStore.addonsByCategory.length - 1" class="mt-4" />
              </div>
            </v-card-text>
          </v-card>

          <!-- Step 4: Payment Method -->
<!--          <v-card elevation="0" rounded="xl" class="mb-4 checkout-card">-->
<!--            <v-card-title class="d-flex align-center ga-3 pa-5 pb-3">-->
<!--              <v-avatar color="primary" size="32">-->
<!--                <span class="text-body-2 font-weight-bold text-white">4</span>-->
<!--              </v-avatar>-->
<!--              <span class="text-subtitle-1 font-weight-bold">Payment Method</span>-->
<!--            </v-card-title>-->
<!--            <v-card-text class="pa-5 pt-0">-->
<!--              <v-radio-group v-model="bookingStore.paymentMethod" hide-details>-->
<!--                <v-card-->
<!--                  :class="['payment-option mb-3', { 'payment-option&#45;&#45;selected': bookingStore.paymentMethod === 'online' }]"-->
<!--                  elevation="0"-->
<!--                  rounded="xl"-->
<!--                  @click="bookingStore.paymentMethod = 'online'"-->
<!--                >-->
<!--                  <v-card-text class="d-flex align-center ga-3 pa-4">-->
<!--                    <v-radio value="online" color="primary" hide-details />-->
<!--                    <v-icon color="primary">mdi-credit-card</v-icon>-->
<!--                    <div>-->
<!--                      <div class="text-subtitle-2 font-weight-bold">Pay Online</div>-->
<!--                      <div class="text-caption text-medium-emphasis">Card / Crypto</div>-->
<!--                    </div>-->
<!--                  </v-card-text>-->
<!--                </v-card>-->

<!--                <v-card-->
<!--                  :class="['payment-option', { 'payment-option&#45;&#45;selected': bookingStore.paymentMethod === 'delivery' }]"-->
<!--                  elevation="0"-->
<!--                  rounded="xl"-->
<!--                  @click="bookingStore.paymentMethod = 'delivery'"-->
<!--                >-->
<!--                  <v-card-text class="d-flex align-center ga-3 pa-4">-->
<!--                    <v-radio value="delivery" color="primary" hide-details />-->
<!--                    <v-icon color="primary">mdi-cash</v-icon>-->
<!--                    <div>-->
<!--                      <div class="text-subtitle-2 font-weight-bold">Pay on Delivery</div>-->
<!--                      <div class="text-caption text-medium-emphasis">Cash or card on pick-up</div>-->
<!--                    </div>-->
<!--                  </v-card-text>-->
<!--                </v-card>-->
<!--              </v-radio-group>-->
<!--            </v-card-text>-->
<!--          </v-card>-->
        </v-col>

        <!-- Right Column: Summary -->
        <v-col cols="12" md="5" lg="4">
          <div class="summary-sticky">
            <v-card elevation="0" rounded="xl" class="checkout-card overflow-hidden">

              <!-- ═══════════════════════════════════════════ -->
              <!--                IMAGE CAROUSEL               -->
              <!-- ═══════════════════════════════════════════ -->
              <CarImageCarousel
                :images="vehicleImages"
                :alt="`${bookingStore.selectedVehicle!.brand} ${bookingStore.selectedVehicle!.model}`"
                :height="240"
              />

              <!-- Vehicle title overlay row -->
              <div class="summary-vehicle-title px-4 pt-3 pb-1">
                <div class="d-flex align-start justify-space-between">
                  <div>
                    <h4 class="text-subtitle-1 font-weight-bold leading-tight">
                      {{ bookingStore.selectedVehicle!.brand }} {{ bookingStore.selectedVehicle!.model }}
                    </h4>
                    <div class="d-flex align-center ga-2 mt-1 flex-wrap">
                      <v-chip size="x-small" variant="tonal" color="grey-darken-1">
                        {{ bookingStore.selectedVehicle!.carClass }}
                      </v-chip>
                      <v-chip
                        v-if="bookingStore.priceBreakdown?.tierName"
                        size="x-small"
                        color="primary"
                        variant="tonal"
                      >
                        {{ bookingStore.priceBreakdown.tierName }}
                      </v-chip>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="text-body-2 text-primary font-weight-bold">
                      <template v-if="bookingStore.priceBreakdown">
                        ${{ bookingStore.priceBreakdown.pricePerDay }}/day
                      </template>
                      <template v-else>
                        from ${{ bookingStore.selectedVehicle!.minPricePerDay || bookingStore.selectedVehicle!.pricePerDay }}/day
                      </template>
                    </div>
                    <div class="text-caption text-medium-emphasis">
                      {{ bookingStore.rentalDays }} day(s)
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pickup info chip -->
              <div class="px-4 pb-3">
                <div class="text-caption text-medium-emphasis d-flex align-center ga-1">
                  <v-icon size="12">mdi-map-marker</v-icon>
                  {{ pickupLocationName }}
                </div>
              </div>

              <v-divider />

              <!-- Price Breakdown -->
              <v-card-text class="pa-4">
                <h4 class="text-subtitle-2 font-weight-bold mb-3 d-flex align-center ga-2">
                  <v-icon size="16" color="primary">mdi-receipt-text</v-icon>
                  Price Breakdown
                </h4>

                <div class="d-flex justify-space-between mb-2">
                  <span class="text-body-2 text-medium-emphasis">
                    Rental Rate ({{ bookingStore.rentalDays }} × ${{ bookingStore.priceBreakdown ? bookingStore.priceBreakdown.pricePerDay : bookingStore.selectedVehicle!.pricePerDay }})
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
                  <span class="text-body-2 text-medium-emphasis">Service Fee (10%)</span>
                  <span class="text-body-2 font-weight-medium">${{ bookingStore.serviceFee }}</span>
                </div>

                <v-divider class="my-3" />

                <div class="d-flex justify-space-between align-center mb-2">
                  <span class="text-subtitle-1 font-weight-bold">Total Amount</span>
                  <span class="text-h5 font-weight-bold text-primary">${{ bookingStore.totalAmount }}</span>
                </div>

                <!-- Prepayment info -->
                <div v-if="bookingStore.priceBreakdown?.prepaymentAmount" class="d-flex justify-space-between align-center mb-3">
                  <span class="text-body-2 text-medium-emphasis">Prepayment (15%)</span>
                  <span class="text-body-2 font-weight-bold text-success">${{ bookingStore.priceBreakdown.prepaymentAmount }}</span>
                </div>

                <v-chip
                  size="small"
                  color="info"
                  variant="tonal"
                  class="mb-4"
                  prepend-icon="mdi-information"
                >
                  Booking confirmed after 15% prepayment
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
                  class="mt-2 confirm-btn"
                  :disabled="!bookingStore.canSubmit"
                  :loading="bookingStore.submitting"
                  @click="openConfirmDialog"
                >
                <v-icon start>mdi-check-circle</v-icon>
                Confirm and Request Booking
                </v-btn>
              </v-card-text>
            </v-card>
          </div>
        </v-col>
      </v-row>
    </v-container>

    <RentalFooter />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useBookingStore } from '@/stores/booking';
import type { AddonOption } from '@/stores/booking';
import RentalFooter from '@/components/rental/RentalFooter.vue';
import CarImageCarousel from '@/components/rental/CarImageCarousel.vue';

const router = useRouter();
const route = useRoute();
const bookingStore = useBookingStore();

const selectedAddons = computed(() => bookingStore.addons.filter((a: AddonOption) => a.selected));

const minDropoffDate = computed(() => {
  return bookingStore.bookingDetails.pickupDate || new Date().toISOString().split('T')[0];
});

const minPickupDate = computed(() => {
  return new Date().toISOString().split('T')[0];
});

const pickupLocationName = computed(() => {
  const id = bookingStore.bookingDetails.pickupLocation;
  if (!id) return 'Location TBD';
  const loc = bookingStore.locations.find((l: any) => l.id === id);
  return loc ? loc.name : 'Location TBD';
});

import { BASE_URL } from '@/axios/api';



const vehicleImages = computed((): string[] => {
  const v = bookingStore.selectedVehicle as any;
  if (!v) return [];

  if (Array.isArray(v.images) && v.images.length > 0) {
    return v.images.map((p: any) => {
      const url = typeof p === 'string' ? p : p.url;
      if (!url) return '';
      return url.startsWith('http') ? url : BASE_URL + url;
    }).filter(Boolean);
  }

  if (v.image) return [v.image];
  return [];
});

onMounted(async () => {
  if (!bookingStore.selectedVehicle && route.params.id) {
    await bookingStore.fetchVehicleById(Number(route.params.id));
  }
  await Promise.all([
    bookingStore.fetchLocations(),
    bookingStore.fetchServiceOptions(),
  ]);
  if (bookingStore.bookingDetails.pickupDate && bookingStore.bookingDetails.dropoffDate) {
    await bookingStore.calculatePrice();
  }
});

watch(
  () => [
    bookingStore.bookingDetails.pickupDate,
    bookingStore.bookingDetails.dropoffDate,
    bookingStore.addons.filter((a: AddonOption) => a.selected).length,
  ],
  async () => {
    if (bookingStore.selectedVehicle && bookingStore.bookingDetails.pickupDate && bookingStore.bookingDetails.dropoffDate) {
      await bookingStore.calculatePrice();
    }
  },
  { deep: true }
);

watch(() => bookingStore.bookingDetails.pickupDate, (newPickup) => {
  const dropoff = bookingStore.bookingDetails.dropoffDate;
  if (newPickup && dropoff && dropoff < newPickup) {
    bookingStore.bookingDetails.dropoffDate = null;
  }
});

const rules = {
  required: (v: string) => !!v?.trim() || 'This field is required',
  requiredSelect: (v: any) => v !== null && v !== undefined || 'Please select a location',
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'Invalid email format',
  phone: (v: string) => v?.trim().length >= 7 || 'Phone number must be at least 7 characters',
  minLength: (min: number) => (v: string) => v?.trim().length >= min || `Minimum ${min} characters`,
};

const confirmDialog = ref(false);
// const bookingError = ref('');
// const errorSnackbar = ref(false);

function openConfirmDialog() {
  confirmDialog.value = true;
}

async function handleConfirmBooking() {
  confirmDialog.value = false;
  try {
    await bookingStore.confirmBooking();
  } catch (e: any) {
    // Error is handled globally by the API interceptor
  }
}

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

/* Vehicle title below carousel */
.summary-vehicle-title {
  background: white;
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

.confirm-summary {
  background: rgba(0, 0, 0, 0.03);
  border: 1px solid rgba(0, 0, 0, 0.06);
}

.success-icon-wrapper {
  animation: pop-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes pop-in {
  from { transform: scale(0.5); opacity: 0; }
  to   { transform: scale(1);   opacity: 1; }
}

.ls-wide {
  letter-spacing: 0.08em;
}

.leading-tight {
  line-height: 1.3;
}

.text-black {
  color: #000 !important;
}
</style>
