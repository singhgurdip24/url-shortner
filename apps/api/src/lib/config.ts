export const config = {
  port: parseInt(process.env.PORT ?? "3001", 10),
  allowedOrigin: process.env.ALLOWED_ORIGIN ?? "http://localhost:5173",
  baseUrl: process.env.BASE_URL ?? "http://localhost:3001",
  rateLimit: {
    windowMs: 60_000,
    max: 20,
  },
  shortCode: {
    length: 7,
  },
} as const;
