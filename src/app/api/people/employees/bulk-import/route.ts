import { z } from "zod";

import { seedDefaultWorkSchedulesForEmployee } from "@/features/scheduling/default-work-schedule-seed";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const bulkImportSchema = z.object({
  employees: z
    .array(
      z.object({
        name: z.string().min(1).max(100),
        email: z.string().email(),
        departmentId: z.string().min(1).nullable().optional(),
        positionId: z.string().min(1).nullable().optional(),
        hireDate: z.string().min(1)
      })
    )
    .min(1)
});

function normalizeNullableText(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().startsWith(value);
}

function createBulkEmployeeId(batchId: string, index: number) {
  return `EMP-BULK-${batchId}-${String(index + 1).padStart(3, "0")}`;
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (actor?.role !== "admin") {
    return fail(403, "employee.bulk_import.forbidden", {
      reason: "admin_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = bulkImportSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const batchId = `${Date.now()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  let imported = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let index = 0; index < parsed.data.employees.length; index += 1) {
    const employee = parsed.data.employees[index]!;
    const row = index + 1;

    const hireDate = employee.hireDate.trim();
    if (!isValidDateOnly(hireDate)) {
      failed += 1;
      errors.push(`row ${row}: invalid hireDate (${employee.hireDate})`);
      continue;
    }

    try {
      const created = await dataAccess.employees.create({
        id: createBulkEmployeeId(batchId, index),
        organizationId: actor.organizationId,
        departmentId: normalizeNullableText(employee.departmentId),
        positionId: normalizeNullableText(employee.positionId),
        name: employee.name.trim(),
        email: employee.email.trim().toLowerCase(),
        active: true
      });
      await seedDefaultWorkSchedulesForEmployee({
        dataAccess,
        employee: created
      });
      imported += 1;
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : "unknown error";
      errors.push(`row ${row}: ${message}`);
    }
  }

  return ok({ imported, failed, errors });
}
