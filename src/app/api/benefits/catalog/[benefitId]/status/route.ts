import { updateBenefitCatalogStatusSchema } from "@/features/benefits/schemas";
import { findBenefitCatalogItem, updateBenefitCatalogItemStatus } from "@/features/benefits/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function canManageCatalog(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

type RouteContext = {
  params: Promise<{ benefitId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canManageCatalog(actor?.role)) {
    return fail(403, "benefits.catalog.status.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { benefitId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateBenefitCatalogStatusSchema.safeParse({
    benefitId,
    ...(payload as Record<string, unknown>)
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const existing = await findBenefitCatalogItem(parsed.data.benefitId);
  if (!existing) {
    return fail(404, "benefits.catalog.not_found");
  }
  if (actor?.organizationId && existing.organizationId !== actor.organizationId) {
    return fail(404, "benefits.catalog.not_found");
  }
  if (existing.status === parsed.data.status) {
    return ok({ catalogItem: existing });
  }

  const updated = await updateBenefitCatalogItemStatus({
    benefitId: parsed.data.benefitId,
    status: parsed.data.status
  });
  if (!updated) {
    return fail(404, "benefits.catalog.not_found");
  }
  return ok({ catalogItem: updated });
}
