import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { notFound } from "../lib/errors.js";
import type { StatsResponse } from "@url-shortener/shared";

export const statsRouter = Router();

statsRouter.get("/stats/:code", async (req, res) => {
  const { code } = req.params;

  const link = await prisma.link.findUnique({ where: { code } });
  if (!link) {
    return notFound(res, code);
  }

  const response: StatsResponse = {
    code: link.code,
    originalUrl: link.originalUrl,
    clicks: link.clicks,
    createdAt: link.createdAt.toISOString(),
  };

  return res.json(response);
});
