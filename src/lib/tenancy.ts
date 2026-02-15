import type { Actor } from "@/lib/actor";
import { ServiceError } from "@/features/shared/service-error";

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export function isTenancyEnabled() {
  return isTruthyFlag(process.env.FLOWHR_TENANCY_V1 ?? process.env.TENANCY_V1);
}

export function isPlatformActor(actor: Actor) {
  return actor.role === "system";
}

// Returns the tenant(organization) scope for the request.
// - When tenancy is disabled: null (no scoping)
// - When actor is "system": null (platform bypass)
// - When tenancy is enabled and actor is non-system: organizationId (or throws)
export function requireTenantScope(actor: Actor | null): string | null {
  if (!isTenancyEnabled()) {
    return null;
  }
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (isPlatformActor(actor)) {
    return null;
  }
  if (!actor.organizationId) {
    throw new ServiceError(401, "missing tenant context");
  }
  return actor.organizationId;
}

