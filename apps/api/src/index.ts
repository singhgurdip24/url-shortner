import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redis } from "./lib/redis.js";
import { config } from "./lib/config.js";
import { shortenRouter } from "./routes/shorten.js";
import { statsRouter } from "./routes/stats.js";
import { redirectRouter } from "./routes/redirect.js";

const app = express();

app.use(helmet());
app.use(cors({ origin: config.allowedOrigin }));
app.use(express.json());

app.use(
  "/api/shorten",
  rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args: string[]) => redis.call(...args),
    }),
  })
);

app.use("/api", shortenRouter);
app.use("/api", statsRouter);
app.use("/", redirectRouter);

app.listen(config.port, "0.0.0.0", () => {
  console.log(`[API] Listening on http://0.0.0.0:${config.port}`);
});

process.on("SIGTERM", async () => {
  await redis.quit();
  process.exit(0);
});

process.on("SIGINT", async () => {
  await redis.quit();
  process.exit(0);
});
