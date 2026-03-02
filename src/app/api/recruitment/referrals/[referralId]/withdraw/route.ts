import { withdrawRecruitmentReferralSchema } from "@/features/recruitment/schemas";
import { findRecruitmentReferral, withdrawRecruitmentReferral } from "@/features/recruitment/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ referralId: string }>;
};

function canSubmitReferral(role: string | null | undefined) {
  return role === "employee";
}

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "recruitment.referral.withdraw.unauthorized");
  }
  if (!canSubmitReferral(actor.role)) {
    return fail(403, "recruitment.referral.withdraw.forbidden", {
      reason: "employee_required"
    });
  }

  const { referralId } = await context.params;
  const parsed = withdrawRecruitmentReferralSchema.safeParse({
    referralId
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const existing = await findRecruitmentReferral(parsed.data.referralId);
  if (!existing) {
    return fail(404, "recruitment.referral.not_found");
  }
  if (existing.referrerEmployeeId !== actor.id) {
    return fail(403, "recruitment.referral.withdraw.forbidden", {
      reason: "owner_required"
    });
  }
  if (!(existing.stage === "SUBMITTED" || existing.stage === "SCREENING")) {
    return fail(409, "recruitment.referral.withdraw.invalid_state", {
      currentStage: existing.stage
    });
  }

  const updated = await withdrawRecruitmentReferral({
    referralId: parsed.data.referralId,
    actorId: actor.id
  });
  if (!updated) {
    return fail(409, "recruitment.referral.withdraw.invalid_state");
  }

  return ok({ referral: updated });
}
