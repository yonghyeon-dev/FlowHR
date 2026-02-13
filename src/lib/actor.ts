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

export function readActor(request: Request): Actor | null {
  const roleValue = request.headers.get("x-actor-role");
  if (!roleValue || !actorRoles.includes(roleValue as ActorRole)) {
    return null;
  }
  return {
    id: request.headers.get("x-actor-id") ?? "unknown",
    role: roleValue as ActorRole
  };
}
