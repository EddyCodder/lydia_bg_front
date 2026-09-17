"use client";

import { useQuery } from "@tanstack/react-query";
import type { EvoPersonalInsights } from "@/lib/lydia-api/types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return body as T;
}

export function usePersonalInsights(params: { agentId?: string; from?: string; to?: string } = {}) {
  const query = new URLSearchParams();
  if (params.agentId) query.set("agentId", params.agentId);
  if (params.from) query.set("from", params.from);
  if (params.to) query.set("to", params.to);

  return useQuery({
    queryKey: ["personalInsights", params.agentId ?? "all", params.from ?? "", params.to ?? ""],
    queryFn: () => fetchJson<{ insights: EvoPersonalInsights }>(`/api/lydia/insights/personal?${query.toString()}`),
    select: (data) => data.insights,
    enabled: LYDIA_API_ENABLED,
    retry: false,
    refetchInterval: 30_000,
  });
}
