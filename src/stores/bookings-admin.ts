import { defineStore } from 'pinia';
import { ref } from 'vue';
import api from '@/axios/api';

export interface UpdateBookingData {
  pickupDate?: string;
  dropoffDate?: string;
  pickupLocationId?: number;
  dropoffLocationId?: number;
  status?: string;
  customerFullName?: string;
  customerEmail?: string;
  customerPhone?: string;
  customerAdditionalInfo?: string;
  managerComment?: string;
  addOns?: Array<{ code: string; quantity: number }>;
}

export interface BookingAdmin {
  id: number;
  vehicle: {
    id: number;
    brand: string;
    model: string;
    carClass: string;
    image: string;
  };
  customer: {
    id: number;
    fullName: string;
    email: string;
    phone: string;
  };
  pickupLocation: { id: number; name: string; city: string; country: string };
  dropoffLocation: { id: number; name: string; city: string; country: string };
  pickupDate: string;
  dropoffDate: string;
  days: number;
  pricePerDay: number;
  priceTierDescription: string | null;
  baseAmount: number;
  addOnsAmount: number;
  serviceFee: number;
  totalAmount: number;
  prepaymentAmount: number;
  prepaymentPaid: boolean;
  currency: string;
  status: string;
  paymentStatus: string;
  addOns: Array<{ code: string; name: string; pricePerDay: number; quantity: number }>;
  createdAt: string;
}

export interface BookingHistoryItem {
  id: number;
  bookingId: number;
  action: string;
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  comment: string | null;
  performedBy: string;
  createdAt: string;
}

export interface ServiceOptionItem {
  id: number;
  code: string;
  name: string;
  category: string;
  icon: string;
  pricePerDay: number;
  pricingType: string;
  totalQuantity: number | null;
  availableQuantity: number | null;
}

export const useBookingsAdminStore = defineStore('bookingsAdmin', () => {
  const bookings = ref<BookingAdmin[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const serviceOptions = ref<ServiceOptionItem[]>([]);

  async function fetchAllBookings() {
    loading.value = true;
    error.value = null;
    try {
      bookings.value = await api.get<BookingAdmin[]>('/api/v1/bookings');
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
    } finally {
      loading.value = false;
    }
  }

  async function cancelBooking(id: number) {
    try {
      await api.post(`/api/v1/bookings/${id}/cancel`);
      await fetchAllBookings();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
      throw e;
    }
  }

  async function updateBooking(id: number, data: UpdateBookingData) {
    try {
      await api.put(`/api/v1/bookings/${id}`, data);
      await fetchAllBookings();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
      throw e;
    }
  }

  async function fetchBookingHistory(bookingId: number): Promise<BookingHistoryItem[]> {
    try {
      return await api.get<BookingHistoryItem[]>(`/api/v1/bookings/${bookingId}/history`);
    } catch (e) {
      console.error('fetchBookingHistory error:', e);
      return [];
    }
  }

  async function fetchServiceOptions() {
    try {
      serviceOptions.value = await api.get<ServiceOptionItem[]>('/api/v1/service-options/active');
    } catch (e) {
      console.error('fetchServiceOptions error:', e);
    }
  }

  return {
    bookings,
    loading,
    error,
    serviceOptions,
    fetchAllBookings,
    cancelBooking,
    updateBooking,
    fetchBookingHistory,
    fetchServiceOptions,
  };
});

