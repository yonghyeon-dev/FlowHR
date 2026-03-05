import {
  organizationHasAnyWorkSchedules,
  seedDefaultWorkSchedulesForOrganization
} from "@/features/scheduling/default-work-schedule-seed";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "scheduling.seed_defaults.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "scheduling.seed_defaults.forbidden", {
        reason: "admin_required"
      })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "scheduling.seed_defaults.organization_id_required")
    };
  }

  return {
    ok: true as const,
    organizationId
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const dataAccess = getRuntimeDataAccess();
  const hasAnySchedules = await organizationHasAnyWorkSchedules(dataAccess, auth.organizationId);
  return ok({
    organizationId: auth.organizationId,
    hasAnySchedules,
    showSeedDefaultsAction: !hasAnySchedules
  });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const dataAccess = getRuntimeDataAccess();
  const result = await seedDefaultWorkSchedulesForOrganization({
    dataAccess,
    organizationId: auth.organizationId,
    onlyIfNoSchedules: true
  });
  return ok(result);
}
