// File: apps/web/src/hooks/useListings.ts
// TanStack Query hooks for listing data fetching

"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import type { SearchFilters } from "../stores/searchStore";

export interface Listing {
  id: string;
  annualRent: number;
  cautionFee: number;
  serviceCharge: number;
  legalFee: number;
  platformFee: number;
  agentFeeSaved: number;
  savings: number;
  status: string;
  availableFrom: string;
  isSaved: boolean;
  property: {
    id: string;
    title: string;
    description: string;
    propertyType: string;
    address: string;
    neighbourhood: string;
    lga: string;
    state: string;
    latitude: number | null;
    longitude: number | null;
    bedrooms: number;
    bathrooms: number;
    parkingSpaces: number;
    isFurnished: boolean;
    isServiced: boolean;
    photos: Array<{ url: string; isCover: boolean; altText: string | null }>;
    amenities: Array<{ type: string }>;
  };
  landlord: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
    landlordProfile: {
      verificationStatus: string;
      averageRating: number;
      totalReviews: number;
    } | null;
  };
}

interface ListingsResponse {
  listings: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/** Fetch paginated, filtered listings for the browse page */
export function useListings(filters: Partial<SearchFilters>, page = 1) {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.lga) params.set("lga", filters.lga);
  if (filters.neighbourhood) params.set("neighbourhood", filters.neighbourhood);
  if (filters.propertyType) params.set("propertyType", filters.propertyType);
  if (filters.minRent) params.set("minRent", filters.minRent);
  if (filters.maxRent) params.set("maxRent", filters.maxRent);
  if (filters.bedrooms) params.set("bedrooms", filters.bedrooms);
  if (filters.isFurnished !== null && filters.isFurnished !== undefined) {
    params.set("isFurnished", String(filters.isFurnished));
  }
  if (filters.sortBy) params.set("sortBy", filters.sortBy);
  params.set("page", String(page));
  params.set("limit", "20");

  return useQuery<ListingsResponse>({
    queryKey: ["listings", filters, page],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: ListingsResponse }>(
        `/api/listings?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/** Fetch a single listing by ID */
export function useListing(id: string) {
  return useQuery<Listing>({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Listing }>(
        `/api/listings/${id}`,
      );
      return data.data;
    },
    enabled: !!id,
  });
}

/** Fetch landlord's own listings */
export function useMyListings() {
  return useQuery<Listing[]>({
    queryKey: ["my-listings"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Listing[] }>(
        "/api/listings/landlord/mine",
      );
      return data.data;
    },
  });
}

/** Fetch saved listings for the current tenant */
export function useSavedListings() {
  return useQuery<Array<{ listing: Listing }>>({
    queryKey: ["saved-listings"],
    queryFn: async () => {
      const { data } = await apiClient.get<{
        data: Array<{ listing: Listing }>;
      }>("/api/listings/tenant/saved");
      return data.data;
    },
  });
}

/** Save or unsave a listing */
export function useToggleSave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      listingId,
      isSaved,
    }: {
      listingId: string;
      isSaved: boolean;
    }) => {
      if (isSaved) {
        await apiClient.delete(`/api/listings/${listingId}/save`);
      } else {
        await apiClient.post(`/api/listings/${listingId}/save`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listings"] });
      queryClient.invalidateQueries({ queryKey: ["saved-listings"] });
    },
  });
}

/** Fetch map-optimised listing pins */
export function useMapListings(filters: Partial<SearchFilters>) {
  const params = new URLSearchParams();
  if (filters.state) params.set("state", filters.state);
  if (filters.lga) params.set("lga", filters.lga);

  return useQuery({
    queryKey: ["map-listings", filters],
    queryFn: async () => {
      const { data } = await apiClient.get(
        `/api/listings/map?${params.toString()}`,
      );
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}
