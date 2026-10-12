"use client";

import type { TenancyAgreement } from "@lettr/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "../lib/axios";

export type Tenancy = Omit<TenancyAgreement, "listing"> & {
  listing: NonNullable<TenancyAgreement["listing"]> & {
    property: NonNullable<TenancyAgreement["listing"]>["property"] & {
      neighbourhood: string;
      state: string;
    };
  };
};

async function fetchMyTenancies(): Promise<Tenancy[]> {
  const { data } = await apiClient.get<{ data: Tenancy[] }>("/api/tenancy/my");
  return data.data;
}

export function useMyTenancy() {
  return useQuery<Tenancy | null>({
    queryKey: ["my-tenancy"],
    queryFn: async () => (await fetchMyTenancies())[0] ?? null,
  });
}

export function useMyLandlordTenancies() {
  return useQuery<Tenancy[]>({
    queryKey: ["my-landlord-tenancies"],
    queryFn: fetchMyTenancies,
  });
}

export function useTenancy(id: string) {
  return useQuery<Tenancy>({
    queryKey: ["tenancy", id],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: Tenancy }>(`/api/tenancy/${id}`);
      return data.data;
    },
    enabled: Boolean(id),
  });
}

export function useConfirmHandover() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tenancyId: string) => {
      const { data } = await apiClient.post<{ data: Tenancy }>(`/api/tenancy/${tenancyId}/handover`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-tenancy"] });
      queryClient.invalidateQueries({ queryKey: ["my-landlord-tenancies"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    },
  });
}
