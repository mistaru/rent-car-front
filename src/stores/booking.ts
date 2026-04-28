import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Vehicle } from './vehicles';
import api from "@/axios/api";


export interface BookingDetails {
  pickupLocation: number | null;
  dropoffLocation: number | null;
  pickupDate: string | null;
  pickupTime: string | null;
  dropoffDate: string | null;
  dropoffTime: string | null;
}

export interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  additionalInfo: string;
}

export interface AddonOption {
  id: string;
  title: string;
  description: string;
  icon: string;
  pricePerDay: number;
  selected: boolean;
  quantity: number;
  maxQuantity: number | null; // null = unlimited (e.g. documents/delivery)
  category: string;
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
  tierName: string | null;
  addOnItems: Array<{ name: string; code: string; pricePerDay: number; quantity: number; total: number }>;
  addOnsAmount: number;
  serviceFee: number;
  totalAmount: number;
  prepaymentAmount: number;
  currency: string;
}


export const useBookingStore = defineStore('booking', () => {
  const selectedVehicle = ref<Vehicle | null>(null);

  const bookingDetails = ref<BookingDetails>({
    pickupLocation: null,
    dropoffLocation: null,
    pickupDate: null,
    pickupTime: null,
    dropoffDate: null,
    dropoffTime: null,
  });

  const personalInfo = ref<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    additionalInfo: '',
  });

  const addons = ref<AddonOption[]>([]);

  const paymentMethod = ref<PaymentMethod>('delivery');
  const submitting = ref(false);
  const submitted = ref(false);
  const locations = ref<LocationDto[]>([]);
  const priceBreakdown = ref<PriceBreakdown | null>(null);

  /** Загружает доп. услуги из API (service_options) */
  async function fetchServiceOptions() {
    try {
      const data = await api.get<Array<{
        id: number; code: string; name: string; description: string;
        category: string; icon: string; pricePerDay: number;
        totalQuantity: number | null;
        availableQuantity: number | null;
      }>>('/api/v1/service-options/active');

      addons.value = data.map(opt => ({
        id: opt.code,
        title: opt.name,
        description: opt.description || '',
        icon: opt.icon || 'mdi-plus-box',
        pricePerDay: opt.pricePerDay,
        selected: false,
        quantity: 1,
        maxQuantity: opt.availableQuantity ?? opt.totalQuantity,
        category: opt.category || 'OTHER',
      }));
    } catch (e) {
      console.error('fetchServiceOptions error:', e);
    }
  }

  const rentalDays = computed(() => {
    const { pickupDate, dropoffDate } = bookingDetails.value;
    if (!pickupDate || !dropoffDate) return 1;
    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const diffMs = end.getTime() - start.getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days > 0 ? days : 1;
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
      .reduce((sum: number, a: AddonOption) => sum + a.pricePerDay * a.quantity * rentalDays.value, 0);
  });

  /** Доп. услуги, сгруппированные по категориям */
  const addonsByCategory = computed(() => {
    const categoryMeta: Record<string, { label: string; icon: string; order: number }> = {
      EQUIPMENT: { label: 'Camping Equipment', icon: 'mdi-tent', order: 1 },
      DOCUMENTS: { label: 'Border Documents', icon: 'mdi-file-document-outline', order: 2 },
      DELIVERY:  { label: 'Pick-up / Delivery', icon: 'mdi-truck-delivery-outline', order: 3 },
      OTHER:     { label: 'Other Services', icon: 'mdi-dots-horizontal', order: 4 },
    };
    const grouped: Record<string, { label: string; icon: string; order: number; items: AddonOption[] }> = {};
    for (const addon of addons.value) {
      const cat = addon.category || 'OTHER';
      if (!grouped[cat]) {
        const meta = categoryMeta[cat] || categoryMeta['OTHER'];
        grouped[cat] = { ...meta, items: [] };
      }
      grouped[cat].items.push(addon);
    }
    return Object.values(grouped).sort((a, b) => a.order - b.order);
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
      bookingDetails.value.pickupLocation !== null &&
      bookingDetails.value.dropoffLocation !== null
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
    if (!addon) return;

    // Prevent selecting if unavailable (maxQuantity === 0)
    if (!addon.selected && addon.maxQuantity === 0) return;

    const wasSelected = addon.selected;
    addon.selected = !addon.selected;
    if (!wasSelected) addon.quantity = 1;

    // DELIVERY — взаимоисключающие: при выборе одной delivery снимаются остальные
    if (addon.selected && addon.category === 'DELIVERY') {
      addons.value
        .filter((a: AddonOption) => a.category === 'DELIVERY' && a.id !== id)
        .forEach((a: AddonOption) => (a.selected = false));
    }
  }

  function setAddonQuantity(id: string, qty: number) {
    const addon = addons.value.find((a: AddonOption) => a.id === id);
    if (!addon) return;
    const max = addon.maxQuantity ?? 99;
    addon.quantity = Math.max(1, Math.min(qty, max));
    if (!addon.selected && addon.quantity >= 1) addon.selected = true;
  }

  function setVehicle(vehicle: Vehicle) {
    selectedVehicle.value = vehicle;
  }

  function setBookingFromSearch(params: { pickupLocation: number | null; pickupDate: string | null; pickupTime: string | null; dropoffDate?: string | null; dropoffTime?: string | null }) {
    bookingDetails.value.pickupLocation = params.pickupLocation;
    bookingDetails.value.pickupDate = params.pickupDate;
    bookingDetails.value.pickupTime = params.pickupTime;
    if (params.dropoffDate !== undefined) bookingDetails.value.dropoffDate = params.dropoffDate;
    if (params.dropoffTime !== undefined) bookingDetails.value.dropoffTime = params.dropoffTime;
  }

  async function fetchLocations() {
    locations.value = await api.get<LocationDto[]>('/api/v1/locations');
  }

  async function fetchVehicleById(id: number) {
    selectedVehicle.value = await api.get<Vehicle>('/api/v1/vehicles/'+ id);
  }

  async function createCustomer() {
    return await api.post<{
      id: number; fullName: string; email: string; phone: string;
      additionalInfo: string;}>(`/api/v1/customers`, personalInfo.value);
  }

  async function calculatePrice() {
    if (!selectedVehicle.value) return;
    const days = rentalDays.value;
    const selectedAddons = addons.value.filter(a => a.selected);
    const params = new URLSearchParams({
      days: String(days),
      currency: 'USD',
    });
    selectedAddons.forEach(a => {
      params.append('addOns', a.id);
      params.append('qty', String(a.quantity));
    });
    priceBreakdown.value = await api.get<PriceBreakdown>(`/api/v1/pricing/calculate/vehicle/${selectedVehicle.value.id}?${params.toString()}`);
  }

  async function createBooking(customerId: number) {
    if (!selectedVehicle.value) throw new Error('No vehicle selected');
    const selectedAddOns = addons.value.filter(a => a.selected).map(a => ({ code: a.id, quantity: a.quantity }));
    const body = {
      vehicleId: selectedVehicle.value.id,
      customerId,
      pickupLocationId: Number(bookingDetails.value.pickupLocation),
      dropoffLocationId: Number(bookingDetails.value.dropoffLocation),
      pickupDate: bookingDetails.value.pickupDate,
      dropoffDate: bookingDetails.value.dropoffDate,
      paymentMethod: paymentMethod.value === 'online' ? 'ONLINE' : 'ON_DELIVERY',
      addOns: selectedAddOns,
      currency: 'USD',
    };
    return await api.post<{id : number;}>(`/api/v1/bookings`, body);
  }

  async function initiatePayment(bookingId: number) {
    if (!bookingId) throw new Error('Booking ID is required for payment');
    return await api.post<{id: number; bookingId: number; method: string;
      status: string; amount: number;
      transactionId: string; createdAt: string;}>
    (`/api/v1/payments/initiate/${bookingId}`);
  }

  async function processPayment(bookingId: number, transactionId: string) {
    if (!bookingId) throw new Error('Booking ID is required for payment processing');
    const body = {
      bookingId: bookingId,
      transactionId: transactionId,
      success: true,
    };
    return await api.post<{id: number; bookingId: number; method: string;
      status: string; amount: number; transactionId: string; createdAt: string;}>
    (`/api/v1/payments/process`, body);
  }

  async function confirmBooking() {
    submitting.value = true;
    try {
      // 1. Создать клиента (или получить существующего)
      const customer = await createCustomer();
      if (!customer?.id) throw new Error('Failed to get customer ID');

      // 2. Пересчитать стоимость
      await calculatePrice();

      // 3. Создать бронирование
      const booking = await createBooking(customer.id);
      if (!booking?.id) throw new Error('Failed to get booking ID');

      // 4. Оплата (если online)
      if (paymentMethod.value === 'online') {
        try {
          await initiatePayment(booking.id);
          await processPayment(booking.id, 'txn_demo');
        } catch (payErr: any) {
          console.error('Payment failed:', payErr?.message || payErr);
          // Бронирование создано, в любом случае выдается id, чтобы можно было загрузить документы
        }
      }
      submitted.value = true;
      return booking.id;
    } catch (e: any) {
      console.error('Booking failed:', e?.message || e);
      throw new Error(e?.message || 'Booking failed');
    } finally {
      submitting.value = false;
    }
  }

  function reset() {
    selectedVehicle.value = null;
    bookingDetails.value = { pickupLocation: null, dropoffLocation: null, pickupDate: null, pickupTime: null, dropoffDate: null, dropoffTime: null };
    personalInfo.value = { fullName: '', email: '', phone: '', additionalInfo: '' };
    addons.value.forEach((a: AddonOption) => (a.selected = false));
    paymentMethod.value = 'delivery';
    submitting.value = false;
    submitted.value = false;
  }

  return {
    selectedVehicle,
    bookingDetails,
    personalInfo,
    addons,
    addonsByCategory,
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
    setAddonQuantity,
    setVehicle,
    setBookingFromSearch,
    confirmBooking,
    reset,
    locations,
    fetchLocations,
    fetchVehicleById,
    fetchServiceOptions,
    priceBreakdown,
    calculatePrice,
  };
});
