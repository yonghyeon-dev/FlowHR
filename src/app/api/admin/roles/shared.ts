import type { Actor } from "@/lib/actor";
import { readActor } from "@/lib/actor";
import { fail } from "@/lib/http";

export async function requireAdminRole(request: Request, namespace: string) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, `${namespace}.unauthorized`)
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, `${namespace}.forbidden`, { reason: "admin_required" })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, `${namespace}.organization_id_required`)
    };
  }

  return {
    ok: true as const,
    actor,
    organizationId
  };
}

export function toAdminActor(actor: Actor, organizationId: string): Actor {
  return {
    id: actor.id,
    role: actor.role,
    organizationId
  };
}
