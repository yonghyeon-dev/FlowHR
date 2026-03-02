import { updateRecruitmentOpeningStatusSchema } from "@/features/recruitment/schemas";
import {
  findRecruitmentOpening,
  listRecruitmentReferrals,
  updateRecruitmentOpeningStatus
} from "@/features/recruitment/store";
import { isRecruitmentReferralTerminalStage } from "@/features/recruitment/types";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canManageOpenings(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

type RouteContext = {
  params: Promise<{ openingId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canManageOpenings(actor?.role)) {
    return fail(403, "recruitment.opening.status.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { openingId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateRecruitmentOpeningStatusSchema.safeParse({
    openingId,
    ...(payload as Record<string, unknown>)
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const opening = await findRecruitmentOpening(parsed.data.openingId);
  if (!opening || (actor?.organizationId && opening.organizationId !== actor.organizationId)) {
    return fail(404, "recruitment.opening.not_found");
  }

  if (parsed.data.status === "CLOSED" && !parsed.data.force) {
    const referrals = await listRecruitmentReferrals({
      organizationId: opening.organizationId
    });
    const activeReferrals = referrals.filter(
      (item) => item.openingId === opening.id && !isRecruitmentReferralTerminalStage(item.stage)
    );
    if (activeReferrals.length > 0) {
      return fail(409, "recruitment.opening.status.pending_referrals", {
        openingId: opening.id,
        activeReferralCount: activeReferrals.length
      });
    }
  }

  const updated = await updateRecruitmentOpeningStatus({
    openingId: parsed.data.openingId,
    status: parsed.data.status,
    organizationId: actor?.organizationId ?? undefined
  });

  if (!updated) {
    return fail(404, "recruitment.opening.not_found");
  }

  return ok({ opening: updated });
}
