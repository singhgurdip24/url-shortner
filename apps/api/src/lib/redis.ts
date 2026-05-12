import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";

export const redis = new Redis(REDIS_URL, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false,
});

redis.on("error", (err) => {
  console.error("[Redis] Connection error:", err);
});

redis.on("connect", () => {
  console.log("[Redis] Connected");
});

export const REDIS_KEYS = {
  shortCode: (code: string) => `short:${code}`,
} as const;

export const REDIS_TTL = {
  shortCode: 60 * 60 * 24,
} as const;
