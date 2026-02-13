import { User } from "@supabase/supabase-js";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
};

function parseRoleFromUser(user: User): ActorRole {
  const candidates = [
    user.app_metadata?.role,
    user.user_metadata?.role,
    user.app_metadata?.user_role,
    user.user_metadata?.user_role
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && actorRoles.includes(candidate as ActorRole)) {
      return candidate as ActorRole;
    }
  }

  return "employee";
}

function readActorFromHeaders(request: Request): Actor | null {
  const roleValue = request.headers.get("x-actor-role");
  if (!roleValue || !actorRoles.includes(roleValue as ActorRole)) {
    return null;
  }
  return {
    id: request.headers.get("x-actor-id") ?? "unknown",
    role: roleValue as ActorRole
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
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      return {
        id: data.user.id,
        role: parseRoleFromUser(data.user)
      };
    }
  }

  // Temporary non-prod fallback for local/dev tooling without JWT.
  if (process.env.NODE_ENV !== "production") {
    return readActorFromHeaders(request);
  }

  return null;
}
