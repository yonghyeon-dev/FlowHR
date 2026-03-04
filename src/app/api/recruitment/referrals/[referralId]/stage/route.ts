import { updateRecruitmentReferralStageSchema } from "@/features/recruitment/schemas";
import { findRecruitmentReferral, updateRecruitmentReferralStage } from "@/features/recruitment/store";
import {
  isRecruitmentReferralStageTransitionAllowed,
  listRecruitmentReferralNextStages
} from "@/features/recruitment/types";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canReviewReferrals(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

type RouteContext = {
  params: Promise<{ referralId: string }>;
};

async function updateStage(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canReviewReferrals(actor?.role)) {
    return fail(403, "recruitment.referral.stage.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { referralId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateRecruitmentReferralStageSchema.safeParse({
    referralId,
    ...(payload as Record<string, unknown>)
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }
  if (parsed.data.stage === "REJECTED" && !parsed.data.reason) {
    return fail(400, "recruitment.referral.stage.reason_required", {
      stage: parsed.data.stage
    });
  }

  const existing = await findRecruitmentReferral(parsed.data.referralId);
  if (!existing) {
    return fail(404, "recruitment.referral.not_found");
  }
  if (actor?.organizationId && existing.organizationId !== actor.organizationId) {
    return fail(404, "recruitment.referral.not_found");
  }
  if (!isRecruitmentReferralStageTransitionAllowed(existing.stage, parsed.data.stage)) {
    return fail(409, "recruitment.referral.stage.invalid_transition", {
      from: existing.stage,
      to: parsed.data.stage,
      allowed: listRecruitmentReferralNextStages(existing.stage)
    });
  }

  const updated = await updateRecruitmentReferralStage({
    referralId: parsed.data.referralId,
    stage: parsed.data.stage,
    reason: parsed.data.reason
  });

  if (!updated) {
    return fail(404, "recruitment.referral.not_found");
  }

  return ok({ referral: updated });
}

export async function PATCH(request: Request, context: RouteContext) {
  return updateStage(request, context);
}

export async function POST(request: Request, context: RouteContext) {
  return updateStage(request, context);
}
