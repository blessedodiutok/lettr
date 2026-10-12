"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import type { CheckoutSession, Payment, TenancyDetail, Tenancy } from "../lib/types";
import { toast } from "../stores/toastStore";

export function useMyPayments() {
  return useQuery({ queryKey: ["payments"], queryFn: () => api<Payment[]>("get", "/api/payments/my") });
}

export function useInitiatePayment() {
  return useMutation({
    mutationFn: (listingId: string) => api<CheckoutSession>("post", "/api/payments/initiate", { listingId }),
  });
}

/** Ask the API to confirm a payment with Paystack; polls until it settles. */
export function usePaymentStatus(paymentId: string | null) {
  return useQuery({
    queryKey: ["payment-status", paymentId],
    queryFn: () => api<Payment>("post", `/api/payments/${paymentId}/verify`),
    enabled: Boolean(paymentId),
    refetchInterval: (query) => (["PENDING", "PROCESSING"].includes(query.state.data?.status ?? "PENDING") ? 3000 : false),
  });
}

export function useSimulatePayment() {
  return useMutation({
    mutationFn: (paymentId: string) => api<Payment>("post", `/api/payments/${paymentId}/simulate-success`),
  });
}

export function useRaiseDispute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, reason }: { paymentId: string; reason: string }) => api("post", `/api/payments/${paymentId}/disputes`, { reason }),
    onSuccess: () => {
      toast.success("Dispute raised. The payout is paused while Lettr reviews it.");
      queryClient.invalidateQueries({ queryKey: ["tenancy"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

// ── Tenancies ─────────────────────────────────────────────────────────────

export function useMyTenancies() {
  return useQuery({ queryKey: ["tenancies"], queryFn: () => api<Tenancy[]>("get", "/api/tenancy/my") });
}

export function useTenancy(id: string) {
  return useQuery({ queryKey: ["tenancy", id], queryFn: () => api<TenancyDetail>("get", `/api/tenancy/${id}`), enabled: Boolean(id) });
}

const TENANCY_DONE = {
  sign: "Agreement signed",
  handover: "Handover recorded — the tenant has been asked to confirm",
  "confirm-move-in": "Move-in confirmed. Welcome home.",
  cancel: "Tenancy cancelled — your refund is on its way",
} as const;

export function useTenancyAction(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, reason }: { action: keyof typeof TENANCY_DONE; reason?: string }) =>
      api<TenancyDetail>("post", `/api/tenancy/${id}/${action}`, reason ? { reason } : {}),
    onSuccess: (tenancy, { action }) => {
      queryClient.setQueryData(["tenancy", id], tenancy);
      queryClient.invalidateQueries({ queryKey: ["tenancies"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["inquiries"] });
      toast.success(TENANCY_DONE[action]);
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}
