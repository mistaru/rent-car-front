<template>
  <footer class="rental-footer mt-12">
    <v-container>
      <v-row>
        <!-- Fleet Options -->
        <v-col cols="12" sm="6" md="3">
          <h4 class="text-subtitle-1 font-weight-bold mb-3 text-white">Fleet Options</h4>
          <div class="d-flex flex-column ga-1">
            <a class="footer-link" href="#">Luxury Sedans</a>
            <a class="footer-link" href="#">Premium SUVs</a>
            <a class="footer-link" href="#">Supercars</a>
            <a class="footer-link" href="#">Electric Vehicles</a>
            <a class="footer-link" href="#">Grand Tourers</a>
          </div>
        </v-col>

        <!-- Company -->
        <v-col cols="12" sm="6" md="3">
          <h4 class="text-subtitle-1 font-weight-bold mb-3 text-white">Company</h4>
          <div class="d-flex flex-column ga-1">
            <a class="footer-link" href="#">About Us</a>
            <a class="footer-link" href="#">Careers</a>
            <a class="footer-link" href="#">Press</a>
            <a class="footer-link" href="#">Blog</a>
            <a class="footer-link" href="#">Contact</a>
          </div>
        </v-col>

        <!-- Support -->
        <v-col cols="12" sm="6" md="3">
          <h4 class="text-subtitle-1 font-weight-bold mb-3 text-white">Support</h4>
          <div class="d-flex flex-column ga-1">
            <a class="footer-link" href="#">FAQ</a>
            <a class="footer-link" href="#">Terms of Service</a>
            <a class="footer-link" href="#">Privacy Policy</a>
            <a class="footer-link" href="#">Insurance Info</a>
          </div>
        </v-col>

        <!-- Newsletter -->
        <v-col cols="12" sm="6" md="3">
          <h4 class="text-subtitle-1 font-weight-bold mb-3 text-white">Stay Updated</h4>
          <p class="text-body-2 text-grey-lighten-1 mb-3">
            Subscribe to get exclusive deals and new fleet updates.
          </p>
          <v-text-field
            v-model="email"
            placeholder="Your email"
            variant="solo"
            density="compact"
            rounded="lg"
            bg-color="rgba(255,255,255,0.1)"
            hide-details
            class="mb-2"
          >
            <template #append-inner>
              <v-btn
                icon="mdi-send"
                size="small"
                variant="text"
                color="primary"
                @click="subscribe"
              />
            </template>
          </v-text-field>
        </v-col>
      </v-row>

      <v-divider class="my-6" color="rgba(255,255,255,0.12)" />

      <div class="d-flex align-center justify-space-between flex-wrap ga-4">
        <div class="d-flex align-center ga-2">
          <v-icon color="primary" size="28">mdi-car-sports</v-icon>
          <span class="text-h6 font-weight-bold text-white">Car Rental</span>
        </div>
        <span class="text-body-2 text-grey-lighten-1">
          © {{ currentYear }} Car Rental. All rights reserved.
        </span>
        <div class="d-flex ga-1">
          <v-btn icon="mdi-instagram" variant="text" size="small" color="grey-lighten-1" />
          <v-btn icon="mdi-twitter" variant="text" size="small" color="grey-lighten-1" />
          <v-btn icon="mdi-facebook" variant="text" size="small" color="grey-lighten-1" />
          <v-btn icon="mdi-linkedin" variant="text" size="small" color="grey-lighten-1" />
        </div>
      </div>
    </v-container>
  </footer>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';

const email = ref('');
const currentYear = computed(() => new Date().getFullYear());

function subscribe() {
  if (email.value) {
    // Имитация подписки
    email.value = '';
  }
}
</script>

<style scoped>
.rental-footer {
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 48px 0 24px;
}

.footer-link {
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s ease;
  padding: 2px 0;
}

.footer-link:hover {
  color: #b388ff;
}
</style>
