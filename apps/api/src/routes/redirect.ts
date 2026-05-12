import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { redis, REDIS_KEYS, REDIS_TTL } from "../lib/redis.js";
import { notFound } from "../lib/errors.js";
import { incrementClicks } from "../lib/links.js";

export const redirectRouter = Router();

redirectRouter.get("/:code", async (req, res) => {
  const { code } = req.params;

  const cached = await redis.get(REDIS_KEYS.shortCode(code));
  if (cached) {
    incrementClicks(code).catch((err) =>
      console.error("[redirect] Failed to increment clicks:", err)
    );
    return res.redirect(302, cached);
  }

  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) {
    return notFound(res, code);
  }

  await redis.set(REDIS_KEYS.shortCode(code), link.originalUrl, "EX", REDIS_TTL.shortCode);
  await incrementClicks(code);

  return res.redirect(302, link.originalUrl);
});
