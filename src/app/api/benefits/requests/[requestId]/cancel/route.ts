import { cancelBenefitRequestSchema } from "@/features/benefits/schemas";
import { cancelBenefitRequest, findBenefitRequest } from "@/features/benefits/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

function canSubmitBenefits(role: string | null | undefined) {
  return role === "employee";
}

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "benefits.request.cancel.unauthorized");
  }
  if (!canSubmitBenefits(actor.role)) {
    return fail(403, "benefits.request.cancel.forbidden", {
      reason: "employee_required"
    });
  }

  const { requestId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    payload = {};
  }

  const parsed = cancelBenefitRequestSchema.safeParse({
    requestId,
    ...(payload as Record<string, unknown>)
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const existing = await findBenefitRequest(parsed.data.requestId);
  if (!existing) {
    return fail(404, "benefits.request.not_found");
  }
  if (existing.employeeId !== actor.id) {
    return fail(403, "benefits.request.cancel.forbidden", {
      reason: "owner_required"
    });
  }
  if (existing.status !== "SUBMITTED") {
    return fail(409, "benefits.request.cancel.invalid_state", {
      currentStatus: existing.status
    });
  }

  const updated = await cancelBenefitRequest({
    requestId: parsed.data.requestId,
    actorId: actor.id,
    cancelNote: parsed.data.cancelNote
  });
  if (!updated) {
    return fail(409, "benefits.request.cancel.invalid_state");
  }

  return ok({ request: updated });
}
