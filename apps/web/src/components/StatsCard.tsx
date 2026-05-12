import React from "react";
import type { StatsResponse } from "@url-shortener/shared";

interface Props {
  stats: StatsResponse;
}

export function StatsCard({ stats }: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        Stats for /{stats.code}
      </p>
      <div className="flex items-center gap-3">
        <div className="rounded-lg bg-indigo-50 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-indigo-600">{stats.clicks}</p>
          <p className="text-xs text-gray-500">clicks</p>
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-xs text-gray-500">Original URL</p>
          <a
            href={stats.originalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block truncate text-sm text-gray-700 hover:underline"
          >
            {stats.originalUrl}
          </a>
          <p className="text-xs text-gray-400">
            Created {new Date(stats.createdAt).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
