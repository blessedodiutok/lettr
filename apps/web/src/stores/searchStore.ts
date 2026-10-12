// File: apps/web/src/stores/searchStore.ts
// Zustand 5 store for the listings search/filter state

"use client";

import { create } from "zustand";

export interface SearchFilters {
  state: string;
  lga: string;
  neighbourhood: string;
  propertyType: string;
  minRent: string;
  maxRent: string;
  bedrooms: string;
  isFurnished: boolean | null;
  isServiced: boolean | null;
  sortBy: string;
}

interface SearchState {
  filters: SearchFilters;
  isMapView: boolean;
  setFilter: <K extends keyof SearchFilters>(
    key: K,
    value: SearchFilters[K],
  ) => void;
  resetFilters: () => void;
  toggleMapView: () => void;
  setMapView: (value: boolean) => void;
}

const defaultFilters: SearchFilters = {
  state: "",
  lga: "",
  neighbourhood: "",
  propertyType: "",
  minRent: "",
  maxRent: "",
  bedrooms: "",
  isFurnished: null,
  isServiced: null,
  sortBy: "popular",
};

export const useSearchStore = create<SearchState>((set) => ({
  filters: defaultFilters,
  isMapView: false,

  setFilter: (key, value) =>
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    })),

  resetFilters: () => set({ filters: defaultFilters }),

  toggleMapView: () => set((state) => ({ isMapView: !state.isMapView })),

  setMapView: (value) => set({ isMapView: value }),
}));
