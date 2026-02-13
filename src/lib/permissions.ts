import type { Actor, ActorRole } from "./actor";

export function hasAnyRole(actor: Actor | null, allowed: readonly ActorRole[]) {
  if (!actor) {
    return false;
  }
  return allowed.includes(actor.role);
}

export function canMutateAttendance(actor: Actor | null, employeeId: string) {
  if (!actor) {
    return false;
  }
  if (actor.role === "admin" || actor.role === "manager") {
    return true;
  }
  if (actor.role === "employee") {
    return actor.id === employeeId;
  }
  return false;
}
