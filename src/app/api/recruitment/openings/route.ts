import {
  createRecruitmentOpeningSchema,
  listRecruitmentOpeningsQuerySchema
} from "@/features/recruitment/schemas";
import { createRecruitmentOpening, listRecruitmentOpenings } from "@/features/recruitment/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canManageOpenings(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listRecruitmentOpeningsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const openings = listRecruitmentOpenings({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
    status: parsed.data.status
  });

  return ok({ openings });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!canManageOpenings(actor?.role)) {
    return fail(403, "recruitment.opening.create.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createRecruitmentOpeningSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const created = createRecruitmentOpening({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
    title: parsed.data.title,
    department: parsed.data.department,
    employmentType: parsed.data.employmentType,
    status: parsed.data.status
  });

  return ok({ opening: created }, 201);
}
