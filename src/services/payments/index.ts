/**
 * Payment Integration Boundary
 *
 * Separates Payment Status from Order Fulfilment Status.
 * Supports:
 * - Online payment (Razorpay / India gateway sandbox adapter)
 * - Pay-at-shop (cash/UPI at shop counter, recorded by vendor upon handover)
 */

import { PaymentMethod, PaymentStatus } from '../../types/index.ts';

export interface PaymentSessionRequest {
  orderId: string;
  amountMinor: number;
  currency: 'INR';
  customerEmail: string;
}

export interface PaymentSessionResponse {
  sessionId: string;
  provider: 'razorpay_sandbox' | 'mock';
  keyId?: string;
  orderId: string;
  amountMinor: number;
  currency: 'INR';
}

export interface PaymentVerificationResult {
  isVerified: boolean;
  paymentStatus: PaymentStatus;
  providerPaymentId?: string;
  errorMessage?: string;
}

const getPaymentMode = (): 'mock' | 'razorpay_sandbox' => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_PAYMENT_MODE) {
    return import.meta.env.VITE_PAYMENT_MODE as 'mock' | 'razorpay_sandbox';
  }
  return 'mock';
};

export const paymentConfig = {
  mode: getPaymentMode(),
  currency: 'INR',
  isSandbox: true,
};

/**
 * Validates state transition legality for payments.
 */
export function canTransitionPaymentStatus(
  current: PaymentStatus,
  next: PaymentStatus,
  method: PaymentMethod
): boolean {
  if (method === 'pay_at_shop') {
    if (current === 'pay_at_shop_due' && next === 'pay_at_shop_paid') return true;
    if (next === 'refunded') return current === 'pay_at_shop_paid';
    return false;
  }

  // Online payments
  const allowedTransitions: Record<PaymentStatus, PaymentStatus[]> = {
    not_required_yet: ['pending', 'failed'],
    pending: ['paid', 'failed'],
    paid: ['refunded'],
    failed: ['pending'],
    refunded: [],
    pay_at_shop_due: [],
    pay_at_shop_paid: [],
  };

  return allowedTransitions[current]?.includes(next) ?? false;
}
