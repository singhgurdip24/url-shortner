import type { ShortenResponse, StatsResponse } from "@url-shortener/shared";

const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function apiFetch<T>(input: string, init?: RequestInit): Promise<T> {
  const res = await fetch(input, init);
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.message ?? "Request failed");
  }
  return res.json();
}

export function shortenUrl(url: string): Promise<ShortenResponse> {
  return apiFetch(`${API_BASE}/api/shorten`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
}

export function fetchStats(code: string): Promise<StatsResponse> {
  return apiFetch(`${API_BASE}/api/stats/${code}`);
}
