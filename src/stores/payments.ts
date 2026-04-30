import { defineStore } from 'pinia';
import { ref } from 'vue';
import { api } from '@/axios/api';
import type { PaymentDto, ProcessPaymentRequest } from '@/types/payment';

// Define a type for the creation request
export interface CreatePaymentRequest {
  bookingId: number | null;
  amount: number;
  method: string;
  status: string;
}

export const usePaymentStore = defineStore('payments', () => {
  const payments = ref<PaymentDto[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const currentPayment = ref<PaymentDto | null>(null);

  const fetchAllPayments = async () => {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.get<PaymentDto[]>('/api/v1/payments');
      payments.value = data;
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to fetch payments';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  // Updated to call the correct backend endpoint
  const initiatePayment = async (paymentData: CreatePaymentRequest) => {
    loading.value = true;
    error.value = null;
    try {
      if (!paymentData.bookingId) {
        throw new Error('Booking ID is required to initiate a payment.');
      }
      // Send request body expected by POST /api/v1/payments/initiate/{bookingId}
      const data = await api.post<PaymentDto>(
        `/api/v1/payments/initiate/${paymentData.bookingId}`,
        { amount: paymentData.amount }
      );
      currentPayment.value = data;
      await fetchAllPayments(); // Refresh list
      return data;
    } catch (err: any)
    {
      error.value = err.message || 'Failed to initiate payment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const processPayment = async (request: ProcessPaymentRequest) => {
    loading.value = true;
    error.value = null;
    try {
      const data = await api.post<PaymentDto>('/api/v1/payments/process', request);
      currentPayment.value = data;
      await fetchAllPayments(); // Refresh list
      return data;
    } catch (err: any) {
      error.value = err.message || 'Failed to process payment';
      throw err;
    } finally {
      loading.value = false;
    }
  };

  return {
    payments,
    loading,
    error,
    currentPayment,
    fetchAllPayments,
    initiatePayment,
    processPayment,
  };
});
