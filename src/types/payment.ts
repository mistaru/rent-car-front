// Matches Java PaymentTransactionStatus enum
export type PaymentStatus = 'INITIATED' | 'PAID' | 'FAILED';

// Matches Java PaymentMethod enum
export type PaymentMethod = 'ONLINE' | 'ON_DELIVERY';

/**
 * Mirror of Java PaymentDto
 */
export interface PaymentDto {
  id: number;
  bookingId: number;
  method: PaymentMethod;
  status: PaymentStatus;
  amount: number;
  transactionId: string | null;
  createdAt: string;
}

/**
 * Mirror of Java ProcessPaymentRequest
 */
export interface ProcessPaymentRequest {
  paymentId: number;
  bookingId: number; // Added to match backend validation
  paymentMethod: PaymentMethod;
  transactionId?: string;
}
