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

function parseUnreadOnly(searchParams: URLSearchParams) {
  return searchParams.get("unreadOnly")?.trim().toLowerCase() === "true";
}

export async function GET(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notification.list.unauthorized");
  }

  const organizationId = resolveOrganizationId(actor.organizationId);
  if (!organizationId) {
    return fail(400, "notification.list.organization_id_required");
  }

  const unreadOnly = parseUnreadOnly(new URL(request.url).searchParams);
  const notifications = await getRuntimeDataAccess().inAppNotifications.list({
    organizationId,
    recipientId: actor.id,
    unreadOnly,
    limit: 50
  });

  return ok({ notifications });
}
