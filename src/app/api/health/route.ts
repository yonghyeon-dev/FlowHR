import packageJson from "../../../../package.json";

import { ok } from "@/lib/http";
import { prisma } from "@/lib/prisma";

type HealthStatus = "ok" | "degraded";
type DatabaseHealth = "up" | "down" | "skipped";

const APP_VERSION = typeof packageJson.version === "string" ? packageJson.version : "0.0.0";

function shouldCheckDatabase(): boolean {
  const dataAccessMode = (process.env.FLOWHR_DATA_ACCESS ?? "").trim().toLowerCase();
  if (dataAccessMode === "memory") {
    return false;
  }

  return Boolean(process.env.DATABASE_URL?.trim());
}

async function readDatabaseHealth(): Promise<{ status: HealthStatus; database: DatabaseHealth }> {
  if (!shouldCheckDatabase()) {
    return {
      status: "ok",
      database: "skipped"
    };
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: "ok",
      database: "up"
    };
  } catch {
    return {
      status: "degraded",
      database: "down"
    };
  }
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const databaseHealth = await readDatabaseHealth();

  return ok({
    status: databaseHealth.status,
    timestamp: new Date().toISOString(),
    version: APP_VERSION,
    environment: process.env.NODE_ENV ?? "unknown",
    database: databaseHealth.database
  });
}
