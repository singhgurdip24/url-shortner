import { useState } from "react";
import type { ShortenResponse, StatsResponse } from "@url-shortener/shared";
import { shortenUrl, fetchStats } from "../api/client.ts";

interface State {
  isLoading: boolean;
  result: ShortenResponse | null;
  stats: StatsResponse | null;
  statsError: string | null;
}

const initialState: State = {
  isLoading: false,
  result: null,
  stats: null,
  statsError: null,
};

export function useUrlShortener() {
  const [state, setState] = useState<State>(initialState);

  const handleShorten = async (url: string) => {
    setState({ ...initialState, isLoading: true });
    try {
      const result = await shortenUrl(url);
      setState({ ...initialState, result });
    } catch {
      setState(initialState);
    }
  };

  const handleFetchStats = async (code: string) => {
    setState((s) => ({ ...s, stats: null, statsError: null }));
    try {
      const stats = await fetchStats(code);
      setState((s) => ({ ...s, stats }));
    } catch (err) {
      setState((s) => ({
        ...s,
        statsError: err instanceof Error ? err.message : "Failed to load stats",
      }));
    }
  };

  return { ...state, handleShorten, handleFetchStats };
}
