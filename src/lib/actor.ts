import type { User } from "@supabase/supabase-js";
import { validateActiveEmployee } from "@/lib/auth/validate-employee";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const actorRoles = [
  "admin",
  "manager",
  "employee",
  "payroll_operator",
  "system"
] as const;

export type ActorRole = (typeof actorRoles)[number];

export type Actor = {
  id: string;
  role: ActorRole;
  organizationId: string | null;
};

function parseRoleFromUser(user: User): ActorRole {
  // Canonical claim for FlowHR: app_metadata.role
  const canonicalRole = user.app_metadata?.role;
  if (typeof canonicalRole === "string" && actorRoles.includes(canonicalRole as ActorRole)) {
    return canonicalRole as ActorRole;
  }

  // Temporary compatibility fallback for legacy tokens.
  const legacyCandidates = [
    user.user_metadata?.role,
    user.app_metadata?.user_role,
    user.user_metadata?.user_role
  ];

  for (const candidate of legacyCandidates) {
    if (typeof candidate === "string" && actorRoles.includes(candidate as ActorRole)) {
      return candidate as ActorRole;
    }
  }

  return "employee";
}

function parseOrganizationIdFromUser(user: User): string | null {
  const canonicalOrganizationId = user.app_metadata?.organization_id;
  if (typeof canonicalOrganizationId === "string") {
    const value = canonicalOrganizationId.trim();
    if (value.length > 0) {
      return value;
    }
  }

  // Production hardening: trust only canonical app_metadata.organization_id.
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  const compatibilityCandidates = [
    user.app_metadata?.organizationId,
    user.user_metadata?.organization_id,
    user.user_metadata?.organizationId,
    user.app_metadata?.org_id,
    user.user_metadata?.org_id
  ];

  for (const candidate of compatibilityCandidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const value = candidate.trim();
    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function parseActorIdFromUser(user: User): string | null {
  // Optional canonical override: app_metadata.actor_id
  // - Useful when the domain actor id (e.g., Employee.id) is not the same as Supabase user uuid.
  // - Only trust app_metadata (service-role controlled), not user_metadata (user-editable).
  const candidates = [
    user.app_metadata?.actor_id,
    user.app_metadata?.actorId,
    user.app_metadata?.employee_id,
    user.app_metadata?.employeeId
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") {
      continue;
    }
    const value = candidate.trim();
    if (value.length > 0) {
      return value;
    }
  }

  return null;
}

function readActorFromHeaders(request: Request): Actor | null {
  const roleValue = request.headers.get("x-actor-role");
  if (!roleValue || !actorRoles.includes(roleValue as ActorRole)) {
    return null;
  }
  return {
    id: request.headers.get("x-actor-id") ?? "unknown",
    role: roleValue as ActorRole,
    organizationId: request.headers.get("x-actor-organization-id")?.trim() || null
  };
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(" ");
  if (scheme?.toLowerCase() !== "bearer" || !token) {
    return null;
  }
  return token;
}

export async function readActor(request: Request): Promise<Actor | null> {
  const token = readBearerToken(request);
  if (token) {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      const actorId = parseActorIdFromUser(data.user);
      const actor = {
        id: actorId ?? data.user.id,
        role: parseRoleFromUser(data.user),
        organizationId: parseOrganizationIdFromUser(data.user)
      };
      return (await validateActiveEmployee(actor)) ? actor : null;
    }
  }

  // Temporary non-prod fallback for local/dev tooling without JWT.
  if (process.env.NODE_ENV !== "production") {
    const actor = readActorFromHeaders(request);
    if (!actor) {
      return null;
    }
    return (await validateActiveEmployee(actor)) ? actor : null;
  }

  return null;
}
