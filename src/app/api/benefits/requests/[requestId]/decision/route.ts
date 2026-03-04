import { decideBenefitRequestSchema } from "@/features/benefits/schemas";
import { decideBenefitRequest, findBenefitRequest } from "@/features/benefits/store";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canReviewRequests(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

const BENEFIT_APPROVAL_DOMAIN = "LEAVE" as const;
const BENEFIT_REQUEST_TARGET_ENTITY_TYPE = "BENEFIT_REQUEST" as const;

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canReviewRequests(actor?.role)) {
    return fail(403, "benefits.request.decision.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { requestId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = decideBenefitRequestSchema.safeParse({
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
  if (existing.status !== "SUBMITTED") {
    return fail(409, "benefits.request.decision.invalid_state", {
      currentStatus: existing.status
    });
  }

  const updated = await decideBenefitRequest({
    requestId: parsed.data.requestId,
    decision: parsed.data.decision,
    actorId: actor?.id ?? "unknown",
    reviewNote: parsed.data.reviewNote
  });

  if (!updated) {
    return fail(409, "benefits.request.decision.invalid_state");
  }

  const approvals = getRuntimeDataAccess().approvals;
  const execution = await approvals.findExecutionByTarget({
    organizationId: existing.organizationId,
    domain: BENEFIT_APPROVAL_DOMAIN,
    targetEntityType: BENEFIT_REQUEST_TARGET_ENTITY_TYPE,
    targetEntityId: existing.id
  });

  const nextState = parsed.data.decision === "APPROVED" ? "APPROVED" : "REJECTED";
  const completedAt = new Date();

  if (execution) {
    await approvals.updateExecution(execution.id, {
      state: nextState,
      currentStageIndex: Math.max(execution.totalStages, 1),
      completedAt
    });
  } else {
    await approvals.createExecution({
      organizationId: existing.organizationId,
      domain: BENEFIT_APPROVAL_DOMAIN,
      targetEntityType: BENEFIT_REQUEST_TARGET_ENTITY_TYPE,
      targetEntityId: existing.id,
      totalStages: 1,
      currentStageIndex: 1,
      state: nextState,
      completedAt
    });
  }

  return ok({ request: updated });
}
