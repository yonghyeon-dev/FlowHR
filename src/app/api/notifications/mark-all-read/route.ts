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

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notification.mark_all_read.unauthorized");
  }

  const organizationId = resolveOrganizationId(actor.organizationId);
  if (!organizationId) {
    return fail(400, "notification.mark_all_read.organization_id_required");
  }

  const readAt = new Date().toISOString();
  const count = await getRuntimeDataAccess().inAppNotifications.markAllRead({
    organizationId,
    recipientId: actor.id,
    readAt
  });

  return ok({ count, readAt });
}
