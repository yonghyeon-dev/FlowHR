import { createBenefitCatalogSchema, listBenefitCatalogQuerySchema } from "@/features/benefits/schemas";
import { createBenefitCatalogItem, listBenefitCatalog } from "@/features/benefits/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canManageCatalog(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listBenefitCatalogQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const items = listBenefitCatalog({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
    status: parsed.data.status
  });

  return ok({ catalog: items });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!canManageCatalog(actor?.role)) {
    return fail(403, "benefits.catalog.create.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createBenefitCatalogSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const created = createBenefitCatalogItem({
    organizationId: parsed.data.organizationId ?? actor?.organizationId ?? DEFAULT_ORG_ID,
    name: parsed.data.name,
    description: parsed.data.description,
    annualLimitKrw: parsed.data.annualLimitKrw,
    status: parsed.data.status
  });

  return ok({ catalogItem: created }, 201);
}
