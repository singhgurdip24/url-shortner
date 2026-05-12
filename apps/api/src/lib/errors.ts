import type { Response } from "express";

export function notFound(res: Response, code: string) {
  return res.status(404).json({
    error: "NOT_FOUND",
    message: `Short code '${code}' not found`,
  });
}
