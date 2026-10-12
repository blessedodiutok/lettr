// File: apps/web/src/hooks/useReviews.ts
"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";

export interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  isVerified: boolean;
  createdAt: string;
  reviewer: { firstName: string; lastName: string; avatarUrl: string | null };
}

export function useListingReviews(listingId: string) {
  return useQuery<Review[]>({
    queryKey: ["reviews", "listing", listingId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Review[] }>(
        `/api/reviews/listing/${listingId}`,
      );
      return data.data;
    },
    enabled: !!listingId,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      listingId?: string;
      revieweeId: string;
      rating: number;
      title: string;
      body: string;
    }) => {
      const { data } = await apiClient.post("/api/reviews", input);
      return data.data;
    },
    onSuccess: (_data, variables) => {
      if (variables.listingId) {
        queryClient.invalidateQueries({
          queryKey: ["reviews", "listing", variables.listingId],
        });
      }
    },
  });
}
