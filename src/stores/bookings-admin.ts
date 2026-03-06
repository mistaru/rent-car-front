import { defineStore } from 'pinia';
import { ref } from 'vue';

const API_BASE = 'http://localhost:8081';

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
  addOns: string[];
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

export const useBookingsAdminStore = defineStore('bookingsAdmin', () => {
  const bookings = ref<BookingAdmin[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchAllBookings() {
    loading.value = true;
    error.value = null;
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings`);
      if (!res.ok) throw new Error('Ошибка загрузки бронирований');
      bookings.value = await res.json();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
    } finally {
      loading.value = false;
    }
  }

  async function cancelBooking(id: number) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${id}/cancel`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка отмены бронирования');
      }
      await fetchAllBookings();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
      throw e;
    }
  }

  async function updateBooking(id: number, data: UpdateBookingData) {
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Ошибка обновления бронирования');
      }
      await fetchAllBookings();
    } catch (e: any) {
      error.value = e.message || 'Ошибка';
      throw e;
    }
  }

  async function fetchBookingHistory(bookingId: number): Promise<BookingHistoryItem[]> {
    try {
      const res = await fetch(`${API_BASE}/api/v1/bookings/${bookingId}/history`);
      if (!res.ok) return [];
      return await res.json();
    } catch (e) {
      console.error('fetchBookingHistory error:', e);
      return [];
    }
  }

  return {
    bookings,
    loading,
    error,
    fetchAllBookings,
    cancelBooking,
    updateBooking,
    fetchBookingHistory,
  };
});

