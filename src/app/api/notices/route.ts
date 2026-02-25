import { createNoticeSchema, listNoticesQuerySchema } from "@/features/notices/schemas";
import { createNotice, listNotices, summarizeNotices } from "@/features/notices/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canManageNotices(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listNoticesQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    audience: url.searchParams.get("audience") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    publishedOnly: url.searchParams.get("publishedOnly") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const isAdminActor = canManageNotices(actor?.role);
  const audience = isAdminActor ? parsed.data.audience : "employees";
  const organizationId = parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID;
  const notices = listNotices({
    organizationId,
    audience,
    status: parsed.data.status,
    publishedOnly: parsed.data.publishedOnly ?? !isAdminActor
  });

  return ok({ notices, summary: summarizeNotices(notices) });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!canManageNotices(actor?.role)) {
    return fail(403, "notice.create.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createNoticeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const created = createNotice({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
    title: parsed.data.title,
    body: parsed.data.body,
    audience: parsed.data.audience,
    publishAt: parsed.data.publishAt,
    createdByActorId: actor?.id ?? "unknown"
  });

  return ok({ notice: created }, 201);
}
