import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

function resolveOrganizationId(actorOrganizationId: string | null | undefined) {
  const normalized = actorOrganizationId?.trim();
  if (IS_PRODUCTION_RUNTIME) {
    return normalized || null;
  }
  return normalized || DEFAULT_ORG_ID;
}

export async function GET(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notification.unread_count.unauthorized");
  }

  const organizationId = resolveOrganizationId(actor.organizationId);
  if (!organizationId) {
    return fail(400, "notification.unread_count.organization_id_required");
  }

  const notifications = await getRuntimeDataAccess().inAppNotifications.list({
    organizationId,
    recipientId: actor.id,
    unreadOnly: true,
    limit: 100
  });

  return ok({ count: notifications.length });
}
