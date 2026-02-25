import { readAllNoticesSchema } from "@/features/notices/schemas";
import { markAllNoticesRead } from "@/features/notices/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canManageNotices(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notice.read_all.unauthorized");
  }

  let payload: { organizationId?: string } = {};
  try {
    payload = (await request.json()) as { organizationId?: string };
  } catch {
    payload = {};
  }

  const parsed = readAllNoticesSchema.safeParse({
    organizationId: payload.organizationId
  });
  if (!parsed.success) {
    return fail(400, "invalid params", parsed.error.flatten());
  }

  const organizationId = parsed.data.organizationId ?? actor.organizationId ?? DEFAULT_ORG_ID;
  const audience = canManageNotices(actor.role) ? "all" : "employees";
  const receipts = markAllNoticesRead({
    organizationId,
    actorId: actor.id,
    audience
  });

  return ok({
    count: receipts.length,
    readNoticeIds: receipts.map((receipt) => receipt.noticeId),
    receipts
  });
}
