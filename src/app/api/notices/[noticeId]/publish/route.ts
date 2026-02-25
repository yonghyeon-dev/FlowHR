import { publishNoticeSchema } from "@/features/notices/schemas";
import { publishNotice } from "@/features/notices/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canManageNotices(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

type RouteContext = {
  params: Promise<{ noticeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canManageNotices(actor?.role)) {
    return fail(403, "notice.publish.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { noticeId } = await context.params;
  const parsed = publishNoticeSchema.safeParse({ noticeId });
  if (!parsed.success) {
    return fail(400, "invalid params", parsed.error.flatten());
  }

  const updated = publishNotice(parsed.data.noticeId);
  if (!updated) {
    return fail(404, "notice.not_found");
  }

  return ok({ notice: updated });
}
