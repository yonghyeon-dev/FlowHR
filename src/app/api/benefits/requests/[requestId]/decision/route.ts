import { decideBenefitRequestSchema } from "@/features/benefits/schemas";
import { decideBenefitRequest } from "@/features/benefits/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canReviewRequests(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

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

  const updated = decideBenefitRequest({
    requestId: parsed.data.requestId,
    decision: parsed.data.decision,
    actorId: actor?.id ?? "unknown",
    reviewNote: parsed.data.reviewNote
  });

  if (!updated) {
    return fail(404, "benefits.request.not_found");
  }

  return ok({ request: updated });
}
