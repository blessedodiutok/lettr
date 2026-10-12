"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import type { AppNotification, Bank, Me, PublicLandlord, Review, VerificationDocument } from "../lib/types";
import { useAuthStore } from "../stores/authStore";
import { toast } from "../stores/toastStore";

// ── Notifications ─────────────────────────────────────────────────────────

export function useNotifications() {
  const authenticated = useAuthStore((s) => s.status === "authenticated");
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ notifications: AppNotification[]; unreadCount: number }>("get", "/api/notifications"),
    enabled: authenticated,
    refetchInterval: 45_000,
  });
}

export function useMarkNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id?: string) => (id ? api("patch", `/api/notifications/${id}/read`) : api("patch", "/api/notifications/read-all")),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

// ── Profile ───────────────────────────────────────────────────────────────

export function useUpdateProfile() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (body: unknown) => api<Me>("put", "/api/users/me", body),
    onSuccess: (user) => {
      setUser(user);
      toast.success("Profile saved");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUploadAvatar() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return api<{ avatarUrl: string }>("post", "/api/users/me/avatar", form);
    },
    onSuccess: ({ avatarUrl }) => {
      if (user) setUser({ ...user, avatarUrl });
      toast.success("Photo updated");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useBanks(enabled: boolean) {
  return useQuery({ queryKey: ["banks"], queryFn: () => api<Bank[]>("get", "/api/users/me/banks"), enabled, staleTime: Infinity });
}

export function useSetBankAccount() {
  return useMutation({
    mutationFn: (body: { bankCode: string; accountNumber: string }) =>
      api<{ bankName: string; bankAccountName: string; bankAccountNumber: string }>("put", "/api/users/me/bank-account", body),
  });
}

export function usePublicLandlord(id: string) {
  return useQuery({ queryKey: ["landlord", id], queryFn: () => api<PublicLandlord>("get", `/api/users/landlords/${id}`) });
}

// ── Verification ──────────────────────────────────────────────────────────

export function useMyDocuments() {
  return useQuery({ queryKey: ["documents"], queryFn: () => api<VerificationDocument[]>("get", "/api/uploads/documents") });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, documentType, documentNumber }: { file: File; documentType: string; documentNumber?: string }) => {
      const form = new FormData();
      form.append("documentType", documentType);
      if (documentNumber) form.append("documentNumber", documentNumber);
      form.append("document", file);
      return api("post", "/api/uploads/document", form);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document submitted. We usually review within one working day.");
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

// ── Reviews ───────────────────────────────────────────────────────────────

export function useListingReviews(listingId: string) {
  return useQuery({ queryKey: ["reviews", listingId], queryFn: () => api<Review[]>("get", `/api/reviews/listing/${listingId}`) });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { listingId?: string; revieweeId: string; rating: number; title: string; body: string }) => api<Review>("post", "/api/reviews", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      toast.success("Thanks — your review is published");
    },
  });
}
