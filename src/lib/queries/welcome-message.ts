"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WelcomeMessageConfig } from "@/lib/types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return body as T;
}

export function useWelcomeMessageConfig() {
  return useQuery({
    queryKey: ["welcomeMessageConfig"],
    queryFn: () => fetchJson<{ config: WelcomeMessageConfig }>(`/api/lydia/welcome-message`),
    select: (data) => data.config,
    enabled: LYDIA_API_ENABLED,
    retry: false,
    staleTime: 60_000,
  });
}

export function useUpdateWelcomeMessageConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<WelcomeMessageConfig>) =>
      fetchJson<{ config: WelcomeMessageConfig }>(`/api/lydia/welcome-message`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcomeMessageConfig"] });
    },
  });
}
