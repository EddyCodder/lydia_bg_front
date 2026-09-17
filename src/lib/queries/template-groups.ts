"use client";

import { useQuery } from "@tanstack/react-query";
import type { TemplateGroup } from "@/lib/types";
import { LYDIA_API_ENABLED } from "@/lib/lydia-api/config";

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, init);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error ?? `Error ${res.status}`);
  }
  return body as T;
}

export function useTemplateGroups() {
  return useQuery({
    queryKey: ["templateGroups"],
    queryFn: () => fetchJson<{ groups: TemplateGroup[] }>(`/api/lydia/template-groups`),
    select: (data) => data.groups,
    enabled: LYDIA_API_ENABLED,
    retry: false,
    staleTime: 60_000,
  });
}
