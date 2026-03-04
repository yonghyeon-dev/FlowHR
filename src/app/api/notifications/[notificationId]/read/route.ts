import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveOrganizationId(actorOrganizationId: string | null | undefined) {
  const normalizedOrganizationId = normalizeOrganizationId(actorOrganizationId);
  if (IS_PRODUCTION_RUNTIME) {
    return normalizedOrganizationId;
  }
  return normalizedOrganizationId ?? DEFAULT_ORG_ID;
}

type RouteContext = {
  params: Promise<{ notificationId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notification.read.unauthorized");
  }

  const organizationId = resolveOrganizationId(actor.organizationId);
  if (!organizationId) {
    return fail(400, "notification.read.organization_id_required");
  }

  const { notificationId } = await context.params;
  const runtimeDataAccess = getRuntimeDataAccess();
  const notification = await runtimeDataAccess.inAppNotifications.findById(notificationId);
  if (!notification) {
    return fail(404, "notification.not_found");
  }

  if (notification.organizationId !== organizationId || notification.recipientId !== actor.id) {
    return fail(403, "notification.read.forbidden");
  }

  const updated = notification.isRead
    ? notification
    : await runtimeDataAccess.inAppNotifications.update(notification.id, {
        isRead: true,
        readAt: new Date().toISOString()
      });

  return ok({ notification: updated });
}
