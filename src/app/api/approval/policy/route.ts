import { readApprovalPolicyQuerySchema, upsertApprovalPolicySchema } from "@/features/approval/schemas";
import { readApprovalPolicy, upsertApprovalPolicy } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = readApprovalPolicyQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const result = await readApprovalPolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

export async function PUT(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = upsertApprovalPolicySchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await upsertApprovalPolicy(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        attendanceApproverRole: parsed.data.attendanceApproverRole,
        leaveApproverRole: parsed.data.leaveApproverRole,
        payrollApproverRole: parsed.data.payrollApproverRole
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
