import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function createPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required to initialize PrismaClient.");
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "warn", "error"] : ["error"]
  });
}

export function getPrisma(): PrismaClient {
  const existing = globalThis.prismaGlobal;
  if (existing) {
    return existing;
  }

  const created = createPrismaClient();
  if (process.env.NODE_ENV !== "production") {
    globalThis.prismaGlobal = created;
  }

  return created;
}

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    const client = getPrisma();
    const value = (client as unknown as Record<PropertyKey, unknown>)[prop];
    if (typeof value === "function") {
      return (value as (...args: unknown[]) => unknown).bind(client);
    }
    return value;
  }
});
