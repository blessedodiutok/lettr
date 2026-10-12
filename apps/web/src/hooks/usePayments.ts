// File: apps/web/src/hooks/usePayments.ts
"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { usePaymentStore } from "../stores/paymentStore";

export function useInitiatePayment() {
  const { setPaymentInitiated, setStep } = usePaymentStore();

  return useMutation({
    mutationFn: async (listingId: string) => {
      const { data } = await apiClient.post<{
        data: {
          paymentId: string;
          authorizationUrl: string;
          reference: string;
          breakdown: {
            annualRent: number;
            cautionFee: number;
            serviceCharge: number;
            legalFee: number;
            platformFee: number;
            agentFeeSaved: number;
            totalAmount: number;
          };
        };
      }>("/api/payments/initiate", { listingId });
      return data.data;
    },
    onSuccess: (data) => {
      setPaymentInitiated({
        paymentId: data.paymentId,
        authorizationUrl: data.authorizationUrl,
        reference: data.reference,
        breakdown: data.breakdown,
      });
      setStep(2);
    },
  });
}

export function useMyPayments() {
  return useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/payments/my");
      return data.data;
    },
  });
}
