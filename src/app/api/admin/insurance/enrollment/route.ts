import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const insuranceTypeSchema = z.enum(["NPS", "NHI", "EI", "WCI"]);
const insuranceStatusSchema = z.enum(["ENROLLED", "NOT_ENROLLED", "PENDING"]);

const enrollmentQuerySchema = z.object({
  employeeId: z.string().trim().min(1)
});

const upsertEnrollmentSchema = z.object({
  employeeId: z.string().trim().min(1),
  type: insuranceTypeSchema,
  status: insuranceStatusSchema,
  enrolledAt: z.string().trim().min(1).optional()
});

type EnrollmentResponseItem = {
  type: "NPS" | "NHI" | "EI" | "WCI";
  status: "ENROLLED" | "NOT_ENROLLED" | "PENDING";
  enrolledAt?: string;
};

function toEnrollmentResponseItem(input: {
  type: "NPS" | "NHI" | "EI" | "WCI";
  status: "ENROLLED" | "NOT_ENROLLED" | "PENDING";
  enrolledAt: Date | null;
}): EnrollmentResponseItem {
  return {
    type: input.type,
    status: input.status,
    ...(input.enrolledAt ? { enrolledAt: input.enrolledAt.toISOString() } : {})
  };
}

function parseOptionalDate(value: string | undefined) {
  if (value === undefined) {
    return { ok: true as const, date: null };
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return { ok: false as const };
  }
  return { ok: true as const, date: parsed };
}

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "admin.insurance.enrollment.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.insurance.enrollment.forbidden", { reason: "admin_required" })
    };
  }
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.insurance.enrollment.organization_id_required")
    };
  }
  return {
    ok: true as const,
    organizationId
  };
}

async function requireEmployeeInOrganization(employeeId: string, organizationId: string) {
  const employee = await getRuntimeDataAccess().employees.findById(employeeId);
  if (!employee) {
    return {
      ok: false as const,
      response: fail(404, "admin.insurance.enrollment.employee_not_found")
    };
  }
  if (employee.organizationId !== organizationId) {
    return {
      ok: false as const,
      response: fail(403, "admin.insurance.enrollment.forbidden", { reason: "organization_mismatch" })
    };
  }
  return { ok: true as const };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = enrollmentQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const employeeCheck = await requireEmployeeInOrganization(parsed.data.employeeId, auth.organizationId);
  if (!employeeCheck.ok) {
    return employeeCheck.response;
  }

  const enrollments = await getRuntimeDataAccess().insuranceEnrollments.listByEmployee(parsed.data.employeeId);
  return ok({
    employeeId: parsed.data.employeeId,
    enrollments: enrollments.map((row) =>
      toEnrollmentResponseItem({
        type: row.type,
        status: row.status,
        enrolledAt: row.enrolledAt
      })
    )
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = upsertEnrollmentSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const enrolledAt = parseOptionalDate(parsed.data.enrolledAt);
  if (!enrolledAt.ok) {
    return fail(400, "invalid payload", {
      fieldErrors: {
        enrolledAt: ["enrolledAt must be a valid datetime string"]
      }
    });
  }

  const employeeCheck = await requireEmployeeInOrganization(parsed.data.employeeId, auth.organizationId);
  if (!employeeCheck.ok) {
    return employeeCheck.response;
  }

  const enrollment = await getRuntimeDataAccess().insuranceEnrollments.upsert({
    employeeId: parsed.data.employeeId,
    type: parsed.data.type,
    status: parsed.data.status,
    enrolledAt: enrolledAt.date
  });

  return ok({
    employeeId: parsed.data.employeeId,
    enrollment: toEnrollmentResponseItem({
      type: enrollment.type,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt
    })
  });
}
