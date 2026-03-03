import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Vehicle } from './vehicles';

export interface BookingDetails {
  pickupLocation: string;
  dropoffLocation: string;
  date: string | null;
  time: string | null;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
}

export interface AddonOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  pricePerDay: number;
  selected: boolean;
}

export type PaymentMethod = 'online' | 'delivery';

// Типы для API
export interface LocationDto {
  id: number;
  name: string;
  city: string;
  country: string;
}

export interface PriceBreakdown {
  days: number;
  pricePerDay: number;
  baseAmount: number;
  addOnItems: Array<{ name: string; pricePerDay: number; total: number }>;
  addOnsAmount: number;
  serviceFee: number;
  totalAmount: number;
  currency: string;
}

const API_BASE = 'http://localhost:8081';

export const useBookingStore = defineStore('booking', () => {
  const selectedVehicle = ref<Vehicle | null>(null);

  const bookingDetails = ref<BookingDetails>({
    pickupLocation: '',
    dropoffLocation: '',
    date: null,
    time: null,
  });

  const personalInfo = ref<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
  });

  const addons = ref<AddonOption[]>([
    {
      id: 'insurance',
      title: 'Full Insurance',
      description: 'Comprehensive coverage for your peace of mind',
      icon: 'mdi-shield-check',
      pricePerDay: 25,
      selected: false,
    },
    {
      id: 'child-seat',
      title: 'Child Safety Seat',
      description: 'ISOFIX compatible child seat for ages 1–6',
      icon: 'mdi-car-child-seat',
      pricePerDay: 10,
      selected: false,
    },
    {
      id: 'gps',
      title: 'GPS Navigator',
      description: 'Premium GPS with real-time traffic updates',
      icon: 'mdi-crosshairs-gps',
      pricePerDay: 12,
      selected: false,
    },
  ]);

  const paymentMethod = ref<PaymentMethod>('online');
  const submitting = ref(false);
  const submitted = ref(false);
  const locations = ref<LocationDto[]>([]);
  const priceBreakdown = ref<PriceBreakdown | null>(null);

  const rentalDays = computed(() => {
    // TODO: вычислять по датам pickupDate и dropoffDate
    if (!bookingDetails.value.date) return 1;
    return 3;
  });

  const rentalRate = computed(() => {
    if (priceBreakdown.value) return priceBreakdown.value.baseAmount;
    if (!selectedVehicle.value) return 0;
    return selectedVehicle.value.pricePerDay * rentalDays.value;
  });

  const addonsTotal = computed(() => {
    if (priceBreakdown.value) return priceBreakdown.value.addOnsAmount || 0;
    return addons.value
      .filter((a: AddonOption) => a.selected)
      .reduce((sum: number, a: AddonOption) => sum + a.pricePerDay * rentalDays.value, 0);
  });

  const serviceFee = computed(() => {
    if (priceBreakdown.value) return priceBreakdown.value.serviceFee || 0;
    return Math.round(rentalRate.value * 0.05);
  });

  const totalAmount = computed(() => {
    if (priceBreakdown.value) return priceBreakdown.value.totalAmount;
    return rentalRate.value + addonsTotal.value + serviceFee.value;
  });

  const isPersonalInfoValid = computed(() => {
    const { fullName, email, phone } = personalInfo.value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return (
      fullName.trim().length >= 2 &&
      emailRegex.test(email) &&
      phone.trim().length >= 7
    );
  });

  const isBookingDetailsValid = computed(() => {
    return (
      bookingDetails.value.pickupLocation.trim().length > 0 &&
      bookingDetails.value.dropoffLocation.trim().length > 0
    );
  });

  const canSubmit = computed(() => {
    return (
      selectedVehicle.value !== null &&
      isPersonalInfoValid.value &&
      isBookingDetailsValid.value &&
      !submitting.value
    );
  });

  function toggleAddon(id: string) {
    const addon = addons.value.find((a: AddonOption) => a.id === id);
    if (addon) {
      addon.selected = !addon.selected;
    }
  }

  function setVehicle(vehicle: Vehicle) {
    selectedVehicle.value = vehicle;
  }

  function setBookingFromSearch(params: { pickupLocation: string; pickupDate: string | null; pickupTime: string | null }) {
    bookingDetails.value.pickupLocation = params.pickupLocation;
    bookingDetails.value.date = params.pickupDate;
    bookingDetails.value.time = params.pickupTime;
  }

  async function fetchLocations() {
    const res = await fetch(`${API_BASE}/api/v1/locations`);
    locations.value = await res.json();
  }

  async function fetchVehicleById(id: number) {
    const res = await fetch(`${API_BASE}/api/v1/vehicles/${id}`);
    selectedVehicle.value = await res.json();
  }

  async function createCustomer() {
    const res = await fetch(`${API_BASE}/api/v1/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(personalInfo.value),
    });
    return await res.json();
  }

  async function calculatePrice() {
    if (!selectedVehicle.value) return;
    const days = rentalDays.value;
    const addOns = addons.value.filter(a => a.selected).map(a => {
      if (a.id === 'insurance') return 'INSURANCE_PREMIUM';
      if (a.id === 'child-seat') return 'CHILD_SEAT';
      if (a.id === 'gps') return 'GPS';
      return '';
    }).filter(Boolean);
    const params = new URLSearchParams({
      pricePerDay: String(selectedVehicle.value.pricePerDay),
      days: String(days),
      currency: 'USD',
    });
    addOns.forEach(a => params.append('addOns', a));
    const res = await fetch(`${API_BASE}/api/v1/pricing/calculate?${params.toString()}`);
    priceBreakdown.value = await res.json();
  }

  async function createBooking(customerId: number) {
    if (!selectedVehicle.value) throw new Error('No vehicle selected');
    const addOns = addons.value.filter(a => a.selected).map(a => {
      if (a.id === 'insurance') return 'INSURANCE_PREMIUM';
      if (a.id === 'child-seat') return 'CHILD_SEAT';
      if (a.id === 'gps') return 'GPS';
      return '';
    }).filter(Boolean);
    const body = {
      vehicleId: selectedVehicle.value.id,
      customerId,
      pickupLocationId: Number(bookingDetails.value.pickupLocation),
      dropoffLocationId: Number(bookingDetails.value.dropoffLocation),
      pickupDate: bookingDetails.value.date,
      dropoffDate: bookingDetails.value.date, // TODO: добавить отдельное поле dropoffDate
      paymentMethod: paymentMethod.value === 'online' ? 'ONLINE' : 'ON_DELIVERY',
      addOns,
      currency: 'USD',
    };
    const res = await fetch(`${API_BASE}/api/v1/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json();
  }

  async function initiatePayment(bookingId: number) {
    const res = await fetch(`${API_BASE}/api/v1/payments/initiate/${bookingId}`, { method: 'POST' });
    return await res.json();
  }

  async function processPayment(bookingId: number, transactionId: string) {
    const res = await fetch(`${API_BASE}/api/v1/payments/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId, transactionId, success: true }),
    });
    return await res.json();
  }

  async function confirmBooking() {
    submitting.value = true;
    try {
      // 1. Создать клиента
      const customer = await createCustomer();
      // 2. Пересчитать стоимость
      await calculatePrice();
      // 3. Создать бронирование
      const booking = await createBooking(customer.id);
      // 4. Оплата (если online)
      if (paymentMethod.value === 'online') {
        await initiatePayment(booking.id);
        await processPayment(booking.id, 'txn_demo'); // transactionId должен быть реальным
      }
      submitted.value = true;
    } catch (e) {
      throw new Error('Booking failed');
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    selectedVehicle.value = null;
    bookingDetails.value = { pickupLocation: '', dropoffLocation: '', date: null, time: null };
    personalInfo.value = { fullName: '', email: '', phone: '' };
    addons.value.forEach((a: AddonOption) => (a.selected = false));
    paymentMethod.value = 'online';
    submitting.value = false;
    submitted.value = false;
  }

  return {
    selectedVehicle,
    bookingDetails,
    personalInfo,
    addons,
    paymentMethod,
    submitting,
    submitted,
    rentalDays,
    rentalRate,
    addonsTotal,
    serviceFee,
    totalAmount,
    isPersonalInfoValid,
    isBookingDetailsValid,
    canSubmit,
    toggleAddon,
    setVehicle,
    setBookingFromSearch,
    confirmBooking,
    reset,
    // Новое:
    locations,
    fetchLocations,
    fetchVehicleById,
    priceBreakdown,
    calculatePrice,
  };
});
