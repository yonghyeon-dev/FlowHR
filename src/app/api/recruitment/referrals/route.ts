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
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canReviewReferrals(role: string | null | undefined) {
  return role === "admin" || role === "manager";
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
  const isReviewer = canReviewReferrals(actor?.role);
  const referrals = await listRecruitmentReferrals({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
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

  if (!(await findRecruitmentOpening(parsed.data.openingId))) {
    return fail(404, "recruitment.opening.not_found", {
      openingId: parsed.data.openingId
    });
  }

  const referrerEmployeeId = canReviewReferrals(actor.role) ? parsed.data.referrerEmployeeId : actor.id;
  const created = await createRecruitmentReferral({
    organizationId: parsed.data.organizationId ?? actor.organizationId ?? DEFAULT_ORG_ID,
    openingId: parsed.data.openingId,
    candidateName: parsed.data.candidateName,
    candidateEmail: parsed.data.candidateEmail,
    referrerEmployeeId,
    note: parsed.data.note
  });

  return ok({ referral: created }, 201);
}
