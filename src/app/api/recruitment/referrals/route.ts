import {
  createRecruitmentReferralSchema,
  listRecruitmentReferralsQuerySchema
} from "@/features/recruitment/schemas";
import {
  createRecruitmentReferral,
  findRecruitmentOpening,
  listRecruitmentReferrals,
  summarizeRecruitmentReferrals
} from "@/features/recruitment/store";
import { isRecruitmentReferralTerminalStage } from "@/features/recruitment/types";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canReviewReferrals(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listRecruitmentReferralsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    referrerEmployeeId: url.searchParams.get("referrerEmployeeId") ?? undefined,
    stage: url.searchParams.get("stage") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const actorOrganizationId = normalizeOrganizationId(actor?.organizationId);
  const requestedOrganizationId = normalizeOrganizationId(parsed.data.organizationId);
  if (actorOrganizationId && requestedOrganizationId && requestedOrganizationId !== actorOrganizationId) {
    return fail(403, "recruitment.referral.list.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  const organizationId = actorOrganizationId ?? requestedOrganizationId ?? DEFAULT_ORG_ID;
  const isReviewer = canReviewReferrals(actor?.role);
  const referrals = await listRecruitmentReferrals({
    organizationId,
    referrerEmployeeId: isReviewer ? parsed.data.referrerEmployeeId : parsed.data.referrerEmployeeId ?? actor?.id,
    stage: parsed.data.stage
  });

  return ok({ referrals, summary: summarizeRecruitmentReferrals(referrals) });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "recruitment.referral.create.unauthorized");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createRecruitmentReferralSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }
  const actorOrganizationId = normalizeOrganizationId(actor.organizationId);
  const requestedOrganizationId = normalizeOrganizationId(parsed.data.organizationId);
  if (actorOrganizationId && requestedOrganizationId && requestedOrganizationId !== actorOrganizationId) {
    return fail(403, "recruitment.referral.create.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }

  const organizationId = actorOrganizationId ?? requestedOrganizationId ?? DEFAULT_ORG_ID;
  const opening = await findRecruitmentOpening(parsed.data.openingId);

  if (!opening || opening.organizationId !== organizationId) {
    return fail(404, "recruitment.opening.not_found", {
      openingId: parsed.data.openingId
    });
  }
  if (opening.status !== "OPEN") {
    return fail(409, "recruitment.referral.create.opening_closed", {
      openingId: opening.id,
      openingStatus: opening.status
    });
  }
  const normalizedCandidateEmail = parsed.data.candidateEmail.trim().toLowerCase();
  const existingReferrals = await listRecruitmentReferrals({
    organizationId,
    stage: "all"
  });
  const duplicateActiveReferral = existingReferrals.find(
    (referral) =>
      referral.openingId === opening.id &&
      referral.candidateEmail.trim().toLowerCase() === normalizedCandidateEmail &&
      !isRecruitmentReferralTerminalStage(referral.stage)
  );
  if (duplicateActiveReferral) {
    return fail(409, "recruitment.referral.create.duplicate_active", {
      openingId: opening.id,
      referralId: duplicateActiveReferral.id,
      stage: duplicateActiveReferral.stage
    });
  }

  const referrerEmployeeId = canReviewReferrals(actor.role) ? parsed.data.referrerEmployeeId : actor.id;
  const created = await createRecruitmentReferral({
    organizationId,
    openingId: parsed.data.openingId,
    candidateName: parsed.data.candidateName,
    candidateEmail: parsed.data.candidateEmail,
    referrerEmployeeId,
    note: parsed.data.note
  });

  return ok({ referral: created }, 201);
}
