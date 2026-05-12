import { prisma } from "./prisma.js";

export function incrementClicks(code: string): Promise<void> {
  return prisma.link
    .update({ where: { code }, data: { clicks: { increment: 1 } } })
    .then(() => undefined);
}
