<template>
  <div class="main-landing">
    <!-- Hero Section -->
    <div class="hero-section">
      <v-container class="d-flex flex-column align-center justify-center text-center" style="min-height: 70vh">
        <v-icon size="72" color="white" class="mb-6">mdi-car-sports</v-icon>
        <h1 class="text-h2 font-weight-black text-white mb-4">LuxeDrive</h1>
        <p class="text-h6 font-weight-light mb-8" style="color: rgba(255,255,255,0.8); max-width: 600px">
          Premium car rental service — experience luxury on every road.
          From supercars to electric vehicles.
        </p>
        <v-btn
          color="white"
          size="x-large"
          rounded="xl"
          class="px-10 cta-btn"
          @click="$router.push({ name: 'Vehicles' })"
        >
          <v-icon start>mdi-magnify</v-icon>
          Browse Our Fleet
        </v-btn>
      </v-container>
    </div>

    <!-- Features -->
    <v-container class="py-16">
      <v-row justify="center">
        <v-col cols="12" sm="4" class="text-center">
          <v-icon size="48" color="primary" class="mb-3">mdi-shield-check</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">Full Insurance</h3>
          <p class="text-body-2 text-medium-emphasis">Comprehensive coverage on every rental for your peace of mind.</p>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-icon size="48" color="primary" class="mb-3">mdi-clock-fast</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">Instant Booking</h3>
          <p class="text-body-2 text-medium-emphasis">Reserve your dream car in just a few clicks, 24/7.</p>
        </v-col>
        <v-col cols="12" sm="4" class="text-center">
          <v-icon size="48" color="primary" class="mb-3">mdi-star</v-icon>
          <h3 class="text-h6 font-weight-bold mb-2">Premium Fleet</h3>
          <p class="text-body-2 text-medium-emphasis">Handpicked luxury vehicles maintained to the highest standards.</p>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.main-landing {
  background: #f8f7fc;
}

.hero-section {
  background: linear-gradient(135deg, #1a1a2e 0%, #311b92 40%, #4527a0 70%, #283593 100%);
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -50%;
  right: -20%;
  width: 600px;
  height: 600px;
  border-radius: 50%;
  background: rgba(179, 136, 255, 0.08);
}

.cta-btn {
  color: #311b92 !important;
  font-weight: 700;
  text-transform: none;
  letter-spacing: 0.5px;
}
</style>

