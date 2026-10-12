// File: apps/web/src/stores/paymentStore.ts
// Zustand 5 store for the 3-step payment flow state

"use client";

import { create } from "zustand";

type PaymentMethod = "card" | "bank_transfer" | "ussd";

interface PaymentBreakdown {
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  agentFeeSaved: number;
  totalAmount: number;
}

interface PaymentState {
  step: 1 | 2 | 3;
  listingId: string | null;
  paymentId: string | null;
  authorizationUrl: string | null;
  paystackReference: string | null;
  selectedMethod: PaymentMethod;
  breakdown: PaymentBreakdown | null;
  setStep: (step: 1 | 2 | 3) => void;
  setListing: (listingId: string) => void;
  setPaymentInitiated: (data: {
    paymentId: string;
    authorizationUrl: string;
    reference: string;
    breakdown: PaymentBreakdown;
  }) => void;
  setMethod: (method: PaymentMethod) => void;
  reset: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  step: 1,
  listingId: null,
  paymentId: null,
  authorizationUrl: null,
  paystackReference: null,
  selectedMethod: "card",
  breakdown: null,

  setStep: (step) => set({ step }),
  setListing: (listingId) => set({ listingId }),
  setPaymentInitiated: ({
    paymentId,
    authorizationUrl,
    reference,
    breakdown,
  }) =>
    set({
      paymentId,
      authorizationUrl,
      paystackReference: reference,
      breakdown,
    }),
  setMethod: (selectedMethod) => set({ selectedMethod }),
  reset: () =>
    set({
      step: 1,
      listingId: null,
      paymentId: null,
      authorizationUrl: null,
      paystackReference: null,
      selectedMethod: "card",
      breakdown: null,
    }),
}));
