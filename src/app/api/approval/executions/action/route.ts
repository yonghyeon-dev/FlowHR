import { applyApprovalExecutionActionSchema } from "@/features/approval/schemas";
import { applyApprovalExecutionAction } from "@/features/approval/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  let payload: unknown = {};
  const contentType = request.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    try {
      payload = await request.json();
    } catch {
      return fail(400, "invalid JSON body");
    }
  }

  const parsed = applyApprovalExecutionActionSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await applyApprovalExecutionAction(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        organizationId: parsed.data.organizationId,
        domain: parsed.data.domain,
        targetEntityType: parsed.data.targetEntityType,
        targetEntityId: parsed.data.targetEntityId,
        action: parsed.data.action
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
