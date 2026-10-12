// File: apps/web/src/hooks/useMessages.ts
// TanStack Query hooks for inquiry/message threads

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";

export interface InquiryMessage {
  senderId: string;
  message: string;
  sentAt: string;
  isRead: boolean;
}

export interface InquiryThread {
  id: string;
  listingId: string;
  tenantId: string;
  landlordId: string;
  status: string;
  initialMessage: string;
  messages: InquiryMessage[];
  updatedAt: string;
  listing: {
    property: {
      title: string;
      neighbourhood: string;
      state: string;
      photos: Array<{ url: string; isCover: boolean }>;
    };
    annualRent: number;
  };
  tenant: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  landlord: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
  inspectionBooking?: {
    scheduledAt: string;
    isConfirmed: boolean;
    isCompleted: boolean;
  } | null;
}

/** Fetch all inquiry threads for the current user */
export function useMyInquiries() {
  return useQuery<InquiryThread[]>({
    queryKey: ["inquiries", "my"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: InquiryThread[] }>(
        "/api/inquiries/my",
      );
      return data.data;
    },
  });
}

/** Fetch a single inquiry thread by ID */
export function useInquiry(id: string) {
  return useQuery<InquiryThread>({
    queryKey: ["inquiry", id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: InquiryThread }>(
        `/api/inquiries/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
    refetchInterval: 10_000, // Poll every 10s for new messages
  });
}

/** Send a message in a thread */
export function useSendMessage(inquiryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (message: string) => {
      const { data } = await apiClient.post(
        `/api/inquiries/${inquiryId}/message`,
        { message },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry", inquiryId] });
      queryClient.invalidateQueries({ queryKey: ["inquiries", "my"] });
    },
  });
}

/** Create a new inquiry for a listing */
export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      listingId,
      message,
    }: {
      listingId: string;
      message: string;
    }) => {
      const { data } = await apiClient.post("/api/inquiries", {
        listingId,
        message,
      });
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiries", "my"] });
    },
  });
}

/** Schedule an inspection for an inquiry */
export function useScheduleInspection(inquiryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      scheduledAt,
      notes,
    }: {
      scheduledAt: string;
      notes?: string;
    }) => {
      const { data } = await apiClient.post(
        `/api/inquiries/${inquiryId}/inspection`,
        { scheduledAt, notes },
      );
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inquiry", inquiryId] });
    },
  });
}
