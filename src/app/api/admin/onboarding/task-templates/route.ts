import { onboardingDefaultTaskTitleKeys } from "@/features/onboarding/default-task-keys";
import {
  ensureDefaultOnboardingTaskTemplates,
  seedMissingDefaultOnboardingTaskTemplates
} from "@/features/onboarding/tasks";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/messages";

const defaultTaskTitleKeys = onboardingDefaultTaskTitleKeys;
const defaultTaskTitles = defaultTaskTitleKeys.map((key) => translate(DEFAULT_LOCALE, key));

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return { ok: false as const, response: fail(401, "admin.onboarding.templates.unauthorized") };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.onboarding.templates.forbidden", { reason: "admin_required" })
    };
  }
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.onboarding.templates.organization_id_required")
    };
  }
  return { ok: true as const, organizationId };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const templates = await ensureDefaultOnboardingTaskTemplates({
    dataAccess: getRuntimeDataAccess(),
    organizationId: auth.organizationId,
    defaultTitles: defaultTaskTitles
  });
  return ok({ templates });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const templates = await seedMissingDefaultOnboardingTaskTemplates({
    dataAccess: getRuntimeDataAccess(),
    organizationId: auth.organizationId,
    defaultTitles: defaultTaskTitles
  });
  return ok({ templates });
}
