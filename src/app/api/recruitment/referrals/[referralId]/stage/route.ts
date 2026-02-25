import { updateRecruitmentReferralStageSchema } from "@/features/recruitment/schemas";
import { updateRecruitmentReferralStage } from "@/features/recruitment/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canReviewReferrals(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

type RouteContext = {
  params: Promise<{ referralId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
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

  const updated = updateRecruitmentReferralStage({
    referralId: parsed.data.referralId,
    stage: parsed.data.stage
  });

  if (!updated) {
    return fail(404, "recruitment.referral.not_found");
  }

  return ok({ referral: updated });
}
