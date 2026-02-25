import { readNoticeSchema } from "@/features/notices/schemas";
import { markNoticeRead } from "@/features/notices/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

type RouteContext = {
  params: Promise<{ noticeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notice.read.unauthorized");
  }

  let payload: { organizationId?: string } = {};
  try {
    payload = (await request.json()) as { organizationId?: string };
  } catch {
    payload = {};
  }

  const { noticeId } = await context.params;
  const parsed = readNoticeSchema.safeParse({
    noticeId,
    organizationId: payload.organizationId
  });
  if (!parsed.success) {
    return fail(400, "invalid params", parsed.error.flatten());
  }

  const organizationId = parsed.data.organizationId ?? actor.organizationId ?? DEFAULT_ORG_ID;
  const receipt = markNoticeRead({
    organizationId,
    noticeId: parsed.data.noticeId,
    actorId: actor.id
  });
  if (!receipt) {
    return fail(404, "notice.not_found");
  }

  return ok({ receipt });
}

