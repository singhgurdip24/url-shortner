import { Router } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { prisma } from "../lib/prisma.js";
import { redis, REDIS_KEYS, REDIS_TTL } from "../lib/redis.js";
import { config } from "../lib/config.js";
import type { ShortenResponse } from "@url-shortener/shared";

const bodySchema = z.object({
  url: z.string().url({ message: "Must be a valid URL" }).max(2048),
});

export const shortenRouter = Router();

shortenRouter.post("/shorten", async (req, res) => {
  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "INVALID_URL",
      message: parsed.error.errors[0].message,
    });
  }

  const { url } = parsed.data;
  const code = nanoid(config.shortCode.length);

  const link = await prisma.link.create({
    data: { code, originalUrl: url },
  });

  await redis.set(REDIS_KEYS.shortCode(code), url, "EX", REDIS_TTL.shortCode);

  const response: ShortenResponse = {
    code: link.code,
    shortUrl: `${config.baseUrl}/${link.code}`,
    originalUrl: link.originalUrl,
    createdAt: link.createdAt.toISOString(),
  };

  return res.status(201).json(response);
});
