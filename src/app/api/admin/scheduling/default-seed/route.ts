import { z } from "zod";

import { seedDefaultWorkSchedulesForEmployee } from "@/features/scheduling/default-work-schedule-seed";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../../reports/shared";

const dateOnlySchema = z.string().trim().regex(/^\d{4}-\d{2}-\d{2}$/);

const seedDefaultScheduleSchema = z
  .object({
    employeeId: z.string().trim().min(1),
    fromDate: dateOnlySchema.optional(),
    toDate: dateOnlySchema.optional()
  })
  .refine(
    (value) =>
      (value.fromDate === undefined && value.toDate === undefined) ||
      (value.fromDate !== undefined && value.toDate !== undefined),
    {
      message: "fromDate and toDate must be provided together",
      path: ["fromDate"]
    }
  );

export async function POST(request: Request) {
  const auth = await requireAdmin(request, "admin.scheduling.default_seed");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = seedDefaultScheduleSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(parsed.data.employeeId);
  if (!employee) {
    return fail(404, "employee not found");
  }
  if (employee.organizationId !== auth.organizationId) {
    return fail(404, "employee not found");
  }

  const result = await seedDefaultWorkSchedulesForEmployee({
    dataAccess,
    employee,
    range:
      parsed.data.fromDate && parsed.data.toDate
        ? {
            fromDate: parsed.data.fromDate,
            toDate: parsed.data.toDate
          }
        : undefined
  });

  await dataAccess.audit.append({
    action: "scheduling.schedule.default_seeded",
    entityType: "Employee",
    entityId: employee.id,
    organizationId: auth.organizationId,
    actorRole: "admin",
    actorId: undefined,
    payload: {
      employeeId: employee.id,
      fromDate: result.fromDate,
      toDate: result.toDate,
      candidateCount: result.candidateCount,
      createdCount: result.createdCount,
      skippedOverlapCount: result.skippedOverlapCount,
      createdScheduleIds: result.createdScheduleIds
    }
  });

  return ok({ result });
}
