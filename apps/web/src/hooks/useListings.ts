"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, errorMessage } from "../lib/api";
import { demoPlaceholderFile, IS_DEMO } from "../lib/demo";
import type { Listing, Paginated, Photo } from "../lib/types";
import { useAuthStore } from "../stores/authStore";
import { toast } from "../stores/toastStore";

export interface ListingFilters {
  q?: string;
  state?: string;
  propertyType?: string;
  minRent?: string;
  maxRent?: string;
  bedrooms?: string;
  isFurnished?: string;
  isServiced?: string;
  sortBy?: string;
  page?: string;
}

export const FILTER_KEYS: Array<keyof ListingFilters> = ["q", "state", "propertyType", "minRent", "maxRent", "bedrooms", "isFurnished", "isServiced", "sortBy", "page"];

export function toQueryString(filters: ListingFilters, extra: Record<string, string> = {}) {
  const params = new URLSearchParams();
  for (const key of FILTER_KEYS) {
    const value = filters[key];
    if (value) params.set(key, value);
  }
  for (const [key, value] of Object.entries(extra)) params.set(key, value);
  return params.toString();
}

export function useListingSearch(filters: ListingFilters, limit = 18) {
  const ready = useAuthStore((s) => s.status !== "loading");
  return useQuery({
    queryKey: ["listings", filters, limit],
    queryFn: () => api<Paginated<Listing> & { listings: Listing[] }>("get", `/api/listings?${toQueryString(filters, { limit: String(limit) })}`),
    placeholderData: keepPreviousData,
    // Wait for the session so saved hearts are correct on first paint.
    enabled: ready,
  });
}

export function useListing(id: string, initialData?: Listing) {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: ["listing", id],
    queryFn: () => api<Listing>("get", `/api/listings/${id}`),
    initialData,
    // Server-rendered data has no session (saved state), so refetch once signed in.
    initialDataUpdatedAt: 0,
    enabled: Boolean(id) && status !== "loading",
  });
}

export function useSavedListings() {
  return useQuery({
    queryKey: ["saved-listings"],
    queryFn: () => api<Array<{ savedAt: string; listing: Listing }>>("get", "/api/listings/tenant/saved"),
  });
}

export function useToggleSave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ listingId, saved }: { listingId: string; saved: boolean }) =>
      api(saved ? "delete" : "post", `/api/listings/${listingId}/save`),
    onSuccess: (_data, { saved }) => {
      toast.success(saved ? "Removed from saved homes" : "Saved — find it under Saved homes");
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["listing"] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

// ── Landlord ───────────────────────────────────────────────────────────────

export function useMyListings() {
  return useQuery({ queryKey: ["my-listings"], queryFn: () => api<Listing[]>("get", "/api/listings/landlord/mine") });
}

export function useMyListing(id: string) {
  return useQuery({ queryKey: ["my-listing", id], queryFn: () => api<Listing>("get", `/api/listings/landlord/mine/${id}`), enabled: Boolean(id) });
}

function useInvalidateMine() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["my-listings"] });
    queryClient.invalidateQueries({ queryKey: ["my-listing"] });
    queryClient.invalidateQueries({ queryKey: ["listing"] });
  };
}

export function useCreateListing() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (body: unknown) => api<Listing>("post", "/api/listings", body),
    onSuccess: invalidate,
  });
}

export function useUpdateListing(id: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (body: unknown) => api<Listing>("put", `/api/listings/${id}`, body),
    onSuccess: invalidate,
  });
}

export function useListingStatusAction() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "publish" | "archive" | "delete" }) =>
      action === "delete" ? api("delete", `/api/listings/${id}`) : api<Listing>("patch", `/api/listings/${id}/${action}`),
    onSuccess: (_data, { action }) => {
      toast.success({ publish: "Your listing is live", archive: "Listing taken off the market", delete: "Draft deleted" }[action]);
      invalidate();
    },
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useUploadPhotos(propertyId: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: async ({ files, onProgress }: { files: File[]; onProgress?: (percent: number) => void }) => {
      const form = new FormData();
      files.forEach((file) => form.append("photos", IS_DEMO ? demoPlaceholderFile() : file));
      return api<Photo[]>("post", `/api/uploads/photos/${propertyId}`, form, {
        onUploadProgress: (event) => event.total && onProgress?.(Math.round((event.loaded / event.total) * 100)),
        timeout: 120_000,
      });
    },
    onSuccess: invalidate,
  });
}

export function useReorderPhotos(propertyId: string) {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (photoIds: string[]) => api<Photo[]>("put", `/api/uploads/photos/${propertyId}/order`, { photoIds }),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  });
}

export function useDeletePhoto() {
  const invalidate = useInvalidateMine();
  return useMutation({
    mutationFn: (photoId: string) => api<Photo[]>("delete", `/api/uploads/photos/item/${photoId}`),
    onSuccess: invalidate,
    onError: (error) => toast.error(errorMessage(error)),
  });
}
