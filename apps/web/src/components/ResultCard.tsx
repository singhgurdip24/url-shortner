import React, { useState } from "react";
import type { ShortenResponse } from "@url-shortener/shared";

interface Props {
  result: ShortenResponse;
  onFetchStats: (code: string) => void;
}

export function ResultCard({ result, onFetchStats }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(result.shortUrl);
      } else {
        const el = document.createElement("textarea");
        el.value = result.shortUrl;
        el.style.position = "fixed";
        el.style.opacity = "0";
        document.body.appendChild(el);
        el.select();
        document.execCommand("copy");
        document.body.removeChild(el);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // copy not supported
    }
  };

  return (
    <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-3">
      <p className="text-xs font-medium uppercase tracking-wide text-green-700">
        Short URL created
      </p>
      <div className="flex items-center gap-2">
        <a
          href={result.shortUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 truncate text-sm font-medium text-indigo-600 hover:underline"
        >
          {result.shortUrl}
        </a>
        <button
          onClick={handleCopy}
          className="shrink-0 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
        <button
          onClick={() => onFetchStats(result.code)}
          className="shrink-0 rounded-md bg-white border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Stats
        </button>
      </div>
      <p className="text-xs text-gray-400">
        Created {new Date(result.createdAt).toLocaleString()}
      </p>
    </div>
  );
}
