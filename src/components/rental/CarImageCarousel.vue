<template>
  <div
    class="car-carousel"
    @mouseenter="showControls = true"
    @mouseleave="showControls = false"
    @touchstart="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Main Image -->
    <div class="car-carousel__track">
      <transition :name="transitionName">
        <div :key="currentIndex" class="car-carousel__slide">
          <v-img
            :src="currentImage"
            :alt="alt"
            cover
            class="car-carousel__image"
          >
            <template #placeholder>
              <div class="car-carousel__placeholder d-flex align-center justify-center">
                <v-progress-circular indeterminate color="grey-lighten-2" size="32" />
              </div>
            </template>
            <template #error>
              <div class="car-carousel__fallback d-flex flex-column align-center justify-center">
                <v-icon size="48" color="grey-lighten-2">mdi-car-outline</v-icon>
                <span class="text-caption text-grey mt-2">No image available</span>
              </div>
            </template>
            <div class="car-carousel__gradient" />
          </v-img>
        </div>
      </transition>
    </div>

    <!-- Controls -->
    <template v-if="images.length > 1">
      <transition name="fade-btn">
        <button
          v-show="showControls || isMobile"
          class="car-carousel__btn car-carousel__btn--prev"
          aria-label="Previous image"
          @click.stop="prev"
        >
          <v-icon size="18">mdi-chevron-left</v-icon>
        </button>
      </transition>
      <transition name="fade-btn">
        <button
          v-show="showControls || isMobile"
          class="car-carousel__btn car-carousel__btn--next"
          aria-label="Next image"
          @click.stop="next"
        >
          <v-icon size="18">mdi-chevron-right</v-icon>
        </button>
      </transition>

      <div class="car-carousel__dots">
        <button
          v-for="(_, i) in images"
          :key="i"
          :class="['car-carousel__dot', { 'car-carousel__dot--active': i === currentIndex }]"
          @click.stop="goTo(i)"
        />
      </div>

      <div class="car-carousel__counter">
        {{ currentIndex + 1 }} / {{ images.length }}
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = withDefaults(defineProps<{
  images: string[];
  alt?: string;
  height?: number | string;
  autoplay?: boolean;
  autoplayInterval?: number;
}>(), {
  alt: 'Vehicle image',
  height: 260,
  autoplay: false,
  autoplayInterval: 4000,
});

const currentIndex = ref(0);
const showControls = ref(false);
const transitionName = ref('slide-left');
const isMobile = ref(false);
let touchStartX = 0;
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

const currentImage = computed(() =>
  props.images.length > 0 ? props.images[currentIndex.value] : ''
);

const trackHeight = computed(() =>
  typeof props.height === 'number' ? `${props.height}px` : String(props.height)
);

function prev() {
  transitionName.value = 'slide-right';
  currentIndex.value = (currentIndex.value - 1 + props.images.length) % props.images.length;
}

function next() {
  transitionName.value = 'slide-left';
  currentIndex.value = (currentIndex.value + 1) % props.images.length;
}

function goTo(i: number) {
  transitionName.value = i > currentIndex.value ? 'slide-left' : 'slide-right';
  currentIndex.value = i;
}

function onTouchStart(e: TouchEvent) {
  touchStartX = e.changedTouches[0].clientX;
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  if (Math.abs(dx) > 40) {
    dx < 0 ? next() : prev();
  }
}

function checkMobile() {
  isMobile.value = window.innerWidth < 768;
}

onMounted(() => {
  checkMobile();
  window.addEventListener('resize', checkMobile);
  if (props.autoplay && props.images.length > 1) {
    autoplayTimer = setInterval(next, props.autoplayInterval);
  }
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
  if (autoplayTimer) clearInterval(autoplayTimer);
});
</script>

<style scoped>
.car-carousel {
  position: relative;
  width: 100%;
  border-radius: 16px;
  background: #f0f0f4;
  user-select: none;
}

/* Трек — фиксированная высота, overflow скрывает уходящий слайд */
.car-carousel__track {
  position: relative;
  width: 100%;
  height: v-bind(trackHeight);
  overflow: hidden;
  border-radius: 16px;
}

/* Слайд абсолютно занимает весь трек */
.car-carousel__slide {
  position: absolute;
  inset: 0;
}

/* v-img заполняет слайд полностью */
.car-carousel__image {
  width: 100% !important;
  height: 100% !important;
  transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.car-carousel:hover .car-carousel__image {
  transform: scale(1.03);
}

.car-carousel__placeholder,
.car-carousel__fallback {
  width: 100%;
  height: 100%;
  background: #f0f0f4;
}

.car-carousel__gradient {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 80px;
  background: linear-gradient(to top, rgba(0,0,0,0.35) 0%, transparent 100%);
  pointer-events: none;
}

/* Arrows */
.car-carousel__btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 12px rgba(0,0,0,0.18);
  color: #333;
  transition: all 0.2s ease;
  z-index: 10;
}
.car-carousel__btn:hover {
  background: white;
  box-shadow: 0 4px 20px rgba(0,0,0,0.25);
  transform: translateY(-50%) scale(1.08);
}
.car-carousel__btn--prev { left: 10px; }
.car-carousel__btn--next { right: 10px; }

/* Dots */
.car-carousel__dots {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 5px;
  z-index: 10;
}
.car-carousel__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  border: none;
  background: rgba(255,255,255,0.5);
  cursor: pointer;
  transition: all 0.25s ease;
  padding: 0;
}
.car-carousel__dot--active {
  background: white;
  width: 18px;
  border-radius: 3px;
}

/* Counter */
.car-carousel__counter {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.45);
  backdrop-filter: blur(4px);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
  z-index: 10;
  letter-spacing: 0.04em;
}

/* Slide transitions — без mode="out-in", оба слайда одновременно */
.slide-left-enter-active,
.slide-left-leave-active,
.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.35s cubic-bezier(0.4, 0, 0.2, 1),
  opacity   0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from  { transform: translateX(100%);  opacity: 0; }
.slide-left-leave-to    { transform: translateX(-100%); opacity: 0; }
.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to   { transform: translateX(100%);  opacity: 0; }

/* Fade for buttons */
.fade-btn-enter-active,
.fade-btn-leave-active { transition: opacity 0.2s ease; }
.fade-btn-enter-from,
.fade-btn-leave-to     { opacity: 0; }
</style>
