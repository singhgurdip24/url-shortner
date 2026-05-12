import React from "react";
import { useUrlShortener } from "./hooks/useUrlShortener.ts";
import { ShortenForm } from "./components/ShortenForm.tsx";
import { ResultCard } from "./components/ResultCard.tsx";
import { StatsCard } from "./components/StatsCard.tsx";

export default function App() {
  const { isLoading, result, stats, statsError, handleShorten, handleFetchStats } =
    useUrlShortener();

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-lg px-4 py-20">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900">URL Shortener</h1>
          <p className="mt-2 text-sm text-gray-500">
            Paste a long URL and get a short link instantly.
          </p>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100 space-y-4">
          <ShortenForm onShorten={handleShorten} isLoading={isLoading} />

          {result && (
            <ResultCard result={result} onFetchStats={handleFetchStats} />
          )}

          {stats && <StatsCard stats={stats} />}

          {statsError && (
            <p role="alert" className="text-sm text-red-600">
              {statsError}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
