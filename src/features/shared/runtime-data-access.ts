import type { DataAccess } from "@/features/shared/data-access";
import { memoryDataAccess } from "@/features/shared/memory-data-access";
import { prismaDataAccess } from "@/features/shared/prisma-data-access";

export function getRuntimeDataAccess(): DataAccess {
  const mode = process.env.FLOWHR_DATA_ACCESS?.toLowerCase();
  if (mode === "memory") {
    return memoryDataAccess;
  }
  return prismaDataAccess;
}
